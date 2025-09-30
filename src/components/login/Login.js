/**
 * Login.js - 로그인 컴포넌트
 * 
 * 주요 기능:
 * 1. 사용자 인증 (아이디/비밀번호)
 * 2. 아이디 저장 기능 (localStorage)
 * 3. 폼 유효성 검증
 * 4. 로그인 성공 시 전역 상태 업데이트 및 메인 화면 이동
 * 5. 커스텀 훅(useAuthApi) 사용
 * 
 * 로그인 프로세스:
 * 1. 사용자가 아이디/비밀번호 입력
 * 2. 폼 유효성 검증
 * 3. useAuthApi 훅을 통한 로그인 API 호출
 * 4. 성공 시:
 *    - 아이디 저장 처리 (선택 시)
 *    - AuthContext에 사용자 정보 저장
 *    - 인증 토큰 저장 (제공되는 경우)
 *    - 메인 화면으로 이동
 * 5. 실패 시: 에러 메시지 표시
 * 
 * 저장되는 사용자 정보:
 * - G_USER_ID: 사용자 ID
 * - G_CUST_NM: 고객명 (전체)
 * - G_CUST_S_NM: 고객명 (약칭)
 * - G_COMPID: 회사 ID
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthApi } from '../../hooks';
import './Login.css';

function Login() {
  // ========== 상태 관리 ==========
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUserId, setRememberUserId] = useState(false);
  const [errors, setErrors] = useState({
    id: '',
    password: ''
  });

  const navigate = useNavigate();
  const { updateGlobalState } = useAuth();
  const { login, loading, error } = useAuthApi();

  /**
   * 컴포넌트 마운트 시 저장된 아이디 불러오기
   * localStorage에서 'savedUserId'와 'rememberUserId' 확인
   */
  useEffect(() => {
    const savedUserId = localStorage.getItem('savedUserId');
    const isRememberChecked = localStorage.getItem('rememberUserId') === 'true';
    
    if (savedUserId && isRememberChecked) {
      setId(savedUserId);
      setRememberUserId(true);
    }
  }, []);

  /**
   * 폼 유효성 검증
   * 
   * @returns {boolean} 유효성 검증 통과 여부
   */
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

  /**
   * 로그인 처리
   * useAuthApi 커스텀 훅을 사용한 인증
   * 
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleLogin = async (e) => {
    e.preventDefault();

    // 유효성 검증
    if (!validateForm()) {
      return;
    }

    try {
      // 커스텀 훅의 login 함수 호출
      const data = await login(id, password);

      if (data.logResult === 'S') {
        // ===== 로그인 성공 =====
        
        // 아이디 저장 처리
        if (rememberUserId) {
          localStorage.setItem('savedUserId', id);
          localStorage.setItem('rememberUserId', 'true');
        } else {
          localStorage.removeItem('savedUserId');
          localStorage.removeItem('rememberUserId');
        }
        
        // 전역 상태에 사용자 정보 저장
        updateGlobalState({
          G_USER_ID: data.userId,
          G_CUST_NM: data.custNm,
          G_CUST_S_NM: data.custSNm,
          G_COMPID: data.compId,
        });

        // 인증 토큰 저장 (API에서 제공하는 경우)
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        // 메인 화면으로 이동
        navigate('/');
      } else {
        // ===== 로그인 실패 =====
        setErrors({
          id: '아이디 또는 비밀번호가 올바르지 않습니다.',
          password: ' '
        });
      }
    } catch (error) {
      // API 호출 중 에러 발생
      setErrors({
        id: '로그인 처리 중 오류가 발생했습니다.',
        password: ' '
      });
    }
  };

  /**
   * 입력 필드 변경 핸들러
   * 입력 시 해당 필드의 에러 메시지 초기화
   * 
   * @param {Event} e - 입력 이벤트
   * @param {Function} setter - 상태 업데이트 함수
   */
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
        {/* 왼쪽 이미지 섹션 */}
        <div className="login-image-section">
          <img src="/images/login_img.png" alt="SteppingStone Logo" />
        </div>
        
        {/* 오른쪽 로그인 폼 섹션 */}
        <div className="login-form-section">
          <div className="login-box">
            <div className="title-text">ADMINISTRATOR</div>
            <h1 className="login-heading">LOGIN</h1>
            
            <form onSubmit={handleLogin}>
              {/* 아이디 입력 */}
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

              {/* 비밀번호 입력 */}
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
              
              {/* 로그인 버튼 */}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'LOGIN 중...' : 'LOGIN'} <span>→</span>
              </button>
            </form>
            
            {/* 저작권 표시 */}
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
