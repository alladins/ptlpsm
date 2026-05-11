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
            <input v-model="searchForm.startDate" type="date" class="date-input">
            <span class="separator">~</span>
            <input v-model="searchForm.endDate" type="date" class="date-input">
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
                <th style="width: 40px;">
                  No
                </th>
                <th style="width: 150px;">
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
                  :class="{ 'has-children': group.children.length > 0 }"
                >
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
                  <td @click="editItem(group.baseOrder.orderId)">
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
                  <td class="text-right" @click="editItem(group.baseOrder.orderId)">
                    {{ formatNumber(group.baseOrder.itemTotalAmount) }}
                  </td>
                  <td @click="editItem(group.baseOrder.orderId)">
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
                    <td class="child-index" @click="editItem(child.orderId)">
                      {{ groupIndex + 1 }}-{{ childIndex + 1 }}
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
                    <td @click="editItem(child.orderId)">
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
                    <td class="text-right" @click="editItem(child.orderId)">
                      {{ formatNumber(child.itemTotalAmount) }}
                    </td>
                    <td @click="editItem(child.orderId)">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { orderService } from '~/services/order.service'
import { getCommissionPeriods } from '~/services/commission.service'
import type { OrderDetailResponse, ContractType } from '~/types/order'
import { CONTRACT_TYPE_LABELS } from '~/types/order'
// 리팩토링: 공통 모듈 import
import { formatNumber } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import { usePermission, usePermissionButtons } from '~/composables/usePermission'

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
const { canWrite, canEdit, canDelete } = usePermission()
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
const getSixMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 1개월 후 날짜 계산 (로컬 시간 기준)
const getOneMonthLater = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ★ 정책: 대시보드(admin/index.vue)와 동일하게 "활성 정산기간"을 기본 기간으로 사용한다.
//   두 페이지의 건수·합계 비교 시 항상 같은 집합을 조회하기 위함.
//   활성 정산기간 조회 실패 시에만 과거 6개월 ~ 미래 1개월 fallback 사용.
// 검색 폼 데이터 (납품요구일자 기본값은 onMounted에서 정산기간 로드 후 세팅)
const searchForm = ref({
  startDate: getSixMonthsAgo(),
  endDate: getOneMonthLater(),
  client: '',
  keyword: '',
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
    console.warn('활성 정산기간 로드 실패 — 기본값(6개월 전 ~ 1개월 후) 유지:', error)
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
      salesId: 0,
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'createdAt,desc'
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
      keyword: searchForm.value.keyword
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

// 검색 초기화 — 기본 기간은 활성 정산기간(대시보드와 동일). 로드 실패 시 과거 6개월~미래 1개월.
const handleReset = async () => {
  searchForm.value = {
    startDate: getSixMonthsAgo(),
    endDate: getOneMonthLater(),
    client: '',
    keyword: '',
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
  if (!orderData.value || orderData.value.length === 0) { return [] }

  // 기준 번호별로 그룹화
  const groupMap = new Map<string, { base: OrderDetailResponse | null; children: OrderDetailResponse[] }>()

  orderData.value.forEach((order) => {
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

/* 납품요구일자 셀 스타일 (3번째 컬럼) */
.data-table td:nth-child(3) {
  white-space: nowrap;
}

/* 등록일자 셀 스타일 (10번째 컬럼) */
.data-table td:nth-child(10) {
  white-space: nowrap;
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
