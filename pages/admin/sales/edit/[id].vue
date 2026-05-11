<template>
  <div class="sales-edit">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="영업 상세"
      :description="salesData ? `${salesData.dminsttNm || ''} - ${salesData.salesTitle || ''}` : '영업 정보를 조회하고 수정합니다.'"

      icon="chart"
      icon-color="blue"
    />

    <LoadingSection v-if="loading" />
    <ErrorSection v-else-if="!salesData" message="영업 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <!-- 진척도 스텝퍼 (상단 고정) -->
      <div class="stepper-section">
        <SalesProgressStepper v-model="formData.salesStatus" />
      </div>

      <form class="edit-form" @submit.prevent="handleSubmit">
        <!-- 고객 정보 (펼침) -->
        <AccordionSection title="고객 정보" :default-expanded="true">
          <div class="info-grid grid-2">
            <FormField label="수요기관" required full-width>
              <input
                type="text"
                :value="formData.dminsttNm ? `${formData.dminsttNm} (${formData.dminsttCd})` : ''"
                placeholder="수요기관"
                class="form-input"
                readonly
              >
            </FormField>

            <FormField label="담당자명" required :error="errors.customerNm">
              <input
                v-model="formData.customerNm"
                type="text"
                class="form-input"
                placeholder="담당자명을 입력하세요"
              >
            </FormField>

            <FormField label="담당자연락처" :error="errors.customerTel">
              <input
                v-model="formData.customerTel"
                type="tel"
                class="form-input"
                placeholder="010-1234-5678"
                @input="handlePhoneInput"
                @blur="validateField('customerTel', formData.customerTel, phoneRules)"
              >
            </FormField>

            <FormField label="담당자이메일" :error="errors.customerEmail">
              <input
                v-model="formData.customerEmail"
                type="email"
                class="form-input"
                placeholder="example@company.com"
                @blur="validateField('customerEmail', formData.customerEmail, emailRules)"
              >
            </FormField>
          </div>
        </AccordionSection>

        <!-- 영업 기본 정보 (펼침) -->
        <AccordionSection title="영업 기본 정보" :default-expanded="true">
          <div class="info-grid grid-2">
            <FormField label="사업명" required :error="errors.salesTitle" full-width>
              <input
                v-model="formData.salesTitle"
                type="text"
                class="form-input"
                placeholder="사업명을 입력하세요"
              >
            </FormField>

            <FormField label="사업내용" full-width>
              <textarea
                v-model="formData.salesContent"
                class="form-textarea"
                placeholder="사업내용을 입력하세요"
                rows="3"
              />
            </FormField>

            <FormField label="비고" full-width>
              <textarea
                v-model="formData.remark"
                class="form-textarea"
                placeholder="비고를 입력하세요"
                rows="2"
              />
            </FormField>
          </div>
        </AccordionSection>

        <!-- 활동 기록 (펼침, 핵심 섹션) -->
        <AccordionSection title="활동 기록" :default-expanded="true" :summary="activities.length > 0 ? `${activities.length}건` : ''">
          <div class="activity-section">
            <!-- 새 활동 추가 버튼 / 인라인 폼 -->
            <div v-if="!showActivityForm" class="activity-add-btn-wrapper">
              <button type="button" class="activity-add-btn" @click="openActivityForm">
                <i class="fas fa-plus" />
                새 활동 추가
              </button>
            </div>

            <!-- 활동 입력 폼 (인라인) -->
            <div v-if="showActivityForm" class="activity-form">
              <div class="activity-form-header">
                <span class="activity-form-title">{{ editingActivityId ? '활동 수정' : '새 활동 등록' }}</span>
                <button type="button" class="activity-form-close" @click="closeActivityForm">
                  <i class="fas fa-times" />
                </button>
              </div>
              <div class="info-grid grid-2">
                <FormField label="활동일자" required>
                  <input v-model="activityForm.activityDate" type="date" class="form-input">
                </FormField>
                <FormField label="방문목적">
                  <select v-model="activityForm.visitPurpose" class="form-select">
                    <option value="">
                      선택하세요
                    </option>
                    <option v-for="opt in visitPurposeOptions" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </FormField>
                <FormField label="활동유형">
                  <select v-model="activityForm.activityType" class="form-select">
                    <option value="">
                      선택하세요
                    </option>
                    <option v-for="opt in activityTypeOptions" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </FormField>
                <FormField label="다음 액션 예정일">
                  <input v-model="activityForm.nextActionDate" type="date" class="form-input">
                </FormField>
                <FormField label="활동내용" required full-width>
                  <textarea v-model="activityForm.activityContent" class="form-textarea" placeholder="활동 내용을 입력하세요" rows="3" />
                </FormField>
                <FormField label="다음 액션" full-width>
                  <input v-model="activityForm.nextAction" type="text" class="form-input" placeholder="다음 예정 액션을 입력하세요">
                </FormField>
              </div>

              <!-- 계약 정보 (조건부) -->
              <div v-if="showActivityContractFields" class="contract-section">
                <div class="contract-section-header">
                  <i class="fas fa-file-contract" />
                  <span>계약 정보</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="계약금액">
                    <div class="contract-amount-wrapper">
                      <input
                        :value="activityForm.contractAmount ? activityForm.contractAmount.toLocaleString() : ''"
                        type="text"
                        class="form-input text-right"
                        placeholder="계약금액"
                        @input="handleActivityAmountInput"
                      >
                      <span v-if="activityForm.contractAmount" class="input-suffix">원</span>
                    </div>
                  </FormField>
                  <FormField label="계약일자">
                    <input v-model="activityForm.contractDate" type="date" class="form-input">
                  </FormField>
                  <FormField label="예상납품요구일">
                    <input v-model="formData.expectedDeliveryDate" type="date" class="form-input">
                  </FormField>
                  <FormField label="예상납품기한">
                    <input v-model="formData.expectedDeliveryDeadline" type="date" class="form-input">
                  </FormField>
                  <FormField label="계약 메모" full-width>
                    <textarea v-model="activityForm.contractNote" class="form-textarea" placeholder="계약 관련 메모를 입력하세요" rows="2" />
                  </FormField>
                </div>
              </div>

              <div class="info-grid grid-2">
                <FormField label="첨부파일" full-width>
                  <div class="activity-file-upload">
                    <div v-if="editingFiles.length > 0 || pendingFiles.length > 0" class="file-list">
                      <div v-for="file in editingFiles" :key="'existing-' + file.id" class="file-item">
                        <i class="fas fa-paperclip" />
                        <span class="file-name" @click="downloadActivityFile(file)">{{ file.fileNm }}</span>
                        <span class="file-size">({{ formatFileSize(file.fileSize) }})</span>
                        <button type="button" class="file-remove-btn" @click="removeExistingFile(file)">
                          <i class="fas fa-times" />
                        </button>
                      </div>
                      <div v-for="(file, idx) in pendingFiles" :key="'pending-' + idx" class="file-item pending">
                        <i class="fas fa-paperclip" />
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">({{ formatFileSize(file.size) }})</span>
                        <button type="button" class="file-remove-btn" @click="removePendingFile(idx)">
                          <i class="fas fa-times" />
                        </button>
                      </div>
                    </div>
                    <button
                      v-if="(editingFiles.length + pendingFiles.length) < 5"
                      type="button"
                      class="file-add-btn"
                      @click="triggerActivityFileUpload"
                    >
                      <i class="fas fa-plus" />
                      파일 추가 ({{ editingFiles.length + pendingFiles.length }}/5)
                    </button>
                    <input
                      ref="activityFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.jpg,.jpeg,.png"
                      style="display: none"
                      @change="handleActivityFileSelect"
                    >
                  </div>
                </FormField>
              </div>
              <div class="activity-form-actions">
                <button type="button" class="btn-secondary" @click="closeActivityForm">
                  취소
                </button>
                <button type="button" class="btn-primary" :disabled="activitySaving" @click="saveActivity">
                  {{ activitySaving ? '저장 중...' : (editingActivityId ? '수정' : '등록') }}
                </button>
              </div>
            </div>

            <!-- 활동 타임라인 -->
            <div v-if="activities.length > 0" class="activity-timeline">
              <div
                v-for="activity in activities"
                :key="activity.id"
                class="activity-card"
              >
                <div class="activity-card-header">
                  <div class="activity-card-date">
                    {{ formatDate(activity.activityDate) }}
                  </div>
                  <div class="activity-card-tags">
                    <span v-if="activity.visitPurpose" class="activity-tag purpose">{{ activity.visitPurpose }}</span>
                    <span v-if="activity.activityType" class="activity-tag type">{{ activity.activityType }}</span>
                  </div>
                  <div class="activity-card-actions">
                    <button type="button" class="action-btn edit" title="수정" @click="editActivity(activity)">
                      <i class="fas fa-pen" />
                    </button>
                    <button type="button" class="action-btn delete" title="삭제" @click="deleteActivity(activity.id!)">
                      <i class="fas fa-trash" />
                    </button>
                  </div>
                </div>
                <div class="activity-card-body">
                  <p class="activity-content">
                    {{ activity.activityContent }}
                  </p>

                  <!-- 계약 정보 -->
                  <div v-if="activity.contractAmount || activity.contractDate" class="activity-contract">
                    <i class="fas fa-file-contract" />
                    <span v-if="activity.contractDate">{{ formatDate(activity.contractDate) }}</span>
                    <span v-if="activity.contractAmount" class="contract-amount">{{ activity.contractAmount.toLocaleString() }}원</span>
                    <span v-if="activity.contractNote" class="contract-note">- {{ activity.contractNote }}</span>
                  </div>

                  <!-- 첨부파일 -->
                  <div v-if="activity.files && activity.files.length > 0" class="activity-files">
                    <div v-for="file in activity.files" :key="file.id" class="activity-file-item" @click="downloadActivityFile(file, activity)">
                      <i class="fas fa-paperclip" />
                      <span class="file-name">{{ file.fileNm }}</span>
                      <span class="file-size">({{ formatFileSize(file.fileSize) }})</span>
                    </div>
                  </div>

                  <div v-if="activity.nextAction || activity.nextActionDate" class="activity-next">
                    <i class="fas fa-arrow-right" />
                    <span>다음: </span>
                    <span v-if="activity.nextActionDate" class="next-date">{{ formatDate(activity.nextActionDate) }}</span>
                    <span v-if="activity.nextAction"> {{ activity.nextAction }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 활동 없음 -->
            <div v-else-if="!showActivityForm" class="no-activities">
              <i class="fas fa-clipboard-list" />
              <p>등록된 활동 기록이 없습니다.</p>
            </div>
          </div>
        </AccordionSection>

        <!-- 계약서 파일 (조건부) -->
        <AccordionSection
          v-if="showContractFields"
          title="계약서 파일"
          :summary="salesData.contractFileNm ? '파일 있음' : ''"
          :default-expanded="false"
        >
          <FileUploadArea
            v-model="selectedFile"
            :existing-file-name="salesData.contractFileNm"
            :existing-file-size="salesData.contractFileSize"
            @download="downloadFile"
          />
        </AccordionSection>

        <!-- 버튼 영역 -->
        <div class="form-actions">
          <button v-if="canDelete" type="button" class="btn-danger" :disabled="submitting" @click="handleDelete">
            삭제
          </button>
          <div class="form-actions-right">
            <button type="button" class="btn-secondary" :disabled="submitting" @click="goBack">
              목록
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="submitting || !canEdit"
              :title="!canEdit ? '수정 권한이 없습니다' : ''"
            >
              {{ submitting ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useEditForm } from '~/composables/admin/useEditForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { formatPhoneNumberInput, formatDate } from '~/utils/format'
import { salesService, type Sales, type SalesUpdateRequest } from '~/services/sales.service'
import { salesActivityService } from '~/services/sales-activity.service'
import { type SalesActivity, type SalesActivityFile, type SalesActivityRequest, VISIT_PURPOSE_OPTIONS, ACTIVITY_TYPE_OPTIONS } from '~/types/sales'
import FormField from '~/components/admin/forms/FormField.vue'
import FileUploadArea from '~/components/admin/common/FileUploadArea.vue'
import AccordionSection from '~/components/admin/forms/AccordionSection.vue'
import SalesProgressStepper from '~/components/admin/SalesProgressStepper.vue'
import { useSalesStatus } from '~/composables/useSalesStatus'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 상세'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canEdit, canDelete } = usePermission()

// 옵션
const visitPurposeOptions = VISIT_PURPOSE_OPTIONS
const activityTypeOptions = ACTIVITY_TYPE_OPTIONS

// ID 추출
const salesId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : 0
})

