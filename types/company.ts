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
    sealImage?: string;       // 회사 직인 이미지 (Base64)
    sealImageFileName?: string; // 직인 파일명
}

export interface CompanyUpdateRequest extends Partial<CompanyCreateRequest> {}

/**
 * 백엔드 응답 형식 (id 필드 사용)
 * GET /api/basic/company 응답
 */
export interface CompanyInfoResponse {
  id: number                    // companyId가 아닌 id
  companyName: string
  businessNumber: string
  g2bNumber: string | null
  representative: string
  address: string
  detailAddress: string
  zipCode: string
  tel: string
  fax: string | null
  email: string
  homepage: string | null
  establishedDate: string
  employeeCount: number
  annualSales: number
  businessType: string
  businessCategory: string
  sealImagePath: string | null  // 직인 이미지 서버 경로 (존재 여부 판단용)
  sealImageUrl: string | null   // 직인 이미지 URL (하위 호환성)
  sealImageFileName: string | null // 직인 파일명
  createdAt: string
  updatedAt: string
}

/**
 * 드롭다운용 간소화 타입
 */
export interface CompanyOption {
  id: number
  companyName: string
}
