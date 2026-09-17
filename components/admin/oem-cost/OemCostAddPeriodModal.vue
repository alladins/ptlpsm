<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container">
          <!-- 헤더 -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon"><i class="fas fa-plus" /></div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">원가 구간 추가</h2>
                <span class="ccm-modal-subtitle">단가가 바뀌었을 때 새 구간을 만듭니다</span>
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
            <div class="ap-target">
              <div class="ap-target-row">
                <span class="ap-label">품목</span>
                <span class="ap-value">{{ skuInfo?.skuName || skuInfo?.skuId || '-' }}</span>
              </div>
              <div class="ap-target-row">
                <span class="ap-label">공급원</span>
                <span class="ap-value">{{ oemCompanyName || '-' }}</span>
              </div>
            </div>

            <!-- 갈래 선택 -->
            <div class="ap-choice">
              <button
                type="button"
                class="ap-choice-card"
                :class="{ active: mode === 'FUTURE' }"
                :disabled="isSubmitting"
                @click="mode = 'FUTURE'"
              >
                <i class="fas fa-forward" />
                <strong>지금부터 적용</strong>
                <small>단가가 올랐거나 내렸을 때</small>
              </button>
              <button
                type="button"
                class="ap-choice-card"
                :class="{ active: mode === 'PAST' }"
                :disabled="isSubmitting"
                @click="mode = 'PAST'"
              >
                <i class="fas fa-clock-rotate-left" />
                <strong>지난 기간</strong>
                <small>예전 단가표를 뒤늦게 받았을 때</small>
              </button>
            </div>

            <!-- 갈래별 안내 -->
            <div class="period-notice">
              <i class="fas fa-info-circle" />
              <span v-if="mode === 'FUTURE'">
                <strong>{{ currentPeriodText || '현재 구간' }}</strong> 은
                <strong>{{ closingDateText || '시작일 하루 전' }}</strong> 까지로 자동 마감되고,
                입력한 시작일부터 새 원가가 적용됩니다.
                이전 구간은 지워지지 않아 그 기간의 발주·출하는 계속 옛 원가로 계산됩니다.
              </span>
              <span v-else>
                지금 있는 <strong>가장 이른 구간보다 앞선 기간</strong>에 끼워 넣습니다.
                <strong>종료일이 필요합니다.</strong>
                <template v-if="maxExpiry">
                  종료일은 <strong>{{ maxExpiry }}</strong> 이전이어야 합니다.
                </template>
                <br>
                <strong>이미 등록된 출하 금액은 바뀌지 않습니다</strong> — 출하는 등록 시점 원가를
                그대로 들고 있어, 과거분까지 바로잡으려면 저장 후 <strong>원가 재계산</strong>을 돌려야 합니다.
              </span>
            </div>

            <!-- 현재 구간 목록 -->
            <div v-if="existingPeriods.length" class="ap-periods">
              <div class="ap-periods-title"><i class="fas fa-list-ul" /> 현재 등록된 구간</div>
              <div v-for="p in existingPeriods" :key="p.id" class="ap-period-row">
                <span class="ap-period-date">{{ p.effectiveDate || '-' }} ~ {{ p.expiryDate || '무기한' }}</span>
                <span class="ap-period-cost">{{ formatNumber(p.costPrice) }}원</span>
              </div>
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
                <label class="ccm-form-label" :class="{ required: mode === 'PAST' }">
                  <i class="fas fa-calendar-check" />
                  적용 종료일 <span v-if="mode === 'FUTURE'" class="ap-optional">(비우면 무기한)</span>
                </label>
                <input v-model="form.expiryDate" type="date" class="ccm-form-input" :disabled="isSubmitting">
              </div>
            </div>

            <div class="ccm-form-group">
              <label class="ccm-form-label required"><i class="fas fa-won-sign" /> 원가</label>
              <input
                v-model="formattedCostPrice"
                type="text"
                inputmode="numeric"
                class="ccm-form-input"
                placeholder="0"
                :disabled="isSubmitting"
              >
              <span v-if="perThickness" class="ap-hint">
                두께 {{ skuInfo?.thickness }}T 기준 <strong>T당 {{ perThickness }}원</strong>
              </span>
            </div>

            <div class="ccm-form-group">
              <label class="ccm-form-label"><i class="fas fa-comment-dots" /> 사유 / 비고</label>
              <textarea
                v-model="form.remarks"
                class="ccm-form-textarea"
                rows="2"
                :placeholder="mode === 'PAST' ? '예) 정우산업 2025년 소급 단가표 통보분' : '예) 2026-10월 단가 인상 통보'"
                :disabled="isSubmitting"
              />
            </div>

            <div v-if="errorMessage" class="ap-error">
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
import { formatNumber, getLocalDateString } from '~/utils/format'
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
  /** 현재 적용중(또는 가장 최근) 구간 — «지금부터 적용» 은 이 구간을 마감하고 뒤에 붙인다 */
  anchorCost: OemCost | null
}

const props = withDefaults(defineProps<Props>(), {
  oemCompanyName: '',
  costSourceType: 'OEM'
})

const emit = defineEmits<{ close: []; saved: [] }>()

