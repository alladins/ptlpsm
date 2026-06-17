<template>
  <div class="mobile-order-request">
    <!-- 로딩 -->
    <div v-if="loading && !profile" class="screen loading-screen">
      <div class="loading-spinner" />
      <p>현장 정보를 불러오는 중...</p>
    </div>

    <!-- 만료/회수/오류 화면 -->
    <div v-else-if="errorType === 'expired'" class="screen error-screen">
      <i class="fas fa-clock big-icon warn" />
      <h2>링크가 만료되었습니다.</h2>
      <p>관리자에게 새 링크를 요청해주세요.</p>
    </div>
    <div v-else-if="errorType === 'revoked'" class="screen error-screen">
      <i class="fas fa-ban big-icon danger" />
      <h2>회수된 링크입니다.</h2>
      <p>관리자에게 문의해주세요.</p>
    </div>
    <div v-else-if="errorType === 'notfound'" class="screen error-screen">
      <i class="fas fa-exclamation-triangle big-icon warn" />
      <h2>유효하지 않은 링크입니다.</h2>
    </div>
    <div v-else-if="error && !profile" class="screen error-screen">
      <i class="fas fa-exclamation-triangle big-icon" />
      <h2>{{ error }}</h2>
      <p>관리자에게 문의해주세요.</p>
    </div>

    <!-- 메인 -->
    <div v-else class="content">
      <header class="mobile-header">
        <img src="/images/common/logo.png" alt="LEADPOWER" class="logo">
        <div class="title-block">
          <h1>{{ profile?.projectName }}</h1>
          <p v-if="profile?.client">{{ profile.client }}</p>
        </div>
      </header>

      <section class="info-section">
        <h2><i class="fas fa-info-circle" /> 현장 정보</h2>
        <div class="info-grid">
          <div>
            <span class="label">대표 소장</span>
            <span class="value">{{ profile?.managerName || '-' }}</span>
          </div>
          <div>
            <span class="label">연락처</span>
            <span class="value">{{ profile?.managerPhone || '-' }}</span>
          </div>
          <div class="full">
            <span class="label">주소</span>
            <span class="value">{{ profile?.siteAddress || '-' }}</span>
          </div>
        </div>
      </section>

      <section class="info-section">
        <h2>
          <i class="fas fa-list" /> 요청 목록 ({{ list.length }}건)
          <button class="btn-refresh" :disabled="loading" @click="refresh">
            <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" />
          </button>
        </h2>

        <div v-if="list.length === 0" class="empty">
          <i class="fas fa-inbox" />
          <p>아직 등록한 요청이 없습니다.</p>
          <p class="muted">우측 하단 "+" 버튼으로 신규 요청을 작성해주세요.</p>
        </div>

        <div v-else class="card-list">
          <article
            v-for="row in list"
            :key="row.requestId"
            class="request-card"
            :class="{ pending: row.status === 'PENDING' }"
            @click="goDetail(row.requestId)"
          >
            <div class="card-row top">
              <strong>{{ row.requestNo }}</strong>
              <span :class="['badge', statusBadge(row.status)]">{{ statusLabel(row.status) }}</span>
            </div>
            <div class="card-row">
              <span class="requester">{{ row.requesterName }}</span>
              <span :class="['badge', urgencyBadge(row.urgency)]">{{ urgencyLabel(row.urgency) }}</span>
            </div>
            <div class="card-row meta">
              <span>희망: {{ formatDate(row.desiredDeliveryDate) }}</span>
              <span>{{ formatDateTime(row.createdAt) }}</span>
            </div>
          </article>
        </div>
      </section>

      <!-- FAB -->
      <button class="fab" title="신규 요청" @click="goNew">
        <i class="fas fa-plus" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
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
const profile = computed(() => store.profile)
const list = computed(() => store.list)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const errorType = computed(() => store.errorType)

async function refresh() {
  await store.fetchList()
}

function goDetail(requestId: number) {
  router.push(`/m/order-request/${token.value}/${requestId}`)
}

function goNew() {
  router.push(`/m/order-request/${token.value}/new`)
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
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  store.setToken(token.value)
  const ok = await store.fetchProfile()
  if (ok) await store.fetchList()
})
</script>

<style scoped>
@import '@/assets/css/mobile-common.css';

.mobile-order-request {
  min-height: 100vh;
  background: #f9fafb;
  padding-bottom: 5rem;
}

.screen {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}
.loading-screen .loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid #e5e7eb; border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-screen .big-icon { font-size: 3rem; margin-bottom: 1rem; color: #6b7280; }
.error-screen .big-icon.warn { color: #f59e0b; }
.error-screen .big-icon.danger { color: #dc2626; }
.error-screen h2 { font-size: 1.2rem; margin: 0 0 0.5rem; }
.error-screen p { color: #6b7280; margin: 0; }

.mobile-header {
  background: white;
  padding: 1rem;
  display: flex; align-items: center; gap: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}
.mobile-header .logo { height: 32px; }
.title-block { flex: 1; min-width: 0; }
.title-block h1 {
  font-size: 1.05rem; margin: 0 0 0.15rem;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.title-block p { font-size: 0.8rem; color: #6b7280; margin: 0; }

.info-section {
  background: white;
  margin: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.info-section h2 {
  font-size: 0.95rem; margin: 0 0 0.75rem;
  display: flex; align-items: center; gap: 0.4rem;
  color: #374151;
}
.btn-refresh {
  margin-left: auto;
  background: none; border: 1px solid #e5e7eb;
  padding: 0.25rem 0.5rem; border-radius: 0.25rem;
  cursor: pointer;
}
.info-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
}
.info-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
.info-grid .full { grid-column: 1 / -1; }
.info-grid .label { font-size: 0.75rem; color: #6b7280; }
.info-grid .value { font-size: 0.9rem; color: #111827; }
.empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #9ca3af;
}
.empty i { font-size: 2rem; margin-bottom: 0.5rem; }
.empty .muted { font-size: 0.8rem; }

.card-list { display: flex; flex-direction: column; gap: 0.5rem; }
.request-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
}
.request-card.pending { border-left: 3px solid #f59e0b; background: #fffbeb; }
.card-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.4rem;
}
.card-row.top strong { font-size: 0.95rem; }
.card-row.meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 0; }
.requester { font-size: 0.85rem; color: #374151; }
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.fab {
  position: fixed; right: 1rem; bottom: 1rem;
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #2563eb; color: white;
  border: none;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.fab:active { background: #1d4ed8; }
</style>
