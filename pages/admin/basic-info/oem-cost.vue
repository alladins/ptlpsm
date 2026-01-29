<template>
  <div class="admin-page-wrapper">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="제조사 원가 관리"
      description="OEM 제조사별 SKU 원가를 관리합니다"
    >
      <template #actions>
        <button class="btn-refresh" @click="handleRefresh">
          <i class="fas fa-sync-alt"></i>
          새로고침
        </button>
      </template>
    </PageHeader>

    <!-- 통계 카드 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <i class="fas fa-won-sign"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">총 원가 설정</div>
          <div class="stat-value">{{ statistics.totalCount.toLocaleString() }}건</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">적용중</div>
          <div class="stat-value">{{ statistics.activeCount.toLocaleString() }}건</div>
        </div>
      </div>

      <div class="stat-card warning-card">
        <div class="stat-icon stat-icon-red">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">원가 미설정 SKU</div>
          <div class="stat-value text-danger">{{ statistics.noOemCostCount.toLocaleString() }}건</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">30일내 만료</div>
          <div class="stat-value">{{ statistics.expiringCount.toLocaleString() }}건</div>
        </div>
      </div>
    </div>

    <!-- 검색 섹션 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>OEM:</label>
          <select v-model="searchForm.oemCompanyId" class="status-select">
            <option :value="undefined">전체</option>
            <option
              v-for="company in oemCompanies"
              :key="company.companyId"
              :value="company.companyId"
            >
              {{ company.companyName }}
            </option>
          </select>
        </div>

        <div class="search-item">
          <label>SKU:</label>
          <input
            type="text"
            v-model="searchForm.keyword"
            class="keyword-input"
            placeholder="SKU코드 또는 SKU명"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="search-item">
          <label>상태:</label>
          <select v-model="searchForm.status" class="status-select">
            <option value="">전체</option>
            <option value="ACTIVE">적용중</option>
            <option value="EXPIRED">만료됨</option>
            <option value="UPCOMING">적용예정</option>
          </select>
        </div>

        <button class="btn-search-inline" @click="handleSearch">
          <i class="fas fa-search"></i> 검색
        </button>
        <button class="btn-reset-inline" @click="handleReset">
          <i class="fas fa-undo"></i> 초기화
        </button>
      </div>
    </div>

    <!-- 뷰 전환 탭 -->
    <div class="tab-navigation-inline">
      <button
        @click="viewMode = 'sku'"
        :class="['tab-button', { active: viewMode === 'sku' }]"
      >
        <i class="fas fa-barcode"></i>
        SKU별 보기
      </button>
      <button
        @click="viewMode = 'oem'"
        :class="['tab-button', { active: viewMode === 'oem' }]"
      >
        <i class="fas fa-industry"></i>
        OEM별 보기
      </button>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>총 {{ totalElements }}건</span>
        </div>
        <div class="table-actions">
          <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
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
              <th style="width: 50px">No</th>
              <th style="width: 120px">SKU코드</th>
              <th style="width: 200px">SKU명</th>
              <th style="width: 120px">OEM 제조사</th>
              <th style="width: 100px" class="text-right">원가</th>
              <th style="width: 100px" class="text-right">납품단가</th>
              <th style="width: 80px" class="text-center">마진율</th>
              <th style="width: 100px">적용기간</th>
              <th style="width: 80px" class="text-center">상태</th>
              <th style="width: 120px" class="text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="10" class="loading-cell">
                <div class="loading-spinner"></div>
                <span>데이터 조회 중...</span>
              </td>
            </tr>
            <tr v-else-if="costList.length === 0">
              <td colspan="10" class="empty-cell">
                <i class="fas fa-inbox"></i>
                <span>데이터가 없습니다.</span>
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="(item, index) in costList"
                :key="item.id || `sku-${item.skuId}`"
                :class="{ 'warning-row': !item.costPrice }"
              >
                <td class="text-center">{{ getRowNumber(index) }}</td>
                <td>{{ item.skuId }}</td>
                <td>{{ item.skuName || item.itemName || '-' }}</td>
                <td>{{ item.oemCompanyName || '-' }}</td>
                <td class="text-right">
                  <span v-if="item.costPrice">{{ formatCurrency(item.costPrice) }}</span>
                  <span v-else class="cost-not-set">
                    <i class="fas fa-exclamation-triangle"></i> 미설정
                  </span>
                </td>
                <td class="text-right">{{ formatCurrency(item.unitPrice) }}</td>
                <td class="text-center">
                  <span
                    v-if="item.marginRate !== null && item.marginRate !== undefined"
                    class="margin-badge"
                    :class="getMarginRateClass(item.marginRate)"
                  >
                    {{ item.marginRate.toFixed(1) }}%
                  </span>
                  <span v-else class="margin-badge margin-none">-</span>
                </td>
                <td>{{ formatDateRange(item) }}</td>
                <td class="text-center">
                  <span
                    v-if="item.status"
                    class="status-badge"
                    :class="getStatusClass(item.status)"
                  >
                    {{ getStatusLabel(item.status) }}
                  </span>
                  <span v-else class="status-badge status-warning">미설정</span>
                </td>
                <td class="action-buttons">
                  <button
                    v-if="item.costPrice"
                    class="btn-edit"
                    @click="openEditModal(item)"
                    title="수정"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    v-else
                    class="btn-add-item"
                    @click="openAddModal(item)"
                    title="등록"
                  >
                    <i class="fas fa-plus"></i>
                  </button>
                  <button
                    v-if="item.id"
                    class="btn-view"
                    @click="openHistoryModal(item)"
                    title="이력"
                  >
                    <i class="fas fa-history"></i>
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 원가 등록/수정 모달 -->
    <OemCostModal
      :is-open="showCostModal"
      :sku-info="selectedSkuInfo"
      :edit-data="selectedCostData"
      @close="closeCostModal"
      @saved="handleCostSaved"
    />

    <!-- 이력 모달 -->
    <OemCostHistoryModal
      :is-open="showHistoryModal"
      :sku-id="historyTarget.skuId"
      :oem-company-id="historyTarget.oemCompanyId"
      :oem-company-name="historyTarget.oemCompanyName"
      :current-cost="historyTarget.currentCost"
      :unit-price="historyTarget.unitPrice"
      @close="closeHistoryModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import PageHeader from '~/components/ui/PageHeader.vue'
