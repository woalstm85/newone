/**
 * ProductQuoteModal.js
 * 제품 견적 의뢰 입력 모달 컴포넌트
 * 
 * 주요 기능:
 * - 단일/다중 제품 견적 의뢰 지원
 * - 제품 정보 및 옵션 표시
 * - 수량 조절 및 총액 계산
 * - 견적 요청 정보 입력 폼
 * - 유효성 검증
 * - 반응형 디자인 (모바일/데스크톱)
 */

import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Minus, Trash2, ImageOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { quoteAPI, commonAPI } from '../../services/api';
import './ProductQuoteModal.css';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';

/**
 * ProductQuoteModal 컴포넌트
 * 
 * @param {Object} product - 단일 제품 정보
 * @param {Array} products - 여러 제품 목록
 * @param {Array} selectedProducts - 선택된 제품 목록 (장바구니에서)
 * @param {boolean} isOpen - 모달 열림/닫힘 상태
 * @param {Function} onClose - 모달 닫기 콜백
 * @param {Function} onRemoveProduct - 제품 삭제 콜백
 * @param {Function} onUpdateQuantity - 수량 업데이트 콜백
 */
const ProductQuoteModal = ({ product, products, selectedProducts, isOpen, onClose, onRemoveProduct, onUpdateQuantity }) => {

  // 상태 관리
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [optionValues, setOptionValues] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showProductsOnMobile, setShowProductsOnMobile] = useState(false);
  
  const { globalState } = useAuth();
  
  // 제품 타입 판별
  const isMultipleProducts = products && products.length > 0;
  const hasSelectedProducts = selectedProducts && selectedProducts.length > 0;
  
  /**
   * 현재 제품 목록 결정
   * 우선순위: selectedProducts > products > product
   */
  let currentProducts = [];
  if (hasSelectedProducts) {
    currentProducts = selectedProducts;
  } else if (isMultipleProducts) {
    currentProducts = products;
  } else if (product) {
    currentProducts = [product];
  }
  
  const isSingleProduct = !isMultipleProducts && !hasSelectedProducts && product;
  
  /**
   * 모바일 제품 목록 표시 텍스트 생성
   * 
   * @returns {string} 표시할 텍스트
   */
  const getMobileProductsText = () => {
    if (currentProducts.length === 0) return '상품 없음';
    if (currentProducts.length === 1) return currentProducts[0].itemNm;
    
    const firstProduct = currentProducts[0].itemNm;
    const otherCount = currentProducts.length - 1;
    return `${firstProduct} 외 ${otherCount}개`;
  };
  
  // 견적 의뢰 폼 상태
  const [quoteForm, setQuoteForm] = useState({
    custNm: '',
    managerName: '',
    contact: '',
    email: '',
    address: '',
    requestContent: '',
    deliveryDate: ''
  });
  
  // 유효성 검증 오류 상태
  const [validationErrors, setValidationErrors] = useState({});
  
  // 로그인 상태 확인
  const isLoggedIn = !!globalState.G_USER_ID;

  /**
   * 모달이 열릴 때마다 상태 초기화 및 ESC 키 이벤트 추가
   */
  useEffect(() => {
    if (isOpen && currentProducts.length > 0) {
      setQuantity(1);
      setShowLoginModal(false);
      setShowSuccessModal(false);
      setSelectedOptionValue('');
      setSuccessMessage('');
      setValidationErrors({});
      
      // 폼 초기화 - 로그인 정보로 설정
      if (isLoggedIn) {
        setQuoteForm({
          custNm: globalState.G_CUST_NM || '',
          managerName: globalState.G_USER_NM || '',
          contact: '',
          email: '',
          address: '',
          requestContent: '',
          deliveryDate: ''
        });
      } else {
        setQuoteForm({
          custNm: '',
          managerName: '',
          contact: '',
          email: '',
          address: '',
          requestContent: '',
          deliveryDate: ''
        });
      }
      
      // 단일 상품인 경우에만 옵션값 로드
      if (isSingleProduct && product.optCd) {
        loadOptionValues(product.optCd);
      } else {
        setOptionValues([]);
      }
      
      // ESC 키 이벤트 리스너 추가
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, currentProducts, isLoggedIn, globalState, isSingleProduct, product]);

  /**
   * 옵션값 로드 함수
   * 
   * @param {string} optCd - 옵션 코드
   */
  const loadOptionValues = async (optCd) => {
    try {
      setLoadingOptions(true);
      const options = await commonAPI.getOptionValues(optCd);
      
      if (options && Array.isArray(options)) {
        setOptionValues(options);
        if (options.length > 0) {
          setSelectedOptionValue(options[0].optValCd);
        }
      } else {
        setOptionValues([]);
      }
    } catch (error) {
      console.error('옵션값 로드 실패:', error);
      setOptionValues([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen || currentProducts.length === 0) return null;

  /**
   * 수량 변경 핸들러
   * 
   * @param {number} delta - 변경할 수량
   * @param {string} productItemCd - 제품 코드
   */
  const handleQuantityChange = (delta, productItemCd = null) => {
    if (isSingleProduct) {
      const newQuantity = Math.max(1, quantity + delta);
      setQuantity(newQuantity);
    } else {
      if (onUpdateQuantity && productItemCd) {
        onUpdateQuantity(productItemCd, delta);
      }
    }
  };

  /**
   * 총액 계산 함수
   * 
   * @param {Object} productItem - 제품 아이템
   * @returns {string} 천단위 구분된 총액 문자열
   */
  const calculateTotal = (productItem = null) => {
    if (isSingleProduct) {
      const price = product.disPrice || product.salePrice || 0;
      return (price * quantity).toLocaleString();
    } else if (productItem) {
      return (productItem.price * productItem.quantity).toLocaleString();
    }
    return '0';
  };
  
  /**
   * 전체 합계 계산 함수
   * 
   * @returns {string} 천단위 구분된 전체 합계 문자열
   */
  const calculateGrandTotal = () => {
    if (isSingleProduct) {
      return calculateTotal();
    } else {
      const total = currentProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return total.toLocaleString();
    }
  };

  /**
   * 폼 입력 핸들러
   * 
   * @param {string} field - 필드명
   * @param {string} value - 입력값
   */
  const handleFormChange = (field, value) => {
    setQuoteForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  /**
   * 유효성 검증 함수
   * 
   * @returns {boolean} 유효성 검증 통과 여부
   */
  const validateForm = () => {
    const errors = {};
    let firstErrorField = null;

    if (!quoteForm.custNm.trim()) {
      errors.custNm = true;
      if (!firstErrorField) firstErrorField = 'custNm';
    }
    if (!quoteForm.managerName.trim()) {
      errors.managerName = true;
      if (!firstErrorField) firstErrorField = 'managerName';
    }
    if (!quoteForm.contact.trim()) {
      errors.contact = true;
      if (!firstErrorField) firstErrorField = 'contact';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessages = {
        custNm: '업체명을 입력해주세요.',
        managerName: '담당자명을 입력해주세요.',
        contact: '연락처를 입력해주세요.'
      };
      
      setValidationMessage(errorMessages[firstErrorField]);
      setShowValidationModal(true);
      return false;
    }

    return true;
  };

  /**
   * 날짜 포맷 함수
   * 
   * @param {string} dateString - 날짜 문자열
   * @returns {string|null} 포맷된 날짜 문자열
   */
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return dateString.replace(/-/g, '');
  };

  /**
   * 견적 의뢰 제출 핸들러
   */
  const handleQuoteRequest = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (isSingleProduct && optionValues.length > 0 && !selectedOptionValue) {
      setValidationMessage('옵션을 선택해주세요.');
      setShowValidationModal(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const quoteData = {
        reqDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        custCd: globalState.G_CUST_ID || globalState.G_USER_ID,
        contactNm: quoteForm.managerName,
        contactTel: quoteForm.contact,
        contactEmail: quoteForm.email,
        siteNm: quoteForm.address,
        dueDate: formatDate(quoteForm.deliveryDate),
        reqDesc: quoteForm.requestContent,
        mrsQtRequestSubs: currentProducts.map(item => {
          if (isSingleProduct) {
            const price = product.disPrice || product.salePrice || 0;
            return {
              itemCd: product.itemCd,
              optCd: product.optCd || '',
              optValCd: selectedOptionValue || '',
              reqQty: quantity,
              reqPrice: price,
              reqAmount: price * quantity,
              remark: ''
            };
          } else {
            return {
              itemCd: item.itemCd,
              optCd: item.optCd || '',
              optValCd: item.optValCd || '',
              reqQty: item.quantity,
              reqPrice: item.price,
              reqAmount: item.price * item.quantity,
              remark: ''
            };
          }
        })
      };
      
      // API 호출하여 견적 의뢰 전송
      await quoteAPI.createQuoteRequest(quoteData);
      
      if (isSingleProduct) {
        setSuccessMessage('견적 의뢰가 성공적으로 전송되었습니다! 견적 의뢰 내역에서 확인하실 수 있습니다.');
      } else {
        setSuccessMessage(`선택된 상품들의 견적 의뢰가 성공적으로 전송되었습니다.\n(총 ${currentProducts.length}개 상품)`);
      }
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('견적 의뢰 전송 실패:', error);
      setValidationMessage('견적 의뢰 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
      setShowValidationModal(true);
    }
  };

  /**
   * 모달 닫기 핸들러
   * 
   * @param {Event} e - 이벤트 객체
   * @param {boolean} isSuccess - 성공 여부 (장바구니 업데이트 필요 여부)
   */
  const handleClose = (e, isSuccess = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setQuantity(1);
    setShowLoginModal(false);
    setShowSuccessModal(false);
    setSuccessMessage('');
    setValidationErrors({});
    
    if (onClose) {
      // 견적 의뢰 성공 시 현재 모달에 남아있는 제품들을 전달
      if (isSuccess && !isSingleProduct) {
        onClose(currentProducts);
      } else {
        onClose(null);
      }
    }
  };

  /**
   * 백드롭 클릭 시 모달 닫기
   * 
   * @param {Event} e - 클릭 이벤트
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleClose(e);
    }
  };

  /**
   * 출하 가능일 포맷팅 함수
   * 
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열
   */
  const formatShipDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      
      if (typeof dateString === 'string') {
        if (dateString.includes('-')) {
          date = new Date(dateString);
        } else if (dateString.includes('/')) {
          date = new Date(dateString);
        } else if (dateString.length === 8) {
          const year = dateString.substring(0, 4);
          const month = dateString.substring(4, 6);
          const day = dateString.substring(6, 8);
          date = new Date(`${year}-${month}-${day}`);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[date.getDay()];
      
      return `${month}.${day} (${weekday})`;
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <div className="product-quote-modal-overlay" onClick={handleBackdropClick}>
        <div className="product-quote-modal-large">
          {/* 모달 헤더 */}
          <div className="product-quote-modal-header">
            <h3>견적 의뢰 입력</h3>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              className="product-quote-modal-close"
              type="button"
              aria-label="모달 닫기"
            >
              ×
            </button>
          </div>

          {/* 모바일: 제품 목록 플로팅 버튼 */}
          <div className="product-quote-mobile-toggle">
            <button 
              onClick={() => setShowProductsOnMobile(!showProductsOnMobile)}
              className="product-quote-mobile-products-btn"
            >
              <span>{getMobileProductsText()}</span>
              <span className="product-quote-mobile-total">{calculateGrandTotal()} 원</span>
              <span className={`product-quote-mobile-arrow ${showProductsOnMobile ? 'up' : 'down'}`}>▼</span>
            </button>
          </div>

          <div className={`product-quote-modal-body ${showProductsOnMobile ? 'mobile-products-visible' : ''}`}>
            {/* 왼쪽: 상품 정보 섹션 */}
            <div className="product-quote-products-section">
              <div className="product-quote-products-header">
                <h4>선택된 상품 ({currentProducts.length}개)</h4>
                <div className="product-quote-total-amount">
                  총 금액: <strong>{calculateGrandTotal()} 원</strong>
                </div>
              </div>
              
              {/* 제품 목록 */}
              <div className="product-quote-products-list">
                {currentProducts.map((item, index) => {
                  const currentProduct = isSingleProduct ? product : item;
                  const currentQuantity = isSingleProduct ? quantity : item.quantity;
                  
                  return (
                    <div key={isSingleProduct ? product.itemCd : item.itemCd} className="product-quote-product-item">
                      {/* 상품 메인 정보 */}
                      <div className="product-quote-item-main">
                        {/* 상품 이미지 */}
                        <div className="product-quote-item-image">
                          {currentProduct.FILEPATH || currentProduct.filePath ? (
                            <ImageWithFallback
                              src={currentProduct.FILEPATH || currentProduct.filePath}
                              alt={currentProduct.itemNm}
                              width={80}
                              height={80}
                            />
                          ) : (
                            <div className="product-quote-image-placeholder">
                              <ImageOff size={40} color="#adb5bd" strokeWidth={1.0} />
                            </div>
                          )}
                        </div>

                        {/* 상품 정보 */}
                        <div className="product-quote-item-info">
                          <h5 className="product-quote-item-name">{currentProduct.itemNm}</h5>
                          <div className="product-quote-item-details">
                            <p className="product-quote-item-code">
                              <span className="product-quote-detail-label">코드:</span>
                              <span className="product-quote-detail-value">{currentProduct.itemCd}</span>
                            </p>
                            {currentProduct.compNm && (
                              <p className="product-quote-item-company">
                                <span className="product-quote-detail-label">회사:</span>
                                <span className="product-quote-detail-value">{currentProduct.compNm}</span>
                              </p>
                            )}
                            {currentProduct.shipAvDate && (
                              <p className="product-quote-item-ship-date">
                                <span className="product-quote-detail-label">출하:</span>
                                <span className="product-quote-detail-value">{formatShipDate(currentProduct.shipAvDate)}</span>
                              </p>
                            )}
                            {!isSingleProduct && item.optValNm && (
                              <p className="product-quote-item-option">
                                <span className="product-quote-detail-label">옵션:</span>
                                <span className="product-quote-detail-value">{item.optValNm}</span>
                              </p>
                            )}
                            <div className="product-quote-item-price">
                              <span className="product-quote-detail-label">단가:</span>
                              <div className="product-quote-price-with-unit">
                                <span className="product-quote-detail-value price">
                                  {Number(currentProduct.disPrice || currentProduct.salePrice || currentProduct.price || 0).toLocaleString()} 원
                                </span>
                                {(currentProduct.unitNm || (item && item.unitNm)) && (
                                  <span className="product-quote-unit-badge">{currentProduct.unitNm || item.unitNm}</span>
                                )}
                              </div>
                            </div>
                            {currentProduct.disPrice && currentProduct.salePrice && currentProduct.disPrice !== currentProduct.salePrice && (
                              <div className="product-quote-item-original-price">
                                <span className="product-quote-detail-label">정가:</span>
                                <span className="product-quote-detail-value original">{Number(currentProduct.salePrice).toLocaleString()} 원</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 수량 및 총액 섹션 */}
                      <div className="product-quote-item-controls">
                        {/* 수량 조절 */}
                        <div className="product-quote-quantity-section">
                          <span className="product-quote-quantity-label">수량</span>
                          <div className="product-quote-quantity-controls">
                            <button 
                              onClick={() => handleQuantityChange(-1, currentProduct.itemCd)}
                              className="product-quote-quantity-btn"
                            >
                              <Minus size={12} />
                            </button>
                            <input 
                              type="number" 
                              value={currentQuantity}
                              onChange={(e) => {
                                if (isSingleProduct) {
                                  setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                                } else if (onUpdateQuantity) {
                                  const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                  const delta = newQuantity - currentQuantity;
                                  onUpdateQuantity(currentProduct.itemCd, delta);
                                }
                              }}
                              className="product-quote-quantity-input"
                              min="1"
                            />
                            <button 
                              onClick={() => handleQuantityChange(1, currentProduct.itemCd)}
                              className="product-quote-quantity-btn"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* 총액 */}
                        <div className="product-quote-item-total">
                          <span className="product-quote-total-label">총액</span>
                          <div className="product-quote-total-amount">
                            {calculateTotal(item)} 원
                          </div>
                        </div>
                        
                        {/* 여러 상품 모드에서 삭제 버튼 */}
                        {!isSingleProduct && onRemoveProduct && (
                          <div className="product-quote-item-actions">
                            <button 
                              onClick={() => onRemoveProduct(currentProduct.itemCd)}
                              className="product-quote-remove-btn"
                              title="상품 삭제"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 단일 상품인 경우에만 옵션 선택 */}
              {isSingleProduct && optionValues.length > 0 && (
                <div className="product-quote-option-section product-quote-option-row">
                  <div className="product-quote-option-header">
                    <span className="product-quote-section-title product-quote-option-label">옵션:</span>
                    {loadingOptions ? (
                      <div className="product-quote-option-loading">옵션 로드 중...</div>
                    ) : (
                      <select 
                        value={selectedOptionValue}
                        onChange={(e) => setSelectedOptionValue(e.target.value)}
                        className="product-quote-option-select"
                      >
                        {optionValues.map((option) => (
                          <option key={option.optValCd} value={option.optValCd}>
                            {option.optValNm}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽: 견적 의뢰 폼 섹션 */}
            <div className="product-quote-form-section">
              <h4>견적 요청 정보</h4>
              <div className="product-quote-form">
                <div className="product-quote-form-row">
                  <div className="product-quote-form-group">
                    <label>업체명 *</label>
                    <input
                      type="text"
                      value={quoteForm.custNm}
                      onChange={(e) => handleFormChange('custNm', e.target.value)}
                      placeholder="(주)신보"
                      className={validationErrors.custNm ? 'error' : ''}
                    />
                  </div>
                  <div className="product-quote-form-group">
                    <label>담당자명 *</label>
                    <input
                      type="text"
                      value={quoteForm.managerName}
                      onChange={(e) => handleFormChange('managerName', e.target.value)}
                      placeholder="담당자명을 입력하세요"
                      className={validationErrors.managerName ? 'error' : ''}
                    />
                  </div>
                </div>
                
                <div className="product-quote-form-row">
                  <div className="product-quote-form-group">
                    <label>연락처 *</label>
                    <input
                      type="tel"
                      value={quoteForm.contact}
                      onChange={(e) => handleFormChange('contact', e.target.value)}
                      placeholder="010-0000-0000"
                      className={validationErrors.contact ? 'error' : ''}
                    />
                  </div>
                  <div className="product-quote-form-group">
                    <label>이메일</label>
                    <input
                      type="email"
                      value={quoteForm.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                
                <div className="product-quote-form-group full-width">
                  <label>주소</label>
                  <input
                    type="text"
                    value={quoteForm.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    placeholder="주소를 입력하세요"
                  />
                </div>
                
                <div className="product-quote-form-group full-width">
                  <label>희망 납기일</label>
                  <input
                    type="date"
                    value={quoteForm.deliveryDate}
                    onChange={(e) => handleFormChange('deliveryDate', e.target.value)}
                  />
                </div>
                
                <div className="product-quote-form-group full-width">
                  <label>요청사항</label>
                  <textarea
                    value={quoteForm.requestContent}
                    onChange={(e) => handleFormChange('requestContent', e.target.value)}
                    placeholder="추가 요청사항이 있으시면 입력해주세요"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="product-quote-modal-footer">
            <button 
              className="product-quote-modal-btn cancel"
              onClick={() => handleClose()}
            >
              취소
            </button>
            <button 
              className="product-quote-modal-btn confirm"
              onClick={handleQuoteRequest}
            >
              견적 의뢰하기
            </button>
          </div>
        </div>
      </div>

      {/* 로그인 필요 모달 */}
      <Modal
        isOpen={showLoginModal}
        title="로그인 필요"
        message="견적 의뢰를 하시려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
        onConfirm={() => {
          setShowLoginModal(false);
          handleClose();
          window.location.href = '/login';
        }}
        onCancel={() => setShowLoginModal(false)}
      />
      
      {/* 성공 모달 */}
      <Modal
        isOpen={showSuccessModal}
        title="성공"
        message={successMessage}
        onConfirm={() => {
          setShowSuccessModal(false);
          handleClose(null, true); // 성공 플래그를 true로 전달
        }}
      />
      
      {/* 유효성 검증 모달 */}
      <Modal
        isOpen={showValidationModal}
        title="입력 오류"
        message={validationMessage}
        onConfirm={() => setShowValidationModal(false)}
      />
    </>
  );
};

export default ProductQuoteModal;
