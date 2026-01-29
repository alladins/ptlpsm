<template>
  <div class="transport-list">
    <!-- 페이지 헤더 - 리팩토링: UiPageHeader 컴포넌트 사용 -->
    <PageHeader
      title="운송관리"
      description="운송 정보를 조회하고 관리합니다."
      icon="transport"
      icon-color="orange"
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          검색
        </button>
        <button
          class="btn-action btn-primary"
          @click="goRegister"
          :disabled="!canWrite"
          :title="!canWrite ? '등록 권한이 없습니다' : ''"
        >
          <i class="fas fa-plus"></i>
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 섹션 - 완전히 한 줄 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 등록일자 -->
          <div class="search-item">
            <label>등록일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 납품요구번호 -->
          <div class="search-item">
            <label>납품요구번호:</label>
            <input type="text" v-model="searchForm.deliveryRequestNo" placeholder="납품요구번호" class="text-input" readonly>
            <button type="button" class="btn-search-inline" @click="openOrderSelectPopup">
              <i class="fas fa-search"></i>
              조회
            </button>
          </div>

          <!-- 출하ID -->
          <div class="search-item">
            <label>출하ID:</label>
            <input type="number" v-model.number="searchForm.shipmentId" placeholder="출하ID" class="text-input" @keyup.enter="handleSearch">
          </div>

          <!-- 상태 -->
          <div class="search-item search-keyword">
            <label>상태:</label>
            <select v-model="searchForm.status" class="keyword-input">
              <option value="">전체</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 목록 테이블 -->
      <div class="table-section">
        <!-- 테이블 헤더: 리팩토링 - admin-common.css 스타일 사용 -->
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <select v-model="sortOption" @change="handleSortChange" class="form-select mr-2">
              <option value="createdAt,desc">생성일자 ↓</option>
              <option value="createdAt,asc">생성일자 ↑</option>
              <option value="deliveryDate,desc">배송예정일 ↓</option>
              <option value="deliveryDate,asc">배송예정일 ↑</option>
            </select>
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

        <!-- 데이터가 없을 때 - 리팩토링: admin-common.css 스타일 사용 -->
        <div v-else-if="transportList.length === 0" class="no-data-message">
          <i class="fas fa-truck"></i>
          <p>등록된 운송장 정보가 없습니다.</p>
        </div>

        <div v-else class="table-container">
            <table class="data-table">
            <thead>
                <tr>
                  <th>No</th>
                  <th>출하NO</th>
                  <th>납품요구번호</th>
                  <th>배송지</th>
                  <th>배송예정일</th>
                  <th>운송장번호</th>
                  <th>기사명</th>
                  <th>배송상태</th>
                  <th>등록자</th>
                  <th>등록일시</th>
                  <th>메시지</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in transportList" :key="item.transportId" class="table-row" @click="goToEdit(item.transportId)" style="cursor: pointer;">
                  <td>{{ startIndex + index }}</td>
                  <td>{{ item.shipmentNo || '-' }}</td>
                  <td>{{ item.deliveryRequestNo }}</td>
                  <td>
                    <span class="address-text" :title="item.addressDetail">
                      {{ item.deliveryAddress }}
                    </span>
                  </td>
                  <td>{{ formatDate(item.deliveryDate) }}</td>
                  <td>{{ item.trackingNumber || '-' }}</td>
                  <td>{{ item.driverName || '-' }}</td>
                  <td>{{ formatStatus(item.status) }}</td>
                  <td>{{ item.createdBy }}</td>
                  <td>{{ formatDateTime(item.createdAt) }}</td>
                  <td>
                    <button
                      class="btn-message-sm"
                      @click.stop="sendMessage(item)"
                      :disabled="!canSendMessage(item)"
                      :title="getMessageButtonTitle(item)"
                    >
                      <i class="fas fa-comment-dots"></i>
                      메시지
                    </button>
                  </td>
                </tr>
            </tbody>
            </table>
        </div>

        <!-- 페이지네이션 - 리팩토링: UiPagination 컴포넌트 사용 -->
        <Pagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 발주 선택 팝업 -->
    <OrderSelectPopup
      v-if="showOrderPopup"
      :show="showOrderPopup"
      @close="closeOrderSelectPopup"
      @select="handleOrderSelect"
    />

    <!-- 메시지 발송 결과 모달 -->
    <Teleport to="body">
      <div v-if="showResultModal" class="modal-overlay" @click.self="closeResultModal">
        <div class="result-modal">
          <div class="modal-header">
            <h3>
              <!-- 성공/중복에 따른 아이콘 -->
              <i v-if="resultInfo?.type === 'success'" class="fas fa-check-circle text-success"></i>
              <i v-else class="fas fa-exclamation-triangle text-warning"></i>
              {{ resultInfo?.type === 'success' ? '메시지 발송 완료' : '중복 발송 안내' }}
            </h3>
            <button class="close-btn" @click="closeResultModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="result-message">
              {{ resultInfo?.type === 'success'
                 ? '메시지가 발송되었습니다.'
                 : '이미 메시지가 발송되었습니다.' }}
            </p>

            <div class="url-info">
              <label>발송 URL:</label>
              <div class="url-box">{{ resultInfo?.mobileUrl }}</div>

              <!-- 성공: 만료 시간 표시 -->
              <p v-if="resultInfo?.type === 'success' && resultInfo?.tokenExpiresAt" class="info-time">
                만료 시간: {{ formatDateTime(resultInfo.tokenExpiresAt) }}
              </p>

              <!-- 중복: 발송 시각 표시 -->
              <p v-if="resultInfo?.type === 'duplicate' && resultInfo?.messageSentAt" class="info-time">
                발송 시각: {{ formatDateTime(resultInfo.messageSentAt) }}
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="copyResultUrl">
              <i class="fas fa-copy"></i>
              URL 복사
            </button>
            <button class="btn-secondary" @click="closeResultModal">
              닫기
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import type { TransportDetail } from '~/services/transport.service'
import { deliveryService } from '~/services/delivery.service'
import type { OrderDetailResponse } from '~/types/order'
// 리팩토링: 공통 모듈 import
import { formatDate, formatDateTime } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { usePermission } from '~/composables/usePermission'

