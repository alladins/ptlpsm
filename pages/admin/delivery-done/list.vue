<template>
  <div class="delivery-done-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품완료"
      description="발주별 납품완료를 관리하고 서명 URL을 발송합니다."
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch">
          <i class="fas fa-search"></i>
          검색
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 납품요구일자 -->
          <div class="search-item">
            <label>납품요구일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input" />
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input" />
          </div>

          <!-- 납품요구번호 -->
          <div class="search-item">
            <label>납품요구번호:</label>
            <input
              type="text"
              v-model="searchForm.deliveryRequestNo"
              placeholder="납품요구번호 검색"
              class="text-input"
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 계약번호 -->
          <div class="search-item">
            <label>계약번호:</label>
            <input
              type="text"
              v-model="searchForm.contractNo"
              placeholder="계약번호 검색"
              class="text-input"
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 상태 (DB 기반) -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="condition-select">
              <option value="">전체</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 리스트 테이블 섹션 -->
      <div class="list-section">
        <div class="list-header">
          <div class="list-info">
            <span>총 {{ totalElements }}건 중 {{ startIndex }}-{{ endIndex }}건 표시</span>
          </div>
          <div class="list-actions">
            <select v-model.number="pageSize" @change="handlePageSizeChange" class="page-size-select">
              <option :value="10">10개씩</option>
              <option :value="20">20개씩</option>
              <option :value="50">50개씩</option>
            </select>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 데이터가 없을 때 -->
        <div v-else-if="deliveryDoneList.length === 0" class="no-data-message">
          <i class="fas fa-file-contract"></i>
          <p>등록된 납품완료계가 없습니다.</p>
        </div>

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 12%;">납품요구번호</th>
                <th style="width: 16%;">수요기관</th>
                <th style="width: 20%;">사업명</th>
                <th style="width: 12%;">시공사</th>
                <th style="width: 9%;">납품률</th>
                <th style="width: 7%;">출하횟수</th>
                <th style="width: 9%;">상태</th>
                <th style="width: 10%;">문자발송</th>
                <th style="width: 5%;">문서보기</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in deliveryDoneList" :key="item.deliveryDoneId">
                <!-- 납품요구번호 -->
                <td>{{ item.deliveryRequestNo }}</td>

                <!-- 수요기관 -->
                <td class="text-left">{{ item.client }}</td>

                <!-- 사업명 -->
                <td class="text-left truncate" :title="item.projectName">
                  {{ item.projectName }}
                </td>

                <!-- 시공사 -->
                <td class="text-left truncate" :title="item.contractorCompanyName">
                  {{ item.contractorCompanyName }}
                </td>

                <!-- 납품률 -->
                <td>
                  <div class="delivery-rate-bar-container">
                    <div class="delivery-rate-bar">
                      <div
                        class="delivery-rate-fill"
                        :style="{ width: item.deliveryCompletionRate + '%' }"
                        :class="getRateClass(item.deliveryCompletionRate)"
                      ></div>
                    </div>
                    <span class="delivery-rate-text">{{ item.deliveryCompletionRate }}%</span>
                  </div>
                </td>

                <!-- 출하횟수 -->
                <td class="text-center">{{ item.totalDeliveryCount }}회</td>

                <!-- 상태 -->
                <td>
                  <span class="status-badge" :class="getStatusBadgeClass(item.status)">
                    {{ getStatusLabelWithFallback(item.status) }}
                  </span>
                </td>

                <!-- 문자발송: 납품확인서 + 납품완료계 -->
                <td>
                  <div class="message-buttons">
                    <!-- 납품확인서 메시지 (현장소장 + 감리원 서명 요청) -->
                    <button
                      @click.stop="openConfirmationMessageModal(item)"
                      class="btn-message btn-primary"
                      :disabled="!canSendConfirmationMessage(item)"
                      :title="canSendConfirmationMessage(item)
                        ? '납품확인서 서명 URL 발송 (현장소장 + 감리원)'
                        : '서명 대기 상태에서만 가능합니다'"
                    >
                      <i class="fas fa-file-signature"></i>
                      <span>확인서</span>
                    </button>

                    <!-- 납품완료계 메시지 (감리원 서명 요청) -->
                    <button
                      @click.stop="openCompletionMessageModal(item)"
                      class="btn-message btn-info"
                      :disabled="!canSendCompletionMessage(item)"
                      :title="canSendCompletionMessage(item)
                        ? '납품완료계 서명 URL 발송 (감리원)'
                        : '납품확인서 서명 완료 후 가능합니다'"
                    >
                      <i class="fas fa-clipboard-check"></i>
                      <span>완료계</span>
                    </button>
                  </div>
                </td>

                <!-- 문서보기: PDF -->
                <td>
                  <button
                    @click.stop="openPdfModal(item)"
                    class="btn-pdf btn-success"
                    :disabled="!canDownloadPdf(item.status)"
                    :title="canDownloadPdf(item.status)
                      ? 'PDF 다운로드 (납품확인서, 납품완료계, 사진대지)'
                      : '완료 또는 제출 상태에서만 가능합니다'"
                  >
                    <i class="fas fa-file-pdf"></i>
                    <span>PDF</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <Pagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 납품확인서 메시지 모달 (현장소장 + 감리원) -->
    <MessageSendModal
      v-if="showConfirmationMessageModal && selectedConfirmationItem"
      :delivery-done="selectedConfirmationItem"
      document-type="CONFIRMATION"
      @close="closeConfirmationMessageModal"
      @sent="handleMessageSent"
    />

    <!-- 납품완료계 메시지 모달 (감리원만) -->
    <MessageSendModal
      v-if="showCompletionMessageModal && selectedCompletionItem"
      :delivery-done="selectedCompletionItem"
      document-type="COMPLETION"
      @close="closeCompletionMessageModal"
      @sent="handleMessageSent"
    />

    <!-- PDF 다운로드 모달 -->
    <PdfDownloadModal
      v-if="showPdfModal && selectedItem"
      :delivery-done="selectedItem"
      @close="closePdfModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from '#imports'
