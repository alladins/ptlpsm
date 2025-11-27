<template>
  <div class="message-template-detail-page">
    <PageHeader title="메시지 템플릿 상세" description="메시지 템플릿 정보를 확인합니다">
      <template #actions>
        <button class="btn-secondary" @click="goToList">
          <i class="ri-arrow-left-line"></i>
          목록으로
        </button>
        <button class="btn-primary" @click="goToEdit">
          <i class="ri-edit-line"></i>
          수정
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

    <!-- 상세 정보 -->
    <div v-else-if="template" class="detail-content">
      <!-- 기본 정보 -->
      <div class="info-section">
        <h3 class="section-title">기본 정보</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>템플릿 코드</label>
            <div class="value">
              <code class="template-code">{{ template.templateCode }}</code>
            </div>
          </div>

          <div class="info-item">
            <label>템플릿명</label>
            <div class="value">{{ template.templateName }}</div>
          </div>

          <div class="info-item">
            <label>메시지 타입</label>
            <div class="value">
              <span :class="['badge', `badge-${template.messageType?.toLowerCase() || 'sms'}`]">
                {{ template.messageType || '-' }}
              </span>
            </div>
          </div>

          <div class="info-item">
            <label>사용 여부</label>
            <div class="value">
              <span :class="['status-badge', template.useYn === 'Y' ? 'active' : 'inactive']">
                <i :class="template.useYn === 'Y' ? 'ri-check-line' : 'ri-close-line'"></i>
                {{ template.useYn === 'Y' ? '사용' : '미사용' }}
              </span>
            </div>
          </div>

          <div v-if="template.description" class="info-item full-width">
            <label>설명</label>
            <div class="value">{{ template.description }}</div>
          </div>
        </div>
      </div>

      <!-- 메시지 내용 -->
      <div class="info-section">
        <h3 class="section-title">메시지 내용</h3>

        <div v-if="template.subject" class="info-item">
          <label>제목</label>
          <div class="value subject">{{ template.subject }}</div>
        </div>

        <div class="info-item">
          <label>
            내용
            <span class="char-count">({{ template.content?.length || 0 }}자)</span>
          </label>
          <div class="value content">{{ template.content || '' }}</div>
        </div>

        <!-- 미리보기 -->
        <div class="message-preview">
          <div class="preview-header">
            <i class="ri-smartphone-line"></i>
            미리보기
          </div>
          <div class="preview-content">
            <div v-if="template.subject" class="preview-subject">
              {{ template.subject }}
            </div>
            <div class="preview-body">
              {{ template.content || '' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 시스템 정보 -->
      <div class="info-section">
        <h3 class="section-title">시스템 정보</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>템플릿 ID</label>
            <div class="value">{{ template.templateId }}</div>
          </div>

          <div class="info-item">
            <label>등록일시</label>
            <div class="value">{{ formatDateTime(template.createdAt) }}</div>
          </div>

          <div class="info-item">
            <label>등록자</label>
            <div class="value">{{ template.createdBy || '-' }}</div>
          </div>

          <div class="info-item">
            <label>수정일시</label>
            <div class="value">
              {{ template.updatedAt ? formatDateTime(template.updatedAt) : '-' }}
            </div>
          </div>

          <div class="info-item">
            <label>수정자</label>
            <div class="value">{{ template.updatedBy || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="action-section">
        <button class="btn-danger" @click="handleDelete">
          <i class="ri-delete-bin-line"></i>
          삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getMessageTemplate, deleteMessageTemplate } from '~/services/message-template.service'
import type { MessageTemplate } from '~/types/message-template'
import { formatDateTime } from '~/utils/format'

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

const handleDelete = async () => {
  if (!template.value) return

  if (
    !confirm(
      `"${template.value.templateName}" 템플릿을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    )
  )
    return

  try {
    await deleteMessageTemplate(template.value.templateId)
    alert('템플릿이 삭제되었습니다')
    router.push('/admin/basic-info/message-templates/list')
  } catch (err: any) {
    alert(err.message || '템플릿 삭제에 실패했습니다')
    console.error('Delete error:', err)
  }
}

// Navigation
const goToList = () => {
  router.push('/admin/basic-info/message-templates/list')
}

const goToEdit = () => {
  if (!template.value) return
  router.push(`/admin/basic-info/message-templates/edit/${template.value.templateId}`)
}

// Lifecycle
onMounted(() => {
  loadTemplate()
})
</script>

<style scoped>
.message-template-detail-page {
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

/* 상세 정보 */
.detail-content {
  max-width: 900px;
  margin: 0 auto;
}

.info-section {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.info-item .value {
  font-size: 15px;
  color: #1f2937;
}

.info-item .value.subject {
  font-weight: 600;
}

.info-item .value.content {
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 400;
}

/* 템플릿 코드 */
.template-code {
  display: inline-block;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #1f2937;
}

/* 배지 */
.badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.badge-sms {
  background: #dbeafe;
  color: #1e40af;
}

.badge-lms {
  background: #fef3c7;
  color: #92400e;
}

.badge-mms {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* 미리보기 */
.message-preview {
  margin-top: 20px;
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

/* 액션 섹션 */
.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
}

/* 버튼 */
.btn-primary,
.btn-secondary,
.btn-danger {
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

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* 반응형 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
