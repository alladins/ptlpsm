/**
 * 메시지 템플릿 API 엔드포인트
 *
 * CREATED DATE: 2025-01-14
 *
 * API 패턴:
 * - Base: /api/basic/message-templates
 * - List: GET ${base}
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - Toggle Use: PATCH ${base}/{id}/toggle-use
 */

import { getApiBaseUrl } from '../config'

export const MESSAGE_TEMPLATE_ENDPOINTS = {
  /**
   * 메시지 템플릿 목록 조회
   * @returns GET /api/basic/message-templates
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-templates`
  },

  /**
   * 메시지 템플릿 상세 조회
   * @param id 템플릿 ID
   * @returns GET /api/basic/message-templates/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-templates/${id}`
  },

  /**
   * 메시지 템플릿 등록
   * @returns POST /api/basic/message-templates
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-templates`
  },

  /**
   * 메시지 템플릿 수정
   * @param id 템플릿 ID
   * @returns PUT /api/basic/message-templates/{id}
   */
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-templates/${id}`
  },

  /**
   * 메시지 템플릿 삭제
   * @param id 템플릿 ID
   * @returns DELETE /api/basic/message-templates/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-templates/${id}`
  },

  /**
   * 메시지 템플릿 사용여부 토글
   * @param id 템플릿 ID
   * @returns PATCH /api/basic/message-templates/{id}/toggle-use
   */
  toggleUse: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-templates/${id}/toggle-use`
  }
} as const
