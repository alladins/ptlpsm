/**
 * OEM 제조사별 원가 관리 타입 정의
 */

// OEM 원가 상태
export type OemCostStatus = 'ACTIVE' | 'EXPIRED' | 'UPCOMING'

export const OEM_COST_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  UPCOMING: 'UPCOMING'
} as const

export const OEM_COST_STATUS_LABELS: Record<OemCostStatus, string> = {
  ACTIVE: '적용중',
  EXPIRED: '만료됨',
  UPCOMING: '적용예정'
}

// 변경 이력 유형
export type CostChangeType = 'CREATE' | 'UPDATE' | 'DELETE'

export const COST_CHANGE_TYPE = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
} as const

export const COST_CHANGE_TYPE_LABELS: Record<CostChangeType, string> = {
  CREATE: '등록',
  UPDATE: '수정',
  DELETE: '삭제'
}

/**
 * OEM 원가 기본 정보
 */
export type CostSourceType = 'OEM' | 'LEADPOWER'

export const COST_SOURCE_TYPE_LABELS: Record<CostSourceType, string> = {
  OEM: '제조사',
  LEADPOWER: '본사'
}

export interface OemCost {
  id: number
  skuId: string
  skuName?: string
  oemCompanyId: number
  oemCompanyName?: string
  costSourceType: CostSourceType
  costPrice: number
  effectiveDate: string       // YYYY-MM-DD
  expiryDate: string | null   // YYYY-MM-DD or null (무기한)
  contractNo: string | null
  remarks: string | null
  isActive: boolean
  createdAt: string
  createdBy: string
  updatedAt: string | null
  updatedBy: string | null
}

/**
 * OEM 원가 목록 조회용 확장 정보
 */
export interface OemCostListItem extends OemCost {
  itemName?: string           // 품목명
  unitPrice?: number          // SKU 납품단가 (마진율 계산용)
  thickness?: number          // 두께(mm) — 단가 × 두께 = 원가 계산용
  marginRate?: number         // 계산된 마진율
  status?: OemCostStatus      // 계산된 상태
}

/**
 * OEM 원가 변경 이력
 */
export interface OemCostHistory {
  id: number
  skuOemCostId: number | null // 삭제된 경우 null
  skuId: string
  oemCompanyId: number
  oemCompanyName?: string
  costSourceType: CostSourceType
  oldCost: number | null
  newCost: number | null
  oldEffectiveDate: string | null
  newEffectiveDate: string | null
  oldExpiryDate: string | null
  newExpiryDate: string | null
  changeType: CostChangeType
  changedBy: string
  changedByName?: string
  changedAt: string
  changeReason: string | null
}

/**
 * 원가 등록 요청
 */
export interface OemCostCreateRequest {
  skuId: string
  oemCompanyId: number
  costSourceType?: CostSourceType
  costPrice: number
  effectiveDate: string
  expiryDate?: string | null
  contractNo?: string
  remarks?: string
}

/**
 * 원가 수정 요청
 */
export interface OemCostUpdateRequest {
  costPrice?: number
  effectiveDate?: string
  expiryDate?: string | null
  contractNo?: string
  remarks?: string
  changeReason?: string       // 변경 사유 (이력 기록용)
}

/**
 * 검색 파라미터
 */
export interface OemCostSearchParams {
  skuId?: string
  oemCompanyId?: number
  keyword?: string            // SKU코드 또는 SKU명 검색
  status?: OemCostStatus | ''
  costSourceType?: string     // 원가 유형 필터 (OEM/LEADPOWER)
  page?: number
  size?: number
  sort?: string
}

/**
 * 통계 정보
 */
export interface OemCostStatistics {
  totalOemCostCount: number     // 총 원가 설정 건수
  activeOemCostCount: number    // 적용중 건수
  skuWithCostCount: number      // 원가가 등록된 SKU 수
  skuWithoutCostCount: number   // 원가 미설정 SKU 수 (경고!)
  oemCompanyCount: number       // 등록된 OEM 제조사 수
  expiringSoonCount: number     // 30일 내 만료 예정
}

/**
 * 원가 미설정 SKU 정보
 */
export interface SkuWithoutOemCost {
  skuId: string
  skuName: string
  itemName: string
  unitPrice: number | null
}

/**
 * 페이지 응답
 */
export interface OemCostPageResponse {
  content: OemCostListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number              // 현재 페이지 (0-indexed)
  first: boolean
  last: boolean
}

/**
 * 트리 구조 - SKU 부모 행
 */
export interface OemCostTreeItem {
  skuId: string
  skuName: string
  itemClassificationNumber?: string
  itemName?: string
  unitPrice?: number
  thickness?: number          // 두께(mm) — 단가 × 두께 = 원가 계산용
  oemCount: number
  oemCosts: OemCostListItem[]
}

