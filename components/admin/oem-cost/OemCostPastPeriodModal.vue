<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container">
          <!-- 헤더 -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon">
                <i class="fas fa-clock-rotate-left" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">과거 구간 추가</h2>
                <span class="ccm-modal-subtitle">지나간 기간의 단가를 뒤늦게 받았을 때</span>
              </div>
            </div>
            <button class="ccm-close-button" :disabled="isSubmitting" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="ccm-modal-body">
            <!-- 대상 -->
            <div class="pp-target">
              <div class="pp-target-row">
                <span class="pp-label">품목</span>
                <span class="pp-value">{{ skuInfo?.skuName || skuInfo?.skuId || '-' }}</span>
              </div>
              <div class="pp-target-row">
                <span class="pp-label">공급원</span>
                <span class="pp-value">{{ oemCompanyName || '-' }}</span>
              </div>
            </div>

            <!-- 안내 -->
            <div class="period-rollover-notice">
              <i class="fas fa-info-circle" />
              <span>
                이미 있는 첫 구간보다 <strong>앞선 기간</strong>의 원가를 끼워 넣습니다.
                <strong>종료일은 필수</strong>입니다 — 비우면 무기한이 되어 이후 구간과 겹칩니다.
                <br>
                <strong>이미 등록된 출하의 금액은 바뀌지 않습니다.</strong>
                출하는 등록 시점 원가를 그대로 들고 있어서, 과거분 금액까지 바로잡으려면
                저장 후 <strong>원가 재계산</strong>을 따로 돌려야 합니다.
              </span>
            </div>

            <!-- 기존 구간 -->
            <div v-if="existingPeriods.length" class="pp-periods">
              <div class="pp-periods-title">
                <i class="fas fa-list-ul" /> 현재 등록된 구간
              </div>
              <div v-for="p in existingPeriods" :key="p.id" class="pp-period-row">
                <span class="pp-period-date">
                  {{ p.effectiveDate || '(시작일 없음)' }} ~ {{ p.expiryDate || '무기한' }}
                </span>
                <span class="pp-period-cost">{{ formatNumber(p.costPrice) }}원</span>
              </div>
              <p v-if="earliestDate" class="pp-hint">
                가장 이른 구간이 <strong>{{ earliestDate }}</strong> 부터입니다.
                종료일은 <strong>{{ maxExpiry }}</strong> 이전이어야 합니다.
              </p>
            </div>

            <!-- 입력 -->
            <div class="ccm-form-row">
              <div class="ccm-form-group half">
                <label class="ccm-form-label required">
                  <i class="fas fa-calendar-alt" /> 적용 시작일
                </label>
                <input v-model="form.effectiveDate" type="date" class="ccm-form-input" :disabled="isSubmitting">
              </div>
              <div class="ccm-form-group half">
                <label class="ccm-form-label required">
                  <i class="fas fa-calendar-check" /> 적용 종료일
                </label>
                <input v-model="form.expiryDate" type="date" class="ccm-form-input" :disabled="isSubmitting">
              </div>
            </div>

            <div class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-won-sign" /> 원가
              </label>
              <input
                v-model="formattedCostPrice"
                type="text"
                inputmode="numeric"
                class="ccm-form-input"
                placeholder="0"
                :disabled="isSubmitting"
              >
              <span v-if="perThickness" class="ccm-form-hint">
                두께 {{ skuInfo?.thickness }}T 기준 <strong>T당 {{ perThickness }}원</strong>
              </span>
            </div>

            <div class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-comment-dots" /> 사유 / 비고
              </label>
              <textarea
                v-model="form.remarks"
                class="ccm-form-textarea"
                rows="2"
                placeholder="예) 정우산업 2025년 소급 단가표 통보분"
                :disabled="isSubmitting"
              />
            </div>

            <div v-if="errorMessage" class="pp-error">
              <i class="fas fa-exclamation-circle" /> {{ errorMessage }}
            </div>
          </div>

          <div class="ccm-modal-footer">
            <button class="btn-secondary" :disabled="isSubmitting" @click="handleClose">취소</button>
            <button class="btn-primary" :disabled="!canSubmit || isSubmitting" @click="handleSubmit">
              <i v-if="isSubmitting" class="fas fa-spinner fa-spin" />
              <span v-else>구간 추가</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { oemCostService } from '~/services/oem-cost.service'
