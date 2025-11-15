# PDF 생성 완전 가이드

## 📋 개요

운송장 인수증을 PDF로 다운로드할 수 있는 기능을 추가하는 방법을 안내합니다.

이 가이드는 다음 내용을 포함합니다:
- Part 1: 방법 선택 및 비교
- Part 2: 단계별 구현
- Part 3: 고급 설정
- Part 4: 트러블슈팅
- Part 5: 배포 체크리스트

---

# Part 1: 방법 선택 및 비교

## 🚀 방법 1: html2pdf.js (추천 ⭐)

### 장점
- ✅ 기존 HTML 템플릿을 그대로 사용
- ✅ 클라이언트 사이드에서 즉시 생성
- ✅ 추가 서버 구성 불필요
- ✅ 한글 폰트 자동 지원
- ✅ 10분 이내 빠른 구현

### 단점
- ❌ 브라우저에 따라 미세한 차이 가능
- ❌ 대용량 문서 처리 시 속도 저하

---

## 🎨 방법 2: jsPDF + html2canvas

### 장점
- ✅ 더 세밀한 제어 가능
- ✅ 커스텀 폰트 추가 가능
- ✅ 워터마크 등 고급 기능

### 단점
- ❌ 구현 복잡도 높음
- ❌ 한글 폰트 설정 필요

### 설치
```bash
npm install jspdf html2canvas
```

### 기본 사용 예시
```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const generatePDF = async () => {
  try {
    const element = document.querySelector('.receipt-preview')

    // HTML을 Canvas로 변환
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })

    // Canvas를 이미지로 변환
    const imgData = canvas.toDataURL('image/png')

    // PDF 생성
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    // 이미지를 PDF에 추가
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // PDF 저장
    pdf.save(`인수증_${formData.value.trackingNumber}.pdf`)
  } catch (error) {
    console.error('PDF 생성 실패:', error)
    alert('PDF 생성에 실패했습니다.')
  }
}
```

---

## 🖥️ 방법 3: 백엔드 PDF 생성 (서버 사이드)

### 장점
- ✅ 일관된 품질 보장
- ✅ 한글 폰트 완벽 지원
- ✅ 템플릿 관리 용이
- ✅ 대용량 문서 처리 가능

### 단점
- ❌ 서버 개발 필요
- ❌ 서버 부하 증가
- ❌ 네트워크 지연 가능

### 백엔드 기술 스택

