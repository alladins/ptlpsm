<template>
  <div class="sales-region-page">
    <PageHeader
      title="권역관리"
      description="영업 권역을 만들고 각 말단 권역에 시군구를 넣고 뺍니다. 대리점 담당은 말단 권역에 지정됩니다."
      :view-only="isViewOnly"
    >
      <template #actions>
        <button
          class="unassigned-badge"
          :class="{ active: rightMode === 'unassigned' }"
          title="미배정 시군구 보기"
          @click="showUnassigned"
        >
          <i class="fas fa-exclamation-circle" />
          미배정 시군구 {{ unassignedSigungu.length }}곳
        </button>
        <button class="btn-action btn-secondary" :disabled="loading" @click="reloadAll">
          <i class="fas fa-sync-alt" /> 새로고침
        </button>
        <button v-if="canWrite" class="btn-action btn-primary" @click="openCreateModal(null)">
          <i class="fas fa-plus" /> 권역 추가
        </button>
      </template>
    </PageHeader>

    <!-- 분할 절차 안내 -->
    <div class="help-box">
      <div class="help-title">
        <i class="fas fa-lightbulb" /> 권역을 나누는 순서
      </div>
      <ol>
        <li>나눌 권역의 시군구를 다른 권역(또는 미배정)으로 옮기고, 그 권역의 담당 대리점에 종료일을 넣습니다.</li>
        <li>비워진 권역을 선택해 «하위 권역 추가»로 하위 권역을 만듭니다. (시군구·담당이 남아 있으면 만들 수 없습니다)</li>
        <li>하위 권역에 시군구를 넣고, 대리점관리에서 하위 권역에 담당 대리점을 지정합니다.</li>
      </ol>
      <p class="help-note">
        합치기는 시군구를 한 권역으로 옮긴 뒤 빈 권역을 폐지합니다. 시군구를 옮기면 그 지역의 담당 대리점 판정이 <strong>즉시</strong> 바뀝니다.
      </p>
    </div>

    <div class="region-layout">
      <!-- 좌: 권역 트리 -->
      <div class="panel tree-panel">
        <div class="panel-head">
          <span><i class="fas fa-sitemap" /> 권역</span>
          <label class="toggle-retired">
            <input v-model="showRetired" type="checkbox"> 폐지 권역 표시
          </label>
        </div>

        <div v-if="loading && regions.length === 0" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>권역을 불러오는 중...</p>
        </div>
        <div v-else-if="treeRows.length === 0" class="no-data-message">
          <i class="fas fa-map" />
          <p>등록된 권역이 없습니다.</p>
        </div>
        <ul v-else class="region-tree">
          <li
            v-for="row in treeRows"
            :key="row.region.regionId"
            class="tree-node"
            :class="{
              selected: row.region.regionId === selectedRegionId,
              retired: row.region.useYn === 'N'
            }"
            :style="{ paddingLeft: `${0.75 + row.depth * 1.25}rem` }"
            @click="selectRegion(row.region.regionId)"
          >
            <div class="node-main">
              <i :class="row.region.childCount > 0 ? 'fas fa-folder-open' : 'fas fa-map-pin'" />
              <span class="node-name">{{ row.region.regionName }}</span>
              <span class="node-code">{{ row.region.regionCode }}</span>
              <span v-if="row.region.useYn === 'N'" class="tag tag-retired">폐지</span>
              <span v-else-if="row.region.childCount > 0" class="tag tag-parent">상위</span>
            </div>
            <div class="node-sub">
              <span v-if="row.region.childCount === 0">시군구 {{ row.region.sigunguCount }}곳</span>
              <span v-else>하위 {{ row.region.childCount }}개 · 시군구 {{ descendantSigunguCount(row.region.regionId) }}곳</span>
              <span v-if="row.region.activeAgencyNames" class="node-agency">
                <i class="fas fa-handshake" /> {{ row.region.activeAgencyNames }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <!-- 우: 상세 -->
      <div class="panel detail-panel">
        <!-- 미배정 시군구 -->
        <template v-if="rightMode === 'unassigned'">
          <div class="panel-head">
            <span><i class="fas fa-exclamation-circle" /> 미배정 시군구 {{ unassignedSigungu.length }}곳</span>
          </div>
          <p class="panel-desc">
            어느 권역에도 속하지 않은 시군구입니다. 이 지역 수요기관은 «권역 미지정»으로 판정됩니다.
            넣으려면 왼쪽에서 말단 권역을 선택한 뒤 해당 시도에서 체크하세요.
          </p>
          <div v-if="unassignedSigungu.length === 0" class="no-data-message">
            <i class="fas fa-check-circle" />
            <p>미배정 시군구가 없습니다.</p>
          </div>
          <div v-else class="unassigned-groups">
            <div v-for="g in unassignedBySido" :key="g.sidoCd" class="unassigned-group">
              <div class="group-title">
                {{ g.sidoNm }} <span class="text-muted">{{ g.items.length }}곳</span>
              </div>
              <div class="chip-list">
                <span v-for="s in g.items" :key="s.sigunguCd" class="chip">{{ shortSigunguName(s) }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 선택 없음 -->
        <div v-else-if="!selectedRegion" class="no-data-message">
          <i class="fas fa-hand-pointer" />
          <p>왼쪽에서 권역을 선택하세요.</p>
        </div>

        <!-- 권역 선택됨 -->
        <template v-else>
          <div class="panel-head">
            <span>
              <i class="fas fa-map-marked-alt" />
              <template v-if="selectedRegion.parentRegionName">{{ selectedRegion.parentRegionName }} &gt; </template>
              {{ selectedRegion.regionName }}
              <span class="node-code">{{ selectedRegion.regionCode }}</span>
              <span v-if="selectedRegion.useYn === 'N'" class="tag tag-retired">폐지</span>
            </span>
            <div class="head-actions">
              <GuardedButton
                v-if="canWrite"
                class="btn-action btn-secondary"
                :blocked="!!addChildBlockReason"
                :reason="addChildBlockReason"
                @click="openCreateModal(selectedRegion)"
              >
                <i class="fas fa-level-down-alt" /> 하위 권역 추가
              </GuardedButton>
              <button v-if="canEdit" class="btn-action btn-secondary" @click="openEditModal(selectedRegion)">
                <i class="fas fa-edit" /> 수정
              </button>
              <GuardedButton
                v-if="selectedRegion.useYn === 'Y' && canDelete"
                class="btn-action btn-delete"
                :blocked="!!retireBlockReason"
                :reason="retireBlockReason"
                :disabled="saving"
                @click="retireRegion(selectedRegion)"
              >
                <i class="fas fa-ban" /> 폐지
              </GuardedButton>
              <button
                v-else-if="selectedRegion.useYn !== 'Y' && canEdit"
                class="btn-action btn-secondary"
                :disabled="saving"
                @click="restoreRegion(selectedRegion)"
              >
                <i class="fas fa-undo" /> 복원
              </button>
            </div>
          </div>

          <div class="region-meta">
            <span>지역번호 {{ selectedRegion.areaPhoneCode || '-' }}</span>
            <span>정렬 {{ selectedRegion.sortOrder ?? '-' }}</span>
            <span>현재 담당: {{ selectedRegion.activeAgencyNames || '없음' }}</span>
            <span v-if="selectedRegion.remarks">비고: {{ selectedRegion.remarks }}</span>
          </div>

          <!-- 상위 권역: 하위 요약 -->
          <div v-if="selectedRegion.childCount > 0" class="parent-summary">
            <p class="panel-desc">
              <i class="fas fa-info-circle" />
              상위 권역은 묶음·통계용입니다. 시군구와 담당 대리점은 <strong>하위(말단) 권역</strong>에 넣으세요.
            </p>
            <table class="data-table">
              <thead>
                <tr>
                  <th>하위 권역</th>
                  <th>코드</th>
                  <th>시군구</th>
                  <th>현재 담당</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in childrenOf(selectedRegion.regionId)" :key="c.regionId" class="clickable-row" @click="selectRegion(c.regionId)">
                  <td class="text-left">
                    {{ c.regionName }} <span v-if="c.useYn === 'N'" class="tag tag-retired">폐지</span>
                  </td>
                  <td>{{ c.regionCode }}</td>
                  <td>{{ c.childCount > 0 ? descendantSigunguCount(c.regionId) : c.sigunguCount }}곳</td>
                  <td class="text-left">
                    {{ c.activeAgencyNames || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 말단 권역: 시군구 체크 목록 -->
          <div v-else-if="selectedRegion.useYn === 'Y'" class="sigungu-editor">
            <div class="sido-tabs">
              <button
                v-for="s in SIDO_LIST"
                :key="s.sidoCd"
                type="button"
                class="sido-tab"
                :class="{ active: s.sidoCd === selectedSidoCd }"
                @click="selectedSidoCd = s.sidoCd"
              >
                {{ s.sidoNm }}
                <span v-if="draftCountBySido(s.sidoCd) > 0" class="sido-count">{{ draftCountBySido(s.sidoCd) }}</span>
              </button>
            </div>

            <div class="sigungu-toolbar">
              <span class="text-muted">
                체크 = 이 권역 소속. 다른 권역 소속을 체크하면 저장할 때 이 권역으로 <strong>옮겨집니다</strong>.
              </span>
              <div v-if="canEdit" class="toolbar-actions">
                <button type="button" class="btn-action btn-secondary" @click="checkAllUnassignedInSido">
                  이 시도 미배정 모두 체크
                </button>
              </div>
            </div>

            <div class="sigungu-grid">
              <label
                v-for="s in sigunguInSelectedSido"
                :key="s.sigunguCd"
                class="sigungu-item"
                :class="{
                  checked: !!draft[s.sigunguCd],
                  changed: isChanged(s),
                  other: !!s.regionId && s.regionId !== selectedRegion.regionId
                }"
              >
                <input
                  type="checkbox"
                  :checked="!!draft[s.sigunguCd]"
                  :disabled="!canEdit"
                  @change="onToggle(s, $event)"
                >
                <span class="sg-name">{{ shortSigunguName(s) }}</span>
                <span v-if="s.regionId && s.regionId !== selectedRegion.regionId" class="sg-region">{{ s.regionName }}</span>
                <span v-else-if="!s.regionId" class="sg-region unassigned">미배정</span>
              </label>
            </div>

            <div class="save-bar">
              <span class="change-summary">
                <template v-if="diff.add.length || diff.remove.length">
                  추가 {{ diff.add.length }}곳<template v-if="movingCount > 0">(다른 권역에서 이동 {{ movingCount }}곳)</template>
                  · 제외 {{ diff.remove.length }}곳
                </template>
                <template v-else>
                  바뀐 내용 없음 · 현재 시군구 {{ selectedRegion.sigunguCount }}곳
                </template>
              </span>
              <button
                v-if="canEdit"
                type="button"
                class="btn-action btn-secondary"
                :disabled="!hasChanges || saving"
                @click="resetDraft"
              >
                되돌리기
              </button>
              <GuardedButton
                v-if="canEdit"
                class="btn-action btn-primary"
                :blocked="!hasChanges"
                reason="바뀐 시군구가 없습니다. 체크를 바꾼 뒤 저장하세요."
                :disabled="saving"
                @click="saveSigungu"
              >
                <i v-if="saving" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-save" />
                시군구 저장
              </GuardedButton>
            </div>
          </div>

          <div v-else class="no-data-message">
            <i class="fas fa-ban" />
            <p>폐지된 권역입니다. 시군구를 넣으려면 먼저 «복원»하세요.</p>
          </div>

          <!-- 담당 이력 -->
          <div class="history-section">
            <div class="section-title">
              <i class="fas fa-history" /> 담당 이력
            </div>
            <div v-if="loadingTerritories" class="loading-message">
              <i class="fas fa-spinner fa-spin" />
            </div>
            <div v-else-if="regionTerritories.length === 0" class="text-muted empty-line">
              이 권역에 지정된 대리점 담당 이력이 없습니다.
            </div>
            <table v-else class="data-table">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>대리점</th>
                  <th>채널</th>
                  <th>담당 기간</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in regionTerritories" :key="t.territoryId">
                  <td>
                    <span class="status-badge" :class="t.current ? 'success' : (t.validFrom > today ? 'info' : 'muted')">
                      {{ t.current ? '담당중' : (t.validFrom > today ? '예정' : '종료') }}
                    </span>
                  </td>
                  <td class="text-left">
                    <NuxtLink :to="`/admin/agency/edit/${t.agencyId}`" class="link">
                      {{ t.agencyName }}
                    </NuxtLink>
                    <span class="text-muted">({{ t.agencyCode }})</span>
                  </td>
                  <td>{{ codeLabel(AGENCY_CHANNEL_LABELS, t.channel) }}</td>
                  <td>{{ t.validFrom }} ~ {{ t.validTo || '현재' }}</td>
                  <td class="text-left">
                    {{ t.remarks || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>

    <!-- 권역 등록/수정 모달 -->
    <Teleport to="body">
      <div v-if="showRegionModal" class="modal-overlay" @click.self="showRegionModal = false">
        <div class="modal-content region-modal">
          <div class="modal-header">
            <h3>{{ regionModalTitle }}</h3>
            <button type="button" class="modal-close" @click="showRegionModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="required">권역 코드</label>
              <input
                v-model="regionForm.regionCode"
                type="text"
                class="form-input full"
                placeholder="예: R-02N, R-031S"
                :readonly="editingRegionId !== null"
              >
              <span class="field-hint">{{ editingRegionId !== null ? '권역 코드는 바꿀 수 없습니다.' : '등록 후 바꿀 수 없습니다. 대리점 코드 제안에 쓰입니다.' }}</span>
            </div>
            <div class="form-group">
              <label class="required">권역명</label>
              <input v-model="regionForm.regionName" type="text" class="form-input full" placeholder="예: 경기북부">
            </div>
            <div class="form-group">
              <label>상위 권역</label>
              <select v-model="regionForm.parentRegionId" class="form-select full">
                <option :value="null">
                  (없음 — 최상위)
                </option>
                <option v-for="r in parentCandidates" :key="r.regionId" :value="r.regionId">
                  {{ r.parentRegionName ? r.parentRegionName + ' > ' : '' }}{{ r.regionName }} ({{ r.regionCode }})
                </option>
              </select>
              <span class="field-hint">시군구·담당 대리점이 남아 있는 권역은 상위 권역이 될 수 없습니다.</span>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>지역번호</label>
                <input v-model="regionForm.areaPhoneCode" type="text" class="form-input full" maxlength="4" placeholder="예: 031">
              </div>
              <div class="form-group">
                <label>정렬순서</label>
                <input v-model.number="regionForm.sortOrder" type="number" class="form-input full" min="0">
              </div>
            </div>
            <div class="form-group">
              <label>비고</label>
              <input v-model="regionForm.remarks" type="text" class="form-input full">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showRegionModal = false">
              취소
            </button>
            <GuardedButton
              class="btn-primary"
              :blocked="!regionForm.regionCode.trim() || !regionForm.regionName.trim()"
              reason="권역 코드와 권역명을 입력하세요."
              :disabled="saving"
              @click="submitRegion"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              {{ editingRegionId !== null ? '저장' : '등록' }}
            </GuardedButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 권역관리
 * - 좌: 권역 트리 (상위 → 하위, 깊이 제한 없음)
 * - 우: 말단 권역의 시군구를 시도별 체크 목록으로 넣고 빼기 (저장 시 바뀐 것만 {add, remove})
 * - 폐지·하위 추가는 조건이 안 맞으면 GuardedButton 으로 이유를 알려준다
 */
import { ref, computed, watch, onMounted } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { salesRegionService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import { usePermission } from '~/composables/usePermission'
import {
  AGENCY_CHANNEL_LABELS,
  SIDO_LIST,
  codeLabel,
  todayKst,
  type SalesRegion,
  type Sigungu,
  type Territory
} from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '권역관리'
})

// 메뉴권한(SALES_REGION) — 추가=등록, 수정·복원·시군구 편집=수정, 폐지=삭제
const { canWrite, canEdit, canDelete, isViewOnly } = usePermission('SALES_REGION')

const regions = ref<SalesRegion[]>([])
const allSigungu = ref<Sigungu[]>([])
const loading = ref(false)
const saving = ref(false)
const showRetired = ref(true)
const today = todayKst()

/** 우측 표시 모드: 선택한 권역 / 미배정 시군구 목록 */
const rightMode = ref<'region' | 'unassigned'>('region')
const selectedRegionId = ref<number | null>(null)
const selectedSidoCd = ref<string>(SIDO_LIST[0].sidoCd)

const selectedRegion = computed(() =>
  regions.value.find(r => r.regionId === selectedRegionId.value) || null)

// ===== 트리 =====
const sortRegions = (list: SalesRegion[]) =>
  [...list].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || a.regionCode.localeCompare(b.regionCode))

const childrenOf = (parentId: number) =>
  sortRegions(regions.value.filter(r => r.parentRegionId === parentId && (showRetired.value || r.useYn === 'Y')))

/** 트리를 깊이와 함께 평탄화 (상위가 목록에 없으면 최상위로 취급) */
const treeRows = computed(() => {
  const ids = new Set(regions.value.map(r => r.regionId))
  const visible = (r: SalesRegion) => showRetired.value || r.useYn === 'Y'
  const rows: { region: SalesRegion, depth: number }[] = []
  const seen = new Set<number>()
  const walk = (r: SalesRegion, depth: number) => {
    if (seen.has(r.regionId)) { return } // 순환 방지
    seen.add(r.regionId)
    rows.push({ region: r, depth })
    childrenOf(r.regionId).forEach(c => walk(c, depth + 1))
  }
  sortRegions(regions.value.filter(r => visible(r) && (r.parentRegionId === null || !ids.has(r.parentRegionId))))
    .forEach(r => walk(r, 0))
  return rows
})

/** 상위 권역의 하위 전체 시군구 수 */
const descendantSigunguCount = (regionId: number): number => {
  let total = 0
  const stack = [regionId]
  const seen = new Set<number>()
  while (stack.length) {
    const id = stack.pop() as number
    if (seen.has(id)) { continue }
    seen.add(id)
    regions.value.forEach((r) => {
      if (r.parentRegionId === id) {
        total += r.sigunguCount || 0
        stack.push(r.regionId)
      }
    })
  }
  return total
}

// ===== 시군구 =====
const unassignedSigungu = computed(() => allSigungu.value.filter(s => !s.regionId))

const unassignedBySido = computed(() =>
  SIDO_LIST
    .map(s => ({ ...s, items: unassignedSigungu.value.filter(x => x.sidoCd === s.sidoCd) }))
    .filter(g => g.items.length > 0))

/** «전라남도 장성군» → «장성군» (시도명이 앞에 붙어 있으면 뗀다) */
const shortSigunguName = (s: Sigungu) => {
  const parts = (s.sigunguNm || '').split(' ')
  return parts.length > 1 ? parts.slice(1).join(' ') : s.sigunguNm
}

const sigunguInSelectedSido = computed(() =>
  allSigungu.value
    .filter(s => s.sidoCd === selectedSidoCd.value)
    .sort((a, b) => a.sigunguCd.localeCompare(b.sigunguCd)))

/** 체크 초안 (sigunguCd → 이 권역 소속 여부) */
const draft = ref<Record<string, boolean>>({})

const isOriginal = (s: Sigungu) => !!selectedRegion.value && s.regionId === selectedRegion.value.regionId

const resetDraft = () => {
  const next: Record<string, boolean> = {}
  allSigungu.value.forEach((s) => { next[s.sigunguCd] = isOriginal(s) })
  draft.value = next
}

const isChanged = (s: Sigungu) => !!draft.value[s.sigunguCd] !== isOriginal(s)

const diff = computed(() => {
  const add: string[] = []
  const remove: string[] = []
  allSigungu.value.forEach((s) => {
    const now = !!draft.value[s.sigunguCd]
    const orig = isOriginal(s)
    if (now && !orig) { add.push(s.sigunguCd) }
    if (!now && orig) { remove.push(s.sigunguCd) }
  })
  return { add, remove }
})

const hasChanges = computed(() => diff.value.add.length > 0 || diff.value.remove.length > 0)

/** 추가 중 다른 권역에서 옮겨 오는 수 */
const movingCount = computed(() =>
  diff.value.add.filter((cd) => {
    const s = allSigungu.value.find(x => x.sigunguCd === cd)
    return !!s?.regionId
  }).length)

const draftCountBySido = (sidoCd: string) =>
  allSigungu.value.filter(s => s.sidoCd === sidoCd && draft.value[s.sigunguCd]).length

const onToggle = (s: Sigungu, e: Event) => {
  const input = e.target as HTMLInputElement
  const checked = input.checked
  // 다른 권역 소속을 체크 → 옮겨진다는 것을 먼저 확인
  if (checked && s.regionId && selectedRegion.value && s.regionId !== selectedRegion.value.regionId) {
    const ok = confirm(
      `«${s.sigunguNm}» 은(는) 지금 «${s.regionName}» 권역 소속입니다.\n` +
      `체크하고 저장하면 «${s.regionName}» 에서 빠지고 «${selectedRegion.value.regionName}» 으로 옮겨집니다.\n\n계속할까요?`)
    if (!ok) {
      input.checked = false
      return
    }
  }
  draft.value[s.sigunguCd] = checked
}

const checkAllUnassignedInSido = () => {
  sigunguInSelectedSido.value.forEach((s) => {
    if (!s.regionId) { draft.value[s.sigunguCd] = true }
  })
}

const saveSigungu = async () => {
  const region = selectedRegion.value
  if (!region || !hasChanges.value) { return }
  const { add, remove } = diff.value
  const msg = [`«${region.regionName}» 권역의 시군구를 저장합니다.`, `추가 ${add.length}곳 · 제외 ${remove.length}곳`]
  if (movingCount.value > 0) { msg.push(`이 중 ${movingCount.value}곳은 다른 권역에서 옮겨 옵니다.`) }
  if (remove.length > 0) { msg.push('제외한 시군구는 미배정이 됩니다.') }
  msg.push('', '저장 즉시 해당 지역의 담당 대리점 판정이 바뀝니다. 계속할까요?')
  if (!confirm(msg.join('\n'))) { return }

  saving.value = true
  try {
    await salesRegionService.updateRegionSigungu(region.regionId, { add, remove })
    await reloadAll()
    alert('시군구가 저장되었습니다.')
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

// ===== 선택 =====
const confirmDiscard = () => !hasChanges.value || confirm('저장하지 않은 시군구 변경이 있습니다. 버리고 이동할까요?')

const selectRegion = (regionId: number) => {
  if (regionId === selectedRegionId.value && rightMode.value === 'region') { return }
  if (!confirmDiscard()) { return }
  rightMode.value = 'region'
  selectedRegionId.value = regionId
}

const showUnassigned = () => {
  if (!confirmDiscard()) { return }
  rightMode.value = 'unassigned'
  selectedRegionId.value = null
}

// 권역을 바꾸면: 초안 초기화 + 시군구가 가장 많은 시도를 기본 탭으로 + 담당 이력 조회
watch(selectedRegionId, (id) => {
  resetDraft()
  if (id !== null) {
    const counts: Record<string, number> = {}
    allSigungu.value.filter(s => s.regionId === id).forEach((s) => { counts[s.sidoCd] = (counts[s.sidoCd] || 0) + 1 })
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (best) { selectedSidoCd.value = best[0] }
    loadRegionTerritories(id)
  } else {
    regionTerritories.value = []
  }
})

// ===== 담당 이력 =====
const regionTerritories = ref<Territory[]>([])
const loadingTerritories = ref(false)

const loadRegionTerritories = async (regionId: number) => {
  loadingTerritories.value = true
  try {
    const list = await salesRegionService.getRegionTerritories(regionId)
    // 담당중 먼저, 그다음 시작일 최신순
    regionTerritories.value = [...list].sort((a, b) =>
      Number(b.current) - Number(a.current) || b.validFrom.localeCompare(a.validFrom))
  } catch (e) {
    console.error('담당 이력 조회 실패:', e)
    regionTerritories.value = []
  } finally {
    loadingTerritories.value = false
  }
}

// ===== 가드 사유 =====
const retireBlockReason = computed(() => {
  const r = selectedRegion.value
  if (!r) { return '' }
  if (r.sigunguCount > 0) {
    return `시군구 ${r.sigunguCount}곳을 다른 권역으로 옮긴 뒤 폐지할 수 있습니다.`
  }
  if (r.childCount > 0) {
    return `하위 권역 ${r.childCount}개를 먼저 폐지하거나 다른 권역 아래로 옮긴 뒤 폐지할 수 있습니다.`
  }
  if (r.activeTerritoryCount > 0) {
    return `담당 대리점(${r.activeAgencyNames || r.activeTerritoryCount + '곳'})에 대리점관리에서 종료일을 넣은 뒤 폐지할 수 있습니다.`
  }
  return ''
})

const addChildBlockReason = computed(() => {
  const r = selectedRegion.value
  if (!r) { return '' }
  if (r.useYn === 'N') {
    return '폐지된 권역 아래에는 만들 수 없습니다. 먼저 «복원»하세요.'
  }
  if (r.sigunguCount > 0 || r.activeTerritoryCount > 0) {
    return `이 권역에 시군구 ${r.sigunguCount}곳·담당 대리점 ${r.activeTerritoryCount}곳이 남아 있습니다. ` +
      '시군구를 다른 권역으로 옮기고 담당에 종료일을 넣은 뒤 하위 권역을 만들 수 있습니다 (위 «권역을 나누는 순서» 참고).'
  }
  return ''
})

// ===== 권역 등록/수정 =====
const showRegionModal = ref(false)
const editingRegionId = ref<number | null>(null)
const regionForm = ref<{
  regionCode: string
  regionName: string
  parentRegionId: number | null
  areaPhoneCode: string
  sortOrder: number | null
  remarks: string
}>({ regionCode: '', regionName: '', parentRegionId: null, areaPhoneCode: '', sortOrder: null, remarks: '' })
const regionModalMode = ref<'create' | 'child' | 'edit'>('create')

const regionModalTitle = computed(() => {
  if (regionModalMode.value === 'edit') { return '권역 수정' }
  if (regionModalMode.value === 'child') { return '하위 권역 추가' }
  return '권역 추가'
})

/** 상위 후보: 사용 중 + 자기 자신·자기 하위 제외 */
const parentCandidates = computed(() => {
  const excluded = new Set<number>()
  if (editingRegionId.value !== null) {
    const stack = [editingRegionId.value]
    while (stack.length) {
      const id = stack.pop() as number
      if (excluded.has(id)) { continue }
      excluded.add(id)
      regions.value.filter(r => r.parentRegionId === id).forEach(r => stack.push(r.regionId))
    }
  }
  return sortRegions(regions.value.filter(r => r.useYn === 'Y' && !excluded.has(r.regionId)))
})

const openCreateModal = (parent: SalesRegion | null) => {
  editingRegionId.value = null
  regionModalMode.value = parent ? 'child' : 'create'
  const siblings = regions.value.filter(r => r.parentRegionId === (parent ? parent.regionId : null))
  const maxSort = siblings.reduce((m, r) => Math.max(m, r.sortOrder ?? 0), 0)
  regionForm.value = {
    regionCode: parent ? `${parent.regionCode}` : 'R-',
    regionName: '',
    parentRegionId: parent ? parent.regionId : null,
    areaPhoneCode: parent?.areaPhoneCode || '',
    sortOrder: maxSort + 1,
    remarks: ''
  }
  showRegionModal.value = true
}

const openEditModal = (r: SalesRegion) => {
  editingRegionId.value = r.regionId
  regionModalMode.value = 'edit'
  regionForm.value = {
    regionCode: r.regionCode,
    regionName: r.regionName,
    parentRegionId: r.parentRegionId,
    areaPhoneCode: r.areaPhoneCode || '',
    sortOrder: r.sortOrder,
    remarks: r.remarks || ''
  }
  showRegionModal.value = true
}

const submitRegion = async () => {
  const f = regionForm.value
  if (!f.regionCode.trim() || !f.regionName.trim()) { return }
  // v-model.number 는 칸을 비우면 '' 가 된다 → null 로 (0 은 그대로 둔다)
  const sortOrder = typeof f.sortOrder === 'number' && Number.isFinite(f.sortOrder) ? f.sortOrder : null
  saving.value = true
  try {
    if (editingRegionId.value !== null) {
      const current = regions.value.find(r => r.regionId === editingRegionId.value)
      await salesRegionService.updateRegion(editingRegionId.value, {
        regionName: f.regionName.trim(),
        parentRegionId: f.parentRegionId,
        areaPhoneCode: f.areaPhoneCode.trim() || null,
        sortOrder,
        useYn: current?.useYn || 'Y',
        remarks: f.remarks.trim() || null
      })
    } else {
      const created = await salesRegionService.createRegion({
        regionCode: f.regionCode.trim(),
        regionName: f.regionName.trim(),
        parentRegionId: f.parentRegionId,
        areaPhoneCode: f.areaPhoneCode.trim() || null,
        sortOrder,
        remarks: f.remarks.trim() || null
      })
      selectedRegionId.value = created.regionId
      rightMode.value = 'region'
    }
    showRegionModal.value = false
    await reloadAll()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

/** 폐지·복원 — 수정 API 가 전체 필드를 덮어쓰므로 기존 값을 모두 채워 보낸다 */
const changeUseYn = async (r: SalesRegion, useYn: 'Y' | 'N') => {
  saving.value = true
  try {
    await salesRegionService.updateRegion(r.regionId, {
      regionName: r.regionName,
      parentRegionId: r.parentRegionId,
      areaPhoneCode: r.areaPhoneCode,
      sortOrder: r.sortOrder,
      useYn,
      remarks: r.remarks
    })
    await reloadAll()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

const retireRegion = (r: SalesRegion) => {
  if (!confirm(`«${r.regionName}» 권역을 폐지합니다. 지난 담당 이력은 그대로 남습니다. 계속할까요?`)) { return }
  changeUseYn(r, 'N')
}

const restoreRegion = (r: SalesRegion) => {
  if (!confirm(`«${r.regionName}» 권역을 다시 사용합니다. 계속할까요?`)) { return }
  changeUseYn(r, 'Y')
}

// ===== 로드 =====
const reloadAll = async () => {
  loading.value = true
  try {
    const [regionList, sigunguList] = await Promise.all([
      salesRegionService.getRegions(),
      salesRegionService.getSigungu()
    ])
    regions.value = regionList
    allSigungu.value = sigunguList
    resetDraft()
    if (selectedRegionId.value !== null) {
      loadRegionTerritories(selectedRegionId.value)
    }
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

onMounted(reloadAll)
</script>

<style scoped>
.help-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.8125rem;
  color: #78350f;
}

.help-title {
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.help-box ol {
  margin: 0.25rem 0 0.25rem 1.25rem;
  padding: 0;
  line-height: 1.7;
}

.help-note {
  margin: 0.25rem 0 0;
  color: #92400e;
}

.unassigned-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 999px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.unassigned-badge.active,
.unassigned-badge:hover {
  background: #b91c1c;
  color: #fff;
}

.region-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
  align-items: start;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  font-weight: 700;
  color: #1e293b;
  flex-wrap: wrap;
}

.panel-head i {
  color: #3b82f6;
  margin-right: 0.25rem;
}

.head-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.panel-desc {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  color: #475569;
}

.toggle-retired {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.region-tree {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  max-height: 70vh;
  overflow-y: auto;
}

.tree-node {
  padding: 0.5rem 0.75rem;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.tree-node:hover {
  background: #f8fafc;
}

.tree-node.selected {
  background: #eff6ff;
  border-left-color: #2563eb;
}

.tree-node.retired {
  opacity: 0.55;
}

.node-main {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.node-main i {
  color: #94a3b8;
  font-size: 0.75rem;
}

.node-name {
  font-weight: 600;
  color: #0f172a;
}

.node-code {
  font-size: 0.75rem;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-left: 0.25rem;
}

.node-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.125rem;
  padding-left: 1.125rem;
  font-size: 0.75rem;
  color: #64748b;
}

.node-agency {
  color: #047857;
}

.tag {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.0625rem 0.375rem;
  border-radius: 4px;
}

.tag-retired {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.tag-parent {
  background: #eef2ff;
  color: #4338ca;
}

.region-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: #475569;
  border-bottom: 1px solid #f1f5f9;
}

.parent-summary {
  padding-bottom: 0.5rem;
}

.sido-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding: 0.75rem 1rem 0.5rem;
}

.sido-tab {
  padding: 0.3rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #fff;
  font-size: 0.8125rem;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.sido-tab.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.sido-count {
  font-size: 0.6875rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 999px;
  padding: 0 0.375rem;
}

.sido-tab.active .sido-count {
  background: #fff;
}

.sigungu-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem 0.5rem;
  font-size: 0.75rem;
  flex-wrap: wrap;
}

.sigungu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.375rem;
  padding: 0 1rem 0.75rem;
}

.sigungu-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  background: #fff;
}

.sigungu-item.checked {
  background: #eff6ff;
  border-color: #93c5fd;
}

.sigungu-item.changed {
  box-shadow: 0 0 0 2px #fbbf24 inset;
}

.sg-name {
  font-weight: 600;
  color: #0f172a;
}

.sg-region {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #b45309;
  white-space: nowrap;
}

.sg-region.unassigned {
  color: #94a3b8;
}

.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.change-summary {
  margin-right: auto;
  font-size: 0.8125rem;
  color: #475569;
}

.history-section {
  border-top: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.section-title {
  padding: 0.75rem 1rem 0.5rem;
  font-weight: 700;
  font-size: 0.875rem;
  color: #1e293b;
}

.section-title i {
  color: #3b82f6;
}

.empty-line {
  padding: 0 1rem 0.75rem;
  font-size: 0.8125rem;
}

.status-badge.muted {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.clickable-row {
  cursor: pointer;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.unassigned-groups {
  padding: 0 1rem 1rem;
}

.unassigned-group {
  margin-bottom: 0.75rem;
}

.group-title {
  font-weight: 700;
  font-size: 0.8125rem;
  margin-bottom: 0.375rem;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chip {
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #334155;
}

.region-modal {
  max-width: 560px;
}

.modal-body .form-group {
  margin-bottom: 1rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-select.full,
.form-input.full {
  width: 100%;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748b;
}

@media (max-width: 1024px) {
  .region-layout {
    grid-template-columns: 1fr;
  }
}
</style>
