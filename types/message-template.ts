/**
 * 메시지 템플릿 타입 정의
 */

export type MessageTemplateType = 'SMS' | 'LMS' | 'MMS'

export interface MessageTemplate {
  templateId: number
  templateCode: string
  templateName: string
  templateType: MessageTemplateType
  subject: string | null
  content: string
  description: string | null
  useYn: 'Y' | 'N'
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export interface MessageTemplateCreateRequest {
  templateCode: string
  templateName: string
  templateType: MessageTemplateType
  subject?: string
  content: string
  description?: string
  useYn: 'Y' | 'N'
}

export interface MessageTemplateUpdateRequest extends Partial<MessageTemplateCreateRequest> {}

export interface MessageTemplateSearchParams {
  templateCode?: string
  templateName?: string
  templateType?: MessageTemplateType
  useYn?: 'Y' | 'N'
  page?: number
  size?: number
  sort?: string
}

export interface MessageTemplateListResponse {
  content: MessageTemplate[]
  totalElements: number
  totalPages: number
  page: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 템플릿 변수 정의
 */
export interface TemplateVariable {
  name: string
  key: string
  description: string
  example: string
  category: '납품' | '운송' | '공통'
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // 납품 관련
  { name: '납품요구번호', key: 'deliveryRequestNo', description: '납품요구번호', example: '24-22-4-31556-00', category: '납품' },
  { name: '계약번호', key: 'contractNo', description: '계약번호', example: '제00-22-7-0305-01호', category: '납품' },
  { name: '수요기관', key: 'client', description: '수요기관명', example: '전라남도', category: '납품' },
  { name: '프로젝트명', key: 'projectName', description: '프로젝트명', example: '농업인지원센터건립공사', category: '납품' },
  { name: '시공사', key: 'contractor', description: '시공사명', example: '(주)한주토건', category: '납품' },
  { name: '현장소장', key: 'supervisorName', description: '현장소장 이름', example: '홍길동', category: '납품' },
  { name: '감리원', key: 'inspectorName', description: '현장감리원 이름', example: '김철수', category: '납품' },
  { name: '서명 URL', key: 'signatureUrl', description: '모바일 서명 페이지 URL', example: 'https://app.example.com/m/...', category: '납품' },

  // 운송 관련
  { name: '운송장번호', key: 'trackingNumber', description: '운송장번호', example: 'T20250114-001', category: '운송' },
  { name: '납품일자', key: 'deliveryDate', description: '납품일자', example: '2025-01-14', category: '운송' },
  { name: '납품주소', key: 'deliveryAddress', description: '납품 주소', example: '서울시 강남구...', category: '운송' },
  { name: '기사명', key: 'driverName', description: '배송기사 이름', example: '이운전', category: '운송' },
  { name: '기사연락처', key: 'driverPhone', description: '배송기사 전화번호', example: '010-1234-5678', category: '운송' },
  { name: '출발시간', key: 'departureTime', description: '출발 시간', example: '2025-01-14 09:00', category: '운송' },
  { name: '도착시간', key: 'arrivalTime', description: '도착 시간', example: '2025-01-14 14:30', category: '운송' },
  { name: '예상도착', key: 'expectedArrival', description: '예상 도착 시간', example: '2025-01-14 15:00', category: '운송' },

  // 공통
  { name: '회사연락처', key: 'companyPhone', description: '회사 대표 전화번호', example: '1588-0000', category: '공통' },
]
