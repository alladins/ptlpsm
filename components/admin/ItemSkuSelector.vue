<template>
  <div class="item-sku-selector">
    <!-- 팝업 오버레이 -->
    <div v-if="isOpen" class="popup-overlay">
      <div class="popup-content" @click.stop>
        <div class="popup-header">
          <h3>품목 SKU 선택</h3>
          <button type="button" @click="closePopup" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 검색 영역 -->
        <div class="search-section">
          <div class="search-input-group">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="품목코드, 품목명, SKU코드로 검색하세요"
              class="search-input"
              @input="handleSearch"
              @keyup.enter="handleSearch"
            >
            <button type="button" @click="handleSearch" class="btn-primary">
              <i class="fas fa-search"></i>
              조회
            </button>
            <button type="button" @click="closePopup" class="btn-secondary">
              <i class="fas fa-times"></i>
              닫기
            </button>
          </div>
        </div>

        <!-- 품목 목록 -->
        <div class="items-section">
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>품목을 불러오는 중...</span>
          </div>
          
          <div v-else-if="items.length === 0" class="no-items">
            <i class="fas fa-box"></i>
            <span>검색된 품목이 없습니다.</span>
          </div>
          
          <div v-else class="items-list">
            <div 
              v-for="item in items" 
              :key="item.id" 
              class="item-card"
              @click="selectItem(item)"
            >
              <div class="item-header">
                <div class="item-title">
                  <span class="item-label">품목:</span>
                  <span class="item-full-name">{{ item.itemNm }}</span>
                </div>
              </div>
              
              <div class="sku-list">
                <!-- 헤더 행 추가 -->
                <div class="sku-header">
                  <span class="sku-header-cell">SKU 명</span>
                  <span class="sku-header-cell">Width</span>
                  <span class="sku-header-cell">Height</span>
                  <span class="sku-header-cell">Thickness</span>
                  <span class="sku-header-cell">SKU-NAME</span>
                  <span class="sku-header-cell">가격</span>
                </div>

                <!-- SKU 데이터 행 -->              
                <div
                  v-for="sku in item.itemSkus"
                  :key="sku.id"
                  class="sku-item"
                  @click.stop="selectSku(item, sku)"
                > 
                  <div class="sku-row">
                    <span class="sku-code">{{ sku.skuId }}</span>
                    <span v-if="sku.width" class="sku-spec">W: {{ sku.width }}mm</span>
                    <span v-if="sku.height" class="sku-spec">H: {{ sku.height }}mm</span>
                    <span v-if="sku.thickness" class="sku-spec">T: {{ sku.thickness }}mm</span>
                    <span v-if="sku.skuNm" class="sku-name">{{ sku.skuNm }}</span>  <!-- 추가 -->
                    <span v-if="sku.unitPrice" class="sku-price">{{ formatCurrency(sku.unitPrice) }}원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 페이징 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            type="button" 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 0"
            class="page-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
          
          <button 
            type="button" 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage >= totalPages - 1"
            class="page-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { itemService, type Item, type ItemSku } from '~/services/item.service'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'sku-selected', item: Item, sku: ItemSku): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 상태 관리
const isOpen = ref(false)
const loading = ref(false)
const items = ref<Item[]>([])
const searchKeyword = ref('')
const currentPage = ref(0)
const totalPages = ref(0)

// 팝업 열기/닫기
const openPopup = () => {
  console.log('🔍 openPopup 호출됨')
  isOpen.value = true
  console.log('🔍 isOpen 값:', isOpen.value)
  loadItems()
}

const closePopup = () => {
  isOpen.value = false
  searchKeyword.value = ''
  currentPage.value = 0
  emit('update:modelValue', false)
}

