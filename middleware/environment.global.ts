import { defineNuxtRouteMiddleware } from 'nuxt/app'

// 환경 설정 미들웨어
export default defineNuxtRouteMiddleware((to, from) => {
  // 현재 환경 확인
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 콘솔에 현재 환경 로깅 (개발 모드에서만)
  if (isDevelopment) {
    console.log('🔧 개발 모드에서 실행 중입니다.')
    console.log(`🌐 현재 경로: ${to.fullPath}`)
  }
  
  // 운영 환경에서는 콘솔 로그 최소화 - 정적 생성 시에는 비활성화
  if (isProduction && process.client && process.env.NUXT_STATIC !== 'true') {
    // 콘솔 로그 재정의 (운영 환경에서 중요 로그만 표시)
    const originalConsoleLog = console.log
    const originalConsoleInfo = console.info
    
    // 중요 로그만 남기고 나머지는 무시
    console.log = (...args) => {
      // 에러 관련 로그는 항상 표시
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('error') || arg.includes('오류') || arg.includes('❌'))
      )) {
        originalConsoleLog(...args)
      }
    }
    
    console.info = (...args) => {
      // 중요 정보 로그만 표시
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('important') || arg.includes('중요'))
      )) {
        originalConsoleInfo(...args)
      }
    }
  }
}) 