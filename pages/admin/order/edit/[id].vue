<template>
  <div class="order-edit">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품요구 수정"
      description="납품요구 정보를 수정합니다."
      icon="order"
      icon-color="purple"
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-list"></i>
          목록
        </button>
      </template>
    </PageHeader>

    <LoadingSection v-if="loading" />
    <ErrorSection v-else-if="!orderData && !loading" message="납품요구 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <!-- 탭 네비게이션 -->
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
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- 기본정보 탭 -->
      <div v-show="activeTab === 'info'" class="tab-content">
      <!-- 분할납품요구서 정보 -->
      <FormSection title="분할납품요구서 정보">
        <!-- 1. 계약 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-alt"></i>
            <span>계약 정보</span>
          </div>
          <div class="info-grid grid-5">
            <FormField label="계약번호">
              <input type="text" :value="orderData?.contractId || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약일자">
              <input type="text" :value="orderData?.contractDate || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="선고지번호">
              <input type="text" :value="orderData?.preNotificationNo || '-'" class="form-input-xs" readonly>
            </FormField>
            <FormField label="납품요구번호">
              <input type="text" :value="orderData?.deliveryRequestNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="납품요구일자">
              <input type="text" :value="orderData?.deliveryRequestDate || '-'" class="form-input-sm" readonly>
            </FormField>
          </div>
          <div class="info-grid grid-5">
            <FormField label="주문상태">
              <span class="status-badge" :class="getOrderStatusClass(orderData?.status)">
                {{ getOrderStatusLabel(orderData?.status) }}
              </span>
            </FormField>
          </div>
          <div class="info-group-header">
            <i class="fas fa-file-contract"></i>
            <span>계약 상세</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="나라장터번호">
              <input type="text" :value="orderData?.naraJangteoNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="지급방법">
              <input type="text" :value="orderData?.paymentMethod || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="사업명" grid-2>
              <input type="text" :value="orderData?.projectName || '-'" class="form-input-md" style="width: 370px" readonly>
            </FormField>
          </div>
        </div>

        <!-- 2. 수요기관 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-building"></i>
            <span>수요기관 정보</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="수요기관명">
              <input type="text" :value="orderData?.client || '-'" class="form-input-md" readonly>
            </FormField>
            <FormField label="기관번호">
              <input type="text" :value="orderData?.clientNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="우편번호">
              <input type="text" :value="orderData?.clientPostalCode || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="주소" full-width>
              <input type="text" :value="orderData?.clientAddress || '-'" class="form-input-lg" readonly>
            </FormField>
            <FormField label="전화번호">
              <input type="text" :value="orderData?.clientPhoneNumber || '-'" class="form-input" readonly>
            </FormField>
            <FormField label="팩스번호">
              <input type="text" :value="orderData?.clientFaxNumber || '-'" class="form-input" readonly>
            </FormField>
            <FormField label="담당자">
              <input type="text" :value="orderData?.clientManagerName || '-'" class="form-input" readonly>
            </FormField>
          </div>
        </div>

        <!-- 3. 기타 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-clipboard-list"></i>
            <span>기타 정보</span>
          </div>
          <!-- 건설사 선택 (OEM 제조사는 출하 등록 시 선택) -->
          <div class="info-grid grid-4">
            <FormField label="건설사">
              <select
                v-model="formData.builderCompanyId"
                @change="handleBuilderChange"
                class="form-input-sm"
              >
                <option :value="null">선택하세요</option>
                <option
                  v-for="company in companies"
                  :key="company.id"
                  :value="company.id"
                >
                  {{ company.companyName }}
                </option>
              </select>
            </FormField>
          </div>
          <!-- 기존 필드들 (readonly) -->
          <div class="info-grid grid-4">
            <FormField label="분할납품">
              <input type="text" :value="orderData?.partialDelivery || '-'" class="form-input-xs" readonly>
            </FormField>
            <FormField label="하자담보책임기간">
              <input type="text" :value="orderData?.warrantyPeriod || '-'" class="form-input-xs" readonly>
            </FormField>
            <FormField label="검사기관">
              <input type="text" :value="orderData?.inspectionAgency || '-'" class="form-input-md" readonly>
            </FormField>
            <FormField label="인수기관">
              <input type="text" :value="orderData?.acceptanceAgency || '-'" class="form-input-md" readonly>
            </FormField>
          </div>
        </div>

        <!-- 4. 금액 정보 -->
        <div class="info-group amount-group">
          <div class="info-group-header">
            <i class="fas fa-won-sign"></i>
            <span>금액 정보</span>
          </div>
          <div class="amount-display">
            <div class="amount-item">
              <label>품목총액</label>
              <span>{{ formatCurrency(orderData?.itemTotalAmount || 0) }}</span>
            </div>
            <span class="amount-operator">+</span>
            <div class="amount-item">
              <label>수수료</label>
              <span>{{ formatCurrency(orderData?.commission || 0) }}</span>
            </div>
            <span class="amount-operator">=</span>
            <div class="amount-item total">
              <label>총 계약금액</label>
              <span>{{ formatCurrency(orderData?.totalAmount || 0) }}</span>
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 납품 목록 -->
      <FormSection title="납품 목록" style="margin-top: -20px">
        <div class="table-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-no">순번</th>
                <th class="col-name">품명</th>
                <th class="col-spec">규격</th>
                <th class="col-unit">단위</th>
                <th class="col-price">단가</th>
                <th class="col-qty">수량</th>
                <th class="col-amount">금액</th>
                <th class="col-location">납품장소</th>
                <th class="col-deadline">납품기한</th>
                <th class="col-terms">납품조건</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="items.length === 0">
                <td colspan="10" class="empty-row">등록된 납품 품목이 없습니다.</td>
              </tr>
              <tr v-for="(item, index) in items" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td><input :value="item.productName" type="text" readonly class="input-w80 text-center"></td>
                <td><input :value="item.specification" type="text" readonly></td>
                <td><input :value="item.unit" type="text" readonly class="input-w66 text-center"></td>
                <td class="text-right"><input :value="formatNumber(item.unitPrice)" type="text" readonly class="input-w66 text-right"></td>
                <td class="text-right"><input :value="item.quantity" type="text" readonly class="input-w66 text-right"></td>
                <td class="text-right"><input :value="formatNumber(item.unitPrice * item.quantity)" type="text" readonly class="input-w66 text-right"></td>
                <td><input :value="item.deliveryLocation || '-'" type="text" readonly class="input-w75 text-center"></td>
                <td><input :value="item.deliveryDeadline || '-'" type="text" readonly class="input-w66 text-center"></td>
                <td><input :value="item.deliveryTerms || '-'" type="text" readonly class="input-w66 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 합계 정보 -->
        <div class="summary-info">
          <div class="summary-item">
            <label>수량합계:</label>
            <span>{{ formatNumber(totalQuantity) }}</span>
          </div>
          <div class="summary-item">
            <label>품목총액:</label>
            <span>{{ formatCurrency(orderData?.itemTotalAmount || 0) }}</span>
          </div>
        </div>
      </FormSection>

      <!-- 저장 버튼 -->
      <div class="form-actions">
        <button type="button" @click="goBack" class="btn-secondary">
          취소
        </button>
        <button
          type="button"
          @click="handleSave"
          class="btn-primary"
          :disabled="submitting || !canEdit || !hasBuilderChanged"
          :title="!canEdit ? '수정 권한이 없습니다' : !hasBuilderChanged ? '변경된 내용이 없습니다' : ''"
        >
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </div>
      </div>

      <!-- 기성/납품확인 탭 -->
      <div v-show="activeTab === 'baseline'" class="tab-content">
        <div class="baseline-section">
          <!-- 진행 현황 -->
          <div class="progress-summary">
            <div class="progress-info">
              <i class="fas fa-tasks"></i>
              <span>진행 현황: </span>
              <strong>{{ baselineProgress.confirmed }}/{{ baselineProgress.total }} 확정</strong>
            </div>
          </div>

          <!-- 차수 목록 테이블 -->
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
                  <!-- 차수 -->
                  <td>{{ payment.paymentSeq }}차</td>
                  <!-- 청구일 -->
                  <td>{{ payment.requestDate }}</td>
                  <!-- 청구금액 -->
                  <td class="text-right">{{ formatCurrency(payment.requestAmount) }}</td>
                  <!-- 서명상태 -->
                  <td>
                    <span class="signature-status" :class="getSignatureStatusClass(payment.signatureStatus)">
                      {{ getSignatureStatusLabel(payment.signatureStatus) }}
                    </span>
                  </td>
                  <!-- 수금일 -->
                  <td>{{ payment.paymentDate || payment.paidDate || '-' }}</td>
                  <!-- 상태 -->
                  <td>
                    <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                      {{ getPaymentStatusLabel(payment.status) }}
                    </span>
                  </td>
                  <!-- PDF -->
                  <td>
                    <div v-if="!isSignatureCompleted(payment.signatureStatus)" class="pdf-actions">
                      <span class="signature-pending-badge">
                        <i class="fas fa-clock"></i>
                        서명 대기중
                      </span>
                    </div>
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
                  <!-- 수금확인 -->
                  <td>
                    <button
                      v-if="payment.status === 'APPROVED'"
                      class="btn-collection-confirm"
                      @click="openCollectionConfirmModal(payment)"
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
      </div>

      <!-- 자금 탭 -->
      <div v-show="activeTab === 'fund'" class="tab-content">
        <div class="fund-section">
          <!-- 자금 요약 카드 -->
          <div class="fund-summary-cards">
            <div class="fund-card">
              <div class="fund-card-icon" style="background: #dbeafe; color: #1d4ed8;">
                <i class="fas fa-file-invoice-dollar"></i>
              </div>
              <div class="fund-card-content">
                <div class="fund-card-label">계약금액</div>
                <div class="fund-card-value">{{ formatCurrency(fundSummary.totalContractAmount) }}</div>
              </div>
            </div>
            <div class="fund-card">
              <div class="fund-card-icon" style="background: #fef3c7; color: #d97706;">
                <i class="fas fa-hand-holding-usd"></i>
              </div>
              <div class="fund-card-content">
                <div class="fund-card-label">선급금</div>
                <div class="fund-card-value">{{ formatCurrency(fundSummary.advancePaymentAmount) }}</div>
              </div>
            </div>
            <div class="fund-card">
              <div class="fund-card-icon" style="background: #dcfce7; color: #16a34a;">
                <i class="fas fa-coins"></i>
              </div>
              <div class="fund-card-content">
                <div class="fund-card-label">기성금 누계</div>
                <div class="fund-card-value">{{ formatCurrency(fundSummary.progressPaymentTotal) }}</div>
              </div>
            </div>
            <div class="fund-card">
              <div class="fund-card-icon" style="background: #fee2e2; color: #dc2626;">
                <i class="fas fa-wallet"></i>
              </div>
              <div class="fund-card-content">
                <div class="fund-card-label">잔금</div>
                <div class="fund-card-value">{{ formatCurrency(fundSummary.remainingBalance) }}</div>
              </div>
            </div>
          </div>

          <!-- 자금 관리 상세 바로가기 -->
          <div class="fund-actions">
            <button class="btn-primary" @click="goToFundDetail">
              <i class="fas fa-external-link-alt"></i>
              자금 관리 상세보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 수금 확인 모달 -->
    <CollectionConfirmModal
      :is-open="showCollectionConfirmModal"
      payment-type="progress"
      :fund-id="fundSummary.fundId || 0"
      :payment-id="collectionPaymentId"
      :request-amount="collectionRequestAmount"
      @close="closeCollectionConfirmModal"
      @confirmed="handleCollectionConfirmed"
    />

    <!-- PDF 미리보기 모달 -->
    <PdfPreviewModal
      :show="showPdfModal"
      :pdf-url="currentPdfUrl"
      :file-name="currentPdfFileName"
      @close="showPdfModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { orderService } from '~/services/order.service'
