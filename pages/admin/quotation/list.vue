<template>
  <div class="quotation-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="견적관리"
      description="견적서를 조회하고 관리합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo" />
          초기화
        </button>
        <button
          class="btn-action btn-primary"
          :disabled="!canWrite"
          :title="!canWrite ? '등록 권한이 없습니다' : ''"
          @click="goToRegister"
        >
          <i class="fas fa-plus" />
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 제출일자 -->
          <div class="search-item">
            <label>제출일자:</label>
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
              <option value="DRAFT">
                작성중
              </option>
              <option value="SUBMITTED">
                제출
              </option>
              <option value="CANCELLED">
                취소
              </option>
            </select>
          </div>

          <!-- 검색어 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="견적번호, 거래처명, 용역명 검색"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="table-section">
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

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>견적번호</th>
                <th>제출일자</th>
                <th>거래처명</th>
                <th>용역명</th>
                <th>합계금액</th>
                <th>상태</th>
                <th>작성자</th>
                <th>발송일시</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in quotationData"
                :key="item.quotationId"
                class="table-row"
                style="cursor: pointer;"
                @click="editItem(item.quotationId)"
              >
                <td>{{ startIndex + index }}</td>
                <td>{{ item.quotationNo }}</td>
                <td>{{ formatDate(item.submitDate) }}</td>
                <td>{{ item.clientName }}</td>
                <td>{{ item.projectName || '-' }}</td>
                <td class="text-right">
                  {{ formatCurrency(item.totalAmount) }}
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td>{{ item.createdByName || '-' }}</td>
                <td>{{ item.sentAt ? formatDateTime(item.sentAt) : '-' }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin" />
            <p>데이터를 불러오는 중...</p>
          </div>

          <div v-if="quotationData.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-file-invoice" />
            <p>등록된 견적서가 없습니다.</p>
          </div>
        </div>

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
import { useRouter } from '#imports'
import { quotationService, type QuotationSearchRequest } from '~/services/quotation.service'
import { formatCurrency, formatDate, formatDateTime } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  layout: 'admin',
  pageTitle: '견적관리'
})

const router = useRouter()
const { canWrite } = usePermission()

// 검색 폼
const searchForm = ref<QuotationSearchRequest>({
  startDate: '',
  endDate: '',
  status: '',
  keyword: ''
})

// 상태 표시
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: '작성중',
    SUBMITTED: '제출',
    CANCELLED: '취소'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'status-draft',
    SUBMITTED: 'status-completed',
    CANCELLED: 'status-cancelled'
  }
  return classes[status] || ''
}

// useDataTable
const {
  items: quotationData,
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
} = useDataTable({
  fetchFunction: async (params) => {
    const response = await quotationService.getQuotationList({
      startDate: searchForm.value.startDate || undefined,
      endDate: searchForm.value.endDate || undefined,
      status: searchForm.value.status || undefined,
      keyword: searchForm.value.keyword || undefined,
      page: params.page || 0,
      size: params.size || 10
    })
    return response
  },
  initialPageSize: 10
})

const handleSearch = () => search()

const handleReset = () => {
  searchForm.value = { startDate: '', endDate: '', status: '', keyword: '' }
  reset()
}

const handlePageChange = (page: number) => changePage(page)
const handlePageSizeChange = () => changePageSize(pageSize.value)

const goToRegister = () => router.push('/admin/quotation/register')
const editItem = (id: number) => router.push(`/admin/quotation/edit/${id}`)

onMounted(() => {
  search()
})
</script>

<style scoped>
.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.table-row:hover {
  background-color: #f9fafb;
}
.text-right {
  text-align: right;
}
.status-draft {
  background-color: #fef3c7;
  color: #92400e;
}
.status-completed {
  background-color: #d1fae5;
  color: #065f46;
}
.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}
</style>
