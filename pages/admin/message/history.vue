<template>
  <div class="content-section">
    <!-- 페이지 헤더 -->
    <PageHeader title="메시지 히스토리" description="발송된 메시지 내역을 확인합니다" />

    <!-- 검색 영역 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item search-item-date">
          <label>발송일자</label>
          <div class="date-range">
            <input v-model="searchParams.startDate" type="date" class="date-input" />
            <span>~</span>
            <input v-model="searchParams.endDate" type="date" class="date-input" />
          </div>
        </div>

        <div class="search-item">
          <label>수신자 타입</label>
          <select v-model="searchParams.recipientType" class="status-select">
            <option value="">전체</option>
            <option value="DRIVER">배송기사</option>
            <option value="SUPERVISOR">현장소장</option>
          </select>
        </div>

        <div class="search-item">
          <label>발송 상태</label>
          <select v-model="searchParams.sendStatus" class="status-select">
            <option value="">전체</option>
            <option value="SUCCESS">성공</option>
            <option value="FAILED">실패</option>
            <option value="PENDING">대기중</option>
          </select>
        </div>

        <div class="search-item">
          <label>수신번호</label>
          <input
            v-model="searchParams.recipientPhone"
            type="text"
            class="text-input"
            placeholder="수신번호 검색"
            @keyup.enter="handleSearch"
          />
        </div>

        <button class="btn-search-inline" @click="handleSearch">
          <i class="ri-search-line"></i>
          검색
        </button>
        <button class="btn-reset-inline" @click="handleReset">
          <i class="ri-refresh-line"></i>
          초기화
        </button>
      </div>
    </div>

    <!-- 테이블 헤더 -->
    <div class="table-header">
      <div class="table-info">
        총 <strong>{{ totalElements }}</strong>건
      </div>
      <div class="table-controls">
        <select v-model="pageSize" @change="changePageSize">
          <option :value="10">10개씩 보기</option>
          <option :value="20">20개씩 보기</option>
          <option :value="50">50개씩 보기</option>
          <option :value="100">100개씩 보기</option>
        </select>
      </div>
    </div>

    <!-- 데이터 테이블 -->
    <div v-if="loading" class="loading-state">
      <i class="ri-loader-4-line animate-spin"></i>
      데이터를 불러오는 중...
    </div>

    <div v-else-if="error" class="error-state">
      <i class="ri-error-warning-line"></i>
      {{ error }}
    </div>

    <div v-else-if="messages.length === 0" class="empty-state">
      <i class="ri-inbox-line"></i>
      검색 결과가 없습니다
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>발송일시</th>
          <th>타입</th>
          <th>수신자 타입</th>
          <th>수신자명</th>
          <th>수신번호</th>
          <th>템플릿명</th>
          <th>내용 미리보기</th>
          <th>상태</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="message in messages" :key="message.messageId" class="table-row">
          <td>{{ formatDateTime(message.sendRequestedAt) }}</td>
          <td>
            <span :class="['badge', `badge-${message.messageType.toLowerCase()}`]">
              {{ message.messageType }}
            </span>
          </td>
          <td>{{ getRecipientTypeText(message.recipientType) }}</td>
          <td>{{ message.recipientName }}</td>
          <td>{{ formatPhoneNumber(message.recipientPhone) }}</td>
          <td>{{ message.templateName || '-' }}</td>
          <td>
            <div class="content-preview">
              {{ truncateContent(message.messageContent) }}
            </div>
          </td>
          <td>
            <span :class="['status-badge', getStatusClass(message.sendStatus)]">
              <i :class="getStatusIcon(message.sendStatus)"></i>
              {{ getStatusText(message.sendStatus) }}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-view" @click="showDetail(message)">
                <i class="ri-eye-line"></i>
                상세
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <Pagination
      v-if="messages.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      @change="changePage"
    />

    <!-- 상세 모달 -->
    <div v-if="selectedMessage" class="modal-overlay" @click="closeDetail">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>메시지 상세 정보</h3>
          <button class="btn-close" @click="closeDetail">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-section">
            <h4>발송 정보</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>발송요청일시</label>
                <div>{{ formatDateTime(selectedMessage.sendRequestedAt) }}</div>
              </div>
              <div class="detail-item">
                <label>발송완료일시</label>
                <div>{{ selectedMessage.sendCompletedAt ? formatDateTime(selectedMessage.sendCompletedAt) : '-' }}</div>
              </div>
              <div class="detail-item">
                <label>메시지 타입</label>
                <div>
                  <span
                    :class="['badge', `badge-${selectedMessage.messageType.toLowerCase()}`]"
                  >
                    {{ selectedMessage.messageType }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <label>발송 상태</label>
                <div>
                  <span :class="['status-badge', getStatusClass(selectedMessage.sendStatus)]">
                    <i :class="getStatusIcon(selectedMessage.sendStatus)"></i>
                    {{ getStatusText(selectedMessage.sendStatus) }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <label>템플릿 코드</label>
                <div>{{ selectedMessage.templateCode || '-' }}</div>
              </div>
              <div class="detail-item">
                <label>템플릿명</label>
                <div>{{ selectedMessage.templateName || '-' }}</div>
              </div>
              <div class="detail-item">
                <label>재시도 횟수</label>
                <div>{{ selectedMessage.retryCount }}회</div>
              </div>
              <div class="detail-item">
                <label>발송자</label>
                <div>{{ selectedMessage.sentBy || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>수신자 정보</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>수신자 타입</label>
                <div>{{ getRecipientTypeText(selectedMessage.recipientType) }}</div>
              </div>
              <div class="detail-item">
                <label>수신자명</label>
                <div>{{ selectedMessage.recipientName }}</div>
              </div>
              <div class="detail-item">
                <label>수신번호</label>
                <div>{{ formatPhoneNumber(selectedMessage.recipientPhone) }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>연관 정보</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>운송장 ID</label>
                <div>{{ selectedMessage.transportId || '-' }}</div>
              </div>
              <div class="detail-item">
                <label>운송장번호</label>
                <div>{{ selectedMessage.trackingNumber || '-' }}</div>
              </div>
              <div class="detail-item">
                <label>납품확인 ID</label>
                <div>{{ selectedMessage.deliveryId || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>메시지 내용</h4>
            <div class="message-content">
              {{ selectedMessage.messageContent }}
            </div>
          </div>

          <div v-if="selectedMessage.sendStatus === 'FAILED'" class="detail-section error-section">
            <h4>실패 정보</h4>
            <div class="error-message">
              <i class="ri-error-warning-line"></i>
              <div>
                <div v-if="selectedMessage.errorCode">에러 코드: {{ selectedMessage.errorCode }}</div>
                <div>{{ selectedMessage.errorMessage || '알 수 없는 오류' }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>뿌리오 정보</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Message Key</label>
                <div>{{ selectedMessage.ppurioMessageKey || '-' }}</div>
              </div>
              <div class="detail-item">
                <label>CMID</label>
                <div>{{ selectedMessage.ppurioCmid || '-' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="btn-primary"
            :disabled="resending"
            @click="handleResend(selectedMessage.messageId)"
          >
            <i class="ri-refresh-line"></i>
            {{ resending ? '발송 중...' : '재발송' }}
          </button>
          <button class="btn-secondary" @click="closeDetail">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { formatDateTime, formatPhoneNumber } from '~/utils/format'
import { searchMessageHistory, resendMessage } from '~/services/message-history.service'
import type {
  MessageHistoryResponse,
  MessageHistorySearchRequest,
  RecipientType,
  SendStatus
} from '~/types/message-history'
import { RECIPIENT_TYPE_LABELS, SEND_STATUS_LABELS } from '~/types/message-history'

// Page metadata
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

// State
const loading = ref(false)
const error = ref<string | null>(null)
const messages = ref<MessageHistoryResponse[]>([])
const selectedMessage = ref<MessageHistoryResponse | null>(null)
const resending = ref(false)

// Pagination
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

// Search params
const searchParams = reactive<MessageHistorySearchRequest>({
  startDate: '',
  endDate: '',
  recipientType: '',
  sendStatus: '',
  recipientPhone: '',
  page: 0,
  size: 20
})

// Methods
const loadMessages = async () => {
  loading.value = true
  error.value = null

  try {
    const params: MessageHistorySearchRequest = {
      page: currentPage.value,
      size: pageSize.value
    }

    if (searchParams.startDate) params.startDate = searchParams.startDate
    if (searchParams.endDate) params.endDate = searchParams.endDate
    if (searchParams.recipientType) params.recipientType = searchParams.recipientType as RecipientType
    if (searchParams.sendStatus) params.sendStatus = searchParams.sendStatus as SendStatus
    if (searchParams.recipientPhone) params.recipientPhone = searchParams.recipientPhone

    const response = await searchMessageHistory(params)

    messages.value = response.content
    totalElements.value = response.totalElements
    totalPages.value = response.totalPages
  } catch (err: any) {
    error.value = err.message || '데이터를 불러오는데 실패했습니다'
    console.error('메시지 목록 조회 오류:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 0
  loadMessages()
}

const handleReset = () => {
  searchParams.startDate = ''
  searchParams.endDate = ''
  searchParams.recipientType = ''
  searchParams.sendStatus = ''
  searchParams.recipientPhone = ''
  currentPage.value = 0
  loadMessages()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadMessages()
}

const changePageSize = () => {
  searchParams.size = pageSize.value
  currentPage.value = 0
  loadMessages()
}

const truncateContent = (content: string, maxLength = 50): string => {
  if (!content) return '-'
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending'
  }
  return statusMap[status] || ''
}

const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    SUCCESS: 'ri-check-line',
    FAILED: 'ri-close-line',
    PENDING: 'ri-time-line'
  }
  return iconMap[status] || 'ri-question-line'
}

const getStatusText = (status: string): string => {
  return SEND_STATUS_LABELS[status as SendStatus] || status
}

const getRecipientTypeText = (type: string): string => {
  return RECIPIENT_TYPE_LABELS[type as RecipientType] || type
}

const showDetail = (message: MessageHistoryResponse) => {
  selectedMessage.value = message
}

const closeDetail = () => {
  selectedMessage.value = null
}

const handleResend = async (messageId: number) => {
  if (resending.value) return

  if (!confirm('이 메시지를 재발송하시겠습니까?')) return

  resending.value = true
  try {
    const result = await resendMessage(messageId)
    if (result.sendStatus === 'SUCCESS') {
      alert('메시지가 재발송되었습니다.')
      closeDetail()
      loadMessages()
    } else {
      alert(result.errorMessage || '재발송에 실패했습니다.')
    }
  } catch (err: any) {
    console.error('메시지 재발송 오류:', err)
    alert('재발송 중 오류가 발생했습니다.')
  } finally {
    resending.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

/* 페이지 전용 스타일 */

/* 행 클릭 가능 표시 */
.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f9fafb;
}

/* 날짜 범위 검색 */
.search-item-date {
  min-width: 280px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.date-range span {
  color: #6b7280;
  font-weight: 500;
}

/* 배지 */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-sms {
  background: #dbeafe;
  color: #1e40af;
}

.badge-lms {
  background: #fef3c7;
  color: #92400e;
}

.badge-mms {
  background: #e0e7ff;
  color: #3730a3;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: #dcfce7;
  color: #166534;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

/* 내용 미리보기 */
.content-preview {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b7280;
  font-size: 13px;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary-sm:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary-sm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 모달 */
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

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.detail-item div {
  font-size: 14px;
  color: #1f2937;
}

.message-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.error-section .error-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 13px;
}

.error-section .error-message i {
  margin-top: 2px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

/* 반응형 */
@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .search-item-date {
    min-width: 100%;
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .date-range span {
    text-align: center;
  }
}
</style>
