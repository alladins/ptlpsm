<template>
  <div class="manual-page">
    <!-- 헤더 -->
    <div class="manual-header">
      <div class="mh-left">
        <h1>사용자 매뉴얼</h1>
        <span class="mh-desc">출하관리 시스템 사용 안내</span>
      </div>
      <div class="mh-right">
        <div class="mh-search">
          <i class="fas fa-search" />
          <input
            v-model="keyword"
            type="text"
            placeholder="목차 검색 (예: 손실, 운송비, 원가)"
          >
          <button v-if="keyword" class="mh-clear" @click="keyword = ''">
            <i class="fas fa-times" />
          </button>
        </div>
        <a href="/docs/사용자매뉴얼.md" download class="btn-download">
          <i class="fas fa-download" />
          내려받기
        </a>
      </div>
    </div>

    <div v-if="loading" class="manual-state">
      <i class="fas fa-spinner fa-spin" /> 매뉴얼을 불러오는 중...
    </div>

    <div v-else-if="error" class="manual-state error">
      <i class="fas fa-exclamation-triangle" />
      {{ error }}
    </div>

    <div v-else class="manual-body">
      <!-- 좌측 목차 -->
      <!-- ⚠ 스크롤되는 상자는 이 aside 다(.toc-nav 에는 overflow 가 없다). ref 를 옮기지 말 것 -->
      <aside ref="tocEl" class="manual-toc">
        <div class="toc-head">
          목차
          <span v-if="keyword" class="toc-count">{{ visibleToc.length }}건</span>
        </div>
        <nav class="toc-nav">
          <a
            v-for="t in visibleToc"
            :key="t.id"
            :ref="el => setTocLink(t.id, el)"
            :href="`#${t.id}`"
            class="toc-link"
            :class="[`lv${t.level}`, { active: activeId === t.id }]"
            @click.prevent="goTo(t.id)"
          >
            {{ t.text }}
          </a>
          <p v-if="visibleToc.length === 0" class="toc-empty">
            찾는 항목이 없습니다.
          </p>
        </nav>
      </aside>

      <!-- 우측 본문 -->
      <article ref="contentEl" class="manual-content" @click="onContentClick">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="md-root" v-html="html" />
      </article>
    </div>

    <button v-if="showTop" class="btn-top" title="맨 위로" @click="scrollTop">
      <i class="fas fa-arrow-up" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { renderMarkdown, type TocItem } from '~/utils/markdown'

definePageMeta({
  layout: 'admin',
  pageTitle: '사용자 매뉴얼'
})

/**
 * 도식(ASCII 아트)용 고정폭 한글 글꼴
 *
 * ⚠ Consolas 계열에는 한글 글리프가 없다. 그래서 영문은 Consolas, 한글은 시스템
 *   한글 글꼴로 섞여 렌더되는데, 두 글꼴의 문자 폭이 정확히 1:2 가 아니라서
 *   "한글 1자 = 영문 2자" 를 전제로 그린 박스 도식의 오른쪽 변이 어긋난다.
 *   영문·한글이 한 벌로 들어 있는 고정폭 글꼴을 써야 맞는다.
 *
 * 이 페이지에서만 불러온다(다른 화면 로딩에 영향 없음).
 */
useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding&display=swap'
    }
  ]
})

/**
 * 사용자 매뉴얼 화면
 *
 * docs/출하관리시스템_사용자매뉴얼.md 를 그대로 읽어 좌측 목차 + 우측 본문으로 보여준다.
 * 문서를 고치면 이 화면도 같이 바뀐다 — 화면용 사본을 따로 두지 않는다.
 *
 * ⚠ 문서를 ?raw 로 가져오므로 이 페이지 청크에만 들어간다(약 180KB).
 *   다른 화면의 로딩에는 영향이 없다.
 */

const loading = ref(true)
const error = ref('')
const html = ref('')
const toc = ref<TocItem[]>([])
const keyword = ref('')
const activeId = ref('')
const showTop = ref(false)
const contentEl = ref<HTMLElement | null>(null)
const tocEl = ref<HTMLElement | null>(null)

/**
 * 목차 항목 DOM 보관
 *
 * 본문을 내리면 activeId 만 바뀌고 목차는 제자리에 있어서,
 * 한참 읽다 보면 지금 보는 절이 목차 화면 밖으로 밀려나 어디인지 알 수 없었다.
 * 활성 항목이 바뀔 때 목차도 같이 움직이게 하려고 각 링크를 붙잡아 둔다.
 */
