export interface Company {
    companyId: number;
    companyName: string;        // 회사명
    businessNumber: string;     // 사업자등록번호
    g2bNumber?: string;   // 나라장터등록번호
    representative: string;     // 대표자명
    address: string;           // 주소
    detailAddress: string;     // 상세주소
    zipCode: string;          // 우편번호
    tel: string;              // 전화번호
    fax: string;              // 팩스번호
    email: string;            // 이메일
    homepage: string;         // 홈페이지
    establishedDate: string;  // 설립일자 (YYYY-MM-DD)
    employeeCount: number;    // 직원수
    annualSales: number;      // 연매출액
    businessType: string;     // 업태
    businessCategory: string; // 업종
    createdAt: string;       // 등록일시
    updatedAt: string;       // 수정일시
}

export interface CompanyCreateRequest {
    companyName: string;        // 회사명 (필수)
    businessNumber: string;     // 사업자등록번호 (필수)
    g2bNumber?: string;        // 나라장터등록번호
    representative: string;     // 대표자명 (필수)
    address: string;           // 주소 (필수)
    detailAddress: string;     // 상세주소
    zipCode: string;          // 우편번호 (필수)
    tel: string;              // 전화번호 (필수)
    fax: string;              // 팩스번호
    email: string;            // 이메일 (필수)
    homepage: string;         // 홈페이지
    establishedDate: string;  // 설립일자 (YYYY-MM-DD) (필수)
    employeeCount: number;    // 직원수
    annualSales: number;      // 연매출액
    businessType: string;     // 업태 (필수)
    businessCategory: string; // 업종 (필수)
}

export interface CompanyUpdateRequest extends Partial<CompanyCreateRequest> {}
