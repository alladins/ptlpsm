/**
 * 비출하 재고 소진 API 서비스
 *
 * 품질관리원 시험 발송 / 리드파워 계약(삼자단가계약) 납품처럼
 * 재고에서 나가지만 출하로 잡히지 않는 거래를 다룬다.
 *
 * ⚠ 신규 서비스이므로 apiClient 를 쓴다 (쿼리 빌드·인증헤더·응답 정규화 자동).
 */

import { apiClient, type PageResponse } from '~/services/api/client'
import { getApiBaseUrl } from '~/services/api/config'
import { getAuthHeaders } from '~/services/api'
import { getLocalDateString } from '~/utils/format'
import type { LotAllocation } from '~/types/inventory-lot'
import type {
  InventoryConsumption,
  InventoryConsumptionCreateRequest,
  InventoryConsumptionSearchParams
} from '~/types/inventory-consumption'

const BASE = '/admin/inventory/consumptions'

/**
 * 응답 헤더의 파일명을 꺼낸다.
 * 서버가 한글 파일명을 RFC 5987(`filename*=UTF-8''...`)로 보내므로 그쪽을 먼저 본다.
 * 못 읽으면 호출한 쪽에서 기본 이름을 쓴다.
 */
function fileNameFrom (res: Response): string | null {
  const cd = res.headers.get('content-disposition')
  if (!cd) { return null }
  const star = cd.match(/filename\*=UTF-8''([^;]+)/i)
  if (star) { try { return decodeURIComponent(star[1]) } catch { /* 깨진 인코딩은 무시 */ } }
  const plain = cd.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1] : null
}

export const inventoryConsumptionService = {
  /** 목록 조회 (0-indexed page) */
  async getList (params: InventoryConsumptionSearchParams): Promise<PageResponse<InventoryConsumption>> {
    return apiClient.get<PageResponse<InventoryConsumption>>(BASE, params as Record<string, unknown>)
  },

  async getDetail (consumptionId: number): Promise<InventoryConsumption> {
    return apiClient.get<InventoryConsumption>(`${BASE}/${consumptionId}`)
  },

  /**
   * 내역서 PDF 를 «받아만» 온다 — 저장은 하지 않는다.
   *
   * 화면에서 먼저 미리보기로 확인한 뒤 내려받게 하기 위해 blob 만 돌려준다.
   * 바로 저장해 버리면 내용이 틀렸을 때 파일만 쌓인다.
   *
   * 쪽 나눔(page/size)은 보내지 않는다 — 서버가 조회된 전체를 한 벌로 만든다.
   * apiClient 는 JSON 전제라 여기서는 fetch 를 직접 쓴다.
   */
  async fetchPdf (params: InventoryConsumptionSearchParams): Promise<{ blob: Blob, fileName: string }> {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (k === 'page' || k === 'size') { return }
      if (v !== null && v !== undefined && v !== '') { qs.append(k, String(v)) }
    })

    const res = await fetch(`${getApiBaseUrl()}${BASE}/pdf?${qs.toString()}`, { headers: getAuthHeaders() })
    if (!res.ok) {
      // 서버가 «조회된 내역이 없습니다» 처럼 이유를 주므로 그대로 보여준다
      let message = 'PDF 를 만들지 못했습니다.'
      try {
        const body = await res.json()
        if (body?.message) { message = body.message }
      } catch { /* 본문이 JSON 이 아니면 기본 문구 */ }
      throw new Error(message)
    }

    const blob = await res.blob()
    // ★ 서버가 application/pdf 로 줘도, 중간 프록시나 브라우저 설정 때문에 형식이 어긋난 채
    //   저장되는 일이 있었다. 저장 단계에서 형식을 확실히 못 박기 위해 여기서 다시 감싼다.
    const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' })
    const fileName = fileNameFrom(res) || `재고소진내역서_${getLocalDateString().replace(/-/g, '')}.pdf`
    return { blob: pdfBlob, fileName }
  },

  async create (data: InventoryConsumptionCreateRequest): Promise<InventoryConsumption> {
    return apiClient.post<InventoryConsumption>(BASE, data)
  },

  async update (consumptionId: number, data: InventoryConsumptionCreateRequest): Promise<InventoryConsumption> {
    return apiClient.put<InventoryConsumption>(`${BASE}/${consumptionId}`, data)
  },

  /**
   * FIFO 원가 미리보기 — 이 수량을 빼면 어느 발주에서 얼마씩 빠지는지. 저장하지 않는다.
   *
   * ⚠ consumptionDate 를 꼭 같이 보낼 것. 확정도 «소진일 그 날 시점» 재고로 계산하므로,
   *   안 보내면 화면에 보인 원가와 확정 결과가 달라진다(과거 날짜 소진일 때).
   */
  fifoPreview (warehouseId: number, skuId: string, quantity: number, consumptionDate?: string): Promise<LotAllocation> {
    return apiClient.get<LotAllocation>(`${BASE}/fifo-preview`, { warehouseId, skuId, quantity, consumptionDate })
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
