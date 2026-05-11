/**
 * 납품확인 관리 API 엔드포인트
 *
 * CREATED DATE: 2025-10-27
 * UPDATED DATE: 2025-11-05 - 권한 주석 추가
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *       OEM생산자 (본인 담당 건만 조회)
 *       현장감독자/시공사대표 (승인/서명)
 *       조회전용 (조회만)
 *
 * API 패턴:
 * - Admin Base: ${baseUrl}/admin/deliveries
 * - Mobile Base: ${baseUrl}/m/delivery
 *
 * Admin APIs:
 * - Create: POST ${adminBase}
 * - List: GET ${adminBase}?params
 * - Detail: GET ${adminBase}/{id}
 *
 * Mobile APIs:
 * - GetByToken: GET ${mobileBase}/{token}
 * - UploadSignature: POST ${mobileBase}/{token}/signature
 * - UploadPhotos: POST ${mobileBase}/{token}/photos
 * - Confirm: POST ${mobileBase}/{token}/confirm
 */

import { getApiBaseUrl } from '../config'

export const DELIVERY_ENDPOINTS = {
  /**
   * 납품 생성 및 토큰 발급 (Admin용)
   * @returns POST /admin/deliveries
   * @example
   * fetch(DELIVERY_ENDPOINTS.create(), {
   *   method: 'POST',
   *   body: JSON.stringify({ transportId: 123 })
   * })
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries`
  },

  /**
   * 납품 목록 조회 (Admin용)
   * @returns Base URL for query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('page', '0')
   * queryParams.append('size', '10')
   * fetch(`${DELIVERY_ENDPOINTS.list()}?${queryParams}`)
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries`
  },

  /**
   * 납품 트리 구조 조회 (Admin용 - 발주 → 출하 → 운송/납품확인)
   * @returns Base URL for query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('page', '0')
   * queryParams.append('size', '10')
   * queryParams.append('startDate', '2024-07-01')
   * fetch(`${DELIVERY_ENDPOINTS.tree()}?${queryParams}`)
   */
  tree: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/tree`
  },

  /**
   * 납품 상세 조회 (Admin용)
   * @param deliveryId - 납품 ID
   * @returns GET /admin/deliveries/{deliveryId}
   */
  detail: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}`
  },

  /**
   * 인수증 PDF 다운로드/미리보기 (Admin용)
   * @param deliveryId - 납품 ID
   * @returns GET /admin/deliveries/{deliveryId}/receipt-pdf
   * @example
   * // PDF가 이미 있으면 기존 PDF 반환, 없으면 자동 생성 후 반환
   * window.open(DELIVERY_ENDPOINTS.receiptPdf(19), '_blank')
   */
  receiptPdf: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/receipt-pdf`
  },

  /**
   * 토큰으로 납품 정보 조회 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns GET /m/delivery/{token}
   */
  getByToken: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}`
  },

  /**
   * 서명 이미지 업로드 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/signature
   */
  uploadSignature: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/signature`
  },

  /**
   * 사진 업로드 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/photos
   */
  uploadPhotos: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/photos`
  },

  /**
   * 납품 완료 처리 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/confirm
   */
  confirm: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/confirm`
  },

  /**
   * 임시 사진 업로드 (Mobile용 - 단일 사진)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/photos/temp
   */
  uploadTempPhoto: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/photos/temp`
  },

  /**
   * 임시 사진 삭제 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @param tempPhotoId - 임시 사진 ID (UUID)
   * @returns DELETE /m/delivery/{token}/photos/temp/{tempPhotoId}
   */
  deleteTempPhoto: (token: string, tempPhotoId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/photos/temp/${tempPhotoId}`
  },

  /**
   * 임시 사진 목록 조회 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns GET /m/delivery/{token}/photos/temp
   */
  getTempPhotos: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/photos/temp`
  },

  /**
   * 임시 사진 미리보기 URL (Mobile용)
   * 페이지 재진입 시 썸네일 복원용 스트리밍 엔드포인트
   * @param token - 접근 토큰 (UUID)
   * @param tempPhotoId - 임시 사진 ID (UUID)
   * @returns GET /m/delivery/{token}/photos/temp/{tempPhotoId}
   */
  getTempPhotoUrl: (token: string, tempPhotoId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/photos/temp/${tempPhotoId}`
  },

  /**
   * 관리자용 납품 진행 상태 조회 (temp 사진 + 서명 상태)
   * @param deliveryId - 납품 ID
   * @returns GET /admin/deliveries/{deliveryId}/temp-status
   */
  adminTempStatus: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/temp-status`
  },

  /**
   * 관리자용 임시 사진 미리보기
   * @param deliveryId - 납품 ID
   * @param tempPhotoId - 임시 사진 ID (UUID)
   * @returns GET /admin/deliveries/{deliveryId}/temp-photo/{tempPhotoId}
   */
  adminTempPhoto: (deliveryId: number, tempPhotoId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/temp-photo/${tempPhotoId}`
  },

  /**
   * 관리자 대리 납품 완료
   * @param deliveryId - 납품 ID
   * @returns POST /admin/deliveries/{deliveryId}/admin-confirm
   */
  adminConfirm: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/admin-confirm`
  },

  /**
   * 관리자 임시 사진 업로드
   * @param deliveryId - 납품 ID
   * @returns POST /admin/deliveries/{deliveryId}/temp-photos
   */
  uploadAdminTempPhoto: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/temp-photos`
  },

  /**
   * 관리자 임시 사진 삭제
   * @param deliveryId - 납품 ID
   * @param tempPhotoId - 임시 사진 ID (UUID)
   * @returns DELETE /admin/deliveries/{deliveryId}/temp-photos/{tempPhotoId}
   */
  deleteAdminTempPhoto: (deliveryId: number, tempPhotoId: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/temp-photos/${tempPhotoId}`
  },

  /**
   * 인수자 서명 요청 SMS 발송
   * @param deliveryId - 납품 ID
   * @returns POST /admin/deliveries/{deliveryId}/request-signature
   */
  requestReceiverSignature: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}/request-signature`
  }
} as const
