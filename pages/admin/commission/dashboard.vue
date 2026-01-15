<template>
  <div class="distribution-dashboard">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="수익 배분 대시보드"
      description="연간 매출 및 수익 배분 현황을 한눈에 파악합니다."
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
            <span class="kpi-sub">수익 배분 기준</span>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <span class="kpi-label">현재 지분율 구간</span>
          </div>
          <div class="kpi-value tier-value">{{ summary.currentTier?.tierName || '-' }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub">{{ getTierRange() }}</span>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-coins"></i>
            </div>
            <span class="kpi-label">총 배분 금액</span>
          </div>
          <div class="kpi-value">{{ formatCurrency(totalDistributionAmount) }}</div>
          <div class="kpi-footer">
            <span class="kpi-progress">지급 {{ paymentRate }}% 완료</span>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-hourglass-half"></i>
            </div>
            <span class="kpi-label">미지급 합계</span>
          </div>
          <div class="kpi-value">{{ formatCurrency(summary.totalUnpaidAmount) }}</div>
          <div class="kpi-footer">
            <span class="kpi-remaining">잔여 {{ 100 - paymentRate }}%</span>
          </div>
        </div>
      </div>

      <!-- 지분율 구조 섹션 -->
      <div class="share-structure-card">
        <div class="share-header">
          <h3 class="section-title">
            <i class="fas fa-chart-pie"></i>
            현재 적용 지분율 구조
          </h3>
          <div class="tier-badge">
            <i class="fas fa-tag"></i>
            {{ summary.currentTier?.tierName || '기본 구간' }}
          </div>
        </div>
        <div class="share-content">
          <div class="share-chart-wrapper">
            <canvas ref="shareChartRef"></canvas>
          </div>
          <div class="share-legend">
            <div
              v-for="(dist, index) in summary.totalDistributions"
              :key="dist.stakeholder"
              class="legend-row"
            >
              <span class="legend-dot" :style="{ background: stakeholderColors[index] }"></span>
              <span class="legend-name">{{ dist.name }}</span>
              <span class="legend-rate">{{ dist.rate }}%</span>
              <span class="legend-amount">{{ formatCurrency(dist.amount) }}</span>
              <span class="legend-status" :class="getPaymentStatusClass(dist)">
                {{ getPaymentStatusText(dist) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 영역 -->
      <div class="charts-grid">
        <!-- 월별 매출 & 배분 차트 -->
        <div class="chart-card">
          <h3 class="chart-title">
            <i class="fas fa-chart-bar"></i>
            월별 매출 및 배분 현황
          </h3>
          <div class="chart-wrapper">
            <canvas ref="monthlyChartRef"></canvas>
          </div>
        </div>

        <!-- 지분자별 배분 비교 차트 -->
        <div class="chart-card">
          <h3 class="chart-title">
            <i class="fas fa-balance-scale"></i>
            지분자별 총 배분
          </h3>
          <div class="chart-wrapper bar">
            <canvas ref="stakeholderChartRef"></canvas>
          </div>
        </div>
      </div>

      <!-- 월별 상세 테이블 -->
      <div class="detail-table-card">
        <h3 class="table-title">
          <i class="fas fa-calendar-alt"></i>
          월별 수익 배분 상세
        </h3>
        <div class="table-container">
          <table class="detail-table">
            <thead>
              <tr>
                <th>월</th>
                <th>매출액</th>
                <th class="stakeholder-col manufacturer">제조사 (64%)</th>
                <th class="stakeholder-col headquarters">본사 (10%)</th>
                <th class="stakeholder-col agent">대리점 (15%)</th>
                <th class="stakeholder-col partner">협력사 (11%)</th>
                <th>지급 상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in monthlyData" :key="item.month">
                <td class="month-cell">
                  <span class="month-badge">{{ item.month }}월</span>
                </td>
                <td class="text-right">{{ formatCurrency(item.salesAmount) }}</td>
                <td class="text-right manufacturer">
                  {{ formatCurrency(getDistributionAmount(item, 'MANUFACTURER')) }}
                </td>
                <td class="text-right headquarters">
                  {{ formatCurrency(getDistributionAmount(item, 'HEADQUARTERS')) }}
                </td>
                <td class="text-right agent">
                  {{ formatCurrency(getDistributionAmount(item, 'AGENT')) }}
                </td>
                <td class="text-right partner">
                  {{ formatCurrency(getDistributionAmount(item, 'PARTNER')) }}
                </td>
                <td class="text-center">
                  <span :class="['payment-status-badge', getMonthPaymentStatusClass(item)]">
                    {{ getMonthPaymentStatusText(item) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="text-center"><strong>합계</strong></td>
                <td class="text-right"><strong>{{ formatCurrency(summary.totalSalesAmount) }}</strong></td>
                <td class="text-right manufacturer">
                  <strong>{{ formatCurrency(getTotalByStakeholder('MANUFACTURER')) }}</strong>
                </td>
                <td class="text-right headquarters">
                  <strong>{{ formatCurrency(getTotalByStakeholder('HEADQUARTERS')) }}</strong>
                </td>
                <td class="text-right agent">
                  <strong>{{ formatCurrency(getTotalByStakeholder('AGENT')) }}</strong>
                </td>
                <td class="text-right partner">
                  <strong>{{ formatCurrency(getTotalByStakeholder('PARTNER')) }}</strong>
                </td>
                <td class="text-center"><strong>{{ paymentRate }}%</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 빠른 링크 -->
      <div class="quick-links">
        <NuxtLink to="/admin/system/commission-rates" class="quick-link-card">
          <div class="link-icon blue">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="link-content">
            <span class="link-title">지분율 설정</span>
            <span class="link-desc">연도별 지분율 구간 관리</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </NuxtLink>
        <NuxtLink to="/admin/commission/settlements" class="quick-link-card">
          <div class="link-icon green">
            <i class="fas fa-list-alt"></i>
          </div>
          <div class="link-content">
            <span class="link-title">정산 이력</span>
            <span class="link-desc">지분자별 정산 현황</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </NuxtLink>
        <NuxtLink to="/admin/commission/payments" class="quick-link-card">
          <div class="link-icon purple">
            <i class="fas fa-credit-card"></i>
          </div>
          <div class="link-content">
            <span class="link-title">지급 관리</span>
            <span class="link-desc">지분자별 지급 이력 관리</span>
          </div>
          <i class="fas fa-chevron-right"></i>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { formatCurrency } from '~/utils/format'
import type {
  Stakeholder,
  StakeholderDistribution,
  MonthlyDistribution,
  AnnualDistributionSummary,
  ShareTier
} from '~/types/commission'

// Chart.js dynamic import
let Chart: any = null

definePageMeta({
  layout: 'admin',
  pageTitle: '수익 배분 대시보드'
})

// State
const loading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const monthlyChartRef = ref<HTMLCanvasElement | null>(null)
const shareChartRef = ref<HTMLCanvasElement | null>(null)
const stakeholderChartRef = ref<HTMLCanvasElement | null>(null)
let monthlyChart: any = null
let shareChart: any = null
let stakeholderChart: any = null

// 목업 데이터 사용 여부 (UI 테스트용)
const useMockData = ref(true)

// 지분자 색상
const stakeholderColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b']

// 목업 데이터 정의 - 수익 배분 구조
const mockDistributionSummary: AnnualDistributionSummary = {
  year: 2026,
  totalSalesAmount: 2_850_000_000, // 28억 5천만원
  currentTier: {
    tierId: 2,
    year: 2026,
    tierName: '10억~50억 구간',
    minAmount: 1_000_000_000,
    maxAmount: 5_000_000_000,
    rates: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11 }
    ]
  },
  totalDistributions: [
    { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 1_824_000_000, paidAmount: 1_824_000_000, unpaidAmount: 0 },
    { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 285_000_000, paidAmount: 285_000_000, unpaidAmount: 0 },
    { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 427_500_000, paidAmount: 256_500_000, unpaidAmount: 171_000_000 },
    { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 313_500_000, paidAmount: 200_000_000, unpaidAmount: 113_500_000 }
  ],
  totalUnpaidAmount: 284_500_000,
  monthlyData: [
    { year: 2026, month: 1, yearMonth: '2026-01', salesAmount: 180_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 115_200_000, paidAmount: 115_200_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 18_000_000, paidAmount: 18_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 27_000_000, paidAmount: 27_000_000, unpaidAmount: 0 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 19_800_000, paidAmount: 19_800_000, unpaidAmount: 0 }
    ]},
    { year: 2026, month: 2, yearMonth: '2026-02', salesAmount: 220_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 140_800_000, paidAmount: 140_800_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 22_000_000, paidAmount: 22_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 33_000_000, paidAmount: 33_000_000, unpaidAmount: 0 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 24_200_000, paidAmount: 24_200_000, unpaidAmount: 0 }
    ]},
    { year: 2026, month: 3, yearMonth: '2026-03', salesAmount: 250_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 160_000_000, paidAmount: 160_000_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 25_000_000, paidAmount: 25_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 37_500_000, paidAmount: 37_500_000, unpaidAmount: 0 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 27_500_000, paidAmount: 27_500_000, unpaidAmount: 0 }
    ]},
    { year: 2026, month: 4, yearMonth: '2026-04', salesAmount: 280_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 179_200_000, paidAmount: 179_200_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 28_000_000, paidAmount: 28_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 42_000_000, paidAmount: 42_000_000, unpaidAmount: 0 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 30_800_000, paidAmount: 30_800_000, unpaidAmount: 0 }
    ]},
    { year: 2026, month: 5, yearMonth: '2026-05', salesAmount: 200_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 128_000_000, paidAmount: 128_000_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 20_000_000, paidAmount: 20_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 30_000_000, paidAmount: 30_000_000, unpaidAmount: 0 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 22_000_000, paidAmount: 22_000_000, unpaidAmount: 0 }
    ]},
    { year: 2026, month: 6, yearMonth: '2026-06', salesAmount: 320_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 204_800_000, paidAmount: 204_800_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 32_000_000, paidAmount: 32_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 48_000_000, paidAmount: 48_000_000, unpaidAmount: 0 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 35_200_000, paidAmount: 35_200_000, unpaidAmount: 0 }
    ]},
    { year: 2026, month: 7, yearMonth: '2026-07', salesAmount: 290_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 185_600_000, paidAmount: 185_600_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 29_000_000, paidAmount: 29_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 43_500_000, paidAmount: 39_000_000, unpaidAmount: 4_500_000 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 31_900_000, paidAmount: 20_000_000, unpaidAmount: 11_900_000 }
    ]},
    { year: 2026, month: 8, yearMonth: '2026-08', salesAmount: 240_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 153_600_000, paidAmount: 153_600_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 24_000_000, paidAmount: 24_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 36_000_000, paidAmount: 0, unpaidAmount: 36_000_000 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 26_400_000, paidAmount: 0, unpaidAmount: 26_400_000 }
    ]},
    { year: 2026, month: 9, yearMonth: '2026-09', salesAmount: 270_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 172_800_000, paidAmount: 172_800_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 27_000_000, paidAmount: 27_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 40_500_000, paidAmount: 0, unpaidAmount: 40_500_000 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 29_700_000, paidAmount: 0, unpaidAmount: 29_700_000 }
    ]},
    { year: 2026, month: 10, yearMonth: '2026-10', salesAmount: 210_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 134_400_000, paidAmount: 134_400_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 21_000_000, paidAmount: 21_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 31_500_000, paidAmount: 0, unpaidAmount: 31_500_000 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 23_100_000, paidAmount: 0, unpaidAmount: 23_100_000 }
    ]},
    { year: 2026, month: 11, yearMonth: '2026-11', salesAmount: 190_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 121_600_000, paidAmount: 121_600_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 19_000_000, paidAmount: 19_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 28_500_000, paidAmount: 0, unpaidAmount: 28_500_000 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 20_900_000, paidAmount: 0, unpaidAmount: 20_900_000 }
    ]},
    { year: 2026, month: 12, yearMonth: '2026-12', salesAmount: 200_000_000, distributions: [
      { stakeholder: 'MANUFACTURER', name: '제조사', rate: 64, amount: 128_000_000, paidAmount: 128_000_000, unpaidAmount: 0 },
      { stakeholder: 'HEADQUARTERS', name: '본사', rate: 10, amount: 20_000_000, paidAmount: 20_000_000, unpaidAmount: 0 },
      { stakeholder: 'AGENT', name: '대리점', rate: 15, amount: 30_000_000, paidAmount: 0, unpaidAmount: 30_000_000 },
      { stakeholder: 'PARTNER', name: '협력사', rate: 11, amount: 22_000_000, paidAmount: 0, unpaidAmount: 22_000_000 }
    ]}
  ]
}

