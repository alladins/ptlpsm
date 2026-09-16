/**
 * 숫자 입력칸 가드
 *
 * `type="number"` 는 step 을 줘도 사용자가 소수점을 "타이핑" 하는 것을 막지 못한다.
 * step 은 스피너와 폼 검증에만 관여하기 때문이다.
 * 금액(원 단위)과 매수처럼 소수가 있을 수 없는 칸은 입력 자체를 막아야 한다.
 *
 * ⚠ 계약수량(order_items.quantity)은 예외다.
 *   조달청 PDF 에서 들어오는 원수량이라 소수가 정상이며(개발DB 32건),
 *   반올림하면 품대계가 오염된다. 그 칸에는 이 가드를 걸지 말 것.
 */

/** 소수점·지수 표기 입력을 막는다 */
export function blockDecimalKey (e: KeyboardEvent): void {
  // 소수점(., ,) 과 지수 표기(e, E) 는 정수 칸에 들어올 이유가 없다.
  // 부호(-)는 칸마다 다르므로 여기서 막지 않는다(재고 조정은 음수를 쓴다).
  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
    e.preventDefault()
  }
}

/**
 * 붙여넣기·자동완성으로 들어온 소수를 잘라낸다.
 *
 * 키 입력만 막으면 붙여넣기로 소수가 들어올 수 있다.
 * 값이 바뀐 뒤 정리하고 input 이벤트를 다시 쏘아 v-model 을 갱신한다.
 */
export function stripDecimalOnPaste (e: ClipboardEvent): void {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text.includes('.') && !text.includes(',')) { return }

  e.preventDefault()
  const el = e.target as HTMLInputElement
  const cleaned = text.replace(/[,]/g, '').split('.')[0]
  if (!cleaned) { return }

  el.value = cleaned
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * 비운 칸을 0 으로 되돌린다.
 *
 * ⚠ `v-model.number` 는 칸을 비우면 빈 문자열이나 NaN 을 넣는다.
 *   그 값이 서버로 가면 null 이 되고, 조건부 UPDATE 매퍼에서는
 *   "기존 값 유지" 로 해석되어 <b>0 으로 되돌릴 수가 없다</b>.
 *   금액·수량 칸은 비어 있는 상태가 의미를 갖지 않으므로 0 으로 고정한다.
 *
 * @example <input v-model.number="form.fee" @blur="zeroIfEmpty($event, v => form.fee = v)">
 */
export function zeroIfEmpty (e: Event, setter: (value: number) => void): void {
  const el = e.target as HTMLInputElement
  const raw = el.value?.trim() ?? ''
  const num = Number(raw)
  if (raw === '' || Number.isNaN(num)) {
    el.value = '0'
    setter(0)
  }
}

/** 소수가 들어왔으면 버린다 (붙여넣기·자동완성 대비 최종 방어) */
export function truncateToInt (e: Event, setter: (value: number) => void): void {
  const el = e.target as HTMLInputElement
  const raw = el.value?.trim() ?? ''
  const num = Number(raw)

  if (raw === '' || Number.isNaN(num)) {
    el.value = '0'
    setter(0)
    return
  }
  if (!Number.isInteger(num)) {
    const truncated = Math.trunc(num)
    el.value = String(truncated)
    setter(truncated)
  }
}
