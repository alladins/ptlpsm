import { parseUtcDate } from '~/utils/format'

/**
 * 운송 날짜 계산 유틸리티
 * @description 출하의 expectedArrivalDatetime(납기일자) 기준으로 운송 날짜를 자동 계산
 *
 * ★ 시간대 규칙:
 *   - DB/API: UTC 기준 (예: "2025-12-03T22:00:00")
 *   - 폼 표시/입력: KST 기준 (예: "2025-12-04T07:00")
 *   - 이 모듈은 UTC 입력을 받아 KST 기준 폼 값을 반환
 *
 * 날짜 개념 정의:
 *   - 납기일자 = expectedArrivalDatetime (출고요청에서 설정, Source of Truth)
 *   - 출고일자 = dispatchAt (배차/출차 시각) = 납기일 - 1일
 *   - 출하일자 = shipmentDate (출하 등록 행정 날짜, 별도 관리)
 */

/** 운송 날짜 세트 (KST 기준, 폼 표시용) */
export interface TransportDateSet {
  /** 배송예정일 (YYYY-MM-DD, KST) */
  deliveryDate: string
  /** 도착 예정 시각 (YYYY-MM-DDTHH:mm, KST) = 납기일자 */
  expectedArrival: string
  /** 배차/출차 시각 (YYYY-MM-DDTHH:mm, KST) = 출고일자 */
  dispatchAt: string
}

/** 배차 → 도착 기본 소요일수 */
const DISPATCH_LEAD_TIME_DAYS = 1

/** 기본 시각 (07:00 KST) - 대부분 07~08시 출발이므로 07:00을 디폴트로 설정 */
const DEFAULT_HOUR = 7
const DEFAULT_MINUTE = 0

/** KST 오프셋 (밀리초) */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * UTC 날짜 문자열을 KST Date 객체로 변환
 * @param utcStr - UTC ISO 문자열 (예: "2025-12-03T22:00:00" 또는 "2025-12-03T22:00:00Z")
 * @returns KST 기준의 날짜 정보 { year, month, day, hour, minute }
 */
function utcToKstParts(utcStr: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
  const date = parseUtcDate(utcStr)
  if (isNaN(date.getTime())) return null

  // UTC 밀리초에 KST 오프셋을 더해 KST 시간 계산
  const kst = new Date(date.getTime() + KST_OFFSET_MS)
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  }
}

/**
 * 현장 도착 예정일시(납기일자) 기준으로 운송 날짜 세트를 계산
 *
 * ★ API에서 받은 UTC 값을 KST로 변환하여 폼 표시용 값을 생성합니다.
 *   (예: API "2025-12-03T22:00:00" UTC → KST "2025-12-04 07:00" 기준으로 계산)
 *
 * @param expectedArrivalDatetime - 출하의 expectedArrivalDatetime (UTC ISO 문자열)
 * @returns KST 기준 운송 날짜 세트 (폼 표시용), 또는 입력이 없으면 null
 */
export function calculateTransportDates(expectedArrivalDatetime: string | null | undefined): TransportDateSet | null {
  if (!expectedArrivalDatetime) return null

  // UTC → KST 변환하여 날짜 부분 추출
  const kst = utcToKstParts(String(expectedArrivalDatetime))
  if (!kst) return null

  const kstDateStr = `${kst.year}-${pad2(kst.month)}-${pad2(kst.day)}`
  const defaultTime = `${pad2(DEFAULT_HOUR)}:${pad2(DEFAULT_MINUTE)}`

  // 1. 배송예정일 = 납기일 = 도착 예정 시각의 날짜 (KST)
  const deliveryDate = kstDateStr

  // 2. 도착 예정 시각: 납기일 + 기본 시각 07:00 (KST)
  const expectedArrival = `${kstDateStr}T${defaultTime}`

  // 3. 배차/출차 시각: 납기일 - 1일 + 기본 시각 07:00 (KST, = 출고일자)
  const dispatchDate = new Date(Date.UTC(kst.year, kst.month - 1, kst.day - DISPATCH_LEAD_TIME_DAYS))
  const dispatchDateStr = `${dispatchDate.getUTCFullYear()}-${pad2(dispatchDate.getUTCMonth() + 1)}-${pad2(dispatchDate.getUTCDate())}`
  const dispatchAt = `${dispatchDateStr}T${defaultTime}`

  return { deliveryDate, expectedArrival, dispatchAt }
}

/**
 * 배송예정일 변경 시 배차/출차 시각, 도착 예정 시각의 날짜 부분을 동기화
 * (시간은 유지하고 날짜만 변경, 모든 값은 KST 기준)
 * @param newDeliveryDate - 변경된 배송예정일 (YYYY-MM-DD, KST)
 * @param currentDispatchAt - 현재 배차/출차 시각 (YYYY-MM-DDTHH:mm, KST)
 * @param currentExpectedArrival - 현재 도착 예정 시각 (YYYY-MM-DDTHH:mm, KST)
 */
