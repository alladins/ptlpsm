<template>
  <div class="item-management">
    <!-- 페이지 헤더 - 리팩토링: PageHeader 컴포넌트 사용 -->
    <PageHeader
      title="품목관리"
      description="품목 정보, 스펙정보, SKU 정보를 관리합니다."
    />

    <!-- 품목 관리 컨테이너 -->
    <div class="item-management-container">
      <!-- 좌측: 품목 기본 정보 관리 -->
      <div class="item-basic-section">
        <div class="section-header">
          <h2 class="section-title">품목 기본 정보</h2>
          <button @click="openAddModal" class="btn-primary">
            <i class="fas fa-plus"></i> 새 품목
          </button>
        </div>

                 <!-- 검색 조건 섹션 -->
         <div class="search-section">
           <div class="search-form">
             <div class="form-row">
                               <div class="form-group search-input-group">
                  <div class="search-labels">
                    <label>통합 검색</label>
                    <label>사용여부</label>
                  </div>
                  <div class="search-input-wrapper">
                    <input 
                      type="text" 
                      v-model="searchForm.keyword" 
                      placeholder="품목코드, 품목명, 카테고리, 유형, 단위로 검색" 
                      class="form-input search-input"
                      @keyup.enter="searchItems"
                    >
                    <div class="form-group">
                       <select v-model="searchForm.useYn" class="form-select">
                         <option value="">전체</option>
                         <option value="Y">사용중</option>
                         <option value="N">사용중지</option>
                       </select>
                     </div>
                  </div>
                </div>
               
               <div class="form-group button-group">
                 <button class="btn-primary search-btn" @click="searchItems">
                   <i class="fas fa-search"></i>
                   <span>검색</span>
                 </button>
                </div>
             </div>
           </div>
         </div>

        <!-- 품목 목록 테이블 -->
        <div class="table-section">
          <!-- 테이블 헤더: 리팩토링 - useDataTable의 변수 사용 -->
          <div class="table-header">
            <div class="table-info">
              <span>총 {{ totalElements }}개 중 {{ startIndex }}-{{ endIndex }}개 표시</span>
            </div>
            <div class="table-actions">
              <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
                <option :value="10">10개씩</option>
                <option :value="20">20개씩</option>
                <option :value="50">50개씩</option>
              </select>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
                             <thead>
                 <tr>
                   <th>품목코드</th>
                   <th>품목명</th>
                   <th>품목유형</th>
                   <th>단위</th>
                   <th>사용여부</th>
                   <th>관리</th>
                 </tr>
               </thead>
              <tbody>
                <tr v-for="item in items" :key="item.itemId || ''" class="table-row"
                    :class="{ 'selected': selectedItemId === item.itemId?.toString() }"
                    @click="selectItem(item)">
                  <td>{{ item.itemId }}</td>
                  <td>{{ item.itemNm }}</td>
                  <td>{{ item.itemTypeCd || '-' }}</td>
                  <td>{{ item.unitCd || '-' }}</td>
                  <td>
                    <span class="status-badge" :class="{ inactive: item.useYn === 'N' }">
                      {{ item.useYn === 'Y' ? '사용' : '미사용' }}
                    </span>
                  </td>
                  <td class="action-buttons">
                    <button class="btn-view" @click.stop="openViewModal(item)" title="상세보기">
                      <i class="fas fa-eye"></i>
                      <span>상세</span>
                    </button>
                    <button class="btn-edit" @click.stop="openEditModal(item)" title="수정">
                      <i class="fas fa-edit"></i>
                      <span>수정</span>
                    </button>
                    <button 
                      v-if="isItemDeletable(item)" 
                      class="btn-delete" 
                      @click.stop="deleteItem(item)" 
                      title="삭제"
                    >
                      <i class="fas fa-trash"></i>
                      <span>삭제</span>
                    </button>
                    <button 
                      v-else 
                      class="btn-delete disabled" 
                      title="스펙/SKU 정보가 있어 삭제할 수 없습니다"
                      disabled
                    >
                      <i class="fas fa-ban"></i>
                      <span>삭제 불가</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 데이터가 없을 때 -->
            <div v-if="items.length === 0 && !loading" class="no-data-message">
              <i class="fas fa-box"></i>
              <p>등록된 품목이 없습니다.</p>
            </div>

            <!-- 로딩 중 -->
            <div v-if="loading" class="loading-message">
              <i class="fas fa-spinner fa-spin"></i>
              <p>데이터를 불러오는 중...</p>
            </div>
          </div>

          <!-- 페이지네이션 - 리팩토링: Pagination 컴포넌트 사용 -->
          <Pagination
            v-if="totalPages > 0"
            :current-page="currentPage"
            :total-pages="totalPages"
            :disabled="loading"
            @change="handlePageChange"
          />
        </div>
      </div>

      <!-- 우측: 스펙정보 및 SKU 정보 관리 -->
      <div class="item-detail-section">
        <div class="section-header">
          <h2 class="section-title">상세 정보 관리</h2>
          <div class="section-info">
            <span v-if="selectedItem" class="selected-item-info">
              선택된 품목: <strong>{{ selectedItem.itemNm }}</strong>
            </span>
            <span v-else class="no-selection-info">
              품목을 선택해주세요
            </span>
          </div>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="tab-navigation">
           <button
             @click="activeTab = 'skus'"
             :class="['tab-button', { active: activeTab === 'skus' }]"
             :disabled="!selectedItem"
           >
             <i class="fas fa-barcode"></i>
             SKU 정보
             <span v-if="selectedItem" class="tab-count">({{ selectedItem.itemSkus.length }})</span>
           </button>
           <button
             @click="activeTab = 'specs'"
             :class="['tab-button', { active: activeTab === 'specs' }]"
             :disabled="!selectedItem"
           >
             <i class="fas fa-cogs"></i>
             스펙정보
             <span v-if="selectedItem" class="tab-count">({{ selectedItem.itemSpecs.length }})</span>
           </button>
        </div>

        <!-- 스펙정보 탭 -->
        <div v-if="activeTab === 'specs'" class="tab-content">
          <div class="tab-header">
            <h3>스펙정보 관리</h3>
            <button @click="openSpecModal('create')" class="btn-primary" :disabled="!selectedItem">
              <i class="fas fa-plus"></i> 새 스펙
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>스펙명</th>
                  <th>스펙값</th>
                  <th>단위</th>
                  <th>정렬순서</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!selectedItem" class="no-selection-row">
                  <td colspan="10" class="no-selection-message">
                    <div class="empty-state">
                      <i class="fas fa-info-circle"></i>
                      <span>품목을 선택해주세요</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="selectedItem.itemSpecs.length === 0" class="no-data-row">
                  <td colspan="10" class="no-data-message">
                    <div class="empty-state">
                      <i class="fas fa-inbox"></i>
                      <span>등록된 스펙이 없습니다</span>
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="spec in selectedItem.itemSpecs" :key="spec.specName" class="table-row">
                  <td>{{ spec.specName }}</td>
                  <td>{{ spec.specValue }}</td>
                  <td>{{ spec.specUnit || '-' }}</td>
                  <td>{{ spec.sortOrder || '-' }}</td>
                  <td class="action-buttons">
                    <button @click="openSpecModal('edit', spec)" class="btn-edit" title="수정">
                      <i class="fas fa-edit"></i>
                      <span>수정</span>
                    </button>
                    <button @click="deleteSpec(spec.id)" class="btn-delete" title="삭제">
                      <i class="fas fa-trash"></i>
                      <span>삭제</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SKU 정보 탭 -->
        <div v-if="activeTab === 'skus'" class="tab-content">
          <div class="tab-header">
            <h3>SKU 정보 관리</h3>
            <button @click="openSkuModal('create')" class="btn-primary" :disabled="!selectedItem">
              <i class="fas fa-plus"></i> 새 SKU
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
                             <thead>
                 <tr>
                   <th>SKU코드</th>
                   <th>SKU명</th>
                   <th>너비</th>
                   <th>높이</th>
                   <th>두께</th>
                   <th>납품단가</th>
                   <th>원가</th>
                   <th>마진율</th>
                   <th>재고수량</th>
                   <th>관리</th>
                 </tr>
               </thead>
              <tbody>
                                 <tr v-if="!selectedItem" class="no-selection-row">
                   <td colspan="10" class="no-selection-message">
                     <div class="empty-state">
                       <i class="fas fa-info-circle"></i>
                       <span>품목을 선택해주세요</span>
                     </div>
                   </td>
                 </tr>
                 <tr v-else-if="selectedItem.itemSkus.length === 0" class="no-data-row">
                   <td colspan="10" class="no-data-message">
                     <div class="empty-state">
                       <i class="fas fa-inbox"></i>
                       <span>등록된 SKU가 없습니다</span>
                     </div>
                   </td>
                 </tr>
                                 <tr v-else v-for="sku in selectedItem.itemSkus" :key="sku.skuId" class="table-row">
                   <td>{{ sku.skuId }}</td>
                   <td>{{ sku.skuNm }}</td>
                   <td>{{ sku.width || '-' }}</td>
                   <td>{{ sku.height || '-' }}</td>
                   <td>{{ sku.thickness || '-' }}</td>
                   <td>{{ formatCurrency(sku.unitPrice) }}</td>
                   <td>
                     <span v-if="sku.costPrice !== undefined && sku.costPrice !== null">
                       {{ formatCurrency(sku.costPrice) }}
                     </span>
                     <button v-else class="btn-cost-edit" @click.stop="openCostPriceModal(sku)" title="원가 설정">
                       <i class="fas fa-edit"></i>
                       <span>설정</span>
                     </button>
                   </td>
                   <td>
                     <span
                       v-if="calculateMarginRate(sku.unitPrice, sku.costPrice) !== null"
                       class="margin-badge"
                       :class="getMarginRateClass(calculateMarginRate(sku.unitPrice, sku.costPrice))"
                     >
                       {{ calculateMarginRate(sku.unitPrice, sku.costPrice)?.toFixed(1) }}%
                     </span>
                     <span v-else class="margin-badge margin-none">-</span>
                   </td>
                   <td>{{ sku.stockQty || '-' }}</td>
                   <td class="action-buttons">
                     <button @click="openCostPriceModal(sku)" class="btn-cost" title="원가 수정">
                       <i class="fas fa-won-sign"></i>
                       <span>원가</span>
                     </button>
                     <button @click="openSkuModal('edit', sku)" class="btn-edit" title="수정">
                       <i class="fas fa-edit"></i>
                       <span>수정</span>
                     </button>
                                         <button @click="deleteSku(sku.skuId)" class="btn-delete" title="삭제">
                      <i class="fas fa-trash"></i>
                      <span>삭제</span>
                    </button>
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 등록 모달 -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>품목 등록</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitAdd" class="item-form">
            <div class="form-row">
              <div class="form-group">
                <label>품목코드 *</label>
                <input 
                  v-model="formData.itemId" 
                  type="text" 
                  required
                  placeholder="품목코드"
                  maxlength="50"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>품목명 *</label>
                <input 
                  v-model="formData.itemNm" 
                  type="text" 
                  required
                  placeholder="품목명"
                  maxlength="200"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>품목유형</label>
                <input 
                  v-model="formData.itemTypeCd" 
                  type="text" 
                  placeholder="품목유형"
                  maxlength="100"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>단위</label>
                <input 
                  v-model="formData.unitCd" 
                  type="text" 
                  placeholder="단위"
                  maxlength="20"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>너비 (mm)</label>
                <input 
                  v-model="formData.width" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>높이 (mm)</label>
                <input 
                  v-model="formData.height" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>두께 (mm)</label>
                <input 
                  v-model="formData.thickness" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>단가 (원)</label>
                <input 
                  v-model="formData.unitPrice" 
                  type="number" 
                  step="0.01"
                  placeholder="0"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>사용여부</label>
                <select v-model="formData.useYn" class="form-select">
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>설명</label>
                <textarea 
                  v-model="formData.description" 
                  placeholder="품목 설명"
                  rows="3"
                  class="form-textarea"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>등록</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 수정 모달 -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>품목 수정</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitEdit" class="item-form">
            <div class="form-row">
              <div class="form-group">
                <label>품목코드</label>
                <input 
                  v-model="formData.itemId" 
                  type="text" 
                  disabled
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>품목명 *</label>
                <input 
                  v-model="formData.itemNm" 
                  type="text" 
                  required
                  placeholder="품목명"
                  maxlength="200"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>품목유형</label>
                <input 
                  v-model="formData.itemTypeCd" 
                  type="text" 
                  placeholder="품목유형"
                  maxlength="100"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>단위</label>
                <input 
                  v-model="formData.unitCd" 
                  type="text" 
                  placeholder="단위"
                  maxlength="20"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>너비 (mm)</label>
                <input 
                  v-model="formData.width" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>높이 (mm)</label>
                <input 
                  v-model="formData.height" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>두께 (mm)</label>
                <input 
                  v-model="formData.thickness" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>단가 (원)</label>
                <input 
                  v-model="formData.unitPrice" 
                  type="number" 
                  step="0.01"
                  placeholder="0"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>사용여부</label>
                <select v-model="formData.useYn" class="form-select">
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>설명</label>
                <textarea 
                  v-model="formData.description" 
                  placeholder="품목 설명"
                  rows="3"
                  class="form-textarea"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>수정</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 상세보기 모달 -->
    <div v-if="showViewModal" class="modal-overlay">
      <div class="modal large-modal" @click.stop>
        <div class="modal-header">
          <h3>품목 상세보기</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="item-detail">
            <div class="detail-section">
              <h4>기본 정보</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>품목코드:</label>
                  <span>{{ viewingItem?.itemId }}</span>
                </div>
                <div class="detail-item">
                  <label>품목명:</label>
                  <span>{{ viewingItem?.itemNm }}</span>
                </div>
                <div class="detail-item">
                  <label>품목유형:</label>
                  <span>{{ viewingItem?.itemTypeCd || '-' }}</span>
                </div>
                                 <div class="detail-item">
                   <label>단위:</label>
                   <span>{{ viewingItem?.unitCd || '-' }}</span>
                 </div>
                 <div class="detail-item full-width">
                   <label>설명:</label>
                   <span>{{ viewingItem?.description || '-' }}</span>
                 </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>스펙 정보</h4>
              <div v-if="viewingItem?.itemSpecs.length" class="spec-table">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>스펙명</th>
                      <th>스펙값</th>
                      <th>단위</th>
                      <th>정렬순서</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="spec in viewingItem?.itemSpecs" :key="spec.id">
                      <td>{{ spec.specName }}</td>
                      <td>{{ spec.specValue }}</td>
                      <td>{{ spec.specUnit || '-' }}</td>
                      <td>{{ spec.sortOrder || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-data-message">
                <p>등록된 스펙이 없습니다.</p>
              </div>
            </div>

            <div class="detail-section">
              <h4>SKU 정보</h4>
              <div v-if="viewingItem?.itemSkus.length" class="sku-table">
                                 <table class="data-table">
                   <thead>
                     <tr>
                       <th>SKU코드</th>
                       <th>SKU명</th>
                       <th>너비</th>
                       <th>높이</th>
                       <th>두께</th>
                       <th>납품단가</th>
                       <th>원가</th>
                       <th>마진율</th>
                       <th>재고수량</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr v-for="sku in viewingItem?.itemSkus" :key="sku.skuId">
                       <td>{{ sku.skuId }}</td>
                       <td>{{ sku.skuNm }}</td>
                       <td>{{ sku.width || '-' }}</td>
                       <td>{{ sku.height || '-' }}</td>
                       <td>{{ sku.thickness || '-' }}</td>
                       <td>{{ formatCurrency(sku.unitPrice) }}</td>
                       <td>{{ sku.costPrice !== undefined && sku.costPrice !== null ? formatCurrency(sku.costPrice) : '미설정' }}</td>
                       <td>
                         <span
                           v-if="calculateMarginRate(sku.unitPrice, sku.costPrice) !== null"
                           class="margin-badge"
                           :class="getMarginRateClass(calculateMarginRate(sku.unitPrice, sku.costPrice))"
                         >
                           {{ calculateMarginRate(sku.unitPrice, sku.costPrice)?.toFixed(1) }}%
                         </span>
                         <span v-else>-</span>
                       </td>
                       <td>{{ sku.stockQty || '-' }}</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
              <div v-else class="no-data-message">
                <p>등록된 SKU가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 스펙 등록/수정 모달 -->
    <div v-if="showSpecModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ specModalMode === 'create' ? '스펙 등록' : '스펙 수정' }}</h3>
          <button class="modal-close" @click="closeSpecModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitSpec" class="spec-form">
            <div class="form-row">
              <div class="form-group">
                <label>스펙명 *</label>
                <input 
                  v-model="specForm.specName" 
                  type="text" 
                  required
                  placeholder="스펙명"
                  maxlength="100"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>스펙값 *</label>
                <input 
                  v-model="specForm.specValue" 
                  type="text" 
                  required
                  placeholder="스펙값"
                  maxlength="200"
                  class="form-input"
                >
              </div>
            </div>

                         <div class="form-row">
               <div class="form-group">
                 <label>단위</label>
                 <input 
                   v-model="specForm.specUnit" 
                   type="text" 
                   placeholder="단위"
                   maxlength="20"
                   class="form-input"
                 >
               </div>
               <div class="form-group">
                 <label>정렬순서</label>
                 <input 
                   v-model="specForm.sortOrder" 
                   type="number" 
                   placeholder="정렬순서"
                   min="1"
                   class="form-input"
                 >
               </div>
             </div>

             <!-- 주석처리된 필드들
             <div class="form-row">
               <div class="form-group">
                 <label>너비</label>
                 <input 
                   v-model="specForm.width" 
                   type="text" 
                   placeholder="너비"
                   maxlength="50"
                   class="form-input"
                 >
               </div>
               <div class="form-group">
                 <label>높이</label>
                 <input 
                   v-model="specForm.height" 
                   type="text" 
                   placeholder="높이"
                   maxlength="50"
                   class="form-input"
                 >
               </div>
             </div>

             <div class="form-row">
               <div class="form-group">
                 <label>두께</label>
                 <input 
                   v-model="specForm.thickness" 
                   type="text" 
                   placeholder="두께"
                   maxlength="50"
                   class="form-input"
                 >
               </div>
               <div class="form-group">
                 <label>무게</label>
                 <input 
                   v-model="specForm.weight" 
                   type="text" 
                   placeholder="무게"
                   maxlength="50"
                   class="form-input"
                 >
               </div>
             </div>

             <div class="form-row">
               <div class="form-group">
                 <label>재질</label>
                 <input 
                   v-model="specForm.material" 
                   type="text" 
                   placeholder="재질"
                   maxlength="100"
                   class="form-input"
                 >
               </div>
               <div class="form-group">
                 <label>색상</label>
                 <input 
                   v-model="specForm.color" 
                   type="text" 
                   placeholder="색상"
                   maxlength="50"
                   class="form-input"
                 >
               </div>
             </div>
             -->

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>{{ specModalMode === 'create' ? '등록' : '수정' }}</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeSpecModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- SKU 등록/수정 모달 -->
    <div v-if="showSkuModal" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ skuModalMode === 'create' ? 'SKU 등록' : 'SKU 수정' }}</h3>
          <button class="modal-close" @click="closeSkuModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitSku" class="sku-form">
            <div class="form-row">
              <div class="form-group">
                <label>SKU코드 *</label>
                <input 
                  v-model="skuForm.skuId" 
                  type="text" 
                  required
                  placeholder="SKU코드"
                  maxlength="50"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>SKU명 *</label>
                <input 
                  v-model="skuForm.skuName" 
                  type="text" 
                  required
                  placeholder="SKU명"
                  maxlength="200"
                  class="form-input"
                >
              </div>
            </div>

                         <div class="form-row">
               <div class="form-group">
                 <label>단가</label>
                 <input 
                   v-model="skuForm.unitPrice" 
                   type="number" 
                   placeholder="단가"
                   min="0"
                   step="0.01"
                   class="form-input"
                 >
               </div>
               <div class="form-group">
                 <label>너비</label>
                 <input 
                   v-model="skuForm.width" 
                   type="number" 
                   placeholder="너비"
                   min="0"
                   step="0.01"
                   class="form-input"
                 >
               </div>
             </div>

            <div class="form-row">
              <div class="form-group">
                <label>높이</label>
                <input 
                  v-model="skuForm.height" 
                  type="number" 
                  placeholder="높이"
                  min="0"
                  step="0.01"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label>두께</label>
                <input 
                  v-model="skuForm.thickness" 
                  type="number" 
                  placeholder="두께"
                  min="0"
                  step="0.01"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>재고수량</label>
                <input 
                  v-model="skuForm.stockQty" 
                  type="number" 
                  placeholder="재고수량"
                  min="0"
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">
                <i class="fas fa-save"></i>
                <span>{{ skuModalMode === 'create' ? '등록' : '수정' }}</span>
              </button>
              <button type="button" class="btn-secondary" @click="closeSkuModal">
                <i class="fas fa-times"></i>
                <span>취소</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 원가 수정 모달 -->
    <CostPriceEditModal
      v-if="costPriceEditTarget"
      :is-open="showCostPriceModal"
      :item-id="costPriceEditTarget.itemId"
      :item-name="costPriceEditTarget.itemName"
      :unit-price="costPriceEditTarget.unitPrice"
      :current-cost-price="costPriceEditTarget.currentCostPrice"
      @close="closeCostPriceModal"
      @saved="handleCostPriceSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { itemService, type Item, type ItemCreateRequest, type ItemUpdateRequest } from '~/services/item.service'
