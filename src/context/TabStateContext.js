import React, { createContext, useContext, useState, useCallback } from 'react';

const TabStateContext = createContext();

export const useTabState = () => {
  const context = useContext(TabStateContext);
  if (!context) {
    throw new Error('useTabState must be used within a TabStateProvider');
  }
  return context;
};

export const TabStateProvider = ({ children }) => {
  // 각 탭의 상태를 저장하는 객체
  const [tabStates, setTabStates] = useState({});
  
  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  
  // 각 탭의 컴포넌트 인스턴스를 유지
  const [tabComponents, setTabComponents] = useState({});

  // 탭 상태 저장
  const saveTabState = useCallback((tabId, state) => {
    setTabStates(prev => ({
      ...prev,
      [tabId]: state
    }));
  }, []);

  // 탭 상태 가져오기
  const getTabState = useCallback((tabId) => {
    return tabStates[tabId] || null;
  }, [tabStates]);

  // 탭 전환
  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // 탭 컴포넌트 등록
  const registerTabComponent = useCallback((tabId, component) => {
    setTabComponents(prev => ({
      ...prev,
      [tabId]: component
    }));
  }, []);

  // 탭 상태 초기화
  const clearTabState = useCallback((tabId) => {
    setTabStates(prev => {
      const newStates = { ...prev };
      delete newStates[tabId];
      return newStates;
    });
    setTabComponents(prev => {
      const newComponents = { ...prev };
      delete newComponents[tabId];
      return newComponents;
    });
  }, []);

  // 모든 탭 상태 초기화
  const clearAllTabStates = useCallback(() => {
    setTabStates({});
    setTabComponents({});
  }, []);

  const value = {
    tabStates,
    activeTab,
    tabComponents,
    saveTabState,
    getTabState,
    switchTab,
    registerTabComponent,
    clearTabState,
    clearAllTabStates
  };

  return (
    <TabStateContext.Provider value={value}>
      {children}
    </TabStateContext.Provider>
  );
};

export default TabStateContext;