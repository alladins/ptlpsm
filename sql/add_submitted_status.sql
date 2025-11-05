-- =====================================================
-- COMMON_STATUS 그룹에 SUBMITTED 상태 추가
-- (납품완료계에서 사용하는 '제출완료' 상태)
-- =====================================================

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
    'SUBMITTED',
    NULL,
    '제출완료',
    '제출 완료 상태',
    'Y',
    6,
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
WHERE cd.group_code = 'COMMON_STATUS'
  AND cd.use_yn = 'Y'
ORDER BY cd.sort_order;
