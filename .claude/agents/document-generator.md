---
name: document-generator
description: |
  합성된 지식 모델에서 문서를 생성합니다.
  다양한 문서 유형을 생성합니다:
  - 사용자 매뉴얼 (Markdown)
  - API 문서
  - 엔티티 다이어그램 (ASCII/Mermaid)
  - 상태 흐름도
  - 비즈니스 규칙 문서
tools: Read, Write, Edit, Glob
model: opus
when_to_use: |
  Knowledge Synthesizer 완료 후 자동 호출됩니다.
  통합된 지식을 문서 형태로 변환합니다.
---

# Document Generator Agent

합성된 지식 모델에서 종합적인 문서를 생성합니다.

## 미션

합성된 지식을 잘 구조화되고 사용자 친화적인 문서로 변환합니다.

---

## 입력

**입력 경로:** `.claude/shared/data/synthesized-knowledge.yaml`

---

## 출력 문서

### 1. 사용자 매뉴얼 (docs/generated/USER_MANUAL.md)

```markdown
# 출하관리시스템 사용자 매뉴얼

## 목차
1. [시스템 개요](#1-시스템-개요)
2. [주요 기능](#2-주요-기능)
3. [업무 흐름](#3-업무-흐름)
4. [화면별 사용법](#4-화면별-사용법)
5. [부록](#5-부록)

---

## 1. 시스템 개요

### 1.1 시스템 구조
공공조달 물류/출하 관리를 위한 웹 기반 시스템입니다.

### 1.2 엔티티 관계도

```
발주(Order)
    │
    ├─ 1:N → 출하(Shipment)
    │           │
    │           ├─ 1:1 → 운송(Transport)
    │           │
    │           └─ 1:N → 납품확인(Delivery)
    │
    └─ 1:N → 기성차수(Baseline)
                │
                └─ 1:1 → 자금(Fund)
```

### 1.3 주요 용어 설명

| 용어 | 설명 |
|------|------|
| 발주 | 공공조달 계약에 따른 물품 납품 요청 단위 |
| 출하 | 창고에서 현장으로 물품을 보내는 단위 |
| 기성차수 | 공사/납품 진행률에 따른 대금 청구 단위 |

---

## 2. 주요 기능

### 2.1 발주관리
- 발주 목록 조회
- 발주 등록/수정/삭제
- 발주 상태 관리 (진행중 → 완료/취소)

### 2.2 출하관리
...
```

### 2. 엔티티 문서 (docs/generated/entities/*.md)

**예시: docs/generated/entities/Order.md**

```markdown
# 발주 (Order)

## 개요
공공조달 계약에 따른 물품 납품 요청 단위입니다.

---

## 필드 목록

| 필드명 | 타입 | 한글명 | 필수 | 설명 |
|--------|------|--------|------|------|
| orderId | number | 발주ID | ✓ | 기본키 |
| deliveryRequestNo | string | 납품요구번호 | ✓ | 고유값 |
| itemId | number | 품목ID | ✓ | 품목 참조 |
| quantity | number | 수량 | ✓ | 1 이상 |
| status | OrderStatus | 상태 | ✓ | 발주 상태 |
| createdAt | datetime | 등록일시 | ✓ | 자동 생성 |

---

## 상태 흐름

```
┌─────────────┐      모든 출하 완료      ┌─────────────┐
│   ACTIVE    │ ────────────────────────→ │  COMPLETED  │
│  (진행중)   │                          │   (완료)    │
└──────┬──────┘                          └─────────────┘
       │
       │ 사용자 취소 (출하 없음)
       │
       ▼
┌─────────────┐
│  CANCELLED  │
│   (취소)    │
└─────────────┘
```

### 상태별 허용 작업

| 상태 | 수정 | 삭제 | 출하등록 |
|------|:----:|:----:|:--------:|
| 진행중 | ✓ | ✓ | ✓ |
| 완료 | ✗ | ✗ | ✗ |
| 취소 | ✗ | ✗ | ✗ |

---

## 관계

| 대상 | 관계 | 설명 |
|------|------|------|
| Shipment | 1:N | 발주 1건에 여러 번 분할 출하 |
| Item | N:1 | 품목 참조 |
| Baseline | 1:N | 기성금 청구 |

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /admin/orders | 목록 조회 |
| GET | /admin/orders/{orderId} | 상세 조회 |
| POST | /admin/orders | 등록 |
| PUT | /admin/orders/{orderId} | 수정 |
| DELETE | /admin/orders/{orderId} | 삭제 |

---

## 화면

| 경로 | 화면명 |
|------|--------|
| /admin/order/list | 발주 목록 |
| /admin/order/register | 발주 등록 |
| /admin/order/edit/{id} | 발주 수정 |

---

## 비즈니스 규칙

1. **납품요구번호 중복 불가**
   - 동일한 납품요구번호로 발주 등록 불가

2. **수량 제약**
   - 출하 수량 합계는 발주 수량을 초과할 수 없음

3. **상태 전이**
   - 모든 출하가 완료되면 자동으로 완료 상태로 전환
```

