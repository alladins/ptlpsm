import { apiEnvironment, getAuthHeaders } from './api'
import { USER_ENDPOINTS } from './api/endpoints/user.endpoints'
import type { UserByRole, UserRole } from '~/types/user'

// MIGRATED: 2025-01-25 - URL을 USER_ENDPOINTS로 이전

/**
 * 사용자 인터페이스
 *
 * 스키마 변경:
 * - userid: 숫자 (Primary Key, 기존 id)
 * - loginId: 문자열 (로그인용 ID, 기존 userId)
 */
export interface User {
  userid: number       // PK (숫자, 기존 id)
  loginId: string      // 로그인 ID (문자열, 기존 userId)
  userName: string
  email: string
  phone?: string
  department?: string
  position?: string
  employeeNumber?: string
  companyName?: string
  role: string
  userType?: string
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
  password?: string
}

export interface UserSearchRequest {
  searchKeyword?: string
  userName?: string
  role?: string
  department?: string
  phone?: string
  userType?: string
  companyName?: string
  position?: string
  enabled?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface UserSearchResponse {
  content: User[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PasswordChangeRequest {
  // currentPassword: string // 현재 비밀번호 필드 제거
  newPassword: string
  confirmPassword: string
}

export interface PasswordChangeResponse {
  status: number
  message: string
}

export const userService = {
  /**
   * 백엔드 API 연결 테스트
   */
  async testApiConnection(): Promise<{ success: boolean; message: string; url: string }> {
    try {
      const baseUrl = apiEnvironment.getApiBaseUrl()
      const testUrl = USER_ENDPOINTS.list()
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        return {
          success: true,
          message: '백엔드 API 연결 성공',
          url: baseUrl
        }
      } else {
        return {
          success: false,
          message: `백엔드 API 연결 실패: ${response.status} ${response.statusText}`,
          url: baseUrl
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `백엔드 API 연결 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
        url: apiEnvironment.getApiBaseUrl()
      }
    }
  },

  /**
   * 사용자 목록 조회 (기본)
   */
  async getUsers(params: {
    searchKeyword?: string
    role?: string
    enabled?: string
    page?: number
    size?: number
    sortBy?: string
    sortDirection?: string
  } = {}): Promise<UserSearchResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.searchKeyword) queryParams.append('searchKeyword', params.searchKeyword)
      if (params.role) queryParams.append('role', params.role)
      if (params.enabled) queryParams.append('enabled', params.enabled)
      if (params.page !== undefined) queryParams.append('page', params.page.toString())
      if (params.size !== undefined) queryParams.append('size', params.size.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)

      const url = `${USER_ENDPOINTS.list()}?${queryParams.toString()}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 상세 검색 (POST)
   */
  async searchUsers(searchRequest: UserSearchRequest): Promise<UserSearchResponse> {
    try {
      const url = USER_ENDPOINTS.search()
      
      console.log('searchUsers - 전송할 데이터:', searchRequest)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(searchRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 상세 검색 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 간단 검색 (GET)
   */
  async searchUsersSimple(params: {
    searchKeyword?: string
    role?: string
    department?: string
    phone?: string
    page?: number
    size?: number
  } = {}): Promise<UserSearchResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.searchKeyword) queryParams.append('searchKeyword', params.searchKeyword)
      if (params.role) queryParams.append('role', params.role)
      if (params.department) queryParams.append('department', params.department)
      if (params.phone) queryParams.append('phone', params.phone)
      if (params.page !== undefined) queryParams.append('page', params.page.toString())
      if (params.size !== undefined) queryParams.append('size', params.size.toString())

      const url = `${USER_ENDPOINTS.searchSimple()}?${queryParams.toString()}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 간단 검색 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 상세 조회
   */
  async getUserById(id: number): Promise<User> {
    try {
      const url = USER_ENDPOINTS.detail(id)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 상세 조회 실패:', error)
      throw error
    }
  },

  /**
   * 역할별 사용자 목록 조회
   * GET /api/common/users/by-roles?roles=OEM_MANAGER&roles=COURIER
   */
  async getUsersByRoles(roles: UserRole[]): Promise<UserByRole[]> {
    try {
      const baseUrl = apiEnvironment.getApiBaseUrl()

      // Query parameters 생성 (roles 배열을 multiple query params로)
      const queryParams = roles.map(role => `roles=${role}`).join('&')
      const url = `${baseUrl}/common/users/by-roles?${queryParams}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('역할별 사용자 조회 실패:', error)
      return []
    }
  },

  /**
   * 사용자 등록
   */
  async createUser(userData: User): Promise<User> {
    try {
      const url = USER_ENDPOINTS.create()

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 등록 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 수정
   */
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const url = USER_ENDPOINTS.update(id)

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 수정 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 삭제
   */
  async deleteUser(id: number): Promise<void> {
    try {
      const url = USER_ENDPOINTS.delete(id)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('사용자 삭제 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 상태 변경
   */
  async toggleUserStatus(id: number): Promise<User> {
    try {
      const url = USER_ENDPOINTS.toggleStatus(id)

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error)
      throw error
    }
  },

  /**
   * 비밀번호 변경
   */
  async changePassword(id: number, passwordData: PasswordChangeRequest): Promise<PasswordChangeResponse> {
    try {
      const url = USER_ENDPOINTS.changePassword(id)

      console.log('비밀번호 변경 요청:', { userId: id, passwordData })

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      // 응답이 비어있거나 JSON이 아닌 경우 처리
      const responseText = await response.text()
      if (!responseText.trim()) {
        // 빈 응답인 경우 성공으로 처리
        return {
          status: response.status,
          message: '비밀번호가 성공적으로 변경되었습니다.'
        }
      }

      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.warn('JSON 파싱 실패, 텍스트 응답으로 처리:', responseText)
        return {
          status: response.status,
          message: responseText || '비밀번호가 성공적으로 변경되었습니다.'
        }
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      throw error
    }
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  async getCurrentUser(): Promise<User> {
    try {
      const url = USER_ENDPOINTS.currentUser()

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('현재 사용자 정보 조회 실패:', error)
      throw error
    }
  },

  /**
   * 내 정보 수정 (모든 인증된 사용자)
   * PUT /api/common/users/me
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const url = USER_ENDPOINTS.updateProfile()

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error('내 정보 수정 실패:', error)
      throw error
    }
  },

  /**
   * 내 비밀번호 변경 (모든 인증된 사용자)
   * PUT /api/common/users/me/change-password
   */
  async changeMyPassword(data: { newPassword: string; confirmPassword: string }): Promise<{ success: boolean; message: string }> {
    try {
      const url = USER_ENDPOINTS.changeMyPassword()

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('내 비밀번호 변경 실패:', error)
      throw error
    }
  }

}
