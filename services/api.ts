// API 환경 설정 서비스
// 환경별 설정
const ENV_CONFIG = {
  // 운영 환경: shipmg.lphydrofoam.com (포트 9030)
  production: {
    domain: 'shipmg.lphydrofoam.com',
    apiUrl: 'http://shipmg.lphydrofoam.com:9030/api',
    port: 9030
  },
  // 개발 환경: leadpower.platree.com (포트 9031)
  development: {
    domain: 'leadpower.platree.com',
    apiUrl: 'http://leadpower.platree.com:9031/api',
    port: 9031
  },
  // 로컬 개발 환경
  local: {
    domain: 'localhost',
    apiUrl: 'http://localhost:9031/api',
    port: 9031
  }
} as const

export const apiEnvironment = {
  /**
   * 현재 API 환경 확인
   */
  getCurrentEnvironment(): 'development' | 'production' {
    if (process.client) {
      const hostname = window.location.hostname

      // 1. 운영 도메인 확인 (shipmg.lphydrofoam.com)
      if (hostname === ENV_CONFIG.production.domain) {
        return 'production'
      }

      // 2. 개발 도메인 확인 (leadpower.platree.com)
      if (hostname === ENV_CONFIG.development.domain) {
        return 'development'
      }

      // 3. localhost인 경우 localStorage 설정 또는 기본값 development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const stored = localStorage.getItem('api_environment') as 'development' | 'production'
        return stored || 'development'
      }

      // 4. 기타 도메인은 production으로 처리
      return 'production'
    }
    // SSR/SSG 빌드 시 기본값은 production
    return 'production'
  },

  /**
   * API 환경 설정 (개발 디버깅용)
   */
  setEnvironment(env: 'development' | 'production') {
    if (process.client) {
      localStorage.setItem('api_environment', env)
      console.log(`🔧 API 환경이 ${env}로 설정되었습니다. (hostname 자동 감지가 우선 적용됩니다)`)
    }
  },

  /**
   * API 기본 URL 가져오기
   */
  getApiBaseUrl(): string {
    if (process.client) {
      const hostname = window.location.hostname

      // 운영 도메인
      if (hostname === ENV_CONFIG.production.domain) {
        return ENV_CONFIG.production.apiUrl
      }

      // 개발 도메인
      if (hostname === ENV_CONFIG.development.domain) {
        return ENV_CONFIG.development.apiUrl
      }

      // localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const stored = localStorage.getItem('api_environment')
        if (stored === 'production') {
          return ENV_CONFIG.production.apiUrl
        }
        return ENV_CONFIG.local.apiUrl
      }
    }

    // SSR/SSG 빌드 시 기본값
    return ENV_CONFIG.production.apiUrl
  },

  /**
   * 환경 강제 설정 - 운영 (개발용)
   */
  forceProduction() {
    if (process.client) {
      localStorage.setItem('api_environment', 'production')
      console.log('🚀 API 환경을 운영 모드로 설정했습니다. 페이지를 새로고침하세요.')
      console.log(`   API URL: ${ENV_CONFIG.production.apiUrl}`)
    }
  },

  /**
   * 환경 강제 설정 - 개발 (개발용)
   */
  forceDevelopment() {
    if (process.client) {
      localStorage.setItem('api_environment', 'development')
      console.log('🔧 API 환경을 개발 모드로 설정했습니다. 페이지를 새로고침하세요.')
      console.log(`   API URL: ${ENV_CONFIG.development.apiUrl}`)
    }
  },

  /**
   * 현재 환경 정보 출력 (디버깅용)
   */
  printStatus() {
    if (process.client) {
      const hostname = window.location.hostname
      const env = this.getCurrentEnvironment()
      const apiUrl = this.getApiBaseUrl()

      console.log('========== API 환경 정보 ==========')
      console.log(`현재 호스트: ${hostname}`)
      console.log(`환경: ${env === 'production' ? '🚀 운영' : '🔧 개발'}`)
      console.log(`API URL: ${apiUrl}`)
      console.log('===================================')
      console.log('환경 변경 명령어:')
      console.log('  - apiEnvironment.forceProduction()  // 운영 API 사용')
      console.log('  - apiEnvironment.forceDevelopment() // 개발 API 사용')
      console.log('===================================')
    }
  },

  /**
   * 환경 설정 정보 반환
   */
  getConfig() {
    return ENV_CONFIG
  }
};

// 편의를 위한 직접 export 함수들
export const getApiBaseUrl = () => apiEnvironment.getApiBaseUrl();
export const getCurrentEnvironment = () => apiEnvironment.getCurrentEnvironment();
export const setEnvironment = (env: 'development' | 'production') => apiEnvironment.setEnvironment(env);

/**
 * 공통 인증 헤더 생성
 * 모든 API 호출에서 사용
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
  }
}
