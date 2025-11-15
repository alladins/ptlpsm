# 백엔드 토큰 자동 갱신 (Sliding Session) 구현 명세서

## 📋 개요

**목적**: 사용자가 활동 중일 때 자동으로 토큰이 갱신되어 로그아웃되지 않도록 하는 기능
**방식**: 백엔드 주도 Sliding Session (서버가 응답 헤더에 새 토큰 포함)
**프론트엔드 준비**: ✅ 완료 (2025-01-14)

---

## 🎯 요구사항

### 1. 토큰 정책
- **Access Token 만료 시간**: 1시간
- **자동 갱신 기준**: 토큰 발급 후 **30분 경과 시**
- **Refresh Token**: Access Token과 함께 재발급

### 2. 구현 위치
- **JwtAuthenticationFilter** (또는 유사한 인증 필터)

---

## 🔧 백엔드 구현 사항

### 1️⃣ JwtTokenProvider에 메서드 추가

```java
package com.example.security.jwt;

import io.jsonwebtoken.Claims;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // 토큰 만료 임박 여부 체크 (30분 경과 시)
    public boolean isTokenExpiringSoon(String token) {
        try {
            Claims claims = parseToken(token);
            Date expiration = claims.getExpiration();
            Date issuedAt = claims.getIssuedAt();

            long tokenLifetime = expiration.getTime() - issuedAt.getTime();
            long elapsed = System.currentTimeMillis() - issuedAt.getTime();

            // 토큰 수명의 50% 경과 시 갱신 (1시간 토큰의 경우 30분)
            return elapsed >= (tokenLifetime / 2);
        } catch (Exception e) {
            return false;
        }
    }

    // 기존 토큰 정보로 새 토큰 발급
    public String refreshToken(String oldToken) {
        Claims claims = parseToken(oldToken);
        String userId = claims.getSubject();
        String role = (String) claims.get("role");

        // 동일한 정보로 새 Access Token 발급
        return generateAccessToken(userId, role);
    }

    // 새 Refresh Token 발급
    public String generateNewRefreshToken(String userId) {
        return generateRefreshToken(userId);
    }
}
```

---

### 2️⃣ JwtAuthenticationFilter 수정

```java
package com.example.security.jwt;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Authorization 헤더에서 토큰 추출
        String token = extractToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 2. ⭐ 토큰 만료 임박 체크 (30분 경과 시)
            if (jwtTokenProvider.isTokenExpiringSoon(token)) {
                try {
                    // 3. 새 Access Token 발급
                    String newAccessToken = jwtTokenProvider.refreshToken(token);

                    // 4. 새 Refresh Token 발급
                    Claims claims = jwtTokenProvider.parseToken(token);
                    String userId = claims.getSubject();
                    String newRefreshToken = jwtTokenProvider.generateNewRefreshToken(userId);

                    // 5. ⭐ 응답 헤더에 새 토큰 포함
                    response.setHeader("X-New-Access-Token", newAccessToken);
                    response.setHeader("X-New-Refresh-Token", newRefreshToken);

                    logger.info("토큰 자동 갱신: userId={}, 경과시간=30분 이상", userId);
                } catch (Exception e) {
                    logger.error("토큰 갱신 실패", e);
                }
            }

            // 6. 인증 처리 (기존 로직)
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 7. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

---

### 3️⃣ CORS 설정 수정

```java
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.addAllowedOriginPattern("*");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);

        // ⭐ 커스텀 응답 헤더 노출 (매우 중요!)
        configuration.addExposedHeader("X-New-Access-Token");
        configuration.addExposedHeader("X-New-Refresh-Token");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
```

---

## 🔄 동작 흐름

```
1. [프론트] API 요청
   GET /api/admin/orders
   Authorization: Bearer eyJhbGc...

2. [백엔드] JwtAuthenticationFilter 진입
   - 토큰 검증: ✅ 유효함
   - 발급 시간: 35분 전
   - 만료 임박: ✅ 30분 경과

3. [백엔드] 새 토큰 자동 발급
   - 새 Access Token 생성
   - 새 Refresh Token 생성

4. [백엔드] 응답 헤더 추가
   HTTP/1.1 200 OK
   X-New-Access-Token: eyJhbGc...(새토큰)
   X-New-Refresh-Token: eyJhbGc...(새토큰)
   Content-Type: application/json

   { "data": [...] }

5. [프론트] plugins/api-interceptor.ts 자동 처리
   - X-New-Access-Token 헤더 감지
   - localStorage 자동 업데이트
   - 다음 요청부터 새 토큰 사용

