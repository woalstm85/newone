import React, { createContext, useContext, useState } from 'react';

const MenuContext = createContext();

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }) => {
  const [currentMenuTitle, setCurrentMenuTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState('');

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