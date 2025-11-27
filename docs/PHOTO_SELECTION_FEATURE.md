# 📸 사진 선택 기능 구현 가이드

## 개요

납품현황 관리 페이지에서 각 출하별로 **사진대지 PDF에 포함할 사진을 선택**하는 기능입니다.

## 📋 요구사항

- 각 출하당 최대 5장의 사진 촬영 가능
- 사진대지 PDF에는 각 출하당 **최대 2장**만 포함
- 기본 선택: 1번, 2번 사진 (자동)
- 관리자가 체크박스로 변경 가능
- 선택 정보는 DB에 저장 (`is_selected_for_pdf`, `pdf_display_order`)

## 🗄️ 데이터베이스 설계

### 필요한 컬럼 추가 (백엔드 작업)

```sql
ALTER TABLE `delivery_done_photos`
ADD COLUMN `is_selected_for_pdf` TINYINT(1) DEFAULT 0 COMMENT '사진대지 포함 여부 (0:미포함, 1:포함)',
ADD COLUMN `pdf_display_order` INT DEFAULT NULL COMMENT '사진대지 표시 순서 (1부터 시작)',
ADD INDEX `idx_is_selected_for_pdf` (`is_selected_for_pdf`);
```

### 데이터 흐름

1. **납품 완료 시 (모바일)**
   - `deliveries` 테이블에 `photo1_path` ~ `photo5_path` 저장

2. **납품완료계 생성 시 (백엔드 자동)**
   - `delivery_done_photos` 테이블에 모든 사진 복사
   - 1번, 2번 사진 기본 선택 (`is_selected_for_pdf = 1`, `pdf_display_order = 1,2`)

3. **관리자 선택 변경 시**
   - 프론트엔드에서 `PUT /api/admin/delivery-done/{id}/photo-selection` 호출
   - 백엔드에서 선택 정보 업데이트

4. **PDF 생성 시**
   - `WHERE is_selected_for_pdf = 1 ORDER BY pdf_display_order` 쿼리로 선택된 사진만 조회

## 🎯 프론트엔드 구현

### 1. 타입 정의 추가

**파일**: `types/delivery-done.ts`

```typescript
// DeliveryDonePhoto 인터페이스에 필드 추가
export interface DeliveryDonePhoto {
  // ... 기존 필드들
  isSelectedForPdf?: boolean
  pdfDisplayOrder?: number | null
}

// 새로운 타입 추가
export interface DeliveryPhotoInfo {
  photoId: number
  deliveryDoneId: number
  deliveryId: number
  deliveryDate: string | null
  seq: number
  filePath: string
  thumbnailPath: string | null
  isSelectedForPdf: boolean
  pdfDisplayOrder: number | null
  // ... 기타 필드들
}

export interface UpdatePhotoSelectionRequest {
  deliveryDoneId: number
  deliveryId: number
  selectedPhotoIds: number[]  // 최대 2개
}

export interface UpdatePhotoSelectionResponse {
  success: boolean
  message: string
  updatedCount: number
}
```

### 2. 서비스 API 추가

**파일**: `services/delivery-done.service.ts`

```typescript
/**
 * 납품완료계 사진 목록 조회 (선택 정보 포함)
 */
export async function getDeliveryDonePhotos(
  deliveryDoneId: number
): Promise<DeliveryPhotoInfo[]>

/**
 * 사진 선택 업데이트 (출하별 최대 2장)
 */
export async function updatePhotoSelection(
  request: UpdatePhotoSelectionRequest
): Promise<UpdatePhotoSelectionResponse>
```

### 3. 컴포넌트 생성

**파일**: `components/admin/delivery-done/PhotoSelectionModal.vue`

**주요 기능**:
- 사진 그리드 표시 (썸네일)
- 체크박스 선택 (최대 2장)
- 선택 상태 시각화
- 선택 저장 API 호출

