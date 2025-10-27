# order/edit/[id].vue 리팩토링 체크리스트

## 📊 Before 분석

### 파일 크기
- **Total**: 1,557 lines
- **Template**: 350 lines (1-351)
- **Script**: 649 lines (353-1001)
- **Style**: 552 lines (1003-1556)

### 현재 구조
이 페이지는 **발주 수정 페이지**로 다음 기능을 수행:
1. **계약 정보 입력 폼** (30+ 필드): 계약번호, 계약일자, 수요기관 정보 등
2. **납품 목록 테이블**: 품목 추가/삭제, SKU 검색 팝업
3. **PDF 업로드 및 자동 데이터 추출**: 계약서 PDF 업로드 → 자동으로 폼 채우기
4. **금액 검증**: 계약금액 vs 납품목록 합산금액 불일치 알림
5. **CRUD 기능**: 발주 수정, 삭제

### 중복 코드 식별

#### 1. Template 중복 (~15 lines)

**PageHeader** (lines 4-17): 13 lines 제거 가능
```vue
<div class="page-header">
  <div class="header-content">
    <div>
      <h1 class="page-title">발주 수정</h1>
      <p class="page-description">발주 정보를 수정합니다.</p>
    </div>
    <div class="header-actions">
      <button class="btn-delete" @click="handleDelete">
        <i class="fas fa-trash"></i>
        삭제
      </button>
    </div>
  </div>
</div>
```
→ **대체**: `<PageHeader title="발주 수정" description="발주 정보를 수정합니다.">` + actions slot for 삭제 버튼

**Upload Status 컴포넌트** (lines 20-39): 20 lines 제거 가능
→ **대체**: 별도 `UploadStatus` 컴포넌트로 분리 가능 (선택사항)

**Alert Popup** (lines 335-343): 9 lines 제거 가능
→ **대체**: 별도 `AlertNotification` 컴포넌트로 분리 가능 (선택사항)

#### 2. Script 중복 (거의 없음)

이 페이지는 edit/register 페이지 특성상 **페이지 특화 로직이 대부분**:
- `fillFormWithExtractedData`: PDF 데이터 추출 및 폼 채우기 (페이지 특화)
- `checkAmountMismatch`: 금액 불일치 검증 (페이지 특화)
- `handleSkuSelected`: SKU 선택 처리 (페이지 특화)
- `calculateTotal`: 품목별 금액 계산 (페이지 특화)
- `save`: 발주 수정 로직 (페이지 특화)

**formatNumber** (line 831-833): 3 lines 제거 가능
```typescript
const formatNumber = (num: number) => {
  return num.toLocaleString()
}
```
→ **대체**: `import { formatNumber } from '~/utils/format'`

#### 3. Style 중복 (~450 lines)

**공통 스타일 이미 admin-common.css에 존재**:
- `.page-header`, `.header-content`, `.page-title`, `.page-description` (lines 1008-1034)
- `.form-input`, `.form-select` (lines 1174-1194)
- `.btn-primary`, `.btn-secondary`, `.btn-delete` (lines 1336-1389)
- `.data-table` 스타일 (lines 1237-1292)
- `.table-container` (lines 1231-1235)
- `.bottom-actions` (lines 1329-1334)

**페이지 특화 스타일 유지** (~100 lines):
- `.order-register` (lines 1004-1006) - 페이지 컨테이너
- `.upload-status` (lines 1036-1104) - PDF 업로드 상태 표시
- `.form-section`, `.form-header`, `.form-container`, `.form-grid` (lines 1113-1206) - 폼 레이아웃
- `.items-section`, `.section-header` (lines 1208-1229) - 품목 섹션 레이아웃
- `.summary-section`, `.summary-grid`, `.summary-item` (lines 1294-1327) - 합계 섹션
- `.input-group` (lines 1512-1519) - SKU 검색 버튼 그룹
- `.btn-search`, `.btn-search-sm` (lines 1521-1555) - 검색 버튼 스타일
- `.alert-popup`, `.alert-content` (lines 1397-1445) - 알림 팝업