// 활동 기록 관리
const activities = ref<SalesActivity[]>([])
const showActivityForm = ref(false)
const editingActivityId = ref<number | null>(null)
const activitySaving = ref(false)
const today = new Date().toISOString().split('T')[0]
const activityForm = ref<SalesActivityRequest>({
  activityDate: today,
  visitPurpose: '',
  activityType: '',
  activityContent: '',
  nextAction: '',
  nextActionDate: '',
  contractAmount: undefined,
  contractDate: '',
  contractNote: ''
})

// 활동 파일 관리
const editingFiles = ref<SalesActivityFile[]>([])
const pendingFiles = ref<File[]>([])
const filesToDelete = ref<number[]>([])
const activityFileInput = ref<HTMLInputElement>()

// useEditForm composable 사용
const {
  id,
  formData,
  loading,
  submitting,
  submit,
  goBack,
  reload
} = useEditForm<Sales, SalesUpdateRequest, Sales>({
  fetchFunction: id => salesService.getSalesById(id),
  updateFunction: async (id, data) => {
    // 1. 기본 정보 업데이트
    await salesService.updateSales(id, data)

    // 2. 파일 업로드
    if (selectedFile.value) {
      await salesService.uploadContractFile(id, selectedFile.value)
    }

    return salesService.getSalesById(id)
  },
  successRoute: '/admin/sales/list',
  transformToForm: (sales) => {
    const formatDateOnly = (dateString: string): string => {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      customerNm: sales.customerNm || '',
      customerTel: sales.customerTel || '',
      customerEmail: sales.customerEmail || '',
      salesTitle: sales.salesTitle || '',
      salesContent: sales.salesContent || '',
      contractAmount: sales.contractAmount || undefined,
      salesStatus: sales.salesStatus || '초기접촉',
      expectedDeliveryDate: sales.expectedDeliveryDate ? formatDateOnly(sales.expectedDeliveryDate) : '',
      expectedDeliveryDeadline: sales.expectedDeliveryDeadline ? formatDateOnly(sales.expectedDeliveryDeadline) : '',
      dminsttCd: sales.dminsttCd || '',
      dminsttNm: sales.dminsttNm || '',
      useYn: sales.useYn || 'Y',
      remark: sales.remark || ''
    }
  },
  onFetchError: (error) => {
    console.error('영업 데이터 로드 오류:', error)
    alert('영업 정보를 불러오는데 실패했습니다.')
    router.push('/admin/sales/list')
  },
  onUpdateSuccess: () => {
    alert('영업 정보가 성공적으로 저장되었습니다.')
  },
  onUpdateError: (error) => {
    console.error('영업 수정 오류:', error)
    alert('영업 수정에 실패했습니다.')
  }
})

