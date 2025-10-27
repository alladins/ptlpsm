# 출하 상세 조회 API (발주 정보 포함)

## 개요

출하 수정 페이지에서 필요한 모든 데이터를 한 번의 API 호출로 제공하는 통합 엔드포인트입니다.

**목적**: 기존 3개 API 호출을 1개로 통합하여 성능 개선 및 클라이언트 로직 간소화

---

## 기존 API 상세 분석

### API ① `GET /api/admin/shipments/{shipmentId}` (출하 상세 조회)

**엔드포인트**: `/api/admin/shipments/3`

**Request:**
```http
GET /api/admin/shipments/3
Host: localhost:9031
Accept: application/json
```

**Response:**
```json
{
  "shipmentId": 3,
  "orderId": 3,
  "deliveryRequestNo": "24-22-4-31556-00",
  "shipmentDate": "2025-10-25T00:00:00",
  "trackingNumber": "",
  "status": "PENDING",
  "items": [
    {
      "shipmentId": 3,
      "orderId": 3,
      "skuId": "23561446",
      "itemId": "1",
      "shipmentQuantity": 1332,
      "unitPrice": 21000,
      "amount": 27972000,
      "lotNumber": null,
      "productionDate": null,
      "expiryDate": null,
      "inspectionResult": null,
      "inspectionDate": null,
      "inspector": null,
      "memo": null
    }
  ]
}
```

**현재 사용처**:
- `pages/admin/shipping/edit/[id].vue` (출하 수정) - **✅ 통합 API로 대체 예정**
- `pages/admin/transport/register.vue` (운송 등록) - **⚠️ 계속 사용**
- `pages/admin/transport/register-old.vue` (백업)

**제공 데이터**:
- 출하 기본 정보: `shipmentId`, `orderId`, `deliveryRequestNo`, `shipmentDate`, `trackingNumber`, `status`
- 출하 품목: `items[]` (출하수량, 단가, 금액)

**DB 쿼리**: 2개
```sql
-- 출하 기본 정보
SELECT * FROM shipments WHERE shipment_id = ?;

-- 출하 품목
SELECT * FROM shipment_items WHERE shipment_id = ?;
```

**삭제 가능 여부**: ❌ **불가** (운송 등록에서 사용 중)

---

### API ② `GET /api/admin/orders/{orderId}` (발주 상세 조회)

**엔드포인트**: `/api/admin/orders/3`

**Request:**
```http
GET /api/admin/orders/3
Host: localhost:9031
Accept: application/json
```

**Response:**
```json
{
  "orderId": 3,
  "salesId": null,
  "contractId": "제00-22-7-0305-00호",
  "contractDate": "2022-08-19",
  "deliveryRequestNo": "24-22-4-31556-00",
  "deliveryRequestDate": "2022-12-01",
  "projectName": "농업인지원센터건립공사관급자재구매",
  "client": "전라남도",
  "clientNo": "4088300513",
  "clientManagerName": "김성수",
  "clientPostalCode": "58564",
  "clientAddress": "전라남도무안군삼향읍오룡길1-0",
  "clientPhoneNumber": "061-286-3676",
  "clientFaxNumber": "061-286-4761",
  "naraJangteoNo": "6460000",
  "warrantyPeriod": "2년간",
  "paymentMethod": "",
  "itemTotalAmount": "34411000.00",
  "commission": "185810.00",
  "totalAmount": "34596810.00",
  "partialDelivery": "가능",
  "inspectionAgency": "전라남도",
  "acceptanceAgency": "전라남도",
  "pdfFile": "D:\\app\\leadpower\\ptlpsmback\\shared\\file\\202510\\6ecb0335-e3fc-47a5-b504-dfc410eb06b8_농업인지원센터.pdf",
  "items": [
    {
      "orderItemId": 9,
      "skuId": "23561446",
      "skuNm": "JYGB-60LC2",
      "orderId": 3,
      "itemId": "1",
      "optionItemNumber": "",
      "itemClassificationNumber": "30141503",
      "itemIdentificationNumber": "23561446",
      "productName": "기포단열재",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-60LC,1000×1000×60mm",
      "unit": "㎡",
      "unitPrice": 21000,
      "quantity": 1332,
      "amount": 27972000,
      "shippedQuantity": 0,
      "deliveryLocation": "수요기관지정장소",
      "deliveryDeadline": "2022-12-31",
      "deliveryTerms": "공장상차도",
      "sortOrder": 1,
      "inspectionExemption": "N",
      "midTermCompetitionItem": "N"
    },
    {
      "orderItemId": 10,
      "skuId": "23561445",
      "skuNm": "JYGB-80LC2",
      "orderId": 3,
      "itemId": "2",
      "optionItemNumber": "",
      "itemClassificationNumber": "30141503",
      "itemIdentificationNumber": "23561445",
      "productName": "기포단열재",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-80LC,1000×1000×80mm",
      "unit": "㎡",
      "unitPrice": 27400,
      "quantity": 235,
      "amount": 6439000,
      "shippedQuantity": 0,
      "deliveryLocation": "수요기관지정장소",
      "deliveryDeadline": "2022-12-31",
      "deliveryTerms": "공장상차도",
      "sortOrder": 2,
      "inspectionExemption": "N",
      "midTermCompetitionItem": "N"
    }
  ]
}
```

