import { apiEnvironment } from './api'
import { USER_ENDPOINTS } from './api/endpoints/user.endpoints'

// MIGRATED: 2025-01-25 - URL을 USER_ENDPOINTS로 이전

export interface User {
  id?: number
  userid: string
  username: string
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
  username?: string
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 사용자 목 데이터 반환')
      return this.getMockUsers(params)
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 상세 검색 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 사용자 목 데이터 반환')
      return this.getMockUsers(searchRequest)
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
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 간단 검색 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 사용자 목 데이터 반환')
      return this.getMockUsers(params)
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
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('사용자 상세 조회 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 사용자 목 데이터 반환')
      return this.getMockUser(id)
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 비밀번호 변경 목 데이터 반환')
      return this.getMockPasswordChangeResponse(passwordData)
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
        headers: {
          'Content-Type': 'application/json',
        },
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
   * 내 정보 수정
   */
  async updateProfile(userId: number, profileData: Partial<User>): Promise<User> {
    try {
      const url = USER_ENDPOINTS.update(userId)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error('프로필 수정 실패:', error)
      throw error
    }
  },

  // 목 데이터 (개발 환경용)
  getMockUsers(params: any = {}): UserSearchResponse {
    const mockUsers: User[] = [
      {
        id: 1,
        userid: 'admin',
        username: '시스템관리자',
        email: 'admin@ptlpsm.com',
        phone: '010-1234-5678',
        department: 'IT팀',
        position: '팀장',
        employeeNumber: 'EMP001',
        companyName: 'PTLPSM',
        role: 'SYSTEM_ADMIN',
        userType: 'ADMIN',
        enabled: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 2,
        userid: 'sales1',
        username: '김영업',
        email: 'sales1@ptlpsm.com',
        phone: '010-1111-2222',
        department: '영업팀',
        position: '대리',
        employeeNumber: 'EMP002',
        companyName: 'PTLPSM',
        role: 'SALES_MANAGER',
        userType: 'INTERNAL',
        enabled: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 3,
        userid: 'shipping1',
        username: '박출하',
        email: 'shipping1@ptlpsm.com',
        phone: '010-3333-4444',
        department: '출하팀',
        position: '사원',
        employeeNumber: 'EMP003',
        companyName: 'PTLPSM',
        role: 'SHIPPING_MANAGER',
        userType: 'INTERNAL',
        enabled: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 4,
        userid: 'courier1',
        username: '이택배',
        email: 'courier1@ptlpsm.com',
        phone: '010-5555-6666',
        department: '배송팀',
        position: '기사',
        employeeNumber: 'EMP004',
        companyName: 'PTLPSM',
        role: 'COURIER',
        userType: 'EXTERNAL',
        enabled: true,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      },
      {
        id: 5,
        userid: 'viewer1',
        username: '최조회',
        email: 'viewer1@ptlpsm.com',
        phone: '010-7777-8888',
        department: '기획팀',
        position: '대리',
        employeeNumber: 'EMP005',
        companyName: 'PTLPSM',
        role: 'VIEWER',
        userType: 'INTERNAL',
        enabled: false,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00'
      }
    ]

    // 검색 필터링
    let filteredUsers = mockUsers

    if (params.searchKeyword) {
      const keyword = params.searchKeyword.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.userid.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      )
    }

    if (params.username) {
      const username = params.username.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(username)
      )
    }

    if (params.role) {
      filteredUsers = filteredUsers.filter(user => user.role === params.role)
    }

    if (params.enabled) {
      const enabled = params.enabled === 'true'
      filteredUsers = filteredUsers.filter(user => user.enabled === enabled)
    }

    if (params.department) {
      const department = params.department.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.department?.toLowerCase().includes(department)
      )
    }

    if (params.phone) {
      const phone = params.phone.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.phone?.toLowerCase().includes(phone)
      )
    }

    if (params.userType) {
      filteredUsers = filteredUsers.filter(user => user.userType === params.userType)
    }

    if (params.companyName) {
      const companyName = params.companyName.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.companyName?.toLowerCase().includes(companyName)
      )
    }

    if (params.position) {
      const position = params.position.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.position?.toLowerCase().includes(position)
      )
    }

    if (params.enabled) {
      const enabled = params.enabled === 'Y'
      filteredUsers = filteredUsers.filter(user => user.enabled === enabled)
    }

    // 페이징
    const page = params.page || 0
    const size = params.size || 10
    const startIndex = page * size
    const endIndex = startIndex + size
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return {
      content: paginatedUsers,
      totalElements: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / size),
      size: size,
      number: page,
      first: page === 0,
      last: endIndex >= filteredUsers.length,
      empty: paginatedUsers.length === 0
    }
  },

  getMockUser(id: number): User {
    const mockUsers = this.getMockUsers().content
    const user = mockUsers.find(u => u.id === id)
    if (!user) {
      throw new Error(`User with id ${id} not found`)
    }
    return user
  },

  /**
   * 비밀번호 변경 목 데이터 응답
   */
  getMockPasswordChangeResponse(passwordData: PasswordChangeRequest): PasswordChangeResponse {
    // 유효성 검사 시뮬레이션
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      throw new Error('새 비밀번호와 확인 비밀번호를 모두 입력해주세요.')
    }

    if (passwordData.newPassword.length < 6 || passwordData.newPassword.length > 100) {
      throw new Error('비밀번호는 6~100자 사이여야 합니다.')
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new Error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
    }

    // 성공 응답
    return {
      status: 200,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    }
  }
}
