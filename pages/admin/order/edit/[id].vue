<template>
  <div class="order-edit">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품요구 수정"
      description="납품요구 정보를 수정합니다."
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
          <!-- 현장소장 선택 (수정 가능) -->
          <div class="info-grid grid-2">
            <FormField label="현장소장">
              <select
                v-model="formData.siteManagerId"
                @change="handleSupervisorChange"
                class="form-input-sm"
              >
                <option :value="null">선택하세요</option>
                <option
                  v-for="manager in siteManagers"
                  :key="manager.userid"
                  :value="manager.userid"
                >
                  {{ manager.userName }}
                </option>
              </select>
            </FormField>
            <FormField label="회사명">
              <input
                type="text"
                :value="selectedSupervisorCompany"
                class="form-input-sm"
                readonly
              >
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
                <th style="width: 30px">순번</th>
                <th style="width: 60px">품명</th>
                <th style="width: 280px">규격</th>
                <th style="width: 30px">단위</th>
                <th style="width: 50px">단가</th>
                <th style="width: 40px">수량</th>
                <th style="width: 60px">금액</th>
                <th style="width: 100px">납품장소</th>
                <th style="width: 80px">납품기한</th>
                <th style="width: 100px">납품조건</th>
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
        <button type="button" @click="handleSave" class="btn-primary" :disabled="submitting">
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
            <button class="btn-primary" @click="openProgressPaymentModal">
              <i class="fas fa-plus"></i>
              기성 청구하기
            </button>
          </div>

          <!-- 차수 목록 테이블 -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th>유형</th>
                  <th>확정일</th>
                  <th>납품수량</th>
                  <th>청구금액</th>
                  <th>납품확인서</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="baselines.length === 0">
                  <td colspan="7" class="no-data">기성/납품확인 이력이 없습니다.</td>
                </tr>
                <tr v-else v-for="baseline in baselines" :key="baseline.baselineId">
                  <td>{{ baseline.baselineSeq }}차</td>
                  <td>
                    <span class="baseline-type-badge" :class="getBaselineTypeClass(baseline.baselineType)">
                      {{ getBaselineTypeLabel(baseline.baselineType) }}
                    </span>
                  </td>
                  <td>{{ baseline.baselineDate || '-' }}</td>
                  <td class="text-right">{{ formatNumber(baseline.totalQuantity) }}</td>
                  <td class="text-right">{{ formatCurrency(baseline.totalAmount) }}</td>
                  <td>
                    <button
                      v-if="baseline.deliveryConfirmationUrl"
                      class="btn-download-sm"
                      @click="downloadDeliveryConfirmation(baseline.deliveryConfirmationUrl)"
                    >
                      <i class="fas fa-file-pdf"></i>
                      다운로드
                    </button>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="getBaselineStatusClass(baseline.status)">
                      {{ getBaselineStatusLabel(baseline.status) }}
                    </span>
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
                <div class="fund-card-value">{{ formatCurrency(fundSummary.advancePayment) }}</div>
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

    <!-- 기성 청구 모달 -->
    <ProgressPaymentModal
      :is-open="showProgressPaymentModal"
      :order-id="orderId"
      :fund-id="fundSummary.fundId || 0"
      @close="closeProgressPaymentModal"
      @submitted="handleProgressPaymentSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { orderService } from '~/services/order.service'
import { userService } from '~/services/user.service'
import { baselineService } from '~/services/baseline.service'
import { fundService } from '~/services/fund.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import type { OrderDetailResponse } from '~/types/order'
import type { UserByRole } from '~/types/user'
import type { BaselineListItem, BaselineType, BaselineStatus } from '~/types/baseline'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import ProgressPaymentModal from '~/components/fund/ProgressPaymentModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요구 수정'
})

const router = useRouter()
const route = useRoute()
const orderId = computed(() => Number(route.params.id))

// 상태
const loading = ref(true)
const submitting = ref(false)
const orderData = ref<OrderDetailResponse | null>(null)
const items = ref<any[]>([])

// 탭 관련 상태
const activeTab = ref('info')
const tabs = computed(() => [
  { id: 'info', label: '기본정보', icon: 'fas fa-info-circle' },
  { id: 'baseline', label: '기성/납품확인', icon: 'fas fa-check-double', badge: baselines.value.length > 0 ? baselines.value.length : null },
  { id: 'fund', label: '자금', icon: 'fas fa-coins' }
])

// 현장소장 목록
const siteManagers = ref<UserByRole[]>([])
const selectedSupervisorCompany = ref('')

// 수정 가능한 폼 데이터
const formData = ref({
  siteManagerId: null as number | null,
  builder: ''
})

// 기성/납품확인 관련 상태
const baselines = ref<BaselineListItem[]>([])
const showProgressPaymentModal = ref(false)

// 자금 관련 상태
const fundSummary = ref({
  fundId: null as number | null,
  totalContractAmount: 0,
  advancePayment: 0,
  progressPaymentTotal: 0,
  remainingBalance: 0
})

// 기성 진행 현황
const baselineProgress = computed(() => {
  const total = baselines.value.length
  const confirmed = baselines.value.filter(b => b.status === 'CONFIRMED').length
  return { total, confirmed }
})

// 수량 합계 (부동소수점 오류 방지를 위해 toFixed 사용)
const totalQuantity = computed(() => {
  const sum = items.value.reduce((acc, item) => acc + (item.quantity || 0), 0)
  // 소수점 2자리까지만 표시하고 불필요한 0 제거
  return parseFloat(sum.toFixed(2))
})

