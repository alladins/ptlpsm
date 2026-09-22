/**
 * OEM 월별 매출원장 타입 정의
 */

/** 원장 항목 */
export interface OemLedgerItem {
  poNo: string
  poId: number
  orderDate: string
  demandAgency: string
  projectName: string
  spec: string
  skuId: string
  quantity: number
  unit: string
  unitCost: number
  amount: number
  poUnitPrice: number | null
  masterCostPrice: number | null
  costSource: OemLedgerCostSource
  remarks: string | null
  shipmentNo: string | null
  shipmentDate: string | null
  oemCompanyName?: string  // 전체 조회 시 제조사명
}

/** 원장 응답 */
export interface OemMonthlyLedgerResponse {
  oemCompanyId: number
  oemCompanyName: string | null
  yearMonth: string
  items: OemLedgerItem[]
  totalQuantity: number
  /** 발주 품목 합계 (손실 차감 전 공급가액) */
  totalAmount: number

  /**
   * 비출하 재고 소진 목록 (품질관리 발송 / 리드파워 계약)
   * 발주서 없이 재고에서 빠진 물량. 그 물량을 만든 OEM 이 청구하므로 원장에 가산된다.
   */
  consumptions?: LedgerConsumptionItem[]
  /** 비출하 소진 합계 (가산) */
  consumptionTotal?: number

  /**
   * 운송비 목록 — OEM 에게 지불하는 건(PAID_TO_OEM)만 실린다.
   * OEM 부담(OEM_BEARS)·리드파워 부담(LP_BEARS)은 제조사에게 줄 돈이 아니라 제외된다.
   */
  shippingCharges?: LedgerChargeItem[]
  /** 운송비 합계 (가산) */
  shippingChargeTotal?: number

  /** 가공비 목록 — OEM 에 가공을 요청하고 지불하는 비용 */
  processingCharges?: LedgerChargeItem[]
  /** 가공비 합계 (가산) */
  processingChargeTotal?: number

  /** 손실 차감 목록 (제조사 부담 손실·스펙오납 정산분) */
  lossDeductions?: LossDeductionSummary[]
  /** 손실 차감액 합계 */
  lossDeductionTotal?: number
  /** 지급 예정 공급가액 = totalAmount + 소진 + 운송비 + 가공비 − lossDeductionTotal */
  payableAmount?: number
  /** 부가세 (공급가액의 10%, 원 단위 반올림 — 발주서 PDF 와 동일 기준) */
  vatAmount?: number
  /** 합계 (공급가액 + 부가세) */
  totalWithVat?: number

  paymentStatus: OemLedgerPaymentStatus
  paymentId: number | null
  paidAmount: number | null
  paidDate: string | null

  /** 감사 이력 — 누가 언제 청구·확인·지급했는지 */
  requestedBy?: string | null
  requestedAt?: string | null
  confirmedBy?: string | null
  confirmedAt?: string | null
  paidBy?: string | null

  /** 마지막 반려 이력 (상태와 무관하게 내려온다) */
  lastRejectReason?: string | null
  lastRejectedBy?: string | null
  lastRejectedAt?: string | null

  /** 지급요청서(서류) 내용 — 2026-09-22 */
  requestRemarks?: string | null
  bankName?: string | null
  bankAccountNo?: string | null
  bankAccountHolder?: string | null
  requestedByName?: string | null
}

/** 지급요청서 발신 정보 — 제조사 회사 정보 + 지난 청구의 입금 계좌 */
export interface OemPaymentDocumentInfo {
  oemCompanyId: number
  companyName: string
  businessNumber: string | null
  representative: string | null
  address: string | null
  detailAddress: string | null
  tel: string | null
  lastBankName: string | null
  lastBankAccountNo: string | null
  lastBankAccountHolder: string | null
}

/** 지급요청 이력 1건 (차수) — 반려 포함. attachments 는 그 차수를 제출할 때 붙어 있던 첨부 */
export interface OemPaymentRequestHistory {
  seq: number
  paymentId: number
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'PAID'
  paymentAmount: number
  paidAmount: number | null
  paidDate: string | null
  remarks: string | null
  bankName: string | null
  bankAccountNo: string | null
  bankAccountHolder: string | null
  createdBy: string | null
  createdByName: string | null
  createdAt: string | null
  confirmedBy: string | null
  confirmedAt: string | null
  paidBy: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectReason: string | null
  attachments: OemPaymentAttachment[]
}

/** 지급요청서 첨부파일 (영수증 등) — 제조사·월 단위 */
export interface OemPaymentAttachment {
  attachmentId: number
  oemCompanyId: number
  yearMonth: string
  paymentId: number | null
  originalName: string
  fileSize: number
  contentType: string | null
  uploadedBy: string | null
  uploadedByName: string | null
  uploadedAt: string | null
}

/** 원장에 표시되는 손실 차감 행 (백엔드 LossAdjustmentResponse 의 부분집합) */
export interface LossDeductionSummary {
  lossId: number
  lossNo: string
  lossTypeName: string
  skuName?: string | null
  quantity: number
  oemDeductionAmount: number
  settlementStatusName: string
  occurredDate: string
}

/** 원가 출처 (백엔드 OemLedgerMapper 의 costSource 와 1:1) */
export const OEM_LEDGER_COST_SOURCE = {
  SHIPMENT: 'SHIPMENT',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  MASTER: 'MASTER',
  NONE: 'NONE'
} as const

export type OemLedgerCostSource = typeof OEM_LEDGER_COST_SOURCE[keyof typeof OEM_LEDGER_COST_SOURCE]

