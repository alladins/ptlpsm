<template>
  <div class="quotation-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="견적서 등록"
      icon="order"
      icon-color="blue"
      description="새로운 견적서를 등록합니다."
    >
      <template #actions>
        <button type="button" class="btn-action btn-secondary" :disabled="submitting" @click="goBack">
          <i class="fas fa-times" />
          취소
        </button>
        <button
          class="btn-action btn-primary"
          :disabled="submitting || !canWrite"
          @click="handleSubmit"
        >
          <i class="fas fa-check" />
          {{ submitting ? '등록 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>
    <div class="content-section">
      <form class="register-form" @submit.prevent="handleSubmit">
        <!-- 기본 정보 (좌) + 거래처 정보 (우) -->
        <div class="header-row">
          <!-- 좌측: 기본정보 + NOTE -->
          <div class="header-left">
            <FormSection title="기본 정보" grid-class="form-grid-single">
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-calendar-alt" />
                  <span>견적 정보</span>
                </div>
                <div class="basic-info-row">
                  <FormField label="견적서 제출일자" required>
                    <input
                      v-model="formData.submitDate"
                      type="date"
                      class="form-input"
                    >
                  </FormField>

                  <FormField label="용역명" required>
                    <input
                      v-model="formData.projectName"
                      type="text"
                      class="form-input"
                      placeholder="용역명을 입력하세요"
                    >
                  </FormField>
                </div>
                <!-- 영업담당자 (SALES_MANAGER 본인이 아닌 경우만 표시) -->
                <div v-if="!isSalesManager" class="sales-manager-row">
                  <FormField label="영업담당자">
                    <select v-model="formData.salesId" class="form-input" @change="onSalesManagerChange">
                      <option :value="undefined">
                        선택하세요
                      </option>
                      <option v-for="user in salesUsers" :key="user.userId" :value="user.userId">
                        {{ user.userName }}{{ user.position ? ` ${user.position}` : '' }}
                      </option>
                    </select>
                  </FormField>
                  <div v-if="selectedSalesUser" class="sales-manager-info">
                    <span class="info-item"><i class="fas fa-user" /> {{ selectedSalesUser.userName }}</span>
                    <span v-if="selectedSalesUser.email" class="info-item"><i class="fas fa-envelope" /> {{ selectedSalesUser.email }}</span>
                    <span v-if="selectedSalesUser.phone" class="info-item"><i class="fas fa-phone" /> {{ selectedSalesUser.phone }}</span>
                  </div>
                </div>
                <div class="note-area">
                  <label class="form-label">NOTE</label>
                  <textarea
                    v-model="formData.noteContent"
                    class="form-textarea"
                    rows="6"
                    placeholder="하단 NOTE 메모를 입력하세요"
                  />
                </div>
              </div>
            </FormSection>
          </div>

          <!-- 우측: 거래처 정보 -->
          <div class="header-right">
            <FormSection title="거래처 (수요기관) 정보" grid-class="form-grid-single">
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-building" />
                  <span>거래처 정보</span>
                </div>
                <div class="client-info-grid">
                  <FormField label="거래처 (수요기관)" required>
                    <DemandOrganizationSelector
                      v-model="formData.clientCode"
                      @organization-selected="handleOrganizationSelected"
                    />
                  </FormField>

                  <FormField label="거래처 담당자">
                    <div class="input-with-card-btn">
                      <input
                        v-model="formData.clientManager"
                        type="text"
                        class="form-input"
                        placeholder="거래처 담당자명"
                      >
                      <BusinessCardSelector
                        :dminstt-cd="formData.clientCode"
                        @card-selected="handleCardSelected"
                      />
                    </div>
                  </FormField>

                  <FormField label="거래처 연락처">
                    <input
                      v-model="formData.clientTel"
                      type="tel"
                      class="form-input"
                      placeholder="010-1234-5678"
                      @input="handlePhoneInput"
                    >
                  </FormField>

                  <FormField label="거래처 이메일" hint="견적서 이메일 발송 시 수신 주소로 사용됩니다" :error="emailError">
                    <input
                      v-model="formData.clientEmail"
                      type="email"
                      class="form-input"
                      placeholder="example@company.com"
                      @blur="validateEmail"
                    >
                  </FormField>
                </div>
              </div>
            </FormSection>
          </div>
        </div>

        <!-- 품목 목록 -->
        <FormSection title="품목 목록" grid-class="form-grid-single">
          <div class="items-section">
            <div class="items-toolbar">
              <div class="items-summary">
                <span class="summary-label">선택된 품목</span>
                <span class="summary-value">{{ items.length }}개</span>
                <span class="summary-divider">|</span>
                <span class="summary-label">합계</span>
                <span class="summary-value">{{ totalAmount.toLocaleString() }}원</span>
              </div>
              <div class="items-actions">
                <button type="button" class="btn-action btn-sm" @click="openSkuSelector">
                  <i class="fas fa-search" /> 품목 선택
                </button>
                <button type="button" class="btn-action btn-sm" @click="addEmptyItem">
                  <i class="fas fa-plus" /> 직접 입력
                </button>
              </div>
            </div>

            <div class="table-container">
              <table class="data-table items-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">
                      No
                    </th>
                    <th style="width: 130px;">
                      식별번호
                    </th>
                    <th style="width: 300px;">
                      품명
                    </th>
                    <th>규격</th>
                    <th style="width: 110px;">
                      수량(m²)
                    </th>
                    <th style="width: 100px;">
                      단가
                    </th>
                    <th style="width: 130px;">
                      견적가
                    </th>
                    <th style="width: 100px;">
                      비고
                    </th>
                    <th style="width: 40px;" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="items.length === 0">
                    <td colspan="9" class="text-center" style="padding: 20px; color: #9ca3af;">
                      품목을 추가해주세요.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in items" :key="index">
                    <td class="text-center">
                      {{ index + 1 }}
                    </td>
                    <td>
                      <input v-model="item.identificationNo" type="text" class="form-input form-input-sm">
                    </td>
                    <td>
                      <input v-model="item.itemName" type="text" class="form-input form-input-sm" placeholder="품명">
                    </td>
                    <td>
                      <input v-model="item.specification" type="text" class="form-input form-input-sm" placeholder="규격">
                    </td>
                    <td>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        step="0.01"
                        class="form-input form-input-sm text-right"
                        @input="calculateItemPrice(index)"
                      >
                    </td>
                    <td>
                      <input
                        :value="item.unitPrice ? item.unitPrice.toLocaleString() : ''"
                        type="text"
                        class="form-input form-input-sm text-right"
                        @input="handleUnitPriceInput($event, index)"
                      >
                    </td>
                    <td>
                      <input
                        :value="item.estimatePrice ? item.estimatePrice.toLocaleString() : ''"
                        type="text"
                        class="form-input form-input-sm text-right"
                        @input="handleEstimatePriceInput($event, index)"
                      >
                    </td>
                    <td>
                      <input v-model="item.remark" type="text" class="form-input form-input-sm">
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn-icon btn-danger-icon" title="삭제" @click="removeItem(index)">
                        <i class="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="items.length > 0">
                  <tr class="total-row">
                    <td colspan="6" class="text-center">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ totalAmount.toLocaleString() }}원</strong>
                    </td>
                    <td colspan="2" />
                  </tr>
                  <tr class="total-row-korean">
                    <td colspan="9" style="padding: 8px 12px; font-size: 0.875rem; color: #6b7280;">
                      합계금액(부가세포함): <strong>{{ totalAmountKorean }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- 품목 선택 모달 -->
            <ItemSkuSelector
              v-model="showItemSelector"
              @sku-selected="handleSkuSelected"
            />
          </div>
        </FormSection>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { usePermission } from '~/composables/usePermission'
import { formatPhoneNumberInput } from '~/utils/format'
import { quotationService, type QuotationRequest, type QuotationItem } from '~/services/quotation.service'
import { type DemandOrganization } from '~/services/demand-organization.service'
import { userService } from '~/services/user.service'
import { useAuthStore } from '~/stores/auth'
import type { UserByRole } from '~/types/user'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import BusinessCardSelector from '~/components/admin/BusinessCardSelector.vue'
import { type BusinessCardResponse } from '~/services/business-card.service'

definePageMeta({
  layout: 'admin',
  pageTitle: '견적서 등록'
})

const router = useRouter()
const authStore = useAuthStore()
const { canWrite } = usePermission()
const submitting = ref(false)

// 영업담당자: 본인이 SALES_MANAGER이면 콤보박스 숨김
const isSalesManager = computed(() => authStore.user?.role === 'SALES_MANAGER')

// 영업담당자 목록
const salesUsers = ref<UserByRole[]>([])
const loadSalesUsers = async () => {
  try {
    salesUsers.value = await userService.getUsersByRoles(['SALES_MANAGER'])
  } catch (error) {
    console.error('영업담당자 목록 조회 실패:', error)
  }
}

// 선택된 영업담당자 정보
const selectedSalesUser = computed(() => {
  if (!formData.value.salesId) { return null }
  return salesUsers.value.find(u => u.userId === formData.value.salesId) || null
})

const onSalesManagerChange = () => {
  // 선택 변경 시 추가 동작 필요하면 여기에
}

onMounted(() => {
  if (!isSalesManager.value) {
    loadSalesUsers()
  }
})

// 폼 데이터
const formData = ref<QuotationRequest>({
  submitDate: new Date().toISOString().split('T')[0],
  projectName: '',
  clientCode: '',
  clientName: '',
  clientManager: '',
  clientTel: '',
  clientEmail: '',
  noteContent: '1. 현장도착도기준이며, 부가세포함 금액입니다.\n2. 당사의 HYDRO-22보드는 KS M ISO 4898 PUR I-D(경질폴리우레탄폼단열재2종2호) 제품입니다.\n3. HYDRO-22보드는 I-D(심재준불연), HYDRO-22-00T-1보드는 I-D(준불연) 제품입니다.\n4. 납품규격(W*L*T): 기본규격 1000*2000 입니다.\n5. 심재준불연보드 - 양면 시멘트면재, 일면준불연보드 - 부착면 시멘트면재 / 내측 알미늄시트면재.'
})

// 품목 목록
const items = ref<QuotationItem[]>([])
const showItemSelector = ref(false)

// 합계금액
const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.estimatePrice || 0), 0)
})

