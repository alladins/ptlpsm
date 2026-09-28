<!--
  고객 소속 선택 — 수요기관 / 조달업체 / 기타 (명함·영업·견적 공통, 백엔드 CustomerOrg 와 같은 규칙)
  - 수요기관: DemandOrgPicker (입력 즉시 검색) / 조달업체: SupplierSelector / 기타: 직접 입력
  - v-model 은 소속 한 묶음 { orgType, dminsttCd, dminsttNm, companyId, orgBizno }
    (견적은 dminsttCd=client_code, dminsttNm=client_name 으로 이어 붙여 쓴다)
  - 팝업 없이 한 자리에서 끝나 휴대폰·태블릿에서도 쓰기 쉽다 (메모리 sales-screens-mobile-first)
-->
<template>
  <div class="customer-org-picker">
    <div class="org-type-toggle" role="radiogroup">
      <label v-for="(label, code) in ORG_TYPE_LABELS" :key="code" class="type-chip" :class="{ on: modelValue.orgType === code, disabled }">
        <input
          type="radio"
          :value="code"
          :checked="modelValue.orgType === code"
          :disabled="disabled"
          @change="changeType(code as OrgType)"
        >
        {{ label }}
      </label>
    </div>

    <DemandOrgPicker
      v-if="modelValue.orgType === 'DEMAND_ORG'"
      :selected-name="modelValue.dminsttCd ? modelValue.dminsttNm : ''"
      @selected="pickDemandOrg"
      @cleared="clearOrg"
    />
    <SupplierSelector
      v-else-if="modelValue.orgType === 'SUPPLIER'"
      :selected-name="modelValue.companyId || modelValue.orgBizno ? modelValue.dminsttNm : ''"
      :selected-bizno="modelValue.orgBizno"
      @selected="pickSupplier"
      @cleared="clearOrg"
    />
    <input
      v-else
      :value="modelValue.dminsttNm"
      type="text"
      class="form-input"
      placeholder="소속(회사·기관)명을 직접 입력하세요"
      :disabled="disabled"
      @input="emitPatch({ dminsttNm: ($event.target as HTMLInputElement).value })"
    >
  </div>
</template>

<script setup lang="ts">
import DemandOrgPicker from '~/components/DemandOrgPicker.vue'
import SupplierSelector from '~/components/SupplierSelector.vue'
import { ORG_TYPE_LABELS, type CustomerOrgValue, type OrgType, type SupplierOption } from '~/services/business-card.service'
import type { DemandOrganization } from '~/services/demand-organization.service'

const props = withDefaults(defineProps<{
  modelValue: CustomerOrgValue
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{
  'update:modelValue': [value: CustomerOrgValue]
}>()

const emitPatch = (patch: Partial<CustomerOrgValue>) => {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

/** 구분을 바꾸면 이전 구분의 값을 비운다 (수요기관 코드가 조달업체에 남는 일 방지) */
const changeType = (t: OrgType) => {
  emit('update:modelValue', { orgType: t, dminsttCd: '', dminsttNm: '', companyId: null, orgBizno: null })
}

const pickDemandOrg = (o: DemandOrganization) => emitPatch({ dminsttCd: o.dminsttCd, dminsttNm: o.dminsttNm, companyId: null, orgBizno: null })
const pickSupplier = (o: SupplierOption) => emitPatch({ dminsttCd: '', dminsttNm: o.companyName, companyId: o.companyId, orgBizno: o.bizno })
const clearOrg = () => emitPatch({ dminsttCd: '', dminsttNm: '', companyId: null, orgBizno: null })
</script>

<style scoped>
.customer-org-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.org-type-toggle {
  display: flex;
  gap: 0.375rem;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0.25rem 0.875rem;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  background: #fff;
  color: #475569;
  font-size: 0.8125rem;
  cursor: pointer;
}

.type-chip input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.type-chip.on {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

.type-chip.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
