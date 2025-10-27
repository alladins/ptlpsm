import { ref } from 'vue'

/**
 * 파일 업로드 Composable
 * PDF 파일 업로드/검증/삭제 로직을 공통화
 */
export function useFileUpload() {
  // 선택된 파일
  const selectedFile = ref<File | null>(null)

  // 파일 input ref
  const fileInput = ref<HTMLInputElement>()

  /**
   * 파일 크기 포맷팅
   */
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * 파일 검증 및 설정
   */
  const validateAndSetFile = (file: File): boolean => {
    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.')
      return false
    }

    // 파일 형식 검증 (MIME 타입과 확장자 모두 확인)
    const validPdfTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'application/octet-stream'
    ]
    const isValidPdf = validPdfTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf')

    if (!isValidPdf) {
      alert('PDF 파일만 업로드 가능합니다.')
      return false
    }

    selectedFile.value = file
    return true
  }

  /**
   * 파일 업로드 트리거
   */
  const triggerFileUpload = () => {
    fileInput.value?.click()
  }

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
      const file = target.files[0]
      validateAndSetFile(file)
    }
  }

  /**
   * 파일 드롭 핸들러
   */
  const handleFileDrop = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  /**
   * 파일 제거
   */
  const removeFile = () => {
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }

  /**
   * 파일 다운로드 (서비스 함수 사용)
   */
  const downloadFile = async (downloadFn: () => Promise<Blob>, fileName: string) => {
    try {
      const blob = await downloadFn()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('파일 다운로드 오류:', error)
      alert('파일 다운로드에 실패했습니다.')
    }
  }

  return {
    // State
    selectedFile,
    fileInput,

    // Methods
    formatFileSize,
    validateAndSetFile,
    triggerFileUpload,
    handleFileSelect,
    handleFileDrop,
    removeFile,
    downloadFile
  }
}
