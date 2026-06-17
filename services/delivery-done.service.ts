import { getApiBaseUrl, getAuthHeaders } from './api'
import { codeService } from './code.service'
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
  SendMessageRequest,
  SendMessageResponse,
  SendSignatureUrlRequest,
  RecipientType,
  SubmitToNaraRequest,
  SubmitToNaraResponse
} from '~/types/delivery-done'
import type { StatusCode } from '~/types/common'

/**
 * 납품완료계 서비스
 *
 * API 엔드포인트:
 * - 관리자: /api/admin/delivery-done
 * - 모바일: /api/m/delivery-done
 */

// ==================== 관리자 API ====================

/**
 * 납품완료계 목록 조회 (페이지네이션)
 */
export async function getDeliveryDoneList (
  params: DeliveryDoneSearchParams = {}
): Promise<DeliveryDoneListResponse> {
  try {
    const queryParams = new URLSearchParams()

    if (params.startDate) { queryParams.append('startDate', params.startDate) }
    if (params.endDate) { queryParams.append('endDate', params.endDate) }
    if (params.searchKeyword) { queryParams.append('searchKeyword', params.searchKeyword) }
    if (params.deliveryRequestNo) { queryParams.append('deliveryRequestNo', params.deliveryRequestNo) }
    if (params.contractNo) { queryParams.append('contractNo', params.contractNo) }
    if (params.client) { queryParams.append('client', params.client) }
    if (params.status) { queryParams.append('status', params.status) }
    if (params.page !== undefined) { queryParams.append('page', params.page.toString()) }
    if (params.size !== undefined) { queryParams.append('size', params.size.toString()) }
    if (params.sort) { queryParams.append('sort', params.sort) }

    const url = `${getApiBaseUrl()}/admin/delivery-done?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery done list: ${response.statusText}`)
    }

    const data = await response.json()

    // 데이터 변환: 서버 응답을 프론트엔드 타입으로 매핑
    if (data.content && Array.isArray(data.content)) {
      data.content = data.content.map((item: any) => ({
        ...item,
        contractorCompanyName: item.builderCompanyName || item.contractorCompanyName || '-',
        siteSupervisorName: item.siteSupervisorName || null,
        siteSupervisorPhone: item.siteSupervisorPhone || null,
        supervisorName: item.supervisorName || null,
        supervisorPhone: item.supervisorPhone || null,
        // 백엔드 필드명 매핑 (hasContractorSignature → hasManagerSignature)
        hasManagerSignature: item.hasContractorSignature ?? item.hasManagerSignature ?? false,
        hasInspectorSignature: item.hasSupervisorSignature ?? item.hasInspectorSignature ?? false
      }))
    }

    return data
  } catch (error) {
    console.error('Error fetching delivery done list:', error)
    throw error
  }
}

/**
 * 납품완료 목록 엑셀 다운로드 (검색 조건 연동, 페이징 미적용 전체 행)
 * - JWT 인증 헤더 필수 → blob 으로 직접 반환 (다운로드 트리거는 호출처에서)
 */
export async function exportDeliveryDoneExcel (
  params: DeliveryDoneSearchParams = {}
): Promise<Blob> {
  const queryParams = new URLSearchParams()
  if (params.startDate) { queryParams.append('startDate', params.startDate) }
  if (params.endDate) { queryParams.append('endDate', params.endDate) }
  if (params.searchKeyword) { queryParams.append('searchKeyword', params.searchKeyword) }
  if (params.deliveryRequestNo) { queryParams.append('deliveryRequestNo', params.deliveryRequestNo) }
  if (params.contractNo) { queryParams.append('contractNo', params.contractNo) }
  if (params.client) { queryParams.append('client', params.client) }
  if (params.status) { queryParams.append('status', params.status) }
  if (params.sort) { queryParams.append('sort', params.sort) }

  const url = `${getApiBaseUrl()}/admin/delivery-done/export?${queryParams.toString()}`
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
 * 납품완료계 상세 조회
 */
export async function getDeliveryDoneDetail (
  deliveryDoneId: number
): Promise<DeliveryDone> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
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
 * 납품완료 문서 HTML 미리보기를 fetch하여 Blob URL 반환
 * 인증 헤더가 필요하므로 iframe에 직접 URL을 사용할 수 없어 fetch+blob 패턴 사용
 */
export async function fetchHtmlPreview (
  deliveryDoneId: number,
  docType: 'confirmation' | 'completion' | 'photo-sheet'
): Promise<string> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/html/${docType}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`HTML 미리보기 로드 실패: ${response.statusText}`)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * 주문 ID로 납품완료계 상태 조회
 * 기성청구 버튼 활성화/비활성화 판단용
 */