import { companyService } from '~/services/company.service'
import { baselineService } from '~/services/baseline.service'
import { fundService } from '~/services/fund.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import type { OrderDetailResponse } from '~/types/order'
import type { CompanyInfoResponse } from '~/types/company'
import type { BaselineType, BaselineStatus, SignatureStatus } from '~/types/baseline'
import { SIGNATURE_STATUS_LABELS, SIGNATURE_STATUS_CLASSES } from '~/types/baseline'
import type { ProgressPaymentRequest, PaymentStatus } from '~/types/fund'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import CollectionConfirmModal from '~/components/fund/CollectionConfirmModal.vue'
import PdfPreviewModal from '~/components/admin/delivery/PdfPreviewModal.vue'
import { usePermission } from '~/composables/usePermission'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요구 수정'
})

const router = useRouter()
const route = useRoute()
const orderId = computed(() => Number(route.params.id))

// 권한
const { canEdit, isFullAccess } = usePermission()

// 자금 관련 상태 포맷터 (useFundStatusFormatters composable 사용)
const { getPaymentStatusClass, getPaymentStatusLabel, getSignatureStatusClass, getSignatureStatusLabel, isSignatureCompleted } = useFundStatusFormatters()

// 상태
const loading = ref(true)
const submitting = ref(false)
const orderData = ref<OrderDetailResponse | null>(null)
const items = ref<any[]>([])

