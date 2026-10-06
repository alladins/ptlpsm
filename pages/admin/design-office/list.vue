<template>
  <div class="design-office-list">
    <PageHeader
      title="설계사무소관리"
      description="설계사무소(건축사사무소)를 회사로 등록하고 소재 시군구·신고번호를 관리합니다. 기본으로 영업 중인 곳만 보이며, 휴업·폐업(국세청 확인)은 [영업상태]에서 골라 볼 수 있습니다."
      icon="order"
      icon-color="blue"
      :view-only="isViewOnly"
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
        <GuardedButton
          v-if="canEdit"
          class="btn-action btn-secondary"
          :blocked="!canEnrich"
          reason="나라장터 업체정보 채우기는 시스템관리자·리드파워 관리자만 실행할 수 있습니다."
          :disabled="enriching"
          title="주소나 소재 시군구가 빈 설계사무소를 나라장터 조달업체 정보로 채웁니다 (빈 칸만)"
          @click="enrichFromG2b"
        >
          <i :class="enriching ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-download-alt'" />
          나라장터 업체정보로 채우기
        </GuardedButton>
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
              @keyup.enter="handleSearch"
            >
          </div>
          <div class="search-item">
            <label>시도:</label>
            <select v-model="searchForm.sidoCd" class="status-select" @change="handleSearch">
              <option value="">
                전체
              </option>
              <option v-for="s in SIDO_LIST" :key="s.sidoCd" :value="s.sidoCd">
                {{ s.sidoNm }}
              </option>
            </select>
          </div>
          <!-- 기본은 영업 중(+아직 확인 전)만 — 휴업·폐업은 지우지 않고 숨긴다 (국세청 사업자등록 상태조회) -->
          <div class="search-item">
            <label>영업상태:</label>
            <select v-model="searchForm.bizStatus" class="status-select" @change="onBizStatusChange">
              <option v-for="f in DESIGN_OFFICE_BIZ_FILTERS" :key="f.value" :value="f.value">
                {{ f.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="office-layout">
        <!-- 좌: 권역 트리 — 권역을 고르면 그 권역(+하위) 시군구의 사무소만. 대리점 직원은 «내 권역»이 먼저 골라진다 -->
        <RegionTreePanel
          :model-value="selected"
          :tree="treeData"
          unresolved-label="시군구 미판정"
          unresolved-title="주소가 없어 소재 시군구를 못 정한 곳 — «나라장터 업체정보로 채우기»로 채울 수 있습니다"
          @update:model-value="selectNode"
        />

        <div class="list-col">
          <div class="table-section">
            <div class="table-header">
              <div class="table-info">
                <span>총 <strong>{{ totalElements }}</strong>곳 중 {{ startIndex }}-{{ endIndex }} 표시</span>
              </div>
              <div class="table-actions">
                <select v-model="pageSize" class="page-size-select" @change="handleSearch">
                  <option :value="10">
                    10개씩
                  </option>
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
              <i class="fas fa-spinner fa-spin" />
              <p>데이터를 불러오는 중...</p>
            </div>
            <div v-else-if="offices.length === 0" class="no-data-message">
              <i class="fas fa-drafting-compass" />
              <p>조건에 맞는 설계사무소가 없습니다.</p>
            </div>
            <div v-else class="table-container">
              <!-- 휴대폰: 카드 — 누르면 상세, 전화 바로 걸기 -->
              <ul class="m-card-list m-narrow-only">
                <li v-for="o in offices" :key="`c-${o.designOfficeId}`" class="m-card" @click="openEditModal(o)">
                  <div class="m-card-head">
                    <span class="m-card-title">{{ o.companyName }}</span>
                    <span class="m-card-meta">{{ o.sigunguNm || '미판정' }}</span>
                  </div>
                  <div class="m-card-meta">
                    <BizStatusBadge v-if="o.bizSttCd && o.bizSttCd !== '01'" :code="o.bizSttCd" :name="o.bizSttNm" :end-dt="o.bizEndDt" :checked-at="o.bizCheckedAt" />
                    {{ o.representative || '-' }} · {{ o.businessNumber || '-' }}
                  </div>
                  <div v-if="o.tel" class="m-card-actions" @click.stop>
                    <a :href="`tel:${o.tel}`"><i class="fas fa-phone" /> {{ o.tel }}</a>
                  </div>
                </li>
              </ul>
              <table class="data-table m-wide-only">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>회사명</th>
                    <th>영업상태</th>
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
                    <td>{{ startIndex + index }}</td>
                    <td class="text-left">
                      {{ o.companyName }}
                    </td>
                    <td class="nowrap">
                      <BizStatusBadge :code="o.bizSttCd" :name="o.bizSttNm" :end-dt="o.bizEndDt" :checked-at="o.bizCheckedAt" />
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

            <Pagination
              v-if="totalPages > 0"
              :current-page="currentPage"
              :total-pages="totalPages"
              :disabled="loading"
              @change="changePage"
            />
          </div>
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

            <!-- 담당자(명함) — 명함관리의 소속 «조달업체»로 이 사무소를 고른 명함. 영업담당자는 자기가 등록한 명함만 보인다 -->
            <section v-if="editingId !== null" class="cards-section">
              <div class="cards-head">
                <h4><i class="fas fa-address-card" /> 담당자(명함)</h4>
                <button type="button" class="btn-action btn-secondary btn-sm" @click="goAddCard">
                  <i class="fas fa-plus" /> 명함 추가
                </button>
              </div>
              <p v-if="cardsLoading" class="text-muted small">
                불러오는 중...
              </p>
              <p v-else-if="officeCards.length === 0" class="text-muted small">
                등록된 명함이 없습니다. 건축사·담당자 명함을 받으면 [명함 추가]로 넣어 두세요.
              </p>
              <table v-else class="data-table cards-table">
                <thead>
                  <tr>
                    <th>담당자</th>
                    <th>연락처</th>
                    <th>이메일</th>
                    <th>메모</th>
                    <th>등록자</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in officeCards" :key="c.cardId">
                    <td>{{ c.contactNm }}</td>
                    <td class="nowrap">
                      {{ c.contactTel || '-' }}
                    </td>
                    <td>{{ c.contactEmail || '-' }}</td>
                    <td class="text-left">
                      {{ c.memo || '-' }}
                    </td>
                    <td>{{ c.ownerName || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
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
import { useRoute, useRouter } from '#imports'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import Pagination from '~/components/ui/Pagination.vue'
import { useAuthStore } from '~/stores/auth'
import { designOfficeService, salesRegionService } from '~/services/agency.service'
import { businessCardService, type BusinessCardResponse } from '~/services/business-card.service'
import BizStatusBadge from '~/components/ui/BizStatusBadge.vue'
import RegionTreePanel from '~/components/admin/sales/RegionTreePanel.vue'
import { formatDate, formatBusinessNumberInput, formatPhoneNumberInput } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { usePermission } from '~/composables/usePermission'
import {
  DESIGN_OFFICE_BIZ_FILTERS,
  SIDO_LIST,
  type DesignOffice,
  type DesignOfficeBizFilter,
  type DesignOfficeRegionTree,
  type RegionTreeData,
  type RegionTreeSelection,
  type Sigungu
} from '~/types/agency'

definePageMeta({
  layout: 'admin',
  pageTitle: '설계사무소관리'
})

// 메뉴권한(DESIGN_OFFICE) — 등록=등록 권한, 기존 수정=수정 권한 (영업담당자는 등록·수정 가능, 삭제 없음)
const { canWrite, canEdit, isViewOnly } = usePermission('DESIGN_OFFICE')
const route = useRoute()
const router = useRouter()

const offices = ref<DesignOffice[]>([])
const allSigungu = ref<Sigungu[]>([])
const loading = ref(false)
const saving = ref(false)

const searchForm = ref<{ keyword: string, sidoCd: string, bizStatus: DesignOfficeBizFilter }>(
  { keyword: '', sidoCd: '', bizStatus: '' })

// ===== 영업상태 (국세청) =====
/** 영업상태를 바꾸면 권역 트리 숫자도 같은 조건으로 다시 */
const onBizStatusChange = () => {
  handleSearch()
  loadTree()
}

// ===== 권역 트리 (왼쪽) — 공통 패널(RegionTreePanel). «미판정» = 소재 시군구 미판정 =====
const tree = ref<DesignOfficeRegionTree | null>(null)
const selected = ref<RegionTreeSelection>({ kind: 'all' })

/** 패널이 그리는 모양으로 (officeCount → count) */
const treeData = computed<RegionTreeData | null>(() => tree.value
  ? {
      regions: tree.value.regions.map(r => ({ regionId: r.regionId, regionName: r.regionName, parentRegionId: r.parentRegionId, count: r.officeCount })),
      unassigned: tree.value.unassigned,
      unresolved: tree.value.noSigungu,
      total: tree.value.total,
      myRegionIds: tree.value.myRegionIds || []
    }
  : null)

const selectNode = (s: RegionTreeSelection) => {
  selected.value = s
  handleSearch()
}

const loadTree = async () => {
  try {
    tree.value = await designOfficeService.getRegionTree(searchForm.value.bizStatus || undefined)
    // 대리점 직원은 자기 담당 권역부터 (여러 개면 트리 순서상 첫 번째)
    const mine = tree.value.myRegionIds || []
    if (mine.length > 0 && selected.value.kind === 'all') {
      const first = tree.value.regions.find(r => mine.includes(r.regionId))
      if (first) {
        selected.value = { kind: 'region', regionId: first.regionId }
      }
    }
  } catch (e) {
    console.error('권역 트리 로드 실패:', e)
  }
}

// 수집이 매일 설계사무소를 자동 등록하므로 서버에서 페이지로 나눈다 (0-based — Pagination 계약과 같음)
const currentPage = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)
const startIndex = computed(() => (totalElements.value === 0 ? 0 : currentPage.value * pageSize.value + 1))
const endIndex = computed(() => Math.min((currentPage.value + 1) * pageSize.value, totalElements.value))

const loadList = async () => {
  loading.value = true
  try {
    const res = await designOfficeService.getDesignOffices({
      keyword: searchForm.value.keyword.trim() || undefined,
      sidoCd: searchForm.value.sidoCd || undefined,
      regionId: selected.value.kind === 'region' ? selected.value.regionId : undefined,
      unassigned: selected.value.kind === 'unassigned' || undefined,
      noSigungu: selected.value.kind === 'unresolved' || undefined,
      bizStatus: searchForm.value.bizStatus || undefined,
      page: currentPage.value,
      size: pageSize.value
    })
    offices.value = res.content || []
    totalPages.value = res.totalPages || 0
    totalElements.value = res.totalElements || 0
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 0
  loadList()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadList()
}

// ===== 나라장터 업체정보로 채우기 (서버가 리드파워 관리자만 허용) =====
const authStore = useAuthStore()
const canEnrich = computed(() => ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER'].includes(authStore.user?.role || ''))
const enriching = ref(false)

const enrichFromG2b = async () => {
  if (!confirm('주소나 소재 시군구가 빈 설계사무소(최대 300곳)를 나라장터 조달업체 정보로 채웁니다.\n빈 칸만 채우고 입력된 값은 바꾸지 않습니다. 진행할까요?')) { return }
  enriching.value = true
  try {
    const r = await designOfficeService.enrichFromG2b()
    alert(`확인 ${r.checked}곳 · 채움 ${r.filled}곳 (시군구 판정 ${r.sigunguResolved}곳) · 못 채움 ${r.notFound}곳`)
    loadList()
    loadTree()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    enriching.value = false
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
  searchForm.value = { keyword: '', sidoCd: '', bizStatus: '' }
  selected.value = { kind: 'all' }
  handleSearch()
  loadTree()
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
  loadOfficeCards(o.designOfficeId)
}

// ===== 담당자(명함) =====
const officeCards = ref<BusinessCardResponse[]>([])
const cardsLoading = ref(false)

const loadOfficeCards = async (companyId: number) => {
  officeCards.value = []
  cardsLoading.value = true
  try {
    const res = await businessCardService.getBusinessCardList({ orgType: 'SUPPLIER', companyId, page: 0, size: 50 })
    officeCards.value = res.content || []
  } catch (e) {
    // 명함은 부가 정보 — 못 불러와도 사무소 정보는 볼 수 있게
    console.error('명함 로드 실패:', e)
  } finally {
    cardsLoading.value = false
  }
}

/** 명함관리 등록 창을 이 사무소가 소속으로 채워진 채로 연다 */
const goAddCard = () => {
  if (editingId.value === null) { return }
  router.push({
    path: '/admin/business-card/list',
    query: {
      newCard: '1',
      companyId: String(editingId.value),
      name: form.value.companyName,
      bizno: (form.value.businessNumber || '').replace(/[^0-9]/g, '')
    }
  })
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
    loadTree()
  } catch (e) {
    // 사업자번호 중복 등 서버 메시지 그대로
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

/**
 * 다른 화면(공모·낙찰 수집의 설계사무소 링크)에서 ?id= 로 들어오면 그 사무소 상세를 바로 연다.
 * 목록 페이지에 없을 수 있어 단건 조회로 연다.
 */

const openFromQuery = async () => {
  const id = Number(route.query.id)
  if (!Number.isInteger(id) || id <= 0) { return }
  try {
    openEditModal(await designOfficeService.getDesignOffice(id))
  } catch (e) {
    alert(toApiError(e).message)
  }
  // 새로고침·뒤로가기 때 모달이 다시 뜨지 않게 주소에서 id 를 뗀다
  router.replace({ query: { ...route.query, id: undefined } })
}

onMounted(async () => {
  // 트리를 먼저 받아야 대리점 직원의 «내 권역»으로 첫 목록을 거를 수 있다
  await loadTree()
  loadList()
  loadSigungu()
  openFromQuery()
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

/* 좌 권역 트리 + 우 목록 */
.office-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 900px) {
  .office-layout {
    /* 1fr 이면 칸이 안쪽 내용 폭만큼 늘어나 카드가 화면 밖으로 밀린다 */
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 트리 패널 자체 스타일은 RegionTreePanel 컴포넌트에 */

/* 담당자(명함) */
.cards-section {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.cards-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.cards-head h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.cards-table {
  font-size: 0.8125rem;
}

.btn-sm {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.nowrap {
  white-space: nowrap;
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
