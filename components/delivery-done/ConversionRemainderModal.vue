<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <!-- 헤더 -->
        <div class="modal-header">
          <h3>
            <i class="fas fa-calculator" />
            환산잔량 처리
          </h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 로딩 -->
          <div v-if="loading" class="loading-container">
            <i class="fas fa-spinner fa-spin" />
            <span>데이터를 불러오는 중...</span>
          </div>

          <!-- 후보 없음 -->
          <div v-else-if="candidates.length === 0" class="empty-container">
            <i class="fas fa-check-circle" />
            <span>환산잔량 처리 대상 품목이 없습니다.</span>
          </div>

          <template v-else>
            <!-- 안내 문구 -->
            <div class="info-box">
              <i class="fas fa-info-circle" />
              <div>
                <p>짝수올림으로 발생한 잔여수량을 내부적으로 처리합니다.</p>
                <p>처리 후 납품률이 100%가 되면 자동으로 서명대기 상태로 전환됩니다.</p>
                <p class="info-warning">
                  PDF 서류(납품완료계, 납품확인서)의 수량은 변경되지 않습니다.
                </p>
              </div>
            </div>

            <!-- 품목 테이블 -->
            <table class="candidate-table">
              <thead>
                <tr>
                  <th style="width: 5%;">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleAll"
                    >
                  </th>
                  <th style="width: 30%;">
                    품목
                  </th>
                  <th style="width: 18%;" class="text-right">
                    계약량(㎡)
                  </th>
                  <th style="width: 18%;" class="text-right">
                    납품량(㎡)
                  </th>
                  <th style="width: 14%;" class="text-right">
                    잔여량(㎡)
                  </th>
                  <th style="width: 15%;" class="text-right">
                    환산잔량(㎡)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in candidates" :key="item.skuId">
                  <td>
                    <input
                      type="checkbox"
                      :checked="selectedSkuIds.has(item.skuId)"
                      :disabled="item.remainingQuantity > 4"
                      @change="toggleItem(item)"
                    >
                  </td>
                  <td class="text-left">
                    {{ item.skuName }}
                  </td>
                  <td class="text-right">
                    {{ formatNumber(item.orderedQuantity) }}
                  </td>
                  <td class="text-right">
                    {{ formatNumber(item.deliveredQuantity) }}
                  </td>
                  <td class="text-right">
                    <span :class="item.remainingQuantity > 4 ? 'text-danger' : 'text-warning'">
                      {{ formatNumber(item.remainingQuantity) }}
                    </span>
                    <span v-if="item.remainingQuantity > 4" class="hint-text">(4㎡ 초과)</span>
                  </td>
                  <td class="text-right">
                    <span v-if="selectedSkuIds.has(item.skuId)" class="conversion-value">
                      {{ formatNumber(item.remainingQuantity) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 합계 -->
            <div class="summary-row">
              <span>선택된 환산잔량 합계:</span>
              <strong>{{ formatNumber(totalConversionRemainder) }} ㎡</strong>
            </div>
          </template>
        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">
            취소
          </button>
          <button
            class="btn-confirm"
            :disabled="processing || selectedSkuIds.size === 0"
            @click="handleProcess"
          >
            <i v-if="processing" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-check" />
            환산잔량 처리
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  getConversionRemainderCandidates,
  processConversionRemainder
} from '~/services/delivery-done.service'
import type { ConversionRemainderCandidate } from '~/types/delivery-done'

interface Props {
  isOpen: boolean
  deliveryDoneId: number | null
  threshold: number
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  deliveryDoneId: null,
  threshold: 4
})

const emit = defineEmits<{
  close: []
  updated: []
}>()

const loading = ref(false)
const processing = ref(false)
const candidates = ref<ConversionRemainderCandidate[]>([])
const selectedSkuIds = ref<Set<string>>(new Set())

// 전체 선택 여부
const selectableCandidates = computed(() =>
  candidates.value.filter(c => c.remainingQuantity <= props.threshold)
)

