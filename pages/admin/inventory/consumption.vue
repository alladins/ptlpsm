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
        <!-- 조회된 전체를 한 벌로. 화면에 없는 부가세·부가세 포함 합계가 들어간다 -->
        <button class="btn-action" :disabled="downloading || loading" @click="downloadPdf">
          <i v-if="downloading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-file-pdf" />
          내역서 PDF
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
              <th style="width: 130px">
                소진번호
              </th>
              <th style="width: 110px">
                유형
              </th>
              <th style="width: 100px">
                소진일
              </th>
              <th style="width: 130px">
                창고
              </th>
              <th style="width: 130px">
                품목
              </th>
              <th style="width: 110px" class="text-right">
                수량
              </th>
              <th style="width: 120px">
                생산자
              </th>
              <th style="width: 100px" class="text-right">
                원가
              </th>
              <th style="width: 120px" class="text-right">
                금액
              </th>
              <th style="width: 150px">
                보낸 곳 / 계약
              </th>
              <th style="width: 80px" class="text-center">
                상태
              </th>
              <th style="width: 160px" class="text-center">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="12" class="empty-message">
                조회 중...
              </td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="12" class="empty-message">
                등록된 재고 소진이 없습니다. "소진 등록" 으로 추가하세요.
              </td>
            </tr>
            <template v-for="r in rows" :key="r.consumptionId">
              <tr :class="{ cancelled: r.status === 'CANCELLED' }">
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
                <!-- 생산자·원가는 FIFO 로 빠지는 재고에서 나온다. 여러 곳에 걸치면 «외 N곳», 원가는 평균 -->
                <td>{{ r.producerSummary || r.sourceOemCompanyName || '-' }}</td>
                <td class="text-right">
                  <button
                    v-if="r.lots && r.lots.length"
                    type="button"
                    class="cost-toggle"
                    :class="{ warn: r.costUnknown }"
                    :title="r.lots.length > 1 ? '여러 발주에 걸친 평균 원가입니다. 눌러서 내역 보기' : '원가 내역 보기'"
                    @click="toggleLots(r.consumptionId)"
                  >
                    {{ formatCurrency(r.unitCost) }}
                    <small v-if="r.lots.length > 1">평균</small>
                    <i :class="['fas', expanded.has(r.consumptionId) ? 'fa-chevron-up' : 'fa-chevron-down']" />
                  </button>
                  <template v-else>
                    {{ formatCurrency(r.unitCost) }}
                  </template>
                </td>
                <td class="text-right strong">
                  {{ formatCurrency(r.amount) }}
                </td>
                <td class="ellipsis">
                  {{ r.destination || r.contractNo || '-' }}
                </td>
                <td class="text-center">
                  <span class="status-chip" :class="r.status">{{ statusLabel(r.status) }}</span>
                </td>
                <td class="text-center">
                  <!--
                  확정·취소·삭제는 돈이 확정되는 지점이라 관리자만 한다(서버도 막혀 있다).
                  제조사에게 보여주면 눌러도 403 만 난다. 등록·수정까지는 제조사도 한다.
                -->
                  <template v-if="r.status === 'DRAFT'">
                    <button class="btn-mini" @click="openEdit(r)">
                      수정
                    </button>
                    <!--
                    ★ 비활성화가 아니라 GuardedButton 이다.
                      "확정 버튼이 안 눌린다"는 고객 문의가 실제로 접수됐다(2026-09-21).
                      이유가 마우스오버 툴팁에만 있어 사용자가 찾을 방법이 없었다.
                  -->
                    <GuardedButton
                      v-if="canSettle"
                      class="btn-mini primary"
                      :blocked="!canConfirm(r)"
                      :reason="confirmHint(r)"
                      @click="handleConfirm(r)"
                    >
                      확정
                    </GuardedButton>
                    <button v-if="canSettle" class="btn-mini danger" @click="handleDelete(r)">
                      삭제
                    </button>
                  </template>
                  <template v-else-if="r.status === 'CONFIRMED'">
                    <!--
                    확정 후 1시간이 지나면 잠근다. 잘못 누른 것을 바로 되돌리는 용도이지,
                    며칠 지난 건을 취소하면 그 사이 출고들의 원가가 통째로 흔들린다.
                    여기서도 GuardedButton 을 쓴다 — 왜 안 눌리는지 화면에 남아야 한다.
                  -->
                    <GuardedButton
                      v-if="canSettle"
                      class="btn-mini danger"
                      :blocked="!canCancel(r)"
                      :reason="cancelHint(r)"
                      @click="handleCancel(r)"
                    >
                      취소
                    </GuardedButton>
                    <span v-else class="muted">-</span>
                  </template>
                  <span v-else class="muted">-</span>
                </td>
              </tr>
              <tr v-if="expanded.has(r.consumptionId) && r.lots && r.lots.length" class="lots-row">
                <td colspan="12">
                  <div class="lots-caption">
                    {{ r.status === 'DRAFT' ? '확정하면 이렇게 빠집니다 (지금 재고 기준 미리보기 — 확정 시점에 다시 계산)' : '확정 때 빠진 내역' }}
                  </div>
                  <LotBreakdown :pieces="r.lots" />
                </td>
              </tr>
            </template>
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

    <!--
      내역서 PDF 미리보기 — 확인하고 내려받는다.
      바로 저장해 버리면 내용이 틀렸을 때 파일만 쌓이고, 브라우저 설정에 따라
      파일명이 임의 문자열로 저장되는 일도 있어 무엇을 받았는지 알기 어렵다.
    -->
    <Teleport to="body">
      <div v-if="showPdf" class="modal-overlay" @click.self="closePdf">
        <div class="modal-content pdf-modal">
          <div class="modal-header">
            <h3>재고 소진 내역서 미리보기</h3>
            <button class="modal-close" @click="closePdf">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="pdf-body">
            <iframe v-if="pdfUrl" :src="pdfUrl" title="재고 소진 내역서" />
          </div>
          <div class="modal-footer pdf-footer">
            <span class="pdf-name">{{ pdfName }}</span>
            <span class="spacer" />
            <button class="btn-cancel" @click="closePdf">
              닫기
            </button>
            <button class="btn-submit" @click="savePdf">
              <i class="fas fa-download" />
              내려받기
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import { usePermissionStore } from '~/stores/permission'
import { inventoryConsumptionService } from '~/services/inventory-consumption.service'
import { companyService } from '~/services/company.service'
import InventoryConsumptionModal from '~/components/admin/inventory/InventoryConsumptionModal.vue'
import LotBreakdown from '~/components/admin/inventory/LotBreakdown.vue'
import {
  CONSUMPTION_TYPE_LABELS,
  CONSUMPTION_STATUS_LABELS,
  canConfirm,
  type ConsumptionType,
  type ConsumptionStatus,
  type InventoryConsumption
} from '~/types/inventory-consumption'
import { formatDate, formatDateTime, formatCurrency, getSearchStartDate, getSearchEndDate, parseUtcDate } from '~/utils/format'

