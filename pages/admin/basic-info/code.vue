<template>
  <div class="code-management">
    <UiPageHeader
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
                v-for="group in paginatedGroups" 
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
            총 {{ filteredGroups.length }}개 중 {{ (currentGroupPage - 1) * groupPageSize + 1 }}-{{ Math.min(currentGroupPage * groupPageSize, filteredGroups.length) }}개 표시
          </div>
          <div class="pagination-controls">
            <button 
              @click="currentGroupPage--" 
              :disabled="currentGroupPage === 1"
              class="pagination-button"
            >
              이전
            </button>
            
            <!-- 페이지 번호들 -->
            <div class="page-numbers">
              <button 
                v-for="pageNum in getGroupPageNumbers()" 
                :key="pageNum"
                @click="currentGroupPage = pageNum"
                :class="['page-number', { active: pageNum === currentGroupPage }]"
                :disabled="pageNum === currentGroupPage"
              >
                {{ pageNum }}
              </button>
            </div>
            
            <button 
              @click="currentGroupPage++" 
              :disabled="currentGroupPage === totalGroupPages"
              class="pagination-button"
            >
              다음
            </button>
          </div>
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
              <tr v-else-if="filteredDetails.length === 0" class="no-data-row">
                <td colspan="6" class="no-data-message">
                  <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <span>해당 그룹에 등록된 코드가 없습니다</span>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="detail in paginatedDetails" :key="`${detail.groupCode}-${detail.code}`" class="table-row">
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
            총 {{ filteredDetails.length }}개 중 {{ (currentDetailPage - 1) * detailPageSize + 1 }}-{{ Math.min(currentDetailPage * detailPageSize, filteredDetails.length) }}개 표시
          </div>
          <div class="pagination-controls">
            <button 
              @click="currentDetailPage--" 
              :disabled="currentDetailPage === 1"
              class="pagination-button"
            >
              이전
            </button>
            
            <!-- 페이지 번호들 -->
            <div class="page-numbers">
              <button 
                v-for="pageNum in getDetailPageNumbers()" 
                :key="pageNum"
                @click="currentDetailPage = pageNum"
                :class="['page-number', { active: pageNum === currentDetailPage }]"
                :disabled="pageNum === currentDetailPage"
              >
                {{ pageNum }}
              </button>
            </div>
            
            <button 
              @click="currentDetailPage++" 
              :disabled="currentDetailPage === totalDetailPages"
              class="pagination-button"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 코드 그룹 모달 -->
    <div v-if="showGroupModal" class="modal-overlay" @click="closeGroupModal">
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
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
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
                <option v-for="group in codeGroups" :key="group.groupCode" :value="group.groupCode">
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
import { useRouter } from '#imports'
import { codeService } from '~/services/code.service'

// 레이아웃 설정
definePageMeta({
  layout: 'admin'
})

// Router
const router = useRouter()

// Reactive data
// 코드 그룹 관련 데이터
const codeGroups = ref<any[]>([])
const groupSearchKeyword = ref('')
const groupStatusFilter = ref('')
const groupSortBy = ref('groupCode')
const groupSortOrder = ref<'asc' | 'desc'>('asc')
const currentGroupPage = ref(1)
const groupPageSize = ref(10)
const selectedGroupCode = ref<string>('')

// 코드 상세 관련 데이터
const codeDetails = ref<any[]>([])
const detailSearchKeyword = ref('')
const detailStatusFilter = ref('')
const detailSortBy = ref('sortOrder') // 기본 정렬을 정렬순서로 변경
const detailSortOrder = ref<'asc' | 'desc'>('asc')
const currentDetailPage = ref(1)
const detailPageSize = ref(10)

// 모달 관련 데이터
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

