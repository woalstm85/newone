import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  X,
  Folder,
  FolderOpen,
  Home
} from 'lucide-react';
import './ProductCategoryMenu.css';

const ProductCategoryMenu = ({ isOpen, onClose, onCategorySelect, menuTitle, showCloseButton = true }) => {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]); // 평면 데이터 저장
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API에서 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://api.newonetotal.co.kr/Comm/category');
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log('Category API Response:', data);

        // 평면 데이터 저장
        setFlatCategories(data);
        
        // 데이터를 계층 구조로 변환
        const hierarchicalData = buildHierarchy(data);
        setCategories(hierarchicalData);
      } catch (error) {
        console.error('카테고리 데이터 로드 실패:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // 평면 데이터를 계층 구조로 변환
  const buildHierarchy = (flatData) => {
    const level1Items = flatData.filter(item => item.LVL === 1);
    
    return level1Items.map(level1 => {
      const level2Items = flatData.filter(item => item.LVL === 2 && item.upCatCd === level1.catCd);
      
      const children = level2Items.map(level2 => {
        const level3Items = flatData.filter(item => item.LVL === 3 && item.upCatCd === level2.catCd);
        
        return {
          ...level2,
          children: level3Items.length > 0 ? level3Items : null
        };
      });

      return {
        ...level1,
        children: children.length > 0 ? children : null
      };
    });
  };

  // 카테고리 확장/축소 토글
  const toggleExpanded = (catCd) => {
    setExpandedItems(prev => ({
      ...prev,
      [catCd]: !prev[catCd]
    }));
  };

  // 전체상품 선택 처리
  const handleAllProductsSelect = () => {
    // 선택된 카테고리 초기화
    setSelectedCategory(null);

    // 부모 컴포넌트에 전체상품 선택 전달
    if (onCategorySelect) {
      const categoryData = null; // 전체 상품을 위해 null로 전달
      onCategorySelect(categoryData);
    }
  };

  // 카테고리 전체 경로를 구성하는 함수
  const buildCategoryPath = (category, level, allCategories) => {
    const path = [];
    let currentCategory = category;
    
    // 현재 카테고리부터 상위로 추적
    path.unshift(currentCategory.catNm);
    
    // 상위 카테고리를 찾아서 경로 구성
    while (currentCategory.upCatCd && currentCategory.upCatCd !== '*') {
      const parentCategory = allCategories.find(cat => cat.catCd === currentCategory.upCatCd);
      if (parentCategory) {
        path.unshift(parentCategory.catNm);
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    
    return path;
  };

  // 카테고리 선택 처리 (모든 레벨에서 선택 가능)
  const handleCategorySelect = (category, level, event) => {
    // 이벤트 전파 중지 (하위 요소 클릭 시 상위 요소 클릭 방지)
    if (event) {
      event.stopPropagation();
    }

    // 선택된 카테고리 상태 업데이트
    setSelectedCategory({
      catCd: category.catCd,
      catNm: category.catNm,
      level: level
    });

    // 전체 경로 구성
    const fullPath = buildCategoryPath(category, level, flatCategories);

    // 부모 컴포넌트에 선택된 카테고리 전달
    if (onCategorySelect) {
      const categoryData = {
        category: category.catNm,
        subcategory: category.catNm,
        item: category.catNm,
        catCd: category.catCd,
        level: level,
        // API 호출에 사용할 카테고리 코드
        searchCatCd: category.catCd,
        // 전체 경로 정보
        fullPath: fullPath,
        pathString: fullPath.join(' → ')
      };
      onCategorySelect(categoryData);
    }
  };

  // 카테고리 아이템 렌더링 (재귀 함수)
  const renderCategoryItem = (category, level = 1, parentPath = '') => {
    const isExpanded = expandedItems[category.catCd];
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory?.catCd === category.catCd;
    const currentPath = parentPath ? `${parentPath} > ${category.catNm}` : category.catNm;

    return (
      <div key={category.catCd} className={`cat-menu-item level-${level}`}>
        <div 
          className={`cat-menu-item-header ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            if (hasChildren) {
              // 하위 카테고리가 있으면 확장/축소
              toggleExpanded(category.catCd);
            }
            // 모든 레벨에서 선택 가능
            handleCategorySelect(category, level, e);
          }}
        >
          <div className="cat-menu-item-content">
            {hasChildren ? (
              <>
                {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                <span className="cat-menu-item-name">{category.catNm}</span>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </>
            ) : (
              <>
                <Package size={16} />
                <span className="cat-menu-item-name">{category.catNm}</span>
              </>
            )}
          </div>
        </div>

        {/* 하위 카테고리 렌더링 */}
        {hasChildren && isExpanded && (
          <div className="cat-menu-subcategories">
            {category.children.map(child => 
              renderCategoryItem(child, level + 1, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={`cat-menu-container ${isOpen ? 'open' : 'closed'}`}>
        <div className="cat-menu-content">
          <div className="cat-menu-loading">
            <div className="cat-loading-spinner"></div>
            <p>카테고리를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`cat-menu-container ${isOpen ? 'open' : 'closed'}`}>
        <div className="cat-menu-content">
          <div className="cat-menu-error">
            <Package size={48} />
            <h3>카테고리를 불러올 수 없습니다</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cat-menu-container ${isOpen ? 'open' : 'closed'}`}>
      {/* 메뉴 내용 */}
      <div className="cat-menu-content">
        {categories.length === 0 ? (
          <div className="cat-menu-empty">
            <Package size={48} />
            <p>등록된 카테고리가 없습니다.</p>
          </div>
        ) : (
          <div className="cat-menu-list">
            {/* 전체상품 옵션 */}
            <div className="cat-menu-all-products">
              <div 
                className={`cat-menu-all-products-item ${!selectedCategory ? 'selected' : ''}`}
                onClick={() => handleAllProductsSelect()}
              >
                <div className="cat-menu-all-products-content">
                  <Home size={16} />
                  <span>전체상품</span>
                </div>
                {showCloseButton && (
                  <button 
                    className="cat-menu-all-close-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            
            {/* 카테고리 목록 */}
            {categories.map(category => renderCategoryItem(category, 1))}
          </div>
        )}
      </div>

      {/* 선택된 카테고리 표시 */}
      {selectedCategory && (
        <div className="cat-menu-footer">
          <div className="cat-selected-category">
            <span className="cat-selected-label">선택됨:</span>
            <span className="cat-selected-name">{selectedCategory.catNm}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCategoryMenu;