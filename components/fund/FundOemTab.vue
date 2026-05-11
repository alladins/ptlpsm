<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>OEM 지급 현황</h4>
      <div class="tab-actions">
        <button
          class="btn-recalc"
          :disabled="!needsRecalculation || isRecalculating"
          :title="recalcDisabledReason || '현재 원가 기준으로 OEM 예정총액을 재계산합니다'"
          @click="emit('recalculateOemCost')"
        >
          <i class="fas" :class="isRecalculating ? 'fa-spinner fa-spin' : 'fa-calculator'" />
          {{ isRecalculating ? '재계산 중...' : '원가 재계산' }}
        </button>
        <button
          class="btn-warning"
          :disabled="!canAdjustBgrade"
          :title="bgradeButtonTitle"
          @click="emit('openBgradeModal')"
        >
          <i class="fas fa-tags" />
          B급 조정
        </button>
        <button
          class="btn-link-po"
          @click="goToMonthlyLedger"
        >
          <i class="fas fa-external-link-alt" />
          월별 매출원장
        </button>
      </div>
    </div>

    <!-- 재계산 경고 배너 -->
    <div v-if="needsRecalculation" class="recalc-banner">
      <div class="recalc-banner-icon">
        <i class="fas fa-exclamation-triangle" />
      </div>
      <div class="recalc-banner-content">
        <div class="recalc-banner-title">
          OEM 원가가 변경되어 재계산이 필요합니다
        </div>
        <div class="recalc-banner-detail">
          현재: <strong>{{ formatCurrency(recalcPreview!.currentOemExpectedTotal) }}</strong>
          → 재계산 시: <strong>{{ formatCurrency(recalcPreview!.newOemExpectedTotal) }}</strong>
          <span class="recalc-diff" :class="recalcPreview!.difference > 0 ? 'diff-up' : 'diff-down'">
            ({{ recalcPreview!.difference > 0 ? '+' : '' }}{{ formatCurrency(recalcPreview!.difference) }})
          </span>
        </div>
      </div>
      <button
        class="recalc-banner-btn"
        :disabled="isRecalculating"
        @click="emit('recalculateOemCost')"
      >
        <i class="fas" :class="isRecalculating ? 'fa-spinner fa-spin' : 'fa-sync-alt'" />
        {{ isRecalculating ? '처리 중...' : '원가 재계산' }}
      </button>
    </div>

    <!-- OEM 지급 요약 (읽기 전용) -->
    <div class="oem-summary-card">
      <div class="summary-item">
        <span class="label">기성금 누계</span>
        <span class="value">{{ formatCurrency(progressPaymentTotal) }}</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-item">
        <span class="label">OEM 지급 예정 (예정원가)</span>
        <span class="value highlight">{{ formatCurrency(oemExpectedAmount) }}</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-item">
        <span class="label">지급 완료</span>
        <span class="value success">{{ formatCurrency(oemPaidTotal) }}</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-item">
        <span class="label">미지급</span>
        <span class="value warning">{{ formatCurrency(oemExpectedAmount - oemPaidTotal) }}</span>
      </div>
    </div>

    <!-- 안내 메시지 -->
    <div class="info-banner">
      <i class="fas fa-info-circle" />
      <div class="info-content">
        <p>OEM 지급은 <strong>제조생산 > 월별 매출원장</strong>에서 관리합니다.</p>
        <button class="btn-go-po" @click="goToMonthlyLedger">
          월별 매출원장 바로가기 <i class="fas fa-arrow-right" />
        </button>
      </div>
    </div>

    <!-- OEM 지급 이력 (읽기 전용) -->
    <div v-if="oemPayments.length > 0" class="readonly-section">
      <h5 class="readonly-title">
        <i class="fas fa-history" />
        자금관리 기준 OEM 지급 이력
      </h5>
      <div class="table-container">
        <table class="data-table oem-table">
          <colgroup>
            <col class="col-seq">
            <col class="col-company">
            <col class="col-amount">
            <col class="col-date">
            <col class="col-amount">
            <col class="col-date">
            <col class="col-status">
          </colgroup>
          <thead>
            <tr>
              <th class="text-center">
                차수
              </th>
              <th>OEM 업체</th>
              <th class="text-right">
                지급예정금액
              </th>
              <th class="text-center">
                예정일
              </th>
              <th class="text-right">
                실제지급금액
              </th>
              <th class="text-center">
                지급일
              </th>
              <th class="text-center">
                상태
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="oem in oemPayments" :key="oem.oemPaymentId">
              <td class="text-center">
                {{ oem.paymentSeq }}차
              </td>
              <td class="cell-company">
                {{ oem.oemCompanyName || '-' }}
              </td>
              <td class="text-right cell-amount">
                {{ formatCurrency(oem.scheduledAmount) }}
              </td>
              <td class="text-center cell-date">
                {{ oem.scheduledDate || '-' }}
              </td>
              <td class="text-right cell-amount">
                {{ oem.paidAmount ? formatCurrency(oem.paidAmount) : '-' }}
              </td>
              <td class="text-center cell-date">
                {{ oem.paidDate || '-' }}
              </td>
              <td class="text-center">
                <span class="status-badge" :class="getOemPaymentStatusClass(oem.status)">
                  {{ getOemPaymentStatusLabel(oem.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * OEM 지급 탭 (읽기 전용)
 * - 원가 재계산, B급 조정 기능은 유지
 * - 지급 등록/완료/삭제 기능은 발주서 관리 > OEM 지급 현황으로 이관
 */
import { computed } from 'vue'
import { useRouter } from '#imports'
import type { OemPayment, OemCostRecalcPreview } from '~/types/fund'
import { formatCurrency } from '~/utils/format'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'

interface Props {
  /** OEM 지급 목록 */
  oemPayments: OemPayment[]
  /** 기성금 누계 */
  progressPaymentTotal: number
  /** OEM 지급 완료 총액 */
  oemPaidTotal: number
  /** B급 조정 가능 여부 */
  canAdjustBgrade: boolean
  /** B급 조정 버튼 툴팁 */
  bgradeButtonTitle?: string
  /** DB의 OEM 예정총액 */
  oemExpectedTotal?: number
  /** OEM 지급 합계 (PENDING + PAID) */
  oemTotalScheduled?: number
  /** 재계산 미리보기 결과 */
  recalcPreview?: OemCostRecalcPreview | null
  /** 재계산 중 로딩 상태 */
  isRecalculating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  bgradeButtonTitle: '',
  oemExpectedTotal: 0,
  oemTotalScheduled: 0,
  recalcPreview: null,
  isRecalculating: false
})

const emit = defineEmits<{
  /** B급 조정 모달 열기 */
  openBgradeModal: []
  /** OEM 원가 재계산 */
  recalculateOemCost: []
}>()

const router = useRouter()

// 재계산 필요 여부
const needsRecalculation = computed(() => {
  return props.recalcPreview && props.recalcPreview.difference !== 0
})

// 재계산 버튼 비활성화 사유
const recalcDisabledReason = computed(() => {
  if (!props.recalcPreview) { return '납품완료 정보가 없습니다' }
  if (props.recalcPreview.difference === 0) { return '현재 원가와 동일합니다' }
  return ''
})

// 상태 포맷팅 함수
const { getOemPaymentStatusClass, getOemPaymentStatusLabel } = useFundStatusFormatters()

// OEM 지급 예정 금액 (기성금의 70%)
const oemExpectedAmount = computed(() => Math.floor((props.progressPaymentTotal || 0) * 0.7))

// 월별 매출원장으로 이동
function goToMonthlyLedger () {
  router.push('/admin/oem/monthly-ledger')
}
</script>

<style scoped>
/* 탭 헤더 */
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.tab-actions {
  display: flex;
  gap: 0.5rem;
}

/* OEM 지급 요약 카드 (다크 테마) */
.oem-summary-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  gap: 1rem;
}

.oem-summary-card .summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.oem-summary-card .summary-item .label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.oem-summary-card .summary-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  font-feature-settings: 'tnum';
}

