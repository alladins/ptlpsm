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

      // 모바일 납품확인(/api/m/**)은 URL 토큰만으로 접근하는 공개 경로다.
      // 로그인 세션과 무관하므로 403 이 와도 로그인 페이지로 보내면 안 된다.
      // (이미 완료된 납품 링크를 다시 열면 백엔드가 403 을 준다 → 고객이 로그인 창을 보게 됨)
      const isPublicMobileApi = url.includes('/api/m/')

      /**
       * 403 을 전부 «세션 만료» 로 보면 안 된다.
       *
       * 이 백엔드는 토큰이 없거나 틀렸을 때도 401 이 아니라 403 을 준다(실측).
       * 그래서 403 을 그냥 무시하면 진짜 만료된 사람이 로그인 화면으로 못 간다.
       * 반대로 전부 로그아웃시키면 «권한 없는 버튼을 눌렀을 뿐인데 튕기는» 일이 생긴다.
       *   (실측: 제조사 담당자가 발주서 [접수] 를 누르자 403 → 강제 로그아웃)
       *
       * 그래서 «우리가 아직 살아 있다고 믿는 토큰을 들고 있었는가» 로 가른다.
       *   들고 있었다면 → 권한 부족. 로그아웃하지 않는다.
       *   없거나 만료됐다면 → 세션 만료. 로그인으로 보낸다.
       */
      const hasLiveToken = (() => {
        if (!process.client) { return false }
        try {
          if (!localStorage.getItem('auth_access_token')) { return false }
          const expiry = Number(localStorage.getItem('auth_token_expiry') || 0)
          return !expiry || expiry > Date.now()
        } catch { return false }
      })()

      const isPermissionDenied = response.status === 403 && hasLiveToken
      if (isPermissionDenied && !isPublicMobileApi) {
        console.warn('권한 없음(403) — 세션은 유지합니다:', url)
      }

      // 401 Unauthorized 또는 (세션이 없는 상태의) 403 처리
      if ((response.status === 401 || response.status === 403) && !isPublicMobileApi && !isPermissionDenied) {
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
