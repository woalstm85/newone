import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { useTabState } from '../../context/TabStateContext';
import { useMenu } from '../../context/MenuContext';
import UserInfo from './UserInfo';
import TopMenu from './TopMenu';
import DASHBOARD from '../dashboard/DASHBOARD';
import { LogIn, Menu, Filter } from 'lucide-react';
import './Layout.css';
import Modal from '../common/Modal';
import ProductCategoryMenu from '../product/ProductCategoryMenu';
import ProductList from '../product/ProductList';

function Layout() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTopMenuCd, setActiveTopMenuCd] = useState('HOME');
    const [isProductCategoryMenuOpen, setIsProductCategoryMenuOpen] = useState(false);
    const [isProductListOpen, setIsProductListOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentListType, setCurrentListType] = useState('all');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // 768px 이하를 모바일로 처리
    const [productCount, setProductCount] = useState(0); // 상품 개수 상태 추가
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 모바일 메뉴 상태 추가
    const [menuItems, setMenuItems] = useState([]); // 메뉴 아이템 목록
    const [cartCount, setCartCount] = useState(0); // 장바구니 개수 상태 추가

    const navigate = useNavigate();
    const location = useLocation();
    const { clearGlobalState, globalState } = useAuth();
    const { switchTab } = useTabState();
    const { setCurrentMenu } = useMenu();
    
    // 렌더링된 탭들을 추적
    const [renderedTabs, setRenderedTabs] = useState({
        'HOME': true
    });

    // 대시보드가 활성 상태인지 확인
    const isDashboardActive = activeTopMenuCd === 'HOME' && (location.pathname === '/dashboard' || location.pathname === '/');
    
    // 로그인 상태 확인
    const isLoggedIn = !!globalState.G_USER_ID;

    // 장바구니 개수 업데이트
    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartCount(cart.length);
        };
        
        // 초기 로드
        updateCartCount();
        
        // 장바구니 업데이트 이벤트 리스너
        window.addEventListener('cartUpdated', updateCartCount);
        
        return () => {
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);
    
    // 로그인하지 않은 상태에서는 dashboard와 cart, surplus, event만 허용
    useEffect(() => {
        const allowedPaths = ['/dashboard', '/', '/cart', '/surplus', '/event'];
        if (!isLoggedIn && !allowedPaths.includes(location.pathname)) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, location.pathname, navigate]);
    
    // 메뉴 데이터 가져오기
    useEffect(() => {
        const fetchMenuItems = async () => {
            if (!isLoggedIn) {
                // 비로그인 상태 - 기본 메뉴만
                setMenuItems([
                    { menuCd: 'HOME', menuNm: 'HOME', icon: '🏠' },
                    { menuCd: 'SURPLUS', menuNm: '잉여재고거래', icon: '📦' },
                    { menuCd: 'EVENT', menuNm: '행사품목', icon: '🎁' },
                    { menuCd: 'CART', menuNm: '장바구니', icon: '🛒' }
                ]);
                return;
            }
            
            try {
                // LEFT 메뉴 API 호출
                const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/leftmenu?userId=${globalState.G_USER_ID}&upMenuCd=CUST`);
                const leftMenuData = await response.json();
                
                // LEVEL=2인 항목들만 필터링
                const level2Menus = leftMenuData.filter(item => item.LEVEL === 2);
                
                // 기본 메뉴 + API 메뉴 합치기
                const combinedMenus = [
                    { menuCd: 'HOME', menuNm: 'HOME', icon: '🏠' },
                    { menuCd: 'SURPLUS', menuNm: '잉여재고거래', icon: '📦' },
                    { menuCd: 'EVENT', menuNm: '행사품목', icon: '🎁' },
                    { menuCd: 'CART', menuNm: '장바구니', icon: '🛒' },
                    ...level2Menus.map(item => ({
                        menuCd: item.MENU_ID || item.menuId,
                        menuNm: item.MENU_NM || item.menuNm,
                        menuPath: item.MENU_PATH || item.menuPath,
                        icon: '📋',
                        isLeftMenu: true
                    }))
                ];
                
                setMenuItems(combinedMenus);
            } catch (error) {
                console.error('Menu fetch error:', error);
                // 에러 시 기본 메뉴만 표시
                setMenuItems([
                    { menuCd: 'HOME', menuNm: 'HOME', icon: '🏠' },
                    { menuCd: 'SURPLUS', menuNm: '잉여재고거래', icon: '📦' },
                    { menuCd: 'EVENT', menuNm: '행사품목', icon: '🎁' },
                    { menuCd: 'CART', menuNm: '장바구니', icon: '🛒' }
                ]);
            }
        };
        
        fetchMenuItems();
    }, [isLoggedIn, globalState.G_USER_ID]);
    
    // 화면 크기 변화 감지
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
            
            // 화면 크기가 데스크탑으로 변경되고 잉여재고/행사품목 탭에 있을 때 메뉴 자동 열기
            if (window.innerWidth > 1024 && (activeTopMenuCd === 'SURPLUS' || activeTopMenuCd === 'EVENT')) {
                setIsProductCategoryMenuOpen(true);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTopMenuCd]);
    
    const handleLogoutClick = () => {
        setIsModalOpen(true);
    };

    const handleLogoutConfirm = () => {
        clearGlobalState();
        setActiveTopMenuCd('HOME');
        navigate('/dashboard');
        setIsModalOpen(false);
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleTopMenuClick = async (menuCd, menuNm) => {
        if (!menuCd) {
            console.error('Layout: menuCd is undefined');
            return;
        }


        // 로그인하지 않은 상태에서는 home, surplus, event, cart만 허용
        if (!isLoggedIn && !['HOME', 'SURPLUS', 'EVENT', 'CART'].includes(menuCd)) {
            return;
        }

        // 즉시 탭 상태 업데이트 (리액트 상태 동기화)
        setActiveTopMenuCd(menuCd);
        switchTab(menuCd);
        
        // 새로운 탭을 렌더링 목록에 추가
        if (!renderedTabs[menuCd]) {
            setRenderedTabs(prev => ({
                ...prev,
                [menuCd]: true
            }));
        }
        
        // 잉여재고거래 메뉴인 경우
        if (menuCd === 'SURPLUS') {
            setCurrentListType('surplus');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
            navigate('/surplus');
            return;
        }
        // 행사품목 메뉴인 경우
        else if (menuCd === 'EVENT') {
            setCurrentListType('event');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
            navigate('/event');
            return;
        }
        // HOME 메뉴인 경우
        else if (menuCd === 'HOME') {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            navigate('/dashboard');
            return;
        }
        // CART 메뉴인 경우
        else if (menuCd === 'CART') {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            navigate('/cart');
            return;
        }
        // LEFT 메뉴 처리 - menuItems에서 찾아서 menuPath 사용
        else {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            
            // menuItems에서 해당 메뉴 찾기
            const menuItem = menuItems.find(item => item.menuCd === menuCd);
            
            if (menuItem && menuItem.isLeftMenu) {
                // LEFT 메뉴는 menuPath 사용
                if (menuItem.menuPath) {

                    navigate(`/${menuItem.menuPath}`);
                } else {

                    navigate(`/${menuCd}`);
                }
                
                if (isLoggedIn) {
                    setCurrentMenu(menuNm || menuCd, menuCd);
                }
            } else {
                // 기타 메뉴
                if (isLoggedIn) {
                    setCurrentMenu(menuNm || menuCd, menuCd);
                }
            }
        }
    };

    // URL 경로에 따라 TopMenu 상태 동기화
    useEffect(() => {
        const currentPath = location.pathname;

        
        if (currentPath === '/cart') {
            setActiveTopMenuCd('CART');
            setIsProductCategoryMenuOpen(false);
            setIsProductListOpen(false);
            setSelectedCategory(null);
        } else if (currentPath === '/surplus') {
            setActiveTopMenuCd('SURPLUS');
            setCurrentListType('surplus');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
        } else if (currentPath === '/event') {
            setActiveTopMenuCd('EVENT');
            setCurrentListType('event');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
        } else if (currentPath === '/dashboard' || currentPath === '/') {
            setActiveTopMenuCd('HOME');
            setIsProductCategoryMenuOpen(false);
            setIsProductListOpen(false);
            setSelectedCategory(null);
        } else {
            // menuItems에서 현재 경로와 일치하는 메뉴 찾기
            const matchingMenu = menuItems.find(item => {
                if (item.menuPath) {
                    return currentPath === `/${item.menuPath}` || currentPath.includes(item.menuPath);
                }
                return currentPath === `/${item.menuCd}` || currentPath.includes(item.menuCd);
            });
            
            if (matchingMenu) {

                setActiveTopMenuCd(matchingMenu.menuCd);
                setIsProductCategoryMenuOpen(false);
                setIsProductListOpen(false);
                setSelectedCategory(null);
                
                if (isLoggedIn && matchingMenu.isLeftMenu) {
                    setCurrentMenu(matchingMenu.menuNm, matchingMenu.menuCd);
                }
            } else {

                // 매칭되는 메뉴가 없으면 왼쪽 메뉴만 닫기 (HOME으로 강제 이동하지 않음)
                setIsProductCategoryMenuOpen(false);
                setIsProductListOpen(false);
                setSelectedCategory(null);
            }
        }
    }, [location.pathname, isLoggedIn, setCurrentMenu, menuItems]);

    // 더보기 버튼 클릭 시 TopMenu로 이동
    const handleMoreClick = (targetMenuCd) => {

        
        // CUST0010으로 직접 이동
        if (targetMenuCd === 'CUST0010') {
            // TopMenu 상태도 업데이트
            setActiveTopMenuCd('CUST0010');
            switchTab('CUST0010');
            
            // 선택된 상태 초기화
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            
            // 로그인된 상태에서만 메뉴 설정
            if (isLoggedIn) {
                setCurrentMenu('재고현황 관리', 'CUST0010');
            }
            
            navigate('/CUST0010');
            return;
        }
        
        // 잉여재고거래 또는 행사품목
        if (targetMenuCd === 'SURPLUS') {
            handleTopMenuClick('SURPLUS', '잉여재고거래');
        } else if (targetMenuCd === 'EVENT') {
            handleTopMenuClick('EVENT', '행사품목');
        }
    };

    const handleCloseProductList = () => {
        setIsProductListOpen(false);
        setIsProductCategoryMenuOpen(false);
        setSelectedCategory(null);
        // HOME으로 이동
        handleTopMenuClick('HOME', 'HOME');
        navigate('/dashboard');
    };

    // 상품 개수 업데이트 함수
    const handleProductCountUpdate = (count) => {
        setProductCount(count);
    };

    // 카테고리 선택 시 제품 리스트로 전환
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setIsProductCategoryMenuOpen(true); // 카테고리 메뉴는 유지
    };

    // 로그인 전 상단바 렌더링
    const renderGuestTopBar = () => (
        <div className="top-bar guest-mode">
            {/* 모바일 햄버거 버튼 - 비로그인 상태에서도 표시 */}
            {isMobile && (
                <button 
                    className={`mobile-hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu size={24} />
                </button>
            )}
            
            <div className="logo-section">
                <img src="/images/top_logo.png" alt="뉴원 로고" />
                <span></span>
            </div>
            <div className="top-bar-right">
                {/* 데스크탑에서만 로그인 버튼 표시 */}
                {!isMobile && (
                    <button className="login-btn" onClick={handleLoginClick}>
                        <LogIn size={18} />
                        로그인
                    </button>
                )}
            </div>
        </div>
    );

    // 로그인 후 상단바 렌더링
    const renderUserTopBar = () => (
        <div className="top-bar">
            {/* 모바일 햄버거 버튼 */}
            {isMobile && (
                <button 
                    className={`mobile-hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu size={24} />
                </button>
            )}
            
            <div className="logo-section">
                <img src="/images/top_logo.png" alt="뉴원 로고" />
                <span></span>
            </div>
            <div className="top-bar-right">
                <UserInfo />
                <div className="separator"></div>
                {/* 모바일에서는 로그아웃 버튼 숨김 */}
                {!isMobile && (
                    <button className="logout-btn" onClick={handleLogoutClick}>
                        <img src="/images/icon_logout.png" alt="로그아웃" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* 로그인 상태에 따른 상단바 렌더링 */}
            {isLoggedIn ? renderUserTopBar() : renderGuestTopBar()}

            {/* 모바일 메뉴 슬라이드 - 로그인 상태 */}
            {isMobile && isLoggedIn && (
                <>
                    {/* 오버레이 */}
                    <div 
                        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* 모바일 메뉴 슬라이드 */}
                    <div className={`mobile-menu-slide ${isMobileMenuOpen ? 'active' : ''}`}>
                        {/* 메뉴 상단 - 업체명 */}
                        <div className="mobile-menu-header">
                            <div className="mobile-menu-user-info">
                                <div className="mobile-menu-welcome">
                                    {globalState.G_CUST_NM}님 환영합니다
                                </div>
                            </div>
                        </div>
                        
                        {/* 메뉴 목록 */}
                        <div className="mobile-menu-list">
                            {menuItems.map((menu) => (
                                <div 
                                    key={menu.menuCd}
                                    className={`mobile-menu-list-item ${activeTopMenuCd === menu.menuCd ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        setIsMobileMenuOpen(false);
                                        handleTopMenuClick(menu.menuCd, menu.menuNm);
                                    }}
                                >
                                    <span className="menu-icon">{menu.icon}</span>
                                    <span>{menu.menuNm}</span>
                                    {/* 장바구니 메뉴일 때 카운트 표시 */}
                                    {menu.menuCd === 'CART' && cartCount > 0 && (
                                        <span className="mobile-cart-count-badge">{cartCount}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* 메뉴 하단 - 로그아웃 */}
                        <div className="mobile-menu-footer">
                            <button className="mobile-menu-logout-btn" onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleLogoutClick();
                            }}>
                                <LogIn size={18} />
                                로그아웃
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* 모바일 메뉴 슬라이드 - 비로그인 상태 */}
            {isMobile && !isLoggedIn && (
                <>
                    {/* 오버레이 */}
                    <div 
                        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* 모바일 메뉴 슬라이드 */}
                    <div className={`mobile-menu-slide ${isMobileMenuOpen ? 'active' : ''}`}>
                        {/* 메뉴 상단 - 비로그인 */}
                        <div className="mobile-menu-header mobile-menu-header-guest">
                            <div className="mobile-menu-user-info">
                                <div className="mobile-menu-welcome">
                                    뉴원 시스템
                                </div>
                            </div>
                        </div>
                        
                        {/* 메뉴 목록 */}
                        <div className="mobile-menu-list">
                            {menuItems.map((menu) => (
                                <div 
                                    key={menu.menuCd}
                                    className={`mobile-menu-list-item ${activeTopMenuCd === menu.menuCd ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        setIsMobileMenuOpen(false);
                                        handleTopMenuClick(menu.menuCd, menu.menuNm);
                                    }}
                                >
                                    <span className="menu-icon">{menu.icon}</span>
                                    <span>{menu.menuNm}</span>
                                    {/* 장바구니 메뉴일 때 카운트 표시 */}
                                    {menu.menuCd === 'CART' && cartCount > 0 && (
                                        <span className="mobile-cart-count-badge">{cartCount}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* 메뉴 하단 - 로그인 버튼 */}
                        <div className="mobile-menu-footer">
                            <button className="mobile-menu-login-btn" onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleLoginClick();
                            }}>
                                <LogIn size={18} />
                                로그인
                            </button>
                        </div>
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                title="로그아웃"
                message="로그아웃 하시겠습니까?"
                onConfirm={handleLogoutConfirm}
                onCancel={() => setIsModalOpen(false)}
            />

            <div className="layout-container">
                {/* 탑 메뉴 (데스크탑에서만 표시) */}
                {!isMobile && (
                    <TopMenu 
                        onTopMenuClick={handleTopMenuClick}
                        activeTopMenu={activeTopMenuCd}
                    />
                )}
                
                {/* 메인 컨테이너 */}
                <div className="main-container">
                    {/* 왼쪽 카테고리 메뉴 (잉여재고/행사품목일 때만) */}
                    {(activeTopMenuCd === 'SURPLUS' || activeTopMenuCd === 'EVENT') && (
                        <div className={`left-menu-container ${
                            !isProductCategoryMenuOpen ? 'hidden' : ''
                        }`}>
                            <ProductCategoryMenu 
                                isOpen={isProductCategoryMenuOpen} 
                                onClose={() => setIsProductCategoryMenuOpen(false)}
                                onCategorySelect={handleCategorySelect}
                                menuTitle={activeTopMenuCd === 'SURPLUS' ? '잉여재고거래' : '행사품목'}
                                showCloseButton={true} // 모든 화면 크기에서 X 버튼 표시
                            />
                        </div>
                    )}

                    {/* 메인 컨텐츠 영역 */}
                    <div className="main-content">
                        {/* 잉여재고/행사품목 탭에서 햄버거 메뉴 버튼 */}
                        {(activeTopMenuCd === 'SURPLUS' || activeTopMenuCd === 'EVENT') && (
                            <div className={`content-header ${
                                isProductCategoryMenuOpen && isMobile ? 'menu-open' : ''
                            }`}>
                                <div className="content-title-section">
                                    <h2 className="page-title">
                                        {activeTopMenuCd === 'SURPLUS' ? (
                                            <><span className="title-icon">📦</span> 잉여재고거래</>
                                        ) : (
                                            <><span className="title-icon">🎁</span> 행사품목</>
                                        )}
                                    </h2>
                                    <span className="product-count-display">총 <strong>{productCount}</strong>개 상품</span>
                                    <button 
                                        className="menu-toggle-btn"
                                        onClick={() => setIsProductCategoryMenuOpen(!isProductCategoryMenuOpen)}
                                        title="카테고리 메뉴 토글"
                                    >
                                        <Menu size={16} />
                                    </button>
                                </div>
                                
                                {/* 선택된 카테고리 표시 - 오른쪽 끝 */}
                                {selectedCategory && (
                                    <div className="selected-category-display">
                                        <Filter size={14} />
                                        <span>
                                            {selectedCategory.pathString || selectedCategory.catNm || selectedCategory.category}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* HOME 탭 - 대시보드 */}
                        {isDashboardActive && (
                            <DASHBOARD 
                                onMoreClick={handleMoreClick} 
                                isLoggedIn={isLoggedIn} 
                            />
                        )}

                        {/* 잉여재고/행사품목 - ProductList */}
                        {isProductListOpen && (activeTopMenuCd === 'SURPLUS' || activeTopMenuCd === 'EVENT') && (
                            <ProductList 
                                selectedCategory={selectedCategory}
                                listType={currentListType}
                                onClose={handleCloseProductList}
                                onProductCountUpdate={handleProductCountUpdate}
                            />
                        )}
                        
                        {/* API 메뉴들과 기타 경로들 - 항상 Outlet 렌더링 */}
                        {!isDashboardActive && (
                            <Outlet />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Layout;