# 모바일 배송 확인 API 명세서

## 개요

운송장 관리에서 기사에게 메시지를 발송하면, 기사는 모바일 링크를 통해 배송 확인 페이지에 접속합니다.
현장 감독이 서명하고, 기사가 사진을 업로드한 후 납품 확인을 완료하는 시스템입니다.

## 데이터베이스 스키마

### deliveries 테이블

```sql
CREATE TABLE deliveries (
  delivery_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transport_id BIGINT NOT NULL,
  shipment_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,

  -- 토큰 관련
  access_token VARCHAR(255) NOT NULL UNIQUE,
  token_expires_at DATETIME NOT NULL,
  token_used_at DATETIME,

  -- 서명 및 사진
  signature_url VARCHAR(500),
  photo1_path VARCHAR(500),
  photo2_path VARCHAR(500),
  photo3_path VARCHAR(500),
  photo4_path VARCHAR(500),
  photo5_path VARCHAR(500),
  photo_count INT DEFAULT 0,

  -- 위치 정보 (선택)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  gps_accuracy DECIMAL(10, 2),

  -- 메시지 발송 정보
  message_sent_at DATETIME,
  message_sent_by BIGINT,
  message_send_count INT DEFAULT 0,

  -- 상태 및 완료 정보
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  completed_at DATETIME,
  completed_by VARCHAR(100),

  -- 공통 필드
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,

  FOREIGN KEY (transport_id) REFERENCES transports(transport_id),
  FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  INDEX idx_access_token (access_token),
  INDEX idx_transport_id (transport_id),
  INDEX idx_status (status)
);
```

### 상태 코드 (status)

- `PENDING`: 대기 중 (메시지 발송됨, 아직 접속 안 함)
- `IN_PROGRESS`: 진행 중 (모바일 페이지 접속함)
- `COMPLETED`: 완료 (서명 + 사진 업로드 완료)
- `EXPIRED`: 만료됨

## API 엔드포인트

### 1. 납품 생성 및 토큰 발급 (Admin용)

**운송장 관리에서 "메시지" 버튼 클릭 시 호출**

```http
POST /api/admin/deliveries
```

**Request Body:**
```json
{
  "transportId": 123
}
```

**Response: 200 OK**
```json
{
  "deliveryId": 456,
  "transportId": 123,
  "shipmentId": 789,
  "orderId": 101,
  "accessToken": "2eee7e0b-21d7-4cf8-b267-ae6f70c7d043",
  "tokenExpiresAt": "2025-10-28T12:00:00",
  "mobileUrl": "http://leadpower.platree.com/m/delivery/2eee7e0b-21d7-4cf8-b267-ae6f70c7d043",
  "messageSentAt": "2025-10-27T12:00:00"
}
```

**Error Responses:**
- `400 Bad Request`: transport_id가 누락되거나 유효하지 않음
- `404 Not Found`: 해당 운송장이 존재하지 않음
- `409 Conflict`: 이미 해당 운송장에 대한 활성화된 delivery가 존재

**구현 로직:**
1. `transport_id`로 운송장 조회
2. 운송장의 `shipment_id`, `order_id` 가져오기
3. UUID로 `access_token` 생성
4. `token_expires_at` = 현재시각 + 24시간
5. `deliveries` 테이블에 레코드 생성
6. `message_send_count` +1
7. `transports.status`를 `IN_PROGRESS`로 업데이트 (선택)

---

### 2. 토큰으로 납품 정보 조회 (Mobile용)

**모바일 페이지 로드 시 호출**

```http
GET /api/m/delivery/{token}
```

**URL Parameters:**
- `token`: 접근 토큰 (UUID)

