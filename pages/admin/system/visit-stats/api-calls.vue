<template>
  <div class="visit-api-calls">
    <div class="page-header-compact">
      <h1>API 호출 로그</h1>
      <span class="page-description">사용자 / 회사 / IP 차원 상세 호출 기록 (1년 보존)</span>
      <div class="header-actions-right">
        <button class="btn-action" @click="loadData">
          <i class="fas fa-search" /> 조회
        </button>
      </div>
    </div>

    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>사용자 ID:</label>
          <input v-model.number="params.userId" type="number" placeholder="전체" class="text-input">
        </div>
        <div class="search-item">
          <label>회사 ID:</label>
          <input v-model.number="params.companyId" type="number" placeholder="전체" class="text-input">
        </div>
        <div class="search-item">
          <label>From:</label>
          <input v-model="params.from" type="datetime-local" class="date-input">
        </div>
        <div class="search-item">
          <label>To:</label>
          <input v-model="params.to" type="datetime-local" class="date-input">
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>호출 시각</th>
            <th>사용자</th>
            <th>회사</th>
            <th>IP</th>
            <th>METHOD</th>
            <th>URI</th>
            <th class="num">
              상태
            </th>
            <th class="num">
              응답(ms)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8" class="empty">
              조회 결과가 없습니다.
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ formatTime(row.calledAt) }}</td>
            <td>{{ row.userId ?? '-' }}</td>
            <td>{{ row.companyId ?? '-' }}</td>
            <td class="mono">
              {{ row.ipAddress }}
            </td>
            <td>
              <span class="method" :class="`method-${row.httpMethod?.toLowerCase()}`">{{ row.httpMethod }}</span>
            </td>
            <td class="mono uri">
              {{ row.requestUri }}
            </td>
            <td class="num" :class="statusClass(row.statusCode)">
              {{ row.statusCode ?? '-' }}
            </td>
            <td class="num">
              {{ row.responseTimeMs ?? '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button :disabled="page === 0" @click="changePage(page - 1)">
        이전
      </button>
      <span>{{ page + 1 }} / {{ totalPages }} (총 {{ total.toLocaleString() }}건)</span>
      <button :disabled="page + 1 >= totalPages" @click="changePage(page + 1)">
        다음
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { visitService } from '~/services/visit.service'
import type { ApiCallLog } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const params = ref<{ userId?: number; companyId?: number; from?: string; to?: string }>({})
const rows = ref<ApiCallLog[]>([])
const total = ref(0)
const page = ref(0)
const size = 50

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size)))

const formatTime = (s?: string) => (s ? s.replace('T', ' ').slice(0, 19) : '-')

function statusClass (code?: number) {
  if (!code) { return '' }
  if (code >= 500) { return 'status-err' }
  if (code >= 400) { return 'status-warn' }
  if (code >= 200 && code < 300) { return 'status-ok' }
  return ''
}

async function loadData () {
  const res = await visitService.getApiCalls({
    ...params.value,
    page: page.value,
    size
  })
  rows.value = res.rows
  total.value = res.total
}

function changePage (p: number) {
  page.value = p
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';

.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: ui-monospace, Menlo, monospace; font-size: 0.875rem; }
.uri { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { text-align: center; padding: 1.5rem; color: #9ca3af; }

.method {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
}
.method-get { background: #3b82f6; }
.method-post { background: #10b981; }
.method-put { background: #f59e0b; }
.method-patch { background: #8b5cf6; }
.method-delete { background: #ef4444; }

.status-ok { color: #059669; }
.status-warn { color: #d97706; }
.status-err { color: #dc2626; font-weight: 600; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}
.pagination button {
  padding: 0.5rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
