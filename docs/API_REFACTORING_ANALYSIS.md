# 📊 전체 페이지 API 사용 패턴 분석 및 리팩토링 우선순위

**작성일**: 2025-10-25
**목적**: 각 페이지의 API 사용 패턴을 분석하여 리팩토링 필요성 및 우선순위 결정

---

## 📋 분석 대상 페이지 (총 6개)

| # | 페이지 | 파일 경로 | 라인수 | API 호출 횟수 | 상태 |
|---|--------|----------|--------|--------------|------|
| 1 | 출하 등록 | `pages/admin/shipping/register.vue` | 551줄 | 1개 | 🟡 중간 |
| 2 | 출하 수정 | `pages/admin/shipping/edit/[id].vue` | 538줄 | 1개 (최적화 완료) | ✅ 완료 |
| 3 | 운송 등록 | `pages/admin/transport/register.vue` | 519줄 | 2개 | 🟢 높음 |
| 4 | 운송 수정 | `pages/admin/transport/edit/[id].vue` | 928줄 | 1개 | 🟡 중간 |
| 5 | 발주 상세 | `pages/admin/order/detail/[id].vue` | 276줄 | 1개 | 🔵 불필요 |
| 6 | 발주 수정 | `pages/admin/order/edit/[id].vue` | 580줄 | 1개 | 🟡 중간 |

---

## 1️⃣ 출하 등록 (`pages/admin/shipping/register.vue`)

### 📌 기본 정보
- **파일 크기**: 551줄
- **API 호출 횟수**: 1개
- **사용 API**: `shipmentService.getShipmentStatusByOrder(deliveryRequestNo)`

### 🔍 API 사용 패턴

**호출 시점**: 발주 선택 팝업에서 발주 선택 시 (`handleOrderSelect()` - Line 401)

```typescript
// 1. 발주 선택 팝업에서 발주 객체 전달받음 (order 객체에 이미 모든 정보 포함)
const handleOrderSelect = async (order: OrderDetailResponse) => {
  // 2. 발주 정보 폼에 입력 (Lines 393-398)
  formData.deliveryRequestNo = order.deliveryRequestNo
  formData.deliveryRequestDate = order.deliveryRequestDate
  formData.client = order.client
  formData.projectName = order.projectName

  // 3. 출하 현황 API 호출 (Line 401)
  const shipmentStatus = await shipmentService.getShipmentStatusByOrder(
    order.deliveryRequestNo
  )

  // 4. 품목 데이터 매핑 (Lines 405-441)
  const orderItems = order.items.map(item => {
    const statusItem = shipmentStatus.items.find(si => si.skuId === item.skuId)

    // 잔여수량 계산
    const orderQty = item.quantity || 0
    const totalShippedQty = statusItem?.totalShippedQuantity || 0
    const remainingQuantity = Math.max(0, orderQty - totalShippedQty)

    return {
      // ... 14개 필드 매핑
      quantity: item.quantity,
      shippingQuantity: 0,  // 기본값
      remainingQuantity,
      shippedQuantity: totalShippedQty,
      // ...
    }
  })
  .filter(item => item.remainingQuantity > 0)  // 출하 가능한 품목만
}
```

### 📊 데이터 플로우

```
사용자 발주 선택
  ↓
발주 팝업에서 order 객체 전달 (발주 정보 + 품목 전체 포함)
  ↓
출하 현황 API 호출 (1번)
  ↓
SKU별 누적 출하수량 조회
  ↓
클라이언트에서 품목 매핑 (37줄)
  ↓
잔여수량 > 0인 품목만 필터링
  ↓
품목 목록 표시
```

### 🎯 복잡도 분석

- **API 호출**: 1번 (효율적)
- **데이터 매핑 로직**: 37줄 (Lines 405-441)
- **계산 필드**: `remainingQuantity`, `shippedQuantity`
- **필터링 로직**: 1줄 (Line 442)
- **의존성**: 발주 선택 팝업에 의존 (order 객체 제공)

