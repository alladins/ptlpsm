/**
 * Edit 페이지 전용 Composable
 *
 * 목적:
 * - Edit 페이지의 데이터 로딩 로직 통합
 * - Edit 페이지의 수정 로직 통합
 * - 모든 Edit 페이지에서 재사용 가능
 *
 * 사용 예시:
 * ```typescript
 * const { id, formData, loading, submitting, originalData, submit, goBack } = useEditForm({
 *   fetchFunction: salesService.getSalesById,
 *   updateFunction: salesService.updateSales,
 *   successRoute: '/admin/sales/list',
 *   transformToForm: (data) => ({
 *     customerNm: data.customerNm || '',
 *     salesTitle: data.salesTitle || ''
 *   })
 * })
 * ```
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useFormBase, type UseFormBaseOptions } from './useFormBase'

export interface UseEditFormOptions<TOriginal, TFormData, TUpdateRequest = TFormData> {
  /** 데이터 조회 함수 */
  fetchFunction: (id: number) => Promise<TOriginal>
  /** 데이터 수정 함수 */
  updateFunction: (id: number, data: TUpdateRequest) => Promise<void | TOriginal>
  /** 수정 성공 시 이동할 경로 */
  successRoute?: string
  /** 취소 시 이동할 경로 */
  cancelRoute?: string
  /** 조회한 데이터를 폼 데이터로 변환하는 함수 */
  transformToForm?: (original: TOriginal) => TFormData
  /** 폼 데이터를 수정 요청 데이터로 변환하는 함수 */
  transformToRequest?: (formData: TFormData) => TUpdateRequest
  /** 에러 핸들러 */
  onFetchError?: (error: any) => void
  /** 수정 성공 핸들러 */
  onUpdateSuccess?: (result?: void | TOriginal) => void
  /** 수정 실패 핸들러 */
  onUpdateError?: (error: any) => void
}

export interface UseEditFormReturn<TOriginal, TFormData> {
  /** 현재 수정 중인 항목의 ID */
  id: ComputedRef<number>
  /** 폼 데이터 (reactive) */
  formData: TFormData
  /** 데이터 로딩 중 상태 */
  loading: Ref<boolean>
  /** 제출 중 상태 */
  submitting: Ref<boolean>
  /** 원본 데이터 (조회한 원본 유지) */
  originalData: Ref<TOriginal | null>
  /** 폼 제출 함수 */
  submit: () => Promise<void>
  /** 뒤로가기 */
  goBack: () => void
  /** 데이터 다시 로드 */
  reload: () => Promise<void>
  /** 폼 데이터가 변경되었는지 여부 */
  isDirty: ComputedRef<boolean>
}

/**
 * Edit 페이지용 통합 Composable
 *
 * @template TOriginal - API에서 조회한 원본 데이터 타입
 * @template TFormData - 폼에서 사용할 데이터 타입
 * @template TUpdateRequest - API 수정 요청 데이터 타입 (기본값: TFormData)
 * @param options - 설정 옵션
 * @returns Edit 페이지 관리 객체
 */
