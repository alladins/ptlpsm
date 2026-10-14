<template>
  <div class="region-map">
    <div ref="el" class="map-canvas" :style="{ height: typeof height === 'number' ? `${height}px` : height }" />
    <p v-if="loadError" class="map-error">
      <i class="fas fa-exclamation-triangle" /> 지도를 불러오지 못했습니다 — 오른쪽 표로 확인하세요.
    </p>
    <p class="map-source">
      경계: 통계청 SGIS(공공누리 제1유형) 행정동 경계, vuski/admdongkor 가공(CC BY 4.0)
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * 지역 지도 (색 농도 = 금액) — echarts map 시리즈
 *
 * - area 가 없으면 전국: public/geo/sido.json (sido_cd: 시도, 경기는 북부 41N·남부 41S 로 나눔)
 * - area 가 있으면 그 지역의 시군구: public/geo/sigungu/{area}.json (일반구는 시로 묶음 — 우리 시군구코드와 같다)
 *
 * 경계 원자료: 통계청 SGIS 행정동 경계(2026-04-01 판, vuski/admdongkor 가공). 인천 2026-07 개편·전남광주 통합 이전 경계라
 * 우리 데이터의 옛 시군구코드와 그대로 맞는다. 출처 표시는 이용 조건이라 지우지 말 것.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
// eslint-disable-next-line import/named -- echarts 는 export * 재수출이라 import 플러그인이 못 찾는다 (빌드·실행은 정상)
import { getMap, init, registerMap } from 'echarts'
import type { ECharts } from 'echarts'
import { formatEok, sidoName } from '~/types/procurement-status'

interface Props {
  /** null = 전국, 시도(권역) 코드 = 그 안의 시군구 */
  area?: string | null
  /** 코드 → 금액 (전국이면 시도·권역 코드, 시군구면 시군구코드) */
  values: Record<string, number>
  /** 선택한 칸 (테두리 강조) */
  selected?: string | null
  /** 툴팁 머리말 (예: «시장 전체», «주식회사 리드파워») */
  label?: string
  height?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  area: null,
  selected: null,
  label: '금액',
  height: 460
})

const emit = defineEmits<{ select: [code: string | null, name: string] }>()

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (s: string) => String(s ?? '').replace(/[&<>"']/g, c => HTML_ESCAPES[c])

/** 시군구코드 → 이름 (경계 파일의 nm) — 지역마다 한 번 읽어 둔다 */
const sigunguNames = new Map<string, string>()

const el = ref<HTMLDivElement | null>(null)
const loadError = ref(false)
let chart: ECharts | null = null
let observer: ResizeObserver | null = null
/** 늦게 온 경계 파일이 새 지역을 덮지 않게 */
let renderSeq = 0

/** 경계 파일 판 — 파일을 바꾸면 올릴 것 (같은 주소면 브라우저가 옛 파일을 캐시에서 쓴다: 10-14 옛 시도 지도가 남아 경기가 하나로 보였음) */
const GEO_VERSION = '20261014'

const mapName = (area: string | null) => (area ? `kr-sgg-${area}` : 'kr-area')

async function ensureGeo (area: string | null) {
  const name = mapName(area)
  if (getMap(name)) { return }
  const base = (useRuntimeConfig().app.baseURL || '/').replace(/\/$/, '')
  const res = await fetch(area ? `${base}/geo/sigungu/${encodeURIComponent(area)}.json?v=${GEO_VERSION}` : `${base}/geo/sido.json?v=${GEO_VERSION}`)
  if (!res.ok) { throw new Error(`geo ${res.status}`) }
  const geo = await res.json()
  if (area) {
    for (const f of geo.features || []) {
      if (f.properties?.sgg) { sigunguNames.set(f.properties.sgg, f.properties.nm || f.properties.sgg) }
    }
  }
  registerMap(name, geo)
}

const nameOf = (code: string) => (props.area ? (sigunguNames.get(code) || code) : sidoName(code))

async function render () {
  if (!chart) { return }
  const seq = ++renderSeq
  const area = props.area
  try {
    await ensureGeo(area)
    loadError.value = false
  } catch (e) {
    console.error('지도 경계 로드 실패:', e)
    loadError.value = true
    return
  }
  if (seq !== renderSeq || !chart) { return }
  const entries = Object.entries(props.values)
  const max = Math.max(1, ...entries.map(([, v]) => v || 0))
  chart.setOption({
    tooltip: {
      trigger: 'item',
      // 툴팁은 HTML 로 그려진다 — 업체명(label)은 나라장터에서 온 값이라 반드시 이스케이프
      formatter: (p: { name: string, value: number }) =>
        `<b>${escapeHtml(nameOf(p.name))}</b><br/>${escapeHtml(props.label)}: ${escapeHtml(isNaN(p.value) ? '0' : formatEok(p.value, 2))}`
    },
    visualMap: {
      min: 0,
      max,
      left: 8,
      bottom: 8,
      itemHeight: 90,
      text: [formatEok(max, area ? 1 : 0), '0'],
      calculable: false,
      inRange: { color: ['#eff6ff', '#93c5fd', '#2563eb', '#1e3a8a'] },
      textStyle: { fontSize: 11, color: '#475569' }
    },
    series: [{
      type: 'map',
      map: mapName(area),
      nameProperty: area ? 'sgg' : 'sido_cd',
      roam: false,
      selectedMode: false,
      layoutCenter: ['50%', '50%'],
      layoutSize: '100%',
      label: {
        show: true,
        fontSize: area ? 9 : 10,
        color: '#1e293b',
        formatter: (p: { name: string }) => nameOf(p.name)
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

onMounted(() => {
  if (!el.value) { return }
  chart = init(el.value)
  chart.on('click', (p) => {
    const code = (p as { name?: string }).name || null
    emit('select', code === props.selected ? null : code, code ? nameOf(code) : '')
  })
  render()
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value)
})

watch(() => [props.area, props.values, props.selected, props.label], render, { deep: true })

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.region-map {
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

.map-source {
  margin: 0.25rem 0 0;
  font-size: 0.6875rem;
  color: #94a3b8;
  text-align: right;
}
</style>
