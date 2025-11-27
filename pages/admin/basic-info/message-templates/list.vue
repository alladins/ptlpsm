<template>
  <div class="content-section">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="메시지 템플릿 관리"
      description="발송할 메시지 템플릿을 관리합니다"
    >
      <template #actions>
        <button class="btn-primary" @click="goToRegister">
          <i class="ri-add-line"></i>
          템플릿 등록
        </button>
      </template>
    </PageHeader>

    <!-- 검색 영역 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>템플릿 코드</label>
          <input
            v-model="searchParams.templateCode"
            type="text"
            class="text-input"
            placeholder="템플릿 코드 검색"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="search-item">
          <label>템플릿명</label>
          <input
            v-model="searchParams.templateName"
            type="text"
            class="text-input"
            placeholder="템플릿명 검색"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="search-item">
          <label>메시지 타입</label>
          <select v-model="searchParams.messageType" class="status-select">
            <option value="">전체</option>
            <option value="SMS">SMS</option>
            <option value="LMS">LMS</option>
            <option value="MMS">MMS</option>
          </select>
        </div>

        <div class="search-item">
          <label>사용여부</label>
          <select v-model="searchParams.useYn" class="status-select">
            <option value="">전체</option>
            <option value="Y">사용</option>
            <option value="N">미사용</option>
          </select>
        </div>

        <button class="btn-search-inline" @click="handleSearch">
          <i class="ri-search-line"></i>
          검색
        </button>
        <button class="btn-reset-inline" @click="handleReset">
          <i class="ri-refresh-line"></i>
          초기화
        </button>
      </div>
    </div>

    <!-- 테이블 헤더 -->
    <div class="table-header">
      <div class="table-info">
        총 <strong>{{ totalElements }}</strong>개
      </div>
      <div class="table-controls">
        <select v-model="pageSize" @change="changePageSize">
          <option :value="10">10개씩 보기</option>
          <option :value="20">20개씩 보기</option>
          <option :value="50">50개씩 보기</option>
          <option :value="100">100개씩 보기</option>
        </select>
      </div>
    </div>

    <!-- 데이터 테이블 -->
    <div v-if="loading" class="loading-state">
      <i class="ri-loader-4-line animate-spin"></i>
      데이터를 불러오는 중...
    </div>

    <div v-else-if="error" class="error-state">
      <i class="ri-error-warning-line"></i>
      {{ error }}
    </div>

    <div v-else-if="templates.length === 0" class="empty-state">
      <i class="ri-inbox-line"></i>
      검색 결과가 없습니다
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>템플릿 코드</th>
          <th>템플릿명</th>
          <th>메시지 타입</th>
          <th>내용 미리보기</th>
          <th>사용여부</th>
          <th>수정일시</th>
          <th>작업</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="template in templates" :key="template.templateId" class="table-row" @click="goToEdit(template.templateId)" style="cursor: pointer;">
          <td>
            <code class="template-code">{{ template.templateCode }}</code>
          </td>
          <td>
            <strong>{{ template.templateName }}</strong>
          </td>
          <td>
            <span :class="['badge', `badge-${template.messageType?.toLowerCase() || 'sms'}`]">
              {{ template.messageType || '-' }}
            </span>
          </td>
          <td>
            <div class="content-preview">
              {{ truncateContent(template.content) }}
            </div>
          </td>
          <td>
            <button
              :class="['toggle-btn', template.useYn === 'Y' ? 'active' : 'inactive']"
              @click.stop="handleToggleUse(template)"
            >
              <i :class="template.useYn === 'Y' ? 'ri-check-line' : 'ri-close-line'"></i>
              {{ template.useYn === 'Y' ? '사용' : '미사용' }}
            </button>
          </td>
          <td>
            {{ formatDateTime(template.updatedAt || template.createdAt) }}
          </td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-action-table btn-delete"
                @click.stop="handleDelete(template)"
              >
                <i class="ri-delete-bin-line"></i>
                삭제
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <Pagination
      v-if="templates.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      @change-page="changePage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getMessageTemplateList,
  deleteMessageTemplate,
  toggleMessageTemplateUse
} from '~/services/message-template.service'
import type {
  MessageTemplate,
  MessageTemplateSearchParams
} from '~/types/message-template'
import { formatDateTime } from '~/utils/format'