### 🟡 리팩토링 필요성: **중간** (우선순위: 4위)

#### ✅ 장점 (리팩토링 불필요 이유)
- API 호출 1번만 (이미 효율적)
- 발주 정보는 팝업에서 받아옴 (추가 API 불필요)
- 통합 API 만들어도 효과 미미

#### ⚠️ 단점 (리팩토링 필요 이유)
- 데이터 매핑 로직 37줄 (복잡도 중간)
- 클라이언트에서 잔여수량 계산

#### 💡 리팩토링 방안

**Option 1: Composable 추출** (권장)
```typescript
// composables/admin/useShippingItemMapper.ts
export const useShippingItemMapper = () => {
  const mapOrderItemsToShipping = (
    orderItems: OrderItem[],
    shipmentStatus: ShipmentOrderStatus
  ) => {
    return orderItems
      .map(item => {
        const statusItem = shipmentStatus.items.find(si => si.skuId === item.skuId)
        const orderQty = item.quantity || 0
        const totalShippedQty = statusItem?.totalShippedQuantity || 0
        const remainingQuantity = Math.max(0, orderQty - totalShippedQty)

        return { /* ... */ }
      })
      .filter(item => item.remainingQuantity > 0)
  }

  return { mapOrderItemsToShipping }
}
```

**Option 2: 통합 API 생성** (비권장)
- 효과 미미 (API 이미 1번)
- 발주 선택 팝업 구조 변경 필요
- 복잡도 증가

#### 📈 예상 효과 (Option 1 적용 시)

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| 파일 크기 | 551줄 | ~490줄 | 11% ↓ |
| handleOrderSelect | 60줄 | ~25줄 | 58% ↓ |
| 재사용성 | - | Composable | ✅ |
| 가독성 | 중간 | 높음 | ✅ |

---

## 2️⃣ 출하 수정 (`pages/admin/shipping/edit/[id].vue`)

### 📌 기본 정보
- **파일 크기**: 538줄 (Before: 582줄)
- **API 호출 횟수**: 1개 (Before: 3개)
- **사용 API**: `shipmentService.getShipmentDetailWithOrder(shipmentId)`

### ✅ 리팩토링 상태: **완료**

#### 🎉 달성한 개선 효과

| 항목 | Before | After | 개선율 |
|------|--------|-------|--------|
| HTTP 요청 | 3회 | 1회 | **66% ↓** |
| DB 쿼리 | 5회 | 1회 | **80% ↓** |
| 파일 크기 | 582줄 | 538줄 | **7.6% ↓** |
| fetchFunction | 58줄 | 20줄 | **65% ↓** |
| 응답 시간 | ~190ms | ~60ms | **68% ↓** |

#### 📝 적용된 기술
- 새 통합 API: `GET /api/admin/shipments/{shipmentId}/detail-with-order`
- 서버에서 JOIN 쿼리로 모든 데이터 제공
- 클라이언트 매핑 로직 단순화

#### 📚 참고 문서
- API 스펙: `docs/API_SPEC_SHIPMENT_DETAIL_WITH_ORDER.md`
- 리팩토링 문서: `docs/REFACTORING_SHIPMENT_EDIT.md`

---

## 3️⃣ 운송 등록 (`pages/admin/transport/register.vue`)

### 📌 기본 정보
- **파일 크기**: 519줄
- **API 호출 횟수**: 2개
- **사용 API**:
  - `shipmentService.getShipmentDetail(shipmentId)`
  - `shipmentService.getShipmentStatusByOrder(deliveryRequestNo)`

### 🔍 API 사용 패턴

**호출 시점**: 출하 선택 팝업에서 출하 선택 시 (`handleShipmentSelect()` - Lines 416, 420)

