<template>
  <div class="mobile-new-request">
    <!-- 헤더 -->
    <div class="mobile-header">
      <button class="btn-back" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>새 주문 요청</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- 폼 -->
    <div class="form-container">
      <!-- 현장 정보 -->
      <div class="form-section">
        <h3 class="section-title">현장 정보</h3>

        <div class="form-group">
          <label class="form-label required">현장명</label>
          <input
            v-model="formData.siteName"
            type="text"
            class="form-input"
            placeholder="현장명을 입력하세요"
          >
        </div>

        <div class="form-group">
          <label class="form-label required">배송지 주소</label>
          <div class="address-input">
            <input
              v-model="formData.deliveryAddress"
              type="text"
              class="form-input"
              placeholder="배송지 주소"
              readonly
              @click="openAddressSearch"
            >
            <button class="btn-search" @click="openAddressSearch">
              <i class="fas fa-search"></i>
            </button>
          </div>
          <input
            v-model="formData.deliveryAddressDetail"
            type="text"
            class="form-input mt-2"
            placeholder="상세주소 입력"
          >
        </div>
      </div>

      <!-- 납품 정보 -->
      <div class="form-section">
        <h3 class="section-title">납품 정보</h3>

        <div class="form-group">
          <label class="form-label required">희망 납품일</label>
          <input
            v-model="formData.desiredDeliveryDate"
            type="date"
            class="form-input"
            :min="minDate"
          >
        </div>

        <div class="form-group">
          <label class="form-label required">긴급도</label>
          <div class="urgency-options">
            <button
              v-for="option in urgencyOptions"
              :key="option.value"
              class="urgency-option"
              :class="{ active: formData.urgency === option.value, [option.class]: true }"
              @click="formData.urgency = option.value"
            >
              <i :class="option.icon"></i>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 요청 품목 -->
      <div class="form-section">
        <div class="section-header">
          <h3 class="section-title">요청 품목</h3>
          <button class="btn-add-item" @click="addItem">
            <i class="fas fa-plus"></i>
            추가
          </button>
        </div>

        <div v-if="formData.items.length === 0" class="empty-items">
          <p>요청할 품목을 추가해주세요.</p>
        </div>

        <div v-else class="item-list">
          <div v-for="(item, index) in formData.items" :key="index" class="item-card">
            <div class="item-header">
              <span class="item-number">품목 {{ index + 1 }}</span>
              <button class="btn-remove-item" @click="removeItem(index)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="item-body">
              <div class="form-group">
                <label class="form-label">품목 선택</label>
                <select v-model="item.itemId" class="form-select" @change="onItemSelect(index)">
                  <option value="">선택하세요</option>
                  <option v-for="availableItem in availableItems" :key="availableItem.itemId" :value="availableItem.itemId">
                    {{ availableItem.itemNm }}
                  </option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">SKU</label>
                  <select v-model="item.skuId" class="form-select">
                    <option value="">선택하세요</option>
                    <option v-for="sku in getSkuOptions(item.itemId)" :key="sku.skuId" :value="sku.skuId">
                      {{ sku.skuNm }}
                    </option>
                  </select>
                </div>
                <div class="form-group w-24">
                  <label class="form-label">수량</label>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    class="form-input text-center"
                    min="1"
                  >
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">비고</label>
                <input
                  v-model="item.note"
                  type="text"
                  class="form-input"
                  placeholder="특이사항 입력"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 추가 요청사항 -->
      <div class="form-section">
        <h3 class="section-title">추가 요청사항</h3>
        <div class="form-group">
          <textarea
            v-model="formData.additionalNotes"
            class="form-textarea"
            placeholder="추가 요청사항이 있으면 입력해주세요."
            rows="3"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="bottom-actions">
      <button class="btn-cancel" @click="goBack">
        취소
      </button>
      <button
        class="btn-submit"
        @click="submitRequest"
        :disabled="!isValid || submitting"
      >
        <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
        <span v-else>요청하기</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { mobileOrderService } from '~/services/mobile-order.service'
import { itemService } from '~/services/item.service'
import type { MobileOrderRequestCreateRequest, MobileOrderUrgency } from '~/types/mobile-order'

definePageMeta({
  layout: 'default',
  pageTitle: '새 주문 요청'
})

const router = useRouter()

// State
const submitting = ref(false)
const availableItems = ref<any[]>([])

const formData = ref<{
  siteName: string
  deliveryAddress: string
  deliveryAddressDetail: string
  desiredDeliveryDate: string
  urgency: MobileOrderUrgency
  items: {
    itemId: string
    skuId: string
    quantity: number
    note: string
  }[]
  additionalNotes: string
}>({
  siteName: '',
  deliveryAddress: '',
  deliveryAddressDetail: '',
  desiredDeliveryDate: '',
  urgency: 'NORMAL',
  items: [],
  additionalNotes: ''
})

