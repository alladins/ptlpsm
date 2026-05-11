<template>
  <div class="demand-organization-selector">
    <!-- 수요기관 선택 버튼 -->
    <div class="selector-input">
      <input
        type="text"
        :value="selectedOrganizationName"
        placeholder="수요기관을 선택하세요"
        readonly
        class="form-input-base"
        :class="{ 'error': error }"
      >
      <button
        type="button"
        class="btn-select"
        @click="openModal"
      >
        <i class="fas fa-search" />
        선택
      </button>
    </div>

    <!-- 선택된 수요기관 표시 -->
    <div v-if="selectedOrganization" class="selected-info">
      <div class="info-item">
        <span class="label">기관코드:</span>
        <span class="value">{{ selectedOrganization.dminsttCd }}</span>
      </div>
      <div class="info-item">
        <span class="label">기관명:</span>
        <span class="value">{{ selectedOrganization.dminsttNm }}</span>
      </div>
    </div>

    <!-- 수요기관 선택 모달 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>수요기관 선택</h3>
          <button type="button" class="modal-close" @click="closeModal">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 검색 영역 -->
          <div class="search-section">
            <div class="search-input-group">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="기관코드, 기관명으로 검색"
                class="form-input-base"
                @keyup.enter="searchOrganizations"
              >
              <button
                type="button"
                class="btn-primary"
                @click="searchOrganizations"
              >
                <i class="fas fa-search" />
                검색
              </button>
            </div>
          </div>

          <!-- 총 건수 -->
          <div v-if="!loading && organizations.length > 0" class="total-count">
            총 <strong>{{ totalElements.toLocaleString() }}</strong>건
          </div>

          <!-- 수요기관 목록 -->
          <div class="organization-list">
            <div v-if="loading" class="loading">
              <i class="fas fa-spinner fa-spin" />
              <span>검색 중...</span>
            </div>

            <div v-else-if="organizations.length === 0" class="no-data">
              <i class="fas fa-search" />
              <span>검색 결과가 없습니다.</span>
            </div>

            <div v-else class="list-container">
              <div
                v-for="org in organizations"
                :key="org.id"
                class="organization-item"
                :class="{ 'selected': isSelected(org) }"
                @click="selectOrganization(org)"
              >
                <div class="org-info">
                  <div class="org-main">
                    <span v-if="org.naraJangteoNo" class="org-field"><span class="org-label">나라장터코드:</span> {{ org.naraJangteoNo }}</span>
                    <span class="org-field"><span class="org-label">기관코드:</span> {{ org.dminsttCd }}</span>
                    <span class="org-field"><span class="org-label">기관명:</span> {{ org.dminsttNm }}</span>
                  </div>
                  <div v-if="org.adrs" class="org-sub">
                    <span class="org-field"><span class="org-label">주소:</span> {{ org.adrs }} {{ org.dtlAdrs }}</span>
                  </div>
                </div>
                <div v-if="isSelected(org)" class="selected-icon">
                  <i class="fas fa-check-circle" />
                </div>
              </div>
            </div>
          </div>

          <!-- 페이징 -->
          <Pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :disabled="loading"
            :display-count="4"
            @change="changePage"
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">
            취소
          </button>
          <button
            type="button"
            :disabled="!tempSelectedOrganization"
            class="btn-primary"
            @click="confirmSelection"
          >
            선택
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { demandOrganizationService, type DemandOrganization } from '~/services/demand-organization.service'

interface Props {
  modelValue?: string // 수요기관코드
  error?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'organization-selected', organization: DemandOrganization): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 상태 관리
const showModal = ref(false)
const loading = ref(false)
const searchKeyword = ref('')
const organizations = ref<DemandOrganization[]>([])
const selectedOrganization = ref<DemandOrganization | null>(null)
const tempSelectedOrganization = ref<DemandOrganization | null>(null)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

// 선택된 기관명 계산
const selectedOrganizationName = computed(() => {
  return selectedOrganization.value?.dminsttNm || ''
})

// 모달 열기
const openModal = () => {
  showModal.value = true
  tempSelectedOrganization.value = selectedOrganization.value
  searchOrganizations()
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  searchKeyword.value = ''
  tempSelectedOrganization.value = null
  // selectedOrganization.value는 유지 (기존 선택 데이터 보존)
}

