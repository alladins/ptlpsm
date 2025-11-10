<template>
  <div class="company-info">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="회사 정보"
      description="회사 정보를 관리합니다."
    />

    <div class="content-section">
      <!-- 탭 영역 -->
      <div class="tabs-section" v-if="companies.length > 0">
        <div class="tabs-header">
          <button 
            v-for="(company, index) in companies" 
            :key="company.id"
            class="tab-button"
            :class="{ 'active': selectedTabIndex === index }"
            @click="selectTab(index)"
          >
            {{ company.companyName }}
          </button>
          <button 
            class="tab-button add-tab"
            @click="addNewTab"
          >
            <i class="fas fa-plus"></i>
            신규
          </button>
        </div>
      </div>

      <div class="company-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="required">회사명</label>
            <input 
              type="text" 
              v-model="companyData.companyName"
              class="form-input"
              :class="{ 'error': errors.companyName }"
              placeholder="회사명을 입력하세요"
            >
            <span v-if="errors.companyName" class="error-message">{{ errors.companyName }}</span>
          </div>

          <div class="form-group">
            <label>나라장터등록번호</label>
            <input 
              type="text" 
              v-model="companyData.g2bNumber"
              class="form-input"
              :class="{ 'error': errors.g2bNumber }"
              placeholder="나라장터등록번호를 입력하세요"
              maxlength="8"
            >
            <span v-if="errors.g2bNumber" class="error-message">{{ errors.g2bNumber }}</span>
          </div>

          <div class="form-group">
            <label class="required">사업자등록번호</label>
            <input 
              type="text" 
              v-model="companyData.businessNumber"
              class="form-input"
              :class="{ 'error': errors.businessNumber }"
              placeholder="사업자등록번호를 입력하세요"
              @input="formatBusinessNumber"
            >
            <span v-if="errors.businessNumber" class="error-message">{{ errors.businessNumber }}</span>
          </div>

          <div class="form-group">
            <label class="required">대표자명</label>
            <input 
              type="text" 
              v-model="companyData.representative"
              class="form-input"
              :class="{ 'error': errors.representative }"
              placeholder="대표자명을 입력하세요"
            >
            <span v-if="errors.representative" class="error-message">{{ errors.representative }}</span>
          </div>

          <div class="form-group">
            <label class="required">전화번호</label>
            <input 
              type="text" 
              v-model="companyData.tel"
              class="form-input"
              :class="{ 'error': errors.tel }"
              placeholder="전화번호를 입력하세요"
              @input="handlePhoneNumberFormat"
            >
            <span v-if="errors.tel" class="error-message">{{ errors.tel }}</span>
          </div>

          <div class="form-group">
            <label>팩스번호</label>
            <input 
              type="text" 
              v-model="companyData.fax"
              class="form-input"
              :class="{ 'error': errors.fax }"
              placeholder="팩스번호를 입력하세요"
              @input="handleFaxNumberFormat"
            >
            <span v-if="errors.fax" class="error-message">{{ errors.fax }}</span>
          </div>

          <div class="form-group">
            <label class="required">이메일</label>
            <input 
              type="email" 
              v-model="companyData.email"
              class="form-input"
              :class="{ 'error': errors.email }"
              placeholder="이메일을 입력하세요"
            >
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label>홈페이지</label>
            <input 
              type="url" 
              v-model="companyData.homepage"
              class="form-input"
              :class="{ 'error': errors.homepage }"
              placeholder="홈페이지 주소를 입력하세요"
            >
            <span v-if="errors.homepage" class="error-message">{{ errors.homepage }}</span>
          </div>

          <div class="form-group">
            <label class="required">설립일자</label>
            <input 
              type="date" 
              v-model="companyData.establishedDate"
              class="form-input"
              :class="{ 'error': errors.establishedDate }"
            >
            <span v-if="errors.establishedDate" class="error-message">{{ errors.establishedDate }}</span>
          </div>

          <div class="form-group">
            <label>직원수</label>
            <input 
              type="number" 
              v-model="companyData.employeeCount"
              class="form-input"
              :class="{ 'error': errors.employeeCount }"
              placeholder="직원수를 입력하세요"
            >
            <span v-if="errors.employeeCount" class="error-message">{{ errors.employeeCount }}</span>
          </div>

          <div class="form-group">
            <label>연매출액</label>
            <input 
              type="number" 
              v-model="companyData.annualSales"
              class="form-input"
              :class="{ 'error': errors.annualSales }"
              placeholder="연매출액을 입력하세요"
            >
            <span v-if="errors.annualSales" class="error-message">{{ errors.annualSales }}</span>
          </div>

          <div class="form-group">
            <label class="required">업태</label>
            <input 
              type="text" 
              v-model="companyData.businessType"
              class="form-input"
              :class="{ 'error': errors.businessType }"
              placeholder="업태를 입력하세요"
            >
            <span v-if="errors.businessType" class="error-message">{{ errors.businessType }}</span>
          </div>

          <div class="form-group">
            <label class="required">업종</label>
            <input 
              type="text" 
              v-model="companyData.businessCategory"
              class="form-input"
              :class="{ 'error': errors.businessCategory }"
              placeholder="업종을 입력하세요"
            >
            <span v-if="errors.businessCategory" class="error-message">{{ errors.businessCategory }}</span>
          </div>

          <div class="form-group">
            <label class="required">우편번호</label>
            <div class="postal-code-group">
              <input 
                type="text" 
                v-model="companyData.zipCode"
                class="form-input"
                :class="{ 'error': errors.zipCode }"
                placeholder="우편번호"
                readonly
              >
              <button type="button" @click="openPostalSearch" class="btn-postal-search">
                <i class="fas fa-search"></i>
                우편번호 검색
              </button>
            </div>
            <span v-if="errors.zipCode" class="error-message">{{ errors.zipCode }}</span>
          </div>

          <div class="form-group full-width">
            <label class="required">주소</label>
            <input 
              type="text" 
              v-model="companyData.address"
              class="form-input"
              :class="{ 'error': errors.address }"
              placeholder="주소를 입력하세요"
              readonly
            >
            <span v-if="errors.address" class="error-message">{{ errors.address }}</span>
          </div>

          <div class="form-group full-width">
            <label>상세주소</label>
            <input 
              type="text" 
              v-model="companyData.detailAddress"
              class="form-input"
              placeholder="상세주소를 입력하세요"
            >
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="button-section">
          <div class="button-group">
            <button type="button" class="btn-primary" @click="saveCompany" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { companyService } from '~/services/company.service'
