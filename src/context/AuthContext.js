/**
 * AuthContext.js - 사용자 인증 상태 관리
 * 
 * 주요 기능:
 * 1. 사용자 로그인 정보 전역 상태 관리
 * 2. sessionStorage를 통한 세션 내 인증 상태 유지 (브라우저 닫으면 로그아웃)
 * 3. 로그아웃 시 상태 초기화
 * 
 * 관리되는 상태:
 * - G_USER_ID: 사용자 ID
 * - G_CUST_CD: 거래처 코드
 * - G_CUST_NM: 고객명 (전체)
 * - G_CUST_S_NM: 고객명 (약칭)
 * - G_COMPID: 회사 ID
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Context 생성
const AuthContext = createContext();

/**
 * AuthProvider - 인증 상태 제공자
 * 
 * @param {ReactNode} children - 하위 컴포넌트
 */
export function AuthProvider({ children }) {
  // sessionStorage에서 저장된 인증 상태 복원 (초기값 설정)
  const [globalState, setGlobalState] = useState(() => {
    const savedState = sessionStorage.getItem('authState');
    return savedState ? JSON.parse(savedState) : {
      G_USER_ID: '',
      G_CUST_CD: '',
      G_CUST_NM: '',
      G_CUST_S_NM: '',
      G_COMPID: '',
    };
  });

  // 상태가 변경될 때마다 sessionStorage에 자동 저장
  useEffect(() => {
    sessionStorage.setItem('authState', JSON.stringify(globalState));
  }, [globalState]);

  /**
   * 인증 상태 업데이트
   * @param {Object} newState - 새로운 인증 상태
   */
  const updateGlobalState = (newState) => {
    setGlobalState(newState);
  };

  /**
   * 인증 상태 초기화 (로그아웃)
   * sessionStorage에서도 완전히 제거
   */
  const clearGlobalState = () => {
    setGlobalState({
      G_USER_ID: '',
      G_CUST_CD: '',
      G_CUST_NM: '',
      G_CUST_S_NM: '',
      G_COMPID: '',
    });
    sessionStorage.removeItem('authState');
  };

  return (
    <AuthContext.Provider value={{ globalState, updateGlobalState, clearGlobalState }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - 인증 상태 접근 훅
 * 
 * @returns {Object} { globalState, updateGlobalState, clearGlobalState }
 * 
 * 사용 예:
 * const { globalState, updateGlobalState } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}
