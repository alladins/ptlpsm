<template>
  <div class="delivery-list">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="납품확인관리 목록"
      description="납품확인 정보를 관리합니다."
    >
      <template #actions>
        <button class="btn-action" @click="search">
          <i class="fas fa-search"></i>
          검색
        </button>
        <button class="btn-action btn-secondary" @click="reset">
          <i class="fas fa-undo"></i>
          초기화
        </button>
        <button class="btn-action btn-primary" @click="goToRegister">
          <i class="fas fa-plus"></i>
          등록
        </button>
      </template>
    </UiPageHeader>

    <div class="content-section">
      <!-- 검색 조건 섹션 - 완전히 한 줄 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- 납품일자 -->
          <div class="search-item">
            <label>납품일자:</label>
            <input type="date" v-model="searchForm.startDate" class="date-input">
            <span class="separator">~</span>
            <input type="date" v-model="searchForm.endDate" class="date-input">
          </div>

          <!-- 상태 -->
          <div class="search-item">
            <label>상태:</label>
            <select v-model="searchForm.status" class="condition-select">
              <option value="">전체</option>
              <option value="PENDING">대기</option>
              <option value="IN_TRANSIT">운송중</option>
              <option value="ARRIVED">도착</option>
              <option value="UNLOADING">하차중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 납품확인 목록 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
          </div>
          <div class="table-actions">
            <select v-model.number="pageSize" @change="handlePageSizeChange" class="page-size-select">
              <option :value="10">10개씩</option>
              <option :value="20">20개씩</option>
              <option :value="50">50개씩</option>
            </select>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 데이터가 없을 때 -->
        <div v-else-if="deliveryList.length === 0" class="no-data-message">
          <i class="fas fa-clipboard-check"></i>
          <p>등록된 납품확인 정보가 없습니다.</p>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>운송장ID</th>
                <th>출하ID</th>
                <th>납품요구번호</th>
                <th>배송지</th>
                <th>납품일자</th>
                <th>기사명</th>
                <th>서명</th>
                <th>사진</th>
                <th>상태</th>
                <th>완료일시</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in deliveryList" :key="item.deliveryId" class="table-row" @dblclick="viewDetail(item)">
                <td>{{ startIndex + index }}</td>
                <td>{{ item.transportId }}</td>
                <td>{{ item.shipmentId }}</td>
                <td>{{ item.deliveryRequestNo }}</td>
                <td>{{ item.siteAddress || '-' }}</td>
                <td>{{ formatDate(item.deliveryDate) }}</td>
                <td>{{ item.driverName || '-' }}</td>
                <td>
                  <i v-if="item.supervisorSignaturePath" class="fas fa-check-circle" style="color: #10b981;"></i>
                  <span v-else>-</span>
                </td>
                <td>
                  <span v-if="item.photoCount > 0">{{ item.photoCount }}장</span>
                  <span v-else>-</span>
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ getStatusText(item.status) }}
                  </span>
                </td>
                <td>{{ item.completedAt ? formatDateTime(item.completedAt) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <UiPagination
          v-if="totalPages > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { deliveryService } from '~/services/delivery.service'
import { formatDate, formatDateTime } from '~/utils/format'
import { useDataTable } from '~/composables/useDataTable'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품확인관리 목록'
})

const router = useRouter()

// 1개월 전 날짜 계산
const getOneMonthAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

// 검색 폼
const searchForm = ref({
  startDate: getOneMonthAgo(),
  endDate: new Date().toISOString().split('T')[0],
  status: ''
})

// useDataTable composable 사용
const {
  items: deliveryList,
  loading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  startIndex,
  endIndex,
  changePage,
  changePageSize,
  search,
  reset
} = useDataTable<any>({
  fetchFunction: async (params) => {
    const response = await deliveryService.getDeliveryList({
      startDate: searchForm.value.startDate,
      endDate: searchForm.value.endDate,
      status: searchForm.value.status,
      page: params.page || 0,
      size: params.size || 10,
      sort: params.sort || 'createdAt,desc'
    })
    return response
  },
  initialPageSize: 10,
  initialSort: 'createdAt,desc'
})

// 상태 텍스트 변환
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'PENDING': '대기',
    'IN_TRANSIT': '운송중',
    'ARRIVED': '도착',
    'UNLOADING': '하차중',
    'COMPLETED': '완료',
    'CANCELLED': '취소'
  }
  return statusMap[status] || status
}

// 상태 클래스
const getStatusClass = (status: string) => {
  const classMap: { [key: string]: string } = {
    'PENDING': 'status-waiting',
    'IN_TRANSIT': 'status-in-transit',
    'ARRIVED': 'status-arrived',
    'UNLOADING': 'status-unloading',
    'COMPLETED': 'status-completed',
    'CANCELLED': 'status-cancelled'
  }
  return classMap[status] || 'status-default'
}

// 검색
const handleSearch = () => {
  search()
}

// 초기화
const handleReset = () => {
  searchForm.value = {
    startDate: getOneMonthAgo(),
    endDate: new Date().toISOString().split('T')[0],
    status: ''
  }
  reset()
}

// 등록 페이지로 이동
const goToRegister = () => {
  router.push('/admin/delivery/register')
}

// 상세 보기
const viewDetail = (item: any) => {
  console.log('상세 보기:', item)
  // TODO: 상세 페이지 구현 후 이동
  alert('상세 보기 기능은 곧 구현됩니다.')
}

// 페이지 변경
const handlePageChange = (page: number) => {
  changePage(page)
}

// 페이지 크기 변경
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 초기 데이터 로드
onMounted(() => {
  search()
})
</script>

<style scoped>
/*
 * Delivery List Page Styles
 * 공통 스타일은 admin-common.css, admin-search.css, admin-tables.css에서 관리됩니다.
 */

/* 페이지 특화: 상태별 badge 색상 */
.status-waiting {
  background: #fef3c7;
  color: #92400e;
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

.status-default {
  background: #f3f4f6;
  color: #374151;
}

/* 반응형 - 페이지 특화 스타일만 유지 */
@media (max-width: 1024px) {
  .delivery-list {
    padding: 1rem;
  }

  .data-table {
    min-width: 1000px;
  }
}
</style>

