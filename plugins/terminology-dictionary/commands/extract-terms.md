---
description: 특정 파일이나 폴더에서 용어를 추출합니다
argument-hint: [path]
allowed-tools: Read, Grep, Glob
---

# /extract-terms 명령어

지정된 경로에서 용어를 추출합니다.

## 인수

- `$1` (path): 분석할 파일 또는 폴더 경로
  - 파일: `types/shipping.ts`
  - 폴더: `components/admin/`
  - 패턴: `types/*.ts`

## 실행 단계

### 1. 경로 유효성 검증

```bash
# 파일/폴더 존재 확인
ls $1
```

### 2. 파일 유형별 분석

**TypeScript 파일 (.ts):**
```bash
# interface 필드 추출
Grep("interface\\s+\\w+", path="$1")

# type alias 추출
Grep("type\\s+\\w+", path="$1")

# JSDoc 주석 추출
Grep("/\\*\\*[^*]*\\*/", path="$1")
```

**Vue 파일 (.vue):**
```bash
# 한국어 텍스트 추출
Grep("[가-힣]+", path="$1")

# 레이블 추출
Grep("<label[^>]*>", path="$1")
```

**폴더인 경우:**
```bash
# 하위 파일 목록
Glob("$1/**/*")

# 각 파일 재귀 분석
```

### 3. 결과 출력

추출된 용어를 테이블 형식으로 출력:

```
| 용어 | 유형 | 파일:라인 |
|------|------|----------|
| shippingDate | 필드 | shipping.ts:15 |
| 출하일자 | UI텍스트 | ShippingList.vue:42 |
```

## 사용 예시

```bash
/extract-terms types/shipping.ts
/extract-terms components/admin/
/extract-terms services/
/extract-terms types/*.ts
```
