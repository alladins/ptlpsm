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
 * 트리 구조 - SKU 부모 행
 */
export interface OemCostTreeItem {
  skuId: string
  skuName: string
  itemClassificationNumber?: string
  itemName?: string
  unitPrice?: number
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
