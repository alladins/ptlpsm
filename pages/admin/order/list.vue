<template>
  <div class="order-list">
    <!-- 페이지 헤더 - 리팩토링: PageHeader 컴포넌트 사용 -->
    <PageHeader
      title="납품요구"
      description="납품요구 정보를 조회하고 관리합니다."
      icon="order"
      icon-color="purple"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action" :disabled="exporting" @click="handleExportExcel">
          <i v-if="exporting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-file-excel" />
          엑셀
        </button>
        <button
          v-if="showCreateButton"
          class="btn-action btn-primary"
          :title="!canWrite ? '권한이 없습니다' : ''"
          @click="goToRegister"
        >
          <i class="fas fa-plus" />
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 통계 요약 카드 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon stat-icon--purple">
            <i class="fas fa-file-contract" />
          </div>
          <div class="stat-content">
            <h3>총 납품요구</h3>
            <p>{{ totalElements }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--pink">
            <i class="fas fa-calendar-check" />
          </div>
          <div class="stat-content">
            <h3>금월 납품요구</h3>
            <p>{{ calculatedMonthlyCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue">
            <i class="fas fa-won-sign" />
          </div>
          <div class="stat-content">
            <h3>총 납품요구금액</h3>
            <p>{{ formatNumber(calculatedTotalAmount) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--orange">
            <i class="fas fa-calculator" />
          </div>
          <div class="stat-content">
            <h3>총 예상 원가금액</h3>
            <p>{{ formatNumber(totalEstimatedCost) }}</p>
          </div>
        </div>
      </div>

      <!-- 검색 조건 섹션 - 완전히 한 줄 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 납품요구일자 -->
          <div class="search-item">
            <label>납품요구일자:</label>
            <SearchDateRange v-model:start-date="searchForm.startDate" v-model:end-date="searchForm.endDate" />
          </div>

          <!-- 수요기관 -->
          <div class="search-item">
            <label>수요기관:</label>
            <input v-model="searchForm.client" type="text" placeholder="수요기관명" class="text-input" @keyup.enter="handleSearch">
          </div>

          <!-- 검색어 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input v-model="searchForm.keyword" type="text" placeholder="프로젝트명, 담당자명" class="keyword-input" @keyup.enter="handleSearch">
          </div>

          <!-- 상태 -->
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

          <!-- 영업 담당자 (미지정만 보기 — 담당자 지정 작업용) -->
          <div class="search-item">
            <label>영업 담당자:</label>
            <select v-model="searchForm.salesUnassigned" class="text-input" @change="handleSearch">
              <option :value="false">
                전체
              </option>
              <option :value="true">
                미지정만
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 발주 목록 테이블 -->
      <div class="table-section">
        <!-- 테이블 헤더: 리팩토링 - admin-common.css 스타일 사용 -->
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <!-- 영업 담당자 일괄 지정 — 권한·선택이 없으면 눌렀을 때 이유를 알려 준다 (GuardedButton) -->
            <GuardedButton
              class="btn-action sm-bulk-btn"
              :blocked="!canAssignSales || selectedBaseIds.size === 0"
              :reason="bulkAssignBlockedReason"
              :disabled="salesSaving"
              @click="openBulkAssign"
            >
              <i class="fas fa-user-tie" />
              영업 담당자 지정<span v-if="selectedBaseIds.size > 0"> ({{ selectedBaseIds.size }})</span>
            </GuardedButton>
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

        <!-- 영업 담당자 일괄 지정 패널 (팝업 없이 목록 위에서 바로 고른다) -->
        <div v-if="bulkAssignOpen" class="sm-bulk-panel">
          <div class="sm-bulk-head">
            <strong>선택한 계약 묶음 {{ selectedBaseIds.size }}건의 영업 담당자</strong>
            <span class="sm-bulk-nos">{{ selectedDeliveryNosLabel }}</span>
          </div>
          <GuideNotice tone="info" icon="fa-link" open-label="자세히 보기">
            <template #summary>
              고르는 즉시 저장되며, 각 묶음의 <b>변경·추가계약까지</b> 같은 담당자로 바뀝니다
            </template>
            <ul class="sm-guide-list">
              <li>체크는 묶음(기준계약 행) 단위입니다. 펼친 변경·추가계약 행도 함께 바뀝니다.</li>
              <li>같은 묶음의 납품완료 건 담당자(커미션 담당자 판정에 쓰임)도 함께 바뀝니다.</li>
              <li>한 건씩 수요기관 담당 대리점 «추천»을 보려면 발주 수정 화면에서 지정하세요.</li>
            </ul>
            <template #note>이미 만들어진 커미션 정산 내역은 바뀌지 않습니다. 정산 내역이 있는 발주는 저장 전에 한 번 더 확인을 묻습니다.</template>
          </GuideNotice>
          <SalesManagerPicker
            start-open
            :allow-clear="false"
            :busy="salesSaving"
            @select="bulkAssign"
            @cancel="closeBulkAssign"
          />
          <div class="sm-bulk-foot">
            <button type="button" class="sm-bulk-clear" :disabled="salesSaving" @click="bulkAssign(null)">
              선택 묶음 지정 해제
            </button>
          </div>
        </div>
        <p v-if="salesSaveMessage" class="sm-save-msg" :class="salesSaveMessageTone" role="status">
          <i class="fas" :class="salesSaveMessageTone === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle'" />
          {{ salesSaveMessage }}
        </p>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 테이블 (트리 구조) -->
        <div v-else class="table-container">
          <table class="data-table tree-table">
            <thead>
              <tr>
                <th v-if="canAssignSales" class="col-check">
                  <input
                    type="checkbox"
                    class="row-check"
                    :checked="allGroupsSelected"
                    :indeterminate.prop="someGroupsSelected && !allGroupsSelected"
                    aria-label="이 페이지 계약 묶음 전체 선택"
                    @change="toggleAllGroups"
                  >
                </th>
                <th style="width: 40px;">
                  No
                </th>
                <th style="width: 210px;">
                  납품요구번호
                </th>
                <th style="width: 100px;">
                  납품요구일자
                </th>
                <th style="width: 120px;">
                  수요기관
                </th>
                <th style="width: 50px;">
                  담당자
                </th>
                <th style="min-width: 200px;">
                  사업명
                </th>
                <th style="width: 60px;">
                  상태
                </th>
                <th style="width: 80px;">
                  건설사
                </th>
                <th style="width: 90px;">
                  영업 담당자
                </th>
                <th style="width: 100px;">
                  총계약금액
                </th>
                <th style="width: 95px;">
                  등록일자
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(group, groupIndex) in groupedOrderData" :key="group.baseDeliveryRequestNo">
                <!-- 기준 계약 행 -->
                <tr
                  class="table-row tree-parent-row"
                  :class="{ 'has-children': group.children.length > 0, 'row-selected': selectedBaseIds.has(group.baseOrder.orderId) }"
                >
                  <!-- 체크 = 계약 묶음 단위 (서버가 변경·추가계약까지 넓혀 적용) -->
                  <td v-if="canAssignSales" class="col-check" @click.stop="toggleGroup(group)">
                    <input
                      type="checkbox"
                      class="row-check"
                      :checked="selectedBaseIds.has(group.baseOrder.orderId)"
                      :aria-label="`${group.baseOrder.deliveryRequestNo} 선택`"
                      @click.stop
                      @change="toggleGroup(group)"
                    >
                  </td>
                  <td @click="editItem(group.baseOrder.orderId)">
                    {{ getDisplayIndex(groupIndex) }}
                  </td>
                  <td class="delivery-request-cell" @click="editItem(group.baseOrder.orderId)">
                    <div class="tree-toggle-wrapper">
                      <!-- 확장/축소 버튼 (하위 계약이 있을 때만 표시) -->
                      <button
                        v-if="group.children.length > 0"
                        class="tree-toggle-btn"
                        @click.stop="toggleExpand(group.baseDeliveryRequestNo)"
                      >
                        <i :class="expandedGroups.has(group.baseDeliveryRequestNo) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" />
                      </button>
                      <span v-else class="tree-toggle-placeholder" />
                      <span class="delivery-request-no">{{ group.baseOrder.deliveryRequestNo }}</span>
                      <!-- 하위 계약 개수 배지 -->
                      <span v-if="group.children.length > 0" class="children-count-badge">
                        +{{ group.children.length }}
                      </span>
                    </div>
                  </td>
                  <td class="cell-nowrap" @click="editItem(group.baseOrder.orderId)">
                    {{ group.baseOrder.deliveryRequestDate }}
                  </td>
                  <td class="text-left cell-ellipsis" @click="editItem(group.baseOrder.orderId)">
                    {{ group.baseOrder.client }}
                  </td>
                  <td @click="editItem(group.baseOrder.orderId)">
                    {{ group.baseOrder.clientManagerName }}
                  </td>
                  <td class="project-name-cell text-left" @click="editItem(group.baseOrder.orderId)">
                    {{ group.baseOrder.projectName }}
                  </td>
                  <td @click="editItem(group.baseOrder.orderId)">
                    <span
                      class="status-badge"
                      :class="getStatusClass(group.baseOrder.status)"
                    >
                      {{ getStatusLabel(group.baseOrder.status) }}
                    </span>
                  </td>
                  <td class="text-left cell-ellipsis" @click="editItem(group.baseOrder.orderId)">
                    {{ group.baseOrder.builderCompanyName || '-' }}
                  </td>
                  <td class="cell-ellipsis sales-cell" :title="salesLabel(group.baseOrder)" @click="editItem(group.baseOrder.orderId)">
                    <span v-if="group.baseOrder.salesId">{{ salesLabel(group.baseOrder) }}</span>
                    <span v-else class="sales-unassigned">미지정</span>
                  </td>
                  <td class="text-right" @click="editItem(group.baseOrder.orderId)">
                    {{ formatNumber(group.baseOrder.itemTotalAmount) }}
                  </td>
                  <td class="cell-nowrap" @click="editItem(group.baseOrder.orderId)">
                    {{ formatDate(group.baseOrder.createdAt) }}
                  </td>
                </tr>

                <!-- 변경/별도 계약 행들 (하위) -->
                <template v-if="expandedGroups.has(group.baseDeliveryRequestNo)">
                  <tr
                    v-for="(child, childIndex) in group.children"
                    :key="child.orderId"
                    class="table-row tree-child-row"
                  >
                    <!-- 자식 행은 따로 체크하지 않는다 — 부모(묶음) 체크를 따라 함께 바뀐다 -->
                    <td v-if="canAssignSales" class="col-check" @click="editItem(child.orderId)" />
                    <td class="child-index" @click="editItem(child.orderId)">
                      {{ getDisplayIndex(groupIndex) }}-{{ childIndex + 1 }}
                    </td>
                    <td class="delivery-request-cell" @click="editItem(child.orderId)">
                      <div class="tree-child-indicator">
                        <span class="tree-line" />
                        <span
                          class="contract-type-badge"
                          :class="getContractTypeClass(child.contractType)"
                        >
                          {{ getContractTypeLabel(child.contractType) }}
                        </span>
                        <span class="delivery-request-no child">{{ child.deliveryRequestNo }}</span>
                      </div>
                    </td>
                    <td class="cell-nowrap" @click="editItem(child.orderId)">
                      {{ child.deliveryRequestDate }}
                    </td>
                    <td class="text-left cell-ellipsis" @click="editItem(child.orderId)">
                      {{ child.client }}
                    </td>
                    <td @click="editItem(child.orderId)">
                      {{ child.clientManagerName }}
                    </td>
                    <td class="project-name-cell text-left" @click="editItem(child.orderId)">
                      {{ child.projectName }}
                    </td>
                    <td @click="editItem(child.orderId)">
                      <span
                        class="status-badge"
                        :class="getStatusClass(child.status)"
                      >
                        {{ getStatusLabel(child.status) }}
                      </span>
                    </td>
                    <td class="text-left cell-ellipsis" @click="editItem(child.orderId)">
                      {{ child.builderCompanyName || '-' }}
                    </td>
                    <td class="cell-ellipsis sales-cell" :title="salesLabel(child)" @click="editItem(child.orderId)">
                      <span v-if="child.salesId">{{ salesLabel(child) }}</span>
                      <span v-else class="sales-unassigned">미지정</span>
                    </td>
                    <td class="text-right" @click="editItem(child.orderId)">
                      {{ formatNumber(child.itemTotalAmount) }}
                    </td>
                    <td class="cell-nowrap" @click="editItem(child.orderId)">
                      {{ formatDate(child.createdAt) }}
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>

          <!-- 데이터가 없을 때 - 리팩토링: admin-common.css 스타일 사용 -->
          <div v-if="orderData.length === 0" class="no-data-message">
            <i class="fas fa-shopping-cart" />
            <p>등록된 발주 정보가 없습니다.</p>
          </div>
        </div>

        <!-- 페이지네이션 - 리팩토링: Pagination 컴포넌트 사용 -->
        <Pagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 영업 담당자 일괄 지정 — 커미션 정산 내역 경고 (확인하면 그대로 진행) -->
    <SalesManagerSettledWarningModal
      :warning="settledWarning"
      :target-label="settledTargetLabel"
      :busy="salesSaving"
      @confirm="confirmSettledBulkAssign"
      @cancel="cancelSettledBulkAssign"
    />
  </div>
</template>

<script setup lang="ts">
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { orderService } from '~/services/order.service'
import { getCommissionPeriods } from '~/services/commission.service'
import type { OrderDetailResponse, ContractType, SalesManagerCandidate, OrderSalesManagerUpdateResponse } from '~/types/order'
import { CONTRACT_TYPE_LABELS, ORDER_STATUS_LABELS } from '~/types/order'
// 리팩토링: 공통 모듈 import
import { formatNumber, getSearchStartDate, getSearchEndDate } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { usePermission, usePermissionButtons } from '~/composables/usePermission'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import SalesManagerPicker from '~/components/admin/order/SalesManagerPicker.vue'
import SalesManagerSettledWarningModal from '~/components/admin/order/SalesManagerSettledWarningModal.vue'

// createdAt은 ISO timestamp이므로 날짜만 추출
const formatDate = (dateStr?: string): string => {
  if (!dateStr) { return '-' }
  return dateStr.substring(0, 10) // "2025-12-29T10:30:00" → "2025-12-29"
}

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요구 관리'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canWrite, canEdit, canDelete, currentRole } = usePermission()
const { showCreateButton, showEditButton, showDeleteButton } = usePermissionButtons()

// 자금 통계 데이터
const orderSummary = ref<{ totalAmount: number }>({ totalAmount: 0 })
const loadingStats = ref(false)

// 오늘 날짜 (로컬 시간 기준)
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 6개월 전 날짜 계산 (로컬 시간 기준)

// 1개월 후 날짜 계산 (로컬 시간 기준)

// ★ 정책: 대시보드(admin/index.vue)와 동일하게 "활성 정산기간"을 기본 기간으로 사용한다.
//   두 페이지의 건수·합계 비교 시 항상 같은 집합을 조회하기 위함.
//   활성 정산기간 조회 실패 시에만 과거 6개월 ~ 미래 1개월 fallback 사용.
// 검색 폼 데이터 (납품요구일자 기본값은 onMounted에서 정산기간 로드 후 세팅)
const searchForm = ref({
  startDate: getSearchStartDate(),
  endDate: getSearchEndDate(),
  client: '',
  keyword: '',
  status: '',
  salesUnassigned: false, // 영업 담당자 미지정만
  sort: 'createdAt,desc'
})

// 오늘 날짜(YYYY-MM-DD) — 정산기간 endDate가 오늘을 넘어가면 오늘로 cap
const clampEndToToday = (dateStr: string): string => {
  const today = getTodayDate()
  return dateStr > today ? today : dateStr
}

// 대시보드와 동일한 기본 기간 적용: 활성 정산기간(startDate ~ endDate, endDate는 today로 cap)
const applyDefaultDateRangeFromActivePeriod = async () => {
  try {
    const periods: any[] = await getCommissionPeriods()
    if (!Array.isArray(periods) || periods.length === 0) { return }
    const active = periods.find((p: any) => p.isActive) || periods[0]
    if (!active) { return }
    const startMonth = String(active.startMonth).padStart(2, '0')
    const endMonth = String(active.endMonth).padStart(2, '0')
    const endDay = new Date(active.endYear, active.endMonth, 0).getDate()
    const startDate = `${active.startYear}-${startMonth}-01`
    const endDate = clampEndToToday(`${active.endYear}-${endMonth}-${String(endDay).padStart(2, '0')}`)
    searchForm.value.startDate = startDate
    searchForm.value.endDate = endDate
  } catch (error) {
    console.warn('활성 정산기간 로드 실패 — 기본값(1년 전 ~ 오늘) 유지:', error)
  }
}

// 리팩토링: useDataTable composable 사용으로 페이지네이션 로직 통합
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
  search,
  refresh,
  reset
} = useDataTable<OrderDetailResponse>({
  fetchFunction: async (params) => {
    const response = await orderService.getOrders({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      client: searchForm.value.client,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      salesUnassigned: searchForm.value.salesUnassigned,
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'createdAt,desc',
      // ★ 한 계약 = 한 행. 변경계약에 대체된 원계약(-00)은 따로 세지 않고,
      //   아래 family 보강으로 변경계약 행 밑에 붙어 보인다 (건수 61 → 58, 중복 표시 해소 — 2026-09-21)
      latestOnly: true
    })
    return response
  },
  initialPageSize: 10,
  initialSort: 'createdAt,desc'
})

// 통계 계산: 총 납품요구금액 (검색 조건 연동)
const calculatedTotalAmount = computed(() => {
  return orderSummary.value?.totalAmount || 0
})

// 통계 계산: 총 예상 원가금액 (후속 작업 예정)
const totalEstimatedCost = computed(() => {
  return 0
})

// 통계 계산: 금월 납품요구 건수
const calculatedMonthlyCount = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  return orderData.value.filter((order) => {
    const orderDate = new Date(order.deliveryRequestDate)
    return orderDate.getFullYear() === currentYear &&
           orderDate.getMonth() === currentMonth
  }).length
})

// 납품요구 금액 합계 로드 (검색 조건 연동)
const loadOrderSummary = async () => {
  try {
    loadingStats.value = true
    orderSummary.value = await orderService.getOrderSummary({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      client: searchForm.value.client,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      salesUnassigned: searchForm.value.salesUnassigned
    })
  } catch (error) {
    console.error('납품요구 금액 합계 조회 실패:', error)
  } finally {
    loadingStats.value = false
  }
}

// 검색 기능
const handleSearch = () => {
  search()
  loadOrderSummary()
}

// 엑셀 다운로드 (현재 검색 조건 기준 전체 행)
const exporting = ref(false)
const handleExportExcel = async () => {
  if (exporting.value) { return }
  try {
    exporting.value = true
    const blob = await orderService.exportExcel({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      client: searchForm.value.client,
      keyword: searchForm.value.keyword,
      status: searchForm.value.status,
      salesUnassigned: searchForm.value.salesUnassigned,
      sort: searchForm.value.sort
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `납품요구목록_${getTodayDate()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => window.URL.revokeObjectURL(url), 1000) // 즉시 해제하면 크롬이 파일명·확장자를 잃는다
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  } finally {
    exporting.value = false
  }
}

// 검색 초기화 — 기본 기간은 활성 정산기간(대시보드와 동일). 로드 실패 시 과거 6개월~미래 1개월.
const handleReset = async () => {
  searchForm.value = {
    startDate: getSearchStartDate(),
    endDate: getSearchEndDate(),
    client: '',
    keyword: '',
    status: '',
    salesUnassigned: false,
    sort: 'createdAt,desc'
  }
  await applyDefaultDateRangeFromActivePeriod()
  reset()
}

// 페이지 변경 - 리팩토링: useDataTable의 changePage 사용
// Pagination 컴포넌트는 0-based, useDataTable도 0-based
const handlePageChange = (page: number) => {
  changePage(page)
  // URL에 페이지 번호 저장 (뒤로가기/앞으로가기 시 복원용)
  router.replace({ query: { ...route.query, page: String(page) } })
}

// 페이지 크기 변경 - 리팩토링: useDataTable의 changePageSize 사용
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 등록 페이지로 이동
const goToRegister = () => {
  router.push('/admin/order/register')
}

// 수정 페이지로 이동 (현재 페이지 번호를 쿼리로 전달)
const editItem = (id: number) => {
  router.push({
    path: `/admin/order/edit/${id}`,
    query: { returnPage: String(currentPage.value) }
  })
}

// ========== 트리 구조 관련 상태 및 함수 ==========

// 확장된 그룹 관리 (Set 사용)
const expandedGroups = ref<Set<string>>(new Set())

// 현재 페이지에 없는 family(본계약/형제 계약) 보강 행 — 표시 전용 (페이징/집계에는 미반영)
const familyMembers = ref<OrderDetailResponse[]>([])

/**
 * 현재 페이지 행 + 보강된 family 행 병합 (표시 전용)
 * - 페이지 원본 행을 앞에 두어 "그룹 내 첫 행 = 부모" 규칙을 유지 (검색 화면과 동일한 부모/자식 배치)
 * - orderId 기준 중복 제거 (페이지 행 우선)
 */
const mergedOrderData = computed<OrderDetailResponse[]>(() => {
  const base = orderData.value || []
  if (familyMembers.value.length === 0) { return base }
  const seen = new Set(base.map(o => o.orderId))
  const extras = familyMembers.value.filter(o => !seen.has(o.orderId))
  return [...base, ...extras]
})

/**
 * 납품요구번호에서 기준 번호 추출 (뒤 2자리 제외)
 * 예: "35-24-3-41787-01" → "35-24-3-41787"
 */
const getBaseDeliveryRequestNo = (deliveryRequestNo: string): string => {
  if (!deliveryRequestNo) { return '' }
  // 마지막 -XX 부분 제거
  const parts = deliveryRequestNo.split('-')
  if (parts.length > 1) {
    // 마지막 부분이 2자리 숫자인 경우 제거
    const lastPart = parts[parts.length - 1]
    if (/^\d{2}$/.test(lastPart)) {
      return parts.slice(0, -1).join('-')
    }
  }
  return deliveryRequestNo
}

/**
 * 주문 데이터를 트리 구조로 그룹화
 * 기준 계약(splitSeq=00 또는 ORIGINAL)을 부모로, 변경/별도 계약을 자식으로 그룹화
 */
interface OrderGroup {
  baseDeliveryRequestNo: string
  baseOrder: OrderDetailResponse
  children: OrderDetailResponse[]
}

const groupedOrderData = computed<OrderGroup[]>(() => {
  const source = mergedOrderData.value
  if (!source || source.length === 0) { return [] }

  // 기준 번호별로 그룹화
  const groupMap = new Map<string, { base: OrderDetailResponse | null; children: OrderDetailResponse[] }>()

  source.forEach((order) => {
    const baseNo = getBaseDeliveryRequestNo(order.deliveryRequestNo)

    if (!groupMap.has(baseNo)) {
      groupMap.set(baseNo, { base: null, children: [] })
    }

    const group = groupMap.get(baseNo)!

    // 기준 계약 판별 (splitSeq=00 또는 contractType=ORIGINAL 또는 baseOrderId가 없음)
    const isBaseOrder = !order.splitSeq || order.splitSeq === '00' ||
                        order.contractType === 'ORIGINAL' ||
                        !order.baseOrderId

    if (isBaseOrder && !group.base) {
      group.base = order
    } else {
      group.children.push(order)
    }
  })

  // 그룹을 배열로 변환
  const result: OrderGroup[] = []
  groupMap.forEach((group, baseNo) => {
    // 기준 계약이 없는 경우 첫 번째 항목을 기준으로 사용
    const baseOrder = group.base || group.children.shift()
    if (baseOrder) {
      result.push({
        baseDeliveryRequestNo: baseNo,
        baseOrder,
        children: group.children.sort((a, b) => {
          // splitSeq로 정렬
          const seqA = a.splitSeq || '00'
          const seqB = b.splitSeq || '00'
          return seqA.localeCompare(seqB)
        })
      })
    }
  })

  return result
})

/**
 * 현재 페이지에 등장한 기준번호(base)의 family 전체를 백엔드에서 보강 조회한다.
 * 기본 목록처럼 본계약과 변경계약이 서로 다른 페이지로 분리된 경우에도
 * 트리(본계약-변경계약) 연결이 보이도록 한다.
 */
const backfillFamilies = async () => {
  const rows = orderData.value || []
  if (rows.length === 0) {
    familyMembers.value = []
    return
  }
  // 현재 페이지 행에서 distinct 기준번호 산출 (그룹핑과 동일한 파싱 규칙 사용)
  const bases = Array.from(new Set(
    rows.map(o => getBaseDeliveryRequestNo(o.deliveryRequestNo)).filter(Boolean)
  ))
  const family = await orderService.getOrdersByBases(bases)
  // 페이지에 이미 있는 건은 제외하고 보강 행만 보관 (매 호출 시 새로 대체 → stale 방지)
  const pageIds = new Set(rows.map(o => o.orderId))
  familyMembers.value = family.filter(o => !pageIds.has(o.orderId))
}

// 페이지 로드/검색/페이지 이동 시마다 family 보강 (familyMembers는 orderData를 변경하지 않으므로 무한루프 없음)
watch(orderData, () => {
  backfillFamilies()
}, { immediate: true })

/**
 * 트리 확장/축소 토글
 */
const toggleExpand = (baseDeliveryRequestNo: string) => {
  if (expandedGroups.value.has(baseDeliveryRequestNo)) {
    expandedGroups.value.delete(baseDeliveryRequestNo)
  } else {
    expandedGroups.value.add(baseDeliveryRequestNo)
  }
  // 반응성 트리거
  expandedGroups.value = new Set(expandedGroups.value)
}

/**
 * 표시용 인덱스 계산
 */
const getDisplayIndex = (groupIndex: number): number => {
  return startIndex.value + groupIndex
}

// ========== 영업 담당자 지정 (2026-09-30) ==========
// 서버(SecurityConfig·서비스)와 같은 선: 시스템관리자·리드파워 담당자만
// isFullAccess 는 SYSTEM_ADMIN 만 참이라(리드파워는 메뉴권한 따름) 역할로 직접 판정한다
const canAssignSales = computed(() => ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER'].includes(currentRole.value ?? ''))

/** 체크한 계약 묶음 — 묶음의 기준(부모) 행 orderId. 서버가 변경·추가계약까지 넓혀 적용한다 */
const selectedBaseIds = ref<Set<number>>(new Set())
const bulkAssignOpen = ref(false)
const salesSaving = ref(false)
const salesSaveMessage = ref('')
const salesSaveMessageTone = ref<'ok' | 'error'>('ok')
let salesMsgTimer: ReturnType<typeof setTimeout> | null = null

const salesLabel = (o: OrderDetailResponse): string => {
  if (!o.salesId) { return '미지정' }
  const name = o.salesName || `사용자 #${o.salesId}`
  return o.salesAgencyName ? `${name} (${o.salesAgencyName})` : name
}

const bulkAssignBlockedReason = computed(() => {
  if (!canAssignSales.value) {
    return '영업 담당자 지정은 시스템관리자·리드파워 담당자만 할 수 있습니다.\n담당자 변경이 필요하면 리드파워 담당자에게 요청하세요.'
  }
  if (selectedBaseIds.value.size === 0) {
    return '담당자를 지정할 납품요구를 먼저 체크하세요.\n(왼쪽 체크박스 — 변경·추가계약은 묶음으로 함께 바뀝니다)'
  }
  return ''
})

const allGroupsSelected = computed(() =>
  groupedOrderData.value.length > 0 &&
  groupedOrderData.value.every(g => selectedBaseIds.value.has(g.baseOrder.orderId)))
const someGroupsSelected = computed(() =>
  groupedOrderData.value.some(g => selectedBaseIds.value.has(g.baseOrder.orderId)))

const toggleGroup = (group: OrderGroup) => {
  const next = new Set(selectedBaseIds.value)
  const id = group.baseOrder.orderId
  if (next.has(id)) { next.delete(id) } else { next.add(id) }
  selectedBaseIds.value = next
}

const toggleAllGroups = () => {
  selectedBaseIds.value = allGroupsSelected.value
    ? new Set()
    : new Set(groupedOrderData.value.map(g => g.baseOrder.orderId))
}

const selectedDeliveryNosLabel = computed(() => {
  const nos = groupedOrderData.value
    .filter(g => selectedBaseIds.value.has(g.baseOrder.orderId))
    .map(g => g.baseDeliveryRequestNo)
  return nos.length > 3 ? `${nos.slice(0, 3).join(', ')} 외 ${nos.length - 3}건` : nos.join(', ')
})

// 페이지·검색이 바뀌면 보이지 않는 선택이 남지 않게 비운다
watch(orderData, () => {
  selectedBaseIds.value = new Set()
  bulkAssignOpen.value = false
})

const showSalesMessage = (text: string, tone: 'ok' | 'error') => {
  salesSaveMessage.value = text
  salesSaveMessageTone.value = tone
  if (salesMsgTimer) { clearTimeout(salesMsgTimer) }
  if (tone === 'ok') {
    salesMsgTimer = setTimeout(() => { salesSaveMessage.value = '' }, 5000)
  }
}

const openBulkAssign = () => {
  bulkAssignOpen.value = true
  salesSaveMessage.value = ''
}

const closeBulkAssign = () => {
  bulkAssignOpen.value = false
}

// «이름 (대리점명)» — null 이면 지정 해제
const candidateLabel = (candidate: SalesManagerCandidate | null): string | null => candidate
  ? `${candidate.userName}${candidate.agencyMember && candidate.companyName ? ` (${candidate.companyName})` : ''}`
  : null

const bulkAssign = async (candidate: SalesManagerCandidate | null) => {
  if (salesSaving.value || selectedBaseIds.value.size === 0) { return }
  const count = selectedBaseIds.value.size
  const who = candidateLabel(candidate)
  const question = who
    ? `선택한 계약 묶음 ${count}건의 영업 담당자를 «${who}»(으)로 지정할까요?\n변경·추가계약도 함께 바뀝니다.`
    : `선택한 계약 묶음 ${count}건의 영업 담당자 지정을 해제할까요?\n영업 화면에서 보이지 않게 됩니다.`
  if (!confirm(question)) { return }
  await saveBulkAssign(candidate, false)
}

// 커미션 정산 경고 — 서버가 needsConfirm 을 돌려주면 모달로 확인받고 confirmSettled=true 로 다시 저장
const settledWarning = ref<OrderSalesManagerUpdateResponse | null>(null)
const settledPendingCandidate = ref<SalesManagerCandidate | null>(null)
const settledTargetLabel = computed(() => candidateLabel(settledPendingCandidate.value))

const confirmSettledBulkAssign = async () => {
  await saveBulkAssign(settledPendingCandidate.value, true)
}

const cancelSettledBulkAssign = () => {
  settledWarning.value = null
  settledPendingCandidate.value = null
  showSalesMessage('영업 담당자 지정을 취소했습니다 — 바뀐 것은 없습니다.', 'ok')
}

const saveBulkAssign = async (candidate: SalesManagerCandidate | null, confirmSettled: boolean) => {
  if (salesSaving.value) { return }
  if (selectedBaseIds.value.size === 0) {
    // 경고를 보는 사이 목록이 새로 고쳐져 선택이 비었으면 모달만 닫는다
    settledWarning.value = null
    settledPendingCandidate.value = null
    return
  }
  const count = selectedBaseIds.value.size
  const who = candidateLabel(candidate)

  salesSaving.value = true
  try {
    const res = await orderService.updateSalesManager({
      orderIds: Array.from(selectedBaseIds.value),
      salesId: candidate?.userId ?? null,
      confirmSettled
    })
    if (res.needsConfirm) {
      // 아무것도 바뀌지 않았다 — 경고 모달을 띄우고 사용자 확인을 기다린다
      settledPendingCandidate.value = candidate
      settledWarning.value = res
      return
    }
    settledWarning.value = null
    settledPendingCandidate.value = null
    showSalesMessage(
      `${who ? `«${who}»(으)로 지정` : '지정 해제'}했습니다 — 계약 묶음 ${count}건, 발주 ${res.orderIds.length}건 (실제 변경 ${res.changedCount}건)`,
      'ok'
    )
    bulkAssignOpen.value = false
    selectedBaseIds.value = new Set()
    refresh()
  } catch (error: any) {
    settledWarning.value = null
    settledPendingCandidate.value = null
    console.error('영업 담당자 일괄 지정 실패:', error)
    showSalesMessage(error?.message || '영업 담당자 지정에 실패했습니다.', 'error')
  } finally {
    salesSaving.value = false
  }
}

// ========== 계약유형 헬퍼 함수 ==========

/**
 * 계약유형에 따른 CSS 클래스 반환
 */
const getContractTypeClass = (contractType?: ContractType): string => {
  if (!contractType) { return '' }
  switch (contractType) {
    case 'ORIGINAL':
      return 'contract-type-original'
    case 'AMENDMENT':
      return 'contract-type-amendment'
    case 'ADDITIONAL':
      return 'contract-type-additional'
    default:
      return ''
  }
}

/**
 * 계약유형 한글 표시 반환
 */
const getContractTypeLabel = (contractType?: ContractType): string => {
  if (!contractType) { return '-' }
  return CONTRACT_TYPE_LABELS[contractType] || contractType
}

// ========== 주문 상태 헬퍼 함수 ==========

/**
 * 주문 상태에 따른 CSS 클래스 반환
 */
const getStatusClass = (status?: string): string => {
  if (!status) { return 'status-pending' }
  switch (status) {
    case 'PENDING':
      return 'status-pending'
    case 'IN_PROGRESS':
      return 'status-in-progress'
    case 'PENDING_SIGNATURE':
      return 'status-pending-signature'
    case 'COMPLETED':
      return 'status-completed'
    default:
      return 'status-pending'
  }
}

/**
 * 주문 상태 한글 표시 반환
 */
const getStatusLabel = (status?: string): string => {
  if (!status) { return '대기' }
  switch (status) {
    case 'PENDING':
      return '대기'
    case 'IN_PROGRESS':
      return '진행중'
    case 'PENDING_SIGNATURE':
      return '서명대기'
    case 'COMPLETED':
      return '완료'
    default:
      return '대기'
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  // ★ 기본 기간을 대시보드와 동일한 활성 정산기간으로 맞춘다 (검색·합계 실행 전에 설정)
  await applyDefaultDateRangeFromActivePeriod()

  // 납품요구 금액 합계 로드
  loadOrderSummary()

  // URL 쿼리에서 페이지 번호 복원 (상세 페이지에서 돌아올 때)
  const pageFromQuery = route.query.page || route.query.returnPage
  if (pageFromQuery) {
    const pageNum = parseInt(pageFromQuery as string, 10)
    if (!isNaN(pageNum) && pageNum >= 0) {
      currentPage.value = pageNum
      // 페이지 번호가 있으면 해당 페이지로 데이터 로드 (search()는 페이지를 0으로 리셋함)
      refresh()
      return
    }
  }
  // 페이지 번호가 없으면 첫 페이지부터 검색
  search()
})
</script>

<style scoped>
/*
 * Order List Page Styles
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리됩니다.
 * stats-cards 스타일은 admin-tables.css로 이동됨
 */

/* 페이지 특화: 테이블 섹션 추가 스타일 */
.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 페이지 특화: 테이블 헤더 중앙 정렬 */
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.data-table tbody td {
  text-align: center;
}

.data-table tbody td.text-right {
  text-align: right;
  font-weight: 600;
  color: #1e40af;
}

/* 반응형 - 페이지 특화 스타일 */
@media (max-width: 1024px) {
  .order-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1000px;
  }
}

@media (max-width: 768px) {
  .filter-chips {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ========== 트리 테이블 스타일 ========== */
.tree-table {
  width: 100%;
}

/* 부모 행 스타일 */
.tree-parent-row {
  background: #ffffff;
}

.tree-parent-row.has-children {
  background: #f8fafc;
}

.tree-parent-row.has-children:hover {
  background: #f0f4ff;
}

/* 자식 행 스타일 */
.tree-child-row {
  background: #fefefe;
  border-left: 3px solid #e0f2fe;
}

.tree-child-row:hover {
  background: #f0f7ff;
}

.tree-child-row td {
  font-size: 0.875rem;
}

.tree-child-row .child-index {
  color: #9ca3af;
  font-size: 0.75rem;
}

/* 납품요구번호 셀 스타일 */
.delivery-request-cell {
  text-align: left !important;
  white-space: nowrap;
}

/* 날짜 셀 (납품요구일자·등록일자) — 체크 열이 권한에 따라 생기므로 nth-child 대신 클래스로 */
.data-table td.cell-nowrap {
  white-space: nowrap;
}

/* ========== 영업 담당자 (2026-09-30) ========== */
.col-check {
  width: 44px;
  text-align: center;
  cursor: default;
}

.row-check {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.tree-parent-row.row-selected {
  background: #eef2ff;
}

.sales-cell {
  max-width: 110px;
}

.sales-unassigned {
  color: #b45309;
  font-size: 0.8125rem;
}

.sm-bulk-btn {
  min-height: 36px;
}

.sm-bulk-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 1rem 1rem;
  padding: 0.875rem 1rem;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  background: #f8faff;
}

.sm-bulk-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.sm-bulk-nos {
  font-size: 0.8125rem;
  color: #475569;
  word-break: break-all;
}

.sm-bulk-foot {
  display: flex;
  justify-content: flex-start;
}

.sm-bulk-clear {
  min-height: 44px;
  padding: 0 0.875rem;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: #fff;
  color: #b91c1c;
  font-size: 0.875rem;
  cursor: pointer;
}

.sm-bulk-clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sm-guide-list {
  margin: 0;
  padding-left: 1.125rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.sm-save-msg {
  margin: 0 1rem 0.75rem;
  font-size: 0.8125rem;
}

.sm-save-msg.ok {
  color: #047857;
}

.sm-save-msg.error {
  color: #b91c1c;
  white-space: pre-line;
}

@media (max-width: 768px) {
  .sm-bulk-panel {
    margin: 0 0.5rem 0.75rem;
    padding: 0.75rem;
  }
}

.tree-toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tree-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tree-toggle-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.tree-toggle-btn i {
  font-size: 0.75rem;
}

.tree-toggle-placeholder {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.delivery-request-no {
  font-weight: 500;
  color: #1f2937;
}

.delivery-request-no.child {
  font-weight: 400;
  color: #4b5563;
  font-size: 0.875rem;
}

/* 하위 계약 개수 배지 */
.children-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.375rem;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;
  margin-left: 0.25rem;
}

/* 자식 행 인디케이터 */
.tree-child-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 8px;
}

.tree-line {
  width: 16px;
  height: 1px;
  background: #d1d5db;
  position: relative;
}

.tree-line::before {
  content: '';
  position: absolute;
  left: 0;
  top: -10px;
  width: 1px;
  height: 10px;
  background: #d1d5db;
}

/* 프로젝트명 셀 */
.project-name-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 텍스트 말줄임 처리 (수요기관, 건설사 등) */
.cell-ellipsis {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 텍스트 정렬 */
.data-table tbody td.text-left {
  text-align: left;
}

/* ========== 계약유형 배지 스타일 ========== */
.contract-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.contract-type-original {
  background: #dbeafe;
  color: #1d4ed8;
}

.contract-type-amendment {
  background: #e0f2fe;
  color: #0369a1;
}

.contract-type-additional {
  background: #ffedd5;
  color: #c2410c;
}

/* ========== 주문 상태 배지 스타일 ========== */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending {
  background: #f3f4f6;
  color: #6b7280;
}

.status-in-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-pending-signature {
  background: #fef3c7;
  color: #d97706;
}

.status-completed {
  background: #d1fae5;
  color: #059669;
}
</style>
