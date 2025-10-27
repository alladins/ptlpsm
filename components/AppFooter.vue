<template>
  <!-- 관리자 페이지에서는 footer를 표시하지 않음 -->
  <footer v-if="!isAdminPage" class="footer">
    <div class="inner">
      <div class="footer-top">        
        <div class="footer-menu">
          <ul>
            <li><NuxtLink to="/terms">이용약관</NuxtLink></li>
            <li><NuxtLink to="/privacy">개인정보처리방침</NuxtLink></li>
            <li><NuxtLink to="/login">관리</NuxtLink></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-info">
          <div class="address">
            <span>상호: 리드파워</span>
            <span>대표이사: </span>
            <span>사업자등록번호: </span>
            <span>이메일: info@leadpower21.com</span>
            <p>주소 : 경기도 성남시 분당구 판교역로 240 A동 415호 (13493)</p>	
            <p>Copyright © 2025 LEADPOWER. All rights reserved.</p>
          </div>
          <div class="footer-tel">
            <span class="tel">대표전화 : <em>+82-31-755-7850</em></span>
            <span>평일 09:00 ~ 18:00</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// 현재 라우트가 관리자 페이지인지 확인
const route = useRoute()
const isAdminPage = computed(() => {
  return route?.path?.startsWith('/admin') || false
})
</script>

<style>
.footer {
  background: #1a1a1a;
  color: #999;
  padding: 10px 0;
}

.inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 10px;
}

.footer-top {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-bottom: 10px;
}

.footer-menu ul {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-menu li {
  margin-right: 20px;
}

.footer-menu a {
  color: #fff;
  text-decoration: none;
  font-size: 14px;
}

.footer-menu a:hover {
  text-decoration: underline;
}

.footer-bottom {
  padding: 20px 0;
  border-top: 1px solid #333;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address {
  font-size: 14px;
  line-height: 1.6;
}

.address span {
  margin-right: 15px;
}

.address p {
  margin: 5px 0;
}

.footer-tel {
  text-align: right;
  font-size: 14px;
}

.tel {
  display: block;
  margin-bottom: 5px;
}

.tel em {
  font-style: normal;
  font-weight: bold;
  color: #fff;
  font-size: 18px;
}

@media (max-width: 767px) {
  .footer-info {
    flex-direction: column;
  }
  
  .footer-tel {
    text-align: left;
    margin-top: 15px;
  }
  
  .address span {
    display: block;
    margin-right: 0;
  }
  
  .footer-menu ul {
    flex-wrap: wrap;
  }
  
  .footer-menu li {
    margin-bottom: 10px;
  }
}
</style>

