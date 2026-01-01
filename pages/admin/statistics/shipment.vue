<template>
  <div class="statistics-shipment">
    <PageHeader
      title="출하현황 통계"
      description="기간별 출하 현황을 통계로 확인합니다."
    />

    <div class="content-section">
      <!-- 검색 영역 -->
      <div class="search-section">
        <div class="search-row">
          <div class="search-item">
            <label>조회기간</label>
            <div class="date-range">
              <input v-model="searchParams.startDate" type="date" class="date-input" />
              <span>~</span>
              <input v-model="searchParams.endDate" type="date" class="date-input" />
            </div>
          </div>

          <div class="search-item">
            <label>조회단위</label>
            <select v-model="searchParams.periodUnit" class="form-select">
              <option value="daily">일별</option>
              <option value="weekly">주별</option>
              <option value="monthly">월별</option>
            </select>
          </div>

          <div class="search-item">
            <label>상태</label>
            <select v-model="searchParams.status" class="form-select">
              <option value="">전체</option>
              <option value="PENDING">대기</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="PENDING_SIGNATURE">서명대기</option>
              <option value="COMPLETED">납품완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>

          <div class="search-buttons">
            <button class="btn-primary" @click="handleSearch">
              <i class="fas fa-search"></i>
              조회
            </button>
            <button class="btn-secondary" @click="handleReset">
              <i class="fas fa-redo"></i>
              초기화
            </button>
          </div>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        데이터를 불러오는 중...
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
      </div>

      <!-- 통계 내용 -->
      <template v-else>
        <!-- 요약 카드 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon icon-order">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="stat-content">
              <h3>총 납품요구</h3>
              <p class="stat-number">{{ formatNumber(statistics.summary.totalOrderCount) }}건 / {{ formatCompactCurrency(statistics.summary.totalOrderAmount) }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-amount">
              <i class="fas fa-truck-loading"></i>
            </div>
            <div class="stat-content">
              <h3>총 출하</h3>
              <p class="stat-number">{{ formatNumber(statistics.summary.totalShipmentCount) }}건 / {{ formatCompactCurrency(statistics.summary.totalShipmentAmount) }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-rate">
              <i class="fas fa-chart-pie"></i>
            </div>
            <div class="stat-content">
              <h3>납품완료율</h3>
              <p class="stat-number">{{ statistics.summary.completionRate.toFixed(1) }}%</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-status">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-content">
              <h3>상태별 현황</h3>
              <div class="status-summary">
                <span class="status-item pending">대기 {{ statistics.summary.statusCount.pending }}건</span>
                <span class="status-item in-progress">진행중 {{ statistics.summary.statusCount.inProgress }}건</span>
                <span class="status-item pending-signature">서명대기 {{ statistics.summary.statusCount.pendingSignature }}건</span>
                <span class="status-item completed">납품완료 {{ statistics.summary.statusCount.completed }}건</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 차트 섹션 -->
        <div class="chart-section">
          <!-- 기간별 출하 추이 -->
          <div class="chart-card chart-main">
            <h2>
              <i class="fas fa-chart-bar"></i>
              기간별 출하 추이
            </h2>
            <div v-if="statistics.periodTrend.length > 0" class="chart-content">
              <div class="trend-chart">
                <div
                  v-for="item in statistics.periodTrend"
                  :key="item.period"
                  class="trend-bar-group"
                >
                  <div class="trend-bar-container">
                    <div
                      class="trend-bar"
                      :style="{ height: getBarHeight(item.shipmentAmount) + '%' }"
                      :title="`${formatCurrency(item.shipmentAmount)}`"
                    >
                      <span class="bar-value">{{ formatCompactNumber(item.shipmentAmount) }}</span>
                    </div>
                  </div>
                  <div class="trend-label">{{ formatPeriodLabel(item.period) }}</div>
                  <div class="trend-info">
                    <span>{{ item.orderCount }}건</span>
                    <span>{{ item.completionRate.toFixed(0) }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="chart-placeholder">
              <i class="fas fa-chart-bar"></i>
              <p>데이터가 없습니다</p>
            </div>
          </div>

          <!-- 상태별 현황 -->
          <div class="chart-card">
            <h2>
              <i class="fas fa-chart-pie"></i>
              상태별 현황
            </h2>
            <div class="status-chart">
              <div class="status-donut" :style="{ background: donutGradient }">
                <div class="donut-center">
                  <span class="donut-total">{{ getTotalStatusCount }}</span>
                  <span class="donut-label">전체</span>
                </div>
              </div>
              <div class="status-legend">
                <div class="legend-item">
                  <span class="legend-color pending"></span>
                  <span class="legend-label">대기</span>
                  <span class="legend-value">{{ statistics.summary.statusCount.pending }}건</span>
                  <span class="legend-percent">({{ getStatusPercent('pending') }}%)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color in-progress"></span>
                  <span class="legend-label">진행중</span>
                  <span class="legend-value">{{ statistics.summary.statusCount.inProgress }}건</span>
                  <span class="legend-percent">({{ getStatusPercent('inProgress') }}%)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color pending-signature"></span>
                  <span class="legend-label">서명대기</span>
                  <span class="legend-value">{{ statistics.summary.statusCount.pendingSignature }}건</span>
                  <span class="legend-percent">({{ getStatusPercent('pendingSignature') }}%)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color completed"></span>
                  <span class="legend-label">납품완료</span>
                  <span class="legend-value">{{ statistics.summary.statusCount.completed }}건</span>
                  <span class="legend-percent">({{ getStatusPercent('completed') }}%)</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color cancelled"></span>
                  <span class="legend-label">취소</span>
                  <span class="legend-value">{{ statistics.summary.statusCount.cancelled }}건</span>
                  <span class="legend-percent">({{ getStatusPercent('cancelled') }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 지역별 출하 현황 -->
          <div class="chart-card">
            <h2>
              <i class="fas fa-map-marker-alt"></i>
              지역별 출하 현황
            </h2>
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
                  ></div>
                </div>
                <div class="region-amount">{{ formatCompactCurrency(item.shipmentAmount) }}</div>
              </div>
            </div>
            <div v-else class="chart-placeholder">
              <i class="fas fa-map-marker-alt"></i>
              <p>데이터가 없습니다</p>
            </div>
          </div>
        </div>

        <!-- 최근 납품요구 목록 -->
        <div class="table-section">
          <h2>
            <i class="fas fa-list"></i>
            최근 납품요구 현황
          </h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>납품요구번호</th>
                  <th>수요기관</th>
                  <th>지역</th>
                  <th>출하일자</th>
                  <th>출하금액</th>
                  <th>상태</th>
                  <th>납품완료율</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="statistics.recentOrders.length === 0">
                  <td colspan="7" class="empty-cell">데이터가 없습니다</td>
                </tr>
                <tr v-for="order in statistics.recentOrders" :key="order.orderId">
                  <td>{{ order.deliveryRequestNo }}</td>
                  <td>{{ order.client }}</td>
                  <td>{{ order.region || '-' }}</td>
                  <td>{{ order.shipmentDate || '-' }}</td>
                  <td class="text-right">{{ formatCurrency(order.amount) }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(order.status)]">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="completion-rate">
                      <div class="rate-bar">
                        <div class="rate-fill" :style="{ width: order.completionRate + '%' }"></div>
                      </div>
                      <span class="rate-text">{{ order.completionRate.toFixed(0) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 최근 출하 목록 -->
        <div class="table-section">
          <h2>
            <i class="fas fa-truck"></i>
            최근 출하 현황
          </h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>납품요구번호</th>
                  <th>수요기관</th>
                  <th>지역</th>
                  <th>출하일자</th>
                  <th>출하금액</th>
                  <th>차량번호</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="statistics.recentShipments.length === 0">
                  <td colspan="7" class="empty-cell">데이터가 없습니다</td>
                </tr>
                <tr v-for="shipment in statistics.recentShipments" :key="shipment.shipmentId">
                  <td>{{ shipment.deliveryRequestNo }}</td>
                  <td>{{ shipment.client }}</td>
                  <td>{{ shipment.region || '-' }}</td>
                  <td>{{ shipment.shipmentDate || '-' }}</td>
                  <td class="text-right">{{ formatCurrency(shipment.amount) }}</td>
                  <td>{{ shipment.vehicleNo || '-' }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(shipment.status)]">
                      {{ getStatusLabel(shipment.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getShipmentStatistics } from '~/services/statistics.service'
import type {
  ShipmentStatisticsRequest,
  ShipmentStatisticsResponse,
  PeriodUnit,
  ShipmentStatus
} from '~/types/statistics'
import { SHIPMENT_STATUS_LABELS } from '~/types/statistics'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하현황통계'
})

// 상태
const loading = ref(false)
const error = ref<string | null>(null)

// 검색 조건
const searchParams = reactive<ShipmentStatisticsRequest>({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  periodUnit: 'monthly' as PeriodUnit,
  status: undefined
})

// 통계 데이터
const statistics = ref<ShipmentStatisticsResponse>({
  summary: {
    totalOrderCount: 0,
    totalShipmentCount: 0,
    totalOrderAmount: 0,
    totalShipmentAmount: 0,
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
  recentShipments: []
})

// 기본 날짜 (올해 1월 1일 ~ 오늘)
function getDefaultStartDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-01-01`
}

function getDefaultEndDate(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

// 데이터 조회
async function loadStatistics() {
  loading.value = true
  error.value = null

  try {
    const params: ShipmentStatisticsRequest = {
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      periodUnit: searchParams.periodUnit
    }

    if (searchParams.status) {
      params.status = searchParams.status as ShipmentStatus
    }

    const data = await getShipmentStatistics(params)
    statistics.value = data
  } catch (err: any) {
    console.error('통계 조회 오류:', err)
    error.value = err.message || '통계 데이터를 불러오는데 실패했습니다'

    // Mock 데이터로 테스트 (백엔드 연동 전)
    loadMockData()
  } finally {
    loading.value = false
  }
}

// Mock 데이터 (백엔드 연동 전 테스트용)
function loadMockData() {
  statistics.value = {
    summary: {
      totalOrderCount: 156,
      totalShipmentCount: 180,
      totalOrderAmount: 3500000000,
      totalShipmentAmount: 2847500000,
      completionRate: 78.2,
      statusCount: {
        pending: 12,
        inProgress: 15,
        pendingSignature: 7,
        completed: 122,
        cancelled: 0
      }
    },
    periodTrend: [
      { period: '2024-07', orderCount: 18, shipmentAmount: 320000000, completedCount: 15, completionRate: 83.3 },
      { period: '2024-08', orderCount: 22, shipmentAmount: 450000000, completedCount: 18, completionRate: 81.8 },
      { period: '2024-09', orderCount: 28, shipmentAmount: 520000000, completedCount: 24, completionRate: 85.7 },
      { period: '2024-10', orderCount: 35, shipmentAmount: 680000000, completedCount: 30, completionRate: 85.7 },
      { period: '2024-11', orderCount: 42, shipmentAmount: 720000000, completedCount: 35, completionRate: 83.3 },
      { period: '2024-12', orderCount: 11, shipmentAmount: 157500000, completedCount: 0, completionRate: 0 }
    ],
    regionBreakdown: [
      { region: '서울', orderCount: 35, shipmentAmount: 580000000, completionRate: 85.7 },
      { region: '경기', orderCount: 42, shipmentAmount: 720000000, completionRate: 78.6 },
      { region: '부산', orderCount: 28, shipmentAmount: 450000000, completionRate: 82.1 },
      { region: '전북', orderCount: 22, shipmentAmount: 380000000, completionRate: 77.3 },
      { region: '경남', orderCount: 18, shipmentAmount: 320000000, completionRate: 72.2 },
      { region: '기타', orderCount: 11, shipmentAmount: 397500000, completionRate: 81.8 }
    ],
    recentOrders: [
      { orderId: 1, deliveryRequestNo: '35-24-3-41787-00', client: '한국농어촌공사', region: '전북', shipmentDate: '2024-12-01', amount: 25000000, status: 'COMPLETED' as ShipmentStatus, completionRate: 100 },
      { orderId: 2, deliveryRequestNo: '35-24-3-41788-00', client: '한국도로공사', region: '경기', shipmentDate: '2024-11-28', amount: 45000000, status: 'IN_PROGRESS' as ShipmentStatus, completionRate: 60 },
      { orderId: 3, deliveryRequestNo: '35-24-3-41789-00', client: '한국수자원공사', region: '부산', shipmentDate: '2024-11-25', amount: 32000000, status: 'PENDING_SIGNATURE' as ShipmentStatus, completionRate: 80 },
      { orderId: 4, deliveryRequestNo: '35-24-3-41790-00', client: '한국철도공사', region: '서울', shipmentDate: '2024-11-22', amount: 18000000, status: 'PENDING' as ShipmentStatus, completionRate: 0 },
      { orderId: 5, deliveryRequestNo: '35-24-3-41791-00', client: '한국전력공사', region: '경남', shipmentDate: '2024-11-20', amount: 55000000, status: 'COMPLETED' as ShipmentStatus, completionRate: 100 }
    ],
    recentShipments: [
      { shipmentId: 1, orderId: 1, deliveryRequestNo: '35-24-3-41787-00', client: '한국농어촌공사', region: '전북', shipmentDate: '2024-12-01', amount: 12500000, status: 'COMPLETED' as ShipmentStatus, vehicleNo: '123-4567' },
      { shipmentId: 2, orderId: 1, deliveryRequestNo: '35-24-3-41787-00', client: '한국농어촌공사', region: '전북', shipmentDate: '2024-12-02', amount: 12500000, status: 'COMPLETED' as ShipmentStatus, vehicleNo: '234-5678' },
      { shipmentId: 3, orderId: 2, deliveryRequestNo: '35-24-3-41788-00', client: '한국도로공사', region: '경기', shipmentDate: '2024-11-28', amount: 22500000, status: 'IN_PROGRESS' as ShipmentStatus, vehicleNo: '345-6789' },
      { shipmentId: 4, orderId: 3, deliveryRequestNo: '35-24-3-41789-00', client: '한국수자원공사', region: '부산', shipmentDate: '2024-11-25', amount: 16000000, status: 'PENDING_SIGNATURE' as ShipmentStatus, vehicleNo: '456-7890' },
      { shipmentId: 5, orderId: 4, deliveryRequestNo: '35-24-3-41790-00', client: '한국철도공사', region: '서울', shipmentDate: '2024-11-22', amount: 18000000, status: 'PENDING' as ShipmentStatus, vehicleNo: null }
    ]
  }
  error.value = null
}

// 검색
function handleSearch() {
  loadStatistics()
}

// 초기화
function handleReset() {
  searchParams.startDate = getDefaultStartDate()
  searchParams.endDate = getDefaultEndDate()
  searchParams.periodUnit = 'monthly'
  searchParams.status = undefined
  loadStatistics()
}

// 포맷 함수들
function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}

function formatCurrency(value: number): string {
  return value.toLocaleString('ko-KR') + '원'
}

function formatCompactNumber(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(1) + '억'
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(0) + '만'
  }
  return value.toLocaleString('ko-KR')
}

function formatCompactCurrency(value: number): string {
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

function formatPeriodLabel(period: string): string {
  // 월별: 2024-01 -> 1월
  if (period.match(/^\d{4}-\d{2}$/)) {
    const month = parseInt(period.split('-')[1])
    return `${month}월`
  }
  // 주별: 2024-W01 -> W1
  if (period.match(/^\d{4}-W\d{2}$/)) {
    const week = parseInt(period.split('-W')[1])
    return `${week}주`
  }
  // 일별: 2024-01-01 -> 1/1
  if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = period.split('-')
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`
  }
  return period
}

// 차트 헬퍼 함수
function getBarHeight(amount: number): number {
  const maxAmount = Math.max(...statistics.value.periodTrend.map(t => t.shipmentAmount))
  if (maxAmount === 0) return 0
  return (amount / maxAmount) * 100
}

function getRegionBarWidth(amount: number): number {
  const maxAmount = Math.max(...statistics.value.regionBreakdown.map(r => r.shipmentAmount))
  if (maxAmount === 0) return 0
  return (amount / maxAmount) * 100
}

// 상태 관련
const getTotalStatusCount = computed(() => {
  const { pending, inProgress, pendingSignature, completed, cancelled } = statistics.value.summary.statusCount
  return pending + inProgress + pendingSignature + completed + cancelled
})

// 도넛 차트 그라데이션 (데이터 기반 동적 생성)
const donutGradient = computed(() => {
  const total = getTotalStatusCount.value
  if (total === 0) return '#e5e7eb' // 데이터 없으면 회색

  const { pending, inProgress, pendingSignature, completed, cancelled } = statistics.value.summary.statusCount

  // 각 상태별 비율 계산 (도 단위, 360도 기준)
  const pendingDeg = (pending / total) * 360
  const inProgressDeg = (inProgress / total) * 360
  const pendingSignatureDeg = (pendingSignature / total) * 360
  const completedDeg = (completed / total) * 360
  const cancelledDeg = (cancelled / total) * 360

  // 누적 각도 계산
  let currentDeg = 0
  const segments: string[] = []

  // 대기 (노란색)
  if (pending > 0) {
    segments.push(`#fbbf24 ${currentDeg}deg ${currentDeg + pendingDeg}deg`)
    currentDeg += pendingDeg
  }
  // 진행중 (파란색)
  if (inProgress > 0) {
    segments.push(`#3b82f6 ${currentDeg}deg ${currentDeg + inProgressDeg}deg`)
    currentDeg += inProgressDeg
  }
  // 서명대기 (보라색)
  if (pendingSignature > 0) {
    segments.push(`#d946ef ${currentDeg}deg ${currentDeg + pendingSignatureDeg}deg`)
    currentDeg += pendingSignatureDeg
  }
  // 납품완료 (초록색)
  if (completed > 0) {
    segments.push(`#10b981 ${currentDeg}deg ${currentDeg + completedDeg}deg`)
    currentDeg += completedDeg
  }
  // 취소 (빨간색)
  if (cancelled > 0) {
    segments.push(`#ef4444 ${currentDeg}deg ${currentDeg + cancelledDeg}deg`)
  }

  return segments.length > 0 ? `conic-gradient(${segments.join(', ')})` : '#e5e7eb'
})

function getStatusPercent(status: 'pending' | 'inProgress' | 'pendingSignature' | 'completed' | 'cancelled'): string {
  const total = getTotalStatusCount.value
  if (total === 0) return '0'
  const count = statistics.value.summary.statusCount[status]
  return ((count / total) * 100).toFixed(1)
}

function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    PENDING_SIGNATURE: 'pending-signature',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }
  return classMap[status] || ''
}

function getStatusLabel(status: string): string {
  return SHIPMENT_STATUS_LABELS[status as ShipmentStatus] || status
}

// 초기 로드
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
/* 페이지 레이아웃 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 검색 영역 */
.search-section {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
}

.search-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 로딩/에러 상태 */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
}

/* 요약 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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

.stat-content h3 {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.375rem 0;
  font-weight: 500;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.status-item {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
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
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card.chart-main {
  grid-column: 1;
}

.chart-card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.chart-card h2 i {
  color: #6b7280;
}

.chart-placeholder {
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.chart-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* 기간별 추이 차트 */
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 220px;
  padding-top: 20px;
}

.trend-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.trend-bar-container {
  height: 160px;
  width: 40px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(180deg, #3b82f6, #1d4ed8);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 4px;
  transition: height 0.3s ease;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.trend-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  font-weight: 500;
}

.trend-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.6875rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* 상태별 현황 */
.status-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-donut {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  /* background는 동적으로 :style 바인딩으로 적용 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.donut-center {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.donut-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.status-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
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

.legend-color.cancelled {
  background: #ef4444;
}

.legend-label {
  flex: 1;
  color: #374151;
}

.legend-value {
  font-weight: 600;
  color: #1f2937;
}

.legend-percent {
  color: #9ca3af;
  font-size: 0.75rem;
}

/* 지역별 현황 */
.region-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.region-item {
  display: grid;
  grid-template-columns: 80px 1fr 70px;
  align-items: center;
  gap: 0.75rem;
}

.region-info {
  display: flex;
  flex-direction: column;
}

.region-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.region-count {
  font-size: 0.6875rem;
  color: #9ca3af;
}

.region-bar-container {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.region-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.region-amount {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.table-section h2 i {
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: center;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}

.data-table .text-right {
  text-align: right;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.pending-signature {
  background: #fae8ff;
  color: #86198f;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* 납품완료율 바 */
.completion-rate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rate-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}

.rate-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.rate-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  min-width: 36px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .chart-section {
    grid-template-columns: 1fr;
  }

  .chart-card.chart-main {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    width: 100%;
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .search-buttons {
    justify-content: flex-end;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    overflow-x: auto;
  }

  .data-table th:nth-child(3),
  .data-table th:nth-child(4),
  .data-table td:nth-child(3),
  .data-table td:nth-child(4) {
    display: none;
  }
}
</style>
