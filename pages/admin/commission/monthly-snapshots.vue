<template>
  <div class="monthly-snapshots">
    <PageHeader
      title="월별 수익배분"
      icon="chart"
      icon-color="green"
      description="연도별 월별 매출 및 수익배분 현황을 확인합니다."
    />

    <!-- 필터 영역 -->
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>연도</label>
          <select v-model="selectedYear" class="form-select" @change="loadData">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn-excel" @click="handleExcelDownload">
            <i class="fas fa-file-excel" />
            엑셀
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" />
      <p>데이터를 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- KPI 카드 -->
      <div class="summary-cards">
        <div class="summary-card kpi-primary">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-chart-line" />
            </div>
            <span class="kpi-label">연간 총매출</span>
          </div>
          <div class="kpi-value">
            {{ formatCurrency(totalSales) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">{{ selectedYear }}년 합계</span>
          </div>
        </div>
        <div class="summary-card kpi-info">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-layer-group" />
            </div>
            <span class="kpi-label">현재 적용 구간</span>
          </div>
          <div class="kpi-value tier-value">
            {{ currentTier }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">최종 월 기준</span>
          </div>
        </div>
        <div class="summary-card kpi-success">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-coins" />
            </div>
            <span class="kpi-label">총 배분액</span>
          </div>
          <div class="kpi-value">
            {{ formatCurrency(totalCommission) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">전체 배분 합계</span>
          </div>
        </div>
        <div class="summary-card kpi-warning">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-file-invoice" />
            </div>
            <span class="kpi-label">정산 건수</span>
          </div>
          <div class="kpi-value">
            {{ totalCount }}건
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">{{ selectedYear }}년 합계</span>
          </div>
        </div>
      </div>

      <!-- 월별 테이블 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">
                월
              </th>
              <th style="width: 80px;">
                정산건수
              </th>
              <th style="width: 120px;">
                월매출
              </th>
              <th style="width: 130px;">
                누적매출
              </th>
              <th style="width: 90px;">
                적용구간
              </th>
              <th style="width: 70px;">
                OEM(%)
              </th>
              <th style="width: 70px;">
                CEO(%)
              </th>
              <th style="width: 80px;">
                에코암스(%)
              </th>
              <th style="width: 70px;">
                영업(%)
              </th>
              <th style="width: 80px;">
                인증관리(%)
              </th>
              <th style="width: 80px;">
                유지보수(%)
              </th>
              <th style="width: 120px;">
                총배분액
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- 데이터 없음 -->
            <tr v-if="monthlyData.length === 0">
              <td colspan="12" class="text-center" style="padding: 20px; color: #9ca3af;">
                해당 연도의 정산 데이터가 없습니다.
              </td>
            </tr>
            <!-- 월별 데이터 -->
            <tr
              v-for="row in monthlyData"
              :key="row.month"
              :class="{ 'tier-change-row': isTierChangeMonth(row) }"
            >
              <td class="text-center">
                {{ row.month }}월
              </td>
              <td class="text-center">
                {{ row.settlementCount }}건
              </td>
              <td class="text-right">
                {{ formatCurrency(row.monthlySalesAmount) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(row.cumulativeSalesAmount) }}
              </td>
              <td class="text-center">
                <span class="tier-badge" :class="tierClass(row.appliedTier)">
                  {{ tierLabel(row.appliedTier) }}
                </span>
              </td>
              <td class="text-center">
                {{ row.appliedOemRate }}%
              </td>
              <td class="text-center">
                {{ row.appliedCeoRate }}%
              </td>
              <td class="text-center">
                {{ row.appliedEcoarmsRate }}%
              </td>
              <td class="text-center">
                {{ row.appliedSalesRate }}%
              </td>
              <td class="text-center">
                {{ row.appliedCertificationRate || 0 }}%
              </td>
              <td class="text-center">
                {{ row.appliedMaintenanceRate || 0 }}%
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(row.totalCommissionAmount) }}
              </td>
            </tr>
            <!-- 합계행 -->
            <tr v-if="monthlyData.length > 0" class="summary-row">
              <td class="text-center font-semibold">
                합계
              </td>
              <td class="text-center font-semibold">
                {{ totalCount }}건
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalSales) }}
              </td>
              <td class="text-center">
                -
              </td>
              <td class="text-center">
                -
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalOem) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalCeo) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalEcoarms) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalSalesRep) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalCertification) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalMaintenance) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totalCommission) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getMonthlySummary, exportMonthlySummaryExcel } from '~/services/commission.service'
import { formatCurrency } from '~/utils/format'

definePageMeta({
  layout: 'admin',
  pageTitle: '월별 수익배분'
})

