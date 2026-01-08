# 사용자 매뉴얼 자동 생성 스킬

이 스킬은 PTLPSM(출하관리시스템) 소스코드를 분석하여 사용자 매뉴얼을 자동으로 생성하는 방법을 정의합니다.

---

## 1. 개요

### 1.1 목적

소스코드(프론트엔드/백엔드)와 DB 스키마만으로 **질문 없이** 다음을 자동 생성:
- 엔티티 관계도
- 상태 흐름도
- 업무 프로세스 다이어그램
- API 문서
- 비즈니스 규칙 설명

### 1.2 지식 베이스 참조

자동 생성 시 아래 파일을 반드시 참조:
- `.claude/knowledge-base/terminology.yaml` - 용어 사전 (영한 변환)
- `.claude/knowledge-base/status-mappings.yaml` - 상태 정의
- `.claude/knowledge-base/domain-rules.yaml` - 도메인 규칙

---

## 2. 분석 대상 파일

### 2.1 프론트엔드 (필수)

| 경로 패턴 | 추출 정보 |
|----------|----------|
| `types/**/*.ts` | 엔티티 인터페이스, 상태 타입 |
| `services/api/endpoints/**/*.ts` | API 엔드포인트 목록 |
| `services/*.service.ts` | 비즈니스 로직, API 호출 패턴 |
| `pages/**/*.vue` | 페이지 구조, UI 흐름 |
| `components/**/*.vue` | 컴포넌트 구조 |
| `stores/**/*.ts` | 상태 관리 패턴 |

### 2.2 백엔드 (가능한 경우)

| 경로 패턴 | 추출 정보 |
|----------|----------|
| `**/entity/**/*.java` | JPA 엔티티, 테이블 관계 |
| `**/enums/**/*.java` | 상태 Enum 정의 |
| `**/service/**/*.java` | 비즈니스 로직, 상태 전이 |
| `**/controller/**/*.java` | API 엔드포인트 |
| `**/dto/**/*.java` | 데이터 전송 객체 |

### 2.3 데이터베이스 (가능한 경우)

| 경로 패턴 | 추출 정보 |
|----------|----------|
| `**/migration/**/*.sql` | 테이블 스키마, FK 관계 |
| `**/schema.sql` | DDL 정의 |

---

## 3. 분석 절차

### 3.1 Step 1: 엔티티 분석

**목표:** 시스템의 핵심 데이터 구조 추출

**TypeScript 분석 패턴:**
```typescript
// 인터페이스에서 엔티티 추출
interface Order {
  id: number                    // → Field: id (number)
  shipments: Shipment[]         // → Relation: Order → Shipment (1:N)
  fund: Fund                    // → Relation: Order → Fund (1:1)
  status: OrderStatus           // → Status Field 참조
}

// 상태 타입 추출
type ShipmentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
// → Status Values: [PENDING, IN_PROGRESS, COMPLETED]
```

**Java 분석 패턴:**
```java
@Entity
public class Order {
    @OneToMany(mappedBy = "order")
    private List<Shipment> shipments;  // → 1:N 관계

    @OneToOne(mappedBy = "order")
    private Fund fund;                  // → 1:1 관계

    @Enumerated(EnumType.STRING)
    private OrderStatus status;         // → 상태 필드
}
```

**출력 형식:**
```yaml
entities:
  Order:
    korean: "발주"  # terminology.yaml 참조
    fields:
      - name: id
        type: number
      - name: deliveryRequestNo
        type: string
    relationships:
      - target: Shipment
        type: ONE_TO_MANY
      - target: Fund
        type: ONE_TO_ONE
    status_field: status
    status_type: OrderStatus
```

### 3.2 Step 2: 상태 흐름 분석

**목표:** 각 엔티티의 상태 전이 규칙 추출

**TypeScript 분석 패턴:**
```typescript
// Enum 또는 Union 타입에서 상태 값 추출
type BaselineStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'PARTIAL_SIGNED'
  | 'SIGNATURE_COMPLETED'
  | 'CONFIRMED'
  | 'CANCELLED'

// 상태 전이 조건 추출 (서비스 코드에서)
if (baseline.status === 'PENDING_SIGNATURE' && siteManagerSigned) {
  baseline.status = 'PARTIAL_SIGNED'
}
// → Transition: PENDING_SIGNATURE → PARTIAL_SIGNED (현장소장 서명 시)
```

**Java 분석 패턴:**
```java
public enum ShipmentStatus {
    PENDING("대기"),
    IN_PROGRESS("진행중"),
    COMPLETED("완료");

    private final String koreanName;
    // → Status Map 자동 추출
}
```

