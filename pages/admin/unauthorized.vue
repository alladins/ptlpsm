<template>
  <client-only>
    <div class="unauthorized-page">
      <!-- 배경 장식 요소 -->
      <div class="bg-decoration">
        <div class="bg-circle bg-circle-1"></div>
        <div class="bg-circle bg-circle-2"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- 메인 콘텐츠 -->
      <div class="unauthorized-content">
        <!-- 아이콘 영역 -->
        <div class="icon-container">
          <div class="icon-shield">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
          </div>
          <div class="icon-pulse"></div>
        </div>

        <!-- 텍스트 영역 -->
        <div class="text-container">
          <h1 class="title">접근 권한이 없습니다</h1>
          <p class="description">
            요청하신 페이지에 접근할 수 있는 권한이 없습니다.<br>
            필요한 권한이 있다고 생각되시면 시스템 관리자에게 문의하세요.
          </p>

          <!-- 추가 정보 박스 -->
          <div class="info-box">
            <div class="info-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">현재 역할</span>
              <span class="info-value">{{ userRole }}</span>
            </div>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="button-container">
          <button class="btn btn-primary" @click="goToDashboard">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            대시보드로 이동
          </button>
          <button class="btn btn-secondary" @click="goBack">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            이전 페이지
          </button>
        </div>

        <!-- 권한 문의 안내 -->
        <div class="contact-info">
          <span class="contact-text">권한 관련 문의:</span>
          <a href="mailto:admin@platree.com" class="contact-link">admin@platree.com</a>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '#imports'
import { useAuthStore } from '~/stores/auth'

// 레이아웃 설정
definePageMeta({
  layout: 'admin'
})

const router = useRouter()
const authStore = useAuthStore()

// 사용자 역할 표시
const userRole = computed(() => {
  const role = authStore.role
  const roleNames: Record<string, string> = {
    'SYSTEM_ADMIN': '시스템관리자',
    'LEADPOWER_MANAGER': '리드파워 담당자',
    'OEM_MANAGER': 'OEM 담당자',
    'SITE_MANAGER': '시공사 담당자',
    'SITE_INSPECTOR': '시공사 감리원',
    'SALES_MANAGER': '영업 담당자',
    'DELIVERY_DRIVER': '운송기사',
    'READ_ONLY': '조회 전용'
  }
  return role ? (roleNames[role] || role) : '알 수 없음'
})

// 대시보드로 이동
function goToDashboard() {
  router.push('/admin/dashboard')
}

// 이전 페이지로 이동
function goBack() {
  if (window.history.length > 2) {
    router.back()
  } else {
    router.push('/admin/dashboard')
  }
}
</script>

<style scoped>
.unauthorized-page {
  position: relative;
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

/* 배경 장식 */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.bg-circle-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  top: -200px;
  right: -150px;
  animation: float 20s ease-in-out infinite;
}

.bg-circle-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  bottom: -100px;
  left: -100px;
  animation: float 25s ease-in-out infinite reverse;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.02); }
  50% { transform: translate(-10px, 10px) scale(0.98); }
  75% { transform: translate(-20px, -10px) scale(1.01); }
}

/* 메인 콘텐츠 */
.unauthorized-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 아이콘 영역 */
.icon-container {
  position: relative;
  margin-bottom: 2rem;
}

.icon-shield {
  width: 120px;
  height: 120px;
  background: linear-gradient(145deg, #fef2f2, #fee2e2);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 6px -1px rgba(239, 68, 68, 0.1),
    0 2px 4px -1px rgba(239, 68, 68, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: iconBounce 2s ease-in-out infinite;
}

.icon-shield svg {
  width: 56px;
  height: 56px;
  color: #dc2626;
}

.icon-pulse {
  position: absolute;
  inset: -8px;
  border-radius: 28px;
  border: 2px solid #fca5a5;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.1;
    transform: scale(1.05);
  }
}

/* 텍스트 영역 */
.text-container {
  margin-bottom: 2rem;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.025em;
}

.description {
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 1.5rem 0;
}

/* 정보 박스 */
.info-box {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.info-icon {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.info-icon svg {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.info-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}

.info-label {
  font-size: 0.6875rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 600;
}

/* 버튼 영역 */
.button-container {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  color: white;
  box-shadow:
    0 4px 6px -1px rgba(59, 130, 246, 0.25),
    0 2px 4px -1px rgba(59, 130, 246, 0.15);
}

.btn-primary:hover {
  background: linear-gradient(145deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow:
    0 6px 10px -1px rgba(59, 130, 246, 0.3),
    0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #334155;
}

/* 연락처 정보 */
.contact-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.contact-text {
  color: #94a3b8;
}

.contact-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.contact-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* 반응형 */
@media (max-width: 640px) {
  .unauthorized-page {
    padding: 1.5rem;
  }

  .icon-shield {
    width: 100px;
    height: 100px;
    border-radius: 20px;
  }

  .icon-shield svg {
    width: 48px;
    height: 48px;
  }

  .title {
    font-size: 1.5rem;
  }

  .description {
    font-size: 0.875rem;
  }

  .button-container {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .contact-info {
    flex-direction: column;
    gap: 0.25rem;
  }
}

@media (max-width: 480px) {
  .icon-shield {
    width: 88px;
    height: 88px;
  }

  .icon-shield svg {
    width: 40px;
    height: 40px;
  }

  .title {
    font-size: 1.375rem;
  }

  .description br {
    display: none;
  }
}
</style>
