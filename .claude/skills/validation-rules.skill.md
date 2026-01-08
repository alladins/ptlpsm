---
description: |
  문서 품질 검증을 위한 규칙을 정의합니다.
  완전성, 일관성, 정확성, 가독성 검사 규칙과
  자동 수정 가능 여부를 명시합니다.
---

# Validation Rules Skill

품질 검증 에이전트를 위한 검증 규칙 정의입니다.

---

## 1. 완전성 검사 규칙 (Completeness)

### 1.1 엔티티 문서 필수 요소

```yaml
entity_document:
  required_sections:
    - id: COMP-E001
      section: "## 개요"
      description: "엔티티 설명 필수"
      auto_fixable: false

    - id: COMP-E002
      section: "## 필드 목록"
      description: "필드 테이블 필수"
      auto_fixable: true
      fix_source: "synthesized-knowledge.yaml"

    - id: COMP-E003
      section: "## API 엔드포인트"
      description: "API 엔드포인트 테이블 필수"
      auto_fixable: true
      fix_source: "api-analysis.yaml"

  conditional_sections:
    - id: COMP-E004
      section: "## 상태 흐름"
      condition: "entity has status field"
      auto_fixable: true
      fix_source: "status-mappings.yaml"

    - id: COMP-E005
      section: "## 관계"
      condition: "entity has relationships"
      auto_fixable: true
      fix_source: "domain-rules.yaml"

  field_table_columns:
    required:
      - "필드명"
      - "타입"
      - "한글명"
    optional:
      - "필수"
      - "설명"
```

### 1.2 API 문서 필수 요소

```yaml
api_document:
  per_endpoint:
    - id: COMP-A001
      element: "method"
      description: "HTTP 메서드 필수"
      auto_fixable: true

    - id: COMP-A002
      element: "path"
      description: "API 경로 필수"
      auto_fixable: true

    - id: COMP-A003
      element: "korean_description"
      description: "한글 설명 필수"
      auto_fixable: true
      fix_source: "terminology.yaml"

  conditional:
    - id: COMP-A004
      element: "parameters"
      condition: "has query or path params"
      auto_fixable: true

    - id: COMP-A005
      element: "request_body"
      condition: "method is POST or PUT"
      auto_fixable: true
```

### 1.3 사용자 매뉴얼 필수 요소

```yaml
user_manual:
  required_sections:
    - "## 1. 시스템 개요"
    - "## 2. 주요 기능"
    - "## 3. 업무 흐름"
    - "## 4. 화면별 사용법"

  optional_sections:
    - "## 5. 부록"
    - "## FAQ"
```

---

## 2. 일관성 검사 규칙 (Consistency)

### 2.1 용어 일관성

```yaml
terminology:
  - id: CONS-T001
    rule: "모든 엔티티명은 terminology.yaml의 한글 번역 사용"
    check: "entity_korean matches terminology.yaml"
    auto_fixable: true
    fix_action: "replace with terminology.yaml value"

  - id: CONS-T002
    rule: "영한 혼용 금지 (한글 또는 '한글(영문)' 형식)"
    check: "no standalone English for defined terms"
    auto_fixable: true
    fix_action: "convert to '한글(영문)' format"

  - id: CONS-T003
    rule: "동사형 대신 명사형 사용 (삭제하다 → 삭제)"
    check: "actions use noun form"
    auto_fixable: true
    fix_action: "convert verb to noun form"

examples:
  wrong:
    - "Order 목록"      # → "발주(Order) 목록"
    - "삭제하다"        # → "삭제"
    - "Delete"          # → "삭제"
  correct:
    - "발주(Order) 목록"
    - "삭제"
    - "발주 삭제"
```

### 2.2 포맷 일관성

