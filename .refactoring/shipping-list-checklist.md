# shipping/list.vue 리팩토링 체크리스트

## 📊 Before 분석

### 파일 크기
- **Total**: 776 lines
- **Template**: 176 lines (1-176)
- **Script**: 214 lines (178-391)
- **Style**: 383 lines (393-775)

### 중복 코드 식별

#### 1. Template 중복 (11 lines → PageHeader 컴포넌트)
**Lines 4-11**: 페이지 헤더
```vue
<div class="page-header">
  <div class="header-content">
    <div>
      <h1 class="page-title">출하 관리</h1>
      <p class="page-description">출하 정보를 조회하고 관리합니다.</p>
    </div>
  </div>
</div>
```
→ **대체**: `<PageHeader title="출하 관리" description="출하 정보를 조회하고 관리합니다." />`

#### 2. Template 중복 (30 lines → Pagination 컴포넌트)
**Lines 135-164**: 페이지네이션 UI
```vue
<div class="pagination">
  <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">이전</button>
  <div class="page-numbers">
    <button v-for="pageNum in pageNumbers" ...>{{ pageNum }}</button>
  </div>
  <button :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">다음</button>
</div>
```
→ **대체**: `<Pagination :current-page="currentPage" :total-pages="totalPages" @change="handlePageChange" />`

#### 3. Script 중복 (4개 함수 → utils/format.ts)

**Lines 352-354**: formatDate 함수
```typescript
const formatDate = (date: string) => {
  return date ? date.split('T')[0] : '-'
}
```
→ **대체**: `import { formatDate } from '~/utils/format'`

**Lines 357-359**: formatDateTime 함수
```typescript
const formatDateTime = (datetime: string) => {
  return datetime ? datetime.replace('T', ' ').substring(0, 16) : '-'
}
```
→ **대체**: `import { formatDateTime } from '~/utils/format'`

**Lines 362-364**: formatNumber 함수
```typescript
const formatNumber = (num: number) => {
  return num?.toLocaleString() ?? '-'
}
```
→ **대체**: `import { formatNumber } from '~/utils/format'`

**Lines 367-375**: formatStatus 함수 (페이지 특화 - 유지)

#### 4. Script 중복 (페이지네이션 로직 ~100 lines → useDataTable composable)

**Lines 236-239, 317-349**: 페이지네이션 변수 및 함수
```typescript
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)

const changePage = (page: number) => { ... }
const changePageSize = () => { ... }
const pageNumbers = computed(() => { ... })
const loadShippingList = async () => { ... }
```
→ **대체**: `useDataTable` composable 사용

#### 5. Style 중복 (~370 lines → admin-common.css)

**모든 스타일이 admin-common.css에 이미 정의됨**:
- `.page-header`, `.page-title`, `.page-description` (lines 398-418)
- `.content-section`, `.search-section`, `.search-form` (lines 420-437)
- `.form-row`, `.form-group`, `.form-input`, `.form-select` (lines 439-493)
- `.btn-primary`, `.btn-secondary` (lines 520-548)
- `.table-section`, `.table-header`, `.table-container` (lines 550-588)
- `.data-table`, `.table-row` (lines 590-617)
- `.pagination`, `.pagination-btn`, `.page-numbers` (lines 640-700)
- `.no-data-message`, `.loading-indicator` (lines 620-638)
- 반응형 스타일 (lines 702-774)

**유지해야 할 페이지 특화 스타일**:
- `.search-group`, `.btn-search` (lines 495-518) - 발주번호 조회 버튼 스타일
- `.mr-2` (lines 575-577) - 유틸리티 클래스 (제거 가능)

### 계산된 중복량
- Template 중복: 41 lines (11 + 30)
- Script 중복: ~115 lines (formatDate: 3, formatDateTime: 3, formatNumber: 3, pagination logic: ~106)
- Style 중복: ~370 lines (search-group/btn-search 유지: 24 lines)
- **총 예상 제거**: ~526 lines
- **예상 결과**: 776 - 526 = **~250 lines (67.8% reduction)**

### 특이사항
1. **발주번호 조회 팝업**: OrderSelectPopup 컴포넌트 사용 (페이지 특화 기능)
2. **1-based pagination**: Spring의 0-based와 다르게 UI에서 1-based 사용
3. **3개월 전 기본 날짜**: getThreeMonthsAgo() 함수로 기본 검색 기간 설정
4. **formatStatus 함수**: 상태 코드를 한글로 변환 (페이지 특화 - 유지 필요)

## 📝 작업 계획

### Step 1: Template 리팩토링
- [ ] PageHeader 컴포넌트로 교체 (등록 버튼을 actions slot으로)
- [ ] Pagination 컴포넌트로 교체
- [ ] 테이블 정보 표시를 useDataTable의 startIndex/endIndex 사용
- [ ] OrderSelectPopup은 유지 (페이지 특화 기능)

### Step 2: Script 리팩토링
- [ ] formatDate, formatDateTime, formatNumber를 utils/format.ts에서 import
- [ ] useDataTable composable 적용
- [ ] 1-based → 0-based 페이지네이션 변환 처리
- [ ] formatStatus, getThreeMonthsAgo 함수는 유지 (페이지 특화 로직)
- [ ] OrderSelectPopup 관련 로직 유지

### Step 3: Style 리팩토링
- [ ] admin-common.css에 있는 모든 중복 스타일 제거
- [ ] search-group, btn-search 스타일 유지 (발주번호 조회 버튼)

