/**
 * 수익 배분 관리 관련 타입 정의
 * @description 연간 매출 구간별 지분율, 정산, 지급 관련 인터페이스
 * @created 2026-01-08
 * @updated 2026-01-15 수익 배분 모델로 확장
 */

import type { BaseEntity } from './common'

// ============ 지분자 (Stakeholder) 관련 ============

/**
 * 지분자 타입
 * - MANUFACTURER: 제조사 (원가)
 * - HEADQUARTERS: 본사 (리드파워)
 * - AGENT: 대리점 (영업직원)
 * - PARTNER: 협력사 (에코암스)
 */
export type Stakeholder = 'MANUFACTURER' | 'HEADQUARTERS' | 'AGENT' | 'PARTNER'

/**
 * 지분자 라벨
 */
export const STAKEHOLDER_LABELS: Record<Stakeholder, string> = {
  MANUFACTURER: '제조사',
  HEADQUARTERS: '본사',
  AGENT: '대리점',
  PARTNER: '협력사'
}

/**
 * 지분자별 지분율
 */
export interface StakeholderRate {
  /** 지분자 */
  stakeholder: Stakeholder
  /** 지분자명 */
  name: string
  /** 지분율 (%) */
  rate: number
}

/**
 * 지분율 구간
 */
export interface ShareTier {
  /** 구간 ID */
  tierId: number
  /** 연도 */
  year: number
  /** 구간명 (예: "10억~50억 구간") */
  tierName: string
  /** 최소 매출 */
  minAmount: number
  /** 최대 매출 (null이면 무제한) */
  maxAmount: number | null
  /** 지분자별 지분율 */
  rates: StakeholderRate[]
}

/**
 * 지분자별 배분 금액
 */
export interface StakeholderDistribution {
  /** 지분자 */
  stakeholder: Stakeholder
  /** 지분자명 */
  name: string
  /** 지분율 (%) */
  rate: number
  /** 배분 금액 */
  amount: number
  /** 지급 완료 금액 */
  paidAmount: number
  /** 미지급 금액 */
  unpaidAmount: number
}

/**
 * 월별 수익 배분 데이터
 */
export interface MonthlyDistribution {
  /** 연도 */
  year: number
  /** 월 (1-12) */
  month: number
  /** 월 표시 (예: '2026-01') */
  yearMonth: string
  /** 해당 월 매출액 */
  salesAmount: number
  /** 지분자별 배분 */
  distributions: StakeholderDistribution[]
}

/**
 * 연간 수익 배분 요약
 */
export interface AnnualDistributionSummary {
  /** 연도 */
  year: number
  /** 연간 총 매출액 */
  totalSalesAmount: number
  /** 현재 적용 구간 */
  currentTier: ShareTier
  /** 지분자별 총 배분 */
  totalDistributions: StakeholderDistribution[]
  /** 총 미지급 금액 */
  totalUnpaidAmount: number
  /** 월별 데이터 */
  monthlyData: MonthlyDistribution[]
}

// ============ 커미션율 설정 ============

/**
 * 커미션 매출 구간
 */
export interface CommissionTier {
  /** 구간 ID (PK) */
  tierId: number
  /** 연도 */
  year: number
  /** 구간 순서 (1, 2, 3...) */
  tierOrder: number
  /** 구간 이름 (예: '1구간', '2구간') */
  tierName: string
  /** 매출 하한 (원) */
  minAmount: number
  /** 매출 상한 (원, null이면 무제한) */
  maxAmount: number | null
  /** 커미션율 (%) */
  commissionRate: number
  /** 비고 */
  remarks?: string
  /** 생성일 */
  createdAt?: string
  /** 수정일 */
  updatedAt?: string
}

/**
 * 연도별 커미션율 설정
 */
export interface CommissionRateConfig {
  /** 연도 */
  year: number
  /** 매출 구간별 커미션율 목록 */
  tiers: CommissionTier[]
  /** 기본 커미션율 (구간 미적용 시) */
  defaultRate?: number
  /** 적용 상태 */
  isActive: boolean
  /** 생성일 */
  createdAt?: string
  /** 수정일 */
  updatedAt?: string
}

/**
 * 커미션율 설정 요청
 */
