<template>
  <div class="message-template-form">
    <form @submit.prevent="handleSubmit">
      <!-- 기본 정보 -->
      <div class="form-section">
        <h3 class="section-title">기본 정보</h3>

        <div class="form-row">
          <div class="form-group">
            <label class="required">템플릿 코드</label>
            <input
              v-model="formData.templateCode"
              type="text"
              placeholder="예: DELIVERY_RECEIPT_SITE_SUPERVISOR"
              :disabled="mode === 'edit'"
              required
            />
            <span class="help-text">영문 대문자와 언더스코어(_)로 구성된 고유 코드</span>
          </div>

          <div class="form-group">
            <label class="required">템플릿명</label>
            <input
              v-model="formData.templateName"
              type="text"
              placeholder="예: 납품확인서 서명 요청 (현장소장)"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="required">메시지 타입</label>
            <select v-model="formData.messageType" required>
              <option value="">선택</option>
              <option value="SMS">SMS (단문, 최대 80자)</option>
              <option value="LMS">LMS (장문, 최대 2,000자)</option>
              <option value="MMS">MMS (멀티미디어)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="required">사용 여부</label>
            <select v-model="formData.useYn" required>
              <option value="Y">사용</option>
              <option value="N">미사용</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>설명</label>
          <input
            v-model="formData.description"
            type="text"
            placeholder="템플릿에 대한 간단한 설명"
          />
        </div>
      </div>

      <!-- 메시지 내용 -->
      <div class="form-section">
        <h3 class="section-title">메시지 내용</h3>

        <div v-if="formData.messageType === 'LMS' || formData.messageType === 'MMS'" class="form-group">
          <label :class="{ required: formData.messageType === 'LMS' || formData.messageType === 'MMS' }">
            제목
          </label>
          <input
            v-model="formData.subject"
            type="text"
            placeholder="LMS/MMS 메시지 제목"
            :required="formData.messageType === 'LMS' || formData.messageType === 'MMS'"
          />
        </div>

        <div class="form-group">
          <div class="content-header">
            <label class="required">내용</label>
            <div class="char-counter">
              <span :class="{ error: isContentTooLong }">
                {{ contentLength }} / {{ maxLength }}자
              </span>
              <button
                type="button"
                class="btn-small btn-secondary"
                @click="showVariableHelper = !showVariableHelper"
              >
                <i class="ri-code-s-slash-line"></i>
                변수 삽입
              </button>
            </div>
          </div>

          <textarea
            v-model="formData.content"
            rows="10"
            placeholder="메시지 내용을 입력하세요.&#10;&#10;변수는 {{변수명}} 형식으로 입력할 수 있습니다.&#10;예: {{납품요구번호}}, {{계약번호}}, {{서명URL}}"
            required
            :class="{ error: isContentTooLong }"
          ></textarea>

          <div v-if="isContentTooLong" class="error-message">
            <i class="ri-error-warning-line"></i>
            {{ formData.messageType }}는 최대 {{ maxLength }}자까지 입력할 수 있습니다
          </div>

          <!-- 미리보기 -->
          <div class="message-preview">
            <div class="preview-header">
              <i class="ri-smartphone-line"></i>
              미리보기
            </div>
            <div class="preview-content">
              <div v-if="formData.subject" class="preview-subject">
                {{ formData.subject }}
              </div>
              <div class="preview-body">
                {{ formData.content || '내용을 입력하면 미리보기가 표시됩니다' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 변수 도우미 -->
      <VariableHelper v-if="showVariableHelper" @insert-variable="insertVariable" />

      <!-- 액션 버튼 -->
      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="handleCancel">
          <i class="ri-close-line"></i>
          취소
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="isContentTooLong || isSubmitting"
        >
          <i v-if="isSubmitting" class="ri-loader-4-line animate-spin"></i>
          <i v-else class="ri-save-line"></i>
          {{ mode === 'create' ? '등록' : '수정' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type {
  MessageTemplateCreateRequest,
  MessageTemplateUpdateRequest,
  MessageTemplate,
  MessageTemplateType
} from '~/types/message-template'

// Props
interface Props {
  mode: 'create' | 'edit'
  initialData?: MessageTemplate
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  initialData: undefined
})

// Emits
const emit = defineEmits<{
  submit: [data: MessageTemplateCreateRequest | MessageTemplateUpdateRequest]
  cancel: []
}>()

// State
const showVariableHelper = ref(false)
const isSubmitting = ref(false)

const formData = ref<MessageTemplateCreateRequest>({
  templateCode: props.initialData?.templateCode || '',
  templateName: props.initialData?.templateName || '',
  messageType: props.initialData?.messageType || ('' as MessageTemplateType),
  subject: props.initialData?.subject || '',
  content: props.initialData?.content || '',
  description: props.initialData?.description || '',
  useYn: props.initialData?.useYn || 'Y'
})

// Computed
const contentLength = computed(() => {
  return formData.value.content?.length || 0
})

const maxLength = computed(() => {
  switch (formData.value.messageType) {
    case 'SMS':
      return 80
    case 'LMS':
    case 'MMS':
      return 2000
    default:
      return 2000
  }
})

const isContentTooLong = computed(() => {
  return contentLength.value > maxLength.value
})

// Watch for message type changes
watch(
  () => formData.value.messageType,
  (newType) => {
    // SMS는 제목 필요 없음
    if (newType === 'SMS') {
      formData.value.subject = ''
    }
  }
)

// Methods
const insertVariable = (variableKey: string) => {
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const currentContent = formData.value.content || ''

  const variableText = `{{${variableKey}}}`
  const newContent =
    currentContent.substring(0, start) + variableText + currentContent.substring(end)

  formData.value.content = newContent

  // 커서 위치 조정
  nextTick(() => {
    textarea.focus()
    const newCursorPos = start + variableText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })

  showVariableHelper.value = false
}

const handleSubmit = () => {
  if (isContentTooLong.value) {
    alert(`메시지 내용이 너무 깁니다. 최대 ${maxLength.value}자까지 입력할 수 있습니다.`)
    return
  }

  isSubmitting.value = true

  // Clean data (remove empty fields for update)
  const submitData = { ...formData.value }
  if (props.mode === 'edit') {
    if (!submitData.subject) delete (submitData as any).subject
    if (!submitData.description) delete (submitData as any).description
  }

  emit('submit', submitData)

  // Reset submitting state after emit
  setTimeout(() => {
    isSubmitting.value = false
  }, 1000)
}

const handleCancel = () => {
  if (confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) {
    emit('cancel')
  }
}
</script>

<style scoped>
.message-template-form {
  max-width: 900px;
  margin: 0 auto;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 200px;
  line-height: 1.6;
}

.form-group textarea.error {
  border-color: #dc2626;
}

.help-text {
  font-size: 12px;
  color: #6b7280;
}

/* 내용 헤더 */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.char-counter span.error {
  color: #dc2626;
  font-weight: 600;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

/* 에러 메시지 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 13px;
  margin-top: 8px;
}

/* 미리보기 */
.message-preview {
  margin-top: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.preview-content {
  padding: 16px;
  background: white;
}

.preview-subject {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-body {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 액션 버튼 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
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

/* 반응형 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .char-counter {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
