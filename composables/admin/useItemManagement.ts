/**
 * 품목 관리 Composable (확장 버전)
 *
 * 목적:
 * - 영업/발주/출하/운송 등 모든 도메인의 품목 관리 로직 통합
 * - handleSkuSelected 로직 완전 통합 (4개 페이지 × 50줄 = 200줄 중복 제거)
 * - 품목 추가/삭제/계산 로직 통합
 *
 * 사용 예시:
 * ```typescript
 * const { items, selectedItemsCount, totalItemsAmount, addItem, removeItem, openItemSelector, handleSkuSelected } =
 *   useItemManagement({ parentId: salesId })
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { SalesItemRequest } from '~/types/sales'
import type { Item, ItemSku } from '~/services/item.service'

/**
 * 품목 관리 옵션
 */
export interface UseItemManagementOptions {
  /** 부모 ID (salesId, orderId 등) */
  parentId?: number | null | ComputedRef<number>
  /** 기본 품목 데이터 (초기값) */
  defaultItemData?: Partial<any>
  /** SKU 선택 시 자동 계산 여부 (기본: true) */
  autoCalculate?: boolean
  /** 중복 체크 시 사용할 필드 (기본: 'skuId') */
  duplicateCheckField?: string
}

/**
 * 품목 관리 Composable
 *
 * @param options - 설정 옵션
 * @returns 품목 관리 객체
 */
