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
  /** 영업 담당자 user_id (null = 미지정). 변경은 orderService.updateSalesManager 전용 */
  salesId: number | null
  /** 영업 담당자 이름 (조회 전용) */
  salesName?: string | null
  /** 영업 담당자가 대리점 직원이면 대리점명 (조회 전용) */
  salesAgencyName?: string | null
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
  /** 공문(갑지) 수신자명 (즉석 입력 저장값, 없으면 자동값) */
  recipientName?: string
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
  /** 등록 때는 null(미지정) — 담당자는 목록·수정 화면의 전용 기능으로 지정 */
  salesId: number | null
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

// 출하 임박 사업 현황 — 행 1건
export interface LowRemainingOrder {
  orderId: number
  deliveryRequestNo: string
  client: string
  projectName: string
  status: string
  totalQuantity: number       // 총수량 (회배/㎡)
  remainingQuantity: number   // 남은수량 (회배/㎡)
  itemTotalAmount: number     // 총 계약금액 (품대계)
  collectedAmount: number     // 수금된금액
}

// 출하 임박 사업 현황 — 검색 요청
export interface LowRemainingSearchRequest {
  threshold?: number          // 남은수량 임계값 (기본 500)
  client?: string
  keyword?: string
  status?: string
  page?: number
  size?: number
}
// ── 영업 담당자 지정 (2026-09-30) ──

/** 영업 담당자 후보 — SALES_MANAGER 활성 사용자 (대리점 직원 포함) */
export interface SalesManagerCandidate {
  userId: number
  loginId: string
  userName: string
  companyId: number | null
  companyName: string | null
  /** 대리점 직원 여부 (소속 회사가 대리점) */
  agencyMember: boolean
  /** 수요기관 담당 대리점 판정 결과 해당 대리점 직원 */
  recommended?: boolean | null
}

export interface SalesManagerCandidatesResponse {
  candidates: SalesManagerCandidate[]
  resolveStatus?: string | null
  resolveStatusLabel?: string | null
  recommendedAgencyId?: number | null
  recommendedAgencyName?: string | null
  resolveNote?: string | null
}

/** PATCH /admin/orders/sales-manager — salesId null = 지정 해제 */
export interface OrderSalesManagerUpdateRequest {
  orderIds: number[]
  salesId: number | null
  /** 커미션 정산 내역 경고를 확인하고 진행 (기본 false — 정산 있으면 서버가 409 needsConfirm) */
  confirmSettled?: boolean
}

export interface OrderSalesManagerUpdateResponse {
  /** 실제로 담당자가 바뀐 발주 수 */
  changedCount: number
  /** 계약 묶음으로 확장된 전체 대상 */
  orderIds: number[]
  deliveryRequestNos: string[]
  salesId: number | null
  salesName: string | null
  salesAgencyName: string | null
  /** true 면 커미션 정산 내역이 있어 아무것도 바뀌지 않았다 — 확인 후 confirmSettled=true 로 다시 요청 */
  needsConfirm?: boolean
  message?: string | null
  /** 담당자가 바뀌는 발주 중 정산 내역이 있는 납품요구번호 */
  settledDeliveryRequestNos?: string[]
  settledOrderCount?: number
  /** 유효 정산 건수 (취소·삭제 제외) */
  settlementCount?: number
  /** 그중 지급 완료(PAID) / 미지급 건수 */
  paidSettlementCount?: number
  unpaidSettlementCount?: number
}
