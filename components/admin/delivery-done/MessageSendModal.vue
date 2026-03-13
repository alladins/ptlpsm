<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-paper-plane"></i>
          {{ modalTitle }}
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
            <span>{{ deliveryDone.deliveryRequestNo }}</span>
          </div>
          <div class="info-row">
            <label>수요기관:</label>
            <span>{{ deliveryDone.client }}</span>
          </div>
          <div class="info-row">
            <label>시공사:</label>
            <span>{{ deliveryDone.contractorCompanyName }}</span>
          </div>
        </div>

        <!-- 담당자 선택 리스트박스 -->
        <div class="form-section">
          <div class="recipient-grid" :class="{ 'single-column': documentType === 'COMPLETION' }">
            <!-- 시공사 현장소장 (납품확인서만 표시) -->
            <div class="form-group" v-if="documentType === 'CONFIRMATION'">
              <label class="required">시공사 현장소장</label>
              <select
                v-model="selectedSiteSupervisorId"
                class="form-select"
                @change="onSiteSupervisorChange"
                :disabled="loading"
              >
                <option value="">{{ loading ? '로딩 중...' : '선택하세요' }}</option>
                <option
                  v-for="supervisor in siteSupervisorList"
                  :key="supervisor.userId"
                  :value="supervisor.userId"
                >
                  {{ supervisor.userName }} ({{ supervisor.phone }})
                  <template v-if="supervisor.companyName"> - {{ supervisor.companyName }}</template>
                </option>
              </select>
            </div>

            <!-- 현장감리원 -->
            <div class="form-group">
              <label class="required">현장감리원</label>
              <select
                v-model="selectedInspectorId"
                class="form-select"
                @change="onInspectorChange"
                :disabled="loading"
              >
                <option value="">{{ loading ? '로딩 중...' : '선택하세요' }}</option>
                <option
                  v-for="inspector in inspectorList"
                  :key="inspector.userId"
                  :value="inspector.userId"
                >
                  {{ inspector.userName }} ({{ inspector.phone }})
                  <template v-if="inspector.companyName"> - {{ inspector.companyName }}</template>
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- 발송 대상 요약 -->
        <div v-if="selectedSupervisorInfo || selectedInspectorInfo" class="form-section">
          <div class="form-group">
            <label>발송 대상 ({{ selectedCount }}명)</label>
            <div class="selected-recipients">
              <div v-if="selectedSupervisorInfo" class="recipient-badge contractor">
                <i class="fas fa-user-tie"></i>
                <span>현장소장: {{ selectedSupervisorInfo.userName }}</span>
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

            <!-- 템플릿 로딩 중 -->
            <div v-if="templateLoading" class="preview-content preview-loading">
              <i class="fas fa-spinner fa-spin"></i> 템플릿 로딩 중...
            </div>

            <!-- 현장소장 메시지 -->
            <div v-if="selectedSupervisorInfo && !templateLoading" class="preview-content">
              <div class="preview-label">현장소장용</div>
              <pre class="preview-text">{{ supervisorPreviewText }}</pre>
            </div>

            <!-- 현장감리원 메시지 -->
            <div v-if="selectedInspectorInfo && !templateLoading" class="preview-content" :class="{ 'mt-3': selectedSupervisorInfo }">
              <div class="preview-label">현장감리원용</div>
              <pre class="preview-text">{{ inspectorPreviewText }}</pre>
            </div>
          </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { sendSignatureUrl } from '~/services/delivery-done.service'
import { userService } from '~/services/user.service'
import { getMessageTemplateByCode } from '~/services/message-template.service'
import type { DeliveryDoneListItem, SignatureRecipient } from '~/types/delivery-done'
import type { UserByRole } from '~/types/user'
import type { MessageTemplate } from '~/types/message-template'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
  documentType: 'CONFIRMATION' | 'COMPLETION'  // 납품확인서 | 납품완료계
}>()

