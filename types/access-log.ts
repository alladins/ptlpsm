/**
 * 접근로그 관련 타입 정의
 * @description 사용자 접근 및 시스템 활동 로그 관련 인터페이스
 */

/** 접근로그 아이템 */
export interface AccessLog {
  /** 로그 ID */
  id: number
  /** 사용자명 */
  username: string
  /** IP 주소 */
  ipAddress: string
  /** 접근 URL */
  accessUrl: string
  /** HTTP 메서드 */
  httpMethod: string
  /** User Agent */
  userAgent: string
  /** 접근 시간 */
  accessTime: string
  /** 응답 시간 (ms) */
  responseTime: number
  /** HTTP 상태 코드 */
  statusCode: number
  /** 생성일시 */
  createdAt: string
}

/** 접근로그 검색 파라미터 */
export interface AccessLogSearchParams {
  /** 시작일 (YYYY-MM-DD) */
  startDate?: string
  /** 종료일 (YYYY-MM-DD) */
  endDate?: string
  /** 사용자명 (like 검색) */
  username?: string
  /** IP 주소 (like 검색) */
  ipAddress?: string
  /** 접근 URL (like 검색) */
  accessUrl?: string
  /** HTTP 메서드 */
  httpMethod?: string
  /** 상태 코드 */
  statusCode?: number
  /** 페이지 번호 (0부터 시작) */
  page?: number
  /** 페이지 크기 */
  size?: number
}

/** 접근로그 목록 응답 */
export interface AccessLogListResponse {
  /** 로그 목록 */
  content: AccessLog[]
  /** 전체 건수 */
  totalElements: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 현재 페이지 */
  page: number
  /** 페이지 크기 */
  size: number
}

/** 접근로그 통계 */
export interface AccessLogStatistics {
  /** 오늘 접속자 수 */
  todayVisitors: number
  /** 성공 로그인 수 */
  successLogins: number
  /** 실패 로그인 수 */
  failedLogins: number
  /** 오류 발생 수 */
  errorCount: number
}

/** HTTP 메서드 타입 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/** HTTP 메서드 라벨 */
export const HTTP_METHOD_LABELS: Record<string, string> = {
  GET: '조회',
  POST: '등록',
  PUT: '수정',
  DELETE: '삭제',
  PATCH: '부분수정'
}

/** HTTP 메서드 배지 클래스 */
export const HTTP_METHOD_CLASSES: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800',
  POST: 'bg-green-100 text-green-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  PATCH: 'bg-purple-100 text-purple-800'
}

/** 상태 코드별 상태 */
export const getStatusFromCode = (statusCode: number): 'success' | 'fail' | 'error' => {
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 400 && statusCode < 500) return 'fail'
  return 'error'
}

/** 상태별 라벨 */
export const STATUS_LABELS: Record<string, string> = {
  success: '성공',
  fail: '실패',
  error: '오류'
}

/** 상태별 배지 클래스 */
export const STATUS_CLASSES: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  error: 'bg-yellow-100 text-yellow-800'
}
