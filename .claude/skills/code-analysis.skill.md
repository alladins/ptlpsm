---
description: |
  코드 분석을 위한 패턴 및 규칙을 정의합니다.
  TypeScript, Vue, Java 코드에서 엔티티, 관계, 상태를 추출하는
  정규식 패턴과 추론 규칙을 제공합니다.
---

# Code Analysis Skill

코드 분석 에이전트를 위한 패턴 및 규칙 정의입니다.

---

## 1. TypeScript 분석 패턴

### 1.1 엔티티 감지

```typescript
// Interface 감지
/interface\s+(\w+)\s*\{/

// Type Alias 감지
/type\s+(\w+)\s*=/

// Enum 감지
/enum\s+(\w+)\s*\{/

// 예시:
interface OrderResponse {  // → Entity: Order
  orderId: number
  status: OrderStatus
}

type OrderStatus = 'ACTIVE' | 'COMPLETED'  // → Status Type
```

### 1.2 필드 추출

```typescript
// 필드 패턴
/(\w+)\s*[?]?\s*:\s*([^;,}]+)/

// 예시:
orderId: number           // → { name: 'orderId', type: 'number', optional: false }
shipments?: Shipment[]    // → { name: 'shipments', type: 'Shipment[]', optional: true }
```

### 1.3 관계 추론

```typescript
// ONE_TO_MANY 관계
/(\w+)\s*[?]?\s*:\s*(\w+)\[\]/
// 예: shipments: Shipment[] → Order → Shipment (1:N)

// ONE_TO_ONE 관계 (optional)
/(\w+)\s*\?\s*:\s*(\w+)(?!\[\])/
// 예: transport?: Transport → Shipment → Transport (1:1, optional)

// REFERENCE 관계
/(\w+)Id\s*:\s*number/
// 예: orderId: number → 외부 엔티티 참조
```

### 1.4 상태 타입 감지

```typescript
// Union Type 상태
/type\s+(\w+Status)\s*=\s*(['"][^'"]+['"](?:\s*\|\s*['"][^'"]+['"])*)/

// Enum 상태
/enum\s+(\w+Status)\s*\{([^}]+)\}/

// 상태 레이블 상수
/const\s+(\w+)_LABELS\s*(?::\s*[^=]+)?\s*=\s*\{([^}]+)\}/
```

---

## 2. Vue 컴포넌트 분석 패턴

### 2.1 Script Setup 분석

```typescript
// Props 정의
/defineProps<\{([^}]+)\}>/
/defineProps\(\{([^}]+)\}\)/

// Emits 정의
/defineEmits<\{([^}]+)\}>/
/defineEmits\(\[([^\]]+)\]\)/

// 예시:
defineProps<{
  visible: boolean
  orderId?: number
}>()
// → props: [{ name: 'visible', type: 'boolean', required: true }, ...]
```

### 2.2 Template 분석

```vue
<!-- UI 텍스트 추출 -->
<!-- 버튼 레이블 -->
/<button[^>]*>([^<]+)</
/<el-button[^>]*>([^<]+)</

<!-- 제목 -->
/<h[1-6][^>]*>([^<]+)</

<!-- 레이블 -->
/<label[^>]*>([^<]+)</
/<el-form-item\s+label="([^"]+)"/

<!-- Placeholder -->
/placeholder="([^"]+)"/
```

### 2.3 라우트 추출

```typescript
// 페이지 경로 (파일 시스템 기반)
// pages/admin/order/list.vue → /admin/order/list
// pages/admin/order/edit/[id].vue → /admin/order/edit/:id
```

---

## 3. API 엔드포인트 분석 패턴

### 3.1 엔드포인트 객체

