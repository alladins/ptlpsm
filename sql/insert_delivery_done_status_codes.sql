-- =====================================================
-- 납품완료계 상태 코드 추가
-- DELIVERY_DONE_STATUS 그룹 생성
-- =====================================================

-- 1. 코드 그룹 추가
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
) VALUES (
    'DELIVERY_DONE_STATUS',
    '납품완료계 상태',
    '납품완료계(Delivery Done Report) 상태 코드',
    'Y',
    2,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
);

-- 2. 상태 코드 추가
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
-- 2-1. PENDING (대기)
(
    'DELIVERY_DONE_STATUS',
    'PENDING',
    NULL,
    '대기',
    '납품완료계 대기 상태',
    'Y',
    1,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
),
-- 2-2. IN_PROGRESS (납품중)
(
    'DELIVERY_DONE_STATUS',
    'IN_PROGRESS',
    NULL,
    '납품중',
    '납품 진행중 상태',
    'Y',
    2,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
),
-- 2-3. PENDING_SIGNATURE (서명대기)
(
    'DELIVERY_DONE_STATUS',
    'PENDING_SIGNATURE',
    NULL,
    '서명대기',
    '서명 대기중 상태',
    'Y',
    3,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
),
-- 2-4. COMPLETED (완료)
(
    'DELIVERY_DONE_STATUS',
    'COMPLETED',
    NULL,
    '완료',
    '납품완료 상태',
    'Y',
    4,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
),
-- 2-5. SUBMITTED (제출완료)
(
    'DELIVERY_DONE_STATUS',
    'SUBMITTED',
    NULL,
    '제출완료',
    '제출 완료 상태',
    'Y',
    5,
    'SYSTEM',
    NOW(),
    'SYSTEM',
    NOW()
);

-- 확인 쿼리
SELECT
    cd.group_code,
    cd.code,
    cd.code_name,
    cd.description,
    cd.sort_order
FROM code_detail cd
WHERE cd.group_code = 'DELIVERY_DONE_STATUS'
  AND cd.use_yn = 'Y'
ORDER BY cd.sort_order;
