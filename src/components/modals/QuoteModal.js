/**
 * QuoteModal.js
 * 제품 상세 정보 및 견적/장바구니 기능을 제공하는 모달 컴포넌트
 * 
 * 주요 기능:
 * - 제품 상세 정보 표시 (이미지, 가격, 옵션 등)
 * - 수량 조절
 * - 옵션 선택
 * - 장바구니 담기
 * - 견적 의뢰
 * - 반응형 레이아웃 (모바일/데스크톱)
 */

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

/**
 * 모바일 환경 감지 커스텀 훅
 * 화면 크기가 768px 이하일 경우 모바일로 판단
 * 
 * @returns {boolean} 모바일 여부
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

/**
 * QuoteModal 컴포넌트
 * 
 * @param {Object} product - 표시할 제품 정보
 * @param {boolean} isOpen - 모달 열림/닫힘 상태
 * @param {Function} onClose - 모달 닫기 콜백 함수
 */
const QuoteModal = ({ product, isOpen, onClose }) => {
  const isMobile = useIsMobile(); // 모바일 감지
  
  // 상태 관리
  const [quantity, setQuantity] = useState(1); // 선택 수량
  const [showLoginModal, setShowLoginModal] = useState(false); // 로그인 모달 표시 여부
  const [optionValues, setOptionValues] = useState([]); // 옵션 목록
  const [selectedOptionValue, setSelectedOptionValue] = useState(''); // 선택된 옵션
  const [loadingOptions, setLoadingOptions] = useState(false); // 옵션 로딩 상태
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false); // 견적의뢰 모달 표시 여부
  
  // 전역 상태 및 네비게이션
  const { globalState } = useAuth();
  const navigate = useNavigate();
  
  // 중복 로딩 방지를 위한 ref
  const loadedOptCdRef = useRef(null); // 이전에 로드한 옵션 코드
  const isLoadingRef = useRef(false); // API 호출 중복 방지 플래그
  
  /**
   * 옵션값 로드 함수
   * 중복 API 호출을 방지하고 제품의 옵션 목록을 가져옴
   * 
   * @param {string} optCd - 옵션 코드
   */
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
  
  /**
   * 모달이 열릴 때마다 상태 초기화 및 옵션 로드
   */
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
      
      // ESC 키로 모달 닫기 이벤트
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
    
    // 모달이 닫히면 초기화
    if (!isOpen) {
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

  /**
   * 수량 변경 핸들러
   * 최소 수량은 1로 제한
   * 
   * @param {number} delta - 변경할 수량 (양수: 증가, 음수: 감소)
   */
  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  /**
   * 총 금액 계산
   * 할인가가 있으면 할인가 사용, 없으면 판매가 사용
   * 
   * @returns {string} 천단위 구분된 총 금액 문자열
   */
  const calculateTotal = () => {
    const price = product.disPrice || product.salePrice || 0;
    return (price * quantity).toLocaleString();
  };

  /**
   * 견적의뢰 버튼 클릭 핸들러
   * 로그인 및 옵션 선택 여부를 확인한 후 견적의뢰 모달 열기
   */
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

  /**
   * 장바구니 담기 핸들러
   * 로그인 및 옵션 선택 확인 후 장바구니에 상품 추가
   * localStorage를 사용하여 장바구니 데이터 저장
   */
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
      // 장바구니 상품 데이터 구성
      const price = product.disPrice || product.salePrice || 0;
      const selectedOption = optionValues.find(opt => opt.optValCd === selectedOptionValue);
      
      const cartItem = {
        itemCd: product.itemCd,
        itemNm: product.itemNm,
        optCd: product.optCd || '',
        optValCd: selectedOptionValue || '',
        optValNm: selectedOption ? selectedOption.optValNm : '',
        price: price,
        outUnitPrice: price,
        quantity: quantity,
        filePath: product.FILEPATH,
        totalAmount: price * quantity,
        source: product.isSurplus ? 'surplus' : (product.isEvent ? 'event' : 'general')
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

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * 출하 가능일 포맷팅
   * YYYYMMDD 형식을 MM.DD (요일) 형식으로 변환
   * 
   * @param {string} dateString - YYYYMMDD 형식의 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열 (예: "03.15 (금)")
   */
  const formatShipDate = (dateString) => {
    if (!dateString) return '';
    
    // YYYYMMDD 형식을 MM.DD (요일) 형식으로 변환
    if (dateString.length === 8) {
      const year = parseInt(dateString.substr(0, 4));
      const month = parseInt(dateString.substr(4, 2));
      const day = parseInt(dateString.substr(6, 2));
      
      // Date 객체 생성
      const date = new Date(year, month - 1, day);
      
      // 요일 배열 (한국어)
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[date.getDay()];
      
      // MM.DD (요일) 형식으로 반환
      const formattedMonth = month.toString().padStart(2, '0');
      const formattedDay = day.toString().padStart(2, '0');
      
      return `${formattedMonth}.${formattedDay} (${weekday})`;
    }
    
    return dateString;
  };

  /**
   * 백드롭 클릭 핸들러
   * 모달 외부(오버레이) 클릭 시 모달 닫기
   * 
   * @param {Event} e - 클릭 이벤트
   */
  const handleBackdropClick = (e) => {
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

          {/* 모달 콘텐츠 - 반응형 레이아웃 */}
          {isMobile ? (
            // 모바일 레이아웃: 상단(이미지+기본정보) + 하단(옵션/수량/총금액)
            <div className="quote-modal-scrollable-content">
              {/* 상단 영역: 이미지(왼쪽) + 기본정보(오른쪽) */}
              <div className="quote-modal-top-section">
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
                        <CiImageOff size={48} color="#ccc" />
                        <span>이미지 없음</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 기본 정보 섹션 */}
                <div className="quote-modal-basic-info-section">
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
                      <div className="quote-modal-product-row quote-modal-delivery-row">
                        <span className="quote-modal-delivery-badge">🚚 {formatShipDate(product.shipAvDate)} 출하가능</span>
                      </div>
                    )}
                    
                    {product.unitNm && (
                      <div className="quote-modal-product-row">
                        <span className="quote-modal-product-unit-badge">{product.unitNm}</span>
                      </div>
                    )}
                    
                    {(product.disPrice > 0 || product.salePrice > 0) && (
                      <>
                        <div className="quote-modal-product-row">
                          <span className="quote-modal-product-label">가격:</span>
                          <span className="quote-modal-product-value price">
                            {Number(product.disPrice || product.salePrice).toLocaleString()}원
                          </span>
                        </div>
                        
                        {product.disPrice > 0 && product.salePrice > 0 && product.disPrice !== product.salePrice && (
                          <div className="quote-modal-product-row">
                            <span className="quote-modal-product-label">정가:</span>
                            <span className="quote-modal-product-value" style={{ textDecoration: 'line-through', color: '#999' }}>{Number(product.salePrice).toLocaleString()}원</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 하단 영역: 옵션/수량/총금액 */}
              <div className="quote-modal-bottom-section">
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
          ) : (
            // 데스크톱 레이아웃: 기존 가로 배치
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
                    <div className="quote-modal-product-row quote-modal-delivery-row">
                      <span className="quote-modal-delivery-badge">🚚 {formatShipDate(product.shipAvDate)} 출하가능</span>
                    </div>
                  )}
                  
                  {product.unitNm && (
                    <div className="quote-modal-product-row">
                      <span className="quote-modal-product-unit-badge">{product.unitNm}</span>
                    </div>
                  )}
                  
                  {(product.disPrice > 0 || product.salePrice > 0) && (
                    <>
                      <div className="quote-modal-product-row">
                        <span className="quote-modal-product-label">가격:</span>
                        <span className="quote-modal-product-value price">
                          {Number(product.disPrice || product.salePrice).toLocaleString()}원
                        </span>
                      </div>
                      
                      {product.disPrice > 0 && product.salePrice > 0 && product.disPrice !== product.salePrice && (
                        <div className="quote-modal-product-row">
                          <span className="quote-modal-product-label">정가:</span>
                          <span className="quote-modal-product-value" style={{ textDecoration: 'line-through', color: '#999' }}>{Number(product.salePrice).toLocaleString()}원</span>
                        </div>
                      )}
                    </>
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
          )}

          {/* 모달 푸터 - 액션 버튼들 */}
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

      {/* 로그인 필요 모달 */}
      {showLoginModal && (
        <Modal 
          isOpen={showLoginModal}
          title="로그인 필요"
          message={`장바구니 및 견적의뢰를 위해서는 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?`}
          onConfirm={() => {
            setShowLoginModal(false);
            onClose();
            navigate('/login');
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

      {/* 견적의뢰 모달 */}
      {showQuoteRequestModal && (
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
      )}
    </>
  );
};

export default QuoteModal;