// Page metadata
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const router = useRouter()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const templates = ref<MessageTemplate[]>([])

// Pagination
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

// Search params
const searchParams = reactive<MessageTemplateSearchParams>({
  templateCode: '',
  templateName: '',
  messageType: undefined,
  useYn: undefined,
  page: 0,
  size: 20,
  sort: 'createdAt,desc'
})

// Methods
const loadTemplates = async () => {
  loading.value = true
  error.value = null

  try {
    const params: MessageTemplateSearchParams = {
      ...searchParams,
      page: currentPage.value,
      size: pageSize.value
    }

    // Remove empty params
    if (!params.templateCode) delete params.templateCode
    if (!params.templateName) delete params.templateName
    if (!params.messageType) delete params.messageType
    if (!params.useYn) delete params.useYn

    const response = await getMessageTemplateList(params)

    templates.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
  } catch (err: any) {
    error.value = err.message || '데이터를 불러오는데 실패했습니다'
    templates.value = []
    totalPages.value = 0
    totalElements.value = 0
    console.error('템플릿 목록 조회 오류:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 0
  loadTemplates()
}

const handleReset = () => {
  searchParams.templateCode = ''
  searchParams.templateName = ''
  searchParams.messageType = undefined
  searchParams.useYn = undefined
  currentPage.value = 0
  loadTemplates()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadTemplates()
}

const changePageSize = () => {
  searchParams.size = pageSize.value
  currentPage.value = 0
  loadTemplates()
}

const handleToggleUse = async (template: MessageTemplate) => {
  const confirmMessage =
    template.useYn === 'Y'
      ? `"${template.templateName}" 템플릿을 미사용 상태로 변경하시겠습니까?`
      : `"${template.templateName}" 템플릿을 사용 상태로 변경하시겠습니까?`

  if (!confirm(confirmMessage)) return

  try {
    await toggleMessageTemplateUse(template.templateId)
    alert('사용 여부가 변경되었습니다')
    loadTemplates()
  } catch (err: any) {
    alert(err.message || '사용 여부 변경에 실패했습니다')
    console.error('Toggle use error:', err)
  }
}

const handleDelete = async (template: MessageTemplate) => {
  if (
    !confirm(
      `"${template.templateName}" 템플릿을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    )
  )
    return

  try {
    await deleteMessageTemplate(template.templateId)
    alert('템플릿이 삭제되었습니다')
    loadTemplates()
  } catch (err: any) {
    alert(err.message || '템플릿 삭제에 실패했습니다')
    console.error('Delete error:', err)
  }
}

const truncateContent = (content: string | null | undefined, maxLength = 50): string => {
  if (!content) return '-'
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

// Navigation
const goToRegister = () => {
  router.push('/admin/basic-info/message-templates/register')
}

const goToEdit = (id: number) => {
  router.push(`/admin/basic-info/message-templates/edit/${id}`)
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

/* 페이지 전용 스타일 */

/* 템플릿 코드 */
.template-code {
  display: inline-block;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #1f2937;
}

/* 행 클릭 가능 표시 */
.table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f9fafb;
}

/* 테이블 액션 버튼 */
.btn-action-table {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.btn-action-table i {
  font-size: 14px;
}

.btn-action-table.btn-delete {
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.25);
}

.btn-action-table.btn-delete:hover {
  background: linear-gradient(180deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.35);
  transform: translateY(-2px);
}

/* 배지 */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
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

/* 내용 미리보기 */
.content-preview {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b7280;
  font-size: 13px;
}

/* 토글 버튼 */
.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #dcfce7;
  color: #166534;
}

.toggle-btn.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.toggle-btn:hover {
  opacity: 0.8;
}
</style>
