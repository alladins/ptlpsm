/**
 * 모바일 주문 요청 관련 타입 정의
 * @description 현장소장이 모바일에서 주문을 요청하고 관리자가 처리하는 기능 관련 인터페이스
 */

import type { BaseEntity } from './common'

/**
 * 긴급도
 */
export type OrderUrgency = 'URGENT' | 'NORMAL' | 'LOW' | 'FLEXIBLE'

/** @deprecated OrderUrgency 사용 권장 */
export type MobileOrderUrgency = OrderUrgency

/** @deprecated OrderRequestStatus 사용 권장 */
export type MobileOrderStatus = OrderRequestStatus

/**
 * 주문 요청 상태
 */
export type OrderRequestStatus = 'PENDING' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

/**
 * 모바일 주문 요청
 * @description 현장소장이 모바일에서 생성하는 주문 요청
 */
export interface MobileOrderRequest extends BaseEntity {
  /** 요청 ID (PK) */
  requestId: number
  /** 연결된 주문 ID (승인 시 연결) */
  orderId: number | null
  /** 요청자 ID */
  requesterId: number
  /** 요청자명 */
  requesterName: string
  /** 요청자 연락처 */
  requesterPhone: string
  /** 현장명 */
  siteName: string
  /** 배송지 주소 */
  deliveryAddress: string
  /** 요청 납품일 */
  requestedDeliveryDate: string
  /** 긴급도 */
  urgency: OrderUrgency
  /** 요청 상태 */
  status: OrderRequestStatus
  /** 승인자 ID */
  approvedBy: number | null
  /** 승인자명 */
  approvedByName?: string
  /** 승인일시 */
  approvedAt: string | null
  /** 반려 사유 */
  rejectReason: string | null
  /** 비고 */
  remarks: string | null
  /** 요청 품목 목록 */
  items: MobileOrderRequestItem[]
  /** 요청일 (createdAt 별칭) */
  requestDate?: string
  /** 희망 납품일 (requestedDeliveryDate 별칭) */
  desiredDeliveryDate?: string
  /** 품목 수 */
  itemCount?: number
  /** 긴급 여부 */
  isUrgent?: boolean
  /** 추가 메모 */
  additionalNotes?: string
  /** 처리일 */
  processedDate?: string
  /** 연결된 납품요구번호 */
  linkedDeliveryRequestNo?: string
}

/**
 * 모바일 주문 요청 품목
 */
export interface MobileOrderRequestItem {
  /** 항목 ID (PK) */
  id: number
  /** 요청 ID (FK) */
  requestId: number
  /** 품목 ID (FK) */
  itemId: number
  /** 품목명 */
  itemName: string
  /** 규격 */
  specification: string
  /** 요청 수량 */
  quantity: number
  /** 단위 */
  unit: string
  /** 품목별 비고 */
  remarks: string | null
  /** 비고 (remarks 별칭) */
  note?: string
}

/**
 * 모바일 주문 요청 목록 항목 (간소화)
 */
export interface MobileOrderRequestListItem {
  requestId: number
  requesterId: number
  requesterName: string
  siteName: string
  requestedDeliveryDate: string
  urgency: OrderUrgency
  status: OrderRequestStatus
  /** 품목 수 */
  itemCount: number
  /** 요청일시 */
  createdAt: string
  /** 신규 여부 (관리자 확인 전) */
  isNew?: boolean
  /** 요청일 (createdAt 별칭) */
  requestDate?: string
  /** 희망 납품일 (requestedDeliveryDate 별칭) */
  desiredDeliveryDate?: string
  /** 긴급 여부 */
  isUrgent?: boolean
  /** 연결된 납품요구번호 */
  linkedDeliveryRequestNo?: string
  /** 반려 사유 */
  rejectReason?: string | null
}

/**
 * 모바일 주문 요청 생성 요청
 */
/** @deprecated MobileOrderCreateRequest 사용 권장 */
export type MobileOrderRequestCreateRequest = MobileOrderCreateRequest

