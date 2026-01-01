<template>
  <div class="statistics-region">
    <PageHeader
      title="지역별 통계"
      description="지역별 영업 현황을 통계로 확인합니다."
    />

    <div class="content-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div class="stat-content">
            <h3>활성 지역수</h3>
            <p class="stat-number">16</p>
            <p class="stat-change positive">+2</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="stat-content">
            <h3>총 고객사</h3>
            <p class="stat-number">89</p>
            <p class="stat-change positive">+5</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-pie"></i>
          </div>
          <div class="stat-content">
            <h3>평균 영업금액</h3>
            <p class="stat-number">₩138,715,494</p>
            <p class="stat-change positive">+12.3%</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-trophy"></i>
          </div>
          <div class="stat-content">
            <h3>최고 영업지역</h3>
            <p class="stat-number">서울</p>
            <p class="stat-change">₩2.1B</p>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-card">
          <h2>지역별 영업 현황</h2>
          <div class="chart-placeholder">
            <i class="fas fa-chart-bar"></i>
            <p>지역별 차트 영역</p>
            <small>실제 구현 시 Chart.js 또는 D3.js 등을 사용하여 차트를 표시합니다.</small>
          </div>
        </div>

        <div class="chart-card">
          <h2>지역별 고객 분포</h2>
          <div class="chart-placeholder">
            <i class="fas fa-pie-chart"></i>
            <p>파이 차트 영역</p>
            <small>실제 구현 시 Chart.js 또는 D3.js 등을 사용하여 차트를 표시합니다.</small>
          </div>
        </div>
      </div>

      <div class="table-section">
        <h2>지역별 상세 현황</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>지역</th>
                <th>고객수</th>
                <th>영업건수</th>
                <th>총 영업금액</th>
                <th>평균 금액</th>
                <th>성공률</th>
                <th>담당자</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in regionData" :key="item.id">
                <td>{{ item.region }}</td>
                <td>{{ item.customerCount }}</td>
                <td>{{ item.salesCount }}</td>
                <td>{{ item.totalAmount.toLocaleString() }}원</td>
                <td>{{ item.averageAmount.toLocaleString() }}원</td>
                <td>
                  <span class="success-rate" :class="getSuccessRateClass(item.successRate)">
                    {{ item.successRate }}%
                  </span>
                </td>
                <td>{{ item.manager }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  pageTitle: '지역별통계'
})

// 임시 데이터
const regionData = ref([
  {
    id: 1,
    region: '서울',
    customerCount: 25,
    salesCount: 156,
    totalAmount: 2100000000,
    averageAmount: 13461538,
    successRate: 85,
    manager: '김영업'
  },
  {
    id: 2,
    region: '부산',
    customerCount: 18,
    salesCount: 98,
    totalAmount: 1450000000,
    averageAmount: 14795918,
    successRate: 78,
    manager: '이영업'
  },
  {
    id: 3,
    region: '대구',
    customerCount: 12,
    salesCount: 67,
    totalAmount: 890000000,
    averageAmount: 13283582,
    successRate: 82,
    manager: '박영업'
  },
  {
    id: 4,
    region: '인천',
    customerCount: 15,
    salesCount: 89,
    totalAmount: 1120000000,
    averageAmount: 12584270,
    successRate: 75,
    manager: '최영업'
  },
  {
    id: 5,
    region: '광주',
    customerCount: 8,
    salesCount: 45,
    totalAmount: 580000000,
    averageAmount: 12888889,
    successRate: 80,
    manager: '정영업'
  }
])

const getSuccessRateClass = (rate: number) => {
  if (rate >= 80) return 'high'
  if (rate >= 70) return 'medium'
  return 'low'
}
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.statistics-region)
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
  background: #10b981;
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

.success-rate {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.success-rate.high {
  background: #dcfce7;
  color: #166534;
}

.success-rate.medium {
  background: #fef3c7;
  color: #92400e;
}

.success-rate.low {
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
  .data-table th:nth-child(3),
  .data-table th:nth-child(4),
  .data-table th:nth-child(5),
  .data-table td:nth-child(3),
  .data-table td:nth-child(4),
  .data-table td:nth-child(5) {
    display: none;
  }
}
</style>
