<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container">
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-green">
                <i class="fas fa-rotate-left" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  보전 연결
                </h2>
                <span class="ccm-modal-subtitle">
                  {{ loss?.lossNo }} · 부족 {{ formatQuantity(loss?.quantity) }}
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
              부족분을 다시 보낸 출하를 이 손실 건에 이어 붙입니다.
              <strong>보전 출하는 발주 → 출하 정상 절차로 먼저 내보낸 뒤</strong> 여기서 연결만 합니다.
            </p>

            <!-- 보전 방식 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-truck-fast" />
                보전 방식
              </label>
              <div class="type-cards">
                <label
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  class="type-card"
                  :class="{ selected: form.recoveryType === opt.value }"
                >
                  <input v-model="form.recoveryType" type="radio" :value="opt.value" :disabled="saving">
                  <span class="tc-body">
                    <span class="tc-title">{{ opt.label }}</span>
                    <span class="tc-desc">{{ opt.description }}</span>
                  </span>
                </label>
              </div>
              <p v-if="form.recoveryType === 'SEPARATE' && hasShippingLoss" class="warn-line">
                <i class="fas fa-exclamation-circle" />
                이 손실에는 이미 <strong>배송비 손실 {{ formatCurrency(loss?.shippingLossAmount) }}</strong> 이 잡혀 있습니다.
                보전 출하에도 배송비를 넣으면 <strong>이중 계상</strong>이 됩니다.
              </p>
            </div>

            <!-- 진행 상태 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-flag" />
                진행 상태
              </label>
              <select v-model="form.recoveryStatus" class="ccm-form-select" :disabled="saving">
                <option value="PLANNED">
                  예정 — 보내기로 했으나 아직 안 나감
                </option>
                <option value="DONE">
                  완료 — 보전 출하가 나갔음
                </option>
                <option value="NONE">
                  해당 없음 — 보전하지 않음
                </option>
              </select>
            </div>

            <!-- 보전 출하 선택 -->
            <div v-if="form.recoveryStatus !== 'NONE'" class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-box" />
                보전 출하 <span class="optional-tag">(예정이면 비워 둬도 됩니다)</span>
              </label>

              <div class="pick-search">
                <input
                  v-model="pickKeyword"
                  type="text"
                  class="ccm-form-input"
                  placeholder="출하NO · 납품요구번호 · 사업명"
                  :disabled="saving"
                  @keyup.enter="searchShipments"
                >
                <button class="btn-find" :disabled="saving || searching" @click="searchShipments">
                  <i v-if="searching" class="fas fa-spinner fa-spin" />
                  <i v-else class="fas fa-search" />
                  찾기
                </button>
              </div>

              <div v-if="picked" class="picked-box">
                <div class="pb-main">
                  <strong class="mono">{{ picked.shipmentNo || `#${picked.shipmentId}` }}</strong>
                  <span class="pb-sub">
                    {{ formatDate(picked.shipmentDate) }} · {{ picked.client }} · {{ formatQuantity(picked.shipmentQuantity) }}
                  </span>
                </div>
                <button class="pb-clear" :disabled="saving" @click="clearPick">
                  <i class="fas fa-times" />
                </button>
              </div>

              <div v-else-if="candidates.length > 0" class="cand-list">
                <button
                  v-for="s in candidates"
                  :key="s.shipmentId"
                  class="cand-item"
                  @click="pick(s)"
                >
                  <span class="mono">{{ s.shipmentNo || `#${s.shipmentId}` }}</span>
                  <span class="ci-sub">
                    {{ formatDate(s.shipmentDate) }} · {{ s.client }} · {{ s.projectName }}
                  </span>
                </button>
              </div>

              <p v-else-if="searched" class="none-line">
                검색 결과가 없습니다. 보전 출하를 먼저 등록하세요.
              </p>
            </div>
          </div>

          <div class="ccm-modal-footer">
            <button class="btn-cancel" :disabled="saving" @click="handleClose">
              취소
            </button>
            <button class="btn-submit" :disabled="saving" @click="handleSubmit">
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              <span v-else>연결</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { lossService } from '~/services/loss.service'
import { RECOVERY_TYPE_OPTIONS } from '~/types/loss'
import type { LossAdjustmentResponse, RecoveryType, RecoveryStatus } from '~/types/loss'
import { shipmentService, type ShipmentListItem } from '~/services/shipment.service'
import { formatDate, formatCurrency, formatQuantity } from '~/utils/format'

/**
 * 보전 연결 모달
 *
 * 손실(수량부족)이 나면 부족분을 다시 보낸다. 그 보전 출하를 손실 건에 이어 붙인다.
 * 이어 붙이지 않으면 recovery_* 컬럼이 비어 있어 목록에서 "보전이 끝났는지"를 알 수 없다.
 *
 * ⚠ 보전 출하는 여기서 만들지 않는다. 발주 → 출하 정상 절차로 내보낸 뒤 연결만 한다.
 *   손실 등록으로 계약 잔여가 되살아나므로 보전 출하는 기존 수량 가드를 그대로 통과한다.
 */

