/**
 * 납품완료계 타입 정의
 *
 * 계층 구조: Order → DeliveryDone (발주별 납품완료계)
 * 승인 프로세스: Contractor Representative (인감) + Site Supervisor (서명)
 */

/**
 * 납품완료계 상태
 */
export enum DeliveryDoneStatus {
  PENDING = 'PENDING',                    // 대기 (발주 생성 시)
  IN_PROGRESS = 'IN_PROGRESS',            // 납품중 (첫 출하 시)
  PENDING_SIGNATURE = 'PENDING_SIGNATURE', // 서명 대기 (모든 납품확인 완료 시)
  COMPLETED = 'COMPLETED',                 // 완료 (서명 완료, 3 PDFs 생성)
  SUBMITTED = 'SUBMITTED'                  // 조달청 제출완료
}

/**
 * 서명 역할
 */
export enum SignatureRole {
  CONTRACTOR = 'CONTRACTOR',     // 시공사 대표 (인감)
  SUPERVISOR = 'SUPERVISOR'      // 현장감리원 (서명)
}

/**
 * 납품완료계 품목
 */
export interface DeliveryDoneItem {
  itemId: number
  sequenceNumber: number
  name: string
  specification: string
  unit: string
  contractQuantity: number
  deliveredQuantity: number
  remainingQuantity: number
  isComplete: boolean
  itemClassificationNumber: string | null
  itemIdentificationNumber: string | null
  unitPrice: number
  totalAmount: number
}

/**
 * 납품완료계 사진
 */
export interface DeliveryDonePhoto {
  photoId: number
  photoNumber: number
  photoUrl: string
  description: string | null
  latitude: number | null
  longitude: number | null
  photographerName: string | null
  photoDate: string
  needsPageBreak?: boolean  // PDF 생성 시 페이지 구분용 (2장마다)
}

/**
 * 출하 정보 (납품완료계용)
 */
export interface ShipmentWithDelivery {
  shipmentId: number
  shipmentDate: string
  shipmentQuantity: number
  shipmentResponsible: string | null
  itemSummary: string | null
  transportId: number | null
  trackingNumber: string | null
  vehicleNo: string | null
  driverName: string | null
  deliveryDate: string | null
  deliveryStatus: string
  hasDeliveryConfirmation: boolean
}

/**
 * 납품완료계 메인 엔티티
 */
export interface DeliveryDone {
  deliveryDoneId: number
  orderId: number
  deliveryRequestNo: string
  deliveryRequestDate: string
  contractNo: string
  contractDate: string
  client: string
  projectName: string
  deliveryLocation: string
  deliveryStartDate: string | null
  deliveryEndDate: string | null

  // 수량 정보
  totalOrderQuantity: number
  totalDeliveredQuantity: number
  totalDeliveryCount: number  // 총 출하 횟수

  // 상태 정보
  status: DeliveryDoneStatus

  // 시공사 정보
  contractorCompanyName: string
  contractorRepresentative: string
  contractorBusinessNo: string | null
  contractorAddress: string | null
  contractorPhone: string | null
  contractorSealImage: string | null
  contractorSignedAt: string | null

  // 현장감리원 정보
  supervisorName: string | null
  supervisorCompany: string | null
  supervisorPhone: string | null
  supervisorSignatureImage: string | null
  supervisorSignedAt: string | null

  // PDF 파일 URL
  confirmationPdfUrl: string | null   // 납품확인서 PDF
  completionPdfUrl: string | null     // 납품완료계 PDF
  photoSheetPdfUrl: string | null     // 사진대지 PDF

  // 메타 정보
  createdAt: string
  updatedAt: string
  submittedAt: string | null

  // 관계 데이터
  items: DeliveryDoneItem[]
  photos: DeliveryDonePhoto[]
  shipments: ShipmentWithDelivery[]
}

/**
 * 납품완료계 리스트 아이템 (간략 정보)
 */
export interface DeliveryDoneListItem {
  deliveryDoneId: number
  orderId: number
  deliveryRequestNo: string
  deliveryRequestDate: string
  contractNo: string
  client: string
  projectName: string
  status: DeliveryDoneStatus
  totalOrderQuantity: number
  totalDeliveredQuantity: number
  deliveryRate: number
  totalDeliveryCount: number
  contractorCompanyName: string
  supervisorName: string | null
  hasContractorSignature: boolean
  hasSupervisorSignature: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 납품완료계 검색 파라미터
 */
export interface DeliveryDoneSearchParams {
  startDate?: string           // 납품요구일자 시작
  endDate?: string             // 납품요구일자 종료
  deliveryRequestNo?: string   // 납품요구번호 (부분 검색)
  contractNo?: string          // 계약번호 (부분 검색)
  client?: string              // 수요기관 (부분 검색)
  status?: DeliveryDoneStatus  // 상태 필터
  page?: number                // 페이지 번호 (0부터 시작)
  size?: number                // 페이지 크기
  sort?: string                // 정렬 (예: 'deliveryRequestDate,desc')
}

/**
 * 납품완료계 리스트 응답 (페이지네이션)
 */
export interface DeliveryDoneListResponse {
  content: DeliveryDoneListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

/**
 * 모바일 서명 페이지용 토큰 정보
 */
export interface DeliveryDoneToken {
  token: string
  deliveryDoneId: number
  role: SignatureRole
  expiresAt: string
  isValid: boolean
}

/**
 * 모바일 서명 페이지용 간략 정보
 */
export interface DeliveryDoneMobileInfo {
  deliveryDoneId: number
  deliveryRequestNo: string
  contractNo: string
  client: string
  projectName: string
  deliveryLocation: string
  role: SignatureRole

  // 현재 서명 상태
  hasContractorSignature: boolean
  hasSupervisorSignature: boolean

  // 역할별 정보
  contractorCompanyName: string
  contractorRepresentative: string
  supervisorName: string | null
  supervisorCompany: string | null

  // 품목 요약
  itemCount: number
  itemSummary: string
  totalOrderQuantity: number
  totalDeliveredQuantity: number
}

/**
 * 서명 제출 데이터
 */
export interface SignatureSubmitData {
  role: SignatureRole
  signatureImage: string  // Base64 encoded image
}

/**
 * 메시지 발송 요청
 */
export interface SendMessageRequest {
  deliveryDoneId: number
  role: SignatureRole
  recipientPhone: string
  recipientName: string
}

/**
 * 메시지 발송 응답
 */
export interface SendMessageResponse {
  success: boolean
  message: string
  tokenUrl: string
  expiresAt: string
}

/**
 * PDF 다운로드 요청
 */
export interface PdfDownloadRequest {
  deliveryDoneId: number
  pdfType: 'confirmation' | 'completion' | 'photo-sheet'
}

/**
 * 조달청 제출 요청
 */
export interface SubmitToNaraRequest {
  deliveryDoneId: number
  submitterName: string
  submitterPosition: string
  remarks?: string
}

/**
 * 조달청 제출 응답
 */
export interface SubmitToNaraResponse {
  success: boolean
  message: string
  submittedAt: string
  receiptNumber?: string
}

/**
 * 상태 변경 히스토리
 */
export interface DeliveryDoneStatusHistory {
  historyId: number
  deliveryDoneId: number
  previousStatus: DeliveryDoneStatus | null
  newStatus: DeliveryDoneStatus
  changedBy: string
  changedAt: string
  remarks: string | null
}
