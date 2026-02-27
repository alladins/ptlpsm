/**
 * OEM 지급 관련 타입 정의
 * @description OEM 제조사에 대한 지급(선급금/기성금/잔금) 관리 타입
 * @created 2026-02-09
 */

/**
 * 지급 유형
 */
export type PaymentType = 'ADVANCE' | 'PROGRESS' | 'BALANCE'

/**
 * 지급 유형 라벨
 */
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ADVANCE: '선급금',
  PROGRESS: '기성금',
  BALANCE: '잔금'
}

/**
 * 지급 유형별 배지 색상 (Tailwind 클래스)
 */
export const PAYMENT_TYPE_COLORS: Record<PaymentType, string> = {
  ADVANCE: 'bg-blue-100 text-blue-700',
  PROGRESS: 'bg-green-100 text-green-700',
  BALANCE: 'bg-purple-100 text-purple-700'
}

/**
 * 지급 내역 응답
 */
export interface Payment {
  /** 지급 ID */
  paymentId: number
  /** 발주서 ID */
  poId: number
  /** 발주서 번호 */
  poNo: string
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 지급 금액 */
  paymentAmount: number
  /** 지급일자 */
  paymentDate: string
  /** 지급 유형 */
  paymentType: PaymentType
  /** 비고 */
  remarks: string | null
  /** 생성일시 */
  createdAt: string
  /** 생성자 */
  createdBy: string
}

/**
 * 지급 등록 요청
 */
export interface PaymentRequest {
  /** 발주서 ID */
  poId: number
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** 지급 금액 */
  paymentAmount: number
  /** 지급일자 */
  paymentDate: string
  /** 지급 유형 (미사용, optional) */
  paymentType?: PaymentType
  /** 비고 */
  remarks?: string
}

/**
 * 지급 목록 필터
 */
export interface PaymentListFilter {
  /** 발주서 ID */
  poId?: number
  /** OEM 제조사 ID */
  oemCompanyId?: number
  /** 지급 유형 */
  paymentType?: string
  /** 시작일 */
  startDate?: string
  /** 종료일 */
  endDate?: string
  /** 페이지 번호 (0-indexed) */
  page?: number
  /** 페이지 크기 */
  size?: number
}

/**
 * OEM 제조사별 지급 요약
 */
export interface PaymentSummary {
  /** OEM 제조사 ID */
  oemCompanyId: number
  /** OEM 제조사명 */
  oemCompanyName: string
  /** 발주 총액 */
  totalPoAmount: number
  /** 총 지급액 */
  totalPaidAmount: number
  /** 미지급액 */
  unpaidAmount: number
  /** 선급금 합계 */
  advanceAmount: number
  /** 기성금 합계 */
  progressAmount: number
  /** 잔금 합계 */
  balanceAmount: number
}
