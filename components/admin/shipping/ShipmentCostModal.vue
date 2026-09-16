<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container">
          <!-- Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <i class="fas fa-truck" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  운송비 확정
                </h2>
                <span class="ccm-modal-subtitle">
                  {{ shipment?.shipmentNo || '' }} · {{ shipment?.projectName || '' }}
                </span>
              </div>
            </div>
            <button class="ccm-close-button" :disabled="saving" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="ccm-modal-body">
            <div class="ship-info">
              <div class="si-row">
                <span class="si-label">납품요구번호</span>
                <span class="si-value mono">{{ shipment?.deliveryRequestNo || '-' }}</span>
              </div>
              <div class="si-row">
                <span class="si-label">출하일</span>
                <span class="si-value">{{ formatDate(shipment?.shipmentDate) }}</span>
              </div>
              <div class="si-row">
                <span class="si-label">수요기관</span>
                <span class="si-value">{{ shipment?.client || '-' }}</span>
              </div>
            </div>

            <!-- 부담 유형 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-hand-holding-usd" />
                운송비 부담
              </label>
              <select v-model="form.shippingCostType" class="ccm-form-select" :disabled="saving">
                <option value="OEM_BEARS">
                  OEM 부담 (청구 없음)
                </option>
                <option value="PAID_TO_OEM">
                  OEM 에 지불 (원장 포함)
                </option>
                <option value="LP_BEARS">
                  리드파워 부담 (마진 원가만)
                </option>
              </select>
              <p class="type-hint" :class="hintClass">
                {{ typeHint }}
              </p>
            </div>

            <!--
              운송사 — 리드파워 부담일 때는 필수다.
              그 운송비가 «어느 운송사에 낼 돈» 인지가 운송비 월별 원장의 집계 기준이라,
              비워 두면 원장에서 갈 곳을 잃는다.
            -->
            <div class="ccm-form-group">
              <label class="ccm-form-label" :class="{ required: isLpBears }">
                <i class="fas fa-building" />
                운송사 <span v-if="!isLpBears" class="optional-tag">(선택)</span>
              </label>
              <select v-model.number="form.carrierCompanyId" class="ccm-form-select" :disabled="saving">
                <option :value="null">
                  선택 안 함
                </option>
                <option v-for="c in carrierOptions" :key="c.id" :value="c.id">
                  {{ c.companyName }}
                </option>
              </select>
              <p v-if="isLpBears && !form.carrierCompanyId" class="warn-line">
                <i class="fas fa-exclamation-circle" />
                리드파워 부담은 운송사를 지정해야 합니다. 운송비 월별 원장이 운송사별로 모입니다.
              </p>
            </div>

            <!-- 금액 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-won-sign" />
                운송비
              </label>
              <div class="cost-input-container">
                <span class="cost-prefix">₩</span>
                <input
                  v-model="formattedCost"
                  type="text"
                  class="ccm-form-input cost-input"
                  placeholder="0"
                  :disabled="saving"
                  @input="onCostInput"
                >
              </div>
              <p v-if="form.shippingCostType === 'OEM_BEARS' && form.shippingCost > 0" class="warn-line">
                <i class="fas fa-exclamation-circle" />
                «OEM 부담»은 제조사가 자기 돈으로 내는 것이라 금액을 넣어도 원장·마진 어디에도 반영되지 않습니다.
              </p>
            </div>

            <!--
              원장 반영 월 — 실리는 원장이 유형마다 다르다.
                PAID_TO_OEM : OEM 월별 매출원장 (제조사에게 줄 돈)
                LP_BEARS    : 운송사 월별 운송비 원장 (운송사에 낼 돈)
                OEM_BEARS   : 어느 원장에도 안 실리므로 이 칸을 감춘다.
            -->
            <div v-if="needsLedgerMonth" class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-calendar-alt" />
                원장 반영 월 <span class="optional-tag">(선택)</span>
              </label>
              <input v-model="form.shippingCostYm" type="month" class="ccm-form-input" :disabled="saving">
              <span class="form-hint">
                비워 두면 출하일이 속한 달({{ defaultYm }})에 실립니다.
                {{ isLpBears
                  ? '출하는 지난달인데 운송비를 이번 달에 정산한다면 이번 달을 지정하세요.'
                  : '그 달 지급이 이미 끝났다면 다음 달을 지정하세요.' }}
              </span>
            </div>
          </div>

          <div class="ccm-modal-footer">
            <button class="btn-cancel" :disabled="saving" @click="handleClose">
              취소
            </button>
            <button class="btn-submit" :disabled="saving" @click="handleSubmit">
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              <span v-else>저장</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { shipmentService, type ShipmentListItem } from '~/services/shipment.service'
import { companyService } from '~/services/company.service'
import { formatDate } from '~/utils/format'

