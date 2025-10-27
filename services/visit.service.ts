// 방문 추적 서비스
export const visitService = {
  /**
   * 현재 페이지 방문 기록
   */
  async recordCurrentPageVisit(pagePath: string, refererUrl: string = 'direct') {
    try {
      const visitData = {
        pagePath,
        refererUrl,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // API 호출 (실제 구현에서는 백엔드 API로 전송)
      console.log('📊 방문 데이터:', visitData);
      
      // 임시로 로컬 스토리지에 저장 (실제로는 API 호출)
      const visits = JSON.parse(localStorage.getItem('page_visits') || '[]');
      visits.push(visitData);
      localStorage.setItem('page_visits', JSON.stringify(visits));
      
      return { success: true, data: visitData };
    } catch (error) {
      console.error('방문 기록 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 방문 통계 조회
   */
  getVisitStats() {
    try {
      const visits = JSON.parse(localStorage.getItem('page_visits') || '[]');
      return visits;
    } catch (error) {
      console.error('방문 통계 조회 실패:', error);
      return [];
    }
  },

  /**
   * 방문 데이터 초기화
   */
  clearVisitData() {
    localStorage.removeItem('page_visits');
  }
};
