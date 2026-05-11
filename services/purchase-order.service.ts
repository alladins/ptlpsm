/**
 * 발주서 관리 API 서비스
 *
 * @created 2026-02-09
 * @description 발주서 CRUD 및 상태 관리 기능 제공
 */

import { getAuthHeaders } from './api'
import { PURCHASE_ORDER_ENDPOINTS } from './api/endpoints/purchase-order.endpoints'
import type {
  PurchaseOrderListItem,
  PurchaseOrderDetail,
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrderListFilter,
  ProduceCompleteRequest,
  RejectImpactResponse
} from '~/types/purchase-order'

/**
 * 발주서 서비스 클래스
 */
class PurchaseOrderService {
  /**
   * 발주서 목록 조회
   * @param filter - 검색 필터
   * @returns 페이지네이션된 발주서 목록
   */
  async getPurchaseOrderList(filter: PurchaseOrderListFilter): Promise<{
    content: PurchaseOrderListItem[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }> {
    try {
      const queryParams = new URLSearchParams()

      // 필수 파라미터 (0-based pagination)
      queryParams.append('page', (filter.page ?? 0).toString())
      queryParams.append('size', (filter.size ?? 10).toString())

      // 선택적 파라미터
      if (filter.status !== undefined && filter.status !== '') {
        queryParams.append('status', filter.status)
      }
      if (filter.oemCompanyId !== undefined && filter.oemCompanyId !== null) {
        queryParams.append('oemCompanyId', filter.oemCompanyId.toString())
      }
      if (filter.startDate) {
        queryParams.append('startDate', filter.startDate)
      }
      if (filter.endDate) {
        queryParams.append('endDate', filter.endDate)
      }
      if (filter.keyword) {
        queryParams.append('keyword', filter.keyword)
      }
      if (filter.sort) {
        queryParams.append('sort', filter.sort)
      }

      const url = `${PURCHASE_ORDER_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('[purchase-order.service] 목록 조회 요청:', {
        url,
        method: 'GET',
        filter
      })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 목록 조회 실패:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`발주서 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 목록 조회 응답:', {
        status: response.status,
        data
      })

      // 서버 응답이 배열로 오는 경우 페이지네이션 형식으로 변환
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: data.length
        }
      }

      // 서버 응답이 페이지네이션 형식인 경우
      return {
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        pageNumber: data.page ?? data.number ?? 0,
        pageSize: data.size ?? 10
      }
    } catch (error) {
      console.error('[purchase-order.service] 목록 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 발주서 상세 조회
   * @param poId - 발주서 ID
   * @returns 발주서 상세 정보
   */
  async getPurchaseOrderById(poId: number): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.detail(poId)
      console.log('[purchase-order.service] 상세 조회 호출:', {
        poId,
        url,
        method: 'GET'
      })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      console.log('[purchase-order.service] 응답 상태:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] API 오류 응답:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        })
        throw new Error(`발주서 상세 조회 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 응답 데이터:', data)

      return data
    } catch (error) {
      console.error('[purchase-order.service] getPurchaseOrderById 에러:', error)
      console.error('[purchase-order.service] 에러 스택:', error instanceof Error ? error.stack : 'No stack')
      throw error
    }
  }

  /**
   * 발주서 등록
   * @param request - 발주서 등록 요청 데이터
   * @returns 생성된 발주서 정보
   */
  async createPurchaseOrder(request: PurchaseOrderCreateRequest): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.create()
      console.log('[purchase-order.service] 등록 요청:', {
        url,
        method: 'POST',
        request
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 등록 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`발주서 등록 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 등록 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] createPurchaseOrder 에러:', error)
      throw error
    }
  }

  /**
   * 발주서 수정
   * @param poId - 발주서 ID
   * @param request - 발주서 수정 요청 데이터
   * @returns 수정된 발주서 정보
   */
  async updatePurchaseOrder(poId: number, request: PurchaseOrderUpdateRequest): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.update(poId)
      console.log('[purchase-order.service] 수정 요청:', {
        url,
        method: 'PUT',
        poId,
        request
      })

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 수정 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`발주서 수정 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 수정 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] updatePurchaseOrder 에러:', error)
      throw error
    }
  }

  /**
   * 발주서 삭제
   * @param poId - 발주서 ID
   */
  async deletePurchaseOrder(poId: number): Promise<void> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.delete(poId)
      console.log('[purchase-order.service] 삭제 요청:', {
        url,
        method: 'DELETE',
        poId
      })

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 삭제 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`발주서 삭제 실패: ${response.status} - ${errorText}`)
      }

      console.log('[purchase-order.service] 삭제 성공')
    } catch (error) {
      console.error('[purchase-order.service] deletePurchaseOrder 에러:', error)
      throw error
    }
  }

  /**
   * 발주서 발행
   * @param poId - 발주서 ID
   * @returns 발행된 발주서 정보
   */
  async issuePurchaseOrder(poId: number): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.issue(poId)
      console.log('[purchase-order.service] 발행 요청:', {
        url,
        method: 'POST',
        poId
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 발행 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`발주서 발행 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 발행 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] issuePurchaseOrder 에러:', error)
      throw error
    }
  }

  /**
   * 본사 바로 입고 (DRAFT → STOCKED)
   * @param poId - 발주서 ID
   */
  async directStockIn(poId: number): Promise<void> {
    const url = PURCHASE_ORDER_ENDPOINTS.directStockIn(poId)
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `본사 바로 입고 실패: ${response.status}`)
    }
  }

  /**
   * 발주서 접수 (ISSUED → ACCEPTED)
   * @param poId - 발주서 ID
   * @returns 접수된 발주서 정보
   */
  async acceptPurchaseOrder(poId: number): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.accept(poId)
      console.log('[purchase-order.service] 접수 요청:', { url, poId })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 접수 실패:', { status: response.status, error: errorText })
        throw new Error(`발주서 접수 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 접수 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] acceptPurchaseOrder 에러:', error)
      throw error
    }
  }

  /**
   * 발주서 반려 영향 분석
   * @param poId - 발주서 ID
   * @returns 영향받는 출하 목록 및 취소 대상 출고요청 건수
   */
  async getRejectImpact(poId: number): Promise<RejectImpactResponse> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.rejectImpact(poId)
      console.log('[purchase-order.service] 반려 영향 분석 요청:', { url, poId })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 반려 영향 분석 실패:', { status: response.status, error: errorText })
        throw new Error(`반려 영향 분석 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 반려 영향 분석 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] getRejectImpact 에러:', error)
      throw error
    }
  }

  /**
   * 발주서 반려 (ISSUED/ACCEPTED → REJECTED)
   * @param poId - 발주서 ID
   * @param rejectReason - 반려 사유
   * @returns 반려된 발주서 정보
   */
  async rejectPurchaseOrder(poId: number, rejectReason: string): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.reject(poId)
      console.log('[purchase-order.service] 반려 요청:', { url, poId, rejectReason })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejectReason })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 반려 실패:', { status: response.status, error: errorText })
        throw new Error(`발주서 반려 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 반려 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] rejectPurchaseOrder 에러:', error)
      throw error
    }
  }

  /**
   * 발주서 PDF 다운로드 (새 탭에서 열기)
   * @param poId - 발주서 ID
   */
  async downloadPdf(poId: number): Promise<void> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.pdf(poId)
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `PDF 다운로드 실패: ${response.status}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')

      // 메모리 해제 (약간의 딜레이 후)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    } catch (error) {
      console.error('[purchase-order.service] downloadPdf 에러:', error)
      throw error
    }
  }

  /**
   * 생산완료 체크
   * @param poId - 발주서 ID
   * @param request - 생산완료 요청 데이터
   * @returns 업데이트된 발주서 정보
   */
  async markProduced(poId: number, request: ProduceCompleteRequest): Promise<PurchaseOrderDetail> {
    try {
      const url = PURCHASE_ORDER_ENDPOINTS.produce(poId)
      console.log('[purchase-order.service] 생산완료 체크 요청:', {
        url,
        method: 'POST',
        poId,
        request
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[purchase-order.service] 생산완료 체크 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`생산완료 체크 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[purchase-order.service] 생산완료 체크 성공:', data)
      return data
    } catch (error) {
      console.error('[purchase-order.service] markProduced 에러:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const purchaseOrderService = new PurchaseOrderService()
