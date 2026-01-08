# 출하관리시스템 사용자 매뉴얼 작성 스킬

이 스킬은 PTLPSM(출하관리시스템) 사용자 매뉴얼 작성 및 업데이트 시 참조하는 시스템 정보를 제공합니다.

---

## 1. 시스템 전체 업무 흐름

### 1.1 엔티티 관계도

```
Order (발주)
  │
  ├─ 1:N → Shipment (출하)
  │         │
  │         └─ 1:1 → Transport (운송)
  │                   │
  │                   └─ 1:1 → Delivery (납품확인)
  │                             │
  │                             └─ 1:N → DeliveryPhoto (납품사진)
  │
  ├─ 1:1 → Fund (자금)
  │         │
  │         ├─ 1:N → AdvancePayment (선급금)
  │         ├─ 1:N → ProgressPaymentRequest (기성금)
  │         ├─ 1:1 → BalanceRequest (잔금)
  │         └─ 1:N → OemPayment (OEM지급)
  │
  ├─ 1:N → Baseline (기성/납품완료 차수)
  │         │
  │         └─ 1:N → BaselineItem (품목 스냅샷)
  │
  └─ 1:1 → DeliveryDone (납품완료계)
            │
            ├─ 1:N → DeliveryDoneItem (품목)
            └─ 1:N → DeliveryDonePhoto (사진)
```

### 1.2 핵심 관계 설명

| 관계 | 설명 | 비즈니스 의미 |
|------|------|--------------|
| Order → Shipment (1:N) | 발주 1건에 여러 출하 가능 | 계약 물량을 분할 출하 |
| Shipment → Transport (1:1) | 출하 1건에 운송 1건 | 출하별 운송장 발급 |
| Transport → Delivery (1:1) | 운송 1건에 납품확인 1건 | 현장 도착 후 납품확인 |
| Order → Baseline (1:N) | 발주 1건에 여러 기성 차수 | 기성금 분할 청구 |
| Baseline → BaselineItem (1:N) | 기성 차수에 품목 스냅샷 | 청구 시점 정보 고정 |

---

## 2. 상태 흐름 정의

### 2.1 출하(Shipment) 상태

```
PENDING (대기)
    │
    └─→ IN_PROGRESS (진행중)  ← 운송 배차 시
              │
              └─→ COMPLETED (완료)  ← 납품확인 완료 시
```

**상태별 가능 작업:**
- PENDING: 수정, 삭제 가능
- IN_PROGRESS: 추가변경 가능, 삭제 불가
- COMPLETED: 수정/삭제 불가

### 2.2 운송(Transport) 상태

```
PENDING (대기)  ← 운송장 등록
    │
    └─→ IN_PROGRESS (배송중)  ← 배송 출발
              │
              └─→ COMPLETED (완료)  ← 배송 도착
```

### 2.3 납품확인(Delivery) 상태

```
IN_PROGRESS (진행중)  ← 모바일 URL 발송
      │
      └─→ COMPLETED (완료)  ← 서명 + 사진 완료
```

**완료 조건:**
- 인수자 서명 필수
- 사진 최소 1장 필수
- GPS 위치 자동 기록

### 2.4 기성 차수(Baseline) 상태

```
DRAFT (작성중)  ← 차수 생성
    │
    └─→ PENDING_SIGNATURE (서명대기)  ← 서명 URL 발송
              │
              ├─→ PARTIAL_SIGNED  ← 현장소장만 서명
              │         │
              │         └─→ SIGNATURE_COMPLETED  ← 감리원도 서명
              │                   │
              │                   └─→ CONFIRMED (확정)  ← PDF 자동생성
              │
              └─→ CANCELLED (취소)
```

**서명 상태:**
- PENDING_SIGNATURE: 서명 대기
- PARTIAL_SIGNED: 현장소장만 완료
- SIGNATURE_COMPLETED: 양측 모두 완료

### 2.5 자금(Fund) 상태

```
ACTIVE (진행중)  ← 발주 생성 시 자동 생성
    │
    └─→ COMPLETED (완료)  ← 선급금+기성금+잔금 모두 PAID
```

### 2.6 결제(Payment) 상태

선급금/기성금/잔금 모두 동일한 상태 흐름:

```
REQUESTED (신청)
    │
    ├─→ APPROVED (승인)
    │       │
    │       └─→ PAID (수금완료)
    │
    └─→ REJECTED (반려)
```

---

## 3. 자금 흐름

### 3.1 선급금 (Advance Payment)

**신청 조건:**
- Fund 정보 등록 후 언제든 신청 가능
- 출하 여부와 무관
- 1회만 신청 가능

**금액 계산:**
```
선급금 = 계약금액 × 선급금비율(기본 70%)
```

**신청 후 자동 생성 문서 (5종):**
1. 선급금신청서
2. 선급금사용계획
3. 선급금사용확약서
4. 선급금사용각서
5. 선급금정산서

### 3.2 기성금 (Progress Payment)

**신청 조건:**
- 납품확인 완료된 출하만 청구 가능
- 인수증 서명이 완료되어야 함
- 이미 청구된 출하는 중복 청구 불가

