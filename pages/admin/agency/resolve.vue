<template>
  <div class="agency-resolve">
    <PageHeader
      title="담당판정확인"
      description="수요기관이 어느 권역·대리점 담당으로 판정되는지 확인하고, 틀린 판정은 수동으로 바로잡습니다."
    >
      <template #actions>
        <button class="btn-action btn-warning" :disabled="rebuilding" @click="showRebuildConfirm = true">
          <i :class="rebuilding ? 'fas fa-spinner fa-spin' : 'fas fa-redo'" />
          자동 판정 재실행
        </button>
      </template>
    </PageHeader>

    <!-- 재실행 결과 요약 -->
    <div v-if="rebuildResult" class="rebuild-summary">
      <div>
        <strong><i class="fas fa-check-circle" /> 자동 판정 재실행 완료</strong>
        — 대상 {{ formatNumber(rebuildResult.totalOrgs) }}곳 · 저장 {{ formatNumber(rebuildResult.saved) }}곳 ·
        시군구 매칭 {{ formatNumber(rebuildResult.sigunguMatched) }}곳 ({{ matchRate }}) ·
        수동 보정 유지 {{ formatNumber(rebuildResult.skippedManual) }}곳
      </div>
      <div class="summary-cats">
        <span v-for="(count, cat) in rebuildResult.countsByCategory" :key="cat" class="status-badge" :class="categoryBadge(String(cat))">
          {{ codeLabel(ORG_CATEGORY_LABELS, String(cat)) }} {{ formatNumber(count) }}
        </span>
      </div>
      <button type="button" class="close-summary" title="닫기" @click="rebuildResult = null">
        <i class="fas fa-times" />
      </button>
    </div>

    <div class="content-section tab-box">
      <div class="tab-navigation">
        <button type="button" class="tab-button" :class="{ active: activeTab === 'org' }" @click="activeTab = 'org'">
          <i class="fas fa-building" /> 수요기관 판정
        </button>
        <button type="button" class="tab-button" :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">
          <i class="fas fa-clipboard-list" /> 납품요구 미리보기
        </button>
      </div>

      <!-- ① 수요기관 판정 -->
      <div v-if="activeTab === 'org'" class="tab-content">
        <div class="search-section-compact">
          <div class="search-row-single">
            <div class="search-item">
              <label>검색어:</label>
              <input
                v-model="searchForm.keyword"
                type="text"
                class="keyword-input"
                placeholder="수요기관명, 코드, 주소"
                @keyup.enter="search"
              >
            </div>
            <div class="search-item">
              <label>기관 구분:</label>
              <select v-model="searchForm.orgCategory" class="status-select" @change="search">
                <option value="">
                  전체
                </option>
                <option v-for="(label, code) in ORG_CATEGORY_LABELS" :key="code" :value="code">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="search-item">
              <label>출처:</label>
              <select v-model="searchForm.source" class="status-select" @change="search">
                <option value="">
                  전체
                </option>
                <option v-for="(label, code) in ATTR_SOURCE_LABELS" :key="code" :value="code">
                  {{ label }}
                </option>
              </select>
            </div>
            <label class="search-item failed-only">
              <input v-model="searchForm.failedOnly" type="checkbox" @change="search">
              판정 실패만
            </label>
            <button class="btn-search-inline" :disabled="loading" @click="search">
              <i class="fas fa-search" /> 검색
            </button>
          </div>
        </div>

        <div class="table-section">
          <div class="table-header">
            <div class="table-info">
              <span>총 <strong>{{ formatNumber(totalElements) }}</strong>곳</span>
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
            <p>조건에 맞는 수요기관이 없습니다.</p>
          </div>
          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>수요기관</th>
                  <th>주소</th>
                  <th>시군구</th>
                  <th>기관 구분</th>
                  <th>채널</th>
                  <th>판정 방식</th>
                  <th>출처</th>
                  <th>근거</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.dminsttCd" :class="{ 'manual-row': item.source === 'MANUAL' }">
                  <td class="text-left">
                    <div class="org-name">
                      {{ item.dminsttNm || '-' }}
                    </div>
                    <div class="text-muted small">
                      {{ item.dminsttCd }}
                    </div>
                  </td>
                  <td class="text-left address-cell">
                    {{ item.adrs || '-' }}
                  </td>
                  <td>
                    <span v-if="item.sigunguNm">{{ item.sigunguNm }}</span>
                    <span v-else class="status-badge danger">판정 실패</span>
                  </td>
                  <td>
                    <span v-if="item.orgCategory" class="status-badge" :class="categoryBadge(item.orgCategory)">
                      {{ codeLabel(ORG_CATEGORY_LABELS, item.orgCategory) }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>{{ codeLabel(AGENCY_CHANNEL_LABELS, item.channel) }}</td>
                  <td>
                    {{ codeLabel(RESOLVE_MODE_LABELS, item.resolveMode) }}
                    <div v-if="item.resolveMode === 'FIXED_REGION' && item.fixedRegionName" class="text-muted small">
                      {{ item.fixedRegionName }}
                    </div>
                  </td>
                  <td>
                    <span v-if="!item.judged" class="status-badge muted">미판정</span>
                    <span v-else-if="item.source === 'MANUAL'" class="status-badge warning">수동 보정</span>
                    <span v-else class="status-badge primary">자동</span>
                  </td>
                  <td class="text-left note-cell">
                    {{ item.matchNote || '-' }}
                  </td>
                  <td>
                    <div class="row-actions">
                      <button type="button" class="btn-action btn-info btn-mini" @click="openResolve(item)">
                        판정 보기
                      </button>
                      <button type="button" class="btn-action btn-secondary btn-mini" @click="openManual(item)">
                        수동 보정
                      </button>
                    </div>
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

      <!-- ② 납품요구 미리보기 -->
      <div v-else class="tab-content">
        <ResolvePreviewTab />
      </div>
    </div>

    <!-- 판정 보기 모달 -->
    <Teleport to="body">
      <div v-if="resolveTarget" class="modal-overlay" @click.self="resolveTarget = null">
        <div class="modal-content resolve-modal">
          <div class="modal-header">
            <h3>담당 판정 — {{ resolveTarget.dminsttNm || resolveTarget.dminsttCd }}</h3>
            <button type="button" class="modal-close" @click="resolveTarget = null">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="base-date-row">
              <label>기준일</label>
              <input v-model="resolveBaseDate" type="date" class="form-input base-date">
              <button type="button" class="btn-action btn-secondary" :disabled="resolving" @click="runResolve">
                <i :class="resolving ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 다시 판정
              </button>
              <span class="text-muted small">기준일에 담당이던 대리점을 찾습니다.</span>
            </div>
            <div v-if="resolving && !resolveResult" class="loading-message">
              <i class="fas fa-spinner fa-spin" />
              <p>판정 중...</p>
            </div>
            <ResolveResultCard v-else-if="resolveResult" :result="resolveResult" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="openManualFromResolve">
              수동 보정
            </button>
            <button type="button" class="btn-primary" @click="resolveTarget = null">
              닫기
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 수동 보정 모달 -->
    <DemandOrgManualModal
      v-if="manualTarget"
      :attr="manualTarget"
      :regions="regions"
      :sigungu="allSigungu"
      @close="manualTarget = null"
      @saved="onManualSaved"
    />

    <!-- 자동 판정 재실행 확인 -->
    <Teleport to="body">
      <div v-if="showRebuildConfirm" class="modal-overlay" @click.self="closeRebuildConfirm">
        <div class="modal-content rebuild-modal">
          <div class="modal-header">
            <h3>자동 판정 재실행</h3>
            <button type="button" class="modal-close" :disabled="rebuilding" @click="closeRebuildConfirm">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <ul class="rebuild-explain">
              <li>전체 수요기관 <strong>약 7.6만 곳</strong>의 시군구·기관 구분·채널을 주소와 기관명으로 다시 판정합니다.</li>
              <li><strong>수동 보정한 기관은 그대로 유지</strong>됩니다.</li>
              <li>수십 초 정도 걸릴 수 있습니다. 끝날 때까지 이 화면을 닫지 마세요.</li>
              <li>권역·대리점 담당 설정은 바뀌지 않습니다.</li>
            </ul>
            <div v-if="rebuilding" class="loading-message">
              <i class="fas fa-spinner fa-spin" />
              <p>재판정 중입니다...</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="rebuilding" @click="closeRebuildConfirm">
              취소
            </button>
            <button type="button" class="btn-primary" :disabled="rebuilding" @click="runRebuild">
              <i v-if="rebuilding" class="fas fa-spinner fa-spin" />
              재실행
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 담당판정확인
 * ① 수요기관 판정: 판정값 검색·판정 보기·수동 보정·자동 재실행
 * ② 납품요구 미리보기: 기존 납품요구의 판정 결과 (저장하지 않음)
 */
import { ref, computed, onMounted } from 'vue'
import Pagination from '~/components/ui/Pagination.vue'
import ResolveResultCard from '~/components/admin/agency/ResolveResultCard.vue'
import ResolvePreviewTab from '~/components/admin/agency/ResolvePreviewTab.vue'
import DemandOrgManualModal from '~/components/admin/agency/DemandOrgManualModal.vue'
import { agencyService, demandOrgAttrService, salesRegionService } from '~/services/agency.service'
import { formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import {
  AGENCY_CHANNEL_LABELS,
  ATTR_SOURCE_LABELS,
  ORG_CATEGORY_BADGE,
  ORG_CATEGORY_LABELS,
  RESOLVE_MODE_LABELS,
  codeLabel,
  todayKst,
  type AgencyResolveResult,
  type DemandOrgSalesAttr,
  type RebuildResult,
  type SalesRegion,
  type Sigungu
} from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '담당판정확인'
})

