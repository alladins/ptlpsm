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
 * - MANUFACTURER: 제조사 (OEM)
 * - HEADQUARTERS: 본사 (대표)
 * - AGENT: 에코암스
 * - PARTNER: 영업담당자
 */
export type Stakeholder = 'MANUFACTURER' | 'HEADQUARTERS' | 'AGENT' | 'PARTNER' | 'CERTIFICATION' | 'MAINTENANCE'

/**
 * 지분자 라벨
 */
export const STAKEHOLDER_LABELS: Record<Stakeholder, string> = {
  MANUFACTURER: '제조사(OEM)',
  HEADQUARTERS: '본사(대표)',
  AGENT: '에코암스',
  PARTNER: '영업담당자',
  CERTIFICATION: '인증관리',
  MAINTENANCE: '유지보수'
}

/**
 * 프론트 Stakeholder → 백엔드 recipientType 매핑
 */
export const STAKEHOLDER_TO_RECIPIENT: Record<Stakeholder, string> = {
  MANUFACTURER: 'OEM',
  HEADQUARTERS: 'CEO',
  AGENT: 'ECOARMS',
  PARTNER: 'SALES_REP',
  CERTIFICATION: 'CERTIFICATION',
  MAINTENANCE: 'MAINTENANCE'
}

/**
 * 백엔드 recipientType → 프론트 Stakeholder 매핑
 */
export const RECIPIENT_TO_STAKEHOLDER: Record<string, Stakeholder> = {
  OEM: 'MANUFACTURER',
  CEO: 'HEADQUARTERS',
  ECOARMS: 'AGENT',
  SALES_REP: 'PARTNER',
  CERTIFICATION: 'CERTIFICATION',
  MAINTENANCE: 'MAINTENANCE'
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
  /** 제조사(OEM) 비율 (%) - 자동계산: 100 - CEO - 에코암스 - 영업 */
  oemRate: number
  /** 본사(대표) 비율 (%) */
  ceoRate: number
  /** 에코암스 비율 (%) */
  ecoarmsRate: number
  /** 영업담당자 비율 (%) */
  salesRate: number
  /** 인증관리 비율 (%) */
  certificationRate: number
  /** 유지보수 비율 (%) */
  maintenanceRate: number
  /** 표시 순서 */
  displayOrder?: number
  /** 설명 */
  description?: string
  /** 비고 */
  remarks?: string
  /** 생성일 */
  createdAt?: string
  /** 수정일 */
  updatedAt?: string
}

/**
 * 커미션 비율 구간 (매출액 기반 - 본사/대리점/협력사)
 */
export interface CommissionRateTier {
  /** 구간 ID */
  id: number
  /** 매출 하한 (원) */
  minAmount: number
  /** 매출 상한 (원, null이면 무제한) */
  maxAmount: number | null
  /** 본사 비율 (%) */
  hqRate: number
  /** 대리점 비율 (%) */
  dealerRate: number
  /** 협력사 비율 (%) */
  partnerRate: number
  /** 구간명 (예: '100억 미만', '100억~150억') */
  tierName: string
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
  /** 최종 적용 구간명 */
  appliedTier?: string
  /** 적용 OEM 비율 (%) */
  appliedOemRate?: number
  /** 적용 CEO 비율 (%) */
  appliedCeoRate?: number
  /** 적용 에코암스 비율 (%) */
  appliedEcoarmsRate?: number
  /** 적용 영업 비율 (%) */
  appliedSalesRate?: number
  /** 적용 인증관리 비율 (%) */
  appliedCertificationRate?: number
  /** 적용 유지보수 비율 (%) */
  appliedMaintenanceRate?: number
  /** 총 OEM 정산액 */
  totalOemAmount?: number
  /** 총 CEO 정산액 */
  totalCeoAmount?: number
  /** 총 에코암스 정산액 */
  totalEcoarmsAmount?: number
  /** 총 영업담당자 정산액 */
  totalSalesRepAmount?: number
  /** 총 인증관리 정산액 */
  totalCertificationAmount?: number
  /** 총 유지보수 정산액 */
  totalMaintenanceAmount?: number
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
  /** 수령자 유형 (OEM/CEO/ECOARMS/SALES_REP) */
  recipientType: string
  /** 수령자 ID (영업담당자인 경우) */
  recipientId?: number
  /** 수령자명 */
  recipientName: string
  /** 지급 금액 */
  paymentAmount: number
  /** 지급일 */
  paymentDate: string
  /** 지급 방법 */
  paymentMethod?: string
  /** 관련 정산 ID */
  settlementIds?: string
  /** 기준 매출액 */
  baseSalesAmount?: number
  /** 적용 비율 (%) */
  appliedRate?: number
  /** 비고 */
  remarks?: string
  /** 생성일시 */
  createdAt?: string
  /** 생성자 */
  createdBy?: string
}

/**
 * 커미션 지급 등록 요청
 */
