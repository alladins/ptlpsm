# 운영 환경 배포 스크립트 (Windows PowerShell)
# 대상: shipmg.lphydrofoam.com (포트 9030)

$ErrorActionPreference = "Stop"

Write-Host "🚀 운영 환경 배포 시작..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray
Write-Host "대상 서버: shipmg.lphydrofoam.com" -ForegroundColor Yellow
Write-Host "API 포트: 9030" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Gray

# 배포 전 확인
$confirm = Read-Host "⚠️  운영 환경에 배포합니다. 계속하시겠습니까? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "배포가 취소되었습니다." -ForegroundColor Yellow
    exit 0
}

# 1. 빌드
Write-Host ""
Write-Host "[1/3] 운영 환경용 빌드 중..." -ForegroundColor Cyan
npm run generate:prod

# 2. 빌드 결과 확인
if (-not (Test-Path ".output/public")) {
    Write-Host "❌ 빌드 실패: .output/public 디렉토리가 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host "✅ 빌드 완료" -ForegroundColor Green

# 3. 서버로 전송 (scp 사용)
Write-Host ""
Write-Host "[2/3] 서버로 파일 전송 중..." -ForegroundColor Cyan
Write-Host "⚠️  실제 배포 시 아래 scp 명령어의 주석을 해제하세요." -ForegroundColor Yellow
# scp -r .output/public/* user@shipmg.lphydrofoam.com:/app/shipmg/frontend/

# 4. Nginx 리로드
Write-Host ""
Write-Host "[3/3] Nginx 리로드..." -ForegroundColor Cyan
Write-Host "⚠️  실제 배포 시 아래 ssh 명령어의 주석을 해제하세요." -ForegroundColor Yellow
# ssh user@shipmg.lphydrofoam.com "sudo systemctl reload nginx"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Gray
Write-Host "✅ 운영 환경 배포 완료!" -ForegroundColor Green
Write-Host "URL: http://shipmg.lphydrofoam.com" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray
