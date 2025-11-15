<template>
  <div class="company-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="회사 정보 등록"
      description="새로운 회사 정보를 등록합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-arrow-left"></i>
          목록으로
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 회사 정보 폼 -->
      <CompanyForm
        ref="formRef"
        mode="create"
        @submit="handleCreate"
        @cancel="goBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#imports'
import { companyService } from '~/services/company.service'
import type { CompanyCreateRequest } from '~/types/company'
import CompanyForm from '~/components/admin/company/CompanyForm.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '회사 정보 등록'
})

const router = useRouter()
const formRef = ref<{ setSaving: (value: boolean) => void } | null>(null)

// 등록 처리
async function handleCreate(data: CompanyCreateRequest) {
  if (!formRef.value) return

  try {
    formRef.value.setSaving(true)

    const response = await companyService.createCompany(data)

    alert('회사 정보가 등록되었습니다.')

    // 등록 성공 시 상세 페이지로 이동
    router.push(`/admin/basic-info/company/detail/${response.id}`)
  } catch (error: any) {
    console.error('Failed to create company:', error)

    // 에러 메시지 처리
    let errorMessage = '회사 정보 등록에 실패했습니다.'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    alert(errorMessage)
  } finally {
    if (formRef.value) {
      formRef.value.setSaving(false)
    }
  }
}

// 취소 및 목록으로
function goBack() {
  router.push('/admin/basic-info/company/list')
}
</script>

<style scoped>
.company-register {
  padding: 20px;
}

.content-section {
  margin-top: 20px;
}

/* 버튼 스타일 */
.btn-action {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}
</style>