export async function getDeliveryDoneByOrderId (
  orderId: number
): Promise<DeliveryDone | null> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/by-order/${orderId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // 납품완료계가 없는 경우
      }
      throw new Error(`Failed to fetch delivery done by orderId: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching delivery done by orderId:', error)
    return null
  }
}

/**
 * 서명 URL 생성 및 메시지 발송 (다중 수신자 지원)
 */
export async function sendSignatureUrl (
  request: SendSignatureUrlRequest
): Promise<SendMessageResponse> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${request.deliveryDoneId}/send-signature-url`
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        documentType: request.documentType,
        recipients: request.recipients,
        messageType: request.messageType
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to send signature URL: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending signature URL:', error)
    throw error
  }
}

/**
 * 서명 URL 생성 및 메시지 발송 (Legacy - 단일 수신자)
 * @deprecated Use sendSignatureUrl instead
 */
export async function sendSignatureMessage (
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  // Legacy 요청을 새 포맷으로 변환
  const recipientType: RecipientType = request.role === SignatureRole.CONTRACTOR ? 'SITE_MANAGER' : 'SITE_INSPECTOR'

  return sendSignatureUrl({
    deliveryDoneId: request.deliveryDoneId,
    documentType: 'CONFIRMATION',
    recipients: [{
      recipientType,
      recipientUserId: 0, // Legacy: 사용자 ID 없음 (호환성 유지)
      recipientName: request.recipientName,
      recipientPhone: request.recipientPhone
    }],
    messageType: 'LMS'
  })
}

/**
 * 조달청 제출
 */
