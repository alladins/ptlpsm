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
 * 발주서 목록 «상태» 검색 드롭다운용 라벨
 *
 * ★ 입고완료(STOCKED)는 뺀다 (2026-09-21).
 *   본사 «바로 입고» 발주서(기능은 2026-09-21 제거, 기존분만 남음)가 이 상태이고, 서버가 목록에서 아예 제외하므로
 *   드롭다운에 남겨 두면 고를 수는 있는데 결과가 늘 0건이 된다.
 *   그 물량의 입출고 내역은 재고현황 히스토리에서 확인한다.
 * ⚠ 상세 화면의 상태 배지는 PO_STATUS_LABELS 를 그대로 쓴다 — 거기서는 표시되어야 한다.
 */
export const PO_STATUS_SEARCH_LABELS: Partial<Record<PurchaseOrderStatus, string>> =
  Object.fromEntries(
    Object.entries(PO_STATUS_LABELS).filter(([key]) => key !== PO_STATUS.STOCKED)
  ) as Partial<Record<PurchaseOrderStatus, string>>

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
  /** 회사 유형 (MANUFACTURER / LEADPOWER) */
  companyType?: string | null
  /** 생산자 회사 ID — null 이면 명의(oemCompanyId)와 동일하다는 뜻 */
  sourceOemCompanyId?: number | null
  /** 생산자 회사명 */
  sourceOemCompanyName?: string | null
  /** 가공비 (원장 가산) */
  processingFee?: number | null
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
  /** OEM 제조사 ID (거래 명의) */
  oemCompanyId: number
  /** 생산자 회사 ID — 명의와 실제 제조사가 다를 때만 지정. 같으면 보내지 않는다(null=동일) */
  sourceOemCompanyId?: number | null
  /** 가공비 — OEM 에 가공을 요청하고 지불하는 비용. 발주일 기준월 원장에 가산된다 */
  processingFee?: number | null
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
  /** OEM 제조사 ID (거래 명의) */
  oemCompanyId?: number
  /** 생산자 회사 ID — 명의와 실제 제조사가 다를 때만 지정 */
  sourceOemCompanyId?: number | null
  /** 가공비 */
  processingFee?: number | null
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