// 동적 import로 변경
const OrderSelectPopup = defineAsyncComponent(() =>
  import('~/components/admin/common/OrderSelectPopup.vue')
)

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 목록'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canWrite } = usePermission()

// 상태 관리 (DB 기반)
const { statusOptions, getStatusLabel } = useCommonStatus()

// 발주 선택 팝업 상태
const showOrderPopup = ref(false)

// 메시지 발송 결과 모달 상태
const showResultModal = ref(false)
const resultInfo = ref<{
  type: 'success' | 'duplicate'  // 성공 or 중복
  mobileUrl: string
  tokenExpiresAt?: string
  messageSentAt?: string
} | null>(null)

// 오늘 날짜 (로컬 시간 기준 - UTC 시간대 문제 해결)
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 6개월 전 날짜 계산 (로컬 시간 기준)
const getSixMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 검색 폼 데이터
const searchForm = ref({
  startDate: getSixMonthsAgo(),
  endDate: getTodayDate(),
  deliveryRequestNo: '',
  shipmentId: null as number | null,
  status: ''
})

// 정렬 옵션 상태
const sortOption = ref('createdAt,desc')

// 리팩토링: useDataTable composable 사용으로 페이지네이션 로직 통합
const {
  items: transportList,
  loading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  startIndex,
  endIndex,
  changePage,
  changePageSize,
  changeSort,
  search,
  refresh,
  reset
} = useDataTable<TransportDetail>({
  fetchFunction: async (params) => {
    const response = await transportService.getTransportList({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      deliveryRequestNo: searchForm.value.deliveryRequestNo,
      shipmentId: searchForm.value.shipmentId || 0,
      status: searchForm.value.status,
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'createdAt,desc'
    })
    return response
  },
  initialPageSize: 10,
  initialSort: 'createdAt,desc'
})

// 상태 포맷팅 (DB 기반)
const formatStatus = (status: string) => {
  return getStatusLabel(status)
}

// 발주번호 조회 팝업 열기/닫기
const openOrderSelectPopup = () => {
  showOrderPopup.value = true
}

const closeOrderSelectPopup = () => {
  showOrderPopup.value = false
}

// 결과 모달 닫기
const closeResultModal = () => {
  showResultModal.value = false
  resultInfo.value = null
  search()  // 목록 새로고침
}

// 결과 URL 복사
const copyResultUrl = async () => {
  if (resultInfo.value?.mobileUrl) {
    try {
      await navigator.clipboard.writeText(resultInfo.value.mobileUrl)
      alert('URL이 클립보드에 복사되었습니다.')
    } catch (err) {
      prompt('아래 URL을 복사하세요:', resultInfo.value.mobileUrl)
    }
  }
}

// 발주 선택 처리
const handleOrderSelect = (order: OrderDetailResponse) => {
  searchForm.value.deliveryRequestNo = order.deliveryRequestNo
  closeOrderSelectPopup()
  search()
}

// 검색 기능
const handleSearch = () => {
  search()
}

