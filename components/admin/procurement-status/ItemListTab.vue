<template>
  <div class="ps-items">
    <div class="filter-bar">
      <select v-model="filter.year" class="form-select" @change="search(0)">
        <option value="">
          전체 연도
        </option>
        <option v-for="y in years" :key="y" :value="y">
          {{ y }}년
        </option>
      </select>
      <select v-model="filter.target" class="form-select" @change="search(0)">
        <option value="">
          전체 품명
        </option>
        <option v-for="t in targets" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
      <select v-model="filter.sidoCd" class="form-select" @change="clearScope()">
        <option value="">
          전체 지역
        </option>
        <option v-for="c in SIDO_ORDER" :key="c" :value="c">
          {{ sidoName(c) }}
        </option>
      </select>
      <select v-model="filter.corpBizno" class="form-select" @change="search(0)">
        <option value="">
          전체 업체
        </option>
        <option v-for="c in corps" :key="c.corpBizno || ''" :value="c.corpBizno || ''">
          {{ c.corpNm }}
        </option>
      </select>
      <input
        v-model.trim="filter.keyword"
        class="form-input"
        type="search"
        placeholder="납품요구번호·납품요구명·수요기관"
        @keyup.enter="search(0)"
      >
      <button type="button" class="btn btn-primary" :disabled="loading" @click="search(0)">
        <i class="fas fa-search" /> 검색
      </button>
    </div>

    <!-- 현황 탭에서 시군구·기관을 눌러 들어온 범위 (목록 위 선택 상자에는 없는 조건) -->
    <div v-if="filter.scopeLabel" class="scope-chip">
      <i class="fas fa-map-pin" /> {{ filter.scopeLabel }}
      <button type="button" class="scope-clear" title="범위 풀기" @click="clearScope">
        <i class="fas fa-times" /> 풀기
      </button>
    </div>

    <div class="result-head">
      <span>총 <b>{{ formatNumber(page.totalElements) }}</b>건 (품목 행)</span>
      <span v-if="sumAmount !== null" class="sum">이 페이지 합계 {{ formatEok(sumAmount, 2) }}</span>
    </div>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>불러오는 중...</p>
    </div>
    <div v-else-if="error" class="no-data-message">
      <i class="fas fa-exclamation-triangle" />
      <p>{{ error }}</p>
    </div>
    <div v-else-if="page.content.length === 0" class="no-data-message">
      <i class="fas fa-search" />
      <p>조건에 맞는 납품요구가 없습니다.</p>
    </div>
    <div v-else class="table-container">
      <!-- 휴대폰: 카드 -->
      <ul class="m-card-list m-narrow-only">
        <li v-for="it in page.content" :key="`c-${it.dlvrReqNo}-${it.prdctSno}`">
          <div class="m-card">
            <div class="m-card-head">
              <span class="m-card-title">{{ it.dlvrReqNm || it.dlvrReqNo }}</span>
              <span class="amt">{{ formatEok(it.amt, 2) }}</span>
            </div>
            <div class="m-card-meta">
              {{ it.dminsttNm || '-' }} · {{ it.dminsttRgnNm || sidoName(it.sidoCd) }}
            </div>
            <div class="m-card-meta" :class="{ 'self-text': isSelf(it.corpBizno) }">
              {{ it.corpNm || '-' }} · {{ it.firstRcptDate || it.lastRcptDate || '-' }}
            </div>
            <div class="m-card-meta">
              {{ it.dtilPrdctClsfcNm || it.prdctClsfcNm || '-' }} · {{ formatQty(it) }}
              <span v-if="it.chgOrd > 0" class="chg">변경 {{ it.chgOrd }}차</span>
            </div>
          </div>
        </li>
      </ul>
      <table class="data-table m-wide-only">
        <thead>
          <tr>
            <th>최초 접수일</th>
            <th>납품요구번호</th>
            <th>납품요구명</th>
            <th>수요기관</th>
            <th>지역</th>
            <th>업체</th>
            <th>세부품명</th>
            <th class="num">
              수량
            </th>
            <th class="num">
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in page.content" :key="`${it.dlvrReqNo}-${it.prdctSno}`" :class="{ 'self-row': isSelf(it.corpBizno) }">
            <td class="nowrap">
              {{ it.firstRcptDate || it.lastRcptDate || '-' }}
            </td>
            <td class="nowrap">
              {{ it.dlvrReqNo }}<span class="sno">-{{ it.prdctSno }}</span>
              <span v-if="it.chgOrd > 0" class="chg" :title="`마지막 변경 접수일 ${it.lastRcptDate}`">변경 {{ it.chgOrd }}차</span>
            </td>
            <td class="ellipsis" :title="it.dlvrReqNm || ''">
              {{ it.dlvrReqNm || '-' }}
            </td>
            <td class="ellipsis" :title="it.dminsttNm || ''">
              {{ it.dminsttNm || '-' }}
            </td>
            <td class="nowrap">
              {{ it.dminsttRgnNm || sidoName(it.sidoCd) }}
            </td>
            <td class="ellipsis">
              {{ it.corpNm || '-' }}
            </td>
            <td class="ellipsis" :title="it.prdctIdntNm || ''">
              {{ it.dtilPrdctClsfcNm || it.prdctClsfcNm || '-' }}
            </td>
            <td class="num">
              {{ formatQty(it) }}
            </td>
            <td class="num" :title="formatCurrency(it.amt)">
              {{ formatNumber(it.amt) }}
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="page.totalPages > 1"
        :current-page="page.page"
        :total-pages="page.totalPages"
        :disabled="loading"
        @change="search"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 조달 영업 현황 › 상세 목록 — 납품요구 품목 행 (최종 차수 금액)
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Pagination from '~/components/ui/Pagination.vue'
import { procurementStatusService } from '~/services/procurement-status.service'
import { formatCurrency, formatNumber } from '~/utils/format'
import { SIDO_ORDER, formatEok, sidoName } from '~/types/procurement-status'
import type { MallDlvrReqItem, MallItemPage, MallItemSearchParams, MallStatRow } from '~/types/procurement-status'

