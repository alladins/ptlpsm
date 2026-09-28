<!--
  수요기관 검색·선택 (인라인) — 명함 소속 «수요기관»
  - 입력하면 잠깐 뒤 자동 검색(두 글자 이상), 결과를 눌러 고른다. 팝업 없이 한 자리에서 끝나 모바일에서도 쓰기 쉽다
  - 조달업체 선택(SupplierSelector)과 같은 모양 — 2026-09-28 사용자 요청
  - 기존 DemandOrganizationSelector(팝업형)는 견적·수주 화면에서 그대로 쓴다
-->
<template>
  <div class="org-picker">
    <div v-if="selectedName" class="picked">
      <span class="picked-name"><i class="fas fa-landmark" /> {{ selectedName }}</span>
      <button type="button" class="btn-link" @click="emit('cleared')">
        다시 고르기
      </button>
    </div>

    <template v-else>
      <div class="search-row">
        <input
          v-model="keyword"
          type="search"
          class="form-input"
          placeholder="수요기관명을 입력하세요 (예: 순천시, 김천고등학교)"
          enterkeyhint="search"
          @keyup.enter.prevent="search"
        >
        <i v-if="loading" class="fas fa-spinner fa-spin spin" />
      </div>
      <p v-if="message" class="text-muted small msg">
        {{ message }}
      </p>
      <ul v-if="options.length > 0" class="options">
        <li v-for="o in options" :key="o.dminsttCd">
          <button type="button" class="option" @click="pick(o)">
            <span class="opt-name">{{ o.dminsttNm }}</span>
            <span v-if="o.adrs" class="opt-addr">{{ o.adrs }}</span>
          </button>
        </li>
      </ul>
      <p v-if="totalElements > options.length" class="text-muted small msg">
        {{ totalElements }}곳 중 {{ options.length }}곳 — 더 자세히 입력하면 좁혀집니다.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { demandOrganizationService, type DemandOrganization } from '~/services/demand-organization.service'

defineProps<{
  /** 이미 고른 기관 이름 (수정 화면) */
  selectedName?: string | null
}>()

const emit = defineEmits<{
  selected: [org: DemandOrganization]
  cleared: []
}>()

const keyword = ref('')
const options = ref<DemandOrganization[]>([])
const totalElements = ref(0)
const loading = ref(false)
const message = ref('')

/** 늦게 도착한 이전 검색 결과가 새 결과를 덮지 않게 */
let seq = 0

const search = async () => {
  const kw = keyword.value.trim()
  if (kw.length < 2) {
    options.value = []
    totalElements.value = 0
    message.value = kw.length === 0 ? '' : '두 글자 이상 입력하세요.'
    return
  }
  const my = ++seq
  loading.value = true
  message.value = ''
  try {
    const res = await demandOrganizationService.searchDemandOrganizations({
      searchKeyword: kw,
      page: 0,
      size: 15,
      sortBy: 'dminsttNm',
      sortDirection: 'asc'
    })
    if (my !== seq) { return }
    options.value = res.content || []
    totalElements.value = res.totalElements || 0
    if (options.value.length === 0) {
      message.value = '찾는 수요기관이 없습니다. 이름을 줄여서 넣어 보세요 (예: «순천시»).'
    }
  } catch (e) {
    if (my === seq) { message.value = '수요기관 검색에 실패했습니다.' }
  } finally {
    if (my === seq) { loading.value = false }
  }
}

// 입력하면 잠깐 뒤 자동 검색 (타자마다 부르지 않게)
let timer: ReturnType<typeof setTimeout> | null = null
watch(keyword, () => {
  if (timer) { clearTimeout(timer) }
  timer = setTimeout(search, 350)
})
onBeforeUnmount(() => { if (timer) { clearTimeout(timer) } })

const pick = (o: DemandOrganization) => {
  emit('selected', o)
  options.value = []
  totalElements.value = 0
  keyword.value = ''
  message.value = ''
}
</script>

<style scoped>
.org-picker {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.search-row {
  position: relative;
}

.search-row .form-input {
  width: 100%;
}

.spin {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  color: #94a3b8;
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
  max-height: 260px;
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

.option:hover,
.option:active {
  background: #f8fafc;
}

.opt-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.opt-addr {
  font-size: 0.75rem;
  color: #64748b;
}

.small {
  font-size: 0.75rem;
}
</style>