export interface MobileOrderCreateRequest {
  /** 현장명 */
  siteName: string
  /** 배송지 주소 */
  deliveryAddress: string
  /** 요청 납품일 */
  requestedDeliveryDate?: string
  /** 희망 납품일 (requestedDeliveryDate 별칭) */
  desiredDeliveryDate?: string
  /** 긴급도 */
  urgency: OrderUrgency
  /** 비고 */
  remarks?: string
  /** 추가 요청사항 */
  additionalNotes?: string
  /** 요청 품목 목록 */
  items: MobileOrderItemCreateRequest[]
}

/**
 * 모바일 주문 요청 품목 생성 요청
 */
export interface MobileOrderItemCreateRequest {
  /** 품목 ID */
  itemId: number | string
  /** SKU ID */
  skuId?: number | string
  /** 요청 수량 */
  quantity: number
  /** 품목별 비고 */
  remarks?: string
  /** 비고 (remarks 별칭) */
  note?: string
}

/**
 * 주문 요청 검색 파라미터 (관리자용)
 */
export interface OrderRequestSearchParams {
  /** 상태 필터 */
  status?: OrderRequestStatus | ''
  /** 긴급도 필터 */
  urgency?: OrderUrgency | ''
  /** 시작 날짜 */
  startDate?: string
  /** 종료 날짜 */
  endDate?: string
  /** 검색 키워드 (현장명, 요청자명) */
  search?: string
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 */
  sort?: string
}

/**
 * 주문 요청 승인 요청
 */
export interface OrderRequestApproveRequest {
  /** 연결할 주문 ID */
  orderId: number
}

/**
 * 주문 요청 반려 요청
 */
export interface OrderRequestRejectRequest {
  /** 반려 사유 */
  reason: string
}

/**
 * 주문 요청 목록 응답
 */
export interface MobileOrderRequestListResponse {
  content: MobileOrderRequestListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 긴급도 표시 정보
 */
export interface UrgencyDisplayInfo {
  /** 코드 */
  code: OrderUrgency
  /** 라벨 */
  label: string
  /** 배지 클래스 */
  badgeClass: string
  /** 아이콘 */
  icon: string
}

/**
 * 긴급도 표시 설정
 */
export const URGENCY_DISPLAY: Record<OrderUrgency, UrgencyDisplayInfo> = {
  URGENT: {
    code: 'URGENT',
    label: '긴급',
    badgeClass: 'bg-red-100 text-red-800',
    icon: '🚨'
  },
  NORMAL: {
    code: 'NORMAL',
    label: '보통',
    badgeClass: 'bg-gray-100 text-gray-800',
    icon: ''
  },
  LOW: {
    code: 'LOW',
    label: '여유',
    badgeClass: 'bg-green-100 text-green-800',
    icon: ''
  },
  FLEXIBLE: {
    code: 'FLEXIBLE',
    label: '여유',
    badgeClass: 'bg-green-100 text-green-800',
    icon: ''
  }
}

/**
 * 요청 상태 표시 정보
 */
export interface RequestStatusDisplayInfo {
  /** 코드 */
  code: OrderRequestStatus
  /** 라벨 */
  label: string
  /** 배지 클래스 */
  badgeClass: string
}

/**
 * 요청 상태 표시 설정
 */
export const REQUEST_STATUS_DISPLAY: Record<OrderRequestStatus, RequestStatusDisplayInfo> = {
  PENDING: {
    code: 'PENDING',
    label: '대기',
    badgeClass: 'bg-yellow-100 text-yellow-800'
  },
  REQUESTED: {
    code: 'REQUESTED',
    label: '접수',
    badgeClass: 'bg-yellow-100 text-yellow-800'
  },
  APPROVED: {
    code: 'APPROVED',
    label: '승인',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  REJECTED: {
    code: 'REJECTED',
    label: '반려',
    badgeClass: 'bg-red-100 text-red-800'
  },
  COMPLETED: {
    code: 'COMPLETED',
    label: '완료',
    badgeClass: 'bg-green-100 text-green-800'
  }
}
