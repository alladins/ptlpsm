/**
 * 공통 API 클라이언트
 *
 * 중복된 fetch 로직을 통합하여 일관된 API 호출 인터페이스를 제공합니다.
 * - 자동 인증 헤더 추가
 * - 응답 구조 정규화
 * - 타임아웃 처리
 * - 통합 에러 처리
 *
 * @example
 * import { apiClient } from '~/services/api/client'
 *
 * // GET 요청
 * const result = await apiClient.get<SalesListResponse>('/sales', { page: 0, size: 10 })
 *
 * // POST 요청
 * const created = await apiClient.post<Sales>('/sales', salesData)
 */

import { getApiBaseUrl } from './config'
import { getAuthHeaders } from '../api'
import { logger } from '~/utils/logger'

// 기본 타임아웃 (30초)
const DEFAULT_TIMEOUT = 30000

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * API 클라이언트 옵션
 */
interface ApiClientOptions {
  /** 타임아웃 (밀리초) */
  timeout?: number
  /** 인증 헤더 포함 여부 (기본: true) */
  withAuth?: boolean
  /** 추가 헤더 */
  headers?: HeadersInit
}

/**
 * 페이지네이션 응답 구조
 */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

/**
 * 쿼리 파라미터를 URL 쿼리 문자열로 변환
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return ''

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * 타임아웃 기능이 있는 fetch 래퍼
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * API 응답 정규화
 * 다양한 응답 구조를 통일된 형태로 변환
 *
 * 지원하는 응답 구조:
 * 1. { data: T } - data 래핑
 * 2. { content: T[], totalElements, ... } - 페이지네이션
 * 3. T[] - 배열 직접 반환
 * 4. T - 직접 반환
 */
function normalizeResponse<T>(result: unknown): T {
  // null/undefined 체크
  if (result === null || result === undefined) {
    return result as T
  }

  // 배열인 경우 직접 반환
  if (Array.isArray(result)) {
    return result as T
  }

  // 객체인 경우
  if (typeof result === 'object') {
    const obj = result as Record<string, unknown>

    // 페이지네이션 응답 (content 배열 + totalElements)
    if ('content' in obj && Array.isArray(obj.content) && 'totalElements' in obj) {
      return result as T
    }

    // data 래핑 응답
    if ('data' in obj && obj.data !== undefined) {
      // data 내부에 페이지네이션이 있는 경우
      if (typeof obj.data === 'object' && obj.data !== null) {
        const dataObj = obj.data as Record<string, unknown>
        if ('content' in dataObj && Array.isArray(dataObj.content)) {
          return obj.data as T
        }
      }
      return obj.data as T
    }

    // success 필드가 있는 응답 처리
    if ('success' in obj && obj.success === false) {
      const errorMessage = (obj.message as string) || 'API 요청 실패'
      throw new ApiError(400, errorMessage, obj)
    }
  }

  // 그 외의 경우 직접 반환
  return result as T
}

/**
 * 공통 API 클라이언트
 */
