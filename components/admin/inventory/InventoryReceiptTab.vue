<template>
  <div class="receipt-tab">
    <!-- 검색 -->
    <div class="search-section">
      <div class="search-row">
        <select v-model="search.receiptType" class="form-input search-select">
          <option :value="null">
            전체 유형
          </option>
          <option v-for="t in typeOptions" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
        <select v-model="search.status" class="form-input search-select">
          <option :value="null">
            전체 상태
          </option>
          <option v-for="s in statusOptions" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
        <input
          v-model="search.keyword"
          type="text"
          class="form-input search-keyword"
          placeholder="입고번호 · 품목 · 사유"
          @keyup.enter="load(0)"
        >
        <button class="btn-action" :disabled="loading" @click="load(0)">
          <i class="fas fa-search" /> 조회
        </button>
      </div>
    </div>

    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          총 <strong>{{ totalElements.toLocaleString() }}</strong>건
          <span class="muted"> — 발주서 없이 들어온 재고입니다. 제조사 지급액과는 무관합니다.</span>
        </div>
        <!-- 등록 버튼은 화면 상단 [재고 직접 입고] 하나만 둔다 (2026-09-21 — 버튼 두 개가 중복이라는 요청) -->
      </div>

      <div v-if="loading" class="empty-state">
        <p>불러오는 중...</p>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        <p>직접 입고 내역이 없습니다.</p>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>입고번호</th>
              <th>유형</th>
              <th>입고일</th>
              <th>창고</th>
              <th>품목</th>
              <th>수량</th>
              <th>생산자</th>
              <th>원가</th>
              <th>금액</th>
              <th>사유</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.receiptId" class="table-row">
              <td class="nowrap">
                {{ r.receiptNo }}
              </td>
              <td class="nowrap">
                {{ receiptTypeLabel(r.receiptType) }}
              </td>
              <td class="nowrap">
                {{ r.receiptDate }}
              </td>
              <td class="text-left">
                {{ r.warehouseName || '-' }}
              </td>
              <td class="text-left">
                {{ r.skuName || r.skuId }}
              </td>
              <td class="text-right nowrap">
                {{ r.quantity.toLocaleString() }}㎡
                <span v-if="r.sheetCount" class="muted">({{ r.sheetCount.toLocaleString() }}매)</span>
              </td>
              <td class="nowrap">
                {{ r.producerCompanyName || '-' }}
              </td>
              <td class="text-right">
                {{ (r.unitCost ?? 0).toLocaleString() }}
              </td>
              <td class="text-right">
                {{ (r.amount ?? 0).toLocaleString() }}
              </td>
              <td class="text-left remarks" :title="r.status === 'CANCELLED' && r.cancelReason ? `취소 사유: ${r.cancelReason}` : r.remarks">
                {{ r.remarks }}
                <div v-if="r.status === 'CANCELLED' && r.cancelReason" class="cancel-reason">
                  취소: {{ r.cancelReason }}
                </div>
              </td>
              <td>
                <span :class="['status-badge', `st-${r.status.toLowerCase()}`]">
                  {{ RECEIPT_STATUS_LABELS[r.status] || r.status }}
                </span>
              </td>
              <td class="nowrap">
                <template v-if="canManage && r.status === 'DRAFT'">
                  <button class="btn-mini" @click="openEdit(r)">
                    수정
                  </button>
                  <button class="btn-mini primary" :disabled="busyId === r.receiptId" @click="handleConfirm(r)">
                    확정
                  </button>
                  <button class="btn-mini danger" :disabled="busyId === r.receiptId" @click="handleDelete(r)">
                    삭제
                  </button>
                </template>
                <template v-else-if="canManage && r.status === 'CONFIRMED'">
                  <!-- ★ 이미 나간 물량은 되돌릴 수 없다 — 막되, 눌렀을 때 이유를 알려준다 -->
                  <GuardedButton
                    class="btn-mini danger"
                    :blocked="!canCancelConfirmed(r)"
                    :reason="cancelHint(r)"
                    :disabled="busyId === r.receiptId"
                    @click="handleCancel(r)"
                  >
                    취소
                  </GuardedButton>
                </template>
                <span v-else class="muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="totalPages > 0"
        :current-page="page"
        :total-pages="totalPages"
        :disabled="loading"
        @change="load"
      />
    </div>

    <InventoryReceiptModal v-model="showModal" :edit-target="editTarget" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import InventoryReceiptModal from '~/components/admin/inventory/InventoryReceiptModal.vue'
import { inventoryReceiptService } from '~/services/inventory-receipt.service'
import { usePermissionStore } from '~/stores/permission'
import {
  RECEIPT_TYPE_LABELS,
  receiptTypeLabel,
  RECEIPT_STATUS_LABELS,
  canCancelConfirmed,
  type ReceiptType,
  type ReceiptStatus,
  type InventoryReceipt
} from '~/types/inventory-receipt'

/** 확정·취소로 재고가 바뀌면 부모(재고현황)가 다시 읽도록 알린다 */
const emit = defineEmits<{ changed: [] }>()

