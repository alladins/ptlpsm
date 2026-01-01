# 표준 용어 사전 플러그인 개발 가이드

## 개요

이 문서는 프로젝트 코드베이스를 분석하여 **표준 용어 사전(Standard Terminology Dictionary)**을 자동으로 생성하는 Claude Code 플러그인을 개발하고, 다른 프로젝트에 재사용하는 방법을 설명합니다.

---

## 1. 플러그인 구조

```
terminology-dictionary/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 메타데이터
├── skills/
│   └── terminology/
│       ├── SKILL.md             # 용어 사전 생성 스킬
│       ├── extraction.md        # 용어 추출 상세 가이드
│       ├── classification.md    # 용어 분류 기준
│       └── templates/
│           ├── dictionary.md    # 용어 사전 템플릿 (Markdown)
│           └── dictionary.xlsx  # 용어 사전 템플릿 (Excel)
├── agents/
│   └── term-extractor.md        # 용어 추출 전문 에이전트
├── commands/
│   ├── terminology.md           # /terminology 명령어
│   ├── extract-terms.md         # /extract-terms 명령어
│   └── export-dictionary.md     # /export-dictionary 명령어
├── scripts/
│   ├── extract-types.ts         # TypeScript 타입 추출
│   ├── extract-ui-labels.ts     # Vue UI 레이블 추출
│   └── merge-terms.ts           # 용어 병합 및 정규화
└── README.md                    # 플러그인 사용법
```

---

## 2. plugin.json 작성

```json
{
  "name": "terminology-dictionary",
  "version": "1.0.0",
  "description": "프로젝트 코드베이스를 분석하여 표준 용어 사전을 자동 생성하는 플러그인",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "keywords": ["terminology", "dictionary", "documentation", "i18n", "glossary"],
  "license": "MIT",

  "commands": "./commands/",
  "agents": "./agents/",
  "skills": "./skills/"
}
```

---

## 3. 스킬 정의 (SKILL.md)

### skills/terminology/SKILL.md

