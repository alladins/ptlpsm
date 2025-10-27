# 수정된 Nginx 설정 (leadpower.platree.com)

## 전제 조건 확인 필요

**먼저 다음 사항을 확인해주세요:**

1. Nuxt 빌드 후 `.output/public/` 파일들이 배포되는 실제 경로는?
   - `/app/leadpower/www` 인가요?
   - `/data/webapp/www` 인가요?
   - 아니면 다른 경로인가요?

2. 백엔드 API 서버는 어디서 실행되나요?
   - `http://localhost:9031/api` 인가요?
   - 다른 호스트/포트인가요?

## 권장 설정 (Option 1: Nuxt 파일이 /app/leadpower/www에 있는 경우)

```nginx
server {
    listen       80;
    server_name  leadpower.platree.com;

    # Nuxt 빌드 결과물 경로 (하나로 통일!)
    root /app/leadpower/www;
    index index.html index.htm;

    # 파일 업로드 크기 제한 (서버 레벨 - 모든 location에 적용)
    client_max_body_size 20m;

    error_log  /app/leadpower/logs/leadpower.error.log;
    access_log /app/leadpower/logs/leadpower.access.log main;

    # 보안: 숨김 파일 접근 차단
    location ~ /\.ht {
        deny all;
    }

    # 보안: .git, node_modules 등 접근 차단
    location ~ /\.(git|nuxt|env) {
        deny all;
    }

    # API 프록시 (백엔드 서버로 전달)
    location /api/ {
        proxy_pass http://localhost:9031/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # API 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 정적 자산 (CSS, JS 등) - 장기 캐싱
    location /_nuxt/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # 이미지, 폰트 등 - 장기 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        try_files $uri =404;
    }

    # 모바일 배송 확인 페이지 (SPA Fallback)
    location /m/ {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Admin 페이지 (SPA Fallback)
    location /admin/ {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 기본 페이지 (Public 사이트) (SPA Fallback)
    location / {
        try_files $uri $uri/ /index.html;
        autoindex off;
    }

    # 에러 페이지
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /app/leadpower/logs;
    }
}
```

## 권장 설정 (Option 2: Nuxt 파일이 /data/webapp/www에 있는 경우)

```nginx
server {
    listen       80;
    server_name  leadpower.platree.com;

    # Nuxt 빌드 결과물 경로 (하나로 통일!)
    root /data/webapp/www;
    index index.html index.htm;

    # 파일 업로드 크기 제한 (서버 레벨)
    client_max_body_size 20m;

    error_log  /app/leadpower/logs/leadpower.error.log;
    access_log /app/leadpower/logs/leadpower.access.log main;

    # 보안 설정
    location ~ /\.ht {
        deny all;
    }

    location ~ /\.(git|nuxt|env) {
        deny all;
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

    # 정적 자산 캐싱
    location /_nuxt/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # 모바일 배송 확인 (SPA Fallback)
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
        autoindex off;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /app/leadpower/logs;
    }
}
```

## 주요 변경 사항

### 1. **root 경로 통일** ✅
```diff
- root /app/leadpower/www;
- location / {
-     root /data/webapp/www;  # 충돌!
- }

+ root /app/leadpower/www;  # 또는 /data/webapp/www
+ # location에서 root 재정의 제거
```

### 2. **API 프록시 추가** ✅
```nginx
location /api/ {
    proxy_pass http://localhost:9031/api/;
    # 프록시 헤더들...
}
```

### 3. **모든 SPA 경로에 try_files 추가** ✅
```nginx
location / {
    try_files $uri $uri/ /index.html;  # 추가!
}
```

### 4. **client_max_body_size를 서버 레벨로 이동** ✅
```nginx
server {
    client_max_body_size 20m;  # 모든 location에 적용
}
```

### 5. **Admin 페이지도 SPA Fallback 추가** ✅
```nginx
location /admin/ {
    try_files $uri $uri/ /index.html;
}
```

## 설정 적용 방법

### 1. 백업
```bash
sudo cp /etc/nginx/conf.d/leadpower.conf /etc/nginx/conf.d/leadpower.conf.backup
# 또는
sudo cp /etc/nginx/sites-available/leadpower /etc/nginx/sites-available/leadpower.backup
```

### 2. 설정 수정
```bash
sudo nano /etc/nginx/conf.d/leadpower.conf
# 위의 "권장 설정" 중 하나를 복사하여 붙여넣기
```

### 3. 문법 검증
```bash
sudo nginx -t
```

**결과가 다음과 같아야 합니다:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 4. Nginx 재시작
```bash
sudo systemctl reload nginx
```

### 5. 테스트
```bash
# 1. 모바일 페이지 접근
curl -I http://leadpower.platree.com/m/delivery/test-token
# 결과: HTTP/1.1 200 OK

# 2. API 프록시 테스트
curl -I http://leadpower.platree.com/api/admin/transports
# 결과: HTTP/1.1 200 OK 또는 401 Unauthorized (인증 필요)

# 3. 정적 자산 테스트
curl -I http://leadpower.platree.com/_nuxt/entry.js
# 결과: HTTP/1.1 200 OK
```

## 현재 설정의 문제점 요약

| 문제 | 현재 상태 | 위험도 | 영향 |
|------|----------|--------|------|
| root 경로 충돌 | `/app/leadpower/www` vs `/data/webapp/www` | 🔴 심각 | `/m/` 경로 404 오류 |
| API 프록시 없음 | 없음 | 🔴 심각 | API 호출 실패 |
| `location /`에 try_files 없음 | 없음 | 🔴 심각 | SPA 라우팅 실패 |
| client_max_body_size 위치 | `location /`에만 있음 | 🟡 주의 | 사진 업로드 실패 가능 |
| Admin SPA 설정 없음 | 없음 | 🟠 중요 | Admin 페이지 새로고침 시 404 |

## 확인이 필요한 정보

다음 정보를 확인하여 알려주세요:

1. **Nuxt 빌드 파일 실제 위치**
   ```bash
   # 서버에서 실행
   ls -la /app/leadpower/www/index.html
   ls -la /data/webapp/www/index.html
   # 어느 경로에 index.html이 있나요?
   ```

2. **백엔드 API 서버 주소**
   ```bash
   # 서버에서 실행
   curl http://localhost:9031/api/health
   # 응답이 오나요?
   ```

3. **현재 배포 프로세스**
   - 빌드 후 파일을 어디로 복사하고 있나요?
   - `npm run generate` 후 `.output/public/` 내용을 어디로 옮기나요?

이 정보를 알려주시면 정확한 설정을 제공하겠습니다!