```typescript
const handleShipmentSelect = async (shipment: ShipmentListItem) => {
  // 1. 출하 상세 조회 (Line 416)
  const detail = await shipmentService.getShipmentDetail(shipment.shipmentId)
  formData.shipmentId = detail.shipmentId.toString()

  // 2. 출하 현황 조회 (Line 420)
  const orderStatus = await shipmentService.getShipmentStatusByOrder(
    detail.deliveryRequestNo
  )

  // 3. 인수증 데이터 업데이트 (Lines 423-429)
  receiptData.value = {
    clientName: orderStatus.items[0]?.itemName?.split(' ')[0] || '',
    deliveryLocation: formData.deliveryAddress || '',
    managerContact: formData.siteSupervisorName || '',
    unloadingTime: formData.expectedArrival?.slice(11, 16) || '',
    remarks: formData.deliveryMemo || ''
  }

  // 4. 품목 목록 업데이트 (Lines 432-438)
  productList.value = orderStatus.items.map(item => ({
    name: item.itemName || '',
    thickness: item.specification || '',
    quantity: item.orderQuantity.toString(),
    specification: `${item.skuName || ''} (${item.skuId})`,
    remarks: `단위: ${item.unit || ''}`
  }))
}
```

### 📊 데이터 플로우

```
사용자 출하 선택
  ↓
출하 상세 API 호출 (1번)
  ↓
shipmentId, deliveryRequestNo 획득
  ↓
출하 현황 API 호출 (2번) - deliveryRequestNo 필요
  ↓
SKU별 정보 조회
  ↓
인수증 데이터 생성
  ↓
품목 목록 생성
```

### 🎯 복잡도 분석

- **API 호출**: 2번 (순차적 의존)
- **데이터 매핑 로직**: 17줄 (Lines 423-438)
- **의존성**: ① → ② (waterfall)
- **용도**: 인수증 출력용 데이터 준비

### 🟢 리팩토링 필요성: **높음** (우선순위: 1위)

#### ⚠️ 문제점
1. **순차적 API 호출** (Waterfall)
   - 출하 상세 → 출하 현황 (순차 대기)
   - 총 지연 시간 = API① + API②

2. **출하 수정과 동일한 패턴**
   - 같은 2개 API 사용
   - 같은 데이터 조합 로직

3. **인수증 출력 위해 추가 정보 필요**
   - 수요기관명 (client)
   - 품목 상세 정보

#### 💡 리팩토링 방안

**새 통합 API 생성** (권장)

```
GET /api/admin/shipments/{shipmentId}/with-order-summary
```

**Response:**
```json
{
  "shipmentId": 3,
  "orderId": 3,
  "deliveryRequestNo": "24-22-4-31556-00",
  "shipmentDate": "2025-10-25",

  "order": {
    "client": "전라남도",
    "projectName": "농업인지원센터건립공사관급자재구매"
  },

  "items": [
    {
      "skuId": "23561446",
      "itemName": "기포단열재",
      "skuName": "JYGB-60LC2",
      "specification": "폴리우레탄기포단열재,정우산업,JYGB-60LC,1000×1000×60mm",
      "unit": "㎡",
      "orderQuantity": 1332,
      "shipmentQuantity": 1332
    }
  ]
}
```

#### 📈 예상 효과

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| HTTP 요청 | 2회 | 1회 | **50% ↓** |
| DB 쿼리 | 3회 | 1회 | **66% ↓** |
| 응답 시간 | ~130ms | ~60ms | **53% ↓** |
| 파일 크기 | 519줄 | ~500줄 | 3.7% ↓ |
| 데이터 매핑 | 17줄 | ~8줄 | 52% ↓ |

#### 📋 백엔드 작업 필요
- 새 API 엔드포인트 생성
- 2-way JOIN: `shipments + orders`
- 간소화된 응답 구조 (인수증 출력용)

---

## 4️⃣ 운송 수정 (`pages/admin/transport/edit/[id].vue`)

### 📌 기본 정보
- **파일 크기**: 928줄 ⚠️ **매우 큼!**
- **API 호출 횟수**: 1개
- **사용 API**: `orderService.getOrderDetail(orderId)`

### 🔍 API 사용 패턴

**호출 시점**: 인수증 출력 버튼 클릭 시 (`loadReceiptData()` - Line 675)

