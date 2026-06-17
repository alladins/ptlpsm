import { getAuthHeaders } from './api'
import { SHIPMENT_ENDPOINTS } from './api/endpoints/shipment.endpoints'

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
  shipmentNo: string              // 출하NO (표시용)
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
  // OEM 정보 (운송장 등록 - 출하 조회용)
  oemCompanyId?: number | null       // OEM 제조사 ID
  oemCompanyName?: string | null     // OEM 제조사명
  // 납품완료 정보 (B급 품목 등록용)
  deliveryDoneId?: number | null     // 납품완료계 ID (COMPLETED 상태일 때 존재)
  // B급 품목 여부
  hasBgradeItems?: boolean           // B급 품목 존재 여부
  // 합지(병합) 품목 여부
  hasMergedItems?: boolean           // 합지 품목 존재 여부
  // 출고요청 상태 (REQUESTED/CONFIRMED/DISPATCHED, null=미요청)
  dispatchStatus?: string | null
  // 재고+발주 충족 여부 (true=출고가능, false=재고부족, null=판단불가)
  inventorySufficient?: boolean | null
  // 접수된 발주서 존재 여부 (입고대기 표시용)
  hasAcceptedPo?: boolean | null
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
  projectName?: string
  client?: string
  keyword?: string
  shipmentNo?: string
  orderId?: number | null
  status?: string
  hasTransport?: boolean
  oemCompanyId?: number | null
  undispatchedOnly?: boolean
  dispatchedOnly?: boolean
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

  isBilled: boolean                 // 기성 포함 여부
  deliveryDoneStatus?: string       // 납품완료계 상태 (참고용: PENDING, IN_PROGRESS, PENDING_SIGNATURE, COMPLETED)
  deliveryDoneId?: number | null    // 납품완료계 ID (COMPLETED 상태일 때 존재, B급 조정용)

  // OEM 및 배송지 정보 (2026-01-26 추가)
  oemCompanyId?: number | null      // OEM 제조사 ID
  oemCompanyName?: string | null    // OEM 제조사명
  builderCompanyId?: number | null  // 건설사(시공사) ID
  builderCompanyName?: string | null // 건설사(시공사)명
  siteManagerId?: number | null     // 현장담당자 ID
  siteManagerName?: string | null   // 현장담당자명
  zipcode?: string | null           // 배송지 우편번호
  deliveryAddress?: string | null   // 배송지 주소
  addressDetail?: string | null     // 배송지 상세주소
  receiverName?: string | null      // 인수자명
  receiverPhone?: string | null     // 인수자 연락처

  expectedArrivalAt?: string | null     // 현장 도착 예정일시 (프론트엔드용 별칭)
  expectedArrivalDatetime?: string | null  // 현장 도착 예정일시 (서버 필드명)

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

  // B급 품목 목록 (2026-01-27 추가)
  bgradeItems?: BgradeItemInShipment[]

  // 메타 정보
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

// 출하 상세에 포함된 B급 품목 정보 (백엔드 API 응답 포맷)
export interface BgradeItemInShipment {
  id: number
  deliveryDoneId: number
  shipmentId: number
  skuId: string
  itemName: string
  skuName: string              // SKU명 (두께 포함, 예: "60T")
  specification: string
  thickness: number            // 두께 (숫자, 예: 60)
  quantity: number
  unit: string
  adjustedUnitPrice: number    // B급 조정 단가
  originalUnitPrice: number    // 원래 단가
  amount: number               // 금액 (quantity * adjustedUnitPrice)
  reason: string | null        // B급 사유
  createdBy: string
  createdAt: string
  updatedBy: string | null
  updatedAt: string | null
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
  unitPrice: number            // 계약단가
  costPrice?: number           // 원가 (OEM 계약 단가)

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
  remarks?: string                     // 비고
  isNewItem?: boolean                  // 신규 추가 품목 여부
}

// 형제 출하 배송지 정보 (출고요청 프리필용)
export interface SiblingDeliveryInfo {
  shipmentId: number
  oemCompanyId: number | null
  zipcode: string | null
  deliveryAddress: string | null
  addressDetail: string | null
  siteManagerId: number | null
  receiverName: string | null
  receiverPhone: string | null
  expectedArrivalDatetime: string | null
}

class ShipmentService {
  // MIGRATED: 2025-01-25 - URL을 SHIPMENT_ENDPOINTS로 이전
  // 기존 getBaseUrl() 메서드는 더 이상 사용하지 않습니다.
  // private getBaseUrl() {
  //   const baseUrl = apiEnvironment.getApiBaseUrl()
  //   return `${baseUrl}/admin/shipments`
  // }

