import { defineNuxtRouteMiddleware } from 'nuxt/app'
import { visitService } from '~/services/visit.service'
import { nextTick } from 'vue'

// 하이드레이션 감지를 위한 전역 변수
let isHydrating = true;
let hydrationTimeout: any = null;

// 방문 추적 미들웨어
export default defineNuxtRouteMiddleware((to, from) => {
  console.log('🔍 방문 추적 미들웨어 실행:', to.path);
  
  // 클라이언트 사이드에서만 실행
  if (process.client) {
    console.log('💻 클라이언트 사이드 확인');
    
    // 하이드레이션 완료 후 상태 업데이트를 위한 타임아웃 설정
    if (isHydrating && !hydrationTimeout) {
      console.log('🔄 하이드레이션 감지 타이머 설정');
      hydrationTimeout = setTimeout(() => {
        console.log('✅ 하이드레이션 완료 처리');
        isHydrating = false;
        hydrationTimeout = null;
      }, 500); // 500ms로 시간 단축
    }
    
    // 페이지 로드 완료 후 방문 기록 전송
    // nextTick을 사용하여 DOM이 완전히 로드된 후 실행
    nextTick(() => {
      // 방문 제외 경로
      const excludePaths = [
        '/login',
        '/logout',
        '/admin',  // admin 경로 제외 유지
        '/_nuxt',
        '/api'
      ]
      
      // admin 경로 중에서도 상담 신청 관련 페이지는 포함
      // const includePaths = [
      //   '/consultation',
      //   '/contact',
      //   '/inquiry'
      // ]
      
      const shouldTrack = 
        (!excludePaths.some(path => to.path.startsWith(path)))
      
      if (shouldTrack) {
        console.log('✨ 방문 기록 시작:', to.fullPath);
        
        // 중복 호출 방지를 위한 로컬 스토리지 키 생성
        const visitKey = `visit_${to.fullPath}`;
        const lastVisitTime = localStorage.getItem(visitKey);
        
        const now = Date.now();
        
        // 5초 이내 동일 페이지 방문 기록은 무시
        if (lastVisitTime) {
          const lastTime = parseInt(lastVisitTime);
          if (now - lastTime < 5000) {
            console.log('🔄 최근 5초 이내 동일 페이지 방문 기록이 있어 무시합니다:', {
              경로: to.fullPath,
              마지막방문: new Date(lastTime).toLocaleString(),
              현재시간: new Date(now).toLocaleString(),
              경과시간: `${(now - lastTime) / 1000}초`
            });
            return;
          }
        }
        
        // 현재 방문 기록 저장
        localStorage.setItem(visitKey, now.toString());
        
        // from 라우트 정보를 사용하여 이전 페이지 URL 설정
        const refererUrl = from.path !== '/' && from.path !== to.path 
          ? window.location.origin + from.fullPath
          : document.referrer || 'direct'

        console.log('📊 방문 기록 데이터 준비:', {
          현재경로: to.fullPath,
          이전경로: refererUrl,
          시간: new Date().toLocaleString()
        });

        visitService.recordCurrentPageVisit(to.fullPath, refererUrl)
          .then(() => {
            console.log('✅ 방문 기록 API 호출 성공');
          })
          .catch(error => {
            console.error('❌ 방문 기록 API 호출 실패:', error);
            if (process.dev) {
              console.error('방문 기록 저장 중 오류 상세:', {
                메시지: error.message,
                스택: error.stack,
                응답: error.response?.data
              });
            }
          })
      } else {
        console.log('🚫 방문 기록 제외됨:', to.path);
      }
    })
  }
}) 