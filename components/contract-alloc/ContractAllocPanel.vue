<!--
  ContractAllocPanel — 계약 품목 귀속 지정 (출하 품목 → 계약 품목·수량)

  @created 2026-10-02
  @see docs/PLAN_계약품목귀속_20261002.md «0. 대전제», «1-b단계»

  쓰는 곳: 납품완료 상세(orderId 기준), 출하 수정(shipmentId 기준). 같은 컴포넌트.
  - 계약에 없는 SKU 로 나간 출하 행마다 «어느 계약 품목을 몇 개 채웠는지»를 지정한다.
  - 지정이 없으면(귀속 미지정) 외부 서류 발행이 막힌다 → 이 화면이 그걸 푸는 곳.
  - 내부 화면이라 실물 품목명(B급 SKU·합지 SKU)이 보여도 된다. 외부 서류에는 계약 품목명만 나간다.

  유형
  - B급(같은 두께): 원 SKU 가 계약 품목. 서버 추천이 있으면 자동으로 채우고 [확인]만 누르면 된다.
  - 합지(두께 조합): 계약 품목 여러 개(같은 품목 두 겹은 «겹 수»)의 두께 합 = 출하 두께.
  - 대체(다른 품목으로 대신 납품): 다른 두께로 보내고 조달청엔 계약 품목으로 청구한 경우(2026-10-02 확정).
    계약 품목 1개 이상(중복 불가) + 계약 기준 수량 자유 입력. 두께 검증 없음. 금액 비교는 참고 표시만.
  - 품목 추가(신규): 저장하지 않는다. 변경계약 등록을 안내한다.

  ★ 가정(백엔드 확인 필요) — 합지에서 같은 계약 품목을 두 번(이상) 고르면:
    줄을 하나로 합치고 «겹 수»를 늘린다. 저장 수량 기본값 = 출하수량 × 겹 수.
    (예: 120T 450㎡ = 60T × 2겹 → allocations: [{ 60T, 900 }])
    PUT 본문에는 겹 수를 따로 보내지 않는다. 서버 두께 검증이 «품목별 1회»로 합산하면
    60T×2 가 60T 로만 계산되어 거부될 수 있다 → 백엔드 규칙 확정 시 맞출 것.

  props: orderId 또는 shipmentId 중 하나. emit changed: 저장·해제 성공 후.
  ⚠ 출하 수정 화면에서는 <form> 안에 들어간다 → 버튼은 전부 type="button", 입력칸은 Enter 로 바깥 폼이 제출되지 않게 막는다.
