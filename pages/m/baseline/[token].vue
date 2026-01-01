<template>
  <div class="mobile-baseline">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>기성청구 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-screen">
      <i class="fas fa-exclamation-triangle"></i>
      <h2>{{ error }}</h2>
      <p>관리자에게 문의해주세요.</p>
    </div>

    <!-- 이미 서명 완료 -->
    <div v-else-if="baselineData?.alreadySigned" class="completed-screen">
      <i class="fas fa-check-circle"></i>
      <h2>이미 서명을 완료하셨습니다</h2>
      <p>감사합니다!</p>
      <div class="completed-info">
        <p><strong>{{ getRecipientTypeLabel(baselineData?.recipientType) }}:</strong> {{ baselineData?.recipientName }}님</p>
      </div>
      <button class="btn-close-page" @click="closePage">
        <i class="fas fa-times"></i>
        닫기
      </button>
    </div>

    <!-- 서명 완료 후 화면 -->
    <div v-else-if="isCompleted" class="completed-screen">
      <i class="fas fa-check-circle"></i>
      <h2>서명이 완료되었습니다</h2>
      <p>감사합니다!</p>
      <div class="completed-info">
        <p><strong>완료 시각:</strong> {{ completedAt }}</p>
        <p v-if="allSignaturesCompleted" class="all-completed-notice">
          <i class="fas fa-file-pdf"></i>
          모든 서명이 완료되어 PDF가 생성됩니다.
        </p>
        <p v-else class="partial-notice">
          <i class="fas fa-info-circle"></i>
          다른 담당자의 서명을 기다리고 있습니다.
        </p>
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
    <div v-else class="baseline-content">
      <!-- 헤더 -->
      <div class="mobile-header">
        <img src="/images/common/logo.png" alt="LEADPOWER" class="logo">
        <h1>기성청구 서명</h1>
      </div>

      <!-- 기성청구 정보 -->
      <section class="info-section">
        <h2><i class="fas fa-file-invoice-dollar"></i> 기성청구 정보</h2>
        <div class="info-grid">
          <div class="grid-item full-width">
            <span class="label">납품요구번호</span>
            <span class="value">{{ baselineData?.deliveryRequestNo ?? '-' }}</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">수요기관</span>
            <span class="value">{{ baselineData?.demandOrganization ?? '-' }}</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">사업명</span>
            <span class="value">{{ baselineData?.projectName ?? '-' }}</span>
          </div>
          <div class="grid-item">
            <span class="label">시공사</span>
            <span class="value">{{ baselineData?.constructorName ?? '-' }}</span>
          </div>
          <div class="grid-item">
            <span class="label">기성 차수</span>
            <span class="value highlight">{{ baselineData?.baselineSeq ?? '-' }}차</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">청구금액</span>
            <span class="value amount">{{ formatCurrency(baselineData?.requestAmount) }}원</span>
          </div>
        </div>
      </section>

      <!-- 서명자 정보 -->
      <section class="info-section signer-info">
        <h2><i class="fas fa-user"></i> 서명자 정보</h2>
        <div class="signer-card">
          <div class="signer-role">
            <i :class="getRecipientTypeIcon(baselineData?.recipientType)"></i>
            {{ getRecipientTypeLabel(baselineData?.recipientType) }}
          </div>
          <div class="signer-name">{{ baselineData?.recipientName }}님</div>
          <div v-if="baselineData?.otherSignerCompleted" class="other-signer-status">
            <i class="fas fa-check-circle"></i>
            다른 담당자 서명 완료
          </div>
          <div v-else class="other-signer-status waiting">
            <i class="fas fa-clock"></i>
            다른 담당자 서명 대기중
          </div>
        </div>
      </section>

      <!-- 품목 요약 (있는 경우) -->
      <section v-if="baselineData?.itemSummary" class="info-section">
        <h2><i class="fas fa-box"></i> 청구 품목</h2>
        <div class="item-summary">
          {{ baselineData.itemSummary }}
        </div>
      </section>

      <!-- 서명 섹션 -->
      <section class="info-section">
        <h2><i class="fas fa-signature"></i> 서명</h2>
        <UiMobileSignatureCanvas
          ref="signatureRef"
          @save="handleSignatureSave"
        />
      </section>

      <!-- 제출 버튼 -->
      <div class="submit-section">
        <div class="expire-notice">
          <i class="fas fa-clock"></i>
          유효 기간: {{ formatExpireTime(baselineData?.expiresAt) }}
        </div>
        <button
          class="btn-submit"
          @click="handleSubmit"
          :disabled="submitting"
        >
          <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check"></i>
          {{ submitting ? '제출 중...' : '서명 완료' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from '#imports'
import { baselineMobileService } from '~/services/baseline.service'
import type { BaselineSignatureInfo, SignatureRecipientType } from '~/types/baseline'
import { formatCurrency } from '~/utils/format'
// 명시적 import (SSG 빌드 문제 해결)
import UiMobileSignatureCanvas from '~/components/ui/mobile/SignatureCanvas.vue'

definePageMeta({
  layout: false, // 모바일 전용 레이아웃이므로 기본 레이아웃 사용 안 함
  pageTitle: '기성청구 서명'
})

const route = useRoute()
const token = route.params.token as string
// URL query parameter에서 recipientType 가져오기 (예: /m/baseline/{token}?type=SITE_MANAGER)
const recipientTypeFromQuery = (route.query.type as SignatureRecipientType) || undefined

// 상태 관리
const loading = ref(true)
const error = ref('')
const baselineData = ref<BaselineSignatureInfo | null>(null)
const isCompleted = ref(false)
const completedAt = ref('')
const submitting = ref(false)
const autoCloseCountdown = ref(0)
const allSignaturesCompleted = ref(false)

// 컴포넌트 ref
const signatureRef = ref<any>(null)

// 수신자 타입 라벨
const getRecipientTypeLabel = (type?: SignatureRecipientType) => {
  if (!type) return '-'
  const labels: Record<SignatureRecipientType, string> = {
    SITE_MANAGER: '현장소장',
    SITE_INSPECTOR: '현장감리원'
  }
  return labels[type] || type
}

// 수신자 타입 아이콘
const getRecipientTypeIcon = (type?: SignatureRecipientType) => {
  if (!type) return 'fas fa-user'
  const icons: Record<SignatureRecipientType, string> = {
    SITE_MANAGER: 'fas fa-user-tie',
    SITE_INSPECTOR: 'fas fa-user-check'
  }
  return icons[type] || 'fas fa-user'
}

// 만료 시간 포맷팅
const formatExpireTime = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 초기 데이터 로드
onMounted(async () => {
  try {
    // URL query의 recipientType을 함께 전달
    baselineData.value = await baselineMobileService.getByToken(token, recipientTypeFromQuery)
    console.log('기성청구 정보:', baselineData.value)

    // 이미 서명 완료된 경우는 alreadySigned 필드로 체크
  } catch (err) {
    console.error('기성청구 정보 로드 실패:', err)
    error.value = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다'
  } finally {
    loading.value = false
  }
})

// 서명 저장 핸들러 (서명 캔버스에서 저장 버튼 클릭 시)
const handleSignatureSave = async (blob: Blob) => {
  try {
    console.log('서명 저장:', blob)
    // recipientType을 함께 전달 (baselineData에서 가져오거나 URL query에서 가져옴)
    const recipientType = baselineData.value?.recipientType || recipientTypeFromQuery || 'SITE_MANAGER'
    const result = await baselineMobileService.uploadSignature(token, blob, recipientType)

    // 서버 응답 성공 시 컴포넌트를 저장 완료 상태로 변경
    signatureRef.value?.markAsSaved()

    // 결과 처리
    allSignaturesCompleted.value = result.allSignaturesCompleted || false

    // 완료 화면으로 전환
    isCompleted.value = true

    // 완료 시각 설정
    if (result.signedAt) {
      const date = new Date(result.signedAt)
      if (!isNaN(date.getTime())) {
        completedAt.value = date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } else {
        completedAt.value = new Date().toLocaleString('ko-KR')
      }
    } else {
      completedAt.value = new Date().toLocaleString('ko-KR')
    }

    // 화면 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 5초 후 자동 닫기 (카운트다운 표시)
    autoCloseCountdown.value = 5
    const countdownInterval = setInterval(() => {
      autoCloseCountdown.value--
      if (autoCloseCountdown.value <= 0) {
        clearInterval(countdownInterval)
        closePage()
      }
    }, 1000)
  } catch (err) {
    console.error('서명 저장 실패:', err)
    alert(`서명 저장에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  }
}

// 서명 완료 제출
const handleSubmit = async () => {
  // 유효성 검사
  if (!signatureRef.value?.hasSignature()) {
    alert('서명을 먼저 저장해주세요.')
    return
  }

  const confirmed = confirm(
    `서명을 제출하시겠습니까?\n\n` +
    `${getRecipientTypeLabel(baselineData.value?.recipientType)}: ${baselineData.value?.recipientName}님\n` +
    `기성 차수: ${baselineData.value?.baselineSeq}차\n` +
    `청구금액: ${formatCurrency(baselineData.value?.requestAmount)}원\n\n` +
    `제출 후에는 수정할 수 없습니다.`
  )

  if (!confirmed) return

  submitting.value = true

  try {
    // 서명 이미지 가져오기
    const signatureBlob = signatureRef.value?.getSignatureBlob()
    if (!signatureBlob) {
      alert('서명 데이터를 가져올 수 없습니다. 다시 시도해주세요.')
      return
    }

    // 서명 업로드 (recipientType 함께 전달)
    const recipientType = baselineData.value?.recipientType || recipientTypeFromQuery || 'SITE_MANAGER'
    const result = await baselineMobileService.uploadSignature(token, signatureBlob, recipientType)

    // 결과 처리
    allSignaturesCompleted.value = result.allSignaturesCompleted || false

    // 완료 화면으로 전환
    isCompleted.value = true

    // 완료 시각 설정
    if (result.signedAt) {
      const date = new Date(result.signedAt)
      if (!isNaN(date.getTime())) {
        completedAt.value = date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } else {
        completedAt.value = new Date().toLocaleString('ko-KR')
      }
    } else {
      completedAt.value = new Date().toLocaleString('ko-KR')
    }

    // 화면 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 5초 후 자동 닫기 (카운트다운 표시)
    autoCloseCountdown.value = 5
    const countdownInterval = setInterval(() => {
      autoCloseCountdown.value--
      if (autoCloseCountdown.value <= 0) {
        clearInterval(countdownInterval)
        closePage()
      }
    }, 1000)
  } catch (err) {
    console.error('서명 제출 실패:', err)
    alert(`서명 제출에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    submitting.value = false
  }
}

// 페이지 닫기
const closePage = () => {
  // 모바일 브라우저에서 창 닫기 시도
  if (window.opener) {
    window.close()
  } else {
    // 창을 닫을 수 없는 경우 홈으로 이동
    window.location.href = '/'
  }
}
</script>

<style>
@import '@/assets/css/mobile-common.css';
@import '@/assets/css/mobile-delivery.css';

/* 기성청구 전용 스타일 */
.mobile-baseline {
  min-height: 100vh;
  background: #f5f7fa;
}

.baseline-content {
  padding: 0 0 100px 0;
}

/* 금액 강조 */
.value.amount {
  font-size: 1.25rem !important;
  font-weight: 700 !important;
  color: #1d4ed8 !important;
}

.value.highlight {
  font-weight: 700 !important;
  color: #059669 !important;
}

/* 서명자 정보 카드 */
.signer-info {
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
}

.signer-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.signer-role {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.signer-role i {
  font-size: 1rem;
}

.signer-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.other-signer-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 16px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.other-signer-status.waiting {
  background: #fef3c7;
  color: #d97706;
}

.other-signer-status i {
  font-size: 0.875rem;
}

/* 품목 요약 */
.item-summary {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.5;
}

/* 완료 화면 추가 스타일 */
.all-completed-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 0.9375rem;
}

.partial-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  font-size: 0.9375rem;
}

/* 그리드 아이템 */
.info-grid .grid-item.full-width {
  grid-column: 1 / -1;
}
</style>
