# Nginx 설정 가이드

## 모바일 배송 확인 페이지 설정

### 문제 상황
- 동적 라우트 `/m/delivery/[token]`에서 404 Not Found 오류 발생
- Nuxt가 SPA(Single Page Application)로 빌드되어 클라이언트 사이드 라우팅 사용
- Nginx가 정적 파일을 찾지 못하면 404 반환

### 해결 방법: SPA Fallback

Nginx 설정에서 `/m/` 경로에 대해 `index.html`로 폴백하도록 구성해야 합니다.

## Nginx 설정 방법

### 1. 설정 파일 위치 확인

일반적으로 다음 경로 중 하나에 위치합니다:
```bash
/etc/nginx/nginx.conf
/etc/nginx/sites-available/default
/etc/nginx/conf.d/default.conf
```

### 2. 설정 추가

기존 server 블록 내에 다음 location 블록을 추가합니다:

```nginx
server {
    listen 80;
    server_name leadpower.platree.com;

    root /var/www/ptlpsm/.output/public;  # Nuxt 빌드 결과물 경로
    index index.html;

    # 모바일 배송 확인 페이지 (SPA Fallback)
    location /m/ {
        try_files $uri $uri/ /index.html;
    }

    # 정적 자산 (CSS, JS, 이미지 등)
    location /_nuxt/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # 기본 페이지 (Public 사이트)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. 설정 검증 및 적용

```bash
# 설정 파일 문법 검증
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 또는 reload (무중단)
sudo systemctl reload nginx
```

## 동작 원리

1. 사용자가 `/m/delivery/abc-123-token` 접근
2. Nginx가 해당 경로의 정적 파일 찾기 시도
3. 파일이 없으면 `/index.html` 반환
4. 브라우저가 `index.html` 로드
5. Nuxt의 클라이언트 라우터가 활성화
6. Vue Router가 `/m/delivery/[token].vue` 컴포넌트 렌더링
7. 페이지에서 `useRoute().params.token`으로 토큰 값 추출
8. API 호출하여 배송 정보 표시

## 확인 방법

### 1. 브라우저에서 직접 접근
```
http://leadpower.platree.com/m/delivery/2eee7e0b-21d7-4cf8-b267-ae6f70c7d043
```

### 2. curl로 확인
```bash
curl -I http://leadpower.platree.com/m/delivery/test-token

# 200 OK가 반환되어야 함
HTTP/1.1 200 OK
Content-Type: text/html
```

### 3. 개발자 도구 확인
- F12 → Network 탭
- `index.html` 로드 확인 (200 OK)
- Vue Router가 컴포넌트 렌더링 확인
- Console에 오류 없음

## 주의사항

### 1. Admin 페이지와의 충돌 방지

Admin 페이지도 SPA 방식이므로 동일한 설정 필요:

```nginx
# Admin 페이지 (인증 필요)
location /admin/ {
    try_files $uri $uri/ /index.html;
}
```

### 2. API 프록시 설정

백엔드 API가 다른 포트에서 실행 중이라면:

```nginx
# API 프록시
location /api/ {
    proxy_pass http://localhost:9031/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. HTTPS 리디렉션

프로덕션에서는 HTTPS 사용 권장:

```nginx
server {
    listen 80;
    server_name leadpower.platree.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name leadpower.platree.com;

    ssl_certificate /etc/letsencrypt/live/leadpower.platree.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/leadpower.platree.com/privkey.pem;

    # ... 위의 location 블록들 ...
}
```

## 전체 설정 예시 (권장)

```nginx
server {
    listen 80;
    server_name leadpower.platree.com;

    root /var/www/ptlpsm/.output/public;
    index index.html;

    # Gzip 압축 (성능 향상)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 정적 자산 캐싱
    location /_nuxt/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # 이미지 및 폰트 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        try_files $uri =404;
    }

    # API 프록시
    location /api/ {
        proxy_pass http://localhost:9031/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 모바일 배송 확인 페이지 (SPA Fallback)
    location /m/ {
        try_files $uri $uri/ /index.html;
    }

    # Admin 페이지 (SPA Fallback)
    location /admin/ {
        try_files $uri $uri/ /index.html;
    }

    # 기본 페이지 (SPA Fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 트러블슈팅

### 문제 1: 여전히 404 오류
**원인**: Nginx 설정이 적용되지 않음

**해결**:
```bash
# 설정 검증
sudo nginx -t

# Nginx 재시작 (reload가 아닌 restart)
sudo systemctl restart nginx

# Nginx 프로세스 확인
sudo systemctl status nginx
```

### 문제 2: 500 Internal Server Error
**원인**: `root` 경로가 잘못되었거나 권한 문제

**해결**:
```bash
# 빌드 결과물 경로 확인
ls -la /var/www/ptlpsm/.output/public/index.html

# 권한 확인 및 수정
sudo chown -R www-data:www-data /var/www/ptlpsm/.output/public
sudo chmod -R 755 /var/www/ptlpsm/.output/public
```

### 문제 3: CSS/JS 파일 404
**원인**: `/_nuxt/` 경로 설정 누락

**해결**: 위의 전체 설정 예시 참고

## 배포 프로세스

```bash
# 1. 로컬에서 빌드
npm run generate

# 2. 빌드 결과물 서버로 전송
scp -r .output/public/* user@leadpower.platree.com:/var/www/ptlpsm/.output/public/

# 3. 서버에서 권한 설정
ssh user@leadpower.platree.com
sudo chown -R www-data:www-data /var/www/ptlpsm/.output/public
sudo chmod -R 755 /var/www/ptlpsm/.output/public

# 4. Nginx 재시작 (필요한 경우)
sudo systemctl reload nginx
```

## 참고 자료

- [Nuxt 3 Static Hosting](https://nuxt.com/docs/getting-started/deployment#static-hosting)
- [Nginx try_files Directive](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [SPA Deployment Guide](https://router.vuejs.org/guide/essentials/history-mode.html#nginx)