-->
<template>
  <!-- 권한 없는 역할(403)은 패널 자체를 조용히 숨긴다 (가드는 fail-open 이라 업무에는 영향 없음) -->
  <div v-if="!forbidden" ref="rootEl" class="ca-panel">
    <div class="ca-header">
      <div class="ca-title">
        <i class="fas fa-link" />
        <span>계약 품목 귀속</span>
        <span v-if="loading" class="ca-loading"><i class="fas fa-spinner fa-spin" /></span>
        <span v-else-if="status && !status.nonStandard && rows.length > 0" class="ca-count" :class="unallocatedCount > 0 ? 'bad' : 'ok'">
          {{ unallocatedCount > 0 ? `미지정 ${unallocatedCount}건` : '모두 지정됨' }}
        </span>
      </div>
      <button
        v-if="status && rows.length > 0 && unallocatedCount === 0"
        type="button"
        class="ca-btn ca-btn-ghost"
        :aria-expanded="listOpen"
        @click="listOpen = !listOpen"
      >
        {{ listOpen ? '목록 접기' : '목록 보기' }}
        <i class="fas" :class="listOpen ? 'fa-chevron-up' : 'fa-chevron-down'" />
      </button>
    </div>

    <!-- 조회 실패 -->
    <div v-if="loadError && !loading" class="ca-line ca-line-error">
      <i class="fas fa-exclamation-circle" />
      <span>계약 품목 귀속 상태를 불러오지 못했습니다. ({{ loadError }})</span>
      <button type="button" class="ca-btn ca-btn-ghost" @click="reload">
        <i class="fas fa-redo" /> 다시 시도
      </button>
    </div>

    <!-- 비표준 발주 -->
    <div v-else-if="status && status.nonStandard" class="ca-line">
      <i class="fas fa-info-circle" />
      <span>비표준 발주(계약 품목 SKU 없음)라 계약 품목 귀속 대상이 아닙니다.</span>
    </div>

    <!-- 계약 외 출하 품목 없음 -->
    <div v-else-if="status && rows.length === 0" class="ca-line">
      <i class="fas fa-check-circle ca-ok-icon" />
      <span>계약에 없는 품목으로 나간 출하가 없습니다. 모든 출하 품목이 계약 품목으로 집계됩니다.</span>
    </div>

    <template v-else-if="status">
      <GuideNotice icon="fa-link" :tone="unallocatedCount > 0 ? 'warn' : 'info'">
        <template #summary>
          계약에 없는 품목으로 나간 출하는 어느 계약 품목을 채웠는지 지정해야 청구·납품완료 서류(기성청구·잔금·납품확인서·완료계 등)를 발행할 수 있습니다.
        </template>
        <ul>
          <li><b>B급(같은 두께)</b> — 계약 품목의 B급 SKU 로 납품한 경우. 원 계약 품목을 같은 수량만큼 채운 것으로 지정합니다. 추천이 있으면 자동으로 채워지니 [확인]만 누르세요.</li>
          <li><b>합지(두께 조합)</b> — 계약 두께를 겹친 것과 같은 두께의 판으로 바꿔 납품한 경우(예: 60T + 70T → 130T). 겹친 계약 품목들을 고르고, 두께 합이 출하 두께와 같아야 저장됩니다.</li>
          <li><b>대체</b> — 다른 두께로 대신 납품하고 조달청엔 계약 품목으로 청구한 경우. 예) 70T 계약인데 50T 20㎡ 를 보냈으면 70T 16㎡ 로 지정. 계약 기준 수량을 직접 입력하며 두께는 검사하지 않습니다.</li>
          <li><b>품목 추가(신규)</b> — 계약에 없던 품목을 새로 납품한 경우. 여기서 지정하지 않고 조달청 변경계약을 먼저 등록합니다.</li>
        </ul>
        <p>이 화면은 내부 화면이라 실제 나간 품목명(B급·합지 품목)이 보입니다. 외부 서류에는 <b>계약 품목명과 계약 기준 수량만</b> 나가고 B급·합지 흔적은 남지 않습니다.</p>
        <p>출하·운송(출발 문자·인수증·현장 서명)은 지정하지 않아도 그대로 진행됩니다. 다만 미지정 품목은 인수증·현장 서명 화면에 표시되지 않습니다.</p>
      </GuideNotice>

      <div v-if="unallocatedCount === 0 && !listOpen" class="ca-line ca-line-ok">
        <i class="fas fa-check-circle ca-ok-icon" />
        <span>모든 출하 품목이 계약 품목으로 집계됩니다. (계약 외 출하 {{ rows.length }}건 모두 지정됨)</span>
      </div>

      <div v-if="unallocatedCount > 0 || listOpen" class="ca-list">
        <!-- 넓은 화면 표 머리 (좁은 화면에서는 숨김 → 카드) -->
        <div class="ca-row ca-row-head" aria-hidden="true">
          <span>출하번호</span>
          <span>출하일</span>
          <span>실물 품목</span>
          <span class="num">두께</span>
          <span class="num">수량</span>
          <span>상태</span>
          <span />
        </div>

        <div v-for="row in rows" :key="rowKey(row)" class="ca-item" :class="{ editing: editingKey === rowKey(row) }">
          <div class="ca-row">
            <span class="cell" data-label="출하번호">{{ row.shipmentNo || row.shipmentId }}</span>
            <span class="cell" data-label="출하일">{{ row.shipmentDate ? formatDate(row.shipmentDate) : '-' }}</span>
            <span class="cell cell-sku" data-label="실물 품목">{{ row.shipSkuName || row.shipSkuId }}</span>
            <span class="cell num" data-label="두께">{{ row.shipThickness != null ? `${fmtQty(row.shipThickness)}T` : '-' }}</span>
            <span class="cell num" data-label="수량">{{ fmtQty(row.shipmentQuantity) }}</span>
            <span class="cell" data-label="상태">
              <span class="ca-badge" :class="row.allocated ? 'ok' : 'bad'">{{ row.allocated ? '지정됨' : '미지정' }}</span>
              <span v-if="row.allocated" class="ca-alloc-summary">{{ allocSummary(row) }}</span>
            </span>
            <span class="cell cell-actions">
              <button
                v-if="!readonly"
                type="button"
                class="ca-btn"
                :class="row.allocated ? 'ca-btn-ghost' : 'ca-btn-primary'"
                :aria-expanded="editingKey === rowKey(row)"
                @click="toggleEdit(row)"
              >
                {{ editingKey === rowKey(row) ? '닫기' : (row.allocated ? '변경' : '지정') }}
              </button>
            </span>
          </div>

          <!-- 인라인 편집 -->
          <div v-if="editingKey === rowKey(row)" class="ca-edit">
            <div class="ca-type-tabs" role="radiogroup" aria-label="귀속 유형">
              <!-- B급은 원래 품목(B 를 뗀 SKU)이 계약에 있을 때만 고를 수 있다 — 없으면 막고 이유 안내 -->
              <GuardedButton
                v-for="opt in typeOptions"
                :key="opt.value"
                type="button"
                role="radio"
                class="ca-type"
                :class="{ active: editForm.type === opt.value }"
                :aria-checked="editForm.type === opt.value"
                :blocked="opt.value === 'BGRADE' && bgradeCandidates(row).length === 0"
                :reason="isBgradeShipSku(row) ? BGRADE_NO_ORIGIN_MSG : NOT_BGRADE_MSG"
                @click="setType(row, opt.value)"
              >
                <b>{{ opt.label }}</b>
                <small>{{ opt.hint }}</small>
              </GuardedButton>
            </div>
            <div v-if="isBgradeShipSku(row) && bgradeCandidates(row).length === 0" class="ca-line ca-line-warn">
              <i class="fas fa-info-circle" />
              <span>{{ BGRADE_NO_ORIGIN_MSG }}</span>
            </div>

            <!-- B급 -->
            <div v-if="editForm.type === 'BGRADE'" class="ca-edit-body">
              <p v-if="hasBgradeSuggestion(row)" class="ca-hint">
                <i class="fas fa-magic" /> 추천대로 채웠습니다. 맞으면 [확인]을 누르세요.
              </p>
              <p v-else class="ca-hint">
                이 B급 품목의 원래 계약 품목입니다. 수량은 출하수량 그대로 지정됩니다.
              </p>
              <div v-if="bgradeCandidates(row).length > 0" class="ca-choices">
                <button
                  v-for="ci in bgradeCandidates(row)"
                  :key="ci.orderItemId"
                  type="button"
                  class="ca-choice"
                  :class="{ active: editForm.bgradeOrderItemId === ci.orderItemId }"
                  :aria-pressed="editForm.bgradeOrderItemId === ci.orderItemId"
                  @click="editForm.bgradeOrderItemId = ci.orderItemId"
                >
                  <b>{{ ci.skuName || ci.productName || ci.skuId }}</b>
                  <small>{{ contractItemMeta(ci) }}</small>
                </button>
              </div>
              <div v-if="editForm.bgradeOrderItemId" class="ca-result">
                → <b>{{ contractItemName(editForm.bgradeOrderItemId) }}</b> {{ fmtQty(row.shipmentQuantity) }} 채움
              </div>
            </div>

            <!-- 합지 -->
            <div v-else-if="editForm.type === 'LAMINATE'" class="ca-edit-body">
              <p class="ca-hint">
                겹친 계약 품목을 누르세요. 같은 품목을 다시 누르면 «겹 수»가 늘어납니다. 수량 기본값은 출하수량 × 겹 수입니다.
              </p>

              <input
                v-if="contractItems.length > 6"
                v-model="laminateFilter"
                type="search"
                class="ca-input ca-filter"
                placeholder="계약 품목 검색 (품목명·두께)"
                @keydown.enter.prevent
              >
              <div class="ca-choices">
                <button
                  v-for="ci in filteredContractItems"
                  :key="ci.orderItemId"
                  type="button"
                  class="ca-choice"
                  :class="{ active: layerOf(ci.orderItemId) }"
                  @click="addLayer(row, ci.orderItemId)"
                >
                  <b>+ {{ ci.skuName || ci.productName || ci.skuId }}</b>
                  <small>{{ contractItemMeta(ci) }}</small>
                </button>
              </div>

              <div v-if="editForm.layers.length > 0" class="ca-layers">
                <div v-for="(layer, idx) in editForm.layers" :key="layer.orderItemId" class="ca-layer">
                  <div class="ca-layer-name">
                    <b>{{ contractItemName(layer.orderItemId) }}</b>
                    <small>{{ fmtThickness(contractItemById(layer.orderItemId)?.thickness) }}</small>
                  </div>
                  <div class="ca-layer-ctrl">
                    <span class="ca-ctrl-label">겹 수</span>
                    <div class="ca-stepper">
                      <button type="button" class="ca-step" aria-label="겹 수 줄이기" @click="changePlies(row, idx, -1)">
                        <i class="fas fa-minus" />
                      </button>
                      <span class="ca-plies">{{ layer.plies }}</span>
                      <button type="button" class="ca-step" aria-label="겹 수 늘리기" @click="changePlies(row, idx, 1)">
                        <i class="fas fa-plus" />
                      </button>
                    </div>
                  </div>
                  <label class="ca-layer-ctrl">
                    <span class="ca-ctrl-label">수량</span>
                    <input
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.01"
                      class="ca-input ca-qty"
                      :value="layer.quantity ?? ''"
                      @keydown.enter.prevent
                      @input="onLayerQtyInput(idx, $event)"
                    >
                  </label>
                  <button type="button" class="ca-btn ca-btn-ghost ca-remove" aria-label="이 품목 빼기" @click="removeLayer(idx)">
                    <i class="fas fa-times" /> 빼기
                  </button>
                </div>
              </div>

              <div class="ca-check" :class="thicknessCheck(row).ok ? 'ok' : 'bad'">
                <i class="fas" :class="thicknessCheck(row).ok ? 'fa-check-circle' : 'fa-exclamation-circle'" />
                <span>{{ thicknessCheck(row).text }}</span>
              </div>
            </div>

            <!-- 대체 (다른 품목으로 대신 납품) — 두께 검증 없음, 계약 기준 수량 자유 입력 -->
            <div v-else-if="editForm.type === 'SUBSTITUTE'" class="ca-edit-body">
              <p class="ca-hint">
                조달청에 청구한 계약 품목을 누르고 «계약 기준 수량»을 입력하세요. 두께는 검사하지 않으며 출하수량보다 커도 됩니다.
              </p>
              <input
                v-if="contractItems.length > 6"
                v-model="laminateFilter"
                type="search"
                class="ca-input ca-filter"
                placeholder="계약 품목 검색 (품목명·두께)"
                @keydown.enter.prevent
              >
              <div class="ca-choices">
                <button
                  v-for="ci in filteredContractItems"
                  :key="ci.orderItemId"
                  type="button"
                  class="ca-choice"
                  :class="{ active: substituteOf(ci.orderItemId) }"
                  :aria-pressed="!!substituteOf(ci.orderItemId)"
                  @click="toggleSubstitute(row, ci.orderItemId)"
                >
                  <b>{{ substituteOf(ci.orderItemId) ? '✓' : '+' }} {{ ci.skuName || ci.productName || ci.skuId }}</b>
                  <small>{{ contractItemMeta(ci) }}</small>
                </button>
              </div>

              <div v-if="editForm.subs.length > 0" class="ca-layers">
                <div v-for="(sub, idx) in editForm.subs" :key="sub.orderItemId" class="ca-layer ca-sub">
                  <div class="ca-layer-name">
                    <b>{{ contractItemName(sub.orderItemId) }}</b>
                    <small>{{ fmtThickness(contractItemById(sub.orderItemId)?.thickness) }}</small>
                  </div>
                  <label class="ca-layer-ctrl">
                    <span class="ca-ctrl-label">계약 기준 수량</span>
                    <input
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.01"
                      class="ca-input ca-qty"
                      :value="sub.quantity ?? ''"
                      @keydown.enter.prevent
                      @input="onSubQtyInput(idx, $event)"
                    >
                  </label>
                  <button type="button" class="ca-btn ca-btn-ghost ca-remove" aria-label="이 품목 빼기" @click="removeSubstitute(idx)">
                    <i class="fas fa-times" /> 빼기
                  </button>
                </div>
              </div>

              <!-- 참고: 금액 비교 (막지 않음) -->
              <div class="ca-amount-ref" role="status">
                <i class="fas fa-calculator" />
                <span>
                  출하 금액 <b>{{ row.shipAmount != null ? `${fmtQty(row.shipAmount)}원` : '-' }}</b>
                  / 귀속 금액 <b>{{ fmtQty(substituteAmount) }}원</b>
                  <template v-if="row.shipAmount != null">
                    / 차이 <b>{{ substituteAmount - Number(row.shipAmount) > 0 ? '+' : '' }}{{ fmtQty(substituteAmount - Number(row.shipAmount)) }}원</b>
                  </template>
                </span>
                <small>참고용입니다. 귀속 금액 = 계약 기준 수량 × 계약 단가</small>
              </div>
            </div>

            <!-- 품목 추가(신규) -->
            <div v-else class="ca-edit-body">
              <div class="ca-line ca-line-warn">
                <i class="fas fa-file-contract" />
                <span>
                  계약에 없는 품목을 새로 납품한 것이라면 조달청 변경계약이 먼저 필요합니다.
                  변경계약을 등록하면 그 품목이 계약 품목이 되어 이 안내가 사라집니다.
                </span>
              </div>
            </div>

            <div v-if="saveError" class="ca-line ca-line-error">
              <i class="fas fa-exclamation-circle" />
              <span class="ca-pre">{{ saveError }}</span>
            </div>

            <div class="ca-edit-actions">
              <button
                v-if="row.allocated"
                type="button"
                class="ca-btn ca-btn-danger"
                :disabled="saving"
                @click="askRemove(row)"
              >
                <i class="fas fa-unlink" /> 지정 해제
              </button>
              <span class="ca-spacer" />
              <button type="button" class="ca-btn ca-btn-ghost" :disabled="saving" @click="closeEdit">
                취소
              </button>
              <GuardedButton
                v-if="editForm.type !== 'NEW'"
                type="button"
                class="ca-btn ca-btn-primary"
                :disabled="saving"
                :blocked="!!saveBlockedReason(row)"
                :reason="saveBlockedReason(row)"
                @click="saveRow(row)"
              >
                <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'" />
                {{ editForm.type === 'BGRADE' ? '확인' : '저장' }}
              </GuardedButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 지정 해제 확인 (브라우저 confirm 대신 확인 모달) -->
    <Teleport to="body">
      <div v-if="removeTarget" class="ca-modal-overlay" @click.self="cancelRemove">
        <div class="ca-modal" role="dialog" aria-modal="true" aria-labelledby="ca-remove-title">
          <div class="ca-modal-header">
            <h3 id="ca-remove-title">
              <i class="fas fa-unlink" /> 계약 품목 지정 해제
            </h3>
            <button type="button" class="ca-modal-close" :disabled="saving" aria-label="닫기" @click="cancelRemove">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="ca-modal-body">
            <p>
              출하 <b>{{ removeTarget.shipmentNo || removeTarget.shipmentId }}</b> ·
              <b>{{ removeTarget.shipSkuName || removeTarget.shipSkuId }}</b> 의 계약 품목 지정을 해제합니다.
            </p>
            <p class="ca-warn-text">
              해제하면 이 출하 품목은 다시 «미지정»이 되어, 지정하기 전까지 이 발주의 청구·납품완료 서류(기성청구·잔금·납품확인서·완료계 등) 발행이 막힙니다.
            </p>
            <div v-if="saveError" class="ca-line ca-line-error">
              <i class="fas fa-exclamation-circle" />
              <span class="ca-pre">{{ saveError }}</span>
            </div>
          </div>
          <div class="ca-modal-footer">
            <button type="button" class="ca-btn ca-btn-ghost" :disabled="saving" @click="cancelRemove">
              취소
            </button>
            <button type="button" class="ca-btn ca-btn-danger" :disabled="saving" @click="confirmRemove">
              <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-unlink'" />
              해제
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from '#imports'
import { contractAllocService } from '~/services/contract-alloc.service'
import { useContractAllocStatus } from '~/composables/useContractAllocStatus'
import { formatDate } from '~/utils/format'
import { CONTRACT_ALLOC_TYPE_LABELS } from '~/types/contract-alloc'
import type {
  ContractAllocContractItem,
  ContractAllocShipmentItem,
  ContractAllocSaveRequest,
  ContractAllocStatus
} from '~/types/contract-alloc'

