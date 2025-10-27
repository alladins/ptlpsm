<template>
  <div class="delivery-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품확인 등록"
      description="납품확인 정보를 등록하고 관리합니다."
    />

    <div class="content-section">
      <!-- 납품확인 정보 입력 폼 -->
      <div class="form-section">
        <div class="form-header">
          <h2>납품확인 정보</h2>
        </div>
        
        <div class="form-container">
          <div class="form-grid">
            <!-- 첫 번째 줄: 운송장ID 조회, 수요기관명, 담당자연락처 -->
            <div class="form-group">
              <label>운송장ID</label>
              <div class="input-with-button">
                <input type="text" v-model="deliveryForm.transportId" class="form-input" placeholder="운송장ID를 선택하세요">
                <button type="button" class="btn-secondary" @click="searchTransport">
                  <i class="fas fa-search"></i>
                  조회
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label>수요기관명</label>
              <input type="text" v-model="deliveryForm.clientName" class="form-input" placeholder="수요기관명 불러오기" readonly>
            </div>
            
            <div class="form-group">
              <label>담당자연락처</label>
              <input type="tel" v-model="deliveryForm.managerContact" class="form-input" placeholder="연락처를 입력하세요">
            </div>
            
            <!-- 두 번째 줄: 기사명, 연락처, 차량번호 -->
            <div class="form-group">
              <label>기사명</label>
              <input type="text" v-model="deliveryForm.driverName" class="form-input" placeholder="기사명을 입력하세요">
            </div>
            
            <div class="form-group">
              <label>연락처</label>
              <input type="tel" v-model="deliveryForm.contact" class="form-input" placeholder="연락처를 입력하세요">
            </div>
            
            <div class="form-group">
              <label>차량번호</label>
              <input type="text" v-model="deliveryForm.vehicleNumber" class="form-input" placeholder="차량번호를 입력하세요">
            </div>
            
            <!-- 세 번째 줄: 납품일시, 검수일시 -->
            <div class="form-group">
              <label>납품일시</label>
              <div class="date-time-input">
                <input type="date" v-model="deliveryForm.deliveryDate" class="form-input date-input">
                <div class="time-inputs">
                  <select v-model="deliveryForm.deliveryHour" class="time-select">
                    <option value="">시</option>
                    <option v-for="hour in 24" :key="hour" :value="hour">{{ hour }} 시</option>
                  </select>
                  <select v-model="deliveryForm.deliveryMinute" class="time-select">
                    <option value="">분</option>
                    <option v-for="minute in 60" :key="minute" :value="minute">{{ minute }} 분</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>검수일시</label>
              <div class="date-time-input">
                <input type="date" v-model="deliveryForm.inspectionDate" class="form-input date-input">
                <div class="time-inputs">
                  <select v-model="deliveryForm.inspectionHour" class="time-select">
                    <option value="">시</option>
                    <option v-for="hour in 24" :key="hour" :value="hour">{{ hour }} 시</option>
                  </select>
                  <select v-model="deliveryForm.inspectionMinute" class="time-select">
                    <option value="">분</option>
                    <option v-for="minute in 60" :key="minute" :value="minute">{{ minute }} 분</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <!-- 빈 공간 -->
            </div>
            
            <!-- 네 번째 줄: 검수결과, 검수자 -->
            <div class="form-group">
              <label>검수결과</label>
              <select v-model="deliveryForm.inspectionResult" class="form-select">
                <option value="">검수결과를 선택하세요</option>
                <option value="합격">합격</option>
                <option value="불합격">불합격</option>
                <option value="조건부합격">조건부합격</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>검수자</label>
              <input type="text" v-model="deliveryForm.inspector" class="form-input" placeholder="검수자명을 입력하세요">
            </div>
            
            <div class="form-group">
              <!-- 빈 공간 -->
            </div>
            
            <!-- 다섯 번째 줄: 비고 -->
            <div class="form-group full-width">
              <label>비고</label>
              <input type="text" v-model="deliveryForm.remarks" class="form-input" placeholder="비고를 입력하세요">
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="bottom-actions">
        <button class="btn-primary" @click="register">등록</button>
        <button class="btn-secondary" @click="modify">수정</button>
        <button class="btn-secondary" @click="cancel">취소</button>
        <button class="btn-delete" @click="deleteDelivery">삭제</button>
      </div>
    </div>

    <!-- 운송장 목록 팝업 -->
    <div v-if="showTransportPopup" class="popup-overlay" @click="closeTransportPopup">
      <div class="popup-content" @click.stop>
        <div class="popup-header">
          <h3>운송장 목록</h3>
          <button @click="closeTransportPopup" class="popup-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="popup-body">
          <!-- 검색 조건 -->
          <div class="popup-search">
            <div class="search-row">
              <div class="date-range">
                <input type="date" v-model="transportSearch.startDate" class="form-input">
                <span class="date-separator">~</span>
                <input type="date" v-model="transportSearch.endDate" class="form-input">
              </div>
              <button class="btn-primary" @click="searchTransports">검색</button>
            </div>
          </div>
          
          <!-- 운송장 목록 테이블 -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>수요기관</th>
                  <th>운송장ID</th>
                  <th>출하일자</th>
                  <th>기사명</th>
                  <th>상태</th>
                  <th>선택</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(transport, index) in transportList" :key="index" class="table-row">
                  <td>{{ transport.client }}</td>
                  <td>{{ transport.transportId }}</td>
                  <td>{{ transport.shipmentDate }}</td>
                  <td>{{ transport.driverName }}</td>
                  <td>{{ transport.status }}</td>
                  <td>
                    <input 
                      type="radio" 
                      :name="'transport-select'" 
                      :value="transport.id"
                      v-model="selectedTransportId"
                      @change="selectTransport(transport)"
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="popup-footer">
          <button class="btn-primary" @click="confirmTransport">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#imports'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품확인 등록'
})

