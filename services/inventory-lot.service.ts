/**
 * 재고 로트(FIFO) API 서비스 — 2026-09-22
 *
 * 관리자·조회전용만 호출할 수 있다 (본사 창고 로트에 여러 제조사 원가가 보이므로 제조사 제외).
 * ⚠ 신규 서비스이므로 apiClient 를 쓴다.
 */

import { apiClient } from '~/services/api/client'
import type { LotAllocation } from '~/types/inventory-lot'

const BASE = '/admin/inventory/lots'

export const inventoryLotService = {
  /** FIFO 차감 미리보기 — 창고이동 입력창에서 어느 로트가 빠지는지 보여준다. 재고는 바뀌지 않는다 */
  preview (warehouseId: number, skuId: string, quantity: number): Promise<LotAllocation> {
    return apiClient.get<LotAllocation>(`${BASE}/preview`, { warehouseId, skuId, quantity })
  },

  /** 출하 한 건의 원가 내역 (SKU → 차감 로트). 운송장 등록(출고) 전이면 빈 객체 */
  getShipmentLots (shipmentId: number): Promise<Record<string, LotAllocation>> {
    return apiClient.get<Record<string, LotAllocation>>(`${BASE}/shipments/${shipmentId}`)
  }
}