// 탭 관련 상태
const activeTab = ref('info')
const tabs = computed(() => {
  const baseTabs: Array<{ id: string; label: string; icon: string; badge?: number | null }> = [
    { id: 'info', label: '기본정보', icon: 'fas fa-info-circle' }
  ]

  // 시스템관리자, 리드파워담당자만 기성/납품확인, 자금 탭 표시
  if (isFullAccess.value) {
    baseTabs.push(
      { id: 'baseline', label: '기성/납품확인', icon: 'fas fa-check-double', badge: progressPayments.value.length > 0 ? progressPayments.value.length : null },
      { id: 'fund', label: '자금', icon: 'fas fa-coins' }
    )
  }

  return baseTabs
})

// 회사 목록 (건설사/제조사 선택용)
const companies = ref<CompanyInfoResponse[]>([])

// 수정 가능한 폼 데이터 (OEM 제조사는 출하 등록 시 선택)
const formData = ref({
  siteManagerId: null as number | null,     // deprecated
  builderCompanyId: null as number | null,  // 건설사 ID
  builderCompany: ''                        // 건설사명
})

// 초기 건설사 ID (변경 감지용)
const initialBuilderCompanyId = ref<number | null>(null)

// 기성/납품확인 관련 상태 (자금관리와 동일한 API 사용)
const progressPayments = ref<ProgressPaymentRequest[]>([])

