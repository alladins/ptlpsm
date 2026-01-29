/**
 * 자금 관련 상태 포맷팅 Composable
 *
 * 자금 상세 페이지에서 사용하는 상태 라벨/클래스 포맷팅 함수 모음
 * - 자금 상태 (ACTIVE, COMPLETED, CANCELLED)
 * - 결제 상태 (REQUESTED, APPROVED, PAID, REJECTED)
 * - 선급금 상태
 * - 서명 상태
 * - OEM 지급 상태
 *
 * @example
 * const {
 *   getStatusClass,
 *   getStatusLabel,
 *   getPaymentStatusClass,
 *   getPaymentStatusLabel,
 *   isSignatureCompleted
 * } = useFundStatusFormatters()
 */

import type { PaymentStatus } from '~/types/fund'
import type { SignatureStatus } from '~/types/baseline'
import { SIGNATURE_STATUS_LABELS, SIGNATURE_STATUS_CLASSES } from '~/types/baseline'
import { OEM_PAYMENT_STATUS_LABELS, type OemPaymentStatus } from '~/types/fund'

export function useFundStatusFormatters() {
  // ============ 자금 상태 ============

  /**
   * 자금 상태 CSS 클래스
   */
  const getStatusClass = (status?: string): string => {
    if (!status) return ''
    switch (status) {
      case 'ACTIVE': return 'status-active'
      case 'COMPLETED': return 'status-completed'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  /**
   * 자금 상태 라벨
   */
  const getStatusLabel = (status?: string): string => {
    if (!status) return '-'
    const labels: Record<string, string> = {
      ACTIVE: '진행중',
      COMPLETED: '완료',
      CANCELLED: '취소'
    }
    return labels[status] || status
  }

  // ============ 결제 상태 ============

  /**
   * 결제 상태 CSS 클래스
   */
  const getPaymentStatusClass = (status?: PaymentStatus): string => {
    if (!status) return ''
    switch (status) {
      case 'REQUESTED': return 'status-requested'
      case 'APPROVED': return 'status-approved'
      case 'PAID': return 'status-paid'
      case 'REJECTED': return 'status-rejected'
      default: return ''
    }
  }

  /**
   * 결제 상태 라벨
   */
  const getPaymentStatusLabel = (status?: PaymentStatus): string => {
    if (!status) return '-'
    const labels: Record<PaymentStatus, string> = {
      REQUESTED: '요청',
      APPROVED: '승인',
      PAID: '지급완료',
      REJECTED: '반려'
    }
    return labels[status] || status
  }

  // ============ 선급금 상태 ============

  /**
   * 선급금 상태 CSS 클래스
   */
  const getAdvanceStatusClass = (status?: string): string => {
    if (!status) return ''
    const classMap: Record<string, string> = {
      REQUESTED: 'status-requested',
      APPROVED: 'status-approved',
      PAID: 'status-paid',
      REJECTED: 'status-rejected'
    }
    return classMap[status] || ''
  }

  /**
   * 선급금 상태 라벨
   */
  const getAdvanceStatusLabel = (status?: string): string => {
    if (!status) return '-'
    const labelMap: Record<string, string> = {
      REQUESTED: '신청',
      APPROVED: '승인',
      PAID: '수금완료',
      REJECTED: '반려'
    }
    return labelMap[status] || status
  }

  // ============ 서명 상태 ============

  /**
   * 서명 상태 CSS 클래스
   * @description types/baseline.ts의 SIGNATURE_STATUS_CLASSES 사용
   */
  const getSignatureStatusClass = (status?: string): string => {
    if (!status) return 'signature-pending'
    return SIGNATURE_STATUS_CLASSES[status as SignatureStatus] || 'signature-pending'
  }

  /**
   * 서명 상태 라벨
   * @description types/baseline.ts의 SIGNATURE_STATUS_LABELS 사용
   */
  const getSignatureStatusLabel = (status?: string): string => {
    if (!status) return '서명대기'
    return SIGNATURE_STATUS_LABELS[status as SignatureStatus] || '서명대기'
  }

  /**
   * 서명 완료 여부 확인
   */
  const isSignatureCompleted = (status?: string): boolean => {
    return status === 'SIGNATURE_COMPLETED'
  }

  // ============ OEM 지급 상태 ============

  /**
   * OEM 지급 상태 CSS 클래스
   */
  const getOemPaymentStatusClass = (status?: OemPaymentStatus): string => {
    if (!status) return ''
    const classMap: Record<OemPaymentStatus, string> = {
      PENDING: 'status-pending',
      PAID: 'status-paid'
    }
    return classMap[status] || ''
  }

  /**
   * OEM 지급 상태 라벨
   */
  const getOemPaymentStatusLabel = (status?: OemPaymentStatus): string => {
    if (!status) return '-'
    return OEM_PAYMENT_STATUS_LABELS[status] || status
  }

  return {
    // 자금 상태
    getStatusClass,
    getStatusLabel,

    // 결제 상태
    getPaymentStatusClass,
    getPaymentStatusLabel,

    // 선급금 상태
    getAdvanceStatusClass,
    getAdvanceStatusLabel,

    // 서명 상태
    getSignatureStatusClass,
    getSignatureStatusLabel,
    isSignatureCompleted,

    // OEM 지급 상태
    getOemPaymentStatusClass,
    getOemPaymentStatusLabel
  }
}
