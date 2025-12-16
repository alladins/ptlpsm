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
            <span>{{ fundDetail.projectName }}</span>
          </div>
          <div class="info-item">
            <label>시공사</label>
            <span>{{ fundDetail.client || '-' }}</span>
          </div>
          <div class="info-item">
            <label>계약일</label>
            <span>{{ fundDetail.contractDate || '-' }}</span>
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
              <div class="summary-value">{{ formatCurrency(fundDetail.totalContractAmount) }}</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #d97706;">
              <i class="fas fa-hand-holding-usd"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">선급금</div>
              <div class="summary-value">{{ formatCurrency(fundDetail.advancePayment) }}</div>
              <div class="summary-sub">{{ getAdvancePaymentRate() }}%</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #dcfce7; color: #16a34a;">
              <i class="fas fa-coins"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">기성금 누계</div>
              <div class="summary-value">{{ formatCurrency(fundDetail.progressPaymentTotal) }}</div>
              <div class="summary-sub">{{ fundDetail.progressPaymentCount || 0 }}회</div>
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
        <div v-if="activeTab === 'advance'" class="tab-content">
          <div class="tab-header">
            <h4>선급금 정보</h4>
          </div>
          <div class="advance-info">
            <div class="info-row">
              <label>선급금 비율</label>
              <span>{{ fundDetail.advancePaymentRate || 0 }}%</span>
            </div>
            <div class="info-row">
              <label>선급금 금액</label>
              <span class="amount">{{ formatCurrency(fundDetail.advancePayment) }}</span>
            </div>
            <div class="info-row">
              <label>수령일</label>
              <span>{{ fundDetail.advancePaymentDate || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 기성금 탭 -->
        <div v-if="activeTab === 'progress'" class="tab-content">
          <div class="tab-header">
            <h4>기성금 이력</h4>
            <button class="btn-primary" @click="openProgressPaymentModal">
              <i class="fas fa-plus"></i>
              기성 청구하기
            </button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th>청구일</th>
                  <th>청구금액</th>
                  <th>수금일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="progressPayments.length === 0">
                  <td colspan="5" class="no-data">기성금 이력이 없습니다.</td>
                </tr>
                <tr v-else v-for="payment in progressPayments" :key="payment.paymentId">
                  <td>{{ payment.paymentSeq }}차</td>
                  <td>{{ payment.requestDate }}</td>
                  <td class="text-right">{{ formatCurrency(payment.amount) }}</td>
                  <td>{{ payment.paidDate || '-' }}</td>
                  <td>
                    <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                      {{ getPaymentStatusLabel(payment.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 잔금 탭 -->
        <div v-if="activeTab === 'balance'" class="tab-content">
          <div class="tab-header">
            <h4>잔금 정보</h4>
            <button
              class="btn-primary"
              @click="openFinalDeliveryModal"
              :disabled="!canCompleteFinalDelivery"
            >
              <i class="fas fa-check-circle"></i>
              납품완료 처리하기
            </button>
          </div>
          <div class="balance-info">
            <div class="info-row">
              <label>잔금 예정액</label>
              <span class="amount">{{ formatCurrency(getRemainingBalance()) }}</span>
            </div>
            <div class="info-row">
              <label>납품완료 상태</label>
              <span :class="fundDetail.isDeliveryCompleted ? 'text-success' : 'text-warning'">
                {{ fundDetail.isDeliveryCompleted ? '완료' : '미완료' }}
              </span>
            </div>
          </div>
        </div>

        <!-- OEM 지급 탭 -->
        <div v-if="activeTab === 'oem'" class="tab-content">
          <div class="tab-header">
            <h4>OEM 지급 현황</h4>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th>지급예정금액</th>
                  <th>지급일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!fundDetail.oemPayments || fundDetail.oemPayments.length === 0">
                  <td colspan="4" class="no-data">OEM 지급 이력이 없습니다.</td>
                </tr>
                <tr v-else v-for="oem in fundDetail.oemPayments" :key="oem.oemPaymentId">
                  <td>{{ oem.paymentSeq }}차</td>
                  <td class="text-right">{{ formatCurrency(oem.amount) }}</td>
                  <td>{{ oem.paidDate || '-' }}</td>
                  <td>
                    <span class="status-badge" :class="getPaymentStatusClass(oem.status)">
                      {{ getPaymentStatusLabel(oem.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 이력 탭 -->
        <div v-if="activeTab === 'history'" class="tab-content">
          <div class="tab-header">
            <h4>변경 이력</h4>
          </div>
          <div class="history-timeline">
            <div v-if="!fundDetail.changeHistory || fundDetail.changeHistory.length === 0" class="no-data">
              변경 이력이 없습니다.
            </div>
            <div v-else v-for="history in fundDetail.changeHistory" :key="history.historyId" class="history-item">
              <div class="history-date">{{ history.changedAt }}</div>
              <div class="history-content">
                <div class="history-type">{{ history.changeType }}</div>
                <div class="history-desc">{{ history.description }}</div>
                <div class="history-user">{{ history.changedBy }}</div>
              </div>
            </div>
          </div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useFundStore } from '~/stores/fund'
import { formatCurrency } from '~/utils/format'
import type { FundDetail, ProgressPaymentRequest, PaymentStatus } from '~/types/fund'
import ProgressPaymentModal from '~/components/fund/ProgressPaymentModal.vue'
import FinalDeliveryModal from '~/components/fund/FinalDeliveryModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '자금 상세'
})

const route = useRoute()
const router = useRouter()
const fundStore = useFundStore()

// State
const activeTab = ref('advance')
const progressPayments = ref<ProgressPaymentRequest[]>([])

// 모달 상태
const showProgressPaymentModal = ref(false)
const showFinalDeliveryModal = ref(false)

// 탭 정의
const tabs = [
  { id: 'advance', label: '선급금', icon: 'fas fa-hand-holding-usd' },
  { id: 'progress', label: '기성금', icon: 'fas fa-coins' },
  { id: 'balance', label: '잔금', icon: 'fas fa-wallet' },
  { id: 'oem', label: 'OEM 지급', icon: 'fas fa-industry' },
  { id: 'history', label: '이력', icon: 'fas fa-history' }
]

// Computed
const fundDetail = computed(() => fundStore.detail)
const loading = computed(() => fundStore.loading)
const error = computed(() => fundStore.error)

const canCompleteFinalDelivery = computed(() => {
  // 납품완료 처리 가능 조건 체크
  return fundDetail.value && !fundDetail.value.isDeliveryCompleted
})

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
  }
}

const goBack = () => {
  router.push('/admin/funds')
}

/**
 * 선급금 비율 계산
 */
const getAdvancePaymentRate = (): number => {
  if (!fundDetail.value?.totalContractAmount || fundDetail.value.totalContractAmount <= 0) return 0
  return ((fundDetail.value.advancePayment || 0) / fundDetail.value.totalContractAmount) * 100
}

/**
 * 기성금 비율 계산
 */
const getProgressPaymentRate = (): number => {
  if (!fundDetail.value?.totalContractAmount || fundDetail.value.totalContractAmount <= 0) return 0
  return ((fundDetail.value.progressPaymentTotal || 0) / fundDetail.value.totalContractAmount) * 100
}

/**
 * 잔금 비율 계산
 */
const getBalancePaymentRate = (): number => {
  if (!fundDetail.value?.totalContractAmount || fundDetail.value.totalContractAmount <= 0) return 0
  return ((fundDetail.value.balancePayment || 0) / fundDetail.value.totalContractAmount) * 100
}

/**
 * 수금률 계산
 */
const getCollectionRate = (): number => {
  return getAdvancePaymentRate() + getProgressPaymentRate() + getBalancePaymentRate()
}

/**
 * 잔여 잔금 계산
 */
const getRemainingBalance = (): number => {
  if (!fundDetail.value) return 0
  const total = fundDetail.value.totalContractAmount || 0
  const advance = fundDetail.value.advancePayment || 0
  const progress = fundDetail.value.progressPaymentTotal || 0
  const balance = fundDetail.value.balancePayment || 0
  return total - advance - progress - balance
}

/**
 * 결제 상태 클래스
 */
const getPaymentStatusClass = (status?: PaymentStatus): string => {
  if (!status) return ''
  switch (status) {
    case 'REQUESTED':
      return 'status-requested'
    case 'APPROVED':
      return 'status-approved'
    case 'PAID':
      return 'status-paid'
    case 'REJECTED':
      return 'status-rejected'
    default:
      return ''
  }
}

/**
 * 결제 상태 라벨
 */
const getPaymentStatusLabel = (status?: PaymentStatus): string => {
  if (!status) return '-'
  const labels: Record<PaymentStatus, string> = {
    REQUESTED: '요청',
    APPROVED: '승인',
    PAID: '지급완료',
    REJECTED: '반려'
  }
  return labels[status] || status
}

/**
 * 기성 청구 모달 열기
 */
const openProgressPaymentModal = () => {
  showProgressPaymentModal.value = true
}

/**
 * 기성 청구 모달 닫기
 */
const closeProgressPaymentModal = () => {
  showProgressPaymentModal.value = false
}

/**
 * 기성 청구 완료 후 처리
 */
const handleProgressPaymentSubmitted = async () => {
  closeProgressPaymentModal()
  await loadData()
}

/**
 * 납품완료 처리 모달 열기
 */
const openFinalDeliveryModal = () => {
  showFinalDeliveryModal.value = true
}

/**
 * 납품완료 처리 모달 닫기
 */
const closeFinalDeliveryModal = () => {
  showFinalDeliveryModal.value = false
}

/**
 * 납품완료 처리 완료 후 처리
 */
const handleFinalDeliverySubmitted = async () => {
  closeFinalDeliveryModal()
  await loadData()
}

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

.data-table .no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
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
