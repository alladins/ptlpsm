/**
 * OEM 대시보드 API 서비스
 *
 * @created 2026-02-09
 * @description OEM 제조사별 발주/생산/재고/지급 통합 현황 조회
 */

import { getAuthHeaders } from './api'
import { OEM_DASHBOARD_ENDPOINTS } from './api/endpoints/oem-dashboard.endpoints'
import type { OemDashboardSummary, OemMonthlyPayment, OemProductionStatus } from '~/types/oem-dashboard'

/**
 * OEM 대시보드 서비스 클래스
 */
class OemDashboardService {
  /**
   * OEM 대시보드 요약 조회 (전체 OEM)
   * @returns OEM 제조사별 요약 목록
   */
  async getOemDashboardSummary(year?: number): Promise<OemDashboardSummary[]> {
    try {
      let url = OEM_DASHBOARD_ENDPOINTS.summary()
      if (year) {
        url += `?year=${year}`
      }
      console.log('[oem-dashboard.service] 요약 조회:', { year, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[oem-dashboard.service] 요약 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OEM 대시보드 요약 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[oem-dashboard.service] getOemDashboardSummary 에러:', error)
      throw error
    }
  }

  /**
   * 특정 OEM 대시보드 상세 조회
   * @param oemCompanyId - OEM 제조사 ID
   * @param year - 조회 연도 (선택, 기본 현재 연도)
   * @returns 해당 OEM의 상세 대시보드 정보
   */
  async getOemDashboardDetail(oemCompanyId: number, year?: number): Promise<OemDashboardSummary> {
    try {
      let url = OEM_DASHBOARD_ENDPOINTS.detail(oemCompanyId)
      if (year) {
        url += `?year=${year}`
      }
      console.log('[oem-dashboard.service] 상세 조회:', { oemCompanyId, year, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[oem-dashboard.service] 상세 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OEM 대시보드 상세 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[oem-dashboard.service] getOemDashboardDetail 에러:', error)
      throw error
    }
  }

  /**
   * OEM 품목별 생산 현황 조회
   * @param oemCompanyId - OEM 제조사 ID (선택)
   * @param year - 조회 연도 (선택)
   * @returns 품목별 생산 현황 목록
   */
  async getProductionStatus(oemCompanyId?: number | null, year?: number): Promise<OemProductionStatus[]> {
    try {
      let url = OEM_DASHBOARD_ENDPOINTS.productionStatus()
      const params: string[] = []
      if (oemCompanyId) params.push(`oemCompanyId=${oemCompanyId}`)
      if (year) params.push(`year=${year}`)
      if (params.length > 0) url += `?${params.join('&')}`
      console.log('[oem-dashboard.service] 생산 현황 조회:', { oemCompanyId, year, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[oem-dashboard.service] 생산 현황 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OEM 생산 현황 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[oem-dashboard.service] getProductionStatus 에러:', error)
      throw error
    }
  }

  /**
   * 전체 OEM 월별 지급 현황 조회
   * @param year - 조회 연도 (선택, 기본 현재 연도)
   * @returns 월별 지급 현황 목록
   */
  async getAllMonthlyPayments(year?: number): Promise<OemMonthlyPayment[]> {
    try {
      let url = OEM_DASHBOARD_ENDPOINTS.monthlyPayments()
      if (year) {
        url += `?year=${year}`
      }
      console.log('[oem-dashboard.service] 월별 지급 현황 조회:', { year, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[oem-dashboard.service] 월별 지급 현황 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OEM 월별 지급 현황 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[oem-dashboard.service] getAllMonthlyPayments 에러:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const oemDashboardService = new OemDashboardService()