definePageMeta({ layout: 'admin', pageTitle: '재고 소진관리' })

const permissionStore = usePermissionStore()

/** 확정·취소·삭제(= 돈이 확정되는 동작)를 할 수 있는가. 제조사는 등록·수정까지만 */
const canSettle = computed(() => !permissionStore.isOemManager)

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
  dateFrom: getSearchStartDate(),
  dateTo: getSearchEndDate(),
  keyword: '',
  page: 0,
  size: 20
})

/** 원가 내역 펼침 — 소진 ID 집합 */
const expanded = ref(new Set<number>())
const toggleLots = (id: number) => {
  const next = new Set(expanded.value)
  if (next.has(id)) { next.delete(id) } else { next.add(id) }
  expanded.value = next
}

const confirmHint = (r: InventoryConsumption) => {
  if ((r.currentStock ?? 0) >= r.quantity && r.costUnknown) {
    const bad = (r.lots || []).filter(p => p.costUnknown)
      .map(p => `· ${p.originType === 'PO' ? `${p.originPoNo} (${p.producerCompanyName || '-'})` : p.originType === 'RECEIPT' ? p.originReceiptNo : '출처 확인 불가'} ${p.quantity.toLocaleString()}㎡`)
    return `원가가 0원이거나 출처를 알 수 없는 재고가 먼저 빠지게 되어 확정할 수 없습니다.\n\n${bad.join('\n')}\n\n해당 발주서의 원가를 바로잡은 뒤 확정하세요. (원가 칸을 누르면 내역이 보입니다)`
  }
  if ((r.currentStock ?? 0) < r.quantity) {
    return `${r.warehouseName || '출고 창고'} 의 재고가 부족해 확정할 수 없습니다.\n\n현재고 ${(r.currentStock ?? 0).toLocaleString()}㎡ / 필요 ${r.quantity.toLocaleString()}㎡ (${(r.quantity - (r.currentStock ?? 0)).toLocaleString()}㎡ 부족)\n\n소진 수량을 줄이거나, 발주서를 입고 처리해 재고를 채우세요.`
  }
  return '재고를 차감합니다. 월별 매출원장의 지급 금액에는 영향이 없습니다.'
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

/**
 * 확정 뒤 취소를 열어 두는 시간. 서버(InventoryConsumptionService.CANCEL_WINDOW_HOURS)와 같아야 한다.
 * 잘못 누른 것을 바로 되돌리는 용도다 — 며칠 지난 건을 취소하면 그 사이 출고들의 원가가 함께 바뀐다.
 */
const CANCEL_WINDOW_HOURS = 1

/** 확정 후 몇 시간 지났는가. 확정시각이 없으면 null */
const hoursSinceConfirm = (r: InventoryConsumption): number | null => {
  if (!r.confirmedAt) { return null }
  // 저장은 UTC 다. 이 함수를 거쳐야 9시간 어긋나지 않는다
  const t = parseUtcDate(r.confirmedAt)
  if (!t) { return null }
  return (Date.now() - t.getTime()) / 3_600_000
}

const canCancel = (r: InventoryConsumption): boolean => {
  const h = hoursSinceConfirm(r)
  if (h === null) { return true } // 확정시각을 모르면 막지 않는다(옛 데이터)
  return h < CANCEL_WINDOW_HOURS
}

const cancelHint = (r: InventoryConsumption): string => {
  if (canCancel(r)) {
    return `재고 ${r.quantity.toLocaleString()}㎡ 가 원래 들어온 발주 그대로 되돌아옵니다.`
  }
  return `확정 후 ${CANCEL_WINDOW_HOURS}시간이 지나 취소할 수 없습니다. (확정 ${formatDateTime(r.confirmedAt)})\n\n` +
    '이미 지난 건을 되돌리면 그 사이 일어난 출고들의 원가가 함께 바뀝니다.\n' +
    '정정이 필요하면 관리자에게 문의하세요.'
}

const downloading = ref(false)
const showPdf = ref(false)
const pdfUrl = ref<string | null>(null)
const pdfName = ref('')
let pdfBlob: Blob | null = null

/**
 * 내역서 PDF — 지금 화면의 검색 조건 그대로, 조회된 전체를 받아 미리보기로 띄운다.
 * 쪽 나눔은 빼고 보낸다(서버가 전체를 한 벌로 만든다).
 */
const downloadPdf = async () => {
  downloading.value = true
  try {
    const { blob, fileName } = await inventoryConsumptionService.fetchPdf({
      consumptionType: filter.consumptionType,
      status: filter.status,
      sourceOemCompanyId: filter.sourceOemCompanyId,
      dateFrom: filter.dateFrom || null,
      dateTo: filter.dateTo || null,
      keyword: filter.keyword || null
    })
    pdfBlob = blob
    pdfName.value = fileName
    // ★ #toolbar=0 — 크롬 PDF 뷰어의 «내려받기» 아이콘을 없앤다.
    //   그 아이콘으로 저장하면 blob 주소를 그대로 써서 파일명이 UUID 로 붙는다(2026-09-23 확인).
    //   내려받기 버튼을 아래 하나로 통일해 그 경로를 아예 막는다.
    pdfUrl.value = `${window.URL.createObjectURL(blob)}#toolbar=0&navpanes=0`
    showPdf.value = true
  } catch (e) {
    console.error('재고 소진 내역서 PDF 실패:', e)
    alert(e instanceof Error ? e.message : 'PDF 를 만들지 못했습니다.')
  } finally {
    downloading.value = false
  }
}

/**
 * 미리보기에서 저장.
 *
 * ⚠ 일부 환경(조직 관리 크롬 등)에서 a[download] 의 파일명이 무시되고 UUID 로 저장된다.
 *   속성은 정상적으로 지정되는데도 그렇다(2026-09-23 실측). 그래서 저장 대화상자 API 를
 *   먼저 쓰고, 없을 때만 예전 방식으로 떨어진다. 대화상자는 파일명이 확실히 유지된다.
 */
const savePdf = () => {
  if (!pdfBlob) { return }
  const name = pdfName.value || '재고소진내역서.pdf'

  // ⚠ 예전에 저장 대화상자(showSaveFilePicker)를 먼저 쓰게 했더니, 대화상자가 취소되면
  //   아무 일도 일어나지 않아 «버튼이 안 눌린다» 가 됐다(2026-09-23). 경로를 하나로 둔다.
  //   미리보기 iframe 의 #toolbar=0 로 크롬 뷰어의 내려받기 아이콘도 없앴으므로,
  //   내려받는 길은 이 버튼 하나뿐이다.
  const url = window.URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => window.URL.revokeObjectURL(url), 2000)
}