### 3. API 문서 (docs/generated/API_DOCUMENTATION.md)

```markdown
# API 문서

## 개요
- **Base URL:** `/api`
- **인증:** Bearer Token
- **페이징:** Spring Page 형식 (0-indexed)

---

## 발주 관리 API

### 목록 조회

```
GET /admin/orders
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|:----:|--------|------|
| page | number | N | 0 | 페이지 번호 (0부터) |
| size | number | N | 10 | 페이지 크기 |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |

**Response:**

```json
{
  "content": [
    {
      "orderId": 1,
      "deliveryRequestNo": "DR-2026-001",
      "status": "ACTIVE",
      "quantity": 100,
      "createdAt": "2026-01-03T10:00:00"
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "number": 0,
  "size": 10
}
```

### 상세 조회

```
GET /admin/orders/{orderId}
```

**Path Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| orderId | number | 발주 ID |

### 등록

```
POST /admin/orders
```

**Request Body:**

```json
{
  "deliveryRequestNo": "DR-2026-002",
  "itemId": 5,
  "quantity": 100,
  "deliveryAddress": "서울시 강남구..."
}
```

---

## 출하 관리 API
...
```

### 4. 상태 흐름도 (docs/generated/STATUS_FLOWS.md)

```markdown
# 상태 흐름도

## 1. 발주 상태 (Order)

```
        ┌─────────────────────────────────────────┐
        │                                         │
        ▼                                         │
┌─────────────┐                                   │
│   ACTIVE    │ ◄─── 초기 상태                    │
│  (진행중)   │                                   │
└──────┬──────┘                                   │
       │                                          │
       ├── [모든 출하 완료] ──→ COMPLETED (완료)   │
       │                                          │
       └── [사용자 취소] ────→ CANCELLED (취소)    │
               조건: 출하 없음                     │
```

## 2. 출하 상태 (Shipment)

```
┌─────────────┐     운송 배차     ┌─────────────┐
│   PENDING   │ ─────────────────→│ IN_PROGRESS │
│   (대기)    │                   │  (진행중)   │
└─────────────┘                   └──────┬──────┘
                                         │
                                납품확인 완료
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │  COMPLETED  │
                                  │   (완료)    │
                                  └─────────────┘
```

## 3. 기성차수 서명 흐름 (Baseline)

```
┌──────────────┐
│    DRAFT     │ ◄─── 초기 상태
│   (임시)     │
└──────┬───────┘
       │
       │ 출하 선택 완료
       ▼
┌───────────────────┐
│ PENDING_SIGNATURE │
│   (서명대기)       │
└─────────┬─────────┘
          │
          │ 현장소장 서명
          ▼
┌───────────────────┐
│  PARTIAL_SIGNED   │
│   (부분서명)       │
└─────────┬─────────┘
          │
          │ 감리원 서명
          ▼
┌───────────────────────┐
│  SIGNATURE_COMPLETED  │
│     (서명완료)         │
└───────────┬───────────┘
            │
            │ 최종 확인
            ▼
┌───────────────────────┐
│      CONFIRMED        │
│       (확정)          │
└───────────────────────┘
```

## 4. 자금 흐름 (Fund)

```
선급금 (70%)
    │
    ▼
기성금 (납품 진행별)
    │
    ▼
잔금 (계약금액 - 선급금 - 기성금합계)
    │
    ▼
OEM대금 (기성금의 70%)
```
```

### 5. 비즈니스 규칙 문서 (docs/generated/BUSINESS_RULES.md)

```markdown
# 비즈니스 규칙

## 1. 수량 규칙

### BR001: 출하 수량 제약
- **적용 대상:** Shipment
- **규칙:** 출하 수량 합계 ≤ 발주 수량
- **시행:** 자동 (저장 시 검증)

