/**
 * 출하 등록·수정 저장 응답의 경고(B급 원가 미등록 등) 처리
 *
 * @created 2026-10-02
 *
 * 백엔드가 저장은 성공시키되, 제조사 원가가 없는 SKU 가 있으면 경고 목록을 함께 준다.
 * (원가가 없으면 발주서가 0원으로 만들어진다 — 대전제 «0원 발주서 금지»)
 * 저장 성공 알림과 함께 보여주고 [제조사 원가로 이동]을 고를 수 있게 한다.
 *
 * ⚠ 응답 필드명은 백엔드 확정 전이다(2026-10-02). 확정되면 SHIPMENT_SAVE_WARNING_FIELDS 만 맞추면 된다.
 *   항목 모양도 미정이라 문자열 / { message } / { oemCompanyName, skuId, skuName } 을 모두 받는다.
 */

/** 경고 목록 필드 후보 (확정 시 이 배열만 수정) */
export const SHIPMENT_SAVE_WARNING_FIELDS = ['warnings'] as const

/** 제조사 원가 화면 */
export const OEM_COST_ROUTE = '/admin/basic-info/oem-cost'

type WarningLike = string | {
  message?: string | null
  oemCompanyName?: string | null
  companyName?: string | null
  skuId?: string | null
  skuName?: string | null
}

function toMessage (w: WarningLike): string {
  if (typeof w === 'string') { return w.trim() }
  if (!w || typeof w !== 'object') { return '' }
  if (w.message && w.message.trim()) { return w.message.trim() }
  const company = w.oemCompanyName || w.companyName || '제조사'
  const sku = w.skuName || w.skuId || '품목'
  return `${company}에 ${sku} 원가가 없습니다. 발주서가 0원으로 만들어지니 기초정보 > 제조사 원가에서 먼저 등록하세요.`
}

/** 저장 응답 본문에서 경고 문구 목록을 꺼낸다 (없으면 빈 배열) */
export function extractShipmentSaveWarnings (body: unknown): string[] {
  if (!body || typeof body !== 'object') { return [] }
  let obj = body as Record<string, unknown>
  // { success, data } 래핑이면 data 안을 본다
  if ('success' in obj && obj.data && typeof obj.data === 'object') {
    obj = { ...obj, ...(obj.data as Record<string, unknown>) }
  }
  for (const field of SHIPMENT_SAVE_WARNING_FIELDS) {
    const list = obj[field]
    if (Array.isArray(list)) {
      return (list as WarningLike[]).map(toMessage).filter(Boolean)
    }
  }
  return []
}

/**
 * 저장 성공 알림 + 경고 안내.
 * 경고가 없으면 기존처럼 alert 만 띄우고 false.
 * 경고가 있으면 확인 창으로 [확인] = 제조사 원가로 이동 / [취소] = 원래 화면으로 — true 면 제조사 원가로 이동해야 한다.
 */
export function notifySaveWithWarnings (successMessage: string, warnings: string[]): boolean {
  if (warnings.length === 0) {
    alert(successMessage)
    return false
  }
  return confirm(
    `${successMessage}\n\n` +
    `⚠ 원가 미등록 품목 (${warnings.length}건)\n` +
    warnings.map(w => `· ${w}`).join('\n') +
    '\n\n[확인]을 누르면 제조사 원가 화면으로 이동합니다. [취소]를 누르면 목록으로 갑니다.'
  )
}
