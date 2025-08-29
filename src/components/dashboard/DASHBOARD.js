import React, { useState, useEffect } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './DASHBOARD.css';
import QuoteModal from '../modals/QuoteModal';

// 로딩 중에 보여줄 스켈레톤 컴포넌트
const DashboardSkeleton = () => {
  const SkeletonCard = () => (
    <div className="dash-product-card">
      <div className="dash-product-image-wrapper">
        <Skeleton height="100%" />
      </div>
      <div className="dash-product-info">
        <Skeleton height={36} style={{ marginBottom: '10px' }} />
        <Skeleton height={20} width="80%" />
      </div>
    </div>
  );

  const SkeletonSection = ({ title }) => (
    <div className="dash-product-section">
      <div className="dash-section-header">
        <h2 className="dash-section-title">{title}</h2>
        <button className="dash-more-button">더보기</button>
      </div>
      <div className="dash-products-grid">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <SkeletonTheme baseColor="#e9ecef" highlightColor="#f8f9fa">
      <div className="dash-dashboard-content">
        <SkeletonSection title="잉여 재고 거래" />
        <SkeletonSection title="행사 품목" />
      </div>
    </SkeletonTheme>
  );
};

// ProductCard 컴포넌트
const ProductCard = ({ product, onProductClick }) => {
  return (
    <div className="dash-product-card" onClick={() => onProductClick && onProductClick(product)} style={{ cursor: 'pointer' }}>
      <div className="dash-product-badge-container">
        {product.badge && <span className="dash-product-badge">{product.badge}</span>}
      </div>
      <div className="dash-product-image-wrapper">
        <img
          src={product.filePath}
          alt={product.itemNm}
          className="dash-product-image"
          onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/200?text=No+Image" }}
        />
      </div>
      <div className="dash-product-info">
        <h3 className="dash-product-name">{product.itemNm}</h3>
        <div className="dash-price-container">
          {product.delivery && (
            <span className="dash-delivery-badge">🔥 오늘 {product.delivery} (월) 출하</span>
          )}
          <div className="dash-price-row">
            {product.compNm && <span className="dash-shipping-badge">{product.compNm}</span>}
          </div>
          <div className="dash-price-display">
            <span className="dash-current-price">{Number(product.price).toLocaleString()} 원</span>
            {product.originalPrice && (
              <span className="dash-original-price">{Number(product.originalPrice).toLocaleString()} 원~</span>
            )}
          </div>
        </div>
        {product.rating && product.rating > 0 && (
          <div className="dash-product-rating">
            {'⭐'.repeat(Math.floor(product.rating))}
            <span className="dash-rating-text">({product.rating})</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ProductSection 컴포넌트
const ProductSection = ({ category, onProductClick }) => {
  return (
    <div className="dash-product-section">
      <div className="dash-section-header">
        <h2 className="dash-section-title">{category.title}</h2>
        {category.subtitle && (
          <span className="dash-section-subtitle">{category.subtitle}</span>
        )}
        <button className="dash-more-button">더보기</button>
      </div>
      <div className="dash-products-grid">
        {category.items.map(product => (
          <ProductCard key={product.itemCd} product={product} onProductClick={onProductClick} />
        ))}
      </div>
    </div>
  );
};

const DASHBOARD = ({ onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const surplusItemCds = ['001846', '001828', '001210', '000633', '000592'];
  const eventItemCds = ['001838', '001826', '000641', '000622', '000569'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const fetchItems = async (itemCds) => {
          const promises = itemCds.map(itemCd =>
            fetch(`/Comm/CUST0020?p_itemNm=${itemCd}`)
              .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${itemCd}`);
                return res.json();
              })
              .then(data => data[0]) // API가 배열로 감싸서 응답하므로 첫 번째 항목을 추출
              .catch(err => {
                console.error(`Error processing item ${itemCd}:`, err);
                return null; // 실패한 경우 null 반환
              })
          );
          
          const results = await Promise.all(promises);
          return results.filter(item => item !== null); // null이 아닌 성공한 항목만 필터링
        };

        const [surplusData, eventData] = await Promise.all([
          fetchItems(surplusItemCds),
          fetchItems(eventItemCds)
        ]);

        const processData = (data) => {
          return data.map(item => {
            // 임의의 가격 생성 (예: 10,000 ~ 100,000원)
            const randomPrice = Math.floor(Math.random() * 901 + 100) * 100;

            // 임의의 원래 가격 생성 (현재 가격의 1.1 ~ 1.5배)
            const randomOriginalPrice = Math.floor(randomPrice * (Math.random() * 0.4 + 1.1) / 100) * 100;
            
            // 임의의 평점 생성 (3.5 ~ 5.0, 소수점 첫째 자리까지)
            const randomRating = (Math.random() * 1.5 + 3.5).toFixed(1);

            return {
              ...item, // API에서 받은 기존 데이터 (itemCd, itemNm 등)는 그대로 유지
              price: randomPrice,
              originalPrice: randomOriginalPrice,
              rating: randomRating,
              compNm: '뉴원', // 하드코딩된 회사명
              delivery: '9.8' // 하드코딩된 배송일자
            };
          });
        };

        const formattedData = [
          { title: "잉여 재고 거래", items: processData(surplusData) },
          { title: "행사 품목", items: processData(eventData) }
        ];

        setProducts(formattedData);
      } catch (error) {
        console.error("대시보드 데이터를 가져오는 데 실패했습니다:", error);
        setProducts([
          { title: "잉여 재고 거래", items: [] },
          { title: "행사 품목", items: [] }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 상품 클릭 핸들러
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return (
      <div className="dash-dashboard-container">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="dash-dashboard-container">
      <div className="dash-dashboard-content">
        {products.map((category) => (
          <ProductSection key={category.title} category={category} onProductClick={handleProductClick} />
        ))}
      </div>
      
      {/* 견적 요청 모달 */}
      <QuoteModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default DASHBOARD;