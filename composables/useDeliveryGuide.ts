import { ref } from 'vue'
import { safeStorage } from '~/utils/storage'

/**
 * 배달기사용 납품확인 매뉴얼 가이드 팝업 상태를 관리하는 composable
 */
export function useDeliveryGuide(storageKey = 'guide_mobileDelivery_dismissed') {
  const isOpen = ref(false)

  // 저장된 "다시 보지 않기" 상태가 없으면 true (팝업 노출)
  const shouldShow = (): boolean => safeStorage.getItem(storageKey) !== '1'

  // 팝업 열기
  const open = () => { isOpen.value = true }

  // 팝업 닫기 (remember=true 이면 localStorage에 '1' 저장)
  const close = (remember = false) => {
    if (remember) safeStorage.setItem(storageKey, '1')
    isOpen.value = false
  }

  // 도움말 버튼으로 다시 열기: 저장값 삭제 후 오픈
  const reopen = () => {
    safeStorage.removeItem(storageKey)
    isOpen.value = true
  }

  return { isOpen, shouldShow, open, close, reopen }
}
