<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-file-pdf" />
          스캔본 PDF 업로드
        </h3>
        <button class="btn-close" :disabled="uploading" @click="$emit('close')">
          <i class="fas fa-times" />
        </button>
      </div>

      <div class="modal-body">
        <div class="info-section">
          <div class="info-row">
            <label>납품요구번호:</label>
            <span>{{ deliveryDone.deliveryRequestNo }}</span>
          </div>
          <div class="info-row">
            <label>수요기관:</label>
            <span>{{ deliveryDone.client }}</span>
          </div>
        </div>

        <div class="notice">
          <i class="fas fa-info-circle" />
          종이 서명본을 PDF로 스캔하여 업로드하세요. 두 종류를 동시에 올리거나, 한 종류만 올려도 됩니다. 업로드된 스캔본은 PDF 다운로드 시 시스템 생성본보다 우선 제공됩니다.
        </div>

        <!-- 납품확인서 -->
        <div class="upload-section">
          <div class="section-title">
            <span class="title-no">①</span>
            <span class="title-text">납품확인서</span>
            <span v-if="hasConfirmationScan" class="badge-uploaded">업로드됨</span>
          </div>
          <div
            class="dropzone"
            :class="{ 'dropzone-active': dragOver.confirmation, 'dropzone-disabled': uploading }"
            @click="triggerFileSelect('confirmation')"
            @dragover.prevent="dragOver.confirmation = true"
            @dragleave.prevent="dragOver.confirmation = false"
            @drop.prevent="onDrop($event, 'confirmation')"
          >
            <input
              ref="confirmationInputRef"
              type="file"
              accept="application/pdf,.pdf"
              class="hidden-input"
              :disabled="uploading"
              @change="onFileChange($event, 'confirmation')"
            >
            <div v-if="!files.confirmation" class="dropzone-empty">
              <i class="fas fa-cloud-upload-alt" />
              <p>PDF 파일을 끌어다 놓거나 클릭하여 선택</p>
              <small>최대 20MB · PDF 형식만 허용</small>
            </div>
            <div v-else class="dropzone-file">
              <i class="fas fa-file-pdf" />
              <div class="file-info">
                <p class="file-name">{{ files.confirmation.name }}</p>
                <small>{{ formatSize(files.confirmation.size) }}</small>
              </div>
              <button class="btn-remove" :disabled="uploading" @click.stop="clearFile('confirmation')">
                <i class="fas fa-times" />
              </button>
            </div>
          </div>
        </div>

        <!-- 납품완료계 -->
        <div class="upload-section">
          <div class="section-title">
            <span class="title-no">②</span>
            <span class="title-text">납품완료계</span>
            <span v-if="hasCompletionScan" class="badge-uploaded">업로드됨</span>
          </div>
          <div
            class="dropzone"
            :class="{ 'dropzone-active': dragOver.completion, 'dropzone-disabled': uploading }"
            @click="triggerFileSelect('completion')"
            @dragover.prevent="dragOver.completion = true"
            @dragleave.prevent="dragOver.completion = false"
            @drop.prevent="onDrop($event, 'completion')"
          >
            <input
              ref="completionInputRef"
              type="file"
              accept="application/pdf,.pdf"
              class="hidden-input"
              :disabled="uploading"
              @change="onFileChange($event, 'completion')"
            >
            <div v-if="!files.completion" class="dropzone-empty">
              <i class="fas fa-cloud-upload-alt" />
              <p>PDF 파일을 끌어다 놓거나 클릭하여 선택</p>
              <small>최대 20MB · PDF 형식만 허용</small>
            </div>
            <div v-else class="dropzone-file">
              <i class="fas fa-file-pdf" />
              <div class="file-info">
                <p class="file-name">{{ files.completion.name }}</p>
                <small>{{ formatSize(files.completion.size) }}</small>
              </div>
              <button class="btn-remove" :disabled="uploading" @click.stop="clearFile('completion')">
                <i class="fas fa-times" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" :disabled="uploading" @click="$emit('close')">
          취소
        </button>
        <button
          class="btn-primary"
          :disabled="!hasAnyFile || uploading"
          @click="handleUpload"
        >
          <i class="fas" :class="uploading ? 'fa-spinner fa-spin' : 'fa-upload'" />
          {{ uploadButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { uploadScanPdf } from '~/services/delivery-done.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'

type DocType = 'confirmation' | 'completion'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
  uploaded: []
}>()

const files = reactive<Record<DocType, File | null>>({
  confirmation: null,
  completion: null
})
const dragOver = reactive<Record<DocType, boolean>>({
  confirmation: false,
  completion: false
})
const confirmationInputRef = ref<HTMLInputElement | null>(null)
const completionInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const hasConfirmationScan = computed(() => !!props.deliveryDone.confirmationPdfScanPath)
const hasCompletionScan = computed(() => !!props.deliveryDone.completionPdfScanPath)

const hasAnyFile = computed(() => !!files.confirmation || !!files.completion)
const selectedCount = computed(() => (files.confirmation ? 1 : 0) + (files.completion ? 1 : 0))
const uploadButtonLabel = computed(() => {
  if (uploading.value) { return '업로드 중...' }
  if (selectedCount.value === 0) { return '업로드' }
  return `${selectedCount.value}건 업로드`
})

function inputRefOf (type: DocType): HTMLInputElement | null {
  return type === 'confirmation' ? confirmationInputRef.value : completionInputRef.value
}

function triggerFileSelect (type: DocType) {
  if (uploading.value) { return }
  inputRefOf(type)?.click()
}

function onFileChange (event: Event, type: DocType) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0], type)
  }
}