const emit = defineEmits<{
  close: []
  sent: []
}>()

const selectedSiteSupervisorId = ref<number | ''>('')
const selectedInspectorId = ref<number | ''>('')
const sending = ref(false)
const loading = ref(false)

// 템플릿 관련
const templateLoading = ref(false)
const siteManagerTemplate = ref<MessageTemplate | null>(null)
const inspectorTemplate = ref<MessageTemplate | null>(null)

// 템플릿 변수 치환 함수
function replaceTemplateVariables(content: string, recipientName: string): string {
  return content
    .replace(/\{\{supervisorName\}\}/g, recipientName)
    .replace(/\{\{inspectorName\}\}/g, recipientName)
    .replace(/\{\{deliveryRequestNo\}\}/g, props.deliveryDone.deliveryRequestNo || '')
    .replace(/\{\{contractNo\}\}/g, props.deliveryDone.contractNo || '')
    .replace(/\{\{client\}\}/g, props.deliveryDone.client || '')
    .replace(/\{\{projectName\}\}/g, props.deliveryDone.projectName || '')
    .replace(/\{\{contractor\}\}/g, props.deliveryDone.contractorCompanyName || '')
    .replace(/\{\{signatureUrl\}\}/g, '[발송 시 자동 생성됩니다]')
    .replace(/\{\{companyPhone\}\}/g, '031-356-6500')
}

// 현장소장 미리보기 텍스트
const supervisorPreviewText = computed(() => {
  if (!siteManagerTemplate.value?.content || !selectedSupervisorInfo.value) return ''
  return replaceTemplateVariables(siteManagerTemplate.value.content, selectedSupervisorInfo.value.userName)
})

// 현장감리원 미리보기 텍스트
const inspectorPreviewText = computed(() => {
  if (!inspectorTemplate.value?.content || !selectedInspectorInfo.value) return ''
  return replaceTemplateVariables(inspectorTemplate.value.content, selectedInspectorInfo.value.userName)
})

// 모달 제목
const modalTitle = computed(() => {
  return props.documentType === 'CONFIRMATION'
    ? '납품확인서 서명 URL 발송'
    : '납품완료계 서명 URL 발송'
})

// 사용자 목록 (API로부터 로드)
const siteSupervisorList = ref<UserByRole[]>([])
const inspectorList = ref<UserByRole[]>([])

// 선택된 담당자 정보
const selectedSupervisorInfo = computed(() => {
  if (!selectedSiteSupervisorId.value) return null
  return siteSupervisorList.value.find(s => s.userId === selectedSiteSupervisorId.value) || null
})

const selectedInspectorInfo = computed(() => {
  if (!selectedInspectorId.value) return null
  return inspectorList.value.find(i => i.userId === selectedInspectorId.value) || null
})

// 선택된 인원 수
const selectedCount = computed(() => {
  let count = 0
  if (selectedSupervisorInfo.value) count++
  if (selectedInspectorInfo.value) count++
  return count
})

// 발송 가능 여부
const canSend = computed(() => {
  if (props.documentType === 'CONFIRMATION') {
    // 납품확인서: 현장소장 + 현장감리원 둘 다 필수
    return !!selectedSupervisorInfo.value && !!selectedInspectorInfo.value
  } else {
    // 납품완료계: 현장감리원만 필수
    return !!selectedInspectorInfo.value
  }
})

// 발송 버튼 텍스트
const sendButtonText = computed(() => {
  if (props.documentType === 'CONFIRMATION') {
    // 납품확인서: 둘 다 선택 필요
    if (!selectedSupervisorInfo.value || !selectedInspectorInfo.value) {
      return '담당자를 모두 선택하세요'
    }
  } else {
    // 납품완료계: 감리원만 필요
    if (!selectedInspectorInfo.value) {
      return '감리원을 선택하세요'
    }
  }
  return selectedCount.value > 1 ? `URL 발송 (${selectedCount.value}명)` : 'URL 발송'
})

