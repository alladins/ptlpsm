/**
 * 명함관리 API 엔드포인트
 */

import { getApiBaseUrl } from '../config'

export const BUSINESS_CARD_ENDPOINTS = {
  /** 명함 목록 조회 */
  list: () => `${getApiBaseUrl()}/admin/business-cards`,

  /** 명함 상세 조회 */
  detail: (id: number) => `${getApiBaseUrl()}/admin/business-cards/${id}`,

  /** 명함 등록 */
  create: () => `${getApiBaseUrl()}/admin/business-cards`,

  /** 명함 수정 */
  update: (id: number) => `${getApiBaseUrl()}/admin/business-cards/${id}`,

  /** 명함 삭제 */
  delete: (id: number) => `${getApiBaseUrl()}/admin/business-cards/${id}`,

  /** 명함 자동 저장 */
  autoSave: () => `${getApiBaseUrl()}/admin/business-cards/auto-save`,

  /** 기관별 명함 조회 */
  byOrg: () => `${getApiBaseUrl()}/admin/business-cards/by-org`,
} as const
