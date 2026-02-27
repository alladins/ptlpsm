<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content large" @click.stop>
      <div class="popup-header">
        <h2>출하NO 조회</h2>
        <button class="popup-close" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-body">
        <!-- 검색 영역 -->
        <div class="search-section">
          <div class="search-input-group">
            <label>출하NO</label>
            <input
              type="text"
              v-model="searchParams.shipmentNo"
              class="form-input"
              placeholder="출하NO를 입력하세요"
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
                <th>출하NO</th>
                <th>납품요구번호</th>
                <th>수요기관</th>
                <th>출하일자</th>
                <th>상태</th>
                <th>재고</th>
                <th>선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="shipments.length === 0">
                <td colspan="7" class="empty-message">검색 결과가 없습니다.</td>
              </tr>
              <tr v-for="shipment in shipments" :key="shipment.shipmentId">
                <td>{{ shipment.shipmentNo }}</td>
                <td>{{ shipment.deliveryRequestNo }}</td>
                <td>{{ shipment.client }}</td>
                <td>{{ formatDate(shipment.shipmentDate) }}</td>
                <td>
                  <span :class="getStatusClass(shipment.status)">
                    {{ getStatusText(shipment.status) }}
                  </span>
                </td>
                <td>
                  <span v-if="inventoryStatusMap[shipment.shipmentId] === null" class="inventory-checking">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  <span v-else-if="inventoryStatusMap[shipment.shipmentId] === true" class="inventory-sufficient">
                    <i class="fas fa-check-circle"></i> 충족
                  </span>
                  <span v-else class="inventory-insufficient">
                    <i class="fas fa-times-circle"></i> 부족
                  </span>
                </td>
                <td>
                  <button
                    class="btn-success"
                    @click="selectShipment(shipment)"
                    :disabled="inventoryStatusMap[shipment.shipmentId] === false"
                    :title="inventoryStatusMap[shipment.shipmentId] === false ? '재고 부족으로 운송 등록이 불가합니다' : ''"
                  >
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
import { ref, computed, onMounted } from 'vue'
import type { ShipmentListItem } from '~/services/shipment.service'
import { shipmentService } from '~/services/shipment.service'
import { dispatchRequestService } from '~/services/dispatch-request.service'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  show: boolean
}>()

// 로그인 사용자 정보
const authStore = useAuthStore()
const userCompanyId = computed(() => authStore.user?.companyId)
const userRole = computed(() => authStore.user?.role)

// 관리자 역할 (OEM 필터 적용 안함)
const isAdminRole = computed(() => {
  const adminRoles = ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER', 'SALES']
  return adminRoles.includes(userRole.value || '')
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', shipment: ShipmentListItem): void
}>()

// 상태 관리 (DB 기반)
const { getStatusLabel } = useCommonStatus()

// 상태 관리
const searchParams = ref({
  shipmentNo: '',
})
const currentPage = ref(1)
const totalPages = ref(1)
const shipments = ref<ShipmentListItem[]>([])

// 출하별 재고 상태 (shipmentId → canDispatch)
// null = 확인 중, true = 충족, false = 부족
const inventoryStatusMap = ref<Record<number, boolean | null>>({})

// 출하 목록의 재고 상태 일괄 확인
const checkInventoryForShipments = async (shipmentList: ShipmentListItem[]) => {
  // 초기화: 모든 항목을 '확인 중' 상태로
  for (const s of shipmentList) {
    inventoryStatusMap.value[s.shipmentId] = null
  }

  // 각 출하별 재고 확인 (병렬 처리)
  await Promise.allSettled(
    shipmentList.map(async (s) => {
      try {
        const result = await dispatchRequestService.checkInventoryStatus(s.shipmentId)
        inventoryStatusMap.value[s.shipmentId] = result.canDispatch
      } catch (error) {
        console.error(`재고 확인 실패 (shipmentId=${s.shipmentId}):`, error)
        // 확인 실패 시 선택 허용 (블로킹하지 않음)
        inventoryStatusMap.value[s.shipmentId] = true
      }
    })
  )
}

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

// 출하 목록 로드 (운송 등록 가능한 출하만 필터링)
const loadShipments = async () => {
  try {
    const response = await shipmentService.getShipments({
      shipmentNo: searchParams.value.shipmentNo,
      dispatchedOnly: true,
      page: currentPage.value - 1,
      size: 10,
      sort: 'createdAt,desc'
    })

    // OEM 회사 필터: OEM_MANAGER만 자신의 OEM 회사 출하만 표시
    // 상태 필터는 백엔드 SQL에서 처리 (dispatchedOnly + NOT EXISTS transports)
    const filteredShipments = response.content.filter(shipment => {
      if (!isAdminRole.value && userCompanyId.value) {
        if (shipment.oemCompanyId !== userCompanyId.value) {
          return false
        }
      }
      return true
    })

    shipments.value = filteredShipments
    totalPages.value = response.totalPages

    // 재고 현황 확인
    await checkInventoryForShipments(filteredShipments)

    console.log(`[출하 선택 팝업] 전체: ${response.content.length}개, 필터링 후: ${filteredShipments.length}개 (역할: ${userRole.value}, 관리자: ${isAdminRole.value})`)
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

/* 발주서 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-generated {
  background: #d1fae5;
  color: #065f46;
}

.status-not-generated {
  background: #fee2e2;
  color: #991b1b;
}

/* 비활성화된 선택 버튼 */
.btn-success:disabled {
  background: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 재고 상태 표시 */
.inventory-checking {
  color: #9ca3af;
  font-size: 0.8rem;
}
.inventory-sufficient {
  color: #16a34a;
  font-size: 0.8rem;
  font-weight: 500;
}
.inventory-insufficient {
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 500;
}
</style>
