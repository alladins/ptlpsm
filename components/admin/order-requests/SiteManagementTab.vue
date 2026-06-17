<template>
  <section class="tab-section">
    <!-- 검색 + 등록 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item search-keyword">
          <label>검색어:</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="keyword-input"
            placeholder="프로젝트명/대표소장/연락처"
            @keyup.enter="search"
          >
        </div>
        <div class="search-item">
          <label>활성:</label>
          <select v-model="filters.active" class="status-select" @change="search">
            <option :value="undefined">전체</option>
            <option :value="true">활성</option>
            <option :value="false">비활성</option>
          </select>
        </div>
        <button class="btn-action" :disabled="loading" @click="search">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action btn-primary" @click="openCreate">
          <i class="fas fa-plus" />
          신규 등록
        </button>
      </div>
    </div>

    <!-- 테이블 섹션 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
        </div>
        <div class="table-actions">
          <select v-model.number="pageSize" class="page-size-select" @change="changePageSize">
            <option :value="10">10개씩</option>
            <option :value="20">20개씩</option>
            <option :value="50">50개씩</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>납품요구번호</th>
              <th>프로젝트명</th>
              <th>수요기관</th>
              <th>주소</th>
              <th>대표소장</th>
              <th>연락처</th>
              <th>요청수</th>
              <th>토큰 만료일</th>
              <th>마지막 사용</th>
              <th>활성</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="11" class="state-cell">불러오는 중...</td>
            </tr>
            <tr v-else-if="list.length === 0">
              <td colspan="11" class="state-cell">등록된 현장이 없습니다. "신규 등록"으로 시작하세요.</td>
            </tr>
            <tr v-for="site in list" v-else :key="site.siteId" :class="{ inactive: !site.active }">
              <td>{{ site.orderDeliveryRequestNo || '-' }}</td>
              <td>{{ site.projectName }}</td>
              <td>{{ site.client || '-' }}</td>
              <td class="muted">{{ site.siteAddress || '-' }}</td>
              <td>{{ site.managerName || '-' }}</td>
              <td>{{ site.managerPhone || '-' }}</td>
              <td>{{ site.requestCount ?? 0 }}</td>
              <td>{{ formatDate(site.tokenExpiresAt) }}</td>
              <td>{{ formatDateTime(site.tokenLastUsedAt) }}</td>
              <td>
                <span :class="['badge', site.active ? 'badge-on' : 'badge-off']">
                  {{ site.active ? '활성' : '비활성' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-mini btn-primary" title="URL/SMS 공유" @click="openShare(site)">
                  <i class="fas fa-share-alt" />
                </button>
                <button class="btn-mini" title="수정" @click="openEdit(site)">
                  <i class="fas fa-edit" />
                </button>
                <button class="btn-mini" title="토큰 재발급" @click="regenerate(site)">
                  <i class="fas fa-redo" />
                </button>
                <button class="btn-mini" :title="site.active ? '비활성화' : '활성화'" @click="toggleActive(site)">
                  <i :class="site.active ? 'fas fa-lock' : 'fas fa-lock-open'" />
                </button>
                <button class="btn-mini btn-danger" title="삭제" @click="removeSite(site)">
                  <i class="fas fa-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">이전</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">다음</button>
      </div>
    </div>

    <!-- 발주 선택 모달 (신규 등록 1단계) -->
    <OrderPickerModal
      v-if="pickingOrder"
      @close="pickingOrder = false"
      @select="onOrderPicked"
    />

    <!-- 등록/수정 모달 (신규 등록 2단계 또는 수정) -->
    <SiteFormModal
      v-if="showForm"
      :initial="editingSite"
      :prefill-from-order="pickedOrder"
      @close="closeForm"
      @saved="onSaved"
    />

    <!-- 공유 모달 -->
    <SiteShareModal
      v-if="sharingSite"
      :site="sharingSite"
      @close="sharingSite = null"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useSiteStore } from '~/stores/site'
import type { Site } from '~/types/site'
import SiteFormModal from '~/components/admin/site/SiteFormModal.vue'
import SiteShareModal from '~/components/admin/site/SiteShareModal.vue'
import OrderPickerModal from '~/components/admin/site/OrderPickerModal.vue'
import type { OrderRow } from '~/components/admin/site/OrderPickerModal.vue'

const store = useSiteStore()

const filters = reactive({
  keyword: '',
  active: undefined as boolean | undefined
})

const showForm = ref(false)
const editingSite = ref<Site | null>(null)
const sharingSite = ref<Site | null>(null)
const pickingOrder = ref(false)
const pickedOrder = ref<OrderRow | null>(null)

const currentPage = ref(1)
const pageSize = ref(20)

const loading = computed(() => store.loading)
const list = computed(() => store.list)
const totalElements = computed(() => store.pagination?.totalElements ?? 0)
const totalPages = computed(() => store.pagination?.totalPages ?? 1)
const startIndex = computed(() => totalElements.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, totalElements.value))

