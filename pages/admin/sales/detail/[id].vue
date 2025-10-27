<template>
  <div class="sales-detail">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="영업 상세"
      description="영업 정보를 상세히 조회합니다."
    >
      <template #actions>
        <button @click="goBack" class="btn-action btn-secondary">
          <i class="fas fa-arrow-left"></i>
          목록으로
        </button>

        <!-- 조회 모드 버튼 -->
        <template v-if="!isEditMode">
          <button @click="deleteSales" class="btn-action btn-delete">
            <i class="fas fa-trash"></i>
            삭제
          </button>
          <button @click="enterEditMode" class="btn-action btn-primary">
            <i class="fas fa-edit"></i>
            수정
          </button>
        </template>

        <!-- 수정 모드 버튼 -->
        <template v-else>
          <button @click="cancelEdit" class="btn-action btn-secondary" :disabled="saving">
            <i class="fas fa-times"></i>
            취소
          </button>
          <button @click="saveChanges" class="btn-action btn-primary" :disabled="saving">
            <i class="fas fa-save"></i>
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </template>
      </template>
    </UiPageHeader>

    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>데이터를 불러오는 중...</p>
    </div>

    <div v-else-if="salesData" class="content-section">
      <!-- 영업 정보 섹션 -->
      <FormSection title="영업 정보">
        <!-- 1. 고객 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-user"></i>
            <span>고객 정보</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="수요기관">
              <input
                type="text"
                :value="salesData.dminsttNm ? salesData.dminsttNm + ' (' + salesData.dminsttCd + ')' : '-'"
                class="form-input-md"
                readonly
              >
            </FormField>
            <FormField label="담당자명">
              <input
                type="text"
                :value="salesData.customerNm"
                class="form-input-sm"
                readonly
              >
            </FormField>
            <FormField label="담당자연락처">
              <input
                type="text"
                :value="salesData.customerTel || '-'"
                class="form-input-md"
                readonly
              >
            </FormField>
            <FormField label="담당자이메일">
              <input
                type="text"
                :value="salesData.customerEmail || '-'"
                class="form-input-lg"
                readonly
              >
            </FormField>
          </div>
        </div>

        <!-- 2. 영업 기본 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-briefcase"></i>
            <span>영업 기본 정보</span>
          </div>
          <div class="info-grid grid-1">
            <FormField label="사업명">
              <input
                type="text"
                :value="salesData.salesTitle"
                class="form-input-lg"
                readonly
                v-if="!isEditMode"
              >
              <input
                type="text"
                :value="salesData.salesTitle"
                class="form-input-lg"
                readonly
                v-else
              >
            </FormField>
            <FormField label="사업내용">
              <textarea
                :value="salesData.salesContent || '-'"
                class="form-textarea-sm"
                rows="2"
                readonly
                v-if="!isEditMode"
              />
              <textarea
                :value="salesData.salesContent || '-'"
                class="form-textarea-sm"
                rows="2"
                readonly
                v-else
              />
            </FormField>
            <div class="detail-item">
              <label>영업상태</label>

              <!-- 조회 모드 -->
              <span v-if="!isEditMode" class="status-badge" :class="getStatusClass(salesData.salesStatus)">
                {{ salesData.salesStatus }}
              </span>

              <!-- 수정 모드 -->
              <select v-else v-model="editableData.salesStatus" class="form-select-inline">
                <option value="">선택하세요</option>
                <option v-for="option in salesStatusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- 3. 계약 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-contract"></i>
            <span>계약 정보</span>
          </div>
          <div class="info-grid grid-3">
            <FormField label="예상납품요구일">
              <input
                type="text"
                :value="formatDateTime(salesData.expectedDeliveryDate)"
                class="form-input-md"
                readonly
                v-if="!isEditMode"
              >
              <input
                type="text"
                :value="formatDateTime(salesData.expectedDeliveryDate)"
                class="form-input-md"
                readonly
                v-else
              >
            </FormField>
            <FormField label="예상납품기한">
              <input
                type="text"
                :value="formatDateTime(salesData.expectedDeliveryDeadline)"
                class="form-input-md"
                readonly
                v-if="!isEditMode"
              >
              <input
                type="text"
                :value="formatDateTime(salesData.expectedDeliveryDeadline)"
                class="form-input-md"
                readonly
                v-else
              >
            </FormField>
            <FormField label="예상 납품 총 금액">
              <!-- 조회 모드 -->
              <input
                type="text"
                :value="formatCurrency(salesData.contractAmount)"
                class="form-input-md text-right"
                readonly
                v-if="!isEditMode"
              >

              <!-- 수정 모드 -->
              <div v-else class="contract-amount-input-wrapper">
                <input
                  :value="editableData.contractAmount"
                  @input="handleContractAmountInput"
                  type="text"
                  class="form-input-inline text-right"
                  placeholder="예상 납품 총 금액을 입력하세요"
                />
                <span v-if="editableData.contractAmountRaw" class="input-suffix-inline">원</span>
              </div>
            </FormField>
          </div>
          <div class="info-grid grid-1">
            <FormField label="비고">
              <!-- 조회 모드 -->
              <textarea
                :value="salesData.remark || '-'"
                class="form-textarea-sm"
                rows="2"
                readonly
                v-if="!isEditMode"
              />

              <!-- 수정 모드 -->
              <textarea
                v-else
                v-model="editableData.remark"
                class="form-textarea-inline"
                rows="2"
                placeholder="비고를 입력하세요"
              />
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
              <!-- 조회 모드: 원본 품목총액 / 수정 모드: 계산된 품목총액 -->
              <span v-if="!isEditMode">{{ formatCurrency(totalItemsAmount) }}</span>
              <span v-else>{{ formatCurrency(editTotalItemsAmount) }}</span>
            </div>
            <span class="amount-operator">=</span>
            <div class="amount-item total">
              <label>예상 납품 총 금액</label>
              <!-- 조회 모드: 원본 계약금액 / 수정 모드: 편집 중인 계약금액 -->
              <span v-if="!isEditMode">{{ formatCurrency(salesData.contractAmount) }}</span>
              <span v-else>{{ formatCurrency(editableData.contractAmountRaw) }}</span>
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 품목 정보 섹션 -->
      <FormSection title="품목 정보12" gridClass="">
        <!-- 조회 모드: 읽기 전용 테이블 -->
        <div v-if="!isEditMode" class="items-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px">No.</th>
                <th style="width: 200px">품목명</th>
                <th style="width: 150px">SKU명</th>
                <th style="width: 200px">규격</th>
                <th style="width: 70px">단위</th>
                <th style="width: 120px">단가</th>
                <th style="width: 90px">수량</th>
                <th style="width: 130px">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="salesItems.length === 0">
                <td colspan="8" class="no-items-row">
                  <div class="no-items-content">
                    <i class="fas fa-box"></i>
                    <p>등록된 품목이 없습니다.</p>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="(item, index) in salesItems" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td>{{ item.itemName }}</td>
                <td class="text-center">{{ item.skuName || '-' }}</td>
                <td class="text-center">{{ item.itemSpecification || '-' }}</td>
                <td class="text-center">{{ item.unit || '-' }}</td>
                <td class="text-right">{{ formatCurrency(item.unitPrice) }}</td>
                <td class="text-right">{{ (item.quantity || 0).toLocaleString() }}</td>
                <td class="text-right">{{ formatCurrency(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 수정 모드: ItemsManager 컴포넌트 -->
        <ItemsManager
          v-else
          :items="items"
          :show-delivery-date="false"
          @add-item="addItem"
          @add-item-with-selector="openSelectorOnly"
          @remove-item="removeItem"
          @open-selector="openItemSelector"
          @calculate-amount="calculateItemAmount"
        >
          <template #item-selector>
            <ItemSkuSelector
              v-model="showItemSelector"
              @sku-selected="handleSkuSelectedCustom"
            />
          </template>
        </ItemsManager>
      </FormSection>

      <!-- 계약서 파일 + 시스템 정보 2열 레이아웃 -->
      <div class="two-column-sections">
        <!-- 1열: 계약서 파일 -->
        <FormSection title="계약서 파일" class="column-1" gridClass="">
          <div v-if="salesData.contractFilePath" class="file-info">
            <div class="file-details">
              <i class="fas fa-file-pdf"></i>
              <div class="file-text">
                <span class="file-name">{{ salesData.contractFileNm }}</span>
                <span class="file-size">{{ formatFileSize(salesData.contractFileSize) }}</span>
              </div>
            </div>
            <div class="file-actions">
              <button @click="downloadFile" class="btn-download">
                <i class="fas fa-download"></i>
                다운로드
              </button>
            </div>
          </div>
          <div v-else class="no-file">
            <i class="fas fa-file-pdf"></i>
            <p>등록된 계약서 파일이 없습니다.</p>
          </div>
        </FormSection>

        <!-- 2열: 시스템 정보 -->
        <FormSection title="시스템 정보" class="column-2" gridClass="">
          <div class="info-group">
            <div class="info-group-header">
              <i class="fas fa-info-circle"></i>
              <span>등록/수정 정보</span>
            </div>
            <div class="info-grid grid-2">
              <FormField label="등록자">
                <input
                  type="text"
                  :value="salesData.createdBy"
                  class="form-input-sm"
                  readonly
                >
              </FormField>
              <FormField label="등록일시">
                <input
                  type="text"
                  :value="formatDateTime(salesData.createdAt)"
                  class="form-input-md"
                  readonly
                >
              </FormField>
              <FormField label="수정자">
                <input
                  type="text"
                  :value="salesData.updatedBy || '-'"
                  class="form-input-sm"
                  readonly
                >
              </FormField>
              <FormField label="수정일시">
                <input
                  type="text"
                  :value="formatDateTime(salesData.updatedAt)"
                  class="form-input-md"
                  readonly
                >
              </FormField>
            </div>
          </div>
        </FormSection>
      </div>
    </div>

    <div v-else class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>영업 정보를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { salesService, type Sales } from '~/services/sales.service'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import { useItemManagement } from '~/composables/admin/useItemManagement'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import ItemsManager from '~/components/admin/forms/ItemsManager.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 상세'
})

const router = useRouter()
const route = useRoute()

// 상태 관리
const loading = ref(false)
const saving = ref(false)
const isEditMode = ref(false)

const salesData = ref<Sales | null>(null)
const salesItems = ref<Array<{
  id?: number
  skuId: string | number
  itemId: string | number
  itemName: string
  skuName: string
  itemSpecification: string
  unit: string
  unitPrice: number
  quantity: number
  amount: number
  sortOrder: number
}>>([])

// 수정 모드 데이터
const editableData = ref({
  contractAmount: '',
  contractAmountRaw: 0,
  salesStatus: '',
  remark: ''
})

// 품목 관리 Composable (수정 모드에서만 사용)
const {
  items,
  showItemSelector,
  currentItemIndex,
  addItem,
  addItemWithSelector,
  removeItem,
  openItemSelector,
  handleSkuSelected,
  calculateItemAmount,
  totalItemsAmount: editTotalItemsAmount
} = useItemManagement({
  autoCalculate: true,
  duplicateCheckField: 'skuId'
})

// 품목 총액 계산 (조회 모드용)
const totalItemsAmount = computed(() => {
  return salesItems.value.reduce((total, item) => total + (item.amount || 0), 0)
})

// 옵션 데이터
const salesStatusOptions = salesService.getSalesStatusOptions()

// 영업상태별 클래스
const getStatusClass = (status: string) => {
  switch (status) {
    case '진행중':
      return 'status-in-progress'
    case '완료':
      return 'status-complete'
    case '취소':
      return 'status-cancelled'
    case '보류':
      return 'status-pending'
    default:
      return 'status-default'
  }
}

// 통화 포맷팅
const formatCurrency = (amount?: number) => {
  if (!amount) return '-'
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

// 날짜시간 포맷팅
const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('ko-KR')
}

// 파일 크기 포맷팅
const formatFileSize = (size?: number) => {
  if (!size) return '-'

  const units = ['B', 'KB', 'MB', 'GB']
  let fileSize = size
  let unitIndex = 0

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }

  return `${fileSize.toFixed(1)} ${units[unitIndex]}`
}

