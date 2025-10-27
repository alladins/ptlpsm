# 출하관리 API 수정 가이드

## 🎯 목적
출하 목록 조회 API(`GET /admin/shipments`)에 다음 필드를 추가하여 프론트엔드에서 표시할 수 있도록 함:
- 계약일자
- 납품요구일자
- 수요기관명
- 사업명
- 출하금액 (모든 출하품목의 금액 합계)

---

## 📋 API 응답 구조 변경

### 현재 응답
```json
{
  "content": [
    {
      "shipmentId": 1,
      "orderId": 21,
      "deliveryRequestNo": "24-22-4-42067-00",
      "shipmentDate": "2025-10-12",
      "shipmentQuantity": 1536,
      "trackingNumber": "20251021-1111-001",
      "status": "진행중",
      "createdBy": "system",
      "createdAt": "2025-10-12T06:10:00",
      "updatedBy": "system",
      "updatedAt": "2025-10-21T08:36:00"
    }
  ],
  "totalElements": 2,
  "totalPages": 1,
  "pageNumber": 0,
  "pageSize": 10
}
```

### 변경 후 응답 (추가 필드)
```json
{
  "content": [
    {
      "shipmentId": 1,
      "orderId": 21,
      "deliveryRequestNo": "24-22-4-42067-00",
      "shipmentDate": "2025-10-12",
      "shipmentQuantity": 1536,
      "trackingNumber": "20251021-1111-001",
      "status": "진행중",
      "createdBy": "system",
      "createdAt": "2025-10-12T06:10:00",
      "updatedBy": "system",
      "updatedAt": "2025-10-21T08:36:00",

      "contractDate": "2024-07-02",
      "deliveryRequestDate": "2024-07-02",
      "clientName": "한국농어촌공사 전북지역본부 군산지사",
      "projectName": "군산시광역해양레저체험복합단지조성사업",
      "totalAmount": 52704000
    }
  ],
  "totalElements": 2,
  "totalPages": 1,
  "pageNumber": 0,
  "pageSize": 10
}
```

---

## 🗄️ 데이터베이스 쿼리 수정

### 가정하는 테이블 구조
- `shipments` - 출하 정보
- `orders` - 발주 정보
- `shipment_items` - 출하 품목
- `order_items` - 발주 품목

### SQL 쿼리 예시 (PostgreSQL/MySQL)

```sql
SELECT
    s.shipment_id,
    s.order_id,
    s.delivery_request_no,
    s.shipment_date,
    s.shipment_quantity,
    s.tracking_number,
    s.status,
    s.created_by,
    s.created_at,
    s.updated_by,
    s.updated_at,

    -- 발주 테이블에서 JOIN
    o.contract_date,
    o.delivery_request_date,
    o.client_name,
    o.project_name,

    -- 출하금액 계산: Σ(출하품목.수량 × 발주품목.단가)
    COALESCE(
        (SELECT SUM(si.shipment_quantity * oi.unit_price)
         FROM shipment_items si
         JOIN order_items oi ON si.order_item_id = oi.id
         WHERE si.shipment_id = s.shipment_id),
        0
    ) AS total_amount

FROM shipments s
LEFT JOIN orders o ON s.order_id = o.id
WHERE 1=1
    -- 검색 조건
    AND s.shipment_date BETWEEN :startDate AND :endDate
    AND (:deliveryRequestNo IS NULL OR s.delivery_request_no = :deliveryRequestNo)
    AND (:status IS NULL OR s.status = :status)
ORDER BY s.shipment_date DESC, s.shipment_id DESC
LIMIT :size OFFSET :offset;
```

### JPA/Hibernate JPQL 예시

```java
@Query("SELECT new com.example.dto.ShipmentListItemDto(" +
       "s.shipmentId, s.orderId, s.deliveryRequestNo, s.shipmentDate, " +
       "s.shipmentQuantity, s.trackingNumber, s.status, " +
       "s.createdBy, s.createdAt, s.updatedBy, s.updatedAt, " +
       "o.contractDate, o.deliveryRequestDate, o.clientName, o.projectName, " +
       "COALESCE(SUM(si.shipmentQuantity * oi.unitPrice), 0)) " +
       "FROM Shipment s " +
       "LEFT JOIN Order o ON s.orderId = o.id " +
       "LEFT JOIN ShipmentItem si ON si.shipmentId = s.shipmentId " +
       "LEFT JOIN OrderItem oi ON si.orderItemId = oi.id " +
       "WHERE s.shipmentDate BETWEEN :startDate AND :endDate " +
       "AND (:deliveryRequestNo IS NULL OR s.deliveryRequestNo = :deliveryRequestNo) " +
       "AND (:status IS NULL OR s.status = :status) " +
       "GROUP BY s.shipmentId, s.orderId, s.deliveryRequestNo, s.shipmentDate, " +
       "s.shipmentQuantity, s.trackingNumber, s.status, " +
       "s.createdBy, s.createdAt, s.updatedBy, s.updatedAt, " +
       "o.contractDate, o.deliveryRequestDate, o.clientName, o.projectName " +
       "ORDER BY s.shipmentDate DESC, s.shipmentId DESC")
Page<ShipmentListItemDto> findShipmentsWithDetails(
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate,
    @Param("deliveryRequestNo") String deliveryRequestNo,
    @Param("status") String status,
    Pageable pageable
);
```

---

## 📦 DTO 클래스 수정

### Java DTO 예시

```java
package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentListItemDto {
    private Long shipmentId;
    private Long orderId;
    private String deliveryRequestNo;
    private LocalDate shipmentDate;
    private Integer shipmentQuantity;
    private String trackingNumber;
    private String status;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    // ===== 추가 필드 =====
    private LocalDate contractDate;         // 계약일자
    private LocalDate deliveryRequestDate;  // 납품요구일자
    private String clientName;              // 수요기관명
    private String projectName;             // 사업명
    private Long totalAmount;               // 출하금액 (Σ(출하품목.수량 × 단가))
}
```

---

## 🔧 컨트롤러 수정 예시

```java
@RestController
@RequestMapping("/admin/shipments")
public class ShipmentController {

    @Autowired
    private ShipmentService shipmentService;

    @GetMapping
    public ResponseEntity<Page<ShipmentListItemDto>> getShipments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String deliveryRequestNo,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ShipmentListItemDto> result = shipmentService.getShipmentsWithDetails(
            startDate, endDate, deliveryRequestNo, status, pageable
        );
        return ResponseEntity.ok(result);
    }
}
```

---

## ✅ 테스트 체크리스트

### 1. 데이터 검증
- [ ] `contractDate`가 올바르게 조회되는가?
- [ ] `deliveryRequestDate`가 올바르게 조회되는가?
- [ ] `clientName`이 올바르게 조회되는가?
- [ ] `projectName`이 올바르게 조회되는가?
- [ ] `totalAmount`가 정확히 계산되는가?
  - 예: 출하품목A (수량: 100, 단가: 10,000) + 출하품목B (수량: 50, 단가: 20,000) = 2,000,000

### 2. 성능 검증
- [ ] JOIN으로 인한 성능 저하가 없는가?
- [ ] 인덱스가 적절히 설정되어 있는가? (shipments.order_id, shipment_items.shipment_id)

### 3. 엣지 케이스
- [ ] 출하품목이 없는 경우 `totalAmount`가 0으로 반환되는가?
- [ ] 발주 정보가 없는 경우 (LEFT JOIN) null 처리가 올바른가?

---

## 📞 문의사항

프론트엔드 개발자 연락처: [연락처 입력]

백엔드 수정 완료 후 프론트엔드에 알려주시기 바랍니다.
