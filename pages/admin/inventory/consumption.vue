<template>
  <div class="ic-page">
    <PageHeader
      title="재고 소진관리"
      description="품질관리원 시험 발송 / 리드파워 계약 등 출하로 잡히지 않는 재고 소진을 관리합니다."
      icon="boxes"
      icon-color="orange"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="search">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action" @click="resetSearch">
          <i class="fas fa-rotate-left" />
          초기화
        </button>
        <button class="btn-action btn-primary" @click="openCreate">
          <i class="fas fa-plus" />
          소진 등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 — 공용 search-section-compact 규격 (손실관리·원가관리 등과 동일) -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>유형:</label>
            <select v-model="filter.consumptionType" class="status-select">
              <option :value="null">
                전체
              </option>
              <option v-for="t in typeOptions" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>

          <div class="search-item">
            <label>상태:</label>
            <select v-model="filter.status" class="status-select">
              <option :value="null">
                전체
              </option>
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>

          <div class="search-item">
            <label>생산자:</label>
            <select v-model.number="filter.sourceOemCompanyId" class="status-select">
              <option :value="null">
                전체
              </option>
              <option v-for="c in manufacturers" :key="c.id" :value="c.id">
                {{ c.companyName }}
              </option>
            </select>
          </div>

          <div class="search-item">
            <label>소진일:</label>
            <SearchDateRange v-model:start-date="filter.dateFrom" v-model:end-date="filter.dateTo" />
          </div>

          <div class="search-item">
            <label>검색어:</label>
            <input
              v-model="filter.keyword"
              type="text"
              class="text-input"
              placeholder="소진번호, 납품처, 계약번호"
              @keyup.enter="search"
            >
          </div>
        </div>
      </div>

      <!-- 목록 -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 130px">소진번호</th>
              <th style="width: 110px">유형</th>
              <th style="width: 100px">소진일</th>
              <th style="width: 130px">창고</th>
              <th style="width: 130px">품목</th>
              <th style="width: 110px" class="text-right">수량</th>
              <th style="width: 120px">생산자</th>
              <th style="width: 100px" class="text-right">원가</th>
              <th style="width: 120px" class="text-right">금액</th>
              <th style="width: 150px">보낸 곳 / 계약</th>
              <th style="width: 80px" class="text-center">상태</th>
              <th style="width: 160px" class="text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="12" class="empty-message">조회 중...</td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="12" class="empty-message">
                등록된 재고 소진이 없습니다. "소진 등록" 으로 추가하세요.
              </td>
            </tr>
            <tr v-for="r in rows" :key="r.consumptionId" :class="{ cancelled: r.status === 'CANCELLED' }">
              <td>{{ r.consumptionNo }}</td>
              <td>
                <span class="type-chip" :class="r.consumptionType">
                  {{ typeLabel(r.consumptionType) }}
                </span>
              </td>
              <td>{{ formatDate(r.consumptionDate) }}</td>
              <td>{{ r.warehouseName || '-' }}</td>
              <td>{{ r.skuName || r.skuId }}</td>
              <td class="text-right">
                {{ r.quantity.toLocaleString() }}㎡
                <small v-if="r.sheetCount" class="sheet">({{ r.sheetCount }}매)</small>
              </td>
              <td>{{ r.sourceOemCompanyName || '-' }}</td>
              <td class="text-right">{{ formatCurrency(r.unitCost) }}</td>
              <td class="text-right strong">{{ formatCurrency(r.amount) }}</td>
              <td class="ellipsis">{{ r.destination || r.contractNo || '-' }}</td>
              <td class="text-center">
                <span class="status-chip" :class="r.status">{{ statusLabel(r.status) }}</span>
              </td>
              <td class="text-center">
                <template v-if="r.status === 'DRAFT'">
                  <button class="btn-mini" @click="openEdit(r)">수정</button>
                  <button
                    class="btn-mini primary"
                    :disabled="!canConfirm(r)"
                    :title="confirmHint(r)"
                    @click="handleConfirm(r)"
                  >확정</button>
                  <button class="btn-mini danger" @click="handleDelete(r)">삭제</button>
                </template>
                <template v-else-if="r.status === 'CONFIRMED'">
                  <button class="btn-mini danger" @click="handleCancel(r)">취소</button>
                </template>
                <span v-else class="muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="totalPages > 1"
        :current-page="filter.page"
        :total-pages="totalPages"
        @change="onPageChange"
      />
    </div>

    <InventoryConsumptionModal
      v-model="showModal"
      :edit-target="editTarget"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import { ref, reactive, onMounted } from 'vue'
