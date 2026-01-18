/**
 * 자금 관리 관련 타입 정의
 * @description 자금 관리, 기성금 요청, 통계 관련 인터페이스
 */

import type { BaseEntity } from './common'
import type { SignatureStatus } from './baseline'

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
  /** 현장명 (별칭) */
  projectName?: string
  /** 수요기관 */
  client?: string
  /** 시공사명 (건설사명) */
  builderCompanyName?: string
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
  /** 미수금 (서버 응답 필드) */
  outstandingAmount?: number
  /** OEM 지급 총액 */
  oemTotalPaid: number
  /** OEM 미지급 금액 */
  oemOutstanding?: number
  /** 자금 상태 */
  status: FundStatus
  /** 납품완료 여부 */
  isDeliveryCompleted?: boolean
  /** 납품완료일 */
  deliveryCompletedAt?: string
  /** 잔금 입금액 */
  balancePaidAmount?: number
  /** 잔금 입금일 */
  balancePaidDate?: string
}

/**
 * 자금 목록 조회용 간소화 인터페이스
 */
export interface FundListItem {
  fundId: number
  orderId: number
  deliveryRequestNo: string
  siteName: string
  /** 현장명 (siteName의 별칭) */
  projectName?: string
  builderCompanyName?: string
  /** 계약 총액 */
  contractTotalAmount: number
  /** 계약 총액 (별칭) */
  totalContractAmount?: number
  /** 선급금 금액 */
  advancePaymentAmount: number
  /**
   * 선급금 (별칭)
   * @deprecated advancePaymentAmount 사용 권장
   */
  advancePayment?: number
  progressPaymentTotal: number
  /** 잔금 */
  balanceAmount: number
  /** 잔금 (별칭) */
  balancePayment?: number
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
  /** 납품완료계 상태 (delivery_done.status) */
  deliveryDoneStatus?: string
  /** OEM 업체 ID (delivery_done.oem_company_id) */
  oemCompanyId?: number
  /** 선급금 차감 누계 (정산 완료된 선급금 총액) - 백엔드 필드명 */
  advanceDeductedTotal?: number
  /** 미정산 선급금 잔액 (계산: advancePaymentAmount - advanceDeductedTotal) */
  advanceUnsettledBalance?: number
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
  /** 요청 차수 (1, 2, 3...) - 목록 표시용 */
  requestSeq: number
  /** 결제 차수 (서버 응답 호환용) */
  paymentSeq?: number
  /** 연결된 기성 차수 ID */
  baselineId: number
  /** 요청 금액 */
  requestAmount: number
  /** 금액 (서버 응답 호환용) */
  amount?: number
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
  /** 입금일 (서버 응답: paidDate 또는 paymentDate) */
  paymentDate: string | null
  /** 입금일 (서버 응답 호환용) */
  paidDate?: string | null
  /** 요청 상태 */
  status: PaymentStatus
  /** 비고 */
  remarks: string | null
  /** 서명 상태 (기성청구 서명 프로세스용) */
  signatureStatus?: SignatureStatus
  /** 현장소장 서명 완료 여부 */
  siteManagerSigned?: boolean
  /** 감리원 서명 완료 여부 */
  inspectorSigned?: boolean
  /** 요청 ID (서버 응답 호환용) */
  paymentId?: number
  /** 선급금 차감액 */
  advanceDeductionAmount?: number
  /** 실수금액 (청구금액 - 선급금차감액) - 백엔드 필드명: netPaymentAmount */
  netPaymentAmount?: number
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
  /** 계약별 자금 상세 목록 */
  fundDetails?: FundDetailItem[]
}

/**
 * 자금 상세 항목 (통계 테이블용)
 */
