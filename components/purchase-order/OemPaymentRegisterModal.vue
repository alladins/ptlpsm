<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3><i class="fas fa-money-bill-wave" /> OEM 지급 등록</h3>
          <button class="modal-close" @click="close">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 발주서 선택 -->
          <div class="form-section">
            <h4>발주서 선택</h4>

            <!-- OEM 제조사 필터 탭 -->
            <div v-if="oemCompanyList.length > 1" class="oem-filter-tabs">
              <button
                class="oem-filter-tab"
                :class="{ active: filterOemCompanyId === null }"
                @click="setFilterOem(null)"
              >
                전체 ({{ purchaseOrders.length }})
              </button>
              <button
                v-for="company in oemCompanyList"
                :key="company.id"
                class="oem-filter-tab"
                :class="{ active: filterOemCompanyId === company.id }"
                @click="setFilterOem(company.id)"
              >
                {{ company.name }} ({{ company.count }})
              </button>
            </div>

            <div v-if="loadingPo" class="loading-inline">
              <i class="fas fa-spinner fa-spin" /> 발주서 목록을 불러오는 중...
            </div>
            <div v-else-if="purchaseOrders.length === 0" class="no-data-inline">
              등록 가능한 발주서가 없습니다.
            </div>
            <div v-else class="po-select-table-wrapper">
              <table class="po-select-table">
                <thead>
                  <tr>
                    <th class="col-check">
                      <input v-model="selectAllFiltered" type="checkbox" @change="toggleSelectAllFiltered">
                    </th>
                    <th>발주서번호</th>
                    <th>OEM 제조사</th>
                    <th class="text-right">
                      발주금액
                    </th>
                    <th class="text-right">
                      기지급액
                    </th>
                    <th class="text-right">
                      잔여액
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="po in filteredPurchaseOrders"
                    :key="po.poId"
                    :class="{ selected: selectedPoIds.has(po.poId) }"
                    @click="togglePo(po.poId)"
                  >
                    <td class="col-check">
                      <input
                        type="checkbox"
                        :checked="selectedPoIds.has(po.poId)"
                        @click.stop="togglePo(po.poId)"
                      >
                    </td>
                    <td>{{ po.poNo }}</td>
                    <td>{{ po.oemCompanyName }}</td>
                    <td class="text-right">
                      {{ formatCurrency(po.totalAmount) }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(po.paidAmount || 0) }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(po.remainingAmount || 0) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 선택 요약 -->
          <div v-if="selectedPoIds.size > 0" class="selection-summary">
            <div class="summary-row">
              <span class="label">선택 발주서</span>
              <span class="value">{{ selectedPoIds.size }}건</span>
            </div>
            <div class="summary-row">
              <span class="label">발주금액 합계</span>
              <span class="value">{{ formatCurrency(selectedTotalAmount) }}</span>
            </div>
            <div class="summary-row">
              <span class="label">기지급 합계</span>
              <span class="value">{{ formatCurrency(selectedPaidAmount) }}</span>
            </div>
            <div class="summary-row highlight">
              <span class="label">잔여금액 합계</span>
              <span class="value">{{ formatCurrency(selectedRemainingAmount) }}</span>
            </div>
          </div>

          <!-- 지급 정보 입력 -->
          <div class="form-section">
            <h4>지급 정보</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>지급금액 <span class="required">*</span></label>
                <input
                  v-model="formattedAmount"
                  type="text"
                  class="form-input text-right"
                  placeholder="0"
                  @input="handleAmountInput"
                >
                <div v-if="selectedRemainingAmount > 0" class="form-hint">
                  잔여금액: {{ formatCurrency(selectedRemainingAmount) }}
                </div>
              </div>
              <div class="form-group">
                <label>지급일 <span class="required">*</span></label>
                <input
                  v-model="form.paymentDate"
                  type="date"
                  class="form-input"
                >
              </div>
              <div class="form-group full-width">
                <label>비고</label>
                <input
                  v-model="form.remarks"
                  type="text"
                  class="form-input"
                  placeholder="비고 사항을 입력하세요"
                >
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="close">
            취소
          </button>
          <button
            class="btn-submit"
            :disabled="!isFormValid || submitting"
            @click="handleSubmit"
          >
            <i v-if="submitting" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-check" />
            {{ submitting ? '등록 중...' : '지급 등록' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * OEM 지급 등록 모달
 * - 발주서를 선택(복수 가능)하여 OEM 지급을 등록
 * - 선택된 발주서별로 purchase_order_payments에 분배 등록
 */
import { ref, computed, watch } from 'vue'
import { purchaseOrderService } from '~/services/purchase-order.service'
import { paymentService } from '~/services/payment.service'
import { formatCurrency } from '~/utils/format'
import type { PaymentRequest } from '~/types/payment'

interface PoOption {
  poId: number
  poNo: string
  oemCompanyId: number
  oemCompanyName: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
}

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submitted: []
}>()

// 상태
const loadingPo = ref(false)
const submitting = ref(false)
const purchaseOrders = ref<PoOption[]>([])
const selectedPoIds = ref<Set<number>>(new Set())
const selectAll = ref(false)
const filterOemCompanyId = ref<number | null>(null)

// 지급 폼
const form = ref({
  paymentAmount: 0,
  paymentDate: getTodayDate(),
  remarks: ''
})

const formattedAmount = ref('')

// 오늘 날짜
function getTodayDate (): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 금액 입력 핸들러 (콤마 포맷팅)
function handleAmountInput (event: Event) {
  const target = event.target as HTMLInputElement
  const rawValue = target.value.replace(/[^\d]/g, '')
  const numValue = parseInt(rawValue) || 0
  form.value.paymentAmount = numValue
  formattedAmount.value = numValue > 0 ? numValue.toLocaleString() : ''
}

// OEM 제조사 목록 (필터 탭용)
const oemCompanyList = computed(() => {
  const map = new Map<number, { id: number; name: string; count: number }>()
  for (const po of purchaseOrders.value) {
    if (!map.has(po.oemCompanyId)) {
      map.set(po.oemCompanyId, { id: po.oemCompanyId, name: po.oemCompanyName, count: 0 })
    }
    map.get(po.oemCompanyId)!.count++
  }
  return Array.from(map.values())
})

// 필터된 발주서 목록
const filteredPurchaseOrders = computed(() => {
  if (filterOemCompanyId.value === null) { return purchaseOrders.value }
  return purchaseOrders.value.filter(po => po.oemCompanyId === filterOemCompanyId.value)
})

// 필터 기준 전체 선택 체크박스
const selectAllFiltered = computed({
  get () {
    const filtered = filteredPurchaseOrders.value
    if (filtered.length === 0) { return false }
    return filtered.every(po => selectedPoIds.value.has(po.poId))
  },
  set () { /* toggleSelectAllFiltered에서 처리 */ }
})

// OEM 필터 변경
function setFilterOem (companyId: number | null) {
  filterOemCompanyId.value = companyId
}

// 필터된 목록 기준 전체 선택/해제
function toggleSelectAllFiltered () {
  const filtered = filteredPurchaseOrders.value
  const allSelected = filtered.every(po => selectedPoIds.value.has(po.poId))
  if (allSelected) {
    // 필터된 항목만 해제
    filtered.forEach(po => selectedPoIds.value.delete(po.poId))
  } else {
    // 필터된 항목 전체 선택
    filtered.forEach(po => selectedPoIds.value.add(po.poId))
  }
  // reactivity 트리거
  selectedPoIds.value = new Set(selectedPoIds.value)
}

// 선택된 발주서 합계 계산
const selectedTotalAmount = computed(() => {
  return purchaseOrders.value
    .filter(po => selectedPoIds.value.has(po.poId))
    .reduce((sum, po) => sum + po.totalAmount, 0)
})

const selectedPaidAmount = computed(() => {
  return purchaseOrders.value
    .filter(po => selectedPoIds.value.has(po.poId))
    .reduce((sum, po) => sum + (po.paidAmount || 0), 0)
})

const selectedRemainingAmount = computed(() => {
  return purchaseOrders.value
    .filter(po => selectedPoIds.value.has(po.poId))
    .reduce((sum, po) => sum + (po.remainingAmount || 0), 0)
})

// 전체 선택/해제
function toggleSelectAll () {
  if (selectAll.value) {
    purchaseOrders.value.forEach(po => selectedPoIds.value.add(po.poId))
  } else {
    selectedPoIds.value.clear()
  }
}

// 개별 선택/해제
function togglePo (poId: number) {
  if (selectedPoIds.value.has(poId)) {
    selectedPoIds.value.delete(poId)
  } else {
    selectedPoIds.value.add(poId)
  }
  // reactivity 트리거
  selectedPoIds.value = new Set(selectedPoIds.value)
  selectAll.value = selectedPoIds.value.size === purchaseOrders.value.length
}

// 폼 유효성
const isFormValid = computed(() => {
  return (
    selectedPoIds.value.size > 0 &&
    form.value.paymentAmount > 0 &&
    form.value.paymentDate !== ''
  )
})

// 발주서 목록 로드 + 지급 현황 합산
async function loadPurchaseOrders () {
  loadingPo.value = true
  try {
    // 발주서 목록 조회 (최근 1년)
    const response = await purchaseOrderService.getPurchaseOrderList({
      page: 0,
      size: 100,
      sort: 'orderDate,desc'
    })

    // OEM 요약 조회
    const summaries = await paymentService.getPaymentSummaryByOem()
    const summaryMap = new Map(summaries.map(s => [s.oemCompanyId, s]))

    // 각 발주서별 지급 내역 조회 후 잔여액 계산
    const poList = response.content || []
    const poOptions: PoOption[] = []

    for (const po of poList) {
      try {
        const payments = await paymentService.getPaymentsByPoId(po.poId)
        const paidAmount = payments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0)
        poOptions.push({
          poId: po.poId,
          poNo: po.poNo || '-',
          oemCompanyId: po.oemCompanyId || 0,
          oemCompanyName: po.oemCompanyName || '-',
          totalAmount: po.totalAmount || 0,
          paidAmount,
          remainingAmount: Math.max(0, (po.totalAmount || 0) - paidAmount)
        })
      } catch {
        // 지급 조회 실패 시 기본값 사용
        poOptions.push({
          poId: po.poId,
          poNo: po.poNo || '-',
          oemCompanyId: po.oemCompanyId || 0,
          oemCompanyName: po.oemCompanyName || '-',
          totalAmount: po.totalAmount || 0,
          paidAmount: 0,
          remainingAmount: po.totalAmount || 0
        })
      }
    }

    purchaseOrders.value = poOptions
  } catch (error) {
    console.error('발주서 목록 로드 실패:', error)
  } finally {
    loadingPo.value = false
  }
}

