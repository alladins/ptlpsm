/**
 * API 설정 및 Base URL 관리
 *
 * 이 파일은 API 엔드포인트의 기본 URL을 관리합니다.
 * 환경(개발/운영)에 따라 적절한 base URL을 반환합니다.
 */

import { apiEnvironment } from '../api'

/**
 * API Base URL 가져오기
 *
 * @returns API Base URL (예: http://localhost:9031/api 또는 http://shipmg.lphydrofoam.com:9031/api)
 */
export function getApiBaseUrl(): string {
  return apiEnvironment.getApiBaseUrl()
}