import { inventoryConsumptionService } from '~/services/inventory-consumption.service'
import { companyService } from '~/services/company.service'
import InventoryConsumptionModal from '~/components/admin/inventory/InventoryConsumptionModal.vue'
import {
  CONSUMPTION_TYPE_LABELS,
  CONSUMPTION_STATUS_LABELS,
  canConfirm,
  type ConsumptionType,
  type ConsumptionStatus,
  type InventoryConsumption
} from '~/types/inventory-consumption'
import { formatDate, formatCurrency } from '~/utils/format'

definePageMeta({ layout: 'admin', pageTitle: '재고 소진관리' })

const typeOptions = (Object.keys(CONSUMPTION_TYPE_LABELS) as ConsumptionType[])
  .map(v => ({ value: v, label: CONSUMPTION_TYPE_LABELS[v] }))
const statusOptions = (Object.keys(CONSUMPTION_STATUS_LABELS) as ConsumptionStatus[])
  .map(v => ({ value: v, label: CONSUMPTION_STATUS_LABELS[v] }))

const typeLabel = (t: ConsumptionType) => CONSUMPTION_TYPE_LABELS[t] ?? t
const statusLabel = (s: ConsumptionStatus) => CONSUMPTION_STATUS_LABELS[s] ?? s

const rows = ref<InventoryConsumption[]>([])
const manufacturers = ref<any[]>([])
const loading = ref(false)
const totalPages = ref(1)
const showModal = ref(false)
const editTarget = ref<InventoryConsumption | null>(null)

// ⚠ Pagination 공용 컴포넌트는 0-based 이고 change 이벤트를 쓴다.
const filter = reactive({
  consumptionType: null as ConsumptionType | null,
  status: null as ConsumptionStatus | null,
  sourceOemCompanyId: null as number | null,
  dateFrom: '',
  dateTo: '',
  keyword: '',
  page: 0,
  size: 20
})

const confirmHint = (r: InventoryConsumption) => {
  if (!r.unitCost || r.unitCost <= 0) {
    return '원가가 0원입니다. 해당 생산자·품목의 원가를 먼저 등록하세요.'
  }
  if ((r.currentStock ?? 0) < r.quantity) {
    return `재고가 부족합니다 (현재고 ${r.currentStock ?? 0}㎡ / 필요 ${r.quantity}㎡)`
  }
  return '재고를 차감하고 원장에 반영합니다.'
}

