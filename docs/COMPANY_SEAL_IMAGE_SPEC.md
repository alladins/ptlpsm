# 회사 직인 이미지 전송 명세서

## 📋 개요

**목적**: 회사 정보 등록/수정 시 직인 이미지를 백엔드로 전송하는 방법 정리
**방식**: Base64 인코딩된 이미지 데이터를 JSON 필드로 전송
**지원 형식**: PNG, JPG, JPEG
**최대 크기**: 2MB

---

## 🎯 요구사항

### 1. 프론트엔드 검증
- **파일 형식**: `image/png`, `image/jpeg`, `image/jpg`만 허용
- **파일 크기**: 최대 2MB (2,097,152 bytes)
- **미리보기**: 업로드 즉시 Base64로 변환하여 화면에 표시
- **제거 기능**: 업로드한 이미지 제거 가능

### 2. 백엔드 저장
- **저장 방식**: Base64 문자열을 디코딩하여 서버 파일 시스템에 저장
- **파일명**: 원본 파일명 유지 또는 UUID 생성
- **저장 경로**: `/uploads/company/seals/` 또는 클라우드 스토리지
- **URL 반환**: 저장 후 접근 가능한 URL 반환 (`sealImageUrl`)

---

## 📦 데이터 전송 형식

### 1️⃣ 회사 등록 (POST /api/basic/company)

#### Request Body (JSON)
```json
{
  "companyName": "주식회사 리드파워",
  "businessNumber": "403-81-76111",
  "g2bNumber": "D1503249",
  "representative": "이승현",
  "address": "경기 안성시 서운면 서동로 21-10",
  "detailAddress": "",
  "zipCode": "17608",
  "tel": "031-676-2675",
  "fax": "031-676-2674",
  "email": "leadpower@example.com",
  "homepage": "http://leadpower.com",
  "establishedDate": "2000-01-01",
  "employeeCount": 50,
  "annualSales": 5000000000,
  "businessType": "제조업",
  "businessCategory": "건축자재, 단열재",
  "sealImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "sealImageFileName": "company_seal.png"
}
```

#### 필드 설명
- **sealImage** (optional, string): Base64 인코딩된 이미지 데이터
  - 형식: `data:image/png;base64,{base64String}`
  - 전체 Data URL 형식으로 전송 (MIME 타입 포함)
  - 백엔드에서 `data:image/png;base64,` 접두사 제거 후 디코딩

- **sealImageFileName** (optional, string): 원본 파일명
  - 예시: `"company_seal.png"`, `"직인.jpg"`
  - 백엔드에서 파일 저장 시 참고용

---

### 2️⃣ 회사 수정 (PUT /api/basic/company/{id})

#### Request Body (JSON)
```json
{
  "companyName": "주식회사 리드파워",
  "businessNumber": "403-81-76111",
  // ... 기타 필드 동일 ...
  "sealImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "sealImageFileName": "new_seal.png"
}
```

#### 직인 이미지 업데이트 시나리오

**Case 1: 새 이미지로 변경**
- `sealImage`: 새로운 Base64 데이터
- `sealImageFileName`: 새 파일명
- 백엔드 동작: 기존 이미지 삭제 후 새 이미지 저장

**Case 2: 기존 이미지 유지**
- `sealImage`: `undefined` (필드 전송 안 함)
- `sealImageFileName`: `undefined` (필드 전송 안 함)
- 백엔드 동작: 기존 이미지 유지

**Case 3: 이미지 제거**
- `sealImage`: `null`
- `sealImageFileName`: `null`
- 백엔드 동작: 기존 이미지 삭제

---

### 3️⃣ 회사 조회 (GET /api/basic/company/{id})

#### Response Body (JSON)
```json
{
  "id": 1,
  "companyName": "주식회사 리드파워",
  "businessNumber": "403-81-76111",
  // ... 기타 필드 ...
  "sealImageUrl": "http://leadpower.platree.com:9031/uploads/company/seals/seal_123456.png",
  "sealImageFileName": "company_seal.png",
  "createdAt": "2025-01-14T10:00:00",
  "updatedAt": "2025-01-14T10:00:00"
}
```

#### 필드 설명
- **sealImageUrl** (string | null): 직인 이미지 접근 URL
  - 예시: `"http://example.com/uploads/company/seals/seal_123.png"`
  - 이미지 없음: `null`
  - 프론트엔드에서 `<img :src="sealImageUrl">` 형태로 표시

- **sealImageFileName** (string | null): 원본 파일명
  - 예시: `"company_seal.png"`
  - 이미지 없음: `null`

---

## 🔧 프론트엔드 구현

### 1️⃣ 파일 업로드 처리 (CompanyForm.vue)

