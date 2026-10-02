/**
 * 계약 품목 귀속 서비스 (출하 품목 → 계약 품목·수량)
 *
 * @created 2026-10-02
 * @see docs/PLAN_계약품목귀속_20261002.md «1-b단계»
 *
 * 신규 service 정책에 따라 apiClient 를 사용한다 (인증 헤더·응답 정규화·타임아웃 자동).
 * 실패 시 apiClient 가 ApiError(message = 백엔드 message) 를 던지므로 화면은 e.message 를 그대로 보여주면 된다.
 */

import { apiClient } from '~/services/api/client'
import type {
  ContractAllocStatus,
  ContractAllocSaveRequest
} from '~/types/contract-alloc'

const BASE = '/admin/contract-alloc'

/** 출하 SKU 는 경로 변수라 인코딩한다 (B 접두어·하이픈 등) */
const itemPath = (shipmentId: number, shipSkuId: string) =>
  `${BASE}/shipments/${shipmentId}/items/${encodeURIComponent(shipSkuId)}`

export const contractAllocService = {
  /** 발주 기준 — 계약 외 출하 품목 + 현재 귀속 + 계약 품목 + B급 추천 */
  getByOrder (orderId: number): Promise<ContractAllocStatus> {
    return apiClient.get<ContractAllocStatus>(`${BASE}/orders/${orderId}`)
  },

  /** 출하 1건 기준 — 응답 모양은 발주 기준과 같다 */
  getByShipment (shipmentId: number): Promise<ContractAllocStatus> {
    return apiClient.get<ContractAllocStatus>(`${BASE}/shipments/${shipmentId}`)
  },

  /** 귀속 지정(교체). 검증 실패 시 400 + 안내 메시지 */
  async save (shipmentId: number, shipSkuId: string, body: ContractAllocSaveRequest): Promise<void> {
    await apiClient.put<unknown>(itemPath(shipmentId, shipSkuId), body)
  },

  /** 귀속 해제 */
  async remove (shipmentId: number, shipSkuId: string): Promise<void> {
    await apiClient.delete<void>(itemPath(shipmentId, shipSkuId))
  }
}