const permissionStore = usePermissionStore()
/** 등록·확정·취소는 서버(SecurityConfig)가 시스템관리자·리드파워 담당자만 허용한다 — 같은 조건 */
const canManage = computed(() =>
  permissionStore.isFullAccess || permissionStore.currentUserRole === 'LEADPOWER_MANAGER'
)

const typeOptions = (Object.keys(RECEIPT_TYPE_LABELS) as ReceiptType[])
  .map(v => ({ value: v, label: RECEIPT_TYPE_LABELS[v] }))
const statusOptions = (Object.keys(RECEIPT_STATUS_LABELS) as ReceiptStatus[])
  .map(v => ({ value: v, label: RECEIPT_STATUS_LABELS[v] }))

const search = ref({
  receiptType: null as string | null,
  status: null as string | null,
  keyword: ''
})
const items = ref<InventoryReceipt[]>([])
const loading = ref(false)
/** 0-based (Pagination 공용 계약) */
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const busyId = ref<number | null>(null)

const showModal = ref(false)
const editTarget = ref<InventoryReceipt | null>(null)

const load = async (p = page.value) => {
  loading.value = true
  try {
    const res = await inventoryReceiptService.getList({
      receiptType: search.value.receiptType,
      status: search.value.status,
      keyword: search.value.keyword || null,
      page: p,
      size: 20
    })
    items.value = res.content || []
    page.value = res.number ?? p
    totalPages.value = res.totalPages ?? 0
    totalElements.value = res.totalElements ?? 0
  } catch (e: any) {
    console.error('직접 입고 목록 조회 실패:', e)
    alert(e?.message || '직접 입고 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

const openCreate = () => { editTarget.value = null; showModal.value = true }
const openEdit = (r: InventoryReceipt) => { editTarget.value = r; showModal.value = true }
const onSaved = () => load()

const cancelHint = (r: InventoryReceipt) =>
  `이 입고분 ${r.quantity.toLocaleString()}㎡ 중 일부가 이미 출고되어 현재고가 ${(r.currentStock ?? 0).toLocaleString()}㎡ 뿐입니다. ` +
  '되돌릴 수 없습니다. 수량이 틀렸다면 «실사 보정» 이나 재고 소진으로 맞추세요.'

const handleConfirm = async (r: InventoryReceipt) => {
  const msg = `${r.receiptNo} 을 확정합니다.\n\n` +
    `${r.warehouseName} 에 ${r.skuName || r.skuId} ${r.quantity.toLocaleString()}㎡ 가 늘어납니다.\n` +
    '제조사 지급액에는 영향이 없습니다.'
  if (!confirm(msg)) { return }
  busyId.value = r.receiptId
  try {
    await inventoryReceiptService.confirm(r.receiptId)
    await load()
    emit('changed')
  } catch (e: any) {
    alert(e?.message || '확정에 실패했습니다.')
  } finally {
    busyId.value = null
  }
}

const handleCancel = async (r: InventoryReceipt) => {
  const reason = prompt(`${r.receiptNo} 을 취소합니다.\n늘어났던 재고 ${r.quantity.toLocaleString()}㎡ 가 다시 빠집니다.\n\n취소 사유를 입력하세요.`)
  if (reason === null) { return }
  if (!reason.trim()) { alert('취소 사유를 입력해야 합니다.'); return }
  busyId.value = r.receiptId
  try {
    await inventoryReceiptService.cancel(r.receiptId, reason.trim())
    await load()
    emit('changed')
  } catch (e: any) {
    alert(e?.message || '취소에 실패했습니다.')
  } finally {
    busyId.value = null
  }
}

const handleDelete = async (r: InventoryReceipt) => {
  if (!confirm(`${r.receiptNo} 을 삭제합니다. (작성중이라 재고에는 영향이 없습니다)`)) { return }
  busyId.value = r.receiptId
  try {
    await inventoryReceiptService.remove(r.receiptId)
    await load()
  } catch (e: any) {
    alert(e?.message || '삭제에 실패했습니다.')
  } finally {
    busyId.value = null
  }
}

onMounted(() => load(0))

defineExpose({ reload: () => load(), openCreate })
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

.search-section { margin-bottom: 1rem; }
.search-row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
.search-select { width: 140px; }
.search-keyword { width: 240px; }

.muted { color: #9ca3af; font-size: 0.8125rem; }
.nowrap { white-space: nowrap; }
.remarks { max-width: 260px; }
.cancel-reason { margin-top: 0.25rem; font-size: 0.75rem; color: #dc2626; }

.status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.st-draft { background: #fef3c7; color: #92400e; }
.st-confirmed { background: #dcfce7; color: #166534; }
.st-cancelled { background: #f3f4f6; color: #6b7280; text-decoration: line-through; }

.btn-mini {
  padding: 0.2rem 0.5rem;
  margin: 0 0.125rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-mini:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-mini.primary { border-color: #2563eb; color: #2563eb; }
.btn-mini.danger { border-color: #dc2626; color: #dc2626; }
/* GuardedButton 막힘 상태 — 눌리긴 하지만 흐리게 */
.btn-mini.gb-blocked { opacity: 0.45; }
</style>
