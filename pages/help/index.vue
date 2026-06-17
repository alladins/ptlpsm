<template>
  <div class="help-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-icon">
        <i class="fas fa-question-circle" />
      </div>
      <div class="header-text">
        <h1 class="page-title">
          도움말
        </h1>
        <p class="page-description">
          기능 사용법과 자주 묻는 질문을 안내합니다.
        </p>
      </div>
    </div>

    <!-- 검색바 -->
    <div class="search-bar">
      <i class="fas fa-search search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="찾고 싶은 키워드를 입력하세요 (예: 납품확인서, 발주, 비밀번호)"
      >
      <button
        v-if="searchQuery"
        type="button"
        class="search-clear"
        aria-label="검색어 지우기"
        @click="searchQuery = ''"
      >
        <i class="fas fa-times" />
      </button>
    </div>

    <!-- 콘텐츠 영역 -->
    <div class="help-body">
      <!-- 좌측 목차 (sticky) -->
      <aside class="help-toc">
        <div class="toc-title">
          목차
        </div>
        <ul class="toc-list">
          <li
            v-for="section in filteredSections"
            :key="section.id"
            class="toc-item"
          >
            <a
              :href="`#${section.id}`"
              class="toc-link"
              :class="{ active: activeSectionId === section.id }"
              @click.prevent="scrollToSection(section.id)"
            >
              <i :class="section.icon" class="toc-icon" />
              <span>{{ section.title }}</span>
            </a>
          </li>
        </ul>
      </aside>

      <!-- 우측 본문 -->
      <main class="help-content">
        <div v-if="filteredSections.length === 0" class="no-results">
          <i class="fas fa-search no-results-icon" />
          <p class="no-results-text">
            "<strong>{{ searchQuery }}</strong>" 에 해당하는 도움말이 없습니다.
          </p>
          <button type="button" class="btn-clear-search" @click="searchQuery = ''">
            전체 보기
          </button>
        </div>

        <section
          v-for="section in filteredSections"
          :id="section.id"
          :key="section.id"
          class="help-section"
        >
          <header class="section-header">
            <i :class="section.icon" class="section-icon" />
            <div>
              <h2 class="section-title">
                {{ section.title }}
              </h2>
              <p v-if="section.description" class="section-description">
                {{ section.description }}
              </p>
            </div>
          </header>

          <div class="section-items">
            <article
              v-for="(item, idx) in section.items"
              :key="idx"
              class="help-item"
              :open="isItemOpen(section.id, idx)"
            >
              <button
                type="button"
                class="item-question"
                :aria-expanded="isItemOpen(section.id, idx)"
                @click="toggleItem(section.id, idx)"
              >
                <i
                  class="fas fa-chevron-right item-arrow"
                  :class="{ 'rotated': isItemOpen(section.id, idx) }"
                />
                <span>{{ item.question }}</span>
              </button>
              <div v-show="isItemOpen(section.id, idx)" class="item-body">
                <p class="item-text" v-html="item.body" />
                <div v-if="item.relatedLinks && item.relatedLinks.length > 0" class="item-links">
                  <span class="item-links-label">관련 페이지:</span>
                  <NuxtLink
                    v-for="link in item.relatedLinks"
                    :key="link.url"
                    :to="link.url"
                    class="item-link"
                  >
                    <i class="fas fa-arrow-right" />
                    {{ link.label }}
                  </NuxtLink>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { HELP_CONTENT, type HelpSection } from '~/constants/helpContent'

definePageMeta({
  layout: 'admin',
  pageTitle: '도움말'
})

const searchQuery = ref('')
const activeSectionId = ref<string>(HELP_CONTENT[0]?.id || '')
const openItems = ref<Set<string>>(new Set())

/**
 * 검색어로 섹션·항목 필터링
 * - 빈 검색어: 전체 노출
 * - 검색어 있음: 섹션 제목 또는 항목의 question/body 에 매칭되는 섹션만 노출
 *   (매칭되는 항목이 하나라도 있으면 섹션 전체를 유지)
 */