import {
  getDeliveryDoneList,
  canDownloadPdf
} from '~/services/delivery-done.service'
import type {
  DeliveryDoneListItem,
  DeliveryDoneSearchParams,
  DeliveryDoneStatus
} from '~/types/delivery-done'
import { formatDate } from '~/utils/format'
import { useCommonStatus } from '~/composables/useCommonStatus'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품완료계 관리'
})

const router = useRouter()

// DB 기반 상태 관리
const { statusOptions, loadStatusCodes, getStatusLabel, getStatusClass: getStatusBadgeClass } = useCommonStatus()

// 상태 한글 변환 (DB 실패 시 로컬 fallback)
const statusLabelMap: Record<string, string> = {
  'PENDING': '대기',
  'IN_PROGRESS': '진행중',
  'PENDING_SIGNATURE': '서명대기',
  'COMPLETED': '완료',
  'SUBMITTED': '제출완료'
}

const getStatusLabelWithFallback = (status: string): string => {
  const dbLabel = getStatusLabel(status)
  // DB 조회 성공 시 (한글) 반환, 실패 시 로컬 매핑 사용
  return dbLabel !== status ? dbLabel : (statusLabelMap[status] || status)
}

// 오늘 날짜 (로컬 시간 기준 - UTC 시간대 문제 해결)
const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 3개월 전 날짜 계산 (로컬 시간 기준)
const getThreeMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 검색 폼 (기본값: 최근 3개월)
const searchForm = ref<DeliveryDoneSearchParams>({
  startDate: getThreeMonthsAgo(),
  endDate: getTodayDate(),
  deliveryRequestNo: '',
  contractNo: '',
  client: '',
  status: undefined,
  page: 0,
  size: 20,
  sort: 'deliveryRequestDate,desc'
})

