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

    <div class="content-section">
      <AgencyForm mode="create" :saving="saving" @submit="handleCreate" @cancel="goList" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 대리점 등록
 * - 등록이 끝나면 수정 화면으로 이동해 담당 권역·영업직원을 이어서 지정한다
 */
import { ref } from 'vue'
import { useRouter } from '#imports'
import AgencyForm from '~/components/admin/agency/AgencyForm.vue'
import { agencyService } from '~/services/agency.service'
import { toApiError } from '~/utils/api-error'
import type { AgencyRequest } from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '대리점 등록'
})

const router = useRouter()
const saving = ref(false)

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