interface Props {
  /** 발주 기준 (납품완료 상세) */
  orderId?: number | null
  /** 출하 기준 (출하 수정) */
  shipmentId?: number | null
  /** 조회만 (권한 없음·데모 모드) */
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orderId: null,
  shipmentId: null,
  readonly: false
})

const emit = defineEmits<{
  /** 귀속 저장·해제 성공 — 부모는 상세 데이터를 다시 조회한다 */
  changed: []
  /** 조회 결과 — 부모가 품목 표에 귀속 대상(예: «계약 품목 귀속됨: 100T»)을 표시할 때 쓴다 */
  loaded: [status: ContractAllocStatus | null]
}>()

const route = useRoute()
const rootEl = ref<HTMLElement | null>(null)

const {
  status,
  loading,
  loadError,
  forbidden,
  unallocatedCount,
  loadByOrder,
  loadByShipment
} = useContractAllocStatus()

/** 계약 외 출하 품목 행 (미지정 먼저) */
const rows = computed<ContractAllocShipmentItem[]>(() => {
  const list = status.value?.items || []
  return [...list].sort((a, b) => Number(a.allocated) - Number(b.allocated))
})

const contractItems = computed<ContractAllocContractItem[]>(() => status.value?.contractItems || [])

// 미지정이 0이면 목록은 접어 둔다 (펼쳐서 변경 가능)
const listOpen = ref(false)

