<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>추가변경</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 서명완료 상태 경고 -->
        <div v-if="isPendingSignature" class="warning-box">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <strong>서명이 완료된 상태입니다.</strong>
            <p>추가변경 시 재서명이 필요합니다.</p>
          </div>
        </div>

        <!-- 변경 사유 입력 -->
        <div class="form-section">
          <label class="form-label required">변경 사유</label>
          <textarea
            v-model="changeReason"
            class="form-textarea"
            rows="3"
            placeholder="변경 사유를 입력하세요 (필수)"
          ></textarea>
        </div>

        <!-- 품목별 수량 변경 -->
        <div class="form-section">
          <label class="form-label">품목별 수량 변경</label>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-item-name">품목명</th>
                  <th class="col-spec col-spec-header">규격</th>
                  <th class="col-quantity">현재수량</th>
                  <th class="col-quantity">변경수량</th>
                  <th class="col-diff">차이</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in editableItems" :key="item.skuId">
                  <td class="col-item-name">{{ item.itemName }}</td>
                  <td class="col-spec" :title="item.specification || '-'">{{ formatSpecification(item.specification) }}</td>
                  <td class="text-right">{{ formatNumber(item.currentQuantity) }}</td>
                  <td class="text-right">
                    <input
                      v-model.number="item.newQuantity"
                      type="number"
                      class="form-input form-input-sm text-right"
                      min="0"
                      @input="calculateDiff(item)"
                    />
                  </td>
                  <td class="text-right">
                    <span :class="getDiffClass(item.diff)">
                      {{ getDiffText(item.diff) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 변경 요약 -->
        <div v-if="hasChanges" class="summary-box">
          <i class="fas fa-info-circle"></i>
          <span>{{ changedItemCount }}개 품목의 수량이 변경됩니다.</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-primary"
          :disabled="!canSubmit || isSubmitting"
          @click="handleSubmit"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check"></i>
          변경 적용
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatNumber } from '~/utils/format'
import { shipmentService } from '~/services/shipment.service'
import type { AdditionalChangeItem, AdditionalChangeResponse } from '~/types/shipment-change'

// Props
interface ShipmentItem {
  skuId: string
  itemName: string
  specification?: string
  shipmentQuantity: number
}

interface Props {
  isOpen: boolean
  shipmentId: number
  shipmentStatus: string
  items: ShipmentItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  shipmentStatus: ''
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'complete', response: AdditionalChangeResponse): void
}>()

// State
const changeReason = ref('')
const isSubmitting = ref(false)

interface EditableItem {
  skuId: string
  itemName: string
  specification?: string
  currentQuantity: number
  newQuantity: number
  diff: number
}

const editableItems = ref<EditableItem[]>([])

// Computed
const isPendingSignature = computed(() => {
  return props.shipmentStatus === 'PENDING_SIGNATURE'
})

const hasChanges = computed(() => {
  return editableItems.value.some(item => item.diff !== 0)
})

const changedItemCount = computed(() => {
  return editableItems.value.filter(item => item.diff !== 0).length
})

const canSubmit = computed(() => {
  return changeReason.value.trim() !== '' && hasChanges.value
})

// Methods
const closeModal = () => {
  emit('close')
}

const initializeItems = () => {
  editableItems.value = props.items.map(item => ({
    skuId: item.skuId,
    itemName: item.itemName,
    specification: item.specification,
    currentQuantity: item.shipmentQuantity,
    newQuantity: item.shipmentQuantity,
    diff: 0
  }))
}

const calculateDiff = (item: EditableItem) => {
  item.diff = item.newQuantity - item.currentQuantity
}

const getDiffClass = (diff: number): string => {
  if (diff > 0) return 'text-success'
  if (diff < 0) return 'text-danger'
  return 'text-muted'
}

const getDiffText = (diff: number): string => {
  if (diff > 0) return `+${formatNumber(diff)}`
  if (diff < 0) return formatNumber(diff)
  return '0'
}

// 규격에서 첫 번째 콤마 이후 부분만 표시 (품목명 제외)
const formatSpecification = (spec: string | undefined): string => {
  if (!spec) return '-'
  const commaIndex = spec.indexOf(',')
  if (commaIndex === -1) return spec
  return spec.substring(commaIndex + 1).trim()
}

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 변경된 품목만 필터링
    const changedItems: AdditionalChangeItem[] = editableItems.value
      .filter(item => item.diff !== 0)
      .map(item => ({
        skuId: item.skuId,
        currentQuantity: item.currentQuantity,
        newQuantity: item.newQuantity
      }))

    const response = await shipmentService.executeAdditionalChange({
      shipmentId: props.shipmentId,
      items: changedItems,
      changeReason: changeReason.value.trim()
    })

    if (response.success) {
      emit('complete', response)
    } else {
      alert(response.errorMessage || '추가변경에 실패했습니다.')
    }
  } catch (error) {
    console.error('추가변경 실패:', error)
    alert('추가변경 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    changeReason.value = ''
    initializeItems()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
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
  max-width: 800px;
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

/* 경고 박스 */
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
}

.warning-box i {
  font-size: 1.25rem;
  color: #f59e0b;
  margin-top: 0.125rem;
}

.warning-box strong {
  display: block;
  margin-bottom: 0.25rem;
}

.warning-box p {
  margin: 0;
  font-size: 0.875rem;
}

/* 폼 섹션 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  padding: 0.5rem 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 0.175rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  text-align: center;
}

/* 컬럼별 너비 및 정렬 */
.col-item-name {
  width: 100px;
  min-width: 100px;
  text-align: center !important;
}

.col-spec {
  width: 280px;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-spec.col-spec-header {
  text-align: center !important;
}

td.col-spec {
  text-align: left !important;
}

.col-quantity {
  width: 80px;
  text-align: right !important;
}

.col-diff {
  width: 60px;
  text-align: right !important;
}

.data-table td.text-right {
  text-align: right !important;
}

.form-input-sm {
  width: 70px;
  padding: 0.375rem 0.5rem;
  border: 1.5px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8125rem;
}

.form-input-sm:focus {
  outline: none;
  border-color: #2563eb;
}

/* 색상 클래스 */
.text-success {
  color: #059669;
  font-weight: 500;
}

.text-danger {
  color: #dc2626;
  font-weight: 500;
}

.text-muted {
  color: #9ca3af;
}

/* 요약 박스 */
.summary-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-radius: 6px;
  color: #1e40af;
  font-size: 0.875rem;
}

.summary-box i {
  color: #3b82f6;
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
  background: #2563eb;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
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
