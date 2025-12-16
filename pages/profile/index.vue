<template>
  <div class="profile-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">내 정보</h1>
        <p class="page-description">내 계정 정보를 확인하고 수정할 수 있습니다.</p>
      </div>
    </div>

    <!-- 내 정보 섹션 -->
    <div class="profile-section">
      <div class="section-header">
        <h2 class="section-title">기본 정보</h2>
        <button class="btn-primary" @click="openEditModal">
          <i class="fas fa-edit"></i>
          <span>정보 수정</span>
        </button>
      </div>

      <div class="profile-info">
        <div class="info-grid">
          <div class="info-item">
            <label>사용자 ID</label>
            <span>{{ currentUser.loginId }}</span>
          </div>
          <div class="info-item">
            <label>이름</label>
            <span>{{ currentUser.userName }}</span>
          </div>
          <div class="info-item">
            <label>이메일</label>
            <span>{{ currentUser.email }}</span>
          </div>
          <div class="info-item">
            <label>연락처</label>
            <span>{{ currentUser.phone || '-' }}</span>
          </div>
          <div class="info-item">
            <label>부서</label>
            <span>{{ currentUser.department || '-' }}</span>
          </div>
          <div class="info-item">
            <label>직급</label>
            <span>{{ currentUser.position || '-' }}</span>
          </div>
          <div class="info-item">
            <label>사원번호</label>
            <span>{{ currentUser.employeeNumber || '-' }}</span>
          </div>
          <div class="info-item">
            <label>소속회사</label>
            <span>{{ currentUser.companyName || '-' }}</span>
          </div>
          <div class="info-item">
            <label>권한</label>
            <span class="role-badge" :class="getRoleClass(currentUser.role)">
              {{ getRoleName(currentUser.role) }}
            </span>
          </div>
          <div class="info-item">
            <label>계정 상태</label>
            <span class="status-badge" :class="currentUser.enabled ? 'active' : 'inactive'">
              {{ currentUser.enabled ? '활성' : '비활성' }}
            </span>
          </div>
          <div class="info-item">
            <label>가입일</label>
            <span>{{ formatDate(currentUser.createdAt) }}</span>
          </div>
          <div class="info-item">
            <label>최종 수정일</label>
            <span>{{ formatDate(currentUser.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 보안 섹션 -->
    <div class="profile-section">
      <div class="section-header">
        <h2 class="section-title">보안</h2>
        <button class="btn-secondary" @click="openPasswordModal">
          <i class="fas fa-key"></i>
          <span>비밀번호 변경</span>
        </button>
      </div>

      <div class="security-info">
        <div class="security-item">
          <i class="fas fa-shield-alt"></i>
          <div class="security-content">
            <h3>비밀번호</h3>
            <p>정기적으로 비밀번호를 변경하여 계정을 보호하세요.</p>
            <small>마지막 변경일: {{ formatDate(currentUser.passwordChangedAt) || '정보 없음' }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 정보 수정 모달 -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>내 정보 수정</h3>
          <button class="modal-close" @click="closeEditModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitProfileUpdate" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label>사용자 ID</label>
                <input
                  v-model="profileForm.loginId"
                  type="text"
                  disabled
                  class="disabled-input"
                >
                <small class="form-help">사용자 ID는 변경할 수 없습니다.</small>
              </div>
              <div class="form-group">
                <label>이름 *</label>
                <input 
                  v-model="profileForm.userName" 
                  type="text" 
                  required
                  placeholder="이름을 입력하세요"
                  @input="validateField('userName', profileForm.userName)"
                  @blur="validateField('userName', profileForm.userName)"
                  :class="{ 'error': validationErrors.userName }"
                >
                <span v-if="validationErrors.userName" class="error-message">
                  {{ validationErrors.userName }}
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>이메일</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  @input="validateField('email', profileForm.email)"
                  @blur="handleEmailBlur"
                  :class="{ 'error': validationErrors.email }"
                >
                <span v-if="validationErrors.email" class="error-message">
                  {{ validationErrors.email }}
                </span>
              </div>
              <div class="form-group">
                <label>연락처 *</label>
                <input 
                  v-model="profileForm.phone" 
                  type="text" 
                  required
                  placeholder="000-0000-0000"
                  @input="handlePhoneInput"
                  @blur="validateField('phone', profileForm.phone)"
                  :class="{ 'error': validationErrors.phone }"
                >
                <span v-if="validationErrors.phone" class="error-message">
                  {{ validationErrors.phone }}
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>부서</label>
                <input 
                  v-model="profileForm.department" 
                  type="text" 
                  placeholder="부서를 입력하세요"
                >
              </div>
              <div class="form-group">
                <label>직급</label>
                <input 
                  v-model="profileForm.position" 
                  type="text" 
                  placeholder="직급을 입력하세요"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>사원번호</label>
                <input 
                  v-model="profileForm.employeeNumber" 
                  type="text" 
                  placeholder="사원번호를 입력하세요"
                >
              </div>
              <div class="form-group">
                <label>소속회사</label>
                <input 
                  v-model="profileForm.companyName" 
                  type="text" 
                  placeholder="소속회사를 입력하세요"
                >
              </div>
            </div>

            <!-- 주소 관련 필드 (현재 미사용)
            <div class="form-row">
              <div class="form-group">
                <label>우편번호</label>
                <input 
                  v-model="profileForm.zipCode" 
                  type="text" 
                  placeholder="우편번호를 입력하세요"
                  maxlength="5"
                  @input="handleZipCodeInput"
                >
              </div>
              <div class="form-group">
                <label>주소</label>
                <input 
                  v-model="profileForm.address" 
                  type="text" 
                  placeholder="주소를 입력하세요"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>상세주소</label>
                <input 
                  v-model="profileForm.addressDetail" 
                  type="text" 
                  placeholder="상세주소를 입력하세요"
                >
              </div>
            </div>
            -->

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>저장</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeEditModal">
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
            <!-- 현재 비밀번호 필드 제거 -->
            <!-- <div class="form-group">
              <label>현재 비밀번호 *</label>
              <input 
                v-model="passwordForm.currentPassword" 
                type="password" 
                required
                placeholder="현재 비밀번호를 입력하세요"
                @input="validatePasswordField('currentPassword', passwordForm.currentPassword)"
                @blur="validatePasswordField('currentPassword', passwordForm.currentPassword)"
                :class="{ 'error': passwordValidationErrors.currentPassword }"
              >
              <span v-if="passwordValidationErrors.currentPassword" class="error-message">
                {{ passwordValidationErrors.currentPassword }}
              </span>
            </div> -->

            <div class="form-group">
              <label>새 비밀번호 *</label>
              <input 
                v-model="passwordForm.newPassword" 
                type="password" 
                required
                placeholder="새 비밀번호를 입력하세요"
                @input="validatePasswordField('newPassword', passwordForm.newPassword)"
                @blur="validatePasswordField('newPassword', passwordForm.newPassword)"
                :class="{ 'error': passwordValidationErrors.newPassword }"
              >
              <span v-if="passwordValidationErrors.newPassword" class="error-message">
                {{ passwordValidationErrors.newPassword }}
              </span>
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
                @input="validatePasswordField('confirmPassword', passwordForm.confirmPassword)"
                @blur="validatePasswordField('confirmPassword', passwordForm.confirmPassword)"
                :class="{ 'error': passwordValidationErrors.confirmPassword }"
              >
              <span v-if="passwordValidationErrors.confirmPassword" class="error-message">
                {{ passwordValidationErrors.confirmPassword }}
              </span>
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
  pageTitle: '내 정보'
})

// API 서비스
import { userService } from '~/services/user.service'
import { formatPhoneNumberInput, normalizeEmail } from '~/utils/format'

// 반응형 데이터
const currentUser = ref<any>({
  userid: 1,
  loginId: 'admin',
  userName: '시스템관리자',
  email: 'admin@ptlpsm.com',
  phone: '010-1234-5678',
  department: 'IT팀',
  position: '팀장',
  employeeNumber: 'EMP001',
  companyName: 'PTLPSM',
  role: 'SYSTEM_ADMIN',
  enabled: true,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
  passwordChangedAt: '2024-01-01T00:00:00'
})

// 모달 관련
const showEditModal = ref(false)
const showPasswordModal = ref(false)

// 프로필 수정 폼
const profileForm = ref({
  userId: '',
  userName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  employeeNumber: '',
  companyName: '',
  address: '',
  addressDetail: '',
  zipCode: ''
})

// 비밀번호 변경 폼
const passwordForm = ref({
  // currentPassword: '', // 현재 비밀번호 필드 제거
  newPassword: '',
  confirmPassword: ''
})

// 유효성 검사 오류 메시지
const validationErrors = ref<{
  userName: string
  email: string
  phone: string
  [key: string]: string
}>({
  userName: '',
  email: '',
  phone: ''
})

// 비밀번호 변경 유효성 검사 오류 메시지
const passwordValidationErrors = ref<{
  // currentPassword: string // 현재 비밀번호 필드 제거
  newPassword: string
  confirmPassword: string
  [key: string]: string
}>({
  // currentPassword: '', // 현재 비밀번호 필드 제거
  newPassword: '',
  confirmPassword: ''
})

// 이메일 유효성 검사 함수
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 전화번호 유효성 검사 함수
const isValidPhone = (phone: string) => {
  const phoneRegex = /^\d{3}-\d{4}-\d{4}$/
  return phoneRegex.test(phone)
}

// 전화번호 입력 처리 함수 (공통 함수 사용 - 길이 제한 포함)
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  profileForm.value.phone = formatPhoneNumberInput(target.value)
}

// 이메일 정규화 (공통 함수 사용 - 소문자 변환 및 공백 제거)
const handleEmailBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  profileForm.value.email = normalizeEmail(target.value)
  // 정규화 후 유효성 검사 재실행
  validateField('email', profileForm.value.email)
}

