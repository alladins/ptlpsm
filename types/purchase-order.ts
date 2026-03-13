/**
 * 발주서 관련 타입 정의
 * @description 발주서 등록/수정/조회 시 사용되는 타입
 * @created 2026-02-09
 */

/**
 * 발주서 상태
 */
export const PO_STATUS = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  PRODUCED: 'PRODUCED',
  STOCKED: 'STOCKED'
} as const

export type PurchaseOrderStatus = typeof PO_STATUS[keyof typeof PO_STATUS]

/**
 * 발주서 상태 라벨
 */
export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PO_STATUS.DRAFT]: '작성중',
  [PO_STATUS.ISSUED]: '발행',
  [PO_STATUS.ACCEPTED]: '접수',
  [PO_STATUS.REJECTED]: '반려',
  [PO_STATUS.IN_PRODUCTION]: '생산중',
  [PO_STATUS.PRODUCED]: '생산완료',
  [PO_STATUS.STOCKED]: '입고완료'
}

/**
 * 발주서 상태 색상 매핑 (Tailwind 클래스)
 */
export const PO_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  [PO_STATUS.DRAFT]: 'bg-gray-100 text-gray-700',
  [PO_STATUS.ISSUED]: 'bg-blue-100 text-blue-700',
  [PO_STATUS.ACCEPTED]: 'bg-teal-100 text-teal-700',
  [PO_STATUS.REJECTED]: 'bg-red-100 text-red-700',
  [PO_STATUS.IN_PRODUCTION]: 'bg-yellow-100 text-yellow-700',
  [PO_STATUS.PRODUCED]: 'bg-green-100 text-green-700',
  [PO_STATUS.STOCKED]: 'bg-purple-100 text-purple-700'
}

/**
 * 발주서 목록 응답 (목록 조회용)
 */
export interface PurchaseOrderListItem {
  /** 발주서 ID */
  poId: number
  /** 발주서 번호 */
  poNo: string
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 발주일자 */
  orderDate: string | null
  /** 납기 예정일 */
  expectedCompletionDate: string | null
  /** 발주서 상태 */
  status: PurchaseOrderStatus
  /** 총 수량 */
  totalQuantity: number
  /** 총 금액 */
  totalAmount: number
  /** 생성일시 */
  createdAt: string
  /** 생성자 */
  createdBy: string
}

/**
 * 발주서 품목 (목록/상세 공통)
 */
export interface PurchaseOrderItem {
  /** 발주서 품목 ID */
  poiId: number
  /** 발주서 ID */
  poId: number
  /** SKU ID */
  skuId: string
  /** SKU명 */
  skuName: string
  /** 품목명 */
  itemName: string
  /** 발주 수량 */
  quantity: number
  /** 출하에서 가져온 수량 */
  shipmentQuantity: number
  /** 단가 */
  unitPrice: number
  /** 금액 (quantity × unitPrice) */
  amount: number
  /** 생산 완료 수량 */
  producedQuantity: number
  /** 입고 완료 수량 */
  stockedQuantity: number
}

/**
 * 발주서 상세 응답
 */
export interface PurchaseOrderDetail {
  /** 발주서 ID */
  poId: number
  /** 발주서 번호 */
  poNo: string
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 발주일자 */
  orderDate: string | null
  /** 납기 예정일 */
  expectedCompletionDate: string | null
  /** 발주서 상태 */
  status: PurchaseOrderStatus
  /** 총 수량 */
  totalQuantity: number
  /** 총 금액 */
  totalAmount: number
  /** PDF 경로 */
  pdfPath: string | null
  /** 비고 */
  remarks: string | null
  /** 발주서 품목 목록 */
  items: PurchaseOrderItem[]
  /** 생성일시 */
  createdAt: string
  /** 생성자 */
  createdBy: string
  /** 수정일시 */
  updatedAt: string
  /** 수정자 */
  updatedBy: string
  /** 접수 일시 */
  acceptedAt: string | null
  /** 접수자 */
  acceptedBy: string | null
  /** 반려 일시 */
  rejectedAt: string | null
  /** 반려자 */
  rejectedBy: string | null
  /** 반려 사유 */
  rejectReason: string | null
}

/**
 * 발주서 품목 입력 (등록/수정 시 사용)
 */
export interface PurchaseOrderItemInput {
  /** SKU ID */
  skuId: string
  /** 발주 수량 */
  quantity: number
  /** 출하에서 가져온 수량 */
  shipmentQuantity?: number
  /** 단가 (null이면 품목 기본 단가 사용) */
  unitPrice: number | null
}

/**
 * 발주서 등록 요청
 */
export interface PurchaseOrderCreateRequest {
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** 발주일자 */
  orderDate: string | null
  /** 납기 예정일 */
  expectedCompletionDate: string | null
  /** 비고 */
  remarks: string | null
  /** 발주서 품목 목록 */
  items: PurchaseOrderItemInput[]
  /** 연결된 출하 ID 목록 */
  shipmentIds?: number[]
}

