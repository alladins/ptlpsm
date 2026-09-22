/**
 * 재고 로트(FIFO) 타입 — 2026-09-21
 *
 * 재고는 «어느 발주로, 얼마에 들어온 물량들» 로 이루어져 있다.
 * 창고를 옮겨도 출처·원가는 그대로 따라간다 (대전제 1번).
 * 출고(소진)는 먼저 들어온 것부터 빠지고, 한 번에 여러 원가에 걸칠 수 있다 (대전제 3·4번).
 */

export interface LotPiece {
  /** 처음 들어온 입고 거래 ID — FIFO 순서 */
  sourceTransactionId: number | null
  /** PO(발주 입고) / RECEIPT(재고 직접 입고) / UNKNOWN(출처 불명) */
  originType: 'PO' | 'RECEIPT' | 'UNKNOWN'
  originPoId: number | null
  originPoNo: string | null
  originReceiptId: number | null
  originReceiptNo: string | null
  receiptType: string | null
  producerCompanyId: number | null
  producerCompanyName: string | null
  inboundDate: string | null
  quantity: number
  /** 원가(원/㎡) — 발주원가 */
  unitCost: number
  /** 수량 × 원가 */
  amount: number
  /** 원가를 모름 — 출처 불명이거나 0원 발주서. 재고 직접 입고는 0원이어도 사실로 본다(무상·이월 재고) */
  costUnknown: boolean
}

export interface LotAllocation {
  pieces: LotPiece[]
  shortageQuantity: number
  totalQuantity: number
  /** Σ(줄별 금액) — 장부 기준값 */
  totalAmount: number
  /** 금액 ÷ 수량 — 표시용 역산값 (대전제 10번). 이 값으로 금액을 다시 계산하지 말 것 */
  unitCost: number
  costUnknown: boolean
  singleProducerCompanyId: number | null
  producerSummary: string | null
}

/** 출처 표시 — «PO202609-030» / «IR-202606-001» / «출처 불명» */
export function lotOriginLabel (p: LotPiece): string {
  if (p.originType === 'PO') { return p.originPoNo || '발주서' }
  if (p.originType === 'RECEIPT') { return p.originReceiptNo || '직접 입고' }
  return '출처 불명'
}
