/**
 * 영업관리 1단계 서비스 — 대리점·권역·설계사무소·담당 판정
 *
 * apiClient 사용 (인증 헤더·쿼리 문자열·에러 정규화 자동).
 * 에러 시 ApiError.message 에 백엔드 메시지가 그대로 들어온다 → 화면에서 그대로 보여줄 것.
 */
import { apiClient } from '~/services/api/client'
import type {
  Agency,
  AgencyRequest,
  AgencyResolveResult,
  AgencySearchParams,
  AgencyStaff,
  DemandOrgPage,
  DemandOrgSalesAttr,
  DemandOrgSalesAttrRequest,
  DemandOrgSearchParams,
  DesignOffice,
  DesignOfficeEnrichResult,
  DesignOfficePage,
  DesignOfficeRegionTree,
  DesignOfficeRequest,
  DesignOfficeSearchParams,
  RebuildResult,
  RegionSigunguUpdateRequest,
  ResolvePreviewBasis,
  ResolvePreviewResponse,
  SalesRegion,
  SalesRegionCreateRequest,
  SalesRegionUpdateRequest,
  Sigungu,
  Territory,
  TerritoryRequest
} from '~/types/agency'

const REGION_BASE = '/admin/sales-regions'
const AGENCY_BASE = '/admin/agencies'
const DESIGN_OFFICE_BASE = '/admin/design-offices'
const DEMAND_ORG_ATTR_BASE = '/admin/demand-org-sales-attr'

/** 권역 */
export const salesRegionService = {
  /** 전체 권역 (폐지 포함) — 트리는 parentRegionId 로 화면에서 만든다 */
  getRegions (): Promise<SalesRegion[]> {
    return apiClient.get<SalesRegion[]>(REGION_BASE)
  },

  getRegion (regionId: number): Promise<SalesRegion> {
    return apiClient.get<SalesRegion>(`${REGION_BASE}/${regionId}`)
  },

  createRegion (data: SalesRegionCreateRequest): Promise<SalesRegion> {
    return apiClient.post<SalesRegion>(REGION_BASE, data)
  },

  /** 수정·폐지(useYn='N') — 전체 필드를 덮어쓰므로 기존 값을 모두 채워 보낼 것 */
  updateRegion (regionId: number, data: SalesRegionUpdateRequest): Promise<SalesRegion> {
    return apiClient.put<SalesRegion>(`${REGION_BASE}/${regionId}`, data)
  },

  /** 시군구 + 현재 소속 권역 (sidoCd 생략 시 전국) */
  getSigungu (sidoCd?: string): Promise<Sigungu[]> {
    return apiClient.get<Sigungu[]>(`${REGION_BASE}/sigungu`, { sidoCd })
  },

  /** 권역의 시군구 부분 변경 — 다른 권역 소속 시군구를 add 하면 이 권역으로 옮겨진다 */
  updateRegionSigungu (regionId: number, data: RegionSigunguUpdateRequest): Promise<SalesRegion> {
    return apiClient.put<SalesRegion>(`${REGION_BASE}/${regionId}/sigungu`, data)
  },

  /** 이 권역의 담당 이력 */
  getRegionTerritories (regionId: number): Promise<Territory[]> {
    return apiClient.get<Territory[]>(`${REGION_BASE}/${regionId}/territories`)
  }
}

/** 대리점 */
export const agencyService = {
  getAgencies (params: AgencySearchParams = {}): Promise<Agency[]> {
    return apiClient.get<Agency[]>(AGENCY_BASE, { ...params })
  },

  getAgency (agencyId: number): Promise<Agency> {
    return apiClient.get<Agency>(`${AGENCY_BASE}/${agencyId}`)
  },

  createAgency (data: AgencyRequest): Promise<Agency> {
    return apiClient.post<Agency>(AGENCY_BASE, data)
  },

  /** channel 은 기존 값과 같아야 한다 (등록 후 변경 불가) */
  updateAgency (agencyId: number, data: AgencyRequest): Promise<Agency> {
    return apiClient.put<Agency>(`${AGENCY_BASE}/${agencyId}`, data)
  },

  /** 권역·채널로 대리점 코드 제안 (예 AG-031S-01) */
  suggestCode (regionId: number, channel: string): Promise<{ agencyCode: string }> {
    return apiClient.get<{ agencyCode: string }>(`${AGENCY_BASE}/suggest-code`, { regionId, channel })
  },

  getTerritories (agencyId: number): Promise<Territory[]> {
    return apiClient.get<Territory[]>(`${AGENCY_BASE}/${agencyId}/territories`)
  },

  addTerritory (agencyId: number, data: TerritoryRequest): Promise<Territory> {
    return apiClient.post<Territory>(`${AGENCY_BASE}/${agencyId}/territories`, data)
  },

  /** 담당 수정 (주로 종료일 입력). 삭제는 없다 — 이력은 커미션 근거 */
  updateTerritory (agencyId: number, territoryId: number, data: TerritoryRequest): Promise<Territory> {
    return apiClient.put<Territory>(`${AGENCY_BASE}/${agencyId}/territories/${territoryId}`, data)
  },

  getStaff (agencyId: number): Promise<AgencyStaff[]> {
    return apiClient.get<AgencyStaff[]>(`${AGENCY_BASE}/${agencyId}/staff`)
  },

  /** 단건 담당 판정 (baseDate 생략 시 오늘) */
  resolve (dminsttCd: string, baseDate?: string): Promise<AgencyResolveResult> {
    return apiClient.get<AgencyResolveResult>(`${AGENCY_BASE}/resolve`, { dminsttCd, baseDate })
  },

  /** 기존 납품요구 판정 미리보기 (저장하지 않음) */
  previewOrders (basis: ResolvePreviewBasis): Promise<ResolvePreviewResponse> {
    return apiClient.get<ResolvePreviewResponse>(`${AGENCY_BASE}/resolve-preview/orders`, { basis }, { timeout: 60000 })
  }
}