interface Props {
  /** 현황 탭에서 넘어온 조건 (시도 등) */
  initialFilter?: MallItemSearchParams | null
  years: number[]
  targets: string[]
  corps: MallStatRow[]
  selfBizno: string | null
}

const props = withDefaults(defineProps<Props>(), { initialFilter: null })

const PAGE_SIZE = 50

const filter = reactive<{ year: number | '', target: string, sidoCd: string, sigunguCd: string, dminsttNaroCd: string, scopeLabel: string, corpBizno: string, keyword: string }>({
  year: '',
  target: '',
  sidoCd: '',
  sigunguCd: '',
  dminsttNaroCd: '',
  scopeLabel: '',
  corpBizno: '',
  keyword: ''
})

const page = ref<MallItemPage>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: PAGE_SIZE })
const loading = ref(false)
const error = ref('')

const isSelf = (bizno?: string | null) => !!bizno && bizno === props.selfBizno

const sumAmount = computed(() => page.value.content.length
  ? page.value.content.reduce((s, it) => s + Number(it.amt || 0), 0)
  : null)

const formatQty = (it: MallDlvrReqItem) =>
  it.qty === null || it.qty === undefined ? '-' : `${formatNumber(it.qty)}${it.unit ? ' ' + it.unit : ''}`

function applyInitial (f?: MallItemSearchParams | null) {
  if (!f) { return }
  filter.year = f.year ?? ''
  filter.target = f.target ?? ''
  filter.sidoCd = f.sidoCd ?? ''
  filter.sigunguCd = f.sigunguCd ?? ''
  filter.dminsttNaroCd = f.dminsttNaroCd ?? ''
  filter.scopeLabel = f.scopeLabel ?? ''
  filter.corpBizno = f.corpBizno ?? ''
  filter.keyword = ''
}

/** 시군구·기관 범위만 풀고 시도는 그대로 */
function clearScope () {
  filter.sigunguCd = ''
  filter.dminsttNaroCd = ''
  filter.scopeLabel = ''
  search(0)
}

async function search (p = 0) {
  loading.value = true
  error.value = ''
  try {
    // scopeLabel 은 표시용이라 서버로 안 보낸다
    const params: MallItemSearchParams = { ...filter, page: p, size: PAGE_SIZE }
    delete params.scopeLabel
    page.value = await procurementStatusService.searchItems(params)
  } catch (e) {
    error.value = (e as Error).message || '목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

watch(() => props.initialFilter, (f) => { applyInitial(f); search(0) })

onMounted(() => {
  applyInitial(props.initialFilter)
  search(0)
})
</script>

<style scoped>
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-buttons.css';

.ps-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.form-select,
.form-input {
  min-height: 40px;
  padding: 0.375rem 0.625rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  font-size: 0.875rem;
}

/* 공통 CSS 가 선택 상자를 width:100% 로 잡아 한 줄에 하나씩 쌓였다 → 내용 폭으로 (2026-10-14) */
.filter-bar .form-select {
  width: auto;
  flex: 0 0 auto;
  min-width: 120px;
}

.form-input {
  flex: 1;
  min-width: 200px;
  width: auto;
}

.filter-bar .btn {
  flex: 0 0 auto;
  white-space: nowrap;
}

.scope-chip {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  align-self: flex-start;
  max-width: 100%;
  padding: 0.25rem 0.25rem 0.25rem 0.75rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 0.8125rem;
}

.scope-clear {
  min-height: 36px;
  padding: 0 0.625rem;
  border: none;
  border-radius: 999px;
  background: none;
  color: #2563eb;
  font-size: 0.8125rem;
  cursor: pointer;
}

.scope-clear:hover {
  background: #dbeafe;
}

.result-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
}

.num {
  text-align: right;
  white-space: nowrap;
}

.nowrap {
  white-space: nowrap;
}

.ellipsis {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sno {
  color: #94a3b8;
}

.chg {
  margin-left: 0.25rem;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.6875rem;
}

.self-row td {
  background: #fffbeb;
}

.self-text {
  color: #b45309;
  font-weight: 600;
}

.amt {
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .filter-bar > * {
    flex: 1 1 45%;
  }

  .form-input {
    flex-basis: 100%;
  }
}
</style>
