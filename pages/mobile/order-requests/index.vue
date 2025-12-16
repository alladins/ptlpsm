<template>
  <div class="mobile-order-requests">
    <!-- 헤더 -->
    <div class="mobile-header">
      <h1>내 주문 요청</h1>
      <button class="btn-new" @click="goToNewRequest">
        <i class="fas fa-plus"></i>
        신규
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>요청 목록을 불러오는 중...</p>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="requests.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>등록된 주문 요청이 없습니다.</p>
      <button class="btn-primary" @click="goToNewRequest">
        <i class="fas fa-plus"></i>
        새 요청 등록하기
      </button>
    </div>

    <!-- 요청 카드 리스트 -->
    <div v-else class="request-list">
      <div
        v-for="request in requests"
        :key="request.requestId"
        class="request-card"
        @click="goToDetail(request.requestId)"
      >
        <!-- 상태 배지 -->
        <div class="card-header">
          <span class="request-date">{{ formatDate(request.requestDate) }}</span>
          <div class="status-badges">
            <span v-if="request.isUrgent" class="urgent-badge">
              <i class="fas fa-exclamation-circle"></i>
              긴급
            </span>
            <span class="status-badge" :class="getStatusClass(request.status)">
              {{ getStatusLabel(request.status) }}
            </span>
          </div>
        </div>

        <!-- 카드 내용 -->
        <div class="card-body">
          <h3 class="site-name">{{ request.siteName }}</h3>
          <div class="card-info">
            <div class="info-item">
              <i class="fas fa-box"></i>
              <span>품목 {{ request.itemCount }}건</span>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar"></i>
              <span>희망일: {{ formatDate(request.desiredDeliveryDate) }}</span>
            </div>
          </div>
        </div>

        <!-- 카드 푸터 -->
        <div class="card-footer">
          <span v-if="request.status === 'APPROVED'" class="linked-order">
            <i class="fas fa-link"></i>
            {{ request.linkedDeliveryRequestNo || '연결됨' }}
          </span>
          <span v-else-if="request.status === 'REJECTED'" class="reject-reason">
            <i class="fas fa-times-circle"></i>
            {{ request.rejectReason || '반려됨' }}
          </span>
          <i class="fas fa-chevron-right card-arrow"></i>
        </div>
      </div>
    </div>

    <!-- 더보기 버튼 -->
    <div v-if="hasMore" class="load-more">
      <button class="btn-load-more" @click="loadMore" :disabled="loadingMore">
        <i v-if="loadingMore" class="fas fa-spinner fa-spin"></i>
        <span v-else>더보기</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import { mobileOrderService } from '~/services/mobile-order.service'
import type { MobileOrderRequest, MobileOrderStatus } from '~/types/mobile-order'

definePageMeta({
  layout: 'default',
  pageTitle: '내 주문 요청'
})

const router = useRouter()

// State
const loading = ref(true)
const loadingMore = ref(false)
const requests = ref<MobileOrderRequest[]>([])
const page = ref(1)
const hasMore = ref(false)

// Methods
const loadRequests = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const data = await mobileOrderService.getMyRequests({
      page: page.value,
      size: 10
    })

    if (isLoadMore) {
      requests.value = [...requests.value, ...data.content]
    } else {
      requests.value = data.content
    }

    hasMore.value = !data.last
  } catch (error) {
    console.error('주문 요청 목록 조회 실패:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  page.value++
  await loadRequests(true)
}

const goToNewRequest = () => {
  router.push('/mobile/order-requests/new')
}

const goToDetail = (requestId: number) => {
  router.push(`/mobile/order-requests/${requestId}`)
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getStatusClass = (status?: MobileOrderStatus): string => {
  if (!status) return ''
  switch (status) {
    case 'PENDING':
      return 'status-pending'
    case 'APPROVED':
      return 'status-approved'
    case 'REJECTED':
      return 'status-rejected'
    default:
      return ''
  }
}

const getStatusLabel = (status?: MobileOrderStatus): string => {
  if (!status) return '-'
  const labels: Record<MobileOrderStatus, string> = {
    PENDING: '대기',
    APPROVED: '승인',
    REJECTED: '반려'
  }
  return labels[status] || status
}

// Lifecycle
onMounted(() => {
  loadRequests()
})
</script>

<style scoped>
.mobile-order-requests {
  min-height: 100vh;
  background: #f3f4f6;
  padding-bottom: 2rem;
}

/* 헤더 */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-new:active {
  background: #2563eb;
}

/* 로딩/빈 상태 */
.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  color: #6b7280;
}

.loading-container i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

/* 요청 카드 리스트 */
.request-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.request-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.request-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.request-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.status-badges {
  display: flex;
  gap: 0.5rem;
}

.urgent-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-approved {
  background: #dcfce7;
  color: #16a34a;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.card-body {
  padding: 1rem;
}

.site-name {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.card-info {
  display: flex;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.info-item i {
  color: #9ca3af;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid #f3f4f6;
}

.linked-order {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #16a34a;
}

.reject-reason {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #dc2626;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-arrow {
  color: #d1d5db;
  font-size: 0.875rem;
}

/* 더보기 버튼 */
.load-more {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.btn-load-more {
  padding: 0.75rem 2rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-load-more:active {
  background: #f9fafb;
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
