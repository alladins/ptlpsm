<template>
  <div class="top-chart-panel">
    <div v-if="toolbar.length > 1" class="tcp-toolbar">
      <button
        v-for="t in toolbar"
        :key="t"
        type="button"
        class="tcp-btn"
        :class="{ active: t === currentType }"
        @click="currentType = t"
      >
        {{ CHART_TYPE_LABELS[t] || t }}
      </button>
    </div>
    <div class="tcp-chart">
      <EChartsChart :option="chartOption" :height="height" :on-select="onCrossFilter" />
      <div v-if="watermarkRequired" class="tcp-watermark">
        Unlicensed @topgrid/grid
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * topgrid Pro 차트 공용 래퍼 (통계 그래프 공용, EChart.vue 대체).
 * - data: ChartMatrix({ categories, series[{name, values, color?}] }) 만 넘기면 렌더.
 * - matrixToEChartsOption(카탈로그 엔진)으로 option 생성 후 범례 위치(legend)·팔레트(colors)만 후처리.
 *   EnterpriseChartPanel 대신 EChartsChart 직접 사용 — 내장 툴바(영문 raw, 무스타일)·범례 고정 한계 회피.
 * - 워터마크는 패널과 동일하게 checkLicense/subscribeLicense로 게이팅 (라이선스 유효 시 미표시).
 * - 라이선스는 plugins/topgrid-license.client.ts 에서 앱 진입 시 1회 등록.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { EChartsChart, matrixToEChartsOption, checkLicense } from '@topgrid/grid-pro-chart-enterprise-vue'
import { subscribeLicense } from '@topgrid/grid-license-core'
import type { ChartMatrix, EnterpriseChartType } from '@topgrid/grid-pro-chart-enterprise-vue'

interface Props {
  /** 차트 데이터 (라벨링된 2차원 매트릭스) */
  data: ChartMatrix
  /** 초기 차트 타입 (기본 bar) */
  initialType?: EnterpriseChartType
  /** 툴바에 노출할 타입 목록 (1개 이하면 툴바 숨김) */
  toolbar?: EnterpriseChartType[]
  /** 차트 내부 범례 위치: top(기본)/right(세로·우측)/none(숨김 — 템플릿에 별도 범례가 있을 때) */
  legend?: 'top' | 'right' | 'none'
  /** 카테고리 팔레트 (파이/도넛 조각 색 — 템플릿 범례 색과 일치시킬 때) */
  colors?: string[]
  /** 차트 높이: px 숫자 또는 '100%'(부모 높이 채움 — 고정 높이 래퍼 안에서 권장, 기본 300) */
  height?: number | string
  /** 크로스필터 콜백 (차트 요소 클릭) */
  onCrossFilter?: (sel: { name: string, value: unknown }) => void
}

const props = withDefaults(defineProps<Props>(), {
  initialType: 'bar',
  toolbar: () => [],
  legend: 'top',
  colors: undefined,
  height: 300,
  onCrossFilter: undefined
})

const currentType = ref<EnterpriseChartType>(props.initialType)
watch(() => props.initialType, (t) => { currentType.value = t })

// 매트릭스 → ECharts option (범례/팔레트 후처리 포함)
const chartOption = computed(() => {
  const opt: any = matrixToEChartsOption(props.data, { type: currentType.value })
  // 툴팁을 body 레벨로 렌더 — 작은 카드/overflow 영역에서 잘리지 않도록
  opt.tooltip = { ...(opt.tooltip ?? {}), appendToBody: true }
  // 카르테시안(축 있는) 차트: 축 라벨 잘림 방지(containLabel) + 상하좌우 여백 최소화
  if (opt.xAxis) {
    opt.grid = {
      left: 8,
      right: props.legend === 'right' ? 120 : 16,
      top: props.legend === 'none' ? 16 : 40,
      bottom: 8,
      containLabel: true
    }
  }
  // 레이더: 상단 범례가 상단 축 라벨과 겹침 → 범례를 우측 세로로 자동 이동 + 반경 소폭 축소
  if (currentType.value === 'radar' && opt.radar) {
    if (props.legend !== 'none') {
      opt.legend = { ...opt.legend, orient: 'vertical', right: 0, top: 'middle', itemWidth: 12, itemHeight: 12 }
    }
    opt.radar = { ...opt.radar, radius: '62%' }
  }
  if (props.colors && props.colors.length > 0) {
    opt.color = props.colors
  }
  if (props.legend === 'none') {
    opt.legend = { show: false }
  } else if (props.legend === 'right') {
    opt.legend = { ...opt.legend, orient: 'vertical', right: 0, top: 'middle', itemWidth: 12, itemHeight: 12 }
    const seriesArr = Array.isArray(opt.series) ? opt.series : [opt.series]
    for (const s of seriesArr) {
      // 파이/도넛은 우측 범례 공간 확보를 위해 중심을 좌측으로 이동
      if (s && s.type === 'pie') {
        s.center = ['38%', '50%']
      }
    }
  }
  return opt
})

// 라이선스 워터마크 게이팅 (EnterpriseChartPanel과 동일 동작 재현)
const watermarkRequired = ref(checkLicense().watermarkRequired)
let unsubscribe: (() => void) | undefined
onMounted(() => {
  unsubscribe = subscribeLicense(() => {
    watermarkRequired.value = checkLicense().watermarkRequired
  })
})
onBeforeUnmount(() => { unsubscribe?.() })

/** 17종 카탈로그 타입 한국어 라벨 */
const CHART_TYPE_LABELS: Record<string, string> = {
  line: '선형',
  bar: '막대',
  area: '영역',
  'stacked-bar': '누적막대',
  'stacked-area': '누적영역',
  '100-stacked-bar': '100%누적',
  scatter: '산점도',
  bubble: '버블',
  pie: '파이',
  doughnut: '도넛',
  funnel: '퍼널',
  treemap: '트리맵',
  radar: '레이더',
  heatmap: '히트맵',
  candlestick: '캔들',
  boxplot: '박스플롯',
  sankey: '산키'
}
</script>

<style scoped>
.top-chart-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tcp-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.tcp-btn {
  padding: 2px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.tcp-btn:hover {
  border-color: #93c5fd;
  color: #3b82f6;
}

.tcp-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.tcp-chart {
  position: relative;
  flex: 1;
  min-height: 0;
}

.tcp-watermark {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.4;
  font-size: 12px;
  color: #6b7280;
}
</style>
