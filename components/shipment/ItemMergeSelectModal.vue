<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <!-- 헤더 -->
        <div class="modal-header">
          <h3>품목 병합</h3>
          <button type="button" class="close-btn" @click="handleClose">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 본문 -->
        <div class="modal-body">
          <!-- 추가할 품목 정보 -->
          <div class="new-item-info">
            <div class="info-label">추가할 품목</div>
            <div class="info-box">
              <span class="badge-new">신규</span>
              <span class="item-name">{{ newItem.itemName }}</span>
              <span class="item-sku">{{ newItem.skuName }}</span>
              <span class="item-spec">{{ newItem.specification }}</span>
            </div>
          </div>

          <!-- 병합 수량 입력 -->
          <div class="merge-quantity-section">
            <label>병합 수량 (필수)</label>
            <div class="quantity-input-group">
              <input
                type="number"
                v-model.number="mergeQuantity"
                :min="0"
                placeholder="0"
                class="quantity-input"
              />
              <span class="unit">{{ newItem.unit || 'm2' }}</span>
            </div>
            <span class="hint">이 수량이 각 선택 품목에서 차감됩니다</span>
            <span v-if="quantityWarning" class="error-hint">
              {{ quantityWarning }}
            </span>
          </div>

          <!-- 병합 대상 선택 -->
          <div class="merge-target-section">
            <label>병합 대상 선택 (최대 2개)</label>
            <div class="target-table-wrapper">
              <table class="merge-target-table">
                <thead>
                  <tr>
                    <th style="width: 40px"></th>
                    <th>SKU 품명</th>
                    <th style="width: 80px">출하수량</th>
                    <th style="width: 80px">잔여수량</th>
                    <th style="width: 80px">차감 후</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in targetItems"
                    :key="item.skuId"
                    :class="{ selected: item.selected }"
                    @click="toggleSelection(item.skuId)"
                  >
                    <td class="checkbox-col">
                      <input
                        type="checkbox"
                        :checked="item.selected"
                        tabindex="-1"
                        style="pointer-events: none;"
                      />
                    </td>
                    <td>{{ item.skuName }}</td>
                    <td class="text-right">{{ formatQuantity(item.currentQuantity) }}</td>
                    <td class="text-right">{{ formatQuantity(item.remainingQuantity) }}</td>
                    <td class="text-right" :class="getDeductedClass(item)">
                      {{ getDeductedQuantity(item) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 안내 메시지 -->
          <div v-if="selectedCount > 0 && mergeQuantity > 0" class="info-message">
            <i class="fas fa-info-circle"></i>
            선택한 {{ selectedCount }}개 품목에서 각각 {{ mergeQuantity }}씩 차감됩니다.
          </div>
        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="handleSkip">
            병합 없이 추가
          </button>
          <button type="button" class="btn-cancel" @click="handleClose">
            취소
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!isValidMerge"
            @click="handleConfirm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatQuantity } from '~/utils/format'

// Props
interface NewItemInfo {
  skuId: string
  itemId: string
  itemName: string
  skuName: string
  specification: string
  unit: string
  unitPrice: number
}

interface ExistingItem {
  skuId: string
  skuName: string
  currentQuantity: number  // 출하수량
  remainingQuantity: number  // 잔여수량
}

interface Props {
  isOpen: boolean
  newItem: NewItemInfo
  existingItems: ExistingItem[]
}

// Emits
interface MergeResult {
  newItem: NewItemInfo & { shippingQuantity: number }
  deductions: { skuId: string; skuName: string; amount: number }[]
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', result: MergeResult): void
  (e: 'skip', quantity: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 상태
const mergeQuantity = ref(0)

interface TargetItem extends ExistingItem {
  selected: boolean
}

const targetItems = ref<TargetItem[]>([])

// 모달 열릴 때 초기화
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    mergeQuantity.value = 0
    targetItems.value = props.existingItems.map(item => ({
      ...item,
      selected: false
    }))
  }
}, { immediate: true })

// 선택된 개수
const selectedCount = computed(() => {
  return targetItems.value.filter(i => i.selected).length
})

// 선택 토글 (최대 2개 제한) - 인덱스 기반 업데이트로 반응성 보장
const toggleSelection = (skuId: string) => {
  const index = targetItems.value.findIndex(i => i.skuId === skuId)
  if (index === -1) return

  const currentItem = targetItems.value[index]

  if (currentItem.selected) {
    // 선택 해제 - 새 객체로 교체
    targetItems.value[index] = { ...currentItem, selected: false }
  } else {
    // 선택 - 2개 제한 체크
    if (selectedCount.value >= 2) {
      alert('최대 2개까지 선택할 수 있습니다.')
      return
    }
    targetItems.value[index] = { ...currentItem, selected: true }
  }
}

// 수량 초과 경고 메시지 (잔여수량 기준으로 검증)
const quantityWarning = computed(() => {
  if (mergeQuantity.value <= 0) return null
  const selected = targetItems.value.filter(i => i.selected)
  for (const item of selected) {
    // 전체 출하 가능 수량 = 잔여수량 (발주에서 아직 출하되지 않은 수량)
    if (mergeQuantity.value > item.remainingQuantity) {
      return `${item.skuName}의 잔여수량(${item.remainingQuantity})보다 큽니다.`
    }
  }
  return null
})

// 검증
const isValidMerge = computed(() => {
  if (selectedCount.value === 0) return false
  if (mergeQuantity.value <= 0) return false
  if (quantityWarning.value) return false
  return true
})

// 차감 후 수량 계산 (잔여수량에서 차감)
const getDeductedQuantity = (item: TargetItem): string => {
  if (!item.selected || mergeQuantity.value <= 0) return '-'
  const result = item.remainingQuantity - mergeQuantity.value
  if (result < 0) return '불가'
  return String(result)
}

// 차감 후 클래스
const getDeductedClass = (item: TargetItem): string => {
  if (!item.selected || mergeQuantity.value <= 0) return ''
  const result = item.remainingQuantity - mergeQuantity.value
  if (result < 0) return 'deducted-invalid'
  if (result === 0) return 'deducted-zero'
  return 'deducted-quantity'
}

// 닫기
const handleClose = () => {
  emit('close')
}

// 병합 없이 추가 (입력된 수량 전달)
const handleSkip = () => {
  emit('skip', mergeQuantity.value)
}

// 확인
const handleConfirm = () => {
  if (!isValidMerge.value) return

  const selected = targetItems.value.filter(i => i.selected)
  const result: MergeResult = {
    newItem: {
      ...props.newItem,
      shippingQuantity: mergeQuantity.value
    },
    deductions: selected.map(item => ({
      skuId: item.skuId,
      skuName: item.skuName,
      amount: mergeQuantity.value
    }))
  }

  emit('confirm', result)
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';

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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
}

.close-btn:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* 추가할 품목 정보 */
.new-item-info {
  margin-bottom: 1.5rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.info-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
}

.badge-new {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #10b981;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
}

.item-sku {
  color: #6b7280;
}

.item-spec {
  color: #9ca3af;
  font-size: 0.875rem;
}

/* 병합 수량 입력 */
.merge-quantity-section {
  margin-bottom: 1.5rem;
}

.merge-quantity-section label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.quantity-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-input {
  width: 150px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  text-align: right;
}

.quantity-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.unit {
  color: #6b7280;
  font-size: 0.875rem;
}

.hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.error-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #dc2626;
}

