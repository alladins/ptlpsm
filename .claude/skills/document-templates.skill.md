---
description: |
  문서 생성을 위한 템플릿을 정의합니다.
  사용자 매뉴얼, API 문서, 상태 흐름도, 엔티티 문서 등
  다양한 문서 유형의 표준 템플릿을 제공합니다.
---

# Document Templates Skill

문서 생성 에이전트를 위한 템플릿 정의입니다.

---

## 1. 사용자 매뉴얼 템플릿

### 1.1 전체 구조

```markdown
# {{system.name}} 사용자 매뉴얼

> 버전: {{version}}
> 최종 수정일: {{generated_at}}

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [주요 기능](#2-주요-기능)
3. [업무 흐름](#3-업무-흐름)
4. [화면별 사용법](#4-화면별-사용법)
5. [부록](#5-부록)

---

## 1. 시스템 개요

### 1.1 시스템 소개
{{system.description}}

### 1.2 시스템 구성
{{#diagram type="entity_overview"}}

### 1.3 주요 용어

| 용어 | 설명 |
|------|------|
{{#each terminology}}
| {{korean}} | {{description}} |
{{/each}}

---

## 2. 주요 기능

{{#each entities}}
### 2.{{index}} {{korean}}관리
{{description}}

**주요 기능:**
{{#each features}}
- {{.}}
{{/each}}
{{/each}}

---

## 3. 업무 흐름

### 3.1 전체 업무 흐름도
{{#diagram type="main_workflow"}}

### 3.2 상세 흐름
{{#each workflows}}
#### {{name}}
{{#diagram type="workflow" data=this}}
{{/each}}

---

## 4. 화면별 사용법

{{#each pages}}
### 4.{{index}} {{korean}}
- **경로:** `{{path}}`
- **기능:** {{description}}

{{#if screenshot}}
![{{korean}} 화면]({{screenshot}})
{{/if}}

{{#if operations}}
**주요 작업:**
{{#each operations}}
1. {{.}}
{{/each}}
{{/if}}
{{/each}}

---

## 5. 부록

### 5.1 상태 코드
{{#each status_types}}
#### {{entity_korean}} 상태
| 코드 | 한글명 | 설명 |
|------|--------|------|
{{#each values}}
| {{value}} | {{korean}} | {{description}} |
{{/each}}
{{/each}}

### 5.2 오류 코드
(해당 시 작성)

---

*이 문서는 자동 생성되었습니다.*
```

---

## 2. 엔티티 문서 템플릿

### 2.1 개별 엔티티

```markdown
# {{korean}} ({{name}})

## 개요
{{description}}

---

## 필드 목록

| 필드명 | 타입 | 한글명 | 필수 | 설명 |
|--------|------|--------|:----:|------|
{{#each fields}}
| {{name}} | {{type}} | {{korean}} | {{#if required}}✓{{else}}-{{/if}} | {{description}} |
{{/each}}

---

{{#if status}}
## 상태 흐름

{{#diagram type="status_flow" entity=name}}

### 상태 정의

| 상태 | 한글명 | 설명 |
|------|--------|------|
{{#each status.values}}
| {{value}} | {{korean}} | {{description}} |
{{/each}}

### 상태 전이

| From | To | 트리거 | 조건 |
|------|-----|--------|------|
{{#each status.transitions}}
| {{from}} | {{to}} | {{trigger}} | {{condition}} |
{{/each}}

### 상태별 허용 작업

| 상태 | 수정 | 삭제 | 기타 |
|------|:----:|:----:|------|
{{#each status.values}}
| {{korean}} | {{#if allowed.edit}}✓{{else}}✗{{/if}} | {{#if allowed.delete}}✓{{else}}✗{{/if}} | {{allowed.others}} |
{{/each}}
{{/if}}

---

{{#if relationships}}
## 관계

| 대상 | 관계 | 설명 |
|------|------|------|
{{#each relationships}}
| {{target_korean}}({{target}}) | {{type}} | {{description}} |
{{/each}}
{{/if}}

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
{{#each api_endpoints}}
| {{method}} | {{path}} | {{action}} |
{{/each}}

---

## 화면

| 경로 | 화면명 |
|------|--------|
{{#each pages}}
| {{path}} | {{korean}} |
{{/each}}

---

{{#if business_rules}}
## 비즈니스 규칙

{{#each business_rules}}
### {{id}}: {{title}}
- **규칙:** {{rule}}
- **적용 시점:** {{enforcement}}
{{#if note}}
- **참고:** {{note}}
{{/if}}
{{/each}}
{{/if}}

---

*자동 생성됨 | 원본: {{source_file}}*
```

---

## 3. API 문서 템플릿

### 3.1 전체 구조

```markdown
# API 문서

## 개요
- **Base URL:** `{{base_url}}`
- **인증:** {{auth_method}}
- **버전:** {{version}}

---

## 공통 사항

### 인증 헤더
```
Authorization: Bearer {token}
```

### 페이징 응답 구조
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "number": 0,
  "size": 10
}
```

### 에러 응답 구조
```json
{
  "status": 400,
  "message": "에러 메시지",
  "timestamp": "2026-01-03T10:00:00"
}
```

---

