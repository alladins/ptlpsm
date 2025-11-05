-- =====================================================
-- COMMON_STATUS 완전 DB 기반 전환
-- 1. code_detail 테이블에 CSS 관련 컬럼 추가
-- 2. 기존 상태 코드에 CSS 클래스 업데이트
-- =====================================================

-- Step 1: 컬럼 추가
ALTER TABLE code_detail
ADD COLUMN css_class VARCHAR(100) NULL COMMENT 'CSS 클래스명 (예: status-pending)',
ADD COLUMN badge_class VARCHAR(200) NULL COMMENT 'Tailwind 배지 클래스 (예: bg-yellow-100 text-yellow-800)';

-- Step 2: 기존 COMMON_STATUS 상태 코드 업데이트

-- 2-1. PENDING (대기)
UPDATE code_detail SET
  css_class = 'status-pending',
  badge_class = 'bg-yellow-100 text-yellow-800'
WHERE group_code = 'COMMON_STATUS' AND code = 'PENDING';

-- 2-2. IN_PROGRESS (진행중)
UPDATE code_detail SET
  css_class = 'status-in-progress',
  badge_class = 'bg-blue-100 text-blue-800'
WHERE group_code = 'COMMON_STATUS' AND code = 'IN_PROGRESS';

-- 2-3. COMPLETED (완료)
UPDATE code_detail SET
  css_class = 'status-completed',
  badge_class = 'bg-green-100 text-green-800'
WHERE group_code = 'COMMON_STATUS' AND code = 'COMPLETED';

-- 2-4. CANCELLED (취소)
UPDATE code_detail SET
  css_class = 'status-cancelled',
  badge_class = 'bg-red-100 text-red-800'
WHERE group_code = 'COMMON_STATUS' AND code = 'CANCELLED';

-- 2-5. PENDING_SIGNATURE (서명대기)
UPDATE code_detail SET
  css_class = 'status-pending-signature',
  badge_class = 'bg-orange-100 text-orange-800'
WHERE group_code = 'COMMON_STATUS' AND code = 'PENDING_SIGNATURE';

-- 2-6. SUBMITTED (제출완료)
UPDATE code_detail SET
  css_class = 'status-submitted',
  badge_class = 'bg-purple-100 text-purple-800'
WHERE group_code = 'COMMON_STATUS' AND code = 'SUBMITTED';

-- 확인 쿼리
SELECT
  cd.group_code,
  cd.code,
  cd.code_name,
  cd.css_class,
  cd.badge_class,
  cd.sort_order
FROM code_detail cd
WHERE cd.group_code = 'COMMON_STATUS'
  AND cd.use_yn = 'Y'
ORDER BY cd.sort_order;