// 리팩토링: 공통 composable import
import { useDataTable } from '~/composables/useDataTable'
import { formatCurrency } from '~/utils/format'
// 원가 수정 모달 컴포넌트
import CostPriceEditModal from '~/components/item/CostPriceEditModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '품목관리'
})

useHead({
  title: '품목관리 - PTPLPSM',
  meta: [
    { name: 'description', content: '품목 정보 관리' }
  ]
})

// 검색 폼
const searchForm = ref({
  keyword: '',
  useYn: ''
})

// 리팩토링: useDataTable composable 사용으로 페이지네이션 로직 통합
const {
  items,
  loading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  startIndex,
  endIndex,
  changePage,
  changePageSize,
  search,
  reset
} = useDataTable<Item>({
  fetchFunction: async (params) => {
    // 검색 조건이 있으면 searchItems, 없으면 getItems 호출
    if (searchForm.value.keyword || searchForm.value.useYn) {
      const response = await itemService.searchItems({
        keyword: searchForm.value.keyword,
        useYn: searchForm.value.useYn,
        page: params.page || 0,
        size: params.size || 10,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      })
      return response
    } else {
      const response = await itemService.getItems({
        page: params.page || 0,
        size: params.size || 10,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      })
      return response
    }
  },
  initialPageSize: 10
})

