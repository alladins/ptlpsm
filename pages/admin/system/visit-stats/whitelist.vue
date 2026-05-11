<template>
  <div class="visit-whitelist">
    <div class="page-header-compact">
      <h1>IP 접근 목록 관리</h1>
      <span class="page-description">화이트리스트(알림 예외) · 블랙리스트(차단) IP 통합 관리.</span>
      <div class="header-actions-right">
        <button class="btn-action" :disabled="!query.companyId && query.listType === 'WHITE'" @click="loadList">
          <i class="fas fa-search" /> 조회
        </button>
        <button class="btn-action btn-primary" @click="openCreate">
          <i class="fas fa-plus" /> 등록
        </button>
      </div>
    </div>

    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>목록 유형:</label>
          <select v-model="query.listType" class="text-input" @change="loadList">
            <option value="">
              전체
            </option>
            <option value="WHITE">
              화이트리스트
            </option>
            <option value="BLACK">
              블랙리스트
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>회사 ID:</label>
          <input
            v-model.number="query.companyId"
            type="number"
            placeholder="회사 ID 입력"
            class="text-input"
            @keyup.enter="loadList"
          >
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>유형</th>
            <th>IP 주소</th>
            <th>CIDR</th>
            <th>설명</th>
            <th>활성</th>
            <th>등록자</th>
            <th>등록일</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="9" class="empty">
              등록된 항목이 없습니다.
            </td>
          </tr>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ 'row-black': row.listType === 'BLACK' }"
          >
            <td>{{ row.id }}</td>
            <td>
              <span :class="row.listType === 'BLACK' ? 'badge badge-black' : 'badge badge-white'">
                {{ row.listType === 'BLACK' ? '블랙' : '화이트' }}
              </span>
            </td>
            <td class="mono">
              {{ row.ipAddress }}
            </td>
            <td class="mono">
              {{ row.ipRangeCidr || '-' }}
            </td>
            <td>{{ row.description || '-' }}</td>
            <td>
              <span :class="row.isActive ? 'badge badge-ok' : 'badge badge-warn'">
                {{ row.isActive ? '활성' : '비활성' }}
              </span>
            </td>
            <td>{{ row.registeredBy ?? '-' }}</td>
            <td>{{ formatTime(row.registeredAt) }}</td>
            <td>
              <button class="btn-mini" @click="openEdit(row)">
                수정
              </button>
              <button class="btn-mini btn-danger" @click="onDelete(row.id)">
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 등록/수정 모달 -->
    <Teleport to="body">
      <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <h2>{{ form.id ? 'IP 항목 수정' : 'IP 항목 등록' }}</h2>

          <div class="form-row">
            <label>목록 유형 *</label>
            <select v-model="form.listType" class="form-select">
              <option value="WHITE">
                화이트리스트 (알림 예외)
              </option>
              <option value="BLACK">
                블랙리스트 (차단)
              </option>
            </select>
          </div>

          <!-- BLACK 경고 배너 -->
          <div v-if="form.listType === 'BLACK'" class="black-warning">
            <i class="fas fa-exclamation-triangle" />
            <strong>주의:</strong> 이 IP에서의 모든 접속이 JWT 이전에 차단됩니다.
            로그인 포함 모든 API 요청이 즉시 403으로 거부됩니다.
          </div>

          <div class="form-row">
            <label>IP 주소 *</label>
            <input v-model="form.ipAddress" type="text" placeholder="예: 192.168.1.10">
          </div>
          <div class="form-row">
            <label>CIDR (옵션)</label>
            <input v-model="form.ipRangeCidr" type="text" placeholder="예: 192.168.1.0/24">
          </div>
          <div class="form-row">
            <label>회사 ID</label>
            <input
              v-model.number="form.companyId"
              type="number"
              placeholder="화이트리스트 필수, 블랙리스트 선택"
              :required="form.listType === 'WHITE'"
            >
          </div>
          <div class="form-row">
            <label>설명</label>
            <input v-model="form.description" type="text" placeholder="예: 본사 사무실">
          </div>
          <div class="form-row">
            <label>활성</label>
            <input v-model="form.isActive" type="checkbox">
          </div>

          <!-- BLACK 확인 체크박스 -->
          <div v-if="form.listType === 'BLACK'" class="form-row black-confirm">
            <label>위험 인지</label>
            <label class="checkbox-label">
              <input v-model="blackConfirmed" type="checkbox">
              <span>위험을 인지하였습니다. 이 IP를 차단합니다.</span>
            </label>
          </div>

          <div class="modal-actions">
            <button class="btn-action" @click="closeModal">
              취소
            </button>
            <button
              class="btn-action btn-primary"
              :class="{ 'btn-danger-action': form.listType === 'BLACK' }"
              :disabled="form.listType === 'BLACK' && !blackConfirmed"
              @click="onSave"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { visitService } from '~/services/visit.service'
