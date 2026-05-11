<template>
  <div class="company-files-page">
    <!-- 페이지 헤더 -->
    <div class="page-header-compact">
      <h1>회사 파일관리</h1>
      <span class="page-description">회사 공통 문서를 관리하고 이메일로 발송할 수 있습니다.</span>
      <div class="header-actions-right">
        <button class="btn-refresh" @click="loadList">
          <i class="fas fa-sync-alt" />
          새로고침
        </button>
      </div>
    </div>

    <!-- 안내 배너 -->
    <div class="info-banner">
      <i class="fas fa-info-circle" />
      <span v-if="canWrite">
        카테고리 항목은 아래 "카테고리 관리" 버튼으로 추가/수정할 수 있습니다.
      </span>
      <span v-else>
        카테고리 추가/수정이 필요하면 시스템 관리자에게 문의하세요.
      </span>
      <button v-if="canWrite" class="btn-link" @click="categoryModalOpen = true">
        <i class="fas fa-sliders-h" />
        카테고리 관리
      </button>
    </div>

    <!-- 검색/필터/액션 영역 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>카테고리</label>
          <select v-model="filter.categoryCd" class="filter-input" @change="onFilterChange">
            <option value="">
              전체
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
        <div class="filter-spacer" />
        <div class="filter-actions">
          <button
            v-if="canWrite"
            class="btn-secondary"
            :disabled="selectedIds.length === 0"
            @click="openEmailModal"
          >
            <i class="fas fa-paper-plane" />
            이메일로 보내기 ({{ selectedIds.length }})
          </button>
          <button v-if="canWrite" class="btn-primary" @click="openUploadModal">
            <i class="fas fa-upload" />
            업로드
          </button>
        </div>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px" class="text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isIndeterminate"
                @change="toggleSelectAll"
              >
            </th>
            <th style="width: 140px">
              카테고리
            </th>
            <th>설명</th>
            <th>파일명</th>
            <th style="width: 80px" class="text-center">
              버전
            </th>
            <th style="width: 100px" class="text-right">
              크기
            </th>
            <th style="width: 100px" class="text-center">
              등록자
            </th>
            <th style="width: 170px" class="text-center">
              등록일
            </th>
            <th style="width: 200px" class="text-center">
              액션
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="empty-row">
              <i class="fas fa-spinner fa-spin" /> 불러오는 중...
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="9" class="empty-row error-text">
              <i class="fas fa-exclamation-circle" /> {{ error }}
            </td>
          </tr>
          <tr v-else-if="files.length === 0">
            <td colspan="9" class="empty-row">
              등록된 파일이 없습니다.
            </td>
          </tr>
          <tr v-for="file in files" :key="file.id">
            <td class="text-center">
              <input
                v-model="selectedIds"
                type="checkbox"
                :value="file.id"
              >
            </td>
            <td>{{ file.categoryNm }}</td>
            <td class="description-cell">
              {{ file.description || '-' }}
            </td>
            <td class="file-name-cell">
              <i class="fas fa-paperclip" />
              {{ file.fileNm }}
            </td>
            <td class="text-center">
              <span
                class="version-badge"
                :class="file.isCurrent === 'Y' ? 'badge-current' : 'badge-old'"
              >
                v{{ file.versionNo }}
              </span>
            </td>
            <td class="text-right">
              {{ formatFileSize(file.fileSize) }}
            </td>
            <td class="text-center">
              {{ file.createdBy }}
            </td>
            <td class="text-center datetime-cell">
              {{ formatDateTime(file.createdAt) }}
            </td>
            <td class="text-center actions-cell">
              <button class="btn-icon btn-icon-blue" title="다운로드" @click="onDownload(file)">
                <i class="fas fa-download" />
              </button>
              <button
                v-if="canEdit"
                class="btn-icon btn-icon-gray"
                title="설명 수정"
                @click="openEditModal(file)"
              >
                <i class="fas fa-pen" />
              </button>
              <button
                class="btn-icon btn-icon-gray"
                title="이력 보기"
                @click="openHistoryModal(file)"
              >
                <i class="fas fa-clock-rotate-left" />
              </button>
              <button
                v-if="canDelete"
                class="btn-icon btn-icon-red"
                title="삭제"
                @click="onDelete(file)"
              >
                <i class="fas fa-trash" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 업로드 모달 -->
    <CompanyFileUploadModal
      :is-open="uploadModalOpen"
      :category-options="categoryOptions"
      :default-category-cd="filter.categoryCd"
      @close="uploadModalOpen = false"
      @uploaded="onUploaded"
    />

    <!-- 이메일 발송 모달 -->
    <CompanyFileSendEmailModal
      :is-open="emailModalOpen"
      :files="selectedFiles"
      @close="emailModalOpen = false"
      @sent="onEmailSent"
    />

    <!-- 이력 모달 -->
    <CompanyFileHistoryModal
      :is-open="historyModalOpen"
      :category-cd="historyCategoryCd"
      :category-nm="historyCategoryNm"
      @close="historyModalOpen = false"
    />

    <!-- 카테고리 관리 모달 -->
    <CompanyFileCategoryModal
      :is-open="categoryModalOpen"
      @close="categoryModalOpen = false"
      @changed="onCategoriesChanged"
    />

    <!-- 설명 수정 모달 (간단 inline) -->
    <Teleport to="body">
      <div v-if="editModalOpen" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-container small">
          <div class="modal-header">
            <h3>설명 수정</h3>
            <button type="button" class="modal-close" @click="closeEditModal">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">파일명</label>
              <input :value="editingFile?.fileNm" disabled class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">설명</label>
              <textarea
                v-model="editDescription"
                class="form-input"
                rows="4"
                maxlength="500"
                placeholder="설명을 입력하세요"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" :disabled="updating" @click="closeEditModal">
              취소
            </button>
            <button class="btn-primary" :disabled="updating" @click="onUpdate">
              <i v-if="updating" class="fas fa-spinner fa-spin" />
              <i v-else class="fas fa-save" />
              저장
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePermission } from '~/composables/usePermission'
import { useApiError } from '~/utils/api-error'
import { codeService } from '~/services/code.service'
import { companyFileService, type CompanyFile } from '~/services/company-file.service'
import CompanyFileUploadModal from '~/components/admin/basic-info/CompanyFileUploadModal.vue'
import CompanyFileSendEmailModal from '~/components/admin/basic-info/CompanyFileSendEmailModal.vue'
import CompanyFileHistoryModal from '~/components/admin/basic-info/CompanyFileHistoryModal.vue'
import CompanyFileCategoryModal from '~/components/admin/basic-info/CompanyFileCategoryModal.vue'

