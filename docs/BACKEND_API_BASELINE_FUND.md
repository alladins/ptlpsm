# 기성금/자금관리 Backend API 명세

> 작성일: 2025-12-16
> 백엔드 서버에서 구현 완료된 API 목록

---

## 1. Baseline (기성 차수) API

### 1.1 발주별 기성 차수 목록 조회
```
GET /api/admin/baselines/order/{orderId}
```

**Response:**
```json
[
  {
    "baselineId": 1,
    "baselineType": "PROGRESS",
    "baselineSeq": 1,
    "baselineDate": "2024-03-15",
    "totalQuantity": 1000,
    "totalAmount": 50000000,
    "status": "CONFIRMED"
  }
]
```

---

### 1.2 청구 가능 출하 목록 조회
```
GET /api/admin/baselines/order/{orderId}/available-shipments
```

**설명:** 납품확인(인수증 서명) 완료되었으나 아직 기성 청구에 포함되지 않은 출하 목록

**Response:**
```json
[
  {
    "shipmentId": 101,
    "shipmentDate": "2024-03-10",
    "itemName": "폴리우레탄 단열재",
    "quantity": 500,
    "amount": 25000000,
    "deliveryConfirmationId": 50,
    "deliveryConfirmedAt": "2024-03-12T14:30:00"
  }
]
```

---

### 1.3 기성 차수 생성
```
POST /api/admin/baselines
```

**Request Body:**
```json
{
  "orderId": 1,
  "baselineType": "PROGRESS",
  "shipmentIds": [101, 102, 103],
  "baselineDate": "2024-03-15",
  "remarks": "1차 기성"
}
```

**설명:**
- `baselineType`: "PROGRESS" (기성) 또는 "FINAL" (납품완료)
- `shipmentIds`: 이번 차수에 포함할 출하 ID 목록 (available-shipments에서 선택)

---

### 1.4 기성 차수 상세 조회
```
GET /api/admin/baselines/{baselineId}
```

**Response:**
```json
{
  "baselineId": 1,
  "orderId": 1,
  "baselineType": "PROGRESS",
  "baselineSeq": 1,
  "baselineDate": "2024-03-15",
  "totalQuantity": 1000,
  "totalAmount": 50000000,
  "status": "CONFIRMED",
  "shipments": [
    {
      "shipmentId": 101,
      "itemName": "폴리우레탄 단열재",
      "quantity": 500,
      "amount": 25000000
    }
  ],
  "deliveryConfirmation": {
    "confirmationId": 1,
    "pdfUrl": "/api/files/delivery-confirmation-1.pdf"
  }
}
```

---

### 1.5 납품확인서 조회
```
GET /api/admin/baselines/{baselineId}/delivery-confirmation
```

---

## 2. Fund (자금관리) API

### 2.1 기성금 요청 목록 조회
```
GET /api/admin/funds/{fundId}/payments
```

**Response:**
```json
[
  {
    "requestId": 1,
    "baselineId": 1,
    "baselineSeq": 1,
    "requestDate": "2024-03-16",
    "requestAmount": 50000000,
    "status": "PENDING",
    "requestedBy": "홍길동"
  }
]
```

**상태값 (status):**
- `PENDING`: 요청됨
- `APPROVED`: 승인됨
- `CONFIRMED`: 수금확인
- `REJECTED`: 반려됨

---

### 2.2 기성금 요청 생성
```
POST /api/admin/funds/{fundId}/payments
```

**Request Body:**
```json
{
  "baselineId": 1,
  "requestAmount": 50000000,
  "requestDate": "2024-03-16",
  "remarks": "1차 기성금 요청"
}
```

---

### 2.3 기성금 승인
```
POST /api/admin/funds/{fundId}/payments/{requestId}/approve
```

**Request Body:**
```json
{
  "approvedAmount": 50000000,
  "approvalDate": "2024-03-17",
  "remarks": "승인"
}
```

---

### 2.4 기성금 수금 확인
```
POST /api/admin/funds/{fundId}/payments/{requestId}/confirm
```

**Request Body:**
```json
{
  "confirmedAmount": 50000000,
  "confirmDate": "2024-03-20",
  "bankAccount": "기업은행 123-456-789",
  "remarks": "입금확인"
}
```

---

## 3. 비즈니스 플로우

### 기성금 청구 프로세스

```
1. 발주 등록
   ↓
2. 출하 등록 및 진행
   ↓
3. 운송 진행
   ↓
4. 납품확인 (모바일 인수증 서명)
   ↓
5. 기성 청구 가능 출하 조회
   GET /api/admin/baselines/order/{orderId}/available-shipments
   ↓
6. 기성 차수 생성 (출하 선택)
   POST /api/admin/baselines
   ↓
7. 기성금 요청 생성
   POST /api/admin/funds/{fundId}/payments
   ↓
8. 기성금 승인
   POST /api/admin/funds/{fundId}/payments/{requestId}/approve
   ↓
9. 수금 확인
   POST /api/admin/funds/{fundId}/payments/{requestId}/confirm
```

---

## 4. 프론트엔드 연동 시 주의사항

### 4.1 ProgressPaymentModal 수정 필요

**현재 상태:**
- `baselineStore.getCurrentQuantities()` 사용 (자동 계산된 수량)

**수정 방향:**
- `GET /api/admin/baselines/order/{orderId}/available-shipments` 사용
- 청구 가능한 출하 목록을 체크박스로 표시
- 사용자가 선택한 출하들로 기성 차수 생성

### 4.2 필드명 매핑

| Modal 현재 필드 | API 응답 필드 |
|---------------|--------------|
| `orderedQty` | `orderedQuantity` |
| `confirmedQty` | `previousConfirmedQuantity` |
| `deliveredQty` | `currentDeliveredQuantity` |

### 4.3 Endpoint 파일 위치

- `services/api/endpoints/baseline.endpoints.ts`
- `services/baseline.service.ts`
- `stores/baseline.ts`

---

## 5. 향후 구현 예정 API (참고)

### 5.1 OEM 지급 관련
```
GET  /api/admin/funds/{fundId}/oem-payments
POST /api/admin/funds/{fundId}/oem-payments
```

### 5.2 선급금 관련
```
GET  /api/admin/funds/{fundId}/advances
POST /api/admin/funds/{fundId}/advances
```

### 5.3 잔금 관련
```
GET  /api/admin/funds/{fundId}/balance
POST /api/admin/funds/{fundId}/balance/request
```
