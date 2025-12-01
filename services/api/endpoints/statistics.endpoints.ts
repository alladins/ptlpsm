/**
 * 통계 API 엔드포인트
 *
 * @description 출하현황 통계 등 통계 관련 API 엔드포인트
 * @created 2024-12-01
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/statistics
 * - 출하현황: GET ${base}/shipment?params
 */

import { getApiBaseUrl } from '../config'

export const STATISTICS_ENDPOINTS = {
  /**
   * 출하현황 통계 조회
   * @returns GET /admin/statistics/shipment
   * @example
   * const params = new URLSearchParams()
   * params.append('startDate', '2024-01-01')
   * params.append('endDate', '2024-12-31')
   * params.append('periodUnit', 'monthly')
   * fetch(`${STATISTICS_ENDPOINTS.shipment()}?${params}`)
   */
  shipment: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/statistics/shipment`
  }
} as const