const tocLinks = new Map<string, HTMLElement>()

const setTocLink = (id: string, el: unknown) => {
  if (el instanceof HTMLElement) {
    tocLinks.set(id, el)
  } else {
    tocLinks.delete(id)
  }
}

/** 활성 항목이 목차 화면 밖이면 가운데로 끌어온다 (안에 있으면 건드리지 않는다) */
const syncTocScroll = (id: string) => {
  const box = tocEl.value
  const link = tocLinks.get(id)
  if (!box || !link) { return }

  const boxRect = box.getBoundingClientRect()
  const linkRect = link.getBoundingClientRect()

  // 위아래로 40px 여유를 두고, 그 밖으로 나갔을 때만 움직인다.
  // 늘 가운데로 맞추면 본문을 조금만 굴려도 목차가 출렁여 읽기 어렵다.
  const margin = 40
  const above = linkRect.top < boxRect.top + margin
  const below = linkRect.bottom > boxRect.bottom - margin
  if (!above && !below) { return }

  const target = box.scrollTop + (linkRect.top - boxRect.top)
                 - (box.clientHeight / 2) + (linkRect.height / 2)
  box.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
}

watch(activeId, (id) => {
  if (id) { nextTick(() => syncTocScroll(id)) }
})

// 목차는 1~3단계만 보여준다. 4단계까지 넣으면 너무 길어진다.
const visibleToc = computed(() => {
  const base = toc.value.filter(t => t.level >= 1 && t.level <= 3)
  const k = keyword.value.trim()
  if (!k) { return base }
  return base.filter(t => t.text.toLowerCase().includes(k.toLowerCase()))
})

const goTo = (id: string) => {
  const el = document.getElementById(id)
  if (!el) { return }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id
  history.replaceState(null, '', `#${id}`)
}

// 본문 안의 [링크](#앵커) 클릭도 부드럽게 이동시킨다
const onContentClick = (e: MouseEvent) => {
  const a = (e.target as HTMLElement).closest('a.md-anchor') as HTMLAnchorElement | null
  if (!a) { return }
  const id = decodeURIComponent(a.getAttribute('href') || '').slice(1)
  if (!id) { return }
  e.preventDefault()
  goTo(id)
}

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

// 스크롤에 따라 현재 위치를 목차에 표시
let observer: IntersectionObserver | null = null
const onScroll = () => { showTop.value = window.scrollY > 400 }