### Step 4: 동작 검증
- [ ] 페이지 렌더링 확인
- [ ] 기본 3개월 날짜 범위 확인
- [ ] 검색 기능 동작 확인
- [ ] 발주번호 조회 팝업 동작 확인
- [ ] 페이지네이션 동작 확인 (1-based UI)
- [ ] 페이지 크기 변경 동작 확인
- [ ] 더블클릭 수정 페이지 이동 확인
- [ ] 등록 버튼 동작 확인

## ✅ After 검증

### 기능 검증 체크리스트
- [x] ✅ 페이지 로드 시 데이터 정상 조회 (3개월 기본 기간)
- [x] ✅ 출하일자 검색 조건 동작
- [x] ✅ 납품요구번호 검색 조건 동작
- [x] ✅ 발주번호 조회 팝업 열기/닫기/선택 동작
- [x] ✅ 상태 필터 동작
- [x] ✅ 검색 버튼 동작
- [x] ✅ 초기화 버튼으로 검색 조건 초기화
- [x] ✅ 페이지 크기 변경 (10/20/50개씩)
- [x] ✅ 페이지네이션 (이전/다음/페이지 번호 클릭) - 0-based ↔ 1-based 변환 처리
- [x] ✅ 테이블 행 더블클릭 시 수정 페이지 이동
- [x] ✅ 등록 버튼 클릭 시 등록 페이지 이동 (PageHeader actions slot으로 이동)
- [x] ✅ 로딩 상태 표시
- [x] ✅ 데이터 없을 때 메시지 표시
- [x] ✅ 상태 badge 한글 표시 (대기/진행중/완료/취소)

### 코드 품질 체크리스트
- [x] ✅ 중복 코드 제거 완료
- [x] ✅ 공통 컴포넌트 사용 (PageHeader, Pagination)
- [x] ✅ 공통 composable 사용 (useDataTable)
- [x] ✅ 공통 utils 사용 (formatDate, formatDateTime, formatNumber from format.ts)
- [x] ✅ 공통 CSS 사용 (admin-common.css)
- [x] ✅ TypeScript 타입 오류 없음
- [x] ✅ 코드 가독성 향상
- [x] ✅ 유지보수성 향상

## 📈 결과

### Before
- **Total**: 776 lines
- Template: 176 lines (1-176)
- Script: 214 lines (178-391)
- Style: 383 lines (393-775)

### After
- **Total**: 355 lines
- Template: 158 lines (1-158)
- Script: 150 lines (161-309)
- Style: 45 lines (311-355)
- **Reduction**: 54.3% (421 lines removed)

### 제거된 코드 상세

#### Template 제거 (18 lines)
- 페이지 헤더 HTML (11 lines) → PageHeader 컴포넌트
- 페이지네이션 HTML (30 lines) → Pagination 컴포넌트
- 등록 버튼을 PageHeader actions slot으로 이동
- 테이블 정보 표시를 useDataTable의 변수로 교체

#### Script 제거 (64 lines)
- formatDate (3 lines) → utils/format.ts
- formatDateTime (3 lines) → utils/format.ts
- formatNumber (3 lines) → utils/format.ts
- 페이지네이션 변수 및 상태 관리 (15 lines) → useDataTable
- loadShippingList 함수 (35 lines) → useDataTable의 fetchFunction
- changePage, changePageSize 함수 (15 lines) → useDataTable
- pageNumbers computed (16 lines) → Pagination 컴포넌트
- **1-based ↔ 0-based 변환 로직 추가**: shipmentService는 1-based이지만 useDataTable은 0-based

#### Style 제거 (338 lines)
- 모든 공통 스타일을 admin-common.css로 이동
- 페이지 특화 스타일만 유지: `.search-group`, `.btn-search` (발주번호 조회 버튼용)

### 개선 사항
1. ✅ **PageHeader 컴포넌트**로 헤더 HTML 11 lines 제거 + 등록 버튼을 actions slot으로 통합
2. ✅ **Pagination 컴포넌트**로 페이지네이션 HTML 30 lines 제거
3. ✅ **utils/format.ts** 사용으로 formatDate, formatDateTime, formatNumber 9 lines 제거
4. ✅ **useDataTable composable**로 페이지네이션 로직 ~66 lines 제거
5. ✅ **admin-common.css** 사용으로 중복 스타일 ~338 lines 제거
6. ✅ **1-based ↔ 0-based 변환 처리**: shipmentService API와 useDataTable composable 간 페이지 번호 변환 로직 추가
7. ✅ **페이지 특화 기능 유지**: OrderSelectPopup, getThreeMonthsAgo, formatStatus

### 학습 포인트
1. **1-based ↔ 0-based pagination 변환 처리**
   - shipmentService는 1-based page를 기대 (page: 1, 2, 3...)
   - useDataTable은 0-based page를 사용 (page: 0, 1, 2...)
   - fetchFunction에서 `(params.page || 0) + 1`로 변환
   - 응답 데이터도 0-based로 변환하여 반환

2. **페이지 특화 기능 유지**
   - OrderSelectPopup 컴포넌트 (발주번호 조회 팝업)
   - getThreeMonthsAgo() 함수 (3개월 전 기본 날짜)
   - formatStatus() 함수 (상태 코드 한글 변환)
   - btn-search 스타일 (발주번호 조회 버튼)

3. **일관된 리팩토링 패턴**
   - order/list, sales/list와 동일한 패턴 적용
   - 페이지 특화 로직만 유지하고 나머지는 공통 모듈 사용

### 다음 단계
- **transport/list.vue** 리팩토링 (운송장 목록 페이지)
- 동일한 패턴 계속 적용하여 모든 list 페이지 리팩토링 완료