**현재 사용처**:
- `pages/admin/order/detail/[id].vue` (발주 상세) - **⚠️ 계속 사용**
- `pages/admin/order/edit/[id].vue` (발주 수정) - **⚠️ 계속 사용**
- `pages/admin/transport/edit/[id].vue` (운송 수정) - **⚠️ 계속 사용**
- `pages/admin/transport/edit/[id]-backup.vue` (백업)

**제공 데이터**:
- 발주 기본 정보: 계약정보, 수요기관 정보, 사업정보
- 발주 품목: `items[]` (품목명, 규격, 단위, 발주수량, 단가, 금액)

**DB 쿼리**: 2개
```sql
-- 발주 기본 정보
SELECT * FROM orders WHERE order_id = ?;

-- 발주 품목
SELECT * FROM order_items WHERE order_id = ?;
```

**삭제 가능 여부**: ❌ **불가** (다른 페이지에서 광범위하게 사용 중)

---

### API ③ `GET /api/admin/shipments/by-order/{deliveryRequestNo}` (출하 현황 조회)

**엔드포인트**: `/api/admin/shipments/by-order/24-22-4-31556-00`

**Request:**
```http
GET /api/admin/shipments/by-order/24-22-4-31556-00
Host: localhost:9031
Accept: application/json
```

**Response:**
```json
{
  "deliveryRequestNo": "24-22-4-31556-00",
  "orderId": 3,
  "items": [
    {
      "skuId": "23561446",
      "itemId": "1",
      "itemName": "기포단열재",
      "skuName": "JYGB-60LC2",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-60LC,1000×1000×60mm",
      "unit": "㎡",
      "orderQuantity": 1332,
      "totalShippedQuantity": 1332,
      "remainingQuantity": 0
    },
    {
      "skuId": "23561445",
      "itemId": "2",
      "itemName": "기포단열재",
      "skuName": "JYGB-80LC2",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-80LC,1000×1000×80mm",
      "unit": "㎡",
      "orderQuantity": 235,
      "totalShippedQuantity": 0,
      "remainingQuantity": 235
    }
  ]
}
```

**현재 사용처**:
- `pages/admin/shipping/register.vue` (출하 등록) - **⚠️ 계속 사용**
- `pages/admin/transport/register.vue` (운송 등록) - **⚠️ 계속 사용**
- `pages/admin/transport/register-old.vue` (백업)

**제공 데이터**:
- SKU별 출하 현황: 발주수량, 전체 출하 누적수량, 잔여수량

**DB 쿼리**: 1개 (복잡한 GROUP BY)
```sql
SELECT
  oi.sku_id,
  oi.item_id,
  oi.product_name,
  oi.sku_nm AS sku_name,
  oi.specification,
  oi.unit,
  oi.quantity AS order_quantity,
  COALESCE(SUM(si.shipment_quantity), 0) AS total_shipped_quantity,
  (oi.quantity - COALESCE(SUM(si.shipment_quantity), 0)) AS remaining_quantity
FROM order_items oi
LEFT JOIN shipment_items si ON oi.sku_id = si.sku_id
WHERE oi.order_id = (
  SELECT order_id FROM orders WHERE delivery_request_no = ?
)
GROUP BY oi.sku_id, oi.item_id, oi.product_name, oi.sku_nm, oi.specification, oi.unit, oi.quantity;
```

**삭제 가능 여부**: ❌ **불가** (출하 등록, 운송 등록에서 사용 중)

---

## 🎯 기존 API 처리 방침

### ❌ 삭제 불가 API (3개 모두)

