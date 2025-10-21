/**
 * ProductCategoryMenu.js
 * 제품 카테고리 메뉴 컴포넌트
 * 
 * 주요 기능:
 * - 계층적 카테고리 구조 표시 (최대 3레벨)
 * - 카테고리 확장/축소 기능
 * - 전체상품 보기 옵션
 * - 선택된 카테고리 정보 부모 컴포넌트로 전달
 */

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
import { productAPI } from '../../services/api';
import './ProductCategoryMenu.css';

/**
 * ProductCategoryMenu 컴포넌트
 * 
 * @param {boolean} isOpen - 메뉴 열림/닫힘 상태
 * @param {Function} onClose - 메뉴 닫기 콜백 함수
 * @param {Function} onCategorySelect - 카테고리 선택 시 호출되는 콜백 함수
 * @param {string} menuTitle - 메뉴 제목
 * @param {boolean} showCloseButton - 닫기 버튼 표시 여부 (기본값: true)
 */
const ProductCategoryMenu = ({ isOpen, onClose, onCategorySelect, menuTitle, showCloseButton = true }) => {
  // 상태 관리
  const [categories, setCategories] = useState([]); // 계층 구조로 변환된 카테고리 데이터
  const [flatCategories, setFlatCategories] = useState([]); // API에서 받은 평면 카테고리 데이터
  const [expandedItems, setExpandedItems] = useState({}); // 확장된 카테고리 추적
  const [selectedCategory, setSelectedCategory] = useState(null); // 현재 선택된 카테고리
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  /**
   * API에서 카테고리 데이터 로드
   * 메뉴가 열릴 때마다 실행됨
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // API 호출
        const data = await productAPI.getCategories();

        // 평면 데이터 저장 (경로 구성에 사용)
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

    // 메뉴가 열려있을 때만 데이터 로드
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  /**
   * 평면 데이터를 계층 구조로 변환
   * LVL 1 -> LVL 2 -> LVL 3 순으로 구조화
   * 
   * @param {Array} flatData - 평면 구조의 카테고리 데이터
   * @returns {Array} 계층 구조로 변환된 카테고리 데이터
   */
  const buildHierarchy = (flatData) => {
    // 1단계 카테고리 추출
    const level1Items = flatData.filter(item => item.LVL === 1);
    
    return level1Items.map(level1 => {
      // 2단계 카테고리 추출 (현재 1단계의 하위 항목)
      const level2Items = flatData.filter(item => item.LVL === 2 && item.upCatCd === level1.catCd);
      
      // 각 2단계 카테고리의 하위 항목(3단계) 추출
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

  /**
   * 카테고리 확장/축소 토글
   * 
   * @param {string} catCd - 카테고리 코드
   */
  const toggleExpanded = (catCd) => {
    setExpandedItems(prev => ({
      ...prev,
      [catCd]: !prev[catCd]
    }));
  };

  /**
   * 전체상품 선택 처리
   * 모든 카테고리 필터를 제거하고 전체 상품을 표시
   */
  const handleAllProductsSelect = () => {
    // 선택된 카테고리 초기화
    setSelectedCategory(null);

    // 부모 컴포넌트에 전체상품 선택 전달
    if (onCategorySelect) {
      const categoryData = null; // 전체 상품을 위해 null로 전달
      onCategorySelect(categoryData);
    }
  };

  /**
   * 카테고리 전체 경로를 구성하는 함수
   * 선택된 카테고리부터 최상위 카테고리까지의 경로를 배열로 반환
   * 
   * @param {Object} category - 현재 카테고리 객체
   * @param {number} level - 현재 카테고리 레벨
   * @param {Array} allCategories - 전체 카테고리 목록
   * @returns {Array} 카테고리 이름 배열 (상위 -> 하위 순서)
   */
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

  /**
   * 카테고리 선택 처리 (모든 레벨에서 선택 가능)
   * 
   * @param {Object} category - 선택된 카테고리 객체
   * @param {number} level - 선택된 카테고리 레벨
   * @param {Event} event - 클릭 이벤트 객체
   */
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

    // 전체 경로 구성 (예: ['전자제품', '컴퓨터', '노트북'])
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

  /**
   * 카테고리 아이템 렌더링 (재귀 함수)
   * 각 카테고리와 그 하위 카테고리를 재귀적으로 렌더링
   * 
   * @param {Object} category - 카테고리 객체
   * @param {number} level - 현재 레벨 (1, 2, 3)
   * @param {string} parentPath - 상위 카테고리 경로
   * @returns {JSX.Element} 카테고리 아이템 컴포넌트
   */
  const renderCategoryItem = (category, level = 1, parentPath = '') => {
    const isExpanded = expandedItems[category.catCd]; // 확장 상태
    const hasChildren = category.children && category.children.length > 0; // 하위 카테고리 존재 여부
    const isSelected = selectedCategory?.catCd === category.catCd; // 선택 상태
    const currentPath = parentPath ? `${parentPath} > ${category.catNm}` : category.catNm;

    return (
      <div key={category.catCd} className={`cat-menu-item level-${level}`}>
        {/* 카테고리 헤더 */}
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
                {/* 하위 카테고리가 있는 경우: 폴더 아이콘 표시 */}
                {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                <span className="cat-menu-item-name">{category.catNm}</span>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </>
            ) : (
              <>
                {/* 하위 카테고리가 없는 경우: 패키지 아이콘 표시 */}
                <Package size={16} />
                <span className="cat-menu-item-name">{category.catNm}</span>
              </>
            )}
          </div>
        </div>

        {/* 하위 카테고리 렌더링 (재귀 호출) */}
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

  // 로딩 상태 UI
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

  // 에러 상태 UI
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

  // 메인 UI 렌더링
  return (
    <div className={`cat-menu-container ${isOpen ? 'open' : 'closed'}`}>
      {/* 메뉴 내용 */}
      <div className="cat-menu-content">
        {categories.length === 0 ? (
          // 카테고리가 없는 경우
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
                {/* 닫기 버튼 (옵션) */}
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
