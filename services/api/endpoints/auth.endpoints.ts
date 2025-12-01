/**
 * 인증 관련 API 엔드포인트
 *
 * 로그인, 로그아웃, 토큰 갱신, 대리 로그인 등 인증 관련 API 경로 정의
 */
import { getApiBaseUrl } from '../index'

export const AUTH_ENDPOINTS = {
  /**
   * 로그인
   * @method POST
   */
  login: () => `${getApiBaseUrl()}/auth/login`,

  /**
   * 로그아웃
   * @method POST
   * @param userId 사용자 ID (숫자)
   */
  logout: (userId: number) => `${getApiBaseUrl()}/auth/logout/${userId}`,

  /**
   * 토큰 갱신
   * @method POST
   */
  refresh: () => `${getApiBaseUrl()}/auth/refresh`,

  /**
   * 현재 사용자 정보 조회
   * @method GET
   */
  me: () => `${getApiBaseUrl()}/common/users/me`,

  // ========================================
  // 대리 로그인 (Impersonation)
  // ========================================

  /**
   * 대리 로그인 시작
   * @method POST
   * @param targetUserId 대리 로그인 대상 사용자 ID (숫자)
   * @permission SYSTEM_ADMIN만 가능
   * @response { success: true, data: { accessToken, refreshToken, impersonating, originalUserId, originalUserName, targetUserId, targetUserName, targetRole } }
   */
  impersonate: (targetUserId: number) =>
    `${getApiBaseUrl()}/common/auth/impersonate/${targetUserId}`,

  /**
   * 대리 로그인 종료 (원래 계정으로 복귀)
   * @method POST
   * @permission 대리 로그인 중인 사용자만 가능
   * @response { success: true, data: { accessToken, refreshToken, userId, userName, email, role } }
   */
  impersonateRevert: () => `${getApiBaseUrl()}/common/auth/impersonate/revert`,

  /**
   * 대리 로그인 가능한 사용자 목록 조회
   * @method GET
   * @permission SYSTEM_ADMIN만 가능
   * @query page, size, keyword (검색어)
   * @response { success: true, data: { content: User[], totalElements, totalPages } }
   */
  impersonateUsers: () => `${getApiBaseUrl()}/common/auth/impersonate/users`
}
