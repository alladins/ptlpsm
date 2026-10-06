<!--
  권역 트리 (왼쪽 패널) — 설계사무소관리·공모·낙찰 수집이 같이 쓴다
  - 전체 / 최상위 권역(하위 합계) / 하위 권역 / 권역 미배정 / 미판정
  - 대리점 직원의 담당 권역에는 «내 권역» 표지
  - 선택은 v-model(RegionTreeSelection) — 바뀌면 부모가 목록을 다시 조회한다
  - 좁은 폭(≤900px)에서는 목록 위에 놓이므로 sticky 를 풀어 화면을 가리지 않게 한다
-->
<template>
  <aside class="tree-panel">
    <div class="tree-head">
      <i class="fas fa-sitemap" /> 권역
    </div>
    <button type="button" class="tree-node" :class="{ active: isSelected({ kind: 'all' }) }" @click="select({ kind: 'all' })">
      <span>전체</span><span class="cnt">{{ tree?.total ?? '-' }}</span>
    </button>
    <template v-for="top in treeNodes" :key="top.regionId">
      <button
        type="button"
        class="tree-node"
        :class="{ active: isSelected({ kind: 'region', regionId: top.regionId }), mine: myRegionSet.has(top.regionId) }"
        @click="select({ kind: 'region', regionId: top.regionId })"
      >
        <span><i class="fas" :class="top.children.length ? 'fa-folder' : 'fa-map-marker-alt'" /> {{ top.regionName }}
          <span v-if="myRegionSet.has(top.regionId)" class="mine-badge">내 권역</span></span>
        <span class="cnt">{{ top.total }}</span>
      </button>
      <button
        v-for="c in top.children"
        :key="c.regionId"
        type="button"
        class="tree-node child"
        :class="{ active: isSelected({ kind: 'region', regionId: c.regionId }), mine: myRegionSet.has(c.regionId) }"
        @click="select({ kind: 'region', regionId: c.regionId })"
      >
        <span><i class="fas fa-map-marker-alt" /> {{ c.regionName }}
          <span v-if="myRegionSet.has(c.regionId)" class="mine-badge">내 권역</span></span>
        <span class="cnt">{{ c.count }}</span>
      </button>
    </template>
    <div class="tree-sep" />
    <button
      type="button"
      class="tree-node"
      :class="{ active: isSelected({ kind: 'unassigned' }) }"
      :title="unassignedTitle"
      @click="select({ kind: 'unassigned' })"
    >
      <span><i class="fas fa-question-circle" /> {{ unassignedLabel }}</span><span class="cnt">{{ tree?.unassigned ?? '-' }}</span>
    </button>
    <button
      type="button"
      class="tree-node"
      :class="{ active: isSelected({ kind: 'unresolved' }) }"
      :title="unresolvedTitle"
      @click="select({ kind: 'unresolved' })"
    >
      <span><i class="fas fa-exclamation-circle" /> {{ unresolvedLabel }}</span><span class="cnt">{{ tree?.unresolved ?? '-' }}</span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RegionTreeData, RegionTreeSelection } from '~/types/agency'

interface Props {
  /** 권역별 수 (null 이면 아직 못 받음 — 숫자 자리에 '-') */
  tree: RegionTreeData | null
  modelValue: RegionTreeSelection
  unassignedLabel?: string
  unassignedTitle?: string
  unresolvedLabel?: string
  unresolvedTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  unassignedLabel: '권역 미배정',
  unassignedTitle: '시군구는 있으나 어느 권역에도 속하지 않은 곳 (광역시·세종·제주 등)',
  unresolvedLabel: '시군구 미판정',
  unresolvedTitle: '소재 시군구를 정하지 못한 곳'
})

const emit = defineEmits<{ 'update:modelValue': [value: RegionTreeSelection] }>()

const myRegionSet = computed(() => new Set(props.tree?.myRegionIds || []))

/** 최상위 권역 + 하위 권역 (상위 합계 = 자기 + 하위) */
const treeNodes = computed(() => {
  const rows = props.tree?.regions || []
  return rows
    .filter(r => r.parentRegionId === null)
    .map((top) => {
      const children = rows.filter(r => r.parentRegionId === top.regionId)
      return { ...top, children, total: top.count + children.reduce((s, c) => s + c.count, 0) }
    })
})

const isSelected = (s: RegionTreeSelection) =>
  s.kind === props.modelValue.kind &&
  (s.kind !== 'region' || (props.modelValue.kind === 'region' && props.modelValue.regionId === s.regionId))

const select = (s: RegionTreeSelection) => {
  emit('update:modelValue', s)
}
</script>

<style scoped>
.tree-panel {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  position: sticky;
  top: 1rem;
}

@media (max-width: 900px) {
  .tree-panel {
    position: static;
  }
}

.tree-head {
  padding: 0.375rem 0.5rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4375rem 0.625rem;
  border: none;
  border-left: 3px solid transparent;
  border-radius: 6px;
  background: none;
  font-size: 0.8125rem;
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.tree-node.child {
  padding-left: 1.5rem;
}

.tree-node:hover {
  background: #f8fafc;
}

.tree-node.active {
  background: #eff6ff;
  border-left-color: #2563eb;
  color: #1d4ed8;
  font-weight: 600;
}

.tree-node .fas {
  margin-right: 0.25rem;
  color: #94a3b8;
}

.tree-node .cnt {
  font-size: 0.75rem;
  color: #64748b;
}

.mine-badge {
  margin-left: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.6875rem;
  font-weight: 600;
}

.tree-sep {
  height: 1px;
  margin: 0.375rem 0;
  background: #e2e8f0;
}
</style>
