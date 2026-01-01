<template>
  <div class="order-requests-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품요청"
      description="현장소장의 납품요청을 확인하고 처리합니다."
      icon="delivery"
      icon-color="cyan"
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo"></i>
          초기화
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 통계 요약 카드 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon stat-icon--red">
            <i class="fas fa-bell"></i>
          </div>
          <div class="stat-content">
            <h3>신규 요청</h3>
            <p>{{ statistics.newCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--yellow">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>대기중</h3>
            <p>{{ statistics.pendingCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>승인</h3>
            <p>{{ statistics.approvedCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--gray">
            <i class="fas fa-times-circle"></i>
          </div>
          <div class="stat-content">
            <h3>반려</h3>
            <p>{{ statistics.rejectedCount }}</p>
          </div>
        </div>
      </div>

      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 요청일자 -->
          <div class="search-item">
            <label>요청일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="form-select">
              <option value="">전체</option>
              <option value="PENDING">대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
            </select>
          </div>

          <!-- 긴급도 -->
          <div class="search-item">
            <label>긴급도:</label>
            <select v-model="searchForm.urgency" class="form-select">
              <option value="">전체</option>
              <option value="URGENT">긴급</option>
              <option value="NORMAL">보통</option>
              <option value="LOW">여유</option>
            </select>
          </div>

          <!-- 검색어 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input
              type="text"
              v-model="searchForm.keyword"
              placeholder="현장명, 요청자명"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 요청 목록 테이블 -->
      <div class="table-section">
        <!-- 테이블 헤더 -->
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
              <option :value="10">10개씩</option>
              <option :value="20">20개씩</option>
              <option :value="50">50개씩</option>
            </select>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 60px;">신규</th>
                <th style="width: 110px;">요청일</th>
                <th>현장명</th>
                <th style="width: 100px;">요청자</th>
                <th style="width: 80px;">품목수</th>
                <th style="width: 80px;">긴급도</th>
                <th style="width: 110px;">희망납품일</th>
                <th style="width: 80px;">상태</th>
                <th style="width: 120px;">처리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in requests"
                :key="item.requestId"
                class="table-row"
                :class="{ 'row-urgent': item.urgency === 'URGENT' }"
              >
                <td>{{ startIndex + index }}</td>
                <td>
                  <span v-if="isNewRequest(item.requestDate)" class="new-badge">
                    <i class="fas fa-circle"></i>
                    NEW
                  </span>
                </td>
                <td>{{ formatDate(item.requestDate) }}</td>
                <td class="text-left">{{ item.siteName }}</td>
                <td>{{ item.requesterName }}</td>
                <td>{{ item.itemCount }}건</td>
                <td>
                  <span class="urgency-badge" :class="getUrgencyClass(item.urgency)">
                    {{ getUrgencyLabel(item.urgency) }}
                  </span>
                </td>
                <td>{{ formatDate(item.desiredDeliveryDate) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="item.status === 'PENDING'"
                      class="btn-process"
                      @click.stop="openProcessModal(item)"
                    >
                      <i class="fas fa-tasks"></i>
                      처리
                    </button>
                    <button
                      class="btn-view"
                      @click.stop="openDetailModal(item)"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 데이터가 없을 때 -->
          <div v-if="requests.length === 0" class="no-data-message">
            <i class="fas fa-inbox"></i>
            <p>등록된 주문 요청이 없습니다.</p>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <Pagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 처리 모달 -->
    <OrderRequestProcessModal
      v-if="showProcessModal"
      :request="selectedRequest"
      @close="closeProcessModal"
      @submit="handleProcessSubmit"
    />

    <!-- 상세 보기 모달 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <h3>주문 요청 상세</h3>
          <button class="modal-close" @click="closeDetailModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedRequest" class="detail-content">
            <!-- 기본 정보 -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-info-circle"></i>
                <span>요청 정보</span>
              </div>
              <div class="info-grid grid-3">
                <div class="info-item">
                  <label>요청일</label>
                  <span>{{ formatDate(selectedRequest.requestDate) }}</span>
                </div>
                <div class="info-item">
                  <label>현장명</label>
                  <span>{{ selectedRequest.siteName }}</span>
                </div>
                <div class="info-item">
                  <label>요청자</label>
                  <span>{{ selectedRequest.requesterName }}</span>
                </div>
                <div class="info-item">
                  <label>배송지</label>
                  <span>{{ selectedRequest.deliveryAddress }}</span>
                </div>
                <div class="info-item">
                  <label>희망 납품일</label>
                  <span>{{ formatDate(selectedRequest.desiredDeliveryDate) }}</span>
                </div>
                <div class="info-item">
                  <label>긴급도</label>
                  <span class="urgency-badge" :class="getUrgencyClass(selectedRequest.urgency)">
                    {{ getUrgencyLabel(selectedRequest.urgency) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 요청 품목 -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-box"></i>
                <span>요청 품목 ({{ selectedRequest.items?.length || 0 }}건)</span>
              </div>
              <div class="items-table-wrapper">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>품목명</th>
                      <th>규격</th>
                      <th>수량</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in selectedRequest.items" :key="idx">
                      <td>{{ idx + 1 }}</td>
                      <td>{{ item.itemName }}</td>
                      <td>{{ item.specification || '-' }}</td>
                      <td class="text-right">{{ formatNumber(item.quantity) }}</td>
                      <td>{{ item.note || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 추가 메모 -->
            <div v-if="selectedRequest.additionalNotes" class="info-group">
              <div class="info-group-header">
                <i class="fas fa-sticky-note"></i>
                <span>추가 메모</span>
              </div>
              <div class="notes-content">
                {{ selectedRequest.additionalNotes }}
              </div>
            </div>

            <!-- 처리 결과 (승인/반려 시) -->
            <div v-if="selectedRequest.status !== 'PENDING'" class="info-group">
              <div class="info-group-header">
                <i class="fas fa-clipboard-check"></i>
                <span>처리 결과</span>
              </div>
              <div class="info-grid grid-2">
                <div class="info-item">
                  <label>처리 상태</label>
                  <span class="status-badge" :class="getStatusClass(selectedRequest.status)">
                    {{ getStatusLabel(selectedRequest.status) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>처리일</label>
                  <span>{{ formatDate(selectedRequest.processedDate) }}</span>
                </div>
                <div v-if="selectedRequest.status === 'APPROVED'" class="info-item">
                  <label>연결된 납품요구</label>
                  <span class="linked-order">
                    <i class="fas fa-link"></i>
                    {{ selectedRequest.linkedDeliveryRequestNo || '-' }}
                  </span>
                </div>
                <div v-if="selectedRequest.status === 'REJECTED'" class="info-item full-width">
                  <label>반려 사유</label>
                  <span class="reject-reason">{{ selectedRequest.rejectReason }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDetailModal">닫기</button>
          <button
            v-if="selectedRequest?.status === 'PENDING'"
            class="btn-primary"
            @click="openProcessModalFromDetail"
          >
            <i class="fas fa-tasks"></i>
            처리하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { mobileOrderService } from '~/services/mobile-order.service'
import type {
  MobileOrderRequest,
  MobileOrderStatus,
  MobileOrderUrgency,
  MobileOrderRequestListResponse
} from '~/types/mobile-order'
import { formatDate, formatNumber } from '~/utils/format'
import OrderRequestProcessModal from '~/components/admin/OrderRequestProcessModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '주문 요청 관리'
})

// State
const loading = ref(false)
const requests = ref<MobileOrderRequest[]>([])
const currentPage = ref(1)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(10)

// 통계
const statistics = ref({
  newCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0
})

// 검색 폼
const searchForm = ref({
  startDate: '',
  endDate: '',
  status: '' as MobileOrderStatus | '',
  urgency: '' as MobileOrderUrgency | '',
  keyword: ''
})

// 모달 상태
const showProcessModal = ref(false)
const showDetailModal = ref(false)
const selectedRequest = ref<MobileOrderRequest | null>(null)

// Computed
const startIndex = computed(() => {
  if (totalElements.value === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const endIndex = computed(() => {
  const end = currentPage.value * pageSize.value
  return Math.min(end, totalElements.value)
})

// Methods
const loadRequests = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value - 1,
      size: pageSize.value
    }

    if (searchForm.value.startDate) params.startDate = searchForm.value.startDate
    if (searchForm.value.endDate) params.endDate = searchForm.value.endDate
    if (searchForm.value.status) params.status = searchForm.value.status
    if (searchForm.value.urgency) params.urgency = searchForm.value.urgency
    if (searchForm.value.keyword) params.keyword = searchForm.value.keyword

    const response = await mobileOrderService.getAllRequests(params)

    requests.value = response.content
    totalElements.value = response.totalElements
    totalPages.value = response.totalPages

    // 통계 업데이트
    await loadStatistics()
  } catch (error) {
    console.error('주문 요청 목록 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    // 각 상태별 카운트를 위한 API 호출
    // 실제로는 통계 전용 API가 있을 수 있음
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      mobileOrderService.getAllRequests({ status: 'PENDING', page: 0, size: 1 }),
      mobileOrderService.getAllRequests({ status: 'APPROVED', page: 0, size: 1 }),
      mobileOrderService.getAllRequests({ status: 'REJECTED', page: 0, size: 1 })
    ])

    statistics.value = {
      newCount: countNewRequests(requests.value),
      pendingCount: pendingRes.totalElements,
      approvedCount: approvedRes.totalElements,
      rejectedCount: rejectedRes.totalElements
    }
  } catch (error) {
    console.error('통계 조회 실패:', error)
  }
}

const countNewRequests = (items: MobileOrderRequest[]): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return items.filter(item => {
    if (!item.requestDate) return false
    const requestDate = new Date(item.requestDate)
    requestDate.setHours(0, 0, 0, 0)
    return requestDate.getTime() === today.getTime() && item.status === 'PENDING'
  }).length
}

const isNewRequest = (dateStr?: string): boolean => {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const requestDate = new Date(dateStr)
  requestDate.setHours(0, 0, 0, 0)
  return requestDate.getTime() === today.getTime()
}

const handleSearch = () => {
  currentPage.value = 1
  loadRequests()
}

const handleReset = () => {
  searchForm.value = {
    startDate: '',
    endDate: '',
    status: '',
    urgency: '',
    keyword: ''
  }
  currentPage.value = 1
  loadRequests()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadRequests()
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  loadRequests()
}

// 상태 관련 헬퍼
const getStatusClass = (status?: MobileOrderStatus): string => {
  if (!status) return ''
  switch (status) {
    case 'PENDING': return 'status-pending'
    case 'APPROVED': return 'status-approved'
    case 'REJECTED': return 'status-rejected'
    default: return ''
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

// 긴급도 관련 헬퍼
const getUrgencyClass = (urgency?: MobileOrderUrgency): string => {
  if (!urgency) return ''
  switch (urgency) {
    case 'URGENT': return 'urgency-urgent'
    case 'NORMAL': return 'urgency-normal'
    case 'LOW': return 'urgency-low'
    default: return ''
  }
}

const getUrgencyLabel = (urgency?: MobileOrderUrgency): string => {
  if (!urgency) return '-'
  const labels: Record<MobileOrderUrgency, string> = {
    URGENT: '긴급',
    NORMAL: '보통',
    LOW: '여유'
  }
  return labels[urgency] || urgency
}

// 모달 처리
const openProcessModal = (request: MobileOrderRequest) => {
  selectedRequest.value = request
  showProcessModal.value = true
}

const closeProcessModal = () => {
  showProcessModal.value = false
}

const openDetailModal = (request: MobileOrderRequest) => {
  selectedRequest.value = request
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
}

const openProcessModalFromDetail = () => {
  showDetailModal.value = false
  showProcessModal.value = true
}

const handleProcessSubmit = async (result: { action: 'approve' | 'reject'; orderId?: number; rejectReason?: string }) => {
  if (!selectedRequest.value) return

  try {
    if (result.action === 'approve' && result.orderId) {
      await mobileOrderService.approveRequest(selectedRequest.value.requestId!, result.orderId)
    } else if (result.action === 'reject' && result.rejectReason) {
      await mobileOrderService.rejectRequest(selectedRequest.value.requestId!, result.rejectReason)
    }

    closeProcessModal()
    await loadRequests()
    alert(result.action === 'approve' ? '주문 요청이 승인되었습니다.' : '주문 요청이 반려되었습니다.')
  } catch (error) {
    console.error('처리 실패:', error)
    alert('처리 중 오류가 발생했습니다.')
  }
}

// Lifecycle
onMounted(() => {
  loadRequests()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-forms.css';

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 테이블 스타일 */
.data-table thead th {
  text-align: center;
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

.data-table tbody tr {
  transition: all 0.2s;
}

.data-table tbody tr:hover {
  background: #f0f4ff;
}

.data-table tbody td {
  text-align: center;
  vertical-align: middle;
}

.data-table tbody td.text-left {
  text-align: left;
}

.data-table tbody td.text-right {
  text-align: right;
}

/* 긴급 행 강조 */
.row-urgent {
  background: #fef2f2 !important;
}

.row-urgent:hover {
  background: #fee2e2 !important;
}

/* 신규 배지 */
.new-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #dc2626;
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.new-badge i {
  font-size: 0.5rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
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

/* 긴급도 배지 */
.urgency-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.urgency-urgent {
  background: #fef2f2;
  color: #dc2626;
}

.urgency-normal {
  background: #f0fdf4;
  color: #16a34a;
}

.urgency-low {
  background: #eff6ff;
  color: #2563eb;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-process {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-process:hover {
  background: #2563eb;
}

.btn-view {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-container.modal-lg {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #111827;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

/* 상세 모달 내용 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.info-item span {
  font-size: 0.875rem;
  color: #111827;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

/* 품목 테이블 */
.items-table-wrapper {
  overflow-x: auto;
  margin-top: 0.5rem;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.items-table th,
.items-table td {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.items-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.items-table td.text-right {
  text-align: right;
}

/* 메모 내용 */
.notes-content {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  white-space: pre-wrap;
}

/* 연결된 납품요구 */
.linked-order {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: #16a34a;
  font-weight: 500;
}

.linked-order i {
  font-size: 0.75rem;
}

/* 반려 사유 */
.reject-reason {
  color: #dc2626;
  background: #fef2f2;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  display: block;
}

/* 버튼 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* 반응형 */
@media (max-width: 1024px) {
  .order-requests-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 900px;
  }
}
</style>