async function reload () {
  if (props.shipmentId) {
    await loadByShipment(props.shipmentId)
  } else {
    await loadByOrder(props.orderId)
  }
}

defineExpose({ reload })

// ===== #contract-alloc 로 들어왔을 때 이 위치로 스크롤 =====
// 페이지가 비동기로 그려져 라우터의 기본 해시 스크롤이 놓치므로, 조회가 끝난 뒤 직접 이동한다.
const ANCHOR = '#contract-alloc'
async function scrollIfAnchored () {
  if (route.hash !== ANCHOR) { return }
  await nextTick()
  rootEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  await reload()
  scrollIfAnchored()
})

watch(() => [props.orderId, props.shipmentId], () => {
  closeEdit()
  reload()
})

watch(() => route.hash, () => { scrollIfAnchored() })

// 조회 결과를 부모에 알린다 (품목 표 배지 등)
watch(status, (s) => { emit('loaded', s) })

// ===== 표시 도우미 =====
const fmtQty = (v: number | null | undefined) =>
  Number(v ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })

const fmtThickness = (t: number | null | undefined) => (t != null ? `${fmtQty(t)}T` : '두께 정보 없음')

const rowKey = (row: ContractAllocShipmentItem) => `${row.shipmentId}|${row.shipSkuId}`

const contractItemById = (orderItemId: number | null | undefined) =>
  contractItems.value.find(ci => ci.orderItemId === orderItemId) || null

const contractItemName = (orderItemId: number | null | undefined) => {
  const ci = contractItemById(orderItemId)
  return ci ? (ci.skuName || ci.productName || ci.skuId || `품목 ${ci.orderItemId}`) : `품목 ${orderItemId}`
}

const contractItemMeta = (ci: ContractAllocContractItem) =>
  `${fmtThickness(ci.thickness)} · 계약 ${fmtQty(ci.quantity)}${ci.unit ? ` ${ci.unit}` : ''}`

