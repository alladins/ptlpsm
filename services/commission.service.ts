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
  FundCommissionDetail,
  PeriodicSettlement,
  PeriodicSettlementListResponse,
  PeriodicSettlementSearchParams,
  CreatePeriodicSettlementRequest,
  AdvancePaymentHistory,
  AdvancePaymentCreateRequest,
  AnnualFinalSettlementResponse
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

    // 백엔드가 빈 응답(200 no body)을 반환할 수 있음
    const text = await response.text()
    if (!text) {
      return true
    }

    const data = JSON.parse(text)
    return data.success !== false
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
    const year = params.year || new Date().getFullYear()
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)
    queryParams.append('page', String(params.page ?? 0))
    queryParams.append('size', String(params.size ?? 20))

    const baseUrl = COMMISSION_ENDPOINTS.settlementsByYear(year)
    const url = `${baseUrl}?${queryParams.toString()}`
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

// ============ 중간정산 (Periodic Settlement) ============

/**
 * 중간정산 생성
 * @param request - 중간정산 생성 요청
 */
export async function createPeriodicSettlement(
  request: CreatePeriodicSettlementRequest
): Promise<PeriodicSettlement> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.createPeriodicSettlement(), {
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
    console.error('[Commission Service] 중간정산 생성 실패:', error)
    throw error
  }
}

/**
 * 정산 이력 목록 조회
 * @param params - 검색 파라미터
 */
export async function getPeriodicSettlements(
  params: PeriodicSettlementSearchParams
): Promise<PeriodicSettlementListResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.settlementType) queryParams.append('settlementType', params.settlementType)
    if (params.status) queryParams.append('status', params.status)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${COMMISSION_ENDPOINTS.periodicSettlements()}?${queryParams.toString()}`
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
    console.error('[Commission Service] 정산 이력 조회 실패:', error)
    throw error
  }
}

/**
 * 정산 상세 조회
 * @param settlementId - 정산 ID
 */
export async function getPeriodicSettlementDetail(
  settlementId: number
): Promise<PeriodicSettlement | null> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.periodicSettlementDetail(settlementId), {
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

// ==================== 정산기간 관련 ====================

/**
 * 정산기간 목록 조회
 */
export async function getCommissionPeriods() {
  const response = await fetch(COMMISSION_ENDPOINTS.periods(), {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`정산기간 목록 조회 실패: ${response.status}`)
  return response.json()
}

/**
 * 활성 정산기간 조회
 */
export async function getActivePeriod() {
  const response = await fetch(COMMISSION_ENDPOINTS.activePeriod(), {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`활성 정산기간 조회 실패: ${response.status}`)
  return response.json()
}

/**
 * 다음 정산기간 생성
 */
export async function createNextPeriod() {
  const response = await fetch(COMMISSION_ENDPOINTS.periods(), {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`정산기간 생성 실패: ${response.status}`)
  return response.json()
}

// ==================== 월별 스냅샷 관련 ====================

/**
 * 정산기간 내 월별 스냅샷 목록 조회
 */
export async function getMonthlySnapshots(periodId: number) {
  const response = await fetch(COMMISSION_ENDPOINTS.monthlySnapshots(periodId), {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`월별 스냅샷 조회 실패: ${response.status}`)
  return response.json()
}

/**
 * 월별 스냅샷 생성
 */
export async function generateMonthlySnapshot(year: number, month: number) {
  const response = await fetch(COMMISSION_ENDPOINTS.generateMonthlySnapshot(year, month), {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`월별 스냅샷 생성 실패: ${response.status}`)
  return response.json()
}

/**
 * 월별 스냅샷 확정
 */
export async function confirmMonthlySnapshot(year: number, month: number) {
  const response = await fetch(COMMISSION_ENDPOINTS.confirmMonthlySnapshot(year, month), {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`월별 스냅샷 확정 실패: ${response.status}`)
  return true
}

/**
 * 월별 영업담당자별 정산 상세 조회
 */
export async function getMonthlySettlementDetails(year: number, month: number) {
  const response = await fetch(COMMISSION_ENDPOINTS.monthlySnapshotDetails(year, month), {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`영업담당자별 상세 조회 실패: ${response.status}`)
  return response.json()
}

// ============ 가지급금 (Advance Payment) ============

/**
 * 가지급금 목록 조회
 * @param year - 연도
 */
export async function getAdvancePayments(year: number): Promise<AdvancePaymentHistory[]> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.advancePayments(year), {
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
    console.error(`[Commission Service] 가지급금 목록 조회 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 가지급금 등록
 * @param request - 가지급금 등록 요청
 */
export async function createAdvancePayment(request: AdvancePaymentCreateRequest): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.createAdvancePayment(), {
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
    console.error('[Commission Service] 가지급금 등록 실패:', error)
    throw error
  }
}

// ============ 통합 지급 관리 ============

/**
 * 통합 지급 목록 조회 (가지급금+일반 함께)
 */
