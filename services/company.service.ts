import type { Company, CompanyCreateRequest, CompanyUpdateRequest, CompanyInfoResponse } from '~/types/company'
import { COMPANY_ENDPOINTS } from './api/endpoints/company.endpoints'
import { getAuthHeaders } from './api'
import { httpError, httpErrorMessage } from '~/utils/apiError'

// MIGRATED: 2025-01-25 - URL을 COMPANY_ENDPOINTS로 이전

class CompanyService {
    /**
     * 회사 정보 등록
     * POST /api/basic/company
     */
    async createCompany(company: CompanyCreateRequest): Promise<Company | null> {
        try {
            const endpoint = COMPANY_ENDPOINTS.create()
            console.log('🔍 [createCompany] API Endpoint:', endpoint)
            console.log('🔍 [createCompany] Request Body:', company)
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(company)
            })

            console.log('🔍 [createCompany] Response Status:', response.status)

            if (!response.ok) {
                throw httpError(response.status, '회사 정보 등록')
            }

            return await response.json()
        } catch (error) {
            console.error('회사 정보 등록 오류:', error)
            throw error
        }
    }

    /**
     * 회사 간편 등록 (회사명만으로 등록)
     * POST /api/basic/company/quick
     */
    async quickCreateCompany(companyName: string, companyType: string = 'BUILDER'): Promise<Company | null> {
        const params = new URLSearchParams({ companyName, companyType })
        const response = await fetch(`${COMPANY_ENDPOINTS.create()}/quick?${params.toString()}`, {
            method: 'POST',
            headers: getAuthHeaders()
        })

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null)
            throw new Error(errorBody?.message || httpErrorMessage(response.status, '회사 간편 등록'))
        }

        return await response.json()
    }

    /**
     * 회사 정보 수정
     * PUT /api/basic/company/{id}
     */
    async updateCompany(id: number, company: CompanyUpdateRequest): Promise<Company | null> {
        try {
            const response = await fetch(COMPANY_ENDPOINTS.update(id), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(company)
            })

            if (!response.ok) {
                throw httpError(response.status, '회사 정보 수정')
            }

            return await response.json()
        } catch (error) {
            console.error('회사 정보 수정 오류:', error)
            throw error
        }
    }

    /**
     * 회사 정보 삭제
     * DELETE /api/basic/company/{id}
     */
    async deleteCompany(id: number): Promise<void> {
        try {
            const response = await fetch(COMPANY_ENDPOINTS.delete(id), {
                method: 'DELETE',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                throw httpError(response.status, '회사 정보 삭제')
            }
        } catch (error) {
            console.error('회사 정보 삭제 오류:', error)
            throw error
        }
    }

    /**
     * 회사 목록 조회
     * GET /api/basic/company
     * @param companyType 회사 유형 필터 (MANUFACTURER: 제조사, BUILDER: 건설사 등)
     */
    async getCompanies(companyType?: string): Promise<CompanyInfoResponse[]> {
        try {
            let url = COMPANY_ENDPOINTS.list()
            if (companyType) {
                url += `?companyType=${encodeURIComponent(companyType)}`
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                throw httpError(response.status, '회사 목록 조회')
            }

            const data = await response.json()

            // 배열 직접 반환 (success wrapper 없음)
            return Array.isArray(data) ? data : []
        } catch (error) {
            console.error('회사 목록 조회 오류:', error)
            throw error
        }
    }

    /**
     * 제조사(OEM) 목록 조회
     * GET /api/basic/company?companyType=MANUFACTURER
     */
    async getManufacturers(): Promise<CompanyInfoResponse[]> {
        return this.getCompanies('MANUFACTURER')
    }

    /**
     * 생산자 목록 조회 — 원가가 등록된 회사
     * GET /api/basic/company/producers
     *
     * ★ 발주서 공급원은 이걸 쓴다. 회사 유형(제조사/본사)이 아니라
     *   «OEM 원가 관리에 원가가 1건이라도 있는가» 로 거른다(2026-09-21 대전제 8번).
     *   리드파워는 지금 원가가 없어 안 나오고, 원가를 등록하면 자동으로 나온다.
     */
    async getProducers(): Promise<CompanyInfoResponse[]> {
        try {
            const response = await fetch(`${COMPANY_ENDPOINTS.list()}/producers`, {
                method: 'GET',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                throw httpError(response.status, '공급원 목록 조회')
            }

            const data = await response.json()
            return Array.isArray(data) ? data : []
        } catch (error) {
            console.error('공급원 목록 조회 오류:', error)
            throw error
        }
    }

    /**
     * 회사 상세 조회
     * GET /api/basic/company/{id}
     */
    async getCompanyById(id: number): Promise<CompanyInfoResponse> {
        try {
            const response = await fetch(COMPANY_ENDPOINTS.getById(id), {
                method: 'GET',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                throw httpError(response.status, '회사 상세 조회')
            }

            return await response.json()
        } catch (error) {
            console.error('회사 상세 조회 오류:', error)
            throw error
        }
    }

    /**
     * 회사 상세 조회 (alias for getCompanyById)
     * GET /api/basic/company/{id}
     */
    async getCompany(id: number): Promise<CompanyInfoResponse> {
        return this.getCompanyById(id)
    }
}

export const companyService = new CompanyService()
