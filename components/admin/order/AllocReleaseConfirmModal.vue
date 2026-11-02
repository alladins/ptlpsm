<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="handleClose">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="alloc-release-title" @click.stop>
        <div class="modal-header">
          <h3 id="alloc-release-title">
            <i class="fas fa-exclamation-triangle" />
            대체 지정이 풀리는 출하가 있습니다
          </h3>
          <button class="modal-close" aria-label="닫기" @click="handleClose">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <p class="info-text">
            이번 {{ actionLabel }}으로 <strong>{{ becameContractNames }}</strong> 이(가) 계약 품목이 됩니다.<br>
            아래 출하는 지금까지 다른 계약 품목으로 «대신» 집계하고 있었는데,
            등록하면 <strong>실제 나간 품목 그대로</strong> 납품으로 잡힙니다.
          </p>

          <!-- 넓은 화면: 표 (한 줄 표시, 아주 좁을 때만 표 안에서 가로 스크롤) -->
          <div class="release-table-wrap">
          <table class="release-table">
            <thead>
              <tr>
                <th>출하번호</th>
                <th>출하일</th>
                <th class="text-right">
                  실제 나간 품목
                </th>
                <th class="text-right">
                  지금 집계
                </th>
                <th class="text-right">
                  등록 후 집계
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i">
                <td class="mono">
                  {{ row.shipmentNo }}
                </td>
                <td>{{ row.shipmentDate }}</td>
                <td class="text-right">
                  {{ row.shipName }} {{ formatQuantity(row.shipQty) }}㎡
                </td>
                <td class="text-right before">
                  {{ row.allocText }}
                </td>
                <td class="text-right after">
                  {{ row.shipName }} {{ formatQuantity(row.shipQty) }}㎡
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <!-- 좁은 화면: 카드 -->
          <div class="release-cards">
            <div v-for="(row, i) in rows" :key="i" class="release-card">
              <div class="card-head">
                <span class="mono">{{ row.shipmentNo }}</span>
                <span class="card-date">{{ row.shipmentDate }}</span>
              </div>
              <div class="card-line">
                <span class="card-label">실제 나간 품목</span>
                <span>{{ row.shipName }} {{ formatQuantity(row.shipQty) }}㎡</span>
              </div>
              <div class="card-line">
                <span class="card-label">지금 집계</span>
                <span class="before">{{ row.allocText }}</span>
              </div>
              <div class="card-line">
                <span class="card-label">등록 후 집계</span>
                <span class="after">{{ row.shipName }} {{ formatQuantity(row.shipQty) }}㎡</span>
              </div>
            </div>
          </div>

          <div class="note">
            <i class="fas fa-info-circle" />
            <span>
              출하 기록·금액은 바뀌지 않습니다. 납품완료·기성청구·납품확인서의 품목별 납품 수량만 바뀝니다.
              바뀐 내용은 [납품관리 → 납품완료 → 해당 건 상세 → 수량 변경 이력]에서 확인할 수 있습니다.
              납품요구 수정 화면 «납품 목록» 위 안내의 [수량 변경 이력 보기] 버튼으로도 갈 수 있습니다.
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="handleClose">
            취소
          </button>
          <button class="btn-primary" @click="handleConfirm">
            <i class="fas fa-check" />
            확인하고 {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AllocReleasePreviewItem } from '~/services/contract.service'
import { formatQuantity } from '~/utils/format'

interface Props {
  isOpen: boolean
  items: AllocReleasePreviewItem[]
  /** 'register' = 신규(변경·추가계약) 등록, 'reimport' = 같은 번호 재업로드 */
  mode?: 'register' | 'reimport'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'register'
})

const emit = defineEmits<{ confirm: []; close: [] }>()

const actionLabel = computed(() => (props.mode === 'reimport' ? '재업로드' : '계약 등록'))
const confirmLabel = computed(() => (props.mode === 'reimport' ? '업데이트' : '등록'))

/** 출하 행 단위로 묶는다 — 합지처럼 한 출하 행이 여러 계약 품목에 걸친 경우 «지금 집계»를 한 칸에 이어 쓴다 */
const rows = computed(() => {
  const map = new Map<string, {
    shipmentNo: string
    shipmentDate: string
    shipName: string
    shipQty: number
    allocs: string[]
  }>()
  for (const it of props.items) {
    const key = `${it.shipmentId}|${it.shipSkuId}`
    const shipName = it.shipSkuName || it.shipSkuId
    if (!map.has(key)) {
      map.set(key, {
        shipmentNo: it.shipmentNo,
        shipmentDate: it.shipmentDate,
        shipName,
        shipQty: Number(it.shipmentQuantity) || 0,
        allocs: []
      })
    }
    map.get(key)!.allocs.push(`${it.contractSkuName || it.contractSkuId} ${formatQuantity(Number(it.allocQuantity) || 0)}㎡`)
  }
  return [...map.values()].map(r => ({ ...r, allocText: r.allocs.join(' + ') }))
})

const becameContractNames = computed(() => {
  const names = new Set(props.items.map(it => it.shipSkuName || it.shipSkuId))
  return [...names].join(', ')
})

const handleClose = () => emit('close')
const handleConfirm = () => emit('confirm')
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: calc(100% - 32px);
  max-width: 960px;
  max-height: 90vh;
  overflow-x: hidden;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #fed7aa;
  background: #fff7ed;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #9a3412;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: #f97316;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  border-radius: 6px;
}

.modal-close:hover {
  background: #ffedd5;
}

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-text {
  margin: 0;
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.7;
}

.release-table-wrap {
  overflow-x: auto;
}

.release-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.release-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.8125rem;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
}

.release-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
  white-space: nowrap;
}

.text-right {
  text-align: right !important;
}

.mono {
  font-family: 'Consolas', 'Courier New', monospace;
}

.before {
  color: #9ca3af;
  text-decoration: line-through;
}

.after {
  color: #1d4ed8;
  font-weight: 600;
}

.release-cards {
  display: none;
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.note i {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.625rem 1.125rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

/* 좁은 화면: 표 → 카드, 버튼 세로 */
@media (max-width: 640px) {
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .release-table-wrap {
    display: none;
  }

  .release-cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .release-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.875rem;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: #1f2937;
  }

  .card-date {
    color: #6b7280;
    font-weight: 400;
  }

  .card-line {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .card-label {
    color: #6b7280;
    flex-shrink: 0;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer button {
    width: 100%;
  }
}
</style>
