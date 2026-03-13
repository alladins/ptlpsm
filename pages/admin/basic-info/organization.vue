<template>
  <div class="organization-management">
    <PageHeader
      title="수요기관관리"
      description="수요기관 정보를 관리합니다."
    />

    <div class="content-section">
      <!-- 검색 조건 섹션 -->
      <div class="search-section">
        <div class="search-form">
          <div class="form-row">
            <div class="form-group">
              <label>검색어</label>
              <input 
                type="text" 
                v-model="searchForm.searchKeyword" 
                placeholder="수요기관코드, 수요기관명, 사업자등록번호" 
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>지역</label>
              <select v-model="searchForm.rgnCd" class="form-select">
                <option value="">전체</option>
                <option v-for="region in regions" :key="region.code" :value="region.code">
                  {{ region.codeName }}
                </option>
              </select>
            </div>

            <div class="form-group button-group">
              <button class="btn-primary" @click="searchOrganizations">
                <i class="fas fa-search"></i>
                <span>검색</span>
              </button>
              <button class="btn-primary" @click="openAddModal">
                <i class="fas fa-plus"></i>
                <span>등록</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 수요기관 목록 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <select :value="pageSize" @change="changePageSize(Number(($event.target as HTMLSelectElement).value))" class="page-size-select">
              <option :value="10">10개씩</option>
              <option :value="20">20개씩</option>
              <option :value="50">50개씩</option>
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
                  <button class="btn-edit" @click="openEditModal(organization)" title="수정">
                    <i class="fas fa-edit"></i>
                    <span>수정</span>
                  </button>
                  <button class="btn-delete" @click="deleteOrganization(organization)" title="삭제">
                    <i class="fas fa-trash"></i>
                    <span>삭제</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 데이터가 없을 때 -->
          <div v-if="organizations.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-building"></i>
            <p>등록된 수요기관이 없습니다.</p>
          </div>

          <!-- 로딩 중 -->
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
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
    </div>

    <!-- 수요기관 등록/수정 통합 모달 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '수요기관 등록' : '수요기관 수정' }}</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleFormSubmit" class="organization-form">
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
                <select v-model="selectedRegion" @change="onRegionChange" class="form-select">
                  <option value="">지역을 선택하세요</option>
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
                    <i class="fas fa-search"></i>
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
                <i class="fas fa-save"></i>
                <span>{{ showAddModal ? '등록' : '수정' }}</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { demandOrganizationService, type DemandOrganization } from '~/services/demand-organization.service'
import { codeService } from '~/services/code.service'
import { useDataTable } from '~/composables/useDataTable'

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

// 검색 폼
const searchForm = ref({
  searchKeyword: '',
  rgnCd: '',
  dltYn: '',
  sortBy: 'createdAt',
  sortDirection: 'desc'
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
  if (!(await validateForm())) return
  
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
  if (!(await validateForm()) || !editingOrganization.value) return
  
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
  if (!confirm('정말 삭제하시겠습니까?')) return
  
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
