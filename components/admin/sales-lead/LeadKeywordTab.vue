<!--
  공모·낙찰 수집 — ④ 분류 키워드
  - 리드 종류(건축설계/건축공사/기타) 판별 키워드 5묶음을 나란히 보여주고 바로 추가·삭제·켜고 끈다
  - 저장은 공통코드 LEAD_KW_* 그대로 (공통코드 화면에서 고쳐도 같은 데이터)
  - 바꾼 뒤 [다시 분류] 로 최근 리드에 바로 적용한다 (API 수집 없음)
  - 바꾸기는 리드파워 관리자만 (서버도 막는다), 영업 역할은 보기만
-->
<template>
  <div class="keyword-tab">
    <GuideNotice icon="fa-filter" open-label="판별 순서 보기">
      <template #summary>
        키워드를 바꾼 뒤 <b>[다시 분류]</b>를 눌러야 이미 받은 리드에도 적용됩니다 (새로 받는 리드는 바로 적용)
      </template>
      <ol class="rule-list">
        <li><b>용역</b> — 공공조달분류에 «설계 공공조달분류»가 있으면 바로 <b>건축설계</b>.</li>
        <li>아니면 공고명에 «설계 키워드»와 «건축 키워드»가 둘 다 있고 «제외어»가 없으면 <b>건축설계</b>.</li>
        <li><b>공사</b> — 주공종에 «건축공사 주공종»이 있거나, 공고명에 «건축 키워드»가 있고 «제외어»가 없으면 <b>건축공사</b>.</li>
        <li>나머지는 <b>기타</b> (목록 기본 필터 «설계+공사»에서 빠짐).</li>
      </ol>
      <template #note>
        공백은 무시하고 «포함»으로 비교합니다 — «학교»는 «초등학교»에도 걸립니다. 넓은 말은 제외어로 좁히세요.
      </template>
    </GuideNotice>

    <div v-if="canEdit" class="reclassify-bar">
      <label>최근</label>
      <select v-model.number="reclassifyDays" class="status-select">
        <option :value="7">
          7일
        </option>
        <option :value="30">
          30일
        </option>
        <option :value="90">
          90일
        </option>
      </select>
      <span>에 받은 리드를</span>
      <button type="button" class="btn-action btn-primary" :disabled="reclassifying" @click="reclassify">
        <i :class="reclassifying ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" />
        지금 키워드로 다시 분류
      </button>
      <span class="text-muted small">백그라운드로 돌며 «수집 기록» 탭에서 진행을 볼 수 있습니다.</span>
    </div>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>불러오는 중...</p>
    </div>

    <div v-else class="group-grid">
      <div v-for="g in groups" :key="g.groupCode" class="group-card">
        <div class="card-head">
          <div>
            <strong>{{ g.title }}</strong>
            <span class="target-badge">{{ g.target }}</span>
          </div>
          <span class="text-muted small">{{ activeCount(g) }}개 사용</span>
        </div>
        <p class="card-desc">
          {{ g.description }}
        </p>
        <div v-if="g.usingDefault" class="card-warn">
          <i class="fas fa-exclamation-triangle" /> 사용 중인 키워드가 없어 기본값으로 판별 중입니다.
        </div>

        <div class="chips">
          <span
            v-for="w in g.words"
            :key="w.code"
            class="chip"
            :class="{ off: w.useYn !== 'Y' }"
            :title="w.useYn === 'Y' ? '사용 중' : '사용 안 함 (판별에 안 씀)'"
          >
            {{ w.word }}
            <template v-if="canEdit">
              <button
                type="button"
                class="chip-btn"
                :title="w.useYn === 'Y' ? '끄기 (지우지 않고 잠시 빼기)' : '켜기'"
                :disabled="busy"
                @click="toggle(g, w.code, w.useYn !== 'Y')"
              >
                <i class="fas" :class="w.useYn === 'Y' ? 'fa-pause' : 'fa-play'" />
              </button>
              <button type="button" class="chip-btn danger" title="삭제" :disabled="busy" @click="remove(g, w.code, w.word)">
                <i class="fas fa-times" />
              </button>
            </template>
          </span>
          <span v-if="g.words.length === 0" class="text-muted small">키워드 없음</span>
        </div>

        <form v-if="canEdit" class="add-row" @submit.prevent="add(g)">
          <input
            v-model="newWord[g.groupCode]"
            type="text"
            class="form-input"
            maxlength="50"
            :placeholder="`${g.title} 추가`"
          >
          <button type="submit" class="btn-action btn-secondary" :disabled="busy || !(newWord[g.groupCode] || '').trim()">
            <i class="fas fa-plus" /> 추가
          </button>
        </form>
      </div>
    </div>

    <p v-if="!canEdit" class="text-muted small view-only-note">
      키워드 변경은 시스템관리자·리드파워 관리자만 할 수 있습니다.
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { toApiError } from '~/utils/api-error'
import type { LeadKeywordGroup } from '~/types/sales-lead'

