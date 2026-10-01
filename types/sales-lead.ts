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

/**
 * 목록 «단계» 필터 (서버 source 파라미터)
 * - G2B_AWARD: 낙찰 (계약까지 온 것 포함) / AWARD_CONTRACT: 낙찰 뒤 계약까지 / G2B_CONTRACT: 낙찰 없이 수의계약만
 */
export const LEAD_STAGE_FILTER_OPTIONS: { value: string, label: string }[] = [
  { value: '', label: '전체' },
  { value: 'G2B_AWARD', label: '낙찰' },
  { value: 'AWARD_CONTRACT', label: '낙찰 → 계약' },
  { value: 'G2B_CONTRACT', label: '계약(수의)만' }
]

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
  N: '미보강',
  S: '보강 대상 아님 (공고명상 건축 아님)'
}

/** 수집 작업 */
export const COLLECT_JOB_LABELS: Record<string, string> = {
  AWARD_SERVC: '낙찰(용역)',
  AWARD_CNSTWK: '낙찰(공사)',
  NOTICE_ENRICH: '입찰공고 보강',
  CONTRACT_SERVC: '계약(수의)',
  POST_PROCESS: '후처리(판별·설계사무소·담당)',
  RECLASSIFY: '다시 분류 (키워드 변경 후)',
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
  MANUAL: '수동',
  BACKFILL: '수동·과거'
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
// 영업 진행 상태 (영업관리 개선 ② — 설계 docs/DESIGN_영업리드_진행상태_20261001.md)
// ============================================

/**
 * 영업 진행 상태 — 순서 강제 없음 (어느 상태로든 바꿀 수 있다)
 * 기존 «단계»(낙찰·계약 흐름, LeadStage)와 다른 개념이라 화면 이름은 «영업 진행»
 */
export const LEAD_PROGRESS = {
  NEW: 'NEW',
  REVIEW: 'REVIEW',
  CONTACT: 'CONTACT',
  SPEC_IN: 'SPEC_IN',
  PROPOSAL: 'PROPOSAL',
  WON: 'WON',
  HOLD: 'HOLD',
  DROPPED: 'DROPPED'
} as const

export type LeadProgressStatus = typeof LEAD_PROGRESS[keyof typeof LEAD_PROGRESS]

export const LEAD_PROGRESS_LABELS: Record<LeadProgressStatus, string> = {
  [LEAD_PROGRESS.NEW]: '미확인',
  [LEAD_PROGRESS.REVIEW]: '검토 중',
  [LEAD_PROGRESS.CONTACT]: '접촉·방문',
  [LEAD_PROGRESS.SPEC_IN]: '설계 반영',
  [LEAD_PROGRESS.PROPOSAL]: '견적·제안',
  [LEAD_PROGRESS.WON]: '수주',
  [LEAD_PROGRESS.HOLD]: '보류',
  [LEAD_PROGRESS.DROPPED]: '포기'
}

/** 화면 표시 순서 (상태 버튼 줄·검색 select) */
export const LEAD_PROGRESS_ORDER: LeadProgressStatus[] = [
  LEAD_PROGRESS.NEW,
  LEAD_PROGRESS.REVIEW,
  LEAD_PROGRESS.CONTACT,
  LEAD_PROGRESS.SPEC_IN,
  LEAD_PROGRESS.PROPOSAL,
  LEAD_PROGRESS.WON,
  LEAD_PROGRESS.HOLD,
  LEAD_PROGRESS.DROPPED
]

/** 라벨 — 비어 있으면 미확인(서버 기본값 NEW), 모르는 값은 그대로 */
export function leadProgressLabel (status?: string | null): string {
  if (!status) { return LEAD_PROGRESS_LABELS.NEW }
  return LEAD_PROGRESS_LABELS[status as LeadProgressStatus] || status
}

/**
 * 이 사업에서 보여 줄 상태 버튼
 * - 설계 반영(SPEC_IN)은 설계 사업만, 견적·제안(PROPOSAL)은 공사 사업만 (서버는 막지 않음 — 종류 판별이 틀릴 수 있으므로)
 * - 종류가 안 맞아도 지금 그 상태이면 버튼을 남긴다 (현재 값이 버튼 줄에서 사라지지 않게)
 */
export function leadProgressOptions (kind?: LeadKind | null, current?: string | null): LeadProgressStatus[] {
  return LEAD_PROGRESS_ORDER.filter((s) => {
    if (s === current) { return true }
    if (s === LEAD_PROGRESS.SPEC_IN) { return kind === 'DESIGN' }
    if (s === LEAD_PROGRESS.PROPOSAL) { return kind === 'CONSTRUCTION' }
    return true
  })
}

/** 진행 상태 변경 요청 — fromStatus 는 화면이 본 현재 값 (다르면 서버가 «다른 사람이 먼저 바꿨습니다» 로 거부) */
export interface LeadProgressUpdateRequest {
  fromStatus: LeadProgressStatus
  toStatus: LeadProgressStatus
  note: string | null
}

/** 진행 상태 변경 이력 한 행 (추가만 — 수정·삭제 없음) */
export interface LeadProgressLog {
  logId: number
  leadId: number
  fromStatus: LeadProgressStatus
  toStatus: LeadProgressStatus
  note: string | null
  /** 변경 당시 담당 대리점 (스냅샷) */
  agencyId: number | null
  createdBy: string
  createdByName: string | null
  /** UTC — formatDateTime 으로 표시 */
  createdAt: string
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
  enriched: 'Y' | 'E' | 'N' | 'S' | null
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
  /** 연결된 설계사무소 주소·전화 (계약 응답에는 업체 주소가 없어 상세에서 대신 보여준다) */
  designOfficeAddress?: string | null
  designOfficeTel?: string | null
  /** 계약 행의 공고번호 (낙찰과 잇는 키) */
  ntceNo?: string | null
  /** 계약 행 → 같은 사업의 낙찰 리드 ID (있으면 목록에서는 낙찰 행에 합쳐 보인다) */
  awardLeadId?: number | null
  /** 사업 종류 — 낙찰이 기타여도 이어진 계약이 설계·공사면 그 종류 (목록·요약) */
  projectKind?: LeadKind | null
  /** 낙찰 행: 이어진 계약 수·계약일·계약금액 */
  contractCount?: number | null
  contractDate?: string | null
  contractAmount?: number | null
  /** 계약 행: 이어진 낙찰의 낙찰일 */
  awardDate?: string | null
  /** 상세: 같은 사업의 다른 낙찰·계약 행 */
  linkedLeads?: SalesLead[] | null
  /** 영업 진행 상태 (사업 단위 — 대표 행 값) */
  progressStatus?: LeadProgressStatus | null
  /** 마지막 진행 메모 */
  progressNote?: string | null
  /** 마지막 진행 변경 시각 (UTC) */
  progressAt?: string | null
  /** 마지막 진행 변경자 login_id / 이름 */
  progressBy?: string | null
  progressByName?: string | null
  /** 방치 — 설계·공사 + 미확인 + 받은 지 7일 이상 (2026-10-02 이후 받은 리드부터) */
  stale?: boolean | null
}

/**
 * 사업 단계 — 낙찰 → 계약 흐름에서 이 행이 어디까지 왔는지
 * - AWARD: 낙찰만 / AWARD_CONTRACT: 낙찰 뒤 계약까지 / CONTRACT: 낙찰 없이 수의계약
 * - AWARD_CONTRACT 는 낙찰 행(이어진 계약 있음) 또는 이어진 계약 행
 */
export type LeadStage = 'AWARD' | 'AWARD_CONTRACT' | 'CONTRACT'
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  AWARD: '낙찰',
  AWARD_CONTRACT: '낙찰 → 계약',
  CONTRACT: '계약(수의)'
}

