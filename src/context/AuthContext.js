// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [globalState, setGlobalState] = useState(() => {
    // 기존 localStorage에 있는 authState 삭제 (이전 버전 정리)
    localStorage.removeItem('authState');
    
    // sessionStorage에서 저장된 상태를 불러옴 (브라우저 창 닫으면 삭제됨)
    const savedState = sessionStorage.getItem('authState');
    return savedState ? JSON.parse(savedState) : {
      G_USER_ID: '',
      G_CUST_NM: '',
      G_CUST_S_NM: '',
      G_COMPID: '',
    };
  });

  // 상태가 변경될 때마다 sessionStorage에 저장 (브라우저 창 닫으면 삭제됨)
  useEffect(() => {
    sessionStorage.setItem('authState', JSON.stringify(globalState));
  }, [globalState]);

  // 브라우저 창 닫기 이벤트 처리
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 브라우저 창을 닫을 때 sessionStorage 지우기
      sessionStorage.removeItem('authState');
    };

    // 브라우저 창 닫기 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const updateGlobalState = (newState) => {
    setGlobalState(newState);
  };

  const clearGlobalState = () => {
    setGlobalState({
      G_USER_ID: '',
      G_CUST_NM: '',
      G_CUST_S_NM: '',
      G_COMPID: '',

    });
    sessionStorage.removeItem('authState');  // sessionStorage의 데이터도 삭제
  };

  return (
    <AuthContext.Provider value={{ globalState, updateGlobalState, clearGlobalState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}