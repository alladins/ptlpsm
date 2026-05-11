import { getAuthHeaders } from './api'
import { SALES_ENDPOINTS } from './api/endpoints/sales.endpoints'
import type { SalesActivity, SalesActivityFile, SalesActivityRequest } from '~/types/sales'

/**
 * 영업 활동 기록 서비스
 */
export const salesActivityService = {
  /**
   * 활동 목록 조회 (최신순)
   */
  async getActivities(salesId: number): Promise<SalesActivity[]> {
    const url = SALES_ENDPOINTS.activities(salesId)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`활동 목록 조회 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 활동 등록
   */
  async createActivity(salesId: number, data: SalesActivityRequest): Promise<SalesActivity> {
    const url = SALES_ENDPOINTS.createActivity(salesId)

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`활동 등록 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 활동 수정
   */
  async updateActivity(salesId: number, id: number, data: SalesActivityRequest): Promise<SalesActivity> {
    const url = SALES_ENDPOINTS.updateActivity(salesId, id)

    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`활동 수정 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 활동 삭제
   */
  async deleteActivity(salesId: number, id: number): Promise<void> {
    const url = SALES_ENDPOINTS.deleteActivity(salesId, id)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`활동 삭제 실패: ${response.status} ${response.statusText}`)
    }
  },

  /**
   * 활동 파일 업로드
   */
  async uploadFile(salesId: number, activityId: number, file: File): Promise<SalesActivityFile> {
    const url = SALES_ENDPOINTS.uploadActivityFile(salesId, activityId)
    const formData = new FormData()
    formData.append('file', file)

    const headers = getAuthHeaders()
    // FormData 전송 시 Content-Type 제거 (브라우저가 자동 설정)
    delete (headers as Record<string, string>)['Content-Type']

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`파일 업로드 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  },

  /**
   * 활동 파일 삭제
   */
  async deleteFile(salesId: number, activityId: number, fileId: number): Promise<void> {
    const url = SALES_ENDPOINTS.activityFile(salesId, activityId, fileId)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`파일 삭제 실패: ${response.status} ${response.statusText}`)
    }
  },

  /**
   * 활동 파일 다운로드
   */
  async downloadFile(salesId: number, activityId: number, fileId: number, fileName: string): Promise<void> {
    const url = SALES_ENDPOINTS.activityFile(salesId, activityId, fileId)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`파일 다운로드 실패: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },
}
