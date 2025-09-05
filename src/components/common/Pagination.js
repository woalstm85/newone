import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  onItemsPerPageChange 
}) => {
  // --- 헬퍼 함수 ---
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    onItemsPerPageChange(newItemsPerPage);
  };

  const getVisiblePages = () => {
    const delta = 2; // 현재 페이지 양쪽에 보여줄 페이지 수
    const visiblePages = [];

    // 첫 페이지 추가
    visiblePages.push(1);

    // 필요시 "..." 추가
    if (currentPage > delta + 2) {
      visiblePages.push('...');
    }

    // 현재 페이지 주변의 페이지들 추가
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    // 필요시 "..." 추가
    if (currentPage < totalPages - delta - 1) {
      visiblePages.push('...');
    }
    
    // 마지막 페이지 추가 (총 페이지가 1보다 클 경우에만)
    if (totalPages > 1) {
      visiblePages.push(totalPages);
    }

    // 중복 제거 (총 페이지 수가 적은 경우를 위해)
    return [...new Set(visiblePages)];
  };

  // --- 계산 ---
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // --- 렌더링 로직 ---
  const renderItemsPerPageSelector = () => (
    <div className="items-per-page">
      <label>페이지당 표시:</label>
      <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
        <option value={10}>10개</option>
        <option value={20}>20개</option>
        <option value={50}>50개</option>
        <option value={100}>100개</option>
      </select>
    </div>
  );

  const renderPaginationControls = () => (
    <div className="pagination-controls">
      {/* 첫 페이지로 */}
      <button
        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        title="첫 페이지"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* 이전 페이지 */}
      <button
        className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="이전 페이지"
      >
        <ChevronLeft size={16} />
      </button>

      {/* 페이지 번호들 */}
      <div className="pagination-pages">
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            className={`pagination-page ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
            onClick={() => page !== '...' && handlePageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
      </div>

      {/* 다음 페이지 */}
      <button
        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="다음 페이지"
      >
        <ChevronRight size={16} />
      </button>

      {/* 마지막 페이지로 */}
      <button
        className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        title="마지막 페이지"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span>
          총 {totalItems}개 항목
          {totalPages > 1 && ` 중 ${startItem}-${endItem}개 표시`}
        </span>
      </div>

      {totalPages > 1 && renderPaginationControls()}
      {renderItemsPerPageSelector()}
    </div>
  );
};

export default Pagination;