-- ============================================
-- SALES_STATUS 코드 그룹 생성 스크립트
-- ============================================
-- 영업(Sales) 모듈 전용 상태 코드 그룹 및 한글 상태 코드 추가
--
-- 실행 순서:
-- 1. code_group에 SALES_STATUS 그룹 추가
-- 2. code_detail에 4개 한글 상태 코드 추가
--
-- 작성일: 2025-01-05
-- ============================================

-- Step 1: SALES_STATUS 코드 그룹 생성
INSERT INTO code_group (    group_code,
    group_name,
    description,
    use_yn,
    sort_order,
    created_by,
    created_at,
    updated_by,
    updated_at)
VALUES ('SALES_STATUS', '영업상태', '영업 모듈 전용 상태 코드 (한글)', 'Y',
    2,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW());


-- Step 2: 4개 한글 상태 코드 추가
INSERT INTO code_detail (
  group_code,
  code,
  code_name,
  description,
  css_class,
  badge_class,
  use_yn,
    sort_order,
    created_by,
    created_at,
    updated_by,
    updated_at
)
VALUES
  -- 진행중 (파란색)
  ('SALES_STATUS', '진행중', '진행중', '영업이 진행 중인 상태',
   'status-in-progress', 'bg-blue-100 text-blue-800', 'Y',
    1,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()),

  -- 완료 (초록색)
  ('SALES_STATUS', '완료', '완료', '영업이 완료된 상태',
   'status-completed', 'bg-green-100 text-green-800', 'Y',
    2,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()),

  -- 취소 (빨간색)
  ('SALES_STATUS', '취소', '취소', '영업이 취소된 상태',
   'status-cancelled', 'bg-red-100 text-red-800', 'Y',
    3,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()),

  -- 보류 (노란색)
  ('SALES_STATUS', '보류', '보류', '영업이 보류된 상태',
   'status-pending', 'bg-yellow-100 text-yellow-800', 'Y',
    4,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW());

-- ============================================
-- 실행 결과 확인 쿼리
-- ============================================

-- 코드 그룹 확인
-- SELECT * FROM code_group WHERE group_code = 'SALES_STATUS';

-- 상태 코드 확인
-- SELECT * FROM code_detail WHERE group_code = 'SALES_STATUS' ORDER BY sort_order;

-- ============================================
-- 롤백 쿼리 (필요시 사용)
-- ============================================

-- DELETE FROM code_detail WHERE group_code = 'SALES_STATUS';
-- DELETE FROM code_group WHERE group_code = 'SALES_STATUS';
