<!--
  원천 응답 붙여넣기 적재 (시스템관리자)
  - 나라장터 API 응답(JSON)을 그대로 보내면 서버가 수집과 같은 방식으로 저장·판별·설계사무소 연결·담당 판정을 한다
  - 권한(SYSTEM_ADMIN)은 서버가 막는다 → 400 메시지를 그대로 보여준다
-->
<template>
  <details class="import-panel">
    <summary>
      <i class="fas fa-paste" /> 원천 응답 붙여넣기 적재 (시스템관리자)
    </summary>

    <div class="import-body">
      <p class="import-help">
        나라장터 API 응답(JSON)을 그대로 붙여넣으면 수집과 같은 방식으로 저장·판별·설계사무소 연결·담당 판정을 합니다.
        키 발급 전 점검이나 수동 자료 적재에 씁니다.
      </p>

      <div class="import-options">
        <label class="opt-label">종류</label>
        <select v-model="kind" class="status-select">
          <option value="AWARD">
            낙찰
          </option>
          <option value="CONTRACT">
            계약
          </option>
        </select>
        <template v-if="kind === 'AWARD'">
          <label class="opt-label">업무</label>
          <select v-model="bizType" class="status-select">
            <option value="SERVC">
              용역
            </option>
            <option value="CNSTWK">
              공사
            </option>
          </select>
        </template>
      </div>

      <textarea
        v-model="json"
        class="form-input import-textarea"
        rows="10"
        spellcheck="false"
        placeholder="{&quot;response&quot;: {&quot;header&quot;: …, &quot;body&quot;: {&quot;items&quot;: […]}}}"
      />

      <div class="import-actions">
        <GuardedButton
          type="button"
          class="btn-action btn-primary"
          :blocked="!json.trim()"
          reason="붙여넣은 내용이 없습니다. 나라장터 API 응답(JSON)을 붙여넣은 뒤 적재하세요."
          :disabled="importing"
          @click="runImport"
        >
          <i :class="importing ? 'fas fa-spinner fa-spin' : 'fas fa-file-import'" /> 적재
        </GuardedButton>
        <button type="button" class="btn-action btn-secondary" :disabled="importing || !json" @click="json = ''">
          비우기
        </button>
      </div>

      <div v-if="result" class="import-result" :class="`tone-${runBadge(result.status)}`">
        <div>
          <span class="status-badge" :class="runBadge(result.status)">
            {{ codeLabel(COLLECT_RUN_STATUS_LABELS, result.status) }}
          </span>
          <strong>{{ collectJobLabel(result.job) }}</strong>
          <span class="text-muted">#{{ result.runId }}</span>
        </div>
        <div class="result-counts">
          받음 {{ formatNumber(result.fetched) }} · 신규 {{ formatNumber(result.inserted) }} · 갱신 {{ formatNumber(result.updated) }}
        </div>
        <div v-if="result.message" class="result-message">
          {{ result.message }}
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { codeLabel } from '~/types/agency'
import {
  COLLECT_RUN_STATUS_BADGE,
  COLLECT_RUN_STATUS_LABELS,
  collectJobLabel,
  type ImportKind,
  type LeadBizType,
  type SalesCollectRun
} from '~/types/sales-lead'

const emit = defineEmits<{ imported: [run: SalesCollectRun] }>()

const kind = ref<ImportKind>('AWARD')
const bizType = ref<LeadBizType>('SERVC')
const json = ref('')
const importing = ref(false)
const result = ref<SalesCollectRun | null>(null)

const runBadge = (status?: string | null) =>
  (COLLECT_RUN_STATUS_BADGE as Record<string, string>)[status || ''] || 'info'

const runImport = async () => {
  const text = json.value.trim()
  // 서버에 보내기 전에 JSON 인지만 확인한다 (보내는 것은 붙여넣은 원문 그대로)
  try {
    JSON.parse(text)
  } catch {
    alert('JSON 형식이 아닙니다. 나라장터 API 응답을 잘리지 않게 전체 붙여넣었는지 확인하세요.')
    return
  }

  importing.value = true
  result.value = null
  try {
    // 계약은 용역(수의)만 수집하므로 업무 구분은 용역으로 보낸다
    const run = await salesLeadService.importRaw(kind.value, kind.value === 'AWARD' ? bizType.value : 'SERVC', text)
    result.value = run
    emit('imported', run)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.import-panel {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.import-panel summary {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  color: #334155;
}

.import-body {
  padding: 0 1rem 1rem;
}

.import-help {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.6;
}

.import-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.opt-label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: #475569;
}

.import-textarea {
  width: 100%;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  resize: vertical;
}

.import-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.import-result {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
  border-radius: 8px;
  font-size: 0.8125rem;
}

.import-result > div:first-child {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.import-result.tone-success {
  border-left-color: #10b981;
}

.import-result.tone-danger {
  border-left-color: #ef4444;
}

.import-result.tone-warning {
  border-left-color: #f59e0b;
}

.result-counts {
  margin-top: 0.375rem;
  color: #334155;
}

.result-message {
  margin-top: 0.25rem;
  color: #475569;
  white-space: pre-wrap;
}
</style>
