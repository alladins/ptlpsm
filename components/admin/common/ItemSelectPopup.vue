<template>
  <div v-if="show" class="popup-overlay" @click="close">
    <div class="popup-content xlarge" @click.stop>
      <div class="popup-header">
        <h2>품목 선택</h2>
        <button class="popup-close" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-body">
        <!-- 검색 영역 -->
        <div class="search-section">
          <div class="search-input-group">
            <input
              type="text"
              v-model="searchKeyword"
              class="search-input"
              placeholder="품목코드, 품목명, SKU 정보, 품목유형으로 검색"
              @keyup.enter="search"
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
                <th>품목코드</th>
                <th>품목명</th>
                <th>품목유형</th>
                <th>SKU ID</th>
                <th>SKU 품명</th>
                <th>규격</th>
                <th>단위</th>
                <th>단가</th>
                <th>선택</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in items" :key="item.id">
                <tr v-for="sku in item.itemSkus" :key="`${item.id}-${sku.id}`">
                  <td>{{ item.itemCd }}</td>
                  <td>{{ item.itemNm }}</td>
                  <td>{{ item.itemTypeCd }}</td>
                  <td>{{ sku.id }}</td>
                  <td>{{ sku.skuNm }}</td>
                  <td>{{ formatSpecification(item, sku) }}</td>
                  <td>{{ item.unitCd }}</td>
                  <td class="text-right">{{ formatNumber(sku.unitPrice) }}</td>
                  <td>
                    <button class="btn-success" @click="selectSku(item, sku)">
                      선택
                    </button>
                  </td>
                </tr>
              </template>
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
import { itemService, type Item, type ItemSku } from '~/services/item.service'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', item: Item, sku: ItemSku): void
}>()

// 상태 관리
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const items = ref<Item[]>([])


// 검색
const search = async () => {
  currentPage.value = 1
  await loadItems()
}

// 페이지 변경
const changePage = async (page: number) => {
  currentPage.value = page
  await loadItems()
}

// 품목 목록 로드
const loadItems = async () => {
  try {
    const response = await itemService.searchItems({
      keyword: searchKeyword.value,
      page: currentPage.value,
      size: 10
    })
    
    items.value = response.content
    totalPages.value = response.totalPages
  } catch (error) {
    console.error('품목 목록 로드 오류:', error)
    items.value = []
    totalPages.value = 1
  }
}

// 규격 포맷팅
const formatSpecification = (item: Item, sku?: ItemSku): string => {
  const dimensions = []
  const width = sku?.width || item.width
  const height = sku?.height || item.height
  const thickness = sku?.thickness || item.thickness
  
  if (width) dimensions.push(width)
  if (height) dimensions.push(height)
  if (thickness) dimensions.push(thickness)
  return dimensions.length > 0 ? dimensions.join('*') : '-'
}

// 숫자 포맷팅
const formatNumber = (num: number | undefined): string => {
  return num?.toLocaleString() ?? '-'
}

// SKU 선택
const selectSku = (item: Item, sku: ItemSku) => {
  emit('select', item, sku)
  close()
}

// 팝업 닫기
const close = () => {
  emit('close')
}

// 초기 데이터 로드
onMounted(() => {
  loadItems()
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
 * - .search-input: 검색 입력 필드
 * - .btn-primary: 검색 버튼
 * - .table-container: 테이블 래퍼
 * - .data-table: 데이터 테이블
 * - .btn-success: 선택 버튼
 * - .pagination: 페이지네이션
 * - .text-right: 우측 정렬
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

/* 페이지별 특화 스타일 없음 - 모두 공통 클래스 사용 */
</style>
