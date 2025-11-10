import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
    const authStore = useAuthStore()

    // 페이지 로드 시 localStorage에서 인증 정보 복원
    console.log('🔐 Auth 초기화 시작...')
    await authStore.checkAuth()

    console.log('✅ Auth 초기화 완료:', {
        isLoggedIn: authStore.isLoggedIn,
        hasToken: !!authStore.accessToken,
        user: authStore.user?.userName || 'Unknown'
    })
})