// src/components/layout/UserInfo.js
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
