/**
 * 손실/손익 조정 서비스
 *
 * @description 수량부족 손실 및 스펙오납 손익 조정 CRUD·정산·집계
 * @created 2026-09-08
 *
 * 신규 service 정책에 따라 apiClient 를 사용한다.
 * (URLSearchParams 빌드·응답 정규화·타임아웃·인증 헤더 자동 처리)
 *
 * ⚠ 백엔드 PageResponse 의 현재 페이지 필드명은 `page` 다 (Spring 표준 `number` 아님).
 *   그래서 apiClient 의 PageResponse<T> 가 아닌 LossPageResponse<T> 를 쓴다.
 */

import { apiClient } from '~/services/api/client'
import type {
  LossAdjustmentRequest,
  LossAdjustmentResponse,
  LossSearchRequest,
  LossMonthlySummary,
  LossPageResponse,
  SettlementStatus,
  RecoveryType,
  RecoveryStatus
} from '~/types/loss'

const BASE = '/admin/losses'

export const lossService = {
  /**
   * 손실 목록 조회
   * @param params 검색 조건 (page 는 0-indexed)
   */
  async getLossList(params: LossSearchRequest = {}): Promise<LossPageResponse<LossAdjustmentResponse>> {
    return apiClient.get<LossPageResponse<LossAdjustmentResponse>>(BASE, params as Record<string, unknown>)
  },

  /**
   * 월별 손실 집계 (월 × 제조사 × 유형)
   */
  async getMonthlySummary(params: LossSearchRequest = {}): Promise<LossMonthlySummary[]> {
    const data = await apiClient.get<LossMonthlySummary[]>(
      `${BASE}/monthly-summary`,
      params as Record<string, unknown>
    )
    return Array.isArray(data) ? data : []
  },

  /**
   * 손실 상세 조회
   */
  async getLoss(lossId: number): Promise<LossAdjustmentResponse> {
    return apiClient.get<LossAdjustmentResponse>(`${BASE}/${lossId}`)
  },

  /**
   * 손실 등록
   *
   * 수량부족(SHORTAGE)이면 출하 장부가 실인수 수량으로 정정되고
   * 납품률·원가가 재계산된다. 매출과 고객 서류에는 영향이 없다.
   */
  async createLoss(request: LossAdjustmentRequest): Promise<LossAdjustmentResponse> {
    return apiClient.post<LossAdjustmentResponse>(BASE, request)
  },

  /**
   * 손실 수정
   */
  async updateLoss(lossId: number, request: LossAdjustmentRequest): Promise<LossAdjustmentResponse> {
    return apiClient.put<LossAdjustmentResponse>(`${BASE}/${lossId}`, request)
  },

  /**
   * 손실 취소 — 출하 장부 정정을 원복하고 재계산한다.
   */
  async cancelLoss(lossId: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${lossId}`)
  },

  /**
   * 정산 처리 (DEDUCTED: 차감반영 / WAIVED: 면제 / PENDING: 미정산 복귀)
   */
  async settle(
    lossId: number,
    settlementStatus: SettlementStatus,
    settlementYearMonth?: string
  ): Promise<LossAdjustmentResponse> {
    return apiClient.post<LossAdjustmentResponse>(`${BASE}/${lossId}/settle`, {
      settlementStatus,
      settlementYearMonth
    })
  },

  /**
   * 보전(재발송) 연결
   *
   * 보전 발주·출하는 정상 프로세스로 별도 생성한 뒤 이 API 로 연결만 한다.
   * 손실 등록으로 계약 잔여수량이 되살아나므로 보전 출하는 기존 수량 가드를 그대로 통과한다.
   */
  async linkRecovery(
    lossId: number,
    payload: {
      recoveryType: RecoveryType
      recoveryStatus: RecoveryStatus
      recoveryPoId?: number | null
      recoveryShipmentId?: number | null
    }
  ): Promise<LossAdjustmentResponse> {
    return apiClient.post<LossAdjustmentResponse>(`${BASE}/${lossId}/recovery`, payload)
  },

  /**
   * 재고 조정 실행
   * inventory_transactions 에 reference_type='LOSS' 로 기록되어 사유가 역추적된다.
   */
  async adjustInventory(
    lossId: number,
    payload: { warehouseId: number; quantity: number; remarks?: string }
  ): Promise<LossAdjustmentResponse> {
    return apiClient.post<LossAdjustmentResponse>(`${BASE}/${lossId}/inventory-adjust`, payload)
  },

  /**
   * 인수증·확인서 재발행 완료 표시
   */
  async markReceiptReissued(lossId: number): Promise<void> {
    return apiClient.post<void>(`${BASE}/${lossId}/receipt-reissued`)
  },

  /**
   * 출하별 손실 목록
   */
  async getLossesByShipment(shipmentId: number): Promise<LossAdjustmentResponse[]> {
    const data = await apiClient.get<LossAdjustmentResponse[]>(`${BASE}/by-shipment/${shipmentId}`)
    return Array.isArray(data) ? data : []
  },

  /**
   * 납품완료별 손실 목록
   */
  async getLossesByDeliveryDone(deliveryDoneId: number): Promise<LossAdjustmentResponse[]> {
    const data = await apiClient.get<LossAdjustmentResponse[]>(`${BASE}/by-delivery-done/${deliveryDoneId}`)
    return Array.isArray(data) ? data : []
  }
}
