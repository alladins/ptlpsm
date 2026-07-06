/**
 * topgrid Pro 차트 라이선스 키 등록 (클라이언트 전용, 앱 진입 시 1회).
 * - 키는 도메인 바인딩(현재: leadpower.platree.com) → 환경별 .env 로 분리 주입.
 * - 키 미설정/도메인 불일치 시에도 차트는 정상 동작하고 "Unlicensed" 워터마크만 표시됨.
 */
import { setLicenseKey } from '@topgrid/grid-pro-chart-enterprise-vue'

export default defineNuxtPlugin(() => {
  const key = useRuntimeConfig().public.topgridLicenseKey as string
  if (key) {
    setLicenseKey(key)
  }
})
