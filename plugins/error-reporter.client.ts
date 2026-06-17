/**
 * 프론트엔드 JS 런타임 오류 자동 수집 플러그인 (client 전용)
 * - Vue 렌더 오류 + window error + unhandledrejection 을 오류 게시판으로 전송.
 * - 무한루프/스팸 방지: 로그인 사용자만, 동일 오류 throttle, 전송 실패는 조용히 무시.
 */
import { reportClientError } from '~/services/error-report.service'

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof window === 'undefined') { return }

  const THROTTLE_MS = 60_000
  const recent = new Map<string, number>()

  /**
   * 수집 제외 대상(양성 오류) 판별.
   * - View Transitions API(nuxt.config.ts `viewTransition: true`)는 화면 전환이
   *   끝나기 전에 다른 페이지로 이동하거나(전환 건너뜀), 탭이 백그라운드로 가는 등
   *   문서 상태가 바뀌면 전환 Promise 를 reject 한다. 기능 영향이 전혀 없는
   *   노이즈성 오류라 게시판 수집에서 제외한다.
   *   · AbortError: "Transition was skipped"
   *   · InvalidStateError: "Transition was aborted because of invalid state"
   */
  const isIgnorable = (errorName: string, message: string): boolean => {
    const msg = message || ''
    if (errorName === 'AbortError' && msg.includes('Transition was skipped')) { return true }
    if (errorName === 'InvalidStateError' && msg.includes('Transition was aborted')) { return true }
    return false
  }

  const send = (errorName: string, message: string, stack?: string) => {
    // 로그인 안 된 상태에선 수집 생략(엔드포인트가 인증 요구 + 익명 스팸 방지)
    if (!localStorage.getItem('auth_access_token')) { return }

    // View Transition 양성 오류는 수집 제외
    if (isIgnorable(errorName, message)) { return }

    const key = `${errorName}|${message}`.slice(0, 200)
    const now = Date.now()
    const last = recent.get(key)
    if (last && now - last < THROTTLE_MS) { return }
    if (recent.size > 100) { recent.clear() }
    recent.set(key, now)

    reportClientError({
      errorName,
      message,
      stack: stack ? String(stack).slice(0, 5000) : undefined,
      screenRoute: window.location.pathname,
      userAgent: navigator.userAgent
    })
  }

  // Vue 컴포넌트/렌더 오류
  const original = nuxtApp.vueApp.config.errorHandler
  nuxtApp.vueApp.config.errorHandler = (err: unknown, instance: unknown, info: string) => {
    const e = err as { name?: string, message?: string, stack?: string }
    send(e?.name || 'VueError', e?.message || String(err), e?.stack)
    if (typeof original === 'function') { original(err, instance, info) } else { console.error('[Vue error]', err, info) }
  }

  // 전역 JS 오류 (리소스 로드 오류는 제외)
  window.addEventListener('error', (event: ErrorEvent) => {
    if (event.target && event.target !== window) { return } // img/script 등 리소스 오류 제외
    const e = event.error as { name?: string, message?: string, stack?: string } | undefined
    send(e?.name || 'Error', e?.message || event.message || 'Unknown error', e?.stack)
  })

  // 처리되지 않은 Promise 거부
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const r = event.reason as { name?: string, message?: string, stack?: string } | undefined
    send(r?.name || 'UnhandledRejection', r?.message || String(event.reason), r?.stack)
  })
})
