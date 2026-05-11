/**
 * 재고 관련 타입 정의
 * @description 재고 현황/입출고/이동 시 사용되는 타입
 */

/**
 * 재고 품목 정보
 */
export interface InventoryItem {
  /** 재고 ID */
  inventoryId: number
  /** 창고 ID */
  warehouseId: number
  /** 창고명 */
  warehouseName: string
  /** OEM 제조사명 */
  oemCompanyName: string | null
  /** SKU ID */
  skuId: string
  /** SKU명 */
  skuName: string
  /** 품목명 */
  itemName: string
  /** 현재 수량 */
  quantity: number
  /** 최종 갱신일 */
  lastUpdated: string
}

/**
 * 재고 목록 검색 필터
 */
export interface InventoryListFilter {
  /** 창고 ID */
  warehouseId?: number | null
  /** OEM 제조사 ID */
  oemCompanyId?: number | null
  /** SKU ID */
  skuId?: string
  /** 검색 키워드 */
  keyword?: string
  /** 페이지 번호 (0-indexed) */
  page?: number
  /** 페이지 크기 */
  size?: number
}

/**
 * 재고 입출고 이력
 */
export interface InventoryTransaction {
  /** 거래 ID */
  transactionId: number
  /** 창고 ID */
  warehouseId: number
  /** 창고명 */
  warehouseName: string
  /** SKU ID */
  skuId: string
  /** SKU명 */
  skuName: string
  /** 거래 유형 */
  transactionType: 'INBOUND' | 'OUTBOUND' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  /** 수량 */
  quantity: number
  /** 참조 유형 */
  referenceType: string | null
  /** 참조 ID */
  referenceId: number | null
  /** 출발 창고 ID */
  fromWarehouseId: number | null
  /** 출발 창고명 */
  fromWarehouseName: string | null
  /** 도착 창고 ID */
  toWarehouseId: number | null
  /** 도착 창고명 */
  toWarehouseName: string | null
  /** 거래 일시 */
  transactionDate: string
  /** 비고 */
  remarks: string | null
  /** 작업자 */
  createdBy: string
  /** 생성일시 */
  createdAt: string
}

/**
 * 재고 이력 검색 필터
 */
export interface InventoryTransactionFilter {
  /** 창고 ID */
  warehouseId?: number | null
  /** SKU ID */
  skuId?: string
  /** 거래 유형 */
  transactionType?: string
  /** 시작일 */
  startDate?: string
  /** 종료일 */
  endDate?: string
  /** 페이지 번호 (0-indexed) */
  page?: number
  /** 페이지 크기 */
  size?: number
}

/**
 * 창고간 이동 요청
 */
export interface TransferRequest {
  /** 출발 창고 ID */
  fromWarehouseId: number
  /** 도착 창고 ID */
  toWarehouseId: number
  /** SKU ID (단일 이동 시) */
  skuId?: string
  /** 이동 수량 (단일 이동 시) */
  quantity?: number
  /** 비고 */
  remarks?: string
  /** 다중 품목 이동 */
  items?: TransferItem[]
}

export interface TransferItem {
  /** SKU ID */
  skuId: string
  /** 이동 수량 */
  quantity: number
}

/**
 * 입고 요청
 */
export interface InboundRequest {
  /** 창고 ID */
  warehouseId: number
  /** SKU ID */
  skuId: string
  /** 입고 수량 */
  quantity: number
  /** 참조 유형 */
  referenceType?: string
  /** 참조 ID */
  referenceId?: number
  /** 비고 */
  remarks?: string
}

/**
 * 출고 요청
 */
export interface OutboundRequest {
  /** 창고 ID */
  warehouseId: number
  /** SKU ID */
  skuId: string
  /** 출고 수량 */
  quantity: number
  /** 참조 유형 */
  referenceType?: string
  /** 참조 ID */
  referenceId?: number
  /** 비고 */
  remarks?: string
}

/**
 * SKU별 입출고 현황 요약
 */
export interface SkuTransactionSummary {
  /** SKU ID */
  skuId: string
  /** SKU 품명 */
  skuName?: string
  /** 품목명 */
  itemName?: string
  /** 총 발주수량 */
  totalOrdered: number
  /** 입고 수량 (생산완료) */
  totalInbound: number
  /** 이동입고 수량 */
  totalTransferIn: number
  /** 출고 수량 (운송등록) */
  totalOutbound: number
  /** 이동출고 수량 */
  totalTransferOut: number
  /** OEM 제조사명 (발주서 기반) */
  oemCompanyName?: string
  /** OEM 창고명 (발주서 기반) */
  oemWarehouseName?: string
}

/**
 * 거래 유형 라벨
 */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INBOUND: '입고',
  OUTBOUND: '출고',
  TRANSFER_IN: '이동입고',
  TRANSFER_OUT: '이동출고'
}

/**
 * 거래 유형 색상 (Tailwind 클래스)
 */
export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  INBOUND: 'bg-green-100 text-green-700',
  OUTBOUND: 'bg-red-100 text-red-700',
  TRANSFER_IN: 'bg-blue-100 text-blue-700',
  TRANSFER_OUT: 'bg-orange-100 text-orange-700'
}