// 상태 관리
const loading = ref(false)
const deliveryDoneList = ref<DeliveryDoneListItem[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

// 모달 상태
const showConfirmationMessageModal = ref(false)  // 납품확인서 메시지 모달
const showCompletionMessageModal = ref(false)    // 납품완료계 메시지 모달
const showPdfModal = ref(false)
const selectedConfirmationItem = ref<DeliveryDoneListItem | null>(null)
const selectedCompletionItem = ref<DeliveryDoneListItem | null>(null)
const selectedItem = ref<DeliveryDoneListItem | null>(null)  // PDF용

// 계산된 값
const startIndex = computed(() => {
  if (totalElements.value === 0) return 0
  return currentPage.value * pageSize.value + 1
})

const endIndex = computed(() => {
  const end = (currentPage.value + 1) * pageSize.value
  return Math.min(end, totalElements.value)
})

// 데이터 로드
async function loadData() {
  loading.value = true
  try {
    const params: DeliveryDoneSearchParams = {
      ...searchForm.value,
      page: currentPage.value,
      size: pageSize.value
    }

    const response = await getDeliveryDoneList(params)
    deliveryDoneList.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
  } catch (error) {
    console.error('Failed to load delivery done list:', error)
    alert('납품완료계 목록을 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

// 검색
function handleSearch() {
  currentPage.value = 0
  loadData()
}

// 초기화
function handleReset() {
  searchForm.value = {
    startDate: getThreeMonthsAgo(),
    endDate: getTodayDate(),
    deliveryRequestNo: '',
    contractNo: '',
    client: '',
    status: undefined,
    page: 0,
    size: 20,
    sort: 'deliveryRequestDate,desc'
  }
  handleSearch()
}

// 페이지 변경
function handlePageChange(page: number) {
  currentPage.value = page
  loadData()
}

// 페이지 크기 변경
function handlePageSizeChange() {
  searchForm.value.size = pageSize.value
  currentPage.value = 0
  loadData()
}

// 납품률 클래스
function getRateClass(rate: number): string {
  if (rate === 100) return 'rate-complete'
  if (rate >= 80) return 'rate-high'
  if (rate >= 50) return 'rate-medium'
  return 'rate-low'
}

// 납품확인서 메시지 모달 (현장소장 + 감리원)
function openConfirmationMessageModal(item: DeliveryDoneListItem) {
  selectedConfirmationItem.value = item
  showConfirmationMessageModal.value = true
}

function closeConfirmationMessageModal() {
  showConfirmationMessageModal.value = false
  selectedConfirmationItem.value = null
}

// 납품완료계 메시지 모달 (감리원만)
function openCompletionMessageModal(item: DeliveryDoneListItem) {
  selectedCompletionItem.value = item
  showCompletionMessageModal.value = true
}

function closeCompletionMessageModal() {
  showCompletionMessageModal.value = false
  selectedCompletionItem.value = null
}

// 메시지 발송 성공 핸들러 (공통)
function handleMessageSent() {
  closeConfirmationMessageModal()
  closeCompletionMessageModal()
  loadData()
}

// PDF 다운로드 모달 열기
function openPdfModal(item: DeliveryDoneListItem) {
  selectedItem.value = item
  showPdfModal.value = true
}

function closePdfModal() {
  showPdfModal.value = false
  selectedItem.value = null
}

// 버튼 활성화 조건 (상호 배타적)
function canSendConfirmationMessage(item: DeliveryDoneListItem): boolean {
  // 납품확인서: 서명대기 상태 AND 서명 미완료
  return item.status === 'PENDING_SIGNATURE' &&
         !(item.hasManagerSignature && item.hasInspectorSignature)
}

function canSendCompletionMessage(item: DeliveryDoneListItem): boolean {
  // 납품완료계: 서명 완료 AND 아직 최종 완료 아님 (중복 발송 방지)
  return item.hasManagerSignature &&
         item.hasInspectorSignature &&
         item.status !== 'COMPLETED' &&
         item.status !== 'SUBMITTED'
}

// 초기 로드
onMounted(async () => {
  await loadStatusCodes()  // 상태 코드 먼저 로드
  loadData()
})
</script>

<style scoped>
.delivery-done-list {
  padding: 20px;
}

/* 검색 섹션 */
.search-section-compact {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-row-single {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-item label {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.date-input,
.text-input,
.condition-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-input {
  width: 140px;
}

.text-input {
  width: 180px;
}

.condition-select {
  width: 120px;
}

.separator {
  color: #999;
  font-size: 14px;
}

/* 리스트 섹션 */
.list-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

.list-info {
  font-size: 14px;
  color: #666;
}

.page-size-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 8px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.data-table td {
  font-size: 13px;
  color: #4b5563;
}

.data-table .text-left {
  text-align: left;
}

.data-table .text-center {
  text-align: center;
}

.truncate {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-primary {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.link-primary:hover {
  text-decoration: underline;
}

/* 납품률 바 */
.delivery-rate-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.delivery-rate-bar {
  flex: 1;
  height: 20px;
  background-color: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.delivery-rate-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.rate-complete {
  background-color: #10b981;
}

.rate-high {
  background-color: #3b82f6;
}

.rate-medium {
  background-color: #f59e0b;
}

.rate-low {
  background-color: #ef4444;
}

.delivery-rate-text {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
  text-align: right;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background-color: #e5e7eb;
  color: #6b7280;
}

.status-in-progress {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-pending-signature {
  background-color: #fef3c7;
  color: #d97706;
}

.status-completed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-submitted {
  background-color: #e0e7ff;
  color: #4338ca;
}

/* 서명현황 */
.signature-status {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.signature-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.text-success {
  color: #10b981;
}

.text-muted {
  color: #9ca3af;
}

/* 문자발송 버튼 그룹 (2개 버튼 가로 배치) */
.message-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

/* 문자발송 버튼 스타일 (확인서, 완료계) */
.btn-message {
  flex: 1;
  padding: 0.5rem 0.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  white-space: nowrap;
  min-width: 0;
}

.btn-message i {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.btn-message span {
  font-size: 0.75rem;
}

.btn-message:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-message:active:not(:disabled) {
  transform: translateY(0);
}

/* PDF 버튼 스타일 */
.btn-pdf {
  width: 100%;
  padding: 0.5rem 0.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.btn-pdf i {
  font-size: 0.875rem;
}

.btn-pdf span {
  font-size: 0.75rem;
}

.btn-pdf:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-pdf:active:not(:disabled) {
  transform: translateY(0);
}

/* 버튼 색상 */
.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-info {
  background-color: #0ea5e9;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: #0284c7;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

/* 비활성화된 버튼 */
.btn-message:disabled,
.btn-pdf:disabled {
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-message:disabled:hover,
.btn-pdf:disabled:hover {
  transform: none;
  opacity: 0.6;
}

/* 메시지 */
.loading-message,
.no-data-message {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.loading-message i,
.no-data-message i {
  font-size: 48px;
  margin-bottom: 15px;
}

.loading-message p,
.no-data-message p {
  font-size: 16px;
  margin: 0;
}
</style>
