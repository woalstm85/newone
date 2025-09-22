import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Menu, X } from 'lucide-react';
import './TopMenu.css';

function TopMenu({ onTopMenuClick, activeTopMenu }) {
  const [topMenuItems, setTopMenuItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { globalState } = useAuth();
  const navigate = useNavigate();
  
  // 로그인 상태 확인
  const isLoggedIn = !!globalState.G_USER_ID; 

  // 장바구니 아이템 개수 업데이트
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItemCount(cart.length);
    };

    // 초기 로드
    updateCartCount();

    // storage 이벤트 리스너 (다른 탭에서 장바구니 변경 시)
    window.addEventListener('storage', updateCartCount);
    
    // 커스텀 이벤트 리스너 (같은 페이지에서 장바구니 변경 시)
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  // 모바일 메뉴 외부 클릭 시 닫기
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

// TopMenu.js
  useEffect(() => {
    const fetchTopMenu = async () => {
      try {
        // 로그인 상태 체크
        if (!isLoggedIn) {
          // 로그인하지 않은 경우 HOME, 잉여재고거래, 행사품목, CART 표시
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

        // 로그인한 경우 LEFT 메뉴 API만 사용 (upMenuCd=CUST)
        const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/leftmenu?userId=${globalState.G_USER_ID}&upMenuCd=CUST`);
        const leftMenuData = await response.json();

        // 1. 고정 메뉴들 생성
        const homeItem = { top_menuCd: 'HOME', top_menuNm: 'HOME' };
        const surplusItem = { top_menuCd: 'SURPLUS', top_menuNm: '잉여재고거래', icon: '📦' };
        const eventItem = { top_menuCd: 'EVENT', top_menuNm: '행사품목', icon: '🔥' };

        // 2. LEFT 메뉴에서 LEVEL=2인 항목들만 필터링하여 TOP 메뉴 형태로 변환
        const level2LeftMenus = leftMenuData.filter(item => item.LEVEL === 2);

        
        const convertedLeftMenu = level2LeftMenus.map(leftItem => {
          // API 응답 데이터 구조 확인
          
          return {
            top_menuCd: leftItem.MENU_ID || leftItem.menuId || leftItem.leftMenuCd,
            top_menuNm: leftItem.MENU_NM || leftItem.menuNm || leftItem.leftMenuNm,
            isLeftMenu: true, // 구분을 위한 플래그
            menuPath: leftItem.MENU_PATH || leftItem.menuPath, // 경로 정보 보존
            menuData: leftItem // 전체 메뉴 데이터 보존
          };
        });

        // 3. CART 메뉴 아이템 추가
        const cartItem = { top_menuCd: 'CART', top_menuNm: '장바구니', icon: '🛒' };

        // 4. HOME + 잉여재고거래 + 행사품목 + LEFT 메뉴(LEVEL=2) + CART 합치기
        const combinedMenuItems = [homeItem, surplusItem, eventItem, ...convertedLeftMenu, cartItem];

        setTopMenuItems(combinedMenuItems);
        
        // 5. 첫 번째 메뉴(HOME)를 기본으로 선택하도록 수정
        if (combinedMenuItems.length > 0 && !activeTopMenu) {
          onTopMenuClick(combinedMenuItems[0].top_menuCd, combinedMenuItems[0].top_menuNm);
        }
      } catch (error) {
        console.error('Menu fetch error:', error);
        // 에러 발생 시 최소한 HOME은 표시
        const homeOnly = [{ top_menuCd: 'HOME', top_menuNm: 'HOME' }];
        setTopMenuItems(homeOnly);
      }
    };

    fetchTopMenu();
  }, [isLoggedIn]); // 로그인 상태 변경 시 재실행

  const handleTopMenuClick = (menuCd, menuNm) => {
    // menuCd가 없으면 처리하지 않음
    if (!menuCd) {
      console.error('menuCd is undefined');
      return;
    }

    // 모바일 메뉴 닫기
    setIsMobileMenuOpen(false);

    // Cart 메뉴인 경우 직접 처리
    if (menuCd === 'CART') {
      try {
        navigate('/cart');
      } catch (error) {
        console.error('Navigation error:', error);
        // 대체 방법: window.location 사용
        window.location.href = '/cart';
      }
      return;
    }

    // HOME 메뉴 클릭 시 대시보드로 이동
    if (menuCd === 'HOME') {
      onTopMenuClick(menuCd, menuNm);
      navigate('/dashboard');
      return;
    }

    // 잉여재고거래 메뉴 클릭 시
    if (menuCd === 'SURPLUS') {
      onTopMenuClick(menuCd, menuNm);
      navigate('/surplus');
      return;
    }

    // 행사품목 메뉴 클릭 시
    if (menuCd === 'EVENT') {
      onTopMenuClick(menuCd, menuNm);
      navigate('/event');
      return;
    }

    // LEFT 메뉴에서 온 항목인 경우 해당 경로로 직접 이동
    const menuItem = topMenuItems.find(item => item.top_menuCd === menuCd);
    if (menuItem && menuItem.isLeftMenu) {
      // 먼저 Layout의 onTopMenuClick을 호출하여 탭 상태를 설정
      onTopMenuClick(menuCd, menuNm);
      
      // 그 다음 해당 경로로 바로 이동
      if (menuItem.menuPath) {
        navigate(`/${menuItem.menuPath}`);
      } else {
        // menuPath가 없는 경우 기본 경로로 이동
        navigate(`/${menuCd.toLowerCase()}`);
      }
      return;
    }

    // 기본 처리
    onTopMenuClick(menuCd, menuNm);
  };

  const handleCartClick = (e = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    

    
    // 모바일 메뉴가 열려있으면 닫기
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    
    try {
      navigate('/cart');
    } catch (error) {
      console.error('Navigation error:', error);
      // 대체 방법: window.location 사용
      window.location.href = '/cart';
    }
  };

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
            // 메뉴 데이터 유효성 검사
            if (!menu || !menu.top_menuCd) {
              console.warn('Invalid menu item:', menu);
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
                {menu.top_menuCd === 'CART'}
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
        
        {/* 햄버거 메뉴 버튼 (다른 메뉴가 있을 때만 표시) */}
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
      </div>
      {/* 모바일 드로프다운 메뉴 */}
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