/**
 * 출하 관련 타입 정의
 * @description 출하 등록/수정 시 OEM, 배송지, 현장담당자 정보 포함
 * @created 2026-01-26
 */

/**
 * 출하 등록 요청 (변경된 API)
 */
export interface ShipmentCreateRequest {
  /** 발주 ID */
  orderId: number
  /** 출하일자 */
  shipmentDate: string
  /** 출하 품목 목록 */
  items: ShipmentCreateItemRequest[]

  // 신규 추가 필드
  /** OEM 제조사 ID (필수) */
  oemCompanyId: number
  /** 현장담당자 ID */
  siteManagerId?: number
  /** 우편번호 */
  zipcode?: string
  /** 배송지 주소 */
  deliveryAddress?: string
  /** 상세주소 */
  addressDetail?: string
  /** 현장 인수자명 */
  receiverName?: string
  /** 현장 인수자 연락처 */
  receiverPhone?: string
}

/**
 * 출하 품목 등록 요청
 */
export interface ShipmentCreateItemRequest {
  /** SKU ID */
  skuId: string
  /** 출하 수량 */
  shipmentQuantity: number
}

/**
 * 출하 수정 요청
 */
export interface ShipmentUpdateRequest {
  /** 출하일자 */
  shipmentDate?: string
  /** 출하 품목 목록 */
  items?: ShipmentCreateItemRequest[]

  // OEM/배송지 필드 (수정 가능)
  /** OEM 제조사 ID */
  oemCompanyId?: number
  /** 현장담당자 ID */
  siteManagerId?: number
  /** 우편번호 */
  zipcode?: string
  /** 배송지 주소 */
  deliveryAddress?: string
  /** 상세주소 */
  addressDetail?: string
  /** 현장 인수자명 */
  receiverName?: string
  /** 현장 인수자 연락처 */
  receiverPhone?: string
}

/**
 * 출하 생성/상세 응답 (변경된 API)
 */
export interface ShipmentResponse {
  /** 출하 ID */
  shipmentId: number
  /** 발주 ID */
  orderId: number
  /** 출하일자 */
  shipmentDate: string
  /** 송장번호 */
  trackingNumber: string
  /** 출하 상태 */
  status: string

  // OEM 정보 (신규)
  /** OEM 제조사 ID */
  oemCompanyId: number | null
  /** OEM 제조사명 */
  oemCompanyName: string | null

  // 현장담당자 정보 (신규)
  /** 현장담당자 ID */
  siteManagerId: number | null
  /** 현장담당자명 */
  siteManagerName: string | null
  /** 현장담당자 연락처 */
  siteManagerPhone: string | null

  // 배송지 정보 (신규)
  /** 우편번호 */
  zipcode: string | null
  /** 배송지 주소 */
  deliveryAddress: string | null
  /** 상세주소 */
  addressDetail: string | null
  /** 현장 인수자명 */
  receiverName: string | null
  /** 현장 인수자 연락처 */
  receiverPhone: string | null

  // 발주서 관련 (신규)
  /** 발주서 PDF 경로 */
  purchaseOrderPdfPath: string | null

  // 상태 플래그 (신규)
  /** 기성 포함 여부 (true면 수정 불가) */
  isBilled: boolean
  /** 납품완료계 상태 */
  deliveryDoneStatus: string | null
  /** 마지막 출하 여부 */
  isFinalShipment: boolean

  // 메타 정보
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
}

/**
 * 발주서 PDF 생성 응답
 */
export interface PurchaseOrderGenerateResponse {
  /** 성공 여부 */
  success: boolean
  /** 메시지 */
  message: string
  /** 생성 시각 */
  timestamp: string
}

/**
 * 출하 수정 가능 여부 체크
 * @param response - 출하 응답
 * @returns true면 수정 가능
 */
export function canEditShipment(response: ShipmentResponse): boolean {
  // 기성 포함되면 수정 불가
  if (response.isBilled) return false
  // 납품완료계가 COMPLETED면 수정 불가
  if (response.deliveryDoneStatus === 'COMPLETED') return false
  return true
}

/**
 * 출하 상태 상수
 */
export const SHIPMENT_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

export type ShipmentStatus = typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS]

/**
 * 출하 상태 라벨
 */
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  [SHIPMENT_STATUS.PENDING]: '대기',
  [SHIPMENT_STATUS.IN_PROGRESS]: '진행중',
  [SHIPMENT_STATUS.COMPLETED]: '완료',
  [SHIPMENT_STATUS.CANCELLED]: '취소'
}
