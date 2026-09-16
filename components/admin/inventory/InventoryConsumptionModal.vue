<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content ic-modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '재고 소진 수정' : '재고 소진 등록' }}</h3>
          <button class="modal-close" @click="close">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 소진 유형 -->
          <div class="form-group">
            <label class="form-label required">소진 유형</label>
            <div class="type-buttons">
              <button
                v-for="t in typeOptions"
                :key="t.value"
                type="button"
                class="type-btn"
                :class="{ active: form.consumptionType === t.value }"
                @click="form.consumptionType = t.value"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- 창고 -->
          <div class="form-group">
            <label class="form-label required">출고 창고</label>
            <select
              v-model.number="form.warehouseId"
              class="form-input"
              :disabled="lockSource"
              @change="onWarehouseChange"
            >
              <option :value="0" disabled>창고를 선택하세요</option>
              <option v-for="wh in warehouseList" :key="wh.warehouseId" :value="wh.warehouseId">
                {{ wh.warehouseName }}
              </option>
            </select>
          </div>

          <!-- SKU -->
          <div class="form-group">
            <label class="form-label required">품목 (SKU)</label>
            <select
              v-model="form.skuId"
              class="form-input"
              :disabled="lockSource || loadingStock"
              @change="onSkuChange"
            >
              <option value="" disabled>
                {{ loadingStock ? '재고 조회 중...' : '재고가 있는 품목을 선택하세요' }}
              </option>
              <option v-for="s in stockItems" :key="s.skuId" :value="s.skuId">
                {{ s.skuName }} — 재고 {{ s.quantity.toLocaleString() }}㎡
              </option>
            </select>
            <p v-if="!loadingStock && form.warehouseId > 0 && stockItems.length === 0" class="form-hint warn">
              이 창고에 재고가 있는 품목이 없습니다.
            </p>
          </div>

          <!-- 수량 -->
          <div class="form-group">
            <label class="form-label required">소진 수량</label>
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
              <span v-if="currentStock !== null" class="stock-badge" :class="{ over: isOverStock }">
                현재고 {{ currentStock.toLocaleString() }}㎡
              </span>
            </div>
            <p class="form-hint">1매 = 2㎡ 입니다. 어느 쪽을 입력해도 자동으로 환산됩니다.</p>
            <p v-if="isOverStock" class="form-hint error">
              재고보다 많습니다. 확정할 수 없습니다.
            </p>
          </div>

          <!-- 생산자 -->
          <div class="form-group">
            <label class="form-label" :class="{ required: needProducer }">생산자</label>
            <select v-model.number="form.sourceOemCompanyId" class="form-input" :disabled="!needProducer">
              <option :value="null">
                {{ needProducer ? '실제로 만든 제조사를 선택하세요' : '창고의 제조사로 자동 설정됩니다' }}
              </option>
              <option v-for="c in manufacturers" :key="c.id" :value="c.id">
                {{ c.companyName }}
              </option>
            </select>
            <p class="form-hint" :class="{ warn: needProducer }">
              <template v-if="needProducer">
                이 창고는 제조사 창고가 아니라 생산자를 자동으로 정할 수 없습니다.
                원가와 청구가 여기서 고른 제조사 기준으로 잡힙니다.
              </template>
              <template v-else>
                선택한 창고의 제조사가 생산자가 됩니다.
              </template>
            </p>
          </div>

          <!-- 소진일 -->
          <div class="form-group">
            <label class="form-label required">소진일</label>
            <input v-model="form.consumptionDate" type="date" class="form-input">
            <p class="form-hint">
              이 날짜의 원가가 적용되고, 이 달({{ ledgerYm }}) 원장에 실립니다.
            </p>
          </div>

          <!-- 유형별 부가정보 -->
          <div v-if="form.consumptionType === 'QUALITY_TEST'" class="form-group">
            <label class="form-label">품질관리원 / 보낸 곳</label>
            <input v-model="form.destination" type="text" class="form-input" placeholder="예) 한국건설생활환경시험연구원">
          </div>
          <template v-else-if="form.consumptionType === 'LP_CONTRACT'">
            <div class="form-group">
              <label class="form-label">계약번호</label>
              <input v-model="form.contractNo" type="text" class="form-input" placeholder="삼자단가계약 번호">
            </div>
            <div class="form-group">
              <label class="form-label">납품처</label>
              <input v-model="form.destination" type="text" class="form-input">
            </div>
          </template>

          <div class="form-group">
            <label class="form-label">비고</label>
            <textarea v-model="form.remarks" class="form-input" rows="2" />
          </div>

          <p v-if="errorMsg" class="modal-error">{{ errorMsg }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="close">취소</button>
          <button class="btn-save" :disabled="!canSave || saving" @click="handleSave">
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { warehouseService } from '~/services/warehouse.service'
import { blockDecimalKey, stripDecimalOnPaste } from '~/utils/numberInput'
import { companyService } from '~/services/company.service'
import { inventoryService } from '~/services/inventory.service'
import { inventoryConsumptionService } from '~/services/inventory-consumption.service'
import { getLocalDateString } from '~/utils/format'
import {
  CONSUMPTION_TYPE_LABELS,
  SQM_PER_SHEET,
  type ConsumptionType,
  type InventoryConsumption
} from '~/types/inventory-consumption'

interface Props {
  modelValue: boolean
  /** 재고현황에서 행을 선택해 열면 창고·SKU 가 고정된다 */
  warehouseId?: number | null
  skuId?: string | null
  /** 수정 대상 (없으면 신규) */
  editTarget?: InventoryConsumption | null
}
const props = withDefaults(defineProps<Props>(), {
  warehouseId: null,
  skuId: null,
  editTarget: null
})
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [InventoryConsumption] }>()

