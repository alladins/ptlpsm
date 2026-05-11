/**
 * API 에러 처리 유틸.
 *
 * (구 composables/useApiError.ts 에서 이전 — reactive 상태가 없는 순수 함수
 *  묶음이므로 utils로 분류. 호환성을 위해 useApiError() 함수도 유지.)
 */

import { ApiError } from '~/services/api/client'

export interface ApiErrorDetail {
  status: number
  code?: string
  message: string
  cause?: string
  timestamp?: string
}

/** unknown 에러를 ApiErrorDetail 로 정규화. */
export function toApiError(err: unknown): ApiErrorDetail {
  if (err instanceof ApiError) {
    const data = (err.data ?? {}) as Record<string, unknown>
    return {
      status: err.status ?? 0,
      code: err.code ?? (typeof data.code === 'string' ? data.code : undefined),
      message: err.message || '요청 처리 중 오류가 발생했습니다.',
      cause: typeof data.cause === 'string' ? data.cause : undefined,
      timestamp: typeof data.timestamp === 'string' ? data.timestamp : undefined,
    }
  }
  if (err instanceof Error) {
    return { status: 0, message: err.message }
  }
  if (typeof err === 'string') {
    return { status: 0, message: err }
  }
  return { status: 0, message: '알 수 없는 오류가 발생했습니다.' }
}

/**
 * 사용자 표시용 메시지로 변환.
 * - 코드 있으면 (CODE) 형식 부여
 * - cause(기술 원인)는 노출하지 않음
 */
export function formatErrorMessage(err: unknown): string {
  const d = toApiError(err)
  return d.code ? `${d.message} (${d.code})` : d.message
}

/**
 * 에러를 alert 으로 표시.
 * - cause 는 콘솔에만 기록 (보안 + UX)
 * - 5xx / COMMON_999 는 관리자 안내 문구 추가
 *
 * Nuxt 내장 `showError`(에러 페이지 라우팅)와의 자동 import 충돌을 피하기 위해
 * `showApiError` 라는 이름으로 export 한다.
 */
export function showApiError(err: unknown, opts?: { title?: string }): void {
  const d = toApiError(err)
  const title = opts?.title ?? '오류'
  const isInternalError = d.status >= 500 || d.code === 'COMMON_999'

  let body = d.message
  if (d.code) body += `\n(${d.code})`
  if (isInternalError) {
    body += '\n\n문제가 반복되면 관리자에게 에러 코드를 알려주세요.'
    console.error(`[${title}]`, { code: d.code, cause: d.cause, status: d.status }, err)
  }

  window.alert(`${title}\n\n${body}`)
}

/**
 * 호환성 헬퍼.
 * `const { showApiError } = useApiError()` 형태로 사용.
 * 신규 코드는 위 함수들을 직접 import 권장.
 */
export function useApiError() {
  return { toApiError, showApiError, formatErrorMessage }
}