// 선택된 품목 및 탭 관리
const selectedItem = ref<Item | null>(null)
const selectedItemId = ref<string | null>(null)
const activeTab = ref<'specs' | 'skus'>('skus')

// 모달 상태
const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showSpecModal = ref(false)
const showSkuModal = ref(false)
const editingItem = ref<Item | null>(null)
const viewingItem = ref<Item | null>(null)

// 원가 수정 모달 상태
const showCostPriceModal = ref(false)
const costPriceEditTarget = ref<{
  itemId: string
  itemName: string
  unitPrice: number
  currentCostPrice?: number
} | null>(null)

// 모달 모드
const specModalMode = ref<'create' | 'edit'>('create')
const skuModalMode = ref<'create' | 'edit'>('create')

// 폼 데이터
const formData = ref<ItemCreateRequest>({
  itemId: '',
  itemNm: '',
  itemTypeCd: '',
  unitCd: '',
  width: undefined,
  height: undefined,
  thickness: undefined,
  unitPrice: undefined,
  description: '',
  useYn: 'Y',
  itemSpecs: [],
  itemSkus: []
})

// 스펙 폼 데이터
interface SpecForm {
  id: number | null
  specName: string
  specValue: string
  specUnit: string
  sortOrder: number
  useYn: string
}

// 스펙 폼 데이터
const specForm = ref<SpecForm>({
  id: null,
  specName: '',
  specValue: '',
  specUnit: '',
  sortOrder: 1,
  useYn: 'Y'
})

