<template>
  <div class="forecast-page">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="영업 예측"
      description="영업 예측 정보를 조회하고 관리합니다."
      icon="chart-line"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" @click="loadForecasts" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-sync-alt"></i>
          새로고침
        </button>
        <button
          class="btn-action btn-primary"
          @click="openCreateModal"
          :disabled="!canWrite"
          :title="!canWrite ? '등록 권한이 없습니다' : ''"
        >
          <i class="fas fa-plus"></i>
          예측 등록
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 통계 대시보드 -->
      <div class="stats-dashboard">
        <div class="stat-card">
          <div class="stat-icon high">
            <i class="fas fa-fire"></i>
          </div>
          <div class="stat-content">
            <h3>높음</h3>
            <p class="stat-value">{{ probabilityStats.high }}건</p>
            <p class="stat-amount">{{ formatCurrency(probabilityStats.highAmount) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon medium">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>중간</h3>
            <p class="stat-value">{{ probabilityStats.medium }}건</p>
            <p class="stat-amount">{{ formatCurrency(probabilityStats.mediumAmount) }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon low">
            <i class="fas fa-chart-area"></i>
          </div>
          <div class="stat-content">
            <h3>낮음</h3>
            <p class="stat-value">{{ probabilityStats.low }}건</p>
            <p class="stat-amount">{{ formatCurrency(probabilityStats.lowAmount) }}</p>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">
            <i class="fas fa-calculator"></i>
          </div>
          <div class="stat-content">
            <h3>전체</h3>
            <p class="stat-value">{{ forecasts.length }}건</p>
            <p class="stat-amount">{{ formatCurrency(probabilityStats.totalAmount) }}</p>
          </div>
        </div>
      </div>

      <!-- 예측 목록 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ forecasts.length }}개의 예측</span>
          </div>
          <div class="table-actions">
            <select v-model="filterProbability" @change="applyFilter" class="filter-select">
              <option value="">전체 확률</option>
              <option value="높음">높음</option>
              <option value="중간">중간</option>
              <option value="낮음">낮음</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>수요기관</th>
                <th>사업명</th>
                <th>품목리스트</th>
                <th>개략 수량</th>
                <th>예상 금액</th>
                <th>확률</th>
                <th>예상 계약일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredForecasts" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.demandOrganization || '-' }}</td>
                <td>{{ item.businessName || '-' }}</td>
                <td>{{ item.itemList || '-' }}</td>
                <td>{{ item.approximateQuantity || '-' }}</td>
                <td>{{ formatCurrency(item.forecastAmount) }}</td>
                <td>
                  <span class="probability-badge" :class="getProbabilityClass(item.probability)">
                    {{ item.probability || '-' }}
                  </span>
                </td>
                <td>{{ formatDate(item.expectedContractDate) }}</td>
                <td class="action-buttons">
                  <button class="btn-edit" @click="openEditModal(item)" title="수정">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-delete" @click="deleteForecast(item.id!)" title="삭제">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 로딩 상태 -->
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>데이터를 불러오는 중...</p>
          </div>

          <!-- 데이터가 없을 때 -->
          <div v-if="filteredForecasts.length === 0 && !loading" class="no-data-message">
            <i class="fas fa-chart-line"></i>
            <p>등록된 예측 정보가 없습니다.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 예측 등록/수정 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ isEditMode ? '예측 수정' : '예측 등록' }}</h2>
            <button class="modal-close" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="info-group">
              <label>수주 ID <span class="required">*</span></label>
              <input type="number" v-model="formData.salesId" required>
            </div>
            <div class="info-group">
              <label>수요기관</label>
              <input type="text" v-model="formData.demandOrganization">
            </div>
            <div class="info-group">
              <label>사업명</label>
              <input type="text" v-model="formData.businessName">
            </div>
            <div class="info-group">
              <label>사업내용</label>
              <textarea v-model="formData.businessContent" rows="3"></textarea>
            </div>
            <div class="info-group">
              <label>품목리스트</label>
              <textarea v-model="formData.itemList" rows="2"></textarea>
            </div>
            <div class="info-group">
              <label>개략 수량</label>
              <input type="text" v-model="formData.approximateQuantity">
            </div>
            <div class="info-group">
              <label>예상 금액</label>
              <input type="number" v-model="formData.forecastAmount">
            </div>
            <div class="info-group">
              <label>확률</label>
              <select v-model="formData.probability">
                <option value="">선택</option>
                <option value="높음">높음</option>
                <option value="중간">중간</option>
                <option value="낮음">낮음</option>
              </select>
            </div>
            <div class="info-group">
              <label>예상 계약일</label>
              <input type="date" v-model="formData.expectedContractDate">
            </div>
            <div class="info-group">
              <label>비고</label>
              <textarea v-model="formData.remark" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">취소</button>
            <button class="btn-primary" @click="saveForecast" :disabled="saving">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              {{ isEditMode ? '수정' : '등록' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { salesForecastService } from '~/services/sales-forecast.service'
import type { SalesForecast, SalesForecastRequest } from '~/types/sales'
import { formatCurrency, formatDate } from '~/utils/format'
import { usePermission } from '~/composables/usePermission'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 예측'
})

