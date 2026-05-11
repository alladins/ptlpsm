<template>
  <div class="organization-management">
    <div class="page-header-compact">
      <h1>수요기관관리</h1>
      <span class="page-description">수요기관 정보를 관리합니다.</span>
    </div>
    <!-- 검색 영역 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>검색어</label>
          <input
            v-model="searchForm.searchKeyword"
            type="text"
            placeholder="수요기관코드, 수요기관명, 사업자등록번호"
            class="text-input"
            @keyup.enter="searchOrganizations"
          >
        </div>
        <div class="search-item">
          <label>지역</label>
          <select v-model="searchForm.rgnCd" class="status-select">
            <option value="">
              전체
            </option>
            <option v-for="region in regions" :key="region.code" :value="region.code">
              {{ region.codeName }}
            </option>
          </select>
        </div>
        <button class="btn-search-inline" @click="searchOrganizations">
          <i class="fas fa-search" /> 검색
        </button>
        <button class="btn-search-inline" style="background: #16a34a; color: white; border-color: #16a34a;" @click="openAddModal">
          <i class="fas fa-plus" /> 등록
        </button>
        <button v-if="isSystemAdmin" class="btn-secondary-sm" :disabled="syncing" @click="openSyncModal">
          <i class="fas" :class="syncing ? 'fa-spinner fa-spin' : 'fa-sync'" />
          {{ syncing ? '동기화 중...' : '나라장터 동기화' }}
        </button>
      </div>
    </div>

    <!-- 수요기관 목록 테이블 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
        </div>
        <div class="table-actions">
          <select :value="pageSize" class="page-size-select" @change="changePageSize(Number(($event.target as HTMLSelectElement).value))">
            <option :value="10">
              10개씩
            </option>
            <option :value="20">
              20개씩
            </option>
            <option :value="50">
              50개씩
            </option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>수요기관코드</th>
              <th>수요기관명</th>
              <th>나라장터등록번호</th>
              <th>사업자등록번호</th>
              <th>지역명</th>
              <th>전화번호</th>
              <th>삭제여부</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="organization in organizations" :key="organization.id" class="table-row">
              <td>{{ organization.dminsttCd }}</td>
              <td>{{ organization.dminsttNm }}</td>
              <td>{{ organization.naraJangteoNo || '-' }}</td>
              <td>{{ organization.bizno || '-' }}</td>
              <td>{{ organization.rgnNm || '-' }}</td>
              <td>{{ organization.telNo || '-' }}</td>
              <td>
                <span class="status-badge" :class="{ deleted: organization.dltYn === 'Y' }">
                  {{ organization.dltYn === 'Y' ? '삭제' : '활성' }}
                </span>
              </td>
              <td class="action-buttons">
                <button class="btn-icon btn-edit" title="수정" @click="openEditModal(organization)">
                  <i class="fas fa-edit" />
                </button>
                <button class="btn-icon btn-delete" title="삭제" @click="deleteOrganization(organization)">
                  <i class="fas fa-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 데이터가 없을 때 -->
        <div v-if="organizations.length === 0 && !loading" class="no-data-message">
          <i class="fas fa-building" />
          <p>등록된 수요기관이 없습니다.</p>
        </div>

        <!-- 로딩 중 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :disabled="loading"
        @change="changePage"
      />
    </div>

    <!-- 수요기관 등록/수정 통합 모달 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '수요기관 등록' : '수요기관 수정' }}</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <form class="organization-form" @submit.prevent="handleFormSubmit">
            <div class="form-row">
              <div class="form-group">
                <label>수요기관코드 *</label>
                <input
                  v-model="formData.dminsttCd"
                  type="text"
                  required
                  placeholder="수요기관코드"
                  maxlength="10"
                  class="form-input"
                  :disabled="showEditModal"
                >
              </div>
              <div class="form-group">
                <label>수요기관명 *</label>
                <input
                  v-model="formData.dminsttNm"
                  type="text"
                  required
                  placeholder="수요기관명"
                  maxlength="200"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>나라장터등록번호</label>
                <input
                  v-model="formData.naraJangteoNo"
                  type="text"
                  placeholder="나라장터등록번호"
                  maxlength="50"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>사업자등록번호</label>
                <input
                  v-model="formData.bizno"
                  type="text"
                  placeholder="사업자등록번호"
                  maxlength="10"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>법인등록번호</label>
                <input
                  v-model="formData.corprtRgstNo"
                  type="text"
                  placeholder="법인등록번호"
                  maxlength="13"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>수요기관영문명</label>
                <input
                  v-model="formData.dminsttEngNm"
                  type="text"
                  placeholder="수요기관영문명"
                  maxlength="400"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>업태명</label>
                <input
                  v-model="formData.bizcndtnNm"
                  type="text"
                  placeholder="업태명"
                  maxlength="50"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>업종명</label>
                <input
                  v-model="formData.indstrytyNm"
                  type="text"
                  placeholder="업종명"
                  maxlength="50"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>담당자팩스번호</label>
                <input
                  v-model="formData.ofclFaxNo"
                  type="text"
                  placeholder="담당자팩스번호"
                  maxlength="25"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>지역</label>
                <select v-model="selectedRegion" class="form-select" @change="onRegionChange">
                  <option value="">
                    지역을 선택하세요
                  </option>
                  <option v-for="region in regions" :key="region.code" :value="region">
                    {{ region.codeName }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 지역코드와 지역명은 숨김 처리 (데이터는 유지) -->
            <input v-model="formData.rgnCd" type="hidden">
            <input v-model="formData.rgnNm" type="hidden">

            <div class="form-row">
              <div class="form-group">
                <label>홈페이지주소</label>
                <input
                  v-model="formData.hmpgAdrs"
                  type="text"
                  placeholder="홈페이지주소"
                  maxlength="255"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>우편번호</label>
                <div class="zip-input-group">
                  <input
                    v-model="formData.zip"
                    type="text"
                    placeholder="우편번호"
                    maxlength="6"
                    class="form-input zip-input"
                  >
                  <button type="button" class="btn-secondary zip-search-btn" @click="searchZipcode">
                    <i class="fas fa-search" />
                    <span>우편번호 찾기</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>주소</label>
                <input
                  v-model="formData.adrs"
                  type="text"
                  placeholder="주소"
                  maxlength="100"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>상세주소</label>
                <input
                  v-model="formData.dtlAdrs"
                  type="text"
                  placeholder="상세주소"
                  maxlength="100"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>전화번호</label>
                <input
                  v-model="formData.telNo"
                  type="text"
                  placeholder="전화번호"
                  maxlength="25"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>팩스번호</label>
                <input
                  v-model="formData.faxNo"
                  type="text"
                  placeholder="팩스번호"
                  maxlength="25"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save" />
                <span>{{ showAddModal ? '등록' : '수정' }}</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeModal">
                <i class="fas fa-times" />
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <!-- 나라장터 동기화 모달 -->
    <div v-if="showSyncModal" class="modal-overlay">
      <div class="modal sync-modal" @click.stop>
        <div class="modal-header">
          <h3>나라장터 수요기관 동기화</h3>
          <button v-if="!syncing" class="modal-close" @click="closeSyncModal">
            <i class="fas fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <!-- 연도 입력 (동기화 시작 전) -->
          <template v-if="!syncing && !syncResult">
            <p class="sync-description">
              동기화할 연도 범위를 지정하세요. 범위가 크면 시간이 오래 걸릴 수 있으므로 10년 이내로 설정을 권장합니다.
            </p>
            <div class="sync-form">
              <div class="form-row">
                <div class="form-group">
                  <label>시작 연도</label>
                  <input
                    v-model.number="syncForm.bgnYear"
                    type="number"
                    min="1900"
                    :max="syncForm.endYear"
                    class="form-input"
                    placeholder="시작 연도"
                  >
                </div>
                <div class="form-group">
                  <label>종료 연도</label>
                  <input
                    v-model.number="syncForm.endYear"
                    type="number"
                    :min="syncForm.bgnYear"
                    :max="new Date().getFullYear() + 1"
                    class="form-input"
                    placeholder="종료 연도"
                  >
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-primary" @click="syncFromG2b">
                <i class="fas fa-sync" />
                <span>동기화 시작</span>
              </button>
              <button class="btn-secondary" @click="closeSyncModal">
                <i class="fas fa-times" />
                <span>취소</span>
              </button>
            </div>
          </template>

          <!-- 진행상황 표시 (동기화 중) -->
          <template v-if="syncing && syncProgress">
            <div class="sync-progress">
              <div class="progress-header">
                <span class="progress-status">
                  <i class="fas fa-spinner fa-spin" />
                  동기화 진행 중 ({{ syncProgress.bgnYear }}~{{ syncProgress.endYear }}년)
                </span>
              </div>

              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: progressPercent + '%' }" />
              </div>
              <div class="progress-percent">
                {{ progressPercent }}%
              </div>

              <div class="progress-details">
                <div class="progress-item">
                  <span class="label">현재 처리 연도</span>
                  <span class="value">{{ syncProgress.currentYear || '-' }}년</span>
                </div>
                <div class="progress-item">
                  <span class="label">API 수집</span>
                  <span class="value">{{ syncProgress.totalFetched.toLocaleString() }}건</span>
                </div>
                <div class="progress-item">
                  <span class="label">처리 진행</span>
                  <span class="value">{{ syncProgress.processedCount.toLocaleString() }} / {{ syncProgress.totalFetched.toLocaleString() }}건</span>
                </div>
                <div class="progress-item">
                  <span class="label">신규 등록</span>
                  <span class="value highlight-new">{{ syncProgress.newCount.toLocaleString() }}건</span>
                </div>
                <div class="progress-item">
                  <span class="label">업데이트</span>
                  <span class="value highlight-update">{{ syncProgress.updatedCount.toLocaleString() }}건</span>
                </div>
                <div v-if="syncProgress.failedCount > 0" class="progress-item">
                  <span class="label">실패</span>
                  <span class="value highlight-fail">{{ syncProgress.failedCount.toLocaleString() }}건</span>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-danger" @click="cancelSync">
                  <i class="fas fa-stop" />
                  <span>동기화 중지</span>
                </button>
              </div>
            </div>
          </template>

          <!-- 완료 결과 표시 -->
          <template v-if="syncResult">
            <div class="sync-result">
              <div class="result-icon" :class="syncResult.status === 'COMPLETED' ? 'success' : syncResult.status === 'CANCELLED' ? 'warning' : 'error'">
                <i class="fas" :class="syncResult.status === 'COMPLETED' ? 'fa-check-circle' : syncResult.status === 'CANCELLED' ? 'fa-exclamation-circle' : 'fa-times-circle'" />
              </div>
              <h4>{{ syncResult.status === 'COMPLETED' ? '동기화 완료' : syncResult.status === 'CANCELLED' ? '동기화 취소됨' : '동기화 실패' }}</h4>
              <p v-if="syncResult.errorMessage" class="error-message">
                {{ syncResult.errorMessage }}
              </p>

              <div class="progress-details">
                <div class="progress-item">
                  <span class="label">조회 범위</span>
                  <span class="value">{{ syncResult.bgnYear }}~{{ syncResult.endYear }}년</span>
                </div>
                <div class="progress-item">
                  <span class="label">총 수집</span>
                  <span class="value">{{ syncResult.totalFetched.toLocaleString() }}건</span>
                </div>
                <div class="progress-item">
                  <span class="label">신규 등록</span>
                  <span class="value highlight-new">{{ syncResult.newCount.toLocaleString() }}건</span>
                </div>
                <div class="progress-item">
                  <span class="label">업데이트</span>
                  <span class="value highlight-update">{{ syncResult.updatedCount.toLocaleString() }}건</span>
                </div>
                <div v-if="syncResult.failedCount > 0" class="progress-item">
                  <span class="label">실패</span>
                  <span class="value highlight-fail">{{ syncResult.failedCount.toLocaleString() }}건</span>
                </div>
              </div>

              <!-- 실패 상세 -->
              <div v-if="syncResult.failedDetails && syncResult.failedDetails.length > 0" class="failed-details">
                <h5>실패 상세</h5>
                <ul>
                  <li v-for="(detail, idx) in syncResult.failedDetails" :key="idx">
                    {{ detail }}
                  </li>
                </ul>
              </div>

              <div class="form-actions">
                <button class="btn-primary" @click="closeSyncModal">
                  <i class="fas fa-check" />
                  <span>확인</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { demandOrganizationService, type DemandOrganization, type G2bSyncStatusResponse } from '~/services/demand-organization.service'
