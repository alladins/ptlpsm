---
description: 코드베이스를 분석하여 엔티티, API, 상태 정보를 추출합니다. 문서 생성 없이 분석만 수행합니다.
argument-hint: [analyzer-type]
allowed-tools: Read, Grep, Glob, Task
---

# /analyze-codebase 커맨드

코드베이스 분석만 수행합니다. 문서 생성 없이 분석 결과만 확인할 때 사용합니다.

## 사용법

```bash
/analyze-codebase              # 모든 분석기 실행
/analyze-codebase frontend     # 프론트엔드만 분석
/analyze-codebase api          # API 엔드포인트만 분석
/analyze-codebase backend      # 백엔드 분석 (스텁)
/analyze-codebase database     # 데이터베이스 분석 (스텁)
```

## 인자

- `$1` (analyzer-type):
  - `all` (기본값): 모든 분석기 실행
  - `frontend`: 프론트엔드 코드만 분석
  - `api`: API 엔드포인트만 분석
  - `backend`: 백엔드 분석 (스텁 모드)
  - `database`: 데이터베이스 분석 (스텁 모드)

---

## 분석기 상세

### 1. Frontend Analyzer

**분석 대상:**
```
types/**/*.ts        → 타입/인터페이스 정의
pages/**/*.vue       → 페이지 구조
components/**/*.vue  → 컴포넌트 계층
stores/**/*.ts       → 상태 관리
composables/**/*.ts  → 공유 로직
```

**추출 정보:**
- 엔티티 정의 (인터페이스, 타입)
- 필드 목록 및 타입
- 상태 타입 (enum, union type)
- 페이지 라우팅 구조
- 컴포넌트 Props/Emits
- UI 텍스트 레이블

**출력:** `.claude/shared/data/frontend-analysis.yaml`

### 2. API Analyzer

**분석 대상:**
```
services/api/endpoints/**/*.ts  → 엔드포인트 정의
services/*.service.ts           → 서비스 메서드
```

**추출 정보:**
- API 엔드포인트 (경로, 메서드)
- Request/Response 타입
- Query/Path 파라미터
- HTTP 메서드 추론

**출력:** `.claude/shared/data/api-analysis.yaml`

### 3. Backend Analyzer (스텁)

**현재 상태:** 스텁 모드 (백엔드 별도 저장소)

**Fallback 소스:**
- `.claude/knowledge-base/domain-rules.yaml`
- `.claude/knowledge-base/status-mappings.yaml`

**출력:** `.claude/shared/data/backend-analysis.yaml`

### 4. Database Analyzer (스텁)

**현재 상태:** 스텁 모드 (DB 직접 접근 불가)

**Fallback 소스:**
- `.claude/knowledge-base/terminology.yaml`
- 프론트엔드 타입 정의에서 추론

**출력:** `.claude/shared/data/database-analysis.yaml`

---

## 출력 형식

### 프론트엔드 분석 결과 예시

```yaml
# frontend-analysis.yaml
generated_at: "2026-01-03T10:00:00Z"
analyzer: "frontend-analyzer"

entities:
  Order:
    source_file: "types/order.ts"
    korean: "발주"
    fields:
      - name: orderId
        type: number
        korean: "발주ID"
      - name: status
        type: OrderStatus
        korean: "상태"

pages:
  - path: "/admin/order/list"
    file: "pages/admin/order/list.vue"
    korean: "발주 목록"

components:
  - name: "OrderSelectPopup"
    file: "components/admin/common/OrderSelectPopup.vue"
    props: ["visible", "selectedIds"]
```

### API 분석 결과 예시

```yaml
# api-analysis.yaml
generated_at: "2026-01-03T10:00:00Z"
analyzer: "api-analyzer"

api_groups:
  order:
    base_path: "/admin/orders"
    korean: "발주 관리"
    endpoints:
      - method: GET
        path: "/admin/orders"
        action: "목록 조회"
      - method: POST
        path: "/admin/orders"
        action: "등록"
```

---

## 실행 흐름

```
/analyze-codebase
    │
    ├── [frontend] → frontend-analyzer
    │                 └── frontend-analysis.yaml
    │
    ├── [api] → api-analyzer
    │            └── api-analysis.yaml
    │
    ├── [backend] → backend-analyzer (stub)
    │                └── backend-analysis.yaml
    │
    └── [database] → database-analyzer (stub)
                      └── database-analysis.yaml
```

---

## 출력 예시

### 전체 분석

```
🔍 코드베이스 분석 시작...

Frontend Analyzer:
✓ 15개 엔티티 발견
  - Order, Shipment, Transport, Delivery...
✓ 55개 페이지 분석
  - /admin/order/*, /admin/shipping/*...
✓ 120개 컴포넌트 스캔
✓ 450개 UI 텍스트 추출

API Analyzer:
✓ 45개 엔드포인트 발견
  - GET /admin/orders (목록 조회)
  - POST /admin/orders (등록)
  - ...

Backend Analyzer:
ℹ️ 스텁 모드 - knowledge-base 참조
✓ 15개 엔티티 추론
✓ 6개 관계 정의 로드

Database Analyzer:
ℹ️ 스텁 모드 - terminology.yaml 참조
✓ 15개 테이블 추론

📁 분석 결과 저장됨:
  - .claude/shared/data/frontend-analysis.yaml
  - .claude/shared/data/api-analysis.yaml
  - .claude/shared/data/backend-analysis.yaml
  - .claude/shared/data/database-analysis.yaml
```

### 특정 분석기만

```
/analyze-codebase frontend

🔍 프론트엔드 분석 시작...

✓ types/**/*.ts 분석 완료
  - 15개 인터페이스
  - 8개 상태 타입 (enum)

✓ pages/**/*.vue 분석 완료
  - 55개 페이지
  - 라우트 계층 구조 추출

✓ components/**/*.vue 분석 완료
  - 120개 컴포넌트
  - props/emits 정의 추출

📁 결과: .claude/shared/data/frontend-analysis.yaml
```

---

## 분석 결과 활용

분석 완료 후:

1. **결과 확인:**
   ```bash
   cat .claude/shared/data/frontend-analysis.yaml
   ```

2. **문서 생성 진행:**
   ```bash
   /generate-manual
   ```

3. **특정 섹션만 생성:**
   ```bash
   /generate-section entity Order
   ```

---

## 에러 처리

```yaml
errors:
  no_source_files:
    message: "분석 대상 파일을 찾을 수 없습니다"
    action: "파일 경로 확인"

  parse_error:
    message: "파일 파싱 실패"
    action: "TypeScript/Vue 구문 오류 확인"

  knowledge_base_missing:
    message: "Knowledge Base 파일 누락 (스텁 모드용)"
    action: "terminology.yaml 등 생성"
```

---

## 관련 커맨드

- `/generate-manual` - 전체 문서 생성
- `/generate-section` - 특정 섹션 생성
- `/validate-docs` - 문서 검증