// 권한
const { canWrite } = usePermission()

// 상태 관리
const loading = ref(false)
const saving = ref(false)
const forecasts = ref<SalesForecast[]>([])
const filterProbability = ref('')
const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

// 폼 데이터
const formData = ref<SalesForecastRequest>({
  salesId: 0,
  itemList: '',
  demandOrganization: '',
  businessName: '',
  businessContent: '',
  approximateQuantity: '',
  forecastAmount: 0,
  probability: '',
  expectedContractDate: '',
  remark: '',
  useYn: 'Y'
})

// 필터링된 예측 목록
const filteredForecasts = computed(() => {
  if (!filterProbability.value) return forecasts.value
  return forecasts.value.filter(f => f.probability === filterProbability.value)
})

// 확률별 통계
const probabilityStats = computed(() => {
  const stats = {
    high: 0,
    highAmount: 0,
    medium: 0,
    mediumAmount: 0,
    low: 0,
    lowAmount: 0,
    totalAmount: 0
  }

  forecasts.value.forEach(f => {
    const amount = f.forecastAmount || 0
    stats.totalAmount += amount

    if (f.probability === '높음') {
      stats.high++
      stats.highAmount += amount
    } else if (f.probability === '중간') {
      stats.medium++
      stats.mediumAmount += amount
    } else if (f.probability === '낮음') {
      stats.low++
      stats.lowAmount += amount
    }
  })

  return stats
})

// 예측 목록 로드
const loadForecasts = async () => {
  loading.value = true
  try {
    forecasts.value = await salesForecastService.getAllForecasts()
  } catch (error) {
    console.error('예측 목록 로드 오류:', error)
    alert('예측 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 필터 적용
const applyFilter = () => {
  // 필터링은 computed에서 자동 처리됨
}

// 등록 모달 열기
const openCreateModal = () => {
  isEditMode.value = false
  editingId.value = null
  formData.value = {
    salesId: 0,
    itemList: '',
    demandOrganization: '',
    businessName: '',
    businessContent: '',
    approximateQuantity: '',
    forecastAmount: 0,
    probability: '',
    expectedContractDate: '',
    remark: '',
    useYn: 'Y'
  }
  showModal.value = true
}

// 수정 모달 열기
const openEditModal = (forecast: SalesForecast) => {
  isEditMode.value = true
  editingId.value = forecast.id!
  formData.value = {
    salesId: forecast.salesId,
    itemList: forecast.itemList || '',
    demandOrganization: forecast.demandOrganization || '',
    businessName: forecast.businessName || '',
    businessContent: forecast.businessContent || '',
    approximateQuantity: forecast.approximateQuantity || '',
    forecastAmount: forecast.forecastAmount || 0,
    probability: forecast.probability || '',
    expectedContractDate: forecast.expectedContractDate || '',
    remark: forecast.remark || '',
    useYn: forecast.useYn || 'Y'
  }
  showModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
}

// 예측 저장
const saveForecast = async () => {
  if (!formData.value.salesId) {
    alert('수주 ID는 필수입니다.')
    return
  }

  saving.value = true
  try {
    if (isEditMode.value && editingId.value) {
      await salesForecastService.updateForecast(editingId.value, formData.value)
    } else {
      await salesForecastService.createForecast(formData.value)
    }
    closeModal()
    loadForecasts()
  } catch (error) {
    console.error('예측 저장 오류:', error)
    alert('예측 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// 예측 삭제
const deleteForecast = async (id: number) => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await salesForecastService.deleteForecast(id)
    loadForecasts()
  } catch (error) {
    console.error('예측 삭제 오류:', error)
    alert('예측 삭제에 실패했습니다.')
  }
}

// 확률 클래스 반환
const getProbabilityClass = (probability?: string) => {
  if (probability === '높음') return 'prob-high'
  if (probability === '중간') return 'prob-medium'
  if (probability === '낮음') return 'prob-low'
  return ''
}

onMounted(() => {
  loadForecasts()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-forms.css';

/* 통계 대시보드 */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.high {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.medium {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.low {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.stat-amount {
  font-size: 0.9rem;
  color: #6b7280;
}

/* 확률 배지 */
.probability-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.probability-badge.prob-high {
  background: #fee2e2;
  color: #dc2626;
}

.probability-badge.prob-medium {
  background: #dbeafe;
  color: #2563eb;
}

.probability-badge.prob-low {
  background: #d1fae5;
  color: #059669;
}

/* 필터 셀렉트 */
.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
