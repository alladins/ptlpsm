/**
 * 출하 수량 추가변경 관련 타입 정의
 * @description 출하 진행 중/서명 완료 후 수량 변경 기능을 위한 인터페이스
 */

/**
 * 추가변경 요청 품목
 */
export interface AdditionalChangeItem {
  /** SKU ID */
  skuId: string
  /** 현재 수량 */
  currentQuantity: number
  /** 변경 수량 */
  newQuantity: number
}

/**
 * 추가변경 요청
 */
export interface AdditionalChangeRequest {
  /** 출하 ID */
  shipmentId: number
  /** 변경 품목 목록 */
  items: AdditionalChangeItem[]
  /** 변경 사유 (필수) */
  changeReason: string
  /** 기존 서명 재사용 여부 (디폴트: true) */
  reuseSignature?: boolean
}

/**
 * 추가변경 응답
 */
export interface AdditionalChangeResponse {
  /** 성공 여부 */
  success: boolean
  /** 재서명 필요 여부 (서명 완료 상태였는지) */
  requiresResign: boolean
  /** 변경 후 출하 상태 */
  shipmentStatus: string
  /** 변경된 품목 목록 */
  changedItems: {
    itemId: number
    itemName: string
    beforeQuantity: number
    afterQuantity: number
  }[]
  /** 에러 메시지 (실패 시) */
  errorMessage?: string
}

/**
 * 수량 변경 이력 (서버 응답 - 품목별 개별 레코드)
 */
export interface QuantityChangeHistoryRaw {
  /** 이력 ID */
  historyId: number
  /** 출하 ID */
  shipmentId: number
  /** SKU ID */
  skuId: string
  /** 품목명 */
  itemName: string
  /** SKU명 */
  skuName: string
  /** 변경 전 수량 */
  oldQuantity: number
  /** 변경 후 수량 */
  newQuantity: number
  /** 변경 사유 */
  changeReason: string
  /** 변경자 ID */
  changedBy: string
  /** 변경자명 */
  changedByName: string
  /** 변경 일시 */
  changedAt: string
}

/**
 * 수량 변경 이력 품목 (그룹화된 뷰용)
 */
export interface QuantityChangeHistoryItem {
  /** SKU ID */
  skuId: string
  /** 품목명 */
  itemName: string
  /** SKU명 */
  skuName: string
  /** 변경 전 수량 */
  beforeQuantity: number
  /** 변경 후 수량 */
  afterQuantity: number
}

/**
 * 수량 변경 이력 (그룹화된 뷰용 - changedAt + changeReason 기준)
 */
export interface QuantityChangeHistory {
  /** 그룹 키 (changedAt + changeReason) */
  groupKey: string
  /** 출하 ID */
  shipmentId: number
  /** 변경 일시 */
  changedAt: string
  /** 변경자명 */
  changedBy: string
  /** 변경 사유 */
  changeReason: string
  /** 변경 품목 목록 */
  items: QuantityChangeHistoryItem[]
  /** 해당 시점 인수증 URL (서명 완료 후 변경 시) */
  previousReceiptUrl?: string
}

/**
 * 이전 인수증 정보
 */
export interface PreviousReceipt {
  /** 인수증 ID */
  receiptId: number
  /** 생성 일시 */
  createdAt: string
  /** PDF 파일 URL */
  pdfUrl: string
  /** 변경 사유 (해당 인수증 무효화 사유) */
  invalidationReason?: string
}

/**
 * 출하 상태 (추가변경 관련)
 */
export type ShipmentChangeableStatus =
  | 'PENDING'           // 대기 - 변경 가능
  | 'IN_PROGRESS'       // 진행중 - 변경 가능
  | 'PENDING_SIGNATURE' // 운송완료/서명대기 - 변경 가능 (재서명 필요)
  | 'COMPLETED'         // 기성완료/납품완료 - 변경 불가
  | 'CANCELLED'         // 취소 - 변경 불가
