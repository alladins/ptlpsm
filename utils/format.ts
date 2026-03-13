/**
 * 날짜 및 통화 포맷팅 유틸리티 함수
 * 모든 admin 페이지에서 공통으로 사용
 */

/**
 * UTC 날짜 문자열을 안전하게 Date 객체로 파싱
 * ★ Jackson이 LocalDateTime을 Z suffix 없이 직렬화하는 문제 대응
 *   (예: "2025-11-07T08:00:00" → Z가 없으면 브라우저가 로컬 KST로 해석하여 오류 발생)
 * @param dateString - ISO 날짜 문자열 (UTC 기준, Z 유무 모두 대응)
 * @returns UTC 기준 Date 객체
 */
export function parseUtcDate(dateString: string): Date {
  // datetime 형식에서 Z나 오프셋이 없으면 Z를 추가하여 UTC로 강제 파싱
  if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    return new Date(dateString + 'Z')
  }
  return new Date(dateString)
}

/**
 * 날짜를 한국 형식으로 포맷팅 (UTC → KST 변환)
 * ★ API에서 받은 UTC 날짜를 Asia/Seoul 시간대로 변환하여 표시
 * @param dateString - ISO 날짜 문자열 또는 Date 객체 (UTC 기준)
 * @param options - Intl.DateTimeFormat options
 * @returns 포맷팅된 날짜 문자열 (예: "2024. 1. 15.")
 */
export function formatDate(
  dateString?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '-'

  try {
    const date = typeof dateString === 'string' ? parseUtcDate(dateString) : dateString

    // 유효하지 않은 날짜 체크
    if (isNaN(date.getTime())) return '-'

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul',  // ★ UTC → KST 변환
      ...options
    }

    return date.toLocaleDateString('ko-KR', defaultOptions)
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error)
    return '-'
  }
}

/**
 * 날짜와 시간을 한국 형식으로 포맷팅 (UTC → KST 변환)
 * @param dateString - ISO 날짜 문자열 또는 Date 객체 (UTC 기준)
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
    hour12: true,
    timeZone: 'Asia/Seoul',  // ★ UTC → KST 변환
  })
}

/**
 * 현재 로컬 시간을 datetime-local 입력 형식으로 반환
 * @param offsetMinutes - 현재 시간에 추가할 분 (기본값: 0)
 * @returns yyyy-MM-ddTHH:mm 형식의 문자열
 */
export function getLocalDateTimeString(offsetMinutes: number = 0): string {
  const now = new Date()
  if (offsetMinutes) {
    now.setMinutes(now.getMinutes() + offsetMinutes)
  }
  // 로컬 시간 기준으로 yyyy-MM-ddTHH:mm 형식 생성
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * 오늘 날짜에 지정된 시간을 설정하여 datetime-local 입력 형식으로 반환
 * @param hours - 시 (0-23, 기본값: 7)
 * @param minutes - 분 (0-59, 기본값: 0)
 * @returns yyyy-MM-ddTHH:mm 형식의 문자열
 */
export function getDefaultDateTimeString(hours: number = 7, minutes: number = 0): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  return `${year}-${month}-${day}T${h}:${m}`
}

/**
 * 현재 로컬 날짜를 date 입력 형식으로 반환
 * @returns yyyy-MM-dd 형식의 문자열
 */
export function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
 * 날짜 파라미터를 API 전송용 UTC ISO-8601 형식으로 변환
 * ★ 사용자 입력(KST)을 UTC로 변환하여 API에 전송
 * @param dateString - 날짜 문자열 (YYYY-MM-DD, KST 기준)
 * @param isEndDate - 종료일 여부 (종료일은 해당일 KST 23:59:59 → UTC 변환)
 * @returns UTC ISO-8601 문자열 (예: "2025-12-03T15:00:00.000Z")
 */
export function formatDateForApi(
  dateString: string,
  isEndDate: boolean = false
): string {
  if (!dateString) return ''

  try {
    // 날짜 부분만 추출 (YYYY-MM-DD)
    const datePart = dateString.split(/[T ]/)[0]
    if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return ''

    const [year, month, day] = datePart.split('-').map(Number)

    if (isEndDate) {
      // KST 23:59:59 → UTC 변환
      const kstDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - 9 * 60 * 60 * 1000)
      return kstDate.toISOString()
    } else {
      // KST 00:00:00 → UTC 변환
      const kstDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - 9 * 60 * 60 * 1000)
      return kstDate.toISOString()
    }
  } catch (error) {
    console.error('API 날짜 변환 오류:', error)
    return ''
  }
}

/**
 * KST datetime-local 입력값을 UTC ISO-8601로 변환 (API 전송용)
 * @param kstDateTimeStr - KST 기준 datetime-local 값 (YYYY-MM-DDTHH:mm)
 * @returns UTC ISO-8601 문자열 (예: "2025-12-03T22:00:00.000Z")
 */
export function toUtcIsoString(kstDateTimeStr: string | null | undefined): string {
  if (!kstDateTimeStr) return ''

  try {
    // YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm 형식 파싱
    const parts = kstDateTimeStr.split(/[T ]/)
    const datePart = parts[0]
    const timePart = parts[1] || '00:00'

    if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return ''

    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)

    // KST → UTC: 9시간 빼기
    const kstMs = Date.UTC(year, month - 1, day, hour, minute, 0)
    const utcMs = kstMs - 9 * 60 * 60 * 1000
    return new Date(utcMs).toISOString()
  } catch (error) {
    console.error('UTC 변환 오류:', error)
    return ''
  }
}

/**
 * UTC ISO-8601 문자열을 KST datetime-local 입력용으로 변환
 * @param utcStr - UTC ISO-8601 문자열 (예: "2025-12-03T22:00:00" 또는 "2025-12-03T22:00:00Z")
 * @returns KST 기준 YYYY-MM-DDTHH:mm 문자열 (datetime-local input용)
 */
export function utcToKstDateTimeLocal(utcStr: string | null | undefined): string {
  if (!utcStr) return ''

  try {
    // UTC Date 객체 생성 (공통 헬퍼로 Z 없는 문자열도 UTC로 강제 파싱)
    const date = parseUtcDate(utcStr)
    if (isNaN(date.getTime())) return ''

    // KST = UTC + 9시간
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    const y = kstDate.getUTCFullYear()
    const m = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
    const d = String(kstDate.getUTCDate()).padStart(2, '0')
    const hh = String(kstDate.getUTCHours()).padStart(2, '0')
    const mm = String(kstDate.getUTCMinutes()).padStart(2, '0')
    return `${y}-${m}-${d}T${hh}:${mm}`
  } catch (error) {
    console.error('KST 변환 오류:', error)
    return ''
  }
}

/**
 * UTC ISO-8601 문자열을 KST 날짜(YYYY-MM-DD)로 변환
 * @param utcStr - UTC ISO-8601 문자열
 * @returns KST 기준 YYYY-MM-DD 문자열
 */
export function utcToKstDateString(utcStr: string | null | undefined): string {
  if (!utcStr) return ''
  const kstLocal = utcToKstDateTimeLocal(utcStr)
  return kstLocal ? kstLocal.split('T')[0] : ''
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
