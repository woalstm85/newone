/**
 * useSortableData.js - 공통 정렬 로직 훅
 * 
 * 사용법:
 * const { sortedData, sortConfig, handleSort, handleImageViewSort } = useSortableData(gridData);
 */

import { useState, useMemo } from 'react';

function useSortableData(data, initialConfig = { key: '', direction: 'asc' }) {
  const [sortConfig, setSortConfig] = useState(initialConfig);

  /**
   * 테이블 헤더 클릭 정렬 핸들러 (리스트 뷰용)
   */
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  /**
   * 드롭다운 정렬 핸들러 (이미지 뷰용)
   */
  const handleImageViewSort = (value) => {
    const [key, direction] = value.split('_');
    setSortConfig({ key, direction });
  };

  /**
   * 정렬된 데이터 (useMemo로 성능 최적화)
   */
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data;

    const sorted = [...data];
    
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // null/undefined 처리
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      
      // 숫자 타입 판단 (필드명으로)
      const isNumericField = ['outUnitPrice', 'inpQty', 'currentQty', 'qty', 'amount', 'inpAmt'].includes(sortConfig.key);
      
      if (isNumericField) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        // 문자열은 대소문자 구분 없이
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sorted;
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
    handleImageViewSort,
    setSortConfig
  };
}

export default useSortableData;
