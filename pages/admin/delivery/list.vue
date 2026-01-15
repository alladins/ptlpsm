<template>
  <div class="delivery-tree-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품확인"
      description="발주별 납품 현황을 트리 구조로 확인합니다."
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch">
          <i class="fas fa-search"></i>
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
      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 납품요구일자 -->
          <div class="search-item">
            <label>납품요구일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 납품요구번호 (NEW) -->
          <div class="search-item">
            <label>납품요구번호:</label>
            <input
              type="text"
              v-model="searchForm.deliveryRequestNo"
              placeholder="납품요구번호 검색"
              class="text-input"
            >
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="condition-select">
              <option value="">전체</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 트리 구조 섹션 -->
      <div class="tree-section">
        <div class="tree-header">
          <div class="tree-info">
            <span>총 {{ totalElements }}개 발주 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="tree-actions">
            <select v-model.number="pageSize" @change="handlePageSizeChange" class="page-size-select">
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

        <!-- 데이터가 없을 때 -->
        <div v-else-if="orderList.length === 0" class="no-data-message">
          <i class="fas fa-clipboard-check"></i>
          <p>등록된 발주 정보가 없습니다.</p>
        </div>

        <!-- 트리 컨테이너 -->
        <div v-else class="tree-container">
          <DeliveryOrderTreeNode
            v-for="order in orderList"
            :key="order.orderId"
            :order="order"
            :level="0"
            :default-expanded="false"
          />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { deliveryService } from '~/services/delivery.service'
import { useDataTable } from '~/composables/useDataTable'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { usePermission } from '~/composables/usePermission'
import type { OrderTreeNode } from '~/types/delivery'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품현황 관리'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canWrite } = usePermission()

// 상태 관리 (DB 기반)
const { statusOptions } = useCommonStatus()

// 오늘 날짜 (로컬 시간 기준 - UTC 시간대 문제 해결)
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 3개월 전 날짜 계산 (로컬 시간 기준)
const getThreeMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 검색 폼 (기본값: 최근 3개월)
const searchForm = ref({
  startDate: getThreeMonthsAgo(),
  endDate: getTodayDate(),
  deliveryRequestNo: '', // NEW field
  status: ''
})

// useDataTable composable 사용 (트리 구조 API)
const {
  items: orderList,
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
} = useDataTable<OrderTreeNode>({
  fetchFunction: async (params) => {
    const response = await deliveryService.getDeliveryTree({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      deliveryRequestNo: searchForm.value.deliveryRequestNo,
      status: searchForm.value.status,
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'delivery_request_date,desc'
    })
    return response
  },
  initialPageSize: 10,
  initialSort: 'delivery_request_date,desc'
})

// 검색
const handleSearch = () => {
  search()
}

// 초기화
const handleReset = () => {
  searchForm.value = {
    startDate: getThreeMonthsAgo(),
    endDate: getTodayDate(),
    deliveryRequestNo: '',
    status: ''
  }
  reset()
}

// 등록 페이지로 이동 (현재 페이지 번호를 쿼리로 전달)
const goToRegister = () => {
  router.push({
    path: '/admin/delivery/register',
    query: { returnPage: String(currentPage.value) }
  })
}

// 페이지 변경
const handlePageChange = (page: number) => {
  changePage(page)
}

// 페이지 크기 변경
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 초기 데이터 로드
onMounted(() => {
  // URL 쿼리에서 페이지 번호 복원 (등록 페이지에서 돌아올 때)
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
 * Delivery Tree List Page Styles
 * 트리 구조 특화 스타일
 */

.delivery-tree-list {
  padding: 1.5rem;
}

.content-section {
  margin-top: 1.5rem;
}

/* 검색 섹션 */
.search-section-compact {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.search-row-single {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.date-input,
.text-input,
.condition-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.text-input {
  width: 200px;
}

.date-input {
  width: 140px;
}

.separator {
  color: #9ca3af;
  margin: 0 0.25rem;
}

/* 트리 섹션 */
.tree-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.tree-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.page-size-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

/* 트리 컨테이너 */
.tree-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

/* 로딩/빈 데이터 메시지 */
.loading-message,
.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-message i,
.no-data-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-message p,
.no-data-message p {
  font-size: 0.875rem;
  margin: 0;
}

/* 반응형 */
@media (max-width: 1024px) {
  .delivery-tree-list {
    padding: 1rem;
  }

  .search-row-single {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .text-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .tree-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
