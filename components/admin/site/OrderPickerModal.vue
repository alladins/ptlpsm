<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-file-contract" />
            발주(납품요구) 선택
          </h3>
          <button class="modal-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 검색바 -->
          <div class="search-section-compact">
            <div class="search-row-single">
              <div class="search-item">
                <label>수요기관:</label>
                <input
                  v-model="filters.client"
                  type="text"
                  class="text-input"
                  placeholder="수요기관명"
                  @keyup.enter="search"
                >
              </div>
              <div class="search-item search-keyword">
                <label>검색어:</label>
                <input
                  v-model="filters.keyword"
                  type="text"
                  class="keyword-input"
                  placeholder="프로젝트명/담당자명"
                  @keyup.enter="search"
                >
              </div>
              <button class="btn-search" :disabled="loading" @click="search">
                <i v-if="loading" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-search" />
                검색
              </button>
            </div>
          </div>

          <!-- 테이블 헤더 -->
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

          <!-- 테이블 -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>납품요구번호</th>
                  <th>프로젝트명</th>
                  <th>수요기관</th>
                  <th>대표자명</th>
                  <th>납품요구일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="state-cell">불러오는 중...</td>
                </tr>
                <tr v-else-if="orders.length === 0">
                  <td colspan="5" class="state-cell">조건에 맞는 발주가 없습니다.</td>
                </tr>
                <tr
                  v-for="o in orders"
                  v-else
                  :key="o.orderId"
                  class="row-clickable"
                  @click="onSelect(o)"
                >
                  <td>{{ o.deliveryRequestNo }}</td>
                  <td>{{ o.projectName || '-' }}</td>
                  <td>{{ o.client || '-' }}</td>
                  <td>{{ (o as OrderRow).builderCeoName || '-' }}</td>
                  <td>{{ formatDate(o.deliveryRequestDate) }}</td>
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

        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">취소</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { orderService } from '~/services/order.service'
import type { OrderDetailResponse } from '~/types/order'

/** 발주 검색 결과 한 행. 백엔드 OrderResponse 의 일부만 사용. */
export interface OrderRow extends OrderDetailResponse {
  builderCeoName?: string
  phoneNumber?: string
  clientAddress?: string
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', order: OrderRow): void
}>()

const filters = reactive({
  keyword: '',
  client: ''
})

const orders = ref<OrderRow[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const totalPages = ref(1)

const startIndex = computed(() => totalElements.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, totalElements.value))

async function load(page = 1) {
  loading.value = true
  try {
    const res = await orderService.getOrders({
      keyword: filters.keyword || undefined,
      client: filters.client || undefined,
      page: page - 1,
      size: pageSize.value
    })
    orders.value = (res.content || []) as OrderRow[]
    totalElements.value = res.totalElements ?? 0
    totalPages.value = res.totalPages || 1
    currentPage.value = page
  } finally {
    loading.value = false
  }
}

async function search() { await load(1) }
async function goPage(p: number) { await load(p) }
async function changePageSize() { await load(1) }

function onSelect(order: OrderRow) {
  emit('select', order)
}

function formatDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR')
}

onMounted(() => { load(1) })
</script>

<style scoped>
@import '@/assets/css/admin-tables.css';

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 0.75rem;
  width: 90%; max-width: 960px;
  max-height: 90vh;
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0.75rem 0.75rem 0 0;
}
.modal-header h3 { margin: 0; font-size: 1.05rem; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #6b7280; }
.modal-body { padding: 1rem 1.5rem; overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 0.75rem 0.75rem;
}

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
.search-item input {
  padding: 0.45rem 0.6rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem;
  font-size: 0.85rem;
}
.search-item.search-keyword { flex: 1; min-width: 220px; }
.search-item.search-keyword input { flex: 1; min-width: 200px; }
.btn-search {
  padding: 0.45rem 0.85rem;
  background: #2563eb; color: white; border: none; border-radius: 0.25rem;
  cursor: pointer; font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 0.3rem;
}
.btn-search:hover:not(:disabled) { background: #1d4ed8; }
.btn-search:disabled { opacity: 0.5; }

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
.state-cell { text-align: center; padding: 2rem; color: #9ca3af; }

.pagination {
  display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem;
}
.pagination button {
  padding: 0.4rem 0.8rem;
  border: 1px solid #d1d5db; border-radius: 0.25rem; background: white;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  padding: 0.5rem 1rem; background: white; color: #374151;
  border: 1px solid #d1d5db; border-radius: 0.25rem; cursor: pointer;
}
.btn-secondary:hover { background: #f9fafb; }
</style>
