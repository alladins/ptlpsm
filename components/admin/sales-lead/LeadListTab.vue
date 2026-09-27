<!--
  공모·낙찰 수집 — ① 수집 결과
  - 첫 수집일 기간(기본 최근 7일)·종류·출처·판정 상태·담당 대리점·검색어로 조회
  - 행을 누르면 상세 모달 (원천 필드·판별 근거·설계사무소 연결·담당 판정)
-->
<template>
  <div class="lead-list-tab">
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>첫 수집일:</label>
          <SearchDateRange
            v-model:start-date="searchForm.fromDate"
            v-model:end-date="searchForm.toDate"
            :show-presets="false"
            @change="search"
          />
        </div>
        <div class="search-item">
          <label>종류:</label>
          <select v-model="searchForm.leadKind" class="status-select" @change="search">
            <option v-for="opt in LEAD_KIND_FILTER_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>출처:</label>
          <select v-model="searchForm.source" class="status-select" @change="search">
            <option value="">
              전체
            </option>
            <option v-for="(label, code) in LEAD_SOURCE_LABELS" :key="code" :value="code">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>판정 상태:</label>
          <select v-model="searchForm.resolveStatus" class="status-select" @change="search">
            <option value="">
              전체
            </option>
            <option v-for="(label, code) in RESOLVE_STATUS_LABELS" :key="code" :value="code">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>담당 대리점:</label>
          <select v-model="searchForm.agencyId" class="status-select" @change="search">
            <option :value="null">
              전체
            </option>
            <option v-for="a in agencies" :key="a.agencyId" :value="a.agencyId">
              {{ a.companyName }} ({{ a.agencyCode }})
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>검색어:</label>
          <input
            v-model="searchForm.keyword"
            type="text"
            class="keyword-input"
            placeholder="사업명, 공고번호, 수요기관, 업체"
            @keyup.enter="search"
          >
        </div>
        <button class="btn-search-inline" :disabled="loading" @click="search">
          <i class="fas fa-search" /> 검색
        </button>
      </div>
    </div>

    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>총 <strong>{{ formatNumber(totalElements) }}</strong>건</span>
        </div>
        <div class="table-actions">
          <select v-model="pageSize" class="page-size-select" @change="search">
            <option :value="20">
              20개씩
            </option>
            <option :value="50">
              50개씩
            </option>
            <option :value="100">
              100개씩
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner fa-spin" />
        <p>데이터를 불러오는 중...</p>
      </div>
      <div v-else-if="items.length === 0" class="no-data-message">
        <i class="fas fa-search" />
        <p>조건에 맞는 수집 결과가 없습니다.</p>
      </div>
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>첫 수집일</th>
              <th>종류</th>
              <th>출처</th>
              <th>사업명</th>
              <th>수요기관</th>
              <th>낙찰·계약업체</th>
              <th>금액(원)</th>
              <th>낙찰·계약일</th>
              <th>담당 대리점</th>
              <th>설계사무소</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.leadId" class="clickable-row" @click="openDetail(item)">
              <td class="nowrap">
                {{ item.firstSeenDate || '-' }}
              </td>
              <td>
                <LeadKindBadge :kind="item.leadKind" />
              </td>
              <td class="nowrap">
                {{ codeLabel(LEAD_SOURCE_LABELS, item.source) }}
                <div class="text-muted small">
                  {{ codeLabel(LEAD_BIZ_TYPE_LABELS, item.bizType) }}
                </div>
              </td>
              <td class="text-left title-cell">
                <div class="title-clamp" :title="item.title || ''">
                  {{ item.title || '-' }}
                </div>
                <div class="text-muted small">
                  {{ item.refNo }}<template v-if="item.refOrd">
                    -{{ item.refOrd }}
                  </template>
                </div>
              </td>
              <td class="text-left org-cell">
                {{ item.dminsttNm || '-' }}
              </td>
              <td class="text-left">
                <div>{{ item.winnerNm || '-' }}</div>
                <div class="text-muted small nowrap">
                  {{ formatBizno(item.winnerBizno) }}
                </div>
              </td>
              <td class="text-right nowrap">
                {{ item.amount === null || item.amount === undefined ? '-' : formatNumber(item.amount) }}
              </td>
              <td class="nowrap">
                {{ item.eventDate || '-' }}
              </td>
              <td>
                <template v-if="item.agencyId">
                  <div>{{ item.agencyName || '-' }}</div>
                  <div v-if="item.agencyCode" class="text-muted small">
                    {{ item.agencyCode }}
                  </div>
                </template>
                <span
                  v-else
                  class="status-badge"
                  :class="resolveStatusBadge(item.resolveStatus)"
                  :title="item.resolveNote || ''"
                >
                  {{ codeLabel(RESOLVE_STATUS_LABELS, item.resolveStatus) }}
                </span>
              </td>
              <td class="text-left">
                <NuxtLink
                  v-if="item.designOfficeId"
                  to="/admin/design-office/list"
                  class="link"
                  :title="item.officeNote || ''"
                  @click.stop
                >
                  {{ item.designOfficeName || `#${item.designOfficeId}` }}
                </NuxtLink>
                <span v-else class="text-muted" :title="item.officeNote || ''">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="totalPages > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :disabled="loading"
        @change="changePage"
      />
    </div>

    <LeadDetailModal
      v-if="detailTarget"
      :lead-id="detailTarget.leadId"
      :summary="detailTarget"
      @close="detailTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Pagination from '~/components/ui/Pagination.vue'
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import LeadKindBadge from '~/components/admin/sales-lead/LeadKindBadge.vue'
import LeadDetailModal from '~/components/admin/sales-lead/LeadDetailModal.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { agencyService } from '~/services/agency.service'
import { formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import {
  RESOLVE_STATUS_LABELS,
  codeLabel,
  resolveStatusBadge,
  todayKst,
  type Agency
} from '~/types/agency'
import {
  LEAD_BIZ_TYPE_LABELS,
  LEAD_KIND_FILTER_OPTIONS,
  LEAD_SOURCE_LABELS,
  addDays,
  formatBizno,
  type SalesLead
} from '~/types/sales-lead'

// 기본 기간: 오늘 포함 최근 7일 (KST)
const today = todayKst()
const searchForm = ref({
  fromDate: addDays(today, -6),
  toDate: today,
  leadKind: '',
  source: '',
  resolveStatus: '',
  agencyId: null as number | null,
  keyword: ''
})

const agencies = ref<Agency[]>([])
const items = ref<SalesLead[]>([])
const loading = ref(false)
/** 현재 페이지 (0-based — Pagination 컴포넌트 계약과 같음) */
const currentPage = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)