const activeTab = ref<'org' | 'preview'>('org')

// 권역·시군구 (수동 보정 모달용)
const regions = ref<SalesRegion[]>([])
const allSigungu = ref<Sigungu[]>([])

const categoryBadge = (cat: string) =>
  (ORG_CATEGORY_BADGE as Record<string, string>)[cat] || 'muted'

// ===== 수요기관 목록 =====
const searchForm = ref({ keyword: '', orgCategory: '', source: '', failedOnly: false })
const items = ref<DemandOrgSalesAttr[]>([])
const loading = ref(false)
/** 현재 페이지 (0-based — Pagination 컴포넌트 계약과 같음) */
const currentPage = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)

const loadPage = async () => {
  loading.value = true
  try {
    const res = await demandOrgAttrService.search({
      keyword: searchForm.value.keyword.trim() || undefined,
      orgCategory: searchForm.value.orgCategory || undefined,
      source: searchForm.value.source || undefined,
      failedOnly: searchForm.value.failedOnly,
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

// ===== 판정 보기 =====
const resolveTarget = ref<DemandOrgSalesAttr | null>(null)
const resolveResult = ref<AgencyResolveResult | null>(null)
const resolveBaseDate = ref(todayKst())
const resolving = ref(false)

const runResolve = async () => {
  if (!resolveTarget.value) { return }
  resolving.value = true
  try {
    resolveResult.value = await agencyService.resolve(resolveTarget.value.dminsttCd, resolveBaseDate.value || undefined)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    resolving.value = false
  }
}

const openResolve = (item: DemandOrgSalesAttr) => {
  resolveTarget.value = item
  resolveResult.value = null
  resolveBaseDate.value = todayKst()
  runResolve()
}

// ===== 수동 보정 =====
const manualTarget = ref<DemandOrgSalesAttr | null>(null)

const openManual = (item: DemandOrgSalesAttr) => {
  manualTarget.value = item
}

const openManualFromResolve = () => {
  const target = resolveTarget.value
  resolveTarget.value = null
  if (target) { openManual(target) }
}

const onManualSaved = (saved: DemandOrgSalesAttr) => {
  manualTarget.value = null
  // 목록의 해당 행만 갈아 끼운다 (검색 조건이 바뀌지 않도록)
  const idx = items.value.findIndex(i => i.dminsttCd === saved.dminsttCd)
  if (idx >= 0) { items.value.splice(idx, 1, saved) }
  alert('판정값이 저장되었습니다.')
}

// ===== 자동 판정 재실행 =====
const showRebuildConfirm = ref(false)
const rebuilding = ref(false)
const rebuildResult = ref<RebuildResult | null>(null)

const matchRate = computed(() => {
  const r = rebuildResult.value
  if (!r || !r.saved) { return '-' }
  return `${((r.sigunguMatched / r.saved) * 100).toFixed(1)}%`
})

const closeRebuildConfirm = () => {
  if (rebuilding.value) { return }
  showRebuildConfirm.value = false
}

const runRebuild = async () => {
  rebuilding.value = true
  try {
    rebuildResult.value = await demandOrgAttrService.rebuild()
    showRebuildConfirm.value = false
    await loadPage()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    rebuilding.value = false
  }
}

// ===== 초기 로드 =====
const loadRefs = async () => {
  try {
    const [regionList, sigunguList] = await Promise.all([
      salesRegionService.getRegions(),
      salesRegionService.getSigungu()
    ])
    regions.value = regionList
    allSigungu.value = sigunguList
  } catch (e) {
    console.error('권역·시군구 로드 실패:', e)
  }
}

onMounted(() => {
  loadPage()
  loadRefs()
})
</script>

<style scoped>
@import '@/assets/css/admin-tabs.css';

.tab-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.tab-content {
  padding: 1rem;
}

.failed-only {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.org-name {
  font-weight: 600;
  color: #0f172a;
}

.small {
  font-size: 0.75rem;
}

.address-cell {
  max-width: 260px;
  font-size: 0.75rem;
  color: #475569;
}

.note-cell {
  max-width: 240px;
  font-size: 0.75rem;
  color: #475569;
}

.manual-row td {
  background: #fffbeb;
}

.row-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-mini {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  white-space: nowrap;
}

.status-badge.muted {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.rebuild-summary {
  position: relative;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  font-size: 0.8125rem;
  color: #065f46;
}

.summary-cats {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.close-summary {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  background: none;
  color: #065f46;
  cursor: pointer;
}

.resolve-modal {
  max-width: 640px;
}

.base-date-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.base-date-row label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: #475569;
}

.form-input.base-date {
  width: 160px;
}

.rebuild-modal {
  max-width: 560px;
}

.rebuild-explain {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.8;
  font-size: 0.875rem;
  color: #334155;
}
</style>
