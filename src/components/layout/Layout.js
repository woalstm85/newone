import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import LeftMenu from './LeftMenu';
import TopMenu from './TopMenu';
import { Menu, X } from 'lucide-react';
import './Layout.css';
import Modal from '../common/Modal';

function Layout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTopMenuCd, setActiveTopMenuCd] = useState(null);
    const [activeTopMenuNm, setActiveTopMenuNm] = useState('');
    const navigate = useNavigate();
    const { clearGlobalState, globalState } = useAuth();

    // 로그인 체크 추가
    useEffect(() => {
        if (!globalState.G_USER_ID) {
            navigate('/login');
        }
    }, [globalState, navigate]);

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

    const handleTopMenuClick = (menuCd, menuNm) => {
        setActiveTopMenuCd(menuCd);
        setActiveTopMenuNm(menuNm);
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
                <button className="logout-btn" onClick={handleLogoutClick}>
                    <img src="/images/icon_logout.png" alt="로그아웃" />
                </button>
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
                    {/* 왼쪽 메뉴 */}
                    <div className={`left-menu-container ${isMenuOpen ? 'active' : ''}`}>
                        <LeftMenu 
                            closeMenuOverlay={closeMenuOverlay} 
                            activeTopMenuCd={activeTopMenuCd}
                        />
                    </div>

                    {/* 메인 컨텐츠 영역 - Outlet 사용 */}
                    <div className="main-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </>
    );
}

export default Layout;