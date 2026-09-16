import type { Menu, MenuAuth } from '~/types/menu'

// 메뉴 + 권한 통합 타입 (사이드바·사이트맵에서 공통 사용)
export interface MenuWithAuth extends Menu {
  auth?: MenuAuth
  children?: MenuWithAuth[]
}

/**
 * 관리자 메뉴 정적 구조
 *
 * ⚠⚠ 메뉴의 기준은 이 파일이 아니라 DB(menu 테이블)다. ⚠⚠
 *
 *   사이드바(SidebarMenu.vue)는 2026-09-15 부터 서버가 주는 메뉴 트리
 *   (GET /api/comm/menus/user/{loginId} — 계층·아이콘·권한 포함)를 뼈대로 쓴다.
 *   이 상수는 그 조회가 실패했을 때의 비상 폴백, 그리고 아이콘 보완용일 뿐이다.
 *
 *   여기 적힌 menuId 는 DB 와 어긋나 있으니 믿지 말 것. 실측(2026-09-15):
 *     - 상수에 없어 화면에 못 나오던 DB 메뉴 4건
 *       (제조생산 110 / 재고 소진관리 115 / 손실관리 114 / 방문자 추적 100)
 *     - menuId 불일치 3건 (발주서관리 111→33, 재고현황 112→34, OEM 대시보드 114→36)
 *     - 상수 내부 중복 1건 (menuId 11 이 영업일지와 제조생산에 함께 쓰임)
 *
 *   메뉴를 추가·변경할 일이 생기면 DB 를 고치고, 이 파일은 손대지 않아도 된다.
 *   ⚠ 단 /sitemap 페이지는 아직 이 상수를 직접 쓰므로 거기서는 위 오차가 그대로 보인다.
 */
