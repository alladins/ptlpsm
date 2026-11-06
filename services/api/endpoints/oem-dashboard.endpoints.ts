/**
 * OEM 대시보드 API 엔드포인트
 *
 * @created 2026-02-09
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/oem-dashboard
 * - Summary: GET ${base}
 * - Detail: GET ${base}/{oemCompanyId}
 * - MonthlyPayments: GET ${base}/monthly-payments
 */

import { getApiBaseUrl } from '../config'

export const OEM_DASHBOARD_ENDPOINTS = {
  /**
   * 제조사 계정 발주 현황 (회사는 서버가 로그인 계정으로 정한다)
   * @returns GET /admin/oem-dashboard/order-status
   */
  orderStatus: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-dashboard/order-status`
  },

  /**
   * OEM 대시보드 요약 조회 (전체 OEM)
   * @returns GET /admin/oem-dashboard
   */
  summary: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-dashboard`
  },

  /**
   * 특정 OEM 대시보드 상세 조회
   * @param oemCompanyId - OEM 제조사 ID
   * @returns GET /admin/oem-dashboard/{oemCompanyId}
   */
  detail: (oemCompanyId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-dashboard/${oemCompanyId}`
  },

  /**
   * OEM 품목별 생산 현황 조회
   * @returns GET /admin/oem-dashboard/production-status
   */
  productionStatus: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-dashboard/production-status`
  },

  /**
   * OEM 월별 지급 현황 조회
   * @returns GET /admin/oem-dashboard/monthly-payments
   */
  monthlyPayments: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-dashboard/monthly-payments`
  }
} as const
