<!--
  수요기관 판정 수동 보정 모달

  - 판정 방식별 입력: 소재지 기준 → 시도·시군구 / 지정 권역 → 말단 권역 / 건별 지정 → 없음(2단계에서 납품요구마다 지정)
  - 저장하면 출처가 «수동 보정»이 되어 자동 판정 재실행에도 유지된다
  - «자동으로 되돌리기»는 수동 보정값을 버리고 자동 판정값으로 돌아간다
-->
<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content manual-modal">
        <div class="modal-header">
          <h3>수동 보정 — {{ attr.dminsttNm || attr.dminsttCd }}</h3>
          <button type="button" class="modal-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="org-summary">
            <div><span class="label">코드</span> {{ attr.dminsttCd }}</div>
            <div><span class="label">주소</span> {{ attr.adrs || '-' }}</div>
            <div>
              <span class="label">현재</span>
              {{ codeLabel(ORG_CATEGORY_LABELS, attr.orgCategory) }} · {{ codeLabel(AGENCY_CHANNEL_LABELS, attr.channel) }} ·
              {{ codeLabel(RESOLVE_MODE_LABELS, attr.resolveMode) }} · {{ attr.sigunguNm || '시군구 없음' }}
              <span v-if="attr.source" class="status-badge" :class="attr.source === 'MANUAL' ? 'warning' : 'primary'">
                {{ codeLabel(ATTR_SOURCE_LABELS, attr.source) }}
              </span>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="required">기관 구분</label>
              <select v-model="form.orgCategory" class="form-select full" @change="onCategoryChange">
                <option v-for="(label, code) in ORG_CATEGORY_LABELS" :key="code" :value="code">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="required">담당 채널</label>
              <select v-model="form.channel" class="form-select full">
                <option v-for="(label, code) in AGENCY_CHANNEL_LABELS" :key="code" :value="code">
                  {{ label }}
                </option>
              </select>
              <span class="field-hint">군·기타 공공도 지역 대리점(지자체 채널)이 담당합니다.</span>
            </div>
          </div>

          <div class="form-group">
            <label class="required">판정 방식</label>
            <div class="mode-options">
              <label v-for="(label, code) in RESOLVE_MODE_LABELS" :key="code" class="mode-option">
                <input v-model="form.resolveMode" type="radio" :value="code">
                <span>{{ label }}</span>
              </label>
            </div>
            <span class="field-hint">{{ modeHint }}</span>
          </div>

          <div v-if="form.resolveMode === 'LOCATION'" class="form-group">
            <label class="required">소재 시군구</label>
            <div class="inline-selects">
              <select v-model="sidoCd" class="form-select" @change="form.sigunguCd = ''">
                <option value="">
                  시도 선택
                </option>
                <option v-for="s in SIDO_LIST" :key="s.sidoCd" :value="s.sidoCd">
                  {{ s.sidoNm }}
                </option>
              </select>
              <select v-model="form.sigunguCd" class="form-select" :disabled="!sidoCd">
                <option value="">
                  시군구 선택
                </option>
                <option v-for="s in sigunguOfSido" :key="s.sigunguCd" :value="s.sigunguCd">
                  {{ s.sigunguNm }}{{ s.regionName ? ` (${s.regionName})` : ' (미배정)' }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="form.resolveMode === 'FIXED_REGION'" class="form-group">
            <label class="required">지정 권역</label>
            <select v-model="form.fixedRegionId" class="form-select full">
              <option :value="null">
                권역 선택
              </option>
              <option v-for="r in leafRegions" :key="r.regionId" :value="r.regionId">
                {{ r.parentRegionName ? r.parentRegionName + ' > ' : '' }}{{ r.regionName }} ({{ r.regionCode }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>보정 사유</label>
            <input v-model="form.matchNote" type="text" class="form-input full" placeholder="예: 국방시설본부 관할 확인 (경기북부)">
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="attr.source === 'MANUAL'"
            type="button"
            class="btn-secondary revert-btn"
            :disabled="saving"
            @click="revert"
          >
            <i class="fas fa-undo" /> 자동으로 되돌리기
          </button>
          <button type="button" class="btn-secondary" @click="$emit('close')">
            취소
          </button>
          <GuardedButton
            class="btn-primary"
            :blocked="!!saveBlockReason"
            :reason="saveBlockReason"
            :disabled="saving"
            @click="save"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin" />
            보정 저장
          </GuardedButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { demandOrgAttrService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import {
  AGENCY_CHANNEL_LABELS,
  ATTR_SOURCE_LABELS,
  ORG_CATEGORY_LABELS,
  RESOLVE_MODE_LABELS,
  SIDO_LIST,
  codeLabel,
  type AgencyChannel,
  type DemandOrgSalesAttr,
  type OrgCategory,
  type ResolveMode,
  type SalesRegion,
  type Sigungu
} from '~/types/agency'

const props = defineProps<{
  attr: DemandOrgSalesAttr
  regions: SalesRegion[]
  sigungu: Sigungu[]
}>()

const emit = defineEmits<{
  close: []
  saved: [attr: DemandOrgSalesAttr]
}>()

const form = ref<{
  orgCategory: OrgCategory
  channel: AgencyChannel
  resolveMode: ResolveMode
  sigunguCd: string
  fixedRegionId: number | null
  matchNote: string
}>({
  orgCategory: props.attr.orgCategory || 'OTHER_PUBLIC',
  channel: props.attr.channel || 'LOCAL',
  resolveMode: props.attr.resolveMode || 'LOCATION',
  sigunguCd: props.attr.sigunguCd || '',
  fixedRegionId: props.attr.fixedRegionId,
  // 자동 판정 근거는 보정 사유로 옮기지 않는다 (수동이었던 경우만 이어서 편집)
  matchNote: props.attr.source === 'MANUAL' ? (props.attr.matchNote || '') : ''
})

const sidoCd = ref(props.sigungu.find(s => s.sigunguCd === props.attr.sigunguCd)?.sidoCd || '')
const saving = ref(false)

const sigunguOfSido = computed(() =>
  props.sigungu
    .filter(s => s.sidoCd === sidoCd.value)
    .sort((a, b) => a.sigunguCd.localeCompare(b.sigunguCd)))

const leafRegions = computed(() =>
  props.regions
    .filter(r => r.useYn === 'Y' && r.childCount === 0)
    .sort((a, b) => a.regionCode.localeCompare(b.regionCode)))

const modeHint = computed(() => {
  switch (form.value.resolveMode) {
    case 'LOCATION': return '소재 시군구가 속한 말단 권역의 대리점이 담당합니다.'
    case 'FIXED_REGION': return '소재지와 관계없이 지정한 권역의 대리점이 담당합니다 (예: 관할이 한 권역인 시설단).'
    case 'PER_ORDER': return '관할이 여러 권역에 걸쳐 납품요구마다 담당을 정합니다. 건별 지정은 2단계에서 제공됩니다.'
    default: return ''
  }
})

/** 교육청이면 교육청 채널, 그 외는 지자체 채널을 기본으로 맞춘다 (바꿀 수 있음) */
const onCategoryChange = () => {
  form.value.channel = form.value.orgCategory === 'EDU' ? 'EDU' : 'LOCAL'
}

const saveBlockReason = computed(() => {
  if (form.value.resolveMode === 'LOCATION' && !form.value.sigunguCd) {
    return '소재지 기준이면 시도와 시군구를 선택하세요.'
  }
  if (form.value.resolveMode === 'FIXED_REGION' && !form.value.fixedRegionId) {
    return '지정 권역 방식이면 담당 권역을 선택하세요.'
  }
  return ''
})

const save = async () => {
  if (saveBlockReason.value) { return }
  saving.value = true
  try {
    const saved = await demandOrgAttrService.updateManual(props.attr.dminsttCd, {
      sigunguCd: form.value.sigunguCd || null,
      orgCategory: form.value.orgCategory,
      channel: form.value.channel,
      resolveMode: form.value.resolveMode,
      fixedRegionId: form.value.resolveMode === 'FIXED_REGION' ? form.value.fixedRegionId : null,
      matchNote: form.value.matchNote.trim() || null
    })
    emit('saved', saved)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

const revert = async () => {
  if (!confirm('수동 보정값을 버리고 자동 판정값으로 되돌립니다. 계속할까요?')) { return }
  saving.value = true
  try {
    const reverted = await demandOrgAttrService.revertToAuto(props.attr.dminsttCd)
    emit('saved', reverted)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.manual-modal {
  max-width: 640px;
}

.org-summary {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #334155;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.org-summary .label {
  display: inline-block;
  width: 3rem;
  color: #64748b;
  font-weight: 600;
}

.modal-body .form-group {
  margin-bottom: 1rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-select.full,
.form-input.full {
  width: 100%;
}

.inline-selects {
  display: flex;
  gap: 0.5rem;
}

.inline-selects .form-select {
  flex: 1;
  width: auto;
}

.mode-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.mode-option {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748b;
}

.revert-btn {
  margin-right: auto;
}
</style>
