<template>
  <Teleport to="body">
    <Transition name="drawer">
      <aside
        v-if="open"
        class="drawer"
        role="complementary"
        aria-label="모바일 납품요청 확인"
      >
        <header class="drawer-header">
          <div class="drawer-title">
            <i class="fas fa-mobile-alt" />
            <span>납품요청 확인</span>
            <span class="count-pill">{{ requests.length }}건</span>
          </div>
          <button class="drawer-close" type="button" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </header>

        <div v-if="selected" class="drawer-subbar">
          <button class="back-btn" type="button" @click="selected = null">
            <i class="fas fa-arrow-left" /> 목록으로
          </button>
          <span :class="['badge', statusBadge(selected.status)]">{{ statusLabel(selected.status) }}</span>
          <span :class="['badge', urgencyBadge(selected.urgency)]">{{ urgencyLabel(selected.urgency) }}</span>
        </div>

        <div class="drawer-body">
          <!-- 로딩 -->
          <div v-if="loading" class="empty">불러오는 중...</div>

          <!-- 목록 비어있음 -->
          <div v-else-if="!loading && requests.length === 0" class="empty">
            이 발주에 들어온 모바일 납품요청이 없습니다.
          </div>

          <!-- 목록 뷰 -->
          <ul v-else-if="!selected" class="req-list">
            <li
              v-for="r in requests"
              :key="r.requestId"
              class="req-card"
              @click="onSelect(r)"
            >
              <div class="card-row">
                <span class="req-no">{{ r.requestNo }}</span>
                <span :class="['badge', statusBadge(r.status)]">{{ statusLabel(r.status) }}</span>
                <span :class="['badge', urgencyBadge(r.urgency)]">{{ urgencyLabel(r.urgency) }}</span>
              </div>
              <div class="card-row meta-row">
                <span><i class="fas fa-user" /> {{ r.requesterName || '-' }}</span>
                <span><i class="fas fa-calendar" /> {{ formatDate(r.desiredDeliveryDate) }}</span>
              </div>
              <div class="card-row meta-row sub">
                <span>요청 {{ formatDateTime(r.createdAt) }}</span>
                <span>{{ r.items?.length || 0 }}품목</span>
              </div>
            </li>
          </ul>

          <!-- 상세 뷰 -->
          <section v-else class="detail">
            <h4 class="req-no-lg">{{ selected.requestNo }}</h4>

            <dl class="meta-list">
              <dt>요청자</dt>
              <dd>{{ selected.requesterName }} <span class="muted">({{ selected.requesterPhone || '-' }})</span></dd>
              <dt>희망납품일</dt>
              <dd>{{ formatDate(selected.desiredDeliveryDate) }}</dd>
              <dt>요청일시</dt>
              <dd>{{ formatDateTime(selected.createdAt) }}</dd>
              <template v-if="selected.requestReason">
                <dt>요청 사유</dt>
                <dd>{{ selected.requestReason }}</dd>
              </template>
            </dl>

            <h5 class="section-title">
              요청 품목
              <span v-if="detailLoading" class="loading-tag">불러오는 중...</span>
              <span v-else>({{ selected.items?.length || 0 }})</span>
            </h5>
            <ul v-if="!detailLoading && (selected.items?.length || 0) > 0" class="item-cards">
              <li v-for="item in selected.items" :key="item.requestItemId" class="item-card">
                <div class="item-name">{{ item.itemName }}</div>
                <div class="item-row">
                  <span class="item-spec">{{ stripPrice(item.specification) }}</span>
                  <span class="item-qty">{{ formatNumber(item.requestQuantity) }}</span>
                </div>
                <div v-if="item.remark" class="item-remark">📝 {{ item.remark }}</div>
              </li>
            </ul>
            <p v-else-if="!detailLoading" class="empty-items">품목이 없습니다.</p>

            <template v-if="selected.status !== 'PENDING'">
              <h5 class="section-title">처리 결과</h5>
              <dl class="meta-list">
                <dt>처리자</dt>
                <dd>{{ selected.processedByName || '-' }}</dd>
                <dt>처리일시</dt>
                <dd>{{ formatDateTime(selected.processedAt) }}</dd>
              </dl>
              <div v-if="selected.rejectReason" class="reject-box">
                <label>반려 사유</label>
                <p>{{ selected.rejectReason }}</p>
              </div>
            </template>
          </section>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { mobileOrderService } from '~/services/mobile-order.service'
import {
  REQUEST_STATUS_DISPLAY,
  URGENCY_DISPLAY,
  type MobileOrderRequest,
  type OrderRequestStatus,
  type OrderUrgency
} from '~/types/mobile-order'

