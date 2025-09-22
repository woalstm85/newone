import React, { useState, useEffect } from 'react';
import { Eye, Package, Filter } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import './ProductList.css';
import ImageWithFallback from '../common/ImageWithFallback';
import QuoteModal from '../modals/QuoteModal';
import { productAPI } from '../../services/api';

const ProductList = ({ selectedCategory, listType = 'all', onClose, onProductCountUpdate }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.warn('Invalid date:', dateString);
        return dateString; // 원본 문자열 반환
      }
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[date.getDay()];
      
      return `${month}.${day} (${weekday})`;
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateString);
      return dateString; // 에러 시 원본 문자열 반환
    }
  };

  // 할인율 계산
  const calculateDiscountPercent = (salePrice, disPrice) => {
    if (!salePrice || !disPrice || salePrice <= disPrice) return 0;
    return Math.round(((salePrice - disPrice) / salePrice) * 100);
  };

  // 제품 데이터 로드
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // listType에 따라 API 호출
        if (listType === 'surplus') {
          const data = await productAPI.getDashItems('010');
          const processedData = data.map(item => ({
            ...item,
            id: item.itemCd || item.id,
            name: item.itemNm,
            itemNm: item.itemNm,
            disPrice: item.disPrice,
            salePrice: item.salePrice,
            shipAvDate: item.shipAvDate,
            FILEPATH: item.FILEPATH,
            compNm: item.compNm,
            category: item.category || '잉여재고',
            subcategory: item.subcategory || '기타',
            item: item.item || item.itemNm,
            isSurplus: true,
            isEvent: false
          }));
          setProducts(processedData);
        } else if (listType === 'event') {
          const data = await productAPI.getDashItems('020');
          const processedData = data.map(item => ({
            ...item,
            id: item.itemCd || item.id,
            name: item.itemNm,
            itemNm: item.itemNm,
            disPrice: item.disPrice,
            salePrice: item.salePrice,
            shipAvDate: item.shipAvDate,
            FILEPATH: item.FILEPATH,
            compNm: item.compNm,
            category: item.category || '행사품목',
            subcategory: item.subcategory || '기타',
            item: item.item || item.itemNm,
            isSurplus: false,
            isEvent: true
          }));
          setProducts(processedData);
        } else {
          // 기본값: products.json 파일 사용 (기존 로직)
          const response = await fetch('/data/products.json');
          if (!response.ok) {
            throw new Error('제품 데이터를 불러올 수 없습니다.');
          }
          const data = await response.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error('제품 데이터 로드 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [listType]);

  // 제품 필터링
  useEffect(() => {
    if (!products.length) return;

    let filtered = [...products];

    // 카테고리 필터링
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category === selectedCategory.category &&
        product.subcategory === selectedCategory.subcategory &&
        product.item === selectedCategory.item
      );
    }

    setFilteredProducts(filtered);
    
    // 상품 개수를 부모 컴포넌트에 전달
    if (onProductCountUpdate) {
      onProductCountUpdate(filtered.length);
    }
  }, [products, selectedCategory, listType, onProductCountUpdate]);

  // 제품 상세보기
  const handleProductView = (product) => {
    setSelectedProduct(product);
    setShowQuoteModal(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowQuoteModal(false);
    setSelectedProduct(null);
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('ko-KR');
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="prd_loading">
        <div className="prd_loading_spinner"></div>
        <p>제품을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="prd_error">
        <Package size={48} />
        <h3>데이터를 불러올 수 없습니다</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  // 제품이 없는 경우
  if (filteredProducts.length === 0) {
    return (
      <div className="prd_empty">
        <Package size={48} />
        <h3>제품이 없습니다</h3>
        <p>
          {selectedCategory 
            ? `선택한 카테고리에 해당하는 제품이 없습니다.`
            : `현재 등록된 제품이 없습니다.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="prd_container">
      {/* 필터 정보 표시 */}
      {selectedCategory && (
        <div className="prd_filter_display">
          <Filter size={16} />
          <span>
            {selectedCategory.pathString || selectedCategory.catNm || selectedCategory.category}
          </span>
        </div>
      )}

      {/* 제품 그리드 */}
      <div className="prd_grid">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className="prd_card"
            onClick={() => handleProductView(product)}
          >
            {/* 할인 뱃지 컨테이너 */}
            <div className="prd_badge_container">
              {(() => {
                const discountPercent = calculateDiscountPercent(product.salePrice, product.disPrice);
                return discountPercent > 0 && (
                  <span className="prd_discount_badge">
                    {discountPercent}% 할인
                  </span>
                );
              })()}
            </div>
            
            {/* 제품 이미지 */}
            <div className="prd_image_wrapper">
              {product.FILEPATH ? (
                <ImageWithFallback
                  src={product.FILEPATH}
                  alt={product.itemNm}
                  className="prd_image"
                  width={200}
                  height={200}
                />
              ) : (
                <div className="prd_image prd_no_image">
                  <CiImageOff size={48} color="#ccc" />
                </div>
              )}
              
              {/* 호버 시 상세보기 버튼 */}
              <div className="prd_image_overlay">
                <button 
                  className="prd_overlay_view_btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductView(product);
                  }}
                >
                  <Eye size={20} />
                  상세보기
                </button>
              </div>
            </div>
            
            {/* 제품 정보 */}
            <div className="prd_info">
              <h3 className="prd_name">{product.itemNm}</h3>
              <div className="prd_price_container">
                {/* 출하일 정보 */}
                {product.shipAvDate && (
                  <div className="prd_delivery_badge">🚛 {formatShipDate(product.shipAvDate)} 출하가능</div>
                )}
                
                {/* 회사명 */}
                {product.compNm && (
                  <div className="prd_company_badge">{product.compNm}</div>
                )}
                
                {/* 가격 표시 */}
                <div className="prd_price_display">
                  {/* 할인가가 있으면 할인가를 메인으로, 없으면 판매가를 메인으로 */}
                  <span className="prd_current_price">
                    {formatPrice(product.disPrice || product.salePrice)} 원
                  </span>
                  {/* 할인가가 있고 판매가와 다르면 판매가를 원가로 표시 */}
                  {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && (
                    <span className="prd_original_price">{formatPrice(product.salePrice)} 원</span>
                  )}
                </div>
                
                {/* 상세보기 버튼 제거 - 이미지 호버로 이동 */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 견적 요청 모달 */}
      <QuoteModal 
        product={selectedProduct}
        isOpen={showQuoteModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ProductList;