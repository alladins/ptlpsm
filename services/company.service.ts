import type { Company, CompanyCreateRequest, CompanyUpdateRequest, CompanyInfoResponse } from '~/types/company'
import { COMPANY_ENDPOINTS } from './api/endpoints/company.endpoints'
import { getAuthHeaders } from './api'

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
                throw new Error(`회사 정보 등록 실패: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('회사 정보 등록 오류:', error)
            throw error
        }
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
                throw new Error(`회사 정보 수정 실패: ${response.status}`)
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
                throw new Error(`회사 정보 삭제 실패: ${response.status}`)
            }
        } catch (error) {
            console.error('회사 정보 삭제 오류:', error)
            throw error
        }
    }

    /**
     * 회사 목록 조회
     * GET /api/basic/company
     */
    async getCompanies(): Promise<CompanyInfoResponse[]> {
        try {
            const response = await fetch(COMPANY_ENDPOINTS.list(), {
                method: 'GET',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                throw new Error(`회사 목록 조회 실패: ${response.status}`)
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
                throw new Error(`회사 상세 조회 실패: ${response.status}`)
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
