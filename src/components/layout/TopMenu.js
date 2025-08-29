import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import './TopMenu.css';

function TopMenu({ onTopMenuClick, activeTopMenu }) {
  const [topMenuItems, setTopMenuItems] = useState([]);
  const { globalState } = useAuth();
  const navigate = useNavigate(); 

// TopMenu.js
  useEffect(() => {
    const fetchTopMenu = async () => {
      try {
        // 1. API URL을 쿼리 파라미터를 포함한 새 주소로 변경합니다.
        const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/topmenu?upMenuCd=*`);
        const data = await response.json();

        // 1. 고정 DASHBOARD 메뉴 객체 생성
        const dashboardItem = { top_menuCd: 'DASHBOARD', top_menuNm: 'DASHBOARD' };

        // 2. 고정 메뉴와 API 데이터를 합친 새로운 배열 생성
        const combinedMenuItems = [dashboardItem, ...data];

        setTopMenuItems(combinedMenuItems);
        
        // 3. 첫 번째 메뉴(DASHBOARD)를 기본으로 선택하도록 수정
        if (combinedMenuItems.length > 0 && !activeTopMenu) {
          onTopMenuClick(combinedMenuItems[0].top_menuCd, combinedMenuItems[0].top_menuNm);
        }
      } catch (error) {
        console.error('Top menu fetch error:', error);
      }
    };

    fetchTopMenu();
  }, []); // 이 useEffect는 처음 마운트될 때 한 번만 실행됩니다.

  const handleTopMenuClick = (menuCd, menuNm) => {
    onTopMenuClick(menuCd, menuNm);
    // 대시보드 메뉴 클릭 시 해당 경로로 이동
    if (menuCd === 'DASHBOARD') {
      navigate('/dashboard');
    }
    
  };

  return (
    <div className="top-menu-container">
      {topMenuItems.map((menu) => (
        <div
          key={menu.top_menuCd}
          className={`top-menu-item ${
            activeTopMenu === menu.top_menuCd ? 'active' : ''
          }`}
          onClick={() => handleTopMenuClick(menu.top_menuCd, menu.top_menuNm)}
        >
          {menu.top_menuNm}
        </div>
      ))}
    </div>
  );
}

export default TopMenu;