/** 지정된 귀속 요약 (예: «B급 → HYDRO-22-100T 206») */
function allocSummary (row: ContractAllocShipmentItem): string {
  const type = row.allocType ? CONTRACT_ALLOC_TYPE_LABELS[row.allocType] : 'B급'
  const parts = (row.allocations || []).map(a =>
    `${a.contractSkuName || contractItemName(a.orderItemId)} ${fmtQty(a.quantity)}`)
  return parts.length ? `${type} → ${parts.join(' + ')}` : type
}

/** 두께 비교 (소수 오차 허용) */
const sameThickness = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && Math.abs(Number(a) - Number(b)) < 0.001

const hasBgradeSuggestion = (row: ContractAllocShipmentItem) =>
  row.suggestion?.allocType === 'BGRADE' && (row.suggestion.allocations || []).length > 0

const BGRADE_NO_ORIGIN_MSG = '이 B급 품목의 원래 품목이 계약에 없습니다 — 합지 또는 품목 추가로 처리하세요.'
const NOT_BGRADE_MSG = 'B급 품목(품명이 «-B»로 끝남)만 B급으로 지정할 수 있습니다 — 합지·대체·품목 추가 중에서 고르세요.'

/** 실물 품목이 B급 SKU 인지 ('B'+원 SKU, 품명 끝 «-B») — B급 경고는 B급 품목에만 보여 준다 */
const isBgradeShipSku = (row: ContractAllocShipmentItem) =>
  (row.shipSkuId || '').startsWith('B') || /-B$/.test(row.shipSkuName || '')

/**
 * B급으로 지정할 수 있는 계약 품목.
 * 서버는 «출하 SKU 에서 앞의 B 를 뗀 SKU» 와 같은 계약 품목만 허용한다(같은 두께라도 다른 SKU 는 거부).
 * → 서버 추천(suggestion)이 있으면 그것, 없으면 B 를 뗀 SKU 와 같은 계약 품목만 보여준다.
 */
function bgradeCandidates (row: ContractAllocShipmentItem): ContractAllocContractItem[] {
  if (hasBgradeSuggestion(row)) {
    const ids = new Set(row.suggestion!.allocations.map(a => a.orderItemId))
    return contractItems.value.filter(ci => ids.has(ci.orderItemId))
  }
  const sku = row.shipSkuId || ''
  if (!/^B/i.test(sku) || sku.length < 2) { return [] }
  const origin = sku.substring(1)
  return contractItems.value.filter(ci => ci.skuId === origin)
}

// ===== 편집 상태 =====
type EditType = 'BGRADE' | 'LAMINATE' | 'SUBSTITUTE' | 'NEW'

/** 대체 1줄 — 계약 품목 + 계약 기준 수량(자유 입력, 두께 검증 없음) */
interface SubstituteForm {
  orderItemId: number
  quantity: number | null
}

interface LayerForm {
  orderItemId: number
  /** 겹 수 — 같은 계약 품목을 여러 겹 쓴 경우 (예: 60T × 2 = 120T) */
  plies: number
  /** 저장 수량 (계약 기준). 기본 = 출하수량 × 겹 수 */
  quantity: number | null
  /** 사용자가 수량을 직접 고쳤는가 — 고쳤으면 겹 수를 바꿔도 수량을 덮어쓰지 않는다 */
  qtyTouched: boolean
}

interface EditForm {
  type: EditType
  bgradeOrderItemId: number | null
  layers: LayerForm[]
  /** 대체 — 계약 품목별 계약 기준 수량 (같은 품목 중복 불가) */
  subs: SubstituteForm[]
}

// 유형 순서: B급 / 합지 / 대체 / 품목 추가(신규)
const typeOptions: { value: EditType; label: string; hint: string }[] = [
  { value: 'BGRADE', label: 'B급', hint: '같은 두께' },
  { value: 'LAMINATE', label: '합지', hint: '두께 조합' },
  { value: 'SUBSTITUTE', label: '대체', hint: '다른 품목으로 대신 납품' },
  { value: 'NEW', label: '품목 추가', hint: '계약에 없던 신규' }
]

const emptyForm = (): EditForm => ({ type: 'BGRADE', bgradeOrderItemId: null, layers: [], subs: [] })

const editingKey = ref<string | null>(null)
// ⚠ reactive 가 아니라 ref — 스크립트에서는 반드시 editForm.value.* 로 접근 (템플릿은 자동 언랩)
const editForm = ref<EditForm>(emptyForm())
const laminateFilter = ref('')
const saving = ref(false)
const saveError = ref<string | null>(null)

const filteredContractItems = computed(() => {
  const q = laminateFilter.value.trim().toLowerCase()
  if (!q) { return contractItems.value }
  return contractItems.value.filter(ci =>
    [ci.skuName, ci.productName, ci.skuId, ci.specification, ci.thickness != null ? `${ci.thickness}t` : '']
      .some(v => String(v || '').toLowerCase().includes(q)))
})

const layerOf = (orderItemId: number) => editForm.value.layers.find(l => l.orderItemId === orderItemId)

/** 저장된 귀속 → 합지 겹 줄 (수량 ÷ 출하수량 으로 겹 수 역산) */
function layersFromAllocations (row: ContractAllocShipmentItem, list: { orderItemId: number; quantity: number }[]): LayerForm[] {
  const base = Number(row.shipmentQuantity) || 0
  return list.map(a => ({
    orderItemId: a.orderItemId,
    plies: base > 0 ? Math.max(1, Math.round(Number(a.quantity) / base)) : 1,
    quantity: Number(a.quantity),
    qtyTouched: true
  }))
}