export const OEM_LEDGER_COST_SOURCE_LABELS: Record<OemLedgerCostSource, string> = {
  [OEM_LEDGER_COST_SOURCE.SHIPMENT]: '출하스냅샷',
  [OEM_LEDGER_COST_SOURCE.PURCHASE_ORDER]: '발주스냅샷',
  [OEM_LEDGER_COST_SOURCE.MASTER]: '마스터',
  [OEM_LEDGER_COST_SOURCE.NONE]: '미등록'
}

/**
 * 원가 출처 설명 — 이 금액이 «어디서 온 원가인가»
 *
 * 배지에 단어만 떠 있으면 무슨 뜻인지 알 수 없어 문의가 온다.
 * 위쪽일수록 그 시점의 값이라 믿을 만하고, 아래로 갈수록 지금 값이 섞인다.
 */
export const OEM_LEDGER_COST_SOURCE_HINTS: Record<OemLedgerCostSource, string> = {
  [OEM_LEDGER_COST_SOURCE.SHIPMENT]:
    '출하할 때 기록해 둔 원가입니다. 그 시점의 값이라 가장 정확합니다.',
  [OEM_LEDGER_COST_SOURCE.PURCHASE_ORDER]:
    '발주서에 적힌 단가입니다. 출하 기록이 없어 발주서에서 가져왔습니다.',
  [OEM_LEDGER_COST_SOURCE.MASTER]:
    '제조사 원가표의 현재 값입니다. 그 시점 기록이 없어 지금 단가를 쓴 것이라 실제와 다를 수 있습니다.',
  [OEM_LEDGER_COST_SOURCE.NONE]:
    '원가가 등록되어 있지 않아 0원으로 계산됐습니다. 제조사 원가를 등록해야 합니다.'
}

/** 지급 상태 */
export const OEM_LEDGER_PAYMENT_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID'
} as const

export type OemLedgerPaymentStatus = typeof OEM_LEDGER_PAYMENT_STATUS[keyof typeof OEM_LEDGER_PAYMENT_STATUS]

export const OEM_LEDGER_PAYMENT_STATUS_LABELS: Record<OemLedgerPaymentStatus, string> = {
  [OEM_LEDGER_PAYMENT_STATUS.NONE]: '미요청',
  [OEM_LEDGER_PAYMENT_STATUS.PENDING]: '요청완료',
  [OEM_LEDGER_PAYMENT_STATUS.CONFIRMED]: '확인완료',
  [OEM_LEDGER_PAYMENT_STATUS.PAID]: '지급완료'
}

export const OEM_LEDGER_PAYMENT_STATUS_COLORS: Record<OemLedgerPaymentStatus, string> = {
  [OEM_LEDGER_PAYMENT_STATUS.NONE]: 'status-none',
  [OEM_LEDGER_PAYMENT_STATUS.PENDING]: 'status-pending',
  [OEM_LEDGER_PAYMENT_STATUS.CONFIRMED]: 'status-confirmed',
  [OEM_LEDGER_PAYMENT_STATUS.PAID]: 'status-paid'
}

/**
 * ★ REJECTED 는 paymentStatus 에 실리지 않는다.
 *   반려건은 «살아있는 청구» 가 아니라 제외되고(백엔드 getPaymentRequestStatus),
 *   대신 lastRejectReason 으로 «왜 한 번 돌아왔는지» 만 전달된다.
 *   그래서 상태가 다시 NONE 이 되어 제조사가 재청구를 올릴 수 있다.
 */

/** 지급 요청 */
export interface OemLedgerPaymentRequest {
  oemCompanyId: number
  yearMonth: string
  totalAmount: number
  remarks?: string
  /** 지급요청서에서 입력하는 입금 계좌 */
  bankName?: string
  bankAccountNo?: string
  bankAccountHolder?: string
  paidAmount?: number
  paidDate?: string
}

/** 확인 대기 청구 1건 — 리드파워 담당자 배너용 */
export interface OemLedgerPendingItem {
  paymentId: number
  oemCompanyId: number
  oemCompanyName: string | null
  yearMonth: string
  paymentAmount: number
  remarks: string | null
  requestedBy: string | null
  requestedAt: string | null
}

/**
 * 원장 부대비용 항목 (운송비 / 가공비)
 *
 * 발주 품목처럼 "수량 × 원가"가 아니라 금액만 가산되는 항목이다.
 */
export interface LedgerChargeItem {
  /** SHIPPING:운송비 / PROCESSING:가공비 */
  chargeType: 'SHIPPING' | 'PROCESSING'
  /** 출처 문서번호 (출하번호 또는 발주서번호) */
  sourceNo: string | null
  sourceId: number | null
  amount: number
  /** 기준일 (출하일 또는 발주일) */
  refDate: string | null
  /** 운송사명 (운송비인 경우) */
  carrierName?: string | null
  deliveryRequestNo?: string | null
  client?: string | null
  remarks?: string | null
}

/**
 * 원장의 비출하 재고 소진 항목
 *
 * 수량·원가가 있어 부대비용과 구분된다.
 * 상세 타입은 ~/types/inventory-consumption 의 InventoryConsumption 과 같다.
 */
export interface LedgerConsumptionItem {
  consumptionId: number
  consumptionNo: string
  consumptionType: string
  skuId: string
  skuName: string | null
  warehouseName: string | null
  /** 수량 (㎡) */
  quantity: number
  sheetCount: number | null
  unitCost: number
  amount: number
  consumptionDate: string
  destination: string | null
  contractNo: string | null
  sourceOemCompanyName: string | null
}