// 한글 금액 (간단한 프론트 변환)
const totalAmountKorean = computed(() => {
  return `₩ ${totalAmount.value.toLocaleString()}`
})

// 수요기관 선택
const handleOrganizationSelected = (org: DemandOrganization) => {
  formData.value.clientCode = org.dminsttCd
  formData.value.clientName = org.dminsttNm
}

// 명함 선택 → 거래처 정보 자동 채움
const handleCardSelected = (card: BusinessCardResponse) => {
  if (card.dminsttCd) {
    formData.value.clientCode = card.dminsttCd
    formData.value.clientName = card.dminsttNm || ''
  }
  formData.value.clientManager = card.contactNm || ''
  formData.value.clientTel = card.contactTel || ''
  formData.value.clientEmail = card.contactEmail || ''
}

// 전화번호 입력
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  formData.value.clientTel = formatPhoneNumberInput(target.value)
}

// 이메일 유효성 검증
const emailError = ref('')
const validateEmail = () => {
  const email = formData.value.clientEmail
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.value = '올바른 이메일 형식이 아닙니다.'
  } else {
    emailError.value = ''
  }
}

// 품목 선택 모달 열기
const openSkuSelector = () => {
  showItemSelector.value = true
}

// SKU 규격 문자열 생성 (skuNm, 너비*높이*두께)
const buildSpecification = (sku: any): string => {
  const skuName = sku.skuNm || ''

  // 치수 정보 (너비*높이*두께)
  const dims: string[] = []
  if (sku.width) { dims.push(`${sku.width}`) }
  if (sku.height) { dims.push(`${sku.height}`) }
  if (sku.thickness) { dims.push(`${sku.thickness}`) }

  if (skuName && dims.length > 0) {
    return `${skuName}, ${dims.join('*')}`
  }
  return skuName || dims.join('*')
}