// 제출
async function handleSubmit () {
  if (!isFormValid.value || submitting.value) { return }

  submitting.value = true
  try {
    const selectedPOs = purchaseOrders.value.filter(po => selectedPoIds.value.has(po.poId))

    if (selectedPOs.length === 1) {
      // 단일 발주서: 전액을 해당 발주서에 등록
      const po = selectedPOs[0]
      const request: PaymentRequest = {
        poId: po.poId,
        oemCompanyId: po.oemCompanyId,
        paymentAmount: form.value.paymentAmount,
        paymentDate: form.value.paymentDate,
        remarks: form.value.remarks || undefined
      }
      await paymentService.createPayment(request)
    } else {
      // 복수 발주서: 잔여액 비율로 분배
      const totalRemaining = selectedPOs.reduce((sum, po) => sum + po.remainingAmount, 0)
      let remainingAmount = form.value.paymentAmount

      for (let i = 0; i < selectedPOs.length; i++) {
        const po = selectedPOs[i]
        let allocatedAmount: number

        if (i === selectedPOs.length - 1) {
          // 마지막 발주서: 나머지 전액
          allocatedAmount = remainingAmount
        } else {
          // 잔여액 비율로 분배
          const ratio = totalRemaining > 0 ? po.remainingAmount / totalRemaining : 1 / selectedPOs.length
          allocatedAmount = Math.floor(form.value.paymentAmount * ratio)
          remainingAmount -= allocatedAmount
        }

        if (allocatedAmount > 0) {
          const request: PaymentRequest = {
            poId: po.poId,
            oemCompanyId: po.oemCompanyId,
            paymentAmount: allocatedAmount,
            paymentDate: form.value.paymentDate,
            remarks: form.value.remarks
              ? `${form.value.remarks} (${po.poNo})`
              : `묶음지급 (${po.poNo})`
          }
          await paymentService.createPayment(request)
        }
      }
    }

    alert('지급이 등록되었습니다.')
    emit('submitted')
    close()
  } catch (error) {
    console.error('지급 등록 실패:', error)
    alert(error instanceof Error ? error.message : '지급 등록에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 닫기
function close () {
  emit('close')
}

// 발주서 선택 변경 시 잔여액 합계를 지급금액에 자동 입력
watch(selectedRemainingAmount, (newAmount) => {
  if (newAmount > 0) {
    form.value.paymentAmount = newAmount
    formattedAmount.value = newAmount.toLocaleString()
  } else {
    form.value.paymentAmount = 0
    formattedAmount.value = ''
  }
})

// 모달 열릴 때 초기화
watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
    loadPurchaseOrders()
  }
})

