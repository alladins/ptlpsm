/**
 * Register 페이지 전용 Composable
 *
 * 목적:
 * - Register 페이지의 등록 로직 통합
 * - 모든 Register 페이지에서 재사용 가능
 *
 * 사용 예시:
 * ```typescript
 * const { formData, submitting, submit, goBack, reset } = useRegisterForm({
 *   createFunction: salesService.createSales,
 *   successRoute: '/admin/sales/list',
 *   defaultValues: {
 *     salesStatus: '진행중',
 *     useYn: 'Y'
 *   }
 * })
 * ```
 */

import { useRouter } from '#imports'
import { useFormBase, type UseFormBaseOptions } from './useFormBase'

export interface UseRegisterFormOptions<TFormData, TCreateRequest = TFormData, TResponse = any> {
  /** 데이터 생성 함수 */
  createFunction: (data: TCreateRequest) => Promise<TResponse>
  /** 등록 성공 시 이동할 경로 */
  successRoute?: string
  /** 취소 시 이동할 경로 */
  cancelRoute?: string
  /** 기본값 (초기 formData 값) */
  defaultValues?: Partial<TFormData>
  /** 폼 데이터를 생성 요청 데이터로 변환하는 함수 */
  transformToRequest?: (formData: TFormData) => TCreateRequest
  /** 등록 성공 핸들러 */
  onCreateSuccess?: (response: TResponse) => void
  /** 등록 실패 핸들러 */
  onCreateError?: (error: any) => void
}

export interface UseRegisterFormReturn<TFormData, TResponse> {
  /** 폼 데이터 (reactive) */
  formData: TFormData
  /** 데이터 로딩 중 상태 (Register는 항상 false) */
  loading: Ref<boolean>
  /** 제출 중 상태 */
  submitting: Ref<boolean>
  /** 폼 제출 함수 */
  submit: () => Promise<TResponse | void>
  /** 뒤로가기 */
  goBack: () => void
  /** 폼 초기화 */
  reset: () => void
  /** 폼 데이터가 변경되었는지 여부 */
  isDirty: ComputedRef<boolean>
}

/**
 * Register 페이지용 통합 Composable
 *
 * @template TFormData - 폼에서 사용할 데이터 타입
 * @template TCreateRequest - API 생성 요청 데이터 타입 (기본값: TFormData)
 * @template TResponse - API 응답 데이터 타입
 * @param options - 설정 옵션
 * @returns Register 페이지 관리 객체
 */
export function useRegisterForm<TFormData extends Record<string, any>, TCreateRequest = TFormData, TResponse = any>(
  options: UseRegisterFormOptions<TFormData, TCreateRequest, TResponse>
): UseRegisterFormReturn<TFormData, TResponse> {
  const router = useRouter()

  // 기본 폼 상태 (isEditMode: false)
  const { formData, loading, submitting, goBack: baseGoBack, reset: baseReset, isDirty } = useFormBase<TFormData>({
    initialData: { ...options.defaultValues } as TFormData,
    isEditMode: false,
    cancelRoute: options.cancelRoute
  })

  /**
   * 데이터 등록 함수
   */
  const submit = async (): Promise<TResponse | void> => {
    try {
      submitting.value = true

      // 생성 요청 데이터 준비
      const requestData = options.transformToRequest
        ? options.transformToRequest(formData)
        : formData as unknown as TCreateRequest

      console.log('[useRegisterForm] Submitting create:', {
        requestData
      })

      // API 호출
      const result = await options.createFunction(requestData)

      console.log('[useRegisterForm] Create successful:', result)

      // 성공 핸들러 실행
      if (options.onCreateSuccess) {
        options.onCreateSuccess(result)
      }

      // successRoute가 지정되어 있으면 페이지 이동
      if (options.successRoute) {
        router.push(options.successRoute)
      }

      return result
    } catch (error) {
      console.error('[useRegisterForm] Create error:', error)

      // 실패 핸들러
      if (options.onCreateError) {
        options.onCreateError(error)
      } else {
        alert('등록에 실패했습니다.')
      }

      throw error
    } finally {
      submitting.value = false
    }
  }

  /**
   * 뒤로가기 (래핑)
   */
  const goBack = () => {
    // 변경사항이 있을 경우 확인
    if (isDirty.value) {
      const confirmed = confirm('작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?')
      if (!confirmed) return
    }

    baseGoBack()
  }

  /**
   * 폼 초기화 (래핑)
   */
  const reset = () => {
    const confirmed = confirm('작성 중인 내용을 모두 초기화하시겠습니까?')
    if (confirmed) {
      baseReset()
    }
  }

  return {
    formData,
    loading,
    submitting,
    submit,
    goBack,
    reset,
    isDirty
  }
}

/**
 * 다단계 등록용 Composable (예: 품목 추가 → 저장)
 *
 * 사용 예시:
 * ```typescript
 * const { step, totalSteps, goNextStep, goPrevStep, canGoNext } = useRegisterWizard({
 *   steps: ['basic', 'items', 'confirm'],
 *   validateStep: (stepIndex) => {
 *     if (stepIndex === 0) return validateBasicInfo()
 *     return true
 *   }
 * })
 * ```
 */
export interface UseRegisterWizardOptions {
  /** 단계 이름 목록 */
  steps: string[]
  /** 각 단계 검증 함수 */
  validateStep?: (stepIndex: number) => boolean | Promise<boolean>
  /** 단계 변경 시 콜백 */
  onStepChange?: (step: number, stepName: string) => void
}

export function useRegisterWizard(options: UseRegisterWizardOptions) {
  const currentStep = ref(0)

  const totalSteps = computed(() => options.steps.length)
  const currentStepName = computed(() => options.steps[currentStep.value])
  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)
  const canGoNext = computed(() => !isLastStep.value)
  const canGoPrev = computed(() => !isFirstStep.value)

  const goNextStep = async () => {
    if (isLastStep.value) return false

    // 현재 단계 검증
    if (options.validateStep) {
      const isValid = await options.validateStep(currentStep.value)
      if (!isValid) {
        return false
      }
    }

    currentStep.value++

    if (options.onStepChange) {
      options.onStepChange(currentStep.value, currentStepName.value)
    }

    return true
  }

  const goPrevStep = () => {
    if (isFirstStep.value) return false

    currentStep.value--

    if (options.onStepChange) {
      options.onStepChange(currentStep.value, currentStepName.value)
    }

    return true
  }

  const goToStep = async (step: number) => {
    if (step < 0 || step >= totalSteps.value) return false
    if (step === currentStep.value) return true

    // 앞으로 가는 경우만 검증
    if (step > currentStep.value) {
      for (let i = currentStep.value; i < step; i++) {
        if (options.validateStep) {
          const isValid = await options.validateStep(i)
          if (!isValid) {
            return false
          }
        }
      }
    }

    currentStep.value = step

    if (options.onStepChange) {
      options.onStepChange(currentStep.value, currentStepName.value)
    }

    return true
  }

  const reset = () => {
    currentStep.value = 0

    if (options.onStepChange) {
      options.onStepChange(currentStep.value, currentStepName.value)
    }
  }

  return {
    currentStep,
    totalSteps,
    currentStepName,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    goNextStep,
    goPrevStep,
    goToStep,
    reset
  }
}