// 실시간 유효성 검사
const validateField = (field: string, value: string) => {
  validationErrors.value[field] = ''
  
  switch (field) {
    case 'userName':
      if (!value.trim()) {
        validationErrors.value.userName = '이름은 필수입니다.'
      } else if (value.length > 50) {
        validationErrors.value.userName = '이름은 50자를 초과할 수 없습니다.'
      }
      break
      
    case 'email':
      if (value && !isValidEmail(value)) {
        validationErrors.value.email = '올바른 이메일 형식이어야 합니다.'
      } else if (value && value.length > 100) {
        validationErrors.value.email = '이메일은 100자를 초과할 수 없습니다.'
      }
      break
      
    case 'phone':
      if (!value.trim()) {
        validationErrors.value.phone = '연락처는 필수입니다.'
      } else if (!isValidPhone(value)) {
        validationErrors.value.phone = '올바른 전화번호 형식이어야 합니다. (예: 010-1234-5678)'
      }
      break
  }
}

// 비밀번호 변경 유효성 검사
const validatePasswordField = (field: string, value: string) => {
  passwordValidationErrors.value[field] = ''
  
  switch (field) {
    // case 'currentPassword': // 현재 비밀번호 필드 제거
    //   if (!value.trim()) {
    //     passwordValidationErrors.value.currentPassword = '현재 비밀번호를 입력하세요.'
    //   }
    //   break
      
    case 'newPassword':
      if (!value.trim()) {
        passwordValidationErrors.value.newPassword = '새 비밀번호를 입력하세요.'
      } else if (value.length < 6 || value.length > 100) {
        passwordValidationErrors.value.newPassword = '새 비밀번호는 6~100자 사이여야 합니다.'
      }
      // else if (value === passwordForm.value.currentPassword) { // 현재 비밀번호와 비교 제거
      //   passwordValidationErrors.value.newPassword = '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
      // }
      // 새 비밀번호가 변경되면 확인 비밀번호도 다시 검증
      if (passwordForm.value.confirmPassword) {
        validatePasswordField('confirmPassword', passwordForm.value.confirmPassword)
      }
      break
      
    case 'confirmPassword':
      if (!value.trim()) {
        passwordValidationErrors.value.confirmPassword = '비밀번호 확인을 입력하세요.'
      } else if (value !== passwordForm.value.newPassword) {
        passwordValidationErrors.value.confirmPassword = '비밀번호가 일치하지 않습니다.'
      }
      break
  }
}