export function useEditForm<TOriginal, TFormData extends Record<string, any>, TUpdateRequest = TFormData>(
  options: UseEditFormOptions<TOriginal, TFormData, TUpdateRequest>
): UseEditFormReturn<TOriginal, TFormData> {
  const route = useRoute()
  const router = useRouter()

  // 기본 폼 상태 (isEditMode: true)
  const { formData, loading, submitting, goBack: baseGoBack, isDirty } = useFormBase<TFormData>({
    initialData: {} as TFormData,
    isEditMode: true,
    cancelRoute: options.cancelRoute
  })

  // 원본 데이터 저장
  const originalData = ref<TOriginal | null>(null)

  /**
   * ID 추출 (route.params.id)
   */
  const id = computed(() => {
    const paramId = route.params.id
    if (typeof paramId === 'string') {
      return parseInt(paramId, 10)
    } else if (Array.isArray(paramId)) {
      return parseInt(paramId[0], 10)
    }
    return 0
  })

  /**
   * 데이터 로드 함수
   */
  const loadData = async () => {
    if (!id.value || id.value === 0) {
      console.error('[useEditForm] Invalid ID:', id.value)
      alert('잘못된 ID입니다.')
      baseGoBack()
      return
    }

    try {
      loading.value = true

      // API 호출
      const data = await options.fetchFunction(id.value)
      originalData.value = data

      // 폼 데이터로 변환
      const transformedData = options.transformToForm
        ? options.transformToForm(data)
        : data as unknown as TFormData

      // formData 업데이트
      Object.assign(formData, transformedData)

      console.log('[useEditForm] Data loaded successfully:', {
        id: id.value,
        originalData: data,
        formData: transformedData
      })
    } catch (error) {
      console.error('[useEditForm] Load error:', error)

      // 사용자 정의 에러 핸들러
      if (options.onFetchError) {
        options.onFetchError(error)
      } else {
        alert('데이터를 불러오는데 실패했습니다.')
        baseGoBack()
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 데이터 수정 함수
   */
  const submit = async () => {
    if (!id.value || id.value === 0) {
      console.error('[useEditForm] Cannot submit: Invalid ID')
      return
    }

    try {
      submitting.value = true

      // 수정 요청 데이터 준비
      const requestData = options.transformToRequest
        ? options.transformToRequest(formData)
        : formData as unknown as TUpdateRequest

      console.log('[useEditForm] Submitting update:', {
        id: id.value,
        requestData
      })

      // API 호출
      const result = await options.updateFunction(id.value, requestData)

      console.log('[useEditForm] Update successful')

      // 성공 핸들러
      if (options.onUpdateSuccess) {
        options.onUpdateSuccess(result)
      } else {
        alert('수정되었습니다.')
        router.push(options.successRoute || '../list')
      }
    } catch (error) {
      console.error('[useEditForm] Update error:', error)

      // 실패 핸들러
      if (options.onUpdateError) {
        options.onUpdateError(error)
      } else {
        alert('수정에 실패했습니다.')
      }
    } finally {
      submitting.value = false
    }
  }

  /**
   * 데이터 다시 로드
   */
  const reload = async () => {
    await loadData()
  }

  /**
   * 뒤로가기 (래핑)
   */
  const goBack = () => {
    // 변경사항이 있을 경우 확인
    if (isDirty.value) {
      const confirmed = confirm('변경사항이 저장되지 않았습니다. 페이지를 벗어나시겠습니까?')
      if (!confirmed) return
    }

    baseGoBack()
  }

  // 컴포넌트 마운트 시 데이터 로드
  onMounted(() => {
    loadData()
  })

  return {
    id,
    formData,
    loading,
    submitting,
    originalData,
    submit,
    goBack,
    reload,
    isDirty
  }
}

/**
 * 다중 항목 Edit용 Composable (예: 품목 관리)
 *
 * 사용 예시:
 * ```typescript
 * const { items, loadItems, updateItem, deleteItem } = useEditFormItems({
 *   parentId: salesId,
 *   fetchFunction: salesService.getSalesItems,
 *   updateFunction: salesService.updateSalesItem,
 *   deleteFunction: salesService.deleteSalesItem
 * })
 * ```
 */
export interface UseEditFormItemsOptions<TItem> {
  /** 부모 ID (예: salesId) */
  parentId: ComputedRef<number> | Ref<number> | number
  /** 항목 목록 조회 함수 */
  fetchFunction: (parentId: number) => Promise<TItem[]>
  /** 항목 수정 함수 (선택) */
  updateFunction?: (parentId: number, itemId: number | string, data: TItem) => Promise<void>
  /** 항목 삭제 함수 (선택) */
  deleteFunction?: (parentId: number, itemId: number | string) => Promise<void>
}

export function useEditFormItems<TItem extends { id?: number | string }>(
  options: UseEditFormItemsOptions<TItem>
) {
  const items = ref<TItem[]>([])
  const loading = ref(false)

  const parentId = computed(() => {
    if (typeof options.parentId === 'number') {
      return options.parentId
    }
    return options.parentId.value
  })

  const loadItems = async () => {
    if (!parentId.value) return

    try {
      loading.value = true
      items.value = await options.fetchFunction(parentId.value)
    } catch (error) {
      console.error('[useEditFormItems] Load error:', error)
      items.value = []
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (itemId: number | string, data: TItem) => {
    if (!options.updateFunction) {
      console.warn('[useEditFormItems] No update function provided')
      return
    }

    try {
      await options.updateFunction(parentId.value, itemId, data)
    } catch (error) {
      console.error('[useEditFormItems] Update error:', error)
      throw error
    }
  }

  const deleteItem = async (itemId: number | string) => {
    if (!options.deleteFunction) {
      console.warn('[useEditFormItems] No delete function provided')
      return
    }

    try {
      await options.deleteFunction(parentId.value, itemId)
      // 로컬에서도 제거
      items.value = items.value.filter(item => item.id !== itemId)
    } catch (error) {
      console.error('[useEditFormItems] Delete error:', error)
      throw error
    }
  }

  return {
    items,
    loading,
    loadItems,
    updateItem,
    deleteItem
  }
}
