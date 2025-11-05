-- ============================================================================
-- 공통 상태 코드 추가 SQL 스크립트 (CANCELLED, PENDING_SIGNATURE)
-- Add Common Status Codes SQL Script
-- ============================================================================
-- 작성일: 2025-01-04
-- 목적: COMMON_STATUS 그룹에 CANCELLED(취소), PENDING_SIGNATURE(서명대기) 추가
-- Purpose: Add CANCELLED and PENDING_SIGNATURE status to COMMON_STATUS group
--
-- 사용방법:
-- 1. MariaDB 접속: mysql -h 182.208.227.70 -P 13306 -u root -p ptlpsm
-- 2. 스크립트 실행: source /path/to/add_status_codes.sql;
-- ============================================================================

USE ptlpsm;

-- 상태 코드 추가 (2개)
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
) VALUES
-- 1) CANCELLED (취소)
(
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
),
-- 2) PENDING_SIGNATURE (서명대기)
(
    'COMMON_STATUS',
    'PENDING_SIGNATURE',
    NULL,
    '서명대기',
    '서명 대기중 상태',
    'Y',
    5,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
);




-- 결과 확인
SELECT '=== COMMON_STATUS 전체 코드 (최종) ===' AS '';

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
-- 최종 상태 코드 목록 (5개)
-- ============================================================================
-- 1. PENDING           - 대기
-- 2. IN_PROGRESS       - 진행중
-- 3. COMPLETED         - 완료
-- 4. CANCELLED         - 취소
-- 5. PENDING_SIGNATURE - 서명대기
-- ============================================================================

-- ============================================================================
-- 롤백 스크립트 (필요시 주석 해제하여 사용)
-- ============================================================================

/*
DELETE FROM code_detail
WHERE group_code = 'COMMON_STATUS'
AND code IN ('CANCELLED', 'PENDING_SIGNATURE');
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
