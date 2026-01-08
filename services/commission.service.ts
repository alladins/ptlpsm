/**
 * 커미션 관리 서비스
 *
 * CREATED DATE: 2026-01-08
 *
 * 기능:
 * - 연도별 커미션율 설정 조회/저장
 * - 커미션 정산 목록/상세 조회
 * - 연간 커미션 요약 조회
 * - 커미션 지급 이력 관리
 */

import { COMMISSION_ENDPOINTS } from './api/endpoints/commission.endpoints'
import { getAuthHeaders } from './api'
import type {
  CommissionRateConfig,
  CommissionRateUpdateRequest,
  CommissionSettlement,
  CommissionSettlementListResponse,
  CommissionSettlementSearchParams,
  AnnualCommissionSummary,
  CommissionDashboardStats,
  CommissionPayment,
  CommissionPaymentListResponse,
  CommissionPaymentSearchParams,
  CommissionPaymentCreateRequest,
  CommissionPaymentCompleteRequest,
  FundCommissionDetail
} from '~/types/commission'

// ============ 커미션율 설정 ============

/**
 * 연도별 커미션율 설정 조회
 * @param year - 연도
 */
export async function getCommissionRates(year: number): Promise<CommissionRateConfig | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.rates(year), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 커미션율 조회 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 연도별 커미션율 설정 저장
 * @param year - 연도
 * @param request - 커미션율 설정 요청
 */
export async function saveCommissionRates(
  year: number,
  request: CommissionRateUpdateRequest
): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.saveRates(year), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error(`[Commission Service] 커미션율 저장 실패 (${year}):`, error)
    throw error
  }
}

// ============ 커미션 정산 ============

/**
 * 커미션 정산 목록 조회
 * @param params - 검색 파라미터
 */
export async function getCommissionSettlements(
  params: CommissionSettlementSearchParams
): Promise<CommissionSettlementListResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${COMMISSION_ENDPOINTS.settlements()}?${queryParams.toString()}`
    const response = await fetch(url, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error('[Commission Service] 정산 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 자금별 커미션 정산 상세 조회
 * @param fundId - 자금 ID
 */
export async function getCommissionSettlementByFund(
  fundId: number
): Promise<FundCommissionDetail | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.settlementByFund(fundId), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 자금별 정산 조회 실패 (${fundId}):`, error)
    throw error
  }
}

/**
 * 커미션 정산 상세 조회
 * @param settlementId - 정산 ID
 */
export async function getCommissionSettlementDetail(
  settlementId: number
): Promise<CommissionSettlement | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.settlementDetail(settlementId), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 정산 상세 조회 실패 (${settlementId}):`, error)
    throw error
  }
}

/**
 * 커미션 정산 확정
 * @param settlementId - 정산 ID
 */
export async function confirmCommissionSettlement(settlementId: number): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.confirmSettlement(settlementId), {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error(`[Commission Service] 정산 확정 실패 (${settlementId}):`, error)
    throw error
  }
}

/**
 * 커미션 일괄 정산 확정
 * @param settlementIds - 정산 ID 목록
 */
export async function confirmCommissionSettlementBatch(settlementIds: number[]): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.confirmSettlementBatch(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settlementIds })
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('[Commission Service] 일괄 정산 확정 실패:', error)
    throw error
  }
}

// ============ 연간 커미션 요약 ============

/**
 * 연간 커미션 요약 조회
 * @param year - 연도
 */
export async function getAnnualCommissionSummary(year: number): Promise<AnnualCommissionSummary | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.annual(year), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 연간 요약 조회 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 커미션 대시보드 통계 조회
 * @param year - 연도
 */
export async function getCommissionDashboardStats(year: number): Promise<CommissionDashboardStats | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.dashboard(year), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 대시보드 통계 조회 실패 (${year}):`, error)
    throw error
  }
}

// ============ 커미션 지급 ============

/**
 * 연도별 커미션 지급 이력 조회
 * @param year - 연도
 * @param params - 검색 파라미터
 */
export async function getCommissionPayments(
  year: number,
  params?: CommissionPaymentSearchParams
): Promise<CommissionPaymentListResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.size !== undefined) queryParams.append('size', params.size.toString())
    if (params?.sort) queryParams.append('sort', params.sort)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${COMMISSION_ENDPOINTS.payments(year)}?${queryString}`
      : COMMISSION_ENDPOINTS.payments(year)

    const response = await fetch(url, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 지급 이력 조회 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 커미션 지급 등록
 * @param year - 연도
 * @param request - 지급 등록 요청
 */
export async function createCommissionPayment(
  year: number,
  request: CommissionPaymentCreateRequest
): Promise<CommissionPayment> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.createPayment(year), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 지급 등록 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 커미션 지급 상세 조회
 * @param paymentId - 지급 ID
 */
export async function getCommissionPaymentDetail(
  paymentId: number
): Promise<CommissionPayment | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.paymentDetail(paymentId), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return data
  } catch (error) {
    console.error(`[Commission Service] 지급 상세 조회 실패 (${paymentId}):`, error)
    throw error
  }
}

/**
 * 커미션 지급 완료 처리
 * @param paymentId - 지급 ID
 * @param request - 지급 완료 요청
 */
export async function completeCommissionPayment(
  paymentId: number,
  request: CommissionPaymentCompleteRequest
): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.completePayment(paymentId), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error(`[Commission Service] 지급 완료 처리 실패 (${paymentId}):`, error)
    throw error
  }
}

/**
 * 커미션 지급 취소
 * @param paymentId - 지급 ID
 */
export async function cancelCommissionPayment(paymentId: number): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.cancelPayment(paymentId), {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error(`[Commission Service] 지급 취소 실패 (${paymentId}):`, error)
    throw error
  }
}
