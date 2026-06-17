<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h3><i class="fas fa-box" /> 품목 선택</h3>
          <button class="modal-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="search-bar">
          <i class="fas fa-search" />
          <input
            v-model="keyword"
            type="text"
            placeholder="품목명 검색"
            @input="onSearchInput"
          >
        </div>

        <div class="modal-body" @scroll="onScroll">
          <div v-if="loading && items.length === 0" class="state">불러오는 중...</div>
          <div v-else-if="filteredItems.length === 0" class="state">
            <i class="fas fa-inbox" />
            <p>품목이 없습니다.</p>
          </div>

          <div v-else class="item-list">
            <article
              v-for="item in filteredItems"
              :key="item.itemId"
              class="item-card"
              @click="selectItem(item)"
            >
              <div class="item-name">{{ item.itemName }}</div>
              <div v-if="item.specification" class="item-spec">{{ item.specification }}</div>
              <div v-if="item.unit" class="item-unit">{{ item.unit }}</div>
            </article>
            <div v-if="loadingMore" class="loading-more">
              <i class="fas fa-spinner fa-spin" /> 더 불러오는 중...
            </div>
            <div v-else-if="!hasMore && items.length > 0" class="end">— 끝 —</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#imports'
import { publicOrderRequestService } from '~/services/public-order-request.service'
import type { MobileItemListItem } from '~/types/mobile-order'

type Item = MobileItemListItem

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', item: Item): void
}>()

const route = useRoute()
const token = String(route.params.token)

const items = ref<Item[]>([])
const keyword = ref('')
const page = ref(0)
const size = 50
const hasMore = ref(true)
const loading = ref(false)
const loadingMore = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const filteredItems = computed(() => {
  if (!keyword.value.trim()) return items.value
  const q = keyword.value.toLowerCase()
  return items.value.filter(it =>
    (it.itemName || '').toLowerCase().includes(q)
    || (it.specification || '').toLowerCase().includes(q)
  )
})

async function load(nextPage = 0) {
  const isFirst = nextPage === 0
  if (isFirst) loading.value = true
  else loadingMore.value = true
  try {
    const res = await publicOrderRequestService.searchItems(token, nextPage, size)
    const content = (res.content || []) as Item[]
    if (isFirst) items.value = content
    else items.value.push(...content)
    page.value = nextPage
    hasMore.value = !res.last
  } catch (e) {
    console.error('품목 조회 실패', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function selectItem(item: Item) {
  emit('select', item)
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    // 현재는 클라이언트 필터링. 향후 서버 검색으로 전환 시 여기에 load(0) 호출.
  }, 300)
}

function onScroll(e: Event) {
  const target = e.target as HTMLElement
  const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 100
  if (nearBottom && hasMore.value && !loadingMore.value && !loading.value) {
    load(page.value + 1)
  }
}

onMounted(() => load(0))
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end;
  z-index: 2000;
}
.modal-container {
  background: white;
  width: 100%;
  height: 85vh;
  border-radius: 1rem 1rem 0 0;
  display: flex; flex-direction: column;
}
.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 1rem; }
.modal-close {
  background: none; border: none;
  font-size: 1.2rem; color: #6b7280; cursor: pointer;
}
.search-bar {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.search-bar i { color: #9ca3af; }
.search-bar input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.95rem;
}
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}
.state {
  text-align: center; padding: 2rem;
  color: #9ca3af;
}
.state i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }
.item-list { display: flex; flex-direction: column; gap: 0.4rem; }
.item-card {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  cursor: pointer;
  background: white;
}
.item-card:active { background: #f3f4f6; }
.item-name { font-weight: 500; font-size: 0.95rem; }
.item-spec { font-size: 0.8rem; color: #6b7280; margin-top: 0.15rem; }
.item-unit { font-size: 0.75rem; color: #9ca3af; margin-top: 0.15rem; }
.loading-more, .end {
  text-align: center; padding: 1rem;
  color: #9ca3af; font-size: 0.85rem;
}
</style>
