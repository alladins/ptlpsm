<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-check-circle" />
          수동 완료 처리
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
            <label>시공사:</label>
            <span>{{ deliveryDone.contractorCompanyName }}</span>
          </div>
        </div>

        <div class="warning-box">
          <i class="fas fa-exclamation-triangle" />
          <div>
            <p class="warning-title">
              디지털 서명 없이 PDF를 생성합니다
            </p>
            <ul class="warning-list">
              <li>현장에서 종이로 서명을 받은 경우에 사용합니다.</li>
              <li>납품확인서·납품완료계·사진대지 PDF 3종이 생성됩니다.</li>
              <li>PDF의 서명 영역은 빈칸으로 출력됩니다.</li>
              <li>상태가 <strong>완료(COMPLETED)</strong> 로 전환됩니다.</li>
              <li>발주·자금관리 상태도 함께 동기화됩니다.</li>
              <li>나중에 종이 서명본을 스캔하여 업로드할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" :disabled="processing" @click="$emit('close')">
          취소
        </button>
        <button class="btn-primary" :disabled="processing" @click="handleConfirm">
          <i class="fas" :class="processing ? 'fa-spinner fa-spin' : 'fa-check'" />
          {{ processing ? '처리 중...' : '수동 완료 처리' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { completeManually } from '~/services/delivery-done.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
  completed: []
}>()

const processing = ref(false)

async function handleConfirm () {
  processing.value = true
  try {
    await completeManually(props.deliveryDone.deliveryDoneId)
    alert('수동 완료 처리되었습니다. PDF 3종이 생성되었습니다.')
    emit('completed')
  } catch (error: any) {
    console.error('수동 완료 처리 실패:', error)
    alert(error?.message || '수동 완료 처리 중 오류가 발생했습니다.')
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-container {
  background: white; border-radius: 8px;
  width: 90%; max-width: 540px; max-height: 90vh; overflow-y: auto;
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
.warning-box {
  display: flex; gap: 12px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;
  padding: 14px;
}
.warning-box > i {
  color: #d97706; font-size: 22px; margin-top: 2px;
}
.warning-title { font-weight: 600; color: #92400e; margin: 0 0 8px 0; }
.warning-list { margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.7; }
.warning-list li { margin-bottom: 4px; }
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
.btn-primary { background: #16a34a; color: white; }
.btn-primary:hover:not(:disabled) { background: #15803d; }
.btn-primary:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
