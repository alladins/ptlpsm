/**
 * 출하 등록/수정 페이지 공통 데이터 Composable
 *
 * 공통 로직:
 * - OEM 제조사 목록 조회 (MANUFACTURER 타입)
 * - 현장담당자 목록 조회 (SITE_MANAGER 역할)
 * - 초기 데이터 병렬 로드
 * - 현장담당자 선택 시 건설사 자동 설정 watch
 *
 * 사용 예시:
 * ```typescript
 * const {
 *   oemCompanies, loadingOemCompanies,
 *   siteManagers, loadingSiteManagers,
 *   setupBuilderAutoSet
 * } = useShippingFormData()
 * ```
 */

import { ref, watch, onMounted } from 'vue'
import { companyService } from '~/services/company.service'
import { userService } from '~/services/user.service'
import type { CompanyInfoResponse } from '~/types/company'
import type { UserByRole } from '~/types/user'

interface BuilderAutoSetTarget {
  /** 현장담당자 ID (watch 대상) */
  siteManagerId: number | null
  /** 건설사 ID (자동 설정 대상) */
  builderCompanyId: number | null
  /** 건설사명 (자동 설정 대상) */
  builderCompanyName: string
}

export function useShippingFormData() {
  // OEM 제조사 목록
  const oemCompanies = ref<CompanyInfoResponse[]>([])
  const loadingOemCompanies = ref(false)

  // 현장담당자 목록
  const siteManagers = ref<UserByRole[]>([])
  const loadingSiteManagers = ref(false)

  // OEM 제조사, 현장담당자 데이터 병렬 로드
  onMounted(async () => {
    loadingOemCompanies.value = true
    loadingSiteManagers.value = true

    try {
      // 병렬로 API 호출 (OEM 제조사는 MANUFACTURER 타입만 조회)
      const [manufacturers, users] = await Promise.all([
        companyService.getManufacturers(),
        userService.getUsersByRoles(['SITE_MANAGER'])
      ])

      oemCompanies.value = manufacturers
      siteManagers.value = users
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error)
    } finally {
      loadingOemCompanies.value = false
      loadingSiteManagers.value = false
    }
  })

  /**
   * 현장담당자 선택 시 건설사 자동 설정 watch 등록
   *
   * @param formData - siteManagerId, builderCompanyId, builderCompanyName 필드를 가진 reactive 객체
   */
  const setupBuilderAutoSet = (formData: BuilderAutoSetTarget) => {
    watch(() => formData.siteManagerId, (newManagerId) => {
      if (newManagerId) {
        const selectedManager = siteManagers.value.find(m => m.userid === newManagerId)
        if (selectedManager?.companyId) {
          formData.builderCompanyId = selectedManager.companyId
          formData.builderCompanyName = selectedManager.companyName || ''
        }
      } else {
        // 현장담당자 해제 시 건설사도 초기화
        formData.builderCompanyId = null
        formData.builderCompanyName = ''
      }
    })
  }

  return {
    // OEM 제조사
    oemCompanies,
    loadingOemCompanies,
    // 현장담당자
    siteManagers,
    loadingSiteManagers,
    // 건설사 자동 설정
    setupBuilderAutoSet
  }
}