// 수금 확인 모달 상태
const showCollectionConfirmModal = ref(false)
const collectionPaymentId = ref(0)
const collectionRequestAmount = ref(0)

// PDF 모달 상태
const showPdfModal = ref(false)
const currentPdfUrl = ref('')
const currentPdfFileName = ref('')

// 자금 관련 상태
const fundSummary = ref({
  fundId: null as number | null,
  totalContractAmount: 0,
  advancePaymentAmount: 0,
  progressPaymentTotal: 0,
  remainingBalance: 0
})

// 기성 진행 현황 (자금관리와 동일한 로직)
const baselineProgress = computed(() => {
  const total = progressPayments.value.length
  const confirmed = progressPayments.value.filter((p: ProgressPaymentRequest) => p.status === 'PAID').length
  return { total, confirmed }
})

// 건설사 변경 여부 (저장 버튼 활성화 조건)
const hasBuilderChanged = computed(() => {
  return formData.value.builderCompanyId !== initialBuilderCompanyId.value
})

// 수량 합계 (부동소수점 오류 방지를 위해 toFixed 사용)
const totalQuantity = computed(() => {
  const sum = items.value.reduce((acc, item) => acc + (item.quantity || 0), 0)
  // 소수점 2자리까지만 표시하고 불필요한 0 제거
  return parseFloat(sum.toFixed(2))
})