### 계산된 중복량
- Template 중복: ~40 lines (PageHeader: 13, Upload Status: 20, Alert: 9 - 컴포넌트화 선택사항)
- Script 중복: ~3 lines (formatNumber만)
- Style 중복: ~450 lines
- **총 예상 제거**: ~493 lines
- **예상 결과**: 1,557 - 493 = **~1,064 lines (31.7% reduction)**

### 특이사항
1. **Master-Detail + Form 혼합**: 계약 정보 폼 + 납품 목록 테이블
2. **PDF 업로드 자동 추출**: `/admin/contract/upload-pdf` API 호출 후 폼 자동 채우기
3. **SKU 선택 팝업**: `ItemSkuSelector` 컴포넌트 사용
4. **실시간 금액 검증**: 계약금액과 납품목록 합산금액 비교
5. **FormData + Blob**: 파일과 JSON 데이터를 함께 전송
6. **초기 데이터 로드**: onMounted에서 orderId로 기존 발주 정보 로드
7. **삭제 기능**: PageHeader의 actions slot에 삭제 버튼 추가
8. **복잡한 폼 구조**: 30+ 입력 필드, 그리드 레이아웃 (one-third, half, two-thirds, full-width)

## 📝 작업 계획

### 주의사항
이 페이지는 **edit 페이지 특성상 페이지 특화 로직이 대부분**이므로:
1. **PageHeader 적용 가능** (삭제 버튼을 actions slot으로)
2. **formatNumber를 utils/format.ts에서 import**
3. **스타일 중복 제거만으로도 큰 효과**
4. **Template/Script 중복은 거의 없음** (페이지 특화 로직)

### Step 1: Template 리팩토링
- [x] ✅ PageHeader 컴포넌트로 교체 (삭제 버튼을 actions slot으로)
- [ ] (선택사항) UploadStatus를 별도 컴포넌트로 분리
- [ ] (선택사항) AlertNotification을 별도 컴포넌트로 분리

### Step 2: Script 리팩토링
- [x] ✅ formatNumber를 utils/format.ts에서 import
- [x] ✅ 기타 페이지 특화 로직 유지 (PDF 업로드, 금액 검증, SKU 선택)

### Step 3: Style 리팩토링
- [x] ✅ admin-common.css에 있는 모든 중복 스타일 제거
- [x] ✅ 페이지 특화 스타일만 유지:
  - `.order-register`
  - `.upload-status`, `.status-*`
  - `.form-section`, `.form-header`, `.form-container`, `.form-grid`
  - `.items-section`, `.section-header`
  - `.summary-section`, `.summary-grid`, `.summary-item`
  - `.input-group`, `.btn-search-sm`
  - `.alert-popup`, `.alert-content`

### Step 4: 동작 검증
- [x] ✅ 페이지 렌더링 확인
- [x] ✅ 기존 발주 정보 로드 확인
- [x] ✅ 계약 정보 폼 입력 확인
- [x] ✅ PDF 업로드 및 자동 채우기 확인
- [x] ✅ SKU 검색 팝업 동작 확인
- [x] ✅ 품목 추가/삭제 확인
- [x] ✅ 금액 자동 계산 확인
- [x] ✅ 금액 불일치 알림 확인
- [x] ✅ 발주 수정 확인
- [x] ✅ 발주 삭제 확인
- [x] ✅ 취소 버튼 확인

## ✅ After 검증

### 기능 검증 체크리스트
- [x] ✅ 페이지 로드 시 기존 발주 데이터 정상 로드
- [x] ✅ 계약 정보 폼 입력/수정 동작
- [x] ✅ PDF 업로드 버튼 동작
- [x] ✅ PDF 업로드 후 자동 데이터 추출 및 폼 채우기
- [x] ✅ 품목 추가 버튼 동작
- [x] ✅ SKU 검색 버튼 클릭 시 팝업 열기
- [x] ✅ SKU 선택 후 품목 정보 자동 입력
- [x] ✅ 수량 변경 시 금액 자동 계산
- [x] ✅ 품목 삭제 버튼 동작
- [x] ✅ 계약금액과 납품목록 합산금액 불일치 시 알림 표시
- [x] ✅ 저장 버튼 클릭 시 발주 수정
- [x] ✅ 삭제 버튼 클릭 시 발주 삭제 (PageHeader actions slot)
- [x] ✅ 취소 버튼 클릭 시 목록 페이지 이동
- [x] ✅ 로딩 상태 표시
- [x] ✅ 업로드 상태 표시 (로딩/성공/에러)

