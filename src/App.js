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


// ✨ DynamicRouteComponent 수정
const DynamicRouteComponent = () => {
  const [Component, setComponent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // ✨ useNavigate 훅 사용

  useEffect(() => {
    // ✨ 루트 경로('/')일 경우 '/dashboard'로 리디렉션
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
      return;
    }

    const loadComponent = async () => {
      setComponent(null); // 경로 변경 시 컴포넌트 초기화
      try {
        const path = location.pathname.slice(1);
        let module;

        console.log('최습 Loading component for path:', path);

        // ✨ 경로별 특별 처리 - 상세 매핑
        if (path === 'dashboard') {
          module = await import('./components/dashboard/DASHBOARD');
        } else if (path === 'CUST0010' || path === 'CUST/CUST0010') {
          module = await import('./components/CUST/CUST0010');
        } else if (path === 'CUST0020' || path === 'CUST/CUST0020') {
          module = await import('./components/CUST/CUST0020');
        } else {
          // 기존 동적 임포트 로직 - 여러 방식 시도
          try {
            // 첫 번째 시도: 정확한 경로
            module = await import(
              /* webpackChunkName: "[request]" */
              `./components/${path}`
            );
          } catch (firstError) {
            try {
              // 두 번째 시도: 소문자로 변환
              module = await import(
                /* webpackChunkName: "[request]" */
                `./components/${path.toLowerCase()}`
              );
            } catch (secondError) {
              // 세 번째 시도: CUST 폴더 내 컴포넌트인지 확인
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
        
        if (module && module.default) {
          setComponent(() => module.default);
        } else {
          throw new Error('Component not found or invalid export');
        }
      } catch (err) {
        console.error('🔴 Component load error for path:', location.pathname, err);
        // 준비 중인 페이지가 아닐 경우에만 모달 표시
        setShowModal(true);
      }
    };

    loadComponent();
  }, [location.pathname, navigate]);

  // 로딩 중 표시
   if (!Component) return <MySpinner />;
  
  return (
    <>
      <Component key={location.pathname} />
      <Modal
        isOpen={showModal}
        title="안내"
        message="요청하신 페이지를 찾을 수 없거나 준비 중입니다."
        onConfirm={() => {
          setShowModal(false);
          navigate('/dashboard'); // 모달 확인 시 대시보드로 이동
        }}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <MenuProvider>
        <TabStateProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* ✨ Layout 라우트 구조를 Outlet을 사용하도록 변경 */}
            <Route path="/*" element={<Layout />}>
              <Route path="*" element={
                <Suspense fallback={<div>로딩중...</div>}>
                  <DynamicRouteComponent />
                </Suspense>
              } />
            </Route>
            </Routes>
            {/* ToastContainer 추가 */}
            <ToastContainer 
              position="top-center"
              autoClose={500}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </BrowserRouter>
        </TabStateProvider>
      </MenuProvider>
    </AuthProvider>
  );
}

export default App;