// Computed properties
const filteredGroups = computed(() => {
  let filtered = codeGroups.value || []

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
  const sorted = [...filteredGroups.value].sort((a, b) => {
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

const paginatedGroups = computed(() => {
  const start = (currentGroupPage.value - 1) * groupPageSize.value
  const end = start + groupPageSize.value
  return sortedGroups.value.slice(start, end)
})

const totalGroupPages = computed(() => Math.ceil(filteredGroups.value.length / groupPageSize.value))

const filteredDetails = computed(() => {
  let filtered = codeDetails.value || []

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
  const sorted = [...filteredDetails.value].sort((a, b) => {
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

const paginatedDetails = computed(() => {
  const start = (currentDetailPage.value - 1) * detailPageSize.value
  const end = start + detailPageSize.value
  return sortedDetails.value.slice(start, end)
})

const totalDetailPages = computed(() => Math.ceil(filteredDetails.value.length / detailPageSize.value))

// Methods
const loadData = async () => {
  try {
    console.log('데이터 로딩 시작...')
    // 코드 그룹만 먼저 로드
    const groups = await codeService.getCodeGroups()
    console.log('로드된 코드 그룹:', groups)
    codeGroups.value = groups || []
    
    // 코드 상세는 선택된 그룹이 있을 때만 로드
    if (selectedGroupCode.value) {
      await loadCodeDetails(selectedGroupCode.value)
    } else {
      codeDetails.value = []
    }
    
    console.log('데이터 로딩 완료')
  } catch (error) {
    console.error('데이터 로드 실패:', error)
    // 에러 발생 시에도 빈 배열로 초기화하여 UI 에러 방지
    codeGroups.value = []
    codeDetails.value = []
    alert('데이터를 불러오는데 실패했습니다.')
  }
}

const loadCodeDetails = async (groupCode: string) => {
  try {
    console.log('코드 상세 로딩:', groupCode)
    const details = await codeService.getCodeDetails(groupCode)
    console.log('로드된 코드 상세:', details)
    codeDetails.value = details || []
  } catch (error) {
    console.error('코드 상세 로드 실패:', error)
    codeDetails.value = []
  }
}

const searchGroups = () => {
  currentGroupPage.value = 1
}

const searchDetails = () => {
  currentDetailPage.value = 1
}

const selectGroup = (groupCode: string) => {
  selectedGroupCode.value = groupCode
  currentDetailPage.value = 1
  // 그룹 선택 시 해당 그룹의 코드 상세 로드
  loadCodeDetails(groupCode)
}

const getSelectedGroupName = () => {
  const selectedGroup = codeGroups.value.find(group => group.groupCode === selectedGroupCode.value)
  return selectedGroup ? selectedGroup.groupName : ''
}

const getNextSortOrder = (groupCode: string) => {
  const existingCodes = codeDetails.value.filter(detail => detail.groupCode === groupCode)
  return existingCodes.length > 0 
    ? Math.max(...existingCodes.map(d => d.sortOrder || 0)) + 1 
    : 1
}

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
      groupCode: selectedGroupCode.value, // 선택된 그룹 코드로 자동 설정
      code: '',
      codeName: '',
      description: '',
      sortOrder: getNextSortOrder(selectedGroupCode.value), // 자동 계산된 정렬순서
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ko-KR')
}

const testApiConnection = async () => {
  try {
    const result = await codeService.testApiConnection()
    if (result.success) {
      alert(`✅ ${result.message}\nURL: ${result.url}`)
    } else {
      alert(`❌ ${result.message}\nURL: ${result.url}`)
    }
  } catch (error) {
    alert(`❌ API 연결 테스트 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const getGroupPageNumbers = () => {
  const pages = []
  const totalPagesNum = totalGroupPages.value
  
  if (totalPagesNum <= 5) {
    // 전체 페이지가 5개 이하면 모든 페이지 번호 표시
    for (let i = 1; i <= totalPagesNum; i++) {
      pages.push(i)
    }
  } else {
    // 전체 페이지가 5개 초과면 현재 페이지 기준으로 5개 표시
    let start = Math.max(1, currentGroupPage.value - 1)
    let end = Math.min(totalPagesNum, start + 4)
    
    // 끝에서 5개가 되도록 조정
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
}

const getDetailPageNumbers = () => {
  const pages = []
  const totalPagesNum = totalDetailPages.value
  
  if (totalPagesNum <= 5) {
    // 전체 페이지가 5개 이하면 모든 페이지 번호 표시
    for (let i = 1; i <= totalPagesNum; i++) {
      pages.push(i)
    }
  } else {
    // 전체 페이지가 5개 초과면 현재 페이지 기준으로 5개 표시
    let start = Math.max(1, currentDetailPage.value - 1)
    let end = Math.min(totalPagesNum, start + 4)
    
    // 끝에서 5개가 되도록 조정
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
}

// Watchers

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.code-management)
   - 버튼 스타일 (.btn-action, .btn-edit, .btn-delete)
   - 검색 영역 스타일
   - 테이블 스타일 (.data-table)
   - 페이지네이션 스타일
   ============================================ */

/* 페이지 특화 스타일만 작성 */

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

.btn-primary {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-primary:disabled:hover {
  background: #9ca3af;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
}



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

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #3b82f6;
  color: white;
}

.btn-edit:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

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

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-button {
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.pagination-button:hover:not(:disabled) {
  background: #f9fafb;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 2px;
}

.page-number {
  padding: 5px 9px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  min-width: 30px;
  text-align: center;
  font-size: 13px;
}

.page-number:hover:not(:disabled) {
  background: #f9fafb;
}

.page-number.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 16px 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 7px 11px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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