// 품목 선택기만 열기 (빈 라인 추가 없이)
const openSelectorOnly = () => {
  currentItemIndex.value = -1  // 새 품목 추가 모드
  showItemSelector.value = true
}

// 규격 문자열 생성 헬퍼
const buildSpecification = (width?: number, height?: number, thickness?: number): string => {
  if (width && height && thickness) {
    return `${width}*${height}*${thickness}`
  } else if (width && height) {
    return `${width}*${height}`
  } else if (width) {
    return `${width}`
  }
  return ''
}

// 커스텀 SKU 선택 핸들러 (빈 라인 방지)
const handleSkuSelectedCustom = (item: any, sku: any) => {
  // 새 품목 추가 모드인 경우 (currentItemIndex === -1)
  if (currentItemIndex.value === -1) {
    // 중복 체크
    const isDuplicate = items.value.some(existingItem =>
      existingItem.skuId === sku.id
    )

    if (isDuplicate) {
      alert('이미 선택된 SKU입니다.')
      return
    }

    // 규격 정보 설정
    const width = sku.width || item.width
    const height = sku.height || item.height
    const thickness = sku.thickness || item.thickness
    const specification = buildSpecification(width, height, thickness)

    const unitPrice = sku.unitPrice || item.unitPrice || 0

    // 새 라인 추가
    items.value.push({
      skuId: String(sku.id ?? 0),
      itemId: String(item.id ?? 0),
      itemName: item.itemNm ?? '',
      skuName: sku.skuNm ?? '',
      itemSpecification: specification,
      unit: item.unitCd || '개',
      unitPrice: unitPrice,
      quantity: 1,
      amount: unitPrice * 1,
      sortOrder: items.value.length + 1
    })

    // 팝업 닫기
    showItemSelector.value = false
  } else {
    // 기존 라인 수정 (기존 composable 로직 사용)
    handleSkuSelected(item, sku)
  }
}

