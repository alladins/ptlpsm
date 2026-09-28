<!--
  조달업체 검색·선택 (명함 소속 «조달업체»)
  - 업체명·사업자번호로 회사 마스터(설계사무소·건설사 등)를 찾고, 없으면 사업자번호 10자리로 나라장터를 조회한다
  - 고르면 selected 이벤트로 업체를 넘긴다. 이미 고른 업체는 modelValue(표시용 이름)로 보여 준다
  - ⚠ 조달업체관리(전체 동기화)가 생기면 서버 검색 대상만 바뀐다 — 이 컴포넌트는 그대로
-->
<template>
  <div class="supplier-selector">
    <div v-if="selectedName" class="picked">
      <span class="picked-name"><i class="fas fa-building" /> {{ selectedName }}</span>
      <span v-if="selectedBizno" class="text-muted small">{{ formatBizno(selectedBizno) }}</span>
      <button type="button" class="btn-link" @click="clear">
        다시 고르기
      </button>
    </div>

    <template v-else>
      <div class="search-row">
        <input
          v-model="keyword"
          type="text"
          class="form-input"
          placeholder="업체명 또는 사업자번호 (나라장터는 사업자번호로만 조회됩니다)"
          @keyup.enter.prevent="search"
        >
        <button type="button" class="btn-action btn-secondary" :disabled="loading" @click="search">
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-search'" /> 검색
        </button>
      </div>
      <p v-if="message" class="text-muted small msg">
        {{ message }}
      </p>
      <ul v-if="options.length > 0" class="options">
        <li v-for="o in options" :key="`${o.source}-${o.companyId ?? o.bizno}`">
          <button type="button" class="option" @click="pick(o)">
            <span class="opt-name">{{ o.companyName }}</span>
            <span class="opt-meta">
              <span class="src-badge" :class="o.source === 'G2B' ? 'g2b' : typeClass(o.companyType)">
                {{ o.source === 'G2B' ? '나라장터' : typeLabel(o.companyType) }}
              </span>
              {{ formatBizno(o.bizno) }}<template v-if="o.representative">
                · {{ o.representative }}
              </template>
            </span>
            <span v-if="o.address" class="opt-addr">{{ o.address }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { businessCardService, type SupplierOption } from '~/services/business-card.service'
import { toApiError } from '~/utils/api-error'

defineProps<{
  /** 이미 고른 업체 이름 (수정 화면) */
  selectedName?: string | null
  selectedBizno?: string | null
}>()

const emit = defineEmits<{
  selected: [option: SupplierOption]
  cleared: []
}>()

const keyword = ref('')
const options = ref<SupplierOption[]>([])
const loading = ref(false)
const message = ref('')

const TYPE_LABELS: Record<string, string> = {
  DESIGN_OFFICE: '설계사무소',
  BUILDER: '건설사',
  MANUFACTURER: '제조사',
  CARRIER: '운송사'
}
const typeLabel = (t: string | null) => (t && TYPE_LABELS[t]) || '회사'
const typeClass = (t: string | null) => (t === 'DESIGN_OFFICE' ? 'design' : 'company')

const formatBizno = (b?: string | null) => {
  const d = (b || '').replace(/[^0-9]/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : (b || '-')
}

/** 늦게 도착한 이전 검색 결과가 새 결과를 덮지 않게 */
let seq = 0

const search = async () => {
  const kw = keyword.value.trim()
  if (kw.length < 2) {
    options.value = []
    message.value = kw.length === 0 ? '' : '두 글자 이상 넣으세요.'
    return
  }
  const my = ++seq
  loading.value = true
  message.value = ''
  try {
    const res = await businessCardService.searchSuppliers(kw)
    if (my !== seq) { return }
    options.value = res
    if (options.value.length === 0) {
      message.value = kw.replace(/[^0-9]/g, '').length === 10
        ? '나라장터에도 없는 사업자번호입니다. 업체명만 알면 «기타»로 넣으세요.'
        : '찾는 업체가 없습니다. 사업자번호 10자리로 검색하면 나라장터에서 찾아봅니다.'
    }
  } catch (e) {
    if (my === seq) { message.value = toApiError(e).message }
  } finally {
    if (my === seq) { loading.value = false }
  }
}

// 입력하면 잠깐 뒤 자동 검색 (수요기관 선택과 같은 동작)
let timer: ReturnType<typeof setTimeout> | null = null
watch(keyword, () => {
  if (timer) { clearTimeout(timer) }
  timer = setTimeout(search, 350)
})
onBeforeUnmount(() => { if (timer) { clearTimeout(timer) } })

const pick = (o: SupplierOption) => {
  emit('selected', o)
  options.value = []
  keyword.value = ''
  message.value = ''
}

const clear = () => {
  emit('cleared')
}

</script>

<style scoped>
.supplier-selector {
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

.picked {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
}

.picked-name {
  font-weight: 600;
  color: #1e40af;
}

.btn-link {
  margin-left: auto;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 0.8125rem;
  cursor: pointer;
}

.msg {
  margin: 0;
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

.src-badge {
  margin-right: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.src-badge.design {
  background: #f3e8ff;
  color: #6b21a8;
}

.src-badge.company {
  background: #f1f5f9;
  color: #475569;
}

.src-badge.g2b {
  background: #dcfce7;
  color: #166534;
}

.small {
  font-size: 0.75rem;
}
</style>
