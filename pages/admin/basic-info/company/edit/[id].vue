<template>
  <div class="company-edit">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="회사 정보 수정"
      description="회사 정보를 수정합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-arrow-left"></i>
          목록으로
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner fa-spin"></i>
        <p>데이터를 불러오는 중...</p>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn-action btn-primary" @click="loadCompany">
          <i class="fas fa-redo"></i>
          다시 시도
        </button>
      </div>

      <!-- 회사 정보 폼 -->
      <CompanyForm
        v-else-if="companyData"
        ref="formRef"
        mode="edit"
        :initial-data="companyData"
        @submit="handleUpdate"
        @cancel="goBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from '#imports'
import { companyService } from '~/services/company.service'
import type { CompanyInfoResponse, CompanyCreateRequest } from '~/types/company'
import CompanyForm from '~/components/admin/company/CompanyForm.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '회사 정보 수정'
})

const router = useRouter()
const route = useRoute()
const formRef = ref<{ setSaving: (value: boolean) => void } | null>(null)

// 상태 관리
const loading = ref(false)
const error = ref<string | null>(null)
const companyData = ref<CompanyInfoResponse | null>(null)

// 회사 ID
const companyId = computed(() => Number(route.params.id))

// 회사 정보 로드
async function loadCompany() {
  loading.value = true
  error.value = null

  try {
    companyData.value = await companyService.getCompany(companyId.value)
  } catch (err: any) {
    console.error('Failed to load company:', err)
    error.value = err.response?.data?.message || '회사 정보를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 수정 처리
async function handleUpdate(data: CompanyCreateRequest) {
  if (!formRef.value) return

  try {
    formRef.value.setSaving(true)

    await companyService.updateCompany(companyId.value, data)

    alert('회사 정보가 수정되었습니다.')

    // 수정 성공 시 상세 페이지로 이동
    router.push(`/admin/basic-info/company/detail/${companyId.value}`)
  } catch (error: any) {
    console.error('Failed to update company:', error)

    // 에러 메시지 처리
    let errorMessage = '회사 정보 수정에 실패했습니다.'
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

// 초기 로드
onMounted(() => {
  loadCompany()
})
</script>

<style scoped>
.company-edit {
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

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

/* 메시지 스타일 */
.loading-message,
.error-message {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
}

.loading-message {
  color: #9ca3af;
}

.error-message {
  color: #ef4444;
}

.loading-message i,
.error-message i {
  font-size: 48px;
  margin-bottom: 15px;
}

.loading-message p,
.error-message p {
  font-size: 16px;
  margin: 0 0 15px 0;
}
</style>
