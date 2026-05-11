<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-sliders-h" />
            회사 파일 카테고리 관리
          </h3>
          <button type="button" class="modal-close" @click="close">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div class="info-note">
            <i class="fas fa-info-circle" />
            <span>카테고리 항목을 관리합니다. 삭제 대신 '사용 여부'로 비활성화를 권장합니다.</span>
          </div>

          <!-- 등록/수정 폼 (compact) -->
          <div class="edit-form" :class="{ 'edit-mode': formMode === 'edit' }">
            <div class="edit-form-title">
              <i :class="formMode === 'create' ? 'fas fa-plus-circle' : 'fas fa-edit'" />
              {{ formMode === 'create' ? '새 카테고리 등록' : `카테고리 수정: ${form.code}` }}
            </div>
            <div class="cf-form-row">
              <div class="form-group" style="flex: 1.2;">
                <label class="form-label required">코드</label>
                <input
                  v-model="form.code"
                  :disabled="formMode === 'edit'"
                  class="form-input"
                  placeholder="예: QUALITY_CERT"
                  maxlength="50"
                >
              </div>
              <div class="form-group" style="flex: 1.5;">
                <label class="form-label required">카테고리명</label>
                <input
                  v-model="form.codeName"
                  class="form-input"
                  placeholder="예: 품질인증서"
                  maxlength="100"
                >
              </div>
              <div class="form-group" style="width: 80px; flex: none;">
                <label class="form-label">순서</label>
                <input
                  v-model.number="form.sortOrder"
                  type="number"
                  min="0"
                  class="form-input"
                >
              </div>
              <div class="form-group" style="width: 90px; flex: none;">
                <label class="form-label">사용</label>
                <select v-model="form.useYn" class="form-input">
                  <option value="Y">
                    사용
                  </option>
                  <option value="N">
                    미사용
                  </option>
                </select>
              </div>
            </div>
            <div class="cf-form-row">
              <div class="form-group" style="flex: 1;">
                <input
                  v-model="form.description"
                  class="form-input"
                  placeholder="설명 (선택 입력)"
                  maxlength="500"
                >
              </div>
              <div class="form-actions">
                <button v-if="formMode === 'edit'" class="btn-secondary btn-sm" @click="resetForm">
                  취소
                </button>
                <button class="btn-primary btn-sm" :disabled="saving" @click="onSave">
                  <i v-if="saving" class="fas fa-spinner fa-spin" />
                  <i v-else :class="formMode === 'create' ? 'fas fa-plus' : 'fas fa-save'" />
                  {{ formMode === 'create' ? '등록' : '저장' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 목록 -->
          <div v-if="loading" class="state-box">
            <i class="fas fa-spinner fa-spin" /> 불러오는 중...
          </div>
          <div v-else-if="errorMsg" class="state-box state-error">
            <i class="fas fa-exclamation-circle" /> {{ errorMsg }}
          </div>
          <table v-else class="cat-table">
            <thead>
              <tr>
                <th style="width: 140px">
                  코드
                </th>
                <th>카테고리명</th>
                <th style="width: 90px" class="text-center">
                  정렬순서
                </th>
                <th style="width: 80px" class="text-center">
                  사용여부
                </th>
                <th style="width: 110px" class="text-center">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in sortedDetails" :key="item.code">
                <td>
                  <code class="code-chip">{{ item.code }}</code>
                </td>
                <td>{{ item.codeName }}</td>
                <td class="text-center">
                  {{ item.sortOrder }}
                </td>
                <td class="text-center">
                  <span
                    class="status-badge"
                    :class="item.useYn === 'Y' ? 'status-active' : 'status-inactive'"
                  >
                    {{ item.useYn === 'Y' ? '사용' : '미사용' }}
                  </span>
                </td>
                <td class="text-center actions-cell">
                  <button class="btn-icon btn-icon-gray" title="수정" @click="openEdit(item)">
                    <i class="fas fa-pen" />
                  </button>
                  <button
                    v-if="!isInUse(item.code)"
                    class="btn-icon btn-icon-red"
                    title="삭제"
                    @click="onDelete(item)"
                  >
                    <i class="fas fa-trash" />
                  </button>
                  <span
                    v-else
                    class="usage-tag"
                    :title="`이 카테고리를 사용하는 파일이 ${usageCount(item.code)}건 있어 삭제 불가`"
                  >
                    사용중 {{ usageCount(item.code) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!loading && details.length === 0">
                <td colspan="5" class="empty-row">
                  등록된 카테고리가 없습니다.
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
import { ref, computed, watch } from 'vue'
import { codeService, type CodeDetail } from '~/services/code.service'
import { companyFileService } from '~/services/company-file.service'
import { useApiError } from '~/utils/api-error'

const GROUP_CODE = 'COMPANY_FILE_CATEGORY'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{
  close: []
  changed: [] // 카테고리 변경 시 부모에게 알림
}>()

const details = ref<CodeDetail[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const saving = ref(false)

// 카테고리별 현재(deleted_yn='N') 파일 사용 건수
const usageMap = ref<Record<string, number>>({})
const isInUse = (categoryCd: string): boolean => (usageMap.value[categoryCd] ?? 0) > 0
const usageCount = (categoryCd: string): number => usageMap.value[categoryCd] ?? 0

const formMode = ref<'create' | 'edit'>('create')
const form = ref({
  code: '',
  codeName: '',
  sortOrder: 0,
  useYn: 'Y' as 'Y' | 'N',
  description: ''
})

const { showApiError } = useApiError()

const sortedDetails = computed(() =>
  [...details.value].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
)

const nextSortOrder = computed(() => {
  const max = details.value.reduce((m, d) => Math.max(m, d.sortOrder ?? 0), 0)
  return max + 1
})

const close = () => emit('close')

const loadDetails = async () => {
  loading.value = true
  errorMsg.value = null
  try {
    // 카테고리 + 사용 현황 병렬 로드
    const [list, files] = await Promise.all([
      codeService.getCodeDetails(GROUP_CODE),
      companyFileService.listCurrent()
    ])
    details.value = list
    // 사용 카운트 집계 (deleted_yn='N'인 파일만 고려)
    const map: Record<string, number> = {}
    for (const f of files) {
      map[f.categoryCd] = (map[f.categoryCd] ?? 0) + 1
    }
    usageMap.value = map
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '불러오기 실패'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formMode.value = 'create'
  form.value = {
    code: '',
    codeName: '',
    sortOrder: nextSortOrder.value,
    useYn: 'Y',
    description: ''
  }
}

const openEdit = (item: CodeDetail) => {
  formMode.value = 'edit'
  form.value = {
    code: item.code,
    codeName: item.codeName,
    sortOrder: item.sortOrder ?? 0,
    useYn: item.useYn,
    description: item.description ?? ''
  }
}

const validate = (): string | null => {
  if (!form.value.code.trim()) { return '코드는 필수입니다.' }
  if (!/^[A-Za-z0-9_]+$/.test(form.value.code)) { return '코드는 영문/숫자/언더스코어만 사용 가능합니다.' }
  if (!form.value.codeName.trim()) { return '카테고리명은 필수입니다.' }
  return null
}

const onSave = async () => {
  const validationError = validate()
  if (validationError) {
    window.alert(validationError)
    return
  }
  saving.value = true
  try {
    if (formMode.value === 'create') {
      await codeService.createCodeDetail({
        groupCode: GROUP_CODE,
        code: form.value.code.trim(),
        codeName: form.value.codeName.trim(),
        description: form.value.description.trim() || undefined,
        useYn: form.value.useYn,
        sortOrder: form.value.sortOrder ?? 0
      })
    } else {
      await codeService.updateCodeDetail(GROUP_CODE, form.value.code, {
        groupCode: GROUP_CODE,
        code: form.value.code,
        codeName: form.value.codeName.trim(),
        description: form.value.description.trim() || undefined,
        useYn: form.value.useYn,
        sortOrder: form.value.sortOrder ?? 0
      })
    }
    await loadDetails()
    resetForm()
    emit('changed')
  } catch (err) {
    showApiError(err, { title: '저장 실패' })
  } finally {
    saving.value = false
  }
}

const onDelete = async (item: CodeDetail) => {
  // 삭제 직전 사용 현황 재확인 (race condition 대비)
  const inUseCount = usageCount(item.code)
  if (inUseCount > 0) {
    window.alert(
      `"${item.codeName}" 카테고리는 사용 중인 파일이 ${inUseCount}건 있어 삭제할 수 없습니다.\n` +
      '먼저 해당 카테고리의 파일을 모두 삭제하거나, "사용여부"를 미사용으로 변경해주세요.'
    )
    return
  }
  if (!confirm(`"${item.codeName}" 카테고리를 삭제하시겠습니까?`)) {
    return
  }
  try {
    await codeService.deleteCodeDetail(GROUP_CODE, item.code)
    await loadDetails()
    emit('changed')
  } catch (err) {
    showApiError(err, { title: '삭제 실패' })
  }
}

// 모달 열릴 때 로드 + 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadDetails().then(() => resetForm())
    } else {
      details.value = []
    }
  }
)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
}
.modal-container {
  background: #fff; border-radius: 12px;
  width: 90%; max-width: 920px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-header {
  padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}
.modal-header h3 {
  margin: 0; font-size: 1.1rem; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
}
.modal-header h3 i { color: #6366f1; }
.modal-close { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.1rem; padding: 4px 8px; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.modal-footer { padding: 12px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; }

.info-note {
  display: flex; gap: 8px; align-items: center;
  padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 6px; color: #1e40af; font-size: 0.8rem; margin-bottom: 12px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.info-note i { color: #3b82f6; flex-shrink: 0; }
.info-note span { overflow: hidden; text-overflow: ellipsis; }

.state-box { padding: 40px; text-align: center; color: #6b7280; }
.state-box.state-error { color: #dc2626; }

.cat-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.cat-table th {
  background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 600;
  color: #374151; font-size: 0.875rem; border-bottom: 2px solid #e5e7eb;
}
.cat-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 0.875rem; color: #1f2937; }
.cat-table tr:hover { background: #f9fafb; }
.text-center { text-align: center; }
.actions-cell { white-space: nowrap; }
.actions-cell .btn-icon { margin: 0 4px; }
.usage-tag {
  display: inline-block; margin-left: 8px; padding: 2px 8px;
  background: #fef3c7; color: #92400e; border-radius: 10px;
  font-size: 0.7rem; font-weight: 600; cursor: help;
}

.code-chip {
  display: inline-block; padding: 2px 8px; background: #eff6ff; color: #1e40af;
  border-radius: 4px; font-size: 0.75rem; font-family: 'Consolas', monospace;
}

.status-badge {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 0.75rem; font-weight: 600;
}
.status-active { background: #d1fae5; color: #065f46; }
.status-inactive { background: #e5e7eb; color: #6b7280; }

.empty-row { padding: 32px; text-align: center; color: #9ca3af; }

/* 등록/수정 폼 (컴팩트) */
.edit-form {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
}
.edit-form.edit-mode {
  background: #fffbeb;
  border-color: #fde68a;
}
.edit-form-title {
  font-size: 0.825rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.edit-form-title i { color: #6366f1; }
.edit-form.edit-mode .edit-form-title i { color: #d97706; }

/* 폼 행 (외부 .form-row CSS와 충돌 회피 위해 별도 클래스) */
.cf-form-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.cf-form-row + .cf-form-row { margin-top: 8px; }
.form-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 3px;
  font-weight: 500;
}
.form-label.required::after { content: ' *'; color: #dc2626; }
.form-input {
  width: 100%;
  padding: 6px 8px;
  font-size: 0.85rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  height: 32px;
  box-sizing: border-box;
}
.form-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15); }
.form-input:disabled { background: #f3f4f6; color: #6b7280; }

.form-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 0.825rem;
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}
.btn-sm.btn-primary { background: #2563eb; color: #fff; }
.btn-sm.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-sm.btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
.btn-sm.btn-secondary { background: #fff; color: #4b5563; border-color: #d1d5db; }
.btn-sm.btn-secondary:hover { background: #f9fafb; }
</style>