```typescript
const loadReceiptData = async () => {
  // 1. 운송장 상세 정보 조회 (Line 672)
  const transportDetail = await transportService.getTransportDetail(
    formData.value.transportId
  )

  // 2. 발주 상세 정보 조회 (Line 675)
  const orderDetail = await orderService.getOrderDetail(transportDetail.orderId)

  // 3. 인수증 데이터 업데이트 (Lines 678-684)
  receiptData.value = {
    clientName: orderDetail.client || '',
    deliveryLocation: formData.value.deliveryAddress || '',
    managerContact: `${formData.value.siteSupervisorName || ''} ${formData.value.siteSupervisorPhone || ''}`.trim(),
    unloadingTime: formData.value.expectedArrival?.slice(11, 16) || '',
    remarks: formData.value.deliveryMemo || ''
  }

  // 4. 품목 목록 업데이트 - 복잡한 파싱 로직! (Lines 687-719)
  productList.value = orderDetail.items.map(item => {
    // specification 파싱: "폴리우레탄기포단열재,정우산업,JYGB-60LC,1000×1000×60mm"
    const parts = (item.specification || '').split(',').map(p => p.trim())

    // 두께 추출: parts[3] = "1000×1000×60mm" → "60T"
    let thickness = '-'
    if (parts.length >= 4) {
      const sizeStr = parts[3]
      const sizeParts = sizeStr.split('×').map(s => s.trim())
      if (sizeParts.length === 3) {
        const thicknessNum = sizeParts[2].replace(/[^\d]/g, '')
        thickness = thicknessNum ? `${thicknessNum}T` : '-'
      }
    }

    // 제조사 추출: parts[1]
    const manufacturer = parts.length >= 2 ? parts[1] : ''

    return {
      name: item.productName || '',
      thickness,
      quantity: item.quantity?.toString() || '0',
      specification: `${item.skuNm || ''} (${manufacturer})`,
      remarks: `단위: ${item.unit || ''}`
    }
  })
}
```

### 📊 데이터 플로우

```
인수증 출력 버튼 클릭
  ↓
운송장 상세 조회 (transportService)
  ↓
orderId 획득
  ↓
발주 상세 API 호출 (1번)
  ↓
발주 정보 + 품목 조회
  ↓
복잡한 specification 파싱 (34줄)
  ↓
인수증 데이터 생성
```

### 🎯 복잡도 분석

- **파일 크기**: 928줄 ⚠️ **매우 큼!**
- **API 호출**: 1번 (효율적)
- **파싱 로직**: 34줄 (Lines 686-719) **매우 복잡!**
- **용도**: 인수증 출력 전용
- **문제**: specification 문자열을 파싱하여 여러 필드 추출

### 🟡 리팩토링 필요성: **중간** (우선순위: 2위)

#### ✅ 장점
- API 호출 1번만 (효율적)
- 필요한 정보를 모두 조회 가능

#### ⚠️ 단점
- **파일이 928줄로 매우 큼!**
- specification 파싱 로직 복잡 (34줄)
- 인수증 관련 로직이 혼재

#### 💡 리팩토링 방안

**Option 1: Composable/Utils 분리** (권장)

```typescript
// utils/specificationParser.ts
export const parseSpecification = (specification: string) => {
  const parts = specification.split(',').map(p => p.trim())

  const thickness = extractThickness(parts[3])
  const manufacturer = parts[1] || ''

  return { thickness, manufacturer }
}

const extractThickness = (sizeStr: string) => {
  if (!sizeStr) return '-'

  const sizeParts = sizeStr.split('×').map(s => s.trim())
  if (sizeParts.length === 3) {
    const thicknessNum = sizeParts[2].replace(/[^\d]/g, '')
    return thicknessNum ? `${thicknessNum}T` : '-'
  }
  return '-'
}
```

