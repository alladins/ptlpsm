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
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action" :disabled="exporting" @click="handleExportExcel">
          <i v-if="exporting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-file-excel" />
          엑셀
        </button>
        <button
          class="btn-action btn-primary"
          :disabled="!canWrite"
          :title="!canWrite ? '등록 권한이 없습니다' : ''"
          @click="goRegister"
        >
          <i class="fas fa-plus" />
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
            <input v-model="searchForm.startDate" type="date" class="date-input">
            <span class="separator">~</span>
            <input v-model="searchForm.endDate" type="date" class="date-input">
          </div>

          <!-- 납품요구번호 -->
          <div class="search-item">
            <label>납품요구번호:</label>
            <input v-model="searchForm.deliveryRequestNo" type="text" placeholder="납품요구번호" class="text-input" readonly>
            <button type="button" class="btn-search-inline" @click="openOrderSelectPopup">
              <i class="fas fa-search" />
              조회
            </button>
          </div>

          <!-- 검색어 (수요기관·사업명·출하NO 통합) -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input v-model="searchForm.keyword" type="text" placeholder="수요기관, 사업명, 출하NO" class="keyword-input" @keyup.enter="handleSearch">
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="keyword-input" style="width: 110px; min-width: 110px;">
              <option value="">
                전체
              </option>
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
            <select v-model="sortOption" class="page-size-select" style="margin-right: 8px;" @change="handleSortChange">
              <option value="createdAt,desc">
                생성일자 ↓
              </option>
              <option value="createdAt,asc">
                생성일자 ↑
              </option>
              <option value="deliveryDate,desc">
                배송예정일 ↓
              </option>
              <option value="deliveryDate,asc">
                배송예정일 ↑
              </option>
            </select>
            <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
              <option :value="10">
                10개씩
              </option>
              <option :value="20">
                20개씩
              </option>
              <option :value="50">
                50개씩
              </option>
            </select>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 데이터가 없을 때 - 리팩토링: admin-common.css 스타일 사용 -->
        <div v-else-if="transportList.length === 0" class="no-data-message">
          <i class="fas fa-truck" />
          <p>등록된 운송장 정보가 없습니다.</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>출하NO</th>
                <th>납품요구번호</th>
                <th>사업명</th>
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
              <tr v-for="(item, index) in transportList" :key="item.transportId" class="table-row" style="cursor: pointer;" @click="goToEdit(item.transportId)">
                <td>{{ startIndex + index }}</td>
                <td>{{ item.shipmentNo || '-' }}</td>
                <td>{{ item.deliveryRequestNo }}</td>
                <td>
                  <span class="project-name-text" :title="item.projectName">
                    {{ item.projectName || '-' }}
                  </span>
                </td>
                <td>
                  <span class="address-text">
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
                    :disabled="!canSendMessage(item)"
                    :title="getMessageButtonTitle(item)"
                    @click.stop="sendMessage(item)"
                  >
                    <i class="fas fa-comment-dots" />
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
    <MessageResultModal
      :show="showResultModal"
      :result-info="resultInfo"
      @close="closeResultModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import type { TransportDetail } from '~/services/transport.service'
import { deliveryService } from '~/services/delivery.service'
import type { OrderDetailResponse } from '~/types/order'
import MessageResultModal from '~/components/admin/transport/MessageResultModal.vue'
import type { MessageResultInfo } from '~/components/admin/transport/MessageResultModal.vue'
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
const resultInfo = ref<MessageResultInfo | null>(null)

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

// 1개월 후 날짜 계산 (로컬 시간 기준)
const getOneMonthLater = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 검색 폼 데이터 (등록일자 기본값: 과거 6개월 ~ 미래 1개월)
const searchForm = ref({
  startDate: getSixMonthsAgo(),
  endDate: getOneMonthLater(),
  deliveryRequestNo: '',
  keyword: '',
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
      keyword: searchForm.value.keyword,
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
  search() // 목록 새로고침
}

// 발주 선택 처리
const handleOrderSelect = (order: OrderDetailResponse) => {
  searchForm.value.deliveryRequestNo = order.deliveryRequestNo
  closeOrderSelectPopup()
  search()
}

// 상태 필터 변경 시 자동 검색
watch(
  () => searchForm.value.status,
  () => {
    search()
  }
)

// 검색 기능
const handleSearch = () => {
  search()
}

// 엑셀 다운로드 (현재 검색 조건 기준 전체 행)
const exporting = ref(false)
const handleExportExcel = async () => {
  if (exporting.value) { return }
  try {
    exporting.value = true
    const blob = await transportService.exportExcel({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      deliveryRequestNo: searchForm.value.deliveryRequestNo,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `운송목록_${getTodayDate()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  } finally {
    exporting.value = false
  }
}

// 검색 초기화
const handleReset = () => {
  searchForm.value = {
    startDate: getSixMonthsAgo(),
    endDate: getOneMonthLater(),
    deliveryRequestNo: '',
    shipmentNo: '',
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
    '기사에게 메시지를 전송하시겠습니까?\n\n' +
    `기사명: ${transport.driverName || '(미입력)'}\n` +
    `연락처: ${transport.driverPhone}\n` +
    `운송장번호: ${transport.trackingNumber}`
  )

  if (!confirmed) { return }

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

/* 사업명 truncate */
.project-name-text {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

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
