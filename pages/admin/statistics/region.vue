<template>
  <div class="statistics-region">
    <PageHeader
      title="지역별 통계"
      icon="chart"
      icon-color="blue"
      description="지역별 출하/매출 현황을 통계로 확인합니다."
    />

    <div class="content-section">
      <!-- 검색 영역 -->
      <div class="search-section">
        <div class="search-form">
          <div class="form-group">
            <label>조회 시작일</label>
            <input
              v-model="searchParams.startDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="form-group">
            <label>조회 종료일</label>
            <input
              v-model="searchParams.endDate"
              type="date"
              class="form-control"
            >
          </div>
          <div class="form-group">
            <label>조회 단위</label>
            <select v-model="searchParams.periodUnit" class="form-control">
              <option value="daily">
                일별
              </option>
              <option value="weekly">
                주별
              </option>
              <option value="monthly">
                월별
              </option>
            </select>
          </div>
          <button class="btn-action btn-primary" @click="loadStatistics">
            <i class="fas fa-search" /> 조회
          </button>
        </div>
      </div>

      <!-- 요약 카드 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-map-marker-alt" />
          </div>
          <div class="stat-content">
            <h3>활성 지역수</h3>
            <p class="stat-number">
              {{ activeRegionCount }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-truck" />
          </div>
          <div class="stat-content">
            <h3>총 출하 건수</h3>
            <p class="stat-number">
              {{ totalShipmentCount.toLocaleString() }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-won-sign" />
          </div>
          <div class="stat-content">
            <h3>총 매출액</h3>
            <p class="stat-number">
              {{ formatCurrency(totalSalesAmount) }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-trophy" />
          </div>
          <div class="stat-content">
            <h3>최고 매출 지역</h3>
            <p class="stat-number">
              {{ topRegion.name || '-' }}
            </p>
            <p class="stat-change">
              {{ formatCurrency(topRegion.amount) }}
            </p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-card">
          <h2>지역별 출하현황</h2>
          <div class="chart-wrapper">
            <canvas ref="regionBarChartRef" />
          </div>
        </div>

        <div class="chart-card">
          <h2>지역별 고객 분포</h2>
          <div class="chart-wrapper">
            <canvas ref="regionPieChartRef" />
          </div>
        </div>
      </div>

      <div class="table-section">
        <h2>지역별 상세 현황</h2>
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" /> 데이터를 불러오는 중...
        </div>
        <div v-else-if="regionData.length === 0" class="empty-message">
          조회된 데이터가 없습니다.
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>지역</th>
                <th>출하 건수</th>
                <th>총 매출액</th>
                <th>평균 금액</th>
                <th>납품완료율</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in regionData" :key="item.region">
                <td>{{ item.region }}</td>
                <td>{{ item.orderCount.toLocaleString() }}건</td>
                <td>{{ formatCurrency(item.shipmentAmount) }}</td>
                <td>{{ formatCurrency(item.averageAmount) }}</td>
                <td>
                  <span class="success-rate" :class="getSuccessRateClass(item.completionRate)">
                    {{ item.completionRate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import { getLocalDateString } from '~/utils/format'
import { getShipmentStatistics } from '~/services/statistics.service'
import type { RegionBreakdownItem, ShipmentStatisticsRequest } from '~/types/statistics'

definePageMeta({
  layout: 'admin',
  pageTitle: '지역별통계'
})

// Chart.js dynamic import
let Chart: any = null

// 차트 refs
const regionBarChartRef = ref<HTMLCanvasElement | null>(null)
const regionPieChartRef = ref<HTMLCanvasElement | null>(null)
let regionBarChart: any = null
let regionPieChart: any = null

// 차트 색상 팔레트
const regionColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#22c55e',
  '#eab308', '#dc2626'
]

// 상태 관리
const loading = ref(false)
const regionData = ref<(RegionBreakdownItem & { averageAmount: number })[]>([])

// 검색 파라미터
const searchParams = ref<ShipmentStatisticsRequest>({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  periodUnit: 'monthly'
})

// 요약 통계
const activeRegionCount = computed(() => regionData.value.length)
const totalShipmentCount = computed(() =>
  regionData.value.reduce((sum, item) => sum + item.orderCount, 0)
)
const totalSalesAmount = computed(() =>
  regionData.value.reduce((sum, item) => sum + item.shipmentAmount, 0)
)
const topRegion = computed(() => {
  if (regionData.value.length === 0) {
    return { name: '', amount: 0 }
  }
  const top = regionData.value.reduce((max, item) =>
    item.shipmentAmount > max.shipmentAmount ? item : max
  , regionData.value[0])
  return { name: top.region, amount: top.shipmentAmount }
})

// 기본 날짜 설정 (최근 1년)
function getDefaultStartDate (): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 1)
  // 로컬 타임존 기준 날짜 반환
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDefaultEndDate (): string {
  return getLocalDateString()
}

// 통계 데이터 로드
async function loadStatistics () {
  loading.value = true
  try {
    const response = await getShipmentStatistics(searchParams.value)

    // 지역별 데이터에 평균 금액 계산 추가
    regionData.value = response.regionBreakdown.map(item => ({
      ...item,
      averageAmount: item.orderCount > 0 ? Math.round(item.shipmentAmount / item.orderCount) : 0
    }))

    await nextTick()
    renderCharts()

    console.log('📊 지역별 통계 로드 완료:', regionData.value)
  } catch (error) {
    console.error('❌ 지역별 통계 조회 실패:', error)
    alert('지역별 통계를 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 금액 포맷팅
function formatCurrency (amount: number): string {
  return `₩${amount.toLocaleString()}`
}

// 완료율 클래스 결정
function getSuccessRateClass (rate: number): string {
  if (rate >= 80) { return 'high' }
  if (rate >= 70) { return 'medium' }
  return 'low'
}

// 차트 렌더링
async function renderCharts () {
  if (!Chart) {
    const chartModule = await import('chart.js/auto')
    Chart = chartModule.default
  }

  // 수평 Bar 차트: 지역별 출하현황
  if (regionBarChartRef.value) {
    if (regionBarChart) { regionBarChart.destroy() }
    regionBarChart = new Chart(regionBarChartRef.value, {
      type: 'bar',
      data: {
        labels: regionData.value.map(d => d.region),
        datasets: [{
          label: '출하금액',
          data: regionData.value.map(d => d.shipmentAmount),
          backgroundColor: regionColors.slice(0, regionData.value.length),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `출하금액: ₩${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (v: any) => `₩${Number(v).toLocaleString()}`
            }
          }
        }
      }
    })
  }

  // 도넛 차트: 지역별 고객 분포
  if (regionPieChartRef.value) {
    if (regionPieChart) { regionPieChart.destroy() }
    regionPieChart = new Chart(regionPieChartRef.value, {
      type: 'doughnut',
      data: {
        labels: regionData.value.map(d => d.region),
        datasets: [{
          data: regionData.value.map(d => d.orderCount),
          backgroundColor: regionColors.slice(0, regionData.value.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, padding: 16, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const pct = ((ctx.raw / total) * 100).toFixed(1)
                return `${ctx.label}: ${ctx.raw}건 (${pct}%)`
              }
            }
          }
        },
        cutout: '55%'
      }
    })
  }
}

// 초기 로드
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.statistics-region)
   - 버튼 스타일 (.btn-action)
   - 검색 영역 스타일 (.search-section-compact)
   - 테이블 스타일 (.data-table)
   ============================================ */

/* 페이지 특화 스타일만 작성 */

.content-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 검색 영역 */
.search-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-action {
  padding: 0.5rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-action:hover {
  background: #2563eb;
}

.btn-primary {
  background: #3b82f6;
}

/* 로딩 및 빈 데이터 메시지 */
.loading-message,
.empty-message {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1rem;
}

.loading-message i {
  margin-right: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.75rem;
  margin: 0;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.chart-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.chart-placeholder {
  height: 300px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.chart-placeholder p {
  font-size: 1.125rem;
  margin: 0 0 0.5rem 0;
}

.chart-placeholder small {
  text-align: center;
  opacity: 0.7;
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.success-rate {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.success-rate.high {
  background: #dcfce7;
  color: #166534;
}

.success-rate.medium {
  background: #fef3c7;
  color: #92400e;
}

.success-rate.low {
  background: #fef2f2;
  color: #dc2626;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stat-content h3 {
    font-size: 0.875rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .chart-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .chart-placeholder {
    height: 200px;
  }

  .chart-wrapper {
    height: 250px;
  }

  .chart-placeholder i {
    font-size: 2rem;
  }

  .chart-placeholder p {
    font-size: 1rem;
  }

  .table-section {
    padding: 1rem;
  }

  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }

  /* 모바일에서 숨길 컬럼들 */
  .data-table th:nth-child(3),
  .data-table th:nth-child(4),
  .data-table th:nth-child(5),
  .data-table td:nth-child(3),
  .data-table td:nth-child(4),
  .data-table td:nth-child(5) {
    display: none;
  }
}
</style>
