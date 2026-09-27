<!--
  대리점 등록/수정 폼 (회사 정보 + 대리점 정보)

  - 채널은 등록 후 바꿀 수 없다 → 수정 모드에서는 읽기 전용으로 보여준다
  - «코드 제안»은 권역·채널을 골라 서버가 다음 코드를 제안한다 (수정 가능)
  - 담당 권역·영업직원은 수정 화면의 별도 패널에서 다룬다
-->
<template>
  <form class="agency-form" @submit.prevent="handleSubmit">
    <!-- readonly(수정 권한 없음)면 fieldset 째로 입력을 막는다 -->
    <fieldset class="form-two-column form-fieldset" :disabled="readonly">
      <!-- 회사 정보 -->
      <div class="info-group">
        <div class="info-group-header">
          <i class="fas fa-building" />
          <span>회사 정보</span>
        </div>
        <div class="info-grid grid-2">
          <FormField label="회사명" required :error="errors.companyName">
            <input
              v-model="formData.companyName"
              type="text"
              class="form-input"
              :class="{ error: errors.companyName }"
              placeholder="예: 플랫트리(샘플 대리점)"
            >
          </FormField>
          <FormField label="사업자등록번호">
            <input
              v-model="formData.businessNumber"
              type="text"
              class="form-input"
              placeholder="123-45-67890"
              @input="onBusinessNumberInput"
            >
          </FormField>
          <FormField label="대표자">
            <input v-model="formData.representative" type="text" class="form-input" placeholder="대표자명">
          </FormField>
          <FormField label="전화번호">
            <input
              v-model="formData.tel"
              type="text"
              class="form-input"
              placeholder="02-1234-5678"
              @input="onTelInput"
            >
          </FormField>
          <FormField label="이메일" :error="errors.email">
            <input
              v-model="formData.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="example@company.com"
            >
          </FormField>
          <FormField label="우편번호">
            <div class="input-with-button">
              <input v-model="formData.zipCode" type="text" class="form-input" readonly placeholder="우편번호">
              <button v-if="!readonly" type="button" class="btn-secondary" @click="openPostalSearch">
                <i class="fas fa-search" /> 우편번호 검색
              </button>
            </div>
          </FormField>
          <FormField label="주소" full-width>
            <input v-model="formData.address" type="text" class="form-input" placeholder="우편번호 검색으로 채우거나 직접 입력">
          </FormField>
          <FormField label="상세주소" full-width>
            <input v-model="formData.detailAddress" type="text" class="form-input" placeholder="상세주소">
          </FormField>
        </div>
      </div>

      <!-- 대리점 정보 -->
      <div class="info-group">
        <div class="info-group-header">
          <i class="fas fa-handshake" />
          <span>대리점 정보</span>
        </div>
        <div class="info-grid grid-2">
          <FormField
            label="채널"
            required
            :error="errors.channel"
            :hint="mode === 'edit' ? '등록 후 변경 불가 — 다른 채널이면 대리점을 새로 등록하세요.' : '지자체/교육청 중 하나. 등록 후에는 바꿀 수 없습니다.'"
          >
            <select
              v-if="mode === 'create'"
              v-model="formData.channel"
              class="form-select"
              :class="{ error: errors.channel }"
            >
              <option value="">
                선택하세요
              </option>
              <option v-for="(label, code) in AGENCY_CHANNEL_LABELS" :key="code" :value="code">
                {{ label }}
              </option>
            </select>
            <div v-else class="readonly-value">
              <span class="status-badge" :class="formData.channel === 'EDU' ? 'info' : 'primary'">
                {{ codeLabel(AGENCY_CHANNEL_LABELS, formData.channel) }}
              </span>
            </div>
          </FormField>
          <FormField label="대리점 코드" required :error="errors.agencyCode" hint="예: AG-061-01(지자체), ED-061-01(교육청). 제안 후 수정할 수 있습니다.">
            <div class="input-with-button">
              <input
                v-model="formData.agencyCode"
                type="text"
                class="form-input"
                :class="{ error: errors.agencyCode }"
                placeholder="AG-061-01"
              >
              <button v-if="!readonly" type="button" class="btn-secondary" @click="openSuggestModal">
                <i class="fas fa-magic" /> 코드 제안
              </button>
            </div>
          </FormField>
          <FormField label="상태" required>
            <select v-model="formData.status" class="form-select">
              <option v-for="(label, code) in AGENCY_STATUS_LABELS" :key="code" :value="code">
                {{ label }}
              </option>
            </select>
          </FormField>
          <div />
          <FormField label="계약 시작일">
            <input v-model="formData.contractStartDate" type="date" class="form-input">
          </FormField>
          <FormField label="계약 종료일" :error="errors.contractEndDate">
            <input v-model="formData.contractEndDate" type="date" class="form-input" :class="{ error: errors.contractEndDate }">
          </FormField>
          <FormField label="비고" full-width>
            <textarea v-model="formData.remarks" class="form-textarea" rows="3" placeholder="메모" />
          </FormField>
        </div>
      </div>
    </fieldset>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        <i class="fas fa-times" /> 취소
      </button>
      <button v-if="!readonly" type="submit" class="btn-primary" :disabled="saving">
        <i v-if="saving" class="fas fa-spinner fa-spin" />
        <i v-else class="fas fa-save" />
        {{ mode === 'create' ? '등록' : '저장' }}
      </button>
    </div>

    <!-- 코드 제안 모달 -->
    <Teleport to="body">
      <div v-if="showSuggestModal" class="modal-overlay" @click.self="showSuggestModal = false">
        <div class="modal-content suggest-modal">
          <div class="modal-header">
            <h3>대리점 코드 제안</h3>
            <button type="button" class="modal-close" @click="showSuggestModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-hint">
              담당할 권역과 채널을 고르면 비어 있는 다음 번호로 코드를 제안합니다.
            </p>
            <div class="form-group">
              <label class="required">권역</label>
              <select v-model="suggestRegionId" class="form-select full">
                <option :value="null">
                  권역을 선택하세요
                </option>
                <option v-for="r in leafRegions" :key="r.regionId" :value="r.regionId">
                  {{ regionOptionLabel(r) }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="required">채널</label>
              <select v-model="suggestChannel" class="form-select full" :disabled="mode === 'edit'">
                <option value="">
                  선택하세요
                </option>
                <option v-for="(label, code) in AGENCY_CHANNEL_LABELS" :key="code" :value="code">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showSuggestModal = false">
              취소
            </button>
            <GuardedButton
              type="button"
              class="btn-primary"
              :blocked="!suggestRegionId || !suggestChannel"
              reason="권역과 채널을 먼저 선택하세요."
              :disabled="suggesting"
              @click="applySuggestion"
            >
              <i v-if="suggesting" class="fas fa-spinner fa-spin" />
              제안받기
            </GuardedButton>
          </div>
        </div>
      </div>
    </Teleport>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '~/components/admin/forms/FormField.vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { agencyService, salesRegionService } from '~/services/agency.service'
import { formatBusinessNumberInput, formatPhoneNumberInput } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import {
  AGENCY_CHANNEL_LABELS,
  AGENCY_STATUS_LABELS,
  codeLabel,
  type Agency,
  type AgencyRequest,
  type SalesRegion
} from '~/types/agency'

interface Props {
  mode: 'create' | 'edit'
  initialData?: Agency | null
  saving?: boolean
  /** 읽기 전용 (메뉴권한상 수정 권한이 없을 때) — 입력 잠금 + 저장 버튼 숨김 */
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: null,
  saving: false,
  readonly: false
})

