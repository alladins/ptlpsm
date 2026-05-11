<template>
  <Teleport to="body">
    <div v-if="modelValue" class="popup-overlay" @click.self="close">
      <div class="popup-content shipment-picker-popup">
        <div class="popup-header">
          <h3>미출고 출하 선택</h3>
          <button class="popup-close" @click="close">
            &times;
          </button>
        </div>

        <div class="popup-body">
          <!-- 안내 배너 -->
          <div class="info-banner">
            <i class="fas fa-info-circle" />
            출고요청이 되지 않은 출하를 선택하여 품목을 추가합니다.
          </div>

          <!-- 로딩 -->
          <div v-if="loading" class="text-center" style="padding: 2rem;">
            <i class="fas fa-spinner fa-spin" /> 출하 목록을 불러오는 중...
          </div>

          <!-- 출하 목록 -->
          <template v-else>
            <div v-if="shipments.length === 0" class="text-center" style="padding: 2rem; color: #6b7280;">
              미출고 출하가 없습니다.
            </div>

            <template v-else>
              <!-- 전체 선택 -->
              <div class="select-all-row">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  >
                  전체 선택
                </label>
                <span class="count-badge">{{ selectedIds.size }}/{{ shipments.length }}건 선택</span>
              </div>

              <!-- 출하 카드 목록 -->
              <div class="shipment-list">
                <div
                  v-for="shipment in shipments"
                  :key="shipment.shipmentId"
                  class="shipment-card"
                  :class="{ selected: selectedIds.has(shipment.shipmentId) }"
                >
                  <div class="shipment-header" @click="toggleSelect(shipment.shipmentId)">
                    <label class="checkbox-label" @click.stop>
                      <input
                        type="checkbox"
                        :checked="selectedIds.has(shipment.shipmentId)"
                        @change="toggleSelect(shipment.shipmentId)"
                      >
                    </label>
                    <span class="shipment-no">{{ shipment.shipmentNo }}</span>
                    <span class="shipment-date">{{ shipment.shipmentDate }}</span>
                    <span class="shipment-client">{{ shipment.client }}</span>
                    <span class="shipment-amount">{{ formatCurrency(shipment.shipmentAmount) }}</span>
                    <button
                      type="button"
                      class="btn-expand"
                      @click.stop="toggleExpand(shipment.shipmentId)"
                    >
                      <i :class="expandedIds.has(shipment.shipmentId) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" />
                    </button>
                  </div>

                  <!-- 아코디언 품목 상세 -->
                  <div v-if="expandedIds.has(shipment.shipmentId)" class="shipment-items">
                    <div v-if="loadingDetail.has(shipment.shipmentId)" class="text-center" style="padding: 0.75rem;">
                      <i class="fas fa-spinner fa-spin" /> 품목 로딩 중...
                    </div>
                    <table v-else-if="detailCache.has(shipment.shipmentId)" class="items-detail-table">
                      <thead>
                        <tr>
                          <th>SKU ID</th>
                          <th>품명</th>
                          <th class="text-right">
                            수량
                          </th>
                          <th class="text-right">
                            단가
                          </th>
                          <th class="text-right">
                            금액
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in detailCache.get(shipment.shipmentId)!.items" :key="item.skuId">
                          <td>{{ item.skuId }}</td>
                          <td>{{ item.skuName || item.itemName }}</td>
                          <td class="text-right">
                            {{ formatQuantity(item.shipmentQuantity) }}
                          </td>
                          <td class="text-right">
                            {{ formatCurrency(item.costPrice || item.unitPrice) }}
                          </td>
                          <td class="text-right">
                            {{ formatCurrency(item.shipmentQuantity * (item.costPrice || item.unitPrice)) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>

        <div class="popup-footer">
          <button class="btn-secondary" @click="close">
            취소
          </button>
          <button
            class="btn-primary"
            :disabled="selectedIds.size === 0 || confirming"
            @click="handleConfirm"
          >
            <i v-if="confirming" class="fas fa-spinner fa-spin" />
            {{ confirming ? '처리 중...' : `${selectedIds.size}건 출하 선택` }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentListItem, ShipmentDetailWithOrder } from '~/services/shipment.service'
import { formatCurrency, formatQuantity } from '~/utils/format'

// 선택된 품목 인터페이스
export interface SelectedShipmentItem {
  skuId: string
  skuName: string
  shipmentQuantity: number
  unitPrice: number
  costPrice: number
}

interface Props {
  modelValue: boolean
  oemCompanyId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [items: SelectedShipmentItem[], shipmentIds: number[]]
}>()

// 상태
const loading = ref(false)
const confirming = ref(false)
const shipments = ref<ShipmentListItem[]>([])
const selectedIds = ref<Set<number>>(new Set())
const expandedIds = ref<Set<number>>(new Set())
const detailCache = ref<Map<number, ShipmentDetailWithOrder>>(new Map())
const loadingDetail = ref<Set<number>>(new Set())

// 전체 선택 여부
const isAllSelected = computed(() => {
  return shipments.value.length > 0 && selectedIds.value.size === shipments.value.length
})

// 모달 열릴 때 데이터 로드
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.oemCompanyId) {
    await loadShipments()
  }
  if (!isOpen) {
    // 닫힐 때 상태 초기화
    selectedIds.value = new Set()
    expandedIds.value = new Set()
  }
})

