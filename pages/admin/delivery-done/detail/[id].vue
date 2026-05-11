<template>
  <div class="delivery-done-detail">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품완료 상세"
      icon="delivery"
      icon-color="green"
      description="납품완료 상세 정보 및 문서를 확인합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-list" />
          목록
        </button>
        <button
          class="btn-action btn-success"
          :disabled="!canViewPdf"
          @click="showPdfModal = true"
        >
          <i class="fas fa-file-pdf" />
          PDF 다운로드
        </button>
      </template>
    </PageHeader>

    <LoadingSection v-if="loading" />
    <ErrorSection v-else-if="!data" message="납품완료 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <!-- 기본 정보 -->
      <FormSection title="기본 정보">
        <!-- 발주 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-alt" />
            <span>발주 정보</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="납품요구번호">
              <input type="text" :value="data.deliveryRequestNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약번호">
              <input type="text" :value="data.contractNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약일자">
              <input type="text" :value="formatDate(data.contractDate)" class="form-input-sm" readonly>
            </FormField>
            <FormField label="수요기관">
              <input type="text" :value="data.client" class="form-input-sm" readonly>
            </FormField>
          </div>
          <div class="info-grid grid-2">
            <FormField label="사업명">
              <input type="text" :value="data.projectName" class="form-input-md" readonly>
            </FormField>
            <FormField label="납품장소">
              <input type="text" :value="data.deliveryLocation || '-'" class="form-input-md" readonly>
            </FormField>
          </div>
        </div>

        <!-- 시공사/계약 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-building" />
            <span>시공사/계약 정보</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="시공사">
              <input type="text" :value="data.builderCompanyName || data.builder || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="대표자">
              <input type="text" :value="data.builderCeoName || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약자">
              <input type="text" :value="data.contractor || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="제조사(OEM)">
              <input type="text" :value="data.oemCompanyName || '-'" class="form-input-sm" readonly>
            </FormField>
          </div>
        </div>

        <!-- 납품 현황 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-truck" />
            <span>납품 현황</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="총 발주수량">
              <input type="text" :value="formatNumber(data.totalOrderedQuantity)" class="form-input-sm text-right" readonly>
            </FormField>
            <FormField label="총 납품수량">
              <input type="text" :value="formatNumber(data.totalDeliveredQuantity)" class="form-input-sm text-right" readonly>
            </FormField>
            <FormField label="납품률">
              <div class="rate-display">
                <div class="delivery-rate-bar">
                  <div
                    class="delivery-rate-fill"
                    :style="{ width: (data.deliveryCompletionRate || 0) + '%' }"
                    :class="getRateClass(data.deliveryCompletionRate || 0)"
                  />
                </div>
                <span class="delivery-rate-text">{{ data.deliveryCompletionRate || 0 }}%</span>
              </div>
            </FormField>
            <FormField label="출하횟수">
              <input type="text" :value="(data.totalDeliveryCount || 0) + '회'" class="form-input-sm" readonly>
            </FormField>
          </div>
          <div class="info-grid grid-2">
            <FormField label="납품 시작일">
              <input type="text" :value="formatDateTime(data.deliveryStartDate)" class="form-input-sm" readonly>
            </FormField>
            <FormField label="납품 종료일">
              <input type="text" :value="formatDateTime(data.deliveryEndDate)" class="form-input-sm" readonly>
            </FormField>
          </div>
        </div>

        <!-- 금액 정보 -->
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
              <span>{{ formatCurrency(data.itemTotalAmount) }}</span>
            </div>
            <div class="amount-item" style="font-size: 0.85em; color: #888;">
              <label>수수료 (참고)</label>
              <span>{{ formatCurrency(data.commission) }}</span>
            </div>
          </div>
        </div>

        <!-- 서명 상태 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-signature" />
            <span>서명 상태</span>
          </div>
          <div class="signature-status-row">
            <div class="signature-item">
              <span class="signature-label">Stage 1 - 현장소장</span>
              <span class="signature-badge" :class="data.hasManagerSignature ? 'signed' : 'unsigned'">
                <i :class="data.hasManagerSignature ? 'fas fa-check-circle' : 'fas fa-clock'" />
                {{ data.hasManagerSignature ? '서명완료' : '미서명' }}
              </span>
              <span v-if="data.st1ManagerSignatureDate" class="signature-date">
                {{ formatDateTime(data.st1ManagerSignatureDate) }}
              </span>
            </div>
            <div class="signature-item">
              <span class="signature-label">Stage 1 - 감리원</span>
              <span class="signature-badge" :class="data.hasInspectorSignature ? 'signed' : 'unsigned'">
                <i :class="data.hasInspectorSignature ? 'fas fa-check-circle' : 'fas fa-clock'" />
                {{ data.hasInspectorSignature ? '서명완료' : '미서명' }}
              </span>
              <span v-if="data.st1InspectorSignatureDate" class="signature-date">
                {{ formatDateTime(data.st1InspectorSignatureDate) }}
              </span>
            </div>
            <div class="signature-item">
              <span class="signature-label">Stage 2 - 감리원 (최종)</span>
              <span class="signature-badge" :class="data.hasCompletionInspectorSignature ? 'signed' : 'unsigned'">
                <i :class="data.hasCompletionInspectorSignature ? 'fas fa-check-circle' : 'fas fa-clock'" />
                {{ data.hasCompletionInspectorSignature ? '서명완료' : '미서명' }}
              </span>
              <span v-if="data.st2InspectorSignatureDate" class="signature-date">
                {{ formatDateTime(data.st2InspectorSignatureDate) }}
              </span>
            </div>
            <div class="signature-item">
              <span class="signature-label">상태</span>
              <span class="status-badge" :class="getStatusBadgeClass(data.status)">
                {{ getStatusLabelWithFallback(data.status) }}
              </span>
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 품목 목록 -->
      <FormSection title="품목 목록" style="margin-top: -20px">
        <div class="table-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th>순번</th>
                <th>품명</th>
                <th>규격</th>
                <th>단위</th>
                <th>단가</th>
                <th>발주수량</th>
                <th>추가수량</th>
                <th>유효수량</th>
                <th>납품수량</th>
                <th>잔여수량</th>
                <th>완료</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!data.items || data.items.length === 0">
                <td colspan="11" class="empty-row">
                  등록된 품목이 없습니다.
                </td>
              </tr>
              <tr v-for="(item, index) in data.items" :key="item.itemId || index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td>
                  {{ item.itemName || item.skuName || '-' }}
                  <span v-if="item.isAdditional" class="badge-additional">추가</span>
                </td>
                <td class="spec-cell">
                  {{ item.specification || '-' }}
                </td>
                <td class="text-center">
                  {{ item.unit || '-' }}
                </td>
                <td class="text-right">
                  {{ formatNumber(item.unitPrice) }}
                </td>
                <td class="text-right">
                  {{ formatNumber(item.orderedQuantity) }}
                </td>
                <td class="text-right">
                  <span v-if="item.additionalQuantity > 0" class="text-additional">
                    +{{ formatNumber(item.additionalQuantity) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="text-right font-semibold">
                  {{ formatNumber((item.orderedQuantity || 0) + (item.additionalQuantity || 0)) }}
                </td>
                <td class="text-right">
                  {{ formatNumber(item.deliveredQuantity) }}
                </td>
                <td class="text-right">
                  {{ formatNumber(item.remainingQuantity) }}
                </td>
                <td class="text-center">
                  <span :class="item.isComplete ? 'badge-complete' : 'badge-incomplete'">
                    {{ item.isComplete ? '완료' : '진행중' }}
                  </span>
                </td>
              </tr>
              <!-- 합계 행 -->
              <tr v-if="data.items && data.items.length > 0" class="totals-row">
                <td colspan="5" class="text-center font-semibold">
                  합계
                </td>
                <td class="text-right font-semibold">
                  {{ formatNumber(totalOrderedQty) }}
                </td>
                <td class="text-right font-semibold">
                  <span v-if="totalAdditionalQty > 0" class="text-additional">+{{ formatNumber(totalAdditionalQty) }}</span>
                  <span v-else>-</span>
                </td>
                <td class="text-right font-semibold">
                  {{ formatNumber(totalEffectiveQty) }}
                </td>
                <td class="text-right font-semibold">
                  {{ formatNumber(totalDeliveredQty) }}
                </td>
                <td class="text-right font-semibold">
                  {{ formatNumber(totalRemainingQty) }}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </FormSection>

      <!-- 문서 미리보기 (접이식) -->
      <div class="doc-collapsible">
        <div class="doc-collapsible-header" @click="toggleDocSection">
          <h2 class="section-title" style="margin-bottom: 0; border-bottom: none; cursor: pointer;">
            <i :class="docSectionOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="collapse-icon" />
            문서 미리보기
          </h2>
          <span class="collapse-hint">{{ docSectionOpen ? '접기' : '펼쳐서 문서 확인' }}</span>
        </div>

        <div v-show="docSectionOpen" class="doc-preview-section">
          <!-- 탭 버튼 -->
          <div class="doc-tabs">
            <button
              class="doc-tab"
              :class="{ active: activeDocTab === 'confirmation' }"
              @click="loadDocPreview('confirmation')"
            >
              <i class="fas fa-file-signature" />
              납품확인서
            </button>
            <button
              class="doc-tab"
              :class="{ active: activeDocTab === 'completion' }"
              @click="loadDocPreview('completion')"
            >
              <i class="fas fa-clipboard-check" />
              납품완료계
            </button>
            <button
              class="doc-tab"
              :class="{ active: activeDocTab === 'photo-sheet' }"
              @click="loadDocPreview('photo-sheet')"
            >
              <i class="fas fa-images" />
              사진대지
            </button>
          </div>

          <!-- 문서 미리보기 영역 -->
          <div class="doc-preview-container">
            <!-- 로딩 -->
            <div v-if="docLoading" class="doc-loading">
              <i class="fas fa-spinner fa-spin" />
              <p>문서를 불러오는 중...</p>
            </div>

            <!-- 에러 -->
            <div v-else-if="docError" class="doc-error">
              <i class="fas fa-exclamation-triangle" />
              <p>{{ docError }}</p>
              <button class="btn-action btn-secondary" @click="loadDocPreview(activeDocTab)">
                <i class="fas fa-redo" /> 다시 시도
              </button>
            </div>

            <!-- iframe 미리보기 -->
            <iframe
              v-show="docBlobUrl && !docLoading && !docError"
              ref="docIframe"
              :src="docBlobUrl || ''"
              class="doc-iframe"
              frameborder="0"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- PDF 다운로드 모달 (기존 컴포넌트 재사용) -->
    <PdfDownloadModal
      v-if="showPdfModal && data"
      :delivery-done="pdfModalData"
      @close="showPdfModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { getDeliveryDoneDetail, fetchHtmlPreview } from '~/services/delivery-done.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import { useCommonStatus } from '~/composables/useCommonStatus'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import type { DeliveryDone } from '~/types/delivery-done'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품완료 상세'
})

