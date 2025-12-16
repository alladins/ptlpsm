/**
 * 자금 관리 관련 타입 정의
 * @description 자금 관리, 기성금 요청, 통계 관련 인터페이스
 */

import type { BaseEntity } from './common'

/**
 * 자금 상태
 */
export type FundStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

/**
 * 자금 상태 라벨
 */
export const FUND_STATUS_LABELS: Record<FundStatus, string> = {
  ACTIVE: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소'
}

/**
 * 기성금 요청 상태
 */
export type PaymentStatus = 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED'

/**
 * 자금 정보
 * @description 주문(납품요구)에 연결된 자금 관리 정보
 */
export interface Fund extends BaseEntity {
  /** 자금 ID (PK) */
  fundId: number
  /** 주문 ID (FK) */
  orderId: number
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 현장명 */
  siteName: string
  /** 시공사명 */
  builderName?: string
  /** 계약 총액 */
  contractTotalAmount: number
  /** 선급금 비율 (%) */
  advancePaymentRate: number
  /** 선급금 금액 */
  advancePaymentAmount: number
  /** 선급금 수령일 */
  advancePaymentDate: string | null
  /** 기성금 누계 */
  progressPaymentTotal: number
  /** 잔금 (계약총액 - 선급금 - 기성금누계) */
  balanceAmount: number
  /** OEM 지급 총액 */
  oemTotalPaid: number
  /** OEM 미지급 금액 */
  oemOutstanding?: number
  /** 자금 상태 */
  status: FundStatus
}

/**
 * 자금 목록 조회용 간소화 인터페이스
 */
export interface FundListItem {
  fundId: number
  orderId: number
  deliveryRequestNo: string
  siteName: string
  builderName?: string
  contractTotalAmount: number
  advancePaymentAmount: number
  progressPaymentTotal: number
  balanceAmount: number
  status: FundStatus
  /** 수금률 (%) */
  collectionRate?: number
  createdAt?: string
}

/**
 * 자금 상세 정보
 * @description 자금 상세 조회 시 반환되는 확장 정보
 */
export interface FundDetail extends Fund {
  /** 수금률 (%) */
  collectionRate: number
  /** 현재 수익 */
  currentProfit: number
  /** 수익률 (%) */
  profitRate: number
  /** 기성금 이력 목록 */
  payments?: ProgressPaymentRequest[]
}

/**
 * 기성금 요청
 * @description 기성 청구 및 납품완료 처리 요청 정보
 */
export interface ProgressPaymentRequest extends BaseEntity {
  /** 요청 ID (PK) */
  requestId: number
  /** 자금 ID (FK) */
  fundId: number
  /** 요청 차수 (1, 2, 3...) */
  requestSeq: number
  /** 연결된 기성 차수 ID */
  baselineId: number
  /** 요청 금액 */
  requestAmount: number
  /** 납품 수량 */
  deliveredQuantity: number
  /** 납품확인서 ID */
  deliveryConfirmationId: number | null
  /** OEM 지급 금액 */
  oemPaymentAmount: number
  /** OEM 지급 비율 (%) */
  oemPaymentRate: number
  /** 요청일 */
  requestDate: string
  /** 승인일 */
  approvalDate: string | null
  /** 입금일 */
  paymentDate: string | null
  /** 요청 상태 */
  status: PaymentStatus
  /** 비고 */
  remarks: string | null
}

/**
 * 월별 자금 데이터
 * @description 통계 차트용 월별 데이터
 */
export interface MonthlyFundData {
  /** 연도 */
  year: number
  /** 월 (1-12) */
  month: number
  /** 월 표시 (예: '2024-01') */
  yearMonth: string
  /** 해당 월 수금액 */
  receivedAmount: number
  /** 해당 월 OEM 지급액 */
  oemPaidAmount: number
  /** 해당 월 수익 */
  profitAmount: number
}

/**
 * 자금 통계
 * @description 자금 통계 대시보드용 전체 현황 데이터
 */
export interface FundStatistics {
  /** 총 건수 */
  totalFundCount: number
  /** 총 계약금액 */
  totalContractAmount: number
  /** 총 선급금 합계 */
  totalAdvancePayment: number
  /** 총 기성금 합계 */
  totalProgressPayment: number
  /** 총 잔금 합계 */
  totalBalance: number
  /** 총 수금액 합계 */
  totalCollected: number
  /** 총 미수금 합계 */
  totalOutstanding: number
  /** 총 OEM 지급액 */
  totalOemPaid: number
  /** 진행중 건수 */
  activeCount: number
  /** 완료 건수 */
  completedCount: number
  /** 수금 누계 (별칭) */
  totalReceived?: number
  /** OEM 미지급 총액 */
  totalOemOutstanding?: number
  /** 현재 수익 */
  currentProfit?: number
  /** 수익률 (%) */
  profitRate?: number
  /** 월별 데이터 */
  monthlyData?: MonthlyFundData[]
  /** 기성 진행 현황 (완료율 %) */
  progressCompletionRate?: number
}

/**
 * 자금 검색 파라미터
 */
export interface FundSearchParams {
  /** 검색 키워드 (납품요구번호, 현장명) */
  search?: string
  /** 납품요구번호 */
  deliveryRequestNo?: string
  /** 현장명 */
  siteName?: string
  /** 상태 필터 */
  status?: FundStatus | ''
  /** 시작 날짜 */
  startDate?: string
  /** 종료 날짜 */
  endDate?: string
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 */
  sort?: string
}

/**
 * 자금 생성 요청
 */
export interface FundCreateRequest {
  /** 주문 ID */
  orderId: number
  /** 선급금 비율 (%) */
  advancePaymentRate?: number
  /** 선급금 금액 */
  advancePaymentAmount?: number
  /** 선급금 수령일 */
  advancePaymentDate?: string
  /** 비고 */
  remarks?: string
}

/**
 * 자금 수정 요청
 */
export interface FundUpdateRequest {
  /** 선급금 비율 (%) */
  advancePaymentRate?: number
  /** 선급금 금액 */
  advancePaymentAmount?: number
  /** 선급금 수령일 */
  advancePaymentDate?: string
  /** 비고 */
  remarks?: string
}

/**
 * 기성금 요청 생성
 */
export interface PaymentCreateRequest {
  /** 기성 차수 ID */
  baselineId: number
  /** 요청 금액 */
  requestAmount: number
  /** OEM 지급 금액 */
  oemPaymentAmount: number
  /** 비고 */
  remarks?: string
}

/**
 * 통계 조회 파라미터
 */
export interface FundStatisticsParams {
  /** 조회 연도 */
  year: number
  /** 조회 월 (선택) */
  month?: number
}

/**
 * 자금 목록 응답
 */
export interface FundListResponse {
  content: FundListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 기성금 이력 응답
 */
export interface PaymentListResponse {
  content: ProgressPaymentRequest[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}
