<template>
  <div class="fund-statistics">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="기성통계"
      description="기성 현황을 통계로 확인합니다."
    >
      <template #actions>
        <div class="period-filter">
          <!-- 기간 타입 탭 -->
          <div class="period-tabs">
            <button
              v-for="tab in periodTabs"
              :key="tab.value"
              :class="['tab-btn', { active: periodType === tab.value }]"
              @click="periodType = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- 개월 선택 (칩 버튼) -->
          <div v-if="periodType === 'MONTHS'" class="option-chips">
            <button
              v-for="m in monthOptions"
              :key="m"
              :class="['chip', { active: selectedMonths === m }]"
              @click="selectedMonths = m"
            >
              {{ m }}개월
            </button>
          </div>

          <!-- 분기 선택 -->
          <div v-if="periodType === 'QUARTER'" class="option-group">
            <select v-model="selectedYear" class="form-select-sm">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}년</option>
            </select>
            <div class="quarter-chips">
              <button
                v-for="q in 4"
                :key="q"
                :class="['chip', { active: selectedQuarter === q }]"
                @click="selectedQuarter = q"
              >
                {{ q }}분기
              </button>
            </div>
          </div>

          <!-- 년도 선택 -->
          <div v-if="periodType === 'YEAR'" class="option-group">
            <select v-model="selectedYear" class="form-select-sm">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}년</option>
            </select>
          </div>

          <!-- 조회 버튼 -->
          <button class="btn-search" @click="loadStatistics">
            <i class="fas fa-search"></i>
            조회
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>통계 데이터를 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 전체 현황 카드 -->
      <div class="overview-section">
        <h3 class="section-title">
          <i class="fas fa-chart-pie"></i>
          전체 현황
        </h3>
        <div class="overview-cards">
          <div class="overview-card blue">
            <div class="card-icon">
              <i class="fas fa-file-invoice-dollar"></i>
            </div>
            <div class="card-content">
              <div class="card-label">총 계약금액</div>
              <div class="card-value">{{ formatCurrency(statistics.totalContractAmount) }}</div>
            </div>
          </div>
          <div class="overview-card green">
            <div class="card-icon">
              <i class="fas fa-hand-holding-usd"></i>
            </div>
            <div class="card-content">
              <div class="card-label">수금 누계</div>
              <div class="card-value">{{ formatCurrency(statistics.totalCollected) }}</div>
              <div class="card-sub">{{ getCollectionRate() }}%</div>
            </div>
          </div>
          <div class="overview-card red">
            <div class="card-icon">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="card-content">
              <div class="card-label">미수금</div>
              <div class="card-value">{{ formatCurrency(statistics.totalOutstanding) }}</div>
            </div>
          </div>
          <div class="overview-card purple">
            <div class="card-icon">
              <i class="fas fa-industry"></i>
            </div>
            <div class="card-content">
              <div class="card-label">OEM 지급액</div>
              <div class="card-value">{{ formatCurrency(statistics.totalOemPaid) }}</div>
            </div>
          </div>
          <div class="overview-card orange">
            <div class="card-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="card-content">
              <div class="card-label">OEM 미지급</div>
              <div class="card-value">{{ formatCurrency(statistics.totalOemOutstanding) }}</div>
            </div>
          </div>
          <div class="overview-card teal">
            <div class="card-icon">
              <i class="fas fa-coins"></i>
            </div>
            <div class="card-content">
              <div class="card-label">현재 수익</div>
              <div class="card-value">{{ formatCurrency(statistics.currentProfit) }}</div>
            </div>
          </div>
          <div class="overview-card indigo">
            <div class="card-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="card-content">
              <div class="card-label">수익률</div>
              <div class="card-value">{{ statistics.profitRate?.toFixed(1) || 0 }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 영역 -->
      <div class="charts-section">
        <div class="chart-container">
          <h3 class="section-title">
            <i class="fas fa-chart-bar"></i>
            월별 수금 현황
          </h3>
          <div class="chart-wrapper">
            <canvas ref="monthlyChartRef"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h3 class="section-title">
            <i class="fas fa-chart-pie"></i>
            기성 진행 현황
          </h3>
          <div class="chart-wrapper donut">
            <canvas ref="progressChartRef"></canvas>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background: #3b82f6;"></span>
              <span>진행중 ({{ statistics.activeCount || 0 }}건)</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #10b981;"></span>
              <span>완료 ({{ statistics.completedCount || 0 }}건)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 계약별 자금 현황 테이블 -->
      <div class="table-section">
        <h3 class="section-title">
          <i class="fas fa-list"></i>
          계약별 자금 현황
        </h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-delivery-no">납품요구번호</th>
                <th class="col-project-name">현장명</th>
                <th class="col-amount">계약금액</th>
                <th class="col-amount">수금액</th>
                <th class="col-amount">미수금</th>
                <th class="col-rate">수금률</th>
                <th class="col-amount">OEM 지급</th>
                <th class="col-amount">수익</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!statistics.fundDetails || statistics.fundDetails.length === 0">
                <td colspan="8" class="no-data">자금 데이터가 없습니다.</td>
              </tr>
              <tr v-else v-for="fund in statistics.fundDetails" :key="fund.fundId">
                <td class="col-delivery-no">
                  <a href="#" @click.prevent="goToFundDetail(fund.fundId)" class="link">
                    {{ fund.deliveryRequestNo }}
                  </a>
                </td>
                <td class="col-project-name text-left" :title="fund.projectName">
                  {{ fund.projectName }}
                </td>
                <td class="col-amount text-right">{{ formatCurrency(fund.totalContractAmount) }}</td>
                <td class="col-amount text-right text-success">{{ formatCurrency(fund.collected) }}</td>
                <td class="col-amount text-right text-danger">{{ formatCurrency(fund.uncollected) }}</td>
                <td class="col-rate text-center">
                  <div class="mini-progress">
                    <div class="mini-progress-bar" :style="{ width: fund.collectionRate + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ fund.collectionRate?.toFixed(1) || 0 }}%</span>
                </td>
                <td class="col-amount text-right">{{ formatCurrency(fund.oemPaid) }}</td>
                <td class="col-amount text-right" :class="(fund.profit ?? 0) >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(fund.profit ?? 0) }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="statistics.fundDetails && statistics.fundDetails.length > 0">
              <tr>
                <td colspan="2" class="text-right"><strong>합계</strong></td>
                <td class="col-amount text-right"><strong>{{ formatCurrency(statistics.totalContractAmount) }}</strong></td>
                <td class="col-amount text-right text-success"><strong>{{ formatCurrency(statistics.totalCollected) }}</strong></td>
                <td class="col-amount text-right text-danger"><strong>{{ formatCurrency(statistics.totalOutstanding) }}</strong></td>
                <td class="col-rate text-center"><strong>{{ getCollectionRate() }}%</strong></td>
                <td class="col-amount text-right"><strong>{{ formatCurrency(statistics.totalOemPaid) }}</strong></td>
                <td class="col-amount text-right" :class="(statistics.currentProfit ?? 0) >= 0 ? 'text-success' : 'text-danger'">
                  <strong>{{ formatCurrency(statistics.currentProfit ?? 0) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from '#imports'
import { fundService } from '~/services/fund.service'
import { formatCurrency } from '~/utils/format'
import type { FundStatistics, FundStatisticsParams, PeriodType } from '~/types/fund'

// Chart.js dynamic import
let Chart: any = null

definePageMeta({
  layout: 'admin',
  pageTitle: '자금 통계'
})

const router = useRouter()

// 현재 분기 계산 헬퍼
function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3)
}

// 기간 타입 탭 옵션
const periodTabs = [
  { value: 'MONTHS' as PeriodType, label: '개월' },
  { value: 'QUARTER' as PeriodType, label: '분기' },
  { value: 'YEAR' as PeriodType, label: '년도' }
]

// 개월 옵션
const monthOptions = [3, 6, 9, 12]

// State
const loading = ref(true)
const periodType = ref<PeriodType>('MONTHS')
const selectedMonths = ref(3)
const selectedQuarter = ref(getCurrentQuarter())
const selectedYear = ref(new Date().getFullYear())
const statistics = ref<FundStatistics>({
  totalFundCount: 0,
  totalContractAmount: 0,
  totalAdvancePayment: 0,
  totalProgressPayment: 0,
  totalBalance: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  totalOemPaid: 0,
  activeCount: 0,
  completedCount: 0,
  totalOemOutstanding: 0,
  currentProfit: 0,
  profitRate: 0,
  monthlyData: []
})

// Chart refs
const monthlyChartRef = ref<HTMLCanvasElement | null>(null)
const progressChartRef = ref<HTMLCanvasElement | null>(null)
let monthlyChart: any = null
let progressChart: any = null

// Available years (최근 5년)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

// Methods
const loadStatistics = async () => {
  loading.value = true
  try {
    const params: FundStatisticsParams = {
      periodType: periodType.value,
    }

    if (periodType.value === 'MONTHS') {
      params.months = selectedMonths.value
    } else if (periodType.value === 'QUARTER') {
      params.year = selectedYear.value
      params.quarter = selectedQuarter.value
    } else {
      params.year = selectedYear.value
    }

    const data = await fundService.getStatistics(params)
    if (data) {
      statistics.value = data
    }
  } catch (error) {
    console.error('통계 조회 실패:', error)
  } finally {
    loading.value = false
    // loading이 false가 된 후 DOM이 업데이트되면 차트 렌더링
    await nextTick()
    renderCharts()
  }
}

const getCollectionRate = (): string => {
  if (!statistics.value.totalContractAmount || statistics.value.totalContractAmount <= 0) return '0.0'
  const rate = (statistics.value.totalCollected / statistics.value.totalContractAmount) * 100
  return rate.toFixed(1)
}

const goToFundDetail = (fundId: number) => {
  router.push(`/admin/funds/${fundId}`)
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

    const monthlyData = statistics.value.monthlyData || []
    const labels = monthlyData.map(d => `${d.month}월`)
    const collectedData = monthlyData.map(d => d.receivedAmount || 0)
    const profitData = monthlyData.map(d => d.profitAmount || 0)

    monthlyChart = new Chart(monthlyChartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '수금액',
            data: collectedData,
            backgroundColor: '#10b981',
            borderRadius: 4,
          },
          {
            label: '수익',
            data: profitData,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.dataset.label}: ${formatCurrency(context.raw)}`
              }
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

  // Progress Donut Chart
  if (progressChartRef.value) {
    if (progressChart) {
      progressChart.destroy()
    }

    const activeCount = statistics.value.activeCount || 0
    const completedCount = statistics.value.completedCount || 0

    progressChart = new Chart(progressChartRef.value, {
      type: 'doughnut',
      data: {
        labels: ['진행중', '완료'],
        datasets: [{
          data: [activeCount, completedCount],
          backgroundColor: ['#3b82f6', '#10b981'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.label}: ${context.raw}건`
              }
            }
          }
        },
        cutout: '60%',
      }
    })
  }
}

