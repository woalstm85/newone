import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { useTabState } from '../../context/TabStateContext';
import { useMenu } from '../../context/MenuContext';
import TabContainer from '../common/TabContainer';
import UserInfo from './UserInfo';
import LeftMenu from './LeftMenu';
import TopMenu from './TopMenu';
import DASHBOARD from '../dashboard/DASHBOARD';
import { Menu, X } from 'lucide-react';
import './Layout.css';
import Modal from '../common/Modal';

function Layout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTopMenuCd, setActiveTopMenuCd] = useState('DASHBOARD');
    const [activeTopMenuNm, setActiveTopMenuNm] = useState('DASHBOARD');
    const navigate = useNavigate();
    const location = useLocation();
    const { clearGlobalState, globalState } = useAuth();
    const { switchTab, saveTabState, getTabState } = useTabState();
    const { setCurrentMenu } = useMenu();
    
    // 각 탑메뉴별로 마지막 선택한 경로 저장
    const [tabPaths, setTabPaths] = useState({});
    
    // 렌더링된 탭들을 추적 (한번 렌더링되면 유지)
    const [renderedTabs, setRenderedTabs] = useState({
        'DASHBOARD': true  // 대시보드는 기본으로 렌더링
    });

    // 대시보드가 활성 상태인지 확인
    const isDashboardActive = activeTopMenuCd === 'DASHBOARD';    

    // 로그인 체크 추가
    useEffect(() => {
        if (!globalState.G_USER_ID) {
            navigate('/login');
        }
    }, [globalState, navigate]);

    // 현재 경로가 변경될 때 탭 경로 업데이트
    useEffect(() => {
        if (!isDashboardActive && activeTopMenuCd !== 'DASHBOARD' && location.pathname !== '/dashboard') {
            setTabPaths(prev => ({
                ...prev,
                [activeTopMenuCd]: location.pathname
            }));
        }
    }, [location.pathname, isDashboardActive, activeTopMenuCd]);

    // 로그인 상태가 아니면 아무것도 렌더링하지 않음
    if (!globalState.G_USER_ID) {
        return null;
    }

    const handleLogoutClick = () => {
        setIsModalOpen(true);
    };

    const handleLogoutConfirm = () => {
        clearGlobalState();
        navigate('/login');
        setIsModalOpen(false);
    };

    const closeMenuOverlay = () => {
        setIsMenuOpen(false);
    };

    // 탑메뉴가 변경될 때 첫 번째 메뉴 자동 선택
    const selectFirstMenuItem = async (menuCd) => {
        if (!globalState.G_USER_ID || !menuCd || menuCd === 'DASHBOARD') return;
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/leftmenu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: globalState.G_USER_ID,
                    upMenuCd: menuCd
                })
            });
            
            const data = await response.json();
            
            // 첫 번째 실행 가능한 프로그램 찾기
            const programs = data.filter(item => item.LEVEL === 2);
            if (programs.length > 0 && programs[0].MENU_PATH) {
                const firstProgram = programs[0];
                const navigationPath = `/${firstProgram.MENU_PATH}`;
                
                // 해당 탑메뉴의 기본 경로로 저장
                setTabPaths(prev => ({
                    ...prev,
                    [menuCd]: navigationPath
                }));
                
                // 메뉴 정보 설정
                setCurrentMenu(firstProgram.MENU_NM, firstProgram.MENUID);
                
                // 페이지로 이동
                navigate(navigationPath);
            }
        } catch (error) {
            console.error('Failed to select first menu item:', error);
        }
    };

    const handleTopMenuClick = async (menuCd, menuNm) => {
        const previousTab = activeTopMenuCd;
        
        // 현재 탭의 경로 저장 (대시보드가 아닐 때만)
        if (!isDashboardActive && previousTab !== 'DASHBOARD') {
            setTabPaths(prev => ({
                ...prev,
                [previousTab]: location.pathname
            }));
        }
        
        setActiveTopMenuCd(menuCd);
        setActiveTopMenuNm(menuNm);
        switchTab(menuCd);
        
        // 새로운 탭을 렌더링 목록에 추가
        if (!renderedTabs[menuCd]) {
            setRenderedTabs(prev => ({
                ...prev,
                [menuCd]: true
            }));
        }
        
        // 대시보드로 이동
        if (menuCd === 'DASHBOARD') {
            navigate('/dashboard');
        } 
        // 다른 탑메뉴로 이동
        else {
            // 이전에 방문한 경로가 있으면 그곳으로, 없으면 첫 번째 메뉴 선택
            if (tabPaths[menuCd]) {
                navigate(tabPaths[menuCd]);
            } else {
                await selectFirstMenuItem(menuCd);
            }
        }
    };

    return (
        <>
            <div className="top-bar">
                <div className="menu-trigger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </div>
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

            <Modal
                isOpen={isModalOpen}
                title="로그아웃"
                message="로그아웃 하시겠습니까?"
                onConfirm={handleLogoutConfirm}
                onCancel={() => setIsModalOpen(false)}
            />

            {/* 모바일 오버레이 */}
            <div 
                className={`menu-overlay ${isMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
            />

            <div className="layout-container">
                {/* 탑 메뉴 */}
                <TopMenu 
                    onTopMenuClick={handleTopMenuClick}
                    activeTopMenu={activeTopMenuCd}
                />
                
                {/* 메인 컨테이너 */}
                <div className="main-container">
                    {/* 왼쪽 메뉴: 대시보드가 활성 상태가 아닐 때만 표시 */}
                    {!isDashboardActive && (
                        <div className={`left-menu-container ${isMenuOpen ? 'active' : ''}`}>
                            <LeftMenu 
                                closeMenuOverlay={closeMenuOverlay} 
                                activeTopMenuCd={activeTopMenuCd}
                            />
                        </div>
                    )}

                    {/* 메인 컨텐츠 영역 */}
                    <div className={`main-content ${isDashboardActive ? 'full-width' : ''}`}>
                        {/* 대시보드 탭 - TabContainer로 감싸서 상태 유지 */}
                        {renderedTabs['DASHBOARD'] && (
                            <TabContainer 
                                tabId="DASHBOARD" 
                                isActive={isDashboardActive}
                            >
                                <DASHBOARD />
                            </TabContainer>
                        )}
                        
                        {/* 다른 탑메뉴들 - 각각 독립적인 Outlet 유지 */}
                        {Object.keys(renderedTabs).map(tabId => {
                            if (tabId === 'DASHBOARD') return null;
                            
                            return (
                                <div
                                    key={tabId}
                                    style={{ 
                                        display: activeTopMenuCd === tabId && !isDashboardActive ? 'block' : 'none',
                                        height: '100%',
                                        width: '100%'
                                    }}
                                >
                                    <Outlet />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Layout;