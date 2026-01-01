# 📦 Delivery Confirmation System (납품확인 시스템)

## 개요

납품확인 시스템은 **모바일 기반 현장 납품 확인**과 **관리자 트리 구조 조회**를 지원하는 핵심 기능입니다.

---

## 아키텍처

### 1. 데이터 흐름
```
발주(Order) → 출하(Shipment) → 운송(Transport) → 납품확인(DeliveryConfirmation)
```

### 2. 주요 컴포넌트

**관리자 페이지 (`/pages/admin/delivery/list.vue`)**
- 트리 구조로 발주별 납품 현황 표시
- 검색: 날짜, 납품요구번호, 상태
- 페이지네이션 지원
- 실시간 납품 진행률 표시

**트리 노드 컴포넌트**

| 컴포넌트 | 레벨 | 역할 |
|---------|------|------|
| `OrderTreeNode.vue` | 최상위 | 발주 기본 정보, 납품률, 진행 상태, 출하 목록 확장/축소 |
| `ShipmentTreeNode.vue` | 2단계 | 출하 정보, 품목 요약, 수량, 상태, 운송 정보 확장/축소 |
| `TransportDetailNode.vue` | 3단계 | 운송 정보, 납품확인 상태, PDF/사진/GPS |

**모바일 페이지 (`/pages/m/delivery/[token].vue`)**
- 토큰 기반 접근 (메시지 URL)
- 서명 캔버스 (터치 기반)
- 사진 촬영/업로드 (최대 5장)
- GPS 위치 정보 수집
- 납품 완료 처리

---

## 서비스 레이어 (`services/delivery.service.ts`)

### 관리자용 메서드
```typescript
createDelivery(transportId)      // 납품 URL 생성 및 메시지 발송
getDeliveryTree(params)          // 트리 구조 조회
getDeliveryList(params)          // Flat 구조 조회
getDeliveryDetail(deliveryId)    // 상세 조회
```

### 모바일용 메서드
```typescript
getDeliveryByToken(token)        // 토큰으로 납품 정보 조회
uploadSignature(token, blob)     // 서명 이미지 업로드
uploadPhotos(token, files)       // 사진 업로드 (최대 5장)
confirmDelivery(token, data)     // 납품 완료 처리
```

### 데이터 변환
- 서버 응답 (flat structure) → 프론트엔드 (nested structure)
- `transformDeliveryResponse()` 함수로 자동 변환

---

## 타입 정의 (`types/delivery.ts`)

### 트리 구조 타입

```typescript
OrderTreeNode {
  orderId, deliveryRequestNo, client, projectName
  totalOrderQuantity, totalDeliveredQuantity
  deliveryRate, shipments[]
}

ShipmentTreeNode {
  shipmentId, shipmentDate, shipmentQuantity
  shipmentResponsible, status, itemSummary
  transport
}

TransportDetailNode {
  transportId, trackingNumber, vehicleNo
  driverName, driverPhone, deliveryAddress
  deliveryDate, siteSupervisorName
  status, deliveryConfirmation
}

DeliveryConfirmationNode {
  deliveryId, status, completedAt
  hasSignature, pdfFileUrl, signatureUrl
  photoCount, photoUrls[]
  latitude, longitude
}
```

---

## 주요 기능

### 1. 메시지 전송 (관리자)
- 운송장별 모바일 납품확인 URL 생성
- 토큰 기반 보안 (만료 시간 설정)
- URL 클립보드 복사 기능
- 카카오톡/SMS로 기사에게 전달

### 2. 모바일 납품 확인 Flow
```
1. URL 접근 (토큰 검증)
2. 납품 정보 확인 (발주, 출하, 운송, 품목)
3. 서명 작성 (터치 캔버스)
4. 사진 촬영 (최대 5장)
5. GPS 위치 정보 수집
6. 납품 완료 처리
7. PDF 영수증 자동 생성
```

**기술 구현**
- Canvas API로 터치 서명 (`SignatureCanvas.vue`)
- File API로 사진 촬영/업로드
- Geolocation API로 GPS 좌표 수집
- FormData로 multipart/form-data 업로드

