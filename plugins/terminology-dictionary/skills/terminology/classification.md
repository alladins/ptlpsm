# 용어 분류 기준

## 도메인 분류 체계

### 기본 도메인 구조

```
프로젝트
├── 공통 (Common)
│   ├── 시스템 (System)
│   ├── 인증 (Auth)
│   └── 기초정보 (Baseline)
├── 비즈니스 (Business)
│   ├── 발주관리 (Order)
│   ├── 출하관리 (Shipping)
│   ├── 납품관리 (Delivery)
│   └── 자금관리 (Fund)
└── 외부연동 (Integration)
    ├── API
    └── 외부시스템
```

### 도메인 식별 규칙

| 도메인 | 식별 키워드 | 관련 파일 패턴 |
|--------|-------------|----------------|
| 발주관리 | order, request, purchase | `**/order/**`, `**/request/**` |
| 출하관리 | shipping, shipment, dispatch | `**/shipping/**`, `**/transport/**` |
| 납품관리 | delivery, receive, confirm | `**/delivery/**` |
| 자금관리 | fund, payment, advance, balance | `**/fund/**`, `**/payment/**` |
| 기초정보 | user, company, code, item | `**/baseline/**`, `**/basic/**` |
| 시스템 | auth, menu, permission, log | `**/system/**`, `**/auth/**` |

## 품사 분류 체계

### 명사 (Noun)

엔티티, 객체, 데이터를 나타내는 용어:

```
식별 패턴:
- interface/type 이름
- 테이블명, 컬럼명
- 단독으로 의미를 가지는 단어

예시:
- 출하 (Shipping)
- 납품 (Delivery)
- 발주 (Order)
- 사용자 (User)
- 회사 (Company)
```

### 동사 (Verb)

액션, 행위를 나타내는 용어:

```
식별 패턴:
- 함수명의 접두어 (get, create, update, delete)
- 버튼 텍스트
- API 액션

예시:
- 조회 (get, fetch, retrieve)
- 등록 (create, register, add)
- 수정 (update, modify, edit)
- 삭제 (delete, remove)
- 승인 (approve, confirm)
- 반려 (reject, deny)
```

### 상태 (Status)

상태값을 나타내는 용어:

```
식별 패턴:
- enum 값
- status 필드의 값
- 상태 표시 UI

예시:
- 대기 (pending, waiting)
- 진행중 (in_progress, processing)
- 완료 (completed, done, finished)
- 취소 (cancelled, canceled)
- 승인 (approved)
- 반려 (rejected)
```

### 약어 (Abbreviation)

축약어, 두문자어:

```
식별 패턴:
- 대문자로만 구성된 단어
- 널리 알려진 축약어

예시:
- OEM: Original Equipment Manufacturer
- GPS: Global Positioning System
- API: Application Programming Interface
- PDF: Portable Document Format
- URL: Uniform Resource Locator
```

## camelCase → 한국어 변환 규칙

### 기본 변환 패턴

```javascript
// 입력: camelCase 변수명
// 출력: 한국어 용어

예시:
shippingDate      → 출하일자 (출하 + 일자)
deliveryStatus    → 납품상태 (납품 + 상태)
orderRequestId    → 발주요청ID (발주 + 요청 + ID)
userName          → 사용자명 (사용자 + 명)
companyCode       → 회사코드 (회사 + 코드)
```

### 공통 접미어 매핑

| 영어 | 한국어 | 예시 |
|------|--------|------|
| Id | ID | userId → 사용자ID |
| Date | 일자 | shippingDate → 출하일자 |
| Time | 시간 | createTime → 생성시간 |
| Name | 명 | userName → 사용자명 |
| Code | 코드 | companyCode → 회사코드 |
| Status | 상태 | deliveryStatus → 납품상태 |
| Type | 유형 | orderType → 발주유형 |
| Count | 수 | itemCount → 품목수 |
| Amount | 금액 | totalAmount → 총금액 |
| List | 목록 | shippingList → 출하목록 |

### 공통 접두어 매핑

| 영어 | 한국어 | 예시 |
|------|--------|------|
| is | ~여부 | isCompleted → 완료여부 |
| has | ~보유 | hasPermission → 권한보유 |
| total | 총 | totalAmount → 총금액 |
| max | 최대 | maxCount → 최대수량 |
| min | 최소 | minAmount → 최소금액 |
| current | 현재 | currentStatus → 현재상태 |
| original | 원본 | originalFile → 원본파일 |

## 동의어 처리 규칙

### 동의어 그룹 정의

```yaml
동의어_그룹:
  출하:
    표준어: 출하
    동의어: [배송, 운송, 발송, 수송]
    영어: shipping

  납품:
    표준어: 납품
    동의어: [인수, 수령, 입고]
    영어: delivery

  발주:
    표준어: 발주
    동의어: [주문, 오더, 구매요청]
    영어: order

  등록:
    표준어: 등록
    동의어: [추가, 생성, 작성]
    영어: create, register
```

### 표준어 선정 기준

1. **공식 문서 우선**: 법률, 규정에서 사용하는 용어
2. **업계 표준**: 해당 산업에서 널리 사용되는 용어
3. **코드베이스 일관성**: 프로젝트에서 가장 많이 사용된 용어
4. **명확성**: 의미가 가장 명확한 용어

## 다의어 처리 규칙

### 컨텍스트 기반 구분

```yaml
order:
  - 컨텍스트: 발주관리
    한국어: 발주
    정의: 물품 구매 요청

  - 컨텍스트: UI
    한국어: 순서
    정의: 정렬 순서

  - 컨텍스트: SQL
    한국어: 정렬
    정의: ORDER BY 절

status:
  - 컨텍스트: 비즈니스
    한국어: 상태
    정의: 업무 진행 상태

  - 컨텍스트: HTTP
    한국어: 상태코드
    정의: HTTP 응답 코드
```

## 용어 검증 체크리스트

- [ ] 한글 맞춤법 검사
- [ ] 영어 철자 검사
- [ ] 동의어 중복 여부
- [ ] 도메인 분류 적절성
- [ ] 정의 명확성
- [ ] 코드 변수명 일치 여부
