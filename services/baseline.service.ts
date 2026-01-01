/**
 * 기성/납품확인 차수 서비스
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 기성 청구 및 납품완료 처리를 위한 차수(Baseline) 관련 API 호출 서비스
 */

import { BASELINE_ENDPOINTS, BASELINE_MOBILE_ENDPOINTS } from './api/endpoints/baseline.endpoints'
import type {
  Baseline,
  BaselineListItem,
  BaselineListResponse,
  BaselineCreateRequest,
  BaselineCreateRequestV2,
  CurrentQuantitySnapshot,
  QuantityChangeRecord,
  DeliveryConfirmation,
  AvailableShipment,
  BaselineSignatureRecipient,
  BaselineSignatureUrlResponse,
  BaselineSignatureInfo,
  BaselineSignatureSubmitResponse,
  SignatureStatus,
  BaselineCreateAndSendRequest,
  BaselineCreateAndSendResponse
} from '~/types/baseline'

export const baselineService = {
  /**
   * 주문별 차수 목록 조회
   */
  async getBaselinesByOrderId(orderId: number): Promise<BaselineListItem[]> {
    try {
      const url = BASELINE_ENDPOINTS.listByOrder(orderId)
      console.log('차수 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 배열 응답 처리
      if (Array.isArray(result)) {
        return result
      }

      // 페이징 응답 처리
      if (result.content) {
        return result.content
      }

      // data 래핑 처리
      if (result.data) {
        return Array.isArray(result.data) ? result.data : result.data.content || []
      }

      return []
    } catch (error) {
      console.error('차수 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * 차수 상세 조회 (스냅샷 포함)
   */
  async getBaselineById(baselineId: number): Promise<Baseline | null> {
    try {
      const url = BASELINE_ENDPOINTS.detail(baselineId)
      console.log('차수 상세 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('차수 상세 조회 실패:', error)
      return null
    }
  },

  /**
   * 최근 차수 조회
   */
  async getLatestBaseline(orderId: number): Promise<Baseline | null> {
    try {
      const url = BASELINE_ENDPOINTS.latestByOrder(orderId)
      console.log('최근 차수 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 차수가 없는 경우
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('최근 차수 조회 실패:', error)
      return null
    }
  },

  /**
   * 청구 가능 출하 목록 조회
   * @description 납품확인 완료되었으나 아직 기성 청구에 포함되지 않은 출하 목록
   */
  async getAvailableShipments(orderId: number): Promise<AvailableShipment[]> {
    try {
      const url = BASELINE_ENDPOINTS.availableShipments(orderId)
      console.log('청구 가능 출하 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return [] // 청구 가능한 출하가 없는 경우
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 배열 응답 처리
      if (Array.isArray(result)) {
        return result
      }

      // data 래핑 처리
      if (result.data) {
        return Array.isArray(result.data) ? result.data : []
      }

      // content 래핑 처리 (페이징)
      if (result.content) {
        return result.content
      }

      return []
    } catch (error) {
      console.error('청구 가능 출하 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * 기성/납품완료 차수 생성 (기존 방식 - 호환성 유지)
   * @deprecated createBaselineV2 사용 권장
   */
  async createBaseline(orderId: number, data: BaselineCreateRequest): Promise<Baseline> {
    try {
      const url = BASELINE_ENDPOINTS.create()
      const requestData = { ...data, orderId }
      console.log('차수 생성 API 호출:', url, requestData)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('차수 생성 실패:', error)
      throw error
    }
  },

  /**
   * 기성/납품완료 차수 생성 (새 버전 - 출하 선택 방식)
   * @description available-shipments에서 선택한 출하들로 기성 차수 생성
   * @deprecated createAndSendSignature 사용 권장 (기성청구 생성과 서명 URL 발송을 통합)
   */
  async createBaselineV2(data: BaselineCreateRequestV2): Promise<Baseline> {
    try {
      const url = BASELINE_ENDPOINTS.create()
      console.log('차수 생성 API 호출 (V2):', url, data)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('차수 생성 실패:', error)
      throw error
    }
  },

  /**
   * 기성청구 생성 + 서명 URL 발송 통합 API
   * @description 기성 차수 생성과 동시에 현장소장/감리원에게 서명 URL이 포함된 메시지를 발송
   * @param data - 통합 요청 데이터 (주문ID, 출하ID목록, 수신자 정보 등)
   */
  async createAndSendSignature(data: BaselineCreateAndSendRequest): Promise<BaselineCreateAndSendResponse> {
    try {
      const url = BASELINE_ENDPOINTS.createAndSendSignature()
      console.log('기성청구 생성 + 서명 URL 발송 API 호출:', url, data)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('기성청구 생성 + 서명 URL 발송 실패:', error)
      throw error
    }
  },

  /**
   * 현재 수량 스냅샷 조회
   * @description 기성 청구 모달에서 현재 시점의 납품/출하 수량 조회
   */
  async getCurrentQuantities(orderId: number): Promise<CurrentQuantitySnapshot | null> {
    try {
      const url = BASELINE_ENDPOINTS.currentQuantities(orderId)
      console.log('현재 수량 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('현재 수량 조회 실패:', error)
      return null
    }
  },

  /**
   * 수량 변경 이력 조회
   * @description 특정 날짜 이후 발생한 수량 변경 이력 조회
   */
  async getQuantityChanges(orderId: number, baselineId?: number): Promise<{
    historyList: any[]
    itemSummary: any[]
  }> {
    try {
      let url = BASELINE_ENDPOINTS.quantityChanges(orderId)
      if (baselineId) {
        url += `?baselineId=${baselineId}`
      }
      console.log('수량 변경 이력 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const data = result.data || result

      return {
        historyList: data.historyList || data.changes || [],
        itemSummary: data.itemSummary || data.summary || []
      }
    } catch (error) {
      console.error('수량 변경 이력 조회 실패:', error)
      return { historyList: [], itemSummary: [] }
    }
  },

  /**
   * 차수 목록 조회 (검색 파라미터 포함)
   */
  async getBaselines(params: { orderId?: number; page?: number; size?: number } = {}): Promise<BaselineListResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.orderId) queryParams.append('orderId', params.orderId.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.size) queryParams.append('size', params.size.toString())

      const url = `${BASELINE_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('차수 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 페이징 응답 처리
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as BaselineListResponse
      }

      // data 래핑 처리
      if (result.data) {
        return result.data
      }

      // 배열 응답을 페이징 형식으로 변환
      if (Array.isArray(result)) {
        return {
          content: result,
          totalElements: result.length,
          totalPages: 1,
          size: result.length,
          number: 0,
          first: true,
          last: true,
          empty: result.length === 0
        }
      }

      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true
      }
    } catch (error) {
      console.error('차수 목록 조회 실패:', error)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true
      }
    }
  },

  /**
   * 납품확인서 조회
   */
  async getDeliveryConfirmation(baselineId: number): Promise<DeliveryConfirmation | null> {
    try {
      const url = BASELINE_ENDPOINTS.deliveryConfirmation(baselineId)
      console.log('납품확인서 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 납품확인서가 없는 경우
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('납품확인서 조회 실패:', error)
      return null
    }
  },

  // ============ PDF 관련 메서드 ============

  /**
   * 납품확인서 + 사진대지 PDF 일괄 생성
   * @param baselineId - 차수 ID
   * @returns 생성된 PDF 경로 정보
   */
  async generatePdfs(baselineId: number): Promise<{ confirmationPath: string; photoSheetPath: string }> {
    try {
      const url = BASELINE_ENDPOINTS.generatePdfs(baselineId)
      console.log('PDF 일괄 생성 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('PDF 일괄 생성 실패:', error)
      throw error
    }
  },

  /**
   * 납품확인서 PDF URL 반환
   * @param baselineId - 차수 ID
   * @returns PDF 다운로드 URL
   */
  getConfirmationPdfUrl(baselineId: number): string {
    return BASELINE_ENDPOINTS.confirmationPdf(baselineId)
  },

  /**
   * 사진대지 PDF URL 반환
   * @param baselineId - 차수 ID
   * @returns PDF 다운로드 URL
   */
  getPhotoSheetPdfUrl(baselineId: number): string {
    return BASELINE_ENDPOINTS.photoSheetPdf(baselineId)
  },

  /**
   * 전체 PDF ZIP 다운로드 URL 반환
   * @param baselineId - 차수 ID
   * @returns ZIP 다운로드 URL
   */
  getDownloadAllPdfUrl(baselineId: number): string {
    return BASELINE_ENDPOINTS.downloadAllPdf(baselineId)
  },

  // ============ 서명 관련 메서드 ============

  /**
   * 기성청구 서명 URL 발송
   * @description 현장소장/감리원에게 서명 URL이 포함된 메시지를 발송
   * @param baselineId - 기성 차수 ID
   * @param recipients - 수신자 목록 (현장소장, 감리원)
   * @param messageType - 메시지 타입 (LMS/SMS)
   */
  async sendSignatureUrl(
    baselineId: number,
    recipients: BaselineSignatureRecipient[],
    messageType: 'LMS' | 'SMS' = 'LMS'
  ): Promise<BaselineSignatureUrlResponse> {
    try {
      const url = BASELINE_ENDPOINTS.sendSignatureUrl(baselineId)
      console.log('기성청구 서명 URL 발송 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baselineId,
          recipients,
          messageType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('기성청구 서명 URL 발송 실패:', error)
      throw error
    }
  },

  /**
   * 기성청구 서명 상태 조회
   * @param baselineId - 기성 차수 ID
   * @returns 서명 상태 정보 (현장소장/감리원 서명 여부)
   */
  async getSignatureStatus(baselineId: number): Promise<{
    signatureStatus: SignatureStatus
    siteManagerSigned: boolean
    siteManagerSignedAt: string | null
    inspectorSigned: boolean
    inspectorSignedAt: string | null
  } | null> {
    try {
      const url = BASELINE_ENDPOINTS.signatureStatus(baselineId)
      console.log('기성청구 서명 상태 조회 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('기성청구 서명 상태 조회 실패:', error)
      return null
    }
  }
}

// ============ 모바일 기성청구 서명 서비스 ============

export const baselineMobileService = {
  /**
   * 토큰으로 기성청구 서명 정보 조회
   * @description 모바일에서 토큰으로 기성청구 정보 및 서명 대상자 정보 조회
   * @param token - 서명 토큰
   * @param recipientTypeFromQuery - URL query에서 전달받은 recipientType (optional)
   */
  async getByToken(token: string, recipientTypeFromQuery?: string): Promise<BaselineSignatureInfo | null> {
    try {
      const url = BASELINE_MOBILE_ENDPOINTS.getByToken(token)
      console.log('기성청구 서명 정보 조회 (토큰):', url, 'recipientTypeFromQuery:', recipientTypeFromQuery)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 토큰이 유효하지 않거나 만료됨
        }
        if (response.status === 410) {
          throw new Error('서명 링크가 만료되었습니다.')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const data = result.data || result

      // 백엔드 응답 로깅 (디버깅용)
      console.log('기성청구 서명 정보 원본 응답:', JSON.stringify(data, null, 2))

      // 품목 요약 생성 (items 배열이 있는 경우)
      let itemSummary = data.itemSummary ?? data.item_summary
      if (!itemSummary && data.items && Array.isArray(data.items) && data.items.length > 0) {
        const firstItem = data.items[0]
        if (data.items.length === 1) {
          itemSummary = firstItem.itemName || '품목 1건'
        } else {
          itemSummary = `${firstItem.itemName} 외 ${data.items.length - 1}건`
        }
      }

      // 서명 완료 여부 체크 (managerSignaturePath 또는 inspectorSignaturePath 존재 여부)
      const hasManagerSignature = data.hasManagerSignature ?? !!data.managerSignaturePath
      const hasInspectorSignature = data.hasInspectorSignature ?? !!data.inspectorSignaturePath

      // 현재 사용자가 어떤 역할인지 판단
      // 우선순위: URL query > 백엔드 응답 > 서명 상태로 추론
      let recipientType = recipientTypeFromQuery || data.recipientType || data.recipient_type
      if (!recipientType) {
        // 아직 서명하지 않은 역할을 추론 (백엔드에서 recipientType을 제공하지 않는 경우)
        if (!hasManagerSignature) {
          recipientType = 'SITE_MANAGER'
        } else if (!hasInspectorSignature) {
          recipientType = 'SITE_INSPECTOR'
        }
      }
      console.log('recipientType 결정:', recipientType, '(query:', recipientTypeFromQuery, ', data:', data.recipientType, ')')

      // 백엔드 필드명 → 프론트엔드 필드명 매핑
      const mapped: BaselineSignatureInfo = {
        baselineId: data.baselineId ?? data.baseline_id ?? 0,
        baselineSeq: data.baselineSeq ?? data.baseline_seq ?? data.seq ?? 1,
        deliveryRequestNo: data.deliveryRequestNo ?? data.delivery_request_no ?? '',
        // 수요기관: client 필드 사용 (null이면 빈 문자열)
        demandOrganization: data.demandOrganization ?? data.client ?? data.clientName ?? '',
        projectName: data.projectName ?? data.project_name ?? data.siteName ?? data.site_name ?? '',
        // 시공사: builderName 또는 constructorName (백엔드에서 제공 안하면 빈 문자열)
        constructorName: data.constructorName ?? data.builderCompanyName ?? data.builderName ?? '',
        // 청구금액: totalAmount 사용
        requestAmount: data.requestAmount ?? data.totalAmount ?? data.total_amount ?? 0,
        // 수신자 타입: 추론된 값 사용
        recipientType: recipientType ?? 'SITE_MANAGER',
        // 수신자 이름: 백엔드에서 제공 안하면 빈 문자열
        recipientName: data.recipientName ?? data.recipient_name ?? data.signerName ?? '',
        // 이미 서명 완료 여부: tokenUsedAt이 있으면 이미 사용된 토큰
        alreadySigned: data.alreadySigned ?? (recipientType === 'SITE_MANAGER' ? hasManagerSignature : hasInspectorSignature),
        // 다른 서명자 완료 여부
        otherSignerCompleted: data.otherSignerCompleted ?? (recipientType === 'SITE_MANAGER' ? hasInspectorSignature : hasManagerSignature),
        // 품목 요약
        itemSummary: itemSummary,
        // 토큰 만료일: tokenExpiresAt 사용
        expiresAt: data.expiresAt ?? data.tokenExpiresAt ?? data.expires_at ?? ''
      }

      console.log('기성청구 서명 정보 매핑 후:', JSON.stringify(mapped, null, 2))

      return mapped
    } catch (error) {
      console.error('기성청구 서명 정보 조회 실패:', error)
      throw error
    }
  },

  /**
   * 서명 이미지 업로드
   * @description 모바일에서 캔버스로 작성한 서명 이미지를 업로드
   * @param token - 서명 토큰
   * @param signatureBlob - 서명 이미지 Blob
   * @param recipientType - 서명자 유형 (SITE_MANAGER | SITE_INSPECTOR)
   */
  async uploadSignature(token: string, signatureBlob: Blob, recipientType: string = 'SITE_MANAGER'): Promise<BaselineSignatureSubmitResponse> {
    try {
      const url = BASELINE_MOBILE_ENDPOINTS.uploadSignature(token)
      console.log('기성청구 서명 이미지 업로드:', url, 'recipientType:', recipientType)

      const formData = new FormData()
      formData.append('signatureImage', signatureBlob, 'signature.png')
      formData.append('recipientType', recipientType)

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 410) {
          throw new Error('서명 링크가 만료되었습니다.')
        }
        if (response.status === 409) {
          throw new Error('이미 서명이 완료되었습니다.')
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('기성청구 서명 이미지 업로드 실패:', error)
      throw error
    }
  }
}

/**
 * 차수 표시명 생성 유틸리티
 * @param baselineType - 차수 유형 (PROGRESS/FINAL)
 * @param baselineSeq - 차수 순번
 * @returns 표시명 (예: "기성 1차", "납품완료")
 */
export function getBaselineDisplayName(baselineType: string, baselineSeq: number): string {
  if (baselineType === 'FINAL') {
    return '납품완료'
  }
  return `기성 ${baselineSeq}차`
}
