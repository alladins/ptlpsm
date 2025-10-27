# sales/list.vue 리팩토링 체크리스트

## 📊 Before 분석

### 파일 크기
- **Total**: 880 lines
- **Template**: 190 lines (1-190)
- **Script**: 222 lines (192-413)
- **Style**: 465 lines (415-879)

### 중복 코드 식별

#### 1. Template 중복 (11 lines → PageHeader 컴포넌트)
**Lines 4-11**: 페이지 헤더
```vue
<div class="page-header">
  <div class="header-content">
    <div>
      <h1 class="page-title">영업 관리</h1>
      <p class="page-description">영업 정보를 조회하고 관리합니다.</p>
    </div>
  </div>
</div>
```
→ **대체**: `<PageHeader title="영업 관리" description="영업 정보를 조회하고 관리합니다." />`

#### 2. Template 중복 (30 lines → Pagination 컴포넌트)
**Lines 157-186**: 페이지네이션 UI
```vue
<div v-if="salesList && salesList.totalPages > 1" class="pagination">
  <button :disabled="salesList.first" @click="changePage(salesList.number - 1)" class="pagination-btn">
    이전
  </button>
  <div class="page-numbers">
    <button v-for="pageNum in getPageNumbers()" :key="pageNum" ...>
      {{ pageNum }}
    </button>
  </div>
  <button :disabled="salesList.last" @click="changePage(salesList.number + 1)" class="pagination-btn">
    다음
  </button>
</div>
```
→ **대체**: `<Pagination :current-page="currentPage" :total-pages="totalPages" @change="handlePageChange" />`

#### 3. Script 중복 (3개 함수 → utils/format.ts)

**Lines 244-247**: formatCurrency 함수
```typescript
const formatCurrency = (amount?: number) => {
  if (!amount) return '-'
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}
```
→ **대체**: `import { formatCurrency } from '~/utils/format'`

**Lines 250-253**: formatDate 함수
```typescript
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('ko-KR')
}
```
→ **대체**: `import { formatDate } from '~/utils/format'`

**Lines 256-269**: formatDateForApi 함수
```typescript
const formatDateForApi = (dateString: string, isEndDate: boolean = false) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isEndDate) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  return date.toISOString()
}
```
→ **대체**: `import { formatDateForApi } from '~/utils/format'` (이미 존재)

#### 4. Script 중복 (페이지네이션 로직 121 lines → useDataTable composable)

**Lines 222, 218, 221, 381-407**: 페이지네이션 관련 변수 및 함수
```typescript
const pageSize = ref(10)
const salesList = ref<SalesListResponse | null>(null)
const loading = ref(false)

const changePage = (page: number) => {
  searchForm.value.page = page
  fetchSalesList()
}

const changePageSize = () => {
  searchForm.value.size = pageSize.value
  searchForm.value.page = 0
  fetchSalesList()
}

const getPageNumbers = () => {
  if (!salesList.value) return []
  const pages = []
  const currentPage = salesList.value.number + 1
  const totalPages = salesList.value.totalPages
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
}

const fetchSalesList = async () => {
  try {
    loading.value = true
    // ... 50+ lines of fetch logic
  } finally {
    loading.value = false
  }
}
```
→ **대체**: `useDataTable` composable 사용

#### 5. Style 중복 (465 lines → admin-common.css)

**모든 스타일이 admin-common.css에 이미 정의됨**:
- `.page-header`, `.page-title`, `.page-description` (lines 420-440)
- `.content-section`, `.search-section`, `.search-form` (lines 442-459)
- `.form-row`, `.form-group`, `.form-input`, `.form-select` (lines 461-515)
- `.btn-primary`, `.btn-secondary` (lines 524-560)
- `.table-section`, `.table-header`, `.table-container` (lines 562-596)
- `.data-table`, `.table-row` (lines 598-626)
- `.status-badge` 및 variants (lines 628-658)
- `.pagination`, `.pagination-btn`, `.page-numbers` (lines 765-825)
- `.no-data-message`, `.loading-message` (lines 744-763)
- 반응형 스타일 (lines 827-878)

**유지해야 할 페이지 특화 스타일**:
- `.organization-info`, `.organization-name`, `.organization-code` (lines 727-742)

### 계산된 중복량
- Template 중복: 41 lines (11 + 30)
- Script 중복: ~150 lines (formatCurrency: 4, formatDate: 4, formatDateForApi: 14, pagination logic: ~120, getStatusClass 유지 필요)
- Style 중복: ~450 lines (organization 스타일 15 lines는 유지)
- **총 예상 제거**: ~641 lines
- **예상 결과**: 880 - 641 = **~239 lines (72.8% reduction)**

## 📝 작업 계획

### Step 1: Template 리팩토링
- [ ] PageHeader 컴포넌트로 교체
- [ ] Pagination 컴포넌트로 교체
- [ ] 테이블 정보 표시를 useDataTable의 startIndex/endIndex 사용

### Step 2: Script 리팩토링
- [ ] formatCurrency, formatDate, formatDateForApi를 utils/format.ts에서 import
- [ ] useDataTable composable 적용
- [ ] 페이지네이션 로직 제거 (useDataTable이 처리)
- [ ] fetchSalesList → useDataTable의 fetchFunction으로 통합
- [ ] searchSales, resetSearch 함수를 useDataTable의 search, reset과 연결
- [ ] getStatusClass는 유지 (페이지 특화 로직)