```typescript
// 직인 이미지 업로드
const handleSealImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // 파일 타입 검증
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    alert('PNG 또는 JPG 형식의 이미지만 업로드 가능합니다.')
    input.value = ''
    return
  }

  // 파일 크기 검증 (2MB)
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    alert('이미지 파일 크기는 2MB를 초과할 수 없습니다.')
    input.value = ''
    return
  }

  try {
    // Base64 변환
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      // ✅ Data URL 형식 전체 저장 (data:image/png;base64,...)
      formData.value.sealImage = base64
      formData.value.sealImageFileName = file.name
      sealPreview.value = base64
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('이미지 변환 오류:', error)
    alert('이미지 업로드 중 오류가 발생했습니다.')
  }
}

// 직인 이미지 제거
const removeSealImage = () => {
  formData.value.sealImage = undefined
  formData.value.sealImageFileName = undefined
  sealPreview.value = ''
  if (sealFileInput.value) {
    sealFileInput.value.value = ''
  }
}
```

### 2️⃣ 등록 요청 (register.vue)

```typescript
// 등록 처리
async function handleCreate(data: CompanyCreateRequest) {
  try {
    formRef.value.setSaving(true)

    // ✅ sealImage, sealImageFileName 포함하여 전송
    const response = await companyService.createCompany(data)

    alert('회사 정보가 등록되었습니다.')
    router.push(`/admin/basic-info/company/detail/${response.id}`)
  } catch (error: any) {
    console.error('Failed to create company:', error)
    alert(error.response?.data?.message || '회사 정보 등록에 실패했습니다.')
  } finally {
    formRef.value.setSaving(false)
  }
}
```

### 3️⃣ 수정 요청 (edit.vue)

```typescript
// 수정 처리
async function handleUpdate(data: CompanyUpdateRequest) {
  try {
    formRef.value.setSaving(true)

    // ✅ sealImage가 변경된 경우에만 전송
    const response = await companyService.updateCompany(companyId, data)

    alert('회사 정보가 수정되었습니다.')
    router.push(`/admin/basic-info/company/detail/${companyId}`)
  } catch (error: any) {
    console.error('Failed to update company:', error)
    alert(error.response?.data?.message || '회사 정보 수정에 실패했습니다.')
  } finally {
    formRef.value.setSaving(false)
  }
}
```

### 4️⃣ 조회 시 이미지 표시

```vue
<template>
  <!-- 기존 직인 이미지 표시 -->
  <div v-if="companyData?.sealImageUrl" class="seal-preview">
    <img :src="companyData.sealImageUrl" alt="회사 직인">
  </div>
  <div v-else class="seal-placeholder">
    <i class="fas fa-stamp"></i>
    <p>직인 이미지 없음</p>
  </div>
</template>
```

---

## 🖥️ 백엔드 구현 (서버 개발자용)

### 1️⃣ 등록 API (POST /api/basic/company)

```java
@PostMapping
public ResponseEntity<CompanyResponse> createCompany(
    @RequestBody CompanyCreateRequest request
) {
    // 1. 기본 정보 저장
    Company company = companyMapper.toEntity(request);

    // 2. 직인 이미지 처리
    if (request.getSealImage() != null && !request.getSealImage().isEmpty()) {
        try {
            // Base64 디코딩
            String base64Data = request.getSealImage();

            // "data:image/png;base64," 접두사 제거
            if (base64Data.startsWith("data:")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Data);

            // 파일명 생성 (UUID + 확장자)
            String extension = getFileExtension(request.getSealImageFileName());
            String savedFileName = UUID.randomUUID().toString() + extension;

            // 파일 저장
            String savePath = "/uploads/company/seals/" + savedFileName;
            Files.write(Paths.get(savePath), imageBytes);

            // DB에 URL 저장
            String imageUrl = "http://leadpower.platree.com:9031" + savePath;
            company.setSealImageUrl(imageUrl);
            company.setSealImageFileName(request.getSealImageFileName());

        } catch (Exception e) {
            log.error("직인 이미지 저장 실패", e);
            throw new RuntimeException("직인 이미지 저장 중 오류가 발생했습니다.");
        }
    }

    // 3. DB 저장
    company = companyRepository.save(company);

    return ResponseEntity.ok(companyMapper.toResponse(company));
}

private String getFileExtension(String fileName) {
    if (fileName == null || !fileName.contains(".")) {
        return ".png"; // 기본 확장자
    }
    return fileName.substring(fileName.lastIndexOf("."));
}
```

### 2️⃣ 수정 API (PUT /api/basic/company/{id})

