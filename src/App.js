/**
 * App.js - 메인 애플리케이션 컴포넌트
 * 
 * 주요 기능:
 * 1. 전역 상태 관리 Provider 설정 (Auth, Menu, TabState)
 * 2. 라우팅 설정 (React Router v6)
 * 3. 동적 컴포넌트 로딩 (Code Splitting)
 * 4. 전역 알림 설정 (React Toastify)
 */

import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { TabStateProvider } from './context/TabStateContext';
import Layout from './components/layout/Layout';
import Login from './components/login/Login';
import Modal from './components/common/Modal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MySpinner from './components/common/MySpinner';

/**
 * DynamicRouteComponent - 동적 라우트 컴포넌트 로더
 * 
 * URL 경로에 따라 해당하는 컴포넌트를 동적으로 import하여 렌더링합니다.
 * Code Splitting을 통해 초기 로딩 속도를 개선합니다.
 * 
 * 처리 흐름:
 * 1. URL 경로 감지
 * 2. 해당 경로의 컴포넌트를 동적 import
 * 3. 로딩 중 스피너 표시
 * 4. 로드 실패 시 에러 모달 표시 및 대시보드로 리다이렉트
 */
const DynamicRouteComponent = () => {
  const [Component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setIsLoading(true);
        setShowModal(false);
        setComponent(null);
        
        const path = location.pathname.slice(1) || 'dashboard';
        
        // Layout 컴포넌트에서 직접 처리하는 경로들 (빈 컴포넌트 반환)
        if (path === 'surplus' || path === 'event') {
          setComponent(() => () => null);
          return;
        }
        
        let module;

        // 경로별 컴포넌트 매핑 및 동적 import
        if (path === 'dashboard') {
          // dashboard는 Layout에서 처리
          setComponent(() => () => null);
          return;
        } else if (path === 'cart') {
          module = await import('./components/cart/Cart');
        } else if (path === 'CUST0010' || path === 'CUST/CUST0010') {
          module = await import('./components/CUST/CUST0010');
        } else if (path === 'CUST0020' || path === 'CUST/CUST0020') {
          module = await import('./components/CUST/CUST0020');
        } else if (path === 'CUST0040' || path === 'CUST/CUST0040') {
          module = await import('./components/CUST/CUST0040');
        } else if (path === 'CUST0060' || path === 'CUST/CUST0060') {
          module = await import('./components/CUST/CUST0060');
        } else {
          // 일반적인 경로에 대한 동적 import 시도
          try {
            module = await import(`./components/${path}`);
          } catch (firstError) {
            try {
              // 소문자로 변환하여 재시도
              module = await import(`./components/${path.toLowerCase()}`);
            } catch (secondError) {
              // 폴더 구조가 있는 경로 처리
              if (path.includes('/')) {
                const [folder, component] = path.split('/');
                if (folder === 'CUST') {
                  module = await import(`./components/CUST/${component}`);
                } else {
                  throw secondError;
                }
              } else {
                throw secondError;
              }
            }
          }
        }
        
        // 컴포넌트 설정
        if (module && module.default) {
          setComponent(() => module.default);
        } else {
          throw new Error('Component not found or invalid export');
        }
      } catch (err) {
        // 컴포넌트 로드 실패 시 에러 처리
        setShowModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, [location.pathname]);

  // 로딩 중 스피너 표시
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        minHeight: '400px'
      }}>
        <MySpinner />
      </div>
    );
  }
  
  // 에러 발생 시 모달 표시
  if (showModal) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>페이지를 불러오는 중입니다...</h3>
        <Modal
          isOpen={showModal}
          title="안내"
          message="요청하신 페이지를 찾을 수 없거나 준비 중입니다. 대시보드로 이동하시겠습니까?"
          onConfirm={() => {
            setShowModal(false);
            navigate('/dashboard');
          }}
          onCancel={() => {
            setShowModal(false);
          }}
        />
      </div>
    );
  }

  // 컴포넌트가 로드된 경우 렌더링
  if (Component) {
    return <Component key={location.pathname} />;
  }

  // Fallback UI
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h3>페이지를 불러올 수 없습니다.</h3>
      <button onClick={() => navigate('/dashboard')}>대시보드로 이동</button>
    </div>
  );
};

/**
 * App - 루트 애플리케이션 컴포넌트
 * 
 * 전역 Provider 및 라우팅 구조:
 * - AuthProvider: 사용자 인증 상태 관리
 * - MenuProvider: 메뉴 상태 관리
 * - TabStateProvider: 탭 상태 관리
 * - BrowserRouter: 클라이언트 사이드 라우팅
 * - ToastContainer: 전역 알림 메시지 표시
 */
function App() {
  return (
    <AuthProvider>
      <MenuProvider>
        <TabStateProvider>
          <BrowserRouter>
            <Routes>
              {/* 로그인 페이지 */}
              <Route path="/login" element={<Login />} />
              
              {/* 루트 경로는 대시보드로 리다이렉트 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 레이아웃이 적용되는 모든 경로 */}
              <Route path="/*" element={<Layout />}>
                <Route path="*" element={
                  <Suspense fallback={<div>로딩중...</div>}>
                    <DynamicRouteComponent />
                  </Suspense>
                } />
              </Route>
            </Routes>
            
            {/* 전역 Toast 알림 설정 */}
            <ToastContainer 
              position="top-center"
              autoClose={1500}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              toastStyle={{
                fontSize: '16px',
                minWidth: '350px',
                padding: '16px',
                fontWeight: '500'
              }}
            />
          </BrowserRouter>
        </TabStateProvider>
      </MenuProvider>
    </AuthProvider>
  );
}

export default App;
