/**
 * 재고 직접 입고 API 서비스 — 발주 없이 재고만 느는 경우
 *
 * ⚠ 신규 서비스이므로 apiClient 를 쓴다 (쿼리 빌드·인증헤더·응답 정규화 자동).
 */

import { apiClient, type PageResponse } from '~/services/api/client'
import type {
  InventoryReceipt,
  InventoryReceiptCreateRequest,
  InventoryReceiptSearchParams,
  ProducerOption
} from '~/types/inventory-receipt'

const BASE = '/admin/inventory/receipts'

export const inventoryReceiptService = {
  /** 생산자 선택지 — 리드파워(본사 보유·이월) + 원가 등록 회사 */
  getProducers (): Promise<ProducerOption[]> {
    return apiClient.get<ProducerOption[]>(`${BASE}/producers`)
  },

  /** 목록 조회 (0-indexed page) */
  getList (params: InventoryReceiptSearchParams): Promise<PageResponse<InventoryReceipt>> {
    return apiClient.get<PageResponse<InventoryReceipt>>(BASE, params as Record<string, unknown>)
  },

  create (data: InventoryReceiptCreateRequest): Promise<InventoryReceipt> {
    return apiClient.post<InventoryReceipt>(BASE, data)
  },

  update (receiptId: number, data: InventoryReceiptCreateRequest): Promise<InventoryReceipt> {
    return apiClient.put<InventoryReceipt>(`${BASE}/${receiptId}`, data)
  },

  /** 확정 — 재고가 늘어난다 */
  confirm (receiptId: number): Promise<InventoryReceipt> {
    return apiClient.post<InventoryReceipt>(`${BASE}/${receiptId}/confirm`, {})
  },

  /** 취소 — 확정된 건이면 늘렸던 재고를 되돌린다. 사유 필수 */
  cancel (receiptId: number, reason: string): Promise<InventoryReceipt> {
    return apiClient.post<InventoryReceipt>(`${BASE}/${receiptId}/cancel`, { reason })
  },

  /** 삭제 — 작성중만 */
  remove (receiptId: number): Promise<void> {
    return apiClient.delete(`${BASE}/${receiptId}`)
  }
}
