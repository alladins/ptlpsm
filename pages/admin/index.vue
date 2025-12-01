<template>
  <client-only>
    <div class="admin-dashboard">
      <!-- 페이지 헤더 - PageHeader 컴포넌트 사용 -->
      <PageHeader
        title="대시보드"
        description="PTPLPSM 출하관리 시스템"
      />

      <!-- 요약 카드 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-order">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-content">
            <h3>총 납품요구 건수</h3>
            <p class="stat-number">{{ formatNumber(statistics.summary.totalOrderCount) }}건</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-amount">
            <i class="fas fa-won-sign"></i>
          </div>
          <div class="stat-content">
            <h3>총 출하 금액</h3>
            <p class="stat-number">{{ formatCurrency(statistics.summary.totalShipmentAmount) }}</p>
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
              <span class="status-item pending">대기 {{ statistics.summary.statusCount.pending }}</span>
              <span class="status-item in-progress">진행 {{ statistics.summary.statusCount.inProgress }}</span>
              <span class="status-item pending-signature">서명대기 {{ statistics.summary.statusCount.pendingSignature }}</span>
              <span class="status-item completed">완료 {{ statistics.summary.statusCount.completed }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 영역 -->
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
            <div class="status-donut">
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
              </div>
              <div class="legend-item">
                <span class="legend-color in-progress"></span>
                <span class="legend-label">진행중</span>
                <span class="legend-value">{{ statistics.summary.statusCount.inProgress }}건</span>
              </div>
              <div class="legend-item">
                <span class="legend-color pending-signature"></span>
                <span class="legend-label">서명대기</span>
                <span class="legend-value">{{ statistics.summary.statusCount.pendingSignature }}건</span>
              </div>
              <div class="legend-item">
                <span class="legend-color completed"></span>
                <span class="legend-label">납품완료</span>
                <span class="legend-value">{{ statistics.summary.statusCount.completed }}건</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 지역별 출하 현황 -->
        <div class="chart-card">
          <h2>
            <i class="fas fa-map-marker-alt"></i>
            지역별 현황
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

      <!-- 하단 영역 -->
      <div class="bottom-section">
        <!-- 최근 활동 -->
        <div class="content-card">
          <div class="card-header">
            <h2><i class="fas fa-clock"></i> 최근 활동</h2>
          </div>
          <div class="activity-list-compact">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item-compact">
              <div class="activity-icon-compact" :class="activity.type">
                <i :class="activity.icon"></i>
              </div>
              <div class="activity-content-compact">
                <span class="activity-title-compact">{{ activity.title }}</span>
                <span class="activity-time-compact">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 빠른 액션 -->
        <div class="content-card">
          <div class="card-header">
            <h2><i class="fas fa-bolt"></i> 빠른 액션</h2>
          </div>
          <div class="quick-actions-compact">
            <button class="action-btn-compact" @click="goToSales">
              <i class="fas fa-plus"></i>
              <span>영업 등록</span>
            </button>
            <button class="action-btn-compact" @click="goToOrder">
              <i class="fas fa-shopping-cart"></i>
              <span>발주 등록</span>
            </button>
            <button class="action-btn-compact" @click="goToShipping">
              <i class="fas fa-truck"></i>
              <span>출하 등록</span>
            </button>
            <button class="action-btn-compact" @click="goToTransport">
              <i class="fas fa-route"></i>
              <span>운송장 관리</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import type { ShipmentStatisticsResponse } from '~/types/statistics'

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
  recentOrders: []
})

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

// 목업 데이터 로드
function loadMockData() {
  statistics.value = {
    summary: {
      totalOrderCount: 156,
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
    recentOrders: []
  }
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

// 네비게이션
const goToSales = () => router.push('/admin/sales/list')
const goToOrder = () => router.push('/admin/order/list')
const goToShipping = () => router.push('/admin/shipping/list')
const goToTransport = () => router.push('/admin/transport/list')

// Lifecycle
onMounted(() => {
  loadMockData()
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 요약 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
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
  grid-template-columns: 2fr 1fr 1fr;
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

/* 기간별 추이 차트 */
.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  padding-top: 16px;
}

.trend-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.trend-bar-container {
  height: 130px;
  width: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(180deg, #3b82f6, #1d4ed8);
  border-radius: 3px 3px 0 0;
  position: relative;
  min-height: 4px;
  transition: height 0.3s ease;
}

.bar-value {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.625rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.trend-label {
  font-size: 0.6875rem;
  color: #6b7280;
  margin-top: 0.375rem;
  font-weight: 500;
}

.trend-info {
  font-size: 0.625rem;
  color: #9ca3af;
}

/* 상태별 현황 */
.status-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-donut {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    #fbbf24 0deg 45deg,
    #3b82f6 45deg 90deg,
    #d946ef 90deg 120deg,
    #10b981 120deg 324deg,
    #ef4444 324deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.donut-center {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-total {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.donut-label {
  font-size: 0.625rem;
  color: #6b7280;
}

.status-legend {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
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

/* 하단 영역 */
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

/* 빠른 액션 (컴팩트) */
.quick-actions-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.action-btn-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1f2937;
  font-size: 0.8125rem;
}

.action-btn-compact:hover {
  background: white;
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-btn-compact i {
  font-size: 0.875rem;
}

.action-btn-compact span {
  font-weight: 500;
}

/* 반응형 */
@media (max-width: 1200px) {
  .chart-section {
    grid-template-columns: 1fr 1fr;
  }

  .chart-card.chart-main {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .chart-section {
    grid-template-columns: 1fr;
  }

  .chart-card.chart-main {
    grid-column: span 1;
  }

  .bottom-section {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-actions-compact {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
