// 실제 인증 미들웨어
import { useAuthStore } from '~/stores/auth'
import { usePermissionStore } from '~/stores/permission'

export default defineNuxtRouteMiddleware(async (to) => {
  // 서버 사이드에서는 인증 검사를 수행하지 않음
  if (process.server) {
    console.log('서버 사이드 렌더링: 인증 검사 건너뜀')
    return
  }
  
  // 클라이언트 측에서만 인증 스토어 사용
  const authStore = useAuthStore()
  
  // *** 중요: 먼저 로컬 스토리지에서 인증 상태 복원 및 서버 검증 ***
  if (process.client) {
    console.log('미들웨어: 인증 상태 복원 및 서버 검증 시도 (페이지 경로:', to.path, ')')
    const isValid = await authStore.checkAuth()

    // checkAuth() 실패 시 (서버 토큰 검증 실패)
    if (!isValid && to.path.startsWith('/admin')) {
      console.warn('서버 토큰 검증 실패: 로그인 페이지로 리다이렉트')
      localStorage.setItem('redirectAfterLogin', to.fullPath)
      return navigateTo('/login')
    }
  }
  
  // 이제 복원된 인증 상태를 기반으로 로그인 상태 확인
  console.log('인증 미들웨어 실행 (상태 복원 후):', {
    경로: to.path,
    로그인상태: authStore.isLoggedIn,
    토큰만료: authStore.isTokenExpired,
    사용자비활성: authStore.isUserInactive,
    마지막활동: authStore.lastActivity ? new Date(authStore.lastActivity).toLocaleString() : '없음',
    토큰만료시간: authStore.tokenExpiry ? new Date(authStore.tokenExpiry).toLocaleString() : '없음',
    역할: authStore.role
  })

  // 로그인 상태인 경우 활동 시간 업데이트
  if (authStore.isLoggedIn) {
    // 사용자 활동 시간 업데이트
    authStore.updateLastActivity()
  }

  // 로그인 페이지는 제외
  if (to.path === '/login') {
    // 이미 로그인된 상태에서 로그인 페이지 접근 시 대시보드로 리다이렉트
    if (authStore.isLoggedIn && !authStore.isUserInactive) {
      console.log('이미 로그인된 상태: 대시보드로 리다이렉트')
      return navigateTo('/admin/dashboard')
    }
    return
  }

  // 공개 모바일 페이지는 인증 불필요 (토큰 기반 접근)
  if (to.path.startsWith('/m/')) {
    return
  }

  // admin 경로에 대한 접근 제한
  if (to.path.startsWith('/admin')) {
    // 토큰 만료 확인 및 갱신 시도 (결과를 기다림)
    if (authStore.isLoggedIn && authStore.isTokenExpired) {
      console.log('토큰 만료 감지: 리프레시 토큰으로 갱신 시도')
      
      try {
        // 토큰 갱신 시도 (결과를 기다림)
        const refreshed = await authStore.refreshAccessToken()
        
        if (!refreshed) {
          console.error('토큰 갱신 실패, 로그인 페이지로 리다이렉트')
          
          // 로그인 후 현재 페이지로 돌아오기 위해 경로 저장
          localStorage.setItem('redirectAfterLogin', to.fullPath)
          
          // 인증 데이터 초기화
          authStore.clearAuthData()
          
          return navigateTo('/login')
        }
        
        console.log('토큰 갱신 성공, 페이지 접근 허용')
      } catch (error) {
        console.error('토큰 갱신 중 오류 발생:', error)
        
        // 로그인 후 현재 페이지로 돌아오기 위해 경로 저장
        localStorage.setItem('redirectAfterLogin', to.fullPath)
        
        // 인증 데이터 초기화
        authStore.clearAuthData()
        
        return navigateTo('/login')
      }
    }
    
    // 로그인 상태가 아니거나 사용자가 비활성 상태인 경우
    if (!authStore.isLoggedIn || authStore.isUserInactive) {
      console.log('인증 필요 또는 비활성 상태: 로그인 페이지로 리다이렉트', {
        로그인상태: authStore.isLoggedIn,
        사용자비활성: authStore.isUserInactive,
        마지막활동: authStore.lastActivity ? new Date(authStore.lastActivity).toLocaleString() : '없음'
      })
      
      // 로그인 후 현재 페이지로 돌아오기 위해 경로 저장
      localStorage.setItem('redirectAfterLogin', to.fullPath)
      
      // 인증 데이터 초기화
      authStore.clearAuthData()
      
      return navigateTo('/login')
    }
    
    // 로컬 개발 환경 체크 (런타임 hostname 기반 - 안전)
    const isLocalDevelopment = process.client &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')

    // 사용자 활동 시간 업데이트
    authStore.updateLastActivity()

    // 토큰 만료 임박 시 백그라운드에서 갱신 시도
    if (authStore.isTokenExpiringSoon) {
      console.log('토큰 만료 임박: 백그라운드에서 갱신 시도')
      authStore.refreshAccessToken().catch(error => {
        console.warn('백그라운드 토큰 갱신 실패:', error)
      })
    }

    // 역할 기반 접근 제어 (인증된 사용자는 /admin 접근 허용, 메뉴 레벨에서 권한 제어)
    // 로컬 개발 환경에서는 역할 체크 스킵
    if (!isLocalDevelopment) {
      const userRole = authStore.role?.toUpperCase() || ''
      console.log('사용자 역할 확인:', {
        원본역할: authStore.role,
        정규화역할: userRole,
        경로: to.path
      })

      // 인증된 사용자인지 확인 (로그인 상태는 위에서 이미 확인됨)
      // 메뉴별 권한은 SidebarMenu의 filterMenusByPermission()에서 제어
      // 역할이 없는 경우만 차단
      if (!userRole) {
        console.warn('사용자 역할이 설정되지 않았습니다:', {
          현재역할: authStore.role,
          요청경로: to.path
        })

        // 권한 부족 메시지 표시
        alert('사용자 역할이 설정되지 않았습니다. 관리자에게 문의하세요.')

        // 메인 페이지로 리다이렉트
        return navigateTo('/')
      }
    }

    // 메뉴 권한 체크 (모든 환경에서 수행)
    const permissionStore = usePermissionStore()

    // 메뉴 권한 로드 (캐시된 경우 빠르게 반환)
    await permissionStore.fetchUserMenus()

    // 현재 경로에 대한 메뉴 권한 체크
    const menu = permissionStore.findMenuByUrl(to.path)
    if (menu && !permissionStore.hasPermission(menu.menuId, 'readAuth')) {
      console.warn('메뉴 접근 권한 없음:', {
        경로: to.path,
        메뉴: menu.menuName,
        사용자역할: authStore.role
      })
      return navigateTo('/admin/unauthorized')
    }
  }
})