| API | 엔드포인트 | 사용처 | 비고 |
|-----|-----------|--------|------|
| ① 출하 상세 | `GET /shipments/{id}` | 운송 등록 | 통합 API로 대체 불가 |
| ② 발주 상세 | `GET /orders/{id}` | 발주 상세/수정, 운송 수정 | 범용적으로 사용 중 |
| ③ 출하 현황 | `GET /shipments/by-order/{deliveryRequestNo}` | 출하 등록, 운송 등록 | 필수 API |

### ✅ 권장 방침

1. **기존 3개 API 유지**
   - 다른 페이지에서 계속 사용 중
   - 삭제 시 여러 페이지 동시 수정 필요
   - 범용성 있는 API로 유지 권장

2. **새 통합 API 추가**
   - 출하 수정 페이지 전용 최적화 API
   - 기존 API에 영향 없음
   - 점진적 최적화 가능

3. **향후 확장 가능성**
   - 출하 등록, 운송 등록 페이지도 유사한 통합 API 고려
   - 페이지별 최적화된 전용 API 패턴 확립

---

## 기존 방식 vs 새 방식

### 기존 방식 (3개 API 호출)

```
1. GET /api/admin/shipments/3
   → shipmentDetail

2. GET /api/admin/orders/3
   → orderDetail

3. GET /api/admin/shipments/by-order/24-22-4-31556-00
   → shipmentStatus

총: HTTP 요청 3회 + DB 쿼리 5회
```

### 새 방식 (1개 API 호출)

```
1. GET /api/admin/shipments/3/detail-with-order
   → 모든 데이터 통합 제공

총: HTTP 요청 1회 + DB 쿼리 1회
```

---

## API 스펙

### Request

```http
GET /api/admin/shipments/{shipmentId}/detail-with-order
Host: localhost:9031
Accept: application/json
```

**Path Parameters:**
- `shipmentId` (number, required): 출하 ID

**Example:**
```http
GET /api/admin/shipments/3/detail-with-order
```

---

### Response

#### Success (200 OK)

```json
{
  "shipmentId": 3,
  "orderId": 3,
  "shipmentDate": "2025-10-25T00:00:00",
  "trackingNumber": "",
  "status": "PENDING",

  "order": {
    "contractId": "제00-22-7-0305-00호",
    "contractDate": "2022-08-19",
    "deliveryRequestNo": "24-22-4-31556-00",
    "deliveryRequestDate": "2022-12-01",
    "projectName": "농업인지원센터건립공사관급자재구매",
    "client": "전라남도",
    "clientNo": "4088300513",
    "clientManagerName": "김성수",
    "clientPostalCode": "58564",
    "clientAddress": "전라남도무안군삼향읍오룡길1-0",
    "clientPhoneNumber": "061-286-3676",
    "clientFaxNumber": "061-286-4761",
    "naraJangteoNo": "6460000"
  },

  "items": [
    {
      "skuId": "23561446",
      "itemId": "1",
      "productName": "기포단열재",
      "skuName": "JYGB-60LC2",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-60LC,1000×1000×60mm",
      "unit": "㎡",

      "orderQuantity": 1332,
      "unitPrice": 21000,

      "shipmentQuantity": 1332,
      "amount": 27972000,

      "totalShippedQuantity": 1332,
      "remainingQuantity": 0,
      "maxEditableQuantity": 1332
    },
    {
      "skuId": "23561445",
      "itemId": "2",
      "productName": "기포단열재",
      "skuName": "JYGB-80LC2",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-80LC,1000×1000×80mm",
      "unit": "㎡",

      "orderQuantity": 235,
      "unitPrice": 27400,

      "shipmentQuantity": 0,
      "amount": 0,

      "totalShippedQuantity": 0,
      "remainingQuantity": 235,
      "maxEditableQuantity": 235
    }
  ],

  "createdBy": "system",
  "createdAt": "2025-10-25T16:36:10",
  "updatedBy": "system",
  "updatedAt": "2025-10-25T16:36:10"
}
```

#### Error Responses

**404 Not Found**
```json
{
  "error": "Shipment not found",
  "message": "출하 정보를 찾을 수 없습니다.",
  "shipmentId": 999
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "서버 오류가 발생했습니다."
}
```

---

## 응답 필드 설명

