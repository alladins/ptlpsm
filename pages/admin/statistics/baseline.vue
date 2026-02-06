<template>
  <div class="statistics-baseline">
    <PageHeader
      title="기성통계"
      description="차수별 기성금 현황을 확인합니다."
    />

    <div class="content-section">
      <!-- 검색 영역 -->
      <div class="search-section">
        <div class="search-row">
          <div class="search-item">
            <label>조회연도</label>
            <select v-model="searchParams.year" class="form-select">
              <option :value="undefined">전체</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}년
              </option>
            </select>
          </div>

          <div class="search-item">
            <label>상태</label>
            <select v-model="searchParams.status" class="form-select">
              <option value="">전체</option>
              <option value="REQUESTED">요청</option>
              <option value="APPROVED">승인</option>
              <option value="PAID">지급완료</option>
            </select>
          </div>

          <div class="search-buttons">
            <button class="btn-primary" @click="handleSearch">
              <i class="fas fa-search"></i>
              조회
            </button>
          </div>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        데이터를 불러오는 중...
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
      </div>

      <!-- 통계 내용 -->
      <template v-else>
        <!-- 요약 카드 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon icon-count">
              <i class="fas fa-list-ol"></i>
            </div>
            <div class="stat-content">
              <h3>총 건수</h3>
              <p class="stat-number">{{ formatNumber(statistics.summary.totalCount) }}건</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-amount">
              <i class="fas fa-won-sign"></i>
            </div>
            <div class="stat-content">
              <h3>총 기성금액</h3>
              <p class="stat-number">{{ formatCompactCurrency(statistics.summary.totalAmount) }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-average">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <h3>평균 기성금액</h3>
              <p class="stat-number">{{ formatCompactCurrency(statistics.summary.averageAmount) }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon icon-sequence">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="stat-content">
              <h3>최대 차수</h3>
              <p class="stat-number">{{ statistics.summary.maxSequence }}차</p>
            </div>
          </div>
        </div>

        <!-- 기성 목록 테이블 -->
        <div class="table-section">
          <h2>
            <i class="fas fa-table"></i>
            차수별 기성금 현황
          </h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th>납품요구번호</th>
                  <th>수요기관</th>
                  <th>사업명</th>
                  <th>기성금액</th>
                  <th>상태</th>
                  <th>승인일자</th>
                  <th>생성일자</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="statistics.items.length === 0">
                  <td colspan="8" class="empty-cell">데이터가 없습니다</td>
                </tr>
                <tr v-for="item in statistics.items" :key="`${item.orderId}-${item.sequence}`">
                  <td class="text-center">{{ item.sequence }}차</td>
                  <td>{{ item.deliveryRequestNo }}</td>
                  <td>{{ item.client }}</td>
                  <td class="project-name">{{ item.projectName }}</td>
                  <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                  <td>
                    <span :class="['status-badge', getStatusClass(item.status)]">
                      {{ getStatusLabel(item.status) }}
                    </span>
                  </td>
                  <td class="text-center">{{ item.approvedDate || '-' }}</td>
                  <td class="text-center">{{ formatDate(item.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getBaselineStatistics } from '~/services/statistics.service'
import type {
  BaselineStatisticsRequest,
  BaselineStatisticsResponse
} from '~/types/statistics'

definePageMeta({
  layout: 'admin',
  pageTitle: '기성통계'
})

// 상태
const loading = ref(false)
const error = ref<string | null>(null)

// 사용 가능한 연도 목록 (최근 5년)
const availableYears = ref<number[]>([])
function generateAvailableYears() {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i)
  }
  return years
}

// 검색 조건
const searchParams = reactive<BaselineStatisticsRequest>({
  year: new Date().getFullYear(),
  status: undefined
})

// 통계 데이터
const statistics = ref<BaselineStatisticsResponse>({
  summary: {
    totalCount: 0,
    totalAmount: 0,
    averageAmount: 0,
    maxSequence: 0
  },
  items: []
})

// 데이터 조회
async function loadStatistics() {
  loading.value = true
  error.value = null

  try {
    const data = await getBaselineStatistics(searchParams)
    statistics.value = data
  } catch (err: any) {
    console.error('기성통계 조회 오류:', err)
    error.value = err.message || '기성통계 데이터를 불러오는데 실패했습니다'

    // Mock 데이터로 테스트 (백엔드 연동 전)
    loadMockData()
  } finally {
    loading.value = false
  }
}

// Mock 데이터 (백엔드 연동 전 테스트용)
function loadMockData() {
  statistics.value = {
    summary: {
      totalCount: 15,
      totalAmount: 450000000,
      averageAmount: 30000000,
      maxSequence: 3
    },
    items: [
      {
        sequence: 1,
        orderId: 1,
        deliveryRequestNo: '35-24-3-41787-00',
        client: '한국농어촌공사',
        projectName: '청주내덕초 후관 휴게실 증축',
        amount: 25000000,
        status: 'APPROVED',
        approvedDate: '2024-12-15',
        createdAt: '2024-12-01T09:00:00'
      },
      {
        sequence: 2,
        orderId: 1,
        deliveryRequestNo: '35-24-3-41787-00',
        client: '한국농어촌공사',
        projectName: '청주내덕초 후관 휴게실 증축',
        amount: 30000000,
        status: 'PAID',
        approvedDate: '2024-12-25',
        createdAt: '2024-12-20T10:30:00'
      },
      {
        sequence: 1,
        orderId: 2,
        deliveryRequestNo: '35-24-3-41788-00',
        client: '한국도로공사',
        projectName: '경부고속도로 확장공사',
        amount: 45000000,
        status: 'REQUESTED',
        approvedDate: null,
        createdAt: '2024-11-28T14:20:00'
      },
      {
        sequence: 1,
        orderId: 3,
        deliveryRequestNo: '35-24-3-41789-00',
        client: '한국수자원공사',
        projectName: '부산 하수처리장 증설',
        amount: 32000000,
        status: 'APPROVED',
        approvedDate: '2024-11-30',
        createdAt: '2024-11-25T11:15:00'
      },
      {
        sequence: 2,
        orderId: 3,
        deliveryRequestNo: '35-24-3-41789-00',
        client: '한국수자원공사',
        projectName: '부산 하수처리장 증설',
        amount: 35000000,
        status: 'REQUESTED',
        approvedDate: null,
        createdAt: '2024-12-10T16:45:00'
      }
    ]
  }
  error.value = null
}

// 검색
function handleSearch() {
  loadStatistics()
}

// 포맷 함수들
function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}

function formatCurrency(value: number): string {
  return value.toLocaleString('ko-KR') + '원'
}

function formatCompactCurrency(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(1) + '억원'
  }
  if (value >= 10000000) {
    return (value / 10000000).toFixed(1) + '천만원'
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(0) + '만원'
  }
  return value.toLocaleString('ko-KR') + '원'
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  return dateString.split('T')[0]
}

