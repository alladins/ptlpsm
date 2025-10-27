/**
 * 폼 검증 통합 Composable
 *
 * 목적:
 * - 모든 폼 검증 로직 통합
 * - 룰 기반 검증으로 중복 제거
 * - 재사용 가능한 검증 룰 제공
 *
 * 사용 예시:
 * ```typescript
 * const { errors, validateAll, validateField, rules, clearErrors } = useFormValidation({
 *   customerNm: '',
 *   salesTitle: '',
 *   customerTel: ''
 * })
 *
 * const validationRules = {
 *   customerNm: [rules.required('담당자명')],
 *   salesTitle: [rules.required('사업명'), rules.minLength(2)],
 *   customerTel: [rules.phone()]
 * }
 *
 * if (!validateAll(formData, validationRules)) {
 *   return // 검증 실패
 * }
 * ```
 */

import { reactive } from 'vue'

/**
 * 검증 룰 함수 타입
 * @returns 에러 메시지 (null이면 검증 통과)
 */
export type ValidationRule<T = any> = (value: T) => string | null

/**
 * 검증 룰 맵 타입
 */
export interface ValidationRules<T> {
  [K: string]: ValidationRule[]
}

export interface UseFormValidationReturn<T> {
  /** 에러 메시지 객체 (reactive) */
  errors: T
  /** 단일 필드 검증 */
  validateField: (field: keyof T, value: any, rules: ValidationRule[]) => boolean
  /** 전체 필드 검증 */
  validateAll: (data: Record<string, any>, ruleMap: ValidationRules<T>) => boolean
  /** 에러 메시지 초기화 */
  clearErrors: () => void
  /** 단일 에러 메시지 설정 */
  setError: (field: keyof T, message: string) => void
  /** 에러가 있는지 확인 */
  hasErrors: () => boolean
  /** 검증 룰 헬퍼 */
  rules: ValidationRuleHelpers
}

/**
 * 폼 검증 Composable
 *
 * @template T - 에러 메시지 객체 타입
 * @param initialErrors - 초기 에러 객체
 * @returns 검증 관리 객체
 */
export function useFormValidation<T extends Record<string, any>>(
  initialErrors: T
): UseFormValidationReturn<T> {
  // 에러 상태 (reactive)
  const errors = reactive<T>({ ...initialErrors })

  /**
   * 단일 필드 검증
   *
   * @param field - 필드명
   * @param value - 검증할 값
   * @param rules - 검증 룰 배열
   * @returns 검증 통과 여부
   */
  const validateField = (
    field: keyof T,
    value: any,
    rules: ValidationRule[]
  ): boolean => {
    // 모든 룰을 순서대로 실행
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        errors[field] = error as any
        return false
      }
    }

    // 모든 룰 통과
    errors[field] = '' as any
    return true
  }

  /**
   * 전체 필드 검증
   *
   * @param data - 검증할 데이터 객체
   * @param ruleMap - 필드별 룰 맵
   * @returns 전체 검증 통과 여부
   */
  const validateAll = (
    data: Record<string, any>,
    ruleMap: ValidationRules<T>
  ): boolean => {
    let isValid = true

    // 모든 필드에 대해 검증
    for (const [field, rules] of Object.entries(ruleMap)) {
      const fieldValue = data[field]
      if (!validateField(field as keyof T, fieldValue, rules)) {
        isValid = false
      }
    }

    return isValid
  }

  /**
   * 에러 메시지 초기화
   */
  const clearErrors = () => {
    Object.keys(errors).forEach(key => {
      errors[key] = '' as any
    })
  }

  /**
   * 단일 에러 메시지 설정
   */
  const setError = (field: keyof T, message: string) => {
    errors[field] = message as any
  }

  /**
   * 에러가 있는지 확인
   */
  const hasErrors = (): boolean => {
    return Object.values(errors).some(error => error !== '')
  }

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    setError,
    hasErrors,
    rules: validationRuleHelpers
  }
}

/**
 * 검증 룰 헬퍼 객체
 */
export interface ValidationRuleHelpers {
  /** 필수 입력 */
  required: (fieldName: string) => ValidationRule
  /** 최소 길이 */
  minLength: (min: number, fieldName?: string) => ValidationRule
  /** 최대 길이 */
  maxLength: (max: number, fieldName?: string) => ValidationRule
  /** 이메일 형식 */
  email: () => ValidationRule
  /** 전화번호 형식 */
  phone: () => ValidationRule
  /** 숫자만 */
  numeric: () => ValidationRule
  /** 최소값 */
  min: (minValue: number, fieldName?: string) => ValidationRule
  /** 최대값 */
  max: (maxValue: number, fieldName?: string) => ValidationRule
  /** 패턴 매칭 */
  pattern: (regex: RegExp, message?: string) => ValidationRule
  /** 사용자 정의 검증 */
  custom: (validator: (value: any) => boolean, message: string) => ValidationRule
}

/**
 * 검증 룰 헬퍼 구현
 */
