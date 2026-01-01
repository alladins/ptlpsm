-- ============================================================
-- 메뉴 데이터 동기화 SQL 스크립트
-- 작성일: 2025-12-28
-- 목적: 프론트엔드(SidebarMenu.vue) 메뉴 구조에 맞춰 DB 재설정
-- ============================================================
-- 역할 코드 (8가지):
-- SYSTEM_ADMIN: 시스템관리자
-- LEADPOWER_MANAGER: 리드파워 담당자
-- OEM_MANAGER: OEM 담당자
-- SITE_MANAGER: 시공사 담당자
-- SITE_INSPECTOR: 시공사 감리원
-- DELIVERY_DRIVER: 운송기사
-- SALES_MANAGER: 영업 담당자
-- READ_ONLY: 조회 전용
-- ============================================================

-- ============================================================
-- Step 1: 백업 (실행 전 반드시 백업!)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_backup_20251228 AS SELECT * FROM menu;
CREATE TABLE IF NOT EXISTS role_menu_auth_backup_20251228 AS SELECT * FROM role_menu_auth;

-- ============================================================
-- Step 2: 외래키 제약 임시 해제
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Step 3: 기존 데이터 삭제
-- ============================================================
DELETE FROM user_menu_auth;
DELETE FROM role_menu_auth;
DELETE FROM menu;

-- ============================================================
-- Step 3.5: 역할(role) 테이블 업데이트 (코드 및 명칭 표준화)
-- ============================================================
-- 백업
CREATE TABLE IF NOT EXISTS role_backup_20251228 AS SELECT * FROM role;

-- 기존 역할 데이터 삭제 후 표준화된 역할 입력
DELETE FROM role;

