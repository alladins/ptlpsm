/**
 * OEM 대시보드 관련 타입 정의
 * @description OEM 제조사별 발주/생산/재고/지급 통합 현황 타입
 * @created 2026-02-09
 */

/**
 * OEM 대시보드 요약 정보
 * - 각 OEM 제조사별 발주/생산/재고/지급 현황 통합
 */
export interface OemDashboardSummary {
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 발주 현황 - 총 발주 건수 */
  totalPoCount: number
  /** 발주 현황 - 작성중 건수 */
  draftPoCount: number
  /** 발주 현황 - 발주완료 건수 */
  issuedPoCount: number
  /** 발주 현황 - 생산완료 건수 */
  producedPoCount: number
  /** 발주 현황 - 입고완료 건수 */
  stockedPoCount: number
  /** 생산 현황 - 총 발주 수량 */
  totalOrderedQuantity: number
  /** 생산 현황 - 총 생산완료 수량 */
  totalProducedQuantity: number
  /** 생산 현황 - 생산 진행률 (%) */
  productionRate: number
  /** 재고 - 총 재고 수량 */
  totalInventoryQuantity: number
  /** 지급 - 발주 총액 */
  totalPoAmount: number
  /** 지급 - 총 지급액 */
  totalPaidAmount: number
  /** 지급 - 미지급액 */
  unpaidAmount: number
  /** 지급 - 지급 진행률 (%) */
  paymentRate: number
}

/**
 * OEM 월별 지급 현황
 */
export interface OemMonthlyPayment {
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 연월 (YYYY-MM) */
  yearMonth: string
  /** 지급 합계 */
  totalAmount: number
  /** 지급 건수 */
  paymentCount: number
}
