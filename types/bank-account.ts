/**
 * 계좌 조회 관련 타입 정의
 * 바로빌 API 연동
 */

// 계좌 정보
export interface BankAccount {
  bankCode: string
  bankName: string
  bankAccountNum: string
  bankAccountNumMasked: string
  bankAccountType: string
  bankAccountTypeName: string
  alias: string
  balance: number
  status: string
  collectCycle: string
  collectCycleName: string
  lastCollectDate: string
}

// 계좌 상세
export interface BankAccountDetail extends BankAccount {
  usage: string
  registDate: string
}

// 거래내역
export interface Transaction {
  transRefKey: string
  transDate: string
  transTime: string
  transDateTime: string
  transType: string
  transTypeCode: string
  amount: number
  balance: number
  counterpartName: string
  counterpartAccountNum: string
  description: string
  memo: string
  bankAccountNum: string
}

// 거래내역 응답
export interface TransactionResponse {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  transactions: Transaction[]
}

// API 응답 래퍼
export interface BankApiResponse<T> {
  success: boolean
  data: T
  message: string | null
  errorCode?: string
}

// 거래내역 조회 파라미터
export interface TransactionSearchParams {
  startDate: string       // YYYYMMDD
  endDate: string         // YYYYMMDD
  transDirection?: number // 1:전체, 2:입금, 3:출금
  page?: number
  size?: number
  orderDirection?: number // 1:오래된순, 2:최신순
}

// 일별 거래내역 조회 파라미터
export interface DailyTransactionParams {
  baseDate: string        // YYYYMMDD
  transDirection?: number
  page?: number
  size?: number
}

// 월별 거래내역 조회 파라미터
export interface MonthlyTransactionParams {
  baseMonth: string       // YYYYMM
  transDirection?: number
  page?: number
  size?: number
}

// 은행 코드
export const BANK_CODES: Record<string, string> = {
  '004': '국민은행',
  '011': '농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '027': '한국씨티은행',
  '031': '대구은행',
  '032': '부산은행',
  '034': '광주은행',
  '035': '제주은행',
  '037': '전북은행',
  '039': '경남은행',
  '045': '새마을금고',
  '048': '신협',
  '071': '우체국',
  '081': '하나은행',
  '088': '신한은행',
  '089': '케이뱅크',
  '090': '카카오뱅크',
  '092': '토스뱅크'
}

// 거래 구분 옵션
export const TRANS_DIRECTION_OPTIONS = [
  { value: 1, label: '전체' },
  { value: 2, label: '입금' },
  { value: 3, label: '출금' }
]

// 정렬 방향 옵션
export const ORDER_DIRECTION_OPTIONS = [
  { value: 2, label: '최신순' },
  { value: 1, label: '오래된순' }
]

// 에러 메시지
export const BANK_ERROR_MESSAGES: Record<string, string> = {
  '-32001': '인증키가 유효하지 않습니다.',
  '-32002': '사업자번호가 올바르지 않습니다.',
  '-32003': '계좌번호가 올바르지 않습니다.',
  '-32004': '조회기간이 올바르지 않습니다.',
  '-32005': '권한이 없습니다.'
}
