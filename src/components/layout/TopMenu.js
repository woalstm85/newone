/**
 * TopMenu.js - 상단 탭 메뉴 컴포넌트
 * 
 * 주요 기능:
 * 1. 탭 형태의 상단 메뉴 표시
 * 2. 로그인 상태에 따른 메뉴 구성
 *    - 비로그인: HOME, 잉여재고, 행사품목, 장바구니
 *    - 로그인: 기본 메뉴 + LEFT 메뉴 API (LEVEL=2)
 * 3. 장바구니 아이템 개수 표시
 * 4. 반응형 디자인 (데스크톱/모바일)
 * 5. 모바일 드롭다운 메뉴
 * 6. URL 경로와 메뉴 상태 자동 동기화
 * 
 * Props:
 * - onTopMenuClick: 메뉴 클릭 콜백 (menuCd, menuNm)
 * - activeTopMenu: 현재 활성화된 메뉴 코드
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { getCartItemCount } from '../../utils/cartUtils';
import './TopMenu.css';

function TopMenu({ onTopMenuClick, activeTopMenu }) {
  const [topMenuItems, setTopMenuItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { globalState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLoggedIn = !!globalState.G_USER_ID; 

  /**
   * 장바구니 아이템 개수 업데이트
   * 거래처별 장바구니 카운트
   */
  useEffect(() => {
    const custCd = globalState.G_CUST_CD || '';
    
    const updateCartCount = () => {
      const count = getCartItemCount(custCd);
      setCartItemCount(count);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [globalState.G_CUST_CD]);

  /**
   * 모바일 메뉴 외부 클릭 시 닫기
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen) {
        const mobileDropdown = document.querySelector('.mobile-dropdown');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (mobileDropdown && !mobileDropdown.contains(event.target) && 
            mobileMenuToggle && !mobileMenuToggle.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  /**
   * 라우트 변경 감지하여 activeTopMenu 자동 업데이트 - 비활성화
   * Layout.js에서 URL 동기화를 처리하므로 여기서는 하지 않음
   */
  /*
  useEffect(() => {
    const currentPath = location.pathname;
    
    // SURPLUS나 EVENT 가 활성화되어 있을 때 dashboard로 가는 것을 방지
    if ((currentPath === '/dashboard' || currentPath === '/') && 
        (activeTopMenu === 'SURPLUS' || activeTopMenu === 'EVENT')) {
      return;
    }
    
    let menuCdToSet = null;
    let menuNmToSet = null;

    if (currentPath === '/dashboard' || currentPath === '/') {
      menuCdToSet = 'HOME';
      menuNmToSet = 'HOME';
    } else if (currentPath === '/surplus') {
      menuCdToSet = 'SURPLUS';
      menuNmToSet = '잉여재고거래';
    } else if (currentPath === '/event') {
      menuCdToSet = 'EVENT';
      menuNmToSet = '행사품목';
    } else if (currentPath === '/cart') {
      menuCdToSet = 'CART';
      menuNmToSet = '장바구니';
    } else if (currentPath.includes('CUST0010') || currentPath === '/CUST0010') {
      // CUST0010 경로 명시적 처리
      menuCdToSet = 'CUST0010';
      menuNmToSet = '재고현황 관리';
    } else if (currentPath.includes('CUST0020') || currentPath === '/CUST0020') {
      // CUST0020 경로 명시적 처리
      menuCdToSet = 'CUST0020';
      menuNmToSet = '자사재고현황';
    } else if (currentPath.includes('CUST0040') || currentPath === '/CUST0040') {
      // CUST0040 경로 명시적 처리
      menuCdToSet = 'CUST0040';
      menuNmToSet = '발주관리';
    } else if (currentPath.includes('CUST0060') || currentPath === '/CUST0060') {
      // CUST0060 경로 명시적 처리
      menuCdToSet = 'CUST0060';
      menuNmToSet = '발주내역';
    } else {
      // LEFT 메뉴에서 현재 경로와 일치하는 항목 찾기
      const matchingMenuItem = topMenuItems.find(item => {
        if (!item.isLeftMenu) return false;
        
        if (item.menuPath) {
          return currentPath === `/${item.menuPath}` || currentPath.includes(item.menuPath);
        }
        
        return currentPath === `/${item.top_menuCd}` || 
               `/${item.top_menuCd.toLowerCase()}` === currentPath;
      });
      
      if (matchingMenuItem) {
        menuCdToSet = matchingMenuItem.top_menuCd;
        menuNmToSet = matchingMenuItem.top_menuNm;
      } else {
        // 매칭되는 메뉴를 찾지 못했을 때, activeTopMenu를 유지
        return;
      }
    }

    if (menuCdToSet && activeTopMenu !== menuCdToSet) {
      onTopMenuClick(menuCdToSet, menuNmToSet);
    }
  }, [location.pathname, topMenuItems, activeTopMenu, onTopMenuClick]);
  */

  /**
   * 메뉴 데이터 로드
   * 로그인 상태에 따라 다른 메뉴 표시
   */
  useEffect(() => {
    const fetchTopMenu = async () => {
      try {
        if (!isLoggedIn) {
          // 비로그인 상태 - 기본 메뉴만
          const basicMenus = [
            { top_menuCd: 'HOME', top_menuNm: 'HOME' },
            { top_menuCd: 'SURPLUS', top_menuNm: '잉여재고거래', icon: '📦' },
            { top_menuCd: 'EVENT', top_menuNm: '행사품목', icon: '🔥' },
            { top_menuCd: 'CART', top_menuNm: '장바구니', icon: '🛒' }
          ];
          setTopMenuItems(basicMenus);
          
          if (!activeTopMenu) {
            onTopMenuClick('HOME', 'HOME');
          }
          return;
        }

        // 로그인 상태 - LEFT 메뉴 API 호출
        const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/leftmenu?userId=${globalState.G_USER_ID}&upMenuCd=CUST`);
        const leftMenuData = await response.json();

        // 고정 메뉴들
        const homeItem = { top_menuCd: 'HOME', top_menuNm: 'HOME' };
        const surplusItem = { top_menuCd: 'SURPLUS', top_menuNm: '잉여재고거래', icon: '📦' };
        const eventItem = { top_menuCd: 'EVENT', top_menuNm: '행사품목', icon: '🔥' };

        // LEVEL=2인 LEFT 메뉴만 필터링
        const level2LeftMenus = leftMenuData.filter(item => item.LEVEL === 2);
        
        const convertedLeftMenu = level2LeftMenus.map(leftItem => ({
          top_menuCd: leftItem.MENU_ID || leftItem.menuId || leftItem.leftMenuCd,
          top_menuNm: leftItem.MENU_NM || leftItem.menuNm || leftItem.leftMenuNm,
          isLeftMenu: true,
          menuPath: leftItem.MENU_PATH || leftItem.menuPath,
          menuData: leftItem
        }));

        const cartItem = { top_menuCd: 'CART', top_menuNm: '장바구니', icon: '🛒' };

        // 모든 메뉴 합치기
        const combinedMenuItems = [homeItem, surplusItem, eventItem, ...convertedLeftMenu, cartItem];

        setTopMenuItems(combinedMenuItems);
        
        if (combinedMenuItems.length > 0 && !activeTopMenu) {
          onTopMenuClick(combinedMenuItems[0].top_menuCd, combinedMenuItems[0].top_menuNm);
        }
      } catch (error) {
        const homeOnly = [{ top_menuCd: 'HOME', top_menuNm: 'HOME' }];
        setTopMenuItems(homeOnly);
      }
    };

    fetchTopMenu();
  }, [isLoggedIn]);

  /**
   * 탑 메뉴 클릭 핸들러
   */
  const handleTopMenuClick = (menuCd, menuNm) => {
    if (!menuCd) {
      return;
    }

    setIsMobileMenuOpen(false);
    onTopMenuClick(menuCd, menuNm);

    if (menuCd === 'CART') {
      setTimeout(() => {
        try {
          navigate('/cart');
        } catch (error) {
          window.location.href = '/cart';
        }
      }, 10);
      return;
    }

    if (menuCd === 'HOME') {
      setTimeout(() => {
        navigate('/dashboard');
      }, 10);
      return;
    }

    if (menuCd === 'SURPLUS') {
      setTimeout(() => {
        navigate('/surplus');
      }, 10);
      return;
    }

    if (menuCd === 'EVENT') {
      setTimeout(() => {
        navigate('/event');
      }, 10);
      return;
    }

    // LEFT 메뉴 처리
    const menuItem = topMenuItems.find(item => item.top_menuCd === menuCd);
    if (menuItem && menuItem.isLeftMenu) {
      setTimeout(() => {
        if (menuItem.menuPath) {
          navigate(`/${menuItem.menuPath}`);
        } else {
          navigate(`/${menuCd.toLowerCase()}`);
        }
      }, 10);
      return;
    }
  };

  /**
   * 장바구니 클릭 핸들러
   */
  const handleCartClick = (e = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    
    try {
      navigate('/cart');
    } catch (error) {
      window.location.href = '/cart';
    }
  };

  /**
   * 모바일 메뉴 토글
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // HOME과 CART를 제외한 메뉴들
  const nonDashboardMenus = topMenuItems.filter(menu => menu.top_menuCd !== 'HOME' && menu.top_menuCd !== 'CART');
  const homeMenu = topMenuItems.find(menu => menu.top_menuCd === 'HOME');
  const cartMenu = topMenuItems.find(menu => menu.top_menuCd === 'CART');

  return (
    <div className="top-menu-container">
      {/* 데스크톱 메뉴 */}
      <div className="desktop-menu">
        <div className="top-menu-items">
          {topMenuItems.map((menu) => {
            if (!menu || !menu.top_menuCd) {
              return null;
            }
            
            return (
              <div
                key={menu.top_menuCd}
                className={`top-menu-item ${
                  menu.top_menuCd === 'CART' ? 'cart-menu-item' : ''
                } ${
                  activeTopMenu === menu.top_menuCd ? 'active' : ''
                }`}
                onClick={() => handleTopMenuClick(menu.top_menuCd, menu.top_menuNm)}
              >
                {menu.icon && <span className="menu-icon">{menu.icon}</span>}
                {menu.top_menuNm || menu.top_menuCd}
                {menu.top_menuCd === 'CART' && cartItemCount > 0 && (
                  <span className="cart-count-badge">{cartItemCount}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className="mobile-menu">
        {/* 햄버거 메뉴 버튼 */}
        {nonDashboardMenus.length > 0 && (
          <button 
            className={`mobile-menu-toggle ${
              isMobileMenuOpen ? 'active' : ''
            }`}
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        
        {/* HOME은 모바일에서도 항상 표시 */}
        {homeMenu && (
          <div
            className={`top-menu-item ${
              activeTopMenu === homeMenu.top_menuCd ? 'active' : ''
            }`}
            onClick={() => handleTopMenuClick(homeMenu.top_menuCd, homeMenu.top_menuNm)}
          >
            {homeMenu.top_menuNm || homeMenu.top_menuCd}
          </div>
        )}
        
        {/* CART도 모바일에서 항상 표시 */}
        {cartMenu && (
          <div
            className={`top-menu-item cart-menu-item ${
              activeTopMenu === cartMenu.top_menuCd ? 'active' : ''
            }`}
            onClick={() => handleTopMenuClick(cartMenu.top_menuCd, cartMenu.top_menuNm)}
          >
            {cartMenu.top_menuNm || cartMenu.top_menuCd}
            {cartItemCount > 0 && (
              <span className="cart-count-badge">{cartItemCount}</span>
            )}
          </div>
        )}
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMobileMenuOpen && (
        <div className="mobile-dropdown">
          {nonDashboardMenus.map((menu) => {
            if (!menu || !menu.top_menuCd) return null;
            
            return (
              <div
                key={menu.top_menuCd}
                className={`mobile-menu-item ${
                  activeTopMenu === menu.top_menuCd ? 'active' : ''
                }`}
                onClick={() => handleTopMenuClick(menu.top_menuCd, menu.top_menuNm)}
              >
                {menu.icon && <span className="menu-icon">{menu.icon}</span>}
                {menu.top_menuNm || menu.top_menuCd}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TopMenu;
