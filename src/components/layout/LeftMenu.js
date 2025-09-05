import React, { useState, useEffect} from 'react';
import { useNavigate, useLocation  } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { ChevronRight, ChevronDown, FolderIcon, File, User } from 'lucide-react';
import Modal from '../common/Modal';
import './LeftMenu.css';

function LeftMenu({ closeMenuOverlay, activeTopMenuCd, isCollapsed = false, isDashboardMode = false }) {
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
        if (menu.urlstr && menu.urlstr === currentPath) {
          setCurrentMenu(menu.pgNm, menu.pgId);
          setExpandedCategory(category.MENU_ID);
          foundActive = true;
        }
      });
    });
    
    if (!foundActive) {
      setCurrentMenu('', '');
    }
  }, [location.pathname, menuItems, setCurrentMenu]);

  useEffect(() => {
    const fetchLeftMenu = async () => {
      // Dashboard 모드일 때는 메뉴를 로드하지 않음
      if (!globalState.G_USER_ID || !activeTopMenuCd || isDashboardMode) {
        setMenuItems([]);
        return;
      }
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/Comm/leftmenu?userId=${globalState.G_USER_ID}&upMenuCd=${activeTopMenuCd}`);
        
        const data = await response.json();
        
        const categories = data.filter(item => item.LEVEL === 1);
        const programs = data.filter(item => item.LEVEL === 2);

        const structuredMenu = categories.map(category => ({
          ...category,
          children: programs
            .filter(program => program.UPP_MENU_ID === category.MENU_ID)
            .map(program => ({
              pgId: program.MENU_ID || '',
              pgNm: program.MENU_NM || '',
              urlstr: program.MENU_PATH || '',
              menuType: program.MENU_TYPE || ''
            }))
        }));

        setMenuItems(structuredMenu);
        
        // 첫 번째 카테고리를 기본으로 펼친 상태로 설정 (접힌 상태가 아닐 때만)
        if (structuredMenu.length > 0 && !isCollapsed) {
          setExpandedCategory(structuredMenu[0].MENU_ID);
        }
      } catch (error) {
        console.error('Left menu fetch error:', error);
      }
    };

    fetchLeftMenu();
  }, [globalState.G_USER_ID, activeTopMenuCd, isCollapsed, isDashboardMode]);

  // 메뉴가 접힌 상태에서 펼쳐진 상태로 바뀔 때 첫 번째 카테고리 자동 펼치기
  useEffect(() => {
    if (!isCollapsed && menuItems.length > 0 && expandedCategory === null) {
      setExpandedCategory(menuItems[0].MENU_ID);
    }
    // 접힌 상태로 바뀔 때 모든 카테고리 접기
    if (isCollapsed) {
      setExpandedCategory(null);
    }
  }, [isCollapsed, menuItems, expandedCategory]);

  const handleCategoryClick = (menuId) => {
    // 접힌 상태에서는 카테고리 클릭 무시
    if (isCollapsed) return;
    
    setExpandedCategory(expandedCategory === menuId ? null : menuId);
  };

  const handleMenuClick = async (menu) => {
    const urlString = menu.urlstr?.trim();
    setCurrentMenu(menu.pgNm, menu.pgId);
  
    if (urlString) {
      try {
        const navigationPath = `/${urlString}`;
        
        if (location.pathname !== navigationPath) {
          try {
            await import(
              /* webpackChunkName: "[request]" */
              `../../components/${urlString}`
            );
          } catch (firstError) {
            try {
              await import(
                /* webpackChunkName: "[request]" */
                `../../components/${urlString.toLowerCase()}`
              );
            } catch (secondError) {
              if (!urlString.includes('CUST/')) {
                throw secondError;
              }
            }
          }
          
          navigate(navigationPath, { replace: true, state: { preventFlash: true } });
          closeMenuOverlay();
        }
      } catch (error) {
        console.error(`Navigation failed for ${urlString}:`, error);
        setCurrentMenu('', '');
        setShowModal(true);
      }
    }
  };
  
  return (
    <div className={`menu-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 모바일에서 UserInfo 표시 */}
      <div className="mobile-user-info">
        <User className="user-icon" size={20} />
        <span className="welcome-text">
          {globalState.G_CUST_NM}님 환영합니다
        </span>
      </div>
      
      {/* Dashboard 모드일 때 메시지 표시 */}
      {isDashboardMode ? (
        <div className="dashboard-mode-message">
          <div className="dashboard-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="#6b7280"/>
              <rect x="14" y="3" width="7" height="7" rx="1" fill="#6b7280"/>
              <rect x="3" y="14" width="7" height="7" rx="1" fill="#6b7280"/>
              <rect x="14" y="14" width="7" height="7" rx="1" fill="#6b7280"/>
            </svg>
          </div>
          <p className="dashboard-text">
            대시보드를 보고 있습니다.<br/>
            다른 메뉴를 사용하시려면<br/>
            상단 탭을 선택해주세요.
          </p>
        </div>
      ) : (
        menuItems.map((category) => (
        <div key={category.MENU_ID} className="menu-category">
          <div
            className={`menu-item ${expandedCategory === category.MENU_ID ? 'expanded' : ''} ${isCollapsed ? 'collapsed' : ''}`}
            onClick={() => handleCategoryClick(category.MENU_ID)}
            title={isCollapsed ? category.MENU_NM : ''} // 접힌 상태에서 툴팁 표시
          >
            <div className="icon-wrapper">
              <FolderIcon size={18} />
            </div>
            {!isCollapsed && (
              <>
                <span className="menu-text">{category.MENU_NM}</span>
                {expandedCategory === category.MENU_ID 
                  ? <ChevronDown size={16} />
                  : <ChevronRight size={16} />
                }
              </>
            )}
          </div>
          
          {!isCollapsed && expandedCategory === category.MENU_ID && (
            <div className="submenu-container">
              {category.children.map((menu) => {
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
                      <File size={14} />
                    </div>
                    <span>{menu.pgNm}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 접힌 상태에서 호버 시 표시될 툴팁 메뉴 */}
          {isCollapsed && (
            <div className="collapsed-tooltip">
              <div className="tooltip-header">{category.MENU_NM}</div>
              <div className="tooltip-items">
                {category.children.map((menu) => {
                  const currentPath = location.pathname.slice(1);
                  const isActiveByUrl = menu.urlstr && menu.urlstr === currentPath;
                  const isActiveById = menu.pgId && activeMenuId && String(menu.pgId) === String(activeMenuId);
                  const isActive = isActiveByUrl || isActiveById;
                  
                  return (
                    <div
                      key={menu.pgId || menu.urlstr || Math.random()}
                      className={`tooltip-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleMenuClick(menu)}
                    >
                      {menu.pgNm}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        ))
      )}

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