// 원본 데이터
const salesData = ref<Sales | null>(null)

// 활동 기록 로드
const loadActivities = async () => {
  try {
    activities.value = await salesActivityService.getActivities(salesId.value)
  } catch (error) {
    console.error('활동 기록 로드 실패:', error)
    activities.value = []
  }
}

// 데이터 로드
const loadComplete = async () => {
  try {
    const data = await salesService.getSalesById(salesId.value)
    salesData.value = data

    // 활동 기록 로드
    await loadActivities()
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
}

if (salesId.value) {
  loadComplete()
}

// 활동 폼 열기/닫기
const openActivityForm = () => {
  editingActivityId.value = null
  activityForm.value = {
    activityDate: today,
    visitPurpose: '',
    activityType: '',
    activityContent: '',
    nextAction: '',
    nextActionDate: '',
    contractAmount: undefined,
    contractDate: '',
    contractNote: ''
  }
  editingFiles.value = []
  pendingFiles.value = []
  filesToDelete.value = []
  showActivityForm.value = true
}

const closeActivityForm = () => {
  showActivityForm.value = false
  editingActivityId.value = null
  pendingFiles.value = []
  filesToDelete.value = []
}

// 활동 수정 모드
const editActivity = (activity: SalesActivity) => {
  editingActivityId.value = activity.id!
  activityForm.value = {
    activityDate: activity.activityDate,
    visitPurpose: activity.visitPurpose || '',
    activityType: activity.activityType || '',
    activityContent: activity.activityContent,
    nextAction: activity.nextAction || '',
    nextActionDate: activity.nextActionDate || '',
    contractAmount: activity.contractAmount || undefined,
    contractDate: activity.contractDate || '',
    contractNote: activity.contractNote || ''
  }
  editingFiles.value = activity.files ? [...activity.files] : []
  pendingFiles.value = []
  filesToDelete.value = []
  showActivityForm.value = true
}

// 활동 저장 (등록/수정)
const saveActivity = async () => {
  if (!activityForm.value.activityContent) {
    alert('활동내용은 필수입니다.')
    return
  }
  if (!activityForm.value.activityDate) {
    alert('활동일자는 필수입니다.')
    return
  }

  activitySaving.value = true
  try {
    let activityId: number

    if (editingActivityId.value) {
      const updated = await salesActivityService.updateActivity(salesId.value, editingActivityId.value, activityForm.value)
      activityId = updated.id!
    } else {
      const created = await salesActivityService.createActivity(salesId.value, activityForm.value)
      activityId = created.id!
    }

    // 삭제 예정 파일 처리
    for (const fileId of filesToDelete.value) {
      await salesActivityService.deleteFile(salesId.value, activityId, fileId)
    }

    // 새 파일 업로드
    for (const file of pendingFiles.value) {
      await salesActivityService.uploadFile(salesId.value, activityId, file)
    }

    closeActivityForm()
    await loadActivities()
  } catch (error) {
    console.error('활동 저장 실패:', error)
    alert('활동 저장에 실패했습니다.')
  } finally {
    activitySaving.value = false
  }
}

// 활동 삭제
const deleteActivity = async (activityId: number) => {
  if (!confirm('이 활동 기록을 삭제하시겠습니까?')) { return }

  try {
    await salesActivityService.deleteActivity(salesId.value, activityId)
    await loadActivities()
  } catch (error) {
    console.error('활동 삭제 실패:', error)
    alert('활동 삭제에 실패했습니다.')
  }
}

// 검증 composable
const { errors, validateField, validateAll, clearErrors, rules } = useFormValidation({
  customerNm: '',
  salesTitle: '',
  customerTel: '',
  customerEmail: ''
})

const phoneRules = [rules.phone()]
const emailRules = [rules.email()]

// 계약 필드 조건부 표시
const showContractFields = computed(() => {
  return ['계약협상', '계약완료', '납품완료'].includes(formData.salesStatus || '')
})

const showActivityContractFields = computed(() => {
  const purposeMatch = ['계약협상', '계약체결'].includes(activityForm.value.visitPurpose || '')
  return showContractFields.value || purposeMatch
})

// 진척도 ↔ 방문목적 양방향 연동
const isAutoSyncing = ref(false)

const statusToPurposeMap: Record<string, string> = {
  계약협상: '계약협상',
  계약완료: '계약체결',
  납품완료: '납품협의'
}

const purposeToStatusMap: Record<string, string> = {
  계약협상: '계약협상',
  계약체결: '계약완료',
  납품협의: '납품완료'
}

watch(() => formData.salesStatus, (newStatus) => {
  if (isAutoSyncing.value || !showActivityForm.value || !newStatus) { return }
  const mapped = statusToPurposeMap[newStatus as string]
  if (mapped) {
    isAutoSyncing.value = true
    activityForm.value.visitPurpose = mapped
    nextTick(() => { isAutoSyncing.value = false })
  }
})

watch(() => activityForm.value.visitPurpose, (newPurpose) => {
  if (isAutoSyncing.value || !newPurpose) { return }
  const mapped = purposeToStatusMap[newPurpose as string]
  if (mapped) {
    isAutoSyncing.value = true
    formData.salesStatus = mapped
    nextTick(() => { isAutoSyncing.value = false })
  }
})

// 파일 업로드
const selectedFile = ref<File | null>(null)

// 활동 파일 관련 함수
const triggerActivityFileUpload = () => {
  activityFileInput.value?.click()
}

const handleActivityFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 20 * 1024 * 1024) {
      alert('파일 크기는 20MB를 초과할 수 없습니다.')
      return
    }
    if ((editingFiles.value.length + pendingFiles.value.length) >= 5) {
      alert('최대 5개까지만 첨부할 수 있습니다.')
      return
    }
    pendingFiles.value.push(file)
    target.value = ''
  }
}

