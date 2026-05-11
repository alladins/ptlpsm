<template>
  <div class="statistics-oem">
    <PageHeader
      title="OEM 제조사별 통계"
      icon="chart"
      icon-color="blue"
      description="OEM 제조사별 월별 제조원가, 지급액, 미지급액(잔금)을 확인합니다."
    />

    <div class="content-section">
      <!-- 연도 선택 -->
      <div class="year-selector">
        <button
          class="year-btn"
          @click="changeYear(-1)"
        >
          <i class="fas fa-chevron-left" />
        </button>
        <span class="current-year">{{ selectedYear }}년</span>
        <button
          class="year-btn"
          @click="changeYear(1)"
        >
          <i class="fas fa-chevron-right" />
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin" />
        <p>데이터를 불러오는 중...</p>
      </div>

      <template v-else>
        <!-- 요약 카드 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon icon-cost">
              <i class="fas fa-industry" />
            </div>
            <div class="stat-content">
              <h3>총 제조원가</h3>
              <p class="stat-number">
                {{ formatCurrency(statistics.summary.totalManufacturingCost) }}
              </p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-paid">
              <i class="fas fa-credit-card" />
            </div>
            <div class="stat-content">
              <h3>총 지급액</h3>
              <p class="stat-number text-success">
                {{ formatCurrency(statistics.summary.totalPaidAmount) }}
              </p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-unpaid">
              <i class="fas fa-wallet" />
            </div>
            <div class="stat-content">
              <h3>총 미지급액</h3>
              <p class="stat-number text-danger">
                {{ formatCurrency(statistics.summary.totalUnpaidAmount || 0) }}
              </p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-rate">
              <i class="fas fa-percentage" />
            </div>
            <div class="stat-content">
              <h3>전체 지급률</h3>
              <p class="stat-number">
                <span :class="getPaymentRateClass(statistics.summary.paymentRate || 0)">
                  {{ (statistics.summary.paymentRate || 0).toFixed(1) }}%
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- OEM별 연간 합계 테이블 -->
        <div class="table-section">
          <h2><i class="fas fa-building" /> OEM 제조사별 연간 합계</h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>제조사</th>
                  <th>출하건수</th>
                  <th class="text-right">
                    총 제조원가
                  </th>
                  <th class="text-right">
                    총 지급액
                  </th>
                  <th class="text-right">
                    총 미지급액
                  </th>
                  <th class="text-center">
                    지급률
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!statistics.oemSummary || statistics.oemSummary.length === 0">
                  <td colspan="7" class="no-data">
                    데이터가 없습니다
                  </td>
                </tr>
                <tr v-for="(item, index) in statistics.oemSummary" :key="item.oemId">
                  <td class="text-center">
                    {{ index + 1 }}
                  </td>
                  <td>{{ item.oemName }}</td>
                  <td class="text-center">
                    {{ item.shipmentCount }}건
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(item.totalManufacturingCost) }}
                  </td>
                  <td class="text-right text-success">
                    {{ formatCurrency(item.totalPaidAmount) }}
                  </td>
                  <td class="text-right text-danger">
                    {{ formatCurrency(item.totalUnpaidAmount) }}
                  </td>
                  <td class="text-center">
                    <span class="rate-badge" :class="getPaymentRateClass(item.paymentRate)">
                      {{ item.paymentRate.toFixed(1) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="statistics.oemSummary && statistics.oemSummary.length > 0">
                <tr class="total-row">
                  <td colspan="2" class="text-center">
                    <strong>합계</strong>
                  </td>
                  <td class="text-center">
                    <strong>{{ getTotalShipmentCount() }}건</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ formatCurrency(statistics.summary.totalManufacturingCost) }}</strong>
                  </td>
                  <td class="text-right text-success">
                    <strong>{{ formatCurrency(statistics.summary.totalPaidAmount) }}</strong>
                  </td>
                  <td class="text-right text-danger">
                    <strong>{{ formatCurrency(statistics.summary.totalUnpaidAmount || 0) }}</strong>
                  </td>
                  <td class="text-center">
                    <span class="rate-badge" :class="getPaymentRateClass(statistics.summary.paymentRate || 0)">
                      <strong>{{ (statistics.summary.paymentRate || 0).toFixed(1) }}%</strong>
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 월별 상세 테이블 -->
        <div class="table-section">
          <h2><i class="fas fa-calendar-alt" /> OEM 제조사별 월별 상세</h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 100px;">
                    월
                  </th>
                  <th>제조사</th>
                  <th class="text-right">
                    제조원가
                  </th>
                  <th class="text-right">
                    지급액
                  </th>
                  <th class="text-right">
                    미지급액
                  </th>
                  <th class="text-center" style="width: 100px;">
                    지급률
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!statistics.monthlyData || statistics.monthlyData.length === 0">
                  <td colspan="6" class="no-data">
                    데이터가 없습니다
                  </td>
                </tr>
                <tr v-for="item in statistics.monthlyData" :key="`${item.oemId}-${item.month}`">
                  <td class="text-center">
                    {{ formatMonth(item.month) }}
                  </td>
                  <td>{{ item.oemName }}</td>
                  <td class="text-right">
                    {{ formatCurrency(item.manufacturingCost) }}
                  </td>
                  <td class="text-right text-success">
                    {{ formatCurrency(item.paidAmount) }}
                  </td>
                  <td class="text-right text-danger">
                    {{ formatCurrency(item.unpaidAmount || 0) }}
                  </td>
                  <td class="text-center">
                    <span class="rate-badge" :class="getPaymentRateClass(item.paymentRate || 0)">
                      {{ (item.paymentRate || 0).toFixed(1) }}%
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
import { ref, onMounted } from 'vue'
import { getOemStatistics } from '~/services/statistics.service'
import type { OemStatisticsResponse } from '~/types/statistics'

