/**
 * ProductList.js
 * 제품 목록 표시 컴포넌트 (React Query 적용 + 페이징)
 * 
 * 주요 기능:
 * - 제품 목록을 그리드 형태로 표시
 * - 카테고리별 필터링
 * - 할인율 계산 및 표시
 * - 제품 상세보기 모달
 * - 다양한 리스트 타입 지원 (전체/잉여재고/행사품목)
 * - React Query를 통한 데이터 캐싱 (메뉴 이동 시 재로딩 방지)
 * - 페이지네이션 기능
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import './ProductList.css';
import OptimizedImage, { preloadImages } from '../common/OptimizedImage';
import '../common/OptimizedImage.css';
import QuoteModal from '../modals/QuoteModal';
import { productAPI } from '../../services/api';

// 쿼리 키 상수
const QUERY_KEYS = {
  SURPLUS_PRODUCTS: 'surplusProducts',
  EVENT_PRODUCTS: 'eventProducts',
  ALL_PRODUCTS: 'allProducts',
};

/**
 * ProductList 컴포넌트
 * 
 * @param {Object} selectedCategory - 선택된 카테고리 정보
 * @param {string} listType - 목록 타입 ('all', 'surplus', 'event')
 * @param {Function} onClose - 목록 닫기 콜백 함수
 * @param {Function} onProductCountUpdate - 제품 개수 업데이트 콜백 함수
 */