export async function submitToNara (
  request: SubmitToNaraRequest
): Promise<SubmitToNaraResponse> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${request.deliveryDoneId}/submit`
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
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
export function getPdfDownloadUrl (
  deliveryDoneId: number,
  pdfType: 'confirmation' | 'completion' | 'photo-sheet'
): string {
  return `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/pdf/${pdfType}`
}

/**
 * 납품확인서 PDF 다운로드
 */
export async function downloadConfirmationPdf (deliveryDoneId: number): Promise<void> {
  const url = getPdfDownloadUrl(deliveryDoneId, 'confirmation')
  window.open(url, '_blank')
}

/**
 * 납품완료계 PDF 다운로드
 */
export async function downloadCompletionPdf (deliveryDoneId: number): Promise<void> {
  const url = getPdfDownloadUrl(deliveryDoneId, 'completion')
  window.open(url, '_blank')
}

/**
 * 사진대지 PDF 다운로드
 */
export async function downloadPhotoSheetPdf (deliveryDoneId: number): Promise<void> {
  const url = getPdfDownloadUrl(deliveryDoneId, 'photo-sheet')
  window.open(url, '_blank')
}

/**
 * 기성청구내역서 엑셀 다운로드 URL 생성
 */
export function getBaselineInvoiceExcelUrl (orderId: number): string {
  return `${getApiBaseUrl()}/admin/delivery-done/order/${orderId}/excel/baseline-invoice`
}

/**
 * 기성청구내역서 엑셀 다운로드
 * - 인증 토큰이 필요한 API이므로 fetch + blob 방식 사용
 */
export async function downloadBaselineInvoiceExcel (orderId: number): Promise<void> {
  const url = getBaselineInvoiceExcelUrl(orderId)

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    // 에러 응답에서 메시지 추출
    try {
      const errorData = await response.json()
      throw new Error(errorData.message || `엑셀 다운로드 실패: ${response.status}`)
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 메시지
      if (parseError instanceof Error && parseError.message !== `엑셀 다운로드 실패: ${response.status}`) {
        throw parseError
      }
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }
  }

  // Blob으로 다운로드 처리
  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = '기성청구내역서.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

/**
 * 모든 PDF 일괄 다운로드
 */
export async function downloadAllPdfs (deliveryDoneId: number): Promise<void> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/pdf/download-all`
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
export async function getDeliveryDoneByToken (
  token: string,
  recipientType?: string
): Promise<DeliveryDoneMobileInfo> {
  try {
    let url = `${getApiBaseUrl()}/m/delivery-done/${token}`
    if (recipientType) {
      url += `?type=${recipientType}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      // 백엔드 응답 본문에서 한국어 에러 메시지 추출
      let errorMessage = '서명 정보를 불러올 수 없습니다.'
      try {
        const errorBody = await response.json()
        if (errorBody.message) {
          errorMessage = errorBody.message
        }
      } catch {
        // JSON 파싱 실패 시 상태 코드별 기본 메시지
        if (response.status === 410) {
          errorMessage = '서명 링크가 만료되었습니다. 관리자에게 새 링크를 요청해주세요.'
        } else if (response.status === 404) {
          errorMessage = '유효하지 않은 서명 링크입니다. 관리자에게 문의해주세요.'
        }
      }
      const err = new Error(errorMessage)
      ;(err as any).statusCode = response.status
      throw err
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching delivery done by token:', error)
    throw error
  }
}

/**
 * 서명 이미지 업로드 및 저장 (FormData 방식)
 */
export async function submitSignature (
  token: string,
  signatureBlob: Blob,
  recipientType: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${getApiBaseUrl()}/m/delivery-done/${token}/signature`

    // FormData 생성 (운송장 서명과 동일한 방식)
    const formData = new FormData()
    formData.append('signatureImage', signatureBlob, 'signature.png')
    formData.append('recipientType', recipientType)

    const response = await fetch(url, {
      method: 'POST',
      body: formData // Content-Type은 브라우저가 자동으로 multipart/form-data로 설정
    })

    if (!response.ok) {
      let errorMessage = '서명 제출에 실패했습니다.'
      try {
        const errorBody = await response.json()
        if (errorBody.message) {
          errorMessage = errorBody.message
        }
      } catch {
        // JSON 파싱 실패 시 기본 메시지 유지
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error('Error submitting signature:', error)
    throw error
  }
}

/**
 * 서명 이미지를 Blob에서 Base64로 변환
 * @deprecated No longer needed - submitSignature now accepts Blob directly
 */
export async function convertSignatureBlobToBase64 (blob: Blob): Promise<string> {
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
async function loadStatusCodesIfNeeded (): Promise<StatusCode[]> {
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
export async function getStatusText (status: DeliveryDoneStatus): Promise<string> {
  const codes = await loadStatusCodesIfNeeded()
  const found = codes.find(c => c.code === status)
  return found?.codeName || status
}

/**
 * 상태별 CSS 클래스 반환 (DB 기반)
 * Service 레이어에서 사용하는 비동기 함수
 */
export async function getStatusClass (status: DeliveryDoneStatus): Promise<string> {
  const codes = await loadStatusCodesIfNeeded()
  const found = codes.find(c => c.code === status)
  return found?.cssClass || `status-${status.toLowerCase().replace(/_/g, '-')}`
}

/**
 * 서명 역할 텍스트 변환
 */
export function getRoleText (role: SignatureRole): string {
  const roleMap: Record<SignatureRole, string> = {
    [SignatureRole.CONTRACTOR]: '현장소장',
    [SignatureRole.SUPERVISOR]: '현장감리원'
  }
  return roleMap[role] || role
}

/**
 * 납품률 계산
 */
export function calculateDeliveryRate (
  deliveredQuantity: number,
  orderQuantity: number
): number {
  if (orderQuantity === 0) { return 0 }
  return Math.round((deliveredQuantity / orderQuantity) * 100)
}

/**
 * 서명 완료 여부 체크
 */
export function isSignatureComplete (item: DeliveryDoneListItem): boolean {
  return item.hasManagerSignature && item.hasInspectorSignature
}

/**
 * 메시지 발송 가능 여부 체크
 */
export function canSendMessage (status: DeliveryDoneStatus): boolean {
  return status === DeliveryDoneStatus.PENDING_SIGNATURE
}

/**
 * PDF 다운로드 가능 여부 체크
 */
export function canDownloadPdf (status: DeliveryDoneStatus): boolean {
  return status === DeliveryDoneStatus.COMPLETED || status === DeliveryDoneStatus.SUBMITTED
}

/**
 * 조달청 제출 가능 여부 체크
 */
export function canSubmitToNara (status: DeliveryDoneStatus): boolean {
  return status === DeliveryDoneStatus.COMPLETED
}

// ==================== 환산잔량 처리 API ====================

/**
 * 환산잔량 후보 품목 조회
 */
export async function getConversionRemainderCandidates (
  deliveryDoneId: number
): Promise<import('~/types/delivery-done').ConversionRemainderCandidate[]> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/conversion-remainder`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(`환산잔량 후보 조회 실패: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * 환산잔량 처리
 */
export async function processConversionRemainder (
  deliveryDoneId: number,
  data: import('~/types/delivery-done').ConversionRemainderRequest
): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/conversion-remainder`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `환산잔량 처리 실패: ${response.statusText}`)
  }
}

// ==================== 사진 선택 관리 API ====================

/**
 * 납품완료계 사진 목록 조회 (선택 정보 포함)
 */
export async function getDeliveryDonePhotos (
  deliveryDoneId: number
): Promise<import('~/types/delivery-done').DeliveryPhotoInfo[]> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/photos`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch delivery done photos: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching delivery done photos:', error)
    throw error
  }
}

/**
 * 수량 변경 이력 조회 (변경계약/추가계약 반영 이력, 최신순)
 */
export async function getQuantityHistory (
  deliveryDoneId: number
): Promise<import('~/types/delivery-done').DeliveryDoneItemHistory[]> {
  try {
    const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/quantity-history`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quantity history: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching quantity history:', error)
    throw error
  }
}

/**
 * 사진 선택 업데이트 (출하별 최대 2장)
 */
export async function updatePhotoSelection (
  request: import('~/types/delivery-done').UpdatePhotoSelectionRequest
): Promise<import('~/types/delivery-done').UpdatePhotoSelectionResponse> {
  try {
    // 검증: 최대 2장까지만
    if (request.photoIds.length > 2) {
      throw new Error('최대 2장까지만 선택 가능합니다.')
    }

    const url = `${getApiBaseUrl()}/admin/deliveries/${request.deliveryId}/photos/selection`
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        photoIds: request.photoIds
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update photo selection: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating photo selection:', error)
    throw error
  }
}

// ==================== 수동 완료 / 초기화 / 스캔본 API ====================

/**
 * 수동 완료 처리
 * - 디지털 서명 없이 PDF 3종 생성 + 상태 COMPLETED 전환
 * - 권한: SYSTEM_ADMIN, LEADPOWER_MANAGER
 */
export async function completeManually (deliveryDoneId: number): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/complete-manually`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `수동 완료 처리 실패: ${response.statusText}`)
  }
}

/**
 * 전체 초기화 (서명·PDF·스캔본·수동완료 플래그 모두 초기화)
 * - 권한: SYSTEM_ADMIN 전용
 * - 디스크 파일은 _backup 폴더로 이동
 */
export async function resetDeliveryDone (deliveryDoneId: number): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/reset`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `초기화 실패: ${response.statusText}`)
  }
}

/**
 * PDF 재발행 (서명·상태 보존, PDF 3종만 새 데이터로 재생성)
 * - 권한: SYSTEM_ADMIN 전용
 * - 기존 PDF 디스크 파일은 _backup 폴더로 이동
 * - 본사 정보·품목 등 현재 DB 값으로 새 PDF 생성, 서명/스캔본/상태/수동완료 플래그 모두 보존
 */
export async function regenerateDeliveryDonePdfs (deliveryDoneId: number): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/regenerate-pdfs`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `PDF 재발행 실패: ${response.statusText}`)
  }
}