interface SkuForm {
  skuId: string
  skuName: string
  width: number | null
  height: number | null
  thickness: number | null
  unitPrice: number | null
  stockQty: number | null
  useYn: string
}

// SKU 폼 데이터
const skuForm = ref<SkuForm>({
  skuId: '',
  skuName: '',
  width: null,
  height: null,
  thickness: null,
  unitPrice: null,
  stockQty: null,
  useYn: 'Y'
})


// 품목 선택
const selectItem = (item: Item) => {
  selectedItem.value = item
  selectedItemId.value = item.itemId?.toString() ?? ''
  activeTab.value = 'skus'
}

// 검색 기능 - 리팩토링: useDataTable의 search 사용
const searchItems = () => {
  search()
}

// 검색 초기화 - 리팩토링: useDataTable의 reset 사용
const resetSearch = () => {
  searchForm.value = {
    keyword: '',
    useYn: ''
  }
  reset()
}

// 페이지 변경 - 리팩토링: useDataTable의 changePage 사용
const handlePageChange = (page: number) => {
  changePage(page)
}

// 페이지 크기 변경 - 리팩토링: useDataTable의 changePageSize 사용
const handlePageSizeChange = () => {
  changePageSize(pageSize.value)
}

// 등록 모달 열기
const openAddModal = () => {
  formData.value = {
    itemId: '',
    itemNm: '',
    itemTypeCd: '',
    unitCd: '',
    width: undefined,
    height: undefined,
    thickness: undefined,
    unitPrice: undefined,
    description: '',
    useYn: 'Y',
    itemSpecs: [],
    itemSkus: []
  }
  showAddModal.value = true
}

// 수정 모달 열기
const openEditModal = (item: Item) => {
  editingItem.value = item
  formData.value = {
    itemId: item.itemId,
    itemNm: item.itemNm,
    itemTypeCd: item.itemTypeCd || '',
    unitCd: item.unitCd || '',
    width: item.width,
    height: item.height,
    thickness: item.thickness,
    unitPrice: item.unitPrice,
    description: item.description || '',
    useYn: item.useYn,
    itemSpecs: item.itemSpecs,
    itemSkus: item.itemSkus
  }
  showEditModal.value = true
}

// 상세보기 모달 열기
const openViewModal = (item: Item) => {
  viewingItem.value = item
  showViewModal.value = true
}

// 스펙 모달 열기
const openSpecModal = (mode: 'create' | 'edit', spec?: any) => {
  specModalMode.value = mode
  if (mode === 'create') {
    specForm.value = {
      id: null,
      specName: '',
      specValue: '',
      specUnit: '',
      sortOrder: 1,
      useYn: 'Y'
    }
  } else if (spec) {
    specForm.value = {
      id: spec.id,
      specName: spec.specName,
      specValue: spec.specValue,
      specUnit: spec.specUnit || '',
      sortOrder: spec.sortOrder || 1,
      useYn: spec.useYn || 'Y'
    }
  }
  showSpecModal.value = true
}