// Computed
const currentYear = new Date().getFullYear()
const minYear = currentYear - 4
const maxYear = currentYear + 1

const summary = computed<AnnualDistributionSummary>(() => {
  if (useMockData.value) {
    return mockDistributionSummary
  }
  // 실제 데이터 사용 시 store에서 가져옴
  return mockDistributionSummary // TODO: 실제 API 연동
})

const monthlyData = computed(() => summary.value.monthlyData || [])

const totalDistributionAmount = computed(() => {
  return summary.value.totalDistributions?.reduce((sum, d) => sum + d.amount, 0) || 0
})

const totalPaidAmount = computed(() => {
  return summary.value.totalDistributions?.reduce((sum, d) => sum + d.paidAmount, 0) || 0
})

const paymentRate = computed(() => {
  if (!totalDistributionAmount.value) return 0
  return Math.round((totalPaidAmount.value / totalDistributionAmount.value) * 100)
})

// Methods
const changeYear = (delta: number) => {
  selectedYear.value += delta
  loadDashboard()
}

const getTierRange = () => {
  const tier = summary.value.currentTier
  if (!tier) return '-'
  const min = formatCurrency(tier.minAmount)
  const max = tier.maxAmount ? formatCurrency(tier.maxAmount) : '무제한'
  return `${min} ~ ${max}`
}