// Lifecycle
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

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
}

/* 기간 필터 컨테이너 */
.period-filter {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 기간 타입 탭 */
.period-tabs {
  display: flex;
  background: #e2e8f0;
  border-radius: 6px;
  padding: 2px;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1e40af;
}

.tab-btn.active {
  background: white;
  color: #1e40af;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 옵션 칩 버튼 */
.option-chips,
.quarter-chips {
  display: flex;
  gap: 0.5rem;
}

.chip {
  padding: 0.375rem 0.875rem;
  border: 1px solid #cbd5e1;
  background: white;
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
}

.chip:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.chip.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* 옵션 그룹 */
.option-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* 조회 버튼 */
.btn-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-search:hover {
  background: #1e3a8a;
}

.form-select-sm {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

/* 섹션 타이틀 */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #3b82f6;
}

/* 전체 현황 카드 */
.overview-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f9fafb;
}

.overview-card.blue { background: #eff6ff; }
.overview-card.green { background: #f0fdf4; }
.overview-card.red { background: #fef2f2; }
.overview-card.purple { background: #faf5ff; }
.overview-card.orange { background: #fffbeb; }
.overview-card.teal { background: #f0fdfa; }
.overview-card.indigo { background: #eef2ff; }

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 1rem;
}

.overview-card.blue .card-icon { background: #dbeafe; color: #1d4ed8; }
.overview-card.green .card-icon { background: #dcfce7; color: #16a34a; }
.overview-card.red .card-icon { background: #fee2e2; color: #dc2626; }
.overview-card.purple .card-icon { background: #f3e8ff; color: #9333ea; }
.overview-card.orange .card-icon { background: #fef3c7; color: #d97706; }
.overview-card.teal .card-icon { background: #ccfbf1; color: #0d9488; }
.overview-card.indigo .card-icon { background: #e0e7ff; color: #4f46e5; }

.card-content {
  flex: 1;
  min-width: 0;
}

.card-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.card-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-sub {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 0.125rem;
}

/* 차트 섹션 */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-wrapper.donut {
  height: 200px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.875rem;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.data-table td.text-right {
  text-align: right;
}

.data-table td.text-center {
  text-align: center;
}

.data-table .no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
}

.data-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.text-success {
  color: #059669;
}

.text-danger {
  color: #dc2626;
}

.link {
  color: #3b82f6;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* 미니 프로그레스 바 */
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

.mini-progress-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 테이블 컬럼 폭 설정 */
.col-delivery-no {
  width: 150px;
  min-width: 150px;
  white-space: nowrap;
}

.col-project-name {
  width: auto;
  min-width: 200px;
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-amount {
  width: 110px;
  min-width: 110px;
  white-space: nowrap;
}

.col-rate {
  width: 100px;
  min-width: 100px;
  white-space: nowrap;
}

.data-table td.text-left {
  text-align: left;
}

/* 반응형 */
@media (max-width: 1280px) {
  .overview-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .overview-cards {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>
