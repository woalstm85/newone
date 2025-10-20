/**
 * SortSelector.js - 공통 정렬 셀렉트 컴포넌트
 * 
 * 사용법:
 * <SortSelector 
 *   sortConfig={sortConfig}
 *   onSortChange={handleSort}
 *   options={sortOptions}
 *   viewMode="image"
 * />
 */

import React from 'react';
import './SortSelector.css';

function SortSelector({ sortConfig, onSortChange, options, viewMode }) {
  // 리스트 뷰일 때는 정렬 셀렉트를 표시하지 않음 (테이블 헤더 클릭으로 정렬)
  if (viewMode === 'list') {
    return null;
  }

  const handleChange = (e) => {
    const value = e.target.value;
    onSortChange(value);
  };

  const currentValue = `${sortConfig.key}_${sortConfig.direction}`;

  return (
    <div className="sort-selector">
      <label>정렬:</label>
      <select value={currentValue} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortSelector;
