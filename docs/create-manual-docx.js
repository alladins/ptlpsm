const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel,
        BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// 테이블 스타일
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "2E74B5" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

// 헬퍼 함수들
const createHeaderCell = (text, width = 4680) => new TableCell({
  borders: headerBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: "2E74B5", type: ShadingType.CLEAR },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22 })]
  })]
});

const createCell = (text, width = 4680) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })]
});

const createTable2Col = (data, col1Width = 3000, col2Width = 6360) => new Table({
  columnWidths: [col1Width, col2Width],
  rows: [
    new TableRow({ tableHeader: true, children: [createHeaderCell(data[0][0], col1Width), createHeaderCell(data[0][1], col2Width)] }),
    ...data.slice(1).map(row => new TableRow({ children: [createCell(row[0], col1Width), createCell(row[1], col2Width)] }))
  ]
});

const createTable3Col = (data) => new Table({
  columnWidths: [2500, 2500, 4360],
  rows: [
    new TableRow({ tableHeader: true, children: [createHeaderCell(data[0][0], 2500), createHeaderCell(data[0][1], 2500), createHeaderCell(data[0][2], 4360)] }),
    ...data.slice(1).map(row => new TableRow({ children: [createCell(row[0], 2500), createCell(row[1], 2500), createCell(row[2], 4360)] }))
  ]
});

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const p = (text) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 22 })] });
const pBold = (text) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 22, bold: true })] });
const note = (text) => new Paragraph({
  spacing: { before: 120, after: 120 },
  shading: { fill: "FFF3CD", type: ShadingType.CLEAR },
  children: [new TextRun({ text: "주의: " + text, size: 20, italics: true })]
});
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const emptyLine = () => new Paragraph({ children: [] });

