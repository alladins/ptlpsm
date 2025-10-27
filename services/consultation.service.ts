// 상담 서비스
export interface ConsultationData {
  name: string;
  company?: string;
  phone: string;
  email: string;
  serviceType: string;
  message: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

export const consultationService = {
  /**
   * 상담 신청
   */
  async submitConsultation(data: ConsultationData) {
    try {
      console.log('📝 상담 신청 데이터:', data);
      
      // 실제 구현에서는 API 호출
      // const response = await $fetch('/api/consultation', {
      //   method: 'POST',
      //   body: data
      // });
      
      // 임시로 성공 응답 반환
      return { success: true, message: '상담 신청이 완료되었습니다.' };
    } catch (error) {
      console.error('상담 신청 실패:', error);
      throw error;
    }
  },

  /**
   * 상담 목록 조회 (관리자용)
   */
  async getConsultationList() {
    try {
      // 실제 구현에서는 API 호출
      return [];
    } catch (error) {
      console.error('상담 목록 조회 실패:', error);
      throw error;
    }
  }
};
