import type { Menu } from '~/types/menu'

/**
 * 화면 주소 → 메뉴 찾기 (조회 전용 화면 가드용, 2026-10-21)
 *
 * 사이드바 메뉴 주소와 «정확히 같은» 화면만 찾던 findMenuByUrl 로는
 * 상세·수정·등록 화면(/admin/order/edit/5 등)이 어느 메뉴에도 걸리지 않아 검사 없이 열렸다.
 *
 * 규칙:
 *   1. 메뉴 주소와 정확히 같으면 그 메뉴
 *   2. 아니면 메뉴 «기준 경로»(끝의 /list 를 뗀 주소)가 화면 주소의 앞부분(경로 단위)인 메뉴 중 가장 긴 것
 *      예) /admin/order/edit/5 → /admin/order/list 의 기준 경로 /admin/order
 *          /admin/funds/loss-management → 손실관리(정확히 같음), /admin/funds/67 → 기성청구(/admin/funds)
 *   3. 기준 경로로 못 찾는 화면은 아래 표에서 따로 짝짓는다
 */
const EXTRA_ROUTE_MENU: Record<string, string> = {
  '/admin/commission/settlement': 'COMMISSION_SETTLEMENTS' // 연말정산 — 정산 이력에서 들어간다
}

const normalize = (u: string) => (u.length > 1 ? u.replace(/\/+$/, '') : u)
const baseOf = (menuUrl: string) => normalize(menuUrl).replace(/\/list$/, '')
const isPathPrefix = (prefix: string, path: string) => path === prefix || path.startsWith(prefix + '/')

function flatten (menus: Menu[]): Menu[] {
  const out: Menu[] = []
  for (const m of menus) {
    out.push(m)
    if (m.children?.length) { out.push(...flatten(m.children)) }
  }
  return out
}

/** 화면 주소에 해당하는 메뉴(하위 메뉴만 — 상위 묶음 메뉴 제외). 없으면 null */
export function resolveMenuForPath (path: string, menus: Menu[]): Menu | null {
  const target = normalize(path)
  // 상위 묶음 메뉴(/admin/order 같은 가짜 주소)는 짝짓기에서 뺀다 — 하위 메뉴 권한으로만 판정
  const leaves = flatten(menus).filter(m => m.menuUrl && !(m.children && m.children.length))

  const exact = leaves.find(m => normalize(m.menuUrl!) === target)
  if (exact) { return exact }

  for (const [route, code] of Object.entries(EXTRA_ROUTE_MENU)) {
    if (isPathPrefix(route, target)) {
      return leaves.find(m => m.menuCode === code) || null
    }
  }

  let best: Menu | null = null
  let bestLen = -1
  for (const m of leaves) {
    const base = baseOf(m.menuUrl!)
    if (isPathPrefix(base, target) && base.length > bestLen) {
      best = m
      bestLen = base.length
    }
  }
  return best
}
