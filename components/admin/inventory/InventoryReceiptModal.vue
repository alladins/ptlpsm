<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content ir-modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '재고 직접 입고 수정' : '재고 직접 입고' }}</h3>
          <button class="modal-close" @click="close">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <p class="intro">
            발주서 없이 재고만 늘리는 경우에 씁니다. 제조사에게 줄 돈(지급액)은 생기지 않습니다.
            저장하면 «작성중» 으로 남고, <b>[확정]</b> 을 눌러야 재고가 늘어납니다.
          </p>

          <!-- 입고 유형 -->
          <div class="form-group">
            <label class="form-label required">입고 유형</label>
            <div class="type-buttons">
              <button
                v-for="t in typeOptions"
                :key="t.value"
                type="button"
                class="type-btn"
                :class="{ active: form.receiptType === t.value }"
                @click="onTypeChange(t.value)"
              >
                {{ t.label }}
              </button>
            </div>
            <p class="form-hint">
              {{ RECEIPT_TYPE_HINTS[form.receiptType] }}
            </p>
          </div>

          <!-- 창고 -->
          <div class="form-group" :class="{ 'is-error': errors.warehouseId }">
            <label class="form-label required">입고 창고</label>
            <select v-model.number="form.warehouseId" class="form-input">
              <option :value="0" disabled>
                창고를 선택하세요
              </option>
              <option v-for="wh in warehouseList" :key="wh.warehouseId" :value="wh.warehouseId">
                {{ wh.warehouseName }}
              </option>
            </select>
          </div>

          <!-- 품목 — 재고가 0 인 품목도 들어올 수 있으므로 재고 목록이 아니라 품목 마스터에서 고른다 -->
          <div class="form-group" :class="{ 'is-error': errors.skuId }">
            <label class="form-label required">품목 (SKU)</label>
            <div class="sku-row">
              <input
                type="text"
                class="form-input"
                :value="form.skuName"
                placeholder="[품목 선택] 을 눌러 고르세요"
                readonly
                @click="showSkuSelector = true"
              >
              <button type="button" class="btn-pick" @click="showSkuSelector = true">
                품목 선택
              </button>
            </div>
          </div>

          <!-- 수량 -->
          <div class="form-group" :class="{ 'is-error': errors.quantity }">
            <label class="form-label required">입고 수량</label>
            <div class="qty-row">
              <div class="qty-input">
                <input
                  v-model.number="form.sheetCount"
                  type="number"
                  min="1"
                  step="1"
                  class="form-input"
                  @keydown="blockDecimalKey"
                  @paste="stripDecimalOnPaste"
                  @input="onSheetInput"
                >
                <span class="qty-unit">매</span>
              </div>
              <span class="qty-eq">=</span>
              <div class="qty-input">
                <input
                  v-model.number="form.quantity"
                  type="number"
                  min="1"
                  step="2"
                  class="form-input"
                  @keydown="blockDecimalKey"
                  @paste="stripDecimalOnPaste"
                  @input="onSqmInput"
                >
                <span class="qty-unit">㎡</span>
              </div>
            </div>
            <p class="form-hint">
              1매 = 2㎡ 입니다. 어느 쪽을 입력해도 자동으로 환산됩니다.
            </p>
          </div>

          <!-- 생산자 — 선택 항목 (2026-09-21 고객 확정). 리드파워(본사) + 원가가 등록된 회사 -->
          <div class="form-group" :class="{ 'is-error': errors.producerCompanyId }">
            <label class="form-label">생산자</label>
            <select v-model="form.producerCompanyId" class="form-input">
              <option :value="null">
                모름 / 선택 안 함
              </option>
              <option v-for="p in producers" :key="p.id" :value="p.id">
                {{ p.companyType === 'LEADPOWER' ? `${p.companyName} (본사 보유·이월)` : p.companyName }}
              </option>
            </select>
            <p class="form-hint">
              선택 항목입니다. 어느 회사 물건인지 알면 고르세요 — 소진·출고 때 원가 내역에 표시됩니다.
            </p>
          </div>

          <!-- 원가 -->
          <div class="form-group" :class="{ 'is-error': errors.unitCost }">
            <label class="form-label" :class="{ required: costRequired }">원가 (원/㎡)</label>
            <input
              v-model.number="form.unitCost"
              type="number"
              min="0"
              step="1"
              class="form-input cost-input"
              :placeholder="costPlaceholder"
              @keydown="blockDecimalKey"
              @paste="stripDecimalOnPaste"
            >
            <p class="form-hint">
              <template v-if="defaultsToZero">
                비워 두면 0원으로 들어갑니다(이월 재고). 실제 매입 원가를 알면 입력하세요.
              </template>
              <template v-else-if="producerHasCostTable">
                비워 두면 입고일 시점에 등록된 {{ producerName }} 원가로 채웁니다. 무상이면 0 을 입력하세요.
              </template>
              <template v-else>
                원가를 입력하세요. 무상으로 받은 물량이면 0 을 입력하면 됩니다.
              </template>
            </p>
            <p v-if="amountPreview !== null" class="form-hint amount">
              금액 {{ amountPreview.toLocaleString() }}원 (재고 장부 기준 — 지급액 아님)
            </p>
          </div>

          <!-- 입고일 -->
          <div class="form-group" :class="{ 'is-error': errors.receiptDate }">
            <label class="form-label required">입고일</label>
            <input v-model="form.receiptDate" type="date" class="form-input">
          </div>

          <!-- 사유 -->
          <div class="form-group" :class="{ 'is-error': errors.remarks }">
            <label class="form-label required">사유</label>
            <textarea
              v-model="form.remarks"
              class="form-input"
              rows="2"
              placeholder="예) 금성 8장 무상 제공 (9/20 파손분 대체)"
            />
          </div>

          <p v-if="errorMsg" class="modal-error">
            {{ errorMsg }}
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="close">
            취소
          </button>
          <button class="btn-save" :disabled="saving" @click="handleSave">
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 품목 선택 팝업 — 입고 모달보다 위에 뜨도록 별도 층에 둔다 -->
    <div v-if="modelValue" class="sku-layer">
      <ItemSkuSelector v-model="showSkuSelector" @sku-selected="onSkuSelected" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import { warehouseService } from '~/services/warehouse.service'
