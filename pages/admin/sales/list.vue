<template>
  <div class="sales-list">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="영업 관리"
      description="영업 정보를 조회하고 관리합니다."
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
          <!-- 예상납품요구일 -->
          <div class="search-item">
            <label>예상납품요구일:</label>
            <input type="date" v-model="searchForm.expectedDeliveryDateFrom" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.expectedDeliveryDateTo" class="date-input">
          </div>

          <!-- 예상납품기한 -->
          <div class="search-item">
            <label>예상납품기한:</label>
            <input type="date" v-model="searchForm.expectedDeliveryDeadlineFrom" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.expectedDeliveryDeadlineTo" class="date-input">
          </div>

          <!-- 영업상태 -->
          <div class="search-item">
            <label>영업상태:</label>
            <select v-model="searchForm.salesStatus" class="status-select">
              <option value="">전체</option>
              <option v-for="option in salesStatusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 검색어 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input
              type="text"
              v-model="searchForm.keyword"
              placeholder="고객명, 영업제목, 영업내용 검색"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 영업 목록 테이블 -->
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

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>고객명</th>
                <th>수요기관</th>
                <th>영업제목</th>
                <th>계약금액</th>
                <th>영업상태</th>
                <th>예상납품요구일</th>
                <th>예상납품기한</th>
                <!-- <th>사용여부</th> -->
                <!-- <th>관리</th> -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in salesData" :key="item.id" class="table-row" @dblclick="viewItem(item.id)">
                <td>{{ startIndex + index }}</td>
                <td>{{ item.customerNm }}</td>
                <td>
                  <span v-if="item.dminsttNm" class="organization-info">
                    <div class="organization-name">{{ item.dminsttNm }}</div>
                    <div class="organization-code">({{ item.dminsttCd }})</div>
                  </span>
                  <span v-else>-</span>
                </td>
                <td>{{ item.salesTitle }}</td>
                <td>{{ formatCurrency(item.contractAmount) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.salesStatus)">
                    {{ item.salesStatus }}
                  </span>
                </td>
                <td>{{ formatDate(item.expectedDeliveryDate) }}</td>
                <td>{{ formatDate(item.expectedDeliveryDeadline) }}</td>
                <!-- <td>
                  <span class="use-badge" :class="item.useYn === 'Y' ? 'use-yes' : 'use-no'">
                    {{ item.useYn === 'Y' ? '사용' : '미사용' }}
                  </span>
                </td> -->
                <!-- <td class="action-buttons">
                  <button class="btn-view" @click="viewItem(item.id)" title="상세보기">
                    <i class="fas fa-eye"></i>
                    <span>상세</span>
                  </button>
                  <button class="btn-edit" @click="editItem(item.id)" title="수정">
                    <i class="fas fa-edit"></i>
                    <span>수정</span>
                  </button>
                  <button class="btn-delete" @click="deleteItem(item.id)" title="삭제">
                    <i class="fas fa-trash"></i>
                    <span>삭제</span>
                  </button>
                </td> -->
              </tr>
            </tbody>
          </table>

          <!-- 로딩 상태 -->
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>데이터를 불러오는 중...</p>
          </div>

          <!-- 데이터가 없을 때 - 리팩토링: admin-common.css 스타일 사용 -->
          <div v-if="salesData.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-chart-line"></i>
            <p>등록된 영업 정보가 없습니다.</p>
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
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import { salesService, type Sales, type SalesSearchRequest } from '~/services/sales.service'
// 리팩토링: 공통 모듈 import
import { formatCurrency, formatDate } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 관리'
})

const router = useRouter()

// 검색 폼 데이터
const searchForm = ref<SalesSearchRequest>({
  expectedDeliveryDateFrom: '',
  expectedDeliveryDateTo: '',
  expectedDeliveryDeadlineFrom: '',
  expectedDeliveryDeadlineTo: '',
  salesStatus: '',
  keyword: ''
})

// 옵션 데이터
const salesStatusOptions = salesService.getSalesStatusOptions()

// 리팩토링: useDataTable composable 사용으로 페이지네이션 로직 통합
const {
  items: salesData,
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
} = useDataTable<Sales>({
  fetchFunction: async (params) => {
    const response = await salesService.getSalesList({
      expectedDeliveryDateFrom: searchForm.value.expectedDeliveryDateFrom,
      expectedDeliveryDateTo: searchForm.value.expectedDeliveryDateTo,
      expectedDeliveryDeadlineFrom: searchForm.value.expectedDeliveryDeadlineFrom,
      expectedDeliveryDeadlineTo: searchForm.value.expectedDeliveryDeadlineTo,
      salesStatus: searchForm.value.salesStatus,
      keyword: searchForm.value.keyword,
      page: params.page || 0,
      size: params.size || 10
    })
    return response
  },
  initialPageSize: 10
})

// 영업상태별 클래스 (페이지 특화 로직)
const getStatusClass = (status: string) => {
  switch (status) {
    case '진행중':
      return 'status-in-progress'
    case '완료':
      return 'status-complete'
    case '취소':
      return 'status-cancelled'
    case '보류':
      return 'status-pending'
    default:
      return 'status-default'
  }
}

// 검색 기능
const handleSearch = () => {
  search()
}

// 검색 초기화
const handleReset = () => {
  searchForm.value = {
    expectedDeliveryDateFrom: '',
    expectedDeliveryDateTo: '',
    expectedDeliveryDeadlineFrom: '',
    expectedDeliveryDeadlineTo: '',
    salesStatus: '',
    keyword: ''
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
  router.push('/admin/sales/register')
}

// 상세 페이지로 이동
const viewItem = (id?: number) => {
  if (id) {
    router.push(`/admin/sales/detail/${id}`)
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  search()
})
</script>

<style scoped>
/*
 * Sales List Page Styles
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리됩니다.
 * organization-info 스타일은 admin-tables.css로 이동됨
 */

/* 반응형 - 페이지 특화 스타일만 유지 */
@media (max-width: 1024px) {
  .sales-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1000px;
  }
}
</style>
