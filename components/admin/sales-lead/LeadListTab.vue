<!--
  공모·낙찰 수집 — ① 수집 결과
  - 낙찰·계약일 기간(기본 최근 7일)·종류·단계·판정 상태·영업 진행·담당 대리점·검색어로 조회 (2026-10-06 기간 기준을 첫 수집일 → 낙찰·계약일로)
  - 왼쪽 권역 트리(수요기관 소재 시군구 → 권역)로 권역별로 본다 — 설계사무소관리와 같은 패널
  - 목록 열은 사업명(종류 뱃지)·수요기관·낙찰계약업체·금액·낙찰계약일·설계사무소·영업 진행·첫 수집일.
    종류·단계·담당 대리점은 상세 모달에서 (열 공간을 트리에 내줌)
  - 행을 누르면 상세 모달 (원천 필드·판별 근거·설계사무소 연결·담당 판정)
-->
<template>
  <div class="lead-list-tab">
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>낙찰·계약일:</label>
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
          <label>단계:</label>
          <select v-model="searchForm.source" class="status-select" @change="search">
            <option v-for="opt in LEAD_STAGE_FILTER_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
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
          <label>영업 진행:</label>
          <select v-model="searchForm.progressStatus" class="status-select" @change="search">
            <option value="">
              전체
            </option>
            <option v-for="code in LEAD_PROGRESS_ORDER" :key="code" :value="code">
              {{ LEAD_PROGRESS_LABELS[code] }}
            </option>
          </select>
        </div>
        <div class="search-item">
          <label class="stale-check">
            <input v-model="searchForm.staleOnly" type="checkbox" @change="onStaleOnlyChange">
            방치만
          </label>
        </div>
        <!-- 대리점 목록은 리드파워 전용 API 라 관리자에게만 (대리점 소속은 서버가 자기 대리점 것만 준다) -->
        <div v-if="showAgencyFilter" class="search-item">
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

    <div class="lead-layout">
      <!-- 좌: 권역 트리 — 숫자는 현재 검색 조건(기간·종류·단계·영업 진행 …)을 따르고, 고른 권역은 세지 않는다 -->
      <RegionTreePanel
        :model-value="selected"
        :tree="treeData"
        unassigned-title="수요기관 소재 시군구는 판정됐으나 어느 권역에도 속하지 않은 곳 (광역시·세종·제주 등)"
        unresolved-label="미판정"
        unresolved-title="수요기관을 못 찾았거나 소재 시군구를 못 정한 건 — 수요기관 동기화 후 다시 판정됩니다"
        @update:model-value="selectNode"
      />

      <div class="list-col">
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
            <!-- 휴대폰: 카드 — 누르면 상세 -->
            <ul class="m-card-list m-narrow-only">
              <li v-for="item in items" :key="`c-${item.leadId}`">
                <button type="button" class="m-card" @click="openDetail(item)">
                  <div class="m-card-head">
                    <span class="m-card-title">{{ item.title || '-' }}</span>
                    <LeadKindBadge :kind="item.projectKind || item.leadKind" small />
                  </div>
                  <div class="m-card-meta">
                    <LeadProgressBadge :status="item.progressStatus" :stale="item.stale" />
                  </div>
                  <div class="m-card-meta">
                    {{ item.dminsttNm || '-' }}
                  </div>
                  <div class="m-card-meta">
                    {{ item.winnerNm || '-' }} · {{ item.amount === null || item.amount === undefined ? '-' : formatNumber(item.amount) + '원' }} · {{ item.eventDate || '-' }}
                  </div>
                  <div v-if="item.designOfficeId" class="m-card-meta">
                    설계사무소 {{ item.designOfficeName || `#${item.designOfficeId}` }}
                  </div>
                </button>
              </li>
            </ul>
            <table class="data-table m-wide-only">
              <thead>
                <tr>
                  <th>사업명</th>
                  <th>수요기관</th>
                  <th>낙찰·계약업체</th>
                  <th>금액(원)</th>
                  <th>낙찰·계약일</th>
                  <th>설계사무소</th>
                  <th>영업 진행</th>
                  <th>첫 수집일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.leadId" class="clickable-row" @click="openDetail(item)">
                  <td class="text-left title-cell">
                    <div class="title-row">
                      <LeadKindBadge :kind="item.projectKind || item.leadKind" small />
                      <div class="title-clamp" :title="item.title || ''">
                        {{ item.title || '-' }}
                      </div>
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
                    <div v-if="item.contractCount" class="text-muted small">
                      계약 {{ item.contractAmount === null || item.contractAmount === undefined ? '-' : formatNumber(item.contractAmount) }}
                    </div>
                  </td>
                  <td class="nowrap">
                    {{ item.eventDate || '-' }}
                    <div v-if="item.contractCount" class="text-muted small">
                      계약 {{ item.contractDate || '-' }}<template v-if="item.contractCount > 1">
                        외 {{ item.contractCount - 1 }}건
                      </template>
                    </div>
                  </td>
                  <td class="text-left">
                    <NuxtLink
                      v-if="item.designOfficeId"
                      :to="`/admin/design-office/list?id=${item.designOfficeId}`"
                      class="link"
                      :title="item.officeNote || ''"
                      @click.stop
                    >
                      {{ item.designOfficeName || `#${item.designOfficeId}` }}
                    </NuxtLink>
                    <span v-else class="text-muted" :title="item.officeNote || ''">-</span>
                  </td>
                  <td>
                    <LeadProgressBadge :status="item.progressStatus" :stale="item.stale" />
                  </td>
                  <td class="nowrap text-muted">
                    {{ item.firstSeenDate || '-' }}
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
      </div>
    </div>

    <LeadDetailModal
      v-if="detailTarget"
      :lead-id="detailTarget.leadId"
      :summary="detailTarget"
      :can-edit-progress="canEditProgress"
      @close="detailTarget = null"
      @progress-changed="loadPage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Pagination from '~/components/ui/Pagination.vue'
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import LeadKindBadge from '~/components/admin/sales-lead/LeadKindBadge.vue'
import LeadDetailModal from '~/components/admin/sales-lead/LeadDetailModal.vue'
import LeadProgressBadge from '~/components/admin/sales-lead/LeadProgressBadge.vue'
import RegionTreePanel from '~/components/admin/sales/RegionTreePanel.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { agencyService } from '~/services/agency.service'
import { formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import {
  RESOLVE_STATUS_LABELS,
  todayKst,
  type Agency,
  type RegionTreeData,
  type RegionTreeSelection
} from '~/types/agency'
import {
  LEAD_KIND_FILTER_OPTIONS,
  LEAD_PROGRESS_LABELS,
  LEAD_PROGRESS_ORDER,
  LEAD_STAGE_FILTER_OPTIONS,
  addDays,
  formatBizno,
  type SalesLead,
  type SalesLeadRegionTree
} from '~/types/sales-lead'

interface Props {
  showAgencyFilter?: boolean
  /** 상세 모달에서 영업 진행 상태를 바꿀 수 있는지 (관리자 둘 + 영업) */
  canEditProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), { showAgencyFilter: true, canEditProgress: false })

