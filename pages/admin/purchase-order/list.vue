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
        <button v-if="activeTab === 'list'" class="btn-action" @click="handleSearch" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          검색
        </button>
        <button
          v-if="activeTab === 'list'"
          class="btn-action btn-primary"
          @click="goToRegister"
        >
          <i class="fas fa-plus"></i>
          발주서 등록
        </button>
        <button
          v-if="activeTab === 'oem-payment'"
          class="btn-action btn-primary"
          @click="showPaymentModal = true"
        >
          <i class="fas fa-plus"></i>
          지급 등록
        </button>
      </template>
    </PageHeader>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'list' }"
        @click="activeTab = 'list'"
      >
        <i class="fas fa-file-alt"></i>
        <span>발주서 목록</span>
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'oem-payment' }"
        @click="switchToOemPaymentTab"
      >
        <i class="fas fa-money-bill-wave"></i>
        <span>OEM 지급 현황</span>
      </button>
    </div>

    <!-- 탭 1: 발주서 목록 (기존) -->
    <div v-if="activeTab === 'list'" class="content-section">
      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 발주일자 기간 -->
          <div class="search-item">
            <label>발주일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="status-select">
              <option value="">전체</option>
              <option v-for="(label, key) in PO_STATUS_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>

          <!-- OEM 제조사 -->
          <div class="search-item">
            <label>OEM 제조사:</label>
            <select v-model="searchForm.oemCompanyId" class="status-select">
              <option :value="null">전체</option>
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
              type="text"
              v-model="searchForm.keyword"
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

        <!-- 데이터 없음 -->
        <div v-else-if="poList.length === 0" class="no-data-message">
          <i class="fas fa-file-alt"></i>
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
                @click="goToDetail(item.poId)"
                style="cursor: pointer;"
              >
                <td>{{ startIndex + index }}</td>
                <td>{{ item.poNo || '-' }}</td>
                <td class="text-left">{{ item.oemCompanyName || '-' }}</td>
                <td>{{ formatDate(item.orderDate) }}</td>
                <td>{{ formatDate(item.expectedCompletionDate) }}</td>
                <td>
                  <span :class="getStatusBadgeClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="text-right">{{ formatQuantity(item.totalQuantity) }} ㎡</td>
                <td class="text-right">{{ formatCurrency(item.totalAmount) }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>{{ item.createdBy || '-' }}</td>
              </tr>
            </tbody>
            <tfoot v-if="poList.length > 0">
              <tr>
                <td colspan="6" class="text-right"><strong>합계</strong></td>
                <td class="text-right"><strong>{{ formatQuantity(totalQuantitySum) }} ㎡</strong></td>
                <td class="text-right"><strong>{{ formatCurrency(totalAmountSum) }}</strong></td>
                <td colspan="2"></td>
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

    <!-- 탭 2: OEM 지급 현황 (신규) -->
    <div v-if="activeTab === 'oem-payment'" class="content-section">
      <!-- 필터 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>기간:</label>
            <input type="date" v-model="paymentFilter.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="paymentFilter.endDate" class="date-input">
          </div>
          <div class="search-item">
            <label>OEM 제조사:</label>
            <select v-model="paymentFilter.oemCompanyId" class="status-select">
              <option :value="null">전체</option>
              <option
                v-for="company in oemCompanies"
                :key="company.id"
                :value="company.id"
              >
                {{ company.companyName }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <button class="btn-action" @click="loadPaymentData" :disabled="paymentLoading">
              <i v-if="paymentLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-search"></i>
              검색
            </button>
          </div>
        </div>
      </div>

      <!-- OEM별 요약 카드 -->
      <div v-if="oemSummaries.length > 0" class="oem-summary-cards">
        <div
          v-for="summary in oemSummaries"
          :key="summary.oemCompanyId"
          class="oem-summary-card"
        >
          <div class="card-header">
            <i class="fas fa-industry"></i>
            <span class="company-name">{{ summary.oemCompanyName }}</span>
            <span class="company-badge">OEM</span>
          </div>
          <div class="card-body">
            <div class="card-row">
              <span class="label">발주 총액</span>
              <span class="value">{{ formatCurrency(summary.totalPoAmount) }}</span>
            </div>
            <div class="card-row">
              <span class="label">지급 총액</span>
              <span class="value success">{{ formatCurrency(summary.totalPaidAmount) }}</span>
            </div>
            <div class="card-row">
              <span class="label">미지급액</span>
              <span class="value warning">{{ formatCurrency(summary.unpaidAmount) }}</span>
            </div>
            <div class="card-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getPaymentRate(summary) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ getPaymentRate(summary).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 지급 내역 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ paymentTotalElements }}건</span>
          </div>
          <div class="table-actions">
            <select v-model="paymentPageSize" @change="handlePaymentPageSizeChange" class="page-size-select">
              <option :value="10">10개씩</option>
              <option :value="20">20개씩</option>
              <option :value="50">50개씩</option>
            </select>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="paymentLoading" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 데이터 없음 -->
        <div v-else-if="paymentList.length === 0" class="no-data-message">
          <i class="fas fa-money-bill-wave"></i>
          <p>지급 내역이 없습니다.</p>
        </div>

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>발주서번호</th>
                <th>OEM 제조사</th>
                <th class="text-right">지급금액</th>
                <th>지급일</th>
                <th>비고</th>
                <th>생성자</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paymentList" :key="item.paymentId">
                <td>{{ paymentStartIndex + index }}</td>
                <td>{{ item.poNo || '-' }}</td>
                <td class="text-left">{{ item.oemCompanyName || '-' }}</td>
                <td class="text-right cell-amount">{{ formatCurrency(item.paymentAmount) }}</td>
                <td>{{ item.paymentDate || '-' }}</td>
                <td class="text-left cell-remarks">{{ item.remarks || '-' }}</td>
                <td>{{ item.createdBy || '-' }}</td>
                <td>
                  <button
                    class="btn-delete-small"
                    @click="handleDeletePayment(item)"
                    title="삭제"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="paymentList.length > 0">
              <tr>
                <td colspan="3" class="text-right"><strong>합계</strong></td>
                <td class="text-right"><strong>{{ formatCurrency(paymentAmountSum) }}</strong></td>
                <td colspan="4"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <Pagination
          v-if="paymentTotalPages > 0"
          :current-page="paymentCurrentPage"
          :total-pages="paymentTotalPages"
          :disabled="paymentLoading"
          @change="handlePaymentPageChange"
        />
      </div>
    </div>

    <!-- OEM 지급 등록 모달 -->
    <OemPaymentRegisterModal
      :is-open="showPaymentModal"
      @close="showPaymentModal = false"
      @submitted="handlePaymentSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 발주서 관리 페이지
 * - 탭 1: 발주서 목록 (기존)
 * - 탭 2: OEM 지급 현황 (신규)
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { purchaseOrderService } from '~/services/purchase-order.service'
import { paymentService } from '~/services/payment.service'
import { companyService } from '~/services/company.service'
import type { PurchaseOrderListItem, PurchaseOrderStatus } from '~/types/purchase-order'
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '~/types/purchase-order'
import type { Payment, PaymentSummary } from '~/types/payment'
import type { CompanyInfoResponse } from '~/types/company'
import { formatDate, formatCurrency, formatQuantity } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import OemPaymentRegisterModal from '~/components/purchase-order/OemPaymentRegisterModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '발주서 관리'
})

