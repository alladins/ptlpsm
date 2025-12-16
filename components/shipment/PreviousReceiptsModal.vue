<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>이전 인수증 목록</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <template v-else>
          <!-- 인수증 목록 -->
          <div v-if="receipts.length > 0" class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>생성일시</th>
                  <th>무효화 사유</th>
                  <th class="text-center">다운로드</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="receipt in receipts" :key="receipt.receiptId">
                  <td>{{ formatDateTime(receipt.createdAt) }}</td>
                  <td>{{ receipt.invalidationReason || '초기 서명' }}</td>
                  <td class="text-center">
                    <button
                      class="btn-download"
                      @click="downloadReceipt(receipt)"
                      title="PDF 다운로드"
                    >
                      <i class="fas fa-file-pdf"></i>
                      PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 데이터 없음 -->
          <div v-else class="no-data">
            <i class="fas fa-file-alt"></i>
            <p>이전 인수증이 없습니다.</p>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { shipmentService } from '~/services/shipment.service'
import type { PreviousReceipt } from '~/types/shipment-change'

// Props
interface Props {
  isOpen: boolean
  shipmentId: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

// State
const loading = ref(false)
const receipts = ref<PreviousReceipt[]>([])

// Methods
const closeModal = () => {
  emit('close')
}

const loadReceipts = async () => {
  if (!props.shipmentId) return

  loading.value = true
  try {
    receipts.value = await shipmentService.getPreviousReceipts(props.shipmentId)
  } catch (error) {
    console.error('이전 인수증 조회 실패:', error)
    receipts.value = []
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadReceipt = (receipt: PreviousReceipt) => {
  if (receipt.pdfUrl) {
    window.open(receipt.pdfUrl, '_blank')
  } else {
    alert('PDF 파일을 찾을 수 없습니다.')
  }
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadReceipts()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  padding: 0.75rem;
  text-align: left;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.data-table th.text-center,
.data-table td.text-center {
  text-align: center;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

/* 다운로드 버튼 */
.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download:hover {
  background: #b91c1c;
}

.btn-download i {
  font-size: 0.875rem;
}

/* 데이터 없음 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #9ca3af;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-data p {
  margin: 0;
  font-size: 0.875rem;
}

/* 버튼 */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}
</style>
