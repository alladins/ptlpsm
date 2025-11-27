<template>
  <div class="company-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="회사 정보"
      description="회사 정보를 조회하고 관리합니다."
    >
      <template #actions>
        <button class="btn-action" @click="handleSearch" :disabled="loading">
          <i class="fas fa-search"></i>
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo"></i>
          초기화
        </button>
        <button class="btn-action btn-success" @click="goToRegister">
          <i class="fas fa-plus"></i>
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 섹션 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 회사명 -->
          <div class="search-item">
            <label>회사명:</label>
            <input
              type="text"
              v-model="searchForm.companyName"
              placeholder="회사명 검색"
              class="text-input"
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 사업자등록번호 -->
          <div class="search-item">
            <label>사업자등록번호:</label>
            <input
              type="text"
              v-model="searchForm.businessNo"
              placeholder="사업자등록번호 검색"
              class="text-input"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
      </div>

      <!-- 리스트 테이블 섹션 -->
      <div class="list-section">
        <div class="list-header">
          <div class="list-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
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
        <div v-else-if="companyList.length === 0" class="no-data-message">
          <i class="fas fa-building"></i>
          <p>등록된 회사 정보가 없습니다.</p>
        </div>

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">NO</th>
                <th style="width: 18%;">회사명</th>
                <th style="width: 14%;">사업자등록번호</th>
                <th style="width: 12%;">대표자명</th>
                <th style="width: 13%;">전화번호</th>
                <th style="width: 18%;">이메일</th>
                <th style="width: 12%;">설립일자</th>
                <th style="width: 8%;">직원수</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in companyList" :key="item.id" class="table-row" @click="goToEdit(item.id)" style="cursor: pointer;">
                <td>{{ startIndex + index }}</td>
                <td>{{ item.companyName }}</td>
                <td>{{ item.businessNumber }}</td>
                <td>{{ item.representative }}</td>
                <td>{{ item.tel }}</td>
                <td>{{ item.email }}</td>
                <td>{{ formatDate(item.establishedDate) }}</td>
                <td class="text-center">{{ item.employeeCount }}명</td>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from '#imports'
import { companyService } from '~/services/company.service'
import type { CompanyInfoResponse } from '~/types/company'
import { formatDate } from '~/utils/format'

definePageMeta({
  layout: 'admin',
  pageTitle: '회사 정보'
})

const router = useRouter()

// 검색 폼
const searchForm = ref({
  companyName: '',
  businessNo: ''
})

// 상태 관리
const loading = ref(false)
const companyList = ref<CompanyInfoResponse[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

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
    // 현재는 전체 조회만 지원 (향후 검색 API 추가 필요)
    const response = await companyService.getCompanies()

    // 클라이언트 사이드 필터링
    let filtered = response
    if (searchForm.value.companyName) {
      filtered = filtered.filter(c =>
        c.companyName.toLowerCase().includes(searchForm.value.companyName.toLowerCase())
      )
    }
    if (searchForm.value.businessNo) {
      filtered = filtered.filter(c =>
        c.businessNumber?.includes(searchForm.value.businessNo)
      )
    }

    // 클라이언트 사이드 페이지네이션
    totalElements.value = filtered.length
    totalPages.value = Math.ceil(filtered.length / pageSize.value)
    const start = currentPage.value * pageSize.value
    const end = start + pageSize.value
    companyList.value = filtered.slice(start, end)
  } catch (error) {
    console.error('Failed to load company list:', error)
    alert('회사 목록을 불러오는 중 오류가 발생했습니다.')
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
    companyName: '',
    businessNo: ''
  }
  currentPage.value = 0
  loadData()
}

// 페이지 변경
function handlePageChange(page: number) {
  currentPage.value = page
  loadData()
}

// 페이지 크기 변경
function handlePageSizeChange() {
  currentPage.value = 0
  loadData()
}

// 페이지 이동
function goToRegister() {
  router.push('/admin/basic-info/company/register')
}

function goToEdit(id: number) {
  router.push(`/admin/basic-info/company/edit/${id}`)
}

// 초기 로드
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.company-list {
  padding: 20px;
}

/* 헤더 버튼 */
.btn-action {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3b82f6;
  color: white;
}

.btn-action:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-action:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-action.btn-primary {
  background-color: #3b82f6;
}

.btn-action.btn-primary:hover {
  background-color: #2563eb;
}

.btn-action.btn-secondary {
  background-color: #6b7280;
}

.btn-action.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-action.btn-success {
  background-color: #10b981;
}

.btn-action.btn-success:hover {
  background-color: #059669;
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

.text-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
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

.data-table .text-center {
  text-align: center;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f9fafb;
}

.link-primary {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.link-primary:hover {
  text-decoration: underline;
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
