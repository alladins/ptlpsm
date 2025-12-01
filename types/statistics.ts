/**
 * 통계 관련 타입 정의
 *
 * @description 출하현황 통계 등 통계 관련 데이터 타입
 * @created 2024-12-01
 */

// ============================================
// 공통 타입
// ============================================

/** 조회 단위 */
export type PeriodUnit = 'daily' | 'weekly' | 'monthly'

/** 상태 코드 */
export type ShipmentStatus =
  | 'PENDING'           // 대기 (출하 전)
  | 'IN_PROGRESS'       // 진행중 (배송중)
  | 'PENDING_SIGNATURE' // 서명대기 (배송완료, 납품확인 대기)
  | 'COMPLETED'         // 납품완료 (납품완료계 작성 완료)
  | 'CANCELLED'         // 취소

// ============================================
// 출하현황 통계 타입
// ============================================

/** 출하현황 통계 검색 요청 */
export interface ShipmentStatisticsRequest {
  /** 조회 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 조회 종료일 (YYYY-MM-DD) */
  endDate: string
  /** 조회 단위 */
  periodUnit: PeriodUnit
  /** 상태 필터 (선택) */
  status?: ShipmentStatus
}

/** 상태별 건수 */
export interface StatusCount {
  pending: number          // 대기
  inProgress: number       // 진행중 (배송중)
  pendingSignature: number // 서명대기
  completed: number        // 납품완료
  cancelled: number        // 취소
}

/** 요약 정보 */
export interface ShipmentStatisticsSummary {
  /** 총 납품요구 건수 */
  totalOrderCount: number
  /** 총 출하 건수 */
  totalShipmentCount: number
  /** 총 납품요구 금액 (원) */
  totalOrderAmount: number
  /** 총 출하 금액 (원) */
  totalShipmentAmount: number
  /** 납품완료율 (%) */
  completionRate: number
  /** 상태별 건수 */
  statusCount: StatusCount
}

/** 기간별 추이 데이터 */
export interface PeriodTrendItem {
  /** 기간 (일: 2024-01-01, 주: 2024-W01, 월: 2024-01) */
  period: string
  /** 납품요구 건수 */
  orderCount: number
  /** 출하 금액 */
  shipmentAmount: number
  /** 완료 건수 */
  completedCount: number
  /** 납품완료율 (%) */
  completionRate: number
}

/** 지역별 현황 데이터 */
export interface RegionBreakdownItem {
  /** 지역명 */
  region: string
  /** 납품요구 건수 */
  orderCount: number
  /** 출하 금액 */
  shipmentAmount: number
  /** 납품완료율 (%) */
  completionRate: number
}

/** 최근 납품요구 목록 아이템 */
export interface RecentOrderItem {
  /** 발주 ID */
  orderId: number
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 수요기관명 */
  client: string
  /** 지역 */
  region: string
  /** 출하일자 */
  shipmentDate: string
  /** 출하금액 */
  amount: number
  /** 상태 */
  status: ShipmentStatus
  /** 납품완료율 (%) */
  completionRate: number
}

/** 최근 출하 목록 아이템 */
export interface RecentShipmentItem {
  /** 출하 ID */
  shipmentId: number
  /** 발주 ID */
  orderId: number
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 수요기관명 */
  client: string
  /** 지역 */
  region: string
  /** 출하일자 */
  shipmentDate: string
  /** 출하금액 */
  amount: number
  /** 상태 */
  status: ShipmentStatus
  /** 차량번호 */
  vehicleNo: string | null
}

/** 출하현황 통계 응답 */
export interface ShipmentStatisticsResponse {
  /** 요약 정보 */
  summary: ShipmentStatisticsSummary
  /** 기간별 추이 */
  periodTrend: PeriodTrendItem[]
  /** 지역별 현황 */
  regionBreakdown: RegionBreakdownItem[]
  /** 최근 납품요구 목록 */
  recentOrders: RecentOrderItem[]
  /** 최근 출하 목록 */
  recentShipments: RecentShipmentItem[]
}

// ============================================
// 상수 정의
// ============================================

/** 조회 단위 라벨 */
export const PERIOD_UNIT_LABELS: Record<PeriodUnit, string> = {
  daily: '일별',
  weekly: '주별',
  monthly: '월별'
}

/** 상태 라벨 */
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: '대기',
  IN_PROGRESS: '진행중',
  PENDING_SIGNATURE: '서명대기',
  COMPLETED: '납품완료',
  CANCELLED: '취소'
}

/** 상태별 색상 클래스 */
export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  PENDING_SIGNATURE: 'pending-signature',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}
