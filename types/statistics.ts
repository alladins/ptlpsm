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
  /** 납품요구 건수 (실제로는 출하 건수) */
  orderCount: number
  /** 출하 금액 */
  shipmentAmount: number
  /** 납품완료율 (%) */
  completionRate: number
}

/** 지역별 통계 (확장) */
export interface RegionalStatistics {
  /** 지역 코드 */
  regionCode: string
  /** 지역명 */
  regionName: string
  /** 총 출하 건수 */
  totalShipments: number
  /** 총 매출액 */
  totalSales: number
  /** 총 주문 건수 */
  totalOrders: number
  /** 완료된 주문 건수 */
  completedOrders: number
  /** 평균 주문 금액 */
  averageOrderValue: number
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

/** SKU별 발주수량 통계 아이템 */
export interface SkuOrderStatsItem {
  /** 품목명 */
  itemName: string
  /** SKU ID */
  skuId: string
  /** SKU 품명 */
  skuName: string
  /** 단위 */
  unit: string
  /** 누적 발주수량 */
  totalOrderedQuantity: number
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
  /** SKU별 발주수량 통계 */
  skuOrderStats: SkuOrderStatsItem[]
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

// ============================================
// OEM 제조사별 통계 타입
// ============================================

/** OEM 월별 통계 */
export interface OemMonthlyStatistics {
  oemId: number
  oemName: string
  month: string              // YYYY-MM
  manufacturingCost: number  // 제조원가
  paidAmount: number         // 지급액
  remainingBalance?: number  // 잔금 (기존 호환)
  unpaidAmount?: number      // 미지급액 (새 API)
  paymentRate?: number       // 지급률 (%)
}

/** OEM 통계 요약 */
export interface OemStatisticsSummary {
  totalManufacturingCost: number
  totalPaidAmount: number
  totalRemainingBalance: number  // 미지급액 (잔금)
  totalUnpaidAmount?: number     // 미지급액 (새 API용)
  oemCount: number
  paymentRate?: number           // 지급률 (%)
}

/** OEM 통계 응답 */
export interface OemStatisticsResponse {
  summary: OemStatisticsSummary
  monthlyData: OemMonthlyStatistics[]
  oemSummary?: OemAnnualSummary[]  // OEM별 연간 합계
}

/** OEM별 연간 합계 */
export interface OemAnnualSummary {
  oemId: number
  oemName: string
  shipmentCount: number           // 출하 건수
  totalManufacturingCost: number  // 총 제조원가
  totalPaidAmount: number         // 총 지급액
  totalUnpaidAmount: number       // 총 미지급액
  paymentRate: number             // 지급률 (%)
}

/** OEM 차트 데이터 (대시보드용) */
export interface OemChartData {
  month: string
  data: {
    oemId: number
    oemName: string
    manufacturingCost: number
  }[]
}

// ============================================
// 기성통계 타입
// ============================================

/** 기성통계 검색 요청 */
export interface BaselineStatisticsRequest {
  /** 조회 연도 (YYYY) */
  year?: number
  /** 상태 필터 (선택) */
  status?: string
}

/** 기성통계 항목 */
export interface BaselineStatisticsItem {
  /** 차수 */
  sequence: number
  /** 발주 ID */
  orderId: number
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 수요기관 */
  client: string
  /** 사업명 */
  projectName: string
  /** 기성금액 */
  amount: number
  /** 상태 */
  status: string
  /** 승인일자 */
  approvedDate: string | null
  /** 생성일자 */
  createdAt: string
}

/** 기성통계 요약 */
export interface BaselineStatisticsSummary {
  /** 총 건수 */
  totalCount: number
  /** 총 기성금액 */
  totalAmount: number
  /** 평균 기성금액 */
  averageAmount: number
  /** 최대 차수 */
  maxSequence: number
}

/** 기성통계 응답 */
export interface BaselineStatisticsResponse {
  /** 요약 정보 */
  summary: BaselineStatisticsSummary
  /** 기성 목록 */
  items: BaselineStatisticsItem[]
}
