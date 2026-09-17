<template>
  <client-only>
    <div class="admin-dashboard">
      <!-- 페이지 헤더 - PageHeader 컴포넌트 사용 -->
      <PageHeader
        title="대시보드"
        description="PTPLPSM 출하관리 시스템"
      />

      <!-- 빠른 액션 (가로 한 줄) -->
      <div class="quick-actions-bar">
        <button class="action-btn-inline" @click="goToSales">
          <i class="fas fa-plus" />
          <span>영업 등록</span>
        </button>
        <button class="action-btn-inline" @click="goToOrder">
          <i class="fas fa-shopping-cart" />
          <span>발주 등록</span>
        </button>
        <button class="action-btn-inline" @click="goToShipping">
          <i class="fas fa-truck" />
          <span>출하 등록</span>
        </button>
        <button class="action-btn-inline" @click="goToTransport">
          <i class="fas fa-route" />
          <span>운송장 관리</span>
        </button>
      </div>

      <!-- 기간 필터 -->
      <div class="dashboard-filter">
        <div class="filter-group">
          <label>조회기간:</label>
          <select v-model="periodType" class="filter-select" @change="onPeriodChange">
            <option value="period">
              정산기간별
            </option>
            <option value="year">
              연도별
            </option>
            <option value="half">
              반기별
            </option>
            <option value="quarter">
              분기별
            </option>
            <option value="custom">
              직접선택
            </option>
          </select>
          <select v-if="periodType === 'period'" v-model="selectedPeriodId" class="filter-select" @change="onPeriodChange">
            <option v-for="p in periodOptions" :key="p.periodId" :value="p.periodId">
              {{ p.periodName }}
            </option>
          </select>
          <select v-if="periodType !== 'custom' && periodType !== 'period'" v-model="selectedYear" class="filter-select" @change="onPeriodChange">
            <option v-for="y in yearOptions" :key="y" :value="y">
              {{ y }}년
            </option>
          </select>
          <select v-if="periodType === 'half'" v-model="selectedHalf" class="filter-select" @change="onPeriodChange">
            <option value="1">
              상반기
            </option>
            <option value="2">
              하반기
            </option>
          </select>
          <select v-if="periodType === 'quarter'" v-model="selectedQuarter" class="filter-select" @change="onPeriodChange">
            <option value="1">
              1분기
            </option>
            <option value="2">
              2분기
            </option>
            <option value="3">
              3분기
            </option>
            <option value="4">
              4분기
            </option>
          </select>
          <template v-if="periodType === 'custom'">
            <SearchDateRange
              v-model:start-date="customStartDate"
              v-model:end-date="customEndDate"
              :show-presets="false"
              :max-today="false"
              @change="onPeriodChange"
            />
          </template>
          <span class="filter-period-label">{{ periodLabel }}</span>
        </div>
      </div>

      <!-- 요약 카드 - 5개 한 행 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-order">
            <i class="fas fa-file-alt" />
          </div>
          <div class="stat-content">
            <h3>총 납품요구 건수</h3>
            <p class="stat-number">
              {{ formatNumber(statistics.summary.totalOrderCount) }}건
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-amount">
            <i class="fas fa-won-sign" />
          </div>
          <div class="stat-content">
            <h3>총 납품요구금액</h3>
            <p class="stat-number">
              {{ formatCurrency(statistics.summary.totalOrderAmount) }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-sales">
            <i class="fas fa-chart-line" />
          </div>
          <div class="stat-content">
            <h3>총 매출금액</h3>
            <p class="stat-number">
              {{ formatCurrency(statistics.summary.totalShipmentSalesAmount) }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-rate">
            <i class="fas fa-chart-pie" />
          </div>
          <div class="stat-content">
            <h3>납품완료율</h3>
            <p class="stat-number">
              {{ statistics.summary.completionRate.toFixed(1) }}%
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-status">
            <i class="fas fa-tasks" />
          </div>
          <div class="stat-content">
            <h3>상태별 현황</h3>
            <div class="status-summary">
              <span class="status-item pending">대기 {{ statistics.summary.statusCount.pending }}</span>
              <span class="status-item in-progress">진행 {{ statistics.summary.statusCount.inProgress }}</span>
              <span class="status-item pending-signature">서명대기 {{ statistics.summary.statusCount.pendingSignature }}</span>
              <span class="status-item completed">완료 {{ statistics.summary.statusCount.completed }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 출하 임박 사업 (남은수량 500㎡ 이하·완료 제외) — 상위 5건, 클릭 시 통계 화면 이동 -->
      <div class="content-card low-remaining-card" @click="goToLowRemaining">
        <div class="card-header">
          <h2>
            <i class="fas fa-hourglass-half" />
            사업종료 직전 납품요구
            <span class="low-remaining-sub">남은수량 {{ formatNumber(LOW_REMAINING_THRESHOLD) }}㎡ 이하</span>
          </h2>
          <span class="low-remaining-more">
            전체 {{ formatNumber(lowRemainingTotal) }}건 보기
            <i class="fas fa-chevron-right" />
          </span>
        </div>

        <div v-if="lowRemainingItems.length > 0" class="low-remaining-table-wrap">
          <table class="low-remaining-table">
            <thead>
              <tr>
                <th>납품요구번호</th>
                <th>수요기관</th>
                <th>사업명</th>
                <th class="num">
                  남은수량(㎡)
                </th>
                <th class="num">
                  총 계약금액
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in lowRemainingItems" :key="row.orderId">
                <td class="mono">
                  {{ row.deliveryRequestNo }}
                </td>
                <td class="ellipsis">
                  {{ row.client }}
                </td>
                <td class="ellipsis">
                  {{ row.projectName }}
                </td>
                <td class="num remaining">
                  {{ formatNumber(row.remainingQuantity) }}
                </td>
                <td class="num">
                  {{ formatNumber(row.itemTotalAmount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="chart-placeholder">
          <i class="fas fa-hourglass-half" />
          <p>사업종료 직전 납품요구가 없습니다</p>
        </div>
      </div>

      <!-- 차트 영역 -->
      <div class="chart-section">
        <!-- OEM 제조사별 월별 제조원가 -->
        <div class="chart-card chart-main">
          <h2>
            <i class="fas fa-industry" />
            OEM 제조사별 월별 제조원가
          </h2>
          <div v-if="oemChartData.length > 0" class="chart-content">
            <TopChartPanel :data="oemMatrix" initial-type="bar" :toolbar="['bar', 'stacked-bar', 'line']" :height="280" />
          </div>
          <div v-else class="chart-placeholder">
            <i class="fas fa-industry" />
            <p>데이터가 없습니다</p>
          </div>
        </div>

        <!-- 기간별 출하 추이 -->
        <div class="chart-card">
          <h2>
            <i class="fas fa-chart-bar" />
            기간별 출하 추이
          </h2>
          <div v-if="statistics.periodTrend.length > 0" class="chart-content">
            <TopChartPanel :data="trendMatrix" initial-type="bar" :toolbar="['bar', 'line', 'area']" :height="280" />
          </div>
          <div v-else class="chart-placeholder">
            <i class="fas fa-chart-bar" />
            <p>데이터가 없습니다</p>
          </div>
        </div>
      </div>

      <!-- 지역별 현황 + 상태별 현황 + 최근 활동 (3컬럼) -->
      <div class="region-activity-section">
        <!-- 지역별 출하 현황 -->
        <div class="content-card">
          <div class="card-header">
            <h2><i class="fas fa-map-marker-alt" /> 지역별 현황</h2>
          </div>
          <div v-if="statistics.regionBreakdown.length > 0" class="region-chart">
            <div
              v-for="item in statistics.regionBreakdown"
              :key="item.region"
              class="region-item"
            >
              <div class="region-info">
                <span class="region-name">{{ item.region }}</span>
                <span class="region-count">{{ item.orderCount }}건</span>
              </div>
              <div class="region-bar-container">
                <div
                  class="region-bar"
                  :style="{ width: getRegionBarWidth(item.shipmentAmount) + '%' }"
                />
              </div>
              <div class="region-amount">
                {{ formatCompactCurrency(item.shipmentAmount) }}
              </div>
            </div>
          </div>
          <div v-else class="chart-placeholder">
            <i class="fas fa-map-marker-alt" />
            <p>데이터가 없습니다</p>
          </div>
        </div>

        <!-- 상태별 현황 -->
        <div class="chart-card">
          <h2>
            <i class="fas fa-chart-pie" />
            상태별 현황
          </h2>
          <div class="status-chart">
            <TopChartPanel
              :data="statusMatrix"
              initial-type="doughnut"
              :toolbar="['doughnut', 'pie']"
              legend="none"
              :colors="statusChartColors"
              :height="220"
            />
            <div class="status-legend">
              <div class="legend-item">
                <span class="legend-color pending" />
                <span class="legend-label">대기</span>
                <span class="legend-value">{{ statistics.summary.statusCount.pending }}건</span>
              </div>
              <div class="legend-item">
                <span class="legend-color in-progress" />
                <span class="legend-label">진행중</span>
                <span class="legend-value">{{ statistics.summary.statusCount.inProgress }}건</span>
              </div>
              <div class="legend-item">
                <span class="legend-color pending-signature" />
                <span class="legend-label">서명대기</span>
                <span class="legend-value">{{ statistics.summary.statusCount.pendingSignature }}건</span>
              </div>
              <div class="legend-item">
                <span class="legend-color completed" />
                <span class="legend-label">납품완료</span>
                <span class="legend-value">{{ statistics.summary.statusCount.completed }}건</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 최근 활동 -->
        <div class="content-card">
          <div class="card-header">
            <h2><i class="fas fa-clock" /> 최근 활동</h2>
          </div>
          <div class="activity-list-compact">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item-compact">
              <div class="activity-icon-compact" :class="activity.type">
                <i :class="activity.icon" />
              </div>
              <div class="activity-content-compact">
                <span class="activity-title-compact">{{ activity.title }}</span>
                <span class="activity-time-compact">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import { getOemMonthlyChart, getShipmentStatistics } from '~/services/statistics.service'
import { getCommissionPeriods } from '~/services/commission.service'
import { orderService } from '~/services/order.service'
import type { ShipmentStatisticsResponse, OemChartData } from '~/types/statistics'
import type { LowRemainingOrder } from '~/types/order'

// 레이아웃 설정
definePageMeta({
  layout: 'admin'
})

// Router
const router = useRouter()

// 통계 데이터
const statistics = ref<ShipmentStatisticsResponse>({
  summary: {
    totalOrderCount: 0,
    totalShipmentCount: 0,
    totalOrderAmount: 0,
    totalShipmentAmount: 0,
    totalShipmentSalesAmount: 0,
    completionRate: 0,
    statusCount: {
      pending: 0,
      inProgress: 0,
      pendingSignature: 0,
      completed: 0,
      cancelled: 0
    }
  },
  periodTrend: [],
  regionBreakdown: [],
  recentOrders: [],
  recentShipments: [],
  skuOrderStats: []
})

// OEM 차트 데이터
const oemChartData = ref<OemChartData[]>([])

// 정산기간 목록
interface PeriodOption {
  periodId: number
  periodName: string
  startDate: string
  endDate: string
}
const periodOptions = ref<PeriodOption[]>([])
const selectedPeriodId = ref<number>(0)

// 기간 필터 상태
const currentYear = new Date().getFullYear()
const periodType = ref('period')
const selectedYear = ref(currentYear)
const selectedHalf = ref('1')
const selectedQuarter = ref('1')
const customStartDate = ref(`${currentYear}-01-01`)
const customEndDate = ref(`${currentYear}-12-31`)

// 연도 옵션 (최근 5년)
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= currentYear - 4; y--) {
    years.push(y)
  }
  return years
})

// 기간 라벨 표시
const periodLabel = computed(() => {
  const { start, end } = getDateRange()
  return `${start} ~ ${end}`
})

// 기간 타입에 따른 날짜 범위 계산
function getDateRange (): { start: string, end: string } {
  const year = selectedYear.value
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  switch (periodType.value) {
    case 'period': {
      const selected = periodOptions.value.find(p => p.periodId === selectedPeriodId.value)
      if (selected) {
        return { start: selected.startDate, end: selected.endDate < todayStr ? selected.endDate : todayStr }
      }
      return { start: `${year}-01-01`, end: todayStr }
    }
    case 'year':
      return { start: `${year}-01-01`, end: year === currentYear ? todayStr : `${year}-12-31` }
    case 'half': {
      const half = parseInt(selectedHalf.value)
      const startMonth = half === 1 ? '01' : '07'
      const endMonth = half === 1 ? '06' : '12'
      const endDate = `${year}-${endMonth}-${half === 1 ? '30' : '31'}`
      return { start: `${year}-${startMonth}-01`, end: year === currentYear ? todayStr : endDate }
    }
    case 'quarter': {
      const q = parseInt(selectedQuarter.value)
      const startMonth = String((q - 1) * 3 + 1).padStart(2, '0')
      const endMonths = ['03', '06', '09', '12']
      const endDays = ['31', '30', '30', '31']
      const endDate = `${year}-${endMonths[q - 1]}-${endDays[q - 1]}`
      return { start: `${year}-${startMonth}-01`, end: year === currentYear ? todayStr : endDate }
    }
    case 'custom':
      return { start: customStartDate.value, end: customEndDate.value }
    default:
      return { start: `${year}-01-01`, end: todayStr }
  }
}

// 정산기간 목록 로드
async function loadPeriods () {
  try {
    const periods = await getCommissionPeriods()
    periodOptions.value = periods.map((p: any) => {
      const startMonth = String(p.startMonth).padStart(2, '0')
      const endMonth = String(p.endMonth).padStart(2, '0')
      const endDay = new Date(p.endYear, p.endMonth, 0).getDate()
      return {
        periodId: p.periodId,
        periodName: p.periodName,
        startDate: `${p.startYear}-${startMonth}-01`,
        endDate: `${p.endYear}-${endMonth}-${String(endDay).padStart(2, '0')}`
      }
    })
    // 활성 기간을 기본 선택
    const active = periods.find((p: any) => p.isActive)
    if (active) {
      selectedPeriodId.value = active.periodId
    } else if (periodOptions.value.length > 0) {
      selectedPeriodId.value = periodOptions.value[0].periodId
    }
  } catch (error) {
    console.error('정산기간 목록 조회 실패:', error)
  }
}

// 기간 변경 핸들러
function onPeriodChange () {
  loadDashboardData()
}

// 최근 활동 데이터
const recentActivities = ref([
  {
    id: 1,
    type: 'sales',
    icon: 'fas fa-chart-line',
    title: '새로운 영업 건이 등록되었습니다',
    time: '5분 전'
  },
  {
    id: 2,
    type: 'order',
    icon: 'fas fa-shopping-cart',
    title: '발주 요청이 접수되었습니다',
    time: '15분 전'
  },
  {
    id: 3,
    type: 'shipping',
    icon: 'fas fa-truck',
    title: '출하가 완료되었습니다',
    time: '1시간 전'
  },
  {
    id: 4,
    type: 'delivery',
    icon: 'fas fa-check-circle',
    title: '납품이 확인되었습니다',
    time: '2시간 전'
  },
  {
    id: 5,
    type: 'signature',
    icon: 'fas fa-signature',
    title: '서명이 완료되었습니다',
    time: '3시간 전'
  }
])

// OEM 차트 데이터 로드
async function loadOemChartData () {
  try {
    const currentYear = new Date().getFullYear()
    oemChartData.value = await getOemMonthlyChart(currentYear)
  } catch (error) {
    console.error('OEM 차트 데이터 로드 실패:', error)
    // 실패 시 빈 배열 유지
    oemChartData.value = []
  }
}

// 출하 임박 사업 (남은수량 500㎡ 이하·완료 제외) — 상위 5건 미리보기
const LOW_REMAINING_THRESHOLD = 500
const LOW_REMAINING_PREVIEW_SIZE = 5
const lowRemainingItems = ref<LowRemainingOrder[]>([])
const lowRemainingTotal = ref(0)

async function loadLowRemainingPreview () {
  try {
    const res = await orderService.getLowRemainingOrders({
      threshold: LOW_REMAINING_THRESHOLD,
      page: 0,
      size: LOW_REMAINING_PREVIEW_SIZE
    })
    lowRemainingItems.value = res.content || []
    lowRemainingTotal.value = res.totalElements ?? 0
  } catch (error) {
    console.error('출하 임박 사업 미리보기 로드 실패:', error)
    lowRemainingItems.value = []
    lowRemainingTotal.value = 0
  }
}

function goToLowRemaining () {
  router.push('/admin/statistics/low-remaining')
}

// 대시보드 데이터 로드 (기간 필터 연동)
async function loadDashboardData () {
  try {
    const { start, end } = getDateRange()

    const data = await getShipmentStatistics({
      startDate: start,
      endDate: end,
      periodUnit: 'monthly'
    })

    statistics.value = data
  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error)
  }
}

// 포맷 함수들
function formatNumber (value: number): string {
  return value.toLocaleString('ko-KR')
}

function formatCurrency (value: number): string {
  return value.toLocaleString('ko-KR') + '원'
}

function formatCompactCurrency (value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(1) + '억원'
  }
  if (value >= 10000000) {
    return (value / 10000000).toFixed(1) + '천만원'
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(0) + '만원'
  }
  return value.toLocaleString('ko-KR') + '원'
}

function formatPeriodLabel (period: string): string {
  if (period.match(/^\d{4}-\d{2}$/)) {
    const month = parseInt(period.split('-')[1])
    return `${month}월`
  }
  if (period.match(/^\d{4}-W\d{2}$/)) {
    const week = parseInt(period.split('-W')[1])
    return `${week}주`
  }
  if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = period.split('-')
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`
  }
  return period
}

// topgrid 차트 매트릭스 (OEM 제조사별 월별 제조원가 — 제조사 시리즈 × 월)
const oemMatrix = computed(() => {
  const oemNames = [...new Set(oemChartData.value.flatMap(m => m.data.map(d => d.oemName)))]
  return {
    categories: oemChartData.value.map(m => formatOemMonth(m.month)),
    series: oemNames.map(name => ({
      name,
      values: oemChartData.value.map(m => m.data.find(d => d.oemName === name)?.manufacturingCost || 0)
    }))
  }
})

// topgrid 차트 매트릭스 (기간별 출하 추이)
const trendMatrix = computed(() => ({
  categories: statistics.value.periodTrend.map(t => formatPeriodLabel(t.period)),
  series: [{
    name: '출하금액',
    values: statistics.value.periodTrend.map(t => t.shipmentAmount),
    color: '#3b82f6'
  }]
}))

// topgrid 차트 매트릭스 (상태별 도넛) — 조각 색은 하단 범례 색과 일치
const statusChartItems = computed(() => {
  const s = statistics.value.summary.statusCount
  return [
    { name: '대기', value: s.pending, color: '#fbbf24' },
    { name: '진행중', value: s.inProgress, color: '#3b82f6' },
    { name: '서명대기', value: s.pendingSignature, color: '#d946ef' },
    { name: '납품완료', value: s.completed, color: '#10b981' },
    { name: '취소', value: s.cancelled, color: '#ef4444' }
  ].filter(d => d.value > 0)
})

const statusMatrix = computed(() => ({
  categories: statusChartItems.value.map(d => d.name),
  series: [{ name: '건수', values: statusChartItems.value.map(d => d.value) }]
}))

const statusChartColors = computed(() => statusChartItems.value.map(d => d.color))

function getRegionBarWidth (amount: number): number {
  const maxAmount = Math.max(...statistics.value.regionBreakdown.map(r => r.shipmentAmount))
  if (maxAmount === 0) { return 0 }
  return (amount / maxAmount) * 100
}

function formatOemMonth (month: string): string {
  // YYYY-MM -> MM월
  const parts = month.split('-')
  return `${parseInt(parts[1])}월`
}

// 네비게이션
const goToSales = () => router.push('/admin/sales/list')
const goToOrder = () => router.push('/admin/order/list')
const goToShipping = () => router.push('/admin/shipping/list')
const goToTransport = () => router.push('/admin/transport/list')

// Lifecycle
onMounted(async () => {
  await loadPeriods()
  loadDashboardData()
  loadOemChartData()
  loadLowRemainingPreview()
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 빠른 액션 바 (조회기간 필터 상단) */
.quick-actions-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1f2937;
  font-size: 0.8125rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  flex: 1 1 0;
  min-width: 140px;
  justify-content: center;
}

.action-btn-inline:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.action-btn-inline i {
  font-size: 0.875rem;
}

/* 지역별 현황 + 최근 활동 2컬럼 */
.region-activity-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 1200px) {
  .chart-section {
    grid-template-columns: 1fr;
  }

  .region-activity-section {
    grid-template-columns: 1fr;
  }
}

/* 기간 필터 */
.dashboard-filter {
  background: white;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.filter-select {
  padding: 0.375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #374151;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.filter-date {
  padding: 0.375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #374151;
}

.filter-date:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.filter-separator {
  color: #9ca3af;
  font-size: 0.8125rem;
}

.filter-period-label {
  margin-left: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

/* 요약 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.icon-order {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.icon-amount {
  background: linear-gradient(135deg, #10b981, #059669);
}

.icon-rate {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.icon-status {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

.icon-sales {
  background: #dcfce7;
  color: #16a34a;
}

/* ===== 출하 임박 사업 미리보기 영역 (대시보드) ===== */
.low-remaining-card {
  cursor: pointer;
  transition: all 0.2s;
}

.low-remaining-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.low-remaining-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.low-remaining-card .card-header h2 i {
  color: #ea580c;
}

.low-remaining-sub {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
}

.low-remaining-more {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #ea580c;
  white-space: nowrap;
}

.low-remaining-table-wrap {
  overflow-x: auto;
}

.low-remaining-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.low-remaining-table thead th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  color: #6b7280;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.low-remaining-table tbody td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.low-remaining-table .num {
  text-align: right;
}

.low-remaining-table .mono {
  white-space: nowrap;
  color: #1f2937;
  font-weight: 500;
}

.low-remaining-table .remaining {
  font-weight: 700;
  color: #c2410c;
}

.low-remaining-table .ellipsis {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-content h3 {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.status-item {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-weight: 500;
}

.status-item.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-item.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-item.pending-signature {
  background: #fae8ff;
  color: #86198f;
}

.status-item.completed {
  background: #dcfce7;
  color: #166534;
}

/* 차트 섹션 */
.chart-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.875rem 0;
}

.chart-card h2 i {
  color: #6b7280;
  font-size: 0.875rem;
}

.chart-placeholder {
  height: 180px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.chart-placeholder i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

/* 상태별 현황 — 좌: 도넛 / 우: 범례 */
.status-chart {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-chart .top-chart-panel {
  flex: 1;
  min-width: 0;
}

.status-legend {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 150px;
  flex-shrink: 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-color.pending {
  background: #fbbf24;
}

.legend-color.in-progress {
  background: #3b82f6;
}

.legend-color.pending-signature {
  background: #d946ef;
}

.legend-color.completed {
  background: #10b981;
}

.legend-label {
  flex: 1;
  color: #374151;
}

.legend-value {
  font-weight: 600;
  color: #1f2937;
}

/* 지역별 현황 */
.region-chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.region-item {
  display: grid;
  grid-template-columns: 50px 1fr 55px;
  align-items: center;
  gap: 0.5rem;
}

.region-info {
  display: flex;
  flex-direction: column;
}

.region-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.region-count {
  font-size: 0.625rem;
  color: #9ca3af;
}

.region-bar-container {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.region-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.region-amount {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

.content-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 0.75rem;
}

.card-header h2 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header h2 i {
  color: #6b7280;
  font-size: 0.875rem;
}

/* 최근 활동 (컴팩트) */
.activity-list-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.activity-item-compact {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.activity-item-compact:hover {
  background-color: #f8fafc;
}

.activity-icon-compact {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: white;
  flex-shrink: 0;
}

.activity-icon-compact.sales {
  background: #3b82f6;
}

.activity-icon-compact.order {
  background: #8b5cf6;
}

.activity-icon-compact.shipping {
  background: #06b6d4;
}

.activity-icon-compact.delivery {
  background: #10b981;
}

.activity-icon-compact.signature {
  background: #d946ef;
}

.activity-content-compact {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.activity-title-compact {
  font-size: 0.8125rem;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time-compact {
  font-size: 0.6875rem;
  color: #9ca3af;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .region-activity-section {
    grid-template-columns: 1fr;
  }

  .status-chart {
    flex-direction: column;
    align-items: stretch;
  }

  .status-legend {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .action-btn-inline {
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-actions-bar {
    flex-wrap: wrap;
  }

  .action-btn-inline {
    flex: 1 1 calc(50% - 0.375rem);
    min-width: 0;
  }

  .region-activity-section {
    grid-template-columns: 1fr;
  }
}
</style>
