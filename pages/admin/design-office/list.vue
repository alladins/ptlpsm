<template>
  <div class="design-office-list">
    <PageHeader
      title="설계사무소관리"
      description="설계사무소(건축사사무소)를 회사로 등록하고 소재 시군구·신고번호를 관리합니다."
      icon="order"
      icon-color="blue"
      :view-only="isViewOnly"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="loadList">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action btn-secondary" @click="handleReset">
          <i class="fas fa-undo" />
          초기화
        </button>
        <button v-if="canWrite" class="btn-action btn-primary" @click="openCreateModal">
          <i class="fas fa-plus" />
          등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>검색어:</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              class="keyword-input"
              placeholder="회사명, 대표자, 사업자번호"
              @keyup.enter="loadList"
            >
          </div>
          <div class="search-item">
            <label>시도:</label>
            <select v-model="searchForm.sidoCd" class="status-select" @change="loadList">
              <option value="">
                전체
              </option>
              <option v-for="s in SIDO_LIST" :key="s.sidoCd" :value="s.sidoCd">
                {{ s.sidoNm }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 <strong>{{ offices.length }}</strong>곳</span>
          </div>
        </div>

        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin" />
          <p>데이터를 불러오는 중...</p>
        </div>
        <div v-else-if="offices.length === 0" class="no-data-message">
          <i class="fas fa-drafting-compass" />
          <p>조건에 맞는 설계사무소가 없습니다.</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>회사명</th>
                <th>대표자</th>
                <th>사업자번호</th>
                <th>소재 시군구</th>
                <th>신고번호</th>
                <th>연락처</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(o, index) in offices"
                :key="o.designOfficeId"
                class="table-row clickable-row"
                @click="openEditModal(o)"
              >
                <td>{{ index + 1 }}</td>
                <td class="text-left">
                  {{ o.companyName }}
                </td>
                <td>{{ o.representative || '-' }}</td>
                <td>{{ o.businessNumber || '-' }}</td>
                <td>
                  <span v-if="o.sigunguNm">{{ o.sigunguNm }}</span>
                  <span v-else class="text-muted">미판정</span>
                </td>
                <td>{{ o.architectRegNo || '-' }}</td>
                <td>{{ o.tel || '-' }}</td>
                <td>{{ formatDate(o.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 등록/수정 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content office-modal">
          <div class="modal-header">
            <h3>{{ modalReadonly ? '설계사무소 정보' : (editingId !== null ? '설계사무소 수정' : '설계사무소 등록') }}</h3>
            <button type="button" class="modal-close" @click="closeModal">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <!-- 저장 권한이 없으면(신규=등록, 기존=수정) 조회 전용으로 입력을 잠근다 -->
            <fieldset class="form-row-2 form-fieldset" :disabled="modalReadonly">
              <div class="form-group span-2">
                <label class="required">회사명</label>
                <input v-model="form.companyName" type="text" class="form-input full" placeholder="예: (주)아키원 건축사사무소">
              </div>
              <div class="form-group">
                <label>사업자등록번호</label>
                <input
                  v-model="form.businessNumber"
                  type="text"
                  class="form-input full"
                  placeholder="123-45-67890"
                  @input="onBusinessNumberInput"
                >
                <span class="field-hint">같은 번호로 등록된 설계사무소가 있으면 저장되지 않습니다.</span>
              </div>
              <div class="form-group">
                <label>대표자</label>
                <input v-model="form.representative" type="text" class="form-input full">
              </div>
              <div class="form-group">
                <label>건축사사무소 신고번호</label>
                <input v-model="form.architectRegNo" type="text" class="form-input full">
              </div>
              <div class="form-group">
                <label>전화번호</label>
                <input v-model="form.tel" type="text" class="form-input full" placeholder="02-1234-5678" @input="onTelInput">
              </div>
              <div class="form-group span-2">
                <label>이메일</label>
                <input v-model="form.email" type="email" class="form-input full" placeholder="example@company.com">
              </div>
              <div class="form-group span-2">
                <label>주소</label>
                <div class="input-with-button">
                  <input v-model="form.zipCode" type="text" class="form-input zip" readonly placeholder="우편번호">
                  <button v-if="!modalReadonly" type="button" class="btn-secondary" @click="openPostalSearch">
                    <i class="fas fa-search" /> 우편번호 검색
                  </button>
                </div>
                <input v-model="form.address" type="text" class="form-input full" placeholder="주소">
                <input v-model="form.detailAddress" type="text" class="form-input full" placeholder="상세주소">
              </div>
              <div class="form-group span-2">
                <label>소재 시군구</label>
                <div class="sigungu-select">
                  <select v-model="formSidoCd" class="form-select" @change="form.sigunguCd = ''">
                    <option value="">
                      시도 선택
                    </option>
                    <option v-for="s in SIDO_LIST" :key="s.sidoCd" :value="s.sidoCd">
                      {{ s.sidoNm }}
                    </option>
                  </select>
                  <select v-model="form.sigunguCd" class="form-select" :disabled="!formSidoCd">
                    <option value="">
                      (비움 — 주소로 자동 판정)
                    </option>
                    <option v-for="s in sigunguOfFormSido" :key="s.sigunguCd" :value="s.sigunguCd">
                      {{ s.sigunguNm }}
                    </option>
                  </select>
                </div>
                <span class="field-hint">비우면 주소로 자동 판정합니다. 방문지 정보일 뿐 대리점 배정에는 쓰지 않습니다.</span>
              </div>
              <div class="form-group span-2">
                <label>비고</label>
                <textarea v-model="form.remarks" class="form-textarea full" rows="2" />
              </div>
            </fieldset>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">
              {{ modalReadonly ? '닫기' : '취소' }}
            </button>
            <GuardedButton
              v-if="!modalReadonly"
              class="btn-primary"
              :blocked="!form.companyName.trim()"
              reason="회사명을 입력하세요."
              :disabled="saving"
              @click="submit"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              {{ editingId !== null ? '저장' : '등록' }}
            </GuardedButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 설계사무소관리
 * - 회사(company_type=DESIGN_OFFICE) + 확장 정보(소재 시군구·신고번호)
 * - 소재 시군구는 방문지 정보 — 대리점 배정에는 쓰지 않는다
 */
import { ref, computed, onMounted } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { designOfficeService, salesRegionService } from '~/services/agency.service'
import { formatDate, formatBusinessNumberInput, formatPhoneNumberInput } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { usePermission } from '~/composables/usePermission'
import { SIDO_LIST, type DesignOffice, type Sigungu } from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '설계사무소관리'
})

// 메뉴권한(DESIGN_OFFICE) — 등록=등록 권한, 기존 수정=수정 권한 (영업담당자는 등록·수정 가능, 삭제 없음)
const { canWrite, canEdit, isViewOnly } = usePermission('DESIGN_OFFICE')

const offices = ref<DesignOffice[]>([])
const allSigungu = ref<Sigungu[]>([])
const loading = ref(false)
const saving = ref(false)

const searchForm = ref({ keyword: '', sidoCd: '' })

const loadList = async () => {
  loading.value = true
  try {
    offices.value = await designOfficeService.getDesignOffices({
      keyword: searchForm.value.keyword.trim() || undefined,
      sidoCd: searchForm.value.sidoCd || undefined
    })
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

const loadSigungu = async () => {
  try {
    allSigungu.value = await salesRegionService.getSigungu()
  } catch (e) {
    console.error('시군구 목록 로드 실패:', e)
  }
}

const handleReset = () => {
  searchForm.value = { keyword: '', sidoCd: '' }
  loadList()
}

// ===== 등록/수정 모달 =====
interface OfficeForm {
  companyName: string
  businessNumber: string
  representative: string
  address: string
  detailAddress: string
  zipCode: string
  tel: string
  email: string
  sigunguCd: string
  architectRegNo: string
  remarks: string
}

const emptyForm = (): OfficeForm => ({
  companyName: '',
  businessNumber: '',
  representative: '',
  address: '',
  detailAddress: '',
  zipCode: '',
  tel: '',
  email: '',
  sigunguCd: '',
  architectRegNo: '',
  remarks: ''
})

const showModal = ref(false)
const editingId = ref<number | null>(null)
/** 모달 저장 가능 여부 — 신규는 등록 권한, 기존은 수정 권한. 둘 다 아니면 조회 전용 */
const modalReadonly = computed(() => (editingId.value !== null ? !canEdit.value : !canWrite.value))
const form = ref<OfficeForm>(emptyForm())
const formSidoCd = ref('')

const sigunguOfFormSido = computed(() =>
  allSigungu.value
    .filter(s => s.sidoCd === formSidoCd.value)
    .sort((a, b) => a.sigunguCd.localeCompare(b.sigunguCd)))

const openCreateModal = () => {
  editingId.value = null
  form.value = emptyForm()
  formSidoCd.value = ''
  showModal.value = true
}

const openEditModal = (o: DesignOffice) => {
  editingId.value = o.designOfficeId
  form.value = {
    companyName: o.companyName || '',
    businessNumber: o.businessNumber || '',
    representative: o.representative || '',
    address: o.address || '',
    detailAddress: o.detailAddress || '',
    zipCode: o.zipCode || '',
    tel: o.tel || '',
    email: o.email || '',
    sigunguCd: o.sigunguCd || '',
    architectRegNo: o.architectRegNo || '',
    remarks: o.remarks || ''
  }
  // 저장된 시군구의 시도를 찾아 선택해 둔다
  formSidoCd.value = allSigungu.value.find(s => s.sigunguCd === o.sigunguCd)?.sidoCd || ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const onBusinessNumberInput = (e: Event) => {
  form.value.businessNumber = formatBusinessNumberInput((e.target as HTMLInputElement).value)
}

const onTelInput = (e: Event) => {
  form.value.tel = formatPhoneNumberInput((e.target as HTMLInputElement).value)
}

interface DaumPostcodeData { zonecode: string, address: string }
const openPostalSearch = () => {
  const daum = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (d: DaumPostcodeData) => void }) => { open: () => void } } }).daum
  if (!daum?.Postcode) {
    alert('우편번호 검색을 불러오지 못했습니다. 주소를 직접 입력하거나 잠시 후 다시 시도하세요.')
    return
  }
  new daum.Postcode({
    oncomplete: (d) => {
      form.value.zipCode = d.zonecode
      form.value.address = d.address
      form.value.detailAddress = ''
    }
  }).open()
}