const router = useRouter()
const route = useRoute()

// 탭 상태
const activeTab = ref<'list' | 'oem-payment'>('list')

// OEM 제조사 목록
const oemCompanies = ref<CompanyInfoResponse[]>([])

// OEM 지급 등록 모달
const showPaymentModal = ref(false)

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

// === 탭 2: OEM 지급 현황 ===

const paymentLoading = ref(false)
const paymentList = ref<Payment[]>([])
const oemSummaries = ref<PaymentSummary[]>([])
const paymentCurrentPage = ref(1)
const paymentTotalPages = ref(0)
const paymentTotalElements = ref(0)
const paymentPageSize = ref(20)
const oemPaymentLoaded = ref(false)

// 지급 필터
const paymentFilter = ref({
  startDate: '',
  endDate: '',
  oemCompanyId: null as number | null
})

// 지급 시작 인덱스
const paymentStartIndex = computed(() => {
  return (paymentCurrentPage.value - 1) * paymentPageSize.value + 1
})

// 지급 금액 합계
const paymentAmountSum = computed(() => {
  return paymentList.value.reduce((sum, item) => sum + (item.paymentAmount || 0), 0)
})

// OEM 지급률 계산
const getPaymentRate = (summary: PaymentSummary): number => {
  if (!summary.totalPoAmount || summary.totalPoAmount === 0) return 0
  return Math.min(100, (summary.totalPaidAmount / summary.totalPoAmount) * 100)
}