// 출하 목록 조회
const loadShipments = async () => {
  loading.value = true
  try {
    const result = await shipmentService.getShipments({
      oemCompanyId: props.oemCompanyId,
      undispatchedOnly: true,
      page: 0,
      size: 100
    })
    shipments.value = result.content
  } catch (error) {
    console.error('미출고 출하 조회 실패:', error)
    shipments.value = []
  } finally {
    loading.value = false
  }
}

// 체크박스 토글
const toggleSelect = (shipmentId: number) => {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(shipmentId)) {
    newSet.delete(shipmentId)
  } else {
    newSet.add(shipmentId)
  }
  selectedIds.value = newSet
}

// 전체 선택/해제
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(shipments.value.map(s => s.shipmentId))
  }
}

// 아코디언 펼치기/접기
const toggleExpand = async (shipmentId: number) => {
  const newSet = new Set(expandedIds.value)
  if (newSet.has(shipmentId)) {
    newSet.delete(shipmentId)
    expandedIds.value = newSet
    return
  }

  newSet.add(shipmentId)
  expandedIds.value = newSet

  // 캐시에 없으면 상세 조회
  if (!detailCache.value.has(shipmentId)) {
    loadingDetail.value.add(shipmentId)
    try {
      const detail = await shipmentService.getShipmentDetail(shipmentId)
      detailCache.value.set(shipmentId, detail)
    } catch (error) {
      console.error(`출하 ${shipmentId} 상세 조회 실패:`, error)
    } finally {
      loadingDetail.value.delete(shipmentId)
    }
  }
}

// 확인 버튼
const handleConfirm = async () => {
  if (selectedIds.value.size === 0) { return }

  confirming.value = true
  try {
    // 선택된 출하 중 상세를 아직 안 가져온 것 일괄 조회
    const needFetch = Array.from(selectedIds.value).filter(id => !detailCache.value.has(id))
    if (needFetch.length > 0) {
      const results = await Promise.all(
        needFetch.map(id => shipmentService.getShipmentDetail(id))
      )
      for (const detail of results) {
        detailCache.value.set(detail.shipmentId, detail)
      }
    }

    // 모든 선택 출하의 품목을 flat하게 수집
    const allItems: SelectedShipmentItem[] = []
    for (const shipmentId of selectedIds.value) {
      const detail = detailCache.value.get(shipmentId)
      if (!detail?.items) { continue }

      for (const item of detail.items) {
        allItems.push({
          skuId: item.skuId,
          skuName: item.skuName || item.itemName || item.skuId,
          shipmentQuantity: item.shipmentQuantity || 0,
          unitPrice: item.unitPrice || 0,
          costPrice: item.costPrice || 0
        })
      }
    }

    emit('confirm', allItems, Array.from(selectedIds.value))
    close()
  } catch (error) {
    console.error('출하 품목 수집 실패:', error)
    alert('품목 정보를 가져오는 데 실패했습니다.')
  } finally {
    confirming.value = false
  }
}

// 모달 닫기
const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

.shipment-picker-popup {
  width: 720px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

/* 안내 배너 */
.info-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}

/* 전체 선택 행 */
.select-all-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.count-badge {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

/* 출하 카드 */
.shipment-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.shipment-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.shipment-card.selected {
  border-color: #3b82f6;
  background: #f0f7ff;
}

.shipment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background 0.15s;
}

.shipment-header:hover {
  background: #f9fafb;
}

.shipment-card.selected .shipment-header:hover {
  background: #e8f2ff;
}

.shipment-no {
  font-weight: 600;
  color: #1f2937;
  min-width: 100px;
}

.shipment-date {
  color: #6b7280;
  min-width: 85px;
}

.shipment-client {
  flex: 1;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shipment-amount {
  font-weight: 500;
  color: #1f2937;
  min-width: 100px;
  text-align: right;
}

.btn-expand {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.75rem;
  transition: color 0.15s;
}

.btn-expand:hover {
  color: #374151;
}

/* 아코디언 품목 상세 */
.shipment-items {
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  padding: 0.5rem 0.75rem;
}

.items-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.items-detail-table th {
  padding: 0.375rem 0.5rem;
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.items-detail-table td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}
</style>