import { formatNumber } from '~/utils/format'
import type { OemCost } from '~/types/oem-cost'

interface SkuInfo {
  skuId: string
  skuName?: string
  thickness?: number
}

interface Props {
  isOpen: boolean
  skuInfo: SkuInfo | null
  oemCompanyId: number | null
  oemCompanyName?: string
  costSourceType?: string
}

const props = withDefaults(defineProps<Props>(), {
  oemCompanyName: '',
  costSourceType: 'OEM'
})

const emit = defineEmits<{ close: []; saved: [] }>()

const isSubmitting = ref(false)
const errorMessage = ref('')
const existingPeriods = ref<OemCost[]>([])

const form = ref({
  effectiveDate: '',
  expiryDate: '',
  costPrice: 0,
  remarks: ''
})

// 금액 입력 — 천 단위 콤마 표시
const formattedCostPrice = computed({
  get: () => (form.value.costPrice ? form.value.costPrice.toLocaleString('ko-KR') : ''),
  set: (v: string) => {
    form.value.costPrice = Number(String(v).replace(/[^0-9]/g, '')) || 0
  }
})

// 가장 이른 기존 구간 — 새 구간은 그 전날까지만 가능
const earliestDate = computed(() => {
  const dates = existingPeriods.value
    .map(p => p.effectiveDate)
    .filter(Boolean) as string[]
  return dates.length ? dates.sort()[0] : ''
})

const maxExpiry = computed(() => {
  if (!earliestDate.value) { return '' }
  const d = new Date(earliestDate.value)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

const perThickness = computed(() => {
  const t = Number(props.skuInfo?.thickness)
  if (!t || !form.value.costPrice) { return '' }
  return Math.round(form.value.costPrice / t).toLocaleString('ko-KR')
})

const canSubmit = computed(() =>
  !!form.value.effectiveDate &&
  !!form.value.expiryDate &&
  form.value.costPrice > 0 &&
  form.value.effectiveDate <= form.value.expiryDate
)

watch(() => props.isOpen, async (open) => {
  if (!open) { return }
  form.value = { effectiveDate: '', expiryDate: '', costPrice: 0, remarks: '' }
  errorMessage.value = ''
  existingPeriods.value = []

  if (props.skuInfo?.skuId && props.oemCompanyId) {
    try {
      existingPeriods.value = await oemCostService.getPeriods(props.skuInfo.skuId, props.oemCompanyId)
    } catch (e) {
      console.error('기존 구간 조회 실패:', e)
    }
  }
})

const handleClose = () => {
  if (!isSubmitting.value) { emit('close') }
}

const handleSubmit = async () => {
  if (!canSubmit.value || !props.skuInfo?.skuId || !props.oemCompanyId) { return }

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await oemCostService.addPastPeriod({
      skuId: props.skuInfo.skuId,
      oemCompanyId: props.oemCompanyId,
      costSourceType: props.costSourceType,
      costPrice: form.value.costPrice,
      effectiveDate: form.value.effectiveDate,
      expiryDate: form.value.expiryDate,
      remarks: form.value.remarks || undefined,
      changeReason: form.value.remarks || '과거 구간 추가(소급 단가)'
    } as any)
    emit('saved')
    emit('close')
  } catch (e: any) {
    errorMessage.value = e?.message || '과거 구간 추가에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

.pp-target {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}
.pp-target-row { display: flex; gap: 10px; align-items: center; }
.pp-target-row + .pp-target-row { margin-top: 6px; }
.pp-label { min-width: 52px; font-size: 12px; color: #64748b; }
.pp-value { font-weight: 600; color: #1e293b; }

.period-rollover-notice {
  display: flex;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #1e40af;
}
.period-rollover-notice i { margin-top: 2px; }

.pp-periods {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
}
.pp-periods-title { font-size: 12px; color: #64748b; margin-bottom: 8px; }
.pp-period-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px dashed #f1f5f9;
}
.pp-period-row:last-of-type { border-bottom: none; }
.pp-period-date { color: #475569; }
.pp-period-cost { font-weight: 600; color: #1e293b; }
.pp-hint { margin: 8px 0 0; font-size: 12px; color: #64748b; }

.pp-error {
  display: flex;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
}
</style>
