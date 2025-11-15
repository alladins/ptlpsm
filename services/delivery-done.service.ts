import { getApiBaseUrl } from './api'
import {
  DeliveryDoneStatus,
  SignatureRole
} from '~/types/delivery-done'
import type {
  DeliveryDone,
  DeliveryDoneListItem,
  DeliveryDoneListResponse,
  DeliveryDoneSearchParams,
  DeliveryDoneMobileInfo,
  SignatureSubmitData,
  SendMessageRequest,
  SendMessageResponse,
  SubmitToNaraRequest,
  SubmitToNaraResponse
} from '~/types/delivery-done'
import { codeService } from './code.service'
import type { StatusCode } from '~/types/common'

/**
 * 납품완료계 서비스
 *
 * API 엔드포인트:
 * - 관리자: /api/admin/delivery-done
 * - 모바일: /api/public/delivery-done
 */

// ==================== 관리자 API ====================

/**
 * 납품완료계 목록 조회 (페이지네이션)
 */
export async function getDeliveryDoneList(
  params: DeliveryDoneSearchParams = {}
): Promise<DeliveryDoneListResponse> {
  try {
    const queryParams = new URLSearchParams()

    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.deliveryRequestNo) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
    if (params.contractNo) queryParams.append('contractNo', params.contractNo)
    if (params.client) queryParams.append('client', params.client)
    if (params.status) queryParams.append('status', params.status)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${getApiBaseUrl()}/admin/delivery-done?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery done list: ${response.statusText}`)
    }

    const data = await response.json()

    // 데이터 변환: builder → contractorCompanyName
    if (data.content && Array.isArray(data.content)) {
      data.content = data.content.map((item: any) => ({
        ...item,
        contractorCompanyName: item.builder || item.contractorCompanyName || '-'
      }))
    }

    return data
  } catch (error) {
    console.error('Error fetching delivery done list:', error)
    throw error
  }
}

/**
 * 납품완료계 상세 조회
 */
export async function getDeliveryDoneDetail(
  deliveryDoneId: number
): Promise<DeliveryDone> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery done detail: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching delivery done detail:', error)
    throw error
  }
}

/**
 * 서명 URL 생성 및 메시지 발송
 */
export async function sendSignatureMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${request.deliveryDoneId}/send-message`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: request.role,
        recipientPhone: request.recipientPhone,
        recipientName: request.recipientName
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send signature message: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending signature message:', error)
    throw error
  }
}

/**
 * 조달청 제출
 */
export async function submitToNara(
  request: SubmitToNaraRequest
): Promise<SubmitToNaraResponse> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${request.deliveryDoneId}/submit`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submitterName: request.submitterName,
        submitterPosition: request.submitterPosition,
        remarks: request.remarks
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to submit to nara: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error submitting to nara:', error)
    throw error
  }
}

/**
 * PDF 다운로드 URL 생성
 */
export function getPdfDownloadUrl(
  deliveryDoneId: number,
  pdfType: 'confirmation' | 'completion' | 'photo-sheet'
): string {
  return `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/pdf/${pdfType}`
}

/**
 * 납품확인서 PDF 다운로드
 */
export async function downloadConfirmationPdf(deliveryDoneId: number): Promise<void> {
  const url = getPdfDownloadUrl(deliveryDoneId, 'confirmation')
  window.open(url, '_blank')
}

/**
 * 납품완료계 PDF 다운로드
 */
export async function downloadCompletionPdf(deliveryDoneId: number): Promise<void> {
  const url = getPdfDownloadUrl(deliveryDoneId, 'completion')
  window.open(url, '_blank')
}

/**
 * 사진대지 PDF 다운로드
 */
export async function downloadPhotoSheetPdf(deliveryDoneId: number): Promise<void> {
  const url = getPdfDownloadUrl(deliveryDoneId, 'photo-sheet')
  window.open(url, '_blank')
}

/**
 * 모든 PDF 일괄 다운로드
 */
export async function downloadAllPdfs(deliveryDoneId: number): Promise<void> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/pdf/all`
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Failed to download all PDFs: ${response.statusText}`)
    }

    // ZIP 파일 다운로드
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `delivery-done-${deliveryDoneId}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading all PDFs:', error)
    throw error
  }
}

