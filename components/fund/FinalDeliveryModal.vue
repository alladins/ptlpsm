<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>납품완료 처리</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times" />
        </button>
      </div>

      <div class="modal-body">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
          <i class="fas fa-spinner fa-spin" />
          <span>데이터를 불러오는 중...</span>
        </div>

        <template v-else>
          <!-- 납품완료 품목 목록 -->
          <div class="table-section">
            <div class="section-header">
              <h4>납품 품목 목록</h4>
              <span class="shipment-count">총 {{ deliveryDone?.items?.length || 0 }}건</span>
            </div>

            <div v-if="!deliveryDone || !deliveryDone.items || deliveryDone.items.length === 0" class="empty-message">
              <i class="fas fa-inbox" />
              <p>납품완료계 데이터가 없습니다.</p>
              <span>납품확인이 완료된 출하가 있어야 납품완료 처리가 가능합니다.</span>
            </div>

            <div v-else class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-no">
                      순번
                    </th>
                    <th class="col-item">
                      품목명
                    </th>
                    <th class="col-spec">
                      규격
                    </th>
                    <th class="col-unit">
                      단위
                    </th>
                    <th class="col-qty">
                      납품수량
                    </th>
                    <th class="col-amount">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in deliveryDone.items" :key="item.itemId">
                    <td class="text-center">
                      {{ item.sequenceNumber }}
                    </td>
                    <td>{{ item.itemName }}</td>
                    <td>{{ item.specification || '-' }}</td>
                    <td class="text-center">
                      {{ item.unit }}
                    </td>
                    <td class="text-right">
                      {{ formatNumber(item.deliveredQuantity) }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(item.totalAmount) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatNumber(totalQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatCurrency(totalAmount) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- 납품완료 금액 -->
          <div class="calculation-result">
            <div class="result-row total">
              <label>납품완료 총 금액</label>
              <span class="amount success">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>

          <!-- 정보 안내 -->
          <div class="info-box">
            <i class="fas fa-info-circle" />
            <div class="info-content">
              <strong>납품완료 처리 안내</strong>
              <p>선택한 대상자에게 납품완료확인서 서명 URL이 발송됩니다. 양쪽 서명이 완료되면 납품완료가 자동 처리됩니다.</p>
            </div>
          </div>

          <!-- 서명 대상자 선택 -->
          <div class="form-section">
            <h4>서명 대상자 선택</h4>
            <div class="recipient-grid">
              <!-- 시공사 현장소장 -->
              <div class="form-group">
                <label>시공사 현장소장</label>
                <select
                  v-model="selectedSiteManagerId"
                  class="form-select"
                  :disabled="isLoadingUsers"
                >
                  <option value="">
                    {{ isLoadingUsers ? '로딩 중...' : '선택하세요' }}
                  </option>
                  <option
                    v-for="manager in siteManagerList"
                    :key="manager.userId"
                    :value="manager.userId"
                  >
                    {{ manager.userName }} ({{ manager.phone }})
                    <template v-if="manager.companyName">
                      - {{ manager.companyName }}
                    </template>
                  </option>
                </select>
              </div>

              <!-- 현장감리원 -->
              <div class="form-group">
                <label>현장감리원</label>
                <select
                  v-model="selectedInspectorId"
                  class="form-select"
                  :disabled="isLoadingUsers"
                >
                  <option value="">
                    {{ isLoadingUsers ? '로딩 중...' : '선택하세요' }}
                  </option>
                  <option
                    v-for="inspector in inspectorList"
                    :key="inspector.userId"
                    :value="inspector.userId"
                  >
                    {{ inspector.userName }} ({{ inspector.phone }})
                    <template v-if="inspector.companyName">
                      - {{ inspector.companyName }}
                    </template>
                  </option>
                </select>
              </div>
            </div>
            <p class="help-text">
              최소 1명 이상 선택해야 합니다.
            </p>
          </div>

          <!-- 비고 입력 -->
          <div class="remarks-section">
            <label>비고</label>
            <textarea
              v-model="remarks"
              class="form-textarea"
              placeholder="비고 입력 (선택)"
              rows="2"
            />
          </div>

          <!-- 최종 확인 -->
          <div class="confirm-section">
            <label class="checkbox-label">
              <input v-model="confirmFinalDelivery" type="checkbox">
              <span>위 내용을 확인하였으며, 납품완료 처리를 진행합니다.</span>
            </label>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times" />
          취소
        </button>
        <button
          class="btn-primary"
          :disabled="!isValid || isSubmitting"
          @click="submitFinalDelivery"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-check-double" />
          납품완료 처리
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatCurrency, formatNumber } from '~/utils/format'
import { getDeliveryDoneByOrderId, completeManually } from '~/services/delivery-done.service'
import { userService } from '~/services/user.service'
import type { DeliveryDone } from '~/types/delivery-done'
import type { UserByRole } from '~/types/user'

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

// State
const isLoading = ref(false)
const isLoadingUsers = ref(false)
const isSubmitting = ref(false)
const confirmFinalDelivery = ref(false)
const remarks = ref('')

// 수신자 선택
const selectedSiteManagerId = ref<number | ''>('')
const selectedInspectorId = ref<number | ''>('')
const siteManagerList = ref<UserByRole[]>([])
const inspectorList = ref<UserByRole[]>([])

// 납품완료계 데이터
const deliveryDone = ref<DeliveryDone | null>(null)

// 합계 계산
const totalQuantity = computed(() => {
  if (!deliveryDone.value?.items) { return 0 }
  return deliveryDone.value.items.reduce((sum, item) => sum + (item.deliveredQuantity || 0), 0)
})

const totalAmount = computed(() => {
  if (!deliveryDone.value?.items) { return 0 }
  return deliveryDone.value.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
})

// 유효성 검사
const isValid = computed(() => {
  // 납품완료계 데이터가 있어야 함
  if (!deliveryDone.value) {
    return false
  }

  // 최종 확인 체크 (서명 없이 발행 — 수신자 선택 불필요)
  if (!confirmFinalDelivery.value) {
    return false
  }

  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadData = async () => {
  if (!props.orderId) { return }

  isLoading.value = true

  try {
    // 납품완료계 데이터 로드
    const result = await getDeliveryDoneByOrderId(props.orderId)
    deliveryDone.value = result
  } catch (error) {
    console.error('데이터 로드 실패:', error)
    alert('데이터를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const loadUsers = async () => {
  isLoadingUsers.value = true
  try {
    const users = await userService.getUsersByRoles(['SITE_MANAGER', 'SITE_INSPECTOR'])
    siteManagerList.value = users.filter(u => u.role === 'SITE_MANAGER')
    inspectorList.value = users.filter(u => u.role === 'SITE_INSPECTOR')
  } catch (error) {
    console.error('사용자 목록 로드 실패:', error)
    alert('사용자 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoadingUsers.value = false
  }
}

const submitFinalDelivery = async () => {
  if (!isValid.value || isSubmitting.value || !deliveryDone.value) { return }

  // 추가 확인
  if (!confirm('납품완료(잔금) 처리를 진행하시겠습니까?\n\n서명 없이 납품확인서 PDF가 즉시 발행됩니다. 이후 서명본 스캔을 업로드할 수 있습니다.')) {
    return
  }

  isSubmitting.value = true

  try {
    // 서명 없이 수동완료 처리 (서명란 공란 PDF 발행, 상태 COMPLETED)
    await completeManually(deliveryDone.value.deliveryDoneId)

    alert('납품완료 처리되었습니다. 납품확인서 PDF가 발행되었습니다.')
    emit('submitted')
    closeModal()
  } catch (error) {
    console.error('납품완료 처리 실패:', error)
    alert(error instanceof Error ? error.message : '납품완료 처리에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  confirmFinalDelivery.value = false
  remarks.value = ''
  deliveryDone.value = null
  selectedSiteManagerId.value = ''
  selectedInspectorId.value = ''
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
    loadData()
    loadUsers()
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
  max-width: 900px;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  color: #3b82f6;
}

/* 빈 상태 */
.empty-message {
  text-align: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 8px;
}

.empty-message i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-message p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.empty-message span {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* 섹션 헤더 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.shipment-count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 테이블 */
.table-section {
  margin-bottom: 0;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tfoot td {
  background: #f0f9ff;
  border-top: 2px solid #e5e7eb;
  font-weight: 600;
}

.col-no { width: 60px; }
.col-item { min-width: 150px; }
.col-spec { min-width: 120px; }
.col-unit { width: 60px; }
.col-qty { width: 90px; }
.col-amount { width: 120px; }

.text-center { text-align: center; }
.text-right { text-align: right; }

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

.result-row .amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.result-row .amount.success {
  color: #2563eb;
}

.result-row.total {
  padding-top: 0.5rem;
}

.result-row.total label {
  font-weight: 600;
}

/* 서명 대상자 선택 */
.form-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.recipient-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  background: white;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

@media (max-width: 640px) {
  .recipient-grid {
    grid-template-columns: 1fr;
  }
}

/* 정보 박스 */
.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.info-box > i {
  color: #3b82f6;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-content strong {
  color: #1e40af;
  display: block;
  margin-bottom: 0.25rem;
}

.info-content p {
  color: #3b82f6;
  font-size: 0.875rem;
  margin: 0;
}

/* 비고 입력 */
.remarks-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.remarks-section label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 최종 확인 섹션 */
.confirm-section {
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
  font-weight: 500;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

/* 버튼 */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}
</style>
