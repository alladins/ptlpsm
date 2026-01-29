import { apiEnvironment, getAuthHeaders } from '~/services/api'
import { CONTRACT_ENDPOINTS } from './api/endpoints/contract.endpoints'

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
 * 서버 응답: { deliveryRequestNo, duplicate, message }
 */
export interface DuplicateCheckResponse {
  deliveryRequestNo: string
  duplicate: boolean      // 서버 응답 필드명
  isDuplicate?: boolean   // 호환성 유지
  message: string
}

/**
 * 현재 로그인한 사용자 ID 가져오기
 */
function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'admin'

  try {
    // localStorage에서 사용자 정보 확인
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return user.loginId || user.userid || user.userName || 'admin'
    }

    // localStorage에서 loginId 직접 확인
    const loginId = localStorage.getItem('loginId')
    if (loginId) return loginId

    // sessionStorage 확인
    const sessionUser = sessionStorage.getItem('userInfo')
    if (sessionUser) {
      const user = JSON.parse(sessionUser)
      return user.loginId || user.userid || user.userName || 'admin'
    }
  } catch (error) {
    console.warn('사용자 정보 가져오기 실패:', error)
  }

  // 기본값
  return 'admin'
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
