import { useAuthStore } from '~/stores/auth'
import { usePermissionStore } from '~/stores/permission'
import { resolveMenuForPath } from '~/utils/menu-route'

/**
 * 조회 전용(VIEWER) 화면 가드 (2026-10-21)
 *
 * 조회 전용은 외부인에게 주는 계정이고, 관리자가 메뉴권한관리에서 «조회»를 켠 메뉴만 보여야 한다.
 * 그런데 메뉴 권한 검사(auth 미들웨어)를 거는 화면이 일부뿐이라, 주소를 직접 치면
 * 조회를 끈 화면(커미션 등)도 열렸다.
 *
 * 그래서 조회 전용에 한해 모든 /admin 화면을 «기본 거부»로 검사한다:
 *   화면 → 메뉴(resolveMenuForPath)를 찾아 조회 권한이 있을 때만 통과, 메뉴를 못 찾으면 거부.
 * 다른 역할은 기존 동작 그대로 둔다(영향 범위를 조회 전용으로 한정).
 * 서버도 같은 기준으로 API 조회를 막는다(ViewerReadGuardFilter).
 */
const ALWAYS_ALLOWED = ['/admin', '/admin/unauthorized']

export default defineNuxtRouteMiddleware(async (to) => {
  if (!process.client) { return }
  if (!to.path.startsWith('/admin')) { return }

  const authStore = useAuthStore()
  if (!authStore.isLoggedIn || authStore.role !== 'VIEWER') { return }

  const path = to.path.length > 1 ? to.path.replace(/\/+$/, '') : to.path
  if (ALWAYS_ALLOWED.includes(path)) { return }
  // 등록 화면은 메뉴 조회 권한이 있어도 열지 않는다 (저장은 서버가 막지만 외부인에게 빈 등록 양식을 보일 이유가 없다)
  //   ⚠ …/edit/{id} 는 막지 않는다 — 출하처럼 수정 화면이 곧 상세 화면인 메뉴가 있다
  if (/\/register$/.test(path)) {
    return navigateTo('/admin/unauthorized')
  }

  const permissionStore = usePermissionStore()
  const menus = await permissionStore.fetchUserMenus()
  const menu = resolveMenuForPath(path, menus)

  if (!menu || !permissionStore.hasPermission(menu.menuId, 'readAuth')) {
    return navigateTo('/admin/unauthorized')
  }
})
