/**
 * 영업관리 › 조달 영업 현황 — 나라장터 쇼핑몰 납품요구(단열재) 집계
 * docs/PLAN_조달영업현황_20261014.md
 */

/** 집계 1행 (업체 단위) — 묶는 기준에 따라 year / sidoCd / sigunguCd 중 하나가 채워진다 */
export interface MallStatRow {
  year?: number | null
  sidoCd?: string | null
  sigunguCd?: string | null
  sigunguNm?: string | null
  /** 수요기관 — 기관별에서만 */
  dminsttNaroCd?: string | null
  dminsttNm?: string | null
  dminsttDivNm?: string | null
  corpBizno: string | null
  corpNm: string | null
  amount: number
  reqCount: number
}

export interface MallDashboard {
  years: number[]
  year: number
  target: string | null
  targets: string[]
  /** 자사(리드파워) 사업자번호 */
  selfBizno: string | null
  /** 수집이 온전히 덮은 첫 해 (이 해부터 연도 목록·추이) */
  coveredFromYear: number | null
  /** 가장 최근 납품요구 접수일 */
  dataAsOf: string | null
  corps: MallStatRow[]
  sidoCorps: MallStatRow[]
  yearCorps: MallStatRow[]
}

export interface MallDlvrReqItem {
  dlvrReqNo: string
  prdctSno: number
  chgOrd: number
  firstRcptDate: string | null
  lastRcptDate: string | null
  fnlYn: string
  prdctClsfcNm: string | null
  dtilPrdctClsfcNm: string | null
  prdctIdntNm: string | null
  uprc: number | null
  unit: string | null
  qty: number | null
  amt: number
  dminsttNm: string | null
  dminsttDivNm: string | null
  dminsttRgnNm: string | null
  sidoCd: string | null
  sigunguCd: string | null
  corpNm: string | null
  corpBizno: string | null
  cntrctStleNm: string | null
  dlvrReqNm: string | null
}

export interface MallItemSearchParams {
  year?: number | ''
  target?: string
  sidoCd?: string
  /** NONE = 시군구 없는(시도 단위) 기관 */
  sigunguCd?: string
  dminsttNaroCd?: string
  /** 현황 탭에서 넘어온 시군구·기관 범위 표시 (서버로 안 보냄) */
  scopeLabel?: string
  corpBizno?: string
  keyword?: string
  page?: number
  size?: number
}

export interface MallItemPage {
  content: MallDlvrReqItem[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface MallCollectStatus {
  scheduleEnabled: boolean
  keyConfigured: boolean
  running: boolean
  targets: string[]
  blockedReason: string | null
}

/** 시도코드(법정동) → 짧은 이름. 강원 51·전북 52 는 특별자치도 출범 후 코드 */
export const SIDO_NAMES: Record<string, string> = {
  11: '서울',
  26: '부산',
  27: '대구',
  28: '인천',
  29: '광주',
  30: '대전',
  31: '울산',
  36: '세종',
  41: '경기',
  /** 경기는 영업 권역대로 북부·남부로 나눠 본다 (지도·표) */
  '41N': '경기북부',
  '41S': '경기남부',
  43: '충북',
  44: '충남',
  46: '전남',
  47: '경북',
  48: '경남',
  50: '제주',
  51: '강원',
  52: '전북'
}

/** 시도 표시 순서 (행정 순) — 경기는 북부·남부 */
export const SIDO_ORDER = ['11', '26', '27', '28', '29', '30', '31', '36', '41N', '41S', '51', '43', '44', '52', '46', '47', '48', '50']

export function sidoName (code?: string | null): string {
  if (!code) { return '미판정' }
  return SIDO_NAMES[code] || code
}

/** 억 원 단위 (소수 digits 자리) */
export function formatEok (amount?: number | null, digits = 1): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) { return '-' }
  return `${(Number(amount) / 100000000).toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}억`
}
