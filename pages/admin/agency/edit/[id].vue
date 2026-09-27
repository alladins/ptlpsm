<template>
  <div class="agency-edit">
    <PageHeader
      :title="agency ? `대리점 수정 — ${agency.companyName}` : '대리점 수정'"
      :description="agency ? `${agency.agencyCode} · ${codeLabel(AGENCY_CHANNEL_LABELS, agency.channel)}` : ''"
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goList">
          <i class="fas fa-arrow-left" />
          목록으로
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>대리점 정보를 불러오는 중...</p>
    </div>

    <div v-else-if="loadError" class="no-data-message">
      <i class="fas fa-exclamation-triangle" />
      <p>{{ loadError }}</p>
    </div>

    <div v-else-if="agency" class="content-section">
      <AgencyForm mode="edit" :initial-data="agency" :saving="saving" @submit="handleUpdate" @cancel="goList" />

      <div class="panel-stack">
        <AgencyTerritoryPanel :agency-id="agencyId" @changed="reloadAgency" />
        <AgencyStaffPanel :agency-id="agencyId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 대리점 수정
 * - 회사·대리점 정보 수정 (채널은 변경 불가)
 * - 담당 권역(기간) 추가/종료, 소속 영업직원 확인·추가
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import AgencyForm from '~/components/admin/agency/AgencyForm.vue'
import AgencyTerritoryPanel from '~/components/admin/agency/AgencyTerritoryPanel.vue'
import AgencyStaffPanel from '~/components/admin/agency/AgencyStaffPanel.vue'
import { agencyService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import { AGENCY_CHANNEL_LABELS, codeLabel, type Agency, type AgencyRequest } from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '대리점 수정'
})

const route = useRoute()
const router = useRouter()

const agencyId = computed(() => Number(route.params.id))
const agency = ref<Agency | null>(null)
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)

const loadAgency = async () => {
  if (!Number.isFinite(agencyId.value) || agencyId.value <= 0) {
    loadError.value = '대리점 ID 가 올바르지 않습니다. 목록에서 다시 선택하세요.'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    agency.value = await agencyService.getAgency(agencyId.value)
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}

/** 담당 권역이 바뀌면 헤더 등 대리점 요약만 조용히 갱신 (폼은 다시 채우지 않음) */
const reloadAgency = async () => {
  try {
    const fresh = await agencyService.getAgency(agencyId.value)
    if (agency.value) {
      agency.value.currentRegionNames = fresh.currentRegionNames
    }
  } catch (e) {
    console.error('대리점 요약 갱신 실패:', e)
  }
}

const handleUpdate = async (data: AgencyRequest) => {
  saving.value = true
  try {
    agency.value = await agencyService.updateAgency(agencyId.value, data)
    alert('대리점 정보가 저장되었습니다.')
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

const goList = () => router.push('/admin/agency/list')

onMounted(loadAgency)
</script>

<style scoped>
.panel-stack {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
