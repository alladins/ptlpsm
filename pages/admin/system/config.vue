<template>
  <div class="system-config">
    <PageHeader
      title="시스템설정"
      description="시스템 전반적인 설정을 관리합니다."
    />

    <!-- 설정 카테고리 탭 -->
    <div class="mb-6">
      <nav class="flex space-x-8 border-b border-gray-200">
        <button class="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
          기본 설정
        </button>
        <button class="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
          보안 설정
        </button>
        <button class="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
          알림 설정
        </button>
        <button class="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700">
          백업 설정
        </button>
      </nav>
    </div>

    <!-- 기본 설정 섹션 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-6">기본 설정</h2>
      
      <div class="space-y-6">
        <!-- 시스템 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">시스템명</label>
            <input
              type="text"
              value="PTPLPSM 출하관리 시스템"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">시스템 버전</label>
            <input
              type="text"
              value="v1.0.0"
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>

        <!-- 세션 설정 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">세션 타임아웃 (분)</label>
            <input
              type="number"
              value="30"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">최대 동시 접속자 수</label>
            <input
              type="number"
              value="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 파일 업로드 설정 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">최대 파일 크기 (MB)</label>
            <input
              type="number"
              value="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">허용 파일 확장자</label>
            <input
              type="text"
              value="jpg,jpeg,png,pdf,doc,docx,xls,xlsx"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 언어 및 지역 설정 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">기본 언어</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ko" selected>한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">시간대</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Asia/Seoul" selected>Asia/Seoul (UTC+9)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>
        </div>

        <!-- 시스템 상태 -->
        <div class="border-t pt-6">
          <h3 class="text-md font-medium text-gray-800 mb-4">시스템 상태</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">데이터베이스</p>
                  <p class="text-sm text-green-600">정상</p>
                </div>
              </div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">API 서버</p>
                  <p class="text-sm text-green-600">정상</p>
                </div>
              </div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">파일 서버</p>
                  <p class="text-sm text-green-600">정상</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 pt-6 border-t">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            저장
          </button>
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
  title: '시스템설정 - PTPLPSM',
  meta: [
    { name: 'description', content: '시스템 설정 관리' }
  ]
})
</script>