// 영업 상세 정보 조회
const fetchSalesDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    alert('잘못된 접근입니다.')
    router.push('/admin/sales/list')
    return
  }

  try {
    loading.value = true
    const response = await salesService.getSalesById(id)
    salesData.value = response
    
    // 품목 정보 조회
    try {
      const itemsResponse = await salesService.getSalesItems(id)
      salesItems.value = itemsResponse.map(item => ({
        skuId: item.skuId,
        itemId: item.itemId,
        itemName: item.itemName,
        skuName: item.skuName,
        itemSpecification: item.itemSpecification || '',
        unit: item.unit || '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        amount: item.amount,
        sortOrder: item.sortOrder
      }))
    } catch (error) {
      console.error('품목 정보 조회 오류:', error)
      salesItems.value = []
    }
  } catch (error) {
    console.error('영업 상세 조회 오류:', error)
    alert('영업 정보를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 파일 다운로드
const downloadFile = async () => {
  if (!salesData.value?.id) return

  try {
    const blob = await salesService.downloadContractFile(salesData.value.id)
    
    // 파일 다운로드
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = salesData.value.contractFileNm || 'contract.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('파일 다운로드 오류:', error)
    alert('파일 다운로드에 실패했습니다.')
  }
}

// 수정 페이지로 이동
const editSales = () => {
  if (salesData.value?.id) {
    router.push(`/admin/sales/edit/${salesData.value.id}`)
  }
}

// 삭제 처리
const deleteSales = async () => {
  if (!salesData.value?.id) return

  if (confirm('정말 삭제하시겠습니까?')) {
    try {
      await salesService.deleteSales(salesData.value.id)
      alert('삭제되었습니다.')
      router.push('/admin/sales/list')
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제에 실패했습니다.')
    }
  }
}

// 수정 모드 진입
const enterEditMode = () => {
  if (!salesData.value) return

  // 원본 데이터 복사
  editableData.value.contractAmountRaw = salesData.value.contractAmount || 0
  editableData.value.contractAmount = (salesData.value.contractAmount || 0).toLocaleString()
  editableData.value.salesStatus = salesData.value.salesStatus || ''
  editableData.value.remark = salesData.value.remark || ''

  // 품목 복사
  items.value = JSON.parse(JSON.stringify(salesItems.value))

  isEditMode.value = true
}

// 수정 취소
const cancelEdit = () => {
  if (confirm('변경 사항을 취소하시겠습니까?')) {
    // 편집 데이터 초기화
    editableData.value.contractAmount = ''
    editableData.value.contractAmountRaw = 0
    editableData.value.salesStatus = ''
    editableData.value.remark = ''
    items.value = []

    isEditMode.value = false
  }
}

// 계약금액 입력 핸들러
const handleContractAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseInt(numericValue) || 0

  editableData.value.contractAmountRaw = parsed
  editableData.value.contractAmount = parsed > 0 ? parsed.toLocaleString() : ''
}

// 변경 사항 저장
const saveChanges = async () => {
  if (!salesData.value?.id) return

  try {
    saving.value = true

    // 1. 계약금액 + 영업상태 + 비고 업데이트
    const updateRequest = {
      ...salesData.value,
      contractAmount: editableData.value.contractAmountRaw,
      salesStatus: editableData.value.salesStatus,
      remark: editableData.value.remark
    }

    await salesService.updateSales(salesData.value.id, updateRequest)

    // 2. 품목 정보 업데이트
    // 기존 품목 모두 삭제 후 새로 추가
    const currentItems = await salesService.getSalesItems(salesData.value.id)
    for (const item of currentItems) {
      if (item.id) {
        await salesService.deleteSalesItem(salesData.value.id, item.id)
      }
    }

    // 새 품목 추가
    for (const item of items.value) {
      if (item.itemName && item.unitPrice && item.quantity) {
        const itemRequest = {
          skuId: item.skuId || 0,
          itemId: item.itemId || 0,
          itemName: item.itemName,
          skuName: item.skuName || '',
          itemSpecification: item.itemSpecification || '',
          unit: item.unit || '',
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          amount: item.amount || 0,
          sortOrder: item.sortOrder || 0
        }
        await salesService.addSalesItem(salesData.value.id, itemRequest)
      }
    }

    alert('영업 정보가 수정되었습니다.')

    // 수정 모드 종료
    isEditMode.value = false

    // 데이터 다시 로드 (히스토리 갱신 포함)
    await fetchSalesDetail()

  } catch (error) {
    console.error('영업 정보 수정 오류:', error)
    alert('영업 정보 수정에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/admin/sales/list')
}

// 품목 총액과 계약금액 연동 (수정 모드에서만)
watch(editTotalItemsAmount, (newAmount) => {
  if (isEditMode.value) {
    editableData.value.contractAmountRaw = newAmount
    editableData.value.contractAmount = newAmount.toLocaleString()
  }
})

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchSalesDetail()
})
</script>