// 규격에서 두께(mm) 숫자를 추출하여 정렬에 사용
const extractSpecThickness = (specification: string): number => {
  if (!specification) return 9999
  // "NNN×NNN×NNNmm" 또는 "NNN*NNN*NNNmm" 패턴에서 마지막 숫자(두께) 추출
  const dimMatch = specification.match(/(\d+)\s*[×x*]\s*(\d+)\s*[×x*]\s*(\d+)\s*mm/i)
  if (dimMatch) return parseInt(dimMatch[3], 10)
  // "NNNmm" 패턴에서 숫자 추출
  const mmMatch = specification.match(/(\d+)\s*mm/i)
  if (mmMatch) return parseInt(mmMatch[1], 10)
  return 9999
}

// 데이터 로드
const loadData = async () => {
  try {
    loading.value = true
    const data = await orderService.getOrderDetail(orderId.value)
    orderData.value = data

    // 품목 데이터 변환 (서버 응답 필드명에 맞게 매핑)
    const mappedItems = data.items.map((item: any) => ({
      productName: item.productName || item.itemNm,  // 서버: productName
      specification: item.specification,
      unit: item.unit || item.unitCd,                // 서버: unit
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      deliveryLocation: item.deliveryLocation,
      deliveryDeadline: item.deliveryDeadline,
      deliveryTerms: item.deliveryTerms
    }))

    // 규격(두께mm) 기준 오름차순 정렬
    mappedItems.sort((a: any, b: any) => extractSpecThickness(a.specification) - extractSpecThickness(b.specification))

    items.value = mappedItems

    // 건설사 정보 복원 (OEM 제조사는 출하 등록 시 선택)
    if (data.builderCompanyId) {
      formData.value.builderCompanyId = data.builderCompanyId
      formData.value.builderCompany = data.builderCompanyName || ''
      initialBuilderCompanyId.value = data.builderCompanyId  // 초기값 저장
    }
    // 레거시 siteManagerId 호환
    if (data.siteManagerId && !data.builderCompanyId) {
      formData.value.siteManagerId = data.siteManagerId
      formData.value.builderCompany = data.builderCompanyName || ''
    }
  } catch (error) {
    console.error('납품요구 정보 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

// 회사 목록 조회
const loadCompanies = async () => {
  try {
    companies.value = await companyService.getCompanies()
  } catch (error) {
    console.error('회사 목록 조회 실패:', error)
  }
}

// 건설사 선택 핸들러
const handleBuilderChange = () => {
  const selected = companies.value.find(c => c.id === formData.value.builderCompanyId)
  formData.value.builderCompany = selected?.companyName || ''
}

// 저장
const handleSave = async () => {
  if (submitting.value) return

  // OEM 제조사 선택은 선택사항 (출하 등록 시 선택)
  // 필수 검사 제거됨

  try {
    submitting.value = true

    const updateData = {
      salesId: orderData.value!.salesId,
      contractId: orderData.value!.contractId,
      contractDate: orderData.value!.contractDate,
      preNotificationNo: orderData.value!.preNotificationNo || '',
      deliveryRequestNo: orderData.value!.deliveryRequestNo || '',
      client: orderData.value!.client,
      clientManagerName: orderData.value!.clientManagerName || '',
      clientNo: orderData.value!.clientNo || '',
      clientPostalCode: orderData.value!.clientPostalCode || '',
      clientAddress: orderData.value!.clientAddress || '',
      clientPhoneNumber: orderData.value!.clientPhoneNumber || '',
      clientFaxNumber: orderData.value!.clientFaxNumber || '',
      naraJangteoNo: orderData.value!.naraJangteoNo || '',
      warrantyPeriod: orderData.value!.warrantyPeriod || '',
      paymentMethod: orderData.value!.paymentMethod || '',
      deliveryRequestDate: orderData.value!.deliveryRequestDate,
      projectName: orderData.value!.projectName,
      itemTotalAmount: String(orderData.value!.itemTotalAmount),
      commission: String(orderData.value!.commission),
      totalAmount: String(orderData.value!.totalAmount),
      partialDelivery: orderData.value!.partialDelivery || '',
      inspectionAgency: orderData.value!.inspectionAgency || '',
      acceptanceAgency: orderData.value!.acceptanceAgency || '',
      siteManagerId: formData.value.siteManagerId,
      builderCompanyId: formData.value.builderCompanyId,
      builderCompanyName: formData.value.builderCompany || null,
      // OEM 제조사는 출하 등록 시 선택 (납품요구에서 제거됨)
      oemCompanyId: null,
      oemCompany: null,
      items: orderData.value!.items.map((item: any, index: number) => ({
        itemOrder: index + 1,
        skuId: item.skuId,
        itemId: item.itemId,
        itemName: item.productName || item.itemNm,
        skuName: item.skuNm,
        name: item.productName || item.itemNm,
        specification: item.specification,
        unit: item.unit || item.unitCd || '',
        unitPrice: String(item.unitPrice),
        quantity: Number(item.quantity),
        totalAmount: String(item.unitPrice * item.quantity),
        deliveryLocation: item.deliveryLocation || '',
        deliveryDeadline: item.deliveryDeadline || '',
        deliveryTerms: item.deliveryTerms || ''
      }))
    }

    const formDataToSend = new FormData()
    const orderBlob = new Blob([JSON.stringify(updateData)], {
      type: 'application/json'
    })
    formDataToSend.append('order', orderBlob)

    await orderService.updateOrder(orderId.value, formDataToSend)
    alert('납품요구가 수정되었습니다.')
    goBack()
  } catch (error) {
    console.error('납품요구 수정 실패:', error)
    alert('납품요구 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 목록으로 이동 (이전 페이지 번호 유지)
const goBack = () => {
  const returnPage = route.query.returnPage
  if (returnPage) {
    router.push({ path: '/admin/order/list', query: { page: returnPage as string } })
  } else {
    router.push('/admin/order/list')
  }
}

// 기성금 데이터 로드 (자금관리와 동일한 API 사용)
const loadProgressPayments = async () => {
  try {
    if (!fundSummary.value.fundId) return
    const response = await fundService.getPayments(fundSummary.value.fundId)
    progressPayments.value = response.content || []
  } catch (error) {
    console.error('기성금 이력 조회 실패:', error)
  }
}

// 자금 요약 데이터 로드
const loadFundSummary = async () => {
  try {
    const data = await fundService.getFundByOrderId(orderId.value)
    if (data) {
      // Fund 타입 필드명 매핑
      // contractTotalAmount → totalContractAmount (표시용)
      // balanceAmount → remainingBalance (표시용)
      fundSummary.value = {
        fundId: data.fundId,
        totalContractAmount: data.contractTotalAmount || 0,
        advancePaymentAmount: data.advancePaymentAmount || 0,
        progressPaymentTotal: data.progressPaymentTotal || 0,
        remainingBalance: data.balanceAmount || 0
      }
    }
  } catch (error) {
    console.error('자금 요약 조회 실패:', error)
  }
}

// 자금 관련 헬퍼 함수는 useFundStatusFormatters composable에서 가져옴

// 주문 상태 헬퍼 함수
const getOrderStatusClass = (status?: string): string => {
  if (!status) return 'status-pending'
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

const getOrderStatusLabel = (status?: string): string => {
  if (!status) return '대기'
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

// PDF 보기 - 납품확인서
const viewConfirmationPdf = (baselineId: number) => {
  currentPdfUrl.value = baselineService.getConfirmationPdfUrl(baselineId)
  currentPdfFileName.value = `납품확인서_${baselineId}.pdf`
  showPdfModal.value = true
}

// PDF 보기 - 사진대지
const viewPhotoSheetPdf = (baselineId: number) => {
  currentPdfUrl.value = baselineService.getPhotoSheetPdfUrl(baselineId)
  currentPdfFileName.value = `사진대지_${baselineId}.pdf`
  showPdfModal.value = true
}

// 수금확인 모달 열기 (자금관리와 동일한 타입 사용)
const openCollectionConfirmModal = (payment: ProgressPaymentRequest) => {
  collectionPaymentId.value = payment.requestId || payment.paymentId || 0
  collectionRequestAmount.value = payment.requestAmount || payment.amount || 0
  showCollectionConfirmModal.value = true
}

// 수금확인 모달 닫기
const closeCollectionConfirmModal = () => {
  showCollectionConfirmModal.value = false
}

// 수금 확인 처리
const handleCollectionConfirmed = async (data: any) => {
  try {
    await fundService.confirmPayment(fundSummary.value.fundId!, collectionPaymentId.value, {
      paidAmount: data.paidAmount,
      paymentDate: data.paymentDate,
      bankAccount: data.bankAccount,
      remarks: data.remarks
    })
    await loadProgressPayments()
    closeCollectionConfirmModal()
  } catch (error) {
    console.error('수금 확인 처리 실패:', error)
    alert('수금 확인 처리 중 오류가 발생했습니다.')
  }
}

// 자금 관리 상세 이동
const goToFundDetail = () => {
  if (fundSummary.value.fundId) {
    router.push(`/admin/funds/${fundSummary.value.fundId}`)
  } else {
    alert('연결된 자금 정보가 없습니다.')
  }
}

// 컴포넌트 마운트
onMounted(async () => {
  await Promise.all([loadData(), loadCompanies(), loadFundSummary()])
  // fundSummary 로드 후 기성금 데이터 로드 (fundId 필요)
  if (fundSummary.value.fundId) {
    await loadProgressPayments()
  }
})
</script>

<style>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-tabs.css';

/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section, items-table, summary-info, amount-group, amount-display, form-actions
 * - admin-forms.css: form-input-*, info-group, info-grid, grid-5
 * - admin-common.css: empty-row
 */

/* Page-specific: Order edit page wrapper */
.order-edit {
  padding: 0;
  margin-bottom: 0;
}

/* 납품 목록 테이블 셀 간격 축소 */
.order-edit .items-table th,
.order-edit .items-table td {
  padding: 0.375rem 0.25rem;
}

.order-edit .items-table input {
  padding: 0.375rem 0.25rem;
}

/* 탭 네비게이션 (admin-tabs.css override) */
.tab-navigation {
  background: white;
  border-radius: 8px 8px 0 0;
  margin-bottom: 0;
}

.tab-content {
  background: white;
  border-radius: 0 0 8px 8px;
}

/* 기성/납품확인 탭 */
.baseline-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0369a1;
}

.progress-info i {
  font-size: 1.25rem;
}

.progress-info strong {
  color: #075985;
}

/* 기성 유형 배지 */
.baseline-type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-final {
  background: #dcfce7;
  color: #166534;
}

/* 상태 배지는 admin-common.css에서 관리 */

/* 데이터 테이블은 admin-tables.css에서 관리 */
.text-muted {
  color: #9ca3af;
}

.btn-download-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-download-sm:hover {
  background: #b91c1c;
}

/* 자금 탭 */
.fund-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.fund-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.fund-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #f9fafb;
  border-radius: 8px;
}

.fund-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  font-size: 1.25rem;
}

.fund-card-content {
  flex: 1;
}

.fund-card-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.fund-card-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.fund-actions {
  display: flex;
  justify-content: flex-end;
}

/* 반응형 */
@media (max-width: 1024px) {
  .fund-summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .fund-summary-cards {
    grid-template-columns: 1fr;
  }

  .progress-summary {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

/* 주문 상태 배지 (page-specific) */
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
