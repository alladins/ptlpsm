## 개발 환경
- OS: Windows (CYGWIN_NT)
- 언어: TypeScript
- 프레임워크: Nuxt 3.15.4, Vue 3.3.4
- 노드 버전: 메모리 4GB 할당 필요 (--max-old-space-size=4096)

## 언어 및 커뮤니케이션 규칙
- 기본 응답 언어: 한국어
- 코드 주석: 한국어로 작성
- 커밋 메시지: 한국어로 작성
- 문서화: 한국어로 작성 (IMPORTANT)
- 변수명/함수명: 영어 (코드 표준 준수)
- UI 텍스트/라벨: 한국어

## 코딩 스타일
- 들여쓰기: 2칸
- 네이밍: camelCase (변수/함수), PascalCase (컴포넌트/타입/인터페이스)
- 파일명: kebab-case (페이지), PascalCase (컴포넌트)
- 따옴표: 작은 따옴표 (') 선호

## 기술 스택
- 프레임워크: Nuxt 3 (SSG 모드, ssr: false)
- CSS: Tailwind CSS v4 + 모듈식 CSS (admin-common.css, admin-buttons.css 등)
- 상태관리: Pinia
- HTTP: fetch API (axios에서 마이그레이션 진행 중)
- 아이콘: Font Awesome, Lucide Vue
- 차트: Chart.js
- 날짜: date-fns, @vuepic/vue-datepicker
- 문서: exceljs, xlsx, docx

## 프로젝트 구조
pages/admin/ # 관리자 페이지 (파일 기반 라우팅) pages/m/ # 모바일 페이지 (토큰 기반 접근) components/admin/ # 관리자 전용 컴포넌트 components/ui/ # 공통 UI 컴포넌트 services/ # API 서비스 레이어 services/api/endpoints/ # API 엔드포인트 정의 stores/ # Pinia 스토어 composables/ # Vue Composition API 컴포저블 types/ # TypeScript 타입 정의 utils/ # 유틸리티 함수 assets/css/ # 모듈식 CSS 파일 middleware/ # Nuxt 미들웨어 (auth, environment) plugins/ # Nuxt 플러그인 (api-interceptor, auth-init)


## CSS 규칙 (IMPORTANT)
- 공통 CSS에 있는 스타일 중복 작성 절대 금지
- 전역 로드된 CSS: admin-common.css, admin-buttons.css, admin-forms.css, admin-tables.css, admin-search.css, admin-modals.css
- 컴포넌트에서는 전용 스타일만 작성
- Design Tokens: CSS 변수로 global.css에 정의 (--primary-500, --gray-100 등)

## 페이징 규칙 (CRITICAL)
- Spring Boot API: 0-indexed (page=0이 첫 페이지)
- UI 표시: 1-indexed (page=1이 첫 페이지)
- API 호출 시: `page: currentPage.value - 1` 변환 필수
- API 응답 처리: `page: response.number + 1` 변환 필수

## API 통신 패턴
- 개발 API: http://localhost:9031/api
- 운영 API: http://leadpower.platree.com:9031/api
- 환경 전환: hostname 기반 자동 감지 또는 브라우저 콘솔에서 `apiEnvironment.forceProduction()`
- 인증: Bearer Token (Authorization 헤더)
- 토큰 갱신: Sliding Session (X-New-Access-Token 헤더)

## 인증/권한 시스템
- 토큰: JWT (Access Token + Refresh Token)
- 역할: SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_MANAGER, SITE_MANAGER 등
- 권한: 메뉴별 readAuth, writeAuth, editAuth, deleteAuth
- 대리 로그인: SYSTEM_ADMIN만 가능 (impersonate API)

## 컴포넌트 패턴
- Props: `interface Props { ... }` + `withDefaults(defineProps<Props>(), {...})`
- Emits: `defineEmits<{ eventName: [param: Type] }>()`
- Composable: `useXxx()` 형태, ref/computed/함수 반환
- 모달: Teleport to="body" 사용

## 스토어 패턴 (Pinia)
```typescript
export const useXxxStore = defineStore('xxx', () => {
  // State
  const data = ref<Type | null>(null)
  
  // Computed
  const isEmpty = computed(() => !data.value)
  
  // Actions
  async function fetchData() { ... }
  
  return { data, isEmpty, fetchData }
})

서비스 패턴

export const xxxService = {
  async getList(params: SearchRequest): Promise<PageResponse<T>> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }
}

타입 정의 패턴

// 상수와 타입 함께 정의
export const STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED'
} as const

export type Status = typeof STATUS[keyof typeof STATUS]

// 라벨 매핑
export const STATUS_LABELS: Record<Status, string> = {
  [STATUS.PENDING]: '대기',
  [STATUS.COMPLETED]: '완료'
}

주요 도메인
기초정보: 사용자, 회사, 품목, 조직, 은행계좌
발주/수주: 발주 등록, 수주 관리
출하/납품: 출하 관리, 운송, 납품 확인
자금: 선금, 기성금, 최종금 관리
커미션: 커미션율 설정, 정산, 지급
통계: 출하, 지역별, 판매 통계
시스템: 접근 로그, 설정, 메시지 템플릿

추가 사항
any 타입 사용 최소화 (가능하면 금지)
컴포넌트 분리 및 재사용
모바일 반응형 지원 (Tailwind breakpoints)
에러 처리: try-catch + 사용자 친화적 메시지
로딩 상태 표시 필수
테스트: 현재 미구현 (향후 Vitest 예정)

빌드/배포
빌드: npm run generate (SSG 정적 빌드)
미리보기: npm run preview
개발: npm run dev (localhost:3000)
HMR: 비활성화됨 (hmr: false)

문서 참조
CSS 가이드: docs/CSS_GUIDELINES.md
리팩토링 전략: docs/REFACTORING_STRATEGY.md
납품 시스템: docs/DELIVERY_SYSTEM.md
API 가이드: docs/API_ENDPOINTS_GUIDE.md