// SKU 모달 열기
const openSkuModal = (mode: 'create' | 'edit', sku?: any) => {
  skuModalMode.value = mode
  if (mode === 'create') {
    skuForm.value = {
      skuId: '',
      skuName: '',
      width: null,
      height: null,
      thickness: null,
      unitPrice: null,
      stockQty: null,
      useYn: 'Y'
    }
  } else if (sku) {
    skuForm.value = {
      skuId: sku.skuId,
      skuName: sku.skuNm,
      width: sku.width || null,
      height: sku.height || null,
      thickness: sku.thickness || null,
      unitPrice: sku.unitPrice,
      stockQty: sku.stockQty,
      useYn: sku.useYn || 'Y'
    }
  }
  showSkuModal.value = true
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  showViewModal.value = false
  editingItem.value = null
  viewingItem.value = null
}

// 스펙 모달 닫기
const closeSpecModal = () => {
  showSpecModal.value = false
  specForm.value = {
    id: null,
    specName: '',
    specValue: '',
    specUnit: '',
    sortOrder: 1,
    useYn: 'Y'
  }
}

// SKU 모달 닫기
const closeSkuModal = () => {
  showSkuModal.value = false
  skuForm.value = {
    skuId: '',
    skuName: '',
    width: null,
    height: null,
    thickness: null,
    unitPrice: null,
    stockQty: null,
    useYn: 'Y'
  }
}

// 유효성 검사
const validateForm = async (): Promise<boolean> => {
  if (!formData.value.itemId) {
    alert('품목코드를 입력해주세요.')
    return false
  }
  
  if (!formData.value.itemNm) {
    alert('품목명을 입력해주세요.')
    return false
  }

  // 등록 시에만 품목코드 중복 확인
  if (showAddModal.value) {
    try {
      const checkResult = await itemService.checkItemId(formData.value.itemId)
      if (checkResult.exists) {
        alert(checkResult.message)
        return false
      }
    } catch (error) {
      console.error('품목코드 중복 확인 실패:', error)
      // 중복 확인 실패 시에도 진행
    }
  }
  
  return true
}

// 스펙 유효성 검사
const validateSpecForm = (): boolean => {
  if (!specForm.value.specName) {
    alert('스펙명을 입력해주세요.')
    return false
  }
  
  if (!specForm.value.specValue) {
    alert('스펙값을 입력해주세요.')
    return false
  }
  
  return true
}

// SKU 유효성 검사
const validateSkuForm = async (): Promise<boolean> => {
  if (!skuForm.value.skuId) {
    alert('SKU코드를 입력해주세요.')
    return false
  }
  
  if (!skuForm.value.skuName) {
    alert('SKU명을 입력해주세요.')
    return false
  }
  
  // SKU 코드 중복 확인 (새로 등록하는 경우에만)
  if (skuModalMode.value === 'create') {
    try {
      const isDuplicate = await itemService.checkSkuId(skuForm.value.skuId?.toString() ?? '')
      if (isDuplicate) {
        alert('이미 존재하는 SKU코드입니다. 다른 코드를 사용해주세요.')
        return false
      }
    } catch (error) {
      console.error('SKU 코드 중복 확인 실패:', error)
      // 중복 확인 실패 시에도 진행 (백엔드에서 최종 검증)
    }
  }
  
  return true
}

// 등록
const submitAdd = async () => {
  if (!(await validateForm())) return
  
  try {
    await itemService.createItem(formData.value)
    closeModal()
    // 선택된 품목 초기화
    selectedItem.value = null
    selectedItemId.value = null
    search()
    alert('품목이 성공적으로 등록되었습니다.')
  } catch (error) {
    console.error('품목 등록 실패:', error)
    alert(error instanceof Error ? error.message : '품목 등록에 실패했습니다.')
  }
}

// 수정
const submitEdit = async () => {
  if (!(await validateForm()) || !editingItem.value) return
  
  try {
    const updateData: ItemUpdateRequest = {
      itemNm: formData.value.itemNm,
      itemTypeCd: formData.value.itemTypeCd,
      unitCd: formData.value.unitCd,
      width: formData.value.width,
      height: formData.value.height,
      thickness: formData.value.thickness,
      unitPrice: formData.value.unitPrice,
      description: formData.value.description,
      useYn: formData.value.useYn,
      itemSpecs: formData.value.itemSpecs,
      itemSkus: formData.value.itemSkus
    }
    
    await itemService.updateItem(editingItem.value.itemId, updateData)
    closeModal()
    // 선택된 품목 초기화
    selectedItem.value = null
    selectedItemId.value = null
    search()
    alert('품목이 성공적으로 수정되었습니다.')
  } catch (error) {
    console.error('품목 수정 실패:', error)
    alert(error instanceof Error ? error.message : '품목 수정에 실패했습니다.')
  }
}

// 스펙 등록/수정
const submitSpec = async () => {
  if (!validateSpecForm() || !selectedItem.value) return
  
  try {
    if (specModalMode.value === 'create') {
             // 새 스펙 추가
       const newSpec = {
         id: Date.now(), // 임시 ID
         specName: specForm.value.specName,
         specValue: specForm.value.specValue,
         specUnit: specForm.value.specUnit,
         sortOrder: specForm.value.sortOrder
       }
      
      selectedItem.value.itemSpecs.push(newSpec)
      
      // 품목 업데이트
      const updateData: ItemUpdateRequest = {
        itemNm: selectedItem.value.itemNm,
        itemTypeCd: selectedItem.value.itemTypeCd || '',
        unitCd: selectedItem.value.unitCd || '',
        width: selectedItem.value.width,
        height: selectedItem.value.height,
        thickness: selectedItem.value.thickness,
        unitPrice: selectedItem.value.unitPrice,
        description: selectedItem.value.description || '',
        useYn: selectedItem.value.useYn,
        itemSpecs: selectedItem.value.itemSpecs,
        itemSkus: selectedItem.value.itemSkus
      }
      
      await itemService.updateItem(selectedItem.value.itemId, updateData)
    } else {
      // 기존 스펙 수정
      const specIndex = selectedItem.value.itemSpecs.findIndex(spec => spec.id === specForm.value.id)
      if (specIndex !== -1) {
                 selectedItem.value.itemSpecs[specIndex] = {
           ...selectedItem.value.itemSpecs[specIndex],
           specName: specForm.value.specName,
           specValue: specForm.value.specValue,
           specUnit: specForm.value.specUnit,
           sortOrder: specForm.value.sortOrder,
           id: specForm.value.id!
         }
        
        // 품목 업데이트
        const updateData: ItemUpdateRequest = {
          itemNm: selectedItem.value.itemNm,
          itemTypeCd: selectedItem.value.itemTypeCd || '',
          unitCd: selectedItem.value.unitCd || '',
          width: selectedItem.value.width,
          height: selectedItem.value.height,
          thickness: selectedItem.value.thickness,
          unitPrice: selectedItem.value.unitPrice,
          description: selectedItem.value.description || '',
          useYn: selectedItem.value.useYn,
          itemSpecs: selectedItem.value.itemSpecs,
          itemSkus: selectedItem.value.itemSkus
        }
        
        await itemService.updateItem(selectedItem.value.itemId, updateData)
      }
    }
    
    closeSpecModal()
    
    // 등록/수정 후 즉시 데이터 새로고침
    await refreshItemDetail(selectedItem.value.itemId)
    
    alert(`스펙이 성공적으로 ${specModalMode.value === 'create' ? '등록' : '수정'}되었습니다.`)
  } catch (error) {
    console.error('스펙 등록/수정 실패:', error)
    
    // 백엔드에서 전달된 구체적인 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        alert('품목 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.')
        await refreshItemDetail(selectedItem.value.itemId)
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        alert(error.message)
      }
    } else {
      alert('스펙 등록/수정에 실패했습니다.')
    }
  }
}

