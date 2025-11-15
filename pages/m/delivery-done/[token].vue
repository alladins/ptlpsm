<template>
  <div class="mobile-delivery-done">
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
        <p><strong>서명 역할:</strong> {{ getRoleText(deliveryDoneInfo?.role) }}</p>
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
      <div class="role-badge" :class="getRoleBadgeClass(deliveryDoneInfo?.role)">
        <i :class="getRoleIcon(deliveryDoneInfo?.role)"></i>
        <span>{{ getRoleText(deliveryDoneInfo?.role) }}</span>
      </div>

      <!-- 발주 정보 -->
      <section class="info-section">
        <h2><i class="fas fa-file-contract"></i> 발주 정보</h2>
        <div class="info-grid">
          <div class="grid-item full-width">
            <span class="label">납품요구번호</span>
            <span class="value">{{ deliveryDoneInfo?.deliveryRequestNo ?? '-' }}</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">계약번호</span>
            <span class="value">{{ deliveryDoneInfo?.contractNo ?? '-' }}</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">수요기관</span>
            <span class="value">{{ deliveryDoneInfo?.client ?? '-' }}</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">사업명</span>
            <span class="value">{{ deliveryDoneInfo?.projectName ?? '-' }}</span>
          </div>
          <div class="grid-item full-width">
            <span class="label">납품장소</span>
            <span class="value">{{ deliveryDoneInfo?.deliveryLocation ?? '-' }}</span>
          </div>
        </div>
      </section>

      <!-- 납품 요약 -->
      <section class="info-section">
        <h2><i class="fas fa-chart-bar"></i> 납품 요약</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">품목 수</div>
            <div class="summary-value">{{ deliveryDoneInfo?.itemCount ?? 0 }}개</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">발주 수량</div>
            <div class="summary-value">{{ deliveryDoneInfo?.totalOrderedQuantity?.toLocaleString() ?? 0 }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">납품 수량</div>
            <div class="summary-value">{{ deliveryDoneInfo?.totalDeliveredQuantity?.toLocaleString() ?? 0 }}</div>
          </div>
        </div>
        <div class="item-summary">
          <i class="fas fa-box"></i>
          <span>{{ deliveryDoneInfo?.itemSummary ?? '-' }}</span>
        </div>
      </section>

      <!-- 서명 현황 -->
      <section class="info-section">
        <h2><i class="fas fa-check-double"></i> 서명 현황</h2>
        <div class="signature-status-grid">
          <div
            class="signature-status-card"
            :class="{ completed: deliveryDoneInfo?.hasContractorSignature }"
          >
            <i class="fas fa-stamp"></i>
            <div class="status-info">
              <div class="status-label">시공사 대표</div>
              <div class="status-company">{{ deliveryDoneInfo?.contractorCompanyName ?? '-' }}</div>
              <div class="status-name">{{ deliveryDoneInfo?.contractorRepresentative ?? '-' }}</div>
            </div>
            <div class="status-badge">
              <i
                class="fas"
                :class="deliveryDoneInfo?.hasContractorSignature ? 'fa-check-circle' : 'fa-clock'"
              ></i>
              <span>{{ deliveryDoneInfo?.hasContractorSignature ? '완료' : '대기중' }}</span>
            </div>
          </div>

          <div
            class="signature-status-card"
            :class="{ completed: deliveryDoneInfo?.hasSupervisorSignature }"
          >
            <i class="fas fa-signature"></i>
            <div class="status-info">
              <div class="status-label">현장감리원</div>
              <div class="status-company">{{ deliveryDoneInfo?.supervisorCompany ?? '-' }}</div>
              <div class="status-name">{{ deliveryDoneInfo?.supervisorName ?? '-' }}</div>
            </div>
            <div class="status-badge">
              <i
                class="fas"
                :class="deliveryDoneInfo?.hasSupervisorSignature ? 'fa-check-circle' : 'fa-clock'"
              ></i>
              <span>{{ deliveryDoneInfo?.hasSupervisorSignature ? '완료' : '대기중' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 서명 섹션 -->
      <section class="info-section signature-section">
        <h2>
          <i :class="getRoleIcon(deliveryDoneInfo?.role)"></i>
          {{ getSignatureTitle(deliveryDoneInfo?.role) }}
        </h2>
        <div class="signature-description">
          <p v-if="deliveryDoneInfo?.role === 'CONTRACTOR'">
            현장 소장 서명을 서명판에 그려주세요. 최대한 명확하게 작성해 주시기 바랍니다.
          </p>
          <p v-else>
            현장감리원 서명을 서명판에 그려주세요. 최대한 명확하게 작성해 주시기 바랍니다.
          </p>
        </div>
        <UiMobileSignatureCanvas ref="signatureRef" />
      </section>

      <!-- 안내사항 -->
      <section class="info-section notice-section">
        <h3><i class="fas fa-info-circle"></i> 안내사항</h3>
        <ul>
          <li>서명 후 "서명 완료" 버튼을 눌러주세요.</li>
          <li v-if="deliveryDoneInfo?.role === 'CONTRACTOR'">
            현장 소장 서명은 정확하게 작성해 주시기 바랍니다.
          </li>
          <li>양쪽 서명이 모두 완료되면 납품확인서, 납품완료계, 사진대지 PDF가 자동 생성됩니다.</li>
          <li>문제가 있을 경우 관리자에게 문의해 주세요.</li>
        </ul>
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
  submitSignature,
  convertSignatureBlobToBase64,
  getRoleText as getServiceRoleText
} from '~/services/delivery-done.service'
import type { DeliveryDoneMobileInfo, SignatureRole } from '~/types/delivery-done'

definePageMeta({
  layout: false,
  pageTitle: '납품완료계 서명'
})

const route = useRoute()
const token = route.params.token as string

// 상태 관리
const loading = ref(true)
const error = ref('')
const deliveryDoneInfo = ref<DeliveryDoneMobileInfo | null>(null)
const isCompleted = ref(false)
const completedAt = ref('')
const submitting = ref(false)
const hasSignature = ref(false)

// 컴포넌트 ref
const signatureRef = ref<any>(null)

// 계산된 값
const needsOtherSignature = computed(() => {
  if (!deliveryDoneInfo.value) return false
  if (deliveryDoneInfo.value.role === 'CONTRACTOR') {
    return !deliveryDoneInfo.value.hasSupervisorSignature
  } else {
    return !deliveryDoneInfo.value.hasContractorSignature
  }
})

const otherSignatureMessage = computed(() => {
  if (!deliveryDoneInfo.value) return ''
  if (deliveryDoneInfo.value.role === 'CONTRACTOR') {
    return '현장감리원 서명을 기다리고 있습니다.'
  } else {
    return '현장 소장 서명을 기다리고 있습니다.'
  }
})

// 역할 텍스트
function getRoleText(role?: SignatureRole): string {
  if (!role) return '-'
  return getServiceRoleText(role)
}

// 역할 아이콘
function getRoleIcon(role?: SignatureRole): string {
  if (role === 'CONTRACTOR') return 'fas fa-stamp'
  if (role === 'SUPERVISOR') return 'fas fa-signature'
  return 'fas fa-user'
}

// 역할 배지 클래스
function getRoleBadgeClass(role?: SignatureRole): string {
  if (role === 'CONTRACTOR') return 'role-contractor'
  if (role === 'SUPERVISOR') return 'role-supervisor'
  return ''
}

// 서명 섹션 제목
function getSignatureTitle(role?: SignatureRole): string {
  if (role === 'CONTRACTOR') return '현장 소장 서명'
  if (role === 'SUPERVISOR') return '현장감리원 서명'
  return '서명'
}

// 초기 데이터 로드
onMounted(async () => {
  try {
    deliveryDoneInfo.value = await getDeliveryDoneByToken(token)
    console.log('납품완료계 정보:', deliveryDoneInfo.value)

    // 현재 역할의 서명이 이미 완료된 경우
    if (
      (deliveryDoneInfo.value.role === 'CONTRACTOR' && deliveryDoneInfo.value.hasContractorSignature) ||
      (deliveryDoneInfo.value.role === 'SUPERVISOR' && deliveryDoneInfo.value.hasSupervisorSignature)
    ) {
      isCompleted.value = true
      completedAt.value = new Date().toLocaleString('ko-KR')
    }

    // 서명 변경 감지
    if (signatureRef.value) {
      signatureRef.value.$on?.('change', () => {
        hasSignature.value = !signatureRef.value.isEmpty()
      })
    }
  } catch (err) {
    console.error('납품완료계 정보 로드 실패:', err)
    error.value = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다'
  } finally {
    loading.value = false
  }
})

// 서명 제출
async function handleSubmit() {
  if (!deliveryDoneInfo.value || !signatureRef.value) return

  // 서명 확인
  if (signatureRef.value.isEmpty()) {
    alert('서명을 먼저 작성해 주세요.')
    return
  }

  const confirmed = confirm(
    `서명을 제출하시겠습니까?\n\n역할: ${getRoleText(deliveryDoneInfo.value.role)}\n\n제출 후에는 수정할 수 없습니다.`
  )

  if (!confirmed) return

  submitting.value = true
  try {
    // 서명을 Blob으로 가져오기
    const signatureBlob = await signatureRef.value.getSignatureBlob()

    // Blob을 Base64로 변환
    const signatureBase64 = await convertSignatureBlobToBase64(signatureBlob)

    // 서버에 제출
    const result = await submitSignature(token, {
      role: deliveryDoneInfo.value.role,
      signatureImage: signatureBase64
    })

    if (result.success) {
      isCompleted.value = true
      completedAt.value = new Date().toLocaleString('ko-KR')
    } else {
      alert('서명 제출에 실패했습니다: ' + result.message)
    }
  } catch (err) {
    console.error('서명 제출 실패:', err)
    alert('서명 제출 중 오류가 발생했습니다.')
  } finally {
    submitting.value = false
  }
}

// 페이지 닫기
function closePage() {
  window.close()
}
</script>

<style scoped>
/* 전체 레이아웃 */
.mobile-delivery-done {
  min-height: 100vh;
  background: #f3f4f6;
  padding-bottom: 20px;
}

/* 로딩/에러/완료 화면 */
.loading-screen,
.error-screen,
.completed-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-screen i {
  font-size: 64px;
  color: #ef4444;
  margin-bottom: 20px;
}

.error-screen h2 {
  font-size: 20px;
  color: #1f2937;
  margin-bottom: 10px;
}

.error-screen p {
  color: #6b7280;
}

.completed-screen i {
  font-size: 80px;
  color: #10b981;
  margin-bottom: 20px;
}

.completed-screen h2 {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 10px;
}

.completed-screen p {
  font-size: 16px;
  color: #6b7280;
}

.completed-info {
  margin: 20px 0;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.completed-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
}

.next-step-info {
  margin: 20px 0;
  width: 100%;
  max-width: 400px;
}

.pending-notice,
.all-done-notice {
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pending-notice {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.pending-notice i {
  font-size: 24px;
  color: #d97706;
}

.pending-notice p {
  font-size: 14px;
  color: #92400e;
  margin: 0;
}

.all-done-notice {
  background: #d1fae5;
  border-left: 4px solid #10b981;
}

.all-done-notice i {
  font-size: 24px;
  color: #059669;
}

.all-done-notice p {
  font-size: 14px;
  color: #065f46;
  margin: 0;
}

.btn-close-page {
  margin-top: 20px;
  padding: 12px 30px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* 메인 컨텐츠 */
.delivery-content {
  max-width: 600px;
  margin: 0 auto;
}

.mobile-header {
  background: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mobile-header .logo {
  height: 40px;
  margin-bottom: 10px;
}

.mobile-header h1 {
  font-size: 20px;
  color: #1f2937;
  margin: 0;
}

/* 역할 배지 */
.role-badge {
  margin: 15px;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
}

.role-contractor {
  background: #dbeafe;
  color: #1e40af;
}

.role-supervisor {
  background: #fef3c7;
  color: #d97706;
}

.role-badge i {
  font-size: 20px;
}

/* 정보 섹션 */
.info-section {
  background: white;
  margin: 15px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-section h2 {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-item .label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.grid-item .value {
  font-size: 14px;
  color: #1f2937;
}

/* 요약 카드 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.summary-card {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #2563eb;
}

.item-summary {
  padding: 12px;
  background: #eff6ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #1e40af;
}

/* 서명 현황 */
.signature-status-grid {
  display: grid;
  gap: 12px;
}

.signature-status-card {
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f9fafb;
}

.signature-status-card.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.signature-status-card > i {
  font-size: 32px;
  color: #9ca3af;
}

.signature-status-card.completed > i {
  color: #10b981;
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.status-company {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.status-name {
  font-size: 13px;
  color: #6b7280;
}

.status-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-badge i {
  font-size: 24px;
  color: #d1d5db;
}

.signature-status-card.completed .status-badge i {
  color: #10b981;
}

.status-badge span {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
}

.signature-status-card.completed .status-badge span {
  color: #10b981;
}

/* 서명 섹션 */
.signature-description {
  margin-bottom: 15px;
  padding: 12px;
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  border-radius: 4px;
}

.signature-description p {
  margin: 0;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.5;
}

/* 안내사항 */
.notice-section h3 {
  font-size: 14px;
  color: #2563eb;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice-section ul {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.notice-section li {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 6px;
}

/* 제출 버튼 */
.submit-section {
  padding: 20px;
}

.btn-submit {
  width: 100%;
  padding: 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
}

.btn-submit:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-submit i {
  font-size: 20px;
}
</style>
