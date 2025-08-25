// src/components/login/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    id: '',
    password: ''
  });
  const navigate = useNavigate();
  const { updateGlobalState } = useAuth();

  const validateForm = () => {
    const newErrors = {
      id: '',
      password: ''
    };
    
    if (!id.trim()) {
      newErrors.id = '아이디를 입력해주세요.';
    }
    
    if (!password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return !newErrors.id && !newErrors.password;
  };

// Login.js
const handleLogin = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {      
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id.trim(),
        password: password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      // 전역 상태 업데이트
      updateGlobalState({
        G_USER_ID: id.trim(),  // 로그인 ID 저장
        G_CUST_NM: data.CUST_NM,
        G_CUST_S_NM: data.CUST_S_NM,
        G_COMPID: data.COMPID,
      });
      
      navigate('/'); // 바로 메인 화면으로
      
    } else {
      setErrors({
        id: '아이디 또는 비밀번호가 올바르지 않습니다.',
        password: ' '
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('로그인 처리 중 오류가 발생했습니다.');
  }
};
  // 입력 필드 변경시 해당 필드의 에러 메시지 초기화
  const handleInputChange = (e, setter) => {
    setter(e.target.value);
    setErrors(prev => ({
      ...prev,
      [e.target.name]: ''
    }));
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-image-section">
          <img src="/images/login_img.png" alt="SteppingStone Logo" />
        </div>
        
        <div className="login-form-section">
          <div className="login-box">
            <div className="title-text">ADMINISTRATOR</div>
            <h1 className="login-heading">LOGIN</h1>
            
            <form onSubmit={handleLogin}>
              <div className="input-field">
                <input
                  type="text"
                  name="id"
                  placeholder="ID"
                  value={id}
                  onChange={(e) => handleInputChange(e, setId)}
                />
                {errors.id && <span className="error-message">{errors.id}</span>}
              </div>
              <div className="input-field">
                <input
                  type="password"
                  name="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => handleInputChange(e, setPassword)}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              <button type="submit" className="login-button">
                LOGIN <span>→</span>
              </button>
            </form>
            
            <div className="copyright">
              © 2025 STEPPINGSTONE SYSTEM ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;