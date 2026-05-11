<template>
  <div class="mobile-delivery">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner" />
      <p>납품 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태: 이미 완료 -->
    <div v-else-if="errorType === 'completed'" class="completed-screen">
      <i class="fas fa-check-circle" />
      <h2>해당 작업은 이미 완료되었습니다.</h2>
      <p>본인이 하신 것이 아니라면,<br>관리자에게 링크를 재요청해주세요.</p>
      <button class="btn-close-page" @click="closePage">
        <i class="fas fa-times" />
        닫기
      </button>
    </div>

    <!-- 에러 상태: 링크 만료 -->
    <div v-else-if="errorType === 'expired'" class="error-screen">
      <i class="fas fa-clock" style="color: #f59e0b;" />
      <h2>서명 링크가 만료되었습니다.</h2>
      <p>관리자에게 새 서명 링크를 요청해주세요.</p>
    </div>

    <!-- 에러 상태: 기타 오류 -->
    <div v-else-if="error" class="error-screen">
      <i class="fas fa-exclamation-triangle" />
      <h2>{{ error }}</h2>
      <p>관리자에게 문의해주세요.</p>
    </div>

    <!-- 완료 상태 -->
    <div v-else-if="isCompleted" class="completed-screen">
      <i class="fas fa-check-circle" />
      <h2>납품이 완료되었습니다</h2>
      <p>감사합니다!</p>
      <div class="completed-info">
        <p><strong>완료 시각:</strong> {{ completedAt }}</p>
      </div>
      <p v-if="autoCloseCountdown > 0" class="auto-close-notice">
        <i class="fas fa-clock" />
        {{ autoCloseCountdown }}초 후 자동으로 닫힙니다...
      </p>
      <button class="btn-close-page" @click="closePage">
        <i class="fas fa-times" />
        닫기
      </button>
    </div>

    <!-- 완료 상태: 서명 전용 (signature 모드) -->
    <div v-else-if="signatureOnlyCompleted" class="completed-screen">
      <i class="fas fa-check-circle" />
      <h2>서명이 저장되었습니다</h2>
      <p>감사합니다. 이후 처리는 관리자가 진행합니다.</p>
      <p v-if="autoCloseCountdown > 0" class="auto-close-notice">
        <i class="fas fa-clock" />
        {{ autoCloseCountdown }}초 후 자동으로 닫힙니다...
      </p>
      <button class="btn-close-page" @click="closePage">
        <i class="fas fa-times" />
        닫기
      </button>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="delivery-content">
      <!-- 헤더 -->
      <div class="mobile-header">
        <img src="/images/common/logo.png" alt="LEADPOWER" class="logo">
        <h1>납품 확인</h1>
        <button type="button" class="btn-help" aria-label="사용 안내 다시 보기" @click="guide.reopen()">
          <i class="fas fa-question-circle" />
        </button>
      </div>

      <!-- 운송 정보 -->
      <section class="info-section">
        <h2><i class="fas fa-truck" /> 운송 정보</h2>
        <div class="transport-grid">
          <!-- 1행: 운송장번호, 차량번호 -->
          <div class="grid-item">
            <span class="label">운송장번호</span>
            <span class="value">{{ deliveryData?.transport?.trackingNumber ?? '-' }}</span>
          </div>
          <div class="grid-item">
            <span class="label">차량번호</span>
            <span class="value">{{ deliveryData?.transport?.vehicleNo ?? '-' }}</span>
          </div>

          <!-- 2행: 배송지 (전체 너비) -->
          <div class="grid-item full-width">
            <span class="label">배송지</span>
            <span class="value">
              {{ deliveryData?.transport?.deliveryAddress ?? '-' }}
              <span v-if="deliveryData?.transport?.addressDetail">
                {{ deliveryData.transport.addressDetail }}
              </span>
            </span>
          </div>

          <!-- 3행: 배송예정일, 현장소장 -->
          <div class="grid-item">
            <span class="label">배송예정일</span>
            <span class="value">{{ deliveryData?.transport?.deliveryDate ?? '-' }}</span>
          </div>
          <div class="grid-item">
            <span class="label">현장소장</span>
            <span class="value">{{ deliveryData?.transport?.siteSupervisorName ?? '-' }}</span>
          </div>
        </div>
      </section>

      <!-- 품목 목록 -->
      <section class="info-section">
        <h2><i class="fas fa-box" /> 출하 품목 ({{ deliveryData?.items?.length ?? 0 }}개)</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>품목</th>
              <th>규격</th>
              <th>수량(m²)</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in deliveryData?.items"
              :key="index"
              :class="{ 'row-merge-source': (item?.quantity ?? 0) === 0 }"
            >
              <td>{{ item?.itemName ?? '-' }}</td>
              <td>{{ item?.specification ?? '-' }}</td>
              <td class="text-right">
                {{ formatQuantity(item?.quantity) }}
              </td>
              <td class="remark-cell">
                <span v-if="getMergeLabel(item?.remarks)" class="merge-badge" :style="{ backgroundColor: getMergeLabel(item?.remarks)?.color }">
                  {{ getMergeLabel(item?.remarks)?.label }}
                </span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 첨부된 납품 사진 조회 (full/signature 공통, 서버 temp 사진 있을 때만) -->
      <section v-if="receivedPhotos.length > 0" class="info-section">
        <h2><i class="fas fa-images" /> 첨부된 납품 사진 ({{ receivedPhotos.length }}장)</h2>
        <p class="readonly-hint">
          사진을 탭하면 크게 볼 수 있습니다.
        </p>
        <div class="readonly-photo-grid">
          <div
            v-for="p in receivedPhotos"
            :key="p.tempPhotoId"
            class="readonly-photo-item"
          >
            <img
              :src="deliveryService.getTempPhotoUrl(token, p.tempPhotoId)"
              :alt="p.fileName"
              @click="openPhotoViewer(p.tempPhotoId)"
            >
            <!-- 배달기사 모드에서만 삭제 허용 -->
            <button
              v-if="!isSignatureOnly"
              type="button"
              class="readonly-delete-btn"
              aria-label="사진 삭제"
              @click.stop="handleRemoveReceivedPhoto(p.tempPhotoId)"
            >
              <i class="fas fa-times" />
            </button>
          </div>
        </div>
      </section>

      <!-- signature 모드: 사진이 없을 때 안내 -->
      <section v-else-if="isSignatureOnly" class="info-section">
        <p class="no-photo-notice">
          <i class="fas fa-info-circle" />
          첨부된 사진이 없습니다. 관리자가 이후 업로드할 예정입니다.
        </p>
      </section>

      <!-- 추가 사진 업로드 섹션 (full 모드 전용) -->
      <section v-if="!isSignatureOnly" class="info-section">
        <h2><i class="fas fa-images" /> 추가 사진 업로드 (최대 5장)</h2>
        <UiMobilePhotoUploader
          ref="photoUploaderRef"
          :max-photos="5"
          :token="token"
        />
      </section>

      <!-- 서명 섹션 -->
      <section class="info-section">
        <h2><i class="fas fa-signature" /> 현장소장 서명</h2>
        <p v-if="isSignatureOnly" class="signature-only-notice">
          <i class="fas fa-info-circle" />
          납품 사진은 관리자가 처리했습니다. 서명만 진행해주세요.
        </p>
        <UiMobileSignatureCanvas
          ref="signatureRef"
          @save="handleSignatureSave"
        />
      </section>

      <!-- 제출 버튼 (일반 플로우) -->
      <div v-if="!isSignatureOnly" class="submit-section">
        <div class="expire-notice">
          <i class="fas fa-clock" />
          유효 기간: {{ formatExpireTime(deliveryData?.tokenExpiresAt) }}
        </div>
        <button
          class="btn-submit"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <i v-if="submitting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-check" />
          {{ submitting ? '제출 중...' : '납품 확인 완료' }}
        </button>
      </div>

      <!-- 안내 (signature 모드) -->
      <div v-else class="submit-section signature-only-submit">
        <p class="submit-hint">
          <i class="fas fa-info-circle" />
          서명 후 <strong>서명 저장</strong> 버튼을 누르시면 자동으로 완료됩니다.
        </p>
      </div>
    </div>

    <!-- 사진 풀스크린 뷰어 (signature 모드) -->
    <div v-if="viewingPhotoUrl" class="photo-viewer-overlay" @click.self="closePhotoViewer">
      <img :src="viewingPhotoUrl" class="photo-viewer-img" alt="사진 확대">
      <button type="button" class="btn-close-viewer" aria-label="닫기" @click="closePhotoViewer">
        <i class="fas fa-times" />
      </button>
    </div>

    <!-- 납품확인 사전 매뉴얼 가이드 팝업 -->
    <DeliveryGuideModal :open="guide.isOpen.value" @close="(remember) => guide.close(remember)" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from '#imports'