// 비밀번호 변경 폼 전체 유효성 검사
const validatePasswordForm = () => {
  // validatePasswordField('currentPassword', passwordForm.value.currentPassword) // 현재 비밀번호 필드 제거
  validatePasswordField('newPassword', passwordForm.value.newPassword)
  validatePasswordField('confirmPassword', passwordForm.value.confirmPassword)
  
  return !Object.values(passwordValidationErrors.value).some(error => error !== '')
}

// 프로필 수정 폼 전체 유효성 검사
const validateProfileForm = () => {
  validateField('userName', profileForm.value.userName)
  validateField('email', profileForm.value.email)
  validateField('phone', profileForm.value.phone)
  
  return !Object.values(validationErrors.value).some(error => error !== '')
}

// 메서드
const loadCurrentUser = async () => {
  try {
    // 실제 로그인된 사용자 정보를 가져오는 로직
    const user = await userService.getCurrentUser()
    currentUser.value = user
    console.log('현재 사용자 정보 로드:', currentUser.value)
  } catch (error) {
    console.error('사용자 정보 로딩 실패:', error)
    // 개발 환경에서는 목 데이터 사용
    console.log('개발 환경: 목 데이터 사용')
    // showAlert('사용자 정보를 불러오는데 실패했습니다.', 'error')
  }
}

