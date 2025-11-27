// 코드 서비스 - 백엔드 API 스펙에 맞춤
import { apiEnvironment } from './api'
import { CODE_ENDPOINTS } from './api/endpoints/code.endpoints'

// MIGRATED: 2025-01-25 - URL을 CODE_ENDPOINTS로 이전

// 코드 그룹 인터페이스
export interface CodeGroup {
  groupCode: string
  groupName: string
  description?: string
  useYn: 'Y' | 'N'
  sortOrder: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

// 코드 상세 인터페이스
export interface CodeDetail {
  groupCode: string
  code: string
  parentCode?: string
  codeName: string
  description?: string
  useYn: 'Y' | 'N'
  sortOrder: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export const codeService = {
  /**
   * 백엔드 API 연결 테스트
   */
  async testApiConnection(): Promise<{ success: boolean; message: string; url: string }> {
    try {
      const baseUrl = apiEnvironment.getApiBaseUrl()
      const testUrl = CODE_ENDPOINTS.groups() // 실제 존재하는 엔드포인트로 테스트
      
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
   * 코드 그룹 목록 조회
   * GET /api/codes/groups
   */
  async getCodeGroups(): Promise<CodeGroup[]> {
    try {
      const response = await fetch(CODE_ENDPOINTS.groups(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 백엔드에서 배열 형태로 직접 반환하므로 바로 사용
      const data: CodeGroup[] = await response.json()
      console.log('백엔드에서 받은 코드 그룹:', data)
      return data
    } catch (error) {
      console.error('코드 그룹 조회 실패:', error)
      throw error
    }
  },

  /**
   * 코드 그룹 등록
   * POST /api/codes/groups
   */
  async createCodeGroup(groupData: Omit<CodeGroup, 'createdAt' | 'updatedAt'>): Promise<CodeGroup> {
    try {
      const response = await fetch(CODE_ENDPOINTS.createGroup(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('코드 그룹 등록 실패:', error)
      throw error
    }
  },

  /**
   * 코드 그룹 수정
   * PUT /api/codes/groups/{groupCode}
   */
  async updateCodeGroup(groupCode: string, groupData: Partial<CodeGroup>): Promise<CodeGroup> {
    try {
      const response = await fetch(CODE_ENDPOINTS.updateGroup(groupCode), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('코드 그룹 수정 실패:', error)
      throw error
    }
  },

  /**
   * 코드 그룹 삭제
   * DELETE /api/codes/groups/{groupCode}
   */
  async deleteCodeGroup(groupCode: string): Promise<void> {
    try {
      const response = await fetch(CODE_ENDPOINTS.deleteGroup(groupCode), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('코드 그룹 삭제 실패:', error)
      throw error
    }
  },

  /**
   * 코드 상세 목록 조회
   * GET /api/codes/details/{groupCode}
   */
  async getCodeDetails(groupCode?: string): Promise<CodeDetail[]> {
    try {
      const url = CODE_ENDPOINTS.details(groupCode)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 백엔드에서 배열 형태로 직접 반환하므로 바로 사용
      const data: CodeDetail[] = await response.json()
      console.log('백엔드에서 받은 코드 상세:', data)
      return data
    } catch (error) {
      console.error('코드 상세 조회 실패:', error)
      throw error
    }
  },

  /**
   * 코드 상세 등록
   * POST /api/codes/details
   */
  async createCodeDetail(detailData: Omit<CodeDetail, 'createdAt' | 'updatedAt'>): Promise<CodeDetail> {
    try {
      const response = await fetch(CODE_ENDPOINTS.createDetail(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detailData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('코드 상세 등록 실패:', error)
      throw error
    }
  },

  /**
   * 코드 상세 수정
   * PUT /api/codes/details/{groupCode}/{code}
   */
  async updateCodeDetail(groupCode: string, code: string, detailData: Partial<CodeDetail>): Promise<CodeDetail> {
    try {
      const response = await fetch(CODE_ENDPOINTS.updateDetail(groupCode, code), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detailData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('코드 상세 수정 실패:', error)
      throw error
    }
  },

  /**
   * 코드 상세 삭제
   * DELETE /api/codes/details/{groupCode}/{code}
   */
  async deleteCodeDetail(groupCode: string, code: string): Promise<void> {
    try {
      const response = await fetch(CODE_ENDPOINTS.deleteDetail(groupCode, code), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('코드 상세 삭제 실패:', error)
      throw error
    }
  }
}
