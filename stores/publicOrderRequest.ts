/**
 * 토큰 기반 공개 주문요청 Pinia Store (현장소장 모바일용)
 *
 * - 인증 헤더 미부착 (publicOrderRequestService 가 raw fetch 사용)
 * - 토큰을 store 상태에 보관 → 페이지 간 일관 사용
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { publicOrderRequestService } from '~/services/public-order-request.service'
import type { SiteProfile } from '~/types/site'
import type { MobileOrderRequest, MobileOrderCreateRequest } from '~/types/mobile-order'

export const usePublicOrderRequestStore = defineStore('publicOrderRequest', () => {
  // State
  const token = ref<string | null>(null)
  const profile = ref<SiteProfile | null>(null)
  const list = ref<MobileOrderRequest[]>([])
  const detail = ref<MobileOrderRequest | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** 'expired' | 'revoked' | 'notfound' | 'other' | null */
  const errorType = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => profile.value !== null)
  const myRequestCount = computed(() => list.value.length)
  const pendingCount = computed(() => list.value.filter(r => r.status === 'PENDING').length)

  function setToken(t: string) {
    token.value = t
  }

  async function fetchProfile(): Promise<boolean> {
    if (!token.value) { error.value = '토큰이 없습니다.'; return false }
    loading.value = true
    error.value = null
    errorType.value = null
    try {
      profile.value = await publicOrderRequestService.getProfile(token.value)
      return true
    } catch (e) {
      handleError(e)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchList(): Promise<void> {
    if (!token.value) return
    loading.value = true
    try {
      list.value = await publicOrderRequestService.list(token.value)
    } catch (e) {
      handleError(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(requestId: number): Promise<void> {
    if (!token.value) return
    loading.value = true
    try {
      detail.value = await publicOrderRequestService.getById(token.value, requestId)
    } catch (e) {
      handleError(e)
    } finally {
      loading.value = false
    }
  }

  async function createRequest(data: MobileOrderCreateRequest): Promise<MobileOrderRequest> {
    if (!token.value) throw new Error('토큰이 없습니다.')
    loading.value = true
    try {
      const created = await publicOrderRequestService.create(token.value, data)
      // 목록 즉시 갱신
      await fetchList()
      return created
    } finally {
      loading.value = false
    }
  }

  async function updateRequest(requestId: number, data: MobileOrderCreateRequest): Promise<MobileOrderRequest> {
    if (!token.value) throw new Error('토큰이 없습니다.')
    const updated = await publicOrderRequestService.update(token.value, requestId, data)
    detail.value = updated
    await fetchList()
    return updated
  }

  async function cancelRequest(requestId: number): Promise<void> {
    if (!token.value) throw new Error('토큰이 없습니다.')
    await publicOrderRequestService.cancel(token.value, requestId)
    await fetchList()
  }

  function reset() {
    token.value = null
    profile.value = null
    list.value = []
    detail.value = null
    loading.value = false
    error.value = null
    errorType.value = null
  }

  function handleError(e: unknown) {
    const err = e as { status?: number; message?: string }
    error.value = err.message || '요청 처리 중 오류가 발생했습니다.'
    if (err.status === 410) errorType.value = 'expired'
    else if (err.status === 403) errorType.value = 'revoked'
    else if (err.status === 404) errorType.value = 'notfound'
    else errorType.value = 'other'
  }

  return {
    token, profile, list, detail, loading, error, errorType,
    isAuthenticated, myRequestCount, pendingCount,
    setToken, fetchProfile, fetchList, fetchDetail,
    createRequest, updateRequest, cancelRequest, reset
  }
})