import { inventoryReceiptService } from '~/services/inventory-receipt.service'
import { blockDecimalKey, stripDecimalOnPaste } from '~/utils/numberInput'
import { getLocalDateString } from '~/utils/format'
import { reportValidationErrors } from '~/utils/formValidation'
import { SQM_PER_SHEET } from '~/types/inventory-consumption'
import {
  RECEIPT_TYPE,
  RECEIPT_TYPE_LABELS,
  RECEIPT_TYPE_HINTS,
  costDefaultsToZero,
  type ReceiptType,
  type InventoryReceipt,
  type ProducerOption
} from '~/types/inventory-receipt'

interface Props {
  modelValue: boolean
  /** 수정 대상 (없으면 신규) */
  editTarget?: InventoryReceipt | null
}
const props = withDefaults(defineProps<Props>(), { editTarget: null })
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [InventoryReceipt] }>()

const typeOptions = (Object.keys(RECEIPT_TYPE_LABELS) as ReceiptType[])
  .map(v => ({ value: v, label: RECEIPT_TYPE_LABELS[v] }))

const warehouseList = ref<any[]>([])
const producers = ref<ProducerOption[]>([])
const showSkuSelector = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const errors = ref<Record<string, string>>({})

const emptyForm = () => ({
  receiptType: RECEIPT_TYPE.GENERAL as ReceiptType,
  warehouseId: 0,
  skuId: '',
  skuName: '',
  quantity: null as number | null,
  sheetCount: null as number | null,
  producerCompanyId: null as number | null,
  /** ⚠ v-model.number 는 비우면 '' 가 된다 — hasCostInput 으로 판단할 것 (0 을 «비움» 으로 취급하면 무상 입고가 안 된다) */
  unitCost: null as number | string | null,
  // ⚠ toISOString() 은 UTC 라 KST 새벽에 전날이 된다
  receiptDate: getLocalDateString(),
  remarks: ''
})
const form = ref(emptyForm())

