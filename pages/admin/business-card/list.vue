<template>
  <div class="business-card-list">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="명함관리"
      description="거래처 담당자 명함을 조회하고 관리합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="handleSearch">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo" />
          초기화
        </button>
        <button class="btn-action btn-primary" @click="openCreateModal">
          <i class="fas fa-plus" />
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 소속 구분 -->
          <div class="search-item">
            <label>구분:</label>
            <select v-model="searchForm.orgType" class="status-select" @change="handleSearch">
              <option value="">
                전체
              </option>
              <option v-for="(label, code) in ORG_TYPE_LABELS" :key="code" :value="code">
                {{ label }}
              </option>
            </select>
          </div>

          <!-- 소속명 -->
          <div class="search-item">
            <label>소속명:</label>
            <input
              v-model="searchForm.dminsttNm"
              type="text"
              placeholder="수요기관·업체명"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- 담당자명 -->
          <div class="search-item">
            <label>담당자명:</label>
            <input
              v-model="searchForm.contactNm"
              type="text"
              placeholder="담당자명"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- 통합검색 -->
          <div class="search-item search-keyword">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="소속명, 담당자, 연락처, 이메일 검색"
              class="keyword-input"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <select v-model="pageSize" class="page-size-select" @change="handlePageSizeChange">
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
                <th>No</th>
                <th>소속</th>
                <th>담당자명</th>
                <th>연락처</th>
                <th>이메일</th>
                <th>메모</th>
                <th>등록자</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in cardData"
                :key="item.cardId"
                class="table-row clickable-row"
                @click="openDetailModal(item)"
              >
                <td>{{ startIndex + index }}</td>
                <td class="text-left">
                  <span class="org-badge" :class="`org-${item.orgType || 'DEMAND_ORG'}`">
                    {{ orgLabel(item.orgType) }}
                  </span>
                  {{ item.dminsttNm || '-' }}
                </td>
                <td>{{ item.contactNm }}</td>
                <td>{{ item.contactTel || '-' }}</td>
                <td>{{ item.contactEmail || '-' }}</td>
                <td>{{ item.memo || '-' }}</td>
                <td>{{ item.ownerName || '-' }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td @click.stop>
                  <div class="action-buttons">
                    <button class="btn-icon btn-edit" title="수정" @click="openEditModal(item)">
                      <i class="fas fa-edit" />
                    </button>
                    <button class="btn-icon btn-delete" title="삭제" @click="handleDelete(item)">
                      <i class="fas fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin" />
            <p>데이터를 불러오는 중...</p>
          </div>

          <div v-if="cardData.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-address-card" />
            <p>등록된 명함이 없습니다.</p>
          </div>
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

    <!-- 명함 상세/등록/수정 모달 -->
    <Teleport to="body">
      <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h3>{{ modalTitle }}</h3>
            <button class="modal-close" @click="closeFormModal">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <!-- 읽기전용 상세 보기 (view 모드) -->
            <template v-if="viewMode === 'view'">
              <div class="detail-group">
                <div class="detail-row">
                  <span class="detail-label">소속</span>
                  <span class="detail-value">
                    <span class="org-badge" :class="`org-${viewingCard?.orgType || 'DEMAND_ORG'}`">
                      {{ orgLabel(viewingCard?.orgType) }}
                    </span>
                    {{ viewingCard?.dminsttNm || '-' }}
                  </span>
                </div>
                <div v-if="viewingCard?.orgType === 'SUPPLIER'" class="detail-row">
                  <span class="detail-label">사업자번호</span>
                  <span class="detail-value">{{ viewingCard?.orgBizno || '-' }}</span>
                </div>
                <div v-else-if="viewingCard?.dminsttCd" class="detail-row">
                  <span class="detail-label">기관코드</span>
                  <span class="detail-value">{{ viewingCard?.dminsttCd }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">담당자명</span>
                  <span class="detail-value">{{ viewingCard?.contactNm || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">연락처</span>
                  <span class="detail-value">{{ viewingCard?.contactTel || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">이메일</span>
                  <span class="detail-value">{{ viewingCard?.contactEmail || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">메모</span>
                  <span class="detail-value">{{ viewingCard?.memo || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">등록자</span>
                  <span class="detail-value">{{ viewingCard?.ownerName || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">등록일</span>
                  <span class="detail-value">{{ formatDate(viewingCard?.createdAt) }}</span>
                </div>
              </div>
            </template>

            <!-- 편집 폼 (edit/create 모드) -->
            <template v-else>
              <div class="form-group">
                <label class="form-label required">소속</label>
                <!-- 소속 구분 — 수요기관(발주처) / 조달업체(설계사무소·건설사 등) / 기타(직접 입력) -->
                <div class="org-input-toggle">
                  <label v-for="(label, code) in ORG_TYPE_LABELS" :key="code" class="radio-label">
                    <input v-model="formData.orgType" type="radio" :value="code" @change="onOrgTypeChange">
                    <span>{{ label }}</span>
                  </label>
                </div>
                <!-- 수요기관: 검색해서 선택 -->
                <DemandOrgPicker
                  v-if="formData.orgType === 'DEMAND_ORG'"
                  :selected-name="formData.dminsttCd ? formData.dminsttNm : ''"
                  @selected="handleOrgSelected"
                  @cleared="formData.dminsttCd = ''; formData.dminsttNm = ''"
                />
                <!-- 조달업체: 회사 마스터·나라장터에서 검색해서 선택 -->
                <SupplierSelector
                  v-else-if="formData.orgType === 'SUPPLIER'"
                  :selected-name="formData.companyId || formData.orgBizno ? formData.dminsttNm : ''"
                  :selected-bizno="formData.orgBizno"
                  @selected="handleSupplierSelected"
                  @cleared="clearSupplier"
                />
                <!-- 기타: 직접 입력 -->
                <input
                  v-else
                  v-model="formData.dminsttNm"
                  type="text"
                  placeholder="소속(회사·기관)명을 직접 입력하세요"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label class="form-label required">담당자명</label>
                <input
                  v-model="formData.contactNm"
                  type="text"
                  placeholder="담당자명을 입력하세요"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label class="form-label">연락처</label>
                <input
                  v-model="formData.contactTel"
                  type="tel"
                  placeholder="010-1234-5678"
                  class="form-input"
                  @input="handlePhoneInput"
                >
              </div>
              <div class="form-group">
                <label class="form-label">이메일</label>
                <input
                  v-model="formData.contactEmail"
                  type="email"
                  placeholder="example@company.com"
                  class="form-input"
                  @blur="validateEmail"
                >
                <span v-if="emailError" class="field-error">{{ emailError }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">메모</label>
                <textarea
                  v-model="formData.memo"
                  placeholder="메모를 입력하세요"
                  class="form-textarea"
                  rows="3"
                />
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <!-- view 모드: 수정/삭제 버튼 -->
            <template v-if="viewMode === 'view'">
              <button class="btn-action btn-secondary" @click="closeFormModal">
                닫기
              </button>
              <button class="btn-action btn-danger" @click="handleDelete(viewingCard!)">
                삭제
              </button>
              <button class="btn-action btn-primary" @click="switchToEditMode">
                수정
              </button>
            </template>
            <!-- edit/create 모드: 저장/취소 버튼 -->
            <template v-else>
              <button class="btn-action btn-secondary" @click="handleFormCancel">
                취소
              </button>
              <button class="btn-action btn-primary" :disabled="saving" @click="handleSave">
                <i v-if="saving" class="fas fa-spinner fa-spin" />
                {{ viewMode === 'edit' ? '수정' : '등록' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { businessCardService, ORG_TYPE_LABELS, type OrgType, type SupplierOption, type BusinessCardRequest, type BusinessCardResponse } from '~/services/business-card.service'
import { formatDate, formatPhoneNumberInput } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'
import DemandOrgPicker from '~/components/DemandOrgPicker.vue'
import SupplierSelector from '~/components/SupplierSelector.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '명함관리'
})

// 검색 폼
const searchForm = ref<{ orgType: OrgType | '', dminsttNm: string, contactNm: string, keyword: string }>({
  orgType: '',
  dminsttNm: '',
  contactNm: '',
  keyword: ''
})

// useDataTable
const {
  items: cardData,
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
  reset
} = useDataTable({
  fetchFunction: async (params) => {
    return await businessCardService.getBusinessCardList({
      orgType: searchForm.value.orgType || undefined,
      dminsttNm: searchForm.value.dminsttNm || undefined,
      contactNm: searchForm.value.contactNm || undefined,
      keyword: searchForm.value.keyword || undefined,
      page: params.page || 0,
      size: params.size || 10
    })
  },
  initialPageSize: 10
})

// 검색/페이징 핸들러
const handleSearch = () => search()

const handleReset = () => {
  searchForm.value = { orgType: '', dminsttNm: '', contactNm: '', keyword: '' }
  reset()
}

const handlePageChange = (page: number) => changePage(page)
const handlePageSizeChange = () => changePageSize(pageSize.value)

// 모달 상태
type ViewMode = 'view' | 'edit' | 'create'
const showFormModal = ref(false)
const viewMode = ref<ViewMode>('create')
const editingCardId = ref<number | null>(null)
const viewingCard = ref<BusinessCardResponse | null>(null)
const saving = ref(false)

/** 소속 구분 라벨 — 옛 명함(구분 없음)은 수요기관 */
const orgLabel = (t?: string | null) => ORG_TYPE_LABELS[(t || 'DEMAND_ORG') as OrgType] || '수요기관'

const modalTitle = computed(() => {
  switch (viewMode.value) {
    case 'view': return '명함 상세'
    case 'edit': return '명함 수정'
    default: return '명함 등록'
  }
})

const emptyForm = (): BusinessCardRequest & { orgType: OrgType } => ({
  orgType: 'DEMAND_ORG',
  dminsttCd: '',
  dminsttNm: '',
  companyId: null,
  orgBizno: null,
  contactNm: '',
  contactTel: '',
  contactEmail: '',
  memo: ''
})

const formData = ref(emptyForm())

const resetFormData = () => {
  formData.value = emptyForm()
}

// 등록 모달
const openCreateModal = () => {
  viewMode.value = 'create'
  editingCardId.value = null
  viewingCard.value = null
  resetFormData()
  showFormModal.value = true
}

/** 소속 구분을 바꾸면 이전 구분의 값을 비운다 (수요기관 코드가 조달업체에 남는 일 방지) */
const onOrgTypeChange = () => {
  formData.value.dminsttCd = ''
  formData.value.dminsttNm = ''
  formData.value.companyId = null
  formData.value.orgBizno = null
}

const handleSupplierSelected = (o: SupplierOption) => {
  formData.value.companyId = o.companyId
  formData.value.orgBizno = o.bizno
  formData.value.dminsttNm = o.companyName
}

const clearSupplier = () => {
  formData.value.companyId = null
  formData.value.orgBizno = null
  formData.value.dminsttNm = ''
}

/**
 * 설계사무소 상세의 [명함 추가]에서 넘어온 경우 — 그 사무소를 소속으로 채운 등록 창을 연다
 * (?newCard=1&companyId=…&name=…&bizno=…)
 */
const route = useRoute()
const router = useRouter()

const openCreateFromQuery = () => {
  if (route.query.newCard !== '1') { return }
  openCreateModal()
  formData.value.orgType = 'SUPPLIER'
  const cid = Number(route.query.companyId)
  formData.value.companyId = Number.isInteger(cid) && cid > 0 ? cid : null
  formData.value.dminsttNm = String(route.query.name || '')
  formData.value.orgBizno = route.query.bizno ? String(route.query.bizno).replace(/[^0-9]/g, '') : null
  router.replace({ query: {} })
}

// 상세 보기 모달 (행 클릭)
const openDetailModal = (card: BusinessCardResponse) => {
  viewMode.value = 'view'
  viewingCard.value = card
  editingCardId.value = card.cardId
  showFormModal.value = true
}

// 수정 모달 (관리 버튼 클릭)
const openEditModal = (card: BusinessCardResponse) => {
  viewMode.value = 'edit'
  viewingCard.value = card
  editingCardId.value = card.cardId
  populateFormData(card)
  showFormModal.value = true
}

// 상세 → 수정 모드 전환
const switchToEditMode = () => {
  if (!viewingCard.value) { return }
  viewMode.value = 'edit'
  populateFormData(viewingCard.value)
}

// 폼 데이터 채우기
const populateFormData = (card: BusinessCardResponse) => {
  formData.value = {
    // 옛 명함(구분 없음)은 기관코드 유무로
    orgType: card.orgType || (card.dminsttCd ? 'DEMAND_ORG' : 'ETC'),
    dminsttCd: card.dminsttCd || '',
    dminsttNm: card.dminsttNm || '',
    companyId: card.companyId ?? null,
    orgBizno: card.orgBizno ?? null,
    contactNm: card.contactNm || '',
    contactTel: card.contactTel || '',
    contactEmail: card.contactEmail || '',
    memo: card.memo || ''
  }
}

const closeFormModal = () => {
  showFormModal.value = false
  viewingCard.value = null
}

// 편집 중 취소: view 모드로 복귀 (상세에서 진입한 경우) 또는 모달 닫기
const handleFormCancel = () => {
  if (viewMode.value === 'edit' && viewingCard.value) {
    viewMode.value = 'view'
  } else {
    closeFormModal()
  }
}

// 연락처 입력 처리 (숫자만 + 자동 하이픈)
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  formData.value.contactTel = formatPhoneNumberInput(target.value)
}

// 이메일 유효성 검증
const emailError = ref('')
const validateEmail = () => {
  const email = formData.value.contactEmail
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.value = '올바른 이메일 형식이 아닙니다.'
  } else {
    emailError.value = ''
  }
}

const handleOrgSelected = (org: any) => {
  formData.value.dminsttCd = org.dminsttCd
  formData.value.dminsttNm = org.dminsttNm
}

const handleSave = async () => {
  if (!formData.value.contactNm) {
    alert('담당자명은 필수입니다.')
    return
  }
  if (!formData.value.dminsttNm) {
    alert(formData.value.orgType === 'ETC' ? '소속(회사·기관)명을 입력하세요.' : `${ORG_TYPE_LABELS[formData.value.orgType]}을(를) 검색해서 선택하세요.`)
    return
  }
  if (formData.value.orgType === 'SUPPLIER' && !formData.value.companyId && !formData.value.orgBizno) {
    alert('조달업체는 검색해서 선택하세요. 업체명만 알면 «기타»로 넣을 수 있습니다.')
    return
  }

  // 연락처 유효성 체크 (입력된 경우)
  if (formData.value.contactTel) {
    const telNumbers = formData.value.contactTel.replace(/[^0-9]/g, '')
    if (telNumbers.length < 9 || telNumbers.length > 11) {
      alert('연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)')
      return
    }
  }

  // 이메일 유효성 체크 (입력된 경우)
  if (formData.value.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.contactEmail)) {
    alert('이메일 형식이 올바르지 않습니다.')
    return
  }

  // 구분별로 쓰지 않는 칸은 서버가 비운다 (BusinessCardService.normalizeOrg)
  const saveData = { ...formData.value }

  saving.value = true
  try {
    if (viewMode.value === 'edit' && editingCardId.value) {
      await businessCardService.updateBusinessCard(editingCardId.value, saveData)
      alert('명함이 수정되었습니다.')
    } else {
      await businessCardService.createBusinessCard(saveData)
      alert('명함이 등록되었습니다.')
    }
    closeFormModal()
    search()
  } catch (error: any) {
    alert(error.message || '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (card: BusinessCardResponse) => {
  if (!confirm(`${card.contactNm} 명함을 삭제하시겠습니까?`)) { return }

  try {
    await businessCardService.deleteBusinessCard(card.cardId)
    alert('명함이 삭제되었습니다.')
    closeFormModal()
    search()
  } catch (error: any) {
    alert(error.message || '삭제에 실패했습니다.')
  }
}

onMounted(() => {
  search()
  openCreateFromQuery()
})
</script>

<style scoped>
.table-row {
  transition: background-color 0.2s ease;
}
.table-row:hover {
  background-color: #f9fafb;
}
.clickable-row {
  cursor: pointer;
}
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.btn-icon {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.btn-icon:hover {
  background-color: #f3f4f6;
}
.btn-edit {
  color: #2563eb;
}
.btn-delete {
  color: #dc2626;
}
.btn-delete:hover {
  background-color: #fef2f2;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-md {
  max-width: 520px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #6b7280;
}
.modal-body {
  padding: 24px;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.form-group {
  margin-bottom: 16px;
}
.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.form-label.required::after {
  content: ' *';
  color: #dc2626;
}
.form-input, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.form-textarea {
  resize: vertical;
}

/* 상세 보기 스타일 */
.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}
.detail-value {
  flex: 1;
  font-size: 14px;
  color: #111827;
  word-break: break-all;
}

/* 수요기관 입력 모드 토글 */
/* 소속 구분 배지 */
.org-badge {
  display: inline-block;
  margin-right: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  vertical-align: middle;
}

.org-DEMAND_ORG {
  background: #e0f2fe;
  color: #075985;
}

.org-SUPPLIER {
  background: #f3e8ff;
  color: #6b21a8;
}

.org-ETC {
  background: #f1f5f9;
  color: #475569;
}

.org-input-toggle {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}
.radio-label input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

/* 삭제 버튼 */
.btn-danger {
  background-color: #dc2626;
  color: white;
  border: 1px solid #dc2626;
}
.btn-danger:hover {
  background-color: #b91c1c;
}

/* 필드 에러 메시지 */
.field-error {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #dc2626;
}
</style>