**Props**:
- `deliveryDoneId`: 납품완료계 ID
- `deliveryId`: 출하 ID
- `deliveryDate`: 납품일자

**Events**:
- `close`: 모달 닫기
- `saved`: 저장 완료

### 4. 트리 노드 컴포넌트 수정

**파일**: `components/admin/delivery/TransportDetailNode.vue`

**변경사항**:
- 납품확인 완료 시 "사진 선택" 버튼 추가
- `PhotoSelectionModal` import
- `deliveryDoneId` prop 추가
- 버튼 클릭 시 모달 열기

**Props 추가**:
```typescript
interface Props {
  transport: TransportDetailNode
  level: number
  deliveryDoneId?: number  // ✅ 추가
}
```

### 5. Props 전달 체인

```
OrderTreeNode (list.vue)
  ↓ deliveryDoneId
DeliveryOrderTreeNode
  ↓ deliveryDoneId
ShipmentTreeNode
  ↓ deliveryDoneId
TransportDetailNode
  ↓ deliveryDoneId, deliveryId
PhotoSelectionModal
```

**파일 수정**:
1. `types/delivery.ts`: `OrderTreeNode`에 `deliveryDoneId` 필드 추가
2. `components/admin/delivery/DeliveryOrderTreeNode.vue`: prop 전달
3. `components/admin/delivery/ShipmentTreeNode.vue`: prop 전달

## 🎨 UI/UX

### 사진 선택 버튼
- 위치: 납품확인 완료 정보 라인 (PDF, 사진 버튼 옆)
- 색상: 보라색 그라데이션 (`#8b5cf6` → `#7c3aed`)
- 아이콘: `fa-images`
- 텍스트: "사진 선택"

### 모달 UI
- 그리드 레이아웃 (180px 카드)
- 1:1 정사각형 썸네일
- 선택 시 파란색 테두리 + 체크 아이콘
- 최대 2장 제한 (초과 시 alert)
- 선택 상태 바 (하단)
- 저장 버튼 (파란색)

## 📡 API 엔드포인트 (백엔드 구현 필요)

### 1. 사진 목록 조회

```http
GET /api/admin/delivery-done/{deliveryDoneId}/photos
```

**응답**:
```json
[
  {
    "photoId": 123,
    "deliveryDoneId": 5,
    "deliveryId": 45,
    "deliveryDate": "2025-01-15",
    "seq": 1,
    "filePath": "/uploads/2025/01/photo1.jpg",
    "thumbnailPath": "/uploads/2025/01/photo1_thumb.jpg",
    "isSelectedForPdf": true,
    "pdfDisplayOrder": 1,
    "latitude": 37.5665,
    "longitude": 126.9780
  }
]
```

### 2. 사진 선택 업데이트

```http
PUT /api/admin/delivery-done/{deliveryDoneId}/photo-selection
```

**요청 Body**:
```json
{
  "deliveryId": 45,
  "selectedPhotoIds": [123, 125]
}
```

**응답**:
```json
{
  "success": true,
  "message": "사진 선택이 저장되었습니다.",
  "updatedCount": 2
}
```

## 🔧 백엔드 구현 가이드

### 사진 선택 업데이트 로직

```java
@PutMapping("/admin/delivery-done/{id}/photo-selection")
public ResponseEntity<?> updatePhotoSelection(
    @PathVariable Long id,
    @RequestBody PhotoSelectionRequest request
) {
    // 1. 검증: 최대 2장까지만
    if (request.getSelectedPhotoIds().size() > 2) {
        throw new BadRequestException("최대 2장까지만 선택 가능합니다.");
    }

    // 2. 기존 선택 해제
    photoRepository.updateByDeliveryDoneIdAndDeliveryId(
        id,
        request.getDeliveryId(),
        false,  // is_selected_for_pdf
        null    // pdf_display_order
    );

    // 3. 새로운 선택 적용
    for (int i = 0; i < request.getSelectedPhotoIds().size(); i++) {
        photoRepository.updateSelection(
            request.getSelectedPhotoIds().get(i),
            true,   // is_selected_for_pdf
            i + 1   // pdf_display_order (1, 2)
        );
    }

    return ResponseEntity.ok(new PhotoSelectionResponse(
        true,
        "사진 선택이 저장되었습니다.",
        request.getSelectedPhotoIds().size()
    ));
}
```

