<template>
  <div class="message-template-register-page">
    <PageHeader title="메시지 템플릿 등록" description="새로운 메시지 템플릿을 등록합니다">
      <template #actions>
        <button class="btn-secondary" @click="goToList">
          <i class="ri-arrow-left-line"></i>
          목록으로
        </button>
      </template>
    </PageHeader>

    <MessageTemplateForm mode="create" @submit="handleSubmit" @cancel="goToList" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { createMessageTemplate } from '~/services/message-template.service'
import type { MessageTemplateCreateRequest } from '~/types/message-template'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const router = useRouter()

const handleSubmit = async (data: MessageTemplateCreateRequest) => {
  try {
    await createMessageTemplate(data)
    alert('메시지 템플릿이 등록되었습니다')
    router.push('/admin/basic-info/message-templates/list')
  } catch (error: any) {
    alert(error.message || '템플릿 등록에 실패했습니다')
    console.error('Create template error:', error)
  }
}

const goToList = () => {
  router.push('/admin/basic-info/message-templates/list')
}
</script>

<style scoped>
.message-template-register-page {
  padding: 24px;
}

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
