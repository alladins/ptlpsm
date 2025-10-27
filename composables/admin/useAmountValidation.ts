import { ref, computed, nextTick } from 'vue'

/**
 * 금액 검증 Composable
 * 계약금액과 품목 합산금액 비교 로직을 공통화
 */
export function useAmountValidation() {
  // 알림 표시 상태
  const showAmountMismatchAlert = ref(false)

  // 계약금액 input ref
  const contractAmountInput = ref<HTMLInputElement>()

  /**
   * 금액 일치 여부 체크
   * @param contractAmount 계약금액
   * @param totalAmount 품목 합산금액
   * @returns 일치 여부
   */
  const isAmountMatch = (contractAmount?: number, totalAmount?: number): boolean => {
    if (!contractAmount) return true
    return Math.abs((totalAmount || 0) - contractAmount) < 1 // 1원 이하 차이는 일치로 간주
  }

  /**
   * 금액 불일치 체크 및 알림 표시
   * @param contractAmount 계약금액
   * @param totalAmount 품목 합산금액
   */
  const checkAmountMismatch = (contractAmount?: number, totalAmount?: number) => {
    const contract = Number(contractAmount || 0)
    const calculated = Number(totalAmount || 0)

    console.log('금액 비교:', { contract, calculated })

    // 둘 다 0이 아닐 때만 비교
    if (contract > 0 && calculated > 0) {
      if (Math.abs(contract - calculated) > 0.01) { // 소수점 오차 허용
        console.log('금액 불일치 감지')
        showAmountMismatchAlert.value = true

        // 포커스 이동
        nextTick(() => {
          contractAmountInput.value?.focus()
        })
      } else {
        showAmountMismatchAlert.value = false
      }
    } else {
      showAmountMismatchAlert.value = false
    }
  }

  /**
   * 통화 포맷팅
   * @param amount 금액
   * @returns 포맷된 문자열
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  /**
   * 알림 닫기
   */
  const closeAlert = () => {
    showAmountMismatchAlert.value = false
  }

  return {
    // State
    showAmountMismatchAlert,
    contractAmountInput,

    // Methods
    isAmountMatch,
    checkAmountMismatch,
    formatCurrency,
    closeAlert
  }
}
