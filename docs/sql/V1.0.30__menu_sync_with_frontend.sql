-- ============================================================================
-- V1.0.30: 프론트엔드 메뉴 ID 체계에 맞게 DB menu 테이블 재구성
-- ============================================================================
-- 프론트엔드 메뉴 ID 규칙: 부모 메뉴 ID * 10 + 순번
-- 예: 발주관리(2)의 첫번째 하위 = 21, 두번째 하위 = 22
-- ============================================================================

-- 1. 기존 권한 테이블 데이터 백업 (필요 시)
-- CREATE TABLE role_menu_auth_backup AS SELECT * FROM role_menu_auth;
-- CREATE TABLE user_menu_auth_backup AS SELECT * FROM user_menu_auth;

-- 2. 외래키 제약 임시 해제
SET FOREIGN_KEY_CHECKS = 0;

-- 3. 기존 권한 테이블 데이터 삭제 (메뉴 ID 변경으로 인해 재생성 필요)
DELETE FROM user_menu_auth;
DELETE FROM role_menu_auth;

-- 4. 기존 메뉴 테이블 데이터 삭제
DELETE FROM menu;

-- 5. 프론트엔드와 일치하는 메뉴 데이터 삽입
-- ============================================================================
-- 부모 메뉴 (Level 1)
-- ============================================================================

-- 1. 영업관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (1, 'SALES', '영업관리', '/admin/sales', 'fas fa-chart-line', 1, NULL, '_self', 1, 'Y', 'Y', '영업 관리', NOW(), NOW());

-- 2. 발주관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (2, 'ORDER', '발주관리', '/admin/order', 'fas fa-shopping-cart', 1, NULL, '_self', 2, 'Y', 'Y', '발주 관리', NOW(), NOW());

-- 3. 출하관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (3, 'SHIPPING', '출하관리', '/admin/shipping', 'fas fa-truck', 1, NULL, '_self', 3, 'Y', 'Y', '출하 관리', NOW(), NOW());

-- 4. 운송관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (4, 'TRANSPORT', '운송관리', '/admin/transport', 'fas fa-route', 1, NULL, '_self', 4, 'Y', 'Y', '운송 관리', NOW(), NOW());

-- 5. 납품확인관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (5, 'DELIVERY', '납품확인관리', '/admin/delivery', 'fas fa-check-circle', 1, NULL, '_self', 5, 'Y', 'Y', '납품확인 관리', NOW(), NOW());

-- 6. 납품완료계
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (6, 'DELIVERY_DONE', '납품완료계', '/admin/delivery-done/list', 'fas fa-file-contract', 1, NULL, '_self', 6, 'Y', 'Y', '납품완료계', NOW(), NOW());

-- 7. 통계
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (7, 'STATISTICS', '통계', '/admin/statistics', 'fas fa-chart-bar', 1, NULL, '_self', 7, 'Y', 'Y', '통계', NOW(), NOW());

-- 8. 기초정보
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (8, 'BASIC_INFO', '기초정보', '/admin/basic-info', 'fas fa-cogs', 1, NULL, '_self', 9, 'Y', 'Y', '기초정보 관리', NOW(), NOW());

-- 9. 시스템관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (9, 'SYSTEM', '시스템관리', '/admin/system', 'fas fa-tools', 1, NULL, '_self', 10, 'Y', 'Y', '시스템 관리', NOW(), NOW());

-- 10. 문자관리
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (10, 'MESSAGE_MANAGE', '문자관리', '/admin/message', 'fas fa-envelope', 1, NULL, '_self', 8, 'Y', 'Y', '문자 관리', NOW(), NOW());


-- ============================================================================
-- 자식 메뉴 (Level 2) - 부모 메뉴 ID * 10 + 순번
-- ============================================================================