const closePdf = () => {
  showPdf.value = false
  if (pdfUrl.value) { window.URL.revokeObjectURL(pdfUrl.value) }
  pdfUrl.value = null
  pdfBlob = null
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
  // ⚠ formatCurrency 가 '원' 까지 붙인다. 뒤에 '원' 을 또 쓰면 "0원원" 이 된다.
  // ★ 2026-09-21 대전제 5번 — 소진은 월별 매출원장의 지급 금액을 바꾸지 않는다.
  //   예전 문구 «○○ 원장에 ○원이 청구됩니다» 는 정책 확정 전의 것이라 틀렸다.
  //   (고객이 확인창을 보고 «청구된다는 게 맞냐» 고 물어 발견)
  // ★ 원가는 FIFO — 먼저 들어온 재고의 발주원가. 확정 시점 재고로 다시 계산하므로 «약» 으로 적는다
  const costLine = (r.lots?.length ?? 0) > 1
    ? `먼저 들어온 재고부터 ${r.lots!.length}개 발주에 걸쳐 빠지며, 원가 약 ${formatCurrency(r.amount)}어치(평균 ${formatCurrency(r.unitCost)}/㎡)로 기록됩니다.`
    : `원가 약 ${formatCurrency(r.amount)}어치가 소진으로 기록됩니다.`
  if (!confirm(
    `${r.consumptionNo} 을 확정합니다.\n\n` +
    `재고 ${r.quantity}㎡ 가 차감됩니다.\n` +
    `${costLine}\n\n` +
    '월별 매출원장의 지급 금액은 바뀌지 않습니다. (원장에는 «참고» 로만 표시)'
  )) { return }
  try {
    await inventoryConsumptionService.confirm(r.consumptionId)
    await load()
  } catch (e: any) {
    alert(e?.message || '확정에 실패했습니다.')
  }
}

