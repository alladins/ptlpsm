# CSS 사용 가이드라인

## 📋 개요

본 프로젝트는 **공통 CSS 시스템**을 사용하여 일관된 UI/UX를 제공합니다.
**새 컴포넌트 작성 시 반드시 기존 공통 CSS를 먼저 확인하고 재사용하세요.**

---

## 🚫 절대 금지 사항

### ❌ 중복 스타일 작성 금지
```vue
<!-- ❌ 나쁜 예: 공통 CSS에 이미 있는 스타일을 중복 작성 -->
<style scoped>
.form-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  /* ... */
}
</style>
```

```vue
<!-- ✅ 좋은 예: 공통 CSS import만 -->
<style scoped>
@import '@/assets/css/admin-common.css';
</style>
```

### ❌ 버튼 스타일 중복 작성 금지
```vue
<!-- ❌ 나쁜 예 -->
<style scoped>
.btn-primary {
  background: blue;
  /* ... */
}
</style>
```

```vue
<!-- ✅ 좋은 예: admin-buttons.css 사용 -->
<style scoped>
@import '@/assets/css/admin-buttons.css';
</style>
<template>
  <button class="btn-primary">저장</button>
</template>
```

---

## 📂 CSS 파일 구조

### 파일 위치: `assets/css/`

| 파일명 | 역할 | 주요 내용 |
|--------|------|----------|
| **global.css** | 디자인 토큰 | CSS 변수 정의 (색상, 간격, 크기) |
| **admin-common.css** | Admin 기본 | `.form-input`, `.form-select`, 테이블, 모달 |
| **admin-forms.css** | 폼 확장 | `.info-group`, `.info-grid`, 크기 변형 |
| **admin-buttons.css** | 버튼 전용 | 모든 버튼 스타일 |
| **admin-tables.css** | 테이블 전용 | 테이블 레이아웃, 헤더, 액션 |
| **admin-edit-register.css** | 등록/수정 페이지 | 2열 레이아웃, 품목 섹션 |
| **admin-search.css** | 검색 UI | 검색 폼, 필터 |
| **admin-detail.css** | 상세 페이지 | 금액 표시, 파일 정보 |

---

## ✅ 작업 순서

### 1단계: 기존 CSS 검색
새 컴포넌트 작성 전 **반드시** 공통 CSS에 해당 스타일이 있는지 확인:

```bash
# assets/css 폴더에서 검색
grep -r "form-input" assets/css/
grep -r "btn-primary" assets/css/
grep -r "info-group" assets/css/
```

### 2단계: 필요한 CSS 파일만 Import
```vue
<style scoped>
/* 기본 (폼, 버튼) */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

/* 추가 필요 시 */
@import '@/assets/css/admin-forms.css';    /* info-group 패턴 필요 시 */
@import '@/assets/css/admin-tables.css';   /* 테이블 필요 시 */
</style>
```

### 3단계: 컴포넌트 전용 스타일만 작성
```vue
<style scoped>
/* 공통 CSS import */
@import '@/assets/css/admin-common.css';

/* 이 컴포넌트에만 필요한 스타일만 작성 */
.custom-feature {
  display: flex;
  gap: 1rem;
}
</style>
```

---

## 🔍 자주 사용하는 클래스

### 1. 입력 필드 (admin-common.css, admin-forms.css)

```vue
<!-- 기본 입력 (width: 80%) -->
<input type="text" class="form-input" />

<!-- 크기 지정 -->
<input type="text" class="form-input-xs" />  <!-- 60px -->
<input type="text" class="form-input-sm" />  <!-- 120px -->
<input type="text" class="form-input-md" />  <!-- 200px -->
<input type="text" class="form-input-lg" />  <!-- 300px -->
<input type="text" class="form-input-xl" />  <!-- 400px -->

<!-- Select -->
<select class="form-select-sm">...</select>

<!-- Textarea -->
<textarea class="form-textarea"></textarea>
```

### 2. 버튼 (admin-buttons.css)

```vue
<!-- 주요 버튼 -->
<button class="btn-primary">저장</button>
<button class="btn-secondary">취소</button>
<button class="btn-danger">삭제</button>
<button class="btn-success">승인</button>

<!-- 테이블 액션 버튼 -->
<button class="btn-edit">수정</button>
<button class="btn-delete">삭제</button>
<button class="btn-view">보기</button>

<!-- 특화 버튼 -->
<button class="btn-upload">업로드</button>
<button class="btn-download">다운로드</button>
<button class="btn-search-sm">검색</button>
<button class="btn-add-item">품목 추가</button>
```

