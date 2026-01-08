<template>
  <div class="commission-dashboard">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="커미션 대시보드"
      description="연간 커미션 현황을 한눈에 파악합니다."
    >
      <template #actions>
        <div class="year-selector">
          <button
            class="year-nav"
            :disabled="selectedYear <= minYear"
            @click="changeYear(-1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="year-display">{{ selectedYear }}년</span>
          <button
            class="year-nav"
            :disabled="selectedYear >= maxYear"
            @click="changeYear(1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>대시보드 데이터를 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 주요 지표 카드 -->
      <div class="kpi-section">
        <div class="kpi-card primary">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <span class="kpi-label">연간 총 매출</span>
          </div>
          <div class="kpi-value">{{ formatCurrency(summary.totalSalesAmount) }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub">커미션 산정 기준</span>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-coins"></i>
            </div>
            <span class="kpi-label">총 커미션</span>
          </div>
          <div class="kpi-value">{{ formatCurrency(summary.totalCommissionAmount) }}</div>
          <div class="kpi-footer">
            <span class="kpi-rate">평균 {{ summary.averageCommissionRate?.toFixed(1) || 0 }}%</span>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <span class="kpi-label">지급 완료</span>
          </div>
          <div class="kpi-value">{{ formatCurrency(summary.totalPaidAmount) }}</div>
          <div class="kpi-footer">
            <span class="kpi-progress">{{ paymentRate }}% 완료</span>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-hourglass-half"></i>
            </div>
            <span class="kpi-label">미지급</span>
          </div>
          <div class="kpi-value">{{ formatCurrency(summary.totalUnpaidAmount) }}</div>
          <div class="kpi-footer">
            <span class="kpi-remaining">잔여 {{ 100 - paymentRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 현재 구간 정보 -->
      <div v-if="summary.currentTier" class="tier-info-card">
        <div class="tier-content">
          <div class="tier-badge">
            <i class="fas fa-layer-group"></i>
            현재 적용 구간
          </div>
          <div class="tier-detail">
            <span class="tier-name">{{ summary.currentTier.tierName }}</span>
            <span class="tier-rate">{{ summary.currentTier.commissionRate }}%</span>
          </div>
          <div class="tier-range">
            {{ formatCurrency(summary.currentTier.minAmount) }} ~
            {{ summary.currentTier.maxAmount ? formatCurrency(summary.currentTier.maxAmount) : '무제한' }}
          </div>
        </div>
        <div v-if="summary.amountToNextTier" class="tier-progress">
          <div class="progress-label">
            <span>다음 구간까지</span>
            <span class="amount">{{ formatCurrency(summary.amountToNextTier) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: tierProgressPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 차트 영역 -->
      <div class="charts-grid">
        <!-- 월별 커미션 차트 -->
        <div class="chart-card">
          <h3 class="chart-title">
            <i class="fas fa-chart-bar"></i>
            월별 커미션 현황
          </h3>
          <div class="chart-wrapper">
            <canvas ref="monthlyChartRef"></canvas>
          </div>
        </div>

        <!-- 분기별 비교 차트 -->
        <div class="chart-card">
          <h3 class="chart-title">
            <i class="fas fa-chart-pie"></i>
            분기별 커미션 비교
          </h3>
          <div class="chart-wrapper quarter">
            <canvas ref="quarterlyChartRef"></canvas>
          </div>
          <div class="quarter-legend">
            <div v-for="(item, index) in quarterlyData" :key="index" class="legend-item">
              <span class="legend-dot" :style="{ background: quarterColors[index] }"></span>
              <span class="legend-label">{{ item.quarterLabel }}</span>
              <span class="legend-value">{{ formatCurrency(item.commissionAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 월별 상세 테이블 -->
      <div class="detail-table-card">
        <h3 class="table-title">
          <i class="fas fa-calendar-alt"></i>
          월별 상세 내역
        </h3>
        <div class="table-container">
          <table class="detail-table">
            <thead>
              <tr>
                <th>월</th>
                <th>매출액</th>
                <th>커미션 금액</th>
                <th>지급 금액</th>
                <th>미지급 금액</th>
                <th>지급률</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in monthlyData" :key="item.month">
                <td class="month-cell">
                  <span class="month-badge">{{ item.month }}월</span>
                </td>
                <td class="text-right">{{ formatCurrency(item.salesAmount) }}</td>
                <td class="text-right commission">{{ formatCurrency(item.commissionAmount) }}</td>
                <td class="text-right paid">{{ formatCurrency(item.paidAmount) }}</td>
                <td class="text-right unpaid">{{ formatCurrency(item.unpaidAmount) }}</td>
                <td class="text-center">
                  <div class="mini-progress">
                    <div
                      class="mini-progress-fill"
                      :style="{ width: getMonthPaymentRate(item) + '%' }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ getMonthPaymentRate(item) }}%</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="text-center"><strong>합계</strong></td>
                <td class="text-right"><strong>{{ formatCurrency(summary.totalSalesAmount) }}</strong></td>
                <td class="text-right commission"><strong>{{ formatCurrency(summary.totalCommissionAmount) }}</strong></td>
                <td class="text-right paid"><strong>{{ formatCurrency(summary.totalPaidAmount) }}</strong></td>
                <td class="text-right unpaid"><strong>{{ formatCurrency(summary.totalUnpaidAmount) }}</strong></td>
                <td class="text-center"><strong>{{ paymentRate }}%</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 빠른 링크 -->
      <div class="quick-links">
        <NuxtLink to="/admin/commission/rates" class="quick-link-card">
          <div class="link-icon blue">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="link-content">
            <span class="link-title">커미션율 설정</span>
            <span class="link-desc">연도별 커미션율 구간 관리</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </NuxtLink>
        <NuxtLink to="/admin/commission/settlements" class="quick-link-card">
          <div class="link-icon green">
            <i class="fas fa-list-alt"></i>
          </div>
          <div class="link-content">
            <span class="link-title">정산 이력</span>
            <span class="link-desc">계약별 커미션 정산 현황</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </NuxtLink>
        <NuxtLink to="/admin/commission/payments" class="quick-link-card">
          <div class="link-icon purple">
            <i class="fas fa-credit-card"></i>
          </div>
          <div class="link-content">
            <span class="link-title">지급 관리</span>
            <span class="link-desc">커미션 지급 이력 관리</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useCommissionStore } from '~/stores/commission'
import { formatCurrency } from '~/utils/format'
import type { AnnualCommissionSummary, MonthlyCommissionData, QuarterlyCommissionData } from '~/types/commission'

// Chart.js dynamic import
let Chart: any = null

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션 대시보드'
})

const commissionStore = useCommissionStore()

// State
const loading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const monthlyChartRef = ref<HTMLCanvasElement | null>(null)
const quarterlyChartRef = ref<HTMLCanvasElement | null>(null)
let monthlyChart: any = null
let quarterlyChart: any = null

// Chart colors
const quarterColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

// Computed
const currentYear = new Date().getFullYear()
const minYear = currentYear - 4
const maxYear = currentYear + 1

const summary = computed<AnnualCommissionSummary>(() => commissionStore.annualSummary || {
  year: selectedYear.value,
  totalSalesAmount: 0,
  totalCommissionAmount: 0,
  totalPaidAmount: 0,
  totalUnpaidAmount: 0,
  averageCommissionRate: 0,
  monthlyData: [],
  quarterlyData: [],
  settlements: []
})

const monthlyData = computed(() => summary.value.monthlyData || [])
const quarterlyData = computed(() => summary.value.quarterlyData || [])

const paymentRate = computed(() => {
  if (!summary.value.totalCommissionAmount) return 0
  return Math.round((summary.value.totalPaidAmount / summary.value.totalCommissionAmount) * 100)
})

const tierProgressPercent = computed(() => {
  if (!summary.value.currentTier || !summary.value.amountToNextTier) return 0
  const currentAmount = summary.value.totalSalesAmount
  const tierMin = summary.value.currentTier.minAmount
  const toNext = summary.value.amountToNextTier
  const tierRange = currentAmount - tierMin + toNext
  return Math.min(100, Math.round(((currentAmount - tierMin) / tierRange) * 100))
})

// Methods
const changeYear = (delta: number) => {
  selectedYear.value += delta
  loadDashboard()
}

const loadDashboard = async () => {
  loading.value = true
  try {
    await commissionStore.fetchAnnualSummary(selectedYear.value)
  } catch (error) {
    console.error('대시보드 조회 실패:', error)
  } finally {
    loading.value = false
    await nextTick()
    renderCharts()
  }
}

const getMonthPaymentRate = (item: MonthlyCommissionData): number => {
  if (!item.commissionAmount) return 0
  return Math.round((item.paidAmount / item.commissionAmount) * 100)
}

const renderCharts = async () => {
  // Dynamic import Chart.js
  if (!Chart) {
    const chartModule = await import('chart.js/auto')
    Chart = chartModule.default
  }

  // Monthly Bar Chart
  if (monthlyChartRef.value) {
    if (monthlyChart) {
      monthlyChart.destroy()
    }

    const labels = monthlyData.value.map(d => `${d.month}월`)
    const commissionData = monthlyData.value.map(d => d.commissionAmount)
    const paidData = monthlyData.value.map(d => d.paidAmount)

    monthlyChart = new Chart(monthlyChartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '커미션',
            data: commissionData,
            backgroundColor: '#8b5cf6',
            borderRadius: 4
          },
          {
            label: '지급',
            data: paidData,
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => formatCurrency(value)
            }
          }
        }
      }
    })
  }

  // Quarterly Doughnut Chart
  if (quarterlyChartRef.value) {
    if (quarterlyChart) {
      quarterlyChart.destroy()
    }

    const data = quarterlyData.value.map(d => d.commissionAmount)

    quarterlyChart = new Chart(quarterlyChartRef.value, {
      type: 'doughnut',
      data: {
        labels: quarterlyData.value.map(d => d.quarterLabel),
        datasets: [{
          data,
          backgroundColor: quarterColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${formatCurrency(context.raw)}`
            }
          }
        },
        cutout: '60%'
      }
    })
  }
}

// Watch
watch(selectedYear, () => {
  loadDashboard()
})

// Lifecycle
onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

/* 연도 선택 */
.year-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.year-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.year-nav:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
}

.year-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.year-display {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  min-width: 80px;
  text-align: center;
}

/* 로딩 컨테이너 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #8b5cf6;
}

/* KPI 섹션 */
.kpi-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  padding: 1.5rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.kpi-card.primary::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.kpi-card.success::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.kpi-card.info::before { background: linear-gradient(90deg, #10b981, #34d399); }
.kpi-card.warning::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 1.125rem;
}

.kpi-card.primary .kpi-icon { background: #eff6ff; color: #3b82f6; }
.kpi-card.success .kpi-icon { background: #faf5ff; color: #8b5cf6; }
.kpi-card.info .kpi-icon { background: #f0fdf4; color: #10b981; }
.kpi-card.warning .kpi-icon { background: #fffbeb; color: #f59e0b; }

.kpi-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.kpi-footer {
  font-size: 0.8125rem;
}

.kpi-sub { color: #9ca3af; }
.kpi-rate { color: #8b5cf6; font-weight: 600; }
.kpi-progress { color: #10b981; font-weight: 600; }
.kpi-remaining { color: #f59e0b; font-weight: 600; }

/* 현재 구간 카드 */
.tier-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 1px solid #e9d5ff;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.tier-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #8b5cf6;
}

.tier-detail {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.tier-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.tier-rate {
  font-size: 2rem;
  font-weight: 800;
  color: #8b5cf6;
}

.tier-range {
  font-size: 0.875rem;
  color: #6b7280;
}

.tier-progress {
  flex: 1;
  max-width: 300px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.progress-label .amount {
  font-weight: 600;
  color: #8b5cf6;
}

.progress-bar {
  height: 8px;
  background: #e9d5ff;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 4px;
  transition: width 0.3s;
}

/* 차트 그리드 */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-title i {
  color: #8b5cf6;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-wrapper.quarter {
  height: 200px;
}

.quarter-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  color: #6b7280;
  flex: 1;
}

.legend-value {
  font-weight: 600;
  color: #1f2937;
}

/* 상세 테이블 */
.detail-table-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.table-title i {
  color: #8b5cf6;
}

.table-container {
  overflow-x: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  padding: 0.875rem 1rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
}

.detail-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.detail-table tr:hover {
  background: #f9fafb;
}

.detail-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.text-right { text-align: right; }
.text-center { text-align: center; }

.month-cell {
  text-align: center;
}

.month-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 12px;
  font-weight: 600;
  color: #374151;
}

.commission { color: #8b5cf6; font-weight: 600; }
.paid { color: #10b981; font-weight: 600; }
.unpaid { color: #f59e0b; font-weight: 600; }

/* 미니 프로그레스 */
.mini-progress {
  width: 60px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: 0.5rem;
}

.mini-progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 빠른 링크 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: all 0.2s;
}

.quick-link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 1.25rem;
}

.link-icon.blue { background: #eff6ff; color: #3b82f6; }
.link-icon.green { background: #f0fdf4; color: #10b981; }
.link-icon.purple { background: #faf5ff; color: #8b5cf6; }

.link-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.link-title {
  font-weight: 600;
  color: #1f2937;
}

.link-desc {
  font-size: 0.8125rem;
  color: #6b7280;
}

.quick-link-card > i {
  color: #d1d5db;
}

/* 반응형 */
@media (max-width: 1280px) {
  .kpi-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .tier-info-card {
    flex-direction: column;
    align-items: stretch;
  }

  .tier-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .tier-progress {
    max-width: 100%;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .kpi-section {
    grid-template-columns: 1fr;
  }
}
</style>
