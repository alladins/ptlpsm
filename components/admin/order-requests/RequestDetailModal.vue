<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-clipboard-list" />
            주문 요청 상세
          </h3>
          <button class="modal-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading">불러오는 중...</div>
          <div v-else-if="!detail" class="loading">데이터 없음</div>
          <div v-else>
            <!-- 헤더 정보 -->
            <div class="header-info">
              <div>
                <h4>{{ detail.requestNo }}</h4>
                <span :class="['badge', statusBadge(detail.status)]">{{ statusLabel(detail.status) }}</span>
                <span :class="['badge', urgencyBadge(detail.urgency)]">{{ urgencyLabel(detail.urgency) }}</span>
              </div>
              <div class="meta-grid">
                <div><label>현장</label><span>{{ detail.siteProjectName || detail.projectName || '-' }}</span></div>
                <div><label>수요기관</label><span>{{ detail.client || '-' }}</span></div>
                <div><label>요청자</label><span>{{ detail.requesterName }} ({{ detail.requesterPhone || '-' }})</span></div>
                <div><label>희망납품일</label><span>{{ formatDate(detail.desiredDeliveryDate) }}</span></div>
                <div><label>납품요구번호</label><span>{{ detail.deliveryRequestNo || '-' }}</span></div>
                <div><label>요청일시</label><span>{{ formatDateTime(detail.createdAt) }}</span></div>
              </div>
              <div v-if="detail.requestReason" class="reason">
                <label>요청 사유</label>
                <p>{{ detail.requestReason }}</p>
              </div>
            </div>

            <!-- 품목 카드 리스트 (표 대신 카드 — 모바일·드로어와 동일 패턴, 너비 부담 적음) -->
            <div class="items-section">
              <h5>요청 품목 ({{ detail.items?.length || 0 }}건)</h5>
              <ul class="item-cards">
                <li v-for="item in detail.items" :key="item.requestItemId" class="item-card">
                  <div class="item-info">
                    <strong>{{ item.itemName }}</strong>
                    <small v-if="item.specification" class="muted">{{ stripPrice(item.specification) }}</small>
                  </div>
                  <div class="item-qty">{{ formatNumber(item.requestQuantity) }}</div>
                  <div v-if="item.remark" class="item-remark">📝 {{ item.remark }}</div>
                </li>
              </ul>
            </div>

            <!-- 처리 결과 (처리된 경우) -->
            <div v-if="detail.status !== 'PENDING'" class="result-section">
              <h5>처리 결과</h5>
              <div class="meta-grid">
                <div><label>처리자</label><span>{{ detail.processedByName || '-' }}</span></div>
                <div><label>처리일시</label><span>{{ formatDateTime(detail.processedAt) }}</span></div>
              </div>
              <div v-if="detail.rejectReason" class="reject">
                <label>반려 사유</label>
                <p>{{ detail.rejectReason }}</p>
              </div>
            </div>

            <!-- 반려 입력 (반려 모드) -->
            <div v-if="rejectMode" class="reject-input">
              <label for="rej-reason">반려 사유 (필수)</label>
              <textarea
                id="rej-reason"
                v-model="rejectReason"
                rows="3"
                placeholder="반려 사유를 입력하세요"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">닫기</button>
          <template v-if="detail && detail.status === 'PENDING'">
            <template v-if="!rejectMode">
              <button class="btn-danger" @click="rejectMode = true">
                <i class="fas fa-times" /> 반려
              </button>
              <button class="btn-primary" @click="onApprove">
                <i class="fas fa-check" /> 승인
              </button>
            </template>
            <template v-else>
              <button class="btn-secondary" @click="rejectMode = false; rejectReason = ''">취소</button>
              <button class="btn-danger" :disabled="!rejectReason.trim()" @click="onReject">
                반려 확정
              </button>
            </template>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mobileOrderService } from '~/services/mobile-order.service'
import {
  REQUEST_STATUS_DISPLAY,
  URGENCY_DISPLAY,
  type MobileOrderRequest,
  type OrderRequestStatus,
  type OrderUrgency
} from '~/types/mobile-order'

const props = defineProps<{ requestId: number }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'processed'): void }>()

const detail = ref<MobileOrderRequest | null>(null)
const loading = ref(false)
const rejectMode = ref(false)
const rejectReason = ref('')

async function load() {
  loading.value = true
  try {
    detail.value = await mobileOrderService.getAdminRequestDetail(props.requestId)
  } finally {
    loading.value = false
  }
}

async function onApprove() {
  if (!detail.value) return
  if (!confirm('이 요청을 승인하시겠습니까?')) return
  try {
    await mobileOrderService.approveRequest(props.requestId, {})
    emit('processed')
  } catch (e) {
    alert('승인 실패: ' + (e instanceof Error ? e.message : ''))
  }
}

async function onReject() {
  if (!detail.value) return
  const reason = rejectReason.value.trim()
  if (!reason) return
  try {
    await mobileOrderService.rejectRequest(props.requestId, { reason })
    emit('processed')
  } catch (e) {
    alert('반려 실패: ' + (e instanceof Error ? e.message : ''))
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

onMounted(load)
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
  width: 90%; max-width: 800px;
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
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #6b7280; }
.modal-body { padding: 1.5rem; overflow-y: auto; overflow-x: hidden; flex: 1; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 0.75rem 0.75rem;
}
.loading { text-align: center; padding: 2rem; color: #6b7280; }
.header-info h4 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.header-info > div:first-child { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.meta-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 1.5rem;
  margin-bottom: 1rem;
}
.meta-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
.meta-grid label { font-size: 0.75rem; color: #6b7280; }
.meta-grid span { font-size: 0.9rem; color: #111827; }
.reason, .reject {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.25rem;
}
.reason label, .reject label { font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem; }
.reason p, .reject p { margin: 0; white-space: pre-wrap; }
.reject p { color: #b91c1c; }
.items-section, .result-section { margin-top: 1.5rem; }
.items-section h5, .result-section h5 { margin: 0 0 0.5rem; font-size: 0.95rem; }
.item-cards { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.item-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem 0.75rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.4rem;
  background: #fff;
}
.item-card .item-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.item-card .item-info strong { font-size: 0.9rem; color: #111827; word-break: break-all; }
.item-card .item-info .muted {
  color: #6b7280; font-size: 0.78rem;
  word-break: break-all; overflow-wrap: anywhere;
}
.item-card .item-qty {
  align-self: center;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}
.item-card .item-remark {
  grid-column: 1 / -1;
  font-size: 0.78rem;
  color: #6b7280;
  background: #f9fafb;
  padding: 0.3rem 0.45rem;
  border-radius: 0.25rem;
  word-break: break-all;
}
.reject-input { margin-top: 1rem; }
.reject-input label { font-size: 0.85rem; margin-bottom: 0.25rem; display: block; }
.reject-input textarea {
  width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem;
  font-family: inherit; font-size: 0.9rem;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.btn-primary {
  padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.25rem; cursor: pointer;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary {
  padding: 0.5rem 1rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 0.25rem; cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }
.btn-danger {
  padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.25rem; cursor: pointer;
}
.btn-danger:hover { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