### 3. info-group 패턴 (admin-forms.css)

```vue
<div class="info-group">
  <div class="info-group-header">
    <i class="fas fa-building"></i>
    <span>기본 정보</span>
  </div>
  <div class="info-grid grid-3">
    <div class="form-field">
      <label>회사명</label>
      <input type="text" class="form-input" />
    </div>
    <div class="form-field">
      <label>사업자번호</label>
      <input type="text" class="form-input-md" />
    </div>
    <!-- ... -->
  </div>
</div>
```

**그리드 변형**:
- `.grid-1`: 1열
- `.grid-2`: 2열
- `.grid-3`: 3열
- `.grid-4`: 4열
- `.grid-5`: 5열

**컬럼 스팬**:
```vue
<div class="form-field form-field--full">  <!-- 전체 너비 -->
  <label>주소</label>
  <input type="text" class="form-input" />
</div>

<div class="form-field form-field--span-2">  <!-- 2칸 차지 -->
  <label>사업명</label>
  <input type="text" class="form-input" />
</div>
```

### 4. Input Group (admin-forms.css)

```vue
<!-- Input + Button 조합 -->
<div class="input-group">
  <input type="text" class="form-input" readonly />
  <button class="btn-search-sm">검색</button>
</div>

<!-- Search Group -->
<div class="search-group">
  <input type="text" class="form-input-md" />
  <button class="btn-search">조회</button>
</div>
```

### 5. 에러 표시

```vue
<div class="form-field">
  <label>회사명</label>
  <input type="text" class="form-input" :class="{ error: hasError }" />
  <span v-if="hasError" class="error-message">
    회사명을 입력해주세요.
  </span>
</div>
```

---

## 📖 실제 사용 예시

### 예시 1: 간단한 폼

```vue
<template>
  <div class="content-section">
    <div class="info-group">
      <div class="info-group-header">
        <i class="fas fa-user"></i>
        <span>사용자 정보</span>
      </div>
      <div class="info-grid grid-2">
        <div class="form-field">
          <label>이름</label>
          <input type="text" class="form-input" v-model="form.name" />
        </div>
        <div class="form-field">
          <label>이메일</label>
          <input type="email" class="form-input" v-model="form.email" />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-secondary" @click="cancel">취소</button>
      <button class="btn-primary" @click="save">저장</button>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}
</style>
```

### 예시 2: 검색 + 테이블

```vue
<template>
  <div class="content-section">
    <!-- 검색 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>키워드</label>
          <input type="text" class="keyword-input" />
        </div>
        <button class="btn-search-inline">조회</button>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>총 <strong>{{ total }}</strong>건</span>
        </div>
        <div class="table-actions">
          <button class="btn-action btn-primary">
            <i class="fas fa-plus"></i>
            등록
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>이름</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>
                <button class="btn-edit">수정</button>
                <button class="btn-delete">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';
</style>
```

---

## 🎨 CSS 변수 사용 (global.css)

공통 CSS에서 제공하는 CSS 변수를 활용하세요:

```css
/* 색상 */
var(--primary-500)      /* #3b82f6 */
var(--gray-50)          /* #f9fafb */
var(--danger-500)       /* #ef4444 */
var(--success-500)      /* #10b981 */

/* 간격 */
var(--spacing-xs)       /* 0.5rem */
var(--spacing-md)       /* 1rem */
var(--spacing-lg)       /* 1.5rem */

/* 크기 */
var(--font-size-xs)     /* 0.75rem (12px) */
var(--font-size-sm)     /* 0.875rem (14px) */
var(--font-size-md)     /* 1rem (16px) */

/* Border Radius */
var(--radius-sm)        /* 0.375rem */
var(--radius-md)        /* 0.5rem */

/* Shadow */
var(--shadow-sm)        /* 작은 그림자 */
var(--shadow-md)        /* 중간 그림자 */
```

**사용 예시**:
```vue
<style scoped>
.custom-card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  background: var(--gray-50);
}
</style>
```

---

## 🔧 컴포넌트별 Import 가이드

