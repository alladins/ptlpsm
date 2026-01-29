/**
 * 세션 만료 모니터링 플러그인
 *
 * 기능:
 * 1. 주기적으로 토큰 만료 여부 체크 (1분마다)
 * 2. 탭 전환 후 돌아올 때 즉시 체크
 * 3. 만료 시 자동 로그아웃 및 로그인 페이지 이동
 */

import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  // 클라이언트에서만 실행
  if (!process.client) return

  const authStore = useAuthStore()
  const router = useRouter()

  // 1분마다 토큰 만료 체크
  const CHECK_INTERVAL = 60 * 1000  // 1분

  // 중복 알림 방지 플래그
  let isHandlingExpiry = false

  const checkSession = () => {
    // 이미 만료 처리 중이면 스킵
    if (isHandlingExpiry) return

    // 로그인 상태가 아니면 체크 안 함
    if (!authStore.isLoggedIn) return

    // 토큰 만료 확인
    if (authStore.isTokenExpired) {
      isHandlingExpiry = true
      console.log('⏰ 세션 만료 감지: 자동 로그아웃')

      // 현재 경로 저장 (로그인 후 복귀용)
      const currentPath = router.currentRoute.value.fullPath
      if (!currentPath.startsWith('/login')) {
        localStorage.setItem('redirectAfterLogin', currentPath)
      }

      // 인증 데이터 정리
      authStore.clearAuthData()

      // 알림 표시
      alert('세션이 만료되었습니다. 다시 로그인해주세요.')

      // 로그인 페이지로 이동
      router.push('/login').finally(() => {
        isHandlingExpiry = false
      })
    }
  }

  // 주기적 체크 시작
  const intervalId = setInterval(checkSession, CHECK_INTERVAL)

  // 페이지 visibility 변경 시에도 체크 (탭 전환 후 돌아올 때)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkSession()
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 초기 체크 (페이지 로드 시)
  setTimeout(checkSession, 1000)

  console.log('✅ 세션 모니터링 시작됨 (1분 간격)')
})
