/**
 * 자금 관련 계산 Composable
 *
 * 자금 상세 페이지에서 사용하는 비율/금액 계산 함수 모음
 * - 선급금 비율 계산
 * - 기성금 비율 계산
 * - 잔금 비율 계산
 * - 수금률 계산
 *
 * @example
 * const { getAdvancePaymentRate, getProgressPaymentRate } = useFundCalculations(fundDetail)
 */

import { computed, type Ref } from 'vue'
import type { FundDetail } from '~/types/fund'

export function useFundCalculations(fundDetail: Ref<FundDetail | null>) {
  /**
   * 선급금 비율 계산 (실제 입금된 금액 기준)
   * @returns 선급금 비율 (%)
   */
  const getAdvancePaymentRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    // 서버의 advancePaymentAmount 사용 (실제 입금된 선급금)
    const advanceAmount = fundDetail.value.advancePaymentAmount || 0
    return (advanceAmount / fundDetail.value.contractTotalAmount) * 100
  }

  /**
   * 기성금 비율 계산
   * @returns 기성금 비율 (%)
   */
  const getProgressPaymentRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    return ((fundDetail.value.progressPaymentTotal || 0) / fundDetail.value.contractTotalAmount) * 100
  }

  /**
   * 잔금 비율 계산 (실제 입금된 잔금 기준)
   * @returns 잔금 비율 (%)
   */
  const getBalancePaymentRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    // 서버의 balancePaidAmount 사용 (실제 입금된 잔금)
    const paidBalance = fundDetail.value.balancePaidAmount || 0
    return (paidBalance / fundDetail.value.contractTotalAmount) * 100
  }

  /**
   * 수금률 계산
   * @returns 수금률 (%)
   */
  const getCollectionRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    // 서버에서 collectionRate를 제공하면 사용 (0도 유효한 값이므로 null/undefined 체크)
    if (fundDetail.value.collectionRate != null) {
      return fundDetail.value.collectionRate
    }
    // fallback: 프론트에서 계산
    return getAdvancePaymentRate() + getProgressPaymentRate()
  }

  /**
   * 잔금 (계약금액 - 선급금 - 기성금)
   */
  const remainingBalance = computed(() => {
    if (!fundDetail.value?.contractTotalAmount) return 0
    const total = fundDetail.value.contractTotalAmount
    const advance = fundDetail.value.advancePaymentAmount || 0
    const progress = fundDetail.value.progressPaymentTotal || 0
    return total - advance - progress
  })

  /**
   * 미수금 (수금해야 할 금액)
   */
  const outstandingAmount = computed(() => {
    if (!fundDetail.value?.contractTotalAmount) return 0
    const total = fundDetail.value.contractTotalAmount
    const collected = (fundDetail.value.advancePaymentAmount || 0) +
                     (fundDetail.value.progressPaymentTotal || 0) +
                     (fundDetail.value.balancePaidAmount || 0)
    return total - collected
  })

  return {
    // 비율 계산 함수
    getAdvancePaymentRate,
    getProgressPaymentRate,
    getBalancePaymentRate,
    getCollectionRate,

    // 금액 computed
    remainingBalance,
    outstandingAmount
  }
}
