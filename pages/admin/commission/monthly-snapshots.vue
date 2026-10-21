<template>
  <div class="monthly-snapshots">
    <PageHeader
      title="월별 수익배분"
      icon="chart"
      icon-color="green"
      description="정산기간의 월별 매출(출하 기준, 입금 무관)과 그 원가로 나눈 수익배분입니다."
    />

    <!-- 필터 영역 -->
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>정산기간</label>
          <select v-model="selectedPeriodId" class="form-select" @change="loadData">
            <option v-for="p in periodOptions" :key="p.periodId" :value="p.periodId">
              {{ p.periodName }}
            </option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn-excel" :disabled="!dist" @click="handleExcelDownload">
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
            <span class="kpi-label">매출 (부가세 제외)</span>
          </div>
          <div class="kpi-value">
            {{ formatCurrency(dist?.netSales || 0) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">부가세 포함 {{ formatCurrency(dist?.grossSales || 0) }}</span>
          </div>
        </div>
        <div class="summary-card kpi-info">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-layer-group" />
            </div>
            <span class="kpi-label">적용 구간</span>
          </div>
          <div class="kpi-value tier-value">
            {{ dist?.tierName || '-' }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">정산기간 매출 기준</span>
          </div>
        </div>
        <div class="summary-card kpi-success">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-hand-holding-usd" />
            </div>
            <span class="kpi-label">에코암스 몫 (남는 몫)</span>
          </div>
          <div class="kpi-value" :class="{ 'amount-negative': totals.agent < 0 }">
            {{ formatCurrency(totals.agent) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">매출 − 원가 − 고정 몫</span>
          </div>
        </div>
        <div class="summary-card kpi-warning">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-file-invoice" />
            </div>
            <span class="kpi-label">출하 건수</span>
          </div>
          <div class="kpi-value">
            {{ dist?.shipmentCount || 0 }}건
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">{{ dist?.periodName || '' }}</span>
          </div>
        </div>
      </div>

      <!-- 월별 테이블 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 90px;">
                연월
              </th>
              <th style="width: 120px;">
                매출(부가세 제외)
              </th>
              <th style="width: 130px;">
                누적 매출
              </th>
              <th style="width: 120px;">
                제조사 원가(운송비 포함)
              </th>
              <th style="width: 110px;">
                대표 {{ rateOf('HEADQUARTERS') }}%
              </th>
              <th style="width: 110px;">
                영업 {{ rateOf('PARTNER') }}%
              </th>
              <th style="width: 100px;">
                인증 {{ rateOf('CERTIFICATION') }}%
              </th>
              <th style="width: 100px;">
                유지보수 {{ rateOf('MAINTENANCE') }}%
              </th>
              <th style="width: 120px;">
                에코암스(남는 몫)
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- 데이터 없음 -->
            <tr v-if="rows.length === 0">
              <td colspan="9" class="text-center" style="padding: 20px; color: #9ca3af;">
                이 정산기간에 출하가 없습니다.
              </td>
            </tr>
            <!-- 월별 데이터 -->
            <tr v-for="row in rows" :key="row.yearMonth">
              <td class="text-center">
                {{ formatYearMonth(row.yearMonth) }}
              </td>
              <td class="text-right">
                {{ formatCurrency(row.netSales) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(row.cumulative) }}
              </td>
              <td class="text-right">
                {{ formatCurrency(row.manufacturerCost) }}
              </td>
              <td class="text-right">
                {{ formatCurrency(row.headquarters) }}
              </td>
              <td class="text-right">
                {{ formatCurrency(row.partner) }}
              </td>
              <td class="text-right">
                {{ formatCurrency(row.certification) }}
              </td>
              <td class="text-right">
                {{ formatCurrency(row.maintenance) }}
              </td>
              <td class="text-right font-semibold" :class="{ 'amount-negative': row.agent < 0 }">
                {{ formatCurrency(row.agent) }}
              </td>
            </tr>
            <!-- 합계행 -->
            <tr v-if="rows.length > 0" class="summary-row">
              <td class="text-center font-semibold">
                합계
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totals.netSales) }}
              </td>
              <td class="text-center">
                -
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totals.manufacturerCost) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totals.headquarters) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totals.partner) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totals.certification) }}
              </td>
              <td class="text-right font-semibold">
                {{ formatCurrency(totals.maintenance) }}
              </td>
              <td class="text-right font-semibold" :class="{ 'amount-negative': totals.agent < 0 }">
                {{ formatCurrency(totals.agent) }}
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
import { getCommissionDistribution, getCommissionPeriods, exportMonthlySummaryExcel } from '~/services/commission.service'
import type { CommissionDistribution, DistributionShareKey } from '~/types/commission'
import { formatCurrency } from '~/utils/format'

definePageMeta({
  layout: 'admin',
  pageTitle: '월별 수익배분'
})

/**
 * 월별 수익배분 — 실원가 기준 (2026-10-21). 수익 배분 대시보드와 같은 계산(서버 CommissionCostService)이다.
 * 예전 화면은 «입금액 × 고정 비율(제조사 60% 포함)»·입력일 기준이었다.
 */

interface PeriodOption {
  periodId: number
  periodName: string
  endYear: number
}
const periodOptions = ref<PeriodOption[]>([])
const selectedPeriodId = ref<number | undefined>(undefined)

const loading = ref(false)
const dist = ref<CommissionDistribution | null>(null)

const loadPeriods = async () => {
  try {
    const periods = await getCommissionPeriods()
    periodOptions.value = periods.map((p: any) => ({ periodId: p.periodId, periodName: p.periodName, endYear: p.endYear }))
    const active = periods.find((p: any) => p.isActive)
    selectedPeriodId.value = active ? active.periodId : periodOptions.value[0]?.periodId
  } catch (error) {
    console.error('정산기간 목록 조회 실패:', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    dist.value = await getCommissionDistribution(selectedPeriodId.value)
  } catch (error) {
    console.error('월별 수익배분 조회 실패:', error)
    dist.value = null
  } finally {
    loading.value = false
  }
}

const rateOf = (key: DistributionShareKey) => dist.value?.shares.find(s => s.key === key)?.configuredRate ?? 0

// 월별 행 + 누적 매출
const rows = computed(() => {
  let cumulative = 0
  return (dist.value?.months || []).map((m) => {
    cumulative += m.netSales
    return { ...m, cumulative }
  })
})

const totals = computed(() => {
  const sum = (field: 'netSales' | 'manufacturerCost' | 'headquarters' | 'partner' | 'certification' | 'maintenance' | 'agent') =>
    rows.value.reduce((acc, r) => acc + (Number(r[field]) || 0), 0)
  return {
    netSales: sum('netSales'),
    manufacturerCost: sum('manufacturerCost'),
    headquarters: sum('headquarters'),
    partner: sum('partner'),
    certification: sum('certification'),
    maintenance: sum('maintenance'),
    agent: sum('agent')
  }
})

const formatYearMonth = (ym: string) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`

// 엑셀 다운로드
const handleExcelDownload = async () => {
  const period = periodOptions.value.find(p => p.periodId === selectedPeriodId.value)
  try {
    await exportMonthlySummaryExcel(period?.endYear || new Date().getFullYear(), selectedPeriodId.value)
  } catch {
    alert('엑셀 다운로드에 실패했습니다.')
  }
}

onMounted(async () => {
  await loadPeriods()
  await loadData()
})
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

/* 에코암스 마이너스 (남는 몫이 모자란 달) */
.amount-negative {
  color: #dc2626 !important;
}
</style>
