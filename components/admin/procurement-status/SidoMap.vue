<template>
  <div class="sido-map">
    <div ref="el" class="map-canvas" :style="{ height: typeof height === 'number' ? `${height}px` : height }" />
    <p v-if="loadError" class="map-error">
      <i class="fas fa-exclamation-triangle" /> 지도를 불러오지 못했습니다 — 아래 표로 확인하세요.
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * 시도 지도 (색 농도 = 금액) — echarts map 시리즈 + public/geo/sido.json
 *
 * 경계: 통계청(KOSTAT) 2013 시도 경계 간략본(southkorea-maps, «free to share or remix»)을
 * 우리 시도코드(법정동, 강원 51·전북 52)로 바꿔 넣었다. 2023 군위군 대구 편입은 경계에 반영돼 있지 않다(색은 데이터 기준).
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
// eslint-disable-next-line import/named -- echarts 는 export * 재수출이라 import 플러그인이 못 찾는다 (빌드·실행은 정상)
import { getMap, init, registerMap } from 'echarts'
import type { ECharts } from 'echarts'
import { formatEok, sidoName } from '~/types/procurement-status'

interface Props {
  /** 시도코드 → 금액 */
  values: Record<string, number>
  /** 선택한 시도 (테두리 강조) */
  selected?: string | null
  /** 툴팁 머리말 (예: «시장 전체», «주식회사 리드파워») */
  label?: string
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  selected: null,
  label: '금액',
  height: 460
})

const emit = defineEmits<{ select: [sidoCd: string | null] }>()

const MAP_NAME = 'kr-sido'

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (s: string) => String(s ?? '').replace(/[&<>"']/g, c => HTML_ESCAPES[c])
let geoLoaded = false

const el = ref<HTMLDivElement | null>(null)
const loadError = ref(false)
let chart: ECharts | null = null
let observer: ResizeObserver | null = null

async function ensureGeo () {
  if (geoLoaded || getMap(MAP_NAME)) {
    geoLoaded = true
    return
  }
  const base = useRuntimeConfig().app.baseURL || '/'
  const res = await fetch(`${base.replace(/\/$/, '')}/geo/sido.json`)
  if (!res.ok) { throw new Error(`geo ${res.status}`) }
  registerMap(MAP_NAME, await res.json())
  geoLoaded = true
}

function render () {
  if (!chart) { return }
  const entries = Object.entries(props.values)
  const max = Math.max(1, ...entries.map(([, v]) => v || 0))
  chart.setOption({
    tooltip: {
      trigger: 'item',
      // 툴팁은 HTML 로 그려진다 — 업체명(label)은 나라장터에서 온 값이라 반드시 이스케이프
      formatter: (p: { name: string, value: number }) =>
        `<b>${escapeHtml(sidoName(p.name))}</b><br/>${escapeHtml(props.label)}: ${escapeHtml(isNaN(p.value) ? '0' : formatEok(p.value, 2))}`
    },
    visualMap: {
      min: 0,
      max,
      left: 8,
      bottom: 8,
      itemHeight: 90,
      text: [formatEok(max, 0), '0'],
      calculable: false,
      inRange: { color: ['#eff6ff', '#93c5fd', '#2563eb', '#1e3a8a'] },
      textStyle: { fontSize: 11, color: '#475569' }
    },
    series: [{
      type: 'map',
      map: MAP_NAME,
      nameProperty: 'sido_cd',
      roam: false,
      selectedMode: false,
      layoutCenter: ['50%', '50%'],
      layoutSize: '100%',
      label: {
        show: true,
        fontSize: 10,
        color: '#1e293b',
        formatter: (p: { name: string }) => sidoName(p.name)
      },
      itemStyle: { borderColor: '#94a3b8', borderWidth: 0.6, areaColor: '#f8fafc' },
      emphasis: {
        label: { show: true, fontWeight: 'bold' },
        itemStyle: { areaColor: '#fde68a' }
      },
      data: entries.map(([name, value]) => ({
        name,
        value: value || 0,
        itemStyle: name === props.selected ? { borderColor: '#f59e0b', borderWidth: 2.5 } : undefined
      }))
    }]
  }, true)
}

onMounted(async () => {
  try {
    await ensureGeo()
  } catch (e) {
    console.error('시도 지도 로드 실패:', e)
    loadError.value = true
    return
  }
  if (!el.value) { return }
  chart = init(el.value)
  chart.on('click', (p) => {
    const code = (p as { name?: string }).name || null
    emit('select', code === props.selected ? null : code)
  })
  render()
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value)
})

watch(() => [props.values, props.selected, props.label], render, { deep: true })

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.sido-map {
  position: relative;
  width: 100%;
}

.map-canvas {
  width: 100%;
}

.map-error {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: #b45309;
}
</style>
