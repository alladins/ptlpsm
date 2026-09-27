<!--
  대리점 담당 권역 패널 (기간 이력)

  - 담당 이력은 커미션 분쟁의 근거라 삭제하지 않는다. 담당을 바꿀 때는 종료일을 넣고 새로 추가한다.
  - 같은 권역·같은 채널에 기간이 겹치면 서버가 거부한다 → 서버 메시지를 그대로 보여준다.
-->
<template>
  <div class="info-group">
    <div class="info-group-header panel-header">
      <div class="panel-title">
        <i class="fas fa-map-marked-alt" />
        <span>담당 권역</span>
        <span class="panel-count">{{ territories.length }}건</span>
      </div>
      <button type="button" class="btn-action btn-primary" @click="openAddModal">
        <i class="fas fa-plus" /> 담당 권역 추가
      </button>
    </div>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>담당 권역을 불러오는 중...</p>
    </div>
    <div v-else-if="sortedTerritories.length === 0" class="no-data-message">
      <i class="fas fa-map" />
      <p>지정된 담당 권역이 없습니다. «담당 권역 추가»로 지정하세요.</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>상태</th>
            <th>권역</th>
            <th>담당 기간</th>
            <th>비고</th>
            <th>등록</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in sortedTerritories" :key="t.territoryId">
            <td>
              <span class="status-badge" :class="periodBadge(t).cls">{{ periodBadge(t).label }}</span>
            </td>
            <td class="text-left">
              <span v-if="t.parentRegionName" class="text-muted">{{ t.parentRegionName }} &gt; </span>
              {{ t.regionName }}
              <span class="text-muted">({{ t.regionCode }})</span>
            </td>
            <td>{{ t.validFrom }} ~ {{ t.validTo || '현재' }}</td>
            <td class="text-left">
              {{ t.remarks || '-' }}
            </td>
            <td>
              {{ formatDate(t.createdAt) }}
              <span v-if="t.createdBy" class="text-muted">· {{ t.createdBy }}</span>
            </td>
            <td>
              <GuardedButton
                type="button"
                class="btn-action btn-secondary btn-mini"
                :blocked="isEnded(t)"
                :reason="`이미 종료된 담당(${t.validTo}까지)입니다. 지난 이력은 고치지 않습니다 — 다시 맡기려면 «담당 권역 추가»로 새로 지정하세요.`"
                @click="openEndModal(t)"
              >
                {{ t.validTo ? '종료일 변경' : '종료일 입력' }}
              </GuardedButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 담당 권역 추가 모달 -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-content territory-modal">
          <div class="modal-header">
            <h3>담당 권역 추가</h3>
            <button type="button" class="modal-close" @click="showAddModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-hint">
              시군구가 들어 있는 <strong>말단 권역</strong>만 지정할 수 있습니다.
              같은 권역·같은 채널에 다른 대리점의 담당 기간이 겹치면 저장되지 않습니다.
            </p>
            <div class="form-group">
              <label class="required">권역</label>
              <select v-model="addForm.regionId" class="form-select full">
                <option :value="null">
                  권역을 선택하세요
                </option>
                <option v-for="r in leafRegions" :key="r.regionId" :value="r.regionId">
                  {{ r.parentRegionName ? r.parentRegionName + ' > ' : '' }}{{ r.regionName }} ({{ r.regionCode }}) · 시군구 {{ r.sigunguCount }}곳{{ r.activeAgencyNames ? ' · 현재 담당: ' + r.activeAgencyNames : '' }}
                </option>
              </select>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="required">담당 시작일</label>
                <input v-model="addForm.validFrom" type="date" class="form-input full">
              </div>
              <div class="form-group">
                <label>담당 종료일 <span class="text-muted">(비우면 계속 담당)</span></label>
                <input v-model="addForm.validTo" type="date" class="form-input full">
              </div>
            </div>
            <div class="form-group">
              <label>비고</label>
              <input v-model="addForm.remarks" type="text" class="form-input full" placeholder="예: 계약서 제3조">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="showAddModal = false">
              취소
            </button>
            <GuardedButton
              type="button"
              class="btn-primary"
              :blocked="!addForm.regionId || !addForm.validFrom"
              reason="권역과 담당 시작일을 입력하세요."
              :disabled="saving"
              @click="submitAdd"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin" /> 추가
            </GuardedButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 종료일 입력 모달 -->
    <Teleport to="body">
      <div v-if="endTarget" class="modal-overlay" @click.self="endTarget = null">
        <div class="modal-content territory-modal">
          <div class="modal-header">
            <h3>담당 종료일 입력</h3>
            <button type="button" class="modal-close" @click="endTarget = null">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-hint">
              <strong>{{ endTarget.regionName }}</strong> 담당({{ endTarget.validFrom }}~)을 종료합니다.
              종료일 당일까지 담당으로 판정됩니다. 이력은 지워지지 않습니다.
            </p>
            <div class="form-group">
              <label class="required">담당 종료일</label>
              <input v-model="endDate" type="date" class="form-input full" :min="endTarget.validFrom">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="endTarget = null">
              취소
            </button>
            <GuardedButton
              type="button"
              class="btn-danger"
              :blocked="!endDate"
              reason="종료일을 입력하세요."
              :disabled="saving"
              @click="submitEnd"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin" /> 종료일 저장
            </GuardedButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { agencyService, salesRegionService } from '~/services/agency.service'
