<template>
  <div class="impersonation-banner">
    <div class="banner-content">
      <div class="banner-icon">
        <i class="fas fa-user-secret"></i>
      </div>
      <div class="banner-text">
        <span class="banner-label">대리 로그인 중</span>
        <span class="banner-info">
          <strong>{{ authStore.user?.userName }}</strong>
          <span class="role-badge">{{ getRoleLabel(authStore.user?.role) }}</span>
          으로 접속 중입니다
        </span>
        <span class="original-user">
          (원래 계정: {{ authStore.originalUser?.userName }})
        </span>
      </div>
      <button class="btn-revert" @click="handleRevert" :disabled="loading">
        <i class="fas fa-sign-out-alt"></i>
        <span v-if="loading">복귀 중...</span>
        <span v-else>원래 계정으로 복귀</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits<{
  revert: []
}>()

const authStore = useAuthStore()
const loading = ref(false)

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

async function handleRevert() {
  loading.value = true
  emit('revert')
}
</script>

<style scoped>
.impersonation-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 8px 20px;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.banner-icon {
  font-size: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.banner-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.banner-label {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.banner-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.banner-info strong {
  font-weight: 600;
}

.role-badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.original-user {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.btn-revert {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  color: #dc2626;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-revert:hover:not(:disabled) {
  background: #fef2f2;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-revert:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-revert i {
  font-size: 14px;
}

/* 반응형 */
@media (max-width: 768px) {
  .impersonation-banner {
    padding: 6px 12px;
  }

  .banner-content {
    flex-wrap: wrap;
    gap: 8px;
  }

  .banner-text {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
    font-size: 12px;
  }

  .original-user {
    width: 100%;
    font-size: 11px;
  }

  .btn-revert {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>