const router = useRouter()
const route = useRoute()

// DB 기반 상태 관리
const { loadStatusCodes, getStatusLabel, getStatusClass: getStatusBadgeClass } = useCommonStatus()

// 상태 한글 변환 (DB 실패 시 fallback)
const statusLabelMap: Record<string, string> = {
  PENDING: '대기',
  IN_PROGRESS: '진행중',
  PENDING_SIGNATURE: '서명대기',
  CONFIRMATION_COMPLETED: '확인완료',
  COMPLETED: '완료',
  SUBMITTED: '제출완료'
}

const getStatusLabelWithFallback = (status: string): string => {
  const dbLabel = getStatusLabel(status)
  return dbLabel !== status ? dbLabel : (statusLabelMap[status] || status)
}

// 페이지 상태
const loading = ref(true)
const data = ref<any>(null)

// 문서 미리보기 상태
const docSectionOpen = ref(false)
const activeDocTab = ref<'confirmation' | 'completion' | 'photo-sheet'>('confirmation')
const docLoading = ref(false)
const docBlobUrl = ref<string | null>(null)
const docError = ref<string | null>(null)
const docIframe = ref<HTMLIFrameElement | null>(null)

// 품목 합계 계산
const totalOrderedQty = computed(() => {
  if (!data.value?.items) { return 0 }
  return data.value.items.reduce((sum: number, item: any) => sum + (item.orderedQuantity || 0), 0)
})
const totalAdditionalQty = computed(() => {
  if (!data.value?.items) { return 0 }
  return data.value.items.reduce((sum: number, item: any) => sum + (item.additionalQuantity || 0), 0)
})
const totalEffectiveQty = computed(() => totalOrderedQty.value + totalAdditionalQty.value)
const totalDeliveredQty = computed(() => {
  if (!data.value?.items) { return 0 }
  return data.value.items.reduce((sum: number, item: any) => sum + (item.deliveredQuantity || 0), 0)
})
const totalRemainingQty = computed(() => {
  if (!data.value?.items) { return 0 }
  return data.value.items.reduce((sum: number, item: any) => sum + (item.remainingQuantity || 0), 0)
})

