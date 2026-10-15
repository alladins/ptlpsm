<!--
  대리점 소속 영업직원 패널

  영업직원 계정은 새 등록 경로를 만들지 않고 기존 «사용자관리» 등록을 그대로 쓴다.
  «영업직원 추가»는 사용자 등록 모달을 권한=대리점 영업직원, 소속회사=이 대리점으로 미리 채워 여는 것뿐이다.
  연락처·직책·알림 수신·상태·삭제는 여기서 바로 처리한다(사용자 API 재사용). 아이디·비밀번호·권한은 사용자관리에서.
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
      이름·직책·연락처·알림 수신·사용 여부는 여기서 바로 고칠 수 있고, 아이디·비밀번호·권한은 기초정보 &gt; 사용자관리에서 바꿉니다.
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
            <!-- 영업 리드 안내 수신 여부 (V3.44.0) -->
            <th title="공모·낙찰 안내 문자·메일 수신 여부">
              알림 수신
            </th>
            <th>상태</th>
            <th>최근 로그인</th>
            <th v-if="canWrite" class="col-manage">
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in staff" :key="s.userId">
            <td>{{ s.loginId }}</td>
            <td>{{ s.userName }}</td>
            <td>{{ s.position || '-' }}</td>
            <td>{{ s.phone || '-' }}</td>
            <td>{{ s.email || '-' }}</td>
            <td class="nowrap">
              <span :class="s.leadNotifySms === 'N' ? 'text-muted' : 'notify-on'">문자 {{ s.leadNotifySms === 'N' ? '×' : '○' }}</span>
              ·
              <span :class="s.leadNotifyEmail === 'N' ? 'text-muted' : 'notify-on'">메일 {{ s.leadNotifyEmail === 'N' ? '×' : '○' }}</span>
            </td>
            <td>
              <span class="status-badge" :class="s.enabled ? 'success' : 'danger'">
                {{ s.enabled ? '사용' : '비활성' }}
              </span>
            </td>
            <td>{{ formatDateTime(s.lastLoginAt) }}</td>
            <td v-if="canWrite" class="col-manage">
              <div class="manage-buttons">
                <button type="button" class="btn-action btn-secondary btn-xs" :disabled="busyId === s.userId" title="이름·직책·연락처·알림 수신 수정" @click="openEdit(s)">
                  <i class="fas fa-pen" /> 수정
                </button>
                <button type="button" class="btn-action btn-secondary btn-xs" :disabled="busyId === s.userId" :title="s.enabled ? '로그인·알림을 막습니다 (기록은 남음)' : '다시 쓸 수 있게 합니다'" @click="toggleStatus(s)">
                  <i :class="s.enabled ? 'fas fa-user-slash' : 'fas fa-user-check'" /> {{ s.enabled ? '비활성화' : '활성화' }}
                </button>
                <button type="button" class="btn-action btn-danger btn-xs" :disabled="busyId === s.userId" title="계정을 완전히 지웁니다" @click="removeStaff(s)">
                  <i class="fas fa-trash" /> 삭제
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 직원 수정 모달 -->
    <Teleport to="body">
      <div v-if="editTarget" class="modal-overlay" @click.self="closeEdit">
        <div class="modal" style="max-width: 440px;" @click.stop>
          <div class="modal-header">
            <h3>영업직원 수정 — {{ editTarget.loginId }}</h3>
            <button type="button" class="modal-close" @click="closeEdit">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitEdit">
              <div class="form-group">
                <label>이름 *</label>
                <input v-model="editForm.userName" type="text" required maxlength="50" class="form-input">
              </div>
              <div class="form-group">
                <label>직책</label>
                <input v-model="editForm.position" type="text" maxlength="50" class="form-input" placeholder="예: 영업팀장">
              </div>
              <div class="form-group">
                <label>휴대폰</label>
                <input v-model="editForm.phone" type="tel" maxlength="20" class="form-input" placeholder="010-0000-0000">
                <small class="field-hint">비우면 문자 안내를 받지 못합니다.</small>
              </div>
              <div class="form-group">
                <label>이메일</label>
                <input v-model="editForm.email" type="email" maxlength="100" class="form-input" placeholder="name@example.com">
                <small class="field-hint">비우면 메일 안내를 받지 못합니다.</small>
              </div>
              <div class="form-group">
                <label>공모·낙찰 안내 수신</label>
                <div class="notify-options">
                  <label class="notify-option"><input v-model="editForm.notifySms" type="checkbox"> 문자</label>
                  <label class="notify-option"><input v-model="editForm.notifyEmail" type="checkbox"> 메일</label>
                  <label class="notify-option disabled" title="카카오 알림톡 준비 중"><input type="checkbox" disabled> 알림톡 (준비 중)</label>
                </div>
              </div>
              <p v-if="editError" class="edit-error">
                <i class="fas fa-exclamation-circle" /> {{ editError }}
              </p>
              <div class="modal-actions" style="display: flex; margin-top: 1.25rem; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" class="btn-secondary" :disabled="saving" @click="closeEdit">
                  취소
                </button>
                <button type="submit" class="btn-primary" :disabled="saving">
                  <i v-if="saving" class="fas fa-spinner fa-spin" />
                  <i v-else class="fas fa-save" />
                  {{ saving ? '저장 중...' : '저장' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import { agencyService } from '~/services/agency.service'
import { userService } from '~/services/user.service'
import { formatDateTime } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import type { AgencyStaff } from '~/types/agency'

// canWrite: 메뉴권한 AGENCY 쓰기 — 수정 화면에서 넘겨준다. 계정 API 는 리드파워 관리자 권한이 따로 필요(실패 시 메시지로 안내)
const props = defineProps<{ agencyId: number, canWrite?: boolean }>()

const router = useRouter()
const staff = ref<AgencyStaff[]>([])
const loading = ref(false)
const busyId = ref<number | null>(null)

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
    query: { openAdd: '1', role: 'SALES_MANAGER', companyId: String(props.agencyId) }
  })
}

