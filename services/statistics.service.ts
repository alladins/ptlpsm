/**
 * 통계 서비스
 *
 * @description 출하현황 통계 등 통계 관련 API 호출
 * @created 2024-12-01
 */

import { STATISTICS_ENDPOINTS } from './api/endpoints'
import { getAuthHeaders } from './api'
import type {
  ShipmentStatisticsRequest,
  ShipmentStatisticsResponse,
  OemStatisticsResponse,
  OemChartData,
  BaselineStatisticsRequest,
  BaselineStatisticsResponse
} from '~/types/statistics'

/**
 * 서버 응답을 프론트엔드 타입으로 변환
 * 서버는 flat 구조로 반환하지만, 프론트엔드는 nested 구조를 기대함
 */
function transformServerResponse(serverData: any): ShipmentStatisticsResponse {
  return {
    summary: {
      totalOrderCount: serverData.totalOrderCount ?? 0,
      totalShipmentCount: serverData.totalShipmentCount ?? 0,
      totalOrderAmount: serverData.totalOrderAmount ?? 0,
      totalShipmentAmount: serverData.totalShipmentAmount ?? 0,
      totalShipmentSalesAmount: serverData.totalShipmentSalesAmount ?? 0,
      completionRate: serverData.completionRate ?? 0,
      statusCount: {
        pending: serverData.pendingCount ?? 0,
        inProgress: serverData.inProgressCount ?? 0,
        pendingSignature: serverData.pendingSignatureCount ?? 0,
        completed: serverData.completedCount ?? 0,
        cancelled: serverData.cancelledCount ?? 0
      }
    },
    periodTrend: serverData.periodTrend ?? [],
    regionBreakdown: serverData.regionStats ?? [],  // 서버는 regionStats, 프론트는 regionBreakdown
    recentOrders: serverData.recentOrders ?? [],
    recentShipments: serverData.recentShipments ?? [],
    skuOrderStats: serverData.skuOrderStats ?? []
  }
}

/**
 * 출하현황 통계 조회
 * @param params - 검색 조건
 * @returns 출하현황 통계 데이터
 */
export async function getShipmentStatistics(
  params: ShipmentStatisticsRequest
): Promise<ShipmentStatisticsResponse> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('startDate', params.startDate)
    queryParams.append('endDate', params.endDate)
    queryParams.append('periodUnit', params.periodUnit)

    if (params.status) {
      queryParams.append('status', params.status)
    }

    const url = `${STATISTICS_ENDPOINTS.shipment()}?${queryParams.toString()}`

    console.log('📊 출하현황 통계 조회:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch shipment statistics: ${response.statusText}`)
    }

    const result = await response.json()

    // ApiResponse 형태인 경우 data 추출
    const rawData = result.data ?? result

    // 서버 응답을 프론트엔드 타입으로 변환
    const transformedData = transformServerResponse(rawData)

    console.log('📊 변환된 통계 데이터:', transformedData)

    return transformedData
  } catch (error) {
    console.error('❌ 출하현황 통계 조회 실패:', error)
    throw error
  }
}

/**
 * OEM 제조사별 통계 조회
 * @param year - 조회 연도
 * @returns OEM 제조사별 통계 데이터
 */
export async function getOemStatistics(
  year: number
): Promise<OemStatisticsResponse> {
  try {
    const url = STATISTICS_ENDPOINTS.oem(year)

    console.log('📊 OEM 통계 조회:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch OEM statistics: ${response.statusText}`)
    }

    const result = await response.json()

    // ApiResponse 형태인 경우 data 추출
    const data = result.data ?? result

    console.log('📊 OEM 통계 데이터:', data)

    return data
  } catch (error) {
    console.error('❌ OEM 통계 조회 실패:', error)
    throw error
  }
}

/**
 * OEM 제조사별 월별 차트 데이터 조회
 * @param year - 조회 연도
 * @returns OEM 제조사별 월별 차트 데이터
 */
export async function getOemMonthlyChart(
  year: number
): Promise<OemChartData[]> {
  try {
    const url = STATISTICS_ENDPOINTS.oemChart(year)

    console.log('📊 OEM 차트 데이터 조회:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch OEM chart data: ${response.statusText}`)
    }

    const result = await response.json()

    // ApiResponse 형태인 경우 data 추출
    const data = result.data ?? result

    console.log('📊 OEM 차트 데이터:', data)

    return data
  } catch (error) {
    console.error('❌ OEM 차트 데이터 조회 실패:', error)
    throw error
  }
}

/**
 * 기성통계 조회
 * @param params - 검색 조건
 * @returns 기성통계 데이터
 */
export async function getBaselineStatistics(
  params: BaselineStatisticsRequest
): Promise<BaselineStatisticsResponse> {
  try {
    const queryParams = new URLSearchParams()

    if (params.year) {
      queryParams.append('year', params.year.toString())
    }

    if (params.status) {
      queryParams.append('status', params.status)
    }

    const url = `${STATISTICS_ENDPOINTS.baseline()}?${queryParams.toString()}`

    console.log('📊 기성통계 조회:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch baseline statistics: ${response.statusText}`)
    }

    const result = await response.json()

    // ApiResponse 형태인 경우 data 추출
    const data = result.data ?? result

    console.log('📊 기성통계 데이터:', data)

    return data
  } catch (error) {
    console.error('❌ 기성통계 조회 실패:', error)
    throw error
  }
}
