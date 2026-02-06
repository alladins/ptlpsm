-- ============================================================================
-- V1.0.31: OEM 제조사별 통계 메뉴 추가
-- ============================================================================
-- 통계(7) 하위 메뉴로 OEM 통계(74) 추가
-- ============================================================================

-- 74. OEM 제조사별 통계 메뉴 추가
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (74, 'STAT_OEM', 'OEM제조사별통계', '/admin/statistics/oem', 'fas fa-industry', 2, 7, '_self', 4, 'Y', 'Y', 'OEM 제조사별 통계', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    menu_name = VALUES(menu_name),
    menu_url = VALUES(menu_url),
    menu_icon = VALUES(menu_icon),
    description = VALUES(description),
    updated_at = NOW();

-- SYSTEM_ADMIN 역할에 OEM 통계 메뉴 권한 추가
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
VALUES ('SYSTEM_ADMIN', 74, 'Y', 'Y', 'Y', 'Y', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    read_auth = 'Y',
    write_auth = 'Y',
    edit_auth = 'Y',
    delete_auth = 'Y',
    updated_at = NOW();

-- LEADPOWER_MANAGER 역할에 OEM 통계 메뉴 권한 추가
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
VALUES ('LEADPOWER_MANAGER', 74, 'Y', 'Y', 'Y', 'Y', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    read_auth = 'Y',
    write_auth = 'Y',
    edit_auth = 'Y',
    delete_auth = 'Y',
    updated_at = NOW();

-- OEM_MANAGER 역할에 OEM 통계 메뉴 조회 권한 추가
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
VALUES ('OEM_MANAGER', 74, 'Y', 'N', 'N', 'N', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    read_auth = 'Y',
    updated_at = NOW();

-- SALES 역할에 OEM 통계 메뉴 조회 권한 추가
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
VALUES ('SALES', 74, 'Y', 'N', 'N', 'N', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    read_auth = 'Y',
    updated_at = NOW();
