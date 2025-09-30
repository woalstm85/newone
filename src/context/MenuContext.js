/**
 * MenuContext.js - 메뉴 상태 관리
 * 
 * 주요 기능:
 * 1. 현재 활성화된 메뉴 제목 관리
 * 2. 활성 메뉴 ID 추적
 * 3. 메뉴 전환 시 상태 업데이트
 * 
 * 사용 목적:
 * - 상단 헤더에 현재 메뉴 제목 표시
 * - 사이드바 메뉴 활성화 상태 표시
 * - 네비게이션 연동
 */

import React, { createContext, useContext, useState } from 'react';

// Context 생성
const MenuContext = createContext();

/**
 * useMenu - 메뉴 상태 접근 훅
 * 
 * @returns {Object} 메뉴 관련 상태 및 함수
 * @throws {Error} MenuProvider 외부에서 사용 시 에러 발생
 * 
 * 사용 예:
 * const { currentMenuTitle, setCurrentMenu } = useMenu();
 */
export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

/**
 * MenuProvider - 메뉴 상태 제공자
 * 
 * @param {ReactNode} children - 하위 컴포넌트
 */
export const MenuProvider = ({ children }) => {
  // 현재 메뉴 제목 (예: "대시보드", "고객 관리" 등)
  const [currentMenuTitle, setCurrentMenuTitle] = useState('');
  
  // 활성 메뉴 ID (고유 식별자)
  const [activeMenuId, setActiveMenuId] = useState('');

  /**
   * 메뉴 상태를 한번에 설정
   * 
   * @param {string} menuTitle - 메뉴 제목
   * @param {string} menuId - 메뉴 ID
   */
  const setCurrentMenu = (menuTitle, menuId) => {
    setCurrentMenuTitle(menuTitle);
    setActiveMenuId(menuId);
  };

  return (
    <MenuContext.Provider value={{
      currentMenuTitle,
      activeMenuId,
      setCurrentMenu,
      setCurrentMenuTitle,
      setActiveMenuId
    }}>
      {children}
    </MenuContext.Provider>
  );
};

export default MenuContext;