import { codeService } from '~/services/code.service'
import { useDataTable } from '~/composables/useDataTable'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  pageTitle: '수요기관관리'
})

useHead({
  title: '수요기관관리 - PTPLPSM',
  meta: [
    { name: 'description', content: '수요기관 정보 관리' }
  ]
})

const authStore = useAuthStore()
const isSystemAdmin = computed(() => authStore.user?.role === 'SYSTEM_ADMIN')

// 검색 폼
const searchForm = ref({
  searchKeyword: '',
  rgnCd: '',
  dltYn: '',
  sortBy: 'naraJangteoNo',
  sortDirection: 'asc'
})

// 지역 목록
const regions = ref<any[]>([])

// 선택된 지역 (콤보박스용)
const selectedRegion = ref<any>(null)

// useDataTable composable 사용으로 페이지네이션 로직 통합
const {
  items: organizations,
  loading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  startIndex,
  endIndex,
  changePage,
  changePageSize,
  search,
  refresh
} = useDataTable<DemandOrganization>({
  fetchFunction: async (params) => {
    // 검색 조건이 있으면 searchDemandOrganizations, 없으면 getDemandOrganizations 호출
    if (searchForm.value.searchKeyword || searchForm.value.rgnCd || searchForm.value.dltYn) {
      return await demandOrganizationService.searchDemandOrganizations({
        searchKeyword: searchForm.value.searchKeyword,
        rgnCd: searchForm.value.rgnCd,
        dltYn: searchForm.value.dltYn,
        page: params.page || 0,
        size: params.size || 10,
        sortBy: searchForm.value.sortBy,
        sortDirection: searchForm.value.sortDirection
      })
    } else {
      return await demandOrganizationService.getDemandOrganizations({
        page: params.page || 0,
        size: params.size || 10,
        sortBy: searchForm.value.sortBy,
        sortDirection: searchForm.value.sortDirection
      })
    }
  },
  initialPageSize: 10
})