export const ADMIN_MENUS: MenuWithAuth[] = [
  {
    menuId: 1,
    menuCode: 'SALES',
    menuName: '영업관리',
    menuUrl: '/admin/sales',
    menuIcon: 'fas fa-chart-line',
    menuLevel: 1,
    sortOrder: 1,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 11,
        menuCode: 'SALESD',
        menuName: '영업일지',
        menuUrl: '/admin/sales/list',
        menuIcon: 'fas fa-book',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 12,
        menuCode: 'QUOTATION',
        menuName: '견적관리',
        menuUrl: '/admin/quotation/list',
        menuIcon: 'fas fa-file-invoice-dollar',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 13,
        menuCode: 'BUSINESS_CARD',
        menuName: '명함관리',
        menuUrl: '/admin/business-card/list',
        menuIcon: 'fas fa-address-card',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 2,
    menuCode: 'ORDER_MANAGE',
    menuName: '주문관리',
    menuUrl: '/admin/order',
    menuIcon: 'fas fa-shopping-cart',
    menuLevel: 1,
    sortOrder: 2,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 21,
        menuCode: 'ORDER',
        menuName: '납품요구',
        menuUrl: '/admin/order/list',
        menuIcon: 'fas fa-file-alt',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 22,
        menuCode: 'ORDER_REQUESTS',
        menuName: '납품요청',
        menuUrl: '/admin/order-requests',
        menuIcon: 'fas fa-clipboard-list',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 3,
    menuCode: 'SHIPPING',
    menuName: '출하관리',
    menuUrl: '/admin/shipping',
    menuIcon: 'fas fa-truck',
    menuLevel: 1,
    sortOrder: 3,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 31,
        menuCode: 'SHIPPING_LIST',
        menuName: '출하관리',
        menuUrl: '/admin/shipping/list',
        menuIcon: 'fas fa-truck',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 32,
        menuCode: 'TRANSPORT',
        menuName: '운송관리',
        menuUrl: '/admin/transport/list',
        menuIcon: 'fas fa-route',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 11,
    menuCode: 'MANUFACTURING',
    menuName: '제조생산',
    menuUrl: '/admin/purchase-order',
    menuIcon: 'fas fa-industry',
    menuLevel: 1,
    sortOrder: 4,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 111,
        menuCode: 'PURCHASE_ORDER',
        menuName: '발주서관리',
        menuUrl: '/admin/purchase-order/list',
        menuIcon: 'fas fa-file-invoice',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 112,
        menuCode: 'INVENTORY',
        menuName: '재고현황',
        menuUrl: '/admin/inventory/list',
        menuIcon: 'fas fa-boxes',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 113,
        menuCode: 'OEM_MONTHLY_LEDGER',
        menuName: '월별 매출원장',
        menuUrl: '/admin/oem/monthly-ledger',
        menuIcon: 'fas fa-book',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 114,
        menuCode: 'OEM_DASHBOARD',
        menuName: 'OEM 대시보드',
        menuUrl: '/admin/oem/dashboard',
        menuIcon: 'fas fa-tachometer-alt',
        menuLevel: 2,
        sortOrder: 4,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 5,
    menuCode: 'DELIVERY',
    menuName: '납품관리',
    menuUrl: '/admin/delivery',
    menuIcon: 'fas fa-check-circle',
    menuLevel: 1,
    sortOrder: 5,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 51,
        menuCode: 'DELIVERY_LIST',
        menuName: '납품확인',
        menuUrl: '/admin/delivery/list',
        menuIcon: 'fas fa-check-circle',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 52,
        menuCode: 'DELIVERY_DONE',
        menuName: '납품완료',
        menuUrl: '/admin/delivery-done/list',
        menuIcon: 'fas fa-file-contract',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 53,
        menuCode: 'FUND_LIST',
        menuName: '기성청구',
        menuUrl: '/admin/funds',
        menuIcon: 'fas fa-coins',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 6,
    menuCode: 'COMMISSION',
    menuName: '커미션관리',
    menuUrl: '/admin/commission',
    menuIcon: 'fas fa-percent',
    menuLevel: 1,
    sortOrder: 6,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 61,
        menuCode: 'COMMISSION_DASHBOARD',
        menuName: '수익배분 대시보드',
        menuUrl: '/admin/commission/dashboard',
        menuIcon: 'fas fa-chart-line',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 63,
        menuCode: 'COMMISSION_SETTLEMENTS',
        menuName: '정산 이력',
        menuUrl: '/admin/commission/settlements',
        menuIcon: 'fas fa-file-invoice-dollar',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 64,
        menuCode: 'COMMISSION_PAYMENTS',
        menuName: '지급 관리',
        menuUrl: '/admin/commission/payments',
        menuIcon: 'fas fa-credit-card',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 65,
        menuCode: 'COMMISSION_MONTHLY',
        menuName: '월별 수익배분',
        menuUrl: '/admin/commission/monthly-snapshots',
        menuIcon: 'fas fa-calendar-alt',
        menuLevel: 2,
        sortOrder: 4,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 7,
    menuCode: 'STATISTICS',
    menuName: '통계',
    menuUrl: '/admin/statistics',
    menuIcon: 'fas fa-chart-bar',
    menuLevel: 1,
    sortOrder: 7,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 71,
        menuCode: 'STAT_SHIPMENT',
        menuName: '출하현황 통계',
        menuUrl: '/admin/statistics/shipment',
        menuIcon: 'fas fa-truck-loading',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 72,
        menuCode: 'STAT_FUND',
        menuName: '기성통계',
        menuUrl: '/admin/statistics/funds',
        menuIcon: 'fas fa-chart-pie',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 73,
        menuCode: 'STAT_REGION',
        menuName: '지역별 통계',
        menuUrl: '/admin/statistics/region',
        menuIcon: 'fas fa-map-marker-alt',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 74,
        menuCode: 'STAT_SALES',
        menuName: '영업통계',
        menuUrl: '/admin/statistics/sales',
        menuIcon: 'fas fa-briefcase',
        menuLevel: 2,
        sortOrder: 4,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 75,
        menuCode: 'STAT_OEM',
        menuName: 'OEM 제조사별 통계',
        menuUrl: '/admin/statistics/oem',
        menuIcon: 'fas fa-industry',
        menuLevel: 2,
        sortOrder: 5,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 76,
        menuCode: 'STAT_BASELINE',
        menuName: '기성차수 통계',
        menuUrl: '/admin/statistics/baseline',
        menuIcon: 'fas fa-layer-group',
        menuLevel: 2,
        sortOrder: 6,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 77,
        menuCode: 'STAT_LOW_REMAINING',
        menuName: '사업종료 직전 현황',
        menuUrl: '/admin/statistics/low-remaining',
        menuIcon: 'fas fa-hourglass-half',
        menuLevel: 2,
        sortOrder: 7,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 10,
    menuCode: 'MESSAGE_MANAGE',
    menuName: '문자관리',
    menuUrl: '/admin/message',
    menuIcon: 'fas fa-envelope',
    menuLevel: 1,
    sortOrder: 10,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 101,
        menuCode: 'MESSAGE_TEMPLATE',
        menuName: '메시지 템플릿 관리',
        menuUrl: '/admin/basic-info/message-templates/list',
        menuIcon: 'fas fa-file-lines',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 102,
        menuCode: 'MESSAGE_HISTORY',
        menuName: '메시지 히스토리',
        menuUrl: '/admin/message/history',
        menuIcon: 'fas fa-clock-rotate-left',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 8,
    menuCode: 'BASIC_INFO',
    menuName: '기초정보',
    menuUrl: '/admin/basic-info',
    menuIcon: 'fas fa-cogs',
    menuLevel: 1,
    sortOrder: 11,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 81,
        menuCode: 'ITEM_MANAGE',
        menuName: '품목관리',
        menuUrl: '/admin/basic-info/item',
        menuIcon: 'fas fa-boxes',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 82,
        menuCode: 'USER_MANAGE',
        menuName: '사용자관리',
        menuUrl: '/admin/basic-info/user',
        menuIcon: 'fas fa-users',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 83,
        menuCode: 'ORG_MANAGE',
        menuName: '수요기관관리',
        menuUrl: '/admin/basic-info/organization',
        menuIcon: 'fas fa-building',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 84,
        menuCode: 'COMPANY_MANAGE',
        menuName: '회사정보',
        menuUrl: '/admin/basic-info/company',
        menuIcon: 'fas fa-building-user',
        menuLevel: 2,
        sortOrder: 4,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 85,
        menuCode: 'MENU_AUTH',
        menuName: '메뉴권한관리',
        menuUrl: '/admin/basic-info/menu-auth',
        menuIcon: 'fas fa-key',
        menuLevel: 2,
        sortOrder: 5,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 86,
        menuCode: 'BANK_ACCOUNT',
        menuName: '계좌조회',
        menuUrl: '/admin/basic-info/bank-account',
        menuIcon: 'fas fa-university',
        menuLevel: 2,
        sortOrder: 6,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 87,
        menuCode: 'OEM_COST',
        menuName: '제조사 원가',
        menuUrl: '/admin/basic-info/oem-cost',
        menuIcon: 'fas fa-won-sign',
        menuLevel: 2,
        sortOrder: 7,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 88,
        menuCode: 'WAREHOUSE_MANAGE',
        menuName: '창고관리',
        menuUrl: '/admin/basic-info/warehouse',
        menuIcon: 'fas fa-warehouse',
        menuLevel: 2,
        sortOrder: 8,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 89,
        menuCode: 'COMPANY_FILE_MANAGE',
        menuName: '회사 파일관리',
        menuUrl: '/admin/basic-info/company-files/list',
        menuIcon: 'fas fa-folder-open',
        menuLevel: 2,
        sortOrder: 9,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  },
  {
    menuId: 9,
    menuCode: 'SYSTEM',
    menuName: '시스템관리',
    menuUrl: '/admin/system',
    menuIcon: 'fas fa-tools',
    menuLevel: 1,
    sortOrder: 12,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 91,
        menuCode: 'SYSTEM_CONFIG',
        menuName: '시스템설정',
        menuUrl: '/admin/system/config',
        menuIcon: 'fas fa-cog',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 92,
        menuCode: 'CODE_MANAGE',
        menuName: '코드관리',
        menuUrl: '/admin/system/code',
        menuIcon: 'fas fa-code',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 93,
        menuCode: 'ACCESS_LOG',
        menuName: '접근로그',
        menuUrl: '/admin/system/access-log',
        menuIcon: 'fas fa-history',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 94,
        menuCode: 'COMMISSION_RATES',
        menuName: '커미션율 설정',
        menuUrl: '/admin/system/commission-rates',
        menuIcon: 'fas fa-sliders-h',
        menuLevel: 2,
        sortOrder: 4,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 95,
        menuCode: 'ERROR_REPORTS',
        menuName: '오류 게시판',
        menuUrl: '/admin/system/error-reports',
        menuIcon: 'fas fa-bug',
        menuLevel: 2,
        sortOrder: 5,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  }
]
