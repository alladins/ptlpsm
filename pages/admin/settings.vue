<template>
  <div class="settings-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">설정</h1>
          <p class="page-description">시스템 설정 및 개인 정보를 관리합니다.</p>
        </div>
      </div>
    </div>

    <!-- 설정 컨테이너 -->
    <div class="settings-container">
      <!-- 좌측: 설정 메뉴 -->
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <button 
            v-for="section in settingsSections" 
            :key="section.id"
            @click="activeSection = section.id"
            :class="['nav-item', { active: activeSection === section.id }]"
          >
            <i :class="section.icon"></i>
            <span>{{ section.title }}</span>
          </button>
        </nav>
      </div>

      <!-- 우측: 설정 내용 -->
      <div class="settings-content">
        <!-- 프로필 설정 -->
        <div v-if="activeSection === 'profile'" class="settings-section">
          <div class="section-header">
            <h2>프로필 설정</h2>
            <p>개인 정보를 관리합니다.</p>
          </div>

          <form @submit.prevent="saveProfile" class="settings-form">
            <div class="form-group">
              <label>이름</label>
              <input 
                v-model="profileForm.name" 
                type="text" 
                placeholder="이름을 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label>이메일</label>
              <input 
                v-model="profileForm.email" 
                type="email" 
                placeholder="이메일을 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label>전화번호</label>
              <input 
                v-model="profileForm.phone" 
                type="tel" 
                placeholder="전화번호를 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label>부서</label>
              <input 
                v-model="profileForm.department" 
                type="text" 
                placeholder="부서를 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-group">
              <label>직급</label>
              <input 
                v-model="profileForm.position" 
                type="text" 
                placeholder="직급을 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>저장</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 비밀번호 변경 -->
        <div v-if="activeSection === 'password'" class="settings-section">
          <div class="section-header">
            <h2>비밀번호 변경</h2>
            <p>계정 보안을 위해 비밀번호를 변경합니다.</p>
          </div>

          <form @submit.prevent="changePassword" class="settings-form">
            <div class="form-group">
              <label>현재 비밀번호</label>
              <input 
                v-model="passwordForm.currentPassword" 
                type="password" 
                placeholder="현재 비밀번호를 입력하세요"
                class="form-input"
                required
              >
            </div>

            <div class="form-group">
              <label>새 비밀번호</label>
              <input 
                v-model="passwordForm.newPassword" 
                type="password" 
                placeholder="새 비밀번호를 입력하세요"
                class="form-input"
                required
              >
            </div>

            <div class="form-group">
              <label>새 비밀번호 확인</label>
              <input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                placeholder="새 비밀번호를 다시 입력하세요"
                class="form-input"
                required
              >
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-key"></i>
                <span>비밀번호 변경</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 알림 설정 -->
        <div v-if="activeSection === 'notifications'" class="settings-section">
          <div class="section-header">
            <h2>알림 설정</h2>
            <p>알림 수신 여부를 설정합니다.</p>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="notificationForm.emailNotifications" 
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>이메일 알림</span>
              </label>
              <p class="form-help">중요한 업데이트 및 알림을 이메일로 받습니다.</p>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="notificationForm.smsNotifications" 
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>SMS 알림</span>
              </label>
              <p class="form-help">긴급한 알림을 SMS로 받습니다.</p>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="notificationForm.systemNotifications" 
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>시스템 알림</span>
              </label>
              <p class="form-help">시스템 업데이트 및 유지보수 알림을 받습니다.</p>
            </div>

            <div class="form-actions">
              <button @click="saveNotifications" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>저장</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 시스템 설정 -->
        <div v-if="activeSection === 'system'" class="settings-section">
          <div class="section-header">
            <h2>시스템 설정</h2>
            <p>시스템 환경을 설정합니다.</p>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label>언어</label>
              <select v-model="systemForm.language" class="form-select">
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <div class="form-group">
              <label>시간대</label>
              <select v-model="systemForm.timezone" class="form-select">
                <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
                <option value="UTC">UTC (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
              </select>
            </div>

            <div class="form-group">
              <label>테마</label>
              <select v-model="systemForm.theme" class="form-select">
                <option value="light">라이트 모드</option>
                <option value="dark">다크 모드</option>
                <option value="auto">시스템 설정 따름</option>
              </select>
            </div>

            <div class="form-group">
              <label>페이지당 항목 수</label>
              <select v-model="systemForm.itemsPerPage" class="form-select">
                <option value="10">10개</option>
                <option value="20">20개</option>
                <option value="50">50개</option>
                <option value="100">100개</option>
              </select>
            </div>

            <div class="form-actions">
              <button @click="saveSystemSettings" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>저장</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 보안 설정 -->
        <div v-if="activeSection === 'security'" class="settings-section">
          <div class="section-header">
            <h2>보안 설정</h2>
            <p>계정 보안을 관리합니다.</p>
          </div>

          <div class="settings-form">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="securityForm.twoFactorAuth" 
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>2단계 인증</span>
              </label>
              <p class="form-help">로그인 시 추가 보안을 위해 2단계 인증을 활성화합니다.</p>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="securityForm.sessionTimeout" 
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>세션 자동 종료</span>
              </label>
              <p class="form-help">일정 시간 후 자동으로 로그아웃됩니다.</p>
            </div>

            <div class="form-group">
              <label>세션 타임아웃 (분)</label>
              <input 
                v-model="securityForm.timeoutMinutes" 
                type="number" 
                min="5"
                max="480"
                class="form-input"
                :disabled="!securityForm.sessionTimeout"
              >
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="securityForm.loginHistory" 
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>로그인 기록 저장</span>
              </label>
              <p class="form-help">로그인 시도 기록을 저장합니다.</p>
            </div>

            <div class="form-actions">
              <button @click="saveSecuritySettings" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>저장</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '설정'
})

