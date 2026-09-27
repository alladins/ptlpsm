<!--
  담당 판정 결과 카드
  - OK 초록 / 건별 지정 필요 주황 / 나머지(판정 실패·권역 미지정·대리점 없음 등) 빨강
  - 도 단위 기관은 청사 소재지로 판정되므로 경고를 붙인다
-->
<template>
  <div class="resolve-card" :class="`tone-${tone}`">
    <div class="card-head">
      <span class="status-badge" :class="tone">{{ result.statusLabel || codeLabel(RESOLVE_STATUS_LABELS, result.status) }}</span>
      <span class="org-name">{{ result.dminsttNm || result.dminsttCd }}</span>
      <span class="text-muted">({{ result.dminsttCd }})</span>
    </div>

    <div v-if="result.provinceLevel" class="province-warning">
      <i class="fas fa-exclamation-triangle" />
      도 단위 기관 — 청사 소재지로 판정되어 실제 현장과 다를 수 있습니다.
    </div>

    <dl class="card-grid">
      <dt>담당 대리점</dt>
      <dd>
        <template v-if="result.agencyId">
          <NuxtLink :to="`/admin/agency/edit/${result.agencyId}`" class="link">
            {{ result.agencyName }}
          </NuxtLink>
          <span class="text-muted">({{ result.agencyCode }})</span>
        </template>
        <span v-else class="text-muted">없음</span>
      </dd>

      <dt>권역</dt>
      <dd>{{ result.regionPath || result.regionName || '-' }}</dd>

      <dt>시군구</dt>
      <dd>{{ result.sigunguNm || '-' }}</dd>

      <dt>기관 구분 / 채널</dt>
      <dd>
        {{ codeLabel(ORG_CATEGORY_LABELS, result.orgCategory) }} / {{ codeLabel(AGENCY_CHANNEL_LABELS, result.channel) }}
      </dd>

      <dt>판정 방식</dt>
      <dd>
        {{ codeLabel(RESOLVE_MODE_LABELS, result.resolveMode) }}
        <span v-if="result.source" class="text-muted">· {{ codeLabel(ATTR_SOURCE_LABELS, result.source) }}</span>
      </dd>

      <dt>기준일</dt>
      <dd>{{ result.baseDate || '-' }}</dd>

      <dt>근거 / 사유</dt>
      <dd class="note">
        {{ result.note || '-' }}
      </dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AGENCY_CHANNEL_LABELS,
  ATTR_SOURCE_LABELS,
  ORG_CATEGORY_LABELS,
  RESOLVE_MODE_LABELS,
  RESOLVE_STATUS_LABELS,
  codeLabel,
  resolveStatusBadge,
  type AgencyResolveResult
} from '~/types/agency'

const props = defineProps<{ result: AgencyResolveResult }>()

const tone = computed(() => resolveStatusBadge(props.result.status))
</script>

<style scoped>
.resolve-card {
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
  border-radius: 10px;
  padding: 1rem;
  background: #fff;
}

.resolve-card.tone-success {
  border-left-color: #10b981;
}

.resolve-card.tone-warning {
  border-left-color: #f59e0b;
}

.resolve-card.tone-danger {
  border-left-color: #ef4444;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.org-name {
  font-weight: 700;
  color: #0f172a;
}

.province-warning {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.8125rem;
}

.card-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.375rem 0.75rem;
  margin: 0;
  font-size: 0.875rem;
}

.card-grid dt {
  color: #64748b;
  font-weight: 600;
}

.card-grid dd {
  margin: 0;
  color: #1e293b;
}

.note {
  white-space: pre-wrap;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
