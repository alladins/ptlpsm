import { apiEnvironment, getAuthHeaders } from './api'
import { safeStorage } from '~/utils/storage'

/**
 * 회사 파일 정보
 */
export interface CompanyFile {
  id: number
  categoryCd: string
  categoryNm: string
  fileNm: string
  fileSize: number
  mimeType: string | null
  versionNo: number
  isCurrent: string
  description: string | null
  createdAt: string
  createdBy: string
}

/**
 * 회사 파일 이메일 발송 요청
 */
export interface CompanyFileEmailRequest {
  to: string[]
  cc?: string[]
  subject: string
  body: string
  fileIds: number[]
}

/**
 * 회사 파일관리 서비스
 */
export const companyFileService = {
  /**
   * 현재 버전 파일 목록 조회
   * GET /api/basic/company-files
   */
  async listCurrent(): Promise<CompanyFile[]> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`회사 파일 목록 조회 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 카테고리별 이력 전체 조회
   * GET /api/basic/company-files/history/{categoryCd}
   */
  async history(categoryCd: string): Promise<CompanyFile[]> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files/history/${encodeURIComponent(categoryCd)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`회사 파일 이력 조회 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 파일 업로드 (multipart/form-data)
   * POST /api/basic/company-files
   */
  async upload(file: File, categoryCd: string, description?: string): Promise<CompanyFile> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files`
    const formData = new FormData()
    formData.append('file', file)
    formData.append('categoryCd', categoryCd)
    if (description) {
      formData.append('description', description)
    }

    const headers = getAuthHeaders()
    // FormData 전송 시 Content-Type 제거 (브라우저가 자동으로 boundary 포함하여 설정)
    delete (headers as Record<string, string>)['Content-Type']

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`회사 파일 업로드 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 파일 설명 수정
   * PUT /api/basic/company-files/{id}
   */
  async update(id: number, description: string): Promise<CompanyFile> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files/${id}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ description }),
    })

    if (!response.ok) {
      throw new Error(`회사 파일 수정 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 파일 소프트 삭제
   * DELETE /api/basic/company-files/{id}
   */
  async softDelete(id: number): Promise<void> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files/${id}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`회사 파일 삭제 실패: ${response.status} ${response.statusText}`)
    }
  },

  /**
   * 다운로드 URL 빌더 (토큰 쿼리 파라미터 포함)
   * 직접 링크가 필요한 경우 사용 (예: a 태그 href)
   */
  downloadUrl(id: number): string {
    const token = safeStorage.getItem('auth_access_token') || ''
    const base = `${apiEnvironment.getApiBaseUrl()}/basic/company-files/${id}/download`
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
  },

  /**
   * 파일 다운로드 (Blob fetch + 브라우저 다운로드 트리거)
   * GET /api/basic/company-files/{id}/download
   */
  async download(id: number, fileName?: string): Promise<void> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files/${id}/download`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`회사 파일 다운로드 실패: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName || `company-file-${id}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  /**
   * 간단 이메일 발송 (회사 파일 첨부)
   * POST /api/basic/company-files/send-email
   */
  async sendSimpleEmail(req: CompanyFileEmailRequest): Promise<void> {
    const url = `${apiEnvironment.getApiBaseUrl()}/basic/company-files/send-email`
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    })

    if (!response.ok) {
      throw new Error(`이메일 발송 실패: ${response.status} ${response.statusText}`)
    }
  },
}