const load = async () => {
  loading.value = true
  try {
    const res = await inventoryConsumptionService.getList({
      consumptionType: filter.consumptionType,
      status: filter.status,
      sourceOemCompanyId: filter.sourceOemCompanyId,
      dateFrom: filter.dateFrom || null,
      dateTo: filter.dateTo || null,
      keyword: filter.keyword || null,
      page: filter.page,
      size: filter.size
    })
    rows.value = res.content || []
    totalPages.value = res.totalPages || 1
  } catch (e) {
    console.error('재고 소진 목록 조회 실패:', e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const onPageChange = (p: number) => { filter.page = p; load() }

// 조건을 바꿔 조회할 때는 1페이지로 되돌린다.
// 3페이지에서 조건을 좁히면 결과가 있어도 빈 목록이 보인다.
const search = () => { filter.page = 0; load() }

// 검색 조건 초기화 — 손실관리와 같은 동작(비우고 바로 다시 조회)
const resetSearch = () => {
  filter.consumptionType = null
  filter.status = null
  filter.sourceOemCompanyId = null
  filter.dateFrom = ''
  filter.dateTo = ''
  filter.keyword = ''
  search()
}

const openCreate = () => { editTarget.value = null; showModal.value = true }
const openEdit = (r: InventoryConsumption) => { editTarget.value = r; showModal.value = true }
const onSaved = () => { load() }

const handleConfirm = async (r: InventoryConsumption) => {
  if (!confirm(`${r.consumptionNo} 을 확정합니다.\n재고 ${r.quantity}㎡ 가 차감되고 ${r.ledgerYearMonth} 원장에 ${formatCurrency(r.amount)}원이 반영됩니다.`)) { return }
  try {
    await inventoryConsumptionService.confirm(r.consumptionId)
    await load()
  } catch (e: any) {
    alert(e?.message || '확정에 실패했습니다.')
  }
}

const handleCancel = async (r: InventoryConsumption) => {
  const reason = prompt(`${r.consumptionNo} 을 취소합니다.\n재고 ${r.quantity}㎡ 가 복구되고 원장에서도 빠집니다.\n\n취소 사유를 입력하세요.`)
  if (reason === null) { return }
  try {
    await inventoryConsumptionService.cancel(r.consumptionId, reason)
    await load()
  } catch (e: any) {
    alert(e?.message || '취소에 실패했습니다.')
  }
}

const handleDelete = async (r: InventoryConsumption) => {
  if (!confirm(`${r.consumptionNo} 을 삭제합니다. 되돌릴 수 없습니다.`)) { return }
  try {
    await inventoryConsumptionService.remove(r.consumptionId)
    await load()
  } catch (e: any) {
    alert(e?.message || '삭제에 실패했습니다.')
  }
}

onMounted(async () => {
  try {
    const all = await companyService.getManufacturers()
    manufacturers.value = all.filter((c: any) => c.companyType === 'MANUFACTURER')
  } catch (e) { console.error(e) }
  await load()
})
</script>

<style scoped>
/* ⚠ 공용 CSS(admin-common/buttons/tables/search)는 nuxt.config.ts 의 css 배열에서
   전역으로 불러온다. 여기서 @import 하면 같은 규칙이 한 벌 더 실려 번들만 커진다.
   (손실관리·원가관리 등 다른 화면도 import 하지 않는다) */

/* 검색줄은 공용 search-section-compact 규격을 쓴다 (assets/css/admin-search.css).
   예전에는 이 화면만 search-bar / search-field 라는 자체 클래스를 써서
   라벨 굵기·입력 폭·간격이 다른 화면과 미묘하게 달랐다. */

.type-chip, .status-chip {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.72rem;
  white-space: nowrap;
}
.type-chip.QUALITY_TEST { background: #ecfdf5; color: #047857; }
.type-chip.LP_CONTRACT  { background: #eff6ff; color: #1d4ed8; }
.type-chip.OTHER        { background: #f3f4f6; color: #4b5563; }

.status-chip.DRAFT     { background: #f3f4f6; color: #4b5563; }
.status-chip.CONFIRMED { background: #dcfce7; color: #166534; font-weight: 600; }
.status-chip.CANCELLED { background: #fef2f2; color: #b91c1c; }

tr.cancelled td { color: #9ca3af; text-decoration: line-through; }
tr.cancelled .status-chip { text-decoration: none; }

.sheet { color: #9ca3af; margin-left: 0.2rem; }
.strong { font-weight: 600; }
.muted { color: #9ca3af; }
.ellipsis { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.btn-mini {
  padding: 0.2rem 0.5rem;
  margin: 0 0.1rem;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  background: #fff;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-mini:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-mini.primary { border-color: #2563eb; color: #2563eb; }
.btn-mini.danger  { border-color: #dc2626; color: #dc2626; }
</style>
