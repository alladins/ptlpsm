import { apiEnvironment } from './api'
import { SHIPMENT_ENDPOINTS } from './api/endpoints/shipment.endpoints'
import type {
  AdditionalChangeRequest,
  AdditionalChangeResponse,
  QuantityChangeHistoryRaw,
  QuantityChangeHistory,
  PreviousReceipt
} from '~/types/shipment-change'

export interface ShipmentOrderStatus {
  deliveryRequestNo: string
  orderId: number
  items: {
    skuId: string
    itemId: string
    itemName: string
    skuName: string
    specification: string
    unit: string
    orderQuantity: number
    totalShippedQuantity: number
    remainingQuantity: number
  }[]
}

export interface ShipmentListItem {
  shipmentId: number
  orderId: number
  deliveryRequestNo: string
  shipmentDate: string
  shipmentQuantity: number
  trackingNumber: string
  status: string                      // 출하 상태 (PENDING, IN_PROGRESS, COMPLETED 등)
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  // 추가 필드 (백엔드 API에서 제공)
  contractId?: string             // 계약번호
  contractDate: string            // 계약일자
  deliveryRequestDate: string     // 납품요구일자
  client: string                  // 수요기관명
  clientNo?: string               // 수요기관 번호
  clientManagerName?: string      // 수요기관 담당자
  projectName: string             // 사업명
  shipmentAmount: number          // 출하금액 (모든 품목의 출하수량 × 단가 합계)
  // 현장소장 정보
  siteManagerId?: number          // 현장소장 ID
  siteManagerName?: string        // 현장소장 이름
  siteManagerPhone?: string       // 현장소장 연락처
  siteManagerCompany?: string     // 현장소장 회사
}

export interface ShipmentDetail {
  shipmentId: number
  orderId: number
  deliveryRequestNo: string
  shipmentDate: string
  trackingNumber: string
  status: string
  items: ShipmentItem[]
}

export interface ShipmentItem {
  shipmentId: number
  orderId: number
  skuId: string
  itemId: string
  shipmentQuantity: number
  lotNumber: string
  productionDate: string
  expiryDate: string
  inspectionResult: string
  inspectionDate: string
  inspector: string
  memo: string
}

export interface ShipmentSearchParams {
  startDate?: string
  endDate?: string
  deliveryRequestNo?: string
  orderId?: number | null
  status?: string
  hasTransport?: boolean
  page: number
  size: number
  sort?: string
}

// 출하 상세 + 발주 정보 통합 인터페이스 (평탄화된 구조)
export interface ShipmentDetailWithOrder {
  // 출하 기본 정보
  shipmentId: number
  orderId: number
  shipmentDate: string
  trackingNumber: string
  status: string

  // 추가변경 판단용 필드
  isBilled: boolean                 // 기성 포함 여부 (true면 추가변경 불가)
  deliveryDoneStatus?: string       // 납품완료계 상태 (참고용: PENDING, IN_PROGRESS, PENDING_SIGNATURE, COMPLETED)

  // 발주 정보 (평탄화)
  contractId: string
  contractDate: string
  deliveryRequestNo: string
  deliveryRequestDate: string
  projectName: string
  client: string
  clientNo: string
  clientManagerName: string
  clientPostalCode?: string
  clientAddress?: string
  clientPhoneNumber?: string
  clientFaxNumber?: string
  naraJangteoNo?: string

  // 출하 품목 목록
  items: ShipmentItemWithOrder[]

  // 메타 정보
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface ShipmentItemWithOrder {
  skuId: string
  itemId: string
  itemName: string             // 품목명
  skuName: string
  specification: string
  unit: string

  // 발주 정보
  orderQuantity: number        // 발주 수량
  unitPrice: number

  // 출하 정보 (서버에서 제공)
  shipmentQuantity: number     // 현재 출하 수량
  amount: number

  // 출하 현황 (서버 계산)
  otherShipmentsQuantity: number    // 다른 출하들의 합계 (기출하)
  totalShippedQuantity: number      // 총 출하 수량
  remainingQuantity: number         // 잔여 수량

  // 메타 정보
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  shipmentDetails?: any
  shipmentId?: number
}

class ShipmentService {
  // MIGRATED: 2025-01-25 - URL을 SHIPMENT_ENDPOINTS로 이전
  // 기존 getBaseUrl() 메서드는 더 이상 사용하지 않습니다.
  // private getBaseUrl() {
  //   const baseUrl = apiEnvironment.getApiBaseUrl()
  //   return `${baseUrl}/admin/shipments`
  // }

