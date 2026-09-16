/**
 * 운송사 월별 운송비 원장
 *
 * ⚠ 대상은 «리드파워 부담(LP_BEARS)» 운송비뿐이다.
 *   OEM_BEARS   = 제조사가 자기 돈으로 냄 → 리드파워 장부와 무관
 *   PAID_TO_OEM = 제조사에게 주는 돈 → OEM 월별 매출원장에 이미 가산됨
 *   여기에 함께 담으면 같은 돈이 두 원장에 잡힌다.
 */

/** 원장 한 줄 = 출하 1건 */
export interface CarrierLedgerItem {
  shipmentId: number
  shipmentNo: string | null
  shipmentDate: string | null
  deliveryRequestNo: string | null
  client: string | null
  deliveryAddress: string | null
  receiverName: string | null
  /** 누가 만든 물건을 실었는지 (운송사 청구와는 무관한 참고 정보) */
  oemCompanyName: string | null
  shippingCost: number
}

/** 월별 원장 응답 */
export interface CarrierMonthlyLedger {
  carrierCompanyId: number | null
  /** 전체 조회면 '전체' */
  carrierCompanyName: string
  yearMonth: string
  items: CarrierLedgerItem[]
  shipmentCount: number
  totalShippingCost: number
  /** 참고값 — 실제 청구는 운송사 세금계산서를 따른다 */
  vatAmount: number
  totalWithVat: number
}

/** 운송사 목록 + 해당 월 실적 (드롭다운·요약 카드 공용) */
export interface CarrierSummary {
  carrierCompanyId: number
  carrierCompanyName: string
  shipmentCount: number
  totalShippingCost: number
}