const removePendingFile = (index: number) => {
  pendingFiles.value.splice(index, 1)
}

const removeExistingFile = (file: SalesActivityFile) => {
  editingFiles.value = editingFiles.value.filter(f => f.id !== file.id)
  filesToDelete.value.push(file.id)
}

const downloadActivityFile = (file: SalesActivityFile, activity?: SalesActivity) => {
  const actId = activity?.id || editingActivityId.value
  if (!actId) { return }
  salesActivityService.downloadFile(salesId.value, actId, file.id, file.fileNm)
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) { return bytes + 'B' }
  if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + 'KB' }
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

// 활동 계약금액 입력 처리
const handleActivityAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseInt(numericValue) || 0
  activityForm.value.contractAmount = parsed > 0 ? parsed : undefined
}

// 상태 코드 로드
const { loadStatusCodes } = useSalesStatus()
onMounted(async () => {
  await loadStatusCodes()
})

// 전화번호 입력 처리
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  formData.customerTel = formatPhoneNumberInput(target.value)
}

// 파일 다운로드
const downloadFile = async () => {
  if (!salesData.value?.id) { return }
  try {
    const blob = await salesService.downloadContractFile(salesData.value.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = salesData.value.contractFileNm || 'contract.pdf'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('파일 다운로드 오류:', error)
    alert('파일 다운로드에 실패했습니다.')
  }
}

// 삭제
const handleDelete = async () => {
  if (!confirm('이 영업 정보를 삭제하시겠습니까?')) { return }
  try {
    await salesService.deleteSales(salesId.value)
    alert('영업 정보가 삭제되었습니다.')
    router.push('/admin/sales/list')
  } catch (error) {
    console.error('영업 삭제 오류:', error)
    alert('영업 삭제에 실패했습니다.')
  }
}

// 폼 제출
const handleSubmit = async () => {
  clearErrors()

  const validationRules = {
    customerNm: [rules.required('담당자명')],
    salesTitle: [rules.required('사업명')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  if (errors.customerTel || errors.customerEmail) {
    return
  }

  await submit()
}
</script>

<style scoped>
.sales-edit {
  padding: 0;
}

.stepper-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 활동 섹션 */
.activity-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-add-btn-wrapper {
  display: flex;
  justify-content: center;
}

.activity-add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px dashed #93c5fd;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.activity-add-btn:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

/* 활동 입력 폼 */
.activity-form {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  padding: 1rem;
}

.activity-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.activity-form-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #0369a1;
}

.activity-form-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
}

.activity-form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

/* 활동 타임라인 */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  transition: box-shadow 0.2s;
}

