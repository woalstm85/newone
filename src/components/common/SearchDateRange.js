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

        <div className="search-date-range-quick-buttons">
          <button onClick={() => onQuickDateChange('today')}>오늘</button>
          <button onClick={() => onQuickDateChange('prevmonth')}>전월</button>
          <button onClick={() => onQuickDateChange('month')}>당월</button>
          <button onClick={() => onQuickDateChange('year')}>올해</button>
        </div>
        
        <div className="search-date-range-children">
          {children}
        </div>
      </div>
    </div>
  );
}
export default SearchDateRange;