// SKU 선택 처리 (품목 선택 모달에서 item, sku 두 인자)
const handleSkuSelected = (item: any, sku: any) => {
  const itemName = item.itemNm || ''
  const specification = buildSpecification(sku)

  // 중복 체크
  const exists = items.value.some(i => i.itemName === itemName && i.specification === specification)
  if (exists) {
    alert('이미 추가된 품목입니다.')
    return
  }

  items.value.push({
    identificationNo: item.itemClassificationNumber || item.itemId || '',
    itemName,
    specification,
    quantity: 1,
    unitPrice: sku.unitPrice || item.unitPrice || 0,
    estimatePrice: sku.unitPrice || item.unitPrice || 0,
    remark: ''
  })
}

// 빈 행 직접 추가
const addEmptyItem = () => {
  items.value.push({
    identificationNo: '',
    itemName: '',
    specification: '',
    quantity: 1,
    unitPrice: 0,
    estimatePrice: 0,
    remark: ''
  })
}

// 품목 삭제
const removeItem = (index: number) => {
  items.value.splice(index, 1)
}

// 견적가 자동 계산 (수량 x 단가)
const calculateItemPrice = (index: number) => {
  const item = items.value[index]
  if (item.quantity && item.unitPrice) {
    item.estimatePrice = Math.round(item.quantity * item.unitPrice)
  }
}

