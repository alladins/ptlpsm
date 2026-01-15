/**
 * 사용자 관리 타입 정의
 */

/**
 * 역할별 사용자 조회 API 응답
 * GET /api/common/users/by-roles?roles=OEM_MANAGER&roles=DELIVERY_DRIVER
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
  companyId: number | null     // 회사 ID (FK)
  companyName: string | null   // 회사명
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
  | 'DELIVERY_DRIVER'
  | 'READ_ONLY'

/**
 * 역할 코드 상수 (8가지)
 */
export const ROLE_CODES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  LEADPOWER_MANAGER: 'LEADPOWER_MANAGER',
  OEM_MANAGER: 'OEM_MANAGER',
  SITE_MANAGER: 'SITE_MANAGER',
  SITE_INSPECTOR: 'SITE_INSPECTOR',
  DELIVERY_DRIVER: 'DELIVERY_DRIVER',
  SALES_MANAGER: 'SALES_MANAGER',
  READ_ONLY: 'READ_ONLY'
} as const

/**
 * 역할 정보 인터페이스
 */
export interface RoleInfo {
  roleCode: UserRole
  roleName: string
  description: string
  sortOrder: number
}

/**
 * 역할 목록 (메뉴권한관리에서 사용)
 * - SYSTEM_ADMIN 제외: 항상 전체 권한이므로 설정 불필요
 */
export const ROLE_LIST: RoleInfo[] = [
  { roleCode: 'LEADPOWER_MANAGER', roleName: '리드파워 담당자', description: '리드파워 전체 업무 담당', sortOrder: 1 },
  { roleCode: 'OEM_MANAGER', roleName: 'OEM 담당자', description: 'OEM 업체 담당자', sortOrder: 2 },
  { roleCode: 'SITE_MANAGER', roleName: '시공사 담당자', description: '시공사 현장 담당자', sortOrder: 3 },
  { roleCode: 'SITE_INSPECTOR', roleName: '시공사 감리원', description: '시공사 감리 담당', sortOrder: 4 },
  { roleCode: 'DELIVERY_DRIVER', roleName: '운송기사', description: '배송/운송 담당', sortOrder: 5 },
  { roleCode: 'SALES_MANAGER', roleName: '영업 담당자', description: '영업 업무 담당', sortOrder: 6 },
  { roleCode: 'READ_ONLY', roleName: '조회 전용', description: '조회만 가능한 역할', sortOrder: 7 }
]

/**
 * 역할 코드로 역할 정보 조회
 */
export function getRoleInfo(roleCode: string): RoleInfo | undefined {
  return ROLE_LIST.find(role => role.roleCode === roleCode)
}

/**
 * 역할 코드로 역할명 조회
 */
export function getRoleName(roleCode: string): string {
  const role = getRoleInfo(roleCode)
  return role?.roleName || roleCode
}

/**
 * 드롭다운용 간소화 타입
 */
export interface UserOption {
  userid: number       // PK (숫자, 기존 id)
  userName: string
  phone: string
  companyId: number | null     // 회사 ID (FK)
  companyName: string | null   // 회사명
}
