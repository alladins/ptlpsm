<template>
  <!--
    OEM 지급요청서 (서류) — 2026-09-22 고객 요청
    «지급요청을 누르면 서류 형태로 보여주고, 확인 후 제출하게» + «반려 사유대로 영수증을 올릴 수 있게»

    mode
      - create : 제조사가 [지급요청] 을 눌렀을 때. 입금 계좌·비고 입력, 첨부 올리기, [지급요청 제출]
      - view   : 제출된 서류 보기 (리드파워·제조사 공통). 첨부 내려받기만
    ★ 금액은 화면에서 계산하지 않는다. 원장 응답(ledger)의 값을 그대로 쓴다 — 서버가 청구액을 다시 계산하므로
      여기서 따로 더하면 서류와 실제 청구액이 갈라진다.
  -->
  <Teleport to="body">
    <div v-if="show" class="doc-overlay">
      <div class="doc-modal">
        <div class="doc-modal-head">
          <span><i class="fas fa-file-invoice" /> 지급요청서 {{ mode === 'create' ? '작성' : '보기' }}</span>
          <button class="doc-close" @click="$emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="doc-modal-body">
          <div v-if="loading" class="doc-loading">
            <i class="fas fa-spinner fa-spin" /> 불러오는 중...
          </div>

          <!-- ===== 서류 ===== -->
          <div v-else class="doc-paper">
            <!--
              반려 사유 — 서류 맨 위에 둔다.
                create: 지난 요청이 반려됐으면 «무엇을 보완할지» 를 서류 안에서 바로 보이게 (고객 요청 2026-09-22)
                view(이력): 반려된 차수의 서류면 왜 돌아갔는지
            -->
            <div v-if="rejectBox" class="doc-reject">
              <i class="fas fa-circle-exclamation" />
              <div>
                <strong>{{ rejectBox.title }}</strong>
                <p>{{ rejectBox.reason }}</p>
                <span>{{ rejectBox.meta }}</span>
              </div>
            </div>

            <h1 class="doc-title">
              지 급 요 청 서
            </h1>
            <p v-if="history" class="doc-seq">
              {{ history.seq }}차 요청
            </p>

            <table class="doc-meta">
              <tbody>
                <tr>
                  <th>청구월</th>
                  <td>{{ yearMonthLabel }}</td>
                  <th>요청일</th>
                  <td>{{ requestDateLabel }}</td>
                </tr>
                <tr v-if="mode === 'view'">
                  <th>상태</th>
                  <td colspan="3">
                    <span class="doc-status" :class="`st-${viewStatus}`">{{ statusLabel }}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="doc-parties">
              <div class="doc-party">
                <div class="party-label">
                  수 신
                </div>
                <div class="party-name">
                  주식회사 리드파워 귀하
                </div>
              </div>
              <div class="doc-party">
                <div class="party-label">
                  발 신
                </div>
                <div class="party-name">
                  {{ info?.companyName || ledger?.oemCompanyName || '-' }}
                </div>
                <div class="party-line">
                  사업자등록번호 {{ formatBizNo(info?.businessNumber) }} · 대표 {{ info?.representative || '-' }}
                </div>
                <div class="party-line">
                  {{ [info?.address, info?.detailAddress].filter(Boolean).join(' ') || '-' }}
                </div>
                <div class="party-line">
                  요청자 {{ requesterLabel }}
                </div>
              </div>
            </div>

            <p class="doc-lead">
              아래와 같이 {{ yearMonthLabel }} 발주분 대금의 지급을 요청합니다.
            </p>

            <!-- 청구 내역 -->
            <h2 class="doc-h2">
              1. 청구 내역
            </h2>
            <table class="doc-table">
              <tbody>
                <tr>
                  <th>발주 합계 ({{ ledger?.items?.length || 0 }}건)</th>
                  <td class="num">
                    {{ formatCurrency(ledger?.totalAmount ?? 0) }}
                  </td>
                </tr>
                <tr v-if="(ledger?.shippingChargeTotal ?? 0) > 0">
                  <th>운송비 ({{ ledger?.shippingCharges?.length || 0 }}건)</th>
                  <td class="num">
                    + {{ formatCurrency(ledger?.shippingChargeTotal ?? 0) }}
                  </td>
                </tr>
                <tr v-if="(ledger?.processingChargeTotal ?? 0) > 0">
                  <th>가공비 ({{ ledger?.processingCharges?.length || 0 }}건)</th>
                  <td class="num">
                    + {{ formatCurrency(ledger?.processingChargeTotal ?? 0) }}
                  </td>
                </tr>
                <tr v-if="(ledger?.lossDeductionTotal ?? 0) > 0">
                  <th>손실 차감 ({{ ledger?.lossDeductions?.length || 0 }}건)</th>
                  <td class="num minus">
                    − {{ formatCurrency(ledger?.lossDeductionTotal ?? 0) }}
                  </td>
                </tr>
                <tr class="sub">
                  <th>공급가액</th>
                  <td class="num">
                    {{ formatCurrency(ledger?.payableAmount ?? ledger?.totalAmount ?? 0) }}
                  </td>
                </tr>
                <tr>
                  <th>부가세 (10%)</th>
                  <td class="num">
                    {{ formatCurrency(ledger?.vatAmount ?? 0) }}
                  </td>
                </tr>
                <tr class="grand">
                  <th>청구 금액 (부가세 포함)</th>
                  <td class="num">
                    {{ formatCurrency(ledger?.totalWithVat ?? 0) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 발주 명세 -->
            <h2 class="doc-h2">
              2. 발주 명세
            </h2>
            <table class="doc-table doc-items">
              <thead>
                <tr>
                  <th>No</th>
                  <th>발주서번호</th>
                  <th>발주일</th>
                  <th>규격</th>
                  <th class="num">
                    수량
                  </th>
                  <th class="num">
                    원가
                  </th>
                  <th class="num">
                    금액
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in ledger?.items || []" :key="`${it.poId}-${it.skuId}-${i}`">
                  <td>{{ i + 1 }}</td>
                  <td>{{ it.poNo }}</td>
                  <td>{{ it.orderDate }}</td>
                  <td class="spec">
                    {{ it.spec }}
                  </td>
                  <td class="num">
                    {{ formatNumber(it.quantity) }}
                  </td>
                  <td class="num">
                    {{ formatNumber(it.unitCost) }}
                  </td>
                  <td class="num">
                    {{ formatNumber(it.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 입금 계좌 -->
            <h2 class="doc-h2">
              3. 입금 계좌
            </h2>
            <div v-if="mode === 'create'" class="doc-bank-inputs">
              <input v-model="form.bankName" class="doc-input" placeholder="은행 (예: 국민은행)">
              <input v-model="form.bankAccountNo" class="doc-input" placeholder="계좌번호 (예: 123-456-789012)">
              <input v-model="form.bankAccountHolder" class="doc-input" placeholder="예금주">
              <p v-if="info?.lastBankAccountNo" class="doc-hint">
                지난 요청 때 입력한 계좌를 미리 채웠습니다. 바뀌었으면 고쳐 주세요.
              </p>
            </div>
            <p v-else class="doc-text">
              {{ bankLabel }}
            </p>

            <!-- 비고 -->
            <h2 class="doc-h2">
              4. 비고
            </h2>
            <textarea
              v-if="mode === 'create'"
              v-model="form.remarks"
              class="doc-input doc-textarea"
              placeholder="전달할 내용이 있으면 적어 주세요 (예: 반려 사유의 영수증 3건 첨부했습니다)"
            />
            <p v-else class="doc-text">
              {{ viewRemarks || '-' }}
            </p>

            <!-- 첨부 -->
            <h2 class="doc-h2">
              5. 첨부파일
            </h2>
            <ul v-if="attachments.length > 0" class="doc-attachments">
              <li v-for="a in attachments" :key="a.attachmentId">
                <i class="fas fa-paperclip" />
                <button class="doc-link" type="button" @click="download(a)">
                  {{ a.originalName }}
                </button>
                <span class="att-meta">{{ formatSize(a.fileSize) }} · {{ a.uploadedByName || a.uploadedBy || '' }}</span>
                <button
                  v-if="canEditAttachments"
                  class="att-delete"
                  type="button"
                  title="삭제"
                  @click="removeAttachment(a)"
                >
                  <i class="fas fa-trash" />
                </button>
              </li>
            </ul>
            <p v-else class="doc-text muted">
              첨부파일 없음
            </p>
            <div v-if="canEditAttachments" class="doc-upload">
              <label class="doc-upload-btn">
                <i :class="uploading ? 'fas fa-spinner fa-spin' : 'fas fa-upload'" />
                {{ uploading ? '올리는 중...' : '파일 추가 (영수증 등)' }}
                <input type="file" multiple hidden :disabled="uploading" @change="onFiles">
              </label>
              <span class="doc-hint">PDF·이미지·엑셀·한글·워드·ZIP, 파일당 20MB</span>
            </div>
            <p v-else-if="mode === 'view' && isOem && !history && ledger?.paymentStatus !== 'NONE'" class="doc-hint">
              접수된 요청은 첨부를 바꿀 수 없습니다. 요청을 취소하거나 반려되면 다시 올릴 수 있습니다.
            </p>

            <div class="doc-sign">
              {{ requestDateLabel }}<br>
              <strong>{{ info?.companyName || ledger?.oemCompanyName || '' }}</strong>
            </div>
          </div>
        </div>

        <div class="doc-modal-foot">
          <button class="btn-action" @click="$emit('close')">
            {{ mode === 'create' ? '취소' : '닫기' }}
          </button>
          <button
            v-if="mode === 'create'"
            class="btn-action btn-primary"
            :disabled="submitting || uploading || loading"
            @click="submit"
          >
            <i :class="submitting ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'" />
            지급요청 제출
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { oemLedgerService } from '~/services/oem-ledger.service'
import type { OemMonthlyLedgerResponse, OemPaymentDocumentInfo, OemPaymentAttachment, OemPaymentRequestHistory } from '~/types/oem-ledger'
import { formatCurrency, formatNumber, formatDateTime, getLocalDateString } from '~/utils/format'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  show: boolean
  mode: 'create' | 'view'
  oemCompanyId: number | null
  yearMonth: string
  ledger: OemMonthlyLedgerResponse | null
  isOem: boolean
  /** 이력(차수) 서류 보기 — 있으면 그 차수의 계좌·비고·첨부·상태로 보여준다 */
  history?: OemPaymentRequestHistory | null
}>()

const emit = defineEmits<{
  close: []
  submitted: []
}>()

const authStore = useAuthStore()
const loading = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const info = ref<OemPaymentDocumentInfo | null>(null)
const attachments = ref<OemPaymentAttachment[]>([])
const form = ref({ bankName: '', bankAccountNo: '', bankAccountHolder: '', remarks: '' })

const yearMonthLabel = computed(() => {
  const [y, m] = (props.yearMonth || '').split('-')
  return y && m ? `${y}년 ${Number(m)}월` : props.yearMonth
})
/**
 * 보기 모드의 내용 출처
 *   history 가 있으면 그 차수(반려분 포함)의 서류, 없으면 지금 살아 있는 청구(원장 응답)
 * ★ 금액(청구 내역·발주 명세)은 두 경우 모두 원장 응답을 쓴다 — 청구액은 원장에서 다시 계산되는 값이라
 *   차수마다 따로 저장하지 않는다(차수별 청구 공급가액은 이력 목록에 따로 보인다).
 */
const viewStatus = computed(() => props.history?.status || props.ledger?.paymentStatus || 'NONE')
const viewRemarks = computed(() => props.history ? props.history.remarks : props.ledger?.requestRemarks)

const requestDateLabel = computed(() => {
  const at = props.history?.createdAt || (props.mode === 'view' ? props.ledger?.requestedAt : null)
  if (props.mode === 'view' && at) {
    return formatDateTime(at).slice(0, 13)
  }
  const d = getLocalDateString()
  const [y, m, day] = d.split('-')
  return `${y}. ${m}. ${day}.`
})
const requesterLabel = computed(() => {
  if (props.history) { return props.history.createdByName || props.history.createdBy || '-' }
  if (props.mode === 'view') {
    return props.ledger?.requestedByName || props.ledger?.requestedBy || '-'
  }
  return authStore.user?.userName || authStore.user?.loginId || '-'
})
const bankLabel = computed(() => {
  const s = props.history || props.ledger
  if (!s?.bankAccountNo) { return '입력하지 않음' }
  return [s.bankName, s.bankAccountNo, s.bankAccountHolder ? `예금주 ${s.bankAccountHolder}` : ''].filter(Boolean).join(' · ')
})
const statusLabel = computed(() => ({
  NONE: '미요청', PENDING: '요청완료(확인 대기)', CONFIRMED: '확인완료', PAID: '지급완료', REJECTED: '반려'
} as Record<string, string>)[viewStatus.value] || '-')

/** 서류 맨 위 반려 안내 — 작성 시엔 «지난 요청» 의 사유, 이력 보기에선 그 차수의 사유 */
const rejectBox = computed(() => {
  if (props.history?.status === 'REJECTED') {
    return {
      title: '이 요청은 반려되었습니다',
      reason: props.history.rejectReason || '-',
      meta: `${props.history.rejectedBy || ''} · ${props.history.rejectedAt ? formatDateTime(props.history.rejectedAt) : ''}`
    }
  }
  if (props.mode === 'create' && props.ledger?.lastRejectReason) {
    return {
      title: '지난 요청이 반려되었습니다 — 아래 사유를 보완해 다시 제출해 주세요',
      reason: props.ledger.lastRejectReason,
      meta: `${props.ledger.lastRejectedBy || ''} · ${props.ledger.lastRejectedAt ? formatDateTime(props.ledger.lastRejectedAt) : ''}`
    }
  }
  return null
})

/** 첨부를 올리고 지울 수 있는가 — 서버 규칙과 같다(살아 있는 청구가 없을 때만). 이력 서류는 읽기 전용 */
const canEditAttachments = computed(() =>
  !props.history && props.isOem && (props.mode === 'create' || props.ledger?.paymentStatus === 'NONE'))

watch(() => props.show, async (open) => {
  if (!open) { return }
  loading.value = true
  try {
    const [docInfo, files] = await Promise.all([
      oemLedgerService.getDocumentInfo(props.oemCompanyId),
      // 이력 서류는 «그 차수 제출 당시 첨부» 를 이미 들고 온다
      props.history
        ? Promise.resolve(props.history.attachments || [])
        : oemLedgerService.listAttachments(props.oemCompanyId, props.yearMonth)
    ])
    info.value = docInfo
    attachments.value = files
    if (props.mode === 'create') {
      form.value = {
        bankName: docInfo.lastBankName || '',
        bankAccountNo: docInfo.lastBankAccountNo || '',
        bankAccountHolder: docInfo.lastBankAccountHolder || docInfo.companyName || '',
        remarks: ''
      }
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : '지급요청서 정보를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
})

async function onFiles (event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (files.length === 0) { return }
  uploading.value = true
  try {
    for (const f of files) {
      const saved = await oemLedgerService.uploadAttachment(props.oemCompanyId, props.yearMonth, f)
      attachments.value.push(saved)
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : '파일을 올리지 못했습니다.')
  } finally {
    uploading.value = false
  }
}

async function removeAttachment (a: OemPaymentAttachment) {
  if (!confirm(`«${a.originalName}» 을(를) 삭제하시겠습니까?`)) { return }
  try {
    await oemLedgerService.deleteAttachment(a.attachmentId)
    attachments.value = attachments.value.filter(x => x.attachmentId !== a.attachmentId)
  } catch (e) {
    alert(e instanceof Error ? e.message : '첨부파일을 삭제하지 못했습니다.')
  }
}

async function download (a: OemPaymentAttachment) {
  try {
    await oemLedgerService.downloadAttachment(a)
  } catch (e) {
    alert(e instanceof Error ? e.message : '첨부파일을 내려받지 못했습니다.')
  }
}

async function submit () {
  if (!props.ledger || !props.oemCompanyId) { return }
  if (!form.value.bankName.trim() || !form.value.bankAccountNo.trim()) {
    alert('입금 받을 은행과 계좌번호를 입력하세요.')
    return
  }
  const total = props.ledger.totalWithVat ?? props.ledger.payableAmount ?? props.ledger.totalAmount
  if (!confirm(`${yearMonthLabel.value} 지급요청서를 제출합니다.\n청구 금액(부가세 포함) ${formatCurrency(total)}`)) { return }
  submitting.value = true
  try {
    await oemLedgerService.createPaymentRequest({
      oemCompanyId: props.oemCompanyId,
      yearMonth: props.yearMonth,
      // 서버가 원장에서 다시 계산해 저장한다. 보내는 값은 불일치 기록용
      totalAmount: props.ledger.payableAmount ?? props.ledger.totalAmount,
      remarks: form.value.remarks.trim() || undefined,
      bankName: form.value.bankName.trim(),
      bankAccountNo: form.value.bankAccountNo.trim(),
      bankAccountHolder: form.value.bankAccountHolder.trim() || undefined
    })
    alert('지급요청서를 제출했습니다.')
    emit('submitted')
  } catch (e) {
    alert(e instanceof Error ? e.message : '지급요청을 제출하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}

function formatBizNo (v?: string | null) {
  if (!v) { return '-' }
  const d = v.replace(/\D/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : v
}

function formatSize (bytes: number) {
  if (!bytes) { return '0KB' }
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`
}
</script>

<style scoped>
.doc-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
}

.doc-modal {
  display: flex;
  flex-direction: column;
  width: min(880px, 96vw);
  max-height: 94vh;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
}

.doc-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.1rem;
  background: #1e3a5f;
  color: #fff;
  font-weight: 600;
}

.doc-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.doc-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
}

.doc-loading {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

/* 반려 안내 (서류 맨 위) */
.doc-reject {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
  padding: 0.8rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
}

.doc-reject i { margin-top: 0.15rem; }
.doc-reject strong { display: block; margin-bottom: 0.2rem; }
.doc-reject p { margin: 0 0 0.25rem; color: #7f1d1d; white-space: pre-wrap; }
.doc-reject span { font-size: 0.75rem; color: #b91c1c; }

.doc-seq {
  margin: -1rem 0 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
}

.st-REJECTED { background: #fee2e2; color: #991b1b; }

/* 종이 */
.doc-paper {
  padding: 2.4rem 2.6rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  color: #111827;
  font-size: 0.88rem;
}

.doc-title {
  margin: 0 0 1.4rem;
  text-align: center;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
}

.doc-meta {
  width: 100%;
  margin-bottom: 1.2rem;
  border-collapse: collapse;
}

.doc-meta th,
.doc-meta td {
  padding: 0.4rem 0.6rem;
  border: 1px solid #94a3b8;
}

.doc-meta th {
  width: 14%;
  background: #f8fafc;
  font-weight: 600;
}

.doc-status {
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.st-PENDING { background: #fef3c7; color: #92400e; }
.st-CONFIRMED { background: #dbeafe; color: #1e40af; }
.st-PAID { background: #dcfce7; color: #166534; }
.st-NONE { background: #f1f5f9; color: #475569; }

.doc-parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.doc-party {
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

.party-label {
  margin-bottom: 0.3rem;
  color: #64748b;
  font-size: 0.78rem;
  letter-spacing: 0.3em;
}

.party-name {
  font-size: 1rem;
  font-weight: 700;
}

.party-line {
  margin-top: 0.15rem;
  color: #374151;
  font-size: 0.8rem;
}

.doc-lead {
  margin: 0.4rem 0 1rem;
}

.doc-h2 {
  margin: 1.2rem 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
}

.doc-table th,
.doc-table td {
  padding: 0.38rem 0.6rem;
  border: 1px solid #cbd5e1;
  text-align: left;
}

.doc-table th {
  background: #f8fafc;
  font-weight: 500;
}

.doc-table .num {
  text-align: right;
  white-space: nowrap;
}

.doc-table .minus { color: #b45309; }
.doc-table tr.sub th,
.doc-table tr.sub td { font-weight: 600; }

.doc-table tr.grand th,
.doc-table tr.grand td {
  background: #eff6ff;
  font-size: 1rem;
  font-weight: 700;
}

.doc-items {
  font-size: 0.8rem;
}

.doc-items thead th {
  background: #f1f5f9;
  font-weight: 600;
}

.doc-items .spec {
  max-width: 260px;
}

.doc-bank-inputs {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 0.5rem;
}

.doc-bank-inputs .doc-hint {
  grid-column: 1 / -1;
}

.doc-input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  font-size: 0.85rem;
}

.doc-textarea {
  min-height: 70px;
  resize: vertical;
}

.doc-text {
  margin: 0;
  padding: 0.4rem 0.2rem;
  white-space: pre-wrap;
}

.doc-text.muted,
.doc-hint {
  color: #64748b;
  font-size: 0.78rem;
}

.doc-attachments {
  margin: 0;
  padding: 0;
  list-style: none;
}

.doc-attachments li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  border-bottom: 1px dashed #e2e8f0;
}

.doc-link {
  padding: 0;
  background: none;
  border: none;
  color: #1d4ed8;
  text-decoration: underline;
  cursor: pointer;
}

.att-meta {
  color: #94a3b8;
  font-size: 0.75rem;
}

.att-delete {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
}

.doc-upload {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

/* ⚠ 공통 admin-buttons.css 의 .btn-upload(파란 바탕)와 이름이 겹쳐 글자가 안 보였다 → 전용 이름 + 흰 바탕 명시 */
.doc-upload-btn {
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #1d4ed8;
  border-radius: 4px;
  color: #1d4ed8;
  font-size: 0.82rem;
  cursor: pointer;
}

.doc-sign {
  margin-top: 2rem;
  text-align: right;
  line-height: 1.8;
}

.doc-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.8rem 1.1rem;
  background: #fff;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 640px) {
  .doc-paper { padding: 1.2rem; }
  .doc-parties,
  .doc-bank-inputs { grid-template-columns: 1fr; }
}
</style>