import { deliveryService } from '~/services/delivery.service'
import type { DeliveryInfo } from '~/services/delivery.service'
import { formatQuantity, formatDateTime } from '~/utils/format'
// 명시적 import (SSG 빌드 문제 해결)
import UiMobileSignatureCanvas from '~/components/ui/mobile/SignatureCanvas.vue'
import UiMobilePhotoUploader from '~/components/ui/mobile/PhotoUploader.vue'
import DeliveryGuideModal from '~/components/ui/mobile/DeliveryGuideModal.vue'
import { useDeliveryGuide } from '~/composables/useDeliveryGuide'

definePageMeta({
  layout: false, // 모바일 전용 레이아웃이므로 기본 레이아웃 사용 안 함
  pageTitle: '납품 확인'
})

const route = useRoute()
const token = route.params.token as string

// signature 모드: ?mode=signature 일 때 사진 섹션 숨기고 서명만 요구
const mode = computed(() => (route.query.mode === 'signature' ? 'signature' : 'full'))
const isSignatureOnly = computed(() => mode.value === 'signature')

// 상태 관리
const loading = ref(true)
const error = ref('')
const errorType = ref<'completed' | 'expired' | 'error' | ''>('')
const deliveryData = ref<DeliveryInfo | null>(null)
const isCompleted = ref(false)
const completedAt = ref('')
const submitting = ref(false)
const autoCloseCountdown = ref(0) // 자동 닫기 카운트다운
const signatureOnlyCompleted = ref(false) // signature 모드 서명 저장 완료 플래그

