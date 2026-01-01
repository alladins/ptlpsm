<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-paper-plane"></i>
          기성청구 서명 URL 발송
        </h3>
        <button class="btn-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 기본 정보 -->
        <div class="info-section">
          <div class="info-row">
            <label>납품요구번호:</label>
            <span>{{ claimData.deliveryRequestNo || '-' }}</span>
          </div>
          <div class="info-row">
            <label>수요기관:</label>
            <span>{{ claimData.demandOrganization || '-' }}</span>
          </div>
          <div class="info-row">
            <label>선택 출하:</label>
            <span>{{ claimData.shipmentIds.length }}건</span>
          </div>
          <div class="info-row">
            <label>청구금액:</label>
            <span class="amount">{{ formatCurrency(claimData.totalAmount) }}</span>
          </div>
        </div>

        <!-- 담당자 선택 리스트박스 -->
        <div class="form-section">
          <div class="recipient-grid">
            <!-- 시공사 현장소장 -->
            <div class="form-group">
              <label>시공사 현장소장</label>
              <select
                v-model="selectedSiteManagerId"
                class="form-select"
                :disabled="loading"
              >
                <option value="">{{ loading ? '로딩 중...' : '선택하세요' }}</option>
                <option
                  v-for="manager in siteManagerList"
                  :key="manager.userid"
                  :value="manager.userid"
                >
                  {{ manager.userName }} ({{ manager.phone }})
                  <template v-if="manager.companyName"> - {{ manager.companyName }}</template>
                </option>
              </select>
            </div>

            <!-- 현장감리원 -->
            <div class="form-group">
              <label>현장감리원</label>
              <select
                v-model="selectedInspectorId"
                class="form-select"
                :disabled="loading"
              >
                <option value="">{{ loading ? '로딩 중...' : '선택하세요' }}</option>
                <option
                  v-for="inspector in inspectorList"
                  :key="inspector.userid"
                  :value="inspector.userid"
                >
                  {{ inspector.userName }} ({{ inspector.phone }})
                  <template v-if="inspector.companyName"> - {{ inspector.companyName }}</template>
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- 발송 대상 요약 -->
        <div v-if="selectedManagerInfo || selectedInspectorInfo" class="form-section">
          <div class="form-group">
            <label>발송 대상 ({{ selectedCount }}명)</label>
            <div class="selected-recipients">
              <div v-if="selectedManagerInfo" class="recipient-badge contractor">
                <i class="fas fa-user-tie"></i>
                <span>현장소장: {{ selectedManagerInfo.userName }}</span>
              </div>
              <div v-if="selectedInspectorInfo" class="recipient-badge supervisor">
                <i class="fas fa-user-check"></i>
                <span>현장감리원: {{ selectedInspectorInfo.userName }}</span>
              </div>
            </div>
          </div>

          <!-- 미리보기 -->
          <div class="message-preview">
            <h4>
              <i class="fas fa-eye"></i>
              발송될 메시지 미리보기
            </h4>

            <!-- 현장소장 메시지 -->
            <div v-if="selectedManagerInfo" class="preview-content">
              <div class="preview-label">현장소장용</div>
              <p><strong>[LP LEADPOWER 기성청구]</strong></p>
              <p>{{ selectedManagerInfo.userName }}님, 안녕하세요.</p>
              <p>
                {{ claimData.deliveryRequestNo }} 건에 대한
                기성청구 서명이 필요합니다.
              </p>
              <p>■ 수요기관: {{ claimData.demandOrganization }}</p>
              <p>■ 사업명: {{ claimData.projectName }}</p>
              <p>■ 청구금액: {{ formatCurrency(claimData.totalAmount) }}</p>
              <p>아래 링크를 클릭하여 서명해 주시기 바랍니다.</p>
              <p class="preview-link">[서명 URL이 여기에 표시됩니다]</p>
              <p class="preview-note">* 링크는 발송 후 1일간 유효합니다.</p>
            </div>

            <!-- 현장감리원 메시지 -->
            <div v-if="selectedInspectorInfo" class="preview-content" :class="{ 'mt-3': selectedManagerInfo }">
              <div class="preview-label">현장감리원용</div>
              <p><strong>[LP LEADPOWER 기성청구]</strong></p>
              <p>{{ selectedInspectorInfo.userName }}님, 안녕하세요.</p>
              <p>
                {{ claimData.deliveryRequestNo }} 건에 대한
                기성청구 서명이 필요합니다.
              </p>
              <p>■ 수요기관: {{ claimData.demandOrganization }}</p>
              <p>■ 사업명: {{ claimData.projectName }}</p>
              <p>■ 청구금액: {{ formatCurrency(claimData.totalAmount) }}</p>
              <p>아래 링크를 클릭하여 서명해 주시기 바랍니다.</p>
              <p class="preview-link">[서명 URL이 여기에 표시됩니다]</p>
              <p class="preview-note">* 링크는 발송 후 1일간 유효합니다.</p>
            </div>
          </div>
        </div>

        <!-- 안내 메시지 -->
        <div class="info-notice">
          <i class="fas fa-info-circle"></i>
          <span>현장소장과 감리원 모두 서명이 완료되면 PDF가 자동 생성됩니다.</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')" :disabled="sending">
          취소
        </button>
        <button
          class="btn-send"
          @click="handleSend"
          :disabled="!canSend || sending"
        >
          <i class="fas" :class="sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
          {{ sending ? '발송 중...' : sendButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { baselineService } from '~/services/baseline.service'
import { userService } from '~/services/user.service'
import type { BaselineSignatureRecipient, BaselineCreateAndSendRequest } from '~/types/baseline'
import type { ProgressClaimData } from '~/types/fund'
import type { UserByRole } from '~/types/user'
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  claimData: ProgressClaimData
}>()

const emit = defineEmits<{
  close: []
  sent: []
}>()

const selectedSiteManagerId = ref<number | ''>('')
const selectedInspectorId = ref<number | ''>('')
const sending = ref(false)
const loading = ref(false)

// 사용자 목록 (API로부터 로드)
const siteManagerList = ref<UserByRole[]>([])
const inspectorList = ref<UserByRole[]>([])

// 선택된 담당자 정보
const selectedManagerInfo = computed(() => {
  if (!selectedSiteManagerId.value) return null
  return siteManagerList.value.find(m => m.userid === selectedSiteManagerId.value) || null
})

const selectedInspectorInfo = computed(() => {
  if (!selectedInspectorId.value) return null
  return inspectorList.value.find(i => i.userid === selectedInspectorId.value) || null
})

// 선택된 인원 수
const selectedCount = computed(() => {
  let count = 0
  if (selectedManagerInfo.value) count++
  if (selectedInspectorInfo.value) count++
  return count
})

// 발송 가능 여부 (최소 1명 선택)
const canSend = computed(() => {
  return selectedCount.value > 0
})

// 발송 버튼 텍스트
const sendButtonText = computed(() => {
  if (selectedCount.value === 0) return 'URL 발송'
  if (selectedCount.value === 1) return 'URL 발송'
  return `URL 발송 (${selectedCount.value}명)`
})

// 모달 오픈 시 사용자 목록 로드
onMounted(async () => {
  loading.value = true
  try {
    // 역할별 사용자 조회 (SITE_MANAGER + SITE_INSPECTOR)
    const users = await userService.getUsersByRoles(['SITE_MANAGER', 'SITE_INSPECTOR'])

    // 역할별로 분리
    siteManagerList.value = users.filter(u => u.role === 'SITE_MANAGER')
    inspectorList.value = users.filter(u => u.role === 'SITE_INSPECTOR')
  } catch (error) {
    console.error('Failed to load users:', error)
    alert('사용자 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
})

async function handleSend() {
  if (!canSend.value) return

  sending.value = true

  try {
    // 수신자 배열 구성
    const recipients: BaselineSignatureRecipient[] = []

    // 현장소장 추가
    if (selectedManagerInfo.value) {
      recipients.push({
        recipientType: 'SITE_MANAGER',
        recipientUserId: selectedManagerInfo.value.userid,
        recipientName: selectedManagerInfo.value.userName,
        recipientPhone: selectedManagerInfo.value.phone.replace(/[^0-9]/g, '')
      })
    }

    // 현장감리원 추가
    if (selectedInspectorInfo.value) {
      recipients.push({
        recipientType: 'SITE_INSPECTOR',
        recipientUserId: selectedInspectorInfo.value.userid,
        recipientName: selectedInspectorInfo.value.userName,
        recipientPhone: selectedInspectorInfo.value.phone.replace(/[^0-9]/g, '')
      })
    }

    // 통합 API 호출 (기성 생성 + 서명 URL 발송)
    const request: BaselineCreateAndSendRequest = {
      orderId: props.claimData.orderId,
      baselineType: 'PROGRESS',
      shipmentIds: props.claimData.shipmentIds,
      remarks: props.claimData.remarks,
      recipients,
      messageType: 'LMS'
    }

    await baselineService.createAndSendSignature(request)

    // 성공 메시지
    const names = recipients.map(r => r.recipientName).join(', ')
    alert(`기성청구가 생성되고 서명 URL이 ${names}님에게 발송되었습니다.`)
    emit('sent')
  } catch (error) {
    console.error('Failed to create and send signature URL:', error)
    alert(error instanceof Error ? error.message : '기성청구 생성 및 메시지 발송 중 오류가 발생했습니다.')
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
}

.btn-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.info-section {
  background: #f9fafb;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row label {
  font-weight: 600;
  width: 120px;
  color: #6b7280;
}

.info-row span {
  color: #1f2937;
}

.info-row .amount {
  font-weight: 700;
  color: #2563eb;
}

.form-section {
  margin-top: 20px;
}

.recipient-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.selected-recipients {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.recipient-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.recipient-badge.contractor {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.recipient-badge.supervisor {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.recipient-badge i {
  font-size: 16px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.mt-3 {
  margin-top: 15px;
}

/* .form-select - admin-forms.css에서 import됨 */

.message-preview {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.message-preview h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-content {
  background: #f9fafb;
  padding: 15px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

.preview-content p {
  margin: 8px 0;
}

.preview-link {
  color: #2563eb;
  font-style: italic;
}

.preview-note {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 12px;
}

.info-notice {
  margin-top: 20px;
  padding: 12px 15px;
  background: #fef3c7;
  border: 1px solid #fde047;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #92400e;
}

.info-notice i {
  font-size: 16px;
  color: #d97706;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-send {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-send {
  background: #2563eb;
  color: white;
}

.btn-send:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-send:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .recipient-grid {
    grid-template-columns: 1fr;
  }
}
</style>
