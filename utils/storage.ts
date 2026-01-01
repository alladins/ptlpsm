/**
 * 안전한 localStorage 접근 유틸리티
 *
 * SSR/SSG 환경에서 window 객체가 없는 경우를 안전하게 처리합니다.
 * localStorage 접근 시 발생할 수 있는 예외(쿠키 차단, 용량 초과 등)를 처리합니다.
 */

/**
 * 브라우저 환경인지 확인
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * 안전한 localStorage 접근 유틸리티
 */
export const safeStorage = {
  /**
   * localStorage에서 값 가져오기
   * @param key 키
   * @returns 값 또는 null (브라우저가 아니거나 오류 시)
   */
  getItem(key: string): string | null {
    if (!isBrowser()) return null
    try {
      return localStorage.getItem(key)
    } catch (e) {
      console.warn(`[safeStorage] getItem 실패 (${key}):`, e)
      return null
    }
  },

  /**
   * localStorage에 값 저장
   * @param key 키
   * @param value 값
   * @returns 성공 여부
   */
  setItem(key: string, value: string): boolean {
    if (!isBrowser()) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (e) {
      console.warn(`[safeStorage] setItem 실패 (${key}):`, e)
      return false
    }
  },

  /**
   * localStorage에서 값 삭제
   * @param key 키
   * @returns 성공 여부
   */
  removeItem(key: string): boolean {
    if (!isBrowser()) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.warn(`[safeStorage] removeItem 실패 (${key}):`, e)
      return false
    }
  },

  /**
   * localStorage 전체 삭제
   * @returns 성공 여부
   */
  clear(): boolean {
    if (!isBrowser()) return false
    try {
      localStorage.clear()
      return true
    } catch (e) {
      console.warn('[safeStorage] clear 실패:', e)
      return false
    }
  },

  /**
   * JSON 객체 저장 (자동 직렬화)
   * @param key 키
   * @param value 객체
   * @returns 성공 여부
   */
  setJSON<T>(key: string, value: T): boolean {
    try {
      return this.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn(`[safeStorage] setJSON 직렬화 실패 (${key}):`, e)
      return false
    }
  },

  /**
   * JSON 객체 가져오기 (자동 역직렬화)
   * @param key 키
   * @param defaultValue 기본값 (파싱 실패 시)
   * @returns 파싱된 객체 또는 기본값
   */
  getJSON<T>(key: string, defaultValue: T | null = null): T | null {
    const value = this.getItem(key)
    if (value === null) return defaultValue
    try {
      return JSON.parse(value) as T
    } catch (e) {
      console.warn(`[safeStorage] getJSON 파싱 실패 (${key}):`, e)
      return defaultValue
    }
  }
}

/**
 * 안전한 sessionStorage 접근 유틸리티
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    if (!isBrowser()) return null
    try {
      return sessionStorage.getItem(key)
    } catch (e) {
      console.warn(`[safeSessionStorage] getItem 실패 (${key}):`, e)
      return null
    }
  },

  setItem(key: string, value: string): boolean {
    if (!isBrowser()) return false
    try {
      sessionStorage.setItem(key, value)
      return true
    } catch (e) {
      console.warn(`[safeSessionStorage] setItem 실패 (${key}):`, e)
      return false
    }
  },

  removeItem(key: string): boolean {
    if (!isBrowser()) return false
    try {
      sessionStorage.removeItem(key)
      return true
    } catch (e) {
      console.warn(`[safeSessionStorage] removeItem 실패 (${key}):`, e)
      return false
    }
  }
}
