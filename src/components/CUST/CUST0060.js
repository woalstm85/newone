import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Package, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { CiImageOff } from 'react-icons/ci';
import Modal from '../common/Modal';
import ImageModal from '../common/ImageModal';
import LazyImage from '../common/LazyImage';
import { useMenu } from '../../context/MenuContext';
import { useAuth } from '../../context/AuthContext';
import './CUST0060.css';
import MySpinner from '../common/MySpinner';

function CUST0060() {
  // 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [gridData, setGridData] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  // 검색 조건 - CUST0040처럼 년월 검색
  const [selectedMonth, setSelectedMonth] = useState('');
  const [itemName, setItemName] = useState(''); // 추가 검색 옵션
  const [inOutDiv, setInOutDiv] = useState(''); // 입/출고구분

  // 이미지 모달 상태 - 갤러리 지원
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);      // 확대할 이미지 배열 (갤러리용)
  const [selectedImageTitle, setSelectedImageTitle] = useState(''); // 이미지 모달 제목

  // 스와이프 제스처용 ref와 상태
  const searchToggleRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // 컨텍스트
  const { currentMenuTitle } = useMenu();
  const { globalState } = useAuth();

  // 현재 년월 기본값 설정
  useEffect(() => {
    const currentDate = new Date();
    const currentYM = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(currentYM);
  }, []);

  /** 
   * 이미지 클릭 시 확대 모달 열기
   * - 목록: thFilePath (썸네일) 표시
   * - 확대: filePath (원본) + fileData 배열이 있으면 갤러리로 표시
   */
  const handleImageClick = (item) => {
    // 이미지 배열 구성
    const images = [];
    
    // 1. 메인 이미지 (filePath)
    if (item.filePath) {
      images.push({
        url: item.filePath,
        alt: `${item.itemNm || ''} 대표 이미지`,
        title: item.itemNm || ''
      });
    }
    
    // 2. fileData 배열의 이미지들 추가
    if (item.fileData && Array.isArray(item.fileData) && item.fileData.length > 0) {
      item.fileData.forEach((file, index) => {
        // filePath와 중복되지 않는 경우만 추가
        if (file.filePath && file.filePath !== item.filePath) {
          images.push({
            url: file.filePath,
            alt: `${item.itemNm || ''} 이미지 ${index + 1}`,
            title: file.realNm || `이미지 ${index + 1}`
          });
        }
      });
    }
    
    // 3. 이미지가 하나도 없으면 thFilePath로 대체
    if (images.length === 0 && item.thFilePath) {
      images.push({
        url: item.thFilePath,
        alt: `${item.itemNm || ''} 이미지`,
        title: item.itemNm || ''
      });
    }
    
    if (images.length > 0) {
      setSelectedImages(images);
      setSelectedImageTitle(item.itemNm || '');
      setIsImageModalOpen(true);
    }
  };

  // 스와이프 관련 핸들러들
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

  // 검색영역 외부 클릭시 닫기
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

  // 페이지네이션 계산
  const { currentItems, totalPages, startIndex, endIndex } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    let filteredData = gridData;

    // 품목명 필터링
    if (itemName.trim()) {
      filteredData = filteredData.filter(item =>
        (item.itemNm && item.itemNm.toLowerCase().includes(itemName.trim().toLowerCase())) ||
        (item.itemCd && item.itemCd.toLowerCase().includes(itemName.trim().toLowerCase()))
      );
    }

    // 입/출고구분 필터링
    if (inOutDiv) {
      filteredData = filteredData.filter(item => item.inOutDiv === inOutDiv);
    }

    const currentItems = filteredData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      startIndex: startIdx + 1,
      endIndex: Math.min(endIdx, filteredData.length)
    };
  }, [gridData, currentPage, itemsPerPage, itemName, inOutDiv]);

  // API 호출 함수
  const fetchData = useCallback(async () => {
    if (!globalState.G_USER_ID || !selectedMonth) {
      return;
    }

    try {
      setLoading(true);
      
      const url = `https://api.newonetotal.co.kr/Comm/CUST0060?ym=${selectedMonth}&userId=${globalState.G_USER_ID}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setGridData(data);
      } else {
        setGridData([]);
        console.warn('예상치 못한 API 응답 형식:', data);
      }

    } catch (error) {
      console.error('입출고현황 데이터 조회 실패:', error);
      setGridData([]);
      setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, globalState.G_USER_ID]);

  // 검색 버튼 클릭
  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  // 검색 초기화
  const handleReset = () => {
    setItemName('');
    setInOutDiv(''); // 입/출고구분 초기화
    setCurrentPage(1);
  };

  // 검색영역 토글
  const toggleSearchArea = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth, globalState.G_USER_ID]);

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

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 입출고 구분에 따른 스타일
  const getInOutBadgeClass = (inOutDiv) => {
    switch (inOutDiv) {
      case '입고': return 'in-badge';
      case '출고': return 'out-badge';
      default: return 'default-badge';
    }
  };

  // 옵션 표시 여부 확인 함수 (CUST0010, CUST0020와 동일)
  const shouldShowOption = (optCd, optValNm) => {
    // optCd가 없거나 'OP0000'이면 표시하지 않음
    if (!optCd || optCd === 'OP0000') return false;
    // optValNm이 있으면 표시
    if (optValNm && optValNm.trim() !== '') return true;
    return false;
  };

  // 리스트 뷰 렌더링
  const renderListView = () => (
    <div className="cust0060-table-container">
      <table className="cust0060-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>이미지</th>
            <th style={{ width: '100px' }}>거래일자</th>
            <th style={{ width: '120px' }}>입고형태</th>
            <th style={{ width: '80px' }}>구분</th>
            <th>품목명</th>
            <th style={{ width: '100px' }}>옵션</th>
            <th style={{ width: '80px' }}>수량</th>
            <th style={{ width: '100px' }}>금액</th>
            <th style={{ width: '120px' }}>로케이션</th>            
            <th style={{ width: '100px' }}>담당자</th>
            <th style={{ width: '100px' }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? currentItems.map((row, index) => (
            <tr key={`${row.hisId}-${index}`} onClick={() => handleRowClick(row)}>
              <td className="cust0060-center">
                <div className="cust0060-table-image" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {row.thFilePath || row.filePath ? (
                    <div className="cust0060-table-image-container">
                      <LazyImage
                        src={row.thFilePath || row.filePath}
                        alt={row.itemNm}
                        className="cust0060-table-image-item"
                      />
                      <div className="cust0060-table-image-overlay">
                        <button
                          className="cust0060-table-overlay-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(row);
                          }}
                          title={row.fileData && row.fileData.length > 0 ? `이미지 ${row.fileData.length}개` : '확대 보기'}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cust0060-table-no-image">
                      <CiImageOff size={20} color="#ccc" />
                    </div>
                  )}
                </div>
              </td>
              <td className="cust0060-center">{formatDate(row.transDate)}</td>
              <td className="cust0060-center">{row.transTypeNm}</td>
              <td className="cust0060-center">
                <span className={`badge ${getInOutBadgeClass(row.inOutDiv)}`}>
                  {row.inOutDiv === '입고' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {row.inOutDiv}
                </span>
              </td>
              <td className="cust0060-left">
                <div className="cust0060-item-info">
                  {row.itemCd && (
                    <span className="cust0060-item-code">{row.itemCd}</span>
                  )}
                  <span className="cust0060-item-name">{row.itemNm}</span>
                </div>
              </td>
              <td className="cust0060-center">
                {shouldShowOption(row.optCd, row.optValNm) ? (
                  <span className="cust0060-option-badge">
                    {row.optValNm}
                  </span>
                ) : '-'}
              </td>
              <td className="cust0060-right">{formatAmount(row.qty)}</td>
              <td className="cust0060-right">{formatAmount(row.amount)}</td>
              <td className="cust0060-center">
                {row.locCd && (
                  <span className="cust0060-location-badge">
                    📍 {row.locCd}
                  </span>
                )}
              </td>              
              <td className="cust0060-center">{row.userNm}</td>
              <td className="cust0060-left">{row.remark || '-'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={11} className="cust0060-center" style={{ padding: '40px', color: '#666' }}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="cust0060-container">
      {/* 프로그램 헤더 */}
      <div className="cust0060-program-header">
        <div className="cust0060-header-left">
          <Package className="w-6 h-6" />
          <h1>{currentMenuTitle || '품목 입출고현황'}</h1>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="cust0060-search-section">
        {/* 모바일 검색 토글 버튼 */}
        <div
          ref={searchToggleRef}
          className="cust0060-mobile-search-toggle"
          onClick={toggleSearchArea}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <span>검색 옵션</span>
          {isSearchVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        <div className={`cust0060-search-container ${isSearchVisible ? 'visible' : 'hidden'}`}>
          <div className="cust0060-search-row">
            <div className="cust0060-search-field">
              <label>조회월</label>
              <input
                type="month"
                value={selectedMonth ? `${selectedMonth.substring(0,4)}-${selectedMonth.substring(4,6)}` : ''}
                onChange={(e) => {
                  const value = e.target.value.replace('-', '');
                  setSelectedMonth(value);
                }}
              />
            </div>

            <div className="cust0060-search-field">
              <label>구분</label>
              <select
                value={inOutDiv}
                onChange={(e) => setInOutDiv(e.target.value)}
              >
                <option value="">전체</option>
                <option value="입고">입고</option>
                <option value="출고">출고</option>
              </select>
            </div>

            <div className="cust0060-search-field">
              <label>품목명</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="품목명, 품목코드 입력"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="cust0060-search-buttons">
              <button className="cust0060-search-btn" onClick={handleSearch}>
                <Search size={16} />
                검색
              </button>
              <button className="cust0060-reset-btn" onClick={handleReset}>
                <RotateCcw size={16} />
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 페이지네이션 정보 및 설정 */}
      <div className="cust0060-pagination-info">
        <div className="cust0060-data-info">
          전체 {gridData.length.toLocaleString()}건 중 {gridData.length > 0 ? startIndex.toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
        </div>
        <div className="cust0060-page-size-selector">
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
      <div className="cust0060-grid-container">
        <div className="cust0060-grid-wrapper">
          {renderListView()}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="cust0060-pagination">
          {/* 처음으로 */}
          <button
            className="cust0060-page-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            처음으로
          </button>
          
          {/* 이전 */}
          <button
            className="cust0060-page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            이전
          </button>

          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`cust0060-page-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          {/* 다음 */}
          <button
            className="cust0060-page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight size={16} />
          </button>
          
          {/* 끝으로 */}
          <button
            className="cust0060-page-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            끝으로
          </button>
        </div>
      )}

      {/* 로딩 표시 */}
      {loading && <MySpinner />}

      {/* 기본 모달 */}
      <Modal
        isOpen={isModalOpen}
        title="알림"
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
      />

      {/* 이미지 모달 - 갤러리 지원 */}
      <ImageModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        images={selectedImages}
        title={selectedImageTitle}
      />
    </div>
  );
}

export default CUST0060;