const typeOptions = (Object.keys(CONSUMPTION_TYPE_LABELS) as ConsumptionType[])
  .map(v => ({ value: v, label: CONSUMPTION_TYPE_LABELS[v] }))

const warehouseList = ref<any[]>([])
const manufacturers = ref<any[]>([])
const stockItems = ref<{ skuId: string; skuName: string; quantity: number }[]>([])
const loadingStock = ref(false)
const saving = ref(false)
const errorMsg = ref('')

const form = ref({
  consumptionType: 'QUALITY_TEST' as ConsumptionType,
  warehouseId: 0,
  skuId: '',
  quantity: null as number | null,
  sheetCount: null as number | null,
  sourceOemCompanyId: null as number | null,
  // ⚠ toISOString() 은 UTC 라 KST 새벽에 전날이 된다.
  //   소진일은 원가 as-of 기준일이자 원장 반영 월을 정하는 값이라 하루가 밀리면 달이 바뀐다.
  consumptionDate: getLocalDateString(),
  destination: '',
  contractNo: '',
  remarks: ''
})

const isEdit = computed(() => !!props.editTarget)
const lockSource = computed(() => !!props.warehouseId && !!props.skuId)

/** 선택한 창고가 제조사 창고가 아니면 생산자를 직접 골라야 한다 */
const needProducer = computed(() => {
  const wh = warehouseList.value.find(w => w.warehouseId === form.value.warehouseId)
  return !wh || wh.warehouseType !== 'OEM'
})

const currentStock = computed(() => {
  const s = stockItems.value.find(x => x.skuId === form.value.skuId)
  return s ? s.quantity : null
})
const isOverStock = computed(() =>
  currentStock.value !== null && !!form.value.quantity && form.value.quantity > currentStock.value
)
const ledgerYm = computed(() => (form.value.consumptionDate || '').slice(0, 7) || '-')

const canSave = computed(() =>
  form.value.warehouseId > 0
  && !!form.value.skuId
  && !!form.value.quantity && form.value.quantity > 0
  && !!form.value.consumptionDate
  && (!needProducer.value || !!form.value.sourceOemCompanyId)
)

// 매↔㎡ 상호 환산
const onSheetInput = () => {
  form.value.quantity = form.value.sheetCount ? form.value.sheetCount * SQM_PER_SHEET : null
}
const onSqmInput = () => {
  form.value.sheetCount = form.value.quantity ? Math.round(form.value.quantity / SQM_PER_SHEET) : null
}