**출력 형식 (상태 다이어그램):**
```
┌────────────┐   트리거   ┌────────────┐
│   FROM     │ ────────→ │    TO      │
│  (한글명)  │           │  (한글명)  │
└────────────┘           └────────────┘
```

### 3.3 Step 3: API 분석

**목표:** API 엔드포인트와 사용 패턴 추출

**TypeScript 엔드포인트 패턴:**
```typescript
// services/api/endpoints/*.ts
export const ORDER_ENDPOINTS = {
  list: () => `${baseUrl}/admin/orders`,          // GET
  detail: (id) => `${baseUrl}/admin/orders/${id}`, // GET
  create: () => `${baseUrl}/admin/orders`,         // POST
  update: (id) => `${baseUrl}/admin/orders/${id}`, // PUT
}
```

**출력 형식:**
```markdown
### 발주 관련 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /admin/orders | 목록 조회 |
| POST | /admin/orders | 등록 |
| GET | /admin/orders/{id} | 상세 조회 |
| PUT | /admin/orders/{id} | 수정 |
```

### 3.4 Step 4: 비즈니스 규칙 추출

**목표:** 코드에서 비즈니스 규칙 자동 추출

**추출 패턴:**

1. **예외 메시지에서 규칙 추출:**
```typescript
throw new Error('납품확인 완료된 출하만 청구 가능')
// → Rule: 기성금 청구 조건 = 납품확인 완료
```

2. **조건문에서 규칙 추출:**
```typescript
if (shipment.status !== 'COMPLETED') {
  return // 처리 불가
}
// → Rule: 출하 완료 상태에서만 해당 작업 가능
```

3. **UI 비활성화 조건에서 규칙 추출:**
```vue
<button :disabled="isDuplicate || status === 'COMPLETED'">
// → Rule: 중복이거나 완료 상태면 버튼 비활성화
```

4. **Validation에서 규칙 추출:**
```java
@NotNull(message = "인수자 서명 필수")
private String signatureUrl;
// → Rule: 서명 URL 필수
```

**출력 형식:**
```markdown
### 비즈니스 규칙

| 영역 | 규칙 | 출처 |
|------|------|------|
| 기성금 | 납품확인 완료된 출하만 청구 가능 | service 로직 |
| 출하 | 기성금 청구에 포함된 출하는 수량 변경 불가 | UI 조건 |
| 납품확인 | 인수자 서명 필수 | validation |
```

---

## 4. 문서 생성 템플릿

### 4.1 엔티티 관계도 템플릿

```markdown
## 데이터 관계도

```
{{entity1}}({{korean1}}) ──── {{relation}} ────→ {{entity2}}({{korean2}})
    │
    └──── {{relation}} ────→ {{entity3}}({{korean3}})
```

### 핵심 관계 설명

| 관계 | 비율 | 의미 |
|------|------|------|
| {{entity1}} → {{entity2}} | **{{relation}}** | {{meaning}} |
```

### 4.2 상태 흐름도 템플릿

```markdown
## {{entity_korean}} 상태 흐름

```
┌────────────┐   {{trigger1}}   ┌────────────┐
│ {{state1}} │ ───────────────→ │ {{state2}} │
│ ({{ko1}})  │                  │ ({{ko2}})  │
└────────────┘                  └────────────┘
```

### 상태별 가능 작업

| 상태 | 가능한 작업 | 불가능한 작업 |
|------|------------|--------------|
| {{state1}} | {{allowed}} | {{forbidden}} |
```

### 4.3 업무 프로세스 템플릿

```markdown
## 업무 프로세스: {{process_name}}

```
┌─────────────────────────────────────────────────────┐
│                   Step 1: {{step1}}                  │
│                  {{description1}}                    │
└──────────────────────────┬──────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────┐
│                   Step 2: {{step2}}                  │
│                  {{description2}}                    │
└──────────────────────────┬──────────────────────────┘
                           ▼
              ┌────────────┴────────────┐
              │      조건 분기          │
              └────────────┬────────────┘
                  예 │         │ 아니오
                     ▼         ▼
```
```

---

## 5. 자동 생성 명령어

### 5.1 /analyze-entities

**용도:** 코드베이스에서 엔티티 정보 추출

**실행 절차:**
1. `types/**/*.ts` 파일 스캔
2. interface/type 정의 파싱
3. 필드, 관계, 상태 타입 추출
4. `terminology.yaml`로 한글 변환
5. YAML 형식으로 결과 출력

