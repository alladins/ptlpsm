<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container">
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-amber">
                <i class="fas fa-boxes-stacked" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  재고 조정
                </h2>
                <span class="ccm-modal-subtitle">
                  {{ loss?.lossNo }} · {{ loss?.skuId }} · 부족 {{ formatQuantity(loss?.quantity) }}
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
            <div class="lead-box">
              <p class="lead-title">
                <i class="fas fa-circle-info" /> 재고는 <strong>운송(배차) 시점에 이미 빠졌습니다.</strong>
              </p>
              <p class="lead-desc">
                그래서 조정 방향은 <strong>원인에 따라 달라집니다.</strong> 실물을 확인한 뒤 넣으세요.
              </p>
              <table class="cause-table">
                <tbody>
                  <tr>
                    <td>제조사가 애초에 안 실었다 (창고에 그대로 있음)</td>
                    <td class="plus">+ 되돌림</td>
                  </tr>
                  <tr>
                    <td>운송 중 분실·파손 (창고에서 정상 출고)</td>
                    <td class="none">조정 불필요</td>
                  </tr>
                  <tr>
                    <td>보전분이 들어왔다 나가며 생긴 차이</td>
                    <td class="plus">차이분만</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 그 제조사 창고가 없으면 조정할 곳이 없다 -->
            <div v-if="!loadingWarehouses && warehouses.length === 0" class="warehouse-empty">
              <i class="fas fa-triangle-exclamation" />
              <div>
                <strong>{{ loss?.oemCompanyName || '이 제조사' }}의 창고가 없습니다.</strong>
                <p>
                  조정할 창고가 없어 진행할 수 없습니다.
                  <strong>기초정보 → 창고</strong> 에서 이 제조사의 창고를 먼저 등록하세요.
                  아직 거래를 시작하기 전이라면 <strong>발주·입고</strong> 부터 진행해야 합니다.
                </p>
              </div>
            </div>

            <!-- 창고 -->
            <div v-if="warehouses.length > 0" class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-warehouse" />
                조정 대상 창고
              </label>
              <select v-model.number="form.warehouseId" class="ccm-form-select" :disabled="saving">
                <option :value="null">
                  창고를 선택하세요
                </option>
                <option v-for="w in warehouses" :key="w.warehouseId" :value="w.warehouseId">
                  {{ w.warehouseName }} ({{ WAREHOUSE_TYPE_LABELS[w.warehouseType] }})
                </option>
              </select>
            </div>

            <!-- 수량 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-arrow-right-arrow-left" />
                조정 수량 (매)
              </label>
              <div class="qty-row">
                <button
                  class="sign-btn"
                  :class="{ on: sign === 1 }"
                  :disabled="saving"
                  @click="sign = 1"
                >
                  + 늘림
                </button>
                <button
                  class="sign-btn"
                  :class="{ on: sign === -1 }"
                  :disabled="saving"
                  @click="sign = -1"
                >
                  − 줄임
                </button>
                <input
                  v-model.number="absQty"
                  type="number"
                  min="0"
                  step="1"
                  class="ccm-form-input qty-input"
                  placeholder="0"
                  :disabled="saving"
                >
                <span class="qty-unit">매</span>
              </div>
              <p class="convert-line" :class="{ dim: !absQty }">
                <template v-if="absQty">
                  재고에는 <strong>{{ sign > 0 ? '+' : '−' }}{{ absQty * 2 }}㎡</strong> 로 반영됩니다
                  (1매 = 2㎡)
                </template>
                <template v-else>
                  1매 = 2㎡ 로 환산되어 재고에 반영됩니다
                </template>
              </p>
              <p v-if="loss?.quantity" class="hint-line">
                부족 수량은 <strong>{{ formatQuantity(loss.quantity) }}㎡</strong> 입니다.
                같은 양을 되돌리려면 <strong>+ 늘림 {{ Number(loss.quantity) / 2 }}매</strong> 를 넣으세요.
              </p>
            </div>

            <!-- 사유 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-pen" />
                사유 <span class="optional-tag">(선택)</span>
              </label>
              <input
                v-model="form.remarks"
                type="text"
                class="ccm-form-input"
                placeholder="예) 제조사 미출고분 창고 확인"
                :disabled="saving"
              >
              <span class="form-hint">
                입출고 이력에 <code>[손실 {{ loss?.lossNo }}]</code> 와 함께 남아 나중에 사유를 되짚을 수 있습니다.
              </span>
            </div>

            <p class="warn-line">
              <i class="fas fa-triangle-exclamation" />
              이 손실을 <strong>취소하면 조정도 함께 되돌아갑니다.</strong>
            </p>
          </div>

          <div class="ccm-modal-footer">
            <button class="btn-cancel" :disabled="saving" @click="handleClose">
              취소
            </button>
            <button class="btn-submit" :disabled="saving || !canSubmit" @click="handleSubmit">
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              <span v-else>조정</span>
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
import type { LossAdjustmentResponse } from '~/types/loss'
import { warehouseService } from '~/services/warehouse.service'
import { WAREHOUSE_TYPE_LABELS, type Warehouse } from '~/types/warehouse'
import { formatQuantity } from '~/utils/format'

