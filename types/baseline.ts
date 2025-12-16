/**
 * 기성/납품확인 차수 관련 타입 정의
 * @description 기성 청구 및 납품완료 처리를 위한 차수(Baseline) 관련 인터페이스
 */

import type { BaseEntity } from './common'

/**
 * 차수 유형
 * - PROGRESS: 기성 (중간 납품 확인)
 * - FINAL: 납품완료 (최종 납품 확인)
 */
export type BaselineType = 'PROGRESS' | 'FINAL'

/**
 * 차수 상태
 * - DRAFT: 작성중
 * - CONFIRMED: 확정
 * - CANCELLED: 취소
 */
export type BaselineStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

/**
 * 기성/납품확인 차수
 * @description 특정 시점의 납품 수량/금액을 스냅샷으로 저장하는 차수 정보
 */
export interface Baseline extends BaseEntity {
  /** 차수 ID (PK) */
  baselineId: number
  /** 주문 ID (FK) */
  orderId: number
  /** 차수 순번 (1, 2, 3...) */
  baselineSeq: number
  /** 차수 유형 (기성/납품완료) */
  baselineType: BaselineType
  /** 확정일 */
  baselineDate: string
  /** 납품확인서 ID */
  deliveryConfirmationId: number | null
  /** 이번 차수 청구 금액 */
  totalAmount: number
  /** 이번 차수 OEM 비용 */
  totalCost: number
  /** 누적 청구 금액 */
  cumulativeAmount: number
  /** 누적 OEM 비용 */
  cumulativeCost: number
  /** 생성자 ID */
  createdById: number
  /** 차수 상태 */
  status: BaselineStatus
  /** 비고 */
  remarks: string | null
  /** 품목 스냅샷 목록 */
  items: BaselineItem[]
}

/**
 * 차수 품목 스냅샷
 * @description 차수 확정 시점의 품목별 수량/금액 스냅샷
 */
export interface BaselineItem {
  /** 항목 ID (PK) */
  id: number
  /** 차수 ID (FK) */
  baselineId: number
  /** 품목 ID (FK) */
  itemId: number
  /** 품목명 스냅샷 */
  itemName: string
  /** 규격 스냅샷 */
  specification: string
  /** 단위 스냅샷 */
  unit: string
  /** 납품단가 스냅샷 */
  unitPrice: number
  /** 원가 스냅샷 */
  costPrice: number
  /** 주문 수량 */
  orderedQuantity: number
  /** 출하 수량 (누적) */
  shippedQuantity: number
  /** 납품 수량 (누적) - 이번 차수까지 확정된 수량 */
  deliveredQuantity: number
  /** 잔고 수량 (주문 - 납품) */
  remainingQuantity: number
  /** 이번 차수 청구 수량 */
  thisTimeQuantity: number
  /** 이번 차수 금액 */
  thisTimeAmount: number
  /** 이번 차수 OEM 비용 */
  thisTimeCost: number
}

/**
 * 차수 목록 항목 (간소화)
 */
export interface BaselineListItem {
  baselineId: number
  baselineSeq: number
  baselineType: BaselineType
  baselineDate: string
  /** 이번 차수 납품 수량 합계 */
  totalQuantity: number
  totalAmount: number
  totalCost: number
  deliveryConfirmationId: number | null
  status: BaselineStatus
  /** UI 표시용 이름 (예: "기성 1차", "납품완료") */
  displayName?: string
  /** 납품확인서 파일 URL */
  deliveryConfirmationUrl?: string
}

/**
 * 차수 생성 요청
 */
export interface BaselineCreateRequest {
  /** 차수 유형 (기성/납품완료) */
  baselineType: BaselineType
  /** 비고 */
  remarks?: string
}

/**
 * 현재 수량 스냅샷
 * @description 기성 청구 모달에서 사용하는 현재 시점의 수량 정보
 */
export interface CurrentQuantitySnapshot {
  /** 주문 ID */
  orderId: number
  /** 조회 시점 */
  snapshotDate: string
  /** 품목별 현재 수량 */
  items: CurrentQuantityItem[]
}

/**
 * 품목별 현재 수량
 */
export interface CurrentQuantityItem {
  /** 품목 ID */
  itemId: number
  /** 품목명 */
  itemName: string
  /** 규격 */
  specification: string
  /** 단위 */
  unit: string
  /** 납품단가 */
  unitPrice: number
  /** 원가 */
  costPrice: number
  /** 주문 수량 */
  orderedQuantity: number
  /** 출하 수량 (누적) */
  shippedQuantity: number
  /** 납품 수량 (현재까지 출하 완료된 수량) */
  currentDeliveredQuantity: number
  /** 이전 차수 확정 수량 */
  previousConfirmedQuantity: number
}

/**
 * 수량 변경 기록
 * @description 이전 차수 확정 후 발생한 수량 변경 이력
 */
export interface QuantityChangeRecord {
  /** 변경 ID */
  changeId: number
  /** 출하 ID */
  shipmentId: number
  /** 출하 번호 (예: #2, #3) */
  shipmentNo: string
  /** 품목 ID */
  itemId: number
  /** 품목명 */
  itemName: string
  /** 변경 전 수량 */
  previousQuantity: number | null
  /** 변경 후 수량 */
  newQuantity: number
  /** 변경 차이 */
  quantityDiff: number
  /** 변경 사유 */
  changeReason: string | null
  /** 변경 일시 */
  changedAt: string
  /** 변경자 */
  changedBy: string
  /** 변경 유형 (신규출하/수량수정) */
  changeType: 'NEW_SHIPMENT' | 'QUANTITY_MODIFIED'
}

/**
 * 기성 청구 품목 정보
 * @description 기성 청구 모달에서 표시하는 품목별 상세 정보
 */
export interface ProgressPaymentItem {
  /** 품목 ID */
  itemId: number
  /** 품목명 */
  itemName: string
  /** 규격 */
  specification: string
  /** 단위 */
  unit: string
  /** 납품단가 */
  unitPrice: number
  /** 원가 */
  costPrice: number
  /** 주문 수량 */
  orderedQuantity: number
  /** 이전 차수 확정 수량 */
  previousConfirmed: number
  /** 현재 납품 수량 */
  currentDelivered: number
  /** 이번 청구 수량 */
  thisTimeQuantity: number
  /** 이번 청구 금액 */
  thisTimeAmount: number
  /** 이번 OEM 비용 */
  thisTimeCost: number
  /** 신규 출하분 수량 */
  fromNewShipments: number
  /** 기존 출하 수정분 수량 */
  fromModifications: number
  /** 수정분 포함 여부 */
  hasModification: boolean
}

/**
 * 변경분 요약 정보
 */
export interface ChangesSummary {
  /** 변경된 출하 수 */
  changedShipmentCount: number
  /** 총 변경 수량 */
  totalQuantityChange: number
  /** 품목별 변경 요약 */
  itemChanges: {
    itemId: number
    itemName: string
    previousQuantity: number
    currentQuantity: number
    diff: number
    changeType: string
  }[]
}

/**
 * 차수 목록 응답
 */
export interface BaselineListResponse {
  content: BaselineListItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 납품확인서 정보
 */
export interface DeliveryConfirmation {
  /** 납품확인서 ID */
  confirmationId: number
  /** 차수 ID */
  baselineId: number
  /** 납품확인서 번호 */
  confirmationNo: string
  /** 생성일 */
  createdAt: string
  /** PDF 파일 URL */
  pdfFileUrl: string | null
  /** 서명 이미지 URL */
  signatureUrl: string | null
  /** 서명자 */
  signedBy: string | null
  /** 서명일 */
  signedAt: string | null
}
