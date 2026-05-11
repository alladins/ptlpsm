<template>
  <div class="purchase-order-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="발주서 관리"
      description="OEM 제조사에 대한 발주서를 관리합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button
          class="btn-action btn-primary"
          @click="goToRegister"
        >
          <i class="fas fa-plus" />
          발주서 등록
        </button>
      </template>
    </PageHeader>

    <!-- 발주서 목록 -->
    <div class="content-section">
      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 발주일자 기간 -->
          <div class="search-item">
            <label>발주일자:</label>
            <input v-model="searchForm.startDate" type="date" class="date-input">
            <span class="separator">~</span>
            <input v-model="searchForm.endDate" type="date" class="date-input">
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="status-select">
              <option value="">
                전체
              </option>
              <option v-for="(label, key) in PO_STATUS_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <!-- OEM 제조사 -->
          <div class="search-item">
            <label>OEM 제조사:</label>
            <select v-model="searchForm.oemCompanyId" class="status-select">
              <option :value="null">
                전체
              </option>
              <option
                v-for="company in oemCompanies"
                :key="company.id"
                :value="company.id"
              >
                {{ company.companyName }}
              </option>
            </select>
          </div>

          <!-- 검색어 -->
          <div class="search-item">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="발주서번호, OEM명"
              class="text-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 발주서 목록 테이블 -->
      <div class="table-section">
        <!-- 테이블 헤더 -->
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
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

        <!-- 데이터 없음 -->
        <div v-else-if="poList.length === 0" class="no-data-message">
          <i class="fas fa-file-alt" />
          <p>등록된 발주서가 없습니다.</p>
        </div>

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>발주서번호</th>
                <th>OEM 제조사</th>
                <th>발주일</th>
                <th>납기예정일</th>
                <th>상태</th>
                <th>총 수량</th>
                <th>총 금액</th>
                <th>생성일</th>
                <th>생성자</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in poList"
                :key="item.poId"
                class="table-row"
                style="cursor: pointer;"
                @click="goToDetail(item.poId)"
              >
                <td>{{ startIndex + index }}</td>
                <td>{{ item.poNo || '-' }}</td>
                <td class="text-left">
                  {{ item.oemCompanyName || '-' }}
                </td>
                <td>{{ formatDate(item.orderDate) }}</td>
                <td>{{ formatDate(item.expectedCompletionDate) }}</td>
                <td>
                  <span :class="getStatusBadgeClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="text-right">
                  {{ formatQuantity(item.totalQuantity) }} ㎡
                </td>
                <td class="text-right">
                  {{ formatCurrency(item.totalAmount) }}
                </td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>{{ item.createdBy || '-' }}</td>
              </tr>
            </tbody>
            <tfoot v-if="poList.length > 0">
              <tr>
                <td colspan="6" class="text-right">
                  <strong>합계</strong>
                </td>
                <td class="text-right">
                  <strong>{{ formatQuantity(totalQuantitySum) }} ㎡</strong>
                </td>
                <td class="text-right">
                  <strong>{{ formatCurrency(totalAmountSum) }}</strong>
                </td>
                <td colspan="2" />
              </tr>
            </tfoot>
          </table>
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
/**
 * 발주서 관리 페이지
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { purchaseOrderService } from '~/services/purchase-order.service'
import { companyService } from '~/services/company.service'
import type { PurchaseOrderListItem, PurchaseOrderStatus } from '~/types/purchase-order'
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '~/types/purchase-order'
import type { CompanyInfoResponse } from '~/types/company'
import { formatDate, formatCurrency, formatQuantity } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '발주서 관리'
})

const router = useRouter()
const route = useRoute()

// OEM 제조사 목록
const oemCompanies = ref<CompanyInfoResponse[]>([])

// === 탭 1: 발주서 목록 ===

// 오늘 날짜 (로컬 시간 기준)
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 6개월 전 날짜
const getSixMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 1개월 후 날짜
const getOneMonthLater = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 검색 폼
const searchForm = ref({
  startDate: getSixMonthsAgo(),
  endDate: getOneMonthLater(),
  status: '' as PurchaseOrderStatus | '',
  oemCompanyId: null as number | null,
  keyword: ''
})

// useDataTable composable 사용
const {
  items: poList,
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
} = useDataTable<PurchaseOrderListItem>({
  fetchFunction: async (params) => {
    const response = await purchaseOrderService.getPurchaseOrderList({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      status: searchForm.value.status || undefined,
      oemCompanyId: searchForm.value.oemCompanyId,
      keyword: searchForm.value.keyword || undefined,
      page: params.page || 0,
      size: params.size || 10,
      sort: 'orderDate,desc'
    })

    // Spring Page 형식으로 변환
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

// 상태 라벨 변환
const getStatusLabel = (status: PurchaseOrderStatus): string => {
  return PO_STATUS_LABELS[status] || status
}

// 상태 배지 CSS 클래스
const getStatusBadgeClass = (status: PurchaseOrderStatus): string => {
  const colorClass = PO_STATUS_COLORS[status] || ''
  return `status-badge ${colorClass}`
}

// 상태 필터 변경 시 자동 검색
watch(
  () => searchForm.value.status,
  () => { search() }
)

// OEM 제조사 필터 변경 시 자동 검색
watch(
  () => searchForm.value.oemCompanyId,
  () => { search() }
)

// 검색
const handleSearch = () => {
  search()
}

// 페이지 변경
const handlePageChange = (page: number) => {
  changePage(page)
}

// 페이지 크기 변경
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 등록 페이지로 이동
const goToRegister = () => {
  router.push('/admin/purchase-order/register')
}

// 상세 페이지로 이동
const goToDetail = (poId: number) => {
  router.push({
    path: `/admin/purchase-order/detail/${poId}`,
    query: { returnPage: String(currentPage.value) }
  })
}

// 총 수량 합계
const totalQuantitySum = computed(() => {
  return poList.value.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
})

// 총 금액 합계
const totalAmountSum = computed(() => {
  return poList.value.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
})

// 초기 데이터 로드
onMounted(async () => {
  // OEM 제조사 목록 로드
  try {
    oemCompanies.value = await companyService.getManufacturers()
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
  }

  // 발주서 목록 검색
  search()
})
</script>

<style scoped>
/*
 * 발주서 목록 페이지 스타일
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리
 */

/* 상태 배지 기본 스타일 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 상태 색상 */
.status-badge.bg-gray-100 { background-color: #f3f4f6; }
.status-badge.text-gray-700 { color: #374151; }
.status-badge.bg-blue-100 { background-color: #dbeafe; }
.status-badge.text-blue-700 { color: #1d4ed8; }
.status-badge.bg-yellow-100 { background-color: #fef3c7; }
.status-badge.text-yellow-700 { color: #b45309; }
.status-badge.bg-green-100 { background-color: #d1fae5; }
.status-badge.text-green-700 { color: #047857; }
.status-badge.bg-teal-100 { background-color: #ccfbf1; }
.status-badge.text-teal-700 { color: #0f766e; }
.status-badge.bg-red-100 { background-color: #fee2e2; }
.status-badge.text-red-700 { color: #b91c1c; }
.status-badge.bg-purple-100 { background-color: #ede9fe; }
.status-badge.text-purple-700 { color: #6d28d9; }

/* 금액 셀 */
.cell-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}

/* 비고 셀 */
.cell-remarks {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 삭제 버튼 */
.btn-delete-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-small:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

/* 반응형 */
@media (max-width: 1024px) {
  .purchase-order-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1000px;
  }

}
</style>
