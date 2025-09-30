/**
 * SearchDateRange.js - 날짜 범위 검색 컴포넌트
 * 
 * 주요 기능:
 * 1. 시작일/종료일 날짜 선택
 * 2. 빠른 날짜 선택 버튼 (오늘, 전월, 당월, 올해)
 * 3. 추가 검색 조건을 children으로 받을 수 있음
 * 
 * Props:
 * - dateRange: { startDate, endDate } 날짜 범위 객체 (YYYYMMDD 형식)
 * - onDateChange: 날짜 변경 콜백 (field, event)
 * - onQuickDateChange: 빠른 날짜 선택 콜백 (type)
 * - dateLabel: 날짜 레이블 (기본값: '날짜')
 * - children: 추가 검색 조건 컴포넌트
 * 
 * 사용 예:
 * <SearchDateRange
 *   dateRange={dateRange}
 *   onDateChange={(field, e) => handleDateChange(field, e)}
 *   onQuickDateChange={(type) => handleQuickDate(type)}
 *   dateLabel="조회기간"
 * >
 *   <button onClick={handleSearch}>검색</button>
 * </SearchDateRange>
 */

import './SearchDateRange.css';
import {
  formatDateToInputValue
} from '../utils/dateUtils';
  
function SearchDateRange({ 
  dateRange, 
  onDateChange, 
  onQuickDateChange,
  dateLabel = '날짜',
  children 
}) {
  return (
    <div className="search-date-range-container">
      <div className="search-date-range-content">
        {/* 날짜 입력 */}
        <div className="search-date-range-group">
          <label>{dateLabel}</label>
          <div className="search-date-range-inputs">
            <input
              type="date"
              value={formatDateToInputValue(dateRange.startDate)}
              onChange={(e) => onDateChange('startDate', e)}
            />
            <span className="search-date-range-separator">~</span>
            <input
              type="date"
              value={formatDateToInputValue(dateRange.endDate)}
              onChange={(e) => onDateChange('endDate', e)}
            />
          </div>
        </div>

        {/* 빠른 날짜 선택 버튼 */}
        <div className="search-date-range-quick-buttons">
          <button onClick={() => onQuickDateChange('today')}>오늘</button>
          <button onClick={() => onQuickDateChange('prevmonth')}>전월</button>
          <button onClick={() => onQuickDateChange('month')}>당월</button>
          <button onClick={() => onQuickDateChange('year')}>올해</button>
        </div>
        
        {/* 추가 검색 조건 영역 */}
        <div className="search-date-range-children">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SearchDateRange;
