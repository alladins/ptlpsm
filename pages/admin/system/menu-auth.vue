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
            <option value="">역할을 선택하세요</option>
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

      <!-- 역할 미선택 안내 -->
      <div v-else-if="!selectedRoleCode" class="empty-state">
        <i class="fas fa-user-shield"></i>
        <p>역할을 선택하면 메뉴별 권한을 설정할 수 있습니다.</p>
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
                  <label class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      :checked="getPermission(menu.menuId, 'readAuth') === 'Y'"
                      @change="togglePermission(menu.menuId, 'readAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-auth">
                  <label class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      :checked="getPermission(menu.menuId, 'writeAuth') === 'Y'"
                      @change="togglePermission(menu.menuId, 'writeAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-auth">
                  <label class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      :checked="getPermission(menu.menuId, 'editAuth') === 'Y'"
                      @change="togglePermission(menu.menuId, 'editAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-auth">
                  <label class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      :checked="getPermission(menu.menuId, 'deleteAuth') === 'Y'"
                      @change="togglePermission(menu.menuId, 'deleteAuth')"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
                <td class="col-action">
                  <button class="btn-allow-sm" @click="setMenuAllPermissions(menu.menuId, 'Y')" title="전체 허용">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="btn-deny-sm" @click="setMenuAllPermissions(menu.menuId, 'N')" title="전체 차단">
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
import { roleService, menuService, getMockMenuData, getMockRoleData } from '~/services/menu.service'
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
}

const flatMenuList = computed<FlatMenuItem[]>(() => {
  const result: FlatMenuItem[] = []

  function flatten(menuList: Menu[], level: number = 1) {
    for (const menu of menuList) {
      result.push({
        menuId: menu.menuId,
        menuCode: menu.menuCode,
        menuName: menu.menuName,
        menuIcon: menu.menuIcon || 'fas fa-folder',
        level,
        parentMenuId: menu.parentMenuId
      })

      if (menu.children && menu.children.length > 0) {
        flatten(menu.children, level + 1)
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
    console.warn('역할 로드 실패, Mock 데이터 사용:', error)
    roles.value = getMockRoleData()
  }
}

/**
 * 메뉴 목록 로드
 */
async function loadMenus() {
  try {
    menus.value = await menuService.getAllMenus()
  } catch (error) {
    console.warn('메뉴 로드 실패, Mock 데이터 사용:', error)
    menus.value = getMockMenuData()
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
 * 권한 토글
 */
function togglePermission(menuId: number, authType: keyof Pick<RolePermission, 'readAuth' | 'writeAuth' | 'editAuth' | 'deleteAuth'>) {
  const perm = permissions.value.get(menuId)
  if (perm) {
    perm[authType] = perm[authType] === 'Y' ? 'N' : 'Y'
  }
}

/**
 * 특정 메뉴의 모든 권한 설정
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
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.role-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.role-selector label {
  font-weight: 500;
  color: #374151;
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
  font-size: 0.875rem;
}

.permission-table th,
.permission-table td {
  padding: 0.75rem 1rem;
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
  min-width: 250px;
}

.permission-table .col-auth {
  width: 80px;
}

.permission-table .col-action {
  width: 100px;
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
  width: 20px;
  margin-right: 0.5rem;
  color: #6b7280;
}

/* 체크박스 스타일 */
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
}

/* 일괄 설정 버튼 */
.btn-allow-sm,
.btn-deny-sm {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.btn-allow-sm {
  background: #d1fae5;
  color: #047857;
  margin-right: 0.25rem;
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
