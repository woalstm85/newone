// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [globalState, setGlobalState] = useState(() => {
    // localStorage에서 저장된 상태를 불러옴
    const savedState = localStorage.getItem('authState');
    return savedState ? JSON.parse(savedState) : {
      G_USER_ID: '',
      G_CUST_NM: '',
      G_CUST_S_NM: '',
      G_COMPID: '',
    };
  });

  // 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('authState', JSON.stringify(globalState));
  }, [globalState]);

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
    localStorage.removeItem('authState');  // localStorage의 데이터도 삭제
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