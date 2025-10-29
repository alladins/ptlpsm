<template>
  <div class="mobile-delivery">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>납품 정보를 불러오는 중...</p>
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
      <h2>납품이 완료되었습니다</h2>
      <p>감사합니다!</p>
      <div class="completed-info">
        <p><strong>완료 시각:</strong> {{ completedAt }}</p>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div v-else class="delivery-content">
      <!-- 헤더 -->
      <div class="mobile-header">
        <img src="/images/common/logo.png" alt="LEADPOWER" class="logo">
        <h1>납품 확인</h1>
      </div>

      <!-- 운송 정보 -->
      <section class="info-section">
        <h2><i class="fas fa-truck"></i> 운송 정보</h2>
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
        <h2><i class="fas fa-box"></i> 출하 품목 ({{ deliveryData?.items?.length ?? 0 }}개)</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>품목</th>
              <th>규격</th>
              <th>수량</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in deliveryData?.items" :key="index">
              <td>{{ item?.itemName ?? '-' }}</td>
              <td>{{ item?.specification ?? '-' }}</td>
              <td>{{ item?.quantity?.toLocaleString() ?? 0 }} {{ item?.unit ?? '' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 서명 섹션 -->
      <section class="info-section">
        <h2><i class="fas fa-signature"></i> 현장소장 서명</h2>
        <UiMobileSignatureCanvas
          ref="signatureRef"
          @save="handleSignatureSave"
        />
      </section>

      <!-- 사진 업로드 섹션 -->
      <section class="info-section">
        <h2><i class="fas fa-camera"></i> 사진 촬영 (최대 5장)</h2>
        <UiMobilePhotoUploader
          ref="photoUploaderRef"
          :max-photos="5"
        />
      </section>

      <!-- 제출 버튼 -->
      <div class="submit-section">
        <div class="expire-notice">
          <i class="fas fa-clock"></i>
          유효 기간: {{ formatExpireTime(deliveryData?.tokenExpiresAt) }}
        </div>
        <button
          class="btn-submit"
          @click="handleSubmit"
          :disabled="submitting"
        >
          <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check"></i>
          {{ submitting ? '제출 중...' : '납품 확인 완료' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from '#imports'
import { deliveryService } from '~/services/delivery.service'
import type { DeliveryInfo } from '~/services/delivery.service'

definePageMeta({
  layout: false, // 모바일 전용 레이아웃이므로 기본 레이아웃 사용 안 함
  pageTitle: '납품 확인'
})

const route = useRoute()
const token = route.params.token as string

// 상태 관리
const loading = ref(true)
const error = ref('')
const deliveryData = ref<DeliveryInfo | null>(null)
const isCompleted = ref(false)
const completedAt = ref('')
const submitting = ref(false)

// 컴포넌트 ref
const signatureRef = ref<any>(null)
const photoUploaderRef = ref<any>(null)

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
    deliveryData.value = await deliveryService.getDeliveryByToken(token)
    console.log('납품 정보:', deliveryData.value)

    // 이미 완료된 경우
    if (deliveryData.value?.status === 'COMPLETED') {
      isCompleted.value = true
      // completedAt은 서버에서 받아야 함 (임시)
      completedAt.value = new Date().toLocaleString('ko-KR')
    }
  } catch (err) {
    console.error('납품 정보 로드 실패:', err)
    error.value = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다'
  } finally {
    loading.value = false
  }
})

// 서명 저장 핸들러
const handleSignatureSave = async (blob: Blob) => {
  try {
    console.log('서명 저장:', blob)
    const result = await deliveryService.uploadSignature(token, blob)

    // 서버 응답 성공 시 컴포넌트를 저장 완료 상태로 변경
    signatureRef.value?.markAsSaved()

    // 서버에서 받은 메시지 표시
    alert(result.message)
  } catch (err) {
    console.error('서명 저장 실패:', err)
    alert(`서명 저장에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  }
}

// 납품 확인 제출
const handleSubmit = async () => {
  // 유효성 검사
  if (!signatureRef.value?.hasSignature()) {
    alert('서명을 먼저 저장해주세요.')
    return
  }

  const photos = photoUploaderRef.value?.getPhotos()
  if (!photos || photos.length === 0) {
    alert('최소 1장의 사진을 촬영해주세요.')
    return
  }

  const confirmed = confirm(
    `납품을 확인하시겠습니까?\n\n` +
    `서명: 완료\n` +
    `사진: ${photos.length}장\n\n` +
    `제출 후에는 수정할 수 없습니다.`
  )

  if (!confirmed) return

  submitting.value = true

  try {
    // 사진 업로드
    console.log('사진 업로드:', photos)
    await deliveryService.uploadPhotos(token, photos)

    // 위치 정보 획득 (선택)
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
        console.log('위치 정보:', latitude, longitude)
      } catch (err) {
        console.log('위치 정보 획득 실패 (선택사항이므로 계속 진행)')
      }
    }

    // 납품 완료 처리
    const result = await deliveryService.confirmDelivery(token, {
      latitude,
      longitude
    })

    console.log('납품 완료:', result)

    // 완료 화면으로 전환
    isCompleted.value = true
    completedAt.value = new Date(result.confirmedAt).toLocaleString('ko-KR')

    // 화면 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    console.error('납품 확인 실패:', err)
    alert(`납품 확인에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    submitting.value = false
  }
}
</script>

<!-- 스타일은 assets/css/mobile-delivery.css에 정의되어 있습니다 -->