// 데이터 로드
const loadData = async () => {
  try {
    loading.value = true
    const data = await orderService.getOrderDetail(orderId.value)
    orderData.value = data

    // 품목 데이터 변환 (서버 응답 필드명에 맞게 매핑)
    items.value = data.items.map((item: any) => ({
      productName: item.productName || item.itemNm,  // 서버: productName
      specification: item.specification,
      unit: item.unit || item.unitCd,                // 서버: unit
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      deliveryLocation: item.deliveryLocation,
      deliveryDeadline: item.deliveryDeadline,
      deliveryTerms: item.deliveryTerms
    }))

    // 현장소장 정보 복원
    if (data.siteManagerId) {
      formData.value.siteManagerId = data.siteManagerId
      formData.value.builder = data.builder || ''
      selectedSupervisorCompany.value = data.builder || ''
    }
  } catch (error) {
    console.error('납품요구 정보 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

// 현장소장 목록 조회
const loadSiteManagers = async () => {
  try {
    const managers = await userService.getUsersByRoles(['SITE_MANAGER'])
    siteManagers.value = managers
  } catch (error) {
    console.error('현장소장 목록 조회 실패:', error)
  }
}

// 현장소장 선택 핸들러
const handleSupervisorChange = () => {
  const supervisor = siteManagers.value.find(m => m.userid === formData.value.siteManagerId)
  if (supervisor) {
    formData.value.builder = supervisor.companyName || ''
    selectedSupervisorCompany.value = supervisor.companyName || ''
  } else {
    formData.value.builder = ''
    selectedSupervisorCompany.value = ''
  }
}

// 저장
const handleSave = async () => {
  if (submitting.value) return

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
      builder: formData.value.builder || null,
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
    router.push('/admin/order/list')
  } catch (error) {
    console.error('납품요구 수정 실패:', error)
    alert('납품요구 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 목록으로 이동
const goBack = () => {
  router.push('/admin/order/list')
}

// 기성/납품확인 데이터 로드
const loadBaselines = async () => {
  try {
    const data = await baselineService.getBaselines({ orderId: orderId.value })
    baselines.value = data.content || []
  } catch (error) {
    console.error('기성/납품확인 목록 조회 실패:', error)
  }
}

// 자금 요약 데이터 로드
const loadFundSummary = async () => {
  try {
    const data = await fundService.getFundByOrderId(orderId.value)
    if (data) {
      // Fund 타입 필드명 매핑
      // contractTotalAmount → totalContractAmount (표시용)
      // advancePaymentAmount → advancePayment (표시용)
      // balanceAmount → remainingBalance (표시용)
      fundSummary.value = {
        fundId: data.fundId,
        totalContractAmount: data.contractTotalAmount || 0,
        advancePayment: data.advancePaymentAmount || 0,
        progressPaymentTotal: data.progressPaymentTotal || 0,
        remainingBalance: data.balanceAmount || 0
      }
    }
  } catch (error) {
    console.error('자금 요약 조회 실패:', error)
  }
}

// 기성 청구 모달 열기
const openProgressPaymentModal = () => {
  showProgressPaymentModal.value = true
}

// 기성 청구 모달 닫기
const closeProgressPaymentModal = () => {
  showProgressPaymentModal.value = false
}

// 기성 청구 완료 후 처리
const handleProgressPaymentSubmitted = async () => {
  closeProgressPaymentModal()
  await Promise.all([loadBaselines(), loadFundSummary()])
}

// 기성 유형 클래스
const getBaselineTypeClass = (type?: BaselineType): string => {
  if (!type) return ''
  switch (type) {
    case 'PROGRESS':
      return 'type-progress'
    case 'FINAL':
      return 'type-final'
    default:
      return ''
  }
}

// 기성 유형 라벨
const getBaselineTypeLabel = (type?: BaselineType): string => {
  if (!type) return '-'
  const labels: Record<BaselineType, string> = {
    PROGRESS: '기성',
    FINAL: '납품완료'
  }
  return labels[type] || type
}

// 기성 상태 클래스
const getBaselineStatusClass = (status?: BaselineStatus): string => {
  if (!status) return ''
  switch (status) {
    case 'DRAFT':
      return 'status-draft'
    case 'CONFIRMED':
      return 'status-confirmed'
    case 'CANCELLED':
      return 'status-cancelled'
    default:
      return ''
  }
}

// 기성 상태 라벨
const getBaselineStatusLabel = (status?: BaselineStatus): string => {
  if (!status) return '-'
  const labels: Record<BaselineStatus, string> = {
    DRAFT: '작성중',
    CONFIRMED: '확정',
    CANCELLED: '취소'
  }
  return labels[status] || status
}

// 납품확인서 다운로드
const downloadDeliveryConfirmation = (url: string) => {
  window.open(url, '_blank')
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
  await Promise.all([loadData(), loadSiteManagers(), loadBaselines(), loadFundSummary()])

  // 현장소장 목록 로드 후 시공사명 매핑
  if (formData.value.siteManagerId) {
    const supervisor = siteManagers.value.find(m => m.userid === formData.value.siteManagerId)
    if (supervisor) {
      selectedSupervisorCompany.value = supervisor.companyName || ''
      // builder가 비어있으면 companyName으로 설정
      if (!formData.value.builder) {
        formData.value.builder = supervisor.companyName || ''
      }
    }
  }
})
</script>

<style>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

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

/* 탭 네비게이션 */
.tab-navigation {
  display: flex;
  background: white;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0;
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

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tab-content {
  background: white;
  border-radius: 0 0 8px 8px;
  padding: 1.5rem;
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

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-draft {
  background: #fef3c7;
  color: #d97706;
}

.status-confirmed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* 데이터 테이블 */
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
}

.data-table .no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
}

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
  .tab-navigation {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: 1;
    justify-content: center;
    min-width: 100px;
  }

  .fund-summary-cards {
    grid-template-columns: 1fr;
  }

  .progress-summary {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