/** 설계사무소 */
export const designOfficeService = {
  /** 목록 (페이지, page 는 0-based) */
  getDesignOffices (params: DesignOfficeSearchParams): Promise<DesignOfficePage> {
    return apiClient.get<DesignOfficePage>(DESIGN_OFFICE_BASE, { ...params })
  },

  /** 권역 트리 — 권역별 사무소 수·미배정·미판정·내 권역 (bizStatus 는 목록과 같은 영업상태 조건) */
  getRegionTree (bizStatus?: string): Promise<DesignOfficeRegionTree> {
    return apiClient.get<DesignOfficeRegionTree>(`${DESIGN_OFFICE_BASE}/region-tree`, bizStatus ? { bizStatus } : undefined)
  },

  /** 주소·소재 시군구가 빈 곳을 나라장터 업체정보로 채운다 (리드파워 관리자만, 최대 300곳) */
  enrichFromG2b (): Promise<DesignOfficeEnrichResult> {
    return apiClient.post<DesignOfficeEnrichResult>(`${DESIGN_OFFICE_BASE}/enrich-g2b`)
  },

  getDesignOffice (id: number): Promise<DesignOffice> {
    return apiClient.get<DesignOffice>(`${DESIGN_OFFICE_BASE}/${id}`)
  },

  createDesignOffice (data: DesignOfficeRequest): Promise<DesignOffice> {
    return apiClient.post<DesignOffice>(DESIGN_OFFICE_BASE, data)
  },

  updateDesignOffice (id: number, data: DesignOfficeRequest): Promise<DesignOffice> {
    return apiClient.put<DesignOffice>(`${DESIGN_OFFICE_BASE}/${id}`, data)
  }
}

/** 수요기관 판정값 */
export const demandOrgAttrService = {
  search (params: DemandOrgSearchParams): Promise<DemandOrgPage> {
    return apiClient.get<DemandOrgPage>(DEMAND_ORG_ATTR_BASE, {
      ...params,
      // false 는 조건 없음과 같으므로 보내지 않는다
      failedOnly: params.failedOnly ? true : undefined
    })
  },

  get (dminsttCd: string): Promise<DemandOrgSalesAttr> {
    return apiClient.get<DemandOrgSalesAttr>(`${DEMAND_ORG_ATTR_BASE}/${encodeURIComponent(dminsttCd)}`)
  },

  /** 수동 보정 — 저장하면 출처가 MANUAL 이 되어 자동 재실행에도 유지된다 */
  updateManual (dminsttCd: string, data: DemandOrgSalesAttrRequest): Promise<DemandOrgSalesAttr> {
    return apiClient.put<DemandOrgSalesAttr>(`${DEMAND_ORG_ATTR_BASE}/${encodeURIComponent(dminsttCd)}`, data)
  },

  /** 수동 보정 취소 → 자동 판정값으로 되돌림 */
  revertToAuto (dminsttCd: string): Promise<DemandOrgSalesAttr> {
    return apiClient.delete<DemandOrgSalesAttr>(`${DEMAND_ORG_ATTR_BASE}/${encodeURIComponent(dminsttCd)}/manual`)
  },

  /** 자동 판정 일괄 재실행 (약 7.6만 건, 수동 보정은 제외) — 오래 걸리므로 타임아웃을 넉넉히 */
  rebuild (): Promise<RebuildResult> {
    return apiClient.post<RebuildResult>(`${DEMAND_ORG_ATTR_BASE}/rebuild`, undefined, { timeout: 300000 })
  }
}
