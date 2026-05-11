<template>
  <div class="commission-rates">
    <!-- 페이지 헤더 - 컴팩트 -->
    <div class="page-header-compact">
      <h1>커미션율 설정</h1>
      <span class="page-description">연간 매출 구간별 6주체 배분 비율을 설정합니다.</span>
      <div class="header-actions-right">
        <div class="year-selector">
          <label class="year-label">조회 연도</label>
          <select v-model="selectedYear" class="form-select-year" @change="loadRateConfig">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" />
      <p>커미션율 설정을 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 안내 메시지 -->
      <div class="info-banner">
        <i class="fas fa-info-circle" />
        <div class="info-content">
          <strong>커미션율 설정 안내</strong>
          <p>연간 매출 금액에 따라 6주체(OEM, CEO, 에코암스, 영업, 인증관리, 유지보수) 배분 비율을 설정합니다. CEO, 영업, 인증관리, 유지보수, OEM 비율을 입력하면 에코암스 비율이 자동 계산됩니다. 합계는 반드시 100%여야 합니다.</p>
        </div>
      </div>

      <!-- 커미션율 테이블 -->
      <div class="rate-table-section">
        <div class="section-header">
          <h3 class="section-title">
            <i class="fas fa-percentage" />
            {{ selectedYear }}년 커미션율 구간
          </h3>
          <button class="btn-add-tier" @click="addTier">
            <i class="fas fa-plus" />
            구간 추가
          </button>
        </div>

        <div class="table-container">
          <table class="rate-table">
            <thead>
              <tr>
                <th class="col-order">
                  순서
                </th>
                <th class="col-name">
                  구간명
                </th>
                <th class="col-range">
                  매출 범위
                </th>
                <th class="col-rate-input">
                  CEO (%)
                </th>
                <th class="col-rate-auto">
                  에코암스 (%) <span class="auto-badge">자동</span>
                </th>
                <th class="col-rate-input">
                  영업 (%)
                </th>
                <th class="col-rate-input">
                  인증관리 (%)
                </th>
                <th class="col-rate-input">
                  유지보수 (%)
                </th>
                <th class="col-rate-input">
                  OEM (%)
                </th>
                <th class="col-actions">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tiers.length === 0">
                <td colspan="10" class="no-data">
                  <i class="fas fa-inbox" />
                  <p>설정된 커미션율 구간이 없습니다.</p>
                  <button class="btn-add-first" @click="addTier">
                    <i class="fas fa-plus" />
                    첫 번째 구간 추가
                  </button>
                </td>
              </tr>
              <tr v-for="(tier, index) in tiers" v-else :key="index" :class="{ editing: editingIndex === index }">
                <!-- 순서 -->
                <td class="col-order">
                  <span class="tier-badge">{{ index + 1 }}</span>
                </td>
                <!-- 구간명 -->
                <td class="col-name">
                  <input
                    v-if="editingIndex === index"
                    v-model="editForm.tierName"
                    type="text"
                    class="form-input"
                    placeholder="예: 1구간"
                  >
                  <span v-else>{{ tier.tierName }}</span>
                </td>
                <!-- 매출 범위 -->
                <td class="col-range">
                  <div v-if="editingIndex === index" class="range-edit">
                    <div class="range-inputs">
                      <input
                        v-model.number="editForm.minAmount"
                        type="number"
                        class="form-input text-right range-input"
                        placeholder="0"
                        min="0"
                      >
                      <span class="range-separator">~</span>
                      <input
                        v-if="!editForm.isUnlimited"
                        v-model.number="editForm.maxAmount"
                        type="number"
                        class="form-input text-right range-input"
                        placeholder="상한"
                        min="0"
                      >
                      <span v-else class="unlimited-text">무제한</span>
                    </div>
                    <label class="unlimited-check">
                      <input
                        v-model="editForm.isUnlimited"
                        type="checkbox"
                        @change="handleUnlimitedChange"
                      >
                      무제한
                    </label>
                  </div>
                  <span v-else class="range-display">
                    {{ formatAmountBillion(tier.minAmount) }} ~ {{ tier.maxAmount ? formatAmountBillion(tier.maxAmount) : '무제한' }}
                  </span>
                </td>
                <!-- CEO 비율 -->
                <td class="col-rate-input">
                  <div v-if="editingIndex === index" class="rate-input-group">
                    <input
                      v-model.number="editForm.ceoRate"
                      type="number"
                      class="form-input text-right rate-field"
                      min="0"
                      max="100"
                      step="0.1"
                    >
                    <span class="rate-suffix">%</span>
                  </div>
                  <span v-else class="rate-value">{{ tier.ceoRate }}%</span>
                </td>
                <!-- 에코암스 비율 (자동계산) -->
                <td class="col-rate-auto">
                  <div v-if="editingIndex === index" class="oem-rate-display">
                    <span
                      class="oem-rate-value"
                      :class="{ 'rate-warning': computedEcoarmsRate < 0, 'rate-error': computedEcoarmsRate < 0 }"
                    >
                      {{ computedEcoarmsRate.toFixed(1) }}%
                    </span>
                    <span v-if="computedEcoarmsRate < 0" class="rate-total-warning">
                      <i class="fas fa-exclamation-triangle" />
                      비율 초과
                    </span>
                  </div>
                  <span v-else class="oem-rate-readonly">{{ tier.ecoarmsRate }}%</span>
                </td>
                <!-- 영업 비율 -->
                <td class="col-rate-input">
                  <div v-if="editingIndex === index" class="rate-input-group">
                    <input
                      v-model.number="editForm.salesRate"
                      type="number"
                      class="form-input text-right rate-field"
                      min="0"
                      max="100"
                      step="0.1"
                    >
                    <span class="rate-suffix">%</span>
                  </div>
                  <span v-else class="rate-value">{{ tier.salesRate }}%</span>
                </td>
                <!-- 인증관리 비율 -->
                <td class="col-rate-input">
                  <div v-if="editingIndex === index" class="rate-input-group">
                    <input
                      v-model.number="editForm.certificationRate"
                      type="number"
                      class="form-input text-right rate-field"
                      min="0"
                      max="100"
                      step="0.1"
                    >
                    <span class="rate-suffix">%</span>
                  </div>
                  <span v-else class="rate-value">{{ tier.certificationRate }}%</span>
                </td>
                <!-- 유지보수 비율 -->
                <td class="col-rate-input">
                  <div v-if="editingIndex === index" class="rate-input-group">
                    <input
                      v-model.number="editForm.maintenanceRate"
                      type="number"
                      class="form-input text-right rate-field"
                      min="0"
                      max="100"
                      step="0.1"
                    >
                    <span class="rate-suffix">%</span>
                  </div>
                  <span v-else class="rate-value">{{ tier.maintenanceRate }}%</span>
                </td>
                <!-- OEM 비율 (수동입력) -->
                <td class="col-rate-input">
                  <div v-if="editingIndex === index" class="rate-input-group">
                    <input
                      v-model.number="editForm.oemRate"
                      type="number"
                      class="form-input text-right rate-field"
                      min="0"
                      max="100"
                      step="0.1"
                    >
                    <span class="rate-suffix">%</span>
                  </div>
                  <span v-else class="rate-value">{{ tier.oemRate }}%</span>
                </td>
                <!-- 관리 버튼 -->
                <td class="col-actions">
                  <div v-if="editingIndex === index" class="action-buttons">
                    <button class="btn-icon save" title="저장" :disabled="rateTotal !== 100" @click="saveTier(index)">
                      <i class="fas fa-check" />
                    </button>
                    <button class="btn-icon cancel" title="취소" @click="cancelEdit">
                      <i class="fas fa-times" />
                    </button>
                  </div>
                  <div v-else class="action-buttons">
                    <button class="btn-icon edit" title="수정" @click="startEdit(index)">
                      <i class="fas fa-pen" />
                    </button>
                    <button class="btn-icon delete" title="삭제" @click="deleteTier(index)">
                      <i class="fas fa-trash" />
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
            <i class="fas fa-exclamation-triangle" />
            변경사항은 "저장" 버튼을 클릭해야 서버에 반영됩니다.
          </div>
          <div class="save-buttons">
            <button class="btn-recalculate" :disabled="recalculating" @click="handleRecalculate">
              <i v-if="recalculating" class="fas fa-spinner fa-spin" />
              <i v-else class="fas fa-calculator" />
              {{ recalculating ? '재계산 중...' : '정산 재계산' }}
            </button>
            <button class="btn-save" :disabled="saving" @click="saveAllChanges">
              <i v-if="saving" class="fas fa-spinner fa-spin" />
              <i v-else class="fas fa-save" />
              {{ saving ? '저장 중...' : '설정 저장' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as commissionService from '~/services/commission.service'
import type { CommissionRateUpdateRequest } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션율 설정'
})

