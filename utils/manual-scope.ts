/**
 * 사용자 매뉴얼 — 역할별 노출 범위
 *
 * 매뉴얼은 한 문서인데 보는 사람의 역할은 제각각이다.
 * 제조사 담당자에게 기성청구 절차를 보여주면 쓸 수 없는 화면의 설명을 읽게 되고,
 * 문의가 그쪽으로 몰린다.
 *
 * ★ 역할 목록을 여기에 박아두지 않는다.
 *   장·절마다 «그 부분이 설명하는 화면 주소» 를 문서에 표시해 두고,
 *   로그인한 사람이 실제로 들어갈 수 있는 메뉴와 겹치는지만 본다.
 *   그러면 메뉴권한관리에서 권한을 바꾸는 순간 매뉴얼도 같이 따라온다.
 *
 * 문서 쪽 표시 (제목 바로 다음 줄, 화면 바로가기 표시가 있으면 그 다음):
 *   ## 3.1 출하 목록 조회
 *   <!-- screen: /admin/shipping/list -->
 *   <!-- menu: /admin/shipping/list -->
 *
 * - 표시가 없는 장·절은 누구에게나 보인다.
 * - 표시된 부분이 가려지면 그 아래 작은 제목도 함께 가려진다.
 * - 주소 뒤에 «:write» 를 붙이면 그 화면의 쓰기 권한이 있을 때만 보인다.
 * - 제목 없이 문단만 가리려면 <!-- menu-block: 주소 --> … <!-- /menu-block --> 로 감싼다.
 */

