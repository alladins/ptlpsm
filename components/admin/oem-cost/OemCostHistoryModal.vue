<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container history-modal">
          <!-- Modal Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <i class="fas fa-history" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  원가 변경 이력
                </h2>
                <span class="ccm-modal-subtitle">{{ skuId }} - {{ oemCompanyName }}</span>
              </div>
            </div>
            <button class="ccm-close-button" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="ccm-modal-body">
            <!-- 현재 원가 정보 -->
            <div v-if="currentCost" class="current-cost-card">
              <div class="current-cost-header">
                <i class="fas fa-won-sign" />
                <span>현재 원가 정보</span>
              </div>
              <div class="current-cost-body">
                <div class="cost-info-item">
                  <span class="label">원가</span>
                  <span class="value">{{ formatCurrency(currentCost.costPrice) }}</span>
                </div>
                <div class="cost-info-item">
                  <span class="label">마진율</span>
                  <span class="value margin-badge" :class="getMarginClass(currentCost)">
                    {{ getMarginRateText(currentCost) }}
                  </span>
                </div>
                <div class="cost-info-item">
                  <span class="label">적용기간</span>
                  <span class="value">{{ formatDateRange(currentCost) }}</span>
                </div>
              </div>
            </div>

            <!-- 변경 이력 테이블 -->
            <div class="history-section">
              <div class="history-header">
                <span class="history-title">변경 이력</span>
                <span class="history-count">총 {{ historyList.length }}건</span>
              </div>

              <div v-if="isLoading" class="loading-container">
                <div class="loading-spinner" />
                <span>이력 조회 중...</span>
              </div>

              <div v-else-if="historyList.length === 0" class="empty-state">
                <i class="fas fa-inbox" />
                <span>변경 이력이 없습니다.</span>
              </div>

              <table v-else class="history-table">
                <thead>
                  <tr>
                    <th style="width: 125px">
                      공급사명
                    </th>
                    <th style="width: 64px; text-align: center">
                      유형
                    </th>
                    <th style="width: 92px" class="text-right">
                      이전 원가
                    </th>
                    <th style="width: 92px" class="text-right">
                      변경 원가
                    </th>
                    <th style="width: 180px">
                      적용기간
                    </th>
                    <th style="width: 84px" class="nowrap-cell">
                      변경자
                    </th>
                    <th style="width: 150px" class="nowrap-cell">
                      변경일시
                    </th>
                    <th>사유</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in historyList" :key="item.id">
                    <td class="company-cell">
                      {{ item.oemCompanyName || '-' }}
                      <span v-if="item.costSourceType === 'LEADPOWER'" class="source-badge source-leadpower">본사</span>
                    </td>
                    <td>
                      <span class="change-type-badge" :class="getChangeTypeClass(item.changeType)">
                        {{ getChangeTypeLabel(item.changeType) }}
                      </span>
                    </td>
                    <td class="text-right">
                      {{ item.oldCost ? formatCurrency(item.oldCost) : '-' }}
                    </td>
                    <td class="text-right cost-value">
                      {{ item.newCost ? formatCurrency(item.newCost) : '-' }}
                    </td>
                    <td class="period-cell" :title="`적용기간 변경: ${formatPeriodChange(item)}`">
                      {{ formatAppliedPeriod(item) }}
                    </td>
                    <td class="nowrap-cell">{{ item.changedByName || item.changedBy }}</td>
                    <td class="nowrap-cell">{{ formatDateTime(item.changedAt) }}</td>
                    <td class="reason-cell" :title="item.changeReason || ''">
                      {{ item.changeReason || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="ccm-modal-footer">
            <button type="button" class="ccm-btn-secondary" @click="handleClose">
              닫기
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatDateTime, utcToKstDateString } from '~/utils/format'
import { oemCostService } from '~/services/oem-cost.service'
import { calculateMarginRate, getMarginRateClass, COST_CHANGE_TYPE_LABELS } from '~/types/oem-cost'
import type { OemCost, OemCostHistory, CostChangeType } from '~/types/oem-cost'

interface Props {
  isOpen: boolean
  skuId: string
  oemCompanyId: number
  oemCompanyName: string
  currentCost?: OemCost | null
  unitPrice?: number // 마진율 계산용
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 상태
const isLoading = ref(false)
const historyList = ref<OemCostHistory[]>([])

// 이력 로드
const loadHistory = async () => {
  if (!props.skuId) { return }

  try {
    isLoading.value = true
    // oemCompanyId가 0이면 SKU 전체 이력, 아니면 특정 OEM 이력
    if (props.oemCompanyId) {
      historyList.value = await oemCostService.getHistory(props.skuId, props.oemCompanyId)
    } else {
      historyList.value = await oemCostService.getHistoryBySku(props.skuId)
    }
  } catch (error) {
    console.error('이력 조회 실패:', error)
    historyList.value = []
  } finally {
    isLoading.value = false
  }
}

// 닫기
const handleClose = () => {
  emit('close')
}

// 포맷팅 함수
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) { return '-' }
  return amount.toLocaleString('ko-KR') + '원'
}