interface Props {
  isOpen: boolean
  loss: LossAdjustmentResponse | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const saving = ref(false)
const searching = ref(false)
const searched = ref(false)
const pickKeyword = ref('')
const candidates = ref<ShipmentListItem[]>([])
const picked = ref<ShipmentListItem | null>(null)

const form = ref({
  recoveryType: 'SEPARATE' as RecoveryType,
  recoveryStatus: 'PLANNED' as RecoveryStatus
})

// NONE 은 '보전 방식' 카드에서 뺀다. 진행 상태 쪽에서 고르게 한다.
const typeOptions = computed(() =>
  RECOVERY_TYPE_OPTIONS.filter(o => o.value !== 'NONE'))

const hasShippingLoss = computed(() =>
  Number(props.loss?.shippingLossAmount || 0) > 0)

const searchShipments = async () => {
  const k = pickKeyword.value.trim()
  if (!k) { return }

  searching.value = true
  searched.value = true
  try {
    // 한 칸에 무엇을 넣었는지 모르므로 세 조건으로 각각 찾아 합친다
    const [byNo, byReq, byProj] = await Promise.all([
      shipmentService.getShipments({ shipmentNo: k, page: 0, size: 5 }),
      shipmentService.getShipments({ deliveryRequestNo: k, page: 0, size: 5 }),
      shipmentService.getShipments({ projectName: k, page: 0, size: 5 })
    ])
    const merged = [...(byNo.content || []), ...(byReq.content || []), ...(byProj.content || [])]
    const seen = new Set<number>()
    candidates.value = merged.filter((s) => {
      if (seen.has(s.shipmentId)) { return false }
      seen.add(s.shipmentId)
      // 손실이 난 그 출하를 보전으로 고를 수는 없다
      return s.shipmentId !== props.loss?.shipmentId
    }).slice(0, 10)
  } catch (error) {
    console.error('보전 출하 검색 실패:', error)
    candidates.value = []
  } finally {
    searching.value = false
  }
}

const pick = (s: ShipmentListItem) => {
  picked.value = s
  candidates.value = []
}

const clearPick = () => {
  picked.value = null
  searched.value = false
}

watch(() => props.isOpen, (open) => {
  if (!open) { return }
  const l = props.loss
  form.value = {
    recoveryType: (l?.recoveryType && l.recoveryType !== 'NONE' ? l.recoveryType : 'SEPARATE') as RecoveryType,
    recoveryStatus: (l?.recoveryStatus || 'PLANNED') as RecoveryStatus
  }
  pickKeyword.value = ''
  candidates.value = []
  picked.value = null
  searched.value = false
})

const handleClose = () => {
  if (saving.value) { return }
  emit('close')
}

const handleSubmit = async () => {
  if (!props.loss || saving.value) { return }

  if (form.value.recoveryStatus === 'DONE' && !picked.value && !props.loss.recoveryShipmentId) {
    alert('완료로 표시하려면 보전 출하를 선택해야 합니다.')
    return
  }

  saving.value = true
  try {
    await lossService.linkRecovery(props.loss.lossId, {
      recoveryType: form.value.recoveryStatus === 'NONE' ? 'NONE' : form.value.recoveryType,
      recoveryStatus: form.value.recoveryStatus,
      recoveryShipmentId: picked.value?.shipmentId ?? props.loss.recoveryShipmentId ?? null,
      recoveryPoId: props.loss.recoveryPoId ?? null
    })
    emit('saved')
  } catch (error) {
    console.error('보전 연결 실패:', error)
    alert(error instanceof Error ? error.message : '보전 연결에 실패했습니다.')
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
  max-width: 560px;
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

.ccm-icon-green {
  background: #dcfce7;
  color: #166534;
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
  line-height: 1.6;
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
  margin-bottom: 7px;
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

.type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.type-card {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 13px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}

.type-card:hover {
  background: #f8fafc;
}

.type-card.selected {
  border-color: #16a34a;
  background: #f0fdf4;
}

.tc-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tc-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.tc-desc {
  font-size: 11.5px;
  color: #6b7280;
  line-height: 1.45;
}

.ccm-form-select,
.ccm-form-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
}

.pick-search {
  display: flex;
  gap: 7px;
}

.btn-find {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-find:hover:not(:disabled) {
  border-color: #2563eb;
  color: #1d4ed8;
}

.cand-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.cand-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.cand-item:hover {
  border-color: #16a34a;
  background: #f0fdf4;
}

.ci-sub {
  font-size: 11.5px;
  color: #6b7280;
}

.picked-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  padding: 11px 13px;
  border: 1px solid #16a34a;
  border-radius: 8px;
  background: #f0fdf4;
}

.pb-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pb-sub {
  font-size: 11.5px;
  color: #4b5563;
}

.pb-clear {
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.none-line {
  margin: 8px 0 0;
  font-size: 12px;
  color: #b45309;
}

.warn-line {
  margin: 8px 0 0;
  font-size: 12px;
  color: #b45309;
  line-height: 1.5;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
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
  background: #16a34a;
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