// ── 수정 ──
const editTarget = ref<AgencyStaff | null>(null)
const editForm = ref({ userName: '', position: '', phone: '', email: '', notifySms: true, notifyEmail: true })
const editError = ref('')
const saving = ref(false)

const openEdit = (s: AgencyStaff) => {
  editTarget.value = s
  editForm.value = {
    userName: s.userName || '',
    position: s.position || '',
    phone: s.phone || '',
    email: s.email || '',
    notifySms: s.leadNotifySms !== 'N',
    notifyEmail: s.leadNotifyEmail !== 'N'
  }
  editError.value = ''
}

const closeEdit = () => {
  if (saving.value) { return }
  editTarget.value = null
}

const submitEdit = async () => {
  if (!editTarget.value) { return }
  const f = editForm.value
  const userName = f.userName.trim()
  if (!userName) {
    editError.value = '이름을 입력하세요.'
    return
  }
  const email = f.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    editError.value = '이메일 형식이 올바르지 않습니다.'
    return
  }
  saving.value = true
  editError.value = ''
  try {
    // 사용자 수정 API 는 값이 온 항목만 바꾼다(빈 문자열은 «지움»). 아이디·권한·소속은 보내지 않는다
    await userService.updateUser(editTarget.value.userId, {
      userName,
      position: f.position.trim(),
      phone: f.phone.trim(),
      email,
      leadNotifySms: f.notifySms ? 'Y' : 'N',
      leadNotifyEmail: f.notifyEmail ? 'Y' : 'N'
    })
    editTarget.value = null
    await loadStaff()
  } catch (e) {
    editError.value = toApiError(e).message
  } finally {
    saving.value = false
  }
}

// ── 활성/비활성 ──
const toggleStatus = async (s: AgencyStaff) => {
  const who = s.userName + '(' + s.loginId + ')'
  const msg = s.enabled
    ? who + ' 계정을 비활성화할까요?\n로그인과 공모·낙찰 안내 수신이 멈춥니다. 기록은 남습니다.'
    : who + ' 계정을 다시 활성화할까요?'
  if (!confirm(msg)) { return }
  busyId.value = s.userId
  try {
    await userService.toggleUserStatus(s.userId)
    await loadStaff()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    busyId.value = null
  }
}

// ── 삭제 ──
const removeStaff = async (s: AgencyStaff) => {
  const who = s.userName + '(' + s.loginId + ')'
  const used = s.lastLoginAt ? '\n이 계정은 로그인 기록이 있습니다. 이력을 남기려면 삭제 대신 «비활성화»를 쓰세요.' : ''
  if (!confirm(who + ' 계정을 삭제할까요?\n되돌릴 수 없습니다.' + used)) { return }
  busyId.value = s.userId
  try {
    await userService.deleteUser(s.userId)
    await loadStaff()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    busyId.value = null
  }
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

.col-manage {
  white-space: nowrap;
}

.manage-buttons {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

/* 터치 기기에서도 누를 수 있게 최소 높이 확보 */
.btn-xs {
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  min-height: 36px;
}

.btn-danger {
  background: #fff;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.field-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.notify-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

.notify-option {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
}

.notify-option.disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.edit-error {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: #dc2626;
}
</style>
