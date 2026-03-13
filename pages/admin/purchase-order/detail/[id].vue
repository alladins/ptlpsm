<template>
  <div class="po-detail">
    <PageHeader
      title="발주서 상세"
      description="발주서 정보를 확인하고 관리합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <!-- DRAFT 상태: 수정, 삭제, 발행 -->
        <template v-if="poDetail && poDetail.status === 'DRAFT'">
          <button
            v-if="!isEditMode"
            class="btn-action"
            @click="enterEditMode"
          >
            <i class="fas fa-edit"></i>
            수정
          </button>
          <button
            v-if="isEditMode"
            class="btn-action btn-secondary"
            @click="cancelEditMode"
          >
            <i class="fas fa-times"></i>
            수정 취소
          </button>
          <button
            v-if="isEditMode"
            class="btn-action btn-primary"
            @click="handleSaveEdit"
            :disabled="submitting"
          >
            <i class="fas fa-save"></i>
            {{ submitting ? '저장 중...' : '저장' }}
          </button>
          <button
            v-if="!isEditMode"
            class="btn-action btn-delete"
            @click="handleDelete"
          >
            <i class="fas fa-trash"></i>
            삭제
          </button>
          <button
            v-if="!isEditMode && poDetail.status === 'DRAFT'"
            class="btn-action btn-primary"
            @click="handleIssue"
            :disabled="submitting"
          >
            <i class="fas fa-paper-plane"></i>
            발행
          </button>
        </template>

        <!-- ISSUED 상태: 접수, 삭제 가능 -->
        <template v-if="poDetail && poDetail.status === 'ISSUED' && !isEditMode">
          <button
            class="btn-action btn-accept"
            @click="handleAccept"
            :disabled="submitting"
          >
            <i class="fas fa-check-circle"></i>
            접수
          </button>
          <button
            class="btn-action btn-delete"
            @click="handleDelete"
            :disabled="submitting"
          >
            <i class="fas fa-trash"></i>
            삭제
          </button>
        </template>

        <!-- ACCEPTED 상태: 반려 -->
        <template v-if="poDetail && poDetail.status === 'ACCEPTED'">
          <button
            class="btn-action btn-reject"
            @click="openRejectModal"
            :disabled="submitting"
          >
            <i class="fas fa-ban"></i>
            반려
          </button>
        </template>

        <!-- REJECTED 상태: 삭제 -->
        <template v-if="poDetail && poDetail.status === 'REJECTED'">
          <button
            class="btn-action btn-delete"
            @click="handleDelete"
          >
            <i class="fas fa-trash"></i>
            삭제
          </button>
        </template>

        <!-- ACCEPTED / IN_PRODUCTION 상태: 생산완료 체크 (접수 후에만 가능) -->
        <template v-if="poDetail && (poDetail.status === 'ACCEPTED' || poDetail.status === 'IN_PRODUCTION')">
          <button
            v-if="!isProduceMode"
            class="btn-action btn-primary"
            @click="enterProduceMode"
          >
            <i class="fas fa-check-circle"></i>
            생산완료 체크
          </button>
          <button
            v-if="isProduceMode"
            class="btn-action btn-secondary"
            @click="cancelProduceMode"
          >
            <i class="fas fa-times"></i>
            취소
          </button>
          <button
            v-if="isProduceMode"
            class="btn-action btn-primary"
            @click="handleProduceComplete"
            :disabled="submitting"
          >
            <i class="fas fa-save"></i>
            {{ submitting ? '처리 중...' : '생산완료 저장' }}
          </button>
        </template>

        <!-- PDF 다운로드 (발행 후 PDF가 있는 경우) -->
        <button
          v-if="poDetail && poDetail.pdfPath && poDetail.status !== 'DRAFT'"
          class="btn-action"
          @click="handleDownloadPdf"
          :disabled="pdfDownloading"
        >
          <i :class="pdfDownloading ? 'fas fa-spinner fa-spin' : 'fas fa-file-pdf'"></i>
          {{ pdfDownloading ? '다운로드 중...' : '발주서 PDF' }}
        </button>

        <!-- 공통: 목록 버튼 -->
        <button class="btn-action btn-secondary" @click="goToList">
          <i class="fas fa-list"></i>
          목록
        </button>
      </template>
    </PageHeader>

    <!-- 로딩 -->
    <LoadingSection v-if="loading" message="발주서 정보를 불러오는 중..." />

    <!-- 에러 -->
    <ErrorSection v-else-if="!poDetail && !loading" message="발주서 정보를 찾을 수 없습니다." />

    <!-- 발주서 상세 내용 -->
    <div v-if="poDetail" class="content-section">
      <FormSection title="발주서 정보">
        <div class="po-info-grid">
          <!-- 발주서 번호 -->
          <FormField label="발주서 번호">
            <input
              type="text"
              :value="poDetail.poNo || '-'"
              class="form-input-sm"
              readonly
            >
          </FormField>

          <!-- OEM 제조사 -->
          <FormField label="OEM 제조사" :required="isEditMode" :error="errors.oemCompanyId">
            <select
              v-if="isEditMode"
              v-model="editForm.oemCompanyId"
              class="form-select"
              :disabled="loadingOemCompanies"
            >
              <option :value="null">{{ loadingOemCompanies ? '로딩 중...' : '선택하세요' }}</option>
              <option
                v-for="company in oemCompanies"
                :key="company.id"
                :value="company.id"
              >
                {{ company.companyName }}
              </option>
            </select>
            <input
              v-else
              type="text"
              :value="poDetail.oemCompanyName || '-'"
              class="form-input-sm"
              readonly
            >
          </FormField>

          <!-- 발주일자 -->
          <FormField label="발주일자">
            <input
              v-if="isEditMode"
              type="date"
              v-model="editForm.orderDate"
              class="form-input-sm text-center"
            >
            <input
              v-else
              type="text"
              :value="formatDate(poDetail.orderDate) || '-'"
              class="form-input-sm text-center"
              readonly
            >
          </FormField>

          <!-- 납기 예정일 -->
          <FormField label="납기 예정일">
            <input
              v-if="isEditMode"
              type="date"
              v-model="editForm.expectedCompletionDate"
              class="form-input-sm text-center"
            >
            <input
              v-else
              type="text"
              :value="formatDate(poDetail.expectedCompletionDate) || '-'"
              class="form-input-sm text-center"
              readonly
            >
          </FormField>

          <!-- 상태 -->
          <FormField label="상태">
            <span :class="getStatusBadgeClass(poDetail.status)">
              {{ getStatusLabel(poDetail.status) }}
            </span>
          </FormField>

          <!-- 총 금액 -->
          <FormField label="총 금액">
            <input
              type="text"
              :value="formatCurrency(isEditMode ? editTotalAmount : poDetail.totalAmount)"
              class="form-input-sm text-right"
              style="font-weight: bold; font-size: 1.125rem;"
              readonly
            >
          </FormField>

          <!-- 비고 -->
          <FormField label="비고" :full-width="true">
            <textarea
              v-if="isEditMode"
              v-model="editForm.remarks"
              class="form-textarea"
              rows="2"
              placeholder="비고 사항을 입력하세요"
            ></textarea>
            <input
              v-else
              type="text"
              :value="poDetail.remarks || '-'"
              class="form-input-xl"
              readonly
            >
          </FormField>

          <!-- 접수 정보 (접수된 경우 표시) -->
          <template v-if="poDetail.acceptedAt">
            <FormField label="접수일시">
              <input type="text" :value="formatDateTime(poDetail.acceptedAt)" class="form-input-sm" readonly>
            </FormField>
            <FormField label="접수자">
              <input type="text" :value="poDetail.acceptedBy || '-'" class="form-input-sm" readonly>
            </FormField>
          </template>

          <!-- 반려 정보 (반려된 경우 표시) -->
          <template v-if="poDetail.status === 'REJECTED'">
            <FormField label="반려일시">
              <input type="text" :value="formatDateTime(poDetail.rejectedAt)" class="form-input-sm" readonly>
            </FormField>
            <FormField label="반려자">
              <input type="text" :value="poDetail.rejectedBy || '-'" class="form-input-sm" readonly>
            </FormField>
            <FormField label="반려 사유" :full-width="true">
              <input type="text" :value="poDetail.rejectReason || '-'" class="form-input-xl reject-reason-display" readonly>
            </FormField>
          </template>
        </div>
      </FormSection>

      <!-- 품목 목록 -->
      <FormSection style="margin-top: -20px">
        <div class="items-section-wrapper">
          <div class="items-section-header">
            <div class="header-left">
              <i class="fas fa-box"></i>
              <span>품목 정보</span>
            </div>
            <!-- 수정 모드에서만 품목 추가 가능 -->
            <button
              v-if="isEditMode"
              type="button"
              class="btn-add-item"
              @click="openSkuSelector"
            >
              <i class="fas fa-plus"></i>
              품목 추가
            </button>
          </div>

          <div class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px">NO</th>
                  <th style="width: 80px">SKU ID</th>
                  <th style="width: 100px">SKU 품명</th>
                  <th style="width: 100px">품목명</th>
                  <th style="width: 70px" class="text-right">출하수량<br><small>(m²)</small></th>
                  <th style="width: 75px" class="text-right">추가수량<br><small>(m²)</small></th>
                  <th style="width: 70px" class="text-right">합계<br><small>(m²)</small></th>
                  <th style="width: 80px" class="text-right">단가<br><small>(원)</small></th>
                  <th style="width: 100px" class="text-right">금액<br><small>(원)</small></th>
                  <th style="width: 100px" class="text-right">생산완료<br><small>(m²)</small></th>
                  <th style="width: 70px" class="text-center">생산율</th>
                  <th style="width: 80px" class="text-right">입고수량<br><small>(m²)</small></th>
                  <th style="width: 70px" class="text-center">비고<br><small>(매)</small></th>
                  <th v-if="isEditMode" style="width: 50px">삭제</th>
                </tr>
              </thead>
              <tbody>
                <!-- 조회 모드 -->
                <template v-if="!isEditMode && !isProduceMode">
                  <tr v-if="poDetail.items.length === 0">
                    <td colspan="13" class="empty-message">품목 정보가 없습니다.</td>
                  </tr>
                  <tr v-for="(item, index) in poDetail.items" :key="item.poiId">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td class="text-center">{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td>{{ item.itemName || '-' }}</td>
                    <td class="text-right">{{ (item.shipmentQuantity || 0) > 0 ? formatQuantity(item.shipmentQuantity) : '-' }}</td>
                    <td class="text-right">{{ formatQuantity((item.quantity || 0) - (item.shipmentQuantity || 0)) }}</td>
                    <td class="text-right"><strong>{{ formatQuantity(item.quantity) }}</strong></td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                    <td class="text-right">{{ formatQuantity(item.producedQuantity) }}</td>
                    <td class="text-center" :class="getProductionRateClass(item.producedQuantity, item.quantity)">
                      {{ getProductionRate(item.producedQuantity, item.quantity) }}
                    </td>
                    <td class="text-right">{{ formatQuantity(item.stockedQuantity) }}</td>
                    <td class="text-center">{{ item.quantity > 0 ? formatQuantity(Math.round(item.quantity / 2)) + ' 매' : '-' }}</td>
                  </tr>
                </template>

                <!-- 수정 모드 -->
                <template v-if="isEditMode">
                  <tr v-if="editForm.items.length === 0">
                    <td colspan="14" class="empty-message">품목을 추가하세요.</td>
                  </tr>
                  <tr v-for="(item, index) in editForm.items" :key="item.skuId">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td class="text-center">{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td>{{ item.itemName || '-' }}</td>
                    <td class="text-right">
                      {{ (item.shipmentQuantity || 0) > 0 ? formatQuantity(item.shipmentQuantity) : '-' }}
                    </td>
                    <td class="text-right">
                      <input
                        type="number"
                        :value="(item.quantity || 0) - (item.shipmentQuantity || 0)"
                        @input="item.quantity = (item.shipmentQuantity || 0) + Math.max(0, Number(($event.target as HTMLInputElement).value) || 0)"
                        :min="0"
                        step="1"
                        class="table-input text-right input-w75"
                      />
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(item.quantity) }}</strong>
                    </td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency((item.quantity || 0) * (item.unitPrice || 0)) }}</td>
                    <td class="text-right">{{ formatQuantity(item.producedQuantity || 0) }}</td>
                    <td class="text-center" :class="getProductionRateClass(item.producedQuantity, item.quantity)">
                      {{ getProductionRate(item.producedQuantity, item.quantity) }}
                    </td>
                    <td class="text-right">{{ formatQuantity(item.stockedQuantity || 0) }}</td>
                    <td class="text-center">{{ (item.quantity || 0) > 0 ? formatQuantity(Math.round((item.quantity || 0) / 2)) + ' 매' : '-' }}</td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-remove"
                        @click="removeEditItem(index)"
                        title="삭제"
                      >
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                </template>

                <!-- 생산완료 체크 모드 -->
                <template v-if="isProduceMode">
                  <tr v-for="(item, index) in produceItems" :key="item.poiId">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td class="text-center">{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td>{{ item.itemName || '-' }}</td>
                    <td class="text-right">{{ (item.shipmentQuantity || 0) > 0 ? formatQuantity(item.shipmentQuantity) : '-' }}</td>
                    <td class="text-right">{{ formatQuantity((item.quantity || 0) - (item.shipmentQuantity || 0)) }}</td>
                    <td class="text-right"><strong>{{ formatQuantity(item.quantity) }}</strong></td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.amount) }}</td>
                    <td class="text-right produce-col">
                      <div class="produce-input-wrapper">
                        <button
                          type="button"
                          class="btn-fill-quantity"
                          @click="item.newProducedQuantity = item.quantity"
                          title="발주수량으로 채우기"
                          :disabled="item.newProducedQuantity === item.quantity"
                        >&#9654;</button>
                        <input
                          type="number"
                          v-model.number="item.newProducedQuantity"
                          :min="0"
                          :max="item.quantity"
                          step="1"
                          class="table-input text-right"
                          style="width: 80px"
                        />
                        <span class="produce-current">/ {{ formatQuantity(item.quantity) }}</span>
                      </div>
                    </td>
                    <td class="text-center" :class="getProductionRateClass(item.newProducedQuantity, item.quantity)">
                      {{ getProductionRate(item.newProducedQuantity, item.quantity) }}
                    </td>
                    <td class="text-right">{{ formatQuantity(item.stockedQuantity) }}</td>
                    <td class="text-center">{{ item.quantity > 0 ? formatQuantity(Math.round(item.quantity / 2)) + ' 매' : '-' }}</td>
                  </tr>
                </template>
              </tbody>
              <tfoot v-if="poDetail.items.length > 0 && !isEditMode && !isProduceMode">
                <tr>
                  <td colspan="6" class="text-right"><strong>합계</strong></td>
                  <td class="text-right"><strong>{{ formatQuantity(poDetail.totalQuantity) }}</strong></td>
                  <td class="text-right"><strong>총 금액</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(poDetail.totalAmount) }}</strong></td>
                  <td colspan="4"></td>
                </tr>
              </tfoot>
              <tfoot v-if="isEditMode && editForm.items.length > 0">
                <tr>
                  <td colspan="6" class="text-right"><strong>합계</strong></td>
                  <td class="text-right"><strong>{{ formatQuantity(editTotalQuantity) }}</strong></td>
                  <td class="text-right"><strong>총 금액</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(editTotalAmount) }}</strong></td>
                  <td colspan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </FormSection>
    </div>

    <!-- 생산 현황 섹션 -->
    <div v-if="poDetail && !isEditMode && !isProduceMode" class="content-section" style="margin-top: -10px;">
      <FormSection>
        <div class="production-section-wrapper">
          <!-- 헤더 -->
          <div class="production-section-header">
            <div class="header-left">
              <i class="fas fa-industry"></i>
              <span>생산 현황</span>
            </div>
          </div>

          <!-- 생산 진행률 -->
          <div class="production-progress">
            <div class="progress-info">
              <span class="progress-label">전체 생산율</span>
              <span class="progress-amount">
                생산완료 {{ formatQuantity(totalProduced) }} / 발주 {{ formatQuantity(poDetail.totalQuantity) }}
              </span>
              <span class="progress-percent">({{ productionProgressPercent }}%)</span>
            </div>
            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                :style="{ width: Math.min(productionProgressPercent, 100) + '%' }"
                :class="{
                  'progress-low': productionProgressPercent < 30,
                  'progress-mid': productionProgressPercent >= 30 && productionProgressPercent < 70,
                  'progress-high': productionProgressPercent >= 70 && productionProgressPercent < 100,
                  'progress-complete': productionProgressPercent >= 100
                }"
              ></div>
            </div>
          </div>
        </div>
      </FormSection>
    </div>

    <!-- 반려 사유 입력 모달 -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
        <div class="modal-content reject-modal">
          <div class="modal-header">
            <h3>발주서 반려</h3>
            <button class="modal-close" @click="closeRejectModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <!-- 반려 영향 분석 결과 -->
            <div v-if="rejectImpactLoading" class="reject-impact-loading">
              <i class="fas fa-spinner fa-spin"></i> 영향 분석 중...
            </div>
            <div v-else-if="rejectImpact && rejectImpact.affectedShipments.length > 0" class="reject-impact-warning">
              <div class="impact-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span>이 발주서를 반려하면 다음 출하에 영향을 줍니다:</span>
              </div>

              <!-- 직접 연결된 출하 -->
              <template v-if="rejectImpact.affectedShipments.filter(s => s.directlyLinked).length > 0">
                <div class="impact-section-label">직접 연결된 출하</div>
                <ul class="impact-list">
                  <li v-for="shipment in rejectImpact.affectedShipments.filter(s => s.directlyLinked)" :key="shipment.shipmentId">
                    <span class="shipment-no">{{ shipment.shipmentNo }}</span>
                    <template v-if="shipment.willCancelDispatch">
                      <span class="impact-action cancel">(출고요청중) → 출고요청이 취소됩니다</span>
                    </template>
                    <template v-else-if="shipment.dispatchStatus">
                      <span class="impact-action warning">({{ shipment.dispatchStatus }}) → 상태 초기화됩니다</span>
                    </template>
                    <template v-else>
                      <span class="impact-action info">→ 재고부족 상태로 변경됩니다</span>
                    </template>
                  </li>
                </ul>
              </template>

              <!-- 간접 영향 출하 (같은 OEM + SKU) -->
              <template v-if="rejectImpact.affectedShipments.filter(s => !s.directlyLinked).length > 0">
                <div class="impact-section-label indirect">같은 OEM/품목의 영향받는 출하</div>
                <ul class="impact-list">
                  <li v-for="shipment in rejectImpact.affectedShipments.filter(s => !s.directlyLinked)" :key="shipment.shipmentId">
                    <span class="shipment-no">{{ shipment.shipmentNo }}</span>
                    <template v-if="shipment.dispatchStatus === 'REQUESTED'">
                      <span class="impact-action warning">(출고요청중) → 재고부족으로 변경될 수 있습니다</span>
                    </template>
                    <template v-else>
                      <span class="impact-action info">→ 재고부족 상태로 변경될 수 있습니다</span>
                    </template>
                  </li>
                </ul>
              </template>

              <div class="impact-summary">
                반려 후 관련 출하는 "재고부족" 상태로 변경됩니다.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">반려 사유 <span class="required">*</span></label>
              <textarea
                v-model="rejectReason"
                class="form-textarea"
                rows="4"
                placeholder="반려 사유를 입력하세요"
                maxlength="500"
              ></textarea>
              <div class="char-count">{{ rejectReason.length }} / 500</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-action btn-secondary" @click="closeRejectModal">취소</button>
            <button
              class="btn-action btn-reject"
              @click="handleReject"
              :disabled="submitting || !rejectReason.trim()"
            >
              {{ submitting ? '처리 중...' : '반려' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- SKU 선택 팝업 (수정 모드용) -->
    <ItemSkuSelector
      v-model="showSkuSelector"
      @sku-selected="handleSkuSelected"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 발주서 상세 페이지
 * - 발주서 기본 정보 및 품목 목록 표시
 * - 상태별 액션: DRAFT(수정/삭제/발행), ISSUED/IN_PRODUCTION(생산완료 체크)
 * - 수정 모드: OEM, 날짜, 비고, 품목 편집
 * - 생산완료 모드: 각 품목별 생산완료 수량 인라인 입력
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { purchaseOrderService } from '~/services/purchase-order.service'
import { companyService } from '~/services/company.service'
import { oemCostService } from '~/services/oem-cost.service'
import type {
  PurchaseOrderDetail,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PurchaseOrderUpdateRequest,
  ProduceCompleteRequest,
  RejectImpactResponse
} from '~/types/purchase-order'
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '~/types/purchase-order'
import type { CompanyInfoResponse } from '~/types/company'
import type { OemCost } from '~/types/oem-cost'
import type { Item, ItemSku } from '~/services/item.service'
import { formatDate, formatNumber, formatCurrency, formatQuantity } from '~/utils/format'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import LoadingSection from '~/components/admin/common/LoadingSection.vue'
import ErrorSection from '~/components/admin/common/ErrorSection.vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '발주서 상세'
})

