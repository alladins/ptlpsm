<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 로고 섹션 -->
      <div class="logo-section">
        <img
          src="/images/common/logo.png"
          alt="PTPLPSM 로고"
          class="logo"
        />
        <h1 class="title">통합 출하관리 시스템</h1>
        <p class="subtitle">PTPLPSM Admin Login</p>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="errorMessage" class="error-message">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {{ errorMessage }}
      </div>

      <!-- 로그인 폼 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- 아이디 입력 -->
        <div class="form-group">
          <label for="loginId" class="form-label">
            <svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            아이디
          </label>
          <input
            id="loginId"
            v-model="form.loginId"
            type="text"
            class="form-input"
            placeholder="아이디를 입력하세요"
            required
            :disabled="isLoading"
            autocomplete="userName"
          />
        </div>

        <!-- 비밀번호 입력 -->
        <div class="form-group">
          <label for="password" class="form-label">
            <svg class="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            비밀번호
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="비밀번호를 입력하세요"
            required
            :disabled="isLoading"
            autocomplete="current-password"
          />
        </div>

        <!-- 로그인 유지 체크박스 -->
        <div class="form-group-checkbox">
          <label class="checkbox-label">
            <input
              v-model="form.rememberMe"
              type="checkbox"
              class="checkbox-input"
              :disabled="isLoading"
            />
            <span class="checkbox-text">로그인 유지</span>
          </label>
        </div>

        <!-- 로그인 버튼 -->
        <button
          type="submit"
          class="login-button"
          :disabled="isLoading"
        >
          <span v-if="!isLoading" class="button-content">
            로그인
            <svg class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </span>
          <span v-else class="button-loading">
            <svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            로그인 중...
          </span>
        </button>
      </form>

      <!-- 하단 링크 -->
      <div class="footer-links">
        <a href="/" class="footer-link">
          <svg class="footer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          메인 페이지로 돌아가기
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { authService } from '~/services/auth.service'

useHead({
  title: '로그인 - PTPLPSM 통합 출하관리 시스템',
  meta: [
    { name: 'description', content: 'PTPLPSM 통합 출하관리 시스템 로그인' }
  ]
})

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  loginId: '',
  password: '',
  rememberMe: false
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (isLoading.value) return

  errorMessage.value = ''

  // 유효성 검사
  if (!form.value.loginId || !form.value.password) {
    errorMessage.value = '아이디와 비밀번호를 모두 입력해주세요.'
    return
  }

  isLoading.value = true

  try {
    const response = await authService.login({
      loginId: form.value.loginId,
      password: form.value.password,
      rememberMe: form.value.rememberMe
    })

    if (response.success && response.data) {
      // Auth Store에 데이터 저장
      authStore.setAuthData(response.data)

      console.log('로그인 성공:', {
        사용자: response.data.userInfo.userName,
        역할: response.data.userInfo.role
      })

      // 리다이렉트 경로 확인
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/admin'
      localStorage.removeItem('redirectAfterLogin')

      // 관리자 페이지로 이동
      await router.push(redirectPath)
    } else {
      errorMessage.value = response.message || '로그인에 실패했습니다.'
    }
  } catch (error: any) {
    console.error('로그인 에러:', error)
    errorMessage.value = error.message || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}

// 이미 로그인된 경우 체크
onMounted(async () => {
  await authStore.checkAuth()
  if (authStore.isLoggedIn && !authStore.isUserInactive) {
    console.log('이미 로그인됨, 관리자 페이지로 이동')
    router.push('/admin')
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 3rem;
  max-width: 28rem;
  width: 100%;
}

/* 로고 섹션 */
.logo-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  width: 8rem;
  height: auto;
  margin: 0 auto 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

/* 에러 메시지 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

/* 폼 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.label-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #2563eb;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #9ca3af;
}

/* 체크박스 */
.form-group-checkbox {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 1.125rem;
  height: 1.125rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  accent-color: #2563eb;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
}

/* 로그인 버튼 */
.login-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background-color: #2563eb;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.button-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 하단 링크 */
.footer-links {
  margin-top: 2rem;
  text-align: center;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #2563eb;
}

.footer-icon {
  width: 1rem;
  height: 1rem;
}

/* 반응형 */
@media (max-width: 640px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }
}
</style>
