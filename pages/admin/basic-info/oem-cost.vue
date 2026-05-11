<template>
  <div class="admin-page-wrapper">
    <!-- 페이지 헤더 - 컴팩트 -->
    <div class="page-header-compact">
      <h1>원가 관리</h1>
      <span class="page-description">OEM 제조사별 / 본사 SKU 원가를 관리합니다</span>
      <div class="header-actions-right">
        <button v-if="isSkuFiltered" class="btn-back" @click="clearSkuFilter">
          <i class="fas fa-arrow-left" />
          전체 목록 보기
        </button>
        <button class="btn-refresh" @click="handleRefresh">
          <i class="fas fa-sync-alt" />
          새로고침
        </button>
      </div>
    </div>

    <!-- SKU 필터 배너 (품목관리에서 진입 시) -->
    <div v-if="isSkuFiltered && skuDetailInfo" class="sku-context-banner">
      <div class="sku-banner-content">
        <div class="sku-banner-icon">
          <i class="fas fa-barcode" />
        </div>
        <div class="sku-banner-info">
          <div class="sku-banner-label">
            선택된 SKU
          </div>
          <div class="sku-banner-title">
            <span class="sku-code">{{ searchForm.skuId }}</span>
            <span v-if="skuDetailInfo.skuName" class="sku-name">{{ skuDetailInfo.skuName }}</span>
          </div>
          <div v-if="skuDetailInfo.unitPrice" class="sku-banner-price">
            납품단가: <strong>{{ formatCurrency(skuDetailInfo.unitPrice) }}</strong>
          </div>
        </div>
        <div class="sku-banner-stats">
          <div class="sku-stat">
            <span class="sku-stat-value">{{ skuDetailInfo.oemCount }}</span>
            <span class="sku-stat-label">등록된 OEM 원가</span>
          </div>
        </div>
      </div>
      <button class="sku-banner-close" title="필터 해제" @click="clearSkuFilter">
        <i class="fas fa-times" />
      </button>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <i class="fas fa-won-sign" />
        </div>
        <div class="stat-content">
          <div class="stat-label">
            총 원가 설정
          </div>
          <div class="stat-value">
            {{ statistics.totalCount.toLocaleString() }}건
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <i class="fas fa-check-circle" />
        </div>
        <div class="stat-content">
          <div class="stat-label">
            적용중
          </div>
          <div class="stat-value">
            {{ statistics.activeCount.toLocaleString() }}건
          </div>
        </div>
      </div>

      <div class="stat-card warning-card">
        <div class="stat-icon stat-icon-red">
          <i class="fas fa-exclamation-triangle" />
        </div>
        <div class="stat-content">
          <div class="stat-label">
            원가 미설정 SKU
          </div>
          <div class="stat-value text-danger">
            {{ statistics.noOemCostCount.toLocaleString() }}건
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <i class="fas fa-clock" />
        </div>
        <div class="stat-content">
          <div class="stat-label">
            30일내 만료
          </div>
          <div class="stat-value">
            {{ statistics.expiringCount.toLocaleString() }}건
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 섹션 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>유형:</label>
          <select v-model="searchForm.costSourceType" class="status-select" @change="handleSearch">
            <option value="">
              전체
            </option>
            <option value="OEM">
              제조사(OEM)
            </option>
            <option value="LEADPOWER">
              본사
            </option>
          </select>
        </div>

        <div class="search-item">
          <label>OEM:</label>
          <select v-model="searchForm.oemCompanyId" class="status-select">
            <option :value="undefined">
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

        <div class="search-item">
          <label>SKU:</label>
          <input
            v-model="searchForm.skuId"
            type="text"
            class="keyword-input"
            placeholder="SKU코드"
            @keyup.enter="handleSearch"
          >
        </div>

        <div class="search-item">
          <label>SKU명:</label>
          <input
            v-model="searchForm.keyword"
            type="text"
            class="keyword-input"
            placeholder="SKU명 검색"
            @keyup.enter="handleSearch"
          >
        </div>

        <button class="btn-search-inline" @click="handleSearch">
          <i class="fas fa-search" /> 검색
        </button>
        <button class="btn-reset-inline" @click="handleReset">
          <i class="fas fa-undo" /> 초기화
        </button>
      </div>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>총 {{ totalElements }}개 SKU</span>
        </div>
        <div class="table-actions">
          <button class="btn-expand-all" title="모두 펼치기" @click="expandAll">
            <i class="fas fa-expand-alt" /> 모두 펼치기
          </button>
          <button class="btn-collapse-all" title="모두 접기" @click="collapseAll">
            <i class="fas fa-compress-alt" /> 모두 접기
          </button>
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
        <table class="data-table tree-table">
          <thead>
            <tr>
              <th style="width: 40px" />
              <th style="width: 120px">
                SKU코드
              </th>
              <th style="width: 200px">
                SKU명 / OEM 제조사
              </th>
              <th style="width: 100px" class="text-right">
                원가
              </th>
              <th style="width: 100px" class="text-right">
                납품단가
              </th>
              <th style="width: 80px" class="text-center">
                마진율
              </th>
              <th style="width: 120px">
                적용기간
              </th>
              <th style="width: 70px" class="text-center">
                상태
              </th>
              <th style="width: 160px" class="text-center">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="9">
                <div class="loading-cell">
                  <div class="loading-spinner" />
                  <span>데이터 조회 중...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="treeList.length === 0">
              <td colspan="9">
                <div class="empty-cell">
                  <i class="fas fa-inbox" />
                  <span>데이터가 없습니다.</span>
                </div>
              </td>
            </tr>
            <template v-else>
              <template v-for="sku in treeList" :key="sku.skuId">
                <!-- 부모 행: SKU -->
                <tr class="sku-parent-row" @click="toggleExpand(sku.skuId)">
                  <td class="expand-cell">
                    <i
                      class="fas fa-chevron-right expand-icon"
                      :class="{ expanded: expandedSkuIds.has(sku.skuId) }"
                    />
                  </td>
                  <td class="sku-id-cell">
                    {{ sku.skuId }}
                  </td>
                  <td>
                    <span class="sku-name-text">{{ sku.skuName || sku.itemName || '-' }}</span>
                  </td>
                  <td class="text-right">
                    -
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(sku.unitPrice) }}
                  </td>
                  <td class="text-center">
                    -
                  </td>
                  <td>-</td>
                  <td class="text-center">
                    <span class="oem-count-badge">{{ sku.oemCount }}개</span>
                  </td>
                  <td class="action-buttons">
                    <button
                      class="btn-icon btn-add-oem"
                      title="OEM 원가 추가"
                      @click.stop="openAddOemModal(sku)"
                    >
                      <i class="fas fa-plus-circle" />
                    </button>
                    <button
                      class="btn-icon btn-view"
                      title="이력"
                      @click.stop="openSkuHistoryModal(sku)"
                    >
                      <i class="fas fa-history" />
                    </button>
                  </td>
                </tr>
                <!-- 자식 행: OEM 원가 (펼침 시) -->
                <template v-if="expandedSkuIds.has(sku.skuId)">
                  <tr
                    v-for="oem in sku.oemCosts"
                    :key="oem.id"
                    class="oem-child-row"
                  >
                    <td />
                    <td class="oem-indent-cell">
                      <span class="oem-branch-line" />
                    </td>
                    <td>
                      <span class="oem-company-name">
                        <i :class="['oem-icon', oem.costSourceType === 'LEADPOWER' ? 'fas fa-building' : 'fas fa-industry']" />
                        {{ oem.oemCompanyName || '-' }}
                        <span v-if="oem.costSourceType === 'LEADPOWER'" class="source-badge source-leadpower">본사</span>
                        <span v-else class="source-badge source-oem">OEM</span>
                      </span>
                    </td>
                    <td class="text-right">
                      <span v-if="oem.costPrice" class="cost-value">{{ formatCurrency(oem.costPrice) }}</span>
                      <span v-else class="cost-not-set">
                        <i class="fas fa-exclamation-triangle" /> 미설정
                      </span>
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(oem.unitPrice) }}
                    </td>
                    <td class="text-center">
                      <span
                        v-if="getMarginRate(oem) !== null"
                        class="margin-badge"
                        :class="getMarginRateClass(getMarginRate(oem))"
                      >
                        {{ getMarginRate(oem)!.toFixed(1) }}%
                      </span>
                      <span v-else class="margin-badge margin-none">-</span>
                    </td>
                    <td>{{ formatDateRange(oem) }}</td>
                    <td class="text-center">
                      <span
                        v-if="getOemStatus(oem)"
                        class="status-badge"
                        :class="getStatusClass(getOemStatus(oem)!)"
                      >
                        {{ getStatusLabel(getOemStatus(oem)!) }}
                      </span>
                    </td>
                    <td class="action-buttons">
                      <button
                        class="btn-icon btn-edit"
                        title="수정"
                        @click="openEditModal(oem)"
                      >
                        <i class="fas fa-edit" />
                      </button>
                      <button
                        class="btn-icon btn-view"
                        title="이력"
                        @click="openHistoryModal(oem)"
                      >
                        <i class="fas fa-history" />
                      </button>
                    </td>
                  </tr>
                  <!-- OEM 원가가 없는 경우 -->
                  <tr v-if="sku.oemCosts.length === 0" class="oem-child-row oem-empty-row">
                    <td />
                    <td colspan="8" class="oem-empty-cell">
                      <i class="fas fa-info-circle" />
                      등록된 OEM 원가가 없습니다.
                    </td>
                  </tr>
                </template>
              </template>
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
      :existing-oem-company-ids="existingOemCompanyIds"
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

    <!-- 재계산 모달 -->
    <OemCostRecalcModal
      :is-open="showRecalcModal"
      :sku-id="recalcContext.skuId"
      :oem-company-id="recalcContext.oemCompanyId"
      :sku-name="recalcContext.skuName"
      :oem-company-name="recalcContext.oemCompanyName"
      :cost-change="recalcContext.costChange"
      @close="showRecalcModal = false"
      @recalculated="loadData(); loadStatistics()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '~/components/ui/PageHeader.vue'
