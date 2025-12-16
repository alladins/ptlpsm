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
 * 서버 PDF 업로드 응답에 포함될 계약 유형 체크 결과
 */
export interface ContractTypeCheckResult {
  /** 본계약 여부 (접미사 00이면 true) */
  isOriginalContract: boolean
  /** 기존 본계약 납품요구번호 (예: R25TB01181972-00) */
  existingContractNo?: string
  /** 신규 계약 납품요구번호 (예: R25TB01181972-01) */
  newContractNo: string
}

export interface OrderResponse {
  orderId: number
  salesId: number
  contractId: string
  contractDate: string
  client: string
  clientManagerName: string
  projectName: string
  itemTotalAmount: string
  commission: string
  totalAmount: string
  deliveryRequestNo: string
  deliveryRequestDate: string
  /** 분할순번 (00=기준, 01~=분할) */
  splitSeq?: string
  /** 계약유형 (ORIGINAL/AMENDMENT/SEPARATE) */
  contractType?: ContractType
  /** 기준 주문 ID (변경/별도 계약인 경우) */
  baseOrderId?: number
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
  builder?: string
  pdfFile?: string
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
  itemTotalAmount: string
  commission: string
  totalAmount: string
  partialDelivery: string
  inspectionAgency: string
  acceptanceAgency: string
  siteManagerId?: number
  builder?: string
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