#### Java (Spring Boot)
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
</dependency>
```

#### Node.js
```bash
npm install puppeteer
# 또는
npm install pdfkit
```

#### Python
```bash
pip install reportlab
# 또는
pip install weasyprint
```

### 프론트엔드 구현
```typescript
const downloadPDF = async () => {
  try {
    const response = await axios.get(
      `${getApiBaseUrl()}/admin/transports/${formData.value.transportId}/receipt/pdf`,
      {
        responseType: 'blob',
        timeout: 30000 // 30초 타임아웃
      }
    )

    // Blob을 파일로 다운로드
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `인수증_${formData.value.trackingNumber}_${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('PDF 다운로드 완료')
  } catch (error) {
    console.error('PDF 다운로드 실패:', error)
    alert('PDF 생성에 실패했습니다.')
  }
}
```

### 백엔드 API 예시 (Spring Boot)
```java
@RestController
@RequestMapping("/admin/transports")
public class TransportController {

    @GetMapping("/{transportId}/receipt/pdf")
    public ResponseEntity<byte[]> generateReceiptPDF(@PathVariable Long transportId) {
        try {
            // 운송장 정보 조회
            Transport transport = transportService.getTransport(transportId);
            Shipment shipment = shipmentService.getShipment(transport.getShipmentId());

            // PDF 생성
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // 한글 폰트 설정
            PdfFont font = PdfFontFactory.createFont("fonts/NanumGothic.ttf", PdfEncodings.IDENTITY_H);
            document.setFont(font);

            // 인수증 내용 작성
            document.add(new Paragraph("인 수 증").setFontSize(24).setBold());
            document.add(new Paragraph("거래처명: " + shipment.getClient()));
            // ... 나머지 내용

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                ContentDisposition.attachment()
                    .filename("인수증_" + transport.getTrackingNumber() + ".pdf", StandardCharsets.UTF_8)
                    .build()
            );

            return new ResponseEntity<>(baos.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

---

## 📊 방법 비교표

| 특징 | html2pdf.js | jsPDF + html2canvas | 백엔드 PDF |
|------|-------------|---------------------|-----------|
| **구현 난이도** | ⭐ 쉬움 | ⭐⭐ 보통 | ⭐⭐⭐ 어려움 |
| **품질** | ⭐⭐⭐ 좋음 | ⭐⭐⭐⭐ 매우 좋음 | ⭐⭐⭐⭐⭐ 최고 |
| **한글 지원** | ✅ 자동 | ✅ 설정 필요 | ✅ 완벽 |
| **서버 부하** | 없음 | 없음 | 있음 |
| **일관성** | ⭐⭐ 브라우저 의존 | ⭐⭐⭐ 좋음 | ⭐⭐⭐⭐⭐ 완벽 |
| **비용** | 무료 | 무료 | 서버 비용 |
| **구현 시간** | 10분 | 30분 | 2시간+ |

---

## 🎯 프로젝트 추천: html2pdf.js ⭐

### 추천 이유
1. 기존 HTML 템플릿을 그대로 사용 가능
2. 빠른 구현 (10분 이내)
3. 서버 수정 불필요
4. 한글 폰트 자동 지원
5. 인수증 용도로 충분한 품질

---

# Part 2: 단계별 구현 (html2pdf.js)

## Step 1: html2pdf.js 설치

프로젝트 루트 디렉토리에서 실행:

```bash
npm install html2pdf.js
```

또는

```bash
yarn add html2pdf.js
```

설치 후 `package.json`에 다음이 추가됨:
```json
{
  "dependencies": {
    "html2pdf.js": "^0.10.2"
  }
}
```

---

## Step 2: 코드 수정

**파일**: `pages/admin/transport/edit/[id].vue`

### 2-1. Import 추가

```typescript
import { getApiBaseUrl } from '~/services/api'
import html2pdf from 'html2pdf.js'  // ← 이 줄 추가
```

### 2-2. printReceiptDocument 함수 수정

**기존 코드** (Line 810-814):
```typescript
// 인수증 문서 출력
const printReceiptDocument = () => {
  console.log('인수증 문서 출력')
  window.print()
  closeReceiptPopup()
}
```

**수정 후**:
```typescript
// 인수증 문서 출력
const printReceiptDocument = async () => {
  console.log('인수증 문서 출력')

  // 사용자에게 출력 방식 선택
  const usePDF = confirm(
    'PDF로 다운로드하시겠습니까?\n\n' +
    '✅ 확인: PDF 파일로 다운로드\n' +
    '❌ 취소: 브라우저 인쇄창 열기'
  )

  if (usePDF) {
    try {
      // PDF 생성 대상 요소
      const element = document.querySelector('.receipt-preview')

      if (!element) {
        alert('인수증 템플릿을 찾을 수 없습니다.')
        return
      }

      // 파일명 생성
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filename = `인수증_${formData.value.trackingNumber || 'unknown'}_${today}.pdf`

      // PDF 생성 옵션
      const opt = {
        margin: [10, 10, 10, 10], // 상, 우, 하, 좌 여백 (mm)
        filename: filename,
        image: {
          type: 'jpeg',
          quality: 0.98
        },
        html2canvas: {
          scale: 2,                    // 해상도 (2 = 200%)
          useCORS: true,               // 외부 이미지 허용
          logging: false,              // 콘솔 로그 비활성화
          backgroundColor: '#ffffff',  // 배경색
          letterRendering: true        // 텍스트 렌더링 개선
        },
        jsPDF: {
          unit: 'mm',                  // 단위
          format: 'a4',                // 용지 크기
          orientation: 'portrait',     // 세로 방향
          compress: true               // 파일 압축
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']  // 페이지 나누기 방지
        }
      }

      console.log('PDF 생성 중...', { filename, element })

      // PDF 생성 및 다운로드
      await html2pdf().set(opt).from(element).save()

      console.log('PDF 생성 완료:', filename)

      // 성공 메시지 (선택사항)
      // alert('PDF 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      alert(
        'PDF 생성에 실패했습니다.\n' +
        '브라우저 인쇄 기능을 사용해주세요.\n\n' +
        '오류: ' + (error.message || '알 수 없는 오류')
      )
    }
  } else {
    // 브라우저 기본 인쇄
    window.print()
  }

  closeReceiptPopup()
}
```

---

## Step 3: 테스트

### 3-1. 개발 서버 재시작

```bash
npm run dev
```

### 3-2. 테스트 시나리오

1. **운송장 목록 페이지** 접속
   - URL: `http://localhost:3000/admin/transport/list`

2. **운송장 수정 페이지** 접속
   - 운송장 하나 클릭
   - URL: `http://localhost:3000/admin/transport/edit/2`

3. **인수증 팝업 열기**
   - "운송장 출력" 버튼 클릭
   - 인수증 팝업이 표시됨

4. **PDF 다운로드 테스트**
   - "인수증 출력" 버튼 클릭
   - 확인 대화상자에서 "확인" 클릭
   - PDF 파일 자동 다운로드 확인
   - 파일명: `인수증_20251029-1234-001_20251101.pdf`

5. **브라우저 인쇄 테스트**
   - "인수증 출력" 버튼 클릭
   - 확인 대화상자에서 "취소" 클릭
   - 브라우저 인쇄창 표시 확인

### 3-3. 예상 결과

**성공 시**:
- ✅ PDF 파일이 브라우저 다운로드 폴더에 저장됨
- ✅ 파일을 열면 인수증 내용이 정상 표시됨
- ✅ 한글, 표, 이미지 모두 정상 출력됨
- ✅ A4 용지 크기에 맞게 출력됨

**실패 시**:
- ❌ 에러 메시지가 alert로 표시됨
- ❌ 콘솔에 에러 로그 출력됨
- ❌ 자동으로 브라우저 인쇄 대체 제안

---

# Part 3: 고급 설정

## 1. 파일명 커스터마이징

```typescript
// 거래처명 포함
const filename = `인수증_${formData.value.clientName}_${formData.value.trackingNumber}_${today}.pdf`
// 예: 인수증_한국농어촌공사_20251029-1234-001_20251101.pdf

// 더 간단한 형식
const filename = `인수증_${formData.value.trackingNumber}.pdf`
// 예: 인수증_20251029-1234-001.pdf
```

---

## 2. 페이지 나누기 설정

인수증이 2장인 경우 각각 별도 페이지로:

```typescript
pagebreak: {
  mode: ['css'],
  before: '.receipt-document:nth-child(2)'  // 두 번째 인수증 전에 페이지 나누기
}
```

---

## 3. 로딩 인디케이터 추가

```typescript
const printReceiptDocument = async () => {
  if (usePDF) {
    // 로딩 표시
    const loadingMsg = document.createElement('div')
    loadingMsg.textContent = 'PDF 생성 중...'
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
                                'background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;' +
                                'z-index:9999;font-size:16px;font-weight:600;'
    document.body.appendChild(loadingMsg)

    try {
      await html2pdf().set(opt).from(element).save()
    } finally {
      // 로딩 제거
      document.body.removeChild(loadingMsg)
    }
  }
}
```

---

## 4. 환경별 설정

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

const opt = {
  // ... 기존 옵션
  html2canvas: {
    logging: isDevelopment,  // 개발 환경에서만 로그
    scale: isDevelopment ? 1.5 : 2  // 개발 환경에서는 낮은 해상도
  }
}
```

---

## 5. 성능 모니터링

```typescript
const startTime = Date.now()

await html2pdf().set(opt).from(element).save()

const endTime = Date.now()
console.log(`PDF 생성 시간: ${endTime - startTime}ms`)
```

---

# Part 4: 트러블슈팅

## 문제 1: "html2pdf is not defined"

**원인**: Import 경로 오류

**해결**:
```typescript
// ❌ 틀린 방법
import html2pdf from 'html2pdf'

// ✅ 올바른 방법
import html2pdf from 'html2pdf.js'
```

---

## 문제 2: PDF에 이미지(로고)가 안 나옴

**원인**: CORS 정책

**해결**:
```typescript
html2canvas: {
  useCORS: true,
  allowTaint: true,  // ← 추가
  proxy: null
}
```

---

## 문제 3: 페이지가 잘림

**원인**: 페이지 나누기 설정

**해결**:
```typescript
pagebreak: {
  mode: ['avoid-all'],  // 페이지 나누기 방지
  after: '.receipt-document'  // 문서 단위로 분리
}
```

---

## 문제 4: 폰트가 깨짐

**원인**: 텍스트 렌더링 문제

**해결**:
```typescript
html2canvas: {
  scale: 3,  // 해상도 더 높이기 (2 → 3)
  letterRendering: true,
  foreignObjectRendering: false
}
```

---

## 문제 5: 파일 크기가 너무 큼

**원인**: 높은 이미지 품질

**해결**:
```typescript
image: {
  type: 'jpeg',  // PNG 대신 JPEG 사용
  quality: 0.8   // 품질 조정 (0.8-0.95 권장)
},
jsPDF: {
  compress: true  // PDF 압축
}
```

---

## 문제 6: 생성 속도가 느림

**원인**: 높은 해상도 설정

**해결**:
```typescript
html2canvas: {
  scale: 1.5,  // 2 → 1.5로 낮추기
  logging: false
},
image: {
  type: 'jpeg',  // PNG → JPEG
  quality: 0.85  // 0.98 → 0.85로 낮추기
}
```

---

# Part 5: 배포 체크리스트

## ✅ 구현 체크리스트

- [ ] `npm install html2pdf.js` 실행 완료
- [ ] import 문 추가 완료
- [ ] `printReceiptDocument` 함수 수정 완료
- [ ] 개발 서버 재시작 완료

## ✅ 테스트 체크리스트

- [ ] PDF 다운로드 정상 작동
- [ ] 브라우저 인쇄 정상 작동
- [ ] 한글 정상 출력 확인
- [ ] 이미지/로고 정상 출력 확인
- [ ] 파일명 형식 확인
- [ ] 여러 운송장에서 테스트
- [ ] 에러 처리 테스트 (네트워크 끊김, 잘못된 데이터)

## ✅ 프로덕션 배포 체크리스트

- [ ] 빌드 테스트: `npm run build`
- [ ] 프리뷰 테스트: `npm run preview`
- [ ] 로딩 인디케이터 추가 (선택사항)
- [ ] 성능 모니터링 코드 추가 (선택사항)
- [ ] 에러 로깅 설정
- [ ] 환경별 설정 확인

---

## 📝 참고 문서

- html2pdf.js 공식 문서: https://github.com/eKoopmans/html2pdf.js
- jsPDF 공식 문서: https://github.com/parallax/jsPDF
- html2canvas 공식 문서: https://html2canvas.hertzen.com/

---

## 📅 문서 정보

- **최초 작성일**: 2025-11-01
- **최종 업데이트**: 2025-01-14
- **작성자**: 프론트엔드 개발팀
- **상태**: ✅ 완료 (통합 가이드)