// 모달 오픈 시 사용자 목록 + 메시지 템플릿 로드
onMounted(async () => {
  loading.value = true
  templateLoading.value = true
  try {
    // 사용자 목록 + 템플릿 병렬 조회
    const [users] = await Promise.all([
      userService.getUsersByRoles(['SITE_MANAGER', 'SITE_INSPECTOR']),
      loadTemplates()
    ])

    // 역할별로 분리
    siteSupervisorList.value = users.filter(u => u.role === 'SITE_MANAGER')
    inspectorList.value = users.filter(u => u.role === 'SITE_INSPECTOR')
  } catch (error) {
    console.error('Failed to load users:', error)
    alert('사용자 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
})

// 메시지 템플릿 로드
async function loadTemplates() {
  try {
    if (props.documentType === 'CONFIRMATION') {
      // 납품확인서: 현장소장 + 현장감리원 템플릿
      const [managerTpl, inspectorTpl] = await Promise.all([
        getMessageTemplateByCode('DELIVERY_RECEIPT_SITE_MANAGER'),
        getMessageTemplateByCode('DELIVERY_RECEIPT_SITE_INSPECTOR')
      ])
      siteManagerTemplate.value = managerTpl
      inspectorTemplate.value = inspectorTpl
    } else {
      // 납품완료계: 현장감리원 템플릿만
      const inspectorTpl = await getMessageTemplateByCode('DELIVERY_DONE_SITE_INSPECTOR')
      inspectorTemplate.value = inspectorTpl
    }
  } catch (error) {
    console.error('Failed to load message templates:', error)
  } finally {
    templateLoading.value = false
  }
}

// 시공사 현장소장 선택 시 (다른 선택 유지)
function onSiteSupervisorChange() {
  // 아무것도 하지 않음 - 독립적 선택 유지
}

// 현장감리원 선택 시 (다른 선택 유지)
function onInspectorChange() {
  // 아무것도 하지 않음 - 독립적 선택 유지
}

async function handleSend() {
  if (!canSend.value) return

  sending.value = true

  try {
    // 수신자 배열 구성
    const recipients: SignatureRecipient[] = []

    // 현장소장 추가
    if (selectedSupervisorInfo.value) {
      recipients.push({
        recipientType: 'SITE_MANAGER',
        recipientUserId: selectedSupervisorInfo.value.userId,
        recipientName: selectedSupervisorInfo.value.userName,
        recipientPhone: selectedSupervisorInfo.value.phone.replace(/[^0-9]/g, '')
      })
    }

    // 현장감리원 추가
    if (selectedInspectorInfo.value) {
      recipients.push({
        recipientType: 'SITE_INSPECTOR',
        recipientUserId: selectedInspectorInfo.value.userId,
        recipientName: selectedInspectorInfo.value.userName,
        recipientPhone: selectedInspectorInfo.value.phone.replace(/[^0-9]/g, '')
      })
    }

    // API 호출 (한 번에 다중 수신자)
    await sendSignatureUrl({
      deliveryDoneId: props.deliveryDone.deliveryDoneId,
      documentType: props.documentType,  // CONFIRMATION or COMPLETION
      recipients,
      messageType: 'LMS'
    })

    // API 호출 성공 = 메시지 발송 성공
    const names = recipients.map(r => r.recipientName).join(', ')
    alert(`서명 URL이 ${names}님에게 발송되었습니다.`)
    emit('sent')
  } catch (error) {
    console.error('Failed to send signature URL:', error)
    alert('메시지 발송 중 오류가 발생했습니다.')
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
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

.form-section {
  margin-top: 20px;
}

.recipient-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.recipient-grid.single-column {
  grid-template-columns: 1fr;  /* 납품완료계는 감리원만 */
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

.form-group label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 4px;
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

.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

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

.preview-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  color: #374151;
}

.preview-loading {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
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
</style>