```typescript
// ENDPOINTS 객체 패턴
/export\s+const\s+(\w+)_ENDPOINTS\s*=\s*\{([^}]+)\}/

// 개별 엔드포인트
/(\w+)\s*:\s*(?:\([^)]*\)\s*=>)?\s*`([^`]+)`/

// 예시:
export const ORDER_ENDPOINTS = {
  list: () => `${baseUrl}/admin/orders`,
  detail: (id: number) => `${baseUrl}/admin/orders/${id}`,
}
// → endpoints: [{ name: 'list', path: '/admin/orders' }, ...]
```

### 3.2 HTTP 메서드 추론

```typescript
// 메서드명 기반
list, getList, fetchAll, search     → GET (collection)
detail, get, fetch, find, getById   → GET (single)
create, add, register, post         → POST
update, modify, edit, put           → PUT
delete, remove, destroy             → DELETE

// 서비스 코드 기반
/apiClient\.(get|post|put|delete|patch)\(/
/fetch\([^,]+,\s*\{\s*method:\s*['"](\w+)['"]/
```

### 3.3 파라미터 추출

```typescript
// Path Parameter
/\$\{(\w+)\}/           // 예: ${orderId}
/:(\w+)/                // 예: :orderId

// Query Parameter (서비스 코드에서)
/params:\s*\{([^}]+)\}/
```

---

## 4. Java/Spring 분석 패턴 (향후)

### 4.1 Entity 감지

```java
// @Entity 어노테이션
/@Entity\s+(?:@Table\([^)]*\)\s+)?(?:public\s+)?class\s+(\w+)/

// 필드 추출
/@Column\([^)]*\)\s+private\s+(\w+)\s+(\w+)/
/private\s+(?:List<)?(\w+)(?:>)?\s+(\w+)/
```

### 4.2 관계 어노테이션

```java
// @OneToMany
/@OneToMany\s*\(\s*mappedBy\s*=\s*"(\w+)"/
// → 1:N 관계, mappedBy 필드

// @ManyToOne
/@ManyToOne\s*(?:\([^)]*\))?\s+(?:@JoinColumn[^)]*\))?\s*private\s+(\w+)/
// → N:1 관계

// @OneToOne
/@OneToOne\s*(?:\([^)]*\))?\s*private\s+(\w+)/
// → 1:1 관계
```

### 4.3 Validation 어노테이션

```java
/@NotNull/              → required: true
/@NotEmpty/             → required: true, minLength: 1
/@Size\(.*max=(\d+)/    → maxLength: $1
/@Min\((\d+)\)/         → min: $1
/@Pattern\(.*"([^"]+)"/ → pattern: $1
```

---

## 5. 추론 규칙

### 5.1 엔티티 관계 추론

```yaml
rules:
  # 배열 타입 → 1:N
  - pattern: "fieldType ends with '[]'"
    infer: ONE_TO_MANY
    example: "shipments: Shipment[] → Order has many Shipments"

  # Optional 단일 타입 → 1:1 optional
  - pattern: "field has '?' and type is entity"
    infer: ONE_TO_ONE_OPTIONAL
    example: "transport?: Transport → optional 1:1"

  # Id 접미사 → Foreign Key 참조
  - pattern: "fieldName ends with 'Id'"
    infer: REFERENCE
    example: "orderId: number → references Order"
```

### 5.2 상태 필드 식별

```yaml
rules:
  - pattern: "fieldName is 'status'"
    infer: STATUS_FIELD
    lookup: "find corresponding Status type"

  - pattern: "fieldType matches '*Status'"
    infer: STATUS_TYPE
    extract: "status values from type definition"
```

### 5.3 한글 매핑 우선순위

```yaml
priority:
  1: "terminology.yaml 명시적 정의"
  2: "코드 내 한글 상수 (STATUS_LABELS 등)"
  3: "JSDoc 주석"
  4: "영문 유지 (매핑 없음)"
```

---

## 6. 분석 대상 파일 패턴

### 6.1 프론트엔드 (필수)

```yaml
frontend:
  types:
    - "types/**/*.ts"
    - "types/**/*.d.ts"
  pages:
    - "pages/**/*.vue"
  components:
    - "components/**/*.vue"
  services:
    - "services/**/*.ts"
  stores:
    - "stores/**/*.ts"
  composables:
    - "composables/**/*.ts"
  endpoints:
    - "services/api/endpoints/**/*.ts"
```

### 6.2 백엔드 (선택)

```yaml
backend:
  entities:
    - "**/entity/**/*.java"
    - "**/domain/**/*.java"
  repositories:
    - "**/repository/**/*.java"
  services:
    - "**/service/**/*.java"
  controllers:
    - "**/controller/**/*.java"
  dtos:
    - "**/dto/**/*.java"
  enums:
    - "**/enums/**/*.java"
    - "**/enum/**/*.java"
```

### 6.3 데이터베이스 (선택)

```yaml
database:
  migrations:
    - "**/migration/**/*.sql"
    - "**/migrations/**/*.sql"
  schema:
    - "schema.sql"
    - "ddl.sql"
```

---

## 7. 제외 패턴

```yaml
exclude:
  - "node_modules/**"
  - "dist/**"
  - ".nuxt/**"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.d.ts" # 제외 또는 선택적 포함
```

---

## 8. 분석 결과 스키마

```yaml
analysis_output:
  entities:
    - name: string
      source_file: string
      korean: string (from terminology.yaml)
      fields:
        - name: string
          type: string
          optional: boolean
          korean: string
      status_type: string (if applicable)
      relationships:
        - target: string
          type: ONE_TO_MANY | ONE_TO_ONE | REFERENCE
          optional: boolean

  pages:
    - path: string
      file: string
      korean: string
      parent: string

  components:
    - name: string
      file: string
      props: array
      events: array

  api_endpoints:
    - method: string
      path: string
      name: string
      action: string (korean)
```
