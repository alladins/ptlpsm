import { apiEnvironment, getAuthHeaders } from '~/services/api'
import { CONTRACT_ENDPOINTS } from './api/endpoints/contract.endpoints'
import { safeStorage } from '~/utils/storage'

// MIGRATED: 2025-01-25 - URL을 CONTRACT_ENDPOINTS로 이전

/**
 * 계약 정보 인터페이스 (서버 전송용)
 */
export interface ContractInfo {
  contractNumber: string
  contractDate: string
  salesRepresentative?: string | null
  preNotificationNumber?: string | null
  deliveryRequestNumber: string
  requestingAgency: string
  requestingAgencyNumber: string
  requestingAgencyPhoneNumber: string
  requestingAgencyFaxNumber: string
  requestingAgencyPostalCode: string
  requestingAgencyAddress: string
  requestingAgencyContactPerson: string
  phoneNumber?: string | null
  faxNumber?: string | null
  address?: string | null
  naraJangteoNumber: string
  defectWarrantyPeriod?: string
  paymentMethod: string
  deliveryRequestDate: string
  businessName: string
  progressStatus?: string | null
  remark?: string | null
  contractor?: string | null
  representativeName?: string | null
  businessRegistrationNumber?: string | null
  businessRegistrationNumberDemand?: string | null
  businessRegistrationNumberSupplier?: string | null
  itemTotalAmount: string
  commission: string
  totalAmount: string
  quantityTotal: string
  preDiscountAmountTotal: string
  partialDelivery: string
  inspectionAgency: string
  acceptanceAgency: string
  siteManagerId?: number | null      // 현장소장 ID (deprecated)
  builderCompanyId?: number | null   // 건설사 ID
  builderCompany?: string | null     // 건설사명
  oemCompanyId?: number | null       // 제조사 ID
  oemCompany?: string | null         // 제조사명
}

/**
 * 납품 품목 인터페이스 (서버 전송용)
 */
export interface DeliveryItem {
  sequenceNumber: number
  optionItemNumber?: string
  itemClassificationNumber?: string
  itemIdentificationNumber?: string
  name: string
  specification: string
  unit: string
  unitPrice: string
  quantity: string
  totalAmount: string
  deliveryLocation: string
  deliveryDeadline: string
  deliveryTerms: string
  inspectionExemption: string
  midTermCompetitionItem: string
}

/**
 * 계약 등록 요청 데이터
 */
export interface ContractRegisterRequest {
  extractedContractInfo: ContractInfo
  extractedDeliveryItems: DeliveryItem[]
  createdBy: string
  /** 저장된 PDF 파일 경로 (검증용) */
  pdfFilePath?: string | null
  /** 계약 유형 (ORIGINAL/AMENDMENT/ADDITIONAL) — 분할납품요구서 등록 모달 선택값 */
  contractType?: string | null
}

/**
 * API 응답 인터페이스
 */
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  fileName?: string
  fileSize?: number
  processingTime?: number
}

/**
 * 중복 체크 응답 인터페이스
 * 서버 응답: { deliveryRequestNo, duplicate, message, existingOrderId, existingStatus, hasShipments, deliveryCompletionRate }
 */
export interface DuplicateCheckResponse {
  deliveryRequestNo: string
  duplicate: boolean        // 서버 응답 필드명
  isDuplicate?: boolean     // 호환성 유지
  message: string
  existingOrderId?: number | null       // 기존 주문 ID (중복 시)
  existingStatus?: string               // 기존 주문 상태 (중복 시)
  hasShipments?: boolean                // 출하 진행 여부
  deliveryCompletionRate?: number       // 납품 완료율 (0~100)
}

/**
 * 현재 로그인한 사용자 ID 가져오기
 *
 * auth 스토어가 localStorage 'auth_user' 키에 저장한 사용자 객체에서 loginId를 읽는다.
 * 비어있거나 SSR 환경이면 'admin' 반환.
 */
function getCurrentUserId(): string {
  const user = safeStorage.getJSON<{ loginId?: string; userId?: number | string; userName?: string }>('auth_user')
  if (!user) return 'admin'
  return String(user.loginId || user.userId || user.userName || 'admin')
}

/**
 * 계약 관리 서비스
 */
export const contractService = {
  /**
   * 계약 정보 등록
   */
  async registerContract(contractData: ContractRegisterRequest): Promise<ApiResponse> {
    try {
      const url = CONTRACT_ENDPOINTS.register()

      // createdBy가 없으면 현재 사용자로 설정
      if (!contractData.createdBy) {
        contractData.createdBy = getCurrentUserId()
      }

      console.log('📤 계약 등록 요청:', url)
      console.log('📦 전송 데이터:', contractData)

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contractData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('✅ 계약 등록 응답:', result)

      if (result.success === false) {
        throw new Error(result.message || '계약 등록 실패')
      }

      return result
    } catch (error) {
      console.error('❌ 계약 등록 실패:', error)
      throw error
    }
  },

  /**
   * PDF 업로드 및 데이터 추출
   */
  async uploadAndExtractPdf(file: File): Promise<ApiResponse> {
    try {
      const url = CONTRACT_ENDPOINTS.uploadPdf()

      const formData = new FormData()
      formData.append('file', file)

      console.log('📤 PDF 업로드 요청:', url)

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('✅ PDF 추출 응답:', result)

      if (result.success === false) {
        throw new Error(result.message || 'PDF 데이터 추출 실패')
      }

      return result
    } catch (error) {
      console.error('❌ PDF 업로드 실패:', error)
      throw error
    }
  },

  /**
   * 기존 납품요구 재업로드(업데이트)
   * @param orderId - 기존 주문 ID
   * @param contractData - 등록과 동일한 계약 데이터
   */
  async reimportContract(orderId: number, contractData: ContractRegisterRequest): Promise<ApiResponse> {
    try {
      const url = CONTRACT_ENDPOINTS.reimport(orderId)

      // createdBy가 없으면 현재 사용자로 설정
      if (!contractData.createdBy) {
        contractData.createdBy = getCurrentUserId()
      }

      console.log('📤 납품요구 재업로드 요청:', url)
      console.log('📦 전송 데이터:', contractData)

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contractData)
      })

      if (!response.ok) {
        // 400 등 서버 에러의 경우 message 추출
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('✅ 납품요구 재업로드 응답:', result)

      if (result.success === false) {
        throw new Error(result.message || '납품요구 업데이트 실패')
      }

      return result
    } catch (error) {
      console.error('❌ 납품요구 재업로드 실패:', error)
      throw error
    }
  },

  /**
   * 납품요구번호 중복 체크
   * @param deliveryRequestNo - 납품요구번호
   * @returns 중복 여부 및 메시지
   */
  async checkDuplicateDeliveryRequest(deliveryRequestNo: string): Promise<DuplicateCheckResponse> {
    try {
      const url = CONTRACT_ENDPOINTS.checkDuplicate(deliveryRequestNo)

      console.log('📤 중복 체크 요청:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log('✅ 중복 체크 응답:', result)

      return result
    } catch (error) {
      console.error('❌ 중복 체크 실패:', error)
      throw error
    }
  }
}