const props = defineProps<{
  open: boolean
  requests: MobileOrderRequest[]
  loading?: boolean
}>()

defineEmits<{ (e: 'close'): void }>()

const selected = ref<MobileOrderRequest | null>(null)
const detailLoading = ref(false)

// 드로어가 닫히면 상세 선택도 초기화 → 다음에 다시 열 때 목록부터 시작
watch(() => props.open, (v) => {
  if (!v) selected.value = null
})

// 행 클릭 시 상세 API 호출 — list API는 items 미포함이므로 별도 조회
async function onSelect(r: MobileOrderRequest) {
  // 빠른 시각 피드백을 위해 일단 헤더만 표시
  selected.value = r
  detailLoading.value = true
  try {
    const full = await mobileOrderService.getAdminRequestDetail(r.requestId)
    if (full && selected.value && selected.value.requestId === r.requestId) {
      selected.value = full
    }
  } finally {
    detailLoading.value = false
  }
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
  if (n == null) return '-'
  return n.toLocaleString('ko-KR')
}
function stripPrice(spec: string | null | undefined) {
  if (!spec) return '-'
  return spec.replace(/\s*\/\s*[\d,]+\s*원\s*$/, '').trim() || '-'
}
</script>

<style scoped>
.drawer {
  position: fixed;
  top: 0; right: 0;
  width: 420px;
  height: 100vh;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -8px 0 24px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  z-index: 900;
}

.drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.drawer-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; color: #111827; }
.drawer-title i { color: #f59e0b; }
.count-pill {
  background: #f59e0b; color: #fff;
  padding: 0.1rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.75rem; font-weight: 600;
}
.drawer-close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #6b7280; }
.drawer-close:hover { color: #111827; }

.drawer-subbar {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
}
.back-btn {
  background: none; border: 1px solid #d1d5db; color: #374151;
  padding: 0.25rem 0.6rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.8rem;
}
.back-btn:hover { background: #f3f4f6; }

.drawer-body {
  padding: 0.75rem 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-width: 0;
}

.empty { padding: 2rem 0; text-align: center; color: #9ca3af; font-size: 0.875rem; }

.req-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.req-card {
  border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.625rem 0.75rem;
  background: #fff; cursor: pointer; transition: background 0.1s, border-color 0.1s;
}
.req-card:hover { background: #f9fafb; border-color: #f59e0b; }
.card-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.card-row + .card-row { margin-top: 0.35rem; }
.req-no { font-weight: 600; font-size: 0.875rem; color: #111827; }
.meta-row { font-size: 0.78rem; color: #4b5563; gap: 0.75rem; }
.meta-row.sub { font-size: 0.72rem; color: #9ca3af; }

.detail .req-no-lg { margin: 0 0 0.75rem; font-size: 1rem; color: #111827; }
.section-title { margin: 1rem 0 0.4rem; font-size: 0.85rem; color: #374151; }
.meta-list { display: grid; grid-template-columns: 80px 1fr; gap: 0.35rem 0.5rem; margin: 0; font-size: 0.83rem; }
.meta-list dt { color: #6b7280; font-weight: 500; }
.meta-list dd { margin: 0; color: #111827; }
.muted { color: #9ca3af; }

/* 품목 카드 리스트 (표 대신 카드 — 좁은 드로어 폭에서도 정보 밀도 확보) */
.item-cards { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.4rem;
  padding: 0.5rem 0.625rem;
  background: #fff;
}
.item-name {
  font-size: 0.7rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  justify-content: space-between;
}
.item-spec {
  flex: 1;
  font-size: 0.85rem;
  color: #111827;
  font-weight: 500;
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: 1.3;
}
.item-qty {
  flex-shrink: 0;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}
.item-remark {
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: #6b7280;
  background: #f9fafb;
  padding: 0.25rem 0.4rem;
  border-radius: 0.25rem;
  word-break: break-all;
}
.loading-tag { font-size: 0.7rem; color: #9ca3af; font-weight: 400; margin-left: 0.25rem; }
.empty-items { padding: 0.75rem; background: #f9fafb; border-radius: 0.25rem; color: #9ca3af; font-size: 0.8rem; text-align: center; margin: 0; }

.reject-box { margin-top: 0.5rem; padding: 0.6rem; background: #fef2f2; border-left: 3px solid #b91c1c; border-radius: 0.25rem; }
.reject-box label { display: block; font-size: 0.72rem; color: #991b1b; margin-bottom: 0.25rem; }
.reject-box p { margin: 0; color: #b91c1c; white-space: pre-wrap; font-size: 0.83rem; }

.badge {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* 슬라이드 인 트랜지션 */
.drawer-enter-active, .drawer-leave-active { transition: transform 0.2s ease-out; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
</style>
