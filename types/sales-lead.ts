/**
 * 영업관리 5단계-A — 나라장터 낙찰·계약 수집 (영업 리드) 타입
 *
 * 백엔드: /api/admin/sales-leads
 * 날짜(eventDate·firstSeenDate 등)는 'yyyy-MM-dd' 문자열,
 * 시각(sourceRgstDt·createdAt·startedAt 등)은 UTC — 표시할 때 ~/utils/format 의 formatDateTime 사용.
 * 담당 판정 상태(resolveStatus)의 라벨·색은 types/agency.ts 의 RESOLVE_STATUS_LABELS·resolveStatusBadge 를 쓴다.
 */
import type { ResolveStatus } from '~/types/agency'

// ============================================
// 코드 상수
// ============================================

/** 리드 종류 */
export type LeadKind = 'DESIGN' | 'CONSTRUCTION' | 'OTHER'
export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
  DESIGN: '건축설계',
  CONSTRUCTION: '건축공사',
  OTHER: '기타'
}

/** 목록 «종류» 필터 — '' 는 서버 기본값(설계+공사) */
export const LEAD_KIND_FILTER_OPTIONS: { value: string, label: string }[] = [
  { value: '', label: '설계+공사' },
  { value: 'DESIGN', label: '설계' },
  { value: 'CONSTRUCTION', label: '공사' },
  { value: 'OTHER', label: '기타' },
  { value: 'ALL', label: '전체' }
]

/** 수집 출처 */
export type LeadSource = 'G2B_AWARD' | 'G2B_CONTRACT'
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  G2B_AWARD: '낙찰',
  G2B_CONTRACT: '계약(수의)'
}

/** 업무 구분 */
export type LeadBizType = 'SERVC' | 'CNSTWK'
export const LEAD_BIZ_TYPE_LABELS: Record<LeadBizType, string> = {
  SERVC: '용역',
  CNSTWK: '공사'
}

/** 입찰공고 보강 여부 */
export const LEAD_ENRICHED_LABELS: Record<string, string> = {
  Y: '보강됨',
  E: '보강 실패',
  N: '미보강'
}

/** 수집 작업 */
export const COLLECT_JOB_LABELS: Record<string, string> = {
  AWARD_SERVC: '낙찰(용역)',
  AWARD_CNSTWK: '낙찰(공사)',
  NOTICE_ENRICH: '입찰공고 보강',
  CONTRACT_SERVC: '계약(수의)',
  POST_PROCESS: '후처리(판별·설계사무소·담당)',
  ALL: '전체'
}

/** 작업 라벨 — IMPORT_* 는 모두 «붙여넣기 적재» */
export function collectJobLabel (job?: string | null): string {
  if (!job) { return '-' }
  if (job.startsWith('IMPORT_')) { return `붙여넣기 적재 (${job.substring('IMPORT_'.length)})` }
  return COLLECT_JOB_LABELS[job] || job
}

/** 실행 방식 */
export const COLLECT_TRIGGER_LABELS: Record<string, string> = {
  SCHEDULE: '자동',
  MANUAL: '수동'
}

/** 실행 상태 */
export type CollectRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
export const COLLECT_RUN_STATUS_LABELS: Record<CollectRunStatus, string> = {
  RUNNING: '진행 중',
  COMPLETED: '완료',
  FAILED: '실패',
  SKIPPED: '건너뜀'
}
/** 실행 상태 배지 색 (admin-common.css 의 .status-badge 변형) */
export const COLLECT_RUN_STATUS_BADGE: Record<CollectRunStatus, string> = {
  RUNNING: 'primary',
  COMPLETED: 'success',
  FAILED: 'danger',
  SKIPPED: 'warning'
}

/** 사업자번호 10자리 → 000-00-00000 (자릿수가 다르면 그대로) */
export function formatBizno (bizno?: string | null): string {
  if (!bizno) { return '-' }
  const digits = bizno.replace(/[^0-9]/g, '')
  if (digits.length !== 10) { return bizno }
  return `${digits.substring(0, 3)}-${digits.substring(3, 5)}-${digits.substring(5)}`
}

/** yyyy-MM-dd 에 일수를 더한다 (시간대 영향 없이 날짜만 계산) */
export function addDays (date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().substring(0, 10)
}

// ============================================
// 영업 리드
// ============================================

export interface SalesLead {
  leadId: number
  source: LeadSource
  bizType: LeadBizType
  refNo: string
  refOrd: string
  refClsfc: string
  refRbid: string
  /** 숫자만 */
  winnerBizno: string
  title: string | null
  dminsttCd: string | null
  dminsttNm: string | null
  winnerNm: string | null
  winnerCeo: string | null
  winnerAddr: string | null
  winnerTel: string | null
  amount: number | null
  eventDate: string | null
  sourceRgstDt: string | null
  siteRegionNm: string | null
  clsfcNm: string | null
  srvceDivNm: string | null
  mainCnsttyNm: string | null
  enriched: 'Y' | 'E' | 'N' | null
  leadKind: LeadKind | null
  kindReason: string | null
  designOfficeId: number | null
  officeNote: string | null
  resolveStatus: ResolveStatus | null
  regionId: number | null
  agencyId: number | null
  resolveNote: string | null
  resolvedAt: string | null
  firstSeenDate: string | null
  /** 상세 조회에만 들어온다 (원천 응답 한 건의 JSON 문자열) */
  rawJson?: string | null
  createdAt: string | null
  updatedAt: string | null
  agencyName: string | null
  agencyCode: string | null
  regionName: string | null
  designOfficeName: string | null
}

export interface SalesLeadSearchParams {
  fromDate?: string
  toDate?: string
  leadKind?: string
  source?: string
  resolveStatus?: string
  agencyId?: number | null
  keyword?: string
  page: number
  size: number
}

/** 백엔드 comm PageResponse (현재 페이지 필드명이 `page`, 0-based) */
export interface SalesLeadPage {
  content: SalesLead[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

/** 아침 요약 — 대리점별 묶음 (agencyId 가 null 이면 «미배정», 맨 뒤) */
export interface LeadDigestGroup {
  agencyId: number | null
  agencyCode: string | null
  agencyName: string | null
  /** 받을 영업직원 수 */
  recipientCount: number
  designCount: number
  constructionCount: number
  leads: SalesLead[]
}

// ============================================
// 수집 실행
// ============================================

export interface SalesCollectStatus {
  /** 06:00 자동 수집 켜짐 */
  scheduleEnabled: boolean
  /** 나라장터 API 인증키 설정됨 */
  keyConfigured: boolean
  /** 지금 수집 중 */
  running: boolean
  windowDays: number
  maxCallsPerRun: number
  /** 지금 수집할 수 없는 이유 (null 이면 가능) */
  blockedReason: string | null
}

export interface SalesCollectRun {
  runId: number
  job: string
  triggerType: 'SCHEDULE' | 'MANUAL' | string
  windowFrom: string | null
  windowTo: string | null
  status: CollectRunStatus
  apiCalls: number
  fetched: number
  inserted: number
  updated: number
  message: string | null
  startedBy: string | null
  startedAt: string | null
  finishedAt: string | null
}

/** 붙여넣기 적재 종류 */
export type ImportKind = 'AWARD' | 'CONTRACT'