// 상태 관련
function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    REQUESTED: 'requested',
    APPROVED: 'approved',
    PAID: 'paid'
  }
  return classMap[status] || ''
}

function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    REQUESTED: '요청',
    APPROVED: '승인',
    PAID: '지급완료'
  }
  return labelMap[status] || status
}

// 초기화
onMounted(() => {
  availableYears.value = generateAvailableYears()
  loadStatistics()
})
</script>

<style scoped>
/* 페이지 레이아웃 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 검색 영역 */
.search-section {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
}

.search-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

/* 로딩/에러 상태 */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
}

/* 요약 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.icon-count {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.icon-amount {
  background: linear-gradient(135deg, #10b981, #059669);
}

.icon-average {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.icon-sequence {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

.stat-content h3 {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.375rem 0;
  font-weight: 500;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.table-section h2 i {
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: center;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}

.data-table .text-center {
  text-align: center;
}

.data-table .text-right {
  text-align: right;
}

.project-name {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 상태 뱃지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.requested {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

/* 반응형 */
@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    width: 100%;
  }

  .search-buttons {
    justify-content: flex-end;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .data-table th:nth-child(4),
  .data-table th:nth-child(7),
  .data-table th:nth-child(8),
  .data-table td:nth-child(4),
  .data-table td:nth-child(7),
  .data-table td:nth-child(8) {
    display: none;
  }
}
</style>