function initForm (row: ContractAllocShipmentItem) {
  const form: EditForm = emptyForm()
  if (row.allocated && row.allocType) {
    // 현재 지정값으로 채움
    form.type = row.allocType
    if (row.allocType === 'BGRADE') {
      form.bgradeOrderItemId = row.allocations[0]?.orderItemId ?? null
    } else if (row.allocType === 'SUBSTITUTE') {
      form.subs = row.allocations.map(a => ({ orderItemId: a.orderItemId, quantity: Number(a.quantity) }))
    } else {
      form.layers = layersFromAllocations(row, row.allocations)
    }
  } else if (row.suggestion && (row.suggestion.allocations || []).length > 0) {
    // 서버 추천으로 자동 채움 (B급: 계약 품목·수량 = 출하수량)
    form.type = row.suggestion.allocType
    if (row.suggestion.allocType === 'BGRADE') {
      form.bgradeOrderItemId = row.suggestion.allocations[0].orderItemId
    } else if (row.suggestion.allocType === 'SUBSTITUTE') {
      form.subs = row.suggestion.allocations.map(a => ({ orderItemId: a.orderItemId, quantity: Number(a.quantity) }))
    } else {
      form.layers = layersFromAllocations(row, row.suggestion.allocations)
    }
  } else {
    // 추천 없음: 원래 품목(B 를 뗀 SKU)이 계약에 있으면 B급, 없으면 합지부터
    const candidates = bgradeCandidates(row)
    form.type = candidates.length > 0 ? 'BGRADE' : 'LAMINATE'
    if (candidates.length === 1) { form.bgradeOrderItemId = candidates[0].orderItemId }
  }
  // 저장된 B급 귀속이라도 지금 고를 수 있는 후보가 아니면(계약 변경 등) 선택을 비운다
  if (form.type === 'BGRADE' && form.bgradeOrderItemId &&
      !bgradeCandidates(row).some(ci => ci.orderItemId === form.bgradeOrderItemId)) {
    form.bgradeOrderItemId = null
  }
  editForm.value = form
}

function toggleEdit (row: ContractAllocShipmentItem) {
  const key = rowKey(row)
  if (editingKey.value === key) { closeEdit(); return }
  editingKey.value = key
  saveError.value = null
  laminateFilter.value = ''
  initForm(row)
}

function closeEdit () {
  editingKey.value = null
  saveError.value = null
}

function setType (row: ContractAllocShipmentItem, type: EditType) {
  const candidates = bgradeCandidates(row)
  if (type === 'BGRADE' && candidates.length === 0) { return } // 버튼이 막혀 있어 여기 올 일은 없다
  editForm.value.type = type
  saveError.value = null
  // 대체로 바꿨는데 고른 품목이 없으면 기본값(두께가 가장 가까운 계약 품목 1개, 수량 = 출하수량)
  if (type === 'SUBSTITUTE' && editForm.value.subs.length === 0) {
    editForm.value.subs = defaultSubstitutes(row)
  }
  // B급으로 바꿨는데 고른 품목이 없으면 추천/유일 후보로 채움
  if (type === 'BGRADE' && !editForm.value.bgradeOrderItemId && candidates.length === 1) {
    editForm.value.bgradeOrderItemId = candidates[0].orderItemId
  }
}

const defaultLayerQty = (row: ContractAllocShipmentItem, plies: number) =>
  Math.round((Number(row.shipmentQuantity) || 0) * plies * 100) / 100

/**
 * 합지 품목 추가 — 같은 계약 품목을 다시 고르면 줄을 늘리지 않고 겹 수 +1.
 * ★ 가정: 같은 품목 두 겹 = 한 줄, 수량 = 출하수량 × 겹 수 (파일 머리 주석 참고)
 */
function addLayer (row: ContractAllocShipmentItem, orderItemId: number) {
  const layers = editForm.value.layers
  const idx = layers.findIndex(l => l.orderItemId === orderItemId)
  if (idx >= 0) {
    changePlies(row, idx, 1)
    return
  }
  layers.push({ orderItemId, plies: 1, quantity: defaultLayerQty(row, 1), qtyTouched: false })
}

function changePlies (row: ContractAllocShipmentItem, idx: number, delta: number) {
  const layer = editForm.value.layers[idx]
  if (!layer) { return }
  const next = layer.plies + delta
  if (next < 1) { removeLayer(idx); return }
  layer.plies = next
  if (!layer.qtyTouched) { layer.quantity = defaultLayerQty(row, next) }
}

function removeLayer (idx: number) {
  editForm.value.layers.splice(idx, 1)
}

// ===== 대체 (다른 품목으로 대신 납품) =====

const substituteOf = (orderItemId: number) => editForm.value.subs.find(s => s.orderItemId === orderItemId)

/** 출하 두께와 가장 가까운 계약 품목 (대체 기본값). 두께 정보가 없으면 첫 품목 */
function nearestThicknessItem (row: ContractAllocShipmentItem): ContractAllocContractItem | null {
  const list = contractItems.value
  if (list.length === 0) { return null }
  if (row.shipThickness == null) { return list[0] }
  const ship = Number(row.shipThickness)
  return [...list].sort((a, b) => {
    const da = a.thickness == null ? Number.POSITIVE_INFINITY : Math.abs(Number(a.thickness) - ship)
    const db = b.thickness == null ? Number.POSITIVE_INFINITY : Math.abs(Number(b.thickness) - ship)
    return da - db
  })[0]
}

/** 대체 기본값: 두께가 가장 가까운 계약 품목 1개, 수량 = 출하수량 */
function defaultSubstitutes (row: ContractAllocShipmentItem): SubstituteForm[] {
  const ci = nearestThicknessItem(row)
  return ci ? [{ orderItemId: ci.orderItemId, quantity: Number(row.shipmentQuantity) }] : []
}

/** 계약 품목 칩 누름 — 없으면 추가(수량 = 출하수량), 있으면 뺀다 (중복 불가) */
function toggleSubstitute (row: ContractAllocShipmentItem, orderItemId: number) {
  const subs = editForm.value.subs
  const idx = subs.findIndex(s => s.orderItemId === orderItemId)
  if (idx >= 0) {
    subs.splice(idx, 1)
    return
  }
  subs.push({ orderItemId, quantity: Number(row.shipmentQuantity) })
}

function removeSubstitute (idx: number) {
  editForm.value.subs.splice(idx, 1)
}

/** 대체 수량 입력 — 빈칸은 null */
function onSubQtyInput (idx: number, e: Event) {
  const sub = editForm.value.subs[idx]
  if (!sub) { return }
  const raw = (e.target as HTMLInputElement).value
  sub.quantity = raw === '' ? null : Number(raw)
}

