/**
 * 전역 API 인터셉터 플러그인
 *
 * 기능:
 * 1. 모든 fetch 요청에 Authorization 헤더 자동 추가
 * 2. 서버에서 제공하는 새 토큰 자동 갱신 (Sliding Session)
 * 3. 401/403 에러 발생 시 자동으로 로그인 페이지 리다이렉트
 * 4. 인증 데이터 자동 정리
 */

import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  // 원본 fetch 함수 저장
  const originalFetch = window.fetch

  // fetch 함수 오버라이드
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // ✅ fetch 호출 시점에 Store와 Router 가져오기 (Pinia 초기화 이후)
    const authStore = useAuthStore()
    const router = useRouter()

    // API 요청인지 확인 (절대 경로 또는 /api로 시작)
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const isApiRequest = url.startsWith('/api') || url.includes('/api/')

    // API 요청이고 accessToken이 있으면 Authorization 헤더 추가
    if (isApiRequest && authStore.accessToken) {
      init = {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${authStore.accessToken}`
        }
      }

      // 자동 폴링 요청은 사용자 활동으로 간주하지 않음
      const isPollingRequest = url.includes('/notifications/unread-count')
      if (!isPollingRequest) {
        authStore.updateLastActivity()
      }
    }

    try {
      // 실제 fetch 호출
      const response = await originalFetch(input, init)

      // ⭐ Sliding Session: 서버에서 제공하는 새 토큰 자동 갱신
      // 백엔드가 토큰 만료 임박 시 응답 헤더에 새 토큰 포함 (30분 경과 시)
      const newAccessToken = response.headers.get('X-New-Access-Token')
      const newRefreshToken = response.headers.get('X-New-Refresh-Token')

      if (newAccessToken && newAccessToken.trim() !== '') {
        console.log('🔄 토큰 자동 갱신 (서버 제공):', {
          이전AccessToken: authStore.accessToken?.substring(0, 20) + '...',
          새AccessToken: newAccessToken.substring(0, 20) + '...',
          RefreshToken갱신: newRefreshToken ? '✅' : '❌',
          갱신시각: new Date().toLocaleString()
        })

        // Access Token 갱신
        authStore.accessToken = newAccessToken

        // Refresh Token 갱신 (서버가 제공한 경우)
        if (newRefreshToken && newRefreshToken.trim() !== '') {
          authStore.refreshToken = newRefreshToken
        }

        // localStorage 업데이트
        if (process.client) {
          localStorage.setItem('auth_access_token', newAccessToken)

          if (newRefreshToken && newRefreshToken.trim() !== '') {
            localStorage.setItem('auth_refresh_token', newRefreshToken)
          }

          // 토큰 만료 시간 갱신 (백엔드 설정과 동기화: 30분)
          const newExpiry = Date.now() + 30 * 60 * 1000
          authStore.tokenExpiry = newExpiry
          localStorage.setItem('auth_token_expiry', newExpiry.toString())

          console.log('✅ 토큰 갱신 완료:', {
            새만료시간: new Date(newExpiry).toLocaleString()
          })
        }
      }

      // 401 Unauthorized 또는 403 Forbidden 처리
      if (response.status === 401 || response.status === 403) {
        console.error('인증 오류 발생:', {
          status: response.status,
          url,
          message: response.status === 401 ? 'Unauthorized' : 'Forbidden'
        })

        // 인증 데이터 정리
        authStore.clearAuthData()

        // 현재 경로 저장 (로그인 후 복귀용)
        if (process.client) {
          const currentPath = router.currentRoute.value.fullPath
          if (!currentPath.startsWith('/login')) {
            localStorage.setItem('redirectAfterLogin', currentPath)
          }
        }

        // 로그인 페이지로 리다이렉트
        if (process.client && !url.includes('/auth/login')) {
          console.log('401/403 에러: 로그인 페이지로 리다이렉트')
          await router.push('/login')
        }
      }

      return response
    } catch (error) {
      console.error('API 요청 실패:', error)
      throw error
    }
  }
})