definePageMeta({
  layout: 'admin',
  pageTitle: 'OEM 제조사별 통계'
})

// 선택된 연도
const selectedYear = ref(new Date().getFullYear())

// 로딩 상태
const loading = ref(false)

// 통계 데이터
const statistics = ref<OemStatisticsResponse>({
  summary: {
    totalManufacturingCost: 0,
    totalPaidAmount: 0,
    totalRemainingBalance: 0,
    totalUnpaidAmount: 0,
    oemCount: 0,
    paymentRate: 0
  },
  monthlyData: [],
  oemSummary: []
})

// 데이터 로드
async function loadData () {
  loading.value = true
  try {
    const data = await getOemStatistics(selectedYear.value)
    statistics.value = data
  } catch (error) {
    console.error('OEM 통계 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

// 연도 변경
function changeYear (delta: number) {
  selectedYear.value += delta
  loadData()
}

// 총 출하 건수 계산
function getTotalShipmentCount (): number {
  if (!statistics.value.oemSummary) { return 0 }
  return statistics.value.oemSummary.reduce((sum, item) => sum + (item.shipmentCount || 0), 0)
}

// 포맷 함수들
function formatCurrency (value: number): string {
  if (value === null || value === undefined) { return '0원' }
  return value.toLocaleString('ko-KR') + '원'
}

function formatMonth (month: string): string {
  if (!month) { return '-' }
  const parts = month.split('-')
  if (parts.length < 2) { return month }
  return `${parts[0]}년 ${parseInt(parts[1])}월`
}

function getPaymentRateClass (rate: number): string {
  if (rate >= 100) { return 'rate-complete' }
  if (rate >= 70) { return 'rate-high' }
  if (rate >= 40) { return 'rate-medium' }
  return 'rate-low'
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';

.content-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* 연도 선택기 */
.year-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.year-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.year-btn:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
  color: #3b82f6;
}

.current-year {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  min-width: 100px;
  text-align: center;
}

/* 요약 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.icon-cost {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.icon-paid {
  background: linear-gradient(135deg, #10b981, #059669);
}

.icon-unpaid {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.icon-rate {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

/* 테이블 */
.table-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-section h2 i {
  color: #3b82f6;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  text-align: left;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tfoot tr {
  background: #f0f9ff;
}

.total-row td {
  border-top: 2px solid #3b82f6;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 텍스트 색상 */
.text-success {
  color: #059669 !important;
}

.text-danger {
  color: #dc2626 !important;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

/* 지급률 뱃지 */
.rate-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rate-complete {
  background: #d1fae5;
  color: #059669;
}

.rate-high {
  background: #dbeafe;
  color: #1d4ed8;
}

.rate-medium {
  background: #fef3c7;
  color: #d97706;
}

.rate-low {
  background: #fee2e2;
  color: #dc2626;
}

/* 반응형 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }

  .stat-number {
    font-size: 1.25rem;
  }
}
</style>