const router = useRouter()

// 납품확인 정보 폼
const deliveryForm = ref({
  transportId: '',
  clientName: '',
  managerContact: '',
  driverName: '',
  contact: '',
  vehicleNumber: '',
  deliveryDate: '2024-01-03',
  deliveryHour: 13,
  deliveryMinute: 30,
  inspectionDate: '2024-01-03',
  inspectionHour: 14,
  inspectionMinute: 0,
  inspectionResult: '',
  inspector: '',
  remarks: ''
})

// 운송장 검색
const transportSearch = ref({
  startDate: '2024-01-01',
  endDate: '2024-01-17'
})

// 운송장 목록
const transportList = ref([
  {
    id: 1,
    client: '전라남도 여수시',
    transportId: 'TR-2423428399-01',
    shipmentDate: '2025-08-08',
    driverName: '김기사',
    status: '배송중'
  },
  {
    id: 2,
    client: '경기도 화성시',
    transportId: 'TR-2423428000-01',
    shipmentDate: '2025-08-08',
    driverName: '이기사',
    status: '배송완료'
  }
])

// 팝업 관련
const showTransportPopup = ref(false)
const selectedTransportId = ref(null)

// 운송장ID 조회
const searchTransport = () => {
  showTransportPopup.value = true
}

// 운송장 검색
const searchTransports = () => {
  console.log('운송장 검색:', transportSearch.value)
}

// 운송장 선택
const selectTransport = (transport: any) => {
  console.log('선택된 운송장:', transport)
}

// 운송장 확인
const confirmTransport = () => {
  const selectedTransport = transportList.value.find(t => t.id === selectedTransportId.value)
  if (selectedTransport) {
    deliveryForm.value.transportId = selectedTransport.transportId
    deliveryForm.value.clientName = selectedTransport.client
    deliveryForm.value.driverName = selectedTransport.driverName
  }
  closeTransportPopup()
}

// 팝업 닫기
const closeTransportPopup = () => {
  showTransportPopup.value = false
  selectedTransportId.value = null
}

// 등록
const register = () => {
  console.log('등록:', deliveryForm.value)
}

// 수정
const modify = () => {
  console.log('수정')
}

// 취소
const cancel = () => {
  router.push('/admin/delivery/list')
}

// 삭제
const deleteDelivery = () => {
  if (confirm('정말 삭제하시겠습니까?')) {
    console.log('삭제')
  }
}
</script>

<style scoped>
/*
 * Delivery Register Page Styles
 * 공통 스타일은 admin-forms.css, admin-search.css에서 관리됩니다.
 * date-time-input, time-inputs 스타일은 admin-forms.css로 이동됨
 */

.delivery-register {
  padding: 2rem;
}

/* 페이지 특화: 날짜 입력 높이 조정 */
.date-input {
  flex: 1;
  min-width: 120px;
  height: 42px;
}

/* 페이지 특화: 팝업 검색 */
.popup-search {
  margin-bottom: 1.5rem;
}

.search-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-separator {
  color: #6b7280;
  font-weight: 500;
}

/* 반응형 - 페이지 특화 스타일만 유지 */
@media (max-width: 768px) {
  .delivery-register {
    padding: 1rem;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