import type { CompanyInfoResponse } from '~/types/company'

interface Company {
  id: number
  companyName: string
  businessNumber: string
  g2bNumber?: string
  representative: string
  address: string
  detailAddress?: string
  zipCode: string
  tel: string
  fax?: string
  email: string
  homepage?: string
  establishedDate: string
  employeeCount?: number
  annualSales?: number
  businessType: string
  businessCategory: string
  createdAt: string
  updatedAt: string
}

type CompanyCreateRequest = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
type CompanyUpdateRequest = CompanyCreateRequest

declare global {
  interface Window {
    daum: {
      Postcode: new (config: { oncomplete: (data: any) => void }) => any
    }
  }
}

definePageMeta({
  layout: 'admin',
  pageTitle: '회사 정보'
})

// 함수 선언
const selectTab = async (index: number) => {
  try {
    selectedTabIndex.value = index
    isNewForm.value = false

    // 선택된 회사의 상세 정보 조회 (service 사용)
    const company = await companyService.getCompanyById(companies.value[index].id)

    companyData.value = {
      companyName: company.companyName,
      businessNumber: company.businessNumber,
      g2bNumber: company.g2bNumber || '',
      representative: company.representative,
      address: company.address,
      detailAddress: company.detailAddress || '',
      zipCode: company.zipCode,
      tel: company.tel,
      fax: company.fax || '',
      email: company.email,
      homepage: company.homepage || '',
      establishedDate: company.establishedDate,
      employeeCount: company.employeeCount || 0,
      annualSales: company.annualSales || 0,
      businessType: company.businessType,
      businessCategory: company.businessCategory
    }
  } catch (error) {
    console.error('회사 정보 로드 오류:', error)
    alert('회사 정보를 불러오는데 실패했습니다.')
  }
}

const addNewTab = () => {
  isNewForm.value = true
  selectedTabIndex.value = companies.value.length
  resetForm(false) // confirm 메시지 표시하지 않음
}

const resetForm = (showConfirm = true) => {
  if (showConfirm && !confirm('입력한 내용을 초기화하시겠습니까?')) {
    return
  }

  companyData.value = {
    companyName: '',
    businessNumber: '',
    g2bNumber: '',
    representative: '',
    address: '',
    detailAddress: '',
    zipCode: '',
    tel: '',
    fax: '',
    email: '',
    homepage: '',
    establishedDate: '',
    employeeCount: 0,
    annualSales: 0,
    businessType: '',
    businessCategory: ''
  }
}

// 상태 관리
const companies = ref<CompanyInfoResponse[]>([])
const selectedTabIndex = ref(0)
const isNewForm = ref(false)

// 회사 정보 폼 데이터
const companyData = ref<CompanyCreateRequest>({
  companyName: '',
  businessNumber: '',
  g2bNumber: '',
  representative: '',
  address: '',
  detailAddress: '',
  zipCode: '',
  tel: '',
  fax: '',
  email: '',
  homepage: '',
  establishedDate: '',
  employeeCount: 0,
  annualSales: 0,
  businessType: '',
  businessCategory: ''
})