// signature 모드: 관리자가 업로드한 기존 납품 사진 조회 전용 목록
interface ReceivedPhoto {
  tempPhotoId: string
  fileName: string
}
const receivedPhotos = ref<ReceivedPhoto[]>([])
const viewingPhotoUrl = ref<string | null>(null)

const openPhotoViewer = (tempPhotoId: string) => {
  viewingPhotoUrl.value = deliveryService.getTempPhotoUrl(token, tempPhotoId)
}
const closePhotoViewer = () => {
  viewingPhotoUrl.value = null
}

// 조회 섹션의 사진 삭제 (배달기사 모드에서만 호출)
const handleRemoveReceivedPhoto = async (tempPhotoId: string) => {
  if (!confirm('이 사진을 삭제하시겠습니까?')) { return }
  try {
    await deliveryService.deleteTempPhoto(token, tempPhotoId)
    receivedPhotos.value = receivedPhotos.value.filter(p => p.tempPhotoId !== tempPhotoId)
  } catch (err) {
    alert(`삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  }
}

// 가이드 팝업 인스턴스
const guide = useDeliveryGuide()

// 컴포넌트 ref
const signatureRef = ref<any>(null)
const photoUploaderRef = ref<any>(null)

// 합지 배지 라벨 추출
const getMergeLabel = (remarks: string | null | undefined): { label: string; color: string } | null => {
  if (!remarks) { return null }

  // 합지 결과 품목 (타겟)
  if (remarks.includes('에서 병합됨') || remarks.includes('추가 병합')) {
    return { label: '합지 결과', color: '#3b82f6' }
  }

  // 합지 소스 품목
  if (remarks.includes('병합:') || remarks.includes('에서 이전')) {
    return { label: '합지 소스', color: '#8b5cf6' }
  }

  return null
}

// 만료 시간 포맷팅 (UTC → KST 변환)
const formatExpireTime = (dateString?: string) => {
  return formatDateTime(dateString)
}

// 초기 데이터 로드
onMounted(async () => {
  try {
    deliveryData.value = await deliveryService.getDeliveryByToken(token)
    console.log('납품 정보:', deliveryData.value)

    // 이미 완료된 경우
    if (deliveryData.value?.status === 'COMPLETED') {
      isCompleted.value = true
      // completedAt은 서버에서 받아야 함 (임시: KST 현재 시각)
      completedAt.value = formatDateTime(new Date().toISOString())
    }

    // 서버 temp 사진 목록을 조회 전용 상태로 로드 (full/signature 공통)
    try {
      const result = await deliveryService.getTempPhotos(token)
      receivedPhotos.value = (result.photos || []).map(p => ({
        tempPhotoId: p.tempPhotoId,
        fileName: p.fileName
      }))
    } catch (photoErr) {
      console.error('기존 사진 조회 실패:', photoErr)
    }

    // 서명 복원: 이미 서명이 저장되어 있으면 "저장 완료" 상태로 표시
    if (deliveryData.value?.hasSignature) {
      await nextTick()
      signatureRef.value?.markAsSaved()
    }

    // 정상 로딩 완료 후 가이드 팝업 표시 (미완료 상태일 때만)
    if (deliveryData.value && !isCompleted.value && !isSignatureOnly.value && guide.shouldShow()) {
      guide.open()
    }
  } catch (err) {
    console.error('납품 정보 로드 실패:', err)

    // HTTP 상태코드 기반 에러 타입 분기
    const statusCode = (err as any)?.statusCode
    if (statusCode === 403) {
      errorType.value = 'completed'
    } else if (statusCode === 410) {
      errorType.value = 'expired'
    } else {
      errorType.value = 'error'
    }
    error.value = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다'
  } finally {
    loading.value = false
  }
})

// 서명 저장 핸들러
const handleSignatureSave = async (blob: Blob) => {
  try {
    console.log('서명 저장:', blob)

    // 서명 저장 시 GPS 정보도 함께 수집
    let latitude: number | undefined
    let longitude: number | undefined

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
        console.log('서명 시 위치 정보:', latitude, longitude)
      } catch (gpsErr) {
        console.log('위치 정보 획득 실패 (선택사항이므로 계속 진행)')
      }
    }

    const result = await deliveryService.uploadSignature(token, blob, { latitude, longitude })

    // 서버 응답 성공 시 컴포넌트를 저장 완료 상태로 변경
    signatureRef.value?.markAsSaved()

    // 서버에서 받은 메시지 표시
    alert(result.message)

    // signature 모드: 서명 저장만으로 인수자 임무 종료 → 완료 화면 + 자동 닫기
    if (isSignatureOnly.value) {
      signatureOnlyCompleted.value = true
      autoCloseCountdown.value = 3
      const timer = setInterval(() => {
        autoCloseCountdown.value--
        if (autoCloseCountdown.value <= 0) {
          clearInterval(timer)
          closePage()
        }
      }, 1000)
    }
  } catch (err) {
    console.error('서명 저장 실패:', err)
    alert(`서명 저장에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  }
}

// 납품 확인 제출
const handleSubmit = async () => {
  // 사진 카운트 계산 (signature 모드 포함 공통)
  const newUploadCount = photoUploaderRef.value?.getUploadedCount() ?? 0
  const uploadedCount = receivedPhotos.value.length + newUploadCount

  // 유효성 검사 — signature 모드에서는 사진 검증 스킵
  if (!isSignatureOnly.value) {
    if (uploadedCount === 0) {
      alert('최소 1장의 사진을 업로드해주세요.')
      return
    }

    if (newUploadCount > 0 && !photoUploaderRef.value?.hasAllUploaded()) {
      alert('사진 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
  }

  if (!signatureRef.value?.hasSignature()) {
    alert('서명을 먼저 저장해주세요.')
    return
  }

  const confirmed = confirm(
    '납품을 확인하시겠습니까?\n\n' +
    '서명: 완료\n' +
    `사진: ${uploadedCount}장\n\n` +
    '제출 후에는 수정할 수 없습니다.'
  )

  if (!confirmed) { return }

  submitting.value = true

  try {
    // 사진은 이미 temp에 업로드 완료됨 (촬영 시 즉시 업로드)
    // GPS 정보는 서명 저장 시 이미 수집됨

    // 납품 완료 처리
    const result = await deliveryService.confirmDelivery(token, {})

    console.log('납품 완료:', result)

    // 완료 화면으로 전환
    isCompleted.value = true

    // 완료 시각 표시 (UTC → KST 변환)
    if (result.confirmedAt) {
      const formatted = formatDateTime(result.confirmedAt)
      if (formatted !== '-') {
        completedAt.value = formatted
      } else {
        console.warn('Invalid date format:', result.confirmedAt)
        completedAt.value = formatDateTime(new Date().toISOString())
      }
    } else {
      console.warn('confirmedAt이 서버 응답에 없습니다. 현재 시각을 사용합니다.')
      completedAt.value = formatDateTime(new Date().toISOString())
    }

    // 화면 맨 위로 스크롤
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
    console.error('납품 확인 실패:', err)
    alert(`납품 확인에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    submitting.value = false
  }
}

// 페이지 닫기
const closePage = () => {
  autoCloseCountdown.value = 0
  // 1차: window.close() 시도 — window.open()으로 열린 창에서만 성공
  try {
    window.close()
  } catch {
    // 닫기 실패 시 무시
  }
  // 2차 fallback: 모바일 SMS 딥링크에서 close가 무시된 경우
  // 페이지를 reload하여 서버측 완료 상태(status=COMPLETED 또는 403)로 전환
  // → 사용자가 "완료되었습니다" 화면에서 정적으로 머물도록 함
  setTimeout(() => {
    if (!document.hidden) {
      window.location.reload()
    }
  }, 100)
}
</script>

<style>
@import '@/assets/css/mobile-common.css';
@import '@/assets/css/mobile-delivery.css';
</style>

<style scoped>
/* signature 모드 안내 문구 */
/* signature 모드 사진 조회 전용 */
.readonly-hint {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
}
.readonly-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}
.readonly-photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f3f4f6;
  cursor: zoom-in;
}
.readonly-photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.readonly-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 2;
}
.readonly-delete-btn:hover {
  background: rgba(185, 28, 28, 0.95);
}
.no-photo-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin: 0;
}

/* 풀스크린 사진 뷰어 */
.photo-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.photo-viewer-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.btn-close-viewer {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-close-viewer:hover {
  background: rgba(255, 255, 255, 0.3);
}

.signature-only-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #1d4ed8;
  margin-bottom: 1rem;
}

.signature-only-notice i {
  flex-shrink: 0;
}

/* 헤더 레이아웃: 로고·제목·도움말 버튼 정렬 */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 도움말 버튼 */
.btn-help {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 20px;
  padding: 8px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-help:hover {
  color: #3b82f6;
}
</style>
