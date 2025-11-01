/**
 * 납품 관련 유틸리티 함수
 */

/**
 * 긴급도 타입 정의
 */
export type DeliveryUrgency = 'overdue' | 'urgent' | 'upcoming' | 'normal'

/**
 * 두 날짜 사이의 일수 계산
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((date2.getTime() - date1.getTime()) / oneDay)
}

/**
 * 납품기한 기준 긴급도 계산
 * @param deadline 납품기한 (YYYY-MM-DD 형식)
 * @returns DeliveryUrgency
 */
export function getDeadlineUrgency(deadline: string): DeliveryUrgency {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)

    const daysUntil = daysBetween(today, deadlineDate)

    if (daysUntil < 0) return 'overdue'      // 마감 초과
    if (daysUntil <= 7) return 'urgent'      // 7일 이내
    if (daysUntil <= 30) return 'upcoming'   // 30일 이내
    return 'normal'                          // 30일 이상
  } catch (error) {
    console.error('납품기한 파싱 오류:', error)
    return 'normal'
  }
}

/**
 * 긴급도에 따른 D-day 뱃지 텍스트 생성
 * @param deadline 납품기한 (YYYY-MM-DD 형식)
 * @returns D-day 텍스트 (예: "D-5", "D+3")
 */
export function getUrgencyBadge(deadline: string): string {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)

    const daysUntil = daysBetween(today, deadlineDate)

    if (daysUntil === 0) return 'D-Day'
    if (daysUntil < 0) return `D+${Math.abs(daysUntil)}`
    return `D-${daysUntil}`
  } catch (error) {
    console.error('D-day 계산 오류:', error)
    return 'D-?'
  }
}

/**
 * 긴급도에 따른 색상 클래스 반환
 * @param urgency DeliveryUrgency
 * @returns CSS 클래스명
 */
export function getUrgencyColor(urgency: DeliveryUrgency): string {
  const colorMap: Record<DeliveryUrgency, string> = {
    overdue: 'urgency-overdue',     // 빨강 - 마감 초과
    urgent: 'urgency-urgent',       // 주황 - 7일 이내
    upcoming: 'urgency-upcoming',   // 노랑 - 30일 이내
    normal: 'urgency-normal'        // 회색 - 30일 이상
  }
  return colorMap[urgency]
}

/**
 * 납품율에 따른 색상 클래스 반환
 * @param rate 납품율 (0-100)
 * @returns CSS 클래스명
 */
export function getDeliveryRateColor(rate: number): string {
  if (rate >= 80) return 'rate-high'      // 초록 - 80% 이상
  if (rate >= 60) return 'rate-medium'    // 노랑 - 60-80%
  if (rate >= 30) return 'rate-low'       // 주황 - 30-60%
  return 'rate-critical'                   // 빨강 - 30% 미만
}

/**
 * 긴급도 레벨 (정렬/필터링용)
 * @param urgency DeliveryUrgency
 * @returns 숫자 레벨 (높을수록 긴급)
 */
export function getUrgencyLevel(urgency: DeliveryUrgency): number {
  const levelMap: Record<DeliveryUrgency, number> = {
    overdue: 4,
    urgent: 3,
    upcoming: 2,
    normal: 1
  }
  return levelMap[urgency]
}

/**
 * 긴급도 라벨 텍스트
 * @param urgency DeliveryUrgency
 * @returns 한글 라벨
 */
export function getUrgencyLabel(urgency: DeliveryUrgency): string {
  const labelMap: Record<DeliveryUrgency, string> = {
    overdue: '마감초과',
    urgent: '긴급',
    upcoming: '임박',
    normal: '여유'
  }
  return labelMap[urgency]
}
