<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-clock-rotate-left" />
            {{ categoryNm || '파일' }} 이력
          </h3>
          <button type="button" class="modal-close" @click="close">
            <i class="fas fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="history-loading">
            <i class="fas fa-spinner fa-spin" /> 불러오는 중...
          </div>
          <div v-else-if="errorMsg" class="history-error">
            <i class="fas fa-exclamation-circle" /> {{ errorMsg }}
          </div>
          <div v-else-if="history.length === 0" class="history-empty">
            이력이 없습니다.
          </div>
          <table v-else class="history-table">
            <thead>
              <tr>
                <th style="width: 80px" class="text-center">
                  버전
                </th>
                <th>파일명</th>
                <th style="width: 100px" class="text-right">
                  크기
                </th>
                <th style="width: 140px" class="text-center">
                  등록일
                </th>
                <th style="width: 100px" class="text-center">
                  등록자
                </th>
                <th>설명</th>
                <th style="width: 80px" class="text-center">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="file in history"
                :key="file.id"
                :class="{ 'row-current': file.isCurrent === 'Y' }"
              >
                <td class="text-center">
                  <span
                    class="version-badge"
                    :class="file.isCurrent === 'Y' ? 'badge-current' : 'badge-old'"
                  >
                    v{{ file.versionNo }}
                  </span>
                  <span v-if="file.isCurrent === 'Y'" class="current-tag">현재</span>
                </td>
                <td class="file-name-cell">
                  <i class="fas fa-paperclip" />
                  {{ file.fileNm }}
                </td>
                <td class="text-right">
                  {{ formatFileSize(file.fileSize) }}
                </td>
                <td class="text-center">
                  {{ formatDateTime(file.createdAt) }}
                </td>
                <td class="text-center">
                  {{ file.createdBy }}
                </td>
                <td class="description-cell">
                  {{ file.description || '-' }}
                </td>
                <td class="text-center">
                  <button class="btn-icon btn-icon-blue" title="다운로드" @click="onDownload(file)">
                    <i class="fas fa-download" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="close">
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { companyFileService, type CompanyFile } from '~/services/company-file.service'
import { useApiError } from '~/utils/api-error'

const props = defineProps<{
  isOpen: boolean
  categoryCd: string
  categoryNm: string
}>()

const emit = defineEmits<{
  close: []
}>()

const history = ref<CompanyFile[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const { showApiError, formatErrorMessage } = useApiError()

const close = () => {
  emit('close')
}

const loadHistory = async () => {
  if (!props.categoryCd) { return }
  loading.value = true
  errorMsg.value = null
  try {
    history.value = await companyFileService.history(props.categoryCd)
  } catch (err) {
    errorMsg.value = formatErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const onDownload = async (file: CompanyFile) => {
  try {
    await companyFileService.download(file.id)
  } catch (err) {
    showApiError(err, { title: '다운로드 실패' })
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

// 모달이 열릴 때마다 이력 재조회
watch(
  () => props.isOpen,
  (open) => {
    if (open) { loadHistory() } else { history.value = [] }
  }
)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-container {
  background: #fff; border-radius: 12px;
  width: 90%; max-width: 900px;
  max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.modal-header h3 i { color: #6366f1; }
.modal-close { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.1rem; padding: 4px 8px; }
.modal-close:hover { color: #1f2937; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex; justify-content: flex-end;
}

.history-loading, .history-error, .history-empty {
  padding: 40px; text-align: center; color: #6b7280;
}
.history-error { color: #dc2626; }

.history-table { width: 100%; border-collapse: collapse; }
.history-table th {
  background: #f9fafb; padding: 10px 12px; font-weight: 600;
  color: #374151; font-size: 0.875rem; border-bottom: 2px solid #e5e7eb;
}
.history-table td {
  padding: 10px 12px; border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem; color: #1f2937;
}
.history-table tr.row-current { background: #f0fdf4; }
.history-table tr:hover:not(.row-current) { background: #f9fafb; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.file-name-cell i { color: #6b7280; margin-right: 6px; }
.description-cell { color: #6b7280; font-size: 0.8125rem; }

.version-badge {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: 0.75rem; font-weight: 600;
}
.badge-current { background: #d1fae5; color: #065f46; }
.badge-old { background: #e5e7eb; color: #6b7280; }
.current-tag {
  margin-left: 6px; font-size: 0.7rem; color: #065f46; font-weight: 600;
}
</style>