// State
const loading = ref(true)
const saving = ref(false)
const recalculating = ref(false)
const selectedYear = ref(new Date().getFullYear())
const editingIndex = ref<number | null>(null)

// 구간 목록 (6주체 비율)
const tiers = ref<{
  tierName: string
  minAmount: number
  maxAmount: number | null
  ceoRate: number
  ecoarmsRate: number
  salesRate: number
  certificationRate: number
  maintenanceRate: number
  oemRate: number
}[]>([])

// 편집 폼
const editForm = ref({
  tierName: '',
  minAmount: 0,
  maxAmount: 0 as number | null,
  ceoRate: 0,
  salesRate: 15,
  certificationRate: 2,
  maintenanceRate: 3,
  oemRate: 60,
  isUnlimited: false
})

// 에코암스 자동 계산
const computedEcoarmsRate = computed(() => {
  return 100 - editForm.value.ceoRate - editForm.value.salesRate -
    editForm.value.certificationRate - editForm.value.maintenanceRate - editForm.value.oemRate
})

// 합계 검증
const rateTotal = computed(() => {
  return editForm.value.ceoRate + editForm.value.salesRate +
    editForm.value.certificationRate + editForm.value.maintenanceRate +
    editForm.value.oemRate + computedEcoarmsRate.value
})