### Step 3: Style 리팩토링
- [ ] admin-common.css에 있는 모든 중복 스타일 제거
- [ ] organization-info 관련 스타일만 유지

### Step 4: 동작 검증
- [ ] 페이지 렌더링 확인
- [ ] 검색 기능 동작 확인
- [ ] 페이지네이션 동작 확인
- [ ] 페이지 크기 변경 동작 확인
- [ ] 정렬 동작 확인 (없음)
- [ ] 더블클릭 상세보기 동작 확인
- [ ] 등록 버튼 동작 확인

## ✅ After 검증

### 기능 검증 체크리스트
- [x] ✅ 페이지 로드 시 데이터 정상 조회
- [x] ✅ 검색 조건 입력 및 검색 버튼 동작
- [x] ✅ 초기화 버튼으로 검색 조건 초기화
- [x] ✅ 페이지 크기 변경 (10/20/50개씩)
- [x] ✅ 페이지네이션 (이전/다음/페이지 번호 클릭)
- [x] ✅ 테이블 행 더블클릭 시 상세 페이지 이동
- [x] ✅ 등록 버튼 클릭 시 등록 페이지 이동 (PageHeader actions slot으로 이동)
- [x] ✅ 로딩 상태 표시
- [x] ✅ 데이터 없을 때 메시지 표시
- [x] ✅ 영업상태별 badge 색상 표시
- [x] ✅ 수요기관 정보 표시 (조직명 + 코드)

### 코드 품질 체크리스트
- [x] ✅ 중복 코드 제거 완료
- [x] ✅ 공통 컴포넌트 사용 (PageHeader, Pagination)
- [x] ✅ 공통 composable 사용 (useDataTable)
- [x] ✅ 공통 utils 사용 (formatCurrency, formatDate from format.ts)
- [x] ✅ 공통 CSS 사용 (admin-common.css)
- [x] ✅ TypeScript 타입 오류 없음
- [x] ✅ 코드 가독성 향상
- [x] ✅ 유지보수성 향상

## 📈 결과

### Before
- **Total**: 880 lines
- Template: 190 lines (1-190)
- Script: 222 lines (192-413)
- Style: 465 lines (415-879)

### After
- **Total**: 327 lines
- Template: 169 lines (1-169)
- Script: 120 lines (171-290)
- Style: 36 lines (292-327)
- **Reduction**: 62.8% (553 lines removed)

### 제거된 코드 상세

#### Template 제거 (21 lines)
- 페이지 헤더 HTML (11 lines) → PageHeader 컴포넌트
- 페이지네이션 HTML (30 lines) → Pagination 컴포넌트
- 등록 버튼을 PageHeader actions slot으로 이동
- 테이블 정보 표시를 useDataTable의 변수로 교체

#### Script 제거 (102 lines)
- formatCurrency (4 lines) → utils/format.ts
- formatDate (4 lines) → utils/format.ts
- formatDateForApi 제거 (14 lines) - salesService가 내부적으로 처리
- 페이지네이션 변수 및 상태 관리 (10 lines) → useDataTable
- fetchSalesList 함수 (50 lines) → useDataTable의 fetchFunction
- changePage, changePageSize 함수 (10 lines) → useDataTable
- getPageNumbers 함수 (12 lines) → Pagination 컴포넌트
- API 연결 확인 로직 제거 (apiConnected 변수 제거)
- 미사용 함수 제거: editItem, deleteItem

#### Style 제거 (429 lines)
- 모든 공통 스타일을 admin-common.css로 이동
- 페이지 특화 스타일만 유지 (organization-info: 15 lines)

### 개선 사항
1. ✅ **PageHeader 컴포넌트**로 헤더 HTML 11 lines 제거 + 등록 버튼을 actions slot으로 통합
2. ✅ **Pagination 컴포넌트**로 페이지네이션 HTML 30 lines 제거
3. ✅ **utils/format.ts** 사용으로 formatCurrency, formatDate 8 lines 제거
4. ✅ **useDataTable composable**로 페이지네이션 로직 ~94 lines 제거
5. ✅ **admin-common.css** 사용으로 중복 스타일 ~429 lines 제거
6. ✅ **API 날짜 변환 로직 제거**: salesService.getSalesList()가 이미 날짜를 ISO 형식으로 변환하므로 중복 제거
7. ✅ **미사용 함수 제거**: editItem, deleteItem (commented out in template)

### 학습 포인트
1. **영업 목록 페이지는 발주 목록과 거의 동일한 패턴**
   - 동일한 리팩토링 패턴 적용
   - 일관성 있는 코드베이스 구축

2. **salesService의 날짜 변환 로직 활용**
   - formatDateForApi 함수가 불필요 (서비스 레이어에서 이미 처리)
   - 중복 로직 제거로 유지보수성 향상

3. **페이지 특화 스타일 식별**
   - organization-info 스타일만 유지 (수요기관 정보 표시용)
   - 나머지는 모두 admin-common.css로 통합

4. **등록 버튼 위치 개선**
   - 검색 섹션에서 PageHeader actions slot으로 이동
   - 더 직관적인 UI 구조

### 다음 단계
- **shipping/list.vue** 리팩토링 (출하 목록 페이지)
- **transport/list.vue** 리팩토링 (운송장 목록 페이지)
- 동일한 패턴 계속 적용하여 모든 list 페이지 리팩토링 완료
