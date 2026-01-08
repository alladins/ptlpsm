---
name: database-analyzer
description: |
  데이터베이스 스키마를 분석합니다:
  - 테이블 정의
  - 컬럼 사양
  - 외래키 관계
  - 인덱스 및 제약조건

  참고: 현재는 스텁 상태입니다. DB 직접 접근이 불가하여
  terminology.yaml의 테이블 매핑을 참조합니다.
tools: Read, Grep, Glob
model: sonnet
when_to_use: |
  DB 스키마 파일이 있거나 DB 연결이 설정된 경우에만 활성화됩니다.
  현재는 스텁으로 동작하며 knowledge-base를 참조합니다.
---

# Database Analyzer Agent

데이터베이스 스키마 분석기입니다.

## 상태: STUB

데이터베이스 직접 접근이 불가능합니다.
이 에이전트는 다음 조건 충족 시 활성화됩니다:
1. Migration SQL 파일 존재
2. Schema DDL 파일 접근 가능
3. 데이터베이스 연결 설정

---

## 활성화 시 분석 대상

### Migration 파일
```sql
-- V1__create_orders_table.sql
CREATE TABLE orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    delivery_request_no VARCHAR(50) NOT NULL UNIQUE,
    item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_item
        FOREIGN KEY (item_id) REFERENCES items(item_id)
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_request_no ON orders(delivery_request_no);
```

### DDL 추출 패턴
```regex
# 테이블 생성
CREATE\s+TABLE\s+(\w+)\s*\(

# 컬럼 정의
(\w+)\s+(BIGINT|INT|VARCHAR\(\d+\)|TEXT|TIMESTAMP|DATE|DECIMAL\(\d+,\d+\))

# 외래키
FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)

# 인덱스
CREATE\s+INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)
```

---

## Fallback 모드 (현재 활성)

DB 접근 불가 시 다음을 사용합니다:

### 1. terminology.yaml의 테이블 매핑
```yaml
entities:
  Order:
    korean: "발주"
    table: "orders"
    description: "공공조달 계약에 따른 물품 납품 요청 단위"

  Shipment:
    korean: "출하"
    table: "shipments"
    description: "창고에서 현장으로 물품을 보내는 단위"
```

### 2. domain-rules.yaml의 관계 정의
```yaml
relationships:
  order_to_shipment:
    type: ONE_TO_MANY
    korean: "발주 1건에 여러 번 분할 출하 가능"
    # → orders.order_id ← shipments.order_id (FK)
```

### 3. 프론트엔드 타입에서 추론
```typescript
interface Order {
  orderId: number       // → orders.order_id (PK)
  shipments: Shipment[] // → 1:N 관계
}
```

---

## 출력 형식

**출력 경로:** `.claude/shared/data/database-analysis.yaml`

### 스텁 모드 출력
```yaml
# Database Analysis Output (STUB MODE)
generated_at: "2026-01-03T00:00:00Z"
analyzer: "database-analyzer"
version: "1.0"
status: "STUB"

fallback_sources:
  - ".claude/knowledge-base/terminology.yaml"
  - ".claude/knowledge-base/domain-rules.yaml"
  - "types/**/*.ts (프론트엔드 타입)"

message: "DB 직접 접근 불가 - 추론 기반 분석"

inferred_tables:
  orders:
    korean: "발주"
    entity: "Order"
    source: "terminology.yaml"
    inferred_columns:
      - name: order_id
        type: BIGINT
        primary_key: true
        inferred_from: "types/order.ts:orderId"
      - name: delivery_request_no
        type: VARCHAR
        unique: true
        inferred_from: "types/order.ts:deliveryRequestNo"
      - name: status
        type: VARCHAR(20)
        inferred_from: "status-mappings.yaml:order.states"
      - name: created_at
        type: TIMESTAMP
        inferred_from: "common pattern"

  shipments:
    korean: "출하"
    entity: "Shipment"
    source: "terminology.yaml"
    inferred_columns:
      - name: shipment_id
        type: BIGINT
        primary_key: true
      - name: order_id
        type: BIGINT
        foreign_key:
          references: orders.order_id
        inferred_from: "domain-rules.yaml:relationships"

  transports:
    korean: "운송"
    entity: "Transport"
    inferred_columns: [...]

inferred_relationships:
  - parent: orders
    child: shipments
    type: ONE_TO_MANY
    foreign_key: order_id
    source: "domain-rules.yaml"

  - parent: shipments
    child: transports
    type: ONE_TO_ONE
    foreign_key: shipment_id
    source: "domain-rules.yaml"

  - parent: shipments
    child: deliveries
    type: ONE_TO_MANY
    foreign_key: shipment_id
    source: "domain-rules.yaml"

missing_info:
  - "정확한 컬럼 타입 및 길이"
  - "인덱스 정의"
  - "CHECK 제약조건"
  - "기본값 설정"
```

