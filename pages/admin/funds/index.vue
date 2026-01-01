<template>
  <div class="fund-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="기성청구"
      description="납품요구별 기성 현황(선급금/기성금/잔금)을 조회하고 관리합니다."
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
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 요약 카드 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">총 계약금액</div>
            <div class="stat-value">{{ formatCurrency(summaryData.totalContractAmount) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
            <i class="fas fa-coins"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">수금 누계</div>
            <div class="stat-value">{{ formatCurrency(summaryData.totalCollected) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">미수금</div>
            <div class="stat-value text-danger">{{ formatCurrency(summaryData.totalOutstanding) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <i class="fas fa-truck"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">OEM 지급액</div>
            <div class="stat-value">{{ formatCurrency(summaryData.totalOemPaid) }}</div>
          </div>
        </div>
      </div>

      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 납품요구번호 -->
          <div class="search-item">
            <label>납품요구번호:</label>
            <input
              type="text"
              v-model="searchForm.deliveryRequestNo"
              placeholder="납품요구번호"
              class="text-input"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- 현장명 -->
          <div class="search-item">
            <label>현장명:</label>
            <input
              type="text"
              v-model="searchForm.projectName"
              placeholder="현장명/사업명"
              class="text-input"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="select-input">
              <option value="">전체</option>
              <option value="ACTIVE">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 자금 목록 테이블 -->
      <div class="table-section">
        <!-- 테이블 헤더 -->
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
                <th>현장명</th>
                <th>선급금</th>
                <th>기성금 누계</th>
                <th>잔금</th>
                <th>수금률</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in fundList"
                :key="item.fundId"
                class="table-row"
              >
                <td>{{ startIndex + index }}</td>
                <td>{{ item.deliveryRequestNo }}</td>
                <td>{{ item.projectName || item.siteName }}</td>
                <td class="text-right">{{ formatCurrency(item.advancePaymentAmount || item.advancePayment) }}</td>
                <td class="text-right">{{ formatCurrency(item.progressPaymentTotal) }}</td>
                <td class="text-right">{{ formatCurrency(item.balancePayment || item.balanceAmount) }}</td>
                <td class="text-center">
                  <div class="progress-cell">
                    <div class="progress-bar-mini">
                      <div
                        class="progress-fill"
                        :style="{ width: getCollectionRate(item) + '%' }"
                        :class="getProgressClass(getCollectionRate(item))"
                      ></div>
                    </div>
                    <span class="progress-text">{{ getCollectionRate(item).toFixed(1) }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="action-buttons">
                  <button class="btn-view" @click="goToDetail(item.fundId)" title="상세보기">
                    <i class="fas fa-eye"></i>
                    <span>상세</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 데이터가 없을 때 -->
          <div v-if="fundList.length === 0" class="no-data-message">
            <i class="fas fa-folder-open"></i>
            <p>등록된 자금 정보가 없습니다.</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useFundStore } from '~/stores/fund'
import { fundService } from '~/services/fund.service'
import { formatCurrency } from '~/utils/format'
import type { FundListItem, FundStatus, FundStatistics } from '~/types/fund'
import { FUND_STATUS_LABELS } from '~/types/fund'

definePageMeta({
  layout: 'admin',
  pageTitle: '자금 관리'
})

const router = useRouter()
const fundStore = useFundStore()

// 검색 조건
const searchForm = ref({
  deliveryRequestNo: '',
  projectName: '',
  status: '' as FundStatus | ''
})

// 페이지네이션
const pageSize = ref(10)

// 요약 데이터 (통계 API에서 로드)
const summaryData = ref<Partial<FundStatistics>>({
  totalFundCount: 0,
  totalContractAmount: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  totalOemPaid: 0,
  activeCount: 0,
  completedCount: 0
})

// Computed
const fundList = computed(() => fundStore.list)
const loading = computed(() => fundStore.loading)
const totalElements = computed(() => fundStore.pagination.total)
const totalPages = computed(() => fundStore.pagination.totalPages)
const currentPage = computed(() => fundStore.pagination.page)

const startIndex = computed(() => {
  if (totalElements.value === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const endIndex = computed(() => {
  const end = currentPage.value * pageSize.value
  return Math.min(end, totalElements.value)
})

// Methods
const handleSearch = async () => {
  await fundStore.fetchList({
    deliveryRequestNo: searchForm.value.deliveryRequestNo || undefined,
    projectName: searchForm.value.projectName || undefined,
    status: searchForm.value.status || undefined,
    page: 0,
    size: pageSize.value
  })
}

const handleReset = () => {
  searchForm.value = {
    deliveryRequestNo: '',
    projectName: '',
    status: ''
  }
  handleSearch()
}

const handlePageChange = async (page: number) => {
  // page는 Pagination 컴포넌트에서 이미 0-based로 전달됨
  await fundStore.fetchList({
    deliveryRequestNo: searchForm.value.deliveryRequestNo || undefined,
    projectName: searchForm.value.projectName || undefined,
    status: searchForm.value.status || undefined,
    page: page,
    size: pageSize.value
  })
}

const handlePageSizeChange = () => {
  handleSearch()
}

const goToDetail = (fundId: number) => {
  router.push(`/admin/funds/${fundId}`)
}

/**
 * 수금률 계산
 */
const getCollectionRate = (item: FundListItem): number => {
  const contractAmount = item.totalContractAmount || item.contractTotalAmount || 0
  if (contractAmount <= 0) return 0
  const collected = (item.advancePaymentAmount || item.advancePayment || 0) +
                    (item.progressPaymentTotal || 0) +
                    (item.balanceAmount || item.balancePayment || 0)
  return (collected / contractAmount) * 100
}

/**
 * 진행률에 따른 CSS 클래스
 */
const getProgressClass = (rate: number): string => {
  if (rate >= 100) return 'progress-complete'
  if (rate >= 70) return 'progress-high'
  if (rate >= 40) return 'progress-medium'
  return 'progress-low'
}

/**
 * 상태 배지 클래스
 */
const getStatusClass = (status?: FundStatus): string => {
  if (!status) return ''
  switch (status) {
    case 'ACTIVE':
      return 'status-in-progress'
    case 'COMPLETED':
      return 'status-completed'
    case 'CANCELLED':
      return 'status-cancelled'
    default:
      return ''
  }
}

/**
 * 상태 라벨
 */
const getStatusLabel = (status?: FundStatus): string => {
  if (!status) return '-'
  return FUND_STATUS_LABELS[status] || status
}

/**
 * 통계 데이터 로드 (API 호출)
 */
const loadStatistics = async () => {
  try {
    const currentYear = new Date().getFullYear()
    const stats = await fundService.getStatistics({ year: currentYear })

    if (stats) {
      summaryData.value = {
        totalFundCount: stats.totalFundCount || 0,
        totalContractAmount: stats.totalContractAmount || 0,
        totalCollected: stats.totalCollected || 0,
        totalOutstanding: stats.totalOutstanding || 0,
        totalOemPaid: stats.totalOemPaid || 0,
        activeCount: stats.activeCount || 0,
        completedCount: stats.completedCount || 0
      }
    }
  } catch (error) {
    console.error('통계 데이터 로드 실패:', error)
  }
}

// 초기 데이터 로드
onMounted(async () => {
  await Promise.all([
    handleSearch(),
    loadStatistics()
  ])
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

/* 페이지 특화 스타일 */
.fund-list {
  padding: 0;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 요약 카드 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: white;
  font-size: 1.25rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.text-danger {
  color: #dc2626;
}

.stat-value.text-success {
  color: #059669;
}

/* 검색 섹션 */
.search-section-compact {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.text-input,
.select-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 150px;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.table-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.page-size-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 0.6rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 0.6rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.table-row {
  transition: background-color 0.2s;
}

.table-row:hover {
  background: #f0f4ff;
}

.text-right {
  text-align: right !important;
  font-weight: 500;
}

.text-center {
  text-align: center !important;
}

/* 진행률 셀 */
.progress-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.progress-bar-mini {
  width: 60px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-low {
  background: #fbbf24;
}

.progress-medium {
  background: #3b82f6;
}

.progress-high {
  background: #10b981;
}

.progress-complete {
  background: #059669;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-in-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-view {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-view:hover {
  background: #059669;
}

/* 로딩/빈 상태 */
.loading-message,
.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-message i,
.no-data-message i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* 반응형 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .search-row-single {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    flex-direction: column;
    align-items: stretch;
  }

  .text-input,
  .select-input {
    width: 100%;
  }
}
</style>
