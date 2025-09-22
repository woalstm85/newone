import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Calculator } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { commonAPI } from '../../services/api';
import './QuoteModal.css';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';
import ProductQuoteModal from './ProductQuoteModal';

const QuoteModal = ({ product, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [optionValues, setOptionValues] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false);
  const { globalState } = useAuth();
  
  // 모달이 열릴 때마다 상태 초기화 및 ESC 키 이벤트 추가
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setShowLoginModal(false);
      setShowSuccessModal(false);
      setSelectedOptionValue('');
      
      // 옵션값 로드
      if (product.optCd) {
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
      
      // 모달이 닫힐 때 이벤트 리스너 제거
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, product]);

  // 옵션값 로드 함수
  const loadOptionValues = async (optCd) => {
    try {
      setLoadingOptions(true);
      const options = await commonAPI.getOptionValues(optCd);
      
      if (options && Array.isArray(options)) {
        setOptionValues(options);
        // 첫 번째 옵션을 기본값으로 선택
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

  // 로그인 상태 확인
  const isLoggedIn = !!globalState.G_USER_ID;

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen || !product) return null;

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
      item.itemCd === product.itemCd && 
      item.optCd === (product.optCd || '') &&
      item.optValCd === (selectedOptionValue || '')
    );
    
    if (existingItemIndex >= 0) {
      // 이미 있는 상품이면 수량 증가
      existingCart[existingItemIndex].quantity += quantity;
      existingCart[existingItemIndex].totalAmount = existingCart[existingItemIndex].price * existingCart[existingItemIndex].quantity;
    } else {
      // 새 상품 추가
      existingCart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    console.log('업데이트된 장바구니:', existingCart);
    
    // 장바구니 업데이트 이벤트 발생 (여러 번 호출로 확실하게)
    window.dispatchEvent(new Event('cartUpdated'));
    setTimeout(() => {
      window.dispatchEvent(new Event('cartUpdated'));
    }, 100);
    
    // 성공 모달 표시
    setShowSuccessModal(true);
  };

  const handleClose = (e) => {
    // 이벤트 전파 중지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 모달 닫을 때 상태 초기화
    setQuantity(1);
    setShowLoginModal(false);
    setShowSuccessModal(false);
    
    // 부모 컴포넌트의 onClose 호출
    if (onClose) {
      onClose();
    }
  };

  // 백드롭 클릭 시 모달 닫기
  const handleBackdropClick = (e) => {
    // 오버레이 자체를 클릭한 경우에만 닫기 (컴포넌트 내부 클릭은 제외)
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      handleClose(e);
    }
  };

  // 개선된 날짜 포맷팅 함수
const formatShipDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date;
    
    // 여러 가지 날짜 형식을 시도
    if (typeof dateString === 'string') {
      // ISO 8601 형식이 아닌 경우 변환 시도
      if (dateString.includes('-')) {
        // YYYY-MM-DD 또는 YYYY-MM-DD HH:mm:ss 형식
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        // MM/DD/YYYY 또는 DD/MM/YYYY 형식
        date = new Date(dateString);
      } else if (dateString.length === 8) {
        // YYYYMMDD 형식
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
    
    // 날짜가 유효한지 확인
    if (isNaN(date.getTime())) {

      return dateString; // 원본 문자열 반환
    }
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${month}.${day} (${weekday})`;
  } catch (error) {

    return dateString; // 에러 시 원본 문자열 반환
  }
};

  return (
    <>
      <div className="quote-modal-overlay" onClick={handleBackdropClick}>
        <div className="quote-modal-container updated">
          {/* 모달 헤더 */}
          <div className="quote-modal-header">
            <h2 className="quote-modal-title">
              <ShoppingCart className="quote-modal-title-icon" />
              상품 정보
            </h2>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              className="quote-modal-close-button"
              type="button"
              aria-label="모달 닫기"
              style={{ zIndex: 10000, position: 'relative', pointerEvents: 'auto' }}
            >
              <X className="quote-modal-close-icon" />
            </button>
          </div>

          {/* 모달 컨텐츠 */}
          <div className="quote-modal-content">
            {/* 상품 정보 섹션 */}
            <div className="quote-modal-product-section">
              <div className="quote-modal-product-details">
                <div className="quote-modal-product-image">
                  <ImageWithFallback
                    src={product.FILEPATH}
                    alt={product.itemNm}
                    width={150}
                    height={150}
                  />
                </div>
                <div className="quote-modal-product-info">
                  <h4 className="quote-modal-product-name">{product.itemNm}</h4>
                  {product.compNm && (
                    <p className="quote-modal-product-code">회사명: {product.compNm}</p>
                  )}
                  {product.shipAvDate && (
                    <p className="quote-modal-product-ship-date">{formatShipDate(product.shipAvDate)} 출하</p>
                  )}
                  <div className="quote-modal-price-info">
                    <div className="quote-modal-discount-price">
                      {Number(product.disPrice || product.salePrice || 0).toLocaleString()} 원
                    </div>
                    {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && (
                      <div className="quote-modal-original-price">
                        정가: {Number(product.salePrice).toLocaleString()} 원
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 옵션 선택 */}
              {optionValues.length > 0 && (
                <div className="quote-modal-option-section">
                  <span className="quote-modal-section-title">옵션</span>
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
                <span className="quote-modal-section-title">수량</span>
                <div className="quote-modal-quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="quote-modal-quantity-button"
                  >
                    <Minus className="quote-modal-btn-icon" />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="quote-modal-quantity-input"
                    min="1"
                  />
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="quote-modal-quantity-button"
                  >
                    <Plus className="quote-modal-btn-icon" />
                  </button>
                  <span className="quote-modal-quantity-unit">개</span>
                </div>
              </div>

              {/* 총 금액 */}
              <div className="quote-modal-total-amount">
                <div className="quote-modal-total-label">
                  <ShoppingCart className="quote-modal-calculator-icon" />
                  예상 총 금액
                </div>
                <div className="quote-modal-total-price">
                  {calculateTotal()} 원
                </div>
                <p className="quote-modal-total-note">
                  * 수량에 따른 총 금액입니다.
                </p>
              </div>
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="quote-modal-actions">
            <button onClick={handleClose} className="quote-modal-action-button quote-modal-close-btn">
              닫기
            </button>
            <button onClick={handleAddToCart} className="quote-modal-action-button quote-modal-cart-button">
              <ShoppingCart className="quote-modal-btn-icon" />
              장바구니 담기
            </button>            
            <button onClick={handleQuoteRequest} className="quote-modal-action-button quote-modal-quote-button">
              <Calculator className="quote-modal-btn-icon" />
              견적의뢰
            </button>

          </div>
        </div>
      </div>

      {/* 견적의뢰 모달 */}
      <ProductQuoteModal 
        product={{
          ...product,
          optCd: product.optCd,
          disPrice: product.disPrice,
          salePrice: product.salePrice
        }}
        isOpen={showQuoteRequestModal}
        onClose={() => setShowQuoteRequestModal(false)}
      />

      {/* 로그인 필요 모달 */}
      <Modal
        isOpen={showLoginModal}
        title="로그인 필요"
        message="장바구니 담기를 하시려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
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
        message={`상품이 장바구니에 성공적으로 추가되었습니다! (수량: ${quantity}개)`}
        onConfirm={() => {
          setShowSuccessModal(false);
          handleClose();
        }}
      />
    </>
  );
};

export default QuoteModal;