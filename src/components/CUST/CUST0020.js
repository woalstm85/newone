/**
 * CUST0020.js - 제품정보 관리
 * 
 * 주요 기능:
 * 1. 제품 목록 조회 및 검색 (카테고리별, 제품명)
 * 2. 리스트/이미지 뷰 모드 전환
 * 3. 페이지네이션 및 페이지 크기 조절
 * 4. 상품 이미지 확대 보기
 * 5. 상품 상세 정보 모달
 * 6. 장바구니 추가 기능
 * 7. 반응형 디자인 (모바일/태블릿/데스크톱)
 * 
 * 카테고리 구조: 대분류 > 중분류 > 소분류 계층 구조
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Package, List, ImageIcon, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, Info } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import { useAuth } from '../../context/AuthContext';
import { productAPI, commonAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Modal from '../common/Modal';
import ImageModal from '../common/ImageModal';
import ProductInfoModal from '../common/ProductInfoModal';
import MySpinner from '../common/MySpinner';
import './CUST0020.css';

function CUST0020() {
  // ==================== 상태 관리 ====================
  
  // 기본 상태
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('image');
  const [gridData, setGridData] = useState([]);
  
  // 검색 조건
  const [itemName, setItemName] = useState('');
  const [selectedCategoryL, setSelectedCategoryL] = useState('');
  const [selectedCategoryM, setSelectedCategoryM] = useState('');
  const [selectedCategoryS, setSelectedCategoryS] = useState('');
  
  // 카테고리 데이터
  const [categoryLData, setCategoryLData] = useState([]);
  const [categoryMData, setCategoryMData] = useState([]);
  const [categorySData, setCategorySData] = useState([]);
  
  // 검색 영역 토글 (모바일)
  const [isSearchVisible, setIsSearchVisible] = useState(window.innerWidth > 768);
  const searchToggleRef = useRef(null);
  
  // 스와이프 제스처 상태
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', title: '', alt: '' });
  const [isProductInfoModalOpen, setIsProductInfoModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Context
  const { currentMenuTitle } = useMenu();
  const { globalState } = useAuth();
  const navigate = useNavigate();

  // ==================== 이벤트 핸들러 ====================
  
  /**
   * 카테고리 변경 핸들러
   * 상위 카테고리 변경 시 하위 카테고리 초기화
   */
  const handleCategoryLChange = (value) => {
    setSelectedCategoryL(value);
    setSelectedCategoryM('');
    setSelectedCategoryS('');
  };

  const handleCategoryMChange = (value) => {
    setSelectedCategoryM(value);
    setSelectedCategoryS('');
  };

  const handleCategorySChange = (value) => {
    setSelectedCategoryS(value);
  };

  /**
   * 선택된 카테고리에 따른 하위 카테고리 필터링
   */
  const getFilteredCategoryM = () => {
    if (!selectedCategoryL) return categoryMData;
    return categoryMData.filter(item => item.catLCd === selectedCategoryL);
  };

  const getFilteredCategoryS = () => {
    if (!selectedCategoryM) return [];
    return categorySData.filter(item => item.catMCd === selectedCategoryM);
  };

  /**
   * 이미지 클릭 핸들러 - 이미지 확대 모달 표시
   */
  const handleImageClick = (imageUrl, itemName, itemCd) => {
    if (imageUrl) {
      setSelectedImage({
        url: imageUrl,
        title: itemName || '상품 이미지',
        alt: `${itemCd || ''} ${itemName || ''} 상품 이미지`
      });
      setIsImageModalOpen(true);
    }
  };

  /**
   * 상품 정보 모달 표시
   */
  const handleProductInfoClick = (product) => {
    setSelectedProduct(product);
    setIsProductInfoModalOpen(true);
  };

  /**
   * 장바구니 추가 핸들러
   */
  const handleAddToCart = async (productWithQuantity) => {
    const isLoggedIn = !!globalState.G_USER_ID;
    if (!isLoggedIn) {
      setModalMessage('장바구니 기능을 사용하려면 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?');
      setIsModalOpen(true);
      return;
    }
    
    try {
      const cartItem = {
        itemCd: productWithQuantity.itemCd,
        itemNm: productWithQuantity.itemNm,
        unitNm: productWithQuantity.unitNm,
        price: productWithQuantity.outUnitPrice || 0,
        outUnitPrice: productWithQuantity.outUnitPrice,
        quantity: productWithQuantity.quantity,
        spec: productWithQuantity.spec,
        optCd: productWithQuantity.optCd,
        optValCd: productWithQuantity.optValCd || '',
        optValNm: productWithQuantity.optValNm || '',
        filePath: productWithQuantity.filePath || productWithQuantity.thFilePath,
        totalAmount: (productWithQuantity.outUnitPrice || 0) * productWithQuantity.quantity
      };

      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => 
        item.itemCd === cartItem.itemCd && 
        item.optCd === cartItem.optCd &&
        item.optValCd === cartItem.optValCd
      );
      
      let isNewItem = true;
      if (existingItemIndex > -1) {
        existingCart[existingItemIndex].quantity += cartItem.quantity;
        existingCart[existingItemIndex].totalAmount = 
          existingCart[existingItemIndex].quantity * (existingCart[existingItemIndex].price || 0);
        isNewItem = false;
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      const optionText = productWithQuantity.optValNm ? ` (옵션: ${productWithQuantity.optValNm})` : '';
      const actionText = isNewItem ? '추가되었습니다' : '수량이 업데이트되었습니다';
      
      toast.success(
        `🛒 ${productWithQuantity.itemNm}${optionText}\n${productWithQuantity.quantity}개 ${actionText}\n총 ${existingCart.length}개 상품`
      );
    
      setIsProductInfoModalOpen(false);
      
    } catch (error) {
      console.error('장바구니 추가 오류:', error);
      toast.error('장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 검색 조건 초기화
   */
  const handleReset = () => {
    setItemName('');
    setSelectedCategoryL('');
    setSelectedCategoryM('');
    setSelectedCategoryS('');
    setCurrentPage(1);
  };

  /**
   * 검색 실행
   */
  const handleSearch = () => {
    fetchData();
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  /**
   * 검색 영역 토글 (모바일)
   */
  const toggleSearchArea = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  /**
   * 뷰 모드 변경 (리스트/이미지)
   */
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // ==================== 스와이프 제스처 ====================
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe && !isSearchVisible) {
      setIsSearchVisible(true);
    } else if (isUpSwipe && isSearchVisible) {
      setIsSearchVisible(false);
    }
  };

  // ==================== 페이지네이션 ====================
  
  /**
   * 현재 페이지 데이터 계산
   */
  const { currentItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentItems = gridData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(gridData.length / itemsPerPage);
    
    return {
      currentItems,
      totalPages,
      startIndex: startIdx + 1,
      endIndex: Math.min(endIdx, gridData.length)
    };
  }, [gridData, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

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

  // ==================== 데이터 로드 ====================
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await productAPI.getProductList(
        itemName,
        selectedCategoryL,
        selectedCategoryM,
        selectedCategoryS
      );
      setGridData(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [itemName, selectedCategoryL, selectedCategoryM, selectedCategoryS]);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await productAPI.getProductList('', '', '', '');
      setGridData(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      setModalMessage(`데이터 로드 중 오류가 발생했습니다: ${error.message}`);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==================== 생명주기 ====================
  
  const handleClickOutside = useCallback((event) => {
    if (searchToggleRef.current && !searchToggleRef.current.contains(event.target)) {
      if (window.innerWidth <= 768 && isSearchVisible) {
        setIsSearchVisible(false);
      }
    }
  }, [isSearchVisible]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [categoryLResponse, categoryMResponse, categorySResponse] = await Promise.all([
          commonAPI.getCategoryL(),
          commonAPI.getCategoryM(),
          commonAPI.getCategoryS()
        ]);
        setCategoryLData(categoryLResponse || []);
        setCategoryMData(categoryMResponse || []);
        setCategorySData(categorySResponse || []);
      } catch (error) {
        console.error('카테고리 데이터 로드 실패:', error);
      }
    };
    
    loadCategories();
    fetchInitialData();
  }, [fetchInitialData]);

  // ==================== 렌더링 함수 ====================
  
  const renderListView = () => (
    <div className="cust0020-grid-container">
      <div className="cust0020-grid-wrapper">          
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>이미지</th>
              <th style={{ width: '100px', textAlign: 'center' }}>제품코드</th>              
              <th>제품명</th>
              <th style={{ width: '100px', textAlign: 'center' }}>단위</th>
              <th style={{ width: '120px', textAlign: 'center' }}>출고단가</th>
              <th>스펙</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map((row, index) => (
              <tr key={row.itemCd || index}>
                <td className="cust0020-center-column">
                  <div className="cust0020-table-image-container">
                    {row.filePath || row.thFilePath ? (
                      <>
                        <img 
                          src={row.filePath || row.thFilePath} 
                          alt={row.itemNm || '제품 이미지'}
                          className="cust0020-table-image-item"
                        />
                        <div className="cust0020-table-image-overlay">
                          <button
                            className="cust0020-table-overlay-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(row.filePath || row.thFilePath, row.itemNm, row.itemCd);
                            }}
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="cust0020-table-no-image">
                        <CiImageOff size={20} color="#ccc" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="cust0020-center-column">{row.itemCd || '-'}</td>
                <td className="cust0020-left-column cust0020-item cust0020-product-name" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductInfoClick(row);
                    }}>
                  {row.itemNm}
                </td>
                <td className="cust0020-center-column">{row.unitNm || '-'}</td>
                <td className="cust0020-right-column">
                  {row.outUnitPrice ? row.outUnitPrice.toLocaleString() : '-'}
                </td>
                <td className="cust0020-left-column cust0020-item">{row.spec}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="cust0020-center-column" style={{ padding: '40px', color: '#666' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderImageView = () => {
    const items = currentItems.map((item, index) => (
      <div key={`${item.itemCd}-${index}`} className="cust0020-inventory-image-card">
        <div className="cust0020-inventory-image-header">
          <h4>{item.itemNm}</h4>
          <span className="cust0020-product-status-badge">상품</span>
        </div>
        <div className="cust0020-inventory-image-content">
          <div className="cust0020-inventory-image-section">
            <div className="cust0020-inventory-image-placeholder">
              {item.filePath || item.thFilePath ? (
                <>
                  <img
                    src={item.filePath || item.thFilePath}
                    alt={item.itemNm}
                    className="cust0020-inventory-image"
                  />
                  <div className="cust0020-image-overlay">
                    <button
                      className="cust0020-overlay-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item.filePath || item.thFilePath, item.itemNm, item.itemCd);
                      }}
                    >
                      <Eye size={14} />
                      확대
                    </button>
                  </div>
                </>
              ) : (
                <div className="cust0020-inventory-no-image">
                  <CiImageOff size={48} color="#ccc" />
                </div>
              )}
            </div>
          </div>
          
          <div className="cust0020-inventory-item-details">
            <div className="cust0020-inventory-item-specs">
              {item.itemCd && (
                <div className="cust0020-inventory-spec-row">
                  <span className="cust0020-inventory-spec-label">제품코드:</span>
                  <span className="cust0020-inventory-spec-value">{item.itemCd}</span>
                </div>
              )}
              {item.unitNm && (
                <div className="cust0020-inventory-spec-row">
                  <span className="cust0020-inventory-spec-label">단위:</span>
                  <span className="cust0020-inventory-spec-value">{item.unitNm}</span>
                </div>
              )}
              {item.outUnitPrice !== undefined && item.outUnitPrice !== null && (
                <div className="cust0020-inventory-spec-row">
                  <span className="cust0020-inventory-spec-label">출고단가:</span>
                  <span className="cust0020-inventory-spec-client">{item.outUnitPrice.toLocaleString()}원</span>
                </div>
              )}
              {!item.itemCd && !item.unitNm && (item.outUnitPrice === undefined || item.outUnitPrice === null) && (
                <div className="cust0020-inventory-spec-row">
                  <span className="cust0020-inventory-spec-label" style={{ color: '#999', fontStyle: 'italic' }}>
                    상세 정보 없음
                  </span>
                  <span className="cust0020-inventory-spec-value">-</span>
                </div>
              )}
            </div>
            <button 
              className="cust0020-product-info-long-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleProductInfoClick(item);
              }}
            >
              <Info size={16} />
              상품 정보
            </button>
          </div>
        </div>
      </div>
    ));

    return (
      <div className="cust0020-image-view-container">
        <div className="cust0020-inventory-image-grid">
          {items.length > 0 ? items : (
            <div className="cust0020-no-data">
              <CiImageOff size={48} color="#ccc" />
              <p>데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // ==================== 메인 렌더링 ====================
  
  return (
    <div className="cust0020-container">
      <div className="cust0020-program-header">
        <div className="cust0020-header-left">
          <Package className="w-6 h-6" />
          <h1>{currentMenuTitle || '제품정보 관리'}</h1>
        </div>
        <div className="cust0020-view-toggle">
          <button
            className={`cust0020-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
          >
            <List size={16} />
          </button>
          <button
            className={`cust0020-view-btn ${viewMode === 'image' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('image')}
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      <div 
        className="cust0020-search-section"
        ref={searchToggleRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="cust0020-mobile-search-toggle" onClick={toggleSearchArea}>
          <span>검색 옵션</span>
          {isSearchVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        <div className={`cust0020-search-container ${isSearchVisible ? 'visible' : 'hidden'}`}>
          <div className="cust0020-search-row">
            <div className="cust0020-search-field">
              <label>대분류</label>
              <select value={selectedCategoryL} onChange={(e) => handleCategoryLChange(e.target.value)}>
                <option value="">전체</option>
                {categoryLData.map((category) => (
                  <option key={category.catLCd} value={category.catLCd}>{category.catLNm}</option>
                ))}
              </select>
            </div>

            <div className="cust0020-search-field">
              <label>중분류</label>
              <select value={selectedCategoryM} onChange={(e) => handleCategoryMChange(e.target.value)} disabled={!selectedCategoryL}>
                <option value="">전체</option>
                {getFilteredCategoryM().map((category) => (
                  <option key={category.catMCd} value={category.catMCd}>{category.catMNm}</option>
                ))}
              </select>
            </div>

            <div className="cust0020-search-field">
              <label>소분류</label>
              <select value={selectedCategoryS} onChange={(e) => handleCategorySChange(e.target.value)} disabled={!selectedCategoryM}>
                <option value="">전체</option>
                {getFilteredCategoryS().map((category) => (
                  <option key={category.catSCd} value={category.catSCd}>{category.catSNm}</option>
                ))}
              </select>
            </div>
            
            <div className="cust0020-search-field">
              <label>제품명</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="제품명 입력"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div className="cust0020-search-buttons">
              <button className="cust0020-search-btn" onClick={handleSearch}>
                <Search size={16} />
                검색
              </button>
              <button className="cust0020-reset-btn" onClick={handleReset}>
                <RotateCcw size={16} />
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="cust0020-pagination-info">
        <div className="cust0020-data-info">
          전체 {gridData.length.toLocaleString()}건 중 {gridData.length > 0 ? startIndex.toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
        </div>
        <div className="cust0020-page-size-selector">
          <label>페이지당 표시:</label>
          <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
            <option value={10}>10개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={80}>80개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>

      {viewMode === 'list' ? renderListView() : renderImageView()}

      {totalPages > 1 && (
        <div className="cust0020-pagination">
          <button
            className="cust0020-page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            이전
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`cust0020-page-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className="cust0020-page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {isLoading && <MySpinner fullScreen={false} />}

      <Modal
        isOpen={isModalOpen}
        title="알림"
        message={modalMessage}
        onConfirm={() => {
          setIsModalOpen(false);
          if (modalMessage.includes('로그인 페이지로 이동')) {
            navigate('/login');
          }
        }}
        onCancel={modalMessage.includes('로그인 페이지로 이동') ? () => setIsModalOpen(false) : undefined}
      />

      <ProductInfoModal
        isOpen={isProductInfoModalOpen}
        onClose={() => setIsProductInfoModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />

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
}

export default CUST0020;
