<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal loss-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-triangle-exclamation" />
            {{ isEdit ? '손실 수정' : '손실 등록' }}
          </h3>
          <button class="modal-close" @click="close">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 안내 -->
          <div class="notice-box">
            <i class="fas fa-circle-info" />
            <div>
              손실 처리는 <strong>리드파워 내부 원가 관리</strong> 항목입니다.
              매출(품대계)과 고객 서류(납품확인서·완료계)에는 <strong>영향을 주지 않습니다</strong>.
            </div>
          </div>

          <!-- STEP 0: 출하 선택 (출하 목록을 넘겨받은 경우에만) -->
          <div v-if="needsShipmentPick" class="form-section">
            <div class="section-title">
              <span class="step-badge">0</span> 출하 선택
              <span class="step-hint">손실이 발생한 출하를 고르세요</span>
            </div>
            <div v-if="loadingItems" class="inline-loading">
              <i class="fas fa-spinner fa-spin" /> 품목을 불러오는 중...
            </div>
            <div class="shipment-picker">
              <label
                v-for="s in shipments"
                :key="s.shipmentId"
                class="shipment-pick"
                :class="{ selected: pickedShipmentId === s.shipmentId }"
              >
                <input v-model.number="pickedShipmentId" type="radio" :value="s.shipmentId" :disabled="isEdit">
                <div>
                  <span class="pick-no">{{ s.shipmentNo || `#${s.shipmentId}` }}</span>
                  <span class="pick-date">{{ s.shipmentDate || '' }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- STEP 1: 유형 -->
          <div class="form-section">
            <div class="section-title"><span class="step-badge">1</span> 손실 유형</div>
            <div class="type-options">
              <label
                v-for="opt in LOSS_TYPE_OPTIONS"
                :key="opt.value"
                class="type-option"
                :class="{ selected: form.lossType === opt.value }"
              >
                <input v-model="form.lossType" type="radio" :value="opt.value" :disabled="isEdit">
                <div class="type-content">
                  <span class="type-label">{{ opt.label }}</span>
                  <span class="type-desc">{{ opt.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- STEP 2: 품목 -->
          <div class="form-section">
            <div class="section-title"><span class="step-badge">2</span> 대상 품목</div>
            <div class="form-grid">
              <div class="form-field">
                <label>출하 품목 <span class="req">*</span></label>
                <select v-model="form.skuId" :disabled="isEdit || effectiveItems.length === 0" @change="onSkuChange">
                  <option value="">
                    {{ effectiveItems.length === 0 ? '출하를 먼저 선택하세요' : '선택하세요' }}
                  </option>
                  <option v-for="item in effectiveItems" :key="item.skuId" :value="item.skuId">
                    {{ item.skuName || item.skuId }} (출하 {{ formatNumber(item.shipmentQuantity) }}{{ item.unit || '' }})
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label>{{ isShortage ? '부족 수량' : '오납 수량' }} <span class="req">*</span></label>
                <input v-model.number="form.quantity" type="number" min="0" step="0.01" placeholder="0">
                <small v-if="selectedItem" class="hint">
                  현재 출하 수량: {{ formatNumber(selectedItem.shipmentQuantity) }}
                </small>
              </div>

              <div class="form-field">
                <label>계약 SKU 원가</label>
                <input :value="formatNumber(form.unitCost)" type="text" readonly class="readonly">
                <small class="hint">출하 등록 시점 스냅샷</small>
              </div>

              <template v-if="!isShortage">
                <div class="form-field">
                  <label>실제 납품 SKU <span class="req">*</span></label>
                  <select v-model="form.actualSkuId" @change="onActualSkuChange">
                    <option value="">선택하세요</option>
                    <option v-for="sku in skuOptions" :key="sku.skuId" :value="sku.skuId">
                      {{ sku.skuName || sku.skuId }}
                    </option>
                  </select>
                </div>
                <div class="form-field">
                  <label>실납 SKU 원가 <span class="req">*</span></label>
                  <input v-model.number="form.actualUnitCost" type="number" min="0" step="1" placeholder="0">
                </div>
              </template>
            </div>

            <!-- 수량부족: 반영 결과 안내 (원장 불변) -->
            <div v-if="isShortage && form.quantity > 0 && selectedItem" class="correction-box">
              <i class="fas fa-circle-info" />
              <div>
                <strong>발주서와 출하 수량은 그대로 유지됩니다</strong>
                (출하 {{ formatNumber(selectedItem.shipmentQuantity) }} 불변, 비고에 손실 표기만 추가).
                <br>
                납품률·잔여수량·기성청구는 손실분을 뺀
                <strong class="highlight">{{ formatNumber(effectiveQty) }}</strong> 기준으로 계산되어,
                <strong>계약 잔여 {{ formatNumber(form.quantity) }}</strong>가 되살아납니다.
                보전분은 정상 발주·출하 프로세스로 내보내면 됩니다.
                <br>
                <span class="warn">
                  인수증은 실인수 {{ formatNumber(effectiveQty) }} 기준으로 재발급이 필요합니다.
                </span>
              </div>
            </div>
          </div>

          <!-- STEP 3: 보전 -->
          <div v-if="isShortage" class="form-section">
            <div class="section-title"><span class="step-badge">3</span> 보전(재발송) 방식</div>
            <div class="recovery-options">
              <label
                v-for="opt in RECOVERY_TYPE_OPTIONS"
                :key="opt.value"
                class="recovery-option"
                :class="{ selected: form.recoveryType === opt.value }"
              >
                <input v-model="form.recoveryType" type="radio" :value="opt.value">
                <div>
                  <span class="opt-label">{{ opt.label }}</span>
                  <span class="opt-desc">{{ opt.description }}</span>
                </div>
              </label>
            </div>

            <div v-if="form.recoveryType === 'SEPARATE'" class="form-field mt">
              <label>배송비 손실</label>
              <input v-model.number="form.shippingLossAmount" type="number" min="0" step="1000" placeholder="0">
              <small class="hint">별도 차량 발송 시에만 손실에 가산됩니다.</small>
            </div>
          </div>

          <!-- STEP 4: 귀책 / 금액 -->
          <div class="form-section">
            <div class="section-title">
              <span class="step-badge">{{ isShortage ? 4 : 3 }}</span> 귀책 분담 및 금액
            </div>

            <div class="form-grid">
              <div v-if="isShortage" class="form-field">
                <label>제조사 부담률 (%)</label>
                <div class="rate-input">
                  <input v-model.number="form.oemBurdenRate" type="number" min="0" max="100" step="10">
                  <div class="rate-presets">
                    <button type="button" @click="form.oemBurdenRate = 0">0%</button>
                    <button type="button" @click="form.oemBurdenRate = 50">50%</button>
                    <button type="button" @click="form.oemBurdenRate = 100">100%</button>
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label>페널티 (협의 금액)</label>
                <input v-model.number="form.penaltyAmount" type="number" min="0" step="10000" placeholder="0">
                <label class="checkbox-inline">
                  <input v-model="form.penaltyApplied" type="checkbox">
                  즉시 상계 (OEM 지급에서 차감)
                </label>
              </div>

              <div v-if="!isShortage" class="form-field">
                <label class="checkbox-inline">
                  <input v-model="form.applyToOemSettlement" type="checkbox">
                  원가 차액을 OEM 정산에 반영
                </label>
                <small class="hint">
                  실납이 더 싼 경우 기본 반영, 더 비싼 경우 기본 미반영입니다.
                </small>
              </div>
            </div>

            <!-- 실시간 계산 -->
            <div class="calc-box">
              <div class="calc-row">
                <span>원가 {{ isShortage ? '손실' : '차액' }}</span>
                <strong :class="{ negative: preview.costLoss < 0 }">{{ formatCurrency(preview.costLoss) }}</strong>
              </div>
              <div v-if="isShortage" class="calc-row">
                <span>배송비 손실</span>
                <strong>{{ formatCurrency(preview.shippingLoss) }}</strong>
              </div>
              <div class="calc-row total">
                <span>손실 합계</span>
                <strong :class="{ negative: preview.gross < 0 }">{{ formatCurrency(preview.gross) }}</strong>
              </div>
              <div class="calc-divider" />
              <div class="calc-row oem">
                <span>제조사 부담 / OEM 지급 차감</span>
                <strong>{{ formatCurrency(preview.oemDeduction) }}</strong>
              </div>
              <div class="calc-row company">
                <span>리드파워 순손실</span>
                <strong :class="{ negative: preview.companyLoss < 0 }">{{ formatCurrency(preview.companyLoss) }}</strong>
              </div>
              <small v-if="preview.companyLoss < 0" class="hint profit">
                음수는 리드파워 이익을 의미합니다.
              </small>
            </div>
          </div>

          <!-- STEP 5: 재고 / 메타 -->
          <div class="form-section">
            <div class="section-title">
              <span class="step-badge">{{ isShortage ? 5 : 4 }}</span> 재고 조정 및 기록
            </div>

            <label class="checkbox-inline">
              <input v-model="form.inventoryAdjusted" type="checkbox">
              재고를 함께 조정합니다
            </label>
            <div v-if="form.inventoryAdjusted" class="form-grid mt">
              <div class="form-field">
                <label>창고 <span class="req">*</span></label>
                <select v-model.number="form.inventoryWarehouseId">
                  <option :value="null">선택하세요</option>
                  <option v-for="w in warehouses" :key="w.warehouseId" :value="w.warehouseId">
                    {{ w.warehouseName }}
                  </option>
                </select>
              </div>
              <div class="form-field">
                <label>조정 수량 (부호 포함) <span class="req">*</span></label>
                <input v-model.number="form.inventoryAdjustQty" type="number" step="1" placeholder="-4">
                <small class="hint">
                  운송 중 증발이면 음수(−), 창고에 남아있으면 조정 불필요합니다.
                </small>
              </div>
            </div>

            <div class="form-grid mt">
              <div class="form-field">
                <label>발생(현장 확인)일 <span class="req">*</span></label>
                <input v-model="form.occurredDate" type="date">
              </div>
              <div class="form-field">
                <label>정산 반영 년월</label>
                <input v-model="form.settlementYearMonth" type="month">
                <small class="hint">미지정 시 발생월 기준</small>
              </div>
            </div>

            <div class="form-field mt">
              <label>발생 사유</label>
              <input v-model="form.reason" type="text" placeholder="예) 현장 실사 결과 4매 부족 확인">
            </div>
            <div class="form-field mt">
              <label>비고</label>
              <textarea v-model="form.remarks" rows="2" placeholder="협의 내용 등" />
            </div>
          </div>

          <div v-if="errorMessage" class="error-box">
            <i class="fas fa-circle-exclamation" />
            {{ errorMessage }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" :disabled="saving" @click="close">취소</button>
          <button class="btn btn-primary" :disabled="saving || !isValid" @click="submit">
            <i v-if="saving" class="fas fa-spinner fa-spin" />
            {{ isEdit ? '수정' : '등록' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { lossService } from '~/services/loss.service'
import { shipmentService } from '~/services/shipment.service'
import {
  LOSS_TYPE_OPTIONS,
  RECOVERY_TYPE_OPTIONS,
  type LossAdjustmentRequest,
  type LossAdjustmentResponse,
  type LossType,
  type RecoveryType
} from '~/types/loss'

interface ShipmentItemLike {
  skuId: string
  skuName?: string | null
  shipmentQuantity: number
  unit?: string | null
  costPrice?: number | null
}

interface WarehouseLike {
  warehouseId: number
  warehouseName: string
}

interface ShipmentPickLike {
  shipmentId: number
  shipmentNo?: string | null
  shipmentDate?: string | null
}

interface Props {
  isOpen: boolean
  /** 출하가 이미 정해진 경우 (출하 상세에서 진입). 0 이면 shipments 에서 고른다. */
  shipmentId?: number
  orderId?: number | null
  /** shipmentId 가 정해진 경우의 품목 목록. 비우면 서버에서 조회한다. */
  shipmentItems?: ShipmentItemLike[]
  /** 출하를 골라야 하는 경우 (자금 상세 등에서 진입) */
  shipments?: ShipmentPickLike[]
  warehouses?: WarehouseLike[]
  /** 스펙오납 실납 SKU 선택 목록 */
  skuOptions?: Array<{ skuId: string; skuName?: string | null }>
  /** 수정 대상 (없으면 신규 등록) */
  editTarget?: LossAdjustmentResponse | null
}

const props = withDefaults(defineProps<Props>(), {
  shipmentId: 0,
  orderId: null,
  shipmentItems: () => [],
  shipments: () => [],
  warehouses: () => [],
  skuOptions: () => [],
  editTarget: null
})

const emit = defineEmits<{
  close: []
  saved: [loss: LossAdjustmentResponse]
}>()

const saving = ref(false)
const errorMessage = ref('')

/** 출하를 골라야 하는 진입 경로인지 (자금 상세 등) */
const needsShipmentPick = computed(() => !props.shipmentId && props.shipments.length > 0)

/** 선택된 출하 ID */
const pickedShipmentId = ref<number | null>(null)

/** 서버에서 불러온 품목 (출하를 고른 경우) */
const fetchedItems = ref<ShipmentItemLike[]>([])
const loadingItems = ref(false)
const fetchedOrderId = ref<number | null>(null)

/** 실제로 사용할 출하 ID */
const effectiveShipmentId = computed(() => props.shipmentId || pickedShipmentId.value || 0)

/** 실제로 사용할 품목 목록 */
const effectiveItems = computed<ShipmentItemLike[]>(() =>
  props.shipmentItems.length > 0 ? props.shipmentItems : fetchedItems.value
)

const createEmptyForm = (): LossAdjustmentRequest => ({
  lossType: 'SHORTAGE' as LossType,
  shipmentId: props.shipmentId,
  orderId: props.orderId,
  skuId: '',
  actualSkuId: null,
  quantity: 0,
  unitCost: 0,
  actualUnitCost: null,
  shippingLossAmount: 0,
  penaltyAmount: 0,
  penaltyApplied: false,
  applyToOemSettlement: true,
  oemBurdenRate: 0,
  recoveryType: 'NONE' as RecoveryType,
  recoveryStatus: 'NONE',
  settlementYearMonth: null,
  inventoryAdjusted: false,
  inventoryAdjustQty: null,
  inventoryWarehouseId: null,
  occurredDate: new Date().toISOString().slice(0, 10),
  reason: '',
  remarks: ''
})

const form = ref<LossAdjustmentRequest>(createEmptyForm())

const isEdit = computed(() => !!props.editTarget)
const isShortage = computed(() => form.value.lossType === 'SHORTAGE')

const selectedItem = computed(() =>
  effectiveItems.value.find(i => i.skuId === form.value.skuId) || null
)

/**
 * 출하를 고르면 해당 출하의 품목·원가 스냅샷을 불러온다.
 * (자금 상세처럼 출하 목록만 있고 품목이 없는 진입 경로용)
 */
watch(pickedShipmentId, async (shipmentId) => {
  form.value.skuId = ''
  form.value.unitCost = 0
  fetchedItems.value = []
  if (!shipmentId) return

  loadingItems.value = true
  try {
    const detail = await shipmentService.getShipmentDetail(shipmentId)
    fetchedItems.value = (detail.items || []).map(i => ({
      skuId: i.skuId,
      skuName: i.skuName,
      shipmentQuantity: Number(i.shipmentQuantity || 0),
      unit: i.unit,
      costPrice: i.costPrice != null ? Number(i.costPrice) : null
    }))
    fetchedOrderId.value = detail.orderId ?? null
    form.value.shipmentId = shipmentId
    form.value.orderId = detail.orderId ?? props.orderId
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '출하 품목을 불러오지 못했습니다.'
    console.error('[LossAdjustmentModal] 품목 조회 실패:', error)
  } finally {
    loadingItems.value = false
  }
})

/** 손실 차감 후 유효 수량 (납품률·기성청구가 이 값으로 계산된다) */
const effectiveQty = computed(() => {
  if (!selectedItem.value) return 0
  return Number(selectedItem.value.shipmentQuantity) - Number(form.value.quantity || 0)
})

/**
 * 실시간 금액 미리보기
 * 백엔드 LossAmountCalculator 와 동일한 산식을 재현한다.
 * 실제 저장값은 서버 계산 결과다.
 */
const preview = computed(() => {
  const qty = Number(form.value.quantity || 0)
  const unitCost = Number(form.value.unitCost || 0)
  const penalty = Number(form.value.penaltyAmount || 0)

  if (isShortage.value) {
    const costLoss = qty * unitCost
    const shippingLoss = form.value.recoveryType === 'SEPARATE'
      ? Number(form.value.shippingLossAmount || 0)
      : 0
    const gross = costLoss + shippingLoss
    const rate = Number(form.value.oemBurdenRate || 0)
    const oemBurden = Math.round(gross * rate / 100)
    let companyLoss = gross - oemBurden
    let oemDeduction = oemBurden
    if (form.value.penaltyApplied) {
      oemDeduction += penalty
      companyLoss -= penalty
    }
    return { costLoss, shippingLoss, gross, oemDeduction, companyLoss }
  }

  // 스펙오납: 음수 = 원가 절감 = 이익
  const actualCost = Number(form.value.actualUnitCost || 0)
  const costDiff = qty * (actualCost - unitCost)
  let oemDeduction = 0
  let companyLoss = costDiff
  if (form.value.applyToOemSettlement) {
    oemDeduction = -costDiff
    companyLoss -= costDiff
  }
  if (form.value.penaltyApplied) {
    oemDeduction += penalty
  }
  companyLoss -= penalty

  return { costLoss: costDiff, shippingLoss: 0, gross: costDiff, oemDeduction, companyLoss }
})

const isValid = computed(() => {
  if (!effectiveShipmentId.value) return false
  if (!form.value.skuId) return false
  if (!form.value.quantity || form.value.quantity <= 0) return false
  if (!form.value.occurredDate) return false
  if (!isShortage.value && !form.value.actualSkuId) return false
  if (!isShortage.value && !form.value.actualUnitCost) return false
  if (form.value.inventoryAdjusted) {
    if (!form.value.inventoryWarehouseId) return false
    if (!form.value.inventoryAdjustQty) return false
  }
  return true
})

/** 품목 선택 시 원가 스냅샷 자동 반영 */
const onSkuChange = () => {
  if (selectedItem.value) {
    form.value.unitCost = Number(selectedItem.value.costPrice || 0)
  }
}

const onActualSkuChange = () => {
  // 실납 SKU 원가는 담당자가 직접 입력한다 (해당 제조사 원가 마스터 확인 후)
}

/** 수량부족은 부족분만큼 재고가 증발한 것이므로 음수 기본 제안 */
watch(() => form.value.quantity, (qty) => {
  if (isShortage.value && form.value.inventoryAdjusted && qty) {
    form.value.inventoryAdjustQty = -Math.abs(Number(qty))
  }
})

watch(() => props.isOpen, (open) => {
  if (!open) return
  errorMessage.value = ''
  // 출하 선택 상태 초기화 (수정 시에는 대상 출하로 고정)
  pickedShipmentId.value = props.editTarget ? props.editTarget.shipmentId : null
  fetchedItems.value = []
  if (props.editTarget) {
    const t = props.editTarget
    form.value = {
      lossType: t.lossType,
      shipmentId: t.shipmentId,
      orderId: t.orderId ?? null,
      skuId: t.skuId,
      actualSkuId: t.actualSkuId ?? null,
      quantity: Number(t.quantity),
      unitCost: Number(t.unitCost),
      actualUnitCost: t.actualUnitCost != null ? Number(t.actualUnitCost) : null,
          shippingLossAmount: Number(t.shippingLossAmount || 0),
      penaltyAmount: Number(t.penaltyAmount || 0),
      penaltyApplied: !!t.penaltyApplied,
      applyToOemSettlement: !!t.applyToOemSettlement,
      oemBurdenRate: Number(t.oemBurdenRate || 0),
      recoveryType: t.recoveryType,
      recoveryStatus: t.recoveryStatus,
      settlementYearMonth: t.settlementYearMonth ?? null,
      inventoryAdjusted: false,
      inventoryAdjustQty: null,
      inventoryWarehouseId: null,
      occurredDate: t.occurredDate,
      reason: t.reason ?? '',
      remarks: t.remarks ?? ''
    }
  } else {
    form.value = createEmptyForm()
  }
})

const submit = async () => {
  if (!isValid.value || saving.value) return
  saving.value = true
  errorMessage.value = ''

  try {
    const payload: LossAdjustmentRequest = { ...form.value, shipmentId: effectiveShipmentId.value }
    const result = props.editTarget
      ? await lossService.updateLoss(props.editTarget.lossId, payload)
      : await lossService.createLoss(payload)

    emit('saved', result)
    emit('close')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '저장에 실패했습니다.'
    console.error('[LossAdjustmentModal] 저장 실패:', error)
  } finally {
    saving.value = false
  }
}

const close = () => {
  if (saving.value) return
  emit('close')
}

const formatNumber = (value: unknown): string => {
  const num = Number(value || 0)
  return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

const formatCurrency = (value: number): string => {
  return `${Math.round(value).toLocaleString('ko-KR')} 원`
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.loss-modal {
  max-width: 860px;
  width: 94vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.modal-body {
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.notice-box {
  display: flex;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 0.86rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.form-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.form-section:last-of-type { border-bottom: none; }

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: #111827;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
}

.step-hint {
  font-size: 0.76rem;
  color: #94a3b8;
  font-weight: 400;
  margin-left: 0.4rem;
}

.inline-loading {
  padding: 0.5rem 0;
  font-size: 0.83rem;
  color: #6b7280;
}

.shipment-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  max-height: 160px;
  overflow-y: auto;
}

.shipment-pick {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.shipment-pick.selected {
  border-color: #2563eb;
  background: #eff6ff;
}
.shipment-pick > div {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}
.pick-no { font-weight: 600; font-size: 0.85rem; }
.pick-date { font-size: 0.74rem; color: #6b7280; }

.type-options, .recovery-options {
  display: grid;
  gap: 0.5rem;
}
.type-options { grid-template-columns: 1fr 1fr; }
.recovery-options { grid-template-columns: repeat(3, 1fr); }

.type-option, .recovery-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.type-option.selected, .recovery-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}
.type-option input, .recovery-option input { margin-top: 3px; }

.type-content, .recovery-option > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.type-label, .opt-label { font-weight: 600; font-size: 0.88rem; }
.type-desc, .opt-desc { font-size: 0.76rem; color: #6b7280; line-height: 1.4; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-field { display: flex; flex-direction: column; gap: 0.3rem; }
.form-field label { font-size: 0.83rem; font-weight: 500; color: #374151; }
.form-field input, .form-field select, .form-field textarea {
  padding: 0.45rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 0.88rem;
}
.form-field input.readonly { background: #f9fafb; color: #6b7280; }
.req { color: #dc2626; }
.hint { font-size: 0.74rem; color: #6b7280; }
.hint.profit { color: #059669; }
.mt { margin-top: 0.75rem; }

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.83rem;
  font-weight: 400;
  cursor: pointer;
}

.rate-input { display: flex; flex-direction: column; gap: 0.35rem; }
.rate-presets { display: flex; gap: 0.3rem; }
.rate-presets button {
  flex: 1;
  padding: 0.25rem;
  font-size: 0.76rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.rate-presets button:hover { background: #f3f4f6; }

.correction-box {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.75rem;
  padding: 0.7rem 0.85rem;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 0.83rem;
  line-height: 1.55;
  color: #78350f;
}
.correction-box .highlight { color: #b45309; }
.correction-box .warn { color: #b91c1c; font-size: 0.78rem; }

.calc-box {
  margin-top: 0.9rem;
  padding: 0.8rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 0.22rem 0;
  font-size: 0.86rem;
}
.calc-row.total { font-weight: 700; font-size: 0.92rem; }
.calc-row.oem strong { color: #b45309; }
.calc-row.company strong { color: #dc2626; }
.calc-row strong.negative { color: #059669; }
.calc-divider { height: 1px; background: #e5e7eb; margin: 0.45rem 0; }

.error-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #b91c1c;
  font-size: 0.85rem;
}

@media (max-width: 720px) {
  .form-grid, .type-options { grid-template-columns: 1fr; }
  .recovery-options { grid-template-columns: 1fr; }
}
</style>