// 모달 상태
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingOrganization = ref<DemandOrganization | null>(null)

// 폼 데이터
const formData = ref<DemandOrganization>({
  dminsttCd: '',
  dminsttNm: '',
  dminsttAbrvtNm: '',
  dminsttEngNm: '',
  corprtRgstNo: '',
  bizno: '',
  naraJangteoNo: '',
  jrsdctnDivNm: '',
  insttTyCdLrgclsfcNm: '',
  insttTyCdMidclsfcNm: '',
  insttTyCdSmlclsfcNm: '',
  bizcndtnNm: '',
  indstrytyNm: '',
  ofclFaxNo: '',
  rgnCd: '',
  rgnNm: '',
  zip: '',
  adrs: '',
  dtlAdrs: '',
  telNo: '',
  faxNo: '',
  hmpgAdrs: '',
  dltYn: 'N',
  toplvlInsttCd: '',
  toplvlInsttNm: '',
  vldPrdBgnDt: '',
  vldPrdEndDt: '',
  rgstDt: '',
  chgDt: ''
})

// 나라장터 동기화 상태
const syncing = ref(false)
const showSyncModal = ref(false)
const syncForm = ref({
  bgnYear: new Date().getFullYear(),
  endYear: new Date().getFullYear()
})
const syncProgress = ref<G2bSyncStatusResponse | null>(null)
const syncResult = ref<G2bSyncStatusResponse | null>(null)
const syncBatchId = ref<string | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

