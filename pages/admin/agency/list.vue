<template>
  <div class="agency-list">
    <PageHeader
      title="대리점관리"
      description="지자체·교육청 대리점과 담당 권역, 소속 영업직원을 관리합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="loadAgencies">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo" />
          초기화
        </button>
        <button class="btn-action btn-primary" @click="goRegister">
          <i class="fas fa-plus" />
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              class="keyword-input"
              placeholder="회사명, 대리점코드, 대표자, 사업자번호"
              @keyup.enter="loadAgencies"
            >
          </div>
          <div class="search-item">
            <label>채널:</label>
            <select v-model="searchForm.channel" class="status-select" @change="loadAgencies">
              <option value="">
                전체
              </option>
              <option v-for="(label, code) in AGENCY_CHANNEL_LABELS" :key="code" :value="code">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="status-select" @change="loadAgencies">
              <option value="">
                전체
              </option>
              <option v-for="(label, code) in AGENCY_STATUS_LABELS" :key="code" :value="code">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>담당 권역:</label>
            <select v-model="searchForm.regionId" class="sort-select" @change="loadAgencies">
              <option :value="null">
                전체
              </option>
              <option v-for="r in leafRegions" :key="r.regionId" :value="r.regionId">
                {{ r.parentRegionName ? r.parentRegionName + ' > ' : '' }}{{ r.regionName }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 목록 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 <strong>{{ agencies.length }}</strong>곳</span>
          </div>
        </div>

        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>데이터를 불러오는 중...</p>
        </div>

        <div v-else-if="agencies.length === 0" class="no-data-message">
          <i class="fas fa-handshake" />
          <p>조건에 맞는 대리점이 없습니다.</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>대리점코드</th>
                <th>회사명</th>
                <th>채널</th>
                <th>현재 담당 권역</th>
                <th>영업직원</th>
                <th>상태</th>
                <th>계약기간</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(a, index) in agencies"
                :key="a.agencyId"
                class="table-row clickable-row"
                @click="goEdit(a.agencyId)"
              >
                <td>{{ index + 1 }}</td>
                <td class="code-cell">
                  {{ a.agencyCode }}
                </td>
                <td class="text-left">
                  {{ a.companyName }}
                </td>
                <td>
                  <span class="status-badge" :class="a.channel === 'EDU' ? 'info' : 'primary'">
                    {{ codeLabel(AGENCY_CHANNEL_LABELS, a.channel) }}
                  </span>
                </td>
                <td class="text-left">
                  <span v-if="a.currentRegionNames">{{ a.currentRegionNames }}</span>
                  <span v-else class="text-muted">담당 권역 없음</span>
                </td>
                <td>{{ a.staffCount ?? 0 }}명</td>
                <td>
                  <span class="status-badge" :class="AGENCY_STATUS_BADGE[a.status] || ''">
                    {{ codeLabel(AGENCY_STATUS_LABELS, a.status) }}
                  </span>
                </td>
                <td>{{ formatPeriod(a.contractStartDate, a.contractEndDate) }}</td>
                <td>{{ formatDate(a.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 대리점관리 목록
 * - 검색: 검색어·채널·상태·담당 권역(말단 권역)
 * - 행 클릭 → 수정 화면 (담당 권역·영업직원 포함)
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { agencyService, salesRegionService } from '~/services/agency.service'
import { formatDate } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import {
  AGENCY_CHANNEL_LABELS,
  AGENCY_STATUS_BADGE,
  AGENCY_STATUS_LABELS,
  codeLabel,
  type Agency,
  type SalesRegion
} from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '대리점관리'
})

const router = useRouter()

const agencies = ref<Agency[]>([])
const regions = ref<SalesRegion[]>([])
const loading = ref(false)

const searchForm = ref<{ keyword: string, channel: string, status: string, regionId: number | null }>({
  keyword: '',
  channel: '',
  status: '',
  regionId: null
})

/** 담당은 말단 권역에만 붙으므로 검색 대상도 말단 권역 (폐지 포함 — 과거 담당 검색용) */
const leafRegions = computed(() =>
  regions.value
    .filter(r => r.childCount === 0)
    .sort((a, b) => a.regionCode.localeCompare(b.regionCode))
)

const loadAgencies = async () => {
  loading.value = true
  try {
    agencies.value = await agencyService.getAgencies({
      keyword: searchForm.value.keyword.trim() || undefined,
      channel: searchForm.value.channel || undefined,
      status: searchForm.value.status || undefined,
      regionId: searchForm.value.regionId
    })
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

const handleReset = () => {
  searchForm.value = { keyword: '', channel: '', status: '', regionId: null }
  loadAgencies()
}

const formatPeriod = (from: string | null, to: string | null) => {
  if (!from && !to) { return '-' }
  return `${from || ''} ~ ${to || ''}`
}

const goRegister = () => router.push('/admin/agency/register')
const goEdit = (id: number) => router.push(`/admin/agency/edit/${id}`)

onMounted(() => {
  loadAgencies()
  loadRegions()
})
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
}

.code-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  color: #1e40af;
}
</style>