**Response: 200 OK**
```json
{
  "deliveryId": 456,
  "transportId": 123,
  "shipmentId": 789,
  "orderId": 101,
  "status": "PENDING",
  "tokenExpiresAt": "2025-10-28T12:00:00",

  "transport": {
    "trackingNumber": "T-2025-001",
    "deliveryAddress": "서울시 강남구 테헤란로 123",
    "addressDetail": "ABC빌딩 5층",
    "deliveryDate": "2025-10-27",
    "siteSupervisorName": "김감독",
    "receiverName": "이수령",
    "receiverPhone": "010-1234-5678",
    "driverName": "박기사",
    "driverPhone": "010-9876-5432",
    "vehicleNo": "12가3456"
  },

  "shipment": {
    "shipmentNumber": "SH-2025-001",
    "deliveryRequestNumber": "DR-2025-001"
  },

  "order": {
    "orderNumber": "ORD-2025-001",
    "projectName": "청주내덕초 후관 휴게실 증축"
  },

  "items": [
    {
      "itemId": 1,
      "itemName": "기포단열재",
      "specification": "폴리우레탄기포단열재, 1000×1000×80mm",
      "unit": "m²",
      "quantity": 827,
      "unitPrice": 29000,
      "totalAmount": 23983000
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: 토큰이 유효하지 않음
- `410 Gone`: 토큰이 만료됨 (token_expires_at < 현재시각)
- `403 Forbidden`: 이미 완료된 납품 (status = 'COMPLETED')

**구현 로직:**
1. `access_token`으로 delivery 조회
2. 토큰 만료 확인 (`token_expires_at` < 현재시각 → 410 반환)
3. 이미 완료된 경우 (`status = 'COMPLETED'`) → 403 반환
4. `status`를 `IN_PROGRESS`로 업데이트 (PENDING인 경우만)
5. `transports`, `shipments`, `orders`, `order_items` 조인하여 데이터 반환

---

### 3. 서명 이미지 업로드 (Mobile용)

**현장 감독이 서명 후 "서명 저장" 버튼 클릭 시 호출**

```http
POST /api/m/delivery/{token}/signature
```

**URL Parameters:**
- `token`: 접근 토큰 (UUID)

**Request Body: multipart/form-data**
```
signatureImage: File (PNG 이미지)
```

**Response: 200 OK**
```json
{
  "signatureUrl": "/uploads/signatures/2025/10/27/signature-456.png"
}
```

**Error Responses:**
- `400 Bad Request`: 파일이 누락되거나 형식이 잘못됨
- `404 Not Found`: 토큰이 유효하지 않음
- `410 Gone`: 토큰이 만료됨
- `413 Payload Too Large`: 파일 크기 초과 (10MB 제한)

**구현 로직:**
1. 토큰 검증 (존재 여부, 만료 확인)
2. 파일 검증 (PNG/JPG, 최대 10MB)
3. 파일을 `/uploads/signatures/YYYY/MM/DD/` 경로에 저장
4. `deliveries.signature_url` 업데이트
5. `deliveries.updated_at` 업데이트

---

### 4. 사진 업로드 (Mobile용)

**기사가 사진 촬영 후 업로드 시 호출 (1~5장)**

```http
POST /api/m/delivery/{token}/photos
```

**URL Parameters:**
- `token`: 접근 토큰 (UUID)

**Request Body: multipart/form-data**
```
photos: File[] (1~5개의 이미지 파일)
```

**Response: 200 OK**
```json
{
  "photoUrls": [
    "/uploads/photos/2025/10/27/photo-456-1.jpg",
    "/uploads/photos/2025/10/27/photo-456-2.jpg",
    "/uploads/photos/2025/10/27/photo-456-3.jpg"
  ],
  "photoCount": 3
}
```

**Error Responses:**
- `400 Bad Request`: 파일이 누락되거나 개수 초과 (5개 제한)
- `404 Not Found`: 토큰이 유효하지 않음
- `410 Gone`: 토큰이 만료됨
- `413 Payload Too Large`: 파일 크기 초과 (각 10MB 제한)

**구현 로직:**
1. 토큰 검증
2. 파일 개수 확인 (1~5개)
3. 각 파일 검증 (JPG/PNG, 최대 10MB)
4. 파일들을 `/uploads/photos/YYYY/MM/DD/` 경로에 저장
5. `deliveries.photo1_path` ~ `photo5_path` 업데이트
6. `deliveries.photo_count` 업데이트

---

### 5. 납품 확인 완료 (Mobile용)

**기사가 "납품 확인 완료" 버튼 클릭 시 호출**

```http
POST /api/m/delivery/{token}/confirm
```

**URL Parameters:**
- `token`: 접근 토큰 (UUID)

**Request Body:**
```json
{
  "latitude": 37.5665,
  "longitude": 126.9780,
  "gpsAccuracy": 15.5
}
```

**Response: 200 OK**
```json
{
  "deliveryId": 456,
  "status": "COMPLETED",
  "completedAt": "2025-10-27T14:30:00"
}
```

**Error Responses:**
- `400 Bad Request`: 서명 또는 사진이 없음
- `404 Not Found`: 토큰이 유효하지 않음
- `410 Gone`: 토큰이 만료됨
- `409 Conflict`: 이미 완료됨

**구현 로직:**
1. 토큰 검증
2. 서명 존재 확인 (`signature_url IS NOT NULL`)
3. 사진 존재 확인 (`photo_count > 0`)
4. GPS 정보 저장 (선택)
5. `deliveries.status` = `COMPLETED`
6. `deliveries.completed_at` = 현재시각
7. `deliveries.token_used_at` = 현재시각
8. **중요: 연관된 테이블 상태 업데이트**
   - `transports.status` = `COMPLETED`
   - `shipments.status` = `COMPLETED` (필요시)
   - `orders.status` = `COMPLETED` (필요시)

---

### 6. 납품 목록 조회 (Admin용)

**Admin 배송 관리 페이지에서 호출**

```http
GET /api/admin/deliveries
```

**Query Parameters:**
- `startDate`: 시작일 (YYYY-MM-DD)
- `endDate`: 종료일 (YYYY-MM-DD)
- `status`: 상태 필터 (PENDING, IN_PROGRESS, COMPLETED, EXPIRED)
- `transportId`: 운송장 ID 필터
- `page`: 페이지 번호 (0부터 시작)
- `size`: 페이지 크기 (기본 10)
- `sort`: 정렬 (기본 `createdAt,desc`)

**Example:**
```
GET /api/admin/deliveries?startDate=2025-10-01&endDate=2025-10-31&status=COMPLETED&page=0&size=10&sort=completedAt,desc
```

**Response: 200 OK**
```json
{
  "content": [
    {
      "deliveryId": 456,
      "transportId": 123,
      "shipmentId": 789,
      "orderId": 101,
      "trackingNumber": "T-2025-001",
      "deliveryRequestNumber": "DR-2025-001",
      "deliveryAddress": "서울시 강남구 테헤란로 123",
      "deliveryDate": "2025-10-27",
      "driverName": "박기사",
      "status": "COMPLETED",
      "hasSignature": true,
      "photoCount": 3,
      "completedAt": "2025-10-27T14:30:00",
      "createdAt": "2025-10-27T12:00:00"
    }
  ],
  "totalElements": 150,
  "totalPages": 15,
  "size": 10,
  "number": 0
}
```

**구현 로직:**
1. 쿼리 파라미터로 필터링 (날짜, 상태 등)
2. `deliveries`, `transports`, `shipments`, `orders` 조인
3. 페이징 처리
4. 정렬 적용
5. 결과 반환

---

### 7. 납품 상세 조회 (Admin용)

**Admin에서 특정 납품 상세 정보 조회**

```http
GET /api/admin/deliveries/{deliveryId}
```

**URL Parameters:**
- `deliveryId`: 납품 ID

**Response: 200 OK**
```json
{
  "deliveryId": 456,
  "transportId": 123,
  "shipmentId": 789,
  "orderId": 101,
  "status": "COMPLETED",
  "accessToken": "2eee7e0b-21d7-4cf8-b267-ae6f70c7d043",
  "tokenExpiresAt": "2025-10-28T12:00:00",
  "tokenUsedAt": "2025-10-27T14:30:00",
  "mobileUrl": "http://leadpower.platree.com/m/delivery/2eee7e0b-21d7-4cf8-b267-ae6f70c7d043",

  "signatureUrl": "/uploads/signatures/2025/10/27/signature-456.png",
  "photoUrls": [
    "/uploads/photos/2025/10/27/photo-456-1.jpg",
    "/uploads/photos/2025/10/27/photo-456-2.jpg",
    "/uploads/photos/2025/10/27/photo-456-3.jpg"
  ],
  "photoCount": 3,

  "latitude": 37.5665,
  "longitude": 126.9780,
  "gpsAccuracy": 15.5,

  "messageSentAt": "2025-10-27T12:00:00",
  "completedAt": "2025-10-27T14:30:00",
  "createdAt": "2025-10-27T12:00:00",

  "transport": {
    "trackingNumber": "T-2025-001",
    "deliveryAddress": "서울시 강남구 테헤란로 123",
    "driverName": "박기사"
  }
}
```

**Error Responses:**
- `404 Not Found`: 납품 ID가 존재하지 않음

---

## 보안 고려사항

### 1. 토큰 보안
- UUID v4 사용 (랜덤성 보장)
- 토큰 만료 시간: 24시간 (조정 가능)
- 토큰은 1회용 또는 완료 후 재사용 불가

### 2. 파일 업로드 보안
- 파일 타입 검증 (MIME type, 확장자)
- 파일 크기 제한 (각 10MB)
- 파일명 난수화 (원본 파일명 노출 방지)
- 업로드 경로 제한 (Path Traversal 방지)

### 3. CORS 설정
```java
// Spring Boot 예시
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://leadpower.platree.com", "http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### 4. Rate Limiting
- 모바일 API: 동일 IP에서 1분당 최대 60회
- Admin API: 인증된 사용자당 1분당 최대 300회

