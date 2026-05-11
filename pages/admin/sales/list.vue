<template>
  <div class="sales-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="영업관리"
      description="영업 정보를 조회하고 관리합니다."
      icon="chart"
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
      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 진척도(상태) 다중 선택 -->
          <div class="search-item">
            <label>진척도:</label>
            <select v-model="searchForm.salesStatus" class="status-select">
              <option value="">
                전체
              </option>
              <option v-for="option in salesStatusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- 검색어 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="수요기관, 사업명, 담당자명 검색"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 영업 목록 테이블 -->
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
                <th>수요기관 / 담당자</th>
                <th>사업명</th>
                <th>계약금액</th>
                <th>진척도</th>
                <th>최근활동일</th>
                <th>다음액션</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in salesData" :key="item.id" class="table-row" style="cursor: pointer;" @click="editItem(item.id)">
                <td>{{ startIndex + index }}</td>
                <td>
                  <div class="customer-cell">
                    <span v-if="item.dminsttNm" class="org-name">{{ item.dminsttNm }}</span>
                    <span v-else>-</span>
                    <template v-if="item.customerNm">
                      <span class="contact-separator">/</span>
                      <span class="contact-name">{{ item.customerNm }}</span>
                    </template>
                  </div>
                </td>
                <td>{{ item.salesTitle }}</td>
                <td class="text-right">
                  {{ formatCurrency(item.contractAmount) }}
                </td>
                <td>
                  <span class="progress-badge" :style="{ background: getProgressColor(item.salesStatus) + '20', color: getProgressColor(item.salesStatus) }">
                    {{ item.salesStatus }}
                  </span>
                </td>
                <td>{{ formatDate(item.updatedAt) || formatDate(item.createdAt) }}</td>
                <td class="next-action-cell">
                  -
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 로딩 상태 -->
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin" />
            <p>데이터를 불러오는 중...</p>
          </div>

          <!-- 데이터가 없을 때 -->
          <div v-if="salesData.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-chart-line" />
            <p>등록된 영업 정보가 없습니다.</p>
          </div>
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
import { useRouter } from '#imports'
import { salesService, type Sales, type SalesSearchRequest } from '~/services/sales.service'
import { formatCurrency, formatDate } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { useSalesStatus } from '~/composables/useSalesStatus'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 관리'
})

const router = useRouter()

// 권한
const { canWrite } = usePermission()

// 검색 폼 데이터 (간소화)
const searchForm = ref<SalesSearchRequest>({
  salesStatus: '',
  keyword: ''
})

// DB 기반 상태 관리
const {
  statusOptions: salesStatusOptions,
  getStatusClass,
  getProgressColor,
  loadStatusCodes
} = useSalesStatus()

// useDataTable composable
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
      salesStatus: searchForm.value.salesStatus,
      keyword: searchForm.value.keyword,
      page: params.page || 0,
      size: params.size || 10
    })
    return response
  },
  initialPageSize: 10
})

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
  router.push('/admin/sales/register')
}

// 수정 페이지로 이동
const editItem = (id?: number) => {
  if (id) {
    router.push(`/admin/sales/edit/${id}`)
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  await loadStatusCodes()
  search()
})
</script>

<style scoped>
/* 행 클릭 가능 표시 */
.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f9fafb;
}

/* 수요기관 / 담당자 셀 */
.customer-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.org-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1f2937;
}

.contact-separator {
  color: #9ca3af;
  font-size: 0.8rem;
}

.contact-name {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 진척도 배지 */
.progress-badge {
  display: inline-flex;
  padding: 0.2rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* 다음 액션 셀 */
.next-action-cell {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 반응형 */
@media (max-width: 1024px) {
  .sales-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 800px;
  }
}
</style>
