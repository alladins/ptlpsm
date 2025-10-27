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
