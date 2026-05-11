<template>
  <div class="blocked-page">
    <div class="blocked-card">
      <i class="fas fa-ban" />
      <h1>접속이 차단되었습니다</h1>
      <p class="message">
        이 IP가 관리자에 의해 차단되어 <strong>로그인을 포함한 모든 접근</strong>이 막혀 있습니다.
      </p>
      <p class="contact">
        잘못된 차단으로 의심되시면 운영팀에 IP 와 시간을 전달해 주세요.<br>
        관리자 연락처: <strong>운영팀에 문의</strong>
      </p>
      <div class="meta">
        <p>접속 시각: {{ accessTime }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: [] })
const accessTime = new Date().toLocaleString('ko-KR')
</script>

<style scoped>
.blocked-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f3f4f6;
  padding: 1rem;
}
.blocked-card {
  background: #fff;
  border: 2px solid #fecaca;
  border-radius: 8px;
  padding: 3rem 2rem;
  max-width: 500px;
  text-align: center;
}
.blocked-card i {
  font-size: 4rem;
  color: #dc2626;
  margin-bottom: 1rem;
}
.blocked-card h1 {
  font-size: 1.5rem;
  color: #991b1b;
  margin-bottom: 1rem;
}
.message { font-size: 1rem; color: #374151; margin: 1rem 0; }
.contact { font-size: 0.875rem; color: #6b7280; margin: 1rem 0; line-height: 1.6; }
.meta { font-size: 0.75rem; color: #9ca3af; margin-top: 2rem; }
</style>
