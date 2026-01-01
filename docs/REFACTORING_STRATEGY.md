# 🔧 Refactoring Strategy (리팩토링 전략)

> **참고**: 개별 페이지 리팩토링 기록은 `REFACTORING_SHIPMENT_EDIT.md` 등 별도 파일 참조

---

## ⚠️ 핵심 원칙

1. **기능 동일성 보장** - 모든 기능은 리팩토링 전/후 100% 동일
2. **중복 제거 필수** - 리팩토링 시 발견된 중복 코드는 반드시 문서화 후 제거
3. **점진적 진행** - 한 번에 하나의 페이지만 리팩토링

---

## 📂 파일 배치 규칙

### `components/ui/` - 프로젝트 전체 공통 UI
- **조건**: Admin/Public 모두 사용 가능한 순수 UI 컴포넌트
- **예시**: DataTable, SearchForm, PageHeader, Pagination

### `components/admin/common/` - Admin 공통 컴포넌트
- **조건**: 여러 Admin 페이지에서 사용하는 공통 컴포넌트
- **예시**: ErrorPopup, ItemSelectPopup, OrderSelectPopup

### `components/admin/[domain]/` - 도메인 특화 컴포넌트
- **조건**: 특정 도메인(item, order, sales 등)에서만 사용
- **예시**: item/, order/, sales/

### `composables/` - Vue 기반 재사용 로직
- **조건**: ref, computed, watch 등 Vue API 사용하는 로직
- **예시**: useDataTable, useForm, useModal
- **위치**: 루트는 전체 공통, `admin/`은 Admin 전용

### `utils/` - 순수 함수
- **조건**: Vue 독립적인 순수 JavaScript/TypeScript 함수
- **예시**: formatDate(), formatCurrency(), validate()

---

## 🔍 중복 코드 탐지 및 제거 프로세스

### 리팩토링 시 반드시 수행:

**1단계: 중복 분석 (리팩토링 전)**

리팩토링 대상 페이지를 분석하여 다음 중복 패턴을 체크:
- □ 검색 폼 (날짜, 키워드, 정렬)
- □ 페이지네이션 (changePage, pageNumbers, changePageSize)
- □ 테이블 헤더 (총 개수, 페이지 크기 선택)
- □ 데이터 로딩/에러 상태
- □ formatDate, formatCurrency 함수
- □ 페이지 헤더 (title, description)
- □ 모달 구조 (등록/수정/삭제)
- □ CSS 클래스 (.btn-primary, .form-input 등)

**2단계: 중복 제거 문서 생성**

각 페이지 리팩토링 후 별도 문서에 다음 형식으로 기록:

```markdown
## [페이지명] 중복 제거 내역

### 제거된 중복 (Before → After)

1. **검색 폼 로직 (50줄)**
   - Before: 인라인 검색 폼 + 로직
   - After: `<SearchForm>` 컴포넌트 사용 (5줄)
   - 위치: `components/ui/SearchForm.vue`

2. **페이지네이션 로직 (80줄)**
   - Before: changePage, pageNumbers, changePageSize 함수
   - After: `useDataTable` composable 사용 (10줄)
   - 위치: `composables/useDataTable.ts`

### 총 제거된 코드
- **450줄 제거** (2,000줄 → 1,550줄)
- **중복률**: 22.5% 감소
```

**3단계: 실제 리팩토링**
- 중복 코드를 공통 컴포넌트/composable/utils로 이동
- 기존 페이지에서 중복 코드 제거
- import 문으로 대체

**4단계: 검증**
- □ 모든 기능 동작 확인
- □ UI 동일성 확인
- □ 콘솔 에러 없음
- □ API 호출 정상
- □ 중복 제거 문서 작성 완료

---

## 🚫 절대 금지 사항

**리팩토링 시:**
- ❌ 새 기능 추가
- ❌ 기존 기능 수정/개선
- ❌ UI/UX 변경
- ❌ API 호출 방식 변경
- ❌ 비즈니스 로직 변경

**중복 제거 시:**
- ❌ "나중에 정리" - 반드시 즉시 정리
- ❌ 일부만 제거 - 발견된 중복은 모두 제거
- ❌ 문서 없이 제거 - 반드시 문서화

---

## ✅ 허용 사항

- ✅ 컴포넌트 분리 (큰 파일 → 작은 파일들)
- ✅ 중복 코드를 공통으로 추출
- ✅ 타입 정의를 types/로 이동
- ✅ 유틸 함수를 utils/로 이동
- ✅ 인라인 스타일을 공통 CSS로 이동
- ✅ 변수명, 함수명 명확화 (의미 변경 없이)

---

## 📊 리팩토링 성공 기준

각 페이지 리팩토링 후:
1. **코드 라인 수**: 50~70% 감소
2. **중복 코드**: 0% (모두 제거)
3. **기능 동일성**: 100% 유지
4. **타입 안정성**: 100% 타입 커버리지
5. **중복 제거 문서**: 필수 작성

---

## 🎯 Refactoring Roadmap (리팩토링 로드맵)

### Phase 1: 공통 인프라 구축
1. `utils/format.ts` - formatDate, formatCurrency 등
2. `utils/validate.ts` - 검증 함수
3. `utils/constants.ts` - 상수 정의
4. `types/common.ts` - 공통 타입 (Pagination, Sort, Filter 등)

### Phase 2: 공통 Composables
1. `composables/useDataTable.ts` - 테이블 로직 (페이징, 정렬, 검색)
2. `composables/useForm.ts` - 폼 로직 (상태, 검증, 제출)
3. `composables/useModal.ts` - 모달 로직 (열기/닫기)

### Phase 3: 공통 UI 컴포넌트
1. `components/ui/PageHeader.vue` - 페이지 헤더
2. `components/ui/SearchForm.vue` - 검색 폼
3. `components/ui/DataTable.vue` - 데이터 테이블
4. `components/ui/Pagination.vue` - 페이지네이션

### Phase 4: 페이지별 리팩토링 (복잡도 순)
1. **basic-info/item.vue** (2,830줄 → ~200줄 예상)
2. **order/edit/[id].vue** (1,556줄 → ~200줄)
3. **sales/edit/[id].vue** (1,510줄 → ~200줄)
4. 기타 페이지들

---

## 📝 Refactoring Checklist Template

각 페이지 작업 시 사용할 체크리스트:

```markdown
# [페이지명] 리팩토링 체크리스트

## Before (분석)
- [ ] 전체 라인 수: ____줄
- [ ] 주요 기능 목록 작성
- [ ] 중복 패턴 식별
- [ ] 의존성 파악

## During (작업)
- [ ] 중복 제거 계획 수립
- [ ] 공통 컴포넌트 생성
- [ ] 기존 코드 교체
- [ ] import 문 정리

## After (검증)
- [ ] 전체 라인 수: ____줄 (감소율: __%)
- [ ] 모든 기능 동작 확인
- [ ] UI 동일성 확인
- [ ] 콘솔 에러 없음
- [ ] 중복 제거 문서 작성
```

---

## 📚 관련 문서

- [CSS 가이드라인](./CSS_GUIDELINES.md)
- [출하 수정 페이지 리팩토링](./REFACTORING_SHIPMENT_EDIT.md)
- [API 엔드포인트 가이드](./API_ENDPOINTS_GUIDE.md)

---

**작성일**: 2025-01-27
**버전**: 1.0.0
