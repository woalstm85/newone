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
 * 7. 이미지 갤러리 (fileData 배열 기반, 썸네일 클릭 시 메인 이미지 변경)
 * 8. 이미지 확대 보기 (ImageModal 연동)
 * 9. 로그인 체크 (미로그인 시 로그인 모달 표시)
 * 10. 반응형 디자인 (모바일/데스크톱 레이아웃 분리)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ShoppingCart, Eye, Plus, Minus, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState({ images: [], initialIndex: 0, title: '' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false);
  
  // 이미지 갤러리 상태
  const [imageList, setImageList] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const thumbnailContainerRef = useRef(null);
  
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
   * 이미지 리스트 생성
   * fileData 배열이 있으면 사용, 없으면 filePath나 thFilePath 사용
   */
  const buildImageList = useCallback((productData) => {
    if (!productData) return [];
    
    const images = [];
    
    // fileData 배열이 있으면 사용 (상세 이미지들)
    if (productData.fileData && Array.isArray(productData.fileData) && productData.fileData.length > 0) {
      productData.fileData.forEach((file, index) => {
        if (file.filePath) {
          images.push({
            url: file.filePath,
            fileNo: file.fileNo,
            realNm: file.realNm || `이미지 ${index + 1}`,
            isMain: index === 0
          });
        }
      });
    }
    
    // fileData가 없으면 기존 방식 (filePath 또는 thFilePath)
    if (images.length === 0) {
      if (productData.filePath) {
        images.push({
          url: productData.filePath,
          fileNo: 'main',
          realNm: '메인 이미지',
          isMain: true
        });
      } else if (productData.thFilePath) {
        images.push({
          url: productData.thFilePath,
          fileNo: 'thumb',
          realNm: '썸네일 이미지',
          isMain: true
        });
      }
    }
    
    return images;
  }, []);

  /**
   * 옵션 코드 유효성 검사
   * optCd가 없거나 'OP0000'일 경우 false 반환
   */
  const isValidOptionCode = (optCd) => {
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
      
      // 이미지 리스트 생성 및 초기화
      const images = buildImageList(product);
      setImageList(images);
      setCurrentImageIndex(0);
      
      const currentOptCd = product.optCd || null;
      
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
      setImageList([]);
      setCurrentImageIndex(0);
    }
  }, [isOpen, product?.itemCd, loadOptionValues, buildImageList]);

  /**
   * 썸네일 클릭 시 메인 이미지 변경
   */
  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  /**
   * 이전 이미지
   */
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  };

  /**
   * 다음 이미지
   */
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  };

  /**
   * 현재 이미지 URL 가져오기
   */
  const getCurrentImageUrl = () => {
    if (imageList.length > 0 && imageList[currentImageIndex]) {
      return imageList[currentImageIndex].url;
    }
    return product?.filePath || product?.thFilePath || '';
  };

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
   * 이미지 클릭 핸들러 (확대 보기)
   * 이미지 배열과 현재 인덱스를 ImageModal에 전달
   */
  const handleImageClick = () => {
    if (imageList.length > 0) {
      setSelectedImage({
        images: imageList.map(img => ({
          url: img.url,
          alt: img.realNm || product.itemNm || '상품 이미지',
          title: product.itemNm || '상품 이미지'
        })),
        initialIndex: currentImageIndex,
        title: product.itemNm || '상품 이미지'
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

    if (isValidOptionCode(product.optCd) && optionValues.length > 0 && !selectedOptionValue) {
      toast.error('옵션을 선택해주세요.');
      return;
    }

    const selectedOption = optionValues.find(opt => opt.optValCd === selectedOptionValue);
    const custCd = globalState.G_CUST_CD || '';
    
    let source = 'general';
    if (product.source) {
      source = product.source;
    } else if (product.isSurplus) {
      source = 'surplus';
    } else if (product.isEvent) {
      source = 'event';
    }
    
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
    setImageList([]);
    setCurrentImageIndex(0);
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

  /**
   * 이미지 갤러리 렌더링 (공통)
   */
  const renderImageGallery = (isMobileLayout = false) => {
    const currentImageUrl = getCurrentImageUrl();
    const hasMultipleImages = imageList.length > 1;
    
    return (
      <div className={`product-info-gallery ${isMobileLayout ? 'mobile' : 'desktop'}`}>
        {/* 메인 이미지 */}
        <div className={`product-info-main-image-wrapper ${isMobileLayout ? 'mobile' : ''}`}>
          {currentImageUrl ? (
            <>
              <img 
                src={currentImageUrl}
                alt={product.itemNm}
                className="product-info-main-image"
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
              
              {/* 이미지 네비게이션 화살표 (여러 이미지일 때만, 호버 시 표시) */}
              {hasMultipleImages && (
                <>
                  <button 
                    className="product-info-nav-btn prev"
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    className="product-info-nav-btn next"
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* 이미지 카운터 */}
                  <div className="product-info-image-counter">
                    {currentImageIndex + 1} / {imageList.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={`product-info-no-image ${isMobileLayout ? 'mobile' : ''}`}>
              <CiImageOff size={isMobileLayout ? 48 : 64} color="#ccc" />
              {!isMobileLayout && <span>이미지 없음</span>}
            </div>
          )}
        </div>
        
        {/* 썸네일 리스트 (여러 이미지일 때만) */}
        {hasMultipleImages && (
          <div className="product-info-thumbnail-container" ref={thumbnailContainerRef}>
            <div className="product-info-thumbnail-list">
              {imageList.map((img, index) => (
                <div 
                  key={img.fileNo || index}
                  className={`product-info-thumbnail-item ${currentImageIndex === index ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img 
                    src={img.url}
                    alt={img.realNm || `이미지 ${index + 1}`}
                    className="product-info-thumbnail-image"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                
                {/* 이미지 갤러리 섹션 */}
                <div className="product-info-image-section-mobile">
                  {renderImageGallery(true)}
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
                
                {/* 옵션값 선택 */}
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
              {/* 이미지 갤러리 섹션 */}
              <div className="product-info-image-section">
                {renderImageGallery(false)}
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

                  {/* 옵션값 선택 */}
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
        images={selectedImage.images || []}
        initialIndex={selectedImage.initialIndex || 0}
        title={selectedImage.title}
        showControls={true}
      />
    </>
  );
};

export default ProductInfoModal;