/** 마크다운 제목 (H1~H3) */
const HEADING_RE = /^(#{1,3})\s+\S/

/** 제목 다음 줄의 메뉴 표시 */
const MENU_MARKER_RE = /^\s*<!--\s*menu:\s*(.+?)\s*-->\s*$/

/** 제목과 메뉴 표시 사이에 올 수 있는 화면 바로가기 표시 */
const SCREEN_MARKER_RE = /^\s*<!--\s*screen:/

/** 문단 단위 표시 */
const BLOCK_START_RE = /^\s*<!--\s*menu-block:\s*(.+?)\s*-->\s*$/
const BLOCK_END_RE = /^\s*<!--\s*\/menu-block\s*-->\s*$/

/** 코드 블록 시작·끝 — 그 안의 «# …» 는 제목이 아니다 */
const FENCE_RE = /^\s*(```|~~~)/

/** 번호가 붙은 장 제목 («# 3. 출하 관리») */
const NUMBERED_CHAPTER_RE = /^#\s+(\d+)\./

/** 첫 장 앞의 목차 줄 («3. [출하 관리](#…)») */
const TOC_LINE_RE = /^(\d+)\.\s+\[.*\]\(#.*\)\s*$/

function parseUrls (text: string): string[] {
  return text.split(',').map(u => u.trim()).filter(Boolean)
}

/** 코드 블록 바깥 줄인지를 줄마다 표시한다 */
function outsideFence (lines: string[]): boolean[] {
  let inFence = false
  return lines.map((line) => {
    if (FENCE_RE.test(line)) {
      inFence = !inFence
      return false
    }
    return !inFence
  })
}

/** 내용이 없는 줄 — 빈 줄·구분선·주석 */
function isBlankLine (line: string): boolean {
  const t = line.trim()
  return t === '' || t === '---' || /^<!--.*-->$/.test(t)
}

/** 제목만 남고 내용이 모두 가려진 제목을 지운다 */
function dropEmptyHeadings (input: string[]): string[] {
  let lines = input
  for (;;) {
    const outside = outsideFence(lines)
    const removeAt = lines.findIndex((line, i) => {
      if (!outside[i]) { return false }
      const m = line.match(HEADING_RE)
      if (!m) { return false }
      const level = m[1].length
      for (let j = i + 1; j < lines.length; j++) {
        const next = outside[j] ? lines[j].match(HEADING_RE) : null
        if (next) { return next[1].length <= level }
        if (!outside[j] || !isBlankLine(lines[j])) { return false }
      }
      return true
    })
    if (removeAt < 0) { return lines }
    lines = lines.filter((_, i) => i !== removeAt)
  }
}

/**
 * 접근 가능한 메뉴 주소만 남기고 매뉴얼을 잘라낸다.
 *
 * @param raw            매뉴얼 원문(마크다운)
 * @param accessibleUrls 로그인한 사람이 들어갈 수 있는 화면 주소들 (쓰기 권한은 «주소:write»)
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

  const isAllowed = (urls: string[]) => urls.some(u => allowed.has(normalize(u)))

  const lines = raw.split('\n')
  const outside = outsideFence(lines)
  const kept: string[] = []

  /** 가려진 제목의 수준 — 같거나 높은 제목이 나올 때까지 가린다 */
  let hiddenLevel: number | null = null
  let hiddenBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const heading = outside[i] ? line.match(HEADING_RE) : null

    if (heading) {
      const level = heading[1].length
      if (hiddenLevel !== null && level <= hiddenLevel) { hiddenLevel = null }
      if (hiddenLevel === null) {
        let next = i + 1
        while (next < lines.length && SCREEN_MARKER_RE.test(lines[next])) { next++ }
        const marker = (lines[next] || '').match(MENU_MARKER_RE)
        if (marker && !isAllowed(parseUrls(marker[1]))) { hiddenLevel = level }
      }
    }

    if (outside[i]) {
      const blockStart = line.match(BLOCK_START_RE)
      if (blockStart) {
        hiddenBlock = !isAllowed(parseUrls(blockStart[1]))
        continue
      }
      if (BLOCK_END_RE.test(line)) {
        hiddenBlock = false
        continue
      }
    }

    if (hiddenLevel === null && !hiddenBlock) { kept.push(line) }
  }

  const pruned = dropEmptyHeadings(kept)

  // 남은 장을 기준으로 맨 앞 목차와 숨긴 장 수를 맞춘다
  const allChapters = new Set<string>()
  const prunedOutside = outsideFence(pruned)
  lines.forEach((line, i) => {
    const m = outside[i] ? line.match(NUMBERED_CHAPTER_RE) : null
    if (m) { allChapters.add(m[1]) }
  })
  const keptChapters = new Set<string>()
  pruned.forEach((line, i) => {
    const m = prunedOutside[i] ? line.match(NUMBERED_CHAPTER_RE) : null
    if (m) { keptChapters.add(m[1]) }
  })

  const firstChapter = pruned.findIndex((line, i) => prunedOutside[i] && NUMBERED_CHAPTER_RE.test(line))
  const markdown = pruned
    .filter((line, i) => {
      if (firstChapter >= 0 && i >= firstChapter) { return true }
      const toc = line.match(TOC_LINE_RE)
      return !toc || keptChapters.has(toc[1])
    })
    .join('\n')

  return { markdown, hiddenCount: allChapters.size - keptChapters.size }
}

/** 끝 슬래시·대소문자 차이를 없앤다 («주소:write» 도 같은 규칙) */
function normalize (url: string): string {
  const trimmed = url.trim().toLowerCase()
  const writeSuffix = trimmed.endsWith(':write') ? ':write' : ''
  const path = writeSuffix ? trimmed.slice(0, -writeSuffix.length) : trimmed
  const clean = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
  return clean + writeSuffix
}

/**
 * 메뉴 트리에서 «실제로 들어갈 수 있는» 화면 주소만 긁어모은다.
 * 쓰기 권한이 있는 화면은 «주소:write» 도 함께 넣는다.
 *
 * ★ 메뉴 API 는 전체 메뉴를 다 내려주고, 볼 수 있는지는 항목마다
 *   auth.readAuth(Y/N) 로 표시한다. 좌측 메뉴도 이 값으로 걸러 그린다.
 *   주소만 모으면 «전부 접근 가능» 으로 읽혀 매뉴얼이 하나도 안 걸러진다.
 */
export function collectMenuUrls (menus: any[] | null | undefined): string[] {
  const out: string[] = []
  const walk = (list: any[] | null | undefined) => {
    if (!Array.isArray(list)) { return }
    for (const m of list) {
      if (m?.menuUrl && canRead(m)) {
        out.push(m.menuUrl)
        if (canWrite(m)) { out.push(`${m.menuUrl}:write`) }
      }
      walk(m?.children)
    }
  }
  walk(menus)
  return out
}

/** 메뉴 한 칸 — 매뉴얼 «화면 바로가기» 판정용 */
export interface MenuEntry {
  url: string
  name: string
  /** 읽기 권한 */
  readable: boolean
}

/**
 * 메뉴 트리를 평탄하게 펼친다 (권한 없는 메뉴도 포함, readable 로 구분).
 *
 * collectMenuUrls 는 «들어갈 수 있는 주소» 만 남기지만, 바로가기 버튼은
 * «메뉴에 있는데 권한이 없는 화면» 과 «메뉴에 없는 화면(등록 화면 등)» 을 구분해야 해서
 * 권한 없는 메뉴도 함께 돌려준다.
 */
export function collectMenuEntries (menus: any[] | null | undefined): MenuEntry[] {
  const out: MenuEntry[] = []
  const walk = (list: any[] | null | undefined) => {
    if (!Array.isArray(list)) { return }
    for (const m of list) {
      if (m?.menuUrl) {
        out.push({ url: normalize(m.menuUrl), name: String(m.menuName || ''), readable: canRead(m) })
      }
      walk(m?.children)
    }
  }
  walk(menus)
  return out
}

/** 다른 모듈(manual-links)과 같은 규칙으로 주소를 맞춘다 */
export { normalize as normalizeMenuUrl }

/**
 * 읽기 권한 판정
 * auth.readAuth 가 표준이고, 평탄한 readAuth 로 오는 응답도 있어 함께 본다.
 * 둘 다 없으면 «표시하지 않음» 이 아니라 «판단 불가» 로 보고 통과시킨다
 * (권한 정보가 없다고 문서를 가려 버리면 안 된다).
 */
function canRead (menu: any): boolean {
  const v = menu?.auth?.readAuth ?? menu?.readAuth
  if (v === undefined || v === null || v === '') { return true }
  return String(v).toUpperCase() === 'Y'
}

/** 쓰기 권한 판정 — 값이 없으면 쓰기는 없는 것으로 본다 */
function canWrite (menu: any): boolean {
  const v = menu?.auth?.writeAuth ?? menu?.writeAuth
  return String(v ?? '').toUpperCase() === 'Y'
}
