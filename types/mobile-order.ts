/**
 * 모바일 주문 요청 관련 타입 (v5)
 *
 * - 토큰 단위: 현장(site) 1개당 1개
 * - 발주(orders)와는 완전 분리. delivery_request_no 정확 일치로 참고 매칭만 함.
 * - 백엔드 DB(V1.2.7+, V1.2.28+) 단일 진실 → 프론트 타입 정합.
 */

import type { BaseEntity } from './common'

/** 긴급도 */
export type OrderUrgency = 'URGENT' | 'NORMAL' | 'LOW'

/** 주문 요청 상태 (v5: 4개로 축소) */
export type OrderRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

/**
 * 모바일 주문 요청
 */
export interface MobileOrderRequest extends BaseEntity {
  requestId: number
  requestNo: string

  /** 현장 ID (sites FK, v5 토큰 진입 시 자동 설정) */
  siteId: number | null
  /** 현장 프로젝트명 (sites JOIN) */
  siteProjectName?: string

  /** 발주 ID (관리자 직접 등록 시; 토큰 기반은 NULL — deprecated 경로) */
  orderId: number | null

  /** 납품요구번호 (발주 참고 매칭 키, 선택) */
  deliveryRequestNo: string | null

  /** 프로젝트명 (요청 시점 스냅샷; site.project_name 으로 prefill) */
  projectName: string | null

  /** 수요기관 (참고) */
  client: string | null

  /** 요청자 ID (관리자 직접 등록 시; 토큰 기반은 NULL) */
  requesterId: number | null

  /** 요청자명 */
  requesterName: string

  /** 요청자 연락처 */
  requesterPhone: string | null

  urgency: OrderUrgency
  desiredDeliveryDate: string
  requestReason: string | null

  status: OrderRequestStatus

  /** 처리자 user_id */
  processedBy: number | null
  /** 처리자명 (users JOIN) */
  processedByName: string | null
  processedAt: string | null
  rejectReason: string | null

  items: MobileOrderRequestItem[]
}

export interface MobileOrderRequestItem {
  requestItemId: number
  requestId: number
  /** 품목 식별자 (물품분류번호, 백엔드 String 과 정합) */
  itemId: string
  itemName: string
  specification: string | null
  requestQuantity: number
  remark: string | null
}

/**
 * 모바일 신규 주문 요청 - 품목 선택 팝업 항목
 * (백엔드 MobileItemListItem 응답)
 */
export interface MobileItemListItem {
  itemId: string
  itemName: string
  specification: string | null
  unit: string | null
}

/**
 * 모바일 주문 요청 목록 항목 (간소화 — 목록 화면용)
 */
export interface MobileOrderRequestListItem {
  requestId: number
  requestNo: string
  siteId: number | null
  siteProjectName?: string
  requesterName: string
  requesterPhone: string | null
  urgency: OrderUrgency
  status: OrderRequestStatus
  desiredDeliveryDate: string
  deliveryRequestNo: string | null
  createdAt: string
  processedByName?: string | null
}

/**
 * 신규 주문 요청 생성 페이로드 (모바일 폼)
 */
export interface MobileOrderCreateRequest {
  /** 요청자명 (토큰 기반 다인 식별, 필수) */
  requesterName: string
  /** 요청자 연락처 (필수) */
  requesterPhone: string

  urgency: OrderUrgency
  desiredDeliveryDate: string
  requestReason?: string

  /** (선택) 납품요구번호 — 발주 참고 매칭에 사용 */
  deliveryRequestNo?: string

  items: MobileOrderItemCreateRequest[]
}

export interface MobileOrderItemCreateRequest {
  /** 품목 식별자 (물품분류번호, 백엔드 String 과 정합) */
  itemId: string
  itemName: string
  specification?: string
  requestQuantity: number
  remark?: string
}

/**
 * 관리자 검색 파라미터
 */
export interface OrderRequestSearchParams {
  keyword?: string
  status?: OrderRequestStatus | ''
  urgency?: OrderUrgency | ''
  startDate?: string
  endDate?: string
  siteId?: number
  deliveryRequestNo?: string
  page?: number
  size?: number
  sort?: string
}

/**
 * 관리자 승인 페이로드 (현재는 비어 있어도 됨 - 향후 발주 자동 연결 옵션)
 */
export interface OrderRequestApproveRequest {
  orderId?: number
}

/**
 * 관리자 반려 페이로드
 */
export interface OrderRequestRejectRequest {
  reason: string
}

/**
 * 관리자 검색 응답 (Spring Page)
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

// ===== 표시용 라벨/배지 =====

export interface UrgencyDisplayInfo {
  code: OrderUrgency
  label: string
  badgeClass: string
  icon: string
}

export const URGENCY_DISPLAY: Record<OrderUrgency, UrgencyDisplayInfo> = {
  URGENT: { code: 'URGENT', label: '긴급', badgeClass: 'bg-red-100 text-red-800', icon: '🚨' },
  NORMAL: { code: 'NORMAL', label: '보통', badgeClass: 'bg-gray-100 text-gray-800', icon: '' },
  LOW:    { code: 'LOW',    label: '여유', badgeClass: 'bg-green-100 text-green-800', icon: '' }
}

export interface RequestStatusDisplayInfo {
  code: OrderRequestStatus
  label: string
  badgeClass: string
}

export const REQUEST_STATUS_DISPLAY: Record<OrderRequestStatus, RequestStatusDisplayInfo> = {
  PENDING:   { code: 'PENDING',   label: '대기',  badgeClass: 'bg-yellow-100 text-yellow-800' },
  APPROVED:  { code: 'APPROVED',  label: '승인',  badgeClass: 'bg-blue-100 text-blue-800' },
  REJECTED:  { code: 'REJECTED',  label: '반려',  badgeClass: 'bg-red-100 text-red-800' },
  CANCELLED: { code: 'CANCELLED', label: '취소',  badgeClass: 'bg-gray-100 text-gray-800' }
}
