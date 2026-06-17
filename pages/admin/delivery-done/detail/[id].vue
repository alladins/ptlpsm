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
        <button
          v-if="canCompleteManually"
          class="btn-action btn-warning"
          @click="showManualCompleteModal = true"
        >
          <i class="fas fa-check-circle" />
          수동 완료
        </button>
        <button
          v-if="canResetItem"
          class="btn-action btn-delete"
          @click="showResetModal = true"
        >
          <i class="fas fa-undo" />
          초기화
        </button>
        <button
          v-if="canRegeneratePdfs"
          class="btn-action btn-info"
          title="서명 보존하고 PDF 3종만 새 데이터로 재생성"
          @click="showRegenerateModal = true"
        >
          <i class="fas fa-redo" />
          PDF 재발행
        </button>
        <button
          v-if="canRecalculate"
          class="btn-action btn-info"
          :disabled="recalculating"
          title="출하 재배정/추가수량 정정 후 실제 출하 기준으로 납품수량·납품률 재계산 (금액·날짜 미변경)"
          @click="handleRecalculate"
        >
          <i class="fas fa-calculator" />
          {{ recalculating ? '재계산 중...' : '재계산' }}
        </button>
        <button
          v-if="canUploadScan"
          class="btn-action btn-info"
          @click="showScanUploadModal = true"
        >
          <i class="fas fa-upload" />
          스캔본 업로드
        </button>
      </template>
    </PageHeader>

    <LoadingSection v-if="loading" />
    <ErrorSection v-else-if="!data" message="납품완료 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <!-- 기본 정보 (접기/펼치기, 기본 열림) -->
      <AccordionSection title="기본 정보" :summary="baseInfoSummary" :default-expanded="true">
        <div class="base-info-grid">
        <!-- 발주 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-alt" />
            <span>발주 정보</span>
          </div>
          <div class="info-grid grid-3">
            <FormField label="납품요구번호">
              <input type="text" :value="data.deliveryRequestNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약번호">
              <input type="text" :value="data.contractNo || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약일자">
              <input type="text" :value="formatDate(data.contractDate)" class="form-input-sm" readonly>
            </FormField>
          </div>
          <div class="info-grid grid-1" style="margin-top: 0.5rem;">
            <FormField label="사업명">
              <input type="text" :value="data.projectName" class="form-input-md" style="width: 100%;" readonly>
            </FormField>
          </div>
          <div class="info-grid grid-2" style="margin-top: 0.5rem;">
            <FormField label="수요기관">
              <input type="text" :value="data.client" class="form-input-md" style="width: 100%;" readonly>
            </FormField>
            <FormField label="납품장소">
              <input type="text" :value="data.deliveryLocation || '-'" class="form-input-md" style="width: 100%;" readonly>
            </FormField>
          </div>
        </div>

        <!-- 시공사/계약 정보 (2행 좌측) -->
        <div class="info-group" style="order: 3;">
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
        <div class="info-group" style="order: 2;">
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

        <!-- 금액 정보 (2행 우측) -->
        <div class="info-group amount-group" style="order: 4;">
          <div class="info-group-header">
            <i class="fas fa-won-sign" />
            <span>금액 정보</span>
          </div>
          <!-- ★ 정책: 매출·집계는 품대계(item_total_amount) 단일 기준. 본 표시는 발주서/납품요구와의 시각 통일 (품목총액 + 수수료 = 총 계약금액). -->
          <div class="amount-display">
            <div class="amount-item">
              <label>품목총액</label>
              <span>{{ formatCurrency(data.itemTotalAmount || 0) }}</span>
            </div>
            <span class="amount-operator">+</span>
            <div class="amount-item">
              <label>수수료</label>
              <span>{{ formatCurrency(data.commission || 0) }}</span>
            </div>
            <span class="amount-operator">=</span>
            <div class="amount-item total">
              <label>총 계약금액</label>
              <span>{{ formatCurrency(data.totalAmount || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- 서명 상태 (금액 정보 하단, 전체 너비) -->
        <div class="info-group" style="order: 5; grid-column: 1 / -1;">
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
        </div>
      </AccordionSection>

      <!-- 품목 목록 -->
      <FormSection title="품목 목록" style="margin-top: 1rem">
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
                  <span :class="item.isCompleted ? 'badge-complete' : 'badge-incomplete'">
                    {{ item.isCompleted ? '완료' : '진행중' }}
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

      <!-- 수량 변경 이력 (변경계약/추가계약 반영) -->
      <FormSection
        v-if="quantityHistory.length > 0"
        title="수량 변경 이력"
        style="margin-top: -20px"
      >
        <div class="table-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 150px;">일시</th>
                <th style="width: 90px;">유형</th>
                <th>품목</th>
                <th class="text-right" style="width: 90px;">변경 전</th>
                <th class="text-right" style="width: 90px;">변경 후</th>
                <th class="text-right" style="width: 90px;">증감</th>
                <th>사유 (연관 납품요구)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in quantityHistory" :key="h.id">
                <td>{{ formatDateTime(h.changedAt) }}</td>
                <td>
                  <span
                    class="ct-badge"
                    :class="h.changeType === 'AMENDMENT' ? 'ct-amendment' : 'ct-additional'"
                  >
                    {{ h.changeType === 'AMENDMENT' ? '변경계약' : '추가계약' }}
                  </span>
                </td>
                <td>{{ h.itemName || h.skuId }}</td>
                <td class="text-right">{{ formatNumber(h.oldQuantity) }}</td>
                <td class="text-right font-semibold">{{ formatNumber(h.newQuantity) }}</td>
                <td class="text-right">
                  <span :class="h.deltaQuantity >= 0 ? 'text-additional' : 'text-minus'">
                    {{ h.deltaQuantity >= 0 ? '+' : '' }}{{ formatNumber(h.deltaQuantity) }}
                  </span>
                </td>
                <td>{{ h.changeReason || h.deliveryRequestNo || '-' }}</td>
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

          <!-- 사진대지 탭 전용: 현장사진 교체/추가 패널 -->
          <div v-if="activeDocTab === 'photo-sheet'" class="photo-manage-panel">
            <div class="photo-manage-header">
              <span class="photo-manage-title"><i class="fas fa-images" /> 현장사진 관리</span>
              <span class="photo-manage-hint">임시사진을 실제 현장사진으로 교체하거나 추가할 수 있습니다. 교체 시 사진대지가 자동 갱신됩니다.</span>
            </div>

            <div v-if="!canEditPhotos" class="photo-manage-msg locked">
              <i class="fas fa-lock" /> 조달청 제출이 완료된 건은 사진을 변경할 수 없습니다.
            </div>
            <div v-else-if="photosLoading" class="photo-manage-msg">
              <i class="fas fa-spinner fa-spin" /> 사진을 불러오는 중...
            </div>
            <div v-else-if="photoError" class="photo-manage-msg error">
              {{ photoError }}
            </div>
            <div v-else-if="photoGroups.length === 0" class="photo-manage-msg">
              등록된 사진이 없습니다.
            </div>

            <div v-else class="photo-groups">
              <div v-for="group in photoGroups" :key="group.deliveryId" class="photo-group">
                <div class="photo-group-title">
                  <span>출하 #{{ group.deliveryId }} <span class="photo-count">({{ group.photos.length }}/5, 대지 {{ (pendingSelection[group.deliveryId] || []).length }}/2)</span></span>
                  <button
                    v-if="canEditPhotos"
                    class="photo-save-select-btn"
                    :disabled="busySaveDeliveryId === group.deliveryId"
                    @click="saveSelection(group.deliveryId)"
                  >
                    <i v-if="busySaveDeliveryId === group.deliveryId" class="fas fa-spinner fa-spin" />
                    <template v-else><i class="fas fa-check" /> 대지선택 저장</template>
                  </button>
                </div>
                <div class="photo-grid">
                  <div v-for="photo in group.photos" :key="photo.photoId" class="photo-cell">
                    <div class="photo-thumb-box">
                      <img v-if="photoBlobUrls[photo.photoId]" :src="photoBlobUrls[photo.photoId]" :alt="`사진 ${photo.seq}`" class="photo-thumb">
                      <div v-else class="photo-thumb-empty"><i class="fas fa-image" /></div>
                    </div>
                    <div class="photo-cell-meta">
                      <span class="photo-seq">#{{ photo.seq }}</span>
                      <label class="photo-select-toggle" :class="{ on: isPhotoSelected(photo) }">
                        <input
                          type="checkbox"
                          :checked="isPhotoSelected(photo)"
                          :disabled="!canEditPhotos"
                          @change="togglePhotoSelect(photo)"
                        >
                        대지
                      </label>
                    </div>
                    <label class="photo-btn replace" :class="{ disabled: busyPhotoId === photo.photoId }">
                      <i v-if="busyPhotoId === photo.photoId" class="fas fa-spinner fa-spin" />
                      <template v-else><i class="fas fa-sync-alt" /> 교체</template>
                      <input
                        type="file"
                        accept="image/jpeg"
                        style="display: none"
                        :disabled="busyPhotoId === photo.photoId"
                        @change="(e) => onReplacePhoto(photo, e)"
                      >
                    </label>
                  </div>

                  <!-- 추가 슬롯 (출하당 5장 미만일 때) -->
                  <label
                    v-if="group.photos.length < 5"
                    class="photo-add-slot"
                    :class="{ disabled: busyDeliveryId === group.deliveryId }"
                  >
                    <i v-if="busyDeliveryId === group.deliveryId" class="fas fa-spinner fa-spin" />
                    <template v-else>
                      <i class="fas fa-plus" />
                      <span>사진 추가</span>
                    </template>
                    <input
                      type="file"
                      accept="image/jpeg"
                      style="display: none"
                      :disabled="busyDeliveryId === group.deliveryId"
                      @change="(e) => onAddPhoto(group.deliveryId, e)"
                    >
                  </label>
                </div>
              </div>
            </div>
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

    <!-- 수동 완료 모달 -->
    <ManualCompleteModal
      v-if="showManualCompleteModal && adminModalData"
      :delivery-done="adminModalData"
      @close="showManualCompleteModal = false"
      @completed="handleAdminActionDone"
    />

    <!-- 초기화 모달 -->
    <ResetConfirmModal
      v-if="showResetModal && adminModalData"
      :delivery-done="adminModalData"
      @close="showResetModal = false"
      @reset="handleAdminActionDone"
    />

    <!-- PDF 재발행 모달 (서명·상태 보존) -->
    <RegeneratePdfConfirmModal
      v-if="showRegenerateModal && adminModalData"
      :delivery-done="adminModalData"
      @close="showRegenerateModal = false"
      @regenerated="handleAdminActionDone"
    />

    <!-- 스캔본 업로드 모달 -->
    <ScanUploadModal
      v-if="showScanUploadModal && adminModalData"
      :delivery-done="adminModalData"
      @close="showScanUploadModal = false"
      @uploaded="handleAdminActionDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { getDeliveryDoneDetail, fetchHtmlPreview, getDeliveryDonePhotos, replaceDeliveryDonePhoto, addDeliveryDonePhoto, updateDeliveryDonePhotoSelection, getQuantityHistory, recalculateDeliveryDone } from '~/services/delivery-done.service'
import { getApiBaseUrl, getAuthHeaders } from '~/services/api'
import { formatNumber, formatCurrency } from '~/utils/format'
import { useCommonStatus } from '~/composables/useCommonStatus'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import AccordionSection from '~/components/admin/forms/AccordionSection.vue'
import type { DeliveryPhotoInfo, DeliveryDoneItemHistory } from '~/types/delivery-done'
import { useAuthStore } from '~/stores/auth'
import ManualCompleteModal from '~/components/admin/delivery-done/ManualCompleteModal.vue'
import ResetConfirmModal from '~/components/admin/delivery-done/ResetConfirmModal.vue'
import RegeneratePdfConfirmModal from '~/components/admin/delivery-done/RegeneratePdfConfirmModal.vue'
import ScanUploadModal from '~/components/admin/delivery-done/ScanUploadModal.vue'

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

// 기본 정보(접힘) 헤더 요약: 납품요구번호 · 수요기관
const baseInfoSummary = computed(() => {
  const no = data.value?.deliveryRequestNo || '-'
  const client = data.value?.client || ''
  return client ? `${no} · ${client}` : no
})

// 수량 변경 이력 (변경계약/추가계약 반영)
const quantityHistory = ref<DeliveryDoneItemHistory[]>([])

// 문서 미리보기 상태
const docSectionOpen = ref(false)
const activeDocTab = ref<'confirmation' | 'completion' | 'photo-sheet'>('confirmation')
const docLoading = ref(false)
const docBlobUrl = ref<string | null>(null)
const docError = ref<string | null>(null)
const docIframe = ref<HTMLIFrameElement | null>(null)

// 사진대지 탭 — 현장사진 교체/추가 상태
const photos = ref<DeliveryPhotoInfo[]>([])
const photosLoading = ref(false)
const photoError = ref<string | null>(null)
const photoBlobUrls = ref<Record<number, string>>({}) // photoId별 인증 fetch 이미지 objectURL
const busyPhotoId = ref<number | null>(null) // 교체 진행 중 photoId
const busyDeliveryId = ref<number | null>(null) // 추가 진행 중 deliveryId
const busySaveDeliveryId = ref<number | null>(null) // 대지선택 저장 중 deliveryId
const pendingSelection = ref<Record<number, number[]>>({}) // deliveryId별 대지포함 선택 photoId 목록(로컬)

// 출하(delivery)별 사진 그룹 — 한 납품완료가 여러 출하를 포함할 수 있음
const photoGroups = computed(() => {
  const map = new Map<number, DeliveryPhotoInfo[]>()
  for (const p of photos.value) {
    if (!map.has(p.deliveryId)) { map.set(p.deliveryId, []) }
    map.get(p.deliveryId)!.push(p)
  }
  return Array.from(map.entries()).map(([deliveryId, list]) => ({
    deliveryId,
    photos: [...list].sort((a, b) => a.seq - b.seq)
  }))
})

// 제출완료(SUBMITTED) 건은 사진 변경 불가
const canEditPhotos = computed(() => !!data.value && data.value.status !== 'SUBMITTED')

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

// 관리(수동완료/초기화/스캔본) 상태 + 권한
const showManualCompleteModal = ref(false)
const showResetModal = ref(false)
const showRegenerateModal = ref(false)
const showScanUploadModal = ref(false)

const authStore = useAuthStore()
const isSystemAdmin = computed(() => authStore.role === 'SYSTEM_ADMIN')
const canAdminAction = computed(() =>
  authStore.role === 'SYSTEM_ADMIN' || authStore.role === 'LEADPOWER_MANAGER'
)

const canCompleteManually = computed(() => {
  if (!canAdminAction.value || !data.value) { return false }
  const status = data.value.status
  if (status === 'SUBMITTED' || status === 'COMPLETED') { return false }
  const rate = Number(data.value.deliveryCompletionRate ?? 0)
  return rate >= 100
})

const canResetItem = computed(() => {
  if (!isSystemAdmin.value || !data.value) { return false }
  const status = data.value.status
  if (status === 'SUBMITTED') { return false }
  // 잔금 입금 완료 건은 회계 정합성 보호를 위해 차단 (백엔드 가드와 일치)
  if (data.value.isBalancePaid) { return false }
  return !!data.value.st1ManagerSignaturePath ||
         !!data.value.st1InspectorSignaturePath ||
         !!data.value.st2InspectorSignaturePath ||
         status === 'COMPLETED' ||
         !!data.value.isManualComplete ||
         !!data.value.confirmationPdfScanPath ||
         !!data.value.completionPdfScanPath
})

const canUploadScan = computed(() => {
  if (!canAdminAction.value || !data.value) { return false }
  return !!data.value.isManualComplete
})

const canRegeneratePdfs = computed(() => {
  // 권한: SYSTEM_ADMIN 전용. SUBMITTED 는 제외. 잔금 가드 없음 (회계 컬럼 미수정).
  if (!isSystemAdmin.value || !data.value) { return false }
  const status = data.value.status
  if (status === 'SUBMITTED') { return false }
  return status === 'COMPLETED' ||
         status === 'PENDING_SIGNATURE' ||
         !!data.value.isManualComplete
})

const canRecalculate = computed(() => {
  // 권한: SYSTEM_ADMIN 전용. SUBMITTED 는 제외. (출하 재배정/추가수량 정정 후 보정용)
  if (!isSystemAdmin.value || !data.value) { return false }
  return data.value.status !== 'SUBMITTED'
})

const recalculating = ref(false)

async function handleRecalculate () {
  if (recalculating.value || !data.value) { return }
  const ok = window.confirm(
    '실제 출하(납품확인 완료) 기준으로 품목 납품수량·납품률을 다시 계산합니다.\n' +
    '금액·날짜는 변경되지 않습니다. 진행하시겠습니까?'
  )
  if (!ok) { return }
  recalculating.value = true
  try {
    await recalculateDeliveryDone(data.value.deliveryDoneId)
    alert('재계산이 완료되었습니다.')
    fetchDetail()
  } catch (error: any) {
    console.error('재계산 실패:', error)
    alert(error?.message || '재계산에 실패했습니다.')
  } finally {
    recalculating.value = false
  }
}

// 관리 모달용 데이터 (DeliveryDoneListItem 형태)
const adminModalData = computed(() => {
  if (!data.value) { return null }
  return {
    ...data.value,
    contractorCompanyName: data.value.builderCompanyName || data.value.contractor || '-'
  } as any
})

function handleAdminActionDone () {
  showManualCompleteModal.value = false
  showResetModal.value = false
  showScanUploadModal.value = false
  fetchDetail()
}

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
    // 수량 변경 이력 로드 (실패해도 본문은 표시)
    try {
      quantityHistory.value = await getQuantityHistory(id)
    } catch (historyError) {
      console.error('수량 변경 이력 조회 실패:', historyError)
      quantityHistory.value = []
    }
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

  // 사진대지 탭이면 교체/추가용 사진 목록도 로드
  if (docType === 'photo-sheet') { loadPhotos() }

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

// ===== 사진대지 탭: 현장사진 교체/추가 =====

/** 인증 이미지 엔드포인트 URL (deliveries 사진 서빙) */
function photoUrl (photo: DeliveryPhotoInfo): string {
  return `${getApiBaseUrl()}/admin/deliveries/${photo.deliveryId}/photo/${photo.seq}`
}

/** admin 이미지 엔드포인트는 JWT 인증 필요 → 인증 헤더로 fetch 후 objectURL 생성 (SecureImage 는 헤더 미포함이라 401) */
async function loadPhotoBlob (photo: DeliveryPhotoInfo) {
  try {
    const res = await fetch(`${photoUrl(photo)}?t=${Date.now()}`, { headers: getAuthHeaders() })
    if (!res.ok) { throw new Error(`photo fetch failed: ${res.status}`) }
    const blob = await res.blob()
    const prev = photoBlobUrls.value[photo.photoId]
    if (prev) { URL.revokeObjectURL(prev) }
    photoBlobUrls.value[photo.photoId] = URL.createObjectURL(blob)
  } catch (e) {
    console.error('사진 이미지 로드 실패:', e)
  }
}

async function loadPhotos () {
  if (!data.value) { return }
  photosLoading.value = true
  photoError.value = null
  try {
    photos.value = await getDeliveryDonePhotos(data.value.deliveryDoneId)
    initSelection()
    await Promise.all(photos.value.map(loadPhotoBlob))
  } catch (e: any) {
    console.error('사진 목록 로드 실패:', e)
    photoError.value = '사진 목록을 불러오지 못했습니다.'
  } finally {
    photosLoading.value = false
  }
}

/** 사진 교체 (임시사진 → 현장사진). 성공 시 캐시버스팅 + 사진대지 PDF 미리보기 재로드 */
async function onReplacePhoto (photo: DeliveryPhotoInfo, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0 || !data.value) { return }
  const file = input.files[0]
  input.value = '' // 같은 파일 재선택 허용
  busyPhotoId.value = photo.photoId
  try {
    await replaceDeliveryDonePhoto(data.value.deliveryDoneId, photo.photoId, file)
    await loadPhotos()
    if (activeDocTab.value === 'photo-sheet') { await loadDocPreview('photo-sheet') }
    alert('사진이 교체되었습니다.')
  } catch (e: any) {
    alert(e?.message || '사진 교체에 실패했습니다.')
  } finally {
    busyPhotoId.value = null
  }
}

/** 사진 추가 (특정 출하에 현장사진 추가, 미선택 상태) */
async function onAddPhoto (deliveryId: number, event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0 || !data.value) { return }
  const file = input.files[0]
  input.value = ''
  busyDeliveryId.value = deliveryId
  try {
    await addDeliveryDonePhoto(data.value.deliveryDoneId, deliveryId, file)
    await loadPhotos()
    alert("사진이 추가되었습니다. 사진대지에 포함하려면 '사진 선택'에서 지정하세요.")
  } catch (e: any) {
    alert(e?.message || '사진 추가에 실패했습니다.')
  } finally {
    busyDeliveryId.value = null
  }
}

/** 출하별 대지포함 선택 상태 초기화 (서버 isSelectedForPdf 기준) */
function initSelection () {
  const map: Record<number, number[]> = {}
  for (const p of photos.value) {
    if (!map[p.deliveryId]) { map[p.deliveryId] = [] }
    if (p.isSelectedForPdf) { map[p.deliveryId].push(p.photoId) }
  }
  pendingSelection.value = map
}

function isPhotoSelected (photo: DeliveryPhotoInfo): boolean {
  return (pendingSelection.value[photo.deliveryId] || []).includes(photo.photoId)
}

/** 대지포함 토글 (출하당 최대 2장) */
function togglePhotoSelect (photo: DeliveryPhotoInfo) {
  const arr = [...(pendingSelection.value[photo.deliveryId] || [])]
  const idx = arr.indexOf(photo.photoId)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    if (arr.length >= 2) {
      alert('사진대지는 출하당 최대 2장까지입니다. 다른 사진의 "대지"를 먼저 해제한 후 선택해 주세요.')
      return
    }
    arr.push(photo.photoId)
  }
  pendingSelection.value = { ...pendingSelection.value, [photo.deliveryId]: arr }
}