// 수요기관 검색
const searchOrganizations = async () => {
  try {
    loading.value = true
    currentPage.value = 0

    const response = await demandOrganizationService.searchDemandOrganizations({
      searchKeyword: searchKeyword.value,
      page: currentPage.value,
      size: 10,
      sortBy: 'naraJangteoNo',
      sortDirection: 'asc'
    })

    organizations.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
  } catch (error) {
    console.error('수요기관 검색 실패:', error)
    alert('수요기관 검색에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 페이지 변경
const changePage = async (page: number) => {
  if (page < 0 || page >= totalPages.value) { return }

  try {
    loading.value = true
    currentPage.value = page

    const response = await demandOrganizationService.searchDemandOrganizations({
      searchKeyword: searchKeyword.value,
      page: currentPage.value,
      size: 10,
      sortBy: 'naraJangteoNo',
      sortDirection: 'asc'
    })

    organizations.value = response.content
  } catch (error) {
    console.error('페이지 변경 실패:', error)
  } finally {
    loading.value = false
  }
}

// 수요기관 선택 (임시)
const selectOrganization = (org: DemandOrganization) => {
  tempSelectedOrganization.value = org
}

// 선택 확인
const confirmSelection = () => {
  if (tempSelectedOrganization.value) {
    selectedOrganization.value = tempSelectedOrganization.value
    console.log('🏢 DemandOrganizationSelector - 기관 선택 확인:', tempSelectedOrganization.value)
    emit('update:modelValue', tempSelectedOrganization.value.dminsttCd)
    emit('organization-selected', tempSelectedOrganization.value)
    console.log('📤 DemandOrganizationSelector - 이벤트 발생:', {
      dminsttCd: tempSelectedOrganization.value.dminsttCd,
      dminsttNm: tempSelectedOrganization.value.dminsttNm
    })
    closeModal()
  }
}

// 선택 여부 확인
const isSelected = (org: DemandOrganization): boolean => {
  return tempSelectedOrganization.value?.dminsttCd === org.dminsttCd
}

// 초기 데이터 로드 (props.modelValue가 있을 때)
const loadInitialData = async () => {
  if (props.modelValue) {
    try {
      // 수요기관코드로 기관 정보 조회
      const response = await demandOrganizationService.searchDemandOrganizations({
        searchKeyword: props.modelValue,
        page: 0,
        size: 1
      })

      if (response.content.length > 0) {
        const org = response.content[0]
        if (org.dminsttCd === props.modelValue) {
          selectedOrganization.value = org
        }
      }
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error)
    }
  }
}

// props.modelValue 변경 감지
watch(() => props.modelValue, loadInitialData, { immediate: true })
</script>

<style scoped>
.demand-organization-selector {
  width: 100%;
}

.selector-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.selector-input input {
  flex: 1;
  cursor: pointer;
}

.btn-select {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-select:hover {
  background: #2563eb;
}

.selected-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  font-weight: 500;
  color: #374151;
  min-width: 60px;
}

.info-item .value {
  color: #1f2937;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
}

.search-input-group input {
  flex: 1;
}

.total-count {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
}

.organization-list {
  margin-bottom: 1.5rem;
}

.loading, .no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  gap: 1rem;
}

.loading i, .no-data i {
  font-size: 2rem;
  opacity: 0.5;
}

.list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.organization-item {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.organization-item.selected {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding-left: calc(1rem - 4px);
}

.organization-item:hover {
  background: #f8fafc;
}

.organization-item.selected:hover {
  background: #dbeafe;
}

.organization-item:last-child {
  border-bottom: none;
}

.org-info {
  flex: 1;
  min-width: 0;
}

.org-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.org-sub {
  margin-top: 3px;
}

.org-field {
  font-size: 0.875rem;
  color: #1f2937;
}

.org-label {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin-right: 2px;
}

.org-sub .org-field {
  font-size: 0.8125rem;
  color: #6b7280;
}

.org-sub .org-label {
  color: #9ca3af;
}

.selected-icon {
  color: #3b82f6;
  font-size: 1.5rem;
  margin-left: 1rem;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .search-input-group {
    flex-direction: column;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