import Pagination from '~/components/ui/Pagination.vue'
import OemCostModal from '~/components/admin/oem-cost/OemCostModal.vue'
import OemCostHistoryModal from '~/components/admin/oem-cost/OemCostHistoryModal.vue'
import OemCostRecalcModal from '~/components/admin/oem-cost/OemCostRecalcModal.vue'
import { oemCostService } from '~/services/oem-cost.service'
import { companyService } from '~/services/company.service'
import {
  OEM_COST_STATUS_LABELS,
  calculateMarginRate,
  calculateOemCostStatus,
  getMarginRateClass as getMarginClass
} from '~/types/oem-cost'
import type {
  OemCostListItem,
  OemCostTreeItem,
  OemCost,
  OemCostStatistics,
  OemCostStatus
} from '~/types/oem-cost'
import type { CompanyInfoResponse } from '~/types/company'

// 페이지 메타 설정 - admin 레이아웃 적용
definePageMeta({
  layout: 'admin',
  pageTitle: '제조사 원가 관리'
})

useHead({
  title: '제조사 원가 관리 - PTLPSM'
})

// 상태
const isLoading = ref(false)
const treeList = ref<OemCostTreeItem[]>([])
const expandedSkuIds = ref<Set<string>>(new Set())
const oemCompanies = ref<CompanyInfoResponse[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)

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
  skuId: '',
  keyword: '',
  status: '' as OemCostStatus | '',
  costSourceType: '' as string
})

