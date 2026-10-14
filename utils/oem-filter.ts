/**
 * OEM 제조사별 제조원가 화면(대시보드 차트·통계 › OEM)에서 빼는 회사
 *
 * 자사(리드파워)와 에코암스는 OEM 원가 대상이 아니다. 원가 0원이면 이미 빠지지만(2026-10-14),
 * 혹시 원가가 잡혀도 나오지 않게 이름으로도 한 번 더 거른다 (2026-10-14 사용자 지시 — 두 조건 모두).
 */
export const EXCLUDED_OEM_NAME_KEYWORDS = ['리드파워', '에코암스']

/** 회사명에 제외 키워드가 들어 있으면 true (공백 무시 — «주식회사 리드파워», «(주)에코암스» 등) */
export function isExcludedOem (name?: string | null): boolean {
  const n = (name || '').replace(/\s+/g, '')
  return EXCLUDED_OEM_NAME_KEYWORDS.some(k => n.includes(k))
}
