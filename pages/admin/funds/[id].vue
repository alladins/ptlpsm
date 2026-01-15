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
              <div class="summary-value">{{ formatCurrency(fundDetail.advancePaymentAmount) }}</div>
              <div class="summary-sub">{{ fundDetail.advancePaymentRate || 0 }}%</div>
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
            <button
              class="btn-primary"
              @click="openAdvancePaymentModal"
              :disabled="!canRequestAdvance || hasAdvancePayment"
              :title="getAdvanceButtonTooltip()"
            >
              <i class="fas fa-plus"></i>
              {{ hasAdvancePayment ? '선급금 신청완료' : '선급금 신청하기' }}
            </button>
          </div>

          <!-- 케이스 1: 선급금 미신청 -->
          <div v-if="!hasAdvancePayment" class="advance-info">
            <div class="info-row">
              <label>선급금 비율</label>
              <span>{{ fundDetail.advancePaymentRate || 70 }}%</span>
            </div>
            <div class="info-row">
              <label>선급금 예상액</label>
              <span class="amount">{{ formatCurrency(expectedAdvanceAmount) }}</span>
            </div>
            <div class="info-row">
              <label>상태</label>
              <span class="status-badge status-pending">미신청</span>
            </div>
            <div class="advance-notice">
              <i class="fas fa-info-circle"></i>
              <span>선급금을 신청하면 5종의 PDF 문서가 자동 생성됩니다.</span>
            </div>
          </div>

          <!-- 케이스 2: 선급금 신청 완료 -->
          <div v-else class="advance-info">
            <div class="info-row">
              <label>신청 금액</label>
              <span class="amount">{{ formatCurrency(advanceDetail?.requestAmount) }}</span>
            </div>
            <div class="info-row">
              <label>신청일</label>
              <span>{{ advanceDetail?.requestDate || '-' }}</span>
            </div>
            <div class="info-row">
              <label>상태</label>
              <span class="status-badge" :class="getAdvanceStatusClass(advanceDetail?.status)">
                {{ getAdvanceStatusLabel(advanceDetail?.status) }}
              </span>
            </div>
            <div v-if="advanceDetail?.approvalDate" class="info-row">
              <label>승인일</label>
              <span>{{ advanceDetail.approvalDate }}</span>
            </div>
            <div v-if="advanceDetail?.paymentDate" class="info-row">
              <label>입금일</label>
              <span>{{ advanceDetail.paymentDate }}</span>
            </div>
            <div v-if="advanceDetail?.approvedAmount" class="info-row">
              <label>입금 금액</label>
              <span class="amount">{{ formatCurrency(advanceDetail.approvedAmount) }}</span>
            </div>
            <div v-if="advanceDetail?.remarks" class="info-row">
              <label>비고</label>
              <span>{{ advanceDetail.remarks }}</span>
            </div>

            <!-- 수금확인 버튼 (승인 상태일 때만 표시) -->
            <div v-if="advanceDetail?.status === 'APPROVED'" class="collection-confirm-section">
              <button
                class="btn-collection-confirm-lg"
                @click="openCollectionConfirmModal('advance', advanceDetail)"
              >
                <i class="fas fa-check-circle"></i>
                수금 확인하기
              </button>
            </div>

            <!-- PDF 문서 섹션 -->
            <div class="advance-documents">
              <h5>
                <i class="fas fa-file-pdf"></i>
                관련 문서
              </h5>
              <div class="document-list">
                <div v-for="doc in advanceDocuments" :key="doc.type" class="document-item">
                  <div class="document-info">
                    <i :class="['fas', doc.icon, doc.iconColor]"></i>
                    <span>{{ doc.label }}</span>
                  </div>
                  <div class="document-actions">
                    <button class="btn-pdf-view" @click="viewAdvancePdf(doc.type)">
                      <i class="fas fa-eye"></i>
                      보기
                    </button>
                    <button class="btn-pdf-download" @click="downloadAdvancePdf(doc.type)">
                      <i class="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
              <button class="btn-download-all" @click="downloadAllAdvancePdfs">
                <i class="fas fa-file-archive"></i>
                전체 문서 다운로드 (ZIP)
              </button>
            </div>
          </div>
        </div>

        <!-- 기성금 탭 -->
        <div v-if="activeTab === 'progress'" class="tab-content">
          <div class="tab-header">
            <h4>기성금 이력</h4>
            <button
              class="btn-primary"
              @click="openProgressPaymentModal"
              :disabled="!canRequestProgress"
              :title="getProgressButtonTooltip()"
            >
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
                  <th class="col-amount">청구금액</th>
                  <th>서명상태</th>
                  <th>수금일</th>
                  <th>상태</th>
                  <th>PDF</th>
                  <th>수금확인</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="progressPayments.length === 0">
                  <td colspan="8" class="no-data">기성금 이력이 없습니다.</td>
                </tr>
                <tr v-else v-for="payment in progressPayments" :key="payment.requestId || payment.paymentId">
                  <td>{{ payment.paymentSeq }}차</td>
                  <td>{{ payment.requestDate }}</td>
                  <td class="text-right">{{ formatCurrency(payment.requestAmount) }}</td>
                  <td>
                    <span class="signature-status" :class="getSignatureStatusClass(payment.signatureStatus)">
                      {{ getSignatureStatusLabel(payment.signatureStatus) }}
                    </span>
                  </td>
                  <td>{{ payment.paymentDate || payment.paidDate || '-' }}</td>
                  <td>
                    <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                      {{ getPaymentStatusLabel(payment.status) }}
                    </span>
                  </td>
                  <td>
                    <!-- 서명 미완료: 서명 대기중 표시 -->
                    <div v-if="!isSignatureCompleted(payment.signatureStatus)" class="pdf-actions">
                      <span class="signature-pending-badge">
                        <i class="fas fa-clock"></i>
                        서명 대기중
                      </span>
                    </div>
                    <!-- 서명 완료: PDF 버튼 표시 -->
                    <div v-else class="pdf-actions">
                      <button
                        class="btn-pdf-sm"
                        @click="viewConfirmationPdf(payment.baselineId)"
                        :disabled="!payment.baselineId"
                        title="납품확인서"
                      >
                        <i class="fas fa-file-pdf"></i>
                        납품확인서
                      </button>
                      <button
                        class="btn-pdf-sm btn-pdf-photo"
                        @click="viewPhotoSheetPdf(payment.baselineId)"
                        :disabled="!payment.baselineId"
                        title="사진대지"
                      >
                        <i class="fas fa-images"></i>
                        사진대지
                      </button>
                    </div>
                  </td>
                  <!-- 수금확인 열 -->
                  <td>
                    <button
                      v-if="payment.status === 'APPROVED'"
                      class="btn-collection-confirm"
                      @click="openCollectionConfirmModal('progress', payment)"
                      title="수금 확인"
                    >
                      <i class="fas fa-check-circle"></i>
                      수금확인
                    </button>
                    <span v-else-if="payment.status === 'PAID'" class="collection-completed">
                      <i class="fas fa-check"></i>
                      완료
                    </span>
                    <span v-else class="collection-pending">-</span>
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
            <div class="tab-actions">
              <!-- 납품완료 처리하기 버튼 (PENDING_SIGNATURE 상태 & 납품완료 전) -->
              <button
                v-if="!fundDetail.isDeliveryCompleted && canCompleteFinalDelivery"
                class="btn-primary"
                @click="openFinalDeliveryModal"
              >
                <i class="fas fa-check-circle"></i>
                납품완료 처리하기
              </button>
              <!-- 잔금등록 버튼 (납품완료 상태 && 잔금 미입금 시에만) -->
              <button
                v-if="(fundDetail.isDeliveryCompleted || deliveryDoneStatus === 'COMPLETED') && !fundDetail.balancePaidAmount"
                class="btn-primary"
                @click="openBalanceConfirmModal"
              >
                <i class="fas fa-coins"></i>
                잔금등록
              </button>
            </div>
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
            <!-- 납품완료일 -->
            <div v-if="fundDetail.deliveryCompletedAt" class="info-row">
              <label>납품완료일</label>
              <span>{{ formatDate(fundDetail.deliveryCompletedAt) }}</span>
            </div>
            <!-- 잔금 입금 정보 -->
            <div v-if="fundDetail.balancePaidDate" class="info-row">
              <label>잔금 입금일</label>
              <span>{{ formatDate(fundDetail.balancePaidDate) }}</span>
            </div>
            <div v-if="fundDetail.balancePaidAmount" class="info-row">
              <label>잔금 입금액</label>
              <span class="amount text-success">{{ formatCurrency(fundDetail.balancePaidAmount) }}</span>
            </div>
            <!-- 잔금 입금확인 버튼 (납품완료 && 미입금 상태일 때만 표시) -->
            <div v-if="fundDetail.isDeliveryCompleted && !fundDetail.balancePaidDate" class="collection-confirm-section">
              <button
                class="btn-collection-confirm-lg"
                @click="openBalanceConfirmModal"
              >
                <i class="fas fa-check-circle"></i>
                잔금 입금확인
              </button>
            </div>
            <!-- 잔금 입금완료 표시 -->
            <div v-if="fundDetail.balancePaidDate" class="collection-confirm-section">
              <div class="collection-completed">
                <i class="fas fa-check-circle"></i>
                잔금 입금 완료
              </div>
            </div>
          </div>
        </div>

        <!-- OEM 지급 탭 -->
        <div v-if="activeTab === 'oem'" class="tab-content">
          <div class="tab-header">
            <h4>OEM 지급 현황</h4>
            <button class="btn-primary" @click="openOemPaymentModal()">
              <i class="fas fa-plus"></i>
              지급 등록
            </button>
          </div>
          <!-- OEM 지급 요약 -->
          <div class="oem-summary-card">
            <div class="summary-item">
              <span class="label">기성금 누계</span>
              <span class="value">{{ formatCurrency(fundDetail.progressPaymentTotal) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item">
              <span class="label">OEM 지급 예정 (70%)</span>
              <span class="value highlight">{{ formatCurrency(Math.floor((fundDetail.progressPaymentTotal || 0) * 0.7)) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item">
              <span class="label">지급 완료</span>
              <span class="value success">{{ formatCurrency(oemPaidTotal) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item">
              <span class="label">미지급</span>
              <span class="value warning">{{ formatCurrency(Math.floor((fundDetail.progressPaymentTotal || 0) * 0.7) - oemPaidTotal) }}</span>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th>OEM 업체</th>
                  <th>지급예정금액</th>
                  <th>예정일</th>
                  <th>실제지급금액</th>
                  <th>지급일</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="oemPayments.length === 0">
                  <td colspan="8" class="no-data">OEM 지급 이력이 없습니다.</td>
                </tr>
                <tr v-else v-for="oem in oemPayments" :key="oem.oemPaymentId">
                  <td>{{ oem.paymentSeq }}차</td>
                  <td>{{ oem.oemCompanyName || '-' }}</td>
                  <td class="text-right">{{ formatCurrency(oem.scheduledAmount) }}</td>
                  <td>{{ oem.scheduledDate || '-' }}</td>
                  <td class="text-right">{{ oem.paidAmount ? formatCurrency(oem.paidAmount) : '-' }}</td>
                  <td>{{ oem.paidDate || '-' }}</td>
                  <td>
                    <span class="status-badge" :class="getOemPaymentStatusClass(oem.status)">
                      {{ getOemPaymentStatusLabel(oem.status) }}
                    </span>
                  </td>
                  <td>
                    <button
                      v-if="oem.status === 'SCHEDULED'"
                      class="btn-oem-complete"
                      @click="openOemCompleteModal(oem)"
                      title="지급 완료 처리"
                    >
                      <i class="fas fa-check"></i>
                      지급완료
                    </button>
                    <span v-else-if="oem.status === 'PAID'" class="oem-completed">
                      <i class="fas fa-check-circle"></i>
                      완료
                    </span>
                    <span v-else class="oem-cancelled">취소됨</span>
                  </td>
                </tr>
              </tbody>
            </table>
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

    <!-- 선급금 신청 모달 -->
    <AdvancePaymentModal
      :is-open="showAdvancePaymentModal"
      :fund-id="Number(route.params.id)"
      :total-contract-amount="fundDetail?.contractTotalAmount || 0"
      :advance-payment-rate="fundDetail?.advancePaymentRate || 10"
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
      @close="closeCollectionConfirmModal"
      @confirmed="handleCollectionConfirmed"
    />

    <!-- OEM 지급 모달 -->
    <OemPaymentModal
      :is-open="showOemPaymentModal"
      :fund-id="Number(route.params.id)"
      :existing-payment="selectedOemPayment"
      :linked-payment="linkedProgressPayment"
      @close="closeOemPaymentModal"
      @submitted="handleOemPaymentSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useFundStore } from '~/stores/fund'
import { formatCurrency } from '~/utils/format'
import type { FundDetail, ProgressPaymentRequest, PaymentStatus } from '~/types/fund'
import type { SignatureStatus } from '~/types/baseline'
import { SIGNATURE_STATUS_LABELS, SIGNATURE_STATUS_CLASSES } from '~/types/baseline'
import ProgressPaymentModal from '~/components/fund/ProgressPaymentModal.vue'
import FinalDeliveryModal from '~/components/fund/FinalDeliveryModal.vue'
import AdvancePaymentModal from '~/components/fund/AdvancePaymentModal.vue'
import CollectionConfirmModal from '~/components/fund/CollectionConfirmModal.vue'
import OemPaymentModal from '~/components/fund/OemPaymentModal.vue'
import PdfPreviewModal from '~/components/admin/delivery/PdfPreviewModal.vue'
import { baselineService } from '~/services/baseline.service'
import { fundService } from '~/services/fund.service'
import { advancePaymentService } from '~/services/advance-payment.service'
import { getDeliveryDoneByOrderId } from '~/services/delivery-done.service'
import type { AdvancePdfType, AdvancePayment, OemPayment, OemPaymentStatus } from '~/types/fund'
import { OEM_PAYMENT_STATUS_LABELS } from '~/types/fund'

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
const showAdvancePaymentModal = ref(false)

// PDF 모달 상태
const showPdfModal = ref(false)
const currentPdfUrl = ref('')
const currentPdfFileName = ref('')

// 수금 확인 모달 상태
const showCollectionConfirmModal = ref(false)
const collectionPaymentType = ref<'advance' | 'progress' | 'balance'>('progress')
const collectionPaymentId = ref(0)
const collectionRequestAmount = ref(0)
const collectionApprovedAmount = ref(0)

// OEM 지급 관련 상태
const showOemPaymentModal = ref(false)
const selectedOemPayment = ref<OemPayment | null>(null)
const linkedProgressPayment = ref<ProgressPaymentRequest | null>(null)
const oemPayments = ref<OemPayment[]>([])

// 기성청구 Validation용 상태
const completedDeliveryCount = ref(0)  // 서명 완료된 출하 수
const deliveryDoneStatus = ref<string | null>(null)  // 납품완료계 상태
const oemCompanyId = ref<number | null>(null)  // OEM 업체 ID (deliveryDone에서 가져옴)

// OEM 지급 완료 총액 계산
const oemPaidTotal = computed(() => {
  return oemPayments.value
    .filter(p => p.status === 'PAID' && p.paidAmount)
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0)
})

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

/** 선급금 예상액 계산 */
const expectedAdvanceAmount = computed(() => {
  if (!fundDetail.value) return 0
  const rate = fundDetail.value.advancePaymentRate || 70
  return Math.floor((fundDetail.value.contractTotalAmount * rate) / 100)
})

/** 선급금 문서 목록 */
const advanceDocuments = [
  { type: 'APPLICATION' as AdvancePdfType, label: '선급금신청서', icon: 'fa-file-invoice', iconColor: 'text-blue' },
  { type: 'USAGE_PLAN' as AdvancePdfType, label: '선급금사용계획', icon: 'fa-clipboard-list', iconColor: 'text-green' },
  { type: 'USAGE_AGREEMENT' as AdvancePdfType, label: '선급금사용확약서', icon: 'fa-file-signature', iconColor: 'text-purple' },
  { type: 'USAGE_PLEDGE' as AdvancePdfType, label: '선급금사용각서', icon: 'fa-file-contract', iconColor: 'text-orange' },
  { type: 'SETTLEMENT' as AdvancePdfType, label: '선급금정산서', icon: 'fa-file-invoice-dollar', iconColor: 'text-red' }
]

/** 선급금 신청 가능 여부 (서명 완료된 출하가 0개일 때) */
const canRequestAdvance = computed(() => completedDeliveryCount.value === 0)

/** 기성금 청구 가능 여부 (서명완료 출하 1건 이상 & 납품완료 아님) */
const canRequestProgress = computed(() =>
  completedDeliveryCount.value > 0 &&
  !fundDetail.value?.isDeliveryCompleted &&
  deliveryDoneStatus.value !== 'COMPLETED'
)

/** 납품완료 처리 가능 여부 (delivery_done 상태가 PENDING_SIGNATURE) */
const canCompleteFinalDelivery = computed(() =>
  deliveryDoneStatus.value === 'PENDING_SIGNATURE'
)

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
  if (fundDetail.value?.isDeliveryCompleted || deliveryDoneStatus.value === 'COMPLETED') {
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
    // 1. 서명 완료된 출하 수 조회 (기성금 이력에서 카운트)
    // availableShipments는 이미 서명 완료된 출하 목록이므로 해당 수를 사용
    const baselineData = await baselineService.getAvailableShipments(fundDetail.value.orderId)
    completedDeliveryCount.value = baselineData?.length || 0

    // 2. 납품완료계 상태 조회
    const deliveryDone = await getDeliveryDoneByOrderId(fundDetail.value.orderId)
    deliveryDoneStatus.value = deliveryDone?.status || null
    // OEM 업체 ID 저장 (OEM 지급 등록 시 사용)
    oemCompanyId.value = deliveryDone?.oemCompanyId || null
  } catch (error) {
    console.error('Validation 데이터 로드 실패:', error)
  }
}

const goBack = () => {
  router.push('/admin/funds')
}

/**
 * 선급금 비율 계산
 */
const getAdvancePaymentRate = (): number => {
  if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
  return ((fundDetail.value.advancePaymentAmount || 0) / fundDetail.value.contractTotalAmount) * 100
}

/**
 * 기성금 비율 계산
 */
const getProgressPaymentRate = (): number => {
  if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
  return ((fundDetail.value.progressPaymentTotal || 0) / fundDetail.value.contractTotalAmount) * 100
}

/**
 * 잔금 비율 계산 (이미 지급된 잔금)
 */
const getBalancePaymentRate = (): number => {
  // balanceAmount는 미지급 잔금이므로, 지급된 잔금 = 0 (현재 로직)
  return 0
}

/**
 * 수금률 계산
 */
const getCollectionRate = (): number => {
  if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
  return fundDetail.value.collectionRate || (getAdvancePaymentRate() + getProgressPaymentRate())
}

/**
 * 잔여 잔금 계산 (미수금)
 */
const getRemainingBalance = (): number => {
  if (!fundDetail.value) return 0
  // 서버에서 balanceAmount 또는 outstandingAmount로 제공
  return fundDetail.value.balanceAmount || fundDetail.value.outstandingAmount || 0
}

/**
 * 상태 클래스 반환
 */
const getStatusClass = (status?: string): string => {
  if (!status) return ''
  switch (status) {
    case 'ACTIVE': return 'status-active'
    case 'COMPLETED': return 'status-completed'
    case 'CANCELLED': return 'status-cancelled'
    default: return ''
  }
}

/**
 * 상태 라벨 반환
 */
const getStatusLabel = (status?: string): string => {
  if (!status) return '-'
  const labels: Record<string, string> = {
    ACTIVE: '진행중',
    COMPLETED: '완료',
    CANCELLED: '취소'
  }
  return labels[status] || status
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
 * 선급금 상태 클래스
 */
const getAdvanceStatusClass = (status?: string): string => {
  if (!status) return ''
  const classMap: Record<string, string> = {
    REQUESTED: 'status-requested',
    APPROVED: 'status-approved',
    PAID: 'status-paid',
    REJECTED: 'status-rejected'
  }
  return classMap[status] || ''
}

/**
 * 선급금 상태 라벨
 */
const getAdvanceStatusLabel = (status?: string): string => {
  if (!status) return '-'
  const labelMap: Record<string, string> = {
    REQUESTED: '신청',
    APPROVED: '승인',
    PAID: '수금완료',
    REJECTED: '반려'
  }
  return labelMap[status] || status
}

/**
 * 서명 상태 클래스
 * @description types/baseline.ts의 SIGNATURE_STATUS_CLASSES 사용
 */
const getSignatureStatusClass = (status?: string): string => {
  if (!status) return 'signature-pending'
  return SIGNATURE_STATUS_CLASSES[status as SignatureStatus] || 'signature-pending'
}

/**
 * 서명 상태 라벨
 * @description types/baseline.ts의 SIGNATURE_STATUS_LABELS 사용
 */
const getSignatureStatusLabel = (status?: string): string => {
  if (!status) return '서명대기'
  return SIGNATURE_STATUS_LABELS[status as SignatureStatus] || '서명대기'
}

/**
 * 서명 완료 여부 확인
 */
const isSignatureCompleted = (status?: string): boolean => {
  return status === 'SIGNATURE_COMPLETED'
}

/**
 * 선급금 PDF 보기
 */
const viewAdvancePdf = (pdfType: AdvancePdfType) => {
  if (!advanceDetail.value) return
  currentPdfUrl.value = advancePaymentService.getPdfUrl(advanceDetail.value.advanceId, pdfType)
  currentPdfFileName.value = `${pdfType}_${advanceDetail.value.advanceId}.pdf`
  showPdfModal.value = true
}

/**
 * 선급금 PDF 다운로드
 */
const downloadAdvancePdf = (pdfType: AdvancePdfType) => {
  if (!advanceDetail.value) return
  const url = advancePaymentService.getPdfUrl(advanceDetail.value.advanceId, pdfType)
  window.open(url, '_blank')
}

/**
 * 선급금 전체 PDF 다운로드 (ZIP)
 */
const downloadAllAdvancePdfs = () => {
  if (!advanceDetail.value) return
  const url = advancePaymentService.getDownloadAllPdfUrl(advanceDetail.value.advanceId)
  window.open(url, '_blank')
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

/**
 * 선급금 신청 모달 열기
 */
const openAdvancePaymentModal = () => {
  showAdvancePaymentModal.value = true
}

/**
 * 선급금 신청 모달 닫기
 */
const closeAdvancePaymentModal = () => {
  showAdvancePaymentModal.value = false
}

/**
 * 선급금 신청 완료 후 처리
 */
const handleAdvancePaymentSubmitted = async () => {
  closeAdvancePaymentModal()
  await loadData()
}

/**
 * 잔금 입금확인 모달 열기
 */
const openBalanceConfirmModal = () => {
  if (!fundDetail.value) return

  collectionPaymentType.value = 'balance'
  collectionPaymentId.value = fundDetail.value.fundId
  // 잔금 등록 시 미수금(outstandingAmount) 사용 (balanceAmount는 수금된 잔금)
  collectionRequestAmount.value = fundDetail.value.outstandingAmount || 0
  collectionApprovedAmount.value = fundDetail.value.outstandingAmount || 0
  showCollectionConfirmModal.value = true
}

/**
 * 납품확인서 PDF 보기
 */
const viewConfirmationPdf = (baselineId: number | undefined) => {
  if (!baselineId) return

  currentPdfUrl.value = baselineService.getConfirmationPdfUrl(baselineId)
  currentPdfFileName.value = `납품확인서_${baselineId}.pdf`
  showPdfModal.value = true
}

/**
 * 사진대지 PDF 보기
 */
const viewPhotoSheetPdf = (baselineId: number | undefined) => {
  if (!baselineId) return

  currentPdfUrl.value = baselineService.getPhotoSheetPdfUrl(baselineId)
  currentPdfFileName.value = `사진대지_${baselineId}.pdf`
  showPdfModal.value = true
}

/**
 * PDF 모달 닫기
 */
const closePdfModal = () => {
  showPdfModal.value = false
  currentPdfUrl.value = ''
  currentPdfFileName.value = ''
}

/**
 * 수금 확인 모달 열기
 * @param type - 자금 유형 (advance, progress, balance)
 * @param payment - 결제 정보 객체
 */
const openCollectionConfirmModal = (
  type: 'advance' | 'progress' | 'balance',
  payment: any
) => {
  collectionPaymentType.value = type

  // 유형별 ID 및 금액 설정
  if (type === 'advance') {
    collectionPaymentId.value = payment.advanceId
    collectionRequestAmount.value = payment.requestAmount
    collectionApprovedAmount.value = payment.approvedAmount || 0
  } else if (type === 'progress') {
    collectionPaymentId.value = payment.paymentId || payment.requestId
    collectionRequestAmount.value = payment.requestAmount || payment.amount
    collectionApprovedAmount.value = 0 // 기성금은 승인금액이 별도로 없음
  } else if (type === 'balance') {
    collectionPaymentId.value = payment.balanceRequestId
    collectionRequestAmount.value = payment.requestAmount
    collectionApprovedAmount.value = payment.approvedAmount || 0
  }

  showCollectionConfirmModal.value = true
}

/**
 * 수금 확인 모달 닫기
 */
const closeCollectionConfirmModal = () => {
  showCollectionConfirmModal.value = false
}

/**
 * 수금 확인 완료 처리
 * @param data - 수금 확인 데이터
 */
const handleCollectionConfirmed = async (data: {
  paidAmount: number
  paymentDate: string
  bankAccount?: string
  remarks?: string
}) => {
  const fundId = Number(route.params.id)

  try {
    if (collectionPaymentType.value === 'advance') {
      // 선급금 수금 확인
      await fundService.confirmAdvance(fundId, collectionPaymentId.value, {
        paidAmount: data.paidAmount,
        paymentDate: data.paymentDate,
        bankAccount: data.bankAccount,
        remarks: data.remarks
      })
    } else if (collectionPaymentType.value === 'progress') {
      // 기성금 수금 확인
      await fundService.confirmPayment(fundId, collectionPaymentId.value, {
        paidAmount: data.paidAmount,
        paymentDate: data.paymentDate,
        bankAccount: data.bankAccount,
        remarks: data.remarks
      })
    } else if (collectionPaymentType.value === 'balance') {
      // 잔금 입금확인
      await fundService.confirmBalance(fundId, {
        paidAmount: data.paidAmount,
        paidDate: data.paymentDate,
        bankAccount: data.bankAccount,
        remarks: data.remarks
      })
    }

    // 데이터 새로고침
    await loadData()
  } catch (error) {
    console.error('수금 확인 처리 실패:', error)
    alert('수금 확인 처리 중 오류가 발생했습니다.')
  }
}

// ============ OEM 지급 관련 메서드 ============

/**
 * OEM 지급 상태 클래스
 */
const getOemPaymentStatusClass = (status?: OemPaymentStatus): string => {
  if (!status) return ''
  const classMap: Record<OemPaymentStatus, string> = {
    SCHEDULED: 'status-scheduled',
    PAID: 'status-paid',
    CANCELLED: 'status-cancelled'
  }
  return classMap[status] || ''
}

/**
 * OEM 지급 상태 라벨
 */
const getOemPaymentStatusLabel = (status?: OemPaymentStatus): string => {
  if (!status) return '-'
  return OEM_PAYMENT_STATUS_LABELS[status] || status
}

/**
 * OEM 지급 모달 열기 (등록 모드)
 */
const openOemPaymentModal = (linkedPayment?: ProgressPaymentRequest) => {
  selectedOemPayment.value = null
  linkedProgressPayment.value = linkedPayment || null
  showOemPaymentModal.value = true
}

/**
 * OEM 지급 완료 모달 열기
 */
const openOemCompleteModal = (payment: OemPayment) => {
  selectedOemPayment.value = payment
  linkedProgressPayment.value = null
  showOemPaymentModal.value = true
}

/**
 * OEM 지급 모달 닫기
 */
const closeOemPaymentModal = () => {
  showOemPaymentModal.value = false
  selectedOemPayment.value = null
  linkedProgressPayment.value = null
}

/**
 * OEM 지급 완료 처리
 */
const handleOemPaymentSubmitted = async (data: {
  amount: number
  paymentDate: string
  oemCompanyName?: string
  bankAccount?: string
  remarks?: string
  isComplete: boolean
}) => {
  const fundId = Number(route.params.id)

  try {
    if (data.isComplete && selectedOemPayment.value) {
      // 지급 완료 처리
      await fundService.completeOemPayment(fundId, selectedOemPayment.value.oemPaymentId, {
        paidAmount: data.amount,
        paidDate: data.paymentDate,
        bankAccount: data.bankAccount,
        remarks: data.remarks
      })
    } else {
      // 신규 등록
      await fundService.createOemPayment(fundId, {
        paymentType: linkedProgressPayment.value ? 'PROGRESS' : 'ADVANCE',
        paymentAmount: data.amount,
        paymentDate: data.paymentDate,
        oemCompanyName: data.oemCompanyName,
        oemCompanyId: oemCompanyId.value || undefined,  // OEM 업체 ID 추가
        bankAccount: data.bankAccount,
        remarks: data.remarks
      })
    }

    // 데이터 새로고침
    await loadData()
  } catch (error) {
    console.error('OEM 지급 처리 실패:', error)
    alert('OEM 지급 처리 중 오류가 발생했습니다.')
  }
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

/* 선급금 신청 완료 안내 */
.advance-status-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #166534;
  font-size: 0.875rem;
}

.advance-status-notice i {
  color: #22c55e;
  font-size: 1rem;
}

/* 선급금 안내 메시지 (미신청 상태) */
.advance-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
}

.advance-notice i {
  color: #3b82f6;
  font-size: 1rem;
}

/* 미신청 상태 배지 */
.status-pending {
  background: #f3f4f6;
  color: #6b7280;
}

/* 선급금 문서 섹션 */
.advance-documents {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.advance-documents h5 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
}

.advance-documents h5 i {
  color: #ef4444;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.document-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.document-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.document-info i {
  font-size: 1.125rem;
  width: 20px;
  text-align: center;
}

.document-info .text-blue { color: #3b82f6; }
.document-info .text-green { color: #10b981; }
.document-info .text-purple { color: #8b5cf6; }
.document-info .text-orange { color: #f97316; }
.document-info .text-red { color: #ef4444; }

.document-info span {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

/* PDF 버튼 스타일 - admin-buttons.css로 이동됨 */

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

/* 수금 확인 버튼 스타일 - admin-buttons.css로 이동됨 */

/* 잔금 신청 정보 섹션 */
.balance-request-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* OEM 지급 요약 카드 */
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

/* OEM 지급 상태 배지 */
.status-scheduled {
  background: #fef3c7;
  color: #d97706;
}

/* OEM 지급 버튼 스타일 - admin-buttons.css로 이동됨 */

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