/** 대지선택 저장 + 사진대지 PDF 재생성 */
async function saveSelection (deliveryId: number) {
  if (!data.value) { return }
  const photoIds = pendingSelection.value[deliveryId] || []
  if (photoIds.length === 0) {
    alert('출하당 최소 1장을 선택해야 합니다.')
    return
  }
  busySaveDeliveryId.value = deliveryId
  try {
    await updateDeliveryDonePhotoSelection(data.value.deliveryDoneId, deliveryId, photoIds)
    await loadPhotos()
    if (activeDocTab.value === 'photo-sheet') { await loadDocPreview('photo-sheet') }
    alert('사진대지 선택이 저장되었습니다.')
  } catch (e: any) {
    alert(e?.message || '사진대지 선택 저장에 실패했습니다.')
  } finally {
    busySaveDeliveryId.value = null
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
  for (const url of Object.values(photoBlobUrls.value)) {
    if (url) { URL.revokeObjectURL(url) }
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-detail.css';

/* 기본 정보(아코디언) 내부 2열 그리드 — FormSection.form-grid 대체 */
.base-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}
@media (max-width: 768px) {
  .base-info-grid {
    grid-template-columns: 1fr;
  }
}

/* 사진대지 탭 — 현장사진 관리 패널 */
.photo-manage-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #fafafa;
}
.photo-manage-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}
.photo-manage-title {
  font-weight: 600;
  color: #1f2937;
}
.photo-manage-hint {
  font-size: 0.8rem;
  color: #6b7280;
}
.photo-manage-msg {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}
.photo-manage-msg.locked { color: #92400e; }
.photo-manage-msg.error { color: #dc2626; }
.photo-groups {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 1100px) {
  .photo-groups { grid-template-columns: 1fr; }
}
.photo-group { margin-bottom: 0; }
.photo-group-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}
.photo-save-select-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.photo-save-select-btn:hover { background: #1d4ed8; }
.photo-save-select-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.photo-select-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  cursor: pointer;
  color: #9ca3af;
}
.photo-select-toggle.on { color: #1d4ed8; font-weight: 600; }
.photo-select-toggle input { cursor: pointer; }
.photo-count { color: #9ca3af; font-weight: 400; }
.photo-grid {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 0.5rem;
}
.photo-cell {
  flex: 0 0 calc((100% - 2rem) / 5);
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.photo-thumb-box {
  width: 100%;
  height: 90px;
}
.photo-cell img,
.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-thumb-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #d1d5db;
  font-size: 1.5rem;
}
.photo-cell-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}
.photo-badge {
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  padding: 0.05rem 0.35rem;
  font-size: 0.7rem;
}
.photo-btn.replace {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.4rem;
  background: #f3f4f6;
  color: #374151;
  border-top: 1px solid #e5e7eb;
}
.photo-btn.replace:hover { background: #e5e7eb; }
.photo-add-slot {
  flex: 0 0 calc((100% - 2rem) / 5);
  min-width: 0;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 0.8rem;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  background: #fff;
}
.photo-add-slot:hover { border-color: #3b82f6; color: #3b82f6; }
.photo-btn.replace.disabled,
.photo-add-slot.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

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

/* 수량 변경 이력 - 감소 표기 */
.text-minus {
  color: #dc2626;
  font-weight: 500;
}

/* 수량 변경 이력 - 계약유형 배지 */
.ct-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.ct-amendment {
  background: #e0f2fe;
  color: #0369a1;
}

.ct-additional {
  background: #ffedd5;
  color: #c2410c;
}
</style>
