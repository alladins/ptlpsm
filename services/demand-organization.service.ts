import { apiEnvironment } from './api'
import { DEMAND_ORGANIZATION_ENDPOINTS } from './api/endpoints/demand-organization.endpoints'

// MIGRATED: 2025-01-25 - URL을 DEMAND_ORGANIZATION_ENDPOINTS로 이전

export interface DemandOrganization {
  id?: number
  dminsttCd: string
  dminsttNm: string
  dminsttAbrvtNm?: string
  dminsttEngNm?: string
  corprtRgstNo?: string
  bizno?: string
  jrsdctnDivNm?: string
  insttTyCdLrgclsfcNm?: string
  insttTyCdMidclsfcNm?: string
  insttTyCdSmlclsfcNm?: string
  bizcndtnNm?: string
  indstrytyNm?: string
  ofclFaxNo?: string
  rgnCd?: string
  rgnNm?: string
  zip?: string
  adrs?: string
  dtlAdrs?: string
  telNo?: string
  faxNo?: string
  hmpgAdrs?: string
  dltYn?: string
  toplvlInsttCd?: string
  toplvlInsttNm?: string
  vldPrdBgnDt?: string
  vldPrdEndDt?: string
  rgstDt?: string
  chgDt?: string
  createdAt?: string
  updatedAt?: string
}

