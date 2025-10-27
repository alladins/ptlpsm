/**
 * Edit/Register 페이지 공통 기반 Composable
 *
 * 목적:
 * - 모든 폼 페이지의 기본 상태 관리
 * - 라우터 네비게이션 헬퍼
 * - 폼 초기화 로직
 *
 * 사용 예시:
 * ```typescript
 * const { formData, loading, submitting, goBack, reset } = useFormBase({
 *   initialData: { name: '', email: '' },
 *   isEditMode: true
 * })
 * ```
 */

import { reactive, ref } from 'vue'
import { useRouter } from '#imports'

export interface UseFormBaseOptions<T> {
  /** 폼 초기 데이터 */
  initialData: T
  /** Edit 모드 여부 (true면 loading 상태로 시작) */
  isEditMode?: boolean
  /** 취소 시 이동할 경로 (기본: 뒤로가기) */
  cancelRoute?: string
}

export interface UseFormBaseReturn<T> {
  /** 폼 데이터 (reactive) */
  formData: T
  /** 데이터 로딩 중 상태 */
  loading: Ref<boolean>
  /** 제출 중 상태 */
  submitting: Ref<boolean>
  /** 뒤로가기 또는 취소 */
  goBack: () => void
  /** 폼 데이터 초기화 */
  reset: () => void
  /** 폼 데이터가 변경되었는지 여부 */
  isDirty: ComputedRef<boolean>
}

/**
 * 폼 기본 상태 관리 Composable
 *
 * @template T - 폼 데이터 타입
 * @param options - 설정 옵션
 * @returns 폼 관리 객체
 */
export function useFormBase<T extends Record<string, any>>(
  options: UseFormBaseOptions<T>
): UseFormBaseReturn<T> {
  const router = useRouter()

  // 상태 관리
  const formData = reactive<T>({ ...options.initialData } as T)
  const loading = ref(options.isEditMode ?? false)
  const submitting = ref(false)

  // 초기 데이터 백업 (변경 감지용)
  const initialDataBackup = { ...options.initialData }

  /**
   * 뒤로가기 또는 지정된 경로로 이동
   */
  const goBack = () => {
    if (options.cancelRoute) {
      router.push(options.cancelRoute)
    } else {
      router.back()
    }
  }

  /**
   * 폼 데이터를 초기 상태로 리셋
   */
  const reset = () => {
    Object.assign(formData, options.initialData)
  }

  /**
   * 폼 데이터가 변경되었는지 확인
   */
  const isDirty = computed(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialDataBackup)
  })

  return {
    formData,
    loading,
    submitting,
    goBack,
    reset,
    isDirty
  }
}

/**
 * 폼 상태 변경 추적 헬퍼
 *
 * 사용 예시:
 * ```typescript
 * const { hasChanges, trackChange } = useFormChangeTracker()
 *
 * watchEffect(() => {
 *   trackChange('fieldName', formData.fieldName)
 * })
 * ```
 */
export function useFormChangeTracker() {
  const changes = reactive<Record<string, boolean>>({})

  const trackChange = (field: string, currentValue: any, originalValue: any) => {
    changes[field] = currentValue !== originalValue
  }

  const hasChanges = computed(() => {
    return Object.values(changes).some(changed => changed)
  })

  const getChangedFields = () => {
    return Object.keys(changes).filter(field => changes[field])
  }

  return {
    changes,
    hasChanges,
    trackChange,
    getChangedFields
  }
}

/**
 * 페이지 이탈 방지 헬퍼
 *
 * 폼이 변경된 상태에서 페이지를 벗어나려 할 때 경고 표시
 *
 * 사용 예시:
 * ```typescript
 * const { formData, isDirty } = useFormBase({ ... })
 * useFormLeaveGuard(isDirty, '작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?')
 * ```
 */
export function useFormLeaveGuard(
  isDirty: ComputedRef<boolean>,
  message: string = '변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?'
) {
  // 브라우저 종료/새로고침 방지
  onMounted(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.value) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  })

  // Vue Router 네비게이션 방지
  onBeforeRouteLeave((to, from) => {
    if (isDirty.value) {
      const answer = window.confirm(message)
      if (!answer) return false
    }
  })
}