```typescript
// composables/admin/useReceiptData.ts
export const useReceiptData = () => {
  const generateReceiptData = (
    orderDetail: OrderDetailResponse,
    formData: TransportFormData
  ) => {
    return {
      clientName: orderDetail.client || '',
      deliveryLocation: formData.deliveryAddress || '',
      // ...
    }
  }

  const generateProductList = (orderItems: OrderItem[]) => {
    return orderItems.map(item => {
      const { thickness, manufacturer } = parseSpecification(item.specification)
      return {
        name: item.productName || '',
        thickness,
        quantity: item.quantity?.toString() || '0',
        specification: `${item.skuNm || ''} (${manufacturer})`,
        remarks: `단위: ${item.unit || ''}`
      }
    })
  }

  return { generateReceiptData, generateProductList }
}
```

**Option 2: 인수증 컴포넌트 분리**
- 인수증 로직을 별도 컴포넌트로 분리
- 메인 페이지 간소화

**Option 3: 통합 API 생성** (비권장)
- API 이미 1번만 호출 (효과 미미)
- 파싱 로직은 프론트엔드에서 필요

#### 📈 예상 효과 (Option 1 적용 시)

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| 파일 크기 | 928줄 | ~600줄 | **35% ↓** |
| loadReceiptData | 50줄 | ~15줄 | 70% ↓ |
| 재사용성 | - | Utils + Composable | ✅ |
| 가독성 | 낮음 | 높음 | ✅ |
| 테스트 용이성 | 어려움 | 쉬움 | ✅ |

---

## 5️⃣ 발주 상세 (`pages/admin/order/detail/[id].vue`)

### 📌 기본 정보
- **파일 크기**: 276줄
- **API 호출 횟수**: 1개
- **사용 API**: `orderService.getOrderDetail(orderId)`

### 🔍 API 사용 패턴

**호출 시점**: 페이지 로드 시 (`onMounted()` - Line 233)

```typescript
onMounted(async () => {
  const orderId = Number(route.params.id)
  const data = await orderService.getOrderDetail(orderId)

  // 데이터 표시
  orderData.value = data
})
```

### 📊 데이터 플로우

```
페이지 로드
  ↓
발주 상세 API 호출 (1번)
  ↓
발주 정보 + 품목 조회
  ↓
데이터 표시 (읽기 전용)
```

### 🎯 복잡도 분석

- **파일 크기**: 276줄 (적정)
- **API 호출**: 1번 (효율적)
- **로직 복잡도**: 낮음 (단순 조회)
- **용도**: 발주 정보 조회 (읽기 전용)

### 🔵 리팩토링 필요성: **불필요** (우선순위: --)

#### ✅ 장점
- 파일 크기 적정 (276줄)
- API 호출 1번 (효율적)
- 단순 조회 페이지
- 범용 API 사용 (`getOrderDetail`)

#### 📋 결론
- 추가 최적화 여지 없음
- 현재 상태 유지 권장

---

## 6️⃣ 발주 수정 (`pages/admin/order/edit/[id].vue`)

### 📌 기본 정보
- **파일 크기**: 580줄
- **API 호출 횟수**: 1개
- **사용 API**: `orderService.getOrderDetail(orderId)`

### 🔍 API 사용 패턴

**호출 시점**: 페이지 로드 시 + 수정 완료 후 (`fetchFunction` - Lines 365, 398)

```typescript
const { ... } = useEditForm<OrderDetailResponse, any, any>({
  fetchFunction: async (id) => {
    // 발주 상세 조회 (Line 365)
    const data = await orderService.getOrderDetail(id)

    // 품목 데이터 가공
    items.value = data.items.map(item => ({
      itemId: item.itemId,
      skuId: item.skuId,
      productName: item.productName,
      // ... 여러 필드 매핑
    }))

    return data
  },

  updateFunction: async (id, data) => {
    // 수정 API 호출
    await orderService.updateOrder(id, formData)

    // 수정 후 재조회 (Line 398)
    return orderService.getOrderDetail(id)
  }
})
```

### 📊 데이터 플로우