function onDrop (event: DragEvent, type: DocType) {
  dragOver[type] = false
  if (uploading.value) { return }
  const dropped = event.dataTransfer?.files
  if (dropped && dropped.length > 0) {
    validateAndSetFile(dropped[0], type)
  }
}

function validateAndSetFile (file: File, type: DocType) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    alert('PDF 파일만 업로드 가능합니다.')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    alert('파일 크기는 20MB를 초과할 수 없습니다.')
    return
  }
  files[type] = file
}

function clearFile (type: DocType) {
  files[type] = null
  const inp = inputRefOf(type)
  if (inp) { inp.value = '' }
}

function formatSize (bytes: number): string {
  if (bytes < 1024) { return bytes + ' B' }
  if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + ' KB' }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function labelOf (type: DocType): string {
  return type === 'confirmation' ? '납품확인서' : '납품완료계'
}

async function handleUpload () {
  if (!hasAnyFile.value) { return }
  uploading.value = true

  const targets: DocType[] = []
  if (files.confirmation) { targets.push('confirmation') }
  if (files.completion) { targets.push('completion') }

  const results = await Promise.all(targets.map(async (type) => {
    try {
      await uploadScanPdf(props.deliveryDone.deliveryDoneId, type, files[type] as File)
      return { type, ok: true as const }
    } catch (error: any) {
      return { type, ok: false as const, error }
    }
  }))

  uploading.value = false

  const succeeded = results.filter(r => r.ok)
  const failed = results.filter(r => !r.ok)

  // 성공한 종류 dropzone 비우기
  succeeded.forEach(r => clearFile(r.type))

  if (failed.length === 0) {
    alert(`스캔본 ${succeeded.length}종이 업로드되었습니다.`)
    emit('uploaded')
    return
  }

  const lines: string[] = []
  succeeded.forEach(r => lines.push(`✓ ${labelOf(r.type)}: 성공`))
  failed.forEach((r: any) => lines.push(`✗ ${labelOf(r.type)}: ${r.error?.message || '업로드 실패'}`))
  alert(`일부 업로드 결과:\n${lines.join('\n')}`)

  // 부분 성공이라도 부모 갱신 트리거 (성공한 종류의 뱃지 갱신용)
  if (succeeded.length > 0) {
    emit('uploaded')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal-container {
  background: white; border-radius: 8px;
  width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px; border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0; font-size: 18px; color: #1f2937;
  display: flex; align-items: center; gap: 10px;
}
.btn-close { background: none; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; padding: 5px; }
.btn-close:hover { color: #374151; }
.modal-body { padding: 20px; }
.info-section { background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 16px; }
.info-row { display: flex; margin-bottom: 8px; }
.info-row:last-child { margin-bottom: 0; }
.info-row label { font-weight: 600; width: 120px; color: #6b7280; }
.info-row span { color: #1f2937; }

.notice {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;
  padding: 10px; color: #1e40af; font-size: 13px;
  display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px;
}
.notice i { margin-top: 2px; }

.upload-section { margin-bottom: 16px; }
.upload-section:last-of-type { margin-bottom: 0; }
.section-title {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; font-size: 14px; color: #1f2937;
}
.title-no { font-weight: 700; color: #2563eb; }
.title-text { font-weight: 600; }
.badge-uploaded {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: #16a34a; color: white; margin-left: auto;
}

.dropzone {
  border: 2px dashed #d1d5db; border-radius: 8px;
  padding: 24px; text-align: center; cursor: pointer;
  transition: all 0.2s;
}
.dropzone:hover { border-color: #2563eb; background: #f9fafb; }
.dropzone-active { border-color: #2563eb; background: #eff6ff; }
.dropzone-disabled { opacity: 0.6; cursor: not-allowed; }
.hidden-input { display: none; }
.dropzone-empty i {
  font-size: 32px; color: #9ca3af; margin-bottom: 8px;
}
.dropzone-empty p { margin: 0 0 4px 0; color: #374151; font-weight: 500; font-size: 13px; }
.dropzone-empty small { color: #9ca3af; font-size: 12px; }
.dropzone-file {
  display: flex; align-items: center; gap: 12px; text-align: left;
}
.dropzone-file > i:first-child {
  font-size: 28px; color: #dc2626;
}
.file-info { flex: 1; min-width: 0; }
.file-name {
  margin: 0; color: #1f2937; font-weight: 600; word-break: break-all; font-size: 13px;
}
.file-info small { color: #6b7280; font-size: 12px; }
.btn-remove {
  background: none; border: none; color: #9ca3af; cursor: pointer;
  font-size: 18px; padding: 5px;
}
.btn-remove:hover:not(:disabled) { color: #dc2626; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 20px; border-top: 1px solid #e5e7eb;
}
.btn-cancel, .btn-primary {
  padding: 10px 20px; border: none; border-radius: 6px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}
.btn-cancel { background: #f3f4f6; color: #6b7280; }
.btn-cancel:hover:not(:disabled) { background: #e5e7eb; }
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
