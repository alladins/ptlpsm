/**
 * 모바일 주문 요청 Store (Pinia)
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 현장소장 모바일 주문 요청 및 관리자 처리 상태 관리
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mobileOrderService } from '~/services/mobile-order.service'
import type {
  MobileOrderRequest,
  MobileOrderRequestListItem,
  MobileOrderCreateRequest,
  OrderRequestSearchParams,
  OrderRequestApproveRequest,
  OrderRequestRejectRequest
} from '~/types/mobile-order'

export const useMobileOrderRequestStore = defineStore('mobileOrderRequest', () => {
  // ============ State ============

  /** 요청 목록 (모바일/관리자 공용) */
  const list = ref<MobileOrderRequestListItem[]>([])

  /** 요청 상세 정보 */
  const detail = ref<MobileOrderRequest | null>(null)

  /** 로딩 상태 */
  const loading = ref(false)

  /** 에러 메시지 */
  const error = ref<string | null>(null)

  /** 페이지네이션 (관리자용) */
  const pagination = ref({
    page: 1,
    size: 20,
    total: 0,
    totalPages: 0
  })

  // ============ Computed ============

  /** 목록이 비어있는지 여부 */
  const isEmpty = computed(() => list.value.length === 0)

  /** 현재 페이지 */
  const currentPage = computed(() => pagination.value.page)

  /** 전체 항목 수 */
  const totalElements = computed(() => pagination.value.total)

  /** 대기중인 요청 수 */
  const pendingCount = computed(() => {
    return list.value.filter(item => item.status === 'REQUESTED').length
  })

  /** 긴급 요청 수 */
  const urgentCount = computed(() => {
    return list.value.filter(item => item.urgency === 'URGENT' && item.status === 'REQUESTED').length
  })

  // ============ Actions (모바일) ============

  /**
   * 내 주문 요청 목록 조회 (현장소장)
   */
  async function fetchMyRequests() {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.getMyRequests()
      list.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 목록 조회 실패'
      console.error('내 요청 목록 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 주문 요청 생성 (현장소장)
   */
  async function createRequest(data: MobileOrderCreateRequest): Promise<MobileOrderRequest | null> {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.createRequest(data)
      // 목록 새로고침
      await fetchMyRequests()
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 생성 실패'
      console.error('요청 생성 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 요청 상세 조회 (현장소장)
   */
  async function fetchRequestDetail(requestId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.getRequestDetail(requestId)
      detail.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 상세 조회 실패'
      console.error('요청 상세 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  // ============ Actions (관리자) ============

  /**
   * 전체 주문 요청 목록 조회 (관리자)
   */
  async function fetchAllRequests(params: OrderRequestSearchParams = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.getAllRequests(params)

      list.value = response.content
      pagination.value = {
        page: response.number + 1, // 0-indexed to 1-indexed
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 목록 조회 실패'
      console.error('관리자 요청 목록 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 요청 상세 조회 (관리자)
   */
  async function fetchAdminRequestDetail(requestId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.getAdminRequestDetail(requestId)
      detail.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 상세 조회 실패'
      console.error('관리자 요청 상세 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 주문 요청 승인 (관리자)
   */
  async function approveRequest(requestId: number, data: OrderRequestApproveRequest): Promise<MobileOrderRequest | null> {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.approveRequest(requestId, data)
      // 상세 정보 업데이트
      if (detail.value?.requestId === requestId) {
        detail.value = response
      }
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 승인 실패'
      console.error('요청 승인 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 주문 요청 반려 (관리자)
   */
  async function rejectRequest(requestId: number, data: OrderRequestRejectRequest): Promise<MobileOrderRequest | null> {
    loading.value = true
    error.value = null

    try {
      const response = await mobileOrderService.rejectRequest(requestId, data)
      // 상세 정보 업데이트
      if (detail.value?.requestId === requestId) {
        detail.value = response
      }
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '요청 반려 실패'
      console.error('요청 반려 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 상태 초기화
   */
  function reset() {
    list.value = []
    detail.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      page: 1,
      size: 20,
      total: 0,
      totalPages: 0
    }
  }

  return {
    // State
    list,
    detail,
    loading,
    error,
    pagination,

    // Computed
    isEmpty,
    currentPage,
    totalElements,
    pendingCount,
    urgentCount,

    // Actions (모바일)
    fetchMyRequests,
    createRequest,
    fetchRequestDetail,

    // Actions (관리자)
    fetchAllRequests,
    fetchAdminRequestDetail,
    approveRequest,
    rejectRequest,

    // Common
    reset
  }
})