### 3. PDF 다운로드 (관리자)
- 납품 완료 시 서버에서 PDF 영수증 자동 생성
- `SignatureViewer.vue`에서 PDF 다운로드 버튼 제공
- Fallback: `pdfFileUrl` null 시 `deliveryId`로 URL 생성

### 4. 사진 갤러리
- `PhotoGallery.vue` 컴포넌트로 사진 모달 표시
- 좌우 화살표로 사진 탐색
- 확대/축소, 닫기 기능

### 5. 상태 관리

| 상태 코드 | 한글 | 설명 |
|----------|------|------|
| `PENDING` | 대기 | 초기 상태 |
| `IN_PROGRESS` | 진행중 | 모바일에서 작성 중 |
| `IN_TRANSIT` | 운송중 | 배송 시작 |
| `ARRIVED` | 도착 | 현장 도착 |
| `UNLOADING` | 하차중 | 하역 작업 중 |
| `COMPLETED` | 완료 | 납품 완료 |
| `CANCELLED` | 취소 | 취소됨 |

---

## API 엔드포인트

### 관리자용
```
POST   /api/deliveries                         # 납품 생성 (메시지 발송)
GET    /api/deliveries/tree                    # 트리 구조 조회
GET    /api/deliveries                         # Flat 구조 조회
GET    /api/admin/deliveries/{id}/receipt-pdf  # PDF 다운로드
```

### 모바일용
```
GET    /api/public/deliveries/{token}          # 납품 정보 조회
POST   /api/public/deliveries/{token}/signature  # 서명 업로드
POST   /api/public/deliveries/{token}/photos     # 사진 업로드
POST   /api/public/deliveries/{token}/confirm    # 납품 완료
```

---

## 스타일링

### CSS 파일
- `assets/css/mobile-delivery.css` - 모바일 납품 페이지 스타일
- `assets/css/admin-receipts.css` - 관리자 인쇄 스타일

### 색상 스킴

| 항목 | 배경색 | 강조색 |
|------|--------|--------|
| 발주(Order) | `#eff6ff` | `#2563eb` (파란색) |
| 출하(Shipment) | `#f5f3ff` | `#7c3aed` (보라색) |
| 운송(Transport) | `#fef3c7` | `#fde047` (노란색) |
| 납품완료 | `#f0fdf4` | `#16a34a` (초록색) |
| 납품진행중 | `#fffbeb` | `#d97706` (주황색) |

---

## 에러 처리

### HTTP 상태 코드
| 코드 | 의미 |
|------|------|
| 410 Gone | 토큰 만료 |
| 404 Not Found | 토큰 무효 |
| 401 Unauthorized | 인증 오류 |
| 403 Forbidden | 권한 오류 |
| 500 Internal Server Error | 서버 오류 |

### Null 안전성
- 모든 nullable 필드에 `|| '-'` fallback 적용
- 타입 정의에서 `string | null` 명시
- 조건부 렌더링 (`v-if`, `v-else`)

---

## 개발 시 주의사항

1. **Null 체크 필수**: 모든 서버 데이터는 null 가능성 고려
2. **타입 안정성**: `types/delivery.ts`와 실제 API 응답 일치 확인
3. **모바일 최적화**: 터치 이벤트, 작은 화면 고려
4. **PDF 생성**: 서버 측 PDF 생성 완료 후 pdfFileUrl 제공
5. **토큰 보안**: 만료 시간 체크, 재사용 방지
6. **이미지 최적화**: 사진 업로드 시 크기 제한 (5MB/장)

---

## 최근 수정 사항 (2025-01-04)

1. ✅ IN_PROGRESS 상태 한글화 ("진행중")
2. ✅ 진행중 상태 안내 메시지 추가
3. ✅ itemSummary, shipmentDate nullable 처리
4. ✅ PDF 다운로드 버튼 시각성 개선 (빨간색 배경)
5. ✅ deliveryId fallback URL 생성 로직 추가
6. ✅ 사진 갤러리 닫기 버튼 추가

---

## 📚 관련 문서

- [API 엔드포인트 가이드](./API_ENDPOINTS_GUIDE.md)
- [CSS 가이드라인](./CSS_GUIDELINES.md)

---

**작성일**: 2025-01-27
**버전**: 1.0.0
