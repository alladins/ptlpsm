<template>
  <div class="visit-company-ips">
    <div class="page-header-compact">
      <h1>회사별 IP 사용 이력</h1>
      <span class="page-description">선택 회사가 사용한 IP 목록 + 화이트리스트 등록 상태</span>
      <div class="header-actions-right">
        <button class="btn-action" :disabled="!params.companyId" @click="loadIps">
          <i class="fas fa-search" /> 조회
        </button>
      </div>
    </div>

    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>회사 ID:</label>
          <input
            v-model.number="params.companyId"
            type="number"
            placeholder="회사 ID 입력"
            class="text-input"
            @keyup.enter="loadIps"
          >
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>IP 주소</th>
            <th class="num">
              방문 횟수
            </th>
            <th class="num">
              사용자 수
            </th>
            <th>첫 접속</th>
            <th>마지막 접속</th>
            <th>화이트리스트</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="7" class="empty">
              조회 결과가 없습니다.
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.ipAddress">
            <td class="mono">
              {{ row.ipAddress }}
            </td>
            <td class="num">
              {{ formatNumber(row.visitCount) }}
            </td>
            <td class="num">
              {{ formatNumber(row.distinctUsers) }}
            </td>
            <td>{{ formatTime(row.firstSeenAt) }}</td>
            <td>{{ formatTime(row.lastSeenAt) }}</td>
            <td>
              <span v-if="isWhitelisted(row.ipAddress)" class="badge badge-ok">등록됨</span>
              <span v-else class="badge badge-warn">미등록</span>
            </td>
            <td>
              <button
                v-if="!isWhitelisted(row.ipAddress)"
                class="btn-mini"
                @click="quickAdd(row.ipAddress)"
              >
                + 화이트리스트
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { visitService } from '~/services/visit.service'
import type { CompanyIpUsage, VisitIpWhitelist } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const params = ref<{ companyId?: number }>({ companyId: undefined })
const rows = ref<CompanyIpUsage[]>([])
const whitelist = ref<VisitIpWhitelist[]>([])

const formatNumber = (n: number) => (n ?? 0).toLocaleString()
const formatTime = (s?: string) => (s ? s.replace('T', ' ').slice(0, 19) : '-')

function isWhitelisted (ip: string) {
  return whitelist.value.some(w => w.isActive && w.ipAddress === ip)
}

async function loadIps () {
  if (!params.value.companyId) { return }
  const [ips, list] = await Promise.all([
    visitService.getCompanyIps(params.value.companyId),
    visitService.getWhitelist(params.value.companyId)
  ])
  rows.value = ips
  whitelist.value = list
}

async function quickAdd (ip: string) {
  if (!params.value.companyId) { return }
  if (!confirm(`IP ${ip} 를 회사 ${params.value.companyId} 화이트리스트에 등록하시겠습니까?`)) { return }
  await visitService.createWhitelist({
    companyId: params.value.companyId,
    ipAddress: ip,
    isActive: true,
    description: '회사 IP 이력에서 일괄 등록'
  })
  await loadIps()
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';

.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: ui-monospace, Menlo, monospace; }
.empty { text-align: center; padding: 1.5rem; color: #9ca3af; }

.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-ok { background: #d1fae5; color: #065f46; }
.badge-warn { background: #fef3c7; color: #92400e; }

.btn-mini {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-mini:hover { background: #2563eb; }
</style>