function resetForm () {
  selectedPoIds.value = new Set()
  selectAll.value = false
  filterOemCompanyId.value = null
  form.value = {
    paymentAmount: 0,
    paymentDate: getTodayDate(),
    remarks: ''
  }
  formattedAmount.value = ''
}
</script>

<style scoped>
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 720px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: #3b82f6;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* 폼 섹션 */
.form-section {
  margin-bottom: 1.5rem;
}

.form-section h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #4b5563;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 발주서 선택 테이블 */
.po-select-table-wrapper {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.po-select-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.po-select-table thead th {
  position: sticky;
  top: 0;
  background: #f9fafb;
  padding: 0.625rem 0.75rem;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
}

.po-select-table thead th.text-right {
  text-align: right;
}

.po-select-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.po-select-table tbody tr:hover {
  background: #f0f9ff;
}

.po-select-table tbody tr.selected {
  background: #eff6ff;
}

.po-select-table tbody td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.po-select-table tbody td.text-right {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-check {
  width: 40px;
  text-align: center !important;
}

/* 선택 요약 */
.selection-summary {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.summary-row .label {
  font-size: 0.8125rem;
  color: #94a3b8;
}

.summary-row .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.summary-row.highlight .label {
  color: #fbbf24;
}

.summary-row.highlight .value {
  color: #fbbf24;
  font-size: 1rem;
}

/* 로딩/빈 상태 */
.loading-inline,
.no-data-inline {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* 버튼 */
.btn-cancel {
  padding: 0.625rem 1.25rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-submit:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

/* OEM 제조사 필터 탭 */
.oem-filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.oem-filter-tab {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  border: 1.5px solid #e5e7eb;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.oem-filter-tab:hover {
  color: #1e40af;
  background: #eff6ff;
  border-color: #93c5fd;
}

.oem-filter-tab.active {
  color: #ffffff;
  background: #3b82f6;
  border-color: #3b82f6;
  font-weight: 600;
}

.text-right {
  text-align: right;
}
</style>
