---
description: 특정 문서 섹션만 생성합니다. 전체 생성 없이 부분 업데이트 시 사용합니다.
argument-hint: <section-type> [entity-name]
allowed-tools: Read, Write, Edit, Grep, Glob, Task
---

# /generate-section 커맨드

특정 문서 섹션만 생성하거나 재생성합니다.

## 사용법

```bash
/generate-section entity Order      # Order 엔티티 문서만 생성
/generate-section entity            # 모든 엔티티 문서 재생성
/generate-section api               # API 문서 재생성
/generate-section api shipment      # Shipment API만 재생성
/generate-section flow              # 모든 상태 흐름도 재생성
/generate-section flow Order        # Order 상태 흐름도만 재생성
/generate-section rules             # 비즈니스 규칙 문서 재생성
/generate-section workflow          # 워크플로우 문서 재생성
```

## 인자

- `$1` (section-type): **필수**
  - `entity`: 엔티티 문서
  - `api`: API 문서
  - `flow`: 상태 흐름도
  - `rules`: 비즈니스 규칙
  - `workflow`: 워크플로우 문서
  - `manual`: 사용자 매뉴얼 목차

- `$2` (entity-name): **선택**
  - 특정 엔티티/그룹 지정
  - 생략 시 해당 섹션 전체

---

## 섹션별 상세

### 1. entity - 엔티티 문서

**생성 파일:** `docs/generated/entities/{EntityName}.md`

**포함 내용:**
- 개요
- 필드 목록
- 상태 흐름 (해당 시)
- 관계
- API 엔드포인트
- 화면
- 비즈니스 규칙

**예시:**
```bash
/generate-section entity Order      # → entities/Order.md
/generate-section entity Shipment   # → entities/Shipment.md
/generate-section entity            # → entities/*.md (전체)
```

### 2. api - API 문서

**생성 파일:** `docs/generated/API_DOCUMENTATION.md`

**포함 내용:**
- 개요 (Base URL, 인증)
- 공통 사항 (페이징, 에러)
- 그룹별 엔드포인트

**예시:**
```bash
/generate-section api               # 전체 API 문서
/generate-section api order         # Order 관련 API만
/generate-section api shipment      # Shipment 관련 API만
```

### 3. flow - 상태 흐름도

**생성 파일:** `docs/generated/STATUS_FLOWS.md`

**포함 내용:**
- 엔티티별 상태 다이어그램
- 상태 정의 테이블
- 상태 전이 규칙

**예시:**
```bash
/generate-section flow              # 모든 상태 흐름
/generate-section flow Order        # Order 상태만
/generate-section flow Baseline     # Baseline 서명 흐름
```

### 4. rules - 비즈니스 규칙

**생성 파일:** `docs/generated/BUSINESS_RULES.md`

**포함 내용:**
- 수량 규칙
- 상태 규칙
- 자금 규칙
- 서명 규칙

**예시:**
```bash
/generate-section rules             # 모든 비즈니스 규칙
```

### 5. workflow - 워크플로우

**생성 파일:** `docs/generated/USER_MANUAL.md` 내 워크플로우 섹션

**포함 내용:**
- 메인 업무 흐름
- 자금 흐름
- 서명 흐름

**예시:**
```bash
/generate-section workflow          # 모든 워크플로우
```

### 6. manual - 사용자 매뉴얼

**생성 파일:** `docs/generated/USER_MANUAL.md`

**포함 내용:**
- 목차
- 시스템 개요
- 주요 기능
- 업무 흐름

**예시:**
```bash
/generate-section manual            # 매뉴얼 전체 재생성
```

---

## 실행 흐름

```
/generate-section entity Order
    │
    ├── 1. synthesized-knowledge.yaml 로드
    │       (없으면 분석 먼저 실행)
    │
    ├── 2. Order 엔티티 데이터 추출
    │
    ├── 3. 엔티티 템플릿 적용
    │
    ├── 4. entities/Order.md 생성
    │
    └── 5. index.md 업데이트
```

---

## 의존성 확인

섹션 생성 전 다음 파일이 필요합니다:

```yaml
required_files:
  entity:
    - .claude/shared/data/synthesized-knowledge.yaml
    - .claude/knowledge-base/terminology.yaml

  api:
    - .claude/shared/data/synthesized-knowledge.yaml
    - .claude/shared/data/api-analysis.yaml

  flow:
    - .claude/knowledge-base/status-mappings.yaml

  rules:
    - .claude/knowledge-base/domain-rules.yaml

  workflow:
    - .claude/knowledge-base/domain-rules.yaml
```

**파일 없을 경우:**
```bash
# 분석 먼저 실행
/analyze-codebase

# 또는 전체 생성
/generate-manual
```

---

## 출력 예시

### 엔티티 생성

```
📝 엔티티 문서 생성: Order

✓ synthesized-knowledge.yaml 로드됨
✓ Order 엔티티 데이터 추출
  - 8개 필드
  - 3개 상태
  - 5개 API 엔드포인트
  - 3개 관련 페이지
  - 2개 비즈니스 규칙

✓ 템플릿 적용됨
✓ entities/Order.md 생성됨 (120 lines)
✓ index.md 업데이트됨
```

### API 섹션 재생성

```
📝 API 문서 재생성

✓ api-analysis.yaml 로드됨
✓ 45개 엔드포인트 처리
  - order: 5개
  - shipment: 6개
  - delivery: 4개
  - ...

✓ API_DOCUMENTATION.md 생성됨 (280 lines)
```

### 상태 흐름 생성

```
📝 상태 흐름도 생성: Baseline

✓ status-mappings.yaml 로드됨
✓ Baseline 상태 정의 추출
  - 6개 상태
  - 5개 전이

✓ ASCII 다이어그램 생성됨
✓ STATUS_FLOWS.md 업데이트됨
```

---

## 부분 업데이트 시나리오

### 시나리오 1: 엔티티 필드 변경

```bash
# types/order.ts 수정 후

# 1. 프론트엔드만 재분석
/analyze-codebase frontend

# 2. Order 엔티티 문서만 재생성
/generate-section entity Order

# 3. 검증
/validate-docs
```

### 시나리오 2: 새 API 추가

```bash
# services/api/endpoints/order.endpoints.ts 수정 후

# 1. API만 재분석
/analyze-codebase api

# 2. API 문서 재생성
/generate-section api order

# 3. 검증
/validate-docs
```

### 시나리오 3: 상태 정의 변경

```bash
# status-mappings.yaml 수정 후

# 1. 해당 상태 흐름만 재생성
/generate-section flow Baseline

# 2. 엔티티 문서도 업데이트
/generate-section entity Baseline

# 3. 검증
/validate-docs
```

---

## 에러 처리

```yaml
errors:
  missing_source:
    message: "소스 데이터를 찾을 수 없습니다"
    action: "/analyze-codebase 먼저 실행"

  invalid_section:
    message: "알 수 없는 섹션 유형"
    valid_values: [entity, api, flow, rules, workflow, manual]

  entity_not_found:
    message: "엔티티를 찾을 수 없습니다"
    action: "엔티티 이름 확인 (PascalCase)"
```

---

## 관련 커맨드

- `/generate-manual` - 전체 문서 생성
- `/analyze-codebase` - 코드베이스 분석
- `/validate-docs` - 문서 검증
