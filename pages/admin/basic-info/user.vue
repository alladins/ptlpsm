<template>
  <div class="user-management">
    <UiPageHeader
      title="사용자관리"
      description="시스템 사용자 정보를 관리합니다."
    />

    <div class="content-section">
      <!-- 검색 조건 섹션 -->
      <div class="search-section">
        <div class="search-form">
          <div class="form-row">
                          <div class="form-group">
                <label>권한</label>
                <select v-model="searchForm.role" class="form-select">
                  <option value="">전체</option>
                  <option v-for="role in userRoles" :key="role.code" :value="role.code">
                    {{ role.codeName }}
                  </option>
                </select>
              </div>
            <div class="form-group">
              <label>상태</label>
              <select v-model="searchForm.enabled" class="form-select">
                <option value="">전체</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
            <div class="form-group">
              <label>검색어</label>
              <input 
                type="text" 
                v-model="searchForm.searchKeyword" 
                placeholder="검색어를 입력하세요" 
                class="form-input"
              >
            </div>
            <div class="form-group button-group">
              <button class="btn-primary" @click="searchUsers">
                <i class="fas fa-search"></i>
                <span>검색</span>
              </button>
              <button class="btn-secondary" @click="resetSearch">
                <i class="fas fa-undo"></i>
                <span>초기화</span>
              </button>
              <button class="btn-primary" @click="openAddModal">
                <i class="fas fa-plus"></i>
                <span>등록</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 사용자 목록 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex + 1 }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <select v-model="pageSize" @change="changePageSize" class="page-size-select">
              <option value="10">10개씩</option>
              <option value="20">20개씩</option>
              <option value="50">50개씩</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>사용자 ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>부서</th>
                <th>직급</th>
                <th>소속회사</th>
                <th>권한</th>
                <th>상태</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="table-row">
                <td>{{ user.userId }}</td>
                <td>{{ user.userName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.phone || '-' }}</td>
                <td>{{ user.department || '-' }}</td>
                <td>{{ user.position || '-' }}</td>
                <td>{{ user.companyName || '-' }}</td>
                <td>
                  <span class="role-badge" :class="getRoleClass(user.role)">
                    {{ getRoleName(user.role) }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="{ active: user.enabled }">
                    {{ user.enabled ? '활성' : '비활성' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td class="action-buttons">
                  <button class="btn-edit" @click="openEditModal(user)" title="수정">
                    <i class="fas fa-edit"></i>
                    <span>수정</span>
                  </button>
                  <button class="btn-delete" @click="deleteUser(user)" title="삭제">
                    <i class="fas fa-trash"></i>
                    <span>삭제</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 데이터가 없을 때 -->
          <div v-if="users.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-users"></i>
            <p>등록된 사용자가 없습니다.</p>
          </div>

          <!-- 로딩 중 -->
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>데이터를 불러오는 중...</p>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination">
          <button 
            :disabled="currentPage === 0" 
            @click="changePage(currentPage - 1)"
            class="pagination-btn"
          >
            이전
          </button>
          
          <!-- 페이지 번호들 -->
          <div class="page-numbers">
            <button 
              v-for="pageNum in visiblePages" 
              :key="pageNum"
              @click="changePage(pageNum)"
              :class="['page-number', { active: pageNum === currentPage }]"
              :disabled="pageNum === currentPage"
            >
              {{ pageNum + 1 }}
            </button>
          </div>
          
          <button 
            :disabled="currentPage >= totalPages - 1" 
            @click="changePage(currentPage + 1)"
            class="pagination-btn"
          >
            다음
          </button>
        </div>
      </div>
    </div>

    <!-- 사용자 등록/수정 모달 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '사용자 등록' : '사용자 수정' }}</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleFormSubmit" class="user-form">
            <div class="form-row">
              <div class="form-group">
                <label>사용자 ID *</label>
                <input 
                  v-model="userForm.userId" 
                  type="text" 
                  required
                  placeholder="사용자 ID"
                  :disabled="showEditModal"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>비밀번호 *</label>
                <div v-if="showEditModal" class="password-section">
                  <button type="button" class="btn-password-change" @click="showPasswordModal = true">
                    <i class="fas fa-key"></i>
                    <span>비밀번호 변경</span>
                  </button>
                </div>
                <div v-else class="password-input-section">
                  <input 
                    v-model="userForm.password" 
                    type="password" 
                    required
                    placeholder="비밀번호"
                    class="form-input"
                  >
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>이름 *</label>
                <input 
                  v-model="userForm.userName" 
                  type="text" 
                  required
                  placeholder="이름"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>이메일 *</label>
                <input 
                  v-model="userForm.email" 
                  type="email" 
                  required
                  placeholder="이메일"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>연락처</label>
                <input 
                  v-model="userForm.phone" 
                  type="tel" 
                  placeholder="연락처"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>부서</label>
                <input 
                  v-model="userForm.department" 
                  type="text" 
                  placeholder="부서"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>직급</label>
                <input 
                  v-model="userForm.position" 
                  type="text" 
                  placeholder="직급"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>사원번호</label>
                <input 
                  v-model="userForm.employeeNumber" 
                  type="text" 
                  placeholder="사원번호"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>소속회사</label>
                <select
                  v-model="userForm.companyName"
                  class="form-select"
                  :disabled="loadingCompanies"
                >
                  <option value="">선택 안 함</option>
                  <option
                    v-for="company in companies"
                    :key="company.id"
                    :value="company.companyName"
                  >
                    {{ company.companyName }}
                  </option>
                </select>
                <span v-if="loadingCompanies" class="field-hint">
                  <i class="fas fa-spinner fa-spin"></i> 회사 목록 로딩 중...
                </span>
              </div>
              <div class="form-group">
                <label>권한 *</label>
                <select v-model="userForm.role" required class="form-select">
                  <option value="">권한을 선택하세요</option>
                  <option v-for="role in userRoles" :key="role.code" :value="role.code">
                    {{ role.codeName }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>우편번호</label>
                <input 
                  v-model="userForm.zipCode" 
                  type="text" 
                  placeholder="우편번호"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>주소</label>
                <input 
                  v-model="userForm.address" 
                  type="text" 
                  placeholder="주소"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>상세주소</label>
                <input 
                  v-model="userForm.addressDetail" 
                  type="text" 
                  placeholder="상세주소"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>{{ showAddModal ? '등록' : '수정' }}</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 모달 -->
    <div v-if="showPasswordModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>비밀번호 변경</h3>
          <button class="modal-close" @click="closePasswordModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="password-change-info">
            <i class="fas fa-shield-alt"></i>
            <p>새 비밀번호와 확인 비밀번호만 입력하세요.</p>
          </div>
          <form @submit.prevent="submitPasswordChange" class="password-form">
            <div class="form-group">
              <label>새 비밀번호 *</label>
              <input 
                v-model="passwordForm.newPassword" 
                type="password" 
                required
                placeholder="새 비밀번호를 입력하세요"
                class="form-input"
              >
              <small class="form-help">
                영문, 숫자, 특수문자 조합 6~100자
              </small>
            </div>

            <div class="form-group">
              <label>새 비밀번호 확인 *</label>
              <input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                required
                placeholder="새 비밀번호를 다시 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-key"></i>
                <span>비밀번호 변경</span>
              </button>
              <button type="button" class="btn-secondary" @click="closePasswordModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  pageTitle: '사용자관리'
})