const getPaymentStatusClass = (dist: StakeholderDistribution) => {
  if (dist.unpaidAmount === 0) return 'completed'
  if (dist.paidAmount === 0) return 'pending'
  return 'partial'
}

const getPaymentStatusText = (dist: StakeholderDistribution) => {
  if (dist.unpaidAmount === 0) return '완료'
  if (dist.paidAmount === 0) return '미지급'
  return '일부지급'
}

const getDistributionAmount = (item: MonthlyDistribution, stakeholder: Stakeholder): number => {
  const dist = item.distributions.find(d => d.stakeholder === stakeholder)
  return dist?.amount || 0
}

const getTotalByStakeholder = (stakeholder: Stakeholder): number => {
  const dist = summary.value.totalDistributions?.find(d => d.stakeholder === stakeholder)
  return dist?.amount || 0
}

const getMonthPaymentStatusClass = (item: MonthlyDistribution) => {
  const totalUnpaid = item.distributions.reduce((sum, d) => sum + d.unpaidAmount, 0)
  const totalPaid = item.distributions.reduce((sum, d) => sum + d.paidAmount, 0)
  if (totalUnpaid === 0) return 'completed'
  if (totalPaid === 0) return 'pending'
  return 'partial'
}

const getMonthPaymentStatusText = (item: MonthlyDistribution) => {
  const totalUnpaid = item.distributions.reduce((sum, d) => sum + d.unpaidAmount, 0)
  const totalPaid = item.distributions.reduce((sum, d) => sum + d.paidAmount, 0)
  if (totalUnpaid === 0) return '완료'
  if (totalPaid === 0) return '미지급'
  return '일부지급'
}

