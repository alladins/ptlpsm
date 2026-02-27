<template>
  <div class="code-management">
    <PageHeader
      title="코드관리"
      description="시스템에서 사용되는 코드 그룹과 코드 상세를 관리합니다."
    />

    <!-- 코드 관리 컨테이너 -->
    <div class="code-management-container">
      <!-- 코드 그룹 관리 섹션 -->
      <div class="code-groups-section">
        <!-- 통합 헤더: 타이틀 + 필터 + 검색 + 등록 (한 줄) -->
        <div class="integrated-header">
          <h2 class="section-title">코드 그룹 관리</h2>

          <select v-model="groupStatusFilter" class="filter-select">
            <option value="">전체</option>
            <option value="Y">사용</option>
            <option value="N">미사용</option>
          </select>

          <div class="search-box">
            <input
              v-model="groupSearchKeyword"
              type="text"
              placeholder="검색..."
              class="search-input"
              @keyup.enter="searchGroups"
            >
            <button @click="searchGroups" class="search-button">
              <i class="fas fa-search"></i>
            </button>
          </div>

          <button @click="openGroupModal('create')" class="btn-register">
            <i class="fas fa-plus"></i> 등록
          </button>
        </div>

        <!-- 코드 그룹 목록 -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="sortGroups('groupCode')" class="sortable">
                  코드 그룹 코드
                  <i :class="getSortIcon('groupCode', groupSortBy, groupSortOrder)"></i>
                </th>
                <th @click="sortGroups('groupName')" class="sortable">
                  코드 그룹명
                  <i :class="getSortIcon('groupName', groupSortBy, groupSortOrder)"></i>
                </th>
                <th @click="sortGroups('useYn')" class="sortable">
                  사용 여부
                  <i :class="getSortIcon('useYn', groupSortBy, groupSortOrder)"></i>
                </th>
                <th @click="sortGroups('createdAt')" class="sortable">
                  등록일
                  <i :class="getSortIcon('createdAt', groupSortBy, groupSortOrder)"></i>
                </th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="group in groupTable.items.value"
                :key="group.groupCode"
                class="table-row"
                :class="{ 'selected': selectedGroupCode === group.groupCode }"
                @click="selectGroup(group.groupCode)"
              >
                <td>{{ group.groupCode }}</td>
                <td>{{ group.groupName }}</td>
                <td>
                  <span :class="['status-badge', group.useYn === 'Y' ? 'active' : 'inactive']">
                    {{ group.useYn === 'Y' ? '사용' : '미사용' }}
                  </span>
                </td>
                <td>{{ formatDate(group.createdAt) }}</td>
                <td class="action-buttons">
                  <button @click.stop="openGroupModal('edit', group)" class="btn-edit" title="수정">
                    <i class="fas fa-edit"></i>
                    <span>수정</span>
                  </button>
                  <button @click.stop="deleteGroup(group.groupCode)" class="btn-delete" title="삭제">
                    <i class="fas fa-trash"></i>
                    <span>삭제</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination-section">
          <div class="pagination-info">
            총 {{ groupTable.totalElements.value }}개 중 {{ groupTable.startIndex.value }}-{{ groupTable.endIndex.value }}개 표시
          </div>
          <Pagination
            :current-page="groupTable.currentPage.value"
            :total-pages="groupTable.totalPages.value"
            @change="groupTable.changePage"
          />
        </div>
      </div>

      <!-- 코드 상세 관리 섹션 -->
      <div class="code-details-section">
        <!-- 통합 헤더: 타이틀 + 필터 + 검색 + 등록 (한 줄) -->
        <div class="integrated-header">
          <h2 class="section-title">코드 상세 관리</h2>

          <select v-model="detailStatusFilter" class="filter-select">
            <option value="">전체</option>
            <option value="Y">사용</option>
            <option value="N">미사용</option>
          </select>

          <div class="search-box">
            <input
              v-model="detailSearchKeyword"
              type="text"
              placeholder="검색..."
              class="search-input"
              @keyup.enter="searchDetails"
            >
            <button @click="searchDetails" class="search-button">
              <i class="fas fa-search"></i>
            </button>
          </div>

          <button
            @click="openDetailModal('create')"
            class="btn-register"
            :disabled="!selectedGroupCode"
          >
            <i class="fas fa-plus"></i> 등록
          </button>
        </div>

        <!-- 코드 상세 목록 -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="sortDetails('groupName')" class="sortable">
                  코드 그룹
                  <i :class="getSortIcon('groupName', detailSortBy, detailSortOrder)"></i>
                </th>
                <th @click="sortDetails('code')" class="sortable">
                  코드
                  <i :class="getSortIcon('code', detailSortBy, detailSortOrder)"></i>
                </th>
                <th @click="sortDetails('codeName')" class="sortable">
                  코드명
                  <i :class="getSortIcon('codeName', detailSortBy, detailSortOrder)"></i>
                </th>
                <th @click="sortDetails('sortOrder')" class="sortable">
                  정렬 순서
                  <i :class="getSortIcon('sortOrder', detailSortBy, detailSortOrder)"></i>
                </th>
                <th @click="sortDetails('useYn')" class="sortable">
                  사용 여부
                  <i :class="getSortIcon('useYn', detailSortBy, detailSortOrder)"></i>
                </th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!selectedGroupCode" class="no-selection-row">
                <td colspan="6" class="no-selection-message">
                  <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <span>코드 그룹을 선택해주세요</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="sortedDetails.length === 0" class="no-data-row">
                <td colspan="6" class="no-data-message">
                  <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <span>해당 그룹에 등록된 코드가 없습니다</span>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="detail in detailTable.items.value" :key="`${detail.groupCode}-${detail.code}`" class="table-row">
                <td>{{ detail.groupCode }}</td>
                <td>{{ detail.code }}</td>
                <td>{{ detail.codeName }}</td>
                <td>{{ detail.sortOrder }}</td>
                <td>
                  <span :class="['status-badge', detail.useYn === 'Y' ? 'active' : 'inactive']">
                    {{ detail.useYn === 'Y' ? '사용' : '미사용' }}
                  </span>
                </td>
                <td class="action-buttons">
                  <button @click="openDetailModal('edit', detail)" class="btn-edit" title="수정">
                    <i class="fas fa-edit"></i>
                    <span>수정</span>
                  </button>
                  <button @click="deleteDetail(detail.groupCode, detail.code)" class="btn-delete" title="삭제">
                    <i class="fas fa-trash"></i>
                    <span>삭제</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination-section">
          <div class="pagination-info">
            총 {{ detailTable.totalElements.value }}개 중 {{ detailTable.startIndex.value }}-{{ detailTable.endIndex.value }}개 표시
          </div>
          <Pagination
            :current-page="detailTable.currentPage.value"
            :total-pages="detailTable.totalPages.value"
            @change="detailTable.changePage"
          />
        </div>
      </div>
    </div>

    <!-- 코드 그룹 모달 -->
    <div v-if="showGroupModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ groupModalMode === 'create' ? '새 코드 그룹 등록' : '코드 그룹 수정' }}</h3>
          <button @click="closeGroupModal" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveGroup" class="form">
            <div class="form-group">
              <label for="groupCode">코드 그룹 코드 *</label>
              <input
                id="groupCode"
                v-model="groupForm.groupCode"
                type="text"
                required
                :disabled="groupModalMode === 'edit'"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="groupName">코드 그룹명 *</label>
              <input
                id="groupName"
                v-model="groupForm.groupName"
                type="text"
                required
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="groupDescription">설명</label>
              <textarea
                id="groupDescription"
                v-model="groupForm.description"
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="groupUseYn">사용 여부</label>
              <select id="groupUseYn" v-model="groupForm.useYn" class="form-select">
                <option value="Y">사용</option>
                <option value="N">미사용</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeGroupModal" class="btn-secondary">취소</button>
          <button @click="saveGroup" class="btn-primary">
            {{ groupModalMode === 'create' ? '등록' : '수정' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 코드 상세 모달 -->
    <div v-if="showDetailModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ detailModalMode === 'create' ? '새 코드 등록' : '코드 수정' }}</h3>
          <button @click="closeDetailModal" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDetail" class="form">
            <div class="form-group">
              <label for="detailGroupCode">코드 그룹 *</label>
              <select
                id="detailGroupCode"
                v-model="detailForm.groupCode"
                required
                class="form-select"
                :disabled="detailModalMode === 'create'"
              >
                <option value="">코드 그룹을 선택하세요</option>
                <option v-for="group in allCodeGroups" :key="group.groupCode" :value="group.groupCode">
                  {{ group.groupName }}
                </option>
              </select>
              <small v-if="detailModalMode === 'create' && selectedGroupCode" class="form-help">
                선택된 그룹: <strong>{{ getSelectedGroupName() }}</strong>
              </small>
            </div>
            <div class="form-group">
              <label for="detailCode">코드 *</label>
              <input
                id="detailCode"
                v-model="detailForm.code"
                type="text"
                required
                :disabled="detailModalMode === 'edit'"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="detailCodeName">코드명 *</label>
              <input
                id="detailCodeName"
                v-model="detailForm.codeName"
                type="text"
                required
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="detailDescription">설명</label>
              <textarea
                id="detailDescription"
                v-model="detailForm.description"
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="detailSortOrder">정렬 순서</label>
              <input
                id="detailSortOrder"
                v-model.number="detailForm.sortOrder"
                type="number"
                min="1"
                class="form-input"
              >
              <small v-if="detailModalMode === 'create'" class="form-help">
                자동으로 계산된 순서입니다. 필요시 수정 가능합니다.
              </small>
            </div>
            <div class="form-group">
              <label for="detailUseYn">사용 여부</label>
              <select id="detailUseYn" v-model="detailForm.useYn" class="form-select">
                <option value="Y">사용</option>
                <option value="N">미사용</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailModal" class="btn-secondary">취소</button>
          <button @click="saveDetail" class="btn-primary">
            {{ detailModalMode === 'create' ? '등록' : '수정' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { codeService, type CodeGroup, type CodeDetail } from '~/services/code.service'
import { useDataTable } from '~/composables/useDataTable'
import { formatDate } from '~/utils/format'

// 레이아웃 설정
definePageMeta({
  layout: 'admin'
})

// ===== 원본 데이터 (API에서 로드) =====
const allCodeGroups = ref<CodeGroup[]>([])
const allCodeDetails = ref<CodeDetail[]>([])

// ===== 검색/필터/정렬 상태 =====
// 코드 그룹
const groupSearchKeyword = ref('')
const groupStatusFilter = ref('')
const groupSortBy = ref('groupCode')
const groupSortOrder = ref<'asc' | 'desc'>('asc')
const selectedGroupCode = ref<string>('')

// 코드 상세
const detailSearchKeyword = ref('')
const detailStatusFilter = ref('')
const detailSortBy = ref('sortOrder')
const detailSortOrder = ref<'asc' | 'desc'>('asc')

// ===== useDataTable: 그룹용 =====
const groupTable = useDataTable<CodeGroup>({ initialPageSize: 10 })

// ===== useDataTable: 상세용 =====
const detailTable = useDataTable<CodeDetail>({ initialPageSize: 10 })

// ===== 모달 관련 데이터 =====
const showGroupModal = ref(false)
const groupModalMode = ref<'create' | 'edit'>('create')
const groupForm = ref({
  groupCode: '',
  groupName: '',
  description: '',
  useYn: 'Y' as 'Y' | 'N',
  sortOrder: 1
})

const showDetailModal = ref(false)
const detailModalMode = ref<'create' | 'edit'>('create')
const detailForm = ref({
  groupCode: '',
  code: '',
  codeName: '',
  description: '',
  sortOrder: 1,
  useYn: 'Y' as 'Y' | 'N'
})

// ===== 클라이언트 사이드 필터/정렬 (computed) =====
const filteredGroups = computed(() => {
  let filtered = allCodeGroups.value || []

  if (groupSearchKeyword.value) {
    const keyword = groupSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(group =>
      group.groupName.toLowerCase().includes(keyword) ||
      group.description?.toLowerCase().includes(keyword)
    )
  }

  if (groupStatusFilter.value) {
    filtered = filtered.filter(group => group.useYn === groupStatusFilter.value)
  }

  return filtered
})

const sortedGroups = computed(() => {
  const sorted = [...filteredGroups.value].sort((a: any, b: any) => {
    const aValue = a[groupSortBy.value]
    const bValue = b[groupSortBy.value]

    if (groupSortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return sorted
})

const filteredDetails = computed(() => {
  let filtered = allCodeDetails.value || []

  if (detailSearchKeyword.value) {
    const keyword = detailSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(detail =>
      detail.codeName.toLowerCase().includes(keyword) ||
      detail.description?.toLowerCase().includes(keyword)
    )
  }

  if (selectedGroupCode.value) {
    filtered = filtered.filter(detail => detail.groupCode === selectedGroupCode.value)
  }

  if (detailStatusFilter.value) {
    filtered = filtered.filter(detail => detail.useYn === detailStatusFilter.value)
  }

  return filtered
})

const sortedDetails = computed(() => {
  const sorted = [...filteredDetails.value].sort((a: any, b: any) => {
    // 기본적으로 정렬순서(sortOrder)로 정렬
    if (detailSortBy.value === 'sortOrder') {
      const aValue = a.sortOrder || 0
      const bValue = b.sortOrder || 0

      if (detailSortOrder.value === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    } else {
      // 다른 필드로 정렬할 때는 기존 로직 사용
      const aValue = a[detailSortBy.value]
      const bValue = b[detailSortBy.value]

      if (detailSortOrder.value === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    }
  })

  return sorted
})

// ===== 정렬/필터 변경 시 useDataTable에 데이터 반영 =====
watch(sortedGroups, (data) => {
  groupTable.setData(data)
}, { immediate: true })

watch(sortedDetails, (data) => {
  detailTable.setData(data)
}, { immediate: true })

// ===== API 호출 =====
const loadData = async () => {
  try {
    // 코드 그룹 로드
    const groups = await codeService.getCodeGroups()
    allCodeGroups.value = groups || []

    // 코드 상세는 선택된 그룹이 있을 때만 로드
    if (selectedGroupCode.value) {
      await loadCodeDetails(selectedGroupCode.value)
    } else {
      allCodeDetails.value = []
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error)
    allCodeGroups.value = []
    allCodeDetails.value = []
    alert('데이터를 불러오는데 실패했습니다.')
  }
}

const loadCodeDetails = async (groupCode: string) => {
  try {
    const details = await codeService.getCodeDetails(groupCode)
    allCodeDetails.value = details || []
  } catch (error) {
    console.error('코드 상세 로드 실패:', error)
    allCodeDetails.value = []
  }
}

// ===== 검색 (첫 페이지로 리셋) =====
const searchGroups = () => {
  groupTable.changePage(0)
}

const searchDetails = () => {
  detailTable.changePage(0)
}

// ===== 그룹 선택 =====
const selectGroup = (groupCode: string) => {
  selectedGroupCode.value = groupCode
  detailTable.changePage(0)
  // 그룹 선택 시 해당 그룹의 코드 상세 로드
  loadCodeDetails(groupCode)
}

const getSelectedGroupName = () => {
  const selectedGroup = allCodeGroups.value.find(group => group.groupCode === selectedGroupCode.value)
  return selectedGroup ? selectedGroup.groupName : ''
}

const getNextSortOrder = (groupCode: string) => {
  const existingCodes = allCodeDetails.value.filter(detail => detail.groupCode === groupCode)
  return existingCodes.length > 0
    ? Math.max(...existingCodes.map(d => d.sortOrder || 0)) + 1
    : 1
}

// ===== 정렬 토글 =====
const sortGroups = (field: string) => {
  if (groupSortBy.value === field) {
    groupSortOrder.value = groupSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    groupSortBy.value = field
    groupSortOrder.value = 'asc'
  }
}

const sortDetails = (field: string) => {
  if (detailSortBy.value === field) {
    detailSortOrder.value = detailSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    detailSortBy.value = field
    detailSortOrder.value = 'asc'
  }
}

const getSortIcon = (field: string, sortBy: string, sortOrder: string) => {
  if (sortBy !== field) return 'fas fa-sort'
  return sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
}

// ===== 모달 =====
const openGroupModal = (mode: 'create' | 'edit', group?: any) => {
  groupModalMode.value = mode
  if (mode === 'create') {
    groupForm.value = {
      groupCode: '',
      groupName: '',
      description: '',
      useYn: 'Y' as 'Y' | 'N',
      sortOrder: 1
    }
  } else if (group) {
    groupForm.value = { ...group }
  }
  showGroupModal.value = true
}

const closeGroupModal = () => {
  showGroupModal.value = false
  groupForm.value = {
    groupCode: '',
    groupName: '',
    description: '',
    useYn: 'Y' as 'Y' | 'N',
    sortOrder: 1
  }
}

const saveGroup = async () => {
  try {
    if (groupModalMode.value === 'create') {
      await codeService.createCodeGroup(groupForm.value)
      alert('코드 그룹이 등록되었습니다.')
    } else {
      await codeService.updateCodeGroup(groupForm.value.groupCode, groupForm.value)
      alert('코드 그룹이 수정되었습니다.')
    }
    closeGroupModal()
    await loadData()
  } catch (error) {
    console.error('코드 그룹 저장 실패:', error)
    alert('코드 그룹 저장에 실패했습니다.')
  }
}

const deleteGroup = async (groupCode: string) => {
  if (!confirm('정말로 이 코드 그룹을 삭제하시겠습니까?')) return

  try {
    await codeService.deleteCodeGroup(groupCode)
    alert('코드 그룹이 삭제되었습니다.')
    await loadData()
  } catch (error) {
    console.error('코드 그룹 삭제 실패:', error)
    alert('코드 그룹 삭제에 실패했습니다.')
  }
}

const openDetailModal = (mode: 'create' | 'edit', detail?: any) => {
  detailModalMode.value = mode
  if (mode === 'create') {
    detailForm.value = {
      groupCode: selectedGroupCode.value,
      code: '',
      codeName: '',
      description: '',
      sortOrder: getNextSortOrder(selectedGroupCode.value),
      useYn: 'Y' as 'Y' | 'N'
    }
  } else if (detail) {
    detailForm.value = { ...detail }
  }
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  detailForm.value = {
    groupCode: '',
    code: '',
    codeName: '',
    description: '',
    sortOrder: 1,
    useYn: 'Y' as 'Y' | 'N'
  }
}

const saveDetail = async () => {
  try {
    if (detailModalMode.value === 'create') {
      await codeService.createCodeDetail(detailForm.value)
      alert('코드가 등록되었습니다.')
    } else {
      await codeService.updateCodeDetail(detailForm.value.groupCode, detailForm.value.code, detailForm.value)
      alert('코드가 수정되었습니다.')
    }
    closeDetailModal()
    await loadData()
  } catch (error) {
    console.error('코드 저장 실패:', error)
    alert('코드 저장에 실패했습니다.')
  }
}

const deleteDetail = async (groupCode: string, code: string) => {
  if (!confirm('정말로 이 코드를 삭제하시겠습니까?')) return

  try {
    await codeService.deleteCodeDetail(groupCode, code)
    alert('코드가 삭제되었습니다.')
    await loadData()
  } catch (error) {
    console.error('코드 삭제 실패:', error)
    alert('코드 삭제에 실패했습니다.')
  }
}

// ===== 라이프사이클 =====
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ============================================
   공통 CSS Import
   ============================================ */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

/* ============================================
   페이지 특화 스타일만 작성
   - 공통 CSS에 이미 정의된 스타일은 제거됨
   - .form-input, .form-select, .btn-primary, .btn-secondary 등은 공통 CSS 사용
   - .modal-overlay, .modal-header, .modal-body 등은 공통 CSS 사용
   ============================================ */

.code-management-container {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.code-groups-section,
.code-details-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex: 1;
  min-width: 0;
}

/* 통합 헤더: 한 줄 배치 */
.integrated-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  margin-right: 8px;
}

.filter-select {
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  min-width: 80px;
  background: white;
  cursor: pointer;
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 250px;
}

.search-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px 0 0 4px;
  font-size: 12px;
  min-width: 120px;
}

.search-button {
  padding: 5px 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 13px;
  transition: background-color 0.2s;
}

.search-button:hover {
  background: #2563eb;
}

.btn-register {
  padding: 5px 10px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: background-color 0.2s;
  white-space: nowrap;
  margin-left: auto;
}

.btn-register:hover {
  background: #059669;
}

.btn-register:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* .btn-primary는 admin-buttons.css에서 제공 */

/* .table-container, .data-table은 admin-common.css에서 제공 */

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background: #f3f4f6;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row.selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.table-row.selected:hover {
  background: #dbeafe;
}

.no-selection-row,
.no-data-row {
  text-align: center;
}

.no-selection-message,
.no-data-message {
  padding: 60px 20px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 120px;
}

.empty-state i {
  font-size: 32px;
  color: #9ca3af;
}

.empty-state span {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
}

/* .status-badge는 admin-common.css에서 제공 */

/* 페이지 특화 상태 배지 스타일 */
.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #dc2626;
}

/* .action-buttons, .btn-edit, .btn-delete는 admin-buttons.css에서 제공 */

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  color: #6b7280;
  font-size: 13px;
}

/* Pagination 컴포넌트의 기본 margin/padding을 pagination-section 내부에서 제거 */
.pagination-section :deep(.pagination) {
  margin-top: 0;
  padding: 0;
}

/* .modal-overlay, .modal-content, .modal-header, .modal-close, .modal-body는 admin-modals.css에서 제공 */

/* .form-group, .form-input, .form-textarea, .form-select는 admin-common.css에서 제공 */

/* 페이지 특화 폼 스타일 */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-help {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

.form-select:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  padding: 6px 12px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Responsive */
@media (max-width: 768px) {
  .code-management-container {
    flex-direction: column;
    gap: 16px;
  }

  .code-groups-section,
  .code-details-section {
    flex: none;
  }

  .search-filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .filter-options {
    justify-content: space-between;
  }

  .pagination-section {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
