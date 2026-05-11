<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# plugins

## Purpose
Nuxt 3 플러그인. 애플리케이션 시작 시 실행되는 초기화 로직. 글로벌 설정, HTTP 인터셉터, 자동 갱신, 세션 모니터링 등을 처리.

## Key Files
| File | Description |
|------|-------------|
| `01.auth-init.client.ts` | 인증 초기화 (페이지 로드 시 localStorage에서 복원) |
| `api-interceptor.ts` | HTTP 응답 인터셉터 (토큰 자동 갱신, 에러 처리) |
| `session-monitor.client.ts` | 사용자 활동 추적 (불활성 타임아웃) |
| `vue-datepicker.client.ts` | vue-datepicker 글로벌 설정 |
| `environment.global.ts` | 환경 변수 초기화 (자동 로드) |
| `visit-tracker.global.ts` | 페이지뷰 분석 로깅 |

## For AI Agents

### Working In This Directory
- 파일명: kebab-case + `.client.ts` (클라이언트) 또는 `.global.ts` (모두)
- 번호 프리픽스: `01.`, `02.` 등 실행 순서 지정
- 반환: `defineNuxtPlugin(() => { ... })`
- 초기화: 전역 설정, 스토어 사전 로드, 인터셉터 등록
- 에러: 치명적 에러만 발생, 경고는 console.warn

### Plugin Pattern
```typescript
export default defineNuxtPlugin(() => {
  // 초기화 로직
  const store = useMyStore()
  
  // 글로벌 함수 제공 (optional)
  return {
    provide: {
      myFunction: () => { /* ... */ }
    }
  }
})
```

### 실행 순서 (번호 프리픽스)
| Order | Plugin | Purpose |
|-------|--------|---------|
| 1 | `01.auth-init.client.ts` | 인증 복원 (가장 먼저) |
| 2 | `api-interceptor.ts` | HTTP 인터셉터 |
| 3 | `session-monitor.client.ts` | 활동 추적 |
| 4 | `vue-datepicker.client.ts` | 라이브러리 설정 |
| - | `*.global.ts` | 글로벌 미들웨어용 (순서 무관) |

### 주요 플러그인 상세

#### auth-init.client.ts
```typescript
// 페이지 로드 시 localStorage에서 사용자 정보 복원
// → middleware/auth.ts에서 서버 검증
// → 권한 플랫맵 로드 (usePermissionStore.fetchPermissionFlatMap)
```

#### api-interceptor.ts
```typescript
// HTTP 응답 헤더에서 X-New-Access-Token, X-New-Refresh-Token 추출
// → 토큰 자동 갱신 (Sliding Session 방식)
// → 401 Unauthorized → 로그아웃 + /login 리다이렉트
// → 403 Forbidden → 권한 없음 메시지
```

#### session-monitor.client.ts
```typescript
// 마우스·키보드·스크롤 이벤트 감지
// → auth.updateLastActivity()
// → 30분 불활성 → 자동 로그아웃 경고
```

### 글로벌 함수 제공 (optional)
```typescript
export default defineNuxtPlugin(() => {
  return {
    provide: {
      formatCurrency: (amount: number) => format.currency(amount),
      logger: logger  // 모든 페이지에서 $logger 사용 가능
    }
  }
})

// 페이지에서 사용
const { $formatCurrency } = useNuxtApp()
const formatted = $formatCurrency(1000)  // "1,000"
```

## Dependencies

### Internal
- `stores/auth` (checkAuth, updateLastActivity)
- `stores/permission` (fetchPermissionFlatMap)
- `utils/logger`
- `services/api` (getAuthHeaders, getApiBaseUrl)

### External
- vue, nuxt
- @vuepic/vue-datepicker (vue-datepicker.client.ts만)

<!-- MANUAL: -->
