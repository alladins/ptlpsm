<template>
  <div class="shipping-list">
    <!-- 페이지 헤더 - 리팩토링: UiPageHeader 컴포넌트 사용 -->
    <PageHeader
      title="출하관리"
      description="출하 정보를 조회하고 관리합니다."
      icon="shipping"
      icon-color="green"
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          검색
        </button>
        <button
          class="btn-action btn-primary"
          @click="goToRegister"
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
          <!-- 출하일자 -->
          <div class="search-item">
            <label>출하일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 납품요구번호 -->
          <div class="search-item">
            <label>납품요구번호:</label>
            <input type="text" v-model="searchForm.deliveryRequestNo" placeholder="납품요구번호 입력 또는 조회" class="text-input">
            <button type="button" class="btn-search-inline" @click="openOrderSelectPopup">
              <i class="fas fa-search"></i>
              조회
            </button>
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="status-select">
              <option value="">전체</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 정렬 -->
          <div class="search-item">
            <label>정렬:</label>
            <select v-model="searchForm.sortOrder" class="status-select">
              <option value="desc">최근 출하순</option>
              <option value="asc">과거 출하순</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 출하 목록 테이블 -->
      <div class="table-section">
        <!-- 테이블 헤더: 리팩토링 - admin-common.css 스타일 사용 -->
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

        <!-- 데이터가 없을 때 - 리팩토링: admin-common.css 스타일 사용 -->
        <div v-else-if="shippingData.length === 0" class="no-data-message">
          <i class="fas fa-truck"></i>
          <p>등록된 출하 정보가 없습니다.</p>
        </div>

        <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>출하NO</th>
              <th>납품요구번호</th>
              <th>납품요구일자</th>
              <th>수요기관</th>
              <th>사업명</th>
              <th>출하일자</th>
              <th>상태</th>
              <th>출하수량</th>
              <th>출하금액</th>
            </tr>
          </thead>          <tbody>
            <tr
              v-for="(item, index) in shippingData"
              :key="item.shipmentId"
              class="table-row"
              @click="editItem(item.shipmentId)"
              style="cursor: pointer;"
            >
              <td>{{ startIndex + index }}</td>
              <td>{{ item.shipmentNo || '-' }}</td>
              <td>{{ item.deliveryRequestNo }}</td>
              <td>{{ formatDate(item.deliveryRequestDate) }}</td>
              <td>{{ item.client }}</td>
              <td class="project-name-cell" :title="item.projectName">{{ item.projectName }}</td>
              <td>{{ formatDate(item.shipmentDate) }}</td>
              <td>
                <span :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="text-right">{{ formatQuantity(item.shipmentQuantity) }}</td>
              <td class="text-right">{{ formatCurrency(item.shipmentAmount) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="shippingData.length > 0">
            <tr>
              <td colspan="8" class="text-right"><strong>총 출하수량</strong></td>
              <td class="text-right"><strong>{{ formatQuantity(totalShippingQuantity) }}</strong></td>
              <td class="text-right"><strong>{{ formatCurrency(totalShippingAmount) }}</strong></td>
            </tr>
          </tfoot>
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
    
    <!-- 발주번호 조회 팝업 -->
    <OrderSelectPopup
      v-if="showOrderSelectPopup"
      :show="showOrderSelectPopup"
      @close="closeOrderSelectPopup"
      @select="handleOrderSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentListItem } from '~/services/shipment.service'
import OrderSelectPopup from '~/components/admin/common/OrderSelectPopup.vue'
import type { OrderDetailResponse } from '~/types/order'
// 리팩토링: 공통 모듈 import
import { formatDate, formatDateTime, formatNumber, formatCurrency, formatQuantity } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 관리'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canWrite } = usePermission()

// 상태 관리 (DB 기반)
const { statusOptions, getStatusLabel, loadStatusCodes } = useCommonStatus()

// 발주번호 조회 팝업 상태
const showOrderSelectPopup = ref(false)

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
  orderId: null as number | null,
  deliveryRequestNo: '',
  status: '',
  sortOrder: 'desc' as 'asc' | 'desc'  // 기본값: 최근 출하순
})