export function leadStage (lead: SalesLead): LeadStage {
  if (lead.source === 'G2B_AWARD') {
    return (lead.contractCount || 0) > 0 ? 'AWARD_CONTRACT' : 'AWARD'
  }
  return lead.awardLeadId ? 'AWARD_CONTRACT' : 'CONTRACT'
}

/** 분류 키워드 묶음 (공통코드 LEAD_KW_* 하나) */
export interface LeadKeywordGroup {
  groupCode: string
  title: string
  description: string
  /** 어느 칸을 보는지 — 공고명 / 공공조달분류 / 주공종 */
  target: string
  words: { code: string, word: string, useYn: string, sortOrder: number | null }[]
  /** 사용 중인 키워드가 없어 코드 기본값으로 판별 중 */
  usingDefault: boolean
}

export interface SalesLeadSearchParams {
  fromDate?: string
  toDate?: string
  leadKind?: string
  source?: string
  resolveStatus?: string
  agencyId?: number | null
  keyword?: string
  /** 영업 진행 상태 — 비우면 전체 */
  progressStatus?: string
  /** 방치만 */
  staleOnly?: boolean
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
  /** 이 묶음(대리점)의 방치 리드 수 */
  staleCount?: number | null
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
  /** 과거 수집 한 번 최대 일수 */
  backfillMaxDays: number
  /** 과거 수집 시작일 하한 (yyyy-MM-dd, KST) */
  backfillMinDate: string
  /** 지금 수집할 수 없는 이유 (null 이면 가능) */
  blockedReason: string | null
}

export interface SalesCollectRun {
  runId: number
  job: string
  /** SCHEDULE 자동 / MANUAL 수동(최근 N일) / BACKFILL 수동·과거(시작일~종료일) */
  triggerType: 'SCHEDULE' | 'MANUAL' | 'BACKFILL' | string
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
