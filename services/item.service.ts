import { getApiBaseUrl } from './api'
import { ITEM_ENDPOINTS } from './api/endpoints/item.endpoints'

// MIGRATED: 2025-01-25 - URL을 ITEM_ENDPOINTS로 이전

// 품목 정보
export interface Item {
  itemId: string           // 문자열로 변경
  itemClassificationNumber: string  // ← 추가
  itemNm: string
  itemTypeCd: string      // 필수로 변경
  unitCd: string         // 필수로 변경
  width?: number
  height?: number
  thickness?: number
  unitPrice?: number
  description?: string
  useYn: string
  itemSpecs: ItemSpec[]
  itemSkus: ItemSku[]
  createdAt: string
  updatedAt: string
}

// 품목 스펙
export interface ItemSpec {
  id: number           // 스펙 ID
  specName: string     // 스펙명 (필수)
  specValue: string    // 스펙값 (선택)
  specUnit?: string    // 단위 (선택)
  sortOrder?: number   // 정렬순서 (기본값: 0)
  createdAt?: string   // 생성일시
  createdBy?: string   // 생성자
  updatedAt?: string   // 수정일시
  updatedBy?: string   // 수정자
}

// 품목 SKU
export interface ItemSku {
  skuId: string           // 문자열로 변경
  skuNm: string
  width?: number
  height?: number
  thickness?: number
  unitPrice?: number
  stockQty?: number
  useYn: string
  createdAt?: string
  updatedAt?: string
}

// 품목 등록 요청
export interface ItemCreateRequest {
  itemId: string          // 문자열로 변경
  itemNm: string
  itemTypeCd: string     // 필수로 변경
  unitCd: string        // 필수로 변경
  width?: number
  height?: number
  thickness?: number
  unitPrice?: number
  description?: string
  useYn?: string
  itemSpecs?: ItemSpec[]
  itemSkus?: ItemSku[]
}

// 품목 수정 요청
export interface ItemUpdateRequest {
  itemNm?: string
  itemTypeCd?: string
  unitCd?: string
  width?: number
  height?: number
  thickness?: number
  unitPrice?: number
  description?: string
  useYn?: string
  itemSpecs?: ItemSpec[]
  itemSkus?: ItemSku[]
}

