/**
 * 폼 관리 Composable
 * 폼 상태, 유효성 검증, 제출 등 폼 공통 로직
 */

import { ref, reactive, computed, watch, type Ref } from 'vue'
import type { FormState, FormErrors, ValidationRule } from '~/types/common'

export interface UseFormOptions<T> {
  /** 초기 폼 데이터 */
  initialValues: T
  /** 유효성 검증 규칙 */
  validationRules?: Partial<Record<keyof T, ValidationRule>>
  /** 제출 함수 */
  onSubmit?: (values: T) => Promise<void> | void
  /** 제출 성공 콜백 */
  onSuccess?: (values: T) => void
  /** 제출 실패 콜백 */
  onError?: (error: any) => void
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, validationRules = {}, onSubmit, onSuccess, onError } = options

  // 상태
  const formData = reactive<T>({ ...initialValues })
  const errors = reactive<FormErrors<T>>({})
  const touched = reactive<Partial<Record<keyof T, boolean>>>({})
  const submitting = ref(false)
  const submitError = ref<string | null>(null)
  const dirty = ref(false)

  /**
   * 폼이 유효한지 여부
   */
  const isValid = computed(() => {
    return Object.keys(errors).length === 0
  })

  /**
   * 제출 가능 여부
   */
  const canSubmit = computed(() => {
    return isValid.value && !submitting.value && dirty.value
  })

  /**
   * 특정 필드 유효성 검증
   */
  function validateField(field: keyof T): string | null {
    const value = formData[field]
    const rules = validationRules[field]

    if (!rules) return null

    // 필수 검증
    if (rules.required) {
      if (value === null || value === undefined || value === '') {
        const message = rules.message || `${String(field)}을(를) 입력해주세요.`
        errors[field] = message
        return message
      }
    }

    // 값이 없으면 다른 검증 스킵
    if (!value && !rules.required) {
      delete errors[field]
      return null
    }

    // 최소 길이 검증
    if (rules.minLength && typeof value === 'string') {
      if (value.length < rules.minLength) {
        const message = rules.message || `최소 ${rules.minLength}자 이상 입력해주세요.`
        errors[field] = message
        return message
      }
    }

    // 최대 길이 검증
    if (rules.maxLength && typeof value === 'string') {
      if (value.length > rules.maxLength) {
        const message = rules.message || `최대 ${rules.maxLength}자까지 입력 가능합니다.`
        errors[field] = message
        return message
      }
    }

    // 최솟값 검증
    if (rules.min !== undefined && typeof value === 'number') {
      if (value < rules.min) {
        const message = rules.message || `최솟값은 ${rules.min}입니다.`
        errors[field] = message
        return message
      }
    }

    // 최댓값 검증
    if (rules.max !== undefined && typeof value === 'number') {
      if (value > rules.max) {
        const message = rules.message || `최댓값은 ${rules.max}입니다.`
        errors[field] = message
        return message
      }
    }

    // 패턴 검증
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        const message = rules.message || '올바른 형식이 아닙니다.'
        errors[field] = message
        return message
      }
    }

    // 커스텀 검증
    if (rules.validator) {
      const result = rules.validator(value)
      if (typeof result === 'string') {
        errors[field] = result
        return result
      } else if (result === false) {
        const message = rules.message || '유효하지 않은 값입니다.'
        errors[field] = message
        return message
      }
    }

    // 모든 검증 통과
    delete errors[field]
    return null
  }

  /**
   * 전체 폼 유효성 검증
   */
  function validateForm(): boolean {
    // 모든 필드 검증
    for (const field in validationRules) {
      validateField(field as keyof T)
    }

    return isValid.value
  }

  /**
   * 필드 값 설정
   */
  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    formData[field] = value
    dirty.value = true

    // 해당 필드가 touched 상태면 즉시 검증
    if (touched[field]) {
      validateField(field)
    }
  }

  /**
   * 필드 터치 상태 설정
   */
  function setFieldTouched(field: keyof T, isTouched: boolean = true) {
    touched[field] = isTouched

    // 터치되면 즉시 검증
    if (isTouched) {
      validateField(field)
    }
  }

  /**
   * 필드 에러 설정
   */
  function setFieldError(field: keyof T, error: string | null) {
    if (error) {
      errors[field] = error
    } else {
      delete errors[field]
    }
  }

  /**
   * 에러 초기화
   */
  function clearErrors() {
    Object.keys(errors).forEach(key => {
      delete errors[key as keyof T]
    })
  }

  /**
   * 폼 초기화
   */
  function resetForm() {
    Object.assign(formData, { ...initialValues })
    clearErrors()
    Object.keys(touched).forEach(key => {
      delete touched[key as keyof T]
    })
    dirty.value = false
    submitError.value = null
  }

  /**
   * 특정 값들로 폼 설정
   */
  function setValues(values: Partial<T>) {
    Object.assign(formData, values)
    dirty.value = true
  }

  /**
   * 폼 제출
   */
  async function handleSubmit(event?: Event) {
    if (event) {
      event.preventDefault()
    }

    // 모든 필드를 touched로 표시
    Object.keys(validationRules).forEach(field => {
      touched[field as keyof T] = true
    })

    // 유효성 검증
    if (!validateForm()) {
      return
    }

    if (!onSubmit) {
      console.warn('onSubmit 함수가 정의되지 않았습니다.')
      return
    }

    submitting.value = true
    submitError.value = null

    try {
      await onSubmit(formData)
      onSuccess?.(formData)
    } catch (error: any) {
      submitError.value = error.message || '제출 중 오류가 발생했습니다.'
      onError?.(error)
      console.error('폼 제출 오류:', error)
    } finally {
      submitting.value = false
    }
  }

  /**
   * 필드 blur 핸들러
   */
  function handleBlur(field: keyof T) {
    setFieldTouched(field, true)
  }

  /**
   * 필드 change 핸들러
   */
  function handleChange(field: keyof T, value: any) {
    setFieldValue(field, value)
  }

  /**
   * 특정 필드의 에러 메시지 가져오기
   */
  function getFieldError(field: keyof T): string | undefined {
    return errors[field]
  }

  /**
   * 특정 필드가 에러 상태인지 확인
   */
  function hasFieldError(field: keyof T): boolean {
    return !!errors[field] && !!touched[field]
  }

  // 폼 데이터 변경 감지
  watch(
    () => formData,
    () => {
      dirty.value = true
    },
    { deep: true }
  )

  return {
    // 상태
    formData,
    errors,
    touched,
    submitting,
    submitError,
    dirty,

    // Computed
    isValid,
    canSubmit,

    // 메서드
    validateField,
    validateForm,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearErrors,
    resetForm,
    setValues,
    handleSubmit,
    handleBlur,
    handleChange,
    getFieldError,
    hasFieldError
  }
}
