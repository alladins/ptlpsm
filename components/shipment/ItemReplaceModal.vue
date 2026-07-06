<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <!-- 헤더 -->
        <div class="modal-header">
          <h3>품목 대체</h3>
          <button type="button" class="close-btn" @click="handleClose">
            <i class="fas fa-times" />
          </button>
        </div>

        <!-- 본문 -->
        <div class="modal-body">
          <!-- 소스(A) 정보 -->
          <div class="section">
            <div class="section-label">
              대체 출처 품목 (차감 대상)
            </div>
            <div class="info-box source-box">
              <span class="item-name">{{ source.itemName }}</span>
              <span class="item-sku">{{ source.skuName }} (SKU {{ source.skuId }})</span>
              <span class="item-meta">단가 {{ formatNumber(source.unitPrice) }} · 잔여 {{ formatQuantity(maxDeductQuantity) }}</span>
            </div>
          </div>

          <!-- A 차감수량 -->
          <div class="section">
            <label class="section-label">차감수량 (출처에서 빼는 수량)</label>
            <div class="quantity-input-group">
              <input
                v-model.number="deductQuantity"
                type="number"
                :min="0"
                :max="maxDeductQuantity"
                step="2"
                placeholder="0"
                class="quantity-input"
              >
              <span class="unit">{{ source.unit || 'm2' }}</span>
            </div>
            <span v-if="deductWarning" class="error-hint">{{ deductWarning }}</span>
          </div>

          <!-- 목적지(B) 선택 -->
          <div class="section">
            <label class="section-label">대체 품목 선택</label>
            <div class="mode-tabs">
              <label class="mode-tab" :class="{ active: destinationMode === 'existing' }">
                <input v-model="destinationMode" type="radio" value="existing">
                기존 발주 품목
              </label>
              <label class="mode-tab" :class="{ active: destinationMode === 'new' }">
                <input v-model="destinationMode" type="radio" value="new">
                신규 SKU
              </label>
            </div>

            <!-- (a) 기존 품목 드롭다운 -->
            <div v-if="destinationMode === 'existing'" class="dest-existing">
              <select v-model="selectedExistingSkuId" class="form-select">
                <option value="">
                  {{ destinationOptions.length > 0 ? '대체할 품목을 선택하세요' : '선택 가능한 다른 품목이 없습니다' }}
                </option>
                <option
                  v-for="opt in destinationOptions"
                  :key="opt.skuId"
                  :value="opt.skuId"
                >
                  {{ opt.itemName }} - {{ opt.skuName }} (단가 {{ formatNumber(opt.unitPrice) }})
                </option>
              </select>
            </div>

            <!-- (b) 신규 SKU 선택 -->
            <div v-else class="dest-new">
              <button type="button" class="btn-select-sku" @click="showSkuSelector = true">
                <i class="fas fa-search" />
                SKU 선택
              </button>
              <div v-if="selectedNewSku" class="info-box new-box">
                <span class="badge-new">신규</span>
                <span class="item-name">{{ selectedNewSku.itemName }}</span>
                <span class="item-sku">{{ selectedNewSku.skuName }} (SKU {{ selectedNewSku.skuId }})</span>
                <span class="item-meta">단가 {{ formatNumber(selectedNewSku.unitPrice) }}</span>
              </div>
            </div>
          </div>

          <!-- B 대체수량 -->
          <div class="section">
            <label class="section-label">대체수량 (대체 품목에 더하는 수량)</label>
            <div class="quantity-input-group">
              <input
                v-model.number="addQuantity"
                type="number"
                :min="0"
                step="2"
                placeholder="0"
                class="quantity-input"
              >
              <span class="unit">{{ destinationUnit }}</span>
            </div>
            <span v-if="addWarning" class="error-hint">{{ addWarning }}</span>
            <span v-else class="hint">단가가 달라 차감수량과 다를 수 있습니다. (2㎡=1장, 짝수 입력)</span>
          </div>

          <!-- 미리보기 -->
          <div v-if="deductQuantity > 0 || addQuantity > 0" class="preview-box">
            <div class="preview-row">
              <span>출처 차감금액</span>
              <span class="preview-amount minus">- {{ formatCurrency(deductAmount) }}</span>
            </div>
            <div class="preview-row">
              <span>대체 추가금액</span>
              <span class="preview-amount plus">+ {{ formatCurrency(addAmount) }}</span>
            </div>
            <div class="preview-row preview-diff">
              <span>차액 (참고용)</span>
              <span class="preview-amount" :class="diffAmount >= 0 ? 'plus' : 'minus'">
                {{ diffAmount >= 0 ? '+' : '-' }} {{ formatCurrency(Math.abs(diffAmount)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="handleClose">
            취소
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!isValid"
            @click="handleConfirm"
          >
            확인
          </button>
        </div>
      </div>
    </div>

    <!-- 신규 SKU 선택 팝업 (대체용) -->
    <ItemSkuSelector
      v-model="showSkuSelector"
      @sku-selected="handleNewSkuSelected"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import type { Item, ItemSku } from '~/services/item.service'
import { formatNumber, formatCurrency, formatQuantity } from '~/utils/format'

// 출처(A) 품목 정보
interface SourceItem {
  skuId: string
  itemName: string
  skuName: string
  specification: string
  unit: string
  unitPrice: number
}

// 기존 발주 품목(목적지 후보) 정보
interface DestinationOption {
  skuId: string
  skuName: string
  itemName: string
  unitPrice: number
}

// 신규 SKU 목적지 정보
interface NewDestination {
  skuId: string
  itemId: string
  itemName: string
  skuName: string
  specification: string
  unit: string
  unitPrice: number
}

interface Props {
  isOpen: boolean
  source: SourceItem
  maxDeductQuantity: number
  destinationOptions: DestinationOption[]
  existingSkuIds: string[]
}

// 대체 결과
interface ReplaceResult {
  sourceSkuId: string
  deductQuantity: number
  destinationMode: 'existing' | 'new'
  destination: string | NewDestination
  addQuantity: number
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', result: ReplaceResult): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 상태
const deductQuantity = ref(0)
const destinationMode = ref<'existing' | 'new'>('existing')
const selectedExistingSkuId = ref('')
const addQuantity = ref(0)
const selectedNewSku = ref<NewDestination | null>(null)
const showSkuSelector = ref(false)

// 모달 열릴 때 초기화
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    deductQuantity.value = 0
    destinationMode.value = props.destinationOptions.length > 0 ? 'existing' : 'new'
    selectedExistingSkuId.value = ''
    addQuantity.value = 0
    selectedNewSku.value = null
    showSkuSelector.value = false
  }
}, { immediate: true })

// 차감수량 경고
const deductWarning = computed(() => {
  if (deductQuantity.value <= 0) { return null }
  if (deductQuantity.value > props.maxDeductQuantity) {
    return `출처 잔여수량(${formatQuantity(props.maxDeductQuantity)})을 초과할 수 없습니다.`
  }
  if (deductQuantity.value % 2 !== 0) {
    return '차감수량은 짝수(2의 배수)여야 합니다. (2㎡=1장)'
  }
  return null
})

// 대체수량 경고 (짝수)
const addWarning = computed(() => {
  if (addQuantity.value <= 0) { return null }
  if (addQuantity.value % 2 !== 0) {
    return '대체수량은 짝수(2의 배수)여야 합니다. (2㎡=1장)'
  }
  return null
})

// 선택된 목적지 단가
const destinationUnitPrice = computed(() => {
  if (destinationMode.value === 'existing') {
    const opt = props.destinationOptions.find(o => o.skuId === selectedExistingSkuId.value)
    return opt ? opt.unitPrice : 0
  }
  return selectedNewSku.value ? selectedNewSku.value.unitPrice : 0
})

// 목적지 단위 표기
const destinationUnit = computed(() => {
  if (destinationMode.value === 'new' && selectedNewSku.value) {
    return selectedNewSku.value.unit || 'm2'
  }
  return 'm2'
})

// 미리보기 금액
const deductAmount = computed(() => props.source.unitPrice * deductQuantity.value)
const addAmount = computed(() => destinationUnitPrice.value * addQuantity.value)
const diffAmount = computed(() => addAmount.value - deductAmount.value)

// 신규 SKU 선택 처리 (규격 문자열 생성은 register.vue 의 handleSkuSelected 패턴 준수)
const handleNewSkuSelected = (item: Item, sku: ItemSku) => {
  const skuIdStr = String(sku.skuId)

  // 이미 발주/추가 목록에 있는 품목이면 신규 대체 불가
  if (props.existingSkuIds.includes(skuIdStr)) {
    alert('이미 발주/추가 목록에 있는 품목입니다. 신규 대체는 발주에 없는 품목만 가능합니다.')
    return
  }

  // 품목명 추출: "폴리우레탄기포단열재,경질2종2호" → "기포단열재"
  let simpleItemName = '기포단열재'
  if (item.itemNm) {
    const parts = item.itemNm.split(',')
    if (parts.length > 0) {
      simpleItemName = parts[0].replace('폴리우레탄', '')
    }
  }

  // 규격 문자열 생성
  const specParts: string[] = []
  if (item.itemNm) {
    const itemParts = item.itemNm.split(',')
    if (itemParts.length > 0) { specParts.push(itemParts[0]) }
  }
  if (sku.skuNm) { specParts.push(sku.skuNm) }
  if (sku.width && sku.height && sku.thickness) {
    const w = Math.round(Number(sku.width))
    const h = Math.round(Number(sku.height))
    const t = Math.round(Number(sku.thickness))
    specParts.push(`${w}×${h}×${t}mm`)
  }
  if (item.itemNm) {
    const itemParts = item.itemNm.split(',')
    if (itemParts.length > 1) { specParts.push(itemParts.slice(1).join(',')) }
  }

  selectedNewSku.value = {
    skuId: skuIdStr,
    itemId: item.itemId,
    itemName: simpleItemName,
    skuName: sku.skuNm || `${sku.thickness}T`,
    specification: specParts.join(','),
    unit: 'm2',
    unitPrice: sku.unitPrice || 0
  }
}

// 확인 버튼 활성화 조건
const isValid = computed(() => {
  if (deductQuantity.value <= 0 || deductWarning.value) { return false }
  if (addQuantity.value <= 0 || addWarning.value) { return false }
  if (destinationMode.value === 'existing') {
    return !!selectedExistingSkuId.value
  }
  return !!selectedNewSku.value
})

// 닫기
const handleClose = () => {
  emit('close')
}

// 확인
const handleConfirm = () => {
  if (!isValid.value) { return }

  const result: ReplaceResult = {
    sourceSkuId: props.source.skuId,
    deductQuantity: deductQuantity.value,
    destinationMode: destinationMode.value,
    destination: destinationMode.value === 'existing'
      ? selectedExistingSkuId.value
      : (selectedNewSku.value as NewDestination),
    addQuantity: addQuantity.value
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
  width: 560px;
  max-width: 90vw;
  max-height: 85vh;
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

/* 섹션 */
.section {
  margin-bottom: 1.25rem;
}

.section-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

/* 정보 박스 */
.info-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.source-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.new-box {
  background: #f0fdf4;
  border: 1px solid #86efac;
  margin-top: 0.625rem;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
}

.item-sku {
  color: #374151;
  font-weight: 500;
}

.item-meta {
  color: #6b7280;
  font-size: 0.8125rem;
}

.badge-new {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #10b981;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
}

/* 수량 입력 */
.quantity-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-input {
  width: 180px;
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

/* 모드 탭 */
.mode-tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-tab.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

/* 폼 셀렉트 */
.form-select {
  width: 100%;
  height: 36px;
  padding: 0 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 신규 SKU 선택 버튼 */
.btn-select-sku {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-select-sku:hover {
  background: #2563eb;
}

/* 미리보기 */
.preview-box {
  padding: 0.875rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #374151;
  padding: 0.25rem 0;
}

.preview-diff {
  margin-top: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #d1d5db;
  font-weight: 600;
}

.preview-amount {
  font-weight: 600;
}

.preview-amount.plus {
  color: #059669;
}

.preview-amount.minus {
  color: #dc2626;
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