// 검색
const searchOrganizations = () => {
  search()
}

// 등록 모달 열기
const openAddModal = () => {
  formData.value = {
    dminsttCd: '',
    dminsttNm: '',
    dminsttAbrvtNm: '',
    dminsttEngNm: '',
    corprtRgstNo: '',
    bizno: '',
    naraJangteoNo: '',
    jrsdctnDivNm: '',
    insttTyCdLrgclsfcNm: '',
    insttTyCdMidclsfcNm: '',
    insttTyCdSmlclsfcNm: '',
    bizcndtnNm: '',
    indstrytyNm: '',
    ofclFaxNo: '',
    rgnCd: '',
    rgnNm: '',
    zip: '',
    adrs: '',
    dtlAdrs: '',
    telNo: '',
    faxNo: '',
    hmpgAdrs: '',
    dltYn: 'N',
    toplvlInsttCd: '',
    toplvlInsttNm: '',
    vldPrdBgnDt: '',
    vldPrdEndDt: '',
    rgstDt: '',
    chgDt: ''
  }
  selectedRegion.value = null
  showAddModal.value = true
}

// 수정 모달 열기
const openEditModal = (organization: DemandOrganization) => {
  editingOrganization.value = organization
  formData.value = { ...organization }

  // 기존 지역 정보로 선택된 지역 설정
  if (organization.rgnCd && organization.rgnNm) {
    selectedRegion.value = regions.value.find(region =>
      region.code === organization.rgnCd && region.codeName === organization.rgnNm
    ) || null
  } else {
    selectedRegion.value = null
  }

  showEditModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingOrganization.value = null
  selectedRegion.value = null
}