### 활성 모드 출력 (DB 연결 시)
```yaml
# Database Analysis Output (ACTIVE MODE)
generated_at: "2026-01-03T00:00:00Z"
analyzer: "database-analyzer"
version: "1.0"
status: "ACTIVE"
database: "ptlpsm_db"
schema: "public"

tables:
  orders:
    korean: "발주"
    columns:
      - name: order_id
        type: BIGINT
        nullable: false
        primary_key: true
        auto_increment: true
      - name: delivery_request_no
        type: VARCHAR(50)
        nullable: false
        unique: true
      - name: item_id
        type: BIGINT
        nullable: false
        foreign_key:
          table: items
          column: item_id
      - name: quantity
        type: INT
        nullable: false
        check: "quantity > 0"
      - name: status
        type: VARCHAR(20)
        nullable: false
        default: "'ACTIVE'"
        check: "status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')"
      - name: created_at
        type: TIMESTAMP
        nullable: false
        default: "CURRENT_TIMESTAMP"
      - name: updated_at
        type: TIMESTAMP
        nullable: false
        default: "CURRENT_TIMESTAMP"
        on_update: "CURRENT_TIMESTAMP"

    indexes:
      - name: idx_orders_status
        columns: [status]
        unique: false
      - name: idx_orders_delivery_request_no
        columns: [delivery_request_no]
        unique: true

    constraints:
      - name: pk_orders
        type: PRIMARY KEY
        columns: [order_id]
      - name: uq_orders_delivery_request_no
        type: UNIQUE
        columns: [delivery_request_no]
      - name: fk_orders_item
        type: FOREIGN KEY
        columns: [item_id]
        references: items(item_id)

foreign_keys:
  - from_table: shipments
    from_column: order_id
    to_table: orders
    to_column: order_id
    on_delete: RESTRICT
    on_update: CASCADE

  - from_table: transports
    from_column: shipment_id
    to_table: shipments
    to_column: shipment_id
    on_delete: CASCADE
```

---

## 통합 포인트

- **입력 (활성 모드):**
  - SQL Migration 파일
  - Schema DDL 파일
  - DB 연결 (MCP mariadb 서버 활용 가능)

- **입력 (스텁 모드):**
  - `.claude/knowledge-base/terminology.yaml`
  - `.claude/knowledge-base/domain-rules.yaml`
  - `types/**/*.ts` (프론트엔드 타입)

- **출력:**
  - `.claude/shared/data/database-analysis.yaml`

- **다음 에이전트:**
  - `knowledge-synthesizer`

---

## 활성화 조건

```yaml
# 활성화 설정 예시 (향후 지원)
database_config:
  enabled: true
  type: mariadb
  # Option 1: SQL 파일
  migration_path: "sql/migrations/"
  # Option 2: MCP 연결
  mcp_server: mariadb
```

---

## MCP MariaDB 서버 활용 (향후)

설정된 MCP mariadb 서버를 통해 실시간 스키마 조회 가능:

```sql
-- 테이블 목록 조회
SHOW TABLES;

-- 테이블 구조 조회
DESCRIBE orders;

-- 외래키 조회
SELECT * FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IS NOT NULL;

-- 인덱스 조회
SHOW INDEX FROM orders;
```

---

## 제약사항

1. **MariaDB/MySQL만 지원** (PostgreSQL, Oracle 미지원)
2. **읽기 전용** (스키마 변경 없음)
3. **보안 민감 정보 제외** (비밀번호 등)
4. **대용량 테이블 데이터 조회 제한**
