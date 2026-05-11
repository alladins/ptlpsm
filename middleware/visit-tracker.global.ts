import { defineNuxtRouteMiddleware } from 'nuxt/app'
import { visitService } from '~/services/visit.service'
import type { VisitRecordRequest } from '~/types/visit'

/**
 * 방문 추적 미들웨어.
 *
 * - 라우트 변경 시 백엔드 POST /api/admin/visits/record 호출
 * - 인증 사용자: SecurityContext에서 user_id/company_id 자동 주입 (백엔드)
 * - 비로그인: IP + fingerprint 만 기록 (Security 공개 경로)
 * - 같은 경로 5초 이내 중복 호출은 클라이언트에서 디바운스
 */

const RECENT_VISIT_TTL_MS = 5_000
const VISIT_KEY_PREFIX = 'visit_recent_'

const EXCLUDE_PREFIXES = ['/login', '/logout', '/_nuxt', '/api']

export default defineNuxtRouteMiddleware((to, from) => {
  if (!process.client) return

  const path = to.path
  if (EXCLUDE_PREFIXES.some((p) => path.startsWith(p))) return

  // 같은 경로 디바운스
  const visitKey = VISIT_KEY_PREFIX + to.fullPath
  const last = localStorage.getItem(visitKey)
  const now = Date.now()
  if (last && now - parseInt(last) < RECENT_VISIT_TTL_MS) return
  localStorage.setItem(visitKey, String(now))

  const refererUrl =
    from && from.path !== '/' && from.path !== to.path
      ? window.location.origin + from.fullPath
      : document.referrer || 'direct'

  const req: VisitRecordRequest = {
    pagePath: to.fullPath,
    refererUrl,
    pageTitle: typeof document !== 'undefined' ? document.title : undefined,
    screenResolution:
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : undefined,
    language: typeof navigator !== 'undefined' ? navigator.language : undefined,
    clientTimestamp: new Date().toISOString()
  }

  // 비동기 — 라우트 전환을 막지 않는다.
  visitService.record(req).catch((err) => {
    if (process.dev) {
      // eslint-disable-next-line no-console
      console.warn('[visit-tracker] 기록 실패:', err)
    }
  })
})
