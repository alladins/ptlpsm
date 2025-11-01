<template>
  <div
    class="signature-canvas-wrapper"
    @touchstart.stop
    @touchmove.prevent.stop
  >
    <canvas
      ref="canvasRef"
      class="signature-canvas"
      :class="{ 'canvas-disabled': isSaved }"
      @touchstart.prevent="startDrawing"
      @touchmove.prevent="draw"
      @touchend="stopDrawing"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>

    <div class="signature-status" v-if="isSaved">
      <i class="fas fa-check-circle"></i>
      서명이 저장되었습니다
    </div>

    <div class="signature-actions">
      <button
        class="btn-clear"
        @click="clearSignature"
        :disabled="isSaved"
        type="button"
      >
        <i class="fas fa-eraser"></i>
        지우기
      </button>
      <button
        class="btn-save"
        @click="saveSignature"
        :disabled="!hasDrawing || isSaved"
        type="button"
      >
        <i class="fas fa-save"></i>
        {{ isSaved ? '저장됨' : '서명 저장' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
  save: [blob: Blob]
}>()

// Refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasDrawing = ref(false)
const isSaved = ref(false)

let ctx: CanvasRenderingContext2D | null = null
let lastX = 0
let lastY = 0

// 캔버스 초기화
onMounted(() => {
  if (!canvasRef.value) return

  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')

  if (!ctx) return

  // 캔버스 크기 설정 (레티나 디스플레이 대응)
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx.scale(dpr, dpr)

  // 스타일 설정
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#000000'

  // 배경을 흰색으로 (투명 배경 방지)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
})

// 좌표 가져오기 (터치/마우스 통합)
const getPosition = (e: TouchEvent | MouseEvent): { x: number; y: number } => {
  if (!canvasRef.value) return { x: 0, y: 0 }

  const rect = canvasRef.value.getBoundingClientRect()

  if (e instanceof TouchEvent && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    }
  } else if (e instanceof MouseEvent) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  return { x: 0, y: 0 }
}

// 그리기 시작
const startDrawing = (e: TouchEvent | MouseEvent) => {
  if (!ctx || isSaved.value) return

  // 서명 중 페이지 스크롤 방지
  document.body.style.overflow = 'hidden'

  isDrawing.value = true
  hasDrawing.value = true

  const pos = getPosition(e)
  lastX = pos.x
  lastY = pos.y

  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

// 그리기
const draw = (e: TouchEvent | MouseEvent) => {
  if (!isDrawing.value || !ctx || isSaved.value) return

  const pos = getPosition(e)

  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()

  lastX = pos.x
  lastY = pos.y
}

// 그리기 종료
const stopDrawing = () => {
  if (!ctx) return

  // 페이지 스크롤 복원
  document.body.style.overflow = ''

  isDrawing.value = false
  ctx.closePath()
}

// 서명 지우기
const clearSignature = () => {
  if (!ctx || !canvasRef.value) return

  // 저장된 서명 삭제 시 확인
  if (isSaved.value) {
    const confirmed = confirm('저장된 서명을 삭제하고 다시 작성하시겠습니까?')
    if (!confirmed) return
  }

  const canvas = canvasRef.value

  // 배경을 다시 흰색으로
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  hasDrawing.value = false
  isSaved.value = false
}

// 서명 저장
const saveSignature = async () => {
  if (!canvasRef.value || !hasDrawing.value) return

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvasRef.value!.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('서명 이미지 변환 실패'))
        }
      }, 'image/png')
    })

    // 부모 컴포넌트가 서버 응답 후 markAsSaved()를 호출할 때까지 대기
    emit('save', blob)
  } catch (error) {
    console.error('서명 저장 실패:', error)
    alert('서명 저장에 실패했습니다.')
  }
}

// 외부에서 저장 완료 상태로 변경
const markAsSaved = () => {
  isSaved.value = true
}

// 외부에서 서명 여부 확인용
const hasSignature = () => {
  return isSaved.value
}

// Expose
defineExpose({
  hasSignature,
  clearSignature,
  markAsSaved
})

// 클린업
onBeforeUnmount(() => {
  ctx = null
})
</script>

<style scoped>
.signature-canvas-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  touch-action: none; /* wrapper 전체에서 터치 스크롤 방지 */
}

.signature-canvas {
  width: 100%;
  height: 200px;
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  background: white;
  touch-action: none; /* 터치 스크롤 방지 */
  cursor: crosshair;
  transition: opacity 0.2s, filter 0.2s;
}

.signature-canvas.canvas-disabled {
  pointer-events: none; /* 모든 이벤트 차단 */
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.3);
}

.signature-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 0.375rem;
  font-weight: 500;
}

.signature-status i {
  font-size: 1.25rem;
}

.signature-actions {
  display: flex;
  gap: 0.75rem;
}

.signature-actions button {
  flex: 1;
  padding: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-clear {
  background: #f3f4f6;
  color: #374151;
}

.btn-clear:hover {
  background: #e5e7eb;
}

.btn-clear:active {
  background: #d1d5db;
}

.btn-save {
  background: #2563eb;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
}

.btn-save:active:not(:disabled) {
  transform: translateY(0);
}

.btn-save:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 터치 디바이스 최적화 */
@media (hover: none) {
  .signature-canvas {
    cursor: default;
  }

  .btn-save:active:not(:disabled) {
    background: #1e40af;
  }
}

/* 작은 화면 대응 */
@media (max-width: 640px) {
  .signature-canvas {
    height: 180px;
  }

  .signature-actions {
    flex-direction: column;
  }

  .signature-actions button {
    width: 100%;
  }
}
</style>