const formatDateRange = (cost: OemCost): string => {
  const start = cost.effectiveDate || '-'
  const end = cost.expiryDate || '무기한'
  return `${start} ~ ${end}`
}

// 이력의 적용기간 변경 표기 (변경 전 → 변경 후) — 툴팁용 원본 표기
// effective_date/expiry_date 는 DATE 컬럼(yyyy-MM-dd)이라 타임존 변환 대상이 아니다.
// V3.13.0 이전 이력은 4개 필드가 모두 null 이므로 '-' 로 표시된다.
const formatHistoryPeriod = (from: string | null, to: string | null): string => {
  if (!from && !to) { return '-' }
  return `${from || '-'} ~ ${to || '무기한'}`
}

const formatPeriodChange = (item: OemCostHistory): string => {
  const before = formatHistoryPeriod(item.oldEffectiveDate, item.oldExpiryDate)
  const after = formatHistoryPeriod(item.newEffectiveDate, item.newExpiryDate)
  if (before === '-' && after === '-') { return '-' }
  if (before === after) { return after }
  return `${before} → ${after}`
}

/**
 * yyyy-MM-dd 문자열에서 하루 전 날짜를 구한다.
 * Date.UTC 로 다뤄 로컬 타임존 영향을 받지 않게 한다(DATE 값이라 시각 개념이 없다).
 */
const minusOneDay = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) { return dateStr }
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return dt.toISOString().slice(0, 10)
}

/**
 * 각 이력 행이 "그 변경으로 적용된 원가 구간"을 나타내도록 재구성한다.
 *
 * 마스터(item_sku_oem_cost)는 SKU+공급사당 1행만 유지하므로 과거 구간이 물리적으로 없다.
 * 따라서 이력 목록 안에서 구간을 파생 계산한다.
 *  - 시작일 = new_effective_date (없으면 old_effective_date → 이후 이력의 시작일 → 현재 원가 시작일 순 폴백)
 *  - 종료일 = 이후 이력 중 시작일이 자기보다 뒤인 첫 값의 "하루 전" (= 다음 구간이 시작되며 닫힘)
 *            없으면 자기 만료일, 그것도 없으면 무기한
 *  - 삭제(DELETE) 이력은 그 시점에 구간이 끝난 것으로 본다.
 * 공급사(+원가유형)가 섞여 오는 SKU 전체 이력 조회를 위해 그룹별로 계산한다.
 */
const appliedPeriodMap = computed<Record<number, string>>(() => {
  const result: Record<number, string> = {}
  const groups = new Map<string, OemCostHistory[]>()

  for (const item of historyList.value) {
    const key = `${item.oemCompanyId ?? ''}_${item.costSourceType ?? ''}`
    if (!groups.has(key)) { groups.set(key, []) }
    groups.get(key)!.push(item)
  }

  const currentKey = props.currentCost
    ? `${props.currentCost.oemCompanyId ?? ''}_${props.currentCost.costSourceType ?? ''}`
    : null

  for (const [groupKey, rows] of groups.entries()) {
    // 오래된 순 정렬 (동일 시각이면 id 순)
    const asc = [...rows].sort((a, b) => {
      const t = String(a.changedAt).localeCompare(String(b.changedAt))
      return t !== 0 ? t : a.id - b.id
    })

    // 1) 각 행의 시작일 후보
    const starts: (string | null)[] = asc.map(r => r.newEffectiveDate || r.oldEffectiveDate || null)

    // 2) 시작일이 없는 과거 이력(V3.13.0 이전)은 뒤쪽 이력에서 역산한다.
    //    이후 이력의 old_effective_date(= 그 시점에 적용 중이던 구간의 시작일)를 최우선으로 쓰고,
    //    없으면 이후 이력의 시작일 → 현재 원가의 시작일 순으로 폴백한다.
    const tailFallback = (currentKey && currentKey === groupKey)
      ? (props.currentCost?.effectiveDate || null)
      : null
    let laterOldEffective: string | null = null
    for (let i = starts.length - 1; i >= 0; i--) {
      if (!starts[i]) {
        const nextStart = i + 1 < starts.length ? starts[i + 1] : null
        starts[i] = laterOldEffective || nextStart || tailFallback
      }
      if (asc[i].oldEffectiveDate) { laterOldEffective = asc[i].oldEffectiveDate }
    }

    // 3) 종료일 계산
    asc.forEach((row, i) => {
      const start = starts[i]
      let end: string | null = null

      if (row.changeType === 'DELETE') {
        end = utcToKstDateString(row.changedAt) || null
      } else {
        for (let j = i + 1; j < asc.length; j++) {
          if (asc[j].changeType === 'DELETE') {
            end = utcToKstDateString(asc[j].changedAt) || null
            break
          }
          const nextStart = starts[j]
          if (nextStart && start && nextStart > start) {
            // 다음 구간 시작일 당일부터 새 원가가 적용되므로 이전 구간은 그 하루 전에 끝난다
            end = minusOneDay(nextStart)
            break
          }
        }
        if (!end) { end = row.newExpiryDate || null }
      }

      result[row.id] = start ? `${start} ~ ${end || '무기한'}` : '-'
    })
  }

  return result
})