// OEM 지급 탭으로 전환
function switchToOemPaymentTab() {
  activeTab.value = 'oem-payment'
  if (!oemPaymentLoaded.value) {
    loadPaymentData()
  }
}

// 지급 데이터 로드
async function loadPaymentData() {
  paymentLoading.value = true
  try {
    // OEM 요약 조회
    oemSummaries.value = await paymentService.getPaymentSummaryByOem()

    // 지급 목록 조회
    const response = await paymentService.getPaymentList({
      page: paymentCurrentPage.value - 1,
      size: paymentPageSize.value,
      oemCompanyId: paymentFilter.value.oemCompanyId ?? undefined,
      startDate: paymentFilter.value.startDate || undefined,
      endDate: paymentFilter.value.endDate || undefined
    })

    paymentList.value = response.content || []
    paymentTotalElements.value = response.totalElements || 0
    paymentTotalPages.value = response.totalPages || 0
    oemPaymentLoaded.value = true
  } catch (error) {
    console.error('OEM 지급 데이터 로드 실패:', error)
  } finally {
    paymentLoading.value = false
  }
}

// 지급 페이지 변경
function handlePaymentPageChange(page: number) {
  paymentCurrentPage.value = page
  loadPaymentData()
}

// 지급 페이지 크기 변경
function handlePaymentPageSizeChange() {
  paymentCurrentPage.value = 1
  loadPaymentData()
}

// 지급 삭제
async function handleDeletePayment(payment: Payment) {
  if (!confirm(`[${payment.poNo}] ${formatCurrency(payment.paymentAmount)} 지급을 삭제하시겠습니까?`)) return

  try {
    await paymentService.deletePayment(payment.paymentId)
    alert('삭제되었습니다.')
    await loadPaymentData()
  } catch (error) {
    console.error('지급 삭제 실패:', error)
    alert(error instanceof Error ? error.message : '삭제에 실패했습니다.')
  }
}

// 지급 등록 완료 후
function handlePaymentSubmitted() {
  loadPaymentData()
}

// URL 쿼리로 탭 전환 지원
watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'oem-payment') {
      switchToOemPaymentTab()
    }
  },
  { immediate: true }
)

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

/* 탭 네비게이션 */
.tab-navigation {
  display: flex;
  background: white;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  position: relative;
}

.tab-button:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.02);
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: white;
  font-weight: 600;
}

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

/* OEM 요약 카드 */
.oem-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.oem-summary-card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.oem-summary-card .card-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
}

.oem-summary-card .card-header i {
  font-size: 1rem;
  opacity: 0.9;
}

.oem-summary-card .company-name {
  font-size: 1rem;
  font-weight: 700;
  flex: 1;
  letter-spacing: 0.02em;
  color: #ffffff;
}

.oem-summary-card .company-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.oem-summary-card .card-body {
  padding: 0.75rem 1rem;
}

.oem-summary-card .card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.oem-summary-card .card-row .label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.oem-summary-card .card-row .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
}

.oem-summary-card .card-row .value.success {
  color: #059669;
}

.oem-summary-card .card-row .value.warning {
  color: #dc2626;
}

.oem-summary-card .card-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  min-width: 45px;
  text-align: right;
}

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

  .oem-summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