const saving = ref(false)
const errors = ref({
  companyName: '',
  businessNumber: '',
  g2bNumber: '',
  representative: '',
  address: '',
  detailAddress: '',
  zipCode: '',
  tel: '',
  fax: '',
  email: '',
  homepage: '',
  establishedDate: '',
  employeeCount: '',
  annualSales: '',
  businessType: '',
  businessCategory: ''
})

// 사업자등록번호 포맷팅
const formatBusinessNumber = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/[^0-9]/g, '')
  
  if (value.length <= 10) {
    value = value.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
  }
  
  companyData.value.businessNumber = value
}

// 전화번호/팩스번호 공통 포맷팅 함수
const formatPhoneOrFaxNumber = (value: string): string => {
  value = value.replace(/[^0-9]/g, '')
  
  // 지역번호 (02)
  if (value.startsWith('02')) {
    if (value.length <= 9) { // 02-123-4567 형식
      return value.replace(/^(\d{2})(\d{3,4})(\d{4})$/, '$1-$2-$3')
    } else { // 02-1234-5678 형식
      return value.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1-$2-$3')
    }
  }
  // 휴대폰 또는 지역번호 (3자리)
  else {
    if (value.length <= 11) {
      return value.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')
    }
  }
  return value
}

// 전화번호 포맷팅 핸들러
const handlePhoneNumberFormat = (event: Event) => {
  const input = event.target as HTMLInputElement
  companyData.value.tel = formatPhoneOrFaxNumber(input.value)
}

// 팩스번호 포맷팅 핸들러
const handleFaxNumberFormat = (event: Event) => {
  const input = event.target as HTMLInputElement
  companyData.value.fax = formatPhoneOrFaxNumber(input.value)
}

// 우편번호 검색
const openPostalSearch = () => {
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      companyData.value.zipCode = data.zonecode
      companyData.value.address = data.address
      companyData.value.detailAddress = ''
    }
  }).open()
}

// 폼 검증
const validateForm = (): boolean => {
  let isValid = true
  errors.value = {
    companyName: '',
    businessNumber: '',
    g2bNumber: '',
    representative: '',
    address: '',
    detailAddress: '',
    zipCode: '',
    tel: '',
    fax: '',
    email: '',
    homepage: '',
    establishedDate: '',
    employeeCount: '',
    annualSales: '',
    businessType: '',
    businessCategory: ''
  }

  // 나라장터등록번호 유효성 검사 (선택 입력, 입력 시 8자리 검사)
  if (companyData.value.g2bNumber && companyData.value.g2bNumber.length !== 8) {
    errors.value.g2bNumber = '나라장터등록번호는 8자리여야 합니다.'
    isValid = false
  }

  if (!companyData.value.companyName) {
    errors.value.companyName = '회사명을 입력해주세요.'
    isValid = false
  }

  if (!companyData.value.businessNumber) {
    errors.value.businessNumber = '사업자등록번호를 입력해주세요.'
    isValid = false
  } else if (!/^\d{3}-\d{2}-\d{5}$/.test(companyData.value.businessNumber)) {
    errors.value.businessNumber = '올바른 사업자등록번호 형식이 아닙니다.'
    isValid = false
  }

  if (!companyData.value.representative) {
    errors.value.representative = '대표자명을 입력해주세요.'
    isValid = false
  }

  // 전화번호/팩스번호 유효성 검사를 위한 정규식
  const phonePattern = /^(02|\d{3})-\d{3,4}-\d{4}$/

  if (!companyData.value.tel) {
    errors.value.tel = '전화번호를 입력해주세요.'
    isValid = false
  } else if (!phonePattern.test(companyData.value.tel)) {
    errors.value.tel = '올바른 전화번호 형식이 아닙니다.'
    isValid = false
  }

  if (companyData.value.fax && !phonePattern.test(companyData.value.fax)) {
    errors.value.fax = '올바른 팩스번호 형식이 아닙니다.'
    isValid = false
  }

  if (!companyData.value.email) {
    errors.value.email = '이메일을 입력해주세요.'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.value.email)) {
    errors.value.email = '올바른 이메일 형식이 아닙니다.'
    isValid = false
  }

  if (companyData.value.homepage && !/^https?:\/\/.*/.test(companyData.value.homepage)) {
    errors.value.homepage = '올바른 홈페이지 주소 형식이 아닙니다.'
    isValid = false
  }

  if (!companyData.value.establishedDate) {
    errors.value.establishedDate = '설립일자를 입력해주세요.'
    isValid = false
  }

  if (!companyData.value.businessType) {
    errors.value.businessType = '업태를 입력해주세요.'
    isValid = false
  }

  if (!companyData.value.businessCategory) {
    errors.value.businessCategory = '업종을 입력해주세요.'
    isValid = false
  }

  if (!companyData.value.zipCode) {
    errors.value.zipCode = '우편번호를 입력해주세요.'
    isValid = false
  }

  if (!companyData.value.address) {
    errors.value.address = '주소를 입력해주세요.'
    isValid = false
  }

  return isValid
}

