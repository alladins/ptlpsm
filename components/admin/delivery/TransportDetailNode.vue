<template>
  <div class="transport-detail-node" :style="{ paddingLeft: `${level * 32}px` }">
    <div class="transport-card">
      <!-- 운송 정보 헤더 - 1줄 인라인 레이아웃 -->
      <div class="transport-header">
        <i class="fas fa-truck transport-icon"></i>

        <span class="tracking-number">{{ transport.trackingNumber }}</span>

        <span class="status-badge" :class="getStatusClass(transport.status)">
          {{ getStatusText(transport.status) }}
        </span>

        <span class="separator">·</span>

        <span class="delivery-date">
          <i class="fas fa-calendar"></i>
          {{ formatDate(transport.deliveryDate) }}
        </span>

        <span class="separator">·</span>

        <span class="vehicle-info">
          차량: {{ transport.vehicleNo }}
        </span>

        <span class="separator">·</span>

        <span class="driver-info">
          기사: {{ transport.driverName }}
          <span v-if="transport.driverPhone">({{ transport.driverPhone }})</span>
        </span>

        <span class="separator">·</span>

        <span class="address-info">
          배송지: {{ transport.deliveryAddress }}
          <span v-if="transport.addressDetail">{{ transport.addressDetail }}</span>
        </span>

        <template v-if="transport.siteSupervisorName">
          <span class="separator">·</span>

          <span class="supervisor-info">
            소장: {{ transport.siteSupervisorName }}
            <span v-if="transport.siteSupervisorPhone">({{ transport.siteSupervisorPhone }})</span>
          </span>
        </template>
      </div>

      <!-- 납품확인 정보 -->
      <div class="transport-body">
        <!-- 납품확인 완료 -->
        <div v-if="transport.deliveryConfirmation" class="delivery-confirmation-compact">
          <div class="confirmation-header-compact">
            <i class="fas fa-check-circle"></i>
            <span>납품확인 완료</span>
            <span class="completed-time">
              ({{ formatDateTime(transport.deliveryConfirmation.completedAt) }})
            </span>
          </div>

          <div class="confirmation-items-inline">
            <!-- PDF 다운로드 -->
            <AdminDeliverySignatureViewer
              :pdf-file-url="transport.deliveryConfirmation.pdfFileUrl"
              :delivery-id="transport.deliveryConfirmation.deliveryId"
              :has-signature="transport.deliveryConfirmation.hasSignature"
              compact
            />

            <!-- 사진 -->
            <AdminDeliveryPhotoGallery
              :photo-urls="transport.deliveryConfirmation.photoUrls"
              :photo-count="transport.deliveryConfirmation.photoCount"
              compact
            />

            <!-- 위치 정보 -->
            <span
              v-if="transport.deliveryConfirmation.latitude && transport.deliveryConfirmation.longitude"
              class="location-badge"
            >
              📍 {{ transport.deliveryConfirmation.latitude.toFixed(4) }}°N,
              {{ transport.deliveryConfirmation.longitude.toFixed(4) }}°E
            </span>
          </div>
        </div>

        <!-- 납품확인 진행중 -->
        <div v-else class="delivery-confirmation-pending">
          <div class="pending-header">
            <i class="fas fa-clock"></i>
            <span>납품확인 진행중</span>
          </div>
          <div class="pending-message">
            <i class="fas fa-info-circle"></i>
            <span>납품 완료 후 PDF 및 사진을 확인할 수 있습니다</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransportDetailNode } from '~/types/delivery'
import { formatDate, formatDateTime } from '~/utils/format'

interface Props {
  transport: TransportDetailNode
  level: number
}

defineProps<Props>()

// 공통 상태 코드 사용 (DB에서 관리)
const { getStatusLabel } = useCommonStatus()

// 상태 텍스트 변환: DB에서 조회 (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
const getStatusText = (status: string): string => {
  return getStatusLabel(status)
}

// 상태 CSS 클래스: 컨벤션 기반 자동 변환
// PENDING → status-pending, IN_PROGRESS → status-in-progress
const getStatusClass = (status: string): string => {
  const kebabCase = status.toLowerCase().replace(/_/g, '-')
  return `status-${kebabCase}`
}
</script>

<style scoped>
.transport-detail-node {
  margin-top: 0.75rem;
}

.transport-card {
  background: #fef3c7;
  border: 1px solid #fde047;
  border-radius: 0.5rem;
  overflow: hidden;
}

.transport-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%);
  flex-wrap: wrap;
}

.transport-icon {
  font-size: 1.25rem;
  color: #92400e;
  flex-shrink: 0;
}

.tracking-number {
  font-size: 1rem;
  font-weight: 700;
  color: #78350f;
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.separator {
  color: #d1d5db;
  font-weight: 300;
  font-size: 1rem;
  flex-shrink: 0;
}

.delivery-date {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #78350f;
  font-weight: 500;
  flex-shrink: 0;
}

.delivery-date i {
  color: #92400e;
  font-size: 0.875rem;
}

.vehicle-info,
.driver-info {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  flex-shrink: 0;
}

.address-info {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supervisor-info {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  flex-shrink: 0;
}

/* 상태 배지 색상 */
.status-waiting {
  background: white;
  color: #92400e;
}

.status-in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-in-transit {
  background: #dbeafe;
  color: #1e40af;
}

.status-arrived {
  background: #e0e7ff;
  color: #3730a3;
}

.status-unloading {
  background: #fce7f3;
  color: #9f1239;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.transport-body {
  padding: 0.75rem 1rem;
  background: #fffbeb;
}

/* 납품확인 컴팩트 */
.delivery-confirmation-compact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 0.375rem;
  border: 1px solid #bbf7d0;
}

.confirmation-header-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #166534;
}

.confirmation-header-compact i {
  color: #16a34a;
  font-size: 1rem;
}

.completed-time {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 400;
}

.confirmation-items-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: #6b7280;
  font-family: monospace;
  white-space: nowrap;
}

/* 납품확인 진행중 */
.delivery-confirmation-pending {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fffbeb;
  border-radius: 0.375rem;
  border: 1px solid #fde047;
}

.pending-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.pending-header i {
  color: #d97706;
  font-size: 1rem;
}

.pending-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
}

.pending-message i {
  color: #3b82f6;
  font-size: 0.875rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

/* 반응형 */
@media (max-width: 1024px) {
  .transport-header {
    gap: 0.375rem;
  }

  .separator {
    display: none;
  }

  .address-info {
    flex-basis: 100%;
  }
}

@media (max-width: 768px) {
  .transport-header {
    padding: 0.625rem 0.75rem;
    gap: 0.375rem;
  }

  .vehicle-info,
  .driver-info {
    flex-basis: 100%;
  }

  .supervisor-info {
    flex-basis: 100%;
  }

  .transport-body {
    padding: 0.625rem 0.75rem;
  }

  .confirmation-items-inline {
    gap: 0.375rem;
  }
}
</style>
