/**
 * 비출하 재고 소진 타입
 *
 * 재고에서 나가지만 출하(납품)가 아닌 거래.
 *   QUALITY_TEST : 품질관리원 시험용 발송 (1매=2㎡ ~ 30매=60㎡)
 *   LP_CONTRACT  : 리드파워 계약 (삼자단가계약. 출하 등록 없이 재고에서 소진)
 *
 * 두 경우 모두 그 물량을 만든 OEM 이 리드파워에 원가를 청구하므로,
 * 생산자(sourceOemCompanyId) 기준으로 OEM 월별 원장에 실린다.
 */

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
  sourceOemCompanyId: number
  sourceOemCompanyName: string | null
  /** 소진일 기준 as-of 원가 스냅샷 */
  unitCost: number
  /** 수량 × 원가 */
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
}

export interface InventoryConsumptionCreateRequest {
  consumptionType: ConsumptionType
  warehouseId: number
  skuId: string
  /** ㎡. 비우면 sheetCount × 2 로 환산된다 */
  quantity?: number | null
  sheetCount?: number | null
  /** 비우면 창고의 OEM 으로 자동 결정. 리드파워 창고는 자동 결정이 불가해 필수 */
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

/** 확정 가능 여부 — 재고가 모자라면 확정할 수 없다 */
export function canConfirm(c: InventoryConsumption): boolean {
  if (c.status !== CONSUMPTION_STATUS.DRAFT) { return false }
  if (!c.unitCost || c.unitCost <= 0) { return false }
  return (c.currentStock ?? 0) >= c.quantity
}
