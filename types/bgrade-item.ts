/**
 * B급 품목 관련 타입 정의
 * @description 납품 완료 후 B급 품목 등록/관리를 위한 인터페이스
 * @created 2026-01-26
 */

/**
 * B급 품목 등록 요청
 */
export interface BgradeItemCreateRequest {
  /** 납품완료계 ID (필수) */
  deliveryDoneId: number
  /** 관련 출하 ID (필수) */
  shipmentId: number
  /** SKU ID (필수) */
  skuId: string
  /** B급 수량 (필수) */
  quantity: number
  /** 단위 */
  unit?: string
  /** 조정 단가 - B급 가격 (필수) */
  adjustedUnitPrice: number
  /** 원래 단가 (참조용) */
  originalUnitPrice?: number
  /** B급 발생 사유 */
  reason?: string
}

/**
 * B급 품목 수정 요청
 */
export interface BgradeItemUpdateRequest {
  /** B급 수량 */
  quantity?: number
  /** 단위 */
  unit?: string
  /** 조정 단가 - B급 가격 */
  adjustedUnitPrice?: number
  /** B급 발생 사유 */
  reason?: string
}

/**
 * B급 품목 응답
 */
export interface BgradeItemResponse {
  /** B급 품목 ID */
  id: number
  /** 납품완료계 ID */
  deliveryDoneId: number
  /** 관련 출하 ID */
  shipmentId: number
  /** SKU ID */
  skuId: string
  /** 품목명 */
  itemName: string
  /** 규격 */
  specification: string
  /** B급 수량 */
  quantity: number
  /** 단위 */
  unit: string
  /** 조정 단가 (B급 가격) */
  adjustedUnitPrice: number
  /** 원래 단가 */
  originalUnitPrice: number
  /** 금액 (quantity * adjustedUnitPrice) */
  amount: number
  /** B급 발생 사유 */
  reason: string | null
  /** 생성 일시 */
  createdAt: string
  /** 생성자 */
  createdBy: string
  /** 수정 일시 */
  updatedAt?: string
  /** 수정자 */
  updatedBy?: string
}

/**
 * B급 품목 목록 응답
 */
export type BgradeItemListResponse = BgradeItemResponse[]

/**
 * B급 금액 계산
 * @param quantity - 수량
 * @param adjustedUnitPrice - 조정 단가
 * @returns 금액
 */
export function calculateBgradeAmount(quantity: number, adjustedUnitPrice: number): number {
  return quantity * adjustedUnitPrice
}

/**
 * B급 할인 금액 계산 (원가 - B급 가격)
 * @param quantity - 수량
 * @param originalUnitPrice - 원래 단가
 * @param adjustedUnitPrice - 조정 단가
 * @returns 할인 금액
 */
export function calculateBgradeDiscount(
  quantity: number,
  originalUnitPrice: number,
  adjustedUnitPrice: number
): number {
  return quantity * (originalUnitPrice - adjustedUnitPrice)
}
