<template>
  <div class="mobile-detail">
    <header class="mobile-header">
      <button class="btn-back" @click="goBack">
        <i class="fas fa-arrow-left" />
      </button>
      <h1>요청 상세</h1>
    </header>

    <main v-if="loading && !detail" class="loading">불러오는 중...</main>
    <main v-else-if="!detail" class="loading">요청을 찾을 수 없습니다.</main>
    <main v-else class="body">
      <section class="card">
        <div class="head">
          <strong>{{ detail.requestNo }}</strong>
          <span :class="['badge', statusBadge(detail.status)]">{{ statusLabel(detail.status) }}</span>
        </div>
        <div class="meta-grid">
          <div><label>요청자</label><span>{{ detail.requesterName }}</span></div>
          <div><label>연락처</label><span>{{ detail.requesterPhone || '-' }}</span></div>
          <div><label>긴급도</label>
            <span :class="['badge', urgencyBadge(detail.urgency)]">{{ urgencyLabel(detail.urgency) }}</span>
          </div>
          <div><label>희망납품일</label><span>{{ formatDate(detail.desiredDeliveryDate) }}</span></div>
          <div v-if="detail.deliveryRequestNo" class="full">
            <label>납품요구번호</label><span>{{ detail.deliveryRequestNo }}</span>
          </div>
          <div class="full"><label>요청일시</label><span>{{ formatDateTime(detail.createdAt) }}</span></div>
        </div>
        <div v-if="detail.requestReason" class="reason">
          <label>요청 사유</label>
          <p>{{ detail.requestReason }}</p>
        </div>
      </section>

      <section class="card">
        <h2>품목 ({{ detail.items?.length || 0 }}건)</h2>
        <div class="item-table">
          <div v-for="item in detail.items" :key="item.requestItemId" class="item-row">
            <div class="item-info">
              <strong>{{ item.itemName }}</strong>
              <small v-if="item.specification" class="muted">{{ stripPrice(item.specification) }}</small>
            </div>
            <div class="item-qty">{{ formatNumber(item.requestQuantity) }}</div>
            <div v-if="item.remark" class="item-remark">{{ item.remark }}</div>
          </div>
        </div>
      </section>

      <section v-if="detail.status !== 'PENDING'" class="card">
        <h2>처리 결과</h2>
        <div class="meta-grid">
          <div><label>처리자</label><span>{{ detail.processedByName || '-' }}</span></div>
          <div><label>처리일시</label><span>{{ formatDateTime(detail.processedAt) }}</span></div>
        </div>
        <div v-if="detail.rejectReason" class="reject">
          <label>반려 사유</label>
          <p>{{ detail.rejectReason }}</p>
        </div>
      </section>
    </main>

    <!-- 액션 바 (PENDING) -->
    <div v-if="detail?.status === 'PENDING'" class="action-bar">
      <button class="btn btn-danger" :disabled="working" @click="onCancel">
        <i class="fas fa-times" /> 취소
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#imports'
import { usePublicOrderRequestStore } from '~/stores/publicOrderRequest'
import {
  URGENCY_DISPLAY,
  REQUEST_STATUS_DISPLAY,
  type OrderUrgency,
  type OrderRequestStatus
} from '~/types/mobile-order'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const store = usePublicOrderRequestStore()

const token = computed(() => String(route.params.token))
const requestId = computed(() => Number(route.params.requestId))

const detail = computed(() => store.detail)
const loading = computed(() => store.loading)
const working = ref(false)

async function onCancel() {
  if (!confirm('이 요청을 취소하시겠습니까?')) return
  working.value = true
  try {
    await store.cancelRequest(requestId.value)
    router.push(`/m/order-request/${token.value}`)
  } catch (e) {
    alert('취소 실패: ' + (e instanceof Error ? e.message : ''))
  } finally {
    working.value = false
  }
}

function goBack() {
  router.push(`/m/order-request/${token.value}`)
}

function urgencyLabel(u: OrderUrgency) { return URGENCY_DISPLAY[u]?.label ?? u }
function urgencyBadge(u: OrderUrgency) { return URGENCY_DISPLAY[u]?.badgeClass ?? '' }
function statusLabel(s: OrderRequestStatus) { return REQUEST_STATUS_DISPLAY[s]?.label ?? s }
function statusBadge(s: OrderRequestStatus) { return REQUEST_STATUS_DISPLAY[s]?.badgeClass ?? '' }

function formatDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR')
}
function formatDateTime(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleString('ko-KR')
}
function formatNumber(n: number | null | undefined) {
  return n == null ? '-' : n.toLocaleString('ko-KR')
}
function stripPrice(spec: string | null | undefined) {
  if (!spec) return ''
  return spec.replace(/\s*\/\s*[\d,]+\s*원\s*$/, '').trim()
}

onMounted(async () => {
  store.setToken(token.value)
  await store.fetchDetail(requestId.value)
})
</script>

<style scoped>
@import '@/assets/css/mobile-common.css';

.mobile-detail { min-height: 100vh; background: #f9fafb; padding-bottom: 5rem; }
.mobile-header {
  background: white; padding: 0.75rem 1rem;
  display: flex; align-items: center; gap: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; z-index: 10;
}
.btn-back { background: none; border: none; font-size: 1.1rem; padding: 0.25rem; cursor: pointer; }
.mobile-header h1 { margin: 0; font-size: 1.05rem; }
.loading { padding: 3rem; text-align: center; color: #6b7280; }
.body { padding: 0.75rem; }
.card {
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card h2 { font-size: 0.95rem; margin: 0 0 0.75rem; color: #374151; }
.head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1rem;
}
.head strong { font-size: 1.05rem; }
.meta-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
}
.meta-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
.meta-grid .full { grid-column: 1 / -1; }
.meta-grid label { font-size: 0.75rem; color: #6b7280; }
.meta-grid span { font-size: 0.9rem; color: #111827; }
.reason, .reject {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.25rem;
}
.reason label, .reject label { font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem; }
.reason p, .reject p { margin: 0; white-space: pre-wrap; font-size: 0.9rem; }
.reject p { color: #b91c1c; }
.item-table { display: flex; flex-direction: column; gap: 0.5rem; }
.item-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem 0.75rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
}
.item-row .item-info { display: flex; flex-direction: column; }
.item-row .item-info .muted { color: #6b7280; font-size: 0.75rem; }
.item-row .item-qty { font-size: 1rem; font-weight: 600; align-self: center; }
.item-row .item-remark {
  grid-column: 1 / -1; font-size: 0.8rem; color: #6b7280;
  border-top: 1px dashed #e5e7eb;
  padding-top: 0.25rem;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
}
.action-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 0.75rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex; gap: 0.5rem;
}
.btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-danger { background: #dc2626; color: white; }
.btn-danger:active:not(:disabled) { background: #b91c1c; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