// SKU 등록/수정
const submitSku = async () => {
  if (!(await validateSkuForm()) || !selectedItem.value) return
  
  try {
    if (skuModalMode.value === 'create') {
      // 새 SKU 추가 - 별도 API 사용
      const skuData = {
        skuId: skuForm.value.skuId?.toString() ?? '',
        skuNm: skuForm.value.skuName,
        option1Cd: 'OPTION1',
        option2Cd: 'OPTION2',
        width: skuForm.value.width || undefined,
        height: skuForm.value.height || undefined,
        thickness: skuForm.value.thickness || undefined,
        unitPrice: skuForm.value.unitPrice || undefined,
        stockQty: skuForm.value.stockQty || undefined,
        useYn: skuForm.value.useYn
      }
      
      // API를 통한 SKU 등록
      await itemService.createSku(selectedItem.value.itemId, skuData)
    } else {
      // 기존 SKU 수정 - 품목 업데이트 API 사용
      const skuIndex = selectedItem.value.itemSkus.findIndex(sku => sku.skuId === (skuForm.value.skuId?.toString() ?? ''))
      if (skuIndex !== -1) {
        selectedItem.value.itemSkus[skuIndex] = {
          ...selectedItem.value.itemSkus[skuIndex],
          skuId: skuForm.value.skuId?.toString() ?? '',
          skuNm: skuForm.value.skuName,
          width: skuForm.value.width || undefined,
          height: skuForm.value.height || undefined,
          thickness: skuForm.value.thickness || undefined,
          unitPrice: skuForm.value.unitPrice || undefined,
          stockQty: skuForm.value.stockQty || undefined,
          useYn: skuForm.value.useYn
        }
        
        // 품목 업데이트
        const updateData: ItemUpdateRequest = {
          itemNm: selectedItem.value.itemNm,
          itemTypeCd: selectedItem.value.itemTypeCd || '',
          unitCd: selectedItem.value.unitCd || '',
          width: selectedItem.value.width,
          height: selectedItem.value.height,
          thickness: selectedItem.value.thickness,
          unitPrice: selectedItem.value.unitPrice,
          description: selectedItem.value.description || '',
          useYn: selectedItem.value.useYn,
          itemSpecs: selectedItem.value.itemSpecs,
          itemSkus: selectedItem.value.itemSkus
        }
        
        await itemService.updateItem(selectedItem.value.itemId, updateData)
      }
    }
    
    closeSkuModal()
    
    // 등록/수정 후 즉시 데이터 새로고침
    await refreshItemDetail(selectedItem.value.itemId)
    
    alert(`SKU가 성공적으로 ${skuModalMode.value === 'create' ? '등록' : '수정'}되었습니다.`)
  } catch (error) {
    console.error('SKU 등록/수정 실패:', error)

    // 백엔드에서 전달된 구체적인 에러 메시지 처리
    if (error instanceof Error) {
      // 에러 메시지에서 실제 원인 파악
      const errorMessage = error.message.toLowerCase()

      if (errorMessage.includes('duplicate') || errorMessage.includes('중복')) {
        // 실제로 중복 관련 메시지가 포함된 경우에만 중복 에러로 처리
        alert('SKU코드가 중복되었습니다. 다른 코드를 사용해주세요.')
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        alert('품목 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.')
        await refreshItemDetail(selectedItem.value.itemId)
      } else if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
        // 500 에러 시 실제 서버 에러 메시지 표시
        alert(`서버 오류가 발생했습니다.\n\n상세 정보: ${error.message}\n\n관리자에게 문의해주세요.`)
        console.error('서버 오류 상세:', error)
      } else {
        // 기타 에러는 원본 메시지 표시
        alert(`SKU ${skuModalMode.value === 'create' ? '등록' : '수정'} 실패:\n${error.message}`)
      }
    } else {
      alert('SKU 등록/수정에 실패했습니다. 관리자에게 문의해주세요.')
    }
  }
}

// 삭제
const deleteItem = async (item: Item) => {
  if (!isItemDeletable(item)) {
    alert('스펙이나 SKU 정보가 있는 품목은 삭제할 수 없습니다. 먼저 스펙/SKU 정보를 삭제해주세요.')
    return
  }
  
  if (!confirm('정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return
  
  try {
    await itemService.deleteItem(item.itemId)
    // 선택된 품목이 삭제된 품목이면 초기화
    if (selectedItem.value && selectedItem.value.itemId === item.itemId) {
      selectedItem.value = null
      selectedItemId.value = null
    }
    search()
    alert('품목이 성공적으로 삭제되었습니다.')
  } catch (error) {
    console.error('품목 삭제 실패:', error)
    alert(error instanceof Error ? error.message : '품목 삭제에 실패했습니다.')
  }
}

// 스펙 삭제 전 확인 및 삭제 처리
const deleteSpec = async (specId: string | number) => {
  if (!selectedItem.value) return
  
  try {
    // 삭제할 스펙 정보 찾기
    const specToDelete = selectedItem.value.itemSpecs.find(spec => spec.id === specId)
    if (!specToDelete) {
      alert('삭제할 스펙 정보를 찾을 수 없습니다.')
      return
    }
    
    // 삭제 확인 다이얼로그
    const confirmed = confirm(
      `스펙 "${specToDelete.specName}" (${specToDelete.specValue})를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`
    )
    
    if (!confirmed) return
    
    // API를 통한 스펙 삭제
    await itemService.deleteSpec(selectedItem.value.itemId, specId?.toString() ?? '')
    
    // 삭제 후 즉시 데이터 새로고침
    await refreshItemDetail(selectedItem.value.itemId)
    
    alert('스펙이 성공적으로 삭제되었습니다.')
  } catch (error) {
    console.error('스펙 삭제 실패:', error)
    
    // 백엔드에서 전달된 구체적인 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        alert('삭제할 스펙을 찾을 수 없습니다. 페이지를 새로고침해주세요.')
        // 데이터 동기화 문제로 인식하여 전체 새로고침
        await refreshItemDetail(selectedItem.value.itemId)
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        alert(error.message)
      }
    } else {
      alert('스펙 삭제에 실패했습니다.')
    }
  }
}

