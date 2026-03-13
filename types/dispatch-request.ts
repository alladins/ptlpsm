/**
 * 출고요청 관련 타입 정의
 * @description 출고요청 등록/조회/상태 관리 시 사용되는 타입
 * @created 2026-02-09
 */

/**
 * 출고요청 상태
 */
export type DispatchRequestStatus = 'REQUESTED' | 'CONFIRMED' | 'DISPATCHED' | 'COMPLETED'

/**
 * 출고요청 상태 라벨
 */
export const DISPATCH_STATUS_LABELS: Record<DispatchRequestStatus, string> = {
  REQUESTED: '출고요청',
  CONFIRMED: '확인됨',
  DISPATCHED: '발송완료',
  COMPLETED: '완료'
}

/**
 * 출고요청 상태 색상 매핑 (Tailwind 클래스)
 */
export const DISPATCH_STATUS_COLORS: Record<DispatchRequestStatus, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-purple-100 text-purple-700'
}

/**
 * 출고요청 상세 응답
 */
export interface DispatchRequest {
  /** 출고요청 ID */
  dispatchRequestId: number
  /** 출하 ID */
  shipmentId: number
  /** 출하번호 */
  shipmentNo: string
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 창고 ID */
  warehouseId: number | null
  /** 창고명 */
  warehouseName: string | null
  /** 출고요청 상태 */
  status: DispatchRequestStatus
  /** 우편번호 */
  zipcode: string | null
  /** 배송지 주소 */
  deliveryAddress: string | null
  /** 상세주소 */
  addressDetail: string | null
  /** 현장 도착 예정일시 */
  expectedArrivalDatetime: string | null
  /** 현장소장 ID */
  siteManagerId: number | null
  /** 현장소장명 */
  siteManagerName: string | null
  /** 현장소장 연락처 */
  siteManagerPhone: string | null
  /** 인수자명 */
  receiverName: string | null
  /** 인수자 연락처 */
  receiverPhone: string | null
  /** 요청일시 */
  requestedAt: string | null
  /** 요청자 */
  requestedBy: string | null
  /** 확인일시 */
  confirmedAt: string | null
  /** 확인자 */
  confirmedBy: string | null
  /** 비고 */
  remarks: string | null
  /** 생성일시 */
  createdAt: string
  /** 수정일시 */
  updatedAt: string
}

/**
 * 출고요청 생성 요청
 */
export interface DispatchRequestCreateInput {
  /** 출하 ID */
  shipmentId: number
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** 창고 ID */
  warehouseId?: number | null
  /** 우편번호 */
  zipcode?: string
  /** 배송지 주소 */
  deliveryAddress?: string
  /** 상세주소 */
  addressDetail?: string
  /** 현장 도착 예정일시 */
  expectedArrivalDatetime?: string
  /** 현장소장 ID */
  siteManagerId?: number | null
  /** 현장소장명 */
  siteManagerName?: string
  /** 현장소장 연락처 */
  siteManagerPhone?: string
  /** 인수자명 */
  receiverName?: string
  /** 인수자 연락처 */
  receiverPhone?: string
  /** 비고 */
  remarks?: string
  /** 건설사 ID */
  builderCompanyId?: number | null
  /** 건설사명 */
  builderCompanyName?: string
}

/**
 * 품목별 가용성 정보
 */
export interface ItemAvailability {
  /** SKU ID */
  skuId: string
  /** SKU명 */
  skuName: string | null
  /** 출하 필요 수량 */
  requiredQuantity: number
  /** OEM 창고 재고 수량 */
  inventoryQuantity: number
  /** 발주서(ISSUED+) 존재 여부 */
  hasIssuedPo: boolean
  /** 관련 발주서 번호 */
  poNo: string | null
  /** 충족 여부 */
  sufficient: boolean
}

/**
 * 출고요청 가용성 확인 응답
 */
export interface DispatchAvailabilityResponse {
  /** 전체 가용 여부 */
  available: boolean
  /** 요약 메시지 */
  message: string
  /** 품목별 가용성 상세 */
  items: ItemAvailability[]
}

/**
 * 품목별 재고 현황
 */
export interface InventoryItemStatus {
  skuId: string
  skuName: string | null
  /** 출하 필요수량 */
  requiredQuantity: number
  /** 미입고 발주수량 (ISSUED/IN_PRODUCTION 상태) */
  orderedQuantity: number
  /** 재고수량 (OEM 창고 현재 재고) */
  inventoryQuantity: number
  /** 총 생산수량 (PRODUCED PO 기준) */
  totalProducedQuantity: number
  /** 총 출고수량 (운송장 기출고) */
  totalDispatchedQuantity: number
  /** 부족수량 */
  shortageQuantity: number
  /** 충족 여부 */
  sufficient: boolean
  /** 입고 대기 여부 (PO 발주는 있으나 물리 재고 미입고) */
  pendingInbound?: boolean
}

/**
 * 재고 현황 확인 응답
 */
export interface InventoryStatusResponse {
  canDispatch: boolean
  message: string
  /** OEM 제조사 ID */
  oemCompanyId: number | null
  /** OEM 제조사명 */
  oemCompanyName: string | null
  items: InventoryItemStatus[]
}

/**
 * 출고요청 목록 필터
 */
export interface DispatchRequestListFilter {
  /** 출하 ID */
  shipmentId?: number
  /** OEM 제조사 ID */
  oemCompanyId?: number
  /** 상태 */
  status?: string
  /** 시작일 */
  startDate?: string
  /** 종료일 */
  endDate?: string
  /** 페이지 번호 (0-indexed) */
  page?: number
  /** 페이지 크기 */
  size?: number
}