**예상 출력:**
```yaml
# 분석 결과: 엔티티
entities:
  Order:
    korean: "발주"
    fields: [...]
    relationships: [...]
  Shipment:
    korean: "출하"
    ...
```

### 5.2 /analyze-flows

**용도:** 상태 흐름 및 업무 프로세스 분석

**실행 절차:**
1. 상태 관련 타입/Enum 스캔
2. 상태 전이 조건 분석
3. `status-mappings.yaml`과 대조
4. 상태 다이어그램 생성

**예상 출력:**
```markdown
## 출하 상태 흐름

PENDING → IN_PROGRESS (운송 배차 시)
IN_PROGRESS → COMPLETED (납품확인 완료 시)
```

### 5.3 /generate-section

**용도:** 특정 섹션의 매뉴얼 자동 생성

**파라미터:**
- `section`: 생성할 섹션 (entities, flows, api, rules)
- `entity`: 특정 엔티티만 생성 (선택사항)

**예시:**
```
/generate-section section=flows entity=Shipment
```

### 5.4 /generate-manual

**용도:** 전체 매뉴얼 자동 생성

**실행 절차:**
1. /analyze-entities 실행
2. /analyze-flows 실행
3. API 엔드포인트 분석
4. 비즈니스 규칙 추출
5. 템플릿 적용하여 Markdown 생성
6. `docs/generated/` 디렉토리에 저장

---

## 6. 지식 베이스 활용

### 6.1 용어 변환

`terminology.yaml`에서 영문 → 한글 자동 변환:
```yaml
# 입력 (코드)
Order, Shipment, status, createdAt

# 출력 (문서)
발주, 출하, 상태, 등록일시
```

### 6.2 상태 매핑

`status-mappings.yaml`에서 상태 흐름 가져오기:
```yaml
# 코드에서 상태 발견
ShipmentStatus.PENDING

# 지식 베이스에서 정보 조회
- korean: "대기"
- transitions: PENDING → IN_PROGRESS (운송 배차 시)
- constraints.allowed: ["수정", "삭제", "운송배차"]
```

### 6.3 도메인 규칙 보완

`domain-rules.yaml`에서 암묵적 규칙 가져오기:
```yaml
# 코드에서 추출 불가능한 규칙
advance_payment:
  default_rate: 0.7
  rate_description: "계약금액의 70%"
  source: "조달청 계약 가이드라인"
```

---

## 7. 한계 및 보완

### 7.1 자동 생성 가능 (80%)

- 엔티티 관계도
- API 엔드포인트 목록
- 상태 정의 및 전이 규칙
- 코드에 명시된 비즈니스 규칙
- 페이지/컴포넌트 구조

### 7.2 수동 보완 필요 (20%)

- 암묵적 비즈니스 규칙 (예: "선급금 70%가 관행")
- 사용자 시나리오 설명
- 스크린샷 및 UI 설명
- 도메인 특화 용어 설명
- 예외 케이스 처리 방법

### 7.3 하이브리드 접근

```markdown
<!-- AUTO-GENERATED START -->
(자동 생성 영역: 엔티티, API, 상태 흐름)
<!-- AUTO-GENERATED END -->

<!-- MANUAL START -->
(수동 작성 영역: 스크린샷, 사용 팁, 예외 설명)
<!-- MANUAL END -->
```

---

## 8. 사용 예시

### 8.1 전체 매뉴얼 생성

```
사용자: 출하 관리 매뉴얼을 자동으로 생성해줘

에이전트 동작:
1. types/shipment.ts 분석 → 엔티티 구조 추출
2. services/shipment.service.ts 분석 → API 및 로직 추출
3. status-mappings.yaml 참조 → 상태 흐름 가져오기
4. domain-rules.yaml 참조 → 비즈니스 규칙 보완
5. 템플릿 적용 → Markdown 생성
```

### 8.2 특정 섹션 업데이트

```
사용자: 기성금 청구 프로세스 문서를 업데이트해줘

에이전트 동작:
1. types/baseline.ts, types/fund.ts 분석
2. baseline 관련 API 엔드포인트 추출
3. 서명 흐름 분석 (status-mappings.yaml)
4. 기성금 규칙 참조 (domain-rules.yaml)
5. 해당 섹션만 재생성
```

---

**문서 정보**
- 버전: 1.0
- 작성일: 2026-01-02
- 목적: 사용자 매뉴얼 자동 생성 가이드
- 참조: knowledge-base/*.yaml