### PDF 생성 시 쿼리

```sql
SELECT
  d.delivery_date,
  d.tracking_number,
  d.vehicle_no,
  p.file_path,
  p.photo_description,
  p.latitude,
  p.longitude,
  p.pdf_display_order
FROM delivery_done_photos p
JOIN deliveries d ON p.delivery_id = d.delivery_id
WHERE p.delivery_done_id = ?
  AND p.is_selected_for_pdf = 1
ORDER BY d.delivery_date ASC, p.pdf_display_order ASC;
```

## ✅ 테스트 시나리오

### 1. 기본 선택 확인
1. 납품 완료 후 `delivery_done_photos` 테이블 확인
2. 1번, 2번 사진이 `is_selected_for_pdf = 1`로 설정되어 있는지 확인

### 2. 사진 선택 변경
1. 납품현황 관리 > 출하 확장 > "사진 선택" 버튼 클릭
2. 모달에서 3번, 5번 사진 선택
3. "선택 저장" 클릭
4. DB에서 3번, 5번 사진이 선택된 것 확인

### 3. 최대 2장 제한
1. 모달에서 3장 이상 선택 시도
2. Alert 메시지 확인: "최대 2장까지만 선택 가능합니다."

### 4. PDF 생성 확인
1. 선택된 사진만 PDF에 포함되는지 확인
2. PDF 내 사진 순서가 `pdf_display_order`와 일치하는지 확인

## 📝 주의사항

1. **deliveryDoneId vs orderId**
   - `delivery_done` 테이블의 PK는 `delivery_done_id`
   - `orders` 테이블과 1:1 관계 (`order_id` FK)
   - 프론트엔드에서는 `orderId`를 `deliveryDoneId`로 사용 가능

2. **사진 개수 제한**
   - 촬영: 최대 5장
   - 선택: 최대 2장
   - 백엔드에서 반드시 검증 필요

3. **Null 처리**
   - `thumbnailPath`가 null일 경우 `filePath` 사용
   - `deliveryDoneId`가 없을 경우 버튼 숨김 처리

4. **트랜잭션 처리**
   - 사진 선택 업데이트는 하나의 트랜잭션으로 처리
   - 실패 시 롤백 필요

## 🚀 배포 전 체크리스트

- [ ] DB 컬럼 추가 완료
- [ ] 백엔드 API 구현 완료
- [ ] 기본 선택 로직 구현 (1번, 2번 자동 선택)
- [ ] 프론트엔드 컴포넌트 동작 확인
- [ ] 최대 2장 제한 동작 확인
- [ ] PDF 생성 시 선택된 사진만 포함 확인
- [ ] 에러 처리 및 사용자 피드백 확인

## 📚 참고 파일

**프론트엔드**:
- `types/delivery-done.ts` - 타입 정의
- `services/delivery-done.service.ts` - API 서비스
- `components/admin/delivery-done/PhotoSelectionModal.vue` - 모달
- `components/admin/delivery/TransportDetailNode.vue` - 버튼
- `components/admin/delivery/ShipmentTreeNode.vue` - prop 전달
- `components/admin/delivery/DeliveryOrderTreeNode.vue` - prop 전달

**백엔드 (구현 필요)**:
- `DeliveryDoneController.java`
- `DeliveryDonePhotoRepository.java`
- `PhotoSelectionRequest.java` / `PhotoSelectionResponse.java`
- PDF 생성 로직 수정

---

**작성일**: 2025-01-25
**작성자**: Claude Code
**버전**: 1.0