---

## 상태 변화 플로우

```
1. Admin이 "메시지" 버튼 클릭
   → POST /api/admin/deliveries
   → deliveries.status = 'PENDING'
   → transports.status = 'IN_PROGRESS' (선택)

2. 기사가 모바일 링크 접속
   → GET /api/m/delivery/{token}
   → deliveries.status = 'IN_PROGRESS'

3. 현장 감독이 서명
   → POST /api/m/delivery/{token}/signature
   → deliveries.signature_url 업데이트

4. 기사가 사진 업로드
   → POST /api/m/delivery/{token}/photos
   → deliveries.photo1_path ~ photo5_path 업데이트

5. 기사가 "납품 확인 완료" 클릭
   → POST /api/m/delivery/{token}/confirm
   → deliveries.status = 'COMPLETED'
   → transports.status = 'COMPLETED'
   → shipments.status = 'COMPLETED' (필요시)
   → orders.status = 'COMPLETED' (필요시)
```

---

## 에러 코드 정리

| HTTP Status | Error Code | 설명 |
|-------------|-----------|------|
| 400 | BAD_REQUEST | 필수 파라미터 누락, 잘못된 형식 |
| 403 | FORBIDDEN | 이미 완료된 납품, 권한 없음 |
| 404 | NOT_FOUND | 토큰/리소스가 존재하지 않음 |
| 409 | CONFLICT | 이미 존재하는 리소스 |
| 410 | GONE | 토큰이 만료됨 |
| 413 | PAYLOAD_TOO_LARGE | 파일 크기 초과 |
| 429 | TOO_MANY_REQUESTS | Rate Limit 초과 |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류 |