// SKU 삭제 전 확인 및 삭제 처리
const deleteSku = async (skuId: string) => {
  if (!selectedItem.value) return
  
  try {
    // 삭제할 SKU 정보 찾기
    const skuToDelete = selectedItem.value.itemSkus.find(sku => sku.skuId === skuId)
    if (!skuToDelete) {
      alert('삭제할 SKU 정보를 찾을 수 없습니다.')
      return
    }
    
    // 삭제 확인 다이얼로그
    const confirmed = confirm(
      `SKU "${skuToDelete.skuNm}" (${skuToDelete.skuId})를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`
    )
    
    if (!confirmed) return
    
    // API를 통한 SKU 삭제
    await itemService.deleteSku(selectedItem.value.itemId, skuId)
    
    // 삭제 후 즉시 데이터 새로고침
    await refreshItemDetail(selectedItem.value.itemId)
    
    alert('SKU가 성공적으로 삭제되었습니다.')
  } catch (error) {
    console.error('SKU 삭제 실패:', error)
    
    // 백엔드에서 전달된 구체적인 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        alert('삭제할 SKU를 찾을 수 없습니다. 페이지를 새로고침해주세요.')
        // 데이터 동기화 문제로 인식하여 전체 새로고침
        await refreshItemDetail(selectedItem.value.itemId)
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        alert(error.message)
      }
    } else {
      alert('SKU 삭제에 실패했습니다.')
    }
  }
}

// 선택된 품목 상세 정보 새로고침
const refreshItemDetail = async (itemId: string) => {
  try {
    const updatedItem = await itemService.getItemById(itemId)
    if (updatedItem) {
      selectedItem.value = updatedItem
    } else {
      // 품목을 찾을 수 없는 경우 선택 해제
      selectedItem.value = null
      selectedItemId.value = null
      alert('품목 정보를 찾을 수 없습니다.')
    }
  } catch (error) {
    console.error('품목 상세 정보 새로고침 실패:', error)
    // 새로고침 실패 시 선택 해제
    selectedItem.value = null
    selectedItemId.value = null
    alert('품목 정보를 새로고침할 수 없습니다.')
  }
}

// 삭제 가능 여부 확인
const isItemDeletable = (item: Item): boolean => {
  const hasSpecs = item.itemSpecs && item.itemSpecs.length > 0
  const hasSkus = item.itemSkus && item.itemSkus.length > 0
  return !hasSpecs && !hasSkus
}

// ========== 원가 관련 함수 ==========

/**
 * 마진율 계산
 * @param unitPrice 납품단가
 * @param costPrice 원가
 * @returns 마진율 (%) 또는 null
 */
const calculateMarginRate = (unitPrice?: number, costPrice?: number): number | null => {
  if (!unitPrice || unitPrice <= 0 || costPrice === undefined || costPrice === null) {
    return null
  }
  const margin = unitPrice - costPrice
  return (margin / unitPrice) * 100
}

/**
 * 마진율에 따른 CSS 클래스 반환
 */
const getMarginRateClass = (marginRate: number | null): string => {
  if (marginRate === null) return ''
  if (marginRate >= 30) return 'margin-high'
  if (marginRate >= 15) return 'margin-normal'
  if (marginRate >= 0) return 'margin-low'
  return 'margin-negative'
}

/**
 * 원가 수정 모달 열기
 */
const openCostPriceModal = (sku: any) => {
  if (!selectedItem.value) return

  costPriceEditTarget.value = {
    itemId: selectedItem.value.itemId,
    itemName: `${selectedItem.value.itemNm} - ${sku.skuNm}`,
    unitPrice: sku.unitPrice || 0,
    currentCostPrice: sku.costPrice
  }
  showCostPriceModal.value = true
}

/**
 * 원가 수정 모달 닫기
 */
const closeCostPriceModal = () => {
  showCostPriceModal.value = false
  costPriceEditTarget.value = null
}

/**
 * 원가 수정 완료 처리
 */
const handleCostPriceSaved = async () => {
  closeCostPriceModal()
  // 선택된 품목 정보 새로고침
  if (selectedItem.value) {
    await refreshItemDetail(selectedItem.value.itemId)
  }
}

// 초기 데이터 로드
onMounted(() => {
  search()
})
</script>

<style scoped>
/* ============================================
   리팩토링: 공통 스타일은 admin-common.css 사용
   - 래퍼 스타일 (.item-management, .item-management-container)
   - 버튼 스타일 (.btn-primary, .btn-secondary, .btn-edit, .btn-delete)
   - 폼 스타일 (.form-input, .form-select)
   - 테이블 스타일 (.data-table)
   ============================================ */

/* 페이지 특화 스타일만 작성 */

/* 1단계: 페이지 컨테이너 - 그라데이션 배경 */
.item-management {
  max-width: 100%;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: calc(100vh - 120px);
  padding: 0.5rem;
}

/* 2열 레이아웃 컨테이너 */
.item-management-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  background: transparent;
}

/* 섹션 카드 공통 스타일 */
.item-basic-section,
.item-detail-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
}

/* 2단계: 검색 섹션 - 카드 스타일 */
.search-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
  flex: 1;
}

