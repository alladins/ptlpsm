#!/bin/bash
# 운영 환경 배포 스크립트
# 대상: shipmg.lphydrofoam.com (포트 9032)

set -e

echo "🚀 운영 환경 배포 시작..."
echo "========================================="
echo "대상 서버: shipmg.lphydrofoam.com"
echo "API 포트: 9032"
echo "========================================="

# 배포 전 확인
read -p "⚠️  운영 환경에 배포합니다. 계속하시겠습니까? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "배포가 취소되었습니다."
    exit 0
fi

# 1. 빌드
echo ""
echo "[1/3] 운영 환경용 빌드 중..."
npm run generate:prod

# 2. 빌드 결과 확인
if [ ! -d ".output/public" ]; then
    echo "❌ 빌드 실패: .output/public 디렉토리가 없습니다."
    exit 1
fi

echo "✅ 빌드 완료"

# 3. 서버로 전송
echo ""
echo "[2/3] 서버로 파일 전송 중..."
# rsync -avz --delete .output/public/ user@shipmg.lphydrofoam.com:/app/shipmg/frontend/
echo "⚠️  실제 배포 시 위 rsync 명령어의 주석을 해제하세요."
echo "   현재는 테스트 모드입니다."

# 4. Nginx 캐시 클리어
echo ""
echo "[3/3] Nginx 리로드..."
# ssh user@shipmg.lphydrofoam.com "sudo systemctl reload nginx"
echo "⚠️  실제 배포 시 위 ssh 명령어의 주석을 해제하세요."

echo ""
echo "========================================="
echo "✅ 운영 환경 배포 완료!"
echo "URL: http://shipmg.lphydrofoam.com"
echo "========================================="
