<template>
  <div class="inventory-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="재고 현황"
      description="창고별 재고 현황 및 입출고 이력을 조회합니다."
      icon="boxes"
      icon-color="green"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button v-if="!isOemManager" class="btn-action btn-primary" @click="openTransferModal">
          <i class="fas fa-exchange-alt" />
          창고간 이동
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 탭 선택 -->
      <div class="tab-container">
        <button
          :class="['tab-btn', { active: activeTab === 'inventory' }]"
          @click="switchTab('inventory')"
        >
          <i class="fas fa-boxes" />
          재고 현황
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'transactions' }]"
          @click="switchTab('transactions')"
        >
          <i class="fas fa-history" />
          입출고 이력
        </button>
      </div>

      <!-- 재고 현황 탭 -->
      <div v-if="activeTab === 'inventory'">
        <!-- 검색 조건 -->
        <div class="search-section-compact">
          <div class="search-row-single">
            <div class="search-item">
              <label>창고:</label>
              <select v-model="inventoryFilter.warehouseId" class="status-select" @change="handleSearch">
                <option :value="null">
                  전체
                </option>
                <option
                  v-for="wh in warehouseList"
                  :key="wh.warehouseId"
                  :value="wh.warehouseId"
                >
                  {{ wh.warehouseName }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>제조사:</label>
              <select v-model="inventoryFilter.oemCompanyId" class="status-select" @change="handleSearch">
                <option :value="null">
                  전체
                </option>
                <option
                  v-for="company in oemCompanyList"
                  :key="company.companyId"
                  :value="company.companyId"
                >
                  {{ company.companyName }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>검색어:</label>
              <input
                v-model="inventoryFilter.keyword"
                type="text"
                placeholder="품목코드, 품목명"
                class="text-input"
                @keyup.enter="handleSearch"
              >
            </div>
          </div>
        </div>

        <!-- 재고 테이블 -->
        <div class="table-section">
          <div class="table-header">
            <div class="table-info">
              <span>총 <strong>{{ skuGroups.length }}</strong>개 품목</span>
            </div>
            <div class="table-actions">
              <button class="btn-action" :disabled="exportingInventory" @click="handleExportInventory">
                <i v-if="exportingInventory" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-file-excel" />
                엑셀
              </button>
            </div>
          </div>

          <!-- 로딩 -->
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin" />
            <p>데이터를 불러오는 중...</p>
          </div>

          <!-- 데이터 없음 -->
          <div v-else-if="skuGroups.length === 0" class="no-data-message">
            <i class="fas fa-box-open" />
            <p>재고 데이터가 없습니다.</p>
          </div>

          <!-- 그룹핑 테이블 -->
          <div v-else class="table-container">
            <table class="data-table inventory-grouped-table">
              <thead>
                <tr>
                  <th style="width: 40px;">
                    NO
                  </th>
                  <th style="width: 110px;">
                    품목코드
                  </th>
                  <th style="width: 160px;">
                    SKU 품명
                  </th>
                  <th style="width: 100px;" class="text-right">
                    입고대기
                  </th>
                  <th style="width: 100px;" class="text-right">
                    누적입고량
                  </th>
                  <th style="width: 100px;" class="text-right">
                    누적출고량
                  </th>
                  <th style="width: 110px;" class="text-right">
                    현 재고량
                  </th>
                  <th style="width: 80px;" class="text-right">
                    수량(매)
                  </th>
                  <th style="width: 130px;">
                    최종 갱신일
                  </th>
                  <th style="width: 60px;" class="text-center">
                    OEM
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(group, index) in skuGroups" :key="group.skuId">
                  <!-- 품목 메인 행 -->
                  <tr
                    :class="['sku-group-row', { 'sku-group-expanded': expandedSkuIds[group.skuId], 'zero-stock-row': group.totalQuantity === 0 }]"
                    @click="toggleGroup(group.skuId)"
                  >
                    <td class="text-center row-no">
                      {{ index + 1 }}
                    </td>
                    <td class="sku-code">
                      {{ group.skuId }}
                    </td>
                    <td class="text-left sku-name-cell">
                      <span class="sku-main-name">{{ group.skuName }}</span>
                      <span class="sku-sub-name">{{ group.itemName }}</span>
                    </td>
                    <td class="text-right pending-inbound-qty">
                      {{ group.pendingInbound > 0 ? group.pendingInbound.toLocaleString() : '-' }} <span v-if="group.pendingInbound > 0" class="qty-unit-inline">m²</span>
                    </td>
                    <td class="text-right inbound-qty">
                      {{ group.totalInbound > 0 ? group.totalInbound.toLocaleString() : '-' }} <span v-if="group.totalInbound > 0" class="qty-unit-inline">m²</span>
                    </td>
                    <td class="text-right outbound-qty">
                      {{ group.totalOutbound > 0 ? group.totalOutbound.toLocaleString() : '-' }} <span v-if="group.totalOutbound > 0" class="qty-unit-inline">m²</span>
                    </td>
                    <td class="text-right total-quantity">
                      {{ group.totalQuantity.toLocaleString() }} <span class="qty-unit-inline">m²</span>
                    </td>
                    <td class="text-right sheet-count">
                      {{ group.totalQuantity > 0 ? Math.round(group.totalQuantity / 2).toLocaleString() + ' 매' : '-' }}
                    </td>
                    <td class="date-cell">
                      {{ formatDateTime(group.lastUpdated) }}
                    </td>
                    <td class="expand-cell">
                      <span class="expand-hint" :title="'OEM ' + group.details.length + '사'">
                        <span class="oem-count-badge">{{ group.details.length }}사</span>
                        <i :class="['fas fa-chevron-down expand-icon', { expanded: expandedSkuIds[group.skuId] }]" />
                      </span>
                    </td>
                  </tr>
                  <!-- 제조사별 상세 (인라인 카드) -->
                  <tr v-if="expandedSkuIds[group.skuId]" class="detail-container-row">
                    <td colspan="10" class="detail-container-cell">
                      <div class="detail-cards">
                        <div
                          v-for="detail in group.details"
                          :key="`${group.skuId}-${detail.inventoryId}`"
                          class="detail-card"
                          :class="{ 'zero-stock-card': (detail.quantity || 0) === 0 }"
                        >
                          <div class="card-oem">
                            {{ detail.oemCompanyName || '-' }}
                          </div>
                          <div class="card-warehouse">
                            <i class="fas fa-warehouse" />
                            {{ detail.warehouseName }}
                          </div>
                          <div class="card-quantity">
                            <span class="qty-value">{{ detail.quantity.toLocaleString() }}</span>
                            <span class="qty-unit">m²</span>
                          </div>
                          <div class="card-sheets">
                            {{ detail.quantity > 0 ? Math.round(detail.quantity / 2).toLocaleString() + ' 매' : '-' }}
                          </div>
                          <div class="card-date">
                            {{ formatDateTime(detail.lastUpdated) }}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
              <tfoot v-if="skuGroups.length > 0">
                <tr class="total-row">
                  <td colspan="3" class="text-right">
                    <strong>합계</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ grandTotalPendingInbound > 0 ? grandTotalPendingInbound.toLocaleString() + ' m²' : '-' }}</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ grandTotalInbound > 0 ? grandTotalInbound.toLocaleString() + ' m²' : '-' }}</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ grandTotalOutbound > 0 ? grandTotalOutbound.toLocaleString() + ' m²' : '-' }}</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ grandTotal.toLocaleString() }} m²</strong>
                  </td>
                  <td class="text-right">
                    <strong>{{ grandTotal > 0 ? Math.round(grandTotal / 2).toLocaleString() + ' 매' : '-' }}</strong>
                  </td>
                  <td colspan="2" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- 입출고 이력 탭 -->
      <div v-if="activeTab === 'transactions'">
        <!-- 검색 조건 -->
        <div class="search-section-compact">
          <div class="search-row-single">
            <div class="search-item">
              <label>기간:</label>
              <input v-model="txFilter.startDate" type="date" class="date-input">
              <span class="separator">~</span>
              <input v-model="txFilter.endDate" type="date" class="date-input">
            </div>
            <div class="search-item">
              <label>창고:</label>
              <select v-model="txFilter.warehouseId" class="status-select">
                <option :value="null">
                  전체
                </option>
                <option
                  v-for="wh in warehouseList"
                  :key="wh.warehouseId"
                  :value="wh.warehouseId"
                >
                  {{ wh.warehouseName }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>유형:</label>
              <select v-model="txFilter.transactionType" class="status-select">
                <option value="">
                  전체
                </option>
                <option value="INBOUND">
                  입고
                </option>
                <option value="OUTBOUND">
                  출고
                </option>
                <option value="TRANSFER_IN">
                  이동입고
                </option>
                <option value="TRANSFER_OUT">
                  이동출고
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>검색어:</label>
              <input
                v-model="txFilter.skuId"
                type="text"
                placeholder="품목코드(SKU)"
                class="text-input"
                @keyup.enter="handleTxSearch"
              >
            </div>
          </div>
        </div>

        <!-- 이력 테이블 -->
        <div class="table-section">
          <div class="table-header">
            <div class="table-info">
              <span>총 {{ txTotalElements }}개 중 {{ txStartIndex }}-{{ txEndIndex }}개 표시</span>
            </div>
            <div class="table-actions">
              <button class="btn-action" :disabled="txLoading" @click="handleTxSearch">
                <i v-if="txLoading" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-search" />
                검색
              </button>
              <button class="btn-action" :disabled="exportingTx" @click="handleExportTransaction">
                <i v-if="exportingTx" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-file-excel" />
                엑셀
              </button>
              <select v-model="txPageSize" class="page-size-select" @change="handleTxPageSizeChange">
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

          <!-- 로딩 -->
          <div v-if="txLoading" class="loading-message">
            <i class="fas fa-spinner fa-spin" />
            <p>데이터를 불러오는 중...</p>
          </div>

          <!-- 데이터 없음 -->
          <div v-else-if="txItems.length === 0" class="no-data-message">
            <i class="fas fa-clipboard-list" />
            <p>입출고 이력이 없습니다.</p>
          </div>

          <!-- 테이블 -->
          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>일시</th>
                  <th>창고명</th>
                  <th>품목코드(SKU)</th>
                  <th>품목명</th>
                  <th>유형</th>
                  <th>수량</th>
                  <th>참조</th>
                  <th>비고</th>
                  <th>작업자</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(tx, index) in txItems"
                  :key="tx.transactionId"
                  class="table-row"
                >
                  <td>{{ txStartIndex + index }}</td>
                  <td>{{ formatDateTime(tx.transactionDate) }}</td>
                  <td class="text-left">
                    {{ tx.warehouseName }}
                  </td>
                  <td>{{ tx.skuId }}</td>
                  <td class="text-left">
                    {{ tx.skuName || '-' }}
                  </td>
                  <td>
                    <span :class="['tx-type-badge', getTxTypeBadgeClass(tx.transactionType)]">
                      {{ getTxTypeLabel(tx.transactionType) }}
                    </span>
                  </td>
                  <td class="text-right">
                    {{ tx.quantity.toLocaleString() }} ㎡
                  </td>
                  <td>{{ tx.referenceType ? `${tx.referenceType}#${tx.referenceId}` : '-' }}</td>
                  <td class="text-left">
                    {{ tx.remarks || '-' }}
                  </td>
                  <td>{{ tx.createdBy || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 -->
          <Pagination
            v-if="txTotalPages > 0"
            :current-page="txCurrentPage"
            :total-pages="txTotalPages"
            :disabled="txLoading"
            @change="handleTxPageChange"
          />
        </div>
      </div>
    </div>

    <!-- 창고간 이동 모달 -->
    <Teleport to="body">
      <div v-if="showTransferModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>창고간 이동</h3>
            <button class="modal-close" @click="closeTransferModal">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="transfer-warehouse-row">
              <div class="form-group">
                <label class="form-label required">출발 창고</label>
                <select v-model="transferForm.fromWarehouseId" class="form-input" @change="onFromWarehouseChange">
                  <option :value="0" disabled>
                    창고를 선택하세요
                  </option>
                  <option
                    v-for="wh in warehouseList"
                    :key="wh.warehouseId"
                    :value="wh.warehouseId"
                  >
                    {{ wh.warehouseName }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">도착 창고</label>
                <select v-model="transferForm.toWarehouseId" class="form-input">
                  <option :value="0" disabled>
                    창고를 선택하세요
                  </option>
                  <option
                    v-for="wh in warehouseList.filter(w => w.warehouseId !== transferForm.fromWarehouseId)"
                    :key="wh.warehouseId"
                    :value="wh.warehouseId"
                  >
                    {{ wh.warehouseName }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 품목 테이블 (다중 이동) -->
            <div class="form-group">
              <label class="form-label required">이동 품목</label>
              <div v-if="loadingWarehouseSkus" class="sku-loading">
                <i class="fas fa-spinner fa-spin" /> 품목 로딩 중...
              </div>
              <div v-else-if="!transferForm.fromWarehouseId" class="sku-loading">
                출발 창고를 먼저 선택하세요
              </div>
              <div v-else-if="transferableItems.length === 0" class="sku-loading">
                해당 창고에 재고가 있는 품목이 없습니다.
              </div>
              <table v-else class="transfer-items-table">
                <thead>
                  <tr>
                    <th style="width: 30px">
                      NO
                    </th>
                    <th style="width: 80px">
                      SKU ID
                    </th>
                    <th style="width: 120px">
                      SKU 품명
                    </th>
                    <th style="width: 80px" class="text-right">
                      현재재고
                    </th>
                    <th style="width: 36px" />
                    <th style="width: 90px" class="text-right">
                      이동수량
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in transferableItems" :key="item.skuId">
                    <td class="text-center">
                      {{ idx + 1 }}
                    </td>
                    <td class="text-center">
                      {{ item.skuId }}
                    </td>
                    <td>{{ item.skuName }}</td>
                    <td class="text-right">
                      {{ item.quantity.toLocaleString() }} m²
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-fill-all"
                        title="전체 수량 이동"
                        @click="item.transferQuantity = item.quantity"
                      >
                        ▶
                      </button>
                    </td>
                    <td class="text-right">
                      <input
                        v-model.number="item.transferQuantity"
                        type="number"
                        class="table-input text-right"
                        style="width: 75px"
                        min="0"
                        step="2"
                        :max="item.quantity"
                        placeholder="0"
                      >
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-center">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      -
                    </td>
                    <td />
                    <td class="text-right">
                      <strong>{{ totalTransferQuantity.toLocaleString() }} m²</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <span v-if="hasOddQuantity" class="form-error">
                이동 수량은 짝수만 입력 가능합니다 (m² 단위)
              </span>
            </div>

            <div class="form-group">
              <label class="form-label">비고</label>
              <input
                v-model="transferForm.remarks"
                type="text"
                class="form-input"
                placeholder="비고 사항"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeTransferModal">
              취소
            </button>
            <button class="btn-submit" :disabled="transferring" @click="handleTransfer">
              <i v-if="transferring" class="fas fa-spinner fa-spin" />
              이동 처리
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 재고 현황 페이지
 * - 재고 목록 조회 (창고별, 품목별)
 * - 입출고 이력 조회
 * - 창고간 이동 처리
 */
import { ref, computed, onMounted } from 'vue'
import { inventoryService } from '~/services/inventory.service'
import { warehouseService } from '~/services/warehouse.service'
import type { InventoryItem, InventoryTransaction, TransferRequest, SkuTransactionSummary } from '~/types/inventory'
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '~/types/inventory'
import type { Warehouse } from '~/types/warehouse'
import { formatDate, formatDateTime } from '~/utils/format'
import { usePermission } from '~/composables/usePermission'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '재고 현황'
})

const { isOemManager } = usePermission()

// 탭 상태
const activeTab = ref<'inventory' | 'transactions'>('inventory')

// 창고 목록
const warehouseList = ref<Warehouse[]>([])

// ======== 재고 현황 탭 ========
const inventoryFilter = ref({
  warehouseId: null as number | null,
  oemCompanyId: null as number | null,
  keyword: ''
})

const {
  items: inventoryItems,
  loading,
  currentPage: inventoryCurrentPage,
  totalPages: inventoryTotalPages,
  totalElements: inventoryTotalElements,
  pageSize: inventoryPageSize,
  startIndex: inventoryStartIndex,
  endIndex: inventoryEndIndex,
  changePage: inventoryChangePage,
  changePageSize: inventoryChangePageSize,
  search: inventorySearch
} = useDataTable<InventoryItem>({
  fetchFunction: async (params) => {
    const response = await inventoryService.getInventoryList({
      warehouseId: inventoryFilter.value.warehouseId,
      oemCompanyId: inventoryFilter.value.oemCompanyId,
      keyword: inventoryFilter.value.keyword || undefined,
      page: 0,
      size: 9999
    })

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

// SKU별 입출고 현황 요약 데이터
const skuSummaryMap = ref<Map<string, SkuTransactionSummary>>(new Map())

const loadSkuSummary = async () => {
  try {
    const data = await inventoryService.getSkuTransactionSummary()
    const map = new Map<string, SkuTransactionSummary>()
    data.forEach(item => map.set(item.skuId, item))
    skuSummaryMap.value = map
  } catch (error) {
    console.error('SKU 현황 로드 실패:', error)
  }
}

// OEM 제조사 목록 (창고 목록에서 고유 추출)
const oemCompanyList = computed(() => {
  const map = new Map<number, string>()
  warehouseList.value.forEach((wh) => {
    if (wh.companyId && wh.companyName) {
      map.set(wh.companyId, wh.companyName)
    }
  })
  return Array.from(map.entries()).map(([companyId, companyName]) => ({
    companyId,
    companyName
  }))
})

// 수량 합계
const totalQuantitySum = computed(() => {
  return inventoryItems.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 확장 상태 관리
const expandedSkuIds = ref<Record<string, boolean>>({})

const toggleGroup = (skuId: string) => {
  expandedSkuIds.value[skuId] = !expandedSkuIds.value[skuId]
}

// SKU별 그룹핑
interface SkuGroup {
  skuId: string
  skuName: string
  itemName: string
  totalQuantity: number
  pendingInbound: number // 입고대기 = 발주수량 - 생산완료(INBOUND)
  totalInbound: number // 입고 = INBOUND + TRANSFER_IN
  totalOutbound: number // 출고 = OUTBOUND + TRANSFER_OUT
  lastUpdated: string
  details: InventoryItem[]
}

const skuGroups = computed<SkuGroup[]>(() => {
  const groupMap = new Map<string, SkuGroup>()

  inventoryItems.value.forEach((item) => {
    const key = item.skuId
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        skuId: item.skuId,
        skuName: item.skuName || '-',
        itemName: item.itemName || '-',
        totalQuantity: 0,
        pendingInbound: 0,
        totalInbound: 0,
        totalOutbound: 0,
        lastUpdated: item.lastUpdated || '',
        details: []
      })
    }
    const group = groupMap.get(key)!
    group.totalQuantity += (item.quantity || 0)
    group.details.push(item)
    if (item.lastUpdated && item.lastUpdated > group.lastUpdated) {
      group.lastUpdated = item.lastUpdated
    }
  })

  // SKU 요약 데이터 병합
  groupMap.forEach((group, skuId) => {
    const summary = skuSummaryMap.value.get(skuId)
    if (summary) {
      const ordered = summary.totalOrdered || 0
      const inbound = summary.totalInbound || 0
      const transferIn = summary.totalTransferIn || 0
      const outbound = summary.totalOutbound || 0
      const transferOut = summary.totalTransferOut || 0

      group.pendingInbound = Math.max(0, Math.round(ordered) - inbound)
      group.totalInbound = inbound + transferIn
      group.totalOutbound = outbound + transferOut
    }
  })

  // skuSummaryMap에만 존재하는 SKU 추가 (inventory 레코드 없이 이력만 있는 경우)
  skuSummaryMap.value.forEach((summary, skuId) => {
    if (!groupMap.has(skuId)) {
      const ordered = summary.totalOrdered || 0
      const inbound = summary.totalInbound || 0
      const transferIn = summary.totalTransferIn || 0
      const outbound = summary.totalOutbound || 0
      const transferOut = summary.totalTransferOut || 0

      // 이력이 있는 경우만 추가
      if (inbound > 0 || outbound > 0 || ordered > 0) {
        // PO 기반 OEM 제조사 정보로 가상 창고 상세 생성
        const virtualDetails: InventoryItem[] = []
        if (summary.oemCompanyName) {
          virtualDetails.push({
            inventoryId: 0,
            warehouseId: 0,
            warehouseName: summary.oemWarehouseName || '(입고대기)',
            oemCompanyName: summary.oemCompanyName,
            skuId,
            skuName: summary.skuName || skuId,
            itemName: summary.itemName || '-',
            quantity: 0,
            lastUpdated: ''
          })
        }
        groupMap.set(skuId, {
          skuId,
          skuName: summary.skuName || skuId,
          itemName: summary.itemName || '-',
          totalQuantity: 0,
          pendingInbound: Math.max(0, Math.round(ordered) - inbound),
          totalInbound: inbound + transferIn,
          totalOutbound: outbound + transferOut,
          lastUpdated: '',
          details: virtualDetails
        })
      }
    }
  })

  // 재고·입고대기·입출고 이력이 모두 없는 품목만 제외, SKU 품명 숫자 오름차순 정렬 (예: HYDRO-22-60T → 60)
  const extractSkuNumber = (skuName: string): number => {
    const match = skuName.match(/(\d+)\s*T?\s*$/i)
    return match ? parseInt(match[1], 10) : 9999
  }

  return Array.from(groupMap.values())
    .filter(g => g.totalQuantity > 0 || g.pendingInbound > 0 || g.totalInbound > 0 || g.totalOutbound > 0)
    .sort((a, b) => extractSkuNumber(a.skuName) - extractSkuNumber(b.skuName))
})

// 전체 합계
const grandTotal = computed(() => {
  return skuGroups.value.reduce((sum, g) => sum + g.totalQuantity, 0)
})

const grandTotalPendingInbound = computed(() => {
  return skuGroups.value.reduce((sum, g) => sum + g.pendingInbound, 0)
})

const grandTotalInbound = computed(() => {
  return skuGroups.value.reduce((sum, g) => sum + g.totalInbound, 0)
})

const grandTotalOutbound = computed(() => {
  return skuGroups.value.reduce((sum, g) => sum + g.totalOutbound, 0)
})

const handleSearch = () => {
  inventorySearch()
  loadSkuSummary()
}

// 재고현황 엑셀 다운로드 (품목 그룹 집계)
const exportingInventory = ref(false)
const handleExportInventory = async () => {
  if (exportingInventory.value) { return }
  try {
    exportingInventory.value = true
    const blob = await inventoryService.exportInventoryExcel({
      warehouseId: inventoryFilter.value.warehouseId,
      oemCompanyId: inventoryFilter.value.oemCompanyId,
      keyword: inventoryFilter.value.keyword || undefined
    })
    downloadBlob(blob, `재고현황_${getTodayDate()}.xlsx`)
  } catch (error) {
    console.error('재고현황 엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  } finally {
    exportingInventory.value = false
  }
}

// 입출고이력 엑셀 다운로드
const exportingTx = ref(false)
const handleExportTransaction = async () => {
  if (exportingTx.value) { return }
  try {
    exportingTx.value = true
    const blob = await inventoryService.exportTransactionExcel({
      warehouseId: txFilter.value.warehouseId,
      skuId: txFilter.value.skuId || undefined,
      transactionType: txFilter.value.transactionType || undefined,
      startDate: txFilter.value.startDate,
      endDate: txFilter.value.endDate
    })
    downloadBlob(blob, `입출고이력_${getTodayDate()}.xlsx`)
  } catch (error) {
    console.error('입출고이력 엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  } finally {
    exportingTx.value = false
  }
}

// Blob 다운로드 트리거
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const handleInventoryPageChange = (page: number) => {
  inventoryChangePage(page)
}

const handleInventoryPageSizeChange = () => {
  inventoryChangePageSize(inventoryPageSize.value)
}

// ======== 입출고 이력 탭 ========

// 날짜 기본값
const getThreeMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getTodayDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const txFilter = ref({
  warehouseId: null as number | null,
  skuId: '',
  transactionType: '',
  startDate: getThreeMonthsAgo(),
  endDate: getTodayDate()
})

const {
  items: txItems,
  loading: txLoading,
  currentPage: txCurrentPage,
  totalPages: txTotalPages,
  totalElements: txTotalElements,
  pageSize: txPageSize,
  startIndex: txStartIndex,
  endIndex: txEndIndex,
  changePage: txChangePage,
  changePageSize: txChangePageSize,
  search: txSearch
} = useDataTable<InventoryTransaction>({
  fetchFunction: async (params) => {
    const response = await inventoryService.getTransactionList({
      warehouseId: txFilter.value.warehouseId,
      skuId: txFilter.value.skuId || undefined,
      transactionType: txFilter.value.transactionType || undefined,
      startDate: txFilter.value.startDate,
      endDate: txFilter.value.endDate,
      page: params.page || 0,
      size: params.size || 10
    })

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

// 거래 유형 라벨
const getTxTypeLabel = (type: string): string => {
  return TRANSACTION_TYPE_LABELS[type] || type
}

// 거래 유형 배지 CSS 클래스
const getTxTypeBadgeClass = (type: string): string => {
  return TRANSACTION_TYPE_COLORS[type] || ''
}

const handleTxSearch = () => {
  txSearch()
}

const handleTxPageChange = (page: number) => {
  txChangePage(page)
}

const handleTxPageSizeChange = () => {
  txChangePageSize(txPageSize.value)
}

// 탭 전환
const switchTab = (tab: 'inventory' | 'transactions') => {
  activeTab.value = tab
  if (tab === 'inventory' && inventoryItems.value.length === 0) {
    inventorySearch()
  } else if (tab === 'transactions' && txItems.value.length === 0) {
    txSearch()
  }
}

// ======== 창고간 이동 모달 ========
const showTransferModal = ref(false)
const transferring = ref(false)
const loadingWarehouseSkus = ref(false)

// 이동 가능 품목 (각 행에 transferQuantity 추가)
interface TransferableItem extends InventoryItem {
  transferQuantity: number
}
const transferableItems = ref<TransferableItem[]>([])

const transferForm = ref({
  fromWarehouseId: 0,
  toWarehouseId: 0,
  remarks: ''
})

/** 이동수량 합계 */
const totalTransferQuantity = computed(() => {
  return transferableItems.value.reduce((sum, item) => sum + (item.transferQuantity || 0), 0)
})

/** 홀수 수량 존재 여부 */
const hasOddQuantity = computed(() => {
  return transferableItems.value.some(item => item.transferQuantity > 0 && item.transferQuantity % 2 !== 0)
})

/** 출발 창고 변경 시 해당 창고 재고 SKU 목록 로드 */
const onFromWarehouseChange = async () => {
  transferableItems.value = []

  if (!transferForm.value.fromWarehouseId) { return }

  loadingWarehouseSkus.value = true
  try {
    const response = await inventoryService.getInventoryList({
      warehouseId: transferForm.value.fromWarehouseId,
      page: 0,
      size: 9999
    })
    // 재고 > 0인 품목에 transferQuantity 추가
    transferableItems.value = (response.content || [])
      .filter((item: InventoryItem) => item.quantity > 0)
      .map((item: InventoryItem) => ({ ...item, transferQuantity: 0 }))
  } catch (error) {
    console.error('창고 품목 로드 실패:', error)
    transferableItems.value = []
  } finally {
    loadingWarehouseSkus.value = false
  }
}

const openTransferModal = () => {
  transferForm.value = { fromWarehouseId: 0, toWarehouseId: 0, remarks: '' }
  transferableItems.value = []
  showTransferModal.value = true
}

const closeTransferModal = () => {
  showTransferModal.value = false
}

const handleTransfer = async () => {
  // 유효성 검사
  if (!transferForm.value.fromWarehouseId) {
    alert('출발 창고를 선택해주세요.')
    return
  }
  if (!transferForm.value.toWarehouseId) {
    alert('도착 창고를 선택해주세요.')
    return
  }
  if (transferForm.value.fromWarehouseId === transferForm.value.toWarehouseId) {
    alert('출발 창고와 도착 창고가 같을 수 없습니다.')
    return
  }

  // 이동할 품목 필터 (수량 > 0)
  const itemsToTransfer = transferableItems.value
    .filter(item => item.transferQuantity > 0)
    .map(item => ({ skuId: item.skuId, quantity: item.transferQuantity }))

  if (itemsToTransfer.length === 0) {
    alert('이동할 품목의 수량을 입력해주세요.')
    return
  }

  // 짝수 검증
  const oddItem = transferableItems.value.find(item => item.transferQuantity > 0 && item.transferQuantity % 2 !== 0)
  if (oddItem) {
    alert(`이동 수량은 짝수만 입력 가능합니다: ${oddItem.skuName}`)
    return
  }

  // 재고 초과 검증
  const overItem = transferableItems.value.find(item => item.transferQuantity > item.quantity)
  if (overItem) {
    alert(`재고를 초과할 수 없습니다: ${overItem.skuName} (재고: ${overItem.quantity}, 입력: ${overItem.transferQuantity})`)
    return
  }

  transferring.value = true
  try {
    await inventoryService.processTransfer({
      fromWarehouseId: transferForm.value.fromWarehouseId,
      toWarehouseId: transferForm.value.toWarehouseId,
      remarks: transferForm.value.remarks,
      items: itemsToTransfer
    })
    alert(`${itemsToTransfer.length}개 품목의 창고간 이동이 완료되었습니다.`)
    closeTransferModal()
    // 데이터 새로고침
    await inventorySearch()
  } catch (error) {
    console.error('창고간 이동 실패:', error)
    alert('창고간 이동에 실패했습니다.')
  } finally {
    transferring.value = false
  }
}

// 초기 로드
onMounted(async () => {
  // 창고 목록 로드
  try {
    warehouseList.value = await warehouseService.getWarehouseList(false)
  } catch (error) {
    console.error('창고 목록 로드 실패:', error)
  }

  // 재고 현황 검색 + SKU 요약 로드
  inventorySearch()
  loadSkuSummary()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

/* 탭 컨테이너 */
.tab-container {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #3b82f6;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 600;
}

/* 거래 유형 배지 */
.tx-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tx-type-badge.bg-green-100 {
  background-color: #d1fae5;
}
.tx-type-badge.text-green-700 {
  color: #047857;
}

.tx-type-badge.bg-red-100 {
  background-color: #fee2e2;
}
.tx-type-badge.text-red-700 {
  color: #dc2626;
}

.tx-type-badge.bg-blue-100 {
  background-color: #dbeafe;
}
.tx-type-badge.text-blue-700 {
  color: #1d4ed8;
}

.tx-type-badge.bg-orange-100 {
  background-color: #ffedd5;
}
.tx-type-badge.text-orange-700 {
  color: #c2410c;
}

/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 680px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.125rem;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  color: #111827;
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-submit {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover {
  background: #2563eb;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* SKU 로딩/재고 표시 */
.transfer-warehouse-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.transfer-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 4px;
}
.transfer-items-table th,
.transfer-items-table td {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
}
.transfer-items-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.8rem;
  color: #374151;
}
.transfer-items-table tfoot td {
  background: #f0f9ff;
  font-weight: 600;
}
.btn-fill-all {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-fill-all:hover {
  background: #0ea5e9;
  color: white;
}
.sku-loading {
  padding: 8px 12px;
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sku-stock-info {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #059669;
}

.sku-stock-info strong {
  font-weight: 700;
}

.form-error {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #dc2626;
}

/* 품목별 그룹핑 테이블 */
.inventory-grouped-table {
  border-collapse: separate;
  border-spacing: 0;
}

.inventory-grouped-table th {
  white-space: nowrap;
  background: #f8fafc;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 6px 10px;
  border-bottom: 2px solid #e2e8f0;
}

.inventory-grouped-table td {
  white-space: nowrap;
  padding: 5px 10px;
}

/* 메인 행 */
.sku-group-row {
  cursor: pointer;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}

.sku-group-row:hover {
  background-color: #f0f7ff;
}

.sku-group-row td {
  border-bottom: 1px solid #f1f5f9;
}

.sku-group-expanded {
  background-color: #eff6ff;
}

.sku-group-expanded td {
  border-bottom: none;
}

/* NO 컬럼 */
.row-no {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

/* SKU 코드 */
.sku-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.02em;
}

/* SKU 품명 (2줄 레이아웃) */
.sku-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: normal !important;
  min-width: 160px;
}

.sku-main-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.sku-sub-name {
  font-size: 0.75rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* 입고대기 */
.pending-inbound-qty {
  font-weight: 600;
  color: #d97706;
  font-size: 0.9rem;
  font-feature-settings: 'tnum';
}

/* 입고 */
.inbound-qty {
  font-weight: 600;
  color: #059669;
  font-size: 0.9rem;
  font-feature-settings: 'tnum';
}

/* 출고 */
.outbound-qty {
  font-weight: 600;
  color: #dc2626;
  font-size: 0.9rem;
  font-feature-settings: 'tnum';
}

/* 총 재고수량 */
.total-quantity {
  font-weight: 700;
  color: #1e40af;
  font-size: 1rem;
  font-feature-settings: 'tnum';
}

/* 매수 */
.sheet-count {
  font-size: 0.85rem;
  color: #64748b;
  font-feature-settings: 'tnum';
}

/* 날짜 */
.date-cell {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* 펼침 셀 */
.expand-cell {
  text-align: center;
}

.expand-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 수량 뒤 단위 (인라인) */
.qty-unit-inline {
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8;
}

/* 제조사 수 배지 */
.oem-count-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.sku-group-row:hover .oem-count-badge {
  background: #c7d2fe;
}

.expand-icon {
  transition: transform 0.25s ease;
  color: #cbd5e1;
  font-size: 0.7rem;
}

.expand-icon.expanded {
  transform: rotate(180deg);
  color: #3b82f6;
}

/* 상세 카드 컨테이너 */
.detail-container-row td {
  padding: 0 !important;
  border-bottom: 1px solid #e2e8f0;
}

.detail-container-cell {
  background: #f8fafc;
}

.detail-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 10px 6px 48px;
}

/* 개별 상세 카드 */
.detail-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-rows: auto auto;
  gap: 2px 16px;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  flex: 1;
  min-width: 260px;
  max-width: 400px;
  transition: box-shadow 0.15s;
}

.detail-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detail-card.zero-stock {
  opacity: 0.5;
  background: #fafafa;
}

.card-oem {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 2px;
}

.card-warehouse {
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-warehouse i {
  font-size: 0.7rem;
  color: #94a3b8;
}

.card-quantity {
  text-align: right;
}

.card-quantity .qty-value {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e40af;
  font-feature-settings: 'tnum';
}

.card-quantity .qty-unit {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 2px;
}

.card-sheets {
  text-align: right;
  font-size: 0.8rem;
  color: #64748b;
  font-feature-settings: 'tnum';
}

.card-date {
  grid-column: 1 / -1;
  font-size: 0.7rem;
  color: #cbd5e1;
  margin-top: 2px;
}

/* 합계 행 */
.total-row td {
  background: #f1f5f9;
  border-top: 2px solid #e2e8f0;
  font-size: 0.95rem;
  padding: 6px 10px;
}

.total-row td strong {
  color: #1e293b;
}

/* 재고 0 항목 시각적 구분 */
.zero-stock-row {
  background-color: #f9fafb;
  opacity: 0.7;
}

.zero-stock-row:hover {
  opacity: 0.85;
}

.zero-stock-card {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  opacity: 0.7;
}

/* 반응형 */
@media (max-width: 1024px) {
  .inventory-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 900px;
  }
}
</style>
