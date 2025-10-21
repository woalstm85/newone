/**
 * ============================================================================
 * CUST0040.js - 견적의뢰 관리
 * ============================================================================
 * 주요 기능:
 * 1. 견적의뢰 목록 조회 (월별 조회)
 * 2. 리스트/이미지 뷰 모드 전환
 * 3. 견적번호, 고객명, 담당자명 검색
 * 4. 견적의뢰 상세 정보 모달
 * 5. 진행상태별 색상 구분
 * 6. 페이지네이션 및 페이지 크기 조절
 * 7. 반응형 디자인 (모바일/태블릿/데스크톱)
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, List, ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { quoteAPI } from '../../services/api';
import Modal from '../common/Modal';
import QuoteDetailModal from '../modals/QuoteDetailModal';
import MySpinner from '../common/MySpinner';
import './CUST0040.css';

const CUST0040 = () => {
  // ==================== 상태 관리 ====================
  
  // 데이터 및 로딩
  const [quotesData, setQuotesData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 뷰 모드 및 검색
  const [viewMode, setViewMode] = useState('image');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // 상태값 검색 추가
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isQuoteDetailModalOpen, setIsQuoteDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // 검색 영역 토글 (모바일)
  const [isSearchVisible, setIsSearchVisible] = useState(window.innerWidth > 768);
  
  // 스와이프 제스처
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Context
  const { globalState } = useAuth();
  const { currentMenuTitle } = useMenu();
  const searchToggleRef = useRef(null);

  // ==================== 초기화 ====================
  
  /**
   * 현재 년월 기본값 설정
   */
  useEffect(() => {
    const currentDate = new Date();
    const currentYM = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(currentYM);
  }, []);

  // ==================== 유틸리티 함수 ====================
  
  /**
   * 날짜 포맷팅 (YYYYMMDD -> YYYY-MM-DD)
   */
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

  /**
   * 금액 포맷팅
   */
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  /**
   * 진행상태에 따른 배지 클래스 반환
   */
  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-default';
    const statusText = status.toString().toLowerCase();
    
    if (statusText.includes('접수') || statusText === '접수') {
      return 'status-received';
    } else if (statusText.includes('처리') || statusText.includes('진행')) {
      return 'status-processing';
    } else if (statusText.includes('완료')) {
      return 'status-completed';
    }
    return 'status-default';
  };

  /**
   * 페이지 번호 생성
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

  // ==================== 페이지네이션 ====================
  
  const { currentItems, totalPages, startIndex, endIndex, totalItems } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    let filteredData = quotesData;

    // 검색 필터링
    if (searchTerm.trim()) {
      filteredData = filteredData.filter(item =>
        (item.reqNo && item.reqNo.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
        (item.custNm && item.custNm.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
        (item.contactNm && item.contactNm.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      );
    }

    // 상태값 필터링 추가
    if (selectedStatus) {
      filteredData = filteredData.filter(item => item.reqStatus === selectedStatus);
    }

    const currentItems = filteredData.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      startIndex: startIdx + 1,
      endIndex: Math.min(endIdx, filteredData.length),
      totalItems: filteredData.length
    };
  }, [quotesData, currentPage, itemsPerPage, searchTerm, selectedStatus]);

  // ==================== 이벤트 핸들러 ====================
  
  /**
   * 검색 실행
   */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchQuotesData();
    if (window.innerWidth <= 768) {
      setIsSearchVisible(false);
    }
  };

  /**
   * 뷰 모드 변경
   */
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  /**
   * 검색 영역 토글
   */
  const toggleSearchArea = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  /**
   * 스와이프 제스처 처리
   */
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
    }
    else if (isUpSwipe && isSearchVisible) {
      setIsSearchVisible(false);
    }
  };

  /**
   * 검색 영역 외부 클릭 시 닫기 (모바일)
   */
  const handleClickOutside = useCallback((event) => {
    if (searchToggleRef.current && !searchToggleRef.current.contains(event.target)) {
      if (window.innerWidth <= 768 && isSearchVisible) {
        setIsSearchVisible(false);
      }
    }
  }, [isSearchVisible]);

  /**
   * 견적의뢰 상세 모달 열기
   */
  const handleQuoteDetailClick = (quote) => {
    setSelectedQuote(quote);
    setIsQuoteDetailModalOpen(true);
  };

  /**
   * 견적의뢰 상세 모달 닫기
   */
  const handleQuoteDetailClose = () => {
    setIsQuoteDetailModalOpen(false);
    setSelectedQuote(null);
  };

  /**
   * 행 클릭 처리
   */
  const handleRowClick = (quote) => {
    handleQuoteDetailClick(quote);
  };

  /**
   * 페이지 변경
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  /**
   * 페이지 크기 변경
   */
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // ==================== 데이터 로드 ====================
  
  /**
   * API 데이터 조회
   */
  const fetchQuotesData = useCallback(async () => {
    if (!globalState.G_USER_ID || !selectedMonth) {
      return;
    }

    try {
      setLoading(true);
      
      const data = await quoteAPI.getQuoteRequests(selectedMonth, globalState.G_USER_ID);
      
      if (data && Array.isArray(data)) {
        setQuotesData(data);
      } else {
        setQuotesData([]);
        console.warn('예상치 못한 API 응답 형식:', data);
      }
    } catch (error) {
      console.error('견적의뢰 데이터 조회 실패:', error);
      setQuotesData([]);
      setModalMessage(`데이터 조회 중 오류가 발생했습니다: ${error.message}`);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, globalState.G_USER_ID]);

  // ==================== 생명주기 ====================
  
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    if (selectedMonth && globalState.G_USER_ID) {
      fetchQuotesData();
    }
  }, [selectedMonth, globalState.G_USER_ID, fetchQuotesData]);

  // ==================== 렌더링 함수 ====================
  
  /**
   * 리스트뷰 렌더링
   */
  const renderListView = () => (
    <div className="cust0040-table-container">
      <table className="cust0040-table">
        <thead>
          <tr>
            <th style={{ width: '100px' }}>진행상태</th>                  
            <th style={{ width: '120px' }}>견적번호</th>
            <th style={{ width: '100px' }}>요청일자</th>
            <th style={{ width: '100px' }}>담당자</th>
            <th style={{ width: '120px' }}>연락처</th>
            <th>주소</th>
            <th style={{ width: '100px' }}>희망납기</th>
            <th style={{ width: '80px' }}>품목수</th>
            <th style={{ width: '100px' }}>상세보기</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((quote, index) => (
              <tr 
                key={`${quote.reqNo}-${index}`}
                className="cust0040-quote-main-row" 
                onClick={() => handleRowClick(quote)}
                style={{ cursor: 'pointer' }}
              >
                <td className="cust0040-center">
                  <span className={`cust0040-status-badge ${getStatusBadgeClass(quote.reqStatus)}`}>
                    {quote.reqStatus || '-'}
                  </span>
                </td>
                <td className="cust0040-center" style={{ fontWeight: '600', color: '#007bff' }}>
                  {quote.reqNo}
                </td>
                <td className="cust0040-center">{formatDate(quote.reqDate)}</td>
                <td className="cust0040-center">{quote.contactNm}</td>
                <td className="cust0040-center">{quote.contactTel}</td>
                <td className="cust0040-left">{quote.siteNm}</td>
                <td className="cust0040-center">{formatDate(quote.dueDate)}</td>
                <td className="cust0040-center">
                  <span className="cust0040-quote-item-count-badge">
                    {quote.subData?.length || 0}건
                  </span>
                </td>
                <td className="cust0040-center">
                  <button 
                    className="cust0040-quote-detail-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuoteDetailClick(quote);
                    }}
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="cust0040-center" style={{ padding: '40px', color: '#666' }}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * 이미지뷰 렌더링
   */
  const renderImageView = () => (
    <div className="cust0040-image-container">
      <div className="cust0040-image-grid">
        {currentItems.length > 0 ? (
          currentItems.map((quote, index) => (
            <div 
              key={`${quote.reqNo}-${index}`} 
              className="cust0040-image-card"
              onClick={() => handleRowClick(quote)}
            >
              <div className="cust0040-card-header">
                <div className="cust0040-quote-number">
                  견적번호: {quote.reqNo}
                </div>
                <div className={`cust0040-quote-status ${getStatusBadgeClass(quote.reqStatus)}`}>
                  {quote.reqStatus || '-'}
                </div>
              </div>
              
              <div className="cust0040-card-content">
                <div className="cust0040-quote-info-row">
                  <span className="cust0040-label">요청일자:</span>
                  <span className="cust0040-value date-request">{formatDate(quote.reqDate)}</span>
                </div>
                
                <div className="cust0040-quote-info-row">
                  <span className="cust0040-label">희망납기:</span>
                  <span className="cust0040-value date-due">{formatDate(quote.dueDate)}</span>
                </div>
                
                <div className="cust0040-quote-info-row">
                  <span className="cust0040-label">담당자:</span>
                  <span className="cust0040-value">
                    {quote.contactNm} [{quote.contactTel}]
                  </span>
                </div>
                
                <div className="cust0040-quote-info-row cust0040-address-row">
                  <span className="cust0040-label">주소:</span>
                  <span className="cust0040-value cust0040-address" title={quote.siteNm}>
                    {quote.siteNm}
                  </span>
                </div>
                
                <div className="cust0040-quote-summary">
                  <div className="cust0040-item-count">
                  <span className="cust0040-quote-item-count-badge">
                  {quote.subData?.length || 0}건
                  </span>
                  </div>
                  
                  <button 
                    className="cust0040-detail-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuoteDetailClick(quote);
                    }}
                  >
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="cust0040-no-data">
            <FileText size={48} className="cust0040-no-data-icon" />
            <p>데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== 메인 렌더링 ====================

  return (
    <div className="cust0040-container">
      {/* 프로그램 헤더 */}
      <div className="cust0040-program-header">
        <div className="cust0040-header-left">
          <FileText className="w-6 h-6" />
          <h1>{currentMenuTitle || '견적의뢰 관리'}</h1>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="cust0040-view-toggle">
          <button
            className={`cust0040-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
            title="리스트 보기"
          >
            <List size={16} />
          </button>
          <button
            className={`cust0040-view-btn ${viewMode === 'image' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('image')}
            title="이미지 보기"
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="cust0040-search-section">
        <div
          ref={searchToggleRef}
          className="cust0040-mobile-search-toggle"
          onClick={toggleSearchArea}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <span>검색 옵션</span>
          {isSearchVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        <div className={`cust0040-search-container ${isSearchVisible ? 'visible' : 'hidden'}`}>
          <div className="cust0040-search-row">
            <div className="cust0040-search-field">
              <label>조회월</label>
              <input
                type="month"
                value={selectedMonth ? `${selectedMonth.substring(0,4)}-${selectedMonth.substring(4,6)}` : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const yearMonth = value.replace('-', '');
                  setSelectedMonth(yearMonth);
                }}
              />
            </div>

            <div className="cust0040-search-field">
              <label>진행상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">전체</option>
                <option value="접수">접수</option>
                <option value="처리중">처리중</option>
                <option value="완료">완료</option>
              </select>
            </div>

            <div className="cust0040-search-field">
              <label>검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="(견적번호, 담당자명 입력)"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="cust0040-search-buttons">
              <button className="cust0040-search-btn" onClick={handleSearch}>
                <Search size={16} />
                검색
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 페이지네이션 정보 */}
      <div className="cust0040-pagination-info">
        <div className="cust0040-data-info">
          전체 {quotesData.length.toLocaleString()}건 중 {quotesData.length > 0 ? startIndex.toLocaleString() : 0}-{endIndex.toLocaleString()}건 표시
        </div>
        <div className="cust0040-page-size-selector">
          <label>페이지당 표시:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="cust0040-grid-container">
        <div className="cust0040-grid-wrapper">
          {viewMode === 'list' ? renderListView() : renderImageView()}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="cust0040-pagination">
          {/* 처음으로 */}
          <button
            className="cust0040-page-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            처음으로
          </button>
          
          {/* 이전 */}
          <button
            className="cust0040-page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            이전
          </button>

          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`cust0040-page-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          {/* 다음 */}
          <button
            className="cust0040-page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight size={16} />
          </button>
          
          {/* 끝으로 */}
          <button
            className="cust0040-page-btn"
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

      {/* 견적 상세 모달 */}
      <QuoteDetailModal
        isOpen={isQuoteDetailModalOpen}
        onClose={handleQuoteDetailClose}
        quote={selectedQuote}
      />
    </div>
  );
};

export default CUST0040;
