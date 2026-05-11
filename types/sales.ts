export interface SalesRequest {
  salesId?: number;
  customerNm: string;
  customerTel?: string;
  customerEmail?: string;
  salesTitle: string;
  salesContent?: string;
  contractAmount?: number;
  salesStatus: string;
  contractDate: string;
  expectedDeliveryDate: string;
  dminsttCd: string;
  dminsttNm: string;
  remark?: string;
  useYn?: string;
}

export interface SalesItemResponse {
  skuId: string;              // SKU ID
  itemId: string;             // 품목 ID
  itemName: string;           // 품목명
  skuName: string;           // SKU명
  itemSpecification: string;  // 품목규격
  unit: string;              // 단위
  unitPrice: number;         // 단가
  quantity: number;          // 수량
  amount: number;            // 금액 (단가 * 수량)
  sortOrder: number;         // 정렬순서
  createdBy: string;         // 생성자
  createdAt: string;         // 생성일시 (ISO 8601)
  updatedBy: string;         // 수정자
  updatedAt: string;         // 수정일시 (ISO 8601)
}

export interface SalesItemRequest {
  skuId: string;              // SKU ID (필수)
  itemId: string;             // 품목 ID (필수)
  itemName: string;           // 품목명 (필수)
  skuName: string;           // SKU명 (필수)
  itemSpecification?: string; // 품목규격 (선택)
  unit?: string;             // 단위 (선택)
  unitPrice: number;         // 단가 (필수, 0 이상)
  quantity: number;          // 수량 (필수, 1 이상)
  sortOrder?: number;        // 정렬순서 (선택)
}

// 영업 예측 인터페이스
export interface SalesForecast {
  id?: number;
  salesId: number;
  itemList?: string;
  demandOrganization?: string;
  businessName?: string;
  businessContent?: string;
  approximateQuantity?: string;
  forecastAmount?: number;
  probability?: string;
  expectedContractDate?: string;
  remark?: string;
  useYn?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface SalesForecastRequest {
  salesId: number;
  itemList?: string;
  demandOrganization?: string;
  businessName?: string;
  businessContent?: string;
  approximateQuantity?: string;
  forecastAmount?: number;
  probability?: string;
  expectedContractDate?: string;
  remark?: string;
  useYn?: string;
}

// 계약 연결 요청 인터페이스
export interface ContractLinkRequest {
  salesId: number;
  deliveryRequestNo: string;
}

// 영업 활동 기록
export interface SalesActivity {
  id?: number
  salesId: number
  activityDate: string
  visitPurpose: string       // 방문목적
  activityType: string       // 활동유형
  activityContent: string    // 활동내용
  nextAction?: string        // 다음 액션
  nextActionDate?: string    // 다음 액션 예정일
  contractAmount?: number    // 계약금액
  contractDate?: string      // 계약일자
  contractNote?: string      // 계약 관련 메모
  files?: SalesActivityFile[] // 첨부파일 목록
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
}

export interface SalesActivityRequest {
  activityDate: string
  visitPurpose: string
  activityType: string
  activityContent: string
  nextAction?: string
  nextActionDate?: string
  contractAmount?: number
  contractDate?: string
  contractNote?: string
}

// 영업활동 첨부파일
export interface SalesActivityFile {
  id: number
  fileNm: string
  fileSize: number
  mimeType: string
  sortOrder: number
  createdAt: string
}

// 방문목적 옵션
export const VISIT_PURPOSE_OPTIONS = [
  '신규영업', '관계유지', '니즈파악', '견적제출',
  '계약협상', '계약체결', '납품협의', 'AS/클레임', '기타'
]

// 활동유형 옵션
export const ACTIVITY_TYPE_OPTIONS = [
  '방문', '전화', '이메일', '미팅(온라인)',
  '접대', '세미나/설명회', '기타'
]

// 진척도 단계 정의
export const SALES_PROGRESS_STEPS = [
  { value: '초기접촉', label: '초기접촉', order: 1 },
  { value: '니즈파악', label: '니즈파악', order: 2 },
  { value: '견적제출', label: '견적제출', order: 3 },
  { value: '계약협상', label: '계약협상', order: 4 },
  { value: '계약완료', label: '계약완료', order: 5 },
  { value: '납품완료', label: '납품완료', order: 6 },
] as const

export const SALES_SPECIAL_STATUSES = ['보류', '실패'] as const