const isEdit = computed(() => !!props.editTarget)
/** 원가를 입력했는가 — 0 도 입력이다 */
const hasCostInput = computed(() => form.value.unitCost !== null && form.value.unitCost !== '')
const costValue = computed(() => (hasCostInput.value ? Number(form.value.unitCost) : null))
/** 이월 재고는 비우면 0 */
const defaultsToZero = computed(() => costDefaultsToZero(form.value.receiptType))
const selectedProducer = computed(() => producers.value.find(p => p.id === form.value.producerCompanyId) ?? null)
/** 원가표가 있는 생산자인가 — 리드파워(본사)는 원가표가 없다 */
const producerHasCostTable = computed(() => !!selectedProducer.value && selectedProducer.value.companyType !== 'LEADPOWER')
const producerName = computed(() => selectedProducer.value?.companyName ?? '')
/** 비워 둘 수 없는 경우 — 이월 재고도 아니고 원가표로 채울 생산자도 없을 때 */
const costRequired = computed(() => !defaultsToZero.value && !producerHasCostTable.value)
const costPlaceholder = computed(() => {
  if (defaultsToZero.value) { return '비우면 0' }
  return producerHasCostTable.value ? '비우면 원가표' : '원가 입력 (무상이면 0)'
})
const amountPreview = computed(() => {
  if (!form.value.quantity) { return null }
  if (hasCostInput.value) { return (costValue.value ?? 0) * form.value.quantity }
  return defaultsToZero.value ? 0 : null
})

const onTypeChange = (t: ReceiptType) => {
  form.value.receiptType = t
}

// 매↔㎡ 상호 환산
const onSheetInput = () => {
  form.value.quantity = form.value.sheetCount ? form.value.sheetCount * SQM_PER_SHEET : null
}
const onSqmInput = () => {
  form.value.sheetCount = form.value.quantity ? Math.round(form.value.quantity / SQM_PER_SHEET) : null
}

const onSkuSelected = (_item: any, sku: any) => {
  form.value.skuId = String(sku.skuId)
  form.value.skuName = sku.skuNm
  showSkuSelector.value = false
}

watch(() => props.modelValue, async (open) => {
  if (!open) { return }
  errorMsg.value = ''
  errors.value = {}

  if (warehouseList.value.length === 0) {
    try { warehouseList.value = await warehouseService.getWarehouseList(false) } catch (e) { console.error(e) }
  }
  if (producers.value.length === 0) {
    try { producers.value = await inventoryReceiptService.getProducers() } catch (e) { console.error(e) }
  }

  const t = props.editTarget
  form.value = t
    ? {
        receiptType: t.receiptType,
        warehouseId: t.warehouseId,
        skuId: t.skuId,
        skuName: t.skuName ?? t.skuId,
        quantity: t.quantity,
        sheetCount: t.sheetCount ?? Math.round(t.quantity / SQM_PER_SHEET),
        producerCompanyId: t.producerCompanyId,
        unitCost: t.unitCost,
        receiptDate: t.receiptDate,
        remarks: t.remarks ?? ''
      }
    : emptyForm()
})

const close = () => emit('update:modelValue', false)

/**
 * 저장 실패로 붙은 빨간 테두리는 그 칸을 고치는 즉시 풀어 준다.
 * (다시 [저장] 을 눌러야만 풀리면 고쳤는데도 틀린 것처럼 보인다 — 2026-09-21 개발 검증에서 발견)
 * 새 오류를 붙이지는 않는다 — 입력 도중에 빨갛게 되는 건 방해다.
 */
watch(form, () => {
  if (Object.keys(errors.value).length === 0) { return }
  const still = collectErrors()
  errors.value = Object.fromEntries(Object.entries(errors.value).filter(([k]) => k in still))
}, { deep: true })

const validate = () => {
  const e = collectErrors()
  errors.value = e
  return reportValidationErrors(e, [], '.ir-modal')
}

