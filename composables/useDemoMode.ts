/**
 * 데모 모드 여부 Composable
 *
 * 데모(쇼케이스) 빌드에서만 true. 빌드 시점에 고정되는 정적 플래그
 * (`.env.demo` 의 NUXT_PUBLIC_DEMO_MODE=true → generate:demo 산출물만 true).
 * dev/prod 빌드에서는 항상 false 이므로 데모 전용 동작이 절대 노출되지 않는다.
 *
 * @example
 * // 관람 화면의 파괴적 버튼 숨김
 * const isDemoMode = useDemoMode()
 * <button v-if="!isDemoMode" @click="reset">초기화</button>
 *
 * // 데모 전용 UI(플로팅 CTA 등) 노출
 * <FloatingCta v-if="isDemoMode" />
 */
export const useDemoMode = (): boolean => {
  return useRuntimeConfig().public.demoMode === true
}
