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
          <label>메시지 타입</label>
          <select v-model="searchParams.messageType" class="status-select">
            <option value="">전체</option>
            <option value="SMS">SMS</option>
            <option value="LMS">LMS</option>
            <option value="MMS">MMS</option>
          </select>
        </div>

        <div class="search-item">
          <label>발송 상태</label>
          <select v-model="searchParams.status" class="status-select">
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
          <th>수신자명</th>
          <th>수신번호</th>
          <th>템플릿명</th>
          <th>내용 미리보기</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="message in messages" :key="message.id" class="table-row" @click="showDetail(message)" style="cursor: pointer;">
          <td>{{ formatDateTime(message.sentAt) }}</td>
          <td>
            <span :class="['badge', `badge-${message.messageType.toLowerCase()}`]">
              {{ message.messageType }}
            </span>
          </td>
          <td>{{ message.recipientName }}</td>
          <td>{{ formatPhoneNumber(message.recipientPhone) }}</td>
          <td>{{ message.templateName || '-' }}</td>
          <td>
            <div class="content-preview">
              {{ truncateContent(message.content) }}
            </div>
          </td>
          <td>
            <span :class="['status-badge', getStatusClass(message.status)]">
              <i :class="getStatusIcon(message.status)"></i>
              {{ getStatusText(message.status) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <Pagination
      v-if="messages.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      @change-page="changePage"
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
                <label>발송일시</label>
                <div>{{ formatDateTime(selectedMessage.sentAt) }}</div>
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
                  <span :class="['status-badge', getStatusClass(selectedMessage.status)]">
                    <i :class="getStatusIcon(selectedMessage.status)"></i>
                    {{ getStatusText(selectedMessage.status) }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <label>템플릿명</label>
                <div>{{ selectedMessage.templateName || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>수신자 정보</h4>
            <div class="detail-grid">
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
            <h4>메시지 내용</h4>
            <div v-if="selectedMessage.subject" class="message-subject">
              {{ selectedMessage.subject }}
            </div>
            <div class="message-content">
              {{ selectedMessage.content }}
            </div>
          </div>

          <div v-if="selectedMessage.failReason" class="detail-section error-section">
            <h4>실패 사유</h4>
            <div class="error-message">
              <i class="ri-error-warning-line"></i>
              {{ selectedMessage.failReason }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDetail">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { formatDateTime, formatPhoneNumber } from '~/utils/format'

// Page metadata
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

// Types
interface MessageHistory {
  id: number
  messageType: 'SMS' | 'LMS' | 'MMS'
  recipientName: string
  recipientPhone: string
  templateName?: string
  subject?: string
  content: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  sentAt: string
  failReason?: string
}

interface SearchParams {
  startDate: string
  endDate: string
  messageType: string
  status: string
  recipientPhone: string
  page: number
  size: number
}

// State
const loading = ref(false)
const error = ref<string | null>(null)
const messages = ref<MessageHistory[]>([])
const selectedMessage = ref<MessageHistory | null>(null)

// Pagination
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

// Search params
const searchParams = reactive<SearchParams>({
  startDate: '',
  endDate: '',
  messageType: '',
  status: '',
  recipientPhone: '',
  page: 0,
  size: 20
})

// Methods
const loadMessages = async () => {
  loading.value = true
  error.value = null

  try {
    // TODO: API 연동 (현재는 Mock 데이터)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock data
    const mockMessages: MessageHistory[] = [
      {
        id: 1,
        messageType: 'LMS',
        recipientName: '김현장',
        recipientPhone: '01012345678',
        templateName: '납품확인서 서명 요청 (현장소장)',
        subject: '[플래트리] 납품확인서 서명 요청',
        content:
          '안녕하세요, 김현장님.\n\n납품요구번호: 35-24-3-41787-00\n계약번호: 제00-22-7-0305-01호\n\n아래 링크에서 납품확인서에 서명해 주시기 바랍니다.\nhttps://example.com/signature/abc123',
        status: 'SUCCESS',
        sentAt: '2025-01-14T14:30:00'
      },
      {
        id: 2,
        messageType: 'SMS',
        recipientName: '이기사',
        recipientPhone: '01098765432',
        templateName: '운송 출발 안내',
        content: '[플래트리] 운송장번호 T-2025-001 출발하였습니다. 예상도착: 15:00',
        status: 'SUCCESS',
        sentAt: '2025-01-14T13:00:00'
      },
      {
        id: 3,
        messageType: 'LMS',
        recipientName: '박감리',
        recipientPhone: '01055556666',
        templateName: '납품완료계 서명 요청 (감리원)',
        subject: '[플래트리] 납품완료계 서명 요청',
        content:
          '안녕하세요, 박감리님.\n\n납품완료계 서명을 요청드립니다.\n\n납품요구번호: 35-24-3-41787-00\n프로젝트: 군산시광역해양레저체험복합단지조성사업\n\n서명 링크: https://example.com/signature/xyz789',
        status: 'FAILED',
        sentAt: '2025-01-14T10:00:00',
        failReason: '수신번호 오류'
      }
    ]

    messages.value = mockMessages
    totalElements.value = mockMessages.length
    totalPages.value = 1
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
  searchParams.messageType = ''
  searchParams.status = ''
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
  const textMap: Record<string, string> = {
    SUCCESS: '성공',
    FAILED: '실패',
    PENDING: '대기중'
  }
  return textMap[status] || status
}

const showDetail = (message: MessageHistory) => {
  selectedMessage.value = message
}

const closeDetail = () => {
  selectedMessage.value = null
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
  cursor: pointer;
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
  max-width: 600px;
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

.message-subject {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
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
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 13px;
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