// API 서비스
import { userService } from '~/services/user.service'
import { codeService } from '~/services/code.service'
import { companyService } from '~/services/company.service'
import type { CompanyInfoResponse } from '~/types/company'

// 반응형 데이터
const users = ref<any[]>([])
const userRoles = ref<any[]>([])
const companies = ref<CompanyInfoResponse[]>([])
const loading = ref(false)
const loadingCompanies = ref(false)

// 검색 관련
const searchForm = ref({
  searchKeyword: '',
  role: '',
  enabled: '',
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDirection: 'desc'
})

// 페이징 관련
const currentPage = ref(0)
const pageSize = ref(10)
const totalElements = ref(0)
const totalPages = ref(0)

// 모달 관련
const showAddModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const editingUser = ref<any>(null)

// 사용자 폼
const userForm = ref({
  userId: '',
  password: '',
  userName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  employeeNumber: '',
  companyName: '',
  role: '',
  address: '',
  addressDetail: '',
  zipCode: ''
})

// 비밀번호 변경 폼
const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

// 유효성 검사 오류 메시지
const validationErrors = ref<{
  userId: string
  password: string
  userName: string
  email: string
  role: string
  phone: string
  [key: string]: string
}>({
  userId: '',
  password: '',
  userName: '',
  email: '',
  role: '',
  phone: ''
})

// 비밀번호 변경 유효성 검사 오류 메시지
const passwordValidationErrors = ref<{
  newPassword: string
  confirmPassword: string
  [key: string]: string
}>({
  newPassword: '',
  confirmPassword: ''
})

