# Claude Code 설정

이 파일은 루트 CLAUDE.md의 보조 설정으로, Claude Code 특화 지침을 담습니다.

## 언어 규칙 (IMPORTANT)
- **응답**: 한국어
- **코드 주석**: 한국어
- **커밋 메시지**: 한국어
- **문서**: 한국어
- **변수/함수명**: 영어

## 코딩 스타일
- 들여쓰기: 2칸
- 네이밍: camelCase (변수/함수), PascalCase (컴포넌트/타입)
- 파일명: kebab-case (페이지), PascalCase (컴포넌트)
- 따옴표: 작은 따옴표 (')

## 코드 패턴 참조

### 컴포넌트
```typescript
interface Props {
  title: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})
const emit = defineEmits<{ update: [value: string] }>()
```

### Pinia 스토어
```typescript
export const useXxxStore = defineStore('xxx', () => {
  const data = ref<Type | null>(null)
  const isEmpty = computed(() => !data.value)
  async function fetchData() { /* ... */ }
  return { data, isEmpty, fetchData }
})
```

### 서비스
```typescript
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
```

### 타입 + 상수
```typescript
export const STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED'
} as const

export type Status = typeof STATUS[keyof typeof STATUS]

export const STATUS_LABELS: Record<Status, string> = {
  [STATUS.PENDING]: '대기',
  [STATUS.COMPLETED]: '완료'
}
```

## 주요 도메인
- **기초정보**: 사용자, 회사, 품목, 조직, 은행계좌
- **발주/수주**: 발주 등록, 수주 관리
- **출하/납품**: 출하 관리, 운송, 납품 확인
- **자금**: 선금, 기성금, 최종금 관리
- **커미션**: 커미션율 설정, 정산, 지급
- **통계**: 출하, 지역별, 판매 통계
- **시스템**: 접근 로그, 설정, 메시지 템플릿

## 기타
- `any` 타입 사용 최소화
- 모달: `Teleport to="body"` 사용
- 에러 처리: try-catch + 사용자 친화적 메시지
- 테스트: 현재 미구현 (향후 Vitest 예정)