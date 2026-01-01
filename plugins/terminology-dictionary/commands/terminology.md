---
description: 프로젝트의 표준 용어 사전을 생성합니다. 형식(markdown/json)과 도메인 지정 가능
argument-hint: [format] [domain]
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# /terminology 명령어

프로젝트 코드베이스를 분석하여 **표준 용어 사전**을 생성합니다.

## 인수

- `$1` (format): 출력 형식
  - `markdown` (기본값): Markdown 테이블 형식
  - `json`: JSON 구조화 형식
  - `csv`: Excel 호환 CSV 형식

- `$2` (domain): 특정 도메인만 분석
  - `all` (기본값): 전체 도메인
  - `order`: 발주관리
  - `shipping`: 출하관리
  - `delivery`: 납품관리
  - `fund`: 자금관리
  - `baseline`: 기초정보
  - `system`: 시스템

## 실행 단계

### 1. 프로젝트 구조 분석

```bash
# 타입 파일 확인
Glob("types/**/*.ts")

# 컴포넌트 확인
Glob("components/**/*.vue")
Glob("pages/**/*.vue")

# 서비스 확인
Glob("services/**/*.ts")
```

### 2. 용어 추출

**타입 정의에서 추출:**
- interface/type 필드명
- enum 값
- JSDoc 한국어 주석

**Vue 컴포넌트에서 추출:**
- `<label>`, `<th>`, `<button>` 텍스트
- placeholder, title 속성
- 알림/에러 메시지

**서비스에서 추출:**
- 함수명 (getXxx, createXxx 등)
- API 엔드포인트

### 3. 용어 정규화

- camelCase → 한국어 변환
- 동의어 통합
- 도메인 분류
- 중복 제거

### 4. 문서 생성

형식에 따라 `docs/TERMINOLOGY.[md|json|csv]` 파일 생성

## 출력 예시

### Markdown 형식 (`/terminology markdown`)

```markdown
# 표준 용어 사전

생성일: 2024-01-01
프로젝트: PTLPSM

## 발주관리 (Order)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 발주 | Order | order | 물품 구매 요청 |
| 납품요구 | Delivery Request | deliveryRequest | 발주 물품의 납품 요청 |
```

### JSON 형식 (`/terminology json`)

```json
{
  "version": "1.0.0",
  "generated": "2024-01-01T00:00:00Z",
  "terms": [
    {
      "korean": "발주",
      "english": "Order",
      "codeVariables": ["order"],
      "domain": "order",
      "definition": "물품 구매 요청"
    }
  ]
}
```

## 사용 예시

```bash
/terminology                    # 전체, Markdown 형식
/terminology json              # 전체, JSON 형식
/terminology markdown shipping # 출하관리만, Markdown 형식
/terminology csv all           # 전체, CSV 형식
```
