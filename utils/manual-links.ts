/**
 * 사용자 매뉴얼 ↔ 화면 양방향 연결
 *
 * 매뉴얼 스크린샷 대신 «그 화면으로 바로 가는 버튼» 과
 * «지금 화면을 설명하는 절로 가는 버튼» 을 둔다.
 *
 * 문서 쪽 표시 (절 제목 바로 다음 줄, 독자에게는 안 보인다):
 *   ## 3.1 출하 목록 조회
 *   <!-- screen: /admin/shipping/list -->
 *
 *   ## 3.5 출하 수정 및 추가변경
 *   <!-- screen: /admin/shipping/list, /admin/shipping/edit/* -->
 *
 * - 쉼표로 여러 화면을 적을 수 있다. 화면마다 버튼이 하나씩 생긴다.
 * - 끝이 `/*` 인 항목은 «ID 가 붙는 상세 화면» 패턴이다. 바로 갈 수 없으니 버튼은 만들지 않고,
 *   화면 → 매뉴얼 방향에서 그 상세 화면을 이 절로 이어 주는 데만 쓴다.
 * - 장 단위 `<!-- menu: … -->` 는 역할이 다르다(권한으로 장을 거름 — manual-scope.ts).
 *   화면 → 매뉴얼 방향에서 screen 표시로 못 찾았을 때만 장 첫머리로 보내는 데 쓴다.
 *
 * ⚠ 매뉴얼 본문에는 화면 주소를 쓰지 않는다(고객 문서). 주소는 숨김 표시에만 둔다.
 */
import type { TocItem } from '~/utils/markdown'
import { normalizeMenuUrl, type MenuEntry } from '~/utils/manual-scope'

/** 끝이 /* 이면 상세 화면 패턴(버튼 없음, 역방향 찾기 전용) */
export function isScreenPattern (path: string): boolean {
  return path.trim().endsWith('/*')
}

/** 마지막 조각을 떼어 낸 묶음 주소. /admin/shipping/list → /admin/shipping */
function parentOf (path: string): string {
  const k = path.lastIndexOf('/')
  return k > 0 ? path.slice(0, k) : ''
}

/** /admin/xxx 이상 깊이인가 (/admin 하나로 묶으면 전혀 다른 화면끼리 이어진다) */
function isModulePath (path: string): boolean {
  return path.split('/').length >= 3
}

/**
 * 바로가기 버튼 문구. null 이면 버튼을 그리지 않는다.
 *
 * - 메뉴에 있는 화면: 읽기 권한이 있을 때만, «{메뉴 이름} 화면으로»
 * - 메뉴에 없는 화면(등록 화면 등): 같은 묶음 메뉴(/admin/shipping/…) 중 하나라도 읽을 수 있으면 보인다.
 *   문구는 그 묶음의 목록 메뉴 이름을 빌린다 — «출하관리 등록 화면으로»
 * - 메뉴 정보를 못 받았으면 가리지 않는다(매뉴얼 장 거르기와 같은 원칙). 문구는 «화면 바로가기»
 *
 * @param fullAccess 전체 열람 역할(시스템관리자 등) — 권한 판정 생략
 */
export function screenLinkLabel (
  path: string,
  entries: MenuEntry[],
  fullAccess = false
): string | null {
  if (isScreenPattern(path)) { return null }
  const p = normalizeMenuUrl(path)
  const isRegister = /\/register$/.test(p)
  const generic = isRegister ? '등록 화면 바로가기' : '화면 바로가기'

  const exact = entries.find(e => e.url === p)
  if (exact) {
    if (!exact.readable && !fullAccess) { return null }
    return exact.name ? `${exact.name} 화면으로` : generic
  }

  // 메뉴에 없는 화면 — 같은 묶음 메뉴의 권한을 따른다
  const parent = parentOf(p)
  const siblings = isModulePath(parent)
    ? entries.filter(e => e.url.startsWith(`${parent}/`))
    : []
  if (siblings.length === 0) { return generic }

  const readable = fullAccess ? siblings : siblings.filter(e => e.readable)
  if (readable.length === 0) { return null }

  const base = (readable.find(e => e.url.endsWith('/list')) || readable[0]).name
  if (!base) { return generic }
  return isRegister ? `${base} 등록 화면으로` : `${base} 화면으로`
}