onMounted(async () => {
  try {
    const raw = (await import('~/docs/출하관리시스템_사용자매뉴얼.md?raw')).default
    const parsed = renderMarkdown(raw)
    html.value = parsed.html
    toc.value = parsed.toc
  } catch (e) {
    console.error('매뉴얼 로드 실패:', e)
    error.value = '매뉴얼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    return
  } finally {
    loading.value = false
  }

  await nextTick()

  // 주소창에 앵커가 있으면 그 위치로
  const hash = decodeURIComponent(location.hash || '').slice(1)
  if (hash) { goTo(hash) }

  observer = new IntersectionObserver((entries) => {
    const hit = entries.filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
    if (hit?.target?.id) { activeId.value = hit.target.id }
  }, { rootMargin: '-80px 0px -70% 0px' })

  contentEl.value?.querySelectorAll('h1[id], h2[id], h3[id]')
    .forEach(el => observer?.observe(el))

  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.manual-page {
  padding: 20px 24px 60px;
}

/* ===== 헤더 ===== */
.manual-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 18px;
}

.mh-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.mh-desc {
  font-size: 13px;
  color: #6b7280;
}

.mh-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mh-search {
  position: relative;
  display: flex;
  align-items: center;
}

.mh-search > i {
  position: absolute;
  left: 10px;
  color: #9ca3af;
  font-size: 12px;
}

.mh-search input {
  width: 260px;
  padding: 8px 28px 8px 30px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 13px;
}

.mh-clear {
  position: absolute;
  right: 8px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 12px;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.btn-download:hover {
  border-color: #2563eb;
  color: #1d4ed8;
}

.manual-state {
  padding: 60px;
  text-align: center;
  color: #6b7280;
}

.manual-state.error {
  color: #b91c1c;
}

/* ===== 본문 레이아웃 ===== */
.manual-body {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.manual-toc {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 10px;
}

.toc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  padding: 4px 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.toc-count {
  font-weight: 500;
  color: #2563eb;
}

.toc-nav {
  display: flex;
  flex-direction: column;
}

.toc-link {
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 12.5px;
  color: #4b5563;
  text-decoration: none;
  line-height: 1.4;
}

.toc-link:hover {
  background: #eef2ff;
  color: #1d4ed8;
}

.toc-link.active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.toc-link.lv1 {
  font-weight: 700;
  color: #111827;
  margin-top: 8px;
}

.toc-link.lv2 { padding-left: 16px; }
.toc-link.lv3 { padding-left: 28px; font-size: 12px; color: #6b7280; }

.toc-empty {
  padding: 14px 8px;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

.manual-content {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 26px 30px;
  min-width: 0;
}

.btn-top {
  position: fixed;
  right: 26px;
  bottom: 26px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.btn-top:hover {
  border-color: #2563eb;
  color: #1d4ed8;
}

@media (max-width: 1024px) {
  .manual-body {
    grid-template-columns: 1fr;
  }

  .manual-toc {
    position: static;
    max-height: 260px;
  }
}
</style>

<style>
/* ===== 마크다운 본문 (scoped 아님 — v-html 내부에 적용되어야 한다) ===== */
.md-root {
  color: #1f2937;
  font-size: 14px;
  line-height: 1.75;
  word-break: keep-all;
  overflow-wrap: break-word;
}

.md-root .md-h {
  scroll-margin-top: 20px;
  font-weight: 700;
  color: #111827;
}

.md-root .md-h1 {
  font-size: 22px;
  margin: 34px 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #2563eb;
}

.md-root .md-h1:first-child { margin-top: 0; }

.md-root .md-h2 {
  font-size: 18px;
  margin: 28px 0 12px;
  padding-left: 9px;
  border-left: 4px solid #2563eb;
}

.md-root .md-h3 {
  font-size: 15px;
  margin: 20px 0 8px;
  color: #1d4ed8;
}

.md-root .md-h4 {
  font-size: 14px;
  margin: 16px 0 6px;
  color: #374151;
}

.md-root .md-p { margin: 8px 0; }

.md-root .md-hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 26px 0;
}

.md-root .md-list {
  margin: 8px 0 8px 20px;
  padding-left: 8px;
}

.md-root .md-list li { margin: 4px 0; }

.md-root .md-quote {
  margin: 12px 0;
  padding: 11px 14px;
  background: #f8fafc;
  border-left: 4px solid #94a3b8;
  border-radius: 0 6px 6px 0;
  color: #475569;
  font-size: 13px;
}

.md-root .md-pre {
  margin: 12px 0;
  padding: 13px 15px;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.6;
}

.md-root .md-pre code {
  background: none;
  color: inherit;
  padding: 0;
  /*
    ⚠ 순서를 바꾸지 말 것. 한글이 든 고정폭 글꼴이 먼저 와야 도식이 맞는다.
      D2Coding 은 설치돼 있으면 쓰고, 없으면 웹폰트 Nanum Gothic Coding 으로 간다.
      Consolas 를 앞에 두면 한글만 다른 글꼴로 떨어져 나가 박스가 어긋난다.
  */
  font-family: "D2Coding", "Nanum Gothic Coding", "NanumGothicCoding",
               "Sarasa Mono K", "Noto Sans Mono CJK KR", Consolas, monospace;
  white-space: pre;
}

.md-root code {
  padding: 1px 5px;
  background: #f1f5f9;
  border-radius: 4px;
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 0.9em;
  color: #be123c;
}

.md-root .md-table-wrap {
  margin: 12px 0;
  overflow-x: auto;
}

.md-root .md-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.md-root .md-table th,
.md-root .md-table td {
  border: 1px solid #e5e7eb;
  padding: 7px 10px;
  vertical-align: top;
}

.md-root .md-table th {
  background: #f8fafc;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
}

.md-root .md-table tbody tr:nth-child(even) { background: #fcfcfd; }

.md-root a {
  color: #2563eb;
  text-decoration: none;
}

.md-root a:hover { text-decoration: underline; }

.md-root strong { color: #111827; }
</style>
