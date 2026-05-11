<template>
  <div class="monthly-ledger-page">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="OEM 월별 매출원장"
      description="OEM 제조사의 월별 발주 기준 매출(원가) 원장을 조회하고 지급을 관리합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="loadLedger">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          조회
        </button>
      </template>
    </PageHeader>

    <!-- 검색 조건 -->
    <div class="content-section">
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- OEM 제조사 -->
          <div class="search-item">
            <label>OEM 제조사:</label>
            <select v-model="selectedOemCompanyId" class="status-select" :disabled="isOemLocked" @change="handleOemChange">
              <option v-if="isFullAccess" :value="0">
                전체
              </option>
              <option v-else :value="null" disabled>
                선택하세요
              </option>
              <option
                v-for="company in oemCompanies"
                :key="company.id"
                :value="company.id"
              >
                {{ company.companyName }}
              </option>
            </select>
          </div>

          <!-- 년도 -->
          <div class="search-item">
            <label>년도:</label>
            <select v-model="selectedYear" class="status-select" @change="handleYearChange">
              <option v-for="y in availableYears" :key="y" :value="y">
                {{ y }}년
              </option>
            </select>
          </div>

          <!-- 월 -->
          <div class="search-item">
            <label>월:</label>
            <select v-model="selectedMonth" class="status-select">
              <option v-for="m in 12" :key="m" :value="String(m).padStart(2, '0')">
                {{ m }}월
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 지급 상태 카드 (전체 조회 시 숨김) -->
      <div v-if="ledgerData && selectedOemCompanyId !== 0" class="payment-status-card" :class="paymentStatusClass">
        <div class="status-info">
          <span class="status-label">지급상태:</span>
          <span class="status-badge" :class="paymentStatusClass">
            {{ paymentStatusLabel }}
          </span>
          <span v-if="ledgerData.paymentStatus === 'PAID' && ledgerData.paidAmount" class="paid-info">
            ({{ formatCurrency(ledgerData.paidAmount) }} / {{ ledgerData.paidDate }})
          </span>
        </div>
        <div class="status-actions">
          <!-- OEM 담당자: 지급 요청 -->
          <button
            v-if="isOemManager && ledgerData.paymentStatus === 'NONE' && ledgerData.items.length > 0"
            class="btn-action btn-primary"
            @click="handlePaymentRequest"
          >
            <i class="fas fa-paper-plane" />
            지급요청
          </button>
          <!-- OEM 담당자: 요청 취소 -->
          <button
            v-if="isOemManager && ledgerData.paymentStatus === 'PENDING'"
            class="btn-action btn-danger"
            @click="handleCancelRequest"
          >
            <i class="fas fa-times" />
            요청취소
          </button>
          <!-- 관리자: 지급 확인 -->
          <button
            v-if="!isOemManager && ledgerData.paymentStatus === 'PENDING'"
            class="btn-action btn-success"
            @click="handleConfirm"
          >
            <i class="fas fa-check" />
            지급확인
          </button>
          <!-- 관리자: 지급 완료 -->
          <button
            v-if="!isOemManager && ledgerData.paymentStatus === 'CONFIRMED'"
            class="btn-action btn-primary"
            @click="showCompleteModal = true"
          >
            <i class="fas fa-check-double" />
            지급완료
          </button>
        </div>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner fa-spin" />
        <p>데이터를 불러오는 중...</p>
      </div>

      <!-- 데이터 없음 -->
      <div v-else-if="!ledgerData || ledgerData.items.length === 0" class="no-data-message">
        <i class="fas fa-book" />
        <p v-if="!selectedOemCompanyId && selectedOemCompanyId !== 0">
          OEM 제조사를 선택한 후 조회하세요.
        </p>
        <p v-else>
          해당 월에 발주 데이터가 없습니다.
        </p>
      </div>

      <!-- 원장 테이블 -->
      <div v-else class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ ledgerData.items.length }}건</span>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table ledger-table">
            <colgroup>
              <col style="width: 50px;">
              <col style="width: 120px;">
              <col style="width: 100px;">
              <col style="width: 120px;">
              <col style="width: auto; min-width: 140px;">
              <col style="width: auto; min-width: 180px;">
              <col style="width: 90px;">
              <col style="width: 100px;">
              <col style="width: 120px;">
              <col style="width: 140px;">
            </colgroup>
            <thead>
              <tr>
                <th class="text-center">
                  #
                </th>
                <th v-if="selectedOemCompanyId === 0">
                  제조사
                </th>
                <th>발주서번호</th>
                <th>발주일자</th>
                <th>수요기관</th>
                <th>사업명</th>
                <th>규격</th>
                <th class="text-right">
                  수량
                </th>
                <th class="text-right">
                  단가
                </th>
                <th class="text-right">
                  금액
                </th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ledgerData.items" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td v-if="selectedOemCompanyId === 0">
                  {{ item.oemCompanyName }}
                </td>
                <td>{{ item.poNo }}</td>
                <td>{{ formatShortDate(item.orderDate) }}</td>
                <td>{{ item.demandAgency }}</td>
                <td class="cell-project">
                  {{ item.projectName }}
                </td>
                <td class="cell-spec">
                  {{ item.spec }}
                </td>
                <td class="text-right">
                  {{ formatQuantity(item.quantity) }}
                </td>
                <td class="text-right cell-amount">
                  {{ formatCurrency(item.unitCost) }}
                </td>
                <td class="text-right cell-amount">
                  {{ formatCurrency(item.amount) }}
                </td>
                <td class="cell-remarks">
                  {{ item.remarks || '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td :colspan="selectedOemCompanyId === 0 ? 7 : 6" class="text-right">
                  <strong>합계</strong>
                </td>
                <td class="text-right">
                  <strong>{{ formatQuantity(ledgerData.totalQuantity) }}</strong>
                </td>
                <td />
                <td class="text-right">
                  <strong>{{ formatCurrency(ledgerData.totalAmount) }}</strong>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- 지급 완료 모달 -->
    <Teleport to="body">
      <div v-if="showCompleteModal" class="modal-overlay" @click.self="showCompleteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h3>지급 완료</h3>
            <button class="modal-close" @click="showCompleteModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>지급 금액</label>
              <input v-model.number="completeForm.paidAmount" type="number" class="form-input" placeholder="실제 지급 금액">
            </div>
            <div class="form-group">
              <label>지급일</label>
              <input v-model="completeForm.paidDate" type="date" class="form-input">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-action" @click="showCompleteModal = false">
              취소
            </button>
            <button class="btn-action btn-primary" :disabled="!completeForm.paidAmount" @click="handleComplete">
              지급 완료
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * OEM 월별 매출원장 페이지
 */
import { ref, computed, onMounted } from 'vue'
import { oemLedgerService } from '~/services/oem-ledger.service'
import { companyService } from '~/services/company.service'
import type { OemMonthlyLedgerResponse } from '~/types/oem-ledger'
import { OEM_LEDGER_PAYMENT_STATUS_LABELS } from '~/types/oem-ledger'
import type { CompanyInfoResponse } from '~/types/company'
import { formatCurrency, formatQuantity } from '~/utils/format'
import { usePermission } from '~/composables/usePermission'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  pageTitle: '월별 매출원장'
})

