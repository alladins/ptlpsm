import { nextTick } from 'vue'

/**
 * 폼 검증 실패를 사용자에게 «알리고 + 데려다주는» 공통 처리
 *
 * ❌ 기존 방식: errors 객체에 담아 입력칸 아래 작은 빨간 글씨로만 표시
 *    → [저장] 을 눌렀는데 아무 일도 안 일어난 것처럼 보인다.
 *      화면이 길면 에러가 스크롤 밖에 있어 아예 보이지 않는다.
 *      (2026-09-21 발주서 등록에서 «납기 예정일» 이 그랬다)
 *
 * ✅ 이 함수: 무엇이 잘못됐는지 팝업으로 알리고,
 *    확인을 누르면 첫 번째 문제 칸으로 스크롤 + 포커스까지 옮겨 준다.
 *
 * 포커스 대상은 `FormField` 가 에러 시 붙이는 `.form-field--error` 로 찾는다.
 * 그 컴포넌트를 안 쓰는 화면을 위해 `.is-error` / `[aria-invalid="true"]` 도 함께 본다.
 *
 * @param errors        필드명 → 메시지. 비어 있으면 통과(true)
 * @param extraMessages 필드에 매달리지 않는 추가 메시지 (예: "품목을 1개 이상 추가하세요")
 * @param container     찾을 범위를 좁히고 싶을 때의 CSS 셀렉터 (모달 안 등)
 * @returns 통과 여부. false 면 호출부에서 저장을 중단한다
 */
export async function reportValidationErrors(
  errors: Record<string, string>,
  extraMessages: string[] = [],
  container?: string
): Promise<boolean> {
  const messages = [...Object.values(errors).filter(Boolean), ...extraMessages.filter(Boolean)]
  if (messages.length === 0) { return true }

  // errors 를 화면에 반영한 뒤에 찾아야 .form-field--error 가 붙어 있다.
  // alert 이 동기로 막아버리므로 DOM 갱신을 먼저 기다린다.
  await nextTick()

  alert(
    messages.length === 1
      ? messages[0]
      : `입력을 확인해 주세요.\n\n${messages.map(m => `· ${m}`).join('\n')}`
  )

  focusFirstError(container)
  return false
}

/**
 * 첫 번째 에러 입력칸으로 스크롤 + 포커스
 *
 * ⚠ 포커스만 주면 화면 밖에 있을 때 사용자가 어디로 갔는지 모른다.
 *   스크롤을 함께 옮기고 가운데 정렬한다.
 */
export function focusFirstError(container?: string): void {
  if (typeof document === 'undefined') { return }

  const root: ParentNode = (container ? document.querySelector(container) : null) ?? document

  const field = root.querySelector(
    '.form-field--error, .is-error, [aria-invalid="true"]'
  )
  if (!field) { return }

  // 래퍼가 걸렸으면 안쪽 입력 요소를, 입력 요소 자체가 걸렸으면 그대로 쓴다.
  const target = (
    field.matches('input, select, textarea')
      ? field
      : field.querySelector('input, select, textarea')
  ) as HTMLElement | null

  const scrollTo = target ?? (field as HTMLElement)
  scrollTo.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // 스크롤이 끝나기 전에 포커스를 주면 브라우저가 다시 튕겨 올린다.
  window.setTimeout(() => {
    try { target?.focus({ preventScroll: true }) } catch { target?.focus() }
  }, 300)
}