// 연도 목록
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear + 1 - i)
})

/**
 * 금액을 억 단위로 포맷
 * 예: 0 → '0', 5000000000 → '50억', 15000000000 → '150억'
 */
const formatAmountBillion = (amount: number): string => {
  if (amount === 0) { return '0' }
  const billion = amount / 100_000_000 // 억 단위
  if (billion >= 1) {
    // 정수면 소수점 없이, 아니면 소수점 1자리
    return Number.isInteger(billion) ? `${billion}억` : `${billion.toFixed(1)}억`
  }
  // 1억 미만이면 만 단위로 표시
  const man = amount / 10_000
  return `${man.toLocaleString()}만`
}

/**
 * 커미션율 설정 조회
 */
const loadRateConfig = async () => {
  loading.value = true
  try {
    const response = await commissionService.getCommissionRates(selectedYear.value)
    // 백엔드가 배열(List<CommissionRateConfigResponse>)을 직접 반환하는 경우
    if (Array.isArray(response)) {
      tiers.value = response.map((r: any) => ({
        tierName: r.tierName,
        minAmount: r.minAmount,
        maxAmount: r.maxAmount,
        ceoRate: r.ceoRate ?? 0,
        ecoarmsRate: r.ecoarmsRate ?? 0,
        salesRate: r.salesRate ?? 0,
        certificationRate: r.certificationRate ?? 2,
        maintenanceRate: r.maintenanceRate ?? 3,
        oemRate: r.oemRate ?? 0
      }))
    } else if (response && response.tiers) {
      // CommissionRateConfig 형태로 감싸서 오는 경우
      tiers.value = response.tiers.map((r: any) => ({
        tierName: r.tierName,
        minAmount: r.minAmount,
        maxAmount: r.maxAmount,
        ceoRate: r.ceoRate ?? 0,
        ecoarmsRate: r.ecoarmsRate ?? 0,
        salesRate: r.salesRate ?? 0,
        certificationRate: r.certificationRate ?? 2,
        maintenanceRate: r.maintenanceRate ?? 3,
        oemRate: r.oemRate ?? 0
      }))
    } else {
      tiers.value = []
    }
  } catch (error) {
    console.error('커미션율 조회 실패:', error)
    tiers.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 구간 추가
 */
const addTier = () => {
  const newOrder = tiers.value.length + 1
  tiers.value.push({
    tierName: `${newOrder}구간`,
    minAmount: 0,
    maxAmount: null,
    ceoRate: 0,
    salesRate: 15,
    certificationRate: 2,
    maintenanceRate: 3,
    oemRate: 60,
    ecoarmsRate: 20
  })
  startEdit(tiers.value.length - 1)
}

/**
 * 편집 시작
 */
const startEdit = (index: number) => {
  editingIndex.value = index
  const tier = tiers.value[index]
  editForm.value = {
    tierName: tier.tierName,
    minAmount: tier.minAmount,
    maxAmount: tier.maxAmount,
    ceoRate: tier.ceoRate,
    salesRate: tier.salesRate,
    certificationRate: tier.certificationRate,
    maintenanceRate: tier.maintenanceRate,
    oemRate: tier.oemRate,
    isUnlimited: tier.maxAmount === null
  }
}

/**
 * 구간 저장
 */
const saveTier = (index: number) => {
  // 합계 100% 검증
  if (rateTotal.value !== 100) {
    alert('CEO + 영업 + 인증관리 + 유지보수 + OEM + 에코암스 합계가 100%여야 합니다.')
    return
  }
  if (computedEcoarmsRate.value < 0) {
    alert('에코암스 비율이 음수입니다. 다른 비율을 조정해주세요.')
    return
  }

  tiers.value[index] = {
    tierName: editForm.value.tierName,
    minAmount: editForm.value.minAmount,
    maxAmount: editForm.value.isUnlimited ? null : editForm.value.maxAmount,
    ceoRate: editForm.value.ceoRate,
    ecoarmsRate: computedEcoarmsRate.value,
    salesRate: editForm.value.salesRate,
    certificationRate: editForm.value.certificationRate,
    maintenanceRate: editForm.value.maintenanceRate,
    oemRate: editForm.value.oemRate
  }
  editingIndex.value = null
}

/**
 * 편집 취소
 */
const cancelEdit = () => {
  if (editingIndex.value !== null) {
    const tier = tiers.value[editingIndex.value]
    // 새로 추가된 빈 항목인 경우 삭제
    if (!tier.tierName || (tier.ceoRate === 0 && tier.salesRate === 15 && tier.certificationRate === 2 && tier.maintenanceRate === 3 && tier.oemRate === 60 && tier.minAmount === 0)) {
      tiers.value.splice(editingIndex.value, 1)
    }
  }
  editingIndex.value = null
}

/**
 * 구간 삭제
 */
const deleteTier = (index: number) => {
  if (confirm(`"${tiers.value[index].tierName}" 구간을 삭제하시겠습니까?`)) {
    tiers.value.splice(index, 1)
  }
}

/**
 * 무제한 체크 핸들러
 */
const handleUnlimitedChange = () => {
  if (editForm.value.isUnlimited) {
    editForm.value.maxAmount = null
  }
}

/**
 * 전체 설정 저장
 */
const saveAllChanges = async () => {
  if (editingIndex.value !== null) {
    alert('편집 중인 항목을 먼저 저장하거나 취소해주세요.')
    return
  }

  saving.value = true
  try {
    const request: CommissionRateUpdateRequest = {
      year: selectedYear.value,
      tiers: tiers.value.map((tier, index) => ({
        tierOrder: index + 1,
        tierName: tier.tierName,
        minAmount: tier.minAmount,
        maxAmount: tier.maxAmount,
        oemRate: tier.oemRate,
        ceoRate: tier.ceoRate,
        ecoarmsRate: tier.ecoarmsRate,
        salesRate: tier.salesRate,
        certificationRate: tier.certificationRate,
        maintenanceRate: tier.maintenanceRate
      }))
    }
    await commissionService.saveCommissionRates(selectedYear.value, request)
    alert('커미션율 설정이 저장되었습니다.')
    // 저장 후 새로고침
    await loadRateConfig()
  } catch (error) {
    console.error('커미션율 저장 실패:', error)
    alert('저장에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

/**
 * 정산이력 일괄 재계산
 */
const handleRecalculate = async () => {
  if (!confirm(
    `${selectedYear.value}년도 정산이력을 현재 비율로 재계산하시겠습니까?\n\n` +
    '기존 정산이력의 각 주체별 금액이 현재 설정된 비율로 다시 계산됩니다.'
  )) { return }

  recalculating.value = true
  try {
    const result = await commissionService.recalculateSettlements(selectedYear.value)
    alert(result.message || `${selectedYear.value}년도 정산이력이 재계산되었습니다.`)
  } catch (error) {
    console.error('정산 재계산 실패:', error)
    alert('재계산에 실패했습니다. 다시 시도해주세요.')
  } finally {
    recalculating.value = false
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
  padding: 0.875rem 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.rate-table td {
  padding: 0.875rem 0.75rem;
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

/* 컬럼 너비 */
.col-order { width: 60px; }
.col-name { width: 100px; }
.col-range { width: 180px; }
.col-rate-input { width: 110px; }
.col-rate-auto { width: 130px; }
.col-actions { width: 90px; }

/* 자동 뱃지 */
.auto-badge {
  display: inline-block;
  padding: 1px 6px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 4px;
  vertical-align: middle;
  margin-left: 2px;
}

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

/* 매출 범위 표시 */
.range-display {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  color: #1f2937;
  font-size: 0.8125rem;
}

/* 매출 범위 편집 */
.range-edit {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.range-input {
  width: 70px !important;
  padding: 0.375rem 0.5rem !important;
  font-size: 0.8125rem !important;
}

.range-separator {
  color: #9ca3af;
  font-weight: 500;
}

.unlimited-text {
  font-size: 0.8125rem;
  color: #6b7280;
  font-style: italic;
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

/* 비율 값 표시 */
.rate-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #059669;
}

/* 커미션율 입력 그룹 */
.rate-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.rate-field {
  width: 70px !important;
  padding: 0.375rem 0.5rem !important;
  font-size: 0.875rem !important;
}

.rate-suffix {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.8125rem;
}

/* OEM 자동 계산 표시 */
.oem-rate-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.oem-rate-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1d4ed8;
  padding: 0.25rem 0.75rem;
  background: #eff6ff;
  border-radius: 6px;
}

.oem-rate-value.rate-warning {
  color: #dc2626;
  background: #fef2f2;
}

.oem-rate-value.rate-error {
  color: #dc2626;
  background: #fef2f2;
}

.rate-total-warning {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: #dc2626;
  font-weight: 600;
}

.rate-total-warning i {
  font-size: 0.625rem;
}

.oem-rate-readonly {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  background: #eff6ff;
  border-radius: 4px;
  display: inline-block;
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

.btn-icon.save:hover:not(:disabled) {
  background: #059669;
}

.btn-icon.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.save-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-recalculate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-recalculate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-recalculate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
