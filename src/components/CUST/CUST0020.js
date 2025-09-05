import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Package, List, Grid3X3, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../common/Modal';
import { useMenu } from '../../context/MenuContext';
import { useCustomerApi, useErrorHandler } from '../../hooks'; // 커스텀 훅 사용
import './CUST0020.css';
import MySpinner from '../common/MySpinner'; 

function CUST0020() {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' 또는 'image'
  const [itemName, setItemName] = useState('');
  const [gridData, setGridData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(true); // 검색영역 표시 상태
  
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

    // 아래로 스와이프하면 검색영역 열기
    if (isDownSwipe && !isSearchVisible) {
      setIsSearchVisible(true);
    }
    // 위로 스와이프하면 검색영역 닫기
    else if (isUpSwipe && isSearchVisible) {
      setIsSearchVisible(false);
    }
  };

  // 검색영역 외부 클릭시 닫기
  const handleClickOutside = useCallback((event) => {
    if (searchToggleRef.current && !searchToggleRef.current.contains(event.target)) {
      // 모바일에서만 작동하도록 체크
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
    setCurrentPage(1); // 페이지도 초기화
  };

  // ✨ fetchData 함수를 새 API 규격에 맞게 수정합니다.
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // GET 방식으로 URL에 쿼리 파라미터를 사용하여 요청합니다.
      const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/CUST0020?p_itemNm=${itemName}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('⌛ 서버 에러 응답:', errorText);
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      
      setGridData(data);
      setCurrentPage(1); // 새로운 검색 시 첫 페이지로

    } catch (error) {
      console.error('⌛ 데이터 조회 실패:', error);
      setIsModalOpen(true);
      setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [itemName]);

  // 검색 버튼 클릭
  const handleSearch = () => {
    fetchData();
    // 모바일에서 검색 후 검색영역 숨기기
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  // 검색영역 토글
  const toggleSearchArea = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 뷰 모드 변경
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // 행 클릭 처리
  const handleRowClick = (item) => {
    console.log('선택된 아이템:', item);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 첫 페이지로 이동
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
              <th style={{ width: '150px' }}>제품코드</th>
              <th>제품명</th>
              <th>스펙</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map((row, index) => (
              <tr key={row.itemCd || index} onClick={() => handleRowClick(row)}>
                <td className="cust0020-center-column">
                  <div className="cust0020-list-image-wrapper">
                    {row.filePath ? (
                      <img 
                        src={row.filePath || row.thFilePath} 
                        alt={row.itemNm || '제품 이미지'}
                        className="cust0020-list-image"
                        onError={(e) => {
                          const parent = e.target.parentElement;
                          if (parent) {
                            e.target.style.display = 'none';
                            const fallback = parent.querySelector('.fallback-icon');
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    
                    <div 
                      className="fallback-icon"
                      style={{ display: row.filePath ? 'none' : 'flex' }}
                    >
                      <Package size={24} />
                    </div>
                  </div>
                </td>
                <td className="cust0020-center-column cust0020-item-code">
                  {row.itemCd}
                </td>
                <td className="cust0020-left-column cust0020-item">
                  {row.itemNm}
                </td>
                <td className="cust0020-left-column cust0020-item">
                  {row.spec}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="cust0020-center-column" style={{ padding: '40px', color: '#666' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 이미지 뷰 렌더링
  const renderImageView = () => (
    <div className="cust0020-image-container">      
      <div className="cust0020-image-grid">
        {currentItems.length > 0 ? currentItems.map((row, index) => (
          <div 
            key={row.itemCd || index} 
            className="cust0020-image-card"
            onClick={() => handleRowClick(row)}
          >
            <div className="cust0020-image-placeholder">
              {row.filePath ? (
                <img 
                  src={row.filePath || row.thFilePath} 
                  alt={row.itemNm || '제품 이미지'}
                  className="cust0020-card-image"
                  onError={(e) => {
                    const parent = e.target.parentElement;
                    if(parent) {
                      e.target.style.display = 'none';
                      const fallback = parent.querySelector('.fallback-icon');
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              
              <div 
                className="fallback-icon"
                style={{ 
                  display: row.filePath ? 'none' : 'flex',
                  flexDirection: 'column'
                }}
              >
                <Package size={48} color="#ccc" />
                <span style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                  이미지 없음
                </span>
              </div>
            </div>
            
            <div className="cust0020-card-content">
              <h3>{row.itemNm}</h3>
              <div className="item-code">{row.itemCd}</div>
              {row.spec && <div className="item-eng-name">{row.spec}</div>}
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
            데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );

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
            리스트
          </button>
          <button
            className={`cust0020-view-btn ${viewMode === 'image' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('image')}
          >
            <Grid3X3 size={16} />
            이미지
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

      {/* 모달 */}
      <Modal
        isOpen={isModalOpen}
        title="알림"
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default CUST0020;