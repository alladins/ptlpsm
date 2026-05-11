<template>
  <div class="user-management">
    <!-- 페이지 헤더 - 컴팩트 -->
    <div class="page-header-compact">
      <h1>사용자관리</h1>
      <span class="page-description">시스템 사용자 정보를 관리합니다.</span>
    </div>
    <!-- 검색 영역 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>권한</label>
          <select v-model="searchForm.role" class="status-select">
            <option value="">
              전체
            </option>
            <option v-for="role in userRoles" :key="role.code" :value="role.code">
              {{ role.codeName }}
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>상태</label>
          <select v-model="searchForm.enabled" class="status-select">
            <option value="">
              전체
            </option>
            <option value="Y">
              활성
            </option>
            <option value="N">
              비활성
            </option>
          </select>
        </div>
        <div class="search-item">
          <label>검색어</label>
          <input
            v-model="searchForm.searchKeyword"
            type="text"
            placeholder="검색어를 입력하세요"
            class="text-input"
            @keyup.enter="searchUsers"
          >
        </div>
        <button class="btn-search-inline" @click="searchUsers">
          <i class="fas fa-search" /> 검색
        </button>
        <button class="btn-search-inline" style="background: #16a34a; color: white; border-color: #16a34a;" @click="openAddModal">
          <i class="fas fa-plus" /> 등록
        </button>
      </div>
    </div>

    <!-- 사용자 목록 테이블 -->
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
              <th>사용자 ID</th>
              <th>이름</th>
              <th>이메일</th>
              <th>연락처</th>
              <th>부서</th>
              <th>직급</th>
              <th>소속회사</th>
              <th>권한</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.userId" class="table-row">
              <td>{{ user.loginId }}</td>
              <td>{{ user.userName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td>{{ user.department || '-' }}</td>
              <td>{{ user.position || '-' }}</td>
              <td>{{ user.companyName || '-' }}</td>
              <td>
                <span class="role-badge" :class="getRoleClass(user.role)">
                  {{ getRoleName(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="{ active: user.enabled }">
                  {{ user.enabled ? '활성' : '비활성' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td class="action-buttons">
                <button class="btn-icon btn-edit" title="수정" @click="openEditModal(user)">
                  <i class="fas fa-edit" />
                </button>
                <button class="btn-icon btn-delete" title="삭제" @click="deleteUser(user)">
                  <i class="fas fa-trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 데이터가 없을 때 -->
        <div v-if="users.length === 0 && !loading" class="no-data-message">
          <i class="fas fa-users" />
          <p>등록된 사용자가 없습니다.</p>
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

    <!-- 사용자 등록/수정 모달 -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? '사용자 등록' : '사용자 수정' }}</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <form class="user-form" @submit.prevent="handleFormSubmit">
            <div class="form-row">
              <div class="form-group">
                <label>사용자 ID *</label>
                <input
                  v-model="userForm.loginId"
                  type="text"
                  required
                  placeholder="사용자 ID (4자 이상)"
                  :disabled="showEditModal"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.loginId }"
                >
                <span v-if="validationErrors.loginId" class="field-error">{{ validationErrors.loginId }}</span>
              </div>
              <div class="form-group">
                <label>비밀번호 *</label>
                <div v-if="showEditModal" class="password-section">
                  <button type="button" class="btn-password-change" @click="showPasswordModal = true">
                    <i class="fas fa-key" />
                    <span>비밀번호 변경</span>
                  </button>
                </div>
                <div v-else class="password-input-section">
                  <input
                    v-model="userForm.password"
                    type="password"
                    required
                    placeholder="비밀번호 (6자 이상)"
                    class="form-input"
                    :class="{ 'input-error': validationErrors.password }"
                  >
                </div>
                <span v-if="validationErrors.password" class="field-error">{{ validationErrors.password }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>권한 *</label>
                <select v-model="userForm.role" required class="form-select" :class="{ 'input-error': validationErrors.role }">
                  <option value="">
                    권한을 선택하세요
                  </option>
                  <option v-for="role in userRoles" :key="role.code" :value="role.code">
                    {{ role.codeName }}
                  </option>
                </select>
                <span v-if="validationErrors.role" class="field-error">{{ validationErrors.role }}</span>
              </div>
              <div class="form-group">
                <label>소속회사 <span v-if="isCompanyRequired" style="color: #dc2626;">*</span></label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <select
                    v-model="userForm.companyId"
                    class="form-select"
                    style="flex: 1;"
                    :disabled="loadingCompanies"
                    @change="onCompanyChange"
                  >
                    <option :value="null">
                      {{ isCompanyRequired ? '소속회사를 선택하세요 *' : '선택 안 함' }}
                    </option>
                    <option
                      v-for="company in companies"
                      :key="company.id"
                      :value="company.id"
                    >
                      {{ company.companyName }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="btn-secondary"
                    style="white-space: nowrap; padding: 0.4rem 0.75rem; font-size: 0.813rem;"
                    @click="showQuickCompanyModal = true"
                  >
                    <i class="fas fa-plus" /> 신규
                  </button>
                </div>
                <span v-if="loadingCompanies" class="field-hint">
                  <i class="fas fa-spinner fa-spin" /> 회사 목록 로딩 중...
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>이름 *</label>
                <input
                  v-model="userForm.userName"
                  type="text"
                  required
                  placeholder="이름"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.userName }"
                >
                <span v-if="validationErrors.userName" class="field-error">{{ validationErrors.userName }}</span>
              </div>
              <div class="form-group">
                <label>이메일 *</label>
                <input
                  v-model="userForm.email"
                  type="email"
                  required
                  placeholder="이메일"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.email }"
                  @blur="handleEmailBlur"
                >
                <span v-if="validationErrors.email" class="field-error">{{ validationErrors.email }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>연락처 *</label>
                <input
                  v-model="userForm.phone"
                  type="tel"
                  required
                  placeholder="010-1234-5678"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.phone }"
                  @input="handlePhoneInput"
                >
                <span v-if="validationErrors.phone" class="field-error">{{ validationErrors.phone }}</span>
              </div>
              <div class="form-group">
                <label>부서</label>
                <input
                  v-model="userForm.department"
                  type="text"
                  placeholder="부서"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>직급</label>
                <input
                  v-model="userForm.position"
                  type="text"
                  placeholder="직급"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>사원번호</label>
                <input
                  v-model="userForm.employeeNumber"
                  type="text"
                  placeholder="사원번호"
                  class="form-input"
                >
              </div>
            </div>

            <!-- 우편번호/주소/상세주소 - 현재 미사용 -->
            <!-- <div class="form-row">
              <div class="form-group">
                <label>우편번호</label>
                <input
                  v-model="userForm.zipCode"
                  type="text"
                  placeholder="우편번호 (5자리)"
                  class="form-input"
                  @input="handleZipCodeInput"
                >
              </div>
              <div class="form-group">
                <label>주소</label>
                <input
                  v-model="userForm.address"
                  type="text"
                  placeholder="주소"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>상세주소</label>
                <input
                  v-model="userForm.addressDetail"
                  type="text"
                  placeholder="상세주소"
                  class="form-input"
                >
              </div>
            </div> -->

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

    <!-- 회사 간편 등록 모달 -->
    <div v-if="showQuickCompanyModal" class="modal-overlay">
      <div class="modal" style="max-width: 420px;" @click.stop>
        <div class="modal-header">
          <h3>회사 간편 등록</h3>
          <button class="modal-close" @click="showQuickCompanyModal = false">
            <i class="fas fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.813rem; color: #6b7280; margin-bottom: 1rem;">
            <i class="fas fa-info-circle" />
            회사명만으로 간편 등록합니다. 상세 정보는 기초정보 > 회사정보에서 수정하세요.
          </p>
          <form @submit.prevent="submitQuickCompany">
            <div class="form-group">
              <label>회사명 *</label>
              <input v-model="quickCompanyForm.companyName" type="text" required placeholder="회사명을 입력하세요" class="form-input">
            </div>
            <!-- 전화번호는 회사정보 상세에서 입력 -->
            <!-- <div class="form-group">
              <label>전화번호</label>
              <input v-model="quickCompanyForm.tel" type="text" placeholder="02-1234-5678" class="form-input">
            </div> -->
            <div class="form-group">
              <label>회사 유형</label>
              <select v-model="quickCompanyForm.companyType" class="form-select">
                <option value="BUILDER">
                  건설사(시공사)
                </option>
                <option value="MANUFACTURER">
                  제조사(OEM)
                </option>
                <option value="TRANSPORT">
                  운송사
                </option>
                <option value="PARTNER">
                  협력사
                </option>
                <option value="OTHER">
                  기타
                </option>
              </select>
            </div>
            <div class="modal-actions" style="display: flex; margin-top: 1.5rem; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn-secondary" @click="showQuickCompanyModal = false">
                취소
              </button>
              <button type="submit" class="btn-primary" :disabled="quickCompanySubmitting">
                <i v-if="quickCompanySubmitting" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-plus" />
                {{ quickCompanySubmitting ? '등록 중...' : '등록' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 비밀번호 변경 모달 -->
    <div v-if="showPasswordModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>비밀번호 변경</h3>
          <button class="modal-close" @click="closePasswordModal">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div class="password-change-info">
            <i class="fas fa-shield-alt" />
            <p>새 비밀번호와 확인 비밀번호만 입력하세요.</p>
          </div>
          <form class="password-form" @submit.prevent="submitPasswordChange">
            <div class="form-group">
              <label>새 비밀번호 *</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                required
                placeholder="새 비밀번호를 입력하세요"
                class="form-input"
              >
              <small class="form-help">
                영문, 숫자, 특수문자 조합 6~100자
              </small>
            </div>

            <div class="form-group">
              <label>새 비밀번호 확인 *</label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                placeholder="새 비밀번호를 다시 입력하세요"
                class="form-input"
              >
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-key" />
                <span>비밀번호 변경</span>
              </button>
              <button type="button" class="btn-secondary" @click="closePasswordModal">
                <i class="fas fa-times" />
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
// API 서비스
import { userService } from '~/services/user.service'
import { codeService } from '~/services/code.service'
import { companyService } from '~/services/company.service'
import type { CompanyInfoResponse } from '~/types/company'
import { formatPhoneNumberInput, normalizeEmail, formatPostalCodeInput } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '사용자관리'
})

// 반응형 데이터
const userRoles = ref<any[]>([])
const companies = ref<CompanyInfoResponse[]>([])
const loadingCompanies = ref(false)

// 검색 관련
const searchForm = ref({
  searchKeyword: '',
  role: '',
  enabled: '',
  sortBy: 'createdAt',
  sortDirection: 'desc'
})

// useDataTable composable 사용으로 페이지네이션 로직 통합
const {
  items: users,
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
} = useDataTable<any>({
  fetchFunction: async (params) => {
    return await userService.getUsers({
      searchKeyword: searchForm.value.searchKeyword,
      role: searchForm.value.role,
      enabled: searchForm.value.enabled,
      page: params.page || 0,
      size: params.size || 10,
      sortBy: searchForm.value.sortBy,
      sortDirection: searchForm.value.sortDirection
    })
  },
  initialPageSize: 10
})

// 모달 관련
const showAddModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const showQuickCompanyModal = ref(false)
const quickCompanySubmitting = ref(false)
const quickCompanyForm = ref({
  companyName: '',
  tel: '',
  companyType: 'BUILDER'
})
const editingUser = ref<any>(null)

// 사용자 폼
const userForm = ref({
  userId: 0,
  loginId: '',
  password: '',
  userName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  employeeNumber: '',
  companyId: null as number | null,
  companyName: '',
  role: '',
  address: '',
  addressDetail: '',
  zipCode: ''
})

// 비밀번호 변경 폼
const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

// 유효성 검사 오류 메시지
const validationErrors = ref<{
  loginId: string
  password: string
  userName: string
  email: string
  role: string
  phone: string
  [key: string]: string
}>({
  loginId: '',
  password: '',
  userName: '',
  email: '',
  role: '',
  phone: ''
})

// 비밀번호 변경 유효성 검사 오류 메시지
const passwordValidationErrors = ref<{
  newPassword: string
  confirmPassword: string
  [key: string]: string
}>({
  newPassword: '',
  confirmPassword: ''
})

// 권한 클래스 반환
const getRoleClass = (role: string) => {
  switch (role) {
    case 'SYSTEM_ADMIN': return 'role-admin' // 빨강 - 시스템관리자
    case 'LEADPOWER_MANAGER': return 'role-leadpower' // 주황 - 리드파워 담당자
    case 'OEM_MANAGER': return 'role-oem' // 보라 - OEM 담당자
    case 'SITE_MANAGER': return 'role-site-manager' // 파랑 - 시공사 담당자
    case 'SITE_INSPECTOR': return 'role-inspector' // 초록 - 시공사 감리원
    case 'SALES_MANAGER': return 'role-sales' // 남색 - 영업 담당자
    case 'DELIVERY_DRIVER': return 'role-driver' // 청록 - 운송기사
    case 'READ_ONLY': return 'role-readonly' // 회색 - 조회 전용
    default: return 'role-default'
  }
}

// 권한 이름 반환
const getRoleName = (role: string) => {
  const roleObj = userRoles.value.find(r => r.code === role)
  return roleObj ? roleObj.codeName : role
}

// 날짜 포맷
const formatDate = (date: string) => {
  if (!date) { return '-' }
  return new Date(date).toLocaleDateString('ko-KR')
}

// 전화번호 입력 포맷팅 (공통 함수 사용)
const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  userForm.value.phone = formatPhoneNumberInput(input.value)
}

// 이메일 정규화 (공통 함수 사용)
const handleEmailBlur = (event: Event) => {
  const input = event.target as HTMLInputElement
  userForm.value.email = normalizeEmail(input.value)
}

// 우편번호 입력 포맷팅 - 현재 미사용 (주소 필드 주석 처리)
// const handleZipCodeInput = (event: Event) => {
//   const input = event.target as HTMLInputElement
//   userForm.value.zipCode = formatPostalCodeInput(input.value)
// }

// 검색
const searchUsers = () => {
  search()
}

// 등록 모달 열기
const openAddModal = () => {
  userForm.value = {
    userId: 0,
    loginId: '',
    password: '',
    userName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeNumber: '',
    companyId: null,
    companyName: '',
    role: '',
    address: '',
    addressDetail: '',
    zipCode: ''
  }
  validationErrors.value = {
    loginId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }
  showAddModal.value = true
}

// 수정 모달 열기
const openEditModal = (user: any) => {
  editingUser.value = user

  // companyName으로 companyId 찾기
  let companyId = user.companyId || null
  if (!companyId && user.companyName) {
    const foundCompany = companies.value.find(c => c.companyName === user.companyName)
    if (foundCompany) {
      companyId = foundCompany.id
    }
  }

  userForm.value = {
    ...user,
    companyId
  }
  validationErrors.value = {
    loginId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }
  showEditModal.value = true
}

// 회사 선택 변경 시 companyName도 업데이트
const onCompanyChange = () => {
  if (userForm.value.companyId) {
    const selectedCompany = companies.value.find(c => c.id === userForm.value.companyId)
    userForm.value.companyName = selectedCompany?.companyName || ''
  } else {
    userForm.value.companyName = ''
  }
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingUser.value = null
  validationErrors.value = {
    loginId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }
}

// 비밀번호 변경 모달 닫기
const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.value = {
    newPassword: '',
    confirmPassword: ''
  }
  passwordValidationErrors.value = {
    newPassword: '',
    confirmPassword: ''
  }
}

// 유효성 검사
// 소속회사 필수 여부 (role에 따라 동적)
const isCompanyRequired = computed(() => {
  return ['SITE_MANAGER', 'SITE_INSPECTOR', 'OEM_MANAGER'].includes(userForm.value.role)
})

// 회사 간편 등록
const submitQuickCompany = async () => {
  if (!quickCompanyForm.value.companyName.trim()) {
    alert('회사명을 입력해주세요.')
    return
  }

  quickCompanySubmitting.value = true
  try {
    const result = await companyService.quickCreateCompany(
      quickCompanyForm.value.companyName,
      quickCompanyForm.value.companyType
    )

    if (result) {
      // 회사 목록 새로고침
      await loadCompanies()

      // 방금 등록한 회사를 자동 선택
      userForm.value.companyId = result.id
      userForm.value.companyName = result.companyName

      alert(`'${result.companyName}' 회사가 등록되었습니다.\n상세 정보는 기초정보 > 회사정보에서 수정하세요.`)
    }

    // 모달 닫기 + 폼 초기화
    showQuickCompanyModal.value = false
    quickCompanyForm.value = { companyName: '', tel: '', companyType: 'BUILDER' }
  } catch (err) {
    console.error('회사 간편 등록 실패:', err)
    alert(`회사 등록에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    quickCompanySubmitting.value = false
  }
}

const validateForm = (): boolean => {
  validationErrors.value = {
    loginId: '',
    password: '',
    userName: '',
    email: '',
    role: '',
    phone: ''
  }

  let isValid = true

  if (!userForm.value.loginId) {
    validationErrors.value.loginId = '사용자 ID를 입력해주세요.'
    isValid = false
  } else if (userForm.value.loginId.length < 4 || userForm.value.loginId.length > 50) {
    validationErrors.value.loginId = '사용자 ID는 4~50자 사이여야 합니다.'
    isValid = false
  }

  if (showAddModal.value) {
    if (!userForm.value.password) {
      validationErrors.value.password = '비밀번호를 입력해주세요.'
      isValid = false
    } else if (userForm.value.password.length < 6 || userForm.value.password.length > 100) {
      validationErrors.value.password = '비밀번호는 6~100자 사이여야 합니다.'
      isValid = false
    }
  }

  if (!userForm.value.userName) {
    validationErrors.value.userName = '이름을 입력해주세요.'
    isValid = false
  }

  if (!userForm.value.email) {
    validationErrors.value.email = '이메일을 입력해주세요.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.value.email)) {
    validationErrors.value.email = '올바른 이메일 형식을 입력해주세요.'
    isValid = false
  }

  if (!userForm.value.role) {
    validationErrors.value.role = '권한을 선택해주세요.'
    isValid = false
  }

  if (!userForm.value.phone) {
    validationErrors.value.phone = '연락처를 입력해주세요.'
    isValid = false
  }

  // 소속회사 필수 검증 (시공사/OEM 관련 role)
  const companyRequiredRoles = ['SITE_MANAGER', 'SITE_INSPECTOR', 'OEM_MANAGER']
  if (companyRequiredRoles.includes(userForm.value.role) && !userForm.value.companyId) {
    alert('시공사 담당자, 시공사 감리원, OEM 담당자 권한은 소속회사 선택이 필수입니다.')
    isValid = false
  }

  return isValid
}

// 비밀번호 변경 유효성 검사
const validatePasswordForm = (): boolean => {
  passwordValidationErrors.value = {
    newPassword: '',
    confirmPassword: ''
  }

  let isValid = true

  if (!passwordForm.value.newPassword) {
    passwordValidationErrors.value.newPassword = '새 비밀번호를 입력해주세요.'
    isValid = false
  } else if (passwordForm.value.newPassword.length < 6 || passwordForm.value.newPassword.length > 100) {
    passwordValidationErrors.value.newPassword = '비밀번호는 6~100자 사이여야 합니다.'
    isValid = false
  }

  if (!passwordForm.value.confirmPassword) {
    passwordValidationErrors.value.confirmPassword = '확인 비밀번호를 입력해주세요.'
    isValid = false
  } else if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordValidationErrors.value.confirmPassword = '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'
    isValid = false
  }

  return isValid
}

// 등록
// 통합 폼 제출 핸들러
const handleFormSubmit = async () => {
  if (showAddModal.value) {
    await submitAdd()
  } else {
    await submitEdit()
  }
}

const submitAdd = async () => {
  if (!validateForm()) {
    // 구체적인 오류 메시지 수집
    const errors = Object.values(validationErrors.value).filter(msg => msg)
    alert(errors.length > 0 ? errors.join('\n') : '입력 정보를 확인해주세요.')
    return
  }

  try {
    console.log('사용자 등록 시도:', userForm.value)
    const result = await userService.createUser(userForm.value)
    console.log('사용자 등록 성공:', result)

    closeModal()
    refresh()
    alert('사용자가 성공적으로 등록되었습니다.')
  } catch (error) {
    console.error('사용자 등록 실패:', error)

    let errorMessage = '사용자 등록에 실패했습니다.'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    alert(errorMessage + '\n\n콘솔을 확인하여 상세 오류를 확인하세요.')
  }
}

// 수정
const submitEdit = async () => {
  if (!validateForm() || !editingUser.value) { return }

  try {
    await userService.updateUser(editingUser.value.userId, userForm.value)
    closeModal()
    refresh()
    alert('사용자가 성공적으로 수정되었습니다.')
  } catch (error) {
    console.error('사용자 수정 실패:', error)
    alert(error instanceof Error ? error.message : '사용자 수정에 실패했습니다.')
  }
}

// 삭제
const deleteUser = async (user: any) => {
  if (!confirm('정말 삭제하시겠습니까?')) { return }

  try {
    await userService.deleteUser(user.userId)
    refresh()
    alert('사용자가 성공적으로 삭제되었습니다.')
  } catch (error) {
    console.error('사용자 삭제 실패:', error)
    alert(error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.')
  }
}

// 비밀번호 변경
const submitPasswordChange = async () => {
  if (!validatePasswordForm() || !editingUser.value) { return }

  try {
    await userService.changePassword(editingUser.value.userId, passwordForm.value)
    closePasswordModal()
    alert('비밀번호가 성공적으로 변경되었습니다.')
  } catch (error) {
    console.error('비밀번호 변경 실패:', error)
    alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
  }
}

// 권한 목록 조회
const loadUserRoles = async () => {
  try {
    const response = await codeService.getCodeDetails('USER_ROLE')
    userRoles.value = response
  } catch (error) {
    console.error('권한 목록 조회 실패:', error)
  }
}

/**
 * 회사 목록 로드
 */
const loadCompanies = async () => {
  try {
    loadingCompanies.value = true
    companies.value = await companyService.getCompanies()
    console.log('회사 목록 로드 완료:', companies.value.length, '개')
  } catch (error) {
    console.error('회사 목록 로드 실패:', error)
    companies.value = []
  } finally {
    loadingCompanies.value = false
  }
}

// 초기 로드
onMounted(() => {
  loadUserRoles()
  refresh()
  loadCompanies()
})
</script>

<style scoped>
/* 공통 CSS import */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-modals.css';

/* 유효성 검사 오류 스타일 */
.field-error {
  display: block;
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.input-error {
  border-color: #dc2626 !important;
}

/* 페이지 특화 스타일만 작성 */

.user-management {
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

/* 권한 셀렉트 박스 너비 */
.role-select {
  min-width: 120px;
}

/* 역할별 배지 색상 */
.role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.role-admin { background: #dc2626; color: white; }           /* 빨강 - 시스템관리자 (SYSTEM_ADMIN) */
.role-leadpower { background: #f59e0b; color: white; }       /* 주황 - 리드파워 담당자 (LEADPOWER_MANAGER) */
.role-oem { background: #7c3aed; color: white; }             /* 보라 - OEM 담당자 (OEM_MANAGER) */
.role-site-manager { background: #2563eb; color: white; }    /* 파랑 - 시공사 담당자 (SITE_MANAGER) */
.role-inspector { background: #059669; color: white; }       /* 초록 - 시공사 감리원 (SITE_INSPECTOR) */
.role-sales { background: #1e40af; color: white; }           /* 남색 - 영업 담당자 (SALES_MANAGER) */
.role-driver { background: #0891b2; color: white; }          /* 청록 - 운송기사 (DELIVERY_DRIVER) */
.role-readonly { background: #6b7280; color: white; }        /* 회색 - 조회 전용 (READ_ONLY) */
.role-default { background: #f3f4f6; color: #374151; }       /* 기본 */

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.password-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  justify-content: space-between;
}

.password-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-password-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 42px;
}

.btn-password-change:hover {
  background: #7c3aed;
}

.password-input-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.password-change-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.password-change-info i {
  color: #0369a1;
  font-size: 1.25rem;
}

.password-change-info p {
  color: #0c4a6e;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
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

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .password-section {
    flex-direction: column;
    height: auto;
    gap: 0.5rem;
  }

  .password-info {
    height: auto;
  }

  .btn-password-change {
    width: 100%;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>