// 유효성 검사
const validateForm = async (): Promise<boolean> => {
  if (!formData.value.dminsttCd || formData.value.dminsttCd.length > 10) {
    alert('수요기관코드를 입력해주세요. (최대 10자리)')
    return false
  }

  if (!formData.value.dminsttNm) {
    alert('수요기관명을 입력해주세요.')
    return false
  }

  // 등록 시에만 수요기관코드 중복 확인
  if (showAddModal.value) {
    try {
      const checkResult = await demandOrganizationService.checkDemandOrganizationCode(formData.value.dminsttCd)
      if (checkResult.exists) {
        alert(checkResult.message)
        return false
      }
    } catch (error) {
      console.error('수요기관코드 중복 확인 실패:', error)
      // 중복 확인 실패 시에도 진행
    }
  }

  return true
}

// 통합 폼 제출 핸들러
const handleFormSubmit = async () => {
  if (showAddModal.value) {
    await submitAdd()
  } else {
    await submitEdit()
  }
}

// 등록
const submitAdd = async () => {
  if (!(await validateForm())) { return }

  try {
    await demandOrganizationService.createDemandOrganization(formData.value)
    closeModal()
    refresh()
    alert('수요기관이 성공적으로 등록되었습니다.')
  } catch (error) {
    console.error('수요기관 등록 실패:', error)
    alert(error instanceof Error ? error.message : '수요기관 등록에 실패했습니다.')
  }
}

// 수정
const submitEdit = async () => {
  if (!(await validateForm()) || !editingOrganization.value) { return }

  try {
    // 백엔드에서는 dminsttCd를 기반으로 수요기관을 찾으므로 dminsttCd를 전달
    await demandOrganizationService.updateDemandOrganization(editingOrganization.value.dminsttCd!, formData.value)
    closeModal()
    refresh()
    alert('수요기관이 성공적으로 수정되었습니다.')
  } catch (error) {
    console.error('수요기관 수정 실패:', error)
    alert(error instanceof Error ? error.message : '수요기관 수정에 실패했습니다.')
  }
}

// 삭제
const deleteOrganization = async (organization: DemandOrganization) => {
  if (!confirm('정말 삭제하시겠습니까?')) { return }

  try {
    // 백엔드에서는 dminsttCd를 기반으로 수요기관을 찾으므로 dminsttCd를 전달
    await demandOrganizationService.deleteDemandOrganization(organization.dminsttCd!)
    refresh()
    alert('수요기관이 성공적으로 삭제되었습니다.')
  } catch (error) {
    console.error('수요기관 삭제 실패:', error)
    alert(error instanceof Error ? error.message : '수요기관 삭제에 실패했습니다.')
  }
}

// 진행률 계산
const progressPercent = computed(() => {
  if (!syncProgress.value || syncProgress.value.totalFetched === 0) { return 0 }
  return Math.round((syncProgress.value.processedCount / syncProgress.value.totalFetched) * 100)
})

// 나라장터 동기화 모달 열기
const openSyncModal = () => {
  syncForm.value = {
    bgnYear: new Date().getFullYear(),
    endYear: new Date().getFullYear()
  }
  syncProgress.value = null
  syncResult.value = null
  showSyncModal.value = true
}

// 나라장터 동기화 모달 닫기
const closeSyncModal = () => {
  stopPolling()
  showSyncModal.value = false
  syncProgress.value = null
  syncResult.value = null
  syncing.value = false
  if (syncResult.value) {
    refresh()
  }
}

// 폴링 시작
const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (!syncBatchId.value) { return }
    try {
      const status = await demandOrganizationService.getSyncStatus(syncBatchId.value)
      syncProgress.value = status

      // 완료/실패/취소 시 폴링 중지
      if (status.status !== 'RUNNING') {
        stopPolling()
        syncing.value = false
        syncResult.value = status
        syncProgress.value = null
        refresh()
      }
    } catch (error) {
      console.error('진행상황 조회 실패:', error)
    }
  }, 2000) // 2초마다 폴링
}

