<!--
  대리점 소속 영업직원 패널

  영업직원 계정은 새 등록 경로를 만들지 않고 기존 «사용자관리» 등록을 그대로 쓴다.
  «영업직원 추가»는 사용자 등록 모달을 권한=대리점 영업직원, 소속회사=이 대리점으로 미리 채워 여는 것뿐이다.
-->
<template>
  <div class="info-group">
    <div class="info-group-header panel-header">
      <div class="panel-title">
        <i class="fas fa-user-tie" />
        <span>소속 영업직원</span>
        <span class="panel-count">{{ staff.length }}명</span>
      </div>
      <div class="panel-actions">
        <button type="button" class="btn-action btn-secondary" :disabled="loading" @click="loadStaff">
          <i class="fas fa-sync-alt" /> 새로고침
        </button>
        <button v-if="canWrite" type="button" class="btn-action btn-primary" @click="goAddStaff">
          <i class="fas fa-user-plus" /> 영업직원 추가
        </button>
      </div>
    </div>

    <p class="panel-hint">
      <i class="fas fa-info-circle" />
      아이디는 기존 계정과 같은 방식으로 자유롭게 정하되, 휴대폰 로그인을 위해 영문·숫자를 권장합니다.
      계정 수정·비활성화는 기초정보 &gt; 사용자관리에서 합니다.
    </p>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>영업직원을 불러오는 중...</p>
    </div>
    <div v-else-if="staff.length === 0" class="no-data-message">
      <i class="fas fa-users" />
      <p>소속 영업직원이 없습니다.</p>
    </div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>아이디</th>
            <th>이름</th>
            <th>직책</th>
            <th>휴대폰</th>
            <th>이메일</th>
            <th>상태</th>
            <th>최근 로그인</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in staff" :key="s.userId">
            <td>{{ s.loginId }}</td>
            <td>{{ s.userName }}</td>
            <td>{{ s.position || '-' }}</td>
            <td>{{ s.phone || '-' }}</td>
            <td>{{ s.email || '-' }}</td>
            <td>
              <span class="status-badge" :class="s.enabled ? 'success' : 'danger'">
                {{ s.enabled ? '사용' : '비활성' }}
              </span>
            </td>
            <td>{{ formatDateTime(s.lastLoginAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import { agencyService } from '~/services/agency.service'
import { formatDateTime } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import type { AgencyStaff } from '~/types/agency'

// canWrite: «영업직원 추가» (메뉴권한 AGENCY — 수정 화면에서 넘겨준다. 계정 등록 자체는 사용자관리 권한이 따로 필요)
const props = defineProps<{ agencyId: number, canWrite?: boolean }>()

const router = useRouter()
const staff = ref<AgencyStaff[]>([])
const loading = ref(false)

const loadStaff = async () => {
  loading.value = true
  try {
    staff.value = await agencyService.getStaff(props.agencyId)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

const goAddStaff = () => {
  router.push({
    path: '/admin/basic-info/user',
    query: { openAdd: '1', role: 'AGENCY_SALES', companyId: String(props.agencyId) }
  })
}

onMounted(loadStaff)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

.panel-header {
  justify-content: space-between;
}

.panel-title,
.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-count {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.panel-hint {
  margin: 0;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  color: #475569;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.panel-hint i {
  color: #3b82f6;
  margin-right: 0.25rem;
}
</style>