export function syncDatesOnDeliveryDateChange(
  newDeliveryDate: string,
  currentDispatchAt: string | null,
  currentExpectedArrival: string | null
): { dispatchAt: string | null; expectedArrival: string | null } {
  if (!newDeliveryDate) return { dispatchAt: currentDispatchAt, expectedArrival: currentExpectedArrival }

  let dispatchAt = currentDispatchAt
  let expectedArrival = currentExpectedArrival

  // 도착 예정 시각: 배송예정일 = 납기일 = 도착 예정 시각 → 같은 날짜 (시간은 유지)
  if (currentExpectedArrival) {
    const time = extractTime(currentExpectedArrival)
    expectedArrival = `${newDeliveryDate}T${time}`
  }

  // 배차/출차 시각: 배송예정일 - DISPATCH_LEAD_TIME_DAYS일 (= 출고일자, 시간은 유지)
  if (currentDispatchAt) {
    const time = extractTime(currentDispatchAt)
    const [y, m, d] = newDeliveryDate.split('-').map(Number)
    const dispatchDateObj = new Date(Date.UTC(y, m - 1, d - DISPATCH_LEAD_TIME_DAYS))
    const dispatchDateStr = `${dispatchDateObj.getUTCFullYear()}-${pad2(dispatchDateObj.getUTCMonth() + 1)}-${pad2(dispatchDateObj.getUTCDate())}`
    dispatchAt = `${dispatchDateStr}T${time}`
  }

  return { dispatchAt, expectedArrival }
}

/**
 * 배차/출차 시각 변경 시 도착 예정 시각을 자동 조정
 * (도착 예정이 배차 이전이면 배차 + 1시간으로 조정)
 * 모든 입력/출력은 KST datetime-local 형식 (YYYY-MM-DDTHH:mm)
 * @param newDispatchAt - 변경된 배차/출차 시각 (KST)
 * @param currentExpectedArrival - 현재 도착 예정 시각 (KST)
 * @returns 조정된 도착 예정 시각 (KST, 변경 필요 없으면 null)
 */
export function adjustExpectedArrivalOnDispatchChange(
  newDispatchAt: string | Date | null,
  currentExpectedArrival: string | null
): string | null {
  if (!newDispatchAt) return null

  // KST datetime-local 문자열을 비교용 밀리초로 변환
  const dispatchMs = kstLocalToMs(newDispatchAt)
  const expectedMs = currentExpectedArrival ? kstLocalToMs(currentExpectedArrival) : null

  if (dispatchMs === null) return null

  // 도착 예정 시각이 배차 시각보다 이전이면 배차 시각 + 1시간으로 자동 조정
  if (!expectedMs || expectedMs <= dispatchMs) {
    const adjustedMs = dispatchMs + 60 * 60 * 1000
    return msToKstLocal(adjustedMs)
  }

  return null // 조정 불필요
}

// --- 내부 헬퍼 ---

/** 숫자를 2자리 문자열로 패딩 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * KST datetime-local 문자열 → 밀리초 (비교용)
 * "2025-12-04T07:00" (KST) → 해당 시점의 UTC 밀리초
 */
function kstLocalToMs(input: string | Date): number | null {
  if (input instanceof Date) return input.getTime()

  const parts = String(input).split(/[T ]/)
  const datePart = parts[0]
  const timePart = parts[1] || '00:00'
  if (!datePart) return null

  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)

  // KST → UTC: 9시간 빼기
  return Date.UTC(y, m - 1, d, hh, mm) - KST_OFFSET_MS
}

/**
 * UTC 밀리초 → KST datetime-local 문자열
 * @returns "YYYY-MM-DDTHH:mm" (KST)
 */
function msToKstLocal(utcMs: number): string {
  const kst = new Date(utcMs + KST_OFFSET_MS)
  const y = kst.getUTCFullYear()
  const m = pad2(kst.getUTCMonth() + 1)
  const d = pad2(kst.getUTCDate())
  const hh = pad2(kst.getUTCHours())
  const mm = pad2(kst.getUTCMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

/** 'YYYY-MM-DDTHH:mm' → 'HH:mm' (문자열 파싱, 시간대 안전) */
function extractTime(dateTimeStr: string): string {
  // 'T' 또는 공백 뒤의 시간 부분 추출
  const timePart = dateTimeStr.split(/[T ]/)[1]
  if (timePart) {
    // 'HH:mm:ss' or 'HH:mm' → 'HH:mm'
    return timePart.substring(0, 5)
  }
  // 시간 부분이 없으면 기본 시각
  return `${pad2(DEFAULT_HOUR)}:${pad2(DEFAULT_MINUTE)}`
}
