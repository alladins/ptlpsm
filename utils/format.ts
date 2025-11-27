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
 * 수량을 소수점 포함하여 포맷팅 (BigDecimal 대응)
 * @param qty - 수량 (숫자 또는 문자열)
 * @param decimals - 소수점 자릿수 (기본값: 2)
 * @param trimZero - 소수점 이하가 0일 때 생략 여부 (기본값: true)
 * @returns 포맷팅된 수량 문자열 (예: "1,234.56" 또는 "1,234")
 */
export function formatQuantity(
  qty?: number | string | null,
  decimals: number = 2,
  trimZero: boolean = true
): string {
  if (qty === null || qty === undefined || qty === '') return '-'

  try {
    const numericValue = typeof qty === 'string' ? parseFloat(qty) : qty

    if (isNaN(numericValue)) return '-'

    // 소수점 자릿수에 맞춰 포맷팅
    const formatted = new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: trimZero ? 0 : decimals,
      maximumFractionDigits: decimals
    }).format(numericValue)

    return formatted
  } catch (error) {
    console.error('수량 포맷팅 오류:', error)
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

/**
 * ===========================================
 * 입력용 포맷팅 함수 (실시간 입력 시 사용)
 * ===========================================
 */

/**
 * 사업자등록번호 입력 포맷팅 (실시간)
 * @param value - 입력된 문자열
 * @returns 포맷팅된 사업자등록번호 (예: "123-45-67890")
 * @description 10자리 숫자를 123-45-67890 형식으로 자동 변환
 */
export function formatBusinessNumberInput(value: string): string {
  // 숫자만 추출
  let numbers = value.replace(/[^0-9]/g, '')

  // 최대 10자리로 제한
  if (numbers.length > 10) {
    numbers = numbers.substring(0, 10)
  }

  // 포맷팅 적용
  if (numbers.length > 5) {
    return `${numbers.substring(0, 3)}-${numbers.substring(3, 5)}-${numbers.substring(5)}`
  } else if (numbers.length > 3) {
    return `${numbers.substring(0, 3)}-${numbers.substring(3)}`
  } else {
    return numbers
  }
}

/**
 * 전화번호/팩스번호 입력 포맷팅 (실시간)
 * @param value - 입력된 문자열
 * @returns 포맷팅된 전화번호 (예: "010-1234-5678", "02-1234-5678")
 * @description 한국 전화번호 형식에 맞춰 자동 포맷팅 및 길이 제한
 */
export function formatPhoneNumberInput(value: string): string {
  // 숫자만 추출
  let numbers = value.replace(/[^0-9]/g, '')

  // 서울 지역번호 (02)
  if (numbers.startsWith('02')) {
    // 최대 10자리 (02-1234-5678 또는 02-123-4567)
    if (numbers.length > 10) {
      numbers = numbers.substring(0, 10)
    }

    if (numbers.length === 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1-$2-$3')
    } else if (numbers.length === 9) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1-$2-$3')
    } else if (numbers.length > 6) {
      return numbers.replace(/^(\d{2})(\d{3,4})(.*)$/, '$1-$2-$3')
    } else if (numbers.length > 2) {
      return numbers.replace(/^(\d{2})(.*)$/, '$1-$2')
    }
  }
  // 휴대폰 또는 지역번호 (3자리)
  else {
    // 최대 11자리 (010-1234-5678 또는 031-123-4567)
    if (numbers.length > 11) {
      numbers = numbers.substring(0, 11)
    }

    if (numbers.length === 11) {
      return numbers.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')
    } else if (numbers.length === 10) {
      return numbers.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
    } else if (numbers.length > 7) {
      return numbers.replace(/^(\d{3})(\d{3,4})(.*)$/, '$1-$2-$3')
    } else if (numbers.length > 3) {
      return numbers.replace(/^(\d{3})(.*)$/, '$1-$2')
    }
  }

  return numbers
}

/**
 * 이메일 입력 검증 및 정규화
 * @param value - 입력된 이메일
 * @returns 소문자로 변환된 이메일 (공백 제거)
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * 우편번호 입력 포맷팅 (실시간)
 * @param value - 입력된 문자열
 * @returns 포맷팅된 우편번호 (예: "12345" - 5자리 숫자)
 */
export function formatPostalCodeInput(value: string): string {
  // 숫자만 추출
  let numbers = value.replace(/[^0-9]/g, '')

  // 최대 5자리로 제한
  if (numbers.length > 5) {
    numbers = numbers.substring(0, 5)
  }

  return numbers
}

/**
 * 숫자만 추출 (금액, 수량 입력용)
 * @param value - 입력된 문자열
 * @returns 숫자만 포함된 문자열
 */
export function extractNumbers(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

/**
 * 나라장터 등록번호 입력 포맷팅 (실시간)
 * @param value - 입력된 문자열
 * @returns 포맷팅된 나라장터 등록번호 (8자리 영문+숫자)
 */
export function formatG2BNumberInput(value: string): string {
  // 영문 대문자와 숫자만 추출
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')

  // 최대 8자리로 제한
  if (cleaned.length > 8) {
    cleaned = cleaned.substring(0, 8)
  }

  return cleaned
}
