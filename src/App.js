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

// ✨ DynamicRouteComponent 수정 - 로그인 체크 제거
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
        
        // Layout에서 처리하는 경로들은 빈 컴포넌트 반환
        if (path === 'surplus' || path === 'event') {
          setComponent(() => () => null); // 빈 컴포넌트
          return;
        }
        
        let module;

        // ✨ 경로별 특별 처리 - 상세 매핑
        if (path === 'dashboard') {
          // dashboard는 Layout에서 처리하므로 빈 컴포넌트
          setComponent(() => () => null);
          return;
        } else if (path === 'cart') {
          module = await import('./components/cart/Cart');
        } else if (path === 'CUST0010' || path === 'CUST/CUST0010') {
          module = await import('./components/CUST/CUST0010');
        } else if (path === 'CUST0020' || path === 'CUST/CUST0020') {
          module = await import('./components/CUST/CUST0020');
        } else {
          // 기존 동적 임포트 로직 - 여러 방식 시도
          try {
            module = await import(`./components/${path}`);
          } catch (firstError) {
            try {
              module = await import(`./components/${path.toLowerCase()}`);
            } catch (secondError) {
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
        setShowModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, [location.pathname]);

  // 로딩 중 표시
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

  // 컴포넌트가 있는 경우 렌더링
  if (Component) {
    return <Component key={location.pathname} />;
  }

  // fallback
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h3>페이지를 불러올 수 없습니다.</h3>
      <button onClick={() => navigate('/dashboard')}>대시보드로 이동</button>
    </div>
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
              {/* 루트 경로 리디렉션 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* ✨ Layout 라우트 - 로그인 체크 없이 모든 경로 허용 */}
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