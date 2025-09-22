import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { quoteAPI } from '../../services/api';
import Modal from '../common/Modal';
import QuoteDetailModal from '../modals/QuoteDetailModal';
import MySpinner from '../common/MySpinner';
import './CUST0040.css';

const CUST0040 = () => {
  // 상태 관리
  const [quotesData, setQuotesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // 검색 조건
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isQuoteDetailModalOpen, setIsQuoteDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // 컨텍스트
  const { globalState } = useAuth();
  const { currentMenuTitle } = useMenu();

  // 현재 년월 기본값 설정
  useEffect(() => {
    const currentDate = new Date();
    const currentYM = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(currentYM);
  }, []);

  // 페이지네이션 계산
  const { currentItems, totalPages, startIndex, endIndex, totalItems } = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    let filteredData = quotesData;

    // 검색 필터링
    if (searchTerm.trim()) {
      filteredData = quotesData.filter(item =>
        (item.reqNo && item.reqNo.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
        (item.custNm && item.custNm.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
        (item.contactNm && item.contactNm.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      );
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
  }, [quotesData, currentPage, itemsPerPage, searchTerm]);

  // API 호출 함수
  const fetchQuotesData = useCallback(async () => {
    if (!globalState.G_USER_ID || !selectedMonth) {
      return;
    }

    try {
      setLoading(true);
      console.log('호출하는 API 매개변수:', { selectedMonth, userId: globalState.G_USER_ID });
      
      const data = await quoteAPI.getQuoteRequests(selectedMonth, globalState.G_USER_ID);
      
      console.log('반환된 데이터:', data);
      
      if (data && Array.isArray(data)) {
        setQuotesData(data);
        console.log(`선택된 월: ${selectedMonth}, 데이터 건수: ${data.length}`);
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

  // 검색 버튼 클릭
  const handleSearch = () => {
    setCurrentPage(1);
    fetchQuotesData();
  };

  // 초기 데이터 로드 - selectedMonth 변경 시마다 자동 호출
  useEffect(() => {
    if (selectedMonth && globalState.G_USER_ID) {
      console.log('월 변경 감지 - fetchQuotesData 호출:', selectedMonth);
      fetchQuotesData();
    }
  }, [selectedMonth, globalState.G_USER_ID, fetchQuotesData]);

  // 견적의뢰 상세 모달 핸들러
  const handleQuoteDetailClick = (quote) => {
    setSelectedQuote(quote);
    setIsQuoteDetailModalOpen(true);
  };

  // 견적의뢰 상세 모달 닫기
  const handleQuoteDetailClose = () => {
    setIsQuoteDetailModalOpen(false);
    setSelectedQuote(null);
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

  // 행 클릭 처리 - 견적상세 모달 열기
  const handleRowClick = (quote) => {
    handleQuoteDetailClick(quote);
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

  return (
    <div className="cust0040-container">
      {/* 프로그램 헤더 */}
      <div className="cust0040-program-header">
        <div className="cust0040-header-left">
          <FileText className="w-6 h-6" />
          <h1>{currentMenuTitle || '견적의뢰 관리'}</h1>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="cust0040-search-section">
        <div className="cust0040-search-container">
          <div className="cust0040-search-row">
            <div className="cust0040-search-field">
              <label>조회월</label>
              <input
                type="month"
                value={selectedMonth ? `${selectedMonth.substring(0,4)}-${selectedMonth.substring(4,6)}` : ''}
                onChange={(e) => {
                  const value = e.target.value; // YYYY-MM 형식
                  const yearMonth = value.replace('-', ''); // YYYYMM 형식으로 변환
                  console.log('월 선택 변경:', { original: value, converted: yearMonth });
                  setSelectedMonth(yearMonth);
                }}
              />
            </div>

            <div className="cust0040-search-field">
              <label>검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="견적번호, 고객명, 담당자명 입력"
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
                      className="quote-main-row" 
                      onClick={() => handleRowClick(quote)}
                      style={{ cursor: 'pointer' }}
>
                      <td className="cust0040-center">{formatDate(quote.reqStatus)}</td>
                      <td className="cust0040-center" style={{ fontWeight: '600', color: '#007bff' }}>
                        {quote.reqNo}
                      </td>
                      <td className="cust0040-center">{formatDate(quote.reqDate)}</td>
                      <td className="cust0040-center">{quote.contactNm}</td>
                      <td className="cust0040-center">{quote.contactTel}</td>
                      <td className="cust0040-left">{quote.siteNm}</td>
                      <td className="cust0040-center">{formatDate(quote.dueDate)}</td>
                      <td className="cust0040-center">
                        <span className="quote-item-count-badge">
                          {quote.subData?.length || 0}건
                        </span>
                      </td>
                      <td className="cust0040-center">
                        <button 
                          className="quote-detail-btn"
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
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="cust0040-pagination">
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

          <button
            className="cust0040-page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight size={16} />
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