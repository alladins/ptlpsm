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
  itemName: string
  specification: string
  unit: string
  orderedQuantity: number
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
  isSelectedForPdf?: boolean  // 사진대지 포함 여부
  pdfDisplayOrder?: number | null  // 사진대지 표시 순서
}

/**
 * 출하 정보 (납품완료계용)
 */
export interface ShipmentWithDelivery {
  shipmentId: number
  shipmentDate: string
  shipmentNo: string | null
  completedAt: string | null
  status: string  // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  totalItemCount: number
  totalQuantity: number

  // Legacy 필드 (호환성 유지 - optional)
  shipmentQuantity?: number
  shipmentResponsible?: string | null
  itemSummary?: string | null
  transportId?: number | null
  trackingNumber?: string | null
  vehicleNo?: string | null
  driverName?: string | null
  deliveryDate?: string | null
  deliveryStatus?: string
  hasDeliveryConfirmation?: boolean
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
  totalOrderedQuantity: number
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

  // PDF 파일 경로
  confirmationDocumentPath: string | null   // 납품확인서 PDF 경로
  completionReportPath: string | null       // 납품완료계 PDF 경로
  photoCollectionPath: string | null        // 사진대지 PDF 경로

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
  totalOrderedQuantity: number
  totalDeliveredQuantity: number
  deliveryCompletionRate: number
  totalDeliveryCount: number
  builder?: string                     // 백엔드 응답 필드 (optional, 호환성)
  contractorCompanyName: string        // 프론트엔드 표준 필드
  siteSupervisorName: string | null    // 시공사 현장소장 이름
  siteSupervisorPhone: string | null   // 시공사 현장소장 전화번호
  supervisorName: string | null        // 현장감리원 이름
  supervisorPhone: string | null       // 현장감리원 전화번호
  hasManagerSignature: boolean         // ✅ 시공사 현장소장 서명 여부
  hasInspectorSignature: boolean       // ✅ 현장감리원 서명 여부
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
 * 모바일 서명 페이지용 간소화 타입 (UI 필수 데이터만)
 */
export interface DeliveryDoneMobileInfo {
  // 발주 정보
  deliveryRequestNo: string
  contractNo: string
  client: string
  projectName: string
  deliveryLocation: string

  // 서명 현황
  recipientType: RecipientType
  builder: string
  representativeName: string
  hasContractorSignature: boolean
  supervisorName: string | null
  supervisorCompany: string | null
  hasSupervisorSignature: boolean

  // 요약 정보
  totalItemCount: number
  totalOrderedQuantity: number
  totalDeliveredQuantity: number

  // 품목 리스트
  items: DeliveryDoneItem[]
}

/**
 * 모바일용 간소화된 출하 정보
 */
export interface MobileShipmentInfo {
  shipmentId: number
  shipmentDate: string
  completedAt: string | null
  status: string  // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  totalItemCount: number
  totalQuantity: number
}

/**
 * 서명 제출 데이터 (Deprecated - FormData 방식으로 변경)
 * @deprecated Use submitSignature(token, blob, recipientType) instead
 */
export interface SignatureSubmitData {
  recipientType: RecipientType
  signatureImage: string  // Base64 encoded image (더 이상 사용 안 함)
}

/**
 * 수신자 타입 (서명 URL 발송용)
 */
export type RecipientType = 'SITE_MANAGER' | 'SITE_INSPECTOR'

/**
 * 문서 타입 (서명 URL 발송용)
 */
export type DocumentType = 'CONFIRMATION' | 'COMPLETION' | 'PHOTO_SHEET'

/**
 * 서명 URL 수신자 정보
 */
export interface SignatureRecipient {
  recipientType: RecipientType
  recipientUserId: number          // 수신자 사용자 ID (DB 저장용)
  recipientName: string
  recipientPhone: string
}

/**
 * 서명 URL 발송 요청 (다중 수신자 지원)
 */
export interface SendSignatureUrlRequest {
  deliveryDoneId: number
  documentType: DocumentType
  recipients: SignatureRecipient[]
  messageType: 'LMS' | 'SMS'
}

/**
 * 메시지 발송 요청 (Legacy - 단일 수신자)
 * @deprecated Use SendSignatureUrlRequest instead
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
  tokenUrl?: string
  expiresAt?: string
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

/**
 * 납품 사진 정보 (delivery_done_photos 테이블)
 */
export interface DeliveryPhotoInfo {
  photoId: number
  deliveryDoneId: number
  deliveryId: number
  deliveryDate: string | null
  deliveryRequestNo: string | null
  seq: number
  filePath: string
  thumbnailPath: string | null
  originalFilename: string | null
  fileSize: number | null
  capturedAt: string | null
  photoDescription: string | null
  latitude: number | null
  longitude: number | null
  isSelectedForPdf: boolean
  pdfDisplayOrder: number | null
}

/**
 * 사진 선택 업데이트 요청
 */
export interface UpdatePhotoSelectionRequest {
  deliveryId: number
  photoIds: number[]  // 최대 2개
}

/**
 * 사진 선택 업데이트 응답
 */
export interface UpdatePhotoSelectionResponse {
  success: boolean
  message: string
  updatedCount: number
}
