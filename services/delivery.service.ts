import { getAuthHeaders } from './api'
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
  siteManagerName: string  // 서버 필드명: siteManagerName
  receiverName: string
  siteManagerPhone: string  // 서버 필드명: siteManagerPhone
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

  // 서명 여부 (재진입 복원용)
  hasSignature?: boolean

  // 품목 목록
  items: Array<{
    skuId: string
    itemId: string
    itemName: string
    itemSpec: string  // specification으로 변환 필요
    unit: string
    shipmentQuantity: number  // quantity로 변환 필요
    unitPrice: number
    remarks: string | null
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
  messageSentAt?: string       // 메시지 발송 시각
  messageAlreadySent?: boolean // 중복 발송 여부 (true: 이미 발송됨)
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
    siteSupervisorPhone: string
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

  // 서명 여부 (재진입 복원용)
  hasSignature?: boolean

  // 품목 목록
  items: Array<{
    skuId: string
    itemId: string
    itemName: string
    specification: string
    unit: string
    quantity: number
    unitPrice: number
    remarks: string | null
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

// 임시 사진 업로드 응답
export interface TempPhotoResponse {
  success: boolean
  tempPhotoId: string
  fileName: string
}

// 임시 사진 항목
export interface TempPhotoItem {
  tempPhotoId: string
  fileName: string
  fileSize: number
}

// 임시 사진 목록 응답
export interface TempPhotoListResponse {
  success: boolean
  photos: TempPhotoItem[]
  count: number
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
    hasSignature: apiResponse.hasSignature,

    // 운송 정보를 nested object로 변환
    transport: {
      trackingNumber: apiResponse.trackingNumber,
      deliveryAddress: apiResponse.siteAddress,  // siteAddress → deliveryAddress
      addressDetail: apiResponse.addressDetail,
      deliveryDate: apiResponse.deliveryDate,
      siteSupervisorName: apiResponse.siteManagerName,  // siteManagerName → siteSupervisorName
      receiverName: apiResponse.receiverName,
      siteSupervisorPhone: apiResponse.siteManagerPhone,  // siteManagerPhone → siteSupervisorPhone
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
      unitPrice: item.unitPrice,
      remarks: item.remarks ?? null
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
        headers: getAuthHeaders(),
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
        // 백엔드 응답 본문에서 에러 메시지 추출
        let errorMessage = ''
        try {
          const errorBody = await response.json()
          if (errorBody.message) errorMessage = errorBody.message
        } catch {
          // JSON 파싱 실패 시 무시
        }

        if (response.status === 403) {
          const err = new Error(errorMessage || '해당 작업은 이미 완료되었습니다.')
          ;(err as any).statusCode = 403
          throw err
        }
        if (response.status === 410) {
          const err = new Error(errorMessage || '서명 링크가 만료되었습니다.')
          ;(err as any).statusCode = 410
          throw err
        }
        if (response.status === 404) {
          const err = new Error(errorMessage || '유효하지 않은 링크입니다.')
          ;(err as any).statusCode = 404
          throw err
        }
        throw new Error(errorMessage || `납품 정보 조회 실패: ${response.status}`)
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
  async uploadSignature(token: string, signatureBlob: Blob, gps?: { latitude?: number; longitude?: number }): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('signatureImage', signatureBlob, 'signature.png')

      // GPS 정보가 있으면 함께 전송 (서명 시 수집)
      if (gps?.latitude !== undefined) {
        formData.append('latitude', gps.latitude.toString())
      }
      if (gps?.longitude !== undefined) {
        formData.append('longitude', gps.longitude.toString())
      }

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
        headers: getAuthHeaders(),
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

      // confirmedAt 필드 검증 (없을 경우 UTC ISO string으로 현재 시각 보정)
      if (!result.confirmedAt) {
        console.warn('서버 응답에 confirmedAt이 없습니다. 현재 UTC 시각을 사용합니다.')
        result.confirmedAt = new Date().toISOString()  // UTC 기준 ISO-8601
      }

      return result
    } catch (error) {
      console.error('납품 완료 처리 실패:', error)
      throw error
    }
  }

  /**
   * 임시 사진 단일 업로드 (모바일용)
   * 촬영 즉시 서버 temp 폴더에 업로드
   * @param token 접근 토큰
   * @param photo 사진 파일
   */
  async uploadTempPhoto(token: string, photo: File): Promise<TempPhotoResponse> {
    const formData = new FormData()
    formData.append('photo', photo, photo.name)

    const response = await fetch(DELIVERY_ENDPOINTS.uploadTempPhoto(token), {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `임시 사진 업로드 실패: ${response.status}`)
    }

    const result: TempPhotoResponse = await response.json()

    if (!result.success) {
      throw new Error('임시 사진 업로드에 실패했습니다.')
    }

    return result
  }

  /**
   * 임시 사진 삭제 (모바일용)
   * UI에서 사진 삭제 시 서버 temp 파일도 함께 삭제
   * @param token 접근 토큰
   * @param tempPhotoId 임시 사진 ID
   */
  async deleteTempPhoto(token: string, tempPhotoId: string): Promise<void> {
    const response = await fetch(DELIVERY_ENDPOINTS.deleteTempPhoto(token, tempPhotoId), {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `임시 사진 삭제 실패: ${response.status}`)
    }
  }

  /**
   * 임시 사진 미리보기 URL 반환 (모바일용)
   * 페이지 재진입 시 썸네일 복원용 — 인증 헤더 불필요 (공개 경로 /api/m/**)
   * @param token 접근 토큰
   * @param tempPhotoId 임시 사진 ID
   */
  getTempPhotoUrl(token: string, tempPhotoId: string): string {
    return DELIVERY_ENDPOINTS.getTempPhotoUrl(token, tempPhotoId)
  }

  /**
   * 임시 사진 목록 조회 (모바일용)
   * 페이지 재진입 시 기존 temp 사진 복원용
   * @param token 접근 토큰
   */
  async getTempPhotos(token: string): Promise<TempPhotoListResponse> {
    const response = await fetch(DELIVERY_ENDPOINTS.getTempPhotos(token))

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `임시 사진 목록 조회 실패: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 납품 트리 구조 조회 (관리자용 - 발주 → 출하 → 운송/납품확인)
   */
  async getDeliveryTree(params: {
    startDate?: string
    endDate?: string
    searchKeyword?: string
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
      if (params.searchKeyword) queryParams.append('searchKeyword', params.searchKeyword)
      if (params.deliveryRequestNo) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
      if (params.status) queryParams.append('status', params.status)
      queryParams.append('sort', params.sort || 'delivery_request_date,desc')
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
   * 납품확인 목록 엑셀 다운로드 (검색 조건 연동, 출하 펼침, 페이징 미적용)
   * - JWT 인증 헤더 필수 → blob 으로 직접 반환 (다운로드 트리거는 호출처에서)
   */
  async exportExcel(params: {
    startDate?: string
    endDate?: string
    searchKeyword?: string
    deliveryRequestNo?: string
    status?: string
    sort?: string
  } = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.searchKeyword) queryParams.append('searchKeyword', params.searchKeyword)
    if (params.deliveryRequestNo) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
    if (params.status) queryParams.append('status', params.status)
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${DELIVERY_ENDPOINTS.treeExport()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }

    return response.blob()
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

  /**
   * 관리자용 납품 진행 상태 조회 (temp 사진 + 서명 상태)
   * @param deliveryId 납품 ID
   */
  async getAdminTempStatus(deliveryId: number): Promise<TempPhotoListResponse> {
    const response = await fetch(DELIVERY_ENDPOINTS.adminTempStatus(deliveryId), {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`납품 진행 상태 조회 실패: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 관리자용 임시 사진 URL 생성
   * @param deliveryId 납품 ID
   * @param tempPhotoId 임시 사진 ID
   */
  getAdminTempPhotoUrl(deliveryId: number, tempPhotoId: string): string {
    return DELIVERY_ENDPOINTS.adminTempPhoto(deliveryId, tempPhotoId)
  }

  /**
   * 관리자 임시 사진 업로드
   * @param deliveryId 납품 ID
   * @param photo 사진 파일 (JPG)
   */
  async uploadAdminTempPhoto(deliveryId: number, photo: File): Promise<TempPhotoResponse> {
    const formData = new FormData()
    formData.append('photo', photo, photo.name)

    // FormData 전송 시 Content-Type 헤더 제거 (브라우저가 boundary 포함한 multipart/form-data 자동 설정)
    const headers = getAuthHeaders()
    delete (headers as Record<string, string>)['Content-Type']

    const response = await fetch(DELIVERY_ENDPOINTS.uploadAdminTempPhoto(deliveryId), {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `관리자 임시 사진 업로드 실패: ${response.status}`)
    }

    const result: TempPhotoResponse = await response.json()

    if (!result.success) {
      throw new Error('관리자 임시 사진 업로드에 실패했습니다.')
    }

    return result
  }

  /**
   * 관리자 임시 사진 삭제
   * @param deliveryId 납품 ID
   * @param tempPhotoId 임시 사진 ID
   */
  async deleteAdminTempPhoto(deliveryId: number, tempPhotoId: string): Promise<void> {
    const response = await fetch(DELIVERY_ENDPOINTS.deleteAdminTempPhoto(deliveryId, tempPhotoId), {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `관리자 임시 사진 삭제 실패: ${response.status}`)
    }
  }

  /**
   * 관리자 대리 납품 완료 처리
   * @param deliveryId 납품 ID
   */
  async adminConfirmDelivery(deliveryId: number): Promise<UploadResponse> {
    const response = await fetch(DELIVERY_ENDPOINTS.adminConfirm(deliveryId), {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `관리자 대리 완료 실패: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 인수자에게 서명 전용 모바일 링크를 SMS로 발송
   * @param deliveryId 납품 ID
   * @returns 발송 결과 (수신자 정보, 모바일 URL, 토큰 만료 일시)
   */
  async requestReceiverSignature(deliveryId: number): Promise<{
    deliveryId: number
    recipientName: string
    recipientPhone: string
    mobileUrl: string
    tokenExpiresAt: string
  }> {
    const response = await fetch(DELIVERY_ENDPOINTS.requestReceiverSignature(deliveryId), {
      method: 'POST',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.message || `서명 요청 발송 실패: ${response.status}`)
    }

    return await response.json()
  }
}

export const deliveryService = new DeliveryService()
