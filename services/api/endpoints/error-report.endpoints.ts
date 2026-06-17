/**
 * 오류 게시판 API 엔드포인트
 * Base: ${baseUrl}/admin/error-reports
 */
import { getApiBaseUrl } from '../config'

export const ERROR_REPORT_ENDPOINTS = {
  /** 목록 조회 (SYSTEM_ADMIN) */
  list: () => `${getApiBaseUrl()}/admin/error-reports`,
  /** 상세 조회 (SYSTEM_ADMIN) */
  detail: (id: number) => `${getApiBaseUrl()}/admin/error-reports/${id}`,
  /** 상태 변경 (SYSTEM_ADMIN) */
  status: (id: number) => `${getApiBaseUrl()}/admin/error-reports/${id}/status`,
  /** 코멘트 작성 (SYSTEM_ADMIN) */
  comments: (id: number) => `${getApiBaseUrl()}/admin/error-reports/${id}/comments`,
  /** 프론트 JS 오류 수집 (로그인 사용자) */
  client: () => `${getApiBaseUrl()}/admin/error-reports/client`
} as const
