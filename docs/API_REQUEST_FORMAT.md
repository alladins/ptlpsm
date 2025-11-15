# 납품요구 등록/수정 API 요청 데이터 포맷

## 📌 개요
납품요구 등록 및 수정 시 프론트엔드에서 서버로 전송하는 데이터 포맷입니다.

---

## 1️⃣ 등록 API

### Endpoint
```
POST /api/admin/contract/upload-pdf
```

### Content-Type
```
multipart/form-data
```

### Request Body

#### FormData 구조
```javascript
{
  file: File,              // PDF 파일 (선택사항)
  // 또는 직접 데이터 전송
}
```

#### JSON 데이터 구조 (contractData)

```json
{
  "extractedContractInfo": {
    "contractNumber": "제00-22-7-0305-01호",
    "contractDate": "2024-07-02",
    "salesRepresentative": null,
    "preNotificationNumber": "AN...",
    "deliveryRequestNumber": "35-24-3-41787-00",
    "requestingAgency": "한국농어촌공사 전북지역본부 군산지사",
    "requestingAgencyNumber": "4038207678",
    "requestingAgencyPhoneNumber": "063-440-5916",
    "requestingAgencyFaxNumber": "063-463-8426",
    "requestingAgencyPostalCode": "54176",
    "requestingAgencyAddress": "전라북도 군산시 옥산면 ...",
    "requestingAgencyContactPerson": "김중철",
    "phoneNumber": null,
    "faxNumber": null,
    "address": null,
    "naraJangteoNumber": "D150324",
    "defectWarrantyPeriod": "2년",
    "paymentMethod": "대지급",
    "deliveryRequestDate": "2024-07-02",
    "businessName": "군산시광역해양레저체험복합단지조성사업 폴리우레탄...",
    "progressStatus": null,
    "remark": null,
    "contractor": null,
    "representativeName": null,
    "businessRegistrationNumber": null,
    "businessRegistrationNumberDemand": null,
    "businessRegistrationNumberSupplier": null,
    "itemTotalAmount": "271309660",
    "commission": "1465070",
    "totalAmount": "272774730",
    "quantityTotal": "31571",
    "preDiscountAmountTotal": "726108000",
    "partialDelivery": "가능",
    "inspectionAgency": "한국농어촌공사 전북지역본부...",
    "acceptanceAgency": "한국농어촌공사 전북지역본부...",
    "siteManagerId": 123,
    "builder": "ABC건설"
  },
  "extractedDeliveryItems": [
    {
      "sequenceNumber": 1,
      "optionItemNumber": "",
      "itemClassificationNumber": "30141503",
      "itemIdentificationNumber": "25312984",
      "name": "기포단열재",
      "specification": "폴리우레탄기포단열재, 정 ... 1000×1000×80mm, 경질2종2호",
      "unit": "m²",
      "unitPrice": "29000",
      "quantity": "827",
      "totalAmount": "23983000",
      "deliveryLocation": "수요기관 지정장소",
      "deliveryDeadline": "2025-12-19",
      "deliveryTerms": "공장상차도",
      "inspectionExemption": "N",
      "midTermCompetitionItem": "N"
    }
  ],
  "createdBy": "",
  "pdfFilePath": "/uploads/contracts/2024/..."
}
```

---

## 2️⃣ 수정 API

### Endpoint
```
PUT /api/admin/orders/{orderId}
```

### Content-Type
```
multipart/form-data
```

### Request Body

#### FormData 구조
```javascript
{
  order: Blob(JSON.stringify(orderData), { type: 'application/json' })
}
```

#### JSON 데이터 구조 (orderData)

```json
{
  "salesId": 123,
  "contractId": "제00-22-7-0305-01호",
  "contractDate": "2024-07-02",
  "preNotificationNo": "AN...",
  "deliveryRequestNo": "35-24-3-41787-00",
  "client": "한국농어촌공사 전북지역본부 군산지사",
  "clientManagerName": "김중철",
  "clientNo": "4038207678",
  "clientPostalCode": "54176",
  "clientAddress": "전라북도 군산시 옥산면 ...",
  "clientPhoneNumber": "063-440-5916",
  "clientFaxNumber": "063-463-8426",
  "naraJangteoNo": "D150324",
  "warrantyPeriod": "2년",
  "paymentMethod": "대지급",
  "deliveryRequestDate": "2024-07-02",
  "projectName": "군산시광역해양레저체험복합단지조성사업 ...",
  "itemTotalAmount": "271309660",
  "commission": "1465070",
  "totalAmount": "272774730",
  "partialDelivery": "가능",
  "inspectionAgency": "한국농어촌공사 전북지역본부...",
  "acceptanceAgency": "한국농어촌공사 전북지역본부...",
  "siteManagerId": 123,
  "builder": "ABC건설",
  "items": [
    {
      "itemOrder": 1,
      "skuId": "SKU001",
      "itemId": "ITEM001",
      "itemName": "기포단열재",
      "skuName": "기포단열재-SKU001",
      "name": "기포단열재",
      "specification": "폴리우레탄기포단열재, 1000×1000×80mm",
      "unit": "m²",
      "unitPrice": "29000",
      "quantity": 827,
      "totalAmount": "23983000",
      "deliveryLocation": "수요기관 지정장소",
      "deliveryDeadline": "2025-12-19",
      "deliveryTerms": "공장상차도"
    }
  ]
}
```