INSERT INTO role (role_code, role_name, description, sort_order, use_yn, created_at, created_by, updated_at, updated_by) VALUES
('SYSTEM_ADMIN', '시스템관리자', '시스템 전체 관리 권한', 1, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('LEADPOWER_MANAGER', '리드파워 담당자', '리드파워 전체 업무 담당', 2, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('OEM_MANAGER', 'OEM 담당자', 'OEM 업체 담당자', 3, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('SITE_MANAGER', '시공사 담당자', '시공사 현장 담당자', 4, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('SITE_INSPECTOR', '시공사 감리원', '시공사 감리 담당', 5, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('DELIVERY_DRIVER', '운송기사', '배송/운송 담당', 6, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('SALES_MANAGER', '영업 담당자', '영업 업무 담당', 7, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
('READ_ONLY', '조회 전용', '조회만 가능한 역할', 8, 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- ============================================================
-- Step 3.6: 사용자(user) 테이블의 역할 코드 마이그레이션
-- ============================================================
-- 예전 코드 → 새 코드 매핑
-- LEAD_POWER → LEADPOWER_MANAGER
-- COURIER → DELIVERY_DRIVER
-- 열람자 관련 코드가 있다면 → READ_ONLY

UPDATE user SET role_code = 'LEADPOWER_MANAGER' WHERE role_code = 'LEAD_POWER';
UPDATE user SET role_code = 'DELIVERY_DRIVER' WHERE role_code = 'COURIER';
UPDATE user SET role_code = 'READ_ONLY' WHERE role_code IN ('VIEWER', '열람자');

-- ============================================================
-- Step 4: 1차 메뉴 INSERT (8개)
-- ============================================================
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(1, 'SALES', '영업관리', '/admin/sales/list', 'fas fa-chart-line', 1, 1, 'Y', 'Y', NULL, '_self', '영업 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(2, 'ORDER_MANAGE', '주문관리', '/admin/order', 'fas fa-shopping-cart', 1, 2, 'Y', 'Y', NULL, '_self', '주문 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(3, 'SHIPPING', '출하관리', '/admin/shipping', 'fas fa-truck', 1, 3, 'Y', 'Y', NULL, '_self', '출하 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(5, 'DELIVERY', '납품관리', '/admin/delivery', 'fas fa-check-circle', 1, 4, 'Y', 'Y', NULL, '_self', '납품 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(7, 'STATISTICS', '통계', '/admin/statistics', 'fas fa-chart-bar', 1, 6, 'Y', 'Y', NULL, '_self', '통계', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(10, 'MESSAGE_MANAGE', '문자관리', '/admin/message', 'fas fa-envelope', 1, 10, 'Y', 'Y', NULL, '_self', '문자 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(8, 'BASIC_INFO', '기초정보', '/admin/basic-info', 'fas fa-cogs', 1, 11, 'Y', 'Y', NULL, '_self', '기초정보 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(9, 'SYSTEM', '시스템관리', '/admin/system', 'fas fa-tools', 1, 12, 'Y', 'Y', NULL, '_self', '시스템 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- ============================================================
-- Step 5: 2차 메뉴 INSERT (21개)
-- ============================================================

-- 주문관리 하위 (2개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(21, 'ORDER', '납품요구', '/admin/order/list', 'fas fa-file-alt', 2, 1, 'Y', 'Y', 2, '_self', '납품요구 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(22, 'ORDER_REQUESTS', '납품요청', '/admin/order-requests', 'fas fa-clipboard-list', 2, 2, 'Y', 'Y', 2, '_self', '납품요청 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- 출하관리 하위 (2개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(31, 'SHIPPING_LIST', '출하관리', '/admin/shipping/list', 'fas fa-truck', 2, 1, 'Y', 'Y', 3, '_self', '출하관리 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(32, 'TRANSPORT', '운송관리', '/admin/transport/list', 'fas fa-route', 2, 2, 'Y', 'Y', 3, '_self', '운송관리 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- 납품관리 하위 (3개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(51, 'DELIVERY_LIST', '납품확인', '/admin/delivery/list', 'fas fa-check-circle', 2, 1, 'Y', 'Y', 5, '_self', '납품확인 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(52, 'DELIVERY_DONE', '납품완료', '/admin/delivery-done/list', 'fas fa-file-contract', 2, 2, 'Y', 'Y', 5, '_self', '납품완료 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(53, 'FUND_LIST', '기성청구', '/admin/funds', 'fas fa-coins', 2, 3, 'Y', 'Y', 5, '_self', '기성청구 목록', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- 통계 하위 (3개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(71, 'STAT_SHIPMENT', '출하현황 통계', '/admin/statistics/shipment', 'fas fa-truck-loading', 2, 1, 'Y', 'Y', 7, '_self', '출하현황 통계', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(72, 'STAT_FUND', '기성통계', '/admin/funds/statistics', 'fas fa-chart-pie', 2, 2, 'Y', 'Y', 7, '_self', '기성통계', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(73, 'STAT_REGION', '지역별 통계', '/admin/statistics/region', 'fas fa-map-marker-alt', 2, 3, 'Y', 'Y', 7, '_self', '지역별 통계', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- 문자관리 하위 (2개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(101, 'MESSAGE_TEMPLATE', '메시지 템플릿 관리', '/admin/basic-info/message-templates/list', 'fas fa-file-lines', 2, 1, 'Y', 'Y', 10, '_self', '메시지 템플릿 관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(102, 'MESSAGE_HISTORY', '메시지 히스토리', '/admin/message/history', 'fas fa-clock-rotate-left', 2, 2, 'Y', 'Y', 10, '_self', '메시지 히스토리', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- 기초정보 하위 (5개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(81, 'CODE_MANAGE', '코드관리', '/admin/basic-info/code', 'fas fa-code', 2, 1, 'Y', 'Y', 8, '_self', '코드관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(82, 'ITEM_MANAGE', '품목관리', '/admin/basic-info/item', 'fas fa-boxes', 2, 2, 'Y', 'Y', 8, '_self', '품목관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(83, 'USER_MANAGE', '사용자관리', '/admin/basic-info/user', 'fas fa-users', 2, 3, 'Y', 'Y', 8, '_self', '사용자관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(84, 'ORG_MANAGE', '수요기관관리', '/admin/basic-info/organization', 'fas fa-building', 2, 4, 'Y', 'Y', 8, '_self', '수요기관관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(85, 'COMPANY_MANAGE', '회사정보', '/admin/basic-info/company', 'fas fa-building-user', 2, 5, 'Y', 'Y', 8, '_self', '회사정보', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- 시스템관리 하위 (4개)
INSERT INTO menu (menu_id, menu_code, menu_name, menu_url, menu_icon, menu_level, sort_order, visible, use_yn, parent_menu_id, target, description, created_at, created_by, updated_at, updated_by) VALUES
(91, 'SYSTEM_CONFIG', '시스템설정', '/admin/system/config', 'fas fa-cog', 2, 1, 'Y', 'Y', 9, '_self', '시스템설정', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(92, 'MENU_AUTH', '메뉴권한관리', '/admin/system/menu-auth', 'fas fa-key', 2, 2, 'Y', 'Y', 9, '_self', '메뉴권한관리', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(93, 'ACCESS_LOG', '접근로그', '/admin/system/access-log', 'fas fa-history', 2, 3, 'Y', 'Y', 9, '_self', '접근로그', NOW(), 'SYSTEM', NOW(), 'SYSTEM'),
(94, 'BANK_ACCOUNT', '계좌조회', '/admin/system/bank-account', 'fas fa-university', 2, 4, 'Y', 'Y', 9, '_self', '계좌조회', NOW(), 'SYSTEM', NOW(), 'SYSTEM');

-- ============================================================
-- Step 6: 역할별 권한 설정
-- ============================================================

-- 1. SYSTEM_ADMIN (시스템관리자): 전체 권한
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'SYSTEM_ADMIN', menu_id, 'Y', 'Y', 'Y', 'Y', NOW(), 'SYSTEM', NOW(), 'SYSTEM' FROM menu;

-- 2. LEADPOWER_MANAGER (리드파워담당자): 전체 권한 (시스템관리 제외)
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'LEADPOWER_MANAGER', menu_id, 'Y', 'Y', 'Y', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code NOT IN ('SYSTEM', 'SYSTEM_CONFIG', 'MENU_AUTH', 'ACCESS_LOG', 'BANK_ACCOUNT', 'USER_MANAGE');

-- 3. OEM_MANAGER (OEM 담당자): 출하관리 + 운송관리
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'OEM_MANAGER', menu_id, 'Y', 'Y', 'Y', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code IN ('SHIPPING', 'SHIPPING_LIST', 'TRANSPORT');

-- 4. SITE_MANAGER (시공사 담당자): 납품관리 전체 (수정 가능)
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'SITE_MANAGER', menu_id, 'Y', 'Y', 'Y', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code IN ('DELIVERY', 'DELIVERY_LIST', 'DELIVERY_DONE', 'FUND_LIST');

-- 5. SITE_INSPECTOR (시공사 감리원): 납품확인만 (조회/등록만)
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'SITE_INSPECTOR', menu_id, 'Y', 'Y', 'N', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code IN ('DELIVERY', 'DELIVERY_LIST');

-- 6. DELIVERY_DRIVER (운송기사): 운송관리만
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'DELIVERY_DRIVER', menu_id, 'Y', 'Y', 'N', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code IN ('SHIPPING', 'TRANSPORT');

-- 7. SALES_MANAGER (영업 담당자): 영업관리 + 주문관리
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'SALES_MANAGER', menu_id, 'Y', 'Y', 'Y', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code IN ('SALES', 'ORDER_MANAGE', 'ORDER', 'ORDER_REQUESTS');

-- 8. READ_ONLY (조회 전용): 전체 조회만 (시스템관리 제외)
INSERT INTO role_menu_auth (role_code, menu_id, read_auth, write_auth, edit_auth, delete_auth, created_at, created_by, updated_at, updated_by)
SELECT 'READ_ONLY', menu_id, 'Y', 'N', 'N', 'N', NOW(), 'SYSTEM', NOW(), 'SYSTEM'
FROM menu WHERE menu_code NOT IN ('SYSTEM', 'SYSTEM_CONFIG', 'MENU_AUTH', 'ACCESS_LOG', 'BANK_ACCOUNT', 'USER_MANAGE');

-- ============================================================
-- Step 7: 외래키 제약 복원
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Step 8: 검증 쿼리
-- ============================================================

-- 메뉴 개수 확인 (1차: 8개, 2차: 21개 = 총 29개)
SELECT menu_level, COUNT(*) as cnt FROM menu GROUP BY menu_level;

-- 메뉴 구조 확인
SELECT
  m.menu_id,
  m.menu_code,
  m.menu_name,
  m.menu_url,
  m.parent_menu_id,
  p.menu_name as parent_name
FROM menu m
LEFT JOIN menu p ON m.parent_menu_id = p.menu_id
ORDER BY m.menu_level, m.sort_order;

-- 역할별 권한 개수 확인
SELECT role_code, COUNT(*) as menu_count FROM role_menu_auth GROUP BY role_code ORDER BY role_code;

-- 역할 테이블 확인
SELECT role_code, role_name, description, sort_order FROM role ORDER BY sort_order;

-- ============================================================
-- 롤백 방법 (문제 발생 시)
-- ============================================================
-- SET FOREIGN_KEY_CHECKS = 0;
-- DELETE FROM user_menu_auth;
-- DELETE FROM role_menu_auth;
-- DELETE FROM menu;
-- DELETE FROM role;
-- INSERT INTO menu SELECT * FROM menu_backup_20251228;
-- INSERT INTO role_menu_auth SELECT * FROM role_menu_auth_backup_20251228;
-- INSERT INTO role SELECT * FROM role_backup_20251228;
-- SET FOREIGN_KEY_CHECKS = 1;