useHead({
  title: '설정 - PTPLPSM',
  meta: [
    { name: 'description', content: '시스템 설정 및 개인 정보 관리' }
  ]
})

// 설정 섹션 정의
const settingsSections = [
  { id: 'profile', title: '프로필', icon: 'fas fa-user' },
  { id: 'password', title: '비밀번호', icon: 'fas fa-key' },
  { id: 'notifications', title: '알림', icon: 'fas fa-bell' },
  { id: 'system', title: '시스템', icon: 'fas fa-cog' },
  { id: 'security', title: '보안', icon: 'fas fa-shield-alt' }
]

// 활성 섹션
const activeSection = ref('profile')

// 프로필 폼
const profileForm = ref({
  name: '관리자',
  email: 'admin@example.com',
  phone: '010-1234-5678',
  department: 'IT팀',
  position: '시스템 관리자'
})

// 비밀번호 폼
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 알림 설정 폼
const notificationForm = ref({
  emailNotifications: true,
  smsNotifications: false,
  systemNotifications: true
})

// 시스템 설정 폼
const systemForm = ref({
  language: 'ko',
  timezone: 'Asia/Seoul',
  theme: 'light',
  itemsPerPage: 20
})

// 보안 설정 폼
const securityForm = ref({
  twoFactorAuth: false,
  sessionTimeout: true,
  timeoutMinutes: 30,
  loginHistory: true
})

// 프로필 저장
const saveProfile = async () => {
  try {
    // API 호출 로직
    console.log('프로필 저장:', profileForm.value)
    alert('프로필이 성공적으로 저장되었습니다.')
  } catch (error) {
    console.error('프로필 저장 실패:', error)
    alert('프로필 저장에 실패했습니다.')
  }
}

// 비밀번호 변경
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('새 비밀번호가 일치하지 않습니다.')
    return
  }

  if (passwordForm.value.newPassword.length < 8) {
    alert('비밀번호는 8자 이상이어야 합니다.')
    return
  }

  try {
    // API 호출 로직
    console.log('비밀번호 변경:', passwordForm.value)
    alert('비밀번호가 성공적으로 변경되었습니다.')
    
    // 폼 초기화
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('비밀번호 변경 실패:', error)
    alert('비밀번호 변경에 실패했습니다.')
  }
}

// 알림 설정 저장
const saveNotifications = async () => {
  try {
    // API 호출 로직
    console.log('알림 설정 저장:', notificationForm.value)
    alert('알림 설정이 성공적으로 저장되었습니다.')
  } catch (error) {
    console.error('알림 설정 저장 실패:', error)
    alert('알림 설정 저장에 실패했습니다.')
  }
}

// 시스템 설정 저장
const saveSystemSettings = async () => {
  try {
    // API 호출 로직
    console.log('시스템 설정 저장:', systemForm.value)
    alert('시스템 설정이 성공적으로 저장되었습니다.')
  } catch (error) {
    console.error('시스템 설정 저장 실패:', error)
    alert('시스템 설정 저장에 실패했습니다.')
  }
}

// 보안 설정 저장
const saveSecuritySettings = async () => {
  try {
    // API 호출 로직
    console.log('보안 설정 저장:', securityForm.value)
    alert('보안 설정이 성공적으로 저장되었습니다.')
  } catch (error) {
    console.error('보안 설정 저장 실패:', error)
    alert('보안 설정 저장에 실패했습니다.')
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 100%;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-description {
  color: #6b7280;
  font-size: 14px;
}

.settings-container {
  display: flex;
  gap: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 사이드바 */
.settings-sidebar {
  width: 280px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
}

.settings-nav {
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.nav-item i {
  width: 16px;
  text-align: center;
}

/* 설정 내용 */
.settings-content {
  flex: 1;
  padding: 2rem;
}

.settings-section {
  max-width: 600px;
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #6b7280;
  font-size: 0.875rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
}

.form-help {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
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

/* 반응형 */
@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .settings-nav {
    display: flex;
    overflow-x: auto;
    padding: 1rem;
  }

  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .settings-content {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
