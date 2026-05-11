<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-05 | Updated: 2026-05-05 -->

# composables

## Purpose
Vue 3 재사용 로직. 페이지·컴포넌트에서 공통으로 필요한 데이터 로딩, 폼 관리, API 에러, 모달 등을 캡슐화. 모든 composable은 순수 함수로 구현되어 독립적으로 테스트 가능.

## Key Files
| File | Description |
|------|-------------|
| `useApi.ts` | API 호출 상태 관리 (로딩, 에러, 재시도) |
| `useApiError.ts` | API 에러 메시지 포맷팅 |
| `useDataTable.ts` | 테이블 데이터 로딩·페이징·정렬 |
| `useForm.ts` | 폼 상태·유효성·제출 |
| `useModal.ts` | 모달 열기/닫기 상태 |
| `useFundCalculations.ts` | 자금(선금·기성금·최종금) 계산 |
| `usePermission.ts` | 권한 체크 (메뉴, API 호출) |
| `useCommonStatus.ts` | 공통 상태값(배송 상태 등) 라벨화 |
| `useDeliveryButtons.ts` | 납품확인 액션 버튼 노출 규칙 |
| `useDeliveryGuide.ts` | 납품확인 가이드 텍스트 |
| `useFundStatusFormatters.ts` | 자금 상태 포매팅 |
| `useSalesStatus.ts` | 수주 상태 포매팅 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `admin/` | 관리자 전용 composable (상세 추가 예정) |

## For AI Agents

### Working In This Directory
- 파일명: camelCase (예: `useDataTable.ts`)
- 함수명: `use*` 프리픽스 필수
- 반환: 반응형 상태(`ref`, `computed`) + 액션 함수의 객체
- 자체 상태: composable 내부에서만, 외부 노출 금지
- API 호출: 내부에서 service 사용, 에러는 throw
- 에러 처리: 페이지에서 catch (composable은 throw만)

### Common Pattern
```typescript
export function useXxx() {
  // State
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Computed
  const isEmpty = computed(() => !data.value)
  
  // Actions
  async function fetch() {
    loading.value = true
    error.value = null
    try {
      data.value = await service.getDetail(id)
    } catch (err) {
      error.value = err.message
      throw err  // 페이지에서 catch
    } finally {
      loading.value = false
    }
  }
  
  // Return (다른 상태·함수 노출 금지)
  return { data, loading, error, isEmpty, fetch }
}
```

### Composable 분류
| Category | Purpose | Files |
|----------|---------|-------|
| **API·데이터** | 로딩, 에러, 재시도 | useApi, useApiError |
| **폼·유효성** | 입력값, 검증, 제출 | useForm |
| **테이블** | 페이징, 정렬, 필터 | useDataTable |
| **UI 상태** | 모달, 토글 | useModal |
| **도메인 로직** | 자금, 권한, 납품, 판매 | useFund*, usePermission, useDelivery*, useSalesStatus |

### useDataTable 사용
```typescript
const table = useDataTable(
  () => service.getList(params),  // 폴링 함수
  {
    pageSize: 10,
    sortBy: 'createdAt'
  }
)
// table.items, table.page, table.totalPages, table.load(), table.sort()
```

### useForm 사용
```typescript
const form = useForm(initialData, {
  validators: { email: validateEmail }
})
// form.data, form.errors, form.isValid, form.validate(), form.reset()
```

### usePermission 사용
```typescript
const { canAccess, hasMenuAccess } = usePermission()
if (!canAccess('order:write')) {
  // 거부
}
```

## Dependencies

### Internal
- `services/**` (API 호출)
- `stores/auth`, `permission`
- `utils/validate` (유효성)
- `utils/logger`
- `types/*` (타입)

### External
- vue (3.3+)
- @vueuse/core

<!-- MANUAL: -->
