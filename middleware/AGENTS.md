<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# middleware

## Purpose
Nuxt 3 라우트 미들웨어. 페이지 진입 전 권한 검사, 인증 확인, 리다이렉트 등을 수행. 모든 `/admin` 페이지 접근 시 실행되며 server/client 모두에서 호출 가능.

## Key Files
| File | Description |
|------|-------------|
| `auth.ts` | 로그인 검사 (localStorage 복원 + 서버 검증 + 권한 로드) |
| `environment.global.ts` | 글로벌 미들웨어 (환경 변수 설정) |
| `visit-tracker.global.ts` | 방문 추적 (페이지뷰 로깅) |

## For AI Agents

### Working In This Directory
- 파일명: camelCase (예: `auth.ts`)
- 글로벌 미들웨어: 파일명에 `.global` 포함 (모든 페이지 실행)
- 반환: `undefined` (계속), `navigateTo()` (리다이렉트), `abortNavigation()` (차단)
- process.server: SSR 빌드 시 스킵 처리
- process.client: 클라이언트에서만 실행되는 로직

### Middleware Pattern
```typescript
export default defineNuxtRouteMiddleware(async (to, from) => {
  // SSR에서는 미들웨어 스킵
  if (process.server) {
    return
  }

  // 클라이언트에서만 실행
  if (process.client) {
    // 인증 체크
    const authStore = useAuthStore()
    const isValid = await authStore.checkAuth()
    
    if (!isValid && to.path.startsWith('/admin')) {
      localStorage.setItem('redirectAfterLogin', to.fullPath)
      return navigateTo('/login')
    }
  }
})
```

### 페이지에서 미들웨어 사용
```vue
<script setup>
definePageMeta({
  middleware: 'auth'  // 단일 미들웨어
  // 또는
  middleware: ['auth', 'custom']  // 다중 미들웨어
})
</script>
```

### 권장 패턴
| 미들웨어 | 역할 | 대상 경로 |
|---------|------|---------|
| `auth` | 로그인 필수 + 권한 로드 | `/admin/**` |
| `environment.global` | 환경 초기화 (모든 페이지) | 모든 경로 |
| `visit-tracker.global` | 페이지뷰 추적 (모든 페이지) | 모든 경로 |

### auth 미들웨어 상세
1. **SSR 스킵**: `process.server` 체크
2. **인증 복원**: `authStore.checkAuth()` (localStorage + 서버 검증)
3. **권한 로드**: 권한 플랫맵 사전 로드 (페이지에서 권한 빠르게 적용)
4. **리다이렉트**: 미인증 사용자는 `/login` 이동 (redirectAfterLogin 저장)
5. **에러 처리**: 토큰 검증 실패 → 로그아웃 및 재로그인 요청

### 대리로그인(Impersonation) 처리
- auth 미들웨어는 impersonation 상태를 유지 (clearAuth 금지)
- stopImpersonation() 호출 시 권한 플랫맵 재로드
- 원래 사용자 정보는 `authStore.originalUser`에 저장

## Dependencies

### Internal
- `stores/auth` (checkAuth, 사용자 정보)
- `stores/permission` (권한 로드)
- `utils/logger`

### External
- vue, vue-router, nuxt

<!-- MANUAL: -->
