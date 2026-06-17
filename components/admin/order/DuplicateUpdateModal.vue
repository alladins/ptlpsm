<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="handleClose">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>납품요구 재업로드</h3>
          <button class="modal-close" @click="handleClose">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <p class="info-text">
            이미 등록된 납품요구번호입니다.<br>
            기존 건을 새 PDF 내용으로 업데이트하시겠습니까?
          </p>

          <!-- 기존 건 정보 -->
          <div class="existing-info">
            <div class="info-row">
              <span class="label">납품요구번호</span>
              <span class="value mono">{{ deliveryRequestNo }}</span>
            </div>
            <div class="info-row">
              <span class="label">현재 상태</span>
              <span class="value">
                <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
              </span>
            </div>
            <div class="info-row">
              <span class="label">납품 완료율</span>
              <span class="value">
                <span class="rate-bar-wrap">
                  <span class="rate-bar">
                    <span class="rate-fill" :style="{ width: `${Math.min(deliveryCompletionRate, 100)}%` }" />
                  </span>
                  <span class="rate-text">{{ deliveryCompletionRate.toFixed(1) }}%</span>
                </span>
              </span>
            </div>
          </div>

          <!-- 출하 진행 경고 -->
          <div v-if="hasShipments" class="shipment-warning">
            <i class="fas fa-exclamation-triangle" />
            <span>
              이미 출하가 진행된 건입니다.<br>
              이미 납품된 수량 미만으로 줄이면 서버에서 차단됩니다.
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="handleClose">
            취소
          </button>
          <button class="btn-primary" @click="handleConfirm">
            <i class="fas fa-sync-alt" />
            기존 건 업데이트
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isOpen: boolean
  deliveryRequestNo: string
  existingStatus: string
  hasShipments: boolean
  deliveryCompletionRate: number
}

const props = withDefaults(defineProps<Props>(), {
  existingStatus: '',
  hasShipments: false,
  deliveryCompletionRate: 0
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

// 상태 코드 → 한국어 레이블
const STATUS_LABELS: Record<string, string> = {
  PENDING: '등록대기',
  REGISTERED: '등록완료',
  IN_PROGRESS: '진행중',
  WAITING_SIGNATURE: '서명대기',
  COMPLETED: '납품완료',
  CANCELLED: '취소'
}

const statusLabel = computed(() => {
  return STATUS_LABELS[props.existingStatus] || props.existingStatus || '-'
})

// 상태별 배지 색상 클래스
const statusClass = computed(() => {
  const map: Record<string, string> = {
    PENDING: 'badge-gray',
    REGISTERED: 'badge-blue',
    IN_PROGRESS: 'badge-yellow',
    WAITING_SIGNATURE: 'badge-orange',
    COMPLETED: 'badge-green',
    CANCELLED: 'badge-red'
  }
  return map[props.existingStatus] || 'badge-gray'
})

const handleClose = () => emit('close')
const handleConfirm = () => emit('confirm')
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
  max-width: 460px;
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
  font-size: 1.125rem;
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
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-text {
  margin: 0;
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.6;
  text-align: center;
}

/* 기존 건 정보 테이블 */
.existing-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.info-row .label {
  font-size: 0.8125rem;
  color: #6b7280;
  flex-shrink: 0;
}

.info-row .value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  text-align: right;
}

.mono {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.8125rem !important;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-gray   { background: #f3f4f6; color: #6b7280; }
.badge-blue   { background: #eff6ff; color: #2563eb; }
.badge-yellow { background: #fefce8; color: #ca8a04; }
.badge-orange { background: #fff7ed; color: #ea580c; }
.badge-green  { background: #f0fdf4; color: #16a34a; }
.badge-red    { background: #fef2f2; color: #dc2626; }

/* 납품 완료율 바 */
.rate-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rate-bar {
  width: 100px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 0;
}

.rate-fill {
  display: block;
  height: 100%;
  background: #2563eb;
  border-radius: 999px;
  transition: width 0.3s;
}

.rate-text {
  font-size: 0.8125rem;
  color: #374151;
  min-width: 3rem;
}

/* 출하 진행 경고 */
.shipment-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #fff7ed;
  border: 1px solid #fb923c;
  border-radius: 8px;
  color: #9a3412;
  font-size: 0.875rem;
  line-height: 1.5;
}

.shipment-warning i {
  color: #f97316;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

/* 푸터 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}
</style>