.activity-card:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.activity-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.activity-card-date {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  min-width: 5.5rem;
}

.activity-card-tags {
  display: flex;
  gap: 0.375rem;
  flex: 1;
}

.activity-tag {
  display: inline-flex;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 500;
}

.activity-tag.purpose {
  background: #ede9fe;
  color: #7c3aed;
}

.activity-tag.type {
  background: #ecfdf5;
  color: #059669;
}

.activity-card-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.activity-card:hover .activity-card-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.25rem 0.375rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s;
}

.action-btn.edit {
  color: #3b82f6;
}

.action-btn.edit:hover {
  background: #eff6ff;
}

.action-btn.delete {
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #fef2f2;
}

.activity-card-body {
  padding-left: 0;
}

.activity-content {
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
}

.activity-next {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: #fffbeb;
  border-radius: 0.375rem;
  font-size: 0.775rem;
  color: #92400e;
}

.activity-next i {
  font-size: 0.625rem;
}

.next-date {
  font-weight: 600;
}

/* 활동 없음 */
.no-activities {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.no-activities i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.no-activities p {
  font-size: 0.875rem;
}

/* 버튼 영역 */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.form-actions-right {
  display: flex;
  gap: 0.5rem;
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-danger:hover {
  background: #fecaca;
}

.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* 계약 정보 (활동 폼 내 통합 영역) */
.contract-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #93c5fd;
}

.contract-section-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #16a34a;
}

