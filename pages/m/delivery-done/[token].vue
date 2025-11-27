<template>
  <div class="mobile-delivery-done" :data-view="currentView">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>서명 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-screen">
      <i class="fas fa-exclamation-triangle"></i>
      <h2>{{ error }}</h2>
      <p>관리자에게 문의해주세요.</p>
    </div>

    <!-- 완료 상태 -->
    <div v-else-if="isCompleted" class="completed-screen">
      <i class="fas fa-check-circle"></i>
      <h2>서명이 완료되었습니다</h2>
      <p>감사합니다!</p>
      <div class="completed-info">
        <p><strong>서명 완료 시각:</strong> {{ completedAt }}</p>
        <p><strong>서명 역할:</strong> {{ getRecipientTypeText(deliveryDoneInfo?.recipientType) }}</p>
      </div>
      <div class="next-step-info">
        <div v-if="needsOtherSignature" class="pending-notice">
          <i class="fas fa-clock"></i>
          <p>{{ otherSignatureMessage }}</p>
        </div>
        <div v-else class="all-done-notice">
          <i class="fas fa-thumbs-up"></i>
          <p>모든 서명이 완료되었습니다. PDF가 자동 생성됩니다.</p>
        </div>
      </div>
      <p v-if="autoCloseCountdown > 0" class="auto-close-notice">
        <i class="fas fa-clock"></i>
        {{ autoCloseCountdown }}초 후 자동으로 닫힙니다...
      </p>
      <button class="btn-close-page" @click="closePage">
        <i class="fas fa-times"></i>
        닫기
      </button>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="delivery-content">
      <!-- 헤더 -->
      <div class="mobile-header">
        <img src="/images/common/logo.png" alt="LEADPOWER" class="logo" />
        <h1>납품완료계 서명</h1>
      </div>

      <!-- 역할 표시 배지 -->
      <div class="role-badge" :class="getRecipientTypeBadgeClass(deliveryDoneInfo?.recipientType)">
        <i :class="getRecipientTypeIcon(deliveryDoneInfo?.recipientType)"></i>
        <span>{{ getRecipientTypeText(deliveryDoneInfo?.recipientType) }}</span>
      </div>

      <!-- 발주 정보 -->
      <section class="info-section">
        <h2><i class="fas fa-file-contract"></i> 발주 정보</h2>
        <div class="info-grid-simple">
          <div class="info-row">
            <span class="label">납품요구번호</span>
            <span class="value">{{ deliveryDoneInfo?.deliveryRequestNo ?? '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">계약번호</span>
            <span class="value">{{ deliveryDoneInfo?.contractNo ?? '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">수요기관</span>
            <span class="value">{{ deliveryDoneInfo?.client ?? '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">사업명</span>
            <span class="value">{{ deliveryDoneInfo?.projectName ?? '-' }}</span>
          </div>
          <div class="info-row full-width">
            <span class="label">납품장소</span>
            <span class="value address">{{ deliveryDoneInfo?.deliveryLocation ?? '-' }}</span>
          </div>
        </div>
      </section>

      <!-- 요약 정보 -->
      <section class="info-section">
        <h2><i class="fas fa-chart-bar"></i> 요약 정보</h2>
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-value">{{ deliveryDoneInfo?.items?.length ?? 0 }}개</div>
            <div class="card-label">품목 수</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ formatQuantity(calculatedOrderedQuantity) }}</div>
            <div class="card-label">발주 수량</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ formatQuantity(calculatedDeliveredQuantity) }}</div>
            <div class="card-label">납품 수량</div>
          </div>
        </div>
      </section>

      <!-- 품목 리스트 -->
      <section class="info-section">
        <h2><i class="fas fa-box"></i> 품목 리스트 ({{ deliveryDoneInfo?.items?.length ?? 0 }}개)</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th class="text-center">품목</th>
              <th class="text-center">규격</th>
              <th class="text-right">수량</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in deliveryDoneInfo?.items" :key="item.itemId">
              <td class="text-center">{{ item.itemName ?? '-' }}</td>
              <td class="text-center spec-cell">{{ extractSpecification(item.specification) }}</td>
              <td class="text-right">{{ formatQuantity(item.orderedQuantity) }} {{ item.unit ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 서명 섹션 -->
      <section class="info-section signature-section">
        <h2>
          <i :class="getRecipientTypeIcon(deliveryDoneInfo?.recipientType)"></i>
          {{ getRecipientTypeText(deliveryDoneInfo?.recipientType) }} 서명
        </h2>

        <!-- 서명 캔버스 (지우기/저장 버튼 포함) -->
        <UiMobileSignatureCanvas ref="signatureRef" @save="handleSignatureSave" />

        <!-- 안내 메시지 (간소화) -->
        <div class="signature-notice">
          <p v-if="deliveryDoneInfo?.recipientType === 'SITE_MANAGER'">
            <i class="fas fa-info-circle"></i>
            현장소장님, 서명판에 직접 서명 → '서명 저장' 버튼 클릭 → '서명 완료' 버튼 클릭으로 제출해주세요.
          </p>
          <p v-else-if="deliveryDoneInfo?.recipientType === 'SITE_INSPECTOR'">
            <i class="fas fa-info-circle"></i>
            현장감리원님, 서명판에 직접 서명 → '서명 저장' 버튼 클릭 → '서명 완료' 버튼 클릭으로 제출해주세요.
          </p>
          <p v-else>
            <i class="fas fa-info-circle"></i>
            담당자님, 서명판에 직접 서명 → '서명 저장' 버튼 클릭 → '서명 완료' 버튼 클릭으로 제출해주세요.
          </p>
        </div>
      </section>

      <!-- 제출 버튼 -->
      <div class="submit-section">
        <button class="btn-submit" @click="handleSubmit" :disabled="submitting || !hasSignature">
          <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check"></i>
          {{ submitting ? '제출 중...' : '서명 완료' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from '#imports'
import {
  getDeliveryDoneByToken,
  submitSignature
} from '~/services/delivery-done.service'
import type { DeliveryDoneMobileInfo, RecipientType } from '~/types/delivery-done'
import { formatQuantity } from '~/utils/format'
// 명시적 import (SSG 빌드 문제 해결)
import UiMobileSignatureCanvas from '~/components/ui/mobile/SignatureCanvas.vue'

definePageMeta({
  layout: false,
  pageTitle: '납품완료계 서명',
  middleware: []  // 공개 페이지 - 모든 미들웨어 비활성화
})

const route = useRoute()
const token = route.params.token as string

// 디버그 모드 (개발 환경에서만 로그 출력)
const DEBUG = process.env.NODE_ENV === 'development'
const debugLog = (...args: any[]) => {
  if (DEBUG) console.log('[DeliveryDone]', ...args)
}

// 상태 관리
const loading = ref(true)
const error = ref('')
const deliveryDoneInfo = ref<DeliveryDoneMobileInfo | null>(null)
const isCompleted = ref(false)
const completedAt = ref('')
const submitting = ref(false)
const hasSignature = ref(false)
const autoCloseCountdown = ref(0) // 자동 닫기 카운트다운

// 컴포넌트 ref (타입 안정성 개선)
const signatureRef = ref<InstanceType<typeof UiMobileSignatureCanvas> | null>(null)

// 계산된 값
const needsOtherSignature = computed(() => {
  if (!deliveryDoneInfo.value) return false
  if (deliveryDoneInfo.value.recipientType === 'SITE_MANAGER') {
    return !deliveryDoneInfo.value.hasSupervisorSignature
  } else {
    return !deliveryDoneInfo.value.hasContractorSignature
  }
})

const otherSignatureMessage = computed(() => {
  if (!deliveryDoneInfo.value) return ''
  if (deliveryDoneInfo.value.recipientType === 'SITE_MANAGER') {
    return '현장감리원 서명을 기다리고 있습니다.'
  } else {
    return '현장소장 서명을 기다리고 있습니다.'
  }
})

// 렌더링 상태 로그용 (디버깅)
const currentView = computed(() => {
  if (loading.value) {
    console.log('🔵 [DEBUG] 현재 뷰: 로딩 화면')
    return 'loading'
  } else if (error.value) {
    console.log('🔵 [DEBUG] 현재 뷰: 에러 화면 -', error.value)
    return 'error'
  } else if (isCompleted.value) {
    console.log('🔵 [DEBUG] 현재 뷰: 완료 화면')
    return 'completed'
  } else {
    console.log('🔵 [DEBUG] 현재 뷰: 메인 컨텐츠')
    console.log('🔵 [DEBUG] deliveryDoneInfo 존재:', !!deliveryDoneInfo.value)
    console.log('🔵 [DEBUG] items 배열 길이:', deliveryDoneInfo.value?.items?.length ?? 0)
    return 'main'
  }
})

// 규격 문자열에서 마지막 부분만 추출 (쉼표로 분리)
function extractSpecification(specification: string | null | undefined): string {
  if (!specification) return '-'
  const parts = specification.split(',')
  return parts[parts.length - 1].trim() || specification
}

// 요약 정보 계산 (items 배열로부터)
const calculatedOrderedQuantity = computed(() => {
  if (!deliveryDoneInfo.value?.items) return 0
  return deliveryDoneInfo.value.items.reduce((sum, item) => sum + (item.orderedQuantity ?? 0), 0)
})

const calculatedDeliveredQuantity = computed(() => {
  if (!deliveryDoneInfo.value?.items) return 0
  return deliveryDoneInfo.value.items.reduce((sum, item) => sum + (item.deliveredQuantity ?? 0), 0)
})

// RecipientType 텍스트 (신규 - recipientType 기반)
function getRecipientTypeText(recipientType?: RecipientType): string {
  if (!recipientType) return '-'
  if (recipientType === 'SITE_MANAGER') return '현장소장'
  if (recipientType === 'SITE_INSPECTOR') return '현장감리원'
  return '-'
}

// RecipientType 아이콘 (신규 - recipientType 기반)
function getRecipientTypeIcon(recipientType?: RecipientType): string {
  if (recipientType === 'SITE_MANAGER') return 'fas fa-user-tie'
  if (recipientType === 'SITE_INSPECTOR') return 'fas fa-user-check'
  return 'fas fa-user'
}

// RecipientType 배지 클래스 (신규 - recipientType 기반)
function getRecipientTypeBadgeClass(recipientType?: RecipientType): string {
  if (recipientType === 'SITE_MANAGER') return 'role-site-manager'
  if (recipientType === 'SITE_INSPECTOR') return 'role-site-inspector'
  return ''
}

// 초기 데이터 로드
onMounted(async () => {
  console.log('🔵 [DEBUG] onMounted 시작 - 토큰:', token)

  try {
    console.log('🔵 [DEBUG] API 호출 시작: getDeliveryDoneByToken()')
    deliveryDoneInfo.value = await getDeliveryDoneByToken(token)

    console.log('✅ [DEBUG] API 응답 받음 - 전체 데이터:', deliveryDoneInfo.value)

    // recipientType fallback: 서버 응답에 없으면 URL 쿼리 파라미터에서 가져오기
    if (!deliveryDoneInfo.value.recipientType) {
      console.warn('⚠️ [DEBUG] recipientType이 서버 응답에 없음 - URL 쿼리 파라미터에서 추출 시도')
      const queryType = route.query.type as RecipientType | undefined
      console.log('🔵 [DEBUG] URL 쿼리 파라미터 type:', queryType)

      if (queryType === 'SITE_MANAGER' || queryType === 'SITE_INSPECTOR') {
        deliveryDoneInfo.value.recipientType = queryType
        console.log('✅ [DEBUG] recipientType 설정 완료 (from query):', deliveryDoneInfo.value.recipientType)
      } else {
        console.error('❌ [DEBUG] 유효하지 않은 recipientType - 쿼리 파라미터:', queryType)
      }
    } else {
      console.log('✅ [DEBUG] recipientType이 서버 응답에 포함됨:', deliveryDoneInfo.value.recipientType)
    }

    // 요약 정보 필드 확인
    console.log('✅ [DEBUG] 요약 정보 필드:', {
      totalItemCount: deliveryDoneInfo.value?.totalItemCount,
      totalOrderQuantity: deliveryDoneInfo.value?.totalOrderQuantity,
      totalDeliveredQuantity: deliveryDoneInfo.value?.totalDeliveredQuantity
    })

    // 품목 리스트 확인
    if (deliveryDoneInfo.value?.items) {
      console.log('✅ [DEBUG] items 배열 존재 - 길이:', deliveryDoneInfo.value.items.length)
      console.log('✅ [DEBUG] items 배열 내용:', deliveryDoneInfo.value.items)
    } else {
      console.warn('⚠️ [DEBUG] items 배열이 없거나 undefined!')
    }

    // recipientType 확인 (상세 디버깅)
    console.log('✅ [DEBUG] recipientType 값:', deliveryDoneInfo.value?.recipientType)
    console.log('✅ [DEBUG] recipientType 타입:', typeof deliveryDoneInfo.value?.recipientType)
    console.log('✅ [DEBUG] recipientType === "SITE_MANAGER":', deliveryDoneInfo.value?.recipientType === 'SITE_MANAGER')
    console.log('✅ [DEBUG] recipientType === "SITE_INSPECTOR":', deliveryDoneInfo.value?.recipientType === 'SITE_INSPECTOR')

    // 현재 역할의 서명이 이미 완료된 경우
    if (
      (deliveryDoneInfo.value.recipientType === 'SITE_MANAGER' && deliveryDoneInfo.value.hasContractorSignature) ||
      (deliveryDoneInfo.value.recipientType === 'SITE_INSPECTOR' && deliveryDoneInfo.value.hasSupervisorSignature)
    ) {
      console.log('✅ [DEBUG] 이미 서명 완료된 상태 - isCompleted = true')
      isCompleted.value = true
      completedAt.value = new Date().toLocaleString('ko-KR')
    } else {
      console.log('✅ [DEBUG] 서명 대기 상태 - 메인 컨텐츠 표시')
    }
  } catch (err) {
    console.error('❌ [DEBUG] 납품완료계 정보 로드 실패:', err)
    console.error('❌ [DEBUG] 에러 상세:', {
      message: err instanceof Error ? err.message : '알 수 없는 오류',
      stack: err instanceof Error ? err.stack : undefined
    })
    error.value = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다'
  } finally {
    console.log('🔵 [DEBUG] loading 상태 종료 - loading = false')
    loading.value = false
  }
})

// 서명 저장 (별도 저장 - 운송장과 동일한 로직)
async function handleSignatureSave(blob: Blob) {
  try {
    console.log('🔵 [DEBUG] 서명 저장 (Blob):', blob)

    if (!deliveryDoneInfo.value) {
      console.warn('⚠️ [DEBUG] deliveryDoneInfo가 없음')
      return
    }

    // ✅ Blob을 직접 서버에 전송 (Base64 변환 제거)
    console.log('🔵 [DEBUG] 서버 저장 시작 - recipientType:', deliveryDoneInfo.value.recipientType)
    const result = await submitSignature(
      token,
      blob,  // ✅ Blob 직접 전송
      deliveryDoneInfo.value.recipientType  // ✅ recipientType 별도 파라미터
    )
    console.log('✅ [DEBUG] 서버 응답:', result)

    // 서명 컴포넌트를 저장됨 상태로 변경 (지우기 버튼 비활성화, 녹색 메시지 표시)
    signatureRef.value?.markAsSaved()

    // 서버 메시지 표시
    alert(result.message)
  } catch (err) {
    console.error('❌ [DEBUG] 서명 저장 실패:', err)
    alert(`서명 저장에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  }
}

// 서명 완료 (서명은 이미 handleSignatureSave에서 저장됨)
async function handleSubmit() {
  console.log('🔵 [DEBUG] handleSubmit 시작')

  if (!deliveryDoneInfo.value || !signatureRef.value) {
    console.warn('⚠️ [DEBUG] deliveryDoneInfo 또는 signatureRef가 없음')
    return
  }

  // 서명 저장 확인
  if (!signatureRef.value.hasSignature()) {
    console.warn('⚠️ [DEBUG] 서명이 저장되지 않음')
    alert('서명을 먼저 저장해주세요.')
    return
  }

  const confirmed = confirm(
    `서명을 제출하시겠습니까?\n\n역할: ${getRecipientTypeText(deliveryDoneInfo.value.recipientType)}\n\n제출 후에는 수정할 수 없습니다.`
  )

  if (!confirmed) {
    console.log('🔵 [DEBUG] 사용자가 서명 제출 취소')
    return
  }

  console.log('🔵 [DEBUG] 서명 완료 처리 중...')
  submitting.value = true

  try {
    // 서명은 이미 handleSignatureSave()에서 서버에 저장됨
    // 여기서는 완료 상태만 표시
    console.log('✅ [DEBUG] 서명 완료 - 이미 저장된 서명 사용')
    isCompleted.value = true
    completedAt.value = new Date().toLocaleString('ko-KR')

    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 3초 후 자동 닫기 (카운트다운 표시)
    autoCloseCountdown.value = 3
    const countdownInterval = setInterval(() => {
      autoCloseCountdown.value--
      if (autoCloseCountdown.value <= 0) {
        clearInterval(countdownInterval)
        closePage()
      }
    }, 1000)
  } catch (err) {
    console.error('❌ [DEBUG] 서명 완료 처리 중 오류:', err)
    alert('서명 완료 처리 중 오류가 발생했습니다.')
  } finally {
    console.log('🔵 [DEBUG] submitting 상태 종료')
    submitting.value = false
  }
}

// 페이지 닫기
function closePage() {
  window.close()
}
</script>

<style>
@import '@/assets/css/mobile-common.css';
@import '@/assets/css/mobile-delivery-done.css';
</style>