```java
@PutMapping("/{id}")
public ResponseEntity<CompanyResponse> updateCompany(
    @PathVariable Long id,
    @RequestBody CompanyUpdateRequest request
) {
    Company company = companyRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("회사 정보를 찾을 수 없습니다."));

    // 1. 기본 정보 업데이트
    companyMapper.updateEntity(company, request);

    // 2. 직인 이미지 처리
    if (request.getSealImage() != null) {
        if (request.getSealImage().equals("null") || request.getSealImage().isEmpty()) {
            // 이미지 제거
            deleteOldSealImage(company);
            company.setSealImageUrl(null);
            company.setSealImageFileName(null);
        } else {
            // 새 이미지 업로드
            deleteOldSealImage(company); // 기존 이미지 삭제

            try {
                String base64Data = request.getSealImage();
                if (base64Data.startsWith("data:")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }

                byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                String extension = getFileExtension(request.getSealImageFileName());
                String savedFileName = UUID.randomUUID().toString() + extension;
                String savePath = "/uploads/company/seals/" + savedFileName;

                Files.write(Paths.get(savePath), imageBytes);

                String imageUrl = "http://leadpower.platree.com:9031" + savePath;
                company.setSealImageUrl(imageUrl);
                company.setSealImageFileName(request.getSealImageFileName());

            } catch (Exception e) {
                log.error("직인 이미지 저장 실패", e);
                throw new RuntimeException("직인 이미지 저장 중 오류가 발생했습니다.");
            }
        }
    }
    // request.getSealImage()가 없으면 기존 이미지 유지

    // 3. DB 저장
    company = companyRepository.save(company);

    return ResponseEntity.ok(companyMapper.toResponse(company));
}

private void deleteOldSealImage(Company company) {
    if (company.getSealImageUrl() != null) {
        try {
            // URL에서 파일 경로 추출
            String filePath = company.getSealImageUrl()
                .replace("http://leadpower.platree.com:9031", "");
            Files.deleteIfExists(Paths.get(filePath));
        } catch (Exception e) {
            log.warn("기존 직인 이미지 삭제 실패", e);
        }
    }
}
```

### 3️⃣ 조회 API (GET /api/basic/company/{id})

```java
@GetMapping("/{id}")
public ResponseEntity<CompanyResponse> getCompany(@PathVariable Long id) {
    Company company = companyRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("회사 정보를 찾을 수 없습니다."));

    // ✅ sealImageUrl, sealImageFileName 포함하여 반환
    return ResponseEntity.ok(companyMapper.toResponse(company));
}
```

---

## 🗄️ 데이터베이스 스키마

### company 테이블

```sql
CREATE TABLE company (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL COMMENT '회사명',
  business_number VARCHAR(20) NOT NULL COMMENT '사업자등록번호',
  g2b_number VARCHAR(8) NULL COMMENT '나라장터등록번호',
  representative VARCHAR(50) NOT NULL COMMENT '대표자명',
  address VARCHAR(200) NOT NULL COMMENT '주소',
  detail_address VARCHAR(200) NULL COMMENT '상세주소',
  zip_code VARCHAR(10) NOT NULL COMMENT '우편번호',
  tel VARCHAR(20) NOT NULL COMMENT '전화번호',
  fax VARCHAR(20) NULL COMMENT '팩스번호',
  email VARCHAR(100) NOT NULL COMMENT '이메일',
  homepage VARCHAR(200) NULL COMMENT '홈페이지',
  established_date DATE NOT NULL COMMENT '설립일자',
  employee_count INT NULL COMMENT '직원수',
  annual_sales BIGINT NULL COMMENT '연매출액',
  business_type VARCHAR(100) NOT NULL COMMENT '업태',
  business_category VARCHAR(100) NOT NULL COMMENT '업종',
  seal_image_url VARCHAR(500) NULL COMMENT '직인 이미지 URL',
  seal_image_file_name VARCHAR(100) NULL COMMENT '직인 파일명',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_business_number (business_number),
  INDEX idx_company_name (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='회사 정보';
```

---

## 📊 시나리오별 동작

### ✅ 시나리오 1: 직인 포함 회사 등록
```
1. [프론트] 사용자가 회사 정보 입력
2. [프론트] 직인 이미지 업로드 (PNG 파일 선택)
3. [프론트] FileReader로 Base64 변환
4. [프론트] POST /api/basic/company 요청
   - sealImage: "data:image/png;base64,iVBORw0KG..."
   - sealImageFileName: "company_seal.png"
5. [백엔드] Base64 디코딩
6. [백엔드] /uploads/company/seals/ 에 저장
7. [백엔드] DB에 URL 저장
   - seal_image_url: "http://example.com/uploads/company/seals/abc123.png"
   - seal_image_file_name: "company_seal.png"
8. [백엔드] 응답 반환 (sealImageUrl 포함)
9. [프론트] 등록 완료 → 상세 페이지 이동
```

