<template>
  <!-- 서명 발송 모달 -->
  <ProgressSignatureModal
    v-if="showSignatureModal && progressClaimData"
    :claim-data="progressClaimData"
    @close="closeSignatureModal"
    @sent="onSignatureSent"
  />

  <div v-if="isOpen && !showSignatureModal" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>기성 청구</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times" />
        </button>
      </div>

      <div class="modal-body">
        <!-- 로딩 상태 -->
        <div v-if="baselineStore.loading" class="loading-container">
          <i class="fas fa-spinner fa-spin" />
          <span>데이터를 불러오는 중...</span>
        </div>

        <template v-else>
          <!-- 이전 차수 정보 -->
          <div v-if="previousBaseline" class="previous-info">
            <div class="info-badge">
              <i class="fas fa-info-circle" />
              <span>이전 차수: {{ previousBaseline.displayName }} ({{ previousBaseline.baselineDate }})</span>
            </div>
          </div>

          <!-- 청구 가능 출하 없음 -->
          <div v-if="!hasAvailableShipments" class="empty-state">
            <i class="fas fa-inbox" />
            <p>청구 가능한 출하가 없습니다.</p>
            <span class="empty-hint">납품확인(인수증 서명)이 완료된 출하만 기성 청구할 수 있습니다.</span>
          </div>

          <!-- 청구 가능 출하 목록 -->
          <div v-else class="table-section">
            <!-- 선택 제한 경고 -->
            <div v-if="hasSelectionLimit" class="selection-warning">
              <i class="fas fa-exclamation-triangle" />
              <span>마지막 출하는 납품완료계로 처리해야 합니다. 최대 <strong>{{ maxSelectableCount }}건</strong>까지 선택 가능합니다.</span>
            </div>
            <div class="table-header">
              <h4>청구 가능 출하 목록</h4>
              <span class="hint">납품확인 완료된 출하를 선택하세요</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="checkbox-col">
                      <input
                        type="checkbox"
                        :checked="isAllSelected"
                        :indeterminate="isIndeterminate"
                        @change="toggleSelectAll"
                      >
                    </th>
                    <th>출하번호</th>
                    <th>출하일</th>
                    <th>품목요약</th>
                    <th>수량</th>
                    <th>금액</th>
                    <th>납품확인일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="shipment in availableShipments"
                    :key="shipment.shipmentId"
                    :class="{ selected: isSelected(shipment.shipmentId) }"
                    @click="toggleShipment(shipment.shipmentId)"
                  >
                    <td class="checkbox-col" @click.stop>
                      <input
                        type="checkbox"
                        :checked="isSelected(shipment.shipmentId)"
                        :disabled="!isSelected(shipment.shipmentId) && isMaxSelected"
                        @change="toggleShipment(shipment.shipmentId)"
                      >
                    </td>
                    <td>{{ shipment.shipmentId }}</td>
                    <td>{{ formatDate(shipment.shipmentDate) }}</td>
                    <td>{{ shipment.itemSummary || '-' }}</td>
                    <td class="text-right">
                      {{ formatNumber(shipment.totalQuantity) }}<span v-if="shipment.unit" class="unit-label">{{ shipment.unit }}</span>
                    </td>
                    <td class="text-right amount">
                      {{ formatCurrency(shipment.totalAmount) }}
                    </td>
                    <td>{{ formatDateTime(shipment.deliveryCompletedAt) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right">
                      <strong>선택 합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatNumber(selectedTotalQuantity) }}<span v-if="displayUnit" class="unit-label">{{ displayUnit }}</span></strong>
                    </td>
                    <td class="text-right amount">
                      <strong>{{ formatCurrency(selectedTotalAmount) }}</strong>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!--
            계약 품목 귀속 미지정 (미리보기 응답 unallocatedItems)
            → 그 수량은 계약 기준 집계에서 빠지므로 기성 청구를 막고 지정 위치로 안내
          -->
          <ContractAllocGuardNotice
            v-if="hasAvailableShipments && allocBlocked && !previewError"
            :count="unallocatedItems.length"
            :items="unallocatedItems"
            action="기성 청구"
            :to="allocLink"
            @navigate="closeModal"
          />

          <!--
            이번 청구에서 제외되는 수량 (미리보기 excludedItems)
            → 변경계약 계열의 다른 발주 품목으로 귀속된 수량 등. 차수 생성은 막지 않고 조용한 누락만 막는다(경고 표시)
          -->
          <div
            v-if="hasAvailableShipments && !previewError && excludedItems.length > 0"
            class="excluded-box"
            role="status"
          >
            <div class="excluded-title">
              <i class="fas fa-exclamation-triangle" />
              이번 청구에서 제외되는 수량 {{ excludedItems.length }}건
            </div>
            <ul class="excluded-list">
              <li v-for="(ex, idx) in excludedItems" :key="`${ex.skuId}-${idx}`">
                <b>{{ ex.skuName || ex.skuId || '-' }}</b> {{ fmtQty(ex.quantity) }}
                <span v-if="ex.reason" class="excluded-reason">— {{ ex.reason }}</span>
              </li>
            </ul>
            <small class="excluded-note">이 수량은 이번 기성 청구 금액에 들어가지 않습니다. 청구는 그대로 진행할 수 있습니다.</small>
          </div>

          <!-- 자동 계산 결과 -->
          <div v-if="hasAvailableShipments" class="calculation-result">
            <!-- 청구 금액 계산 섹션 -->
            <div class="result-section">
              <div class="result-section-header">
                청구 금액 계산
              </div>
              <div class="result-row">
                <label>선택한 출하 수</label>
                <span class="count">{{ selectedShipmentIds.length }}건</span>
              </div>
              <div class="result-row">
                <label>선택 출하 합계</label>
                <span class="amount">{{ formatCurrency(selectedTotalAmount) }}</span>
              </div>
              <template v-if="!previewError">
                <div v-if="reconcileDiff > 0" class="result-row deduction">
                  <label>(-) 원수량 정합 (전량 출하분)</label>
                  <span class="amount negative">- {{ formatCurrency(reconcileDiff) }}</span>
                </div>
                <div v-else-if="reconcileDiff < 0" class="result-row">
                  <label>(+) 원수량 정합</label>
                  <span class="amount">+ {{ formatCurrency(-reconcileDiff) }}</span>
                </div>
              </template>
              <div class="result-row highlight">
                <label>
                  청구 금액
                  <i v-if="previewLoading" class="fas fa-spinner fa-spin preview-spinner" />
                </label>
                <!-- 계산 실패 시 금액을 추정해 보여주지 않는다 (출하 금액 합은 계약 기준 청구액과 다를 수 있음) -->
                <span v-if="previewError" class="amount">-</span>
                <span v-else class="amount primary">{{ formatCurrency(claimAmount) }}</span>
              </div>
              <div v-if="previewError" class="validation-error">
                <i class="fas fa-exclamation-circle" />
                <span>{{ previewError }}</span>
              </div>
            </div>

            <!-- 품목별 금회 청구 (원수량 정합 미리보기) -->
            <div v-if="!previewError && reconciled.items.length > 0" class="result-section item-preview-section">
              <div class="result-section-header">
                품목별 금회 청구 (원수량 정합)
              </div>
              <div class="item-preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>품목</th>
                      <th class="text-right">금회수량</th>
                      <th class="text-right">잔여수량</th>
                      <th class="text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, idx) in reconciled.items" :key="idx">
                      <td>{{ it.itemName || it.itemId }}</td>
                      <td class="text-right">{{ fmtQty(it.thisTimeQuantity) }}</td>
                      <td class="text-right" :class="{ 'qty-zero': Number(it.remainingQuantity) === 0 }">{{ fmtQty(it.remainingQuantity) }}</td>
                      <td class="text-right amount">{{ formatCurrency(it.thisTimeAmount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="result-row hint-row">
                <span class="hint-text">※ 전량 출하된 품목은 원수량으로 정합되어 출하수량(짝수보정)과 다를 수 있습니다.</span>
              </div>
            </div>

            <!-- 다량납품할인 (자동 적용) 미리보기 -->
            <div v-if="!previewError && bulkPreSum > 0" class="result-section bulk-discount-section">
              <div class="result-section-header">
                <i class="fas fa-tags" /> 다량납품할인 (자동)
              </div>
              <div class="result-row">
                <label>단가합 (룰 기준)</label>
                <span class="amount">{{ formatCurrency(bulkPreSum) }}</span>
              </div>
              <div class="result-row">
                <label>적용율</label>
                <span class="rate" :class="{ 'rate-none': !bulkDiscountWillApply }">{{ bulkDiscountRateLabel }}</span>
              </div>
              <template v-if="bulkDiscountWillApply">
                <div class="result-row">
                  <label>할인 전 청구</label>
                  <span class="amount">{{ formatCurrency(claimAmount) }}</span>
                </div>
                <div class="result-row deduction">
                  <label>(-) 다량납품할인</label>
                  <span class="amount negative">- {{ formatCurrency(bulkDiscountAmount) }}</span>
                </div>
                <div class="result-row highlight">
                  <label>(=) 할인 후 청구액</label>
                  <span class="amount actual">{{ formatCurrency(discountedClaimAmount) }}</span>
                </div>
              </template>
              <div v-else class="result-row hint-row">
                <span class="hint-text">※ 단가합 1억 미만 또는 비표준 발주로 할인 미적용</span>
              </div>
            </div>

            <!-- 선급금 차감 계산 섹션 -->
            <div v-if="!previewError && hasAdvancePayment" class="result-section deduction-section">
              <div class="result-section-header">
                선급금 차감 계산
              </div>
              <div class="result-row">
                <label>선급금 비율</label>
                <span class="rate">{{ advancePaymentRate }}%</span>
              </div>
              <div class="result-row">
                <label>미정산 선급금 잔액</label>
                <span class="amount">{{ formatCurrency(advanceUnsettledBalance) }}</span>
              </div>
              <div class="result-row deduction">
                <label>(-) 선급금 차감액</label>
                <span class="amount negative">- {{ formatCurrency(advanceDeductionAmount) }}</span>
              </div>
              <div class="result-row hint-row">
                <span class="hint-text">※ MIN(청구금액×{{ advancePaymentRate }}%, 미정산잔액)</span>
              </div>
              <div class="result-row highlight">
                <label>(=) 실수금액</label>
                <span class="amount actual">{{ formatCurrency(actualReceivableAmount) }}</span>
              </div>
            </div>

            <!-- OEM 지급 예정 섹션 -->
            <div v-if="!previewError" class="result-section oem-section">
              <div class="result-row">
                <label>OEM 지급 예정 금액</label>
                <span class="amount oem">{{ formatCurrency(oemPaymentAmount) }}</span>
              </div>
            </div>
          </div>

          <!-- 비고 입력 -->
          <div v-if="hasAvailableShipments" class="form-field">
            <label>비고</label>
            <textarea
              v-model="remarks"
              class="form-textarea"
              placeholder="기성 청구 관련 메모를 입력하세요"
              rows="2"
            />
          </div>

          <!-- 유효성 검사 메시지 -->
          <div v-if="validationError" class="validation-error">
            <i class="fas fa-exclamation-circle" />
            <span>{{ validationError }}</span>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times" />
          취소
        </button>
        <!-- 청구 금액 계산 실패 시 막힘(클릭하면 이유 안내). 계산 중에는 잠시 비활성 -->
        <GuardedButton
          class="btn-primary"
          :disabled="!isValid || isSubmitting || !hasAvailableShipments || previewLoading"
          :blocked="!!previewError || allocBlocked"
          :reason="previewError ? previewErrorReason : allocReason"
          @click="submitClaim"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-paper-plane" />
          기성 청구
        </GuardedButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ProgressSignatureModal from './ProgressSignatureModal.vue'
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '~/utils/format'
import { baselineService } from '~/services/baseline.service'
import { useBaselineStore } from '~/stores/baseline'
import { useFundStore } from '~/stores/fund'
import type { BaselineListItem, AvailableShipment } from '~/types/baseline'
import type { ProgressClaimData } from '~/types/fund'
import type { UnallocatedShipmentItem, BaselineExcludedItem } from '~/types/contract-alloc'
import ContractAllocGuardNotice from '~/components/contract-alloc/ContractAllocGuardNotice.vue'
import { contractAllocBlockedReason, contractAllocDeliveryDoneLink } from '~/composables/useContractAllocStatus'

// Props
interface Props {
  isOpen: boolean
  orderId: number
  fundId: number
  /** 기성청구 시 최대 선택 가능 출하 수 (-1이면 무제한) */
  maxSelectableCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxSelectableCount: -1
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

// Stores
const baselineStore = useBaselineStore()
const fundStore = useFundStore()

// State
const isSubmitting = ref(false)
const selectedShipmentIds = ref<number[]>([])
const remarks = ref('')

// 서명 발송 모달 관련
const showSignatureModal = ref(false)
const progressClaimData = ref<ProgressClaimData | null>(null)

// 원수량 정합 미리보기 (백엔드 createItemSnapshots 재사용 → 저장될 실제 청구액과 동일)
const reconciled = ref<{ totalAmount: number; totalCost: number; items: any[] }>({
  totalAmount: 0,
  totalCost: 0,
  items: []
})
// 계약 품목 귀속 미지정 출하 품목 (미리보기 응답) — 있으면 기성 청구를 막고 지정 위치로 안내
const unallocatedItems = ref<UnallocatedShipmentItem[]>([])
// 이번 청구에서 빠지는 계약 기준 수량 (변경계약 계열 다른 발주 품목 귀속 등) — 막지 않고 경고만
const excludedItems = ref<BaselineExcludedItem[]>([])
const allocBlocked = computed(() => unallocatedItems.value.length > 0)
const allocReason = computed(() => contractAllocBlockedReason(
  unallocatedItems.value.length,
  '기성 청구',
  '화면의 [지정하러 가기] 로 이동해 «계약 품목 귀속»'
))
// 지정하러 갈 곳: 납품완료 상세가 있으면 그곳(발주 전체), 없으면 출하별 출하 수정
const allocLink = computed(() => contractAllocDeliveryDoneLink(fundStore.detail?.deliveryDoneId))
const previewLoading = ref(false)
// 미리보기 요청 순번 — 출하 선택을 빠르게 바꿀 때 늦게 도착한 이전 응답이 최신 결과를 덮어쓰지 않게 한다.
// loading 플래그도 최신 요청이 끝났을 때만 내린다.
let previewSeq = 0
// 미리보기(청구 금액 계산) 실패 문구 — 있으면 청구 금액을 표시하지 않고 기성 청구를 막는다
const previewError = ref<string | null>(null)
const previewErrorReason = '청구 금액을 계산하지 못해 기성 청구를 진행할 수 없습니다. 출하 선택을 바꾸거나 창을 닫았다가 다시 열어 주세요. 계속되면 관리자에게 문의하세요.'
let previewTimer: ReturnType<typeof setTimeout> | null = null

// 수량 표기 (소수점 2자리 보존 — 원수량 정합값 2,755.90 등)
const fmtQty = (v: any) => Number(v ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })

// Computed - 청구 가능 출하 목록
const availableShipments = computed<AvailableShipment[]>(() => {
  return baselineStore.availableShipments
})

const hasAvailableShipments = computed(() => {
  return baselineStore.hasAvailableShipments
})

// 수량 단위 (출하별 단위는 동일하므로 대표값 사용 - 합계 행 표기용)
const displayUnit = computed(() => {
  return availableShipments.value.find(s => s.unit)?.unit || ''
})

// 이전 차수 정보
const previousBaseline = computed<BaselineListItem | null>(() => {
  return baselineStore.latestBaseline
})

// 선택 제한 관련
const hasSelectionLimit = computed(() => {
  return props.maxSelectableCount >= 0 && props.maxSelectableCount < availableShipments.value.length
})

const isMaxSelected = computed(() => {
  return hasSelectionLimit.value && selectedShipmentIds.value.length >= props.maxSelectableCount
})

// 선택 관련
const isAllSelected = computed(() => {
  if (hasSelectionLimit.value) {
    return selectedShipmentIds.value.length === props.maxSelectableCount
  }
  return availableShipments.value.length > 0 &&
    selectedShipmentIds.value.length === availableShipments.value.length
})

const isIndeterminate = computed(() => {
  const max = hasSelectionLimit.value ? props.maxSelectableCount : availableShipments.value.length
  return selectedShipmentIds.value.length > 0 &&
    selectedShipmentIds.value.length < max
})

const isSelected = (shipmentId: number) => {
  return selectedShipmentIds.value.includes(shipmentId)
}

const toggleShipment = (shipmentId: number) => {
  const index = selectedShipmentIds.value.indexOf(shipmentId)
  if (index === -1) {
    // 최대 선택 수 초과 방지
    if (isMaxSelected.value) { return }
    selectedShipmentIds.value.push(shipmentId)
  } else {
    selectedShipmentIds.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedShipmentIds.value = []
  } else if (hasSelectionLimit.value) {
    // 제한 있을 때: 최대 수만큼만 선택 (앞에서부터)
    selectedShipmentIds.value = availableShipments.value
      .slice(0, props.maxSelectableCount)
      .map(s => s.shipmentId)
  } else {
    selectedShipmentIds.value = availableShipments.value.map(s => s.shipmentId)
  }
}

// 선택된 출하의 합계
const selectedTotalQuantity = computed(() => {
  return availableShipments.value
    .filter(s => selectedShipmentIds.value.includes(s.shipmentId))
    .reduce((sum, s) => sum + (s.totalQuantity || 0), 0)
})

const selectedTotalAmount = computed(() => {
  return availableShipments.value
    .filter(s => selectedShipmentIds.value.includes(s.shipmentId))
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
})

// 실제 청구 금액 = 원수량 정합(cap) 적용 합계. 미리보기 endpoint 결과(=저장값).
// 전량 출하된 SKU는 원수량으로 정합되어 selectedTotalAmount(출하금액 단순합)와 차이가 날 수 있다.
const claimAmount = computed(() => reconciled.value.totalAmount)
// 출하금액 단순합 − 정합 청구액 (양수면 전량 출하분 원수량 정합 차감)
const reconcileDiff = computed(() => selectedTotalAmount.value - claimAmount.value)

// 다량납품할인 (자동 적용) 미리보기 계산
// ※ 백엔드 BulkDiscountCalculator / ProgressPaymentService.createPayment 와 동일 규칙을 재현한 표시용 계산.
//    실제 적용/저장은 백엔드가 수행하며, 여기서는 운영자에게 적용 결과를 미리 보여줄 뿐이다.

/** 룰 판정 기준 금액 = 할인 전 단가합계 (백엔드 fund.preDiscountAmountTotal) */
const bulkPreSum = computed(() => fundStore.detail?.preDiscountAmountTotal || 0)

/** 자동 룰 적용 가능 여부 (비표준 발주 sku_id NULL 등은 false). 미세팅(undefined)이면 표준으로 간주 */
const bulkApplicable = computed(() => fundStore.detail?.bulkDiscountApplicable !== false)

/** 룰 적용율 (단가합 기준 0/2/3%) — BulkDiscountCalculator.getDiscountRate 와 동일 */
const bulkDiscountRate = computed(() => {
  const sum = bulkPreSum.value
  if (sum >= 200000000) { return 0.03 }
  if (sum >= 100000000) { return 0.02 }
  return 0
})

/** 실제 할인이 적용되는가 (율 > 0 AND 표준 발주) */
const bulkDiscountWillApply = computed(() => bulkDiscountRate.value > 0 && bulkApplicable.value)

/** 적용율 표시 라벨 */
const bulkDiscountRateLabel = computed(() => {
  if (!bulkApplicable.value) { return '미적용 (비표준 발주)' }
  if (bulkDiscountRate.value === 0) { return '0% (1억 미만)' }
  const tier = bulkPreSum.value >= 200000000 ? '≥2억' : '≥1억'
  return `${(bulkDiscountRate.value * 100).toFixed(0)}% (${tier})`
})

/** 다량납품할인액 = 청구액 − 할인 후 청구액 (조달청 표준 원단위 절사 = 10원 미만 버림).
 *  ※ 백엔드 BulkDiscountCalculator.applyRate(setScale(-1, DOWN)) 와 동일 규칙. */
const bulkDiscountAmount = computed(() => {
  if (!bulkDiscountWillApply.value) { return 0 }
  return claimAmount.value - Math.floor(claimAmount.value * (1 - bulkDiscountRate.value) / 10) * 10
})

/** 할인 후 실제 청구액 (백엔드 request_amount 와 동일). 미적용 시 청구액 그대로 */
const discountedClaimAmount = computed(() => {
  return claimAmount.value - bulkDiscountAmount.value
})

// 선급금 관련 계산
/** 선급금 신청 여부 */
const hasAdvancePayment = computed(() => {
  return fundStore.hasAdvancePayment
})

/** 선급금 비율 (%) */
const advancePaymentRate = computed(() => {
  return fundStore.detail?.advancePaymentRate || 70
})

/** 미정산 선급금 잔액 계산 - 백엔드 필드명 사용 */
const advanceUnsettledBalance = computed(() => {
  const advanceAmount = fundStore.detail?.advancePaymentAmount || 0
  const deductedTotal = fundStore.detail?.advanceDeductedTotal || 0
  return Math.max(0, advanceAmount - deductedTotal)
})

/** 선급금 차감액 = MIN(할인 후 청구금액 × 선급금율, 미정산잔액)
 *  ※ 백엔드는 다량납품할인 적용된 청구액 기준으로 차감하므로 discountedClaimAmount 사용.
 *    할인 미적용 발주는 discountedClaimAmount === selectedTotalAmount 라 기존과 동일(회귀 없음). */
const advanceDeductionAmount = computed(() => {
  if (!hasAdvancePayment.value) { return 0 }
  const calculated = Math.floor(discountedClaimAmount.value * (advancePaymentRate.value / 100))
  return Math.min(calculated, advanceUnsettledBalance.value)
})

/** 실수금액 = 할인 후 청구금액 - 선급금차감액 */
const actualReceivableAmount = computed(() => {
  return discountedClaimAmount.value - advanceDeductionAmount.value
})

// OEM 지급 예정 금액 (선급금 비율 기준) — 원수량 정합 청구액 기준
const oemPaymentAmount = computed(() => {
  return Math.round(claimAmount.value * (advancePaymentRate.value / 100))
})

// 유효성 검사
const validationError = ref<string | null>(null)

const isValid = computed(() => {
  if (selectedShipmentIds.value.length === 0) {
    validationError.value = '청구할 출하를 선택하세요.'
    return false
  }

  validationError.value = null
  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

// 원수량 정합 미리보기 로드 (선택 출하 → 저장될 실제 청구 스냅샷)
const loadPreview = async () => {
  const mySeq = ++previewSeq
  previewError.value = null
  if (selectedShipmentIds.value.length === 0) {
    reconciled.value = { totalAmount: 0, totalCost: 0, items: [] }
    unallocatedItems.value = []
    excludedItems.value = []
    previewLoading.value = false
    return
  }
  previewLoading.value = true
  try {
    const result = await baselineService.previewBaseline(props.orderId, [...selectedShipmentIds.value])
    if (mySeq !== previewSeq) { return } // 더 최신 요청이 있음 — 이 응답은 버린다
    reconciled.value = { totalAmount: result.totalAmount, totalCost: result.totalCost, items: result.items }
    unallocatedItems.value = result.unallocatedItems
    excludedItems.value = result.excludedItems
  } catch (e: any) {
    if (mySeq !== previewSeq) { return }
    // 실패 시 출하 금액 단순합으로 대신 보여주지 않는다 — 출하 금액(실물 SKU 기준)은 계약 기준 청구액과 다를 수 있다.
    console.error('기성청구 미리보기 실패', e)
    reconciled.value = { totalAmount: 0, totalCost: 0, items: [] }
    unallocatedItems.value = []
    excludedItems.value = []
    previewError.value = `청구 금액을 계산하지 못했습니다${e?.message ? ` (${e.message})` : ''}. 기성 청구를 진행할 수 없습니다.`
  } finally {
    if (mySeq === previewSeq) { previewLoading.value = false }
  }
}

// 출하 선택 변경 시 미리보기 갱신 (디바운스)
watch(selectedShipmentIds, () => {
  if (previewTimer) { clearTimeout(previewTimer) }
  // 디바운스 대기 중에도 화면 결과는 «이전 선택» 기준이다 → 진행 중인 이전 요청은 무효화하고,
  // 계산 중으로 표시해 그 사이 기성 청구 버튼이 눌리지 않게 한다.
  previewSeq++
  previewLoading.value = true
  previewTimer = setTimeout(loadPreview, 250)
}, { deep: true })

const loadData = async () => {
  if (!props.orderId) { return }

  // 초기화
  selectedShipmentIds.value = []
  remarks.value = ''
  validationError.value = null
  previewError.value = null
  reconciled.value = { totalAmount: 0, totalCost: 0, items: [] }
  unallocatedItems.value = []
  excludedItems.value = []

  // 청구 가능 출하 목록 로드
  await baselineStore.loadProgressPaymentDataV2(props.orderId)

  // 기본 선택: 제한이 있으면 최대 수만큼만, 없으면 전부
  if (hasSelectionLimit.value) {
    selectedShipmentIds.value = availableShipments.value
      .slice(0, props.maxSelectableCount)
      .map(s => s.shipmentId)
  } else {
    selectedShipmentIds.value = availableShipments.value.map(s => s.shipmentId)
  }

  // 초기 선택에 대한 정합 미리보기는 위 선택 변경 watch(디바운스)가 불러온다.
  // (여기서 직접 부르면 곧바로 watch 가 순번을 올려 그 응답을 버리므로 요청만 한 번 낭비된다)
}

const submitClaim = async () => {
  if (!isValid.value || isSubmitting.value || previewError.value || previewLoading.value || allocBlocked.value) { return }

  // 서명 없이 즉시 발행: 차수 생성 + 서명란 공란 납품확인서 PDF 발행
  isSubmitting.value = true
  try {
    await baselineService.createBaselineDirect({
      orderId: props.orderId,
      baselineType: 'PROGRESS',
      shipmentIds: selectedShipmentIds.value,
      remarks: remarks.value || undefined
    })
    alert('기성 청구가 완료되었습니다. 납품확인서 PDF를 다운로드할 수 있습니다.')
    emit('submitted')
    closeModal()
  } catch (e: any) {
    alert(e?.message || '기성 청구 처리 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 서명 발송 모달 닫기
const closeSignatureModal = () => {
  showSignatureModal.value = false
  progressClaimData.value = null
  emit('submitted')
  closeModal()
}

// 서명 발송 완료
const onSignatureSent = () => {
  showSignatureModal.value = false
  progressClaimData.value = null
  alert('기성 청구가 완료되고 서명 URL이 발송되었습니다.')
  emit('submitted')
  closeModal()
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadData()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

/* 이번 청구에서 제외되는 수량 — 경고 톤 (막지 않음) */
.excluded-box {
  margin: 0.75rem 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid #fde68a;
  border-radius: 6px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.86rem;
  line-height: 1.5;
}
.excluded-title { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; }
.excluded-list { margin: 0.35rem 0; padding-left: 1.2rem; }
.excluded-reason { color: #a16207; }
.excluded-note { display: block; opacity: 0.85; }

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
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-large {
  width: 90%;
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 로딩 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 1.5rem;
  color: #3b82f6;
}

/* 이전 차수 정보 */
.previous-info {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0369a1;
  font-size: 0.875rem;
}

.info-badge i {
  font-size: 1rem;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty-state p {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* 테이블 섹션 */
.table-section {
  flex-shrink: 0;
  min-height: 200px;
}

.table-section .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-section h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.table-section .hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table th {
  padding: 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.data-table td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tbody tr.selected {
  background: #eff6ff;
}

.data-table tbody tr.selected:hover {
  background: #dbeafe;
}

.checkbox-col {
  width: 40px;
}

.checkbox-col input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.data-table td.text-right {
  text-align: right;
}

.data-table td.amount {
  color: #1d4ed8;
  font-weight: 600;
}

/* 수량 단위 표기 (예: m²) */
.unit-label {
  margin-left: 2px;
  font-size: 0.8em;
  font-weight: 400;
  color: #6b7280;
}

.data-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

/* 계산 결과 */
.calculation-result {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #e5e7eb;
}

.result-section {
  padding: 0.75rem 1rem;
}

.result-section:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.result-section-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.deduction-section {
  background: #fef3c7;
}

.oem-section {
  background: #f0fdf4;
}

/* 품목별 정합 미리보기 */
.item-preview-section {
  background: #f8fafc;
}

.item-preview-table {
  overflow-x: auto;
  margin-top: 0.25rem;
}

.item-preview-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.item-preview-table th {
  padding: 0.4rem 0.5rem;
  background: #eef2f7;
  color: #374151;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.item-preview-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1f2937;
}

.item-preview-table th.text-right,
.item-preview-table td.text-right {
  text-align: right;
}

.item-preview-table td.amount {
  color: #1d4ed8;
  font-weight: 600;
}

.item-preview-table td.qty-zero {
  color: #16a34a;
  font-weight: 600;
}

.preview-spinner {
  margin-left: 0.35rem;
  color: #3b82f6;
  font-size: 0.8em;
}

/* 다량납품할인 미리보기 섹션 */
.bulk-discount-section {
  background: #eef2ff;
}

.bulk-discount-section .result-section-header i {
  margin-right: 0.25rem;
  color: #6366f1;
}

.result-row .rate.rate-none {
  color: #9ca3af;
  font-weight: 500;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.result-row.highlight {
  padding: 0.5rem 0;
  margin-top: 0.25rem;
}

.result-row.deduction {
  color: #dc2626;
}

.result-row.hint-row {
  justify-content: flex-end;
}

.hint-text {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.result-row label {
  font-size: 0.875rem;
  color: #374151;
}

.result-row .count {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.result-row .rate {
  font-size: 1rem;
  font-weight: 600;
  color: #1d4ed8;
}

.result-row .amount {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.result-row .amount.primary {
  font-size: 1.125rem;
  font-weight: 700;
  color: #059669;
}

.result-row .amount.negative {
  color: #dc2626;
  font-weight: 700;
}

.result-row .amount.actual {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1d4ed8;
}

.result-row .amount.oem {
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
}

/* 폼 필드 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 유효성 에러 */
.validation-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* 선택 제한 경고 */
.selection-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.selection-warning i {
  color: #f59e0b;
  font-size: 1rem;
  flex-shrink: 0;
}

/* 버튼 - admin-buttons.css에서 import됨 */
</style>