export interface FundDetailItem {
  fundId: number
  deliveryRequestNo: string
  projectName: string
  totalContractAmount: number
  collected: number
  uncollected: number
  collectionRate: number
  oemPaid: number
  profit: number
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
  /** 현장명 (별칭) */
  projectName?: string
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
 * 기간 조회 타입
 */
export type PeriodType = 'MONTHS' | 'QUARTER' | 'YEAR'

/**
 * 통계 조회 파라미터
 */
export interface FundStatisticsParams {
  /** 조회 기간 타입 */
  periodType: PeriodType
  /** 조회 연도 (QUARTER, YEAR 타입에서 사용) */
  year?: number
  /** 조회 분기 (QUARTER 타입에서 사용, 1-4) */
  quarter?: number
  /** 조회 개월수 (MONTHS 타입에서 사용) */
  months?: number
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

// ============ 선급금 (Advance Payment) ============

/**
 * 선급금 문서 유형
 */
export type AdvanceDocumentType =
  | 'APPLICATION'       // 선급금신청서
  | 'USAGE_PLAN'        // 선급금사용계획
  | 'USAGE_AGREEMENT'   // 선급금사용확약서
  | 'USAGE_PLEDGE'      // 선급금사용각서
  | 'SETTLEMENT'        // 선급금정산서

/**
 * 선급금 PDF 유형 (AdvanceDocumentType과 동일, PDF URL 생성용)
 */
export type AdvancePdfType = AdvanceDocumentType

/**
 * 선급금 문서 유형 라벨
 */
export const ADVANCE_DOCUMENT_TYPE_LABELS: Record<AdvanceDocumentType, string> = {
  APPLICATION: '선급금신청서',
  USAGE_PLAN: '선급금사용계획',
  USAGE_AGREEMENT: '선급금사용확약서',
  USAGE_PLEDGE: '선급금사용각서',
  SETTLEMENT: '선급금정산서'
}

/**
 * 선급금 상태
 */
export type AdvanceStatus = 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED'

/**
 * 선급금 상태 라벨
 */
export const ADVANCE_STATUS_LABELS: Record<AdvanceStatus, string> = {
  REQUESTED: '신청',
  APPROVED: '승인',
  PAID: '수금완료',
  REJECTED: '반려'
}

/**
 * 선급금 문서
 */
export interface AdvanceDocument {
  /** 문서 ID (PK) */
  documentId: number
  /** 선급금 ID (FK) */
  advanceId: number
  /** 문서 유형 */
  documentType: AdvanceDocumentType
  /** 파일명 */
  fileName: string
  /** 파일 URL */
  fileUrl: string
  /** 파일 크기 (bytes) */
  fileSize: number
  /** 업로드 일시 */
  uploadedAt: string
  /** 업로드자 */
  uploadedBy?: string
}

/**
 * 선급금 정보
 */
export interface AdvancePayment {
  /** 선급금 ID (PK) */
  advanceId: number
  /** 자금 ID (FK) */
  fundId: number
  /** 현장명 (프로젝트명) */
  projectName?: string
  /** 수요기관 (발주처) */
  client?: string
  /** 신청 금액 */
  requestAmount: number
  /** 승인 금액 */
  approvedAmount: number | null
  /** 입금 금액 */
  paidAmount: number | null
  /** 신청일 */
  requestDate: string
  /** 승인일 */
  approvalDate: string | null
  /** 입금일 */
  paymentDate: string | null
  /** 상태 */
  status: AdvanceStatus
  /** 비고 */
  remarks: string | null
  /** 관련 문서 목록 */
  documents?: AdvanceDocument[]
  /** 생성일 */
  createdAt?: string
  /** 수정일 */
  updatedAt?: string
}

/**
 * 선급금 신청 요청
 */
export interface AdvanceCreateRequest {
  /** 신청 금액 */
  requestAmount: number
  /** 신청일 */
  requestDate: string
  /** 비고 */
  remarks?: string
}

/**
 * 선급금 승인 요청
 */
export interface AdvanceApproveRequest {
  /** 승인 금액 */
  approvedAmount: number
  /** 승인일 */
  approvalDate: string
  /** 비고 */
  remarks?: string
}

/**
 * 선급금 수금 확인 요청
 */
export interface AdvanceConfirmRequest {
  /** 입금 금액 */
  paidAmount: number
  /** 입금일 */
  paymentDate: string
  /** 계좌 정보 */
  bankAccount?: string
  /** 비고 */
  remarks?: string
}

/**
 * 선급금 목록 응답
 */
export interface AdvanceListResponse {
  content: AdvancePayment[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ============ 잔금 (Balance) ============

/**
 * 잔금 상태
 */
export type BalanceStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED'

/**
 * 잔금 상태 라벨
 */
export const BALANCE_STATUS_LABELS: Record<BalanceStatus, string> = {
  NOT_REQUESTED: '미신청',
  REQUESTED: '신청',
  APPROVED: '승인',
  PAID: '수금완료',
  REJECTED: '반려'
}

/**
 * 잔금 계산 기준
 */
export type BalanceCalculationBasis = 'REQUESTED' | 'PAID'

/**
 * 잔금 정보 (자동 계산)
 */
export interface BalanceInfo {
  /** 총 계약금액 */
  totalContractAmount: number
  /** 선급금 (신청 기준) */
  advanceRequested: number
  /** 선급금 (입금 기준) */
  advancePaid: number
  /** 기성금 누계 (신청 기준) */
  progressRequested: number
  /** 기성금 누계 (입금 기준) */
  progressPaid: number
  /** 잔금 (신청 기준) = 계약금액 - 선급금(신청) - 기성금(신청) */
  balanceByRequested: number
  /** 잔금 (입금 기준) = 계약금액 - 선급금(입금) - 기성금(입금) */
  balanceByPaid: number
  /** 현재 잔금 상태 */
  status: BalanceStatus
  /** 잔금 요청 정보 (있는 경우) */
  request: BalanceRequest | null
}

/**
 * 잔금 요청 정보
 */
export interface BalanceRequest {
  /** 잔금 요청 ID (PK) */
  balanceRequestId: number
  /** 자금 ID (FK) */
  fundId: number
  /** 신청 금액 */
  requestAmount: number
  /** 승인 금액 */
  approvedAmount: number | null
  /** 입금 금액 */
  paidAmount: number | null
  /** 신청일 */
  requestDate: string
  /** 승인일 */
  approvalDate: string | null
  /** 입금일 */
  paymentDate: string | null
  /** 상태 */
  status: BalanceStatus
  /** 비고 */
  remarks: string | null
  /** 생성일 */
  createdAt?: string
}

/**
 * 잔금 신청 요청
 */
export interface BalanceCreateRequest {
  /** 신청 금액 (자동 계산된 값 또는 수동 입력) */
  requestAmount: number
  /** 신청일 */
  requestDate: string
  /** 계산 기준 (신청/입금) */
  calculationBasis: BalanceCalculationBasis
  /** 비고 */
  remarks?: string
}

/**
 * 잔금 승인 요청
 */
export interface BalanceApproveRequest {
  /** 승인 금액 */
  approvedAmount: number
  /** 승인일 */
  approvalDate: string
  /** 비고 */
  remarks?: string
}

/**
 * 잔금 수금 확인 요청
 */
export interface BalanceConfirmRequest {
  /** 입금 금액 */
  paidAmount: number
  /** 입금일 */
  paymentDate: string
  /** 계좌 정보 */
  bankAccount?: string
  /** 비고 */
  remarks?: string
}

/**
 * 기성 청구 데이터
 * @description ProgressPaymentModal -> ProgressSignatureModal 전달용
 */
export interface ProgressClaimData {
  /** 주문 ID */
  orderId: number
  /** 선택된 출하 ID 목록 */
  shipmentIds: number[]
  /** 비고 */
  remarks?: string
  /** 납품요구번호 */
  deliveryRequestNo: string
  /** 수요기관명 */
  demandOrganization: string
  /** 사업명/현장명 */
  projectName: string
  /** 청구 총액 */
  totalAmount: number
  /** 선급금 비율 (%) */
  advancePaymentRate?: number
  /** 선급금 차감액 */
  advanceDeductionAmount?: number
  /** 실수금액 (청구금액 - 선급금차감액) */
  actualReceivableAmount?: number
  /** 미정산 선급금 잔액 (차감 전) */
  advanceUnsettledBalance?: number
}

// ============ OEM 지급 (OEM Payment) ============

/**
 * OEM 지급 상태
 * - PENDING: 지급 예정 (서버 API 기준)
 * - PAID: 지급 완료
 */
export type OemPaymentStatus = 'PENDING' | 'PAID'

/**
 * OEM 지급 상태 라벨
 */
export const OEM_PAYMENT_STATUS_LABELS: Record<OemPaymentStatus, string> = {
  PENDING: '지급예정',
  PAID: '지급완료'
}

/**
 * OEM 지급 정보
 */
export interface OemPayment {
  /** OEM 지급 ID (PK) */
  oemPaymentId: number
  /** 자금 ID (FK) */
  fundId: number
  /** 기성금 ID (연결된 기성금, 선택) */
  paymentId?: number
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
  /** OEM 업체명 */
  oemCompanyName?: string
  /** OEM 업체 ID */
  oemCompanyId?: number
  /** 계좌 정보 */
  bankAccount?: string
  /** 상태 */
  status: OemPaymentStatus
  /** 비고 */
  remarks: string | null
  /** 생성일 */
  createdAt?: string
  /** 수정일 */
  updatedAt?: string
}

/**
 * OEM 지급 등록 요청
 */
export interface OemPaymentCreateRequest {
  /** 지급 유형 (필수): 'ADVANCE' | 'PROGRESS' */
  paymentType: string
  /** 지급 금액 (필수) */
  paymentAmount: number
  /** 지급 예정일 */
  paymentDate: string
  /** OEM 업체명 */
  oemCompanyName?: string
  /** OEM 업체 ID */
  oemCompanyId?: number
  /** 계좌 정보 */
  bankAccount?: string
  /** 비고 */
  remarks?: string
  /** 기성금 ID (연결된 기성금, 선택) */
  paymentId?: number
}

/**
 * OEM 지급 완료 요청
 */
export interface OemPaymentCompleteRequest {
  /** 실제 지급 금액 */
  paidAmount: number
  /** 실제 지급일 */
  paidDate: string
  /** 계좌 정보 */
  bankAccount?: string
  /** 비고 */
  remarks?: string
}
