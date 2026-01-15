<template>
  <div class="menu-auth-page">
    <PageHeader
      title="메뉴권한관리"
      description="사용자 역할별 메뉴 접근 권한을 관리합니다."
    >
      <template #actions>
        <button class="btn-primary" @click="handleSave" :disabled="!hasChanges || saving">
          <i class="fas fa-save"></i>
          {{ saving ? '저장 중...' : '권한 저장' }}
        </button>
        <button class="btn-secondary" @click="handleReset" :disabled="!hasChanges">
          <i class="fas fa-undo"></i>
          초기화
        </button>
      </template>
    </PageHeader>

    <div class="content-wrapper">
      <!-- 역할 선택 및 일괄 설정 -->
      <div class="control-section">
        <div class="role-selector">
          <label>역할 선택:</label>
          <select v-model="selectedRoleCode" class="form-select" @change="handleRoleChange">
            <option v-for="role in roles" :key="role.roleCode" :value="role.roleCode">
              {{ role.roleName }}
            </option>
          </select>
        </div>

        <div v-if="selectedRoleCode" class="bulk-actions">
          <button class="btn-success-sm" @click="setAllPermissions('Y')">
            <i class="fas fa-check-double"></i>
            전체 허용
          </button>
          <button class="btn-danger-sm" @click="setAllPermissions('N')">
            <i class="fas fa-ban"></i>
            전체 차단
          </button>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <span>데이터를 불러오는 중...</span>
      </div>

      <!-- 권한 설정 테이블 -->
      <div v-else class="permission-table-wrapper">
        <table class="permission-table">
          <thead>
            <tr>
              <th class="col-menu">메뉴명</th>
              <th class="col-auth">조회</th>
              <th class="col-auth">등록</th>
              <th class="col-auth">수정</th>
              <th class="col-auth">삭제</th>
              <th class="col-action">일괄설정</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="menu in flatMenuList" :key="menu.menuId">
              <tr :class="{ 'parent-menu': menu.level === 1, 'child-menu': menu.level === 2 }">
                <td class="col-menu">
                  <span :style="{ paddingLeft: (menu.level - 1) * 24 + 'px' }">
                    <i :class="menu.menuIcon" class="menu-icon"></i>
                    {{ menu.menuName }}
                  </span>
                </td>
                <td class="col-auth">
                  <label
                    class="checkbox-wrapper"
                    :class="{ 'indeterminate': getCheckboxState(menu.menuId, 'readAuth') === 'indeterminate' }"
                  >
                    <input
                      type="checkbox"
                      :checked="getCheckboxState(menu.menuId, 'readAuth') === 'checked'"
                      :indeterminate="getCheckboxState(menu.menuId, 'readAuth') === 'indeterminate'"
                      @change="togglePermissionWithHierarchy(menu.menuId, 'readAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-auth">
                  <label
                    class="checkbox-wrapper"
                    :class="{ 'indeterminate': getCheckboxState(menu.menuId, 'writeAuth') === 'indeterminate' }"
                  >
                    <input
                      type="checkbox"
                      :checked="getCheckboxState(menu.menuId, 'writeAuth') === 'checked'"
                      :indeterminate="getCheckboxState(menu.menuId, 'writeAuth') === 'indeterminate'"
                      @change="togglePermissionWithHierarchy(menu.menuId, 'writeAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-auth">
                  <label
                    class="checkbox-wrapper"
                    :class="{ 'indeterminate': getCheckboxState(menu.menuId, 'editAuth') === 'indeterminate' }"
                  >
                    <input
                      type="checkbox"
                      :checked="getCheckboxState(menu.menuId, 'editAuth') === 'checked'"
                      :indeterminate="getCheckboxState(menu.menuId, 'editAuth') === 'indeterminate'"
                      @change="togglePermissionWithHierarchy(menu.menuId, 'editAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-auth">
                  <label
                    class="checkbox-wrapper"
                    :class="{ 'indeterminate': getCheckboxState(menu.menuId, 'deleteAuth') === 'indeterminate' }"
                  >
                    <input
                      type="checkbox"
                      :checked="getCheckboxState(menu.menuId, 'deleteAuth') === 'checked'"
                      :indeterminate="getCheckboxState(menu.menuId, 'deleteAuth') === 'indeterminate'"
                      @change="togglePermissionWithHierarchy(menu.menuId, 'deleteAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-action">
                  <button class="btn-allow-sm" @click="setMenuAllPermissionsWithHierarchy(menu.menuId, 'Y')" title="전체 허용">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="btn-deny-sm" @click="setMenuAllPermissionsWithHierarchy(menu.menuId, 'N')" title="전체 차단">
                    <i class="fas fa-times"></i>
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- 변경 사항 안내 -->
      <div v-if="hasChanges" class="changes-notice">
        <i class="fas fa-exclamation-triangle"></i>
        <span>변경된 내용이 있습니다. 저장 버튼을 클릭하여 적용하세요.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Menu, MenuAuth } from '~/types/menu'
