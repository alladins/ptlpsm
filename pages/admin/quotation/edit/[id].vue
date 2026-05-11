<template>
  <div class="quotation-edit">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="견적서 수정"
      icon="order"
      icon-color="blue"
      :description="`견적번호: ${quotationNo}`"
    >
      <template #actions>
        <button type="button" class="btn-action btn-secondary" :disabled="!hasPdf" @click="handlePreviewPdf">
          <i class="fas fa-eye" />
          PDF 미리보기
        </button>
        <button type="button" class="btn-action btn-secondary" :disabled="generatingPdf || !needsPdfGeneration" @click="handleGeneratePdf">
          <i class="fas fa-file-export" />
          {{ generatingPdf ? 'PDF 생성 중...' : 'PDF 생성' }}
        </button>
        <button
          type="button"
          class="btn-action"
          :disabled="!canSendEmail || sendingEmail"
          :title="!formData.clientEmail ? '거래처 이메일이 없습니다' : ''"
          @click="handleSendEmail"
        >
          <i class="fas fa-envelope" />
          {{ sendingEmail ? '발송 중...' : '이메일 발송' }}
        </button>
        <button
          type="button"
          class="btn-action btn-danger"
          :disabled="!canDelete || !isDraft"
          @click="handleDelete"
        >
          <i class="fas fa-trash" />
          삭제
        </button>
        <button type="button" class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-list" />
          목록
        </button>
        <button
          class="btn-action btn-primary"
          :disabled="submitting || !canEdit || !isDraft"
          :title="!isDraft ? 'DRAFT 상태에서만 수정 가능합니다' : ''"
          @click="handleSubmit"
        >
          <i class="fas fa-save" />
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 로딩 -->
      <div v-if="loadingData" class="loading-message">
        <i class="fas fa-spinner fa-spin" />
        <p>견적서를 불러오는 중...</p>
      </div>

      <form v-else class="register-form" @submit.prevent="handleSubmit">
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
                    <input v-model="formData.submitDate" type="date" class="form-input" :disabled="!isDraft">
                  </FormField>

                  <FormField label="용역명" required>
                    <input v-model="formData.projectName" type="text" class="form-input" placeholder="용역명" :disabled="!isDraft">
                  </FormField>
                </div>
                <!-- 영업담당자 (SALES_MANAGER 본인이 아닌 경우만 표시) -->
                <div v-if="!isSalesManager" class="sales-manager-row">
                  <FormField label="영업담당자">
                    <select v-model="formData.salesId" class="form-input" :disabled="!isDraft">
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
                <div class="status-area">
                  <span class="status-label">상태:</span>
                  <span class="status-badge" :class="getStatusClass(currentStatus)">
                    {{ getStatusLabel(currentStatus) }}
                  </span>
                </div>
                <div class="note-area">
                  <label class="form-label">NOTE</label>
                  <textarea
                    v-model="formData.noteContent"
                    class="form-textarea"
                    rows="3"
                    placeholder="하단 NOTE 메모를 입력하세요"
                    :disabled="!isDraft"
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
                      :disabled="!isDraft"
                      @organization-selected="handleOrganizationSelected"
                    />
                  </FormField>

                  <FormField label="거래처 담당자">
                    <div class="input-with-card-btn">
                      <input v-model="formData.clientManager" type="text" class="form-input" placeholder="담당자명" :disabled="!isDraft">
                      <BusinessCardSelector
                        v-if="isDraft"
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
                      :disabled="!isDraft"
                      @input="handlePhoneInput"
                    >
                  </FormField>

                  <FormField label="거래처 이메일" hint="이메일 발송 시 수신 주소" :error="emailError">
                    <input
                      v-model="formData.clientEmail"
                      type="email"
                      class="form-input"
                      placeholder="example@company.com"
                      :disabled="!isDraft"
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
              <div v-if="isDraft" class="items-actions">
                <button type="button" class="btn-action btn-sm" @click="openSkuSelector">
                  <i class="fas fa-search" /> 품목 선택
                </button>
                <button type="button" class="btn-action btn-sm" @click="addItem">
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
                    <th v-if="isDraft" style="width: 40px;" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="items.length === 0">
                    <td :colspan="isDraft ? 9 : 8" class="text-center" style="padding: 20px; color: #9ca3af;">
                      품목이 없습니다.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in items" :key="index">
                    <td class="text-center">
                      {{ index + 1 }}
                    </td>
                    <td><input v-model="item.identificationNo" type="text" class="form-input form-input-sm" :disabled="!isDraft"></td>
                    <td><input v-model="item.itemName" type="text" class="form-input form-input-sm" :disabled="!isDraft"></td>
                    <td><input v-model="item.specification" type="text" class="form-input form-input-sm" :disabled="!isDraft"></td>
                    <td>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        step="0.01"
                        class="form-input form-input-sm text-right"
                        :disabled="!isDraft"
                        @input="calculateItemPrice(index)"
                      >
                    </td>
                    <td>
                      <input
                        :value="item.unitPrice ? item.unitPrice.toLocaleString() : ''"
                        type="text"
                        class="form-input form-input-sm text-right"
                        :disabled="!isDraft"
                        @input="handleUnitPriceInput($event, index)"
                      >
                    </td>
                    <td>
                      <input
                        :value="item.estimatePrice ? item.estimatePrice.toLocaleString() : ''"
                        type="text"
                        class="form-input form-input-sm text-right"
                        :disabled="!isDraft"
                        @input="handleEstimatePriceInput($event, index)"
                      >
                    </td>
                    <td><input v-model="item.remark" type="text" class="form-input form-input-sm" :disabled="!isDraft"></td>
                    <td v-if="isDraft" class="text-center">
                      <button type="button" class="btn-icon btn-danger-icon" @click="removeItem(index)">
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
                    <td :colspan="isDraft ? 2 : 1" />
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

    <!-- 이메일 발송 모달 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEmailConfirm" class="ccm-modal-overlay" @click.self="showEmailConfirm = false">
          <div class="ccm-modal-container ccm-modal-medium">
            <!-- 모달 헤더 -->
            <div class="ccm-modal-header">
              <div class="ccm-header-content">
                <div class="ccm-header-icon ccm-icon-blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="ccm-header-text">
                  <h2 class="ccm-modal-title">
                    견적서 이메일 발송
                  </h2>
                </div>
              </div>
              <button class="ccm-close-button" :disabled="sendingEmail" @click="showEmailConfirm = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <!-- 모달 바디 -->
            <div class="ccm-modal-body">
              <div class="ccm-form">
                <div class="ccm-form-group">
                  <label class="ccm-form-label">수신자</label>
                  <div class="email-address-display">
                    {{ formData.clientEmail }}
                  </div>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">제목</label>
                  <input v-model="emailSubject" type="text" class="ccm-form-input" placeholder="이메일 제목을 입력하세요">
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">내용</label>
                  <textarea v-model="emailBody" class="ccm-form-input ccm-textarea email-body-textarea" rows="8" placeholder="이메일 내용을 입력하세요" />
                  <div class="email-signature-preview">
                    <div class="signature-divider">
                      ──────────────────
                    </div>
                    <div class="signature-name">
                      {{ emailSignatureName }}
                    </div>
                    <div v-if="emailSignaturePhone" class="signature-detail">
                      Tel: {{ emailSignaturePhone }}
                    </div>
                    <div v-if="emailSignatureEmail" class="signature-detail">
                      Email: {{ emailSignatureEmail }}
                    </div>
                    <div class="signature-company">
                      (주)리드파워 | Leadpower21.com
                    </div>
                    <img src="/images/common/logo.png" alt="리드파워" class="signature-logo">
                    <div class="signature-reply-notice">
                      ※ 본 메일에 회신하시면 담당자 이메일로 직접 전달됩니다.
                    </div>
                  </div>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">첨부파일</label>
                  <div v-if="hasPdf" class="email-attachment">
                    <i class="fas fa-file-pdf" />
                    <span>견적서_{{ quotationNo }}.pdf</span>
                  </div>
                  <div v-else class="email-attachment-warning">
                    <i class="fas fa-exclamation-triangle" />
                    <span>PDF를 먼저 생성해주세요</span>
                  </div>
                </div>

                <!-- 회사 문서 첨부 (선택) -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label">회사 문서 첨부 (선택)</label>
                  <div v-if="loadingCompanyFiles" class="company-files-loading">
                    불러오는 중...
                  </div>
                  <div v-else-if="companyFileGroups.length === 0" class="company-files-empty">
                    등록된 회사 문서가 없습니다.
                  </div>
                  <div v-else class="company-files-container">
                    <div
                      v-for="group in companyFileGroups"
                      :key="group.categoryCd"
                      class="company-file-group"
                    >
                      <div
                        class="company-file-group-header"
                        :class="{ 'is-expanded': isCategoryExpanded(group.categoryCd) }"
                        @click="toggleCategoryExpand(group.categoryCd)"
                      >
                        <label class="company-file-category-checkbox" @click.stop>
                          <input
                            type="checkbox"
                            :checked="isCategoryAllSelected(group)"
                            :indeterminate.prop="isCategoryPartialSelected(group)"
                            @change="toggleCategory(group, ($event.target as HTMLInputElement).checked)"
                          >
                          <span class="company-file-category-name">{{ group.categoryNm }}</span>
                          <span class="company-file-category-count">({{ group.files.length }})</span>
                        </label>
                        <i class="fas fa-chevron-down company-file-chevron" />
                      </div>
                      <div v-if="isCategoryExpanded(group.categoryCd)" class="company-file-list">
                        <label
                          v-for="file in group.files"
                          :key="file.id"
                          class="company-file-item"
                        >
                          <input
                            v-model="selectedCompanyFileIds"
                            type="checkbox"
                            :value="file.id"
                          >
                          <span class="company-file-name">{{ file.fileNm }}</span>
                          <span class="company-file-size">{{ formatFileSize(file.fileSize) }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div v-if="selectedCompanyFileIds.length > 0" class="company-files-summary">
                    선택 {{ selectedCompanyFileIds.length }}건 · 총 용량 {{ formatFileSize(selectedTotalSize) }}
                  </div>
                  <div v-if="exceedsAttachmentLimit" class="company-files-warning">
                    <i class="fas fa-exclamation-triangle" />
                    첨부 합계가 25MB를 초과합니다. 일부 메일 서버에서 거부될 수 있습니다.
                  </div>
                </div>
              </div>
            </div>

            <!-- 모달 푸터 -->
            <div class="ccm-modal-footer">
              <button class="ccm-btn-cancel" :disabled="sendingEmail" @click="showEmailConfirm = false">
                취소
              </button>
              <button class="ccm-btn-confirm" :disabled="sendingEmail || !hasPdf" @click="confirmSendEmail">
                <svg
                  v-if="!sendingEmail"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="width: 18px; height: 18px;"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div v-else class="ccm-loading-spinner" />
                {{ sendingEmail ? '발송 중...' : '발송' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { usePermission } from '~/composables/usePermission'
import { formatPhoneNumberInput } from '~/utils/format'
import { quotationService, type QuotationRequest, type QuotationItem } from '~/services/quotation.service'
import { companyFileService, type CompanyFile } from '~/services/company-file.service'
import { useAuthStore } from '~/stores/auth'
import { userService } from '~/services/user.service'
import type { UserByRole } from '~/types/user'
import { type DemandOrganization } from '~/services/demand-organization.service'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import BusinessCardSelector from '~/components/admin/BusinessCardSelector.vue'
import { type BusinessCardResponse } from '~/services/business-card.service'

definePageMeta({
  layout: 'admin',
  pageTitle: '견적서 수정'
})

const router = useRouter()
const route = useRoute()
const quotationId = computed(() => Number(route.params.id))
const { canEdit, canDelete } = usePermission()

// 영업담당자: 본인이 SALES_MANAGER이면 콤보박스 숨김
const authStore = useAuthStore()
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

// 이메일 서명 미리보기용 computed
const emailSignatureName = computed(() => {
  const salesUser = selectedSalesUser.value
  const user = authStore.user
  const name = salesUser?.userName || user?.userName || ''
  const position = salesUser?.position || user?.position || ''
  return position ? `${name} ${position}` : name
})
const emailSignaturePhone = computed(() => {
  return selectedSalesUser.value?.phone || authStore.user?.phone || ''
})
const emailSignatureEmail = computed(() => {
  return selectedSalesUser.value?.email || authStore.user?.email || ''
})

const loadingData = ref(true)
const submitting = ref(false)
const generatingPdf = ref(false)
const sendingEmail = ref(false)
const showEmailConfirm = ref(false)

const quotationNo = ref('')
const currentStatus = ref('DRAFT')
const hasPdf = ref(false)

const isDraft = computed(() => currentStatus.value === 'DRAFT')
const canSendEmail = computed(() => !!formData.value.clientEmail && hasPdf.value)

// PDF 생성 필요 여부 (updatedAt 기반)
const dataUpdatedAt = ref('')
const pdfGeneratedAt = ref('')

const needsPdfGeneration = computed(() => {
  if (!hasPdf.value) { return true }
  if (isDraft.value && dataUpdatedAt.value && pdfGeneratedAt.value && dataUpdatedAt.value !== pdfGeneratedAt.value) { return true }
  return false
})

const formData = ref<QuotationRequest>({
  submitDate: '',
  projectName: '',
  clientCode: '',
  clientName: '',
  clientManager: '',
  clientTel: '',
  clientEmail: '',
  noteContent: '',
  salesId: undefined
})

const items = ref<QuotationItem[]>([])
const showItemSelector = ref(false)

const totalAmount = computed(() =>
  items.value.reduce((sum, item) => sum + (item.estimatePrice || 0), 0)
)

// 상태 표시
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = { DRAFT: '작성중', SUBMITTED: '제출', CANCELLED: '취소' }
  return labels[status] || status
}
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = { DRAFT: 'status-draft', SUBMITTED: 'status-completed', CANCELLED: 'status-cancelled' }
  return classes[status] || ''
}

// 데이터 로드
const loadQuotation = async () => {
  loadingData.value = true
  try {
    const data = await quotationService.getQuotationById(quotationId.value)
    quotationNo.value = data.quotationNo
    currentStatus.value = data.status
    hasPdf.value = !!data.pdfPath
    dataUpdatedAt.value = data.updatedAt || ''
    // PDF가 있으면 현재 updatedAt를 PDF 생성 시점으로 간주
    if (hasPdf.value && !pdfGeneratedAt.value) {
      pdfGeneratedAt.value = data.updatedAt || ''
    }

    formData.value = {
      submitDate: data.submitDate,
      projectName: data.projectName || '',
      clientCode: data.clientCode || '',
      clientName: data.clientName || '',
      clientManager: data.clientManager || '',
      clientTel: data.clientTel || '',
      clientEmail: data.clientEmail || '',
      noteContent: data.noteContent || '',
      salesId: data.salesId || undefined
    }

    items.value = (data.items || []).map(item => ({
      qiId: item.qiId,
      identificationNo: item.identificationNo || '',
      itemName: item.itemName || '',
      specification: item.specification || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      estimatePrice: item.estimatePrice,
      remark: item.remark || '',
      skuId: item.skuId
    }))
  } catch (error) {
    console.error('견적서 로드 실패:', error)
    alert('견적서를 불러올 수 없습니다.')
    router.push('/admin/quotation/list')
  } finally {
    loadingData.value = false
  }
}

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

const handlePhoneInput = (event: Event) => {
  formData.value.clientTel = formatPhoneNumberInput((event.target as HTMLInputElement).value)
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

// 품목 관리
const openSkuSelector = () => { showItemSelector.value = true }

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

const handleSkuSelected = (item: any, sku: any) => {
  const itemName = item.itemNm || ''
  const specification = buildSpecification(sku)
  const exists = items.value.some(i => i.itemName === itemName && i.specification === specification)
  if (exists) { alert('이미 추가된 품목입니다.'); return }
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

const addItem = () => {
  items.value.push({ identificationNo: '', itemName: '', specification: '', quantity: 1, unitPrice: 0, estimatePrice: 0, remark: '' })
}
const removeItem = (index: number) => items.value.splice(index, 1)

const calculateItemPrice = (index: number) => {
  const item = items.value[index]
  if (item.quantity && item.unitPrice) {
    item.estimatePrice = Math.round(item.quantity * item.unitPrice)
  }
}
const handleUnitPriceInput = (event: Event, index: number) => {
  const val = (event.target as HTMLInputElement).value.replace(/,/g, '')
  items.value[index].unitPrice = parseInt(val) || 0
  calculateItemPrice(index)
}
const handleEstimatePriceInput = (event: Event, index: number) => {
  const val = (event.target as HTMLInputElement).value.replace(/,/g, '')
  items.value[index].estimatePrice = parseInt(val) || 0
}

// 저장
const handleSubmit = async () => {
  if (!formData.value.submitDate) { alert('제출일자를 입력해주세요.'); return }
  if (!formData.value.projectName) { alert('용역명을 입력해주세요.'); return }
  if (!formData.value.clientName) { alert('거래처를 선택해주세요.'); return }

  // 이메일 유효성 체크
  if (formData.value.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.clientEmail)) {
    alert('거래처 이메일 형식이 올바르지 않습니다.')
    return
  }

  submitting.value = true
  try {
    const requestData: QuotationRequest = {
      ...formData.value,
      items: items.value.filter(item => item.itemName).map((item, idx) => ({ ...item, sortOrder: idx + 1 }))
    }
    await quotationService.updateQuotation(quotationId.value, requestData)
    alert('견적서가 수정되었습니다.')
    await loadQuotation()
  } catch (error) {
    console.error('견적서 수정 실패:', error)
    alert('견적서 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// PDF
const handleGeneratePdf = async () => {
  generatingPdf.value = true
  try {
    await quotationService.generatePdf(quotationId.value)
    hasPdf.value = true
    pdfGeneratedAt.value = dataUpdatedAt.value
    alert('PDF가 생성되었습니다.')
    // 생성 후 자동 미리보기
    await quotationService.previewPdf(quotationId.value)
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    alert('PDF 생성에 실패했습니다.')
  } finally {
    generatingPdf.value = false
  }
}

const handlePreviewPdf = async () => {
  try {
    await quotationService.previewPdf(quotationId.value)
  } catch (error) {
    console.error('PDF 미리보기 실패:', error)
    alert('PDF 미리보기에 실패했습니다.')
  }
}

const handleDownloadPdf = async () => {
  try {
    await quotationService.downloadPdf(quotationId.value)
  } catch (error) {
    console.error('PDF 다운로드 실패:', error)
    alert('PDF 다운로드에 실패했습니다.')
  }
}

// 이메일
const emailSubject = ref('')
const emailBody = ref('')

// 회사 문서 첨부 관련
interface CompanyFileGroup {
  categoryCd: string
  categoryNm: string
  files: CompanyFile[]
}

const companyFiles = ref<CompanyFile[]>([])
const loadingCompanyFiles = ref(false)
const selectedCompanyFileIds = ref<number[]>([])
const expandedCategories = ref<Set<string>>(new Set()) // 펼친 카테고리 코드 집합
const ATTACHMENT_LIMIT_BYTES = 25 * 1024 * 1024 // 25MB

const isCategoryExpanded = (categoryCd: string): boolean => expandedCategories.value.has(categoryCd)

const toggleCategoryExpand = (categoryCd: string) => {
  const next = new Set(expandedCategories.value)
  if (next.has(categoryCd)) {
    next.delete(categoryCd)
  } else {
    next.add(categoryCd)
  }
  expandedCategories.value = next
}

// 카테고리별 그룹핑
const companyFileGroups = computed<CompanyFileGroup[]>(() => {
  const groupMap = new Map<string, CompanyFileGroup>()
  for (const f of companyFiles.value) {
    if (!groupMap.has(f.categoryCd)) {
      groupMap.set(f.categoryCd, {
        categoryCd: f.categoryCd,
        categoryNm: f.categoryNm || f.categoryCd,
        files: []
      })
    }
    groupMap.get(f.categoryCd)!.files.push(f)
  }
  return Array.from(groupMap.values())
})

// 선택된 파일 합계 용량
const selectedTotalSize = computed(() => {
  const idSet = new Set(selectedCompanyFileIds.value)
  return companyFiles.value
    .filter(f => idSet.has(f.id))
    .reduce((sum, f) => sum + (f.fileSize || 0), 0)
})

const exceedsAttachmentLimit = computed(() => selectedTotalSize.value > ATTACHMENT_LIMIT_BYTES)

const isCategoryAllSelected = (group: CompanyFileGroup): boolean => {
  if (group.files.length === 0) { return false }
  return group.files.every(f => selectedCompanyFileIds.value.includes(f.id))
}

const isCategoryPartialSelected = (group: CompanyFileGroup): boolean => {
  const selectedCount = group.files.filter(f => selectedCompanyFileIds.value.includes(f.id)).length
  return selectedCount > 0 && selectedCount < group.files.length
}

const toggleCategory = (group: CompanyFileGroup, checked: boolean) => {
  const ids = group.files.map(f => f.id)
  if (checked) {
    // 추가 (중복 제거)
    const set = new Set(selectedCompanyFileIds.value)
    ids.forEach(id => set.add(id))
    selectedCompanyFileIds.value = Array.from(set)
  } else {
    selectedCompanyFileIds.value = selectedCompanyFileIds.value.filter(id => !ids.includes(id))
  }
}

// 파일 사이즈 포맷 (KB/MB)
const formatFileSize = (bytes: number): string => {
  if (!bytes) { return '0 B' }
  if (bytes < 1024) { return `${bytes} B` }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB` }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 회사 파일 목록 로드
const loadCompanyFiles = async () => {
  loadingCompanyFiles.value = true
  try {
    companyFiles.value = await companyFileService.listCurrent()
  } catch (error) {
    console.error('회사 파일 목록 조회 실패:', error)
    companyFiles.value = []
  } finally {
    loadingCompanyFiles.value = false
  }
}

const initEmailForm = async () => {
  const user = authStore.user

  emailSubject.value = `[리드파워] 견적서 전달드립니다 - ${quotationNo.value}`

  // 서명은 백엔드에서 자동 추가 (영업담당자 정보 + 회사 로고)
  emailBody.value = '안녕하세요.\n\n요청하신 견적서를 전달드립니다.\n첨부된 PDF를 확인 부탁드립니다.\n\n감사합니다.'

  // 회사 문서 선택 초기화 + 목록 재조회
  selectedCompanyFileIds.value = []
  await loadCompanyFiles()
}

const handleSendEmail = async () => {
  await initEmailForm()
  showEmailConfirm.value = true
}

const confirmSendEmail = async () => {
  sendingEmail.value = true
  try {
    await quotationService.sendEmail(quotationId.value, {
      subject: emailSubject.value,
      body: emailBody.value,
      companyFileIds: selectedCompanyFileIds.value.length > 0 ? selectedCompanyFileIds.value : undefined
    })
    alert('견적서가 이메일로 발송되었습니다.')
    showEmailConfirm.value = false
    await loadQuotation()
  } catch (error) {
    console.error('이메일 발송 실패:', error)
    alert('이메일 발송에 실패했습니다.')
  } finally {
    sendingEmail.value = false
  }
}

// 삭제
const handleDelete = async () => {
  if (!confirm('이 견적서를 삭제하시겠습니까?')) { return }
  try {
    await quotationService.deleteQuotation(quotationId.value)
    alert('견적서가 삭제되었습니다.')
    router.push('/admin/quotation/list')
  } catch (error) {
    console.error('견적서 삭제 실패:', error)
    alert('견적서 삭제에 실패했습니다.')
  }
}

const goBack = () => router.push('/admin/quotation/list')

onMounted(() => {
  if (!isSalesManager.value) {
    loadSalesUsers()
  }
  loadQuotation()
})
</script>

<style scoped>
@import '@/assets/css/admin-modals.css';
.quotation-edit { padding: 0; }
.content-section { background: transparent; padding: 0; margin-top: -1rem; }
.register-form { display: flex; flex-direction: column; gap: 1rem; }

/* FormSection 내부 1열 그리드 */
:deep(.form-grid-single) { display: block !important; }

/* 좌우 레이아웃 */
.header-row { display: flex; gap: 1rem; }
.header-left { flex: 1; min-width: 0; }
.header-right { flex: 1; min-width: 0; }

/* 좌우 블록 내부 전체 너비 */
.header-row :deep(.info-group) { width: 100%; }
.header-row :deep(.form-field) { width: 100%; min-width: 0; }
.header-row :deep(.form-input),
.header-row :deep(.form-select),
.header-row :deep(.form-textarea),
.header-row :deep(.selector-wrapper),
.header-row :deep(.selector-input) { width: 100% !important; max-width: 100% !important; box-sizing: border-box; }

/* 기본정보: 제출일자 + 용역명 한줄 */
.basic-info-row { display: grid; grid-template-columns: 200px 1fr; gap: 0.8rem; padding: 0.9rem; width: 100%; }

/* 영업담당자 행 */
.sales-manager-row { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0.9rem; border-top: 1px solid #e5e7eb; }
.sales-manager-row :deep(.form-field) { width: 200px; min-width: 200px; max-width: 200px; flex-shrink: 0; }
.sales-manager-info { display: flex; align-items: center; gap: 1rem; font-size: 0.8125rem; color: #4b5563; flex: 1; min-height: 38px; }
.sales-manager-info .info-item { display: flex; align-items: center; gap: 0.3rem; }
.sales-manager-info .info-item i { color: #9ca3af; font-size: 0.75rem; }

/* 상태 영역 (용역명 아래, NOTE 위) */
.status-area { padding: 0.6rem 0.9rem; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.5rem; }
.status-label { font-size: 0.875rem; font-weight: 500; color: #374151; }

/* 명함선택 버튼 + 입력필드 조합 */
.input-with-card-btn { display: flex; gap: 0.5rem; align-items: flex-start; }
.input-with-card-btn .form-input { flex: 1; }
/* 거래처 정보: 2열 x 2행 */
.client-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; padding: 0.9rem; width: 100%; }

/* NOTE 영역 */
.note-area { padding: 0.9rem; border-top: 1px solid #e5e7eb; }
.note-area .form-label { font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem; display: block; }
.note-area .form-textarea { width: 100% !important; }

/* 품목 */
.items-section { margin-top: 0; }
.items-toolbar { margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
.items-summary { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.summary-label { color: #6b7280; }
.summary-value { font-weight: 600; color: #1f2937; }
.summary-divider { color: #d1d5db; }
.items-actions { display: flex; gap: 0.5rem; }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; }
.items-table .form-input-sm { padding: 0.25rem 0.5rem; font-size: 0.8rem; height: 30px; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 4px; color: #6b7280; }
.btn-danger-icon { color: #ef4444; }
.btn-danger-icon:hover { color: #dc2626; }
.total-row td { background-color: #f9fafb; border-top: 2px solid #e5e7eb; padding: 8px 12px; }

/* 상태 뱃지 */
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; text-align: center; }
.status-draft { background-color: #fef3c7; color: #92400e; }
.status-completed { background-color: #d1fae5; color: #065f46; }
.status-cancelled { background-color: #fee2e2; color: #991b1b; }
.btn-danger { color: #ef4444; border-color: #ef4444; }
.btn-danger:hover { background-color: #fef2f2; }

/* 이메일 모달 */
.email-address-display { padding: 8px 12px; background: #f3f4f6; border-radius: 8px; font-weight: 500; color: #1f2937; }
.email-body-textarea { resize: vertical; min-height: 120px; }
.email-attachment { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1e40af; font-size: 0.9rem; }
.email-attachment i { color: #dc2626; font-size: 1.1rem; }
.email-attachment-warning { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; color: #92400e; font-size: 0.9rem; }
.email-attachment-warning i { color: #f59e0b; }

/* 회사 문서 첨부 */
.company-files-loading { padding: 12px; color: #6b7280; font-size: 0.875rem; text-align: center; }
.company-files-empty { padding: 12px; color: #9ca3af; font-size: 0.875rem; text-align: center; background: #f9fafb; border-radius: 8px; }
.company-files-container { max-height: 280px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #fff; }
.company-file-group { margin-bottom: 12px; }
.company-file-group:last-child { margin-bottom: 0; }
.company-file-group-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #f3f4f6; border-radius: 6px; margin-bottom: 4px; cursor: pointer; transition: background 0.15s; }
.company-file-group-header:hover { background: #e5e7eb; }
.company-file-chevron { color: #6b7280; font-size: 0.75rem; transition: transform 0.2s ease; }
.company-file-group-header.is-expanded .company-file-chevron { transform: rotate(180deg); }
.company-file-category-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; flex: 1; }
.company-file-category-name { font-weight: 600; color: #374151; font-size: 0.875rem; }
.company-file-category-count { color: #6b7280; font-size: 0.8125rem; }
.company-file-list { padding-left: 12px; }
.company-file-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; cursor: pointer; border-radius: 4px; font-size: 0.875rem; }
.company-file-item:hover { background: #f9fafb; }
.company-file-name { flex: 1; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.company-file-size { color: #6b7280; font-size: 0.8125rem; flex-shrink: 0; }
.company-files-summary { margin-top: 8px; padding: 8px 12px; background: #eff6ff; border-radius: 6px; font-size: 0.8125rem; color: #1e40af; }
.company-files-warning { margin-top: 8px; padding: 8px 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; font-size: 0.8125rem; color: #92400e; display: flex; align-items: center; gap: 6px; }
.company-files-warning i { color: #f59e0b; }
.email-signature-preview { margin-top: 8px; padding: 12px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.85rem; color: #374151; line-height: 1.6; }
.email-signature-preview .signature-divider { color: #9ca3af; margin-bottom: 4px; }
.email-signature-preview .signature-name { font-weight: 600; color: #1f2937; }
.email-signature-preview .signature-detail { color: #4b5563; }
.email-signature-preview .signature-company { color: #1f2937; font-weight: 500; margin-top: 4px; }
.email-signature-preview .signature-logo { height: 32px; margin-top: 6px; display: block; }
.email-signature-preview .signature-reply-notice { margin-top: 8px; font-size: 0.8rem; color: #6b7280; }

@media (max-width: 768px) {
  .content-section { padding: 1rem; }
  .header-row { flex-direction: column; }
  .basic-info-row { grid-template-columns: 1fr; }
}
</style>