import Pagination from '~/components/ui/Pagination.vue'
import OemCostModal from '~/components/admin/oem-cost/OemCostModal.vue'
import OemCostHistoryModal from '~/components/admin/oem-cost/OemCostHistoryModal.vue'
import { oemCostService } from '~/services/oem-cost.service'
import { companyService } from '~/services/company.service'
import {
  OEM_COST_STATUS_LABELS,
  getMarginRateClass as getMarginClass
} from '~/types/oem-cost'
import type {
  OemCostListItem,
  OemCost,
  OemCostStatistics,
  OemCostStatus
} from '~/types/oem-cost'
import type { Company } from '~/types/company'

// 상태
const isLoading = ref(false)
const costList = ref<OemCostListItem[]>([])
const oemCompanies = ref<Company[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const viewMode = ref<'sku' | 'oem'>('sku')

// 통계
const statistics = reactive<OemCostStatistics>({
  totalCount: 0,
  activeCount: 0,
  noOemCostCount: 0,
  expiringCount: 0
})

// 검색 폼
const searchForm = reactive({
  oemCompanyId: undefined as number | undefined,
  keyword: '',
  status: '' as OemCostStatus | ''
})

// 모달 상태
const showCostModal = ref(false)
const selectedSkuInfo = ref<{
  skuId: string
  skuName?: string
  itemName?: string
  unitPrice?: number
} | null>(null)
const selectedCostData = ref<OemCost | null>(null)

const showHistoryModal = ref(false)
const historyTarget = reactive({
  skuId: '',
  oemCompanyId: 0,
  oemCompanyName: '',
  currentCost: null as OemCost | null,
  unitPrice: 0
})

// 데이터 로드
const loadData = async () => {
  try {
    isLoading.value = true
    const response = await oemCostService.getList({
      ...searchForm,
      page: currentPage.value - 1,  // API는 0-indexed
      size: pageSize.value
    })

    costList.value = response.content || []
    totalElements.value = response.totalElements || 0
    totalPages.value = response.totalPages || 0
  } catch (error) {
    console.error('원가 목록 조회 실패:', error)
    costList.value = []
  } finally {
    isLoading.value = false
  }
}

// 통계 로드
const loadStatistics = async () => {
  try {
    const stats = await oemCostService.getStatistics()
    Object.assign(statistics, stats)
  } catch (error) {
    console.error('통계 조회 실패:', error)
  }
}

// OEM 회사 목록 로드
const loadOemCompanies = async () => {
  try {
    const response = await companyService.getCompanies({ size: 1000 })
    oemCompanies.value = response.content || response
  } catch (error) {
    console.error('OEM 회사 목록 조회 실패:', error)
  }
}

// 검색
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 초기화
const handleReset = () => {
  searchForm.oemCompanyId = undefined
  searchForm.keyword = ''
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

// 새로고침
const handleRefresh = () => {
  loadData()
  loadStatistics()
}

// 페이지 변경
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

// 페이지 크기 변경
const handlePageSizeChange = () => {
  currentPage.value = 1
  loadData()
}

// 행 번호
const getRowNumber = (index: number): number => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

// 원가 등록 모달 열기
const openAddModal = (item: OemCostListItem) => {
  selectedSkuInfo.value = {
    skuId: item.skuId,
    skuName: item.skuName,
    itemName: item.itemName,
    unitPrice: item.unitPrice
  }
  selectedCostData.value = null
  showCostModal.value = true
}

// 원가 수정 모달 열기
const openEditModal = (item: OemCostListItem) => {
  selectedSkuInfo.value = {
    skuId: item.skuId,
    skuName: item.skuName,
    itemName: item.itemName,
    unitPrice: item.unitPrice
  }
  selectedCostData.value = item as OemCost
  showCostModal.value = true
}

// 모달 닫기
const closeCostModal = () => {
  showCostModal.value = false
  selectedSkuInfo.value = null
  selectedCostData.value = null
}

// 저장 완료
const handleCostSaved = () => {
  closeCostModal()
  loadData()
  loadStatistics()
}

// 이력 모달 열기
const openHistoryModal = (item: OemCostListItem) => {
  historyTarget.skuId = item.skuId
  historyTarget.oemCompanyId = item.oemCompanyId
  historyTarget.oemCompanyName = item.oemCompanyName || ''
  historyTarget.currentCost = item as OemCost
  historyTarget.unitPrice = item.unitPrice || 0
  showHistoryModal.value = true
}

// 이력 모달 닫기
const closeHistoryModal = () => {
  showHistoryModal.value = false
}

// 포맷팅
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '-'
  return amount.toLocaleString('ko-KR') + '원'
}

const formatDateRange = (item: OemCostListItem): string => {
  if (!item.effectiveDate) return '-'
  const start = item.effectiveDate
  const end = item.expiryDate || '무기한'
  return `${start} ~ ${end}`
}

// 상태
const getStatusLabel = (status: OemCostStatus): string => {
  return OEM_COST_STATUS_LABELS[status] || status
}

const getStatusClass = (status: OemCostStatus): string => {
  switch (status) {
    case 'ACTIVE': return 'status-active'
    case 'EXPIRED': return 'status-expired'
    case 'UPCOMING': return 'status-upcoming'
    default: return ''
  }
}

// 마진율 클래스
const getMarginRateClass = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined) return 'margin-none'
  return getMarginClass(rate)
}