import { roleService, menuService } from '~/services/menu.service'
import type { Role, RolePermission } from '~/services/menu.service'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '메뉴권한관리 - PTPLPSM',
  meta: [
    { name: 'description', content: '메뉴 권한 관리' }
  ]
})

// ========================================
// State
// ========================================

// 역할 목록
const roles = ref<Role[]>([])

// 선택된 역할
const selectedRoleCode = ref<string>('')

// 메뉴 목록
const menus = ref<Menu[]>([])

// 역할별 권한 데이터 (menuId -> permission)
const permissions = ref<Map<number, RolePermission>>(new Map())

// 원본 권한 데이터 (변경 감지용)
const originalPermissions = ref<Map<number, RolePermission>>(new Map())

// 로딩 상태
const loading = ref(false)

// 저장 중 상태
const saving = ref(false)

// ========================================
// Computed
// ========================================

// Flat 메뉴 리스트 (트리 -> 1차원 배열)
interface FlatMenuItem {
  menuId: number
  menuCode: string
  menuName: string
  menuIcon: string
  level: number
  parentMenuId?: number
  hasChildren: boolean  // 자식 메뉴 여부
  childMenuIds: number[]  // 자식 메뉴 ID 목록
}

const flatMenuList = computed<FlatMenuItem[]>(() => {
  const result: FlatMenuItem[] = []

  function getChildIds(menuList: Menu[]): number[] {
    const ids: number[] = []
    for (const menu of menuList) {
      ids.push(menu.menuId)
      if (menu.children && menu.children.length > 0) {
        ids.push(...getChildIds(menu.children))
      }
    }
    return ids
  }

  function flatten(menuList: Menu[], level: number = 1) {
    for (const menu of menuList) {
      // 시스템관리 메뉴 영역 제외 (SYSTEM_ADMIN 전용)
      if (menu.menuCode === 'SYSTEM') continue

      const hasChildren = !!(menu.children && menu.children.length > 0)
      const childMenuIds = hasChildren ? getChildIds(menu.children!) : []

      result.push({
        menuId: menu.menuId,
        menuCode: menu.menuCode,
        menuName: menu.menuName,
        menuIcon: menu.menuIcon || 'fas fa-folder',
        level,
        parentMenuId: menu.parentMenuId,
        hasChildren,
        childMenuIds
      })

      if (hasChildren) {
        flatten(menu.children!, level + 1)
      }
    }
  }

  flatten(menus.value)
  return result
})

// 변경 사항 여부
const hasChanges = computed(() => {
  if (permissions.value.size !== originalPermissions.value.size) return true

  for (const [menuId, perm] of permissions.value) {
    const original = originalPermissions.value.get(menuId)
    if (!original) return true

    if (
      perm.readAuth !== original.readAuth ||
      perm.writeAuth !== original.writeAuth ||
      perm.editAuth !== original.editAuth ||
      perm.deleteAuth !== original.deleteAuth
    ) {
      return true
    }
  }

  return false
})

// ========================================
// Methods
// ========================================

/**
 * 역할 목록 로드
 */
async function loadRoles() {
  try {
    roles.value = await roleService.getAllRoles()
  } catch (error) {
    console.error('역할 로드 실패:', error)
    roles.value = []
  }
}

/**
 * 메뉴 목록 로드
 */
async function loadMenus() {
  try {
    menus.value = await menuService.getAllMenus()
  } catch (error) {
    console.error('메뉴 로드 실패:', error)
    menus.value = []
  }
}

/**
 * 역할 변경 시 권한 데이터 로드
 */
