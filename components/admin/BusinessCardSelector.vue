<template>
  <div class="business-card-selector">
    <!-- 선택 버튼 -->
    <button
      type="button"
      class="btn-select-card"
      title="명함에서 담당자 선택"
      @click="handleClick"
    >
      <i class="fas fa-address-card" />
      명함선택
    </button>

    <!-- 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3>명함 선택</h3>
            <button class="modal-close" @click="closeModal">
              <i class="fas fa-times" />
            </button>
          </div>

          <div class="modal-body">
            <!-- 검색 -->
            <div class="search-bar">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="기관명, 담당자명, 연락처, 이메일 검색"
                class="search-input"
                @keyup.enter="searchCards"
              >
              <button class="btn-search" @click="searchCards">
                <i class="fas fa-search" />
              </button>
            </div>

            <!-- 명함 목록 -->
            <div class="card-list">
              <div v-if="loadingCards" class="loading-state">
                <i class="fas fa-spinner fa-spin" />
                <span>불러오는 중...</span>
              </div>

              <div v-else-if="cards.length === 0" class="empty-state">
                <i class="fas fa-address-card" />
                <p>검색 결과가 없습니다.</p>
              </div>

              <div
                v-for="card in cards"
                v-else
                :key="card.cardId"
                class="card-item"
                :class="{ selected: tempSelected?.cardId === card.cardId }"
                @click="selectCard(card)"
              >
                <div class="card-name">
                  <i class="fas fa-user" />
                  {{ card.contactNm }}
                  <span v-if="card.dminsttNm" class="card-org">{{ card.dminsttNm }}</span>
                </div>
                <div class="card-details">
                  <span v-if="card.contactTel" class="card-detail">
                    <i class="fas fa-phone" /> {{ card.contactTel }}
                  </span>
                  <span v-if="card.contactEmail" class="card-detail">
                    <i class="fas fa-envelope" /> {{ card.contactEmail }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 페이징 -->
            <div v-if="totalPages > 1" class="pagination-simple">
              <button :disabled="currentPage <= 0" @click="loadPage(currentPage - 1)">
                <i class="fas fa-chevron-left" />
              </button>
              <span>{{ currentPage + 1 }} / {{ totalPages }}</span>
              <button :disabled="currentPage >= totalPages - 1" @click="loadPage(currentPage + 1)">
                <i class="fas fa-chevron-right" />
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-action btn-secondary" @click="closeModal">
              취소
            </button>
            <button
              class="btn-action btn-primary"
              :disabled="!tempSelected"
              @click="confirmSelection"
            >
              선택
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { businessCardService, type BusinessCardResponse } from '~/services/business-card.service'

// Props
const props = defineProps<{
  dminsttCd?: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'card-selected', card: BusinessCardResponse): void
}>()

// 상태
const showModal = ref(false)
const loadingCards = ref(false)
const searchKeyword = ref('')
const cards = ref<BusinessCardResponse[]>([])
const tempSelected = ref<BusinessCardResponse | null>(null)
const currentPage = ref(0)
const totalPages = ref(0)

const handleClick = () => {
  openModal()
}

const openModal = () => {
  showModal.value = true
  searchKeyword.value = ''
  tempSelected.value = null
  loadCards()
}

const closeModal = () => {
  showModal.value = false
}

const loadCards = async () => {
  loadingCards.value = true
  try {
    // dminsttCd가 있으면 기관별 조회, 없으면 전체 목록에서 키워드 검색
    const params: any = {
      keyword: searchKeyword.value || undefined,
      page: currentPage.value,
      size: 10
    }
    if (props.dminsttCd) {
      params.dminsttCd = props.dminsttCd
    }
    const response = await businessCardService.getBusinessCardList(params)
    cards.value = response.content
    totalPages.value = response.totalPages
  } catch (error) {
    console.error('명함 조회 실패:', error)
    cards.value = []
  } finally {
    loadingCards.value = false
  }
}

const searchCards = () => {
  currentPage.value = 0
  loadCards()
}

const loadPage = (page: number) => {
  currentPage.value = page
  loadCards()
}

const selectCard = (card: BusinessCardResponse) => {
  tempSelected.value = card
}

const confirmSelection = () => {
  if (tempSelected.value) {
    emit('card-selected', tempSelected.value)
    closeModal()
  }
}

// 수요기관 변경 시 리셋
watch(() => props.dminsttCd, () => {
  cards.value = []
  tempSelected.value = null
  currentPage.value = 0
})
</script>

<style scoped>
.btn-select-card {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-select-card:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #2563eb;
  color: #2563eb;
}
.btn-select-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.modal-lg {
  max-width: 560px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #6b7280;
}
.modal-body {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 검색 바 */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.search-input:focus {
  outline: none;
  border-color: #2563eb;
}
.btn-search {
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* 명함 목록 */
.card-list {
  min-height: 200px;
}
.card-item {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.card-item:hover {
  background-color: #f9fafb;
  border-color: #93c5fd;
}
.card-item.selected {
  background-color: #eff6ff;
  border-color: #2563eb;
}
.card-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
  color: #111827;
}
.card-name i {
  color: #6b7280;
  margin-right: 6px;
}
.card-org {
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
  margin-left: 8px;
}
.card-details {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.card-detail {
  font-size: 13px;
  color: #6b7280;
}
.card-detail i {
  margin-right: 4px;
  width: 14px;
}

/* 상태 */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 0;
  color: #9ca3af;
}
.loading-state i, .empty-state i {
  font-size: 24px;
  margin-bottom: 8px;
  display: block;
}

/* 페이징 */
.pagination-simple {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}
.pagination-simple button {
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}
.pagination-simple button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pagination-simple span {
  font-size: 13px;
  color: #6b7280;
}
</style>