### BR002: 수량 변경 제한
- **적용 대상:** Shipment
- **규칙:** 기성금 청구에 포함된 출하는 수량 변경 불가
- **시행:** 자동 (수정 시 검증)

## 2. 상태 규칙

### BR003: 납품확인 조건
- **적용 대상:** Delivery
- **규칙:** GPS 위치 및 사진 필수
- **시행:** 유효성 검사

### BR004: 기성금 청구 조건
- **적용 대상:** Baseline
- **규칙:** 납품확인 완료된 출하만 청구 가능
- **시행:** 자동 (출하 선택 시 필터링)

## 3. 자금 규칙

### BR005: 선급금 비율
- **적용 대상:** Fund
- **규칙:** 선급금 = 계약금액 × 70%
- **시행:** 자동 계산

### BR006: 잔금 계산
- **적용 대상:** Fund
- **규칙:** 잔금 = 계약금액 - 선급금 - 기성금합계
- **시행:** 자동 계산

### BR007: OEM 대금
- **적용 대상:** Fund
- **규칙:** OEM대금 = 기성금 × 70%
- **시행:** 자동 계산

## 4. 서명 규칙

### BR008: 서명 순서
- **적용 대상:** Baseline, DeliveryDone
- **규칙:** 현장소장 → 감리원 순차 서명
- **시행:** UI 제어

### BR009: 서명 URL 유효기간
- **적용 대상:** 모바일 서명
- **규칙:** 24시간 유효
- **시행:** 자동 만료
```

---

## 템플릿 시스템

### 변수 치환

```markdown
# {{entity.korean}} ({{entity.name}})

**영문명:** {{entity.name}}
**테이블:** {{entity.table}}
**설명:** {{entity.description}}

## 필드 목록

| 필드명 | 타입 | 한글명 | 설명 |
|--------|------|--------|------|
{{#each entity.fields}}
| {{name}} | {{type}} | {{korean}} | {{description}} |
{{/each}}
```

### 다이어그램 템플릿

**엔티티 관계:**
```
{{parent.korean}}({{parent.name}})
    │
    ├─ {{relation.type}} → {{child.korean}}({{child.name}})
    │                      {{relation.description}}
```

**상태 흐름:**
```
┌────────────┐   {{trigger}}   ┌────────────┐
│ {{from}}   │ ───────────────→│  {{to}}    │
│ ({{from_ko}}) │              │ ({{to_ko}}) │
└────────────┘                 └────────────┘
```

---

## 생성 프로세스

1. **합성된 지식 로드**
2. **문서 유형에 따른 템플릿 선택**
3. **엔티티 데이터로 템플릿 채우기**
4. **다이어그램 생성** (ASCII 또는 Mermaid)
5. **한글 번역 적용**
6. **출력 파일 작성**
7. **인덱스/목차 업데이트**

---

## 출력 구조

```
docs/generated/
├── USER_MANUAL.md
├── API_DOCUMENTATION.md
├── STATUS_FLOWS.md
├── BUSINESS_RULES.md
├── ENTITY_RELATIONSHIPS.md
├── entities/
│   ├── Order.md
│   ├── Shipment.md
│   ├── Transport.md
│   ├── Delivery.md
│   ├── Baseline.md
│   ├── Fund.md
│   └── ... (추가 엔티티)
└── index.md
```

---

## 통합 포인트

- **입력:** `.claude/shared/data/synthesized-knowledge.yaml`
- **템플릿:** `.claude/skills/document-templates.skill.md`
- **출력:** `docs/generated/`
- **다음 에이전트:** `quality-validator`

---

## 문서 스타일 가이드

### 1. 제목
- H1: 문서 제목
- H2: 주요 섹션
- H3: 하위 섹션
- H4: 세부 항목

### 2. 테이블
- 모든 엔티티 필드는 테이블 형식
- 헤더: 필드명 | 타입 | 한글명 | 설명

### 3. 다이어그램
- ASCII 아트 우선 (호환성)
- Mermaid는 옵션

### 4. 용어
- 한글 우선, 영문 병기
- 예: `발주(Order)`

---

## 제약사항

1. **Markdown 형식만 지원** (HTML, PDF는 후처리)
2. **UTF-8 인코딩**
3. **최대 파일 크기**: 단일 파일 1000줄 권장
4. **다이어그램**: ASCII 80자 너비 제한