const loadPage = async () => {
  loading.value = true
  try {
    const f = searchForm.value
    const res = await salesLeadService.search({
      fromDate: f.fromDate || undefined,
      toDate: f.toDate || undefined,
      leadKind: f.leadKind || undefined,
      source: f.source || undefined,
      resolveStatus: f.resolveStatus || undefined,
      agencyId: f.agencyId,
      keyword: f.keyword.trim() || undefined,
      page: currentPage.value,
      size: pageSize.value
    })
    items.value = res.content || []
    totalPages.value = res.totalPages || 0
    totalElements.value = res.totalElements || 0
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

const search = () => {
  currentPage.value = 0
  loadPage()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadPage()
}

// ===== 상세 =====
const detailTarget = ref<SalesLead | null>(null)

const openDetail = (item: SalesLead) => {
  detailTarget.value = item
}

// ===== 대리점 목록 (필터용) =====
const loadAgencies = async () => {
  try {
    agencies.value = await agencyService.getAgencies()
  } catch (e) {
    console.error('대리점 목록 로드 실패:', e)
  }
}

onMounted(() => {
  loadPage()
  loadAgencies()
})
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
}

.clickable-row:hover td {
  background: #f8fafc;
}

.small {
  font-size: 0.75rem;
}

.nowrap {
  white-space: nowrap;
}

.title-cell {
  min-width: 240px;
  max-width: 360px;
}

.title-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 600;
  color: #0f172a;
}

.org-cell {
  max-width: 200px;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
