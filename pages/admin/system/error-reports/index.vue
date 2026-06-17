<template>
  <div class="error-report-list">
    <PageHeader
      title="오류 게시판"
      description="운영 중 발생한 서버·프론트 오류를 수집하고 처리 상태를 관리합니다."
      icon="system"
      icon-color="red"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>기간:</label>
            <input v-model="searchForm.startDate" type="date" class="date-input">
            <span class="separator">~</span>
            <input v-model="searchForm.endDate" type="date" class="date-input">
          </div>
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="status-select">
              <option value="">
                전체
              </option>
              <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>출처:</label>
            <select v-model="searchForm.errorSource" class="status-select">
              <option value="">
                전체
              </option>
              <option value="SERVER">
                서버
              </option>
              <option value="CLIENT">
                프론트
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="예외/메시지/API/화면"
              class="text-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 목록 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}건</span>
          </div>
          <div class="table-actions">
            <select v-model.number="pageSize" class="page-size-select" @change="handleSearch">
              <option :value="20">
                20개씩
              </option>
              <option :value="50">
                50개씩
              </option>
              <option :value="100">
                100개씩
              </option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" /><p>불러오는 중...</p>
        </div>
        <div v-else-if="items.length === 0" class="no-data-message">
          <i class="fas fa-check-circle" /><p>수집된 오류가 없습니다.</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">
                  출처
                </th>
                <th style="width: 160px;">
                  화면
                </th>
                <th>예외 / 메시지</th>
                <th style="width: 80px;">
                  발생
                </th>
                <th style="width: 70px;">
                  기록
                </th>
                <th style="width: 140px;">
                  최종 발생
                </th>
                <th style="width: 90px;">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in items" :key="row.id" class="clickable-row" @click="openDetail(row.id)">
                <td>
                  <span class="src-badge" :class="row.errorSource === 'SERVER' ? 'src-server' : 'src-client'">
                    {{ row.errorSource === 'SERVER' ? '서버' : '프론트' }}
                  </span>
                </td>
                <td class="text-left truncate" :title="row.screenRoute || ''">
                  {{ row.screenRoute || '-' }}
                </td>
                <td class="text-left">
                  <div class="exc-class">
                    {{ row.exceptionClass || '-' }}
                  </div>
                  <div class="exc-msg truncate" :title="row.message || ''">
                    {{ row.message || '' }}
                  </div>
                </td>
                <td class="text-center">
                  <strong>{{ row.occurrenceCount }}</strong>
                </td>
                <td class="text-center">
                  <span class="rec-count" :class="{ 'rec-zero': !row.commentCount }">
                    <i class="fas fa-comment-dots" /> {{ row.commentCount ?? 0 }}
                  </span>
                </td>
                <td>{{ formatDateTime(row.lastOccurredAt) }}</td>
                <td>
                  <span class="status-badge" :class="statusClass(row.status)">{{ STATUS_LABELS[row.status] || row.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 상세 모달 -->
    <Teleport to="body">
      <div v-if="showDetail && detail" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content">
          <div class="modal-header">
            <h3>오류 상세 #{{ detail.id }}</h3>
            <button class="modal-close" @click="closeDetail">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div><span class="dt-label">출처</span><span>{{ detail.errorSource === 'SERVER' ? '서버' : '프론트' }}</span></div>
              <div><span class="dt-label">상태</span><span class="status-badge" :class="statusClass(detail.status)">{{ STATUS_LABELS[detail.status] }}</span></div>
              <div><span class="dt-label">발생횟수</span><span>{{ detail.occurrenceCount }}회</span></div>
              <div><span class="dt-label">HTTP</span><span>{{ detail.httpStatus || '-' }}</span></div>
              <div><span class="dt-label">화면</span><span>{{ detail.screenRoute || '-' }}</span></div>
              <div><span class="dt-label">API</span><span>{{ detail.apiMethod || '' }} {{ detail.apiUrl || '-' }}</span></div>
              <div><span class="dt-label">사용자</span><span>{{ detail.userLoginId || '-' }} ({{ detail.userRole || '-' }})</span></div>
              <div><span class="dt-label">최초/최종</span><span>{{ formatDateTime(detail.firstOccurredAt) }} ~ {{ formatDateTime(detail.lastOccurredAt) }}</span></div>
            </div>

            <div class="dt-block">
              <div class="dt-label">
                예외
              </div>
              <div class="exc-class">
                {{ detail.exceptionClass }}
              </div>
              <div class="exc-msg">
                {{ detail.message }}
              </div>
            </div>

            <div class="dt-block">
              <div class="dt-label">
                스택트레이스
              </div>
              <pre class="stack-trace">{{ detail.stackTrace || '(없음)' }}</pre>
            </div>

            <!-- 상태 변경 -->
            <div class="dt-block status-edit">
              <div class="dt-label">
                상태 변경
              </div>
              <div class="status-edit-row">
                <select v-model="statusForm.status" class="status-select">
                  <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
                <input v-model="statusForm.assignee" type="text" placeholder="담당자" class="text-input">
                <button class="btn-submit" :disabled="savingStatus" @click="saveStatus">
                  저장
                </button>
              </div>
              <textarea v-model="statusForm.resolutionNote" placeholder="메모 / 코멘트 (선택) — 저장하면 아래 처리 기록에 남습니다. 상태를 바꾸면 변경 이력도 함께 기록됩니다." class="note-input" rows="2" />
            </div>

            <!-- 코멘트 -->
            <div class="dt-block">
              <div class="dt-label">
                처리 기록 / 코멘트
              </div>
              <div v-if="detail.comments && detail.comments.length" class="comment-list">
                <div v-for="c in detail.comments" :key="c.id" class="comment-item">
                  <div class="comment-meta">
                    <span :class="['comment-type', commentTypeClass(c.commentType)]">
                      {{ commentTypeLabel(c.commentType) }}
                    </span>
                    <span class="comment-author">{{ c.author || '-' }}</span>
                    <span class="comment-date">{{ formatDateTime(c.createdAt) }}</span>
                  </div>
                  <div class="comment-body">
                    {{ c.body }}
                  </div>
                </div>
              </div>
              <div v-else class="no-comment">
                처리 기록이 없습니다. 위 "상태 변경"에서 상태를 바꾸거나 메모를 남기면 여기에 이력으로 쌓입니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { errorReportService } from '~/services/error-report.service'
import type { ErrorReport } from '~/services/error-report.service'
import { formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'admin', pageTitle: '오류 게시판' })

const STATUS_LABELS: Record<string, string> = {
  NEW: '접수',
  ANALYZING: '분석중',
  IN_PROGRESS: '수정반영',
  DONE: '완료',
  IGNORED: '보류'
}

// 상태변경 이력은 comment_type 에 변경된 상태코드가 담긴다 → 상태명/상태색으로 표기
const commentTypeLabel = (type: string): string => {
  if (STATUS_LABELS[type]) { return STATUS_LABELS[type] }
  switch (type) {
    case 'AI_DIAGNOSIS': return 'AI 진단'
    case 'STATUS_CHANGE': return '상태변경' // 레거시 항목
    default: return '메모'
  }
}

const commentTypeClass = (type: string): string => {
  if (STATUS_LABELS[type]) { return statusClass(type) }
  switch (type) {
    case 'AI_DIAGNOSIS': return 'ct-ai'
    case 'STATUS_CHANGE': return 'ct-status'
    default: return 'ct-note'
  }
}

const statusClass = (status: string): string => {
  switch (status) {
    case 'NEW': return 'status-pending'
    case 'ANALYZING': return 'status-warning'
    case 'IN_PROGRESS': return 'status-in-progress'
    case 'DONE': return 'status-completed'
    case 'IGNORED': return 'status-cancelled'
    default: return ''
  }
}

const getTodayDate = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const getMonthAgo = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const searchForm = ref({
  startDate: getMonthAgo(),
  endDate: getTodayDate(),
  status: '',
  errorSource: '',
  keyword: ''
})

const items = ref<ErrorReport[]>([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const pageSize = ref(20)

const loadData = async () => {
  loading.value = true
  try {
    const res = await errorReportService.search({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      status: searchForm.value.status || undefined,
      errorSource: searchForm.value.errorSource || undefined,
      keyword: searchForm.value.keyword || undefined,
      page: currentPage.value,
      size: pageSize.value
    })
    items.value = res.content || []
    totalElements.value = res.totalElements || 0
    totalPages.value = res.totalPages || 0
  } catch (e) {
    // 조회 실패/무데이터 시 팝업 없이 빈 목록으로 표시 (콘솔에만 기록)
    console.error('오류 목록 조회 실패:', e)
    items.value = []
    totalElements.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 0
  loadData()
}
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

// ===== 상세 모달 =====
const showDetail = ref(false)
const detail = ref<ErrorReport | null>(null)
const statusForm = ref({ status: 'NEW', assignee: '', resolutionNote: '' })
const savingStatus = ref(false)

const openDetail = async (id: number) => {
  try {
    detail.value = await errorReportService.getById(id)
    statusForm.value = {
      status: detail.value.status,
      assignee: detail.value.assignee || '',
      // 메모는 변경 시점마다 처리 기록에 이력으로 남으므로 열 때 항상 빈값
      resolutionNote: ''
    }
    showDetail.value = true
  } catch (e) {
    console.error('상세 조회 실패:', e)
    alert('상세 정보를 불러오지 못했습니다.')
  }
}
const closeDetail = () => {
  showDetail.value = false
  detail.value = null
}

const saveStatus = async () => {
  if (!detail.value) { return }
  savingStatus.value = true
  try {
    await errorReportService.updateStatus(detail.value.id, { ...statusForm.value })
    statusForm.value.resolutionNote = ''
    await loadData()
    detail.value = await errorReportService.getById(detail.value.id)
  } catch (e) {
    console.error('상태 변경 실패:', e)
    alert('상태 변경에 실패했습니다.')
  } finally {
    savingStatus.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

.content-section { display: flex; flex-direction: column; gap: 1.25rem; }
.search-section-compact { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.search-row-single { display: flex; gap: 15px; flex-wrap: wrap; align-items: center; }
.search-item { display: flex; align-items: center; gap: 8px; }
.date-input, .text-input, .status-select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.text-input { width: 200px; }
.table-section { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.clickable-row { cursor: pointer; }
.clickable-row:hover { background: #f0f7ff; }
.text-left { text-align: left; }
/* admin-tables.css 의 `td { text-align:center }` 보다 우선하도록 specificity 보강 */
.data-table td.text-left { text-align: left; }
.rec-count { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #2563eb; font-weight: 600; }
.rec-count.rec-zero { color: #cbd5e1; font-weight: 400; }
.truncate { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.exc-class { font-weight: 600; color: #b91c1c; font-size: 13px; }
.exc-msg { color: #6b7280; font-size: 12px; }
.src-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.src-server { background: #fee2e2; color: #b91c1c; }
.src-client { background: #e0e7ff; color: #4338ca; }
.status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.status-pending { background: #e5e7eb; color: #6b7280; }
.status-warning { background: #fef3c7; color: #b45309; }
.status-in-progress { background: #dbeafe; color: #1e40af; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-cancelled { background: #fee2e2; color: #991b1b; }
.loading-message, .no-data-message { text-align: center; padding: 50px; color: #9ca3af; }

/* 모달 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: #fff; border-radius: 12px; width: 820px; max-width: 94vw; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #6b7280; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
.detail-grid > div { display: flex; gap: 8px; font-size: 13px; }
.dt-label { color: #6b7280; min-width: 64px; font-weight: 600; }
.dt-block { border-top: 1px solid #f1f5f9; padding-top: 12px; }
.stack-trace { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; max-height: 280px; white-space: pre-wrap; word-break: break-all; }
.status-edit-row { display: flex; gap: 8px; align-items: center; margin: 6px 0; }
.note-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box; }
.btn-submit { padding: 8px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: nowrap; }
.btn-submit:disabled { opacity: .6; cursor: not-allowed; }
.comment-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.comment-item { background: #f9fafb; border-radius: 8px; padding: 10px; }
.comment-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; margin-bottom: 4px; }
.comment-type { padding: 1px 8px; border-radius: 8px; font-weight: 600; }
.ct-ai { background: #ede9fe; color: #6d28d9; }
.ct-note { background: #e5e7eb; color: #4b5563; }
.ct-status { background: #dbeafe; color: #1e40af; }
.comment-author { font-weight: 600; }
.comment-date { color: #9ca3af; }
.comment-body { font-size: 13px; white-space: pre-wrap; }
.no-comment { color: #9ca3af; font-size: 13px; margin-bottom: 10px; }
.comment-add { display: flex; gap: 8px; align-items: flex-start; }
</style>
