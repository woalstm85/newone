import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Eye, Plus, Minus } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import ImageModal from './ImageModal';
import { commonAPI } from '../../services/api';
import './ProductInfoModal.css';

const ProductInfoModal = ({ 
  isOpen, 
  onClose, 
  product,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '', alt: '' });
  
  // 옵션값 관련 상태
  const [optionValues, setOptionValues] = useState([]);
  const [selectedOptionValue, setSelectedOptionValue] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);

  // 옵션값 로드
  useEffect(() => {
    const loadOptionValues = async () => {
      if (isOpen && product?.optCd) {
        try {
          setLoadingOptions(true);
          const options = await commonAPI.getOptionValues(product.optCd);
          setOptionValues(options || []);
          
          // 기본값 설정 (첫 번째 옵션 또는 '해당없음' 찾기)
          if (options && options.length > 0) {
            const defaultOption = options.find(opt => opt.optValNm === '해당없음') || options[0];
            setSelectedOptionValue(defaultOption.optValCd);
          }
        } catch (error) {
          console.error('옵션값 로드 실패:', error);
          setOptionValues([]);
        } finally {
          setLoadingOptions(false);
        }
      }
    };
    
    loadOptionValues();
  }, [isOpen, product?.optCd]);

  // 수량 변경
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // 이미지 클릭 핸들러
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

  // 장바구니 추가
  const handleAddToCart = () => {
    if (onAddToCart) {
      // 선택된 옵션값 정보 찾기
      const selectedOption = optionValues.find(opt => opt.optValCd === selectedOptionValue);
      
      onAddToCart({
        ...product,
        quantity: quantity,
        optValCd: selectedOptionValue,
        optValNm: selectedOption?.optValNm || ''
      });
    }
  };

  // 모달이 닫힐 때 상태 초기화
  const handleClose = () => {
    setQuantity(1);
    setSelectedOptionValue('');
    setOptionValues([]);
    onClose();
  };

  if (!isOpen || !product) return null;

  // 배경 클릭으로 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="product-info-modal-overlay" onClick={handleBackdropClick}>
      <div className="product-info-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="product-info-modal-header">
          <h2>상품 정보</h2>
          <button className="product-info-modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* 콘텐츠 */}
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
              <h3 className="product-info-title">{product.itemNm}</h3>
              
              {/* 기본 정보 */}
              <div className="product-info-basic">
                {product.optCd && (
                  <div className="product-info-row">
                    <span className="product-info-label">제품코드:</span>
                    <span className="product-info-value">{product.itemCd}</span>
                  </div>
                )}
                
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

              {/* 수량 선택 */}
              <div className="product-info-quantity">
                <label className="product-info-quantity-label">수량:</label>
                <div className="product-info-quantity-controls">
                  <button 
                    className="product-info-quantity-btn"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="product-info-quantity-input"
                    min="1"
                  />
                  <button 
                    className="product-info-quantity-btn"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* 옵션값 선택 */}
              {product.optCd && (
                <div className="product-info-option product-info-option-mobile-fix">
                  <div className="product-info-option-row product-info-option-row-mobile">
                    <label className="product-info-option-label">옵션:</label>
                    {loadingOptions ? (
                      <div className="product-info-option-loading">로딩 중...</div>
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
                </div>
              )}

              {/* 총 금액 */}
              {product.outUnitPrice !== undefined && product.outUnitPrice !== null && (
                <div className="product-info-total">
                  <span className="product-info-total-label">총 금액:</span>
                  <span className="product-info-total-price">
                    {(product.outUnitPrice * quantity).toLocaleString()}원
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="product-info-modal-actions">
          <button 
            className="product-info-action-btn cart-btn"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} />
            장바구니 담기
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default ProductInfoModal;