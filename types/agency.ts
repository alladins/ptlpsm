/**
 * 영업관리 1단계 — 대리점·권역·설계사무소·담당 판정 타입
 *
 * 백엔드: /api/admin/agencies, /api/admin/sales-regions,
 *         /api/admin/design-offices, /api/admin/demand-org-sales-attr
 * 날짜(validFrom 등)는 'yyyy-MM-dd' 문자열, 시각(createdAt 등)은 UTC — 표시할 때 ~/utils/format 사용.
 */

// ============================================
// 코드 상수 (공통코드와 같은 값 — 화면 라벨은 이 파일 하나로 맞춘다)
// ============================================

/** 대리점 채널 (AGENCY_CHANNEL) */
export const AGENCY_CHANNEL = {
  LOCAL: 'LOCAL',
  EDU: 'EDU'
} as const
export type AgencyChannel = typeof AGENCY_CHANNEL[keyof typeof AGENCY_CHANNEL]
export const AGENCY_CHANNEL_LABELS: Record<AgencyChannel, string> = {
  LOCAL: '지자체',
  EDU: '교육청'
}

/** 대리점 상태 (AGENCY_STATUS) */
export const AGENCY_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED'
} as const
export type AgencyStatus = typeof AGENCY_STATUS[keyof typeof AGENCY_STATUS]
export const AGENCY_STATUS_LABELS: Record<AgencyStatus, string> = {
  ACTIVE: '활동',
  SUSPENDED: '정지',
  TERMINATED: '해지'
}
/** 상태 배지 색 (admin-common.css 의 .status-badge 변형) */
export const AGENCY_STATUS_BADGE: Record<AgencyStatus, string> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  TERMINATED: 'danger'
}

/** 기관 구분 (ORG_CATEGORY) */
export const ORG_CATEGORY = {
  LOCAL_GOV: 'LOCAL_GOV',
  EDU: 'EDU',
  MILITARY: 'MILITARY',
  OTHER_PUBLIC: 'OTHER_PUBLIC'
} as const
export type OrgCategory = typeof ORG_CATEGORY[keyof typeof ORG_CATEGORY]
export const ORG_CATEGORY_LABELS: Record<OrgCategory, string> = {
  LOCAL_GOV: '지자체',
  EDU: '교육청',
  MILITARY: '군',
  OTHER_PUBLIC: '기타 공공'
}
export const ORG_CATEGORY_BADGE: Record<OrgCategory, string> = {
  LOCAL_GOV: 'primary',
  EDU: 'info',
  MILITARY: 'warning',
  OTHER_PUBLIC: 'muted'
}

/** 판정 방식 (RESOLVE_MODE) */
export const RESOLVE_MODE = {
  LOCATION: 'LOCATION',
  FIXED_REGION: 'FIXED_REGION',
  PER_ORDER: 'PER_ORDER'
} as const
export type ResolveMode = typeof RESOLVE_MODE[keyof typeof RESOLVE_MODE]
export const RESOLVE_MODE_LABELS: Record<ResolveMode, string> = {
  LOCATION: '소재지 기준',
  FIXED_REGION: '지정 권역',
  PER_ORDER: '건별 지정'
}

/** 판정값 출처 */
export type AttrSource = 'AUTO' | 'MANUAL'
export const ATTR_SOURCE_LABELS: Record<AttrSource, string> = {
  AUTO: '자동',
  MANUAL: '수동 보정'
}

/** 담당 판정 결과 상태 */
export type ResolveStatus = 'OK' | 'NO_ORG' | 'NO_SIGUNGU' | 'NO_REGION' | 'NO_AGENCY' | 'NEEDS_ORDER_LEVEL'
export const RESOLVE_STATUS_LABELS: Record<ResolveStatus, string> = {
  OK: '판정 완료',
  NO_ORG: '수요기관 없음',
  NO_SIGUNGU: '판정 실패',
  NO_REGION: '권역 미지정',
  NO_AGENCY: '대리점 없음',
  NEEDS_ORDER_LEVEL: '건별 지정 필요'
}
/** 결과 색: OK 초록 / 건별 지정 주황 / 나머지 빨강 */
export function resolveStatusBadge (status?: string | null): string {
  if (status === 'OK') { return 'success' }
  if (status === 'NEEDS_ORDER_LEVEL') { return 'warning' }
  return 'danger'
}

/** 시도 코드 (법정동코드 앞 2자리) */
export const SIDO_LIST: { sidoCd: string, sidoNm: string }[] = [
  { sidoCd: '11', sidoNm: '서울' },
  { sidoCd: '26', sidoNm: '부산' },
  { sidoCd: '27', sidoNm: '대구' },
  { sidoCd: '28', sidoNm: '인천' },
  { sidoCd: '29', sidoNm: '광주' },
  { sidoCd: '30', sidoNm: '대전' },
  { sidoCd: '31', sidoNm: '울산' },
  { sidoCd: '36', sidoNm: '세종' },
  { sidoCd: '41', sidoNm: '경기' },
  { sidoCd: '43', sidoNm: '충북' },
  { sidoCd: '44', sidoNm: '충남' },
  { sidoCd: '46', sidoNm: '전남' },
  { sidoCd: '47', sidoNm: '경북' },
  { sidoCd: '48', sidoNm: '경남' },
  { sidoCd: '50', sidoNm: '제주' },
  { sidoCd: '51', sidoNm: '강원' },
  { sidoCd: '52', sidoNm: '전북' }
]

