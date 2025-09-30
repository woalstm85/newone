/**
 * TabStateContext.js - 탭 상태 관리
 * 
 * 주요 기능:
 * 1. 다중 탭 환경에서 각 탭의 상태 독립적으로 관리
 * 2. 탭 전환 시 이전 상태 유지 (검색 조건, 페이지 번호 등)
 * 3. 탭별 컴포넌트 인스턴스 관리
 * 
 * 사용 시나리오:
 * - 사용자가 여러 화면을 탭으로 열어놓고 전환하면서 작업
 * - 각 탭의 검색 조건, 스크롤 위치, 입력 값 등을 유지
 * - 탭을 닫을 때 해당 탭의 상태 정리
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Context 생성
const TabStateContext = createContext();

/**
 * useTabState - 탭 상태 접근 훅
 * 
 * @returns {Object} 탭 관련 상태 및 함수
 * @throws {Error} TabStateProvider 외부에서 사용 시 에러 발생
 * 
 * 사용 예:
 * const { saveTabState, getTabState, switchTab } = useTabState();
 */
export const useTabState = () => {
  const context = useContext(TabStateContext);
  if (!context) {
    throw new Error('useTabState must be used within a TabStateProvider');
  }
  return context;
};

/**
 * TabStateProvider - 탭 상태 제공자
 * 
 * @param {ReactNode} children - 하위 컴포넌트
 */
export const TabStateProvider = ({ children }) => {
  // 각 탭의 상태를 저장하는 객체 { tabId: state }
  const [tabStates, setTabStates] = useState({});
  
  // 현재 활성화된 탭 ID
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  
  // 각 탭의 컴포넌트 인스턴스를 유지 { tabId: component }
  const [tabComponents, setTabComponents] = useState({});

  /**
   * 탭의 상태를 저장
   * 
   * @param {string} tabId - 탭 ID
   * @param {Object} state - 저장할 상태 객체
   * 
   * 사용 예:
   * saveTabState('CUST0010', { searchKeyword: '검색어', page: 1 });
   */
  const saveTabState = useCallback((tabId, state) => {
    setTabStates(prev => ({
      ...prev,
      [tabId]: state
    }));
  }, []);

  /**
   * 탭의 저장된 상태를 가져오기
   * 
   * @param {string} tabId - 탭 ID
   * @returns {Object|null} 저장된 상태 또는 null
   */
  const getTabState = useCallback((tabId) => {
    return tabStates[tabId] || null;
  }, [tabStates]);

  /**
   * 탭 전환
   * 
   * @param {string} tabId - 전환할 탭 ID
   */
  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  /**
   * 탭 컴포넌트 인스턴스 등록
   * 
   * @param {string} tabId - 탭 ID
   * @param {React.Component} component - 컴포넌트 인스턴스
   */
  const registerTabComponent = useCallback((tabId, component) => {
    setTabComponents(prev => ({
      ...prev,
      [tabId]: component
    }));
  }, []);

  /**
   * 특정 탭의 상태 및 컴포넌트 초기화 (탭 닫기)
   * 
   * @param {string} tabId - 초기화할 탭 ID
   */
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

  /**
   * 모든 탭의 상태 초기화 (로그아웃 시 사용)
   */
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