/** 한 화면 주소가 표시 하나와 얼마나 맞는가. 클수록 구체적 */
interface MatchScore {
  /** 3 = 같은 화면, 2 = 그 화면의 하위(상세 등), 1 = 같은 묶음의 등록·수정·상세 화면 */
  tier: number
  /** 겹친 주소 길이 — 같은 단계면 긴 쪽이 더 구체적 */
  len: number
}

function scoreMatch (path: string, target: string): MatchScore | null {
  if (isScreenPattern(target)) {
    const base = normalizeMenuUrl(target.trim().slice(0, -2))
    return path.startsWith(`${base}/`) ? { tier: 2, len: base.length } : null
  }

  const t = normalizeMenuUrl(target)
  if (path === t) { return { tier: 3, len: t.length } }
  if (path.startsWith(`${t}/`)) { return { tier: 2, len: t.length } }

  // /admin/order/detail/12 · /admin/sales/register → 같은 묶음(/admin/order)의 목록 화면 절
  const sub = path.match(/^(.*?)\/(register|edit|detail)(\/|$)/)
  if (sub && isModulePath(sub[1]) && parentOf(t) === sub[1]) {
    return { tier: 1, len: sub[1].length }
  }
  return null
}

interface Hit extends MatchScore {
  id: string
  /** 그 절이 속한 장의 menu 표시에 이 화면이 들어 있나 (같은 화면을 여러 장이 가리킬 때 «제 장» 우선) */
  home: boolean
}

function isBetter (a: Hit, b: Hit | null): boolean {
  if (!b) { return true }
  if (a.tier !== b.tier) { return a.tier > b.tier }
  if (a.len !== b.len) { return a.len > b.len }
  return a.home && !b.home
}

function bestHit (toc: TocItem[], path: string, field: 'screens' | 'menus'): Hit | null {
  let best: Hit | null = null
  let chapterMenus: string[] = []
  for (const item of toc) {
    if (item.level === 1) { chapterMenus = item.menus || [] }
    for (const target of item[field] || []) {
      const s = scoreMatch(path, target)
      if (!s) { continue }
      const home = chapterMenus.some(m => (scoreMatch(path, m)?.tier ?? 0) >= 2)
      const hit: Hit = { ...s, id: item.id, home }
      // 점수가 완전히 같으면 문서 앞쪽(먼저 나온 절)을 남긴다
      if (isBetter(hit, best)) { best = hit }
    }
  }
  return best
}

/**
 * 화면 주소 → 그 화면을 설명하는 절의 앵커 id. 못 찾으면 null(매뉴얼 첫 화면).
 *
 * 순서: 절 단위 screen 표시(같은 화면·하위 화면) → 장 단위 menu 표시(같은 화면·하위 화면)
 *       → 같은 묶음의 등록·수정·상세 화면으로 이어지는 절 → 장
 *
 * ⚠ toc 는 권한으로 걸러진 뒤의 목차다. 걸러진 장의 화면이면 못 찾고 null 이 된다(의도).
 */
export function findManualSection (toc: TocItem[], screenPath: string): string | null {
  const path = normalizeMenuUrl(screenPath.split(/[?#]/)[0] || '')
  if (!path.startsWith('/admin')) { return null }

  const screen = bestHit(toc, path, 'screens')
  if (screen && screen.tier >= 2) { return screen.id }

  const menu = bestHit(toc, path, 'menus')
  if (menu && menu.tier >= 2) { return menu.id }

  return screen?.id ?? menu?.id ?? null
}
