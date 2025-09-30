/**
 * UserInfo.js - 사용자 정보 표시 컴포넌트
 * 
 * 주요 기능:
 * 1. 로그인한 사용자 정보 표시
 * 2. 상단바에서 사용되는 간단한 사용자 환영 메시지
 * 
 * 표시 정보:
 * - 사용자 아이콘
 * - 고객명 (G_CUST_NM)
 * - "님 환영합니다" 메시지
 * 
 * 사용 위치:
 * - Layout 컴포넌트의 상단바 (로그인 상태일 때)
 */

import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function UserInfo() {
  const { globalState } = useAuth();

  return (
    <div className="user-info">
      <User className="user-icon" />
      <span className="welcome-text">
        {globalState.G_CUST_NM}님 환영합니다
      </span>
    </div>
  );
}

export default UserInfo;
