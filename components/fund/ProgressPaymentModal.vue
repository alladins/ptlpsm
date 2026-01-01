<template>
  <!-- 서명 발송 모달 -->
  <ProgressSignatureModal
    v-if="showSignatureModal && progressClaimData"
    :claim-data="progressClaimData"
    @close="closeSignatureModal"
    @sent="onSignatureSent"
  />

  <div v-if="isOpen && !showSignatureModal" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>기성 청구</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 로딩 상태 -->
        <div v-if="baselineStore.loading" class="loading-container">
          <i class="fas fa-spinner fa-spin"></i>
          <span>데이터를 불러오는 중...</span>
        </div>

        <template v-else>
          <!-- 이전 차수 정보 -->
          <div class="previous-info" v-if="previousBaseline">
            <div class="info-badge">
              <i class="fas fa-info-circle"></i>
              <span>이전 차수: {{ previousBaseline.displayName }} ({{ previousBaseline.baselineDate }})</span>
            </div>
          </div>

          <!-- 청구 가능 출하 없음 -->
          <div v-if="!hasAvailableShipments" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>청구 가능한 출하가 없습니다.</p>
            <span class="empty-hint">납품확인(인수증 서명)이 완료된 출하만 기성 청구할 수 있습니다.</span>
          </div>

          <!-- 청구 가능 출하 목록 -->
          <div v-else class="table-section">
            <div class="table-header">
              <h4>청구 가능 출하 목록</h4>
              <span class="hint">납품확인 완료된 출하를 선택하세요</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="checkbox-col">
                      <input
                        type="checkbox"
                        :checked="isAllSelected"
                        :indeterminate="isIndeterminate"
                        @change="toggleSelectAll"
                      >
                    </th>
                    <th>출하번호</th>
                    <th>출하일</th>
                    <th>품목요약</th>
                    <th>수량</th>
                    <th>금액</th>
                    <th>납품확인일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="shipment in availableShipments"
                    :key="shipment.shipmentId"
                    :class="{ selected: isSelected(shipment.shipmentId) }"
                    @click="toggleShipment(shipment.shipmentId)"
                  >
                    <td class="checkbox-col" @click.stop>
                      <input
                        type="checkbox"
                        :checked="isSelected(shipment.shipmentId)"
                        @change="toggleShipment(shipment.shipmentId)"
                      >
                    </td>
                    <td>{{ shipment.shipmentId }}</td>
                    <td>{{ formatDate(shipment.shipmentDate) }}</td>
                    <td>{{ shipment.itemSummary || '-' }}</td>
                    <td class="text-right">{{ formatNumber(shipment.totalQuantity) }}</td>
                    <td class="text-right amount">{{ formatCurrency(shipment.totalAmount) }}</td>
                    <td>{{ formatDateTime(shipment.deliveryCompletedAt) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right"><strong>선택 합계</strong></td>
                    <td class="text-right"><strong>{{ formatNumber(selectedTotalQuantity) }}</strong></td>
                    <td class="text-right amount"><strong>{{ formatCurrency(selectedTotalAmount) }}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- 자동 계산 결과 -->
          <div v-if="hasAvailableShipments" class="calculation-result">
            <div class="result-row">
              <label>선택한 출하 수</label>
              <span class="count">{{ selectedShipmentIds.length }}건</span>
            </div>
            <div class="result-row">
              <label>청구 금액</label>
              <span class="amount primary">{{ formatCurrency(selectedTotalAmount) }}</span>
            </div>
            <div class="result-row">
              <label>OEM 지급 예정 금액</label>
              <span class="amount">{{ formatCurrency(oemPaymentAmount) }}</span>
            </div>
          </div>

          <!-- 비고 입력 -->
          <div v-if="hasAvailableShipments" class="form-field">
            <label>비고</label>
            <textarea
              v-model="remarks"
              class="form-textarea"
              placeholder="기성 청구 관련 메모를 입력하세요"
              rows="2"
            ></textarea>
          </div>

          <!-- 유효성 검사 메시지 -->
          <div v-if="validationError" class="validation-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ validationError }}</span>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-primary"
          @click="submitClaim"
          :disabled="!isValid || isSubmitting || !hasAvailableShipments"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          기성 청구
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '~/utils/format'
import { useBaselineStore } from '~/stores/baseline'
import { useFundStore } from '~/stores/fund'
import type { BaselineListItem, AvailableShipment } from '~/types/baseline'
import type { ProgressClaimData } from '~/types/fund'
import ProgressSignatureModal from './ProgressSignatureModal.vue'

// Props
interface Props {
  isOpen: boolean
  orderId: number
  fundId: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

// Stores
const baselineStore = useBaselineStore()
const fundStore = useFundStore()

// State
const isSubmitting = ref(false)
const selectedShipmentIds = ref<number[]>([])
const remarks = ref('')

// 서명 발송 모달 관련
const showSignatureModal = ref(false)
const progressClaimData = ref<ProgressClaimData | null>(null)

// Computed - 청구 가능 출하 목록
const availableShipments = computed<AvailableShipment[]>(() => {
  return baselineStore.availableShipments
})

const hasAvailableShipments = computed(() => {
  return baselineStore.hasAvailableShipments
})

// 이전 차수 정보
const previousBaseline = computed<BaselineListItem | null>(() => {
  return baselineStore.latestBaseline
})

// 선택 관련
const isAllSelected = computed(() => {
  return availableShipments.value.length > 0 &&
    selectedShipmentIds.value.length === availableShipments.value.length
})

const isIndeterminate = computed(() => {
  return selectedShipmentIds.value.length > 0 &&
    selectedShipmentIds.value.length < availableShipments.value.length
})

const isSelected = (shipmentId: number) => {
  return selectedShipmentIds.value.includes(shipmentId)
}

const toggleShipment = (shipmentId: number) => {
  const index = selectedShipmentIds.value.indexOf(shipmentId)
  if (index === -1) {
    selectedShipmentIds.value.push(shipmentId)
  } else {
    selectedShipmentIds.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedShipmentIds.value = []
  } else {
    selectedShipmentIds.value = availableShipments.value.map(s => s.shipmentId)
  }
}

// 선택된 출하의 합계
const selectedTotalQuantity = computed(() => {
  return availableShipments.value
    .filter(s => selectedShipmentIds.value.includes(s.shipmentId))
    .reduce((sum, s) => sum + (s.totalQuantity || 0), 0)
})

const selectedTotalAmount = computed(() => {
  return availableShipments.value
    .filter(s => selectedShipmentIds.value.includes(s.shipmentId))
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
})

// OEM 지급 예정 금액 (예시: 청구금액의 70%)
const oemPaymentAmount = computed(() => {
  return Math.round(selectedTotalAmount.value * 0.7)
})

// 유효성 검사
const validationError = ref<string | null>(null)

const isValid = computed(() => {
  if (selectedShipmentIds.value.length === 0) {
    validationError.value = '청구할 출하를 선택하세요.'
    return false
  }

  validationError.value = null
  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadData = async () => {
  if (!props.orderId) return

  // 초기화
  selectedShipmentIds.value = []
  remarks.value = ''
  validationError.value = null

  // 청구 가능 출하 목록 로드
  await baselineStore.loadProgressPaymentDataV2(props.orderId)

  // 기본적으로 모든 출하 선택
  selectedShipmentIds.value = availableShipments.value.map(s => s.shipmentId)
}

const submitClaim = async () => {
  if (!isValid.value || isSubmitting.value) return

  // API 호출 없이 데이터만 전달하여 서명 발송 모달 표시
  // 실제 API 호출은 ProgressSignatureModal에서 통합 API로 처리
  progressClaimData.value = {
    orderId: props.orderId,
    shipmentIds: selectedShipmentIds.value,
    remarks: remarks.value || undefined,
    deliveryRequestNo: fundStore.detail?.deliveryRequestNo || '',
    demandOrganization: fundStore.detail?.client || '',  // client가 수요기관
    projectName: fundStore.detail?.projectName || fundStore.detail?.siteName || '',
    totalAmount: selectedTotalAmount.value
  }

  // 서명 발송 모달 표시
  showSignatureModal.value = true
}

// 서명 발송 모달 닫기
const closeSignatureModal = () => {
  showSignatureModal.value = false
  progressClaimData.value = null
  emit('submitted')
  closeModal()
}

// 서명 발송 완료
const onSignatureSent = () => {
  showSignatureModal.value = false
  progressClaimData.value = null
  alert('기성 청구가 완료되고 서명 URL이 발송되었습니다.')
  emit('submitted')
  closeModal()
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadData()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  width: 90%;
  max-width: 1000px;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 로딩 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 1.5rem;
  color: #3b82f6;
}

/* 이전 차수 정보 */
.previous-info {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0369a1;
  font-size: 0.875rem;
}

.info-badge i {
  font-size: 1rem;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty-state p {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* 테이블 섹션 */
.table-section .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-section h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.table-section .hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  padding: 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.data-table td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tbody tr.selected {
  background: #eff6ff;
}

.data-table tbody tr.selected:hover {
  background: #dbeafe;
}

.checkbox-col {
  width: 40px;
}

.checkbox-col input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.data-table td.text-right {
  text-align: right;
}

.data-table td.amount {
  color: #1d4ed8;
  font-weight: 600;
}

.data-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

/* 계산 결과 */
.calculation-result {
  background: #f0fdf4;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-row label {
  font-size: 0.875rem;
  color: #374151;
}

.result-row .count {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.result-row .amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.result-row .amount.primary {
  color: #059669;
}

/* 폼 필드 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 유효성 에러 */
.validation-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* 버튼 - admin-buttons.css에서 import됨 */
</style>
