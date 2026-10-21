const totalCost = computed(() => amountOf('MANUFACTURER'))
const totalCostRatio = computed(() => shareOf('MANUFACTURER')?.ratio || 0)<template>
  <div class="distribution-dashboard">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="수익 배분 대시보드"
      icon="chart"
      icon-color="purple"
      description="고른 기간 안에 발생한 매출(출하 기준)과 그 원가로 수익 배분을 봅니다."
    >
      <template #actions>
        <div class="period-selector">
          <select v-model="selectedPeriodId" class="period-select" @change="loadDistribution">
            <option v-for="p in periodOptions" :key="p.periodId" :value="p.periodId">
              {{ p.periodName }}
            </option>
          </select>
        </div>
      </template>
    </PageHeader>

    <GuideNotice summary="고른 기간 안에 출하한 매출과 그 출하분의 원가로 나눕니다(입금과 무관). 남는 몫이 에코암스 몫입니다.">
      <ul>
        <li><b>매출</b> = 기간 안에 출하한 물품 금액 합계(출하일 기준, 메인 대시보드 «총 매출금액»과 같음). 배분은 부가세를 뺀 금액(÷ 1.1)으로 합니다.</li>
        <li><b>제조사 원가</b> = 같은 출하분의 물품 원가 + 운송비입니다. 원가 단가를 고치면 다음 조회부터 바로 반영됩니다.</li>
        <li><b>본사·영업담당자·인증관리·유지보수</b> = 매출 × 커미션율 설정의 비율입니다.</li>
        <li><b>에코암스</b> = 매출 − 제조사 원가(운송비 포함) − 위 고정 몫. 원가가 높은 달은 마이너스가 될 수 있습니다(빨간색).</li>
      </ul>
    </GuideNotice>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" />
      <p>대시보드 데이터를 불러오는 중...</p>
    </div>

    <div v-else-if="loadError" class="load-error">
      <i class="fas fa-exclamation-circle" />
      {{ loadError }}
    </div>

    <div v-else-if="dist" class="content-section">
      <!-- 주요 지표 카드 -->
      <div class="kpi-section">
        <div class="kpi-card primary">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-chart-line" />
            </div>
            <span class="kpi-label">매출 (부가세 제외)</span>
          </div>
          <div class="kpi-value">
            {{ formatCurrency(dist.netSales) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">부가세 포함 {{ formatCurrency(dist.grossSales) }}</span>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-industry" />
            </div>
            <span class="kpi-label">제조사 원가 (운송비 포함)</span>
          </div>
          <div class="kpi-value">
            {{ formatCurrency(totalCost) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">매출의 {{ formatRatio(totalCostRatio) }}</span>
          </div>
        </div>

        <div class="kpi-card success" :class="{ negative: agentShare && agentShare.amount < 0 }">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-hand-holding-usd" />
            </div>
            <span class="kpi-label">에코암스 몫 (남는 몫)</span>
          </div>
          <div class="kpi-value" :class="{ 'amount-negative': agentShare && agentShare.amount < 0 }">
            {{ formatCurrency(agentShare?.amount || 0) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">매출의 {{ formatRatio(agentShare?.ratio || 0) }}</span>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-header">
            <div class="kpi-icon">
              <i class="fas fa-calendar-check" />
            </div>
            <span class="kpi-label">기간</span>
          </div>
          <div class="kpi-value tier-value">
            {{ formatShortDate(dist.startDate) }} ~ {{ formatShortDate(dist.endDate) }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-sub">출하 {{ dist.shipmentCount }}건</span>
          </div>
        </div>
      </div>

      <!-- 배분 구조 섹션 -->
      <div class="share-structure-card">
        <div class="share-header">
          <h3 class="section-title">
            <i class="fas fa-chart-pie" />
            수익 배분 구조
          </h3>
          <div class="tier-info">
            <div class="tier-badge">
              <i class="fas fa-tag" />
              {{ dist.tierName || '기본 구간' }}
            </div>
            <div class="tier-tooltip">
              <i class="fas fa-info-circle tier-info-icon" />
              <span class="tier-desc">고정 비율은 매출 구간({{ getTierRange() }})의 설정을 씁니다</span>
            </div>
          </div>
        </div>
        <div class="share-content">
          <div class="share-chart-wrapper">
            <TopChartPanel
              :data="shareMatrix"
              initial-type="doughnut"
              :toolbar="['doughnut', 'pie']"
              legend="none"
              :colors="shareColors"
              :height="220"
            />
          </div>
          <div class="share-legend">
            <div v-for="(s, index) in dist.shares" :key="s.key" class="legend-row">
              <span class="legend-dot" :style="{ background: shareColors[index] }" />
              <span class="legend-name">{{ s.name }}</span>
              <span class="legend-rate">
                {{ s.configuredRate !== null ? `${s.configuredRate}%` : formatRatio(s.ratio) }}
              </span>
              <span class="legend-amount" :class="{ 'amount-negative': s.amount < 0 }">{{ formatCurrency(s.amount) }}</span>
              <span class="legend-status" :class="s.configuredRate !== null ? 'kind-fixed' : 'kind-actual'">
                {{ s.configuredRate !== null ? '고정 비율' : (s.key === 'AGENT' ? '남는 몫' : '실제 원가') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 차트 영역 -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3 class="chart-title">
            <i class="fas fa-chart-bar" />
            월별 매출 및 배분 (출하일 기준)
          </h3>
          <div class="chart-wrapper">
            <TopChartPanel
              :data="monthlyMatrix"
              initial-type="stacked-bar"
              :toolbar="['stacked-bar', 'bar', 'line']"
              :colors="shareColors"
              :decorate="decorateMonthly"
              height="100%"
            />
          </div>
        </div>

        <div class="chart-card">
          <h3 class="chart-title">
            <i class="fas fa-balance-scale" />
            월별 에코암스 몫
          </h3>
          <div class="chart-wrapper bar">
            <TopChartPanel
              :data="agentMatrix"
              initial-type="bar"
              :toolbar="['bar', 'line']"
              :colors="[shareColors[5]]"
              :decorate="decorateAgent"
              height="100%"
            />
          </div>
        </div>
      </div>

      <!-- 월별 상세 테이블 -->
      <div class="detail-table-card">
        <h3 class="table-title">
          <i class="fas fa-calendar-alt" />
          월별 수익 배분 상세
        </h3>
        <div class="table-container">
          <table class="detail-table">
            <thead>
              <tr>
                <th>월</th>
                <th>매출(부가세 제외)</th>
                <th class="stakeholder-col manufacturer">
                  제조사 원가(운송비 포함)
                </th>
                <th class="stakeholder-col manufacturer" :title="`원가 ÷ 매출(부가세 제외). ${breakEvenRatio}% 를 넘으면 에코암스 몫이 마이너스`">
                  원가율
                </th>
                <th class="stakeholder-col headquarters">
                  본사 {{ rateOf('HEADQUARTERS') }}%
                </th>
                <th class="stakeholder-col partner">
                  영업 {{ rateOf('PARTNER') }}%
                </th>
                <th class="stakeholder-col certification">
                  인증 {{ rateOf('CERTIFICATION') }}%
                </th>
                <th class="stakeholder-col maintenance">
                  유지보수 {{ rateOf('MAINTENANCE') }}%
                </th>
                <th class="stakeholder-col agent">
                  에코암스
                </th>
                <th class="stakeholder-col agent" title="에코암스 몫 ÷ 매출(부가세 제외). 원가율이 오르면 그만큼 줄어든다">
                  에코암스 비율
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="dist.months.length === 0">
                <td colspan="10" class="text-center empty-cell">
                  이 기간에 출하가 없습니다.
                </td>
              </tr>
              <tr v-for="m in dist.months" :key="m.yearMonth">
                <td class="month-cell">
                  <span class="month-badge">{{ formatYearMonth(m.yearMonth) }}</span>
                </td>
                <td class="text-right">
                  {{ formatCurrency(m.netSales) }}
                </td>
                <td class="text-right manufacturer">
                  {{ formatCurrency(m.manufacturerCost) }}
                </td>
                <td class="text-right manufacturer" :class="{ 'amount-negative': costRatioOf(m) > breakEvenRatio }">
                  {{ formatRatio(costRatioOf(m)) }}
                </td>
                <td class="text-right headquarters">
                  {{ formatCurrency(m.headquarters) }}
                </td>
                <td class="text-right partner">
                  {{ formatCurrency(m.partner) }}
                </td>
                <td class="text-right certification">
                  {{ formatCurrency(m.certification) }}
                </td>
                <td class="text-right maintenance">
                  {{ formatCurrency(m.maintenance) }}
                </td>
                <td class="text-right agent" :class="{ 'amount-negative': m.agent < 0 }">
                  {{ formatCurrency(m.agent) }}
                </td>
                <td class="text-right agent" :class="{ 'amount-negative': m.agent < 0 }">
                  {{ formatRatio(agentRatioOf(m)) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="text-center">
                  <strong>합계</strong>
                </td>
                <td class="text-right">
                  <strong>{{ formatCurrency(dist.netSales) }}</strong>
                </td>
                <template v-for="key in TABLE_SHARE_KEYS" :key="key">
                  <td class="text-right" :class="[SHARE_CLASS[key], { 'amount-negative': amountOf(key) < 0 }]">
                    <strong>{{ formatCurrency(amountOf(key)) }}</strong>
                  </td>
                  <td v-if="key === 'MANUFACTURER'" class="text-right manufacturer" :class="{ 'amount-negative': totalCostRatio > breakEvenRatio }">
                    <strong>{{ formatRatio(totalCostRatio) }}</strong>
                  </td>
                  <td v-if="key === 'AGENT'" class="text-right agent" :class="{ 'amount-negative': amountOf('AGENT') < 0 }">
                    <strong>{{ formatRatio(agentShare?.ratio || 0) }}</strong>
                  </td>
                </template>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- 빠른 링크 -->
      <div class="quick-links">
        <NuxtLink to="/admin/system/commission-rates" class="quick-link-card">
          <div class="link-icon blue">
            <i class="fas fa-percentage" />
          </div>
          <div class="link-content">
            <span class="link-title">지분율 설정</span>
            <span class="link-desc">본사·영업·인증·유지보수 비율</span>
          </div>
          <i class="fas fa-chevron-right" />
        </NuxtLink>
        <NuxtLink to="/admin/commission/settlements" class="quick-link-card">
          <div class="link-icon green">
            <i class="fas fa-list-alt" />
          </div>
          <div class="link-content">
            <span class="link-title">정산 이력</span>
            <span class="link-desc">지분자별 정산 현황</span>
          </div>
          <i class="fas fa-chevron-right" />
        </NuxtLink>
        <NuxtLink to="/admin/commission/monthly-snapshots" class="quick-link-card">
          <div class="link-icon orange">
            <i class="fas fa-calendar-check" />
          </div>
          <div class="link-content">
            <span class="link-title">월별 수익배분</span>
            <span class="link-desc">월별 누적매출 기준 수익배분 현황</span>
          </div>
          <i class="fas fa-chevron-right" />
        </NuxtLink>
        <NuxtLink to="/admin/commission/payments" class="quick-link-card">
          <div class="link-icon purple">
            <i class="fas fa-credit-card" />
          </div>
          <div class="link-content">
            <span class="link-title">지급 관리</span>
            <span class="link-desc">지분자별 지급 이력 관리</span>
          </div>
          <i class="fas fa-chevron-right" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatCurrency } from '~/utils/format'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import type { CommissionDistribution, DistributionShareKey } from '~/types/commission'
import { getCommissionDistribution, getCommissionPeriods } from '~/services/commission.service'

definePageMeta({
  layout: 'admin',
  pageTitle: '수익 배분 대시보드'
})

/**
 * 수익 배분 대시보드 — 기간 안에 발생한 매출 기준 (2026-10-21 리드파워 결정)
 * 예전에는 «입금액 × 고정 비율(제조사 60% 포함)» 이었고 비율 합이 105% 라 배분액이 매출보다 컸다.
 * 이제 매출 = 기간 안 출하 금액(입금 무관), 제조사 원가 = 같은 출하분 원가 + 운송비, 에코암스 = 남는 몫. 계산은 서버(CommissionCostService).
 */

// 배분 행 색상 — 서버 shares 순서(제조사 원가(운송비 포함)·본사·영업·인증·유지보수·에코암스)와 같다
const shareColors = ['#6366f1', '#3b82f6', '#f59e0b', '#8B5CF6', '#EC4899', '#10b981']
const TABLE_SHARE_KEYS: DistributionShareKey[] = ['MANUFACTURER', 'HEADQUARTERS', 'PARTNER', 'CERTIFICATION', 'MAINTENANCE', 'AGENT']
const SHARE_CLASS: Record<DistributionShareKey, string> = {
  MANUFACTURER: 'manufacturer',
  HEADQUARTERS: 'headquarters',
  PARTNER: 'partner',
  CERTIFICATION: 'certification',
  MAINTENANCE: 'maintenance',
  AGENT: 'agent'
}

// 정산기간
interface PeriodOption {
  periodId: number
  periodName: string
}
const periodOptions = ref<PeriodOption[]>([])
const selectedPeriodId = ref<number | undefined>(undefined)

const dist = ref<CommissionDistribution | null>(null)
const loading = ref(false)
const loadError = ref('')

async function loadPeriods () {
  try {
    const periods = await getCommissionPeriods()
    periodOptions.value = periods.map((p: any) => ({ periodId: p.periodId, periodName: p.periodName }))
    const active = periods.find((p: any) => p.isActive)
    selectedPeriodId.value = active ? active.periodId : periodOptions.value[0]?.periodId
  } catch (error) {
    console.error('정산기간 목록 조회 실패:', error)
  }
}

async function loadDistribution () {
  loading.value = true
  loadError.value = ''
  try {
    dist.value = await getCommissionDistribution(selectedPeriodId.value)
  } catch (error: any) {
    console.error('수익배분 조회 실패:', error)
    dist.value = null
    loadError.value = error?.message || '수익배분을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const shareOf = (key: DistributionShareKey) => dist.value?.shares.find(s => s.key === key)
const amountOf = (key: DistributionShareKey) => shareOf(key)?.amount || 0
const rateOf = (key: DistributionShareKey) => shareOf(key)?.configuredRate ?? 0

const agentShare = computed(() => shareOf('AGENT'))
const totalCost = computed(() => amountOf('MANUFACTURER'))
const totalCostRatio = computed(() => shareOf('MANUFACTURER')?.ratio || 0)

const formatRatio = (v: number) => `${Number(v).toFixed(2)}%`
const formatShortDate = (d: string) => d.slice(2).replace(/-/g, '.')
const formatYearMonth = (ym: string) => `${ym.slice(2, 4)}년 ${Number(ym.slice(5, 7))}월`

const getTierRange = () => {
  if (!dist.value) { return '-' }
  const min = formatCurrency(dist.value.tierMinAmount || 0)
  const max = dist.value.tierMaxAmount ? formatCurrency(dist.value.tierMaxAmount) : '무제한'
  return `${min} ~ ${max}`
}

// 도넛 — 마이너스 몫(에코암스 적자)은 비율로 그릴 수 없어 0 으로 그린다 (금액은 범례에 그대로)
const shareMatrix = computed(() => {
  const shares = dist.value?.shares || []
  return {
    categories: shares.map(s => s.name),
    series: [{ name: '매출 대비(%)', values: shares.map(s => Math.max(0, s.ratio)) }]
  }
})

const monthlyMatrix = computed(() => {
  const months = dist.value?.months || []
  const pick: [keyof CommissionDistribution['months'][number], string, number][] = [
    ['manufacturerCost', '제조사 원가', 0],
    ['headquarters', '본사', 1],
    ['partner', '영업', 2],
    ['certification', '인증', 3],
    ['maintenance', '유지보수', 4],
    ['agent', '에코암스', 5]
  ]
  return {
    categories: months.map(m => formatYearMonth(m.yearMonth)),
    series: pick.map(([field, name, ci]) => ({
      name,
      values: months.map(m => Number(m[field]) || 0),
      color: shareColors[ci]
    }))
  }
})

// 원가율 = 제조사 원가(운송비 포함) ÷ 매출(부가세 제외)
type DistributionMonth = CommissionDistribution['months'][number]
const costRatioOf = (m: DistributionMonth) => {
  const net = Number(m.netSales) || 0
  return net === 0 ? 0 : (Number(m.manufacturerCost) || 0) * 100 / net
}
// 에코암스 비율 = 에코암스 몫(남는 몫) ÷ 매출(부가세 제외) — 원가율이 오르내리는 만큼 월마다 달라진다
const agentRatioOf = (m: DistributionMonth) => {
  const net = Number(m.netSales) || 0
  return net === 0 ? 0 : (Number(m.agent) || 0) * 100 / net
}
// 손익분기 원가율 = 100 − 고정 몫(본사·영업·인증·유지보수) 합. 넘으면 에코암스 몫이 마이너스
const breakEvenRatio = computed(() => {
  const fixed = (['HEADQUARTERS', 'PARTNER', 'CERTIFICATION', 'MAINTENANCE'] as DistributionShareKey[])
    .reduce((sum, key) => sum + Number(rateOf(key)), 0)
  return 100 - fixed
})

// 누적막대 꼭대기에 그달 원가율 표시 — 보이지 않는 선 시리즈를 막대 위(양수 합)에 두고 라벨만 그린다
function decorateMonthly (opt: any, type: string) {
  if (type !== 'stacked-bar' || !Array.isArray(opt.series)) { return }
  // 휴대폰 폭에서는 막대 12개 위에 다 못 얹는다 — 아래 표의 원가율 칸으로 본다
  if (window.innerWidth < 640) { return }
  const months = dist.value?.months || []
  const tops = months.map((_, i) => opt.series.reduce((sum: number, s: any) => sum + Math.max(0, Number(s.data?.[i]) || 0), 0))
  opt.legend = { ...(opt.legend ?? {}), data: opt.series.map((s: any) => s.name) }
  opt.series.push({
    name: '원가율',
    type: 'line',
    data: months.map((m, i) => ({ value: tops[i], ratio: costRatioOf(m) })),
    symbolSize: 0,
    lineStyle: { opacity: 0 },
    silent: true,
    tooltip: { show: false },
    z: 10,
    // 좁은 화면에서 라벨끼리 겹치면 겹친 것만 숨긴다 (값은 아래 표에 있다)
    labelLayout: { hideOverlap: true },
    label: {
      show: true,
      position: 'top',
      formatter: (p: any) => `{${p.data.ratio > breakEvenRatio.value ? 'over' : 'ok'}|원가 ${p.data.ratio.toFixed(1)}%}`,
      rich: {
        ok: { color: '#4b5563', fontSize: 11, fontWeight: 600 },
        over: { color: '#dc2626', fontSize: 11, fontWeight: 700 }
      }
    }
  })
}

// 에코암스 막대 끝에 그달 에코암스 비율 표시 — 플러스는 막대 위, 마이너스는 막대 아래
function decorateAgent (opt: any, type: string) {
  const s = Array.isArray(opt.series) ? opt.series[0] : null
  if (type !== 'bar' || !s) { return }
  const months = dist.value?.months || []
  // 막대 끝 라벨이 축 글자와 겹치지 않게 위아래 여백
  opt.yAxis = { ...(opt.yAxis ?? {}), boundaryGap: ['12%', '12%'] }
  s.data = months.map(m => ({ value: m.agent, label: { position: m.agent < 0 ? 'bottom' : 'top' } }))
  s.labelLayout = { hideOverlap: true }
  s.label = {
    show: true,
    formatter: (p: any) => {
      const ratio = agentRatioOf(months[p.dataIndex])
      return `{${ratio < 0 ? 'neg' : 'pos'}|${ratio.toFixed(1)}%}`
    },
    rich: {
      pos: { color: '#059669', fontSize: 10, fontWeight: 600 },
      neg: { color: '#dc2626', fontSize: 10, fontWeight: 700 }
    }
  }
}

const agentMatrix = computed(() => {
  const months = dist.value?.months || []
  return {
    categories: months.map(m => formatYearMonth(m.yearMonth)),
    series: [{ name: '에코암스 몫', values: months.map(m => m.agent), color: shareColors[5] }]
  }
})

onMounted(async () => {
  await loadPeriods()
  await loadDistribution()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

/* 정산기간 선택 */
.period-selector {
  display: flex;
  align-items: center;
}

.period-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  background: white;
  cursor: pointer;
}

/* 실원가 수익배분 (2026-10-21) */
.period-selector {
  gap: 0.5rem;
}

.load-error {
  padding: 1.5rem;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
}

.amount-negative {
  color: #dc2626 !important;
}

.legend-status.kind-fixed {
  background: #eff6ff;
  color: #1d4ed8;
}

.legend-status.kind-actual {
  background: #f1f5f9;
  color: #475569;
}

.empty-cell {
  padding: 2rem !important;
  color: #9ca3af;
}

.detail-table th.certification,
.certification { color: #8b5cf6; font-weight: 600; }
.detail-table th.maintenance,
.maintenance { color: #ec4899; font-weight: 600; }

/* 로딩 컨테이너 - 색상 커스터마이징 */
.loading-container i {
  color: #6366f1;
}

/* KPI 섹션 */
.kpi-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  padding: 1.5rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.kpi-card.primary::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.kpi-card.info::before { background: linear-gradient(90deg, #6366f1, #818cf8); }
.kpi-card.success::before { background: linear-gradient(90deg, #10b981, #34d399); }
.kpi-card.warning::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 1.125rem;
}

.kpi-card.primary .kpi-icon { background: #eff6ff; color: #3b82f6; }
.kpi-card.info .kpi-icon { background: #eef2ff; color: #6366f1; }
.kpi-card.success .kpi-icon { background: #f0fdf4; color: #10b981; }
.kpi-card.warning .kpi-icon { background: #fffbeb; color: #f59e0b; }

.kpi-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.kpi-value.tier-value {
  font-size: 1.25rem;
  color: #6366f1;
}

.kpi-footer {
  font-size: 0.8125rem;
}

.kpi-sub { color: #9ca3af; }
.kpi-progress { color: #10b981; font-weight: 600; }
.kpi-remaining { color: #f59e0b; font-weight: 600; }

/* 지분율 구조 카드 */
.share-structure-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #6366f1;
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #eef2ff;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6366f1;
}

/* 구간 배지 + 설명 감싸는 컨테이너 */
.tier-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 구간 설명 아이콘 + 텍스트 래퍼 */
.tier-tooltip {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 정보 아이콘 */
.tier-info-icon {
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: help;
}

/* 구간 설명 텍스트 */
.tier-desc {
  font-size: 0.75rem;
  color: #94a3b8;
}

.share-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: center;
}

.share-chart-wrapper {
  position: relative;
}

.share-legend {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.legend-row {
  display: grid;
  grid-template-columns: 12px 230px 70px 1fr 90px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.85rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-name {
  font-weight: 600;
  white-space: nowrap; /* «제조사 원가(운송비 포함)» 가 두 줄로 꺾이지 않게 */
  color: #374151;
}

.legend-rate {
  font-weight: 700;
  color: #6366f1;
}

.legend-amount {
  text-align: right;
  padding-right: 3rem; /* 금액을 조금 왼쪽으로 — 상태 표시와 붙어 보이지 않게 */
  font-weight: 600;
  color: #1f2937;
}

.legend-status {
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.legend-status.completed {
  background: #dcfce7;
  color: #16a34a;
}

.legend-status.partial {
  background: #fef3c7;
  color: #d97706;
}

.legend-status.pending {
  background: #fee2e2;
  color: #dc2626;
}

/* 차트 그리드 */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.chart-card .chart-title {
  flex-shrink: 0;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-title i {
  color: #6366f1;
}

.chart-wrapper {
  flex: 1;
  min-height: 260px;
  position: relative;
}

.chart-wrapper.bar {
  min-height: 260px;
}

/* 상세 테이블 */
.detail-table-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.table-title i {
  color: #6366f1;
}

.table-container {
  overflow-x: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  padding: 0.875rem 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.detail-table th.stakeholder-col {
  font-size: 0.75rem;
}

/* 금액·비율 칸 제목은 숫자와 같은 오른쪽 끝에 맞춘다 (월 칸만 가운데) */
.detail-table thead th:not(:first-child) {
  text-align: right;
}

.detail-table th.manufacturer { color: #6366f1; }
.detail-table th.headquarters { color: #3b82f6; }
.detail-table th.agent { color: #10b981; }
.detail-table th.partner { color: #f59e0b; }

.detail-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.8125rem;
}

.detail-table tr:hover {
  background: #f9fafb;
}

.detail-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.text-right { text-align: right; }
.text-center { text-align: center; }

.month-cell {
  text-align: center;
}

.month-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 12px;
  font-weight: 600;
  color: #374151;
}

.manufacturer { color: #6366f1; font-weight: 600; }
.headquarters { color: #3b82f6; font-weight: 600; }
.agent { color: #10b981; font-weight: 600; }
.partner { color: #f59e0b; font-weight: 600; }

/* 지급 상태 배지 */
.payment-status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.payment-status-badge.completed {
  background: #dcfce7;
  color: #16a34a;
}

.payment-status-badge.partial {
  background: #fef3c7;
  color: #d97706;
}

.payment-status-badge.pending {
  background: #fee2e2;
  color: #dc2626;
}

/* 빠른 링크 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: all 0.2s;
}

.quick-link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 1.25rem;
}

.link-icon.blue { background: #eff6ff; color: #3b82f6; }
.link-icon.green { background: #f0fdf4; color: #10b981; }
.link-icon.purple { background: #eef2ff; color: #6366f1; }
.link-icon.orange { background: #fff7ed; color: #f97316; }

.link-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.link-title {
  font-weight: 600;
  color: #1f2937;
}

.link-desc {
  font-size: 0.8125rem;
  color: #6b7280;
}

.quick-link-card > i {
  color: #d1d5db;
}

/* 반응형 */
@media (max-width: 1280px) {
  .kpi-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .share-content {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .share-content {
    grid-template-columns: 1fr;
  }

  .share-chart-wrapper {
    max-width: 280px;
    margin: 0 auto;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .kpi-section {
    grid-template-columns: 1fr;
  }

  .legend-row {
    grid-template-columns: 16px 1fr 50px;
    gap: 0.5rem;
  }

  .legend-amount,
  .legend-status {
    display: none;
  }
}
</style>