const router = useRouter()
const route = useRoute()

// 상태
const loading = ref(true)
const submitting = ref(false)
const poDetail = ref<PurchaseOrderDetail | null>(null)

// OEM 제조사 목록 (수정 모드용)
const oemCompanies = ref<CompanyInfoResponse[]>([])
const loadingOemCompanies = ref(false)

// OEM 원가 캐시 (skuId → costPrice)
const oemCostMap = ref<Map<string, number>>(new Map())
const loadingOemCosts = ref(false)

// 수정 모드
const isEditMode = ref(false)
const errors = ref<Record<string, string>>({})

// SKU 선택 팝업
const showSkuSelector = ref(false)

// PDF 다운로드
const pdfDownloading = ref(false)

// 반려 모달
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectImpact = ref<RejectImpactResponse | null>(null)
const rejectImpactLoading = ref(false)

// 수정 폼 데이터 (품목 확장)
interface EditItemRow {
  skuId: string
  skuName: string
  itemName: string
  quantity: number
  shipmentQuantity: number
  unitPrice: number
  producedQuantity: number
  stockedQuantity: number
}

const editForm = ref({
  oemCompanyId: null as number | null,
  orderDate: '',
  expectedCompletionDate: '',
  remarks: '',
  items: [] as EditItemRow[]
})

