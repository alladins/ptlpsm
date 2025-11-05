<template>
  <div class="shipping-list">
    <!-- 페이지 헤더 - 리팩토링: UiPageHeader 컴포넌트 사용 -->
    <UiPageHeader
      title="출하 관리"
      description="출하 정보를 조회하고 관리합니다."
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
        <button class="btn-action btn-primary" @click="goToRegister">
          <i class="fas fa-plus"></i>
          등록
        </button>
      </template>
    </UiPageHeader>

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
            <input type="text" v-model="searchForm.deliveryRequestNo" placeholder="납품요구번호 선택" class="text-input" readonly>
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

          <!-- 출하ID -->
          <div class="search-item search-keyword">
            <label>출하ID:</label>
            <input type="number" v-model.number="searchForm.shipmentId" placeholder="출하ID 입력" class="keyword-input" @keyup.enter="handleSearch">
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
              <th>출하ID</th>
              <th>계약일자</th>
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
              @dblclick="editItem(item.shipmentId)"
              style="cursor: pointer;"
            >
              <td>{{ startIndex + index }}</td>
              <td>{{ item.shipmentId }}</td>
              <td>{{ formatDate(item.contractDate) }}</td>
              <td>{{ formatDate(item.deliveryRequestDate) }}</td>
              <td>{{ item.client }}</td>
              <td>{{ item.projectName }}</td>
              <td>{{ formatDate(item.shipmentDate) }}</td>
              <td>
                <span :class="getStatusClass(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="text-right">{{ formatNumber(item.shipmentQuantity) }}</td>
              <td class="text-right">{{ formatCurrency(item.shipmentAmount) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="shippingData.length > 0">
            <tr>
              <td colspan="8" class="text-right"><strong>총 출하수량</strong></td>
              <td class="text-right"><strong>{{ formatNumber(totalShippingQuantity) }}</strong></td>
              <td class="text-right"><strong>{{ formatCurrency(totalShippingAmount) }}</strong></td>
            </tr>
          </tfoot>
          </table>
        </div>

        <!-- 페이지네이션 - 리팩토링: UiPagination 컴포넌트 사용 -->
        <UiPagination
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
import { useRouter } from '#imports'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentListItem } from '~/services/shipment.service'
import OrderSelectPopup from '~/components/admin/common/OrderSelectPopup.vue'
import type { OrderDetailResponse } from '~/types/order'
// 리팩토링: 공통 모듈 import
import { formatDate, formatDateTime, formatNumber, formatCurrency } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { useCommonStatus } from '~/composables/useCommonStatus'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 관리'
})

const router = useRouter()

// 상태 관리 (DB 기반)
const { statusOptions, getStatusLabel } = useCommonStatus()

// 발주번호 조회 팝업 상태
const showOrderSelectPopup = ref(false)

// 3개월 전 날짜 계산 (페이지 특화 함수)
const getThreeMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  return date.toISOString().split('T')[0]
}

// 검색 폼 데이터
const searchForm = ref({
  startDate: getThreeMonthsAgo(),
  endDate: new Date().toISOString().split('T')[0],
  orderId: null as number | null,
  deliveryRequestNo: '',
  shipmentId: null as number | null,
  status: ''
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
  reset
} = useDataTable<ShipmentListItem>({
  fetchFunction: async (params) => {
    // shipmentService는 1-based page를 기대함
    const response = await shipmentService.getShipments({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      deliveryRequestNo: searchForm.value.deliveryRequestNo,
      orderId: searchForm.value.orderId,
      status: searchForm.value.status,
      page: (params.page || 0) + 1, // 0-based → 1-based 변환
      size: params.size || 10
    })

    // shipmentService 응답을 Spring Page 형식으로 변환
    return {
      content: response.content || [],
      number: response.pageNumber !== undefined ? response.pageNumber : 0, // 1-based → 0-based
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
    startDate: getThreeMonthsAgo(),
    endDate: new Date().toISOString().split('T')[0],
    orderId: null,
    deliveryRequestNo: '',
    shipmentId: null,
    status: ''
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

// 수정 페이지로 이동
const editItem = (id: number) => {
  router.push(`/admin/shipping/edit/${id}`)
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
onMounted(() => {
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