```yaml
formatting:
  headers:
    - id: CONS-F001
      rule: "H1은 문서당 1개만"
      auto_fixable: false

    - id: CONS-F002
      rule: "제목 계층 순서 준수 (H1→H2→H3)"
      auto_fixable: false

  tables:
    - id: CONS-F003
      rule: "테이블 구분선 형식 통일 (|---|)"
      auto_fixable: true

    - id: CONS-F004
      rule: "필수 여부 아이콘 통일 (✓/-, ✓/✗)"
      auto_fixable: true

  code_blocks:
    - id: CONS-F005
      rule: "언어 명시 필수 (json, typescript 등)"
      auto_fixable: false

    - id: CONS-F006
      rule: "들여쓰기 2칸 통일"
      auto_fixable: true
```

### 2.3 구조 일관성

```yaml
structure:
  - id: CONS-S001
    rule: "엔티티 문서 섹션 순서 통일"
    expected_order:
      - "개요"
      - "필드 목록"
      - "상태 흐름"
      - "관계"
      - "API 엔드포인트"
      - "화면"
      - "비즈니스 규칙"
    auto_fixable: true

  - id: CONS-S002
    rule: "파일 명명 규칙 (PascalCase for entities)"
    pattern: "[A-Z][a-zA-Z]+\\.md"
    auto_fixable: true
```

---

## 3. 정확성 검사 규칙 (Accuracy)

### 3.1 상태 값 검증

```yaml
status_accuracy:
  - id: ACC-S001
    rule: "문서화된 상태 값이 status-mappings.yaml에 존재"
    source: ".claude/knowledge-base/status-mappings.yaml"
    auto_fixable: true
    fix_action: "add missing states or remove invalid ones"

  - id: ACC-S002
    rule: "상태 한글명이 status-mappings.yaml과 일치"
    auto_fixable: true

  - id: ACC-S003
    rule: "상태 전이 규칙이 status-mappings.yaml과 일치"
    auto_fixable: true
```

### 3.2 API 정확성

```yaml
api_accuracy:
  - id: ACC-A001
    rule: "문서화된 API 경로가 endpoint 파일에 존재"
    source: "services/api/endpoints/**/*.ts"
    auto_fixable: true

  - id: ACC-A002
    rule: "HTTP 메서드가 서비스 코드와 일치"
    source: "services/*.service.ts"
    auto_fixable: true

  - id: ACC-A003
    rule: "파라미터 목록이 코드와 일치"
    auto_fixable: true
```

### 3.3 필드 정확성

```yaml
field_accuracy:
  - id: ACC-F001
    rule: "필드 타입이 types/*.ts 정의와 일치"
    source: "types/**/*.ts"
    auto_fixable: true

  - id: ACC-F002
    rule: "필드 한글명이 terminology.yaml과 일치"
    source: ".claude/knowledge-base/terminology.yaml"
    auto_fixable: true
```

### 3.4 비즈니스 규칙 정확성

```yaml
business_rule_accuracy:
  - id: ACC-B001
    rule: "비즈니스 규칙이 domain-rules.yaml에 정의됨"
    source: ".claude/knowledge-base/domain-rules.yaml"
    auto_fixable: false
    note: "도메인 전문 지식 필요"
```

---

## 4. 가독성 검사 규칙 (Readability)

### 4.1 링크 유효성

```yaml
links:
  - id: READ-L001
    rule: "내부 링크 대상 존재 확인"
    pattern: "\\[([^\\]]+)\\]\\(#([^)]+)\\)"
    auto_fixable: false

  - id: READ-L002
    rule: "파일 링크 대상 존재 확인"
    pattern: "\\[([^\\]]+)\\]\\(([^#)]+\\.md)\\)"
    auto_fixable: false
```

### 4.2 다이어그램 가독성

```yaml
diagrams:
  - id: READ-D001
    rule: "ASCII 다이어그램 80자 너비 이하"
    max_width: 80
    auto_fixable: false
    suggestion: "다이어그램 분할 또는 축소"

  - id: READ-D002
    rule: "상태 흐름도 명확한 방향성"
    auto_fixable: false
```

### 4.3 논리적 구조

