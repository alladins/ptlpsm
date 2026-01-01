---
description: 용어 사전을 특정 형식으로 내보냅니다
argument-hint: [format] [output-path]
allowed-tools: Read, Write, Bash
---

# /export-dictionary 명령어

생성된 용어 사전을 다양한 형식으로 내보냅니다.

## 인수

- `$1` (format): 출력 형식
  - `markdown`: Markdown 테이블 (.md)
  - `json`: JSON 구조화 (.json)
  - `csv`: Excel 호환 CSV (.csv)
  - `html`: 웹 페이지 (.html)

- `$2` (output-path): 저장 경로 (선택)
  - 기본값: `docs/`
  - 예: `./output/`, `./docs/glossary.md`

## 지원 형식

| 형식 | 확장자 | 용도 |
|------|--------|------|
| markdown | .md | GitHub, 문서화 |
| json | .json | 프로그래밍, i18n |
| csv | .csv | Excel, 데이터 분석 |
| html | .html | 웹 게시, 공유 |

## 출력 예시

### Markdown

```markdown
# 표준 용어 사전

## 발주관리

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 발주 | Order | order | 물품 구매 요청 |
```

### JSON

```json
{
  "terms": [
    {
      "korean": "발주",
      "english": "Order",
      "domain": "order"
    }
  ]
}
```

### CSV

```csv
한국어,영어,코드변수,도메인,정의
발주,Order,order,발주관리,물품 구매 요청
```

### HTML

```html
<!DOCTYPE html>
<html>
<head><title>표준 용어 사전</title></head>
<body>
  <h1>표준 용어 사전</h1>
  <table>
    <tr><th>한국어</th><th>영어</th></tr>
    <tr><td>발주</td><td>Order</td></tr>
  </table>
</body>
</html>
```

## 사용 예시

```bash
/export-dictionary markdown
/export-dictionary json ./output/
/export-dictionary csv ./docs/glossary.csv
/export-dictionary html ./public/terminology.html
```