// PDF 모달 상태
const showPdfModal = ref(false)

// PDF 다운로드 가능 여부
const canViewPdf = computed(() => {
  if (!data.value) { return false }
  const status = data.value.status
  return status === 'CONFIRMATION_COMPLETED' || status === 'COMPLETED' || status === 'SUBMITTED'
})

// 문서 미리보기 가능 여부
const isDocAvailable = computed(() => {
  if (!data.value) { return false }
  return data.value.status !== 'PENDING'
})

// PdfDownloadModal에 전달할 데이터 (기존 목록 아이템 형태로 변환)
const pdfModalData = computed(() => {
  if (!data.value) { return null }
  return {
    deliveryDoneId: data.value.deliveryDoneId,
    orderId: data.value.orderId,
    deliveryRequestNo: data.value.deliveryRequestNo,
    status: data.value.status,
    confirmationPdfPath: data.value.confirmationPdfPath,
    completionPdfPath: data.value.completionPdfPath,
    photoCollectionPath: data.value.photoCollectionPath
  }
})

// 날짜 포맷
function formatDate (value: string | null | undefined): string {
  if (!value) { return '-' }
  return value.substring(0, 10)
}

function formatDateTime (value: string | null | undefined): string {
  if (!value) { return '-' }
  if (value.length >= 16) { return value.substring(0, 16).replace('T', ' ') }
  return value.substring(0, 10)
}