type Mode = 'FUTURE' | 'PAST'
const mode = ref<Mode>('FUTURE')
const isSubmitting = ref(false)
const errorMessage = ref('')
const existingPeriods = ref<OemCost[]>([])

const form = ref({ effectiveDate: '', expiryDate: '', costPrice: 0, remarks: '' })

const formattedCostPrice = computed({
  get: () => (form.value.costPrice ? form.value.costPrice.toLocaleString('ko-KR') : ''),
  set: (v: string) => { form.value.costPrice = Number(String(v).replace(/[^0-9]/g, '')) || 0 }
})

// «지금부터 적용» — 마감될 현재 구간
const currentPeriodText = computed(() => {
  const a = props.anchorCost
  if (!a?.effectiveDate) { return '' }
  return `${a.effectiveDate} ~ ${a.expiryDate || '무기한'}`
})

const closingDateText = computed(() => {
  if (!form.value.effectiveDate) { return '' }
  const d = new Date(form.value.effectiveDate)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

// «지난 기간» — 가장 이른 구간 하루 전까지만 가능
const maxExpiry = computed(() => {
  const dates = existingPeriods.value.map(p => p.effectiveDate).filter(Boolean) as string[]
  if (!dates.length) { return '' }
  const d = new Date(dates.sort()[0])
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

const perThickness = computed(() => {
  const t = Number(props.skuInfo?.thickness)
  if (!t || !form.value.costPrice) { return '' }
  return Math.round(form.value.costPrice / t).toLocaleString('ko-KR')
})

const canSubmit = computed(() => {
  if (!form.value.effectiveDate || form.value.costPrice <= 0) { return false }
  if (mode.value === 'PAST') {
    return !!form.value.expiryDate && form.value.effectiveDate <= form.value.expiryDate
  }
  return !form.value.expiryDate || form.value.effectiveDate <= form.value.expiryDate
})

watch(() => props.isOpen, async (open) => {
  if (!open) { return }
  mode.value = 'FUTURE'
  form.value = { effectiveDate: getLocalDateString(), expiryDate: '', costPrice: 0, remarks: '' }
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

// 갈래를 바꾸면 날짜 기본값도 갈래에 맞게 바꾼다
watch(mode, (m) => {
  errorMessage.value = ''
  if (m === 'FUTURE') {
    form.value.effectiveDate = getLocalDateString()
    form.value.expiryDate = ''
  } else {
    form.value.effectiveDate = ''
    form.value.expiryDate = maxExpiry.value || ''
  }
})

const handleClose = () => { if (!isSubmitting.value) { emit('close') } }

const handleSubmit = async () => {
  if (!canSubmit.value || !props.skuInfo?.skuId || !props.oemCompanyId) { return }

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    if (mode.value === 'PAST') {
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
    } else {
      // 지금부터 적용 — 현재 구간을 하루 전으로 마감하고 새 구간을 추가한다(백엔드 rollover)
      if (!props.anchorCost?.id) {
        throw new Error('기준이 될 현재 구간을 찾지 못했습니다. 목록을 새로고침한 뒤 다시 시도하세요.')
      }
      await oemCostService.update(props.anchorCost.id, {
        costPrice: form.value.costPrice,
        effectiveDate: form.value.effectiveDate,
        expiryDate: form.value.expiryDate || undefined,
        remarks: form.value.remarks || undefined,
        changeReason: form.value.remarks || '단가 변경(새 구간 추가)'
      } as any)
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    errorMessage.value = e?.message || '구간 추가에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

.ap-target {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}
.ap-target-row { display: flex; gap: 10px; align-items: center; }
.ap-target-row + .ap-target-row { margin-top: 6px; }
.ap-label { min-width: 52px; font-size: 12px; color: #64748b; }
.ap-value { font-weight: 600; color: #1e293b; }

.ap-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.ap-choice-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all .15s ease;
}
.ap-choice-card i { font-size: 18px; color: #94a3b8; }
.ap-choice-card strong { font-size: 14px; color: #334155; }
.ap-choice-card small { font-size: 11px; color: #94a3b8; }
.ap-choice-card:hover:not(:disabled) { border-color: #c7d2fe; }
.ap-choice-card.active { border-color: #6366f1; background: #eef2ff; }
.ap-choice-card.active i,
.ap-choice-card.active strong { color: #4338ca; }
.ap-choice-card.active small { color: #6366f1; }

.period-notice {
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
.period-notice i { margin-top: 2px; }

.ap-periods { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
.ap-periods-title { font-size: 12px; color: #64748b; margin-bottom: 8px; }
.ap-period-row {
  display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0;
  border-bottom: 1px dashed #f1f5f9;
}
.ap-period-row:last-of-type { border-bottom: none; }
.ap-period-date { color: #475569; }
.ap-period-cost { font-weight: 600; color: #1e293b; }

.ap-optional { font-weight: 400; color: #94a3b8; font-size: 11px; }
.ap-hint { display: block; margin-top: 6px; font-size: 12px; color: #64748b; }

.ap-error {
  display: flex; gap: 8px; background: #fef2f2; border: 1px solid #fecaca;
  color: #b91c1c; border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.5;
}
</style>
