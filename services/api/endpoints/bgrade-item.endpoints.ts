/**
 * B급 품목 관리 API 엔드포인트
 *
 * CREATED DATE: 2026-01-26
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/delivery-done/{deliveryDoneId}/bgrade-items
 * - List: GET ${base}
 * - Detail: GET ${base}/{itemId}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{itemId}
 * - Delete: DELETE ${base}/{itemId}
 *
 * 비즈니스 규칙:
 * - B급 품목은 납품 완료 후에만 등록 가능
 * - 등록/수정/삭제 시 원가 자동 재계산 (fund_management.oem_expected_total 업데이트)
 * - 인수증 PDF에는 B급 품목이 포함되지 않음 (별도 테이블)
 */

import { getApiBaseUrl } from '../config'

export const BGRADE_ITEM_ENDPOINTS = {
  /**
   * B급 품목 목록 조회
   * @param deliveryDoneId - 납품완료계 ID
   * @returns GET /admin/delivery-done/{deliveryDoneId}/bgrade-items
   */
  list: (deliveryDoneId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/delivery-done/${deliveryDoneId}/bgrade-items`
  },

  /**
   * B급 품목 단건 조회
   * @param deliveryDoneId - 납품완료계 ID
   * @param itemId - B급 품목 ID
   * @returns GET /admin/delivery-done/{deliveryDoneId}/bgrade-items/{itemId}
   */
  detail: (deliveryDoneId: number, itemId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/delivery-done/${deliveryDoneId}/bgrade-items/${itemId}`
  },

  /**
   * B급 품목 등록
   * @param deliveryDoneId - 납품완료계 ID
   * @returns POST /admin/delivery-done/{deliveryDoneId}/bgrade-items
   */
  create: (deliveryDoneId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/delivery-done/${deliveryDoneId}/bgrade-items`
  },

  /**
   * B급 품목 수정
   * @param deliveryDoneId - 납품완료계 ID
   * @param itemId - B급 품목 ID
   * @returns PUT /admin/delivery-done/{deliveryDoneId}/bgrade-items/{itemId}
   */
  update: (deliveryDoneId: number, itemId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/delivery-done/${deliveryDoneId}/bgrade-items/${itemId}`
  },

  /**
   * B급 품목 삭제
   * @param deliveryDoneId - 납품완료계 ID
   * @param itemId - B급 품목 ID
   * @returns DELETE /admin/delivery-done/{deliveryDoneId}/bgrade-items/{itemId}
   */
  delete: (deliveryDoneId: number, itemId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/delivery-done/${deliveryDoneId}/bgrade-items/${itemId}`
  }
} as const
