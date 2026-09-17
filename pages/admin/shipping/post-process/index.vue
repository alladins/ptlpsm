<template>
  <div class="post-process-list">
    <PageHeader
      title="출하 사후 처리"
      description="출하가 끝난 뒤에 확정되는 비용과 처리를 모아 봅니다. 운송비·가공비·손실이 어디까지 정리됐는지 확인하세요."
      icon="shipping"
      icon-color="cyan"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="doSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action" @click="resetSearch">
          <i class="fas fa-rotate-left" />
          초기화
        </button>
        <button class="btn-action btn-primary" @click="goToRegister">
          <i class="fas fa-plus" />
          사후 처리 등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>출하일:</label>
            <SearchDateRange v-model:start-date="search.startDate" v-model:end-date="search.endDate" />
          </div>
          <div class="search-item">
            <label>출하NO:</label>
            <input
              v-model="search.shipmentNo"
              type="text"
              class="keyword-input w-no"
              placeholder="출하번호"
              @keyup.enter="doSearch"
            >
          </div>
          <div class="search-item">
            <label>납품요구번호:</label>
            <input
              v-model="search.deliveryRequestNo"
              type="text"
              class="keyword-input w-no"
              placeholder="R25TB..."
              @keyup.enter="doSearch"
            >
          </div>
          <div class="search-item">
            <label>사업명:</label>
            <input
              v-model="search.projectName"
              type="text"
              class="keyword-input w-text"
              placeholder="사업명"
              @keyup.enter="doSearch"
            >
          </div>
          <div class="search-item">
            <label>범위:</label>
            <select v-model="search.scope" class="status-select" @change="doSearch">
              <option value="DONE">
                처리 등록분
              </option>
              <option value="ALL">
                전체 출하
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>출하NO</th>
              <th>출하일</th>
              <th>납품요구번호</th>
              <th>수요기관</th>
              <th>사업명</th>
              <th class="num">
                수량
              </th>
              <th>운송비</th>
              <th>가공비</th>
              <th>손실</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="empty">
                <i class="fas fa-spinner fa-spin" /> 불러오는 중...
              </td>
            </tr>
            <tr v-else-if="visibleRows.length === 0">
              <td colspan="9" class="empty">
                조건에 맞는 출하가 없습니다.
              </td>
            </tr>
            <!-- 목록은 보는 곳이다. 행을 누르면 그 출하가 잡힌 채로 등록 화면이 열린다 -->
            <tr
              v-for="s in visibleRows"
              v-else
              :key="s.shipmentId"
              class="pick-row"
              title="클릭하면 이 출하의 사후 처리 등록으로 이동합니다"
              @click="goToRegisterFor(s.shipmentNo)"
            >
              <td class="mono">
                {{ s.shipmentNo }}
              </td>
              <td class="nowrap">
                {{ formatDate(s.shipmentDate) }}
              </td>
              <td class="mono">
                {{ s.deliveryRequestNo || '-' }}
              </td>
              <td>{{ s.client || '-' }}</td>
              <td class="ellipsis" :title="s.projectName">
                {{ s.projectName || '-' }}
              </td>
              <!--
                출하수량은 원장 그대로 두고, 손실이 있으면 유효수량을 아래에 병기한다.
                납품률·잔여·기성청구는 이 유효수량으로 계산된다.
              -->
              <td class="num">
                {{ formatQuantity(s.shipmentQuantity) }}㎡
                <small v-if="Number(s.lossQuantity) > 0" class="eff-qty">
                  손실 {{ formatQuantity(s.lossQuantity) }} → 유효 {{ effectiveQty(s) }}㎡
                </small>
              </td>

              <!-- 운송비 -->
              <td class="num">
                <template v-if="Number(s.shippingCost) > 0">
                  <strong>{{ formatCurrency(s.shippingCost) }}</strong>
                  <small class="sub">{{ costTypeLabel(s.shippingCostType) }}</small>
                </template>
                <span v-else class="dash">-</span>
              </td>

              <!-- 가공비 -->
              <td class="num">
                <strong v-if="Number(s.processingFeeTotal) > 0">
                  {{ formatCurrency(s.processingFeeTotal) }}
                </strong>
                <span v-else class="dash">-</span>
              </td>

              <!-- 손실 -->
              <td class="num">
                <strong v-if="Number(s.lossQuantity) > 0" class="loss">
                  {{ formatQuantity(s.lossQuantity) }}㎡
                </strong>
                <span v-else class="dash">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="pagination.totalPages > 0"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { shipmentService, type ShipmentListItem } from '~/services/shipment.service'
import { formatDate, formatQuantity, getLocalDateString } from '~/utils/format'
import Pagination from '~/components/ui/Pagination.vue'

definePageMeta({ layout: 'admin' })