  // 발주번호 기준 출하 현황 조회
  async getShipmentStatusByOrder(deliveryRequestNo: string): Promise<ShipmentOrderStatus> {
    const response = await fetch(SHIPMENT_ENDPOINTS.byOrder(deliveryRequestNo))
    if (!response.ok) {
      throw new Error(`출하 현황 조회 실패: ${response.status}`)
    }
    return await response.json()
  }

  // 출하 목록 조회
  async getShipments(params: ShipmentSearchParams): Promise<{
    content: ShipmentListItem[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }> {
    try {
      const queryParams = new URLSearchParams()
      
      // 필수 파라미터 (0-based pagination - useDataTable과 동일)
      queryParams.append('page', params.page.toString())
      queryParams.append('size', params.size.toString())
      
      // 선택적 파라미터 (빈 문자열도 허용)
      if (params.startDate !== undefined) queryParams.append('startDate', params.startDate)
      if (params.endDate !== undefined) queryParams.append('endDate', params.endDate)
      if (params.deliveryRequestNo !== undefined) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
      if (params.orderId !== undefined && params.orderId !== null) queryParams.append('orderId', params.orderId.toString())
      if (params.status !== undefined) queryParams.append('status', params.status)
      if (params.hasTransport !== undefined) queryParams.append('hasTransport', params.hasTransport.toString())
      if (params.sort) queryParams.append('sort', params.sort)

      const url = `${SHIPMENT_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('출하 목록 조회 요청:', {
        url,
        method: 'GET',
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('출하 목록 조회 실패:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`출하 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('출하 목록 조회 응답:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
      
      // 서버 응답이 배열로 오는 경우 페이지네이션 형식으로 변환
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: data.length
        }
      }
      
      // 서버 응답이 페이지네이션 형식인 경우
      return {
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        pageNumber: data.page ?? 0,
        pageSize: data.size ?? 10
      }
    } catch (error) {
      console.error('출하 목록 조회 중 오류:', error)
      throw error
    }
  }