export interface DemandOrganizationSearchRequest {
  searchKeyword?: string
  rgnCd?: string
  dltYn?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface DemandOrganizationSearchResponse {
  content: DemandOrganization[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface CodeCheckResponse {
  exists: boolean
  message: string
}

export const demandOrganizationService = {
  /**
   * 백엔드 API 연결 테스트
   */
  async testApiConnection(): Promise<{ success: boolean; message: string; url: string }> {
    try {
      const testUrl = DEMAND_ORGANIZATION_ENDPOINTS.list()

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
   * 수요기관 목록 조회
   */
  async getDemandOrganizations(params: {
    page?: number
    size?: number
    sortBy?: string
    sortDirection?: string
  } = {}): Promise<DemandOrganizationSearchResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.page !== undefined) queryParams.append('page', params.page.toString())
      if (params.size !== undefined) queryParams.append('size', params.size.toString())
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection)

      const url = `${DEMAND_ORGANIZATION_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('API 호출 URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('API 응답:', result)
      
      // 백엔드 API 응답 구조 확인 및 처리
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      // 응답이 직접 페이징 데이터인 경우 (data 필드 없음)
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as DemandOrganizationSearchResponse
      }
      
      // 응답이 ApiResponse 형태인 경우 (data 필드 있음)
      if (result.data) {
        return result.data
      }
      
      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('수요기관 목록 조회 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 수요기관 목 데이터 반환')
      const mockData = this.getMockDemandOrganizations(params)
      console.log('목 데이터 반환:', mockData)
      return mockData
    }
  },

  /**
   * 수요기관 검색
   */
  async searchDemandOrganizations(searchRequest: DemandOrganizationSearchRequest): Promise<DemandOrganizationSearchResponse> {
    try {
      const url = DEMAND_ORGANIZATION_ENDPOINTS.search()

      console.log('searchDemandOrganizations - 전송할 데이터:', searchRequest)
      console.log('API 호출 URL:', url)
      
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

      const result = await response.json()
      console.log('검색 API 응답:', result)
      
      // 백엔드 API 응답 구조 확인 및 처리
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      // 응답이 직접 페이징 데이터인 경우 (data 필드 없음)
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as DemandOrganizationSearchResponse
      }
      
      // 응답이 ApiResponse 형태인 경우 (data 필드 있음)
      if (result.data) {
        return result.data
      }
      
      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('수요기관 검색 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 수요기관 목 데이터 반환')
      const mockData = this.getMockDemandOrganizations(searchRequest)
      console.log('검색 목 데이터 반환:', mockData)
      return mockData
    }
  },

  /**
   * 수요기관 상세 조회
   */
  async getDemandOrganizationById(id: number): Promise<DemandOrganization> {
    try {
      const url = DEMAND_ORGANIZATION_ENDPOINTS.detail(id)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<DemandOrganization> = await response.json()
      return result.data
    } catch (error) {
      console.error('수요기관 상세 조회 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 수요기관 목 데이터 반환')
      return this.getMockDemandOrganization(id)
    }
  },

  /**
   * 수요기관 등록
   */
  async createDemandOrganization(organizationData: DemandOrganization): Promise<DemandOrganization> {
    try {
      const url = DEMAND_ORGANIZATION_ENDPOINTS.create()

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      const result: ApiResponse<DemandOrganization> = await response.json()
      return result.data
    } catch (error) {
      console.error('수요기관 등록 실패:', error)
      throw error
    }
  },

  /**
   * 수요기관 수정
   */
  async updateDemandOrganization(dminsttCd: string, organizationData: Partial<DemandOrganization>): Promise<DemandOrganization> {
    try {
      const url = DEMAND_ORGANIZATION_ENDPOINTS.update(dminsttCd)

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      const result: ApiResponse<DemandOrganization> = await response.json()
      return result.data
    } catch (error) {
      console.error('수요기관 수정 실패:', error)
      throw error
    }
  },

  /**
   * 수요기관 삭제
   */
  async deleteDemandOrganization(dminsttCd: string): Promise<void> {
    try {
      const url = DEMAND_ORGANIZATION_ENDPOINTS.delete(dminsttCd)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('수요기관 삭제 실패:', error)
      throw error
    }
  },

  /**
   * 수요기관코드 중복 확인
   */
  async checkDemandOrganizationCode(dminsttCd: string): Promise<CodeCheckResponse> {
    try {
      const url = DEMAND_ORGANIZATION_ENDPOINTS.checkCode(dminsttCd)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<CodeCheckResponse> = await response.json()
      return result.data
    } catch (error) {
      console.error('수요기관코드 중복 확인 실패:', error)
      // 개발 환경에서는 목 데이터 반환
      console.log('개발 환경: 수요기관코드 중복 확인 목 데이터 반환')
      return this.getMockCodeCheckResponse(dminsttCd)
    }
  },

  /**
   * 수요기관 코드로 기관명 조회
   */
  async getDemandOrganizationNameByCode(dminsttCd: string): Promise<string | null> {
    try {
      if (!dminsttCd) return null

      // Note: 이 API는 ID가 아닌 코드(dminsttCd)를 사용합니다
      const baseUrl = apiEnvironment.getApiBaseUrl()
      const url = `${baseUrl}/basic/demand-organizations/${dminsttCd}`

      console.log('🔍 수요기관명 조회:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ 수요기관명 조회 성공:', result)
        
        // 응답 구조에 따라 처리
        if (result.data) {
          return result.data.dminsttNm
        } else if (result.dminsttNm) {
          return result.dminsttNm
        }
        return null
      } else {
        console.log('❌ 수요기관명 조회 실패:', response.status, response.statusText)
        // API 실패 시 목 데이터에서 조회
        return this.getMockOrganizationNameByCode(dminsttCd)
      }
    } catch (error) {
      console.error('🚨 수요기관명 조회 오류:', error)
      // 에러 발생 시 목 데이터에서 조회
      return this.getMockOrganizationNameByCode(dminsttCd)
    }
  },

  /**
   * 수요기관 코드 목록으로 기관명들 조회 (배치 처리)
   */
  async getDemandOrganizationNamesByCodes(dminsttCds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>()
    
    if (!dminsttCds || dminsttCds.length === 0) {
      return result
    }
    
    // 중복 제거
    const uniqueCodes = [...new Set(dminsttCds.filter(code => code))]
    
    console.log('🔍 수요기관명 배치 조회:', uniqueCodes)
    
    // 각 코드에 대해 병렬로 조회
    const promises = uniqueCodes.map(async (code) => {
      const name = await this.getDemandOrganizationNameByCode(code)
      return { code, name }
    })
    
    try {
      const results = await Promise.all(promises)
      
      results.forEach(({ code, name }) => {
        if (name) {
          result.set(code, name)
        }
      })
      
      console.log('✅ 수요기관명 배치 조회 완료:', result)
      return result
    } catch (error) {
      console.error('🚨 수요기관명 배치 조회 오류:', error)
      return result
    }
  },

  /**
   * 목 데이터에서 수요기관 코드로 기관명 조회
   */
  getMockOrganizationNameByCode(dminsttCd: string): string | null {
    const mockOrganizations = [
      {
        dminsttCd: '9111117',
        dminsttNm: '경상남도교육청 경상남도거제교육지원청 거제장평중학교'
      },
      {
        dminsttCd: '9222228',
        dminsttNm: '부산해운대초등학교'
      },
      {
        dminsttCd: '9333339',
        dminsttNm: '서울시립대학교'
      },
      {
        dminsttCd: '9444440',
        dminsttNm: '대전광역시청'
      },
      {
        dminsttCd: '9555551',
        dminsttNm: '인천항만공사'
      }
    ]
    
    const organization = mockOrganizations.find(org => org.dminsttCd === dminsttCd)
    return organization ? organization.dminsttNm : null
  },

  // 목 데이터 (개발 환경용)
  getMockDemandOrganizations(params: any = {}): DemandOrganizationSearchResponse {
    const mockOrganizations: DemandOrganization[] = [
      {
        id: 1,
        dminsttCd: '9111117',
        dminsttNm: '경상남도교육청 경상남도거제교육지원청 거제장평중학교',
        dminsttAbrvtNm: '거제장평중학교',
        dminsttEngNm: 'Geoje Jangpyug Junior High School',
        corprtRgstNo: '1101110375818',
        bizno: '6128306057',
        jrsdctnDivNm: '국가기관',
        insttTyCdLrgclsfcNm: '중학교',
        insttTyCdMidclsfcNm: '국가행정기관',
        insttTyCdSmlclsfcNm: '국가행정기관',
        bizcndtnNm: '교육업',
        indstrytyNm: '교육',
        ofclFaxNo: '055-636-9436',
        rgnCd: '50110',
        rgnNm: '경상남도 거제시',
        zip: '53270',
        adrs: '경상남도 거제시 장평4로',
        dtlAdrs: '40-0 (장평동)',
        telNo: '055-636-9434',
        faxNo: '055-636-9436',
        hmpgAdrs: 'www.sawoman.or.kr',
        dltYn: 'N',
        toplvlInsttCd: '9010000',
        toplvlInsttNm: '대전광역시',
        vldPrdBgnDt: '2012-03-15T12:00:00',
        vldPrdEndDt: '2020-12-31T12:00:00',
        rgstDt: '2001-08-10T12:00:00',
        chgDt: '2016-02-02T09:16:00',
        createdAt: '2024-01-15T10:30:00',
        updatedAt: '2024-01-15T10:30:00'
      },
      {
        id: 2,
        dminsttCd: '9222228',
        dminsttNm: '부산해운대초등학교',
        dminsttAbrvtNm: '부산해운대초',
        dminsttEngNm: 'Busan Haeundae Elementary School',
        corprtRgstNo: '1101110375819',
        bizno: '6128306058',
        jrsdctnDivNm: '지방자치단체',
        insttTyCdLrgclsfcNm: '초등학교',
        insttTyCdMidclsfcNm: '지방행정기관',
        insttTyCdSmlclsfcNm: '지방행정기관',
        bizcndtnNm: '교육업',
        indstrytyNm: '교육',
        ofclFaxNo: '051-234-5679',
        rgnCd: '26350',
        rgnNm: '부산광역시 해운대구',
        zip: '48000',
        adrs: '부산광역시 해운대구 해운대로',
        dtlAdrs: '123-45 (우동)',
        telNo: '051-234-5678',
        faxNo: '051-234-5679',
        hmpgAdrs: 'www.haeundae.es.kr',
        dltYn: 'N',
        toplvlInsttCd: '26440',
        toplvlInsttNm: '부산광역시',
        vldPrdBgnDt: '2020-01-01T00:00:00',
        vldPrdEndDt: '2030-12-31T23:59:59',
        rgstDt: '2020-01-01T00:00:00',
        chgDt: '2020-01-01T00:00:00',
        createdAt: '2024-01-15T10:30:00',
        updatedAt: '2024-01-15T10:30:00'
      }
    ]

    // 검색 필터링
    let filteredOrganizations = mockOrganizations

    if (params.searchKeyword) {
      const searchKeyword = params.searchKeyword.toLowerCase()
      filteredOrganizations = filteredOrganizations.filter(org => 
        org.dminsttCd.toLowerCase().includes(searchKeyword) ||
        org.dminsttNm.toLowerCase().includes(searchKeyword) ||
        (org.bizno && org.bizno.toLowerCase().includes(searchKeyword))
      )
    }

    if (params.rgnCd) {
      filteredOrganizations = filteredOrganizations.filter(org => 
        org.rgnCd === params.rgnCd
      )
    }

    if (params.dltYn) {
      filteredOrganizations = filteredOrganizations.filter(org => 
        org.dltYn === params.dltYn
      )
    }

    // 페이징
    const page = params.page || 0
    const size = params.size || 10
    const startIndex = page * size
    const endIndex = startIndex + size
    const paginatedOrganizations = filteredOrganizations.slice(startIndex, endIndex)

    return {
      content: paginatedOrganizations,
      totalElements: filteredOrganizations.length,
      totalPages: Math.ceil(filteredOrganizations.length / size),
      size: size,
      number: page,
      first: page === 0,
      last: endIndex >= filteredOrganizations.length,
      empty: paginatedOrganizations.length === 0
    }
  },

  getMockDemandOrganization(id: number): DemandOrganization {
    const mockOrganizations = this.getMockDemandOrganizations().content
    const organization = mockOrganizations.find(org => org.id === id)
    if (!organization) {
      throw new Error(`DemandOrganization with id ${id} not found`)
    }
    return organization
  },

  getMockCodeCheckResponse(dminsttCd: string): CodeCheckResponse {
    // 목 데이터에서는 9111117과 9222228이 이미 존재한다고 가정
    const existingCodes = ['9111117', '9222228']
    const exists = existingCodes.includes(dminsttCd)
    
    return {
      exists: exists,
      message: exists ? '이미 사용 중인 수요기관코드입니다.' : '사용 가능한 수요기관코드입니다.'
    }
  }
}
