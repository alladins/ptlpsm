<template>
  <!--
    원가 내역 — 한 출고가 어느 발주에서 몇 ㎡ 를 얼마에 빼는가 (먼저 들어온 순)

    ★ 대전제 10번: 합계 금액은 줄별 금액의 합이고, 평균 원가는 합계 ÷ 수량으로 역산한 값이다.
      평균 원가 × 수량으로 금액을 다시 만들지 않는다 (반올림 오차).
  -->
  <div class="lot-breakdown">
    <table>
      <thead>
        <tr>
          <th>순서</th>
          <th>들어온 곳</th>
          <th>생산자</th>
          <th>입고일</th>
          <th class="num">
            수량
          </th>
          <th class="num">
            원가(원/㎡)
          </th>
          <th class="num">
            금액
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in pieces" :key="i" :class="{ unknown: p.costUnknown }">
          <td>{{ i + 1 }}</td>
          <td>{{ lotOriginLabel(p) }}</td>
          <td>{{ p.producerCompanyName || '-' }}</td>
          <td>{{ p.inboundDate || '-' }}</td>
          <td class="num">
            {{ p.quantity.toLocaleString() }}㎡
          </td>
          <td class="num">
            {{ (p.unitCost ?? 0).toLocaleString() }}
            <span v-if="p.costUnknown" class="flag">원가 없음</span>
          </td>
          <td class="num">
            {{ (p.amount ?? 0).toLocaleString() }}
          </td>
        </tr>
      </tbody>
      <tfoot v-if="pieces.length > 1">
        <tr>
          <td colspan="4">
            합계 (평균 원가 = 금액 ÷ 수량)
          </td>
          <td class="num">
            {{ totalQuantity.toLocaleString() }}㎡
          </td>
          <td class="num">
            {{ averageCost.toLocaleString() }}
          </td>
          <td class="num">
            {{ totalAmount.toLocaleString() }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { lotOriginLabel, type LotPiece } from '~/types/inventory-lot'

const props = defineProps<{ pieces: LotPiece[] }>()

const totalQuantity = computed(() => props.pieces.reduce((s, p) => s + p.quantity, 0))
// 금액 먼저 합산
const totalAmount = computed(() => props.pieces.reduce((s, p) => s + (p.amount ?? 0), 0))
// 단가는 역산 (서버와 같이 소수 둘째 자리 반올림)
const averageCost = computed(() =>
  totalQuantity.value ? Math.round((totalAmount.value / totalQuantity.value) * 100) / 100 : 0
)
</script>

<style scoped>
.lot-breakdown { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
th, td { padding: 0.3rem 0.5rem; border-bottom: 1px solid #e5e7eb; text-align: left; white-space: nowrap; }
th { background: #f9fafb; color: #6b7280; font-weight: 600; }
.num { text-align: right; }
tfoot td { font-weight: 600; background: #f9fafb; }
tr.unknown td { background: #fef2f2; color: #b91c1c; }
.flag {
  margin-left: 0.25rem;
  padding: 0 0.3rem;
  border-radius: 3px;
  background: #dc2626;
  color: #fff;
  font-size: 0.6875rem;
}
</style>