```markdown
---
name: terminology-dictionary
description: |
  프로젝트 코드베이스를 분석하여 표준 용어 사전을 생성합니다.
  types/*.ts, components/**/*.vue, services/*.ts 파일에서 용어를 추출하고,
  한영 매핑, 동의어, 정의를 포함한 구조화된 용어 사전을 만듭니다.
  사용 시점: "용어 사전 만들어줘", "terminology dictionary", "용어 정리",
  "glossary 생성", "표준 용어", "한영 매핑"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# 표준 용어 사전 생성 스킬

## 개요

이 스킬은 프로젝트의 코드베이스를 분석하여 표준 용어 사전을 자동으로 생성합니다.

## 용어 추출 소스

| 소스 파일 | 추출 대상 | 예시 |
|----------|----------|------|
| `types/*.ts` | interface/type 필드명, JSDoc | `shippingDate` → 출하일자 |
| `components/**/*.vue` | UI 레이블, 버튼 텍스트 | `<label>납품확인</label>` |
| `services/*.ts` | API 메서드명, 엔드포인트 | `getShippingList` |
| `stores/*.ts` | 상태/액션명 | `setDeliveryStatus` |
| `pages/**/*.vue` | 페이지 제목, 네비게이션 | `발주 목록` |

## 용어 분류 체계

### 도메인별 분류
- **발주관리 (Order)**: 발주, 수주, 납품요구, 발주서
- **출하관리 (Shipping)**: 출하, 운송, 배송, 차량번호
- **납품관리 (Delivery)**: 납품, 입고, 검수, 서명
- **자금관리 (Fund)**: 선급금, 기성금, 잔금, OEM
- **기초정보 (Baseline)**: 사용자, 회사, 품목, 코드

### 품사별 분류
- **명사 (Noun)**: 출하, 납품, 발주
- **동사 (Verb)**: 등록, 수정, 삭제, 조회
- **상태 (Status)**: 대기, 진행중, 완료, 취소

## 실행 단계

### 1단계: 타입 정의 분석
```bash
# types 폴더의 모든 TypeScript 파일 분석
Glob("types/**/*.ts")
```

각 interface와 type에서:
- 필드명 추출 (camelCase → 한국어)
- JSDoc 주석에서 한국어 설명 추출
- enum 값과 의미 추출

### 2단계: Vue 컴포넌트 분석
```bash
# 모든 Vue 파일에서 UI 텍스트 추출
Grep("[가-힣]+", glob="**/*.vue")
```

추출 대상:
- `<label>`, `<th>`, `<button>` 내 텍스트
- placeholder, title 속성
- 에러 메시지, 알림 텍스트

### 3단계: 서비스 레이어 분석
```bash
# API 메서드와 엔드포인트 분석
Glob("services/**/*.ts")
```

추출 대상:
- 함수명 (getXxx, createXxx, updateXxx)
- API 엔드포인트 경로
- 요청/응답 타입명

### 4단계: 용어 정규화
- 동의어 통합 (배송 ↔ 운송 ↔ 수송)
- 영한 매핑 일관성 검증
- 약어 정의 (OEM, GPS, API)
- 복합어 분해 (shippingDate → 출하 + 일자)

### 5단계: 용어 사전 문서 생성
출력 형식 옵션:
- **Markdown**: `docs/TERMINOLOGY.md`
- **Excel**: `docs/terminology.xlsx`
- **JSON**: `docs/terminology.json`

## 용어 사전 출력 형식

### Markdown 형식
```markdown
| 한국어 | 영어 | 코드변수 | 도메인 | 정의 |
|--------|------|----------|--------|------|
| 출하 | Shipping | shipping | 출하관리 | 물품을 창고에서 배송지로 보내는 행위 |
```

### JSON 형식
```json
{
  "terms": [
    {
      "id": "term-001",
      "korean": "출하",
      "english": "Shipping",
      "codeVariables": ["shipping", "shipment"],
      "domain": "shipping",
      "definition": "물품을 창고에서 배송지로 보내는 행위",
      "synonyms": ["배송", "발송"],
      "sources": ["types/shipping.ts:15", "components/ShippingList.vue:42"]
    }
  ]
}
```

## 추가 리소스

- [용어 추출 상세 가이드](extraction.md)
- [용어 분류 기준](classification.md)
- [출력 템플릿](templates/)
```

---

## 4. 에이전트 정의 (term-extractor.md)

### agents/term-extractor.md

```markdown
---
name: term-extractor
description: |
  코드베이스에서 용어를 추출하는 전문 에이전트.
  TypeScript 타입, Vue 컴포넌트, 서비스 레이어를 분석하여
  한영 용어 매핑을 생성합니다.
  사용 시점: 용어 추출, 타입 분석, UI 텍스트 수집
tools: Read, Grep, Glob, Bash
model: sonnet
skills: terminology-dictionary
---

# 용어 추출 에이전트

당신은 소프트웨어 프로젝트의 용어를 추출하는 전문가입니다.

## 역할

1. TypeScript 타입 정의에서 필드명과 설명 추출
2. Vue 컴포넌트에서 UI 레이블과 메시지 추출
3. 서비스 레이어에서 API 관련 용어 추출
4. 추출된 용어를 구조화된 형태로 정리

## 분석 순서

### Phase 1: 타입 분석
1. `Glob("types/**/*.ts")`로 타입 파일 목록 확인
2. 각 파일에서 interface, type, enum 정의 분석
3. 필드명에서 영어 용어 추출
4. JSDoc 주석에서 한국어 설명 추출

### Phase 2: UI 분석
1. `Glob("components/**/*.vue", "pages/**/*.vue")`로 Vue 파일 목록 확인
2. 템플릿 섹션에서 한국어 텍스트 추출
3. 컨텍스트 기반으로 영어 변수명과 매핑

### Phase 3: 서비스 분석
1. `Glob("services/**/*.ts")`로 서비스 파일 확인
2. 함수명과 엔드포인트에서 비즈니스 용어 추출
3. 요청/응답 타입과 연결

## 출력 형식

각 용어에 대해 다음 정보 수집:
- 한국어 용어
- 영어 용어
- 코드에서 사용되는 변수명
- 도메인 분류
- 정의/설명
- 발견된 소스 파일 및 라인

## 주의사항

- 중복 용어는 하나로 통합
- 동의어 관계 식별
- 컨텍스트에 따른 다의어 구분
- 약어는 전체 표현과 함께 기록
```