import { formatDate } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { todayKst, type SalesRegion, type Territory } from '~/types/agency'

const props = defineProps<{ agencyId: number }>()
const emit = defineEmits<{ changed: [] }>()

const territories = ref<Territory[]>([])
const regions = ref<SalesRegion[]>([])
const loading = ref(false)
const saving = ref(false)

/** 담당 중 → 예정 → 종료 순, 같은 그룹은 시작일 최신순 */
const sortedTerritories = computed(() => {
  const rank = (t: Territory) => (t.current ? 0 : (t.validFrom > todayKst() ? 1 : 2))
  return [...territories.value].sort((a, b) =>
    rank(a) - rank(b) || b.validFrom.localeCompare(a.validFrom))
})

const periodBadge = (t: Territory): { label: string, cls: string } => {
  if (t.current) { return { label: '담당중', cls: 'success' } }
  if (t.validFrom > todayKst()) { return { label: '예정', cls: 'info' } }
  return { label: '종료', cls: 'muted' }
}

/** 이미 끝난 담당 (담당중도 예정도 아님) */
const isEnded = (t: Territory) => !t.current && t.validFrom <= todayKst()

const leafRegions = computed(() =>
  regions.value
    .filter(r => r.useYn === 'Y' && r.childCount === 0)
    .sort((a, b) => a.regionCode.localeCompare(b.regionCode))
)

const loadTerritories = async () => {
  loading.value = true
  try {
    territories.value = await agencyService.getTerritories(props.agencyId)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

const loadRegions = async () => {
  try {
    regions.value = await salesRegionService.getRegions()
  } catch (e) {
    console.error('권역 목록 로드 실패:', e)
  }
}

// ===== 추가 =====
const showAddModal = ref(false)
const addForm = ref<{ regionId: number | null, validFrom: string, validTo: string, remarks: string }>({
  regionId: null,
  validFrom: todayKst(),
  validTo: '',
  remarks: ''
})

const openAddModal = () => {
  addForm.value = { regionId: null, validFrom: todayKst(), validTo: '', remarks: '' }
  showAddModal.value = true
  // 권역 담당 현황(현재 담당 대리점)이 바뀌었을 수 있으니 다시 읽는다
  loadRegions()
}

const submitAdd = async () => {
  if (!addForm.value.regionId || !addForm.value.validFrom) { return }
  if (addForm.value.validTo && addForm.value.validTo < addForm.value.validFrom) {
    alert('담당 종료일이 시작일보다 빠릅니다.')
    return
  }
  saving.value = true
  try {
    await agencyService.addTerritory(props.agencyId, {
      regionId: addForm.value.regionId,
      validFrom: addForm.value.validFrom,
      validTo: addForm.value.validTo || null,
      remarks: addForm.value.remarks.trim() || null
    })
    showAddModal.value = false
    await loadTerritories()
    emit('changed')
  } catch (e) {
    // 기간 겹침 등 서버 메시지를 그대로 보여준다
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

// ===== 종료일 입력 =====
const endTarget = ref<Territory | null>(null)
const endDate = ref('')

const openEndModal = (t: Territory) => {
  endTarget.value = t
  const today = todayKst()
  endDate.value = t.validTo || (today < t.validFrom ? t.validFrom : today)
}

const submitEnd = async () => {
  const t = endTarget.value
  if (!t || !endDate.value) { return }
  if (endDate.value < t.validFrom) {
    alert('담당 종료일이 시작일보다 빠릅니다.')
    return
  }
  saving.value = true
  try {
    // 서버가 전체 값을 검증하므로 기존 값을 모두 채워 보낸다
    await agencyService.updateTerritory(props.agencyId, t.territoryId, {
      regionId: t.regionId,
      validFrom: t.validFrom,
      validTo: endDate.value,
      remarks: t.remarks
    })
    endTarget.value = null
    await loadTerritories()
    emit('changed')
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadTerritories()
  loadRegions()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

.panel-header {
  justify-content: space-between;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-count {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.btn-mini {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.status-badge.muted {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.territory-modal {
  max-width: 560px;
}

.modal-hint {
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.6;
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
</style>
