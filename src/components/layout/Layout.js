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

    // 로그인하지 않은 상태에서는 dashboard와 cart, surplus, event만 허용
    useEffect(() => {
        const allowedPaths = ['/dashboard', '/', '/cart', '/surplus', '/event'];
        if (!isLoggedIn && !allowedPaths.includes(location.pathname)) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, location.pathname, navigate]);
    
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
            // 데스크탑에서는 항상 열림, 모바일에서는 닫힌 상태
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
            return;
        }
        // 행사품목 메뉴인 경우
        else if (menuCd === 'EVENT') {
            setCurrentListType('event');
            setIsProductListOpen(true);
            // 데스크탑에서는 항상 열림, 모바일에서는 닫힌 상태
            setIsProductCategoryMenuOpen(window.innerWidth > 1024);
            setSelectedCategory(null);
            return;
        }
        // HOME 메뉴인 경우
        else if (menuCd === 'HOME') {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
        }
        // CART 메뉴인 경우
        else if (menuCd === 'CART') {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
        }
        // 다른 메뉴들 - 왼쪽 메뉴 상태 초기화
        else {
            setIsProductListOpen(false);
            setIsProductCategoryMenuOpen(false);
            setSelectedCategory(null);
            
            // 로그인된 상태에서만 메뉴 설정
            if (isLoggedIn) {
                setCurrentMenu(menuNm || menuCd, menuCd);
            }
        }
    };

    // URL 경로에 따라 TopMenu 상태 동기화
    useEffect(() => {
        if (location.pathname === '/cart') {
            setActiveTopMenuCd('CART');
            setIsProductCategoryMenuOpen(false);
            setIsProductListOpen(false);
            setSelectedCategory(null);
        } else if (location.pathname === '/surplus') {
            setActiveTopMenuCd('SURPLUS');
            setCurrentListType('surplus');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024); // 데스크탑에서는 열림, 태블릿/모바일에서는 닫힘
            setSelectedCategory(null);
        } else if (location.pathname === '/event') {
            setActiveTopMenuCd('EVENT');
            setCurrentListType('event');
            setIsProductListOpen(true);
            setIsProductCategoryMenuOpen(window.innerWidth > 1024); // 데스크탑에서는 열림, 태블릿/모바일에서는 닫힘
            setSelectedCategory(null);
        } else if (location.pathname === '/dashboard' || location.pathname === '/') {
            setActiveTopMenuCd('HOME');
            setIsProductCategoryMenuOpen(false);
            setIsProductListOpen(false);
            setSelectedCategory(null);
        } else if (location.pathname === '/CUST0010') {
            setActiveTopMenuCd('CUST0010');
            setIsProductCategoryMenuOpen(false);
            setIsProductListOpen(false);
            setSelectedCategory(null);
            if (isLoggedIn) {
                setCurrentMenu('재고현황 관리', 'CUST0010');
            }
        } else {
            // 다른 경로들 - 왼쪽 메뉴 비활성화
            setIsProductCategoryMenuOpen(false);
            setIsProductListOpen(false);
            setSelectedCategory(null);
        }
    }, [location.pathname, isLoggedIn, setCurrentMenu]);

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
        
        handleTopMenuClick(targetMenuCd, targetMenuCd === 'SURPLUS' ? '잉여재고거래' : '행사품목');
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
            <div className="logo-section">
                <img src="/images/top_logo.png" alt="뉴원 로고" />
                <span></span>
            </div>
            <div className="top-bar-right">
                <button className="login-btn" onClick={handleLoginClick}>
                    <LogIn size={18} />
                    로그인
                </button>
            </div>
        </div>
    );

    // 로그인 후 상단바 렌더링
    const renderUserTopBar = () => (
        <div className="top-bar">
            <div className="logo-section">
                <img src="/images/top_logo.png" alt="뉴원 로고" />
                <span></span>
            </div>
            <div className="top-bar-right">
                <UserInfo />
                <div className="separator"></div>
                <button className="logout-btn" onClick={handleLogoutClick}>
                    <img src="/images/icon_logout.png" alt="로그아웃" />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* 로그인 상태에 따른 상단바 렌더링 */}
            {isLoggedIn ? renderUserTopBar() : renderGuestTopBar()}

            <Modal
                isOpen={isModalOpen}
                title="로그아웃"
                message="로그아웃 하시겠습니까?"
                onConfirm={handleLogoutConfirm}
                onCancel={() => setIsModalOpen(false)}
            />

            <div className="layout-container">
                {/* 탑 메뉴 (항상 표시) */}
                <TopMenu 
                    onTopMenuClick={handleTopMenuClick}
                    activeTopMenu={activeTopMenuCd}
                />
                
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