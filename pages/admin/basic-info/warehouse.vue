<template>
  <div class="warehouse-management">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="창고관리"
      description="창고 정보를 등록하고 관리합니다."
      icon="warehouse"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action btn-primary" @click="openAddModal">
          <i class="fas fa-plus"></i>
          창고 추가
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <!-- 검색 조건 -->
      <div class="search-section-compact">
        <div class="search-row-single">
          <div class="search-item">
            <label>창고유형:</label>
            <select v-model="searchType" class="status-select" @change="filterWarehouses">
              <option value="">전체</option>
              <option value="LEADPOWER">리드파워</option>
              <option value="OEM">OEM</option>
            </select>
          </div>
          <div class="search-item">
            <label>활성여부:</label>
            <select v-model="searchActive" class="status-select" @change="filterWarehouses">
              <option value="">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
          <div class="search-item">
            <label>검색어:</label>
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="창고명, 회사명"
              class="text-input"
              @keyup.enter="filterWarehouses"
            >
          </div>
        </div>
      </div>

      <!-- 테이블 섹션 -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>총 {{ filteredWarehouses.length }}개</span>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <!-- 데이터 없음 -->
        <div v-else-if="filteredWarehouses.length === 0" class="no-data-message">
          <i class="fas fa-warehouse"></i>
          <p>등록된 창고가 없습니다.</p>
        </div>

        <!-- 테이블 -->
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>창고명</th>
                <th>유형</th>
                <th>회사명</th>
                <th>주소</th>
                <th>활성여부</th>
                <th>정렬순서</th>
                <th style="min-width: 140px">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in filteredWarehouses"
                :key="item.warehouseId"
                class="table-row"
              >
                <td>{{ index + 1 }}</td>
                <td class="text-left">{{ item.warehouseName }}</td>
                <td>
                  <span :class="['type-badge', getTypeBadgeClass(item.warehouseType)]">
                    {{ getTypeLabel(item.warehouseType) }}
                  </span>
                </td>
                <td class="text-left">{{ item.companyName || '-' }}</td>
                <td class="text-left">{{ item.address || '-' }}</td>
                <td>
                  <span :class="['status-badge', item.isActive ? 'active' : 'inactive']">
                    {{ item.isActive ? '활성' : '비활성' }}
                  </span>
                </td>
                <td>{{ item.sortOrder }}</td>
                <td class="action-buttons">
                  <button class="btn-edit" @click="openEditModal(item)" title="수정">
                    <i class="fas fa-edit"></i> 수정
                  </button>
                  <button class="btn-delete" @click="handleDelete(item)" title="삭제">
                    <i class="fas fa-trash"></i> 삭제
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 등록/수정 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditMode ? '창고 수정' : '창고 등록' }}</h3>
            <button class="modal-close" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label required">창고명</label>
              <input
                type="text"
                v-model="formData.warehouseName"
                class="form-input"
                placeholder="창고명을 입력하세요"
              >
            </div>
            <div class="form-group">
              <label class="form-label required">창고유형</label>
              <select v-model="formData.warehouseType" class="form-input">
                <option value="LEADPOWER">리드파워</option>
                <option value="OEM">OEM</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">회사</label>
              <select v-model="formData.companyId" class="form-input">
                <option :value="null">선택 안함</option>
                <option
                  v-for="company in companies"
                  :key="company.id"
                  :value="company.id"
                >
                  {{ company.companyName }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">주소</label>
              <input
                type="text"
                v-model="formData.address"
                class="form-input"
                placeholder="주소를 입력하세요"
              >
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">정렬순서</label>
                <input
                  type="number"
                  v-model.number="formData.sortOrder"
                  class="form-input"
                  min="0"
                >
              </div>
              <div class="form-group half">
                <label class="form-label">활성여부</label>
                <select v-model="formData.isActive" class="form-input">
                  <option :value="true">활성</option>
                  <option :value="false">비활성</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">취소</button>
            <button class="btn-submit" @click="handleSubmit" :disabled="saving">
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
/**
 * 창고 관리 페이지
 * - 창고 목록 조회, 등록/수정/삭제
 */
import { ref, computed, onMounted } from 'vue'
import { warehouseService } from '~/services/warehouse.service'
import { companyService } from '~/services/company.service'
import type { Warehouse, WarehouseRequest, WarehouseType } from '~/types/warehouse'
import { WAREHOUSE_TYPE_LABELS, WAREHOUSE_TYPE_COLORS } from '~/types/warehouse'
import type { CompanyInfoResponse } from '~/types/company'

definePageMeta({
  layout: 'admin',
  pageTitle: '창고관리'
})

// 상태
const loading = ref(false)
const saving = ref(false)
const warehouses = ref<Warehouse[]>([])
const companies = ref<CompanyInfoResponse[]>([])
const showModal = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)

// 검색 필터
const searchType = ref('')
const searchActive = ref('')
const searchKeyword = ref('')

