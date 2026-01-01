# 납품완료계 시스템 백엔드 API 개발 명세서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [워크플로우](#워크플로우)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [API 엔드포인트](#api-엔드포인트)
5. [JSON 데이터 포맷](#json-데이터-포맷)
6. [PDF 생성](#pdf-생성)
7. [메시지 발송](#메시지-발송)
8. [에러 처리](#에러-처리)

---

## 시스템 개요

### 목적
조달청 나라장터 계약에 따른 납품완료계 작성 및 관리 시스템

### 핵심 기능
1. **자동 생성**: 발주 생성 시 delivery_done 레코드 자동 생성 (PENDING 상태)
2. **상태 관리**: 5단계 상태 자동 전환 (PENDING → IN_PROGRESS → PENDING_SIGNATURE → COMPLETED → SUBMITTED)
3. **이중 승인**: 현장 소장 서명 + 현장감리원 서명
4. **PDF 생성**: 3개 PDF 자동 생성 (납품확인서, 납품완료계, 사진대지)
5. **토큰 인증**: 모바일 서명 페이지 접근용 토큰 생성 및 검증

### 기술 스택
- **프레임워크**: Spring Boot (Java)
- **데이터베이스**: MariaDB
- **PDF 엔진**: Flying Saucer (iText)
- **템플릿 엔진**: Handlebars
- **메시지**: 카카오톡 알림톡 / SMS

---

## 워크플로우

### 전체 프로세스

```
1. 발주 생성 (order 테이블 INSERT)
   ↓
   [자동] delivery_done 레코드 생성 (status: PENDING)

2. 첫 출하 등록 (shipment 테이블 INSERT)
   ↓
   [자동] delivery_done 상태 변경 (status: IN_PROGRESS)

3. 모든 납품확인 완료 (delivery 테이블의 모든 레코드가 COMPLETED)
   ↓
   [자동] delivery_done 상태 변경 (status: PENDING_SIGNATURE)
   ↓
   [관리자] "메시지 발송" 버튼 활성화

4. 관리자가 시공사/감리원에게 서명 URL 발송
   ↓
   [시스템] 토큰 생성 및 카카오톡/SMS 발송

5. 시공사 대표 모바일 서명 (인감)
   ↓
   [API] contractor_signature_image 저장
   ↓
   contractor_signed_at 기록

6. 현장감리원 모바일 서명
   ↓
   [API] supervisor_signature_image 저장
   ↓
   supervisor_signed_at 기록

7. 양쪽 서명 완료 시
   ↓
   [자동] delivery_done 상태 변경 (status: COMPLETED)
   ↓
   [자동] 3개 PDF 생성
     - confirmation_pdf_url (납품확인서)
     - completion_pdf_url (납품완료계)
     - photo_sheet_pdf_url (사진대지)

8. 관리자가 조달청 제출
   ↓
   [API] delivery_done 상태 변경 (status: SUBMITTED)
   ↓
   submitted_at 기록
```

### 상태 전환 규칙

| 현재 상태 | 다음 상태 | 전환 조건 | 자동/수동 |
|---------|---------|---------|----------|
| PENDING | IN_PROGRESS | 첫 출하 등록 | 자동 |
| IN_PROGRESS | PENDING_SIGNATURE | 모든 납품확인 완료 | 자동 |
| PENDING_SIGNATURE | COMPLETED | 양쪽 서명 완료 | 자동 |
| COMPLETED | SUBMITTED | 조달청 제출 버튼 클릭 | 수동 |

---

## 데이터베이스 스키마

### 1. delivery_done (납품완료계 메인 테이블)

```sql
CREATE TABLE delivery_done (
  delivery_done_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '납품완료계 ID',
  order_id BIGINT NOT NULL COMMENT '발주 ID (FK: orders.order_id)',

  -- 발주 기본 정보 (중복 저장)
  delivery_request_no VARCHAR(100) NOT NULL COMMENT '납품요구번호',
  delivery_request_date DATE NOT NULL COMMENT '납품요구일자',
  contract_no VARCHAR(100) NOT NULL COMMENT '계약번호',
  contract_date DATE COMMENT '계약일자',
  client VARCHAR(200) NOT NULL COMMENT '수요기관',
  project_name VARCHAR(500) NOT NULL COMMENT '사업명',
  delivery_location VARCHAR(500) COMMENT '납품장소',
  delivery_start_date DATE COMMENT '납품 시작일',
  delivery_end_date DATE COMMENT '납품 종료일',

  -- 수량 정보
  total_order_quantity DECIMAL(15,2) DEFAULT 0 COMMENT '총 발주 수량',
  total_delivered_quantity DECIMAL(15,2) DEFAULT 0 COMMENT '총 납품 수량',
  total_delivery_count INT DEFAULT 0 COMMENT '총 출하 횟수',

  -- 상태 정보
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT '상태 (PENDING, IN_PROGRESS, PENDING_SIGNATURE, COMPLETED, SUBMITTED)',

  -- 시공사 정보
  contractor_company_name VARCHAR(200) NOT NULL COMMENT '시공사명',
  contractor_representative VARCHAR(100) COMMENT '시공사 대표이사',
  contractor_business_no VARCHAR(50) COMMENT '사업자등록번호',
  contractor_address VARCHAR(500) COMMENT '시공사 주소',
  contractor_phone VARCHAR(50) COMMENT '시공사 전화번호',
  contractor_seal_image TEXT COMMENT '시공사 인감 이미지 (Base64)',
  contractor_signed_at DATETIME COMMENT '시공사 서명 일시',

  -- 현장감리원 정보
  supervisor_name VARCHAR(100) COMMENT '현장감리원 이름',
  supervisor_company VARCHAR(200) COMMENT '감리회사',
  supervisor_phone VARCHAR(50) COMMENT '현장감리원 전화번호',
  supervisor_signature_image TEXT COMMENT '현장감리원 서명 이미지 (Base64)',
  supervisor_signed_at DATETIME COMMENT '현장감리원 서명 일시',

  -- PDF 파일 URL
  confirmation_pdf_url VARCHAR(500) COMMENT '납품확인서 PDF URL',
  completion_pdf_url VARCHAR(500) COMMENT '납품완료계 PDF URL',
  photo_sheet_pdf_url VARCHAR(500) COMMENT '사진대지 PDF URL',

  -- 메타 정보
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  created_by VARCHAR(100) COMMENT '생성자',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  updated_by VARCHAR(100) COMMENT '수정자',
  submitted_at DATETIME COMMENT '조달청 제출일시',
  submitted_by VARCHAR(100) COMMENT '제출자',

  INDEX idx_order_id (order_id),
  INDEX idx_delivery_request_no (delivery_request_no),
  INDEX idx_contract_no (contract_no),
  INDEX idx_status (status),
  INDEX idx_delivery_request_date (delivery_request_date),

  CONSTRAINT fk_delivery_done_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='납품완료계';
```

### 2. delivery_done_items (납품완료계 품목)

```sql
CREATE TABLE delivery_done_items (
  item_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '품목 ID',
  delivery_done_id BIGINT NOT NULL COMMENT '납품완료계 ID (FK)',
  sequence_number INT NOT NULL COMMENT '순번',

  -- 품목 정보
  name VARCHAR(200) NOT NULL COMMENT '품목명',
  specification TEXT COMMENT '규격',
  unit VARCHAR(50) COMMENT '단위',
  item_classification_number VARCHAR(100) COMMENT '품목분류번호',
  item_identification_number VARCHAR(100) COMMENT '품목식별번호',

  -- 수량 정보
  contract_quantity DECIMAL(15,2) NOT NULL COMMENT '계약 수량',
  delivered_quantity DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '납품 수량',
  remaining_quantity DECIMAL(15,2) COMMENT '잔량',

  -- 금액 정보
  unit_price DECIMAL(15,2) COMMENT '단가',
  total_amount DECIMAL(15,2) COMMENT '총 금액',

  -- 완료 여부
  is_complete BOOLEAN DEFAULT FALSE COMMENT '완료 여부',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_delivery_done_id (delivery_done_id),
  INDEX idx_sequence_number (sequence_number),

  CONSTRAINT fk_delivery_done_items FOREIGN KEY (delivery_done_id) REFERENCES delivery_done(delivery_done_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='납품완료계 품목';
```

### 3. delivery_done_photos (납품완료계 사진)

```sql
CREATE TABLE delivery_done_photos (
  photo_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '사진 ID',
  delivery_done_id BIGINT NOT NULL COMMENT '납품완료계 ID (FK)',
  photo_number INT NOT NULL COMMENT '사진 순번',

  -- 사진 정보
  photo_url VARCHAR(500) NOT NULL COMMENT '사진 URL',
  description TEXT COMMENT '설명',

  -- GPS 정보
  latitude DECIMAL(10,8) COMMENT '위도',
  longitude DECIMAL(11,8) COMMENT '경도',

  -- 촬영 정보
  photographer_name VARCHAR(100) COMMENT '촬영자',
  photo_date DATETIME COMMENT '촬영일시',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_delivery_done_id (delivery_done_id),
  INDEX idx_photo_number (photo_number),

  CONSTRAINT fk_delivery_done_photos FOREIGN KEY (delivery_done_id) REFERENCES delivery_done(delivery_done_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='납품완료계 사진';
```

### 4. delivery_done_tokens (서명 토큰)

```sql
CREATE TABLE delivery_done_tokens (
  token_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '토큰 ID',
  delivery_done_id BIGINT NOT NULL COMMENT '납품완료계 ID (FK)',

  -- 토큰 정보
  token VARCHAR(255) NOT NULL UNIQUE COMMENT '토큰 (UUID)',
  role VARCHAR(50) NOT NULL COMMENT '역할 (CONTRACTOR, SUPERVISOR)',

  -- 수신자 정보
  recipient_name VARCHAR(100) NOT NULL COMMENT '수신자 이름',
  recipient_phone VARCHAR(50) NOT NULL COMMENT '수신자 전화번호',

  -- 토큰 상태
  is_used BOOLEAN DEFAULT FALSE COMMENT '사용 여부',
  used_at DATETIME COMMENT '사용 일시',
  expires_at DATETIME NOT NULL COMMENT '만료 일시',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) COMMENT '생성자',

  INDEX idx_token (token),
  INDEX idx_delivery_done_id (delivery_done_id),
  INDEX idx_expires_at (expires_at),

  CONSTRAINT fk_delivery_done_tokens FOREIGN KEY (delivery_done_id) REFERENCES delivery_done(delivery_done_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='납품완료계 서명 토큰';
```

### 5. delivery_done_history (상태 변경 이력)

```sql
CREATE TABLE delivery_done_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '이력 ID',
  delivery_done_id BIGINT NOT NULL COMMENT '납품완료계 ID (FK)',

  -- 상태 변경 정보
  previous_status VARCHAR(50) COMMENT '이전 상태',
  new_status VARCHAR(50) NOT NULL COMMENT '새 상태',

  -- 변경자 정보
  changed_by VARCHAR(100) COMMENT '변경자',
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '변경일시',
  remarks TEXT COMMENT '비고',

  INDEX idx_delivery_done_id (delivery_done_id),
  INDEX idx_changed_at (changed_at),

  CONSTRAINT fk_delivery_done_history FOREIGN KEY (delivery_done_id) REFERENCES delivery_done(delivery_done_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='납품완료계 상태 변경 이력';
```

---

## API 엔드포인트

### 관리자 API

#### 1. 납품완료계 목록 조회

**Endpoint**: `GET /api/admin/delivery-done`

**Query Parameters**:
```
startDate: string (optional) - 납품요구일자 시작 (YYYY-MM-DD)
endDate: string (optional) - 납품요구일자 종료 (YYYY-MM-DD)
deliveryRequestNo: string (optional) - 납품요구번호 (부분 검색)
contractNo: string (optional) - 계약번호 (부분 검색)
client: string (optional) - 수요기관 (부분 검색)
status: string (optional) - 상태 필터 (PENDING, IN_PROGRESS, PENDING_SIGNATURE, COMPLETED, SUBMITTED)
page: integer (default: 0) - 페이지 번호
size: integer (default: 20) - 페이지 크기
sort: string (default: 'deliveryRequestDate,desc') - 정렬
```

**Response**: [JSON 응답 형식 참조](#1-목록-조회-응답)

---

#### 2. 납품완료계 상세 조회

**Endpoint**: `GET /api/admin/delivery-done/{deliveryDoneId}`

**Path Parameters**:
- `deliveryDoneId`: Long (납품완료계 ID)

**Response**: [JSON 응답 형식 참조](#2-상세-조회-응답)

---

#### 3. 서명 URL 생성 및 메시지 발송

**Endpoint**: `POST /api/admin/delivery-done/{deliveryDoneId}/send-message`

**Path Parameters**:
- `deliveryDoneId`: Long (납품완료계 ID)

**Request Body**:
```json
{
  "role": "CONTRACTOR",  // or "SUPERVISOR"
  "recipientPhone": "01012345678",
  "recipientName": "홍길동"
}
```

**Response**:
```json
{
  "success": true,
  "message": "서명 URL이 발송되었습니다.",
  "tokenUrl": "https://example.com/m/delivery-done/abc123-token-uuid",
  "expiresAt": "2025-01-11T23:59:59"
}
```

**처리 로직**:
1. 토큰 생성 (UUID)
2. delivery_done_tokens 테이블에 저장 (만료 시간: 7일)
3. 카카오톡 알림톡 또는 SMS 발송
4. 메시지 내용:
```
[LP LEADPOWER 납품완료계]
{recipientName}님, 안녕하세요.
{deliveryRequestNo} 건에 대한 {현장 소장 서명 or 현장감리원 서명}이 필요합니다.
아래 링크를 클릭하여 서명해 주시기 바랍니다.
{tokenUrl}
* 링크는 발송 후 1일간 유효합니다.
```

---

#### 4. 조달청 제출

**Endpoint**: `POST /api/admin/delivery-done/{deliveryDoneId}/submit`

**Path Parameters**:
- `deliveryDoneId`: Long (납품완료계 ID)

**Request Body**:
```json
{
  "submitterName": "김철수",
  "submitterPosition": "과장",
  "remarks": "정상 제출"
}
```

**Response**:
```json
{
  "success": true,
  "message": "조달청에 제출되었습니다.",
  "submittedAt": "2025-01-04T14:30:00",
  "receiptNumber": "NARA-2025-0104-001"  // optional
}
```

**처리 로직**:
1. 상태 검증 (COMPLETED 상태인지 확인)
2. 양쪽 서명 완료 여부 확인
3. status를 SUBMITTED로 변경
4. submitted_at, submitted_by 기록
5. delivery_done_history에 이력 추가

---

#### 5. PDF 다운로드

**Endpoint**: `GET /api/admin/delivery-done/{deliveryDoneId}/pdf/{pdfType}`

**Path Parameters**:
- `deliveryDoneId`: Long (납품완료계 ID)
- `pdfType`: String (confirmation | completion | photo-sheet)

**Response**: PDF 파일 (Content-Type: application/pdf)

**처리 로직**:
1. delivery_done 조회
2. 해당 pdfType의 URL 확인
3. PDF 파일 반환 (또는 즉시 생성)

---

#### 6. 모든 PDF 일괄 다운로드

**Endpoint**: `GET /api/admin/delivery-done/{deliveryDoneId}/pdf/all`

**Path Parameters**:
- `deliveryDoneId`: Long (납품완료계 ID)

**Response**: ZIP 파일 (Content-Type: application/zip)

**파일 구조**:
```
delivery-done-{deliveryDoneId}.zip
  ├── 납품확인서_{deliveryRequestNo}.pdf
  ├── 납품완료계_{deliveryRequestNo}.pdf
  └── 사진대지_{deliveryRequestNo}.pdf
```

---

### 모바일 API (토큰 기반)

#### 1. 토큰으로 납품완료계 정보 조회

**Endpoint**: `GET /api/public/delivery-done/{token}`

**Path Parameters**:
- `token`: String (UUID 토큰)

**Response**: [JSON 응답 형식 참조](#3-모바일-정보-조회-응답)

**처리 로직**:
1. 토큰 검증 (존재 여부, 만료 여부, 사용 여부)
2. delivery_done 정보 조회
3. 해당 역할의 서명 완료 여부 확인
4. 모바일용 간략 정보 반환

**에러 케이스**:
- 토큰 없음: 404 Not Found
- 토큰 만료: 410 Gone
- 이미 서명 완료: 200 OK (완료 정보 포함)

---

#### 2. 서명 제출

**Endpoint**: `POST /api/public/delivery-done/{token}/signature`

**Path Parameters**:
- `token`: String (UUID 토큰)

**Request Body**:
```json
{
  "role": "CONTRACTOR",  // or "SUPERVISOR"
  "signatureImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "서명이 완료되었습니다."
}
```

**처리 로직**:
1. 토큰 검증
2. 역할에 따라 적절한 필드에 서명 이미지 저장
   - CONTRACTOR: `contractor_seal_image`, `contractor_signed_at`
   - SUPERVISOR: `supervisor_signature_image`, `supervisor_signed_at`
3. 토큰을 사용 완료 처리 (`is_used = true`, `used_at` 기록)
4. 양쪽 서명 모두 완료되었는지 확인
5. 양쪽 완료 시:
   - status를 COMPLETED로 변경
   - 3개 PDF 자동 생성
   - delivery_done_history에 이력 추가
6. 트랜잭션 처리

---

## JSON 데이터 포맷

### 1. 목록 조회 응답

```json
{
  "content": [
    {
      "deliveryDoneId": 1,
      "orderId": 123,
      "deliveryRequestNo": "35-24-3-41787-00",
      "deliveryRequestDate": "2024-07-02",
      "contractNo": "제00-22-7-0305-01호",
      "client": "한국농어촌공사 전북지역본부 군산지사",
      "projectName": "군산시광역해양레저체험복합단지조성사업",
      "status": "PENDING_SIGNATURE",
      "totalOrderQuantity": 31571.00,
      "totalDeliveredQuantity": 31571.00,
      "deliveryRate": 100,
      "totalDeliveryCount": 5,
      "contractorCompanyName": "LP LEADPOWER",
      "supervisorName": "김중철",
      "hasContractorSignature": false,
      "hasSupervisorSignature": false,
      "createdAt": "2024-07-02T09:00:00",
      "updatedAt": "2024-12-20T14:30:00"
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false
}
```

### 2. 상세 조회 응답

```json
{
  "deliveryDoneId": 1,
  "orderId": 123,
  "deliveryRequestNo": "35-24-3-41787-00",
  "deliveryRequestDate": "2024-07-02",
  "contractNo": "제00-22-7-0305-01호",
  "contractDate": "2024-07-02",
  "client": "한국농어촌공사 전북지역본부 군산지사",
  "projectName": "군산시광역해양레저체험복합단지조성사업 폴리우레탄기포단열재 납품",
  "deliveryLocation": "전라북도 군산시 옥산면 ...",
  "deliveryStartDate": "2024-07-05",
  "deliveryEndDate": "2024-12-19",

  "totalOrderQuantity": 31571.00,
  "totalDeliveredQuantity": 31571.00,
  "totalDeliveryCount": 5,

  "status": "COMPLETED",

  "contractorCompanyName": "LP LEADPOWER",
  "contractorRepresentative": "홍길동",
  "contractorBusinessNo": "123-45-67890",
  "contractorAddress": "서울시 강남구 ...",
  "contractorPhone": "02-1234-5678",
  "contractorSealImage": "data:image/png;base64,iVBORw0KGgo...",
  "contractorSignedAt": "2024-12-20T10:30:00",

  "supervisorName": "김중철",
  "supervisorCompany": "한국건설감리협회",
  "supervisorPhone": "010-1234-5678",
  "supervisorSignatureImage": "data:image/png;base64,iVBORw0KGgo...",
  "supervisorSignedAt": "2024-12-20T14:30:00",

  "confirmationPdfUrl": "https://example.com/pdf/confirmation_1.pdf",
  "completionPdfUrl": "https://example.com/pdf/completion_1.pdf",
  "photoSheetPdfUrl": "https://example.com/pdf/photo_sheet_1.pdf",

  "createdAt": "2024-07-02T09:00:00",
  "updatedAt": "2024-12-20T14:30:00",
  "submittedAt": null,

  "items": [
    {
      "itemId": 1,
      "sequenceNumber": 1,
      "name": "기포단열재",
      "specification": "폴리우레탄기포단열재, 정형 1000×1000×80mm, 경질2종2호",
      "unit": "m²",
      "itemClassificationNumber": "30141503",
      "itemIdentificationNumber": "25312984",
      "contractQuantity": 827.00,
      "deliveredQuantity": 827.00,
      "remainingQuantity": 0.00,
      "unitPrice": 29000.00,
      "totalAmount": 23983000.00,
      "isComplete": true
    },
    {
      "itemId": 2,
      "sequenceNumber": 2,
      "name": "기포단열재",
      "specification": "폴리우레탄기포단열재, 정형 1000×1000×100mm, 경질2종2호",
      "unit": "m²",
      "contractQuantity": 30744.00,
      "deliveredQuantity": 30744.00,
      "remainingQuantity": 0.00,
      "unitPrice": 22850.00,
      "totalAmount": 702500400.00,
      "isComplete": true
    }
  ],

  "photos": [
    {
      "photoId": 1,
      "photoNumber": 1,
      "photoUrl": "https://example.com/photos/photo_1.jpg",
      "description": "납품 현장 전경",
      "latitude": 35.9765,
      "longitude": 126.7372,
      "photographerName": "이기사",
      "photoDate": "2024-07-05T14:20:00"
    },
    {
      "photoId": 2,
      "photoNumber": 2,
      "photoUrl": "https://example.com/photos/photo_2.jpg",
      "description": "하차 작업 중",
      "latitude": 35.9765,
      "longitude": 126.7372,
      "photographerName": "이기사",
      "photoDate": "2024-07-05T14:25:00"
    }
  ],

  "shipments": [
    {
      "shipmentId": 1,
      "shipmentDate": "2024-07-05",
      "shipmentQuantity": 5000.00,
      "shipmentResponsible": "박출하",
      "itemSummary": "기포단열재 외 1건",
      "transportId": 1,
      "trackingNumber": "T-2024-0705-001",
      "vehicleNo": "12가3456",
      "driverName": "이기사",
      "deliveryDate": "2024-07-05",
      "deliveryStatus": "COMPLETED",
      "hasDeliveryConfirmation": true
    },
    {
      "shipmentId": 2,
      "shipmentDate": "2024-08-10",
      "shipmentQuantity": 8000.00,
      "shipmentResponsible": "박출하",
      "itemSummary": "기포단열재 외 1건",
      "transportId": 2,
      "trackingNumber": "T-2024-0810-001",
      "vehicleNo": "34나5678",
      "driverName": "최기사",
      "deliveryDate": "2024-08-10",
      "deliveryStatus": "COMPLETED",
      "hasDeliveryConfirmation": true
    }
  ]
}
```

### 3. 모바일 정보 조회 응답

```json
{
  "deliveryDoneId": 1,
  "deliveryRequestNo": "35-24-3-41787-00",
  "contractNo": "제00-22-7-0305-01호",
  "client": "한국농어촌공사 전북지역본부 군산지사",
  "projectName": "군산시광역해양레저체험복합단지조성사업",
  "deliveryLocation": "전라북도 군산시 옥산면 ...",
  "role": "CONTRACTOR",

  "hasContractorSignature": false,
  "hasSupervisorSignature": false,

  "contractorCompanyName": "LP LEADPOWER",
  "contractorRepresentative": "홍길동",
  "supervisorName": "김중철",
  "supervisorCompany": "한국건설감리협회",

  "itemCount": 2,
  "itemSummary": "기포단열재 외 1건",
  "totalOrderQuantity": 31571.00,
  "totalDeliveredQuantity": 31571.00
}
```

---

## PDF 생성

### Flying Saucer PDF 엔진 설정

**Maven Dependency**:
```xml
<dependency>
    <groupId>org.xhtmlrenderer</groupId>
    <artifactId>flying-saucer-pdf</artifactId>
    <version>9.1.22</version>
</dependency>
<dependency>
    <groupId>com.github.jknack</groupId>
    <artifactId>handlebars</artifactId>
    <version>4.3.1</version>
</dependency>
```

### PDF 생성 서비스 예시

```java
@Service
public class PdfGenerationService {

    private final Handlebars handlebars;

    public PdfGenerationService() {
        this.handlebars = new Handlebars(new ClassPathTemplateLoader("/templates", ".html"));
    }

    /**
     * 납품확인서 PDF 생성
     */
    public byte[] generateConfirmationPdf(DeliveryDone deliveryDone) throws Exception {
        // 템플릿 로드
        Template template = handlebars.compile("delivery-confirmation-template");

        // 데이터 매핑
        Map<String, Object> data = new HashMap<>();
        data.put("contractNo", deliveryDone.getContractNo());
        data.put("deliveryRequestNo", deliveryDone.getDeliveryRequestNo());
        data.put("client", deliveryDone.getClient());
        data.put("projectName", deliveryDone.getProjectName());
        data.put("deliveryLocation", deliveryDone.getDeliveryLocation());

        // 계약물품 리스트
        List<Map<String, Object>> contractItems = new ArrayList<>();
        for (DeliveryDoneItem item : deliveryDone.getItems()) {
            Map<String, Object> itemData = new HashMap<>();
            itemData.put("sequenceNumber", item.getSequenceNumber());
            itemData.put("name", item.getName());
            itemData.put("specification", item.getSpecification());
            itemData.put("unit", item.getUnit());
            itemData.put("quantity", formatNumber(item.getContractQuantity()));
            itemData.put("unitPrice", formatCurrency(item.getUnitPrice()));
            itemData.put("totalAmount", formatCurrency(item.getTotalAmount()));
            contractItems.add(itemData);
        }
        data.put("contractItems", contractItems);

        // 납품내역 리스트
        data.put("deliveryItems", buildDeliveryItems(deliveryDone));

        // 서명 이미지 (Base64)
        data.put("contractorSealImage", deliveryDone.getContractorSealImage());
        data.put("supervisorSignatureImage", deliveryDone.getSupervisorSignatureImage());
        data.put("contractorCompanyName", deliveryDone.getContractorCompanyName());
        data.put("contractorRepresentative", deliveryDone.getContractorRepresentative());
        data.put("supervisorName", deliveryDone.getSupervisorName());
        data.put("supervisorCompany", deliveryDone.getSupervisorCompany());
        data.put("signatureDate", formatDate(LocalDateTime.now()));

        // 합계
        data.put("contractTotalQuantity", formatNumber(deliveryDone.getTotalOrderQuantity()));
        data.put("contractTotalAmount", formatCurrency(calculateTotalAmount(deliveryDone)));

        // HTML 생성
        String html = template.apply(data);

        // 이미지 경로를 Base64로 변환 (로고 등)
        html = processImagesInHtml(html);

        // PDF 생성
        return generatePdfFromHtml(html);
    }

    /**
     * HTML을 PDF로 변환
     */
    private byte[] generatePdfFromHtml(String html) throws Exception {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(os);
            return os.toByteArray();
        }
    }

    /**
     * 로컬 이미지 경로를 Base64로 변환
     */
    private String processImagesInHtml(String html) {
        // 로고 이미지 등 로컬 파일을 Base64로 변환
        String logoPath = isProduction()
            ? "/app/leadpower/www/images/common/logo.png"
            : "D:/dev/ptlpsmback/logo.png";

        try {
            byte[] logoBytes = Files.readAllBytes(Paths.get(logoPath));
            String logoBase64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(logoBytes);
            html = html.replace(logoPath, logoBase64);
        } catch (IOException e) {
            log.error("Failed to load logo image", e);
        }

        return html;
    }
}
```

### PDF 생성 타이밍

**자동 생성 조건**: 양쪽 서명이 모두 완료되었을 때

```java
@Transactional
public void submitSignature(String token, SignatureSubmitRequest request) {
    // 1. 토큰 검증
    DeliveryDoneToken tokenEntity = validateToken(token);
    DeliveryDone deliveryDone = tokenEntity.getDeliveryDone();

    // 2. 서명 저장
    if (request.getRole() == SignatureRole.CONTRACTOR) {
        deliveryDone.setContractorSealImage(request.getSignatureImage());
        deliveryDone.setContractorSignedAt(LocalDateTime.now());
    } else {
        deliveryDone.setSupervisorSignatureImage(request.getSignatureImage());
        deliveryDone.setSupervisorSignedAt(LocalDateTime.now());
    }

    // 3. 토큰 사용 완료 처리
    tokenEntity.setUsed(true);
    tokenEntity.setUsedAt(LocalDateTime.now());

    // 4. 양쪽 서명 완료 여부 확인
    boolean bothSigned = deliveryDone.getContractorSignedAt() != null
        && deliveryDone.getSupervisorSignedAt() != null;

    if (bothSigned) {
        // 5. 상태 변경
        changeStatus(deliveryDone, DeliveryDoneStatus.COMPLETED);

        // 6. PDF 생성
        generateAllPdfs(deliveryDone);
    }

    deliveryDoneRepository.save(deliveryDone);
}

private void generateAllPdfs(DeliveryDone deliveryDone) {
    try {
        // 납품확인서
        byte[] confirmationPdf = pdfService.generateConfirmationPdf(deliveryDone);
        String confirmationUrl = uploadPdf(confirmationPdf, "confirmation", deliveryDone.getId());
        deliveryDone.setConfirmationPdfUrl(confirmationUrl);

        // 납품완료계
        byte[] completionPdf = pdfService.generateCompletionPdf(deliveryDone);
        String completionUrl = uploadPdf(completionPdf, "completion", deliveryDone.getId());
        deliveryDone.setCompletionPdfUrl(completionUrl);

        // 사진대지
        byte[] photoSheetPdf = pdfService.generatePhotoSheetPdf(deliveryDone);
        String photoSheetUrl = uploadPdf(photoSheetPdf, "photo-sheet", deliveryDone.getId());
        deliveryDone.setPhotoSheetPdfUrl(photoSheetUrl);

    } catch (Exception e) {
        log.error("Failed to generate PDFs for deliveryDoneId: {}", deliveryDone.getId(), e);
        throw new RuntimeException("PDF 생성에 실패했습니다.", e);
    }
}
```

---

## 메시지 발송

### 카카오톡 알림톡 또는 SMS

```java
@Service
public class MessageService {

    /**
     * 서명 URL 메시지 발송
     */
    public void sendSignatureUrl(DeliveryDone deliveryDone, SignatureRole role,
                                  String recipientPhone, String recipientName) {
        // 1. 토큰 생성
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

        DeliveryDoneToken tokenEntity = DeliveryDoneToken.builder()
            .deliveryDone(deliveryDone)
            .token(token)
            .role(role)
            .recipientName(recipientName)
            .recipientPhone(recipientPhone)
            .expiresAt(expiresAt)
            .build();

        tokenRepository.save(tokenEntity);

        // 2. URL 생성
        String baseUrl = isProduction()
            ? "https://leadpower.platree.com"
            : "http://localhost:3000";
        String tokenUrl = baseUrl + "/m/delivery-done/" + token;

        // 3. 메시지 내용 구성
        String roleText = role == SignatureRole.CONTRACTOR ? "현장 소장 서명" : "현장감리원 서명";
        String message = String.format(
            "[LP LEADPOWER 납품완료계]\n" +
            "%s님, 안녕하세요.\n" +
            "%s 건에 대한 %s이 필요합니다.\n" +
            "아래 링크를 클릭하여 서명해 주시기 바랍니다.\n" +
            "%s\n" +
            "* 링크는 발송 후 1일간 유효합니다.",
            recipientName,
            deliveryDone.getDeliveryRequestNo(),
            roleText,
            tokenUrl
        );

        // 4. 메시지 발송 (카카오톡 또는 SMS)
        try {
            // 카카오톡 알림톡 우선 시도
            sendKakaoAlimtalk(recipientPhone, message, tokenUrl);
        } catch (Exception e) {
            log.warn("Kakao alimtalk failed, falling back to SMS", e);
            // 실패 시 SMS로 대체
            sendSMS(recipientPhone, message);
        }
    }

    private void sendKakaoAlimtalk(String phone, String message, String url) {
        // 카카오톡 알림톡 API 호출 구현
        // https://developers.kakao.com/docs/latest/ko/message/rest-api
    }

    private void sendSMS(String phone, String message) {
        // SMS API 호출 구현
    }
}
```

---

## 에러 처리

### 공통 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "DELIVERY_DONE_NOT_FOUND",
    "message": "납품완료계를 찾을 수 없습니다.",
    "details": "deliveryDoneId: 999"
  },
  "timestamp": "2025-01-04T15:30:00"
}
```

### 에러 코드 정의

| HTTP Status | Error Code | Message | 설명 |
|------------|-----------|---------|-----|
| 404 | DELIVERY_DONE_NOT_FOUND | 납품완료계를 찾을 수 없습니다. | 존재하지 않는 ID |
| 404 | TOKEN_NOT_FOUND | 유효하지 않은 토큰입니다. | 존재하지 않는 토큰 |
| 410 | TOKEN_EXPIRED | 토큰이 만료되었습니다. | 만료된 토큰 |
| 409 | ALREADY_SIGNED | 이미 서명이 완료되었습니다. | 중복 서명 시도 |
| 400 | INVALID_STATUS | 잘못된 상태입니다. | 상태 전환 규칙 위반 |
| 400 | MISSING_SIGNATURES | 서명이 완료되지 않았습니다. | 제출 시 서명 미완료 |
| 500 | PDF_GENERATION_FAILED | PDF 생성에 실패했습니다. | PDF 생성 오류 |
| 500 | MESSAGE_SEND_FAILED | 메시지 발송에 실패했습니다. | 메시지 발송 오류 |

### 예외 처리 예시

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DeliveryDoneNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDeliveryDoneNotFound(DeliveryDoneNotFoundException e) {
        ErrorResponse response = ErrorResponse.builder()
            .success(false)
            .error(Error.builder()
                .code("DELIVERY_DONE_NOT_FOUND")
                .message("납품완료계를 찾을 수 없습니다.")
                .details(e.getMessage())
                .build())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ErrorResponse> handleTokenExpired(TokenExpiredException e) {
        ErrorResponse response = ErrorResponse.builder()
            .success(false)
            .error(Error.builder()
                .code("TOKEN_EXPIRED")
                .message("토큰이 만료되었습니다.")
                .details(e.getMessage())
                .build())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.GONE).body(response);
    }
}
```

---

## 자동화 로직

### 1. 발주 생성 시 delivery_done 자동 생성

```java
@Service
public class OrderService {

    @Transactional
    public Order createOrder(OrderCreateRequest request) {
        // 1. 발주 생성
        Order order = Order.builder()
            .deliveryRequestNo(request.getDeliveryRequestNo())
            .deliveryRequestDate(request.getDeliveryRequestDate())
            // ... 기타 필드
            .build();

        order = orderRepository.save(order);

        // 2. delivery_done 자동 생성
        createDeliveryDone(order);

        return order;
    }

    private void createDeliveryDone(Order order) {
        DeliveryDone deliveryDone = DeliveryDone.builder()
            .order(order)
            .deliveryRequestNo(order.getDeliveryRequestNo())
            .deliveryRequestDate(order.getDeliveryRequestDate())
            .contractNo(order.getContractNo())
            .contractDate(order.getContractDate())
            .client(order.getClient())
            .projectName(order.getProjectName())
            .deliveryLocation(order.getDeliveryLocation())
            .status(DeliveryDoneStatus.PENDING)
            .contractorCompanyName(order.getContractorCompany())
            .contractorRepresentative(order.getContractorRepresentative())
            // ... 기타 필드
            .build();

        deliveryDoneRepository.save(deliveryDone);

        // 품목 복사
        copyItemsToDeliveryDone(order, deliveryDone);

        // 이력 기록
        recordHistory(deliveryDone, null, DeliveryDoneStatus.PENDING, "발주 생성");
    }
}
```

### 2. 첫 출하 시 IN_PROGRESS로 변경

```java
@Service
public class ShipmentService {

    @Transactional
    public Shipment createShipment(ShipmentCreateRequest request) {
        // 1. 출하 생성
        Shipment shipment = Shipment.builder()
            .order(order)
            // ... 기타 필드
            .build();

        shipment = shipmentRepository.save(shipment);

        // 2. 첫 출하인지 확인
        long shipmentCount = shipmentRepository.countByOrderId(order.getId());
        if (shipmentCount == 1) {
            // 첫 출하 시 delivery_done 상태 변경
            DeliveryDone deliveryDone = deliveryDoneRepository.findByOrderId(order.getId())
                .orElseThrow();

            if (deliveryDone.getStatus() == DeliveryDoneStatus.PENDING) {
                deliveryDone.setStatus(DeliveryDoneStatus.IN_PROGRESS);
                deliveryDone.setDeliveryStartDate(shipment.getShipmentDate());
                deliveryDoneRepository.save(deliveryDone);

                recordHistory(deliveryDone, DeliveryDoneStatus.PENDING,
                             DeliveryDoneStatus.IN_PROGRESS, "첫 출하 등록");
            }
        }

        // 3. delivery_done의 수량 정보 업데이트
        updateDeliveryDoneQuantities(order.getId());

        return shipment;
    }
}
```

### 3. 모든 납품확인 완료 시 PENDING_SIGNATURE로 변경

```java
@Service
public class DeliveryService {

    @Transactional
    public void confirmDelivery(String token, DeliveryConfirmRequest request) {
        // 1. 납품확인 완료 처리
        Delivery delivery = deliveryRepository.findByToken(token)
            .orElseThrow();

        delivery.setStatus("COMPLETED");
        delivery.setCompletedAt(LocalDateTime.now());
        // ... 사진, 서명 등 저장

        deliveryRepository.save(delivery);

        // 2. 해당 발주의 모든 납품확인이 완료되었는지 확인
        Order order = delivery.getTransport().getShipment().getOrder();
        boolean allDeliveryCompleted = checkAllDeliveryCompleted(order.getId());

        if (allDeliveryCompleted) {
            // 3. delivery_done 상태를 PENDING_SIGNATURE로 변경
            DeliveryDone deliveryDone = deliveryDoneRepository.findByOrderId(order.getId())
                .orElseThrow();

            if (deliveryDone.getStatus() == DeliveryDoneStatus.IN_PROGRESS) {
                deliveryDone.setStatus(DeliveryDoneStatus.PENDING_SIGNATURE);
                deliveryDone.setDeliveryEndDate(LocalDate.now());
                deliveryDoneRepository.save(deliveryDone);

                // 4. 사진 복사 (delivery_done_photos 테이블로)
                copyPhotosToDeliveryDone(order, deliveryDone);

                recordHistory(deliveryDone, DeliveryDoneStatus.IN_PROGRESS,
                             DeliveryDoneStatus.PENDING_SIGNATURE, "모든 납품확인 완료");
            }
        }
    }

    private boolean checkAllDeliveryCompleted(Long orderId) {
        return deliveryRepository.countPendingByOrderId(orderId) == 0;
    }
}
```

---

## 개발 체크리스트

### 필수 구현 항목

- [ ] 데이터베이스 테이블 생성 (5개)
- [ ] 관리자 API 엔드포인트 (6개)
- [ ] 모바일 API 엔드포인트 (2개)
- [ ] PDF 생성 서비스 (3개 템플릿)
- [ ] 메시지 발송 서비스 (카카오톡/SMS)
- [ ] 토큰 생성 및 검증
- [ ] 자동 상태 전환 로직 (3곳)
- [ ] 에러 처리 및 예외 핸들러
- [ ] 트랜잭션 처리
- [ ] 로깅

### 테스트 시나리오

1. **발주 생성 → delivery_done 자동 생성 확인**
2. **첫 출하 → IN_PROGRESS 전환 확인**
3. **모든 납품확인 완료 → PENDING_SIGNATURE 전환 확인**
4. **메시지 발송 → 토큰 생성 및 URL 확인**
5. **모바일 서명 (시공사) → 저장 확인**
6. **모바일 서명 (감리원) → PDF 자동 생성 확인**
7. **조달청 제출 → SUBMITTED 전환 확인**
8. **PDF 다운로드 (개별/일괄) 확인**

---

## 참고 자료

### 프론트엔드 파일
- `types/delivery-done.ts` - TypeScript 타입 정의
- `services/delivery-done.service.ts` - API 호출 서비스
- `templates/delivery-confirmation-template.html` - 납품확인서 템플릿
- `templates/delivery-completion-template.html` - 납품완료계 템플릿
- `templates/photo-sheet-template.html` - 사진대지 템플릿

### 기존 DB 테이블
- `orders` - 발주 테이블
- `shipments` - 출하 테이블
- `transports` - 운송 테이블
- `deliveries` - 납품확인 테이블

---

## 문의 사항

백엔드 개발 중 문의사항이 있으면 프론트엔드 개발자에게 연락 바랍니다.

**프론트엔드 완료 항목**:
- ✅ 관리자 리스트 페이지
- ✅ 모바일 서명 페이지
- ✅ PDF 템플릿 3개
- ✅ TypeScript 타입 정의
- ✅ 서비스 레이어

**백엔드 구현 필요 항목**:
- ⏳ 데이터베이스 스키마
- ⏳ API 엔드포인트
- ⏳ PDF 생성 엔진
- ⏳ 메시지 발송
- ⏳ 자동화 로직