// 납품률 색상 클래스
function getRateClass (rate: number): string {
  if (rate >= 100) { return 'rate-complete' }
  if (rate >= 50) { return 'rate-progress' }
  return 'rate-low'
}

// 상세 데이터 로드
async function fetchDetail () {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    loading.value = false
    return
  }

  try {
    loading.value = true
    data.value = await getDeliveryDoneDetail(id)
    // 상태 코드 로드
    await loadStatusCodes('DELIVERY_DONE')
  } catch (error) {
    console.error('납품완료 상세 조회 실패:', error)
    data.value = null
  } finally {
    loading.value = false
  }
}

// 문서 미리보기 섹션 토글 (펼칠 때 자동 로드)
function toggleDocSection () {
  docSectionOpen.value = !docSectionOpen.value
  // 펼칠 때 아직 로드하지 않았으면 납품확인서 자동 로드
  if (docSectionOpen.value && !docBlobUrl.value && !docLoading.value) {
    loadDocPreview('confirmation')
  }
}

// 문서 미리보기 로드
async function loadDocPreview (docType: 'confirmation' | 'completion' | 'photo-sheet') {
  activeDocTab.value = docType
  docError.value = null

  // 이전 blob URL 해제
  if (docBlobUrl.value) {
    URL.revokeObjectURL(docBlobUrl.value)
    docBlobUrl.value = null
  }

  if (!data.value) { return }

  docLoading.value = true
  try {
    docBlobUrl.value = await fetchHtmlPreview(data.value.deliveryDoneId, docType)
  } catch (error: any) {
    console.error(`${docType} HTML 미리보기 로드 실패:`, error)
    docError.value = '문서를 불러오는데 실패했습니다. 서명이 완료되지 않은 문서일 수 있습니다.'
    docBlobUrl.value = null
  } finally {
    docLoading.value = false
  }
}

