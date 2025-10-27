import { useFetch } from '#app'
import { unref } from 'vue'
import type { Company, CompanyCreateRequest, CompanyUpdateRequest } from '~/types/company'
import { COMPANY_ENDPOINTS } from './api/endpoints/company.endpoints'

// MIGRATED: 2025-01-25 - URL을 COMPANY_ENDPOINTS로 이전

class CompanyService {
    // 기존 baseUrl은 더 이상 사용하지 않습니다.
    // private readonly baseUrl = '/api/company'

    async getCompany(): Promise<Company | null> {
        const { data } = await useFetch<Company>(COMPANY_ENDPOINTS.get())
        return unref(data)
    }

    async createCompany(company: CompanyCreateRequest): Promise<Company | null> {
        const { data } = await useFetch<Company>(COMPANY_ENDPOINTS.create(), {
            method: 'POST',
            body: company
        })
        return unref(data)
    }

    async updateCompany(company: CompanyUpdateRequest): Promise<Company | null> {
        const { data } = await useFetch<Company>(COMPANY_ENDPOINTS.update(), {
            method: 'PUT',
            body: company
        })
        return unref(data)
    }

    async deleteCompany(): Promise<void> {
        await useFetch(COMPANY_ENDPOINTS.delete(), {
            method: 'DELETE'
        })
    }
}

export const companyService = new CompanyService()