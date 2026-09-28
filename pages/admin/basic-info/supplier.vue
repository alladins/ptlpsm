<!--
  기초정보 > 조달업체관리
  - 나라장터 조달업체 기본정보를 받아 두고(처음 전체 1회 + 매일 04:30 변경분) 검색한다
  - 이름에 «건축사사무소»가 들어간 업체는 설계사무소로 자동 등록·빈 칸 채우기
  - 명함 소속 «조달업체» 검색과 설계사무소 «업체정보 채우기»가 이 데이터를 쓴다
  - 좁은 화면(휴대폰)에서는 표 대신 카드 (영업관리 모바일 기준 — 메모리 sales-screens-mobile-first)
-->
<template>
  <div class="supplier-page">
    <PageHeader
      title="조달업체관리"
      description="나라장터 조달업체를 받아 두고 검색합니다. 건축사사무소는 설계사무소로 자동 등록됩니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-search'" /> 검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo" /> 초기화
        </button>
      </template>
    </PageHeader>

    <GuideNotice class="page-guide" icon="fa-industry" open-label="동기화 방법 보기">
      <template #summary>
        처음 한 번 <b>[전체 동기화]</b>로 모든 조달업체를 받아야 합니다 — 이후에는 매일 04:30 변경분만 자동으로 받습니다
      </template>
      <ol class="guide-steps">
        <li>나라장터는 업체명 검색을 지원하지 않아 전체를 받아 두고 이 화면에서 검색합니다 (약 80~90만 곳).</li>
        <li>한 번 실행에 최대 900회 호출(하루 한도 1,000회)이라 전체는 연도를 나눠 1~2일에 걸쳐 받습니다. 한도로 멈추면 실행 기록에 어디까지 받았는지 남습니다.</li>
        <li>받을 때마다 이름에 «건축사사무소»가 들어간 업체를 설계사무소로 등록하고, 기존 설계사무소의 빈 주소·전화·대표자를 채웁니다.</li>
      </ol>
      <template #note>
        호출 한도는 수요기관 동기화와 같이 씁니다. 수요기관 동기화를 같은 날 크게 돌렸다면 전체 동기화는 다음 날 하세요.
      </template>
    </GuideNotice>

    <!-- 상태·동기화 -->
    <div class="status-bar">
      <div class="stat">
        <span class="stat-label">받은 조달업체</span>
        <strong>{{ formatNumber(status?.total ?? 0) }}</strong>
      </div>
      <div class="stat">
        <span class="stat-label">건축사사무소</span>
        <strong>{{ formatNumber(status?.designOffices ?? 0) }}</strong>
      </div>
      <div class="stat">
        <span class="stat-label">설계사무소 등록</span>
        <strong>{{ formatNumber(status?.registeredDesignOffices ?? 0) }}</strong>
      </div>
      <div class="stat">
        <span class="stat-label">마지막 받은 시각</span>
        <span>{{ status?.lastSyncedAt ? formatDateTime(status.lastSyncedAt) : '아직 없음' }}</span>
      </div>
      <div class="sync-actions">
        <span v-if="status?.running" class="running"><i class="fas fa-spinner fa-spin" /> 동기화 중</span>
        <button class="btn-action btn-primary" :disabled="busy || status?.running" @click="showFullModal = true">
          <i class="fas fa-cloud-download-alt" /> 전체 동기화
        </button>
        <button class="btn-action btn-secondary" :disabled="busy || status?.running" @click="syncDaily">
          <i class="fas fa-sync-alt" /> 변경분 받기
        </button>
        <button
          class="btn-action btn-secondary"
          :disabled="busy || status?.running"
          title="API 호출 없이 받아 둔 조달업체 중 건축사사무소를 설계사무소로 등록·빈 칸 채우기"
          @click="applyDesignOffices"
        >
          <i class="fas fa-drafting-compass" /> 설계사무소 반영
        </button>
      </div>
    </div>

    <div class="content-section">
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="search"
              class="keyword-input"
              placeholder="업체명 또는 사업자번호"
              enterkeyhint="search"
              @keyup.enter="handleSearch"
            >
          </div>
          <div class="search-item">
            <label>지역:</label>
            <select v-model="searchForm.sido" class="status-select" @change="handleSearch">
              <option value="">
                전체
              </option>
              <option v-for="s in SIDO_PREFIXES" :key="s" :value="s">
                {{ s }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label class="check-label">
              <input v-model="searchForm.designOnly" type="checkbox" @change="handleSearch">
              건축사사무소만
            </label>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 <strong>{{ formatNumber(totalElements) }}</strong>곳 중 {{ startIndex }}-{{ endIndex }} 표시</span>
          </div>
          <div class="table-actions">
            <select v-model="pageSize" class="page-size-select" @change="handleSearch">
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
          <p>불러오는 중...</p>
        </div>
        <div v-else-if="items.length === 0" class="no-data-message">
          <i class="fas fa-industry" />
          <p>{{ (status?.total ?? 0) === 0 ? '아직 받은 조달업체가 없습니다. [전체 동기화]를 먼저 실행하세요.' : '조건에 맞는 업체가 없습니다.' }}</p>
        </div>
        <template v-else>
          <!-- PC·태블릿: 표 -->
          <div class="table-container wide-only">
            <table class="data-table">
              <thead>
                <tr>
                  <th>업체명</th>
                  <th>사업자번호</th>
                  <th>대표자</th>
                  <th>지역</th>
                  <th>업무 구분</th>
                  <th>전화</th>
                  <th>변경일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in items" :key="s.bizno">
                  <td class="text-left">
                    {{ s.corpNm }}
                    <span v-if="s.hdoffceDivNm === '지사'" class="tag">지사</span>
                    <NuxtLink v-if="s.designOfficeId" :to="`/admin/design-office/list?id=${s.designOfficeId}`" class="tag design">
                      설계사무소
                    </NuxtLink>
                    <span v-else-if="s.isDesignOffice === 'Y'" class="tag design-pending" title="건축사사무소 — 다음 반영 때 설계사무소로 등록">건축사사무소</span>
                  </td>
                  <td class="nowrap">
                    {{ formatBizno(s.bizno) }}
                  </td>
                  <td>{{ s.ceoNm || '-' }}</td>
                  <td class="nowrap">
                    {{ s.rgnNm || '-' }}
                  </td>
                  <td class="text-left small">
                    {{ s.corpBsnsDivNm || '-' }}
                  </td>
                  <td class="nowrap">
                    {{ s.telNo || '-' }}
                  </td>
                  <td class="nowrap small">
                    {{ s.chgDt ? s.chgDt.substring(0, 10) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 휴대폰: 카드 -->
          <ul class="card-list narrow-only">
            <li v-for="s in items" :key="s.bizno" class="card">
              <div class="card-title">
                {{ s.corpNm }}
                <NuxtLink v-if="s.designOfficeId" :to="`/admin/design-office/list?id=${s.designOfficeId}`" class="tag design">
                  설계사무소
                </NuxtLink>
              </div>
              <div class="card-meta">
                {{ formatBizno(s.bizno) }} · {{ s.ceoNm || '-' }}
              </div>
              <div v-if="s.adrs" class="card-meta">
                {{ s.adrs }}
              </div>
              <a v-if="s.telNo" :href="`tel:${s.telNo}`" class="card-tel"><i class="fas fa-phone" /> {{ s.telNo }}</a>
            </li>
          </ul>
        </template>

        <Pagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="changePage"
        />
      </div>

      <!-- 실행 기록 -->
      <details class="runs-block" :open="runsOpen" @toggle="onRunsToggle">
        <summary>동기화 실행 기록</summary>
        <div class="table-container">
          <table class="data-table runs-table">
            <thead>
              <tr>
                <th>시작</th>
                <th>종류</th>
                <th>구간</th>
                <th>상태</th>
                <th>호출</th>
                <th>받음</th>
                <th>저장</th>
                <th>설계사무소</th>
                <th>메시지</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="runs.length === 0">
                <td colspan="9" class="text-muted">
                  실행 기록이 없습니다.
                </td>
              </tr>
              <tr v-for="r in runs" :key="r.runId">
                <td class="nowrap">
                  {{ formatDateTime(r.startedAt) }}
                </td>
                <td class="nowrap">
                  {{ SUPPLIER_SYNC_MODE_LABELS[r.mode] || r.mode }}
                  <span class="text-muted small">{{ r.triggerType === 'SCHEDULE' ? '자동' : '수동' }}</span>
                </td>
                <td class="small">
                  {{ r.rangeText || '-' }}
                </td>
                <td>
                  <span class="status-badge" :class="SUPPLIER_RUN_STATUS[r.status]?.badge">{{ SUPPLIER_RUN_STATUS[r.status]?.label || r.status }}</span>
                </td>
                <td>{{ formatNumber(r.apiCalls) }}</td>
                <td>{{ formatNumber(r.fetched) }}</td>
                <td>{{ formatNumber(r.upserted) }}</td>
                <td>{{ formatNumber(r.designOffices) }}</td>
                <td class="text-left small">
                  {{ r.message || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>

    <!-- 전체 동기화 -->
    <Teleport to="body">
      <div v-if="showFullModal" class="modal-overlay" @click.self="showFullModal = false">
        <div class="modal-content full-modal">
          <div class="modal-header">
            <h3>조달업체 전체 동기화</h3>
            <button type="button" class="modal-close" @click="showFullModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              나라장터 <b>등록연도</b> 기준으로 받습니다. 한 번에 최대 900회 호출 — 한 해 약 2~4만 곳이라
              <b>10년 안팎</b>씩 나눠 실행하세요. 한도로 멈추면 실행 기록에 이어서 받을 연도가 남습니다.
            </p>
            <div class="year-row">
              <label>시작 연도</label>
              <input v-model.number="fullForm.bgnYear" type="number" class="form-input" :min="1980" :max="thisYear">
              <span>~</span>
              <label>끝 연도</label>
              <input v-model.number="fullForm.endYear" type="number" class="form-input" :min="1980" :max="thisYear">
            </div>
            <div class="preset-row">
              <button v-for="p in YEAR_PRESETS" :key="p.label" type="button" class="btn-action btn-secondary btn-sm" @click="fullForm.bgnYear = p.bgn; fullForm.endYear = Math.min(p.end, thisYear)">
                {{ p.label }}
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showFullModal = false">
              취소
            </button>
            <button type="button" class="btn-primary" :disabled="busy" @click="syncFull">
              동기화 시작
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import Pagination from '~/components/ui/Pagination.vue'
import {
  g2bSupplierService,
  SUPPLIER_RUN_STATUS,
  SUPPLIER_SYNC_MODE_LABELS,
  type G2bSupplier,
  type SupplierStatus,
  type SupplierSyncRun
} from '~/services/g2b-supplier.service'
import { formatDateTime, formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'

definePageMeta({
  layout: 'admin',
  pageTitle: '조달업체관리'
})

/** 나라장터 지역명 앞부분 (rgn_nm 이 «경기도 광명시» 처럼 온다) */
const SIDO_PREFIXES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충청북도', '충청남도',
  '전북', '전라남도', '전남광주', '경상북도', '경상남도', '제주']

const thisYear = new Date().getFullYear()
const YEAR_PRESETS = [
  { label: '~2005', bgn: 1980, end: 2005 },
  { label: '2006~2013', bgn: 2006, end: 2013 },
  { label: '2014~2020', bgn: 2014, end: 2020 },
  { label: `2021~${thisYear}`, bgn: 2021, end: thisYear }
]

const searchForm = ref({ keyword: '', sido: '', designOnly: false })
const items = ref<G2bSupplier[]>([])
const loading = ref(false)
const currentPage = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)
const startIndex = computed(() => (totalElements.value === 0 ? 0 : currentPage.value * pageSize.value + 1))
const endIndex = computed(() => Math.min((currentPage.value + 1) * pageSize.value, totalElements.value))

const formatBizno = (b?: string | null) => {
  const d = (b || '').replace(/[^0-9]/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : (b || '-')
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await g2bSupplierService.search({
      keyword: searchForm.value.keyword.trim() || undefined,
      sido: searchForm.value.sido || undefined,
      designOnly: searchForm.value.designOnly || undefined,
      page: currentPage.value,
      size: pageSize.value
    })
    items.value = res.content || []
    totalPages.value = res.totalPages || 0
    totalElements.value = res.totalElements || 0
  } catch (e) {
    const err = toApiError(e)
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 0
  loadList()
}

const handleReset = () => {
  searchForm.value = { keyword: '', sido: '', designOnly: false }
  handleSearch()
}

const changePage = (p: number) => {
  currentPage.value = p
  loadList()
}

// ===== 상태·실행 기록 =====
const status = ref<SupplierStatus | null>(null)
const runs = ref<SupplierSyncRun[]>([])
const runsOpen = ref(false)
const busy = ref(false)

const loadStatus = async () => {
  try {
    status.value = await g2bSupplierService.getStatus()
    if (runsOpen.value || status.value.running) {
      runs.value = await g2bSupplierService.getRuns(30)
    }
  } catch (e) {
    console.error('조달업체 상태 로드 실패:', e)
  }
}

const onRunsToggle = (e: Event) => {
  runsOpen.value = (e.target as HTMLDetailsElement).open
  if (runsOpen.value) { loadStatus() }
}

// 동기화 중에는 10초마다 상태·기록을 새로 받는다 (끝나면 목록도 새로)
let poll: ReturnType<typeof setInterval> | null = null
const startPolling = () => {
  if (poll) { return }
  poll = setInterval(async () => {
    const wasRunning = status.value?.running
    await loadStatus()
    if (wasRunning && !status.value?.running) {
      stopPolling()
      loadList()
    }
  }, 10000)
}
const stopPolling = () => {
  if (poll) { clearInterval(poll); poll = null }
}
onBeforeUnmount(stopPolling)

const run = async (call: () => Promise<SupplierStatus>, doneMsg: string) => {
  busy.value = true
  try {
    await call()
    runsOpen.value = true
    alert(doneMsg)
    await loadStatus()
    startPolling()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    busy.value = false
  }
}

const showFullModal = ref(false)
const fullForm = ref({ bgnYear: 1980, endYear: 2005 })

const syncFull = () => {
  const { bgnYear, endYear } = fullForm.value
  if (!bgnYear || !endYear || bgnYear > endYear) {
    alert('연도 구간을 확인하세요.')
    return
  }
  showFullModal.value = false
  run(() => g2bSupplierService.syncFull(bgnYear, endYear),
    `${bgnYear}~${endYear}년 등록 업체 받기를 시작했습니다. 아래 실행 기록에서 진행을 볼 수 있습니다.`)
}

const syncDaily = () => run(() => g2bSupplierService.syncDaily(), '최근 2일 변경분 받기를 시작했습니다.')

const applyDesignOffices = () => {
  if (!confirm('받아 둔 조달업체 중 건축사사무소를 설계사무소로 등록하고, 기존 설계사무소의 빈 주소·전화·대표자를 채웁니다. 진행할까요?')) { return }
  run(() => g2bSupplierService.applyDesignOffices(), '설계사무소 반영을 시작했습니다.')
}

onMounted(async () => {
  await loadStatus()
  if (status.value?.running) {
    runsOpen.value = true
    startPolling()
  }
  loadList()
})
</script>

<style scoped>
.page-guide {
  margin-bottom: 0.75rem;
}

.guide-steps {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.7;
}

.status-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
}

.sync-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.running {
  font-size: 0.8125rem;
  color: #2563eb;
}

.check-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
}

.tag {
  margin-left: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.6875rem;
  font-weight: 600;
  text-decoration: none;
}

.tag.design {
  background: #f3e8ff;
  color: #6b21a8;
}

.tag.design-pending {
  background: #fef3c7;
  color: #92400e;
}

.small {
  font-size: 0.75rem;
}

.nowrap {
  white-space: nowrap;
}

/* 휴대폰은 카드, 그 외는 표 */
.narrow-only {
  display: none;
}

@media (max-width: 640px) {
  .wide-only {
    display: none;
  }

  .narrow-only {
    display: block;
  }

  .sync-actions {
    margin-left: 0;
    width: 100%;
  }

  .sync-actions .btn-action {
    flex: 1 1 auto;
    min-height: 44px;
  }
}

.card-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.card-meta {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: #64748b;
}

.card-tel {
  display: inline-block;
  margin-top: 0.375rem;
  padding: 0.375rem 0.625rem;
  min-height: 36px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1d4ed8;
  font-size: 0.8125rem;
  text-decoration: none;
}

.runs-block {
  margin-top: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
}

.runs-block summary {
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.runs-table {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
}

.full-modal {
  max-width: 560px;
}

.modal-desc {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #475569;
}

.year-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.year-row .form-input {
  width: 100px;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.btn-sm {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}
</style>
