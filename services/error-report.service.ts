import { getAuthHeaders } from './api'
import { ERROR_REPORT_ENDPOINTS } from './api/endpoints/error-report.endpoints'

// ===== 타입 =====
export type ErrorReportStatus = 'NEW' | 'ANALYZING' | 'IN_PROGRESS' | 'DONE' | 'IGNORED'
export type ErrorSource = 'SERVER' | 'CLIENT'

export interface ErrorReportComment {
  id: number
  errorReportId: number
  author: string | null
  body: string
  // NOTE/AI_DIAGNOSIS, 레거시 STATUS_CHANGE, 또는 상태변경 시 변경된 상태코드(NEW/ANALYZING/IN_PROGRESS/DONE/IGNORED)
  commentType: ErrorReportStatus | 'NOTE' | 'AI_DIAGNOSIS' | 'STATUS_CHANGE'
  createdAt: string
}

export interface ErrorReport {
  id: number
  signature: string
  errorSource: ErrorSource
  exceptionClass: string | null
  message: string | null
  stackTrace?: string | null
  httpStatus: number | null
  apiMethod: string | null
  apiUrl: string | null
  screenRoute: string | null
  userLoginId: string | null
  userRole: string | null
  companyId: number | null
  occurrenceCount: number
  firstOccurredAt: string
  lastOccurredAt: string
  status: ErrorReportStatus
  assignee: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
  commentCount?: number
  comments?: ErrorReportComment[]
}

export interface ErrorReportSearchParams {
  status?: string
  errorSource?: string
  screenRoute?: string
  keyword?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface ErrorReportListResponse {
  content: ErrorReport[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface ClientErrorPayload {
  errorName?: string
  message?: string
  stack?: string
  screenRoute?: string
  userAgent?: string
}

export const errorReportService = {
  /** 목록 조회 (SYSTEM_ADMIN) */
  async search (params: ErrorReportSearchParams = {}): Promise<ErrorReportListResponse> {
    const qp = new URLSearchParams()
    if (params.status) { qp.append('status', params.status) }
    if (params.errorSource) { qp.append('errorSource', params.errorSource) }
    if (params.screenRoute) { qp.append('screenRoute', params.screenRoute) }
    if (params.keyword) { qp.append('keyword', params.keyword) }
    if (params.startDate) { qp.append('startDate', params.startDate) }
    if (params.endDate) { qp.append('endDate', params.endDate) }
    qp.append('page', String(params.page ?? 0))
    qp.append('size', String(params.size ?? 20))

    const res = await fetch(`${ERROR_REPORT_ENDPOINTS.list()}?${qp.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    if (!res.ok) { throw new Error(`오류 목록 조회 실패: ${res.status}`) }
    return res.json()
  },

  /** 상세 조회 (SYSTEM_ADMIN) */
  async getById (id: number): Promise<ErrorReport> {
    const res = await fetch(ERROR_REPORT_ENDPOINTS.detail(id), {
      method: 'GET',
      headers: getAuthHeaders()
    })
    if (!res.ok) { throw new Error(`오류 상세 조회 실패: ${res.status}`) }
    return res.json()
  },

  /** 상태/담당자/해결메모 변경 (SYSTEM_ADMIN) */
  async updateStatus (id: number, body: { status: string, assignee?: string, resolutionNote?: string }): Promise<void> {
    const res = await fetch(ERROR_REPORT_ENDPOINTS.status(id), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    if (!res.ok) { throw new Error(`상태 변경 실패: ${res.status}`) }
  },

  /** 코멘트 작성 (SYSTEM_ADMIN) */
  async addComment (id: number, body: { body: string, commentType?: string }): Promise<ErrorReportComment> {
    const res = await fetch(ERROR_REPORT_ENDPOINTS.comments(id), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    })
    if (!res.ok) { throw new Error(`코멘트 작성 실패: ${res.status}`) }
    return res.json()
  }
}

/**
 * 프론트 JS 런타임 오류 전송.
 * - 무한루프/2차 오류 방지: 전송 실패는 조용히 무시(throw 하지 않음).
 */
export async function reportClientError (payload: ClientErrorPayload): Promise<void> {
  try {
    await fetch(ERROR_REPORT_ENDPOINTS.client(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      keepalive: true
    })
  } catch {
    // 리포트 전송 실패는 무시 (사용자 경험·무한루프 방지)
  }
}