```
페이지 로드
  ↓
발주 상세 API 호출 (1번)
  ↓
발주 정보 + 품목 조회
  ↓
폼 데이터 변환
  ↓
사용자 수정
  ↓
저장 버튼 클릭
  ↓
수정 API 호출
  ↓
재조회 API 호출 (1번)
  ↓
최신 데이터 표시
```

### 🎯 복잡도 분석

- **파일 크기**: 580줄 (다소 큼)
- **API 호출**: 1번 (효율적)
- **로직 복잡도**: 중간 (품목 수정 로직)
- **품목 테이블**: 인라인으로 작성 (복잡)

### 🟡 리팩토링 필요성: **중간** (우선순위: 3위)

#### ✅ 장점
- API 호출 1번 (효율적)
- 범용 API 사용 (`getOrderDetail`)

#### ⚠️ 단점
- 파일 크기 580줄 (다소 큼)
- 품목 테이블 로직이 복잡
- 품목 추가/삭제 로직 혼재

#### 💡 리팩토링 방안

**Option 1: 품목 테이블 컴포넌트 분리** (권장)

```typescript
// components/admin/order/OrderItemTable.vue
<template>
  <table class="items-table">
    <!-- 품목 테이블 UI -->
  </table>
</template>

<script setup lang="ts">
defineProps<{
  items: OrderItem[]
}>()

defineEmits<{
  'update:items': [items: OrderItem[]]
  'add-item': []
  'remove-item': [index: number]
}>()
</script>
```

**Option 2: Composable 추출**
```typescript
// composables/admin/useOrderItems.ts
export const useOrderItems = () => {
  const addItem = () => { /* ... */ }
  const removeItem = (index: number) => { /* ... */ }
  const validateItems = () => { /* ... */ }

  return { addItem, removeItem, validateItems }
}
```

**Option 3: 통합 API 생성** (비권장)
- API 이미 1번만 호출 (효과 미미)

#### 📈 예상 효과 (Option 1 적용 시)

| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| 파일 크기 | 580줄 | ~400줄 | **31% ↓** |
| 품목 테이블 로직 | 인라인 | 컴포넌트 | ✅ |
| 재사용성 | - | OrderItemTable | ✅ |
| 가독성 | 중간 | 높음 | ✅ |

---

## 🎯 리팩토링 우선순위 종합

### 🏆 우선순위 순위

| 순위 | 페이지 | 이유 | 리팩토링 유형 | 예상 효과 |
|------|--------|------|--------------|-----------|
| ✅ 완료 | **출하 수정** | 3개 API → 1개 API 통합 완료 | API 최적화 | HTTP 66% ↓, DB 80% ↓ |
| 🥇 1위 | **운송 등록** | 2개 API 순차 호출 (waterfall) | **API 최적화** | HTTP 50% ↓, DB 66% ↓ |
| 🥈 2위 | **운송 수정** | 파일 928줄로 매우 큼 | **컴포넌트 분리** | 코드 35% ↓ |
| 🥉 3위 | **발주 수정** | 파일 580줄, 품목 테이블 복잡 | **컴포넌트 분리** | 코드 31% ↓ |
| 4위 | **출하 등록** | 매핑 로직 37줄 | **Composable 추출** | 코드 11% ↓ |
| -- | **발주 상세** | 최적화 불필요 | -- | -- |

---

## 📋 Phase별 작업 계획

### ✅ Phase 0: 완료 (2025-10-25)
- [x] 출하 수정 - API 최적화 완료

### 🚀 Phase 1: API 최적화 (백엔드 작업 필요)

#### 1-1. 운송 등록 API 통합
- **대상**: `pages/admin/transport/register.vue`
- **작업**: 새 통합 API 생성
  ```
  GET /api/admin/shipments/{shipmentId}/with-order-summary
  ```
- **백엔드 작업**:
  - 2-way JOIN: `shipments + orders`
  - 간소화된 응답 구조
  - 인수증 출력에 필요한 필드만 제공
