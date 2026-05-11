<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <h3>이메일로 파일 보내기</h3>
          <button type="button" class="modal-close" @click="handleClose">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 첨부 파일 목록 -->
          <div class="form-group">
            <label class="form-label">
              첨부 파일
              <span class="text-muted">({{ selectedFiles.length }}개, 합계 {{ formatFileSize(totalSize) }})</span>
            </label>
            <div class="file-list">
              <div v-if="selectedFiles.length === 0" class="empty-files">
                선택된 파일이 없습니다.
              </div>
              <div
                v-for="f in selectedFiles"
                :key="f.id"
                class="file-row"
              >
                <input
                  type="checkbox"
                  :checked="!excludedIds.includes(f.id)"
                  @change="toggleExclude(f.id)"
                >
                <i class="fas fa-paperclip" />
                <span class="file-name">{{ f.fileNm }}</span>
                <span class="file-meta">
                  [{{ f.categoryNm }}] v{{ f.versionNo }} · {{ formatFileSize(f.fileSize) }}
                </span>
              </div>
            </div>
            <div v-if="totalSize > 25 * 1024 * 1024" class="warning-banner">
              <i class="fas fa-exclamation-triangle" />
              <span>첨부 파일 합계가 25MB를 초과합니다. 일부 메일 서버에서 거부될 수 있습니다.</span>
            </div>
          </div>

          <!-- 받는 사람 -->
          <div class="form-group">
            <label class="form-label required">받는 사람</label>
            <input
              v-model="form.to"
              type="text"
              class="form-input"
              placeholder="example@domain.com, another@domain.com"
            >
            <p class="form-help">
              쉼표로 구분하여 여러 명 입력 가능
            </p>
          </div>

          <!-- 참조 -->
          <div class="form-group">
            <label class="form-label">참조 (선택)</label>
            <input
              v-model="form.cc"
              type="text"
              class="form-input"
              placeholder="cc@domain.com"
            >
          </div>

          <!-- 제목 -->
          <div class="form-group">
            <label class="form-label required">제목</label>
            <input
              v-model="form.subject"
              type="text"
              class="form-input"
              maxlength="200"
            >
          </div>

          <!-- 본문 -->
          <div class="form-group">
            <label class="form-label required">본문</label>
            <textarea
              v-model="form.body"
              class="form-input"
              rows="6"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="sending" @click="handleClose">
            취소
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!canSend || sending"
            @click="handleSend"
          >
            <i v-if="sending" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-paper-plane" />
            {{ sending ? '발송 중...' : '발송' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { companyFileService, type CompanyFile } from '~/services/company-file.service'
import { useApiError } from '~/utils/api-error'

interface Props {
  isOpen: boolean
  files: CompanyFile[]
  defaultSubject?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultSubject: '문서 전달드립니다'
})

const emit = defineEmits<{
  close: []
  sent: []
}>()

const defaultBodyText = '안녕하세요,\n첨부드린 문서 확인 부탁드립니다.\n\n감사합니다.'

const form = ref({
  to: '',
  cc: '',
  subject: '',
  body: defaultBodyText
})

const excludedIds = ref<number[]>([])
const sending = ref(false)
const { showApiError } = useApiError()

const selectedFiles = computed(() => props.files)

const includedFiles = computed(() =>
  selectedFiles.value.filter(f => !excludedIds.value.includes(f.id))
)

const totalSize = computed(() =>
  includedFiles.value.reduce((sum, f) => sum + (f.fileSize || 0), 0)
)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const parsedTo = computed(() =>
  form.value.to.split(',').map(s => s.trim()).filter(Boolean)
)
const parsedCc = computed(() =>
  form.value.cc.split(',').map(s => s.trim()).filter(Boolean)
)

const canSend = computed(() => {
  if (includedFiles.value.length === 0) { return false }
  if (parsedTo.value.length === 0) { return false }
  if (!parsedTo.value.every(e => emailRegex.test(e))) { return false }
  if (parsedCc.value.length > 0 && !parsedCc.value.every(e => emailRegex.test(e))) { return false }
  if (!form.value.subject.trim()) { return false }
  if (!form.value.body.trim()) { return false }
  return true
})

const formatFileSize = (bytes: number): string => {
  if (!bytes) { return '0 B' }
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const toggleExclude = (id: number) => {
  const idx = excludedIds.value.indexOf(id)
  if (idx >= 0) {
    excludedIds.value.splice(idx, 1)
  } else {
    excludedIds.value.push(id)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      excludedIds.value = []
      form.value = {
        to: '',
        cc: '',
        subject: props.defaultSubject || '문서 전달드립니다',
        body: ''
      }
    }
  }
)

const handleClose = () => {
  if (sending.value) { return }
  emit('close')
}

const handleSend = async () => {
  if (!canSend.value) { return }

  // 형식 검증 메시지
  if (!parsedTo.value.every(e => emailRegex.test(e))) {
    alert('받는 사람 이메일 형식이 올바르지 않습니다.')
    return
  }

  sending.value = true
  try {
    await companyFileService.sendSimpleEmail({
      to: parsedTo.value,
      cc: parsedCc.value,
      subject: form.value.subject.trim(),
      body: form.value.body.trim() || defaultBodyText,
      fileIds: includedFiles.value.map(f => f.id)
    })
    alert('이메일이 발송되었습니다.')
    emit('sent')
  } catch (err) {
    showApiError(err, { title: '이메일 발송 실패' })
  } finally {
    sending.value = false
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
  max-width: 640px;
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

.text-muted {
  color: #6b7280;
  font-weight: normal;
  font-size: 0.8125rem;
  margin-left: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-help {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.file-list {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  max-height: 180px;
  overflow-y: auto;
}

.empty-files {
  padding: 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8125rem;
}

.file-row:last-child {
  border-bottom: none;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  color: #6b7280;
  font-size: 0.75rem;
}

.warning-banner {
  margin-top: 0.5rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
