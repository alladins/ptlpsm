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