const doc = new Document({
  styles: {
    default: { document: { run: { font: "맑은 고딕", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: "2E74B5", font: "맑은 고딕" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: "2E74B5", font: "맑은 고딕" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: "2E74B5", font: "맑은 고딕" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "404040", font: "맑은 고딕" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-5", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "출하관리 시스템 사용자 매뉴얼", size: 18, color: "808080" })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "- ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }), new TextRun({ text: " -", size: 18 })]
      })] })
    },
    children: [
      // 표지
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("출하관리 시스템")] }),
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("사용자 매뉴얼")] }),
      emptyLine(), emptyLine(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "문서 버전: 1.0", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "작성일: 2025-01-31", size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "대상 독자: 시스템 관리자, 현장 담당자", size: 24 })] }),
      pageBreak(),

      // 목차
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("목차")] }),
      new TableOfContents("목차", { hyperlink: true, headingStyleRange: "1-3" }),
      pageBreak(),

      // 1장. 시스템 개요
      h1("1. 시스템 개요"),
      h2("1.1 시스템 소개"),
      p("PTLPSM(출하관리 시스템)은 공공조달 물류/출하 업무를 통합 관리하는 시스템입니다. 발주부터 납품완료, 자금 정산까지 전체 프로세스를 지원합니다."),
      emptyLine(),
      h3("주요 특징"),
      createTable2Col([
        ["기능", "설명"],
        ["PDF 자동 추출", "납품요구서 PDF를 업로드하면 AI/OCR로 정보 자동 추출"],
        ["모바일 납품확인", "현장에서 스마트폰으로 서명, 사진 촬영, GPS 위치 기록"],
        ["다중 서명", "현장소장 + 감리원 서명을 통한 승인 체계"],
        ["자금 추적", "선급금 → 기성금 → 잔금 → OEM 지급 전체 관리"],
        ["문서 자동 생성", "납품확인서, 납품완료계, 선급금 문서 등 자동 생성"]
      ]),
      emptyLine(),

      h2("1.2 전체 업무 흐름"),
      p("시스템의 전체 업무 흐름은 다음과 같습니다:"),
      pBold("발주 등록 → 출하 등록 → 운송 배차 → 납품 확인 → 납품완료계 → 자금관리 정산"),
      emptyLine(),

      h2("1.3 사용자 역할"),
      createTable3Col([
        ["역할", "권한", "주요 업무"],
        ["시스템 관리자", "전체 기능", "사용자 관리, 시스템 설정"],
        ["리드파워 담당자", "대부분 기능", "발주/출하/납품/자금 관리"],
        ["현장 소장", "현장 업무", "납품확인, 서명"],
        ["현장 감리원", "감리 업무", "납품확인 검수, 서명"],
        ["운송 담당자", "운송 업무", "배송 상태 업데이트"]
      ]),
      emptyLine(),

      h2("1.4 용어 정의"),
      createTable2Col([
        ["용어", "설명"],
        ["납품요구번호", "조달청에서 발행하는 고유 번호"],
        ["본계약", "최초 체결된 계약"],
        ["변경계약", "기존 계약 내용 변경"],
        ["추가계약", "기존 계약에 추가되는 별도 계약"],
        ["기성", "공사/납품 진행에 따른 대금 청구 단위"],
        ["기성 차수", "기성금 청구 순서 (1차, 2차, 3차...)"],
        ["선급금", "계약 체결 후 선지급되는 금액 (통상 70%)"],
        ["잔금", "납품완료 후 정산되는 나머지 금액"],
        ["OEM 지급", "협력업체에 지급하는 금액 (기성금의 70%)"]
      ]),
      pageBreak(),

      // 2장. 발주 관리
      h1("2. 발주 관리"),
      h2("2.1 발주 목록 조회"),
      h3("접근 경로"),
      p("메뉴: 발주관리 → 발주목록"),
      emptyLine(),
      h3("화면 구성"),
      p("발주 목록은 트리 구조로 표시됩니다. 본계약이 최상위 항목이며, 변경계약/추가계약은 본계약 하위에 표시됩니다."),
      emptyLine(),
      h3("검색 조건"),
      createTable2Col([
        ["검색 항목", "설명"],
        ["납품요구번호", "조달청 발행 번호로 검색"],
        ["현장명", "현장/사업명으로 검색"],
        ["수요기관", "발주처 기관명으로 검색"],
        ["계약 유형", "본계약/변경계약/추가계약"],
        ["상태", "진행중/완료/취소"],
        ["등록 기간", "발주 등록일 범위"]
      ]),
      emptyLine(),

      h2("2.2 발주 등록"),
      h3("접근 경로"),
      p("메뉴: 발주관리 → 발주목록 → [신규 등록] 버튼"),
      emptyLine(),
      h3("방법 1: PDF 자동 추출 (권장)"),
      new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, children: [new TextRun({ text: "PDF 업로드 영역에 납품요구서 PDF 파일을 드래그하거나 클릭하여 선택", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, children: [new TextRun({ text: "시스템이 AI/OCR로 납품요구번호, 수요기관명, 현장명, 품목 목록 등 자동 추출", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, children: [new TextRun({ text: "추출된 정보 확인 및 수정", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, children: [new TextRun({ text: "[저장] 버튼 클릭", size: 22 })] }),
      emptyLine(),
      h3("방법 2: 수동 입력"),
      new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, children: [new TextRun({ text: "기본 정보 입력: 납품요구번호, 계약 유형, 수요기관명, 현장명, 계약금액", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, children: [new TextRun({ text: "품목 정보 입력: [품목 추가] 버튼으로 행 추가 후 품목명, 규격, 수량, 단가 입력", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, children: [new TextRun({ text: "[저장] 버튼 클릭", size: 22 })] }),
      emptyLine(),
      note("변경계약/추가계약 등록 시 반드시 상위 계약을 선택해야 합니다. 선택하지 않으면 별도의 본계약으로 등록됩니다."),
      pageBreak(),

      // 3장. 출하 관리
      h1("3. 출하 관리"),
      h2("3.1 출하 목록 조회"),
      h3("접근 경로"),
      p("메뉴: 출하관리 → 출하목록"),
      emptyLine(),
      h3("출하 상태"),
      createTable3Col([
        ["상태", "설명", "표시 색상"],
        ["등록", "출하 정보 등록 완료", "회색"],
        ["운송중", "배송 출발", "파란색"],
        ["배송완료", "현장 도착", "주황색"],
        ["납품확인", "납품확인 완료", "녹색"]
      ]),
      emptyLine(),

      h2("3.2 출하 등록"),
      h3("접근 경로"),
      p("메뉴: 출하관리 → 출하목록 → [신규 등록] 버튼"),
      emptyLine(),
      h3("등록 절차"),
      pBold("Step 1: 발주 선택"),
      p("발주 검색 영역에서 납품요구번호 또는 현장명으로 검색하여 출하할 발주 건을 선택합니다."),
      emptyLine(),
      pBold("Step 2: 출하 품목 및 수량 입력"),
      p("출하할 품목을 선택(체크박스)하고 각 품목별 출하 수량을 입력합니다. 시스템이 자동으로 출하수량 ≤ 발주수량 - 기출하수량을 검증합니다."),
      emptyLine(),
      pBold("Step 3: 운송 정보 입력"),
      p("출하 예정일, 운송사, 차량번호, 운전자 정보를 입력합니다."),
      emptyLine(),
      pBold("Step 4: 저장"),
      p("입력 정보 확인 후 [저장] 버튼을 클릭하면 출하 등록이 완료됩니다."),
      emptyLine(),

      h2("3.3 출하 수정 및 추가변경"),
      h3("추가변경 기능"),
      p("이미 등록된 출하의 수량을 변경해야 할 경우 사용합니다."),
      new Paragraph({ numbering: { reference: "num-list-3", level: 0 }, children: [new TextRun({ text: "출하 상세 화면에서 [추가변경] 버튼 클릭", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-3", level: 0 }, children: [new TextRun({ text: "변경 유형 선택: 수량 증가 또는 수량 감소", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-3", level: 0 }, children: [new TextRun({ text: "변경 수량 및 변경 사유 입력 (필수)", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-3", level: 0 }, children: [new TextRun({ text: "[변경 적용] 버튼 클릭", size: 22 })] }),
      emptyLine(),
      note("해당 출하 건이 기성금 청구에 포함된 경우 수량 변경이 불가능합니다. 이 경우 새로운 출하를 등록해야 합니다."),
      pageBreak(),

      // 4장. 납품 확인
      h1("4. 납품 확인"),
      h2("4.1 납품확인 개요"),
      p("납품확인은 현장에서 실제 물품을 수령하고 확인하는 과정입니다. 모바일 기기를 통해 현장에서 직접 처리할 수 있습니다."),
      emptyLine(),
      h3("납품확인 프로세스"),
      pBold("출하 완료 → 모바일 URL 발송 → 현장 담당자 접속 → 수량 확인 및 사진 촬영 → 터치 서명 → 납품확인 완료"),
      emptyLine(),

      h2("4.2 관리자 화면 (PC)"),
      h3("접근 경로"),
      p("메뉴: 납품관리 → 납품확인"),
      emptyLine(),
      h3("납품확인 URL 발송"),
      new Paragraph({ numbering: { reference: "num-list-4", level: 0 }, children: [new TextRun({ text: "납품확인이 필요한 출하 건 선택", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-4", level: 0 }, children: [new TextRun({ text: "[납품확인 URL 발송] 버튼 클릭", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-4", level: 0 }, children: [new TextRun({ text: "수신자명, 휴대폰 번호, 메시지 유형(SMS/LMS) 입력", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-4", level: 0 }, children: [new TextRun({ text: "[발송] 버튼 클릭", size: 22 })] }),
      emptyLine(),
      p("발송된 URL은 24시간 동안 유효합니다. 만료 시 재발송이 필요합니다."),
      emptyLine(),

      h2("4.3 모바일 납품확인"),
      h3("접속 방법"),
      p("문자로 수신한 URL을 클릭하면 모바일 브라우저에서 납품확인 페이지가 열립니다. 별도 로그인이 필요 없습니다."),
      emptyLine(),
      h3("납품확인 절차"),
      pBold("Step 1: 정보 확인"),
      p("납품요구번호, 현장명, 납품 품목 및 수량을 확인합니다."),
      emptyLine(),
      pBold("Step 2: 수량 확인"),
      p("각 품목별 실제 수령 수량을 확인합니다. 수량 불일치 시 실제 수량을 입력합니다."),
      emptyLine(),
      pBold("Step 3: 사진 촬영"),
      p("[사진 추가] 버튼을 터치하여 카메라 앱으로 납품 현장/물품을 촬영합니다 (최대 5장). GPS 위치 정보가 자동 기록됩니다."),
      emptyLine(),
      pBold("Step 4: 서명"),
      p("서명 영역에 손가락으로 서명합니다. 서명이 마음에 들지 않으면 [다시 서명]을 터치합니다."),
      emptyLine(),
      pBold("Step 5: 납품확인 완료"),
      p("모든 정보를 최종 확인 후 [납품확인 완료] 버튼을 터치합니다."),
      emptyLine(),
      note("네트워크가 불안정한 현장에서도 사용할 수 있습니다. 오프라인 상태에서 작성한 내용은 로컬에 저장되며, 네트워크 연결 시 자동으로 서버에 전송됩니다."),
      pageBreak(),

      // 5장. 납품완료계
      h1("5. 납품완료계"),
      h2("5.1 납품완료계 개요"),
      p("납품완료계는 모든 납품이 완료된 후 조달청에 제출하는 공식 문서입니다. 현장소장과 감리원의 서명을 받아 완성됩니다."),
      emptyLine(),
      h3("납품완료계 상태 흐름"),
      createTable2Col([
        ["상태", "설명"],
        ["PENDING", "대기 - 첫 출하 생성 전"],
        ["IN_PROGRESS", "납품중 - 출하 진행 중"],
        ["PENDING_SIGNATURE", "서명 대기 - 모든 납품확인 완료"],
        ["PARTIAL_SIGNED", "일부 서명 - 현장소장만 서명 완료"],
        ["COMPLETED", "완료 - 양측 서명 완료, 3종 PDF 자동 생성"],
        ["SUBMITTED", "제출완료 - 조달청 제출 완료"]
      ]),
      emptyLine(),

      h2("5.2 서명 수집"),
      h3("서명 URL 발송"),
      new Paragraph({ numbering: { reference: "num-list-5", level: 0 }, children: [new TextRun({ text: "납품완료계 상세 화면 진입", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-5", level: 0 }, children: [new TextRun({ text: "[서명 URL 발송] 버튼 클릭", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-5", level: 0 }, children: [new TextRun({ text: "서명자 선택: 현장소장, 감리원", size: 22 })] }),
      new Paragraph({ numbering: { reference: "num-list-5", level: 0 }, children: [new TextRun({ text: "메시지 미리보기 확인 후 [발송] 버튼 클릭", size: 22 })] }),
      emptyLine(),

      h2("5.3 PDF 문서 생성 및 다운로드"),
      p("현장소장 + 감리원 양측 서명이 모두 완료되면 다음 3종의 PDF가 자동 생성됩니다:"),
      createTable2Col([
        ["문서", "설명"],
        ["납품확인서", "품목별 납품 내역 확인 문서"],
        ["납품완료계", "최종 납품완료 보고서"],
        ["사진대지", "현장 사진 모음 문서"]
      ]),
      emptyLine(),
      note("제출 완료 처리 후에는 수정이 불가능합니다."),
      pageBreak(),

      // 6장. 자금 관리 - 선급금
      h1("6. 자금 관리 - 선급금"),
      h2("6.1 선급금 개요"),
      p("선급금은 계약 체결 후 납품 전에 선지급되는 금액입니다. 통상 계약금액의 70%를 선급금으로 지급받습니다."),
      emptyLine(),
      h3("선급금 프로세스"),
      pBold("선급금 신청 → 5종 PDF 문서 자동 생성 → 관리자 승인 → 실제 입금 → 수금 확인 처리"),
      emptyLine(),

      h2("6.2 선급금 신청"),
      h3("신청 절차"),
      p("자금 상세 화면 → 선급금 탭 → [선급금 신청] 버튼 클릭"),
      emptyLine(),
      h3("입력 정보"),
      createTable2Col([
        ["필드", "설명"],
        ["계약금액", "자동 표시 (수정 불가)"],
        ["선급금 비율", "기본 70%, 필요 시 수정"],
        ["예상 선급금액", "자동 계산 (계약금액 × 비율)"],
        ["신청 금액", "실제 신청할 금액 입력"],
        ["신청일", "신청 날짜 선택"],
        ["비고", "추가 메모 (선택)"]
      ]),
      emptyLine(),
      note("선급금은 1회만 신청 가능합니다. 신청 후에는 취소할 수 없으니 신중하게 진행하세요."),
      emptyLine(),

      h2("6.3 선급금 문서"),
      p("신청 완료 시 시스템이 5종 PDF 문서를 자동 생성합니다:"),
      createTable2Col([
        ["문서 유형", "설명"],
        ["선급금신청서", "선급금 신청 공식 문서"],
        ["선급금사용계획", "선급금 사용 계획서"],
        ["선급금사용확약서", "선급금 사용 확약 문서"],
        ["선급금사용각서", "선급금 사용 각서"],
        ["선급금정산서", "선급금 정산 내역서"]
      ]),
      emptyLine(),

      h2("6.4 선급금 수금 확인"),
      p("실제로 선급금이 입금되면 수금 확인 처리를 합니다."),
      createTable2Col([
        ["필드", "설명"],
        ["입금일", "실제 입금 날짜"],
        ["입금 금액", "실제 입금된 금액"],
        ["입금 계좌", "입금된 계좌 정보 (선택)"],
        ["비고", "추가 메모 (선택)"]
      ]),
      pageBreak(),

      // 7장. 자금 관리 - 기성금
      h1("7. 자금 관리 - 기성금"),
      h2("7.1 기성금 개요"),
      p("기성금은 납품이 진행됨에 따라 단계별로 청구하는 금액입니다. 납품확인이 완료된 출하 건을 선택하여 기성금을 청구합니다."),
      emptyLine(),
      h3("기성금 프로세스"),
      pBold("납품확인 완료된 출하 선택 → 기성 청구 생성 → 서명 URL 발송 → 양측 서명 완료 → PDF 자동 생성 → 수금 확인"),
      emptyLine(),

      h2("7.2 기성금 청구"),
      h3("청구 조건"),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "납품확인이 완료된 출하만 청구 가능", size: 22 })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "이미 청구에 포함된 출하는 선택 불가", size: 22 })] }),
      emptyLine(),
      h3("청구 절차"),
      pBold("Step 1: 기성 청구 시작"),
      p("자금 상세 화면 → 기성금 탭 → [기성 청구] 버튼 클릭"),
      emptyLine(),
      pBold("Step 2: 출하 선택"),
      p("청구 가능한 출하 목록에서 청구할 출하 건을 선택합니다 (복수 선택 가능). 선택한 출하의 합계 금액과 OEM 지급 예정액(청구금액 × 70%)이 자동 계산됩니다."),
      emptyLine(),
      pBold("Step 3: 서명 담당자 선택"),
      p("[다음] 버튼 클릭 후 현장소장과 감리원을 드롭다운에서 선택합니다."),
      emptyLine(),
      pBold("Step 4: 메시지 미리보기 및 발송"),
      p("각 담당자에게 발송될 메시지를 확인하고 [발송] 버튼을 클릭합니다."),
      emptyLine(),

      h2("7.3 서명 진행"),
      h3("서명 상태"),
      createTable2Col([
        ["상태", "설명"],
        ["PENDING_SIGNATURE", "서명 대기 중"],
        ["PARTIAL_SIGNED", "현장소장만 서명 완료"],
        ["SIGNATURE_COMPLETED", "양측 모두 서명 완료"]
      ]),
      emptyLine(),
      p("양측 서명이 완료되면 기성청구 관련 PDF가 자동 생성되고, 상태가 REQUESTED로 변경됩니다."),
      emptyLine(),

      h2("7.4 기성금 수금 확인"),
      p("기성금 탭에서 청구 내역을 확인하고, 해당 건의 [수금 확인] 버튼을 클릭하여 입금 정보를 입력합니다."),
      pageBreak(),

      // 8장. 자금 관리 - 잔금 및 OEM
      h1("8. 자금 관리 - 잔금 및 OEM"),
      h2("8.1 잔금 개요"),
      p("잔금은 납품완료 후 정산되는 나머지 금액입니다."),
      emptyLine(),
      h3("잔금 계산"),
      pBold("잔금 = 계약총액 - 선급금 - 기성금누계"),
      emptyLine(),
      h3("계산 기준"),
      createTable2Col([
        ["기준", "설명"],
        ["신청 기준", "신청된 금액 기준으로 계산"],
        ["입금 기준", "실제 입금된 금액 기준으로 계산"]
      ]),
      emptyLine(),

      h2("8.2 잔금 신청"),
      h3("신청 조건"),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "납품완료 처리 후에만 신청 가능", size: 22 })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "모든 출하의 납품확인이 완료되어야 함", size: 22 })] }),
      emptyLine(),
      h3("신청 절차"),
      p("자금 상세 화면 → 잔금 탭 → [잔금 신청] 버튼 클릭 → 계산 기준 선택 → 계산 내역 확인 → 신청일 입력 → [신청] 버튼 클릭"),
      emptyLine(),
      note("신청 금액과 계산된 잔금이 다를 경우 경고 메시지가 표시됩니다. 금액을 다시 확인하세요."),
      emptyLine(),

      h2("8.3 OEM 지급 개요"),
      p("OEM 지급은 협력업체에 지급하는 금액입니다. 일반적으로 기성금의 70%를 지급합니다."),
      emptyLine(),
      h3("OEM 지급 프로세스"),
      pBold("기성금 청구 완료 → OEM 지급 등록 (지급 예정) → 실제 지급 → OEM 지급 완료 처리"),
      emptyLine(),

      h2("8.4 OEM 지급 등록"),
      h3("등록 절차"),
      p("자금 상세 화면 → OEM 지급 탭 → [OEM 지급 등록] 버튼 클릭"),
      emptyLine(),
      h3("입력 정보"),
      createTable2Col([
        ["필드", "설명"],
        ["연결 기성금", "관련된 기성금 청구 선택 (선택사항)"],
        ["지급 예정액", "지급 예정 금액 (기성금 × 70% 자동 계산)"],
        ["지급 예정일", "지급 예정 날짜"],
        ["OEM 업체명", "협력업체 이름"],
        ["계좌 정보", "지급 계좌 정보 (선택)"],
        ["비고", "추가 메모 (선택)"]
      ]),
      emptyLine(),

      h2("8.5 자금 현황 요약"),
      p("자금 상세 화면 상단에서 전체 자금 현황을 한눈에 확인할 수 있습니다:"),
      createTable2Col([
        ["항목", "설명"],
        ["계약총액", "총 계약 금액"],
        ["선급금", "신청/입금 금액"],
        ["기성금 누계", "전체 기성금 합계"],
        ["잔금", "남은 정산 금액"],
        ["OEM 지급", "협력업체 지급 총액"],
        ["수금률", "(선급금+기성금+잔금) ÷ 계약총액 × 100%"]
      ]),
      pageBreak(),

      // 9장. FAQ 및 문제해결
      h1("9. FAQ 및 문제해결"),
      h2("9.1 자주 묻는 질문"),
      h3("발주 관련"),
      pBold("Q: PDF 업로드 후 정보가 정확하게 추출되지 않습니다."),
      p("A: AI/OCR 추출은 PDF 품질에 따라 정확도가 달라질 수 있습니다. 추출 후 반드시 정보를 확인하고 필요 시 수동으로 수정하세요."),
      emptyLine(),
      pBold("Q: 변경계약을 등록했는데 본계약과 연결되지 않습니다."),
      p("A: 변경계약 등록 시 상위 계약 필드에서 반드시 본계약을 선택해야 합니다."),
      emptyLine(),

      h3("출하 관련"),
      pBold("Q: 출하 수량을 변경하고 싶은데 변경 버튼이 비활성화되어 있습니다."),
      p("A: 해당 출하가 이미 기성금 청구에 포함된 경우 수량 변경이 불가능합니다. 새로운 출하를 등록하거나 기성금 청구를 취소해야 합니다."),
      emptyLine(),

      h3("납품확인 관련"),
      pBold("Q: 모바일에서 납품확인 URL에 접속이 안 됩니다."),
      p("A: URL 유효기간(24시간)이 지났을 수 있습니다. 관리자에게 요청하여 새로운 URL을 발송받으세요."),
      emptyLine(),
      pBold("Q: 서명 후 수정이 필요합니다."),
      p("A: 서명 완료 후에는 수정이 불가능합니다. 관리자에게 문의하여 서명 취소 후 재진행해야 합니다."),
      emptyLine(),

      h3("자금 관련"),
      pBold("Q: 선급금을 다시 신청하고 싶습니다."),
      p("A: 선급금은 1회만 신청 가능합니다. 금액 변경이 필요한 경우 관리자에게 문의하세요."),
      emptyLine(),
      pBold("Q: 기성금 청구 시 일부 출하가 목록에 표시되지 않습니다."),
      p("A: 해당 출하의 납품확인이 완료되었는지, 이미 다른 기성 청구에 포함되었는지 확인하세요."),
      emptyLine(),

      h2("9.2 오류 메시지 및 대응"),
      createTable3Col([
        ["오류 메시지", "원인", "해결 방법"],
        ["세션이 만료되었습니다", "로그인 시간 초과", "다시 로그인"],
        ["권한이 없습니다", "해당 기능 접근 권한 없음", "관리자에게 권한 요청"],
        ["이미 처리된 건입니다", "중복 처리 시도", "화면 새로고침 후 확인"],
        ["필수 항목을 입력하세요", "필수 입력 항목 누락", "빨간색 표시된 필드 입력"],
        ["서버 오류가 발생했습니다", "시스템 오류", "잠시 후 재시도, 지속 시 관리자 문의"]
      ]),
      emptyLine(),

      h2("9.3 문의 및 지원"),
      h3("시스템 문의"),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "담당부서: IT 지원팀", size: 22 })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "연락처: 내선 1234", size: 22 })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "이메일: support@company.com", size: 22 })] }),
      emptyLine(),
      h3("업무 문의"),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "담당부서: 물류관리팀", size: 22 })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "연락처: 내선 5678", size: 22 })] }),
      pageBreak(),

      // 문서 정보
      h1("문서 정보"),
      createTable2Col([
        ["항목", "내용"],
        ["문서명", "출하관리 시스템 사용자 매뉴얼"],
        ["버전", "1.0"],
        ["작성일", "2025-01-31"],
        ["작성자", "시스템 관리팀"],
        ["최종 수정일", "2025-01-31"]
      ]),
      emptyLine(), emptyLine(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Copyright © 2025. All rights reserved.", size: 20, color: "808080" })]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("d:/dev/ptlpsm/docs/출하관리시스템_사용자매뉴얼.docx", buffer);
  console.log("Word 문서 생성 완료: 출하관리시스템_사용자매뉴얼.docx");
});
