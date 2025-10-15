import React, { useState, useEffect } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './DASHBOARD.css';
import QuoteModal from '../modals/QuoteModal';
import ImageWithFallback from '../common/ImageWithFallback';
import { CiImageOff } from 'react-icons/ci';
import { Eye } from 'lucide-react';
import { inventoryAPI, productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
        <SkeletonSection title="행사 품목" icon="🔥" />
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
        <span className="dash-delivery-badge">🚛 {formatShipDate(product.shipAvDate)} 출하가능</span>
        )}
        <div className="dash-price-row">
        {product.unitNm && (
            <span className="dash-product-unit-badge">{product.unitNm}</span>
          )}
            <div className="dash-price-display">
            {/* disPrice와 salePrice가 모두 있고 다른 경우 */}
            {product.disPrice && product.salePrice && product.disPrice !== product.salePrice && product.disPrice > 0 ? (
              <>
                <span className="dash-current-price">
                  {Number(product.disPrice).toLocaleString()} 원
                </span>
                <span className="dash-original-price">{Number(product.salePrice).toLocaleString()} 원</span>
              </>
            ) : (
              /* disPrice만 있거나, salePrice만 있거나, 둘이 같은 경우 */
              <span className="dash-current-price">
                {Number(product.disPrice || product.salePrice || 0).toLocaleString()} 원
              </span>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

// 자사재고현황용 이미지 카드 컴포넌트 (API 데이터 기반)
const InventoryImageCard = ({ inventory, onInventoryClick }) => {
  return (
    <div className="dash-inventory-image-card" onClick={() => onInventoryClick && onInventoryClick(inventory)} style={{ cursor: 'pointer' }}>
      <div className="dash-inventory-image-header">
        <h4>{inventory.itemNm}</h4>
        <span className={`dash-inventory-badge ${inventory.closingQty > 0 ? 'normal' : 'warning'}`}>
          {inventory.closingQty > 0 ? '재고있음' : '재고없음'}
        </span>
      </div>
      <div className="dash-inventory-image-content">
        <div className="dash-inventory-image-placeholder">
          {inventory.thFilePath ? (
            <ImageWithFallback
              src={inventory.thFilePath}
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
          <div className="dash-inventory-item-specs">
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">현재고:</span>
              <span className="dash-inventory-spec-value">{inventory.closingQty?.toLocaleString() || 0}</span>
            </div>
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">현재고금액:</span>
              <span className="dash-inventory-spec-value">{inventory.closingAmt?.toLocaleString() || 0}원</span>
            </div>
            <div className="dash-inventory-spec-row">
              <span className="dash-inventory-spec-label">평균단가:</span>
              <span className="dash-inventory-spec-client">{inventory.avgPrice?.toLocaleString() || 0}원</span>
            </div>
          </div>
          {inventory.locCd ? (
            <span className="dash-inventory-location-badge">
              📍 {inventory.locCd}
            </span>
          ) : (
            <span className="dash-inventory-no-location-badge">
              📋 위치 미지정
            </span>
          )}
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
          {category.items.map((inventory, index) => (
            <InventoryImageCard key={`${inventory.itemCd}-${index}`} inventory={inventory} onInventoryClick={onInventoryClick} />
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
  const { globalState } = useAuth(); // 로그인 사용자 정보 가져오기

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 잉여재고와 행사품목 데이터를 병렬로 가져오기
        const [surplusData, eventData] = await Promise.all([
          productAPI.getDashItems('010'),
          productAPI.getDashItems('020')
        ]);

        // 데이터 처리 - 각각 최대 10개만 사용
        const processData = (data, maxItems = 10, type = 'general') => {
          return data.slice(0, maxItems).map(item => {
            return {
              ...item,
              // API 응답 필드를 그대로 사용
              itemNm: item.itemNm,
              disPrice: item.disPrice,
              salePrice: item.salePrice,
              shipAvDate: item.shipAvDate,
              FILEPATH: item.FILEPATH,
              // source 구분을 위한 플래그 추가
              isSurplus: type === 'surplus',
              isEvent: type === 'event'
            };
          });
        };

        const formattedData = [
          { 
            title: "잉여 재고 거래", 
            icon: "📦",
            items: processData(surplusData, 10, 'surplus')
          },
          { 
            title: "행사 품목", 
            icon: "🔥",
            items: processData(eventData, 10, 'event')
          }
        ];

        // 로그인한 사용자에게만 자사재고현황 데이터 API로 가져오기
        if (isLoggedIn && globalState.G_USER_ID) {
          try {
            const companyInventoryData = await inventoryAPI.getCompanyInventory(globalState.G_USER_ID);

            const processedInventoryData = companyInventoryData.slice(0, 12); // 최대 10개만 표시
            
            formattedData.push({
              title: "자사재고현황",
              icon: "📋",
              items: processedInventoryData
            });
          } catch (inventoryError) {
            console.error('자사재고현황 데이터 로드 실패:', inventoryError);
            // 자사재고현황 API 오류 시 빈 데이터로 추가
            formattedData.push({
              title: "자사재고현황",
              icon: "📋",
              items: []
            });
          }
        }

        setProducts(formattedData);
      } catch (error) {
        console.error("대시보드 데이터를 가져오는 데 실패했습니다:", error);
        
        // 에러 발생 시 빈 데이터로 설정
        const errorData = [
          { title: "잉여 재고 거래", icon: "📦", items: [] },
          { title: "행사 품목", icon: "🔥", items: [] }
        ];
        
        // 로그인한 사용자에게만 자사재고현황 데이터 추가 (에러 시에도)
        if (isLoggedIn) {
          errorData.push({ title: "자사재고현황", icon: "🏢", items: [] });
        }
        
        setProducts(errorData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, globalState.G_USER_ID]); // isLoggedIn과 사용자 ID가 바뀔 때마다 데이터 다시 로드

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
    } else {
      console.log('DASHBOARD onMoreClick is not defined!');
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