.oem-summary-card .summary-item .value.highlight {
  color: #fbbf24;
}

.oem-summary-card .summary-item .value.success {
  color: #34d399;
}

.oem-summary-card .summary-item .value.warning {
  color: #f87171;
}

.oem-summary-card .summary-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

/* 안내 배너 */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.info-banner > i {
  color: #3b82f6;
  font-size: 1.125rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.info-content p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #1e40af;
}

.btn-go-po {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-go-po:hover {
  background: #2563eb;
}

/* 발주서 지급 관리 링크 버튼 */
.btn-link-po {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-link-po:hover {
  background: #059669;
}

/* 읽기 전용 섹션 */
.readonly-section {
  margin-top: 1rem;
}

.readonly-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
}

.readonly-title i {
  color: #9ca3af;
}

/* 테이블 컨테이너 */
.table-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  table-layout: fixed;
}

/* OEM 테이블 컬럼 너비 정의 */
.oem-table .col-seq { width: 60px; }
.oem-table .col-company { width: auto; min-width: 120px; }
.oem-table .col-amount { width: 130px; }
.oem-table .col-date { width: 110px; }
.oem-table .col-status { width: 90px; }

/* OEM 테이블 헤더 */
.data-table thead th {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.75rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.data-table thead th.text-center { text-align: center; }
.data-table thead th.text-right { text-align: right; }

/* OEM 테이블 행 스타일 */
.data-table tbody tr {
  transition: all 0.15s ease;
}

.data-table tbody tr:nth-child(even) { background: #f8fafc; }
.data-table tbody tr:hover { background: #f0f9ff; }

.data-table tbody td {
  padding: 0.75rem 0.75rem;
  font-size: 0.875rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-table tbody td.text-center { text-align: center; }
.data-table tbody td.text-right { text-align: right; }

.data-table tbody td.cell-amount {
  font-weight: 600;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}

.data-table tbody td.cell-company {
  font-weight: 500;
  color: #1f2937;
}

.data-table tbody td.cell-date {
  font-variant-numeric: tabular-nums;
  color: #64748b;
}

/* OEM 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-badge.status-paid {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #047857;
  border: 1px solid #6ee7b7;
}

/* 재계산 경고 배너 */
.recalc-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1rem;
}

.recalc-banner-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
}

.recalc-banner-content { flex: 1; }

.recalc-banner-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.25rem;
}

.recalc-banner-detail {
  font-size: 0.8125rem;
  color: #a16207;
}

.recalc-banner-detail strong { color: #78350f; }
.recalc-diff { font-weight: 600; }
.recalc-diff.diff-up { color: #dc2626; }
.recalc-diff.diff-down { color: #059669; }

.recalc-banner-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.recalc-banner-btn:hover:not(:disabled) { background: #d97706; }
.recalc-banner-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* 재계산 버튼 */
.btn-recalc {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-recalc:hover:not(:disabled) { background: #7c3aed; }
.btn-recalc:disabled { background: #c4b5fd; cursor: not-allowed; opacity: 0.7; }

/* 경고 버튼 */
.btn-warning {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-warning:hover:not(:disabled) { background: #d97706; }
.btn-warning:disabled { background: #fcd34d; color: #92400e; cursor: not-allowed; opacity: 0.7; }
</style>
