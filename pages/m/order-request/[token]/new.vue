<template>
  <div class="mobile-form">
    <header class="mobile-header">
      <button class="btn-back" @click="goBack">
        <i class="fas fa-arrow-left" />
      </button>
      <h1>신규 주문 요청</h1>
    </header>

    <main class="form-body">
      <!-- 연관 발주 (토큰→현장→발주 자동 매칭, 참고용) -->
      <section v-if="profile" class="order-info-card">
        <div class="oi-head">
          <i class="fas fa-link" />
          <strong>연관 발주</strong>
        </div>
        <div class="oi-grid">
          <div class="full">
            <span class="oi-label">납품요구번호</span>
            <span class="oi-value">{{ profile.deliveryRequestNo || '-' }}</span>
          </div>
          <div class="full">
            <span class="oi-label">사업명</span>
            <span class="oi-value">{{ profile.projectName || '-' }}</span>
          </div>
          <div class="full">
            <span class="oi-label">수요기관</span>
            <span class="oi-value">{{ profile.client || '-' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>요청자 정보 (필수)</h2>
        <div class="field">
          <label>이름 <span class="req">*</span></label>
          <input v-model="form.requesterName" type="text" placeholder="예: 홍길동" maxlength="100">
        </div>
        <div class="field">
          <label>연락처 <span class="req">*</span></label>
          <input v-model="form.requesterPhone" type="tel" placeholder="010-1234-5678" maxlength="20">
        </div>
      </section>

      <section class="card">
        <h2>주문 정보</h2>
        <div class="field">
          <label>긴급도 <span class="req">*</span></label>
          <div class="radio-group">
            <label v-for="u in (['URGENT','NORMAL','LOW'] as const)" :key="u" :class="{ active: form.urgency === u }">
              <input v-model="form.urgency" type="radio" :value="u">
              {{ URGENCY_DISPLAY[u].label }}
            </label>
          </div>
        </div>
        <div class="field">
          <label>희망 납품일 <span class="req">*</span></label>
          <input v-model="form.desiredDeliveryDate" type="date" :min="today">
        </div>
        <div class="field">
          <label>요청 사유</label>
          <textarea v-model="form.requestReason" rows="3" placeholder="요청 사유를 간단히 적어주세요." />
        </div>
      </section>

      <section class="card">
        <h2>
          요청 품목 ({{ items.length }}건) <span class="req">*</span>
          <button class="btn-add" @click="openPicker">
            <i class="fas fa-plus" /> 추가
          </button>
        </h2>
        <div v-if="items.length === 0" class="empty">
          품목을 1개 이상 추가해주세요.
        </div>
        <div v-else class="item-list">
          <div v-for="(it, idx) in items" :key="idx" class="item-card">
            <div class="item-info">
              <strong>{{ it.itemName }}</strong>
              <small v-if="it.specification" class="muted">{{ it.specification }}</small>
            </div>
            <div class="item-fields">
              <input
                v-model.number="it.requestQuantity"
                type="number"
                min="1"
                class="qty"
                placeholder="수량"
              >
              <input
                v-model="it.remark"
                type="text"
                class="remark"
                placeholder="비고"
              >
              <button class="btn-del" @click="removeItem(idx)">
                <i class="fas fa-trash" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="submit-bar">
        <button class="btn-submit" :disabled="!canSubmit || submitting" @click="submit">
          <i v-if="submitting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-paper-plane" />
          제출
        </button>
      </div>
    </main>

    <!-- 품목 피커 -->
    <MobileItemPickerModal
      v-if="pickerOpen"
      @close="pickerOpen = false"
      @select="addItem"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { usePublicOrderRequestStore } from '~/stores/publicOrderRequest'
import {
  URGENCY_DISPLAY,
  type OrderUrgency,
  type MobileOrderItemCreateRequest
} from '~/types/mobile-order'
import MobileItemPickerModal from '~/components/m/order-request/MobileItemPickerModal.vue'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const store = usePublicOrderRequestStore()

const token = computed(() => String(route.params.token))

const form = reactive({
  requesterName: '',
  requesterPhone: '',
  urgency: 'NORMAL' as OrderUrgency,
  desiredDeliveryDate: '',
  requestReason: ''
})

const items = ref<MobileOrderItemCreateRequest[]>([])
const pickerOpen = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

const today = new Date().toISOString().slice(0, 10)

// 토큰으로 받은 현장 프로필 (요청자 prefill + 연관 발주 표시용)
const profile = computed(() => store.profile)

const canSubmit = computed(() => {
  return form.requesterName.trim().length > 0
    && form.requesterPhone.trim().length > 0
    && form.desiredDeliveryDate.length > 0
    && items.value.length > 0
    && items.value.every(it => it.requestQuantity > 0)
})

function openPicker() { pickerOpen.value = true }

function addItem(item: { itemId: string; itemName: string; specification?: string | null }) {
  // 같은 itemId 가 이미 있으면 새 행을 추가하지 않고 기존 행의 수량을 +1 (중복 등록 방지)
  const existing = items.value.find(it => it.itemId === item.itemId)
  if (existing) {
    existing.requestQuantity = (existing.requestQuantity || 0) + 1
  } else {
    items.value.push({
      itemId: item.itemId,
      itemName: item.itemName,
      specification: item.specification ?? undefined,
      requestQuantity: 1,
      remark: ''
    })
  }
  pickerOpen.value = false
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = null
  try {
    await store.createRequest({
      requesterName: form.requesterName.trim(),
      requesterPhone: form.requesterPhone.trim(),
      urgency: form.urgency,
      desiredDeliveryDate: form.desiredDeliveryDate,
      // 납품요구번호는 토큰→현장→발주로 자동 결정됨 (입력 필드 없음)
      deliveryRequestNo: profile.value?.deliveryRequestNo || undefined,
      requestReason: form.requestReason.trim() || undefined,
      items: items.value
    })
    router.push(`/m/order-request/${token.value}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '제출 실패'
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push(`/m/order-request/${token.value}`)
}

onMounted(async () => {
  store.setToken(token.value)
  // 프로필을 받아 요청자 이름/연락처 default 세팅 + 연관 발주 정보 노출
  if (!store.profile) {
    await store.fetchProfile()
  }
  if (store.profile) {
    if (!form.requesterName) form.requesterName = store.profile.managerName ?? ''
    if (!form.requesterPhone) form.requesterPhone = store.profile.managerPhone ?? ''
  }
})
</script>

<style scoped>
@import '@/assets/css/mobile-common.css';

.mobile-form { min-height: 100vh; background: #f9fafb; padding-bottom: 6rem; }
.mobile-header {
  background: white; padding: 0.75rem 1rem;
  display: flex; align-items: center; gap: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; font-size: 1.1rem; padding: 0.25rem; cursor: pointer; }
.mobile-header h1 { margin: 0; font-size: 1.05rem; }
.form-body { padding: 0.75rem; }

/* 연관 발주 박스 (SiteFormModal.vue 의 .order-info-card 패턴 차용) */
.order-info-card {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.oi-head {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.85rem; color: #1d4ed8;
  margin-bottom: 0.5rem;
}
.oi-grid { display: flex; flex-direction: column; gap: 0.4rem; }
.oi-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
.oi-label { font-size: 0.7rem; color: #6b7280; }
.oi-value { font-size: 0.88rem; color: #111827; word-break: break-all; }

.card {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card h2 {
  font-size: 0.95rem; margin: 0 0 0.75rem;
  display: flex; align-items: center;
  color: #374151;
}
.btn-add {
  margin-left: auto;
  background: #2563eb; color: white;
  border: none; padding: 0.3rem 0.6rem; border-radius: 0.25rem;
  font-size: 0.8rem; cursor: pointer;
}
.field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
.field label { font-size: 0.85rem; color: #374151; font-weight: 500; }
.field .req { color: #dc2626; }
.field input, .field textarea {
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  font-family: inherit;
}
.hint { font-size: 0.75rem; color: #6b7280; }
.radio-group { display: flex; gap: 0.5rem; }
.radio-group label {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 0.3rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.radio-group label.active {
  border-color: #2563eb; background: #eff6ff; color: #1d4ed8;
}
.radio-group input { display: none; }
.empty { padding: 1rem; text-align: center; color: #9ca3af; font-size: 0.85rem; }
.item-list { display: flex; flex-direction: column; gap: 0.5rem; }
.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.5rem;
}
.item-info { display: flex; flex-direction: column; margin-bottom: 0.4rem; }
.item-info .muted { color: #6b7280; font-size: 0.75rem; }
.item-fields { display: flex; gap: 0.4rem; align-items: center; }
.item-fields .qty {
  width: 80px;
  padding: 0.4rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
}
.item-fields .remark {
  flex: 1;
  padding: 0.4rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.85rem;
}
.btn-del {
  background: #fef2f2; color: #dc2626;
  border: 1px solid #fecaca;
  padding: 0.4rem 0.5rem; border-radius: 0.25rem;
  cursor: pointer;
}
.error-msg {
  background: #fef2f2; color: #991b1b;
  padding: 0.5rem; border-radius: 0.25rem;
  margin: 0.75rem; font-size: 0.85rem;
}
.submit-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 0.75rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}
.btn-submit {
  width: 100%;
  padding: 0.9rem;
  background: #2563eb; color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
}
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-submit:active:not(:disabled) { background: #1d4ed8; }
</style>
