/**
 * ProductList.js
 * 제품 목록 표시 컴포넌트
 * 
 * 주요 기능:
 * - 제품 목록을 그리드 형태로 표시
 * - 카테고리별 필터링
 * - 할인율 계산 및 표시
 * - 제품 상세보기 모달
 * - 다양한 리스트 타입 지원 (전체/잉여재고/행사품목)
 */

import React, { useState, useEffect } from 'react';
import { Eye, Package, Filter } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import './ProductList.css';
import ImageWithFallback from '../common/ImageWithFallback';
import QuoteModal from '../modals/QuoteModal';
import { productAPI } from '../../services/api';

/**
 * ProductList 컴포넌트
 * 
 * @param {Object} selectedCategory - 선택된 카테고리 정보
 * @param {string} listType - 목록 타입 ('all', 'surplus', 'event')
 * @param {Function} onClose - 목록 닫기 콜백 함수
 * @param {Function} onProductCountUpdate - 제품 개수 업데이트 콜백 함수
 */
const ProductList = ({ selectedCategory, listType = 'all', onClose, onProductCountUpdate }) => {
  // 상태 관리
  const [products, setProducts] = useState([]); // 전체 제품 목록
  const [filteredProducts, setFilteredProducts] = useState([]); // 필터링된 제품 목록
  const [selectedProduct, setSelectedProduct] = useState(null); // 선택된 제품
  const [showQuoteModal, setShowQuoteModal] = useState(false); // 견적 모달 표시 여부
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  /**
   * 날짜를 보기 좋은 형식으로 변환
   * 입력: "2024-03-15" 또는 "20240315" 등 다양한 형식
   * 출력: "3.15 (금)" 형식
   * 
   * @param {string} dateString - 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열
   */
  const formatShipDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      
      // 여러 가지 날짜 형식 처리
      if (typeof dateString === 'string') {
        // YYYY-MM-DD 또는 YYYY-MM-DD HH:mm:ss 형식
        if (dateString.includes('-')) {
          date = new Date(dateString);
        } 
        // MM/DD/YYYY 또는 DD/MM/YYYY 형식
        else if (dateString.includes('/')) {
          date = new Date(dateString);
        } 
        // YYYYMMDD 형식 (8자리)
        else if (dateString.length === 8) {
          const year = dateString.substring(0, 4);
          const month = dateString.substring(4, 6);
          const day = dateString.substring(6, 8);
          date = new Date(`${year}-${month}-${day}`);
        } 
        // 기타 형식
        else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      // 날짜 유효성 검사
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString; // 원본 문자열 반환
      }
      
      // 날짜 포맷팅
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

  /**
   * 할인율 계산
   * 
   * @param {number} salePrice - 판매가
   * @param {number} disPrice - 할인가
   * @returns {number} 할인율 (0-100 사이의 정수)
   */
  const calculateDiscountPercent = (salePrice, disPrice) => {
    if (!salePrice || !disPrice || salePrice <= disPrice) return 0;
    return Math.round(((salePrice - disPrice) / salePrice) * 100);
  };

  /**
   * 제품 데이터 로드
   * listType에 따라 다른 API 또는 데이터 소스를 사용
   */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // listType에 따라 API 호출
        if (listType === 'surplus') {
          // 잉여재고 제품 로드
          const data = await productAPI.getDashItems('010');
          const processedData = data.map(item => ({
            ...item,
            id: item.itemCd || item.id,
            name: item.itemNm,
            itemNm: item.itemNm,
            unitNm: item.unitNm,
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
          // 행사품목 제품 로드
          const data = await productAPI.getDashItems('020');
          const processedData = data.map(item => ({
            ...item,
            id: item.itemCd || item.id,
            name: item.itemNm,
            itemNm: item.itemNm,
            unitNm: item.unitNm,
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
          // 기본값: products.json 파일 사용
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

  /**
   * 제품 필터링
   * 선택된 카테고리에 따라 제품 목록을 필터링
   */
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

  /**
   * 제품 상세보기 모달 열기
   * 
   * @param {Object} product - 선택된 제품 정보
   */
  const handleProductView = (product) => {
    setSelectedProduct(product);
    setShowQuoteModal(true);
  };

  /**
   * 모달 닫기
   */
  const handleCloseModal = () => {
    setShowQuoteModal(false);
    setSelectedProduct(null);
  };

  /**
   * 가격을 천단위 구분 형식으로 변환
   * 
   * @param {number} price - 가격
   * @returns {string} 포맷된 가격 문자열
   */
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('ko-KR');
  };

  // 로딩 중 UI
  if (loading) {
    return (
      <div className="prd_loading">
        <div className="prd_loading_spinner"></div>
        <p>제품을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생 UI
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

  // 제품이 없는 경우 UI
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

  // 메인 UI 렌더링
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
            {/* 할인 뱃지 표시 */}
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
                // 이미지가 있는 경우
                <ImageWithFallback
                  src={product.FILEPATH}
                  alt={product.itemNm}
                  className="prd_image"
                  width={200}
                  height={200}
                />
              ) : (
                // 이미지가 없는 경우 기본 아이콘 표시
                <div className="prd_image prd_no_image">
                  <CiImageOff size={48} color="#ccc" />
                </div>
              )}
              
              {/* 호버 시 상세보기 버튼 */}
              <div className="prd_image_overlay">
                <button 
                  className="prd_overlay_view_btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 부모 요소 클릭 이벤트 방지
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
              {/* 제품명 */}
              <h3 className="prd_name">{product.itemNm}</h3>
              
              <div className="prd_price_container">
                {/* 출하일 정보 */}
                {product.shipAvDate && (
                  <div className="prd_delivery_badge">
                    🚛 {formatShipDate(product.shipAvDate)} 출하가능
                  </div>
                )}
                
                {/* 회사명 */}
                {product.compNm && (
                  <div className="prd_company_badge">{product.compNm}</div>
                )}
                
                {/* 단위와 가격 한 줄 */}
                <div className="prd_price_row">
                  {/* 단위 배지 */}
                  {product.unitNm && (
                    <span className="prd_unit_badge">{product.unitNm}</span>
                  )}
                
                {/* 가격 표시 */}
                <div className="prd_price_display">
                  {/* disPrice와 salePrice가 모두 있고 다른 경우 */}
                  {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && product.disPrice > 0 ? (
                    <>
                      <span className="prd_current_price">
                        {formatPrice(product.disPrice)} 원
                      </span>
                      <span className="prd_original_price">{formatPrice(product.salePrice)} 원</span>
                    </>
                  ) : (
                    /* disPrice만 있거나, salePrice만 있거나, 둘이 같은 경우 */
                    <span className="prd_current_price">
                      {formatPrice(product.disPrice || product.salePrice)} 원
                    </span>
                  )}
                </div>
                </div>
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