/**
 * 트리 페이지 응답
 */
export interface OemCostTreePageResponse {
  content: OemCostTreeItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

/**
 * 마진율 계산 유틸리티
 */
export const calculateMarginRate = (unitPrice?: number, costPrice?: number): number | null => {
  if (!unitPrice || unitPrice <= 0 || costPrice === undefined || costPrice === null) {
    return null
  }
  const margin = unitPrice - costPrice
  return (margin / unitPrice) * 100
}

/**
 * 마진율에 따른 CSS 클래스 반환
 */
export const getMarginRateClass = (marginRate: number | null): string => {
  if (marginRate === null) return 'margin-none'
  if (marginRate >= 30) return 'margin-high'     // 30% 이상: 녹색
  if (marginRate >= 15) return 'margin-normal'   // 15-30%: 파랑
  if (marginRate >= 0) return 'margin-low'       // 0-15%: 노랑
  return 'margin-negative'                        // 음수: 빨강
}

/**
 * OEM 원가 상태 계산
 * ★ 날짜 문자열(YYYY-MM-DD)을 직접 비교하여 UTC/로컬 시간대 파싱 오류 방지
 * effectiveDate / expiryDate는 DB에서 YYYY-MM-DD 형식으로 오므로 문자열 비교가 안전
 */
export const calculateOemCostStatus = (item: OemCost): OemCostStatus => {
  if (!item.isActive) return 'EXPIRED'

  // KST 기준 오늘 날짜 문자열 (YYYY-MM-DD) — Intl API로 시간대 안전하게 추출
  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())

  // effectiveDate가 YYYY-MM-DDTHH:mm:ss 형식일 경우 날짜 부분만 추출
  const effectiveDateStr = item.effectiveDate.split('T')[0]

  if (effectiveDateStr > todayStr) return 'UPCOMING'

  if (item.expiryDate) {
    const expiryDateStr = item.expiryDate.split('T')[0]
    if (expiryDateStr < todayStr) return 'EXPIRED'
  }

  return 'ACTIVE'
}

// =============== 원가 소급 (2026-10-28) ===============

/**
 * 원가 소급 후보 — 발주일 기준 원가표와 다른 단가로 등록된 발주 품목
 */
export interface CostRetroCandidate {
  poiId: number
  poId: number
  poNo: string
  orderDate: string
  poStatus: string
  skuId: string
  skuName: string | null
  quantity: number
  shipmentQuantity: number | null
  currentPrice: number
  /** 발주일 기준 원가표 단가 (원가표 구간이 없으면 null) */
  targetPrice: number | null
  amountDiff: number | null
  /** 원장 기준월 (발주일 월) */
  ledgerYearMonth: string
  paymentStatus: string | null
  selectable: boolean
  blockReason: string | null
  warning: string | null
}

export interface CostRetroRequest {
  oemCompanyId: number
  periodFrom?: string | null
  periodTo?: string | null
  poiIds: number[]
  previewToken?: string
  regeneratePdf?: boolean
  remarks?: string
}

export interface CostRetroResult {
  applied: boolean
  runId: number | null
  previewToken: string | null
  poItems: {
    poiId: number
    poId: number
    poNo: string
    orderDate: string
    skuName: string | null
    quantity: number
    oldPrice: number
    newPrice: number
    amountDiff: number
  }[]
  ledgers: { yearMonth: string, before: number, after: number, diff: number, paymentStatus: string | null }[]
  shipments: {
    shipmentId: number
    shipmentNo: string
    shipmentDate: string
    skuId: string
    skuName: string | null
    quantity: number
    oldCost: number
    newCost: number
    /** 다른 발주 물량과 섞여 평균 원가가 들어갔는지 */
    mixed: boolean
  }[]
  lotIssueCount: number
  consumptionCount: number
  funds: {
    fundId: number
    deliveryDoneId: number
    deliveryRequestNo: string | null
    projectName: string | null
    before: number
    after: number
    diff: number
  }[]
  baselines: {
    baselineId: number
    baselineSeq: number
    deliveryRequestNo: string | null
    before: number
    after: number
    diff: number
  }[]
  warnings: string[]
  regeneratedPdfs: string[]
}

export const COST_RETRO_RUN_STATUS_LABELS: Record<string, string> = {
  APPLIED: '적용됨',
  REVERTED: '되돌림',
  PARTIAL_REVERTED: '일부 되돌림'
}

export interface CostRetroRun {
  runId: number
  oemCompanyId: number
  oemCompanyName: string | null
  periodFrom: string | null
  periodTo: string | null
  itemCount: number
  ledgerDiff: number
  status: string
  remarks: string | null
  createdBy: string | null
  createdAt: string
  revertedBy: string | null
  revertedAt: string | null
}
