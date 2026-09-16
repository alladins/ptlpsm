<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container">
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-amber">
                <i class="fas fa-industry" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  가공비 입력
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
            <p class="lead-note">
              가공비는 <strong>발주서</strong>에 붙는 값입니다. 이 출하에 연결된 발주서를 골라 입력하세요.
            </p>

            <div v-if="loading" class="state-box">
              <i class="fas fa-spinner fa-spin" /> 연결된 발주서를 찾는 중...
            </div>

            <div v-else-if="orders.length === 0" class="state-box empty">
              <i class="fas fa-info-circle" />
              이 출하에 연결된 발주서가 없습니다.
              <span class="sub">재고에서 바로 나간 출하는 발주서가 없을 수 있습니다.</span>
            </div>

            <template v-else>
              <!-- 발주서 선택 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <i class="fas fa-file-invoice" />
                  발주서
                </label>
                <div class="po-list">
                  <label
                    v-for="po in orders"
                    :key="po.poId"
                    class="po-item"
                    :class="{ selected: pickedPoId === po.poId }"
                  >
                    <input v-model.number="pickedPoId" type="radio" :value="po.poId" :disabled="saving">
                    <span class="po-body">
                      <span class="po-line1">
                        <strong class="mono">{{ po.poNo }}</strong>
                        <span class="po-status" :class="statusClass(po.status)">{{ statusLabel(po.status) }}</span>
                      </span>
                      <span class="po-line2">
                        {{ po.sourceOemCompanyName || po.oemCompanyName || '-' }}
                        · {{ formatDate(po.orderDate) }}
                        · 수량 {{ formatQuantity(po.totalQuantity) }}
                      </span>
                      <span class="po-line3">
                        현재 가공비 <strong>{{ formatCurrency(po.processingFee || 0) }}</strong>
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <!-- 가공비 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label">
                  <i class="fas fa-won-sign" />
                  가공비
                </label>
                <div class="cost-input-container">
                  <span class="cost-prefix">₩</span>
                  <input
                    v-model="formattedFee"
                    type="text"
                    class="ccm-form-input cost-input"
                    placeholder="0"
                    :disabled="saving || !pickedPoId"
                    @input="onFeeInput"
                  >
                </div>
                <span class="form-hint">
                  제조사에 지급하는 가공 비용입니다. 발주일이 속한 달의 OEM 원장에 가산됩니다.
                </span>
                <p v-if="pickedDraft" class="warn-line">
                  <i class="fas fa-exclamation-circle" />
                  이 발주서는 아직 <strong>임시저장(DRAFT)</strong> 상태입니다.
                  발행해야 가공비가 원장에 실립니다.
                </p>
              </div>
            </template>
          </div>

          <div class="ccm-modal-footer">
            <button class="btn-cancel" :disabled="saving" @click="handleClose">
              취소
            </button>
            <button
              class="btn-submit"
              :disabled="saving || !pickedPoId"
              @click="handleSubmit"
            >
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
import type { ShipmentListItem } from '~/services/shipment.service'
import { purchaseOrderService } from '~/services/purchase-order.service'
import type { PurchaseOrderDetail } from '~/types/purchase-order'
import { formatDate, formatCurrency, formatQuantity } from '~/utils/format'

/**
 * 가공비 입력 모달
 *
 * 가공비는 발주서(purchase_orders.processing_fee)에 붙는 값인데,
 * 담당자는 출하 건을 먼저 찾는다. 그래서 출하 → 연결 발주서로 건너가게 한다.
 *
 * ⚠ 발주와 출하는 1:1 이 아니다. 한 출하에 여러 발주가 물릴 수 있어 고르게 한다.
 * ⚠ DRAFT 발주서의 가공비는 원장에 실리지 않는다
 *   (OemLedgerMapper 가 status NOT IN ('DRAFT','REJECTED','DELETED') 로 거른다).
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

const loading = ref(false)
const saving = ref(false)
const orders = ref<PurchaseOrderDetail[]>([])
const pickedPoId = ref<number | null>(null)
const processingFee = ref(0)
const formattedFee = ref('')

const pickedPo = computed(() =>
  orders.value.find(o => o.poId === pickedPoId.value) || null)

const pickedDraft = computed(() => pickedPo.value?.status === 'DRAFT')

const statusLabel = (s?: string) => {
  switch (s) {
    case 'DRAFT': return '임시저장'
    case 'ISSUED': return '발행'
    case 'ACCEPTED': return '수락'
    case 'PRODUCED': return '생산완료'
    default: return s || '-'
  }
}

const statusClass = (s?: string) =>
  s === 'DRAFT' ? 'st-draft' : 'st-live'

const onFeeInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/[^\d]/g, '')
  const num = raw ? Number(raw) : 0
  processingFee.value = num
  formattedFee.value = num ? num.toLocaleString('ko-KR') : ''
}

// 발주서를 고르면 그 발주서의 현재 가공비를 입력란에 채운다
watch(pickedPoId, () => {
  const fee = Number(pickedPo.value?.processingFee || 0)
  processingFee.value = fee
  formattedFee.value = fee ? fee.toLocaleString('ko-KR') : ''
})

watch(() => props.isOpen, async (open) => {
  if (!open || !props.shipment) { return }

  orders.value = []
  pickedPoId.value = null
  processingFee.value = 0
  formattedFee.value = ''

  loading.value = true
  try {
    orders.value = await purchaseOrderService.getPurchaseOrdersByShipmentId(
      props.shipment.shipmentId)
    if (orders.value.length === 1) {
      pickedPoId.value = orders.value[0].poId
    }
  } catch (error) {
    console.error('연결 발주서 조회 실패:', error)
    alert('연결된 발주서를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
})

const handleClose = () => {
  if (saving.value) { return }
  emit('close')
}

const handleSubmit = async () => {
  if (!pickedPoId.value || saving.value) { return }

  saving.value = true
  try {
    // ⚠ updatePurchaseOrder(PUT) 가 아니라 전용 API 를 쓴다.
    //   PUT 매퍼는 oem_company_id · order_date · remarks 를 조건 없이 덮으므로
    //   가공비만 담아 보내면 제조사와 발주일이 NULL 이 되어 발주서가 망가진다.
    await purchaseOrderService.updateProcessingFee(pickedPoId.value, processingFee.value)
    emit('saved')
  } catch (error) {
    console.error('가공비 저장 실패:', error)
    alert(error instanceof Error ? error.message : '가공비 저장에 실패했습니다.')
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
  max-width: 540px;
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

.ccm-icon-amber {
  background: #fef3c7;
  color: #b45309;
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

.lead-note {
  margin: 0 0 16px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.55;
}

.state-box {
  padding: 26px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  background: #f9fafb;
  border-radius: 8px;
}

.state-box.empty {
  color: #b45309;
  background: #fffbeb;
}

.state-box .sub {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
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

.po-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.po-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.po-item:hover {
  background: #f8fafc;
}

.po-item.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.po-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.po-line1 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.po-line2,
.po-line3 {
  font-size: 12px;
  color: #6b7280;
}

.mono {
  font-family: ui-monospace, monospace;
}

.po-status {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.st-draft {
  background: #fef3c7;
  color: #b45309;
}

.st-live {
  background: #dcfce7;
  color: #166534;
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

.ccm-form-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
}

.cost-input {
  padding-left: 28px;
  text-align: right;
  font-weight: 600;
}

.form-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.warn-line {
  margin: 7px 0 0;
  font-size: 12px;
  color: #b45309;
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
