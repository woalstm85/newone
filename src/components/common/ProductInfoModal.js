/**
 * ProductInfoModal.js - 상품 상세 정보 모달
 * 
 * 주요 기능:
 * 1. 상품 상세 정보 표시 (이미지, 제품코드, 단가, 스펙 등)
 * 2. 상품 옵션 선택 (옵션 코드에 따라 동적 로드)
 * 3. 수량 선택 (증감 버튼)
 * 4. 총 금액 자동 계산
 * 5. 장바구니 담기 기능 (거래처별 분리)
 * 6. 견적의뢰 기능
 * 7. 이미지 확대 보기 (ImageModal 연동)
 * 8. 로그인 체크 (미로그인 시 로그인 모달 표시)
 * 9. 반응형 디자인 (모바일/데스크톱 레이아웃 분리)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ShoppingCart, Eye, Plus, Minus, Calculator } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import ImageModal from './ImageModal';
import { commonAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import ProductQuoteModal from '../modals/ProductQuoteModal';
import { toast } from 'react-toastify';
import { addToCart } from '../../utils/cartUtils';
import './ProductInfoModal.css';

/**
 * 모바일 감지 커스텀 훅
 * 화면 크기 변경 감지하여 768px 이하일 때 모바일로 판단
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

const ProductInfoModal = ({ 
  isOpen, 
  onClose, 
  product,
  onAddToCart
}) => {
  const isMobile = useIsMobile();
  
  // 상태 관리
  const [quantity, setQuantity] = useState(1);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '', alt: '' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false);
  
  // 옵션값 관련 상태
  const [optionValues, setOptionValues] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  const { globalState } = useAuth();
  const navigate = useNavigate();
  
  // 중복 로딩 방지를 위한 ref
  const loadedOptCdRef = useRef(null);
  const isLoadingRef = useRef(false);
  
  // 로그인 상태 확인
  const isLoggedIn = !!globalState.G_USER_ID;

  /**
   * 옵션 코드 유효성 검사
   * optCd가 없거나 'OP0000'일 경우 false 반환
   */
  const isValidOptionCode = (optCd) => {
    // optCd가 없거나, 빈 문자열이거나, 'OP0000'이면 false
    if (!optCd || optCd.trim() === '' || optCd === 'OP0000') {
      return false;
    }
    return true;
  };

  /**
   * 옵션값 로드 함수
   * 동일한 optCd에 대한 중복 로딩 방지
   */
  const loadOptionValues = useCallback(async (optCd) => {
    // optCd가 없거나 OP0000이면 로드하지 않음
    if (!isValidOptionCode(optCd) || isLoadingRef.current || loadedOptCdRef.current === optCd) {
      return;
    }

    isLoadingRef.current = true;
    
    try {
      setLoadingOptions(true);
      const options = await commonAPI.getOptionValues(optCd);
      
      if (options && Array.isArray(options)) {
        setOptionValues(options);
        if (options.length > 0) {
          const defaultOption = options.find(opt => opt.optValNm === '해당없음') || options[0];
          setSelectedOptionValue(defaultOption.optValCd);
        } else {
          setOptionValues([]);
          setSelectedOptionValue('');
        }
      } else {
        setOptionValues([]);
        setSelectedOptionValue('');
      }
      
      loadedOptCdRef.current = optCd;
      
    } catch (error) {
      setOptionValues([]);
      setSelectedOptionValue('');
    } finally {
      setLoadingOptions(false);
      isLoadingRef.current = false;
    }
  }, []);
  
  /**
   * 모달 열릴 때 초기화 및 옵션 로드
   * ESC 키 이벤트 리스너 등록
   */
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setShowLoginModal(false);
      setSelectedOptionValue('');
      setLoadingOptions(false);
      
      const currentOptCd = product.optCd || null;
      
      // 유효한 옵션 코드가 있을 때만 로드
      if (isValidOptionCode(currentOptCd) && loadedOptCdRef.current !== currentOptCd) {
        setOptionValues([]);
        loadOptionValues(currentOptCd);
      } else {
        setOptionValues([]);
        setSelectedOptionValue('');
        setLoadingOptions(false);
        loadedOptCdRef.current = null;
      }
      
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
    
    if (!isOpen) {
      loadedOptCdRef.current = null;
      isLoadingRef.current = false;
      setLoadingOptions(false);
    }
  }, [isOpen, product?.itemCd, loadOptionValues]);

  /**
   * 수량 변경 (최소 1개)
   */
  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };
  
  /**
   * 총 금액 계산
   */
  const calculateTotal = () => {
    const price = product.outUnitPrice || 0;
    return (price * quantity).toLocaleString();
  };

  /**
   * 이미지 클릭 핸들러
   */
  const handleImageClick = () => {
    if (product?.filePath || product?.thFilePath) {
      setSelectedImage({
        url: product.filePath || product.thFilePath,
        title: product.itemNm || '상품 이미지',
        alt: `${product.itemCd || ''} ${product.itemNm || ''} 상품 이미지`
      });
      setIsImageModalOpen(true);
    }
  };
  
  /**
   * 견적의뢰 버튼 클릭 핸들러
   */
  const handleQuoteRequest = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 유효한 옵션 코드가 있고 옵션 값이 로드되었을 때만 선택 체크
    if (isValidOptionCode(product.optCd) && optionValues.length > 0 && !selectedOptionValue) {
      toast.error('옵션을 선택해주세요.');
      return;
    }

    setShowQuoteRequestModal(true);
  };

  /**
   * 장바구니 추가 핸들러
   * 거래처별 장바구니 저장
   */
  const handleAddToCart = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 유효한 옵션 코드가 있고 옵션 값이 로드되었을 때만 선택 체크
    if (isValidOptionCode(product.optCd) && optionValues.length > 0 && !selectedOptionValue) {
      toast.error('옵션을 선택해주세요.');
      return;
    }

    const selectedOption = optionValues.find(opt => opt.optValCd === selectedOptionValue);
    const custCd = globalState.G_CUST_CD || '';
    
    // source 결정: isSurplus, isEvent 플래그 또는 source 필드 기반
    let source = 'general';
    if (product.source) {
      source = product.source;
    } else if (product.isSurplus) {
      source = 'surplus';
    } else if (product.isEvent) {
      source = 'event';
    }
    
    // cartUtils를 사용하여 거래처별 장바구니에 추가
    const success = addToCart(custCd, {
      itemCd: product.itemCd,
      itemNm: product.itemNm,
      compNm: product.compNm,
      price: product.outUnitPrice || 0,
      quantity: quantity,
      totalAmount: (product.outUnitPrice || 0) * quantity,
      filePath: product.filePath || product.thFilePath,
      unitNm: product.unitNm,
      optCd: product.optCd || '',
      optValCd: selectedOptionValue || '',
      optValNm: selectedOption?.optValNm || '',
      source: source,
      shipAvDate: product.shipAvDate
    });
    
    if (success) {
      toast.success('장바구니에 추가되었습니다.');
      
      // onAddToCart 콜백이 있으면 호출 (하위 호환성)
      if (onAddToCart) {
        onAddToCart({
          ...product,
          quantity: quantity,
          optValCd: selectedOptionValue,
          optValNm: selectedOption?.optValNm || ''
        });
      }
    } else {
      toast.error('장바구니 추가에 실패했습니다.');
    }
  };

  /**
   * 모달 닫기 및 상태 초기화
   */
  const handleClose = () => {
    setQuantity(1);
    setSelectedOptionValue('');
    setOptionValues([]);
    onClose();
  };

  if (!isOpen || !product) return null;

  /**
   * 배경 클릭으로 모달 닫기
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <div className="product-info-modal-overlay" onClick={handleBackdropClick}>
        <div className="product-info-modal-container" onClick={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <div className="product-info-modal-header">
            <h2>상품 정보</h2>
            <button 
              className="product-info-modal-close-btn" 
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 콘텐츠 - 모바일/데스크톱 조건부 렌더링 */}
          {isMobile ? (
            // 모바일 레이아웃
            <div className="product-info-modal-content mobile-scrollable-content">
              
              {/* 상단 영역 */}
              <div className="product-info-mobile-top-section">
                
                {/* 이미지 섹션 */}
                <div className="product-info-image-section-mobile">
                  <div className="product-info-image-container-mobile">
                    {product.filePath || product.thFilePath ? (
                      <>
                        <img 
                          src={product.filePath || product.thFilePath}
                          alt={product.itemNm}
                          className="product-info-image"
                        />
                        <div className="product-info-image-overlay">
                          <button 
                            className="product-info-zoom-btn"
                            onClick={handleImageClick}
                          >
                            <Eye size={16} />
                            확대보기
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="product-info-no-image-mobile">
                        <CiImageOff size={48} color="#ccc" />
                      </div>
                    )}
                  </div>
                </div>

                {/* 기본 정보 섹션 */}
                <div className="product-info-basic-section-mobile">
                  {product.itemCd && (
                    <div className="product-info-code">{product.itemCd}</div>
                  )}
                  
                  <h3 className="product-info-title-mobile">{product.itemNm}</h3>
                  
                  <div className="product-info-basic">
                    {product.unitNm && (
                      <div className="product-info-row">
                        <span className="product-info-label">단위:</span>
                        <span className="product-info-value">{product.unitNm}</span>
                      </div>
                    )}
                    
                    {product.spec && (
                      <div className="product-info-row">
                        <span className="product-info-label">스펙:</span>
                        <span className="product-info-value">{product.spec}</span>
                      </div>
                    )}
                    
                    {product.outUnitPrice !== undefined && product.outUnitPrice !== null && (
                      <div className="product-info-row">
                        <span className="product-info-label">출고단가:</span>
                        <span className="product-info-value price">
                          {product.outUnitPrice.toLocaleString()}원
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 하단 영역 */}
              <div className="product-info-mobile-bottom-section">
                
                {/* 옵션값 선택 - 유효한 옵션 코드일 때만 표시 */}
                {isValidOptionCode(product.optCd) && optionValues.length > 0 && (
                  <div className="product-info-option">
                    <span className="product-info-option-label">옵션:</span>
                    {loadingOptions ? (
                      <div className="product-info-option-loading">옵션 로드 중...</div>
                    ) : (
                      <select 
                        value={selectedOptionValue}
                        onChange={(e) => setSelectedOptionValue(e.target.value)}
                        className="product-info-option-select"
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
                <div className="product-info-quantity">
                  <label className="product-info-quantity-label">수량:</label>
                  <div className="product-info-quantity-controls">
                    <button 
                      className="product-info-quantity-btn"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="product-info-quantity-input"
                      min="1"
                    />
                    <button 
                      className="product-info-quantity-btn"
                      onClick={() => handleQuantityChange(1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* 총 금액 */}
                {product.outUnitPrice !== undefined && product.outUnitPrice !== null && (
                  <div className="product-info-total">
                    <span className="product-info-total-label">총 금액:</span>
                    <span className="product-info-total-price">
                      {calculateTotal()}원
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 데스크톱 레이아웃
            <div className="product-info-modal-content">
              {/* 이미지 섹션 */}
              <div className="product-info-image-section">
                <div className="product-info-image-container">
                  {product.filePath || product.thFilePath ? (
                    <>
                      <img 
                        src={product.filePath || product.thFilePath}
                        alt={product.itemNm}
                        className="product-info-image"
                      />
                      <div className="product-info-image-overlay">
                        <button 
                          className="product-info-zoom-btn"
                          onClick={handleImageClick}
                        >
                          <Eye size={16} />
                          확대보기
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="product-info-no-image">
                      <CiImageOff size={64} color="#ccc" />
                      <span>이미지 없음</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 정보 섹션 */}
              <div className="product-info-details-section">
                <div className="product-info-details">
                  {product.itemCd && (
                    <div className="product-info-code">{product.itemCd}</div>
                  )}
                  
                  <h3 className="product-info-title">{product.itemNm}</h3>
                  
                  {/* 기본 정보 */}
                  <div className="product-info-basic">
                    {product.unitNm && (
                      <div className="product-info-row">
                        <span className="product-info-label">단위:</span>
                        <span className="product-info-value">{product.unitNm}</span>
                      </div>
                    )}
                    
                    {product.spec && (
                      <div className="product-info-row">
                        <span className="product-info-label">스펙:</span>
                        <span className="product-info-value">{product.spec}</span>
                      </div>
                    )}
                    
                    {product.outUnitPrice !== undefined && product.outUnitPrice !== null && (
                      <div className="product-info-row">
                        <span className="product-info-label">출고단가:</span>
                        <span className="product-info-value price">
                          {product.outUnitPrice.toLocaleString()}원
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 옵션값 선택 - 유효한 옵션 코드일 때만 표시 */}
                  {isValidOptionCode(product.optCd) && optionValues.length > 0 && (
                    <div className="product-info-option">
                      <span className="product-info-option-label">옵션:</span>
                      {loadingOptions ? (
                        <div className="product-info-option-loading">옵션 로드 중...</div>
                      ) : (
                        <select 
                          value={selectedOptionValue}
                          onChange={(e) => setSelectedOptionValue(e.target.value)}
                          className="product-info-option-select"
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
                  <div className="product-info-quantity">
                    <label className="product-info-quantity-label">수량:</label>
                    <div className="product-info-quantity-controls">
                      <button 
                        className="product-info-quantity-btn"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="product-info-quantity-input"
                        min="1"
                      />
                      <button 
                        className="product-info-quantity-btn"
                        onClick={() => handleQuantityChange(1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 총 금액 */}
                  {product.outUnitPrice !== undefined && product.outUnitPrice !== null && (
                    <div className="product-info-total">
                      <span className="product-info-total-label">총 금액:</span>
                      <span className="product-info-total-price">
                        {calculateTotal()}원
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="product-info-modal-actions">
            <button 
              className="product-info-action-btn cart-btn"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              장바구니 담기
            </button>
            <button 
              className="product-info-action-btn quote-btn"
              onClick={handleQuoteRequest}
            >
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
          message="장바구니 및 견적의뢰를 위해서는 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?"
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
            price: product.outUnitPrice || 0,
            quantity: quantity,
            filePath: product.filePath || product.thFilePath,
            totalAmount: (product.outUnitPrice || 0) * quantity
          }]}
        />
      )}

      {/* 이미지 모달 */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={(e) => {
          e && e.stopPropagation && e.stopPropagation();
          setIsImageModalOpen(false);
        }}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
        altText={selectedImage.alt}
        showControls={true}
        showDownload={true}
      />
    </>
  );
};

export default ProductInfoModal;
