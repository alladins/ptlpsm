/**
 * 이미지 압축 유틸리티
 * 모바일 환경에서 사진 업로드 전 이미지 크기 최적화
 */

export interface CompressOptions {
  maxWidth?: number       // 최대 너비 (기본: 1920)
  maxHeight?: number      // 최대 높이 (기본: 1440)
  quality?: number        // JPEG 품질 0-1 (기본: 0.75)
  maxSizeBytes?: number   // 압축 필요 기준 크기 (기본: 1MB)
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1440,
  quality: 0.75,
  maxSizeBytes: 1 * 1024 * 1024  // 1MB
}

/**
 * 이미지를 로드하여 Image 객체 반환
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('이미지 로드 실패'))

      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

/**
 * Canvas를 사용하여 이미지 압축
 */
function compressWithCanvas(
  img: HTMLImageElement,
  fileName: string,
  options: Required<CompressOptions>
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // 비율 유지하면서 리사이징
      if (width > options.maxWidth || height > options.maxHeight) {
        const ratio = Math.min(
          options.maxWidth / width,
          options.maxHeight / height
        )
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 컨텍스트 생성 실패'))
        return
      }

      // 흰색 배경 (투명 PNG 대응)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height)

      // JPEG로 압축
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 압축 실패'))
            return
          }

          // 파일명에서 확장자 제거 후 .jpg 추가
          const baseName = fileName.replace(/\.[^/.]+$/, '')
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          resolve(compressedFile)
        },
        'image/jpeg',
        options.quality
      )
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 조건부 이미지 압축
 * - 파일 크기가 maxSizeBytes 초과 또는
 * - 해상도가 maxWidth/maxHeight 초과 시 압축
 * - 조건에 해당하지 않으면 원본 반환
 *
 * @param file - 원본 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 파일 또는 원본 파일
 */
export async function compressImageIfNeeded(
  file: File,
  options?: CompressOptions
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 이미지 파일이 아니면 원본 반환
  if (!file.type.startsWith('image/')) {
    return file
  }

  // 파일 크기가 작으면 이미지 로드하여 해상도 확인
  if (file.size <= opts.maxSizeBytes) {
    try {
      const img = await loadImage(file)

      // 해상도도 작으면 원본 반환
      if (img.width <= opts.maxWidth && img.height <= opts.maxHeight) {
        console.log(`[이미지 압축] 원본 유지: ${file.name} (${formatFileSize(file.size)}, ${img.width}x${img.height})`)
        return file
      }

      // 해상도가 크면 리사이징
      console.log(`[이미지 압축] 리사이징: ${file.name} (${img.width}x${img.height} → ${opts.maxWidth}x${opts.maxHeight})`)
      return compressWithCanvas(img, file.name, opts)
    } catch (error) {
      console.error('[이미지 압축] 처리 실패, 원본 반환:', error)
      return file
    }
  }

  // 파일 크기가 크면 압축 실행
  try {
    const img = await loadImage(file)
    const originalSize = file.size

    const compressedFile = await compressWithCanvas(img, file.name, opts)

    console.log(
      `[이미지 압축] 완료: ${file.name}`,
      `(${formatFileSize(originalSize)} → ${formatFileSize(compressedFile.size)},`,
      `${img.width}x${img.height} → ${opts.maxWidth}x${opts.maxHeight},`,
      `감소율: ${Math.round((1 - compressedFile.size / originalSize) * 100)}%)`
    )

    return compressedFile
  } catch (error) {
    console.error('[이미지 압축] 처리 실패, 원본 반환:', error)
    return file
  }
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
