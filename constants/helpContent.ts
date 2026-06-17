/**
 * 도움말 콘텐츠 정적 데이터
 * - /help 페이지에서 사용
 * - 향후 DB 기반으로 전환할 경우 인터페이스만 유지하고 데이터 소스만 교체
 */

export interface HelpItem {
  question: string
  // body: 간단한 강조용 <strong>, <code> 태그만 사용 (정적 데이터, XSS 위험 없음)
  body: string
  relatedLinks?: { label: string; url: string }[]
}

export interface HelpSection {
  // id: 앵커 id (영문 kebab-case)
  id: string
  // title: 섹션 제목
  title: string
  // icon: Font Awesome 클래스
  icon: string
  description?: string
  items: HelpItem[]
}

export const HELP_CONTENT: HelpSection[] = [
  {
    id: 'getting-started',
    title: '시작하기',
    icon: 'fas fa-flag-checkered',
    description: '처음 사용하는 분을 위한 기본 안내입니다.',
    items: [
      {
        question: '로그인은 어떻게 하나요?',
        body: '관리자에게 발급받은 로그인 ID와 비밀번호로 접속합니다. 비밀번호를 잊었다면 시스템 관리자에게 초기화를 요청하세요.'
      },
      {
        question: '내 권한(역할)은 어디서 확인하나요?',
        body: '좌측 하단 사용자 아바타 아래 "역할" 텍스트로 표시됩니다. 더 자세한 정보는 <strong>내 정보</strong> 페이지에서 확인할 수 있습니다.',
        relatedLinks: [
          { label: '내 정보로 이동', url: '/profile' }
        ]
      },
      {
        question: '메뉴가 보이지 않거나 접근할 수 없어요.',
        body: '메뉴 접근은 역할(SYSTEM_ADMIN, LEADPOWER_MANAGER, OEM_MANAGER 등)에 따라 결정됩니다. 본인이 보고 있는 메뉴 트리는 <strong>사이트맵</strong>에서 한눈에 확인할 수 있으며, 필요한 메뉴가 없다면 시스템 관리자에게 권한 부여를 요청하세요.',
        relatedLinks: [
          { label: '사이트맵 보기', url: '/sitemap' }
        ]
      },
      {
        question: '비밀번호는 어떻게 변경하나요?',
        body: '내 정보 페이지의 보안 섹션에서 "비밀번호 변경" 을 사용하면 됩니다.',
        relatedLinks: [
          { label: '내 정보로 이동', url: '/profile' }
        ]
      }
    ]
  },
  {
    id: 'sales',
    title: '영업관리',
    icon: 'fas fa-chart-line',
    description: '영업일지, 견적, 명함 관리를 다룹니다.',
    items: [
      {
        question: '견적서는 어디서 등록하나요?',
        body: '영업관리 > 견적관리 메뉴에서 신규 견적을 등록할 수 있습니다. 견적 금액은 <strong>단가 × 수량</strong> 으로 계산되며, 발주서·납품확인서와는 별도 회계 항목입니다.',
        relatedLinks: [
          { label: '견적관리로 이동', url: '/admin/quotation/list' }
        ]
      },
      {
        question: '영업일지에 작성한 내용은 누가 볼 수 있나요?',
        body: '영업일지는 작성자 본인과 관리자가 확인할 수 있습니다. 외부 고객사에게는 공유되지 않습니다.'
      },
      {
        question: '명함을 등록하면 어디에 활용되나요?',
        body: '등록된 명함은 거래처 담당자 정보로 활용되며, 견적·발주 작성 시 담당자 검색에서 노출됩니다.'
      }
    ]
  },
  {
    id: 'order',
    title: '주문관리',
    icon: 'fas fa-shopping-cart',
    description: '납품요구·납품요청 등록 및 PDF 처리.',
    items: [
      {
        question: '납품요구는 어떻게 등록하나요?',
        body: '주문관리 > 납품요구 메뉴에서 등록할 수 있습니다. 조달청 납품요구서 PDF를 업로드하면 일부 항목이 자동 추출됩니다.',
        relatedLinks: [
          { label: '납품요구 목록', url: '/admin/order/list' }
        ]
      },
      {
        question: '품대계, 총액, 수수료는 어떤 관계인가요?',
        body: '<strong>품대계(item_total_amount)</strong> 가 실제 수금 기준이며, 매출·집계·납품확인서의 단일 기준입니다. 총액(total_amount)·수수료(commission) 는 조달청 PDF 원본 보존용으로만 저장되고 UI·계산에는 사용되지 않습니다.'
      },
      {
        question: '납품요청과 납품요구의 차이가 무엇인가요?',
        body: '<strong>납품요구</strong>는 조달청을 통한 공식 발주이고, <strong>납품요청</strong>은 모바일 등에서 시공사가 직접 요청하는 비공식 경로입니다.'
      },
      {
        question: '변경계약(변경 납품요구)을 등록하면 어떻게 처리되나요?',
        body: '같은 납품요구번호의 변경 건(예: <code>...-01</code>)을 등록하면 <strong>한 번에 전체 프로세스가 자동 연동</strong>됩니다.<br>① 수량·금액이 변경계약 기준의 <strong>최종 확정값으로 대체</strong>되고, ② <strong>납품률</strong>이 즉시 재계산됩니다(이미 출하가 나간 건도 반영). ③ 변경으로 <strong>전량 납품(100%)</strong> 이 되면 상태가 <strong>서명대기</strong>로 전이됩니다. ④ 납품완료 상세·납품확인서/완료계 PDF·자금·기성청구·커미션·통계의 <strong>납품요구번호가 최신 변경계약 번호로</strong> 표시되고, ⑤ <strong>자금(계약총액)</strong> 도 변경계약 금액으로 갱신됩니다.<br>단, <strong>출하·운송장·납품확인의 개별 이력</strong>은 실제 발생 당시 번호(본계약)를 그대로 유지합니다.',
        relatedLinks: [
          { label: '납품요구 목록', url: '/admin/order/list' }
        ]
      }
    ]
  },
  {
    id: 'shipping',
    title: '출하관리',
    icon: 'fas fa-truck',
    description: '출하 등록, 운송장 발행, 기사 배정.',
    items: [
      {
        question: '한 납품요구를 여러 번 나눠 출하할 수 있나요?',
        body: '가능합니다. 한 납품요구에 대해 여러 출하 건을 생성할 수 있으며, 출하별 수량 합이 발주 수량을 초과하지 않도록 시스템에서 검증합니다.'
      },
      {
        question: '운송기사는 어디서 배정하나요?',
        body: '출하관리 > 운송관리 메뉴에서 출하 건별로 운송기사를 배정할 수 있습니다. 기사에게는 SMS로 모바일 납품확인 링크가 전송됩니다.',
        relatedLinks: [
          { label: '운송관리로 이동', url: '/admin/transport/list' }
        ]
      },
      {
        question: '출하 건을 삭제할 수 없어요.',
        body: '운송장이 발행되었거나 납품요청(dispatch_requests) 이 연결된 출하는 안전을 위해 직접 삭제가 제한됩니다. 필요한 경우 시스템 관리자에게 문의하세요.'
      }
    ]
  },
  {
    id: 'delivery',
    title: '납품관리',
    icon: 'fas fa-check-circle',
    description: '납품확인서, 납품완료, 기성청구.',
    items: [
      {
        question: '납품확인서 PDF는 어떻게 발행하나요?',
        body: '납품관리 > 납품확인 메뉴에서 납품 건을 선택해 "납품확인서 출력" 버튼을 누르면 PDF가 생성됩니다. 금액 표시는 <strong>품대계 기준</strong>입니다.',
        relatedLinks: [
          { label: '납품확인 목록', url: '/admin/delivery/list' }
        ]
      },
      {
        question: '납품완료(완료계) 와 납품확인의 차이는?',
        body: '납품확인은 개별 출하 건의 인수 확인이고, <strong>납품완료(완료계)</strong> 는 한 발주의 모든 납품이 끝났음을 종결 처리하는 단계입니다.'
      },
      {
        question: '기성청구는 어떤 흐름인가요?',
        body: '납품관리 > 기성청구에서 차수별로 청구서를 생성합니다. 선금·기성금·최종금 구분에 따라 자금관리 흐름과 연동됩니다.',
        relatedLinks: [
          { label: '기성청구로 이동', url: '/admin/funds' }
        ]
      },
      {
        question: '모바일 납품확인 링크는 어디로 전달되나요?',
        body: '운송기사가 출발하면 SMS로 일회용 링크가 전송됩니다. 현장에서 검수자가 서명하면 즉시 납품확인이 완료됩니다.'
      },
      {
        question: '변경계약 후 자금상세에서 금액 변동을 볼 수 있나요?',
        body: '자금상세 화면 상단의 <strong>"계약 변경 이력"</strong> 표에서 <strong>본계약 → 변경계약</strong> 의 계약총액 변동을 확인할 수 있습니다(변경계약이 있는 건에서만 표시). 자금·기성청구의 납품요구번호와 계약총액은 <strong>최신 변경계약 기준</strong>으로 표시됩니다.',
        relatedLinks: [
          { label: '기성청구로 이동', url: '/admin/funds' }
        ]
      }
    ]
  },
  {
    id: 'manufacturing',
    title: '제조생산',
    icon: 'fas fa-industry',
    description: '발주서, 재고, OEM 관리.',
    items: [
      {
        question: 'OEM 발주는 어디서 등록하나요?',
        body: '제조생산 > 발주서관리 메뉴에서 등록합니다. 발주 금액은 <strong>원가 × 수량</strong> 기준이며, 매출(품대계)과는 별도 회계입니다.',
        relatedLinks: [
          { label: '발주서관리로 이동', url: '/admin/purchase-order/list' }
        ]
      },
      {
        question: '재고 수량이 실제와 다릅니다.',
        body: '재고는 발주 입고, 출하 출고, 수동 조정 이력으로 산출됩니다. 차이가 발생하면 발주서 또는 출하 건의 hard delete 이력을 확인하거나 시스템 관리자에게 재고 조정을 요청하세요.'
      },
      {
        question: 'OEM 대시보드에서 보이는 수치 기준이 무엇인가요?',
        body: '<strong>매출원장</strong>은 납품 완료 기준 품대계 누적, <strong>OEM 대시보드</strong>는 발주·생산·출하 단계별 진행 현황을 표시합니다.'
      }
    ]
  },
  {
    id: 'commission',
    title: '커미션관리',
    icon: 'fas fa-percent',
    description: '수익배분 대시보드, 정산, 지급.',
    items: [
      {
        question: '커미션율은 어디서 변경하나요?',
        body: '시스템관리 > 커미션율 설정 메뉴에서 변경합니다. 변경 시점 이후 발생하는 정산부터 새 요율이 적용됩니다.',
        relatedLinks: [
          { label: '커미션율 설정', url: '/admin/system/commission-rates' }
        ]
      },
      {
        question: '정산과 지급은 어떤 순서로 진행되나요?',
        body: '정산 이력에서 월별로 정산 금액이 확정되면, 지급 관리에서 실제 지급 처리(이체·세금계산서 등)를 등록합니다.'
      },
      {
        question: '수익배분 대시보드의 합계가 영업통계와 다릅니다.',
        body: '대시보드는 커미션 대상 매출(납품 완료된 품대계) 기준이고, 영업통계는 발주 등록 시점 기준이라 시점 차이가 발생할 수 있습니다.'
      }
    ]
  },
  {
    id: 'statistics',
    title: '통계',
    icon: 'fas fa-chart-bar',
    description: '출하·기성·지역·영업·OEM·기성차수 통계.',
    items: [
      {
        question: '통계 수치가 대시보드와 다른 이유는?',
        body: '대시보드는 실시간 집계이고 통계는 일자 기준 마감 집계라 차이가 날 수 있습니다. 일자 필터를 동일하게 맞춰 비교하세요.'
      },
      {
        question: '지역별 통계의 지역 구분 기준은?',
        body: '수요기관의 주소(시/도) 를 기준으로 집계합니다. 수요기관 주소가 비어있는 발주는 "미분류" 로 표시됩니다.'
      },
      {
        question: '엑셀로 내려받을 수 있나요?',
        body: '각 통계 페이지 우측 상단의 "엑셀 다운로드" 버튼으로 현재 필터 조건 그대로 받을 수 있습니다.'
      }
    ]
  },
  {
    id: 'basic-info',
    title: '기초정보',
    icon: 'fas fa-cogs',
    description: '사용자, 회사, 품목, 수요기관, 계좌, 창고.',
    items: [
      {
        question: '신규 사용자는 어떻게 등록하나요?',
        body: '기초정보 > 사용자관리에서 등록합니다. 등록 시 역할을 지정해야 메뉴 권한이 적용됩니다.',
        relatedLinks: [
          { label: '사용자관리로 이동', url: '/admin/basic-info/user' }
        ]
      },
      {
        question: '품목 코드(sku_nm) 와 품목명(sku_name) 의 차이가 있나요?',
        body: '시스템 내부적으로는 <code>sku_nm</code> 컬럼명을 사용합니다. UI에서는 "품목명" 으로 표시됩니다.'
      },
      {
        question: '수요기관과 회사정보는 어떻게 다른가요?',
        body: '<strong>수요기관</strong>은 발주 주체(공공기관·시공사), <strong>회사정보</strong>는 자사 정보입니다.'
      },
      {
        question: '메뉴권한관리는 무엇인가요?',
        body: '역할별로 어떤 메뉴에 readAuth, writeAuth, editAuth, deleteAuth 를 부여할지 설정합니다. SYSTEM_ADMIN 만 접근할 수 있습니다.'
      }
    ]
  },
  {
    id: 'system',
    title: '시스템관리',
    icon: 'fas fa-tools',
    description: '시스템 설정, 코드, 접근 로그.',
    items: [
      {
        question: '접근 로그는 얼마나 보관되나요?',
        body: '시스템관리 > 접근로그에서 확인할 수 있으며, 기본 보관 기간은 시스템 설정에 따릅니다. 자세한 정책은 시스템 관리자에게 문의하세요.'
      },
      {
        question: '코드관리에서 추가한 항목이 화면에 안 보입니다.',
        body: '코드는 캐시되어 표시되므로, 추가/수정 후 새로고침이 필요할 수 있습니다. 그래도 보이지 않으면 사용여부(useYn) 가 \'Y\' 인지 확인하세요.'
      },
      {
        question: '메시지 템플릿은 어디서 관리하나요?',
        body: '문자관리 > 메시지 템플릿 관리에서 SMS/알림톡 템플릿을 관리합니다. 변수는 <code>{{변수명}}</code> 형식으로 작성합니다.',
        relatedLinks: [
          { label: '메시지 템플릿', url: '/admin/basic-info/message-templates/list' }
        ]
      }
    ]
  },
  {
    id: 'faq',
    title: '자주 묻는 질문',
    icon: 'fas fa-circle-question',
    description: '여러 도메인에 걸친 공통 질문 모음.',
    items: [
      {
        question: '날짜/시간이 9시간 어긋나 보입니다.',
        body: 'DB와 백엔드는 UTC 기준으로 저장하고, 화면에는 KST(UTC+9) 로 변환해 표시합니다. 만약 변환되지 않은 시각이 보인다면 화면 캐시일 수 있으니 새로고침을 해보세요.'
      },
      {
        question: 'PDF가 출력되지 않거나 글자가 깨집니다.',
        body: '브라우저 팝업 차단을 해제한 뒤 다시 시도해주세요. 한글 폰트 깨짐이 발생하면 PDF 뷰어를 Chrome 또는 Adobe Reader 로 열어보세요.'
      },
      {
        question: '엑셀 다운로드가 동작하지 않습니다.',
        body: '대용량 데이터는 서버 처리 시간이 길어질 수 있습니다. 검색 조건을 좁혀 다시 시도하거나, 시스템 관리자에게 문의하세요.'
      },
      {
        question: '오류가 계속 발생할 때는 어디로 문의하나요?',
        body: '오류 발생 시점·화면·재현 방법을 정리해 시스템 관리자에게 전달하세요. 가능하면 화면 캡처를 함께 보내주시면 빠르게 확인할 수 있습니다.'
      }
    ]
  }
]
