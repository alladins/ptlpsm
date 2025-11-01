import { DELIVERY_ENDPOINTS } from './api/endpoints/delivery.endpoints'

// MIGRATED: 2025-10-27 - URL을 DELIVERY_ENDPOINTS로 이전

/**
 * Delivery 관련 인터페이스
 */

// 서버 업로드 응답 형식
export interface UploadResponse {
  success: boolean
  message: string
  timestamp: string
}

// 서버 API 응답 형식 (flat structure)
export interface DeliveryApiResponse {
  deliveryId: number
  transportId: number
  shipmentId: number
  orderId: number
  status: string
  tokenExpiresAt: string

  // 운송 정보 (flat structure)
  trackingNumber: string
  siteAddress: string
  addressDetail: string
  deliveryDate: string
  siteSupervisorName: string
  receiverName: string
  receiverPhone: string
  driverName: string
  driverPhone: string
  vehicleNo: string

  // 출하 정보 (flat structure)
  shipmentDate: string
  projectName: string
  client: string

  // 발주 정보 (flat structure)
  deliveryRequestNo: string
  contractId: string

  // 품목 목록
  items: Array<{
    skuId: string
    itemId: string
    itemName: string
    itemSpec: string  // specification으로 변환 필요
    unit: string
    shipmentQuantity: number  // quantity로 변환 필요
    unitPrice: number
  }>
}

// 납품 생성 요청
export interface DeliveryCreateRequest {
  transportId: number
  shipmentId: number
  orderId: number
}

// 납품 생성 응답 (메시지 발송용)
export interface DeliveryCreateResponse {
  deliveryId: number
  transportId: number
  accessToken: string
  tokenExpiresAt: string
  mobileUrl: string
}

// 납품 정보 조회 (모바일용)
export interface DeliveryInfo {
  deliveryId: number
  transportId: number
  shipmentId: number
  orderId: number
  status: string
  tokenExpiresAt: string

  // 운송 정보
  transport: {
    trackingNumber: string
    deliveryAddress: string
    addressDetail: string
    deliveryDate: string
    siteSupervisorName: string
    receiverName: string
    receiverPhone: string
    driverName: string
    driverPhone: string
    vehicleNo: string
  }

  // 출하 정보
  shipment: {
    shipmentId: number
    shipmentDate: string
    projectName: string
    client: string
  }

  // 발주 정보
  order: {
    deliveryRequestNo: string
    contractId: string
  }

  // 품목 목록
  items: Array<{
    skuId: string
    itemId: string
    itemName: string
    specification: string
    unit: string
    quantity: number
    unitPrice: number
  }>
}

// 납품 완료 요청
export interface DeliveryConfirmRequest {
  latitude?: number
  longitude?: number
}

// 납품 완료 응답
export interface DeliveryConfirmResponse {
  success: boolean
  message: string
  deliveryId: number
  confirmedAt: string
}

/**
 * 서버 API 응답(flat)을 프론트엔드 형식(nested)으로 변환
 * @param apiResponse 서버로부터 받은 flat structure 응답
 * @returns 프론트엔드에서 사용하는 nested structure
 */
function transformDeliveryResponse(apiResponse: DeliveryApiResponse): DeliveryInfo {
  return {
    deliveryId: apiResponse.deliveryId,
    transportId: apiResponse.transportId,
    shipmentId: apiResponse.shipmentId,
    orderId: apiResponse.orderId,
    status: apiResponse.status,
    tokenExpiresAt: apiResponse.tokenExpiresAt,

    // 운송 정보를 nested object로 변환
    transport: {
      trackingNumber: apiResponse.trackingNumber,
      deliveryAddress: apiResponse.siteAddress,  // siteAddress → deliveryAddress
      addressDetail: apiResponse.addressDetail,
      deliveryDate: apiResponse.deliveryDate,
      siteSupervisorName: apiResponse.siteSupervisorName,
      receiverName: apiResponse.receiverName,
      receiverPhone: apiResponse.receiverPhone,
      driverName: apiResponse.driverName,
      driverPhone: apiResponse.driverPhone,
      vehicleNo: apiResponse.vehicleNo
    },

    // 출하 정보를 nested object로 변환
    shipment: {
      shipmentId: apiResponse.shipmentId,
      shipmentDate: apiResponse.shipmentDate,
      projectName: apiResponse.projectName,
      client: apiResponse.client
    },

    // 발주 정보를 nested object로 변환
    order: {
      deliveryRequestNo: apiResponse.deliveryRequestNo,
      contractId: apiResponse.contractId
    },

    // 품목 목록의 필드명 변환
    items: apiResponse.items.map(item => ({
      skuId: item.skuId,
      itemId: item.itemId,
      itemName: item.itemName,
      specification: item.itemSpec,  // itemSpec → specification
      unit: item.unit,
      quantity: item.shipmentQuantity,  // shipmentQuantity → quantity
      unitPrice: item.unitPrice
    }))
  }
}

/**
 * Delivery Service
 */
class DeliveryService {
  /**
   * 납품 생성 및 메시지 URL 발급
   * @param transportId 운송장 ID
   */
  async createDelivery(transportId: number): Promise<DeliveryCreateResponse> {
    try {
      const response = await fetch(DELIVERY_ENDPOINTS.create(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transportId })
      })

