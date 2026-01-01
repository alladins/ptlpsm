<template>
  <div class="access-log">
    <PageHeader
      title="접근로그"
      description="사용자 접근 및 시스템 활동 로그를 확인합니다."
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
        <button class="btn-action btn-primary" @click="handleExportExcel">
          <i class="fas fa-file-excel"></i>
          엑셀 다운로드
        </button>
      </template>
    </PageHeader>

    <!-- 검색 조건 섹션 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <!-- 사용자 ID -->
        <div class="search-item">
          <label>사용자ID:</label>
          <input
            v-model="searchParams.username"
            type="text"
            placeholder="사용자 ID"
            class="text-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- HTTP 메서드 -->
        <div class="search-item">
          <label>메서드:</label>
          <select v-model="searchParams.httpMethod" class="type-select">
            <option value="">전체</option>
            <option value="GET">GET (조회)</option>
            <option value="POST">POST (등록)</option>
            <option value="PUT">PUT (수정)</option>
            <option value="DELETE">DELETE (삭제)</option>
          </select>
        </div>

        <!-- 상태 코드 -->
        <div class="search-item">
          <label>상태:</label>
          <select v-model="searchParams.statusCode" class="type-select">
            <option value="">전체</option>
            <option :value="200">성공 (200)</option>
            <option :value="400">클라이언트 오류 (4xx)</option>
            <option :value="500">서버 오류 (5xx)</option>
          </select>
        </div>

        <!-- 날짜 -->
        <div class="search-item search-keyword">
          <label>기간:</label>
          <input v-model="searchParams.startDate" type="date" class="date-input" />
          <span class="separator">~</span>
          <input v-model="searchParams.endDate" type="date" class="date-input" />
        </div>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">오늘 접속자</p>
            <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(statistics.todayVisitors) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">성공 로그인</p>
            <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(statistics.successLogins) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">실패 로그인</p>
            <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(statistics.failedLogins) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">오류 발생</p>
            <p class="text-2xl font-semibold text-gray-900">{{ formatNumber(statistics.errorCount) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 로그 테이블 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-800">접근 로그 목록</h3>
          <div class="text-sm text-gray-600">
            총 <span class="font-semibold">{{ formatNumber(totalElements) }}</span>건
          </div>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
        <p>로그를 불러오는 중...</p>
      </div>

      <!-- 데이터 테이블 -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                접근 시간
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자 ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                메서드
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP 주소
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                접근 URL
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                응답시간
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="logs.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                조회된 로그가 없습니다.
              </td>
            </tr>
            <tr v-else v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDateTime(log.accessTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ log.username || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getMethodClass(log.httpMethod)"
                >
                  {{ log.httpMethod }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ log.ipAddress }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" :title="log.accessUrl">
                {{ log.accessUrl }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(log.statusCode)"
                >
                  {{ getStatusLabel(log.statusCode) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ log.responseTime }}ms
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 페이징 -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <nav class="flex items-center space-x-2">
        <button
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          :disabled="currentPage === 0"
          @click="goToPage(currentPage - 1)"
        >
          이전
        </button>
        <template v-for="page in displayedPages" :key="page">
          <button
            v-if="page === '...'"
            class="px-3 py-2 text-sm font-medium text-gray-500"
            disabled
          >
            ...
          </button>
          <button
            v-else
            class="px-3 py-2 text-sm font-medium rounded-md"
            :class="currentPage === page - 1
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'"
            @click="goToPage(Number(page) - 1)"
          >
            {{ page }}
          </button>
        </template>
        <button
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          :disabled="currentPage >= totalPages - 1"
          @click="goToPage(currentPage + 1)"
        >
          다음
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { accessLogService } from '~/services/access-log.service'
import {
  HTTP_METHOD_CLASSES,
  getStatusFromCode,
  STATUS_LABELS,
  STATUS_CLASSES
} from '~/types/access-log'
import type { AccessLog, AccessLogSearchParams, AccessLogStatistics } from '~/types/access-log'

definePageMeta({
  layout: 'admin',
  pageTitle: '접근로그'
})

useHead({
  title: '접근로그 - PTLPSM',
  meta: [
    { name: 'description', content: '접근 로그 관리' }
  ]
})

// 상태
const loading = ref(false)
const logs = ref<AccessLog[]>([])
const totalElements = ref(0)
const totalPages = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)

// 통계
const statistics = reactive<AccessLogStatistics>({
  todayVisitors: 0,
  successLogins: 0,
  failedLogins: 0,
  errorCount: 0
})

// 검색 파라미터
const searchParams = reactive<AccessLogSearchParams>({
  username: '',
  httpMethod: '',
  statusCode: undefined,
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  page: 0,
  size: 20
})

// 기본 시작일 (7일 전)
function getDefaultStartDate(): string {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date.toISOString().split('T')[0]
}

// 기본 종료일 (오늘)
function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0]
}

// 표시될 페이지 번호들
const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value + 1

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// 데이터 로드
const loadData = async () => {
  try {
    loading.value = true

    const params: AccessLogSearchParams = {
      ...searchParams,
      page: currentPage.value,
      size: pageSize.value
    }

    // 빈 값 제거
    if (!params.username) delete params.username
    if (!params.httpMethod) delete params.httpMethod
    if (params.statusCode === undefined || params.statusCode === null || params.statusCode === '') delete params.statusCode

    const response = await accessLogService.getAccessLogs(params)

    logs.value = response.content || []
    totalElements.value = response.totalElements || 0
    totalPages.value = response.totalPages || 0

    // 통계 계산
    const stats = accessLogService.calculateStatistics(logs.value)
    Object.assign(statistics, stats)
  } catch (error) {
    console.error('접근로그 조회 실패:', error)
    logs.value = []
    totalElements.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

// 검색
const handleSearch = () => {
  currentPage.value = 0
  loadData()
}

// 초기화
const handleReset = () => {
  searchParams.username = ''
  searchParams.httpMethod = ''
  searchParams.statusCode = undefined
  searchParams.startDate = getDefaultStartDate()
  searchParams.endDate = getDefaultEndDate()
  currentPage.value = 0
  loadData()
}

// 엑셀 다운로드
const handleExportExcel = async () => {
  try {
    const blob = await accessLogService.exportExcel(searchParams)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `접근로그_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  }
}

// 페이지 이동
const goToPage = (page: number) => {
  if (page < 0 || page >= totalPages.value) return
  currentPage.value = page
  loadData()
}

// 날짜 포맷팅
const formatDateTime = (dateString: string): string => {
  return accessLogService.formatDateTime(dateString)
}

// 숫자 포맷팅
const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR')
}

// HTTP 메서드 클래스
const getMethodClass = (method: string): string => {
  return HTTP_METHOD_CLASSES[method] || 'bg-gray-100 text-gray-800'
}

// 상태 클래스
const getStatusClass = (statusCode: number): string => {
  const status = getStatusFromCode(statusCode)
  return STATUS_CLASSES[status]
}

// 상태 라벨
const getStatusLabel = (statusCode: number): string => {
  const status = getStatusFromCode(statusCode)
  return `${STATUS_LABELS[status]} (${statusCode})`
}

// 마운트
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-search.css';

.access-log {
  padding: 0;
}

/* 테이블 URL 컬럼 최대 너비 */
.max-w-xs {
  max-width: 20rem;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
