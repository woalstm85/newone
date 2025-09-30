/**
 * EventProducts.js - 행사품목 컴포넌트
 * 
 * 주요 기능:
 * 1. 페이지 제목 설정
 * 2. Layout 컴포넌트에서 실제 상품 목록(ProductList) 렌더링
 * 
 * 동작 방식:
 * - 이 컴포넌트는 라우팅을 위한 래퍼 역할만 수행
 * - Layout.js에서 activeTopMenuCd가 'EVENT'일 때
 *   ProductList 컴포넌트를 직접 렌더링
 * - 따라서 이 컴포넌트는 빈 컨테이너만 반환
 * 
 * 참고:
 * - 실제 행사품목 목록은 Layout.js에서 처리
 * - ProductList 컴포넌트가 listType='event'로 렌더링됨
 * - ProductCategoryMenu도 Layout에서 관리
 */

import React, { useEffect } from 'react';
import './EventProducts.css';

const EventProducts = () => {
  /**
   * 페이지 제목 설정
   * 마운트 시 설정하고 언마운트 시 원래대로 복원
   */
  useEffect(() => {
    document.title = '행사품목 - 상품 목록';
    return () => {
      document.title = '상품 관리 시스템';
    };
  }, []);

  // Layout에서 ProductList를 직접 렌더링하므로 빈 컨테이너만 반환
  return (
    <div className="event-products-container">
      {/* Layout에서 ProductList가 렌더링됨 */}
    </div>
  );
};

export default EventProducts;