      if (!response.ok) {
        throw new Error(`납품 생성 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('납품 생성 실패:', error)
      throw error
    }
  }

  /**
   * 토큰으로 납품 정보 조회 (모바일용)
   * @param token 접근 토큰
   */
  async getDeliveryByToken(token: string): Promise<DeliveryInfo> {
    try {
      const response = await fetch(DELIVERY_ENDPOINTS.getByToken(token))

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('유효하지 않은 링크입니다.')
        } else if (response.status === 410) {
          throw new Error('만료된 링크입니다.')
        }
        throw new Error(`납품 정보 조회 실패: ${response.status}`)
      }

      // 서버 응답을 DeliveryApiResponse로 파싱
      const apiResponse: DeliveryApiResponse = await response.json()

      // flat structure를 nested structure로 변환하여 반환
      return transformDeliveryResponse(apiResponse)
    } catch (error) {
      console.error('납품 정보 조회 실패:', error)
      throw error
    }
  }

  /**
   * 서명 이미지 업로드 (모바일용)
   * @param token 접근 토큰
   * @param signatureBlob 서명 이미지 Blob
   */
  async uploadSignature(token: string, signatureBlob: Blob): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('signatureImage', signatureBlob, 'signature.png')

      const response = await fetch(DELIVERY_ENDPOINTS.uploadSignature(token), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`서명 업로드 실패: ${response.status}`)
      }

      const result: UploadResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    } catch (error) {
      console.error('서명 업로드 실패:', error)
      throw error
    }
  }

  /**
   * 사진 업로드 (모바일용)
   * @param token 접근 토큰
   * @param photos 사진 파일 배열 (최대 5개)
   */
  async uploadPhotos(token: string, photos: File[]): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      photos.forEach((photo, index) => {
        formData.append('photos', photo, `photo${index + 1}.jpg`)
      })

      const response = await fetch(DELIVERY_ENDPOINTS.uploadPhotos(token), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`사진 업로드 실패: ${response.status}`)
      }

      const result: UploadResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      return result
    } catch (error) {
      console.error('사진 업로드 실패:', error)
      throw error
    }
  }

  /**
   * 납품 완료 처리 (모바일용)
   * @param token 접근 토큰
   * @param data 납품 완료 데이터
   */
  async confirmDelivery(token: string, data: DeliveryConfirmRequest): Promise<DeliveryConfirmResponse> {
    try {
      const response = await fetch(DELIVERY_ENDPOINTS.confirm(token), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`납품 완료 처리 실패: ${response.status}`)
      }

      const result: DeliveryConfirmResponse = await response.json()

      // 서버 응답 검증
      if (!result.success) {
        throw new Error(result.message || '납품 완료 처리에 실패했습니다.')
      }

      // confirmedAt 필드 검증
      if (!result.confirmedAt) {
        console.warn('서버 응답에 confirmedAt이 없습니다. 현재 시각을 사용합니다.')
        result.confirmedAt = new Date().toISOString()
      }

      return result
    } catch (error) {
      console.error('납품 완료 처리 실패:', error)
      throw error
    }
  }

  /**
   * 납품 트리 구조 조회 (관리자용 - 발주 → 출하 → 운송/납품확인)
   */
  async getDeliveryTree(params: {
    startDate?: string
    endDate?: string
    deliveryRequestNo?: string
    status?: string
    page: number
    size: number
    sort?: string
  }): Promise<{
    content: any[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }> {
    try {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.deliveryRequestNo) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
      if (params.status) queryParams.append('status', params.status)
      queryParams.append('sort', params.sort || 'contractDate,desc')
      queryParams.append('page', params.page.toString())
      queryParams.append('size', params.size.toString())

      const response = await fetch(`${DELIVERY_ENDPOINTS.tree()}?${queryParams.toString()}`)

      if (!response.ok) {
        // 인증 오류
        if (response.status === 401) {
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
        }
        // 권한 오류
        if (response.status === 403) {
          throw new Error('접근 권한이 없습니다.')
        }
        // 서버 오류
        if (response.status >= 500) {
          throw new Error('서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error(`납품 트리 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('납품 트리 조회 실패:', error)
      throw error
    }
  }

  /**
   * 납품 목록 조회 (관리자용 - 기존 Flat 구조)
   */
  async getDeliveryList(params: {
    startDate?: string
    endDate?: string
    status?: string
    page: number
    size: number
    sort?: string
  }): Promise<{
    content: any[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }> {
    try {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.status) queryParams.append('status', params.status)
      if (params.sort) queryParams.append('sort', params.sort)
      queryParams.append('page', params.page.toString())
      queryParams.append('size', params.size.toString())

      const response = await fetch(`${DELIVERY_ENDPOINTS.list()}?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`납품 목록 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('납품 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * 납품 상세 조회 (관리자용)
   */
  async getDeliveryDetail(deliveryId: number): Promise<any> {
    try {
      const response = await fetch(DELIVERY_ENDPOINTS.detail(deliveryId))

      if (!response.ok) {
        throw new Error(`납품 상세 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('납품 상세 조회 실패:', error)
      throw error
    }
  }
}

export const deliveryService = new DeliveryService()
