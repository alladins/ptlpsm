/**
 * 방문자 추적 시스템 v2 타입 정의.
 */

export interface VisitRecordRequest {
  pagePath: string
  refererUrl?: string
  pageTitle?: string
  screenResolution?: string
  language?: string
  clientTimestamp?: string
  visitDuration?: number
  pageLoadTime?: number
  maxScroll?: number
  lastClickX?: number
  lastClickY?: number
  lastClickElement?: string
}

export interface VisitCompanyStatsDaily {
  id?: number
  visitDate: string
  companyId: number
  totalVisits: number
  uniqueUsers: number
  uniqueIps: number
  uniqueFingerprints: number
  businessHourVisits: number
  offHourVisits: number
  apiCallCount: number
}

export interface VisitUserStatsDaily {
  id?: number
  visitDate: string
  userId: number
  companyId?: number
  totalVisits: number
  pageViews: number
  apiCalls: number
  avgDurationMs: number
  distinctIpCount: number
  distinctFingerprintCount: number
  firstVisitAt?: string
  lastVisitAt?: string
}

export interface CompanyTodayLive {
  companyId: number
  totalVisits: number
  uniqueUsers: number
  uniqueIps: number
  uniqueFingerprints: number
}

export interface UserTodayLive {
  userId: number
  companyId: number
  totalVisits: number
  uniqueIps: number
  uniqueFingerprints: number
  firstVisitAt: string
  lastVisitAt: string
}

export interface HourDistribution {
  hour: number
  visitCount: number
  uniqueUsers: number
}

export interface CompanyIpUsage {
  ipAddress: string
  visitCount: number
  distinctUsers: number
  firstSeenAt: string
  lastSeenAt: string
}

export interface ApiCallLog {
  id: number
  userId?: number
  companyId?: number
  ipAddress: string
  clientFingerprint?: string
  httpMethod: string
  requestUri: string
  statusCode?: number
  responseTimeMs?: number
  calledAt: string
  callDate: string
}

export interface VisitIpWhitelist {
  id: number
  companyId: number | null  // BLACK 일 때 null 가능
  ipAddress: string
  ipRangeCidr?: string
  description?: string
  isActive: boolean
  listType: 'WHITE' | 'BLACK'  // 목록 유형
  registeredBy?: number
  registeredAt: string
}

export interface VisitIpWhitelistRequest {
  companyId?: number | null  // BLACK 일 때 미지정/null 허용
  ipAddress: string
  ipRangeCidr?: string
  description?: string
  isActive?: boolean
  listType?: 'WHITE' | 'BLACK'  // 기본 WHITE
}

export const IP_LIST_TYPE = {
  WHITE: 'WHITE',
  BLACK: 'BLACK'
} as const
export type IpListType = typeof IP_LIST_TYPE[keyof typeof IP_LIST_TYPE]
export const IP_LIST_TYPE_LABELS: Record<IpListType, string> = {
  WHITE: '화이트리스트 (알림 예외)',
  BLACK: '블랙리스트 (차단)'
}

export const VISIT_ALERT_TYPES = {
  INACTIVE_COMPANY: 'INACTIVE_COMPANY',
  UNKNOWN_IP: 'UNKNOWN_IP',
  ACCOUNT_SHARE_SUSPECT: 'ACCOUNT_SHARE_SUSPECT'
} as const

export type VisitAlertType = typeof VISIT_ALERT_TYPES[keyof typeof VISIT_ALERT_TYPES]

export const VISIT_ALERT_LABELS: Record<VisitAlertType, string> = {
  [VISIT_ALERT_TYPES.INACTIVE_COMPANY]: '미접속 회사',
  [VISIT_ALERT_TYPES.UNKNOWN_IP]: '비정상 IP',
  [VISIT_ALERT_TYPES.ACCOUNT_SHARE_SUSPECT]: '계정 공유 의심'
}

export const VISIT_ALERT_STATUS = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  IGNORED: 'IGNORED'
} as const

export type VisitAlertStatus = typeof VISIT_ALERT_STATUS[keyof typeof VISIT_ALERT_STATUS]

export interface VisitAlert {
  id: number
  alertType: VisitAlertType
  severity: string
  status: VisitAlertStatus
  targetCompanyId?: number
  targetUserId?: number
  targetIp?: string
  detailJson?: string
  detectedAt: string
  resolvedAt?: string
  resolvedBy?: number
  resolvedNote?: string
}

export interface VisitAlertResolveRequest {
  status: 'RESOLVED' | 'IGNORED'
  note?: string
}

export interface PagedResponse<T> {
  rows: T[]
  total: number
  page: number
  size: number
}
