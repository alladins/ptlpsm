<template>
  <div class="fund-detail">
    <!-- 페이지 헤더 -->
    <PageHeader
      :title="`자금 상세 - ${fundDetail?.deliveryRequestNo || ''}`"
      description="납품요구별 자금 현황을 상세하게 확인합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-arrow-left"></i>
          목록
        </button>
      </template>
    </PageHeader>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>데이터를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadData">다시 시도</button>
    </div>

    <!-- 상세 내용 -->
    <div v-else-if="fundDetail" class="content-section">
      <!-- 기본 정보 카드 -->
      <div class="info-card">
        <div class="info-card-header">
          <i class="fas fa-info-circle"></i>
          <h3>기본 정보</h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>납품요구번호</label>
            <span>{{ fundDetail.deliveryRequestNo }}</span>
          </div>
          <div class="info-item">
            <label>현장명</label>
            <span>{{ fundDetail.projectName || fundDetail.siteName }}</span>
          </div>
          <div class="info-item">
            <label>수요기관</label>
            <span>{{ fundDetail.client || fundDetail.builderCompanyName || '-' }}</span>
          </div>
          <div class="info-item">
            <label>상태</label>
            <span class="status-badge" :class="getStatusClass(fundDetail.status)">
              {{ getStatusLabel(fundDetail.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 자금 현황 요약 -->
      <div class="fund-summary-section">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-icon" style="background: #dbeafe; color: #1d4ed8;">
              <i class="fas fa-file-invoice-dollar"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">계약총액</div>
              <div class="summary-value">{{ formatCurrency(fundDetail.contractTotalAmount) }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #d97706;">
              <i class="fas fa-hand-holding-usd"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">선급금</div>
              <div class="summary-value">{{ formatCurrency(fundDetail.advancePaymentAmount || 0) }}</div>
              <div class="summary-sub">{{ getAdvancePaymentRate().toFixed(1) }}%</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #dcfce7; color: #16a34a;">
              <i class="fas fa-coins"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">기성금 누계</div>
              <div class="summary-value">{{ formatCurrency(fundDetail.progressPaymentTotal) }}</div>
              <div class="summary-sub">{{ progressPayments.length || 0 }}회</div>
            </div>
          </div>
          <!-- 선급금 차감 현황 카드 -->
          <div v-if="hasAdvancePayment" class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #b45309;">
              <i class="fas fa-balance-scale"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">선급금 차감</div>
              <div class="summary-value">{{ formatCurrency(advanceSettledTotal) }}</div>
              <div class="summary-sub" :class="advanceUnsettledBalance > 0 ? 'text-warning' : 'text-success'">
                미정산: {{ formatCurrency(advanceUnsettledBalance) }}
              </div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fee2e2; color: #dc2626;">
              <i class="fas fa-wallet"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">잔금</div>
              <div class="summary-value">{{ formatCurrency(getRemainingBalance()) }}</div>
            </div>
          </div>
        </div>

        <!-- 프로그레스 바 -->
        <div class="progress-section">
          <div class="progress-header">
            <span>수금 진행률</span>
            <span class="progress-percentage">{{ getCollectionRate().toFixed(1) }}%</span>
          </div>
          <div class="progress-bar-large">
            <div
              class="progress-segment advance"
              :style="{ width: getAdvancePaymentRate() + '%' }"
              title="선급금"
            ></div>
            <div
              class="progress-segment progress-payment"
              :style="{ width: getProgressPaymentRate() + '%' }"
              title="기성금"
            ></div>
            <div
              class="progress-segment balance"
              :style="{ width: getBalancePaymentRate() + '%' }"
              title="잔금"
            ></div>
          </div>
          <div class="progress-legend">
            <div class="legend-item">
              <span class="legend-color advance"></span>
              <span>선급금 ({{ getAdvancePaymentRate().toFixed(1) }}%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color progress-payment"></span>
              <span>기성금 ({{ getProgressPaymentRate().toFixed(1) }}%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color balance"></span>
              <span>잔금 ({{ getBalancePaymentRate().toFixed(1) }}%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color remaining"></span>
              <span>미수금 ({{ (100 - getCollectionRate()).toFixed(1) }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 탭 메뉴 -->
      <div class="tab-section">
        <div class="tab-navigation">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- 선급금 탭 -->
        <!-- 선급금 탭 -->
        <FundAdvanceTab
          v-if="activeTab === 'advance'"
          :advance-detail="advanceDetail"
          :has-advance-payment="hasAdvancePayment"
          :can-request-advance="canRequestAdvance"
          :expected-advance-amount="expectedAdvanceAmount"
          :advance-payment-rate="fundDetail?.advancePaymentRate || 70"
          :advance-button-tooltip="getAdvanceButtonTooltip()"
          @open-modal="openAdvancePaymentModal"
          @open-collection-confirm="(payment) => openCollectionConfirmModal('advance', payment)"
          @view-pdf="viewAdvancePdf"
          @download-pdf="downloadAdvancePdf"
          @download-all-pdfs="downloadAllAdvancePdfs"
        />

        <!-- 기성금 탭 -->
        <FundProgressTab
          v-if="activeTab === 'progress'"
          :progress-payments="progressPayments"
          :has-advance-payment="hasAdvancePayment"
          :can-request-progress="canRequestProgress"
          :progress-button-tooltip="getProgressButtonTooltip()"
          @open-modal="openProgressPaymentModal"
          @open-collection-confirm="(payment) => openCollectionConfirmModal('progress', payment)"
          @view-confirmation-pdf="viewConfirmationPdf"
          @view-photo-sheet-pdf="viewPhotoSheetPdf"
        />

        <!-- 잔금 탭 -->
        <FundBalanceTab
          v-if="activeTab === 'balance'"
          :remaining-balance="getRemainingBalance()"
          :is-delivery-completed="fundDetail?.isDeliveryCompleted || fundDetail?.deliveryDoneStatus === 'COMPLETED'"
          :can-complete-final-delivery="canCompleteFinalDelivery"
          :delivery-completed-at="fundDetail?.deliveryCompletedAt"
          :balance-paid-date="fundDetail?.balancePaidDate"
          :balance-paid-amount="fundDetail?.balancePaidAmount"
          @open-final-delivery-modal="openFinalDeliveryModal"
          @open-balance-confirm-modal="openBalanceConfirmModal"
        />

        <!-- OEM 지급 탭 -->
        <FundOemTab
          v-if="activeTab === 'oem'"
          :oem-payments="oemPayments"
          :progress-payment-total="fundDetail?.progressPaymentTotal || 0"
          :oem-paid-total="oemPaidTotal"
          :can-adjust-bgrade="canAdjustBgrade"
          :bgrade-button-title="bgradeButtonTitle"
          @open-oem-modal="openOemPaymentModal()"
          @open-oem-complete-modal="openOemCompleteModal"
          @confirm-delete-oem="confirmDeleteOemPayment"
          @open-bgrade-modal="openBgradeModal"
        />

      </div>
    </div>

    <!-- 기성 청구 모달 -->
    <ProgressPaymentModal
      :is-open="showProgressPaymentModal"
      :order-id="fundDetail?.orderId || 0"
      :fund-id="Number(route.params.id)"
      @close="closeProgressPaymentModal"
      @submitted="handleProgressPaymentSubmitted"
    />

    <!-- 납품완료 처리 모달 -->
    <FinalDeliveryModal
      :is-open="showFinalDeliveryModal"
      :order-id="fundDetail?.orderId || 0"
      :fund-id="Number(route.params.id)"
      @close="closeFinalDeliveryModal"
      @submitted="handleFinalDeliverySubmitted"
    />

    <!-- 선급금 신청 모달 -->
    <AdvancePaymentModal
      :is-open="showAdvancePaymentModal"
      :fund-id="Number(route.params.id)"
      :total-contract-amount="fundDetail?.contractTotalAmount || 0"
      :advance-payment-rate="fundDetail?.advancePaymentRate || 70"
      @close="closeAdvancePaymentModal"
      @submitted="handleAdvancePaymentSubmitted"
    />

    <!-- PDF 미리보기 모달 -->
    <PdfPreviewModal
      :show="showPdfModal"
      :pdf-url="currentPdfUrl"
      :file-name="currentPdfFileName"
      @close="closePdfModal"
    />

    <!-- 수금 확인 모달 -->
    <CollectionConfirmModal
      :is-open="showCollectionConfirmModal"
      :payment-type="collectionPaymentType"
      :fund-id="Number(route.params.id)"
      :payment-id="collectionPaymentId"
      :request-amount="collectionRequestAmount"
      :approved-amount="collectionApprovedAmount"
      :advance-deduction-amount="collectionAdvanceDeductionAmount"
      :actual-receivable-amount="collectionActualReceivableAmount"
      :current-settled-total="advanceSettledTotal"
      :current-unsettled-balance="advanceUnsettledBalance"
      @close="closeCollectionConfirmModal"
      @confirmed="handleCollectionConfirmed"
    />

    <!-- OEM 지급 모달 -->
    <OemPaymentModal
      :is-open="showOemPaymentModal"
      :fund-id="Number(route.params.id)"
      :existing-payment="selectedOemPayment"
      :linked-payment="linkedProgressPayment"
      :progress-payments="paidProgressPayments"
      @close="closeOemPaymentModal"
      @submitted="handleOemPaymentSubmitted"
    />

    <!-- B급 조정 모달 -->
    <BgradeItemsModal
      :is-open="showBgradeModal"
      :delivery-done-id="0"
      :shipments="fundShipments"
      @close="closeBgradeModal"
      @updated="handleBgradeUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useFundStore } from '~/stores/fund'
import { formatCurrency } from '~/utils/format'
import type { FundDetail, ProgressPaymentRequest, FundShipmentInfo } from '~/types/fund'
import ProgressPaymentModal from '~/components/fund/ProgressPaymentModal.vue'
import FinalDeliveryModal from '~/components/fund/FinalDeliveryModal.vue'
import AdvancePaymentModal from '~/components/fund/AdvancePaymentModal.vue'
import CollectionConfirmModal from '~/components/fund/CollectionConfirmModal.vue'
import OemPaymentModal from '~/components/fund/OemPaymentModal.vue'
import PdfPreviewModal from '~/components/admin/delivery/PdfPreviewModal.vue'
import BgradeItemsModal from '~/components/delivery-done/BgradeItemsModal.vue'
import FundAdvanceTab from '~/components/fund/FundAdvanceTab.vue'
import FundProgressTab from '~/components/fund/FundProgressTab.vue'
import FundOemTab from '~/components/fund/FundOemTab.vue'
import FundBalanceTab from '~/components/fund/FundBalanceTab.vue'
import { baselineService } from '~/services/baseline.service'
import { fundService } from '~/services/fund.service'
import { advancePaymentService } from '~/services/advance-payment.service'
import type { AdvancePdfType, AdvancePayment, OemPayment } from '~/types/fund'
import { shipmentService, type ShipmentListItem } from '~/services/shipment.service'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'
import { useFundCalculations } from '~/composables/useFundCalculations'
import { useFundModals } from '~/composables/useFundModals'

definePageMeta({
  layout: 'admin',
  pageTitle: '자금 상세'
})

const route = useRoute()
const router = useRouter()
const fundStore = useFundStore()

// 상태 포맷팅 함수들 (composable에서 가져옴)
// 상태 포맷팅 함수 (자금 상태만 사용, 나머지는 탭 컴포넌트에서 처리)
const { getStatusClass, getStatusLabel } = useFundStatusFormatters()

// State
const activeTab = ref('advance')
const progressPayments = ref<ProgressPaymentRequest[]>([])
const oemPayments = ref<OemPayment[]>([])

// 기성청구 Validation용 상태
const completedDeliveryCount = ref(0)  // 서명 완료된 출하 수

// 출하 목록 상태 (B급 조정 가능 여부 판단용)
const shipments = ref<ShipmentListItem[]>([])
const shipmentsLoading = ref(false)

// 탭 정의
const tabs = [
  { id: 'advance', label: '선급금', icon: 'fas fa-hand-holding-usd' },
  { id: 'progress', label: '기성금', icon: 'fas fa-coins' },
  { id: 'balance', label: '잔금', icon: 'fas fa-wallet' },
  { id: 'oem', label: 'OEM 지급', icon: 'fas fa-industry' }
]

// Computed
const fundDetail = computed(() => fundStore.detail)
const loading = computed(() => fundStore.loading)
const error = computed(() => fundStore.error)

/** 선급금 신청 여부 (1회성이므로 이미 신청했으면 버튼 비활성화) */
const hasAdvancePayment = computed(() => fundStore.hasAdvancePayment)

/** 선급금 상세 정보 (첫 번째 선급금 이력) */
const advanceDetail = computed<AdvancePayment | null>(() => fundStore.advances[0] || null)

// OEM 지급 완료 총액 계산
const oemPaidTotal = computed(() => {
  return oemPayments.value
    .filter(p => p.status === 'PAID' && p.paidAmount)
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0)
})

// 수금 완료된 기성금 목록 (OEM 지급 대상)
const paidProgressPayments = computed(() => {
  return progressPayments.value.filter(p => p.status === 'PAID')
})

// 자금 ID (composable 전달용)
const fundId = computed(() => Number(route.params.id))

// OEM 지급 목록 갱신 함수
const refreshOemPayments = async () => {
  oemPayments.value = await fundService.getOemPayments(fundId.value)
}

// 자금 계산 함수들 (composable에서 가져옴)
const {
  getAdvancePaymentRate,
  getProgressPaymentRate,
  getBalancePaymentRate,
  getCollectionRate
} = useFundCalculations(fundDetail)

// 모달 관리 Composable 초기화
const {
  // 기성금 모달
  showProgressPaymentModal,
  openProgressPaymentModal,
  closeProgressPaymentModal,
  handleProgressPaymentSubmitted,
  // 납품완료 모달
  showFinalDeliveryModal,
  openFinalDeliveryModal,
  closeFinalDeliveryModal,
  handleFinalDeliverySubmitted,
  // 선급금 모달
  showAdvancePaymentModal,
  openAdvancePaymentModal,
  closeAdvancePaymentModal,
  handleAdvancePaymentSubmitted,
  // PDF 모달
  showPdfModal,
  currentPdfUrl,
  currentPdfFileName,
  closePdfModal,
  viewAdvancePdf,
  downloadAdvancePdf,
  downloadAllAdvancePdfs,
  viewConfirmationPdf,
  viewPhotoSheetPdf,
  // 수금 확인 모달
  showCollectionConfirmModal,
  collectionPaymentType,
  collectionPaymentId,
  collectionRequestAmount,
  collectionApprovedAmount,
  collectionAdvanceDeductionAmount,
  collectionActualReceivableAmount,
  openBalanceConfirmModal,
  openCollectionConfirmModal,
  closeCollectionConfirmModal,
  handleCollectionConfirmed,
  // B급 조정 모달
  showBgradeModal,
  openBgradeModal,
  closeBgradeModal,
  handleBgradeUpdated,
  // OEM 지급 모달
  showOemPaymentModal,
  selectedOemPayment,
  linkedProgressPayment,
  openOemPaymentModal,
  openOemCompleteModal,
  confirmDeleteOemPayment,
  closeOemPaymentModal,
  handleOemPaymentSubmitted
} = useFundModals({
  fundId,
  fundDetail,
  advanceDetail,
  refreshData: async () => {
    await loadData()
  },
  refreshOemPayments
})

/** 선급금 차감 누계 (정산 완료된 선급금 총액) - 백엔드 값 사용 */
const advanceSettledTotal = computed(() => {
  return fundDetail.value?.advanceDeductedTotal || 0
})

/** 미정산 선급금 잔액 - 계산: 선급금 총액 - 차감 누계 */
const advanceUnsettledBalance = computed(() => {
  const advanceAmount = fundDetail.value?.advancePaymentAmount || 0
  return Math.max(0, advanceAmount - advanceSettledTotal.value)
})

/** 선급금 예상액 계산 */
const expectedAdvanceAmount = computed(() => {
  if (!fundDetail.value) return 0
  const rate = fundDetail.value.advancePaymentRate || 70
  return Math.floor((fundDetail.value.contractTotalAmount * rate) / 100)
})

// 선급금 문서 목록은 FundAdvanceTab 컴포넌트로 이동

/** 선급금 신청 가능 여부 (서명 완료된 출하가 0개일 때) */
const canRequestAdvance = computed(() => completedDeliveryCount.value === 0)

/** 기성금 청구 가능 여부 (서명완료 출하 1건 이상 & 납품완료 아님) */
const canRequestProgress = computed(() =>
  completedDeliveryCount.value > 0 &&
  !fundDetail.value?.isDeliveryCompleted &&
  fundDetail.value?.deliveryDoneStatus !== 'COMPLETED'
)

/** 납품완료 처리 가능 여부 (delivery_done 상태가 PENDING_SIGNATURE) */
const canCompleteFinalDelivery = computed(() =>
  fundDetail.value?.deliveryDoneStatus === 'PENDING_SIGNATURE'
)

/** B급 조정 가능 여부 (인수증 서명 완료된 출하가 있는 상태) */
const canAdjustBgrade = computed(() => {
  // 출하 목록에서 status === 'COMPLETED'인 것이 있으면 B급 조정 가능
  const hasCompletedShipment = shipments.value.some(s => s.status === 'COMPLETED')

  // 디버깅 로그
  console.warn('[B급 조정] shipments:', shipments.value.length, '건, hasCompletedShipment:', hasCompletedShipment)

  return hasCompletedShipment
})

/** B급 조정 버튼 툴팁 */
const bgradeButtonTitle = computed(() => {
  if (shipmentsLoading.value) {
    return '출하 정보를 불러오는 중...'
  }
  if (shipments.value.length === 0) {
    return 'OEM 지급 탭을 클릭하여 출하 정보를 불러오세요'
  }
  if (!shipments.value.some(s => s.status === 'COMPLETED')) {
    return '인수증 서명이 완료된 출하가 없습니다'
  }
  return 'B급 제품 가격 조정'
})

/** B급 조정 모달에 전달할 출하 목록 (FundShipmentInfo 형식으로 변환) */
const fundShipments = computed<FundShipmentInfo[]>(() => {
  return shipments.value.map(s => ({
    shipmentId: s.shipmentId,
    shipmentNo: s.shipmentNo,
    shipmentDate: s.shipmentDate,
    status: s.status,
    deliveryDoneId: s.deliveryDoneId ?? undefined,
    items: [] // 품목 정보는 모달에서 별도 처리 (현재 미사용)
  }))
})

/** 선급금 버튼 툴팁 */
const getAdvanceButtonTooltip = () => {
  if (hasAdvancePayment.value) {
    return '이미 선급금을 신청하였습니다.'
  }
  if (completedDeliveryCount.value > 0) {
    return '이미 서명이 완료된 출하가 있어 선급금 신청이 불가능합니다.'
  }
  return ''
}

/** 기성금 버튼 툴팁 */
const getProgressButtonTooltip = () => {
  if (fundDetail.value?.isDeliveryCompleted || fundDetail.value?.deliveryDoneStatus === 'COMPLETED') {
    return '납품완료된 발주는 기성금 청구가 불가능합니다.'
  }
  if (completedDeliveryCount.value === 0) {
    return '서명 완료된 출하가 없습니다.'
  }
  return ''
}

// Methods
const loadData = async () => {
  const fundId = Number(route.params.id)
  if (isNaN(fundId)) {
    router.push('/admin/funds')
    return
  }

  await fundStore.fetchDetail(fundId)

  // 기성금 이력 로드
  if (fundDetail.value) {
    await fundStore.fetchPayments(fundId)
    progressPayments.value = fundStore.payments

    // 선급금 이력 로드 (1회성 여부 체크용)
    await fundStore.fetchAdvances(fundId)

    // OEM 지급 목록 로드
    oemPayments.value = await fundService.getOemPayments(fundId)

    // 기성청구 Validation용 데이터 로드
    await loadValidationData()
  }
}

/** 기성청구 버튼 Validation용 데이터 로드 */
const loadValidationData = async () => {
  if (!fundDetail.value?.orderId) return

  try {
    // 서명 완료된 출하 수 조회 (기성금 이력에서 카운트)
    // availableShipments는 이미 서명 완료된 출하 목록이므로 해당 수를 사용
    const baselineData = await baselineService.getAvailableShipments(fundDetail.value.orderId)
    completedDeliveryCount.value = baselineData?.length || 0
    // 참고: deliveryDoneStatus, oemCompanyId는 fundDetail에서 직접 사용
  } catch (error) {
    console.error('Validation 데이터 로드 실패:', error)
  }
}

/** 출하 목록 조회 (B급 조정 가능 여부 판단용) */
const loadShipments = async () => {
  if (!fundDetail.value?.orderId) return

  shipmentsLoading.value = true
  try {
    const response = await shipmentService.getShipments({
      orderId: fundDetail.value.orderId,
      page: 0,
      size: 100,
      sort: 'shipmentDate,desc'
    })
    shipments.value = response.content || []
    console.warn('[OEM 탭] 출하 목록 조회:', shipments.value.length, '건')
  } catch (error) {
    console.error('출하 목록 조회 실패:', error)
    shipments.value = []
  } finally {
    shipmentsLoading.value = false
  }
}

const goBack = () => {
  router.push('/admin/funds')
}

// 비율/금액 계산 함수들은 useFundCalculations에서 import

/**
 * 잔여 잔금 계산 (미수금)
 */
const getRemainingBalance = (): number => {
  if (!fundDetail.value) return 0
  // 서버에서 balanceAmount 또는 outstandingAmount로 제공
  return fundDetail.value.balanceAmount || fundDetail.value.outstandingAmount || 0
}


// OEM 탭 클릭 시 출하 목록 조회
watch(activeTab, async (newTab) => {
  if (newTab === 'oem' && shipments.value.length === 0) {
    await loadShipments()
  }
})

// 초기 로드
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

/* 로딩/에러 컨테이너 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.loading-container i,
.error-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-container {
  color: #dc2626;
}

/* 컨텐츠 섹션 */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 기본 정보 카드 */
.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.info-card-header i {
  color: #3b82f6;
  font-size: 1.125rem;
}

.info-card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.75rem;
  color: #6b7280;
}

.info-item span {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

/* 자금 현황 요약 */
.fund-summary-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  font-size: 1.25rem;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.summary-sub {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* 프로그레스 바 */
.progress-section {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-header span {
  font-size: 0.875rem;
  color: #374151;
}

.progress-percentage {
  font-weight: 700;
  color: #1f2937;
}

.progress-bar-large {
  display: flex;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.progress-segment {
  height: 100%;
  transition: width 0.3s;
}

.progress-segment.advance {
  background: #fbbf24;
}

.progress-segment.progress-payment {
  background: #10b981;
}

.progress-segment.balance {
  background: #3b82f6;
}

.progress-legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.advance {
  background: #fbbf24;
}

.legend-color.progress-payment {
  background: #10b981;
}

.legend-color.balance {
  background: #3b82f6;
}

.legend-color.remaining {
  background: #e5e7eb;
}

/* 탭 섹션 */
.tab-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tab-navigation {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.02);
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: white;
}

.tab-content {
  padding: 1.5rem;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tab-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.tab-actions {
  display: flex;
  gap: 0.5rem;
}

/* 선급금/잔금 정보 */
.advance-info,
.balance-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-row span {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.info-row .amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1d4ed8;
}

.text-success {
  color: #059669 !important;
}

.text-warning {
  color: #d97706 !important;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.875rem;
}

.data-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.data-table td.text-right {
  text-align: right;
  font-weight: 500;
}

.data-table .col-amount {
  width: 180px;
  min-width: 100px;
  max-width: 140px;
}

.data-table .no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
}

/* 선급금 차감/실수금액 스타일 */
.deduction-amount {
  color: #dc2626 !important;
  font-weight: 600;
}

.actual-amount {
  color: #1d4ed8 !important;
  font-weight: 700;
}

.text-warning {
  color: #d97706;
}

.text-success {
  color: #16a34a;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-requested {
  background: #fef3c7;
  color: #d97706;
}

.status-approved {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-paid {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* 자금 상태 배지 */
.status-active {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* 이력 타임라인 */
.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.history-date {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.history-content {
  flex: 1;
}

.history-type {
  font-size: 0.75rem;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.history-desc {
  font-size: 0.875rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.history-user {
  font-size: 0.75rem;
  color: #9ca3af;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
}

/* PDF 버튼, 서명 상태 배지 - admin-buttons.css로 이동됨 */

/* 선급금 스타일은 FundAdvanceTab.vue로 이동됨 */

/* 비활성화된 버튼 스타일 */
.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-primary:disabled:hover {
  background: #9ca3af;
  transform: none;
  box-shadow: none;
}

/* B급 조정 버튼 (경고색) */
.btn-warning {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-warning:disabled {
  background: #fcd34d;
  color: #92400e;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 수금 확인 버튼 스타일 - admin-buttons.css로 이동됨 */

/* 잔금 신청 정보 섹션 */
.balance-request-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* OEM 스타일은 FundOemTab.vue로 이동됨 */

/* 반응형 */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .tab-navigation {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: 1;
    justify-content: center;
    min-width: 100px;
  }

  .progress-legend {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>