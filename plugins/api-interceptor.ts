/**
 * 전역 API 인터셉터 플러그인
 *
 * 기능:
 * 1. 모든 fetch 요청에 Authorization 헤더 자동 추가
 * 2. 401/403 에러 발생 시 자동으로 로그인 페이지 리다이렉트
 * 3. 인증 데이터 자동 정리
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
    }

    try {
      // 실제 fetch 호출
      const response = await originalFetch(input, init)

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
