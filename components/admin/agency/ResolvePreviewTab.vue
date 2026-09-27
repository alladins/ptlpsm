<!--
  기존 납품요구 담당 판정 미리보기
  - 저장하지 않는다 (납품요구에 담당 대리점을 저장하는 기능은 2단계)
  - 기준일: 오늘 기준 / 납품요구일 기준 (계약 당시 담당 대리점)
-->
<template>
  <div class="preview-tab">
    <div class="preview-note">
      <i class="fas fa-info-circle" />
      미리보기는 저장하지 않습니다. 납품요구에 담당 대리점을 저장하는 기능은 2단계입니다.
    </div>

    <div class="preview-toolbar">
      <div class="basis-toggle">
        <button
          type="button"
          class="basis-btn"
          :class="{ active: basis === 'today' }"
          :disabled="loading"
          @click="changeBasis('today')"
        >
          오늘 기준
        </button>
        <button
          type="button"
          class="basis-btn"
          :class="{ active: basis === 'orderDate' }"
          :disabled="loading"
          @click="changeBasis('orderDate')"
        >
          납품요구일 기준
        </button>
      </div>

      <div class="status-chips">
        <button
          type="button"
          class="chip"
          :class="{ active: statusFilter === '' }"
          @click="statusFilter = ''"
        >
          전체 {{ rows.length }}
        </button>
        <button
          v-for="c in statusCounts"
          :key="c.status"
          type="button"
          class="chip"
          :class="[`chip-${resolveStatusBadge(c.status)}`, { active: statusFilter === c.status }]"
          @click="statusFilter = c.status"
        >
          {{ codeLabel(RESOLVE_STATUS_LABELS, c.status) }} {{ c.count }}
        </button>
      </div>

      <button type="button" class="btn-action btn-secondary" :disabled="loading" @click="load">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 다시 판정
      </button>
    </div>

    <div class="table-section">
      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner fa-spin" />
        <p>납품요구 판정 중...</p>
      </div>
      <div v-else-if="filteredRows.length === 0" class="no-data-message">
        <i class="fas fa-inbox" />
        <p>표시할 납품요구가 없습니다.</p>
      </div>
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>납품요구번호</th>
              <th>납품요구일자</th>
              <th>수요기관</th>
              <th>판정 결과</th>
              <th>권역 경로</th>
              <th>대리점</th>
              <th>근거</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in filteredRows" :key="row.orderId">
              <td>{{ index + 1 }}</td>
              <td>{{ row.deliveryRequestNo || '-' }}</td>
              <td>{{ row.deliveryRequestDate || '-' }}</td>
              <td class="text-left">
                {{ row.client || row.result.dminsttNm || '-' }}
                <span class="text-muted">({{ row.clientNo || row.result.dminsttCd || '-' }})</span>
              </td>
              <td>
                <span class="status-badge" :class="resolveStatusBadge(row.result.status)">
                  {{ row.result.statusLabel || codeLabel(RESOLVE_STATUS_LABELS, row.result.status) }}
                </span>
                <div v-if="row.result.provinceLevel" class="province-flag">
                  도 단위 기관
                </div>
              </td>
              <td class="text-left">
                {{ row.result.regionPath || '-' }}
              </td>
              <td class="text-left">
                <template v-if="row.result.agencyId">
                  {{ row.result.agencyName }} <span class="text-muted">({{ row.result.agencyCode }})</span>
                </template>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-left note-cell">
                {{ row.result.note || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { agencyService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import {
  RESOLVE_STATUS_LABELS,
  codeLabel,
  resolveStatusBadge,
  type ResolvePreviewBasis,
  type ResolvePreviewRow
} from '~/types/agency'

const basis = ref<ResolvePreviewBasis>('today')
const rows = ref<ResolvePreviewRow[]>([])
const countsByStatus = ref<Record<string, number>>({})
const statusFilter = ref('')
const loading = ref(false)

/** 표시 순서: 문제 있는 것 먼저 */
const STATUS_ORDER = ['NO_ORG', 'NO_SIGUNGU', 'NO_REGION', 'NO_AGENCY', 'NEEDS_ORDER_LEVEL', 'OK']

const statusCounts = computed(() =>
  Object.entries(countsByStatus.value)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a.status)
      const ib = STATUS_ORDER.indexOf(b.status)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    }))

const filteredRows = computed(() =>
  statusFilter.value ? rows.value.filter(r => r.result.status === statusFilter.value) : rows.value)

const load = async () => {
  loading.value = true
  try {
    const res = await agencyService.previewOrders(basis.value)
    rows.value = res.rows || []
    countsByStatus.value = res.countsByStatus || {}
    // 선택한 상태가 결과에 없으면 필터 해제
    if (statusFilter.value && !countsByStatus.value[statusFilter.value]) {
      statusFilter.value = ''
    }
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

const changeBasis = (next: ResolvePreviewBasis) => {
  if (basis.value === next) { return }
  basis.value = next
  load()
}

onMounted(load)
</script>

<style scoped>
.preview-note {
  padding: 0.625rem 0.875rem;
  margin-bottom: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #1e3a8a;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.basis-toggle {
  display: inline-flex;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}

.basis-btn {
  padding: 0.4rem 0.875rem;
  background: #fff;
  border: none;
  font-size: 0.8125rem;
  color: #334155;
  cursor: pointer;
}

.basis-btn + .basis-btn {
  border-left: 1px solid #cbd5e1;
}

.basis-btn.active {
  background: #2563eb;
  color: #fff;
}

.status-chips {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-right: auto;
}

.chip {
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.chip-success {
  border-color: #a7f3d0;
  color: #065f46;
}

.chip-warning {
  border-color: #fde68a;
  color: #92400e;
}

.chip-danger {
  border-color: #fecaca;
  color: #991b1b;
}

.chip.active {
  box-shadow: 0 0 0 2px #2563eb;
}

.province-flag {
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  color: #b45309;
}

.note-cell {
  max-width: 320px;
  font-size: 0.75rem;
  color: #475569;
}
</style>
