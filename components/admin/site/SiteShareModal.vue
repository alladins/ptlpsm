<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-share-alt" />
            현장소장 URL 공유
          </h3>
          <button class="modal-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div class="site-info">
            <strong>{{ site.projectName }}</strong>
            <p v-if="site.client" class="muted">{{ site.client }}</p>
          </div>

          <div class="url-block">
            <label>접속 URL (1년간 유효)</label>
            <div class="url-input-wrap">
              <input :value="accessUrl" type="text" class="form-input" readonly>
              <button class="btn-primary" @click="copyUrl">
                <i :class="copied ? 'fas fa-check' : 'fas fa-copy'" />
                {{ copied ? '복사됨' : '복사' }}
              </button>
            </div>
            <p class="hint">
              <i class="fas fa-info-circle" />
              이 URL을 카카오톡/SMS 등으로 현장소장에게 전달하세요. 한 URL을 여러 사용자가 공유할 수 있습니다.
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">닫기</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Site } from '~/types/site'
import { buildSiteAccessUrl } from '~/services/site.service'

const props = defineProps<{ site: Site }>()
defineEmits<{ (e: 'close'): void }>()

const copied = ref(false)

const accessUrl = computed(() => buildSiteAccessUrl(props.site.accessToken))

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(accessUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // 수동 복사 폴백
    const input = document.createElement('input')
    input.value = accessUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 0.75rem;
  width: 90%; max-width: 600px;
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0.75rem 0.75rem 0 0;
}
.modal-header h3 { margin: 0; font-size: 1.05rem; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #6b7280; }
.modal-body { padding: 1.5rem; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 0.75rem 0.75rem;
}
.site-info { margin-bottom: 1.5rem; }
.site-info strong { font-size: 1.05rem; }
.site-info .muted { color: #6b7280; margin: 0.25rem 0 0; font-size: 0.85rem; }
.url-block { margin-bottom: 1.25rem; }
.url-block label {
  font-size: 0.85rem; color: #374151; font-weight: 500;
  display: block; margin-bottom: 0.4rem;
}
.url-input-wrap { display: flex; gap: 0.5rem; }
.url-input-wrap .form-input {
  flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem;
  font-family: monospace; font-size: 0.8rem;
}
.hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: #6b7280;
  display: flex; align-items: flex-start; gap: 0.3rem;
}
.btn-primary {
  padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.25rem; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary {
  padding: 0.5rem 1rem; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 0.25rem; cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }
</style>