.contract-section-header i {
  font-size: 0.9rem;
}

/* 계약 정보 (타임라인 카드) */
.activity-contract {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.375rem 0.625rem;
  background: #f0fdf4;
  border-radius: 0.375rem;
  font-size: 0.775rem;
  color: #166534;
}

.activity-contract i {
  color: #16a34a;
}

.contract-amount {
  font-weight: 600;
}

.contract-note {
  color: #4b5563;
}

.contract-amount-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.contract-amount-wrapper .input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
  font-size: 0.875rem;
}

/* 활동 첨부파일 */
.activity-files {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.activity-files .activity-file-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.2s;
}

.activity-files .activity-file-item:hover {
  background: #e5e7eb;
}

.activity-files .file-name {
  color: #2563eb;
  text-decoration: underline;
}

.activity-files .file-size {
  color: #9ca3af;
}

/* 활동 파일 업로드 영역 */
.activity-file-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.8rem;
}

.file-item.pending {
  border-style: dashed;
  background: #eff6ff;
  border-color: #93c5fd;
}

.file-item .file-name {
  flex: 1;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.file-item .file-name:hover {
  color: #2563eb;
}

.file-item .file-size {
  color: #9ca3af;
  font-size: 0.75rem;
}

.file-remove-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.125rem;
  font-size: 0.75rem;
}

.file-remove-btn:hover {
  color: #ef4444;
}

.file-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem;
  background: #f9fafb;
  color: #6b7280;
  border: 1px dashed #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.file-add-btn:hover {
  background: #eff6ff;
  color: #2563eb;
  border-color: #93c5fd;
}
</style>
