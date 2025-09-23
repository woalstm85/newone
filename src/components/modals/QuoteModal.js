import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Minus, ShoppingCart, Calculator } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import { useAuth } from '../../context/AuthContext';
import { commonAPI } from '../../services/api';
import './QuoteModal.css';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';
import ProductQuoteModal from './ProductQuoteModal';

const QuoteModal = ({ product, isOpen, onClose }) => {
  console.log('QuoteModal 렌더링:', { product, isOpen, onClose });
  
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [optionValues, setOptionValues] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false);
  
  // showQuoteRequestModal 상태 변경 모니터링
  useEffect(() => {
    console.log('showQuoteRequestModal 상태 변경:', showQuoteRequestModal);
  }, [showQuoteRequestModal]);
  const { globalState } = useAuth();
  
  // 이전에 로드한 optCd를 추적
  const loadedOptCdRef = useRef(null);
  // API 호출 중복 방지
  const isLoadingRef = useRef(false);
  
  // 옵션값 로드 함수
  const loadOptionValues = useCallback(async (optCd) => {
    // 이미 로딩 중이거나 같은 optCd면 중복 호출 방지
    if (isLoadingRef.current || loadedOptCdRef.current === optCd) {
      console.log('API 호출 건너뜀:', { 로딩중: isLoadingRef.current, 이미로드됨: loadedOptCdRef.current === optCd });
      return;
    }
    
    console.log('옵션값 API 호출 시작:', optCd);
    isLoadingRef.current = true;
    
    try {
      setLoadingOptions(true);
      const options = await commonAPI.getOptionValues(optCd);
      
      console.log('옵션값 API 응답:', options);
      
      if (options && Array.isArray(options)) {
        setOptionValues(options);
        // 첫 번째 옵션을 기본값으로 선택
        if (options.length > 0) {
          setSelectedOptionValue(options[0].optValCd);
        }
      } else {
        setOptionValues([]);
        setSelectedOptionValue('');
      }
      
      // 성공적으로 로드된 optCd 저장
      loadedOptCdRef.current = optCd;
      
    } catch (error) {
      console.error('옵션값 로드 실패:', error);
      setOptionValues([]);
      setSelectedOptionValue('');
    } finally {
      setLoadingOptions(false);
      isLoadingRef.current = false;
      console.log('옵션값 API 호출 완료');
    }
  }, []);
  
  // 모달 상태 초기화
  useEffect(() => {
    if (isOpen && product) {
      console.log('모달 열림:', { itemCd: product.itemCd, optCd: product.optCd });
      
      // 기본 상태 초기화
      setQuantity(1);
      setShowLoginModal(false);
      setShowSuccessModal(false);
      setSelectedOptionValue('');
      
      // 옵션 처리
      const currentOptCd = product.optCd || null;
      
      if (currentOptCd && loadedOptCdRef.current !== currentOptCd) {
        // 새로운 옵션 코드 - 로드 필요
        console.log('새로운 옵션 코드 감지:', currentOptCd);
        setOptionValues([]);
        loadOptionValues(currentOptCd);
      } else if (!currentOptCd) {
        // 옵션이 없는 상품
        console.log('옵션 없는 상품');
        setOptionValues([]);
        setSelectedOptionValue('');
        loadedOptCdRef.current = null;
      }
      
      // ESC 키 이벤트
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
    
    if (!isOpen) {
      // 모달이 닫히면 초기화
      loadedOptCdRef.current = null;
      isLoadingRef.current = false;
    }
  }, [isOpen, product?.itemCd, loadOptionValues]);

  // 로그인 상태 확인
  const isLoggedIn = !!globalState.G_USER_ID;

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen || !product) {
    console.log('모달 렌더링 안함:', { isOpen, product: !!product });
    return null;
  }
  
  console.log('모달 렌더링 시작!');

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const calculateTotal = () => {
    // disPrice 또는 salePrice 사용
    const price = product.disPrice || product.salePrice || 0;
    return (price * quantity).toLocaleString();
  };

  // 견적의뢰 버튼 클릭 핸들러
  const handleQuoteRequest = () => {
    console.log('견적의뢰 버튼 클릭됨');
    
    // 로그인 체크
    if (!isLoggedIn) {
      console.log('로그인 필요');
      setShowLoginModal(true);
      return;
    }

    // 옵션값 선택 체크
    if (optionValues.length > 0 && !selectedOptionValue) {
      console.log('옵션 선택 필요');
      alert('옵션을 선택해주세요.');
      return;
    }

    console.log('견적의뢰 모달 열기');
    // 견적의뢰 모달 열기
    setShowQuoteRequestModal(true);
  };

  const handleAddToCart = () => {
    // 로그인 체크
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 옵션값 선택 체크
    if (optionValues.length > 0 && !selectedOptionValue) {
      alert('옵션을 선택해주세요.');
      return;
    }

    // 로그인된 상태에서 장바구니 담기 처리
    const price = product.disPrice || product.salePrice || 0;
    const selectedOption = optionValues.find(opt => opt.optValCd === selectedOptionValue);
    
    console.log('대시보드 장바구니 추가 데이터:', {
      product,
      selectedOption,
      selectedOptionValue,
      price
    });
    
    const cartItem = {
      itemCd: product.itemCd,
      itemNm: product.itemNm,
      optCd: product.optCd || '',
      optValCd: selectedOptionValue || '',
      optValNm: selectedOption ? selectedOption.optValNm : '',
      price: price,
      outUnitPrice: price, // 동일한 가격 정보
      quantity: quantity,
      filePath: product.FILEPATH,
      totalAmount: price * quantity
    };
    
    console.log('준비된 카트 아이템:', cartItem);
    
    // 장바구니에 상품 추가 (localStorage 사용)
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex(item => 
      item.itemCd === cartItem.itemCd && item.optValCd === cartItem.optValCd
    );
    
    if (existingItemIndex >= 0) {
      // 기존 상품이 있으면 수량 업데이트
      existingCart[existingItemIndex].quantity += cartItem.quantity;
      existingCart[existingItemIndex].totalAmount = 
        existingCart[existingItemIndex].price * existingCart[existingItemIndex].quantity;
    } else {
      // 새 상품 추가
      existingCart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    // 성공 메시지 모달 표시
    setShowSuccessModal(true);
  };

  const handleClose = () => {
    onClose();
  };

  const formatShipDate = (dateString) => {
    if (!dateString) return '';
    
    // YYYYMMDD 형식을 YYYY.MM.DD 형식으로 변환
    if (dateString.length === 8) {
      const year = dateString.substr(0, 4);
      const month = dateString.substr(4, 2);
      const day = dateString.substr(6, 2);
      return `${year}.${month}.${day}`;
    }
    
    return dateString;
  };

  const handleBackdropClick = (e) => {
    // 오버레이 클릭시에만 닫기 (모달 내부 클릭은 무시)
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <div className="quote-modal-overlay" onClick={handleBackdropClick} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}>
        <div className="quote-modal-container updated" style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          maxWidth: '800px',
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 100000
        }}>
          {/* 모달 헤더 */}
          <div className="quote-modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            background: '#f8f9fa',
            borderBottom: '1px solid #e9ecef'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#333' }}>상품 정보</h2>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              className="quote-modal-close-button"
              type="button"
              aria-label="모달 닫기"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                color: '#6c757d',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 모달 콘텐츠 */}
          <div className="quote-modal-content" style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden'
          }}>
            {/* 이미지 섹션 */}
            <div className="quote-modal-image-section" style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: '#f8f9fa'
            }}>
              <div className="quote-modal-image-container" style={{
                position: 'relative',
                width: '100%',
                maxWidth: '300px',
                height: 'auto',
                minHeight: '200px',
                maxHeight: '280px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {product.FILEPATH ? (
                  <ImageWithFallback
                    src={product.FILEPATH}
                    alt={product.itemNm}
                    className="quote-modal-product-image"
                    width={300}
                    height={300}
                  />
                ) : (
                  <div className="quote-modal-no-image">
                    <CiImageOff size={64} color="#ccc" />
                    <span>이미지 없음</span>
                  </div>
                )}
              </div>
            </div>

            {/* 정보 섹션 */}
            <div className="quote-modal-details-section">
              <div className="quote-modal-details">
                <h3 className="quote-modal-product-name">{product.itemNm}</h3>
                
                {/* 기본 정보 */}
                <div className="quote-modal-product-basic">
                  {product.compNm && (
                    <div className="quote-modal-product-row">
                      <span className="quote-modal-product-label">회사명:</span>
                      <span className="quote-modal-product-value">{product.compNm}</span>
                    </div>
                  )}
                  
                  {product.shipAvDate && (
                    <div className="quote-modal-product-row">
                      <span className="quote-modal-product-label">출하일:</span>
                      <span className="quote-modal-product-value">{formatShipDate(product.shipAvDate)}</span>
                    </div>
                  )}
                  
                  <div className="quote-modal-product-row">
                    <span className="quote-modal-product-label">가격:</span>
                    <span className="quote-modal-product-value price">
                      {Number(product.disPrice || product.salePrice || 0).toLocaleString()}원
                    </span>
                  </div>
                  
                  {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && (
                    <div className="quote-modal-product-row">
                      <span className="quote-modal-product-label">정가:</span>
                      <span className="quote-modal-product-value">{Number(product.salePrice).toLocaleString()}원</span>
                    </div>
                  )}
                </div>

                {/* 옵션 선택 */}
                {optionValues.length > 0 && (
                  <div className="quote-modal-option-section">
                    <span className="quote-modal-option-label">옵션:</span>
                    {loadingOptions ? (
                      <div className="quote-modal-option-loading">옵션 로드 중...</div>
                    ) : (
                      <select 
                        value={selectedOptionValue}
                        onChange={(e) => setSelectedOptionValue(e.target.value)}
                        className="quote-modal-option-select"
                      >
                        {optionValues.map((option) => (
                          <option key={option.optValCd} value={option.optValCd}>
                            {option.optValNm}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* 수량 선택 */}
                <div className="quote-modal-quantity-section">
                  <label className="quote-modal-quantity-label">수량:</label>
                  <div className="quote-modal-quantity-controls">
                    <button 
                      className="quote-modal-quantity-button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="quote-modal-quantity-input"
                      min="1"
                    />
                    <button 
                      className="quote-modal-quantity-button"
                      onClick={() => handleQuantityChange(1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* 총 금액 */}
                <div className="quote-modal-total-amount">
                  <span className="quote-modal-total-label">총 금액:</span>
                  <span className="quote-modal-total-price">
                    {calculateTotal()} 원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="quote-modal-actions">
            <button onClick={handleAddToCart} className="quote-modal-action-button quote-modal-cart-button">
              <ShoppingCart size={18} />
              장바구니 담기
            </button>            
            <button onClick={handleQuoteRequest} className="quote-modal-action-button quote-modal-quote-button">
              <Calculator size={18} />
              견적의뢰
            </button>
          </div>
        </div>
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <Modal onClose={() => setShowLoginModal(false)}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>로그인이 필요한 서비스입니다</h3>
            <p>장바구니 및 견적의뢰를 위해서는 로그인이 필요합니다.</p>
            <button onClick={() => setShowLoginModal(false)}>확인</button>
          </div>
        </Modal>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <Modal onClose={() => setShowSuccessModal(false)}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>장바구니에 담았습니다</h3>
            <p>상품이 성공적으로 장바구니에 추가되었습니다.</p>
            <button onClick={() => setShowSuccessModal(false)}>확인</button>
          </div>
        </Modal>
      )}

      {/* 견적의뢰 모달 */}
      {showQuoteRequestModal && (
        <>
          {console.log('ProductQuoteModal 렌더링 시도:', {
            showQuoteRequestModal,
            product: product?.itemNm,
            selectedProducts: [{
              itemCd: product.itemCd,
              itemNm: product.itemNm,
              optCd: product.optCd || '',
              optValCd: selectedOptionValue || '',
              optValNm: optionValues.find(opt => opt.optValCd === selectedOptionValue)?.optValNm || '',
              price: product.disPrice || product.salePrice || 0,
              quantity: quantity,
              filePath: product.FILEPATH,
              totalAmount: (product.disPrice || product.salePrice || 0) * quantity
            }]
          })}
          <ProductQuoteModal
            product={product}
            isOpen={showQuoteRequestModal}
            onClose={() => {
              console.log('ProductQuoteModal 닫기');
              setShowQuoteRequestModal(false);
            }}
            selectedProducts={[{
              itemCd: product.itemCd,
              itemNm: product.itemNm,
              optCd: product.optCd || '',
              optValCd: selectedOptionValue || '',
              optValNm: optionValues.find(opt => opt.optValCd === selectedOptionValue)?.optValNm || '',
              price: product.disPrice || product.salePrice || 0,
              quantity: quantity,
              filePath: product.FILEPATH,
              totalAmount: (product.disPrice || product.salePrice || 0) * quantity
            }]}
          />
        </>
      )}
    </>
  );
};

export default QuoteModal;
