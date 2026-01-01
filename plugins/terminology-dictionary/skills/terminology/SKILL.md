---
name: terminology-dictionary
description: |
  프로젝트 코드베이스를 분석하여 표준 용어 사전을 생성합니다.
  types/*.ts, components/**/*.vue, services/*.ts 파일에서 용어를 추출하고,
  한영 매핑, 동의어, 정의를 포함한 구조화된 용어 사전을 만듭니다.
  사용 시점: "용어 사전 만들어줘", "terminology dictionary", "용어 정리",
  "glossary 생성", "표준 용어", "한영 매핑", "용어 추출"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# 표준 용어 사전 생성 스킬

## 개요

이 스킬은 프로젝트의 코드베이스를 분석하여 **표준 용어 사전(Standard Terminology Dictionary)**을 자동으로 생성합니다.

## 용어 추출 소스

| 소스 파일 | 추출 대상 | 예시 |
|----------|----------|------|
| `types/*.ts` | interface/type 필드명, JSDoc 주석 | `shippingDate` → 출하일자 |
| `components/**/*.vue` | UI 레이블 (`<label>`, `<th>`, 버튼) | `납품확인`, `서명완료` |
| `services/*.ts` | API 메서드명, 엔드포인트 | `getShippingList` → 출하목록조회 |
| `stores/*.ts` | 상태/액션명 | `setDeliveryStatus` |
| `pages/**/*.vue` | 페이지 제목, 네비게이션 | `발주 목록` |

## 용어 분류 체계

### 도메인별 분류

프로젝트 특성에 맞게 도메인을 정의합니다:

```
도메인 예시:
- 발주관리 (Order): 발주, 수주, 납품요구, 발주서
- 출하관리 (Shipping): 출하, 운송, 배송, 차량번호
- 납품관리 (Delivery): 납품, 입고, 검수, 서명
- 자금관리 (Fund): 선급금, 기성금, 잔금, OEM
- 기초정보 (Baseline): 사용자, 회사, 품목, 코드
- 시스템 (System): 로그인, 권한, 메뉴, 설정
```

### 품사별 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| 명사 (Noun) | 엔티티, 객체 | 출하, 납품, 발주, 사용자 |
| 동사 (Verb) | 액션, 행위 | 등록, 수정, 삭제, 조회, 승인 |
| 상태 (Status) | 상태값 | 대기, 진행중, 완료, 취소 |
| 약어 (Abbr) | 축약어 | OEM, GPS, API, PDF |

## 실행 단계

### 1단계: 타입 정의 분석

TypeScript 타입 파일에서 용어 추출:

```
분석 대상: types/**/*.ts

추출 항목:
1. interface 이름과 필드명
2. type alias 이름
3. enum 값과 의미
4. JSDoc 주석 (한국어 설명)

예시 분석:
interface ShippingItem {
  shippingId: number;      // 출하ID
  shippingDate: string;    // 출하일자
  deliveryStatus: string;  // 납품상태
}

추출 결과:
- shippingId → 출하ID
- shippingDate → 출하일자
- deliveryStatus → 납품상태
```

### 2단계: Vue 컴포넌트 분석

Vue 파일의 템플릿에서 한국어 UI 텍스트 추출:

```
분석 대상:
- components/**/*.vue
- pages/**/*.vue

추출 위치:
- <label> 태그 내용
- <th> 태그 내용
- <button> 태그 내용
- placeholder 속성
- title 속성
- 에러/알림 메시지

예시:
<label>출하일자</label>
<th>납품상태</th>
<button>저장</button>
```

### 3단계: 서비스 레이어 분석

API 서비스 파일에서 비즈니스 용어 추출:

```
분석 대상: services/**/*.ts

추출 항목:
1. 함수명 (getXxx, createXxx, updateXxx, deleteXxx)
2. API 엔드포인트 경로
3. 요청/응답 타입명

예시:
async function getShippingList() { ... }
→ get + Shipping + List
→ 조회 + 출하 + 목록
→ "출하목록조회"
```

### 4단계: 용어 정규화

추출된 용어들을 정규화:

```
1. 동의어 통합
   - 배송, 운송, 수송 → 표준: 출하
   - 주문, 오더, 발주 → 표준: 발주

2. 영한 매핑 일관성
   - shipping → 출하 (운송 X)
   - delivery → 납품 (배달 X)
   - order → 발주 (주문과 구분)

3. 약어 정의
   - OEM: Original Equipment Manufacturer (주문자상표부착생산)
   - GPS: Global Positioning System (위성항법시스템)

4. 복합어 분해
   - shippingDate → 출하 + 일자 = 출하일자
   - deliveryConfirm → 납품 + 확인 = 납품확인
```

### 5단계: 용어 사전 문서 생성

최종 용어 사전을 문서로 생성:

```
출력 형식 옵션:
1. Markdown: docs/TERMINOLOGY.md
2. JSON: docs/terminology.json
3. Excel 호환 CSV: docs/terminology.csv
```

## 용어 사전 출력 형식

### Markdown 테이블 형식

```markdown
# 표준 용어 사전

## 발주관리 (Order)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 발주 | Order | order | 물품 구매를 요청하는 행위 |
| 납품요구 | Delivery Request | deliveryRequest | 발주된 물품의 납품을 요청 |

## 출하관리 (Shipping)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 출하 | Shipping | shipping | 물품을 창고에서 배송지로 보내는 행위 |
| 출하일자 | Shipping Date | shippingDate | 출하가 이루어진 날짜 |
```

### JSON 형식

```json
{
  "version": "1.0.0",
  "generated": "2024-01-01T00:00:00Z",
  "project": "프로젝트명",
  "domains": [
    {
      "id": "order",
      "name": "발주관리",
      "nameEn": "Order Management"
    }
  ],
  "terms": [
    {
      "id": "term-001",
      "korean": "출하",
      "english": "Shipping",
      "codeVariables": ["shipping", "shipment"],
      "domain": "shipping",
      "category": "noun",
      "definition": "물품을 창고에서 배송지로 보내는 행위",
      "synonyms": ["배송", "발송"],
      "sources": [
        "types/shipping.ts:15",
        "components/ShippingList.vue:42"
      ]
    }
  ]
}
```

## 추가 리소스

- [용어 분류 기준 상세](classification.md)
- [영한 매핑 가이드라인](mapping-guide.md)

## 사용 예시

```
사용자: "이 프로젝트의 용어 사전을 만들어줘"
사용자: "types 폴더 분석해서 용어 추출해줘"
사용자: "한영 용어 매핑 정리해줘"
사용자: "glossary 생성해줘"
```
