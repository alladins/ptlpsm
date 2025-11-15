<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- 배경 오버레이 -->
    <div class="absolute inset-0 bg-black bg-opacity-50"></div>
    
    <!-- 팝업 컨텐츠 -->
    <div class="relative bg-white rounded-lg w-full max-w-xl mx-auto p-4 sm:p-8 max-h-[80vh] overflow-y-auto mt-16 sm:mt-20">
      <!-- 닫기 버튼 -->
      <button 
        @click="close" 
        class="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg 
          class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- 팝업 헤더 -->
      <div class="text-center mb-6 sm:mb-8">
        <h3 class="text-xl sm:text-2xl font-bold text-gray-800">{{ popupTitle }}</h3>
        <p class="text-sm sm:text-base text-gray-600 mt-2">
          전문 컨설턴트가 빠르게 답변드리겠습니다
        </p>
      </div>

      <!-- 상담 폼 -->
      <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
        <!-- 메인페이지에서 접근 시에만 표시되는 문의유형 선택 -->
        <div v-if="!props.defaultInquiryType">
          <label class="block text-sm font-medium text-gray-700 mb-1">문의유형 *</label>
          <select 
            v-model="form.inquiryType"
            required
            @change="handleInquiryTypeChange"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택해주세요</option>
            <option v-for="type in inquiryTypes" 
                    :key="type.code" 
                    :value="type.code">
              {{ type.codeName }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
            <input 
              v-model="form.company"
              type="text" 
              required
              placeholder="회사명을 입력해주세요"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{'border-red-500': errors.company}"
            >
            <p v-if="errors.company" class="mt-1 text-xs sm:text-sm text-red-500">{{ errors.company }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
            <input 
              v-model="form.name"
              type="text" 
              placeholder="담당자명을 입력해주세요"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{'border-red-500': errors.name}"
            >
            <p v-if="errors.name" class="mt-1 text-xs sm:text-sm text-red-500">{{ errors.name }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">연락처 *</label>
            <input 
              v-model="form.phone"
              type="text"
              maxlength="13"
              required
              @input="formatPhoneNumber"
              placeholder="010-0000-0000" 
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div> 
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input 
              v-model="form.email"
              type="email"
              placeholder="example@email.com"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{'border-red-500': errors.email}"
            >
            <p v-if="errors.email" class="mt-1 text-xs sm:text-sm text-red-500">{{ errors.email }}</p>
          </div>
        </div>               

        <!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">매출액</label>
            <select 
              v-model="form.revenue"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">선택해주세요</option>
              <option v-for="revenue in revenueTypes" 
                      :key="revenue.code" 
                      :value="revenue.code">
                {{ revenue.codeName }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">인원수</label>
            <select 
              v-model="form.employeeCount"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">선택해주세요</option>
              <option v-for="employee in employeeTypes" 
                      :key="employee.code" 
                      :value="employee.code">
                {{ employee.codeName }}
              </option>
            </select>
          </div>
        </div> -->

        <!-- <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">업종</label>
          <input 
            v-model="form.industry"
            type="text" 
            placeholder="업종을 입력해주세요"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">추가인증</label>
          <div class="flex flex-wrap gap-2">
            <label v-for="type in inquiryTypes" 
                   :key="type.code" 
                   class="inline-flex items-center">
              <input 
                type="checkbox" 
                :value="type.code"
                v-model="form.additionalCertifications"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
              <span class="ml-2 text-sm text-gray-700">{{ type.codeName }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">문의내용</label>
          <textarea 
            v-model="form.message"
            rows="4"
            placeholder="문의하실 내용을 자세히 적어주시면 더욱 정확한 상담이 가능합니다."
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{'border-red-500': errors.message}"
          ></textarea>
          <p v-if="errors.message" class="mt-1 text-xs sm:text-sm text-red-500">{{ errors.message }}</p>
        </div> -->

        <div class="flex items-start">
          <input 
            v-model="form.agreement"
            type="checkbox"
            required
            class="mt-1 w-4 h-4"
            :class="{'border-red-500': errors.agreement}"
          >
          <label class="ml-2 text-xs sm:text-sm text-gray-600">
            개인정보 수집 및 이용에 동의합니다. *
          </label>          
        </div>
        <p v-if="errors.agreement" class="mt-1 text-xs sm:text-sm text-red-500">{{ errors.agreement }}</p>

        <!-- Textarea to display the privacy policy -->
        <textarea 
          id="privacyPolicyText" 
          v-model="privacyPolicyContent"
          class="w-full mt-4 border border-gray-300 rounded p-2 text-xs sm:text-sm text-gray-600"
          rows="4"
          readonly
        ></textarea>

        <button 
          type="submit"
          class="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors relative"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">상담 신청하기</span>
          <span v-else class="flex items-center justify-center">
            <svg class="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            처리중...
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ConsultationPopup'
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#imports'
import { consultationService } from '~/services/consultation.service'
import { codeService } from '~/services/code.service'
import type { CodeDetail } from '~/services/code.service'
import { formatPhoneNumberInput } from '~/utils/format'

// 상담 폼 데이터 인터페이스 정의
interface ConsultationForm {
  company: string        // 회사명
  name: string          // 담당자명
  phone: string         // 연락처
  email: string         // 이메일
  message: string       // 문의내용
  agreement: boolean    // 개인정보 수집 동의 여부
  inquiryType: string   // 문의유형
  source: string        // 접근 경로
  createdAt: string     // 생성일시
  revenue: string       // 매출액 코드
  employeeCount: string // 인원수 코드
  industry: string      // 업종
  additionalCertifications: string[] // 추가인증 코드 배열
}

// 컴포넌트 props 정의
const props = defineProps({
  isOpen: Boolean,      // 팝업 표시 여부
  pageTitle: {          // 페이지 제목
    type: String,
    default: ''
  },
  defaultInquiryType: { // 기본 문의유형
    type: String,
    default: ''
  }
})

// 이벤트 emit 정의
const emit = defineEmits(['close'])
const route = useRoute()

// 로딩 상태 관리
const isLoadingState = ref(false)
const isLoading = computed(() => isLoadingState.value)

// 팝업 제목 계산
const popupTitle = computed(() => `${props.pageTitle} 상담신청`)

// 폼 데이터 초기화
const form = ref<ConsultationForm>({
  company: '',
  name: '',
  phone: '',
  email: '',
  message: '',
  agreement: false,
  inquiryType: props.defaultInquiryType || '',
  source: '',
  createdAt: new Date().toISOString(),
  revenue: '',
  employeeCount: '',
  industry: '',
  additionalCertifications: []
})

// 문의유형 목록 관리
const inquiryTypes = ref<CodeDetail[]>([])

// 매출액, 인원수 목록 관리
const revenueTypes = ref<CodeDetail[]>([])
const employeeTypes = ref<CodeDetail[]>([])

// 코드 데이터 로드
const loadCodeData = async () => {
  try {
    // 문의유형 로드
    const certTypes = await codeService.getActiveCodes('CERT_TYPE')
    inquiryTypes.value = certTypes.sort((a, b) => a.sortOrder - b.sortOrder)
    
    // 매출액 코드 로드
    const revenueCodes = await codeService.getActiveCodes('REVENUE')
    revenueTypes.value = revenueCodes.sort((a, b) => a.sortOrder - b.sortOrder)
    
    // 인원수 코드 로드
    const employeeCodes = await codeService.getActiveCodes('EMPLOYEE')
    employeeTypes.value = employeeCodes.sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error('코드 데이터 로드 중 오류:', error)
  }
}

// 컴포넌트 마운트 시 초기화
onMounted(async () => {
  form.value.source = route.path  // 현재 경로 저장
  await loadCodeData()            // 코드 데이터 로드
  
  // 기본 문의유형이 있는 경우 추가인증에 자동으로 추가
  if (props.defaultInquiryType) {
    form.value.inquiryType = props.defaultInquiryType
    form.value.additionalCertifications = [props.defaultInquiryType]
  }
})

// 폼 유효성 검사 오류 관리
const errors = ref<Partial<Record<keyof ConsultationForm, string>>>({})

// 전화번호 유효성 검사
const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/
  return phoneRegex.test(phone)
}

// 이메일 유효성 검사
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 폼 전체 유효성 검사
const validateForm = (): boolean => {
  errors.value = {}
  let isValid = true

  // 각 필드별 유효성 검사
  if (!form.value.company.trim()) {
    errors.value.company = '회사명을 입력해주세요.'
    isValid = false
  }

  if (!form.value.phone.trim()) {
    errors.value.phone = '연락처를 입력해주세요.'
    isValid = false
  } else if (!validatePhone(form.value.phone)) {
    errors.value.phone = '올바른 연락처 형식이 아닙니다.'
    isValid = false
  }

  if (form.value.email.trim() && !validateEmail(form.value.email)) {
    errors.value.email = '올바른 이메일 형식이 아닙니다.'
    isValid = false
  }

  if (!form.value.agreement) {
    errors.value.agreement = '개인정보 수집 및 이용에 동의해주세요.'
    isValid = false
  }

  return isValid
}

// 팝업 닫기 처리
const close = () => {
  emit('close')
  resetForm()
  errors.value = {}
}

// Google Ads 전환 추적 변수 설정
const goog_snippet_vars = function() {
  var w = window;
  w.google_conversion_id = 871622967;
  w.google_conversion_label = "jGJlCLnr6asaELfSz58D";
  w.google_conversion_value = 1.0;
  w.google_conversion_currency = "KRW";
  w.google_remarketing_only = false;
}

// Google Ads 전환 추적 옵션 인터페이스 정의
interface ConversionOptions {
  onload_callback?: () => void;
}

// Google Ads 전환 추적 실행
const goog_report_conversion = () => {
  const opt: ConversionOptions = {
    onload_callback: function() {
      console.log('Google Ads 전환 추적 완료')
    }
  }
  ;(window as any).google_trackConversion(opt)
}

// 폼 제출 처리
const handleSubmit = async () => {
  if (!validateForm()) return

  isLoadingState.value = true
  try {
    const response = await consultationService.submitConsultation({
      companyName: form.value.company,
      managerName: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      inquiryContent: form.value.message,
      inquiryType: form.value.inquiryType,
      revenue: form.value.revenue,
      employeeCount: form.value.employeeCount,
      industry: form.value.industry,
      additionalCertifications: form.value.additionalCertifications.join(',')
    })

    // 전환 추적 실행
    goog_report_conversion()

    // 성공 메시지 표시
    alert('상담 신청이 완료되었습니다.')
    close()
  } catch (error) {
    console.error('상담 신청 중 오류:', error)
    alert('상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.')
  } finally {
    isLoadingState.value = false
  }
}

// 폼 초기화
const resetForm = () => {
  form.value = {
    company: '',
    name: '',
    phone: '',
    email: '',
    message: '',
    agreement: false,
    inquiryType: props.defaultInquiryType || '',
    source: route.path,
    createdAt: new Date().toISOString(),
    revenue: '',
    employeeCount: '',
    industry: '',
    additionalCertifications: []
  }
}

// 개인정보 수집 동의서 내용
const privacyPolicyContent = ref(`
  [개인정보 수집 및 이용 동의서]
  1. 개인정보 수집 목적: 서비스 이용 및 원활한 고객 지원
  2. 수집 항목: 회사명, 담당자명, 연락처, 이메일
  3. 수집 목적: 상담 문의 접수 및 답변, 서비스 안내
  4. 보유 기간: 동의 철회 시까지 또는 관련 법령에 따름
  5. 동의를 거부할 권리가 있으며, 동의 거부 시 서비스 이용이 제한될 수 있습니다.
`)

// 전화번호 형식 변환 (공통 함수 사용)
const formatPhoneNumber = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.value.phone = formatPhoneNumberInput(input.value)
}

// 문의유형 변경 시 처리
const handleInquiryTypeChange = () => {
  if (form.value.inquiryType) {
    // 선택된 문의유형이 추가인증에 없으면 추가
    if (!form.value.additionalCertifications.includes(form.value.inquiryType)) {
      form.value.additionalCertifications.push(form.value.inquiryType)
    }
  }
}
</script>