// 기본 기간: 오늘 포함 최근 7일 (KST)
const today = todayKst()
const searchForm = ref({
  fromDate: addDays(today, -6),
  toDate: today,
  leadKind: '',
  source: '',
  resolveStatus: '',
  agencyId: null as number | null,
  keyword: '',
  progressStatus: '',
  staleOnly: false
})

const agencies = ref<Agency[]>([])
const items = ref<SalesLead[]>([])
const loading = ref(false)
/** 현재 페이지 (0-based — Pagination 컴포넌트 계약과 같음) */
const currentPage = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)

// ===== 권역 트리 (왼쪽) =====
const tree = ref<SalesLeadRegionTree | null>(null)
const selected = ref<RegionTreeSelection>({ kind: 'all' })

/** 패널이 그리는 모양으로 (leadCount → count) */
const treeData = computed<RegionTreeData | null>(() => tree.value
  ? {
      regions: tree.value.regions.map(r => ({ regionId: r.regionId, regionName: r.regionName, parentRegionId: r.parentRegionId, count: r.leadCount })),
      unassigned: tree.value.unassigned,
      unresolved: tree.value.unresolved,
      total: tree.value.total,
      myRegionIds: tree.value.myRegionIds || []
    }
  : null)

/** 검색 조건 (권역·페이지 제외) — 목록과 트리가 같이 쓴다 */
const filterParams = () => {
  const f = searchForm.value
  return {
    fromDate: f.fromDate || undefined,
    toDate: f.toDate || undefined,
    leadKind: f.leadKind || undefined,
    source: f.source || undefined,
    resolveStatus: f.resolveStatus || undefined,
    agencyId: f.agencyId,
    keyword: f.keyword.trim() || undefined,
    progressStatus: f.progressStatus || undefined,
    // false 는 보내지 않는다 (서버 기본값 = 전체)
    staleOnly: f.staleOnly || undefined
  }
}