/* 병합 대상 선택 */
.merge-target-section {
  margin-bottom: 1rem;
}

.merge-target-section label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.target-table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.merge-target-table {
  width: 100%;
  border-collapse: collapse;
}

.merge-target-table th {
  padding: 0.625rem 0.75rem;
  background: #f9fafb;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.merge-target-table td {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

.merge-target-table tr:last-child td {
  border-bottom: none;
}

.merge-target-table tr {
  cursor: pointer;
  transition: background 0.15s;
}

.merge-target-table tr:hover {
  background: #f9fafb;
}

.merge-target-table tr.selected {
  background: #eff6ff;
}

.merge-target-table tr.selected:hover {
  background: #dbeafe;
}

.checkbox-col {
  text-align: center;
}

.checkbox-col input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.text-right {
  text-align: right;
}

.deducted-quantity {
  color: #059669;
  font-weight: 600;
}

.deducted-zero {
  color: #f59e0b;
  font-weight: 600;
}

.deducted-invalid {
  color: #dc2626;
  font-weight: 600;
}

/* 안내 메시지 */
.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border-radius: 6px;
  color: #0369a1;
  font-size: 0.875rem;
}

.info-message i {
  font-size: 1rem;
}

/* 푸터 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: #f3f4f6;
  color: #374151;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
