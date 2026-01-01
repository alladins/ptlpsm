<template>
  <div class="bank-account">
    <PageHeader
      title="계좌조회"
      description="등록된 계좌 정보와 입출금 내역을 조회합니다."
    >
      <template #actions>
        <button class="btn-action" @click="loadAccounts">
          <i class="fas fa-sync-alt"></i>
          새로고침
        </button>
      </template>
    </PageHeader>

    <!-- 계좌 목록 섹션 -->
    <div class="content-section">
      <div class="section-header">
        <h3>계좌 목록</h3>
        <div class="header-actions">
          <label class="checkbox-label">
            <input type="checkbox" v-model="availOnlyChecked" @change="loadAccounts" />
            유효계좌만 조회
          </label>
        </div>
      </div>

      <!-- 로딩 -->
      <div v-if="accountsLoading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <span>계좌 정보를 불러오는 중...</span>
      </div>

      <!-- 에러 -->
      <div v-else-if="accountsError" class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ accountsError }}</span>
        <button class="btn-retry" @click="loadAccounts">다시 시도</button>
      </div>

      <!-- 계좌 목록 테이블 -->
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 100px">은행</th>
              <th style="width: 150px">계좌번호</th>
              <th style="width: 100px">유형</th>
              <th style="width: 150px">별칭</th>
              <th style="width: 120px" class="text-right">잔액</th>
              <th style="width: 80px" class="text-center">상태</th>
              <th style="width: 100px">수집주기</th>
              <th style="width: 100px" class="text-center">마지막수집</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="accounts.length === 0">
              <td colspan="8" class="empty-row">등록된 계좌가 없습니다.</td>
            </tr>
            <tr
              v-for="account in accounts"
              :key="account.bankAccountNum"
              :class="{ selected: selectedAccount?.bankAccountNum === account.bankAccountNum }"
              @click="selectAccount(account)"
              class="clickable-row"
            >
              <td>{{ account.bankName }}</td>
              <td>{{ account.bankAccountNumMasked }}</td>
              <td>{{ account.bankAccountTypeName }}</td>
              <td>{{ account.alias || '-' }}</td>
              <td class="text-right">{{ formatCurrency(account.balance) }}</td>
              <td class="text-center">
                <span class="status-badge" :class="getStatusClass(account.status)">
                  {{ account.status }}
                </span>
              </td>
              <td>{{ account.collectCycleName }}</td>
              <td class="text-center">{{ account.lastCollectDate || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 거래내역 섹션 (계좌 선택 시 표시) -->
    <div v-if="selectedAccount" class="content-section">
      <div class="section-header">
        <h3>
          <i class="fas fa-exchange-alt"></i>
          거래내역
          <span class="selected-account-info">
            {{ selectedAccount.bankName }} {{ selectedAccount.bankAccountNum }}
            <template v-if="selectedAccount.alias">({{ selectedAccount.alias }})</template>
          </span>
        </h3>
      </div>

      <!-- 거래내역 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>기간:</label>
            <input type="date" v-model="transSearchForm.startDate" class="date-input" />
            <span class="separator">~</span>
            <input type="date" v-model="transSearchForm.endDate" class="date-input" />
          </div>
          <div class="search-item">
            <label>구분:</label>
            <select v-model="transSearchForm.transDirection" class="form-select-sm">
              <option v-for="opt in TRANS_DIRECTION_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>정렬:</label>
            <select v-model="transSearchForm.orderDirection" class="form-select-sm">
              <option v-for="opt in ORDER_DIRECTION_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="search-buttons">
            <button class="btn-search" @click="loadTransactions">
              <i class="fas fa-search"></i>
              조회
            </button>
            <button class="btn-secondary-sm" @click="resetTransSearch">
              <i class="fas fa-undo"></i>
              초기화
            </button>
          </div>
        </div>
      </div>

      <!-- 거래내역 로딩 -->
      <div v-if="transLoading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <span>거래내역을 불러오는 중...</span>
      </div>

      <!-- 거래내역 에러 -->
      <div v-else-if="transError" class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ transError }}</span>
        <button class="btn-retry" @click="loadTransactions">다시 시도</button>
      </div>

      <!-- 거래내역 테이블 -->
      <div v-else class="table-wrapper">
        <div class="table-header">
          <span>총 {{ transData.totalCount }}건</span>
          <select v-model="transSearchForm.size" @change="loadTransactions" class="page-size-select">
            <option :value="10">10건</option>
            <option :value="20">20건</option>
            <option :value="50">50건</option>
          </select>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 150px" class="text-center">거래일시</th>
              <th style="width: 60px" class="text-center">구분</th>
              <th style="width: 120px" class="text-right">금액</th>
              <th style="width: 120px" class="text-right">잔액</th>
              <th style="width: 150px">거래처</th>
              <th style="width: 200px">적요</th>
              <th style="width: 150px">메모</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="transData.transactions.length === 0">
              <td colspan="7" class="empty-row">거래내역이 없습니다.</td>
            </tr>
            <tr v-for="trans in transData.transactions" :key="trans.transRefKey">
              <td class="text-center">{{ trans.transDateTime }}</td>
              <td class="text-center">
                <span class="trans-type" :class="getTransTypeClass(trans.transTypeCode)">
                  {{ trans.transType }}
                </span>
              </td>
              <td class="text-right" :class="getAmountClass(trans.transTypeCode)">
                {{ formatCurrency(trans.amount) }}
              </td>
              <td class="text-right">{{ formatCurrency(trans.balance) }}</td>
              <td>{{ trans.counterpartName || '-' }}</td>
              <td>{{ trans.description || '-' }}</td>
              <td>{{ trans.memo || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 페이지네이션 -->
        <div v-if="transData.totalPages > 1" class="pagination-wrapper">
          <Pagination
            :current-page="transData.currentPage"
            :total-pages="transData.totalPages"
            @change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 계좌 미선택 안내 -->
    <div v-else class="content-section empty-section">
      <div class="empty-message">
        <i class="fas fa-hand-pointer"></i>
        <p>계좌를 선택하면 거래내역을 조회할 수 있습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { bankAccountService } from '~/services/bank-account.service'
import { formatCurrency } from '~/utils/format'
import type { BankAccount, Transaction, TransactionResponse } from '~/types/bank-account'
import {
  TRANS_DIRECTION_OPTIONS,
  ORDER_DIRECTION_OPTIONS,
  BANK_ERROR_MESSAGES
} from '~/types/bank-account'

definePageMeta({
  layout: 'admin',
  pageTitle: '계좌 조회'
})

// 계좌 목록 상태
const accounts = ref<BankAccount[]>([])
const accountsLoading = ref(false)
const accountsError = ref<string | null>(null)
const availOnlyChecked = ref(true)
const selectedAccount = ref<BankAccount | null>(null)

// 거래내역 상태
const transLoading = ref(false)
const transError = ref<string | null>(null)
const transData = reactive<TransactionResponse>({
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  pageSize: 20,
  transactions: []
})

// 거래내역 검색 폼
const transSearchForm = reactive({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  transDirection: 1,
  orderDirection: 2,
  page: 1,
  size: 20
})

// 기본 시작일 (7일 전)
function getDefaultStartDate(): string {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return formatDateForInput(date)
}

// 기본 종료일 (오늘)
function getDefaultEndDate(): string {
  return formatDateForInput(new Date())
}

// 날짜를 input용 문자열로 변환
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 날짜를 API용 문자열로 변환 (YYYYMMDD)
function formatDateForApi(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

// 계좌 목록 조회
async function loadAccounts() {
  accountsLoading.value = true
  accountsError.value = null

  try {
    const response = await bankAccountService.getAccounts(availOnlyChecked.value ? 1 : 0)

    if (response.success) {
      accounts.value = response.data
      // 선택된 계좌가 목록에 없으면 선택 해제
      if (selectedAccount.value) {
        const found = accounts.value.find(
          a => a.bankAccountNum === selectedAccount.value?.bankAccountNum
        )
        if (!found) {
          selectedAccount.value = null
        }
      }
    } else {
      const errorMsg = response.errorCode
        ? BANK_ERROR_MESSAGES[response.errorCode] || response.message
        : response.message
      accountsError.value = errorMsg || '계좌 목록을 불러올 수 없습니다.'
    }
  } catch (error) {
    console.error('계좌 목록 조회 실패:', error)
    accountsError.value = '계좌 목록을 불러올 수 없습니다.'
  } finally {
    accountsLoading.value = false
  }
}

// 계좌 선택
function selectAccount(account: BankAccount) {
  selectedAccount.value = account
  resetTransSearch()
  loadTransactions()
}

// 거래내역 조회
async function loadTransactions() {
  if (!selectedAccount.value) return

  transLoading.value = true
  transError.value = null

  try {
    const response = await bankAccountService.getTransactions(
      selectedAccount.value.bankAccountNum,
      {
        startDate: formatDateForApi(transSearchForm.startDate),
        endDate: formatDateForApi(transSearchForm.endDate),
        transDirection: transSearchForm.transDirection,
        orderDirection: transSearchForm.orderDirection,
        page: transSearchForm.page,
        size: transSearchForm.size
      }
    )

    if (response.success) {
      Object.assign(transData, response.data)
    } else {
      const errorMsg = response.errorCode
        ? BANK_ERROR_MESSAGES[response.errorCode] || response.message
        : response.message
      transError.value = errorMsg || '거래내역을 불러올 수 없습니다.'
    }
  } catch (error) {
    console.error('거래내역 조회 실패:', error)
    transError.value = '거래내역을 불러올 수 없습니다.'
  } finally {
    transLoading.value = false
  }
}

// 거래내역 검색 초기화
function resetTransSearch() {
  transSearchForm.startDate = getDefaultStartDate()
  transSearchForm.endDate = getDefaultEndDate()
  transSearchForm.transDirection = 1
  transSearchForm.orderDirection = 2
  transSearchForm.page = 1
  transSearchForm.size = 20
}

// 페이지 변경
function handlePageChange(page: number) {
  transSearchForm.page = page
  loadTransactions()
}

// 상태 클래스
function getStatusClass(status: string): string {
  return status === '정상' ? 'status-active' : 'status-inactive'
}

// 거래 유형 클래스
function getTransTypeClass(typeCode: string): string {
  return typeCode === '2' ? 'trans-in' : 'trans-out'
}

// 금액 클래스
function getAmountClass(typeCode: string): string {
  return typeCode === '2' ? 'amount-in' : 'amount-out'
}

// 초기 로드
onMounted(() => {
  loadAccounts()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

.bank-account {
  padding: 0;
}

.content-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selected-account-info {
  font-weight: 400;
  color: #6b7280;
  font-size: 0.875rem;
  margin-left: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 테이블 */
.table-wrapper {
  overflow-x: auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
}

.page-size-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
}

.data-table td {
  font-size: 0.875rem;
  color: #374151;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.clickable-row:hover {
  background: #f3f4f6;
}

.clickable-row.selected {
  background: #eff6ff;
}

.text-right {
  text-align: right !important;
}

.text-center {
  text-align: center !important;
}

.empty-row {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* 거래 유형 */
.trans-type {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.trans-in {
  background: #dbeafe;
  color: #1d4ed8;
}

.trans-out {
  background: #fee2e2;
  color: #dc2626;
}

/* 금액 색상 */
.amount-in {
  color: #2563eb;
  font-weight: 500;
}

.amount-out {
  color: #dc2626;
  font-weight: 500;
}

/* 로딩/에러 상태 */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
}

.btn-retry {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  margin-left: 1rem;
}

.btn-retry:hover {
  background: #e5e7eb;
}

/* 빈 섹션 */
.empty-section {
  padding: 3rem;
}

.empty-message {
  text-align: center;
  color: #9ca3af;
}

.empty-message i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.empty-message p {
  font-size: 0.875rem;
  margin: 0;
}

/* 검색 영역 */
.search-section-compact {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-row-single {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-item label {
  font-size: 0.875rem;
  color: #374151;
  white-space: nowrap;
}

.date-input {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 140px;
}

.separator {
  color: #9ca3af;
}

.form-select-sm {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 100px;
}

.search-buttons {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.btn-search {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-search:hover {
  background: #1d4ed8;
}

.btn-secondary-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-secondary-sm:hover {
  background: #f3f4f6;
}

/* 페이지네이션 */
.pagination-wrapper {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
}

/* 반응형 */
@media (max-width: 768px) {
  .search-row-single {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    flex-wrap: wrap;
  }

  .search-buttons {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .date-input {
    width: 100%;
  }
}
</style>
