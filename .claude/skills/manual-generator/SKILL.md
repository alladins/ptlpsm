---
name: manual-generator
description: |
  PTLPSM 소스코드(프론트/백엔드/DB 스키마)를 분석해 질문 없이 사용자 매뉴얼·엔티티 관계도·상태
  흐름도·업무 프로세스·API 문서·비즈니스 규칙을 자동 생성하는 절차와 분석 패턴 정의. 분석기·합성·생성
  에이전트가 코드→문서 변환 절차를 수행할 때 사용한다. "매뉴얼 생성/문서 자동생성/엔티티·상태흐름 추출"이
  필요하면 이 스킬을 로드할 것. (전체 파이프라인 조율은 manual-harness-orchestrator 가 담당)
---

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

## 9. 상세 매뉴얼 작성 표준 (화면별 사용법)

화면별 사용법(2장 이후)을 작성·보강할 때는 각 기능 절에 다음 4가지를 **실제 코드에서 확인한 내용으로** 채운다. 근거는 코드에서 확보하되 **근거 자체는 본문에 쓰지 않는다**(아래 9.1). 추측 금지 — 코드에서 확인 못한 UI/값은 **본문에 쓰지 않고** 내부 메모 `.claude/shared/data/manual-enhance/open-questions.md` 에 «절 · 무엇을 확인해야 하나»로 남긴다. 독자는 비개발자 실무 사용자(고객 포함)이므로 운영/조작 관점으로 쓴다.

### 9.1 독자 노출 금지 (2026-10-01 — 반드시 지킬 것)

이 매뉴얼은 시스템 화면(`/manual`)에서 **고객이 그대로 읽는다.** 아래는 본문 어디에도 쓰지 않는다. 쓰고 싶으면 내부 메모(위 open-questions.md)나 개발 문서(`docs/`, 데브로그)로 보낸다.

| 금지 | 예 | 대신 |
|------|-----|------|
| «코드 근거:» 줄, 소스 파일·컴포넌트명 | `ProgressPaymentModal.vue isValid`, `[id].vue`, `types/fund.ts` | 쓰지 않음 |
| 함수·변수·필드의 코드 이름 | `contractTotalAmount`, `paymentSeq`, `balanceAmount`, `eligible` | 화면에 보이는 이름(«계약총액», «차수») |
| DB 테이블·컬럼명, 서버 클래스명 | `fund_management.order_id`, `inventory_transaction_id`, `OrderService` | «자금 정보», «재고 거래 ID» |
| 내부 문서·스크립트 경로 | `docs/sql/...sql`, `*.ps1`, `/app/...` 서버 경로 | «관리자에게 문의» |
| 미확정·내부 판단 표기 | «(확인 필요)», «코드 vs 지식베이스 불일치», «레거시/대체 경로», «코드상» | 확인된 사실만. 모르면 쓰지 않음 |
| 화면에서 더 이상 쓰지 않는 기능 설명 | 예전 모바일 서명 URL 발송 | 삭제(변경 이력에 한 줄) |
| 비밀정보 | 인증키 값, 비밀번호, 계정 | «설정됨/미설정» 같은 상태만 |
| 본문에 보이는 스크린샷 자리표시 (2026-10-03) | `> 📷 [스크린샷: …]` | `<!-- 스크린샷: … -->` 주석으로만 |
| 화면 주소·라우트 표기 (2026-10-03) | «화면 주소: `/admin/order/list`», «목록 라우트», 메뉴표의 주소 열 | 메뉴 경로(«납품관리 → 기성청구»). 단 `<!-- menu: … -->`·`<!-- screen: … -->` 주석은 유지 |

**허용**: `<!-- menu: … -->`·`<!-- screen: … -->`·`<!-- 스크린샷: … -->` 한 줄 주석(독자에게 안 보임), 화면·알림에 **실제로 뜨는 문구** 원문, 화면에 그대로 보이는 상태값·코드값(예: 납품요구번호 `-00`/`-01`).

**작성 후 자가 점검** — 아래가 0건이어야 저장한다(남기려면 위 «허용»에 해당하는 이유가 있어야 함):
```bash
grep -n -E "코드 근거|\.vue|\.ts\`|\.java|\.xml|\.ya?ml|docs/sql|\.ps1|확인 필요|지식베이스|레거시|코드상|\[스크린샷:|라우트|/admin/|/m/delivery|/api/" docs/출하관리시스템_사용자매뉴얼.md | grep -v -E "^[0-9]+:\s*<!--"
```

1. **단계별 조작 가이드** — 번호 매긴 조작 순서. 실제 버튼/메뉴 라벨(`<button>`·FormField label)과 화면 이동을 메뉴 경로(«좌측 메뉴 → 기성청구»)로 명시. 라우트는 쓰지 않는다(9.1).
2. **입력 필드 사전** — 표(필드 | 의미 | 필수 | 제약/형식 | 비고). `v-model`·validation·placeholder·required·`:disabled`에서 근거 확보.
3. **사용 예시·시나리오** — 구체 케이스 한 단락(실제 금액/번호 예시).
4. **오류 메시지 & 대응** — 표(메시지 | 원인 | 대응). 프론트 `alert(`/`throw`·백엔드 `BusinessException`/`@ExceptionHandler`의 **실제 문구**를 인용.

**스크린샷 자리표시 규칙**: 화면 설명마다 `<!-- 스크린샷: <화면명> — <무엇을 보여주는지> -->` 주석으로 삽입(본문에 보이는 `[스크린샷:` 금지 — 9.1)(추후 실제 캡처 교체용).

**화면 바로가기 표시 규칙 (2026-10-03)**: 특정 화면을 설명하는 절은 제목 **바로 다음 줄**에 `<!-- screen: /admin/xxx/list -->` 를 둔다(쉼표로 여러 개). 매뉴얼 화면이 이 표시를 «[메뉴명] 화면으로» 버튼으로 바꾸고(권한 없는 화면은 숨김), 관리자 화면 상단 [매뉴얼] 버튼이 이 표시로 해당 절을 찾는다. ID 가 붙는 상세·수정 화면은 목록 주소로 연결하고, 역방향 찾기용으로 `/admin/xxx/edit/*` 처럼 끝이 `/*` 인 패턴을 덧붙인다(버튼은 안 생김). 경로는 `pages/` 에 실제 있는 화면이어야 한다. 장 단위 `<!-- menu: … -->` 와는 역할이 다르니 둘 다 유지.

**보존 원칙**: 기존 매뉴얼의 정확한 내용은 삭제하지 말고 확장한다. 헤딩 구조는 유지하되 하위 헤딩 추가는 허용.

> 이 표준으로 보강한 산출물은 `docs/출하관리시스템_사용자매뉴얼.md`이며, 장별 중간 산출물은 `.claude/shared/data/manual-enhance/`에 보존된다.

---

**문서 정보**
- 버전: 1.1 (2026-06-15 상세 매뉴얼 작성 표준 추가)
- 작성일: 2026-01-02
- 목적: 사용자 매뉴얼 자동 생성 가이드
- 참조: knowledge-base/*.yaml
