import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './TopMenu.css';

function TopMenu({ onTopMenuClick, activeTopMenu }) {
  const [topMenuItems, setTopMenuItems] = useState([]);
  const { globalState } = useAuth();

  useEffect(() => {
    const fetchTopMenu = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/topmenu');
        const data = await response.json();
        setTopMenuItems(data);
        
        // 첫 번째 메뉴를 기본으로 선택 (선택사항)
        if (data.length > 0 && !activeTopMenu) {
          onTopMenuClick(data[0].top_menuCd, data[0].top_menuNm);
        }
      } catch (error) {
        console.error('Top menu fetch error:', error);
      }
    };

    fetchTopMenu();
  }, []);

  const handleTopMenuClick = (menuCd, menuNm) => {
    onTopMenuClick(menuCd, menuNm);
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