---

## 5. 슬래시 명령어 정의

### commands/terminology.md

```markdown
---
description: 프로젝트의 표준 용어 사전을 생성합니다
argument-hint: [format] [domain]
allowed-tools: Read, Grep, Glob, Bash, Write
---

# /terminology 명령어

프로젝트 코드베이스를 분석하여 표준 용어 사전을 생성합니다.

## 인수

- `$1` (format): 출력 형식 - `markdown`, `json`, `excel` (기본값: markdown)
- `$2` (domain): 특정 도메인만 분석 - `order`, `shipping`, `delivery`, `fund`, `all` (기본값: all)

## 실행 단계

1. **스킬 로드**: terminology-dictionary 스킬 활성화

2. **용어 추출**: 다음 소스 분석
   - types/**/*.ts
   - components/**/*.vue
   - services/**/*.ts
   - pages/**/*.vue

3. **용어 정규화**:
   - 동의어 통합
   - 영한 매핑 검증
   - 도메인 분류

4. **문서 생성**:
   - 형식: $1 (markdown/json/excel)
   - 저장 위치: docs/TERMINOLOGY.[md|json|xlsx]

## 예시

```bash
/terminology                    # 전체 도메인, Markdown 형식
/terminology json              # 전체 도메인, JSON 형식
/terminology markdown shipping # 출하관리 도메인만, Markdown 형식
```
```

### commands/extract-terms.md

```markdown
---
description: 특정 파일이나 폴더에서 용어를 추출합니다
argument-hint: [path]
allowed-tools: Read, Grep, Glob
---

# /extract-terms 명령어

지정된 경로에서 용어를 추출합니다.

## 인수

- `$1` (path): 분석할 파일 또는 폴더 경로

## 실행

1. 경로 유효성 검증
2. 파일 유형에 따른 분석:
   - `.ts`: TypeScript 타입/인터페이스 분석
   - `.vue`: Vue 템플릿 한국어 텍스트 추출
   - 폴더: 하위 모든 파일 재귀 분석
3. 추출된 용어 목록 출력

## 예시

```bash
/extract-terms types/shipping.ts
/extract-terms components/admin/
/extract-terms services/
```
```

### commands/export-dictionary.md

```markdown
---
description: 용어 사전을 특정 형식으로 내보냅니다
argument-hint: [format] [output-path]
allowed-tools: Read, Write, Bash
---

# /export-dictionary 명령어

생성된 용어 사전을 다양한 형식으로 내보냅니다.

## 인수

- `$1` (format): 출력 형식 - `markdown`, `json`, `excel`, `html`
- `$2` (output-path): 저장 경로 (선택, 기본값: docs/)

## 지원 형식

| 형식 | 확장자 | 용도 |
|------|--------|------|
| markdown | .md | 문서화, GitHub 표시 |
| json | .json | 프로그래밍 활용, i18n |
| excel | .xlsx | 공유, 편집 |
| html | .html | 웹 게시 |

## 예시

```bash
/export-dictionary markdown
/export-dictionary json ./output/
/export-dictionary excel ./docs/glossary.xlsx
```
```

---

## 6. 다른 프로젝트에 적용하기

### 6.1 플러그인 설치

#### 방법 1: GitHub에서 직접 설치

```bash
# 사용자 범위 (모든 프로젝트에서 사용)
claude plugin install github:your-username/terminology-dictionary

# 프로젝트 범위 (팀과 공유)
claude plugin install github:your-username/terminology-dictionary --scope project
```

#### 방법 2: 로컬 개발 플러그인

```bash
# 플러그인 폴더를 직접 링크
claude plugin install ./path/to/terminology-dictionary --local
```

### 6.2 프로젝트별 설정 커스터마이즈

프로젝트 루트에 `.claude/terminology.config.json` 생성:

