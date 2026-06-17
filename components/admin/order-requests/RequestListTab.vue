<template>
  <section class="tab-section">
    <!-- 검색바 (표준 .search-section-compact) -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>상태:</label>
          <select v-model="filters.status" class="status-select" @change="search">
            <option value="">전체</option>
            <option value="PENDING">대기</option>
            <option value="APPROVED">승인</option>
            <option value="REJECTED">반려</option>
            <option value="CANCELLED">취소</option>
          </select>
        </div>
        <div class="search-item">
          <label>긴급도:</label>
          <select v-model="filters.urgency" class="status-select" @change="search">
            <option value="">전체</option>
            <option value="URGENT">긴급</option>
            <option value="NORMAL">보통</option>
            <option value="LOW">여유</option>
          </select>
        </div>
        <div class="search-item">
          <label>현장:</label>
          <select v-model.number="filters.siteId" class="status-select" @change="search">
            <option :value="undefined">전체</option>
            <option v-for="s in siteOptions" :key="s.siteId" :value="s.siteId">
              {{ s.projectName }}
            </option>
          </select>
        </div>
        <div class="search-item search-keyword">
          <label>검색어:</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="keyword-input"
            placeholder="요청번호/현장명/요청자명"
            @keyup.enter="search"
          >
        </div>
        <button class="btn-action" :disabled="loading" @click="search">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
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
              <th>요청번호</th>
              <th>현장(프로젝트)</th>
              <th>요청자</th>
              <th>긴급도</th>
              <th>희망납품일</th>
              <th>상태</th>
              <th>처리자</th>
              <th>요청일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="state-cell">불러오는 중...</td>
            </tr>
            <tr v-else-if="list.length === 0">
              <td colspan="8" class="state-cell">조건에 맞는 요청이 없습니다.</td>
            </tr>
            <tr
              v-for="row in list"
              v-else
              :key="row.requestId"
              class="row-clickable"
              :class="{ 'row-pending': row.status === 'PENDING' }"
              @click="openDetail(row.requestId)"
            >
              <td>{{ row.requestNo }}</td>
              <td>{{ row.siteProjectName || '-' }}</td>
              <td>
                {{ row.requesterName }}
                <small v-if="row.requesterPhone" class="muted">({{ row.requesterPhone }})</small>
              </td>
              <td><span :class="['badge', urgencyBadge(row.urgency)]">{{ urgencyLabel(row.urgency) }}</span></td>
              <td>{{ formatDate(row.desiredDeliveryDate) }}</td>
              <td><span :class="['badge', statusBadge(row.status)]">{{ statusLabel(row.status) }}</span></td>
              <td>{{ row.processedByName || '-' }}</td>
              <td>{{ formatDateTime(row.createdAt) }}</td>
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

    <!-- 상세 모달 -->
    <RequestDetailModal
      v-if="selectedRequestId !== null"
      :request-id="selectedRequestId"
      @close="onDetailClose"
      @processed="onProcessed"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useMobileOrderRequestStore } from '~/stores/mobileOrderRequest'
import { useSiteStore } from '~/stores/site'
import {
  URGENCY_DISPLAY,
  REQUEST_STATUS_DISPLAY,
  type OrderUrgency,
  type OrderRequestStatus
} from '~/types/mobile-order'
import RequestDetailModal from './RequestDetailModal.vue'

const emit = defineEmits<{ (e: 'pending-count', n: number): void }>()

const store = useMobileOrderRequestStore()
const siteStore = useSiteStore()

const filters = reactive({
  keyword: '',
  status: '' as OrderRequestStatus | '',
  urgency: '' as OrderUrgency | '',
  siteId: undefined as number | undefined
})

const selectedRequestId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

const loading = computed(() => store.loading)
const list = computed(() => store.list)
const pagination = computed(() => store.pagination)
const totalElements = computed(() => pagination.value?.totalElements ?? 0)
const totalPages = computed(() => pagination.value?.totalPages ?? 1)
const startIndex = computed(() => totalElements.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, totalElements.value))
const siteOptions = computed(() => siteStore.list)

async function loadList(page = 1) {
  await store.fetchAllRequests({
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    urgency: filters.urgency || undefined,
    siteId: filters.siteId,
    page,
    size: pageSize.value
  })
  currentPage.value = page
  const pending = list.value.filter(r => r.status === 'PENDING').length
  emit('pending-count', pending)
}

async function search() { await loadList(1) }
async function goPage(p: number) { await loadList(p) }
async function changePageSize() { await loadList(1) }

function openDetail(requestId: number) {
  selectedRequestId.value = requestId
}

function onDetailClose() {
  selectedRequestId.value = null
}

async function onProcessed() {
  selectedRequestId.value = null
  await loadList(currentPage.value)
}

function urgencyLabel(u: OrderUrgency) { return URGENCY_DISPLAY[u]?.label ?? u }
function urgencyBadge(u: OrderUrgency) { return URGENCY_DISPLAY[u]?.badgeClass ?? '' }
function statusLabel(s: OrderRequestStatus) { return REQUEST_STATUS_DISPLAY[s]?.label ?? s }
function statusBadge(s: OrderRequestStatus) { return REQUEST_STATUS_DISPLAY[s]?.badgeClass ?? '' }

function formatDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR')
}
function formatDateTime(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleString('ko-KR')
}

onMounted(async () => {
  await siteStore.fetchList({ size: 200, active: true })
  await loadList(1)
})
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

.row-clickable { cursor: pointer; }
.row-clickable:hover { background: #f3f4f6; }
.row-pending { background: #fffbeb; }
.row-pending:hover { background: #fef3c7; }
.state-cell { text-align: center; padding: 2rem; color: #9ca3af; }
.muted { color: #6b7280; font-weight: normal; }

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem;
}
.pagination button {
  padding: 0.4rem 0.8rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem; background: white;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
