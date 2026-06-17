<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header info">
        <h3>
          <i class="fas fa-file-pdf" />
          PDF 재발행 (서명 보존)
        </h3>
        <button class="btn-close" :disabled="processing" @click="$emit('close')">
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
          <div class="info-row">
            <label>현재 상태:</label>
            <span class="status-badge">{{ deliveryDone.status }}</span>
          </div>
        </div>

        <div class="notice-box">
          <p class="notice-title">
            <i class="fas fa-info-circle" />
            PDF 3종만 새 데이터로 다시 만듭니다
          </p>
          <ul class="notice-list">
            <li class="ok">디지털 서명 6개 모두 <strong>보존</strong></li>
            <li class="ok">스캔본 PDF 2종 <strong>보존</strong></li>
            <li class="ok">상태·수동완료 플래그·금액 컬럼 <strong>보존</strong></li>
            <li class="warn">납품확인서·납품완료계·사진대지 PDF 3종은 새 데이터로 재생성 (기존 PDF는 _backup 폴더로 이동)</li>
            <li class="warn">본사 정보(회사명·주소·대표자·직인 등)가 변경된 경우 즉시 반영됩니다</li>
          </ul>
        </div>

        <div class="confirm-input">
          <label>계속 진행하려면 아래에 <strong>PDF 재발행</strong> 라고 입력하세요</label>
          <input
            v-model="confirmText"
            type="text"
            class="form-input"
            placeholder="PDF 재발행"
            :disabled="processing"
          >
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" :disabled="processing" @click="$emit('close')">
          취소
        </button>
        <button
          class="btn-primary"
          :disabled="!canConfirm || processing"
          @click="handleConfirm"
        >
          <i class="fas" :class="processing ? 'fa-spinner fa-spin' : 'fa-redo'" />
          {{ processing ? '재발행 중...' : 'PDF 재발행' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { regenerateDeliveryDonePdfs } from '~/services/delivery-done.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
  regenerated: []
}>()

const processing = ref(false)
const confirmText = ref('')

const canConfirm = computed(() => confirmText.value.trim() === 'PDF 재발행')

async function handleConfirm () {
  if (!canConfirm.value) { return }
  processing.value = true
  try {
    await regenerateDeliveryDonePdfs(props.deliveryDone.deliveryDoneId)
    alert('PDF 3종이 새 데이터로 재발행되었습니다.')
    emit('regenerated')
  } catch (error: any) {
    console.error('PDF 재발행 실패:', error)
    alert(error?.message || 'PDF 재발행 중 오류가 발생했습니다.')
  } finally {
    processing.value = false
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
  width: 90%; max-width: 560px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px; border-bottom: 1px solid #e5e7eb;
}
.modal-header.info { background: #eff6ff; border-bottom-color: #bfdbfe; }
.modal-header h3 {
  margin: 0; font-size: 18px; color: #1e40af;
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
.status-badge {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600;
}
.notice-box {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;
  padding: 14px; margin-bottom: 16px;
}
.notice-title {
  margin: 0 0 10px 0; color: #1e40af; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
}
.notice-list { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; }
.notice-list li { margin-bottom: 4px; }
.notice-list li.ok { color: #065f46; }
.notice-list li.warn { color: #92400e; }
.confirm-input { margin-top: 12px; }
.confirm-input label { display: block; font-size: 13px; color: #374151; margin-bottom: 6px; }
.form-input {
  width: 100%; padding: 10px;
  border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;
}
.form-input:focus {
  outline: none; border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
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
