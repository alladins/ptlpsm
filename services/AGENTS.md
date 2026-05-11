<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# services

## Purpose
REST API 클라이언트 레이어. 백엔드 엔드포인트와 1:1 매칭되는 서비스 객체. 도메인별 `*.service.ts` 파일과 fetch 래퍼(`api.ts`) 구성. 모든 HTTP 호출의 단일 진입점.

## Key Files
| File | Description |
|------|-------------|
| `api.ts` | API 환경 설정, 기본 URL, 헤더 유틸 (getAuthHeaders, getApiBaseUrl) |
| `auth.service.ts` | 로그인, 로그아웃, 토큰 갱신 |
| `order.service.ts` | 발주 조회, 등록, 수정 |
| `delivery.service.ts` | 납품확인 조회, 서명, 완료 |
| `shipment.service.ts` | 출하 조회, 운송 정보 |
| `fund.service.ts` | 자금(선금, 기성금, 최종금) 관리 |
| `user.service.ts` | 사용자 조회, 권한 관리 |
| `statistics.service.ts` | 매출, 지역별, 판매 통계 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `api/` | 헬퍼·모듈 (로그인, 권한, 파일 업로드 등) |

## For AI Agents

### Working In This Directory
- 파일명: kebab-case + `.service.ts` (예: `order.service.ts`)
- 메서드명: `getList()`, `getDetail()`, `create()`, `update()`, `delete()` 표준
- 매개변수: 객체 방식 (타입 안정성), 개별 인자 금지
- 반환: `Promise<ApiResponse<T>>` 타입 명시
- 에러: response.ok 확인 후 throw new Error()
- 인증: `getAuthHeaders()` 사용 (Bearer token 자동)

### Standard Service Pattern
```typescript
export const xxxService = {
  async getList(params: SearchRequest): Promise<PageResponse<T>> {
    const response = await fetch(`${getApiBaseUrl()}/xxx`, {
      method: 'GET',
      headers: { ...getAuthHeaders() }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  
  async getDetail(id: number): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBaseUrl()}/xxx/${id}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.success ? data.data : data
  },
  
  async create(payload: T): Promise<ApiResponse<T>> {
    const response = await fetch(`${getApiBaseUrl()}/xxx`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}
```

### 41개 주요 서비스
| Category | Services |
|----------|----------|
| **인증·권한** | auth, user, access-log |
| **기초정보** | company, item, code, bank-account, demand-organization, business-card |
| **발주** | order, purchase-order, quotation, contract |
| **출하** | shipment, dispatch-request, inventory |
| **납품** | delivery, delivery-done |
| **자금** | advance-payment, fund, payment, baseline |
| **커미션** | commission, oem-ledger |
| **운송** | transport, mobile-order |
| **통계** | statistics, sales-activity, sales-forecast, oem-dashboard |
| **시스템** | message-template, message-history, notification, consultation, visit, warehouse, bgrade-item, oem-cost, menu, systemSetting |

### API 환경 전환
```typescript
// 로컬에서만 수동 전환 가능 (배포 환경은 도메인 기반 자동)
localStorage.setItem('api_environment', 'production')  // 운영 API (9032)
localStorage.setItem('api_environment', 'development') // 개발 API (9031)
```

### 페이징 규칙 (필수)
- API: 0-indexed (`page=0` = 첫 번째)
- UI: 1-indexed (사용자에게 페이지 1 표시)
- 호출: `getList({ page: uiPage - 1, size: 10 })`

## Dependencies

### Internal
- `stores/auth` (토큰 접근)
- `utils/logger` (에러 로깅)
- `types/*` (요청/응답 타입)

### External
- fetch API (built-in)
- axios (설치됨, 선택적)

<!-- MANUAL: -->