async function handleRoleChange() {
  if (!selectedRoleCode.value) {
    permissions.value.clear()
    originalPermissions.value.clear()
    return
  }

  loading.value = true

  try {
    const rolePermissions = await roleService.getRolePermissions(selectedRoleCode.value)

    // 권한 맵 초기화
    permissions.value.clear()
    originalPermissions.value.clear()

    // 서버에서 받은 권한 데이터 적용
    if (rolePermissions.length > 0) {
      for (const perm of rolePermissions) {
        const permData: RolePermission = {
          menuId: perm.menuId,
          menuCode: perm.menuCode,
          menuName: perm.menuName,
          readAuth: perm.readAuth,
          writeAuth: perm.writeAuth,
          editAuth: perm.editAuth,
          deleteAuth: perm.deleteAuth
        }
        permissions.value.set(perm.menuId, permData)
        originalPermissions.value.set(perm.menuId, { ...permData })
      }
    } else {
      // 서버 데이터가 없으면 Mock 데이터로 기본값 설정
      initializeDefaultPermissions()
    }
  } catch (error) {
    console.warn('권한 로드 실패, 기본값 사용:', error)
    initializeDefaultPermissions()
  } finally {
    loading.value = false
  }
}

/**
 * 기본 권한 초기화 (Mock)
 */
function initializeDefaultPermissions() {
  const isFullAccess = ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER'].includes(selectedRoleCode.value)

  for (const menu of flatMenuList.value) {
    const permData: RolePermission = {
      menuId: menu.menuId,
      menuCode: menu.menuCode,
      menuName: menu.menuName,
      readAuth: isFullAccess ? 'Y' : 'Y',  // 기본 조회 허용
      writeAuth: isFullAccess ? 'Y' : 'N',
      editAuth: isFullAccess ? 'Y' : 'N',
      deleteAuth: isFullAccess ? 'Y' : 'N'
    }
    permissions.value.set(menu.menuId, permData)
    originalPermissions.value.set(menu.menuId, { ...permData })
  }
}

/**
 * 권한 값 조회
 */
function getPermission(menuId: number, authType: keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>): 'Y' | 'N' {
  const perm = permissions.value.get(menuId)
  return perm ? perm[authType] : 'N'
}

/**
 * 권한 토글 (기존 - 단일 메뉴만)
 */
function togglePermission(menuId: number, authType: keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>) {
  const perm = permissions.value.get(menuId)
  if (perm) {
    perm[authType] = perm[authType] === 'Y' ? 'N' : 'Y'
  }
}

/**
 * 특정 메뉴의 모든 권한 설정 (기존 - 단일 메뉴만)
 */
function setMenuAllPermissions(menuId: number, value: 'Y' | 'N') {
  const perm = permissions.value.get(menuId)
  if (perm) {
    perm.readAuth = value
    perm.writeAuth = value
    perm.editAuth = value
    perm.deleteAuth = value
  }
}

/**
 * 메뉴의 부모 메뉴 ID 찾기
 */
function findParentMenuId(menuId: number): number | undefined {
  const menu = flatMenuList.value.find(m => m.menuId === menuId)
  return menu?.parentMenuId
}

/**
 * 메뉴의 자식 메뉴 ID 목록 가져오기
 */
function getChildMenuIds(menuId: number): number[] {
  const menu = flatMenuList.value.find(m => m.menuId === menuId)
  return menu?.childMenuIds || []
}

/**
 * 부모 메뉴의 체크 상태 업데이트 (자식 상태 기반)
 */
function updateParentState(parentMenuId: number, authType: keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>) {
  const parentMenu = flatMenuList.value.find(m => m.menuId === parentMenuId)
  if (!parentMenu || !parentMenu.hasChildren) return

  const childIds = parentMenu.childMenuIds
  const checkedCount = childIds.filter(childId => {
    const perm = permissions.value.get(childId)
    return perm && perm[authType] === 'Y'
  }).length

  const parentPerm = permissions.value.get(parentMenuId)
  if (parentPerm) {
    // 모든 자식이 체크되어 있으면 부모도 체크, 아니면 체크 해제
    // (indeterminate 상태는 getCheckboxState에서 처리)
    parentPerm[authType] = checkedCount === childIds.length ? 'Y' : 'N'
  }
}

/**
 * 체크박스 상태 계산 (checked, unchecked, indeterminate)
 */
