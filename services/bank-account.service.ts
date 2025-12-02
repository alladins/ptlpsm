/**
 * 계좌 조회 서비스
 * 바로빌 API 연동
 */
import { BANK_ACCOUNT_ENDPOINTS } from './api/endpoints/bank-account.endpoints'
import type {
  BankAccount,
  BankAccountDetail,
  TransactionResponse,
  BankApiResponse,
  TransactionSearchParams,
  DailyTransactionParams,
  MonthlyTransactionParams
} from '~/types/bank-account'

export const bankAccountService = {
  /**
   * 계좌 목록 조회
   * @param availOnly - 유효계좌만 조회 (1: 유효만, 0: 전체), 기본값: 1
   */
  async getAccounts(availOnly: number = 1): Promise<BankApiResponse<BankAccount[]>> {
    try {
      const response = await fetch(BANK_ACCOUNT_ENDPOINTS.list(availOnly), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('계좌 목록 조회 실패:', error)
      throw error
    }
  },

  /**
   * 계좌 상세 조회
   * @param bankAccountNum - 계좌번호
   */
  async getAccountDetail(bankAccountNum: string): Promise<BankApiResponse<BankAccountDetail>> {
    try {
      const response = await fetch(BANK_ACCOUNT_ENDPOINTS.detail(bankAccountNum), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('계좌 상세 조회 실패:', error)
      throw error
    }
  },

  /**
   * 기간별 거래내역 조회
   * @param bankAccountNum - 계좌번호
   * @param params - 검색 파라미터
   */
  async getTransactions(
    bankAccountNum: string,
    params: TransactionSearchParams
  ): Promise<BankApiResponse<TransactionResponse>> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('startDate', params.startDate)
      queryParams.append('endDate', params.endDate)
      if (params.transDirection !== undefined) {
        queryParams.append('transDirection', params.transDirection.toString())
      }
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString())
      }
      if (params.size !== undefined) {
        queryParams.append('size', params.size.toString())
      }
      if (params.orderDirection !== undefined) {
        queryParams.append('orderDirection', params.orderDirection.toString())
      }

      const url = `${BANK_ACCOUNT_ENDPOINTS.transactions(bankAccountNum)}?${queryParams.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('거래내역 조회 실패:', error)
      throw error
    }
  },

  /**
   * 일별 거래내역 조회
   * @param bankAccountNum - 계좌번호
   * @param params - 검색 파라미터
   */
  async getDailyTransactions(
    bankAccountNum: string,
    params: DailyTransactionParams
  ): Promise<BankApiResponse<TransactionResponse>> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('baseDate', params.baseDate)
      if (params.transDirection !== undefined) {
        queryParams.append('transDirection', params.transDirection.toString())
      }
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString())
      }
      if (params.size !== undefined) {
        queryParams.append('size', params.size.toString())
      }

      const url = `${BANK_ACCOUNT_ENDPOINTS.transactionsDaily(bankAccountNum)}?${queryParams.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('일별 거래내역 조회 실패:', error)
      throw error
    }
  },

  /**
   * 월별 거래내역 조회
   * @param bankAccountNum - 계좌번호
   * @param params - 검색 파라미터
   */
  async getMonthlyTransactions(
    bankAccountNum: string,
    params: MonthlyTransactionParams
  ): Promise<BankApiResponse<TransactionResponse>> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('baseMonth', params.baseMonth)
      if (params.transDirection !== undefined) {
        queryParams.append('transDirection', params.transDirection.toString())
      }
      if (params.page !== undefined) {
        queryParams.append('page', params.page.toString())
      }
      if (params.size !== undefined) {
        queryParams.append('size', params.size.toString())
      }

      const url = `${BANK_ACCOUNT_ENDPOINTS.transactionsMonthly(bankAccountNum)}?${queryParams.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('월별 거래내역 조회 실패:', error)
      throw error
    }
  }
}
