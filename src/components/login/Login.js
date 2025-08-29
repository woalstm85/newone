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
// Login.js
const handleLogin = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  try {
    // 1. API 엔드포인트 URL을 새 형식에 맞게 변경합니다.
    // 아이디와 비밀번호가 URL 경로에 포함됩니다.
      const response = await fetch(`/Comm/login/${id.trim()}/${password}`, {

      method: 'POST',
      headers: {
        // 'Content-Type'은 더 이상 필요 없지만, 어떤 응답을 원하는지 명시하는 'Accept' 헤더를 추가할 수 있습니다.
        'Accept': 'application/json',
      },
      // 2. 요청 본문(body)은 새 API에서 사용하지 않으므로 제거합니다.
    });

    const data = await response.json();

    if (response.ok && data.logResult === 'S') { // 로그인 성공 여부도 확인하는 것이 좋습니다.
      // 3. 전역 상태 업데이트 시, 새 API의 응답 본문 키(key)에 맞춰 수정합니다.
      updateGlobalState({
        G_USER_ID: data.userId,      // data.userId로 변경
        G_CUST_NM: data.custNm,      // data.custNm으로 변경
        G_CUST_S_NM: data.custSNm,   // data.custSNm으로 변경
        G_COMPID: data.compId,       // data.compId로 변경
      });

      navigate('/'); // 메인 화면으로 이동

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