// 목록으로 돌아가기
function goBack () {
  router.push('/admin/delivery-done/list')
}

// 마운트 시 데이터 로드
onMounted(() => {
  fetchDetail()
})

// 언마운트 시 blob URL 해제
onUnmounted(() => {
  if (docBlobUrl.value) {
    URL.revokeObjectURL(docBlobUrl.value)
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

/* 접이식 문서 미리보기 */
.doc-collapsible {
  margin-bottom: 0.1rem;
}

.doc-collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0.5rem 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 0.6rem;
  user-select: none;
}

.doc-collapsible-header:hover {
  background-color: #f9fafb;
  border-radius: 4px;
}

.collapse-icon {
  font-size: 0.8rem;
  margin-right: 8px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.collapse-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 400;
}

/* 페이지 레이아웃 */
.delivery-done-detail {
  padding: 0;
  margin-bottom: 0;
}

/* 서명 상태 */
.signature-status-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 12px 0;
}

.signature-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signature-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  min-width: 140px;
}

.signature-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.signature-badge.signed {
  background-color: #dcfce7;
  color: #166534;
}

.signature-badge.unsigned {
  background-color: #f3f4f6;
  color: #6b7280;
}

.signature-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* 납품률 바 */
.rate-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.delivery-rate-bar {
  flex: 1;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  max-width: 120px;
}

.delivery-rate-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.delivery-rate-fill.rate-complete { background-color: #22c55e; }
.delivery-rate-fill.rate-progress { background-color: #3b82f6; }
.delivery-rate-fill.rate-low { background-color: #f59e0b; }

.delivery-rate-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
}

/* 품목 완료/진행중 배지 */
.badge-complete {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #dcfce7;
  color: #166534;
}

.badge-incomplete {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #fef3c7;
  color: #92400e;
}

/* 문서 미리보기 섹션 */
.doc-preview-section {
  width: 100%;
}

.doc-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 0;
}

.doc-tab {
  padding: 10px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.doc-tab:hover {
  color: #374151;
  background-color: #f9fafb;
}

.doc-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

.doc-tab i {
  font-size: 0.85rem;
}

/* 문서 미리보기 컨테이너 */
.doc-preview-container {
  position: relative;
  min-height: 400px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.doc-iframe {
  width: 100%;
  height: 750px;
  border: none;
  background-color: #fff;
}

.doc-loading,
.doc-error,
.doc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #6b7280;
  gap: 12px;
}

.doc-loading i,
.doc-error i,
.doc-empty i {
  font-size: 2rem;
  color: #9ca3af;
}

.doc-error i {
  color: #ef4444;
}

.doc-error p {
  color: #ef4444;
}

.doc-hint {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* 상태 배지 (목록 페이지와 동일) */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* 테이블 컴팩트 */
.items-table {
  table-layout: auto;
}

.items-table th,
.items-table td {
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
}

.items-table .spec-cell {
  white-space: nowrap;
}

/* 합계 행 */
.items-table .totals-row {
  background: #f0f5ff;
  border-top: 2px solid #3b82f6;
}

.items-table .totals-row td {
  padding: 0.5rem;
  color: #1e40af;
}

.empty-row {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 추가 품목 배지 */
.badge-additional {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  background-color: #ede9fe;
  color: #7c3aed;
  margin-left: 4px;
}

/* 추가수량 강조 */
.text-additional {
  color: #2563eb;
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}
</style>
