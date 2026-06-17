<template>
  <div class="order-detail">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품요구 상세"
      icon="order"
      icon-color="purple"
      description="납품요구 정보를 조회합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" :disabled="pdfLoading" @click="openOriginalPdf">
          <i class="fas fa-file-pdf" />
          {{ pdfLoading ? '여는 중...' : '원본 PDF' }}
        </button>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-list" />
          목록
        </button>
      </template>
    </PageHeader>

    <LoadingSection v-if="loading" />
    <ErrorSection v-else-if="!orderData" message="납품요구 정보를 찾을 수 없습니다." />

    <div v-else-if="orderData" class="content-section">
      <!-- 연관계약 배너 (변경/추가계약인 경우) -->
      <div v-if="isRelatedContract" class="related-contract-banner">
        <i class="fas fa-link" />
        <span
          class="rcb-badge"
          :class="isAmendmentContract ? 'ct-amendment' : 'ct-additional'"
        >{{ contractTypeLabel }}</span>
        <span class="rcb-text">
          기준계약 <strong>{{ baseContractNo }}</strong> 의 연관 계약입니다.
          <template v-if="isAmendmentContract">(기존 수량을 본 계약 수량으로 대체)</template>
          <template v-else>(기존 수량에 본 계약 수량을 합산)</template>
        </span>
      </div>

      <!-- 분할납품요구서 정보 -->
      <FormSection title="분할납품요구서 정보">
        <!-- 1. 계약 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-alt" />
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
            <i class="fas fa-file-contract" />
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
            <i class="fas fa-building" />
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
            <i class="fas fa-clipboard-list" />
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
            <i class="fas fa-won-sign" />
            <span>금액 정보</span>
          </div>
          <!-- ★ 정책: 총 계약금액 = 품대계(item_total_amount). 고객 실수금 = 매출 기준.
               수수료는 참고용으로만 표기하며 합계 계산에 포함하지 않는다. -->
          <div class="amount-display">
            <div class="amount-item total">
              <label>총 계약금액</label>
              <span>{{ formatCurrency(orderData.itemTotalAmount) }}</span>
            </div>
            <div class="amount-item" style="font-size: 0.85em; color: #888;">
              <label>수수료 (참고)</label>
              <span>{{ formatCurrency(orderData.commission) }}</span>
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
                <th>순번</th>
                <th>품명</th>
                <th class="col-spec">
                  규격
                </th>
                <th>단위</th>
                <th>단가</th>
                <th>수량</th>
                <th>금액</th>
                <th>납품장소</th>
                <th>납품기한</th>
                <th>납품조건</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="items.length === 0">
                <td colspan="10" class="empty-row">
                  등록된 납품 품목이 없습니다.
                </td>
              </tr>
              <tr v-for="(item, index) in items" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td><input :value="item.productName" type="text" readonly></td>
                <td><input :value="item.specification" type="text" readonly></td>
                <td><input :value="item.unit" type="text" readonly></td>
                <td class="text-right">
                  <input :value="formatNumber(item.unitPrice)" type="text" readonly class="text-right">
                </td>
                <td class="text-right">
                  <input :value="item.quantity" type="text" readonly class="text-right">
                </td>
                <td class="text-right">
                  <input :value="formatNumber(item.unitPrice * item.quantity)" type="text" readonly class="text-right">
                </td>
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

// 계약유형 표기 (백엔드는 추가계약을 SEPARATE로 저장 → ADDITIONAL/SEPARATE 모두 "추가계약"으로 표시)
const CONTRACT_TYPE_TEXT: Record<string, string> = {
  ORIGINAL: '기준계약',
  AMENDMENT: '변경계약',
  ADDITIONAL: '추가계약',
  SEPARATE: '추가계약'
}
const contractTypeLabel = computed(() => CONTRACT_TYPE_TEXT[orderData.value?.contractType || ''] || '')
const isAmendmentContract = computed(() => orderData.value?.contractType === 'AMENDMENT')
const isRelatedContract = computed(() =>
  ['AMENDMENT', 'ADDITIONAL', 'SEPARATE'].includes(orderData.value?.contractType || '')
)
// 기준계약 납품요구번호 (-NN → -00)
const baseContractNo = computed(() => {
  const no = orderData.value?.deliveryRequestNo
  return no ? no.replace(/-\d{2}$/, '-00') : ''
})

// 수량 합계
const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 규격에서 두께(mm) 숫자를 추출하여 정렬에 사용
const extractSpecThickness = (specification: string): number => {
  if (!specification) { return 9999 }
  // "NNN×NNN×NNNmm" 또는 "NNN*NNN*NNNmm" 패턴에서 마지막 숫자(두께) 추출
  const dimMatch = specification.match(/(\d+)\s*[×x*]\s*(\d+)\s*[×x*]\s*(\d+)\s*mm/i)
  if (dimMatch) { return parseInt(dimMatch[3], 10) }
  // "NNNmm" 패턴에서 숫자 추출
  const mmMatch = specification.match(/(\d+)\s*mm/i)
  if (mmMatch) { return parseInt(mmMatch[1], 10) }
  return 9999
}

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
    // 규격(두께mm) 기준 오름차순 정렬
    const sortedItems = [...(data.items || [])]
    sortedItems.sort((a: any, b: any) => extractSpecThickness(a.specification) - extractSpecThickness(b.specification))
    items.value = sortedItems
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

// 원본 발주서 PDF 미리보기 (새 탭)
const pdfLoading = ref(false)
const openOriginalPdf = async () => {
  const orderId = Number(route.params.id)
  if (!orderId || isNaN(orderId)) { return }
  try {
    pdfLoading.value = true
    await orderService.openOriginalPdf(orderId)
  } catch (error: any) {
    alert(error?.message || '원본 PDF 를 여는 중 오류가 발생했습니다.')
  } finally {
    pdfLoading.value = false
  }
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

/* 납품 목록 테이블 - 컴팩트 레이아웃 (공통 CSS 덮어쓰기) */
.items-table {
  table-layout: auto !important;  /* fixed → auto 강제 변경 */
  min-width: auto !important;     /* 최소 너비 해제 */
}

.items-table th,
.items-table td {
  padding: 0.25rem 0.375rem !important;  /* 4px 6px */
}

/* 규격 컬럼(3번째)만 넓게 */
.items-table th.col-spec,
.items-table td:nth-child(3) {
  width: 300px !important;
}

/* input 스타일 - 패딩 최소화 */
.items-table input[type="text"] {
  padding: 0.125rem 0.25rem !important;  /* 2px 4px */
  width: auto !important;                 /* 내용에 맞게 */
}

/* 규격 컬럼 input만 전체 너비 */
.items-table td:nth-child(3) input {
  width: 100% !important;
}

/* 연관계약 배너 */
.related-contract-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  margin-bottom: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #f59e0b;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  color: #475569;
}

.related-contract-banner .fa-link {
  color: #94a3b8;
}

.rcb-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.rcb-badge.ct-amendment {
  background: #e0f2fe;
  color: #0369a1;
}

.rcb-badge.ct-additional {
  background: #ffedd5;
  color: #c2410c;
}

.rcb-text strong {
  color: #1e293b;
}

/* Responsive - page specific adjustments */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }
}
</style>