// 생산완료 체크 모드
const isProduceMode = ref(false)

interface ProduceItemRow extends PurchaseOrderItem {
  newProducedQuantity: number
}

const produceItems = ref<ProduceItemRow[]>([])

// 발주서 ID
const poId = computed(() => {
  return Number(route.params.id)
})

// 상태 라벨
const getStatusLabel = (status: PurchaseOrderStatus): string => {
  return PO_STATUS_LABELS[status] || status
}

// 상태 배지 CSS 클래스
const getStatusBadgeClass = (status: PurchaseOrderStatus): string => {
  const colorClass = PO_STATUS_COLORS[status] || ''
  return `status-badge ${colorClass}`
}

// 날짜+시간 포맷
const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

// 수정 모드 - 총 수량
const editTotalQuantity = computed(() => {
  return editForm.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 수정 모드 - 총 금액
const editTotalAmount = computed(() => {
  return editForm.value.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0)
})

// 데이터 로드
const loadDetail = async () => {
  loading.value = true
  try {
    const data = await purchaseOrderService.getPurchaseOrderById(poId.value)
    poDetail.value = data
  } catch (error: any) {
    console.error('발주서 상세 조회 실패:', error)
    alert(error.message || '발주서 정보를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 수정 모드 진입
const enterEditMode = () => {
  if (!poDetail.value) return

  editForm.value = {
    oemCompanyId: poDetail.value.oemCompanyId,
    orderDate: poDetail.value.orderDate || '',
    expectedCompletionDate: poDetail.value.expectedCompletionDate || '',
    remarks: poDetail.value.remarks || '',
    items: poDetail.value.items.map(item => ({
      skuId: item.skuId,
      skuName: item.skuName,
      itemName: item.itemName || '',
      quantity: item.quantity,
      shipmentQuantity: item.shipmentQuantity || 0,
      unitPrice: item.unitPrice,
      producedQuantity: item.producedQuantity,
      stockedQuantity: item.stockedQuantity
    }))
  }

  errors.value = {}
  isEditMode.value = true

  // OEM 제조사 목록 로드
  loadOemCompanies()

  // OEM 원가 로드 (수정 모드에서 신규 품목 추가 시 원가 참조용)
  if (poDetail.value.oemCompanyId) {
    loadOemCosts(poDetail.value.oemCompanyId)
  }
}

// 수정 모드 취소
const cancelEditMode = () => {
  isEditMode.value = false
  errors.value = {}
}

// OEM 제조사 목록 로드
const loadOemCompanies = async () => {
  if (oemCompanies.value.length > 0) return
  loadingOemCompanies.value = true
  try {
    oemCompanies.value = await companyService.getManufacturers()
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
  } finally {
    loadingOemCompanies.value = false
  }
}

// OEM 원가 로드
const loadOemCosts = async (oemCompanyId: number) => {
  oemCostMap.value.clear()
  loadingOemCosts.value = true
  try {
    const costs: OemCost[] = await oemCostService.getByOemId(oemCompanyId)
    for (const cost of costs) {
      oemCostMap.value.set(cost.skuId, cost.costPrice)
    }
  } catch (error) {
    console.error('OEM 원가 조회 실패:', error)
  } finally {
    loadingOemCosts.value = false
  }
}

// 수정 모드에서 OEM 제조사 변경 시 원가 재조회
watch(() => editForm.value.oemCompanyId, async (newOemId) => {
  if (!isEditMode.value || !newOemId) return
  await loadOemCosts(newOemId)

  // 이미 추가된 품목의 단가를 OEM 원가로 갱신
  for (const item of editForm.value.items) {
    const costPrice = oemCostMap.value.get(item.skuId)
    if (costPrice !== undefined) {
      item.unitPrice = costPrice
    }
  }
})

// SKU 선택 팝업 열기
const openSkuSelector = () => {
  showSkuSelector.value = true
}

// SKU 선택 완료
const handleSkuSelected = (item: Item, sku: ItemSku) => {
  const skuIdStr = String(sku.skuId)

  const exists = editForm.value.items.some(i => i.skuId === skuIdStr)
  if (exists) {
    alert('이미 추가된 품목입니다.')
    return
  }

  const costPrice = oemCostMap.value.get(skuIdStr)

  editForm.value.items.push({
    skuId: skuIdStr,
    skuName: sku.skuNm || `${sku.thickness}T`,
    itemName: '',
    quantity: 0,
    shipmentQuantity: 0,
    unitPrice: costPrice ?? 0,
    producedQuantity: 0,
    stockedQuantity: 0
  })

  if (costPrice === undefined) {
    console.warn(`OEM 원가 미등록: SKU ${skuIdStr}`)
  }

  showSkuSelector.value = false
}

// 수정 모드 품목 삭제
const removeEditItem = (index: number) => {
  editForm.value.items.splice(index, 1)
}

// 수정 저장
const handleSaveEdit = async () => {
  // 유효성 검사
  const newErrors: Record<string, string> = {}
  if (!editForm.value.oemCompanyId) {
    newErrors.oemCompanyId = 'OEM 제조사를 선택하세요.'
  }
  errors.value = newErrors
  if (Object.keys(newErrors).length > 0) return

  if (editForm.value.items.length === 0) {
    alert('품목을 최소 1개 이상 추가하세요.')
    return
  }

  const zeroItems = editForm.value.items.filter(i => !i.quantity || i.quantity <= 0)
  if (zeroItems.length > 0) {
    alert('수량이 0인 품목이 있습니다. 수량을 입력하세요.')
    return
  }

  submitting.value = true
  try {
    const updateData: PurchaseOrderUpdateRequest = {
      oemCompanyId: editForm.value.oemCompanyId!,
      orderDate: editForm.value.orderDate || null,
      expectedCompletionDate: editForm.value.expectedCompletionDate || null,
      remarks: editForm.value.remarks || null,
      items: editForm.value.items.map(item => ({
        skuId: item.skuId,
        quantity: item.quantity,
        shipmentQuantity: item.shipmentQuantity || 0,
        unitPrice: item.unitPrice
      }))
    }

    await purchaseOrderService.updatePurchaseOrder(poId.value, updateData)
    alert('발주서가 수정되었습니다.')
    isEditMode.value = false
    await loadDetail()
  } catch (error: any) {
    console.error('발주서 수정 실패:', error)
    alert(error.message || '발주서 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 발주서 삭제
const handleDelete = async () => {
  // 연관 출하 영향 확인
  let confirmMsg = '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
  try {
    const impact = await purchaseOrderService.getRejectImpact(poId.value)
    if (impact.affectedShipments.length > 0) {
      const shipmentNos = impact.affectedShipments.map(s => s.shipmentNo).join(', ')
      confirmMsg = `이 발주서에 연결된 출하가 있습니다: ${shipmentNos}\n\n삭제하면 출하 연결이 해제됩니다. 정말 삭제하시겠습니까?`
    }
  } catch (error) {
    console.error('삭제 영향 분석 실패:', error)
  }

  if (!confirm(confirmMsg)) return

  submitting.value = true
  try {
    await purchaseOrderService.deletePurchaseOrder(poId.value)
    alert('발주서가 삭제되었습니다.')
    goToList()
  } catch (error: any) {
    console.error('발주서 삭제 실패:', error)
    alert(error.message || '발주서 삭제에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 발주서 발행
const handleIssue = async () => {
  if (!confirm('발주서를 발행하시겠습니까? 발행 후에는 품목 수정이 제한됩니다.')) return

  submitting.value = true
  try {
    await purchaseOrderService.issuePurchaseOrder(poId.value)
    alert('발주서가 발행되었습니다.')
    await loadDetail()
  } catch (error: any) {
    console.error('발주서 발행 실패:', error)
    alert(error.message || '발주서 발행에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 발주서 접수
const handleAccept = async () => {
  if (!confirm('발주서를 접수하시겠습니까?')) return

  submitting.value = true
  try {
    await purchaseOrderService.acceptPurchaseOrder(poId.value)
    alert('발주서가 접수되었습니다.')
    await loadDetail()
  } catch (error: any) {
    console.error('발주서 접수 실패:', error)
    alert(error.message || '발주서 접수에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 반려 모달 열기/닫기
const openRejectModal = async () => {
  rejectReason.value = ''
  rejectImpact.value = null
  showRejectModal.value = true

  // 반려 영향 분석 호출
  rejectImpactLoading.value = true
  try {
    rejectImpact.value = await purchaseOrderService.getRejectImpact(poId.value)
  } catch (error) {
    console.error('반려 영향 분석 실패:', error)
  } finally {
    rejectImpactLoading.value = false
  }
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectReason.value = ''
  rejectImpact.value = null
}

// 발주서 반려
const handleReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('반려 사유를 입력하세요.')
    return
  }

  submitting.value = true
  try {
    await purchaseOrderService.rejectPurchaseOrder(poId.value, rejectReason.value.trim())
    alert('발주서가 반려되었습니다.')
    showRejectModal.value = false
    rejectReason.value = ''
    await loadDetail()
  } catch (error: any) {
    console.error('발주서 반려 실패:', error)
    alert(error.message || '발주서 반려에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 생산완료 체크 모드 진입
const enterProduceMode = () => {
  if (!poDetail.value) return

  produceItems.value = poDetail.value.items.map(item => ({
    ...item,
    newProducedQuantity: item.producedQuantity || 0
  }))

  isProduceMode.value = true
}

// 생산완료 체크 모드 취소
const cancelProduceMode = () => {
  isProduceMode.value = false
  produceItems.value = []
}

// 생산완료 저장
const handleProduceComplete = async () => {
  // 수량 검증
  for (const item of produceItems.value) {
    if (item.newProducedQuantity < 0) {
      alert('생산완료 수량은 0 이상이어야 합니다.')
      return
    }
    if (item.newProducedQuantity > item.quantity) {
      alert(`생산완료 수량이 발주 수량(${formatQuantity(item.quantity)})을 초과할 수 없습니다. (SKU: ${item.skuId})`)
      return
    }
  }

  // 변경된 품목만 전송
  const changedItems = produceItems.value
    .filter(item => item.newProducedQuantity !== item.producedQuantity)
    .map(item => ({
      poiId: item.poiId,
      producedQuantity: item.newProducedQuantity
    }))

  if (changedItems.length === 0) {
    alert('변경된 생산완료 수량이 없습니다.')
    return
  }

  submitting.value = true
  try {
    const request: ProduceCompleteRequest = {
      items: changedItems
    }

    await purchaseOrderService.markProduced(poId.value, request)
    alert('생산완료 수량이 업데이트되었습니다.')
    isProduceMode.value = false
    produceItems.value = []
    await loadDetail()
  } catch (error: any) {
    console.error('생산완료 처리 실패:', error)
    alert(error.message || '생산완료 처리에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// ===== 생산 현황 관련 =====

// 전체 생산완료 수량 합계
const totalProduced = computed(() => {
  if (!poDetail.value) return 0
  return poDetail.value.items.reduce((sum, item) => sum + (item.producedQuantity || 0), 0)
})

// 전체 생산 진행률 (%)
const productionProgressPercent = computed(() => {
  if (!poDetail.value || poDetail.value.totalQuantity === 0) return 0
  const percent = (totalProduced.value / poDetail.value.totalQuantity) * 100
  return Math.round(percent * 10) / 10
})

// 품목별 생산율 텍스트
const getProductionRate = (produced: number | null, quantity: number | null): string => {
  if (!quantity || quantity === 0) return '-'
  const rate = ((produced || 0) / quantity) * 100
  return rate.toFixed(1) + '%'
}

// 품목별 생산율 CSS 클래스
const getProductionRateClass = (produced: number | null, quantity: number | null): string => {
  if (!quantity || quantity === 0) return ''
  const rate = ((produced || 0) / quantity) * 100
  if (rate >= 100) return 'rate-complete'
  if (rate > 0) return 'rate-progress'
  return 'rate-zero'
}

// PDF 다운로드
const handleDownloadPdf = async () => {
  pdfDownloading.value = true
  try {
    await purchaseOrderService.downloadPdf(poId.value)
  } catch (error: any) {
    console.error('PDF 다운로드 실패:', error)
    alert(error.message || '발주서 PDF 다운로드에 실패했습니다.')
  } finally {
    pdfDownloading.value = false
  }
}

// 목록으로 이동
const goToList = () => {
  const returnPage = route.query.returnPage
  if (returnPage) {
    router.push({ path: '/admin/purchase-order/list', query: { page: returnPage as string } })
  } else {
    router.push('/admin/purchase-order/list')
  }
}

// 초기 로드
onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
/*
 * 발주서 상세 페이지 스타일
 * 공통 스타일: admin-edit-register.css, admin-forms.css, admin-common.css
 */

.po-detail {
  padding: 0;
}

/* 발주서 정보 그리드 (3열) */
.po-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* 상태 배지 기본 스타일 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 상태 색상 */
.status-badge.bg-gray-100 {
  background-color: #f3f4f6;
}
.status-badge.text-gray-700 {
  color: #374151;
}

.status-badge.bg-blue-100 {
  background-color: #dbeafe;
}
.status-badge.text-blue-700 {
  color: #1d4ed8;
}

.status-badge.bg-yellow-100 {
  background-color: #fef3c7;
}
.status-badge.text-yellow-700 {
  color: #b45309;
}

.status-badge.bg-green-100 {
  background-color: #d1fae5;
}
.status-badge.text-green-700 {
  color: #047857;
}

.status-badge.bg-purple-100 {
  background-color: #ede9fe;
}
.status-badge.text-purple-700 {
  color: #6d28d9;
}

/* 비고 textarea */
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 60px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 폼 셀렉트 스타일 */
.form-select {
  width: 100%;
  height: 32px;
  padding: 0 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.form-select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 품목 추가 버튼 */
.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #059669;
}

/* 삭제 버튼 */
.btn-remove {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fee2e2;
}

/* 테이블 입력 필드 너비 */
.input-w75 {
  width: 75px !important;
}

/* 생산완료 입력 래퍼 */
.produce-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.produce-current {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.produce-col {
  min-width: 200px !important;
}

/* 발주수량으로 채우기 버튼 */
.btn-fill-quantity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #93c5fd;
  border-radius: 3px;
  font-size: 0.625rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-fill-quantity:hover:not(:disabled) {
  background: #2563eb;
  color: white;
}

.btn-fill-quantity:disabled {
  opacity: 0.3;
  cursor: default;
}

/* ===== 생산 현황 섹션 ===== */
.production-section-wrapper {
  padding: 0;
}

.production-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0.75rem 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1rem;
}

.production-section-header .header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.production-section-header .header-left i {
  color: #6366f1;
}

/* 생산 진행률 */
.production-progress {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.progress-amount {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-left: auto;
}

.progress-percent {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-low {
  background: #f59e0b;
}

.progress-mid {
  background: #3b82f6;
}

.progress-high {
  background: #10b981;
}

.progress-complete {
  background: #8b5cf6;
}

/* 생산율 컬럼 색상 */
.rate-complete {
  color: #047857;
  font-weight: 600;
}

.rate-progress {
  color: #2563eb;
  font-weight: 500;
}

.rate-zero {
  color: #9ca3af;
}

/* ACCEPTED 상태 색상 */
.status-badge.bg-teal-100 {
  background-color: #ccfbf1;
}
.status-badge.text-teal-700 {
  color: #0f766e;
}

/* REJECTED 상태 색상 */
.status-badge.bg-red-100 {
  background-color: #fee2e2;
}
.status-badge.text-red-700 {
  color: #b91c1c;
}

/* 접수 버튼 */
.btn-accept {
  background: #0d9488 !important;
  color: white !important;
  border-color: #0d9488 !important;
}
.btn-accept:hover {
  background: #0f766e !important;
}

/* 반려 버튼 */
.btn-reject {
  background: #ef4444 !important;
  color: white !important;
  border-color: #ef4444 !important;
}
.btn-reject:hover {
  background: #dc2626 !important;
}
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 반려 사유 표시 */
.reject-reason-display {
  color: #b91c1c !important;
  font-weight: 500;
}

/* 반려 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content.reject-modal {
  background: white;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body .form-group {
  margin-bottom: 0;
}

/* 반려 영향 분석 */
.reject-impact-loading {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.reject-impact-warning {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.impact-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.impact-header i {
  color: #f59e0b;
}

.impact-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.impact-list li {
  padding: 0.375rem 0;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
}

.impact-list li:last-child {
  border-bottom: none;
}

.shipment-no {
  font-weight: 600;
  color: #1f2937;
}

.impact-section-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
  padding-left: 0.25rem;
}

.impact-section-label.indirect {
  color: #92400e;
  margin-top: 0.75rem;
}

.impact-action.cancel {
  color: #dc2626;
  font-size: 0.8125rem;
}

.impact-action.warning {
  color: #92400e;
  font-size: 0.8125rem;
}

.impact-action.info {
  color: #2563eb;
  font-size: 0.8125rem;
}

.impact-summary {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #92400e;
  font-weight: 500;
}

.modal-body .form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.modal-body .required {
  color: #ef4444;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* 품목 테이블 헤더 단위 표시 */
.items-table thead th small {
  font-weight: 400;
  color: #6b7280;
  font-size: 0.7rem;
}

/* 반응형 */
@media (max-width: 1024px) {
  .po-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .po-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