/**
 * 손실 재고 조정 모달
 *
 * 재고는 운송 시점에 이미 빠졌으므로, 손실이 나도 추가 차감이 필요한 게 아니다.
 * 원인에 따라 되돌려야(+) 할 수도, 아무것도 안 해도 될 수도 있다.
 * 자동으로 정할 수 없어 담당자가 판단해 넣는다.
 *
 * ⚠ 입력은 매수, 재고는 ㎡ 다. 백엔드가 1매 = 2㎡ 로 환산한다.
 *   화면에서도 환산 결과를 미리 보여줘 오해를 막는다.
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
const allWarehouses = ref<Warehouse[]>([])
const loadingWarehouses = ref(false)

/**
 * 그 제조사 창고만 보여준다.
 *
 * ⚠ 전체 창고를 보여주면 남의 창고 재고를 손대게 된다.
 *   손실은 특정 제조사 출하에서 났으므로 조정 대상도 그 제조사 창고다.
 */
const warehouses = computed<Warehouse[]>(() => {
  const oemId = props.loss?.oemCompanyId
  if (!oemId) { return [] }
  return allWarehouses.value.filter(w => Number(w.companyId) === Number(oemId))
})
const sign = ref<1 | -1>(1)
const absQty = ref<number | null>(null)

const form = ref({
  warehouseId: null as number | null,
  remarks: ''
})

const canSubmit = computed(() =>
  !!form.value.warehouseId && !!absQty.value && Number(absQty.value) > 0)

watch(() => props.isOpen, async (open) => {
  if (!open) { return }

  sign.value = 1
  // ⚠ 손실 수량은 ㎡(shipment_items.unit='m²'), 조정 수량은 매다. 1매 = 2㎡ 이므로 반으로 나눈다.
  //   그대로 넣으면 의도한 양의 두 배가 조정된다.
  absQty.value = props.loss?.quantity ? Number(props.loss.quantity) / 2 : null
  form.value = { warehouseId: null, remarks: '' }

  if (allWarehouses.value.length === 0) {
    loadingWarehouses.value = true
    try {
      allWarehouses.value = await warehouseService.getWarehouseList()
    } catch (error) {
      console.error('창고 목록 조회 실패:', error)
    } finally {
      loadingWarehouses.value = false
    }
  }
})

const handleClose = () => {
  if (saving.value) { return }
  emit('close')
}

const handleSubmit = async () => {
  if (!props.loss || !canSubmit.value || saving.value) { return }

  saving.value = true
  try {
    await lossService.adjustInventory(props.loss.lossId, {
      warehouseId: form.value.warehouseId as number,
      // 매수 단위로 보낸다. ㎡ 환산은 백엔드가 한다.
      quantity: sign.value * Number(absQty.value),
      remarks: form.value.remarks || undefined
    })
    emit('saved')
  } catch (error) {
    console.error('재고 조정 실패:', error)
    alert(error instanceof Error ? error.message : '재고 조정에 실패했습니다.')
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

.warehouse-empty {
  display: flex;
  gap: 0.6rem;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #92400e;
  font-size: 12.5px;
  line-height: 1.55;
}

.warehouse-empty p {
  margin: 4px 0 0;
}

.lead-box {
  padding: 13px 15px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 18px;
}

.lead-title {
  margin: 0 0 4px;
  font-size: 13px;
  color: #111827;
}

.lead-desc {
  margin: 0 0 10px;
  font-size: 12.5px;
  color: #4b5563;
}

.cause-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.cause-table td {
  padding: 5px 0;
  color: #4b5563;
  border-top: 1px solid #e5e7eb;
}

.cause-table td:last-child {
  text-align: right;
  white-space: nowrap;
  font-weight: 600;
}

.cause-table .plus { color: #15803d; }
.cause-table .none { color: #9ca3af; }

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

.ccm-form-select,
.ccm-form-input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.sign-btn {
  padding: 9px 13px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.sign-btn.on {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.qty-input {
  flex: 1;
  text-align: right;
  font-weight: 600;
}

.qty-unit {
  font-size: 13px;
  color: #6b7280;
}

.convert-line {
  margin: 7px 0 0;
  padding: 7px 10px;
  background: #eff6ff;
  border-radius: 6px;
  font-size: 12.5px;
  color: #1d4ed8;
}

.convert-line.dim {
  background: #f9fafb;
  color: #9ca3af;
}

.hint-line {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.form-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.form-hint code {
  padding: 1px 5px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 11px;
}

.warn-line {
  margin: 0;
  padding: 9px 12px;
  background: #fffbeb;
  border-radius: 6px;
  font-size: 12.5px;
  color: #b45309;
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
  background: #b45309;
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