definePageMeta({
  layout: 'admin'
})

useRoute()
const { canWrite, canEdit, canDelete } = usePermission('COMPANY_FILE_MANAGE')
const { showApiError, formatErrorMessage } = useApiError()

interface CategoryOption {
  value: string
  label: string
}

// ========================================
// State
// ========================================
const categoryOptions = ref<CategoryOption[]>([])
const files = ref<CompanyFile[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const filter = ref({
  categoryCd: ''
})

// 이력 모달 상태
const historyModalOpen = ref(false)
const historyCategoryCd = ref('')
const historyCategoryNm = ref('')

// 카테고리 관리 모달 상태
const categoryModalOpen = ref(false)

const openHistoryModal = (file: CompanyFile) => {
  historyCategoryCd.value = file.categoryCd
  historyCategoryNm.value = file.categoryNm
  historyModalOpen.value = true
}

// 카테고리 변경 시 드롭다운 재로드
const onCategoriesChanged = async () => {
  await loadCategories()
  await loadList()
}

const selectedIds = ref<number[]>([])

const uploadModalOpen = ref(false)
const emailModalOpen = ref(false)
const editModalOpen = ref(false)
const editingFile = ref<CompanyFile | null>(null)
const editDescription = ref('')
const updating = ref(false)

// ========================================
// Computed
// ========================================
const selectedFiles = computed(() =>
  files.value.filter(f => selectedIds.value.includes(f.id))
)

const isAllSelected = computed(() =>
  files.value.length > 0 && selectedIds.value.length === files.value.length
)

const isIndeterminate = computed(() =>
  selectedIds.value.length > 0 && selectedIds.value.length < files.value.length
)

// ========================================
// Methods
// ========================================
const loadCategories = async () => {
  try {
    const list = await codeService.getActiveCodes('COMPANY_FILE_CATEGORY')
    categoryOptions.value = list.map(c => ({ value: c.code, label: c.codeName }))
  } catch (err) {
    console.error('카테고리 로드 실패:', err)
  }
}

const loadList = async () => {
  loading.value = true
  error.value = null
  selectedIds.value = []
  try {
    let result = await companyFileService.listCurrent()
    if (filter.value.categoryCd) {
      result = result.filter(f => f.categoryCd === filter.value.categoryCd)
    }
    files.value = result
  } catch (err) {
    error.value = formatErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const onFilterChange = () => {
  loadList()
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = files.value.map(f => f.id)
  }
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) { return '0 B' }
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDateTime = (iso: string): string => {
  if (!iso) { return '-' }
  try {
    const d = new Date(iso)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  } catch {
    return iso
  }
}

const onDownload = async (file: CompanyFile) => {
  try {
    await companyFileService.download(file.id, file.fileNm)
  } catch (err) {
    showApiError(err, { title: '다운로드 실패' })
  }
}

const openUploadModal = () => {
  uploadModalOpen.value = true
}

const onUploaded = () => {
  uploadModalOpen.value = false
  loadList()
}

const openEmailModal = () => {
  if (selectedIds.value.length === 0) { return }
  emailModalOpen.value = true
}

const onEmailSent = () => {
  emailModalOpen.value = false
  selectedIds.value = []
}

const openEditModal = (file: CompanyFile) => {
  editingFile.value = file
  editDescription.value = file.description || ''
  editModalOpen.value = true
}

const closeEditModal = () => {
  if (updating.value) { return }
  editModalOpen.value = false
  editingFile.value = null
  editDescription.value = ''
}

const onUpdate = async () => {
  if (!editingFile.value) { return }
  updating.value = true
  try {
    await companyFileService.update(editingFile.value.id, editDescription.value.trim())
    closeEditModal()
    await loadList()
  } catch (err) {
    showApiError(err, { title: '수정 실패' })
  } finally {
    updating.value = false
  }
}

const onDelete = async (file: CompanyFile) => {
  if (!confirm(`"${file.fileNm}" 파일을 삭제하시겠습니까?\n(소프트 삭제되며, 이력은 유지됩니다)`)) {
    return
  }
  try {
    await companyFileService.softDelete(file.id)
    await loadList()
  } catch (err) {
    showApiError(err, { title: '삭제 실패' })
  }
}

// ========================================
// Lifecycle
// ========================================
onMounted(async () => {
  await loadCategories()
  await loadList()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

.company-files-page {
  padding: 1rem 1.25rem;
}

.info-banner {
  margin: 0.75rem 0 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-banner .btn-link {
  margin-left: auto;
  color: #1d4ed8;
  text-decoration: underline;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.filter-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.875rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.filter-input {
  padding: 0.375rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 180px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  user-select: none;
}

.filter-spacer {
  flex: 1;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

/* td는 table-cell로 두고 아이콘만 인라인 정렬 */
.file-name-cell { color: #1f2937; }
.file-name-cell i { margin-right: 0.375rem; color: #6b7280; }

.description-cell {
  color: #4b5563;
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

/* 등록일은 한 줄로 표시되도록 */
.datetime-cell { white-space: nowrap; }

/* td 자체에 display:flex를 주면 행 정렬이 깨지므로 inline-block + 마진으로 처리 */
.actions-cell {
  text-align: center;
  white-space: nowrap;
}
.actions-cell .btn-icon {
  margin: 0 2px;
  vertical-align: middle;
}

.btn-icon {
  background: none;
  border: 1px solid #e5e7eb;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.btn-icon-blue { color: #2563eb; }
.btn-icon-blue:hover { background: #eff6ff; }
.btn-icon-gray { color: #4b5563; }
.btn-icon-gray:hover { background: #f3f4f6; }
.btn-icon-red { color: #dc2626; }
.btn-icon-red:hover { background: #fef2f2; }

.version-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-current {
  background: #dcfce7;
  color: #166534;
}

.badge-old {
  background: #f3f4f6;
  color: #6b7280;
}

.empty-row {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.error-text {
  color: #dc2626;
}

/* 수정 모달 */
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

.modal-container.small { max-width: 480px; }

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
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.form-group { margin-bottom: 1rem; }

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
