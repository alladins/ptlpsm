/**
 * 토큰 기반 공개 주문요청 서비스 (현장소장 모바일용)
 *
 * 인증 헤더(JWT) 미부착 - apiClient 와 별도의 raw fetch 사용.
 * 경로: /api/m/order-requests/by-token/{token}/**
 */
import { getApiBaseUrl } from '~/services/api/config'
import type { SiteProfile } from '~/types/site'
import type {
  MobileOrderRequest,
  MobileOrderCreateRequest,
  MobileItemListItem
} from '~/types/mobile-order'

const TIMEOUT_MS = 20000

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

async function publicFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers || {})
      }
    })

    const text = await res.text()
    let data: unknown = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }

    if (!res.ok) {
      const err = new Error(extractMessage(data) || `HTTP ${res.status}`) as Error & { status?: number; data?: unknown }
      err.status = res.status
      err.data = data
      throw err
    }
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

function extractMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) {
    const m = (data as Record<string, unknown>).message
    if (typeof m === 'string') return m
  }
  return ''
}

function base(token: string, suffix = '') {
  return `${getApiBaseUrl()}/m/order-requests/by-token/${token}${suffix}`
}

export const publicOrderRequestService = {
  /** 토큰 검증 + 현장 프로필 */
  async getProfile(token: string): Promise<SiteProfile> {
    return publicFetch<SiteProfile>(base(token, '/profile'))
  },

  /** 이 현장의 누적 요청 목록 */
  async list(token: string): Promise<MobileOrderRequest[]> {
    return publicFetch<MobileOrderRequest[]>(base(token))
  },

  /** 요청 상세 */
  async getById(token: string, requestId: number): Promise<MobileOrderRequest> {
    return publicFetch<MobileOrderRequest>(base(token, `/${requestId}`))
  },

  /** 신규 요청 작성 */
  async create(token: string, data: MobileOrderCreateRequest): Promise<MobileOrderRequest> {
    return publicFetch<MobileOrderRequest>(base(token), {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /** 요청 수정 (PENDING 한정) */
  async update(token: string, requestId: number, data: MobileOrderCreateRequest): Promise<MobileOrderRequest> {
    return publicFetch<MobileOrderRequest>(base(token, `/${requestId}`), {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /** 요청 취소 (PENDING 한정) */
  async cancel(token: string, requestId: number): Promise<{ success: boolean; message: string }> {
    return publicFetch<{ success: boolean; message: string }>(base(token, `/${requestId}/cancel`), {
      method: 'POST'
    })
  },

  /** 품목 검색 (페이징, 토큰 검증 후 노출) */
  async searchItems(token: string, page = 0, size = 50): Promise<PageResponse<MobileItemListItem>> {
    const url = `${base(token, '/items')}?page=${page}&size=${size}`
    return publicFetch<PageResponse<MobileItemListItem>>(url)
  }
}