/** 코드 → 라벨 (모르는 코드는 그대로, 비어 있으면 '-') */
export function codeLabel (map: Record<string, string>, code?: string | null): string {
  if (!code) { return '-' }
  return map[code] || code
}

/** 오늘 날짜 (KST, yyyy-MM-dd) — 담당 시작일 기본값 등 */
export function todayKst (): string {
  // sv-SE 로케일은 yyyy-MM-dd 형식으로 나온다
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
}

// ============================================
// 권역
// ============================================

export interface SalesRegion {
  regionId: number
  regionCode: string
  regionName: string
  parentRegionId: number | null
  parentRegionName: string | null
  areaPhoneCode: string | null
  sortOrder: number | null
  useYn: 'Y' | 'N'
  remarks: string | null
  sigunguCount: number
  /** 사용 중인 하위 권역 수 (0 이면 말단) */
  childCount: number
  activeTerritoryCount: number
  activeAgencyNames: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface SalesRegionCreateRequest {
  regionCode: string
  regionName: string
  parentRegionId: number | null
  areaPhoneCode: string | null
  sortOrder: number | null
  remarks: string | null
}

export interface SalesRegionUpdateRequest {
  regionName: string
  parentRegionId: number | null
  areaPhoneCode: string | null
  sortOrder: number | null
  useYn: 'Y' | 'N'
  remarks: string | null
}

export interface Sigungu {
  sigunguCd: string
  sigunguNm: string
  sidoCd: string
  localNm: string | null
  regionId: number | null
  regionCode: string | null
  regionName: string | null
}

export interface RegionSigunguUpdateRequest {
  add: string[]
  remove: string[]
}

// ============================================
// 대리점
// ============================================

export interface Agency {
  agencyId: number
  companyName: string
  businessNumber: string | null
  representative: string | null
  address: string | null
  detailAddress: string | null
  zipCode: string | null
  tel: string | null
  email: string | null
  agencyCode: string
  channel: AgencyChannel
  parentAgencyId: number | null
  status: AgencyStatus
  contractStartDate: string | null
  contractEndDate: string | null
  remarks: string | null
  currentRegionNames: string | null
  staffCount: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface AgencyRequest {
  companyName: string
  businessNumber: string | null
  representative: string | null
  address: string | null
  detailAddress: string | null
  zipCode: string | null
  tel: string | null
  email: string | null
  agencyCode: string
  /** 등록 후 변경 불가 */
  channel: AgencyChannel | ''
  status: AgencyStatus
  contractStartDate: string | null
  contractEndDate: string | null
  remarks: string | null
}

export interface AgencySearchParams {
  keyword?: string
  channel?: string
  status?: string
  regionId?: number | null
}

export interface Territory {
  territoryId: number
  agencyId: number
  agencyCode: string | null
  agencyName: string | null
  channel: AgencyChannel | null
  regionId: number
  regionCode: string | null
  regionName: string | null
  parentRegionName: string | null
  validFrom: string
  validTo: string | null
  remarks: string | null
  /** 오늘(KST) 기준 담당 중 */
  current: boolean
  createdAt: string | null
  createdBy: string | null
}

export interface TerritoryRequest {
  regionId: number
  validFrom: string
  validTo: string | null
  remarks: string | null
}

export interface AgencyStaff {
  userId: number
  loginId: string
  userName: string
  phone: string | null
  email: string | null
  position: string | null
  role: string
  enabled: boolean
  lastLoginAt: string | null
}

// ============================================
// 담당 판정
// ============================================

export interface AgencyResolveResult {
  status: ResolveStatus
  statusLabel: string
  dminsttCd: string
  dminsttNm: string | null
  orgCategory: OrgCategory | null
  channel: AgencyChannel | null
  resolveMode: ResolveMode | null
  source: AttrSource | null
  sigunguCd: string | null
  sigunguNm: string | null
  regionId: number | null
  regionCode: string | null
  regionName: string | null
  regionPath: string | null
  agencyId: number | null
  agencyCode: string | null
  agencyName: string | null
  baseDate: string | null
  note: string | null
  /** 도 단위 기관 (청사 소재지로 판정됨) */
  provinceLevel: boolean | null
}

export interface ResolvePreviewRow {
  orderId: number
  deliveryRequestNo: string | null
  deliveryRequestDate: string | null
  client: string | null
  clientNo: string | null
  result: AgencyResolveResult
}

export interface ResolvePreviewResponse {
  rows: ResolvePreviewRow[]
  countsByStatus: Record<string, number>
}

export type ResolvePreviewBasis = 'today' | 'orderDate'

// ============================================
// 수요기관 판정값
// ============================================

export interface DemandOrgSalesAttr {
  dminsttCd: string
  dminsttNm: string | null
  adrs: string | null
  rgnNm: string | null
  sigunguCd: string | null
  sigunguNm: string | null
  orgCategory: OrgCategory | null
  channel: AgencyChannel | null
  resolveMode: ResolveMode | null
  fixedRegionId: number | null
  fixedRegionName: string | null
  source: AttrSource | null
  matchNote: string | null
  /** 판정값 행이 있는지 */
  judged: boolean
  updatedAt: string | null
  updatedBy: string | null
}

export interface DemandOrgSearchParams {
  keyword?: string
  orgCategory?: string
  source?: string
  failedOnly?: boolean
  page: number
  size: number
}

/** 백엔드 comm PageResponse (현재 페이지 필드명이 `page`, 0-based) */
export interface DemandOrgPage {
  content: DemandOrgSalesAttr[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface DemandOrgSalesAttrRequest {
  sigunguCd: string | null
  orgCategory: OrgCategory
  channel: AgencyChannel
  resolveMode: ResolveMode
  fixedRegionId: number | null
  matchNote: string | null
}

export interface RebuildResult {
  totalOrgs: number
  skippedManual: number
  saved: number
  sigunguMatched: number
  countsByCategory: Record<string, number>
}

// ============================================
// 설계사무소
// ============================================

/** 설계사무소관리 권역 트리 — 사용 중 권역별 수 (상위는 하위 합을 화면에서 더한다) */
export interface DesignOfficeRegionTree {
  regions: {
    regionId: number
    regionCode: string
    regionName: string
    parentRegionId: number | null
    sortOrder: number | null
    /** 이 권역에 직접 속한 시군구의 사무소 수 */
    officeCount: number
  }[]
  /** 시군구는 있으나 어느 권역에도 없는 곳 (광역시·세종·제주 등) */
  unassigned: number
  /** 소재 시군구 미판정 */
  noSigungu: number
  total: number
  /** 로그인한 대리점 직원의 담당 권역 (리드파워 직원은 빈 목록) */
  myRegionIds: number[]
}

/** 설계사무소 영업상태 필터 — 기본은 '' (영업 중 + 아직 확인 전) */
export type DesignOfficeBizFilter = '' | 'ALL' | 'NONE' | 'CLOSED' | '02' | '03' | '99'

export interface DesignOfficeSearchParams {
  keyword?: string
  sidoCd?: string
  /** true 면 소재 시군구 미판정만 */
  noSigungu?: boolean
  /** 권역 (그 권역 + 하위 권역) */
  regionId?: number
  /** true 면 권역 미배정만 */
  unassigned?: boolean
  /** 영업상태 — 없음(기본: 영업 중+확인 전) / ALL / NONE / CLOSED(휴업·폐업·미등록) / 02 / 03 / 99 */
  bizStatus?: DesignOfficeBizFilter
  /** 0-based */
  page: number
  size: number
}

export const DESIGN_OFFICE_BIZ_FILTERS: { value: DesignOfficeBizFilter, label: string }[] = [
  { value: '', label: '영업 중 (기본)' },
  { value: 'CLOSED', label: '휴업·폐업·미등록' },
  { value: '03', label: '폐업' },
  { value: '02', label: '휴업' },
  { value: '99', label: '국세청 미등록' },
  { value: 'NONE', label: '확인 전' },
  { value: 'ALL', label: '전체' }
]

/** 나라장터 업체정보 일괄 보강 결과 */
export interface DesignOfficeEnrichResult {
  /** 본 곳 (주소·시군구가 빈 곳, 최대 300) */
  checked: number
  /** 한 칸이라도 채운 곳 */
  filled: number
  /** 채운 주소로 소재 시군구까지 판정된 곳 */
  sigunguResolved: number
  /** 업체정보를 못 찾았거나 채울 것이 없던 곳 */
  notFound: number
}

export interface DesignOffice {
  designOfficeId: number
  companyName: string
  businessNumber: string | null
  representative: string | null
  address: string | null
  detailAddress: string | null
  zipCode: string | null
  tel: string | null
  email: string | null
  sigunguCd: string | null
  sigunguNm: string | null
  architectRegNo: string | null
  remarks: string | null
  createdAt: string | null
  updatedAt: string | null
  /** 영업상태 (국세청) 01 계속 / 02 휴업 / 03 폐업 / 99 미등록 — 확인 전이면 null */
  bizSttCd: '01' | '02' | '03' | '99' | null
  bizSttNm: string | null
  /** 폐업일 */
  bizEndDt: string | null
  /** 영업상태 확인 시각 (UTC) */
  bizCheckedAt: string | null
}

/** 백엔드 comm PageResponse (현재 페이지 필드명 `page`, 0-based) */
export interface DesignOfficePage {
  content: DesignOffice[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface DesignOfficeRequest {
  companyName: string
  businessNumber: string | null
  representative: string | null
  address: string | null
  detailAddress: string | null
  zipCode: string | null
  tel: string | null
  email: string | null
  /** 비우면 서버가 주소로 자동 판정 */
  sigunguCd: string | null
  architectRegNo: string | null
  remarks: string | null
}
