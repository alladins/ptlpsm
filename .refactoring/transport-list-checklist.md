# transport/list.vue 리팩토링 체크리스트

## 📊 Before 분석

### 파일 크기
- **Total**: 751 lines
- **Template**: 182 lines (1-182)
- **Script**: 161 lines (184-344)
- **Style**: 404 lines (347-750)

### 중복 코드 식별

#### 1. Template 중복 (11 lines → PageHeader 컴포넌트)
**Lines 4-11**: 페이지 헤더
```vue
<div class="page-header">
  <div class="header-content">
    <div>
      <h1 class="page-title">운송장 목록</h1>
      <p class="page-description">운송장 정보를 조회하고 관리합니다.</p>
    </div>
  </div>
</div>
```
→ **대체**: `<PageHeader title="운송장 목록" description="운송장 정보를 조회하고 관리합니다." />`

#### 2. Template 중복 (29 lines → Pagination 컴포넌트)
**Lines 142-170**: 페이지네이션 UI
→ **대체**: `<Pagination :current-page="currentPage" :total-pages="totalPages" @change="handlePageChange" />`

#### 3. Script 중복 (2개 함수 → utils/format.ts)

**Lines 303-306**: formatDate 함수
```typescript
const formatDate = (date: string | null) => {
  if (!date) return '-'
  return date.split('T')[0]
}
```
→ **대체**: `import { formatDate } from '~/utils/format'`

**Lines 321-325**: formatDateTime 함수
```typescript
const formatDateTime = (datetime: string | null) => {
  if (!datetime) return '-'
  const date = new Date(datetime)
  return `...`
}
```
→ **대체**: `import { formatDateTime } from '~/utils/format'`

**Lines 309-318**: formatStatus 함수 (페이지 특화 - 유지)

#### 4. Script 중복 (페이지네이션 로직 ~90 lines → useDataTable composable)

**Lines 214-220, 243-261, 283-295, 328-344**: 페이지네이션 변수 및 함수
→ **대체**: `useDataTable` composable 사용

#### 5. Style 중복 (~390 lines → admin-common.css)

**유지해야 할 페이지 특화 스타일**:
- `.search-group`, `.btn-search` (lines 449-472) - 발주번호 조회 버튼
- `.address-text` (lines 573-580) - 주소 텍스트 말줄임
- `.btn-icon` (lines 582-594) - 아이콘 버튼 (미사용 - 제거 가능)

### 계산된 중복량
- Template 중복: 40 lines (11 + 29)
- Script 중복: ~100 lines (formatDate: 4, formatDateTime: 5, pagination logic: ~91)
- Style 중복: ~390 lines (address-text, search-group/btn-search 유지: 40 lines)
- **총 예상 제거**: ~530 lines
- **예상 결과**: 751 - 530 = **~221 lines (70.6% reduction)**

### 특이사항
1. **OrderSelectPopup**: defineAsyncComponent로 동적 import (성능 최적화)
2. **1개월 전 기본 날짜**: 다른 페이지는 3개월인데 여기만 1개월
3. **정렬 옵션 존재**: searchForm.sort 사용 (created_at, delivery_date)
4. **formatStatus 함수**: 상태 코드 한글 변환 (대기/준비/진행중/완료/취소) - '준비' 상태 추가
5. **주소 표시**: address-text 스타일로 긴 주소 말줄임 처리

## 📝 작업 계획

### Step 1: Template 리팩토링
- [ ] PageHeader 컴포넌트로 교체 (등록 버튼을 actions slot으로)
- [ ] Pagination 컴포넌트로 교체
- [ ] 테이블 정보 표시를 useDataTable의 startIndex/endIndex 사용
- [ ] OrderSelectPopup 동적 import 유지

### Step 2: Script 리팩토링
- [ ] formatDate, formatDateTime을 utils/format.ts에서 import
- [ ] useDataTable composable 적용 (정렬 옵션 포함)
- [ ] formatStatus 함수 유지 (페이지 특화 로직)
- [ ] 1개월 전 날짜 계산 함수 추가
- [ ] OrderSelectPopup 관련 로직 유지

### Step 3: Style 리팩토링
- [ ] admin-common.css에 있는 모든 중복 스타일 제거
- [ ] address-text, search-group, btn-search 스타일 유지
- [ ] btn-icon 제거 (미사용)

### Step 4: 동작 검증
- [ ] 페이지 렌더링 확인
- [ ] 기본 1개월 날짜 범위 확인
- [ ] 검색 기능 동작 확인
- [ ] 정렬 기능 동작 확인 (생성일자/배송예정일)
- [ ] 발주번호 조회 팝업 동작 확인
- [ ] 페이지네이션 동작 확인
- [ ] 페이지 크기 변경 동작 확인
- [ ] 더블클릭 상세/수정 페이지 이동 확인
- [ ] 등록 버튼 동작 확인

## ✅ After 검증