- **프론트엔드 작업**:
  - `shipment.service.ts`에 새 메서드 추가
  - `transport/register.vue`의 `handleShipmentSelect` 수정
  - 2개 API 호출 → 1개로 변경
- **예상 기간**: 백엔드 2일 + 프론트엔드 1일
- **예상 효과**: HTTP 50% ↓, DB 66% ↓, 코드 3.7% ↓

---

### 🛠 Phase 2: 컴포넌트 리팩토링 (프론트엔드만)

#### 2-1. 운송 수정 - Utils/Composable 분리
- **대상**: `pages/admin/transport/edit/[id].vue`
- **작업**:
  - `utils/specificationParser.ts` 생성
  - `composables/admin/useReceiptData.ts` 생성
  - 인수증 관련 로직 분리 (34줄 → Utils/Composable)
- **예상 기간**: 1일
- **예상 효과**: 928줄 → 600줄 (35% ↓)

#### 2-2. 발주 수정 - 품목 테이블 컴포넌트 분리
- **대상**: `pages/admin/order/edit/[id].vue`
- **작업**:
  - `components/admin/order/OrderItemTable.vue` 생성
  - 품목 추가/삭제 로직을 컴포넌트로 이동
- **예상 기간**: 1일
- **예상 효과**: 580줄 → 400줄 (31% ↓)

#### 2-3. 출하 등록 - Composable 추출
- **대상**: `pages/admin/shipping/register.vue`
- **작업**:
  - `composables/admin/useShippingItemMapper.ts` 생성
  - 품목 매핑 로직을 Composable로 이동 (37줄)
- **예상 기간**: 0.5일
- **예상 효과**: 551줄 → 490줄 (11% ↓)

---

## 📊 전체 예상 효과

### API 최적화 (Phase 1)
| 항목 | 개선 |
|------|------|
| HTTP 요청 감소 | 1회 감소 (운송 등록) |
| DB 쿼리 감소 | 2회 감소 (운송 등록) |
| 응답 시간 개선 | ~70ms 단축 (운송 등록) |

### 코드 최적화 (Phase 2)
| 항목 | Before | After | 개선 |
|------|--------|-------|------|
| 전체 코드 | 3,390줄 | ~2,488줄 | **~900줄 감소 (26%)** |
| 운송 수정 | 928줄 | 600줄 | 328줄 ↓ |
| 발주 수정 | 580줄 | 400줄 | 180줄 ↓ |
| 출하 등록 | 551줄 | 490줄 | 61줄 ↓ |
| 출하 수정 | 582줄 | 538줄 | 44줄 ↓ (완료) |

### 품질 향상
- ✅ 재사용성 향상 (Composable, Utils 증가)
- ✅ 가독성 향상 (파일 크기 감소)
- ✅ 유지보수성 향상 (로직 분리)
- ✅ 테스트 용이성 향상

---

## 📝 작업 진행 가이드

### Phase 1 진행 시
1. `docs/API_SPEC_SHIPMENT_WITH_ORDER_SUMMARY.md` 작성
2. 백엔드팀에 전달
3. 백엔드 API 완성 대기
4. 프론트엔드 수정 및 테스트

### Phase 2 진행 시
1. 우선순위대로 진행 (운송 수정 → 발주 수정 → 출하 등록)
2. 각 페이지별로:
   - Utils/Composable 생성
   - 기존 코드에서 로직 이동
   - 기능 동일성 테스트
   - 리팩토링 문서 업데이트

---

## 🔖 참고 문서

- **출하 수정 API 스펙**: `docs/API_SPEC_SHIPMENT_DETAIL_WITH_ORDER.md`
- **출하 수정 리팩토링**: `docs/REFACTORING_SHIPMENT_EDIT.md`
- **프로젝트 가이드**: `CLAUDE.md`
- **리팩토링 전략**: `CLAUDE.md` > Refactoring Strategy

---

## 📅 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2025-10-25 | Claude | 초안 작성 - 전체 6개 페이지 분석 완료 |
| 2025-10-25 | Claude | 출하 수정 리팩토링 완료 반영 |
