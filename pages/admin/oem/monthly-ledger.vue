<template>
  <div class="monthly-ledger-page">
    <!-- 페이지 헤더 -->
    <PageHeader
      :title="pageTitle"
      :description="pageDescription"
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="loadLedger">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          조회
        </button>
        <button class="btn-action" :disabled="exporting || !ledgerData" @click="handleExportExcel">
          <i v-if="exporting" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-file-excel" />
          엑셀
        </button>
      </template>
    </PageHeader>

    <!--
      확인 대기 배너 (리드파워 담당자 전용)

      ★ 알림만으로는 부족해서 둔 자리다. 알림은 한 번 읽으면 사라지지만
        이 배너는 확인·반려 전까지 남는다. 제조사 계정에는 아예 뜨지 않는다.
    -->
    <!-- 원장 기준 안내 (2026-11-02) -->
    <GuideNotice
      v-if="isDelivery"
      class="basis-guide"
      tone="info"
      icon="fa-info-circle"
      summary="운송장으로 납품이 확정된(현장 사진 첨부 + 인수자 서명 완료) 건과 리드파워 본사로 옮긴 물건이 원장에 올라갑니다. 실제 청구는 홈택스에서 세금계산서를 발행해서 합니다."
    >
      <ul class="basis-guide-list">
        <li>운송장을 등록·발송한 것만으로는 확정이 아닙니다. 아래 «미확정(납품 대기)»에 참고로만 보이고 합계에는 들어가지 않습니다.</li>
        <li>어느 달 원장에 들어가는지는 <b>납품일(현장 도착일)</b>로 정합니다. 서명이 다음 달에 들어와도 납품한 달에 들어갑니다.</li>
        <li>금액은 운송장으로 실제 나간 물건의 원가(그 물건을 만든 발주서 단가)입니다.</li>
        <li>
          <b>공급가액 = 납품 확정 합계 + 창고 이동 + 재고 소진 + 운송비 + 가공비 − 손실 차감</b>, 여기에 부가세 10%를 더한 것이 합계입니다.
          표 아래 «부대 항목 내역»에서 한 건씩 근거를 볼 수 있습니다.
        </li>
        <li>제조사 창고에서 리드파워 본사로 옮긴 물건은 납품 전이라도 제조사에서 나간 것이므로 <b>옮긴 날의 달</b>에 «창고 이동»으로 더합니다. 이 물건이 나중에 본사에서 납품되거나 소진될 때는 다시 더하지 않습니다.</li>
        <li>재고 소진(품질관리 발송·리드파워 계약 등)은 현장 납품은 아니지만 창고에서 나간 물건이라 소진이 확정된 달에 더합니다. 가공비는 그 발주서 물건이 처음 제조사를 떠난 달(납품 확정·창고 이동·재고 소진 중 가장 이른 달), 운송비는 그 출하의 납품일 달, 손실 차감은 정산한 달에 들어갑니다.</li>
        <li>이 원장으로 [청구 요청]을 하면 그 시점 목록이 저장됩니다. 그 뒤 같은 달에 늦게 생긴 항목은 «청구 후 추가»로 표시됩니다.</li>
        <li>발주한 내역만 보려면 «월별 발주기록» 메뉴를 보세요.</li>
      </ul>
    </GuideNotice>
    <GuideNotice
      v-else
      class="basis-guide"
      tone="warn"
      icon="fa-info-circle"
      summary="그 달에 발주한 품목(발주 수량 × 발주 단가)만 보여 주는 기록입니다. 운송비·가공비·손실 차감·재고 소진·부가세와 청구는 «월별 매출원장»에서 봅니다."
    />

    <div v-if="isDelivery && !isOemManager && pendingRequests.length > 0" class="pending-banner">
      <div class="pending-banner-header">
        <i class="fas fa-exclamation-triangle" />
        <span>확인 대기 {{ pendingRequests.length }}건</span>
      </div>
      <ul class="pending-list">
        <li v-for="item in pendingRequests" :key="item.paymentId" class="pending-row">
          <span class="pending-company">{{ item.oemCompanyName || `제조사#${item.oemCompanyId}` }}</span>
          <span class="pending-month">{{ item.yearMonth }}</span>
          <span class="pending-amount">{{ formatCurrency(item.paymentAmount) }}</span>
          <span class="pending-requested">{{ formatDateTime(item.requestedAt) }}</span>
          <button class="btn-pending-go" @click="goToPending(item)">
            <i class="fas fa-arrow-right" />
            보기
          </button>
        </li>
      </ul>
    </div>

    <!-- 검색 조건 -->
    <div class="content-section">
      <div class="search-section-compact">
        <div class="search-row-single">
          <!-- OEM 제조사 -->
          <div class="search-item">
            <label>OEM 제조사:</label>
            <select v-model="selectedOemCompanyId" class="status-select" :disabled="isOemLocked" @change="handleOemChange">
              <option v-if="isFullAccess" :value="0">
                전체
              </option>
              <option v-else :value="null" disabled>
                선택하세요
              </option>
              <option
                v-for="company in oemCompanies"
                :key="company.id"
                :value="company.id"
              >
                {{ company.companyName }}
              </option>
            </select>
          </div>

          <!-- 년도 -->
          <div class="search-item">
            <label>년도:</label>
            <select v-model="selectedYear" class="status-select" @change="handleYearChange">
              <option v-for="y in availableYears" :key="y" :value="y">
                {{ y }}년
              </option>
            </select>
          </div>

          <!-- 월 -->
          <div class="search-item">
            <label>월:</label>
            <select v-model="selectedMonth" class="status-select">
              <option v-for="m in 12" :key="m" :value="String(m).padStart(2, '0')">
                {{ m }}월
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 지급 상태 카드 (전체 조회 시 숨김) -->
      <div v-if="isDelivery && ledgerData && selectedOemCompanyId !== 0" class="payment-status-card" :class="paymentStatusClass">
        <div class="status-info">
          <span class="status-label">지급상태:</span>
          <span class="status-badge" :class="paymentStatusClass">
            {{ paymentStatusLabel }}
          </span>
          <span v-if="ledgerData.paymentStatus === 'PAID' && ledgerData.paidAmount" class="paid-info">
            ({{ formatCurrency(ledgerData.paidAmount) }} / {{ ledgerData.paidDate }})
          </span>
          <!--
            감사 이력 — 누가 언제 청구·확인했는지.
            예전에는 status 만 바뀌고 이게 전혀 안 남아 분쟁 시 댈 근거가 없었다.
          -->
          <span v-if="ledgerData.requestedBy" class="audit-trail">
            청구 {{ ledgerData.requestedBy }} ({{ formatDateTime(ledgerData.requestedAt) }})
            <template v-if="ledgerData.confirmedBy">
              · 확인 {{ ledgerData.confirmedBy }} ({{ formatDateTime(ledgerData.confirmedAt) }})
            </template>
            <template v-if="ledgerData.paidBy">
              · 지급 {{ ledgerData.paidBy }}
            </template>
          </span>
        </div>
        <div class="status-actions">
          <!-- 제출된 지급요청서 보기 (리드파워·제조사 공통) -->
          <button
            v-if="ledgerData.paymentStatus !== 'NONE'"
            class="btn-action"
            @click="openDocumentView()"
          >
            <i class="fas fa-file-invoice" />
            지급요청서 보기
          </button>
          <!-- OEM 담당자: 지급 요청 -->
          <button
            v-if="isOemManager && ledgerData.paymentStatus === 'NONE' && Number(ledgerData.payableAmount || 0) > 0"
            class="btn-action btn-primary"
            @click="handlePaymentRequest"
          >
            <i class="fas fa-paper-plane" />
            지급요청
          </button>
          <!-- OEM 담당자: 요청 취소 -->
          <button
            v-if="isOemManager && ledgerData.paymentStatus === 'PENDING'"
            class="btn-action btn-danger"
            @click="handleCancelRequest"
          >
            <i class="fas fa-times" />
            요청취소
          </button>
          <!-- 관리자: 지급 확인 -->
          <button
            v-if="!isOemManager && ledgerData.paymentStatus === 'PENDING'"
            class="btn-action btn-success"
            @click="handleConfirm"
          >
            <i class="fas fa-check" />
            지급확인
          </button>
          <!-- 관리자: 반려 — 금액이 맞지 않는 청구를 사유와 함께 돌려보낸다 -->
          <button
            v-if="!isOemManager && ledgerData.paymentStatus === 'PENDING'"
            class="btn-action btn-danger"
            @click="showRejectModal = true"
          >
            <i class="fas fa-undo" />
            반려
          </button>
          <!-- 관리자: 지급 완료 -->
          <button
            v-if="!isOemManager && ledgerData.paymentStatus === 'CONFIRMED'"
            class="btn-action btn-primary"
            @click="showCompleteModal = true"
          >
            <i class="fas fa-check-double" />
            지급완료
          </button>
          <!-- 관리자: 확인 취소 — 잘못 누른 확인을 되돌린다 -->
          <button
            v-if="!isOemManager && ledgerData.paymentStatus === 'CONFIRMED'"
            class="btn-action"
            @click="handleRevertConfirm"
          >
            <i class="fas fa-rotate-left" />
            확인취소
          </button>
        </div>
      </div>

      <!--
        마지막 반려 사유

        ★ 반려건은 paymentStatus 에 실리지 않는다(살아있는 청구가 아니므로 상태는 다시 «미요청»).
          그래야 제조사가 금액을 고쳐 재청구할 수 있다. 다만 «왜 한 번 돌아왔는지» 는 남아야 해서
          상태와 무관하게 이 줄을 띄운다.
      -->
      <!--
        ★ 재요청이 접수되면(요청완료·확인완료·지급완료) 숨긴다. 남겨 두면 아직 반려 상태처럼 보인다(2026-09-22 테스트).
          반려 내역은 아래 «지급요청 이력» 에 차수별로 남는다.
      -->
      <div v-if="ledgerData && ledgerData.lastRejectReason && ledgerData.paymentStatus === 'NONE'" class="reject-notice">
        <i class="fas fa-circle-exclamation" />
        <div class="reject-body">
          <strong>반려됨</strong>
          <span class="reject-reason">{{ ledgerData.lastRejectReason }}</span>
          <span class="reject-meta">
            {{ ledgerData.lastRejectedBy }} · {{ formatDateTime(ledgerData.lastRejectedAt) }}
          </span>
        </div>
      </div>

      <!-- 청구 후 추가 (2026-11-02) — 그 달 청구 뒤에 확정된 납품·재고 소진·운송비·가공비 -->
      <div v-if="isDelivery && lateCount > 0" class="late-notice">
        <i class="fas fa-triangle-exclamation" />
        <span>
          이 달 청구 요청 뒤에 생긴 항목 <b>{{ lateCount }}건</b>
          (금액 {{ formatCurrency(ledgerData?.lateConfirmedAmount) }})이 있습니다.
          청구한 금액에는 들어 있지 않습니다 — 표와 «부대 항목 내역»의 «청구 후 추가» 표시를 확인하고 리드파워 담당자와 추가 청구를 협의하세요.
        </span>
      </div>

      <!--
        지급요청 이력 (차수별) — 2026-09-22
        반려되면 상태가 «미요청» 으로 돌아가 처음 올린 서류를 다시 볼 수 없었다.
        돈이 걸린 분쟁에서 «그때 무엇을 올렸고 왜 돌려보냈는지» 가 남아야 한다.
      -->
      <div v-if="paymentHistory.length > 0 && selectedOemCompanyId !== 0" class="history-box">
        <div class="history-title">
          <i class="fas fa-clock-rotate-left" /> 지급요청 이력 ({{ paymentHistory.length }}건)
        </div>
        <table class="history-table">
          <thead>
            <tr>
              <th>차수</th>
              <th>요청일시</th>
              <th>요청자</th>
              <th class="text-right">
                청구 공급가액
              </th>
              <th>상태</th>
              <th>반려 사유 / 처리</th>
              <th>첨부</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in paymentHistory" :key="h.paymentId">
              <td>{{ h.seq }}차</td>
              <td>{{ formatDateTime(h.createdAt) }}</td>
              <td>{{ h.createdByName || h.createdBy }}</td>
              <td class="text-right">
                {{ formatCurrency(h.paymentAmount) }}
              </td>
              <td>
                <span class="history-status" :class="`hs-${h.status}`">{{ HISTORY_STATUS_LABELS[h.status] || h.status }}</span>
              </td>
              <td class="history-note">
                <template v-if="h.status === 'REJECTED'">
                  {{ h.rejectReason }} <span class="muted">({{ h.rejectedBy }})</span>
                </template>
                <template v-else-if="h.status === 'PAID'">
                  {{ formatCurrency(h.paidAmount ?? 0) }} 지급 · {{ h.paidDate }}
                </template>
                <template v-else-if="h.status === 'CONFIRMED'">
                  확인 {{ h.confirmedBy }}
                </template>
                <template v-else>
                  확인 대기
                </template>
              </td>
              <td>{{ h.attachments?.length || 0 }}건</td>
              <td>
                <button class="btn-history-doc" @click="openDocumentView(h)">
                  <i class="fas fa-file-invoice" /> 서류 보기
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="loading-message">
        <i class="fas fa-spinner fa-spin" />
        <p>데이터를 불러오는 중...</p>
      </div>

      <!-- 데이터 없음 -->
      <div v-else-if="!ledgerData || (ledgerData.items.length === 0 && !hasAnyCharge)" class="no-data-message">
        <i class="fas fa-book" />
        <p v-if="!selectedOemCompanyId && selectedOemCompanyId !== 0">
          OEM 제조사를 선택한 후 조회하세요.
        </p>
        <p v-else-if="isDelivery">
          해당 월에 납품이 확정된 운송장이나 창고 이동·재고 소진·운송비·가공비·손실 차감이 없습니다.
        </p>
        <p v-else>
          해당 월에 발주 데이터가 없습니다.
        </p>
      </div>

      <!-- 원장 테이블 -->
      <div v-else class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>{{ isDelivery ? '납품 확정' : '발주 품목' }} {{ ledgerData.items.length }}건</span>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table ledger-table">
            <colgroup>
              <col style="width: 50px;">
              <col v-if="selectedOemCompanyId === 0" style="width: 120px;">
              <col style="width: 120px;">
              <col style="width: 90px;">
              <col style="width: 90px;">
              <col style="width: 130px;">
              <col style="width: auto; min-width: 180px;">
              <col style="width: auto; min-width: 160px;">
              <col style="width: 80px;">
              <col style="width: 110px;">
              <col style="width: 140px;">
              <col style="width: 100px;">
              <col style="width: 120px;">
            </colgroup>
            <thead>
              <tr>
                <th class="text-center">
                  #
                </th>
                <th v-if="selectedOemCompanyId === 0">
                  제조사
                </th>
                <!-- 납품 기준(2026-11-02): 같은 칸에 출하번호 · 납품일 · 운송장번호 -->
                <th>{{ isDelivery ? '출하번호' : '발주서번호' }}</th>
                <th>{{ isDelivery ? '납품일' : '발주일자' }}</th>
                <th>{{ isDelivery ? '운송장번호' : '연결 출하' }}</th>
                <th>수요기관</th>
                <th>사업명</th>
                <th>규격</th>
                <th class="text-right">
                  수량
                </th>
                <th class="text-right">
                  {{ isDelivery ? '원가' : '발주 단가' }}
                </th>
                <th class="text-right">
                  금액<span class="th-sub">{{ isDelivery ? '(원가×수량)' : '(단가×수량)' }}</span>
                </th>
                <th class="text-center">
                  원가출처
                </th>
                <th>{{ isDelivery ? '원 발주서' : '비고' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ledgerData.items" :key="index">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td v-if="selectedOemCompanyId === 0">
                  {{ item.oemCompanyName }}
                </td>
                <template v-if="isDelivery">
                  <td :title="item.deliveryRequestNo || ''">
                    {{ item.shipmentNo || '-' }}
                  </td>
                  <td :title="item.confirmedAt ? `확정 ${formatConfirmed(item.confirmedAt)}` : ''">
                    {{ formatShortDate(item.deliveryDate) }}
                  </td>
                  <td>{{ item.trackingNumber || '-' }}</td>
                </template>
                <template v-else>
                  <td>{{ item.poNo }}</td>
                  <td>{{ formatShortDate(item.orderDate) }}</td>
                  <!-- 발주기록: 이 발주 품목이 연결된 출하번호(참고) -->
                  <td class="cell-linked" :title="item.shipmentNo || ''">
                    {{ item.shipmentNo || '-' }}
                  </td>
                </template>
                <td>{{ item.demandAgency }}</td>
                <td class="cell-project">
                  {{ item.projectName }}
                </td>
                <td class="cell-spec">
                  {{ item.spec }}
                </td>
                <td class="text-right">
                  {{ formatQuantity(item.quantity) }}
                </td>
                <td class="text-right cell-amount">
                  {{ formatCurrency(item.unitCost) }}
                  <i
                    v-if="hasCostMismatch(item)"
                    class="fas fa-exclamation-triangle cost-warn"
                    :title="costMismatchTitle(item)"
                  />
                </td>
                <td class="text-right cell-amount">
                  {{ formatCurrency(item.amount) }}
                </td>
                <td class="text-center">
                  <span
                    class="source-badge"
                    :class="costSourceClass(item.costSource)"
                    :title="costSourceHint(item.costSource)"
                  >
                    {{ costSourceLabel(item.costSource) }}
                  </span>
                </td>
                <td class="cell-remarks">
                  <template v-if="isDelivery">
                    {{ item.poNo || '-' }}
                    <span v-if="item.lateConfirmed" class="late-badge" title="이 달 청구 요청 뒤에 납품이 확정된 건 — 청구 금액에 들어 있지 않습니다">청구 후 추가</span>
                  </template>
                  <template v-else>
                    {{ item.remarks || '-' }}
                  </template>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <!-- 품목 합계 — 매출원장: 납품 확정 합계 / 발주기록: 발주 합계(여기서 끝) -->
              <tr class="total-row">
                <td :colspan="selectedOemCompanyId === 0 ? 8 : 7" class="text-right">
                  <strong>{{ isDelivery ? '납품 확정 합계' : '발주 합계' }}</strong>
                </td>
                <td class="text-right">
                  <strong>{{ formatQuantity(ledgerData.totalQuantity) }}</strong>
                </td>
                <td />
                <td class="text-right">
                  <strong>{{ formatCurrency(ledgerData.totalAmount) }}</strong>
                </td>
                <td />
                <td />
              </tr>

              <!-- 창고 이동 (제조사 창고 → 리드파워 본사) — 옮긴 달에 더한다 (2026-11-04) -->
              <tr v-if="isDelivery && hasTransfer" class="add-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  창고 이동
                  <span class="deduct-hint">({{ ledgerData.transferCharges?.length || 0 }}건 — 제조사 창고 → 리드파워 본사)</span>
                </td>
                <td />
                <td class="text-right">{{ Number(ledgerData.transferTotal) < 0 ? '−' : '+' }} {{ formatCurrency(Math.abs(Number(ledgerData.transferTotal))) }}</td>
                <td />
                <td />
              </tr>

              <!--
                재고 소진 (품질관리 발송 / 리드파워 계약 / 기타) — 매출원장만, 지급 합계에 더한다 (2026-11-02)
                ★ 납품 확정 기준에서는 창고에서 나간 물건만 돈이 된다. 소진도 나간 물건이다.
                  (발주 기준 시절 «참고 줄» 이었던 건 발주 때 이미 돈이 잡혔기 때문 — 지금은 해당 없음)
              -->
              <tr v-if="isDelivery && hasConsumption" class="add-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  재고 소진
                  <span class="deduct-hint">{{ consumptionLabel }}</span>
                </td>
                <td />
                <td class="text-right">+ {{ formatCurrency(ledgerData.consumptionTotal) }}</td>
                <td />
                <td />
              </tr>

              <!-- 운송비 (OEM 에 지불하는 건만) -->
              <tr v-if="isDelivery && hasShippingCharge" class="add-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  운송비
                  <span class="deduct-hint">{{ shippingChargeLabel }}</span>
                </td>
                <td />
                <td class="text-right">+ {{ formatCurrency(ledgerData.shippingChargeTotal) }}</td>
                <td />
                <td />
              </tr>

              <!-- 가공비 -->
              <tr v-if="isDelivery && hasProcessingCharge" class="add-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  가공비
                  <span class="deduct-hint">{{ processingChargeLabel }}</span>
                </td>
                <td />
                <td class="text-right">+ {{ formatCurrency(ledgerData.processingChargeTotal) }}</td>
                <td />
                <td />
              </tr>

              <!-- 손실 차감 (제조사 부담분이 있을 때만) -->
              <tr v-if="isDelivery && hasLossDeduction" class="deduct-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  손실 차감 (제조사 부담)
                  <span class="deduct-hint">{{ lossDeductionLabel }}</span>
                </td>
                <td />
                <td class="text-right">− {{ formatCurrency(ledgerData.lossDeductionTotal) }}</td>
                <td />
                <td />
              </tr>

              <!-- 공급가액 (가산·차감 반영 후) -->
              <tr v-if="isDelivery && hasAdjustment" class="supply-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  <strong>공급가액</strong>
                </td>
                <td />
                <td class="text-right">
                  <strong>{{ formatCurrency(ledgerData.payableAmount) }}</strong>
                </td>
                <td />
                <td />
              </tr>

              <!-- 부가세 — 매출원장만 (발주기록은 발주 합계에서 끝난다) -->
              <tr v-if="isDelivery" class="vat-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  부가세 <span class="deduct-hint">(공급가액의 10%)</span>
                </td>
                <td />
                <td class="text-right">{{ formatCurrency(ledgerData.vatAmount) }}</td>
                <td />
                <td />
              </tr>

              <!-- 합계 (VAT 포함) -->
              <tr v-if="isDelivery" class="grand-total-row">
                <td :colspan="selectedOemCompanyId === 0 ? 9 : 8" class="text-right">
                  <strong>합계 (부가세 포함)</strong>
                </td>
                <td />
                <td class="text-right">
                  <strong>{{ formatCurrency(ledgerData.totalWithVat) }}</strong>
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!--
        부대 항목 내역 (매출원장만, 2026-11-02) — 재고 소진·운송비·가공비·손실 차감을 한 건씩.
        합계 아래 줄은 건수만 보여 줘서 «무엇이 더해지고 빠졌는지» 를 맞춰 볼 수 없었다.
      -->
      <div v-if="!loading && isDelivery && chargeRows.length > 0" class="charge-detail-box">
        <div class="charge-detail-title">
          <i class="fas fa-list-ul" /> 부대 항목 내역 ({{ chargeRows.length }}건)
          <span class="deduct-hint">— 위 표 아래 «창고 이동·재고 소진·운송비·가공비·손실 차감» 줄의 근거입니다</span>
        </div>
        <div class="table-container">
          <table class="data-table charge-detail-table">
            <thead>
              <tr>
                <th class="charge-col-type">구분</th>
                <th v-if="selectedOemCompanyId === 0" class="charge-col-producer">
                  제조사
                </th>
                <th class="charge-col-doc">문서번호</th>
                <th class="charge-col-date">기준일</th>
                <th>내용</th>
                <th class="text-right charge-col-amount">
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in chargeRows" :key="`c-${i}`">
                <td>
                  <span class="charge-type" :class="`ct-${c.kind}`">{{ c.label }}</span>
                </td>
                <td v-if="selectedOemCompanyId === 0">
                  {{ c.producer || '-' }}
                </td>
                <td>{{ c.sourceNo || '-' }}</td>
                <td>{{ c.refDate || '-' }}</td>
                <td class="cell-remarks">
                  {{ c.desc || '-' }}
                  <span v-if="c.late" class="late-badge" title="이 달 청구 요청 뒤에 생긴 항목 — 청구 금액에 들어 있지 않습니다">청구 후 추가</span>
                </td>
                <td class="text-right" :class="{ 'amount-minus': c.minus }">
                  {{ c.minus ? '−' : '+' }} {{ formatCurrency(c.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!--
        미확정(납품 대기) 참고 — 2026-11-02
        운송장은 등록돼 재고는 나갔지만 아직 현장 사진·서명이 끝나지 않은 건. 합계에 들어가지 않는다.
      -->
      <div v-if="isDelivery && pendingItems.length > 0" class="pending-delivery-box">
        <button type="button" class="pending-delivery-toggle" @click="showPending = !showPending">
          <i :class="showPending ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" />
          미확정(납품 대기) {{ pendingItems.length }}건 · 참고 금액 {{ formatCurrency(ledgerData?.pendingTotal) }}
          <span class="deduct-hint">— 사진·서명이 끝나면 납품일 달 원장에 올라갑니다 (합계 제외)</span>
        </button>
        <div v-if="showPending" class="table-container">
          <table class="data-table pending-delivery-table">
            <thead>
              <tr>
                <th v-if="selectedOemCompanyId === 0">
                  제조사
                </th>
                <th>출하번호</th>
                <th>출하일</th>
                <th>운송장번호</th>
                <th>수요기관</th>
                <th>규격</th>
                <th class="text-right">
                  수량
                </th>
                <th class="text-right">
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in pendingItems" :key="`p-${i}`">
                <td v-if="selectedOemCompanyId === 0">
                  {{ p.oemCompanyName }}
                </td>
                <td>{{ p.shipmentNo || '-' }}</td>
                <td>{{ formatShortDate(p.shipmentDate) }}</td>
                <td>{{ p.trackingNumber || '-' }}</td>
                <td>{{ p.demandAgency }}</td>
                <td class="cell-spec">
                  {{ p.spec }}
                </td>
                <td class="text-right">
                  {{ formatQuantity(p.quantity) }}
                </td>
                <td class="text-right">
                  {{ formatCurrency(p.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 지급요청서 (작성·보기) -->
    <PaymentRequestDocument
      :show="showDocument"
      :mode="documentMode"
      :oem-company-id="selectedOemCompanyId"
      :year-month="yearMonth"
      :ledger="ledgerData"
      :is-oem="isOemManager"
      :history="selectedHistory"
      @close="showDocument = false"
      @submitted="handleDocumentSubmitted"
    />

    <!-- 반려 모달 -->
    <Teleport to="body">
      <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h3>지급 요청 반려</h3>
            <button class="modal-close" @click="showRejectModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <p class="reject-guide">
              반려하면 제조사가 금액을 고쳐 다시 청구할 수 있습니다.
              무엇이 잘못됐는지 적어 주세요 — 사유 없이는 제조사가 알 수 없습니다.
            </p>
            <div class="form-group">
              <label>반려 사유 <span class="required">*</span></label>
              <textarea
                v-model="rejectReason"
                class="form-input"
                rows="4"
                placeholder="예) 9월 가공비 2건이 빠졌습니다. 확인 후 다시 올려주세요."
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-action" @click="showRejectModal = false">
              취소
            </button>
            <button class="btn-action btn-danger" :disabled="!rejectReason.trim()" @click="handleReject">
              반려
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 지급 완료 모달 -->
    <Teleport to="body">
      <div v-if="showCompleteModal" class="modal-overlay" @click.self="showCompleteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h3>지급 완료</h3>
            <button class="modal-close" @click="showCompleteModal = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>지급 금액</label>
              <!-- 쉼표 표시 — 8자리 금액을 눈으로 확인하기 어렵다(고객 요청). 저장값은 숫자(completeForm.paidAmount) -->
              <input
                v-model="paidAmountText"
                type="text"
                inputmode="numeric"
                class="form-input text-right"
                placeholder="실제 지급 금액"
              >
              <p v-if="ledgerData" class="paid-breakdown">
                공급가액 {{ formatCurrency(ledgerData.payableAmount ?? ledgerData.totalAmount) }}
                + 부가세 {{ formatCurrency(ledgerData.vatAmount) }}
                = <strong>{{ formatCurrency(ledgerData.totalWithVat) }}</strong> (부가세 포함 지급)
              </p>
            </div>
            <div class="form-group">
              <label>지급일</label>
              <input v-model="completeForm.paidDate" type="date" class="form-input">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-action" @click="showCompleteModal = false">
              취소
            </button>
            <button class="btn-action btn-primary" :disabled="!completeForm.paidAmount" @click="handleComplete">
              지급 완료
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * OEM 월별 매출원장 페이지
 */
import { ref, computed, onMounted } from 'vue'
import { oemLedgerService } from '~/services/oem-ledger.service'
import { companyService } from '~/services/company.service'
import type { OemMonthlyLedgerResponse } from '~/types/oem-ledger'
import { OEM_LEDGER_PAYMENT_STATUS_LABELS, OEM_LEDGER_COST_SOURCE_LABELS, OEM_LEDGER_COST_SOURCE_HINTS } from '~/types/oem-ledger'
import type { OemLedgerBasis, OemLedgerCostSource, OemLedgerItem, OemLedgerPendingItem, OemPaymentRequestHistory } from '~/types/oem-ledger'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import type { CompanyInfoResponse } from '~/types/company'
import { formatCurrency, formatQuantity, getLocalDateString, formatDateTime } from '~/utils/format'
import { usePermission } from '~/composables/usePermission'
import { useAuthStore } from '~/stores/auth'
import PaymentRequestDocument from '~/components/admin/oem/PaymentRequestDocument.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '월별 매출원장'
})

/**
 * 원장 기준 (2026-11-02)
 *  - DELIVERY(기본): 월별 매출원장 — 납품확인 완료(사진+서명) 운송장 기준, 귀속 월 = 납품일. 청구 요청 가능
 *  - PO: 월별 발주기록 — 그 달 발주서 품목(발주 수량 × 발주 단가)만, 부대 항목·부가세·청구 없음 (pages/admin/oem/po-record.vue 가 이 화면을 basis="PO" 로 띄운다)
 */
const props = withDefaults(defineProps<{ basis?: OemLedgerBasis }>(), { basis: 'DELIVERY' })
const isDelivery = computed(() => props.basis !== 'PO')
const pageTitle = computed(() => (isDelivery.value ? 'OEM 월별 매출원장' : 'OEM 월별 발주기록'))
const pageDescription = computed(() => (isDelivery.value
  ? '납품이 확정된(현장 사진·인수자 서명 완료) 운송장 기준의 월별 매출입니다. 이 원장으로 제조 비용 청구를 요청합니다.'
  : '그 달에 발주한 품목(발주 수량 × 발주 단가)만 모은 조회·엑셀 전용 기록입니다. 청구는 «월별 매출원장»에서 합니다.'))

const { isOemManager, isFullAccess } = usePermission()

// 검색 조건
const selectedOemCompanyId = ref<number | null>(null)
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const selectedMonth = ref(String(new Date().getMonth() + 1).padStart(2, '0'))

// 년도 목록 (현재년도 - 2 ~ 현재년도 + 1)
const availableYears = computed(() => {
  const years: number[] = []
  for (let y = currentYear + 1; y >= currentYear - 2; y--) {
    years.push(y)
  }
  return years
})

// 데이터
const loading = ref(false)
const exporting = ref(false)
const oemCompanies = ref<CompanyInfoResponse[]>([])
const ledgerData = ref<OemMonthlyLedgerResponse | null>(null)

// 지급 완료 모달
const showCompleteModal = ref(false)
const completeForm = ref({
  paidAmount: 0,
  paidDate: ''
})
// 지급 금액 입력칸 표시용 — 51795800 → «51,795,800». 숫자 외 문자는 버린다
const paidAmountText = computed({
  get: () => (completeForm.value.paidAmount ? completeForm.value.paidAmount.toLocaleString('ko-KR') : ''),
  set: (text: string) => {
    completeForm.value.paidAmount = Number(String(text).replace(/[^\d]/g, '')) || 0
  }
})

// 반려 모달
// ⚠ useFormBase 의 formData 와 달리 이건 ref 다. .value 로 접근해야 한다.
const showRejectModal = ref(false)
const rejectReason = ref('')

/**
 * 확인 대기 청구 목록 (리드파워 담당자 전용)
 *
 * 알림은 한 번 읽으면 사라지지만 이 배너는 확인·반려 전까지 남는다.
 * 제조사 계정으로 호출하면 403 이므로 관리자일 때만 부른다.
 */
const pendingRequests = ref<OemLedgerPendingItem[]>([])

// 년월 문자열
const yearMonth = computed(() => `${selectedYear.value}-${selectedMonth.value}`)

/** 제조사 부담 손실 차감이 있는지 */
const hasLossDeduction = computed(() => {
  const total = ledgerData.value?.lossDeductionTotal
  return total != null && Number(total) !== 0
})

/** 손실 차감 건수 요약 라벨 */
// ── 원장 가산 항목 ───────────────────────────────────────────────────────────
// 발주 품목 외에 원장에 더해지는 것들. 손실은 차감이고 이쪽은 가산이라 부호가 반대다.
// 창고 이동은 본사 → 제조사 창고로 되돌린 달이면 음수일 수 있어 0 이 아닌지만 본다
const hasTransfer = computed(() => Number(ledgerData.value?.transferTotal || 0) !== 0)
const hasConsumption = computed(() => Number(ledgerData.value?.consumptionTotal || 0) > 0)
const hasShippingCharge = computed(() => Number(ledgerData.value?.shippingChargeTotal || 0) > 0)
const hasProcessingCharge = computed(() => Number(ledgerData.value?.processingChargeTotal || 0) > 0)

// 가산이든 차감이든 하나라도 있으면 "공급가액" 행을 보여줘야 한다
const hasAdjustment = computed(() =>
  hasLossDeduction.value || hasTransfer.value || hasConsumption.value || hasShippingCharge.value || hasProcessingCharge.value
)

const consumptionLabel = computed(() => {
  const list = ledgerData.value?.consumptionCharges
  if (!list || list.length === 0) { return '' }
  return `(${list.length}건 — 품질관리 발송 · 리드파워 계약 등)`
})

/** 품목이 없어도 부대 항목만 있는 달이 있다 (예: 재고 소진만 있는 달) — 그때도 원장을 보여 준다 */
const hasAnyCharge = computed(() => isDelivery.value && (hasAdjustment.value))

/** 부대 항목 내역 — 창고 이동 → 재고 소진 → 운송비 → 가공비 → 손실 차감 순 */
interface ChargeRow {
  kind: 'transfer' | 'consumption' | 'shipping' | 'processing' | 'loss'
  label: string
  producer?: string | null
  sourceNo?: string | null
  refDate?: string | null
  desc?: string | null
  amount: number
  minus: boolean
  late: boolean
}
const chargeRows = computed<ChargeRow[]>(() => {
  const d = ledgerData.value
  if (!d || !isDelivery.value) { return [] }
  const rows: ChargeRow[] = []
  const join = (...parts: (string | null | undefined)[]) => parts.filter(p => p && String(p).trim()).join(' · ')
  for (const c of d.transferCharges || []) {
    const amount = Number(c.amount || 0)
    rows.push({ kind: 'transfer', label: '창고 이동', producer: c.producerName, sourceNo: c.sourceNo, refDate: c.refDate, desc: c.remarks, amount: Math.abs(amount), minus: amount < 0, late: !!c.lateConfirmed })
  }
  for (const c of d.consumptionCharges || []) {
    rows.push({ kind: 'consumption', label: '재고 소진', producer: c.producerName, sourceNo: c.sourceNo, refDate: c.refDate, desc: c.remarks, amount: Number(c.amount || 0), minus: false, late: !!c.lateConfirmed })
  }
  for (const c of d.shippingCharges || []) {
    rows.push({ kind: 'shipping', label: '운송비', producer: c.producerName, sourceNo: c.sourceNo, refDate: c.refDate, desc: join(c.carrierName, c.deliveryRequestNo, c.client), amount: Number(c.amount || 0), minus: false, late: !!c.lateConfirmed })
  }
  for (const c of d.processingCharges || []) {
    rows.push({ kind: 'processing', label: '가공비', producer: c.producerName, sourceNo: c.sourceNo, refDate: c.refDate, desc: join('발주서에 적힌 가공비 (기준일 = 그 발주 물건이 처음 제조사를 떠난 날: 납품 확정·창고 이동·재고 소진 중 가장 이른 날)', c.remarks), amount: Number(c.amount || 0), minus: false, late: !!c.lateConfirmed })
  }
  for (const l of d.lossDeductions || []) {
    rows.push({ kind: 'loss', label: '손실 차감', producer: l.oemCompanyName, sourceNo: l.lossNo, refDate: l.occurredDate, desc: join(l.lossTypeName, l.shipmentNo, l.skuName), amount: Number(l.oemDeductionAmount || 0), minus: true, late: false })
  }
  return rows
})
const shippingChargeLabel = computed(() => {
  const list = ledgerData.value?.shippingCharges
  if (!list || list.length === 0) { return '' }
  const carriers = [...new Set(list.map((x: any) => x.carrierName).filter(Boolean))]
  return carriers.length > 0 ? `(${list.length}건 — ${carriers.join(', ')})` : `(${list.length}건)`
})
const processingChargeLabel = computed(() => {
  const list = ledgerData.value?.processingCharges
  if (!list || list.length === 0) { return '' }
  return `(${list.length}건)`
})

const lossDeductionLabel = computed(() => {
  const list = ledgerData.value?.lossDeductions
  if (!list || list.length === 0) return ''
  return `${list.length}건`
})

// 지급 상태 라벨
const paymentStatusLabel = computed(() => {
  if (!ledgerData.value) { return '' }
  return OEM_LEDGER_PAYMENT_STATUS_LABELS[ledgerData.value.paymentStatus] || '미요청'
})

// 지급 상태 CSS
const paymentStatusClass = computed(() => {
  if (!ledgerData.value) { return '' }
  const statusMap: Record<string, string> = {
    NONE: 'status-none',
    PENDING: 'status-pending',
    CONFIRMED: 'status-confirmed',
    PAID: 'status-paid'
  }
  return statusMap[ledgerData.value.paymentStatus] || 'status-none'
})

// 날짜 포맷 (MM-DD)
function formatShortDate (dateStr: string | null | undefined): string {
  if (!dateStr) { return '-' }
  const parts = dateStr.split('-')
  if (parts.length >= 3) { return `${parts[1]}-${parts[2]}` }
  return dateStr
}

// 적용 원가와 발주서 단가가 어긋난 건만 경고 (평시엔 두 값이 같다)
function hasCostMismatch (item: OemLedgerItem): boolean {
  if (item.poUnitPrice == null) { return false }
  const cost = Number(item.unitCost ?? 0)
  const po = Number(item.poUnitPrice)
  return po > 0 && cost > 0 && po !== cost
}

function costMismatchTitle (item: OemLedgerItem): string {
  return `발주서 단가 ${formatCurrency(item.poUnitPrice)} 와 다릅니다 (적용 원가 ${formatCurrency(item.unitCost)})`
}

// 원가 출처 라벨 (출하스냅샷 / 발주스냅샷 / 마스터 / 미등록)
function costSourceLabel (costSource: OemLedgerCostSource | null): string {
  if (!costSource) { return '-' }
  return OEM_LEDGER_COST_SOURCE_LABELS[costSource] || costSource
}

/** 원가 출처 설명 — 배지에 마우스를 올리면 «어디서 온 원가인가» 를 알려준다 */
function costSourceHint (costSource: OemLedgerCostSource | null): string {
  if (!costSource) { return '원가 출처를 알 수 없습니다.' }
  return OEM_LEDGER_COST_SOURCE_HINTS[costSource] || ''
}

// 원가 출처 배지 CSS (마스터·미등록은 주의 표시)
function costSourceClass (costSource: OemLedgerCostSource | null): string {
  const classMap: Record<string, string> = {
    SHIPMENT: 'source-shipment',
    PURCHASE_ORDER: 'source-po',
    MASTER: 'source-master',
    NONE: 'source-none',
    LOT: 'source-lot'
  }
  return classMap[costSource || 'NONE'] || 'source-none'
}

// Blob 다운로드 트리거
function downloadBlob (blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => window.URL.revokeObjectURL(url), 1000) // 즉시 해제하면 크롬이 파일명·확장자를 잃는다
}

// 엑셀 다운로드 (원장 + 원가이력 2시트, 현재 조회 조건 기준)
async function handleExportExcel () {
  if (exporting.value) { return }
  if (selectedOemCompanyId.value === null) {
    alert('OEM 제조사를 선택하세요.')
    return
  }

  exporting.value = true
  try {
    // 전체(0) 선택 시 oemCompanyId를 null로 전달
    const oemId = selectedOemCompanyId.value === 0 ? null : selectedOemCompanyId.value
    const blob = await oemLedgerService.exportExcel(oemId, yearMonth.value, props.basis)
    downloadBlob(blob, `${isDelivery.value ? 'OEM월별매출원장' : 'OEM월별발주기록'}_${yearMonth.value}.xlsx`)
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  } finally {
    exporting.value = false
  }
}

// OEM 변경
function handleOemChange () {
  ledgerData.value = null
}

// 년도 변경
function handleYearChange () {
  ledgerData.value = null
}

// 원장 조회
async function loadLedger () {
  if (selectedOemCompanyId.value === null) {
    alert('OEM 제조사를 선택하세요.')
    return
  }

  loading.value = true
  try {
    // 전체(0) 선택 시 oemCompanyId를 null로 전달
    const oemId = selectedOemCompanyId.value === 0 ? null : selectedOemCompanyId.value
    ledgerData.value = await oemLedgerService.getMonthlyLedger(
      oemId,
      yearMonth.value,
      props.basis
    )
    // 지급 완료 모달 기본값 설정
    //
    // ★ 실제로는 부가세 포함액을 지급한다(2026-09-22 고객 확인). 기본값 = totalWithVat.
    //   청구 금액(payment_amount)은 공급가액 그대로 두고, 실지급액(paid_amount)만 부가세 포함.
    // ⚠ totalAmount(발주 합계)가 아니라 payableAmount 기반이어야 한다.
    //   payableAmount = 발주 합계 + 운송비 + 가공비 − 손실 차감 (소진은 2026-09-21 부터 제외)
    if (ledgerData.value) {
      completeForm.value.paidAmount = ledgerData.value.totalWithVat ??
        ledgerData.value.payableAmount ?? ledgerData.value.totalAmount ?? 0
      completeForm.value.paidDate = getLocalDateString()
    }
    // 지급요청 이력 (차수별, 반려 포함) — 개별 제조사 조회일 때만. 실패해도 원장은 보여준다
    paymentHistory.value = []
    if (oemId && isDelivery.value) {
      oemLedgerService.getPaymentHistory(oemId, yearMonth.value)
        .then((rows) => { paymentHistory.value = rows })
        .catch(e => console.error('지급요청 이력 조회 실패:', e))
    }
  } catch (error) {
    console.error('원장 조회 실패:', error)
    alert('원장 조회에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 지급 요청
// 지급요청서(서류) — 2026-09-22
//   [지급요청] 을 누르면 확인창 대신 서류를 띄우고, 거기서 입금 계좌·비고·첨부를 넣고 제출한다.
//   제출 후에는 [지급요청서 보기] 로 같은 서류를 리드파워·제조사가 함께 본다.
const showDocument = ref(false)
const documentMode = ref<'create' | 'view'>('create')
/** 지급요청 이력 (차수별, 반려 포함) — 반려되면 처음 서류를 다시 볼 방법이 없던 것 보완 */
const paymentHistory = ref<OemPaymentRequestHistory[]>([])
/** 이력에서 연 차수 — null 이면 지금 살아 있는 청구의 서류 */
const selectedHistory = ref<OemPaymentRequestHistory | null>(null)

function handlePaymentRequest () {
  if (!ledgerData.value) { return }
  selectedHistory.value = null
  documentMode.value = 'create'
  showDocument.value = true
}

function openDocumentView (history: OemPaymentRequestHistory | null = null) {
  selectedHistory.value = history
  documentMode.value = 'view'
  showDocument.value = true
}

const HISTORY_STATUS_LABELS: Record<string, string> = {
  PENDING: '요청완료', CONFIRMED: '확인완료', PAID: '지급완료', REJECTED: '반려'
}

async function handleDocumentSubmitted () {
  showDocument.value = false
  await loadLedger()
}

// 요청 취소
async function handleCancelRequest () {
  if (!ledgerData.value?.paymentId) { return }
  if (!confirm('지급 요청을 취소하시겠습니까?')) { return }

  try {
    await oemLedgerService.cancelPaymentRequest(ledgerData.value.paymentId)
    alert('지급 요청이 취소되었습니다.')
    await loadLedger()
  } catch (error) {
    console.error('요청 취소 실패:', error)
    alert(error instanceof Error ? error.message : '요청 취소에 실패했습니다.')
  }
}

// 지급 확인 (관리자)
async function handleConfirm () {
  if (!ledgerData.value?.paymentId) { return }
  if (!confirm('지급을 확인하시겠습니까?')) { return }

  try {
    await oemLedgerService.confirmPaymentRequest(ledgerData.value.paymentId)
    alert('지급이 확인되었습니다.')
    await loadLedger()
    await loadPendingRequests()
  } catch (error) {
    console.error('지급 확인 실패:', error)
    alert(error instanceof Error ? error.message : '지급 확인에 실패했습니다.')
  }
}

// 지급 확인 취소 (관리자) — 잘못 누른 확인을 되돌린다
async function handleRevertConfirm () {
  if (!ledgerData.value?.paymentId) { return }
  if (!confirm('지급 확인을 취소하고 «요청완료» 상태로 되돌리시겠습니까?')) { return }

  try {
    await oemLedgerService.revertConfirmPaymentRequest(ledgerData.value.paymentId)
    alert('지급 확인을 취소했습니다.')
    await loadLedger()
    await loadPendingRequests()
  } catch (error) {
    console.error('지급 확인 취소 실패:', error)
    alert(error instanceof Error ? error.message : '지급 확인 취소에 실패했습니다.')
  }
}

// 반려 (관리자) — 사유 필수
async function handleReject () {
  if (!ledgerData.value?.paymentId) { return }
  if (!rejectReason.value.trim()) {
    alert('반려 사유를 입력하세요.')
    return
  }

  try {
    await oemLedgerService.rejectPaymentRequest(ledgerData.value.paymentId, rejectReason.value.trim())
    showRejectModal.value = false
    rejectReason.value = ''
    alert('지급 요청을 반려했습니다.')
    await loadLedger()
    await loadPendingRequests()
  } catch (error) {
    console.error('반려 실패:', error)
    alert(error instanceof Error ? error.message : '반려에 실패했습니다.')
  }
}

/** 확인 대기 목록 로드 — 제조사 계정은 403 이므로 부르지 않는다 */
async function loadPendingRequests () {
  // 발주기록(조회 전용)에는 청구 배너가 없다
  if (isOemManager.value || !isDelivery.value) { return }

  try {
    pendingRequests.value = await oemLedgerService.getPendingPaymentRequests()
  } catch (error) {
    // 배너는 보조 정보다. 실패해도 원장 화면 자체는 열려야 한다.
    console.error('확인 대기 목록 로드 실패:', error)
    pendingRequests.value = []
  }
}

/** 배너에서 «보기» — 해당 제조사·월로 이동해 원장을 연다 */
async function goToPending (item: OemLedgerPendingItem) {
  selectedOemCompanyId.value = item.oemCompanyId
  const [year, month] = item.yearMonth.split('-')
  selectedYear.value = Number(year)
  selectedMonth.value = month
  await loadLedger()
}

// 지급 완료 (관리자)
async function handleComplete () {
  if (!ledgerData.value?.paymentId) { return }

  try {
    await oemLedgerService.completePaymentRequest(
      ledgerData.value.paymentId,
      completeForm.value.paidAmount,
      completeForm.value.paidDate,
      ledgerData.value.oemCompanyId,
      ledgerData.value.yearMonth
    )
    showCompleteModal.value = false
    alert('지급이 완료되었습니다.')
    await loadLedger()
    await loadPendingRequests()
  } catch (error) {
    console.error('지급 완료 실패:', error)
    alert(error instanceof Error ? error.message : '지급 완료에 실패했습니다.')
  }
}

// OEM 담당자 여부에 따른 제조사 선택 잠금
const isOemLocked = computed(() => isOemManager.value)

// ── 납품 기준 보조 표시 (2026-11-02) ────────────────────────────────────────
/** 미확정(납품 대기) 참고 목록 펼침 */
const showPending = ref(false)
const pendingItems = computed(() => (isDelivery.value ? (ledgerData.value?.pendingItems || []) : []))
/** 그 달 청구 뒤 늦게 확정된 건 */
const lateCount = computed(() => Number(ledgerData.value?.lateConfirmedCount || 0))

/** 확정 일시(UTC) → KST «MM-DD HH:mm» */
function formatConfirmed (v: string | null | undefined): string {
  if (!v) { return '' }
  return formatDateTime(v)
}

// 초기 데이터 로드
onMounted(async () => {
  try {
    oemCompanies.value = await companyService.getManufacturers()
    if (isOemManager.value) {
      // OEM 담당자: 자사 companyId로 자동 선택 + 잠금
      const authStore = useAuthStore()
      const myCompanyId = authStore.user?.companyId
      if (myCompanyId) {
        selectedOemCompanyId.value = myCompanyId
      } else if (oemCompanies.value.length > 0) {
        selectedOemCompanyId.value = oemCompanies.value[0].id
      }
      await loadLedger()
    } else if (isFullAccess.value) {
      // 리드파워/시스템관리자: "전체"(0) 기본 선택
      selectedOemCompanyId.value = 0
    }
    // 확인 대기 배너 — 관리자만
    await loadPendingRequests()
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';

/* 확인 대기 배너 (리드파워 담당자 전용) */
.pending-banner {
  border: 1px solid #fbbf24;
  background: #fffbeb;
  border-radius: 10px;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1rem;
}

.pending-banner-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 0.5rem;
}

.pending-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.pending-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  color: #78350f;
}

.pending-company { min-width: 140px; font-weight: 600; }
.pending-month { min-width: 80px; }
.pending-amount { min-width: 130px; text-align: right; font-weight: 600; }
.pending-requested { min-width: 150px; color: #a16207; font-size: 0.82rem; }

.btn-pending-go {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #d97706;
  border-radius: 6px;
  background: #fff;
  color: #b45309;
  font-size: 0.82rem;
  cursor: pointer;
}

.btn-pending-go:hover { background: #fef3c7; }

/* 감사 이력 (누가 언제 청구·확인·지급) */
.audit-trail {
  font-size: 0.8rem;
  color: #6b7280;
  margin-left: 0.75rem;
}

/* 반려 사유 알림 */
/* 지급요청 이력 */
.history-box {
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.history-title {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.history-table th,
.history-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}

.history-table th {
  color: #64748b;
  font-weight: 600;
  background: #f8fafc;
}

.history-table .text-right { text-align: right; }
.history-note { max-width: 360px; }
.history-note .muted { color: #94a3b8; }

.history-status {
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.hs-PENDING { background: #fef3c7; color: #92400e; }
.hs-CONFIRMED { background: #dbeafe; color: #1e40af; }
.hs-PAID { background: #dcfce7; color: #166534; }
.hs-REJECTED { background: #fee2e2; color: #991b1b; }

.btn-history-doc {
  padding: 0.2rem 0.55rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
}

/* 지급완료 창 — 공급가액 + 부가세 = 지급액 내역 */
.paid-breakdown {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.reject-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  border-radius: 10px;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1rem;
  color: #991b1b;
}

.reject-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.reject-reason { font-size: 0.92rem; }
.reject-meta { font-size: 0.8rem; color: #b91c1c; }

.reject-guide {
  font-size: 0.88rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.required { color: #dc2626; }

/* 지급 상태 카드 */
.payment-status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.payment-status-card.status-none {
  border-color: #d1d5db;
  background: #f9fafb;
}

.payment-status-card.status-pending {
  border-color: #fcd34d;
  background: #fffbeb;
}

.payment-status-card.status-confirmed {
  border-color: #93c5fd;
  background: #eff6ff;
}

.payment-status-card.status-paid {
  border-color: #6ee7b7;
  background: #ecfdf5;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.status-badge.status-none {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.status-pending {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-badge.status-confirmed {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.status-badge.status-paid {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #047857;
  border: 1px solid #6ee7b7;
}

.paid-info {
  font-size: 0.8125rem;
  color: #059669;
  font-weight: 500;
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

/* 버튼 스타일 */
.btn-danger {
  background: #ef4444 !important;
  color: white !important;
}

.btn-danger:hover {
  background: #dc2626 !important;
}

.btn-success {
  background: #10b981 !important;
  color: white !important;
}

.btn-success:hover {
  background: #059669 !important;
}

/* 원장 테이블 */
.ledger-table {
  font-size: 0.8125rem;
}

.cell-project {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-spec {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}

.cell-remarks {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.total-row {
  background: linear-gradient(180deg, #f8fafc, #f1f5f9) !important;
}

.total-row td {
  border-top: 2px solid #e2e8f0;
  font-weight: 600;
  color: #1e293b;
}

/* 손실 차감 행 */
.deduct-row {
  background: #fff7ed !important;
}
.deduct-row td {
  color: #b45309;
  font-weight: 500;
}

.deduct-hint {
  font-size: 0.78em;
  color: #94a3b8;
  font-weight: 400;
  margin-left: 0.25rem;
}

/* 가산 행 (비출하 소진 / 운송비 / 가공비)
   손실 차감(주황)과 구분되도록 초록 계열을 쓴다 — 부호가 반대인 항목이다. */
.add-row {
  background: #f0fdf4 !important;
}
.add-row td {
  color: #15803d;
  font-weight: 500;
}

/*
 * 참고 표기 행 — 지급액 계산에 들어가지 않는 항목
 * 가산(초록)·차감(주황)과 섞이지 않도록 회색으로 눌러 둔다.
 */
.note-row {
  background: #f8fafc !important;
}
.note-row td {
  color: #94a3b8;
  font-weight: 400;
}

/* 공급가액 행 (손실 차감 후) */
.supply-row {
  background: #f8fafc !important;
}
.supply-row td {
  color: #1e293b;
}

/* 부가세 행 */
.vat-row {
  background: #f8fafc !important;
}
.vat-row td {
  color: #475569;
}

/* 합계 (부가세 포함) */
.grand-total-row {
  background: linear-gradient(180deg, #eff6ff, #dbeafe) !important;
}
.grand-total-row td {
  border-top: 2px solid #93c5fd;
  border-bottom: 2px solid #93c5fd;
  color: #1e3a8a;
  font-size: 1.02em;
  font-weight: 700;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.modal-sm {
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.125rem;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

/* 헤더 보조 표기 (금액 산식 / 참고 표시) */
.th-sub {
  display: block;
  font-size: 0.7rem;
  font-weight: 400;
  opacity: 0.75;
}

/* 발주서 단가와 어긋난 원가 경고 */
.cost-warn {
  margin-left: 4px;
  color: #d97706;
  font-size: 0.8em;
  cursor: help;
}

/* 원가 출처 배지 */
.source-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.source-shipment {
  background: #e6f4ea;
  color: #137333;
}

.source-po {
  background: #e8f0fe;
  color: #1967d2;
}

.source-master {
  background: #fef7e0;
  color: #b06000;
}

.source-none {
  background: #fce8e6;
  color: #c5221f;
}

/* ── 납품 기준 원장 (2026-11-02) ───────────────────────────── */
.source-lot {
  background: #e6f4ea;
  color: #137333;
}

.basis-guide {
  margin-bottom: 12px;
}

.basis-guide-list {
  margin: 0;
  padding-left: 1.1rem;
  line-height: 1.7;
}

.late-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0;
  padding: 10px 14px;
  border: 1px solid #f5c26b;
  border-radius: 8px;
  background: #fff8e6;
  color: #8a5300;
  font-size: 13px;
  line-height: 1.6;
}

.late-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #fff1d6;
  color: #a35c00;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.pending-delivery-box {
  margin-top: 14px;
  border: 1px dashed #c9d2de;
  border-radius: 8px;
  background: #fafbfc;
}

.pending-delivery-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 8px 14px;
  border: 0;
  background: transparent;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.pending-delivery-table td,
.pending-delivery-table th {
  font-size: 12px;
  color: #6b7280;
}

/* 부대 항목 내역 (2026-11-02) */
.charge-detail-box {
  margin-top: 14px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #fff;
}

.charge-detail-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f6;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
}

.charge-detail-table td,
.charge-detail-table th {
  font-size: 12.5px;
}

/* 내용 칸에 남는 폭을 모두 준다 — 나머지 칸은 글자 길이에 맞춰 고정 */
.charge-detail-table {
  table-layout: fixed;
  min-width: 720px;
}

.charge-col-type { width: 96px; }
.charge-col-producer { width: 130px; }
.charge-col-doc { width: 140px; }
.charge-col-date { width: 112px; }
.charge-col-amount { width: 130px; }

/* 공통 .cell-remarks(폭 140px·말줄임)를 풀어 내용이 잘리지 않게 한다 */
.charge-detail-table .cell-remarks {
  max-width: none;
  white-space: normal;
}

.charge-type {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.ct-transfer { background: #f3f0ff; color: #5b3fb5; }
.ct-consumption { background: #eef6ff; color: #1d5fa8; }
.ct-shipping { background: #eefaf3; color: #1f7a4a; }
.ct-processing { background: #f4f0ff; color: #5b3fb0; }
.ct-loss { background: #fff0f0; color: #b42318; }

.amount-minus {
  color: #b42318;
}

.cell-linked {
  font-size: 12px;
  color: #4b5563;
  white-space: normal;
  word-break: break-all;
}
</style>