function collectErrors (): Record<string, string> {
  const e: Record<string, string> = {}
  if (!form.value.warehouseId) { e.warehouseId = '입고 창고를 선택하세요.' }
  if (!form.value.skuId) { e.skuId = '품목을 선택하세요.' }
  if (!form.value.quantity || form.value.quantity <= 0) { e.quantity = '입고 수량을 입력하세요.' }
  if (costRequired.value && !hasCostInput.value) {
    e.unitCost = '원가를 입력하세요. 무상으로 받은 물량이면 0 을 입력하면 됩니다.'
  }
  if (hasCostInput.value && (costValue.value ?? 0) < 0) { e.unitCost = '원가는 0원 이상이어야 합니다.' }
  if (!form.value.receiptDate) { e.receiptDate = '입고일을 입력하세요.' }
  if (!form.value.remarks.trim()) { e.remarks = '사유를 입력하세요. 나중에 왜 재고가 늘었는지 알 수 있어야 합니다.' }
  return e
}

const handleSave = async () => {
  if (!(await validate())) { return }
  saving.value = true
  errorMsg.value = ''
  try {
    const payload = {
      receiptType: form.value.receiptType,
      warehouseId: form.value.warehouseId,
      skuId: form.value.skuId,
      quantity: form.value.quantity,
      sheetCount: form.value.sheetCount,
      producerCompanyId: form.value.producerCompanyId,
      // 비우면(null) 서버가 채운다 — 이월 재고는 0, 그 외는 생산자 원가표. 0 은 0 그대로 보낸다
      unitCost: costValue.value,
      receiptDate: form.value.receiptDate,
      remarks: form.value.remarks.trim()
    }
    const saved = props.editTarget
      ? await inventoryReceiptService.update(props.editTarget.receiptId, payload)
      : await inventoryReceiptService.create(payload)
    emit('saved', saved)
    close()
  } catch (e: any) {
    errorMsg.value = e?.message || '저장에 실패했습니다.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.ir-modal { max-width: 580px; width: 100%; }

.intro {
  margin: 0 0 1rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  background: #f0f9ff;
  color: #0c4a6e;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.type-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.type-btn {
  padding: 0.45rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 0.8125rem;
  cursor: pointer;
}
.type-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }

.sku-row { display: flex; gap: 0.5rem; }
.sku-row .form-input { flex: 1; cursor: pointer; background: #fff; }
.btn-pick {
  padding: 0 0.875rem;
  border: 1px solid #2563eb;
  border-radius: 4px;
  background: #fff;
  color: #2563eb;
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
}
.btn-pick:hover { background: #eff6ff; }

.qty-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.qty-input { position: relative; display: flex; align-items: center; }
.qty-input .form-input { width: 110px; padding-right: 2rem; text-align: right; }
.qty-unit { position: absolute; right: 0.5rem; font-size: 0.75rem; color: #6b7280; }
.qty-eq { color: #9ca3af; }

.cost-input { max-width: 200px; text-align: right; }

.is-error .form-input { border-color: #dc2626; }

.form-hint { margin: 0.375rem 0 0; font-size: 0.75rem; color: #6b7280; }
.form-hint.amount { color: #1d4ed8; }

.modal-error {
  margin: 0.5rem 0 0;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.8125rem;
}

/* 품목 선택 팝업을 입고 모달(.modal-overlay) 위로 올린다 */
.sku-layer { position: relative; z-index: 10001; }

/* ⚠ .btn-cancel / .btn-save 는 공용 CSS 에 없다 — 모달마다 직접 정의 (InventoryConsumptionModal 과 동일) */
.modal-footer .btn-cancel {
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
}
.modal-footer .btn-cancel:hover { background: #f3f4f6; color: #374151; }
.modal-footer .btn-save {
  padding: 0.5rem 1.25rem;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.modal-footer .btn-save:hover:not(:disabled) { background: #1d4ed8; border-color: #1d4ed8; }
.modal-footer .btn-save:disabled { background: #cbd5e1; border-color: #cbd5e1; cursor: not-allowed; }
</style>