// 초기화
onMounted(() => {
  loadOemCompanies()
  loadData()
  loadStatistics()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

/* 페이지 래퍼 */
.admin-page-wrapper {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 통계 카드 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-icon-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon-red {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.text-danger {
  color: #dc2626;
}

.warning-card {
  border-left: 4px solid #f59e0b;
}

/* 뷰 전환 탭 */
.tab-navigation-inline {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.25rem;
  background: #f3f4f6;
  border-radius: 8px;
  width: fit-content;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #1f2937;
}

.tab-button.active {
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.table-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
}

/* 로딩/빈 상태 */
.loading-cell,
.empty-cell {
  text-align: center;
  padding: 3rem !important;
  color: #9ca3af;
}

.loading-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-cell i {
  font-size: 2rem;
}

/* 경고 행 */
.warning-row {
  background: linear-gradient(90deg, #fef3c7 0%, #ffffff 20%) !important;
  border-left: 4px solid #f59e0b;
}

/* 원가 미설정 */
.cost-not-set {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #dc2626;
  font-weight: 600;
  font-size: 0.875rem;
}

.cost-not-set i {
  color: #f59e0b;
}

/* 마진율 배지 */
.margin-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.margin-high {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #059669;
  border: 1px solid #a7f3d0;
}

.margin-normal {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #0284c7;
  border: 1px solid #93c5fd;
}

.margin-low {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  border: 1px solid #fcd34d;
}

.margin-negative {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

.margin-none {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-expired {
  background: #fee2e2;
  color: #991b1b;
}

.status-upcoming {
  background: #dbeafe;
  color: #1e40af;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 0.375rem;
  justify-content: center;
}

.btn-edit,
.btn-view,
.btn-add-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-view {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-view:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.btn-add-item {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-add-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

/* 새로고침 버튼 */
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #e5e7eb;
}

/* 페이지네이션 */
.pagination-container {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
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
  }
}
</style>