// 검색 초기화
const handleReset = () => {
  searchForm.value = {
    startDate: getSixMonthsAgo(),
    endDate: getTodayDate(),
    deliveryRequestNo: '',
    shipmentId: null,
    status: ''
  }
  sortOption.value = 'createdAt,desc'
  reset()
}

// 정렬 변경
const handleSortChange = () => {
  changeSort(sortOption.value)
}

// 페이지 변경 - 리팩토링: useDataTable의 changePage 사용
const handlePageChange = (page: number) => {
  changePage(page)
}

// 페이지 크기 변경 - 리팩토링: useDataTable의 changePageSize 사용
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 운송장 등록 페이지로 이동
const goRegister = () => {
  router.push('/admin/transport/register')
}

// 운송장 수정 페이지로 이동 (현재 페이지 번호를 쿼리로 전달)
const goToEdit = (transportId: number) => {
  router.push({
    path: `/admin/transport/edit/${transportId}`,
    query: { returnPage: String(currentPage.value) }
  })
}

// 메시지 전송 가능 여부 체크
const canSendMessage = (transport: TransportDetail): boolean => {
  return transport.status === 'IN_PROGRESS' && !!transport.driverPhone
}

// 메시지 버튼 title 텍스트
const getMessageButtonTitle = (transport: TransportDetail): string => {
  if (transport.status !== 'IN_PROGRESS') {
    return '진행중 상태일 때만 메시지 전송 가능'
  }
  if (!transport.driverPhone) {
    return '기사 연락처가 등록되지 않았습니다'
  }
  return '기사에게 납품확인 메시지 전송'
}

// 메시지 전송
const sendMessage = async (transport: TransportDetail) => {
  // 첫 번째 confirm만 유지
  const confirmed = confirm(
    `기사에게 메시지를 전송하시겠습니까?\n\n` +
    `기사명: ${transport.driverName || '(미입력)'}\n` +
    `연락처: ${transport.driverPhone}\n` +
    `운송장번호: ${transport.trackingNumber}`
  )

  if (!confirmed) return

  try {
    // deliveryService로 납품 생성 및 토큰 발급
    const result = await deliveryService.createDelivery(transport.transportId)

    console.log('메시지 발송 결과:', result)

    // 결과 모달 표시 (confirm/alert 제거)
    showResultModal.value = true
    resultInfo.value = {
      type: result.messageAlreadySent ? 'duplicate' : 'success',
      mobileUrl: result.mobileUrl,
      tokenExpiresAt: result.tokenExpiresAt,
      messageSentAt: result.messageSentAt
    }
    // search()는 모달 닫을 때 실행
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    alert(`메시지 전송에 실패했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

// 초기 데이터 로드
onMounted(() => {
  // URL 쿼리에서 페이지 번호 복원 (상세 페이지에서 돌아올 때)
  const pageFromQuery = route.query.page || route.query.returnPage
  if (pageFromQuery) {
    const pageNum = parseInt(pageFromQuery as string, 10)
    if (!isNaN(pageNum) && pageNum >= 0) {
      currentPage.value = pageNum
      // 페이지 번호가 있으면 해당 페이지로 데이터 로드 (search()는 페이지를 0으로 리셋함)
      refresh()
      return
    }
  }
  // 페이지 번호가 없으면 첫 페이지부터 검색
  search()
})
</script>

<style scoped>
/*
 * Transport List Page Styles
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리됩니다.
 * address-text 스타일은 admin-tables.css로 이동됨
 */

/* 메시지 버튼 스타일 */
.btn-message-sm {
  padding: 0.375rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.813rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.btn-message-sm:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-message-sm:active:not(:disabled) {
  transform: translateY(0);
}

.btn-message-sm:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-message-sm i {
  font-size: 0.813rem;
}

/* 중복 발송 모달 */
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
  z-index: 9999;
}

/* 메시지 발송 결과 모달 */
.result-modal {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.result-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.result-modal .modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.result-modal .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
}

.result-modal .close-btn:hover {
  color: #374151;
}

.result-modal .modal-body {
  padding: 1.5rem;
}

.result-message {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #374151;
}

.url-info {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
}

.url-info label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.url-box {
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  word-break: break-all;
  color: #1f2937;
}

.info-time {
  margin: 0.75rem 0 0;
  font-size: 0.813rem;
  color: #6b7280;
}

.result-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.result-modal .btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.result-modal .btn-primary:hover {
  background: #2563eb;
}

.result-modal .btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.result-modal .btn-secondary:hover {
  background: #e5e7eb;
}

/* 반응형 - 페이지 특화 스타일만 유지 */
@media (max-width: 1024px) {
  .transport-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1400px; /* 메시지 컬럼 추가로 너비 증가 */
  }
}
</style>