---

## 3️⃣ 새로 추가된 필드 (2025-01-13 수정)

### `siteManagerId`
- **타입**: `number | null`
- **설명**: 현장소장 사용자 ID (users 테이블의 id FK)
- **예시**: `123`
- **필수**: 아니오
- **위치**:
  - 등록: `extractedContractInfo.siteManagerId`
  - 수정: `siteManagerId` (루트 레벨)
- **참고**: ROLE이 `SITE_MANAGER`인 사용자의 ID

### `builder`
- **타입**: `string | null`
- **설명**: 시공사명 (회사명)
- **예시**: `"ABC건설"`
- **필수**: 아니오
- **위치**:
  - 등록: `extractedContractInfo.builder`
  - 수정: `builder` (루트 레벨)
- **참고**: 현장소장 선택 시 자동으로 해당 사용자의 companyName이 입력됨

---

## 4️⃣ 데이터베이스 스키마 (서버 개발자용)

### delivery_done 테이블

#### 관련 컬럼 (이미 존재)
```sql
-- 현장소장 ID (FK to users.id)
site_manager_id BIGINT(20) DEFAULT NULL COMMENT '현장소장 아이디'

-- 시공사명
builder VARCHAR(100) DEFAULT NULL COMMENT '시공사명'
```

#### 확인 쿼리
```sql
SELECT column_name, data_type, column_type, is_nullable, column_comment
FROM information_schema.columns
WHERE table_name = 'delivery_done'
AND column_name IN ('site_manager_id', 'builder');
```

#### 주의사항
- `site_manager_id`는 `users` 테이블의 `id`를 참조하는 외래키입니다.
- 해당 사용자의 ROLE은 `SITE_MANAGER`이어야 합니다.
- `builder`는 현장소장 선택 시 자동으로 입력되는 회사명입니다.

---

## 5️⃣ 프론트엔드 구현 참고

### 등록 페이지 (`pages/admin/order/register.vue`)
```typescript
const contractData = {
  extractedContractInfo: {
    // ... 기존 필드들
    siteManagerId: contractForm.value.siteManagerId,  // number | null
    builder: contractForm.value.builder || null        // string | null
  },
  extractedDeliveryItems: items.value.map((item, index) => ({
    // ... 품목 정보
  })),
  createdBy: '',
  pdfFilePath: contractForm.value.pdfFilePath
}

const result = await contractService.registerContract(contractData)
```

### 수정 페이지 (`pages/admin/order/edit/[id].vue`)
```typescript
const updateData = {
  salesId: orderData.value!.salesId,
  contractId: orderData.value!.contractId,
  // ... 기존 필드들
  siteManagerId: formData.value.siteManagerId,   // number | null
  builder: formData.value.builder || null,       // string | null
  items: orderData.value!.items.map((item, index) => ({
    // ... 품목 정보
  }))
}

const formDataToSend = new FormData()
const orderBlob = new Blob([JSON.stringify(updateData)], {
  type: 'application/json'
})
formDataToSend.append('order', orderBlob)

await orderService.updateOrder(orderId.value, formDataToSend)
```

---

## 6️⃣ 타입 정의 (TypeScript)

### OrderDetailResponse
```typescript
export interface OrderDetailResponse extends OrderResponse {
  // ... 기존 필드들
  siteManagerId?: number    // 현장소장 ID
  builder?: string          // 시공사명
  items: OrderDetailItem[]
}
```

### OrderCreateRequest
```typescript
export interface OrderCreateRequest {
  // ... 기존 필드들
  partialDelivery: string
  inspectionAgency: string
  acceptanceAgency: string
  siteManagerId?: number    // 현장소장 ID
  builder?: string          // 시공사명
  items: OrderItemCreateRequest[]
}
```

---

## 7️⃣ 사용자 흐름

1. **등록 시**:
   - 사용자가 PDF 업로드 → 자동으로 데이터 추출
   - 현장소장 드롭다운에서 선택 (사용자 이름 표시)
   - 선택 시 해당 사용자의 ID(`siteManagerId`)와 회사명(`builder`)이 자동으로 설정됨
   - 등록 버튼 클릭 → `siteManagerId`, `builder` 포함하여 전송

2. **수정 시**:
   - 리스트에서 클릭 → 수정 페이지 이동
   - 기존 현장소장 정보 복원 (ID로 드롭다운 선택됨)
   - 현장소장 변경 → 회사명 자동 업데이트
   - 저장 버튼 클릭 → `siteManagerId`, `builder` 포함하여 전송

---

## 8️⃣ 참고 사항

- 현장소장 정보는 선택사항(optional)입니다.
- 현장소장을 선택하지 않으면 `siteManagerId`는 `null`, `builder`는 `null` 또는 빈 문자열로 전송됩니다.
- `siteManagerId`는 `users` 테이블의 `id`를 참조하며, 해당 사용자의 ROLE은 `SITE_MANAGER`이어야 합니다.
- `builder`(시공사명)는 현장소장 선택 시 자동으로 입력되며, 사용자가 직접 수정할 수 없습니다 (readonly).
- 프론트엔드에서는 `userService.getUsersByRoles(['SITE_MANAGER'])`로 현장소장 목록을 조회합니다.
- 드롭다운에는 사용자 이름(`userName`)이 표시되지만, 실제 전송되는 값은 사용자 ID(`id`)입니다.