const { isOemManager, isFullAccess } = usePermission()

// 검색 조건
const selectedOemCompanyId = ref<number | null>(null)
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const selectedMonth = ref(String(new Date().getMonth() + 1).padStart(2, '0'))

// 년도 목록 (현재년도 - 2 ~ 현재년도 + 1)
const availableYears = computed(() => {
  const years: number[] = []
  for (let y = currentYear + 1; y >= currentYear - 2; y--) {
    years.push(y)
  }
  return years
})

// 데이터
const loading = ref(false)
const oemCompanies = ref<CompanyInfoResponse[]>([])
const ledgerData = ref<OemMonthlyLedgerResponse | null>(null)

// 지급 완료 모달
const showCompleteModal = ref(false)
const completeForm = ref({
  paidAmount: 0,
  paidDate: ''
})

// 년월 문자열
const yearMonth = computed(() => `${selectedYear.value}-${selectedMonth.value}`)

// 지급 상태 라벨
const paymentStatusLabel = computed(() => {
  if (!ledgerData.value) { return '' }
  return OEM_LEDGER_PAYMENT_STATUS_LABELS[ledgerData.value.paymentStatus] || '미요청'
})

// 지급 상태 CSS
const paymentStatusClass = computed(() => {
  if (!ledgerData.value) { return '' }
  const statusMap: Record<string, string> = {
    NONE: 'status-none',
    PENDING: 'status-pending',
    CONFIRMED: 'status-confirmed',
    PAID: 'status-paid'
  }
  return statusMap[ledgerData.value.paymentStatus] || 'status-none'
})

// 날짜 포맷 (MM-DD)
function formatShortDate (dateStr: string): string {
  if (!dateStr) { return '-' }
  const parts = dateStr.split('-')
  if (parts.length >= 3) { return `${parts[1]}-${parts[2]}` }
  return dateStr
}

// OEM 변경
function handleOemChange () {
  ledgerData.value = null
}

// 년도 변경
function handleYearChange () {
  ledgerData.value = null
}