const ProductList = ({ selectedCategory, listType = 'all', onClose, onProductCountUpdate }) => {
  // 모달 상태 관리
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  /**
   * 쿼리 키 생성 - listType과 카테고리 정보 포함
   */
  const queryKey = useMemo(() => {
    const baseKey = listType === 'surplus' 
      ? QUERY_KEYS.SURPLUS_PRODUCTS 
      : listType === 'event' 
        ? QUERY_KEYS.EVENT_PRODUCTS 
        : QUERY_KEYS.ALL_PRODUCTS;
    
    // 카테고리가 있으면 키에 포함
    if (selectedCategory?.catCd) {
      return [baseKey, selectedCategory.catCd, selectedCategory.level];
    }
    return [baseKey];
  }, [listType, selectedCategory]);

  /**
   * 카테고리 변경 시 페이지 초기화
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, listType]);

  /**
   * API 호출 함수
   */
  const fetchProducts = async () => {
    if (listType === 'surplus') {
      // 잉여재고 제품 로드
      const params = { itemDivCd: '010' };
      
      if (selectedCategory?.catCd) {
        if (selectedCategory.level === 1) params.itemGroupLCd = selectedCategory.catCd;
        else if (selectedCategory.level === 2) params.itemGroupMCd = selectedCategory.catCd;
        else if (selectedCategory.level === 3) params.itemGroupSCd = selectedCategory.catCd;
      }
      
      const data = await productAPI.getDashItems(
        params.itemDivCd, 
        params.itemGroupLCd, 
        params.itemGroupMCd, 
        params.itemGroupSCd
      );
      
      return data.map(item => ({
        ...item,
        id: item.itemCd || item.id,
        name: item.itemNm,
        isSurplus: true,
        isEvent: false
      }));
      
    } else if (listType === 'event') {
      // 행사품목 제품 로드
      const params = { itemDivCd: '020' };
      
      if (selectedCategory?.catCd) {
        if (selectedCategory.level === 1) params.itemGroupLCd = selectedCategory.catCd;
        else if (selectedCategory.level === 2) params.itemGroupMCd = selectedCategory.catCd;
        else if (selectedCategory.level === 3) params.itemGroupSCd = selectedCategory.catCd;
      }
      
      const data = await productAPI.getDashItems(
        params.itemDivCd, 
        params.itemGroupLCd, 
        params.itemGroupMCd, 
        params.itemGroupSCd
      );
      
      return data.map(item => ({
        ...item,
        id: item.itemCd || item.id,
        name: item.itemNm,
        isSurplus: false,
        isEvent: true
      }));
      
    } else {
      // 기본값: products.json 파일 사용
      const response = await fetch('/data/products.json');
      if (!response.ok) throw new Error('제품 데이터를 불러올 수 없습니다.');
      const data = await response.json();
      return data.products;
    }
  };

  /**
   * React Query - 데이터 조회
   */
  const { 
    data: products = [], 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching 
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchProducts,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  /**
   * 페이지네이션 계산
   */
  const { currentItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return {
      currentItems: products.slice(startIdx, endIdx),
      totalPages: Math.ceil(products.length / itemsPerPage),
      startIndex: startIdx,
      endIndex: Math.min(endIdx, products.length)
    };
  }, [products, currentPage, itemsPerPage]);

  /**
   * 다음 페이지 이미지 프리로드 - 현재 페이지 로드 후 백그라운드에서 실행
   */
  useEffect(() => {
    if (currentPage < totalPages && products.length > 0) {
      const nextStartIdx = currentPage * itemsPerPage;
      const nextEndIdx = nextStartIdx + itemsPerPage;
      const nextItems = products.slice(nextStartIdx, nextEndIdx);
      const nextImageUrls = nextItems
        .map(p => p.FILEPATH || p.thFilePath || p.filePath)
        .filter(Boolean);
      
      // 비동기로 프리로드 (성능 영향 최소화)
      if (nextImageUrls.length > 0) {
        const timer = setTimeout(() => {
          preloadImages(nextImageUrls);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPage, totalPages, itemsPerPage, products]);

  /**
   * 페이지 번호 배열 생성 (CUST0020 동일)
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  /**
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * 페이지당 아이템 수 변경
   */
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  /**
   * 날짜를 보기 좋은 형식으로 변환
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
      
      if (isNaN(date.getTime())) return dateString;
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const weekday = weekdays[date.getDay()];
      
      return `${month}.${day} (${weekday})`;
    } catch (error) {
      return dateString;
    }
  };

  /**
   * 할인율 계산
   */
  const calculateDiscountPercent = (salePrice, disPrice) => {
    if (!salePrice || !disPrice || salePrice <= disPrice) return 0;
    return Math.round(((salePrice - disPrice) / salePrice) * 100);
  };

  /**
   * 상품 개수를 부모 컴포넌트에 전달
   */
  useEffect(() => {
    if (onProductCountUpdate) {
      onProductCountUpdate(products.length);
    }
  }, [products.length, onProductCountUpdate]);

  /**
   * 제품 상세보기 모달 열기
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
   * 가격 포맷
   */
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('ko-KR');
  };

  // 로딩 중 UI
  if (isLoading) {
    return (
      <div className="prd_loading">
        <div className="prd_loading_spinner"></div>
        <p>제품을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생 UI
  if (isError) {
    return (
      <div className="prd_error">
        <Package size={48} />
        <h3>데이터를 불러올 수 없습니다</h3>
        <p>{error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
        <button onClick={() => refetch()}>다시 시도</button>
      </div>
    );
  }

  // 제품이 없는 경우 UI
  if (products.length === 0) {
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
      {/* 상단 정보 바 - CUST0020 동일 */}
      <div className="prd_info_bar">
        <div className="prd_count_info">
          전체 {products.length.toLocaleString()}건 중 {products.length > 0 ? (startIndex + 1).toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
        </div>
        <div className="prd_page_size">
          <label htmlFor="prd_items_per_page">페이지당 표시:</label>
          <select 
            id="prd_items_per_page"
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
          >
            <option value={10}>10개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={80}>80개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>
      
      {/* 백그라운드 fetching 표시 */}
      {isFetching && !isLoading && (
        <div className="prd_fetching_indicator">
          <RefreshCw size={16} className="prd_spinning" />
          <span>업데이트 중...</span>
        </div>
      )}
      
      {/* 제품 그리드 */}
      <div className="prd_grid">
        {currentItems.map((product) => (
          <div 
            key={product.id || product.itemCd} 
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
                <OptimizedImage
                  src={product.FILEPATH}
                  thumbnailSrc={product.THFILEPATH || product.thFilePath}
                  alt={product.itemNm}
                  className="prd_image"
                  width={200}
                  height={200}
                  objectFit="contain"
                  rootMargin="200px"
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
              {product.itemCd && (
                <div className="prd_code">{product.itemCd}</div>
              )}
              
              <h3 className="prd_name">{product.itemNm}</h3>
              
              <div className="prd_price_container">
                {product.shipAvDate && (
                  <div className="prd_delivery_badge">
                    🚛 {formatShipDate(product.shipAvDate)} 출하가능
                  </div>
                )}
                
                {product.compNm && (
                  <div className="prd_company_badge">{product.compNm}</div>
                )}
                
                <div className="prd_price_row">
                  {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && product.disPrice > 0 ? (
                    <>
                      <span className="prd_current_price">
                        {formatPrice(product.disPrice)} 원
                      </span>
                      <span className="prd_original_price">{formatPrice(product.salePrice)} 원</span>
                    </>
                  ) : (
                    <span className="prd_current_price">
                      {formatPrice(product.disPrice || product.salePrice)} 원
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 - CUST0020 동일 */}
      {totalPages > 1 && (
        <div className="prd_pagination">
          {/* 맨 처음으로 */}
          <button 
            className="prd_page_btn prd_page_nav"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <span>처음으로</span>
          </button>
          
          {/* 이전 */}
          <button 
            className="prd_page_btn prd_page_nav"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            <span>이전</span>
          </button>
          
          {/* 페이지 번호들 */}
          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`prd_page_btn ${currentPage === page ? 'prd_page_active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          {/* 다음 */}
          <button 
            className="prd_page_btn prd_page_nav"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span>다음</span>
            <ChevronRight size={16} />
          </button>
          
          {/* 맨 끝으로 */}
          <button 
            className="prd_page_btn prd_page_nav"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <span>끝으로</span>
          </button>
        </div>
      )}

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
