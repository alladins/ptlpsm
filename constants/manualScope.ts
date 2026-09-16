/**
 * 매뉴얼 절 ↔ 화면(메뉴 URL) 매핑
 *
 * 사용자 매뉴얼은 한 벌로 관리하고, 보여줄 때 **로그인한 사람의 권한으로 걸러낸다.**
 * 역할별로 문서를 따로 두면 공통 내용이 바뀔 때마다 여러 문서를 고쳐야 하고
 * 반드시 어긋난다.
 *
 * ⚠ 권한은 메뉴(readAuth='Y')를 기준으로 본다. 화면을 못 여는 사람에게
 *   그 화면 조작법을 보여줄 이유가 없다.
 *
 * 예: OEM 담당자는 운송관리·납품확인·월별 매출원장 3개만 보이므로
 *     발주·기성·손실·원가 장이 통째로 가려진다.
 */

/** 절 제목 앞부분(번호 포함) → 그 절을 보려면 있어야 할 메뉴 URL */
export interface ManualScopeRule {
  /** 매뉴얼 제목이 이 문자열로 시작하면 이 규칙을 적용한다 */
  prefix: string
  /**
   * 이 중 **하나라도** 볼 수 있으면 절이 보인다.
   * 비우면 누구에게나 보인다(개요·용어·FAQ 등).
   */
  menuUrls: string[]
}

export const MANUAL_SCOPE: ManualScopeRule[] = [
  // ── 1장 개요 — 누구나 ────────────────────────────────────────────────
  { prefix: '1.', menuUrls: [] },

  // ── 2장 발주(납품요구) ──────────────────────────────────────────────
  { prefix: '2.', menuUrls: ['/admin/order/list'] },

  // ── 3장 출하 ────────────────────────────────────────────────────────
  { prefix: '3.1', menuUrls: ['/admin/shipping/list'] },
  { prefix: '3.2', menuUrls: ['/admin/shipping/list'] },
  { prefix: '3.3', menuUrls: ['/admin/shipping/list'] },
  { prefix: '3.4', menuUrls: ['/admin/shipping/post-process'] },
  { prefix: '3.', menuUrls: ['/admin/shipping/list'] },

  // ── 4장 납품확인 ────────────────────────────────────────────────────
  { prefix: '4.', menuUrls: ['/admin/delivery/list'] },

  // ── 5장 납품완료계 ──────────────────────────────────────────────────
  { prefix: '5.', menuUrls: ['/admin/delivery-done/list'] },

  // ── 6~8장 자금 ──────────────────────────────────────────────────────
  { prefix: '6.', menuUrls: ['/admin/funds'] },
  { prefix: '7.', menuUrls: ['/admin/funds'] },
  // 8.6 은 월별 매출원장이라 OEM 담당자도 본다
  { prefix: '8.6', menuUrls: ['/admin/oem/monthly-ledger'] },
  { prefix: '8.7', menuUrls: ['/admin/oem/dashboard'] },
  { prefix: '8.', menuUrls: ['/admin/funds'] },

  // ── 9장 제조생산·원가 ───────────────────────────────────────────────
  { prefix: '9.1', menuUrls: ['/admin/purchase-order/list'] },
  { prefix: '9.2', menuUrls: ['/admin/basic-info/oem-cost'] },
  { prefix: '9.3', menuUrls: ['/admin/inventory/consumption'] },
  { prefix: '9.4', menuUrls: ['/admin/funds/loss-management'] },
  { prefix: '9.', menuUrls: ['/admin/purchase-order/list'] },

  // ── 10장 FAQ — 누구나 ───────────────────────────────────────────────
  { prefix: '10.', menuUrls: [] }
]

/** 장(=# 한 개) 단위 규칙 — 장 제목은 "2. 발주 관리" 처럼 번호로 시작한다 */
export const MANUAL_CHAPTER_SCOPE: Record<string, string[]> = {
  '1': [],
  '2': ['/admin/order/list'],
  '3': ['/admin/shipping/list', '/admin/shipping/post-process'],
  '4': ['/admin/delivery/list'],
  '5': ['/admin/delivery-done/list'],
  '6': ['/admin/funds'],
  '7': ['/admin/funds'],
  '8': ['/admin/funds', '/admin/oem/monthly-ledger', '/admin/oem/dashboard'],
  '9': [
    '/admin/purchase-order/list',
    '/admin/basic-info/oem-cost',
    '/admin/inventory/consumption',
    '/admin/funds/loss-management'
  ],
  '10': []
}

/**
 * 제목에서 절 번호를 뽑는다. "3.4 출하 사후 처리" → "3.4"
 * 번호가 없으면 null (하위 소제목 — 직전 절의 범위를 따른다)
 */
export function extractSectionNo (title: string): string | null {
  const m = title.trim().match(/^(\d+(?:\.\d+)*)[.\s]/)
  return m ? m[1] : null
}