export interface CommissionRateUpdateRequest {
  /** 연도 */
  year: number
  /** 매출 구간별 커미션율 목록 */
  tiers: Omit<CommissionTier, 'tierId' | 'year' | 'createdAt' | 'updatedAt'>[]
  /** 기본 커미션율 */
  defaultRate?: number
}

// ============ 커미션 정산 ============

/**
 * 커미션 정산 상태
 */
export type CommissionSettlementStatus =
  | 'PENDING'      // 정산 대기
  | 'CALCULATED'   // 계산 완료
  | 'CONFIRMED'    // 확정
  | 'PAID'         // 지급 완료

/**
 * 커미션 정산 상태 라벨
 */
export const COMMISSION_SETTLEMENT_STATUS_LABELS: Record<CommissionSettlementStatus, string> = {
  PENDING: '정산 대기',
  CALCULATED: '계산 완료',
  CONFIRMED: '확정',
  PAID: '지급 완료'
}

/**
 * 커미션 정산 정보 (건별)
 */
export interface CommissionSettlement extends BaseEntity {
  /** 정산 ID (PK) */
  settlementId: number
  /** 자금 ID (FK) */
  fundId: number
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 현장명/프로젝트명 */
  projectName: string
  /** 수요기관 */
  client?: string
  /** 계약 총액 */
  contractTotalAmount: number
  /** 커미션 산정 기준 매출액 */
  salesAmount: number
  /** 적용 커미션율 (%) */
  appliedRate: number
  /** 커미션 금액 */
  commissionAmount: number
  /** 정산 상태 */
  status: CommissionSettlementStatus
  /** 정산 확정일 */
  confirmedAt?: string
  /** 지급일 */
  paidAt?: string
  /** 지급 ID (연결된 지급 정보) */
  paymentId?: number
  /** 비고 */
  remarks?: string
}

/**
 * 자금별 커미션 정산 상세
 */
export interface FundCommissionDetail {
  /** 자금 ID */
  fundId: number
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 현장명 */
  projectName: string
  /** 계약 총액 */
  contractTotalAmount: number
  /** 수금액 */
  collectedAmount: number
  /** 미수금 */
  outstandingAmount: number
  /** 수금률 (%) */
  collectionRate: number
  /** 적용 커미션율 (%) */
  commissionRate: number
  /** 커미션 금액 (예상) */
  commissionAmount: number
  /** 정산 상태 */
  settlementStatus: CommissionSettlementStatus
  /** 정산 정보 (있는 경우) */
  settlement?: CommissionSettlement
}

// ============ 연간 커미션 요약 ============

/**
 * 월별 커미션 데이터
 */
export interface MonthlyCommissionData {
  /** 연도 */
  year: number
  /** 월 (1-12) */
  month: number
  /** 월 표시 (예: '2025-01') */
  yearMonth: string
  /** 해당 월 매출액 */
  salesAmount: number
  /** 해당 월 커미션 금액 */
  commissionAmount: number
  /** 해당 월 지급 금액 */
  paidAmount: number
  /** 해당 월 미지급 금액 */
  unpaidAmount: number
}

/**
 * 분기별 커미션 데이터
 */
export interface QuarterlyCommissionData {
  /** 연도 */
  year: number
  /** 분기 (1-4) */
  quarter: number
  /** 분기 표시 (예: '2025 Q1') */
  quarterLabel: string
  /** 해당 분기 매출액 */
  salesAmount: number
  /** 해당 분기 커미션 금액 */
  commissionAmount: number
  /** 해당 분기 지급 금액 */
  paidAmount: number
  /** 해당 분기 미지급 금액 */
  unpaidAmount: number
}

/**
 * 연간 커미션 요약
 */
export interface AnnualCommissionSummary {
  /** 연도 */
  year: number
  /** 연간 총 매출액 */
  totalSalesAmount: number
  /** 연간 총 커미션 금액 */
  totalCommissionAmount: number
  /** 연간 지급 완료 금액 */
  totalPaidAmount: number
  /** 연간 미지급 금액 */
  totalUnpaidAmount: number
  /** 평균 커미션율 (%) */
  averageCommissionRate: number
  /** 현재 적용 구간 */
  currentTier?: CommissionTier
  /** 다음 구간까지 남은 매출 */
  amountToNextTier?: number
  /** 월별 데이터 */
  monthlyData: MonthlyCommissionData[]
  /** 분기별 데이터 */
  quarterlyData: QuarterlyCommissionData[]
  /** 건별 정산 목록 */
  settlements: CommissionSettlement[]
}