/**
 * 출하 기준 재계산 (납품수량·납품률)
 * - 권한: SYSTEM_ADMIN 전용
 * - 출하 재배정/추가수량 정정 등으로 출하-발주 매핑을 직접 바꾼 뒤, 실제 출하(COMPLETED 납품확인) 기준으로
 *   품목별 납품수량·잔여·완료플래그와 헤더 납품률을 다시 맞춤. 금액·날짜는 변경하지 않음.
 */
export async function recalculateDeliveryDone (deliveryDoneId: number): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/recalculate`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `재계산 실패: ${response.statusText}`)
  }
}

/**
 * 스캔본 PDF 업로드 (수동완료 후 종이 서명본 보관용)
 * @param deliveryDoneId 최종납품확인 ID
 * @param docType 'confirmation' | 'completion'
 * @param file PDF 파일 (최대 20MB)
 */
export async function uploadScanPdf (
  deliveryDoneId: number,
  docType: 'confirmation' | 'completion',
  file: File
): Promise<void> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/scan-pdf/${docType}`

  const formData = new FormData()
  formData.append('file', file)

  // multipart/form-data 사용 — Content-Type 은 브라우저가 boundary와 함께 자동 설정해야 함
  // getAuthHeaders() 에 포함되는 Content-Type 은 제외하고 인증 헤더만 전달
  const authHeaders = getAuthHeaders() as Record<string, string>
  const headers: Record<string, string> = {}
  for (const key of Object.keys(authHeaders)) {
    if (key.toLowerCase() !== 'content-type') {
      headers[key] = authHeaders[key]
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `스캔본 업로드 실패: ${response.statusText}`)
  }
}