// 폼 데이터
const formData = ref<WarehouseRequest>({
  warehouseName: '',
  warehouseType: 'LEADPOWER',
  companyId: null,
  address: null,
  isActive: true,
  sortOrder: 0
})

// 필터링된 목록
const filteredWarehouses = computed(() => {
  let list = [...warehouses.value]

  // 유형 필터
  if (searchType.value) {
    list = list.filter(w => w.warehouseType === searchType.value)
  }

  // 활성 여부 필터
  if (searchActive.value !== '') {
    const isActive = searchActive.value === 'true'
    list = list.filter(w => w.isActive === isActive)
  }

  // 키워드 필터
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(w =>
      w.warehouseName.toLowerCase().includes(keyword) ||
      (w.companyName && w.companyName.toLowerCase().includes(keyword))
    )
  }

  // 정렬순서 기준 정렬
  list.sort((a, b) => a.sortOrder - b.sortOrder)

  return list
})

// 유형 라벨
const getTypeLabel = (type: WarehouseType): string => {
  return WAREHOUSE_TYPE_LABELS[type] || type
}

// 유형 배지 CSS 클래스
const getTypeBadgeClass = (type: WarehouseType): string => {
  return WAREHOUSE_TYPE_COLORS[type] || ''
}

// 필터링 실행 (반응형이므로 별도 호출 불필요하나, 명시적 용도)
const filterWarehouses = () => {
  // computed에 의해 자동 필터링
}

// 창고 목록 로드
const loadWarehouses = async () => {
  loading.value = true
  try {
    warehouses.value = await warehouseService.getWarehouseList(true)
  } catch (error) {
    console.error('창고 목록 로드 실패:', error)
    alert('창고 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 회사 목록 로드
const loadCompanies = async () => {
  try {
    companies.value = await companyService.getManufacturers()
  } catch (error) {
    console.error('회사 목록 로드 실패:', error)
  }
}

// 등록 모달 열기
const openAddModal = () => {
  isEditMode.value = false
  editingId.value = null
  formData.value = {
    warehouseName: '',
    warehouseType: 'LEADPOWER',
    companyId: null,
    address: null,
    isActive: true,
    sortOrder: warehouses.value.length + 1
  }
  showModal.value = true
}

// 수정 모달 열기
const openEditModal = (item: Warehouse) => {
  isEditMode.value = true
  editingId.value = item.warehouseId
  formData.value = {
    warehouseName: item.warehouseName,
    warehouseType: item.warehouseType,
    companyId: item.companyId,
    address: item.address,
    isActive: item.isActive,
    sortOrder: item.sortOrder
  }
  showModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showModal.value = false
  isEditMode.value = false
  editingId.value = null
}

// 등록/수정 처리
const handleSubmit = async () => {
  // 유효성 검사
  if (!formData.value.warehouseName.trim()) {
    alert('창고명을 입력해주세요.')
    return
  }

  saving.value = true
  try {
    if (isEditMode.value && editingId.value) {
      await warehouseService.updateWarehouse(editingId.value, formData.value)
      alert('창고가 수정되었습니다.')
    } else {
      await warehouseService.createWarehouse(formData.value)
      alert('창고가 등록되었습니다.')
    }
    closeModal()
    await loadWarehouses()
  } catch (error) {
    console.error('창고 저장 실패:', error)
    alert(isEditMode.value ? '창고 수정에 실패했습니다.' : '창고 등록에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

// 삭제 처리
const handleDelete = async (item: Warehouse) => {
  if (!confirm(`'${item.warehouseName}' 창고를 삭제하시겠습니까?`)) {
    return
  }

  try {
    await warehouseService.deleteWarehouse(item.warehouseId)
    alert('창고가 삭제되었습니다.')
    await loadWarehouses()
  } catch (error) {
    console.error('창고 삭제 실패:', error)
    alert('창고 삭제에 실패했습니다.')
  }
}

// 초기 로드
onMounted(async () => {
  await Promise.all([
    loadWarehouses(),
    loadCompanies()
  ])
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

/* 유형 배지 */
.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.type-badge.bg-blue-100 {
  background-color: #dbeafe;
}
.type-badge.text-blue-700 {
  color: #1d4ed8;
}
.type-badge.bg-purple-100 {
  background-color: #ede9fe;
}
.type-badge.text-purple-700 {
  color: #6d28d9;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #d1fae5;
  color: #047857;
}

.status-badge.inactive {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* 관리 버튼 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

.btn-edit,
.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 56px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.btn-edit {
  background-color: #3b82f6;
  color: #ffffff;
}

.btn-edit:hover {
  background-color: #2563eb;
}

.btn-delete {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-delete:hover {
  background-color: #dc2626;
}

/* 모달 오버레이 */
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
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.125rem;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  color: #111827;
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-submit {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover {
  background: #2563eb;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 1024px) {
  .warehouse-management {
    padding: 1rem;
  }

  .data-table {
    min-width: 800px;
  }
}
</style>
