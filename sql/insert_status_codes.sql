-- ============================================================================
-- 공통 상태 코드 추가 SQL 스크립트
-- Common Status Code Insertion SQL Script
-- ============================================================================
-- 작성일: 2025-01-04
-- 목적: 코드관리 시스템에 공통 상태 코드 그룹 및 상세 코드 추가
-- Purpose: Add common status code group and details to code management system
--
-- 사용방법:
-- 1. MariaDB 접속: mysql -h 182.208.227.70 -P 13306 -u root -p ptlpsm
-- 2. 스크립트 실행: source /path/to/insert_status_codes.sql;
-- 3. 확인: SELECT * FROM code_group; SELECT * FROM code_detail;
--
-- 적용 모듈:
-- - 납품확인 (Delivery Confirmation)
-- - 운송 (Transport)
-- - 출하 (Shipment)
-- - 납품완료계 (Delivery Completion Report)
-- - 발주 (Order)
-- ============================================================================

USE ptlpsm;

-- ============================================================================
-- 1. 공통 상태 코드 그룹 추가 (1개)
-- Insert Common Status Code Group (1 group)
-- ============================================================================

INSERT INTO code_group (
    group_code,
    group_name,
    description,
    use_yn,
    sort_order,
    created_by,
    created_at,
    updated_by,
    updated_at
) VALUES
(
    'COMMON_STATUS',
    '공통 상태',
    '시스템 전체에서 사용하는 공통 상태 코드 (납품확인, 운송, 출하, 납품완료계, 발주 등)',
    'Y',
    1,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
);

-- ============================================================================
-- 2. 공통 상태 상세 코드 추가 (3개)
-- Insert Common Status Code Details (3 details)
-- ============================================================================

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
    'PENDING',
    NULL,
    '대기',
    '대기 상태 (작업 시작 전)',
    'Y',
    1,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
), (
    'COMMON_STATUS',
    'IN_PROGRESS',
    NULL,
    '진행중',
    '진행중 상태 (작업 진행 중)',
    'Y',
    2,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
), (
    'COMMON_STATUS',
    'COMPLETED',
    NULL,
    '완료',
    '완료 상태 (작업 완료)',
    'Y',
    3,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
);

-- ============================================================================
-- 3. 결과 확인 (Verification)
-- ============================================================================

-- 코드 그룹 확인 (Verify code group)
SELECT
    group_code,
    group_name,
    description,
    use_yn,
    sort_order,
    created_by,
    created_at
FROM code_group
WHERE group_code = 'COMMON_STATUS';

-- 상세 코드 확인 (Verify code details)
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
-- 4. 롤백 스크립트 (Rollback Script)
-- ============================================================================
-- 만약 삭제가 필요한 경우 아래 주석을 해제하여 사용:
-- If you need to rollback, uncomment and execute below:

/*
-- 상세 코드 삭제
DELETE FROM code_detail
WHERE group_code = 'COMMON_STATUS';

-- 코드 그룹 삭제
DELETE FROM code_group
WHERE group_code = 'COMMON_STATUS';
*/

-- ============================================================================
-- 사용 예시 (Usage Examples)
-- ============================================================================

-- 납품확인 상태 조회 예시:
-- SELECT code, code_name FROM code_detail WHERE group_code = 'COMMON_STATUS' AND use_yn = 'Y' ORDER BY sort_order;

-- 운송 상태 조회 예시:
-- SELECT code, code_name FROM code_detail WHERE group_code = 'COMMON_STATUS' AND use_yn = 'Y' ORDER BY sort_order;

-- 출하 상태 조회 예시:
-- SELECT code, code_name FROM code_detail WHERE group_code = 'COMMON_STATUS' AND use_yn = 'Y' ORDER BY sort_order;

-- 납품완료계 상태 조회 예시:
-- SELECT code, code_name FROM code_detail WHERE group_code = 'COMMON_STATUS' AND use_yn = 'Y' ORDER BY sort_order;

-- 발주 상태 조회 예시:
-- SELECT code, code_name FROM code_detail WHERE group_code = 'COMMON_STATUS' AND use_yn = 'Y' ORDER BY sort_order;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
