/**
 * 자연정렬 비교 함수 (숫자 포함 문자열을 올바르게 정렬)
 * 예: 'HYDRO-100' > 'HYDRO-90' > 'HYDRO-80'
 */
export function naturalCompare(a: string, b: string, desc = true): number {
  const result = a.localeCompare(b, 'ko-KR', { numeric: true, sensitivity: 'base' })
  return desc ? -result : result
}

/**
 * 배열을 특정 키 기준으로 자연정렬하여 반환 (원본 배열 변경 없음)
 */
export function naturalSortBy<T>(
  arr: T[],
  key: keyof T | ((item: T) => string),
  desc = true
): T[] {
  const getter = typeof key === 'function'
    ? key
    : (item: T) => String(item[key] ?? '')
  return [...arr].sort((a, b) => naturalCompare(getter(a), getter(b), desc))
}
