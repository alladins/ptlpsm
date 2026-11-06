/**
 * 통계 조회 기간 — 정산기간(commission_period) 표를 그대로 쓴다 (2026-11-06 사용자 결정)
 *
 * 첫 기간만 예외(2025-10 ~ 2026-12)이고 이후는 1년 단위(2027년도, 2028년도 …)다.
 * 규칙을 화면에 따로 두지 않아야 대시보드·통계의 기간이 어긋나지 않는다.
 */
import { getCommissionPeriods } from '~/services/commission.service'
import { getLocalDateString } from '~/utils/format'

export interface StatsPeriod {
  periodId: number
  periodName: string
  /** yyyy-MM-dd */
  startDate: string
  /** yyyy-MM-dd — 기간의 마지막 날 (오늘 이후일 수 있다) */
  endDate: string
  isActive: boolean
}

interface RawPeriod {
  periodId: number
  periodName: string
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  isActive?: boolean
}

export function toStatsPeriod (p: RawPeriod): StatsPeriod {
  const lastDay = new Date(p.endYear, p.endMonth, 0).getDate()
  return {
    periodId: p.periodId,
    periodName: p.periodName,
    startDate: `${p.startYear}-${String(p.startMonth).padStart(2, '0')}-01`,
    endDate: `${p.endYear}-${String(p.endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    isActive: !!p.isActive
  }
}

/** 조회 종료일 — 진행 중인 기간은 오늘까지 */
export function statsPeriodEnd (period: StatsPeriod, today = getLocalDateString()): string {
  return period.endDate < today ? period.endDate : today
}

/** 오늘이 속한 기간. 없으면 활성 기간, 그것도 없으면 첫 기간 */
export function pickCurrentStatsPeriod<T extends StatsPeriod> (periods: T[], today = getLocalDateString()): T | undefined {
  return periods.find(p => p.startDate <= today && today <= p.endDate) ||
    periods.find(p => p.isActive) ||
    periods[0]
}

/**
 * 추이 차트 축 이름 — 해를 넘기면 연도를 붙인다 (첫 기간은 «10월»이 두 번 나온다)
 * 2026-10 → 10월 / 26년 10월, 2026-W43 → 43주 / 26년 43주, 2026-10-05 → 10/5 / 26/10/5
 */
export function formatTrendLabels (periods: string[]): string[] {
  const multiYear = new Set(periods.map(p => p.slice(0, 4))).size > 1
  return periods.map((period) => {
    const yy = period.slice(2, 4)
    if (/^\d{4}-\d{2}$/.test(period)) {
      const label = `${parseInt(period.slice(5))}월`
      return multiYear ? `${yy}년 ${label}` : label
    }
    if (/^\d{4}-W\d{2}$/.test(period)) {
      const label = `${parseInt(period.slice(6))}주`
      return multiYear ? `${yy}년 ${label}` : label
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      const label = `${parseInt(period.slice(5, 7))}/${parseInt(period.slice(8))}`
      return multiYear ? `${yy}/${label}` : label
    }
    return period
  })
}

/** 이미 시작한 기간 목록. 못 읽으면 빈 목록 — 통계 화면은 기존 기본 기간으로 계속 열린다 */
export async function loadStatsPeriods (today = getLocalDateString()): Promise<StatsPeriod[]> {
  try {
    const periods: RawPeriod[] = await getCommissionPeriods()
    return periods.map(toStatsPeriod).filter(p => p.startDate <= today)
  } catch (e) {
    console.error('통계 기간 목록 조회 실패:', e)
    return []
  }
}
