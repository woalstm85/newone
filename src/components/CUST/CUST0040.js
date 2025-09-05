import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Eye, Download, Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowUpDown, History, Printer } from 'lucide-react';
import './CUST0040.css';
import QuoteDetailModal from '../modals/QuoteDetailModal';
import QuoteHistoryModal from '../modals/QuoteHistoryModal';
import Pagination from '../common/Pagination';
import { generateQuoteData } from '../utils/quoteDataGenerator';
import { generateQuotePDF, generateQuoteHTML } from '../utils/pdfGenerator';

const CUST0040 = () => {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [paginatedQuotes, setPaginatedQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [historyQuote, setHistoryQuote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [dateFilter, setDateFilter] = useState('전체');
  const [sortField, setSortField] = useState('requestDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 상태별 아이콘 매핑
  const getStatusIcon = (status) => {
    switch (status) {
      case '대기중':
        return <Clock className="status-icon" />;
      case '검토중':
        return <AlertCircle className="status-icon" />;
      case '승인됨':
        return <CheckCircle className="status-icon" />;
      case '거절됨':
        return <XCircle className="status-icon" />;
      default:
        return <FileText className="status-icon" />;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 데이터 로드
  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      try {
        // 실제 환경에서는 API 호출
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/CUST0040`);
        // const data = await response.json();
        
        // 현재는 생성된 데이터 사용
        const generatedData = generateQuoteData();
        setQuotes(generatedData);
        setFilteredQuotes(generatedData);
      } catch (error) {
        console.error('견적 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, []);

  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered = quotes;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.customerInfo.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.product.itemNm.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터링
    if (statusFilter !== '전체') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // 날짜 필터링
    if (dateFilter !== '전체') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case '오늘':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(quote => {
            const quoteDate = new Date(quote.requestDate);
            return quoteDate >= filterDate;
          });
          break;
        case '일주일':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(quote => {
            const quoteDate = new Date(quote.requestDate);
            return quoteDate >= filterDate;
          });
          break;
        case '한달':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(quote => {
            const quoteDate = new Date(quote.requestDate);
            return quoteDate >= filterDate;
          });
          break;
        default:
          break;
      }
    }

    // 정렬

    
    const sortedFiltered = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'requestDate':
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case 'totalAmount':
          aValue = Number(a.totalAmount) || 0;
          bValue = Number(b.totalAmount) || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'companyName':
          aValue = (a.customerInfo?.companyName || '').toLowerCase();
          bValue = (b.customerInfo?.companyName || '').toLowerCase();
          break;
        case 'quoteNumber':
          aValue = a.quoteNumber || '';
          bValue = b.quoteNumber || '';
          break;
        default:
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
      }

      // 숫자 비교
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // 문자열 비교
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      
      // 기본 비교
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });


    setFilteredQuotes(sortedFiltered);
    setCurrentPage(1); // 필터링 시 첫 페이지로 이동
  }, [quotes, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  // 페이지네이션 로직
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredQuotes.slice(startIndex, endIndex);

    
    setPaginatedQuotes(paginated);
  }, [filteredQuotes, currentPage, itemsPerPage]);

  // 견적 상세 보기
  const handleQuoteDetail = (quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  // 견적 이력 보기
  const handleQuoteHistory = (quote, e) => {
    e.stopPropagation();
    setHistoryQuote(quote);
    setIsHistoryModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedQuote(null);
  };

  const handleHistoryModalClose = () => {
    setIsHistoryModalOpen(false);
    setHistoryQuote(null);
  };

  // 정렬 변경
  const handleSort = (field) => {

    
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);

    } else {
      setSortField(field);
      setSortDirection('desc');

    }
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // 견적서 다운로드 (PDF)
  const handleDownload = (quote, e) => {
    e.stopPropagation();
    try {
      generateQuotePDF(quote);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다. HTML 버전으로 대체합니다.');
      generateQuoteHTML(quote);
    }
  };

  // 견적서 인쇄
  const handlePrint = (quote, e) => {
    e.stopPropagation();
    generateQuoteHTML(quote);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="cust0040-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>견적 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cust0040-container">
      {/* 헤더 */}
      <div className="cust0040-header">
        <div className="header-left">
          <h1 className="page-title">
            <FileText className="title-icon" />
            견적 관리
          </h1>
          <p className="page-description">견적 요청 현황을 확인하고 관리할 수 있습니다.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Plus className="btn-icon" />
            새 견적 작성
          </button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="cust0040-filters">
        <div className="filter-row">
          {/* 검색 */}
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="견적번호, 회사명, 제품명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* 상태 필터 */}
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="전체">전체 상태</option>
              <option value="대기중">대기중</option>
              <option value="검토중">검토중</option>
              <option value="승인됨">승인됨</option>
              <option value="거절됨">거절됨</option>
            </select>
          </div>

          {/* 날짜 필터 */}
          <div className="filter-group">
            <Calendar className="filter-icon" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="전체">전체 기간</option>
              <option value="오늘">오늘</option>
              <option value="일주일">최근 일주일</option>
              <option value="한달">최근 한달</option>
            </select>
          </div>
        </div>

          {/* 통계 정보 */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">전체 견적</span>
            <span className="stat-value">{quotes.length}건</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">검색 결과</span>
            <span className="stat-value">{filteredQuotes.length}건</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">대기중</span>
            <span className="stat-value waiting">
              {quotes.filter(q => q.status === '대기중').length}건
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">승인됨</span>
            <span className="stat-value approved">
              {quotes.filter(q => q.status === '승인됨').length}건
            </span>
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div className="sort-row">
          <span className="sort-label">정렬 </span>
          <div className="sort-buttons">
            <button 
              className={`sort-btn ${sortField === 'requestDate' ? 'active' : ''}`}
              onClick={() => handleSort('requestDate')}
            >
              요청일
              <ArrowUpDown className={`sort-icon ${sortField === 'requestDate' ? sortDirection : ''}`} />
            </button>
            <button 
              className={`sort-btn ${sortField === 'totalAmount' ? 'active' : ''}`}
              onClick={() => handleSort('totalAmount')}
            >
              금액
              <ArrowUpDown className={`sort-icon ${sortField === 'totalAmount' ? sortDirection : ''}`} />
            </button>
            <button 
              className={`sort-btn ${sortField === 'status' ? 'active' : ''}`}
              onClick={() => handleSort('status')}
            >
              상태
              <ArrowUpDown className={`sort-icon ${sortField === 'status' ? sortDirection : ''}`} />
            </button>
            <button 
              className={`sort-btn ${sortField === 'companyName' ? 'active' : ''}`}
              onClick={() => handleSort('companyName')}
            >
              회사명
              <ArrowUpDown className={`sort-icon ${sortField === 'companyName' ? sortDirection : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 견적 리스트 */}
      <div className="cust0040-content">
        {filteredQuotes.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <h3>견적이 없습니다</h3>
            <p>검색 조건을 변경하거나 새로운 견적을 작성해보세요.</p>
          </div>
        ) : (
          <>
            <div className="quotes-grid">
              {paginatedQuotes.map((quote) => (
                <div
                  key={quote.quoteId}
                  className="quote-card"
                  onClick={() => handleQuoteDetail(quote)}
                >
                  {/* 카드 헤더 */}
                  <div className="quote-card-header">
                    <div className="quote-number">
                      <FileText className="quote-icon" />
                      {quote.quoteNumber}
                    </div>
                    <div 
                      className="quote-status"
                      style={{ color: quote.statusColor }}
                    >
                      {getStatusIcon(quote.status)}
                      {quote.status}
                    </div>
                  </div>

                  {/* 카드 바디 */}
                  <div className="quote-card-body">
                    <div className="customer-info">
                      <h4 className="company-name">{quote.customerInfo.companyName}</h4>
                      <p className="contact-person">{quote.customerInfo.contactPerson}</p>
                    </div>

                    <div className="product-info">
                      <h5 className="product-name">{quote.product.itemNm}</h5>
                      <p className="product-details">
                        {formatAmount(quote.quantity)}개 × {formatAmount(quote.product.unitPrice)}원
                      </p>
                    </div>

                    <div className="amount-info">
                      <span className="amount-label">총 견적금액</span>
                      <span className="amount-value">
                        {formatAmount(quote.totalAmount)}원
                      </span>
                    </div>
                  </div>

                  {/* 카드 푸터 */}
                  <div className="quote-card-footer">
                    <div className="date-info">
                      <span className="date-label">요청일:</span>
                      <span className="date-value">{formatDate(quote.requestDate)}</span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuoteDetail(quote);
                        }}
                        title="상세보기"
                      >
                        <Eye className="action-icon" />
                      </button>
                      <button
                        className="action-btn history-btn"
                        onClick={(e) => handleQuoteHistory(quote, e)}
                        title="이력 보기"
                      >
                        <History className="action-icon" />
                      </button>
                      <button
                        className="action-btn print-btn"
                        onClick={(e) => handlePrint(quote, e)}
                        title="인쇄"
                      >
                        <Printer className="action-icon" />
                      </button>
                      <button
                        className="action-btn download-btn"
                        onClick={(e) => handleDownload(quote, e)}
                        title="다운로드"
                      >
                        <Download className="action-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredQuotes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </>
        )}
      </div>

      {/* 견적 상세 모달 */}
      <QuoteDetailModal 
        quote={selectedQuote}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />

      {/* 견적 이력 모달 */}
      <QuoteHistoryModal 
        quote={historyQuote}
        isOpen={isHistoryModalOpen}
        onClose={handleHistoryModalClose}
      />
    </div>
  );
};

export default CUST0040;
