/**
 * 현장(프로젝트) 마스터 + 토큰 관리 서비스 (관리자용)
 */
import { apiClient, type PageResponse } from '~/services/api/client'
import type {
  Site,
  SiteCreateRequest,
  SiteUpdateRequest,
  SiteSearchParams,
  SiteTokenInfo
} from '~/types/site'

export const siteService = {
  async search(params: SiteSearchParams = {}): Promise<PageResponse<Site>> {
    return apiClient.get<PageResponse<Site>>('/admin/sites', params as Record<string, unknown>)
  },

  async getById(siteId: number): Promise<Site> {
    return apiClient.get<Site>(`/admin/sites/${siteId}`)
  },

  async create(data: SiteCreateRequest): Promise<Site> {
    return apiClient.post<Site>('/admin/sites', data)
  },

  async update(siteId: number, data: SiteUpdateRequest): Promise<Site> {
    return apiClient.put<Site>(`/admin/sites/${siteId}`, data)
  },

  async regenerateToken(siteId: number): Promise<SiteTokenInfo> {
    return apiClient.post<SiteTokenInfo>(`/admin/sites/${siteId}/regenerate-token`, {})
  },

  async activate(siteId: number): Promise<Site> {
    return apiClient.post<Site>(`/admin/sites/${siteId}/activate`, {})
  },

  async deactivate(siteId: number): Promise<Site> {
    return apiClient.post<Site>(`/admin/sites/${siteId}/deactivate`, {})
  },

  async remove(siteId: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/admin/sites/${siteId}`)
  }
}

/**
 * 현장 접속 URL 생성 (백엔드가 채워주지 않은 경우 프론트에서 조합)
 */
export function buildSiteAccessUrl(token: string, baseUrl?: string): string {
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/m/order-request/${token}`
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/m/order-request/${token}`
  }
  return `/m/order-request/${token}`
}
