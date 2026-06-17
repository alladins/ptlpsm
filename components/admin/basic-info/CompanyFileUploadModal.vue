<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <h3>회사 파일 업로드</h3>
          <button type="button" class="modal-close" @click="handleClose">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">카테고리</label>
            <select v-model="form.categoryCd" class="form-input">
              <option value="">
                카테고리를 선택하세요
              </option>
              <option
                v-for="opt in categoryOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">파일</label>
            <FileUploadArea
              v-model="form.file"
              :accept-extensions="['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'hwp', 'zip']"
              :max-size-m-b="20"
              upload-label="파일을 드래그하거나 클릭하여 업로드하세요"
              upload-hint="최대 20MB (PDF/Office/이미지/HWP/ZIP)"
              :show-download="false"
            />
          </div>

          <div class="form-group">
            <label class="form-label">설명 (선택)</label>
            <textarea
              v-model="form.description"
              class="form-input"
              rows="3"
              placeholder="파일에 대한 간단한 설명을 입력하세요"
              maxlength="500"
            />
          </div>

          <div class="info-banner">
            <i class="fas fa-info-circle" />
            <span>
              같은 카테고리에 <strong>동일한 파일명</strong>이 있으면 새 버전으로 등록되며,
              기존 파일은 이전 버전으로 보관됩니다.
              파일명이 다르면 같은 카테고리 안에 별개 파일로 추가됩니다.
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="uploading" @click="handleClose">
            취소
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!canUpload || uploading"
            @click="handleUpload"
          >
            <i v-if="uploading" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-upload" />
            {{ uploading ? '업로드 중...' : '업로드' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FileUploadArea from '~/components/admin/common/FileUploadArea.vue'
import { companyFileService } from '~/services/company-file.service'
import { useApiError } from '~/utils/api-error'

interface CategoryOption {
  value: string
  label: string
}

interface Props {
  isOpen: boolean
  categoryOptions: CategoryOption[]
  defaultCategoryCd?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultCategoryCd: ''
})

const emit = defineEmits<{
  close: []
  uploaded: []
}>()

const form = ref<{
  categoryCd: string
  file: File | null
  description: string
}>({
  categoryCd: '',
  file: null,
  description: ''
})

const uploading = ref(false)
const { showApiError } = useApiError()

const canUpload = computed(() => {
  return !!form.value.categoryCd && !!form.value.file
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      form.value = {
        categoryCd: props.defaultCategoryCd || '',
        file: null,
        description: ''
      }
    }
  }
)

const handleClose = () => {
  if (uploading.value) { return }
  emit('close')
}

const handleUpload = async () => {
  if (!canUpload.value || !form.value.file) { return }

  uploading.value = true
  try {
    await companyFileService.upload(
      form.value.file,
      form.value.categoryCd,
      form.value.description.trim() || undefined
    )
    emit('uploaded')
  } catch (err) {
    showApiError(err, { title: '업로드 실패' })
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #374151;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.info-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
