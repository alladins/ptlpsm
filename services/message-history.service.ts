/**
 * 메시지 히스토리 서비스
 *
 * CREATED DATE: 2025-11-30
 */

import { MESSAGE_HISTORY_ENDPOINTS } from './api/endpoints/message-history.endpoints'
import type {
  MessageHistoryResponse,
  MessageHistorySearchRequest,
  MessageHistoryPageResponse
} from '~/types/message-history'

/**
 * 메시지 이력 검색 (페이징)
 */
export async function searchMessageHistory(
  params: MessageHistorySearchRequest = {}
): Promise<MessageHistoryPageResponse> {
  try {
    const queryParams = new URLSearchParams()

    if (params.transportId) queryParams.append('transportId', params.transportId.toString())
    if (params.trackingNumber) queryParams.append('trackingNumber', params.trackingNumber)
    if (params.deliveryId) queryParams.append('deliveryId', params.deliveryId.toString())
    if (params.templateCode) queryParams.append('templateCode', params.templateCode)
    if (params.recipientType) queryParams.append('recipientType', params.recipientType)
    if (params.recipientPhone) queryParams.append('recipientPhone', params.recipientPhone)
    if (params.sendStatus) queryParams.append('sendStatus', params.sendStatus)
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)

    queryParams.append('page', (params.page || 0).toString())
    queryParams.append('size', (params.size || 20).toString())

    const url = `${MESSAGE_HISTORY_ENDPOINTS.list()}?${queryParams.toString()}`
    console.log('메시지 이력 조회:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message history: ${response.statusText}`)
    }

    const result = await response.json()

    // ApiResponse 형태인 경우 data 추출
    if (result.data) {
      return result.data as MessageHistoryPageResponse
    }

    return result as MessageHistoryPageResponse
  } catch (error) {
    console.error('메시지 이력 조회 실패:', error)
    throw error
  }
}

/**
 * 메시지 상세 조회
 */
export async function getMessageHistoryDetail(messageId: number): Promise<MessageHistoryResponse> {
  try {
    const url = MESSAGE_HISTORY_ENDPOINTS.detail(messageId)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message detail: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('메시지 상세 조회 실패:', error)
    throw error
  }
}

/**
 * 운송장별 메시지 이력 조회
 */
export async function getMessageHistoryByTransport(transportId: number): Promise<MessageHistoryResponse[]> {
  try {
    const url = MESSAGE_HISTORY_ENDPOINTS.byTransport(transportId)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message history by transport: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('운송장별 메시지 이력 조회 실패:', error)
    throw error
  }
}

/**
 * 납품확인별 메시지 이력 조회
 */
export async function getMessageHistoryByDelivery(deliveryId: number): Promise<MessageHistoryResponse[]> {
  try {
    const url = MESSAGE_HISTORY_ENDPOINTS.byDelivery(deliveryId)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message history by delivery: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('납품확인별 메시지 이력 조회 실패:', error)
    throw error
  }
}

/**
 * 메시지 재발송 응답 타입
 */
export interface MessageResendResponse {
  messageId: number
  sendStatus: 'SUCCESS' | 'FAILED' | 'PENDING'
  ppurioMessageKey?: string
  errorMessage?: string
}

/**
 * 메시지 재발송
 */
export async function resendMessage(messageId: number): Promise<MessageResendResponse> {
  try {
    const url = MESSAGE_HISTORY_ENDPOINTS.resend(messageId)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to resend message: ${response.statusText}`)
    }

    const result = await response.json()

    // ApiResponse 형태인 경우 data 추출
    if (result.data) {
      return result.data as MessageResendResponse
    }

    return result as MessageResendResponse
  } catch (error) {
    console.error('메시지 재발송 실패:', error)
    throw error
  }
}
