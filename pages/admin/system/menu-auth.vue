<template>
  <div class="menu-auth">
    <UiPageHeader
      title="메뉴권한관리"
      description="사용자 역할별 메뉴 접근 권한을 관리합니다."
    >
      <template #actions>
        <button class="btn-action">
          <i class="fas fa-search"></i>
          검색
        </button>
        <button class="btn-action btn-secondary">
          <i class="fas fa-undo"></i>
          초기화
        </button>
      </template>
    </UiPageHeader>

    <!-- 검색 조건 섹션 - 완전히 한 줄 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <!-- 역할명 -->
        <div class="search-item">
          <label>역할명:</label>
          <select class="role-select">
            <option value="">전체</option>
            <option value="SYSTEM_ADMIN">시스템 관리자</option>
            <option value="SHIPPING_MANAGER">출하 관리자</option>
            <option value="LEAD_POWER">리드파워</option>
            <option value="COURIER">택배사</option>
            <option value="VIEWER">조회자</option>
          </select>
        </div>

        <!-- 메뉴명 -->
        <div class="search-item">
          <label>메뉴명:</label>
          <input type="text" placeholder="메뉴명 입력" class="text-input" />
        </div>

        <!-- 권한 상태 -->
        <div class="search-item search-keyword">
          <label>권한상태:</label>
          <select class="keyword-input">
            <option value="">전체</option>
            <option value="Y">허용</option>
            <option value="N">차단</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 권한 관리 섹션 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 역할 목록 -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">역할 목록</h3>
          <div class="space-y-2">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer">
              <div class="font-medium text-blue-900">시스템 관리자</div>
              <div class="text-sm text-blue-700">SYSTEM_ADMIN</div>
            </div>
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100">
              <div class="font-medium text-gray-900">출하 관리자</div>
              <div class="text-sm text-gray-700">SHIPPING_MANAGER</div>
            </div>
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100">
              <div class="font-medium text-gray-900">리드파워</div>
              <div class="text-sm text-gray-700">LEAD_POWER</div>
            </div>
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100">
              <div class="font-medium text-gray-900">택배사</div>
              <div class="text-sm text-gray-700">COURIER</div>
            </div>
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100">
              <div class="font-medium text-gray-900">조회자</div>
              <div class="text-sm text-gray-700">VIEWER</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 메뉴 권한 설정 -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">메뉴 권한 설정</h3>
            <div class="flex space-x-2">
              <button class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                전체 허용
              </button>
              <button class="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                전체 차단
              </button>
            </div>
          </div>
          
          <div class="space-y-4">
            <!-- 영업관리 -->
            <div class="border border-gray-200 rounded-lg">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-gray-900">영업관리</span>
                  </div>
                  <span class="text-sm text-gray-500">메뉴</span>
                </div>
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">영업관리 목록</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">영업관리 등록</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
              </div>
            </div>

            <!-- 주문관리 -->
            <div class="border border-gray-200 rounded-lg">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-gray-900">주문관리</span>
                  </div>
                  <span class="text-sm text-gray-500">메뉴</span>
                </div>
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">주문관리 목록</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">주문관리 등록</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
              </div>
            </div>

            <!-- 기초정보 -->
            <div class="border border-gray-200 rounded-lg">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-gray-900">기초정보</span>
                  </div>
                  <span class="text-sm text-gray-500">메뉴</span>
                </div>
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">코드관리</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">품목관리</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">사용자관리</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">수요기관관리</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
              </div>
            </div>

            <!-- 시스템관리 -->
            <div class="border border-gray-200 rounded-lg">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-gray-900">시스템관리</span>
                  </div>
                  <span class="text-sm text-gray-500">메뉴</span>
                </div>
              </div>
              <div class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">시스템설정</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">메뉴권한관리</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3 ml-6">
                    <input type="checkbox" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">접근로그</span>
                  </div>
                  <span class="text-sm text-gray-500">페이지</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 저장 버튼 -->
          <div class="flex justify-end mt-6 pt-6 border-t">
            <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              권한 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

useHead({
  title: '메뉴권한관리 - PTPLPSM',
  meta: [
    { name: 'description', content: '메뉴 권한 관리' }
  ]
})
</script>

<style scoped>
/* 리팩토링: 공통 스타일은 admin-common.css에서 자동 로드됨 */
/* 페이지 특화 스타일만 작성 */

.menu-auth {
  padding: 2rem;
}

/* 페이지 특화: 역할 목록 및 권한 설정 UI는 Tailwind 클래스 사용 (별도 CSS 불필요) */
</style>