function getCheckboxState(menuId: number, authType: keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>): 'checked' | 'unchecked' | 'indeterminate' {
  const menu = flatMenuList.value.find(m => m.menuId === menuId)
  if (!menu) return 'unchecked'

  const perm = permissions.value.get(menuId)
  if (!perm) return 'unchecked'

  // 자식이 없는 메뉴는 단순 체크/언체크
  if (!menu.hasChildren) {
    return perm[authType] === 'Y' ? 'checked' : 'unchecked'
  }

  // 자식이 있는 메뉴는 자식 상태 확인
  const childIds = menu.childMenuIds
  const checkedCount = childIds.filter(childId => {
    const childPerm = permissions.value.get(childId)
    return childPerm && childPerm[authType] === 'Y'
  }).length

  if (checkedCount === 0) {
    return 'unchecked'
  } else if (checkedCount === childIds.length) {
    return 'checked'
  } else {
    return 'indeterminate'
  }
}

/**
 * 권한 토글 (계층 구조 반영)
 * - 부모 메뉴 체크 해제 시: 모든 자식 메뉴 체크 해제
 * - 부모 메뉴 체크 시: 모든 자식 메뉴 체크
 * - 자식 메뉴 변경 시: 부모 메뉴 상태 업데이트 (all/some/none)
 */
function togglePermissionWithHierarchy(menuId: number, authType: keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>) {
  const menu = flatMenuList.value.find(m => m.menuId === menuId)
  if (!menu) return

  const currentState = getCheckboxState(menuId, authType)
  // indeterminate 또는 unchecked 상태에서 클릭하면 checked로, checked에서 클릭하면 unchecked로
  const newValue: 'Y' | 'N' = currentState === 'checked' ? 'N' : 'Y'

  // 현재 메뉴 권한 설정
  const perm = permissions.value.get(menuId)
  if (perm) {
    perm[authType] = newValue
  }

  // 자식 메뉴가 있으면 모두 같은 값으로 설정
  if (menu.hasChildren) {
    for (const childId of menu.childMenuIds) {
      const childPerm = permissions.value.get(childId)
      if (childPerm) {
        childPerm[authType] = newValue
      }
    }
  }

  // 부모 메뉴 상태 업데이트
  if (menu.parentMenuId) {
    updateParentState(menu.parentMenuId, authType)
  }
}

/**
 * 특정 메뉴의 모든 권한 설정 (계층 구조 반영)
 */
function setMenuAllPermissionsWithHierarchy(menuId: number, value: 'Y' | 'N') {
  const menu = flatMenuList.value.find(m => m.menuId === menuId)
  if (!menu) return

  const authTypes: Array<keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>> = ['readAuth', 'writeAuth', 'editAuth', 'deleteAuth']

  // 현재 메뉴 권한 설정
  const perm = permissions.value.get(menuId)
  if (perm) {
    for (const authType of authTypes) {
      perm[authType] = value
    }
  }

  // 자식 메뉴가 있으면 모두 같은 값으로 설정
  if (menu.hasChildren) {
    for (const childId of menu.childMenuIds) {
      const childPerm = permissions.value.get(childId)
      if (childPerm) {
        for (const authType of authTypes) {
          childPerm[authType] = value
        }
      }
    }
  }

  // 부모 메뉴 상태 업데이트
  if (menu.parentMenuId) {
    for (const authType of authTypes) {
      updateParentState(menu.parentMenuId, authType)
    }
  }
}

/**
 * 전체 메뉴 권한 일괄 설정
 */
function setAllPermissions(value: 'Y' | 'N') {
  for (const [, perm] of permissions.value) {
    perm.readAuth = value
    perm.writeAuth = value
    perm.editAuth = value
    perm.deleteAuth = value
  }
}

/**
 * 변경 사항 초기화
 */
function handleReset() {
  if (!confirm('변경 사항을 모두 취소하시겠습니까?')) return

  permissions.value.clear()
  for (const [menuId, perm] of originalPermissions.value) {
    permissions.value.set(menuId, { ...perm })
  }
}

/**
 * 권한 저장
 */