/**
 * 운송비 확정 모달
 *
 * 중앙운수 배차가 늦어지면 출하 등록 시점에 운송비를 정할 수 없다.
 * 그래서 출하가 끝난 뒤 이 화면에서 부담 유형·운송사·금액을 확정한다.
 *
 * ⚠ 부담 유형에 따라 돈이 가는 곳이 완전히 다르다.
 *   OEM_BEARS   제조사가 자기 돈으로 냄 → 아무데도 반영 안 됨 (이미 SKU 원가에 녹아 있음)
 *   PAID_TO_OEM 리드파워가 제조사에게 지급 → OEM 월별 원장에 가산
 *   LP_BEARS    리드파워가 운송사에 직접 지급 → 마진 원가에만
 */

interface Props {
  isOpen: boolean
  shipment: ShipmentListItem | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const saving = ref(false)
const carrierOptions = ref<Array<{ id: number, companyName: string }>>([])
const formattedCost = ref('')

const form = ref({
  shippingCostType: 'OEM_BEARS' as string,
  carrierCompanyId: null as number | null,
  shippingCost: 0,
  shippingCostYm: ''
})

const defaultYm = computed(() => {
  const d = props.shipment?.shipmentDate
  return d ? String(d).slice(0, 7) : '-'
})

const typeHint = computed(() => {
  switch (form.value.shippingCostType) {
    case 'PAID_TO_OEM':
      return '소량 주문 등으로 운반비를 OEM 에 지불하는 경우입니다. 그 달 OEM 원장에 가산되어 지급액이 늘어납니다.'
    case 'LP_BEARS':
      return '창고이동 후 리드파워가 직접 운송하는 경우입니다. 마진 원가에만 반영되고 제조사 지급액에는 실리지 않습니다.'
    default:
      return '제조사가 부담하는 일반적인 경우입니다. 운송비가 이미 SKU 원가에 녹아 있어 따로 반영하지 않습니다.'
  }
})

const hintClass = computed(() =>
  form.value.shippingCostType === 'PAID_TO_OEM' ? 'hint-pay' : 'hint-plain')

const isLpBears = computed(() => form.value.shippingCostType === 'LP_BEARS')

// 반영월이 필요한 유형 — 실리는 원장이 다를 뿐 둘 다 «어느 달 장부인가» 가 있어야 한다.
const needsLedgerMonth = computed(() =>
  form.value.shippingCostType === 'PAID_TO_OEM' || isLpBears.value)

// 리드파워 부담으로 바꾸면 운송사를 기본으로 채워 준다(대개 중앙운수다).
// 이미 고른 값이 있으면 건드리지 않는다.
watch(isLpBears, (lp) => {
  if (!lp || form.value.carrierCompanyId) { return }
  const centralCarrier = carrierOptions.value.find(c => c.companyName?.includes('중앙운수'))
  if (centralCarrier) {
    form.value.carrierCompanyId = centralCarrier.id
  }
})

const onCostInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/[^\d]/g, '')
  const num = raw ? Number(raw) : 0
  form.value.shippingCost = num
  formattedCost.value = num ? num.toLocaleString('ko-KR') : ''
}