// 리팩토링: useDataTable composable 사용으로 페이지네이션 로직 통합
// 주의: shipmentService는 1-based pagination을 반환하지만 useDataTable은 0-based를 기대
const {
  items: shippingData,
  loading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  startIndex,
  endIndex,
  changePage,
  changePageSize,
  search,
  refresh,
  reset
} = useDataTable<ShipmentListItem>({
  fetchFunction: async (params) => {
    // 0-based pagination 사용
    // 정렬은 백엔드에서 처리 (shipmentDate 기준)
    const response = await shipmentService.getShipments({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      deliveryRequestNo: searchForm.value.deliveryRequestNo,
      orderId: searchForm.value.orderId,
      status: searchForm.value.status,
      page: params.page || 0,
      size: params.size || 10,
      sort: `shipmentDate,${searchForm.value.sortOrder}`
    })

    // shipmentService 응답을 Spring Page 형식으로 변환
    return {
      content: response.content || [],
      number: response.pageNumber !== undefined ? response.pageNumber : 0,
      size: response.pageSize || params.size || 10,
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 0,
      first: (response.pageNumber || 0) === 0,
      last: (response.pageNumber || 0) >= (response.totalPages || 1) - 1,
      empty: (response.content || []).length === 0
    }
  },
  initialPageSize: 10
})

// 상태 텍스트 변환 (DB 기반)
const getStatusText = (status: string): string => {
  return getStatusLabel(status)
}

// 상태별 CSS 클래스 (컨벤션 기반)
const getStatusClass = (status: string): string => {
  const kebabCase = status.toLowerCase().replace(/_/g, '-')
  return `status-${kebabCase}`
}

// 발주번호 조회 팝업 열기/닫기
const openOrderSelectPopup = () => {
  showOrderSelectPopup.value = true
}

const closeOrderSelectPopup = () => {
  showOrderSelectPopup.value = false
}

// 발주 선택 처리
const handleOrderSelect = (order: OrderDetailResponse) => {
  searchForm.value.deliveryRequestNo = order.deliveryRequestNo
  closeOrderSelectPopup()
  search() // 선택 후 바로 검색 실행
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
    orderId: null,
    deliveryRequestNo: '',
    status: '',
    sortOrder: 'desc'
  }
  reset()
}

// 페이지 변경 - 리팩토링: useDataTable의 changePage 사용
const handlePageChange = (page: number) => {
  changePage(page)
}

// 페이지 크기 변경 - 리팩토링: useDataTable의 changePageSize 사용
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 등록 페이지로 이동
const goToRegister = () => {
  router.push('/admin/shipping/register')
}

// 수정 페이지로 이동 (현재 페이지 번호를 쿼리로 전달)
const editItem = (id: number) => {
  router.push({
    path: `/admin/shipping/edit/${id}`,
    query: { returnPage: String(currentPage.value) }
  })
}

// 총 출하수량 계산
const totalShippingQuantity = computed(() => {
  return shippingData.value.reduce((sum, item) => sum + (item.shipmentQuantity || 0), 0)
})

// 총 출하금액 계산
const totalShippingAmount = computed(() => {
  return shippingData.value.reduce((sum, item) => sum + (item.shipmentAmount || 0), 0)
})

// 초기 데이터 로드
onMounted(async () => {
  await loadStatusCodes()  // 상태 코드 로드

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
 * Shipping List Page Styles
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리됩니다.
 */

/* 상태 배지 스타일 (컨벤션 기반 클래스) */
.status-pending {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #fef3c7;
  color: #92400e;
}

.status-in-progress {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #e0e7ff;
  color: #3730a3;
}

.status-completed {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #fee2e2;
  color: #991b1b;
}

.status-pending-signature {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #ffedd5;
  color: #c2410c;
}

/* 사업명 셀 - 왼쪽 정렬 및 말줄임 처리 */
.project-name-cell {
  text-align: left;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 반응형 - 페이지 특화 스타일만 유지 */
@media (max-width: 1024px) {
  .shipping-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1200px;
  }
}
</style>
