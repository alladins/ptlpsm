/**
 * 현장(프로젝트) 마스터 Pinia Store (관리자용)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { siteService } from '~/services/site.service'
import type { Site, SiteCreateRequest, SiteUpdateRequest, SiteSearchParams, SiteTokenInfo } from '~/types/site'

export const useSiteStore = defineStore('site', () => {
  // State
  const list = ref<Site[]>([])
  const detail = ref<Site | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, size: 20, total: 0, totalPages: 0 })

  // Computed
  const isEmpty = computed(() => list.value.length === 0)
  const activeCount = computed(() => list.value.filter(s => s.active).length)

  // Actions
  async function fetchList(params: SiteSearchParams = {}) {
    loading.value = true
    error.value = null
    try {
      // UI 1-indexed → API 0-indexed
      const page = (params.page ?? 1) - 1
      const response = await siteService.search({ ...params, page, size: params.size ?? 20 })
      list.value = response.content
      pagination.value = {
        page: response.number + 1,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '현장 목록 조회 실패'
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(siteId: number) {
    loading.value = true
    error.value = null
    try {
      detail.value = await siteService.getById(siteId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '현장 상세 조회 실패'
    } finally {
      loading.value = false
    }
  }

  async function create(data: SiteCreateRequest): Promise<Site> {
    loading.value = true
    error.value = null
    try {
      const created = await siteService.create(data)
      detail.value = created
      return created
    } finally {
      loading.value = false
    }
  }

  async function update(siteId: number, data: SiteUpdateRequest): Promise<Site> {
    loading.value = true
    error.value = null
    try {
      const updated = await siteService.update(siteId, data)
      if (detail.value?.siteId === siteId) detail.value = updated
      return updated
    } finally {
      loading.value = false
    }
  }

  async function regenerateToken(siteId: number): Promise<SiteTokenInfo> {
    return siteService.regenerateToken(siteId)
  }

  async function setActive(siteId: number, active: boolean): Promise<Site> {
    const fn = active ? siteService.activate : siteService.deactivate
    const updated = await fn(siteId)
    if (detail.value?.siteId === siteId) detail.value = updated
    // 목록에서도 갱신
    const idx = list.value.findIndex(s => s.siteId === siteId)
    if (idx >= 0) list.value[idx] = updated
    return updated
  }

  async function remove(siteId: number) {
    await siteService.remove(siteId)
    list.value = list.value.filter(s => s.siteId !== siteId)
    if (detail.value?.siteId === siteId) detail.value = null
  }

  function reset() {
    list.value = []
    detail.value = null
    loading.value = false
    error.value = null
    pagination.value = { page: 1, size: 20, total: 0, totalPages: 0 }
  }

  return {
    list, detail, loading, error, pagination,
    isEmpty, activeCount,
    fetchList, fetchDetail, create, update, regenerateToken, setActive, remove, reset
  }
})
