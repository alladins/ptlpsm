import { getApiBaseUrl } from './api'

interface LoginRequest {
  userId: string
  password: string
  rememberMe?: boolean
}

interface LoginResponse {
  success: boolean
  data: {
    userInfo: {
      userId: string
      userName: string
      email: string
      role: string
    }
    accessToken: string
    refreshToken: string
  }
  message?: string
}

interface RefreshTokenRequest {
  refreshToken: string
}

interface RefreshTokenResponse {
  success: boolean
  data: {
    accessToken: string
    expiresIn: number
  }
  message?: string
}

class AuthService {
  /**
   * 로그인
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다')
      }

      return data
    } catch (error: any) {
      console.error('로그인 실패:', error)
      throw error
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '토큰 갱신에 실패했습니다')
      }

      return data
    } catch (error: any) {
      console.error('토큰 갱신 실패:', error)
      throw error
    }
  }

  /**
   * 로그아웃
   */
  async logout(userId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId
        })
      })
  
      if (!response.ok) {
        console.warn('로그아웃 API 호출 실패 (무시하고 계속 진행)')
      }
    } catch (error) {
      console.error('로그아웃 실패:', error)
      // 로그아웃은 실패해도 클라이언트 측 데이터는 정리
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(token: string) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/common/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '사용자 정보 조회에 실패했습니다')
      }

      return data
    } catch (error: any) {
      console.error('사용자 정보 조회 실패:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService()
