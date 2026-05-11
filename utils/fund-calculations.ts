/**
 * 자금 관련 계산 헬퍼.
 *
 * 자금 상세 페이지에서 사용하는 비율/금액 계산.
 * Ref<FundDetail | null> 을 인자로 받아 reactive 의존성을 따른다.
 *
 * (구 composables/useFundCalculations.ts 에서 이전 — composable 형태가 불필요한
 *  순수 계산 묶음이므로 utils로 분류)
 */

import { computed, type Ref } from 'vue'
import type { FundDetail } from '~/types/fund'

export function useFundCalculations(fundDetail: Ref<FundDetail | null>) {
  /** 선급금 비율 (%). 실제 입금된 advancePaymentAmount 기준. */
  const getAdvancePaymentRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    const advanceAmount = fundDetail.value.advancePaymentAmount || 0
    return (advanceAmount / fundDetail.value.contractTotalAmount) * 100
  }

  /** 기성금 비율 (%). */
  const getProgressPaymentRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    return ((fundDetail.value.progressPaymentTotal || 0) / fundDetail.value.contractTotalAmount) * 100
  }

  /** 잔금 비율 (%). 실제 입금된 balancePaidAmount 기준. */
  const getBalancePaymentRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    const paidBalance = fundDetail.value.balancePaidAmount || 0
    return (paidBalance / fundDetail.value.contractTotalAmount) * 100
  }

  /** 수금률 (%). 서버 collectionRate 우선, 없으면 선급+기성. */
  const getCollectionRate = (): number => {
    if (!fundDetail.value?.contractTotalAmount || fundDetail.value.contractTotalAmount <= 0) return 0
    if (fundDetail.value.collectionRate != null) {
      return fundDetail.value.collectionRate
    }
    return getAdvancePaymentRate() + getProgressPaymentRate()
  }

  /** 잔금 금액 (계약금액 - 선급금 - 기성금). */
  const remainingBalance = computed(() => {
    if (!fundDetail.value?.contractTotalAmount) return 0
    const total = fundDetail.value.contractTotalAmount
    const advance = fundDetail.value.advancePaymentAmount || 0
    const progress = fundDetail.value.progressPaymentTotal || 0
    return total - advance - progress
  })

  /** 미수금 (계약금액 - 모든 입금). */
  const outstandingAmount = computed(() => {
    if (!fundDetail.value?.contractTotalAmount) return 0
    const total = fundDetail.value.contractTotalAmount
    const collected =
      (fundDetail.value.advancePaymentAmount || 0) +
      (fundDetail.value.progressPaymentTotal || 0) +
      (fundDetail.value.balancePaidAmount || 0)
    return total - collected
  })

  return {
    getAdvancePaymentRate,
    getProgressPaymentRate,
    getBalancePaymentRate,
    getCollectionRate,
    remainingBalance,
    outstandingAmount
  }
}