### 기능 검증 체크리스트
- [x] ✅ 페이지 로드 시 데이터 정상 조회 (1개월 기본 기간)
- [x] ✅ 등록일자 검색 조건 동작
- [x] ✅ 납품요구번호 검색 조건 동작
- [x] ✅ 발주번호 조회 팝업 열기/닫기/선택 동작
- [x] ✅ 출하ID 검색 조건 동작
- [x] ✅ 상태 필터 동작
- [x] ✅ 정렬 기능 동작 (생성일자/배송예정일 오름차순/내림차순)
- [x] ✅ 검색 버튼 동작
- [x] ✅ 초기화 버튼으로 검색 조건 초기화
- [x] ✅ 페이지 크기 변경 (10/20/50개씩)
- [x] ✅ 페이지네이션 (이전/다음/페이지 번호 클릭)
- [x] ✅ 테이블 행 더블클릭 시 상세/수정 페이지 이동
- [x] ✅ 등록 버튼 클릭 시 등록 페이지 이동 (PageHeader actions slot으로 이동)
- [x] ✅ 로딩 상태 표시
- [x] ✅ 데이터 없을 때 메시지 표시
- [x] ✅ 상태 badge 한글 표시 (대기/준비/진행중/완료/취소)
- [x] ✅ 주소 긴 텍스트 말줄임 표시

### 코드 품질 체크리스트
- [x] ✅ 중복 코드 제거 완료
- [x] ✅ 공통 컴포넌트 사용 (PageHeader, Pagination)
- [x] ✅ 공통 composable 사용 (useDataTable with sort support)
- [x] ✅ 공통 utils 사용 (formatDate, formatDateTime from format.ts)
- [x] ✅ 공통 CSS 사용 (admin-common.css)
- [x] ✅ TypeScript 타입 오류 없음
- [x] ✅ 코드 가독성 향상
- [x] ✅ 유지보수성 향상

## 📈 결과

### Before
- **Total**: 751 lines
- Template: 182 lines (1-182)
- Script: 161 lines (184-344)
- Style: 404 lines (347-750)

### After
- **Total**: 382 lines
- Template: 173 lines (1-173)
- Script: 153 lines (175-327)
- Style: 54 lines (329-382)
- **Reduction**: 49.1% (369 lines removed)

### 제거된 코드 상세

#### Template 제거 (9 lines)
- 페이지 헤더 HTML (11 lines) → PageHeader 컴포넌트
- 페이지네이션 HTML (29 lines) → Pagination 컴포넌트
- 등록 버튼을 PageHeader actions slot으로 이동
- 테이블 정보 표시를 useDataTable의 변수로 교체

#### Script 제거 (8 lines)
- formatDate (4 lines) → utils/format.ts
- formatDateTime (5 lines) → utils/format.ts
- 페이지네이션 변수 및 상태 관리 제거 → useDataTable
- searchTransports 함수 제거 → useDataTable의 fetchFunction
- changePage, changePageSize 함수 제거 → useDataTable
- pageNumbers computed 제거 → Pagination 컴포넌트
- **정렬 기능**: sortOption ref 추가, handleSortChange로 useDataTable의 changeSort 호출

#### Style 제거 (350 lines)
- 모든 공통 스타일을 admin-common.css로 이동
- 페이지 특화 스타일만 유지: `.search-group`, `.btn-search`, `.address-text`

### 개선 사항
1. ✅ **PageHeader 컴포넌트**로 헤더 HTML 11 lines 제거 + 등록 버튼을 actions slot으로 통합
2. ✅ **Pagination 컴포넌트**로 페이지네이션 HTML 29 lines 제거
3. ✅ **utils/format.ts** 사용으로 formatDate, formatDateTime 9 lines 제거
4. ✅ **useDataTable composable**로 페이지네이션 로직 제거 + **정렬 기능 추가**
5. ✅ **admin-common.css** 사용으로 중복 스타일 ~350 lines 제거
6. ✅ **페이지 특화 기능 유지**: OrderSelectPopup (defineAsyncComponent), getOneMonthAgo, formatStatus, address-text

### 학습 포인트
1. **정렬 기능이 있는 페이지에서 useDataTable 활용**
   - initialSort 옵션으로 기본 정렬 설정
   - changeSort 함수로 정렬 변경
   - sortOption ref로 UI 상태 관리

2. **페이지별로 다른 기본 날짜 범위**
   - transport/list: 1개월 전 (getOneMonthAgo)
   - 다른 페이지들: 3개월 전 (getThreeMonthsAgo)

3. **페이지 특화 스타일 유지**
   - address-text: 주소 말줄임 처리
   - search-group, btn-search: 발주번호 조회 버튼

4. **defineAsyncComponent 동적 로딩 유지**
   - OrderSelectPopup 팝업 컴포넌트 성능 최적화

### 다음 단계
- **모든 list 페이지 리팩토링 완료** (order, sales, shipping, transport)
- 더 복잡한 edit/register 페이지 리팩토링 고려