```json
{
  "sources": {
    "types": "src/types/**/*.ts",
    "components": "src/components/**/*.vue",
    "services": "src/api/**/*.ts"
  },
  "domains": [
    { "id": "user", "name": "사용자관리", "keywords": ["user", "auth", "login"] },
    { "id": "product", "name": "상품관리", "keywords": ["product", "item", "goods"] }
  ],
  "output": {
    "format": "markdown",
    "path": "docs/TERMINOLOGY.md"
  },
  "language": {
    "primary": "ko",
    "secondary": "en"
  }
}
```

### 6.3 사용 예시

```bash
# 새 프로젝트에서 용어 사전 생성
cd /path/to/new-project
claude

# Claude Code 내에서:
/terminology

# 또는 특정 도메인만:
/terminology markdown user

# JSON으로 i18n 파일 생성:
/export-dictionary json ./src/i18n/terms.json
```

---

## 7. 플러그인 개발 워크플로우

### 7.1 초기 개발

```bash
# 1. 플러그인 디렉토리 생성
mkdir -p terminology-dictionary/.claude-plugin
mkdir -p terminology-dictionary/{skills/terminology,agents,commands,scripts}

# 2. plugin.json 작성
# 3. SKILL.md 작성
# 4. 에이전트 및 명령어 작성

# 5. 로컬 테스트
claude plugin install ./terminology-dictionary --local
```

### 7.2 테스트 및 검증

```bash
# 플러그인 검증
claude plugin validate ./terminology-dictionary

# 실제 프로젝트에서 테스트
cd /path/to/test-project
/terminology

# 디버그 모드
claude --debug
```

### 7.3 배포

```bash
# GitHub에 푸시
cd terminology-dictionary
git init
git add .
git commit -m "Initial terminology dictionary plugin"
git remote add origin https://github.com/your-username/terminology-dictionary
git push -u origin main

# 다른 사용자가 설치
claude plugin install github:your-username/terminology-dictionary
```

---

## 8. 고급 기능 확장

### 8.1 자동 번역 연동

```typescript
// scripts/translate-terms.ts
import { translate } from '@google-cloud/translate';

export async function translateTerms(terms: Term[]): Promise<Term[]> {
  // 한국어 → 영어 자동 번역
  // 영어 → 한국어 자동 번역
}
```

### 8.2 용어 변경 감지 Hook

```json
// hooks/hooks.json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": {
        "tool": "Edit",
        "path_pattern": "types/**/*.ts"
      },
      "script": "./scripts/check-terminology.sh"
    }
  ]
}
```

### 8.3 CI/CD 통합

```yaml
# .github/workflows/terminology.yml
name: Update Terminology
on:
  push:
    paths:
      - 'types/**'
      - 'components/**'
jobs:
  update-terms:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate Terminology
        run: |
          claude /terminology
          git add docs/TERMINOLOGY.md
          git commit -m "docs: update terminology dictionary"
```

---

## 9. 참고 자료

- [Claude Code 플러그인 개발 가이드](https://docs.anthropic.com/claude-code/plugins)
- [스킬 작성 모범 사례](https://docs.anthropic.com/claude-code/skills)
- [에이전트 개발 가이드](https://docs.anthropic.com/claude-code/agents)

---

## 부록: 용어 사전 스키마

```typescript
interface TermEntry {
  id: string;                      // 고유 식별자
  korean: string;                  // 한국어 표준 용어
  english: string;                 // 영어 표준 용어
  codeVariables: string[];         // 코드에서 사용되는 변수명
  domain: Domain;                  // 도메인 분류
  category: 'noun' | 'verb' | 'status' | 'abbreviation';
  definition: string;              // 정의/설명
  synonyms: string[];              // 동의어
  antonyms: string[];              // 반의어
  relatedTerms: string[];          // 관련 용어
  examples: UsageExample[];        // 사용 예시
  sources: SourceReference[];      // 출처
  status: 'draft' | 'reviewed' | 'approved';
  createdAt: string;
  updatedAt: string;
}

interface Domain {
  id: string;
  name: string;
  parent?: string;
}

interface UsageExample {
  context: 'code' | 'ui' | 'api' | 'document';
  text: string;
  source: string;
}

interface SourceReference {
  file: string;
  line?: number;
  snippet?: string;
}
```