### Root Level

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `shipmentId` | number | Y | 출하 ID |
| `orderId` | number | Y | 발주 ID |
| `shipmentDate` | string (ISO 8601) | Y | 출하일자 |
| `trackingNumber` | string | N | 운송장번호 (빈 문자열 가능) |
| `status` | string | Y | 출하 상태 (`PENDING`, `READY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) |
| `order` | object | Y | 발주 정보 |
| `items` | array | Y | 출하 품목 목록 |
| `createdBy` | string | Y | 생성자 |
| `createdAt` | string (ISO 8601) | Y | 생성일시 |
| `updatedBy` | string | Y | 수정자 |
| `updatedAt` | string (ISO 8601) | Y | 수정일시 |

### `order` Object

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `contractId` | string | Y | 계약번호 |
| `contractDate` | string (ISO 8601) | Y | 계약일자 |
| `deliveryRequestNo` | string | Y | 납품요구번호 |
| `deliveryRequestDate` | string (ISO 8601) | Y | 납품요구일자 |
| `projectName` | string | Y | 사업명 |
| `client` | string | Y | 수요기관 |
| `clientNo` | string | Y | 수요기관번호 |
| `clientManagerName` | string | Y | 담당자 |
| `clientPostalCode` | string | N | 우편번호 |
| `clientAddress` | string | N | 주소 |
| `clientPhoneNumber` | string | N | 전화번호 |
| `clientFaxNumber` | string | N | 팩스번호 |
| `naraJangteoNo` | string | N | 나라장터번호 |

### `items` Array Item

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `skuId` | string | Y | SKU ID |
| `itemId` | string | Y | 품목 ID |
| `productName` | string | Y | 품목명 |
| `skuName` | string | Y | SKU 품명 |
| `specification` | string | Y | 규격 |
| `unit` | string | Y | 단위 |
| `orderQuantity` | number | Y | 발주수량 |
| `unitPrice` | number | Y | 단가 |
| `shipmentQuantity` | number | Y | **현재 출하건의 출하수량** |
| `amount` | number | Y | 금액 (`shipmentQuantity * unitPrice`) |
| `totalShippedQuantity` | number | Y | **전체 출하 누적수량** (모든 출하건 합계) |
| `remainingQuantity` | number | Y | **잔여수량** (`orderQuantity - totalShippedQuantity`) |
| `maxEditableQuantity` | number | Y | **수정 가능 최대수량** (`shipmentQuantity + remainingQuantity`) |

---

## 계산 로직

### `items[].totalShippedQuantity` (전체 출하 누적수량)

```sql
SELECT COALESCE(SUM(si2.shipment_quantity), 0)
FROM shipment_items si2
JOIN shipments s2 ON si2.shipment_id = s2.shipment_id
WHERE s2.order_id = :orderId
  AND si2.sku_id = :skuId
```

**설명**: 해당 발주의 특정 SKU에 대한 모든 출하건의 수량 합계

### `items[].remainingQuantity` (잔여수량)

```sql
(order_quantity - total_shipped_quantity)
```

**설명**: 발주수량에서 전체 출하 누적수량을 뺀 값

### `items[].maxEditableQuantity` (수정 가능 최대수량)

```sql
(shipment_quantity + remaining_quantity)
```

**설명**:
- 현재 출하건의 수량 + 잔여수량
- 예: 현재 200개 + 잔여 100개 = 최대 300개까지 수정 가능
- 용도: 출하 수정 시 validation에 사용

---

## SQL 쿼리 예시 (백엔드 참고용)

```sql
WITH shipment_totals AS (
  -- 각 SKU별 전체 출하 누적수량 계산
  SELECT
    si2.sku_id,
    s2.order_id,
    COALESCE(SUM(si2.shipment_quantity), 0) AS total_shipped_quantity
  FROM shipment_items si2
  JOIN shipments s2 ON si2.shipment_id = s2.shipment_id
  GROUP BY si2.sku_id, s2.order_id
)

SELECT
  -- Shipment 기본 정보
  s.shipment_id,
  s.order_id,
  s.shipment_date,
  s.tracking_number,
  s.status,
  s.created_by,
  s.created_at,
  s.updated_by,
  s.updated_at,

  -- Order 정보 (JOIN)
  o.contract_id,
  o.contract_date,
  o.delivery_request_no,
  o.delivery_request_date,
  o.project_name,
  o.client,
  o.client_no,
  o.client_manager_name,
  o.client_postal_code,
  o.client_address,
  o.client_phone_number,
  o.client_fax_number,
  o.nara_jangteo_no,

  -- Order Items 정보
  oi.sku_id,
  oi.item_id,
  oi.product_name,
  oi.sku_nm AS sku_name,
  oi.specification,
  oi.unit,
  oi.quantity AS order_quantity,
  oi.unit_price,

  -- Shipment Items 정보 (LEFT JOIN - 출하 안 된 품목도 표시)
  COALESCE(si.shipment_quantity, 0) AS shipment_quantity,
  COALESCE(si.amount, 0) AS amount,

  -- Shipment Status (계산 필드)
  COALESCE(st.total_shipped_quantity, 0) AS total_shipped_quantity,
  (oi.quantity - COALESCE(st.total_shipped_quantity, 0)) AS remaining_quantity,
  (COALESCE(si.shipment_quantity, 0) + (oi.quantity - COALESCE(st.total_shipped_quantity, 0))) AS max_editable_quantity

FROM shipments s
INNER JOIN orders o ON s.order_id = o.order_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN shipment_items si ON s.shipment_id = si.shipment_id AND oi.sku_id = si.sku_id
LEFT JOIN shipment_totals st ON oi.sku_id = st.sku_id AND o.order_id = st.order_id

WHERE s.shipment_id = :shipmentId

ORDER BY oi.sort_order;
```

---

## 백엔드 구현 가이드

### 1. Controller (예시)

```java
@RestController
@RequestMapping("/api/admin/shipments")
public class ShipmentController {

    @Autowired
    private ShipmentService shipmentService;

    @GetMapping("/{shipmentId}/detail-with-order")
    public ResponseEntity<ShipmentDetailWithOrderDto> getShipmentDetailWithOrder(
        @PathVariable Long shipmentId
    ) {
        ShipmentDetailWithOrderDto result = shipmentService.getShipmentDetailWithOrder(shipmentId);
        return ResponseEntity.ok(result);
    }
}
```

### 2. Service (예시)

```java
@Service
public class ShipmentService {

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Transactional(readOnly = true)
    public ShipmentDetailWithOrderDto getShipmentDetailWithOrder(Long shipmentId) {
        // SQL 쿼리 실행 (위의 SQL 참고)
        // DTO 변환 및 반환
    }
}
```

### 3. DTO 클래스 (예시)

```java
@Data
public class ShipmentDetailWithOrderDto {
    private Long shipmentId;
    private Long orderId;
    private LocalDateTime shipmentDate;
    private String trackingNumber;
    private String status;

    private OrderInfo order;
    private List<ShipmentItemWithOrder> items;

    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    @Data
    public static class OrderInfo {
        private String contractId;
        private LocalDate contractDate;
        private String deliveryRequestNo;
        private LocalDate deliveryRequestDate;
        private String projectName;
        private String client;
        private String clientNo;
        private String clientManagerName;
        private String clientPostalCode;
        private String clientAddress;
        private String clientPhoneNumber;
        private String clientFaxNumber;
        private String naraJangteoNo;
    }

    @Data
    public static class ShipmentItemWithOrder {
        private String skuId;
        private String itemId;
        private String productName;
        private String skuName;
        private String specification;
        private String unit;

        private Integer orderQuantity;
        private BigDecimal unitPrice;

        private Integer shipmentQuantity;
        private BigDecimal amount;

        private Integer totalShippedQuantity;
        private Integer remainingQuantity;
        private Integer maxEditableQuantity;
    }
}
```

---

## 테스트 케이스

### Case 1: 정상 조회 (출하수량 있음)

**Request:**
```http
GET /api/admin/shipments/3/detail-with-order
```

**Expected Response:**
- Status: 200 OK
- `items[0].shipmentQuantity`: 1332
- `items[0].totalShippedQuantity`: 1332
- `items[0].remainingQuantity`: 0
- `items[0].maxEditableQuantity`: 1332

### Case 2: 정상 조회 (출하수량 0인 품목 포함)

**Expected Response:**
- `items[1].shipmentQuantity`: 0
- `items[1].totalShippedQuantity`: 0
- `items[1].remainingQuantity`: 235
- `items[1].maxEditableQuantity`: 235

### Case 3: 존재하지 않는 출하 ID

**Request:**
```http
GET /api/admin/shipments/999/detail-with-order
```

**Expected Response:**
- Status: 404 Not Found
- Error message 포함

---

## 성능 목표

- **응답 시간**: < 100ms (DB 쿼리 포함)
- **동시 요청**: 100 req/s 처리 가능
- **DB Connection**: 쿼리 1회로 완료

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 내용 |
|------|------|--------|------|
| 1.0 | 2025-10-25 | Claude | 초안 작성 |

---

## 참고 문서

- 기존 API:
  - `GET /api/admin/shipments/{shipmentId}`
  - `GET /api/admin/orders/{orderId}`
  - `GET /api/admin/shipments/by-order/{deliveryRequestNo}`
- 프론트엔드 페이지: `pages/admin/shipping/edit/[id].vue`
