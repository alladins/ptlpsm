/**
 * 계좌 조회 API 엔드포인트
 * 바로빌 API 연동
 */
import { getApiBaseUrl } from '~/services/api'

const baseUrl = getApiBaseUrl()

export const BANK_ACCOUNT_ENDPOINTS = {
  /**
   * 계좌 목록 조회
   * @param availOnly - 유효계좌만 조회 (1: 유효만, 0: 전체)
   * @returns GET /common/bank-accounts?availOnly={availOnly}
   */
  list: (availOnly?: number) => {
    const params = availOnly !== undefined ? `?availOnly=${availOnly}` : ''
    return `${baseUrl}/common/bank-accounts${params}`
  },

  /**
   * 계좌 상세 조회
   * @param bankAccountNum - 계좌번호
   * @returns GET /common/bank-accounts/{bankAccountNum}
   */
  detail: (bankAccountNum: string) =>
    `${baseUrl}/common/bank-accounts/${encodeURIComponent(bankAccountNum)}`,

  /**
   * 입출금내역 조회 (기간별)
   * @param bankAccountNum - 계좌번호
   * @returns GET /common/bank-accounts/{bankAccountNum}/transactions
   */
  transactions: (bankAccountNum: string) =>
    `${baseUrl}/common/bank-accounts/${encodeURIComponent(bankAccountNum)}/transactions`,

  /**
   * 일별 입출금내역 조회
   * @param bankAccountNum - 계좌번호
   * @returns GET /common/bank-accounts/{bankAccountNum}/transactions/daily
   */
  transactionsDaily: (bankAccountNum: string) =>
    `${baseUrl}/common/bank-accounts/${encodeURIComponent(bankAccountNum)}/transactions/daily`,

  /**
   * 월별 입출금내역 조회
   * @param bankAccountNum - 계좌번호
   * @returns GET /common/bank-accounts/{bankAccountNum}/transactions/monthly
   */
  transactionsMonthly: (bankAccountNum: string) =>
    `${baseUrl}/common/bank-accounts/${encodeURIComponent(bankAccountNum)}/transactions/monthly`
} as const
