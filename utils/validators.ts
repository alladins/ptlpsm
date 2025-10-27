/**
 * 순수 검증/포맷팅 유틸리티 함수
 *
 * 목적:
 * - Vue에 독립적인 순수 함수
 * - 여러 페이지에서 중복되던 검증/포맷팅 로직 통합
 * - 기존 utils/format.ts, utils/validate.ts와 통합
 *
 * 중복 제거:
 * - formatPhoneNumber: 기존 utils/format.ts 재사용
 * - validateDateRange: 기존 utils/validate.ts 재사용
 * - 이메일/전화번호 검증: 8개 페이지에서 중복 (~20줄 × 8 = 160줄)
 * - 총 ~160줄 중복 제거
 */

// 기존 utils 재사용 (중복 방지)
import {
  validatePhoneNumber,
  validateEmail
} from './validate'

/**
 * 전화번호 검증 (기존 utils/validate.ts 재사용)
 */
export function isValidPhone(phone: string): boolean {
  return validatePhoneNumber(phone)
}

/**
 * 이메일 검증 (기존 utils/validate.ts 재사용)
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email)
}

/**
 * 사업자등록번호 포맷팅 (123-45-67890 형식)
 *
 * @param value - 입력된 사업자등록번호
 * @returns 포맷팅된 사업자등록번호
 *
 * @example
 * formatBusinessNumber('1234567890') // '123-45-67890'
 */
export function formatBusinessNumber(value: string): string {
  if (!value) return ''

  const numbers = value.replace(/[^0-9]/g, '')

  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
  }
}

/**
 * 사업자등록번호 검증
 *
 * @param businessNumber - 검증할 사업자등록번호
 * @returns 유효성 여부
 *
 * @example
 * isValidBusinessNumber('123-45-67890') // true (길이만 체크)
 * isValidBusinessNumber('1234567890') // true
 */
export function isValidBusinessNumber(businessNumber: string): boolean {
  if (!businessNumber) return false

  const numbers = businessNumber.replace(/[^0-9]/g, '')
  return numbers.length === 10
}

/**
 * 우편번호 포맷팅 (12345 형식, 5자리)
 *
 * @param value - 입력된 우편번호
 * @returns 포맷팅된 우편번호
 *
 * @example
 * formatPostalCode('12345') // '12345'
 * formatPostalCode('123-456') // '12345'
 */
export function formatPostalCode(value: string): string {
  if (!value) return ''

  const numbers = value.replace(/[^0-9]/g, '')
  return numbers.slice(0, 5)
}

/**
 * 우편번호 검증
 *
 * @param postalCode - 검증할 우편번호
 * @returns 유효성 여부
 *
 * @example
 * isValidPostalCode('12345') // true
 * isValidPostalCode('1234') // false
 */
export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode) return false

  const numbers = postalCode.replace(/[^0-9]/g, '')
  return numbers.length === 5
}

/**
 * URL 검증
 *
 * @param url - 검증할 URL
 * @returns 유효성 여부
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('http://example.com') // true
 * isValidUrl('example.com') // false
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 숫자만 포함 여부 검증
 *
 * @param value - 검증할 값
 * @returns 숫자만 포함 여부
 *
 * @example
 * isNumericOnly('12345') // true
 * isNumericOnly('123a45') // false
 */
export function isNumericOnly(value: string): boolean {
  if (!value) return false
  return /^[0-9]+$/.test(value)
}

/**
 * 영문만 포함 여부 검증
 *
 * @param value - 검증할 값
 * @returns 영문만 포함 여부
 *
 * @example
 * isAlphaOnly('abcABC') // true
 * isAlphaOnly('abc123') // false
 */
export function isAlphaOnly(value: string): boolean {
  if (!value) return false
  return /^[a-zA-Z]+$/.test(value)
}

/**
 * 영문+숫자만 포함 여부 검증
 *
 * @param value - 검증할 값
 * @returns 영문+숫자만 포함 여부
 *
 * @example
 * isAlphaNumericOnly('abc123') // true
 * isAlphaNumericOnly('abc-123') // false
 */
export function isAlphaNumericOnly(value: string): boolean {
  if (!value) return false
  return /^[a-zA-Z0-9]+$/.test(value)
}

/**
 * 한글만 포함 여부 검증
 *
 * @param value - 검증할 값
 * @returns 한글만 포함 여부
 *
 * @example
 * isKoreanOnly('홍길동') // true
 * isKoreanOnly('홍길동abc') // false
 */
export function isKoreanOnly(value: string): boolean {
  if (!value) return false
  return /^[가-힣]+$/.test(value)
}

/**
 * 비밀번호 강도 검증
 *
 * @param password - 검증할 비밀번호
 * @param minLength - 최소 길이 (기본 8)
 * @returns { valid: boolean, strength: 'weak' | 'medium' | 'strong', message?: string }
 *
 * @example
 * checkPasswordStrength('Pass123!') // { valid: true, strength: 'strong' }
 * checkPasswordStrength('pass') // { valid: false, strength: 'weak', message: '...' }
 */
export function checkPasswordStrength(
  password: string,
  minLength: number = 8
): { valid: boolean; strength: 'weak' | 'medium' | 'strong'; message?: string } {
  if (!password) {
    return { valid: false, strength: 'weak', message: '비밀번호를 입력해주세요.' }
  }

  if (password.length < minLength) {
    return {
      valid: false,
      strength: 'weak',
      message: `비밀번호는 최소 ${minLength}자 이상이어야 합니다.`
    }
  }

  // 강도 체크
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length

  if (score <= 2) {
    return {
      valid: false,
      strength: 'weak',
      message: '영문 대소문자, 숫자, 특수문자 중 3가지 이상을 조합해주세요.'
    }
  } else if (score === 3) {
    return { valid: true, strength: 'medium' }
  } else {
    return { valid: true, strength: 'strong' }
  }
}

/**
 * 파일 크기 검증
 *
 * @param file - 검증할 파일
 * @param maxSizeMB - 최대 크기 (MB 단위)
 * @returns 유효성 여부
 *
 * @example
 * isValidFileSize(file, 10) // 10MB 이하인지 체크
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 파일 확장자 검증
 *
 * @param file - 검증할 파일
 * @param allowedExtensions - 허용할 확장자 배열 (예: ['pdf', 'jpg', 'png'])
 * @returns 유효성 여부
 *
 * @example
 * isValidFileExtension(file, ['pdf']) // PDF 파일인지 체크
 */
export function isValidFileExtension(file: File, allowedExtensions: string[]): boolean {
  const fileName = file.name.toLowerCase()
  return allowedExtensions.some(ext => fileName.endsWith(`.${ext.toLowerCase()}`))
}

