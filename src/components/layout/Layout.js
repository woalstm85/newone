/**
 * Layout.js - 메인 레이아웃 컴포넌트
 * 
 * 주요 기능:
 * 1. 전체 레이아웃 구조 관리 (상단바, 메뉴, 컨텐츠 영역)
 * 2. 로그인/비로그인 상태에 따른 UI 분기
 * 3. 탭 기반 네비게이션 시스템
 * 4. 반응형 디자인 (데스크톱/모바일)
 * 5. 모바일 햄버거 메뉴
 * 6. 제품 카테고리 메뉴 및 제품 목록 표시
 * 7. 장바구니 개수 실시간 업데이트
 * 8. LEFT 메뉴 API 연동
 * 
 * 주요 상태:
 * - activeTopMenuCd: 현재 활성화된 탭
 * - isProductCategoryMenuOpen: 카테고리 메뉴 열림 상태
 * - isProductListOpen: 제품 목록 표시 상태
 * - selectedCategory: 선택된 카테고리
 * - isMobile: 모바일 여부 (768px 이하)
 * - isMobileMenuOpen: 모바일 메뉴 열림 상태
 * 
 * 라우팅 구조:
 * - /dashboard (HOME): 대시보드
 * - /surplus: 잉여재고거래
 * - /event: 행사품목
 * - /cart: 장바구니
 * - /CUST0010, /CUST0020 등: LEFT 메뉴 화면들
 */

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
    // ========== 상태 관리 ==========
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTopMenuCd, setActiveTopMenuCd] = useState('HOME');
    const [isProductCategoryMenuOpen, setIsProductCategoryMenuOpen] = useState(false);
    const [isProductListOpen, setIsProductListOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentListType, setCurrentListType] = useState('all');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [productCount, setProductCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [cartCount, setCartCount] = useState(0);

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

    /**
     * 장바구니 개수 업데이트
     * localStorage 및 커스텀 이벤트를 통한 실시간 동기화
     */
    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartCount(cart.length);
        };
        
        updateCartCount();
        window.addEventListener('cartUpdated', updateCartCount);
        
        return () => {
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);
    
    /**
     * 로그인 체크
     * 비로그인 시 특정 페이지만 접근 가능
     */
    useEffect(() => {
        const allowedPaths = ['/dashboard', '/', '/cart', '/surplus', '/event'];
        if (!isLoggedIn && !allowedPaths.includes(location.pathname)) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, location.pathname, navigate]);
    
    /**
     * 메뉴 데이터 로드
     * 로그인 상태에 따라 다른 메뉴 표시
     * - 비로그인: 기본 메뉴 (HOME, 잉여재고, 행사품목, 장바구니)
     * - 로그인: 기본 메뉴 + LEFT 메뉴 API (LEVEL=2)
     */
    useEffect(() => {
        const fetchMenuItems = async () => {
            if (!isLoggedIn) {
                setMenuItems([
                    { menuCd: 'HOME', menuNm: 'HOME', icon: '🏠' },
                    { menuCd: 'SURPLUS', menuNm: '잉여재고거래', icon: '📦' },
                    { menuCd: 'EVENT', menuNm: '행사품목', icon: '🎁' },
                    { menuCd: 'CART', menuNm: '장바구니', icon: '🛒' }
                ]);
                return;
            }
            
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/leftmenu?userId=${globalState.G_USER_ID}&upMenuCd=CUST`);
                const leftMenuData = await response.json();
                
                const level2Menus = leftMenuData.filter(item => item.LEVEL === 2);
                
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
    
    /**
     * 화면 크기 변화 감지 (반응형)
     * 데스크톱으로 전환 시 잉여재고/행사품목 메뉴 자동 열기
     */
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
            
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

    /**
     * 탑 메뉴 클릭 핸들러
     * 각 메뉴별로 다른 동작 수행
     */
    const handleTopMenuClick = async (menuCd, menuNm) => {
        if (!menuCd) {
            return;
        }

        if (!isLoggedIn && !['HOME', 'SURPLUS', 'EVENT', 'CART'].includes(menuCd)) {
            return;
        }

        setActiveTopMenuCd(menuCd);
        switchTab(menuCd);
        
        if (!renderedTabs[menuCd]) {
            setRenderedTabs(prev => ({
                ...prev,
                [menuCd]: true
            }));
        }
        
        if (menuCd === 'SURPLUS') {
            setCurrentListType('surplus');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
            navigate('/surplus');
            return;
        }
        else if (menuCd === 'EVENT') {
            setCurrentListType('event');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
            navigate('/event');
            return;
        }
        else if (menuCd === 'HOME') {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            navigate('/dashboard');
            return;
        }
        else if (menuCd === 'CART') {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            navigate('/cart');
            return;
        }
        else {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            
            const menuItem = menuItems.find(item => item.menuCd === menuCd);
            
            if (menuItem && menuItem.isLeftMenu) {
                if (menuItem.menuPath) {
                    navigate(`/${menuItem.menuPath}`);
                } else {
                    navigate(`/${menuCd}`);
                }
                
                if (isLoggedIn) {
                    setCurrentMenu(menuNm || menuCd, menuCd);
                }
            } else {
                if (isLoggedIn) {
                    setCurrentMenu(menuNm || menuCd, menuCd);
                }
            }
        }
    };

    /**
     * URL 경로에 따라 TopMenu 상태 동기화
     */
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
                setIsProductCategoryMenuOpen(false);
                setIsProductListOpen(false);
                setSelectedCategory(null);
            }
        }
    }, [location.pathname, isLoggedIn, setCurrentMenu, menuItems]);

    /**
     * 더보기 버튼 클릭 핸들러 (대시보드에서 사용)
     */
    const handleMoreClick = (targetMenuCd) => {
        if (targetMenuCd === 'CUST0010') {
            setActiveTopMenuCd('CUST0010');
            switchTab('CUST0010');
            
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            
            if (isLoggedIn) {
                setCurrentMenu('재고현황 관리', 'CUST0010');
            }
            
            navigate('/CUST0010');
            return;
        }
        
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
        handleTopMenuClick('HOME', 'HOME');
        navigate('/dashboard');
    };

    const handleProductCountUpdate = (count) => {
        setProductCount(count);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setIsProductCategoryMenuOpen(true);
    };

    /**
     * 비로그인 상단바 렌더링
     */
    const renderGuestTopBar = () => (
        <div className="top-bar guest-mode">
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
                {!isMobile && (
                    <button className="login-btn" onClick={handleLoginClick}>
                        <LogIn size={18} />
                        로그인
                    </button>
                )}
            </div>
        </div>
    );

    /**
     * 로그인 후 상단바 렌더링
     */
    const renderUserTopBar = () => (
        <div className="top-bar">
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
            {isLoggedIn ? renderUserTopBar() : renderGuestTopBar()}

            {/* 모바일 메뉴 슬라이드 - 로그인 상태 */}
            {isMobile && isLoggedIn && (
                <>
                    <div 
                        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    <div className={`mobile-menu-slide ${isMobileMenuOpen ? 'active' : ''}`}>
                        <div className="mobile-menu-header">
                            <div className="mobile-menu-user-info">
                                <div className="mobile-menu-welcome">
                                    {globalState.G_CUST_NM}님 환영합니다
                                </div>
                            </div>
                        </div>
                        
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
                                    {menu.menuCd === 'CART' && cartCount > 0 && (
                                        <span className="mobile-cart-count-badge">{cartCount}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
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
                    <div 
                        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    <div className={`mobile-menu-slide ${isMobileMenuOpen ? 'active' : ''}`}>
                        <div className="mobile-menu-header mobile-menu-header-guest">
                            <div className="mobile-menu-user-info">
                                <div className="mobile-menu-welcome">
                                    뉴원 시스템
                                </div>
                            </div>
                        </div>
                        
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
                                    {menu.menuCd === 'CART' && cartCount > 0 && (
                                        <span className="mobile-cart-count-badge">{cartCount}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
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
                {!isMobile && (
                    <TopMenu 
                        onTopMenuClick={handleTopMenuClick}
                        activeTopMenu={activeTopMenuCd}
                    />
                )}
                
                <div className="main-container">
                    {(activeTopMenuCd === 'SURPLUS' || activeTopMenuCd === 'EVENT') && (
                        <div className={`left-menu-container ${
                            !isProductCategoryMenuOpen ? 'hidden' : ''
                        }`}>
                            <ProductCategoryMenu 
                                isOpen={isProductCategoryMenuOpen} 
                                onClose={() => setIsProductCategoryMenuOpen(false)}
                                onCategorySelect={handleCategorySelect}
                                menuTitle={activeTopMenuCd === 'SURPLUS' ? '잉여재고거래' : '행사품목'}
                                showCloseButton={true}
                            />
                        </div>
                    )}

                    <div className="main-content">
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
                        
                        {isDashboardActive && (
                            <DASHBOARD 
                                onMoreClick={handleMoreClick} 
                                isLoggedIn={isLoggedIn} 
                            />
                        )}

                        {isProductListOpen && (activeTopMenuCd === 'SURPLUS' || activeTopMenuCd === 'EVENT') && (
                            <ProductList 
                                selectedCategory={selectedCategory}
                                listType={currentListType}
                                onClose={handleCloseProductList}
                                onProductCountUpdate={handleProductCountUpdate}
                            />
                        )}
                        
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
