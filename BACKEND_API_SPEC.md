# 납품현황 관리 트리 구조 API 설계서

**프로젝트**: PTLPSM (출하관리 시스템)
**작성일**: 2025-10-30
**버전**: 1.0
**목적**: 납품확인관리 목록을 트리 구조(발주 → 출하 → 운송/납품확인)로 표시하기 위한 백엔드 API 명세서

---

## 📋 목차

1. [개요](#개요)
2. [데이터 구조](#데이터-구조)
3. [API 엔드포인트](#api-엔드포인트)
4. [데이터베이스 쿼리 예시](#데이터베이스-쿼리-예시)
5. [구현 가이드](#구현-가이드)
6. [테스트 시나리오](#테스트-시나리오)

---

## 개요

### 요구사항

**목표**: 발주(Order) 기준으로 출하(Shipment), 운송(Transport), 납품확인(Delivery Confirmation)을 계층 구조로 제공

**핵심 기능**:
- ✅ 발주별 납품율 계산 (납품완료 수량 / 전체 발주 수량 × 100%)
- ✅ 3단계 트리 구조: 발주 → 출하 → 운송/납품확인
- ✅ 서명 이미지/사진 조회 엔드포인트
- ✅ 페이징 및 검색 필터 지원

### 데이터 계층 구조

```
┌─────────────────────────────────────────┐
│ Order (발주)                             │
│ - orderId, deliveryRequestNo            │
│ - totalOrderQuantity (발주 수량)        │
│ - totalDeliveredQuantity (납품완료 수량) │
│ - deliveryRate (납품율 %)               │
└─┬───────────────────────────────────────┘
  │
  ├─► Shipment 1 (출하)
  │   │ - shipmentId, shipmentQuantity
  │   │ - status, itemSummary
  │   │
  │   └─► Transport (운송)
  │       │ - transportId, trackingNumber
  │       │ - vehicleNo, driverName
  │       │
  │       └─► DeliveryConfirmation (납품확인)
  │           - deliveryId, completedAt
  │           - signatureUrl, photoUrls
  │
  ├─► Shipment 2
  └─► Shipment 3
```

---

## 데이터 구조

### 1. OrderTreeNode (발주 노드)

**설명**: 발주 단위의 최상위 노드. 전체 발주 수량 대비 납품율을 포함.

```json
{
  "orderId": 123,
  "deliveryRequestNo": "35-24-3-41787-00",
  "contractId": "제00-22-7-0305-01호",
  "contractDate": "2024-07-02",
  "client": "한국농어촌공사 전북지역본부 군산지사",
  "projectName": "군산시광역해양레저체험복합단지조성사업",
  "totalOrderQuantity": 31571.0,
  "totalShippedQuantity": 25000.0,
  "totalDeliveredQuantity": 18943.0,
  "deliveryRate": 60.0,
  "unit": "㎡",
  "shipments": [...]
}
```

**필드 설명**:

| 필드 | 타입 | 필수 | 설명 | 계산 방식 |
|------|------|------|------|-----------|
| `orderId` | Long | ✅ | 발주 ID | - |
| `deliveryRequestNo` | String | ✅ | 납품요구번호 | - |
| `contractId` | String | ✅ | 계약번호 | - |
| `contractDate` | String (YYYY-MM-DD) | ✅ | 계약일 | - |
| `client` | String | ✅ | 발주처(고객사) | - |
| `projectName` | String | ✅ | 프로젝트명 | - |
| `totalOrderQuantity` | Double | ✅ | 전체 발주 수량 | `SUM(order_items.quantity)` |
| `totalShippedQuantity` | Double | ❌ | 출하된 총 수량 | `SUM(shipments.shipment_quantity)` |
| `totalDeliveredQuantity` | Double | ✅ | 납품완료 수량 | `SUM(shipments.shipment_quantity WHERE delivery_confirmations.status = 'COMPLETED')` |
| `deliveryRate` | Double | ✅ | 납품율 (%) | `(totalDeliveredQuantity / totalOrderQuantity) × 100` |
| `unit` | String | ✅ | 단위 (㎡, 개 등) | 대표 단위 (첫 번째 품목 또는 통일 단위) |
| `shipments` | Array | ✅ | 출하 목록 | `ShipmentTreeNode[]` |

---

### 2. ShipmentTreeNode (출하 노드)

**설명**: 발주에 속한 출하 정보. 각 출하는 1개의 운송 정보를 가짐.

```json
{
  "shipmentId": 245,
  "shipmentDate": "2024-07-15",
  "shipmentQuantity": 10000.0,
  "shipmentResponsible": "김출하",
  "status": "COMPLETED",
  "itemCount": 5,
  "itemSummary": "기포단열재 3개, 단열재B 2개",
  "transport": {...}
}
```

**필드 설명**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `shipmentId` | Long | ✅ | 출하 ID |
| `shipmentDate` | String (YYYY-MM-DD) | ✅ | 출하일 |
| `shipmentQuantity` | Double | ✅ | 출하 수량 |
| `shipmentResponsible` | String | ❌ | 출하 담당자 |
| `status` | String | ✅ | 출하 상태 (`PENDING`, `IN_TRANSIT`, `COMPLETED` 등) |
| `itemCount` | Integer | ✅ | 품목 개수 |
| `itemSummary` | String | ✅ | 품목 요약 (예: "기포단열재 3개, 단열재B 2개") |
| `transport` | Object | ❌ | 운송 정보 (`TransportDetailNode` - null 가능) |

---

### 3. TransportDetailNode (운송 노드)

**설명**: 출하에 연결된 운송 및 납품확인 정보.

```json
{
  "transportId": 1234,
  "trackingNumber": "T-2024-1234",
  "vehicleNo": "12가3456",
  "driverName": "김기사",
  "driverPhone": "010-1234-5678",
  "deliveryAddress": "전라북도 군산시 옥산면 산단로 123",
  "addressDetail": "3동 앞",
  "deliveryDate": "2024-07-16",
  "siteSupervisorName": "박소장",
  "siteSupervisorPhone": "010-9876-5432",
  "status": "COMPLETED",
  "deliveryConfirmation": {...}
}
```

**필드 설명**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transportId` | Long | ✅ | 운송장 ID |
| `trackingNumber` | String | ✅ | 운송장 번호 |
| `vehicleNo` | String | ✅ | 차량 번호 |
| `driverName` | String | ✅ | 기사 이름 |
| `driverPhone` | String | ❌ | 기사 연락처 |
| `deliveryAddress` | String | ✅ | 배송지 주소 |
| `addressDetail` | String | ❌ | 배송지 상세 주소 |
| `deliveryDate` | String (YYYY-MM-DD) | ✅ | 배송 예정일 |
| `siteSupervisorName` | String | ❌ | 현장 소장 이름 |
| `siteSupervisorPhone` | String | ❌ | 현장 소장 연락처 |
| `status` | String | ✅ | 운송 상태 |
| `deliveryConfirmation` | Object | ❌ | 납품확인 정보 (`DeliveryConfirmationNode` - null 가능) |

---

### 4. DeliveryConfirmationNode (납품확인 노드)

**설명**: 운송 완료 후 현장에서 작성한 납품확인 정보.

```json
{
  "deliveryId": 456,
  "status": "COMPLETED",
  "completedAt": "2024-07-16T14:30:25",
  "hasSignature": true,
  "signatureUrl": "/api/admin/deliveries/456/signature",
  "photoCount": 3,
  "photoUrls": [
    "/api/admin/deliveries/456/photos/1",
    "/api/admin/deliveries/456/photos/2",
    "/api/admin/deliveries/456/photos/3"
  ],
  "latitude": 35.9876,
  "longitude": 126.1234
}
```

**필드 설명**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `deliveryId` | Long | ✅ | 납품확인 ID |
| `status` | String | ✅ | 납품확인 상태 (`COMPLETED`, `PENDING` 등) |
| `completedAt` | String (ISO 8601) | ✅ | 완료 일시 |
| `hasSignature` | Boolean | ✅ | 서명 존재 여부 |
| `signatureUrl` | String | ❌ | 서명 이미지 URL (상대 경로) |
| `photoCount` | Integer | ✅ | 사진 개수 |
| `photoUrls` | Array<String> | ✅ | 사진 URL 배열 (최대 5개) |
| `latitude` | Double | ❌ | 위도 (GPS) |
| `longitude` | Double | ❌ | 경도 (GPS) |

---

## API 엔드포인트

### 1. GET /admin/deliveries/tree

**목적**: 트리 구조 납품 현황 조회 (발주 → 출하 → 운송/납품확인)

#### Request

**Method**: `GET`

**URL**: `/admin/deliveries/tree`

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `startDate` | String | ❌ | 검색 시작일 (YYYY-MM-DD) | `2024-07-01` |
| `endDate` | String | ❌ | 검색 종료일 (YYYY-MM-DD) | `2024-07-31` |
| `deliveryRequestNo` | String | ❌ | 납품요구번호 부분 검색 | `41787` |
| `status` | String | ❌ | 납품확인 상태 필터 | `COMPLETED`, `PENDING` |
| `page` | Integer | ❌ | 페이지 번호 (0부터 시작) | `0` |
| `size` | Integer | ❌ | 페이지 크기 | `10` |
| `sort` | String | ❌ | 정렬 기준 | `contractDate,desc` |

**Example Request**:
```
GET /admin/deliveries/tree?startDate=2024-07-01&endDate=2024-07-31&page=0&size=10&sort=contractDate,desc
```

#### Response

**Status Code**: `200 OK`

**Content-Type**: `application/json`

**Response Body**:
```json
{
  "content": [
    {
      "orderId": 123,
      "deliveryRequestNo": "35-24-3-41787-00",
      "contractId": "제00-22-7-0305-01호",
      "contractDate": "2024-07-02",
      "client": "한국농어촌공사 전북지역본부 군산지사",
      "projectName": "군산시광역해양레저체험복합단지조성사업",
      "totalOrderQuantity": 31571.0,
      "totalShippedQuantity": 25000.0,
      "totalDeliveredQuantity": 18943.0,
      "deliveryRate": 60.0,
      "unit": "㎡",
      "shipments": [
        {
          "shipmentId": 245,
          "shipmentDate": "2024-07-15",
          "shipmentQuantity": 10000.0,
          "shipmentResponsible": "김출하",
          "status": "COMPLETED",
          "itemCount": 5,
          "itemSummary": "기포단열재 3개, 단열재B 2개",
          "transport": {
            "transportId": 1234,
            "trackingNumber": "T-2024-1234",
            "vehicleNo": "12가3456",
            "driverName": "김기사",
            "driverPhone": "010-1234-5678",
            "deliveryAddress": "전라북도 군산시 옥산면 산단로 123",
            "addressDetail": "3동 앞",
            "deliveryDate": "2024-07-16",
            "siteSupervisorName": "박소장",
            "siteSupervisorPhone": "010-9876-5432",
            "status": "COMPLETED",
            "deliveryConfirmation": {
              "deliveryId": 456,
              "status": "COMPLETED",
              "completedAt": "2024-07-16T14:30:25",
              "hasSignature": true,
              "signatureUrl": "/api/admin/deliveries/456/signature",
              "photoCount": 3,
              "photoUrls": [
                "/api/admin/deliveries/456/photos/1",
                "/api/admin/deliveries/456/photos/2",
                "/api/admin/deliveries/456/photos/3"
              ],
              "latitude": 35.9876,
              "longitude": 126.1234
            }
          }
        },
        {
          "shipmentId": 246,
          "shipmentDate": "2024-07-20",
          "shipmentQuantity": 8000.0,
          "shipmentResponsible": "이출하",
          "status": "IN_TRANSIT",
          "itemCount": 3,
          "itemSummary": "단열재A 2개, 단열재C 1개",
          "transport": {
            "transportId": 1235,
            "trackingNumber": "T-2024-1235",
            "vehicleNo": "34나5678",
            "driverName": "이기사",
            "status": "IN_TRANSIT",
            "deliveryConfirmation": null
          }
        }
      ]
    }
  ],
  "totalElements": 15,
  "totalPages": 2,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

**Error Responses**:

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| `400 Bad Request` | 잘못된 파라미터 | `{"error": "Invalid date format"}` |
| `401 Unauthorized` | 인증 실패 | `{"error": "Unauthorized"}` |
| `500 Internal Server Error` | 서버 오류 | `{"error": "Internal server error"}` |

---

### 2. GET /admin/deliveries/{deliveryId}/signature

**목적**: 납품확인 서명 이미지 조회

#### Request

**Method**: `GET`

**URL**: `/admin/deliveries/{deliveryId}/signature`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deliveryId` | Long | ✅ | 납품확인 ID |

**Example Request**:
```
GET /admin/deliveries/456/signature
```

#### Response

**Status Code**: `200 OK`

**Content-Type**: `image/png`

**Response Body**: Binary image data (PNG format)

**Error Responses**:

| Status Code | Description |
|-------------|-------------|
| `404 Not Found` | 서명이 없거나 deliveryId가 유효하지 않음 |

---

### 3. GET /admin/deliveries/{deliveryId}/photos/{photoIndex}

**목적**: 납품확인 사진 조회

#### Request

**Method**: `GET`

**URL**: `/admin/deliveries/{deliveryId}/photos/{photoIndex}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deliveryId` | Long | ✅ | 납품확인 ID |
| `photoIndex` | Integer | ✅ | 사진 인덱스 (1부터 시작, 1~5) |

**Example Request**:
```
GET /admin/deliveries/456/photos/1
```

#### Response

**Status Code**: `200 OK`

**Content-Type**: `image/jpeg` 또는 `image/png`

**Response Body**: Binary image data

**Error Responses**:

| Status Code | Description |
|-------------|-------------|
| `404 Not Found` | 사진이 없거나 인덱스가 범위를 벗어남 |

---

## 데이터베이스 쿼리 예시

### SQL 쿼리 (PostgreSQL/MySQL 기준)

#### Step 1: 발주 레벨 데이터 조회 (납품율 계산 포함)

```sql
WITH order_summary AS (
  SELECT
    o.order_id,
    o.delivery_request_no,
    o.contract_id,
    o.contract_date,
    o.client,
    o.project_name,

    -- 전체 발주 수량 (품목별 수량 합계)
    COALESCE(SUM(oi.quantity), 0) AS total_order_quantity,

    -- 단위 (첫 번째 품목의 단위 또는 통일된 단위)
    MAX(oi.unit) AS unit,

    -- 출하된 총 수량 (서브쿼리)
    (
      SELECT COALESCE(SUM(s.shipment_quantity), 0)
      FROM shipments s
      WHERE s.order_id = o.order_id
    ) AS total_shipped_quantity,

    -- 납품완료 수량 (delivery_confirmation.status = 'COMPLETED'인 출하 수량 합계)
    (
      SELECT COALESCE(SUM(s.shipment_quantity), 0)
      FROM shipments s
      INNER JOIN transports t ON s.shipment_id = t.shipment_id
      INNER JOIN delivery_confirmations dc ON t.transport_id = dc.transport_id
      WHERE s.order_id = o.order_id
        AND dc.status = 'COMPLETED'
    ) AS total_delivered_quantity

  FROM orders o
  LEFT JOIN order_items oi ON o.order_id = oi.order_id
  WHERE
    (:startDate IS NULL OR o.contract_date >= :startDate)
    AND (:endDate IS NULL OR o.contract_date <= :endDate)
    AND (:deliveryRequestNo IS NULL OR o.delivery_request_no LIKE CONCAT('%', :deliveryRequestNo, '%'))
  GROUP BY
    o.order_id,
    o.delivery_request_no,
    o.contract_id,
    o.contract_date,
    o.client,
    o.project_name
)
SELECT
  os.*,
  -- 납품율 계산
  CASE
    WHEN os.total_order_quantity > 0
    THEN ROUND((os.total_delivered_quantity * 100.0 / os.total_order_quantity), 2)
    ELSE 0
  END AS delivery_rate
FROM order_summary os
ORDER BY os.contract_date DESC
LIMIT :size OFFSET :offset;
```

#### Step 2: 각 발주의 출하 목록 조회

```sql
SELECT
  s.shipment_id,
  s.order_id,
  s.shipment_date,
  s.shipment_quantity,
  s.shipment_responsible,
  s.status,

  -- 품목 개수
  (SELECT COUNT(*)
   FROM shipment_items si
   WHERE si.shipment_id = s.shipment_id) AS item_count,

  -- 품목 요약 (예: "기포단열재 3개, 단열재B 2개")
  (
    SELECT STRING_AGG(CONCAT(i.item_name, ' ', si.quantity, i.unit), ', ')
    FROM shipment_items si
    INNER JOIN items i ON si.item_id = i.item_id
    WHERE si.shipment_id = s.shipment_id
    LIMIT 3
  ) AS item_summary

FROM shipments s
WHERE s.order_id IN (:orderIds)
ORDER BY s.shipment_date DESC;
```

#### Step 3: 각 출하의 운송/납품확인 조회

```sql
SELECT
  t.transport_id,
  t.shipment_id,
  t.tracking_number,
  t.vehicle_no,
  t.driver_name,
  t.driver_phone,
  t.delivery_address,
  t.address_detail,
  t.delivery_date,
  t.site_supervisor_name,
  t.site_supervisor_phone,
  t.status,

  -- 납품확인 정보 (LEFT JOIN)
  dc.delivery_id,
  dc.status AS delivery_status,
  dc.completed_at,
  dc.supervisor_signature_path,
  dc.photo_count,
  dc.latitude,
  dc.longitude

FROM transports t
LEFT JOIN delivery_confirmations dc ON t.transport_id = dc.transport_id
WHERE t.shipment_id IN (:shipmentIds)
ORDER BY t.transport_id;
```

### 쿼리 최적화 권장사항

1. **인덱스 생성**:
```sql
-- 발주 검색 최적화
CREATE INDEX idx_orders_contract_date ON orders(contract_date);
CREATE INDEX idx_orders_delivery_request_no ON orders(delivery_request_no);

-- 납품확인 상태 필터 최적화
CREATE INDEX idx_delivery_confirmations_status ON delivery_confirmations(status);

-- 조인 최적화
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_transports_shipment_id ON transports(shipment_id);
CREATE INDEX idx_delivery_confirmations_transport_id ON delivery_confirmations(transport_id);
```

2. **N+1 문제 방지**:
   - 발주 → 출하 → 운송을 별도 쿼리로 조회 후 애플리케이션 레벨에서 조립
   - 또는 한 번의 복잡한 JOIN 쿼리 사용 (데이터 중복 주의)

3. **대량 데이터 처리**:
   - 페이징 필수 (`LIMIT` + `OFFSET`)
   - 총 개수는 별도 쿼리로 조회 (`SELECT COUNT(*)`)

---

## 구현 가이드

### Spring Boot + JPA 예시

#### 1. Controller

```java
@RestController
@RequestMapping("/admin/deliveries")
public class DeliveryAdminController {

    @Autowired
    private DeliveryTreeService deliveryTreeService;

    /**
     * 납품 현황 트리 구조 조회
     */
    @GetMapping("/tree")
    public ResponseEntity<Page<OrderTreeDto>> getDeliveryTree(
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
        @RequestParam(required = false) String deliveryRequestNo,
        @RequestParam(required = false) String status,
        @PageableDefault(size = 10, sort = "contractDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<OrderTreeDto> result = deliveryTreeService.getDeliveryTree(
            startDate, endDate, deliveryRequestNo, status, pageable
        );
        return ResponseEntity.ok(result);
    }

    /**
     * 서명 이미지 조회
     */
    @GetMapping("/{deliveryId}/signature")
    public ResponseEntity<Resource> getSignature(@PathVariable Long deliveryId) {
        try {
            Resource resource = deliveryTreeService.getSignatureImage(deliveryId);
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
        } catch (FileNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 사진 조회
     */
    @GetMapping("/{deliveryId}/photos/{photoIndex}")
    public ResponseEntity<Resource> getPhoto(
        @PathVariable Long deliveryId,
        @PathVariable Integer photoIndex
    ) {
        try {
            Resource resource = deliveryTreeService.getPhoto(deliveryId, photoIndex);
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
        } catch (FileNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
```

#### 2. Service (N+1 방지 최적화)

```java
@Service
@Transactional(readOnly = true)
public class DeliveryTreeService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private TransportRepository transportRepository;

    /**
     * 트리 구조 조회 (Batch Fetching으로 N+1 방지)
     */
    public Page<OrderTreeDto> getDeliveryTree(
        LocalDate startDate, LocalDate endDate,
        String deliveryRequestNo, String status,
        Pageable pageable
    ) {
        // 1. 발주 목록 조회 (페이징 적용)
        Page<Order> orders = orderRepository.findOrdersWithDeliveryRate(
            startDate, endDate, deliveryRequestNo, pageable
        );

        if (orders.isEmpty()) {
            return Page.empty();
        }

        // 2. 발주 ID 목록 추출
        List<Long> orderIds = orders.stream()
            .map(Order::getOrderId)
            .collect(Collectors.toList());

        // 3. 모든 출하 데이터 Batch 조회 (N+1 방지)
        List<Shipment> shipments = shipmentRepository
            .findByOrderIdInOrderByShipmentDateDesc(orderIds);

        // 4. 모든 운송 데이터 Batch 조회 (N+1 방지)
        List<Long> shipmentIds = shipments.stream()
            .map(Shipment::getShipmentId)
            .collect(Collectors.toList());

        List<Transport> transports = transportRepository
            .findByShipmentIdInWithDeliveryConfirmation(shipmentIds);

        // 5. 데이터 조립 (Map을 활용한 O(1) 조회)
        Map<Long, List<Shipment>> shipmentsByOrderId = shipments.stream()
            .collect(Collectors.groupingBy(Shipment::getOrderId));

        Map<Long, Transport> transportByShipmentId = transports.stream()
            .collect(Collectors.toMap(Transport::getShipmentId, t -> t, (t1, t2) -> t1));

        // 6. DTO 변환
        List<OrderTreeDto> orderTrees = orders.stream()
            .map(order -> {
                OrderTreeDto dto = OrderTreeDto.fromEntity(order);

                // 출하 목록 설정
                List<ShipmentTreeDto> shipmentDtos = shipmentsByOrderId
                    .getOrDefault(order.getOrderId(), Collections.emptyList())
                    .stream()
                    .map(shipment -> {
                        ShipmentTreeDto shipmentDto = ShipmentTreeDto.fromEntity(shipment);

                        // 운송 정보 설정
                        Transport transport = transportByShipmentId.get(shipment.getShipmentId());
                        if (transport != null) {
                            shipmentDto.setTransport(TransportDetailDto.fromEntity(transport));
                        }

                        return shipmentDto;
                    })
                    .collect(Collectors.toList());

                dto.setShipments(shipmentDtos);
                return dto;
            })
            .collect(Collectors.toList());

        return new PageImpl<>(orderTrees, pageable, orders.getTotalElements());
    }

    /**
     * 서명 이미지 조회
     */
    public Resource getSignatureImage(Long deliveryId) throws FileNotFoundException {
        DeliveryConfirmation delivery = deliveryConfirmationRepository
            .findById(deliveryId)
            .orElseThrow(() -> new FileNotFoundException("Delivery not found"));

        if (delivery.getSupervisorSignaturePath() == null) {
            throw new FileNotFoundException("Signature not found");
        }

        Path filePath = Paths.get(delivery.getSupervisorSignaturePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new FileNotFoundException("Signature file not found");
        }

        return resource;
    }

    /**
     * 사진 조회
     */
    public Resource getPhoto(Long deliveryId, Integer photoIndex) throws FileNotFoundException {
        DeliveryConfirmation delivery = deliveryConfirmationRepository
            .findById(deliveryId)
            .orElseThrow(() -> new FileNotFoundException("Delivery not found"));

        if (photoIndex < 1 || photoIndex > delivery.getPhotoCount()) {
            throw new FileNotFoundException("Photo index out of range");
        }

        // 사진 파일 경로 가져오기 (구현 방식은 프로젝트에 따라 다름)
        String photoPath = delivery.getPhotoPath(photoIndex);

        Path filePath = Paths.get(photoPath);
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new FileNotFoundException("Photo file not found");
        }

        return resource;
    }
}
```

#### 3. Repository

```java
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o " +
           "WHERE (:startDate IS NULL OR o.contractDate >= :startDate) " +
           "AND (:endDate IS NULL OR o.contractDate <= :endDate) " +
           "AND (:deliveryRequestNo IS NULL OR o.deliveryRequestNo LIKE %:deliveryRequestNo%) " +
           "ORDER BY o.contractDate DESC")
    Page<Order> findOrdersWithDeliveryRate(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("deliveryRequestNo") String deliveryRequestNo,
        Pageable pageable
    );
}

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    List<Shipment> findByOrderIdInOrderByShipmentDateDesc(List<Long> orderIds);
}

public interface TransportRepository extends JpaRepository<Transport, Long> {

    @Query("SELECT t FROM Transport t " +
           "LEFT JOIN FETCH t.deliveryConfirmation " +
           "WHERE t.shipmentId IN :shipmentIds")
    List<Transport> findByShipmentIdInWithDeliveryConfirmation(@Param("shipmentIds") List<Long> shipmentIds);
}
```

---

## 테스트 시나리오

### 1. 정상 케이스

**시나리오**: 발주 10건, 각 발주당 평균 3개 출하, 납품율 다양

**Expected Result**:
- 200 OK
- `totalElements`: 10
- `content[]` 길이: 10
- 각 `order`의 `deliveryRate`가 0~100 범위
- 각 `shipment`에 `transport` 존재

### 2. 빈 결과

**시나리오**: 검색 조건에 맞는 발주 없음

**Expected Result**:
- 200 OK
- `totalElements`: 0
- `content`: []

### 3. 페이징

**시나리오**: 총 25건의 발주, `size=10`

**Request 1**: `page=0&size=10`
**Expected**: `content` 10건, `first=true`, `last=false`

**Request 2**: `page=1&size=10`
**Expected**: `content` 10건, `first=false`, `last=false`

**Request 3**: `page=2&size=10`
**Expected**: `content` 5건, `first=false`, `last=true`

### 4. 납품율 계산 검증

**시나리오**:
- 발주 수량: 1000개
- 출하 1: 500개 (납품완료)
- 출하 2: 300개 (운송중)

**Expected**:
- `totalOrderQuantity`: 1000
- `totalShippedQuantity`: 800
- `totalDeliveredQuantity`: 500
- `deliveryRate`: 50.0

### 5. 서명/사진 조회

**시나리오**: `deliveryId=456`, 사진 3장

**Request**: `GET /admin/deliveries/456/signature`
**Expected**: 200 OK, PNG 이미지

**Request**: `GET /admin/deliveries/456/photos/1`
**Expected**: 200 OK, JPEG 이미지

**Request**: `GET /admin/deliveries/456/photos/10`
**Expected**: 404 Not Found

---

## 부록: 추가 고려사항

### 1. 성능 최적화

- **캐싱**: 자주 조회되는 발주 데이터는 Redis 캐싱 고려
- **비동기 처리**: 대량 데이터 조회 시 비동기 API 제공
- **부분 로딩**: 프론트에서 필요한 경우에만 출하/운송 데이터 조회 (Lazy Loading)

### 2. 보안

- **인증/인가**: JWT 또는 세션 기반 인증 필수
- **권한 검증**: 관리자만 조회 가능하도록 Role 체크
- **파일 접근 제어**: 서명/사진 파일 다운로드 시 권한 확인

### 3. 확장성

- **필터 추가**: 프로젝트명, 고객사명, 출하 상태 등 추가 필터
- **통계 API**: 전체 납품율, 기간별 납품 추이 등 별도 API
- **Excel 다운로드**: 트리 구조를 평면화하여 엑셀 다운로드 기능

---

## 문의 및 피드백

본 문서에 대한 질문이나 수정 사항은 백엔드 개발팀에게 전달해 주세요.

**작성자**: 프론트엔드 개발팀
**최종 수정**: 2025-10-30

---

## 🚨 추가 수정 요청사항

### 출하 상세 조회 API - 수요기관 정보 누락 문제

#### API 엔드포인트
```
GET /admin/shipments/{shipmentId}
```

#### 현재 문제
- ❌ 응답에서 `clientNo` (기관번호) 필드가 비어있음
- ❌ 응답에서 `clientManagerName` (담당자명) 필드가 비어있음
- ❌ 프론트엔드 출하 수정 화면에서 두 필드가 "-"로 표시됨

#### 원인 분석
출하 정보를 조회할 때 `delivery_order` 테이블의 `demand_organization_id`를 사용하여 `demand_organization` 테이블과 JOIN하지 않아서 수요기관 상세 정보가 누락되고 있습니다.

#### 필요한 수정사항

##### 데이터베이스 쿼리 수정
```sql
-- ❌ 현재 (추정)
SELECT
  s.shipment_id,
  s.order_id,
  s.shipment_date,
  s.tracking_number,
  s.status,
  o.contract_id,
  o.contract_date,
  o.delivery_request_no,
  o.delivery_request_date,
  o.project_name,
  o.client AS client,  -- 단순 문자열만 가져옴
  '' AS client_no,     -- ⚠️ 비어있음
  '' AS client_manager_name  -- ⚠️ 비어있음
FROM shipment s
JOIN delivery_order o ON s.order_id = o.order_id
WHERE s.shipment_id = ?

-- ✅ 수정 필요
SELECT
  s.shipment_id,
  s.order_id,
  s.shipment_date,
  s.tracking_number,
  s.status,
  o.contract_id,
  o.contract_date,
  o.delivery_request_no,
  o.delivery_request_date,
  o.project_name,
  o.client AS client,
  do.business_registration_number AS client_no,  -- ✅ demand_organization에서 가져오기
  do.contact_person AS client_manager_name,      -- ✅ demand_organization에서 가져오기
  do.postal_code AS client_postal_code,
  do.address AS client_address,
  do.phone_number AS client_phone_number,
  do.fax_number AS client_fax_number
FROM shipment s
JOIN delivery_order o ON s.order_id = o.order_id
LEFT JOIN demand_organization do ON o.demand_organization_id = do.organization_id
WHERE s.shipment_id = ?
```

##### 응답 JSON 형식 (기대값)
```json
{
  "shipmentId": 123,
  "orderId": 456,
  "shipmentDate": "2025-10-26",
  "trackingNumber": "20251029-1234-001",
  "status": "준비",
  "contractId": "제00-22-7-0305-01호",
  "contractDate": "2024-07-02",
  "deliveryRequestNo": "35-24-3-41787-00",
  "deliveryRequestDate": "2024-07-02",
  "projectName": "군산시광역해양레저체험복합단지조성사업",
  "client": "한국농어촌공사 전북지역본부 군산지사",
  "clientNo": "4038207678",           // ⭐ 이 필드가 반드시 포함되어야 함
  "clientManagerName": "김중철",       // ⭐ 이 필드가 반드시 포함되어야 함
  "clientPostalCode": "54176",
  "clientAddress": "전라북도 군산시 옥산면...",
  "clientPhoneNumber": "063-440-5916",
  "clientFaxNumber": "063-463-8426",
  "items": [
    {
      "skuId": "23561443",
      "itemName": "기포단열재",
      "skuName": "JYGB-100LC2",
      "specification": "폴리우레탄기포단열재,정질2종2호,1000×1000×100mm",
      "unit": "m²",
      "orderQuantity": 873,
      "shipmentQuantity": 373,
      "unitPrice": 34000
    }
  ]
}
```

#### 프론트엔드 참조 코드
- **파일**: `pages/admin/shipping/edit/[id].vue`
- **라인 163**: `<input :value="formData.clientNo || '-'" readonly />`
- **라인 171**: `<input :value="formData.clientManagerName || '-'" readonly />`
- **타입 정의**: `services/shipment.service.ts:78-99` (ShipmentDetailWithOrder 인터페이스)

#### 우선순위
**🔴 높음** - 사용자가 출하 수정 화면에서 수요기관 정보를 확인할 수 없는 문제

#### 테스트 방법
1. API 수정 후 `GET /admin/shipments/{shipmentId}` 호출
2. 응답에 `clientNo`와 `clientManagerName` 필드가 올바른 값으로 포함되어 있는지 확인
3. 프론트엔드 출하 수정 페이지 (`/admin/shipping/edit/{id}`)에서 기관번호와 담당자가 제대로 표시되는지 확인

#### 영향받는 페이지
- 출하 관리 > 출하 수정 (`/admin/shipping/edit/[id]`)

#### 요청일자
2025-11-01
