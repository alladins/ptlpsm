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
        <button class="btn-excel" :disabled="exporting" @click="handleExportExcel">
          <i v-if="exporting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-file-excel" />
          엑셀
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
            {{ statistics.totalOemCostCount.toLocaleString() }}건
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
            {{ statistics.activeOemCostCount.toLocaleString() }}건
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
            {{ statistics.skuWithoutCostCount.toLocaleString() }}건
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
            {{ statistics.expiringSoonCount.toLocaleString() }}건
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
                    <!--
                      적용기간 — 겹치는 구간은 눈에 띄게 표시한다.
                      두 구간이 한 날짜를 함께 덮으면 그 시점 원가를 하나로 정할 수 없어
                      집계가 어긋난다. 저장 단계에서 막고 있지만, 이미 들어간 데이터는
                      화면에서 보이지 않으면 아무도 모른 채 남는다.
                    -->
                    <td :class="{ 'period-overlap': isOverlapping(sku, oem) }">
                      {{ formatDateRange(oem) }}
                      <span
                        v-if="isOverlapping(sku, oem)"
                        class="overlap-badge"
                        title="다른 구간과 적용기간이 겹칩니다. 그 기간의 원가를 하나로 정할 수 없어 집계가 어긋납니다. 한쪽을 수정하거나 삭제해 정리하세요."
                      >
                        <i class="fas fa-exclamation-triangle" />
                        겹침
                      </span>
                      <!--
                        마지막 구간인데 종료일이 있으면 그 뒤를 덮는 원가가 없다.
                        = 지금 적용중인 원가가 없는 상태. 2026-09-16 운영 사고가 이 모양이었다.
                      -->
                      <span
                        v-else-if="isDanglingEnd(sku, oem)"
                        class="dangling-badge"
                        title="마지막 구간인데 종료일이 있습니다. 이 날 이후를 덮는 원가가 없어 '적용중 원가 없음' 상태입니다. 이 구간의 종료일을 비우거나, 이어지는 새 구간을 등록하세요."
                      >
                        <i class="fas fa-unlink" />
                        이후 원가 없음
                      </span>
                    </td>
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
                      <!--
                        구간 추가 [+] — «지금부터 적용»(단가 변경)과 «지난 기간»(소급 단가)을
                        한 버튼에 모았다.

                        ★ 예전에는 단가가 바뀌면 [수정]을 눌러야 했는데, 실제 동작은 '새 구간 추가'라
                          고객이 이해하기 어려웠다. 이제 새 구간은 [+], 이미 있는 구간의 값 손질은
                          [수정] 으로 역할을 갈랐다.
                        ★ 공급원당 한 번이면 되는 동작이라 대표 행(적용중)에만 단다.
                        ★ 자주 쓰는 동작이라 맨 앞에 둔다.
                      -->
                      <button
                        v-if="isPastPeriodAnchor(sku, oem)"
                        class="btn-icon btn-past"
                        title="구간 추가 (지금부터 적용 / 지난 기간)"
                        @click="openPastPeriodModal(sku, oem)"
                      >
                        <i class="fas fa-plus" />
                      </button>
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
                      <!--
                        삭제 — 마지막 구간만 지울 수 있다.
                        중간 구간을 지우면 그 기간의 원가를 찾지 못해 출하·원장 금액이 어긋난다.
                        (백엔드 validateNotMiddlePeriod 가 같은 이유로 막는다)

                        ★ 못 지우는 행에서는 아예 감춘다. 예전에는 비활성 버튼을 남겨
                          «왜 못 지우는지»를 툴팁으로 알렸는데, 구간이 쌓이니 회색 휴지통만
                          줄줄이 남아 화면이 어수선했다.
                      -->
                      <button
                        v-if="canDelete(sku, oem)"
                        class="btn-icon btn-delete"
                        title="이 구간 삭제"
                        @click="handleDeleteCost(sku, oem)"
                      >
                        <i class="fas fa-trash-alt" />
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
      <!-- 공용 Pagination 이 정렬(justify-content:center)과 여백(margin-top:2rem)을 자체 처리한다.
           래퍼로 감싸면 구분선이 이중으로 그려지고 여백도 3rem 으로 벌어져 다른 목록 화면과 어긋난다. -->
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="handlePageChange"
      />
    </div>

    <!-- 원가 등록/수정 모달 -->
    <OemCostModal
      :is-open="showCostModal"
      :sku-info="selectedSkuInfo"
      :edit-data="selectedCostData"
      :existing-oem-company-ids="existingOemCompanyIds"
      :correct-mode="isCorrectMode"
      @close="closeCostModal"
      @saved="handleCostSaved"
    />

    <!--
      이력 모달 — '누가 언제 왜 고쳤나' 감사 로그 전용.
      적용구간 표는 걷어냈다: 위 목록이 만료 구간까지 전부 행으로 펼쳐 주고
      각 행의 수정 버튼(openEditModal)이 정정 모드까지 처리하므로 완전히 중복이었다.
    -->
    <OemCostHistoryModal
      ref="historyModalRef"
      :is-open="showHistoryModal"
      :sku-id="historyTarget.skuId"
      :oem-company-id="historyTarget.oemCompanyId"
      :oem-company-name="historyTarget.oemCompanyName"
      :current-cost="historyTarget.currentCost"
      :unit-price="historyTarget.unitPrice"
      @close="closeHistoryModal"
    />

    <!-- 구간 추가 모달 (지금부터 적용 / 지난 기간) -->
    <OemCostAddPeriodModal
      :is-open="showPastPeriodModal"
      :sku-info="pastPeriodContext.skuInfo"
      :oem-company-id="pastPeriodContext.oemCompanyId"
      :oem-company-name="pastPeriodContext.oemCompanyName"
      :cost-source-type="pastPeriodContext.costSourceType"
      :anchor-cost="pastPeriodContext.anchorCost"
      @close="showPastPeriodModal = false"
      @saved="loadData(); loadStatistics()"
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
import OemCostAddPeriodModal from '~/components/admin/oem-cost/OemCostAddPeriodModal.vue'
import { oemCostService } from '~/services/oem-cost.service'
import { companyService } from '~/services/company.service'
import {
  OEM_COST_STATUS,
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
const currentPage = ref(0) // Pagination 컴포넌트 계약: 0-based (Spring page 와 동일)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)

// 통계
const statistics = reactive<OemCostStatistics>({
  totalOemCostCount: 0,
  activeOemCostCount: 0,
  skuWithCostCount: 0,
  skuWithoutCostCount: 0,
  oemCompanyCount: 0,
  expiringSoonCount: 0
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
  thickness?: number
} | null>(null)
const selectedCostData = ref<OemCost | null>(null)
// 정정 모드 — 지나간(만료) 구간의 금액을 그 자리에서 고친다. 새 구간을 만들지 않는다.
const isCorrectMode = ref(false)

const showHistoryModal = ref(false)
const historyModalRef = ref<{ reload: () => void } | null>(null)
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
      page: currentPage.value,
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
  currentPage.value = 0
  loadData()
}

// 초기화
const handleReset = () => {
  searchForm.oemCompanyId = undefined
  searchForm.skuId = ''
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.costSourceType = ''
  currentPage.value = 0
  loadData()
}

// 새로고침
const handleRefresh = () => {
  loadData()
  loadStatistics()
}

// 오늘 날짜 (YYYY-MM-DD, 파일명용)
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 엑셀 다운로드 (현재 검색 조건 기준 전체 행)
const exporting = ref(false)
const handleExportExcel = async () => {
  if (exporting.value) { return }
  try {
    exporting.value = true
    const blob = await oemCostService.exportExcel({
      costSourceType: searchForm.costSourceType,
      oemCompanyId: searchForm.oemCompanyId,
      skuId: searchForm.skuId,
      keyword: searchForm.keyword
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `제조사원가목록_${getTodayDate()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => window.URL.revokeObjectURL(url), 1000) // 즉시 해제하면 크롬이 파일명·확장자를 잃는다
  } catch (error) {
    console.error('제조사 원가 엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  } finally {
    exporting.value = false
  }
}

// 페이지 변경
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

// 페이지 크기 변경
const handlePageSizeChange = () => {
  currentPage.value = 0
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

/** 같은 (공급사 + 원가유형) 형제 구간 — 겹침·삭제 판정은 이 안에서만 한다 */
const siblingPeriods = (sku: OemCostTreeItem, oem: OemCostListItem): OemCostListItem[] =>
  (sku.oemCosts || []).filter(o =>
    o.oemCompanyId === oem.oemCompanyId && o.costSourceType === oem.costSourceType)

const FOREVER = '9999-12-31'
const startOf = (o: OemCostListItem) => String(o.effectiveDate || '').slice(0, 10)
const endOf = (o: OemCostListItem) => String(o.expiryDate || FOREVER).slice(0, 10)

/**
 * 이 구간이 형제 구간과 하루라도 겹치는가.
 *
 * ⚠ 겹치면 그 날짜의 원가를 하나로 정할 수 없다. as-of 조회가 두 값을 보게 되어
 *   출하 원가·원장 금액이 조회 순서에 따라 달라진다.
 *   저장 단계에서 막고 있지만(validateNoPeriodOverlap), 과거에 들어간 데이터나
 *   SQL 로 직접 넣은 행은 걸러지지 않아 화면에서 드러나야 한다.
 */
const isOverlapping = (sku: OemCostTreeItem, oem: OemCostListItem): boolean => {
  if (!oem.effectiveDate) { return false }
  const s = startOf(oem)
  const e = endOf(oem)
  return siblingPeriods(sku, oem).some((other) => {
    if (other.id === oem.id || !other.effectiveDate) { return false }
    return s <= endOf(other) && startOf(other) <= e
  })
}

/**
 * 마지막 구간인데 종료일이 있는가 — 그 뒤를 덮는 원가가 없다는 뜻이다.
 *
 * ⚠ (SKU + 공급사 + 원가유형) 당 무기한 구간은 정확히 1개여야 한다.
 *   0개면 «지금 적용중인 원가» 가 없어 출하·원장이 원가를 찾지 못하고,
 *   등록도 «이미 등록된 원가입니다» 로 막혀(등록은 첫 구간 전용) 손쓸 수 없게 된다.
 *   2026-09-16 운영에서 실제로 이 상태가 만들어져 SQL 로 복구해야 했다.
 */
const isDanglingEnd = (sku: OemCostTreeItem, oem: OemCostListItem): boolean => {
  if (!oem.effectiveDate || !oem.expiryDate) { return false }
  const s = startOf(oem)
  return !siblingPeriods(sku, oem).some(other =>
    other.id !== oem.id && other.effectiveDate && startOf(other) > s)
}

/**
 * 지울 수 있는가 — 뒤에 다른 구간이 없어야 한다(= 마지막 구간).
 *
 * 중간 구간을 지우면 그 기간의 원가를 찾지 못해 출하·원장 금액이 어긋난다.
 * 백엔드도 같은 이유로 막으므로(validateNotMiddlePeriod) 여기서 미리 걸러
 * 눌렀다가 에러를 보는 대신 왜 못 지우는지가 먼저 보이게 한다.
 */
const canDelete = (sku: OemCostTreeItem, oem: OemCostListItem): boolean => {
  if (!oem.id || !oem.effectiveDate) { return false }
  const s = startOf(oem)
  return !siblingPeriods(sku, oem).some(other =>
    other.id !== oem.id && other.effectiveDate && startOf(other) > s)
}

/**
 * 이 행이 «과거 구간 추가» 버튼을 달 대표 행인가.
 *
 * 과거 구간 추가는 (SKU + 공급원) 조합당 한 번이면 되는 동작이다.
 * 어느 구간 행에서 눌러도 결과가 같으므로, 구간 수만큼 버튼을 노출할 이유가 없다.
 * 적용중 구간을 대표로 삼고, 전부 만료된 조합은 가장 최근 구간에 단다.
 */
const isPastPeriodAnchor = (sku: OemCostTreeItem, oem: OemCostListItem): boolean => {
  const siblings = siblingPeriods(sku, oem)
  if (siblings.length <= 1) { return true }

  const active = siblings.find(o => calculateOemCostStatus(o) === OEM_COST_STATUS.ACTIVE)
  if (active) { return active.id === oem.id }

  const latest = [...siblings].sort((a, b) => endOf(b).localeCompare(endOf(a)))[0]
  return latest?.id === oem.id
}

// 원가 구간 삭제
const handleDeleteCost = async (sku: OemCostTreeItem, oem: OemCostListItem) => {
  if (!canDelete(sku, oem)) { return }

  const period = formatDateRange(oem)
  const ok = window.confirm(
    `${oem.oemCompanyName} / ${sku.skuName}\n` +
    `${formatCurrency(oem.costPrice)}  (${period})\n\n` +
    '이 적용구간을 삭제합니다.\n' +
    '이미 나간 출하는 그 시점 원가가 따로 저장돼 있어 금액이 바뀌지 않습니다.\n' +
    '다만 이 구간이 덮던 기간에 새로 잡히는 원가는 앞 구간을 따라갑니다.'
  )
  if (!ok) { return }

  try {
    await oemCostService.delete(oem.id, '원가 구간 삭제 (화면)')
    await loadData()
    await loadStatistics()
  } catch (error) {
    console.error('원가 삭제 실패:', error)
    // 지급 완료·중간 구간 등 백엔드 가드 메시지를 그대로 보여준다 — 이유가 곧 안내다
    alert(error instanceof Error ? error.message : '원가 삭제에 실패했습니다.')
  }
}

// OEM 추가 모달 열기 (트리의 SKU 부모 행에서)
const openAddOemModal = (sku: OemCostTreeItem) => {
  selectedSkuInfo.value = {
    skuId: sku.skuId,
    skuName: sku.skuName,
    itemName: sku.itemName,
    unitPrice: sku.unitPrice,
    thickness: sku.thickness
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
// 목록에는 적용중·만료 구간이 모두 나온다.
//
// ★ 만료 구간을 평소 수정 모드로 열면 시작일이 오늘로 세팅돼 '새 구간'이 하나 더 생긴다.
//   지나간 구간은 그 자리에서 금액만 고치는 '정정'이어야 한다.
const openEditModal = (oem: OemCostListItem) => {
  selectedSkuInfo.value = {
    skuId: oem.skuId,
    skuName: oem.skuName,
    itemName: oem.itemName,
    unitPrice: oem.unitPrice,
    thickness: oem.thickness
  }
  selectedCostData.value = oem as OemCost
  existingOemCompanyIds.value = []
  // [수정]은 언제나 «그 구간을 그 자리에서 고치는» 정정이다.
  //
  // ★ 예전에는 적용중 구간을 [수정]으로 열면 시작일이 오늘로 바뀌며 새 구간이 생겼다.
  //   버튼 이름은 '수정'인데 결과는 '구간 추가'라 고객이 이해하기 어려웠다.
  //   새 구간은 [+] 로 갈랐으니 여기서는 값만 고친다.
  isCorrectMode.value = true
  showCostModal.value = true
}

// 해당 SKU에 이미 등록된 제조사 ID 목록
const existingOemCompanyIds = ref<number[]>([])

// ── 과거 구간 추가 ─────────────────────────────────────────────────────────
// [등록]은 첫 구간 전용, [수정]은 앞으로만 추가라 지나간 기간을 넣을 경로가 없었다.
const showPastPeriodModal = ref(false)
const pastPeriodContext = ref<{
  skuInfo: { skuId: string; skuName?: string; thickness?: number } | null
  oemCompanyId: number | null
  oemCompanyName: string
  costSourceType: string
  anchorCost: OemCost | null
}>({ skuInfo: null, oemCompanyId: null, oemCompanyName: '', costSourceType: 'OEM', anchorCost: null })

const openPastPeriodModal = (sku: any, oem: OemCostListItem) => {
  pastPeriodContext.value = {
    skuInfo: {
      skuId: oem.skuId || sku?.skuId,
      skuName: oem.skuName || sku?.skuName,
      thickness: oem.thickness ?? sku?.thickness
    },
    oemCompanyId: oem.oemCompanyId,
    oemCompanyName: oem.oemCompanyName || '',
    costSourceType: (oem as any).costSourceType || 'OEM',
    // «지금부터 적용» 은 이 구간을 하루 전으로 마감하고 뒤에 새 구간을 붙인다.
    // 버튼이 적용중(없으면 최신) 행에만 달리므로 그 행이 곧 기준 구간이다.
    anchorCost: oem as OemCost
  }
  showPastPeriodModal.value = true
}

// 모달 닫기
const closeCostModal = () => {
  showCostModal.value = false
  selectedSkuInfo.value = null
  selectedCostData.value = null
  isCorrectMode.value = false
}

// 저장 완료
const handleCostSaved = (data: OemCost, context?: { skuId: string, oemCompanyId: number, oldCost: number, newCost: number }) => {
  closeCostModal()
  loadData()
  loadStatistics()
  // 이력 모달이 열린 채로 구간을 고친 경우 — 그 자리에서 구간 목록을 다시 읽는다
  if (showHistoryModal.value) {
    historyModalRef.value?.reload()
  }

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
.btn-past,
.btn-delete,
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

/* 구간 추가 — 구간 행의 보조 동작이라 흰 배경으로 차분하게 둔다.
   («OEM 원가 추가»는 SKU 행의 주 동작이라 보라, 여기는 그보다 한 단계 아래) */
.btn-past {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

/* + 기호는 다른 아이콘보다 획이 가늘어 묻힌다 — 조금 키우고 굵게 */
.btn-past i {
  font-size: 0.85rem;
  font-weight: 900;
  -webkit-text-stroke: 0.4px currentColor;
}

/* 올려두면 초록 — «추가»임을 색으로 한 번 더 알린다 */
.btn-past:hover {
  background: #f0fdf4;
  border-color: #86efac;
  color: #15803d;
}

.btn-delete {
  background: #fef2f2;
  color: #b91c1c;
}

.btn-delete:hover:not(:disabled) {
  background: #fee2e2;
  color: #991b1b;
}

/* 중간 구간은 지울 수 없다 — 왜 못 지우는지는 title 로 알린다 */
.btn-delete:disabled {
  background: #f9fafb;
  color: #d1d5db;
  cursor: not-allowed;
}

/* 겹치는 적용기간 — 그 날짜의 원가를 하나로 정할 수 없는 상태다 */
.period-overlap {
  background: #fff7ed;
}

.overlap-badge,
.dangling-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-left: 0.375rem;
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: help;
}

.overlap-badge {
  background: #ffedd5;
  color: #c2410c;
}

/* 마지막 구간에 종료일이 있는 상태 — 그 뒤로 적용중 원가가 없다 */
.dangling-badge {
  background: #fee2e2;
  color: #b91c1c;
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

/* 엑셀 다운로드 버튼 */
.btn-excel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #1d6f42;
  border: 1px solid #1d6f42;
  border-radius: 8px;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-excel:hover {
  background: #15522f;
}

.btn-excel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