export async function getPaymentHistoryAll(
  year: number,
  params?: { paymentType?: string, recipientType?: string, status?: string }
): Promise<CommissionPayment[]> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.paymentType) queryParams.append('paymentType', params.paymentType)
    if (params?.recipientType) queryParams.append('recipientType', params.recipientType)
    if (params?.status) queryParams.append('status', params.status)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${COMMISSION_ENDPOINTS.paymentAll(year)}?${queryString}`
      : COMMISSION_ENDPOINTS.paymentAll(year)

    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`)

    const data = await response.json()
    return data.success && data.data ? data.data : data
  } catch (error) {
    console.error(`[Commission Service] 통합 지급 목록 조회 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 지급 수정
 */
export async function updateCommissionPayment(
  paymentId: number,
  request: CommissionPaymentCreateRequest
): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.updatePayment(paymentId), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    })
    if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`)
    return true
  } catch (error) {
    console.error(`[Commission Service] 지급 수정 실패 (${paymentId}):`, error)
    throw error
  }
}

/**
 * 지급 삭제 (논리적 삭제)
 */
export async function deleteCommissionPayment(paymentId: number): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.deletePayment(paymentId), {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`)
    return true
  } catch (error) {
    console.error(`[Commission Service] 지급 삭제 실패 (${paymentId}):`, error)
    throw error
  }
}

/**
 * 지급이력 엑셀 다운로드
 */
export async function exportPaymentsExcel(
  year: number,
  params?: { paymentType?: string, recipientType?: string, status?: string }
): Promise<void> {
  const queryParams = new URLSearchParams()
  if (params?.paymentType) queryParams.append('paymentType', params.paymentType)
  if (params?.recipientType) queryParams.append('recipientType', params.recipientType)
  if (params?.status) queryParams.append('status', params.status)

  const queryString = queryParams.toString()
  const url = queryString
    ? `${COMMISSION_ENDPOINTS.exportPayments(year)}?${queryString}`
    : COMMISSION_ENDPOINTS.exportPayments(year)

  const response = await fetch(url, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`엑셀 다운로드 실패: ${response.status}`)

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `commission_payments_${year}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

// ============ 정산이력 확장 ============

/**
 * 정산이력 비고 수정
 */
export async function updateSettlementRemarks(
  settlementId: number,
  remarks: string
): Promise<boolean> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.updateSettlementRemarks(settlementId), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks })
    })
    if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`)
    return true
  } catch (error) {
    console.error(`[Commission Service] 정산이력 비고 수정 실패 (${settlementId}):`, error)
    throw error
  }
}

/**
 * 정산이력 엑셀 다운로드
 */
export async function exportSettlementsExcel(
  year: number,
  params?: { status?: string, search?: string }
): Promise<void> {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.search) queryParams.append('search', params.search)

  const queryString = queryParams.toString()
  const url = queryString
    ? `${COMMISSION_ENDPOINTS.exportSettlements(year)}?${queryString}`
    : COMMISSION_ENDPOINTS.exportSettlements(year)

  const response = await fetch(url, { headers: getAuthHeaders() })
  if (!response.ok) throw new Error(`엑셀 다운로드 실패: ${response.status}`)

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `commission_settlements_${year}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

// ============ 월별 커미션 집계 ============

/**
 * 월별 커미션 집계 조회 (정산이력 기반 실시간 통계)
 */
export async function getMonthlySummary(year: number): Promise<any[]> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.monthlySummary(year), {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error(`[Commission Service] 월별 집계 조회 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 월별 커미션 집계 엑셀 다운로드
 */
export async function exportMonthlySummaryExcel(year: number): Promise<void> {
  const response = await fetch(COMMISSION_ENDPOINTS.exportMonthlySummary(year), {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error(`엑셀 다운로드 실패: ${response.status}`)

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `commission_monthly_${year}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

// ============ 정산이력 일괄 재계산 ============

/**
 * 정산이력 일괄 재계산 (비율 변경 후 사용)
 * @param year - 연도
 */
export async function recalculateSettlements(year: number): Promise<{ updatedCount: number, message: string }> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.recalculateSettlements(year), {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error(`[Commission Service] 정산이력 재계산 실패 (${year}):`, error)
    throw error
  }
}

// ============ 연말정산 (Annual Final Settlement) ============

/**
 * 연말정산 시뮬레이션
 * @param year - 연도
 */
export async function simulateFinalSettlement(
  year: number
): Promise<AnnualFinalSettlementResponse> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.simulateFinalSettlement(year), {
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
    console.error(`[Commission Service] 연말정산 시뮬레이션 실패 (${year}):`, error)
    throw error
  }
}

/**
 * 연말정산 확정
 * @param year - 연도
 */
export async function finalizeFinalSettlement(
  year: number
): Promise<AnnualFinalSettlementResponse> {
  try {
    const response = await fetch(COMMISSION_ENDPOINTS.finalizeFinalSettlement(year), {
      method: 'POST',
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
    console.error(`[Commission Service] 연말정산 확정 실패 (${year}):`, error)
    throw error
  }
}
