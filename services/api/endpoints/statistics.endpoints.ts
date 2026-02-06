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
  },

  /**
   * OEM 제조사별 통계 조회
   * @returns GET /admin/statistics/oem?year={year}
   * @example
   * fetch(`${STATISTICS_ENDPOINTS.oem(2024)}`)
   */
  oem: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/statistics/oem?year=${year}`
  },

  /**
   * OEM 제조사별 월별 차트 데이터
   * @returns GET /admin/statistics/oem/chart?year={year}
   * @example
   * fetch(`${STATISTICS_ENDPOINTS.oemChart(2024)}`)
   */
  oemChart: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/statistics/oem/chart?year=${year}`
  },

  /**
   * OEM 제조사별 연간 테이블 데이터
   * @returns GET /admin/statistics/oem/table?year={year}
   * @example
   * fetch(`${STATISTICS_ENDPOINTS.oemTable(2024)}`)
   */
  oemTable: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/statistics/oem/table?year=${year}`
  },

  /**
   * 기성통계 조회
   * @returns GET /admin/statistics/baseline
   * @example
   * const params = new URLSearchParams()
   * params.append('year', '2024')
   * fetch(`${STATISTICS_ENDPOINTS.baseline()}?${params}`)
   */
  baseline: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/statistics/baseline`
  }
} as const
