# 선급금 관련 문서 템플릿

선급금 신청 시 필요한 5종 문서의 HTML 템플릿입니다.

## 템플릿 목록

| 파일명 | 문서 유형 | 설명 |
|--------|----------|------|
| `advance-application.html` | APPLICATION | 선급금신청서 |
| `advance-usage-plan.html` | USAGE_PLAN | 선급금사용계획 |
| `advance-usage-agreement.html` | USAGE_AGREEMENT | 선급금사용확약서 |
| `advance-usage-pledge.html` | USAGE_PLEDGE | 선급금사용각서 |
| `advance-settlement.html` | SETTLEMENT | 선급금정산서 |

## 템플릿 변수

### 공통 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `{{contractName}}` | 계약명 | 임실 정주활력센터 건립사업... |
| `{{contractAmount}}` | 계약금액 (숫자) | 330,538,830 |
| `{{contractAmountKorean}}` | 계약금액 (한글) | 삼억삼천오십삼만팔천팔백삼십 |
| `{{contractDate}}` | 계약년월일 | 2025년 11월 27일 |
| `{{advanceAmount}}` | 선급금 신청금액 (숫자) | 231,377,181 |
| `{{advanceAmountKorean}}` | 선급금 신청금액 (한글) | 이억삼천일백삼십칠만칠천일백팔십일 |
| `{{advanceRate}}` | 선급금 신청비율 | 70 |
| `{{companyName}}` | 회사명 | 주식회사리드파워 |
| `{{companyAddress}}` | 회사 주소 | 경기도안성시서운면서미로21-10 |
| `{{representativeName}}` | 대표이사명 | 김광열 |
| `{{recipientName}}` | 수신자명 | 전북특별자치도임실군분임재무관 |
| `{{applicationYear}}` | 신청년도 | 2025 |
| `{{applicationMonth}}` | 신청월 | 12 |
| `{{applicationDay}}` | 신청일 | 02 |

### 선급금신청서 전용 변수

| 변수명 | 설명 |
|--------|------|
| `{{deliveryYear/Month/Day}}` | 납품년월일 |
| `{{completionYear/Month/Day}}` | 준공년월일 |
| `{{remainingAmount}}` | 잔액 (숫자) |
| `{{remainingAmountKorean}}` | 잔액 (한글) |
| `{{guaranteeMethod}}` | 지급보증 방법 |

### 선급금사용계획 전용 변수

| 변수명 | 설명 |
|--------|------|
| `{{usagePlans}}` | 사용계획 배열 |
| `{{usagePlans.category}}` | 구분 (예: PPG,MDI) |
| `{{usagePlans.amount}}` | 계약금액 |
| `{{usagePlans.description}}` | 사용계획 설명 |
| `{{usagePlans.remarks}}` | 비고 |
| `{{totalAmount}}` | 합계 금액 |

### 선급금사용확약서 전용 변수

| 변수명 | 설명 |
|--------|------|
| `{{completionDeadline}}` | 준공기한 |
| `{{remarks}}` | 비고 |

### 선급금정산서 전용 변수

| 변수명 | 설명 |
|--------|------|
| `{{deliveryDate}}` | 납품일자 |
| `{{deliveryDeadlineYear/Month/Day}}` | 납품기한 |
| `{{settlements}}` | 정산 내역 배열 |
| `{{settlements.receiptDate}}` | 수령액 일자 |
| `{{settlements.receiptAmount}}` | 수령액 금액 |
| `{{settlements.previousSettlementDate}}` | 기정산액 일자 |
| `{{settlements.previousSettlementAmount}}` | 기정산액 금액 |
| `{{settlements.currentSettlementDate}}` | 금회정산액 일자 |
| `{{settlements.currentSettlementAmount}}` | 금회정산액 금액 |
| `{{settlements.remainingAmount}}` | 잔액 |
| `{{settlements.remarks}}` | 비고 |

## 사용 방법

### 백엔드에서 PDF 생성

1. HTML 템플릿 파일 로드
2. Mustache/Handlebars 등으로 변수 치환
3. HTML → PDF 변환 (Puppeteer, wkhtmltopdf 등 사용)

### 예시 (Java + Thymeleaf)

```java
@Service
public class AdvanceDocumentService {

    public byte[] generatePdf(String templateName, Map<String, Object> data) {
        // 1. 템플릿 로드
        String html = loadTemplate(templateName);

        // 2. 변수 치환
        String renderedHtml = templateEngine.process(html, data);

        // 3. PDF 변환
        return pdfGenerator.generateFromHtml(renderedHtml);
    }
}
```

### 예시 (Node.js + Puppeteer)

```javascript
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const fs = require('fs');

async function generatePdf(templateName, data) {
    // 1. 템플릿 로드
    const templateHtml = fs.readFileSync(`templates/${templateName}.html`, 'utf-8');

    // 2. 변수 치환
    const template = Handlebars.compile(templateHtml);
    const renderedHtml = template(data);

    // 3. PDF 변환
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(renderedHtml);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    return pdf;
}
```

## 인쇄 설정

템플릿은 A4 용지에 최적화되어 있습니다.

- 용지 크기: A4 (210mm × 297mm)
- 여백: 20mm
- 방향: 세로

## 한글 숫자 변환

금액을 한글로 변환하는 유틸리티 함수가 필요합니다.

```typescript
// utils/koreanNumber.ts
export function numberToKorean(num: number): string {
    const units = ['', '만', '억', '조'];
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const subUnits = ['', '십', '백', '천'];

    // 구현...
}
```