const props = withDefaults(defineProps<{ canEdit?: boolean }>(), { canEdit: false })

const groups = ref<LeadKeywordGroup[]>([])
const loading = ref(false)
const busy = ref(false)
const newWord = ref<Record<string, string>>({})
const reclassifyDays = ref(30)
const reclassifying = ref(false)

const activeCount = (g: LeadKeywordGroup) => g.words.filter(w => w.useYn === 'Y').length

const load = async () => {
  loading.value = true
  try {
    groups.value = await salesLeadService.getKeywords()
  } catch (e) {
    const err = toApiError(e)
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    loading.value = false
  }
}

/** 바꾸기 공통 — 서버가 바뀐 5묶음을 돌려준다 */
const change = async (call: () => Promise<LeadKeywordGroup[]>) => {
  if (!props.canEdit) { return }
  busy.value = true
  try {
    groups.value = await call()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    busy.value = false
  }
}

const add = (g: LeadKeywordGroup) => {
  const w = (newWord.value[g.groupCode] || '').trim()
  if (!w) { return }
  change(async () => {
    const r = await salesLeadService.addKeyword(g.groupCode, w)
    newWord.value[g.groupCode] = ''
    return r
  })
}

const remove = (g: LeadKeywordGroup, code: string, word: string) => {
  if (!confirm(`«${g.title}»에서 «${word}»를 지울까요?\n잠시 빼려면 지우지 말고 끄기(⏸)를 쓰세요.`)) { return }
  change(() => salesLeadService.removeKeyword(g.groupCode, code))
}

const toggle = (g: LeadKeywordGroup, code: string, use: boolean) =>
  change(() => salesLeadService.setKeywordUse(g.groupCode, code, use))

const reclassify = async () => {
  if (!confirm(`최근 ${reclassifyDays.value}일에 받은 리드를 지금 키워드로 다시 분류합니다.\n설계로 새로 분류된 건은 설계사무소가 자동 등록될 수 있습니다. 진행할까요?`)) { return }
  reclassifying.value = true
  try {
    await salesLeadService.reclassify(reclassifyDays.value)
    alert('다시 분류를 시작했습니다. «수집 기록» 탭에서 «다시 분류» 행이 완료되면 수집 결과에 반영됩니다.')
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    reclassifying.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.keyword-tab {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rule-list {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.8;
}

.reclassify-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.75rem;
}

.group-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.target-badge {
  margin-left: 0.375rem;
  padding: 0.0625rem 0.4rem;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.6875rem;
}

.card-desc {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #64748b;
}

.card-warn {
  font-size: 0.75rem;
  color: #b45309;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  font-size: 0.8125rem;
}

.chip.off {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #94a3b8;
  text-decoration: line-through;
}

.chip-btn {
  padding: 0 0.125rem;
  border: none;
  background: none;
  color: inherit;
  font-size: 0.6875rem;
  cursor: pointer;
  opacity: 0.6;
}

.chip-btn:hover {
  opacity: 1;
}

.chip-btn.danger:hover {
  color: #dc2626;
}

.add-row {
  display: flex;
  gap: 0.375rem;
  margin-top: auto;
}

.add-row .form-input {
  flex: 1;
  min-width: 0;
}

.small {
  font-size: 0.75rem;
}

.view-only-note {
  margin: 0;
}
</style>