async function load(page = 1) {
  await store.fetchList({
    keyword: filters.keyword || undefined,
    active: filters.active,
    page,
    size: pageSize.value
  })
  currentPage.value = page
}

async function search() { await load(1) }
async function goPage(p: number) { await load(p) }
async function changePageSize() { await load(1) }

function openCreate() {
  editingSite.value = null
  pickedOrder.value = null
  pickingOrder.value = true
}

function onOrderPicked(order: OrderRow) {
  pickedOrder.value = order
  pickingOrder.value = false
  showForm.value = true
}

function openEdit(site: Site) {
  editingSite.value = site
  pickedOrder.value = null
  showForm.value = true
}

function openShare(site: Site) {
  sharingSite.value = site
}

function closeForm() {
  showForm.value = false
  pickedOrder.value = null
}

async function onSaved(site: Site) {
  const wasNew = !editingSite.value
  showForm.value = false
  await load(currentPage.value)
  if (wasNew) {
    // 신규 등록 직후 공유 모달 자동 노출
    sharingSite.value = site
  }
  editingSite.value = null
  pickedOrder.value = null
}

async function regenerate(site: Site) {
  if (!confirm(`"${site.projectName}" 토큰을 재발급하시겠습니까?\n기존 URL은 즉시 만료됩니다.`)) return
  try {
    await store.regenerateToken(site.siteId)
    await load(currentPage.value)
    const refreshed = list.value.find(s => s.siteId === site.siteId)
    if (refreshed) sharingSite.value = refreshed
  } catch {
    alert('토큰 재발급 실패')
  }
}

async function toggleActive(site: Site) {
  const msg = site.active
    ? `"${site.projectName}"을(를) 비활성화하시겠습니까? URL이 즉시 차단됩니다.`
    : `"${site.projectName}"을(를) 다시 활성화하시겠습니까?`
  if (!confirm(msg)) return
  await store.setActive(site.siteId, !site.active)
}

async function removeSite(site: Site) {
  if (!confirm(`"${site.projectName}"을(를) 삭제하시겠습니까? (소프트 삭제)`)) return
  await store.remove(site.siteId)
}

function formatDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR')
}
function formatDateTime(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleString('ko-KR')
}

onMounted(() => { load(1) })
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

.tab-section { padding: 1rem; }

.search-section-compact {
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
}
.search-row-single {
  display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;
}
.search-item {
  display: flex; align-items: center; gap: 0.4rem;
}
.search-item label {
  font-size: 0.8rem; color: #374151; white-space: nowrap;
}
.search-item input,
.search-item select {
  padding: 0.45rem 0.6rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem;
  font-size: 0.85rem;
}
.search-item.search-keyword { flex: 1; min-width: 220px; }
.search-item.search-keyword input { flex: 1; min-width: 200px; }

.btn-action {
  padding: 0.45rem 0.85rem;
  background: white; color: #374151;
  border: 1px solid #d1d5db; border-radius: 0.25rem;
  cursor: pointer; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 0.3rem;
}
.btn-action:hover:not(:disabled) { background: #f3f4f6; }
.btn-action:disabled { opacity: 0.5; }
.btn-action.btn-primary {
  background: #2563eb; color: white; border-color: #2563eb;
}
.btn-action.btn-primary:hover:not(:disabled) { background: #1d4ed8; }

.table-section { margin-top: 0.5rem; }
.table-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 0;
  font-size: 0.85rem; color: #6b7280;
}
.page-size-select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem;
}

.state-cell { text-align: center; padding: 2rem; color: #9ca3af; }
.muted { color: #6b7280; font-size: 0.85rem; }
.inactive { background: #f9fafb; opacity: 0.7; }
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-on { background: #dcfce7; color: #166534; }
.badge-off { background: #f3f4f6; color: #6b7280; }
.actions { display: flex; gap: 0.25rem; justify-content: center; }
.btn-mini {
  padding: 0.3rem 0.5rem;
  border: 1px solid #d1d5db; background: white; border-radius: 0.25rem;
  cursor: pointer; font-size: 0.75rem;
}
.btn-mini:hover { background: #f3f4f6; }
.btn-mini.btn-primary { background: #2563eb; color: white; border-color: #2563eb; }
.btn-mini.btn-primary:hover { background: #1d4ed8; }
.btn-mini.btn-danger { color: #dc2626; }
.btn-mini.btn-danger:hover { background: #fef2f2; }

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem;
}
.pagination button {
  padding: 0.4rem 0.8rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem; background: white;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