{{#each api_groups}}
## {{korean}} API

### 개요
- **Base Path:** `{{base_path}}`
- **엔티티:** {{entity_korean}}({{entity}})

{{#each endpoints}}
### {{action}}

```
{{method}} {{path}}
```

{{#if description}}
{{description}}
{{/if}}

{{#if path_params}}
**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
{{#each path_params}}
| {{name}} | {{type}} | {{description}} |
{{/each}}
{{/if}}

{{#if query_params}}
**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|:----:|--------|------|
{{#each query_params}}
| {{name}} | {{type}} | {{#if required}}✓{{else}}-{{/if}} | {{default}} | {{description}} |
{{/each}}
{{/if}}

{{#if request_body}}
**Request Body:**

```json
{{request_body_example}}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
{{#each request_body.fields}}
| {{name}} | {{type}} | {{#if required}}✓{{else}}-{{/if}} | {{description}} |
{{/each}}
{{/if}}

{{#if response_example}}
**Response:**

```json
{{response_example}}
```
{{/if}}

---

{{/each}}
{{/each}}
```

---

## 4. 상태 흐름 다이어그램 템플릿

### 4.1 ASCII 다이어그램

```
{{#status_diagram entity}}
┌─────────────┐
│ {{state_1}} │ ◄─── 초기 상태
│ ({{korean}})│
└──────┬──────┘
       │
       │ {{trigger}}
       ▼
┌─────────────┐
│ {{state_2}} │
│ ({{korean}})│
└──────┬──────┘
       │
       │ {{trigger}}
       ▼
┌─────────────┐
│ {{state_3}} │ ─── 최종 상태
│ ({{korean}})│
└─────────────┘
{{/status_diagram}}
```

### 4.2 복잡한 흐름 (분기 포함)

```
                    ┌─────────────┐
                    │  {{start}}  │ ◄─── 초기
                    │ ({{korean}})│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │ {{condition_1}} │ {{condition_2}} │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ {{state_a}} │   │ {{state_b}} │   │ {{state_c}} │
└─────────────┘   └─────────────┘   └─────────────┘
```

### 4.3 Mermaid 다이어그램 (선택적)

```mermaid
stateDiagram-v2
    [*] --> {{initial_state}}
    {{#each transitions}}
    {{from}} --> {{to}}: {{trigger}}
    {{/each}}
    {{final_state}} --> [*]
```

---

## 5. 엔티티 관계 다이어그램 템플릿

### 5.1 계층 구조

```
{{root.korean}}({{root.name}})
    │
    ├─ 1:N → {{child1.korean}}({{child1.name}})
    │         │
    │         ├─ 1:1 → {{grandchild1.korean}}({{grandchild1.name}})
    │         │
    │         └─ 1:N → {{grandchild2.korean}}({{grandchild2.name}})
    │
    └─ 1:N → {{child2.korean}}({{child2.name}})
              │
              └─ 1:1 → {{grandchild3.korean}}({{grandchild3.name}})
```

### 5.2 표 형식

```markdown
| 부모 | 관계 | 자식 | 설명 |
|------|------|------|------|
{{#each relationships}}
| {{parent.korean}} | {{type}} | {{child.korean}} | {{description}} |
{{/each}}
```

---

## 6. 워크플로우 다이어그램 템플릿

### 6.1 순차 흐름

```
┌────────────────────────────────────────────────────────────────┐
│                        {{workflow.name}}                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ①{{step1.entity_korean}}     ②{{step2.entity_korean}}        │
│    {{step1.action}}     →       {{step2.action}}               │
│                                                                │
│  ③{{step3.entity_korean}}     ④{{step4.entity_korean}}        │
│    {{step3.action}}     →       {{step4.action}}               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 상세 단계

```markdown
### {{workflow.name}}

| 순서 | 엔티티 | 작업 | 설명 | 조건 |
|:----:|--------|------|------|------|
{{#each steps}}
| {{order}} | {{entity_korean}} | {{action}} | {{description}} | {{condition}} |
{{/each}}
```

---

## 7. 테이블 템플릿

### 7.1 필드 목록

```markdown
| 필드명 | 타입 | 한글명 | 필수 | 설명 |
|--------|------|--------|:----:|------|
{{#each fields}}
| `{{name}}` | `{{type}}` | {{korean}} | {{required_icon}} | {{description}} |
{{/each}}
```

### 7.2 상태 테이블

```markdown
| 상태 | 한글명 | 설명 | 허용 작업 |
|------|--------|------|----------|
{{#each states}}
| `{{value}}` | {{korean}} | {{description}} | {{allowed_actions}} |
{{/each}}
```

---

## 8. 변수 규칙

### 8.1 필수 아이콘

```
{{#if required}}✓{{else}}-{{/if}}
```

### 8.2 링크 형식

```markdown
[{{text}}]({{path}})
[{{entity.korean}}](#{{entity.anchor}})
```

### 8.3 날짜 형식

```
{{format_date generated_at "YYYY-MM-DD HH:mm"}}
```

---

## 9. 스타일 가이드

### 9.1 제목 계층

```
# H1 - 문서 제목 (문서당 1개)
## H2 - 주요 섹션
### H3 - 하위 섹션
#### H4 - 세부 항목
```

### 9.2 코드 블록

````markdown
```json
// JSON 예시
```

```typescript
// TypeScript 코드
```

```
// 다이어그램 (언어 없음)
```
````

### 9.3 용어 표기

- 한글 우선: `발주(Order)`
- 필드명: backtick 사용 `` `orderId` ``
- 경로: backtick 사용 `` `/admin/orders` ``

---

## 10. 출력 파일 명명 규칙

```yaml
naming:
  user_manual: "USER_MANUAL.md"
  api_documentation: "API_DOCUMENTATION.md"
  status_flows: "STATUS_FLOWS.md"
  business_rules: "BUSINESS_RULES.md"
  entity_relationships: "ENTITY_RELATIONSHIPS.md"
  entity_file: "entities/{EntityName}.md"  # PascalCase
  index: "index.md"
```