// 페이지네이션 계산
const startIndex = computed(() => currentPage.value * pageSize.value)
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, totalElements.value))
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(0, currentPage.value - 2)
  const end = Math.min(totalPages.value - 1, start + 4)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 권한 클래스 반환
const getRoleClass = (role: string) => {
  switch (role) {
    case 'SYSTEM_ADMIN': return 'role-admin'
    case 'SALES_MANAGER': return 'role-sales'
    case 'SHIPPING_MANAGER': return 'role-shipping'
    case 'COURIER': return 'role-courier'
    case 'VIEWER': return 'role-viewer'
    default: return 'role-default'
  }
}

// 권한 이름 반환
const getRoleName = (role: string) => {
  const roleObj = userRoles.value.find(r => r.code === role)
  return roleObj ? roleObj.codeName : role
}

// 날짜 포맷
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR')
}

// 목록 조회
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await userService.getUsers({
      searchKeyword: searchForm.value.searchKeyword,
      role: searchForm.value.role,
      enabled: searchForm.value.enabled,
      page: currentPage.value,
      size: pageSize.value,
      sortBy: searchForm.value.sortBy,
      sortDirection: searchForm.value.sortDirection
    })
    
    users.value = response.content
    totalElements.value = response.totalElements
    totalPages.value = response.totalPages
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

// 검색
const searchUsers = () => {
  currentPage.value = 0
  loadUsers()
}

// 검색 초기화
const resetSearch = () => {
  searchForm.value = {
    searchKeyword: '',
    role: '',
    enabled: '',
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  }
  currentPage.value = 0
  loadUsers()
}

// 페이지 변경
const changePage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    loadUsers()
  }
}

// 페이지 크기 변경
const changePageSize = () => {
  currentPage.value = 0
  loadUsers()
}

// 등록 모달 열기
const openAddModal = () => {
  userForm.value = {
    userId: '',
    password: '',
    userName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeNumber: '',
    companyName: '',
    role: '',
    address: '',
    addressDetail: '',
    zipCode: ''
  }
  validationErrors.value = {
    userId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }
  showAddModal.value = true
}

// 수정 모달 열기
const openEditModal = (user: any) => {
  editingUser.value = user
  userForm.value = { ...user }
  validationErrors.value = {
    userId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }
  showEditModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingUser.value = null
  validationErrors.value = {
    userId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }
}

// 비밀번호 변경 모달 닫기
const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.value = {
    newPassword: '',
    confirmPassword: ''
  }
  passwordValidationErrors.value = {
    newPassword: '',
    confirmPassword: ''
  }
}

// 유효성 검사
const validateForm = (): boolean => {
  validationErrors.value = {
    userId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }

  let isValid = true

  if (!userForm.value.userId) {
    validationErrors.value.userId = '사용자 ID를 입력해주세요.'
    isValid = false
  }

  if (showAddModal.value && !userForm.value.password) {
    validationErrors.value.password = '비밀번호를 입력해주세요.'
    isValid = false
  }

  if (!userForm.value.userName) {
    validationErrors.value.userName = '이름을 입력해주세요.'
    isValid = false
  }

  if (!userForm.value.email) {
    validationErrors.value.email = '이메일을 입력해주세요.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.value.email)) {
    validationErrors.value.email = '올바른 이메일 형식을 입력해주세요.'
    isValid = false
  }

  if (!userForm.value.role) {
    validationErrors.value.role = '권한을 선택해주세요.'
    isValid = false
  }

  return isValid
}

// 비밀번호 변경 유효성 검사
const validatePasswordForm = (): boolean => {
  passwordValidationErrors.value = {
    newPassword: '',
    confirmPassword: ''
  }

  let isValid = true

  if (!passwordForm.value.newPassword) {
    passwordValidationErrors.value.newPassword = '새 비밀번호를 입력해주세요.'
    isValid = false
  } else if (passwordForm.value.newPassword.length < 6 || passwordForm.value.newPassword.length > 100) {
    passwordValidationErrors.value.newPassword = '비밀번호는 6~100자 사이여야 합니다.'
    isValid = false
  }

  if (!passwordForm.value.confirmPassword) {
    passwordValidationErrors.value.confirmPassword = '확인 비밀번호를 입력해주세요.'
    isValid = false
  } else if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordValidationErrors.value.confirmPassword = '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'
    isValid = false
  }

  return isValid
}

// 등록
// 통합 폼 제출 핸들러
const handleFormSubmit = async () => {
  if (showAddModal.value) {
    await submitAdd()
  } else {
    await submitEdit()
  }
}