const loadDashboard = async () => {
  loading.value = true
  try {
    // TODO: 실제 API 호출
    await new Promise(resolve => setTimeout(resolve, 300))
  } catch (error) {
    console.error('대시보드 조회 실패:', error)
  } finally {
    loading.value = false
    await nextTick()
    renderCharts()
  }
}

const renderCharts = async () => {
  // Dynamic import Chart.js
  if (!Chart) {
    const chartModule = await import('chart.js/auto')
    Chart = chartModule.default
  }

  // 지분율 도넛 차트
  if (shareChartRef.value) {
    if (shareChart) shareChart.destroy()

    const data = summary.value.totalDistributions?.map(d => d.rate) || []
    const labels = summary.value.totalDistributions?.map(d => d.name) || []

    shareChart = new Chart(shareChartRef.value, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: stakeholderColors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${context.raw}%`
            }
          }
        },
        cutout: '65%'
      }
    })
  }

  // 월별 매출 차트 (Stacked Bar)
  if (monthlyChartRef.value) {
    if (monthlyChart) monthlyChart.destroy()

    const labels = monthlyData.value.map(d => `${d.month}월`)

    monthlyChart = new Chart(monthlyChartRef.value, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '제조사',
            data: monthlyData.value.map(d => getDistributionAmount(d, 'MANUFACTURER')),
            backgroundColor: stakeholderColors[0],
            stack: 'distribution'
          },
          {
            label: '본사',
            data: monthlyData.value.map(d => getDistributionAmount(d, 'HEADQUARTERS')),
            backgroundColor: stakeholderColors[1],
            stack: 'distribution'
          },
          {
            label: '대리점',
            data: monthlyData.value.map(d => getDistributionAmount(d, 'AGENT')),
            backgroundColor: stakeholderColors[2],
            stack: 'distribution'
          },
          {
            label: '협력사',
            data: monthlyData.value.map(d => getDistributionAmount(d, 'PARTNER')),
            backgroundColor: stakeholderColors[3],
            stack: 'distribution'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: (value: any) => formatCurrency(value)
            }
          }
        }
      }
    })
  }

  // 지분자별 배분 수평 막대 차트
  if (stakeholderChartRef.value) {
    if (stakeholderChart) stakeholderChart.destroy()

    const distributions = summary.value.totalDistributions || []

    stakeholderChart = new Chart(stakeholderChartRef.value, {
      type: 'bar',
      data: {
        labels: distributions.map(d => d.name),
        datasets: [
          {
            label: '지급완료',
            data: distributions.map(d => d.paidAmount),
            backgroundColor: '#10b981'
          },
          {
            label: '미지급',
            data: distributions.map(d => d.unpaidAmount),
            backgroundColor: '#f59e0b'
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: (value: any) => formatCurrency(value)
            }
          },
          y: { stacked: true }
        }
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
  color: #6366f1;
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
.kpi-card.info::before { background: linear-gradient(90deg, #6366f1, #818cf8); }
.kpi-card.success::before { background: linear-gradient(90deg, #10b981, #34d399); }
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
.kpi-card.info .kpi-icon { background: #eef2ff; color: #6366f1; }
.kpi-card.success .kpi-icon { background: #f0fdf4; color: #10b981; }
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

.kpi-value.tier-value {
  font-size: 1.25rem;
  color: #6366f1;
}

.kpi-footer {
  font-size: 0.8125rem;
}

.kpi-sub { color: #9ca3af; }
.kpi-progress { color: #10b981; font-weight: 600; }
.kpi-remaining { color: #f59e0b; font-weight: 600; }

/* 지분율 구조 카드 */
.share-structure-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #6366f1;
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #eef2ff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6366f1;
}

.share-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  align-items: center;
}

.share-chart-wrapper {
  height: 180px;
  position: relative;
}

.share-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-row {
  display: grid;
  grid-template-columns: 16px 80px 50px 1fr 80px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-name {
  font-weight: 600;
  color: #374151;
}

.legend-rate {
  font-weight: 700;
  color: #6366f1;
}

.legend-amount {
  text-align: right;
  font-weight: 600;
  color: #1f2937;
}

.legend-status {
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.legend-status.completed {
  background: #dcfce7;
  color: #16a34a;
}

.legend-status.partial {
  background: #fef3c7;
  color: #d97706;
}

.legend-status.pending {
  background: #fee2e2;
  color: #dc2626;
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
  color: #6366f1;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-wrapper.bar {
  height: 250px;
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
  color: #6366f1;
}

.table-container {
  overflow-x: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  padding: 0.875rem 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.detail-table th.stakeholder-col {
  font-size: 0.75rem;
}

.detail-table th.manufacturer { color: #6366f1; }
.detail-table th.headquarters { color: #3b82f6; }
.detail-table th.agent { color: #10b981; }
.detail-table th.partner { color: #f59e0b; }

.detail-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.8125rem;
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

.manufacturer { color: #6366f1; font-weight: 600; }
.headquarters { color: #3b82f6; font-weight: 600; }
.agent { color: #10b981; font-weight: 600; }
.partner { color: #f59e0b; font-weight: 600; }

/* 지급 상태 배지 */
.payment-status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.payment-status-badge.completed {
  background: #dcfce7;
  color: #16a34a;
}

.payment-status-badge.partial {
  background: #fef3c7;
  color: #d97706;
}

.payment-status-badge.pending {
  background: #fee2e2;
  color: #dc2626;
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
.link-icon.purple { background: #eef2ff; color: #6366f1; }

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

  .share-content {
    grid-template-columns: 160px 1fr;
  }
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .share-content {
    grid-template-columns: 1fr;
  }

  .share-chart-wrapper {
    max-width: 200px;
    margin: 0 auto;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .kpi-section {
    grid-template-columns: 1fr;
  }

  .legend-row {
    grid-template-columns: 16px 1fr 50px;
    gap: 0.5rem;
  }

  .legend-amount,
  .legend-status {
    display: none;
  }
}
</style>
