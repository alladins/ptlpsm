<template>
  <div style="min-height: 80vh; padding-top: 30px;">
    <!-- 메인 비주얼 섹션 -->
    <section style="position: relative; min-height: 80vh; background-color: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      <!-- 배경 비디오 -->
      <video 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;"
        autoplay 
        muted 
        loop 
        playsinline
      >
        <source src="/images/main/intro.mp4" type="video/mp4">
      </video>
      
      <!-- 배경 오버레이 (비디오 위에 어두운 레이어) -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); z-index: 2;"></div>
      
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem; text-align: center; position: relative; z-index: 10;">
        <div style="margin-bottom: 3rem;">
          <img 
            src="/images/common/logo.png" 
            alt="PTPLPSM 로고" 
            style="margin: 0 auto 2rem; width: 12rem; height: auto; max-width: 16rem;"
          />
        </div>
        
        <h1 style="font-size: 2.25rem; font-weight: bold; margin-bottom: 1.5rem; line-height: 1.2; color: white;">
          통합 출하관리 시스템
        </h1>
        <p style="font-size: 1.25rem; margin-bottom: 2rem; font-weight: 300; color: #e5e7eb;">
          PTPLPSM
        </p>
        <p style="font-size: 1.125rem; margin-bottom: 3rem; max-width: 64rem; margin-left: auto; margin-right: auto; line-height: 1.75; color: #f3f4f6;">
          365일, 24시간 중단 없이 운영되는 출하관리 시스템으로<br>
          <strong style="color: #60a5fa;">효율적인 출하 프로세스 관리</strong>와 <strong style="color: #60a5fa;">비즈니스 성장</strong>을 지원합니다
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem; justify-content: center; align-items: center;">
          <button
            style="background-color: #2563eb; color: white; padding: 1rem 2.5rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;"
            @click="goToAdmin"
          >
            <span style="display: flex; align-items: center; gap: 0.5rem;">
              관리자 시스템
              <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          </button>
          <!--button
            class="group border-2 border-primary text-primary px-10 py-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105"
            @click="showAlert('시스템 데모는 준비 중입니다.')"
          >
            <span class="flex items-center gap-2">
              시스템 데모
              <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </span>
          </button-->
        </div>
      </div>            
    </section>   

    <!-- 제품 소개 섹션 -->
    <section style="padding: 5rem 0; background-color: white;">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
        <div style="text-align: center; margin-bottom: 4rem;">
          <h2 style="font-size: 2.25rem; font-weight: bold; margin-bottom: 1.5rem; color: #1f2937;">
            Our Product
          </h2>
          <p style="font-size: 1.125rem; color: #6b7280; max-width: 48rem; margin: 0 auto;">
            PTPLPSM 통합 출하관리 시스템
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;">
          <div>
            <h3 style="font-size: 1.875rem; font-weight: bold; margin-bottom: 1.5rem; color: #1f2937;">PTPLPSM</h3>
            <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.75;">
              통합 출하관리 시스템 PTPLPSM은 다양한 업무 프로세스를 수용하여 
              상황판에 효과적으로 전시, 표출할 수 있는 제품입니다.
            </p>
            <ul style="margin-bottom: 2rem;">
              <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
                <svg style="width: 1.5rem; height: 1.5rem; color: #2563eb; margin-top: 0.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span style="color: #374151;">실시간 출하 현황 모니터링</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
                <svg style="width: 1.5rem; height: 1.5rem; color: #2563eb; margin-top: 0.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span style="color: #374151;">자동화된 워크플로우 관리</span>
              </li>
              <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
                <svg style="width: 1.5rem; height: 1.5rem; color: #2563eb; margin-top: 0.25rem; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span style="color: #374151;">통합 데이터 분석 및 리포트</span>
              </li>
            </ul>
            <button style="background-color: #2563eb; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; transition: background-color 0.3s ease;">
              더 알아보기
            </button>
          </div>
          
          <div style="display: flex; justify-content: center;">
            <div style="background: linear-gradient(to bottom right, #2563eb, #1d4ed8); border-radius: 0.5rem; padding: 2rem; text-align: center; color: white;">
              <svg style="width: 8rem; height: 8rem; margin: 0 auto 1.5rem; display: block;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
              <h4 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">통합 관리 시스템</h4>
              <p style="font-size: 1.125rem; opacity: 0.9;">모든 출하 프로세스를 한 곳에서 관리</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 문의 섹션 -->
    <section style="padding: 5rem 0; background-color: #f9fafb;">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem; text-align: center;">
        <h2 style="font-size: 2.25rem; font-weight: bold; margin-bottom: 1.5rem; color: #1f2937;">
          지금 바로 문의하세요
        </h2>
        <p style="font-size: 1.125rem; margin-bottom: 3rem; max-width: 48rem; margin-left: auto; margin-right: auto; color: #6b7280;">
          PTPLPSM은 고객 문의를 신속히 처리하기 위해 노력하고 있습니다.
        </p>
        <div style="display: flex; flex-direction: column; gap: 1.5rem; justify-content: center; align-items: center;">
          <button style="background-color: #2563eb; color: white; padding: 1rem 2.5rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; transition: background-color 0.3s ease;">
            PTPLPSM에 문의하기
          </button>
          <button style="border: 2px solid #2563eb; color: #2563eb; padding: 1rem 2.5rem; border-radius: 0.5rem; font-weight: 600; background-color: transparent; cursor: pointer; transition: all 0.3s ease;">
            A/S 문의
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '#imports'

useHead({
  title: 'PTPLPSM - 통합 출하관리 시스템',
  meta: [
    { name: 'description', content: 'PTPLPSM 통합 출하관리 시스템 - 365일 24시간 중단 없는 효율적인 출하 프로세스 관리' }
  ]
})

const router = useRouter()

const showAlert = (message: string) => {
  if (process.client) {
    alert(message)
  }
}

const goToAdmin = () => {
  // 로그인 페이지로 이동
  router.push('/login')
}
</script>

<style scoped>
.bg-primary {
  background-color: #2563eb;
}

.bg-primary-dark {
  background-color: #1d4ed8;
}

.bg-primary-darker {
  background-color: #1e40af;
}

.text-primary {
  color: #2563eb;
}

.text-primary-dark {
  color: #1d4ed8;
}

.border-primary {
  border-color: #2563eb;
}

.stat-item {
  padding: 2rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
}

.stat-item:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.solution-card {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  transform: translateY(0);
}

.solution-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(-0.5rem);
}

.card-icon {
  display: flex;
  justify-content: center;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-info > * + * {
  margin-top: 1.5rem;
}

.product-image {
  display: flex;
  justify-content: center;
}

/* 애니메이션 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.solution-card {
  animation: fadeInUp 0.6s ease-out;
}

.solution-card:nth-child(2) {
  animation-delay: 0.2s;
}

.solution-card:nth-child(3) {
  animation-delay: 0.4s;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .stat-item {
    padding: 1.5rem;
  }

  .solution-card {
    padding: 1.5rem;
  }

  .product-info {
    text-align: center;
  }
}
</style>
