/**
 * 자금 상세 페이지 모달 관리 Composable
 * 모달 상태 및 핸들러를 중앙 집중화하여 관리
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FundDetail, ProgressPaymentRequest, AdvancePayment, OemPayment, AdvancePdfType } from '~/types/fund'
import { fundService } from '~/services/fund.service'
import { advancePaymentService } from '~/services/advance-payment.service'
import { baselineService } from '~/services/baseline.service'
import { formatCurrency } from '~/utils/format'

interface UseFundModalsOptions {
  /** 자금 ID (라우트에서 가져옴) */
  fundId: Ref<number>
  /** 자금 상세 정보 */
  fundDetail: ComputedRef<FundDetail | null>
  /** 선급금 상세 정보 */
  advanceDetail: ComputedRef<AdvancePayment | null>
  /** 데이터 새로고침 함수 */
  refreshData: () => Promise<void>
  /** OEM 지급 목록 갱신 함수 */
  refreshOemPayments: () => Promise<void>
}

export function useFundModals(options: UseFundModalsOptions) {
  const { fundId, fundDetail, advanceDetail, refreshData, refreshOemPayments } = options

  // ============ 기성금 모달 ============
  const showProgressPaymentModal = ref(false)

  const openProgressPaymentModal = () => {
    showProgressPaymentModal.value = true
  }

  const closeProgressPaymentModal = () => {
    showProgressPaymentModal.value = false
  }

  const handleProgressPaymentSubmitted = async () => {
    closeProgressPaymentModal()
    await refreshData()
  }

  // ============ 납품완료 모달 ============
  const showFinalDeliveryModal = ref(false)

  const openFinalDeliveryModal = () => {
    showFinalDeliveryModal.value = true
  }

  const closeFinalDeliveryModal = () => {
    showFinalDeliveryModal.value = false
  }

  const handleFinalDeliverySubmitted = async () => {
    closeFinalDeliveryModal()
    await refreshData()
  }

  // ============ 선급금 모달 ============
  const showAdvancePaymentModal = ref(false)

  const openAdvancePaymentModal = () => {
    showAdvancePaymentModal.value = true
  }

  const closeAdvancePaymentModal = () => {
    showAdvancePaymentModal.value = false
  }

  const handleAdvancePaymentSubmitted = async () => {
    closeAdvancePaymentModal()
    await refreshData()
  }

  // ============ PDF 모달 ============
  const showPdfModal = ref(false)
  const currentPdfUrl = ref('')
  const currentPdfFileName = ref('')

  const closePdfModal = () => {
    showPdfModal.value = false
    currentPdfUrl.value = ''
    currentPdfFileName.value = ''
  }

  /** 선급금 PDF 보기 */
  const viewAdvancePdf = (pdfType: AdvancePdfType) => {
    if (!advanceDetail.value) return
    currentPdfUrl.value = advancePaymentService.getPdfUrl(advanceDetail.value.advanceId, pdfType)
    currentPdfFileName.value = `${pdfType}_${advanceDetail.value.advanceId}.pdf`
    showPdfModal.value = true
  }

  /** 선급금 PDF 다운로드 */
  const downloadAdvancePdf = async (pdfType: AdvancePdfType) => {
    if (!advanceDetail.value) return
    try {
      await advancePaymentService.downloadPdf(advanceDetail.value.advanceId, pdfType)
    } catch (error) {
      console.error('PDF 다운로드 실패:', error)
      alert('PDF 다운로드에 실패했습니다.')
    }
  }

  /** 선급금 전체 PDF 다운로드 (ZIP) */
  const downloadAllAdvancePdfs = async () => {
    if (!advanceDetail.value) return
    try {
      await advancePaymentService.downloadAllPdfs(advanceDetail.value.advanceId)
    } catch (error) {
      console.error('전체 PDF 다운로드 실패:', error)
      alert('전체 PDF 다운로드에 실패했습니다.')
    }
  }

  /** 납품확인서 PDF 보기 */
  const viewConfirmationPdf = (baselineId: number | undefined) => {
    if (!baselineId) return
    currentPdfUrl.value = baselineService.getConfirmationPdfUrl(baselineId)
    currentPdfFileName.value = `납품확인서_${baselineId}.pdf`
    showPdfModal.value = true
  }

  /** 사진대지 PDF 보기 */
  const viewPhotoSheetPdf = (baselineId: number | undefined) => {
    if (!baselineId) return
    currentPdfUrl.value = baselineService.getPhotoSheetPdfUrl(baselineId)
    currentPdfFileName.value = `사진대지_${baselineId}.pdf`
    showPdfModal.value = true
  }

  // ============ 수금 확인 모달 ============
  const showCollectionConfirmModal = ref(false)
  const collectionPaymentType = ref<'advance' | 'progress' | 'balance'>('progress')
  const collectionPaymentId = ref(0)
  const collectionRequestAmount = ref(0)
  const collectionApprovedAmount = ref(0)
  const collectionAdvanceDeductionAmount = ref(0)
  const collectionActualReceivableAmount = ref(0)

  /** 잔금 입금확인 모달 열기 */
  const openBalanceConfirmModal = () => {
    if (!fundDetail.value) return

    collectionPaymentType.value = 'balance'
    collectionPaymentId.value = fundDetail.value.fundId
    collectionRequestAmount.value = fundDetail.value.outstandingAmount || 0
    collectionApprovedAmount.value = fundDetail.value.outstandingAmount || 0
    showCollectionConfirmModal.value = true
  }

  /** 수금 확인 모달 열기 */
  const openCollectionConfirmModal = (
    type: 'advance' | 'progress' | 'balance',
    payment: any
  ) => {
    collectionPaymentType.value = type

    if (type === 'advance') {
      collectionPaymentId.value = payment.advanceId
      collectionRequestAmount.value = payment.requestAmount || 0
      collectionApprovedAmount.value = payment.approvedAmount || 0
      collectionAdvanceDeductionAmount.value = 0
      collectionActualReceivableAmount.value = 0
    } else if (type === 'progress') {
      collectionPaymentId.value = payment.paymentId || payment.requestId
      collectionRequestAmount.value = payment.requestAmount || payment.amount || 0
      collectionApprovedAmount.value = 0
      collectionAdvanceDeductionAmount.value = payment.advanceDeductionAmount || 0
      collectionActualReceivableAmount.value = payment.netPaymentAmount || collectionRequestAmount.value
    } else if (type === 'balance') {
      collectionPaymentId.value = payment.balanceRequestId
      collectionRequestAmount.value = payment.requestAmount || 0
      collectionApprovedAmount.value = payment.approvedAmount || 0
      collectionAdvanceDeductionAmount.value = 0
      collectionActualReceivableAmount.value = 0
    }

    showCollectionConfirmModal.value = true
  }

  const closeCollectionConfirmModal = () => {
    showCollectionConfirmModal.value = false
  }

  /** 수금 확인 완료 처리 */
  const handleCollectionConfirmed = async (data: {
    paidAmount: number
    paymentDate: string
    bankAccount?: string
    remarks?: string
  }) => {
    try {
      if (collectionPaymentType.value === 'advance') {
        await fundService.confirmAdvance(fundId.value, collectionPaymentId.value, {
          paidAmount: data.paidAmount,
          paymentDate: data.paymentDate,
          bankAccount: data.bankAccount,
          remarks: data.remarks
        })
      } else if (collectionPaymentType.value === 'progress') {
        await fundService.confirmPayment(fundId.value, collectionPaymentId.value, {
          paidAmount: data.paidAmount,
          paymentDate: data.paymentDate,
          bankAccount: data.bankAccount,
          remarks: data.remarks
        })
      } else if (collectionPaymentType.value === 'balance') {
        await fundService.confirmBalance(fundId.value, {
          paidAmount: data.paidAmount,
          paidDate: data.paymentDate,
          bankAccount: data.bankAccount,
          remarks: data.remarks
        })
      }

      await refreshData()
    } catch (error) {
      console.error('수금 확인 처리 실패:', error)
      alert('수금 확인 처리 중 오류가 발생했습니다.')
    }
  }

  // ============ B급 조정 모달 ============
  const showBgradeModal = ref(false)

  const openBgradeModal = () => {
    showBgradeModal.value = true
  }

  const closeBgradeModal = () => {
    showBgradeModal.value = false
  }

  const handleBgradeUpdated = async () => {
    closeBgradeModal()
    await refreshData()
  }

  // ============ OEM 지급 모달 ============
  const showOemPaymentModal = ref(false)
  const selectedOemPayment = ref<OemPayment | null>(null)
  const linkedProgressPayment = ref<ProgressPaymentRequest | null>(null)

  /** OEM 지급 등록 모달 열기 */
  const openOemPaymentModal = (linkedPayment?: ProgressPaymentRequest) => {
    selectedOemPayment.value = null
    linkedProgressPayment.value = linkedPayment || null
    showOemPaymentModal.value = true
  }

  /** OEM 지급 완료 모달 열기 */
  const openOemCompleteModal = (payment: OemPayment) => {
    selectedOemPayment.value = payment
    linkedProgressPayment.value = null
    showOemPaymentModal.value = true
  }

  /** OEM 지급 삭제 확인 및 처리 */
  const confirmDeleteOemPayment = async (oem: OemPayment) => {
    if (!confirm(`${oem.paymentSeq}차 OEM 지급(${formatCurrency(oem.scheduledAmount)})을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await fundService.deleteOemPayment(fundId.value, oem.oemPaymentId)
      alert('OEM 지급이 삭제되었습니다.')
      await refreshOemPayments()
    } catch (error) {
      console.error('OEM 지급 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const closeOemPaymentModal = () => {
    showOemPaymentModal.value = false
    selectedOemPayment.value = null
    linkedProgressPayment.value = null
  }

  /** OEM 지급 완료 처리 */
  const handleOemPaymentSubmitted = async (data: {
    amount: number
    paymentDate: string
    oemCompanyName?: string
    bankAccount?: string
    remarks?: string
    isComplete: boolean
  }) => {
    try {
      if (data.isComplete && selectedOemPayment.value) {
        await fundService.confirmOemPayment(fundId.value, selectedOemPayment.value.oemPaymentId, {
          paidAmount: data.amount,
          paidDate: data.paymentDate,
          bankAccount: data.bankAccount,
          remarks: data.remarks
        })
      } else {
        await fundService.createOemPayment(fundId.value, {
          paymentType: linkedProgressPayment.value ? 'PROGRESS' : 'ADVANCE',
          paymentAmount: data.amount,
          paymentDate: data.paymentDate,
          oemCompanyName: data.oemCompanyName,
          oemCompanyId: fundDetail.value?.oemCompanyId || undefined,
          bankAccount: data.bankAccount,
          remarks: data.remarks
        })
      }

      await refreshData()
    } catch (error) {
      console.error('OEM 지급 처리 실패:', error)
      alert('OEM 지급 처리 중 오류가 발생했습니다.')
    }
  }

  return {
    // 기성금 모달
    showProgressPaymentModal,
    openProgressPaymentModal,
    closeProgressPaymentModal,
    handleProgressPaymentSubmitted,

    // 납품완료 모달
    showFinalDeliveryModal,
    openFinalDeliveryModal,
    closeFinalDeliveryModal,
    handleFinalDeliverySubmitted,

    // 선급금 모달
    showAdvancePaymentModal,
    openAdvancePaymentModal,
    closeAdvancePaymentModal,
    handleAdvancePaymentSubmitted,

    // PDF 모달
    showPdfModal,
    currentPdfUrl,
    currentPdfFileName,
    closePdfModal,
    viewAdvancePdf,
    downloadAdvancePdf,
    downloadAllAdvancePdfs,
    viewConfirmationPdf,
    viewPhotoSheetPdf,

    // 수금 확인 모달
    showCollectionConfirmModal,
    collectionPaymentType,
    collectionPaymentId,
    collectionRequestAmount,
    collectionApprovedAmount,
    collectionAdvanceDeductionAmount,
    collectionActualReceivableAmount,
    openBalanceConfirmModal,
    openCollectionConfirmModal,
    closeCollectionConfirmModal,
    handleCollectionConfirmed,

    // B급 조정 모달
    showBgradeModal,
    openBgradeModal,
    closeBgradeModal,
    handleBgradeUpdated,

    // OEM 지급 모달
    showOemPaymentModal,
    selectedOemPayment,
    linkedProgressPayment,
    openOemPaymentModal,
    openOemCompleteModal,
    confirmDeleteOemPayment,
    closeOemPaymentModal,
    handleOemPaymentSubmitted
  }
}
