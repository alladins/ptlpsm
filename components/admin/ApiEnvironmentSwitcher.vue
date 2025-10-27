<template>
  <div class="api-environment-switcher">
    <div class="current-mode">
      <span class="mode-label">API 환경:</span>
      <span 
        class="mode-value" 
        :class="{ 
          'development': currentMode === 'development', 
          'production': currentMode === 'production' 
        }"
      >
        {{ currentMode === 'development' ? '개발' : '운영' }}
      </span>
    </div>
    
    <div class="mode-buttons">
      <button 
        @click="switchToDevelopment" 
        class="mode-button dev-button"
        :class="{ active: currentMode === 'development' }"
        :disabled="currentMode === 'development'"
      >
        개발
      </button>
      <button 
        @click="switchToProduction" 
        class="mode-button prod-button"
        :class="{ active: currentMode === 'production' }"
        :disabled="currentMode === 'production'"
      >
        운영
      </button>
      <button 
        @click="resetToAuto" 
        class="mode-button auto-button"
      >
        자동
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from 'vue'
import { apiEnvironment } from '~/services/api'

export default defineComponent({
  name: 'ApiEnvironmentSwitcher',
  setup() {
    const currentMode = ref('development')

    // 현재 모드 업데이트
    const updateCurrentMode = () => {
      currentMode.value = apiEnvironment.getCurrentMode()
    }

    // 개발 모드로 전환
    const switchToDevelopment = () => {
      apiEnvironment.forceDevelopment()
      updateCurrentMode()
      
      // 알림 표시
      alert('API 환경이 개발 모드로 설정되었습니다. 페이지를 새로고침하세요.')
      
      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }

    // 운영 모드로 전환
    const switchToProduction = () => {
      apiEnvironment.forceProduction()
      updateCurrentMode()
      
      // 알림 표시
      alert('API 환경이 운영 모드로 설정되었습니다. 페이지를 새로고침하세요.')
      
      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }

    // 자동 감지 모드로 재설정
    const resetToAuto = () => {
      apiEnvironment.resetToAuto()
      updateCurrentMode()
      
      // 알림 표시
      alert('API 환경이 자동 감지 모드로 재설정되었습니다. 페이지를 새로고침하세요.')
      
      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }

    onMounted(() => {
      updateCurrentMode()
    })

    return {
      currentMode,
      switchToDevelopment,
      switchToProduction,
      resetToAuto
    }
  }
})
</script>

<style scoped>
.api-environment-switcher {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mode-label {
  font-weight: 500;
  color: #495057;
}

.mode-value {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.mode-value.development {
  background-color: #d1ecf1;
  color: #0c5460;
}

.mode-value.production {
  background-color: #f8d7da;
  color: #721c24;
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.mode-button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.mode-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-button.active {
  border-color: #6c757d;
  background-color: #e9ecef;
}

.dev-button {
  color: #0c5460;
  border-color: #bee5eb;
}

.dev-button.active {
  background-color: #d1ecf1;
  border-color: #0c5460;
}

.prod-button {
  color: #721c24;
  border-color: #f5c6cb;
}

.prod-button.active {
  background-color: #f8d7da;
  border-color: #721c24;
}

.auto-button {
  color: #856404;
  border-color: #ffeeba;
}

.auto-button:hover {
  background-color: #fff3cd;
}
</style> 