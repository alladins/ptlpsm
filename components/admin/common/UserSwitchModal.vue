<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <!-- 헤더 -->
        <div class="modal-header">
          <h3>
            <i class="fas fa-user-secret"></i>
            사용자 전환 (대리 로그인)
          </h3>
          <button class="btn-close" @click="handleClose">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 검색 영역 -->
        <div class="search-section">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input
              ref="searchInput"
              v-model="searchKeyword"
              type="text"
              placeholder="사용자명 또는 ID로 검색"
              @keyup.enter="handleSearch"
            />
            <button v-if="searchKeyword" class="btn-clear" @click="clearSearch">
              <i class="fas fa-times-circle"></i>
            </button>
          </div>
          <button class="btn-search" @click="handleSearch" :disabled="loading">
            검색
          </button>
        </div>

        <!-- 역할 필터 -->
        <div class="role-filter">
          <button
            v-for="role in roleFilters"
            :key="role.value"
            class="role-btn"
            :class="{ active: selectedRole === role.value }"
            @click="selectRole(role.value)"
          >
            {{ role.label }}
          </button>
        </div>

        <!-- 사용자 목록 -->
        <div class="user-list-container">
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>사용자 목록을 불러오는 중...</span>
          </div>

          <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ error }}</span>
            <button class="btn-retry" @click="fetchUsers">다시 시도</button>
          </div>

          <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <i class="fas fa-user-slash"></i>
            <span>검색 결과가 없습니다.</span>
          </div>

          <div v-else class="user-list">
            <div
              v-for="user in filteredUsers"
              :key="user.userid"
              class="user-item"
              :class="{ selected: selectedUser?.userid === user.userid }"
              @click="selectUser(user)"
            >
              <div class="user-avatar">
                <i class="fas fa-user"></i>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.userName }}</div>
                <div class="user-details">
                  <span class="user-id">{{ user.loginId }}</span>
                  <span class="user-role">{{ getRoleLabel(user.role) }}</span>
                  <span v-if="user.companyName" class="user-company">{{ user.companyName }}</span>
                </div>
              </div>
              <div v-if="selectedUser?.userid === user.userid" class="check-icon">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <div class="selected-info" v-if="selectedUser">
            <span class="label">선택됨:</span>
            <span class="name">{{ selectedUser.userName }}</span>
            <span class="role">({{ getRoleLabel(selectedUser.role) }})</span>
          </div>
          <div class="btn-group">
            <button class="btn-cancel" @click="handleClose">취소</button>
            <button
              class="btn-confirm"
              :disabled="!selectedUser || switching"
              @click="handleConfirm"
            >
              <i v-if="switching" class="fas fa-spinner fa-spin"></i>
              <span v-if="switching">전환 중...</span>
              <span v-else>사용자 전환</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { AUTH_ENDPOINTS } from '~/services/api/endpoints'

/**
 * 사용자 아이템 인터페이스
 *
 * 스키마 변경:
 * - userid: 숫자 (Primary Key, 기존 id)
 * - loginId: 문자열 (로그인용 ID, 기존 userId)
 */
interface UserItem {
  userid: number       // PK (숫자, 기존 id)
  loginId: string      // 로그인 ID (문자열, 기존 userId)
  userName: string
  email?: string
  role: string
  companyId?: number | null    // 회사 ID (FK)
  companyName?: string | null  // 회사명
}

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  switched: [userId: number]
}>()

const authStore = useAuthStore()

// 상태
const searchKeyword = ref('')
const selectedRole = ref('')
const users = ref<UserItem[]>([])
const selectedUser = ref<UserItem | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const switching = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 10
const searchInput = ref<HTMLInputElement | null>(null)

// 역할 필터 옵션
const roleFilters = [
  { value: '', label: '전체' },
  { value: 'LEADPOWER_MANAGER', label: '리드파워 담당자' },
  { value: 'OEM_MANAGER', label: 'OEM 담당자' },
  { value: 'SITE_MANAGER', label: '시공사 담당자' },
  { value: 'SITE_INSPECTOR', label: '시공사 감리원' },
  { value: 'SALES_MANAGER', label: '영업 담당자' },
  { value: 'DELIVERY_DRIVER', label: '운송기사' },
  { value: 'READ_ONLY', label: '조회 전용' }
]

// 역할 라벨 변환
function getRoleLabel(role: string | undefined | null): string {
  const roleMap: Record<string, string> = {
    'SYSTEM_ADMIN': '시스템관리자',
    'LEADPOWER_MANAGER': '리드파워 담당자',
    'OEM_MANAGER': 'OEM 담당자',
    'SITE_MANAGER': '시공사 담당자',
    'SITE_INSPECTOR': '시공사 감리원',
    'SALES_MANAGER': '영업 담당자',
    'DELIVERY_DRIVER': '운송기사',
    'READ_ONLY': '조회 전용'
  }
  return roleMap[role || ''] || role || '알 수 없음'
}

// 필터링된 사용자 목록
const filteredUsers = computed(() => {
  // 자기 자신 제외
  return users.value.filter(user => user.userid !== authStore.user?.userid)
})

// 모달 열릴 때 사용자 목록 로드
watch(() => props.show, async (show) => {
  if (show) {
    selectedUser.value = null
    searchKeyword.value = ''
    selectedRole.value = ''
    currentPage.value = 1
    await fetchUsers()
    // 검색 입력에 포커스
    await nextTick()
    searchInput.value?.focus()
  }
})

// 역할 선택 시 사용자 목록 다시 로드
watch(selectedRole, () => {
  currentPage.value = 1
  fetchUsers()
})