// 폴링 중지
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 나라장터 수요기관 동기화 실행 (비동기)
const syncFromG2b = async () => {
  const { bgnYear, endYear } = syncForm.value

  if (bgnYear > endYear) {
    alert('시작 연도가 종료 연도보다 클 수 없습니다.')
    return
  }

  if (endYear - bgnYear > 10) {
    if (!confirm(`${endYear - bgnYear + 1}년 범위를 조회합니다.\n범위가 크면 시간이 오래 걸릴 수 있습니다.\n계속하시겠습니까?`)) { return }
  }

  syncing.value = true
  syncResult.value = null
  try {
    // 비동기 동기화 시작 → 즉시 응답
    const response = await demandOrganizationService.startSyncFromG2b(bgnYear, endYear)
    syncBatchId.value = response.syncBatchId
    syncProgress.value = response

    // 폴링 시작
    startPolling()
  } catch (error) {
    console.error('나라장터 동기화 시작 실패:', error)
    alert(error instanceof Error ? error.message : '나라장터 동기화 시작에 실패했습니다.')
    syncing.value = false
  }
}

// 동기화 취소
const cancelSync = async () => {
  if (!syncBatchId.value) { return }
  if (!confirm('동기화를 중지하시겠습니까?')) { return }

  try {
    await demandOrganizationService.cancelSync(syncBatchId.value)
  } catch (error) {
    console.error('동기화 취소 실패:', error)
  }
}

// 지역 데이터 로드
const loadRegions = async () => {
  try {
    const regionCodes = await codeService.getCodeDetails('REGION')
    regions.value = regionCodes.filter(code => !code.parentCode) // 상위코드가 null인 것만
  } catch (error) {
    console.error('지역 데이터 로드 실패:', error)
  }
}

// 지역 선택 변경 시 호출되는 함수
const onRegionChange = () => {
  if (selectedRegion.value) {
    formData.value.rgnCd = selectedRegion.value.code
    formData.value.rgnNm = selectedRegion.value.codeName
  } else {
    formData.value.rgnCd = ''
    formData.value.rgnNm = ''
  }
}

// 우편번호 찾기
const searchZipcode = () => {
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.value.zip = data.zonecode
      formData.value.adrs = data.address
      formData.value.dtlAdrs = ''
    }
  }).open()
}

// 초기 로드
onMounted(() => {
  refresh()
  loadRegions()
})

// 컴포넌트 해제 시 폴링 정리
onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
/* 공통 CSS import */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-modals.css';

/* 페이지 특화 스타일만 작성 */

.organization-management {
  max-width: 100%;
  margin: 0 auto;
}

.content-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 검색 섹션 */
.search-section {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group.button-group {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  min-width: auto;
  flex: 0 0 auto;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.organization-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.organization-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-help {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* 우편번호 입력 그룹 스타일 */
.zip-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.zip-input {
  flex: 1;
  min-width: 120px;
}

.zip-search-btn {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

/* 데이터 없음 및 로딩 메시지 */
.no-data-message,
.loading-message {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.no-data-message i,
.loading-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-message i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 동기화 모달 */
.sync-modal {
  max-width: 520px;
}

.sync-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.sync-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* 진행상황 표시 */
.sync-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-status {
  font-weight: 600;
  color: #2563eb;
}

.progress-status i {
  margin-right: 0.5rem;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-percent {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.progress-item .label {
  color: #6b7280;
}

.progress-item .value {
  font-weight: 600;
  color: #374151;
}

.highlight-new {
  color: #059669 !important;
}

.highlight-update {
  color: #2563eb !important;
}

.highlight-fail {
  color: #dc2626 !important;
}

/* 완료 결과 */
.sync-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.result-icon {
  font-size: 3rem;
}

.result-icon.success {
  color: #059669;
}

.result-icon.warning {
  color: #d97706;
}

.result-icon.error {
  color: #dc2626;
}

.sync-result h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
}

/* 실패 상세 */
.failed-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.failed-details h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
}

.failed-details ul {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.failed-details li {
  font-size: 0.75rem;
  color: #991b1b;
  line-height: 1.6;
  word-break: break-all;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* 반응형 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .action-buttons button {
    width: 100%;
    justify-content: center;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }

  .organization-form .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
