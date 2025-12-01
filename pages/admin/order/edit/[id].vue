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
                  :key="manager.id"
                  :value="manager.id"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { orderService } from '~/services/order.service'
import { userService } from '~/services/user.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import type { OrderDetailResponse } from '~/types/order'
import type { UserByRole } from '~/types/user'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'

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

// 현장소장 목록
const siteManagers = ref<UserByRole[]>([])
const selectedSupervisorCompany = ref('')

// 수정 가능한 폼 데이터
const formData = ref({
  siteManagerId: null as number | null,
  builder: ''
})

// 수량 합계
const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 데이터 로드
const loadData = async () => {
  try {
    loading.value = true
    const data = await orderService.getOrderDetail(orderId.value)
    orderData.value = data

    // 품목 데이터 변환
    items.value = data.items.map((item: any) => ({
      productName: item.itemNm,
      specification: item.specification,
      unit: item.unitCd,
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
  const supervisor = siteManagers.value.find(m => m.id === formData.value.siteManagerId)
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
        itemName: item.itemNm,
        skuName: item.skuNm,
        name: item.itemNm,
        specification: item.specification,
        unit: item.unitCd || '',
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

// 컴포넌트 마운트
onMounted(async () => {
  await Promise.all([loadData(), loadSiteManagers()])

  // 현장소장 목록 로드 후 시공사명 매핑
  if (formData.value.siteManagerId) {
    const supervisor = siteManagers.value.find(m => m.id === formData.value.siteManagerId)
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

<style scoped>
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
</style>
