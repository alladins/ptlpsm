<template>
  <!--
    OEM 월별 발주기록 (2026-11-02)
    예전 «월별 매출원장»(발주일 기준) 계산을 그대로 보여 주는 조회·엑셀 전용 화면.
    화면은 월별 매출원장과 같은 것을 basis="PO" 로 띄운다 — 청구 버튼·지급 상태·이력은 숨겨진다.
    제조 비용 청구는 «월별 매출원장»(납품 확정 기준)에서 한다.
  -->
  <MonthlyLedgerPage basis="PO" />
</template>

<script setup lang="ts">
import MonthlyLedgerPage from './monthly-ledger.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '월별 발주기록'
})
</script>
