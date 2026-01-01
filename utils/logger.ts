/**
 * 프로덕션 안전 로깅 유틸리티
 *
 * 개발 환경에서만 debug/info 로그를 출력하고,
 * 프로덕션 환경에서는 warn/error만 출력합니다.
 *
 * 사용법:
 * import { logger } from '~/utils/logger'
 * logger.debug('디버그 메시지')
 * logger.info('정보 메시지')
 * logger.warn('경고 메시지')
 * logger.error('에러 메시지')
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 프로덕션 환경인지 확인
 * - process.env.NODE_ENV가 'production'이면 프로덕션
 * - hostname이 localhost/127.0.0.1이 아니면 프로덕션
 */
const isProduction = (): boolean => {
  // 빌드 시점 환경 변수 체크
  if (process.env.NODE_ENV === 'production') {
    return true
  }

  // 런타임 hostname 체크 (브라우저 환경에서)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return true
    }
  }

  return false
}

/**
 * 로그 포맷팅
 */
const formatLog = (level: LogLevel, args: any[]): any[] => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return [prefix, ...args]
}

/**
 * 로거 인스턴스
 */
export const logger = {
  /**
   * 디버그 로그 (개발 환경에서만 출력)
   */
  debug(...args: any[]): void {
    if (!isProduction()) {
      console.log(...formatLog('debug', args))
    }
  },

  /**
   * 정보 로그 (개발 환경에서만 출력)
   */
  info(...args: any[]): void {
    if (!isProduction()) {
      console.info(...formatLog('info', args))
    }
  },

  /**
   * 경고 로그 (모든 환경에서 출력)
   */
  warn(...args: any[]): void {
    console.warn(...formatLog('warn', args))
  },

  /**
   * 에러 로그 (모든 환경에서 출력)
   * 선택적으로 에러 모니터링 서비스로 전송 가능
   */
  error(...args: any[]): void {
    console.error(...formatLog('error', args))

    // TODO: 프로덕션에서 에러 모니터링 서비스로 전송
    // if (isProduction()) {
    //   sendToErrorMonitoring(args)
    // }
  },

  /**
   * 그룹 로그 시작 (개발 환경에서만)
   */
  group(label: string): void {
    if (!isProduction()) {
      console.group(label)
    }
  },

  /**
   * 그룹 로그 종료 (개발 환경에서만)
   */
  groupEnd(): void {
    if (!isProduction()) {
      console.groupEnd()
    }
  },

  /**
   * 테이블 로그 (개발 환경에서만)
   */
  table(data: any): void {
    if (!isProduction()) {
      console.table(data)
    }
  },

  /**
   * 시간 측정 시작 (개발 환경에서만)
   */
  time(label: string): void {
    if (!isProduction()) {
      console.time(label)
    }
  },

  /**
   * 시간 측정 종료 (개발 환경에서만)
   */
  timeEnd(label: string): void {
    if (!isProduction()) {
      console.timeEnd(label)
    }
  }
}

/**
 * 조건부 로그 (조건이 true일 때만 출력)
 */
export const logIf = (condition: boolean, level: LogLevel, ...args: any[]): void => {
  if (condition) {
    logger[level](...args)
  }
}

/**
 * 한 번만 로그 (같은 메시지는 한 번만 출력)
 */
const loggedOnce = new Set<string>()

export const logOnce = (level: LogLevel, key: string, ...args: any[]): void => {
  if (!loggedOnce.has(key)) {
    loggedOnce.add(key)
    logger[level](...args)
  }
}
