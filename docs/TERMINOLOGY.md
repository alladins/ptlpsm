# PTLPSM 표준 용어 사전

> **생성일**: 2025-01-01
> **프로젝트**: PTLPSM (출하관리 시스템)
> **총 용어**: 186개
> **분석 파일**: 18개 TypeScript 파일

---

## 목차

1. [발주관리 (Order)](#발주관리-order)
2. [수주관리 (Sales)](#수주관리-sales)
3. [출하관리 (Shipping)](#출하관리-shipping)
4. [납품관리 (Delivery)](#납품관리-delivery)
5. [자금관리 (Fund)](#자금관리-fund)
6. [기초정보 (Baseline)](#기초정보-baseline)
7. [시스템 (System)](#시스템-system)
8. [상태값 (Status)](#상태값-status)
9. [약어 사전 (Abbreviations)](#약어-사전-abbreviations)

---

## 발주관리 (Order)

공공조달 물품 구매 및 계약 관리와 관련된 용어입니다.

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 발주 | Order | order | 물품 구매를 요청하는 행위 |
| 납품요구번호 | Delivery Request No | deliveryRequestNo | 공공조달의 유일한 주문 식별자 |
| 계약 유형 | Contract Type | contractType | 본계약/변경계약/추가계약 구분 |
| 분할순번 | Split Sequence | splitSeq | 00=기준, 01~=분할 |
| 기준 주문 ID | Base Order ID | baseOrderId | 변경/별도 계약의 기준 주문 |
| 건설사 ID | Builder Company ID | builderCompanyId | 시공사 회사 식별자 |
| 제조사 ID | OEM Company ID | oemCompanyId | OEM 제조사 회사 식별자 |
| 품목 총액 | Item Total Amount | itemTotalAmount | 주문 품목의 총 금액 |
| 수수료 | Commission | commission | 거래 수수료 |

### 계약 유형 (ContractType)

| 값 | 한국어 | 설명 |
|----|--------|------|
| ORIGINAL | 본계약 | 최초 계약 |
| AMENDMENT | 변경계약 | 기존 계약 변경 |
| ADDITIONAL | 추가계약 | 추가 발생 계약 |

---

## 수주관리 (Sales)

영업/수주 관련 용어입니다.

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 수주 | Sales | sales | 고객으로부터 주문을 받는 행위 |
| 고객명 | Customer Name | customerNm | 수주 고객 이름 |
| 수주 제목 | Sales Title | salesTitle | 수주 건의 제목 |
| 계약금액 | Contract Amount | contractAmount | 계약된 총 금액 |
| 수요 기관 코드 | Demand Institution Code | dminsttCd | 나라장터 수요기관 코드 |
| 수요 기관명 | Demand Institution Name | dminsttNm | 수요기관 이름 |
| 예상 납품일 | Expected Delivery Date | expectedDeliveryDate | 예상되는 납품 완료일 |

---

## 출하관리 (Shipping)

창고에서 물품을 발송하는 출하 관련 용어입니다.

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 출하 | Shipping | shipping | 물품을 창고에서 배송지로 보내는 행위 |
| 출하 ID | Shipment ID | shipmentId | 출하 건 식별자 |
| 출하일자 | Shipment Date | shipmentDate | 출하가 이루어진 날짜 |
| 출하 수량 | Shipment Quantity | shipmentQuantity | 출하된 물품 수량 |
| 출하 담당자 | Shipment Responsible | shipmentResponsible | 출하 처리 담당자 |

### 출하 상태 (ShipmentStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| PENDING | 대기 | 출하 대기 상태 |
| IN_PROGRESS | 진행중 | 출하 진행 중 |
| PENDING_SIGNATURE | 서명대기 | 납품확인 서명 대기 |
| COMPLETED | 납품완료 | 납품 완료됨 |
| CANCELLED | 취소 | 출하 취소됨 |

---

## 납품관리 (Delivery)

운송 및 납품확인 관련 용어입니다.

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 납품 | Delivery | delivery | 물품이 목적지에 도착하여 인수되는 것 |
| 납품 ID | Delivery ID | deliveryId | 납품 건 식별자 |
| 운송 ID | Transport ID | transportId | 운송 건 식별자 |
| 운송장 번호 | Tracking Number | trackingNumber | 운송장 추적 번호 |
| 차량번호 | Vehicle Number | vehicleNo | 운송 차량 번호판 |
| 운전기사명 | Driver Name | driverName | 운송 기사 이름 |
| 운전기사 전화번호 | Driver Phone | driverPhone | 운송 기사 연락처 |
| 납품 주소 | Delivery Address | deliveryAddress | 납품 목적지 주소 |
| 현장소장명 | Site Supervisor Name | siteSupervisorName | 현장 책임자 이름 |
| 현장감리원 | Site Inspector | supervisorName | 현장 감리 담당자 |
| 납품완료계 ID | Delivery Done ID | deliveryDoneId | 납품완료 문서 식별자 |
| 시공사명 | Contractor Company | contractorCompanyName | 시공 업체 이름 |
| 시공사 대표자명 | Contractor Representative | contractorRepresentative | 시공사 대표 이름 |

### 납품완료계 상태 (DeliveryDoneStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| PENDING | 대기 | 납품완료계 작성 대기 |
| IN_PROGRESS | 납품중 | 납품 진행 중 |
| PENDING_SIGNATURE | 서명 대기 | 서명 대기 상태 |
| COMPLETED | 완료 | 납품완료계 작성 완료 |
| SUBMITTED | 조달청 제출완료 | 나라장터 제출 완료 |

### 서명 역할 (SignatureRole)

| 값 | 한국어 | 설명 |
|----|--------|------|
| CONTRACTOR | 시공사 대표 | 인감 날인 |
| SUPERVISOR | 현장감리원 | 서명 |

### 수신자 타입 (RecipientType)

| 값 | 한국어 | 설명 |
|----|--------|------|
| SITE_MANAGER | 현장소장 | 현장 책임자 |
| SITE_INSPECTOR | 감리원 | 현장 감리 담당자 |

---

## 자금관리 (Fund)

선급금, 기성금, 잔금, OEM 지급 등 자금 관련 용어입니다.

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 자금 ID | Fund ID | fundId | 자금 관리 건 식별자 |
| 선급금 비율 | Advance Payment Rate | advancePaymentRate | 계약금액 대비 선급금 비율 (%) |
| 선급금 금액 | Advance Payment Amount | advancePaymentAmount | 선급금으로 지급되는 금액 |
| 선급금 수령일 | Advance Payment Date | advancePaymentDate | 선급금을 수령한 날짜 |
| 기성금 누계 | Progress Payment Total | progressPaymentTotal | 기성금 누적 청구 금액 |
| 잔금 | Balance Amount | balanceAmount | 계약총액 - 선급금 - 기성금누계 |
| 미수금 | Outstanding Amount | outstandingAmount | 미수령 금액 |
| OEM 지급 총액 | OEM Total Paid | oemTotalPaid | OEM 업체에 지급된 총액 |
| OEM 지급 비율 | OEM Payment Rate | oemPaymentRate | OEM 지급 비율 (%) |
| 수금률 | Collection Rate | collectionRate | 계약금액 대비 수금 비율 (%) |
| 요청 차수 | Request Sequence | requestSeq | 기성금 청구 차수 (1차, 2차...) |
| 납품 수량 | Delivered Quantity | deliveredQuantity | 납품 완료된 수량 |

### 선급금 문서 유형 (AdvanceDocumentType)

| 값 | 한국어 | 설명 |
|----|--------|------|
| APPLICATION | 선급금신청서 | 선급금 신청 문서 |
| USAGE_PLAN | 선급금사용계획 | 선급금 사용 계획서 |
| USAGE_AGREEMENT | 선급금사용확약서 | 선급금 사용 확약 문서 |
| USAGE_PLEDGE | 선급금사용각서 | 선급금 사용 각서 |
| SETTLEMENT | 선급금정산서 | 선급금 정산 문서 |

### 선급금 상태 (AdvanceStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| REQUESTED | 신청 | 선급금 신청됨 |
| APPROVED | 승인 | 선급금 승인됨 |
| PAID | 수금완료 | 선급금 수령 완료 |
| REJECTED | 반려 | 선급금 신청 반려 |

### 기성금 상태 (PaymentStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| REQUESTED | 청구 | 기성금 청구됨 |
| APPROVED | 승인 | 기성금 승인됨 |
| PAID | 입금 | 기성금 입금 완료 |
| REJECTED | 반려 | 기성금 청구 반려 |

### 잔금 상태 (BalanceStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| NOT_REQUESTED | 미신청 | 잔금 신청 전 |
| REQUESTED | 신청 | 잔금 신청됨 |
| APPROVED | 승인 | 잔금 승인됨 |
| PAID | 수금완료 | 잔금 수령 완료 |
| REJECTED | 반려 | 잔금 신청 반려 |

### OEM 지급 상태 (OemPaymentStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| SCHEDULED | 지급예정 | OEM 지급 예정 |
| PAID | 지급완료 | OEM 지급 완료 |
| CANCELLED | 취소 | OEM 지급 취소 |

---

## 기초정보 (Baseline)

기성/납품 차수 및 스냅샷 관련 용어입니다.

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 차수 ID | Baseline ID | baselineId | 기성/납품 차수 스냅샷 ID |
| 차수 순번 | Baseline Sequence | baselineSeq | 차수 순번 (1, 2, 3...) |
| 누적 청구 금액 | Cumulative Amount | cumulativeAmount | 누적된 청구 금액 |
| 누적 OEM 비용 | Cumulative Cost | cumulativeCost | 누적된 OEM 비용 |
| 이번 차수 수량 | This Time Quantity | thisTimeQuantity | 이번 차수 청구 수량 |
| 이번 차수 금액 | This Time Amount | thisTimeAmount | 이번 차수 청구 금액 |
| 이번 차수 OEM 비용 | This Time Cost | thisTimeCost | 이번 차수 OEM 비용 |

### 차수 유형 (BaselineType)

| 값 | 한국어 | 설명 |
|----|--------|------|
| PROGRESS | 기성 | 중간 납품 확인 |
| FINAL | 납품완료 | 최종 납품 확인 |

### 차수 상태 (BaselineStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| DRAFT | 작성중 | 차수 작성 중 |
| PENDING_SIGNATURE | 서명 대기중 | 서명 대기 상태 |
| CONFIRMED | 확정 | 서명 완료, 확정됨 |
| CANCELLED | 취소 | 차수 취소됨 |

### 서명 상태 (SignatureStatus)

| 값 | 한국어 | 설명 |
|----|--------|------|
| PENDING_SIGNATURE | 서명 대기 | 서명 대기 중 |
| PARTIAL_SIGNED | 일부 서명 완료 | 일부 서명자만 완료 |
| SIGNATURE_COMPLETED | 서명 완료 | 모든 서명 완료 |

---

## 시스템 (System)

사용자, 메뉴, 권한, 회사, 품목 등 시스템 공통 용어입니다.

### 사용자 (User)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 사용자 ID | User ID | userid | 사용자 고유 식별자 (숫자, PK) |
| 로그인 ID | Login ID | loginId | 로그인용 문자열 ID |
| 회사 ID | Company ID | companyId | 소속 회사 식별자 |

### 사용자 역할 (UserRole)

| 값 | 한국어 | 설명 |
|----|--------|------|
| SYSTEM_ADMIN | 시스템관리자 | 전체 시스템 관리 |
| LEADPOWER_MANAGER | 리드파워 담당자 | 리드파워 업무 담당 |
| OEM_MANAGER | OEM 담당자 | OEM 업체 담당 |
| SITE_MANAGER | 시공사 담당자 | 현장 시공사 담당 |
| SITE_INSPECTOR | 시공사 감리원 | 현장 감리 담당 |
| SALES_MANAGER | 영업 담당자 | 영업 업무 담당 |
| DELIVERY_DRIVER | 운송기사 | 운송 담당 |
| READ_ONLY | 조회 전용 | 조회만 가능 |

### 메뉴/권한 (Menu)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 메뉴 ID | Menu ID | menuId | 메뉴 식별자 |
| 메뉴 코드 | Menu Code | menuCode | 메뉴 고유 코드 |
| 메뉴명 | Menu Name | menuName | 메뉴 표시 이름 |
| 상위 메뉴 ID | Parent Menu ID | parentMenuId | 부모 메뉴 식별자 |
| 메뉴 레벨 | Menu Level | menuLevel | 메뉴 계층 깊이 |
| 정렬 순서 | Sort Order | sortOrder | 표시 순서 |
| 조회 권한 | Read Auth | readAuth | 조회 가능 여부 |
| 쓰기 권한 | Write Auth | writeAuth | 등록 가능 여부 |
| 수정 권한 | Edit Auth | editAuth | 수정 가능 여부 |
| 삭제 권한 | Delete Auth | deleteAuth | 삭제 가능 여부 |

### 회사 (Company)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 회사명 | Company Name | companyName | 회사 이름 |
| 사업자등록번호 | Business Number | businessNumber | 사업자등록번호 |
| 나라장터 등록번호 | G2B Number | g2bNumber | 나라장터 업체 번호 |
| 대표자명 | Representative | representative | 회사 대표자 이름 |
| 업태 | Business Type | businessType | 사업자 업태 |
| 업종 | Business Category | businessCategory | 사업자 업종 |

### 품목 (Item)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 품목 ID | Item ID | itemId | 품목 식별자 |
| 품목 코드 | Item Code | itemCd | 품목 고유 코드 |
| 품목명 | Item Name | itemNm | 품목 이름 |
| 품목 유형 | Item Type | itemType | 품목 분류 유형 |
| SKU ID | SKU ID | skuId | Stock Keeping Unit 식별자 |
| SKU 코드 | SKU Code | skuCd | SKU 고유 코드 |
| SKU명 | SKU Name | skuNm | SKU 이름 |
| 단가 | Unit Price | unitPrice | 납품 단가 |
| 원가 | Cost Price | costPrice | OEM 계약 단가 |
| 단위 | Unit | unit | 수량 단위 (개, 세트 등) |
| 규격 | Specification | specification | 너비*높이*두께 형식 |

### 계좌 (Bank Account)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 은행 코드 | Bank Code | bankCode | 금융기관 코드 |
| 은행명 | Bank Name | bankName | 금융기관 이름 |
| 계좌번호 | Bank Account Number | bankAccountNum | 계좌 번호 |
| 계좌 유형 | Bank Account Type | bankAccountType | 예금주, 당좌 등 |
| 잔액 | Balance | balance | 계좌 잔액 |
| 수금 주기 | Collect Cycle | collectCycle | 잔액 조회 주기 |
| 거래일자 | Transaction Date | transDate | 거래 발생일 |
| 거래 유형 | Transaction Type | transType | 입금/출금 구분 |
| 상대방명 | Counterpart Name | counterpartName | 거래 상대방 |

### 메시지 (Message)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| 템플릿 코드 | Template Code | templateCode | 메시지 템플릿 코드 |
| 템플릿명 | Template Name | templateName | 템플릿 이름 |
| 메시지 내용 | Message Content | messageContent | 메시지 본문 |
| 발송 요청 시간 | Send Requested At | sendRequestedAt | 발송 요청 시각 |

### 접근 로그 (Access Log)

| 한국어 | 영어 | 코드변수 | 정의 |
|--------|------|----------|------|
| IP 주소 | IP Address | ipAddress | 접근자 IP |
| 접근 URL | Access URL | accessUrl | 요청 URL |
| HTTP 메서드 | HTTP Method | httpMethod | GET/POST/PUT/DELETE |
| User Agent | User Agent | userAgent | 브라우저 정보 |
| 응답 시간 | Response Time | responseTime | 응답 소요 시간 (ms) |
| HTTP 상태 코드 | Status Code | statusCode | HTTP 응답 코드 |

---

## 상태값 (Status)

시스템 전반에서 사용되는 공통 상태값입니다.

### 사용 여부 (UseYn)

| 값 | 한국어 |
|----|--------|
| Y | 사용 |
| N | 미사용 |

### 모달 모드 (ModalMode)

| 값 | 한국어 |
|----|--------|
| create | 생성 |
| edit | 수정 |
| view | 조회 |
| delete | 삭제 |

### 정렬 방향 (SortDirection)

| 값 | 한국어 |
|----|--------|
| asc | 오름차순 |
| desc | 내림차순 |

### 공통 상태 (CommonStatus)

| 값 | 한국어 |
|----|--------|
| PENDING | 대기 |
| IN_PROGRESS | 진행중 |
| COMPLETED | 완료 |
| CANCELLED | 취소 |
| PENDING_SIGNATURE | 서명 대기 |
| SUBMITTED | 제출 |

### 메시지 타입 (MessageType)

| 값 | 한국어 |
|----|--------|
| SMS | 문자메시지 |
| LMS | 장문 메시지 |
| MMS | 멀티미디어 메시지 |

### 발송 상태 (SendStatus)

| 값 | 한국어 |
|----|--------|
| PENDING | 대기 |
| SUCCESS | 성공 |
| FAILED | 실패 |

### 주문 긴급도 (OrderUrgency)

| 값 | 한국어 |
|----|--------|
| URGENT | 긴급 |
| NORMAL | 보통 |
| LOW | 여유 |

### 주문 요청 상태 (OrderRequestStatus)

| 값 | 한국어 |
|----|--------|
| REQUESTED | 대기 |
| APPROVED | 승인 |
| REJECTED | 반려 |
| COMPLETED | 완료 |

---

## 약어 사전 (Abbreviations)

| 약어 | 전체 표현 | 한국어 |
|------|----------|--------|
| API | Application Programming Interface | 응용 프로그래밍 인터페이스 |
| GPS | Global Positioning System | 위성항법시스템 |
| OEM | Original Equipment Manufacturer | 주문자상표부착생산 |
| PDF | Portable Document Format | 휴대용 문서 형식 |
| SKU | Stock Keeping Unit | 재고관리단위 |
| SMS | Short Message Service | 단문 메시지 서비스 |
| LMS | Long Message Service | 장문 메시지 서비스 |
| MMS | Multimedia Message Service | 멀티미디어 메시지 서비스 |
| G2B | Government to Business | 정부조달시스템 (나라장터) |
| PK | Primary Key | 기본키 |
| URL | Uniform Resource Locator | 웹 주소 |

---

## 참고 사항

### 네이밍 컨벤션

- **변수명**: camelCase 사용 (`itemId`, `deliveryRequestNo`)
- **상수명**: UPPER_SNAKE_CASE 사용 (`PENDING`, `IN_PROGRESS`)
- **타입명**: PascalCase 사용 (`ShippingItem`, `DeliveryStatus`)

### 특이 사항

1. **사용자 ID 이원화**: `userid` (숫자 PK) vs `loginId` (문자열 로그인용)
2. **다중 서명 체계**: 현장소장 + 감리원 이중 서명 프로세스
3. **자금 흐름**: 선급금(70%) → 기성금(N차) → 잔금
4. **OEM 지급**: 출하 시 OEM에 70% 선지급

---

*이 용어 사전은 terminology-dictionary 플러그인에 의해 자동 생성되었습니다.*