// 원장 조회
async function loadLedger () {
  if (selectedOemCompanyId.value === null) {
    alert('OEM 제조사를 선택하세요.')
    return
  }

  loading.value = true
  try {
    // 전체(0) 선택 시 oemCompanyId를 null로 전달
    const oemId = selectedOemCompanyId.value === 0 ? null : selectedOemCompanyId.value
    ledgerData.value = await oemLedgerService.getMonthlyLedger(
      oemId,
      yearMonth.value
    )
    // 지급 완료 모달 기본값 설정
    if (ledgerData.value) {
      completeForm.value.paidAmount = ledgerData.value.totalAmount || 0
      completeForm.value.paidDate = new Date().toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('원장 조회 실패:', error)
    alert('원장 조회에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 지급 요청
async function handlePaymentRequest () {
  if (!ledgerData.value) { return }
  if (!confirm(`${yearMonth.value} 매출원장 기준 ${formatCurrency(ledgerData.value.totalAmount)} 지급을 요청하시겠습니까?`)) { return }

  try {
    await oemLedgerService.createPaymentRequest({
      oemCompanyId: selectedOemCompanyId.value!,
      yearMonth: yearMonth.value,
      totalAmount: ledgerData.value.totalAmount
    })
    alert('지급 요청이 등록되었습니다.')
    await loadLedger()
  } catch (error) {
    console.error('지급 요청 실패:', error)
    alert(error instanceof Error ? error.message : '지급 요청에 실패했습니다.')
  }
}

// 요청 취소
async function handleCancelRequest () {
  if (!ledgerData.value?.paymentId) { return }
  if (!confirm('지급 요청을 취소하시겠습니까?')) { return }

  try {
    await oemLedgerService.cancelPaymentRequest(ledgerData.value.paymentId)
    alert('지급 요청이 취소되었습니다.')
    await loadLedger()
  } catch (error) {
    console.error('요청 취소 실패:', error)
    alert(error instanceof Error ? error.message : '요청 취소에 실패했습니다.')
  }
}

// 지급 확인 (관리자)
async function handleConfirm () {
  if (!ledgerData.value?.paymentId) { return }
  if (!confirm('지급을 확인하시겠습니까?')) { return }

  try {
    await oemLedgerService.confirmPaymentRequest(ledgerData.value.paymentId)
    alert('지급이 확인되었습니다.')
    await loadLedger()
  } catch (error) {
    console.error('지급 확인 실패:', error)
    alert(error instanceof Error ? error.message : '지급 확인에 실패했습니다.')
  }
}

// 지급 완료 (관리자)
async function handleComplete () {
  if (!ledgerData.value?.paymentId) { return }

  try {
    await oemLedgerService.completePaymentRequest(
      ledgerData.value.paymentId,
      completeForm.value.paidAmount,
      completeForm.value.paidDate
    )
    showCompleteModal.value = false
    alert('지급이 완료되었습니다.')
    await loadLedger()
  } catch (error) {
    console.error('지급 완료 실패:', error)
    alert(error instanceof Error ? error.message : '지급 완료에 실패했습니다.')
  }
}

// OEM 담당자 여부에 따른 제조사 선택 잠금
const isOemLocked = computed(() => isOemManager.value)

// 초기 데이터 로드
onMounted(async () => {
  try {
    oemCompanies.value = await companyService.getManufacturers()
    if (isOemManager.value) {
      // OEM 담당자: 자사 companyId로 자동 선택 + 잠금
      const authStore = useAuthStore()
      const myCompanyId = authStore.user?.companyId
      if (myCompanyId) {
        selectedOemCompanyId.value = myCompanyId
      } else if (oemCompanies.value.length > 0) {
        selectedOemCompanyId.value = oemCompanies.value[0].id
      }
      await loadLedger()
    } else if (isFullAccess.value) {
      // 리드파워/시스템관리자: "전체"(0) 기본 선택
      selectedOemCompanyId.value = 0
    }
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';

/* 지급 상태 카드 */
.payment-status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.payment-status-card.status-none {
  border-color: #d1d5db;
  background: #f9fafb;
}

.payment-status-card.status-pending {
  border-color: #fcd34d;
  background: #fffbeb;
}

.payment-status-card.status-confirmed {
  border-color: #93c5fd;
  background: #eff6ff;
}

.payment-status-card.status-paid {
  border-color: #6ee7b7;
  background: #ecfdf5;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.status-badge.status-none {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.status-pending {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-badge.status-confirmed {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.status-badge.status-paid {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #047857;
  border: 1px solid #6ee7b7;
}

.paid-info {
  font-size: 0.8125rem;
  color: #059669;
  font-weight: 500;
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

/* 버튼 스타일 */
.btn-danger {
  background: #ef4444 !important;
  color: white !important;
}

.btn-danger:hover {
  background: #dc2626 !important;
}

.btn-success {
  background: #10b981 !important;
  color: white !important;
}

.btn-success:hover {
  background: #059669 !important;
}

/* 원장 테이블 */
.ledger-table {
  font-size: 0.8125rem;
}

.cell-project {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-spec {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}

.cell-remarks {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.total-row {
  background: linear-gradient(180deg, #f8fafc, #f1f5f9) !important;
}

.total-row td {
  border-top: 2px solid #e2e8f0;
  font-weight: 600;
  color: #1e293b;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.modal-sm {
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.125rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}
</style>
