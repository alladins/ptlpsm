/**
 * API 호출 관리 Composable
 * 로딩 상태, 에러 처리 등 API 공통 로직
 */

import { ref, type Ref } from 'vue'
import type { ApiResponse } from '~/types/common'

export interface UseApiOptions<T> {
  /** 초기 데이터 */
  initialData?: T
  /** 즉시 실행 여부 */
  immediate?: boolean
  /** 에러 발생 시 콜백 */
  onError?: (error: any) => void
  /** 성공 시 콜백 */
  onSuccess?: (data: T) => void
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const { initialData, immediate = false, onError, onSuccess } = options

  // 상태
  const data = ref<T | null>(initialData || null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isSuccess = ref(false)
  const isError = ref(false)

  /**
   * API 실행
   */
  async function execute(...args: any[]): Promise<T | null> {
    loading.value = true
    error.value = null
    isSuccess.value = false
    isError.value = false

    try {
      const response = await apiFunction(...args)

      // ApiResponse 형식 체크
      if (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        'data' in response
      ) {
        const apiResponse = response as unknown as ApiResponse<T>

        if (!apiResponse.success) {
          throw new Error(apiResponse.error?.message || '요청 처리에 실패했습니다.')
        }

        data.value = apiResponse.data
        isSuccess.value = true
        onSuccess?.(apiResponse.data)
        return apiResponse.data
      } else {
        // 일반 응답
        data.value = response
        isSuccess.value = true
        onSuccess?.(response)
        return response
      }
    } catch (err: any) {
      const errorMessage = err.message || '요청 중 오류가 발생했습니다.'
      error.value = errorMessage
      isError.value = true
      onError?.(err)
      console.error('API 호출 오류:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 재시도
   */
  async function retry(...args: any[]): Promise<T | null> {
    return execute(...args)
  }

  /**
   * 리셋
   */
  function reset() {
    data.value = initialData || null
    loading.value = false
    error.value = null
    isSuccess.value = false
    isError.value = false
  }

  // 즉시 실행
  if (immediate) {
    execute()
  }

  return {
    // 상태
    data,
    loading,
    error,
    isSuccess,
    isError,

    // 메서드
    execute,
    retry,
    reset
  }
}

/**
 * 여러 API를 동시에 호출하는 Composable
 */
export function useMultipleApi() {
  const loading = ref(false)
  const errors = ref<string[]>([])
  const isSuccess = ref(false)
  const isError = ref(false)

  /**
   * 여러 API 동시 실행
   */
  async function executeAll<T extends any[]>(
    apiFunctions: Array<() => Promise<any>>
  ): Promise<T | null> {
    loading.value = true
    errors.value = []
    isSuccess.value = false
    isError.value = false

    try {
      const results = await Promise.all(apiFunctions.map((fn) => fn()))
      isSuccess.value = true
      return results as T
    } catch (err: any) {
      const errorMessage = err.message || '요청 중 오류가 발생했습니다.'
      errors.value.push(errorMessage)
      isError.value = true
      console.error('다중 API 호출 오류:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 여러 API 순차 실행
   */
  async function executeSequentially<T extends any[]>(
    apiFunctions: Array<() => Promise<any>>
  ): Promise<T | null> {
    loading.value = true
    errors.value = []
    isSuccess.value = false
    isError.value = false

    const results: any[] = []

    try {
      for (const fn of apiFunctions) {
        try {
          const result = await fn()
          results.push(result)
        } catch (err: any) {
          const errorMessage = err.message || '요청 중 오류가 발생했습니다.'
          errors.value.push(errorMessage)
          throw err // 하나라도 실패하면 중단
        }
      }

      isSuccess.value = true
      return results as T
    } catch (err: any) {
      isError.value = true
      console.error('순차 API 호출 오류:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 리셋
   */
  function reset() {
    loading.value = false
    errors.value = []
    isSuccess.value = false
    isError.value = false
  }

  return {
    // 상태
    loading,
    errors,
    isSuccess,
    isError,

    // 메서드
    executeAll,
    executeSequentially,
    reset
  }
}

/**
 * 낙관적 업데이트를 위한 Composable
 */
export function useOptimisticUpdate<T>() {
  const originalData = ref<T | null>(null)
  const currentData = ref<T | null>(null)

  /**
   * 낙관적 업데이트 시작
   */
  function startUpdate(data: T, optimisticData: T) {
    originalData.value = data
    currentData.value = optimisticData
  }

  /**
   * 업데이트 성공
   */
  function confirmUpdate(confirmedData?: T) {
    if (confirmedData) {
      currentData.value = confirmedData
    }
    originalData.value = null
  }

  /**
   * 업데이트 실패 (롤백)
   */
  function rollback() {
    if (originalData.value) {
      currentData.value = originalData.value
      originalData.value = null
    }
  }

  return {
    originalData,
    currentData,
    startUpdate,
    confirmUpdate,
    rollback
  }
}
