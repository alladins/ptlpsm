<template>
  <div class="order-detail">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="납품요구 상세"
      description="납품요구 정보를 조회합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-list"></i>
          목록
        </button>
      </template>
    </UiPageHeader>

    <AdminCommonLoadingSection v-if="loading" />
    <AdminCommonErrorSection v-else-if="!orderData && !loading" message="납품요구 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
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
              <input type="text" :value="orderData.contractId" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약일자">
              <input type="text" :value="orderData.contractDate" class="form-input-sm" readonly>
            </FormField>
            <FormField label="선고지번호">
              <input type="text" :value="orderData.preNotificationNo || '-'" class="form-input-xs" readonly>
            </FormField>
            <FormField label="납품요구번호">
              <input type="text" :value="orderData.deliveryRequestNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="납품요구일자">
              <input type="text" :value="orderData.deliveryRequestDate" class="form-input-sm" readonly>
            </FormField>
          </div>
          <div class="info-group-header">
            <i class="fas fa-file-contract"></i>
            <span>계약 상세</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="나라장터번호">
              <input type="text" :value="orderData.naraJangteoNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="지급방법">
              <input type="text" :value="orderData.paymentMethod || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="사업명" grid-2>
              <input type="text" :value="orderData.projectName" class="form-input-md" style="width: 370px" readonly>
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
              <input type="text" :value="orderData.client" class="form-input-md" readonly>
            </FormField>
            <FormField label="기관번호">
              <input type="text" :value="orderData.clientNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="우편번호">
              <input type="text" :value="orderData.clientPostalCode || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="주소" full-width>
              <input type="text" :value="orderData.clientAddress || '-'" class="form-input-lg" readonly>
            </FormField>
            <FormField label="전화번호">
              <input type="text" :value="orderData.clientPhoneNumber || '-'" class="form-input" readonly>
            </FormField>
            <FormField label="팩스번호">
              <input type="text" :value="orderData.clientFaxNumber || '-'" class="form-input" readonly>
            </FormField>
            <FormField label="담당자">
              <input type="text" :value="orderData.clientManagerName || '-'" class="form-input" readonly>
            </FormField>
          </div>
        </div>

        <!-- 3. 기타 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-clipboard-list"></i>
            <span>기타 정보</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="분할납품">
              <input type="text" :value="orderData.partialDelivery || '-'" class="form-input-xs" readonly>
            </FormField>
            <FormField label="하자담보책임기간">
              <input type="text" :value="orderData.warrantyPeriod || '-'" class="form-input-xs" readonly>
            </FormField>
            <FormField label="검사기관">
              <input type="text" :value="orderData.inspectionAgency || '-'" class="form-input-md" readonly>
            </FormField>
            <FormField label="인수기관">
              <input type="text" :value="orderData.acceptanceAgency || '-'" class="form-input-md" readonly>
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
              <span>{{ formatCurrency(orderData.itemTotalAmount) }}</span>
            </div>
            <span class="amount-operator">+</span>
            <div class="amount-item">
              <label>수수료</label>
              <span>{{ formatCurrency(orderData.commission) }}</span>
            </div>
            <span class="amount-operator">=</span>
            <div class="amount-item total">
              <label>총 계약금액</label>
              <span>{{ formatCurrency(orderData.totalAmount) }}</span>
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
                <td><input :value="item.productName" type="text" readonly></td>
                <td><input :value="item.specification" type="text" readonly></td>
                <td><input :value="item.unit" type="text" readonly></td>
                <td class="text-right"><input :value="formatNumber(item.unitPrice)" type="text" readonly class="text-right"></td>
                <td class="text-right"><input :value="item.quantity" type="text" readonly class="text-right"></td>
                <td class="text-right"><input :value="formatNumber(item.unitPrice * item.quantity)" type="text" readonly class="text-right"></td>
                <td><input :value="item.deliveryLocation || '-'" type="text" readonly></td>
                <td><input :value="item.deliveryDeadline || '-'" type="text" readonly></td>
                <td><input :value="item.deliveryTerms || '-'" type="text" readonly></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 합계 정보 -->
        <div class="summary-info">
          <div class="summary-item">
            <label>수량합계:</label>
            <span>{{ totalQuantity }}</span>
          </div>
          <div class="summary-item">
            <label>품목총액:</label>
            <span>{{ formatCurrency(orderData.itemTotalAmount) }}</span>
          </div>
        </div>
      </FormSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { orderService } from '~/services/order.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import type { OrderDetailResponse } from '~/types/order'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요구 상세'
})

const router = useRouter()
const route = useRoute()

// 상태
const loading = ref(true)
const orderData = ref<OrderDetailResponse | null>(null)
const items = ref<any[]>([])

// 수량 합계
const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 데이터 로드
const fetchOrderDetail = async () => {
  const orderId = Number(route.params.id)

  if (!orderId || isNaN(orderId)) {
    console.error('Invalid order ID:', route.params.id)
    loading.value = false
    return
  }

  try {
    loading.value = true
    const data = await orderService.getOrderDetail(orderId)
    orderData.value = data
    items.value = data.items || []
  } catch (error) {
    console.error('납품요구 상세 조회 실패:', error)
    orderData.value = null
  } finally {
    loading.value = false
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/admin/order/list')
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-detail.css: amount-group, amount-display, items-table, table-wrapper
 * - admin-edit-register.css: content-section, summary-info
 * - admin-forms.css: form-input-*, info-group, info-grid
 * - admin-common.css: text-center
 */

/* Page-specific: Order detail page layout */
.order-detail {
  padding: 0;
  margin-bottom: 0;
}

/* Responsive - page specific adjustments */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }
}
</style>
