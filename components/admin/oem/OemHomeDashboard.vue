<template>
  <div class="oem-home">
    <PageHeader
      title="대시보드"
      :description="status?.oemCompanyName ? `${status.oemCompanyName} 발주 현황` : '발주 현황'"
    />

    <div v-if="loading" class="state-box">
      <i class="fas fa-spinner fa-spin" />
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="state-box state-error">
      <p>{{ errorMessage }}</p>
      <button class="retry-btn" @click="load">
        다시 불러오기
      </button>
    </div>

    <template v-else-if="status">
      <div class="status-grid">
        <button class="status-card" @click="goToList()">
          <span class="status-label">총 발주</span>
          <strong class="status-value">{{ formatCount(status.totalCount) }}건</strong>
          <span class="status-sub">수량 {{ formatCount(status.totalQuantity) }}</span>
        </button>
        <button class="status-card is-today" @click="goToList()">
          <span class="status-label">오늘 발주</span>
          <strong class="status-value">{{ formatCount(status.todayCount) }}건</strong>
          <span class="status-sub">수량 {{ formatCount(status.todayQuantity) }}</span>
        </button>
        <button class="status-card" @click="goToList()">
          <span class="status-label">이번 달 발주</span>
          <strong class="status-value">{{ formatCount(status.monthCount) }}건</strong>
          <span class="status-sub">수량 {{ formatCount(status.monthQuantity) }}</span>
        </button>
        <button class="status-card" :class="{ 'is-alert': status.issuedCount > 0 }" @click="goToList(PO_STATUS.ISSUED)">
          <span class="status-label">접수 대기</span>
          <strong class="status-value">{{ formatCount(status.issuedCount) }}건</strong>
          <span class="status-sub">접수가 필요한 발주</span>
        </button>
        <button class="status-card" @click="goToList()">
          <span class="status-label">생산 진행</span>
          <strong class="status-value">{{ formatCount(status.inProgressCount) }}건</strong>
          <span class="status-sub">접수·생산중</span>
        </button>
        <button class="status-card" @click="goToList(PO_STATUS.PRODUCED)">
          <span class="status-label">생산완료</span>
          <strong class="status-value">{{ formatCount(status.producedCount) }}건</strong>
          <span class="status-sub">생산을 마친 발주</span>
        </button>
      </div>

      <section class="recent-section">
        <h2>최근 발주</h2>
        <div class="table-wrap">
          <table class="recent-table">
            <thead>
              <tr>
                <th>발주서번호</th>
                <th>발주일</th>
                <th>완료 예정일</th>
                <th>상태</th>
                <th class="num">
                  수량
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="status.recentOrders.length === 0">
                <td colspan="5" class="no-data">
                  발주 내역이 없습니다
                </td>
              </tr>
              <tr v-for="order in status.recentOrders" :key="order.poId" class="row-link" @click="goToDetail(order.poId)">
                <td class="mono">
                  {{ order.poNo }}
                </td>
                <td>
                  {{ order.orderDate }}
                  <span v-if="order.orderDate === today" class="today-badge">오늘</span>
                </td>
                <td>{{ order.expectedCompletionDate || '-' }}</td>
                <td>{{ statusLabel(order.status) }}</td>
                <td class="num">
                  {{ formatCount(order.totalQuantity) }}
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
 * 제조사(OEM_MANAGER) 계정의 대시보드 (2026-11-06 사용자 결정)
 * 회사 전체 계약·매출·지역 수치 대신 자기 회사 발주 현황만 보여 준다. 회사는 서버가 로그인 계정으로 정한다.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import { oemDashboardService } from '~/services/oem-dashboard.service'
import { PO_STATUS, PO_STATUS_LABELS, type PurchaseOrderStatus } from '~/types/purchase-order'
import type { OemOrderStatus } from '~/types/oem-dashboard'
import { getLocalDateString } from '~/utils/format'

const router = useRouter()
const today = getLocalDateString()
const loading = ref(true)
const errorMessage = ref('')
const status = ref<OemOrderStatus | null>(null)

async function load () {
  loading.value = true
  errorMessage.value = ''
  try {
    status.value = await oemDashboardService.getOemOrderStatus()
  } catch (e) {
    console.error('제조사 발주 현황 조회 실패:', e)
    errorMessage.value = '발주 현황을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function goToList (statusFilter?: string) {
  router.push({ path: '/admin/purchase-order/list', query: statusFilter ? { status: statusFilter } : {} })
}

function goToDetail (poId: number) {
  router.push(`/admin/purchase-order/detail/${poId}`)
}

function statusLabel (value: string): string {
  return PO_STATUS_LABELS[value as PurchaseOrderStatus] || value
}

function formatCount (value?: number | null): string {
  return Number(value || 0).toLocaleString('ko-KR')
}

onMounted(load)
</script>

<style scoped>
.oem-home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.state-box {
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
  background: #fff;
  border-radius: 8px;
}

.state-error {
  color: #b91c1c;
}

.retry-btn {
  margin-top: 0.75rem;
  min-height: 40px;
  padding: 0 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.status-card:hover {
  border-color: #3b82f6;
}

.status-card.is-today {
  border-left: 4px solid #3b82f6;
}

.status-card.is-alert {
  border-left: 4px solid #f59e0b;
}

.status-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.status-value {
  font-size: 1.625rem;
  color: #111827;
}

.status-sub {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.recent-section {
  padding: 1.25rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.recent-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
}

.table-wrap {
  overflow-x: auto;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.recent-table th,
.recent-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.recent-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.recent-table .num {
  text-align: right;
}

.recent-table .mono {
  font-variant-numeric: tabular-nums;
}

.row-link {
  cursor: pointer;
}

.row-link:hover {
  background: #f9fafb;
}

.no-data {
  padding: 2rem !important;
  text-align: center !important;
  color: #9ca3af;
}

.today-badge {
  display: inline-block;
  margin-left: 0.375rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-card {
    padding: 1rem;
  }

  .status-value {
    font-size: 1.375rem;
  }
}
</style>
