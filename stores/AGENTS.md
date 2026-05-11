<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# stores

## Purpose
Pinia 상태 관리. 전역 상태(사용자 인증, 권한, 거래처별 설정)를 중앙화하여 페이지·컴포넌트에서 공유한다. setup 스타일(`defineStore`)로 구현.

## Key Files
| File | Description |
|------|-------------|
| `auth.ts` | 사용자 인증 (로그인, 토큰, 대리로그인, 불활성 감지) |
| `permission.ts` | 사용자 권한 (메뉴, API 호출 권한) |
| `baseline.ts` | 기성금 기준 설정 (거래처별) |
| `commission.ts` | 커미션율 설정 |
| `fund.ts` | 자금 관리 상태 (선금, 기성금, 최종금) |
| `mobileOrderRequest.ts` | 모바일 납품요구 (토큰 기반 요청) |

## For AI Agents

### Working In This Directory
- 스타일: `defineStore('storeId', () => { ... })`
- 상태: `ref<Type>()` 선언
- 계산: `computed(() => ...)` 정의
- 액션: `async function name() { ... }` 정의, 반드시 `return { ... }` 마지막 줄
- localStorage 동기화: `useAuthStore().setAuthData()` 패턴 (sync 자동 처리 금지)
- 에러 처리: try-catch + logger.error() 사용

### Common Patterns
```typescript
export const useXxxStore = defineStore('xxx', () => {
  // State
  const data = ref<Type | null>(null)
  const loading = ref(false)
  
  // Computed
  const isEmpty = computed(() => !data.value)
  
  // Actions
  async function fetchData() { /* ... */ }
  function clearData() { data.value = null }
  
  // Always return
  return { data, loading, isEmpty, fetchData, clearData }
})
```

### Store Responsibilities
| Store | Scope | Usage |
|-------|-------|-------|
| `auth` | 사용자, 토큰, 대리로그인 | 모든 페이지 (middleware/auth 필수) |
| `permission` | 메뉴권한, API권한 동적 체크 | SidebarMenu, 페이지 접근 |
| `baseline` | 기성금 기준 (거래처별) | 기성금 페이지 계산 |
| `commission` | 커미션율 설정 | 커미션 정산 |
| `fund` | 자금 집계 캐시 | 자금 관리 대시보드 |
| `mobileOrderRequest` | 모바일 요청 임시 상태 | `/m/delivery/[token]` 페이지 |

### API 호출 규칙
- 직접 fetch 금지, 반드시 `services/*.service.ts` 사용
- 응답 처리: success 래퍼 확인 후 data 추출
- 에러: `throw new Error()` → 페이지에서 catch
- 토큰 자동 갱신: `plugins/api-interceptor.ts` (store에서 수동 갱신 금지)

### localStorage 동기화
- auth 스토어만 localStorage 사용 (다른 store 금지)
- auth 내부: `safeStorage.setJSON()`, `safeStorage.getItem()` 호출
- 페이지 새로고침 시 auth 복원: `auth.checkAuth()`

## Dependencies

### Internal
- `services/api.ts` (getApiBaseUrl, getAuthHeaders)
- `utils/storage` (safeStorage)
- `utils/logger` (logger.error)

### External
- pinia, vue

<!-- MANUAL: -->