-- 1x. 영업관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (11, 'SALES_LIST', '영업관리 목록', '/admin/sales/list', 'fas fa-list', 2, 1, '_self', 1, 'Y', 'Y', '영업관리 목록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (12, 'SALES_REGISTER', '영업관리 등록', '/admin/sales/register', 'fas fa-plus', 2, 1, '_self', 2, 'Y', 'Y', '영업관리 등록', NOW(), NOW());

-- 2x. 발주관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (21, 'ORDER_LIST', '발주관리 목록', '/admin/order/list', 'fas fa-list', 2, 2, '_self', 1, 'Y', 'Y', '발주관리 목록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (22, 'ORDER_REGISTER', '발주관리 등록', '/admin/order/register', 'fas fa-plus', 2, 2, '_self', 2, 'Y', 'Y', '발주관리 등록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (26, 'ORDER_PDF_UPLOAD', 'PDF 업로드', '/admin/order/upload-pdf', 'fas fa-file-upload', 2, 2, '_self', 6, 'Y', 'Y', 'PDF 업로드', NOW(), NOW());

-- 3x. 출하관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (31, 'SHIPPING_LIST', '출하관리 목록', '/admin/shipping/list', 'fas fa-list', 2, 3, '_self', 1, 'Y', 'Y', '출하관리 목록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (32, 'SHIPPING_REGISTER', '출하관리 등록', '/admin/shipping/register', 'fas fa-plus', 2, 3, '_self', 2, 'Y', 'Y', '출하관리 등록', NOW(), NOW());

-- 4x. 운송관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (41, 'TRANSPORT_LIST', '운송관리 목록', '/admin/transport/list', 'fas fa-list', 2, 4, '_self', 1, 'Y', 'Y', '운송관리 목록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (42, 'TRANSPORT_REGISTER', '운송장 등록', '/admin/transport/register', 'fas fa-plus', 2, 4, '_self', 2, 'Y', 'Y', '운송장 등록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (46, 'TRANSPORT_PRINT', '운송장 출력', '/admin/transport/print', 'fas fa-print', 2, 4, '_self', 6, 'Y', 'Y', '운송장 출력', NOW(), NOW());

-- 5x. 납품확인관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (51, 'DELIVERY_LIST', '납품확인관리 목록', '/admin/delivery/list', 'fas fa-list', 2, 5, '_self', 1, 'Y', 'Y', '납품확인관리 목록', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (52, 'DELIVERY_REGISTER', '납품확인 등록', '/admin/delivery/register', 'fas fa-plus', 2, 5, '_self', 2, 'Y', 'Y', '납품확인 등록', NOW(), NOW());

-- 7x. 통계 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (71, 'STAT_SALES', '영업통계', '/admin/statistics/sales', 'fas fa-chart-line', 2, 7, '_self', 1, 'Y', 'Y', '영업통계', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (72, 'STAT_REGION', '지역별통계', '/admin/statistics/region', 'fas fa-map-marker-alt', 2, 7, '_self', 2, 'Y', 'Y', '지역별통계', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (73, 'STAT_SHIPMENT', '출하현황통계', '/admin/statistics/shipment', 'fas fa-truck-loading', 2, 7, '_self', 3, 'Y', 'Y', '출하현황통계', NOW(), NOW());

-- 8x. 기초정보 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (81, 'CODE_MANAGE', '코드관리', '/admin/basic-info/code', 'fas fa-code', 2, 8, '_self', 1, 'Y', 'Y', '코드관리', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (82, 'ITEM_MANAGE', '품목관리', '/admin/basic-info/item', 'fas fa-boxes', 2, 8, '_self', 2, 'Y', 'Y', '품목관리', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (83, 'USER_MANAGE', '사용자관리', '/admin/basic-info/user', 'fas fa-users', 2, 8, '_self', 3, 'Y', 'Y', '사용자관리', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (84, 'ORG_MANAGE', '수요기관관리', '/admin/basic-info/organization', 'fas fa-building', 2, 8, '_self', 4, 'Y', 'Y', '수요기관관리', NOW(), NOW());

-- 9x. 시스템관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (91, 'MENU_AUTH', '메뉴권한관리', '/admin/system/menu-auth', 'fas fa-key', 2, 9, '_self', 2, 'Y', 'Y', '메뉴권한관리', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (93, 'ACCESS_LOG', '접근로그', '/admin/system/access-log', 'fas fa-history', 2, 9, '_self', 3, 'Y', 'Y', '접근로그', NOW(), NOW());

-- 10x. 문자관리 하위
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (101, 'MESSAGE_TEMPLATE', '메시지 템플릿 관리', '/admin/basic-info/message-templates/list', 'fas fa-file-lines', 2, 10, '_self', 1, 'Y', 'Y', '메시지 템플릿 관리', NOW(), NOW());

INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, parent_menu_id, target, sort_order, visible, use_yn, description, created_at, updated_at)
VALUES (102, 'MESSAGE_HISTORY', '메시지 히스토리', '/admin/message/history', 'fas fa-clock-rotate-left', 2, 10, '_self', 2, 'Y', 'Y', '메시지 히스토리', NOW(), NOW());


-- ============================================================================
-- 6. 역할별 기본 권한 설정 (role_menu_auth)
-- ============================================================================

-- 모든 메뉴 ID 목록: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 21, 22, 26, 31, 32, 41, 42, 46, 51, 52, 71, 72, 73, 81, 82, 83, 84, 91, 93, 101, 102

-- SYSTEM_ADMIN: 전체 권한
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'SYSTEM_ADMIN', menu_id, 'Y', 'Y', 'Y', 'Y', NOW(), NOW()
FROM menu;

-- LEADPOWER_MANAGER: 전체 권한
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'LEADPOWER_MANAGER', menu_id, 'Y', 'Y', 'Y', 'Y', NOW(), NOW()
FROM menu;

-- OEM_MANAGER: 출하관리만 전체 권한, 나머지 조회만
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'OEM_MANAGER', menu_id,
       'Y',  -- read_auth
       CASE WHEN menu_id IN (3, 31, 32) THEN 'Y' ELSE 'N' END,  -- write_auth
       CASE WHEN menu_id IN (3, 31, 32) THEN 'Y' ELSE 'N' END,  -- edit_auth
       CASE WHEN menu_id IN (3, 31, 32) THEN 'Y' ELSE 'N' END,  -- delete_auth
       NOW(), NOW()
FROM menu
WHERE menu_id NOT IN (8, 9, 81, 82, 83, 84, 91, 93);  -- 기초정보/시스템관리 제외

-- SITE_MANAGER: 납품확인관리, 발주관리(조회) 권한
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'SITE_MANAGER', menu_id,
       'Y',  -- read_auth
       CASE WHEN menu_id IN (5, 51, 52) THEN 'Y' ELSE 'N' END,  -- write_auth
       CASE WHEN menu_id IN (5, 51, 52) THEN 'Y' ELSE 'N' END,  -- edit_auth
       'N',  -- delete_auth
       NOW(), NOW()
FROM menu
WHERE menu_id IN (2, 5, 21, 51, 52);  -- 발주관리(조회), 납품확인관리

-- SITE_INSPECTOR: SITE_MANAGER와 동일
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'SITE_INSPECTOR', menu_id,
       'Y',  -- read_auth
       CASE WHEN menu_id IN (5, 51, 52) THEN 'Y' ELSE 'N' END,  -- write_auth
       CASE WHEN menu_id IN (5, 51, 52) THEN 'Y' ELSE 'N' END,  -- edit_auth
       'N',  -- delete_auth
       NOW(), NOW()
FROM menu
WHERE menu_id IN (2, 5, 21, 51, 52);

-- SALES_MANAGER: 영업관리 전체 권한
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'SALES_MANAGER', menu_id,
       'Y', 'Y', 'Y', 'N',
       NOW(), NOW()
FROM menu
WHERE menu_id IN (1, 11, 12, 7, 71);  -- 영업관리, 영업통계

-- COURIER: 운송관리 조회/수정 권한
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'COURIER', menu_id,
       'Y', 'N',
       CASE WHEN menu_id IN (4, 41, 42, 46) THEN 'Y' ELSE 'N' END,
       'N',
       NOW(), NOW()
FROM menu
WHERE menu_id IN (4, 41, 42, 46);  -- 운송관리만

-- READ_ONLY: 조회만
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, updated_at)
SELECT 'READ_ONLY', menu_id, 'Y', 'N', 'N', 'N', NOW(), NOW()
FROM menu
WHERE menu_id NOT IN (8, 9, 81, 82, 83, 84, 91, 93);  -- 기초정보/시스템관리 제외


-- 7. 외래키 제약 다시 활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 8. 확인
SELECT '=== 메뉴 테이블 확인 ===' AS '';
SELECT menu_id, menu_code, menu_name, parent_menu_id, menu_level, sort_order
FROM menu
ORDER BY sort_order, menu_level, menu_id;

SELECT '=== 역할별 권한 수 ===' AS '';
SELECT role_code, COUNT(*) as menu_count
FROM role_menu_auth
GROUP BY role_code
ORDER BY role_code;
