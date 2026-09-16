<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          운송비 원장
        </h1>
        <p class="page-desc">
          리드파워가 부담한 운송비를 운송사별·월별로 모아 봅니다. 운송사 정산 근거로 씁니다.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-excel" :disabled="loading || !ledger" @click="downloadExcel">
          <i class="fas fa-file-excel" />
          엑셀 내려받기
        </button>
      </div>
    </div>

    <!-- 검색 -->
    <div class="search-box">
      <div class="search-field">
        <label>조회 월</label>
        <input v-model="yearMonth" type="month" class="form-input" @change="load">
      </div>
      <div class="search-field">
        <label>운송사</label>
        <select v-model="selectedCarrierId" class="form-select" @change="load">
          <option :value="null">
            전체
          </option>
          <option v-for="c in carriers" :key="c.carrierCompanyId" :value="c.carrierCompanyId">
            {{ c.carrierCompanyName }}
          </option>
        </select>
      </div>
      <button class="btn-search" :disabled="loading" @click="load">
        <i class="fas fa-search" />
        조회
      </button>
    </div>

    <!--
      요약 — 부가세는 참고값이다.
      실제 청구는 운송사가 끊는 세금계산서를 따르므로 여기 숫자로 대금을 확정하지 않는다.
    -->
    <div v-if="ledger" class="summary-row">
      <div class="summary-card">
        <span class="label">출하 건수</span>
        <strong class="value">{{ ledger.shipmentCount }}건</strong>
      </div>
      <div class="summary-card accent">
        <span class="label">운송비 합계 (공급가액)</span>
        <strong class="value">{{ formatCurrency(ledger.totalShippingCost) }}</strong>
      </div>
      <div class="summary-card muted">
        <span class="label">부가세 10% <em>(참고)</em></span>
        <strong class="value">{{ formatCurrency(ledger.vatAmount) }}</strong>
      </div>
      <div class="summary-card muted">
        <span class="label">합계 + 부가세 <em>(참고)</em></span>
        <strong class="value">{{ formatCurrency(ledger.totalWithVat) }}</strong>
      </div>
    </div>

    <!-- 운송사별 요약 — 전체 조회일 때만. 어느 운송사에 얼마가 나갔는지 한눈에 본다 -->
    <div v-if="ledger && !selectedCarrierId && carriersWithData.length > 0" class="carrier-strip">
      <button
        v-for="c in carriersWithData"
        :key="c.carrierCompanyId"
        class="carrier-chip"
        @click="selectCarrier(c.carrierCompanyId)"
      >
        <span class="name">{{ c.carrierCompanyName }}</span>
        <span class="count">{{ c.shipmentCount }}건</span>
        <strong class="amount">{{ formatCurrency(c.totalShippingCost) }}</strong>
      </button>
    </div>

    <!-- 내역 -->
    <div class="table-container">
      <div v-if="loading" class="state-box">
        <i class="fas fa-spinner fa-spin" />
        <span>조회 중...</span>
      </div>

      <div v-else-if="!ledger || ledger.items.length === 0" class="state-box">
        <i class="fas fa-inbox" />
        <span>{{ yearMonth }} 에 리드파워 부담 운송비가 없습니다.</span>
        <p class="state-hint">
          출하 사후 처리에서 운송비 부담을 «리드파워 부담»으로 확정하면 이 원장에 실립니다.
        </p>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th style="width: 104px">
              출하일
            </th>
            <th style="width: 120px">
              출하번호
            </th>
            <th style="width: 140px">
              납품요구번호
            </th>
            <th>수요기관</th>
            <th>배송지</th>
            <th style="width: 90px">
              수령인
            </th>
            <th style="width: 120px">
              제조사
            </th>
            <th style="width: 110px" class="text-right">
              운송비
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in ledger.items" :key="item.shipmentId">
            <td class="nowrap">
              {{ formatDate(item.shipmentDate) }}
            </td>
            <td class="nowrap">
              {{ item.shipmentNo || '-' }}
            </td>
            <td class="nowrap">
              {{ item.deliveryRequestNo || '-' }}
            </td>
            <td class="ellipsis">
              {{ item.client || '-' }}
            </td>
            <td class="ellipsis">
              {{ item.deliveryAddress || '-' }}
            </td>
            <td>{{ item.receiverName || '-' }}</td>
            <td class="ellipsis">
              {{ item.oemCompanyName || '-' }}
            </td>
            <td class="text-right amount-cell">
              {{ formatCurrency(item.shippingCost) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="7" class="text-right total-label">
              합계
            </td>
            <td class="text-right total-value">
              {{ formatCurrency(ledger.totalShippingCost) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { carrierLedgerService } from '~/services/carrier-ledger.service'
import { formatCurrency, formatDate, getLocalDateString } from '~/utils/format'
import type { CarrierMonthlyLedger, CarrierSummary } from '~/types/carrier-ledger'

definePageMeta({ layout: 'admin' })

/**
 * 운송비 원장
 *
 * ⚠ 여기 실리는 것은 «리드파워 부담(LP_BEARS)» 뿐이다.
 *   제조사에게 지불하는 운송비(PAID_TO_OEM)는 OEM 월별 매출원장 소관이고,
 *   제조사 부담(OEM_BEARS)은 애초에 리드파워 장부에 오지 않는다.
 *
 * ⚠ 기준 월은 출하일이 아니라 «원장 반영 월»이다.
 *   출하는 지난달인데 운송비를 이번 달에 정산하는 경우가 있어 사후 처리에서 직접 고를 수 있다.
 */

const loading = ref(false)
const ledger = ref<CarrierMonthlyLedger | null>(null)
const carriers = ref<CarrierSummary[]>([])
const selectedCarrierId = ref<number | null>(null)

// 기본값은 이번 달 (KST 기준 — utils/format 이 타임존을 맡는다)
const yearMonth = ref(getLocalDateString().slice(0, 7))

// 그 달 실적이 있는 운송사만 칩으로 띄운다
const carriersWithData = computed(() => carriers.value.filter(c => c.shipmentCount > 0))

const load = async () => {
  if (!yearMonth.value) { return }

  loading.value = true
  try {
    const [data, carrierList] = await Promise.all([
      carrierLedgerService.getMonthlyLedger(yearMonth.value, selectedCarrierId.value),
      carrierLedgerService.getCarriers(yearMonth.value)
    ])
    ledger.value = data
    carriers.value = carrierList
  } catch (error) {
    console.error('운송비 원장 조회 실패:', error)
    ledger.value = null
    alert(error instanceof Error ? error.message : '운송비 원장 조회에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

const selectCarrier = (carrierId: number) => {
  selectedCarrierId.value = carrierId
  load()
}

const downloadExcel = async () => {
  try {
    await carrierLedgerService.downloadExcel(yearMonth.value, selectedCarrierId.value)
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  }
}

onMounted(load)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.page-desc {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.search-box {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.search-field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
}

/* 요약 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.875rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.summary-card .label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.summary-card .label em {
  font-style: normal;
  color: #9ca3af;
}

.summary-card .value {
  font-size: 1.25rem;
  color: #1f2937;
}

.summary-card.accent {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.summary-card.accent .value {
  color: #4338ca;
}

/* 참고값은 확정 금액이 아니므로 흐리게 둔다 */
.summary-card.muted .value {
  font-size: 1.0625rem;
  color: #6b7280;
}

/* 운송사별 칩 */
.carrier-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.carrier-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.carrier-chip:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.carrier-chip .name {
  font-weight: 600;
  color: #374151;
}

.carrier-chip .count {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.carrier-chip .amount {
  color: #4338ca;
}

/* 상태 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.state-hint {
  font-size: 0.8125rem;
  color: #b0b7c3;
}

/* 표 */
.text-right {
  text-align: right;
}

.nowrap {
  white-space: nowrap;
}

.ellipsis {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-cell {
  font-weight: 600;
  color: #1f2937;
}

.total-label {
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
}

.total-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #4338ca;
  background: #f9fafb;
}
</style>
