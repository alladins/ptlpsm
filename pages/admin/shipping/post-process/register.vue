<template>
  <div class="admin-page-wrapper">
    <div class="page-header-compact">
      <h1>사후 처리 등록</h1>
      <span class="page-description">
        출하가 끝난 뒤에 확정되는 비용과 처리를 등록합니다
      </span>
      <button class="btn-to-list" @click="goToList">
        <i class="fas fa-list" /> 목록
      </button>
    </div>

    <!-- STEP 1: 출하 찾기 -->
    <div class="step-block">
      <div class="step-title">
        <span class="step-badge">1</span>
        처리할 출하를 찾습니다
      </div>

      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>출하일:</label>
            <input v-model="search.startDate" type="date" class="keyword-input w-date">
            <span class="date-sep">~</span>
            <input v-model="search.endDate" type="date" class="keyword-input w-date">
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
            <label>수요기관:</label>
            <input
              v-model="search.client"
              type="text"
              class="keyword-input w-text"
              placeholder="수요기관명"
              @keyup.enter="doSearch"
            >
          </div>
          <button class="btn-search-inline" @click="doSearch">
            <i class="fas fa-search" /> 검색
          </button>
          <button class="btn-reset-inline" @click="resetSearch">
            <i class="fas fa-undo" /> 초기화
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 44px" />
              <th style="width: 130px">
                출하NO
              </th>
              <th style="width: 100px">
                출하일
              </th>
              <th style="width: 150px">
                납품요구번호
              </th>
              <th style="width: 160px">
                수요기관
              </th>
              <th>사업명</th>
              <th style="width: 90px" class="text-right">
                수량
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="empty">
                <i class="fas fa-spinner fa-spin" /> 조회 중...
              </td>
            </tr>
            <tr v-else-if="shipments.length === 0">
              <td colspan="7" class="empty">
                {{ searched ? '검색 결과가 없습니다.' : '조건을 넣고 검색하세요.' }}
              </td>
            </tr>
            <tr
              v-for="s in shipments"
              v-else
              :key="s.shipmentId"
              class="pick-row"
              :class="{ picked: picked?.shipmentId === s.shipmentId }"
              @click="pick(s)"
            >
              <td class="text-center">
                <input
                  type="radio"
                  :checked="picked?.shipmentId === s.shipmentId"
                  @change="pick(s)"
                >
              </td>
              <td class="mono">
                {{ s.shipmentNo || `#${s.shipmentId}` }}
              </td>
              <td class="nowrap">{{ formatDate(s.shipmentDate) }}</td>
              <td class="mono">
                {{ s.deliveryRequestNo }}
              </td>
              <td>{{ s.client }}</td>
              <td class="ellipsis" :title="s.projectName">
                {{ s.projectName }}
              </td>
              <td class="text-right">
                {{ formatQuantity(s.shipmentQuantity) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="pagination.totalPages > 1"
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        @change="onPageChange"
      />
    </div>

    <!-- STEP 2: 처리 유형 -->
    <div class="step-block" :class="{ disabled: !picked }">
      <div class="step-title">
        <span class="step-badge">2</span>
        어떤 처리를 할지 고릅니다
        <span v-if="picked" class="picked-tag">
          {{ picked.shipmentNo || `#${picked.shipmentId}` }} · {{ picked.projectName }}
        </span>
      </div>

      <div v-if="!picked" class="step-hint-empty">
        먼저 위에서 출하를 선택하세요.
      </div>

      <div v-else class="action-cards">
        <!--
          운송비·가공비는 출하당 1건이라 카드를 누르면 기존 값이 폼에 그대로 들어온다.
          손실은 품목별로 여러 건이 생기므로 카드만으로는 «어느 손실을 고칠지» 를 알 수 없다.
          그래서 손실만 카드 아래에 등록된 목록을 따로 펼친다.
        -->
        <button class="action-card" @click="openShippingCost">
          <i class="fas fa-truck" />
          <span class="ac-title">운송비 확정</span>
          <span class="ac-desc">배차가 끝난 뒤 부담 유형·운송사·금액을 입력합니다</span>
          <span v-if="Number(picked.shippingCost) > 0" class="ac-state">
            현재 {{ formatMoney(picked.shippingCost) }}
          </span>
          <span v-else class="ac-state none">미입력</span>
        </button>

        <button class="action-card" @click="openNewLoss">
          <i class="fas fa-exclamation-triangle" />
          <span class="ac-title">손실 등록</span>
          <span class="ac-desc">수량이 덜 왔거나 다른 스펙이 납품된 경우</span>
          <span v-if="losses.length > 0" class="ac-state">
            등록 {{ losses.length }}건 · 아래에서 선택
          </span>
          <span v-else class="ac-state none">없음</span>
        </button>

        <!--
          ⚠ 예전에 :disabled="!picked.orderId" 였는데, 출하 목록 API(ShipmentResponse)에는
            orderId 필드가 없어 이 카드가 영원히 눌리지 않았다.
            연결 발주서 유무는 모달이 열린 뒤 조회해야 알 수 있고, 없으면 모달이 안내한다.
        -->
        <button class="action-card" :disabled="!picked.shipmentId" @click="openProcessingFee">
          <i class="fas fa-industry" />
          <span class="ac-title">가공비 입력</span>
          <span class="ac-desc">이 출하에 연결된 발주서의 가공비를 넣습니다</span>
          <span v-if="Number(picked.processingFeeTotal) > 0" class="ac-state">
            현재 {{ formatMoney(picked.processingFeeTotal) }}
          </span>
          <span v-else class="ac-state none">미입력</span>
        </button>
      </div>

      <!-- 이미 등록된 손실 — 골라서 고친다 -->
      <div v-if="picked && losses.length > 0" class="loss-existing">
        <div class="le-title">
          <i class="fas fa-list-ul" /> 이 출하에 등록된 손실
          <small>고칠 건을 누르세요</small>
        </div>
        <button
          v-for="l in losses"
          :key="l.lossId"
          class="le-row"
          @click="openEditLoss(l)"
        >
          <span class="le-no">{{ l.lossNo }}</span>
          <span class="le-type" :class="l.lossType === 'SHORTAGE' ? 'short' : 'spec'">
            {{ l.lossType === 'SHORTAGE' ? '수량 부족' : '규격 오납' }}
          </span>
          <span class="le-sku">{{ l.skuName || l.skuId }}</span>
          <span class="le-qty">{{ formatQuantity(l.quantity) }}㎡</span>
          <span class="le-amt">{{ formatMoney(l.grossLossAmount) }}</span>
          <span class="le-status" :class="l.settlementStatus === 'DEDUCTED' ? 'done' : ''">
            {{ l.settlementStatusName || l.settlementStatus }}
          </span>
          <i class="fas fa-chevron-right" />
        </button>
        <p class="le-hint">
          <i class="fas fa-circle-info" />
          정산이 <strong>차감반영</strong> 된 건은 수정할 수 없습니다.
        </p>
      </div>
    </div>

    <!-- 운송비 확정 모달 -->
    <ShipmentCostModal
      :is-open="showShippingCost"
      :shipment="picked"
      @close="showShippingCost = false"
      @saved="onSaved('운송비를 저장했습니다.')"
    />

    <!-- 손실 등록·수정 모달 (기존 컴포넌트 재사용) -->
    <LossAdjustmentModal
      :is-open="showLoss"
      :shipments="picked ? [picked] : []"
      :edit-target="lossEditTarget"
      @close="closeLoss"
      @saved="onSaved(lossEditTarget ? '손실을 수정했습니다.' : '손실을 등록했습니다.')"
    />

    <!-- 가공비 모달 -->
    <ProcessingFeeModal
      :is-open="showProcessingFee"
      :shipment="picked"
      @close="showProcessingFee = false"
      @saved="onSaved('가공비를 저장했습니다.')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { shipmentService, type ShipmentListItem } from '~/services/shipment.service'
import { formatDate, formatQuantity, getLocalDateString } from '~/utils/format'
import Pagination from '~/components/ui/Pagination.vue'
import { lossService } from '~/services/loss.service'
import type { LossAdjustmentResponse } from '~/types/loss'
import LossAdjustmentModal from '~/components/loss/LossAdjustmentModal.vue'
import ShipmentCostModal from '~/components/admin/shipping/ShipmentCostModal.vue'
import ProcessingFeeModal from '~/components/admin/shipping/ProcessingFeeModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 사후 처리'
})

