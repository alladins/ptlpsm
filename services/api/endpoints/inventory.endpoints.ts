/**
 * 재고 관리 API 엔드포인트
 *
 * @created 2026-02-09
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/inventory
 * - List: GET ${base}
 * - Transactions: GET ${base}/transactions
 * - Inbound: POST ${base}/inbound
 * - Outbound: POST ${base}/outbound
 * - Transfer: POST ${base}/transfer
 */

import { getApiBaseUrl } from '../config'

export const INVENTORY_ENDPOINTS = {
  /**
   * 재고 목록 조회
   * @returns GET /admin/inventory
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory`
  },

  /**
   * 재고현황 엑셀 다운로드
   * @returns GET /admin/inventory/export
   */
  exportInventory: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/export`
  },

  /**
   * 입출고이력 엑셀 다운로드
   * @returns GET /admin/inventory/transactions/export
   */
  exportTransactions: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/transactions/export`
  },

  /**
   * SKU별 입출고 현황 요약
   * @returns GET /admin/inventory/sku-summary
   */
  skuSummary: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/sku-summary`
  },

  /**
   * 입출고 이력 조회
   * @returns GET /admin/inventory/transactions
   */
  transactions: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/transactions`
  },

  /**
   * 입고 처리
   * @returns POST /admin/inventory/inbound
   */
  inbound: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/inbound`
  },

  /**
   * 출고 처리
   * @returns POST /admin/inventory/outbound
   */
  outbound: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/outbound`
  },

  /**
   * 창고간 이동
   * @returns POST /admin/inventory/transfer
   */
  transfer: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/inventory/transfer`
  }
} as const