/**
 * 출하 사후 처리 — 목록
 *
 * 출하가 끝난 뒤에 확정되는 값(운송비·가공비·손실)이 어디까지 정리됐는지 한자리에서 본다.
 * 여기는 «보는 곳» 이고, 실제 등록은 [사후 처리 등록] 이나 행의 [처리] 로 넘어가서 한다.
 *
 * ⚠ 예전에는 출하관리 목록에 «사후 처리» 칸을 두고 거기서 바로 열었는데,
 *   목록에 액션이 흩어져 무엇이 처리됐는지 알 수 없었다. 목록과 처리를 갈랐다.
 */

const loading = ref(false)
const shipments = ref<ShipmentListItem[]>([])

const search = reactive({
  startDate: '',
  endDate: getLocalDateString(),
  shipmentNo: '',
  deliveryRequestNo: '',
  projectName: '',
  /**
   * 조회 범위
   *
   * ⚠ 서버에서 거른다. 화면에서 거르면 한 페이지(20건) 안에서만 걸러져
   *   "1페이지에 2건인데 전체 6페이지" 같은 목록이 된다.
   */
  scope: 'DONE' as 'DONE' | 'ALL'
})

const pagination = reactive({ page: 0, totalPages: 0, totalElements: 0 })

const visibleRows = computed(() => shipments.value)

const loadShipments = async () => {
  loading.value = true
  try {
    const res = await shipmentService.getShipments({
      startDate: search.startDate || undefined,
      endDate: search.endDate || undefined,
      shipmentNo: search.shipmentNo || undefined,
      deliveryRequestNo: search.deliveryRequestNo || undefined,
      projectName: search.projectName || undefined,
      postProcessedOnly: search.scope === 'DONE' ? true : undefined,
      page: pagination.page,
      size: 20,
      sort: 'shipmentDate,desc'
    })
    shipments.value = res.content || []
    pagination.totalPages = res.totalPages || 0
    pagination.totalElements = res.totalElements || 0
  } catch (error) {
    console.error('출하 조회 실패:', error)
    shipments.value = []
  } finally {
    loading.value = false
  }
}

const doSearch = async () => {
  pagination.page = 0
  await loadShipments()
}

const resetSearch = async () => {
  search.startDate = ''
  search.endDate = getLocalDateString()
  search.shipmentNo = ''
  search.deliveryRequestNo = ''
  search.projectName = ''
  search.scope = 'DONE'
  await doSearch()
}

const onPageChange = async (page: number) => {
  pagination.page = page
  await loadShipments()
}

const router = useRouter()

/**
 * 사후 처리 등록으로 이동
 *
 * ⚠ 헤더 버튼(@click="goToRegister")은 MouseEvent 를 넘기므로 인자를 받지 않는다.
 *   행 클릭은 출하번호를 직접 넘긴다. 두 경로가 같은 함수를 쓰니 타입을 갈라 둔다.
 */
const goToRegister = () => {
  router.push({ path: '/admin/shipping/post-process/register' })
}

const goToRegisterFor = (shipmentNo?: string | null) => {
  router.push({
    path: '/admin/shipping/post-process/register',
    query: shipmentNo ? { shipmentNo } : {}
  })
}

/** 손실 차감 후 실제로 현장이 받은 수량 */
const effectiveQty = (s: ShipmentListItem): string =>
  formatQuantity(Number(s.shipmentQuantity || 0) - Number(s.lossQuantity || 0))

const costTypeLabel = (type?: string | null): string => {
  if (type === 'PAID_TO_OEM') { return '제조사 지불' }
  if (type === 'LP_BEARS') { return '리드파워 부담' }
  return '제조사 부담'
}

const formatCurrency = (value: unknown): string =>
  `${Math.round(Number(value || 0)).toLocaleString('ko-KR')}원`

// 들어오자마자 최근 출하가 보이게 한다. 검색부터 시켜야 할 이유가 없다.
onMounted(loadShipments)
</script>

<style scoped>
.data-table td.num,
.data-table th.num {
  text-align: right;
}

.data-table td.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
}

/* 날짜는 "2026. 09. 10." 처럼 공백이 있어 좁은 칸에서 두 줄로 접힌다 */
.data-table td.nowrap {
  white-space: nowrap;
}

.data-table td.ellipsis {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-table td.empty {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
}

.sub {
  display: block;
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 400;
}

.dash {
  color: #d1d5db;
}

.loss {
  color: #b91c1c;
}

.eff-qty {
  display: block;
  font-size: 0.7rem;
  color: #b91c1c;
  font-weight: 600;
  white-space: nowrap;
}

/* 검색 조건 한 줄 유지 — 공용 .keyword-input 은 250px 고정이라 그대로 두면 접힌다 */
.search-row-single .keyword-input.w-date { width: 140px; }
.search-row-single .keyword-input.w-no { width: 150px; }
.search-row-single .keyword-input.w-text { width: 160px; }

.search-row-single .search-item label {
  white-space: nowrap;
}

.date-sep {
  margin: 0 4px;
  color: #9ca3af;
}

.pick-row {
  cursor: pointer;
}

.pick-row:hover {
  background: #eff6ff;
}
</style>
