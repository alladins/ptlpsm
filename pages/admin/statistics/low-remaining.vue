<template>
  <div class="low-remaining-page">
    <PageHeader
      title="사업종료 직전인 납품요구현황"
      description="남은수량이 적은 순으로 납품요구를 나열합니다. 임계값을 입력하면 그 이하만 조회됩니다. (완료 제외)"
      icon="chart"
      icon-color="orange"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          조회
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 요약 카드 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <i class="fas fa-hourglass-half" />
          </div>
          <div class="stat-content">
            <h3>사업종료 직전 사업</h3>
            <p>{{ formatNumber(totalElements) }}건</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <i class="fas fa-ruler-combined" />
          </div>
          <div class="stat-content">
            <h3>임계값</h3>
            <p>{{ appliedThreshold ? formatNumber(appliedThreshold) + ' ㎡ 이하' : '전체' }}</p>
          </div>
        </div>
      </div>

      <!-- 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>남은수량 임계값(㎡):</label>
            <input
              v-model="searchForm.threshold"
              type="number"
              min="0"
              step="50"
              placeholder="전체"
              class="text-input threshold-input"
              @keyup.enter="handleSearch"
            >
          </div>
          <div class="search-item">
            <label>수요기관:</label>
            <input v-model="searchForm.client" type="text" placeholder="수요기관명" class="text-input" @keyup.enter="handleSearch">
          </div>
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input v-model="searchForm.keyword" type="text" placeholder="사업명, 담당자명" class="keyword-input" @keyup.enter="handleSearch">
          </div>
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="text-input" @change="handleSearch">
              <option value="">
                전체
              </option>
              <option v-for="(label, code) in ORDER_STATUS_LABELS" :key="code" :value="code">
                {{ label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 목록 -->
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

        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>데이터를 불러오는 중...</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px;">
                  No
                </th>
                <th style="width: 200px;">
                  납품요구번호
                </th>
                <th style="width: 130px;">
                  수요기관
                </th>
                <th style="min-width: 200px;">
                  사업명
                </th>
                <th style="width: 70px;">
                  상태
                </th>
                <th style="width: 100px;">
                  총수량(㎡)
                </th>
                <th style="width: 100px;">
                  남은수량(㎡)
                </th>
                <th style="width: 120px;">
                  총 계약금액
                </th>
                <th style="width: 120px;">
                  수금된금액
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in orderData"
                :key="row.orderId"
                class="table-row"
                @click="goToOrder(row.orderId)"
              >
                <td>{{ startIndex + index }}</td>
                <td class="text-left">
                  {{ row.deliveryRequestNo }}
                </td>
                <td class="text-left cell-ellipsis">
                  {{ row.client }}
                </td>
                <td class="text-left cell-ellipsis">
                  {{ row.projectName }}
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </span>
                </td>
                <td class="text-right">
                  {{ formatNumber(row.totalQuantity) }}
                </td>
                <td class="text-right remaining-cell">
                  {{ formatNumber(row.remainingQuantity) }}
                </td>
                <td class="text-right">
                  {{ formatNumber(row.itemTotalAmount) }}
                </td>
                <td class="text-right">
                  {{ formatNumber(row.collectedAmount) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="orderData.length === 0" class="no-data-message">
            <i class="fas fa-hourglass-half" />
            <p>출하 임박 사업이 없습니다.</p>
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
import { orderService } from '~/services/order.service'
import type { LowRemainingOrder } from '~/types/order'
import { ORDER_STATUS_LABELS } from '~/types/order'
import { formatNumber } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 임박 사업 현황'
})

const router = useRouter()

const searchForm = ref({
  threshold: '' as number | string, // 기본 없음(전체) — 입력 시 그 값 이하만 조회
  client: '',
  keyword: '',
  status: ''
})

// 마지막으로 실제 조회에 적용된 임계값(요약 카드 표시용). 0 이면 전체
const appliedThreshold = ref(0)

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
  search
} = useDataTable<LowRemainingOrder>({
  fetchFunction: async (params) => {
    // 임계값 미입력(빈값)·0 이하 → 전체 조회(상한 없음). 입력 시 그 값 이하만.
    const raw = Number(searchForm.value.threshold)
    const threshold = Number.isFinite(raw) && raw > 0 ? raw : undefined
    appliedThreshold.value = threshold ?? 0
    return await orderService.getLowRemainingOrders({
      threshold,
      client: searchForm.value.client,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      page: params.page || 0,
      size: params.size || 10
    })
  },
  initialPageSize: 10
})

const handleSearch = () => {
  search()
}

const handlePageChange = (page: number) => {
  changePage(page)
}

const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

const goToOrder = (orderId: number) => {
  router.push(`/admin/order/edit/${orderId}`)
}

// 상태 헬퍼 (납품요구 목록과 동일 규칙)
const getStatusClass = (status?: string): string => {
  switch (status) {
    case 'PENDING': return 'status-pending'
    case 'IN_PROGRESS': return 'status-in-progress'
    case 'PENDING_SIGNATURE': return 'status-pending-signature'
    case 'COMPLETED': return 'status-completed'
    default: return 'status-pending'
  }
}

const getStatusLabel = (status?: string): string => {
  return (status && ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]) || '대기'
}

onMounted(() => {
  search()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.threshold-input {
  width: 110px;
}

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
}

.data-table tbody td {
  text-align: center;
}

.data-table tbody td.text-left {
  text-align: left;
}

.data-table tbody td.text-right {
  text-align: right;
  font-weight: 600;
  color: #1e40af;
}

/* 남은수량 강조 (임박 의미) */
.remaining-cell {
  color: #c2410c !important;
}

.cell-ellipsis {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending { background: #f3f4f6; color: #6b7280; }
.status-in-progress { background: #dbeafe; color: #1d4ed8; }
.status-pending-signature { background: #fef3c7; color: #d97706; }
.status-completed { background: #d1fae5; color: #059669; }
</style>
