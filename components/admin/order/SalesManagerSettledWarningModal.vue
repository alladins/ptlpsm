<!--
  영업 담당자 변경 — 커미션 정산 내역 경고 (2026-09-30, «막지 말고 경고만»)

  - 서버가 409 + needsConfirm 으로 돌려준 경고(정산 있는 납품요구번호·건수·지급 상태)를 보여 준다
  - [계속 변경] → 부모가 confirmSettled=true 로 다시 저장, [취소] → 아무것도 바뀌지 않음
  - 공통 모달 스타일(ccm-*, admin-modals.css) 사용 — 좁은 화면에서는 아래에서 올라오는 시트로 보인다

  사용 예)
    <SalesManagerSettledWarningModal
      :warning="settledWarning"
      :target-label="'홍길동 (○○대리점)'"
      :busy="salesSaving"
      @confirm="proceed"
      @cancel="settledWarning = null"
    />
-->
<template>
  <Teleport to="body">
    <div
      v-if="warning"
      class="ccm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sm-settled-title"
      @click.self="onCancel"
    >
      <div class="ccm-modal-container ccm-modal-medium">
        <div class="ccm-modal-header">
          <div class="ccm-header-content">
            <div class="ccm-header-icon ccm-icon-orange">
              <i class="fas fa-exclamation-triangle" />
            </div>
            <div class="ccm-header-text">
              <h3 id="sm-settled-title" class="ccm-modal-title">
                커미션 정산 내역이 있습니다
              </h3>
              <span class="ccm-modal-subtitle">영업 담당자 변경 전 확인</span>
            </div>
          </div>
          <button type="button" class="ccm-close-button" :disabled="busy" aria-label="닫기" @click="onCancel">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="ccm-modal-body">
          <p class="sw-lead">
            <b>{{ headline }}</b> 이미 커미션 정산 내역이 있습니다.
            담당자를 바꿔도 <b>기존 정산은 그대로 남고</b>, 이후 정산부터 새 담당자로 계산됩니다. 계속할까요?
          </p>

          <dl class="sw-facts">
            <div>
              <dt>바꿀 담당자</dt>
              <dd>{{ targetLabel || '미지정 (지정 해제)' }}</dd>
            </div>
            <div>
              <dt>정산 내역</dt>
              <dd>
                {{ warning.settlementCount ?? 0 }}건
                <span class="sw-sub">
                  (지급 완료 {{ warning.paidSettlementCount ?? 0 }} · 미지급 {{ warning.unpaidSettlementCount ?? 0 }})
                </span>
              </dd>
            </div>
          </dl>

          <div class="sw-nos">
            <div class="sw-nos-title">
              정산 내역이 있는 납품요구 {{ settledNos.length }}건
            </div>
            <ul>
              <li v-for="no in settledNos" :key="no">
                {{ no }}
              </li>
            </ul>
          </div>

          <p class="sw-note">
            <i class="fas fa-info-circle" />
            같은 계약 묶음이 옛·새 담당자로 나뉘어 정산되고, 대리점 연 누계 매출로 정하는 요율 구간이 달라질 수 있습니다.
          </p>
        </div>

        <div class="ccm-modal-footer">
          <button type="button" class="ccm-btn-cancel" :disabled="busy" @click="onCancel">
            취소
          </button>
          <button type="button" class="ccm-btn-confirm ccm-orange" :disabled="busy" @click="emit('confirm')">
            <i class="fas" :class="busy ? 'fa-spinner fa-spin' : 'fa-check'" />
            {{ busy ? '저장 중...' : '계속 변경' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderSalesManagerUpdateResponse } from '~/types/order'

interface Props {
  /** 서버 경고 응답 (needsConfirm=true). null 이면 닫힘 */
  warning: OrderSalesManagerUpdateResponse | null
  /** 새 담당자 표시 문구 — null 이면 «지정 해제» */
  targetLabel?: string | null
  busy?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  targetLabel: null,
  busy: false
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const settledNos = computed(() => props.warning?.settledDeliveryRequestNos ?? [])

// «R26TB… 등 N건은» / «R26TB… 은(는)»
const headline = computed(() => {
  const nos = settledNos.value
  if (nos.length === 0) { return '선택한 발주 중 일부는' }
  return nos.length > 1 ? `${nos[0]} 등 ${nos.length}건은` : `${nos[0]}은(는)`
})

const onCancel = () => {
  if (props.busy) { return }
  emit('cancel')
}
</script>

<style scoped>
.sw-lead {
  margin: 0 0 1rem;
  line-height: 1.6;
  color: #1e293b;
  word-break: keep-all;
}
.sw-facts {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  display: grid;
  gap: 0.5rem;
}
.sw-facts > div { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.sw-facts dt { min-width: 5.5rem; font-weight: 600; color: #92400e; }
.sw-facts dd { margin: 0; color: #1e293b; }
.sw-sub { color: #64748b; font-size: 0.875rem; }
.sw-nos-title { font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.375rem; }
.sw-nos ul {
  margin: 0;
  padding: 0.5rem 0.75rem;
  list-style: none;
  max-height: 9.5rem;
  overflow-y: auto;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875rem;
  line-height: 1.7;
}
.sw-note {
  margin: 0.875rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.5;
}
.sw-note i { margin-right: 0.25rem; }
/* 터치 대상 44px 이상 (sales-screens-mobile-first) */
.ccm-modal-footer button { min-height: 44px; }
.ccm-close-button { min-width: 44px; min-height: 44px; }
</style>