const submitAdd = async () => {
  if (!validateForm()) {
    alert('필수 항목을 모두 입력해주세요.')
    return
  }

  try {
    console.log('사용자 등록 시도:', userForm.value)
    const result = await userService.createUser(userForm.value)
    console.log('사용자 등록 성공:', result)

    closeModal()
    loadUsers()
    alert('사용자가 성공적으로 등록되었습니다.')
  } catch (error) {
    console.error('사용자 등록 실패:', error)

    let errorMessage = '사용자 등록에 실패했습니다.'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    alert(errorMessage + '\n\n콘솔을 확인하여 상세 오류를 확인하세요.')
  }
}

// 수정
const submitEdit = async () => {
  if (!validateForm() || !editingUser.value) return
  
  try {
    await userService.updateUser(editingUser.value.id, userForm.value)
    closeModal()
    loadUsers()
    alert('사용자가 성공적으로 수정되었습니다.')
  } catch (error) {
    console.error('사용자 수정 실패:', error)
    alert(error instanceof Error ? error.message : '사용자 수정에 실패했습니다.')
  }
}

// 삭제
const deleteUser = async (user: any) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    await userService.deleteUser(user.id)
    loadUsers()
    alert('사용자가 성공적으로 삭제되었습니다.')
  } catch (error) {
    console.error('사용자 삭제 실패:', error)
    alert(error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.')
  }
}

// 비밀번호 변경
const submitPasswordChange = async () => {
  if (!validatePasswordForm() || !editingUser.value) return
  
  try {
    await userService.changePassword(editingUser.value.id, passwordForm.value)
    closePasswordModal()
    alert('비밀번호가 성공적으로 변경되었습니다.')
  } catch (error) {
    console.error('비밀번호 변경 실패:', error)
    alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
  }
}

// API 연결 테스트
const testApiConnection = async () => {
  try {
    const response = await userService.testApiConnection()
    alert('API 연결이 정상입니다.')
  } catch (error) {
    alert('API 연결에 실패했습니다.')
  }
}

// 권한 목록 조회
const loadUserRoles = async () => {
  try {
    const response = await codeService.getCodeDetails('USER_ROLE')
    userRoles.value = response
  } catch (error) {
    console.error('권한 목록 조회 실패:', error)
  }
}

/**
 * 회사 목록 로드
 */
const loadCompanies = async () => {
  try {
    loadingCompanies.value = true
    companies.value = await companyService.getCompanies()
    console.log('회사 목록 로드 완료:', companies.value.length, '개')
  } catch (error) {
    console.error('회사 목록 로드 실패:', error)
    companies.value = []
  } finally {
    loadingCompanies.value = false
  }
}

// 초기 로드
onMounted(() => {
  loadUserRoles()
  loadUsers()
  loadCompanies()
})
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.user-management)
   - 버튼 스타일 (.btn-primary, .btn-secondary, .btn-edit, .btn-delete)
   - 테이블 스타일 (.data-table)
   - 페이지네이션 스타일
   ============================================ */

/* 페이지 특화 스타일만 작성 */

.user-management {
  max-width: 100%;
  margin: 0 auto;
}

.content-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 검색 섹션 */
.search-section {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
  flex: 1;
}

.form-group.button-group {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  min-width: auto;
  flex: 0 0 auto;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.table-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.page-size-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.table-row:hover {
  background: #f9fafb;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-edit,
.btn-delete {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}

/* 배지 스타일 */
.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.role-admin { background: #dc2626; color: white; }
.role-sales { background: #2563eb; color: white; }
.role-shipping { background: #7c3aed; color: white; }
.role-courier { background: #059669; color: white; }
.role-viewer { background: #f59e0b; color: white; }
.role-default { background: #f3f4f6; color: #374151; }

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  min-width: 2.5rem;
  text-align: center;
}

.page-number:hover:not(:disabled) {
  background: #e5e7eb;
}

.page-number.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 모달 스타일 */
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
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.user-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-form label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.user-form .form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.user-form .form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.user-form .form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.password-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  justify-content: space-between;
}

.password-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-password-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 42px;
}

.btn-password-change:hover {
  background: #7c3aed;
}

.password-input-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.password-change-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.password-change-info i {
  color: #0369a1;
  font-size: 1.25rem;
}

.password-change-info p {
  color: #0c4a6e;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* 데이터 없음 및 로딩 메시지 */
.no-data-message,
.loading-message {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.no-data-message i,
.loading-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-message i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 반응형 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .action-buttons button {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .password-section {
    flex-direction: column;
    height: auto;
    gap: 0.5rem;
  }

  .password-info {
    height: auto;
  }

  .btn-password-change {
    width: 100%;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>
