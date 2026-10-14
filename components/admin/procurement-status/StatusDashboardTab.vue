<template>
  <div class="ps-dashboard">
    <!-- 조건 -->
    <div class="filter-bar">
      <label class="filter-item">
        <span>연도</span>
        <select v-model.number="year" class="form-select" :disabled="loading" @change="load">
          <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
        </select>
      </label>
      <label class="filter-item">
        <span>품명</span>
        <select v-model="target" class="form-select" :disabled="loading" @change="load">
          <option value="">전체</option>
          <option v-for="t in dash?.targets || []" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
      <label class="filter-item">
        <span>지도 기준</span>
        <select v-model="corp" class="form-select" :disabled="loading">
          <option value="">시장 전체</option>
          <option v-for="c in corpsRanked" :key="c.corpBizno || ''" :value="c.corpBizno || ''">
            {{ c.corpNm }}{{ isSelf(c.corpBizno) ? ' (자사)' : '' }}
          </option>
        </select>
      </label>
      <span v-if="dash?.dataAsOf" class="as-of">데이터 기준 {{ dash.dataAsOf }}</span>
    </div>

    <GuideNotice icon="fa-info-circle" tone="info" open-label="기준·한계 자세히" class="ps-guide">
      <template #summary>
        나라장터 <b>쇼핑몰 납품요구</b> 기준 · 연도는 <b>최초 접수일</b> · 금액은 <b>최종 변경(감액·취소) 반영</b>
      </template>
      <ul class="guide-list">
        <li>수요기관이 나라장터 쇼핑몰에서 낸 <b>납품요구</b>만 셉니다. 공사 안에서 직접 산 자재나 쇼핑몰 밖 계약은 들어 있지 않습니다.</li>
        <li><b>업체</b>는 조달청에 등록된 계약업체 기준입니다. 실제 제조사와 다를 수 있습니다.</li>
        <li>변경(감액·증액·취소)이 다음 해에 들어와도 <b>처음 접수한 연도</b>에 반영됩니다. 그래서 지난 연도 금액도 조금씩 바뀔 수 있습니다.</li>
        <li>지역은 <b>수요기관 소재지</b>입니다. 도청처럼 시군구가 없는 기관은 시도 단위로만 셉니다.</li>
        <li>매일 아침 전날까지 접수된 건을 받습니다.</li>
        <li v-if="dash?.coveredFromYear">
          <b>{{ dash.coveredFromYear }}년부터</b> 모았습니다. 그 전 연도는 보여주지 않습니다(변경만 들어온 일부 건뿐이라).
        </li>
      </ul>
    </GuideNotice>

    <div v-if="loading && !dash" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>불러오는 중...</p>
    </div>
    <div v-else-if="error" class="no-data-message">
      <i class="fas fa-exclamation-triangle" />
      <p>{{ error }}</p>
    </div>
    <div v-else-if="dash && corpsRanked.length === 0" class="no-data-message">
      <i class="fas fa-inbox" />
      <p>{{ year }}년 데이터가 없습니다.</p>
    </div>

    <template v-else-if="dash">
      <!-- 요약 -->
      <div class="kpi-row">
        <div class="kpi">
          <div class="kpi-label">
            시장 총액 ({{ year }})
          </div>
          <div class="kpi-value">
            {{ formatEok(total) }}
          </div>
          <div class="kpi-sub">
            납품요구 {{ formatNumber(totalReqs) }}건 · 업체 {{ corpsRanked.length }}곳
          </div>
        </div>
        <div class="kpi kpi-self">
          <div class="kpi-label">
            리드파워
          </div>
          <div class="kpi-value">
            {{ self ? formatEok(self.amount) : '0억' }}
          </div>
          <div class="kpi-sub">
            <template v-if="self">
              점유율 {{ pct(self.share) }} · {{ self.rank }}위 · {{ formatNumber(self.reqCount) }}건
            </template>
            <template v-else>
              {{ year }}년 납품요구 없음
            </template>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label">
            1위 업체
          </div>
          <div class="kpi-value kpi-name">
            {{ corpsRanked[0]?.corpNm || '-' }}
          </div>
          <div class="kpi-sub">
            {{ formatEok(corpsRanked[0]?.amount) }} · 점유율 {{ pct(corpsRanked[0]?.share) }}
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label">
            리드파워 최다 지역
          </div>
          <div class="kpi-value kpi-name">
            {{ selfTopSido ? sidoName(selfTopSido.sidoCd) : '-' }}
          </div>
          <div class="kpi-sub">
            <template v-if="selfTopSido">
              {{ formatEok(selfTopSido.self) }} · 그 지역 점유율 {{ pct(selfTopSido.selfShare) }}
            </template>
            <template v-else>
              -
            </template>
          </div>
        </div>
      </div>

      <!-- 지도 + 오른쪽 표 -->
      <div class="map-grid">
        <section class="panel">
          <h3 class="panel-title">
            <i class="fas fa-map-marked-alt" /> 시도별 {{ corp ? corpLabel : '시장 규모' }}
            <span class="panel-hint">지역을 누르면 시군구가 나옵니다</span>
          </h3>
          <SidoMap :values="sidoValues" :selected="selectedSido" :label="corp ? corpLabel : '시장 전체'" :height="mapHeight" @select="selectSido" />
        </section>

        <section class="panel">
          <!-- 시도를 고르면 그 시도의 시군구, 아니면 업체 순위 -->
          <template v-if="selectedSido">
            <h3 class="panel-title">
              <i class="fas fa-map-pin" /> {{ sidoName(selectedSido) }} 시군구별
              <button type="button" class="btn-link" @click="selectSido(null)">
                <i class="fas fa-times" /> 전국으로
              </button>
            </h3>
            <div v-if="sigunguLoading" class="loading-message small">
              <i class="fas fa-spinner fa-spin" />
            </div>
            <!-- 업체마다 열 (그 시도 금액순, 많으면 «기타») — 행마다 1위 금액은 굵게 -->
            <div v-else class="table-scroll">
              <table class="data-table compact">
                <thead>
                  <tr>
                    <th>시군구</th>
                    <th class="num">
                      합계
                    </th>
                    <th
                      v-for="c in sigunguCols"
                      :key="c.key"
                      class="num"
                      :class="{ 'self-head': isSelf(c.key) }"
                      :title="c.nm"
                    >
                      {{ c.key === OTHERS_KEY ? '기타' : shortCorp(c.nm) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in sigunguPivot" :key="r.key">
                    <td class="nowrap">
                      {{ r.name }}
                    </td>
                    <td class="num" :title="formatCurrency(r.total)">
                      {{ formatEok(r.total, 2) }}
                    </td>
                    <td
                      v-for="c in sigunguCols"
                      :key="c.key"
                      class="num"
                      :class="{
                        'self-cell': isSelf(c.key) && (r.byCol[c.key] || 0) > 0,
                        strong: c.key !== OTHERS_KEY && (r.byCol[c.key] || 0) > 0 && r.byCol[c.key] === r.topAmt
                      }"
                      :title="r.byCol[c.key] ? formatCurrency(r.byCol[c.key]) : ''"
                    >
                      {{ r.byCol[c.key] ? formatEok(r.byCol[c.key], 2) : '-' }}
                    </td>
                  </tr>
                  <tr v-if="sigunguPivot.length === 0">
                    <td :colspan="2 + sigunguCols.length" class="empty">
                      데이터 없음
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" class="btn-link more" @click="emit('open-items', { year, target, sidoCd: selectedSido })">
              <i class="fas fa-list" /> {{ sidoName(selectedSido) }} 납품요구 목록 보기
            </button>
          </template>

          <template v-else>
            <h3 class="panel-title">
              <i class="fas fa-trophy" /> 업체 순위 ({{ year }})
            </h3>
            <table class="data-table compact">
              <thead>
                <tr>
                  <th class="center">
                    순위
                  </th>
                  <th>업체</th>
                  <th class="num">
                    금액
                  </th>
                  <th class="num">
                    점유율
                  </th>
                  <th class="num">
                    건수
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in corpsRanked"
                  :key="c.corpBizno || ''"
                  :class="{ 'self-row': isSelf(c.corpBizno) }"
                  class="clickable"
                  @click="corp = corp === (c.corpBizno || '') ? '' : (c.corpBizno || '')"
                >
                  <td class="center">
                    {{ c.rank }}
                  </td>
                  <td class="ellipsis">
                    {{ c.corpNm }}
                    <span v-if="isSelf(c.corpBizno)" class="self-tag">자사</span>
                    <i v-if="corp === c.corpBizno" class="fas fa-map-marked-alt on-map" title="지도에 표시 중" />
                  </td>
                  <td class="num" :title="formatCurrency(c.amount)">
                    {{ formatEok(c.amount, 2) }}
                  </td>
                  <td class="num">
                    {{ pct(c.share) }}
                  </td>
                  <td class="num">
                    {{ formatNumber(c.reqCount) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="table-hint">
              업체를 누르면 지도가 그 업체 금액으로 바뀝니다.
            </p>
          </template>
        </section>
      </div>

      <!-- 연도별 추이 -->
      <section class="panel">
        <h3 class="panel-title">
          <i class="fas fa-chart-bar" /> 연도별 업체 금액 (억 원)
        </h3>
        <div class="trend-wrap">
          <TopChartPanel :data="trendMatrix" initial-type="stacked-bar" :toolbar="['stacked-bar', 'bar', 'line']" :height="300" />
        </div>
      </section>

      <!-- 시도 × 업체 -->
      <section class="panel">
        <h3 class="panel-title">
          <i class="fas fa-table" /> 시도 × 업체 ({{ year }}, 억 원)
        </h3>
        <div class="table-scroll">
          <table class="data-table compact sido-table">
            <thead>
              <tr>
                <th>시도</th>
                <th class="num">
                  합계
                </th>
                <th v-for="c in pivotCorps" :key="c.corpBizno || ''" class="num" :class="{ 'self-head': isSelf(c.corpBizno) }">
                  {{ shortCorp(c.corpNm) }}
                </th>
                <th v-if="hasOthers" class="num">
                  기타
                </th>
                <th class="num">
                  리드파워 점유율
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in sidoPivot"
                :key="r.sidoCd"
                class="clickable"
                :class="{ 'row-selected': r.sidoCd === selectedSido }"
                @click="selectSido(r.sidoCd)"
              >
                <td>{{ sidoName(r.sidoCd) }}</td>
                <td class="num strong">
                  {{ formatEok(r.total, 2) }}
                </td>
                <td v-for="c in pivotCorps" :key="c.corpBizno || ''" class="num" :class="{ 'self-cell': isSelf(c.corpBizno) && (r.byCorp[c.corpBizno || ''] || 0) > 0 }">
                  {{ r.byCorp[c.corpBizno || ''] ? formatEok(r.byCorp[c.corpBizno || ''], 2) : '-' }}
                </td>
                <td v-if="hasOthers" class="num">
                  {{ r.others ? formatEok(r.others, 2) : '-' }}
                </td>
                <td class="num">
                  {{ r.total > 0 ? pct(r.self / r.total) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 조달 영업 현황 › 현황 탭 — 요약 · 시도 지도 · 업체 순위/시군구 · 연도별 추이 · 시도×업체
 * 서버는 업체 단위 행만 주고, 점유율·순위·피벗은 여기서 계산한다.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import TopChartPanel from '~/components/ui/TopChartPanel.vue'
import SidoMap from '~/components/admin/procurement-status/SidoMap.vue'
import { procurementStatusService } from '~/services/procurement-status.service'
import { formatCurrency, formatNumber } from '~/utils/format'
import { SIDO_ORDER, formatEok, sidoName } from '~/types/procurement-status'
import type { MallDashboard, MallItemSearchParams, MallStatRow } from '~/types/procurement-status'

const emit = defineEmits<{ 'open-items': [filter: MallItemSearchParams] }>()

/** 시도×업체 표에 열로 보여줄 업체 수 (나머지는 «기타») */
const PIVOT_CORPS = 4
/** 연도별 추이에 따로 보여줄 업체 수 */
const TREND_CORPS = 5
const SELF_COLOR = '#f59e0b'
const TREND_COLORS = ['#2563eb', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b']

const dash = ref<MallDashboard | null>(null)
const loading = ref(false)
const error = ref('')
const year = ref<number | null>(null)
const target = ref('')
/** 지도 기준 업체 (빈 값 = 시장 전체) */
const corp = ref('')
const selectedSido = ref<string | null>(null)
const sigunguRows = ref<MallStatRow[]>([])
const sigunguLoading = ref(false)

const years = computed(() => dash.value?.years?.length ? dash.value.years : (year.value ? [year.value] : []))

const isSelf = (bizno?: string | null) => !!bizno && bizno === dash.value?.selfBizno

const pct = (v?: number | null) => (v === null || v === undefined || isNaN(v) ? '-' : `${(v * 100).toFixed(1)}%`)

/** «주식회사 리드파워» → «리드파워» (표 머리 폭 줄이기) */
const shortCorp = (name?: string | null) =>
  (name || '-').replace(/주식회사|\(주\)|㈜|유한회사/g, '').trim() || (name || '-')

const total = computed(() => (dash.value?.corps || []).reduce((s, c) => s + Number(c.amount || 0), 0))
const totalReqs = computed(() => (dash.value?.corps || []).reduce((s, c) => s + Number(c.reqCount || 0), 0))

const corpsRanked = computed(() =>
  [...(dash.value?.corps || [])]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .map((c, i) => ({ ...c, amount: Number(c.amount), rank: i + 1, share: total.value > 0 ? Number(c.amount) / total.value : 0 }))
)

const self = computed(() => corpsRanked.value.find(c => isSelf(c.corpBizno)) || null)

const corpLabel = computed(() => corpsRanked.value.find(c => c.corpBizno === corp.value)?.corpNm || '업체')

/** 지도 값: 시도 → 금액 (업체를 고르면 그 업체만) */
const sidoValues = computed(() => {
  const out: Record<string, number> = {}
  for (const r of dash.value?.sidoCorps || []) {
    if (!r.sidoCd) { continue }
    if (corp.value && r.corpBizno !== corp.value) { continue }
    out[r.sidoCd] = (out[r.sidoCd] || 0) + Number(r.amount || 0)
  }
  return out
})

const pivotCorps = computed(() => corpsRanked.value.slice(0, PIVOT_CORPS))
const hasOthers = computed(() => corpsRanked.value.length > PIVOT_CORPS)

const sidoPivot = computed(() => {
  const pivotSet = new Set(pivotCorps.value.map(c => c.corpBizno || ''))
  const map = new Map<string, { sidoCd: string, total: number, self: number, others: number, byCorp: Record<string, number> }>()
  for (const r of dash.value?.sidoCorps || []) {
    const code = r.sidoCd || ''
    if (!map.has(code)) { map.set(code, { sidoCd: code, total: 0, self: 0, others: 0, byCorp: {} }) }
    const row = map.get(code)!
    const amt = Number(r.amount || 0)
    const key = r.corpBizno || ''
    row.total += amt
    if (isSelf(key)) { row.self += amt }
    if (pivotSet.has(key)) { row.byCorp[key] = (row.byCorp[key] || 0) + amt } else { row.others += amt }
  }
  const order = (c: string) => { const i = SIDO_ORDER.indexOf(c); return i < 0 ? 99 : i }
  return [...map.values()].sort((a, b) => order(a.sidoCd) - order(b.sidoCd))
})

/** 리드파워 금액이 가장 큰 시도 */
const selfTopSido = computed(() => {
  const best = sidoPivot.value.filter(r => r.self > 0).sort((a, b) => b.self - a.self)[0]
  return best ? { sidoCd: best.sidoCd, self: best.self, selfShare: best.total > 0 ? best.self / best.total : 0 } : null
})

/** 시군구 표 열 — 그 시도에 나온 업체 금액순. 넘치면 마지막 열을 «기타»로 (자사는 항상 따로) */
const SIGUNGU_CORP_COLS = 5
const OTHERS_KEY = '__others__'

const sigunguCols = computed(() => {
  const sum = new Map<string, { key: string, nm: string, amt: number }>()
  for (const r of sigunguRows.value) {
    const k = r.corpBizno || ''
    const cur = sum.get(k) || { key: k, nm: r.corpNm || '-', amt: 0 }
    cur.amt += Number(r.amount || 0)
    sum.set(k, cur)
  }
  const ranked = [...sum.values()].sort((a, b) => b.amt - a.amt)
  if (ranked.length <= SIGUNGU_CORP_COLS) { return ranked }
  const shown = ranked.slice(0, SIGUNGU_CORP_COLS - 1)
  const selfCol = ranked.find(c => isSelf(c.key))
  if (selfCol && !shown.includes(selfCol)) { shown[shown.length - 1] = selfCol }
  return [...shown, { key: OTHERS_KEY, nm: '기타', amt: 0 }]
})

const sigunguPivot = computed(() => {
  const colKeys = new Set(sigunguCols.value.map(c => c.key))
  const hasOthers = colKeys.has(OTHERS_KEY)
  const map = new Map<string, { key: string, name: string, total: number, byCol: Record<string, number>, corpAmt: Record<string, number> }>()
  for (const r of sigunguRows.value) {
    const key = r.sigunguCd || '-'
    if (!map.has(key)) { map.set(key, { key, name: r.sigunguNm || '(시도 단위 기관)', total: 0, byCol: {}, corpAmt: {} }) }
    const row = map.get(key)!
    const amt = Number(r.amount || 0)
    const ck = r.corpBizno || ''
    row.total += amt
    row.corpAmt[ck] = (row.corpAmt[ck] || 0) + amt
    const col = colKeys.has(ck) ? ck : (hasOthers ? OTHERS_KEY : ck)
    row.byCol[col] = (row.byCol[col] || 0) + amt
  }
  return [...map.values()]
    // 1위 = 업체 하나의 금액 기준 («기타» 묶음은 1위로 치지 않는다)
    .map(r => ({ ...r, topAmt: Math.max(0, ...Object.values(r.corpAmt)) }))
    .sort((a, b) => b.total - a.total)
})

/** 연도별 추이 — 전 기간 금액 상위 업체 + 자사는 항상, 나머지 «기타» (억 원) */
const trendMatrix = computed(() => {
  const rows = dash.value?.yearCorps || []
  const yearsAsc = [...new Set(rows.map(r => Number(r.year)))].filter(y => !isNaN(y)).sort((a, b) => a - b)
  const sumBy = new Map<string, { nm: string, amt: number }>()
  for (const r of rows) {
    const k = r.corpBizno || ''
    sumBy.set(k, { nm: r.corpNm || '-', amt: (sumBy.get(k)?.amt || 0) + Number(r.amount || 0) })
  }
  const ranked = [...sumBy.entries()].sort((a, b) => b[1].amt - a[1].amt).map(([k]) => k)
  const shown = ranked.slice(0, TREND_CORPS)
  const selfKey = dash.value?.selfBizno || ''
  if (selfKey && sumBy.has(selfKey) && !shown.includes(selfKey)) { shown.push(selfKey) }
  const toEok = (v: number) => Math.round(v / 1000000) / 100
  const valueOf = (y: number, k: string) => rows
    .filter(r => Number(r.year) === y && (r.corpBizno || '') === k)
    .reduce((s, r) => s + Number(r.amount || 0), 0)
  let colorIdx = 0
  const series = shown.map(k => ({
    name: shortCorp(sumBy.get(k)?.nm),
    values: yearsAsc.map(y => toEok(valueOf(y, k))),
    color: k === selfKey ? SELF_COLOR : TREND_COLORS[colorIdx++ % TREND_COLORS.length]
  }))
  const others = ranked.filter(k => !shown.includes(k))
  if (others.length) {
    series.push({
      name: '기타',
      values: yearsAsc.map(y => toEok(others.reduce((s, k) => s + valueOf(y, k), 0))),
      color: '#cbd5e1'
    })
  }
  return { categories: yearsAsc.map(y => `${y}년`), series }
})

async function load () {
  loading.value = true
  error.value = ''
  try {
    dash.value = await procurementStatusService.getDashboard(year.value, target.value || null)
    year.value = dash.value.year
    // 지도 기준 업체가 이번 연도에 없으면 시장 전체로
    if (corp.value && !dash.value.corps.some(c => c.corpBizno === corp.value)) { corp.value = '' }
    if (selectedSido.value) { await loadSigungu() }
  } catch (e) {
    error.value = (e as Error).message || '조달 현황을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function loadSigungu () {
  if (!selectedSido.value || !year.value) { sigunguRows.value = []; return }
  sigunguLoading.value = true
  try {
    sigunguRows.value = await procurementStatusService.getSigungu(year.value, selectedSido.value, target.value || null)
  } catch (e) {
    console.error('시군구 조회 실패:', e)
    sigunguRows.value = []
  } finally {
    sigunguLoading.value = false
  }
}

function selectSido (code: string | null) {
  selectedSido.value = code
  loadSigungu()
}

// 지도 높이 — 좁은 화면은 낮게
const mapHeight = ref(460)
const fitMap = () => { mapHeight.value = window.innerWidth <= 600 ? 340 : 460 }

onMounted(() => {
  fitMap()
  window.addEventListener('resize', fitMap)
  load()
})
onBeforeUnmount(() => window.removeEventListener('resize', fitMap))
</script>

<style scoped>
@import '@/assets/css/admin-tables.css';

.ps-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.875rem;
  color: #475569;
}

.form-select {
  min-height: 40px;
  padding: 0.375rem 0.625rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  font-size: 0.875rem;
}

.as-of {
  margin-left: auto;
  font-size: 0.8125rem;
  color: #64748b;
}

.guide-list {
  margin: 0;
  padding-left: 1.1rem;
  line-height: 1.7;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.kpi {
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.kpi-self {
  border-color: #fcd34d;
  background: #fffbeb;
}

.kpi-label {
  font-size: 0.8125rem;
  color: #64748b;
}

.kpi-value {
  margin-top: 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.kpi-name {
  font-size: 1.05rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-sub {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #475569;
}

.map-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

.panel {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  min-width: 0;
}

.panel-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.panel-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8;
}

.btn-link {
  min-height: 44px;
  padding: 0 0.5rem;
  border: none;
  background: none;
  color: #2563eb;
  font-size: 0.8125rem;
  cursor: pointer;
}

.panel-title .btn-link {
  margin-left: auto;
}

.btn-link.more {
  margin-top: 0.25rem;
}

.data-table.compact th,
.data-table.compact td {
  padding: 0.5rem 0.625rem;
  font-size: 0.8125rem;
}

.num {
  text-align: right;
  white-space: nowrap;
}

.center {
  text-align: center;
}

.nowrap {
  white-space: nowrap;
}

.strong {
  font-weight: 600;
}

.ellipsis {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  text-align: center;
  color: #94a3b8;
}

.clickable {
  cursor: pointer;
}

.clickable:hover td {
  background: #f8fafc;
}

.self-row td,
.self-cell {
  background: #fffbeb;
  font-weight: 600;
}

.self-head {
  color: #b45309;
}

.row-selected td {
  background: #eff6ff;
}

.self-tag {
  margin-left: 0.25rem;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background: #f59e0b;
  color: #fff;
  font-size: 0.6875rem;
}

.on-map {
  margin-left: 0.25rem;
  color: #2563eb;
}

.table-hint {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.table-scroll {
  overflow-x: auto;
}

.sido-table {
  min-width: 640px;
}

.trend-wrap {
  min-height: 300px;
}

.loading-message.small {
  padding: 1rem;
  text-align: center;
}

@media (max-width: 1100px) {
  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .map-grid {
    grid-template-columns: 1fr;
  }

  .as-of {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }

  .filter-item {
    width: 100%;
  }

  .filter-item .form-select {
    flex: 1;
  }

  .ellipsis {
    max-width: 140px;
  }
}
</style>