/** 귀속 금액(참고) = Σ 계약 기준 수량 × 계약 단가 — 편집 중 실시간 계산 */
const substituteAmount = computed(() => Math.round(editForm.value.subs.reduce((sum, s) => {
  const price = Number(contractItemById(s.orderItemId)?.unitPrice ?? 0)
  return sum + (Number(s.quantity) || 0) * price
}, 0)))

/** 수량 입력 — 빈칸은 null 로 둔다 (v-model.number 의 0/빈칸 혼동 방지) */
function onLayerQtyInput (idx: number, e: Event) {
  const layer = editForm.value.layers[idx]
  if (!layer) { return }
  const raw = (e.target as HTMLInputElement).value
  layer.quantity = raw === '' ? null : Number(raw)
  layer.qtyTouched = true
}

/** 합지 두께 검증: Σ(품목 두께 × 겹 수) = 출하 두께 */
function thicknessCheck (row: ContractAllocShipmentItem): { ok: boolean; text: string } {
  const layers = editForm.value.layers
  if (layers.length === 0) {
    return { ok: false, text: '겹친 계약 품목을 골라 주세요.' }
  }
  const missing = layers.filter(l => contractItemById(l.orderItemId)?.thickness == null)
  if (missing.length > 0) {
    return { ok: false, text: `두께 정보가 없는 계약 품목이 있어 두께 합을 확인할 수 없습니다: ${missing.map(l => contractItemName(l.orderItemId)).join(', ')}` }
  }
  const sum = layers.reduce((s, l) => s + Number(contractItemById(l.orderItemId)!.thickness) * l.plies, 0)
  const expr = layers.map(l => `${fmtQty(contractItemById(l.orderItemId)!.thickness)}T${l.plies > 1 ? `×${l.plies}` : ''}`).join(' + ')
  if (row.shipThickness == null) {
    return { ok: false, text: `두께 합 ${expr} = ${fmtQty(sum)}T · 출하 품목의 두께 정보가 없어 비교할 수 없습니다.` }
  }
  if (sameThickness(sum, row.shipThickness)) {
    return { ok: true, text: `두께 합 ${expr} = ${fmtQty(sum)}T — 출하 두께 ${fmtQty(row.shipThickness)}T 와 같습니다.` }
  }
  return { ok: false, text: `두께 합 ${expr} = ${fmtQty(sum)}T — 출하 두께 ${fmtQty(row.shipThickness)}T 와 다릅니다.` }
}

/** 저장이 막힌 이유 (없으면 빈 문자열) — GuardedButton 안내 */
function saveBlockedReason (row: ContractAllocShipmentItem): string {
  const form = editForm.value
  if (form.type === 'BGRADE') {
    if (bgradeCandidates(row).length === 0) { return isBgradeShipSku(row) ? BGRADE_NO_ORIGIN_MSG : NOT_BGRADE_MSG }
    if (!form.bgradeOrderItemId) { return '채운 계약 품목을 먼저 고르세요.' }
    return ''
  }
  if (form.type === 'LAMINATE') {
    const check = thicknessCheck(row)
    if (!check.ok) { return `${check.text}\n겹친 계약 품목과 겹 수를 출하 두께에 맞게 고르세요.` }
    if (form.layers.some(l => l.quantity == null || !(l.quantity > 0))) {
      return '품목별 수량은 0보다 커야 합니다. 수량 칸을 채우세요.'
    }
    return ''
  }
  if (form.type === 'SUBSTITUTE') {
    if (form.subs.length === 0) { return '조달청에 청구한 계약 품목을 하나 이상 고르세요.' }
    if (form.subs.some(s => s.quantity == null || !(s.quantity > 0))) {
      return '계약 기준 수량은 0보다 커야 합니다. 수량 칸을 채우세요.'
    }
    return ''
  }
  return '품목 추가(신규)는 여기서 저장하지 않습니다. 조달청 변경계약을 먼저 등록하세요.'
}

function buildBody (row: ContractAllocShipmentItem): ContractAllocSaveRequest | null {
  const form = editForm.value
  if (form.type === 'BGRADE' && form.bgradeOrderItemId) {
    return {
      allocType: 'BGRADE',
      allocations: [{ orderItemId: form.bgradeOrderItemId, quantity: Number(row.shipmentQuantity) }]
    }
  }
  if (form.type === 'LAMINATE') {
    return {
      allocType: 'LAMINATE',
      allocations: form.layers.map(l => ({ orderItemId: l.orderItemId, quantity: Number(l.quantity) }))
    }
  }
  if (form.type === 'SUBSTITUTE') {
    return {
      allocType: 'SUBSTITUTE',
      allocations: form.subs.map(s => ({ orderItemId: s.orderItemId, quantity: Number(s.quantity) }))
    }
  }
  return null
}

async function saveRow (row: ContractAllocShipmentItem) {
  if (saving.value || saveBlockedReason(row)) { return }
  const body = buildBody(row)
  if (!body) { return }
  saving.value = true
  saveError.value = null
  try {
    await contractAllocService.save(row.shipmentId, row.shipSkuId, body)
    closeEdit()
    await reload()
    emit('changed')
  } catch (e: unknown) {
    // 백엔드 400 메시지를 그대로 보여준다 (검증 실패 사유)
    saveError.value = e instanceof Error && e.message ? e.message : '계약 품목 지정에 실패했습니다.'
  } finally {
    saving.value = false
  }
}

// ===== 지정 해제 (확인 모달) =====
const removeTarget = ref<ContractAllocShipmentItem | null>(null)

function askRemove (row: ContractAllocShipmentItem) {
  saveError.value = null
  removeTarget.value = row
}

function cancelRemove () {
  if (saving.value) { return }
  removeTarget.value = null
  saveError.value = null
}