const filteredSections = computed<HelpSection[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    return HELP_CONTENT
  }

  return HELP_CONTENT
    .map((section) => {
      const sectionMatched = section.title.toLowerCase().includes(q)
      const matchedItems = section.items.filter(item =>
        item.question.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q)
      )

      if (sectionMatched) {
        return section
      }
      if (matchedItems.length > 0) {
        return { ...section, items: matchedItems }
      }
      return null
    })
    .filter((section): section is HelpSection => section !== null)
})

function itemKey (sectionId: string, idx: number): string {
  return `${sectionId}::${idx}`
}

function isItemOpen (sectionId: string, idx: number): boolean {
  return openItems.value.has(itemKey(sectionId, idx))
}

function toggleItem (sectionId: string, idx: number) {
  const key = itemKey(sectionId, idx)
  if (openItems.value.has(key)) {
    openItems.value.delete(key)
  } else {
    openItems.value.add(key)
  }
}

function scrollToSection (id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSectionId.value = id
  }
}

// 스크롤 시 현재 보이는 섹션을 목차에서 강조
function handleScroll () {
  const sections = HELP_CONTENT
    .map(section => ({ id: section.id, el: document.getElementById(section.id) }))
    .filter(s => s.el !== null) as { id: string; el: HTMLElement }[]

  const scrollPos = window.scrollY + 120

  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].el.offsetTop <= scrollPos) {
      activeSectionId.value = sections[i].id
      return
    }
  }
  if (sections[0]) {
    activeSectionId.value = sections[0].id
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';

.help-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 검색바 */
.search-bar {
  position: relative;
  margin-bottom: 24px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.search-clear:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 본문 레이아웃 */
.help-body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: flex-start;
}

/* 목차 */
.help-toc {
  position: sticky;
  top: 80px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.toc-title {
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
  padding: 0 8px;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  color: #4b5563;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}

.toc-link:hover {
  background: #f3f4f6;
  color: #111827;
}

.toc-link.active {
  background: #ecfdf5;
  color: #047857;
  font-weight: 600;
}

.toc-icon {
  font-size: 13px;
  width: 16px;
  text-align: center;
  color: #9ca3af;
}

.toc-link.active .toc-icon {
  color: #10b981;
}

/* 본문 */
.help-content {
  min-width: 0;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
  text-align: center;
}

.no-results-icon {
  font-size: 36px;
  margin-bottom: 12px;
  color: #9ca3af;
}

.no-results-text {
  font-size: 15px;
  margin: 0 0 16px;
}

.btn-clear-search {
  padding: 8px 16px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-clear-search:hover {
  background: #059669;
}

/* 섹션 */
.help-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  scroll-margin-top: 80px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.section-icon {
  font-size: 22px;
  color: #10b981;
  margin-top: 2px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
}

.section-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 아코디언 항목 */
.help-item {
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
}

.help-item:hover {
  border-color: #e5e7eb;
}

.item-question {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.item-question:hover {
  background: #f9fafb;
}

.item-arrow {
  font-size: 12px;
  color: #9ca3af;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.item-arrow.rotated {
  transform: rotate(90deg);
}

.item-body {
  padding: 0 16px 16px 38px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
}

.item-text {
  margin: 12px 0 0;
}

.item-text :deep(strong) {
  color: #111827;
  font-weight: 600;
}

.item-text :deep(code) {
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #d97706;
}

.item-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}

.item-links-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.item-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #ecfdf5;
  color: #047857;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.item-link:hover {
  background: #d1fae5;
}

.item-link i {
  font-size: 10px;
}

/* 모바일 */
@media (max-width: 900px) {
  .help-body {
    grid-template-columns: 1fr;
  }

  .help-toc {
    position: static;
    max-height: none;
  }

  .toc-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .toc-link {
    flex-shrink: 0;
  }
}

@media (max-width: 640px) {
  .help-page {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .help-section {
    padding: 16px;
  }
}
</style>