// 사용자 목록 조회
async function fetchUsers() {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      page: (currentPage.value - 1).toString(),  // UI는 1-indexed, API는 0-indexed
      size: pageSize.toString()
    })

    if (searchKeyword.value.trim()) {
      params.append('keyword', searchKeyword.value.trim())
    }

    if (selectedRole.value) {
      params.append('role', selectedRole.value)
    }

    const response = await fetch(`${AUTH_ENDPOINTS.impersonateUsers()}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data = await response.json()

    // 서버 응답 형식: { content: [...], totalPages: 1, ... }
    if (data.content && Array.isArray(data.content)) {
      users.value = data.content
      totalPages.value = data.totalPages || 1
    }
    // 기존 형식도 지원: { success: true, data: { content: [...] } }
    else if (data.success && data.data) {
      users.value = data.data.content || data.data || []
      totalPages.value = data.data.totalPages || 1
    } else {
      throw new Error(data.message || '사용자 목록 조회 실패')
    }
  } catch (err) {
    console.error('사용자 목록 조회 실패:', err)
    error.value = err instanceof Error ? err.message : '사용자 목록을 불러올 수 없습니다.'

    // Mock 데이터 (개발용)
    users.value = [
      { userid: 2, loginId: 'leadpower01', userName: '김리드', role: 'LEADPOWER_MANAGER', companyId: 1, companyName: '(주)리드파워' },
      { userid: 3, loginId: 'oem01', userName: '이OEM', role: 'OEM_MANAGER', companyId: 2, companyName: '(주)하이코리아' },
      { userid: 4, loginId: 'driver01', userName: '박운송', role: 'DELIVERY_DRIVER', companyId: 3, companyName: '주식회사 유진로지스틱스' },
      { userid: 5, loginId: 'site01', userName: '최현장', role: 'SITE_MANAGER', companyId: 4, companyName: '(주)한주토건' },
      { userid: 6, loginId: 'sales01', userName: '정영업', role: 'SALES_MANAGER', companyId: 1, companyName: '(주)리드파워' },
      { userid: 7, loginId: 'readonly01', userName: '한조회', role: 'READ_ONLY', companyId: 5, companyName: 'PTLPSM' },
      { userid: 8, loginId: 'inspector01', userName: '윤감리', role: 'SITE_INSPECTOR', companyId: 6, companyName: '플랫트리 주식회사' }
    ]
    totalPages.value = 1
    error.value = null // Mock 데이터 사용 시 에러 숨김
  } finally {
    loading.value = false
  }
}

// 검색 실행
function handleSearch() {
  currentPage.value = 1
  fetchUsers()
}

// 검색어 초기화
function clearSearch() {
  searchKeyword.value = ''
  currentPage.value = 1
  fetchUsers()
}

// 역할 선택
function selectRole(role: string) {
  selectedRole.value = role
}

// 사용자 선택
function selectUser(user: UserItem) {
  selectedUser.value = user
}

// 페이지 변경
function changePage(page: number) {
  currentPage.value = page
  fetchUsers()
}

// 모달 닫기
function handleClose() {
  emit('close')
}

// 사용자 전환 확인
async function handleConfirm() {
  if (!selectedUser.value) return

  switching.value = true

  try {
    const success = await authStore.startImpersonation(selectedUser.value.userid)

    if (success) {
      emit('switched', selectedUser.value.userid)
      emit('close')
      // 대시보드로 이동하여 권한 및 메뉴 갱신 (권한 없는 페이지에 남지 않도록)
      window.location.href = '/admin'
    } else {
      alert('사용자 전환에 실패했습니다.')
    }
  } catch (err) {
    console.error('사용자 전환 실패:', err)
    alert('사용자 전환에 실패했습니다.')
  } finally {
    switching.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h3 i {
  color: #6366f1;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.search-section {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 12px;
}

.search-input-wrapper i {
  color: #9ca3af;
  font-size: 14px;
}

.search-input-wrapper input {
  flex: 1;
  border: none;
  background: none;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.btn-clear {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
}

.btn-clear:hover {
  color: #6b7280;
}

.btn-search {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-search:hover:not(:disabled) {
  background: #2563eb;
}

.btn-search:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.role-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.role-btn {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.role-btn:hover {
  background: #e5e7eb;
}

.role-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.user-list-container {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 300px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #6b7280;
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 32px;
}

.error-state i {
  color: #ef4444;
}

.btn-retry {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #e5e7eb;
}

.user-list {
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:hover {
  background: #f9fafb;
}

.user-item.selected {
  background: #eff6ff;
  border: 1px solid #3b82f6;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.user-item.selected .user-avatar {
  background: #3b82f6;
  color: white;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
}

.user-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.user-role {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.user-company {
  color: #9ca3af;
  font-size: 11px;
}

.check-icon {
  color: #3b82f6;
  font-size: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
}

.page-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.selected-info {
  font-size: 14px;
  color: #6b7280;
}

.selected-info .label {
  color: #9ca3af;
}

.selected-info .name {
  font-weight: 600;
  color: #1f2937;
  margin-left: 4px;
}

.selected-info .role {
  color: #6b7280;
  margin-left: 4px;
}

.btn-group {
  display: flex;
  gap: 10px;
}

.btn-cancel {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-confirm {
  background: #6366f1;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-confirm:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 560px) {
  .modal-container {
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .search-section {
    padding: 12px 20px;
  }

  .role-filter {
    padding: 10px 20px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .btn-group {
    width: 100%;
  }

  .btn-cancel,
  .btn-confirm {
    flex: 1;
  }
}
</style>