---

## 테스트 시나리오

### Happy Path (정상 플로우)
1. Admin이 운송장에서 메시지 버튼 클릭 → 토큰 생성 ✓
2. 기사가 모바일 링크 접속 → 납품 정보 조회 ✓
3. 현장 감독이 서명 → 서명 이미지 저장 ✓
4. 기사가 사진 3장 촬영 → 사진 업로드 ✓
5. 기사가 "납품 확인 완료" 클릭 → 상태 COMPLETED ✓
6. Admin이 배송 목록에서 완료 확인 ✓

### Edge Cases
- 토큰 만료 후 접속 시도 → 410 Gone
- 서명 없이 완료 시도 → 400 Bad Request
- 사진 6장 업로드 시도 → 400 Bad Request
- 이미 완료된 납품 재접속 → 403 Forbidden
- 동일 운송장에 중복 메시지 발송 → 409 Conflict (또는 새 토큰 발급)

---

## 구현 우선순위

### Phase 1 (필수)
1. ✅ POST /api/admin/deliveries - 토큰 생성
2. ✅ GET /api/m/delivery/{token} - 납품 정보 조회
3. ✅ POST /api/m/delivery/{token}/signature - 서명 업로드
4. ✅ POST /api/m/delivery/{token}/photos - 사진 업로드
5. ✅ POST /api/m/delivery/{token}/confirm - 납품 완료
6. ✅ GET /api/admin/deliveries - 납품 목록

### Phase 2 (선택)
7. ⏸️ GET /api/admin/deliveries/{deliveryId} - 납품 상세
8. ⏸️ Rate Limiting 구현
9. ⏸️ GPS 정보 활용 (지도 표시 등)

---

## 프론트엔드 구현 현황

### ✅ 완료된 작업
- [services/delivery.service.ts](services/delivery.service.ts) - API 호출 함수 구현
- [pages/m/delivery/[token].vue](pages/m/delivery/[token].vue) - 모바일 배송 확인 페이지
- [components/mobile/SignatureCanvas.vue](components/mobile/SignatureCanvas.vue) - 서명 캔버스
- [components/mobile/PhotoUploader.vue](components/mobile/PhotoUploader.vue) - 사진 업로더
- [pages/admin/transport/list.vue](pages/admin/transport/list.vue) - 메시지 버튼
- [pages/admin/delivery/list.vue](pages/admin/delivery/list.vue) - 납품 목록 페이지

### ⏸️ 백엔드 API 구현 대기 중
- 모든 API 엔드포인트 (1~6번)
- 파일 업로드 처리
- 토큰 검증 로직
- 상태 업데이트 로직

---

## 참고사항

### 파일 저장 경로 예시
```
/uploads/
  /signatures/
    /2025/
      /10/
        /27/
          signature-456.png
  /photos/
    /2025/
      /10/
        /27/
          photo-456-1.jpg
          photo-456-2.jpg
          photo-456-3.jpg
```

### Nginx 정적 파일 서빙 설정
```nginx
location /uploads/ {
    alias /var/www/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 토큰 생성 예시 (Java)
```java
import java.util.UUID;
import java.time.LocalDateTime;

public String generateAccessToken() {
    return UUID.randomUUID().toString();
}

public LocalDateTime getTokenExpiresAt() {
    return LocalDateTime.now().plusDays(7);
}
```

---

## 문의사항

백엔드 API 구현 중 문의사항이 있으면:
- 프론트엔드: [services/delivery.service.ts](services/delivery.service.ts) 참고
- 모바일 UI: [pages/m/delivery/[token].vue](pages/m/delivery/[token].vue) 참고
- 데이터 구조: 이 문서의 Request/Response 예시 참고
