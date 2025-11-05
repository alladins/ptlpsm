<template>
  <div class="delivery-done-list">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="납품완료계 관리"
      description="발주별 납품완료계를 관리하고 서명 URL을 발송합니다."
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch">
          <i class="fas fa-search"></i>
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo"></i>
          초기화
        </button>
      </template>
    </UiPageHeader>

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
                <th style="width: 8%;">납품요구번호</th>
                <th style="width: 8%;">계약번호</th>
                <th style="width: 15%;">수요기관</th>
                <th style="width: 15%;">사업명</th>
                <th style="width: 8%;">시공사</th>
                <th style="width: 6%;">납품률</th>
                <th style="width: 6%;">출하횟수</th>
                <th style="width: 8%;">상태</th>
                <th style="width: 10%;">서명현황</th>
                <th style="width: 8%;">납품요구일자</th>
                <th style="width: 8%;">액션</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in deliveryDoneList" :key="item.deliveryDoneId">
                <!-- 납품요구번호 -->
                <td>
                  <a
                    href="#"
                    @click.prevent="goToDetail(item.deliveryDoneId)"
                    class="link-primary"
                  >
                    {{ item.deliveryRequestNo }}
                  </a>
                </td>

                <!-- 계약번호 -->
                <td>{{ item.contractNo }}</td>

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
                        :style="{ width: item.deliveryRate + '%' }"
                        :class="getRateClass(item.deliveryRate)"
                      ></div>
                    </div>
                    <span class="delivery-rate-text">{{ item.deliveryRate }}%</span>
                  </div>
                </td>

                <!-- 출하횟수 -->
                <td class="text-center">{{ item.totalDeliveryCount }}회</td>

                <!-- 상태 -->
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ getStatusText(item.status) }}
                  </span>
                </td>

                <!-- 서명현황 -->
                <td>
                  <div class="signature-status">
                    <div class="signature-item">
                      <i
                        class="fas fa-stamp"
                        :class="item.hasContractorSignature ? 'text-success' : 'text-muted'"
                      ></i>
                      <span :class="item.hasContractorSignature ? 'text-success' : 'text-muted'">
                        시공사
                      </span>
                    </div>
                    <div class="signature-item">
                      <i
                        class="fas fa-signature"
                        :class="item.hasSupervisorSignature ? 'text-success' : 'text-muted'"
                      ></i>
                      <span :class="item.hasSupervisorSignature ? 'text-success' : 'text-muted'">
                        감리원
                      </span>
                    </div>
                  </div>
                </td>

                <!-- 납품요구일자 -->
                <td>{{ formatDate(item.deliveryRequestDate) }}</td>

                <!-- 액션 -->
                <td>
                  <div class="action-buttons">
                    <!-- 메시지 발송 버튼 (PENDING_SIGNATURE 상태에서만 활성화) -->
                    <button
                      v-if="canSendMessage(item.status)"
                      @click="openMessageModal(item)"
                      class="btn-icon btn-primary"
                      title="서명 URL 발송"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>

                    <!-- PDF 다운로드 버튼 (COMPLETED, SUBMITTED 상태에서만) -->
                    <button
                      v-if="canDownloadPdf(item.status)"
                      @click="openPdfModal(item)"
                      class="btn-icon btn-success"
                      title="PDF 다운로드"
                    >
                      <i class="fas fa-file-pdf"></i>
                    </button>

                    <!-- 조달청 제출 버튼 (COMPLETED 상태에서만) -->
                    <button
                      v-if="canSubmitToNara(item.status)"
                      @click="openSubmitModal(item)"
                      class="btn-icon btn-warning"
                      title="조달청 제출"
                    >
                      <i class="fas fa-upload"></i>
                    </button>

                    <!-- 상세보기 버튼 (항상 표시) -->
                    <button
                      @click="goToDetail(item.deliveryDoneId)"
                      class="btn-icon btn-secondary"
                      title="상세보기"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <UiPagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 메시지 발송 모달 -->
    <MessageSendModal
      v-if="showMessageModal"
      :delivery-done="selectedItem"
      @close="closeMessageModal"
      @sent="handleMessageSent"
    />

    <!-- PDF 다운로드 모달 -->
    <PdfDownloadModal
      v-if="showPdfModal"
      :delivery-done="selectedItem"
      @close="closePdfModal"
    />

    <!-- 조달청 제출 모달 -->
    <SubmitToNaraModal
      v-if="showSubmitModal"
      :delivery-done="selectedItem"
      @close="closeSubmitModal"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from '#imports'
import {
  getDeliveryDoneList,
  getStatusText,
  getStatusClass,
  canSendMessage,
  canDownloadPdf,
  canSubmitToNara
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
const { statusOptions, loadStatusCodes } = useCommonStatus()

// 1개월 전 날짜 계산
const getOneMonthAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

// 검색 폼
const searchForm = ref<DeliveryDoneSearchParams>({
  startDate: getOneMonthAgo(),
  endDate: new Date().toISOString().split('T')[0],
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
const showMessageModal = ref(false)
const showPdfModal = ref(false)
const showSubmitModal = ref(false)
const selectedItem = ref<DeliveryDoneListItem | null>(null)

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
    startDate: getOneMonthAgo(),
    endDate: new Date().toISOString().split('T')[0],
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

// 상세 페이지 이동
function goToDetail(deliveryDoneId: number) {
  router.push(`/admin/delivery-done/detail/${deliveryDoneId}`)
}

// 납품률 클래스
function getRateClass(rate: number): string {
  if (rate === 100) return 'rate-complete'
  if (rate >= 80) return 'rate-high'
  if (rate >= 50) return 'rate-medium'
  return 'rate-low'
}

// 메시지 발송 모달 열기
function openMessageModal(item: DeliveryDoneListItem) {
  selectedItem.value = item
  showMessageModal.value = true
}

function closeMessageModal() {
  showMessageModal.value = false
  selectedItem.value = null
}

function handleMessageSent() {
  closeMessageModal()
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

// 조달청 제출 모달 열기
function openSubmitModal(item: DeliveryDoneListItem) {
  selectedItem.value = item
  showSubmitModal.value = true
}

function closeSubmitModal() {
  showSubmitModal.value = false
  selectedItem.value = null
}

function handleSubmitted() {
  closeSubmitModal()
  loadData()
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

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.btn-icon {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  opacity: 0.8;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
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
