<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header danger">
        <h3>
          <i class="fas fa-exclamation-triangle" />
          납품완료 전체 초기화
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

        <div class="danger-box">
          <p class="danger-title">
            <i class="fas fa-exclamation-circle" />
            모든 서명·PDF가 삭제됩니다
          </p>
          <ul class="danger-list">
            <li>Stage 1·Stage 2 디지털 서명 6개 모두 삭제</li>
            <li>납품확인서·납품완료계·사진대지 PDF 3종 삭제 (디스크 파일은 _backup 폴더로 이동)</li>
            <li>스캔본 PDF 2종(있을 경우)도 삭제</li>
            <li>수동 완료 플래그 해제</li>
            <li>상태가 <strong>{{ expectedStatus }}</strong> 로 되돌아갑니다 (납품률 100% 이면 PENDING_SIGNATURE)</li>
            <li>발주·자금관리 상태도 함께 동기화됩니다</li>
            <li class="ok">
              사진 선택은 보존됩니다. 사진을 바꾸려면 사진 선택 화면에서 변경 후 진행하세요.
            </li>
          </ul>
        </div>

        <div class="confirm-input">
          <label>계속 진행하려면 아래에 <strong>초기화</strong> 라고 입력하세요</label>
          <input
            v-model="confirmText"
            type="text"
            class="form-input"
            placeholder="초기화"
            :disabled="processing"
          >
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" :disabled="processing" @click="$emit('close')">
          취소
        </button>
        <button
          class="btn-danger"
          :disabled="!canConfirm || processing"
          @click="handleConfirm"
        >
          <i class="fas" :class="processing ? 'fa-spinner fa-spin' : 'fa-undo'" />
          {{ processing ? '초기화 중...' : '초기화 진행' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { resetDeliveryDone } from '~/services/delivery-done.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
  reset: []
}>()

const processing = ref(false)
const confirmText = ref('')

const canConfirm = computed(() => confirmText.value.trim() === '초기화')

const expectedStatus = computed(() => {
  return (props.deliveryDone.deliveryCompletionRate ?? 0) >= 100
    ? 'PENDING_SIGNATURE (서명대기)'
    : 'IN_PROGRESS (진행중)'
})

async function handleConfirm () {
  if (!canConfirm.value) { return }
  processing.value = true
  try {
    await resetDeliveryDone(props.deliveryDone.deliveryDoneId)
    alert('초기화되었습니다. 다시 서명을 진행해주세요.')
    emit('reset')
  } catch (error: any) {
    console.error('초기화 실패:', error)
    alert(error?.message || '초기화 중 오류가 발생했습니다.')
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
.modal-header.danger { background: #fef2f2; border-bottom-color: #fecaca; }
.modal-header h3 {
  margin: 0; font-size: 18px; color: #991b1b;
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
.danger-box {
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;
  padding: 14px; margin-bottom: 16px;
}
.danger-title {
  margin: 0 0 10px 0; color: #991b1b; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
}
.danger-list { margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 13px; line-height: 1.7; }
.danger-list li { margin-bottom: 4px; }
.danger-list li.ok { color: #065f46; }
.confirm-input { margin-top: 12px; }
.confirm-input label { display: block; font-size: 13px; color: #374151; margin-bottom: 6px; }
.form-input {
  width: 100%; padding: 10px;
  border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;
}
.form-input:focus {
  outline: none; border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}
.modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 20px; border-top: 1px solid #e5e7eb;
}
.btn-cancel, .btn-danger {
  padding: 10px 20px; border: none; border-radius: 6px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}
.btn-cancel { background: #f3f4f6; color: #6b7280; }
.btn-cancel:hover:not(:disabled) { background: #e5e7eb; }
.btn-danger { background: #dc2626; color: white; }
.btn-danger:hover:not(:disabled) { background: #b91c1c; }
.btn-danger:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
