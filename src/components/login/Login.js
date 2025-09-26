import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthApi } from '../../hooks'; // 커스텀 훅 사용
import './Login.css';

function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUserId, setRememberUserId] = useState(false); // 아이디 저장 체크박스 상태
  const [errors, setErrors] = useState({
    id: '',
    password: ''
  });
  const navigate = useNavigate();
  const { updateGlobalState } = useAuth();
  const { login, loading, error } = useAuthApi(); // 커스텀 훅 사용

  // 컴포넌트 마운트 시 저장된 아이디 불러오기
  useEffect(() => {
    const savedUserId = localStorage.getItem('savedUserId');
    const isRememberChecked = localStorage.getItem('rememberUserId') === 'true';
    
    if (savedUserId && isRememberChecked) {
      setId(savedUserId);
      setRememberUserId(true);
    }
  }, []);

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

  // 커스텀 훅을 사용한 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // 커스텀 훅의 login 함수 사용
      const data = await login(id, password);

      if (data.logResult === 'S') {
        // 아이디 저장 처리
        if (rememberUserId) {
          localStorage.setItem('savedUserId', id);
          localStorage.setItem('rememberUserId', 'true');
        } else {
          localStorage.removeItem('savedUserId');
          localStorage.removeItem('rememberUserId');
        }
        
        // 로그인 성공
        updateGlobalState({
          G_USER_ID: data.userId,
          G_CUST_NM: data.custNm,
          G_CUST_S_NM: data.custSNm,
          G_COMPID: data.compId,
        });

        // 인증 토큰 저장 (API에서 토큰을 제공하는 경우)
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        navigate('/'); // 메인 화면으로 이동
      } else {
        setErrors({
          id: '아이디 또는 비밀번호가 올바르지 않습니다.',
          password: ' '
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        id: '로그인 처리 중 오류가 발생했습니다.',
        password: ' '
      });
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
                  disabled={loading}
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
                  disabled={loading}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              {/* 아이디 저장 체크박스 */}
              <div className="remember-userid-section">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberUserId}
                    onChange={(e) => setRememberUserId(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  아이디 저장
                </label>
              </div>
              
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'LOGIN 중...' : 'LOGIN'} <span>→</span>
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
