/**
 * 납품확인/완료계 버튼 상태 관리 Composable
 *
 * 로직:
 * 1. 모든 출하 인수증 완료 → 서명대기 → 납품확인서 버튼 활성화
 * 2. 납품확인서 서명/PDF 완료 → 완료계 버튼 활성화
 * 3. 완료계 완료 → 잔금 신청 버튼 활성화
 */

import { ref } from 'vue'
import { FUND_ENDPOINTS } from '~/services/api/endpoints/fund.endpoints'
import type { DeliveryButtonState } from '~/types/fund'

export const useDeliveryButtons = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const buttonState = ref<DeliveryButtonState | null>(null)

  /**
   * 버튼 상태 조회
   * @param orderId - 발주 ID
   */
  const fetchButtonState = async (orderId: number): Promise<DeliveryButtonState | null> => {
    loading.value = true
    error.value = null

    try {
      const url = FUND_ENDPOINTS.deliveryButtonState(orderId)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      buttonState.value = data
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : '버튼 상태 조회 중 오류가 발생했습니다.'
      error.value = message
      console.error('Failed to fetch delivery button state:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 버튼 활성화 여부 확인
   */
  const isConfirmationButtonEnabled = () => buttonState.value?.confirmationButtonEnabled ?? false
  const isCompletionButtonEnabled = () => buttonState.value?.completionButtonEnabled ?? false
  const isBalanceButtonEnabled = () => buttonState.value?.balanceButtonEnabled ?? false

  /**
   * 버튼 비활성화 사유
   */
  const getButtonReason = () => buttonState.value?.reason ?? ''

  return {
    loading,
    error,
    buttonState,
    fetchButtonState,
    isConfirmationButtonEnabled,
    isCompletionButtonEnabled,
    isBalanceButtonEnabled,
    getButtonReason
  }
}