const emit = defineEmits<{
  submit: [data: AgencyRequest]
  cancel: []
}>()

const emptyForm = (): AgencyRequest => ({
  companyName: '',
  businessNumber: '',
  representative: '',
  address: '',
  detailAddress: '',
  zipCode: '',
  tel: '',
  email: '',
  agencyCode: '',
  channel: '',
  status: 'ACTIVE',
  contractStartDate: '',
  contractEndDate: '',
  remarks: ''
})

const formData = ref<AgencyRequest>(emptyForm())
const errors = ref<Record<string, string>>({})

// 수정 모드: 기존 값으로 채우기
watch(() => props.initialData, (data) => {
  if (!data) { return }
  formData.value = {
    companyName: data.companyName || '',
    businessNumber: data.businessNumber || '',
    representative: data.representative || '',
    address: data.address || '',
    detailAddress: data.detailAddress || '',
    zipCode: data.zipCode || '',
    tel: data.tel || '',
    email: data.email || '',
    agencyCode: data.agencyCode || '',
    channel: data.channel,
    status: data.status || 'ACTIVE',
    contractStartDate: data.contractStartDate || '',
    contractEndDate: data.contractEndDate || '',
    remarks: data.remarks || ''
  }
}, { immediate: true })

const onBusinessNumberInput = (e: Event) => {
  formData.value.businessNumber = formatBusinessNumberInput((e.target as HTMLInputElement).value)
}

const onTelInput = (e: Event) => {
  formData.value.tel = formatPhoneNumberInput((e.target as HTMLInputElement).value)
}

