/**
 * 비출하 재고 소진 API 서비스
 *
 * 품질관리원 시험 발송 / 리드파워 계약(삼자단가계약) 납품처럼
 * 재고에서 나가지만 출하로 잡히지 않는 거래를 다룬다.
 *
 * ⚠ 신규 서비스이므로 apiClient 를 쓴다 (쿼리 빌드·인증헤더·응답 정규화 자동).
 */

import { apiClient, type PageResponse } from '~/services/api/client'
import type { LotAllocation } from '~/types/inventory-lot'
import type {
  InventoryConsumption,
  InventoryConsumptionCreateRequest,
  InventoryConsumptionSearchParams
} from '~/types/inventory-consumption'

const BASE = '/admin/inventory/consumptions'

export const inventoryConsumptionService = {
  /** 목록 조회 (0-indexed page) */
  async getList (params: InventoryConsumptionSearchParams): Promise<PageResponse<InventoryConsumption>> {
    return apiClient.get<PageResponse<InventoryConsumption>>(BASE, params as Record<string, unknown>)
  },

  async getDetail (consumptionId: number): Promise<InventoryConsumption> {
    return apiClient.get<InventoryConsumption>(`${BASE}/${consumptionId}`)
  },

  async create (data: InventoryConsumptionCreateRequest): Promise<InventoryConsumption> {
    return apiClient.post<InventoryConsumption>(BASE, data)
  },

  async update (consumptionId: number, data: InventoryConsumptionCreateRequest): Promise<InventoryConsumption> {
    return apiClient.put<InventoryConsumption>(`${BASE}/${consumptionId}`, data)
  },

  /** FIFO 원가 미리보기 — 이 수량을 빼면 어느 발주에서 얼마씩 빠지는지. 저장하지 않는다 */
  fifoPreview (warehouseId: number, skuId: string, quantity: number): Promise<LotAllocation> {
    return apiClient.get<LotAllocation>(`${BASE}/fifo-preview`, { warehouseId, skuId, quantity })
  },

  /** 확정 — 재고가 차감되고 FIFO 원가 내역이 기록된다. 원장 지급 금액에는 영향 없음(«참고» 표시만) */
  async confirm (consumptionId: number): Promise<InventoryConsumption> {
    return apiClient.post<InventoryConsumption>(`${BASE}/${consumptionId}/confirm`, {})
  },

  /** 취소 — 확정된 건이면 재고를 되돌린다 */
  async cancel (consumptionId: number, reason?: string): Promise<InventoryConsumption> {
    return apiClient.post<InventoryConsumption>(`${BASE}/${consumptionId}/cancel`, { reason: reason ?? null })
  },

  /** 삭제 — 확정 전(DRAFT)만 가능 */
  async remove (consumptionId: number): Promise<void> {
    return apiClient.delete(`${BASE}/${consumptionId}`)
  }
}
