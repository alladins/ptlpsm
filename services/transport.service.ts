import { apiEnvironment } from './api'
import { TRANSPORT_ENDPOINTS } from './api/endpoints/transport.endpoints'

// MIGRATED: 2025-01-25 - URL을 TRANSPORT_ENDPOINTS로 이전

export interface TransportListResponse {
  content: TransportDetail[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface TransportSearchParams {
  startDate?: string               // 생성일자 시작 (YYYY-MM-DD)
  endDate?: string                 // 생성일자 종료 (YYYY-MM-DD)
  deliveryRequestNo?: string       // 발주번호
  shipmentId?: number             // 출하 ID (0이면 무시)
  status?: string                 // 상태 (PENDING/IN_PROGRESS/COMPLETED/CANCELLED)
  page: number                    // 페이지 번호 (0부터 시작)
  size: number                    // 페이지 크기
  sort?: string                   // 정렬 (created_at,desc 또는 delivery_date,desc)
}

export interface TransportDetail {
  transportId: number
  shipmentId: number
  orderId: number
  deliveryRequestNo: string
  zipcode: string
  deliveryAddress: string
  addressDetail: string
  siteManagerId?: number | null   // 현장소장 ID
  receiverName: string            // 인수자 성명
  receiverPhone?: string          // 인수자 연락처
  deliveryDate: string
  carrierName: string
  trackingNumber: string
  driverName: string
  driverPhone: string
  vehicleNo: string
  dispatchAt: string
  expectedArrival: string
  completedAt: string | null
  status: string
  deliveryMemo: string
  deliveryId?: number | null  // 납품 ID (완료 시에만 값 존재)
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface TransportCreateRequest {
  shipmentId: number                // 출하 ID (필수)
  vehicleNo: string                 // 차량번호 (필수)
  deliveryDate?: string             // 배송예정일 (YYYY-MM-DD)
  zipcode?: string                  // 우편번호
  deliveryAddress?: string          // 배송지 주소
  addressDetail?: string            // 상세주소
  siteManagerId?: number | null     // 현장소장 ID
  receiverName?: string             // 인수자 성명
  receiverPhone?: string            // 인수자 연락처
  carrierName?: string              // 운송사명
  driverName?: string               // 기사명
  driverPhone?: string              // 기사 연락처
  dispatchAt?: string              // 배차/출차 시각 (YYYY-MM-DDTHH:mm:ss)
  expectedArrival?: string         // 도착 예정 시각 (YYYY-MM-DDTHH:mm:ss)
  deliveryMemo?: string           // 배송 메모
}

export interface TransportUpdateRequest extends TransportCreateRequest {
  transportId: number              // 운송장 ID (필수)
}

class TransportService {
  // MIGRATED: 2025-01-25 - URL을 TRANSPORT_ENDPOINTS로 이전
  // 기존 getBaseUrl() 메서드는 더 이상 사용하지 않습니다.
  // private getBaseUrl() {
  //   const baseUrl = apiEnvironment.getApiBaseUrl()
  //   return `${baseUrl}/admin/transport`
  // }

  // 운송장 목록 조회
  async getTransportList(params: TransportSearchParams): Promise<TransportListResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.deliveryRequestNo) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
      if (params.shipmentId && params.shipmentId > 0) queryParams.append('shipmentId', params.shipmentId.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.sort) queryParams.append('sort', params.sort)
      queryParams.append('page', params.page.toString())
      queryParams.append('size', params.size.toString())

      const response = await fetch(`${TRANSPORT_ENDPOINTS.list()}?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error(`운송장 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()

      // 백엔드에서 비표준 배열을 직접 반환하는 경우에 대한 처리
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1, // 페이지 정보를 알 수 없으므로 기본값 설정
          size: params.size,
          number: params.page
        }
      }

      return data
    } catch (error) {
      console.error('운송장 목록 조회 실패:', error)
      throw error
    }
  }

  // 운송장 상세 조회
  async getTransportDetail(transportId: number): Promise<TransportDetail> {
    try {
      const response = await fetch(TRANSPORT_ENDPOINTS.detail(transportId))
      if (!response.ok) {
        throw new Error(`운송장 상세 조회 실패: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('운송장 상세 조회 실패:', error)
      throw error
    }
  }

  // 출하 ID로 운송장 조회
  async getTransportByShipment(shipmentId: number): Promise<TransportDetail> {
    try {
      const response = await fetch(TRANSPORT_ENDPOINTS.byShipment(shipmentId))
      if (!response.ok) {
        throw new Error(`출하 ID로 운송장 조회 실패: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('출하 ID로 운송장 조회 실패:', error)
      throw error
    }
  }

  // 운송장 등록
  async createTransport(requestData: TransportCreateRequest): Promise<TransportDetail> {
    try {
      console.log('운송장 등록 요청:', requestData)
      const response = await fetch(TRANSPORT_ENDPOINTS.create(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      if (!response.ok) {
        throw new Error(`운송장 등록 실패: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('운송장 등록 실패:', error)
      throw error
    }
  }

  // 운송장 수정
  async updateTransport(transportId: number, requestData: TransportUpdateRequest): Promise<TransportDetail> {
    try {
      console.log('운송장 수정 요청:', requestData)
      const response = await fetch(TRANSPORT_ENDPOINTS.update(transportId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      if (!response.ok) {
        // 에러 응답 파싱 (백엔드 표준 포맷: { timestamp, status, error, message, details })
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.message || `운송장 수정 실패: ${response.status}`) as any
        error.status = response.status
        error.serverMessage = errorData.message
        throw error
      }
      return await response.json()
    } catch (error) {
      console.error('운송장 수정 실패:', error)
      throw error
    }
  }

  // 운송장 삭제
  async deleteTransport(transportId: number): Promise<void> {
    try {
      const response = await fetch(TRANSPORT_ENDPOINTS.delete(transportId), {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`운송장 삭제 실패: ${response.status}`)
      }
    } catch (error) {
      console.error('운송장 삭제 실패:', error)
      throw error
    }
  }
}

export const transportService = new TransportService()