// ============ 커미션 지급 ============

/**
 * 커미션 지급 상태
 */
export type CommissionPaymentStatus =
  | 'SCHEDULED'    // 지급 예정
  | 'PROCESSING'   // 지급 처리 중
  | 'COMPLETED'    // 지급 완료
  | 'CANCELLED'    // 취소

/**
 * 커미션 지급 상태 라벨
 */
export const COMMISSION_PAYMENT_STATUS_LABELS: Record<CommissionPaymentStatus, string> = {
  SCHEDULED: '지급 예정',
  PROCESSING: '처리 중',
  COMPLETED: '지급 완료',
  CANCELLED: '취소'
}

/**
 * 커미션 지급 정보
 */
export interface CommissionPayment extends BaseEntity {
  /** 지급 ID (PK) */
  paymentId: number
  /** 연도 */
  year: number
  /** 지급 차수 (1, 2, 3...) */
  paymentSeq: number
  /** 지급 예정 금액 */
  scheduledAmount: number
  /** 실제 지급 금액 */
  paidAmount: number | null
  /** 지급 예정일 */
  scheduledDate: string
  /** 실제 지급일 */
  paidDate: string | null
  /** 지급 상태 */
  status: CommissionPaymentStatus
  /** 지급 대상 정산 ID 목록 */
  settlementIds: number[]
  /** 지급 대상 정산 건수 */
  settlementCount: number
  /** 수취인 정보 */
  recipientName?: string
  /** 계좌 정보 */
  bankAccount?: string
  /** 은행명 */
  bankName?: string
  /** 비고 */
  remarks?: string
}

/**
 * 커미션 지급 등록 요청
 */
export interface CommissionPaymentCreateRequest {
  /** 연도 */
  year: number
  /** 지급 예정 금액 */
  scheduledAmount: number
  /** 지급 예정일 */
  scheduledDate: string
  /** 지급 대상 정산 ID 목록 */
  settlementIds: number[]
  /** 수취인 정보 */
  recipientName?: string
  /** 계좌 정보 */
  bankAccount?: string
  /** 은행명 */
  bankName?: string
  /** 비고 */
  remarks?: string
}

/**
 * 커미션 지급 완료 요청
 */
export interface CommissionPaymentCompleteRequest {
  /** 실제 지급 금액 */
  paidAmount: number
  /** 실제 지급일 */
  paidDate: string
  /** 비고 */
  remarks?: string
}

// ============ 검색 파라미터 ============

/**
 * 커미션 정산 검색 파라미터
 */
export interface CommissionSettlementSearchParams {
  /** 연도 */
  year?: number
  /** 상태 필터 */
  status?: CommissionSettlementStatus | ''
  /** 검색 키워드 (납품요구번호, 현장명) */
  search?: string
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 */
  sort?: string
}

/**
 * 커미션 지급 검색 파라미터
 */
export interface CommissionPaymentSearchParams {
  /** 연도 */
  year?: number
  /** 상태 필터 */
  status?: CommissionPaymentStatus | ''
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 */
  sort?: string
}

// ============ 응답 타입 ============

/**
 * 커미션 정산 목록 응답
 */
export interface CommissionSettlementListResponse {
  content: CommissionSettlement[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 커미션 지급 목록 응답
 */
export interface CommissionPaymentListResponse {
  content: CommissionPayment[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ============ 대시보드용 통계 ============

/**
 * 커미션 대시보드 통계
 */
export interface CommissionDashboardStats {
  /** 연도 */
  year: number
  /** 총 정산 건수 */
  totalSettlementCount: number
  /** 정산 대기 건수 */
  pendingCount: number
  /** 확정 건수 */
  confirmedCount: number
  /** 지급 완료 건수 */
  paidCount: number
  /** 총 커미션 금액 */
  totalCommissionAmount: number
  /** 지급 완료 금액 */
  totalPaidAmount: number
  /** 미지급 금액 */
  totalUnpaidAmount: number
  /** 지급률 (%) */
  paymentRate: number
}