  /**
   * 형제 출하 배송지 정보 조회 (출고요청 프리필용)
   * 같은 납품요구의 다른 출하에서 배송지/현장소장 정보 조회
   * @returns 배송지 정보 또는 null (204 No Content)
   */
  async getSiblingDeliveryInfo(shipmentId: number): Promise<SiblingDeliveryInfo | null> {
    const url = SHIPMENT_ENDPOINTS.siblingDeliveryInfo(shipmentId)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json'
      }
    })
    if (response.status === 204) return null
    if (!response.ok) {
      console.warn('형제 출하 배송지 조회 실패:', response.status)
      return null
    }
    return await response.json()
  }

  // 발주번호 기준 출하 현황 조회
  async getShipmentStatusByOrder(deliveryRequestNo: string): Promise<ShipmentOrderStatus> {
    const response = await fetch(SHIPMENT_ENDPOINTS.byOrder(deliveryRequestNo))
    if (!response.ok) {
      throw new Error(`출하 현황 조회 실패: ${response.status}`)
    }
    return await response.json()
  }

  // 출하 목록 조회
  /**
   * 출하 목록 엑셀 다운로드 (검색 조건 연동, 페이징 미적용 전체 행)
   */
  async exportExcel(params: Partial<ShipmentSearchParams> = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params.startDate !== undefined) queryParams.append('startDate', params.startDate)
    if (params.endDate !== undefined) queryParams.append('endDate', params.endDate)
    if (params.deliveryRequestNo !== undefined) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
    if (params.keyword !== undefined) queryParams.append('keyword', params.keyword)
    if (params.orderId !== undefined && params.orderId !== null) queryParams.append('orderId', params.orderId.toString())
    if (params.status !== undefined) queryParams.append('status', params.status)
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${SHIPMENT_ENDPOINTS.exportExcel()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }
    return response.blob()
  }

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
      if (params.projectName !== undefined) queryParams.append('projectName', params.projectName)
      if (params.client !== undefined) queryParams.append('client', params.client)
      if (params.keyword !== undefined) queryParams.append('keyword', params.keyword)
      if (params.shipmentNo !== undefined) queryParams.append('shipmentNo', params.shipmentNo)
      if (params.orderId !== undefined && params.orderId !== null) queryParams.append('orderId', params.orderId.toString())
      if (params.status !== undefined) queryParams.append('status', params.status)
      if (params.hasTransport !== undefined) queryParams.append('hasTransport', params.hasTransport.toString())
      if (params.oemCompanyId !== undefined && params.oemCompanyId !== null) queryParams.append('oemCompanyId', params.oemCompanyId.toString())
      if (params.undispatchedOnly) queryParams.append('undispatchedOnly', 'true')
      if (params.dispatchedOnly) queryParams.append('dispatchedOnly', 'true')
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
          ...getAuthHeaders(),
          'Accept': 'application/json'
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
          ...getAuthHeaders(),
          'Accept': 'application/json'
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(shipment)
    })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.message || errorText || `출하 수정 실패: ${response.status}`)
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(errorText || `출하 수정 실패: ${response.status}`)
        }
        throw e
      }
    }
  }

  // 출하 삭제
  async deleteShipment(shipmentId: number): Promise<void> {
    const response = await fetch(SHIPMENT_ENDPOINTS.delete(shipmentId), {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.message || errorText || `출하 삭제 실패: ${response.status}`)
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(errorText || `출하 삭제 실패: ${response.status}`)
        }
        throw e
      }
    }
  }

  // ========================================
  // 발주서 PDF 관련 메서드 (2026-01-26 추가)
  // ========================================

  /**
   * 발주서 PDF 다운로드 URL 반환
   * PDF가 없으면 자동 생성 후 다운로드
   * @param shipmentId - 출하 ID
   * @returns 다운로드 URL
   */
  getPurchaseOrderPdfUrl(shipmentId: number): string {
    return SHIPMENT_ENDPOINTS.purchaseOrderPdf(shipmentId)
  }

  /**
   * 발주서 PDF 다운로드 (JWT 토큰 포함)
   * @param shipmentId - 출하 ID
   */
  async downloadPurchaseOrderPdf(shipmentId: number): Promise<void> {
    const url = this.getPurchaseOrderPdfUrl(shipmentId)
    console.log('[shipment.service] 발주서 PDF 다운로드:', { shipmentId, url })

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[shipment.service] 발주서 PDF 다운로드 실패:', {
          status: response.status,
          error: errorText
        })
        // 백엔드 에러 메시지 파싱
        let errorMessage = '발주서 PDF 처리에 실패했습니다.'
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch {
          // JSON 파싱 실패 시 텍스트 그대로 사용
          if (errorText) {
            errorMessage = errorText
          }
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `발주서_${shipmentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('[shipment.service] 발주서 PDF 다운로드 오류:', error)
      throw error
    }
  }

  /**
   * 발주서 PDF 생성
   * @param shipmentId - 출하 ID
   * @param requestData - 발주서 생성 데이터
   * @returns 생성 결과
   */
  async generatePurchaseOrder(shipmentId: number, requestData: {
    orderDate: string
    expectedArrivalDatetime: string
    zipcode: string
    deliveryAddress: string
    addressDetail?: string
    siteManagerId: number
    receiverName?: string
    receiverPhone?: string
    oemCompanyId?: number | null  // OEM 제조사 ID
  }): Promise<{
    success: boolean
    message: string
    timestamp?: string
  }> {
    try {
      const url = SHIPMENT_ENDPOINTS.generatePurchaseOrder(shipmentId)
      console.log('[shipment.service] generatePurchaseOrder 호출:', { shipmentId, url, requestData })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[shipment.service] 발주서 생성 실패:', {
          status: response.status,
          error: errorText
        })
        return {
          success: false,
          message: `발주서 생성 실패: ${response.status} - ${errorText}`
        }
      }

      const responseData = await response.json()
      console.log('[shipment.service] 발주서 생성 응답:', responseData)
      return responseData
    } catch (error) {
      console.error('[shipment.service] generatePurchaseOrder 에러:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '발주서 생성 중 오류가 발생했습니다.'
      }
    }
  }
}

export const shipmentService = new ShipmentService()