  // 출하 상세 조회 (발주 정보 포함)
  // 기존 API: /admin/shipments/${shipmentId}
  async getShipmentDetail(shipmentId: number): Promise<ShipmentDetailWithOrder> {
    try {
      const url = SHIPMENT_ENDPOINTS.detail(shipmentId)
      console.log('[shipment.service] getShipmentDetail 호출:', {
        shipmentId,
        url,
        method: 'GET'
      })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      console.log('[shipment.service] 응답 상태:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[shipment.service] API 오류 응답:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        })
        throw new Error(`출하 상세 조회 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[shipment.service] 응답 데이터:', data)

      return data
    } catch (error) {
      console.error('[shipment.service] getShipmentDetail 에러:', error)
      console.error('[shipment.service] 에러 스택:', error instanceof Error ? error.stack : 'No stack')
      throw error
    }
  }

  // 출하 등록
  async createShipment(shipment: any): Promise<void> {
    const response = await fetch(SHIPMENT_ENDPOINTS.create(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipment)
    })
    if (!response.ok) {
      throw new Error(`출하 등록 실패: ${response.status}`)
    }
  }

  // 출하 수정
  async updateShipment(shipmentId: number, shipment: any): Promise<void> {
    const response = await fetch(SHIPMENT_ENDPOINTS.update(shipmentId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipment)
    })
    if (!response.ok) {
      throw new Error(`출하 수정 실패: ${response.status}`)
    }
  }

  // 출하 삭제
  async deleteShipment(shipmentId: number): Promise<void> {
    const response = await fetch(SHIPMENT_ENDPOINTS.delete(shipmentId), {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`출하 삭제 실패: ${response.status}`)
    }
  }

  // ========================================
  // 추가변경 관련 메서드
  // ========================================

  /**
   * 추가변경 실행
   * @param request - 추가변경 요청 데이터
   * @returns 추가변경 응답
   */
  async executeAdditionalChange(request: AdditionalChangeRequest): Promise<AdditionalChangeResponse> {
    try {
      const url = SHIPMENT_ENDPOINTS.additionalChange(request.shipmentId)
      console.log('[shipment.service] executeAdditionalChange 호출:', {
        url,
        request
      })

      // 요청 바디 구성 (reuseSignature가 있으면 포함)
      const requestBody: {
        items: typeof request.items
        changeReason: string
        reuseSignature?: boolean
      } = {
        items: request.items,
        changeReason: request.changeReason
      }

      // reuseSignature가 명시적으로 전달된 경우에만 포함
      if (request.reuseSignature !== undefined) {
        requestBody.reuseSignature = request.reuseSignature
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[shipment.service] 추가변경 실패:', {
          status: response.status,
          error: errorText
        })
        return {
          success: false,
          requiresResign: false,
          shipmentStatus: '',
          changedItems: [],
          errorMessage: `추가변경 실패: ${response.status} - ${errorText}`
        }
      }

      const data = await response.json()
      console.log('[shipment.service] 추가변경 응답:', data)
      return data
    } catch (error) {
      console.error('[shipment.service] executeAdditionalChange 에러:', error)
      return {
        success: false,
        requiresResign: false,
        shipmentStatus: '',
        changedItems: [],
        errorMessage: error instanceof Error ? error.message : '추가변경 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 수량 변경 이력 조회
   * @param shipmentId - 출하 ID
   * @returns 수량 변경 이력 목록 (changedAt + changeReason 기준으로 그룹화)
   */
  async getChangeHistory(shipmentId: number): Promise<QuantityChangeHistory[]> {
    try {
      const url = SHIPMENT_ENDPOINTS.getChangeHistory(shipmentId)
      console.log('[shipment.service] getChangeHistory 호출:', { shipmentId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('[shipment.service] 변경 이력 조회 실패:', response.status)
        return []
      }

      const rawData: QuantityChangeHistoryRaw[] = await response.json()
      console.log('[shipment.service] 변경 이력 원본 응답:', rawData)

      if (!Array.isArray(rawData) || rawData.length === 0) {
        return []
      }

      // changedAt + changeReason 기준으로 그룹화
      const groupedMap = new Map<string, QuantityChangeHistory>()

      for (const raw of rawData) {
        const groupKey = `${raw.changedAt}_${raw.changeReason}`

        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            groupKey,
            shipmentId: raw.shipmentId,
            changedAt: raw.changedAt,
            changedBy: raw.changedByName || raw.changedBy,
            changeReason: raw.changeReason,
            items: []
          })
        }

        const group = groupedMap.get(groupKey)!
        group.items.push({
          skuId: raw.skuId,
          itemName: raw.itemName,
          skuName: raw.skuName,
          beforeQuantity: raw.oldQuantity,
          afterQuantity: raw.newQuantity
        })
      }

      // Map을 배열로 변환하고 changedAt 기준 내림차순 정렬
      const result = Array.from(groupedMap.values()).sort((a, b) => {
        return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      })

      console.log('[shipment.service] 변경 이력 그룹화 결과:', result)
      return result
    } catch (error) {
      console.error('[shipment.service] getChangeHistory 에러:', error)
      return []
    }
  }

  /**
   * 이전 인수증 목록 조회 (관리자용)
   * @param shipmentId - 출하 ID
   * @returns 이전 인수증 목록
   */
  async getPreviousReceipts(shipmentId: number): Promise<PreviousReceipt[]> {
    try {
      const url = SHIPMENT_ENDPOINTS.getPreviousReceipts(shipmentId)
      console.log('[shipment.service] getPreviousReceipts 호출:', { shipmentId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('[shipment.service] 이전 인수증 조회 실패:', response.status)
        return []
      }

      const data = await response.json()
      console.log('[shipment.service] 이전 인수증 응답:', data)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('[shipment.service] getPreviousReceipts 에러:', error)
      return []
    }
  }
}

export const shipmentService = new ShipmentService()