/**
 * 발주서 수정 요청
 */
export interface PurchaseOrderUpdateRequest {
  /** OEM 제조사 ID */
  oemCompanyId?: number
  /** 발주일자 */
  orderDate?: string | null
  /** 납기 예정일 */
  expectedCompletionDate?: string | null
  /** 비고 */
  remarks?: string | null
  /** 발주서 품목 목록 */
  items?: PurchaseOrderItemInput[]
}

/**
 * 발주서 목록 필터
 */
export interface PurchaseOrderListFilter {
  /** 상태 (빈 문자열이면 전체) */
  status?: PurchaseOrderStatus | ''
  /** OEM 제조사 ID (null이면 전체) */
  oemCompanyId?: number | null
  /** 시작일 (발주일자 기준) */
  startDate?: string
  /** 종료일 (발주일자 기준) */
  endDate?: string
  /** 검색 키워드 (발주서 번호, OEM명) */
  keyword?: string
  /** 페이지 번호 (0-indexed) */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 (예: 'orderDate,desc') */
  sort?: string
}

/**
 * 생산완료 품목 입력
 */
export interface ProduceCompleteItem {
  /** 발주서 품목 ID */
  poiId: number
  /** 생산 완료 수량 */
  producedQuantity: number
}

/**
 * 생산완료 요청
 */
export interface ProduceCompleteRequest {
  /** 생산완료할 품목 목록 */
  items: ProduceCompleteItem[]
}

/**
 * 반려 영향 분석 - 영향받는 출하 정보
 */
export interface AffectedShipment {
  /** 출하 ID */
  shipmentId: number
  /** 출하번호 */
  shipmentNo: string
  /** 출고요청 상태 */
  dispatchStatus: string | null
  /** 출고요청 ID */
  dispatchRequestId: number | null
  /** 출고요청 취소 대상 여부 */
  willCancelDispatch: boolean
  /** 직접 연결 여부 (false면 같은 OEM/SKU의 간접 영향 출하) */
  directlyLinked: boolean
}

/**
 * 반려 영향 분석 응답
 */
export interface RejectImpactResponse {
  /** 영향받는 출하 목록 */
  affectedShipments: AffectedShipment[]
  /** 취소될 출고요청 수 */
  dispatchCancelCount: number
  /** 안내 메시지 */
  message: string
}

/**
 * 발주서 수정 가능 여부 체크
 * @param detail - 발주서 상세
 * @returns true면 수정 가능
 */
export function canEditPurchaseOrder(detail: PurchaseOrderDetail): boolean {
  // 작성중, 발행 상태만 수정 가능
  return detail.status === PO_STATUS.DRAFT || detail.status === PO_STATUS.ISSUED
}

/**
 * 발주서 삭제 가능 여부 체크
 * @param detail - 발주서 상세
 * @returns true면 삭제 가능
 */
export function canDeletePurchaseOrder(detail: PurchaseOrderDetail): boolean {
  // 작성중, 발행, 반려 상태에서 삭제 가능
  return (
    detail.status === PO_STATUS.DRAFT ||
    detail.status === PO_STATUS.ISSUED ||
    detail.status === PO_STATUS.REJECTED
  )
}

/**
 * 발주서 발행 가능 여부 체크
 * @param detail - 발주서 상세
 * @returns true면 발행 가능
 */
export function canIssuePurchaseOrder(detail: PurchaseOrderDetail): boolean {
  // 작성중 상태만 발행 가능
  return detail.status === PO_STATUS.DRAFT
}

/**
 * 발주서 접수 가능 여부 체크
 * @param detail - 발주서 상세
 * @returns true면 접수 가능
 */
export function canAcceptPurchaseOrder(detail: PurchaseOrderDetail): boolean {
  // 발행 상태에서만 접수 가능
  return detail.status === PO_STATUS.ISSUED
}

/**
 * 발주서 반려 가능 여부 체크
 * @param detail - 발주서 상세
 * @returns true면 반려 가능
 */
export function canRejectPurchaseOrder(detail: PurchaseOrderDetail): boolean {
  // 발행 또는 접수 상태에서 반려 가능
  return (
    detail.status === PO_STATUS.ISSUED ||
    detail.status === PO_STATUS.ACCEPTED
  )
}

/**
 * 생산완료 체크 가능 여부
 * @param detail - 발주서 상세
 * @returns true면 생산완료 체크 가능
 */
export function canMarkProduced(detail: PurchaseOrderDetail): boolean {
  // 발행, 접수, 생산중, 생산완료 상태에서 가능
  return (
    detail.status === PO_STATUS.ISSUED ||
    detail.status === PO_STATUS.ACCEPTED ||
    detail.status === PO_STATUS.IN_PRODUCTION ||
    detail.status === PO_STATUS.PRODUCED
  )
}