### Form 컴포넌트
```vue
<style scoped>
@import '@/assets/css/admin-common.css';    /* 기본 폼 */
@import '@/assets/css/admin-forms.css';     /* info-group */
@import '@/assets/css/admin-buttons.css';   /* 버튼 */
</style>
```

### List 페이지
```vue
<style scoped>
@import '@/assets/css/admin-common.css';    /* 기본 */
@import '@/assets/css/admin-buttons.css';   /* 버튼 */
@import '@/assets/css/admin-tables.css';    /* 테이블 */
@import '@/assets/css/admin-search.css';    /* 검색 */
</style>
```

### Register/Edit 페이지
```vue
<style scoped>
@import '@/assets/css/admin-common.css';         /* 기본 */
@import '@/assets/css/admin-forms.css';          /* info-group */
@import '@/assets/css/admin-buttons.css';        /* 버튼 */
@import '@/assets/css/admin-edit-register.css';  /* 레이아웃 */
</style>
```

### Detail 페이지
```vue
<style scoped>
@import '@/assets/css/admin-common.css';    /* 기본 */
@import '@/assets/css/admin-forms.css';     /* info-group */
@import '@/assets/css/admin-buttons.css';   /* 버튼 */
@import '@/assets/css/admin-detail.css';    /* 금액 표시 */
</style>
```

---

## ⚠️ 주의사항

### 1. scoped 스타일 사용
```vue
<style scoped>
/* scoped를 반드시 사용하여 다른 컴포넌트 영향 방지 */
</style>
```

### 2. Import 순서
```vue
<style scoped>
/* 1. 공통 CSS import */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';

/* 2. 컴포넌트 전용 스타일 */
.custom-style {
  /* ... */
}
</style>
```

### 3. 불필요한 Import 금지
```vue
<!-- ❌ 나쁜 예: 사용하지 않는 CSS import -->
<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-tables.css';      /* 테이블 없는데 import */
@import '@/assets/css/admin-search.css';      /* 검색 없는데 import */
</style>
```

```vue
<!-- ✅ 좋은 예: 필요한 것만 import -->
<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
</style>
```

### 4. 공통 CSS 수정 금지
**공통 CSS 파일(`assets/css/`)을 직접 수정하지 마세요!**
수정이 필요한 경우 팀 리드와 상의하세요.

---

## 📝 체크리스트

새 컴포넌트 작성 시:

- [ ] `assets/css/` 폴더에서 유사한 스타일 검색
- [ ] 필요한 공통 CSS 파일만 import
- [ ] 중복 스타일 작성하지 않음
- [ ] 컴포넌트 전용 스타일만 작성
- [ ] scoped 속성 사용
- [ ] CSS 변수 활용 (var(--primary-500) 등)
- [ ] 반응형 고려 (@media)

---

## 🆘 문제 해결

### Q: 원하는 스타일이 공통 CSS에 없는 경우?
**A**: 컴포넌트 내부에 작성하되, 주석으로 이유를 명시하세요.
```vue
<style scoped>
@import '@/assets/css/admin-common.css';

/* 직인 이미지 업로드 (프로젝트 공통 CSS에 없는 전용 기능) */
.seal-upload-area {
  display: flex;
  padding: 1rem;
  /* ... */
}
</style>
```

### Q: 기존 컴포넌트가 중복 스타일을 가지고 있는 경우?
**A**: 리팩토링하여 공통 CSS로 교체하세요.
```vue
<!-- Before -->
<style scoped>
.form-input {
  padding: 0.625rem 0.875rem;
  /* ... */
}
</style>

<!-- After -->
<style scoped>
@import '@/assets/css/admin-common.css';
</style>
```

### Q: 공통 CSS 클래스 이름을 모르는 경우?
**A**: 이 문서의 "자주 사용하는 클래스" 섹션을 참고하거나 `assets/css/` 폴더를 검색하세요.
```bash
grep -r "button" assets/css/admin-buttons.css
grep -r "input" assets/css/admin-common.css
```

---

## 📚 참고 자료

- **공통 CSS 폴더**: `assets/css/`
- **프로젝트 지침**: `CLAUDE.md`
- **예제 컴포넌트**:
  - `pages/admin/order/edit/[id].vue` (info-group 패턴)
  - `pages/admin/order/register.vue` (등록 페이지 레이아웃)
  - `pages/admin/order/list.vue` (검색 + 테이블)

---

**작성일**: 2025-01-14
**버전**: 1.0.0
**관리**: 프론트엔드팀
