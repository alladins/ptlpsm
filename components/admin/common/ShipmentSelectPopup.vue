<template>
  <div v-if="show" class="popup-overlay" @click="handleOverlayClick">
    <div class="popup-content large" @click.stop>
      <div class="popup-header">
        <h2>출하ID 조회</h2>
        <button class="popup-close" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-body">
        <!-- 검색 영역 -->
        <div class="search-section">
          <div class="search-input-group">
            <label>납품요구번호</label>
            <input
              type="text"
              v-model="searchParams.deliveryRequestNo"
              class="form-input"
              placeholder="납품요구번호를 입력하세요"
            >
            <button class="btn-primary" @click="search">
              <i class="fas fa-search"></i>
              검색
            </button>
            <button class="btn-secondary" @click="close">
              <i class="fas fa-times"></i>
              닫기
            </button>
          </div>
        </div>

        <!-- 목록 -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>출하ID</th>
                <th>납품요구번호</th>
                <th>수요기관</th>
                <th>출하일자</th>
                <th>상태</th>
                <th>선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="shipments.length === 0">
                <td colspan="6" class="empty-message">검색 결과가 없습니다.</td>
              </tr>
              <tr v-for="shipment in shipments" :key="shipment.shipmentId">
                <td>{{ shipment.shipmentId }}</td>
                <td>{{ shipment.deliveryRequestNo }}</td>
                <td>{{ shipment.client }}</td>
                <td>{{ formatDate(shipment.shipmentDate) }}</td>
                <td>
                  <span :class="getStatusClass(shipment.status)">
                    {{ getStatusText(shipment.status) }}
                  </span>
                </td>
                <td>
                  <button class="btn-success" @click="selectShipment(shipment)">
                    선택
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이징 -->
        <div class="pagination">
          <button
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            이전
          </button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ShipmentListItem } from '~/services/shipment.service'
import { shipmentService } from '~/services/shipment.service'
import { useCommonStatus } from '~/composables/useCommonStatus'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', shipment: ShipmentListItem): void
}>()

// 상태 관리 (DB 기반)
const { getStatusLabel } = useCommonStatus()

// 상태 관리
const searchParams = ref({
  deliveryRequestNo: '',
})
const currentPage = ref(1)
const totalPages = ref(1)
const shipments = ref<ShipmentListItem[]>([])

// 검색
const search = async () => {
  currentPage.value = 1
  await loadShipments()
}

// 페이지 변경
const changePage = async (page: number) => {
  currentPage.value = page
  await loadShipments()
}

// 출하 목록 로드 (PENDING 상태만 필터링)
const loadShipments = async () => {
  try {
    const response = await shipmentService.getShipments({
      deliveryRequestNo: searchParams.value.deliveryRequestNo,
      page: currentPage.value - 1,
      size: 10,
      sort: 'createdAt,desc'
    })

    // ✅ PENDING(대기) 상태만 필터링
    const filteredShipments = response.content.filter(shipment =>
      shipment.status === 'PENDING'
    )

    shipments.value = filteredShipments
    totalPages.value = response.totalPages

    console.log(`[출하 선택 팝업] 전체: ${response.content.length}개, 필터링 후: ${filteredShipments.length}개 (PENDING만 표시)`)
  } catch (error) {
    console.error('출하 목록 로드 오류:', error)
    shipments.value = []
    totalPages.value = 1
  }
}

// 날짜 포맷팅
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

// 상태 텍스트 (DB 기반)
const getStatusText = (status: string): string => {
  return getStatusLabel(status)
}

// 상태 클래스 (컨벤션 기반)
const getStatusClass = (status: string): string => {
  const kebabCase = status.toLowerCase().replace(/_/g, '-')
  return `status-${kebabCase}`
}

// 출하 선택
const selectShipment = (shipment: ShipmentListItem) => {
  emit('select', shipment)
  close()
}

// 팝업 닫기
const close = () => {
  emit('close')
}

// 오버레이 클릭 처리
const handleOverlayClick = () => {
  close()
}

// 초기 로드
onMounted(() => {
  if (props.show) {
    loadShipments()
  }
})
</script>

<style scoped>
/*
 * Common styles managed by admin-common.css:
 * - .popup-overlay: 팝업 배경
 * - .popup-content: 팝업 컨테이너
 * - .popup-header: 팝업 헤더
 * - .popup-close: 닫기 버튼
 * - .popup-body: 팝업 본문
 * - .search-section: 검색 영역
 * - .search-input-group: 검색 입력 그룹
 * - .search-row: 검색 행 (레이블 + 입력)
 * - .form-input: 입력 필드
 * - .btn-primary: 검색 버튼
 * - .table-container: 테이블 래퍼
 * - .data-table: 데이터 테이블
 * - .btn-success: 선택 버튼
 * - .pagination: 페이지네이션
 */

/* 팝업 크기 조정 - large(900px) 사용 */
.popup-content {
  max-width: 900px;
}

/* 검색 섹션 간격 조정 */
.search-section {
  margin-bottom: 1.5rem;
  border-bottom: none;
}

/* 검색 입력 그룹 - 가로 한 줄 정렬 */
.search-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input-group label {
  white-space: nowrap;
  font-weight: 500;
  color: var(--gray-700);
}

.search-input-group .form-input {
  flex: 1;
}

/* 빈 메시지 */
.empty-message {
  text-align: center;
  padding: 2rem;
  color: var(--gray-400);
}

/* 페이지별 특화: 출하 상태 배지 (컨벤션 기반 클래스) */
.status-pending {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--warning-50);
  color: #92400e;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-in-progress {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-completed {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--success-50);
  color: #065f46;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-cancelled {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--danger-50);
  color: #991b1b;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-pending-signature {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #ffedd5;
  color: #c2410c;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}
</style>
