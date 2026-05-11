/**
 * 계약 유형 상수
 */
export const CONTRACT_TYPE = {
  ORIGINAL: 'ORIGINAL',      // 본계약 (00)
  AMENDMENT: 'AMENDMENT',    // 변경계약 (기존 수량 대체)
  ADDITIONAL: 'ADDITIONAL'   // 추가계약 (기존 수량에 합산, 별도계약 포함)
} as const

export type ContractType = typeof CONTRACT_TYPE[keyof typeof CONTRACT_TYPE]

/**
 * 계약 유형 한글 표시명
 */
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  ORIGINAL: '본계약',
  AMENDMENT: '변경계약',
  ADDITIONAL: '추가계약'
}

/**
 * 주문 상태 상수
 */
export const ORDER_STATUS = {
  PENDING: 'PENDING',                    // 대기 (출하 생성 전)
  IN_PROGRESS: 'IN_PROGRESS',            // 진행중 (출하 생성됨)
  PENDING_SIGNATURE: 'PENDING_SIGNATURE', // 서명대기 (모든 출하 인수증 완료)
  COMPLETED: 'COMPLETED'                 // 완료 (납품완료계 완료)
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

/**
 * 주문 상태 한글 표시명
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: '대기',
  [ORDER_STATUS.IN_PROGRESS]: '진행중',
  [ORDER_STATUS.PENDING_SIGNATURE]: '서명대기',
  [ORDER_STATUS.COMPLETED]: '완료'
}

/**
 * 서버 PDF 업로드 응답에 포함될 계약 유형 체크 결과
 */
export interface ContractTypeCheckResult {
  /** 본계약 여부 (접미사 00이면 true) */
  isOriginalContract: boolean
  /** 기존 본계약 납품요구번호 (예: R25TB01181972-00) */
  existingContractNo?: string
  /** 신규 계약 납품요구번호 (예: R25TB01181972-01) */
  newContractNo: string
  /** PDF에서 자동 감지된 계약 유형 (ORIGINAL, AMENDMENT, SEPARATE) */
  detectedContractType?: string
}

export interface OrderResponse {
  orderId: number
  salesId: number
  contractId: string
  contractDate: string
  client: string
  clientManagerName: string
  projectName: string
  /** ★ 정책: 모든 매출·계약총액·집계 기준은 itemTotalAmount(품대계).
   *   orders.total_amount와 orders.commission은 PDF 원본 보존용으로만 저장되며
   *   UI·통계·PDF(납품확인서/완료계) 합계 계산에 사용하지 않는다. */
  itemTotalAmount: string
  /** 수수료 (참고 표기 전용) */
  commission: string
  /** PDF 원본 합계금액 (레거시, 집계·표시에 사용하지 않음) */
  totalAmount: string
  deliveryRequestNo: string
  deliveryRequestDate: string
  /** 분할순번 (00=기준, 01~=분할) */
  splitSeq?: string
  /** 계약유형 (ORIGINAL/AMENDMENT/SEPARATE) */
  contractType?: ContractType
  /** 기준 주문 ID (변경/별도 계약인 경우) */
  baseOrderId?: number
  /** 주문 상태 (PENDING/IN_PROGRESS/PENDING_SIGNATURE/COMPLETED) */
  status?: OrderStatus
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface OrderSearchRequest {
  startDate?: string
  endDate?: string
  contractId?: string
  client?: string
  projectName?: string  // 사업명 (프로젝트명) — 발주 선택 모달 검색용
  salesId?: number
  page?: number
  size?: number
  sort?: string
}

export interface OrderDetailResponse extends OrderResponse {
  preNotificationNo?: string
  clientNo?: string
  clientPostalCode?: string
  clientAddress?: string
  clientPhoneNumber?: string
  clientFaxNumber?: string
  naraJangteoNo?: string
  warrantyPeriod?: string
  paymentMethod?: string
  partialDelivery?: string
  inspectionAgency?: string
  acceptanceAgency?: string
  siteManagerId?: number
  builderCompanyId?: number       // 건설사 ID
  builderCompanyName?: string     // 건설사명
  oemCompanyId?: number           // 제조사 ID
  oemCompanyName?: string         // 제조사명
  pdfFile?: string
  /** 주문 상태 (PENDING/IN_PROGRESS/PENDING_SIGNATURE/COMPLETED) */
  status?: OrderStatus
  items: OrderDetailItem[]
}

export interface OrderDetailItem {
  itemId: string           // 문자열로 변경
  itemCd: string
  itemNm: string
  itemName?: string       // 호환성을 위해 추가
  productName?: string    // 서버에서 실제 사용하는 품목명 필드
  skuId: string          // 문자열로 변경
  skuNm: string
  skuName?: string       // 호환성을 위해 추가
  specification: string
  unitCd: string
  unit?: string          // 서버에서 실제 사용하는 단위 필드
  quantity: number
  unitPrice: string
  amount?: string
  deliveryLocation?: string
  deliveryDeadline?: string
  deliveryTerms?: string
  optionItemNumber?: string
  itemClassificationNumber?: string
  itemIdentificationNumber?: string
  inspectionExemption?: string
  midTermCompetitionItem?: string
  sortOrder?: number
}

export interface OrderCreateRequest {
  salesId: number
  contractId: string
  contractDate: string
  preNotificationNo: string
  deliveryRequestNo: string
  client: string
  clientManagerName: string
  clientNo: string
  clientPostalCode: string
  clientAddress: string
  clientPhoneNumber: string
  clientFaxNumber: string
  naraJangteoNo: string
  warrantyPeriod: string
  paymentMethod: string
  deliveryRequestDate: string
  projectName: string
  /** ★ 정책: 모든 매출·계약총액·집계 기준은 itemTotalAmount(품대계). */
  itemTotalAmount: string
  /** 수수료 (참고 표기 전용) */
  commission: string
  /** PDF 원본 합계금액 (레거시, 집계·표시에 사용하지 않음) */
  totalAmount: string
  partialDelivery: string
  inspectionAgency: string
  acceptanceAgency: string
  siteManagerId?: number
  builderCompanyId?: number       // 건설사 ID
  builderCompanyName?: string     // 건설사명
  oemCompanyId?: number           // 제조사 ID
  oemCompanyName?: string         // 제조사명
  items: OrderItemCreateRequest[]
}

export interface OrderItemCreateRequest {
  itemOrder: number
  skuId: string           // 문자열로 변경
  itemId: string          // 문자열로 변경
  itemName: string
  skuName: string
  name: string
  specification: string
  unit: string
  unitPrice: string       // 문자열로 변경
  quantity: number
  totalAmount: string     // 문자열로 변경
  deliveryLocation: string
  deliveryDeadline: string
  deliveryTerms: string
  optionItemNumber?: string
  itemClassificationNumber?: string
  itemIdentificationNumber?: string
  inspectionExemption?: string
  midTermCompetitionItem?: string
  sortOrder?: number
}