### ✅ 시나리오 2: 직인 없이 회사 등록
```
1. [프론트] 사용자가 회사 정보 입력 (직인 업로드 안 함)
2. [프론트] POST /api/basic/company 요청
   - sealImage: undefined (필드 전송 안 함)
   - sealImageFileName: undefined
3. [백엔드] 직인 이미지 저장 과정 스킵
4. [백엔드] DB에 NULL 저장
   - seal_image_url: NULL
   - seal_image_file_name: NULL
5. [백엔드] 응답 반환
```

### ✅ 시나리오 3: 기존 회사 직인 변경
```
1. [프론트] 회사 수정 페이지 진입
2. [프론트] 기존 직인 이미지 표시 (sealImageUrl 사용)
3. [프론트] 새 직인 이미지 업로드
4. [프론트] PUT /api/basic/company/{id} 요청
   - sealImage: "data:image/png;base64,NEW_IMAGE..."
   - sealImageFileName: "new_seal.png"
5. [백엔드] 기존 이미지 파일 삭제
6. [백엔드] 새 이미지 저장
7. [백엔드] DB URL 업데이트
8. [백엔드] 응답 반환
```

### ✅ 시나리오 4: 기존 회사 직인 제거
```
1. [프론트] 회사 수정 페이지에서 직인 제거 버튼 클릭
2. [프론트] removeSealImage() 호출
   - formData.sealImage = undefined
   - formData.sealImageFileName = undefined
3. [프론트] PUT /api/basic/company/{id} 요청
   - sealImage: null
   - sealImageFileName: null
4. [백엔드] 기존 이미지 파일 삭제
5. [백엔드] DB에 NULL 저장
6. [백엔드] 응답 반환
```

---

## 🔒 보안 고려사항

### 1. 파일 업로드 보안
- ✅ MIME 타입 검증 (프론트 + 백엔드)
- ✅ 파일 크기 제한 (2MB)
- ✅ 파일 확장자 검증
- ✅ 파일명 UUID 변환 (경로 traversal 방지)

### 2. Base64 처리
- ✅ Base64 디코딩 예외 처리
- ✅ 손상된 데이터 처리
- ✅ 메모리 오버플로 방지 (크기 제한)

### 3. 파일 접근 제어
- 권장: 파일 저장 경로를 웹 루트 외부에 설정
- 권장: Nginx/Apache로 정적 파일 서빙
- 권장: 인증된 사용자만 이미지 접근 가능하도록 설정

---

## 📝 테스트 방법

### 1. 프론트엔드 테스트
```javascript
// 브라우저 개발자 도구 콘솔
// 1. 회사 등록 시 sealImage 확인
const formData = {
  companyName: "테스트",
  // ...
  sealImage: "data:image/png;base64,iVBORw0KGgo...",
  sealImageFileName: "test_seal.png"
}

// 2. Base64 길이 확인
console.log('Base64 길이:', formData.sealImage.length)

// 3. 이미지 미리보기 확인
const img = new Image()
img.src = formData.sealImage
document.body.appendChild(img)
```

### 2. 백엔드 테스트
```bash
# cURL로 등록 테스트
curl -X POST http://localhost:9031/api/basic/company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "테스트 회사",
    "businessNumber": "123-45-67890",
    "representative": "홍길동",
    "address": "서울시 강남구",
    "zipCode": "12345",
    "tel": "02-1234-5678",
    "email": "test@test.com",
    "establishedDate": "2000-01-01",
    "businessType": "제조업",
    "businessCategory": "IT",
    "sealImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "sealImageFileName": "test_seal.png"
  }'
```

---

## 🎯 체크리스트

### 프론트엔드
- [x] 파일 형식 검증 (PNG, JPG)
- [x] 파일 크기 검증 (2MB)
- [x] Base64 변환 구현
- [x] 미리보기 기능
- [x] 제거 기능
- [x] 등록/수정 API 연동
- [x] 조회 시 이미지 표시

### 백엔드
- [ ] Base64 디코딩 구현
- [ ] 파일 저장 경로 설정
- [ ] UUID 파일명 생성
- [ ] 기존 파일 삭제 로직
- [ ] DB 스키마 추가 (seal_image_url, seal_image_file_name)
- [ ] 등록 API 구현
- [ ] 수정 API 구현
- [ ] 조회 API 응답에 URL 포함
- [ ] 에러 처리 (디코딩 실패, 저장 실패 등)

---

## 📞 참고

작성일: 2025-01-14
프론트엔드: 완료 ✅
백엔드: 구현 필요 ⏳