// 월별 집계 인터페이스
interface MonthlyCommissionSummary {
  year: number
  month: number
  settlementCount: number
  monthlySalesAmount: number
  cumulativeSalesAmount: number
  appliedTier: string
  appliedOemRate: number
  appliedCeoRate: number
  appliedEcoarmsRate: number
  appliedSalesRate: number
  appliedCertificationRate: number
  appliedMaintenanceRate: number
  oemAmount: number
  ceoAmount: number
  ecoarmsAmount: number
  salesRepAmount: number
  certificationAmount: number
  maintenanceAmount: number
  totalCommissionAmount: number
}

// 연도 선택
const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)
const selectedYear = ref(currentYear)

// 상태
const loading = ref(false)
const monthlyData = ref<MonthlyCommissionSummary[]>([])

// 데이터 로드
const loadData = async () => {
  loading.value = true
  try {
    monthlyData.value = await getMonthlySummary(selectedYear.value)
  } catch (error) {
    console.error('월별 집계 조회 실패:', error)
    monthlyData.value = []
  } finally {
    loading.value = false
  }
}

// KPI 계산
const totalSales = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.monthlySalesAmount, 0)
)
const totalCommission = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.totalCommissionAmount, 0)
)
const totalCount = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.settlementCount, 0)
)
const currentTier = computed(() => {
  if (!monthlyData.value.length) { return '-' }
  return tierLabel(monthlyData.value[monthlyData.value.length - 1].appliedTier) || '-'
})

// 합계행 금액 계산
const totalOem = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.oemAmount, 0)
)
const totalCeo = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.ceoAmount, 0)
)
const totalEcoarms = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.ecoarmsAmount, 0)
)
const totalSalesRep = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + m.salesRepAmount, 0)
)
const totalCertification = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + (m.certificationAmount || 0), 0)
)
const totalMaintenance = computed(() =>
  monthlyData.value.reduce((sum, m) => sum + (m.maintenanceAmount || 0), 0)
)

// 구간 변경 월 감지
const isTierChangeMonth = (row: MonthlyCommissionSummary) => {
  const idx = monthlyData.value.indexOf(row)
  if (idx <= 0) { return false }
  return row.appliedTier !== monthlyData.value[idx - 1].appliedTier
}

// 구간 라벨
const tierLabel = (tier: string) => {
  const map: Record<string, string> = {
    UNDER_5B: '50억 미만',
    UNDER_10B: '100억 미만',
    UNDER_15B: '150억 미만',
    OVER_15B: '150억 이상'
  }
  return map[tier] || tier || '-'
}

// 구간 뱃지 클래스
const tierClass = (tier: string) => ({
  'tier-1': tier === 'UNDER_5B',
  'tier-2': tier === 'UNDER_10B',
  'tier-3': tier === 'UNDER_15B',
  'tier-4': tier === 'OVER_15B'
})

// 엑셀 다운로드
const handleExcelDownload = async () => {
  try {
    await exportMonthlySummaryExcel(selectedYear.value)
  } catch {
    alert('엑셀 다운로드에 실패했습니다.')
  }
}

onMounted(() => loadData())
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

/* 로딩 */
.loading-container {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

/* 콘텐츠 영역 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 필터 행 레이아웃 */
.filter-row {
  display: flex;
  gap: 1.25rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 0.625rem;
  align-items: flex-end;
}

.form-select {
  padding: 0.625rem 2rem 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  min-width: 130px;
  width: auto;
}

/* KPI 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.summary-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.2rem;
  border: 1px solid #e5e7eb;
}
.kpi-primary { border-left: 4px solid #3b82f6; }
.kpi-info { border-left: 4px solid #8b5cf6; }
.kpi-success { border-left: 4px solid #10b981; }
.kpi-warning { border-left: 4px solid #f59e0b; }

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.kpi-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #fff;
}
.kpi-primary .kpi-icon { background: #3b82f6; }
.kpi-info .kpi-icon { background: #8b5cf6; }
.kpi-success .kpi-icon { background: #10b981; }
.kpi-warning .kpi-icon { background: #f59e0b; }

.kpi-label { font-size: 0.8rem; color: #6b7280; }
.kpi-value { font-size: 1.3rem; font-weight: 700; color: #1f2937; }
.tier-value { font-size: 1.1rem; }
.kpi-footer { margin-top: 0.3rem; }
.kpi-sub { font-size: 0.75rem; color: #9ca3af; }

/* 구간 변경 행 하이라이트 */
.tier-change-row {
  background-color: #fef9c3 !important;
}
.tier-change-row:hover {
  background-color: #fef08a !important;
}

/* 구간 뱃지 */
.tier-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}
.tier-1 { background: #dbeafe; color: #1e40af; }
.tier-2 { background: #e0e7ff; color: #4338ca; }
.tier-3 { background: #fce7f3; color: #be185d; }
.tier-4 { background: #fee2e2; color: #991b1b; }

/* 합계행 */
.summary-row {
  background-color: #f8fafc !important;
  font-weight: bold;
}
.summary-row:hover {
  background-color: #f1f5f9 !important;
}

.font-semibold { font-weight: 600; }
.text-right { text-align: right; }
.text-center { text-align: center; }

@media (max-width: 768px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