// 우편번호 검색 (Daum Postcode — nuxt.config 에서 전역 로드)
interface DaumPostcodeData { zonecode: string, address: string }
const openPostalSearch = () => {
  const daum = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (d: DaumPostcodeData) => void }) => { open: () => void } } }).daum
  if (!daum?.Postcode) {
    alert('우편번호 검색을 불러오지 못했습니다. 주소를 직접 입력하거나 잠시 후 다시 시도하세요.')
    return
  }
  new daum.Postcode({
    oncomplete: (d) => {
      formData.value.zipCode = d.zonecode
      formData.value.address = d.address
      formData.value.detailAddress = ''
    }
  }).open()
}

// ===== 코드 제안 =====
const regions = ref<SalesRegion[]>([])
const showSuggestModal = ref(false)
const suggestRegionId = ref<number | null>(null)
const suggestChannel = ref<string>('')
const suggesting = ref(false)

/** 말단·사용 중 권역만 (대리점 담당은 말단 권역에만 붙는다) */
const leafRegions = computed(() =>
  regions.value
    .filter(r => r.useYn === 'Y' && r.childCount === 0)
    .sort((a, b) => a.regionCode.localeCompare(b.regionCode))
)

const regionOptionLabel = (r: SalesRegion) =>
  `${r.parentRegionName ? r.parentRegionName + ' > ' : ''}${r.regionName} (${r.regionCode})`

const loadRegions = async () => {
  try {
    regions.value = await salesRegionService.getRegions()
  } catch (e) {
    console.error('권역 목록 로드 실패:', e)
  }
}

const openSuggestModal = () => {
  suggestChannel.value = formData.value.channel || ''
  showSuggestModal.value = true
}

const applySuggestion = async () => {
  if (!suggestRegionId.value || !suggestChannel.value) { return }
  suggesting.value = true
  try {
    const res = await agencyService.suggestCode(suggestRegionId.value, suggestChannel.value)
    formData.value.agencyCode = res.agencyCode
    // 등록 화면에서 채널을 아직 안 골랐다면 제안에 쓴 채널로 맞춘다
    if (props.mode === 'create' && !formData.value.channel) {
      formData.value.channel = suggestChannel.value as AgencyRequest['channel']
    }
    showSuggestModal.value = false
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    suggesting.value = false
  }
}

// ===== 검증 / 제출 =====
const validate = (): boolean => {
  const errs: Record<string, string> = {}
  if (!formData.value.companyName.trim()) { errs.companyName = '회사명을 입력하세요.' }
  if (!formData.value.agencyCode.trim()) { errs.agencyCode = '대리점 코드를 입력하거나 «코드 제안»을 누르세요.' }
  if (!formData.value.channel) { errs.channel = '채널을 선택하세요.' }
  if (formData.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errs.email = '이메일 형식이 올바르지 않습니다.'
  }
  if (formData.value.contractStartDate && formData.value.contractEndDate &&
    formData.value.contractEndDate < formData.value.contractStartDate) {
    errs.contractEndDate = '계약 종료일이 시작일보다 빠릅니다.'
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

/** 빈 문자열은 null 로 (날짜 칸이 '' 이면 서버 LocalDate 변환이 실패한다) */
const blankToNull = (v: string | null) => (v && v.trim() ? v.trim() : null)

const handleSubmit = () => {
  if (props.readonly) { return }
  if (!validate()) { return }
  const f = formData.value
  emit('submit', {
    companyName: f.companyName.trim(),
    businessNumber: blankToNull(f.businessNumber),
    representative: blankToNull(f.representative),
    address: blankToNull(f.address),
    detailAddress: blankToNull(f.detailAddress),
    zipCode: blankToNull(f.zipCode),
    tel: blankToNull(f.tel),
    email: blankToNull(f.email),
    agencyCode: f.agencyCode.trim(),
    channel: f.channel,
    status: f.status,
    contractStartDate: blankToNull(f.contractStartDate),
    contractEndDate: blankToNull(f.contractEndDate),
    remarks: blankToNull(f.remarks)
  })
}

onMounted(loadRegions)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

.form-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}

/* fieldset 기본 테두리·여백 제거 (레이아웃은 form-two-column 그대로) */
.form-fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-with-button .form-input {
  flex: 1;
}

.input-with-button button {
  white-space: nowrap;
}

.readonly-value {
  padding: 0.5rem 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.suggest-modal {
  max-width: 520px;
}

.modal-hint {
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.modal-body .form-group {
  margin-bottom: 1rem;
}

.form-select.full {
  width: 100%;
}

@media (max-width: 1024px) {
  .form-two-column {
    grid-template-columns: 1fr;
  }
}
</style>
