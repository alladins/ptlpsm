/**
 * 메시지 템플릿 서비스
 *
 * CREATED DATE: 2025-01-14
 */

import { MESSAGE_TEMPLATE_ENDPOINTS } from './api/endpoints/message-template.endpoints'
import type {
  MessageTemplate,
  MessageTemplateCreateRequest,
  MessageTemplateUpdateRequest,
  MessageTemplateSearchParams,
  MessageTemplateListResponse
} from '~/types/message-template'

/**
 * 서버 응답을 프론트엔드 타입으로 변환
 * 서버에서는 templateContent로 보내고, 프론트엔드에서는 content로 사용
 */
function transformTemplate(serverData: any): MessageTemplate {
  return {
    templateId: serverData.templateId || serverData.id,
    templateCode: serverData.templateCode,
    templateName: serverData.templateName,
    messageType: serverData.messageType,
    subject: serverData.subject,
    content: serverData.templateContent || serverData.content,
    description: serverData.description,
    useYn: serverData.useYn,
    createdAt: serverData.createdAt,
    createdBy: serverData.createdBy,
    updatedAt: serverData.updatedAt,
    updatedBy: serverData.updatedBy
  }
}

/**
 * 프론트엔드 데이터를 서버 요청 형식으로 변환
 * 프론트엔드에서는 content로 사용하고, 서버에는 templateContent로 전송
 */
function transformToServerRequest(data: MessageTemplateCreateRequest | MessageTemplateUpdateRequest): any {
  const serverData: any = { ...data }

  // content를 templateContent로 변환
  if ('content' in serverData) {
    serverData.templateContent = serverData.content
    delete serverData.content
  }

  return serverData
}

/**
 * 메시지 템플릿 목록 조회
 */
export async function getMessageTemplateList(
  params: MessageTemplateSearchParams = {}
): Promise<MessageTemplateListResponse> {
  try {
    const queryParams = new URLSearchParams()

    if (params.templateCode) queryParams.append('templateCode', params.templateCode)
    if (params.templateName) queryParams.append('templateName', params.templateName)
    if (params.messageType) queryParams.append('messageType', params.messageType)
    if (params.useYn) queryParams.append('useYn', params.useYn)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${MESSAGE_TEMPLATE_ENDPOINTS.list()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message templates: ${response.statusText}`)
    }

    const data = await response.json()

    // 서버 응답 데이터 변환
    return {
      ...data,
      content: data.content.map(transformTemplate)
    }
  } catch (error) {
    console.error('Error fetching message template list:', error)
    throw error
  }
}

/**
 * 메시지 템플릿 상세 조회
 */
export async function getMessageTemplate(id: number): Promise<MessageTemplate> {
  try {
    const url = MESSAGE_TEMPLATE_ENDPOINTS.detail(id)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message template: ${response.statusText}`)
    }

    const data = await response.json()
    return transformTemplate(data)
  } catch (error) {
    console.error('Error fetching message template:', error)
    throw error
  }
}

/**
 * 메시지 템플릿 등록
 */
export async function createMessageTemplate(
  data: MessageTemplateCreateRequest
): Promise<MessageTemplate> {
  try {
    const url = MESSAGE_TEMPLATE_ENDPOINTS.create()
    const serverData = transformToServerRequest(data)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverData)
    })

    if (!response.ok) {
      throw new Error(`Failed to create message template: ${response.statusText}`)
    }

    const responseData = await response.json()
    return transformTemplate(responseData)
  } catch (error) {
    console.error('Error creating message template:', error)
    throw error
  }
}

/**
 * 메시지 템플릿 수정
 */
export async function updateMessageTemplate(
  id: number,
  data: MessageTemplateUpdateRequest
): Promise<MessageTemplate> {
  try {
    const url = MESSAGE_TEMPLATE_ENDPOINTS.update(id)
    const serverData = transformToServerRequest(data)
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverData)
    })

    if (!response.ok) {
      throw new Error(`Failed to update message template: ${response.statusText}`)
    }

    const responseData = await response.json()
    return transformTemplate(responseData)
  } catch (error) {
    console.error('Error updating message template:', error)
    throw error
  }
}

/**
 * 메시지 템플릿 삭제
 */
export async function deleteMessageTemplate(id: number): Promise<void> {
  try {
    const url = MESSAGE_TEMPLATE_ENDPOINTS.delete(id)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete message template: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error deleting message template:', error)
    throw error
  }
}

/**
 * 메시지 템플릿 사용여부 토글
 */
export async function toggleMessageTemplateUse(id: number): Promise<MessageTemplate> {
  try {
    const url = MESSAGE_TEMPLATE_ENDPOINTS.toggleUse(id)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to toggle template use: ${response.statusText}`)
    }

    const responseData = await response.json()
    return transformTemplate(responseData)
  } catch (error) {
    console.error('Error toggling template use:', error)
    throw error
  }
}
