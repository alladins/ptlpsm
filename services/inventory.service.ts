/**
 * 재고 관리 API 서비스
 *
 * @created 2026-02-09
 * @description 재고 현황 조회, 입출고 처리, 창고간 이동 기능 제공
 */

import { getAuthHeaders } from './api'
import { INVENTORY_ENDPOINTS } from './api/endpoints/inventory.endpoints'
import type {
  InventoryItem,
  InventoryListFilter,
  InventoryTransaction,
  InventoryTransactionFilter,
  InboundRequest,
  OutboundRequest,
  TransferRequest,
  SkuTransactionSummary
} from '~/types/inventory'

/**
 * 재고 서비스 클래스
 */
class InventoryService {
  /**
   * 재고 목록 조회
   * @param filter - 검색 필터
   * @returns 페이지네이션된 재고 목록
   */
  /**
   * 재고현황 엑셀 다운로드 (품목 그룹 집계, 검색 조건 연동)
   */
  async exportInventoryExcel(filter: Partial<InventoryListFilter> = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (filter.warehouseId !== undefined && filter.warehouseId !== null) queryParams.append('warehouseId', filter.warehouseId.toString())
    if (filter.oemCompanyId !== undefined && filter.oemCompanyId !== null) queryParams.append('oemCompanyId', filter.oemCompanyId.toString())
    if (filter.keyword) queryParams.append('keyword', filter.keyword)

    const url = `${INVENTORY_ENDPOINTS.exportInventory()}?${queryParams.toString()}`
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() })
    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }
    return response.blob()
  }

  /**
   * 입출고이력 엑셀 다운로드 (검색 조건 연동, 페이징 미적용)
   */
  async exportTransactionExcel(filter: Partial<InventoryTransactionFilter> = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (filter.warehouseId !== undefined && filter.warehouseId !== null) queryParams.append('warehouseId', filter.warehouseId.toString())
    if (filter.skuId) queryParams.append('skuId', filter.skuId)
    if (filter.transactionType) queryParams.append('transactionType', filter.transactionType)
    if (filter.startDate) queryParams.append('startDate', filter.startDate)
    if (filter.endDate) queryParams.append('endDate', filter.endDate)

    const url = `${INVENTORY_ENDPOINTS.exportTransactions()}?${queryParams.toString()}`
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() })
    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }
    return response.blob()
  }

  async getInventoryList(filter: InventoryListFilter): Promise<{
    content: InventoryItem[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }> {
    try {
      const queryParams = new URLSearchParams()

      // 페이지네이션 파라미터 (0-based)
      queryParams.append('page', (filter.page ?? 0).toString())
      queryParams.append('size', (filter.size ?? 10).toString())

      // 선택적 파라미터
      if (filter.warehouseId !== undefined && filter.warehouseId !== null) {
        queryParams.append('warehouseId', filter.warehouseId.toString())
      }
      if (filter.skuId) {
        queryParams.append('skuId', filter.skuId)
      }
      if (filter.oemCompanyId !== undefined && filter.oemCompanyId !== null) {
        queryParams.append('oemCompanyId', filter.oemCompanyId.toString())
      }
      if (filter.keyword) {
        queryParams.append('keyword', filter.keyword)
      }

      const url = `${INVENTORY_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('[inventory.service] 재고 목록 조회:', { url, filter })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[inventory.service] 목록 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`재고 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('[inventory.service] 목록 조회 성공:', data)

      // 배열 응답 처리
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: data.length
        }
      }

      // 페이지네이션 응답 처리
      return {
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        pageNumber: data.number ?? 0,
        pageSize: data.size ?? 10
      }
    } catch (error) {
      console.error('[inventory.service] 목록 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * SKU별 입출고 현황 요약 조회
   * @returns SKU별 발주수량, 입고, 출고, 이동 현황
   */
  async getSkuTransactionSummary(): Promise<SkuTransactionSummary[]> {
    try {
      const url = INVENTORY_ENDPOINTS.skuSummary()
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`SKU 현황 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[inventory.service] SKU 현황 조회 오류:', error)
      throw error
    }
  }

  /**
   * 입출고 이력 조회
   * @param filter - 검색 필터
   * @returns 페이지네이션된 이력 목록
   */
  async getTransactionList(filter: InventoryTransactionFilter): Promise<{
    content: InventoryTransaction[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }> {
    try {
      const queryParams = new URLSearchParams()

      // 페이지네이션 파라미터 (0-based)
      queryParams.append('page', (filter.page ?? 0).toString())
      queryParams.append('size', (filter.size ?? 10).toString())

      // 선택적 파라미터
      if (filter.warehouseId !== undefined && filter.warehouseId !== null) {
        queryParams.append('warehouseId', filter.warehouseId.toString())
      }
      if (filter.skuId) {
        queryParams.append('skuId', filter.skuId)
      }
      if (filter.transactionType) {
        queryParams.append('transactionType', filter.transactionType)
      }
      if (filter.startDate) {
        queryParams.append('startDate', filter.startDate)
      }
      if (filter.endDate) {
        queryParams.append('endDate', filter.endDate)
      }

      const url = `${INVENTORY_ENDPOINTS.transactions()}?${queryParams.toString()}`
      console.log('[inventory.service] 이력 조회:', { url, filter })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[inventory.service] 이력 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`입출고 이력 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('[inventory.service] 이력 조회 성공:', data)

      // 배열 응답 처리
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: data.length
        }
      }

      return {
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        pageNumber: data.number ?? 0,
        pageSize: data.size ?? 10
      }
    } catch (error) {
      console.error('[inventory.service] 이력 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 입고 처리
   * @param request - 입고 요청 데이터
   */
  async processInbound(request: InboundRequest): Promise<void> {
    try {
      const url = INVENTORY_ENDPOINTS.inbound()
      console.log('[inventory.service] 입고 요청:', { url, request })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[inventory.service] 입고 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`입고 처리 실패: ${response.status} - ${errorText}`)
      }

      console.log('[inventory.service] 입고 성공')
    } catch (error) {
      console.error('[inventory.service] processInbound 에러:', error)
      throw error
    }
  }

  /**
   * 출고 처리
   * @param request - 출고 요청 데이터
   */
  async processOutbound(request: OutboundRequest): Promise<void> {
    try {
      const url = INVENTORY_ENDPOINTS.outbound()
      console.log('[inventory.service] 출고 요청:', { url, request })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[inventory.service] 출고 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고 처리 실패: ${response.status} - ${errorText}`)
      }

      console.log('[inventory.service] 출고 성공')
    } catch (error) {
      console.error('[inventory.service] processOutbound 에러:', error)
      throw error
    }
  }

  /**
   * 창고간 이동 처리
   * @param request - 이동 요청 데이터
   */
  async processTransfer(request: TransferRequest): Promise<void> {
    try {
      const url = INVENTORY_ENDPOINTS.transfer()
      console.log('[inventory.service] 이동 요청:', { url, request })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[inventory.service] 이동 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`창고간 이동 실패: ${response.status} - ${errorText}`)
      }

      console.log('[inventory.service] 이동 성공')
    } catch (error) {
      console.error('[inventory.service] processTransfer 에러:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const inventoryService = new InventoryService()