<style scoped>
.sales-detail {
  padding: 0;
}

.content-section {
  background: transparent;
  border-radius: 0;
  padding: 0;
  padding-left: 2rem;
  padding-bottom: 0;
  margin-top: -1rem;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/*
 * Common styles managed by:
 * - admin-detail.css: detail-item, status-badge, file-info, amount-group, amount-display
 * - admin-edit-register.css: content-section, two-column-sections
 * - admin-forms.css: info-group, info-grid, form-input-*, form-textarea-*
 * - admin-common.css: text-right, loading-container, error-container
 */

.info-group {
  margin-bottom: 0.1rem;
}

.detail-item span {
  color: #1f2937;
  font-size: 0.875rem;
  line-height: 1.5;
}

.amount-item label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.amount-item span {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  text-align: right;
}

.amount-operator {
  font-size: 1.5rem;
  font-weight: bold;
  color: #6b7280;
}

.status-complete {
  background: #dcfce7;
  color: #166534;
}

.status-default {
  background: #f3f4f6;
  color: #374151;
}

/* Page-specific: File details icon color */
.file-details i {
  font-size: 1.5rem;
  color: #ef4444;
}

.file-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-download {
  background: #10b981;
}

.btn-download:hover {
  background: #059669;
}

/* 인라인 입력 필드 */
.contract-amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input-inline {
  width: 100%;
  padding: 0.5rem;
  padding-right: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input-inline:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-suffix-inline {
  position: absolute;
  right: 12px;
  color: #6b7280;
  pointer-events: none;
  font-size: 0.875rem;
}

.form-select-inline {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
  cursor: pointer;
}

.form-select-inline:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea-inline {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-textarea-inline:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Responsive - page specific adjustments */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .file-info {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
