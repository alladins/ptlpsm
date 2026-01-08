---
name: backend-analyzer
description: |
  Spring Boot 백엔드 코드베이스(별도 저장소)를 분석합니다:
  - JPA Entity 정의
  - Repository 메서드
  - Service 레이어 비즈니스 로직
  - Controller 엔드포인트
  - Validation 어노테이션

  참고: 현재는 스텁 상태입니다. 백엔드가 별도 저장소에 있어
  domain-rules.yaml을 Fallback으로 사용합니다.
tools: Read, Grep, Glob
model: sonnet
when_to_use: |
  백엔드 저장소 경로가 설정된 경우에만 활성화됩니다.
  현재는 스텁으로 동작하며 knowledge-base를 참조합니다.
---

# Backend Analyzer Agent

Spring Boot 백엔드 애플리케이션 분석기입니다.

## 상태: STUB

백엔드 코드베이스가 별도 저장소에 있습니다.
이 에이전트는 다음 조건 충족 시 활성화됩니다:
1. 백엔드 저장소 경로가 설정됨
2. Java 소스 파일 접근 가능

---

## 활성화 시 분석 대상

### Entity 레이어
```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<Shipment> shipments;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private OrderStatus status;

    @Column(nullable = false, length = 50)
    private String deliveryRequestNo;
}
```

### Service 레이어
```java
@Service
@Transactional
public class OrderService {

    public Order createOrder(OrderCreateDto dto) {
        // 비즈니스 로직 추출 대상
        validateOrderQuantity(dto);
        checkDuplicateDeliveryRequestNo(dto.getDeliveryRequestNo());
        return orderRepository.save(toEntity(dto));
    }

    public void updateStatus(Long orderId, OrderStatus newStatus) {
        // 상태 전이 로직 추출 대상
    }
}
```

### Controller 레이어
```java
@RestController
@RequestMapping("/admin/orders")
public class OrderController {

    @GetMapping
    public Page<OrderResponse> getList(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        OrderSearchDto searchDto
    ) {
        return orderService.getList(PageRequest.of(page, size), searchDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody OrderCreateRequest request) {
        return orderService.create(request);
    }
}
```

---

## 추출 패턴

### JPA 어노테이션 분석
```regex
# 엔티티 감지
@Entity\s+.*class\s+(\w+)

# 관계 감지
@OneToMany.*mappedBy\s*=\s*"(\w+)"
@ManyToOne.*
@OneToOne.*

# 필드 제약조건
@Column\(.*nullable\s*=\s*(true|false).*\)
@NotNull
@Size\(.*max\s*=\s*(\d+).*\)
```

### Validation 어노테이션 분석
```java
@NotNull(message = "필수 입력입니다")
@Size(min = 1, max = 50, message = "1-50자 사이로 입력하세요")
@Pattern(regexp = "^[A-Z0-9-]+$", message = "형식이 올바르지 않습니다")
@Min(value = 1, message = "1 이상이어야 합니다")
```

---

## Fallback 모드 (현재 활성)

백엔드 접근 불가 시 다음을 사용합니다:

### 1. domain-rules.yaml 참조
```yaml
# 엔티티 관계
relationships:
  order_to_shipment:
    type: ONE_TO_MANY
    constraint: "출하 수량 합계 ≤ 발주 수량"
```

### 2. status-mappings.yaml 참조
```yaml
# 상태 정의 및 전이
order:
  states:
    ACTIVE: { korean: "진행중", is_initial: true }
    COMPLETED: { korean: "완료", is_final: true }
  transitions:
    - from: ACTIVE
      to: COMPLETED
      trigger: "모든 출하 완료"
```

### 3. terminology.yaml 참조
```yaml
# 테이블 매핑
entities:
  Order:
    table: "orders"
    korean: "발주"
```

---

## 출력 형식

**출력 경로:** `.claude/shared/data/backend-analysis.yaml`

### 스텁 모드 출력
```yaml
# Backend Analysis Output (STUB MODE)
generated_at: "2026-01-03T00:00:00Z"
analyzer: "backend-analyzer"
version: "1.0"
status: "STUB"

fallback_source: ".claude/knowledge-base/"
message: "백엔드 저장소 미연결 - knowledge-base 참조"

inferred_entities:
  Order:
    korean: "발주"
    table: "orders"
    source: "terminology.yaml"
    relationships:
      - target: Shipment
        type: ONE_TO_MANY
        source: "domain-rules.yaml"
    status:
      type: OrderStatus
      values:
        - ACTIVE
        - COMPLETED
        - CANCELLED
      source: "status-mappings.yaml"

inferred_constraints:
  - entity: Order
    rule: "납품요구번호 중복 불가"
    source: "domain-rules.yaml"
  - entity: Shipment
    rule: "출하수량 <= 발주잔량"
    source: "domain-rules.yaml"

missing_info:
  - "Entity 필드 상세 타입"
  - "Validation 규칙 상세"
  - "Service 레이어 비즈니스 로직"
```

### 활성 모드 출력 (백엔드 연결 시)
```yaml
# Backend Analysis Output (ACTIVE MODE)
generated_at: "2026-01-03T00:00:00Z"
analyzer: "backend-analyzer"
version: "1.0"
status: "ACTIVE"
backend_path: "/path/to/backend/repo"

entities:
  Order:
    source_file: "src/main/java/.../entity/Order.java"
    table: "orders"
    fields:
      - name: orderId
        type: Long
        column: "order_id"
        primary_key: true
        auto_generated: true
      - name: deliveryRequestNo
        type: String
        column: "delivery_request_no"
        nullable: false
        max_length: 50
        unique: true
    relationships:
      - target: Shipment
        type: ONE_TO_MANY
        mapped_by: "order"
        cascade: ALL

services:
  OrderService:
    source_file: "src/main/java/.../service/OrderService.java"
    methods:
      - name: createOrder
        business_rules:
          - "중복 납품요구번호 검증"
          - "발주 수량 유효성 검증"
      - name: updateStatus
        state_transitions:
          - from: ACTIVE
            to: COMPLETED
            condition: "모든 출하 완료"

controllers:
  OrderController:
    source_file: "src/main/java/.../controller/OrderController.java"
    base_path: "/admin/orders"
    endpoints:
      - method: GET
        path: ""
        handler: getList
        params: [page, size, searchDto]
```

---

## 통합 포인트

- **입력 (활성 모드):**
  - 백엔드 저장소 Java 소스

- **입력 (스텁 모드):**
  - `.claude/knowledge-base/terminology.yaml`
  - `.claude/knowledge-base/status-mappings.yaml`
  - `.claude/knowledge-base/domain-rules.yaml`

- **출력:**
  - `.claude/shared/data/backend-analysis.yaml`

- **다음 에이전트:**
  - `knowledge-synthesizer`

---

## 활성화 조건

```yaml
# 활성화 설정 예시 (향후 지원)
backend_config:
  enabled: true
  repository_path: "/path/to/backend/repo"
  source_root: "src/main/java"
  package_prefix: "com.example.ptlpsm"
```

---

## 제약사항

1. **Spring Boot 2.x/3.x만 지원**
2. **JPA/Hibernate 필수**
3. **Lombok 사용 시 컴파일된 클래스 필요할 수 있음**
4. **별도 저장소 클론 필요**