export const validationRuleHelpers: ValidationRuleHelpers = {
  /**
   * 필수 입력 검증
   */
  required: (fieldName: string): ValidationRule => (value) => {
    // null, undefined, 빈 문자열 체크
    if (value === null || value === undefined) {
      return `${fieldName}을(를) 입력해주세요.`
    }

    if (typeof value === 'string' && !value.trim()) {
      return `${fieldName}을(를) 입력해주세요.`
    }

    if (Array.isArray(value) && value.length === 0) {
      return `${fieldName}을(를) 선택해주세요.`
    }

    return null
  },

  /**
   * 최소 길이 검증
   */
  minLength: (min: number, fieldName?: string): ValidationRule => (value) => {
    if (!value) return null // required와 함께 사용

    if (typeof value === 'string' && value.length < min) {
      return fieldName
        ? `${fieldName}은(는) 최소 ${min}자 이상 입력해주세요.`
        : `최소 ${min}자 이상 입력해주세요.`
    }

    if (Array.isArray(value) && value.length < min) {
      return fieldName
        ? `${fieldName}을(를) 최소 ${min}개 이상 선택해주세요.`
        : `최소 ${min}개 이상 선택해주세요.`
    }

    return null
  },

  /**
   * 최대 길이 검증
   */
  maxLength: (max: number, fieldName?: string): ValidationRule => (value) => {
    if (!value) return null

    if (typeof value === 'string' && value.length > max) {
      return fieldName
        ? `${fieldName}은(는) 최대 ${max}자까지 입력 가능합니다.`
        : `최대 ${max}자까지 입력 가능합니다.`
    }

    if (Array.isArray(value) && value.length > max) {
      return fieldName
        ? `${fieldName}을(를) 최대 ${max}개까지 선택 가능합니다.`
        : `최대 ${max}개까지 선택 가능합니다.`
    }

    return null
  },

  /**
   * 이메일 형식 검증
   */
  email: (): ValidationRule => (value) => {
    if (!value) return null

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return '올바른 이메일 형식을 입력해주세요. (예: example@company.com)'
    }

    return null
  },

  /**
   * 전화번호 형식 검증
   */
  phone: (): ValidationRule => (value) => {
    if (!value) return null

    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '')

    if (numbers.length < 10 || numbers.length > 11) {
      return '연락처는 10자리 또는 11자리 숫자로 입력해주세요.'
    }

    return null
  },

  /**
   * 숫자만 검증
   */
  numeric: (): ValidationRule => (value) => {
    if (!value) return null

    if (!/^[0-9]+$/.test(String(value))) {
      return '숫자만 입력 가능합니다.'
    }

    return null
  },

  /**
   * 최소값 검증
   */
  min: (minValue: number, fieldName?: string): ValidationRule => (value) => {
    if (value === null || value === undefined || value === '') return null

    const numValue = Number(value)
    if (isNaN(numValue)) return null

    if (numValue < minValue) {
      return fieldName
        ? `${fieldName}은(는) ${minValue} 이상이어야 합니다.`
        : `${minValue} 이상이어야 합니다.`
    }

    return null
  },

  /**
   * 최대값 검증
   */
  max: (maxValue: number, fieldName?: string): ValidationRule => (value) => {
    if (value === null || value === undefined || value === '') return null

    const numValue = Number(value)
    if (isNaN(numValue)) return null

    if (numValue > maxValue) {
      return fieldName
        ? `${fieldName}은(는) ${maxValue} 이하여야 합니다.`
        : `${maxValue} 이하여야 합니다.`
    }

    return null
  },

  /**
   * 패턴 매칭 검증
   */
  pattern: (regex: RegExp, message?: string): ValidationRule => (value) => {
    if (!value) return null

    if (!regex.test(value)) {
      return message || '올바른 형식으로 입력해주세요.'
    }

    return null
  },

  /**
   * 사용자 정의 검증
   */
  custom: (validator: (value: any) => boolean, message: string): ValidationRule => (value) => {
    if (!validator(value)) {
      return message
    }

    return null
  }
}

/**
 * 실시간 필드 검증 Composable
 *
 * 사용 예시:
 * ```typescript
 * const { validateOnInput, validateOnBlur } = useRealtimeValidation(
 *   formData,
 *   { errors, validateField, rules },
 *   {
 *     customerTel: [rules.phone()],
 *     customerEmail: [rules.email()]
 *   }
 * )
 *
 * <input @input="validateOnInput('customerTel')" @blur="validateOnBlur('customerTel')" />
 * ```
 */
export function useRealtimeValidation<T extends Record<string, any>>(
  formData: T,
  validation: Pick<UseFormValidationReturn<any>, 'errors' | 'validateField' | 'rules'>,
  ruleMap: ValidationRules<any>
) {
  /**
   * input 이벤트 시 검증 (타이핑 중)
   */
  const validateOnInput = (field: keyof T) => {
    // 에러가 있을 때만 실시간 검증 (타이핑 방해 방지)
    if (validation.errors[field]) {
      const rules = ruleMap[field as string]
      if (rules) {
        validation.validateField(field, formData[field], rules)
      }
    }
  }

  /**
   * blur 이벤트 시 검증 (포커스 이탈)
   */
  const validateOnBlur = (field: keyof T) => {
    const rules = ruleMap[field as string]
    if (rules) {
      validation.validateField(field, formData[field], rules)
    }
  }

  return {
    validateOnInput,
    validateOnBlur
  }
}
