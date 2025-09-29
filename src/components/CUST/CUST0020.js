import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Package, List, ImageIcon, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, Info } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import ImageModal from '../common/ImageModal';
import ProductInfoModal from '../common/ProductInfoModal';
import { useMenu } from '../../context/MenuContext';
import { useAuth } from '../../context/AuthContext';
import { productAPI, commonAPI } from '../../services/api';
import './CUST0020.css';
import MySpinner from '../common/MySpinner';
import { toast } from 'react-toastify';

function CUST0020() {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [viewMode, setViewMode] = useState('image');
  const [itemName, setItemName] = useState('');
  const [gridData, setGridData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  
  // 카테고리 관련 상태
  const [categoryLData, setCategoryLData] = useState([]); // 대분류
  const [categoryMData, setCategoryMData] = useState([]); // 중분류
  const [categorySData, setCategorySData] = useState([]); // 소분류
  const [selectedCategoryL, setSelectedCategoryL] = useState(''); // 선택된 대분류
  const [selectedCategoryM, setSelectedCategoryM] = useState(''); // 선택된 중분류
  const [selectedCategoryS, setSelectedCategoryS] = useState(''); // 선택된 소분류
  
  // 이미지 모달 상태 추가
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({
    url: '',
    title: '',
    alt: ''
  });
  
  // 상품 정보 모달 상태 추가
  const [isProductInfoModalOpen, setIsProductInfoModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // 스와이프 제스처용 ref와 상태
  const searchToggleRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // 스와이프 최소 거리 (픽셀)
  const minSwipeDistance = 50;
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // 메뉴 컨텍스트에서 현재 메뉴 타이틀 가져오기
  const { currentMenuTitle } = useMenu();
  const { globalState } = useAuth();
  const navigate = useNavigate();

  // 이미지 클릭 핸들러
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

  // 상품 정보 모달 핸들러
  const handleProductInfoClick = (product) => {
    setSelectedProduct(product);
    setIsProductInfoModalOpen(true);
  };

  // 카테고리 핸들러 전역 선언
  // 대분류 변경 시 중분류, 소분류 초기화
  const handleCategoryLChange = (value) => {
    setSelectedCategoryL(value);
    setSelectedCategoryM(''); // 중분류 초기화
    setSelectedCategoryS(''); // 소분류 초기화
  };

  // 중분류 변경 시 소분류 초기화
  const handleCategoryMChange = (value) => {
    setSelectedCategoryM(value);
    setSelectedCategoryS(''); // 소분류 초기화
  };

  // 소분류 변경
  const handleCategorySChange = (value) => {
    setSelectedCategoryS(value);
  };

  // 선택된 대분류에 해당하는 중분류 필터링
  const getFilteredCategoryM = () => {
    if (!selectedCategoryL) return categoryMData;
    return categoryMData.filter(item => item.catLCd === selectedCategoryL);
  };

  // 선택된 중분류에 해당하는 소분류 필터링
  const getFilteredCategoryS = () => {
    if (!selectedCategoryM) return [];
    return categorySData.filter(item => item.catMCd === selectedCategoryM);
  };

  // 장바구니 추가 핸들러 - 로그인 체크 추가
  const handleAddToCart = async (productWithQuantity) => {
    // 로그인 체크
    const isLoggedIn = !!globalState.G_USER_ID;
    if (!isLoggedIn) {
      setModalMessage('장바구니 기능을 사용하려면 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?');
      setIsModalOpen(true);
      return;
    }
    
    try {
      
      // 장바구니 데이터 준비
      const cartItem = {
        itemCd: productWithQuantity.itemCd,
        itemNm: productWithQuantity.itemNm,
        unitNm: productWithQuantity.unitNm,
        price: productWithQuantity.outUnitPrice || 0, // price 필드로 수정
        outUnitPrice: productWithQuantity.outUnitPrice,
        quantity: productWithQuantity.quantity,
        spec: productWithQuantity.spec,
        optCd: productWithQuantity.optCd,
        optValCd: productWithQuantity.optValCd || '', // 옵션값 코드 추가
        optValNm: productWithQuantity.optValNm || '', // 옵션값명 추가
        filePath: productWithQuantity.filePath || productWithQuantity.thFilePath,
        totalAmount: (productWithQuantity.outUnitPrice || 0) * productWithQuantity.quantity
      };


      // 로컬 스토리지에 장바구니 데이터 저장
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // 이미 있는 상품인지 확인 (옵션값도 고려)
      const existingItemIndex = existingCart.findIndex(item => 
        item.itemCd === cartItem.itemCd && 
        item.optCd === cartItem.optCd &&
        item.optValCd === cartItem.optValCd
      );
      
      let isNewItem = true;
      if (existingItemIndex > -1) {
        // 이미 있는 상품이면 수량 추가
        existingCart[existingItemIndex].quantity += cartItem.quantity;
        existingCart[existingItemIndex].totalAmount = 
          existingCart[existingItemIndex].quantity * (existingCart[existingItemIndex].price || 0);
        isNewItem = false;
      } else {
        // 새로운 상품이면 추가
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // Toast 성공 알림 표시 (기존 모달 대신)
      const optionText = productWithQuantity.optValNm ? ` (옵션: ${productWithQuantity.optValNm})` : '';
      const actionText = isNewItem ? '추가되었습니다' : '수량이 업데이트되었습니다';
      
      toast.success(
        `🛒 ${productWithQuantity.itemNm}${optionText}\n${productWithQuantity.quantity}개 ${actionText}\n총 ${existingCart.length}개 상품`
      );
    
    // 상품 정보 모달 닫기
    setIsProductInfoModalOpen(false);
      
    } catch (error) {
      console.error('장바구니 추가 오류:', error);
      
      // Toast 에러 알림 (기존 모달 대신)
      toast.error('장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  // 장바구니 내용 확인 함수 (디버깅용)
  const checkCartContents = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart;
  };

  // 장바구니 초기화 함수 (디버깅용)
  const clearCart = () => {
    localStorage.removeItem('cart');
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  // 컴포너트 마운트 시 디버깅용 전역 함수 등록
  useEffect(() => {
    // 브라우저 콘솔에서 장바구니 확인할 수 있도록 전역 함수로 등록
    window.checkCart = checkCartContents;
    window.clearCart = clearCart;
    
    return () => {
      // 컴포너트 언마운트 시 전역 함수 제거
      delete window.checkCart;
      delete window.clearCart;
    };
  }, []);

  // 스와이프 시작
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  // 스와이프 중
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  // 스와이프 종료
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isDownSwipe && !isSearchVisible) {
      setIsSearchVisible(true);
    }
    else if (isUpSwipe && isSearchVisible) {
      setIsSearchVisible(false);
    }
  };

  // 검색영역 외부 클릭시 닫기
  const handleClickOutside = useCallback((event) => {
    if (searchToggleRef.current && !searchToggleRef.current.contains(event.target)) {
      if (window.innerWidth <= 768 && isSearchVisible) {
        setIsSearchVisible(false);
      }
    }
  }, [isSearchVisible]);

  // 외부 클릭 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // 페이지네이션 계산
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

  // 검색 초기화
  const handleReset = () => {
    setItemName('');
    setSelectedCategoryL('');
    setSelectedCategoryM('');
    setSelectedCategoryS('');
    setCurrentPage(1);
  };

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
      console.error('⌛ 데이터 조회 실패:', error);
      setIsModalOpen(true);
      setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [itemName, selectedCategoryL, selectedCategoryM, selectedCategoryS]);

  // 초기 데이터 로드 (빈 검색 조건으로 전체 데이터 로드)
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await productAPI.getProductList('', '', '', '');
      
      setGridData(data);
      setCurrentPage(1);

    } catch (error) {
      console.error('⌛ 초기 데이터 로드 실패:', error);
      setIsModalOpen(true);
      setModalMessage(`데이터 로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색 버튼 클릭
  const handleSearch = () => {
    fetchData();
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  // 검색영역 토글
  const toggleSearchArea = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  // 컴포넌트 마운트 시 카테고리 데이터 로드 및 초기 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // 대분류, 중분류, 소분류 데이터를 동시에 로드
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
    fetchInitialData(); // 초기에는 빈 검색으로 전체 데이터 로드
  }, []); // 빈 배열로 변경하여 마운트 시에만 실행

  // 뷰 모드 변경
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // 행 클릭 처리
  const handleRowClick = (item) => {

  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // 페이지 번호 생성
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

  // 리스트 뷰 렌더링
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
              <tr key={row.itemCd || index} onClick={() => handleRowClick(row)}>
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
                <td className="cust0020-center-column">
                  {row.itemCd || '-'}
                </td>
                <td className="cust0020-left-column cust0020-item cust0020-product-name" 
                     onClick={(e) => {
                       e.stopPropagation();
                       handleProductInfoClick(row);
                     }}>
                  {row.itemNm}
                </td>
                <td className="cust0020-center-column">
                  {row.unitNm || '-'}
                </td>
                <td className="cust0020-right-column">
                  {row.outUnitPrice ? row.outUnitPrice.toLocaleString() : '-'}
                </td>
                <td className="cust0020-left-column cust0020-item">
                  {row.spec}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="cust0020-center-column" style={{ padding: '40px', color: '#666' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 이미지 뷰 렌더링 (CUST0010 스타일 적용)
  const renderImageView = () => {
    const items = currentItems.map((item, index) => (
      <div key={`${item.itemCd}-${index}`} className="cust0020-inventory-image-card">
        <div className="cust0020-inventory-image-header">
          <h4>{item.itemNm}</h4>
          <span className="cust0020-product-status-badge">
            상품
          </span>
        </div>
        <div className="cust0020-inventory-image-content">
          {/* 이미지 섹션 */}
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
          
          {/* 상세 정보 섹션 - 여기에 옵션과 단위를 추가 */}
          <div className="cust0020-inventory-item-details">
            <div className="cust0020-inventory-item-specs">
              {item.optCd && (
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
              {/* 데이터가 없을 때 기본 메시지 */}
              {!item.optCd && !item.unitNm && (item.outUnitPrice === undefined || item.outUnitPrice === null) && (
                <div className="cust0020-inventory-spec-row">
                  <span className="cust0020-inventory-spec-label" style={{ color: '#999', fontStyle: 'italic' }}>상세 정보 없음</span>
                  <span className="cust0020-inventory-spec-value">-</span>
                </div>
              )}
            </div>
            {/* 상품 정보 버튼을 이미지와 텍스트 밑에 긴 버튼으로 배치 */}
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
  
  return (
    <div className="cust0020-container">
      {/* 프로그램 헤더 */}
      <div className="cust0020-program-header">
        <div className="cust0020-header-left">
          <Package className="w-6 h-6" />
          <h1>{currentMenuTitle || '제품정보 관리'}</h1>
        </div>
        
        {/* 뷰 모드 선택 */}
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

      {/* 검색 영역 - 스와이프 제스처 추가 */}
      <div 
        className="cust0020-search-section"
        ref={searchToggleRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 모바일 검색 토글 버튼 */}
        <div className="cust0020-mobile-search-toggle" onClick={toggleSearchArea}>
          <span>검색 옵션 </span>
          {isSearchVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        
        <div className={`cust0020-search-container ${isSearchVisible ? 'visible' : 'hidden'}`}>
          <div className="cust0020-search-row">
            {/* 대분류 */}
            <div className="cust0020-search-field">
              <label>대분류</label>
              <select
                value={selectedCategoryL}
                onChange={(e) => handleCategoryLChange(e.target.value)}
              >
                <option value="">전체</option>
                {categoryLData.map((category) => (
                  <option key={category.catLCd} value={category.catLCd}>
                    {category.catLNm}
                  </option>
                ))}
              </select>
            </div>

            {/* 중분류 */}
            <div className="cust0020-search-field">
              <label>중분류</label>
              <select
                value={selectedCategoryM}
                onChange={(e) => handleCategoryMChange(e.target.value)}
                disabled={!selectedCategoryL}
              >
                <option value="">전체</option>
                {getFilteredCategoryM().map((category) => (
                  <option key={category.catMCd} value={category.catMCd}>
                    {category.catMNm}
                  </option>
                ))}
              </select>
            </div>

            {/* 소분류 */}
            <div className="cust0020-search-field">
              <label>소분류</label>
              <select
                value={selectedCategoryS}
                onChange={(e) => handleCategorySChange(e.target.value)}
                disabled={!selectedCategoryM}
              >
                <option value="">전체</option>
                {getFilteredCategoryS().map((category) => (
                  <option key={category.catSCd} value={category.catSCd}>
                    {category.catSNm}
                  </option>
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

      {/* 페이지네이션 정보 및 설정 */}
      <div className="cust0020-pagination-info">
        <div className="cust0020-data-info">
          전체 {gridData.length.toLocaleString()}건 중 {gridData.length > 0 ? startIndex.toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
        </div>
        <div className="cust0020-page-size-selector">
          <label>페이지당 표시:</label>
          <select 
            value={itemsPerPage} 
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          >
            <option value={10}>10개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={80}>80개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      {viewMode === 'list' ? renderListView() : renderImageView()}

      {/* 페이지네이션 */}
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

      {/* 로딩 표시 */}
      {isLoading && <MySpinner fullScreen={false} />}

      {/* 기본 모달 */}
      <Modal
        isOpen={isModalOpen}
        title="알림"
        message={modalMessage}
        onConfirm={() => {
          setIsModalOpen(false);
          // 로그인 관련 메시지인 경우 로그인 페이지로 이동
          if (modalMessage.includes('로그인 페이지로 이동')) {
            navigate('/login');
          }
        }}
        onCancel={modalMessage.includes('로그인 페이지로 이동') ? () => setIsModalOpen(false) : undefined}
      />

      {/* 상품 정보 모달 */}
      <ProductInfoModal
        isOpen={isProductInfoModalOpen}
        onClose={() => setIsProductInfoModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />

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
}

export default CUST0020;