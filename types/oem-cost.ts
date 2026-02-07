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
export interface OemCost {
  id: number
  skuId: string
  skuName?: string
  oemCompanyId: number
  oemCompanyName?: string
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
  oldCost: number | null
  newCost: number | null
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
  page?: number
  size?: number
  sort?: string
}

/**
 * 통계 정보
 */
export interface OemCostStatistics {
  totalCount: number          // 총 원가 설정 건수
  activeCount: number         // 적용중 건수
  noOemCostCount: number      // 원가 미설정 SKU 수 (경고!)
  expiringCount: number       // 30일 내 만료 예정
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
 * 영향받는 주문 정보 (원가 변경 시 재계산 대상)
 */
export interface AffectedOrder {
  deliveryDoneId: number
  deliveryRequestNo: string | null
  projectName: string | null
  client: string | null
  fundId: number | null
  currentOemExpectedTotal: number
  shipmentDate: string | null
}

/**
 * 선택 재계산 결과
 */
export interface RecalcResult {
  deliveryDoneId: number
  oldAmount: number
  newAmount: number
  success: boolean
  error?: string
}

/**
 * OEM 원가 상태 계산
 */
export const calculateOemCostStatus = (item: OemCost): OemCostStatus => {
  if (!item.isActive) return 'EXPIRED'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const effectiveDate = new Date(item.effectiveDate)
  effectiveDate.setHours(0, 0, 0, 0)

  if (effectiveDate > today) return 'UPCOMING'

  if (item.expiryDate) {
    const expiryDate = new Date(item.expiryDate)
    expiryDate.setHours(0, 0, 0, 0)
    if (expiryDate < today) return 'EXPIRED'
  }

  return 'ACTIVE'
}
