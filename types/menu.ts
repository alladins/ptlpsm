// 메뉴 관련 타입 정의
export interface Menu {
  menuId: number
  menuCode: string
  menuName: string
  parentMenuId?: number
  menuUrl?: string
  menuIcon?: string
  menuLevel: number
  target?: string
  sortOrder: number
  visible: 'Y' | 'N'
  useYn: 'Y' | 'N'
  description?: string
  children?: Menu[]
  pages?: MenuPage[]
  auth?: MenuAuth  // 메뉴 권한 정보
}

export interface MenuPage {
  pageId: number
  menuId: number
  pageCode: string
  pageName: string
  pageUrl?: string
  pageType: 'PAGE' | 'MODAL' | 'POPUP'
  description?: string
  sortOrder: number
  useYn: 'Y' | 'N'
}

export interface MenuAuth {
  readAuth: 'Y' | 'N'
  writeAuth: 'Y' | 'N'
  editAuth: 'Y' | 'N'
  deleteAuth: 'Y' | 'N'
}

export interface UserMenuAuth extends MenuAuth {
  userId: number
  menuId: number
}

export interface UserPageAuth extends MenuAuth {
  userId: number
  pageId: number
}

export interface RoleMenuAuth extends MenuAuth {
  roleCode: string
  menuId: number
}

export interface RolePageAuth extends MenuAuth {
  roleCode: string
  pageId: number
}