// 회사 정보 저장
// 회사 정보 저장
const saveCompany = async () => {
  if (!validateForm()) {
    return
  }

  try {
    saving.value = true
    
    console.log('회사 정보 저장 시작:', { isNewForm: isNewForm.value, selectedTabIndex: selectedTabIndex.value })
    
    let company
    if (!isNewForm.value && selectedTabIndex.value < companies.value.length) {
      // 수정: companyService 사용
      const currentCompany = companies.value[selectedTabIndex.value]
      console.log('회사 정보 수정 요청:', { id: currentCompany.id, data: companyData.value })

      company = await companyService.updateCompany(currentCompany.id, companyData.value)
    } else {
      // 신규 등록: companyService 사용
      console.log('회사 정보 등록 요청:', { data: companyData.value })

      company = await companyService.createCompany(companyData.value)
    }

    if (!company) {
      throw new Error('서버에서 응답이 없습니다')
    }

    console.log('API 응답:', company)
    
    if (isNewForm.value) {
      // 신규 등록 시 목록에 추가
      companies.value.push(company)
      selectedTabIndex.value = companies.value.length - 1
      isNewForm.value = false
    } else {
      // 수정 시 목록 갱신
      companies.value[selectedTabIndex.value] = company
    }

    // 폼 데이터 갱신
    companyData.value = {
      companyName: company.companyName,
      businessNumber: company.businessNumber,
      g2bNumber: company.g2bNumber || '',
      representative: company.representative,
      address: company.address,
      detailAddress: company.detailAddress || '',
      zipCode: company.zipCode,
      tel: company.tel,
      fax: company.fax || '',
      email: company.email,
      homepage: company.homepage || '',
      establishedDate: company.establishedDate,
      employeeCount: company.employeeCount || 0,
      annualSales: company.annualSales || 0,
      businessType: company.businessType,
      businessCategory: company.businessCategory
    }

    alert(isNewForm.value ? '회사 정보가 등록되었습니다.' : '회사 정보가 수정되었습니다.')
  } catch (error) {
    console.error('회사 정보 저장 오류:', error)
    alert('회사 정보 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// 회사 정보 로드
const loadCompanies = async () => {
  try {
    // 회사 목록 조회 (service 사용)
    const data = await companyService.getCompanies()

    console.log('받은 회사 데이터:', data)

    if (Array.isArray(data) && data.length > 0) {
      companies.value = data
      console.log('회사 목록 설정:', companies.value)
      isNewForm.value = false
      selectedTabIndex.value = 0

      // 첫 번째 회사의 상세 정보 로드 (service 사용)
      const company = await companyService.getCompanyById(data[0].id)
      console.log('첫 번째 회사 상세 정보:', company)

      companyData.value = {
        companyName: company.companyName,
        businessNumber: company.businessNumber,
        g2bNumber: company.g2bNumber || '',
        representative: company.representative,
        address: company.address,
        detailAddress: company.detailAddress || '',
        zipCode: company.zipCode,
        tel: company.tel,
        fax: company.fax || '',
        email: company.email,
        homepage: company.homepage || '',
        establishedDate: company.establishedDate,
        employeeCount: company.employeeCount || 0,
        annualSales: company.annualSales || 0,
        businessType: company.businessType,
        businessCategory: company.businessCategory
      }
    } else {
      console.log('회사 데이터 없음, 신규 폼 표시')
      isNewForm.value = true
    }
  } catch (error) {
    console.error('회사 정보 로드 오류:', error)
    isNewForm.value = true
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadCompanies()
})
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.company-info)
   - 버튼 스타일 (.btn-primary, .btn-secondary)
   - 폼 스타일 (.form-input)
   ============================================ */

/* 페이지 특화 스타일만 작성 */

.content-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-section {
  border-bottom: 1px solid #e5e7eb;
}

.tabs-header {
  display: flex;
  padding: 0 1rem;
  gap: 0.25rem;
  overflow-x: auto;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #3b82f6;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button.add-tab {
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button.add-tab:hover {
  color: #059669;
}

.company-form {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
}

.postal-code-group {
  display: flex;
  gap: 0.5rem;
}

.postal-code-group .form-input {
  width: 150px;
}

.btn-postal-search {
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

.btn-postal-search:hover {
  background: #2563eb;
}

.button-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .button-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>