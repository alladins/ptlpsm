/**
 * 사용자 관리 타입 정의
 */

/**
 * 역할별 사용자 조회 API 응답
 * GET /api/common/users/by-roles?roles=OEM_MANAGER&roles=COURIER
 *
 * 스키마 변경:
 * - userid: 숫자 (Primary Key, 기존 id)
 * - loginId: 문자열 (로그인용 ID, 기존 userId)
 */
export interface UserByRole {
  userid: number       // PK (숫자, 기존 id)
  loginId: string      // 로그인 ID (문자열, 기존 userId)
  userName: string
  email: string
  phone: string
  department: string | null
  position: string | null
  role: string
  roleName: string
  companyName: string | null
  enabled: boolean
}

/**
 * 사용자 역할 타입
 */
export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'LEADPOWER_MANAGER'
  | 'OEM_MANAGER'
  | 'SITE_MANAGER'
  | 'SITE_INSPECTOR'
  | 'SALES_MANAGER'
  | 'COURIER'
  | 'READ_ONLY'

/**
 * 드롭다운용 간소화 타입
 */
export interface UserOption {
  userid: number       // PK (숫자, 기존 id)
  userName: string
  phone: string
  companyName: string | null
}