### 코드 품질 체크리스트
- [x] ✅ 중복 코드 제거 완료
- [x] ✅ 공통 컴포넌트 사용 (PageHeader)
- [x] ✅ 공통 utils 사용 (formatNumber from format.ts)
- [x] ✅ 공통 CSS 사용 (admin-common.css)
- [x] ✅ TypeScript 타입 오류 없음
- [x] ✅ 코드 가독성 향상
- [x] ✅ 유지보수성 향상

## 📈 결과

### Before
- **Total**: 1,557 lines
- Template: 350 lines (1-351)
- Script: 649 lines (353-1001)
- Style: 552 lines (1003-1556)

### After
- **Total**: 1,378 lines
- Template: 348 lines (1-348)
- Script: 647 lines (350-996)
- Style: 378 lines (999-1377)
- **Reduction**: 11.5% (179 lines removed)

### 제거된 코드 상세

#### Template 제거 (2 lines)
- 페이지 헤더 HTML (13 lines) → PageHeader 컴포넌트 (11 lines)

#### Script 제거 (2 lines)
- formatNumber (3 lines) → utils/format.ts import (1 line)

#### Style 제거 (174 lines)
- `.page-header`, `.header-content`, `.page-title`, `.page-description` 제거 → admin-common.css
- `.form-input`, `.form-select` 제거 (text-align: center만 유지)
- `.btn-primary`, `.btn-secondary`, `.btn-delete` 제거 → admin-common.css
- `.data-table`, `.table-container` 기본 스타일 제거 (최소 너비, 컬럼 너비만 유지)
- `.table-input` 제거 → admin-common.css
- `.bottom-actions` 제거 → admin-common.css
- `.btn-search` 제거 (btn-search-sm만 유지)

### 제한사항
이 페이지는 **edit 페이지 특성상**:
1. **복잡한 폼 구조**: 30+ 입력 필드, 다양한 그리드 레이아웃
2. **PDF 업로드 및 자동 추출**: 페이지 특화 기능
3. **실시간 금액 검증**: checkAmountMismatch 로직
4. **SKU 선택 팝업**: ItemSkuSelector 컴포넌트 통합
5. **FormData + Blob 전송**: 파일과 JSON 데이터 함께 전송

이러한 복잡한 구조로 인해 **스타일 중복 제거가 주요 효과**

### 개선 사항
1. ✅ **PageHeader 컴포넌트**로 헤더 HTML 13 lines → 11 lines (삭제 버튼을 actions slot으로)
2. ✅ **formatNumber를 utils/format.ts**에서 import (3 lines → 1 line)
3. ✅ **admin-common.css** 사용으로 중복 스타일 ~174 lines 제거
4. ✅ **페이지 특화 스타일 유지**: upload-status, form 레이아웃, summary, alert-popup, input-group, btn-search-sm

### 학습 포인트
- Edit 페이지에서 PageHeader 적용 (actions slot 활용)
- PDF 업로드 및 자동 데이터 추출 패턴
- FormData + Blob으로 파일과 JSON 데이터 함께 전송
- 실시간 금액 검증 및 알림 표시
- 복잡한 폼 레이아웃 (grid with one-third, half, two-thirds, full-width)
- **Edit 페이지는 페이지 특화 로직이 많아 주로 스타일 중복 제거가 효과적**

### 다음 단계
- 필요 시 UploadStatus를 별도 컴포넌트로 분리 (공통 사용 시)
- 필요 시 AlertNotification을 별도 컴포넌트로 분리 (공통 사용 시)
- order/register.vue도 유사한 구조이므로 동일한 패턴 적용 가능
