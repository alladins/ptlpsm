/**
 * 모달 관리 Composable
 * 모달 열기/닫기, 데이터 관리 등 모달 공통 로직
 */

import { ref, computed, type Ref } from 'vue'
import type { ModalMode } from '~/types/common'

export interface UseModalOptions<T = any> {
  /** 초기 열림 상태 */
  initialOpen?: boolean
  /** 닫을 때 콜백 */
  onClose?: (data?: T) => void
  /** 열 때 콜백 */
  onOpen?: (data?: T) => void
  /** 확인 시 콜백 */
  onConfirm?: (data?: T) => void | Promise<void>
}

export function useModal<T = any>(options: UseModalOptions<T> = {}) {
  const { initialOpen = false, onClose, onOpen, onConfirm } = options

  // 상태
  const isOpen = ref(initialOpen)
  const data = ref<T | null>(null) as Ref<T | null>
  const mode = ref<ModalMode>('create')
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 모달이 생성 모드인지
   */
  const isCreateMode = computed(() => mode.value === 'create')

  /**
   * 모달이 수정 모드인지
   */
  const isEditMode = computed(() => mode.value === 'edit')

  /**
   * 모달이 보기 모드인지
   */
  const isViewMode = computed(() => mode.value === 'view')

  /**
   * 모달이 삭제 모드인지
   */
  const isDeleteMode = computed(() => mode.value === 'delete')

  /**
   * 모달 열기
   */
  function open(modalData?: T, modalMode: ModalMode = 'create') {
    isOpen.value = true
    data.value = modalData || null
    mode.value = modalMode
    error.value = null
    onOpen?.(modalData)
  }

  /**
   * 생성 모드로 모달 열기
   */
  function openCreate(modalData?: T) {
    open(modalData, 'create')
  }

  /**
   * 수정 모드로 모달 열기
   */
  function openEdit(modalData: T) {
    open(modalData, 'edit')
  }

  /**
   * 보기 모드로 모달 열기
   */
  function openView(modalData: T) {
    open(modalData, 'view')
  }

  /**
   * 삭제 모드로 모달 열기
   */
  function openDelete(modalData: T) {
    open(modalData, 'delete')
  }

  /**
   * 모달 닫기
   */
  function close() {
    isOpen.value = false
    const currentData = data.value
    data.value = null
    error.value = null
    onClose?.(currentData || undefined)
  }

  /**
   * 확인 (제출)
   */
  async function confirm(confirmData?: T) {
    if (!onConfirm) {
      close()
      return
    }

    loading.value = true
    error.value = null

    try {
      await onConfirm(confirmData || data.value || undefined)
      close()
    } catch (err: any) {
      error.value = err.message || '처리 중 오류가 발생했습니다.'
      console.error('모달 확인 오류:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 모달 토글
   */
  function toggle() {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  /**
   * 데이터 설정
   */
  function setData(newData: T | null) {
    data.value = newData
  }

  /**
   * 모드 설정
   */
  function setMode(newMode: ModalMode) {
    mode.value = newMode
  }

  /**
   * 에러 설정
   */
  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  /**
   * 에러 초기화
   */
  function clearError() {
    error.value = null
  }

  return {
    // 상태
    isOpen,
    data,
    mode,
    loading,
    error,

    // Computed
    isCreateMode,
    isEditMode,
    isViewMode,
    isDeleteMode,

    // 메서드
    open,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
    confirm,
    toggle,
    setData,
    setMode,
    setError,
    clearError
  }
}

/**
 * 확인 다이얼로그 Composable
 * 단순 확인/취소 다이얼로그용
 */
export interface UseConfirmDialogOptions {
  /** 제목 */
  title?: string
  /** 메시지 */
  message?: string
  /** 확인 버튼 텍스트 */
  confirmText?: string
  /** 취소 버튼 텍스트 */
  cancelText?: string
  /** 위험 모드 (빨간 버튼) */
  danger?: boolean
}

export function useConfirmDialog() {
  const isOpen = ref(false)
  const options = ref<UseConfirmDialogOptions>({
    title: '확인',
    message: '계속하시겠습니까?',
    confirmText: '확인',
    cancelText: '취소',
    danger: false
  })
  const resolvePromise = ref<((value: boolean) => void) | null>(null)

  /**
   * 확인 다이얼로그 표시
   */
  function confirm(dialogOptions?: UseConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      options.value = {
        title: dialogOptions?.title || '확인',
        message: dialogOptions?.message || '계속하시겠습니까?',
        confirmText: dialogOptions?.confirmText || '확인',
        cancelText: dialogOptions?.cancelText || '취소',
        danger: dialogOptions?.danger || false
      }
      isOpen.value = true
      resolvePromise.value = resolve
    })
  }

  /**
   * 삭제 확인 다이얼로그 (위험 모드)
   */
  function confirmDelete(message?: string): Promise<boolean> {
    return confirm({
      title: '삭제 확인',
      message: message || '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      danger: true
    })
  }

  /**
   * 확인 처리
   */
  function handleConfirm() {
    if (resolvePromise.value) {
      resolvePromise.value(true)
      resolvePromise.value = null
    }
    isOpen.value = false
  }

  /**
   * 취소 처리
   */
  function handleCancel() {
    if (resolvePromise.value) {
      resolvePromise.value(false)
      resolvePromise.value = null
    }
    isOpen.value = false
  }

  return {
    // 상태
    isOpen,
    options,

    // 메서드
    confirm,
    confirmDelete,
    handleConfirm,
    handleCancel
  }
}
