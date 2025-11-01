# 인수증 PDF 생성 가이드

## 📋 개요

운송장 인수증을 PDF로 다운로드할 수 있는 기능을 추가하는 방법을 안내합니다.

---

## 🚀 방법 1: html2pdf.js 사용 (추천)

### 장점
- ✅ 기존 HTML 템플릿을 그대로 사용
- ✅ 클라이언트 사이드에서 즉시 생성
- ✅ 추가 서버 구성 불필요
- ✅ 한글 폰트 자동 지원

### 설치

```bash
npm install html2pdf.js
```

또는

```bash
yarn add html2pdf.js
```

### 사용 방법

#### 1단계: Import 추가

**파일**: `pages/admin/transport/edit/[id].vue`

```typescript
import html2pdf from 'html2pdf.js'
```

#### 2단계: PDF 생성 함수 수정

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
  const usePDF = confirm('PDF로 다운로드하시겠습니까?\n\n확인: PDF 다운로드\n취소: 브라우저 인쇄')

  if (usePDF) {
    try {
      // PDF 생성 대상 요소
      const element = document.querySelector('.receipt-preview')

      if (!element) {
        alert('인수증 템플릿을 찾을 수 없습니다.')
        return
      }

      // PDF 생성 옵션
      const opt = {
        margin: [10, 10, 10, 10], // 상, 우, 하, 좌 (mm)
        filename: `인수증_${formData.value.trackingNumber}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: {
          type: 'jpeg',
          quality: 0.98
        },
        html2canvas: {
          scale: 2,           // 해상도 (높을수록 선명)
          useCORS: true,      // 외부 이미지 허용
          logging: false,     // 콘솔 로그 비활성화
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',              // 단위
          format: 'a4',            // 용지 크기
          orientation: 'portrait', // 세로 방향
          compress: true           // 파일 압축
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] // 페이지 나누기 방지
        }
      }

      // PDF 생성 및 다운로드
      await html2pdf().set(opt).from(element).save()

      console.log('PDF 생성 완료')
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      alert('PDF 생성에 실패했습니다.\n브라우저 인쇄 기능을 사용해주세요.')
    }
  } else {
    // 브라우저 기본 인쇄
    window.print()
  }

  closeReceiptPopup()
}
```

#### 3단계: 테스트

1. 운송장 수정 페이지 접속
2. "운송장 출력" 버튼 클릭
3. 인수증 팝업에서 "인수증 출력" 버튼 클릭
4. "PDF로 다운로드하시겠습니까?" 확인 대화상자에서:
   - **확인**: PDF 파일 자동 다운로드
   - **취소**: 브라우저 인쇄 대화상자 표시

---

## 🎨 방법 2: jsPDF + html2canvas

### 장점
- ✅ 더 세밀한 제어 가능
- ✅ 커스텀 폰트 추가 가능
- ✅ 워터마크 등 고급 기능

### 설치

```bash
npm install jspdf html2canvas
```

### 사용 방법

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
    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    )

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

## 📊 비교표

| 특징 | html2pdf.js | jsPDF + html2canvas | 백엔드 PDF |
|------|-------------|---------------------|-----------|
| **구현 난이도** | ⭐ 쉬움 | ⭐⭐ 보통 | ⭐⭐⭐ 어려움 |
| **품질** | ⭐⭐⭐ 좋음 | ⭐⭐⭐⭐ 매우 좋음 | ⭐⭐⭐⭐⭐ 최고 |
| **한글 지원** | ✅ 자동 | ✅ 설정 필요 | ✅ 완벽 |
| **서버 부하** | 없음 | 없음 | 있음 |
| **일관성** | ⭐⭐ 브라우저 의존 | ⭐⭐⭐ 좋음 | ⭐⭐⭐⭐⭐ 완벽 |
| **비용** | 무료 | 무료 | 서버 비용 |

---

## 🎯 추천

### 현재 프로젝트에 추천: **html2pdf.js** ⭐

**이유**:
1. 기존 HTML 템플릿을 그대로 사용 가능
2. 빠른 구현 (10분 이내)
3. 서버 수정 불필요
4. 한글 폰트 자동 지원
5. 인수증 용도로 충분한 품질

---

## 🔧 트러블슈팅

### 문제 1: PDF에 이미지(로고)가 안 나옴

**해결책**:
```typescript
html2canvas: {
  useCORS: true,  // 외부 이미지 허용
  allowTaint: true
}
```

### 문제 2: 페이지가 잘림

**해결책**:
```typescript
pagebreak: {
  mode: ['avoid-all'],  // 페이지 나누기 방지
  after: '.receipt-document'  // 문서 단위로 분리
}
```

### 문제 3: 폰트가 깨짐

**해결책**:
```typescript
html2canvas: {
  scale: 2,  // 해상도 증가
  letterRendering: true  // 문자 렌더링 개선
}
```

### 문제 4: 파일 크기가 너무 큼

**해결책**:
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

## 📝 참고 문서

- html2pdf.js 공식 문서: https://github.com/eKoopmans/html2pdf.js
- jsPDF 공식 문서: https://github.com/parallax/jsPDF
- html2canvas 공식 문서: https://html2canvas.hertzen.com/

---

**작성일**: 2025-11-01
**작성자**: 프론트엔드 개발팀