// SKU 필터 여부 및 상세 정보
const isSkuFiltered = computed(() => !!searchForm.skuId)
const skuDetailInfo = computed(() => {
  if (!searchForm.skuId || treeList.value.length === 0) { return null }
  const firstSku = treeList.value[0]
  return {
    skuId: firstSku.skuId,
    skuName: firstSku.skuName || firstSku.itemName,
    unitPrice: firstSku.unitPrice,
    oemCount: firstSku.oemCount
  }
})

// SKU 필터 해제
const clearSkuFilter = () => {
  searchForm.skuId = ''
  navigateTo('/admin/basic-info/oem-cost', { replace: true })
  loadData()
}

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

// 재계산 모달 상태
const showRecalcModal = ref(false)
const recalcContext = reactive({
  skuId: '',
  oemCompanyId: 0,
  skuName: '',
  oemCompanyName: '',
  costChange: { oldCost: 0, newCost: 0 }
})

// 펼침/접힘
const toggleExpand = (skuId: string) => {
  if (expandedSkuIds.value.has(skuId)) {
    expandedSkuIds.value.delete(skuId)
  } else {
    expandedSkuIds.value.add(skuId)
  }
}

const expandAll = () => {
  treeList.value.forEach(sku => expandedSkuIds.value.add(sku.skuId))
}