async function confirmRemove () {
  const row = removeTarget.value
  if (!row || saving.value) { return }
  saving.value = true
  saveError.value = null
  try {
    await contractAllocService.remove(row.shipmentId, row.shipSkuId)
    removeTarget.value = null
    closeEdit()
    await reload()
    emit('changed')
  } catch (e: unknown) {
    saveError.value = e instanceof Error && e.message ? e.message : '계약 품목 지정 해제에 실패했습니다.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ca-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  scroll-margin-top: 80px;
}
.ca-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.ca-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}
.ca-count {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 700;
}
.ca-count.bad { background: #fee2e2; color: #b91c1c; }
.ca-count.ok { background: #dcfce7; color: #166534; }
.ca-loading { color: #6b7280; font-size: 0.85rem; }

.ca-line {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  background: #f9fafb;
  color: #374151;
  font-size: 0.86rem;
  line-height: 1.5;
}
.ca-line i { margin-top: 0.2rem; }
.ca-line-ok { background: #f0fdf4; color: #166534; }
.ca-line-warn { background: #fffbeb; color: #92400e; }
.ca-line-error { background: #fef2f2; color: #b91c1c; align-items: center; flex-wrap: wrap; }
.ca-ok-icon { color: #16a34a; }
.ca-pre { white-space: pre-line; }

/* ===== 목록: 넓은 화면 = 표, 좁은 화면 = 카드 ===== */
.ca-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.ca-row {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 1.8fr 0.6fr 0.8fr 2fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.86rem;
}
.ca-row-head {
  background: #f3f4f6;
  color: #4b5563;
  font-weight: 600;
  font-size: 0.8rem;
}
.ca-item { border-top: 1px solid #e5e7eb; }
.ca-item.editing { background: #f8fafc; }
.num { text-align: right; }
.cell-sku { font-weight: 600; color: #1f2937; word-break: break-all; }
.cell-actions { display: flex; justify-content: flex-end; }
.ca-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-right: 0.35rem;
}
.ca-badge.ok { background: #dcfce7; color: #166534; }
.ca-badge.bad { background: #fee2e2; color: #b91c1c; }
.ca-alloc-summary { color: #4b5563; font-size: 0.8rem; word-break: break-all; }

/* ===== 편집 ===== */
.ca-edit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border-top: 1px dashed #cbd5e1;
}
.ca-edit-body { display: flex; flex-direction: column; gap: 0.6rem; }
.ca-hint { margin: 0; color: #4b5563; font-size: 0.84rem; }
.ca-type-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.ca-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0.4rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}
.ca-type small { color: #6b7280; font-size: 0.75rem; }
.ca-type.active { border-color: #2563eb; background: #eff6ff; color: #1e40af; box-shadow: 0 0 0 1px #2563eb inset; }
.ca-choices { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ca-choice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 44px;
  padding: 0.4rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
}
.ca-choice small { color: #6b7280; font-size: 0.75rem; }
.ca-choice.active { border-color: #2563eb; background: #eff6ff; }
.ca-result { font-size: 0.86rem; color: #1e40af; }
.ca-layers { display: flex; flex-direction: column; gap: 0.5rem; }
.ca-layer {
  display: grid;
  grid-template-columns: 1.6fr auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}
.ca-layer-name { display: flex; flex-direction: column; }
.ca-layer-name small { color: #6b7280; font-size: 0.75rem; }
.ca-layer-ctrl { display: flex; align-items: center; gap: 0.4rem; }
.ca-ctrl-label { font-size: 0.78rem; color: #6b7280; white-space: nowrap; }
.ca-stepper { display: flex; align-items: center; gap: 0.25rem; }
.ca-step {
  width: 44px;
  height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.ca-plies { min-width: 1.6rem; text-align: center; font-weight: 700; }
.ca-input {
  min-height: 44px;
  padding: 0 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}
.ca-qty { width: 100%; max-width: 140px; text-align: right; }
.ca-filter { width: 100%; }
/* 대체 줄: 품목명 | 수량 | 빼기 */
.ca-layer.ca-sub { grid-template-columns: 1.6fr 1fr auto; }
/* 대체 금액 비교 — 참고 톤 (막지 않음) */
.ca-amount-ref {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.6rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 0.85rem;
}
.ca-amount-ref small { color: #475569; font-size: 0.75rem; }
.ca-check {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
}
.ca-check i { margin-top: 0.2rem; }
.ca-check.ok { background: #f0fdf4; color: #166534; }
.ca-check.bad { background: #fef2f2; color: #b91c1c; }
.ca-edit-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.ca-spacer { flex: 1; }

/* ===== 버튼 (터치 44px) ===== */
.ca-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.ca-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ca-btn-primary { background: #2563eb; color: #fff; }
.ca-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.ca-btn-ghost { background: #fff; color: #374151; border-color: #d1d5db; }
.ca-btn-ghost:hover:not(:disabled) { background: #f3f4f6; }
.ca-btn-danger { background: #fff; color: #b91c1c; border-color: #fca5a5; }
.ca-btn-danger:hover:not(:disabled) { background: #fef2f2; }
.ca-remove { padding: 0 0.75rem; }

/* ===== 확인 모달 (기존 확인 모달 패턴) ===== */
.ca-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 16px;
}
.ca-modal {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.ca-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #fecaca;
  background: #fef2f2;
}
.ca-modal-header h3 {
  margin: 0;
  font-size: 17px;
  color: #b91c1c;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ca-modal-close {
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
}
.ca-modal-body { padding: 16px 20px; font-size: 0.9rem; color: #374151; line-height: 1.6; }
.ca-modal-body p { margin: 0 0 0.6rem; }
.ca-warn-text { color: #92400e; }
.ca-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
}

/* ===== 좁은 화면: 표 → 카드, 2단 → 1단 ===== */
@media (max-width: 768px) {
  .ca-panel { padding: 0.75rem; }
  .ca-row-head { display: none; }
  .ca-list { border: none; gap: 0.6rem; overflow: visible; }
  .ca-item { border: 1px solid #e5e7eb; border-radius: 8px; }
  .ca-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.35rem 0.75rem;
    padding: 0.75rem;
  }
  .ca-row .cell::before {
    content: attr(data-label);
    display: block;
    font-size: 0.72rem;
    color: #6b7280;
  }
  .ca-row .num { text-align: left; }
  .ca-row .cell-sku,
  .ca-row .cell[data-label="상태"],
  .ca-row .cell-actions { grid-column: 1 / -1; }
  .cell-actions .ca-btn { width: 100%; }
  .ca-type-tabs { grid-template-columns: repeat(2, 1fr); }
  .ca-layer,
  .ca-layer.ca-sub { grid-template-columns: 1fr; }
  .ca-qty { max-width: none; }
  .ca-choice { width: 100%; }
}
</style>
