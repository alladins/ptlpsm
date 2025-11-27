<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content xlarge" @click.stop>
      <div class="popup-header">
        <h2>발주번호 조회</h2>
        <button class="popup-close" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-body">
        <!-- 검색 영역 -->
        <div class="search-section">
          <div class="search-input-group">
            <label>수요기관</label>
            <input
              type="text"
              v-model="searchParams.client"
              class="form-input"
              placeholder="수요기관명을 입력하세요"
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
                <th>납품요구번호</th>
                <th>수요기관</th>
                <th>계약일자</th>
                <th>납품요구일자</th>
                <th>사업명</th>
                <th>선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.orderId">
                <td>{{ order.deliveryRequestNo }}</td>
                <td>{{ order.client }}</td>
                <td>{{ formatDate(order.contractDate) }}</td>
                <td>{{ formatDate(order.deliveryRequestDate) }}</td>
                <td>{{ order.projectName }}</td>
                <td>
                  <button class="btn-success" @click="selectOrder(order)">
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
import type { OrderDetailResponse } from '~/types/order'
import { orderService } from '~/services/order.service'

const props = defineProps<{
  show: boolean
  shippableOnly?: boolean  // 출하 가능한 발주만 조회
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', order: OrderDetailResponse): void
}>()

// 상태 관리
const searchParams = ref({
  client: '',
})
const currentPage = ref(1)
const totalPages = ref(1)
const orders = ref<OrderDetailResponse[]>([])

// 검색
const search = async () => {
  currentPage.value = 1
  await loadOrders()
}

// 페이지 변경
const changePage = async (page: number) => {
  currentPage.value = page
  await loadOrders()
}

// 발주 목록 로드
const loadOrders = async () => {
  try {
    const response = await orderService.getOrders({
      client: searchParams.value.client,
      page: currentPage.value,
      size: 10,
      sort: 'createdAt,desc',
      shippableOnly: props.shippableOnly
    })
    
    orders.value = response.content
    totalPages.value = response.totalPages
  } catch (error) {
    console.error('발주 목록 로드 오류:', error)
    orders.value = []
    totalPages.value = 1
  }
}

// 날짜 포맷팅
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

// 발주 선택
const selectOrder = async (order: OrderDetailResponse) => {
  try {
    // 상세 정보 조회
    const detailResponse = await orderService.getOrderDetail(order.orderId)
    console.log('선택된 발주 상세 정보:', detailResponse)
    
    // 부모 컴포넌트로 데이터 전달
    emit('select', detailResponse)
    
    // 팝업 닫기 (약간의 지연을 주어 데이터 전달이 완료된 후 닫히도록 함)
    setTimeout(() => {
      close()
    }, 100)
  } catch (error) {
    console.error('발주 상세 정보 조회 실패:', error)
    alert('발주 정보를 불러오는데 실패했습니다.')
  }
}

// 팝업 닫기
const close = () => {
  emit('close')
}

// 오버레이 클릭 처리
const handleOverlayClick = (event: MouseEvent) => {
  // 오버레이를 직접 클릭했을 때만 닫기
  if (event.target === event.currentTarget) {
    close()
  }
}

// 초기 데이터 로드
onMounted(() => {
  loadOrders()
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

/* 팝업 크기 조정 - xlarge(1200px) 사용 */
.popup-content {
  max-width: 1200px;
}

/* 검색 섹션 간격 조정 */
.search-section {
  margin-bottom: 0;
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

/* 페이지별 특화 스타일 없음 - 모두 공통 클래스 사용 */
</style>