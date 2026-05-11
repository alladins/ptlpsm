<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# utils

## Purpose
순수 유틸 함수 라이브러리. 포매팅, 유효성 검증, 상수, 정렬, 이미지 압축, 로거, 스토리지 등 UI 이상의 비즈니스 로직과 데이터 변환을 담당. 프레임워크 의존성 없음.

## Key Files
| File | Description |
|------|-------------|
| `constants.ts` | 글로벌 상수 (페이징, 날짜 형식, API 상태) |
| `format.ts` | 포매팅 (금액, 날짜, 전화번호, 수량 등) |
| `validate.ts` | 기본 검증 (이메일, 전화, 숫자 범위) |
| `validators.ts` | 도메인 검증 (발주, 납품, 자금) |
| `storage.ts` | localStorage 래퍼 (JSON 안전성) |
| `logger.ts` | 콘솔 로깅 (레벨, 타이밍) |
| `sort.ts` | 정렬 헬퍼 (다중 컬럼, 방향) |
| `delivery.ts` | 납품확인 도메인 유틸 |
| `transport-date.ts` | 운송 일자 계산 |
| `image-compress.ts` | 이미지 클라이언트 압축 |

## For AI Agents

### Working In This Directory
- 파일명: kebab-case (예: `image-compress.ts`)
- 함수명: camelCase
- 반환: 순수 값 또는 Promise (부수 효과 최소화)
- 테스트: 환경 의존성 없이 jest로 테스트 가능하도록 설계
- 타입: 모든 매개변수·반환값에 명시

### Utility Functions

#### format.ts (포매팅)
```typescript
export function formatCurrency(amount: number): string  // "1,234,567"
export function formatDate(date: Date | string, format?: string): string  // "2026-05-05"
export function formatPhoneNumber(phone: string): string  // "010-1234-5678"
export function formatQuantity(qty: number, unit: string): string  // "100 개"
export function formatPercent(value: number, decimals?: number): string  // "12.34%"
```

#### validate.ts (기본 검증)
```typescript
export function isValidEmail(email: string): boolean
export function isValidPhone(phone: string): boolean
export function isValidNumber(value: any): boolean
export function isInRange(value: number, min: number, max: number): boolean
```

#### validators.ts (도메인 검증)
```typescript
export function validateOrder(order: Order): ValidationResult
export function validateDelivery(delivery: Delivery): ValidationResult
export function validateFund(fund: Fund): ValidationResult
// 반환: { isValid: boolean, errors: Record<string, string> }
```

#### storage.ts (localStorage 안전)
```typescript
export const safeStorage = {
  setItem(key: string, value: string): void  // JSON.stringify 금지
  getItem(key: string): string | null
  setJSON<T>(key: string, obj: T): void  // JSON 자동 처리
  getJSON<T>(key: string): T | null
  removeItem(key: string): void
}
```

#### logger.ts (로깅)
```typescript
export const logger = {
  debug(msg: string, data?: any): void
  info(msg: string, data?: any): void
  warn(msg: string, data?: any): void
  error(msg: string, err?: Error | any): void
}
```

#### sort.ts (정렬)
```typescript
export function createSortComparator<T>(
  sortBy: string,
  order: 'asc' | 'desc'
): (a: T, b: T) => number
```

#### constants.ts (상수)
```typescript
export const PAGINATION = { DEFAULT_PAGE_SIZE: 10, PAGE_SIZE_OPTIONS: [...] }
export const DATE_FORMAT = { STANDARD: 'YYYY-MM-DD', KOREAN: 'YYYY. MM. DD.' }
export const API_STATUS = { SUCCESS: 200, CREATED: 201, ... }
```

### Common Patterns
- 포매팅 함수: null/undefined 체크 + 기본값 반환
- 유효성: boolean 반환 또는 errors 객체
- 도메인 로직: 계산식 분리 (자금, 배송 일자)
- 스토리지: 직렬화 자동화 (JSON.parse 수동 호출 금지)

### 금액 기준 정책
- 모든 집계/매출/계약총액/PDF: `orders.item_total_amount` (품대계) 사용
- formatCurrency() 호출 시 자동으로 품대계 기준 포매팅
- 레거시 컬럼(total_amount, commission) 사용 금지 (저장만, UI 금지)

## Dependencies

### Internal
- `types/*` (도메인 타입)

### External
- 없음 (프레임워크 의존성 없음)

<!-- MANUAL: -->
