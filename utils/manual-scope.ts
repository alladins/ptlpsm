/**
 * 사용자 매뉴얼 — 역할별 노출 범위
 *
 * 매뉴얼은 한 문서인데 보는 사람의 역할은 제각각이다.
 * 제조사 담당자에게 기성청구 절차를 보여주면 쓸 수 없는 화면의 설명을 읽게 되고,
 * 문의가 그쪽으로 몰린다.
 *
 * ★ 역할 목록을 여기에 박아두지 않는다.
 *   장마다 «그 장이 설명하는 화면 주소» 를 문서에 표시해 두고,
 *   로그인한 사람이 실제로 들어갈 수 있는 메뉴와 겹치는지만 본다.
 *   그러면 메뉴권한관리에서 권한을 바꾸는 순간 매뉴얼도 같이 따라온다.
 *
 * 문서 쪽 표시 (장 제목 바로 다음 줄):
 *   # 3. 출하 관리
 *   <!-- menu: /admin/shipping/list, /admin/transport/list -->
 *
 * 표시가 없는 장(1장 개요·10장 FAQ)은 누구에게나 보인다.
 */

/** 장 제목 정규식 — 마크다운 H1 */
const CHAPTER_RE = /^# .+$/gm

/** 장 제목 다음 줄의 메뉴 표시 */
const MENU_MARKER_RE = /^<!--\s*menu:\s*(.+?)\s*-->\s*$/m

/** 한 장(章) */
interface Chapter {
  /** 장 전체 원문 (제목 포함) */
  text: string
  /** 이 장을 여는 화면 주소들. 비어 있으면 누구에게나 보인다 */
  urls: string[]
}

/**
 * 원문을 장 단위로 쪼갠다.
 * 첫 장 앞의 머리말(제목·목차)은 urls 가 비어 있는 조각으로 앞에 남는다.
 */
function splitChapters (raw: string): Chapter[] {
  const starts: number[] = []
  CHAPTER_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = CHAPTER_RE.exec(raw)) !== null) { starts.push(m.index) }

  if (starts.length === 0) { return [{ text: raw, urls: [] }] }

  const chunks: Chapter[] = []
  if (starts[0] > 0) { chunks.push({ text: raw.slice(0, starts[0]), urls: [] }) }

  for (let i = 0; i < starts.length; i++) {
    const text = raw.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : raw.length)
    const marker = text.match(MENU_MARKER_RE)
    const urls = marker
      ? marker[1].split(',').map(u => u.trim()).filter(Boolean)
      : []
    chunks.push({ text, urls })
  }
  return chunks
}

/**
 * 접근 가능한 메뉴 주소만 남기고 매뉴얼을 잘라낸다.
 *
 * @param raw            매뉴얼 원문(마크다운)
 * @param accessibleUrls 로그인한 사람이 들어갈 수 있는 화면 주소들
 * @param fullAccess     전체 열람(시스템관리자 등). true 면 원문을 그대로 돌려준다
 */
export function scopeManualToMenus (
  raw: string,
  accessibleUrls: Iterable<string>,
  fullAccess = false
): { markdown: string; hiddenCount: number } {
  if (fullAccess) { return { markdown: raw, hiddenCount: 0 } }

  const allowed = new Set<string>()
  for (const u of accessibleUrls) {
    if (u) { allowed.add(normalize(u)) }
  }

  // 권한 정보를 아직 못 받았으면 섣불리 가리지 않는다.
  // 빈 목록으로 걸러 버리면 «매뉴얼이 통째로 사라진» 것처럼 보인다.
  if (allowed.size === 0) { return { markdown: raw, hiddenCount: 0 } }

  let hiddenCount = 0
  const kept = splitChapters(raw).filter((ch) => {
    if (ch.urls.length === 0) { return true }
    const visible = ch.urls.some(u => allowed.has(normalize(u)))
    if (!visible) { hiddenCount++ }
    return visible
  })

  return { markdown: kept.map(c => c.text).join(''), hiddenCount }
}

/** 끝 슬래시·대소문자 차이를 없앤다 */
function normalize (url: string): string {
  const trimmed = url.trim().toLowerCase()
  return trimmed.length > 1 && trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

/** 메뉴 트리(자식 포함)에서 화면 주소를 전부 긁어모은다 */
export function collectMenuUrls (menus: any[] | null | undefined): string[] {
  const out: string[] = []
  const walk = (list: any[] | null | undefined) => {
    if (!Array.isArray(list)) { return }
    for (const m of list) {
      if (m?.menuUrl) { out.push(m.menuUrl) }
      walk(m?.children)
    }
  }
  walk(menus)
  return out
}
