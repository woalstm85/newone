import React, { useState, useEffect } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './DASHBOARD.css';
import QuoteModal from '../modals/QuoteModal';
import ImageWithFallback from '../common/ImageWithFallback';
import { CiImageOff } from 'react-icons/ci';
import { Eye } from 'lucide-react';

// 로딩 중에 보여줄 스켈레톤 컴포넌트
const DashboardSkeleton = ({ isLoggedIn }) => {
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

  const SkeletonSection = ({ title, icon }) => (
    <div className="dash-product-section">
      <div className="dash-section-header">
        <h2 className="dash-section-title">
          {icon && <span className="dash-title-icon">{icon}</span>}
          {title}
        </h2>
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
        <SkeletonSection title="잉여 재고 거래" icon="📦" />
        <SkeletonSection title="행사 품목" icon="🎁" />
        {isLoggedIn && <SkeletonSection title="자사재고현황" icon="🏢" />}
      </div>
    </SkeletonTheme>
  );
};

// 개선된 날짜 포맷팅 함수
const formatShipDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date;
    
    // 여러 가지 날짜 형식을 시도
    if (typeof dateString === 'string') {
      // ISO 8601 형식이 아닌 경우 변환 시도
      if (dateString.includes('-')) {
        // YYYY-MM-DD 또는 YYYY-MM-DD HH:mm:ss 형식
        date = new Date(dateString);
      } else if (dateString.includes('/')) {
        // MM/DD/YYYY 또는 DD/MM/YYYY 형식
        date = new Date(dateString);
      } else if (dateString.length === 8) {
        // YYYYMMDD 형식
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    // 날짜가 유효한지 확인
    if (isNaN(date.getTime())) {

      return dateString; // 원본 문자열 반환
    }
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${month}.${day} (${weekday})`;
  } catch (error) {

    return dateString; // 에러 시 원본 문자열 반환
  }
};

// ProductCard 컴포넌트
const ProductCard = ({ product, onProductClick }) => {
  // 할인율과 절약 금액 계산
  const calculateDiscount = () => {
    if (!product.disPrice || !product.salePrice || product.salePrice <= product.disPrice) {
      return { discountPercent: 0, savingsAmount: 0 };
    }
    
    const discountPercent = Math.round(((product.salePrice - product.disPrice) / product.salePrice) * 100);
    const savingsAmount = product.salePrice - product.disPrice;
    
    return { discountPercent, savingsAmount };
  };

  const { discountPercent, savingsAmount } = calculateDiscount();

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div className="dash-product-card">
      <div className="dash-product-badge-container">
        {product.badge && <span className="dash-product-badge">{product.badge}</span>}
        {/* 할인 뱃지 추가 */}
        {discountPercent > 0 && (
          <span className="dash-product-badge" style={{ 
            background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
            marginLeft: product.badge ? '5px' : '0'
          }}>
            {discountPercent}% 할인
          </span>
        )}
      </div>
      <div className="dash-product-image-wrapper">
        {product.FILEPATH ? (
          <ImageWithFallback
            src={product.FILEPATH}
            alt={product.itemNm}
            className="dash-product-image"
            width={200}
            height={200}
          />
        ) : (
          <div className="dash-product-image" style={{
            width: 200,
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6'
          }}>
            <CiImageOff size={48} color="#ccc" />
          </div>
        )}
        <div className="dash-product-image-overlay">
          <button 
            className="dash-overlay-view-btn"
            onClick={handleCardClick}
          >
            <Eye size={20} />
            상세보기
          </button>
        </div>
      </div>
      <div className="dash-product-info">
        <h3 className="dash-product-name">{product.itemNm}</h3>
        <div className="dash-price-container">
          {product.shipAvDate && (
            <span className="dash-delivery-badge">🚚 {formatShipDate(product.shipAvDate)} 출하가능</span>
          )}
          <div className="dash-price-display">
            {/* 할인가가 있으면 할인가를 메인으로, 없으면 판매가를 메인으로 */}
            <span className="dash-current-price">
              {Number(product.disPrice || product.salePrice || 0).toLocaleString()} 원
            </span>
            {/* 할인가가 있고 판매가와 다르면 판매가를 원가로 표시 */}
            {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && (
              <span className="dash-original-price">{Number(product.salePrice).toLocaleString()} 원</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// 자사재고현황용 이미지 카드 컴포넌트 (CUST0010 스타일 적용)
const InventoryImageCard = ({ inventory, onInventoryClick }) => {
  return (
    <div className="dash-inventory-image-card" onClick={() => onInventoryClick && onInventoryClick(inventory)} style={{ cursor: 'pointer' }}>
      <div className="dash-inventory-image-header">
        <h4>{inventory.itemCd}</h4>
        <span className={`dash-inventory-badge ${inventory.status === '정상' ? 'normal' : 'warning'}`}>
          {inventory.status}
        </span>
      </div>
      <div className="dash-inventory-image-content">
        <div className="dash-inventory-image-placeholder">
          {inventory.FILEPATH ? (
            <ImageWithFallback
              src={inventory.FILEPATH}
              alt={inventory.itemNm}
              width={120}
              height={120}
              style={{border: '1px solid #dee2e6'}}
            />
          ) : (
            <div style={{
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6'
            }}>
              <CiImageOff size={48} color="#ccc" />
            </div>
          )}
      </div>
        <div className="dash-inventory-item-details">
          <h5>{inventory.itemNm}</h5>
          <div className="dash-inventory-item-specs">
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">수량:</span>
              <span className="dash-inventory-spec-value">{inventory.quantity.toLocaleString()} 개</span>
            </div>
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">창고:</span>
              <span className="dash-inventory-spec-value">{inventory.warehouse}</span>
            </div>
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">거래처:</span>
              <span className="dash-inventory-spec-client">{inventory.clientName}</span>
            </div>
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">보관기간:</span>
              <span className="dash-inventory-spec-date">{inventory.storageDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ProductSection 컴포넌트
const ProductSection = ({ category, onProductClick, onInventoryClick, onMoreClick, isLoggedIn }) => {
  const handleMoreClick = () => {
    let listType = 'all';
    // 자사재고현황을 먼저 체크 (더 구체적인 조건)
    if (category.title.includes('자사재고현황')) {
      listType = 'inventory';
    } else if (category.title.includes('잉여') || category.title.includes('재고')) {
      listType = 'surplus';
    } else if (category.title.includes('행사') || category.title.includes('품목')) {
      listType = 'event';
    }

    if (onMoreClick) {
      onMoreClick(listType);
    }
  };

  // 자사재고현황은 로그인하지 않으면 아예 렌더링하지 않음
  if (category.title.includes('자사재고현황') && !isLoggedIn) {
    return null; // 아예 렌더링하지 않음
  }

  return (
    <div className="dash-product-section">
      <div className="dash-section-header">
        <h2 className="dash-section-title">
          {category.icon && <span className="dash-title-icon">{category.icon}</span>}
          {category.title}
        </h2>
        {category.subtitle && (
          <span className="dash-section-subtitle">{category.subtitle}</span>
        )}
        <button 
          className="dash-more-button"
          onClick={handleMoreClick}
        >
          더보기
        </button>
      </div>
      
      {/* 자사재고현황은 이미지 뷰로 렌더링 */}
      {category.title.includes('자사재고현황') ? (
        <div className="dash-inventory-image-grid">
          {category.items.map(inventory => (
            <InventoryImageCard key={inventory.itemCd} inventory={inventory} onInventoryClick={onInventoryClick} />
          ))}
        </div>
      ) : (
        <div className="dash-products-grid">
          {category.items.map(product => (
            <ProductCard key={product.itemCd} product={product} onProductClick={onProductClick} />
          ))}
        </div>
      )}
    </div>
  );
};

// DASHBOARD 메인 컴포넌트
const DASHBOARD = ({ onProductClick, onMoreClick, isLoggedIn = false }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 샘플 자사재고현황 데이터 (실제로는 API에서 가져와야 함)
  const sampleInventoryData = [
    {
      itemCd: 'INV001',
      itemNm: '스테인리스 파이프 50mm',
      quantity: 2500,
      warehouse: 'A동 1층',
      clientName: '대한철강',
      storageDate: '2025-01-15 ~ 현재',
      status: '정상',
      FILEPATH: null
    },
    {
      itemCd: 'INV002',
      itemNm: '알루미늄 프로파일 20x40',
      quantity: 1800,
      warehouse: 'B동 2층',
      clientName: '서울알루미늄',
      storageDate: '2024-12-20 ~ 현재',
      status: '정상',
      FILEPATH: null
    },
    {
      itemCd: 'INV003',
      itemNm: '철판 3mm 두께',
      quantity: 150,
      warehouse: 'A동 3층',
      clientName: '부산금속',
      storageDate: '2025-02-01 ~ 현재',
      status: '확인필요',
      FILEPATH: null
    },
    {
      itemCd: 'INV004',
      itemNm: 'PVC 관 75mm',
      quantity: 5200,
      warehouse: 'C동 1층',
      clientName: '경기화학',
      storageDate: '2024-11-30 ~ 현재',
      status: '정상',
      FILEPATH: null
    },
    {
      itemCd: 'INV005',
      itemNm: '구리선 2.5sq',
      quantity: 890,
      warehouse: 'B동 1층',
      clientName: '한국전선',
      storageDate: '2025-01-08 ~ 현재',
      status: '정상',
      FILEPATH: null
    }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 잉여재고와 행사품목 데이터를 병렬로 가져오기
        const [surplusResponse, eventResponse] = await Promise.all([
          fetch('https://api.newonetotal.co.kr/Comm/DashItems?itemDivCd=010'),
          fetch('https://api.newonetotal.co.kr/Comm/DashItems?itemDivCd=020')
        ]);

        if (!surplusResponse.ok) {
          throw new Error(`잉여재고 데이터 가져오기 실패: ${surplusResponse.status}`);
        }
        if (!eventResponse.ok) {
          throw new Error(`행사품목 데이터 가져오기 실패: ${eventResponse.status}`);
        }

        const surplusData = await surplusResponse.json();
        const eventData = await eventResponse.json();


        // 데이터 처리 - 각각 최대 10개만 사용
        const processData = (data, maxItems = 10) => {
          return data.slice(0, maxItems).map(item => {
            return {
              ...item,
              // API 응답 필드를 그대로 사용
              itemNm: item.itemNm,
              disPrice: item.disPrice,
              salePrice: item.salePrice,
              shipAvDate: item.shipAvDate,
              FILEPATH: item.FILEPATH,
            };
          });
        };

        const formattedData = [
          { 
            title: "잉여 재고 거래", 
            icon: "📦",
            items: processData(surplusData, 10)
          },
          { 
            title: "행사 품목", 
            icon: "🎁",
            items: processData(eventData, 10)
          }
        ];

        // 로그인한 사용자에게만 자사재고현황 데이터 추가
        if (isLoggedIn) {
          formattedData.push({
            title: "자사재고현황",
            icon: "🏢",
            items: sampleInventoryData.slice(0, 10) // 최대 10개
          });
        }

        setProducts(formattedData);
      } catch (error) {
        console.error("대시보드 데이터를 가져오는 데 실패했습니다:", error);
        
        // 에러 발생 시 빈 데이터로 설정
        const errorData = [
          { title: "잉여 재고 거래", icon: "📦", items: [] },
          { title: "행사 품목", icon: "🎁", items: [] }
        ];
        
        // 로그인한 사용자에게만 자사재고현황 데이터 추가
        if (isLoggedIn) {
          errorData.push({ title: "자사재고현황", icon: "🏢", items: sampleInventoryData.slice(0, 10) });
        }
        
        setProducts(errorData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn]); // isLoggedIn 상태가 바뀔 때마다 데이터 다시 로드

  // 상품 클릭 핸들러
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // 자사재고 클릭 핸들러
  const handleInventoryClick = (inventory) => {
    // 자사재고 상세 페이지로 이동하거나 모달 열기 등의 로직 추가
  };

  // 더보기 버튼 클릭 핸들러
  const handleMoreClick = (listType) => {
    let targetMenuCd = 'HOME';
    if (listType === 'surplus') {
      targetMenuCd = 'SURPLUS';
    } else if (listType === 'event') {
      targetMenuCd = 'EVENT';
    } else if (listType === 'inventory') {
      targetMenuCd = 'CUST0010'; // 자사재고현황은 CUST0010으로 이동
    }
    
    if(onMoreClick) {
      onMoreClick(targetMenuCd);
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
        <DashboardSkeleton isLoggedIn={isLoggedIn} />
      </div>
    );
  }

  return (
    <div className="dash-dashboard-container">
      <div className="dash-dashboard-content">
        {products.map((category) => (
          <ProductSection 
            key={category.title} 
            category={category} 
            onProductClick={handleProductClick}
            onInventoryClick={handleInventoryClick}
            onMoreClick={handleMoreClick}
            isLoggedIn={isLoggedIn}
          />
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