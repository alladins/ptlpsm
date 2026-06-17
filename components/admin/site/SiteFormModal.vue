<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-building" />
            {{ isEdit ? '현장 정보 수정' : '신규 현장 등록' }}
          </h3>
          <button class="modal-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 연관 발주 정보 (신규 등록: prefillFromOrder / 수정: initial.orderDeliveryRequestNo) -->
          <div v-if="linkedOrderInfo" class="order-info-card">
            <div class="oi-head">
              <i class="fas fa-link" />
              <strong>연관 발주</strong>
            </div>
            <div class="oi-grid">
              <div>
                <span class="oi-label">납품요구번호</span>
                <span class="oi-value">{{ linkedOrderInfo.deliveryRequestNo || '-' }}</span>
              </div>
              <div>
                <span class="oi-label">사업명</span>
                <span class="oi-value">{{ linkedOrderInfo.projectName || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="field">
            <label>프로젝트명 <span class="req">*</span></label>
            <input
              v-model="form.projectName"
              type="text"
              class="form-input"
              placeholder="예: 00중학교 신축공사"
              maxlength="200"
            >
          </div>
          <div class="field">
            <label>수요기관</label>
            <input
              v-model="form.client"
              type="text"
              class="form-input"
              placeholder="예: 충청북도교육청"
              maxlength="200"
            >
          </div>
          <div class="field">
            <label>현장 주소</label>
            <input
              v-model="form.siteAddress"
              type="text"
              class="form-input"
              maxlength="500"
            >
          </div>
          <div class="grid-2">
            <div class="field">
              <label>대표 현장소장명</label>
              <input
                v-model="form.managerName"
                type="text"
                class="form-input"
                placeholder="(URL 공유 시 prefill 됩니다)"
                maxlength="100"
              >
            </div>
            <div class="field">
              <label>대표 연락처</label>
              <input
                v-model="form.managerPhone"
                type="tel"
                class="form-input"
                placeholder="010-1234-5678"
                maxlength="20"
              >
            </div>
          </div>
          <div class="field">
            <label>비고</label>
            <textarea v-model="form.note" rows="2" maxlength="500" />
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">취소</button>
          <button class="btn-primary" :disabled="!canSave || saving" @click="onSave">
            <i v-if="saving" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-save" />
            {{ isEdit ? '수정' : '등록 (토큰 자동 발급)' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSiteStore } from '~/stores/site'
import type { Site, SiteCreateRequest, SiteUpdateRequest } from '~/types/site'
import type { OrderRow } from '~/components/admin/site/OrderPickerModal.vue'

const props = defineProps<{
  initial: Site | null
  prefillFromOrder?: OrderRow | null
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', site: Site): void }>()

const store = useSiteStore()

const isEdit = computed(() => !!props.initial)

/**
 * 연관 발주 박스 표시용 데이터
 * - 신규: prefillFromOrder 에서 가져옴
 * - 수정: props.initial 의 JOIN 결과(orderDeliveryRequestNo, projectName) 사용
 *   (orderId 가 null 인 레거시 현장은 박스 미표시)
 */
const linkedOrderInfo = computed<{ deliveryRequestNo: string | null; projectName: string | null } | null>(() => {
  if (!isEdit.value && props.prefillFromOrder) {
    return {
      deliveryRequestNo: props.prefillFromOrder.deliveryRequestNo ?? null,
      projectName: props.prefillFromOrder.projectName ?? null
    }
  }
  if (isEdit.value && props.initial?.orderId) {
    return {
      deliveryRequestNo: props.initial.orderDeliveryRequestNo ?? null,
      projectName: props.initial.projectName ?? null
    }
  }
  return null
})

const form = reactive({
  projectName: props.initial?.projectName
    ?? props.prefillFromOrder?.projectName
    ?? '',
  client: props.initial?.client
    ?? props.prefillFromOrder?.client
    ?? '',
  siteAddress: props.initial?.siteAddress
    ?? props.prefillFromOrder?.clientAddress
    ?? '',
  managerName: props.initial?.managerName
    ?? props.prefillFromOrder?.builderCeoName
    ?? '',
  managerPhone: props.initial?.managerPhone
    ?? props.prefillFromOrder?.phoneNumber
    ?? '',
  note: props.initial?.note ?? ''
})

const saving = ref(false)
const error = ref<string | null>(null)

const canSave = computed(() => {
  if (!form.projectName.trim()) return false
  // 신규 등록은 발주(orderId)가 반드시 있어야 함
  if (!isEdit.value && !props.prefillFromOrder?.orderId) return false
  return true
})

async function onSave() {
  if (!canSave.value) return
  saving.value = true
  error.value = null
  try {
    let saved: Site
    if (isEdit.value && props.initial) {
      const payload: SiteUpdateRequest = { ...form }
      saved = await store.update(props.initial.siteId, payload)
    } else {
      if (!props.prefillFromOrder?.orderId) {
        throw new Error('연관 발주가 선택되지 않았습니다.')
      }
      const payload: SiteCreateRequest = {
        orderId: props.prefillFromOrder.orderId,
        ...form
      }
      saved = await store.create(payload)
    }
    emit('saved', saved)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '저장 실패'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 0.75rem;
  width: 90%; max-width: 560px;
  max-height: 90vh;
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0.75rem 0.75rem 0 0;
}
.modal-header h3 { margin: 0; font-size: 1.05rem; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #6b7280; }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 0.75rem 0.75rem;
}

.order-info-card {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}
.oi-head {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.85rem; color: #1d4ed8;
  margin-bottom: 0.5rem;
}
.oi-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem;
}
.oi-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
.oi-label { font-size: 0.7rem; color: #6b7280; }
.oi-value { font-size: 0.85rem; color: #111827; }

.field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
.field label { font-size: 0.85rem; color: #374151; font-weight: 500; }
.field .req { color: #dc2626; }
.form-input, textarea {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-family: inherit;
  font-size: 0.9rem;
}
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.error-msg { color: #dc2626; font-size: 0.85rem; margin: 0; }
.btn-primary {
  padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.25rem; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-secondary {
  padding: 0.5rem 1rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 0.25rem; cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }
</style>