6. [사용자] 로그아웃 없이 계속 사용 가능! ✅
```

---

## 📊 시나리오별 동작

### ✅ 시나리오 1: 활발히 사용 중 (30분마다 갱신)
```
0분:  로그인 (토큰 발급)
25분: API 요청 → 갱신 없음 (30분 미경과)
35분: API 요청 → ⭐ 자동 갱신 (30분 경과)
65분: API 요청 → ⭐ 자동 갱신 (30분 경과)
95분: API 요청 → ⭐ 자동 갱신 (30분 경과)
...
결과: 무한정 사용 가능 ✅
```

### ✅ 시나리오 2: 비활동 후 복귀 (1시간 이내)
```
0분:  로그인 (토큰 발급)
50분: 커피 타러 감 ☕
55분: 돌아와서 API 요청 → ⭐ 자동 갱신 (30분 경과)
결과: 로그아웃 없음 ✅
```

### ❌ 시나리오 3: 비활동 후 복귀 (1시간 초과)
```
0분:   로그인 (토큰 발급)
70분:  긴 회의 후 복귀 🏃
71분:  API 요청 → ❌ 토큰 만료 (401 에러)
결과: 로그인 페이지로 이동
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트 (토큰 수명 단축)

**application.yml 수정**:
```yaml
jwt:
  access-token-validity-in-seconds: 300  # 5분 (테스트용)
  refresh-token-validity-in-seconds: 600 # 10분 (테스트용)
```

**테스트 순서**:
1. 로그인 → 토큰 발급 확인
2. 2분 30초 대기
3. API 요청 → 응답 헤더에 `X-New-Access-Token` 없음 (30분 미경과)
4. 3분 대기 (총 5분 30초)
5. API 요청 → ⭐ 응답 헤더에 `X-New-Access-Token` 있음 (30분 경과)

### 2. 프로덕션 테스트

**브라우저 개발자 도구**:
```javascript
// 1. 로그인 후 토큰 확인
localStorage.getItem('auth_access_token')

// 2. 30분 후 네트워크 탭 확인
// Response Headers에 다음 항목 확인:
// X-New-Access-Token: eyJhbGc...
// X-New-Refresh-Token: eyJhbGc...

// 3. 콘솔 로그 확인
// "🔄 토큰 자동 갱신 (서버 제공)"
```

---

## 📌 주의사항

### ✅ 필수 확인 사항

1. **CORS 설정**
   ```java
   configuration.addExposedHeader("X-New-Access-Token");
   configuration.addExposedHeader("X-New-Refresh-Token");
   ```
   → ⚠️ 이 설정 누락 시 프론트에서 헤더를 읽을 수 없음!

2. **토큰 발급 시간 기록**
   - JWT Claims에 `iat` (Issued At) 포함 필수
   - 30분 경과 계산을 위해 필요

3. **Refresh Token 갱신**
   - Access Token뿐만 아니라 Refresh Token도 함께 갱신
   - 보안 강화 (장기 토큰 재사용 방지)

4. **무한 루프 방지**
   - 필터에서 응답 헤더만 추가, 요청 재시도 없음
   - 프론트에서 다음 요청 시 자동으로 새 토큰 사용

---

## 🔍 로깅 권장

```java
// 디버깅용 로그
if (jwtTokenProvider.isTokenExpiringSoon(token)) {
    Claims claims = jwtTokenProvider.parseToken(token);
    String userId = claims.getSubject();
    Date issuedAt = claims.getIssuedAt();
    long elapsed = System.currentTimeMillis() - issuedAt.getTime();
    long minutes = elapsed / 1000 / 60;

    logger.info("토큰 자동 갱신 발생: userId={}, 경과시간={}분", userId, minutes);
}
```

---

## 📚 참고 자료

### 프론트엔드 구현 완료
- **파일**: `plugins/api-interceptor.ts`
- **처리**: 응답 헤더 `X-New-Access-Token`, `X-New-Refresh-Token` 자동 감지 및 저장
- **상태**: ✅ 구현 완료 (2025-01-14)

### 백엔드 필요 작업
1. ✅ `JwtTokenProvider.isTokenExpiringSoon()` 추가
2. ✅ `JwtTokenProvider.refreshToken()` 추가
3. ✅ `JwtTokenProvider.generateNewRefreshToken()` 추가
4. ✅ `JwtAuthenticationFilter` 수정
5. ✅ CORS 설정에 `exposedHeaders` 추가

---

## 🎯 예상 효과

### Before (현재)
- ❌ 1시간 후 무조건 로그아웃
- ❌ 활동 중에도 갱신 안 됨
- ❌ 사용자 불만 증가

### After (구현 후)
- ✅ 활동 중에는 무한정 사용 가능
- ✅ 30분마다 자동 갱신
- ✅ 사용자 경험 대폭 개선
- ✅ 보안 유지 (1시간 비활동 시 로그아웃)

---

## 📞 문의

프론트엔드 담당자: [이름]
이메일: [이메일]
작성일: 2025-01-14
