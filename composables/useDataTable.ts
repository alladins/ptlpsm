/**
 * 데이터 테이블 관리 Composable
 * 페이지네이션, 정렬, 검색 등 테이블 공통 로직
 */

import { ref, computed, type Ref } from 'vue'
import type { PaginationRequest, SpringPageResponse } from '~/types/common'
import { PAGINATION } from '~/utils/constants'

export interface UseDataTableOptions {
  /** 초기 페이지 크기 */
  initialPageSize?: number
  /** 초기 정렬 */
  initialSort?: string
  /** 데이터 로드 함수 */
  fetchFunction?: (params: PaginationRequest) => Promise<any>
}

export function useDataTable<T = any>(options: UseDataTableOptions = {}) {
  const {
    initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    initialSort = 'created_at,desc',
    fetchFunction
  } = options

  // 상태
  const currentPage = ref(0) // Spring은 0부터 시작
  const pageSize = ref(initialPageSize)
  const sort = ref(initialSort)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 데이터
  const items = ref<T[]>([]) as Ref<T[]>
  const totalElements = ref(0)
  const totalPages = ref(0)
  const isFirstPage = ref(true)
  const isLastPage = ref(true)

  /**
   * 시작 인덱스 (1부터 시작)
   */
  const startIndex = computed(() => {
    if (totalElements.value === 0) return 0
    return currentPage.value * pageSize.value + 1
  })

  /**
   * 종료 인덱스
   */
  const endIndex = computed(() => {
    return Math.min((currentPage.value + 1) * pageSize.value, totalElements.value)
  })

  /**
   * 페이지 번호 배열 (UI 표시용)
   */
  const pageNumbers = computed(() => {
    const pages: number[] = []
    const displayCount = PAGINATION.PAGE_NUMBER_DISPLAY_COUNT

    // 현재 페이지 기준 앞뒤로 표시할 개수
    const start = Math.max(0, currentPage.value - displayCount)
    const end = Math.min(totalPages.value - 1, currentPage.value + displayCount)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  })

  /**
   * 이전 페이지 존재 여부
   */
  const hasPreviousPage = computed(() => !isFirstPage.value)

  /**
   * 다음 페이지 존재 여부
   */
  const hasNextPage = computed(() => !isLastPage.value)

  /**
   * 페이지 변경
   */
  function changePage(page: number) {
    if (page < 0 || page >= totalPages.value) return
    currentPage.value = page
    if (fetchFunction) {
      fetchData()
    }
  }

  /**
   * 이전 페이지로 이동
   */
  function goToPreviousPage() {
    if (hasPreviousPage.value) {
      changePage(currentPage.value - 1)
    }
  }

  /**
   * 다음 페이지로 이동
   */
  function goToNextPage() {
    if (hasNextPage.value) {
      changePage(currentPage.value + 1)
    }
  }

  /**
   * 첫 페이지로 이동
   */
  function goToFirstPage() {
    changePage(0)
  }

  /**
   * 마지막 페이지로 이동
   */
  function goToLastPage() {
    changePage(totalPages.value - 1)
  }

  /**
   * 페이지 크기 변경
   */
  function changePageSize(newSize: number) {
    pageSize.value = newSize
    currentPage.value = 0 // 첫 페이지로 리셋
    if (fetchFunction) {
      fetchData()
    }
  }

  /**
   * 정렬 변경
   */
  function changeSort(newSort: string) {
    sort.value = newSort
    currentPage.value = 0 // 첫 페이지로 리셋
    if (fetchFunction) {
      fetchData()
    }
  }

  /**
   * 데이터 로드
   */
  async function fetchData(additionalParams: Record<string, any> = {}) {
    if (!fetchFunction) {
      console.warn('fetchFunction이 정의되지 않았습니다.')
      return
    }

    loading.value = true
    error.value = null

    try {
      const params: PaginationRequest = {
        page: currentPage.value,
        size: pageSize.value,
        sort: sort.value,
        ...additionalParams
      }

      const response = await fetchFunction(params)

      // Spring Data 페이지네이션 응답 처리
      if (response && 'content' in response) {
        const pageResponse = response as SpringPageResponse<T>
        items.value = pageResponse.content
        totalElements.value = pageResponse.totalElements
        totalPages.value = pageResponse.totalPages
        isFirstPage.value = pageResponse.first
        isLastPage.value = pageResponse.last
        currentPage.value = pageResponse.number
      } else {
        // 일반 배열 응답 처리
        items.value = response || []
        totalElements.value = items.value.length
        totalPages.value = 1
        isFirstPage.value = true
        isLastPage.value = true
      }
    } catch (err: any) {
      error.value = err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
      console.error('데이터 로드 오류:', err)
      items.value = []
      totalElements.value = 0
      totalPages.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 검색 (첫 페이지로 리셋)
   */
  async function search(searchParams: Record<string, any> = {}) {
    currentPage.value = 0
    await fetchData(searchParams)
  }

  /**
   * 새로고침 (현재 페이지 유지)
   */
  async function refresh(additionalParams: Record<string, any> = {}) {
    await fetchData(additionalParams)
  }

  /**
   * 초기화 (모든 상태 리셋)
   */
  function reset() {
    currentPage.value = 0
    pageSize.value = initialPageSize
    sort.value = initialSort
    items.value = []
    totalElements.value = 0
    totalPages.value = 0
    isFirstPage.value = true
    isLastPage.value = true
    error.value = null
  }

  /**
   * 수동으로 데이터 설정 (API 호출 없이)
   */
  function setData(data: T[], total?: number) {
    items.value = data
    totalElements.value = total ?? data.length
    totalPages.value = Math.ceil(totalElements.value / pageSize.value)
    isFirstPage.value = currentPage.value === 0
    isLastPage.value = currentPage.value >= totalPages.value - 1
  }

  /**
   * Spring 페이지 응답으로 데이터 설정
   */
  function setPageResponse(response: SpringPageResponse<T>) {
    items.value = response.content
    totalElements.value = response.totalElements
    totalPages.value = response.totalPages
    isFirstPage.value = response.first
    isLastPage.value = response.last
    currentPage.value = response.number
  }

  return {
    // 상태
    currentPage,
    pageSize,
    sort,
    loading,
    error,
    items,
    totalElements,
    totalPages,
    isFirstPage,
    isLastPage,

    // Computed
    startIndex,
    endIndex,
    pageNumbers,
    hasPreviousPage,
    hasNextPage,

    // 메서드
    changePage,
    goToPreviousPage,
    goToNextPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    changeSort,
    fetchData,
    search,
    refresh,
    reset,
    setData,
    setPageResponse
  }
}
