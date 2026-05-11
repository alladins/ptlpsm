<template>
  <div class="oem-dashboard">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="OEM 대시보드"
      icon="order"
      icon-color="blue"
      description="OEM 제조사별 발주/생산/재고/지급 현황을 한눈에 파악합니다."
    >
      <template #actions>
        <div class="year-selector">
          <button
            class="year-nav"
            :disabled="selectedYear <= minYear"
            @click="changeYear(-1)"
          >
            <i class="fas fa-chevron-left" />
          </button>
          <span class="year-display">{{ selectedYear }}년</span>
          <button
            class="year-nav"
            :disabled="selectedYear >= maxYear"
            @click="changeYear(1)"
          >
            <i class="fas fa-chevron-right" />
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" />
      <p>대시보드 데이터를 불러오는 중...</p>
    </div>

    <!-- 데이터 없음 -->
    <div v-else-if="summaryList.length === 0" class="empty-container">
      <i class="fas fa-industry" />
      <p>등록된 OEM 발주가 없습니다.</p>
    </div>

    <div v-else class="content-section">
      <!-- 상단: OEM 통합 요약 카드 -->
      <div class="section-header">
        <h3 class="section-title">
          <i class="fas fa-th-large" />
          OEM 제조사별 현황
        </h3>
      </div>
      <div class="oem-cards-grid">
        <div
          v-for="oem in summaryList"
          :key="oem.oemCompanyId"
          class="oem-card"
          :class="{ 'selected': selectedOemId === oem.oemCompanyId }"
          @click="selectOem(oem.oemCompanyId)"
        >
          <!-- 카드 헤더 -->
          <div class="oem-card-header">
            <div class="oem-name">
              <i class="fas fa-industry" />
              {{ oem.oemCompanyName }}
            </div>
          </div>

          <!-- 발주 현황 -->
          <div class="oem-card-row">
            <span class="row-label">발주 현황</span>
            <span class="row-value">
              총 <strong>{{ oem.totalPoCount }}</strong>건
            </span>
          </div>
          <div class="po-status-chips">
            <span v-if="oem.draftPoCount > 0" class="chip chip-gray">
              작성중 {{ oem.draftPoCount }}
            </span>
            <span v-if="oem.issuedPoCount > 0" class="chip chip-blue">
              생산중 {{ oem.issuedPoCount }}
            </span>
            <span v-if="oem.producedPoCount > 0" class="chip chip-green">
              생산완료 {{ oem.producedPoCount }}
            </span>
            <span v-if="oem.stockedPoCount > 0" class="chip chip-purple">
              입고완료 {{ oem.stockedPoCount }}
            </span>
          </div>

          <!-- 생산 진행률 -->
          <div class="oem-card-row">
            <span class="row-label">생산 진행률</span>
            <span class="row-value">
              {{ formatPercent(oem.productionRate) }}
            </span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-fill production"
                :style="{ width: Math.min(oem.productionRate, 100) + '%' }"
              />
            </div>
            <span class="progress-text">
              {{ formatQuantity(oem.totalProducedQuantity) }} / {{ formatQuantity(oem.totalOrderedQuantity) }}
            </span>
          </div>

          <!-- 재고 -->
          <div class="oem-card-row">
            <span class="row-label">재고 수량</span>
            <span class="row-value">
              <strong>{{ formatQuantity(oem.totalInventoryQuantity) }}</strong>
            </span>
          </div>

          <!-- 지급 진행률 -->
          <div class="oem-card-row">
            <span class="row-label">지급 현황</span>
            <span class="row-value">
              {{ formatPercent(oem.paymentRate) }}
            </span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-fill payment"
                :style="{ width: Math.min(oem.paymentRate, 100) + '%' }"
              />
            </div>
            <span class="progress-text unpaid">
              미지급 {{ formatCurrency(oem.unpaidAmount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 품목별 생산 현황 + 월별 지급 현황 (좌우 배치) -->
      <div class="detail-row">
        <!-- 좌: 품목별 생산 현황 -->
        <div class="production-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-cogs" />
              품목별 생산 현황
            </h3>
            <div class="section-actions">
              <select v-model="productionOemId" class="oem-select" :disabled="isOemManager">
                <option v-if="!isOemManager" :value="null">
                  전체 OEM
                </option>
                <option
                  v-for="oem in summaryList"
                  :key="oem.oemCompanyId"
                  :value="oem.oemCompanyId"
                >
                  {{ oem.oemCompanyName }}
                </option>
              </select>
            </div>
          </div>

          <!-- 생산 현황 로딩 -->
          <div v-if="productionLoading" class="loading-container small">
            <i class="fas fa-spinner fa-spin" />
            <p>생산 현황 데이터를 불러오는 중...</p>
          </div>

          <!-- 생산 현황 데이터 없음 -->
          <div v-else-if="filteredProductionStatus.length === 0" class="empty-container small">
            <i class="fas fa-box-open" />
            <p>해당 연도의 생산 현황이 없습니다.</p>
          </div>

          <!-- 생산 현황 테이블 -->
          <div v-else class="table-card">
            <div class="table-container">
              <table class="detail-table production-table">
                <thead>
                  <tr>
                    <th v-if="productionOemId === null">
                      OEM 제조사
                    </th>
                    <th>품목명</th>
                    <th>발주수량</th>
                    <th>생산수량</th>
                    <th>생산률</th>
                    <th>누적입고</th>
                    <th>누적출고</th>
                    <th>잔여재고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in filteredProductionStatus"
                    :key="`${item.oemCompanyId}-${item.skuId}-${index}`"
                  >
                    <td v-if="productionOemId === null" class="text-left">
                      {{ item.oemCompanyName }}
                    </td>
                    <td class="text-left sku-name">
                      <span class="sku-badge">{{ item.skuId }}</span>
                      {{ item.skuName }}
                    </td>
                    <td class="text-right">
                      {{ formatQuantity(item.orderedQuantity) }}
                    </td>
                    <td class="text-right">
                      {{ formatQuantity(item.producedQuantity) }}
                    </td>
                    <td class="text-center">
                      <span
                        class="rate-badge"
                        :class="getRateClass(item.productionRate)"
                      >
                        {{ formatPercent(item.productionRate) }}
                      </span>
                    </td>
                    <td class="text-right text-blue">
                      {{ formatQuantity(item.cumulativeInbound) }}
                    </td>
                    <td class="text-right text-orange">
                      {{ formatQuantity(item.cumulativeOutbound) }}
                    </td>
                    <td class="text-right">
                      <strong :class="item.currentInventory > 0 ? 'text-green' : 'text-gray'">
                        {{ formatQuantity(item.currentInventory) }}
                      </strong>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td :colspan="productionOemId === null ? 2 : 1" class="text-center">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(productionTotals.ordered) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(productionTotals.produced) }}</strong>
                    </td>
                    <td class="text-center">
                      <strong>{{ formatPercent(productionTotals.rate) }}</strong>
                    </td>
                    <td class="text-right text-blue">
                      <strong>{{ formatQuantity(productionTotals.inbound) }}</strong>
                    </td>
                    <td class="text-right text-orange">
                      <strong>{{ formatQuantity(productionTotals.outbound) }}</strong>
                    </td>
                    <td class="text-right text-green">
                      <strong>{{ formatQuantity(productionTotals.inventory) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- 우: 월별 지급 현황 -->
        <div class="monthly-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-calendar-alt" />
              월별 지급 현황
            </h3>
            <div class="section-actions">
              <select v-model="selectedOemId" class="oem-select" :disabled="isOemManager">
                <option v-if="!isOemManager" :value="null">
                  전체 OEM
                </option>
                <option
                  v-for="oem in summaryList"
                  :key="oem.oemCompanyId"
                  :value="oem.oemCompanyId"
                >
                  {{ oem.oemCompanyName }}
                </option>
              </select>
            </div>
          </div>

          <!-- 월별 지급 로딩 -->
          <div v-if="monthlyLoading" class="loading-container small">
            <i class="fas fa-spinner fa-spin" />
            <p>월별 지급 데이터를 불러오는 중...</p>
          </div>

          <!-- 월별 지급 데이터 없음 -->
          <div v-else-if="filteredMonthlyPayments.length === 0" class="empty-container small">
            <i class="fas fa-calendar-times" />
            <p>해당 연도의 지급 내역이 없습니다.</p>
          </div>

          <!-- 월별 지급 테이블 -->
          <div v-else class="table-card">
            <div class="table-container">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th v-if="selectedOemId === null">
                      OEM 제조사
                    </th>
                    <th>연월</th>
                    <th>건수</th>
                    <th>지급 합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in filteredMonthlyPayments"
                    :key="`${item.oemCompanyId}-${item.yearMonth}-${index}`"
                  >
                    <td v-if="selectedOemId === null" class="text-left">
                      {{ item.oemCompanyName }}
                    </td>
                    <td class="text-center">
                      <span class="month-badge">{{ item.yearMonth }}</span>
                    </td>
                    <td class="text-center">
                      {{ item.paymentCount }}
                    </td>
                    <td class="text-right">
                      <strong>{{ formatCurrency(item.totalAmount) }}</strong>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td :colspan="selectedOemId === null ? 2 : 1" class="text-center">
                      <strong>합계</strong>
                    </td>
                    <td class="text-center">
                      <strong>{{ monthlyTotals.count }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatCurrency(monthlyTotals.total) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OEM 대시보드 페이지
 * - OEM 제조사별 발주/생산/재고/지급 통합 현황
 * - 월별 지급 현황 테이블
 */
import { ref, computed, onMounted, watch } from 'vue'
import { formatCurrency, formatQuantity, formatPercent } from '~/utils/format'
import { oemDashboardService } from '~/services/oem-dashboard.service'
import { usePermission } from '~/composables/usePermission'
import { useAuthStore } from '~/stores/auth'
import type { OemDashboardSummary, OemMonthlyPayment, OemProductionStatus } from '~/types/oem-dashboard'

definePageMeta({
  layout: 'admin',
  pageTitle: 'OEM 대시보드'
})

const { isOemManager } = usePermission()
const authStore = useAuthStore()

// 상태
const loading = ref(true)
const monthlyLoading = ref(false)
const productionLoading = ref(false)
const selectedYear = ref(new Date().getFullYear())
const selectedOemId = ref<number | null>(null)
const productionOemId = ref<number | null>(null)

// 데이터
const summaryList = ref<OemDashboardSummary[]>([])
const monthlyPayments = ref<OemMonthlyPayment[]>([])
const productionStatus = ref<OemProductionStatus[]>([])

// 연도 범위
const currentYear = new Date().getFullYear()
const minYear = currentYear - 4
const maxYear = currentYear + 1

// 선택된 OEM에 따른 생산 현황 필터링
const filteredProductionStatus = computed(() => {
  if (productionOemId.value === null) {
    return productionStatus.value
  }
  return productionStatus.value.filter(
    item => item.oemCompanyId === productionOemId.value
  )
})

// 생산 현황 합계 계산
const productionTotals = computed(() => {
  const data = filteredProductionStatus.value
  const ordered = data.reduce((sum, item) => sum + (item.orderedQuantity || 0), 0)
  const produced = data.reduce((sum, item) => sum + (item.producedQuantity || 0), 0)
  const rate = ordered > 0 ? Math.round((produced / ordered) * 1000) / 10 : 0
  return {
    ordered,
    produced,
    rate,
    inbound: data.reduce((sum, item) => sum + (item.cumulativeInbound || 0), 0),
    outbound: data.reduce((sum, item) => sum + (item.cumulativeOutbound || 0), 0),
    inventory: data.reduce((sum, item) => sum + (item.currentInventory || 0), 0)
  }
})

// 생산률 등급별 CSS 클래스
const getRateClass = (rate: number) => {
  if (rate >= 100) { return 'rate-complete' }
  if (rate >= 70) { return 'rate-high' }
  if (rate >= 40) { return 'rate-mid' }
  return 'rate-low'
}

// 선택된 OEM에 따른 월별 지급 필터링
const filteredMonthlyPayments = computed(() => {
  if (selectedOemId.value === null) {
    return monthlyPayments.value
  }
  return monthlyPayments.value.filter(
    item => item.oemCompanyId === selectedOemId.value
  )
})

// 월별 합계 계산
const monthlyTotals = computed(() => {
  const data = filteredMonthlyPayments.value
  return {
    count: data.reduce((sum, item) => sum + (item.paymentCount || 0), 0),
    total: data.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  }
})

// 연도 변경
const changeYear = (delta: number) => {
  selectedYear.value += delta
}

// OEM 카드 선택 (생산현황, 월별지급 동시 연동)
const selectOem = (oemCompanyId: number) => {
  if (selectedOemId.value === oemCompanyId) {
    selectedOemId.value = null
    productionOemId.value = null
  } else {
    selectedOemId.value = oemCompanyId
    productionOemId.value = oemCompanyId
  }
}

// 대시보드 요약 데이터 로드
const loadSummary = async () => {
  loading.value = true
  try {
    summaryList.value = await oemDashboardService.getOemDashboardSummary(selectedYear.value)
  } catch (error) {
    console.error('OEM 대시보드 요약 조회 실패:', error)
    summaryList.value = []
  } finally {
    loading.value = false
  }
}

// 생산 현황 데이터 로드
const loadProductionStatus = async () => {
  productionLoading.value = true
  try {
    productionStatus.value = await oemDashboardService.getProductionStatus(null, selectedYear.value)
  } catch (error) {
    console.error('OEM 생산 현황 조회 실패:', error)
    productionStatus.value = []
  } finally {
    productionLoading.value = false
  }
}

// 월별 지급 데이터 로드
const loadMonthlyPayments = async () => {
  monthlyLoading.value = true
  try {
    monthlyPayments.value = await oemDashboardService.getAllMonthlyPayments(selectedYear.value)
  } catch (error) {
    console.error('OEM 월별 지급 현황 조회 실패:', error)
    monthlyPayments.value = []
  } finally {
    monthlyLoading.value = false
  }
}

// 전체 데이터 로드
const loadDashboard = async () => {
  await Promise.all([
    loadSummary(),
    loadProductionStatus(),
    loadMonthlyPayments()
  ])
}

// 연도 변경 시 재로드
watch(selectedYear, () => {
  loadDashboard()
})

// 초기 데이터 로드
onMounted(async () => {
  await loadDashboard()
  // OEM 담당자는 자동으로 자사 선택 + 잠금
  if (isOemManager.value && summaryList.value.length > 0) {
    const myCompanyId = authStore.user?.companyId
    const myOem = summaryList.value.find(o => o.oemCompanyId === myCompanyId)
    if (myOem) {
      selectOem(myOem.oemCompanyId)
    } else {
      selectOem(summaryList.value[0].oemCompanyId)
    }
  }
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

/* 로딩 / 빈 상태 */
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

.loading-container.small {
  padding: 2rem;
}

.loading-container.small i {
  font-size: 2rem;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #9ca3af;
}

.empty-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-container.small {
  padding: 2rem;
}

.empty-container.small i {
  font-size: 2rem;
}

/* 섹션 헤더 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
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

.section-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.oem-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  cursor: pointer;
  min-width: 160px;
}

.oem-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

/* OEM 카드 그리드 */
.oem-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.oem-card {
  background: linear-gradient(135deg, #f0f4ff 0%, #f8faff 100%);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.oem-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.oem-card.selected {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
}

.oem-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.oem-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.oem-name i {
  color: #6366f1;
}

/* 카드 내부 행 */
.oem-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.375rem;
}

.row-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.row-value {
  font-size: 0.8125rem;
  color: #374151;
}

.row-value strong {
  color: #1f2937;
  font-weight: 700;
}

/* 발주 상태 칩 */
.po-status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.chip {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.chip-gray {
  background: #f3f4f6;
  color: #6b7280;
}

.chip-blue {
  background: #dbeafe;
  color: #2563eb;
}

.chip-green {
  background: #dcfce7;
  color: #16a34a;
}

.chip-purple {
  background: #ede9fe;
  color: #7c3aed;
}

/* 진행률 바 */
.progress-bar-container {
  margin-bottom: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.production {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.progress-fill.payment {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.progress-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

.progress-text.unpaid {
  color: #f59e0b;
  font-weight: 600;
}

/* 좌우 배치 그리드 */
.detail-row {
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: 1.5rem;
  margin-top: 1rem;
  align-items: start;
}

/* 생산 현황 섹션 */
.production-section {
  min-width: 0;
}

.production-table th {
  white-space: nowrap;
}

.sku-name {
  white-space: nowrap;
}

.sku-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #64748b;
  margin-right: 0.375rem;
}

.rate-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.rate-complete {
  background: #dcfce7;
  color: #16a34a;
}

.rate-high {
  background: #dbeafe;
  color: #2563eb;
}

.rate-mid {
  background: #fef3c7;
  color: #d97706;
}

.rate-low {
  background: #fee2e2;
  color: #dc2626;
}

.text-blue {
  color: #2563eb;
}

.text-orange {
  color: #ea580c;
}

.text-green {
  color: #16a34a;
}

.text-gray {
  color: #9ca3af;
}

/* 월별 지급 섹션 */
.monthly-section {
  min-width: 0;
}

/* 테이블 카드 */
.table-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.month-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 0.8125rem;
}

/* 반응형 */
@media (max-width: 1280px) {
  .oem-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }

  .detail-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .oem-cards-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .oem-select {
    width: 100%;
  }

  .year-selector {
    padding: 0.375rem 0.75rem;
  }

  .year-display {
    font-size: 1rem;
    min-width: 60px;
  }
}
</style>