// ==================== 모바일 API (토큰 기반) ====================

/**
 * 토큰으로 납품완료계 정보 조회
 */
export async function getDeliveryDoneByToken(
  token: string
): Promise<DeliveryDoneMobileInfo> {
  try {
    const url = `${getApiBaseUrl()}/public/delivery-done/${token}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 410) {
        throw new Error('토큰이 만료되었습니다.')
      } else if (response.status === 404) {
        throw new Error('유효하지 않은 토큰입니다.')
      }
      throw new Error(`Failed to fetch delivery done by token: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching delivery done by token:', error)
    throw error
  }
}

/**
 * 서명 이미지 업로드 및 저장
 */
export async function submitSignature(
  token: string,
  data: SignatureSubmitData
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${getApiBaseUrl()}/public/delivery-done/${token}/signature`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: data.role,
        signatureImage: data.signatureImage
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to submit signature: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error submitting signature:', error)
    throw error
  }
}

/**
 * 서명 이미지를 Blob에서 Base64로 변환
 */
export async function convertSignatureBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ==================== 유틸리티 함수 ====================

// 전역 캐시 (Service 레이어용)
let statusCodesCache: StatusCode[] | null = null

/**
 * 상태 코드 로드 및 캐싱 (DB 기반)
 */
async function loadStatusCodesIfNeeded(): Promise<StatusCode[]> {
  if (statusCodesCache) {
    return statusCodesCache
  }

  try {
    const response = await codeService.getCodeDetails('COMMON_STATUS')
    statusCodesCache = response.map((detail: any) => ({
      code: detail.code,
      codeName: detail.codeName,
      description: detail.description || '',
      cssClass: detail.cssClass || `status-${detail.code.toLowerCase().replace(/_/g, '-')}`,
      badgeClass: detail.badgeClass || 'bg-gray-100 text-gray-800',
      sortOrder: detail.sortOrder || 0
    }))
    return statusCodesCache
  } catch (error) {
    console.error('Failed to load status codes in service layer:', error)
    // Fallback: 빈 배열
    return []
  }
}

/**
 * 상태 텍스트 변환 (DB 기반)
 * Service 레이어에서 사용하는 비동기 함수
 */
export async function getStatusText(status: DeliveryDoneStatus): Promise<string> {
  const codes = await loadStatusCodesIfNeeded()
  const found = codes.find(c => c.code === status)
  return found?.codeName || status
}

/**
 * 상태별 CSS 클래스 반환 (DB 기반)
 * Service 레이어에서 사용하는 비동기 함수
 */
export async function getStatusClass(status: DeliveryDoneStatus): Promise<string> {
  const codes = await loadStatusCodesIfNeeded()
  const found = codes.find(c => c.code === status)
  return found?.cssClass || `status-${status.toLowerCase().replace(/_/g, '-')}`
}

/**
 * 서명 역할 텍스트 변환
 */
export function getRoleText(role: SignatureRole): string {
  const roleMap: Record<SignatureRole, string> = {
    [SignatureRole.CONTRACTOR]: '시공사 대표',
    [SignatureRole.SUPERVISOR]: '현장감리원'
  }
  return roleMap[role] || role
}

/**
 * 납품률 계산
 */
export function calculateDeliveryRate(
  deliveredQuantity: number,
  orderQuantity: number
): number {
  if (orderQuantity === 0) return 0
  return Math.round((deliveredQuantity / orderQuantity) * 100)
}

/**
 * 서명 완료 여부 체크
 */
export function isSignatureComplete(item: DeliveryDoneListItem): boolean {
  return item.hasContractorSignature && item.hasSupervisorSignature
}

/**
 * 메시지 발송 가능 여부 체크
 */
export function canSendMessage(status: DeliveryDoneStatus): boolean {
  return status === DeliveryDoneStatus.PENDING_SIGNATURE
}

/**
 * PDF 다운로드 가능 여부 체크
 */
export function canDownloadPdf(status: DeliveryDoneStatus): boolean {
  return status === DeliveryDoneStatus.COMPLETED || status === DeliveryDoneStatus.SUBMITTED
}

/**
 * 조달청 제출 가능 여부 체크
 */
export function canSubmitToNara(status: DeliveryDoneStatus): boolean {
  return status === DeliveryDoneStatus.COMPLETED
}