const openEditModal = () => {
  profileForm.value = {
    loginId: currentUser.value.loginId,
    userName: currentUser.value.userName,
    email: currentUser.value.email,
    phone: currentUser.value.phone || '',
    department: currentUser.value.department || '',
    position: currentUser.value.position || '',
    employeeNumber: currentUser.value.employeeNumber || '',
    companyName: currentUser.value.companyName || '',
    address: currentUser.value.address || '',
    addressDetail: currentUser.value.addressDetail || '',
    zipCode: currentUser.value.zipCode || ''
  }
  // 유효성 검사 오류 초기화
  validationErrors.value = {
    userName: '',
    email: '',
    phone: ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  validationErrors.value = {
    userName: '',
    email: '',
    phone: ''
  }
}

const submitProfileUpdate = async () => {
  // 유효성 검사 실행
  if (!validateProfileForm()) {
    showAlert('입력 정보를 확인해주세요.', 'error')
    return
  }
  
  try {
    // 실제 API 호출
    const updateData: any = { ...profileForm.value }
    delete updateData.loginId // 로그인 ID는 변경 불가

    const updatedUser = await userService.updateProfile(currentUser.value.userid, updateData)
    currentUser.value = updatedUser
    
    showAlert('내 정보가 수정되었습니다.', 'success')
    closeEditModal()
  } catch (error) {
    console.error('프로필 수정 실패:', error)
    const errorMessage = error instanceof Error ? error.message : '프로필 수정에 실패했습니다.'
    showAlert(errorMessage, 'error')
  }
}

const openPasswordModal = () => {
  passwordForm.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
  // 비밀번호 유효성 검사 오류 초기화
  passwordValidationErrors.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
  passwordValidationErrors.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
}

const submitPasswordChange = async () => {
  // 비밀번호 변경 유효성 검사 실행
  if (!validatePasswordForm()) {
    showAlert('입력 정보를 확인해주세요.', 'error')
    return
  }
  
  try {
    console.log('비밀번호 변경 시도:', {
      userid: currentUser.value.userid,
      newPassword: passwordForm.value.newPassword,
      confirmPassword: passwordForm.value.confirmPassword
    })

    // 실제 API 호출
    const response = await userService.changePassword(currentUser.value.userid, passwordForm.value)
    console.log('비밀번호 변경 성공:', response)
    
    showAlert(response.message || '비밀번호가 성공적으로 변경되었습니다.', 'success')
    closePasswordModal()
  } catch (error) {
    console.error('비밀번호 변경 실패:', error)
    let errorMessage = '비밀번호 변경에 실패했습니다.'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    showAlert(errorMessage, 'error')
  }
}

// 유틸리티 메서드
const getRoleName = (roleCode: string) => {
  const roleNames: { [key: string]: string } = {
    'SYSTEM_ADMIN': '시스템관리자',
    'SALES_MANAGER': '영업담당자',
    'OEM_MANAGER': 'OEM담당자',
    'COURIER': '택배기사',
    'SITE_MANAGER': '현장소장',
    'SHIPPING_MANAGER': '출하담당자',
    'LEAD_POWER': '리드파워담당자',
    'VIEWER': '조회자'
  }
  return roleNames[roleCode] || roleCode
}

const getRoleClass = (roleCode: string) => {
  const roleClasses: { [key: string]: string } = {
    'SYSTEM_ADMIN': 'role-admin',
    'SALES_MANAGER': 'role-sales',
    'OEM_MANAGER': 'role-oem',
    'COURIER': 'role-courier',
    'SITE_MANAGER': 'role-site',
    'SHIPPING_MANAGER': 'role-shipping',
    'LEAD_POWER': 'role-lead',
    'VIEWER': 'role-viewer'
  }
  return roleClasses[roleCode] || 'role-default'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'warning') => {
  alert(message)
}

// 라이프사이클
onMounted(async () => {
  await loadCurrentUser()
})
</script>

<style scoped>
.profile-page {
  max-width: 100%;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.page-description {
  color: #6b7280;
  margin: 0;
  flex: 1;
}

/* 섹션 공통 스타일 */
.profile-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* 프로필 정보 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.info-item span {
  color: #1f2937;
  font-size: 1rem;
}

/* 보안 정보 */
.security-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.security-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.security-item i {
  color: #3b82f6;
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.security-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.security-content p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.security-content small {
  color: #9ca3af;
  font-size: 0.75rem;
}

/* 배지 스타일 */
.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  display: inline-block;
  width: fit-content;
}

.role-admin { background: #dc2626; color: white; }
.role-sales { background: #2563eb; color: white; }
.role-oem { background: #7c3aed; color: white; }
.role-courier { background: #059669; color: white; }
.role-site { background: #d97706; color: white; }
.role-shipping { background: #0891b2; color: white; }
.role-lead { background: #be185d; color: white; }
.role-viewer { background: #6b7280; color: white; }
.role-default { background: #9ca3af; color: white; }

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  display: inline-block;
  width: fit-content;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #dc2626;
}

/* 버튼 스타일 */
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

/* 폼 스타일 */
.profile-form,
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input.error,
.form-select.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.disabled-input {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

.form-help {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
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

/* 반응형 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>