// ==================== 사진 교체 / 추가 API ====================

/**
 * multipart 전송용 인증 헤더 (Content-Type 제외 — 브라우저가 boundary 자동 설정)
 */
function multipartHeaders (): Record<string, string> {
  const authHeaders = getAuthHeaders() as Record<string, string>
  const headers: Record<string, string> = {}
  for (const key of Object.keys(authHeaders)) {
    if (key.toLowerCase() !== 'content-type') {
      headers[key] = authHeaders[key]
    }
  }
  return headers
}

/**
 * 납품완료 사진 교체 (임시사진 → 실제 현장사진)
 * - 기존 파일은 백업되고 사진대지 PDF 가 자동 재생성됨. 사진대지 선택 상태는 보존.
 */
export async function replaceDeliveryDonePhoto (
  deliveryDoneId: number,
  photoId: number,
  file: File
): Promise<import('~/types/delivery-done').PhotoReplaceResponse> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/photos/${photoId}/replace`
  const formData = new FormData()
  formData.append('photo', file)

  const response = await fetch(url, {
    method: 'POST',
    headers: multipartHeaders(),
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `사진 교체 실패: ${response.statusText}`)
  }
  return await response.json()
}

/**
 * 납품완료 사진 추가 (특정 출하에 현장사진 추가)
 * - 추가 사진은 미선택 상태. 사진대지 포함은 '사진 선택' 기능으로 별도 지정.
 */
export async function addDeliveryDonePhoto (
  deliveryDoneId: number,
  deliveryId: number,
  file: File
): Promise<import('~/types/delivery-done').PhotoReplaceResponse> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/photos`
  const formData = new FormData()
  formData.append('deliveryId', String(deliveryId))
  formData.append('photo', file)

  const response = await fetch(url, {
    method: 'POST',
    headers: multipartHeaders(),
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `사진 추가 실패: ${response.statusText}`)
  }
  return await response.json()
}

/**
 * 납품완료 사진대지 포함 선택 변경 (출하별 최대 2장) + 사진대지 PDF 자동 재생성
 */
export async function updateDeliveryDonePhotoSelection (
  deliveryDoneId: number,
  deliveryId: number,
  photoIds: number[]
): Promise<import('~/types/delivery-done').PhotoReplaceResponse> {
  const url = `${getApiBaseUrl()}/admin/delivery-done/${deliveryDoneId}/photos/selection?deliveryId=${deliveryId}`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ photoIds })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `사진대지 선택 변경 실패: ${response.statusText}`)
  }
  return await response.json()
}
