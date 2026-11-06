<template>
  <section class="region-panel">
    <div class="region-head">
      <h2>
        <i class="fas fa-map-marked-alt" />
        지역별 현황
      </h2>
      <div class="region-tabs" role="tablist">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="tab === t.key"
          :class="['region-tab', { active: tab === t.key }]"
          @click="changeTab(t.key)"
        >
          {{ t.label }}
          <span class="tab-count">{{ formatNumber(tabRows(t.key).length) }}</span>
        </button>
      </div>
    </div>

    <GuideNotice class="region-guide" tone="info" :summary="guideText" />

    <div v-if="loading" class="region-state">
      <i class="fas fa-spinner fa-spin" /> 지역별 현황을 불러오는 중...
    </div>
    <div v-else-if="loadError" class="region-state region-state-error">
      <i class="fas fa-exclamation-triangle" /> {{ loadError }}
    </div>
    <template v-else>
      <div class="region-scope">
        <button v-if="area" type="button" class="scope-back" @click="resetArea">
          <i class="fas fa-arrow-left" /> 전국
        </button>
        <strong>{{ scopeTitle }}</strong>
        <span class="scope-total">{{ formatNumber(listRows.length) }}건 · {{ formatCurrency(listAmount) }}</span>
        <button v-if="selectedSigungu" type="button" class="scope-clear" @click="selectedSigungu = null">
          시군구 선택 해제
        </button>
        <span v-if="unassigned.count > 0" class="scope-warn">
          지역을 찾지 못한 {{ formatNumber(unassigned.count) }}건({{ formatCurrency(unassigned.amount) }})은 지도에서 빠지고 전국 목록에만 보입니다
        </span>
      </div>

      <div class="region-visual">
        <RegionMap
          :area="area"
          :values="mapValues"
          :selected="selectedSigungu"
          :label="amountLabel"
          :height="520"
          @select="onSelect"
        />
        <div class="region-bars">
          <h3>{{ area ? '시군구별' : '시도별' }} {{ amountLabel }}</h3>
          <TopChartPanel
            v-if="barItems.length > 0"
            :data="barMatrix"
            initial-type="bar"
            legend="none"
            :toolbar="['bar', 'pie', 'doughnut', 'treemap']"
            :height="440"
            :decorate="showAllBarLabels"
          />
          <p v-else class="region-empty">
            데이터가 없습니다
          </p>
        </div>
      </div>

      <div class="region-table-wrap">
        <table class="region-table">
          <thead>
            <tr>
              <th v-if="tab === 'shipments'">
                출하번호
              </th>
              <th>납품요구번호</th>
              <th>수요기관</th>
              <th>지역</th>
              <th>{{ tab === 'orders' ? '납품요구일' : '출하일' }}</th>
              <th v-if="tab === 'orders'">
                계약금액
              </th>
              <th>출하금액</th>
              <th v-if="tab === 'shipments'">
                차량번호
              </th>
              <th>상태</th>
              <th v-if="tab === 'orders'">
                납품완료율
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listRows.length === 0">
              <td :colspan="8" class="region-empty">
                데이터가 없습니다
              </td>
            </tr>
            <tr v-for="row in listRows" :key="`${tab}-${row.id}`">
              <td v-if="tab === 'shipments'" class="cell-center">
                {{ row.shipmentNo || '-' }}
              </td>
              <td class="cell-center">
                {{ row.deliveryRequestNo }}
              </td>
              <td>{{ row.client }}</td>
              <td class="cell-region">
                {{ regionText(row) }}
                <span v-if="row.regionBasis === 'CLIENT'" class="basis-badge" title="아직 납품지가 없어 수요기관 주소로 표시했습니다">수요기관 주소</span>
              </td>
              <td class="cell-center">
                {{ row.refDate || '-' }}
              </td>
              <td v-if="tab === 'orders'" class="cell-right">
                {{ formatCurrency(row.contractAmount || 0) }}
              </td>
              <td class="cell-right">
                {{ formatCurrency(row.shipmentAmount || 0) }}
              </td>
              <td v-if="tab === 'shipments'" class="cell-center">
                {{ row.vehicleNo || '-' }}
              </td>
              <td class="cell-center">
                <span :class="['status-badge', STATUS_CLASS[row.status]]">{{ statusLabel(row.status) }}</span>
              </td>
              <td v-if="tab === 'orders'">
                <div class="completion-rate">
                  <div class="rate-bar">
                    <div class="rate-fill" :style="{ width: `${Math.min(Number(row.completionRate) || 0, 100)}%` }" />
                  </div>
                  <span class="rate-text">{{ (Number(row.completionRate) || 0).toFixed(0) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
/**
 * 출하현황 통계 — 지역별 현황 (2026-11-05)
 *
 * 납품요구·출하 두 탭이 지도·막대·목록을 함께 쓴다. 지도를 누르면 시도 → 시군구로 들어가고 막대·목록이 따라 좁혀진다.
 * 지역은 납품지 주소 기준이고, 납품지가 없으면(출하 전) 수요기관 주소로 대신한다 — 서버가 판정해서 내려준다.
 */
import { computed, onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import TopChartPanel from '~/components/ui/TopChartPanel.vue'
import RegionMap from '~/components/admin/procurement-status/RegionMap.vue'
import { getShipmentRegionStatus } from '~/services/statistics.service'
import { sidoName } from '~/types/procurement-status'
import { SHIPMENT_STATUS_LABELS } from '~/types/statistics'
import type { RegionStatusRow, ShipmentStatus } from '~/types/statistics'
import { formatCurrency, formatNumber } from '~/utils/format'

type TabKey = 'orders' | 'shipments'

const props = defineProps<{
  startDate: string
  endDate: string
  status?: string
}>()

/** 탭은 부모가 기억한다 — 조회할 때마다 이 컴포넌트가 다시 만들어져도 보던 탭을 유지 */
const tab = defineModel<TabKey>('tab', { default: 'orders' })

const TABS: { key: TabKey, label: string }[] = [
  { key: 'orders', label: '납품요구 현황' },
  { key: 'shipments', label: '출하 현황' }
]

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  PENDING_SIGNATURE: 'pending-signature',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const loading = ref(true)
const loadError = ref<string | null>(null)
const orders = ref<RegionStatusRow[]>([])
const shipments = ref<RegionStatusRow[]>([])
/** 들어가 있는 시도 (null = 전국) */
const area = ref<string | null>(null)
const selectedSigungu = ref<string | null>(null)

const tabRows = (key: TabKey) => (key === 'orders' ? orders.value : shipments.value)
const rows = computed(() => tabRows(tab.value))

const amountLabel = computed(() => (tab.value === 'orders' ? '계약금액' : '출하금액'))
const amountOf = (row: RegionStatusRow) => Number(tab.value === 'orders' ? row.contractAmount : row.shipmentAmount) || 0

const guideText = computed(() => (tab.value === 'orders'
  ? '기간 안에 납품요구된 계약을 납품요구일 기준으로 보여 줍니다. 금액은 계약금액(품대계)이고, 지역은 첫 출하의 납품지입니다. 출하 전이면 수요기관 주소로 표시합니다.'
  : '기간 안의 출하를 출하일 기준으로 보여 줍니다. 금액은 출하금액이고, 지역은 납품지 주소입니다. 상태의 납품완료는 납품 확정(현장 사진·서명 완료)을 뜻합니다.'))

const scopeTitle = computed(() => {
  if (!area.value) { return '전국' }
  const sigunguName = selectedSigungu.value && rows.value.find(r => r.sigunguCd === selectedSigungu.value)?.sigunguName
  return sigunguName ? `${sidoName(area.value)} ${sigunguName}` : sidoName(area.value)
})

const unassigned = computed(() => {
  const list = rows.value.filter(r => !r.areaCode)
  return { count: list.length, amount: list.reduce((sum, r) => sum + amountOf(r), 0) }
})

/** 지금 보는 범위의 행 */
const listRows = computed(() => rows.value.filter((r) => {
  if (area.value && r.areaCode !== area.value) { return false }
  return !selectedSigungu.value || r.sigunguCd === selectedSigungu.value
}))

const listAmount = computed(() => listRows.value.reduce((sum, r) => sum + amountOf(r), 0))

/** 지도·막대 공통 집계 — 전국이면 시도별, 시도에 들어가 있으면 시군구별 (금액 큰 순) */
const barItems = computed(() => {
  const bucket = new Map<string, { code: string, name: string, amount: number }>()
  for (const r of rows.value) {
    if (!r.areaCode || (area.value && r.areaCode !== area.value)) { continue }
    const code = area.value ? r.sigunguCd : r.areaCode
    if (!code) { continue }
    const item = bucket.get(code) || { code, name: area.value ? (r.sigunguName || code) : sidoName(code), amount: 0 }
    item.amount += amountOf(r)
    bucket.set(code, item)
  }
  return [...bucket.values()].sort((a, b) => b.amount - a.amount)
})

const mapValues = computed(() => Object.fromEntries(barItems.value.map(i => [i.code, i.amount])))

const barMatrix = computed(() => ({
  categories: barItems.value.map(i => i.name),
  series: [{ name: amountLabel.value, values: barItems.value.map(i => i.amount), color: '#3b82f6' }]
}))

/** 막대 축 이름을 건너뛰지 않게 — 지역이 많으면 기울여서 전부 보여 준다 */
function showAllBarLabels (opt: { xAxis?: unknown }, type: string) {
  if (type !== 'bar') { return }
  const axis = (Array.isArray(opt.xAxis) ? opt.xAxis[0] : opt.xAxis) as { axisLabel?: object } | undefined
  if (axis) {
    axis.axisLabel = { ...axis.axisLabel, interval: 0, rotate: barItems.value.length > 8 ? 35 : 0 }
  }
}

function regionText (row: RegionStatusRow): string {
  if (!row.areaCode) { return '미판정' }
  return row.sigunguName ? `${sidoName(row.areaCode)} ${row.sigunguName}` : sidoName(row.areaCode)
}

function statusLabel (status: string): string {
  return SHIPMENT_STATUS_LABELS[status as ShipmentStatus] || status
}

function resetArea () {
  area.value = null
  selectedSigungu.value = null
}

function changeTab (key: TabKey) {
  tab.value = key
  // 다른 탭에는 없는 시군구일 수 있어 시군구 선택만 푼다 (시도는 유지해 두 탭을 같은 지역으로 비교)
  selectedSigungu.value = null
}

function onSelect (code: string | null) {
  if (!area.value) {
    area.value = code
    selectedSigungu.value = null
    return
  }
  selectedSigungu.value = code
}

async function load () {
  loading.value = true
  loadError.value = null
  try {
    const data = await getShipmentRegionStatus({ startDate: props.startDate, endDate: props.endDate, status: props.status })
    orders.value = data.orders || []
    shipments.value = data.shipments || []
  } catch (e) {
    console.error('지역별 현황 조회 오류:', e)
    loadError.value = e instanceof Error ? e.message : '지역별 현황을 불러오지 못했습니다'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.region-panel {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.region-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.region-head h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.region-head h2 i {
  color: #6b7280;
}

.region-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 8px;
  background: #f1f5f9;
}

.region-tab {
  min-height: 36px;
  padding: 0.375rem 0.875rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.region-tab.active {
  background: white;
  color: #1d4ed8;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.tab-count {
  margin-left: 0.25rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.region-tab.active .tab-count {
  color: #3b82f6;
}

.region-guide {
  margin-bottom: 0.75rem;
}

.region-state {
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

.region-state-error {
  color: #b42318;
}

.region-scope {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #1f2937;
}

.scope-total {
  color: #475569;
}

.scope-back,
.scope-clear {
  min-height: 32px;
  padding: 0.25rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.8125rem;
  cursor: pointer;
}

.scope-warn {
  font-size: 0.8125rem;
  color: #b45309;
}

.region-visual {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  margin-bottom: 1rem;
}

.region-bars h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.region-table-wrap {
  max-height: 480px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.region-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.region-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.625rem 0.75rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.region-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}

.cell-center {
  text-align: center;
  white-space: nowrap;
}

.cell-right {
  text-align: right;
  white-space: nowrap;
}

.cell-region {
  white-space: nowrap;
}

.basis-badge {
  display: inline-block;
  margin-left: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.6875rem;
}

.region-empty {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.in-progress { background: #dbeafe; color: #1e40af; }
.status-badge.pending-signature { background: #fae8ff; color: #86198f; }
.status-badge.completed { background: #dcfce7; color: #166534; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }

.completion-rate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rate-bar {
  flex: 1;
  min-width: 60px;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: #e5e7eb;
}

.rate-fill {
  height: 100%;
  border-radius: 3px;
  background: #10b981;
}

.rate-text {
  min-width: 36px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

@media (max-width: 1024px) {
  .region-visual {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