export function useItemManagement(options: UseItemManagementOptions = {}) {
  const { parentId, defaultItemData, autoCalculate = true, duplicateCheckField = 'skuId' } = options
  // 품목 목록
  const items = ref<Array<SalesItemRequest & { amount: number }>>([])

  // 품목 선택기 상태
  const showItemSelector = ref(false)
  const currentItemIndex = ref<number>(-1)

  // 품목 수 계산
  const selectedItemsCount = computed(() => {
    return items.value.filter(item => item.itemName && item.itemName.trim() !== '').length
  })

  // 총 금액 계산
  const totalItemsAmount = computed(() => {
    return items.value.reduce((total, item) => total + (item.amount || 0), 0)
  })

  /**
   * 품목 추가
   */
  const addItem = () => {
    items.value.push({
      skuId: 0,
      itemId: 0,
      itemName: '',
      // salesId: salesId || undefined,
      skuName: '',
      itemSpecification: '',
      unit: '',
      unitPrice: 0,
      quantity: 0,
      amount: 0,
      sortOrder: items.value.length + 1
    })
  }

  /**
   * 품목 추가 후 선택기 자동 열기
   */
  const addItemWithSelector = () => {
    // 1. 빈 라인을 추가하지 않고, 인덱스만 -1로 설정 (새 라인 추가 모드)
    currentItemIndex.value = -1

    // 2. 선택기 즉시 열기
    showItemSelector.value = true
  }

  /**
   * 품목 삭제
   */
  const removeItem = (index: number) => {
    items.value.splice(index, 1)
  }

  /**
   * 품목 선택기 열기
   */
  const openItemSelector = (index: number) => {
    currentItemIndex.value = index
    showItemSelector.value = true
  }

  /**
   * SKU 선택 처리 (확장 버전 - 모든 도메인 지원)
   */
  const handleSkuSelected = (item: Item, sku: ItemSku) => {
    // currentItemIndex가 -1이면 새 라인 추가 (addItemWithSelector에서 호출된 경우)
    if (currentItemIndex.value === -1) {
      const newIndex = items.value.length
      items.value.push({
        skuId: 0,
        itemId: 0,
        itemName: '',
        skuName: '',
        itemSpecification: '',
        unit: '',
        unitPrice: 0,
        quantity: 0,
        amount: 0,
        sortOrder: newIndex + 1
      })
      currentItemIndex.value = newIndex
    }

    if (currentItemIndex.value < 0 || currentItemIndex.value >= items.value.length) {
      console.warn('[useItemManagement] Invalid item index:', currentItemIndex.value)
      return false
    }

    const currentItem = items.value[currentItemIndex.value]

    // 중복 체크 (설정 가능한 필드로)
    const duplicateValue = sku.id
    const isDuplicate = items.value.some((existingItem, index) =>
      index !== currentItemIndex.value &&
      existingItem[duplicateCheckField] === duplicateValue
    )

    if (isDuplicate) {
      alert('이미 선택된 SKU입니다.')
      return false
    }

    // 규격 정보 설정 (너비*높이*두께)
    const width = sku.width || item.width
    const height = sku.height || item.height
    const thickness = sku.thickness || item.thickness
    const specification = buildSpecification(width, height, thickness)

    // parentId 값 추출
    const resolvedParentId = typeof parentId === 'object' && parentId !== null
      ? (parentId as ComputedRef<number>).value
      : parentId

    // 필수 필드 설정
    currentItem.skuId = sku.id ?? 0
    currentItem.itemId = item.id ?? 0
    currentItem.itemName = item.itemNm ?? ''
    currentItem.skuName = sku.skuNm ?? ''
    // currentItem.salesId = resolvedParentId || undefined
    currentItem.itemSpecification = specification
    currentItem.unit = item.unitCd || '개'
    currentItem.unitPrice = sku.unitPrice || item.unitPrice || 0
    currentItem.quantity = 1
    currentItem.sortOrder = currentItemIndex.value + 1

    // 자동 계산
    if (autoCalculate) {
      currentItem.amount = currentItem.unitPrice * currentItem.quantity
    }

    return true
  }

  /**
   * 규격 문자열 생성 헬퍼
   */
  const buildSpecification = (width?: number, height?: number, thickness?: number): string => {
    if (width && height && thickness) {
      return `${width}*${height}*${thickness}`
    } else if (width && height) {
      return `${width}*${height}`
    } else if (width) {
      return `${width}`
    }
    return ''
  }

  /**
   * 품목 금액 계산
   */
  const calculateItemAmount = (index: number) => {
    const item = items.value[index]
    if (!item) return

    // 금액 계산
    item.amount = (item.unitPrice || 0) * (item.quantity || 0)
  }

  /**
   * 품목 데이터 설정 (로드 시 사용)
   */
  const setItems = (itemsData: any[]) => {
    items.value = itemsData.map((item: any) => ({
      skuId: item.skuId,
      itemId: item.itemId,
      itemName: item.itemName,
      skuName: item.skuName,
      itemSpecification: item.itemSpecification || '',
      unit: item.unit || '',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      amount: item.amount,
      sortOrder: item.sortOrder || items.value.length + 1
    }))
  }

  /**
   * 품목 유효성 검증
   */
  const validateItems = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (items.value.length === 0) {
      errors.push('최소 1개 이상의 품목을 추가해주세요.')
      return { valid: false, errors }
    }

    items.value.forEach((item, index) => {
      if (!item.itemName || !item.itemName.trim()) {
        errors.push(`품목 ${index + 1}: 품목을 선택해주세요.`)
      }

      if (!item.quantity || item.quantity <= 0) {
        errors.push(`품목 ${index + 1}: 수량을 입력해주세요.`)
      }

      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`품목 ${index + 1}: 단가를 입력해주세요.`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 모든 품목 금액 재계산
   */
  const recalculateAllAmounts = () => {
    items.value.forEach((_, index) => {
      calculateItemAmount(index)
    })
  }

  /**
   * 품목 초기화
   */
  const clearItems = () => {
    items.value = []
  }

  /**
   * 특정 조건의 품목 필터링
   */
  const filterItems = (predicate: (item: any) => boolean) => {
    return items.value.filter(predicate)
  }

  /**
   * 품목 존재 여부 확인
   */
  const hasItems = computed(() => items.value.length > 0)

  /**
   * 유효한 품목 수 (이름이 있는 품목)
   */
  const validItemsCount = computed(() => {
    return items.value.filter(item => item.itemName && item.itemName.trim()).length
  })

  return {
    // State
    items,
    showItemSelector,
    currentItemIndex,

    // Computed
    selectedItemsCount,
    totalItemsAmount,
    hasItems,
    validItemsCount,

    // Methods
    addItem,
    addItemWithSelector,
    removeItem,
    openItemSelector,
    handleSkuSelected,
    calculateItemAmount,
    setItems,
    validateItems,
    recalculateAllAmounts,
    clearItems,
    filterItems
  }
}

/**
 * 품목 관리 (간소화 버전 - 이전 버전 호환)
 *
 * @deprecated 이전 버전 호환용. 새 코드는 useItemManagement({ parentId }) 형식 사용
 */
// export function useItemManagementLegacy(salesId?: number | null) {
//   return useItemManagement({ parentId: salesId })
// }
