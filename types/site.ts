/**
 * 현장(프로젝트) 마스터 타입
 *
 * 현장소장이 모바일에서 토큰 URL로 누적 주문요청을 등록할 수 있는 현장 마스터.
 * 발주(orders)와는 완전 분리된 독립 audit 자료.
 */

export interface Site {
  siteId: number
  /** 연관 발주(orders) ID */
  orderId: number | null
  /** 연관 발주의 납품요구번호 (표시용, JOIN) */
  orderDeliveryRequestNo?: string | null
  projectName: string
  client: string | null
  siteAddress: string | null
  managerName: string | null
  managerPhone: string | null
  note: string | null

  /** 토큰 정보 */
  accessToken: string
  tokenExpiresAt: string
  tokenGeneratedAt: string
  tokenLastUsedAt: string | null

  active: boolean

  createdBy: number
  createdByName?: string
  createdAt: string
  updatedBy: number | null
  updatedByName?: string
  updatedAt: string
  deletedAt: string | null

  /** 이 현장에 등록된 주문요청 누적 건수 (참고) */
  requestCount?: number
}

export interface SiteCreateRequest {
  /** 연관 발주(orders) ID - 신규 등록 시 필수 */
  orderId: number
  projectName: string
  client?: string
  siteAddress?: string
  managerName?: string
  managerPhone?: string
  note?: string
}

/** 수정 시에는 orderId 변경 불가 */
export interface SiteUpdateRequest {
  projectName: string
  client?: string
  siteAddress?: string
  managerName?: string
  managerPhone?: string
  note?: string
}

export interface SiteSearchParams {
  keyword?: string
  client?: string
  active?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface SiteTokenInfo {
  siteId: number
  accessToken: string
  tokenExpiresAt: string
  tokenGeneratedAt: string
  /** 백엔드가 조립한 URL (없으면 프론트가 location.origin 으로 조합) */
  accessUrl: string
}

/**
 * 토큰 기반 진입 시 현장소장이 보는 프로필 응답
 */
export interface SiteProfile {
  siteId: number
  /** 연관 발주(orders) ID — 신규 모바일 주문 요청 화면에서 표시용으로 사용 */
  orderId: number | null
  /** 연관 발주의 납품요구번호 (orders.delivery_request_no, JOIN) */
  deliveryRequestNo: string | null
  projectName: string
  client: string
  siteAddress: string
  managerName: string
  managerPhone: string
  tokenExpiresAt: string
}