const isAllSelected = computed(() =>
  selectableCandidates.value.length > 0 &&
  selectableCandidates.value.every(c => selectedSkuIds.value.has(c.skuId))
)

// 선택된 환산잔량 합계
const totalConversionRemainder = computed(() =>
  candidates.value
    .filter(c => selectedSkuIds.value.has(c.skuId))
    .reduce((sum, c) => sum + c.remainingQuantity, 0)
)

// 모달 열릴 때 데이터 로드
watch(() => props.isOpen, async (open) => {
  if (open && props.deliveryDoneId) {
    await loadCandidates()
  } else {
    candidates.value = []
    selectedSkuIds.value = new Set()
  }
})

async function loadCandidates () {
  if (!props.deliveryDoneId) { return }
  loading.value = true
  try {
    candidates.value = await getConversionRemainderCandidates(props.deliveryDoneId)
    // 임계값 이하인 품목 자동 선택
    selectedSkuIds.value = new Set(
      candidates.value.filter(c => c.remainingQuantity <= props.threshold).map(c => c.skuId)
    )
  } catch (error) {
    console.error('환산잔량 후보 조회 실패:', error)
    alert('환산잔량 후보를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

function toggleAll () {
  if (isAllSelected.value) {
    selectedSkuIds.value = new Set()
  } else {
    selectedSkuIds.value = new Set(selectableCandidates.value.map(c => c.skuId))
  }
}

function toggleItem (item: ConversionRemainderCandidate) {
  const newSet = new Set(selectedSkuIds.value)
  if (newSet.has(item.skuId)) {
    newSet.delete(item.skuId)
  } else {
    newSet.add(item.skuId)
  }
  selectedSkuIds.value = newSet
}

async function handleProcess () {
  if (selectedSkuIds.value.size === 0 || !props.deliveryDoneId) { return }

  if (!confirm('선택한 품목의 환산잔량을 처리하시겠습니까?\n처리 후 납품률이 100%가 되면 서명대기 상태로 전환됩니다.')) {
    return
  }

  processing.value = true
  try {
    const items = candidates.value
      .filter(c => selectedSkuIds.value.has(c.skuId))
      .map(c => ({
        skuId: c.skuId,
        conversionRemainder: c.remainingQuantity
      }))

    await processConversionRemainder(props.deliveryDoneId, { items })
    alert('환산잔량 처리가 완료되었습니다.')
    emit('updated')
    closeModal()
  } catch (error: any) {
    console.error('환산잔량 처리 실패:', error)
    alert(error.message || '환산잔량 처리 중 오류가 발생했습니다.')
  } finally {
    processing.value = false
  }
}

function closeModal () {
  emit('close')
}

function formatNumber (value: number): string {
  if (value == null) { return '0' }
  return Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
</script>

<style scoped>
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
  z-index: 9999;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 700px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h3 i {
  color: #f59e0b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

/* 안내 박스 */
.info-box {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #1e40af;
}

.info-box i {
  margin-top: 2px;
  flex-shrink: 0;
}

.info-box p {
  margin: 0 0 4px 0;
}

.info-box p:last-child {
  margin-bottom: 0;
}

.info-warning {
  color: #b45309;
  font-weight: 600;
}

/* 테이블 */
.candidate-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.candidate-table th,
.candidate-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.candidate-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.candidate-table .text-left {
  text-align: left;
}

.candidate-table .text-right {
  text-align: right;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b;
  font-weight: 600;
}

.text-muted {
  color: #9ca3af;
}

.hint-text {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 4px;
}

.conversion-value {
  color: #059669;
  font-weight: 600;
}

/* 합계 */
.summary-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  font-size: 14px;
  color: #374151;
  border-top: 2px solid #e5e7eb;
}

.summary-row strong {
  color: #059669;
  font-size: 16px;
}

/* 버튼 */
.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-confirm {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #f59e0b;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-confirm:hover:not(:disabled) {
  background: #d97706;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 로딩/빈 상태 */
.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 14px;
}

.loading-container i,
.empty-container i {
  font-size: 32px;
}

.empty-container i {
  color: #10b981;
}
</style>