const handleCancel = async (r: InventoryConsumption) => {
  const reason = prompt(`${r.consumptionNo} 을 취소합니다.\n재고 ${r.quantity}㎡ 가 원래 들어온 발주 그대로 되돌아옵니다.\n\n취소 사유를 입력하세요.`)
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

/* PDF 미리보기 — 서류를 그대로 봐야 하므로 화면을 넓게 쓴다 */
.pdf-modal {
  width: 92vw;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.pdf-body {
  flex: 1;
  min-height: 0;          /* 이게 없으면 iframe 이 부모를 밀어내 푸터가 화면 밖으로 나간다 */
  background: #525659;    /* PDF 뷰어 기본 배경과 맞춰 여백이 튀지 않게 */
}

.pdf-body iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.pdf-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pdf-footer .pdf-name {
  font-size: 0.85rem;
  color: #6b7280;
}

.pdf-footer .spacer {
  flex: 1;
}

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

/* 원가 칸 — 눌러서 FIFO 내역 펼치기 */
.cost-toggle {
  border: none;
  background: none;
  padding: 0;
  color: #1d4ed8;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.cost-toggle small { margin-left: 0.2rem; color: #6b7280; }
.cost-toggle i { margin-left: 0.25rem; font-size: 0.625rem; }
.cost-toggle.warn { color: #dc2626; }
.lots-row td { background: #f8fafc; padding: 0.5rem 1rem 0.75rem; }
.lots-caption { margin-bottom: 0.375rem; font-size: 0.75rem; color: #6b7280; }
</style>
