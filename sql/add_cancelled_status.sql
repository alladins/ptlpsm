-- ============================================================================
-- CANCELLED 상태 코드 추가 SQL 스크립트
-- Add CANCELLED Status Code SQL Script
-- ============================================================================
-- 작성일: 2025-01-04
-- 목적: COMMON_STATUS 그룹에 CANCELLED(취소) 상태 추가
-- Purpose: Add CANCELLED status to COMMON_STATUS group
--
-- 사용방법:
-- 1. MariaDB 접속: mysql -h 182.208.227.70 -P 13306 -u root -p ptlpsm
-- 2. 스크립트 실행: source /path/to/add_cancelled_status.sql;
-- ============================================================================

USE ptlpsm;

-- CANCELLED 상태 코드 추가
INSERT INTO code_detail (
    group_code,
    code,
    parent_code,
    code_name,
    description,
    use_yn,
    sort_order,
    created_by,
    created_at,
    updated_by,
    updated_at
) VALUES (
    'COMMON_STATUS',
    'CANCELLED',
    NULL,
    '취소',
    '취소 상태',
    'Y',
    4,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
);

-- 결과 확인
SELECT '=== COMMON_STATUS 전체 코드 확인 ===' AS '';

SELECT
    group_code,
    code,
    code_name,
    description,
    use_yn,
    sort_order,
    created_by,
    created_at
FROM code_detail
WHERE group_code = 'COMMON_STATUS'
ORDER BY sort_order;

-- ============================================================================
-- 롤백 스크립트 (필요시 주석 해제하여 사용)
-- ============================================================================

/*
DELETE FROM code_detail
WHERE group_code = 'COMMON_STATUS' AND code = 'CANCELLED';
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
