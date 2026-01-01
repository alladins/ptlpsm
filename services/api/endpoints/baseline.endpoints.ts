/**
 * 기성/납품확인 차수 API 엔드포인트
 *
 * CREATED DATE: 2025-12-09
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - List by Order: GET /admin/baselines/order/{orderId}
 * - Available Shipments: GET /admin/baselines/order/{orderId}/available-shipments
 * - Create: POST /admin/baselines
 * - Detail: GET /admin/baselines/{id}
 * - Delivery Confirmation: GET /admin/baselines/{id}/delivery-confirmation
 * - Current Quantities: GET /admin/orders/{orderId}/current-quantities
 * - Quantity Changes: GET /admin/orders/{orderId}/quantity-changes
 */

import { getApiBaseUrl } from '../config'

export const BASELINE_ENDPOINTS = {
  /**
   * 차수 목록 조회 (검색 파라미터 포함)
   * @returns GET /admin/baselines
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines`
  },

  /**
   * 주문별 차수 목록 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/baselines/order/{orderId}
   */
  listByOrder: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/order/${orderId}`
  },

  /**
   * 청구 가능 출하 목록 조회
   * @description 납품확인 완료되었으나 아직 기성 청구에 포함되지 않은 출하 목록
   * @param orderId - 주문 ID
   * @returns GET /admin/baselines/order/{orderId}/available-shipments
   */
  availableShipments: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/order/${orderId}/available-shipments`
  },

  /**
   * 기성/납품완료 차수 생성
   * @returns POST /admin/baselines
   * @deprecated createAndSendSignature 사용 권장
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines`
  },

  /**
   * 기성청구 생성 + 서명 URL 발송 통합 API
   * @description 기성 차수 생성과 서명 URL 발송을 한 번의 API 호출로 처리
   * @returns POST /admin/baselines/create-and-send-signature
   */
  createAndSendSignature: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/create-and-send-signature`
  },

  /**
   * 차수 상세 조회 (스냅샷 포함)
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}
   */
  detail: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}`
  },

  /**
   * 납품확인서 조회
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}/delivery-confirmation
   */
  deliveryConfirmation: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/delivery-confirmation`
  },

  /**
   * 현재 수량 스냅샷 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/current-quantities
   */
  currentQuantities: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/current-quantities`
  },

  /**
   * 수량 변경 이력 조회 (이전 차수 이후)
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/quantity-changes?since={date}
   */
  quantityChanges: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/quantity-changes`
  },

  /**
   * 최근 차수 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/baselines/latest
   */
  latestByOrder: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/baselines/latest`
  },

  // ============ PDF 관련 엔드포인트 ============

  /**
   * 납품확인서 + 사진대지 PDF 일괄 생성
   * @param baselineId - 차수 ID
   * @returns POST /admin/baselines/{baselineId}/generate-pdfs
   */
  generatePdfs: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/generate-pdfs`
  },

  /**
   * 납품확인서 PDF 다운로드
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}/pdf/confirmation
   */
  confirmationPdf: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/pdf/confirmation`
  },

  /**
   * 사진대지 PDF 다운로드
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}/pdf/photo-sheet
   */
  photoSheetPdf: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/pdf/photo-sheet`
  },

  /**
   * 전체 PDF ZIP 다운로드
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}/pdf/download-all
   */
  downloadAllPdf: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/pdf/download-all`
  },

  // ============ 서명 관련 엔드포인트 ============

  /**
   * 기성청구 서명 URL 발송
   * @param baselineId - 차수 ID
   * @returns POST /admin/baselines/{baselineId}/send-signature-url
   */
  sendSignatureUrl: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/send-signature-url`
  },

  /**
   * 기성청구 서명 상태 조회
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}/signature-status
   */
  signatureStatus: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/signature-status`
  }
} as const

// ============ 모바일 기성청구 서명 엔드포인트 ============

export const BASELINE_MOBILE_ENDPOINTS = {
  /**
   * 토큰으로 기성청구 서명 정보 조회
   * @param token - 서명 토큰
   * @returns GET /m/baseline/{token}
   */
  getByToken: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/baseline/${token}`
  },

  /**
   * 서명 이미지 업로드
   * @param token - 서명 토큰
   * @returns POST /m/baseline/{token}/signature
   */
  uploadSignature: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/baseline/${token}/signature`
  }
} as const
