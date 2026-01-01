# Terminology Dictionary Plugin

프로젝트 코드베이스를 분석하여 **표준 용어 사전(Standard Terminology Dictionary)**을 자동 생성하는 Claude Code 플러그인입니다.

## 기능

- **자동 용어 추출**: TypeScript 타입, Vue 컴포넌트, 서비스 레이어에서 용어 추출
- **한영 매핑**: camelCase 변수명을 한국어 용어로 변환
- **도메인 분류**: 비즈니스 도메인별 용어 분류
- **다중 출력 형식**: Markdown, JSON, CSV, HTML 지원

## 설치

### 로컬 설치 (개발용)

```bash
claude plugin install ./plugins/terminology-dictionary --local
```

### 프로젝트 범위 설치 (팀 공유)

```bash
claude plugin install ./plugins/terminology-dictionary --scope project
```

## 사용법

### 슬래시 명령어

```bash
# 전체 용어 사전 생성 (Markdown)
/terminology

# JSON 형식으로 생성
/terminology json

# 특정 도메인만 분석
/terminology markdown shipping

# 특정 파일/폴더 용어 추출
/extract-terms types/shipping.ts
/extract-terms components/admin/

# 다른 형식으로 내보내기
/export-dictionary csv
/export-dictionary html ./public/
```

### 자동 스킬 활성화

다음 키워드를 사용하면 용어 사전 스킬이 자동으로 활성화됩니다:

- "용어 사전 만들어줘"
- "terminology dictionary"
- "용어 정리"
- "glossary 생성"
- "표준 용어"
- "한영 매핑"

## 플러그인 구조

```
terminology-dictionary/
├── .claude-plugin/
│   └── plugin.json          # 플러그인 메타데이터
├── skills/
│   └── terminology/
│       ├── SKILL.md         # 용어 사전 생성 스킬
│       └── classification.md # 용어 분류 기준
├── agents/
│   └── term-extractor.md    # 용어 추출 에이전트
├── commands/
│   ├── terminology.md       # /terminology 명령어
│   ├── extract-terms.md     # /extract-terms 명령어
│   └── export-dictionary.md # /export-dictionary 명령어
└── README.md
```

## 용어 추출 소스

| 소스 | 추출 대상 | 예시 |
|------|----------|------|
| `types/*.ts` | interface/type 필드명, JSDoc | `shippingDate` → 출하일자 |
| `components/**/*.vue` | UI 레이블, 버튼 텍스트 | `<label>납품확인</label>` |
| `services/*.ts` | API 메서드명, 엔드포인트 | `getShippingList` |
| `stores/*.ts` | 상태/액션명 | `setDeliveryStatus` |

## 출력 형식

### Markdown

```markdown
# 표준 용어 사전

## 발주관리 (Order)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 발주 | Order | order | 물품 구매 요청 |
```

### JSON

```json
{
  "version": "1.0.0",
  "terms": [
    {
      "korean": "발주",
      "english": "Order",
      "codeVariables": ["order"],
      "domain": "order",
      "definition": "물품 구매 요청"
    }
  ]
}
```

## 프로젝트별 설정

프로젝트 루트에 `.claude/terminology.config.json` 생성:

```json
{
  "sources": {
    "types": "src/types/**/*.ts",
    "components": "src/components/**/*.vue",
    "services": "src/api/**/*.ts"
  },
  "domains": [
    { "id": "user", "name": "사용자관리", "keywords": ["user", "auth"] },
    { "id": "product", "name": "상품관리", "keywords": ["product", "item"] }
  ],
  "output": {
    "format": "markdown",
    "path": "docs/TERMINOLOGY.md"
  }
}
```

## 라이선스

MIT