const collapseAll = () => {
  expandedSkuIds.value.clear()
}

// 데이터 로드 (트리 구조)
const loadData = async () => {
  try {
    isLoading.value = true
    const response = await oemCostService.getTreeList({
      ...searchForm,
      page: currentPage.value - 1, // API는 0-indexed
      size: pageSize.value
    })

    treeList.value = response.content || []
    totalElements.value = response.totalElements || 0
    totalPages.value = response.totalPages || 0
  } catch (error) {
    console.error('트리 목록 조회 실패:', error)
    treeList.value = []
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

// OEM 회사 목록 로드 (제조사 타입만 조회)
const loadOemCompanies = async () => {
  try {
    oemCompanies.value = await companyService.getManufacturers()
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
  searchForm.skuId = ''
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.costSourceType = ''
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

// 마진율 계산
const getMarginRate = (oem: OemCostListItem): number | null => {
  return calculateMarginRate(oem.unitPrice, oem.costPrice)
}

// OEM 상태 계산
const getOemStatus = (oem: OemCostListItem): OemCostStatus | null => {
  if (!oem.effectiveDate) { return null }
  return calculateOemCostStatus(oem as OemCost)
}

// OEM 추가 모달 열기 (트리의 SKU 부모 행에서)
const openAddOemModal = (sku: OemCostTreeItem) => {
  selectedSkuInfo.value = {
    skuId: sku.skuId,
    skuName: sku.skuName,
    itemName: sku.itemName,
    unitPrice: sku.unitPrice
  }
  selectedCostData.value = null
  // 해당 SKU에 이미 등록된 제조사 ID 목록 추출
  existingOemCompanyIds.value = (sku.oemCosts || [])
    .filter(oem => oem.oemCompanyId)
    .map(oem => oem.oemCompanyId)
  showCostModal.value = true
}

// SKU 이력 모달 열기 (부모 행에서 SKU 전체 이력)
const openSkuHistoryModal = (sku: OemCostTreeItem) => {
  historyTarget.skuId = sku.skuId
  historyTarget.oemCompanyId = 0 // 전체 OEM
  historyTarget.oemCompanyName = ''
  historyTarget.currentCost = null
  historyTarget.unitPrice = sku.unitPrice || 0
  showHistoryModal.value = true
}

// 원가 수정 모달 열기 (자식 OEM 행에서)
const openEditModal = (oem: OemCostListItem) => {
  selectedSkuInfo.value = {
    skuId: oem.skuId,
    skuName: oem.skuName,
    itemName: oem.itemName,
    unitPrice: oem.unitPrice
  }
  selectedCostData.value = oem as OemCost
  existingOemCompanyIds.value = []
  showCostModal.value = true
}

// 해당 SKU에 이미 등록된 제조사 ID 목록
const existingOemCompanyIds = ref<number[]>([])

// 모달 닫기
const closeCostModal = () => {
  showCostModal.value = false
  selectedSkuInfo.value = null
  selectedCostData.value = null
}

// 저장 완료
const handleCostSaved = (data: OemCost, context?: { skuId: string, oemCompanyId: number, oldCost: number, newCost: number }) => {
  closeCostModal()
  loadData()
  loadStatistics()

  // 원가 변경 시 재계산 모달 표시
  if (context && context.oldCost !== context.newCost) {
    const oemName = oemCompanies.value.find(c => c.id === context.oemCompanyId)?.companyName || 'OEM'
    recalcContext.skuId = context.skuId
    recalcContext.oemCompanyId = context.oemCompanyId
    recalcContext.skuName = data.skuName || data.skuId || context.skuId
    recalcContext.oemCompanyName = oemName
    recalcContext.costChange = { oldCost: context.oldCost, newCost: context.newCost }
    showRecalcModal.value = true
  }
}

// 이력 모달 열기 (자식 OEM 행에서)
const openHistoryModal = (oem: OemCostListItem) => {
  historyTarget.skuId = oem.skuId
  historyTarget.oemCompanyId = oem.oemCompanyId
  historyTarget.oemCompanyName = oem.oemCompanyName || ''
  historyTarget.currentCost = oem as OemCost
  historyTarget.unitPrice = oem.unitPrice || 0
  showHistoryModal.value = true
}

// 이력 모달 닫기
const closeHistoryModal = () => {
  showHistoryModal.value = false
}

// 포맷팅
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) { return '-' }
  return amount.toLocaleString('ko-KR') + '원'
}

const formatDateRange = (item: OemCostListItem): string => {
  if (!item.effectiveDate) { return '-' }
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
  if (rate === null || rate === undefined) { return 'margin-none' }
  return getMarginClass(rate)
}

// 라우트
const route = useRoute()

// 초기화
onMounted(() => {
  // URL 쿼리 파라미터에서 skuId 읽기
  if (route.query.skuId) {
    searchForm.skuId = route.query.skuId as string
  }
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
  padding: 0;
}

/* 뒤로가기 버튼 */
.btn-back {
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

.btn-back:hover {
  background: #e5e7eb;
  color: #1f2937;
}

/* SKU 컨텍스트 배너 */
.sku-context-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  border: 1px solid #c4b5fd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
}

.sku-banner-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.sku-banner-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 12px;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.sku-banner-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sku-banner-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sku-banner-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sku-code {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #c4b5fd;
}

.sku-name {
  font-size: 1rem;
  font-weight: 500;
  color: #4b5563;
}

.sku-banner-price {
  font-size: 0.875rem;
  color: #6b7280;
}

.sku-banner-price strong {
  color: #7c3aed;
  font-weight: 700;
}

.sku-banner-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-left: 1.5rem;
  border-left: 2px solid #c4b5fd;
  margin-left: 1rem;
}

.sku-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sku-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #7c3aed;
  line-height: 1;
}

.sku-stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.sku-banner-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.sku-banner-close:hover {
  background: white;
  color: #1f2937;
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

.table-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-container {
  overflow-x: auto;
}

/* 펼침/접힘 버튼 */
.btn-expand-all,
.btn-collapse-all {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #4b5563;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-expand-all:hover,
.btn-collapse-all:hover {
  background: #e5e7eb;
  color: #1f2937;
}

/* 트리 테이블 */
.tree-table {
  border-collapse: collapse;
}

/* 부모 행 (SKU) */
.sku-parent-row {
  background: #f8fafc;
  font-weight: 600;
  cursor: pointer;
  border-left: 3px solid #8b5cf6;
  transition: background 0.15s;
}

.sku-parent-row:hover {
  background: #f1f5f9;
}

.sku-parent-row td {
  padding: 0.75rem 0.625rem;
  border-bottom: 1px solid #e2e8f0;
}

.expand-cell {
  text-align: center;
  width: 40px;
}

.expand-icon {
  font-size: 0.75rem;
  color: #8b5cf6;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.sku-id-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #1f2937;
}

.sku-name-text {
  font-weight: 600;
  color: #1f2937;
}

.oem-count-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #7c3aed;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #c4b5fd;
}

/* 자식 행 (OEM) */
.oem-child-row {
  background: white;
  transition: background 0.15s;
}

.oem-child-row:hover {
  background: #faf5ff;
}

.oem-child-row td {
  padding: 0.625rem;
  border-bottom: 1px solid #f1f5f9;
}

.oem-indent-cell {
  position: relative;
}

.oem-branch-line {
  display: inline-block;
  width: 20px;
  height: 1px;
  background: #d8b4fe;
  vertical-align: middle;
  margin-left: 0.5rem;
}

.oem-company-name {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
  color: #4b5563;
}

.oem-icon {
  font-size: 0.75rem;
  color: #a78bfa;
}

.cost-value {
  font-weight: 600;
  color: #1f2937;
}

/* OEM 없는 경우 */
.oem-empty-cell {
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
  padding-left: 2.5rem !important;
}

.oem-empty-cell i {
  margin-right: 0.375rem;
}

/* 로딩/빈 상태 */
.loading-cell,
.empty-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #9ca3af;
}

.loading-cell {
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

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  flex-wrap: nowrap;
}

.btn-edit,
.btn-view,
.btn-add-oem {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  height: 26px;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-edit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-add-oem {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-add-oem:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.btn-view {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-view:hover {
  background: #e5e7eb;
  color: #1f2937;
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

/* 원가 유형 배지 */
.source-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-left: 0.375rem;
  vertical-align: middle;
}

.source-oem {
  background: #dbeafe;
  color: #1e40af;
}

.source-leadpower {
  background: #fce7f3;
  color: #9d174d;
}
</style>
