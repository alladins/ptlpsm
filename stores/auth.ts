import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  userId: string
  userName: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  tokenExpiry: number | null
  lastActivity: number | null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const tokenExpiry = ref<number | null>(null)
  const lastActivity = ref<number | null>(null)

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

    // localStorage 정리
    if (process.client) {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_access_token')
      localStorage.removeItem('auth_refresh_token')
      localStorage.removeItem('auth_token_expiry')
      localStorage.removeItem('auth_last_activity')
      localStorage.removeItem('redirectAfterLogin')
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

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      console.error('리프레시 토큰이 없습니다')
      return false
    }

    try {
      // TODO: 실제 API 호출로 변경
      const response = await fetch('/api/auth/refresh', {
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
      tokenExpiry.value = Date.now() + data.expiresIn * 1000

      if (process.client) {
        localStorage.setItem('auth_access_token', data.accessToken)
        localStorage.setItem('auth_token_expiry', tokenExpiry.value.toString())
      }

      console.log('액세스 토큰 갱신 성공')
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

    // Computed
    isLoggedIn,
    role,
    isTokenExpired,
    isTokenExpiringSoon,
    isUserInactive,

    // Actions
    setAuthData,
    clearAuthData,
    updateLastActivity,
    checkAuth,
    refreshAccessToken
  }
})