const loadStock = async (warehouseId: number) => {
  if (!warehouseId) { stockItems.value = []; return }
  loadingStock.value = true
  try {
    const res = await inventoryService.getInventoryList({ warehouseId, page: 0, size: 200 })
    stockItems.value = (res.content || [])
      .filter(i => i.quantity > 0)
      .map(i => ({ skuId: i.skuId, skuName: i.skuName, quantity: i.quantity }))
  } catch (e) {
    console.error('재고 조회 실패:', e)
    stockItems.value = []
  } finally {
    loadingStock.value = false
  }
}

const onWarehouseChange = () => {
  form.value.skuId = ''
  form.value.sourceOemCompanyId = null
  loadStock(form.value.warehouseId)
}
const onSkuChange = () => { errorMsg.value = '' }

watch(() => props.modelValue, async (open) => {
  if (!open) { return }
  errorMsg.value = ''

  if (warehouseList.value.length === 0) {
    try { warehouseList.value = await warehouseService.getWarehouseList(false) } catch (e) { console.error(e) }
  }
  if (manufacturers.value.length === 0) {
    try {
      const all = await companyService.getManufacturers()
      manufacturers.value = all.filter((c: any) => c.companyType === 'MANUFACTURER')
    } catch (e) { console.error(e) }
  }

  if (props.editTarget) {
    const t = props.editTarget
    form.value = {
      consumptionType: t.consumptionType,
      warehouseId: t.warehouseId,
      skuId: t.skuId,
      quantity: t.quantity,
      sheetCount: t.sheetCount ?? Math.round(t.quantity / SQM_PER_SHEET),
      sourceOemCompanyId: t.sourceOemCompanyId,
      consumptionDate: t.consumptionDate,
      destination: t.destination ?? '',
      contractNo: t.contractNo ?? '',
      remarks: t.remarks ?? ''
    }
  } else {
    form.value = {
      consumptionType: 'QUALITY_TEST',
      warehouseId: props.warehouseId ?? 0,
      skuId: props.skuId ?? '',
      quantity: null,
      sheetCount: null,
      sourceOemCompanyId: null,
      consumptionDate: getLocalDateString(),
      destination: '',
      contractNo: '',
      remarks: ''
    }
  }
  await loadStock(form.value.warehouseId)
})

const close = () => emit('update:modelValue', false)

const handleSave = async () => {
  if (!canSave.value) { return }
  saving.value = true
  errorMsg.value = ''
  try {
    const payload = {
      consumptionType: form.value.consumptionType,
      warehouseId: form.value.warehouseId,
      skuId: form.value.skuId,
      quantity: form.value.quantity,
      sheetCount: form.value.sheetCount,
      sourceOemCompanyId: needProducer.value ? form.value.sourceOemCompanyId : null,
      consumptionDate: form.value.consumptionDate,
      destination: form.value.destination || null,
      contractNo: form.value.contractNo || null,
      remarks: form.value.remarks || null
    }
    const saved = props.editTarget
      ? await inventoryConsumptionService.update(props.editTarget.consumptionId, payload)
      : await inventoryConsumptionService.create(payload)
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

.ic-modal { max-width: 560px; width: 100%; }

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

.qty-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.qty-input { position: relative; display: flex; align-items: center; }
.qty-input .form-input { width: 110px; padding-right: 2rem; text-align: right; }
.qty-unit { position: absolute; right: 0.5rem; font-size: 0.75rem; color: #6b7280; }
.qty-eq { color: #9ca3af; }

.stock-badge {
  margin-left: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  white-space: nowrap;
}
.stock-badge.over { background: #fef2f2; color: #dc2626; }

.form-hint { margin: 0.375rem 0 0; font-size: 0.75rem; color: #6b7280; }
.form-hint.warn { color: #92400e; }
.form-hint.error { color: #dc2626; }

.modal-error {
  margin: 0.5rem 0 0;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.8125rem;
}
</style>
