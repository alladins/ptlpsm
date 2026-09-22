/**
 * 비출하 재고 소진 타입
 *
 * 재고에서 나가지만 출하(납품)가 아닌 거래.
 *   QUALITY_TEST : 품질관리원 시험용 발송 (1매=2㎡ ~ 30매=60㎡)
 *   LP_CONTRACT  : 리드파워 계약 (삼자단가계약. 출하 등록 없이 재고에서 소진)
 *
 * 확정하면 재고가 차감되고 원가(얼마어치가 빠졌나)가 기록된다.
 * ★ 2026-09-21 — 원가는 FIFO: 먼저 들어온 재고부터 빠지고, 빠진 물량마다 그 발주원가를 따른다.
 * ★ 2026-09-21 — OEM 월별 원장의 지급 금액에는 더하지 않는다(원장에는 «참고» 로만 표시).
 */

import type { LotPiece } from '~/types/inventory-lot'

export const CONSUMPTION_TYPE = {
  QUALITY_TEST: 'QUALITY_TEST',
  LP_CONTRACT: 'LP_CONTRACT',
  OTHER: 'OTHER'
} as const

export type ConsumptionType = typeof CONSUMPTION_TYPE[keyof typeof CONSUMPTION_TYPE]

export const CONSUMPTION_TYPE_LABELS: Record<ConsumptionType, string> = {
  [CONSUMPTION_TYPE.QUALITY_TEST]: '품질관리 발송',
  [CONSUMPTION_TYPE.LP_CONTRACT]: '리드파워 계약',
  [CONSUMPTION_TYPE.OTHER]: '기타'
}

export const CONSUMPTION_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
} as const

export type ConsumptionStatus = typeof CONSUMPTION_STATUS[keyof typeof CONSUMPTION_STATUS]

export const CONSUMPTION_STATUS_LABELS: Record<ConsumptionStatus, string> = {
  [CONSUMPTION_STATUS.DRAFT]: '작성중',
  [CONSUMPTION_STATUS.CONFIRMED]: '확정',
  [CONSUMPTION_STATUS.CANCELLED]: '취소'
}

/** 1매 = 2㎡ */
export const SQM_PER_SHEET = 2

export interface InventoryConsumption {
  consumptionId: number
  consumptionNo: string
  consumptionType: ConsumptionType
  warehouseId: number
  warehouseName: string | null
  skuId: string
  skuName: string | null
  /** 수량 (㎡) — 계산 기준 */
  quantity: number
  /** 매수 (참고. 1매 = 2㎡) */
  sheetCount: number | null
  /** 생산자 — 빠지는 재고가 한 곳 것일 때만. 여러 곳에 걸치면 null (producerSummary 를 볼 것) */
  sourceOemCompanyId: number | null
  sourceOemCompanyName: string | null
  /** 평균 원가 = 금액 ÷ 수량 (표시용 역산값) */
  unitCost: number
  /** Σ(로트별 수량 × 원가) — 장부 기준값 */
  amount: number
  consumptionDate: string
  ledgerYearMonth: string
  destination: string | null
  contractNo: string | null
  remarks: string | null
  status: ConsumptionStatus
  inventoryTransactionId: number | null
  /** 현재 재고 (㎡) — 확정 가능 여부 판단용 */
  currentStock: number | null
  confirmedAt: string | null
  confirmedBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancelReason: string | null
  createdAt: string | null
  createdBy: string | null
  updatedAt: string | null
  /** 원가 내역 — 작성중=지금 재고 기준 미리보기, 확정=기록된 값. 기능 도입 전 확정분은 빈 배열 */
  lots: LotPiece[] | null
  /** «(주)금성인슈텍» / «(주)금성인슈텍 외 1곳» */
  producerSummary: string | null
  /** 원가를 모르는 물량(0원 발주·출처 불명)이 섞였는가 — true 면 확정 불가 */
  costUnknown: boolean | null
  /** 재고가 모자라 출처를 못 찾은 수량 */
  shortageQuantity: number | null
}

export interface InventoryConsumptionCreateRequest {
  consumptionType: ConsumptionType
  warehouseId: number
  skuId: string
  /** ㎡. 비우면 sheetCount × 2 로 환산된다 */
  quantity?: number | null
  sheetCount?: number | null
  /** 보내지 않는다 — 서버가 FIFO 로 빠지는 재고의 발주 공급원으로 정한다 */
  sourceOemCompanyId?: number | null
  consumptionDate: string
  destination?: string | null
  contractNo?: string | null
  remarks?: string | null
}

export interface InventoryConsumptionSearchParams {
  consumptionType?: ConsumptionType | null
  sourceOemCompanyId?: number | null
  warehouseId?: number | null
  skuId?: string | null
  status?: ConsumptionStatus | null
  ledgerYearMonth?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  keyword?: string | null
  page?: number
  size?: number
}

/**
 * 확정 가능 여부 — 백엔드 confirmConsumption 과 같은 조건이어야 한다.
 *   · 재고가 모자라면 안 된다
 *   · 원가를 모르는 물량(0원 발주·출처 불명)이 섞이면 안 된다
 *     ★ 본사 창고라서 0원인 것이 아니다. 창고는 원가를 바꾸지 않는다(대전제 1번).
 *       원가는 FIFO 로 빠지는 재고가 들어온 발주의 원가다.
 */
export function canConfirm (c: InventoryConsumption): boolean {
  if (c.status !== CONSUMPTION_STATUS.DRAFT) { return false }
  if (c.costUnknown) { return false }
  return (c.currentStock ?? 0) >= c.quantity
}