const formatAppliedPeriod = (item: OemCostHistory): string => {
  return appliedPeriodMap.value[item.id] || '-'
}

// 마진율
const getMarginRateText = (cost: OemCost): string => {
  const rate = calculateMarginRate(props.unitPrice, cost.costPrice)
  if (rate === null) { return '-' }
  return `${rate.toFixed(1)}%`
}

const getMarginClass = (cost: OemCost): string => {
  const rate = calculateMarginRate(props.unitPrice, cost.costPrice)
  return getMarginRateClass(rate)
}

// 변경 유형
const getChangeTypeLabel = (type: CostChangeType): string => {
  return COST_CHANGE_TYPE_LABELS[type] || type
}

const getChangeTypeClass = (type: CostChangeType): string => {
  switch (type) {
    case 'CREATE': return 'type-create'
    case 'UPDATE': return 'type-update'
    case 'DELETE': return 'type-delete'
    default: return ''
  }
}

// 모달 열림 감지
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadHistory()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

/* Modal 기본 스타일 */
.ccm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.ccm-modal-container.history-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 1020px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Header */
.ccm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.ccm-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ccm-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.ccm-icon-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.ccm-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ccm-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.ccm-modal-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.ccm-close-button {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.ccm-close-button:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.ccm-close-button svg {
  width: 20px;
  height: 20px;
}

/* Body */
.ccm-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 180px);
}

/* 현재 원가 카드 */
.current-cost-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #93c5fd;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.current-cost-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid #93c5fd;
  font-weight: 600;
  color: #1e40af;
}

.current-cost-body {
  display: flex;
  gap: 2rem;
  padding: 1rem;
}

.cost-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cost-info-item .label {
  font-size: 0.75rem;
  color: #6b7280;
}

.cost-info-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* 마진 배지 */
.margin-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.margin-high {
  background: #dcfce7;
  color: #166534;
}

.margin-normal {
  background: #dbeafe;
  color: #1e40af;
}

.margin-low {
  background: #fef3c7;
  color: #92400e;
}

.margin-negative {
  background: #fee2e2;
  color: #991b1b;
}

.margin-none {
  background: #f3f4f6;
  color: #6b7280;
}

/* 이력 섹션 */
.history-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.history-title {
  font-weight: 600;
  color: #1f2937;
}

.history-count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
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

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 2rem;
}

/* 테이블 */
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  /* th 의 width 를 그대로 지키게 한다(auto 면 내용에 따라 제멋대로 재배분된다).
     마지막 '사유' 컬럼이 남은 폭을 전부 가져가고, 셀 말줄임도 이때만 정상 동작한다. */
  table-layout: fixed;
}

.history-table th {
  padding: 0.75rem 0.625rem;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.history-table td {
  padding: 0.75rem 0.625rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.history-table tr:last-child td {
  border-bottom: none;
}

.history-table .text-right {
  text-align: right;
}

.cost-value {
  font-weight: 600;
  color: #1f2937;
}

/* 사유는 폭이 정해진 다른 컬럼이 쓰고 남은 공간을 전부 차지한다.
   max-width 를 걸면 남는 공간이 있어도 그 폭에서 잘리므로 걸지 않는다
   (기존 120px 고정 탓에 사유가 실제보다 훨씬 일찍 잘렸다).
   길면 말줄임 + title 툴팁으로 전문을 보여준다. */
.reason-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-cell {
  /* td 에 display:flex 를 걸면 셀이 테이블 박스 모델에서 빠져 익명 셀이 생기고
     이름 아래에 빈 줄이 생긴다. 배지는 inline-block 이라 flex 가 필요 없다. */
  font-weight: 500;
  vertical-align: middle;
}

.company-cell .source-badge {
  margin-left: 0.375rem;
}

/* 변경자·변경일시는 줄바꿈되면 읽기 어려워 한 줄 고정 */
.nowrap-cell {
  white-space: nowrap;
}

.source-badge {
  display: inline-block;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
  flex-shrink: 0;
}

.source-leadpower {
  background: #fce7f3;
  color: #9d174d;
}

/* 변경 유형 배지 */
.change-type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-create {
  background: #dcfce7;
  color: #166534;
}

.type-update {
  background: #dbeafe;
  color: #1e40af;
}

.type-delete {
  background: #fee2e2;
  color: #991b1b;
}

/* Footer */
.ccm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ccm-btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.ccm-btn-secondary:hover {
  background: #f3f4f6;
}

/* 트랜지션 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .history-modal,
.modal-leave-active .history-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .history-modal,
.modal-leave-to .history-modal {
  transform: scale(0.95) translateY(-20px);
}

/* 적용기간 변경 셀 - 날짜가 길어 줄바꿈 허용 */
.period-cell {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.35;
  /* "2026-01-01 ~ 2026-06-15" 가 두 줄로 꺾이지 않도록 한 줄 유지 */
  white-space: nowrap;
}
</style>
