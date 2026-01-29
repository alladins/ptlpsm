/**
 * B급 품목 서비스
 * @description 납품 완료 후 B급 품목 CRUD 작업
 * @created 2026-01-26
 */

import { BGRADE_ITEM_ENDPOINTS } from './api/endpoints/bgrade-item.endpoints'
import type {
  BgradeItemCreateRequest,
  BgradeItemUpdateRequest,
  BgradeItemResponse,
  BgradeItemListResponse
} from '~/types/bgrade-item'

class BgradeItemService {
  /**
   * B급 품목 목록 조회
   * @param deliveryDoneId - 납품완료계 ID
   * @returns B급 품목 목록
   */
  async getBgradeItems(deliveryDoneId: number): Promise<BgradeItemListResponse> {
    try {
      const url = BGRADE_ITEM_ENDPOINTS.list(deliveryDoneId)
      console.log('[bgrade-item.service] getBgradeItems 호출:', { deliveryDoneId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[bgrade-item.service] B급 품목 목록 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`B급 품목 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('[bgrade-item.service] B급 품목 목록 응답:', data)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('[bgrade-item.service] getBgradeItems 에러:', error)
      throw error
    }
  }

  /**
   * B급 품목 단건 조회
   * @param deliveryDoneId - 납품완료계 ID
   * @param itemId - B급 품목 ID
   * @returns B급 품목 상세
   */
  async getBgradeItem(deliveryDoneId: number, itemId: number): Promise<BgradeItemResponse> {
    try {
      const url = BGRADE_ITEM_ENDPOINTS.detail(deliveryDoneId, itemId)
      console.log('[bgrade-item.service] getBgradeItem 호출:', { deliveryDoneId, itemId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[bgrade-item.service] B급 품목 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`B급 품목 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('[bgrade-item.service] B급 품목 응답:', data)
      return data
    } catch (error) {
      console.error('[bgrade-item.service] getBgradeItem 에러:', error)
      throw error
    }
  }

  /**
   * B급 품목 등록
   * @param deliveryDoneId - 납품완료계 ID
   * @param request - 등록 요청
   * @returns 등록된 B급 품목
   * @note 등록 시 원가 자동 재계산 (fund_management.oem_expected_total 업데이트)
   */
  async createBgradeItem(
    deliveryDoneId: number,
    request: BgradeItemCreateRequest
  ): Promise<BgradeItemResponse> {
    try {
      const url = BGRADE_ITEM_ENDPOINTS.create(deliveryDoneId)
      console.log('[bgrade-item.service] createBgradeItem 호출:', { deliveryDoneId, url, request })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[bgrade-item.service] B급 품목 등록 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`B급 품목 등록 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[bgrade-item.service] B급 품목 등록 응답:', data)
      return data
    } catch (error) {
      console.error('[bgrade-item.service] createBgradeItem 에러:', error)
      throw error
    }
  }

  /**
   * B급 품목 수정
   * @param deliveryDoneId - 납품완료계 ID
   * @param itemId - B급 품목 ID
   * @param request - 수정 요청
   * @returns 수정된 B급 품목
   * @note 수정 시 원가 자동 재계산
   */
  async updateBgradeItem(
    deliveryDoneId: number,
    itemId: number,
    request: BgradeItemUpdateRequest
  ): Promise<BgradeItemResponse> {
    try {
      const url = BGRADE_ITEM_ENDPOINTS.update(deliveryDoneId, itemId)
      console.log('[bgrade-item.service] updateBgradeItem 호출:', {
        deliveryDoneId,
        itemId,
        url,
        request
      })

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[bgrade-item.service] B급 품목 수정 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`B급 품목 수정 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[bgrade-item.service] B급 품목 수정 응답:', data)
      return data
    } catch (error) {
      console.error('[bgrade-item.service] updateBgradeItem 에러:', error)
      throw error
    }
  }

  /**
   * B급 품목 삭제
   * @param deliveryDoneId - 납품완료계 ID
   * @param itemId - B급 품목 ID
   * @note 삭제 시 원가 자동 재계산
   */
  async deleteBgradeItem(deliveryDoneId: number, itemId: number): Promise<void> {
    try {
      const url = BGRADE_ITEM_ENDPOINTS.delete(deliveryDoneId, itemId)
      console.log('[bgrade-item.service] deleteBgradeItem 호출:', { deliveryDoneId, itemId, url })

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[bgrade-item.service] B급 품목 삭제 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`B급 품목 삭제 실패: ${response.status} - ${errorText}`)
      }

      console.log('[bgrade-item.service] B급 품목 삭제 완료')
    } catch (error) {
      console.error('[bgrade-item.service] deleteBgradeItem 에러:', error)
      throw error
    }
  }
}

export const bgradeItemService = new BgradeItemService()
