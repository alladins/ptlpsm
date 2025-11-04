<template>
  <div class="order-list">
    <!-- 페이지 헤더 - 리팩토링: UiPageHeader 컴포넌트 사용 -->
    <UiPageHeader
      title="납품요구 관리"
      description="납품요구 정보를 조회하고 관리합니다."
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
      <!-- 통계 요약 카드 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">총 납품요구</div>
            <div class="stat-value">{{ totalElements }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">금일 납품요구</div>
            <div class="stat-value">{{ todayCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <i class="fas fa-won-sign"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">총 납품요구금액</div>
            <div class="stat-value">{{ formatNumber(totalContractAmount) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <i class="fas fa-truck"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">납품요구 예정</div>
            <div class="stat-value">{{ pendingDeliveryCount }}</div>
          </div>
        </div>
      </div>

      <!-- 검색 조건 섹션 - 완전히 한 줄 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 계약일자 -->
          <div class="search-item">
            <label>계약일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 계약번호 -->
          <div class="search-item">
            <label>계약번호:</label>
            <input type="text" v-model="searchForm.contractId" placeholder="계약번호" class="text-input" @keyup.enter="handleSearch">
          </div>

          <!-- 수요기관 -->
          <div class="search-item">
            <label>수요기관:</label>
            <input type="text" v-model="searchForm.client" placeholder="수요기관명" class="text-input" @keyup.enter="handleSearch">
          </div>

          <!-- 정렬 -->
          <div class="search-item">
            <label>정렬:</label>
            <select v-model="searchForm.sort" @change="handleSortChange" class="sort-select">
              <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 검색어 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input type="text" v-model="searchForm.keyword" placeholder="계약번호, 수요기관명, 프로젝트명" class="keyword-input" @keyup.enter="handleSearch">
          </div>
        </div>
      </div>

      <!-- 발주 목록 테이블 -->
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

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>납품요구번호</th>
                <th>납품요구일자</th>
                <th>수요기관</th>
                <th>담당자</th>
                <th>사업명</th>
                <th>총계약금액</th>
                <th>계약번호</th>
                <th>계약일자</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in orderData"
                :key="item.orderId"
                class="table-row"
                @dblclick="editItem(item.orderId)"
              >
                <td>{{ startIndex + index }}</td>
                <td>{{ item.deliveryRequestNo }}</td>
                <td>{{ item.deliveryRequestDate }}</td>
                <td>{{ item.client }}</td>
                <td>{{ item.clientManagerName }}</td>
                <td>{{ item.projectName }}</td>
                <td class="text-right">{{ formatNumber(item.totalAmount) }}</td>
                <td>{{ item.contractId }}</td>
                <td>{{ item.contractDate }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 데이터가 없을 때 - 리팩토링: admin-common.css 스타일 사용 -->
          <div v-if="orderData.length === 0" class="no-data-message">
            <i class="fas fa-shopping-cart"></i>
            <p>등록된 발주 정보가 없습니다.</p>
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { orderService } from '~/services/order.service'
import type { OrderSearchRequest, OrderDetailResponse } from '~/types/order'
// 리팩토링: 공통 모듈 import
import { formatNumber } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요구 관리'
})

const router = useRouter()

// UI 상태 관리
const searchExpanded = ref(true)

// 통계 데이터
const todayCount = ref(0)
const totalContractAmount = ref(0)
const pendingDeliveryCount = ref(0)

// 검색 폼 데이터
const searchForm = ref({
  startDate: '',
  endDate: '',
  contractId: '',
  client: '',
  keyword: '',
  sort: 'createdAt,desc'
})

// 정렬 옵션
const sortOptions = [
  { value: 'contractDate,desc', label: '계약일자 최신순' },
  { value: 'contractDate,asc', label: '계약일자 과거순' },
  { value: 'client,asc', label: '수요기관명 가나다순' },
  { value: 'client,desc', label: '수요기관명 역순' },
  { value: 'totalAmount,desc', label: '총계약금액 높은순' },
  { value: 'totalAmount,asc', label: '총계약금액 낮은순' },
  { value: 'createdAt,desc', label: '등록일시 최신순' },
  { value: 'createdAt,asc', label: '등록일시 과거순' }
]

// 활성 필터 계산
const activeFilters = computed(() => {
  const filters: { key: string; label: string; value: string }[] = []
  if (searchForm.value.startDate || searchForm.value.endDate) {
    filters.push({
      key: 'date',
      label: '계약일자',
      value: `${searchForm.value.startDate || '시작'} ~ ${searchForm.value.endDate || '종료'}`
    })
  }
  if (searchForm.value.contractId) {
    filters.push({
      key: 'contractId',
      label: '계약번호',
      value: searchForm.value.contractId
    })
  }
  if (searchForm.value.client) {
    filters.push({
      key: 'client',
      label: '수요기관',
      value: searchForm.value.client
    })
  }
  if (searchForm.value.keyword) {
    filters.push({
      key: 'keyword',
      label: '검색어',
      value: searchForm.value.keyword
    })
  }
  return filters
})

// 리팩토링: useDataTable composable 사용으로 페이지네이션 로직 통합
const {
  items: orderData,
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
  reset
} = useDataTable<OrderDetailResponse>({
  fetchFunction: async (params) => {
    const response = await orderService.getOrders({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      contractId: searchForm.value.contractId,
      client: searchForm.value.client,
      salesId: 0,
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'createdAt,desc'
    })
    return response
  },
  initialPageSize: 10,
  initialSort: 'createdAt,desc'
})

// 검색 패널 토글
const toggleSearchPanel = () => {
  searchExpanded.value = !searchExpanded.value
}

// 필터 제거
const removeFilter = (key: string) => {
  switch (key) {
    case 'date':
      searchForm.value.startDate = ''
      searchForm.value.endDate = ''
      break
    case 'contractId':
      searchForm.value.contractId = ''
      break
    case 'client':
      searchForm.value.client = ''
      break
    case 'keyword':
      searchForm.value.keyword = ''
      break
  }
  handleSearch()
}

// 검색 기능
const handleSearch = () => {
  search()
}

// 검색 초기화
const handleReset = () => {
  searchForm.value = {
    startDate: '',
    endDate: '',
    contractId: '',
    client: '',
    keyword: '',
    sort: 'createdAt,desc'
  }
  reset()
}

// 정렬 변경
const handleSortChange = () => {
  changeSort(searchForm.value.sort)
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
  router.push('/admin/order/register')
}

// 상세 페이지로 이동
const editItem = (id: number) => {
  router.push(`/admin/order/detail/${id}`)
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  search()
})
</script>

<style scoped>
/*
 * Order List Page Styles
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리됩니다.
 * stats-cards 스타일은 admin-tables.css로 이동됨
 */

/* 페이지 특화: 테이블 섹션 추가 스타일 */
.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 페이지 특화: 테이블 헤더 중앙 정렬 */
.data-table thead th {
  text-align: center;
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

.data-table tbody tr {
  transition: all 0.2s;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: #f0f4ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.data-table tbody td {
  text-align: center;
}

.data-table tbody td.text-right {
  text-align: right;
  font-weight: 600;
  color: #1e40af;
}

/* 반응형 - 페이지 특화 스타일 */
@media (max-width: 1024px) {
  .order-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1000px;
  }
}

@media (max-width: 768px) {
  .filter-chips {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
