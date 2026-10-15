<!--
  대리점 등록 «회사정보에서 불러오기» — 회사정보(company)에 등록된 회사를 찾아 폼에 채운다

  - 입력하면 잠깐 뒤 자동 검색 (명함 소속 선택과 같은 동작), 결과 행 44px — 휴대폰·태블릿에서도 쓴다
  - 없는 회사는 [회사정보 등록]에서 먼저 등록하고 다시 검색 (10-15 사용자 결정: 같은 정보를 두 번 입력하지 않게)
  - 협력사·기타 유형은 그 회사 행을 그대로 대리점으로 연결하고, 제조사·건설사처럼 유형이 다른 회사는 정보만 복사된다
-->
<template>
  <div class="agency-company-picker">
    <div v-if="picked" class="picked">
      <div class="picked-main">
        <span class="picked-name"><i class="fas fa-building" /> {{ picked.companyName }}</span>
        <span class="text-muted small">{{ formatBizno(picked.businessNumber) }} · {{ typeLabel(picked.companyType) }}</span>
      </div>
      <span class="link-note" :class="picked.reusable ? 'ok' : 'copy'">
        <i :class="picked.reusable ? 'fas fa-link' : 'fas fa-copy'" />
        {{ picked.reusable ? '이 회사를 대리점으로 연결합니다 (회사정보에 같은 회사가 둘 생기지 않습니다)' : '유형이 달라 회사 정보만 복사되고 대리점 회사가 따로 만들어집니다' }}
      </span>
      <button type="button" class="btn-link" @click="clear">
        다시 고르기
      </button>
    </div>

    <template v-else>
      <div class="search-row">
        <input
          v-model="keyword"
          type="search"
          class="form-input"
          placeholder="회사명 또는 사업자번호로 회사정보에서 찾기"
          enterkeyhint="search"
          @keyup.enter.prevent="search"
        >
        <button type="button" class="btn-secondary" :disabled="loading" @click="search">
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-search'" /> 검색
        </button>
      </div>
      <p v-if="message" class="text-muted small msg">
        {{ message }}
        <NuxtLink v-if="showRegisterLink" to="/admin/basic-info/company/register" target="_blank" class="register-link">
          <i class="fas fa-external-link-alt" /> 회사정보 등록
        </NuxtLink>
      </p>
      <ul v-if="options.length > 0" class="options">
        <li v-for="o in options" :key="o.companyId">
          <button type="button" class="option" @click="pick(o)">
            <span class="opt-name">{{ o.companyName }}</span>
            <span class="opt-meta">
              <span class="type-badge" :class="o.reusable ? 'ok' : 'copy'">{{ typeLabel(o.companyType) }}</span>
              {{ formatBizno(o.businessNumber) }}<template v-if="o.representative">
                · {{ o.representative }}
              </template>
            </span>
            <span v-if="o.address" class="opt-addr">{{ o.address }} {{ o.detailAddress || '' }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { agencyService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import type { AgencyCompanyCandidate } from '~/types/agency'

defineProps<{
  /** 이미 고른 회사 (부모가 들고 있다) */
  picked: AgencyCompanyCandidate | null
}>()

const emit = defineEmits<{
  selected: [company: AgencyCompanyCandidate]
  cleared: []
}>()

const keyword = ref('')
const options = ref<AgencyCompanyCandidate[]>([])
const loading = ref(false)
const message = ref('')
const showRegisterLink = ref(false)

const TYPE_LABELS: Record<string, string> = {
  PARTNER: '협력사',
  OTHER: '기타',
  AGENCY: '대리점',
  MANUFACTURER: '제조사',
  BUILDER: '건설사',
  DESIGN_OFFICE: '설계사무소',
  CARRIER: '운송사'
}
const typeLabel = (t: string | null) => (t && TYPE_LABELS[t]) || '유형 없음'

const formatBizno = (b?: string | null) => {
  const d = (b || '').replace(/[^0-9]/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : (b || '사업자번호 없음')
}

/** 늦게 도착한 이전 검색 결과가 새 결과를 덮지 않게 */
let seq = 0

const search = async () => {
  const kw = keyword.value.trim()
  showRegisterLink.value = false
  if (kw.length < 2) {
    options.value = []
    message.value = kw.length === 0 ? '' : '두 글자 이상 넣으세요.'
    return
  }
  const my = ++seq
  loading.value = true
  message.value = ''
  try {
    const res = await agencyService.searchCompanyCandidates(kw)
    if (my !== seq) { return }
    options.value = res
    if (res.length === 0) {
      message.value = '회사정보에 없는 회사입니다. 회사정보에서 먼저 등록(유형: 협력사 또는 기타)한 뒤 다시 검색하세요.'
      showRegisterLink.value = true
    }
  } catch (e) {
    if (my === seq) { message.value = toApiError(e).message }
  } finally {
    if (my === seq) { loading.value = false }
  }
}

// 입력하면 잠깐 뒤 자동 검색
let timer: ReturnType<typeof setTimeout> | null = null
watch(keyword, () => {
  if (timer) { clearTimeout(timer) }
  timer = setTimeout(search, 350)
})
onBeforeUnmount(() => { if (timer) { clearTimeout(timer) } })

const pick = (o: AgencyCompanyCandidate) => {
  emit('selected', o)
  options.value = []
  keyword.value = ''
  message.value = ''
  showRegisterLink.value = false
}

const clear = () => emit('cleared')
</script>

<style scoped>
.agency-company-picker {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.search-row {
  display: flex;
  gap: 0.375rem;
}

.search-row .form-input {
  flex: 1;
  min-width: 0;
}

.search-row button {
  white-space: nowrap;
}

.picked {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
}

.picked-main {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}

.picked-name {
  font-weight: 600;
  color: #1e40af;
}

.link-note {
  flex-basis: 100%;
  font-size: 0.75rem;
}

.link-note.ok {
  color: #166534;
}

.link-note.copy {
  color: #92400e;
}

.btn-link {
  margin-left: auto;
  min-height: 32px;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 0.8125rem;
  cursor: pointer;
}

.msg {
  margin: 0;
}

.register-link {
  margin-left: 0.25rem;
  color: #2563eb;
  font-weight: 600;
  white-space: nowrap;
}

.options {
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.option {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.option:hover {
  background: #f8fafc;
}

.opt-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.opt-meta,
.opt-addr {
  font-size: 0.75rem;
  color: #64748b;
}

.type-badge {
  margin-right: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.type-badge.ok {
  background: #dcfce7;
  color: #166534;
}

.type-badge.copy {
  background: #fef3c7;
  color: #92400e;
}

.small {
  font-size: 0.75rem;
}
</style>