const loadTree = async () => {
  try {
    tree.value = await salesLeadService.getRegionTree(filterParams())
    // 대리점 직원은 자기 담당 권역부터 (여러 개면 트리 순서상 첫 번째)
    const mine = tree.value.myRegionIds || []
    if (mine.length > 0 && selected.value.kind === 'all') {
      const first = tree.value.regions.find(r => mine.includes(r.regionId))
      if (first) {
        selected.value = { kind: 'region', regionId: first.regionId }
      }
    }
  } catch (e) {
    console.error('권역 트리 로드 실패:', e)
  }
}

/** 트리에서 고르면 목록만 다시 (트리 숫자는 고른 권역과 무관) */
const selectNode = (s: RegionTreeSelection) => {
  selected.value = s
  currentPage.value = 0
  loadPage()
}

const loadPage = async () => {
  loading.value = true
  try {
    const res = await salesLeadService.search({
      ...filterParams(),
      regionId: selected.value.kind === 'region' ? selected.value.regionId : undefined,
      unassigned: selected.value.kind === 'unassigned' || undefined,
      unresolved: selected.value.kind === 'unresolved' || undefined,
      page: currentPage.value,
      size: pageSize.value
    })
    items.value = res.content || []
    totalPages.value = res.totalPages || 0
    totalElements.value = res.totalElements || 0
  } catch (e) {
    const err = toApiError(e)
    // 세션 만료(401·403)는 로그인 화면으로 넘어가므로 목록 불러오기 실패 팝업을 띄우지 않는다
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    loading.value = false
  }
}

/** 검색 조건이 바뀌면 목록과 트리 숫자를 같이 */
const search = () => {
  currentPage.value = 0
  loadPage()
  loadTree()
}

/**
 * «방치만» — 방치는 받은 지 7일 이상이라 기본 기간(최근 7일)에는 걸리지 않을 수 있다.
 * 켜면 낙찰·계약일 기간을 비워 전체 기간에서 찾고, 끄면 켜기 전 기간으로 되돌린다
 */
let periodBeforeStale: { fromDate: string, toDate: string } | null = null
const onStaleOnlyChange = () => {
  if (searchForm.value.staleOnly) {
    periodBeforeStale = { fromDate: searchForm.value.fromDate, toDate: searchForm.value.toDate }
    searchForm.value.fromDate = ''
    searchForm.value.toDate = ''
  } else if (periodBeforeStale) {
    searchForm.value.fromDate = periodBeforeStale.fromDate
    searchForm.value.toDate = periodBeforeStale.toDate
    periodBeforeStale = null
  }
  search()
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

onMounted(async () => {
  // 트리를 먼저 받아야 대리점 직원의 «내 권역»으로 첫 목록을 거를 수 있다
  await loadTree()
  loadPage()
  if (props.showAgencyFilter) {
    loadAgencies()
  }
})
</script>

<style scoped>
/* 좌 권역 트리 + 우 목록 (설계사무소관리와 같은 배치) */
.lead-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 900px) {
  .lead-layout {
    /* 1fr 이면 칸이 안쪽 내용 폭만큼 늘어나 카드가 화면 밖으로 밀린다 */
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 사업명 칸 — 종류 뱃지 + 제목 (종류 열을 뺀 대신) */
.title-row {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
}

.title-row .kind-badge {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

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

/* «방치만» 체크 — 터치 대상 44px */
.search-item label.stale-check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 44px;
  cursor: pointer;
}

.stale-check input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
