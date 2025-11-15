<template>
  <div class="company-detail">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="회사 정보 상세"
      description="회사 정보를 조회하고 수정합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="handleCancel">
          <i class="fas fa-list"></i>
          {{ isEditMode ? '취소' : '목록' }}
        </button>
        <button v-if="!isEditMode" class="btn-action btn-primary" @click="enterEditMode">
          <i class="fas fa-edit"></i>
          수정
        </button>
        <button v-if="isEditMode" class="btn-action btn-success" @click="handleSave" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          저장
        </button>
        <button class="btn-action btn-danger" @click="handleDelete">
          <i class="fas fa-trash"></i>
          삭제
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
        :mode="isEditMode ? 'edit' : 'view'"
        :initial-data="companyData"
        @submit="handleSubmit"
        @cancel="handleCancel"
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
  pageTitle: '회사 정보 상세'
})

const router = useRouter()
const route = useRoute()
const formRef = ref<{ setSaving: (value: boolean) => void } | null>(null)

// 상태 관리
const loading = ref(false)
const error = ref<string | null>(null)
const companyData = ref<CompanyInfoResponse | null>(null)
const isEditMode = ref(false)
const saving = ref(false)

// 회사 ID
const companyId = computed(() => Number(route.params.id))

// 회사 정보 로드
async function loadCompany() {
  loading.value = true
  error.value = null

  console.log('[Detail] Loading company:', companyId.value)

  try {
    companyData.value = await companyService.getCompany(companyId.value)
    console.log('[Detail] Company data loaded:', companyData.value)
  } catch (err: any) {
    console.error('[Detail] Failed to load company:', err)
    error.value = err.response?.data?.message || '회사 정보를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
    console.log('[Detail] Loading complete. Data:', !!companyData.value, 'Error:', !!error.value)
  }
}

// 편집 모드 진입
function enterEditMode() {
  isEditMode.value = true
}

// 취소 처리
function handleCancel() {
  if (isEditMode.value) {
    const confirmed = confirm('수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.')
    if (confirmed) {
      isEditMode.value = false
      loadCompany() // 원래 데이터 다시 로드
    }
  } else {
    router.push('/admin/basic-info/company/list')
  }
}

// 저장 처리
async function handleSubmit(data: CompanyCreateRequest) {
  saving.value = true
  if (formRef.value) {
    formRef.value.setSaving(true)
  }

  try {
    await companyService.updateCompany(companyId.value, data)
    alert('회사 정보가 수정되었습니다.')
    isEditMode.value = false
    await loadCompany() // 최신 데이터 다시 로드
  } catch (error: any) {
    console.error('Failed to update company:', error)

    let errorMessage = '회사 정보 수정에 실패했습니다.'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    alert(errorMessage)
  } finally {
    saving.value = false
    if (formRef.value) {
      formRef.value.setSaving(false)
    }
  }
}

// 수동 저장 버튼 (헤더)
function handleSave() {
  // CompanyForm의 submit 이벤트를 트리거하기 위해
  // 폼 내부의 submit 버튼을 프로그래밍 방식으로 클릭
  const submitBtn = document.querySelector('.company-form button[type="submit"]') as HTMLButtonElement
  if (submitBtn) {
    submitBtn.click()
  }
}

// 삭제 처리
async function handleDelete() {
  if (!companyData.value) return

  const confirmed = confirm(`'${companyData.value.companyName}' 회사를 삭제하시겠습니까?`)
  if (!confirmed) return

  try {
    await companyService.deleteCompany(companyId.value)
    alert('삭제되었습니다.')
    router.push('/admin/basic-info/company/list')
  } catch (error: any) {
    console.error('Failed to delete company:', error)

    let errorMessage = '삭제에 실패했습니다.'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    alert(errorMessage)
  }
}

// 초기 로드
onMounted(() => {
  loadCompany()
})
</script>

<style scoped>
.company-detail {
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

.btn-action:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
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
