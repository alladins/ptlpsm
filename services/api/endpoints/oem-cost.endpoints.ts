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

  // 적용구간 조회 (특정 SKU + OEM 조합) — 만료된 과거 구간 포함
  // 한 공급사의 구간만 모아 보는 용도 (트리 목록은 SKU 단위로 전 공급사가 섞여 나온다)
  periods: (skuId: string, oemCompanyId?: number) => {
    const baseUrl = getApiBaseUrl()
    const oem = oemCompanyId ? `&oemCompanyId=${oemCompanyId}` : ''
    return `${baseUrl}/admin/oem-costs/periods?skuId=${encodeURIComponent(skuId)}${oem}`
  },

  // 변경 이력 조회 (특정 SKU + OEM 조합)
  // ⚠ 시스템 일괄 적재를 서버에서 거르지 않는다. 화면의 '적용기간' 컬럼이
  //   이력 전량을 훑어 구간을 역산하므로 중간 행이 빠지면 기간이 틀어진다.
  //   표시 필터는 OemCostHistoryModal 에서 한다.
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
