import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Minus, ShoppingCart, Calculator } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { commonAPI } from '../../services/api';
import './QuoteModal.css';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';
import ProductQuoteModal from './ProductQuoteModal';
import { toast } from 'react-toastify';

const QuoteModal = ({ product, isOpen, onClose }) => {
  
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [optionValues, setOptionValues] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false);
  
  // showQuoteRequestModal 상태 변경 모니터링
  useEffect(() => {

  }, [showQuoteRequestModal]);
  const { globalState } = useAuth();
  const navigate = useNavigate();
  
  // 이전에 로드한 optCd를 추적
  const loadedOptCdRef = useRef(null);
  // API 호출 중복 방지
  const isLoadingRef = useRef(false);
  
  // 옵션값 로드 함수
  const loadOptionValues = useCallback(async (optCd) => {
    // 이미 로딩 중이거나 같은 optCd면 중복 호출 방지
    if (isLoadingRef.current || loadedOptCdRef.current === optCd) {

      return;
    }

    isLoadingRef.current = true;
    
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

    }
  }, []);
  
  // 모달 상태 초기화
  useEffect(() => {
    if (isOpen && product) {
      
      // 기본 상태 초기화
      setQuantity(1);
      setShowLoginModal(false);
      setSelectedOptionValue('');
      
      // 옵션 처리
      const currentOptCd = product.optCd || null;
      
      if (currentOptCd && loadedOptCdRef.current !== currentOptCd) {
        // 새로운 옵션 코드 - 로드 필요

        setOptionValues([]);
        loadOptionValues(currentOptCd);
      } else if (!currentOptCd) {
        // 옵션이 없는 상품

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

    return null;
  }


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
      toast.error('옵션을 선택해주세요.');
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
      toast.error('옵션을 선택해주세요.');
      return;
    }

    try {
      // 로그인된 상태에서 장바구니 담기 처리
      const price = product.disPrice || product.salePrice || 0;
      const selectedOption = optionValues.find(opt => opt.optValCd === selectedOptionValue);
      
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
      
      // 장바구니에 상품 추가 (localStorage 사용)
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => 
        item.itemCd === cartItem.itemCd && item.optValCd === cartItem.optValCd
      );
      
      let isNewItem = true;
      if (existingItemIndex >= 0) {
        // 기존 상품이 있으면 수량 업데이트
        existingCart[existingItemIndex].quantity += cartItem.quantity;
        existingCart[existingItemIndex].totalAmount = 
          existingCart[existingItemIndex].price * existingCart[existingItemIndex].quantity;
        isNewItem = false;
      } else {
        // 새 상품 추가
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // Toast 성공 알림 표시
      const optionText = selectedOption ? ` (옵션: ${selectedOption.optValNm})` : '';
      const actionText = isNewItem ? '추가되었습니다' : '수량이 업데이트되었습니다';
      
      toast.success(
        `🛒 ${product.itemNm}${optionText}\n${quantity}개 ${actionText}\n총 ${existingCart.length}개 상품`, 
        {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            fontSize: '16px',
            minWidth: '350px',
            padding: '16px',
            fontWeight: '500'
          }
        }
      );
      
      // 모달 닫기
      handleClose();
      
    } catch (error) {
      console.error('장바구니 추가 오류:', error);
      toast.error('장바구니 추가 중 오류가 발생했습니다.');
    }
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
      <div className="quote-modal-overlay" onClick={handleBackdropClick}>
        <div className="quote-modal-container updated">
          {/* 모달 헤더 */}
          <div className="quote-modal-header">
            <h2>상품 정보</h2>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose(e);
              }}
              className="quote-modal-close-button"
              type="button"
              aria-label="모달 닫기"
            >
              <X size={20} />
            </button>
          </div>

          {/* 모달 콘텐츠 - 전체 스크롤 */}
          <div className="quote-modal-scrollable-content">
            {/* 이미지 섹션 */}
            <div className="quote-modal-image-section">
              <div className="quote-modal-image-container">
                {product.FILEPATH ? (
                  <ImageWithFallback
                    src={product.FILEPATH}
                    alt={product.itemNm}
                    className="quote-modal-product-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
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

          {/* 모달 푸터 - 고정 */}
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
        <Modal 
          isOpen={showLoginModal}
          title="로그인 필요"
          message={`장바구니 및 견적의뢰를 위해서는 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?`}
          onConfirm={() => {
            setShowLoginModal(false);
            onClose(); // 모달 닫기
            navigate('/login'); // 로그인 페이지로 이동
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      )}



      {/* 견적의뢰 모달 */}
      {showQuoteRequestModal && (
        <>
          <ProductQuoteModal
            product={product}
            isOpen={showQuoteRequestModal}
            onClose={() => {
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