const blankToNull = (v: string) => (v.trim() ? v.trim() : null)

const submit = async () => {
  if (modalReadonly.value) { return }
  const f = form.value
  if (!f.companyName.trim()) { return }
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    alert('이메일 형식이 올바르지 않습니다.')
    return
  }
  const payload = {
    companyName: f.companyName.trim(),
    businessNumber: blankToNull(f.businessNumber),
    representative: blankToNull(f.representative),
    address: blankToNull(f.address),
    detailAddress: blankToNull(f.detailAddress),
    zipCode: blankToNull(f.zipCode),
    tel: blankToNull(f.tel),
    email: blankToNull(f.email),
    sigunguCd: blankToNull(f.sigunguCd),
    architectRegNo: blankToNull(f.architectRegNo),
    remarks: blankToNull(f.remarks)
  }
  saving.value = true
  try {
    if (editingId.value !== null) {
      await designOfficeService.updateDesignOffice(editingId.value, payload)
    } else {
      await designOfficeService.createDesignOffice(payload)
    }
    showModal.value = false
    await loadList()
  } catch (e) {
    // 사업자번호 중복 등 서버 메시지 그대로
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadList()
  loadSigungu()
})
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
}

.office-modal {
  max-width: 680px;
}

/* fieldset 기본 테두리·여백 제거 (조회 전용 잠금용) */
.form-fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1rem;
}

.form-row-2 .span-2 {
  grid-column: 1 / -1;
}

.form-input.full,
.form-select.full,
.form-textarea.full {
  width: 100%;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.form-input.zip {
  width: 140px;
}

.sigungu-select {
  display: flex;
  gap: 0.5rem;
}

.sigungu-select .form-select {
  flex: 1;
  width: auto;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
