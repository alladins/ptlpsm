/**
 * 메시지 히스토리 타입 정의
 *
 * CREATED DATE: 2025-11-30
 */

// 메시지 타입
export type MessageType = 'SMS' | 'LMS' | 'MMS'

// 수신자 타입
export type RecipientType = 'DRIVER' | 'SUPERVISOR'

// 발송 상태
export type SendStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

/**
 * 메시지 히스토리 응답 데이터
 */
export interface MessageHistoryResponse {
  messageId: number
  transportId: number | null
  trackingNumber: string | null
  deliveryId: number | null
  templateCode: string | null
  templateName: string | null
  messageType: MessageType
  recipientType: RecipientType
  recipientName: string
  recipientPhone: string
  messageContent: string
  ppurioMessageKey: string | null
  ppurioCmid: string | null
  sendStatus: SendStatus
  sendRequestedAt: string
  sendCompletedAt: string | null
  retryCount: number
  errorCode: string | null
  errorMessage: string | null
  sentBy: string
  createdAt: string
}

/**
 * 메시지 히스토리 검색 조건
 */
export interface MessageHistorySearchRequest {
  transportId?: number
  trackingNumber?: string
  deliveryId?: number
  templateCode?: string
  recipientType?: RecipientType | ''
  recipientPhone?: string
  sendStatus?: SendStatus | ''
  startDate?: string  // YYYY-MM-DD
  endDate?: string    // YYYY-MM-DD
  page?: number
  size?: number
}

/**
 * 메시지 히스토리 페이징 응답
 */
export interface MessageHistoryPageResponse {
  content: MessageHistoryResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/**
 * 수신자 타입 라벨
 */
export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  DRIVER: '배송기사',
  SUPERVISOR: '현장소장'
}

/**
 * 발송 상태 라벨
 */
export const SEND_STATUS_LABELS: Record<SendStatus, string> = {
  PENDING: '대기',
  SUCCESS: '성공',
  FAILED: '실패'
}