// 품목 목록 로드
const loadItems = async () => {
  try {
    loading.value = true
    
    const params = {
      page: currentPage.value,
      size: 10,
      keyword: searchKeyword.value || undefined
    }
    
    const response = await itemService.getItems(params)
    items.value = response.content
    totalPages.value = response.totalPages
  } catch (error) {
    console.error('품목 목록 로드 실패:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

// 검색 처리
const handleSearch = () => {
  currentPage.value = 0
  loadItems()
}

// 페이지 변경
const changePage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    loadItems()
  }
}

// SKU 선택
const selectSku = (item: Item, sku: ItemSku) => {
  emit('sku-selected', item, sku)
  closePopup()
}

// 품목 선택 (SKU가 없는 경우)
const selectItem = (item: Item) => {
  if (item.itemSkus && item.itemSkus.length > 0) {
    // SKU가 있으면 첫 번째 SKU 선택
    selectSku(item, item.itemSkus[0])
  } else {
    // SKU가 없으면 기본 정보만 전달
    const defaultSku: ItemSku = {
      skuId: item.itemId,        // SKU ID를 품목 ID와 동일하게 설정
      skuNm: item.itemNm,
      width: item.width,
      height: item.height,
      thickness: item.thickness,
      unitPrice: item.unitPrice,
      stockQty: 0,
      useYn: item.useYn
    }
    selectSku(item, defaultSku)
  }
}

// 통화 포맷팅
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

// Props 변경 감지
watch(() => props.modelValue, (newValue) => {
  console.log('🔍 ItemSkuSelector watch triggered:', newValue)
  if (newValue) {
    console.log('🔍 ItemSkuSelector openPopup 호출')
    openPopup()
  }
})

// 컴포넌트 노출
defineExpose({
  openPopup,
  closePopup
})
</script>

<style scoped>
/*
 * Common styles managed by admin-common.css:
 * - .popup-overlay: 팝업 배경
 * - .popup-content: 팝업 컨테이너 (xlarge 적용)
 * - .popup-header: 팝업 헤더
 * - .close-btn: 닫기 버튼
 * - .search-section: 검색 영역
 * - .search-input-group: 검색 입력 그룹
 * - .search-input: 검색 입력 필드
 * - .btn-primary: 조회 버튼
 * - .btn-secondary: 닫기 버튼
 * - .loading, .no-items: 로딩/빈 상태
 * - .pagination: 페이지네이션
 */

/* 팝업 크기 조정 - xlarge 사용 */
.popup-content {
  max-width: 800px;
}

/* 품목 목록 섹션 */
.items-section {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

/* 품목 리스트 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 품목 카드 */
.item-card {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: var(--primary-500);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

/* 품목 헤더 */
.item-header {
  padding: 0.625rem 0.75rem;
  background: linear-gradient(to right, #eff6ff, #dbeafe);
  border-bottom: 2px solid var(--primary-300);
}

.item-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-label {
  font-weight: 600;
  color: var(--primary-700);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.item-full-name {
  font-weight: 500;
  color: var(--gray-700);
  font-size: var(--font-size-sd);
  line-height: 1.4;
}

/* SKU 리스트 */
.sku-list {
  display: flex;
  flex-direction: column;
}

.sku-item {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: all 0.2s;
}

.sku-item:last-child {
  border-bottom: none;
}

.sku-item:hover {
  background: #eff6ff;
  border-left: 3px solid var(--primary-500);
  padding-left: calc(0.75rem - 3px);
}

/* SKU 한 줄 레이아웃 */
.sku-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.sku-code {
  font-weight: 600;
  color: var(--primary-700);
  font-size: var(--font-size-sm);
  background: var(--primary-50);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  min-width: 120px;
}

.sku-spec {
  font-size: var(--font-size-xs);
  color: var(--gray-600);
  background: var(--gray-100);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 80px;
}

.sku-price {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary-700);
  background: var(--primary-100);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  margin-left: auto;
  flex-shrink: 0;
}

/* SKU 헤더 행 */
.sku-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--gray-100);
  border-bottom: 2px solid var(--gray-300);
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--gray-700);
}

.sku-header-cell {
  flex-shrink: 0;
  text-align: center;
}

.sku-header-cell:nth-child(1) { /* SKU-ID */
  min-width: 120px;
}

.sku-header-cell:nth-child(2),  /* Width */
.sku-header-cell:nth-child(3),  /* Height */
.sku-header-cell:nth-child(4) { /* Thickness */
  min-width: 90px;
}

.sku-header-cell:nth-child(5) { /* SKU-NAME */
  min-width: 140px;
}

.sku-header-cell:nth-child(6) { /* 가격 */
  margin-left: auto;
  min-width: 100px;
}

/* SKU-NAME 필드 스타일 */
.sku-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--gray-700);
  background: var(--gray-50);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  min-width: 140px;
}

/* 반응형 */
@media (max-width: 768px) {
  .popup-content {
    width: 95%;
    max-height: 90vh;
  }

  .items-section {
    padding: 1rem;
  }

  .sku-specs {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
