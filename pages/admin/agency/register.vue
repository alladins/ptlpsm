<template>
  <div class="agency-register">
    <PageHeader
      title="대리점 등록"
      description="회사 정보와 대리점 정보를 등록합니다. 담당 권역·영업직원은 등록 후 수정 화면에서 지정합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goList">
          <i class="fas fa-arrow-left" />
          목록으로
        </button>
      </template>
    </PageHeader>

    <!-- 권한 확인 전에는 폼도 안내도 띄우지 않는다 (잘못된 상태 깜빡임 방지) -->
    <div v-if="!permissionReady" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>권한을 확인하는 중...</p>
    </div>

    <div v-else-if="!canWrite" class="no-data-message">
      <i class="fas fa-lock" />
      <p>대리점 등록 권한이 없습니다</p>
      <button class="btn-action btn-secondary no-auth-back" @click="goList">
        <i class="fas fa-arrow-left" />
        목록으로
      </button>
    </div>

    <div v-else class="content-section">
      <AgencyForm mode="create" :saving="saving" @submit="handleCreate" @cancel="goList" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 대리점 등록
 * - 등록이 끝나면 수정 화면으로 이동해 담당 권역·영업직원을 이어서 지정한다
 */
import { ref, computed } from 'vue'
import { useRouter } from '#imports'
import AgencyForm from '~/components/admin/agency/AgencyForm.vue'
import { agencyService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import { usePermission } from '~/composables/usePermission'
import type { AgencyRequest } from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '대리점 등록'
})

const router = useRouter()
const saving = ref(false)

// 메뉴권한(AGENCY) — 등록 권한이 없으면 폼 대신 안내 블록
const { canWrite, initialized, isFullAccess } = usePermission('AGENCY')
const permissionReady = computed(() => initialized.value || isFullAccess.value)

const handleCreate = async (data: AgencyRequest) => {
  saving.value = true
  try {
    const created = await agencyService.createAgency(data)
    alert('대리점이 등록되었습니다. 이어서 담당 권역과 영업직원을 지정하세요.')
    router.push(`/admin/agency/edit/${created.agencyId}`)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

const goList = () => router.push('/admin/agency/list')
</script>

<style scoped>
.no-auth-back {
  margin-top: 1rem;
}
</style>
