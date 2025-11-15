<template>
  <div class="message-template-edit-page">
    <PageHeader title="메시지 템플릿 수정" description="메시지 템플릿 정보를 수정합니다">
      <template #actions>
        <button class="btn-secondary" @click="goToDetail">
          <i class="ri-arrow-left-line"></i>
          상세로
        </button>
      </template>
    </PageHeader>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-state">
      <i class="ri-loader-4-line animate-spin"></i>
      데이터를 불러오는 중...
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-state">
      <i class="ri-error-warning-line"></i>
      {{ error }}
      <button class="btn-secondary" @click="loadTemplate">
        <i class="ri-refresh-line"></i>
        다시 시도
      </button>
    </div>

    <!-- 편집 폼 -->
    <MessageTemplateForm
      v-else-if="template"
      mode="edit"
      :initial-data="template"
      @submit="handleSubmit"
      @cancel="goToDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getMessageTemplate,
  updateMessageTemplate
} from '~/services/message-template.service'
import type { MessageTemplate, MessageTemplateUpdateRequest } from '~/types/message-template'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const router = useRouter()
const route = useRoute()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const template = ref<MessageTemplate | null>(null)

// Methods
const loadTemplate = async () => {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    error.value = '잘못된 템플릿 ID입니다'
    return
  }

  loading.value = true
  error.value = null

  try {
    template.value = await getMessageTemplate(id)
  } catch (err: any) {
    error.value = err.message || '템플릿 정보를 불러오는데 실패했습니다'
    console.error('Load template error:', err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (data: MessageTemplateUpdateRequest) => {
  if (!template.value) return

  try {
    await updateMessageTemplate(template.value.templateId, data)
    alert('메시지 템플릿이 수정되었습니다')
    router.push(`/admin/basic-info/message-templates/detail/${template.value.templateId}`)
  } catch (err: any) {
    alert(err.message || '템플릿 수정에 실패했습니다')
    console.error('Update template error:', err)
  }
}

// Navigation
const goToDetail = () => {
  if (!template.value) {
    router.push('/admin/basic-info/message-templates/list')
    return
  }
  router.push(`/admin/basic-info/message-templates/detail/${template.value.templateId}`)
}

// Lifecycle
onMounted(() => {
  loadTemplate()
})
</script>

<style scoped>
.message-template-edit-page {
  padding: 24px;
}

/* 로딩/에러 상태 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state i {
  font-size: 48px;
  color: #2563eb;
}

.error-state i {
  font-size: 48px;
  color: #dc2626;
}

.animate-spin {
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

/* 버튼 */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
