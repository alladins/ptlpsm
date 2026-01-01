<template>
  <div class="profile-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div class="header-text">
        <h1 class="page-title">내 정보</h1>
        <p class="page-description">내 계정 정보를 확인하고 수정할 수 있습니다.</p>
      </div>
    </div>

    <!-- 프로필 카드 -->
    <div class="profile-card">
      <div class="profile-card-header">
        <div class="profile-avatar">
          <span class="avatar-text">{{ currentUser.userName?.charAt(0) || 'U' }}</span>
        </div>
        <div class="profile-summary">
          <h2 class="profile-name">{{ currentUser.userName }}</h2>
          <p class="profile-role">
            <span class="role-badge" :class="getRoleClass(currentUser.role)">
              {{ getRoleName(currentUser.role) }}
            </span>
            <span class="status-badge" :class="currentUser.enabled ? 'active' : 'inactive'">
              {{ currentUser.enabled ? '활성' : '비활성' }}
            </span>
          </p>
          <p class="profile-company">{{ currentUser.companyName || '-' }}</p>
        </div>
        <button class="btn-edit" @click="openEditModal">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          정보 수정
        </button>
      </div>
    </div>

    <!-- 기본 정보 섹션 -->
    <div class="info-section">
      <div class="section-header">
        <div class="section-icon section-icon-blue">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
        </div>
        <h2 class="section-title">기본 정보</h2>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">사용자 ID</span>
            <span class="info-value">{{ currentUser.loginId }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">이름</span>
            <span class="info-value">{{ currentUser.userName }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">이메일</span>
            <span class="info-value">{{ currentUser.email || '-' }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">연락처</span>
            <span class="info-value">{{ currentUser.phone || '-' }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">부서</span>
            <span class="info-value">{{ currentUser.department || '-' }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">직급</span>
            <span class="info-value">{{ currentUser.position || '-' }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">사원번호</span>
            <span class="info-value">{{ currentUser.employeeNumber || '-' }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">소속회사</span>
            <span class="info-value">{{ currentUser.companyName || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 계정 정보 섹션 -->
    <div class="info-section">
      <div class="section-header">
        <div class="section-icon section-icon-green">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="section-title">계정 정보</h2>
      </div>

      <div class="info-grid info-grid-2">
        <div class="info-card">
          <div class="info-card-icon icon-green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">가입일</span>
            <span class="info-value">{{ formatDate(currentUser.createdAt) }}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-icon icon-green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div class="info-card-content">
            <span class="info-label">최종 수정일</span>
            <span class="info-value">{{ formatDate(currentUser.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 보안 섹션 -->
    <div class="info-section security-section">
      <div class="section-header">
        <div class="section-icon section-icon-orange">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 class="section-title">보안</h2>
        <button class="btn-password" @click="openPasswordModal">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          비밀번호 변경
        </button>
      </div>

      <div class="security-card">
        <div class="security-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div class="security-content">
          <h3 class="security-title">비밀번호</h3>
          <p class="security-desc">정기적으로 비밀번호를 변경하여 계정을 보호하세요.</p>
          <div class="security-meta">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>마지막 변경일: {{ formatDate(currentUser.passwordChangedAt) || '정보 없음' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 정보 수정 모달 -->
    <Transition name="modal">
      <div v-if="showEditModal" class="ccm-modal-overlay" @click="closeEditModal">
        <div class="ccm-modal-container ccm-modal-large" @click.stop>
          <!-- 헤더 -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="ccm-header-text">
                <h3 class="ccm-modal-title">내 정보 수정</h3>
                <span class="ccm-modal-subtitle">개인정보를 수정합니다</span>
              </div>
            </div>
            <button class="ccm-close-button" @click="closeEditModal">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 바디 -->
          <div class="ccm-modal-body">
            <form @submit.prevent="submitProfileUpdate" class="ccm-form">
              <!-- 사용자 ID & 이름 -->
              <div class="ccm-form-row">
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                    사용자 ID
                  </label>
                  <input
                    v-model="profileForm.loginId"
                    type="text"
                    class="ccm-form-input"
                    disabled
                  >
                  <span class="ccm-field-hint">사용자 ID는 변경할 수 없습니다</span>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    이름
                  </label>
                  <input
                    v-model="profileForm.userName"
                    type="text"
                    class="ccm-form-input"
                    :class="{ 'ccm-input-error': validationErrors.userName }"
                    required
                    placeholder="이름을 입력하세요"
                    @input="validateField('userName', profileForm.userName)"
                    @blur="validateField('userName', profileForm.userName)"
                  >
                  <span v-if="validationErrors.userName" class="ccm-error-message">
                    {{ validationErrors.userName }}
                  </span>
                </div>
              </div>

              <!-- 이메일 & 연락처 -->
              <div class="ccm-form-row">
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    이메일
                  </label>
                  <input
                    v-model="profileForm.email"
                    type="email"
                    class="ccm-form-input"
                    :class="{ 'ccm-input-error': validationErrors.email }"
                    placeholder="이메일을 입력하세요"
                    @input="validateField('email', profileForm.email)"
                    @blur="handleEmailBlur"
                  >
                  <span v-if="validationErrors.email" class="ccm-error-message">
                    {{ validationErrors.email }}
                  </span>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    연락처
                  </label>
                  <input
                    v-model="profileForm.phone"
                    type="text"
                    class="ccm-form-input"
                    :class="{ 'ccm-input-error': validationErrors.phone }"
                    required
                    placeholder="000-0000-0000"
                    @input="handlePhoneInput"
                    @blur="validateField('phone', profileForm.phone)"
                  >
                  <span v-if="validationErrors.phone" class="ccm-error-message">
                    {{ validationErrors.phone }}
                  </span>
                </div>
              </div>

              <!-- 부서 & 직급 -->
              <div class="ccm-form-row">
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    부서
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <input
                    v-model="profileForm.department"
                    type="text"
                    class="ccm-form-input"
                    placeholder="부서를 입력하세요"
                  >
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                    </svg>
                    직급
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <input
                    v-model="profileForm.position"
                    type="text"
                    class="ccm-form-input"
                    placeholder="직급을 입력하세요"
                  >
                </div>
              </div>

              <!-- 사원번호 & 소속회사 -->
              <div class="ccm-form-row">
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                    </svg>
                    사원번호
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <input
                    v-model="profileForm.employeeNumber"
                    type="text"
                    class="ccm-form-input"
                    placeholder="사원번호를 입력하세요"
                  >
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                    소속회사
                  </label>
                  <input
                    v-model="profileForm.companyName"
                    type="text"
                    class="ccm-form-input"
                    disabled
                  >
                  <span class="ccm-field-hint">소속회사 변경은 관리자에게 문의하세요</span>
                </div>
              </div>
            </form>
          </div>

          <!-- 푸터 -->
          <div class="ccm-modal-footer">
            <button class="ccm-btn-cancel" @click="closeEditModal">
              취소
            </button>
            <button class="ccm-btn-confirm" @click="submitProfileUpdate">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              저장
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 비밀번호 변경 모달 -->
    <Transition name="modal">
      <div v-if="showPasswordModal" class="ccm-modal-overlay" @click="closePasswordModal">
        <div class="ccm-modal-container ccm-modal-medium" @click.stop>
          <!-- 헤더 -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-orange">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div class="ccm-header-text">
                <h3 class="ccm-modal-title">비밀번호 변경</h3>
                <span class="ccm-modal-subtitle">계정 보안을 위해 비밀번호를 변경합니다</span>
              </div>
            </div>
            <button class="ccm-close-button" @click="closePasswordModal">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 바디 -->
          <div class="ccm-modal-body">
            <!-- 안내 메시지 -->
            <div class="ccm-info-banner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p>새 비밀번호와 확인 비밀번호를 입력하세요.</p>
            </div>

            <form @submit.prevent="submitPasswordChange" class="ccm-form">
              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  새 비밀번호
                </label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="ccm-form-input ccm-focus-orange"
                  :class="{ 'ccm-input-error': passwordValidationErrors.newPassword }"
                  required
                  placeholder="새 비밀번호를 입력하세요"
                  @input="validatePasswordField('newPassword', passwordForm.newPassword)"
                  @blur="validatePasswordField('newPassword', passwordForm.newPassword)"
                >
                <span v-if="passwordValidationErrors.newPassword" class="ccm-error-message">
                  {{ passwordValidationErrors.newPassword }}
                </span>
                <span v-else class="ccm-field-hint">영문, 숫자, 특수문자 조합 6~100자</span>
              </div>

              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <svg class="ccm-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  새 비밀번호 확인
                </label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="ccm-form-input ccm-focus-orange"
                  :class="{ 'ccm-input-error': passwordValidationErrors.confirmPassword }"
                  required
                  placeholder="새 비밀번호를 다시 입력하세요"
                  @input="validatePasswordField('confirmPassword', passwordForm.confirmPassword)"
                  @blur="validatePasswordField('confirmPassword', passwordForm.confirmPassword)"
                >
                <span v-if="passwordValidationErrors.confirmPassword" class="ccm-error-message">
                  {{ passwordValidationErrors.confirmPassword }}
                </span>
              </div>
            </form>
          </div>

          <!-- 푸터 -->
          <div class="ccm-modal-footer">
            <button class="ccm-btn-cancel" @click="closePasswordModal">
              취소
            </button>
            <button class="ccm-btn-confirm ccm-orange" @click="submitPasswordChange">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  pageTitle: '내 정보'
})

// API 서비스
import { userService } from '~/services/user.service'
import { formatPhoneNumberInput, normalizeEmail } from '~/utils/format'

// 반응형 데이터
const currentUser = ref<any>({
  userid: 1,
  loginId: 'admin',
  userName: '시스템관리자',
  email: 'admin@ptlpsm.com',
  phone: '010-1234-5678',
  department: 'IT팀',
  position: '팀장',
  employeeNumber: 'EMP001',
  companyName: 'PTLPSM',
  role: 'SYSTEM_ADMIN',
  enabled: true,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
  passwordChangedAt: '2024-01-01T00:00:00'
})

// 모달 관련
const showEditModal = ref(false)
const showPasswordModal = ref(false)

// 프로필 수정 폼
const profileForm = ref({
  userId: '',
  userName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  employeeNumber: '',
  companyName: '',
  address: '',
  addressDetail: '',
  zipCode: ''
})

// 비밀번호 변경 폼
const passwordForm = ref({
  // currentPassword: '', // 현재 비밀번호 필드 제거
  newPassword: '',
  confirmPassword: ''
})

// 유효성 검사 오류 메시지
const validationErrors = ref<{
  userName: string
  email: string
  phone: string
  [key: string]: string
}>({
  userName: '',
  email: '',
  phone: ''
})

// 비밀번호 변경 유효성 검사 오류 메시지
const passwordValidationErrors = ref<{
  // currentPassword: string // 현재 비밀번호 필드 제거
  newPassword: string
  confirmPassword: string
  [key: string]: string
}>({
  // currentPassword: '', // 현재 비밀번호 필드 제거
  newPassword: '',
  confirmPassword: ''
})

// 이메일 유효성 검사 함수
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 전화번호 유효성 검사 함수
const isValidPhone = (phone: string) => {
  const phoneRegex = /^\d{3}-\d{4}-\d{4}$/
  return phoneRegex.test(phone)
}

// 전화번호 입력 처리 함수 (공통 함수 사용 - 길이 제한 포함)
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  profileForm.value.phone = formatPhoneNumberInput(target.value)
}

// 이메일 정규화 (공통 함수 사용 - 소문자 변환 및 공백 제거)
const handleEmailBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  profileForm.value.email = normalizeEmail(target.value)
  // 정규화 후 유효성 검사 재실행
  validateField('email', profileForm.value.email)
}

// 실시간 유효성 검사
const validateField = (field: string, value: string) => {
  validationErrors.value[field] = ''
  
  switch (field) {
    case 'userName':
      if (!value.trim()) {
        validationErrors.value.userName = '이름은 필수입니다.'
      } else if (value.length > 50) {
        validationErrors.value.userName = '이름은 50자를 초과할 수 없습니다.'
      }
      break
      
    case 'email':
      if (value && !isValidEmail(value)) {
        validationErrors.value.email = '올바른 이메일 형식이어야 합니다.'
      } else if (value && value.length > 100) {
        validationErrors.value.email = '이메일은 100자를 초과할 수 없습니다.'
      }
      break
      
    case 'phone':
      if (!value.trim()) {
        validationErrors.value.phone = '연락처는 필수입니다.'
      } else if (!isValidPhone(value)) {
        validationErrors.value.phone = '올바른 전화번호 형식이어야 합니다. (예: 010-1234-5678)'
      }
      break
  }
}

// 비밀번호 변경 유효성 검사
const validatePasswordField = (field: string, value: string) => {
  passwordValidationErrors.value[field] = ''
  
  switch (field) {
    // case 'currentPassword': // 현재 비밀번호 필드 제거
    //   if (!value.trim()) {
    //     passwordValidationErrors.value.currentPassword = '현재 비밀번호를 입력하세요.'
    //   }
    //   break
      
    case 'newPassword':
      if (!value.trim()) {
        passwordValidationErrors.value.newPassword = '새 비밀번호를 입력하세요.'
      } else if (value.length < 6 || value.length > 100) {
        passwordValidationErrors.value.newPassword = '새 비밀번호는 6~100자 사이여야 합니다.'
      }
      // else if (value === passwordForm.value.currentPassword) { // 현재 비밀번호와 비교 제거
      //   passwordValidationErrors.value.newPassword = '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
      // }
      // 새 비밀번호가 변경되면 확인 비밀번호도 다시 검증
      if (passwordForm.value.confirmPassword) {
        validatePasswordField('confirmPassword', passwordForm.value.confirmPassword)
      }
      break
      
    case 'confirmPassword':
      if (!value.trim()) {
        passwordValidationErrors.value.confirmPassword = '비밀번호 확인을 입력하세요.'
      } else if (value !== passwordForm.value.newPassword) {
        passwordValidationErrors.value.confirmPassword = '비밀번호가 일치하지 않습니다.'
      }
      break
  }
}

// 비밀번호 변경 폼 전체 유효성 검사
const validatePasswordForm = () => {
  // validatePasswordField('currentPassword', passwordForm.value.currentPassword) // 현재 비밀번호 필드 제거
  validatePasswordField('newPassword', passwordForm.value.newPassword)
  validatePasswordField('confirmPassword', passwordForm.value.confirmPassword)
  
  return !Object.values(passwordValidationErrors.value).some(error => error !== '')
}

// 프로필 수정 폼 전체 유효성 검사
const validateProfileForm = () => {
  validateField('userName', profileForm.value.userName)
  validateField('email', profileForm.value.email)
  validateField('phone', profileForm.value.phone)
  
  return !Object.values(validationErrors.value).some(error => error !== '')
}

// 메서드
const loadCurrentUser = async () => {
  try {
    // 실제 로그인된 사용자 정보를 가져오는 로직
    const user = await userService.getCurrentUser()
    currentUser.value = user
    console.log('현재 사용자 정보 로드:', currentUser.value)
  } catch (error) {
    console.error('사용자 정보 로딩 실패:', error)
    // 개발 환경에서는 목 데이터 사용
    console.log('개발 환경: 목 데이터 사용')
    // showAlert('사용자 정보를 불러오는데 실패했습니다.', 'error')
  }
}

const openEditModal = () => {
  profileForm.value = {
    loginId: currentUser.value.loginId,
    userName: currentUser.value.userName,
    email: currentUser.value.email,
    phone: currentUser.value.phone || '',
    department: currentUser.value.department || '',
    position: currentUser.value.position || '',
    employeeNumber: currentUser.value.employeeNumber || '',
    companyName: currentUser.value.companyName || '',
    address: currentUser.value.address || '',
    addressDetail: currentUser.value.addressDetail || '',
    zipCode: currentUser.value.zipCode || ''
  }
  // 유효성 검사 오류 초기화
  validationErrors.value = {
    userName: '',
    email: '',
    phone: ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  validationErrors.value = {
    userName: '',
    email: '',
    phone: ''
  }
}

const submitProfileUpdate = async () => {
  // 유효성 검사 실행
  if (!validateProfileForm()) {
    showAlert('입력 정보를 확인해주세요.', 'error')
    return
  }
  
  try {
    // 실제 API 호출 (PUT /api/common/users/me)
    const updateData: any = { ...profileForm.value }
    delete updateData.loginId // 로그인 ID는 변경 불가

    const updatedUser = await userService.updateProfile(updateData)
    currentUser.value = updatedUser
    
    showAlert('내 정보가 수정되었습니다.', 'success')
    closeEditModal()
  } catch (error) {
    console.error('프로필 수정 실패:', error)
    const errorMessage = error instanceof Error ? error.message : '프로필 수정에 실패했습니다.'
    showAlert(errorMessage, 'error')
  }
}

const openPasswordModal = () => {
  passwordForm.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
  // 비밀번호 유효성 검사 오류 초기화
  passwordValidationErrors.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
  passwordValidationErrors.value = {
    // currentPassword: '', // 현재 비밀번호 필드 제거
    newPassword: '',
    confirmPassword: ''
  }
}

const submitPasswordChange = async () => {
  // 비밀번호 변경 유효성 검사 실행
  if (!validatePasswordForm()) {
    showAlert('입력 정보를 확인해주세요.', 'error')
    return
  }
  
  try {
    console.log('비밀번호 변경 시도')

    // 실제 API 호출 (PUT /api/common/users/me/change-password)
    const response = await userService.changeMyPassword({
      newPassword: passwordForm.value.newPassword,
      confirmPassword: passwordForm.value.confirmPassword
    })
    console.log('비밀번호 변경 성공:', response)
    
    showAlert(response.message || '비밀번호가 성공적으로 변경되었습니다.', 'success')
    closePasswordModal()
  } catch (error) {
    console.error('비밀번호 변경 실패:', error)
    let errorMessage = '비밀번호 변경에 실패했습니다.'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    showAlert(errorMessage, 'error')
  }
}

// 유틸리티 메서드
const getRoleName = (roleCode: string) => {
  const roleNames: { [key: string]: string } = {
    'SYSTEM_ADMIN': '시스템관리자',
    'LEADPOWER_MANAGER': '리드파워 담당자',
    'OEM_MANAGER': 'OEM 담당자',
    'SITE_MANAGER': '시공사 담당자',
    'SITE_INSPECTOR': '시공사 감리원',
    'SALES_MANAGER': '영업 담당자',
    'DELIVERY_DRIVER': '운송기사',
    'READ_ONLY': '조회 전용'
  }
  return roleNames[roleCode] || roleCode
}

const getRoleClass = (roleCode: string) => {
  const roleClasses: { [key: string]: string } = {
    'SYSTEM_ADMIN': 'role-admin',
    'LEADPOWER_MANAGER': 'role-leadpower',
    'OEM_MANAGER': 'role-oem',
    'SITE_MANAGER': 'role-site',
    'SITE_INSPECTOR': 'role-inspector',
    'SALES_MANAGER': 'role-sales',
    'DELIVERY_DRIVER': 'role-driver',
    'READ_ONLY': 'role-readonly'
  }
  return roleClasses[roleCode] || 'role-default'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'warning') => {
  alert(message)
}

// 라이프사이클
onMounted(async () => {
  await loadCurrentUser()
})
</script>

<style scoped>
@import '@/assets/css/admin-modals.css';

.profile-page {
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

/* 페이지 헤더 */
.page-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
}

.page-description {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-size: 0.875rem;
}

/* 프로필 카드 */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.profile-card-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.avatar-text {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
}

.profile-summary {
  flex: 1;
}

.profile-name {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.profile-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.375rem 0;
}

.profile-company {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.btn-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-edit svg {
  width: 18px;
  height: 18px;
}

/* 섹션 공통 스타일 */
.info-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-icon svg {
  width: 20px;
  height: 20px;
}

.section-icon-blue {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.section-icon-blue svg {
  color: #2563eb;
}

.section-icon-green {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

.section-icon-green svg {
  color: #16a34a;
}

.section-icon-orange {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
}

.section-icon-orange svg {
  color: #ea580c;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

/* 정보 그리드 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.info-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

/* 정보 카드 */
.info-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.info-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.info-card-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-card-icon svg {
  width: 18px;
  height: 18px;
  color: #4f46e5;
}

.info-card-icon.icon-green {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

.info-card-icon.icon-green svg {
  color: #16a34a;
}

.info-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}

/* 배지 스타일 */
.role-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  display: inline-block;
  width: fit-content;
}

.role-admin { background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); color: #991b1b; }
.role-leadpower { background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); color: #9d174d; }
.role-oem { background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%); color: #6b21a8; }
.role-site { background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); color: #c2410c; }
.role-inspector { background: linear-gradient(135deg, #a5f3fc 0%, #67e8f9 100%); color: #0e7490; }
.role-sales { background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%); color: #1e40af; }
.role-driver { background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%); color: #166534; }
.role-readonly { background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); color: #374151; }
.role-default { background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%); color: #374151; }

.status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  display: inline-block;
  width: fit-content;
}

.status-badge.active {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
}

.status-badge.inactive {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

/* 보안 섹션 */
.security-section .section-header {
  flex-wrap: wrap;
}

.btn-password {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
  margin-left: auto;
}

.btn-password:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.btn-password svg {
  width: 16px;
  height: 16px;
}

.security-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 12px;
  border: 1px solid #fde68a;
}

.security-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.security-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.security-content {
  flex: 1;
}

.security-title {
  margin: 0 0 0.375rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.security-desc {
  margin: 0 0 0.625rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.security-meta {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #9ca3af;
  font-size: 0.8125rem;
}

.security-meta svg {
  width: 14px;
  height: 14px;
}

/* 모달 추가 스타일 */
.ccm-modal-large {
  max-width: 720px;
}

.ccm-form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.ccm-field-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.ccm-input-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

/* 안내 배너 */
.ccm-info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.ccm-info-banner svg {
  width: 24px;
  height: 24px;
  color: #d97706;
  flex-shrink: 0;
}

.ccm-info-banner p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #92400e;
}

/* 반응형 */
@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .profile-card-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-role {
    justify-content: center;
  }

  .section-header {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .btn-password {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-grid-2 {
    grid-template-columns: 1fr;
  }

  .security-card {
    flex-direction: column;
    text-align: center;
  }

  .security-meta {
    justify-content: center;
  }

  .ccm-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
