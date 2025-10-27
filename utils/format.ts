/**
 * 날짜 및 통화 포맷팅 유틸리티 함수
 * 모든 admin 페이지에서 공통으로 사용
 */

/**
 * 날짜를 한국 형식으로 포맷팅
 * @param dateString - ISO 날짜 문자열 또는 Date 객체
 * @param options - Intl.DateTimeFormat options
 * @returns 포맷팅된 날짜 문자열 (예: "2024. 1. 15.")
 */
export function formatDate(
  dateString?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '-'

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString

    // 유효하지 않은 날짜 체크
    if (isNaN(date.getTime())) return '-'

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    }

    return date.toLocaleDateString('ko-KR', defaultOptions)
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error)
    return '-'
  }
}

/**
 * 날짜와 시간을 한국 형식으로 포맷팅
 * @param dateString - ISO 날짜 문자열 또는 Date 객체
 * @returns 포맷팅된 날짜/시간 문자열 (예: "2024. 1. 15. 오후 3:30")
 */
export function formatDateTime(dateString?: string | Date | null): string {
  if (!dateString) return '-'

  return formatDate(dateString, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * 통화를 한국 원화 형식으로 포맷팅
 * @param amount - 금액 (숫자)
 * @param suffix - 접미사 (기본값: '원')
 * @returns 포맷팅된 통화 문자열 (예: "1,234,567원")
 */
export function formatCurrency(
  amount?: number | string | null,
  suffix: string = '원'
): string {
  if (amount === null || amount === undefined || amount === '') return '-'

  try {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(numericAmount)) return '-'

    return new Intl.NumberFormat('ko-KR').format(numericAmount) + suffix
  } catch (error) {
    console.error('통화 포맷팅 오류:', error)
    return '-'
  }
}

/**
 * 숫자를 천 단위 구분자로 포맷팅
 * @param num - 숫자
 * @returns 포맷팅된 숫자 문자열 (예: "1,234,567")
 */
export function formatNumber(num?: number | string | null): string {
  if (num === null || num === undefined || num === '') return '-'

  try {
    const numericValue = typeof num === 'string' ? parseFloat(num) : num

    if (isNaN(numericValue)) return '-'

    return new Intl.NumberFormat('ko-KR').format(numericValue)
  } catch (error) {
    console.error('숫자 포맷팅 오류:', error)
    return '-'
  }
}

/**
 * 날짜 파라미터를 API 전송용 ISO 형식으로 변환
 * @param dateString - 날짜 문자열
 * @param isEndDate - 종료일 여부 (종료일은 23:59:59로 설정)
 * @returns ISO 형식 날짜 문자열
 */
export function formatDateForApi(
  dateString: string,
  isEndDate: boolean = false
): string {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) return ''

    if (isEndDate) {
      // 종료일은 23:59:59.999로 설정
      date.setHours(23, 59, 59, 999)
    } else {
      // 시작일은 00:00:00.000으로 설정
      date.setHours(0, 0, 0, 0)
    }

    return date.toISOString()
  } catch (error) {
    console.error('API 날짜 변환 오류:', error)
    return ''
  }
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 포맷팅
 * @param bytes - 바이트 크기
 * @returns 포맷팅된 파일 크기 문자열 (예: "1.5 MB")
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}

/**
 * 전화번호를 포맷팅
 * @param phoneNumber - 전화번호 문자열
 * @returns 포맷팅된 전화번호 (예: "010-1234-5678")
 */
export function formatPhoneNumber(phoneNumber?: string | null): string {
  if (!phoneNumber) return '-'

  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, '')

  // 전화번호 길이에 따라 포맷팅
  if (numbers.length === 10) {
    // 02-1234-5678 또는 031-123-4567
    return numbers.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3')
  } else if (numbers.length === 11) {
    // 010-1234-5678
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }

  return phoneNumber
}

/**
 * 퍼센트를 포맷팅
 * @param value - 퍼센트 값 (0-100)
 * @param decimals - 소수점 자릿수 (기본값: 1)
 * @returns 포맷팅된 퍼센트 문자열 (예: "12.5%")
 */
export function formatPercent(
  value?: number | null,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return '-'

  return `${value.toFixed(decimals)}%`
}