// 긴급도 옵션
const urgencyOptions = [
  { value: 'URGENT' as const, label: '긴급', icon: 'fas fa-exclamation-circle', class: 'urgent' },
  { value: 'NORMAL' as const, label: '보통', icon: 'fas fa-clock', class: 'normal' },
  { value: 'FLEXIBLE' as const, label: '여유', icon: 'fas fa-calendar-alt', class: 'flexible' }
]

// 최소 날짜 (오늘)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// 유효성 검사
const isValid = computed(() => {
  return (
    formData.value.siteName.trim() !== '' &&
    formData.value.deliveryAddress.trim() !== '' &&
    formData.value.desiredDeliveryDate !== '' &&
    formData.value.items.length > 0 &&
    formData.value.items.every(item => item.itemId && item.quantity > 0)
  )
})

// Methods
const loadItems = async () => {
  try {
    const data = await itemService.getItems({ useYn: 'Y', size: 100 })
    availableItems.value = data.content || []
  } catch (error) {
    console.error('품목 목록 조회 실패:', error)
  }
}

const getSkuOptions = (itemId: string) => {
  const item = availableItems.value.find(i => i.itemId === itemId)
  return item?.itemSkus || []
}

const onItemSelect = (index: number) => {
  // SKU 초기화
  formData.value.items[index].skuId = ''
}

const addItem = () => {
  formData.value.items.push({
    itemId: '',
    skuId: '',
    quantity: 1,
    note: ''
  })
}

const removeItem = (index: number) => {
  formData.value.items.splice(index, 1)
}

const openAddressSearch = () => {
  // 다음 우편번호 API 또는 주소 검색 모달
  // 실제 구현시 daum postcode API 연동
  alert('주소 검색 기능은 준비 중입니다.\n직접 주소를 입력해주세요.')
}

const goBack = () => {
  router.back()
}

const submitRequest = async () => {
  if (!isValid.value || submitting.value) return

  submitting.value = true
  try {
    const requestData: MobileOrderRequestCreateRequest = {
      siteName: formData.value.siteName,
      deliveryAddress: `${formData.value.deliveryAddress} ${formData.value.deliveryAddressDetail}`.trim(),
      desiredDeliveryDate: formData.value.desiredDeliveryDate,
      urgency: formData.value.urgency,
      items: formData.value.items.map(item => ({
        itemId: item.itemId,
        skuId: item.skuId || undefined,
        quantity: item.quantity,
        note: item.note || undefined
      })),
      additionalNotes: formData.value.additionalNotes || undefined
    }

    await mobileOrderService.createRequest(requestData)
    alert('주문 요청이 등록되었습니다.')
    router.push('/mobile/order-requests')
  } catch (error) {
    console.error('주문 요청 실패:', error)
    alert(error instanceof Error ? error.message : '주문 요청에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.mobile-new-request {
  min-height: 100vh;
  background: #f3f4f6;
  padding-bottom: 80px;
}

/* 헤더 */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  font-size: 1.125rem;
  color: #374151;
  cursor: pointer;
}

.mobile-header h1 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.header-spacer {
  width: 40px;
}

/* 폼 컨테이너 */
.form-container {
  padding: 1rem;
}

/* 폼 섹션 */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.section-header .section-title {
  margin-bottom: 0;
}

/* 폼 그룹 */
.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1f2937;
  background: white;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #9ca3af;
}

.form-input.text-center {
  text-align: center;
}

.form-textarea {
  resize: none;
}

.mt-2 {
  margin-top: 0.5rem;
}

/* 주소 입력 */
.address-input {
  display: flex;
  gap: 0.5rem;
}

.address-input .form-input {
  flex: 1;
}

.btn-search {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* 긴급도 옵션 */
.urgency-options {
  display: flex;
  gap: 0.5rem;
}

.urgency-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.urgency-option i {
  font-size: 1.25rem;
  color: #9ca3af;
}

.urgency-option span {
  font-size: 0.8rem;
  color: #6b7280;
}

.urgency-option.active {
  border-color: currentColor;
}

.urgency-option.urgent.active {
  border-color: #dc2626;
  background: #fef2f2;
}

.urgency-option.urgent.active i,
.urgency-option.urgent.active span {
  color: #dc2626;
}

.urgency-option.normal.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.urgency-option.normal.active i,
.urgency-option.normal.active span {
  color: #3b82f6;
}

.urgency-option.flexible.active {
  border-color: #16a34a;
  background: #f0fdf4;
}

.urgency-option.flexible.active i,
.urgency-option.flexible.active span {
  color: #16a34a;
}

/* 품목 관련 */
.btn-add-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.empty-items {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.item-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.btn-remove-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.item-body {
  padding: 1rem;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.flex-1 {
  flex: 1;
}

.w-24 {
  width: 80px;
}

/* 하단 버튼 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-submit {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-submit:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
</style>