export interface CommissionPaymentCreateRequest {
  /** 연도 */
  year: number
  /** 수령자 유형 (OEM/CEO/ECOARMS/SALES_REP) - 필수 */
  recipientType: string
  /** 수령자 ID (영업담당자인 경우) */
  recipientId?: number
  /** 수령자명 - 필수 */
  recipientName: string
  /** 지급 금액 - 필수 */
  paymentAmount: number
  /** 지급일 - 필수 */
  paymentDate: string
  /** 지급 방법 */
  paymentMethod?: string
  /** 관련 정산 ID 목록 */
  settlementIds?: number[]
  /** 기준 매출액 */
  baseSalesAmount?: number
  /** 적용 비율 (%) */
  appliedRate?: number
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

// ============ 가지급금 (Advance Payment) ============

/**
 * 가지급금 상태
 */
export type AdvancePaymentStatus = 'PAID' | 'DEDUCTED' | 'REFUNDED'

/**
 * 가지급금 상태 라벨
 */
export const ADVANCE_PAYMENT_STATUS_LABELS: Record<AdvancePaymentStatus, string> = {
  PAID: '지급완료',
  DEDUCTED: '차감완료',
  REFUNDED: '환불'
}

/**
 * 가지급금 이력 응답
 */
export interface AdvancePaymentHistory {
  /** 가지급금 ID */
  advancePaymentId: number
  /** 연도 */
  year: number
  /** 수령자 유형 (CEO/ECOARMS/SALES_REP) */
  recipientType: string
  /** 수령자명 */
  recipientName: string
  /** 지급 금액 */
  paymentAmount: number
  /** 예상 커미션 */
  expectedCommission?: number
  /** 가지급 비율 (%) */
  advanceRate?: number
  /** 지급일 */
  paymentDate: string
  /** 지급 방법 */
  paymentMethod?: string
  /** 상태 */
  status: AdvancePaymentStatus
  /** 비고 */
  remarks?: string
  /** 생성일시 */
  createdAt?: string
}

/**
 * 가지급금 등록 요청
 */
export interface AdvancePaymentCreateRequest {
  /** 수령자 유형 (CEO/ECOARMS/SALES_REP) - OEM 제외 */
  recipientType: string
  /** 수령자명 */
  recipientName: string
  /** 지급 금액 */
  paymentAmount: number
  /** 지급일 */
  paymentDate: string
  /** 지급 방법 */
  paymentMethod?: string
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
  /** 수령자 유형 필터 */
  recipientType?: string
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
  page: number
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

// ============ 중간정산 (Mid-term Settlement) ============

/**
 * 정산 유형
 */
export type PeriodicSettlementType =
  | 'MID'     // 중간정산
  | 'FINAL'   // 최종정산

/**
 * 정산 유형 라벨
 */
export const PERIODIC_SETTLEMENT_TYPE_LABELS: Record<PeriodicSettlementType, string> = {
  MID: '중간정산',
  FINAL: '최종정산'
}

/**
 * 정산 상태
 */
export type PeriodicSettlementStatus =
  | 'PENDING'     // 정산 대기
  | 'COMPLETED'   // 정산 완료

/**
 * 정산 상태 라벨
 */
export const PERIODIC_SETTLEMENT_STATUS_LABELS: Record<PeriodicSettlementStatus, string> = {
  PENDING: '정산 대기',
  COMPLETED: '정산 완료'
}

/**
 * 중간정산 정보
 */
export interface PeriodicSettlement extends BaseEntity {
  /** 정산 ID (PK) */
  settlementId: number
  /** 정산일 */
  settlementDate: string
  /** 정산 유형 (MID/FINAL) */
  settlementType: PeriodicSettlementType
  /** 연도 */
  year: number
  /** 총 매출액 */
  totalSalesAmount: number
  /** 총 커미션 금액 */
  totalCommissionAmount: number
  /** 상태 */
  status: PeriodicSettlementStatus
  /** 비고 */
  remarks?: string
}

/**
 * 중간정산 생성 요청
 */
export interface CreatePeriodicSettlementRequest {
  /** 정산 유형 */
  settlementType: PeriodicSettlementType
  /** 연도 */
  year: number
  /** 정산일 */
  settlementDate: string
  /** 비고 */
  remarks?: string
}

/**
 * 정산 이력 조회 파라미터
 */
export interface PeriodicSettlementSearchParams {
  /** 연도 */
  year?: number
  /** 정산 유형 */
  settlementType?: PeriodicSettlementType | ''
  /** 상태 */
  status?: PeriodicSettlementStatus | ''
  /** 페이지 번호 */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 */
  sort?: string
}

/**
 * 정산 이력 목록 응답
 */
export interface PeriodicSettlementListResponse {
  content: PeriodicSettlement[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ============ 연말정산 (Annual Final Settlement) ============

/**
 * 수령자별 연말정산 결과
 */
export interface RecipientSettlement {
  /** 수령자 유형 (OEM/CEO/ECOARMS/SALES_REP) */
  recipientType: string
  /** 수령자 표시명 */
  recipientLabel: string
  /** 최종 적용 비율 (%) */
  finalRate: number
  /** 기존 정산 합계 */
  originalTotal: number
  /** 소급 재계산 합계 */
  recalculatedTotal: number
  /** 조정금액 (재계산 - 기존) */
  adjustmentAmount: number
  /** 가지급금 합계 */
  advanceTotal: number
  /** 최종 지급액 */
  finalPaymentAmount: number
}

/**
 * 연말정산 시뮬레이션/확정 응답
 */
export interface AnnualFinalSettlementResponse {
  /** 연도 */
  year: number
  /** 연간 총 매출액 */
  totalSalesAmount: number
  /** 최종 적용 구간명 */
  finalTier: string
  /** 수령자별 정산 결과 */
  recipients: RecipientSettlement[]
  /** 확정 여부 */
  isFinalized: boolean
}
