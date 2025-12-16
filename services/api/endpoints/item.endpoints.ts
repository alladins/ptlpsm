/**
 * 품목 관리 API 엔드포인트
 *
 * MIGRATED FROM: item.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: ${baseUrl}/basic/items
 * - List: GET ${base}?params
 * - Search: POST ${base}/search
 * - Detail: GET ${base}/{itemId}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{itemId}
 * - Delete: DELETE ${base}/{itemId}
 * - CheckItemId: GET ${base}/check-item-id/{itemId}
 * - CheckSkuId: GET ${base}/check-sku-id/{skuId}
 * - CreateSpec: POST ${base}/{itemId}/specs
 * - DeleteSpec: DELETE ${base}/{itemId}/specs/{specId}
 * - CreateSku: POST ${base}/{itemId}/skus
 * - DeleteSku: DELETE ${base}/{itemId}/skus/{skuId}
 */

import { getApiBaseUrl } from '../config'

export const ITEM_ENDPOINTS = {
  /**
   * 품목 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items`
  },

  /**
   * 품목 검색
   * @returns POST /basic/items/search
   */
  search: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/search`
  },

  /**
   * 품목 상세 조회
   * @param itemId - 품목 ID
   * @returns GET /basic/items/{itemId}
   */
  detail: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}`
  },

  /**
   * 품목 등록
   * @returns POST /basic/items
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items`
  },

  /**
   * 품목 수정
   * @param itemId - 품목 ID
   * @returns PUT /basic/items/{itemId}
   */
  update: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}`
  },

  /**
   * 품목 삭제
   * @param itemId - 품목 ID
   * @returns DELETE /basic/items/{itemId}
   */
  delete: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}`
  },

  /**
   * 품목코드 중복 확인
   * @param itemId - 품목 ID
   * @returns GET /basic/items/check-item-id/{itemId}
   */
  checkItemId: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/check-item-id/${itemId}`
  },

  /**
   * SKU코드 중복 확인
   * @param skuId - SKU ID
   * @returns GET /basic/items/check-sku-id/{skuId}
   */
  checkSkuId: (skuId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/check-sku-id/${skuId}`
  },

  /**
   * 스펙 등록
   * @param itemId - 품목 ID
   * @returns POST /basic/items/{itemId}/specs
   */
  createSpec: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}/specs`
  },

  /**
   * 스펙 삭제
   * @param itemId - 품목 ID
   * @param specId - 스펙 ID
   * @returns DELETE /basic/items/{itemId}/specs/{specId}
   */
  deleteSpec: (itemId: string, specId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}/specs/${specId}`
  },

  /**
   * SKU 등록
   * @param itemId - 품목 ID
   * @returns POST /basic/items/{itemId}/skus
   */
  createSku: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}/skus`
  },

  /**
   * SKU 삭제
   * @param itemId - 품목 ID
   * @param skuId - SKU ID
   * @returns DELETE /basic/items/{itemId}/skus/{skuId}
   */
  deleteSku: (itemId: string, skuId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/items/${itemId}/skus/${skuId}`
  },

  /**
   * 원가 수정
   * @param itemId - 품목 ID
   * @returns PUT /admin/items/{itemId}/cost
   */
  updateCost: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/items/${itemId}/cost`
  },

  /**
   * 원가 변경 이력 조회
   * @param itemId - 품목 ID
   * @returns GET /admin/items/{itemId}/cost-history
   */
  costHistory: (itemId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/items/${itemId}/cost-history`
  }
} as const