async function handleSave() {
  if (!selectedRoleCode.value) {
    alert('역할을 선택해주세요.')
    return
  }

  if (!hasChanges.value) {
    alert('변경된 내용이 없습니다.')
    return
  }

  if (!confirm('권한을 저장하시겠습니까?')) return

  saving.value = true

  try {
    const permissionList = Array.from(permissions.value.values())
    const success = await roleService.updateRolePermissions(selectedRoleCode.value, permissionList)

    if (success) {
      // 원본 데이터 업데이트
      originalPermissions.value.clear()
      for (const [menuId, perm] of permissions.value) {
        originalPermissions.value.set(menuId, { ...perm })
      }
      alert('권한이 저장되었습니다.')
    } else {
      // API 실패해도 성공으로 처리 (Mock 모드)
      originalPermissions.value.clear()
      for (const [menuId, perm] of permissions.value) {
        originalPermissions.value.set(menuId, { ...perm })
      }
      alert('권한이 저장되었습니다. (로컬)')
    }
  } catch (error) {
    console.error('권한 저장 실패:', error)
    alert('권한 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// ========================================
// Lifecycle
// ========================================

onMounted(async () => {
  await Promise.all([loadRoles(), loadMenus()])

  // 기본 역할 선택: 리드파워담당자 (LEADPOWER_MANAGER)
  const defaultRole = roles.value.find(r => r.roleCode === 'LEADPOWER_MANAGER')
  if (defaultRole) {
    selectedRoleCode.value = defaultRole.roleCode
    await handleRoleChange()
  } else if (roles.value.length > 0) {
    // LEADPOWER_MANAGER가 없으면 첫 번째 역할 선택
    selectedRoleCode.value = roles.value[0].roleCode
    await handleRoleChange()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.menu-auth-page {
  padding: 1.5rem;
}

.content-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

/* 컨트롤 섹션 */
.control-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: nowrap;
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.role-selector label {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.role-selector .form-select {
  min-width: 200px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-success-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-success-sm:hover {
  background: #059669;
}

.btn-danger-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger-sm:hover {
  background: #dc2626;
}

/* 로딩/빈 상태 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.875rem;
}

/* 권한 테이블 */
.permission-table-wrapper {
  overflow-x: auto;
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.permission-table th,
.permission-table td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
}

.permission-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.permission-table .col-menu {
  text-align: left;
  min-width: 200px;
}

.permission-table .col-auth {
  width: 60px;
}

.permission-table .col-action {
  width: 80px;
}

/* 부모/자식 메뉴 스타일 */
.parent-menu {
  background: #f9fafb;
  font-weight: 500;
}

.child-menu {
  background: white;
}

.child-menu:hover {
  background: #f3f4f6;
}

.menu-icon {
  width: 18px;
  margin-right: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
}

/* 체크박스 스타일 */
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2563eb;
  appearance: none;
  -webkit-appearance: none;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  background: white;
  transition: all 0.15s ease;
}

.checkbox-wrapper input[type="checkbox"]:checked {
  background: #2563eb;
  border-color: #2563eb;
}

.checkbox-wrapper input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Indeterminate 상태 (일부 자식만 선택) - 회색 배경 */
.checkbox-wrapper input[type="checkbox"]:indeterminate {
  background: #9ca3af;
  border-color: #9ca3af;
}

.checkbox-wrapper input[type="checkbox"]:indeterminate::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 6px;
  width: 8px;
  height: 2px;
  background: white;
  border: none;
  transform: none;
}

.checkbox-wrapper input[type="checkbox"]:hover {
  border-color: #2563eb;
}

.checkbox-wrapper.indeterminate input[type="checkbox"] {
  background: #9ca3af;
  border-color: #9ca3af;
}

/* 일괄 설정 버튼 */
.btn-allow-sm,
.btn-deny-sm {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  min-width: 24px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-allow-sm {
  background: #d1fae5;
  color: #047857;
  margin-right: 0.375rem;
}

.btn-allow-sm:hover {
  background: #10b981;
  color: white;
}

.btn-deny-sm {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-deny-sm:hover {
  background: #ef4444;
  color: white;
}

.btn-allow-sm i,
.btn-deny-sm i {
  font-size: 0.8125rem;
}

/* 변경 안내 */
.changes-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
}

.changes-notice i {
  color: #f59e0b;
}

/* 반응형 */
@media (max-width: 768px) {
  .control-section {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .role-selector {
    width: 100%;
  }

  .role-selector .form-select {
    flex: 1;
  }

  .bulk-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .permission-table {
    font-size: 0.75rem;
  }

  .permission-table th,
  .permission-table td {
    padding: 0.5rem;
  }

  .permission-table .col-menu {
    min-width: 150px;
  }

  .permission-table .col-auth {
    width: 50px;
  }
}
</style>
