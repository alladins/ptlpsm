/**
 * 방문자 추적 API 엔드포인트.
 *
 * Base: ${baseUrl}/admin/visits
 */

import { getApiBaseUrl } from '../config'

const base = () => `${getApiBaseUrl()}/admin/visits`

export const VISIT_ENDPOINTS = {
  // 수집
  record: () => `${base()}/record`,

  // 회사별
  companyStats: () => `${base()}/companies/stats`,
  companyToday: () => `${base()}/companies/today`,
  companyIps: (companyId: number) => `${base()}/companies/${companyId}/ips`,

  // 사용자별
  userStats: () => `${base()}/users/stats`,
  userToday: () => `${base()}/users/today`,

  // 시간대
  hourDistribution: () => `${base()}/hour-distribution`,

  // API 호출 로그
  apiCalls: () => `${base()}/api-calls`,

  // 화이트리스트
  whitelist: () => `${base()}/whitelist`,
  whitelistById: (id: number) => `${base()}/whitelist/${id}`,
  whitelistBlocks: () => `${base()}/whitelist/blocks`,  // 활성 BLACK 목록

  // 알림
  alerts: () => `${base()}/alerts`,
  resolveAlert: (id: number) => `${base()}/alerts/${id}/resolve`
} as const
