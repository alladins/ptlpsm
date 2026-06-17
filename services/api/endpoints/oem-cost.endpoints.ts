/**
 * OEM 원가 관리 API 엔드포인트
 */

import { getApiBaseUrl } from '../config'

export const OEM_COST_ENDPOINTS = {
  // 목록 조회 (검색/필터)
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs`
  },

  // 트리 구조 목록 조회 (SKU 부모 → OEM 자식)
  tree: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/tree`
  },

  // 목록 엑셀 다운로드
  exportExcel: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/export`
  },

  // 상세 조회
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/${id}`
  },

  // SKU별 OEM 원가 목록
  bySku: (skuId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/sku/${skuId}`
  },

  // OEM별 SKU 원가 목록
  byOem: (oemCompanyId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/oem/${oemCompanyId}`
  },

  // 원가 등록
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs`
  },

  // 원가 수정
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/${id}`
  },

  // 원가 삭제 (soft delete)
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/${id}`
  },

  // 변경 이력 조회 (특정 SKU + OEM 조합)
  history: (skuId: string, oemCompanyId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/history?skuId=${encodeURIComponent(skuId)}&oemCompanyId=${oemCompanyId}&size=100`
  },

  // 전체 변경 이력
  historyAll: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/history`
  },

  // 특정 원가의 변경 이력
  historyById: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/${id}/history`
  },

  // 통계 조회
  statistics: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/stats`
  },

  // 월별 통계
  statsMonthly: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/stats/monthly`
  },

  // 특정 OEM의 월별 원가 변동
  statsByOem: (oemCompanyId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/stats/by-oem/${oemCompanyId}`
  },

  // 원가 미설정 SKU 목록
  skusWithoutCost: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/skus-without-cost`
  },

  // 영향받는 주문 목록 조회 (원가 변경 시 재계산 대상)
  affectedOrders: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/affected-orders`
  },

  // 선택 재계산 실행
  recalculate: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/oem-costs/recalculate`
  }
}
