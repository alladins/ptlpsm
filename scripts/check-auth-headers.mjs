#!/usr/bin/env node
/**
 * services/*.service.ts에서 Authorization 헤더 누락 안티패턴 검출
 *
 * 검출 대상: fetch 호출의 headers가 { 'Content-Type': 'application/json' } 만 갖고
 *            Authorization을 포함하지 않는 패턴 (getAuthHeaders() 미사용).
 *
 * 사용: node scripts/check-auth-headers.mjs
 *       npm run lint:auth
 *
 * 종료 코드: 위반 발견 시 1, 정상 시 0
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SERVICES_DIR = new URL('../services', import.meta.url).pathname.replace(/^\//, '')

// 의도적 비인증 API (공개 엔드포인트). 파일명 기준 화이트리스트.
const PUBLIC_FILES = new Set([
  'visit.service.ts',     // 비인증 방문 추적
  'auth.service.ts',      // 토큰 발급/갱신 자체 (login/refresh/logout)
])

// 메서드/엔드포인트 단위 화이트리스트 — 라인 컨텍스트에 매칭되면 통과
const PUBLIC_METHOD_PATTERNS = [
  /getDeliveryByToken/,        // 모바일 납품확인 토큰 진입
]

/** 헤더 블록에서 Authorization 누락된 fetch 호출 위치 검출 */
function findViolations(filePath, content) {
  const violations = []
  const lines = content.split(/\r?\n/)

  // 'Content-Type': 'application/json', 만 있는 헤더 블록을 찾는다.
  // 형태:
  //   headers: {
  //     'Content-Type': 'application/json',
  //   }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!/headers:\s*\{\s*$/.test(line)) continue

    // 위 5줄 안에 fetch 호출이 있어야 실제 요청 헤더로 인정 (console.log/디버그 객체 배제)
    const aboveCtx = lines.slice(Math.max(0, i - 5), i).join('\n')
    if (!/\bfetch\s*\(/.test(aboveCtx)) continue

    // 다음 ~5줄에서 닫는 } 까지 스캔
    let hasContentType = false
    let hasAuthorization = false
    let hasSpread = false
    let endIdx = -1
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const inner = lines[j]
      if (/'Content-Type'\s*:/.test(inner)) hasContentType = true
      if (/'Authorization'\s*:/.test(inner)) hasAuthorization = true
      if (/\.\.\.getAuthHeaders\s*\(/.test(inner)) hasSpread = true
      if (/^\s*\},?\s*$/.test(inner)) {
        endIdx = j
        break
      }
    }

    if (endIdx < 0) continue
    if (!hasContentType) continue
    if (hasAuthorization || hasSpread) continue

    // 위반 — 단, 화이트리스트 적용
    const fileName = filePath.split(/[\\/]/).pop()
    if (PUBLIC_FILES.has(fileName)) continue

    // 메서드 컨텍스트 (위로 최대 30줄 스캔하여 함수 시그니처 추출)
    const ctxStart = Math.max(0, i - 30)
    const ctx = lines.slice(ctxStart, i + 1).join('\n')
    if (PUBLIC_METHOD_PATTERNS.some((p) => p.test(`${fileName}:${ctx}`))) continue

    violations.push({
      file: filePath,
      line: i + 1,
      headerStart: i + 1,
      headerEnd: endIdx + 1,
    })
  }
  return violations
}

function* walkServiceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      yield* walkServiceFiles(full)
    } else if (/\.service\.ts$/.test(entry)) {
      yield full
    }
  }
}

let totalViolations = 0
const allViolations = []
for (const file of walkServiceFiles(SERVICES_DIR)) {
  const content = readFileSync(file, 'utf8')
  const violations = findViolations(file, content)
  if (violations.length > 0) {
    totalViolations += violations.length
    allViolations.push(...violations)
  }
}

if (totalViolations > 0) {
  console.error(`\n[check-auth-headers] Authorization 헤더 누락 ${totalViolations}건 발견:\n`)
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line}`)
    console.error(`    headers 블록 ${v.headerStart}-${v.headerEnd} 줄에 Authorization 없음`)
    console.error(`    → headers: { 'Content-Type': 'application/json' } 를 headers: getAuthHeaders() 로 교체\n`)
  }
  console.error(`참고: 의도적 비인증 API는 PUBLIC_FILES 또는 PUBLIC_METHOD_PATTERNS에 등록.\n`)
  process.exit(1)
}

console.log('[check-auth-headers] 위반 0건 — 정상')
process.exit(0)
