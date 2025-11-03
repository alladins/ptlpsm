# Transport Receipt Template Guide

## 파일 정보
- **파일명**: `transport-receipt-template.html`
- **용도**: 백엔드 PDF 생성용 순수 HTML 템플릿
- **용지 크기**: A4 (210mm x 297mm)
- **언어**: 한국어
- **폰트**: Malgun Gothic, Nanum Gothic

---

## 템플릿 변수 목록

백엔드에서 아래 변수들을 실제 데이터로 치환해야 합니다.

### 기본 정보
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `{{deliveryDate}}` | 납품일자 | 2024-01-15 |
| `{{clientName}}` | 거래처명 | 한국농어촌공사 전북지역본부 군산지사 |
| `{{deliveryLocation}}` | 납품장소 | 전라북도 군산시 옥산면 ... |
| `{{siteSupervisorName}}` | 현장담당자 | 김중철 |
| `{{unloadingTime}}` | 하차시간 | 14:30 |
| `{{remarks}}` | 비고 | - |
| `{{signatureImageUrl}}` | 서명 이미지 URL | /api/admin/deliveries/123/signature |

### 특별 메시지 (고정값)
인수증의 Info Table 3번째 행에 고정 텍스트로 표시:
- **텍스트**: "★상차완료 후 현장담당자에게 통화 필수.꼭☆"
- **스타일**: Bold, 별표(★, ☆) 포함
- **위치**: 비고 필드 옆 (colspan=4)

### 품목 리스트 (반복)
`{{#each products}}...{{/each}}` 블록 내에서 각 품목에 대해 반복:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `{{productName}}` | 품명 | 기포단열재 |
| `{{thickness}}` | 두께 | 80mm |
| `{{quantity}}` | 수량 | 827 m² |
| `{{specification}}` | 규격 | 1000×1000×80mm, 경질2종2호 |
| `{{itemRemarks}}` | 비고 | - |

---

## 템플릿 문법

### 반복문 (Loop)
```handlebars
{{#each products}}
<tr>
  <td>{{productName}}</td>
  <td>{{thickness}}</td>
  <td>{{quantity}}</td>
  <td>{{specification}}</td>
  <td>{{itemRemarks}}</td>
</tr>
{{/each}}
```

### 조건문 (Conditional)
```handlebars
{{#if signatureImageUrl}}
<img src="{{signatureImageUrl}}" alt="서명" class="signature-image">
{{else}}
<span>(인)</span>
{{/if}}
```

---

## 백엔드 구현 가이드

### 1. 템플릿 엔진 선택
추천 라이브러리:
- **Node.js**: Handlebars, Mustache, EJS
- **Java**: Thymeleaf, Freemarker
- **Python**: Jinja2

### 2. 데이터 준비 예시 (JSON)
```json
{
  "deliveryDate": "2024-01-15",
  "clientName": "한국농어촌공사 전북지역본부 군산지사",
  "deliveryLocation": "전라북도 군산시 옥산면 ...",
  "siteSupervisorName": "김중철",
  "unloadingTime": "14:30",
  "remarks": "-",
  "signatureImageUrl": "/api/admin/deliveries/123/signature",
  "products": [
    {
      "productName": "기포단열재",
      "thickness": "100T",
      "quantity": "10",
      "specification": "JYGB-100LC, 1000×1000×100mm",
      "itemRemarks": "단위 환산: 10m²"
    },
    {
      "productName": "기포단열재",
      "thickness": "60T",
      "quantity": "700",
      "specification": "JYGB-60LC, 1000×1000×60mm",
      "itemRemarks": "단위 환산: 700m²"
    }
  ]
}
```

### 3. PDF 생성 라이브러리
추천:
- **Node.js**: Puppeteer, Playwright, html-pdf-node
- **Java**: Flying Saucer, OpenPDF, iText
- **Python**: WeasyPrint, xhtml2pdf

### 4. 구현 예시 (Node.js + Puppeteer)
```javascript
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const fs = require('fs');

async function generateReceiptPDF(data) {
  // 1. 템플릿 파일 읽기
  const templateHTML = fs.readFileSync('./templates/transport-receipt-template.html', 'utf8');

  // 2. Handlebars 컴파일
  const template = Handlebars.compile(templateHTML);

  // 3. 데이터 치환
  const html = template(data);

  // 4. PDF 생성
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  });

  await browser.close();

  return pdf;
}
```

---

## 주의사항

### 1. 서명 이미지 경로
- **절대 경로 사용**: `/api/admin/deliveries/{deliveryId}/signature`
- **Base64 인코딩**: 필요시 Base64 데이터 URI 사용 가능
  ```html
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..." />
  ```

### 2. 한글 폰트
PDF 생성 시 한글이 깨지지 않도록 반드시 한글 폰트 포함:
- Puppeteer: 시스템 폰트 자동 사용
- Flying Saucer/iText: 별도 폰트 파일 필요

### 3. 품목 개수가 많을 경우
- A4 한 페이지에 표시 가능한 품목: 약 15~20개
- 초과 시 자동 페이지 분할 (CSS `page-break-after: auto`)

### 4. 인쇄 여백
- CSS `@page { margin: 10mm; }` 설정됨
- PDF 생성 시 동일한 여백 사용 권장

---

## 테스트 데이터

최소 테스트 데이터:
```json
{
  "deliveryDate": "2024-01-15",
  "clientName": "테스트 거래처",
  "deliveryLocation": "서울시 강남구",
  "siteSupervisorName": "홍길동",
  "unloadingTime": "14:00",
  "remarks": "-",
  "signatureImageUrl": null,
  "products": [
    {
      "productName": "테스트 품목",
      "thickness": "80T",
      "quantity": "100",
      "specification": "테스트 규격",
      "itemRemarks": "-"
    }
  ]
}
```

---

## 문의 및 수정

템플릿 수정이 필요한 경우:
1. `templates/transport-receipt-template.html` 파일 직접 수정
2. CSS 스타일은 `<style>` 태그 내에서 수정
3. 변수명 변경 시 이 가이드도 함께 업데이트

**최종 업데이트**: 2025-11-01
