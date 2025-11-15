<template>
  <div class="variable-helper">
    <div class="helper-header">
      <h4>
        <i class="ri-code-s-slash-line"></i>
        템플릿 변수
      </h4>
      <p class="helper-description">
        변수를 클릭하면 메시지 내용에 삽입됩니다. 실제 발송 시 해당 데이터로 치환됩니다.
      </p>
    </div>

    <!-- 카테고리 탭 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category"
        :class="['tab-btn', { active: selectedCategory === category }]"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <!-- 변수 목록 -->
    <div class="variables-grid">
      <div
        v-for="variable in filteredVariables"
        :key="variable.key"
        class="variable-card"
        @click="handleInsert(variable.key)"
      >
        <div class="variable-header">
          <span class="variable-name">{{ variable.name }}</span>
          <code class="variable-key">&#123;&#123;{{ variable.key }}&#125;&#125;</code>
        </div>
        <div class="variable-description">{{ variable.description }}</div>
        <div class="variable-example">
          <i class="ri-lightbulb-line"></i>
          예: {{ variable.example }}
        </div>
      </div>
    </div>

    <!-- 사용 예시 -->
    <div class="usage-example">
      <div class="example-header">
        <i class="ri-information-line"></i>
        사용 예시
      </div>
      <div class="example-content">
        <pre>{{ exampleMessage }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TEMPLATE_VARIABLES, type TemplateVariable } from '~/types/message-template'

// Emits
const emit = defineEmits<{
  insertVariable: [key: string]
}>()

// State
const selectedCategory = ref<'납품' | '운송' | '공통'>('납품')

// Computed
const categories = computed(() => {
  const allCategories = [...new Set(TEMPLATE_VARIABLES.map((v) => v.category))]
  return allCategories
})

const filteredVariables = computed(() => {
  return TEMPLATE_VARIABLES.filter((v) => v.category === selectedCategory.value)
})

const exampleMessage = computed(() => {
  if (selectedCategory.value === '납품') {
    return `[플래트리] 납품확인서 서명 요청

안녕하세요, {{현장소장}}님.

납품요구번호: {{납품요구번호}}
계약번호: {{계약번호}}
수요기관: {{수요기관}}
프로젝트: {{프로젝트명}}

아래 링크에서 납품확인서에 서명해 주시기 바랍니다.
{{서명URL}}

문의: {{회사연락처}}`
  } else if (selectedCategory.value === '운송') {
    return `[플래트리] 운송 현황 안내

운송장번호: {{운송장번호}}
납품일자: {{납품일자}}
납품주소: {{납품주소}}

배송기사: {{기사명}} ({{기사연락처}})
출발시간: {{출발시간}}
예상도착: {{예상도착}}

문의: {{회사연락처}}`
  } else {
    return `[플래트리] 안내

문의사항은 {{회사연락처}}로 연락 주시기 바랍니다.`
  }
})

// Methods
const handleInsert = (key: string) => {
  emit('insertVariable', key)
}
</script>

<style scoped>
.variable-helper {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.helper-header {
  margin-bottom: 20px;
}

.helper-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.helper-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* 카테고리 탭 */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* 변수 그리드 */
.variables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.variable-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.variable-card:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}

.variable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.variable-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.variable-key {
  display: inline-block;
  padding: 2px 6px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.variable-description {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}

.variable-example {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
  padding-top: 6px;
  border-top: 1px solid #f3f4f6;
}

.variable-example i {
  font-size: 14px;
}

/* 사용 예시 */
.usage-example {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.example-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.example-content {
  padding: 16px;
}

.example-content pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Malgun Gothic', sans-serif;
}

/* 반응형 */
@media (max-width: 768px) {
  .variables-grid {
    grid-template-columns: 1fr;
  }

  .category-tabs {
    flex-wrap: wrap;
  }
}
</style>