// 단가 입력 처리 (콤마 제거)
const handleUnitPriceInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseInt(numericValue) || 0
  items.value[index].unitPrice = parsed
  calculateItemPrice(index)
}

// 견적가 직접 입력
const handleEstimatePriceInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  items.value[index].estimatePrice = parseInt(numericValue) || 0
}

// 저장
const handleSubmit = async () => {
  // 검증
  if (!formData.value.submitDate) {
    alert('견적서 제출일자를 입력해주세요.')
    return
  }
  if (!formData.value.projectName) {
    alert('용역명을 입력해주세요.')
    return
  }
  if (!formData.value.clientName) {
    alert('거래처를 선택해주세요.')
    return
  }

  // 이메일 유효성 체크
  if (formData.value.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.clientEmail)) {
    alert('거래처 이메일 형식이 올바르지 않습니다.')
    return
  }

  submitting.value = true
  try {
    const requestData: QuotationRequest = {
      ...formData.value,
      items: items.value.filter(item => item.itemName).map((item, idx) => ({
        ...item,
        sortOrder: idx + 1
      }))
    }

    await quotationService.createQuotation(requestData)
    alert('견적서가 등록되었습니다.')
    router.push('/admin/quotation/list')
  } catch (error) {
    console.error('견적서 등록 실패:', error)
    alert('견적서 등록에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

const goBack = () => router.push('/admin/quotation/list')
</script>

<style scoped>
.quotation-register {
  padding: 0;
}
.content-section {
  background: transparent;
  padding: 0;
  margin-top: -1rem;
}
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header-row {
  display: flex;
  gap: 1rem;
}
.header-left {
  flex: 1;
  min-width: 0;
}
.header-right {
  flex: 1;
  min-width: 0;
}
/* FormSection 내부 1열 그리드 */
:deep(.form-grid-single) {
  display: block !important;
}
/* 좌우 블록 내부 전체 너비 사용 */
.header-row :deep(.info-group) {
  width: 100%;
}
.header-row :deep(.form-field) {
  width: 100%;
  min-width: 0;
}
.header-row :deep(.form-input),
.header-row :deep(.form-select),
.header-row :deep(.form-textarea),
.header-row :deep(.selector-wrapper),
.header-row :deep(.selector-input) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
}
/* 기본정보: 제출일자 + 용역명 한줄 */
.basic-info-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0.8rem;
  padding: 0.9rem;
  width: 100%;
}
/* 영업담당자 행 */
.sales-manager-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.9rem;
  border-top: 1px solid #e5e7eb;
}
.sales-manager-row :deep(.form-field) {
  width: 200px;
  min-width: 200px;
  max-width: 200px;
  flex-shrink: 0;
}
.sales-manager-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #4b5563;
  flex: 1;
  min-height: 38px;
}
.sales-manager-info .info-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.sales-manager-info .info-item i {
  color: #9ca3af;
  font-size: 0.75rem;
}
/* 명함선택 버튼 + 입력필드 조합 */
.input-with-card-btn {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}
.input-with-card-btn .form-input {
  flex: 1;
}
/* 거래처 정보: 2열 x 2행 */
.client-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  padding: 0.9rem;
  width: 100%;
}
/* NOTE 영역 (기본정보 내부) */
.note-area {
  padding: 0.9rem;
  border-top: 1px solid #e5e7eb;
}
.note-area .form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.4rem;
  display: block;
}
.note-area .form-textarea {
  width: 100% !important;
}
.items-section {
  margin-top: 0;
}
.items-toolbar {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.items-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}
.summary-label {
  color: #6b7280;
}
.summary-value {
  font-weight: 600;
  color: #1f2937;
}
.summary-divider {
  color: #d1d5db;
}
.items-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}
.items-table .form-input-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  height: 30px;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
}
.btn-danger-icon {
  color: #ef4444;
}
.btn-danger-icon:hover {
  color: #dc2626;
}
.total-row td {
  background-color: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 8px 12px;
}
.total-row-korean td {
  background-color: #f9fafb;
}
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }
  .header-row {
    flex-direction: column;
  }
}
</style>