/**
 * 출하 사후 처리
 *
 * 출하가 끝난 뒤에야 확정되는 값들을 한 곳에서 처리한다.
 * 예전에는 운송비는 출하 등록 화면에서만, 손실은 손실관리에서, 가공비는 발주 등록에서만
 * 넣을 수 있어 사후 입력 경로가 사실상 없었다.
 *
 * 흐름: 출하 검색 → 선택 → 처리 유형 → 입력
 */

const loading = ref(false)
const searched = ref(false)
const shipments = ref<ShipmentListItem[]>([])
const picked = ref<ShipmentListItem | null>(null)

const showShippingCost = ref(false)
const showLoss = ref(false)
const showProcessingFee = ref(false)

const search = reactive({
  startDate: '',
  endDate: getLocalDateString(),
  shipmentNo: '',
  deliveryRequestNo: '',
  projectName: '',
  client: ''
})

const pagination = reactive({ page: 0, totalPages: 0, totalElements: 0 })

const loadShipments = async () => {
  loading.value = true
  try {
    const res = await shipmentService.getShipments({
      startDate: search.startDate || undefined,
      endDate: search.endDate || undefined,
      shipmentNo: search.shipmentNo || undefined,
      deliveryRequestNo: search.deliveryRequestNo || undefined,
      projectName: search.projectName || undefined,
      client: search.client || undefined,
      page: pagination.page,
      size: 10,
      sort: 'shipmentDate,desc'
    })
    shipments.value = res.content || []
    pagination.totalPages = res.totalPages || 0
    pagination.totalElements = res.totalElements || 0
  } catch (error) {
    console.error('출하 조회 실패:', error)
    shipments.value = []
    alert('출하 조회에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

const doSearch = async () => {
  searched.value = true
  pagination.page = 0
  picked.value = null
  await loadShipments()
}

const resetSearch = () => {
  search.startDate = ''
  search.endDate = getLocalDateString()
  search.shipmentNo = ''
  search.deliveryRequestNo = ''
  search.projectName = ''
  search.client = ''
  shipments.value = []
  picked.value = null
  searched.value = false
}

const onPageChange = async (page: number) => {
  pagination.page = page
  await loadShipments()
}

/**
 * 이 출하에 이미 등록된 손실
 *
 * ⚠ 운송비·가공비는 출하당 1건이라 모달이 기존 값을 채워 연다.
 *   손실은 품목별로 여러 건이 생기므로 «어느 건을 고칠지» 를 먼저 골라야 한다.
 *   고르지 않고 열면 늘 신규 등록이 되어, 이미 넣은 손실이 안 보인다.
 */
const losses = ref<LossAdjustmentResponse[]>([])
const lossEditTarget = ref<LossAdjustmentResponse | null>(null)

const loadLosses = async (shipmentId?: number) => {
  if (!shipmentId) { losses.value = []; return }
  try {
    losses.value = await lossService.getLossesByShipment(shipmentId)
  } catch (error) {
    console.error('손실 조회 실패:', error)
    losses.value = []
  }
}

const pick = async (s: ShipmentListItem) => {
  picked.value = s
  await loadLosses(s.shipmentId)
}

const formatMoney = (value: unknown): string =>
  `${Math.round(Number(value || 0)).toLocaleString('ko-KR')}원`

const openShippingCost = () => { showShippingCost.value = true }

const openNewLoss = () => {
  lossEditTarget.value = null
  showLoss.value = true
}

const openEditLoss = (loss: LossAdjustmentResponse) => {
  if (loss.settlementStatus === 'DEDUCTED') {
    alert('이미 차감반영된 손실은 수정할 수 없습니다.')
    return
  }
  lossEditTarget.value = loss
  showLoss.value = true
}

const closeLoss = () => {
  showLoss.value = false
  lossEditTarget.value = null
}

const openProcessingFee = () => { showProcessingFee.value = true }

const onSaved = async (message: string) => {
  showShippingCost.value = false
  showLoss.value = false
  lossEditTarget.value = null
  showProcessingFee.value = false
  alert(message)

  // ⚠ 선택을 잃지 않게 한다. 저장할 때마다 처음부터 다시 고르게 하면 연속 처리가 안 된다.
  const keepId = picked.value?.shipmentId
  await loadShipments()
  if (keepId) {
    picked.value = shipments.value.find(s => s.shipmentId === keepId) || picked.value
    await loadLosses(keepId)
  }
}

// 출하 목록에서 «사후 처리» 버튼으로 넘어온 경우 바로 그 건을 잡는다
const route = useRoute()
const router = useRouter()

const goToList = () => router.push('/admin/shipping/post-process')

onMounted(async () => {
  const no = route.query.shipmentNo as string | undefined
  if (no) {
    search.shipmentNo = no
    search.startDate = ''
    await doSearch()
    if (shipments.value.length === 1) {
      // ⚠ pick() 을 거쳐야 그 출하의 손실 목록도 함께 불러온다
      await pick(shipments.value[0])
    }
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';

.step-block {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 18px;
}

.step-block.disabled {
  opacity: 0.6;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 14px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
}

.picked-tag {
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.step-hint-empty {
  padding: 22px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.date-sep {
  margin: 0 4px;
  color: #9ca3af;
}

/* 카드에 현재 상태를 적어 둔다 — 눌러보기 전에 뭐가 들어있는지 알 수 있게 */
.ac-state {
  margin-top: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #1d4ed8;
}

.ac-state.none {
  color: #9ca3af;
  font-weight: 500;
}

/* 이미 등록된 손실 목록 */
.loss-existing {
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.le-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.6rem;
}

.le-title small {
  margin-left: 0.4rem;
  font-weight: 500;
  color: #9ca3af;
}

.le-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  margin-bottom: 0.35rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 0.82rem;
}

.le-row:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.le-no {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: #111827;
}

.le-type {
  padding: 1px 7px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.le-type.short { background: #fee2e2; color: #b91c1c; }
.le-type.spec { background: #e0e7ff; color: #4338ca; }

.le-sku {
  flex: 1;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.le-qty,
.le-amt {
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}

.le-status {
  padding: 1px 7px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.le-status.done {
  background: #d1fae5;
  color: #065f46;
}

.le-hint {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

/* 헤더 우측 목록 버튼 — 제목줄 오른쪽 끝으로 민다 */
.page-header-compact {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.btn-to-list {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-to-list:hover {
  border-color: #2563eb;
  color: #1d4ed8;
  background: #eff6ff;
}

/*
 * 검색 조건 한 줄 유지
 *
 * 공용 .keyword-input 은 250px 고정이라 조건 6개를 나란히 두면 두 줄로 접힌다.
 * 들어갈 값의 길이에 맞춰 줄인다. 좁은 화면에서는 어차피 wrap 된다.
 */
.search-row-single .keyword-input.w-date { width: 140px; }
.search-row-single .keyword-input.w-no   { width: 150px; }
.search-row-single .keyword-input.w-text { width: 160px; }

.search-row-single .search-item label {
  white-space: nowrap;
}

.pick-row {
  cursor: pointer;
}

.pick-row:hover {
  background: #f8fafc;
}

.pick-row.picked {
  background: #eff6ff;
}

.data-table td.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
}

.data-table td.ellipsis {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 날짜는 "2026. 09. 10." 처럼 공백이 있어 좁은 칸에서 두 줄로 접힌다 */
.data-table td.nowrap {
  white-space: nowrap;
}

.data-table td.empty {
  text-align: center;
  color: #9ca3af;
  padding: 2rem;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.action-card:hover:not(:disabled) {
  border-color: #2563eb;
  background: #f8fafc;
  transform: translateY(-1px);
}

.action-card:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-card > i {
  font-size: 18px;
  color: #2563eb;
}

.ac-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.ac-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}
</style>