```yaml
structure:
  - id: READ-S001
    rule: "고아 섹션 없음 (상위 섹션 없는 하위 섹션)"
    auto_fixable: false

  - id: READ-S002
    rule: "빈 섹션 없음"
    auto_fixable: true
    fix_action: "remove empty section or add placeholder"

  - id: READ-S003
    rule: "적절한 상세 수준 (너무 간략하거나 상세하지 않음)"
    auto_fixable: false
    note: "수동 검토 필요"
```

---

## 5. 심각도 정의

```yaml
severity_levels:
  ERROR:
    description: "필수 요소 누락 또는 심각한 오류"
    blocks_release: true
    examples:
      - "엔티티 문서 누락"
      - "API 경로 불일치"
      - "상태 정의 누락"

  WARNING:
    description: "권장 사항 위반 또는 개선 필요"
    blocks_release: false
    examples:
      - "용어 불일치"
      - "포맷 불일치"
      - "선택 섹션 누락"

  INFO:
    description: "정보성 메시지 또는 제안"
    blocks_release: false
    examples:
      - "스크린샷 추가 권장"
      - "예시 추가 권장"
```

---

## 6. 자동 수정 규칙

### 6.1 수정 가능 항목

```yaml
auto_fixable:
  terminology:
    - pattern: "standalone English entity name"
      action: "lookup terminology.yaml and replace"
      example:
        before: "Order 목록"
        after: "발주(Order) 목록"

  formatting:
    - pattern: "inconsistent table separator"
      action: "normalize to |---|"

    - pattern: "inconsistent required icon"
      action: "normalize to ✓ for required, - for optional"

  missing_content:
    - pattern: "missing status flow for status entity"
      action: "generate from status-mappings.yaml"
      template: "status_flow_template"

    - pattern: "missing API endpoint"
      action: "generate from api-analysis.yaml"
      template: "api_endpoint_template"
```

### 6.2 수동 필요 항목

```yaml
manual_required:
  - category: "screenshots"
    reason: "UI 캡처 필요"

  - category: "user_scenarios"
    reason: "실제 사용 시나리오 작성 필요"

  - category: "complex_diagrams"
    reason: "복잡한 다이어그램 수동 조정"

  - category: "domain_specific"
    reason: "도메인 전문 지식 필요"
```

---

## 7. 품질 점수 계산

```yaml
scoring:
  weights:
    completeness: 0.30
    consistency: 0.25
    accuracy: 0.30
    readability: 0.15

  calculation:
    per_category:
      passed: +1
      warning: +0.5
      error: 0

    formula: "(sum of scores / max possible) * 100"

  thresholds:
    excellent: 95
    good: 85
    acceptable: 70
    needs_improvement: 0  # below 70

  grade_labels:
    excellent: "우수"
    good: "양호"
    acceptable: "보통"
    needs_improvement: "개선 필요"
```

---

## 8. 검증 보고서 형식

```yaml
report_structure:
  summary:
    - total_checks
    - passed
    - warnings
    - errors
    - quality_score

  issues:
    format:
      - id: "VAL-{category}-{number}"
      - severity: "ERROR | WARNING | INFO"
      - category: "completeness | consistency | accuracy | readability"
      - document: "file path"
      - section: "section name (if applicable)"
      - location: "line number (if applicable)"
      - message: "issue description"
      - source_reference: "source file for verification"
      - suggestion: "how to fix"
      - auto_fixable: "true | false"

  recommendations:
    priority_levels:
      - high_priority
      - medium_priority
      - low_priority

  next_steps:
    categories:
      - auto_fixable
      - manual_required
```

---

## 9. 검증 제외 규칙

```yaml
exclusions:
  files:
    - "docs/generated/index.md"  # 목차 파일

  sections:
    - "자동 생성됨"  # 메타 정보

  patterns:
    - "\\(향후 작성\\)"  # 계획된 콘텐츠
    - "\\(TBD\\)"
```