export const apiClient = {
  /**
   * GET 요청
   *
   * @param endpoint - API 엔드포인트 경로 (예: '/sales' 또는 전체 URL)
   * @param params - 쿼리 파라미터
   * @param options - 추가 옵션
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, withAuth = true, headers = {} } = options

    // 전체 URL인지 상대 경로인지 확인
    const baseUrl = endpoint.startsWith('http') ? '' : getApiBaseUrl()
    const url = `${baseUrl}${endpoint}${buildQueryString(params)}`

    logger.debug('API GET 요청', { url, params })

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            ...(withAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
            ...headers
          }
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.message || `HTTP 오류: ${response.status}`,
          errorData
        )
      }

      const result = await response.json()
      return normalizeResponse<T>(result)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('API 오류', { url, status: error.status, message: error.message })
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API 타임아웃', { url, timeout })
          throw new ApiError(408, '요청 시간이 초과되었습니다.')
        }
        logger.error('API 요청 실패', { url, error: error.message })
        throw new ApiError(0, error.message)
      }

      throw error
    }
  },

  /**
   * POST 요청
   *
   * @param endpoint - API 엔드포인트 경로
   * @param data - 요청 본문 데이터
   * @param options - 추가 옵션
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, withAuth = true, headers = {} } = options

    const baseUrl = endpoint.startsWith('http') ? '' : getApiBaseUrl()
    const url = `${baseUrl}${endpoint}`

    logger.debug('API POST 요청', { url, data })

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            ...(withAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
            ...headers
          },
          body: data ? JSON.stringify(data) : undefined
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.message || `HTTP 오류: ${response.status}`,
          errorData
        )
      }

      // 204 No Content 또는 빈 응답 처리
      const contentType = response.headers.get('content-type')
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T
      }

      const result = await response.json()
      return normalizeResponse<T>(result)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('API 오류', { url, status: error.status, message: error.message })
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API 타임아웃', { url, timeout })
          throw new ApiError(408, '요청 시간이 초과되었습니다.')
        }
        logger.error('API 요청 실패', { url, error: error.message })
        throw new ApiError(0, error.message)
      }

      throw error
    }
  },

  /**
   * PUT 요청
   *
   * @param endpoint - API 엔드포인트 경로
   * @param data - 요청 본문 데이터
   * @param options - 추가 옵션
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, withAuth = true, headers = {} } = options

    const baseUrl = endpoint.startsWith('http') ? '' : getApiBaseUrl()
    const url = `${baseUrl}${endpoint}`

    logger.debug('API PUT 요청', { url, data })

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'PUT',
          headers: {
            ...(withAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
            ...headers
          },
          body: data ? JSON.stringify(data) : undefined
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.message || `HTTP 오류: ${response.status}`,
          errorData
        )
      }

      // 204 No Content 또는 빈 응답 처리
      const contentType = response.headers.get('content-type')
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T
      }

      const result = await response.json()
      return normalizeResponse<T>(result)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('API 오류', { url, status: error.status, message: error.message })
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API 타임아웃', { url, timeout })
          throw new ApiError(408, '요청 시간이 초과되었습니다.')
        }
        logger.error('API 요청 실패', { url, error: error.message })
        throw new ApiError(0, error.message)
      }

      throw error
    }
  },

  /**
   * PATCH 요청
   *
   * @param endpoint - API 엔드포인트 경로
   * @param data - 요청 본문 데이터
   * @param options - 추가 옵션
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, withAuth = true, headers = {} } = options

    const baseUrl = endpoint.startsWith('http') ? '' : getApiBaseUrl()
    const url = `${baseUrl}${endpoint}`

    logger.debug('API PATCH 요청', { url, data })

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'PATCH',
          headers: {
            ...(withAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
            ...headers
          },
          body: data ? JSON.stringify(data) : undefined
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.message || `HTTP 오류: ${response.status}`,
          errorData
        )
      }

      // 204 No Content 또는 빈 응답 처리
      const contentType = response.headers.get('content-type')
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T
      }

      const result = await response.json()
      return normalizeResponse<T>(result)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('API 오류', { url, status: error.status, message: error.message })
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API 타임아웃', { url, timeout })
          throw new ApiError(408, '요청 시간이 초과되었습니다.')
        }
        logger.error('API 요청 실패', { url, error: error.message })
        throw new ApiError(0, error.message)
      }

      throw error
    }
  },

  /**
   * DELETE 요청
   *
   * @param endpoint - API 엔드포인트 경로
   * @param options - 추가 옵션
   */
  async delete<T = void>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, withAuth = true, headers = {} } = options

    const baseUrl = endpoint.startsWith('http') ? '' : getApiBaseUrl()
    const url = `${baseUrl}${endpoint}`

    logger.debug('API DELETE 요청', { url })

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'DELETE',
          headers: {
            ...(withAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
            ...headers
          }
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.message || `HTTP 오류: ${response.status}`,
          errorData
        )
      }

      // 204 No Content 또는 빈 응답 처리
      const contentType = response.headers.get('content-type')
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T
      }

      const result = await response.json()
      return normalizeResponse<T>(result)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('API 오류', { url, status: error.status, message: error.message })
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API 타임아웃', { url, timeout })
          throw new ApiError(408, '요청 시간이 초과되었습니다.')
        }
        logger.error('API 요청 실패', { url, error: error.message })
        throw new ApiError(0, error.message)
      }

      throw error
    }
  },

  /**
   * 파일 업로드 (FormData)
   *
   * @param endpoint - API 엔드포인트 경로
   * @param formData - FormData 객체
   * @param options - 추가 옵션
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { timeout = 60000, withAuth = true, headers = {} } = options // 업로드는 60초 타임아웃

    const baseUrl = endpoint.startsWith('http') ? '' : getApiBaseUrl()
    const url = `${baseUrl}${endpoint}`

    logger.debug('API 파일 업로드', { url })

    try {
      // FormData 전송 시 Content-Type 헤더 제거 (브라우저가 자동 설정)
      const authHeaders = withAuth ? getAuthHeaders() : {}
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            ...headersWithoutContentType,
            ...headers
          },
          body: formData
        },
        timeout
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.message || `HTTP 오류: ${response.status}`,
          errorData
        )
      }

      const contentType = response.headers.get('content-type')
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return undefined as T
      }

      const result = await response.json()
      return normalizeResponse<T>(result)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error('API 오류', { url, status: error.status, message: error.message })
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.error('API 업로드 타임아웃', { url, timeout })
          throw new ApiError(408, '파일 업로드 시간이 초과되었습니다.')
        }
        logger.error('API 업로드 실패', { url, error: error.message })
        throw new ApiError(0, error.message)
      }

      throw error
    }
  }
}

// 기본 export
export default apiClient