.form-group.button-group {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  min-width: auto;
  flex: 0 0 auto;
  align-items: flex-end;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.search-input-group {
  flex: 1;
}

.search-labels {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.search-labels label {
  font-weight: 600;
  color: #475569;
  font-size: 0.8125rem;
}

.search-labels label:first-child {
  flex: 1;
}

.search-labels label:last-child {
  flex: 0 0 130px;
  text-align: left;
}

.search-input-wrapper {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.search-input {
  flex: 1;
  min-width: 300px;
  height: 42px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.search-input-wrapper .form-group {
  flex: 0 0 130px;
}

.search-input-wrapper .form-select {
  width: 100%;
  min-width: 130px;
  height: 42px;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-input-wrapper .form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

/* 검색 버튼 - 그라데이션 */
.search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 1.5rem;
  min-width: auto;
  height: 42px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.35);
}

.search-btn:active {
  transform: translateY(0);
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 3단계: 테이블 섹션 - 현대적 디자인 */
.table-section {
  background: transparent;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.table-info {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.table-info span {
  color: #3b82f6;
  font-weight: 600;
}

.page-size-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8125rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-size-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.table-container {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  flex: 1;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.data-table th {
  padding: 0.875rem 1rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: 700;
  font-size: 0.8125rem;
  color: #475569;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

/* Zebra stripe */
.table-row:nth-child(even) {
  background: #fafbfc;
}

/* Hover effect */
.table-row {
  cursor: pointer;
  transition: all 0.15s ease;
}

.table-row:hover {
  background: #f0f9ff;
  transform: translateX(2px);
}

/* 선택된 행 - 강조 */
.table-row.selected {
  background: linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%);
  border-left: 3px solid #3b82f6;
}

/* 첫 번째 열(ID) 강조 */
.data-table td:first-child {
  font-weight: 600;
  color: #3b82f6;
}

/* 4단계: 액션 버튼 - 그라데이션 및 애니메이션 */
.action-buttons {
  display: flex;
  gap: 0.375rem;
  justify-content: flex-start;
  flex-wrap: nowrap;
}

.btn-view,
.btn-edit,
.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* 상세 버튼 (초록) */
.btn-view {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-view:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

/* 수정 버튼 (주황) */
.btn-edit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
}

/* 삭제 버튼 (빨강) */
.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.btn-delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

/* 삭제 불가 버튼 */
.btn-delete.disabled {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-delete.disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 5단계: 배지 스타일 - Pill 형태, 그라데이션 */
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.25rem 0.625rem;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #4f46e5;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid #c7d2fe;
}

/* 상태 배지 - 사용중 (초록) */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #059669;
  border: 1px solid #a7f3d0;
}

/* 상태 배지 - 미사용 (빨강) */
.status-badge.inactive {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 8단계: 페이지네이션 - 현대적 스타일 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.pagination-btn,
.page-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  background: white;
  color: #475569;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pagination-btn:hover:not(:disabled),
.page-number:hover:not(:disabled):not(.active) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.page-number.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
}

.pagination-btn:disabled,
.page-number:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal.large-modal {
  max-width: 1200px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.item-form,
.spec-form,
.sku-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.item-form .form-row,
.spec-form .form-row,
.sku-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.item-form .form-group,
.spec-form .form-group,
.sku-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-form label,
.spec-form label,
.sku-form label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.item-form .form-input,
.spec-form .form-input,
.sku-form .form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.item-form .form-input:focus,
.spec-form .form-input:focus,
.sku-form .form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-form .form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* 상세보기 스타일 */
.item-detail {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.detail-section h4 {
  margin: 0;
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-item span {
  color: #374151;
  font-size: 0.875rem;
}

.spec-table,
.sku-table {
  padding: 1rem;
}

/* 데이터 없음 및 로딩 메시지 */
.no-data-message,
.loading-message {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.no-data-message i,
.loading-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-message i {
  animation: spin 1s linear infinite;
}

/* 섹션 헤더 - 포인트 라인 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.025em;
}

/* 7단계: 선택된 품목 정보 - 배지 스타일 */
.section-info {
  font-size: 0.875rem;
}

.selected-item-info {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-radius: 8px;
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.selected-item-info strong {
  font-weight: 700;
  color: #1d4ed8;
}

.no-selection-info {
  color: #94a3b8;
  font-style: italic;
}

/* 6단계: 탭 네비게이션 - 세그먼트 컨트롤 */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  padding: 0.375rem;
  background: #f1f5f9;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: #64748b;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover:not(:disabled):not(.active) {
  background: rgba(255, 255, 255, 0.5);
  color: #475569;
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-button.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 탭 카운트 배지 */
.tab-count {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.6875rem;
  font-weight: 700;
}

.tab-button.active .tab-count {
  background: #dbeafe;
  color: #2563eb;
}

/* 탭 콘텐츠 */
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.tab-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
}

.tab-header .btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.tab-header .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
}

.tab-header .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 탭 콘텐츠 내 테이블 - 통일된 스타일 적용 */
.tab-content .table-container {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.tab-content .table-header {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
}

.tab-content .table-info {
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
}

.tab-content .page-size-select {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
}

.tab-content .table-container .data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8125rem;
}

.tab-content .data-table th {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.75rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.75rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid #e2e8f0;
}

.tab-content .data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
}

.tab-content .table-row:nth-child(even) {
  background: #fafbfc;
}

.tab-content .table-row:hover {
  background: #f0f9ff;
}

/* 탭 콘텐츠 버튼 - 그라데이션 적용 */
.tab-content .action-buttons {
  display: flex;
  gap: 0.375rem;
  flex-wrap: nowrap;
}

.tab-content .btn-view,
.tab-content .btn-edit,
.tab-content .btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border: none;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-content .btn-view {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.2);
}

.tab-content .btn-view:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(16, 185, 129, 0.3);
}

.tab-content .btn-edit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.2);
}

.tab-content .btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(245, 158, 11, 0.3);
}

.tab-content .btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.2);
}

.tab-content .btn-delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(239, 68, 68, 0.3);
}

.tab-content .btn-delete.disabled {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.tab-content .btn-delete.disabled:hover {
  transform: none;
}

/* 탭 콘텐츠 배지 */
.tab-content .count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  padding: 0.1875rem 0.5rem;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #4f46e5;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  border: 1px solid #c7d2fe;
}

.tab-content .status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #059669;
  border: 1px solid #a7f3d0;
}

.tab-content .status-badge.inactive {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 빈 상태 메시지 */
.tab-content .no-data-message,
.tab-content .loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #94a3b8;
}

.tab-content .no-data-message i,
.tab-content .loading-message i {
  font-size: 2.5rem;
  opacity: 0.5;
}

.tab-content .no-data-message p,
.tab-content .loading-message p {
  font-size: 0.9375rem;
  margin: 0;
}

.tab-content .loading-message i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tab-content .no-selection-row td {
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.tab-content .no-selection-message {
  padding: 1rem;
}

.tab-content .no-data-row td {
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.tab-content .no-data-message {
  padding: 1rem;
}

.tab-content .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.tab-content .empty-state i {
  font-size: 2rem;
}

/* 마진율 배지 스타일 - 그라데이션 */
.margin-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.margin-high {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #059669;
  border: 1px solid #a7f3d0;
}

.margin-normal {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #0284c7;
  border: 1px solid #93c5fd;
}

.margin-low {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  border: 1px solid #fcd34d;
}

.margin-negative {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

.margin-none {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

/* 원가 버튼 스타일 - 그라데이션 */
.btn-cost {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

.btn-cost:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}

.btn-cost-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1.5px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cost-edit:hover {
  background: #f8fafc;
  border-color: #8b5cf6;
  color: #7c3aed;
}

/* 반응형 - 1열 레이아웃 전환 */
@media (max-width: 1200px) {
  .item-management-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .item-management {
    padding: 0.5rem;
  }

  .item-basic-section,
  .item-detail-section {
    padding: 1rem;
    border-radius: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .section-header::after {
    width: 60px;
  }

  .search-section {
    padding: 1rem;
  }

  .search-input-wrapper {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-input {
    min-width: 100%;
  }

  .search-input-wrapper .form-group {
    flex: 1;
  }

  .search-labels {
    flex-direction: column;
    gap: 0.25rem;
  }

  .search-labels label:last-child {
    flex: 1;
  }

  .form-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-group.button-group {
    width: 100%;
  }

  .search-btn {
    width: 100%;
    justify-content: center;
  }

  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .modal {
    width: 95%;
    margin: 1rem;
    border-radius: 12px;
  }

  .item-form .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .tab-navigation {
    padding: 0.25rem;
  }

  .tab-button {
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
  }

  .tab-content .table-container {
    flex: none;
    overflow-x: auto;
    border-radius: 8px;
  }

  .tab-content .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .tab-content .tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .tab-content .tab-header .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
