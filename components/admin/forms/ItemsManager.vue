<!--
  품목 관리 통합 컴포넌트

  목적:
  - 영업/발주/출하/운송 페이지의 품목 관리 UI 통합
  - useItemManagement composable과 연동
  - 품목 추가/삭제/선택 UI 제공

  중복 제거:
  - 품목 테이블 HTML: 4개 페이지 × 150줄 = 600줄
  - 품목 선택 모달 로직: 4개 페이지 × 50줄 = 200줄

  사용 예시:
  items 배열을 전달하고,
  add-item, remove-item, open-selector, calculate-amount 이벤트를 처리합니다.
-->
<template>
  <div class="items-manager">
    <!-- 헤더 -->
    <div class="items-header">
      <div class="items-summary">
        <span class="summary-label">선택된 품목</span>
        <span class="summary-value">{{ selectedCount }}개</span>
        <span class="summary-divider">|</span>
        <span class="summary-label">총 금액</span>
        <span class="summary-value">{{ formatCurrency(totalAmount) }}원</span>
      </div>
      <button type="button" @click="$emit('add-item-with-selector')" class="btn-add-item">
        품목 추가
      </button>
    </div>

    <!-- 품목 테이블 -->
    <div class="items-table-wrapper">
      <table class="items-table">
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
            <th v-if="showDeliveryDate" style="width: 130px">납기일</th>
            <th style="width: 80px">삭제</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td :colspan="showDeliveryDate ? 10 : 9" class="empty-message">
              품목을 추가해주세요.
            </td>
          </tr>
          <tr v-for="(item, index) in items" :key="index">
            <!-- No. -->
            <td class="text-center">{{ index + 1 }}</td>

            <!-- 품목명 -->
            <td>
              <button
                type="button"
                @click="$emit('open-selector', index)"
                class="btn-select-item"
                :class="{ 'has-value': item.itemName }"
              >
                {{ item.itemName || '품목 선택' }}
              </button>
            </td>

            <!-- SKU명 -->
            <td>
              <input
                v-model="item.skuName"
                type="text"
                class="form-input-sm text-center"
                readonly
                placeholder="-"
              />
            </td>

            <!-- 규격 -->
            <td>
              <input
                v-model="item.itemSpecification"
                type="text"
                class="form-input-sm text-center"
                readonly
                placeholder="-"
              />
            </td>

            <!-- 단위 -->
            <td>
              <input
                v-model="item.unit"
                type="text"
                class="form-input-sm text-center"
                readonly
                placeholder="-"
              />
            </td>

            <!-- 단가 -->
            <td>
              <input
                :value="formatNumber(item.unitPrice)"
                @input="handleUnitPriceInput($event, index)"
                type="text"
                class="form-input-sm text-right"
              />
            </td>

            <!-- 수량 -->
            <td>
              <input
                :value="formatNumber(item.quantity)"
                @input="handleQuantityInput($event, index)"
                type="text"
                class="form-input-sm text-right"
              />
            </td>

            <!-- 금액 -->
            <td class="text-right">
              <span class="amount-text">{{ formatCurrency(item.amount) }}원</span>
            </td>

            <!-- 납기일 (선택) -->
            <td v-if="showDeliveryDate">
              <input
                v-model="item.deliveryDate"
                type="date"
                class="form-input-sm"
              />
            </td>

            <!-- 삭제 -->
            <td class="text-center">
              <button
                type="button"
                @click="$emit('remove-item', index)"
                class="btn-remove-item"
              >
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 품목 선택 모달 (slot) -->
    <slot name="item-selector" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatQuantity } from '~/utils/format'

interface ItemData {
  skuId?: number
  itemId?: number
  itemName?: string
  skuName?: string
  itemSpecification?: string
  unit?: string
  unitPrice?: number
  quantity?: number
  amount?: number
  deliveryDate?: string
  [key: string]: any
}

const props = defineProps<{
  /** 품목 목록 */
  items: ItemData[]
  /** 납기일 컬럼 표시 여부 */
  showDeliveryDate?: boolean
}>()

const emit = defineEmits<{
  'add-item': []
  'add-item-with-selector': []
  'remove-item': [index: number]
  'open-selector': [index: number]
  'calculate-amount': [index: number]
}>()

// 선택된 품목 수
const selectedCount = computed(() => {
  return props.items.filter(item => item.itemName && item.itemName.trim() !== '').length
})

// 총 금액
const totalAmount = computed(() => {
  return props.items.reduce((total, item) => total + (item.amount || 0), 0)
})

// 통화 포맷팅
const formatCurrency = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR').format(value)
}

// 숫자 포맷팅 (쉼표 추가) - 수량 포맷팅은 공통 유틸 사용
const formatNumber = (value: number | undefined): string => {
  if (!value) return ''
  return formatQuantity(value)
}

// 단가 입력 처리
const handleUnitPriceInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseInt(numericValue) || 0
  props.items[index].unitPrice = parsed
  emit('calculate-amount', index)
}

// 수량 입력 처리 (소수점 지원)
const handleQuantityInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseFloat(numericValue) || 0
  props.items[index].quantity = parsed
  emit('calculate-amount', index)
}
</script>

<style scoped>
.items-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  grid-column: 1 / -1;  /* FormSection의 그리드에서 모든 열 차지 */
}

/* 헤더 */
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.items-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.summary-divider {
  color: #d1d5db;
}

.btn-add-item {
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-add-item:hover {
  background-color: #1d4ed8;
}

/* 테이블 */
.items-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.items-table {
  width: 100%;
  min-width: 1090px;  /* 최소 너비 보장 */
  border-collapse: collapse;
  font-size: 0.875rem;
}

.items-table thead {
  background-color: #f9fafb;
}

.items-table th {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.items-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.items-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-message {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 품목 선택 버튼 */
.btn-select-item {
  width: 100%;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.btn-select-item.has-value {
  color: white;
  background-color: #2563eb;
  border-color: #2563eb;
}

.btn-select-item:hover {
  border-color: #2563eb;
  background-color: #eff6ff;
}

/* 삭제 버튼 */
.btn-remove-item {
  padding: 0.25rem 0.5rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-remove-item:hover {
  background-color: #dc2626;
}

/* 입력 필드 */
.form-input-sm {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input-sm:read-only {
  background-color: #f9fafb;
  color: #6b7280;
}

.form-input-sm:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* 텍스트 정렬 */
.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.amount-text {
  font-weight: 500;
  color: #1f2937;
}
</style>
