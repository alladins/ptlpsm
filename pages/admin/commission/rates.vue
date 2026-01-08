<template>
  <div class="commission-rates">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="커미션율 설정"
      description="연간 매출 구간별 커미션율을 설정합니다."
    >
      <template #actions>
        <div class="year-selector">
          <label class="year-label">조회 연도</label>
          <select v-model="selectedYear" class="form-select-year" @change="loadRateConfig">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
      </template>
    </PageHeader>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>커미션율 설정을 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 안내 메시지 -->
      <div class="info-banner">
        <i class="fas fa-info-circle"></i>
        <div class="info-content">
          <strong>커미션율 설정 안내</strong>
          <p>연간 매출 금액에 따라 차등 커미션율이 적용됩니다. 구간은 하한 금액 기준으로 정렬되며, 해당 구간의 매출 달성 시 설정된 커미션율이 적용됩니다.</p>
        </div>
      </div>

      <!-- 커미션율 테이블 -->
      <div class="rate-table-section">
        <div class="section-header">
          <h3 class="section-title">
            <i class="fas fa-percentage"></i>
            {{ selectedYear }}년 커미션율 구간
          </h3>
          <button class="btn-add-tier" @click="addTier">
            <i class="fas fa-plus"></i>
            구간 추가
          </button>
        </div>

        <div class="table-container">
          <table class="rate-table">
            <thead>
              <tr>
                <th class="col-order">순서</th>
                <th class="col-name">구간명</th>
                <th class="col-min">매출 하한 (원)</th>
                <th class="col-max">매출 상한 (원)</th>
                <th class="col-rate">커미션율 (%)</th>
                <th class="col-remarks">비고</th>
                <th class="col-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tiers.length === 0">
                <td colspan="7" class="no-data">
                  <i class="fas fa-inbox"></i>
                  <p>설정된 커미션율 구간이 없습니다.</p>
                  <button class="btn-add-first" @click="addTier">
                    <i class="fas fa-plus"></i>
                    첫 번째 구간 추가
                  </button>
                </td>
              </tr>
              <tr v-else v-for="(tier, index) in tiers" :key="index" :class="{ editing: editingIndex === index }">
                <td class="col-order">
                  <span class="tier-badge">{{ index + 1 }}</span>
                </td>
                <td class="col-name">
                  <input
                    v-if="editingIndex === index"
                    v-model="editForm.tierName"
                    type="text"
                    class="form-input"
                    placeholder="예: 1구간"
                  />
                  <span v-else>{{ tier.tierName }}</span>
                </td>
                <td class="col-min">
                  <input
                    v-if="editingIndex === index"
                    v-model.number="editForm.minAmount"
                    type="number"
                    class="form-input text-right"
                    placeholder="0"
                    min="0"
                  />
                  <span v-else class="amount">{{ formatCurrency(tier.minAmount) }}</span>
                </td>
                <td class="col-max">
                  <div v-if="editingIndex === index" class="max-amount-input">
                    <input
                      v-model.number="editForm.maxAmount"
                      type="number"
                      class="form-input text-right"
                      placeholder="무제한"
                      min="0"
                      :disabled="editForm.isUnlimited"
                    />
                    <label class="unlimited-check">
                      <input
                        type="checkbox"
                        v-model="editForm.isUnlimited"
                        @change="handleUnlimitedChange"
                      />
                      무제한
                    </label>
                  </div>
                  <span v-else class="amount">
                    {{ tier.maxAmount ? formatCurrency(tier.maxAmount) : '무제한' }}
                  </span>
                </td>
                <td class="col-rate">
                  <div v-if="editingIndex === index" class="rate-input-group">
                    <input
                      v-model.number="editForm.commissionRate"
                      type="number"
                      class="form-input text-right"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span class="rate-suffix">%</span>
                  </div>
                  <span v-else class="rate-value">{{ tier.commissionRate }}%</span>
                </td>
                <td class="col-remarks">
                  <input
                    v-if="editingIndex === index"
                    v-model="editForm.remarks"
                    type="text"
                    class="form-input"
                    placeholder="비고"
                  />
                  <span v-else class="remarks">{{ tier.remarks || '-' }}</span>
                </td>
                <td class="col-actions">
                  <div v-if="editingIndex === index" class="action-buttons">
                    <button class="btn-icon save" @click="saveTier(index)" title="저장">
                      <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon cancel" @click="cancelEdit" title="취소">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div v-else class="action-buttons">
                    <button class="btn-icon edit" @click="startEdit(index)" title="수정">
                      <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon delete" @click="deleteTier(index)" title="삭제">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 저장 버튼 영역 -->
        <div v-if="tiers.length > 0" class="save-section">
          <div class="save-info">
            <i class="fas fa-exclamation-triangle"></i>
            변경사항은 "저장" 버튼을 클릭해야 서버에 반영됩니다.
          </div>
          <button class="btn-save" @click="saveAllChanges" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ saving ? '저장 중...' : '설정 저장' }}
          </button>
        </div>
      </div>

      <!-- 기본 커미션율 설정 -->
      <div class="default-rate-section">
        <h3 class="section-title">
          <i class="fas fa-sliders-h"></i>
          기본 커미션율
        </h3>
        <div class="default-rate-form">
          <p class="description">구간에 해당하지 않는 경우 적용되는 기본 커미션율입니다.</p>
          <div class="rate-input-wrapper">
            <input
              v-model.number="defaultRate"
              type="number"
              class="form-input-lg"
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
            />
            <span class="rate-suffix-lg">%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCommissionStore } from '~/stores/commission'
