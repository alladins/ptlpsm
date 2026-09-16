/**
 * 운송사 월별 운송비 원장 서비스
 *
 * ⚠ 관리자 전용 API 다(SecurityConfig). 제조사 계정으로는 403 이 온다 —
 *   «리드파워가 운송사에 낼 돈» 이라 제조사와 무관하고, 열면 남의 운송 단가가 보인다.
 */

import { getApiBaseUrl } from './api/config'
import { getAuthHeaders } from './api'
import type { CarrierMonthlyLedger, CarrierSummary } from '~/types/carrier-ledger'

const base = () => `${getApiBaseUrl()}/admin/carrier/ledger`

class CarrierLedgerService {
  /** 그 달 원장. carrierCompanyId 를 비우면 전체 운송사를 합쳐 본다. */
  async getMonthlyLedger (yearMonth: string, carrierCompanyId?: number | null): Promise<CarrierMonthlyLedger> {
    const params = new URLSearchParams({ yearMonth })
    if (carrierCompanyId) { params.append('carrierCompanyId', String(carrierCompanyId)) }

    const response = await fetch(`${base()}?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`운송비 원장 조회 실패: ${response.status}`)
    }

    return await response.json()
  }

  /** 실적이 있는 년월 (최신순) */
  async getAvailableMonths (): Promise<string[]> {
    const response = await fetch(`${base()}/months`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`조회 가능 월 조회 실패: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 운송사 목록. yearMonth 를 주면 그 달 건수·합계가 함께 온다.
   * 실적이 없는 운송사도 목록에는 남는다(고를 수 있어야 하므로).
   */
  async getCarriers (yearMonth?: string): Promise<CarrierSummary[]> {
    const params = yearMonth ? `?yearMonth=${encodeURIComponent(yearMonth)}` : ''
    const response = await fetch(`${base()}/carriers${params}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`운송사 목록 조회 실패: ${response.status}`)
    }

    return await response.json()
  }

  /** 엑셀 다운로드 — 운송사에 보내는 정산 근거 */
  async downloadExcel (yearMonth: string, carrierCompanyId?: number | null): Promise<void> {
    const params = new URLSearchParams({ yearMonth })
    if (carrierCompanyId) { params.append('carrierCompanyId', String(carrierCompanyId)) }

    const response = await fetch(`${base()}/export?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `운송비원장_${yearMonth}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const carrierLedgerService = new CarrierLedgerService()
