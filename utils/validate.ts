/**
 * 폼 유효성 검증 유틸리티 함수
 * 모든 admin 페이지에서 공통으로 사용
 */

/**
 * 이메일 형식 검증
 * @param email - 이메일 문자열
 * @returns 유효하면 true, 아니면 false
 */
export function validateEmail(email: string): boolean {
  if (!email) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 전화번호 형식 검증 (한국)
 * @param phoneNumber - 전화번호 문자열
 * @returns 유효하면 true, 아니면 false
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false

  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, '')

  // 10자리 또는 11자리 검증
  return numbers.length === 10 || numbers.length === 11
}

/**
 * 전화번호 포맷 자동 적용
 * @deprecated 대신 utils/format.ts의 formatPhoneNumberInput 사용을 권장합니다
 * @param value - 입력된 전화번호
 * @returns 포맷팅된 전화번호
 */
export function formatPhoneInput(value: string): string {
  // 중복 제거: utils/format.ts의 formatPhoneNumberInput 사용
  // 이 함수는 하위 호환성을 위해 유지되며, 내부적으로 formatPhoneNumberInput을 호출합니다
  const { formatPhoneNumberInput } = require('./format')
  return formatPhoneNumberInput(value)
}

/**
 * 필수 필드 검증
 * @param value - 검증할 값
 * @param fieldName - 필드명 (에러 메시지용)
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateRequired(value: any, fieldName: string): string {
  if (value === null || value === undefined || value === '') {
    return `${fieldName}을(를) 입력해주세요.`
  }
  return ''
}

/**
 * 최소 길이 검증
 * @param value - 검증할 문자열
 * @param minLength - 최소 길이
 * @param fieldName - 필드명 (에러 메시지용)
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): string {
  if (!value) return ''

  if (value.length < minLength) {
    return `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.`
  }
  return ''
}

/**
 * 최대 길이 검증
 * @param value - 검증할 문자열
 * @param maxLength - 최대 길이
 * @param fieldName - 필드명 (에러 메시지용)
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): string {
  if (!value) return ''

  if (value.length > maxLength) {
    return `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.`
  }
  return ''
}

/**
 * 숫자 범위 검증
 * @param value - 검증할 숫자
 * @param min - 최솟값
 * @param max - 최댓값
 * @param fieldName - 필드명 (에러 메시지용)
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): string {
  if (value === null || value === undefined) return ''

  if (value < min || value > max) {
    return `${fieldName}은(는) ${min}에서 ${max} 사이의 값이어야 합니다.`
  }
  return ''
}

/**
 * 날짜 범위 검증 (시작일 <= 종료일)
 * @param startDate - 시작일
 * @param endDate - 종료일
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return '시작일은 종료일보다 이전이어야 합니다.'
  }
  return ''
}

/**
 * 사업자등록번호 형식 검증
 * @param businessNumber - 사업자등록번호 (10자리)
 * @returns 유효하면 true, 아니면 false
 */
export function validateBusinessNumber(businessNumber: string): boolean {
  if (!businessNumber) return false

  const numbers = businessNumber.replace(/\D/g, '')

  // 10자리 검증
  if (numbers.length !== 10) return false

  // 사업자등록번호 체크섬 검증
  const checksum = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * checksum[i]
  }

  sum += Math.floor((parseInt(numbers[8]) * 5) / 10)
  const remainder = (10 - (sum % 10)) % 10

  return remainder === parseInt(numbers[9])
}

/**
 * URL 형식 검증
 * @param url - URL 문자열
 * @returns 유효하면 true, 아니면 false
 */
export function validateUrl(url: string): boolean {
  if (!url) return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 비밀번호 강도 검증 (8자 이상, 영문/숫자/특수문자 포함)
 * @param password - 비밀번호 문자열
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validatePassword(password: string): string {
  if (!password) return '비밀번호를 입력해주세요.'

  if (password.length < 8) {
    return '비밀번호는 최소 8자 이상이어야 합니다.'
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  const criteria = [hasUpperCase || hasLowerCase, hasNumber, hasSpecialChar]
  const passedCriteria = criteria.filter(Boolean).length

  if (passedCriteria < 2) {
    return '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상 포함해야 합니다.'
  }

  return ''
}

/**
 * 양수 검증
 * @param value - 검증할 숫자
 * @param fieldName - 필드명 (에러 메시지용)
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validatePositiveNumber(value: number, fieldName: string): string {
  if (value === null || value === undefined) return ''

  if (value <= 0) {
    return `${fieldName}은(는) 0보다 큰 값이어야 합니다.`
  }
  return ''
}

/**
 * 파일 크기 검증
 * @param fileSize - 파일 크기 (bytes)
 * @param maxSize - 최대 크기 (MB)
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateFileSize(fileSize: number, maxSize: number): string {
  const maxBytes = maxSize * 1024 * 1024

  if (fileSize > maxBytes) {
    return `파일 크기는 최대 ${maxSize}MB까지 업로드 가능합니다.`
  }
  return ''
}

/**
 * 파일 확장자 검증
 * @param fileName - 파일명
 * @param allowedExtensions - 허용된 확장자 배열 (예: ['jpg', 'png', 'pdf'])
 * @returns 에러 메시지 또는 빈 문자열
 */
export function validateFileExtension(
  fileName: string,
  allowedExtensions: string[]
): string {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension || !allowedExtensions.includes(extension)) {
    return `허용된 파일 형식: ${allowedExtensions.join(', ')}`
  }
  return ''
}
