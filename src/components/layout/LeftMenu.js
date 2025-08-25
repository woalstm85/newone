import React, { useState, useEffect} from 'react';
import { useNavigate, useLocation  } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { ChevronRight, ChevronDown, FolderIcon } from 'lucide-react';
import Modal from '../common/Modal';
import './LeftMenu.css';
import UserInfo from './UserInfo';

// 개발 환경에서만 로그 출력


function LeftMenu({ closeMenuOverlay, activeTopMenuCd }) {
  const [menuItems, setMenuItems] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { globalState } = useAuth();
  const { activeMenuId, setCurrentMenu } = useMenu();
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 URL과 일치하는 메뉴 찾기 및 활성 상태 설정
  useEffect(() => {
    if (menuItems.length === 0) return;
    
    const currentPath = location.pathname.slice(1); 
    let foundActive = false;
    
    menuItems.forEach(category => {
      category.children.forEach(menu => {
        // urlstr이 존재하고 현재 경로와 일치하는 경우만
        if (menu.urlstr && menu.urlstr === currentPath) {
          setCurrentMenu(menu.pgNm, menu.pgId);
          setExpandedCategory(category.MENUID);
          foundActive = true;
        }
      });
    });
    
    // 일치하는 메뉴가 없으면 기본 타이틀로 설정
    if (!foundActive) {
      setCurrentMenu('', '');
    }
  }, [location.pathname, menuItems, setCurrentMenu]);

  useEffect(() => {
    const fetchLeftMenu = async () => {
      if (!globalState.G_USER_ID || !activeTopMenuCd) return;
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/leftmenu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: globalState.G_USER_ID,
            upMenuCd: activeTopMenuCd
          })
        });
        
        const data = await response.json();
        
        const categories = data.filter(item => item.LEVEL === 1);
        const programs = data.filter(item => item.LEVEL === 2);

        const structuredMenu = categories.map(category => ({
          ...category,
          children: programs
            .filter(program => program.UPP_MENUID === category.MENUID)
            .map(program => ({
              pgId: program.MENUID || '',
              pgNm: program.MENU_NM || '',
              urlstr: program.MENU_PATH || '',
              menuType: program.MENU_TYPE || ''
            }))
        }));

        setMenuItems(structuredMenu);
        
        // 첫 번째 카테고리를 기본으로 펼친 상태로 설정
        if (structuredMenu.length > 0) {
          setExpandedCategory(structuredMenu[0].MENUID);
        }
      } catch (error) {
        console.error('Left menu fetch error:', error);
      }
    };

    fetchLeftMenu();
  }, [globalState.G_USER_ID, activeTopMenuCd]);

  const handleCategoryClick = (menuId) => {
    setExpandedCategory(expandedCategory === menuId ? null : menuId);
  };

  const handleMenuClick = async (menu) => {
    const urlString = menu.urlstr?.trim();
    setCurrentMenu(menu.pgNm, menu.pgId);
  
    if (urlString) {
      try {
        // 전체 경로를 사용해서 navigate
        const navigationPath = `/${urlString}`;
        
        if (location.pathname !== navigationPath) {
          try {
            await import(
              /* webpackChunkName: "[request]" */
              `../../components/${urlString}`
            );
          } catch (firstError) {
            await import(
              /* webpackChunkName: "[request]" */
              `../../components/${urlString.toLowerCase()}`
            );
          }
          
          navigate(navigationPath, { replace: true, state: { preventFlash: true } });
          closeMenuOverlay();
        }
      } catch (error) {
        console.error(`Navigation failed for ${urlString}:`, error);
        setCurrentMenu('', ''); // 실패시 초기화
        setShowModal(true);
      }
    }
  };
  
  return (
    <div>
      <UserInfo />
      <div className="menu-container">
        {menuItems.map((category) => (
          <div key={category.MENUID} className="menu-category">
            <div
              className={`menu-item ${expandedCategory === category.MENUID ? 'expanded' : ''}`}
              onClick={() => handleCategoryClick(category.MENUID)}
            >
              <div className="icon-wrapper">
                <FolderIcon size={18} />
              </div>
              <span className="menu-text">{category.MENU_NM}</span>
              {expandedCategory === category.MENUID 
                ? <ChevronDown size={16} />
                : <ChevronRight size={16} />
              }
            </div>
            
            {expandedCategory === category.MENUID && (
              <div className="submenu-container">
                {category.children.map((menu) => {
                  // pgId가 빈 문자열인 경우 URL 기반으로 활성 상태 판단
                  const currentPath = location.pathname.slice(1);
                  const isActiveByUrl = menu.urlstr && menu.urlstr === currentPath;
                  const isActiveById = menu.pgId && activeMenuId && String(menu.pgId) === String(activeMenuId);
                  const isActive = isActiveByUrl || isActiveById;
                  
                  return (
                    <div
                      key={menu.pgId || menu.urlstr || Math.random()}
                      className={`submenu-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleMenuClick(menu)}
                    >
                      <div className="icon-wrapper">
                        <ChevronRight size={14} />
                      </div>
                      <span>{menu.pgNm}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        title="안내"
        message="해당 페이지는 준비 중입니다."
        onConfirm={() => setShowModal(false)}
      />
    </div>        
  );
}

export default LeftMenu;