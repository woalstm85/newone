import React, { useEffect } from 'react';
import './SurplusStock.css';

const SurplusStock = () => {
  // 페이지 제목 설정
  useEffect(() => {
    document.title = '잉여재고거래 - 상품 목록';
    return () => {
      document.title = '상품 관리 시스템';
    };
  }, []);

  // 이 컴포넌트는 Layout에서 ProductList를 직접 렌더링하므로
  // 여기서는 빈 컨테이너만 반환
  return (
    <div className="surplus-stock-container">
      {/* Layout에서 ProductList가 렌더링됨 */}
    </div>
  );
};

export default SurplusStock;