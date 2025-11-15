<template>
  <div class="statistics-sales">
    <PageHeader
      title="영업통계"
      description="영업 현황을 통계로 확인합니다."
    />

    <div class="content-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>총 영업건수</h3>
            <p class="stat-number">1,234</p>
            <p class="stat-change positive">+12.5%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>총 영업금액</h3>
            <p class="stat-number">₩12,345,678,900</p>
            <p class="stat-change positive">+8.3%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>활성 고객수</h3>
            <p class="stat-number">89</p>
            <p class="stat-change positive">+5.2%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="stat-content">
            <h3>성공률</h3>
            <p class="stat-number">78.5%</p>
            <p class="stat-change positive">+2.1%</p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-card">
          <h2>월별 영업 현황</h2>
          <div class="chart-placeholder">
            <i class="fas fa-chart-bar"></i>
            <p>차트 영역</p>
            <small>실제 구현 시 Chart.js 또는 D3.js 등을 사용하여 차트를 표시합니다.</small>
          </div>
        </div>

        <div class="chart-card">
          <h2>고객별 영업 현황</h2>
          <div class="chart-placeholder">
            <i class="fas fa-pie-chart"></i>
            <p>파이 차트 영역</p>
            <small>실제 구현 시 Chart.js 또는 D3.js 등을 사용하여 차트를 표시합니다.</small>
          </div>
        </div>
      </div>

      <div class="table-section">
        <h2>최근 영업 현황</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>고객명</th>
                <th>품목</th>
                <th>수량</th>
                <th>금액</th>
                <th>영업담당자</th>
                <th>상태</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in recentSales" :key="item.id">
                <td>{{ item.customerName }}</td>
                <td>{{ item.itemName }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.amount.toLocaleString() }}원</td>
                <td>{{ item.salesPerson }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td>{{ item.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSalesStatus } from '~/composables/useSalesStatus'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업통계'
})

// DB 기반 상태 관리 (영업 모듈 전용 - 한글 코드)
const { getStatusClass, loadStatusCodes } = useSalesStatus()

// 상태 코드 로드
onMounted(async () => {
  await loadStatusCodes()
})

// 임시 데이터
const recentSales = ref([
  {
    id: 1,
    customerName: 'ABC 기업',
    itemName: '제품 A',
    quantity: 100,
    amount: 5000000,
    salesPerson: '김영업',
    status: '진행중',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    customerName: 'XYZ 회사',
    itemName: '제품 B',
    quantity: 50,
    amount: 3750000,
    salesPerson: '이영업',
    status: '완료',
    createdAt: '2024-01-10'
  },
  {
    id: 3,
    customerName: 'DEF 기업',
    itemName: '제품 C',
    quantity: 200,
    amount: 6000000,
    salesPerson: '박영업',
    status: '진행중',
    createdAt: '2024-01-20'
  }
])
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.statistics-sales)
   - 버튼 스타일 (.btn-action)
   - 검색 영역 스타일 (.search-section-compact)
   - 테이블 스타일 (.data-table)
   ============================================ */

/* 페이지 특화 스타일만 작성 */

.content-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.75rem;
  margin: 0;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.chart-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.chart-placeholder {
  height: 300px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.chart-placeholder p {
  font-size: 1.125rem;
  margin: 0 0 0.5rem 0;
}

.chart-placeholder small {
  text-align: center;
  opacity: 0.7;
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-progress {
  background: #fef3c7;
  color: #92400e;
}

.status-complete {
  background: #dcfce7;
  color: #166534;
}

.status-cancel {
  background: #fef2f2;
  color: #dc2626;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  
  .stat-content h3 {
    font-size: 0.875rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .chart-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .chart-card {
    padding: 1rem;
  }
  
  .chart-placeholder {
    height: 200px;
  }
  
  .chart-placeholder i {
    font-size: 2rem;
  }
  
  .chart-placeholder p {
    font-size: 1rem;
  }
  
  .table-section {
    padding: 1rem;
  }
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
  
  /* 모바일에서 숨길 컬럼들 */
  .data-table th:nth-child(2),
  .data-table th:nth-child(3),
  .data-table th:nth-child(4),
  .data-table th:nth-child(5),
  .data-table td:nth-child(2),
  .data-table td:nth-child(3),
  .data-table td:nth-child(4),
  .data-table td:nth-child(5) {
    display: none;
  }
}
</style>
