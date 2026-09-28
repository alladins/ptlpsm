<!--
  명함에서 담당자 고르기 (인라인) — 영업·견적의 [명함선택] 팝업 대신
  - 버튼을 누르면 바로 아래에 목록이 펼쳐진다: 고른 고객 소속의 명함 먼저, 검색어로 내 명함 전체에서도
  - 고르면 selected 이벤트로 명함을 넘긴다 (담당자명·연락처·이메일, 소속이 비어 있으면 소속까지 채우는 건 부모가)
  - 영업담당자는 서버 규칙대로 자기가 등록한 명함만 보인다
-->
<template>
  <div class="card-picker">
    <button type="button" class="btn-action btn-secondary pick-btn" :aria-expanded="open" @click="toggle">
      <i class="fas fa-address-card" /> {{ open ? '닫기' : '명함 불러오기' }}
    </button>

    <div v-if="open" class="panel">
      <!-- 무엇을 하는 곳인지 먼저 보여준다 — 버튼만으로는 알기 어렵다는 의견(09-28) -->
      <div class="panel-head">
        <strong><i class="fas fa-address-card" /> 저장된 명함에서 담당자 고르기</strong>
        <button type="button" class="close-btn" aria-label="닫기" @click="open = false">
          <i class="fas fa-times" />
        </button>
      </div>
      <p class="guide small">
        명함관리에 저장해 둔 담당자를 고르면 <b>담당자명·연락처·이메일</b>이 자동으로 채워집니다.
      </p>
      <input
        v-model="keyword"
        type="search"
        class="form-input"
        placeholder="담당자명·연락처로 찾기"
        enterkeyhint="search"
      >
      <p class="scope text-muted small">
        {{ scopeText }}
      </p>
      <p v-if="loading" class="text-muted small">
        <i class="fas fa-spinner fa-spin" /> 불러오는 중...
      </p>
      <p v-else-if="cards.length === 0" class="text-muted small">
        {{ emptyText }}
      </p>
      <ul v-else class="options">
        <li v-for="c in cards" :key="c.cardId">
          <button type="button" class="option" @click="pick(c)">
            <span class="opt-name">{{ c.contactNm }}</span>
            <span class="opt-meta">{{ c.dminsttNm || '-' }}<template v-if="c.contactTel"> · {{ c.contactTel }}</template></span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { businessCardService, type BusinessCardResponse, type OrgType } from '~/services/business-card.service'

const props = defineProps<{
  orgType?: OrgType | null
  dminsttCd?: string | null
  companyId?: number | null
  /** 기타(직접 입력) 소속명 */
  orgName?: string | null
}>()

const emit = defineEmits<{ selected: [card: BusinessCardResponse] }>()

const open = ref(false)
const keyword = ref('')
const cards = ref<BusinessCardResponse[]>([])
const loading = ref(false)

/** 고른 고객 소속으로 좁힐 수 있는지 */
const orgFilter = computed(() => {
  if (props.orgType === 'DEMAND_ORG' && props.dminsttCd) { return { dminsttCd: props.dminsttCd } }
  if (props.orgType === 'SUPPLIER' && props.companyId) { return { orgType: 'SUPPLIER' as OrgType, companyId: props.companyId } }
  if (props.orgType === 'ETC' && props.orgName?.trim()) { return { orgType: 'ETC' as OrgType, dminsttNm: props.orgName.trim() } }
  return null
})

const scopeText = computed(() => {
  if (keyword.value.trim()) { return '내 명함 전체에서 찾는 중' }
  return orgFilter.value ? '고른 소속의 명함' : '고객 소속을 먼저 고르면 그 소속 명함이 먼저 보입니다'
})

const emptyText = computed(() => {
  if (keyword.value.trim()) { return '찾는 명함이 없습니다.' }
  // 소속을 안 골랐으면 안내(scopeText)만으로 충분 — «이 소속» 문구는 모순
  return orgFilter.value ? '이 소속의 명함이 없습니다. 검색어를 넣으면 내 명함 전체에서 찾습니다.' : ''
})

let seq = 0
const load = async () => {
  const kw = keyword.value.trim()
  const my = ++seq
  loading.value = true
  try {
    const params = kw ? { keyword: kw } : (orgFilter.value || null)
    if (!params) {
      cards.value = []
      return
    }
    const res = await businessCardService.getBusinessCardList({ ...params, page: 0, size: 30 })
    if (my === seq) { cards.value = res.content || [] }
  } catch (e) {
    if (my === seq) { cards.value = [] }
  } finally {
    if (my === seq) { loading.value = false }
  }
}

const toggle = () => {
  open.value = !open.value
  if (open.value) { load() }
}

let timer: ReturnType<typeof setTimeout> | null = null
watch(keyword, () => {
  if (timer) { clearTimeout(timer) }
  timer = setTimeout(load, 350)
})
onBeforeUnmount(() => { if (timer) { clearTimeout(timer) } })

const pick = (c: BusinessCardResponse) => {
  emit('selected', c)
  open.value = false
  keyword.value = ''
}
</script>

<style scoped>
.card-picker {
  display: contents;
}

.pick-btn {
  white-space: nowrap;
  min-height: 40px;
}

.panel {
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.375rem;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.panel-head i {
  color: #475569;
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.close-btn:hover {
  background: #e2e8f0;
}

.guide {
  margin: 0;
  color: #475569;
}

.scope {
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
  background: #fff;
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

.option:hover,
.option:active {
  background: #f1f5f9;
}

.opt-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.opt-meta {
  font-size: 0.75rem;
  color: #64748b;
}

.small {
  font-size: 0.75rem;
}
</style>
