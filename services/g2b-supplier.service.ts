/**
 * 기초정보 > 조달업체관리 — 나라장터 조달업체 기본정보 (백엔드 /api/admin/g2b-suppliers, 리드파워 관리자 전용)
 * apiClient 사용 (인증 헤더·쿼리 문자열·에러 정규화 자동)
 */
import { apiClient } from '~/services/api/client'

const BASE = '/admin/g2b-suppliers'

export interface G2bSupplier {
  bizno: string
  corpNm: string
  ceoNm: string | null
  adrs: string | null
  dtlAdrs: string | null
  telNo: string | null
  rgnNm: string | null
  opbizDt: string | null
  /** 물품,일반용역,공사… */
  corpBsnsDivNm: string | null
  emplyNum: number | null
  /** 본사/지사 */
  hdoffceDivNm: string | null
  /** 나라장터 등록·변경일시 (KST 그대로) */
  rgstDt: string | null
  chgDt: string | null
  /** 이름으로 본 건축사사무소 Y/N */
  isDesignOffice: 'Y' | 'N'
  /** 설계사무소로 등록된 회사 ID (있으면) */
  designOfficeId: number | null
}

export interface G2bSupplierPage {
  content: G2bSupplier[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface SupplierStatus {
  total: number
  designOffices: number
  registeredDesignOffices: number
  lastSyncedAt: string | null
  running: boolean
}

export type SupplierSyncMode = 'FULL' | 'DAILY' | 'DESIGN_OFFICE'
export const SUPPLIER_SYNC_MODE_LABELS: Record<SupplierSyncMode, string> = {
  FULL: '전체 (등록연도)',
  DAILY: '변경분 (최근 2일)',
  DESIGN_OFFICE: '설계사무소 반영만'
}

export interface SupplierSyncRun {
  runId: number
  mode: SupplierSyncMode
  triggerType: 'SCHEDULE' | 'MANUAL'
  rangeText: string | null
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED'
  apiCalls: number
  fetched: number
  upserted: number
  designOffices: number
  message: string | null
  startedBy: string | null
  startedAt: string | null
  finishedAt: string | null
}

export const SUPPLIER_RUN_STATUS: Record<SupplierSyncRun['status'], { label: string, badge: string }> = {
  RUNNING: { label: '진행 중', badge: 'primary' },
  COMPLETED: { label: '완료', badge: 'success' },
  FAILED: { label: '실패', badge: 'danger' },
  STOPPED: { label: '한도로 멈춤', badge: 'warning' }
}

export const g2bSupplierService = {
  search (params: { keyword?: string, sido?: string, designOnly?: boolean, page: number, size: number }): Promise<G2bSupplierPage> {
    return apiClient.get<G2bSupplierPage>(BASE, { ...params })
  },
  getStatus (): Promise<SupplierStatus> {
    return apiClient.get<SupplierStatus>(`${BASE}/status`)
  },
  getRuns (limit = 30): Promise<SupplierSyncRun[]> {
    return apiClient.get<SupplierSyncRun[]>(`${BASE}/runs`, { limit })
  },
  syncFull (bgnYear: number, endYear: number): Promise<SupplierStatus> {
    return apiClient.post<SupplierStatus>(`${BASE}/sync/full?bgnYear=${bgnYear}&endYear=${endYear}`)
  },
  syncDaily (): Promise<SupplierStatus> {
    return apiClient.post<SupplierStatus>(`${BASE}/sync/daily`)
  },
  applyDesignOffices (): Promise<SupplierStatus> {
    return apiClient.post<SupplierStatus>(`${BASE}/design-offices`)
  }
}