import type { VisitIpWhitelist, VisitIpWhitelistRequest } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const query = ref<{ companyId?: number; listType: string }>({ companyId: undefined, listType: '' })
const rows = ref<VisitIpWhitelist[]>([])
const modalOpen = ref(false)
const blackConfirmed = ref(false)

const form = ref<VisitIpWhitelistRequest & { id?: number }>({
  companyId: undefined,
  ipAddress: '',
  ipRangeCidr: '',
  description: '',
  isActive: true,
  listType: 'WHITE'
})

const formatTime = (s?: string) => (s ? s.replace('T', ' ').slice(0, 19) : '-')

async function loadList () {
  // 화이트리스트 모드에서는 companyId 필수
  if (query.value.listType !== 'BLACK' && !query.value.companyId) { return }
  try {
    rows.value = await visitService.getWhitelist(
      query.value.companyId ?? 0,
      query.value.listType as 'WHITE' | 'BLACK' | undefined || undefined
    )
  } catch (e) {
    alert('조회 실패: ' + (e instanceof Error ? e.message : String(e)))
  }
}

function openCreate () {
  form.value = {
    companyId: query.value.companyId ?? undefined,
    ipAddress: '',
    ipRangeCidr: '',
    description: '',
    isActive: true,
    listType: (query.value.listType as 'WHITE' | 'BLACK') || 'WHITE'
  }
  blackConfirmed.value = false
  modalOpen.value = true
}

function openEdit (row: VisitIpWhitelist) {
  form.value = {
    id: row.id,
    companyId: row.companyId ?? undefined,
    ipAddress: row.ipAddress,
    ipRangeCidr: row.ipRangeCidr || '',
    description: row.description || '',
    isActive: row.isActive,
    listType: row.listType || 'WHITE'
  }
  blackConfirmed.value = false
  modalOpen.value = true
}

function closeModal () {
  modalOpen.value = false
}

async function onSave () {
  if (!form.value.ipAddress) {
    alert('IP 주소는 필수입니다.')
    return
  }
  if (form.value.listType === 'WHITE' && !form.value.companyId) {
    alert('화이트리스트는 회사 ID가 필수입니다.')
    return
  }
  if (form.value.listType === 'BLACK' && !blackConfirmed.value) {
    alert('블랙리스트 등록 시 위험 인지 체크박스를 선택해야 합니다.')
    return
  }
  // BLACK 등록 시 추가 confirm
  if (form.value.listType === 'BLACK' && !form.value.id) {
    if (!confirm(`[차단 확인] ${form.value.ipAddress} IP를 블랙리스트에 등록하시겠습니까?\n이 IP에서의 모든 접속이 즉시 차단됩니다.`)) {
      return
    }
  }

  const payload: VisitIpWhitelistRequest = {
    companyId: form.value.companyId ?? null,
    ipAddress: form.value.ipAddress,
    ipRangeCidr: form.value.ipRangeCidr,
    description: form.value.description,
    isActive: form.value.isActive,
    listType: form.value.listType as 'WHITE' | 'BLACK'
  }
  try {
    if (form.value.id) {
      await visitService.updateWhitelist(form.value.id, payload)
    } else {
      await visitService.createWhitelist(payload)
    }
    closeModal()
    await loadList()
  } catch (e) {
    alert('저장 실패: ' + (e instanceof Error ? e.message : String(e)))
  }
}

async function onDelete (id: number) {
  if (!confirm('삭제하시겠습니까?')) { return }
  try {
    await visitService.deleteWhitelist(id)
    await loadList()
  } catch (e) {
    alert('삭제 실패: ' + (e instanceof Error ? e.message : String(e)))
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-modals.css';

.mono { font-family: ui-monospace, Menlo, monospace; }
.empty { text-align: center; padding: 1.5rem; color: #9ca3af; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-ok { background: #d1fae5; color: #065f46; }
.badge-warn { background: #fef3c7; color: #92400e; }
.badge-white { background: #dbeafe; color: #1e40af; }
.badge-black { background: #fee2e2; color: #991b1b; }

/* BLACK 행 배경 */
.row-black { background-color: #fff5f5; }
.row-black:hover { background-color: #fee2e2; }

.btn-mini {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.25rem;
}
.btn-mini.btn-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: #fff; border-radius: 8px; padding: 1.5rem;
  width: 500px; max-width: 90vw;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.modal h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }

.form-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 0.75rem;
}
.form-row input[type="text"],
.form-row input[type="number"],
.form-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 100%;
}

/* BLACK 경고 배너 */
.black-warning {
  background: #fff1f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #991b1b;
  line-height: 1.5;
}
.black-warning i { margin-right: 0.4rem; }

/* BLACK 확인 체크박스 */
.black-confirm label.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7f1d1d;
  cursor: pointer;
}

.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }

/* BLACK 저장 버튼 */
.btn-danger-action {
  background: #dc2626 !important;
  color: #fff !important;
  border-color: #b91c1c !important;
}
.btn-danger-action:disabled {
  background: #fca5a5 !important;
  border-color: #fca5a5 !important;
  cursor: not-allowed;
}
</style>