**청구 프로세스:**
1. 청구 가능 출하 선택
2. 기성 차수(Baseline) 생성
3. 현장소장 + 감리원 서명 발송
4. 양측 서명 완료 → PDF 자동 생성
5. 기성금 수금 확인

**금액 계산:**
```
기성금 = Σ(청구 출하의 품목별 수량 × 단가)
OEM지급액 = 기성금 × 70%
```

### 3.3 잔금 (Balance)

**신청 조건:**
- 납품완료계 완료 후에만 신청 가능
- 모든 출하의 납품확인 완료 필수

**금액 계산:**
```
잔금 = 계약금액 - 선급금(수금액) - 기성금누계(수금액)
```

---

## 4. 서류 생성 타이밍

### 4.1 인수증 PDF

**생성 시점:** 납품확인 완료 (서명 + 사진)
**내용:**
- 출하 정보
- 품목별 납품 수량
- 인수자 서명
- 납품 사진

### 4.2 납품확인서 + 사진대지 PDF

**생성 시점:** 기성 차수 서명 완료 (현장소장 + 감리원)
**내용:**
- 납품확인서: 기성 차수에 포함된 출하 내역, 품목별 수량/금액, 양측 서명
- 사진대지: 해당 출하들의 현장 사진 (출하당 2장)

### 4.3 납품완료계 3종 PDF

**생성 시점:** 납품완료계 최종 서명 완료
**생성 문서:**
1. **납품확인서**: 전체 납품 내역 종합
2. **납품완료계**: 조달청 제출용 보고서
3. **사진대지**: 전체 현장 사진 모음

---

## 5. 비즈니스 규칙

### 5.1 수량 관리

```
발주수량 ≥ Σ(출하수량)
출하수량 = 납품확인수량 (정상 완료 시)
```

**추가변경 규칙:**
- 기성금 청구에 포함된 출하는 수량 변경 불가
- 수량 감소 시 변경 이력 기록
- 서명 완료된 건은 재서명 필요

### 5.2 기성금 청구 제약

- 납품확인 완료된 출하만 청구 가능
- 동일 출하는 중복 청구 불가
- 차수 확정 후 해당 출하 수량 변경 불가

### 5.3 서명 제약

- 현장소장 → 감리원 순서로 서명
- URL 유효기간: 24시간
- 만료 시 재발송 필요

---

## 6. API 엔드포인트 요약

### 6.1 출하 관련
- `GET /admin/shipments` - 목록
- `POST /admin/shipments` - 등록
- `PUT /admin/shipments/{id}` - 수정
- `POST /admin/shipments/{id}/additional-change` - 추가변경

### 6.2 납품확인 관련
- `GET /admin/deliveries/tree` - 트리 구조 조회
- `GET /m/delivery/{token}` - 모바일 납품 정보
- `POST /m/delivery/{token}/signature` - 서명 업로드
- `POST /m/delivery/{token}/photos` - 사진 업로드
- `POST /m/delivery/{token}/confirm` - 완료 처리

### 6.3 기성 차수 관련
- `GET /admin/baselines/order/{orderId}` - 차수 목록
- `GET /admin/baselines/order/{orderId}/available-shipments` - 청구 가능 출하
- `POST /admin/baselines/create-and-send-signature` - 차수 생성 + 서명 발송
- `GET /admin/baselines/{id}/pdf/confirmation` - 납품확인서 PDF
- `GET /admin/baselines/{id}/pdf/photo-sheet` - 사진대지 PDF

### 6.4 자금 관련
- `GET /admin/funds/{id}` - 상세
- `POST /admin/funds/{id}/advances` - 선급금 신청
- `POST /admin/funds/{id}/payments` - 기성금 청구
- `POST /admin/funds/{id}/payments/{paymentId}/confirm` - 수금 확인
- `POST /admin/funds/{id}/balance/confirm` - 잔금 수금 확인

---

## 7. 매뉴얼 작성 가이드라인

### 7.1 용어 통일

| 시스템 용어 | 매뉴얼 표기 |
|------------|-----------|
| Order | 발주 |
| Shipment | 출하 |
| Transport | 운송 |
| Delivery | 납품확인 |
| Baseline | 기성 차수 |
| Fund | 자금 |
| AdvancePayment | 선급금 |
| ProgressPayment | 기성금 |
| Balance | 잔금 |
| DeliveryDone | 납품완료계 |

### 7.2 상태 표기

| 영문 | 한글 |
|------|------|
| PENDING | 대기 |
| IN_PROGRESS | 진행중 |
| COMPLETED | 완료 |
| DRAFT | 작성중 |
| PENDING_SIGNATURE | 서명대기 |
| PARTIAL_SIGNED | 일부서명 |
| SIGNATURE_COMPLETED | 서명완료 |
| CONFIRMED | 확정 |
| REQUESTED | 신청 |
| APPROVED | 승인 |
| PAID | 수금완료 |
| REJECTED | 반려 |
| CANCELLED | 취소 |

### 7.3 다이어그램 작성 규칙

- ASCII 박스 다이어그램 사용
- 상태 전이는 화살표(→, ↓)로 표현
- 반복은 ◄─── 주석으로 표시
- 조건은 괄호 안에 명시

---

**문서 정보**
- 버전: 1.0
- 작성일: 2026-01-02
- 대상: PTLPSM 사용자 매뉴얼 작성자