import { formatCurrency } from '~/utils/format'
import type { CommissionTier, CommissionRateUpdateRequest } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션율 설정'
})

const commissionStore = useCommissionStore()

// State
const loading = ref(true)
const saving = ref(false)
const selectedYear = ref(new Date().getFullYear())
const tiers = ref<Omit<CommissionTier, 'tierId' | 'year' | 'createdAt' | 'updatedAt'>[]>([])
const defaultRate = ref(0)
const editingIndex = ref<number | null>(null)
const editForm = ref({
  tierName: '',
  minAmount: 0,
  maxAmount: 0 as number | null,
  commissionRate: 0,
  remarks: '',
  isUnlimited: false
})

// Computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear + 1 - i)
})

// Methods
const loadRateConfig = async () => {
  loading.value = true
  try {
    await commissionStore.fetchRateConfig(selectedYear.value)
    const config = commissionStore.rateConfig
    if (config) {
      tiers.value = config.tiers.map(tier => ({
        tierOrder: tier.tierOrder,
        tierName: tier.tierName,
        minAmount: tier.minAmount,
        maxAmount: tier.maxAmount,
        commissionRate: tier.commissionRate,
        remarks: tier.remarks
      }))
      defaultRate.value = config.defaultRate || 0
    } else {
      tiers.value = []
      defaultRate.value = 0
    }
  } catch (error) {
    console.error('커미션율 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

const addTier = () => {
  const newOrder = tiers.value.length + 1
  const newTier = {
    tierOrder: newOrder,
    tierName: `${newOrder}구간`,
    minAmount: 0,
    maxAmount: null as number | null,
    commissionRate: 0,
    remarks: ''
  }
  tiers.value.push(newTier)
  startEdit(tiers.value.length - 1)
}

const startEdit = (index: number) => {
  editingIndex.value = index
  const tier = tiers.value[index]
  editForm.value = {
    tierName: tier.tierName,
    minAmount: tier.minAmount,
    maxAmount: tier.maxAmount,
    commissionRate: tier.commissionRate,
    remarks: tier.remarks || '',
    isUnlimited: tier.maxAmount === null
  }
}

const saveTier = (index: number) => {
  tiers.value[index] = {
    tierOrder: index + 1,
    tierName: editForm.value.tierName,
    minAmount: editForm.value.minAmount,
    maxAmount: editForm.value.isUnlimited ? null : editForm.value.maxAmount,
    commissionRate: editForm.value.commissionRate,
    remarks: editForm.value.remarks
  }
  editingIndex.value = null
}

const cancelEdit = () => {
  // 새로 추가된 빈 항목인 경우 삭제
  if (editingIndex.value !== null) {
    const tier = tiers.value[editingIndex.value]
    if (!tier.tierName && tier.minAmount === 0 && tier.commissionRate === 0) {
      tiers.value.splice(editingIndex.value, 1)
    }
  }
  editingIndex.value = null
}

const deleteTier = (index: number) => {
  if (confirm(`"${tiers.value[index].tierName}" 구간을 삭제하시겠습니까?`)) {
    tiers.value.splice(index, 1)
    // 순서 재정렬
    tiers.value.forEach((tier, i) => {
      tier.tierOrder = i + 1
    })
  }
}

const handleUnlimitedChange = () => {
  if (editForm.value.isUnlimited) {
    editForm.value.maxAmount = null
  }
}

const saveAllChanges = async () => {
  if (editingIndex.value !== null) {
    alert('편집 중인 항목을 먼저 저장하거나 취소해주세요.')
    return
  }

  saving.value = true
  try {
    const request: CommissionRateUpdateRequest = {
      year: selectedYear.value,
      tiers: tiers.value,
      defaultRate: defaultRate.value
    }
    await commissionStore.saveRateConfig(selectedYear.value, request)
    alert('커미션율 설정이 저장되었습니다.')
  } catch (error) {
    console.error('커미션율 저장 실패:', error)
    alert('저장에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadRateConfig()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

/* 연도 선택 */
.year-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.year-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select-year {
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  background: white;
  color: #1f2937;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select-year:hover {
  border-color: #3b82f6;
}

.form-select-year:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 로딩 컨테이너 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #3b82f6;
}

/* 안내 배너 */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 1.5rem;
}

.info-banner > i {
  font-size: 1.25rem;
  color: #3b82f6;
  margin-top: 0.125rem;
}

.info-content strong {
  display: block;
  color: #1e40af;
  margin-bottom: 0.375rem;
}

.info-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #3b82f6;
  line-height: 1.5;
}

/* 테이블 섹션 */
.rate-table-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #3b82f6;
}

.btn-add-tier {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-tier:hover {
  background: #059669;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.rate-table {
  width: 100%;
  border-collapse: collapse;
}

.rate-table th {
  padding: 0.875rem 1rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.rate-table td {
  padding: 0.875rem 1rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  vertical-align: middle;
}

.rate-table tr.editing {
  background: #fefce8;
}

.rate-table tr:hover:not(.editing) {
  background: #f9fafb;
}

.col-order { width: 70px; }
.col-name { width: 120px; }
.col-min { width: 180px; }
.col-max { width: 200px; }
.col-rate { width: 120px; }
.col-remarks { width: auto; }
.col-actions { width: 100px; }

/* 순서 뱃지 */
.tier-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-size: 0.8125rem;
  font-weight: 700;
  border-radius: 50%;
}

/* 금액 및 커미션율 표시 */
.amount {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  color: #1f2937;
}

.rate-value {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

.remarks {
  color: #6b7280;
  font-size: 0.8125rem;
}

/* 입력 폼 */
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.text-right {
  text-align: right;
}

/* 상한 금액 입력 */
.max-amount-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.unlimited-check {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
  cursor: pointer;
}

.unlimited-check input {
  cursor: pointer;
}

/* 커미션율 입력 그룹 */
.rate-input-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rate-input-group .form-input {
  width: 70px;
}

.rate-suffix {
  font-weight: 600;
  color: #6b7280;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon.edit {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon.edit:hover {
  background: #3b82f6;
  color: white;
}

.btn-icon.delete {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon.delete:hover {
  background: #ef4444;
  color: white;
}

.btn-icon.save {
  background: #10b981;
  color: white;
}

.btn-icon.save:hover {
  background: #059669;
}

.btn-icon.cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon.cancel:hover {
  background: #6b7280;
  color: white;
}

/* 데이터 없음 */
.no-data {
  text-align: center;
  padding: 3rem 1rem !important;
  color: #9ca3af;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.no-data p {
  margin: 0 0 1rem 0;
}

.btn-add-first {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-first:hover {
  background: #2563eb;
}

/* 저장 섹션 */
.save-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.save-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #d97706;
}

.save-info i {
  color: #f59e0b;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 기본 커미션율 섹션 */
.default-rate-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.default-rate-section .section-title {
  margin-bottom: 1rem;
}

.default-rate-form {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-radius: 8px;
}

.default-rate-form .description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.rate-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-input-lg {
  width: 100px;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: right;
  transition: border-color 0.2s;
}

.form-input-lg:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rate-suffix-lg {
  font-size: 1.125rem;
  font-weight: 600;
  color: #6b7280;
}

/* 반응형 */
@media (max-width: 1024px) {
  .save-section {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .save-info {
    justify-content: center;
  }

  .btn-save {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .default-rate-form {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
