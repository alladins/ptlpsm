<template>
  <div class="visit-alerts">
    <div class="page-header-compact">
      <h1>방문 추적 알림</h1>
      <span class="page-description">미접속 회사 / 비정상 IP / 계정 공유 의심</span>
      <div class="header-actions-right">
        <button class="btn-action" @click="loadData">
          <i class="fas fa-search" /> 조회
        </button>
      </div>
    </div>

    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>상태:</label>
          <select v-model="params.status" class="type-select">
            <option value="">
              전체
            </option>
            <option value="OPEN">
              미해소(OPEN)
            </option>
            <option value="RESOLVED">
              해소(RESOLVED)
            </option>
            <option value="IGNORED">
              무시(IGNORED)
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>유형:</label>
          <select v-model="params.alertType" class="type-select">
            <option value="">
              전체
            </option>
            <option value="INACTIVE_COMPANY">
              미접속 회사
            </option>
            <option value="UNKNOWN_IP">
              비정상 IP
            </option>
            <option value="ACCOUNT_SHARE_SUSPECT">
              계정 공유 의심
            </option>
          </select>
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
            <th>ID</th>
            <th>유형</th>
            <th>심각도</th>
            <th>상태</th>
            <th>회사</th>
            <th>사용자</th>
            <th>IP</th>
            <th>탐지</th>
            <th>해소</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="10" class="empty">
              조회 결과가 없습니다.
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.id }}</td>
            <td>
              <span class="type-badge" :class="`type-${row.alertType.toLowerCase()}`">
                {{ alertLabel(row.alertType) }}
              </span>
            </td>
            <td>{{ row.severity }}</td>
            <td>
              <span class="status-badge" :class="`status-${row.status.toLowerCase()}`">
                {{ row.status }}
              </span>
            </td>
            <td>{{ row.targetCompanyId ?? '-' }}</td>
            <td>{{ row.targetUserId ?? '-' }}</td>
            <td class="mono">
              {{ row.targetIp ?? '-' }}
            </td>
            <td>{{ formatTime(row.detectedAt) }}</td>
            <td>
              <span v-if="row.resolvedAt">
                {{ formatTime(row.resolvedAt) }}
                <small v-if="row.resolvedNote">({{ row.resolvedNote }})</small>
              </span>
              <span v-else class="text-gray">-</span>
            </td>
            <td>
              <button v-if="row.status === 'OPEN'" class="btn-mini" @click="onResolve(row.id, 'RESOLVED')">
                해소
              </button>
              <button v-if="row.status === 'OPEN'" class="btn-mini btn-secondary" @click="onResolve(row.id, 'IGNORED')">
                무시
              </button>
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
import {
  VISIT_ALERT_LABELS,
  VISIT_ALERT_STATUS,
  type VisitAlert,
  type VisitAlertStatus,
  type VisitAlertType
} from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const params = ref<{
  status?: VisitAlertStatus | ''
  alertType?: VisitAlertType | ''
  from?: string
  to?: string
}>({
  status: VISIT_ALERT_STATUS.OPEN,
  alertType: '',
  from: '',
  to: ''
})

const rows = ref<VisitAlert[]>([])
const total = ref(0)
const page = ref(0)
const size = 50
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size)))

const formatTime = (s?: string) => (s ? s.replace('T', ' ').slice(0, 19) : '-')
const alertLabel = (t: VisitAlertType) => VISIT_ALERT_LABELS[t] || t

async function loadData () {
  const res = await visitService.getAlerts({
    status: params.value.status || undefined,
    alertType: params.value.alertType || undefined,
    from: params.value.from || undefined,
    to: params.value.to || undefined,
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

async function onResolve (id: number, status: 'RESOLVED' | 'IGNORED') {
  const note = prompt(`${status === 'RESOLVED' ? '해소' : '무시'} 사유를 입력하세요 (선택)`) || ''
  await visitService.resolveAlert(id, { status, note })
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';

.mono { font-family: ui-monospace, Menlo, monospace; }
.empty { text-align: center; padding: 1.5rem; color: #9ca3af; }
.text-gray { color: #9ca3af; }

.type-badge, .status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.type-inactive_company { background: #fef3c7; color: #92400e; }
.type-unknown_ip { background: #fee2e2; color: #991b1b; }
.type-account_share_suspect { background: #ede9fe; color: #5b21b6; }

.status-open { background: #fee2e2; color: #991b1b; }
.status-resolved { background: #d1fae5; color: #065f46; }
.status-ignored { background: #f3f4f6; color: #6b7280; }

.btn-mini {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.25rem;
}
.btn-mini.btn-secondary { background: #6b7280; }

.pagination {
  display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem 0;
}
.pagination button {
  padding: 0.5rem 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
