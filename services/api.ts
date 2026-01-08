// API 환경 설정 서비스
export const apiEnvironment = {
  /**
   * 현재 API 환경 확인
   */
  getCurrentEnvironment(): 'development' | 'production' {
    if (process.client) {
      // 1. hostname 기반 자동 감지 (최우선)
      const hostname = window.location.hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return 'production'
      }

      // 2. localStorage 설정 확인
      const stored = localStorage.getItem('api_environment') as 'development' | 'production'
      if (stored) {
        return stored
      }

      // 3. 기본값: localhost면 development
      return 'development'
    }
    // SSR/SSG 빌드 시 기본값은 production
    return 'production'
  },

  /**
   * API 환경 설정 (개발 디버깅용)
   */
  setEnvironment(env: 'development' | 'production') {
    if (process.client) {
      localStorage.setItem('api_environment', env);
      console.log(`🔧 API 환경이 ${env}로 설정되었습니다. (hostname 자동 감지가 우선 적용됩니다)`);
    }
  },

  /**
   * API 기본 URL 가져오기
   */
  getApiBaseUrl(): string {
    const env = this.getCurrentEnvironment()

    // 환경에 따라 API URL 반환
    // SSG(Static Site Generation) 환경에서는 프록시가 작동하지 않으므로
    // 운영/개발 모두 백엔드 서버의 절대 경로 사용
    return env === 'production'
      ? 'http://leadpower.platree.com/api'
      : 'http://localhost:9031/api'
  },

  /**
   * 환경 강제 설정 (개발용)
   */
  forceProduction() {
    if (process.client) {
      localStorage.setItem('api_environment', 'production');
      console.log('🚀 API 환경을 운영 모드로 설정했습니다. 페이지를 새로고침하세요.');
    }
  },

  /**
   * 환경 강제 설정 (개발용)
   */
  forceDevelopment() {
    if (process.client) {
      localStorage.setItem('api_environment', 'development');
      console.log('🔧 API 환경을 개발 모드로 설정했습니다. 페이지를 새로고침하세요.');
    }
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