watch(() => props.isOpen, async (open) => {
  if (!open) { return }

  const s = props.shipment as unknown as Record<string, unknown> | null
  form.value = {
    shippingCostType: (s?.shippingCostType as string) || 'OEM_BEARS',
    carrierCompanyId: (s?.carrierCompanyId as number) ?? null,
    shippingCost: Number(s?.shippingCost || 0),
    shippingCostYm: (s?.shippingCostYm as string) || ''
  }
  formattedCost.value = form.value.shippingCost
    ? form.value.shippingCost.toLocaleString('ko-KR')
    : ''

  if (carrierOptions.value.length === 0) {
    try {
      // 운송사(CARRIER, 중앙운수 등) + OEM 제조사 둘 다 후보다
      const [carriers, makers] = await Promise.all([
        companyService.getCompanies('CARRIER'),
        companyService.getManufacturers()
      ])
      carrierOptions.value = [...carriers, ...makers]
    } catch (e) {
      console.error('운송사 목록 조회 실패:', e)
    }
  }
})

const handleClose = () => {
  if (saving.value) { return }
  emit('close')
}

const handleSubmit = async () => {
  if (!props.shipment || saving.value) { return }

  // 리드파워 부담은 운송사가 원장의 집계 기준이라 비운 채로 저장할 수 없다.
  // (백엔드도 같은 이유로 막지만, 여기서 걸러야 사용자가 왜 막혔는지 바로 안다)
  if (isLpBears.value && !form.value.carrierCompanyId) {
    alert('리드파워 부담 운송비는 운송사를 지정해야 합니다.\n운송비 월별 원장이 운송사별로 모입니다.')
    return
  }

  saving.value = true
  try {
    // ⚠ updateShipment(PUT) 가 아니라 전용 API 를 쓴다.
    //   PUT 은 출하 전체를 덮는 요청이라 출하일자·품목이 필수이고(검증 실패),
    //   설령 통과시켜도 배송지·수령인·상태가 조건 없이 NULL 로 덮인다.
    await shipmentService.updateShippingCost(props.shipment.shipmentId, {
      shippingCostType: form.value.shippingCostType,
      carrierCompanyId: form.value.carrierCompanyId,
      shippingCost: form.value.shippingCost,
      shippingCostYm: form.value.shippingCostYm || null
    })
    emit('saved')
  } catch (error) {
    console.error('운송비 저장 실패:', error)
    alert(error instanceof Error ? error.message : '운송비 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.ccm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.ccm-modal-container {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
}

.ccm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
}

.ccm-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ccm-header-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.ccm-icon-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.ccm-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.ccm-modal-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.ccm-close-button {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.ccm-close-button svg {
  width: 18px;
  height: 18px;
}

.ccm-modal-body {
  padding: 20px 22px;
}

.ship-info {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 18px;
}

.si-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 13px;
}

.si-label {
  color: #6b7280;
}

.si-value {
  color: #111827;
  font-weight: 600;
}

.si-value.mono {
  font-family: ui-monospace, monospace;
  font-size: 12px;
}

.ccm-form-group {
  margin-bottom: 18px;
}

.ccm-form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.ccm-form-label.required::after {
  content: '*';
  color: #dc2626;
}

.optional-tag {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.ccm-form-select,
.ccm-form-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
}

.cost-input-container {
  position: relative;
}

.cost-prefix {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 14px;
}

.cost-input {
  padding-left: 28px;
  text-align: right;
  font-weight: 600;
}

.type-hint {
  margin: 7px 0 0;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 6px;
}

.hint-pay {
  background: #eff6ff;
  color: #1d4ed8;
}

.hint-plain {
  background: #f9fafb;
  color: #6b7280;
}

.warn-line {
  margin: 7px 0 0;
  font-size: 12px;
  color: #b45309;
  line-height: 1.5;
}

.form-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.ccm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 22px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-submit {
  padding: 9px 20px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-cancel {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-submit {
  background: #2563eb;
  color: #fff;
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
