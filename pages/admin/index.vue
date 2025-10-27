<template>
  <client-only>
    <div class="admin-dashboard">
      <!-- 페이지 헤더 -->
      <div class="page-header">
        <h1 class="page-title">대시보드</h1>
        <p class="page-description">PTPLPSM 출하관리 시스템 현황</p>
      </div>

      <!-- 통계 카드 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon sales">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.salesCount }}</div>
            <div class="stat-label">총 영업건수</div>
            <div class="stat-change positive">
              <i class="fas fa-arrow-up"></i>
              +12.5%
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon order">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.orderCount }}</div>
            <div class="stat-label">총 발주건수</div>
            <div class="stat-change positive">
              <i class="fas fa-arrow-up"></i>
              +8.3%
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon shipping">
            <i class="fas fa-truck"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.shippingCount }}</div>
            <div class="stat-label">총 출하건수</div>
            <div class="stat-change positive">
              <i class="fas fa-arrow-up"></i>
              +15.2%
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon delivery">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.deliveryCount }}</div>
            <div class="stat-label">총 납품건수</div>
            <div class="stat-change positive">
              <i class="fas fa-arrow-up"></i>
              +6.8%
            </div>
          </div>
        </div>
      </div>

      <!-- 콘텐츠 그리드 -->
      <div class="content-grid">
        <!-- 최근 활동 -->
        <div class="content-section">
          <div class="section-header">
            <h2>최근 활동</h2>
          </div>
          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon">
                <i :class="activity.icon"></i>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 빠른 액션 -->
        <div class="content-section">
          <div class="section-header">
            <h2>빠른 액션</h2>
          </div>
          <div class="quick-actions">
            <button class="action-btn" @click="goToSales">
              <i class="fas fa-plus"></i>
              <span>영업 등록</span>
            </button>
            <button class="action-btn" @click="goToOrder">
              <i class="fas fa-shopping-cart"></i>
              <span>발주 등록</span>
            </button>
            <button class="action-btn" @click="goToShipping">
              <i class="fas fa-truck"></i>
              <span>출하 등록</span>
            </button>
            <button class="action-btn" @click="goToTransport">
              <i class="fas fa-route"></i>
              <span>운송장 관리</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'

// 레이아웃 설정
definePageMeta({
  layout: 'admin'
})

// Router
const router = useRouter()

// Reactive data
const stats = ref({
  salesCount: 1234,
  orderCount: 856,
  shippingCount: 743,
  deliveryCount: 689
})

const recentActivities = ref([
  {
    id: 1,
    type: 'sales',
    icon: 'fas fa-chart-line',
    title: '새로운 영업 건이 등록되었습니다',
    description: '고객사 A와의 계약이 체결되었습니다.',
    time: '5분 전'
  },
  {
    id: 2,
    type: 'order',
    icon: 'fas fa-shopping-cart',
    title: '발주 요청이 접수되었습니다',
    description: '주문번호 #12345의 발주가 요청되었습니다.',
    time: '15분 전'
  },
  {
    id: 3,
    type: 'shipping',
    icon: 'fas fa-truck',
    title: '출하가 완료되었습니다',
    description: '주문번호 #12344의 출하가 완료되었습니다.',
    time: '1시간 전'
  },
  {
    id: 4,
    type: 'delivery',
    icon: 'fas fa-check-circle',
    title: '납품이 확인되었습니다',
    description: '주문번호 #12343의 납품이 확인되었습니다.',
    time: '2시간 전'
  }
])

// Methods
const goToSales = () => {
  router.push('/admin/sales/list')
}

const goToOrder = () => {
  router.push('/admin/order/list')
}

const goToShipping = () => {
  router.push('/admin/shipping/list')
}

const goToTransport = () => {
  router.push('/admin/transport/list')
}

// Lifecycle
onMounted(() => {
  // 대시보드 데이터 로딩
  console.log('관리자 대시보드 로딩')
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.sales {
  background: #3b82f6;
}

.stat-icon.order {
  background: #8b5cf6;
}

.stat-icon.shipping {
  background: #06b6d4;
}

.stat-icon.delivery {
  background: #10b981;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-change {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.content-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.view-all-btn {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.view-all-btn:hover {
  text-decoration: underline;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
}

.activity-icon.sales {
  background-color: #667eea;
}

.activity-icon.order {
  background-color: #f093fb;
}

.activity-icon.shipping {
  background-color: #4facfe;
}

.activity-icon.delivery {
  background-color: #43e97b;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.activity-description {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #bdc3c7;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1f2937;
  text-decoration: none;
}

.action-btn:hover {
  background: white;
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.action-btn i {
  font-size: 22px;
}

.action-btn span {
  font-size: 14px;
  font-weight: 500;
}

/* 반응형 */
@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
