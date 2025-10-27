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
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 목 데이터 반환')
      return [
        {
          groupCode: 'USER_ROLE',
          groupName: '사용자역할',
          description: '사용자 역할 코드',
          useYn: 'Y',
          sortOrder: 1,
          createdBy: 'admin',
          createdAt: '2024-01-01T00:00:00'
        },
        {
          groupCode: 'USER_TYPE',
          groupName: '사용자유형',
          description: '사용자 유형 구분 코드',
          useYn: 'Y',
          sortOrder: 2,
          createdBy: 'admin',
          createdAt: '2024-01-01T00:00:00'
        },
        {
          groupCode: 'ORDER_STATUS',
          groupName: '주문상태',
          description: '주문 상태 구분 코드',
          useYn: 'Y',
          sortOrder: 3,
          createdBy: 'admin',
          createdAt: '2024-01-01T00:00:00'
        }
      ]
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
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 코드 상세 목 데이터 반환')
      
      // 그룹 코드에 따른 목 데이터 반환
      if (groupCode === 'USER_ROLE') {
        return [
          {
            groupCode: 'USER_ROLE',
            code: 'SYSTEM_ADMIN',
            parentCode: undefined,
            codeName: '시스템관리자',
            description: '시스템 전체 관리 권한',
            useYn: 'Y',
            sortOrder: 1,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'USER_ROLE',
            code: 'SALES_MANAGER',
            parentCode: undefined,
            codeName: '영업담당자',
            description: '영업 관련 업무 권한',
            useYn: 'Y',
            sortOrder: 2,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'USER_ROLE',
            code: 'SHIPPING_MANAGER',
            parentCode: undefined,
            codeName: '출하담당자',
            description: '출하 관련 업무 권한',
            useYn: 'Y',
            sortOrder: 3,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'USER_ROLE',
            code: 'COURIER',
            parentCode: undefined,
            codeName: '배송기사',
            description: '배송 관련 업무 권한',
            useYn: 'Y',
            sortOrder: 4,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'USER_ROLE',
            code: 'VIEWER',
            parentCode: undefined,
            codeName: '조회자',
            description: '조회 전용 권한',
            useYn: 'Y',
            sortOrder: 5,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          }
        ]
      } else if (groupCode === 'USER_TYPE') {
        return [
          {
            groupCode: 'USER_TYPE',
            code: 'ADMIN',
            parentCode: undefined,
            codeName: '관리자',
            description: '시스템 관리자',
            useYn: 'Y',
            sortOrder: 1,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'USER_TYPE',
            code: 'INTERNAL',
            parentCode: undefined,
            codeName: '내부사용자',
            description: '회사 내부 직원',
            useYn: 'Y',
            sortOrder: 2,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'USER_TYPE',
            code: 'EXTERNAL',
            parentCode: undefined,
            codeName: '외부사용자',
            description: '외부 협력업체',
            useYn: 'Y',
            sortOrder: 3,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          }
        ]
      } else if (groupCode === 'REGION') {
        return [
          {
            groupCode: 'REGION',
            code: 'SEOUL',
            parentCode: undefined,
            codeName: '서울특별시',
            description: '서울특별시',
            useYn: 'Y',
            sortOrder: 1,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'BUSAN',
            parentCode: undefined,
            codeName: '부산광역시',
            description: '부산광역시',
            useYn: 'Y',
            sortOrder: 2,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'DAEGU',
            parentCode: undefined,
            codeName: '대구광역시',
            description: '대구광역시',
            useYn: 'Y',
            sortOrder: 3,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'INCHEON',
            parentCode: undefined,
            codeName: '인천광역시',
            description: '인천광역시',
            useYn: 'Y',
            sortOrder: 4,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'GWANGJU',
            parentCode: undefined,
            codeName: '광주광역시',
            description: '광주광역시',
            useYn: 'Y',
            sortOrder: 5,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'DAEJEON',
            parentCode: undefined,
            codeName: '대전광역시',
            description: '대전광역시',
            useYn: 'Y',
            sortOrder: 6,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'ULSAN',
            parentCode: undefined,
            codeName: '울산광역시',
            description: '울산광역시',
            useYn: 'Y',
            sortOrder: 7,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'SEJONG',
            parentCode: undefined,
            codeName: '세종특별자치시',
            description: '세종특별자치시',
            useYn: 'Y',
            sortOrder: 8,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'GYEONGGI',
            parentCode: undefined,
            codeName: '경기도',
            description: '경기도',
            useYn: 'Y',
            sortOrder: 9,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'GANGWON',
            parentCode: undefined,
            codeName: '강원도',
            description: '강원도',
            useYn: 'Y',
            sortOrder: 10,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'CHUNGBUK',
            parentCode: undefined,
            codeName: '충청북도',
            description: '충청북도',
            useYn: 'Y',
            sortOrder: 11,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'CHUNGNAM',
            parentCode: undefined,
            codeName: '충청남도',
            description: '충청남도',
            useYn: 'Y',
            sortOrder: 12,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'JEONBUK',
            parentCode: undefined,
            codeName: '전라북도',
            description: '전라북도',
            useYn: 'Y',
            sortOrder: 13,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'JEONNAM',
            parentCode: undefined,
            codeName: '전라남도',
            description: '전라남도',
            useYn: 'Y',
            sortOrder: 14,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'GYEONGBUK',
            parentCode: undefined,
            codeName: '경상북도',
            description: '경상북도',
            useYn: 'Y',
            sortOrder: 15,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'GYEONGNAM',
            parentCode: undefined,
            codeName: '경상남도',
            description: '경상남도',
            useYn: 'Y',
            sortOrder: 16,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          },
          {
            groupCode: 'REGION',
            code: 'JEJU',
            parentCode: undefined,
            codeName: '제주특별자치도',
            description: '제주특별자치도',
            useYn: 'Y',
            sortOrder: 17,
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00'
          }
        ]
      }
      
      return []
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
