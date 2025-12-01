import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  userId: string
  userName: string
  email: string
  role: string
}

interface ImpersonationState {
  isImpersonating: boolean
  originalUserId: string | null
  originalUserName: string | null
  originalRole: string | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiry: number | null
  lastActivity: number | null
  impersonation: ImpersonationState
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const tokenExpiry = ref<number | null>(null)
  const lastActivity = ref<number | null>(null)

  // Impersonation State (대리 로그인 상태)
  const impersonation = ref<ImpersonationState>({
    isImpersonating: false,
    originalUserId: null,
    originalUserName: null,
    originalRole: null
  })

  // Constants
  const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000 // 5분 (밀리초)
  const USER_INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30분 (밀리초)

  // Computed
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value)

  const role = computed(() => user.value?.role || null)

  const isTokenExpired = computed(() => {
    if (!tokenExpiry.value) return true
    return Date.now() >= tokenExpiry.value
  })

  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiry.value) return false
    return Date.now() >= tokenExpiry.value - TOKEN_EXPIRY_BUFFER
  })

  const isUserInactive = computed(() => {
    if (!lastActivity.value) return false
    return Date.now() - lastActivity.value > USER_INACTIVITY_TIMEOUT
  })

  // Impersonation Computed (대리 로그인)
  const isImpersonating = computed(() => impersonation.value.isImpersonating)
  const originalUser = computed(() => {
    if (!impersonation.value.isImpersonating) return null
    return {
      userId: impersonation.value.originalUserId,
      userName: impersonation.value.originalUserName,
      role: impersonation.value.originalRole
    }
  })

  // SYSTEM_ADMIN만 대리 로그인 가능
  const canImpersonate = computed(() => {
    if (impersonation.value.isImpersonating) return false // 이미 대리 로그인 중이면 불가
    return user.value?.role === 'SYSTEM_ADMIN'
  })

  // Actions
  function setAuthData(data: {
    userInfo: User
    accessToken: string
    refreshToken: string
  }) {
    user.value = data.userInfo
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    // expiresIn이 서버에서 제공되지 않으므로 기본값 3600초(1시간) 사용
    tokenExpiry.value = Date.now() + 3600 * 1000
    lastActivity.value = Date.now()

    // localStorage에 저장
    if (process.client) {
      localStorage.setItem('auth_user', JSON.stringify(data.userInfo))
      localStorage.setItem('auth_access_token', data.accessToken)
      localStorage.setItem('auth_refresh_token', data.refreshToken)
      localStorage.setItem('auth_token_expiry', tokenExpiry.value.toString())
      localStorage.setItem('auth_last_activity', lastActivity.value.toString())
    }
  }

  function clearAuthData() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    tokenExpiry.value = null
    lastActivity.value = null

    // Impersonation 상태 초기화
    impersonation.value = {
      isImpersonating: false,
      originalUserId: null,
      originalUserName: null,
      originalRole: null
    }

    // localStorage 정리
    if (process.client) {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_access_token')
      localStorage.removeItem('auth_refresh_token')
      localStorage.removeItem('auth_token_expiry')
      localStorage.removeItem('auth_last_activity')
      localStorage.removeItem('auth_impersonation')
      localStorage.removeItem('redirectAfterLogin')
    }
  }

  /**
   * 대리 로그인 시작
   * @param targetUserId 대리 로그인 대상 사용자 ID
   */
  async function startImpersonation(targetUserId: string): Promise<boolean> {
    if (!canImpersonate.value) {
      console.error('대리 로그인 권한이 없습니다')
      return false
    }

    if (user.value?.userId === targetUserId) {
      console.error('자기 자신에게는 대리 로그인할 수 없습니다')
      return false
    }

    try {
      const { getApiBaseUrl } = await import('~/services/api')
      const response = await fetch(`${getApiBaseUrl()}/common/auth/impersonate/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `대리 로그인 실패: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.message || '대리 로그인 응답 형식 오류')
      }

      const result = data.data

      // 원래 사용자 정보 저장
      impersonation.value = {
        isImpersonating: true,
        originalUserId: result.originalUserId?.toString() || user.value?.userId || null,
        originalUserName: result.originalUserName || user.value?.userName || null,
        originalRole: user.value?.role || null
      }

      // 새 토큰으로 교체
      accessToken.value = result.accessToken
      refreshToken.value = result.refreshToken
      tokenExpiry.value = Date.now() + 3600 * 1000 // 1시간

      // 대상 사용자 정보로 변경
      user.value = {
        userId: result.targetUserId?.toString() || '',
        userName: result.targetUserName || '',
        email: '', // API 응답에 없으면 빈값
        role: result.targetRole || ''
      }

      // localStorage 업데이트
      if (process.client) {
        localStorage.setItem('auth_user', JSON.stringify(user.value))
        localStorage.setItem('auth_access_token', result.accessToken)
        localStorage.setItem('auth_refresh_token', result.refreshToken)
        localStorage.setItem('auth_token_expiry', tokenExpiry.value.toString())
        localStorage.setItem('auth_impersonation', JSON.stringify(impersonation.value))
      }

      console.log('대리 로그인 성공:', {
        원래사용자: impersonation.value.originalUserName,
        대상사용자: user.value.userName,
        대상역할: user.value.role
      })

      return true
    } catch (error) {
      console.error('대리 로그인 실패:', error)
      return false
    }
  }

  /**
   * 대리 로그인 종료 (원래 계정으로 복귀)
   */
  async function stopImpersonation(): Promise<boolean> {
    if (!impersonation.value.isImpersonating) {
      console.warn('대리 로그인 중이 아닙니다')
      return false
    }

    try {
      const { getApiBaseUrl } = await import('~/services/api')
      const response = await fetch(`${getApiBaseUrl()}/common/auth/impersonate/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `대리 로그인 종료 실패: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error(data.message || '대리 로그인 종료 응답 형식 오류')
      }

      const result = data.data

      // 토큰 복원
      accessToken.value = result.accessToken
      refreshToken.value = result.refreshToken
      tokenExpiry.value = Date.now() + 3600 * 1000

      // 원래 사용자 정보 복원
      user.value = {
        userId: result.userId?.toString() || impersonation.value.originalUserId || '',
        userName: result.userName || impersonation.value.originalUserName || '',
        email: result.email || '',
        role: result.role || impersonation.value.originalRole || ''
      }

      // Impersonation 상태 초기화
      impersonation.value = {
        isImpersonating: false,
        originalUserId: null,
        originalUserName: null,
        originalRole: null
      }

      // localStorage 업데이트
      if (process.client) {
        localStorage.setItem('auth_user', JSON.stringify(user.value))
        localStorage.setItem('auth_access_token', result.accessToken)
        localStorage.setItem('auth_refresh_token', result.refreshToken)
        localStorage.setItem('auth_token_expiry', tokenExpiry.value.toString())
        localStorage.removeItem('auth_impersonation')
      }

      console.log('대리 로그인 종료, 원래 계정으로 복귀:', user.value.userName)

      return true
    } catch (error) {
      console.error('대리 로그인 종료 실패:', error)
      return false
    }
  }

  function updateLastActivity() {
    lastActivity.value = Date.now()
    if (process.client) {
      localStorage.setItem('auth_last_activity', lastActivity.value.toString())
    }
  }

  async function checkAuth() {
    if (!process.client) return false

    try {
      const storedUser = localStorage.getItem('auth_user')
      const storedAccessToken = localStorage.getItem('auth_access_token')
      const storedRefreshToken = localStorage.getItem('auth_refresh_token')
      const storedTokenExpiry = localStorage.getItem('auth_token_expiry')
      const storedLastActivity = localStorage.getItem('auth_last_activity')

      if (!storedUser || !storedAccessToken || !storedRefreshToken) {
        clearAuthData()
        return false
      }

      user.value = JSON.parse(storedUser)
      accessToken.value = storedAccessToken
      refreshToken.value = storedRefreshToken
      tokenExpiry.value = storedTokenExpiry ? parseInt(storedTokenExpiry) : null
      lastActivity.value = storedLastActivity ? parseInt(storedLastActivity) : null

      // Impersonation 상태 복원
      const storedImpersonation = localStorage.getItem('auth_impersonation')
      if (storedImpersonation) {
        try {
          impersonation.value = JSON.parse(storedImpersonation)
        } catch {
          impersonation.value = {
            isImpersonating: false,
            originalUserId: null,
            originalUserName: null,
            originalRole: null
          }
        }
      }

      // ✅ 서버에 토큰 유효성 검증 (백엔드 재시작 감지)
      try {
        const { getApiBaseUrl } = await import('~/services/api')
        const response = await fetch(`${getApiBaseUrl()}/common/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedAccessToken}`
          }
        })

        if (!response.ok) {
          console.warn('서버 토큰 검증 실패:', response.status)
          clearAuthData()
          return false
        }

        const data = await response.json()

        // 서버에서 받은 사용자 정보로 업데이트
        if (data.success && data.data) {
          user.value = data.data
          localStorage.setItem('auth_user', JSON.stringify(data.data))
        } else if (data.userid) {
          // data 래퍼 없이 직접 user 정보가 온 경우
          user.value = data
          localStorage.setItem('auth_user', JSON.stringify(data))
        }

        console.log('인증 상태 복원 및 서버 검증 완료:', {
          사용자: user.value?.userName,
          역할: user.value?.role,
          토큰만료: tokenExpiry.value ? new Date(tokenExpiry.value).toLocaleString() : null
        })

        return true
      } catch (verifyError) {
        console.error('서버 토큰 검증 중 오류:', verifyError)
        clearAuthData()
        return false
      }
    } catch (error) {
      console.error('인증 상태 복원 실패:', error)
      clearAuthData()
      return false
    }
  }

  /**
   * ⚠️ 더 이상 사용하지 않음 (Deprecated)
   *
   * 백엔드 Sliding Session 방식으로 변경됨:
   * - 서버가 모든 API 응답 시 토큰 만료 임박(30분 경과) 체크
   * - 응답 헤더 X-New-Access-Token, X-New-Refresh-Token으로 자동 갱신
   * - plugins/api-interceptor.ts에서 자동 처리
   *
   * @deprecated 서버 주도 자동 갱신 방식으로 대체됨
   */
  async function refreshAccessToken() {
    console.warn('[Deprecated] refreshAccessToken() 호출됨. Sliding Session으로 자동 처리되므로 이 함수는 더 이상 필요하지 않습니다.')

    if (!refreshToken.value) {
      console.error('리프레시 토큰이 없습니다')
      return false
    }

    try {
      // 호환성을 위해 코드 유지 (추후 제거 가능)
      const { getApiBaseUrl } = await import('~/services/api')
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: refreshToken.value
        })
      })

      if (!response.ok) {
        throw new Error('토큰 갱신 실패')
      }

      const data = await response.json()

      accessToken.value = data.accessToken
      tokenExpiry.value = Date.now() + (data.expiresIn || 3600) * 1000

      if (process.client) {
        localStorage.setItem('auth_access_token', data.accessToken)
        localStorage.setItem('auth_token_expiry', tokenExpiry.value.toString())
      }

      console.log('액세스 토큰 갱신 성공 (Fallback 모드)')
      return true
    } catch (error) {
      console.error('토큰 갱신 실패:', error)
      return false
    }
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    tokenExpiry,
    lastActivity,
    impersonation,

    // Computed
    isLoggedIn,
    role,
    isTokenExpired,
    isTokenExpiringSoon,
    isUserInactive,
    isImpersonating,
    originalUser,
    canImpersonate,

    // Actions
    setAuthData,
    clearAuthData,
    updateLastActivity,
    checkAuth,
    refreshAccessToken,
    startImpersonation,
    stopImpersonation
  }
})
