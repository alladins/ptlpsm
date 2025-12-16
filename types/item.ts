// 품목 기본 정보
export interface Item {
    itemId: string;          // 품목 ID
    itemClassificationNumber: string  // ← 추가
    itemCd: string;          // 품목 코드
    itemNm: string;          // 품목명
    itemType: string;        // 품목 유형
    unit: string;            // 단위
    width?: number;          // 너비
    height?: number;         // 높이
    thickness?: number;      // 두께
    createdAt: string;       // 생성일시
    updatedAt: string;       // 수정일시
}

// SKU 정보
export interface ItemSku {
    skuId: number;           // SKU ID
    itemId: number;          // 품목 ID
    skuCd: string;          // SKU 코드
    skuNm: string;          // SKU 품명
    width?: number;          // 너비
    height?: number;         // 높이
    thickness?: number;      // 두께
    unitPrice: number;       // 단가 (납품단가)
    costPrice?: number;      // 원가 (OEM 계약 단가)
    createdAt: string;       // 생성일시
    updatedAt: string;       // 수정일시
}

/**
 * 원가 수정 요청
 */
export interface CostPriceUpdateRequest {
    costPrice: number;       // 새 원가
    reason: string;          // 변경 사유 (필수)
}

/**
 * 원가 변경 이력
 */
export interface CostPriceHistory {
    historyId: number;       // 이력 ID
    itemId: string;          // 품목 ID
    skuId?: string;          // SKU ID (선택)
    previousCostPrice: number; // 이전 원가
    newCostPrice: number;    // 변경 원가
    changeReason: string;    // 변경 사유
    changedAt: string;       // 변경 일시
    changedBy: string;       // 변경자
}

// 품목 선택 결과
export interface ItemSelectResult {
    itemId: number;          // 품목 ID
    itemCd: string;          // 품목 코드
    itemNm: string;          // 품목명
    itemType: string;        // 품목 유형
    skuId: number;           // SKU ID
    skuNm: string;          // SKU 품명
    specification: string;   // 규격 (너비*높이*두께)
    unit: string;           // 단위
    unitPrice: number;      // 단가
}

// 검색 조건
export interface ItemSearchParams {
    keyword?: string;        // 검색어
    itemType?: string;       // 품목 유형
    page: number;           // 페이지 번호
    size: number;           // 페이지 크기
}

// API 응답
export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}
