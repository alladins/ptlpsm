/**
 * 창고 관련 타입 정의
 * @description 창고 등록/수정/조회 시 사용되는 타입
 */

/**
 * 창고 유형
 */
export const WAREHOUSE_TYPE = {
  LEADPOWER: 'LEADPOWER',
  OEM: 'OEM'
} as const

export type WarehouseType = typeof WAREHOUSE_TYPE[keyof typeof WAREHOUSE_TYPE]

/**
 * 창고 유형 라벨
 */
export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  [WAREHOUSE_TYPE.LEADPOWER]: '리드파워',
  [WAREHOUSE_TYPE.OEM]: 'OEM'
}

/**
 * 창고 유형 색상 매핑 (Tailwind 클래스)
 */
export const WAREHOUSE_TYPE_COLORS: Record<WarehouseType, string> = {
  [WAREHOUSE_TYPE.LEADPOWER]: 'bg-blue-100 text-blue-700',
  [WAREHOUSE_TYPE.OEM]: 'bg-purple-100 text-purple-700'
}

/**
 * 창고 정보 응답
 */
export interface Warehouse {
  /** 창고 ID */
  warehouseId: number
  /** 창고명 */
  warehouseName: string
  /** 창고 유형 */
  warehouseType: WarehouseType
  /** 회사 ID */
  companyId: number | null
  /** 회사명 */
  companyName: string | null
  /** 주소 */
  address: string | null
  /** 활성 여부 */
  isActive: boolean
  /** 정렬 순서 */
  sortOrder: number
  /** 생성일시 */
  createdAt: string
  /** 수정일시 */
  updatedAt: string
}

/**
 * 창고 등록/수정 요청
 */
export interface WarehouseRequest {
  /** 창고명 */
  warehouseName: string
  /** 창고 유형 */
  warehouseType: WarehouseType
  /** 회사 ID */
  companyId: number | null
  /** 주소 */
  address: string | null
  /** 활성 여부 */
  isActive: boolean
  /** 정렬 순서 */
  sortOrder: number
}