// 품목 검색 요청
export interface ItemSearchRequest {
  keyword?: string
  searchKeyword?: string
  itemCd?: string
  itemNm?: string
  itemTypeCd?: string
  unitCd?: string
  useYn?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

// 페이징 응답
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// 중복 확인 응답
export interface CodeCheckResponse {
  exists: boolean
  message: string
}

// MIGRATED: 2025-01-25 - baseUrl 상수 제거, ITEM_ENDPOINTS 사용
// const baseUrl = getApiBaseUrl()

// 품목 목록 조회
export const getItems = async (params: {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}): Promise<PageResponse<Item>> => {
  try {
    const queryParams = new URLSearchParams()
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)

    const response = await fetch(`${ITEM_ENDPOINTS.list()}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('getItems response:', result)
    return result
  } catch (error) {
    console.error('API 호출 실패, 모의 데이터 사용:', error)
    return getMockItems(params)
  }
}

// 품목 검색
export const searchItems = async (searchRequest: ItemSearchRequest): Promise<PageResponse<Item>> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.search(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(searchRequest)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('searchItems response:', result)
    return result
  } catch (error) {
    console.error('API 호출 실패, 모의 데이터 사용:', error)
    return getMockItems(searchRequest)
  }
}

// 품목 상세 조회
export const getItemById = async (itemId: string): Promise<Item> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.detail(itemId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('getItemById response:', result)
    return result
  } catch (error) {
    console.error('API 호출 실패, 모의 데이터 사용:', error)
    const mockItems = getMockItems({ page: 0, size: 100 })
    const item = mockItems.content.find(item => item.itemId === itemId)
    if (!item) {
      throw new Error('품목을 찾을 수 없습니다.')
    }
    return item
  }
}

// 품목 등록
export const createItem = async (itemData: ItemCreateRequest): Promise<Item> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.create(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(itemData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('createItem response:', result)
    return result
  } catch (error) {
    console.error('품목 등록 실패:', error)
    throw error
  }
}

// 품목 수정
export const updateItem = async (itemId: string, itemData: ItemUpdateRequest): Promise<Item> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.update(itemId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(itemData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('updateItem response:', result)
    return result
  } catch (error) {
    console.error('품목 수정 실패:', error)
    throw error
  }
}

// 품목 삭제
export const deleteItem = async (itemId: string): Promise<void> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.delete(itemId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('deleteItem response:', await response.json())
  } catch (error) {
    console.error('품목 삭제 실패:', error)
    throw error
  }
}

// 품목코드 중복 확인
export const checkItemId = async (itemId: string): Promise<CodeCheckResponse> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.checkItemId(itemId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('checkItemCode response:', result)
    return result
  } catch (error) {
    console.error('품목코드 중복 확인 실패:', error)
    // 모의 데이터로 중복 확인
    const mockItems = getMockItems({ page: 0, size: 100 })
    const exists = mockItems.content.some(item => item.itemId === itemId)
    return {
      exists,
      message: exists ? '이미 사용 중인 품목코드입니다.' : '사용 가능한 품목코드입니다.'
    }
  }
}

// SKU코드 중복 확인
export const checkSkuId = async (skuId: string): Promise<CodeCheckResponse> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.checkSkuId(skuId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('checkSkuCode response:', result)
    return result
  } catch (error) {
    console.error('SKU코드 중복 확인 실패:', error)
    // 모의 데이터로 중복 확인
    const mockItems = getMockItems({ page: 0, size: 100 })
    const exists = mockItems.content.some(item => 
      item.itemSkus.some(sku => sku.skuId === skuId)
    )
    return {
      exists,
      message: exists ? '이미 사용 중인 SKU코드입니다.' : '사용 가능한 SKU코드입니다.'
    }
  }
}

// 스펙 등록
export const createSpec = async (itemId: string, specData: Omit<ItemSpec, 'id' | 'createdAt' | 'updatedAt'>): Promise<ItemSpec> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.createSpec(itemId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(specData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('createSpec response:', result)
    return result
  } catch (error) {
    console.error('스펙 등록 실패:', error)
    throw error
  }
}

// 스펙 삭제
export const deleteSpec = async (itemId: string, specId: string): Promise<void> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.deleteSpec(itemId, specId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    // 삭제 성공 시 응답이 비어있을 수 있으므로 text()로 확인
    const responseText = await response.text()
    console.log('deleteSpec response:', responseText || '삭제 성공')
  } catch (error) {
    console.error('스펙 삭제 실패:', error)
    throw error
  }
}

// SKU 등록
export const createSku = async (itemId: string, skuData: Omit<ItemSku, 'skuId' | 'createdAt' | 'updatedAt'>): Promise<ItemSku> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.createSku(itemId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(skuData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result = await response.json()
    console.log('createSku response:', result)
    return result
  } catch (error) {
    console.error('SKU 등록 실패:', error)
    throw error
  }
}

// SKU 삭제
export const deleteSku = async (itemId: string, skuId: string): Promise<void> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.deleteSku(itemId, skuId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    // 삭제 성공 시 응답이 비어있을 수 있으므로 text()로 확인
    const responseText = await response.text()
    console.log('deleteSku response:', responseText || '삭제 성공')
  } catch (error) {
    console.error('SKU 삭제 실패:', error)
    throw error
  }
}

// 모의 데이터
const getMockItems = (params: any): PageResponse<Item> => {
  const mockItems: Item[] = [
    {
      itemId: 'ITEM001',
      itemClassificationNumber: '3014150301',
      itemNm: '스테인리스 스틸',
      itemTypeCd: 'TYPE001',
      unitCd: 'UNIT001',
      width: 1000.0,
      height: 2000.0,
      thickness: 2.0,
      unitPrice: 50000.0,
      description: '고품질 스테인리스 스틸',
      useYn: 'Y',
      itemSpecs: [
        {
          id: 1,
          specName: '두께',
          specValue: '2.0',
          specUnit: 'mm',
          sortOrder: 1
        }
      ],
      itemSkus: [
        {
          skuId: 'SKU001',
          skuNm: '2.0mm 스테인리스',
          width: 1000.0,
          height: 2000.0,
          thickness: 2.0,
          unitPrice: 50000.0,
          stockQty: 500,
          useYn: 'Y'
        }
      ],
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00'
    },
    {
      itemId: 'ITEM002',
      itemClassificationNumber: '3014150301',
      itemNm: '알루미늄 합금',
      itemTypeCd: 'TYPE001',
      unitCd: 'UNIT001',
      width: 1200.0,
      height: 2400.0,
      thickness: 1.5,
      unitPrice: 35000.0,
      description: '경량 알루미늄 합금',
      useYn: 'Y',
      itemSpecs: [
        {
          id: 2,
          specName: '두께',
          specValue: '1.5',
          specUnit: 'mm',
          sortOrder: 1
        }
      ],
      itemSkus: [
        {
          skuId: 'SKU002',
          skuNm: '1.5mm 알루미늄',
          width: 1200.0,
          height: 2400.0,
          thickness: 1.5,
          unitPrice: 35000.0,
          stockQty: 200,
          useYn: 'Y'
        }
      ],
      createdAt: '2024-01-16T10:30:00',
      updatedAt: '2024-01-16T10:30:00'
    },
    {
      itemId: 'ITEM003',
      itemClassificationNumber: '3014150301',
      itemNm: '플라스틱 시트',
      itemTypeCd: 'TYPE002',
      unitCd: 'UNIT002',
      width: 1000.0,
      height: 2000.0,
      thickness: 3.0,
      unitPrice: 15000.0,
      description: '고강도 플라스틱 시트',
      useYn: 'Y',
      itemSpecs: [
        {
          id: 3,
          specName: '두께',
          specValue: '3.0',
          specUnit: 'mm',
          sortOrder: 1
        }
      ],
      itemSkus: [
        {
          skuId: 'SKU003',
          skuNm: '3.0mm 플라스틱',
          width: 1000.0,
          height: 2000.0,
          thickness: 3.0,
          unitPrice: 15000.0,
          stockQty: 80,
          useYn: 'Y'
        }
      ],
      createdAt: '2024-01-17T10:30:00',
      updatedAt: '2024-01-17T10:30:00'
    }
  ]

  // 검색 필터링
  let filteredItems = mockItems
  
  // keyword 검색 (통합 검색)
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    filteredItems = filteredItems.filter(item => 
      item.itemId.toLowerCase().includes(keyword) ||
      item.itemNm.toLowerCase().includes(keyword) ||
      (item.itemTypeCd && item.itemTypeCd.toLowerCase().includes(keyword)) ||
      (item.unitCd && item.unitCd.toLowerCase().includes(keyword))
    )
  } else {
    // 개별 필드 검색 (기존 로직 유지)
    if (params.itemCd) {
      filteredItems = filteredItems.filter(item => 
        item.itemId.toLowerCase().includes(params.itemId.toLowerCase())
      )
    }
    if (params.itemNm) {
      filteredItems = filteredItems.filter(item => 
        item.itemNm.toLowerCase().includes(params.itemNm.toLowerCase())
      )
    }
    if (params.itemTypeCd) {
      filteredItems = filteredItems.filter(item => 
        item.itemTypeCd?.toLowerCase().includes(params.itemTypeCd.toLowerCase())
      )
    }
    if (params.unitCd) {
      filteredItems = filteredItems.filter(item => 
        item.unitCd?.toLowerCase().includes(params.unitCd.toLowerCase())
      )
    }
  }
  
  // 사용여부 필터링
  if (params.useYn) {
    filteredItems = filteredItems.filter(item => item.useYn === params.useYn)
  }

  // 페이징
  const page = params.page || 0
  const size = params.size || 10
  const startIndex = page * size
  const endIndex = startIndex + size
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  return {
    content: paginatedItems,
    totalElements: filteredItems.length,
    totalPages: Math.ceil(filteredItems.length / size),
    size,
    number: page,
    first: page === 0,
    last: endIndex >= filteredItems.length,
    empty: filteredItems.length === 0
  }
}

// 원가 변경 이력 타입
export interface CostPriceHistory {
  historyId: number
  itemId: string
  skuId?: string
  previousCostPrice: number
  newCostPrice: number
  changeReason: string
  changedAt: string
  changedBy: string
}

// 원가 수정
export const updateCostPrice = async (
  itemId: string,
  costPrice: number,
  reason: string
): Promise<void> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.updateCost(itemId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        costPrice,
        reason
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    console.log('updateCostPrice 성공')
  } catch (error) {
    console.error('원가 수정 실패:', error)
    throw error
  }
}

// 원가 변경 이력 조회
export const getCostHistory = async (itemId: string): Promise<CostPriceHistory[]> => {
  try {
    const response = await fetch(ITEM_ENDPOINTS.costHistory(itemId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    // 배열 응답 처리
    if (Array.isArray(result)) {
      return result
    }

    // data 래핑 처리
    if (result.data) {
      return Array.isArray(result.data) ? result.data : []
    }

    return []
  } catch (error) {
    console.error('원가 변경 이력 조회 실패:', error)
    return []
  }
}

export const itemService = {
  getItems,
  searchItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  checkItemId,
  checkSkuId,
  createSpec,
  deleteSpec,
  createSku,
  deleteSku,
  updateCostPrice,
  getCostHistory
}
